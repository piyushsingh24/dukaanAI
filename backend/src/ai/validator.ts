import { prisma } from '../config/database';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  customerId?: string;
  matchedProducts: { name: string; productId: string; available: boolean; stock: number; price: number }[];
}

export async function validateBusinessData(
  merchantId: string,
  customerPhone: string | undefined,
  extractedProducts: { name: string; quantity: string }[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const matchedProducts: ValidationResult['matchedProducts'] = [];

  let customerId: string | undefined;

  if (customerPhone) {
    const customer = await prisma.customer.findFirst({
      where: { merchantId, phone: customerPhone },
    });
    if (customer) {
      customerId = customer.id;
    } else {
      warnings.push('New customer detected. Create profile?');
    }
  }

  const merchantProducts = await prisma.product.findMany({
    where: { merchantId, isActive: true },
    include: { inventory: true },
  });

  for (const extracted of extractedProducts) {
    const name = extracted.name.toLowerCase();
    const match = merchantProducts.find(
      (p) =>
        p.productName.toLowerCase().includes(name) ||
        name.includes(p.productName.toLowerCase())
    );

    if (match) {
      const stock = match.inventory?.currentStock ?? 0;
      const qty = parseFloat(extracted.quantity) || 1;

      matchedProducts.push({
        name: match.productName,
        productId: match.id,
        available: stock >= qty,
        stock,
        price: match.sellingPrice,
      });

      if (stock < qty) {
        errors.push(`Insufficient stock for ${match.productName}: only ${stock} ${match.unit} available`);
      }
    } else {
      warnings.push(`Product "${extracted.name}" not found in catalog`);
    }
  }

  if (matchedProducts.length === 0 && extractedProducts.length > 0) {
    errors.push('No products could be matched in your catalog');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    customerId,
    matchedProducts,
  };
}
