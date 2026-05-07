export interface User {
  id: number
  email: string
  username: string
  role: 'admin' | 'seller'
}

export interface SellerProfile {
  id: number
  seller_id: string
  full_name: string
  business_name: string
  profile_pic_url: string
  bio: string
  phone: string
  whatsapp: string
  country: string
  city: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  seller_tier: number | null
  created_at: string
}

export interface Product {
  id: number
  product_code: string
  name_ar: string
  name_en: string
  price: string
  status: string
  created_at: string
  images: ProductImage[]
  variants: ProductVariant[]
}

export interface ProductImage {
  id: number
  image_url: string
  is_primary: boolean
  order: number
}

export interface ProductVariant {
  id: number
  color: string
  size: string
  sku: string
  external_barcode: string
  quantity_submitted: number
}

export interface SellerStatement {
  id: number
  period_start: string
  period_end: string
  total_sales: string
  net_amount: string
  status: 'draft' | 'sent' | 'paid'
}