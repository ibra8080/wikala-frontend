// Remove Arabic (and Arabic-presentation) characters — for non-Arabic fields
export const stripArabic = (s: string): string =>
  s.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')

// Keep ASCII only — for color/size (protects SKU/barcode + Shopify filters)
export const asciiOnly = (s: string): string =>
  s.replace(/[^\x00-\x7F]/g, '')