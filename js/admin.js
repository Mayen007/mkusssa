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
  const refreshEventsBtn = document.getElementById('refresh-events-btn');
  const refreshLeadersBtn = document.getElementById('refresh-leaders-btn');

  function readStoredToken() {
    return sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey) || '';
  }

  let authToken = readStoredToken();
  let currentUser = null;

  function setStatus(element, text) {
    if (element) element.textContent = text;
  }

  function setMessage(element, text, tone) {
    if (!element) return;
    element.textContent = text || '';
    element.dataset.tone = tone || '';
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

  function renderListItem(title, metaLines, actionsHtml) {
    return `
      <article class="admin-item-card">
        <div class="admin-item-copy">
          <h4>${escapeHtml(title)}</h4>
          ${metaLines.map((line) => `<p>${line}</p>`).join('')}
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
      event.title,
      [
        `<span><strong>Status:</strong> ${escapeHtml(event.status || 'draft')}</span>`,
        `<span><strong>Date:</strong> ${escapeHtml(formatDate(event.eventDate))}</span>`,
        `<span><strong>Location:</strong> ${escapeHtml(event.location || 'N/A')}</span>`,
        `<span><strong>Featured:</strong> ${event.featured ? 'Yes' : 'No'}</span>`,
      ],
      `
        <button type="button" class="btn btn-secondary btn-small admin-delete-btn" data-delete-type="event" data-delete-id="${escapeHtml(event.id)}">Delete</button>
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
      `${leader.position || 'Leader'} - ${leader.fullName || ''}`,
      [
        `<span><strong>Term:</strong> ${escapeHtml(leader.termLabel || 'N/A')}</span>`,
        `<span><strong>Status:</strong> ${escapeHtml(leader.status || 'draft')}</span>`,
        `<span><strong>Current:</strong> ${leader.isCurrent ? 'Yes' : 'No'}</span>`,
        `<span><strong>Order:</strong> ${escapeHtml(String(leader.sortOrder ?? 0))}</span>`,
      ],
      `
        <button type="button" class="btn btn-secondary btn-small admin-delete-btn" data-delete-type="leader" data-delete-id="${escapeHtml(leader.id)}">Delete</button>
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

      renderEvents(Array.isArray(eventsResponse?.data) ? eventsResponse.data : []);
      renderLeaders(Array.isArray(leadersResponse?.data) ? leadersResponse.data : []);
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

  async function handleDeleteClick(event) {
    const button = event.target.closest('.admin-delete-btn');
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
  logoutBtn?.addEventListener('click', handleSignOut);
  refreshEventsBtn?.addEventListener('click', loadAdminData);
  refreshLeadersBtn?.addEventListener('click', loadAdminData);
  document.addEventListener('click', handleDeleteClick);

  verifySession();
});