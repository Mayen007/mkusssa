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
  const announcementsGrid = document.querySelector('.announcements-grid');
  const eventsGrid = document.querySelector('.events-grid');
  const galleryGrid = document.querySelector('.gallery-grid');
  const membershipOpenButton = document.querySelector('[data-membership-open]');
  const membershipModal = document.querySelector('#membership-modal');
  const membershipForm = document.querySelector('#membership-form');
  const membershipMessage = document.querySelector('#membership-form-message');
  const leadershipGrid = document.querySelector('.leadership-grid');
  const navItemElements = document.querySelectorAll('.nav-item');
  const anchorNavLinks = Array.from(navLinkItems).filter(function (link) {
    const href = link.getAttribute('href') || '';
    return href.startsWith('#');
  });
  const isLocalStaticServer = window.location.port === '3000' || window.location.port === '5500';
  const apiBaseUrl = (() => {
    const explicitBaseUrl = window.MKUSSSA_API_BASE_URL || document.querySelector('meta[name="mkusssa-api-base-url"]')?.content || '';

    if (explicitBaseUrl.trim()) {
      return explicitBaseUrl.trim().replace(/\/$/, '');
    }

    if (isLocalStaticServer) {
      return 'http://localhost:5000/api';
    }

    return '';
  })();

  let membershipTriggerElement = null;

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

  function formatAnnouncementDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function buildAnnouncementCard(announcement) {
    const card = document.createElement('article');
    const priority = String(announcement.priority || 'normal').toLowerCase();
    card.className = 'announcement-card is-' + priority;

    const header = document.createElement('div');
    header.className = 'announcement-header';

    const titleWrap = document.createElement('div');

    const priorityBadge = document.createElement('span');
    priorityBadge.className = 'announcement-priority';
    priorityBadge.textContent = priority;

    const title = document.createElement('h3');
    title.textContent = String(announcement.title ?? 'Untitled Announcement');

    titleWrap.append(priorityBadge, title);

    const date = document.createElement('span');
    date.className = 'announcement-date';
    date.textContent = formatAnnouncementDate(announcement.createdAt || announcement.updatedAt) || 'Posted recently';

    header.append(titleWrap, date);

    const body = document.createElement('p');
    body.textContent = String(announcement.body ?? '');

    const footer = document.createElement('div');
    footer.className = 'announcement-footer';

    const expiry = document.createElement('span');
    expiry.className = 'announcement-expiry';
    expiry.textContent = announcement.expiresAt ? 'Expires ' + formatAnnouncementDate(announcement.expiresAt) : 'No expiry set';

    footer.appendChild(expiry);

    card.append(header, body, footer);
    return card;
  }

  function buildLeaderCard(leader) {
    const card = document.createElement('article');
    card.className = 'leader-card';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'leader-image';

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-image';

    if (leader.imageUrl) {
      const image = document.createElement('img');
      image.className = 'leader-img';
      image.src = leader.imageUrl;
      image.alt = leader.fullName || leader.position || 'Leader portrait';
      placeholder.appendChild(image);
    }

    imageWrap.appendChild(placeholder);

    const position = document.createElement('h3');
    position.textContent = String(leader.position ?? 'Leader');

    const name = document.createElement('p');
    name.className = 'leader-name';
    name.textContent = String(leader.fullName ?? 'Unnamed Leader');

    const role = document.createElement('p');
    role.className = 'leader-role';
    role.textContent = String(leader.bio ?? '');

    card.append(imageWrap, position, name, role);
    return card;
  }

  function buildGalleryCard(item) {
    const card = document.createElement('article');
    card.className = 'gallery-card';

    const media = document.createElement('div');
    media.className = 'gallery-media';

    const image = document.createElement('img');
    image.src = item.imageUrl || '';
    image.alt = item.title || 'Gallery image';
    image.loading = 'lazy';
    media.appendChild(image);

    const content = document.createElement('div');
    content.className = 'gallery-content';

    const badge = document.createElement('span');
    badge.className = 'gallery-badge';
    badge.textContent = item.album || 'Gallery';

    const title = document.createElement('h3');
    title.textContent = String(item.title ?? 'Untitled Gallery Item');

    content.append(badge, title);

    if (item.caption) {
      const caption = document.createElement('p');
      caption.className = 'gallery-caption';
      caption.textContent = String(item.caption);
      content.appendChild(caption);
    }

    if (Array.isArray(item.tags) && item.tags.length > 0) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'gallery-tags';

      item.tags.forEach(function (tag) {
        const tagEl = document.createElement('span');
        tagEl.className = 'gallery-tag';
        tagEl.textContent = String(tag);
        tagsWrap.appendChild(tagEl);
      });

      content.appendChild(tagsWrap);
    }

    card.append(media, content);
    return card;
  }

  function setMembershipMessage(text, tone) {
    if (!membershipMessage) return;
    membershipMessage.textContent = text || '';
    membershipMessage.dataset.tone = tone || '';
  }

  function setMembershipModalVisible(visible) {
    if (!membershipModal) return;

    membershipModal.hidden = !visible;
    membershipModal.classList.toggle('is-visible', visible);
    membershipModal.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.body.classList.toggle('no-scroll', visible);

    if (visible) {
      window.setTimeout(function () {
        const firstField = membershipModal.querySelector('input, textarea, button');
        if (firstField && typeof firstField.focus === 'function') {
          firstField.focus({ preventScroll: true });
        }
      }, 0);
      return;
    }

    if (membershipTriggerElement && typeof membershipTriggerElement.focus === 'function' && membershipTriggerElement.isConnected) {
      window.setTimeout(function () {
        membershipTriggerElement.focus({ preventScroll: true });
      }, 0);
    }

    membershipTriggerElement = null;
  }

  function openMembershipModal(triggerElement) {
    membershipTriggerElement = triggerElement || membershipOpenButton || null;
    setMembershipModalVisible(true);
  }

  function closeMembershipModal() {
    if (!membershipModal) return;
    membershipModal.classList.remove('is-visible');
    membershipModal.classList.add('is-closing');
    window.setTimeout(function () {
      membershipModal.classList.remove('is-closing');
      setMembershipModalVisible(false);
    }, 220);
    setMembershipMessage('', '');
    if (membershipForm) {
      membershipForm.reset();
    }
  }

  async function loadEventsSection() {
    if (!eventsGrid || !apiBaseUrl) return;

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

  async function loadLeadershipSection() {
    if (!leadershipGrid || !apiBaseUrl) return;

    try {
      const response = await fetch(apiBaseUrl + '/leaders/current');

      if (!response.ok) {
        throw new Error('Unable to load current leaders');
      }

      const payload = await response.json();
      const leaders = Array.isArray(payload.data) ? payload.data : [];

      if (leaders.length === 0) {
        return;
      }

      leadershipGrid.innerHTML = '';
      leaders.forEach(function (leader) {
        leadershipGrid.appendChild(buildLeaderCard(leader));
      });
    } catch (error) {
      console.warn('Leadership section could not be refreshed from the API.', error);
    }
  }

  async function loadAnnouncementsSection() {
    if (!announcementsGrid || !apiBaseUrl) return;

    try {
      const response = await fetch(apiBaseUrl + '/announcements');

      if (!response.ok) {
        throw new Error('Unable to load announcements');
      }

      const payload = await response.json();
      const announcements = Array.isArray(payload.data) ? payload.data : [];

      announcementsGrid.innerHTML = '';

      if (announcements.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'announcements-empty';
        empty.textContent = 'Announcements will appear here when published.';
        announcementsGrid.appendChild(empty);
        return;
      }

      announcements.forEach(function (announcement) {
        announcementsGrid.appendChild(buildAnnouncementCard(announcement));
      });
    } catch (error) {
      console.warn('Announcements section could not be refreshed from the API.', error);
      if (announcementsGrid && !announcementsGrid.children.length) {
        const fallback = document.createElement('p');
        fallback.className = 'announcements-empty';
        fallback.textContent = 'Announcements could not be loaded right now.';
        announcementsGrid.appendChild(fallback);
      }
    }
  }

  async function loadGallerySection() {
    if (!galleryGrid || !apiBaseUrl) return;

    try {
      const response = await fetch(apiBaseUrl + '/gallery');

      if (!response.ok) {
        throw new Error('Unable to load gallery');
      }

      const payload = await response.json();
      const items = Array.isArray(payload.data) ? payload.data : [];

      galleryGrid.innerHTML = '';

      if (items.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'gallery-empty';
        empty.textContent = 'Gallery moments will appear here soon.';
        galleryGrid.appendChild(empty);
        return;
      }

      items.forEach(function (item) {
        galleryGrid.appendChild(buildGalleryCard(item));
      });
    } catch (error) {
      console.warn('Gallery section could not be refreshed from the API.', error);
      if (galleryGrid && !galleryGrid.children.length) {
        const fallback = document.createElement('p');
        fallback.className = 'gallery-empty';
        fallback.textContent = 'Gallery moments could not be loaded right now.';
        galleryGrid.appendChild(fallback);
      }
    }
  }

  async function handleMembershipSubmit(event) {
    event.preventDefault();
    if (!membershipForm || !apiBaseUrl) return;

    setMembershipMessage('Sending membership request...', 'info');

    const formData = new FormData(membershipForm);
    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      registrationNumber: String(formData.get('registrationNumber') || '').trim(),
      course: String(formData.get('course') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      source: 'homepage',
    };

    try {
      const response = await fetch(apiBaseUrl + '/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(function () { return null; });

      if (!response.ok) {
        throw new Error((data && data.message) || 'Unable to submit membership form');
      }

      membershipForm.reset();
      setMembershipMessage('Your membership request has been sent. We will contact you soon.', 'success');
      window.setTimeout(function () {
        closeMembershipModal();
      }, 900);
    } catch (error) {
      setMembershipMessage(error.message, 'error');
    }
  }

  function handleMembershipModalClick(event) {
    if (!membershipModal) return;
    const closeTarget = event.target.closest('[data-membership-close]');
    if (closeTarget) {
      closeMembershipModal();
      return;
    }

    const openTarget = event.target.closest('[data-membership-open]');
    if (openTarget) {
      openMembershipModal(openTarget);
    }
  }

  function handleMembershipModalKeydown(event) {
    if (event.key === 'Escape' && membershipModal && !membershipModal.hidden) {
      closeMembershipModal();
    }
  }

  loadEventsSection();
  loadAnnouncementsSection();
  loadLeadershipSection();
  loadGallerySection();
  if (membershipOpenButton) {
    membershipOpenButton.addEventListener('click', function (event) {
      openMembershipModal(event.currentTarget);
    });
  }
  if (membershipModal) {
    document.addEventListener('click', handleMembershipModalClick);
    document.addEventListener('keydown', handleMembershipModalKeydown);
  }
  if (membershipForm) {
    membershipForm.addEventListener('submit', handleMembershipSubmit);
  }
});