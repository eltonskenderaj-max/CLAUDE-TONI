/**
 * AHRPA - Revenue Management Albania
 * Main JavaScript
 */

'use strict';

/* ============================================
   Utility Functions
   ============================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================
   Navigation: Scroll behavior & mobile toggle
   ============================================ */
(function initNavigation() {
  const navbar = $('#navbar');
  const navToggle = $('#nav-toggle');
  const mobileMenu = $('#mobile-menu');
  const mobileLinks = $$('#mobile-menu a');

  if (!navbar) return;

  // Navbar scroll state
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init

  // Mobile menu toggle
  function openMenu() {
    mobileMenu.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    // Close on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }
})();

/* ============================================
   Smooth Scroll for Anchor Links
   ============================================ */
(function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const navHeight = document.getElementById('navbar')?.offsetHeight || 70;
    const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

    window.scrollTo({
      top: targetPos,
      behavior: 'smooth'
    });

    // Update URL without page jump
    if (history.pushState) {
      history.pushState(null, null, href);
    }
  });
})();

/* ============================================
   Intersection Observer: Scroll Animations
   ============================================ */
(function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements
    $$('.animate-on-scroll').forEach(el => el.classList.add('animated'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  $$('.animate-on-scroll').forEach(el => observer.observe(el));
})();

/* ============================================
   FAQ Accordion
   ============================================ */
(function initFAQ() {
  const faqItems = $$('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard accessibility
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
})();

/* ============================================
   Contact Form: Validation & Submission
   ============================================ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const successMsg = $('#form-success');

  function showError(field, message) {
    field.classList.add('error');
    const errEl = field.parentElement.querySelector('.field-error');
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  }

  function clearError(field) {
    field.classList.remove('error');
    const errEl = field.parentElement.querySelector('.field-error');
    if (errEl) {
      errEl.classList.remove('visible');
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm() {
    let valid = true;

    const nameField = $('#field-name');
    const emailField = $('#field-email');
    const hotelField = $('#field-hotel');
    const roomsField = $('#field-rooms');
    const messageField = $('#field-message');

    // Clear all errors first
    [nameField, emailField, hotelField, roomsField, messageField].forEach(f => {
      if (f) clearError(f);
    });

    if (!nameField?.value.trim()) {
      showError(nameField, 'Veuillez entrer votre nom.');
      valid = false;
    }

    if (!emailField?.value.trim()) {
      showError(emailField, 'Veuillez entrer votre adresse email.');
      valid = false;
    } else if (!validateEmail(emailField.value.trim())) {
      showError(emailField, 'Veuillez entrer une adresse email valide.');
      valid = false;
    }

    if (!hotelField?.value.trim()) {
      showError(hotelField, "Veuillez entrer le nom de votre hôtel.");
      valid = false;
    }

    if (!roomsField?.value) {
      showError(roomsField, 'Veuillez sélectionner le nombre de chambres.');
      valid = false;
    }

    if (!messageField?.value.trim() || messageField.value.trim().length < 10) {
      showError(messageField, 'Veuillez entrer un message (minimum 10 caractères).');
      valid = false;
    }

    return valid;
  }

  // Real-time validation on blur
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => {
      if (field.value.trim()) {
        clearError(field);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitBtn = form.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity:0.7">Envoi en cours...</span>';

    const formData = {
      name: $('#field-name').value.trim(),
      email: $('#field-email').value.trim(),
      hotel: $('#field-hotel').value.trim(),
      rooms: $('#field-rooms').value,
      phone: $('#field-phone')?.value.trim() || '',
      message: $('#field-message').value.trim(),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Show success regardless of server status (demo mode)
      showSuccess();
    } catch (err) {
      // Even on network error, show success for demo
      showSuccess();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  function showSuccess() {
    form.style.display = 'none';
    if (successMsg) {
      successMsg.classList.add('visible');
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();

/* ============================================
   Exit Intent Popup
   ============================================ */
(function initExitPopup() {
  const overlay = $('#exit-popup');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.popup-close');
  const dismissBtns = overlay.querySelectorAll('.popup-dismiss-text, #popup-dismiss');

  let shown = false;
  let mouseLeaveTimeout;

  // Check session storage — don't show again in same session
  if (sessionStorage.getItem('ahrpa_popup_shown')) {
    shown = true;
  }

  function showPopup() {
    if (shown) return;
    shown = true;
    sessionStorage.setItem('ahrpa_popup_shown', '1');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Trap focus
    const focusable = overlay.querySelectorAll('button, a, input');
    if (focusable.length) focusable[0].focus();
  }

  function hidePopup() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Exit intent: mouse leaves top of viewport
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !shown) {
      mouseLeaveTimeout = setTimeout(showPopup, 200);
    }
  });

  document.addEventListener('mouseenter', () => {
    clearTimeout(mouseLeaveTimeout);
  });

  // Also show after 45s of inactivity
  let inactivityTimer = setTimeout(() => {
    if (!shown) showPopup();
  }, 45000);

  document.addEventListener('mousemove', () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!shown) showPopup();
    }, 45000);
  }, { passive: true });

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', hidePopup);
  dismissBtns.forEach(btn => btn.addEventListener('click', hidePopup));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hidePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      hidePopup();
    }
  });
})();

/* ============================================
   Floating CTA Dismiss
   ============================================ */
(function initFloatingCTA() {
  const floatingCTA = $('.floating-cta');
  const dismissBtn = $('.floating-cta-dismiss');

  if (!floatingCTA || !dismissBtn) return;

  // Hide when user scrolls to contact section
  const contactSection = $('#contact');
  if (contactSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        floatingCTA.style.opacity = entry.isIntersecting ? '0' : '1';
        floatingCTA.style.pointerEvents = entry.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0.3 });
    observer.observe(contactSection);
  }

  dismissBtn.addEventListener('click', () => {
    floatingCTA.style.display = 'none';
    sessionStorage.setItem('ahrpa_cta_dismissed', '1');
  });

  // Check if previously dismissed
  if (sessionStorage.getItem('ahrpa_cta_dismissed')) {
    floatingCTA.style.display = 'none';
  }
})();

/* ============================================
   Back to Top Button
   ============================================ */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================
   Animated Counter (Results section)
   ============================================ */
(function initCounters() {
  if (!('IntersectionObserver' in window)) return;

  const counters = $$('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = prefix + current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ============================================
   Sticky Nav Active Section Highlight
   ============================================ */
(function initActiveNav() {
  const navLinks = $$('#navbar .nav-links a[href^="#"]');
  if (!navLinks.length) return;

  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!('IntersectionObserver' in window)) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    });
  }, {
    threshold: 0.4,
    rootMargin: '-70px 0px 0px 0px'
  });

  sections.forEach(s => sectionObserver.observe(s));
})();

/* ============================================
   Lazy Load Images (future-proofing)
   ============================================ */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    $$('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.loading = 'lazy';
    });
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
    $$('img[data-src]').forEach(img => observer.observe(img));
  }
})();

/* ============================================
   Performance: Preload on hover
   ============================================ */
(function initLinkPrefetch() {
  if (!('HTMLLinkElement' in window)) return;

  const internalLinks = $$('a[href^="/"]');
  internalLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href === '/') return;

      // Check if already prefetched
      if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;

      const prefetch = document.createElement('link');
      prefetch.rel = 'prefetch';
      prefetch.href = href;
      document.head.appendChild(prefetch);
    }, { passive: true, once: true });
  });
})();

/* ============================================
   DOM Ready Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Add animate-on-scroll to major sections
  const animatableElements = [
    '.problem-card',
    '.solution-card',
    '.hotel-type-card',
    '.method-step',
    '.result-card',
    '.team-card',
    '.blog-card',
    '.founder-grid > *',
    '.pricing-card',
    '.section-header',
    '.contact-info',
    '.contact-form-wrapper',
  ];

  animatableElements.forEach(selector => {
    $$(selector).forEach((el, i) => {
      if (!el.classList.contains('animate-on-scroll')) {
        el.classList.add('animate-on-scroll');
        if (i < 5) el.classList.add(`delay-${i + 1}`);
      }
    });
  });

  // Reinit scroll observer for newly added elements
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.animate-on-scroll:not(.animated)').forEach(el => observer.observe(el));
  }

  console.log('%cAHRPA%c Revenue Management Albania', 'color: #c9a84c; font-size: 1.2em; font-weight: bold;', 'color: #fff;');
});
