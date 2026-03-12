import type { Quotation, Settings } from '../../lib/types';
import { amountToWords, formatInvoiceCurrency } from './invoiceUtils';

interface InvoiceTotalsProps {
  quotation: Quotation;
  settings: Settings;
}

export function InvoiceTotals({ quotation, settings }: InvoiceTotalsProps) {
  return (
    <section className="relative z-10 px-10 pt-3">
      <div className="ml-auto w-[360px] border-2 border-[#111827] bg-[#ffffff]">
        <div className="flex items-stretch border-b border-[#111827]">
          <p className="w-1/2 px-3 py-2 text-[12px] font-semibold text-[#374151] border-r border-[#111827]">Subtotal</p>
          <p className="w-1/2 px-3 py-2 text-[12px] text-right text-[#111827]">
            {formatInvoiceCurrency(quotation.subTotal, settings.currency)}
          </p>
        </div>
        <div className="flex items-stretch border-b border-[#111827]">
          <p className="w-1/2 px-3 py-2 text-[12px] font-semibold text-[#374151] border-r border-[#111827]">Tax</p>
          <p className="w-1/2 px-3 py-2 text-[12px] text-right text-[#111827]">
            {formatInvoiceCurrency(quotation.taxAmount || 0, settings.currency)}
          </p>
        </div>
        <div className="bg-[#fef3c7] flex items-stretch">
          <p className="w-1/2 px-3 py-3 text-[18px] font-extrabold text-[#111827] border-r border-[#111827]">TOTAL</p>
          <p className="w-1/2 px-3 py-3 text-right text-[26px] leading-none font-black text-[#111827]">
            {formatInvoiceCurrency(quotation.grandTotal, settings.currency)}
          </p>
        </div>
      </div>

      <div className="mt-2 border border-[#d1d5db] bg-[#f9fafb] px-4 py-2">
        <p className="text-[11px] font-semibold text-[#374151] uppercase">Amount in words</p>
        <p className="text-[12px] text-[#111827] mt-0.5">
          {amountToWords(quotation.grandTotal, settings.currency)}
        </p>
      </div>
    </section>
  );
}
