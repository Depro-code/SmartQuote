import { forwardRef, type CSSProperties } from 'react';
import type { Product } from '../../lib/types';

const productCardStyle: CSSProperties = {
  width: '960px',
  minHeight: '420px',
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 52%, #fdba74 100%)',
  border: '2px solid #f59e0b',
  borderRadius: '28px',
  overflow: 'hidden',
  color: '#111827',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

export const ProductShareCard = forwardRef<
  HTMLDivElement,
  { product: Product; formatCurrency: (amount: number) => string }
>(function ProductShareCard({ product, formatCurrency }, ref) {
  return (
    <div ref={ref} style={productCardStyle}>
      <div
        style={{
          background: '#fff7ed',
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '2px solid rgba(245, 158, 11, 0.35)',
        }}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            width: '100%',
            height: '320px',
            objectFit: 'cover',
            borderRadius: '22px',
            background: '#ffffff',
            border: '1px solid rgba(251, 191, 36, 0.45)',
          }}
        />
      </div>

      <div
        style={{
          padding: '34px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#92400e',
            }}
          >
            Amen-Cam Product Card
          </p>
          <h2
            style={{
              margin: '14px 0 0',
              fontSize: '36px',
              lineHeight: 1.05,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            {product.name}
          </h2>
          <p
            style={{
              margin: '18px 0 0',
              fontSize: '18px',
              lineHeight: 1.6,
              color: '#374151',
            }}
          >
            {product.description || 'Professional medical supply item available from Amen-Cam.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '16px',
          }}
        >
          <ProductMeta label="Price" value={formatCurrency(product.unitPrice)} />
          <ProductMeta label="Unit" value={product.unit || 'unit'} />
          <ProductMeta label="Category" value={product.category || 'General'} />
          <ProductMeta label="SKU" value={product.sku || 'N/A'} />
          <ProductMeta label="Stock" value={String(product.quantityInStock)} />
          <ProductMeta label="Brand" value={product.brand || 'Amen-Cam'} />
        </div>
      </div>
    </div>
  );
});

function ProductMeta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.62)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#92400e',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontSize: '20px',
          fontWeight: 800,
          color: '#111827',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
