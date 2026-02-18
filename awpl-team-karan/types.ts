
export interface Product {
  id: number;
  name: string;
  mrp: number;
  dp: number;
  sp: number;
  quantityInfo: string;
}

export interface CartItem extends Product {
  selectedQuantity: number;
}

export interface Totals {
  totalMRP: number;
  totalDP: number;
  totalSP: number;
  gap: number;
}
