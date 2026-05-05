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
  const eventForm = document.getElementById('event-create-form');
  const leaderForm = document.getElementById('leader-create-form');
  const eventMessage = document.getElementById('event-form-message');
  const leaderMessage = document.getElementById('leader-form-message');
  const eventsList = document.getElementById('events-list');
  const leadersList = document.getElementById('leaders-list');
  const refreshAllBtn = document.getElementById('refresh-all-btn');
  const eventEditModal = document.getElementById('event-edit-modal');
  const eventEditForm = document.getElementById('event-edit-form');
  const eventEditMessage = document.getElementById('event-edit-message');
  const leaderEditModal = document.getElementById('leader-edit-modal');
  const leaderEditForm = document.getElementById('leader-edit-form');
  const leaderEditMessage = document.getElementById('leader-edit-message');

  function readStoredToken() {
    return sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey) || '';
  }

  let authToken = readStoredToken();
  let currentUser = null;
  let editingEventId = '';
  let editingLeaderId = '';
  let eventEditTrigger = null;
  let leaderEditTrigger = null;
  let cachedEvents = [];
  let cachedLeaders = [];

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
    }, 220);
  }

  function resetEventEditForm() {
    if (eventEditForm) {
      eventEditForm.reset();
      const statusField = eventEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
      const featuredField = eventEditForm.querySelector('[name="featured"]');
      if (featuredField) featuredField.checked = false;
    }
    setMessage(eventEditMessage, '', '');
  }

  function resetLeaderEditForm() {
    if (leaderEditForm) {
      leaderEditForm.reset();
      const statusField = leaderEditForm.querySelector('[name="status"]');
      if (statusField) statusField.value = 'published';
      const currentField = leaderEditForm.querySelector('[name="isCurrent"]');
      if (currentField) currentField.checked = true;
    }
    setMessage(leaderEditMessage, '', '');
  }

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

  function openEventEditModal(eventData, triggerElement) {
    if (!eventEditForm || !eventEditModal) return;
    editingEventId = eventData?.id || '';
    eventEditTrigger = triggerElement || null;
    eventEditForm.querySelector('[name="title"]').value = eventData.title || '';
    eventEditForm.querySelector('[name="eventDate"]').value = eventData.eventDate ? String(eventData.eventDate).slice(0, 10) : '';
    eventEditForm.querySelector('[name="location"]').value = eventData.location || '';
    eventEditForm.querySelector('[name="description"]').value = eventData.description || '';
    eventEditForm.querySelector('[name="status"]').value = eventData.status || 'published';
    eventEditForm.querySelector('[name="featured"]').checked = Boolean(eventData.featured);
    setMessage(eventEditMessage, `Editing event: ${eventData.title || 'Untitled Event'}`, 'info');
    setModalVisible(eventEditModal, true);
  }

  function openLeaderEditModal(leaderData, triggerElement) {
    if (!leaderEditForm || !leaderEditModal) return;
    editingLeaderId = leaderData?.id || '';
    leaderEditTrigger = triggerElement || null;
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

    eventsList.innerHTML = events.map((event) => renderListItem(
      event.title || 'Untitled Event',
      [
        `<strong>Date:</strong> ${formatDate(event.eventDate)}`,
        `<strong>Location:</strong> ${escapeHtml(event.location || 'TBD')}`,
        event.description ? `<strong>Description:</strong> ${escapeHtml(event.description)}` : '',
        event.featured ? '<strong><i class="fas fa-star" aria-hidden="true"></i> Featured</strong>' : '',
      ].filter(Boolean),
      event.status || 'draft',
      (event.status || 'draft').toUpperCase(),
      `
        <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="event" data-edit-id="${escapeHtml(event.id)}">Edit</button>
        <button type="button" class="admin-item-btn-delete" data-delete-type="event" data-delete-id="${escapeHtml(event.id)}">Delete</button>
      `,
    )).join('');
  }

  function renderLeaders(leaders) {
    if (!leadersList) return;
    if (!leaders.length) {
      leadersList.innerHTML = '<p class="admin-empty">No leadership records returned by the API yet.</p>';
      return;
    }

    leadersList.innerHTML = leaders.map((leader) => renderListItem(
      leader.fullName || 'Unnamed Leader',
      [
        `<strong>Position:</strong> ${escapeHtml(leader.position || 'N/A')}`,
        `<strong>Term:</strong> ${escapeHtml(leader.termLabel || 'N/A')}`,
        leader.isCurrent ? '<strong><i class="fas fa-crown" aria-hidden="true"></i> Current</strong>' : '',
      ].filter(Boolean),
      leader.status || 'draft',
      (leader.status || 'draft').toUpperCase(),
      `
        <button type="button" class="btn btn-secondary btn-small admin-item-btn-edit" data-edit-type="leader" data-edit-id="${escapeHtml(leader.id)}">Edit</button>
        <button type="button" class="admin-item-btn-delete" data-delete-type="leader" data-delete-id="${escapeHtml(leader.id)}">Delete</button>
      `,
    )).join('');
  }

  async function loadAdminData() {
    if (!authToken || !isDashboardPage) return;

    try {
      const [eventsResponse, leadersResponse] = await Promise.all([
        apiRequest('/events/all'),
        apiRequest('/leaders/all'),
      ]);

      cachedEvents = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
      cachedLeaders = Array.isArray(leadersResponse?.data) ? leadersResponse.data : [];

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

  function buildEventPayload(formData) {
    return {
      title: String(formData.get('title') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      eventDate: String(formData.get('eventDate') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      imageUrl: String(formData.get('imageUrl') || '').trim(),
      registrationUrl: String(formData.get('registrationUrl') || '').trim(),
      status: String(formData.get('status') || 'published').trim(),
      featured: formData.get('featured') === 'on',
    };
  }

  function buildLeaderPayload(formData) {
    return {
      fullName: String(formData.get('fullName') || '').trim(),
      position: String(formData.get('position') || '').trim(),
      termLabel: String(formData.get('termLabel') || '').trim(),
      startDate: String(formData.get('startDate') || '').trim(),
      endDate: String(formData.get('endDate') || '').trim(),
      bio: String(formData.get('bio') || '').trim(),
      imageUrl: String(formData.get('imageUrl') || '').trim(),
      isCurrent: formData.get('isCurrent') === 'on',
      sortOrder: Number(formData.get('sortOrder') || 0),
      status: String(formData.get('status') || 'published').trim(),
    };
  }

  async function handleEventCreate(event) {
    event.preventDefault();
    setMessage(eventMessage, 'Saving event...', 'info');

    const formData = new FormData(eventForm);
    const payload = buildEventPayload(formData);

    try {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      eventForm.reset();
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

    const formData = new FormData(leaderForm);
    const payload = buildLeaderPayload(formData);

    try {
      await apiRequest('/leaders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      leaderForm.reset();
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

    const formData = new FormData(eventEditForm);
    const payload = buildEventPayload(formData);

    try {
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

    const formData = new FormData(leaderEditForm);
    const payload = buildLeaderPayload(formData);

    try {
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

    const confirmed = window.confirm(`Delete this ${itemType}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiRequest(`/${itemType === 'event' ? 'events' : 'leaders'}/${itemId}`, {
        method: 'DELETE',
      });

      await loadAdminData();
    } catch (error) {
      const targetMessage = itemType === 'event' ? eventMessage : leaderMessage;
      setMessage(targetMessage, error.message, 'error');
    }
  }

  function handleSignOut(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setAuthToken('');
    currentUser = null;
    closeEventEditModal();
    closeLeaderEditModal();
    updateAuthUi(false);
    if (isDashboardPage) {
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
  eventForm?.addEventListener('submit', handleEventCreate);
  leaderForm?.addEventListener('submit', handleLeaderCreate);
  eventEditForm?.addEventListener('submit', handleEventEditSubmit);
  leaderEditForm?.addEventListener('submit', handleLeaderEditSubmit);
  logoutBtn?.addEventListener('click', handleSignOut);
  refreshAllBtn?.addEventListener('click', loadAdminData);
  document.addEventListener('click', handleDeleteClick);

  document.addEventListener('click', function (event) {
    const closeTarget = event.target.closest('[data-modal-close]');
    if (!closeTarget) return;

    const modalType = closeTarget.dataset.modalClose;
    if (modalType === 'event') closeEventEditModal();
    if (modalType === 'leader') closeLeaderEditModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (eventEditModal && !eventEditModal.hidden) closeEventEditModal();
    if (leaderEditModal && !leaderEditModal.hidden) closeLeaderEditModal();
  });

  verifySession();
});