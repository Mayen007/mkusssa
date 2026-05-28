document.addEventListener('DOMContentLoaded', function () {
  const apiBaseUrl = (() => {
    const explicitBaseUrl = window.MKUSSSA_API_BASE_URL || document.querySelector('meta[name="mkusssa-api-base-url"]')?.content || '';
    return explicitBaseUrl.trim().replace(/\/$/, '');
  })();

  const isLoginPage = document.body.classList.contains('admin-login-page');
  const isDashboardPage = document.body.classList.contains('admin-page') && !isLoginPage;
  const dashboardUrl = './admin.html';
  const loginUrl = './admin-login.html';

  const tokenKey = 'mkusssa-admin-token';
  const loginPanel = document.getElementById('admin-login-panel');
  const dashboardPanel = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const loginMessage = document.getElementById('admin-login-message');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const sessionState = document.getElementById('admin-session-state');
  const sessionMeta = document.getElementById('admin-session-meta');
  const apiState = document.getElementById('admin-api-state');
  const apiMeta = document.getElementById('admin-api-meta');
  const roleState = document.getElementById('admin-role-state');
  const roleMeta = document.getElementById('admin-role-meta');
  const announcementForm = document.getElementById('announcement-create-form');
  const galleryForm = document.getElementById('gallery-create-form');
  const eventForm = document.getElementById('event-create-form');
  const leaderForm = document.getElementById('leader-create-form');
  const announcementMessage = document.getElementById('announcement-form-message');
  const galleryMessage = document.getElementById('gallery-form-message');
  const eventMessage = document.getElementById('event-form-message');
  const leaderMessage = document.getElementById('leader-form-message');
  const announcementsList = document.getElementById('announcements-list');
  const galleryList = document.getElementById('gallery-list');
  const membershipsList = document.getElementById('memberships-list');
  const eventsList = document.getElementById('events-list');
  const leadersList = document.getElementById('leaders-list');
  const refreshAllBtns = document.querySelectorAll('#refresh-all-btn, [data-refresh-all-btn]');
  const sidebarToggleBtn = document.querySelector('[data-sidebar-toggle]');
  const sidebarViewportQuery = window.matchMedia('(max-width: 960px)');
  const dashboardSidebarLinks = document.querySelectorAll('.admin-sidebar-link[href^="#"]');
  const adminDashboardPanel = document.getElementById('admin-dashboard-panel');
  const adminDashboardSectionsGrid = document.querySelector('.admin-dashboard-main .admin-sections-grid');
  const dashboardSections = Array.from(document.querySelectorAll('.admin-dashboard-main .admin-section'));
  const dashboardEmptyState = document.getElementById('admin-dashboard-empty');
  const announcementEditModal = document.getElementById('announcement-edit-modal');
  const announcementEditForm = document.getElementById('announcement-edit-form');
  const announcementEditMessage = document.getElementById('announcement-edit-message');
  const galleryEditModal = document.getElementById('gallery-edit-modal');
  const galleryEditForm = document.getElementById('gallery-edit-form');
  const galleryEditMessage = document.getElementById('gallery-edit-message');
  const galleryCreateImageFileInput = galleryForm?.querySelector('[name="imageFile"]');
  const galleryEditImageFileInput = galleryEditForm?.querySelector('[name="imageFile"]');
  const eventEditModal = document.getElementById('event-edit-modal');
  const eventEditForm = document.getElementById('event-edit-form');
  const eventEditMessage = document.getElementById('event-edit-message');
  const eventCreateImageFileInput = eventForm?.querySelector('[name="imageFile"]');
  const eventEditImageFileInput = eventEditForm?.querySelector('[name="imageFile"]');
  const leaderEditModal = document.getElementById('leader-edit-modal');
  const leaderEditForm = document.getElementById('leader-edit-form');
  const leaderEditMessage = document.getElementById('leader-edit-message');
  const leaderCreateImageFileInput = leaderForm?.querySelector('[name="imageFile"]');
  const leaderEditImageFileInput = leaderEditForm?.querySelector('[name="imageFile"]');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const deleteConfirmTitle = document.getElementById('delete-confirm-modal-title');
  const deleteConfirmMessage = document.getElementById('delete-confirm-message');
  const deleteConfirmSubmit = document.getElementById('delete-confirm-submit');

  function readStoredToken() {
    return sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey) || '';
  }

  let authToken = readStoredToken();
  let currentUser = null;
  let editingAnnouncementId = '';
  let editingGalleryId = '';
  let editingEventId = '';
  let editingLeaderId = '';
  let announcementEditTrigger = null;
  let galleryEditTrigger = null;
  let eventEditTrigger = null;
  let leaderEditTrigger = null;
  let activeDashboardSection = null;
  let pendingDeleteAction = null;
  let cachedAnnouncements = [];
  let cachedGalleryItems = [];
  let cachedMemberships = [];
  let cachedEvents = [];
  let cachedLeaders = [];
  let desktopSidebarCollapsed = false;
  let mobileSidebarOpen = false;

  function setStatus(element, text) {
    if (element) element.textContent = text;
  }

  function setMessage(element, text, tone) {
    if (!element) return;
    element.textContent = text || '';
    element.dataset.tone = tone || '';
  }

  function setModalVisible(modalElement, visible) {
    if (!modalElement) return;
    modalElement.setAttribute('aria-hidden', visible ? 'false' : 'true');

    if (visible) {
      modalElement.hidden = false;
      modalElement.classList.remove('is-closing');
      document.body.classList.add('no-scroll');
      requestAnimationFrame(() => {
        modalElement.classList.add('is-visible');
      });
      return;
    }

    modalElement.classList.remove('is-visible');
    modalElement.classList.add('is-closing');

    window.setTimeout(() => {
      modalElement.hidden = true;
      modalElement.classList.remove('is-closing');
      document.body.classList.remove('no-scroll');
    }, 220);
  }

  function syncSidebarTooltipTargets() {
    dashboardSidebarLinks.forEach((link) => {
      const label = link.querySelector('span')?.textContent?.trim() || '';
      if (label) {
        link.setAttribute('data-tooltip', label);
      }
    });

    refreshAllBtns.forEach((button) => {
      const label = button.querySelector('span')?.textContent?.trim() || button.getAttribute('title') || '';
      if (label) {
        button.setAttribute('data-tooltip', label);
      }
    });

    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute('data-tooltip', 'Toggle sidebar');
    }
  }

  function isMobileSidebarMode() {
    return sidebarViewportQuery.matches;
  }

  function applySidebarState() {
    const mobileMode = isMobileSidebarMode();
    const sidebarOpen = mobileMode ? mobileSidebarOpen : !desktopSidebarCollapsed;

    document.body.classList.toggle('admin-sidebar-collapsed', !mobileMode && desktopSidebarCollapsed);
    document.body.classList.toggle('admin-sidebar-open', mobileMode && mobileSidebarOpen);
    document.body.classList.toggle('no-scroll', mobileMode && mobileSidebarOpen);

    if (sidebarToggleBtn) {
      const label = sidebarToggleBtn.querySelector('span');
      const icon = sidebarToggleBtn.querySelector('i');
      sidebarToggleBtn.setAttribute('aria-expanded', sidebarOpen ? 'true' : 'false');
      sidebarToggleBtn.setAttribute('aria-label', mobileMode ? (sidebarOpen ? 'Close sidebar' : 'Open sidebar') : (desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'));
      if (label) {
        label.textContent = mobileMode ? (sidebarOpen ? 'Close' : 'Menu') : (desktopSidebarCollapsed ? 'Expand' : 'Collapse');
      }
      if (icon) {
        icon.classList.toggle('fa-angles-left', !mobileMode && !desktopSidebarCollapsed);
        icon.classList.toggle('fa-angles-right', !mobileMode && desktopSidebarCollapsed);
        icon.classList.toggle('fa-bars', mobileMode && !sidebarOpen);
        icon.classList.toggle('fa-xmark', mobileMode && sidebarOpen);
      }
    }

    localStorage.setItem('mkusssa-admin-sidebar-collapsed', desktopSidebarCollapsed ? 'true' : 'false');
  }

  function setSidebarCollapsed(collapsed) {
    desktopSidebarCollapsed = collapsed;
    applySidebarState();
  }

  function setMobileSidebarOpen(open) {
    mobileSidebarOpen = open;
    applySidebarState();
  }

  function setActiveSidebarLink(activeSectionId) {
    dashboardSidebarLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${activeSectionId}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function showDashboardSection(sectionId) {
    const nextSectionId = sectionId || '';
    const hasSelection = Boolean(nextSectionId);
    const nextSection = hasSelection ? dashboardSections.find((section) => section.id === nextSectionId) || null : null;

    if (!adminDashboardPanel || !adminDashboardSectionsGrid) {
      return;
    }

    if (activeDashboardSection && activeDashboardSection !== nextSection) {
      adminDashboardSectionsGrid.appendChild(activeDashboardSection);
    }

    activeDashboardSection = null;

    if (!hasSelection || !nextSection) {
      adminDashboardPanel.replaceChildren(dashboardEmptyState);
      adminDashboardSectionsGrid.hidden = true;
      setActiveSidebarLink('');
      return;
    }

    nextSection.hidden = false;
    nextSection.setAttribute('aria-hidden', 'false');
    adminDashboardPanel.replaceChildren(nextSection);
    adminDashboardSectionsGrid.hidden = true;
    activeDashboardSection = nextSection;
    setActiveSidebarLink(nextSectionId);
  }

  function resetEventEditForm() {
    if (eventEditForm) {
      eventEditForm.reset();
      const statusField = eventEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
      const featuredField = eventEditForm.querySelector('[name="featured"]');
      if (featuredField) featuredField.checked = false;
      const fileInput = eventEditForm.querySelector('[name="imageFile"]');
      if (fileInput) fileInput.value = '';
    }
    setMessage(eventEditMessage, '', '');
  }

  function resetAnnouncementEditForm() {
    if (announcementEditForm) {
      announcementEditForm.reset();
      const statusField = announcementEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
      const priorityField = announcementEditForm.querySelector('[name="priority"]');
      if (priorityField) priorityField.value = 'normal';
    }
    setMessage(announcementEditMessage, '', '');
  }

  function resetGalleryEditForm() {
    if (galleryEditForm) {
      galleryEditForm.reset();
      if (galleryEditImageFileInput) {
        galleryEditImageFileInput.value = '';
      }
      const statusField = galleryEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
    }
    setMessage(galleryEditMessage, '', '');
  }

  function resetLeaderEditForm() {
    if (leaderEditForm) {
      leaderEditForm.reset();
      const statusField = leaderEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
      const currentField = leaderEditForm.querySelector('[name="isCurrent"]');
      if (currentField) currentField.checked = true;
      const fileInput = leaderEditForm.querySelector('[name="imageFile"]');
      if (fileInput) fileInput.value = '';
    }
    setMessage(leaderEditMessage, '', '');
  }

  async function uploadImageFile(file, messageElement, uploadLabel) {
    if (!file) {
      return '';
    }

    if (!apiBaseUrl) {
      throw new Error('Missing API base URL');
    }

    setMessage(messageElement, `${uploadLabel} image to Cloudinary...`, 'info');

    const formData = new FormData();
    formData.append('image', file);

    const response = await apiRequest('/uploads/image', {
      method: 'POST',
      body: formData,
    });

    const imageUrl = response?.data?.imageUrl || response?.data?.secureUrl || response?.imageUrl || '';

    if (!imageUrl) {
      throw new Error('Image upload did not return a usable URL');
    }

    return imageUrl;
  }

  async function syncGalleryImageUrlFromFile(formElement, messageElement, uploadLabel) {
    if (!formElement) {
      return;
    }

    const fileInput = formElement.querySelector('[name="imageFile"]');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const uploadedUrl = await uploadImageFile(fileInput.files[0], messageElement, uploadLabel);

    // Store the URL as a data attribute
    formElement.dataset.imageUrl = uploadedUrl;
  }

  async function syncEventImageUrlFromFile(formElement, messageElement, uploadLabel) {
    if (!formElement) {
      return;
    }

    const fileInput = formElement.querySelector('[name="imageFile"]');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const uploadedUrl = await uploadImageFile(fileInput.files[0], messageElement, uploadLabel);

    // Store the URL as a data attribute
    formElement.dataset.imageUrl = uploadedUrl;
  }

  async function syncLeaderImageUrlFromFile(formElement, messageElement, uploadLabel) {
    if (!formElement) {
      return;
    }

    const fileInput = formElement.querySelector('[name="imageFile"]');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const uploadedUrl = await uploadImageFile(fileInput.files[0], messageElement, uploadLabel);

    // Store the URL as a data attribute
    formElement.dataset.imageUrl = uploadedUrl;
  }

  dashboardSections.forEach((section) => {
    section.remove();
  });

  const storedSidebarState = localStorage.getItem('mkusssa-admin-sidebar-collapsed');
  desktopSidebarCollapsed = storedSidebarState ? storedSidebarState === 'true' : false;
  mobileSidebarOpen = false;
  applySidebarState();

  dashboardSidebarLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';

      if (!href.startsWith('#')) {
        return;
      }

      event.preventDefault();
      showDashboardSection(href.slice(1));

      if (isMobileSidebarMode()) {
        setMobileSidebarOpen(false);
      }
    });
  });

  showDashboardSection('');

  sidebarToggleBtn?.addEventListener('click', function () {
    if (isMobileSidebarMode()) {
      setMobileSidebarOpen(!mobileSidebarOpen);
      return;
    }

    setSidebarCollapsed(!desktopSidebarCollapsed);
  });

  sidebarViewportQuery.addEventListener('change', function () {
    mobileSidebarOpen = false;
    applySidebarState();
  });

  syncSidebarTooltipTargets();

  function returnFocusToTrigger(triggerElement) {
    if (triggerElement && typeof triggerElement.focus === 'function' && triggerElement.isConnected) {
      window.setTimeout(() => {
        triggerElement.focus({ preventScroll: true });
      }, 220);
    }
  }

  function closeEventEditModal() {
    editingEventId = '';
    if (eventEditModal?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    resetEventEditForm();
    setModalVisible(eventEditModal, false);
    returnFocusToTrigger(eventEditTrigger);
    eventEditTrigger = null;
  }

  function closeLeaderEditModal() {
    editingLeaderId = '';
    if (leaderEditModal?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    resetLeaderEditForm();
    setModalVisible(leaderEditModal, false);
    returnFocusToTrigger(leaderEditTrigger);
    leaderEditTrigger = null;
  }

  function closeAnnouncementEditModal() {
    editingAnnouncementId = '';
    if (announcementEditModal?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    resetAnnouncementEditForm();
    setModalVisible(announcementEditModal, false);
    returnFocusToTrigger(announcementEditTrigger);
    announcementEditTrigger = null;
  }

  function closeGalleryEditModal() {
    editingGalleryId = '';
    if (galleryEditModal?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    resetGalleryEditForm();
    setModalVisible(galleryEditModal, false);
    returnFocusToTrigger(galleryEditTrigger);
    galleryEditTrigger = null;
  }

  function openEventEditModal(eventData, triggerElement) {
    if (!eventEditForm || !eventEditModal) return;
    editingEventId = eventData?.id || '';
    eventEditTrigger = triggerElement || null;
    if (eventEditImageFileInput) {
      eventEditImageFileInput.value = '';
    }
    // Store existing image URL in data attribute so it can be used if no new file is uploaded
    eventEditForm.dataset.imageUrl = eventData.imageUrl || '';
    eventEditForm.querySelector('[name="title"]').value = eventData.title || '';
    eventEditForm.querySelector('[name="eventDate"]').value = eventData.eventDate ? String(eventData.eventDate).slice(0, 10) : '';
    eventEditForm.querySelector('[name="location"]').value = eventData.location || '';
    eventEditForm.querySelector('[name="description"]').value = eventData.description || '';
    eventEditForm.querySelector('[name="status"]').value = eventData.status || 'published';
    eventEditForm.querySelector('[name="featured"]').checked = Boolean(eventData.featured);
    setMessage(eventEditMessage, `Editing event: ${eventData.title || 'Untitled Event'}`, 'info');
    setModalVisible(eventEditModal, true);
  }

  function openAnnouncementEditModal(announcementData, triggerElement) {
    if (!announcementEditForm || !announcementEditModal) return;
    editingAnnouncementId = announcementData?.id || '';
    announcementEditTrigger = triggerElement || null;
    announcementEditForm.querySelector('[name="title"]').value = announcementData.title || '';
    announcementEditForm.querySelector('[name="body"]').value = announcementData.body || '';
    announcementEditForm.querySelector('[name="priority"]').value = announcementData.priority || 'normal';
    announcementEditForm.querySelector('[name="status"]').value = announcementData.status || 'published';
    announcementEditForm.querySelector('[name="expiresAt"]').value = announcementData.expiresAt ? String(announcementData.expiresAt).slice(0, 10) : '';
    setMessage(announcementEditMessage, `Editing announcement: ${announcementData.title || 'Untitled Announcement'}`, 'info');
    setModalVisible(announcementEditModal, true);
  }

  function openGalleryEditModal(galleryData, triggerElement) {
    if (!galleryEditForm || !galleryEditModal) return;
    editingGalleryId = galleryData?.id || '';
    galleryEditTrigger = triggerElement || null;
    if (galleryEditImageFileInput) {
      galleryEditImageFileInput.value = '';
    }
    // Store existing image URL in data attribute so it can be used if no new file is uploaded
    galleryEditForm.dataset.imageUrl = galleryData.imageUrl || '';
    galleryEditForm.querySelector('[name="title"]').value = galleryData.title || '';
    galleryEditForm.querySelector('[name="caption"]').value = galleryData.caption || '';
    galleryEditForm.querySelector('[name="album"]').value = galleryData.album || '';
    galleryEditForm.querySelector('[name="tags"]').value = Array.isArray(galleryData.tags) ? galleryData.tags.join(', ') : '';
    galleryEditForm.querySelector('[name="status"]').value = galleryData.status || 'published';
    setMessage(galleryEditMessage, `Editing gallery item: ${galleryData.title || 'Untitled Item'}`, 'info');
    setModalVisible(galleryEditModal, true);
  }

  function openLeaderEditModal(leaderData, triggerElement) {
    if (!leaderEditForm || !leaderEditModal) return;
    editingLeaderId = leaderData?.id || '';
    leaderEditTrigger = triggerElement || null;
    if (leaderEditImageFileInput) {
      leaderEditImageFileInput.value = '';
    }
    // Store existing image URL in data attribute so it can be used if no new file is uploaded
    leaderEditForm.dataset.imageUrl = leaderData.imageUrl || '';
    leaderEditForm.querySelector('[name="fullName"]').value = leaderData.fullName || '';
    leaderEditForm.querySelector('[name="position"]').value = leaderData.position || '';
    leaderEditForm.querySelector('[name="termLabel"]').value = leaderData.termLabel || '';
    leaderEditForm.querySelector('[name="sortOrder"]').value = leaderData.sortOrder ?? 0;
    leaderEditForm.querySelector('[name="bio"]').value = leaderData.bio || '';
    leaderEditForm.querySelector('[name="status"]').value = leaderData.status || 'published';
    leaderEditForm.querySelector('[name="isCurrent"]').checked = Boolean(leaderData.isCurrent);
    setMessage(leaderEditMessage, `Editing member: ${leaderData.fullName || 'Unnamed Leader'}`, 'info');
    setModalVisible(leaderEditModal, true);
  }

  function getDeleteConfirmLabel(itemType) {
    if (itemType === 'event') return 'Delete Event';
    if (itemType === 'leader') return 'Delete Leader';
    if (itemType === 'gallery') return 'Delete Gallery Item';
    return 'Delete Announcement';
  }

  function openDeleteConfirmModal(itemType, itemId) {
    if (!deleteConfirmModal || !deleteConfirmSubmit) return;

    pendingDeleteAction = { itemType, itemId };
    if (deleteConfirmTitle) {
      deleteConfirmTitle.textContent = getDeleteConfirmLabel(itemType);
    }
    if (deleteConfirmMessage) {
      deleteConfirmMessage.textContent = `Delete this ${itemType}?`;
    }

    deleteConfirmSubmit.textContent = 'Delete';
    deleteConfirmSubmit.dataset.deleteType = itemType;
    deleteConfirmSubmit.dataset.deleteId = itemId;
    setModalVisible(deleteConfirmModal, true);
  }

  function closeDeleteConfirmModal() {
    if (!deleteConfirmModal || !deleteConfirmSubmit) return;

    pendingDeleteAction = null;
    deleteConfirmSubmit.removeAttribute('data-delete-type');
    deleteConfirmSubmit.removeAttribute('data-delete-id');
    setModalVisible(deleteConfirmModal, false);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  function renderAnnouncements(announcements) {
    if (!announcementsList) return;
    if (!announcements.length) {
      announcementsList.innerHTML = '<p class="admin-empty">No announcements returned by the API yet.</p>';
      return;
    }

    announcementsList.innerHTML = announcements.map((announcement) => renderListItem(
      announcement.title || 'Untitled Announcement',
      [
        `<strong>Body:</strong> ${escapeHtml(announcement.body || 'N/A')}`,
        `<strong>Priority:</strong> ${escapeHtml((announcement.priority || 'normal').toUpperCase())}`,
        `<strong>Expires:</strong> ${formatDate(announcement.expiresAt)}`,
      ],
      announcement.status || 'draft',
      (announcement.status || 'draft').toUpperCase(),
      `
        <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="announcement" data-edit-id="${escapeHtml(announcement.id)}">Edit</button>
        <button type="button" class="admin-item-btn-delete" data-delete-type="announcement" data-delete-id="${escapeHtml(announcement.id)}">Delete</button>
      `,
    )).join('');
  }

  function renderGalleryItems(galleryItems) {
    if (!galleryList) return;
    if (!galleryItems.length) {
      galleryList.innerHTML = '<p class="admin-empty">No gallery items returned by the API yet.</p>';
      return;
    }

    galleryList.innerHTML = galleryItems.map((item) => {
      const tagsLabel = Array.isArray(item.tags) && item.tags.length ? item.tags.map((tag) => escapeHtml(tag)).join(', ') : 'None';
      return `
        <article class="admin-item-card">
          ${item.imageUrl ? `<div class="admin-item-image"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title || 'Gallery item')}" /></div>` : ''}
          <div class="admin-item-header">
            <div class="admin-item-title">${escapeHtml(item.title || 'Untitled Gallery Item')}</div>
            ${item.status ? `<span class="admin-item-badge ${escapeHtml(item.status)}">${escapeHtml(String(item.status).toUpperCase())}</span>` : ''}
          </div>
          <div class="admin-item-meta">
            <span><strong>Album:</strong> ${escapeHtml(item.album || 'N/A')}</span>
            <span><strong>Tags:</strong> ${tagsLabel}</span>
          </div>
          <div class="admin-item-actions">
            <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="gallery" data-edit-id="${escapeHtml(item.id)}">Edit</button>
            <button type="button" class="admin-item-btn-delete" data-delete-type="gallery" data-delete-id="${escapeHtml(item.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderMemberships(memberships) {
    if (!membershipsList) return;
    if (!memberships.length) {
      membershipsList.innerHTML = '<p class="admin-empty">No membership submissions returned by the API yet.</p>';
      return;
    }

    membershipsList.innerHTML = `
      <div class="admin-table-wrapper">
        <table class="admin-memberships-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Reg. No.</th>
              <th>Course</th>
              <th>Message</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${memberships.map((submission) => `
              <tr>
                <td class="admin-table-name" data-label="Name">${escapeHtml(submission.fullName || 'N/A')}</td>
                <td class="admin-table-email" data-label="Email"><a href="mailto:${escapeHtml(submission.email || '')}">${escapeHtml(submission.email || 'N/A')}</a></td>
                <td data-label="Phone">${escapeHtml(submission.phone || 'N/A')}</td>
                <td data-label="Reg. No.">${escapeHtml(submission.registrationNumber || 'N/A')}</td>
                <td data-label="Course">${escapeHtml(submission.course || 'N/A')}</td>
                <td class="admin-table-message" data-label="Message" title="${escapeHtml(submission.message || 'N/A')}">${escapeHtml(submission.message?.substring(0, 50) || 'N/A')}${submission.message?.length > 50 ? '…' : ''}</td>
                <td data-label="Submitted">${formatDate(submission.createdAt)}</td>
                <td data-label="Status"><span class="admin-item-badge ${escapeHtml(submission.status || 'new')}">${escapeHtml(String(submission.status || 'new').toUpperCase())}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function setAuthToken(token) {
    authToken = token || '';
    if (authToken) {
      sessionStorage.setItem(tokenKey, authToken);
      localStorage.setItem(tokenKey, authToken);
    } else {
      sessionStorage.removeItem(tokenKey);
      localStorage.removeItem(tokenKey);
    }
  }

  function goToDashboard() {
    window.location.replace(dashboardUrl);
  }

  function goToLogin() {
    window.location.replace(loginUrl);
  }

  function updateAuthUi(loggedIn) {
    if (loginPanel) loginPanel.hidden = loggedIn;
    if (dashboardPanel) dashboardPanel.hidden = !loggedIn;
    if (logoutBtn) logoutBtn.hidden = !loggedIn;

    if (loggedIn && currentUser) {
      setStatus(sessionState, `Signed in as ${currentUser.name || currentUser.email}`);
      setStatus(roleState, String(currentUser.role || 'admin').toUpperCase());
      setStatus(sessionMeta, currentUser.email || 'Authenticated session active');
      setStatus(roleMeta, 'Write actions are restricted by backend role checks.');
    } else {
      setStatus(sessionState, 'Logged out');
      setStatus(roleState, 'Waiting');
      setStatus(sessionMeta, 'Use your admin credentials to continue.');
      setStatus(roleMeta, 'Admin or editor access required');
    }
  }

  async function apiRequest(path, options = {}) {
    if (!apiBaseUrl) {
      throw new Error('Missing API base URL');
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = null;
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function renderListItem(title, metaLines, badgeClass, badgeText, actionsHtml) {
    return `
      <article class="admin-item-card">
        <div class="admin-item-header">
          <div class="admin-item-title">${escapeHtml(title)}</div>
          ${badgeText ? `<span class="admin-item-badge ${badgeClass}">${escapeHtml(badgeText)}</span>` : ''}
        </div>
        <div class="admin-item-meta">
          ${metaLines.map((line) => `<span>${line}</span>`).join('')}
        </div>
        <div class="admin-item-actions">${actionsHtml}</div>
      </article>
    `;
  }

  function renderEvents(events) {
    if (!eventsList) return;
    if (!events.length) {
      eventsList.innerHTML = '<p class="admin-empty">No events returned by the API yet.</p>';
      return;
    }

    eventsList.innerHTML = events.map((event) => `
      <article class="admin-item-card">
        ${event.imageUrl ? `<div class="admin-item-image"><img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title || 'Event cover')}" /></div>` : ''}
        <div class="admin-item-header">
          <div class="admin-item-title">${escapeHtml(event.title || 'Untitled Event')}</div>
          <span class="admin-item-badge ${escapeHtml(event.status || 'draft')}">${escapeHtml(String(event.status || 'draft').toUpperCase())}</span>
        </div>
        <div class="admin-item-meta">
          <span><strong>Date:</strong> ${formatDate(event.eventDate)}</span>
          <span><strong>Location:</strong> ${escapeHtml(event.location || 'TBD')}</span>
          ${event.description ? `<span><strong>Description:</strong> ${escapeHtml(event.description)}</span>` : ''}
          ${event.featured ? '<span><strong><i class="fas fa-star" aria-hidden="true"></i> Featured</strong></span>' : ''}
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="event" data-edit-id="${escapeHtml(event.id)}">Edit</button>
          <button type="button" class="admin-item-btn-delete" data-delete-type="event" data-delete-id="${escapeHtml(event.id)}">Delete</button>
        </div>
      </article>
    `).join('');
  }

  function renderLeaders(leaders) {
    if (!leadersList) return;
    if (!leaders.length) {
      leadersList.innerHTML = '<p class="admin-empty">No leadership records returned by the API yet.</p>';
      return;
    }

    leadersList.innerHTML = leaders.map((leader) => `
      <article class="admin-item-card">
        ${leader.imageUrl ? `<div class="admin-item-image"><img src="${escapeHtml(leader.imageUrl)}" alt="${escapeHtml(leader.fullName || 'Leader portrait')}" /></div>` : ''}
        <div class="admin-item-header">
          <div class="admin-item-title">${escapeHtml(leader.fullName || 'Unnamed Leader')}</div>
          <span class="admin-item-badge ${escapeHtml(leader.status || 'draft')}">${escapeHtml(String(leader.status || 'draft').toUpperCase())}</span>
        </div>
        <div class="admin-item-meta">
          <span><strong>Position:</strong> ${escapeHtml(leader.position || 'N/A')}</span>
          <span><strong>Term:</strong> ${escapeHtml(leader.termLabel || 'N/A')}</span>
          ${leader.isCurrent ? '<span><strong><i class="fas fa-crown" aria-hidden="true"></i> Current</strong></span>' : ''}
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="leader" data-edit-id="${escapeHtml(leader.id)}">Edit</button>
          <button type="button" class="admin-item-btn-delete" data-delete-type="leader" data-delete-id="${escapeHtml(leader.id)}">Delete</button>
        </div>
      </article>
    `).join('');
  }

  async function loadAdminData() {
    if (!authToken || !isDashboardPage) return;

    try {
      const [eventsResponse, leadersResponse, announcementsResponse, galleryResponse, membershipsResponse] = await Promise.all([
        apiRequest('/events/all'),
        apiRequest('/leaders/all'),
        apiRequest('/announcements/all'),
        apiRequest('/gallery/all'),
        apiRequest('/memberships/all'),
      ]);

      cachedEvents = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
      cachedLeaders = Array.isArray(leadersResponse?.data) ? leadersResponse.data : [];
      cachedAnnouncements = Array.isArray(announcementsResponse?.data) ? announcementsResponse.data : [];
      cachedGalleryItems = Array.isArray(galleryResponse?.data) ? galleryResponse.data : [];
      cachedMemberships = Array.isArray(membershipsResponse?.data) ? membershipsResponse.data : [];

      renderAnnouncements(cachedAnnouncements);
      renderGalleryItems(cachedGalleryItems);
      renderMemberships(cachedMemberships);
      renderEvents(cachedEvents);
      renderLeaders(cachedLeaders);
      setStatus(apiState, 'Connected');
      setStatus(apiMeta, 'Admin endpoints are reachable.');
    } catch (error) {
      setStatus(apiState, 'Error');
      setStatus(apiMeta, error.message);
      if (error.status === 401 || error.status === 403) {
        handleSignOut();
      }
    }
  }

  async function verifySession() {
    if (!authToken) {
      updateAuthUi(false);
      setStatus(apiState, apiBaseUrl ? 'Ready' : 'Missing URL');
      setStatus(apiMeta, apiBaseUrl || 'API base URL not configured');
      if (isDashboardPage) {
        goToLogin();
      }
      return;
    }

    try {
      const response = await apiRequest('/auth/me');
      currentUser = response?.user || null;
      updateAuthUi(true);
      setStatus(apiState, 'Connected');
      setStatus(apiMeta, 'Authenticated API session active.');
      if (isLoginPage) {
        goToDashboard();
        return;
      }

      await loadAdminData();
    } catch (error) {
      handleSignOut();
      setStatus(apiState, 'Disconnected');
      setStatus(apiMeta, error.message);
      if (isDashboardPage) {
        goToLogin();
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage(loginMessage, 'Signing in...', 'info');

    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(response?.token || '');
      currentUser = response?.user || null;
      setMessage(loginMessage, 'Signed in successfully.', 'success');
      updateAuthUi(true);
      if (isLoginPage) {
        goToDashboard();
        return;
      }

      await loadAdminData();
    } catch (error) {
      setMessage(loginMessage, error.message, 'error');
    }
  }

  function buildEventPayload(formData, formElement) {
    return {
      title: String(formData.get('title') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      eventDate: String(formData.get('eventDate') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      imageUrl: String(formElement?.dataset?.imageUrl || '').trim(),
      registrationUrl: String(formData.get('registrationUrl') || '').trim(),
      status: String(formData.get('status') || 'published').trim(),
      featured: formData.get('featured') === 'on',
    };
  }

  function buildAnnouncementPayload(formData) {
    return {
      title: String(formData.get('title') || '').trim(),
      body: String(formData.get('body') || '').trim(),
      priority: String(formData.get('priority') || 'normal').trim(),
      status: String(formData.get('status') || 'published').trim(),
      expiresAt: String(formData.get('expiresAt') || '').trim(),
    };
  }

  function buildGalleryPayload(formData, formElement) {
    const tagsRaw = String(formData.get('tags') || '').trim();
    return {
      title: String(formData.get('title') || '').trim(),
      imageUrl: String(formElement?.dataset?.imageUrl || '').trim(),
      caption: String(formData.get('caption') || '').trim(),
      album: String(formData.get('album') || '').trim(),
      tags: tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      status: String(formData.get('status') || 'published').trim(),
    };
  }

  async function handleAnnouncementCreate(event) {
    event.preventDefault();
    setMessage(announcementMessage, 'Saving announcement...', 'info');

    const formData = new FormData(announcementForm);
    const payload = buildAnnouncementPayload(formData);

    try {
      await apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      announcementForm.reset();
      announcementForm.querySelector('[name="priority"]').value = 'normal';
      announcementForm.querySelector('[name="status"]').value = 'published';
      setMessage(announcementMessage, 'Announcement created successfully.', 'success');
      await loadAdminData();
    } catch (error) {
      setMessage(announcementMessage, error.message, 'error');
    }
  }

  async function handleAnnouncementEditSubmit(event) {
    event.preventDefault();
    if (!editingAnnouncementId) return;

    setMessage(announcementEditMessage, 'Updating announcement...', 'info');

    const formData = new FormData(announcementEditForm);
    const payload = buildAnnouncementPayload(formData);

    try {
      await apiRequest(`/announcements/${editingAnnouncementId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      closeAnnouncementEditModal();
      await loadAdminData();
    } catch (error) {
      setMessage(announcementEditMessage, error.message, 'error');
    }
  }

  async function handleGalleryCreate(event) {
    event.preventDefault();
    setMessage(galleryMessage, 'Saving gallery item...', 'info');

    try {

      await syncGalleryImageUrlFromFile(galleryForm, galleryMessage, 'Uploading');

      const formData = new FormData(galleryForm);
      const payload = buildGalleryPayload(formData, galleryForm);

      if (!payload.imageUrl) {
        throw new Error('Please upload an image');
      }

      await apiRequest('/gallery', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      galleryForm.reset();
      delete galleryForm.dataset.imageUrl;
      if (galleryCreateImageFileInput) {
        galleryCreateImageFileInput.value = '';
      }
      galleryForm.querySelector('[name="status"]').value = 'published';
      setMessage(galleryMessage, 'Gallery item created successfully.', 'success');
      await loadAdminData();
    } catch (error) {
      setMessage(galleryMessage, error.message, 'error');
    }
  }

  async function handleGalleryEditSubmit(event) {
    event.preventDefault();
    if (!editingGalleryId) return;

    setMessage(galleryEditMessage, 'Updating gallery item...', 'info');

    try {
      await syncGalleryImageUrlFromFile(galleryEditForm, galleryEditMessage, 'Uploading');

      const formData = new FormData(galleryEditForm);
      const payload = buildGalleryPayload(formData, galleryEditForm);

      if (!payload.imageUrl) {
        throw new Error('Please upload an image');
      }

      await apiRequest(`/gallery/${editingGalleryId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      closeGalleryEditModal();
      await loadAdminData();
    } catch (error) {
      setMessage(galleryEditMessage, error.message, 'error');
    }
  }

  function buildLeaderPayload(formData, formElement) {
    return {
      fullName: String(formData.get('fullName') || '').trim(),
      position: String(formData.get('position') || '').trim(),
      termLabel: String(formData.get('termLabel') || '').trim(),
      startDate: String(formData.get('startDate') || '').trim(),
      endDate: String(formData.get('endDate') || '').trim(),
      bio: String(formData.get('bio') || '').trim(),
      imageUrl: String(formElement?.dataset?.imageUrl || '').trim(),
      isCurrent: formData.get('isCurrent') === 'on',
      sortOrder: Number(formData.get('sortOrder') || 0),
      status: String(formData.get('status') || 'published').trim(),
    };
  }

  async function handleEventCreate(event) {
    event.preventDefault();
    setMessage(eventMessage, 'Saving event...', 'info');

    try {
      await syncEventImageUrlFromFile(eventForm, eventMessage, 'Uploading');

      const formData = new FormData(eventForm);
      const payload = buildEventPayload(formData, eventForm);

      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      eventForm.reset();
      delete eventForm.dataset.imageUrl;
      if (eventCreateImageFileInput) {
        eventCreateImageFileInput.value = '';
      }
      eventForm.querySelector('[name="status"]').value = 'published';
      setMessage(eventMessage, 'Event created successfully.', 'success');
      await loadAdminData();
    } catch (error) {
      setMessage(eventMessage, error.message, 'error');
    }
  }

  async function handleLeaderCreate(event) {
    event.preventDefault();
    setMessage(leaderMessage, 'Saving leadership record...', 'info');

    try {
      await syncLeaderImageUrlFromFile(leaderForm, leaderMessage, 'Uploading');

      const formData = new FormData(leaderForm);
      const payload = buildLeaderPayload(formData, leaderForm);

      if (!payload.imageUrl) {
        throw new Error('Please upload a portrait image');
      }

      await apiRequest('/leaders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      leaderForm.reset();
      delete leaderForm.dataset.imageUrl;
      if (leaderCreateImageFileInput) {
        leaderCreateImageFileInput.value = '';
      }
      leaderForm.querySelector('[name="status"]').value = 'published';
      leaderForm.querySelector('[name="isCurrent"]').checked = true;
      setMessage(leaderMessage, 'Leadership record created successfully.', 'success');
      await loadAdminData();
    } catch (error) {
      setMessage(leaderMessage, error.message, 'error');
    }
  }

  async function handleEventEditSubmit(event) {
    event.preventDefault();
    if (!editingEventId) return;

    setMessage(eventEditMessage, 'Updating event...', 'info');

    try {
      await syncEventImageUrlFromFile(eventEditForm, eventEditMessage, 'Uploading');

      const formData = new FormData(eventEditForm);
      const payload = buildEventPayload(formData, eventEditForm);

      await apiRequest(`/events/${editingEventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      closeEventEditModal();
      await loadAdminData();
    } catch (error) {
      setMessage(eventEditMessage, error.message, 'error');
    }
  }

  async function handleLeaderEditSubmit(event) {
    event.preventDefault();
    if (!editingLeaderId) return;

    setMessage(leaderEditMessage, 'Updating leadership record...', 'info');

    try {
      await syncLeaderImageUrlFromFile(leaderEditForm, leaderEditMessage, 'Uploading');

      const formData = new FormData(leaderEditForm);
      const payload = buildLeaderPayload(formData, leaderEditForm);

      if (!payload.imageUrl) {
        throw new Error('Please upload a portrait image');
      }

      await apiRequest(`/leaders/${editingLeaderId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      closeLeaderEditModal();
      await loadAdminData();
    } catch (error) {
      setMessage(leaderEditMessage, error.message, 'error');
    }
  }

  async function handleDeleteClick(event) {
    const editButton = event.target.closest('.admin-item-btn-edit');
    if (editButton) {
      const itemType = editButton.dataset.editType;
      const itemId = editButton.dataset.editId;

      if (itemType === 'announcement') {
        const announcementData = cachedAnnouncements.find((item) => item.id === itemId);
        if (!announcementData) return;

        openAnnouncementEditModal(announcementData, editButton);
        return;
      }

      if (itemType === 'gallery') {
        const galleryData = cachedGalleryItems.find((item) => item.id === itemId);
        if (!galleryData) return;

        openGalleryEditModal(galleryData, editButton);
        return;
      }

      if (itemType === 'event') {
        const eventData = cachedEvents.find((item) => item.id === itemId);
        if (!eventData) return;

        openEventEditModal(eventData, editButton);
        return;
      }

      if (itemType === 'leader') {
        const leaderData = cachedLeaders.find((item) => item.id === itemId);
        if (!leaderData) return;

        openLeaderEditModal(leaderData, editButton);
        return;
      }

      return;
    }

    const button = event.target.closest('.admin-item-btn-delete');
    if (!button) return;

    const itemType = button.dataset.deleteType;
    const itemId = button.dataset.deleteId;
    if (!itemType || !itemId) return;

    openDeleteConfirmModal(itemType, itemId);
  }

  async function handleDeleteConfirmSubmit() {
    if (!pendingDeleteAction) return;

    const { itemType, itemId } = pendingDeleteAction;

    try {
      const endpoint = itemType === 'event' ? 'events' : itemType === 'leader' ? 'leaders' : itemType === 'gallery' ? 'gallery' : 'announcements';
      await apiRequest(`/${endpoint}/${itemId}`, {
        method: 'DELETE',
      });

      closeDeleteConfirmModal();
      await loadAdminData();
    } catch (error) {
      closeDeleteConfirmModal();
      const targetMessage = itemType === 'event' ? eventMessage : itemType === 'leader' ? leaderMessage : itemType === 'gallery' ? galleryMessage : announcementMessage;
      setMessage(targetMessage, error.message, 'error');
    }
  }

  function handleSignOut(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setAuthToken('');
    currentUser = null;
    closeAnnouncementEditModal();
    closeGalleryEditModal();
    closeEventEditModal();
    closeLeaderEditModal();
    updateAuthUi(false);
    if (isDashboardPage) {
      renderAnnouncements([]);
      renderGalleryItems([]);
      renderMemberships([]);
      renderEvents([]);
      renderLeaders([]);
      goToLogin();
      return;
    }

    setMessage(loginMessage, 'You have been signed out.', 'success');
  }

  if (!apiBaseUrl) {
    setStatus(apiState, 'Missing URL');
    setStatus(apiMeta, 'Add the mkusssa-api-base-url meta tag.');
  } else {
    setStatus(apiState, 'Ready');
    setStatus(apiMeta, apiBaseUrl);
  }

  loginForm?.addEventListener('submit', handleLogin);
  announcementForm?.addEventListener('submit', handleAnnouncementCreate);
  galleryForm?.addEventListener('submit', handleGalleryCreate);
  eventForm?.addEventListener('submit', handleEventCreate);
  leaderForm?.addEventListener('submit', handleLeaderCreate);
  announcementEditForm?.addEventListener('submit', handleAnnouncementEditSubmit);
  galleryEditForm?.addEventListener('submit', handleGalleryEditSubmit);
  eventEditForm?.addEventListener('submit', handleEventEditSubmit);
  leaderEditForm?.addEventListener('submit', handleLeaderEditSubmit);
  deleteConfirmSubmit?.addEventListener('click', handleDeleteConfirmSubmit);
  logoutBtn?.addEventListener('click', handleSignOut);
  refreshAllBtns.forEach((button) => button.addEventListener('click', loadAdminData));
  document.addEventListener('click', handleDeleteClick);

  document.addEventListener('click', function (event) {
    const closeTarget = event.target.closest('[data-modal-close]');
    if (!closeTarget) return;

    if (closeTarget.classList.contains('admin-modal-backdrop')) return;

    const modalType = closeTarget.dataset.modalClose;
    if (modalType === 'announcement') closeAnnouncementEditModal();
    if (modalType === 'gallery') closeGalleryEditModal();
    if (modalType === 'event') closeEventEditModal();
    if (modalType === 'leader') closeLeaderEditModal();
    if (modalType === 'delete-confirm') closeDeleteConfirmModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (isMobileSidebarMode() && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
      return;
    }
    if (announcementEditModal && !announcementEditModal.hidden) closeAnnouncementEditModal();
    if (galleryEditModal && !galleryEditModal.hidden) closeGalleryEditModal();
    if (eventEditModal && !eventEditModal.hidden) closeEventEditModal();
    if (leaderEditModal && !leaderEditModal.hidden) closeLeaderEditModal();
    if (deleteConfirmModal && !deleteConfirmModal.hidden) closeDeleteConfirmModal();
  });

  const adminApp = document.querySelector('.admin-app');
  if (adminApp) {
    adminApp.addEventListener('click', function (event) {
      if (event.target === adminApp && isMobileSidebarMode() && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    });
  }

  verifySession();
});