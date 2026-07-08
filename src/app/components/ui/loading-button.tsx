import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from './button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from './utils';

type LoadingButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** True while the action triggered by this button is in flight. */
    isLoading?: boolean;
    /**
     * For icon-only buttons (size="icon"), the spinner replaces the icon
     * entirely rather than sitting next to text. Set this to true for
     * icon buttons so the layout doesn't shift.
     */
    iconOnly?: boolean;
  };

/**
 * Drop-in replacement for Button on any action that hits the network
 * (create/update/delete/confirm/etc). While isLoading is true, the button
 * is disabled and shows a spinner, so the user always has visible feedback
 * that their tap registered instead of wondering if it worked.
 *
 * Usage:
 *   const [isSaving, setIsSaving] = useState(false);
 *   const handleSave = async () => {
 *     setIsSaving(true);
 *     try { await service.save(...); } finally { setIsSaving(false); }
 *   };
 *   <LoadingButton isLoading={isSaving} onClick={handleSave}>Save</LoadingButton>
 */
function LoadingButton({
  isLoading = false,
  iconOnly = false,
  disabled,
  className,
  children,
  variant,
  size,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(className)}
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        iconOnly ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        )
      ) : (
        children
      )}
    </Button>
  );
}

export { LoadingButton };