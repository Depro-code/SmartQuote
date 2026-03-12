import type { Quotation, Settings } from '../../lib/types';
import { formatInvoiceDate } from './invoiceUtils';

interface InvoiceHeaderProps {
  quotation: Quotation;
  settings: Settings;
}

export function InvoiceHeader({ quotation, settings }: InvoiceHeaderProps) {
  return (
    <header className="relative z-10 px-10 pt-9 pb-4">
      <div className="flex items-start justify-between gap-8">
        <div className="max-w-[62%]">
          <div className="flex items-start gap-4">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Company logo"
                className="h-16 w-16 object-contain bg-[#ffffff] border border-[#d1d5db]"
              />
            )}
            <div>
              <h1 className="text-[27px] font-black tracking-tight text-[#111827] uppercase leading-[1.05]">
                {settings.companyName}
              </h1>
              {settings.headerLine1 && <p className="mt-1 text-[12px] text-[#374151]">{settings.headerLine1}</p>}
              {settings.headerLine2 && <p className="text-[12px] text-[#374151]">{settings.headerLine2}</p>}
              {settings.headerLine3 && <p className="text-[12px] text-[#374151]">{settings.headerLine3}</p>}
              <p className="text-[12px] text-[#374151] mt-1.5">{settings.address}</p>
              <p className="text-[12px] text-[#374151]">
                {settings.phone} | {settings.email}
              </p>
            </div>
          </div>
        </div>

        <div className="w-[265px] border-2 border-[#111827] bg-[#ffffff]">
          <div className="bg-[#fef3c7] border-b-2 border-[#111827] px-4 py-2.5">
            <p className="text-[20px] font-extrabold text-[#111827] uppercase leading-none tracking-tight">
              {settings.invoiceTitle || 'Proforma Invoice'}
            </p>
          </div>
          <div className="px-4 py-2.5 space-y-1 text-[12px] text-[#1f2937]">
            <p>
              <span className="font-semibold">Invoice No:</span> {quotation.quoteNumber}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {formatInvoiceDate(quotation.issueDate)}
            </p>
            <p className="break-words">
              <span className="font-semibold">Client:</span> {quotation.customerName}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 border-2 border-[#111827]">
        <div className="grid grid-cols-[120px,1fr]">
          <div className="bg-[#f3f4f6] border-r-2 border-[#111827] px-3 py-1.5 text-[12px] font-bold text-[#111827]">
            BILL TO
          </div>
          <div className="px-3 py-1.5 text-[12px] text-[#1f2937]">
            {quotation.customerName}
            {quotation.customerPhone ? ` | ${quotation.customerPhone}` : ''}
            {quotation.customerEmail ? ` | ${quotation.customerEmail}` : ''}
          </div>
        </div>
      </div>
    </header>
  );
}
