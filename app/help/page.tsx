// app/help/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

const content = {
  en: {
    nav: { home: 'Home', login: 'Login', dashboard: 'Dashboard' },
    hero: {
      title: 'Help Center',
      subtitle: 'Everything you need to know about selling on Wikala.',
    },
    sections: [
      {
        id: 'getting-started',
        icon: '🚀',
        title: 'Getting Started',
        faqs: [
          {
            q: 'How do I register as a seller?',
            a: 'Click "Start Selling" on our homepage and fill in your business details. Our team will review your application within 3–5 business days and notify you by email.'
          },
          {
            q: 'What documents do I need?',
            a: 'You need a valid business registration, national ID, and bank account details. Additional certifications may be required depending on your product type.'
          },
          {
            q: 'How long does approval take?',
            a: 'Typically 3–5 business days. You\'ll receive an email with your Seller ID once approved.'
          },
          {
            q: 'Is there a registration fee?',
            a: 'Yes, a one-time registration fee of €39.90 applies when your account is approved. This keeps your account active as long as you\'re selling with us.'
          },
        ]
      },
      {
        id: 'products',
        icon: '📦',
        title: 'Products',
        faqs: [
          {
            q: 'How do I add a product?',
            a: 'Go to Products → Add New Product. Fill in the 4-step form: product info, images, technical specs (dimensions, weight), and packaging details with variants.'
          },
          {
            q: 'What happens after I submit a product?',
            a: 'Your product goes to "Pending Review". Our team reviews it within 2–3 business days. Once approved, you\'ll get a Product Code and can request shipment.'
          },
          {
            q: 'Can I edit my product after submission?',
            a: 'Yes, you can edit products in Draft or Rejected status. Once approved and in the shipment process, limited edits are available through your Product Profile page.'
          },
          {
            q: 'What are product listing fees?',
            a: 'After the first free month, each product costs €2/month. The first 4 variants per product are free. Each additional variant costs €0.50/month.'
          },
        ]
      },
      {
        id: 'shipment',
        icon: '🚢',
        title: 'Shipment & Logistics',
        faqs: [
          {
            q: 'How do I ship my products to Germany?',
            a: 'Once your product is approved, go to Inventory → New Shipment Request. Select your products, choose delivery method, and submit. Wikala will confirm a delivery date.'
          },
          {
            q: 'What delivery methods are available?',
            a: 'You can choose: Pickup by Wikala (we come to you), Courier (you arrange delivery), or Drop Off at Wikala warehouse in Egypt.'
          },
          {
            q: 'How long does shipping take?',
            a: 'Typically 2–4 weeks from Egypt to our Germany warehouse, including customs clearance.'
          },
          {
            q: 'How is shipping cost calculated?',
            a: 'Shipping is charged per shipment based on chargeable weight — the higher of actual weight vs volumetric weight (L×W×H÷5000). Rate is confirmed per shipment.'
          },
        ]
      },
      {
        id: 'costs',
        icon: '💰',
        title: 'Costs & Statements',
        faqs: [
          {
            q: 'How are storage fees calculated?',
            a: 'Storage = €25 × (carton volume in m³ × 1.15) × quantity in Germany × months stored. The 1.15 factor accounts for buffer space in the warehouse.'
          },
          {
            q: 'What is Wikala\'s commission?',
            a: 'Wikala charges 15% of the selling price per unit sold. Additionally, €1 per unit is charged for pick & pack (order preparation and packaging).'
          },
          {
            q: 'What is VAT and how is it handled?',
            a: 'German VAT of 19% is applied to all sales. Wikala manages VAT collection and filing on your behalf. VAT is deducted from the selling price in your statement.'
          },
          {
            q: 'When do I receive my statement?',
            a: 'Monthly statements are issued by Wikala\'s accounting team at the end of each month. You\'ll be notified when a statement is ready. Statements show draft status until sent to you officially.'
          },
          {
            q: 'How is my profit calculated?',
            a: 'Profit = Selling Price − Production Cost − Storage Fee − Wikala Commission (15%) − Pick & Pack (€1) − Shipping Fee − VAT (19%). See our Pricing page for a detailed example.'
          },
        ]
      },
      {
        id: 'issues',
        icon: '⚠️',
        title: 'Common Issues',
        faqs: [
          {
            q: 'My product was rejected. What do I do?',
            a: 'Check the rejection reason in your Product Profile. Common reasons: missing dimensions, unclear images, or incomplete description. Edit and resubmit.'
          },
          {
            q: 'There\'s an issue with my shipment. Who do I contact?',
            a: 'Go to Inventory → Shipment Requests and check if Wikala has flagged an issue. Then go to Messages and open a new support ticket with your shipment number.'
          },
          {
            q: 'I disagree with a charge in my statement.',
            a: 'Contact us via Messages → Support Tickets with your statement details. Our team will review and respond within 2 business days.'
          },
          {
            q: 'How do I apply a discount code?',
            a: 'Go to Statements → Web Services tab. Enter your code in the Discount Code field and click Apply.'
          },
        ]
      },
    ],
    contact: {
      title: 'Still need help?',
      desc: 'Send us a message through your dashboard and our team will get back to you.',
      btn: 'Open Support Ticket',
    }
  },
  ar: {
    nav: { home: 'الرئيسية', login: 'تسجيل الدخول', dashboard: 'لوحة التحكم' },
    hero: {
      title: 'مركز المساعدة',
      subtitle: 'كل ما تحتاج معرفته عن البيع على وكالة.',
    },
    sections: [
      {
        id: 'getting-started',
        icon: '🚀',
        title: 'البدء',
        faqs: [
          {
            q: 'كيف أسجل كبائع؟',
            a: 'انقر على "ابدأ البيع" في صفحتنا الرئيسية وأدخل بيانات نشاطك التجاري. سيراجع فريقنا طلبك خلال 3–5 أيام عمل وسيُخطرك عبر البريد الإلكتروني.'
          },
          {
            q: 'ما المستندات التي أحتاجها؟',
            a: 'تحتاج إلى سجل تجاري ساري، وبطاقة هوية وطنية، وبيانات حساب بنكي. قد تكون هناك شهادات إضافية مطلوبة حسب نوع منتجك.'
          },
          {
            q: 'كم يستغرق وقت الموافقة؟',
            a: 'عادةً 3–5 أيام عمل. ستتلقى بريداً إلكترونياً مع معرف البائع الخاص بك بمجرد الموافقة.'
          },
          {
            q: 'هل هناك رسوم تسجيل؟',
            a: 'نعم، رسوم تسجيل لمرة واحدة بقيمة €39.90 تُطبق عند الموافقة على حسابك. تبقى حسابك نشطاً طالما تبيع معنا.'
          },
        ]
      },
      {
        id: 'products',
        icon: '📦',
        title: 'المنتجات',
        faqs: [
          {
            q: 'كيف أضيف منتجاً؟',
            a: 'اذهب إلى المنتجات → إضافة منتج جديد. أكمل النموذج من 4 خطوات: معلومات المنتج، الصور، المواصفات التقنية (الأبعاد، الوزن)، وتفاصيل التغليف مع المتغيرات.'
          },
          {
            q: 'ماذا يحدث بعد تقديم المنتج؟',
            a: 'ينتقل منتجك إلى "قيد المراجعة". يراجعه فريقنا خلال 2–3 أيام عمل. بعد الموافقة، ستحصل على كود المنتج ويمكنك طلب الشحن.'
          },
          {
            q: 'هل يمكنني تعديل منتجي بعد التقديم؟',
            a: 'نعم، يمكنك تعديل المنتجات في حالة المسودة أو المرفوضة. بعد الموافقة وبدء عملية الشحن، تتوفر تعديلات محدودة من خلال صفحة ملف المنتج.'
          },
          {
            q: 'ما رسوم إدراج المنتجات؟',
            a: 'بعد الشهر الأول المجاني، يكلف كل منتج €2/شهر. أول 4 variants لكل منتج مجانية. كل variant إضافي يكلف €0.50/شهر.'
          },
        ]
      },
      {
        id: 'shipment',
        icon: '🚢',
        title: 'الشحن واللوجستيات',
        faqs: [
          {
            q: 'كيف أشحن منتجاتي إلى ألمانيا؟',
            a: 'بعد الموافقة على منتجك، اذهب إلى المخزون → طلب شحن جديد. اختر منتجاتك وطريقة التسليم وقدّم الطلب. ستؤكد وكالة تاريخ التسليم.'
          },
          {
            q: 'ما طرق التسليم المتاحة؟',
            a: 'يمكنك الاختيار من: الاستلام بواسطة وكالة (نأتي إليك)، أو الشحن بالبريد (تتولى التوصيل)، أو التسليم في مستودع وكالة في مصر.'
          },
          {
            q: 'كم يستغرق الشحن؟',
            a: 'عادةً 2–4 أسابيع من مصر إلى مستودعنا في ألمانيا، بما في ذلك التخليص الجمركي.'
          },
          {
            q: 'كيف تُحسب تكلفة الشحن؟',
            a: 'يُحسب الشحن لكل شحنة بناءً على الوزن القابل للشحن — الأعلى بين الوزن الفعلي والوزن الحجمي (الطول×العرض×الارتفاع÷5000). يُؤكد السعر لكل شحنة.'
          },
        ]
      },
      {
        id: 'costs',
        icon: '💰',
        title: 'التكاليف وكشوف الحساب',
        faqs: [
          {
            q: 'كيف تُحسب رسوم التخزين؟',
            a: 'التخزين = €25 × (حجم الكرتون بالمتر المكعب × 1.15) × الكمية في ألمانيا × أشهر التخزين. معامل 1.15 يحسب المساحة الاحتياطية في المستودع.'
          },
          {
            q: 'ما عمولة وكالة؟',
            a: 'تفرض وكالة 15% من سعر البيع لكل وحدة مباعة. بالإضافة إلى ذلك، €1 لكل وحدة رسوم تعبئة وتغليف (تجهيز الطلب والتغليف).'
          },
          {
            q: 'ما ضريبة القيمة المضافة وكيف تُدار؟',
            a: 'تُطبق ضريبة القيمة المضافة الألمانية بنسبة 19% على جميع المبيعات. تتولى وكالة تحصيل ضريبة القيمة المضافة وتقديمها نيابةً عنك. تُخصم من سعر البيع في كشف حسابك.'
          },
          {
            q: 'متى أستلم كشف حسابي؟',
            a: 'تُصدر كشوف الحساب الشهرية من قِبل فريق محاسبة وكالة في نهاية كل شهر. ستُخطر عند جاهزية الكشف. تظهر الكشوف بحالة مسودة حتى تُرسل إليك رسمياً.'
          },
          {
            q: 'كيف يُحسب ربحي؟',
            a: 'الربح = سعر البيع − تكلفة الإنتاج − رسوم التخزين − عمولة وكالة (15%) − التعبئة والتغليف (€1) − رسوم الشحن − ضريبة القيمة المضافة (19%). راجع صفحة التسعير للاطلاع على مثال تفصيلي.'
          },
        ]
      },
      {
        id: 'issues',
        icon: '⚠️',
        title: 'المشكلات الشائعة',
        faqs: [
          {
            q: 'رُفض منتجي. ماذا أفعل؟',
            a: 'تحقق من سبب الرفض في صفحة ملف المنتج. الأسباب الشائعة: أبعاد مفقودة، صور غير واضحة، أو وصف غير مكتمل. قم بالتعديل وأعد التقديم.'
          },
          {
            q: 'هناك مشكلة في شحنتي. من أتصل؟',
            a: 'اذهب إلى المخزون → طلبات الشحن وتحقق إذا كانت وكالة قد أبلغت عن مشكلة. ثم اذهب إلى الرسائل وافتح تذكرة دعم جديدة برقم شحنتك.'
          },
          {
            q: 'أختلف مع رسوم في كشف حسابي.',
            a: 'تواصل معنا عبر الرسائل → تذاكر الدعم مع تفاصيل كشف حسابك. سيراجع فريقنا ويرد خلال يومي عمل.'
          },
          {
            q: 'كيف أطبق كود خصم؟',
            a: 'اذهب إلى كشوف الحساب → تبويب خدمات الويب. أدخل الكود في حقل كود الخصم وانقر تطبيق.'
          },
        ]
      },
    ],
    contact: {
      title: 'لا تزال بحاجة إلى مساعدة؟',
      desc: 'أرسل لنا رسالة عبر لوحة التحكم وسيتواصل معك فريقنا.',
      btn: 'فتح تذكرة دعم',
    }
  }
}

export default function HelpPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('getting-started')
  const t = content[lang]
  const isAr = lang === 'ar'

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#E0DDDA]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/wikala_Logo.svg" alt="Wikala" className="h-8" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.nav.home}</Link>
            <Link href="/dashboard" className="text-sm text-[#6B6560] hover:text-[#1B2A4A] transition">{t.nav.dashboard}</Link>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs border border-[#E0DDDA] px-3 py-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F4F0] transition">
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#1B2A4A] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">{t.hero.title}</h1>
          <p className="text-white/60">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-8">

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
            {t.sections.map(section => (
              <button key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-[#E0DDDA] last:border-0 transition flex items-center gap-2
                  ${activeSection === section.id
                    ? 'bg-[#1B2A4A] text-white font-medium'
                    : 'text-[#6B6560] hover:bg-[#F5F4F0]'}`}>
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="flex-1">
          {t.sections.filter(s => s.id === activeSection).map(section => (
            <div key={section.id}>
              <h2 className="text-xl font-bold text-[#1B2A4A] mb-6 flex items-center gap-2">
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </h2>
              <div className="space-y-3">
                {section.faqs.map((faq, i) => {
                  const key = `${section.id}-${i}`
                  const isOpen = openFaq === key
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-[#E0DDDA] overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4">
                        <span className="font-medium text-[#1B2A4A] text-sm">{faq.q}</span>
                        <span className={`text-[#C8952E] transition-transform flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 border-t border-[#E0DDDA]">
                          <p className="text-sm text-[#6B6560] leading-relaxed pt-4">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div className="mt-10 bg-[#1B2A4A] rounded-2xl p-8 text-center">
            <h3 className="font-semibold text-white mb-2">{t.contact.title}</h3>
            <p className="text-white/60 text-sm mb-6">{t.contact.desc}</p>
            <Link href="/messages?tab=issues&new=true&title=Support Request"
              className="bg-[#C8952E] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b07d25] transition">
              {t.contact.btn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}