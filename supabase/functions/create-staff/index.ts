// supabase/functions/create-staff/index.ts
//
// Deploy with: supabase functions deploy create-staff
//
// Called via supabase.functions.invoke('create-staff', { body: {...} }) from
// the app. Runs server-side with the service-role key, which is the only
// way to create auth.users rows — a normal signed-in client can never do
// this directly. Re-checks that the CALLER is an admin before doing anything,
// so this can't be abused even if someone finds the function URL.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client scoped to the caller's own JWT, used only to verify who is calling.
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can create staff accounts' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { phone, email, password, fullName, role } = await req.json();

    if (!phone || !email || !password) {
      return new Response(JSON.stringify({ error: 'phone, email, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Admin client with full privileges, used only for the actual creation.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'Could not create user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: insertProfileError } = await adminClient.from('profiles').insert({
      id: created.user.id,
      phone,
      full_name: fullName ?? null,
      role: role === 'admin' ? 'admin' : 'staff',
    });

    if (insertProfileError) {
      // Roll back the auth user so we don't leave an orphaned account.
      await adminClient.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: insertProfileError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, userId: created.user.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});