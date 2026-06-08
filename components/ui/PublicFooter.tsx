import Image from 'next/image'

const translations = {
  en: {
    tagline: 'The first e-commerce platform dedicated to authentic Egyptian-made products.',
    made: 'Made in Egypt — Sold in Europe',
    links: ['Dashboard', 'My Products', 'Inventory', 'Statements', 'Messages'],
    store: ['Shop', 'Categories', 'New Arrivals', 'Best Sellers'],
    contact: 'Bremen, Germany',
    site: 'wikala.shop',
  },
  ar: {
    tagline: 'أول منصة تجارة إلكترونية مخصصة للمنتجات المصرية الأصيلة.',
    made: 'صُنع في مصر — يُباع في أوروبا',
    links: ['لوحة التحكم', 'منتجاتي', 'المخزون', 'كشف الحساب', 'الرسائل'],
    store: ['المتجر', 'الأقسام', 'وصل حديثاً', 'الأكثر مبيعاً'],
    contact: 'بريمن، ألمانيا',
    site: 'wikala.shop',
  },
}

interface Props {
  lang: 'en' | 'ar'
}

export default function PublicFooter({ lang }: Props) {
  const t = translations[lang]
  return (
    <footer className="bg-[#1B2A4A] border-t border-white/10 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-4 gap-8">
        <div>
          <Image src="/wikala_Logo_W.svg" alt="Wikala" width={120} height={32} className="mb-2" />
          <p className="text-sm text-white/50 mt-3 leading-relaxed">{t.tagline}</p>
          <p className="text-xs text-[#C8952E] mt-3">{t.made}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">SELLER PORTAL</p>
          {t.links.map(l => (
            <p key={l} className="text-sm text-white/60 mb-2">{l}</p>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">OUR STORE</p>
          {t.store.map(l => (
            <p key={l} className="text-sm text-white/60 mb-2">{l}</p>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">CONTACT</p>
          <p className="text-sm text-white/60 mb-2">{t.contact}</p>
          <p className="text-sm text-white/60">{t.site}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">© 2026 Wikala. All rights reserved.</p>
      </div>
    </footer>
  )
}