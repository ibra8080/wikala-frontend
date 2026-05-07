export default function Footer() {
  return (
    <footer className="bg-[#1B2A4A] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1">
            <img
              src="/icons/wikala_Logo.svg"
              alt="Wikala"
              className="h-8 mb-4 brightness-0 invert"
            />
            <p className="text-sm text-white/60 leading-relaxed">
              The first e-commerce platform dedicated to authentic Egyptian-made products.
            </p>
            <p className="text-xs text-[#C8952E] mt-3">
              Made in Egypt — Sold in Europe
            </p>
          </div>

          {/* Seller */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Seller Portal
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'My Products', href: '/products' },
                { label: 'Inventory', href: '/inventory' },
                { label: 'Statements', href: '/statements' },
                { label: 'Messages', href: '/messages' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#C8952E] transition"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Store */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Our Store
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Shop', href: 'https://wikala.shop' },
                { label: 'Categories', href: 'https://wikala.shop/collections' },
                { label: 'New Arrivals', href: 'https://wikala.shop/new' },
                { label: 'Best Sellers', href: 'https://wikala.shop/best' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-[#C8952E] transition"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Contact
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/60">Bremen, Germany</li>
              <li>
                <a
                  href="https://wikala.shop"
                  className="text-sm text-white/60 hover:text-[#C8952E] transition"
                >
                  wikala.shop
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-8 pt-6 flex justify-between items-center">
          <p className="text-xs text-white/40">
            © 2026 Wikala. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Bremen, Germany
          </p>
        </div>
      </div>
    </footer>
  )
}