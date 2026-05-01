// Accessible mobile menu behavior
// - Toggles mobile menu and overlay
// - Manages aria-expanded and aria-hidden
// - Locks body scroll when open
// - Closes on overlay click, Escape, or link click

document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navbar = document.querySelector('.navbar');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const navLinkItems = document.querySelectorAll('.nav-link');
  const heroSection = document.querySelector('.hero');
  const eventsGrid = document.querySelector('.events-grid');
  const navItemElements = document.querySelectorAll('.nav-item');
  const anchorNavLinks = Array.from(navLinkItems).filter(function (link) {
    const href = link.getAttribute('href') || '';
    return href.startsWith('#');
  });
  const isLocalStaticServer = window.location.port === '3000' || window.location.port === '5500';
  const apiBaseUrl = window.MKUSSSA_API_BASE_URL || (isLocalStaticServer ? 'http://localhost:5000/api' : '/api');

  if (!mobileMenuBtn || !navLinks) return;

  function openMenu() {
    navLinks.classList.add('nav-links-active');
    mobileMenuBtn.classList.add('mobile-menu-active');
    navbar.classList.add('navbar-mobile-active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    navLinks.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    // swap icon to X
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    }
  }

  function closeMenu() {
    navLinks.classList.remove('nav-links-active');
    mobileMenuBtn.classList.remove('mobile-menu-active');
    navbar.classList.remove('navbar-mobile-active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    navLinks.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  }

  function setNavbarScrolled() {
    if (!navbar) return;
    if (window.scrollY > 16) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }

  function updateNavbarHeight() {
    if (!navbar) return;
    document.documentElement.style.setProperty('--navbar-height', navbar.offsetHeight + 'px');
  }

  function setActiveNav(linkToActivate) {
    navItemElements.forEach(function (item) {
      item.classList.remove('active');
    });
    if (!linkToActivate) return;
    const parentItem = linkToActivate.closest('.nav-item');
    if (parentItem) parentItem.classList.add('active');
  }

  function getActiveLinkFromScroll() {
    const homeLink = anchorNavLinks.find(function (link) {
      return link.getAttribute('href') === '#top';
    });
    const scrollOffset = (navbar ? navbar.offsetHeight : 0) + 12;
    const currentScroll = window.scrollY + scrollOffset;

    if (window.scrollY < 24) return homeLink || anchorNavLinks[0] || null;

    let currentLink = homeLink || anchorNavLinks[0] || null;
    anchorNavLinks.forEach(function (link) {
      const targetSelector = link.getAttribute('href');
      if (!targetSelector || targetSelector === '#top') return;
      const section = document.querySelector(targetSelector);
      if (!section) return;
      if (section.offsetTop <= currentScroll) {
        currentLink = link;
      }
    });

    return currentLink;
  }

  // Initialize accessibility state and scroll state on load.
  navLinks.setAttribute('aria-hidden', 'true');
  setNavbarScrolled();
  updateNavbarHeight();
  setActiveNav(getActiveLinkFromScroll());

  mobileMenuBtn.addEventListener('click', function (e) {
    const expanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    if (expanded) closeMenu();
    else openMenu();
  });

  // Close when clicking a nav link
  navLinkItems.forEach((link) => {
    link.addEventListener('click', function () {
      if ((link.getAttribute('href') || '').startsWith('#')) {
        setActiveNav(link);
      }
      closeMenu();
    });
  });

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', function () {
      closeMenu();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (navLinks.classList.contains('nav-links-active')) {
        closeMenu();
      }
    }
  });

  // Keep navbar visual and active-link state in sync while scrolling.
  window.addEventListener('scroll', function () {
    setNavbarScrolled();
    setActiveNav(getActiveLinkFromScroll());
  }, { passive: true });

  // Ensure state resets when switching from mobile to desktop width.
  window.addEventListener('resize', function () {
    updateNavbarHeight();
    if (window.innerWidth > 768 && navLinks.classList.contains('nav-links-active')) {
      closeMenu();
    }
  });

  // Click outside to close (only when open)
  document.addEventListener('click', function (event) {
    if (!navLinks.classList.contains('nav-links-active')) return;
    const isClickInsideNav = navbar.contains(event.target);
    const isMenuBtn = mobileMenuBtn.contains(event.target);
    if (!isClickInsideNav && !isMenuBtn) {
      closeMenu();
    }
  });

  // Hero background carousel:
  if (heroSection) {
    const heroSlides = [
      '../assets/images/banner1.jpg',
      '../assets/images/banner6.jpeg',
      '../assets/images/banner2.jpg',
      '../assets/images/banner.jpg',
      '../assets/images/banner3.jpg',
      '../assets/images/banner5.jpeg',
      '../assets/images/banner4.jpg',
    ];
    const preloadImages = new Map();
    let activeHeroIndex = 0;
    let heroTimerId = null;
    let activeHeroToken = 0;

    function ensureSlideLoaded(src) {
      if (!preloadImages.has(src)) {
        const image = new Image();
        image.src = src;

        const loadPromise = image.decode
          ? image.decode().catch(function () {
            return new Promise(function (resolve) {
              image.onload = resolve;
              image.onerror = resolve;
            });
          })
          : new Promise(function (resolve) {
            image.onload = resolve;
            image.onerror = resolve;
          });

        preloadImages.set(src, loadPromise);
      }

      return preloadImages.get(src);
    }

    function setHeroBackground(src) {
      heroSection.style.setProperty('--hero-bg-image', 'url("' + src + '")');
    }

    async function showHeroSlide(nextIndex) {
      const slideToken = ++activeHeroToken;
      const nextSlide = heroSlides[nextIndex % heroSlides.length];
      await ensureSlideLoaded(nextSlide);
      if (slideToken !== activeHeroToken) return;
      setHeroBackground(nextSlide);
    }

    function startHeroCarousel() {
      if (heroSlides.length < 2 || heroTimerId) return;
      heroTimerId = window.setInterval(function () {
        activeHeroIndex = (activeHeroIndex + 1) % heroSlides.length;
        showHeroSlide(activeHeroIndex);
      }, 5000);
    }

    function stopHeroCarousel() {
      if (!heroTimerId) return;
      window.clearInterval(heroTimerId);
      heroTimerId = null;
    }

    ensureSlideLoaded(heroSlides[0]).then(function () {
      setHeroBackground(heroSlides[0]);
    });
    heroSection.addEventListener('mouseenter', stopHeroCarousel);
    heroSection.addEventListener('mouseleave', startHeroCarousel);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopHeroCarousel();
      else startHeroCarousel();
    });

    startHeroCarousel();
  }

  function formatEventDate(eventDate) {
    if (!eventDate) {
      return { month: 'TBA', day: 'Soon' };
    }

    const date = new Date(eventDate);

    if (Number.isNaN(date.getTime())) {
      return { month: 'TBA', day: 'Soon' };
    }

    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase(),
      day: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date),
    };
  }

  function buildEventCard(event) {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.id = event.id ? 'event-' + event.id : '';

    const date = formatEventDate(event.eventDate);

    const eventDate = document.createElement('div');
    eventDate.className = 'event-date';

    const eventMonth = document.createElement('span');
    eventMonth.className = 'event-month';
    eventMonth.textContent = date.month;

    const eventDay = document.createElement('span');
    eventDay.className = 'event-day';
    eventDay.textContent = date.day;

    eventDate.append(eventMonth, eventDay);

    const eventContent = document.createElement('div');
    eventContent.className = 'event-content';

    const title = document.createElement('h3');
    title.textContent = String(event.title ?? 'Untitled Event');

    const description = document.createElement('p');
    description.textContent = String(event.description ?? '');

    const action = document.createElement('a');
    action.className = 'btn btn-small';
    action.textContent = 'Register Now';
    action.href = event.registrationUrl || (event.id ? '#event-' + event.id : '#events');

    eventContent.append(title, description, action);
    card.append(eventDate, eventContent);

    return card;
  }

  async function loadEventsSection() {
    if (!eventsGrid) return;

    try {
      const response = await fetch(apiBaseUrl + '/events');

      if (!response.ok) {
        throw new Error('Unable to load events');
      }

      const payload = await response.json();
      const events = Array.isArray(payload.data) ? payload.data : [];

      if (events.length === 0) {
        return;
      }

      eventsGrid.innerHTML = '';
      events.forEach(function (event) {
        eventsGrid.appendChild(buildEventCard(event));
      });
    } catch (error) {
      console.warn('Events section could not be refreshed from the API.', error);
    }
  }

  loadEventsSection();
});