export function InvoiceFooter() {
  return (
    <footer className="relative z-10 mt-auto px-10 pb-11 pt-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase text-[#374151]">Service Provider</p>
          <div className="mt-12 border-t border-[#6b7280]" />
        </div>

        <div className="text-center flex items-end justify-center">
          <p className="text-[13px] font-semibold text-[#374151]">Your Satisfaction Is Our First Priority</p>
        </div>

        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase text-[#374151]">Customer</p>
          <div className="mt-12 border-t border-[#6b7280]" />
        </div>
      </div>
    </footer>
  );
}
