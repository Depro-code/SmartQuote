import type { Quotation, Settings } from '../../lib/types';
import { formatInvoiceCurrency } from './invoiceUtils';

interface InvoiceTableProps {
  quotation: Quotation;
  settings: Settings;
}

export function InvoiceTable({ quotation, settings }: InvoiceTableProps) {
  const rows = quotation.items.map((item, index) => ({ item, index }));
  const minRows = 12;
  const fillerRows = Math.max(0, minRows - rows.length);

  return (
    <section className="relative z-10 px-10 pt-2">
      <table className="w-full border-2 border-[#111827] border-collapse table-fixed">
        <thead>
          <tr className="bg-[#fef3c7]">
            <th className="w-[8%] border border-[#111827] px-2 py-2 text-[12px] font-bold text-center">S/N</th>
            <th className="w-[50%] border border-[#111827] px-2 py-2 text-[12px] font-bold text-left">DESCRIPTION</th>
            <th className="w-[10%] border border-[#111827] px-2 py-2 text-[12px] font-bold text-right">QTY</th>
            <th className="w-[16%] border border-[#111827] px-2 py-2 text-[12px] font-bold text-right">U.P</th>
            <th className="w-[16%] border border-[#111827] px-2 py-2 text-[12px] font-bold text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, index }) => (
            <tr key={`${item.productId}-${index}`} className="align-top">
              <td className="border border-[#111827] px-2 py-2 text-[12px] text-center">{index + 1}</td>
              <td className="border border-[#111827] px-2 py-2 text-[12px] text-left break-words whitespace-normal">
                {item.nameSnapshot}
              </td>
              <td className="border border-[#111827] px-2 py-2 text-[12px] text-right">{item.quantity}</td>
              <td className="border border-[#111827] px-2 py-2 text-[12px] text-right">
                {formatInvoiceCurrency(item.unitPriceSnapshot, settings.currency)}
              </td>
              <td className="border border-[#111827] px-2 py-2 text-[12px] text-right">
                {formatInvoiceCurrency(item.lineTotal, settings.currency)}
              </td>
            </tr>
          ))}
          {Array.from({ length: fillerRows }).map((_, idx) => (
            <tr key={`filler-${idx}`} className="h-[34px]">
              <td className="border border-[#111827]" />
              <td className="border border-[#111827]" />
              <td className="border border-[#111827]" />
              <td className="border border-[#111827]" />
              <td className="border border-[#111827]" />
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
