import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const navLinksRef = useRef(null);
  const indicatorRef = useRef(null);

  const pathname = location.pathname;

  // Determine nav mode
  let mode = 'app';
  if (pathname === '/' || pathname === '/how') {
    mode = 'site';
  } else if (pathname.startsWith('/research')) {
    mode = 'none';
  }

  const marketingLinks = [
    { to: '/how', label: 'How it works' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/briefings/brief_001', label: 'Sample briefing' }
  ];

  const appLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/new', label: 'New briefing' },
    { to: '/history', label: 'History' },
    { to: '/settings', label: 'Settings' }
  ];

  const links = mode === 'site' ? marketingLinks : appLinks;

  // Scroll visibility and blur background
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > 140 && currentScrollY > lastScrollY.current) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position
  const updateIndicator = (targetEl) => {
    if (!indicatorRef.current || !navLinksRef.current) return;
    if (targetEl) {
      const containerRect = navLinksRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      indicatorRef.current.style.left = `${targetRect.left - containerRect.left + 12}px`;
      indicatorRef.current.style.width = `${targetRect.width - 24}px`;
      indicatorRef.current.style.opacity = '1';
    } else {
      indicatorRef.current.style.opacity = '0';
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    if (!navLinksRef.current) return;
    const activeEl = navLinksRef.current.querySelector(`[data-path="${pathname}"]`);
    updateIndicator(activeEl);
  }, [pathname, mode]);

  if (mode === 'none') {
    return null;
  }

  return (
    <nav
      id="main-nav"
      aria-label="Main Navigation"
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] px-[4vw] flex items-center gap-7 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isHidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        isScrolled
          ? 'bg-[#FAF3E8]/85 backdrop-blur-md border-b border-[rgba(27,22,48,0.15)] shadow-xs'
          : 'bg-transparent'
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className="font-heading font-extrabold text-[21px] tracking-tight flex items-center gap-2.5 text-[#1B1630] no-underline mr-auto select-none"
      >
        <span className="w-[22px] h-[22px] rounded-full border-[2.5px] border-[#1B1630] relative inline-block">
          <span
            className="absolute inset-[3.5px] rounded-full animate-ping"
            style={{ background: 'var(--g)', animationDuration: '3.6s' }}
          />
        </span>
        MeetIQ
      </Link>

      {/* Desktop Links with Roll Animation & Sliding Indicator */}
      <div
        ref={navLinksRef}
        className="relative hidden md:flex items-center gap-1.5"
        onMouseLeave={() => {
          const activeEl = navLinksRef.current?.querySelector(`[data-path="${pathname}"]`);
          updateIndicator(activeEl);
        }}
      >
        {links.map((link) => {
          const isActive = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              data-path={link.to}
              onMouseEnter={(e) => updateIndicator(e.currentTarget)}
              className="relative block overflow-hidden h-[34px] px-3.5 text-[#1B1630] no-underline font-medium text-[15px] group"
            >
              <span className="block leading-[34px] transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-full">
                {link.label}
              </span>
              <span className="block leading-[34px] text-[#E60B09] transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-full">
                {link.label}
              </span>
            </Link>
          );
        })}
        {/* Springy Gradient Indicator Underline */}
        <i
          ref={indicatorRef}
          className="absolute -bottom-1 h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.3,1.3,0.5,1)] pointer-events-none opacity-0"
          style={{ background: 'var(--g)' }}
        />
      </div>

      {/* Action / Avatar Area */}
      <div className="flex items-center gap-3">
        {mode === 'site' ? (
          <Link
            to="/new"
            className="btn-primary py-2 px-5 text-[15px] hidden sm:inline-flex shadow-sm"
          >
            Prepare for a meeting
          </Link>
        ) : (
          <Link
            to="/settings"
            aria-label="Profile Settings"
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-[#1B1630] shadow-sm select-none"
            style={{ background: 'var(--g)' }}
          >
            A
          </Link>
        )}

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1B1630] hover:text-[#E60B09] transition-colors focus-visible:outline-2"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-[#FAF3E8] border-b border-[rgba(27,22,48,0.15)] shadow-xl p-5 flex flex-col gap-3 md:hidden animate-[reveal-up-anim_0.3s_ease-out]">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#1B1630] hover:text-[#E60B09] font-medium text-[17px] py-1 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {mode === 'site' && (
            <Link
              to="/new"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary mt-2 text-center"
            >
              Prepare for a meeting
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
