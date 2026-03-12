import { forwardRef } from 'react';
import type { Quotation, Settings } from '../../lib/types';
import { amountToWords, formatInvoiceCurrency, formatInvoiceDate } from './invoiceUtils';

interface InvoicePrintTemplateProps {
  quotation: Quotation;
  settings: Settings;
}

export const InvoicePrintTemplate = forwardRef<HTMLDivElement, InvoicePrintTemplateProps>(
  function InvoicePrintTemplate({ quotation, settings }, ref) {
    const totals = [
      { label: 'Subtotal', value: quotation.subTotal },
      ...(quotation.discount && quotation.discount > 0
        ? [{ label: 'Discount', value: -quotation.discount }]
        : []),
      ...(quotation.taxAmount && quotation.taxAmount > 0
        ? [{ label: `Tax${quotation.taxRate ? ` (${quotation.taxRate}%)` : ''}`, value: quotation.taxAmount }]
        : []),
    ];

    return (
      <div
        ref={ref}
        className="mx-auto flex min-h-[1123px] w-full max-w-[794px] flex-col bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
      >
        <div className="h-3 w-full bg-slate-900" />

        <div className="flex flex-1 flex-col px-10 pb-10 pt-8">
          <header className="border-b border-slate-200 pb-8">
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-[58%]">
                <div className="flex items-start gap-4">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={`${settings.companyName} logo`}
                      className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold tracking-[0.24em] text-white">
                      {settings.companyName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                        Company Profile
                      </p>
                      <h1 className="mt-2 text-[30px] font-bold leading-none tracking-tight text-slate-950">
                        {settings.companyName}
                      </h1>
                    </div>
                    <div className="space-y-1 text-sm leading-6 text-slate-600">
                      {settings.headerLine1 && <p>{settings.headerLine1}</p>}
                      {settings.headerLine2 && <p>{settings.headerLine2}</p>}
                      {settings.headerLine3 && <p>{settings.headerLine3}</p>}
                      <p>{settings.address}</p>
                      <p>{settings.phone}</p>
                      <p>{settings.email}</p>
                      {settings.website && <p>{settings.website}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-[260px] rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  {settings.invoiceTitle || 'Quotation'}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">QUOTATION</h2>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Quote Number
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{quotation.quoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Date</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {formatInvoiceDate(quotation.issueDate)}
                    </p>
                  </div>
                  {quotation.validUntil && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Valid Until
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {formatInvoiceDate(quotation.validUntil)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-[1.2fr_0.8fr] gap-6">
              <section className="rounded-[24px] border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Prepared For</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {quotation.customerName}
                </h3>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  {quotation.customerPhone && <p>{quotation.customerPhone}</p>}
                  {quotation.customerEmail && <p>{quotation.customerEmail}</p>}
                  {!quotation.customerPhone && !quotation.customerEmail && (
                    <p>No additional client contact details provided.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] bg-slate-900 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Quotation Status</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{quotation.status}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  We appreciate the opportunity to provide this quotation. Please review the items below and contact us
                  if you need revisions or confirmation.
                </p>
              </section>
            </div>
          </header>

          <section className="pt-8">
            <div className="overflow-hidden rounded-[28px] border border-slate-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em]">
                      Item
                    </th>
                    <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em]">
                      Description
                    </th>
                    <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em]">
                      Qty
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em]">
                      Unit Price
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={`${item.productId}-${index}`} className="border-t border-slate-200 align-top">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{String(index + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">{item.nameSnapshot}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.unitSnapshot ? `Unit: ${item.unitSnapshot}` : 'Standard supplied item'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatInvoiceCurrency(item.unitPriceSnapshot, settings.currency)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatInvoiceCurrency(item.lineTotal, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid flex-1 grid-cols-[1.15fr_0.85fr] gap-6 pt-8">
            <div className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Amount In Words</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {amountToWords(quotation.grandTotal, settings.currency)}
                </p>
              </div>

              {quotation.notes && (
                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Notes</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{quotation.notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Summary</p>
              <div className="mt-5 space-y-4">
                {totals.map((entry) => (
                  <div key={entry.label} className="flex items-center justify-between gap-4 text-sm text-slate-600">
                    <span>{entry.label}</span>
                    <span className="font-semibold text-slate-900">
                      {entry.value < 0 ? '-' : ''}
                      {formatInvoiceCurrency(Math.abs(entry.value), settings.currency)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Grand Total</p>
                      <p className="mt-1 text-sm text-slate-500">Payable amount</p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-slate-950">
                      {formatInvoiceCurrency(quotation.grandTotal, settings.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-semibold uppercase tracking-[0.24em] text-slate-700">Thank you</p>
                <p className="mt-2 max-w-[420px] leading-6">
                  We remain available for any clarification and look forward to serving you.
                </p>
              </div>
              <div className="text-right">
                {settings.registrationNumber && <p>Reg No: {settings.registrationNumber}</p>}
                {settings.taxId && <p>Tax ID: {settings.taxId}</p>}
                {settings.footerNote && <p className="mt-2 max-w-[240px] leading-6">{settings.footerNote}</p>}
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  },
);
