const state = {
  token: localStorage.getItem('token'),
  user: null,
  activePage: 'home',
  sockets: {},
  pendingSlotKey: null,
  selectedScenario: 'Похищение',
  quests: []
};

const pageButtons = document.querySelectorAll('[data-page]');
const pages = document.querySelectorAll('.page');
const statusText = document.getElementById('statusText');
const notificationList = document.getElementById('notificationList');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const messengerLink = document.getElementById('messengerLink');
const actorLink = document.getElementById('actorLink');
const adminLink = document.getElementById('adminLink');
const messengerAccess = document.getElementById('messengerAccess');
const messengerApp = document.getElementById('messengerApp');
const messengerLocked = document.getElementById('messengerLocked');
const messagesEl = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const mediaInput = document.getElementById('mediaInput');
const wallpaperButtons = document.querySelectorAll('.wallpaper-button');
const actorLocked = document.getElementById('actorLocked');
const actorContent = document.getElementById('actorContent');
const actorBoard = document.getElementById('actorBoard');
const actorMessagesEl = document.getElementById('actorMessages');
const actorChatForm = document.getElementById('actorChatForm');
const actorMessageInput = document.getElementById('actorMessageInput');
const actorMediaInput = document.getElementById('actorMediaInput');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const authClose = document.getElementById('authClose');
const authTabs = document.querySelectorAll('.tab-button');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authInviteCode = document.getElementById('authInviteCode');
const messengerRoleBadge = document.getElementById('messengerRoleBadge');
const adminLocked = document.getElementById('adminLocked');
const adminContent = document.getElementById('adminContent');
const statsGrid = document.getElementById('statsGrid');
const usersList = document.getElementById('usersList');
const bookingsList = document.getElementById('bookingsList');
const teamApplicationsList = document.getElementById('teamApplicationsList');
const adminMessagesEl = document.getElementById('adminMessages');
const adminChatForm = document.getElementById('adminChatForm');
const adminMessageInput = document.getElementById('adminMessageInput');
const adminMediaInput = document.getElementById('adminMediaInput');
const profilePreview = document.getElementById('profilePreview');
const adminProfilePreview = document.getElementById('adminProfilePreview');
const profileForm = document.getElementById('profileForm');
const adminProfileForm = document.getElementById('adminProfileForm');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const profileAvatarInput = document.getElementById('profileAvatarInput');
const profileBackgroundInput = document.getElementById('profileBackgroundInput');
const profileBackgroundPreview = document.getElementById('profileBackgroundPreview');
const adminProfileName = document.getElementById('adminProfileName');
const adminProfileBio = document.getElementById('adminProfileBio');
const adminAvatarInput = document.getElementById('adminAvatarInput');
const adminBackgroundInput = document.getElementById('adminBackgroundInput');
const adminBackgroundPreview = document.getElementById('adminBackgroundPreview');
const questsGrid = document.getElementById('questsGrid');
const scheduleAdminPanel = document.getElementById('scheduleAdminPanel');
const questAdminPanel = document.getElementById('questAdminPanel');
const questForm = document.getElementById('questForm');
const questId = document.getElementById('questId');
const questTitle = document.getElementById('questTitle');
const questDescription = document.getElementById('questDescription');
const questImageUrl = document.getElementById('questImageUrl');
const cancelQuestEdit = document.getElementById('cancelQuestEdit');
const scheduleGrid = document.getElementById('scheduleGrid');
const scenarioSelect = document.getElementById('scenarioSelect');
const bookingComment = document.getElementById('bookingComment');
const bookingForm = document.getElementById('bookingForm');
const selectedSlotNote = document.getElementById('selectedSlotNote');
const teamFormContainer = document.getElementById('teamFormContainer');

let authMode = 'login';

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Ошибка запроса');
  }
  return result;
}

function setPage(page) {
  state.activePage = page;
  pageButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === page);
  });
  pages.forEach((section) => {
    section.classList.toggle('active', section.id === page);
  });
  if (page === 'quests') {
    loadQuests();
  }
  if (page === 'schedule') {
    loadSchedule();
  }
  if (page === 'messenger') {
    renderMessenger();
  }
  if (page === 'actor') {
    renderActorArea();
  }
  if (page === 'admin') {
    renderAdminArea();
  }
  if (page === 'team') {
    renderTeamForms();
  }
}

function setUser(user, token) {
  state.user = user;
  if (token) {
    state.token = token;
    localStorage.setItem('token', token);
  }
  if (!user) {
    state.token = null;
    localStorage.removeItem('token');
  }
  updateHeader();
}

function updateHeader() {
  const isAuthorized = Boolean(state.user);
  if (!isAuthorized) {
    statusText.textContent = 'Не авторизованы';
    loginButton.hidden = false;
    logoutButton.hidden = true;
    messengerLink.hidden = true;
    actorLink.hidden = true;
    adminLink.hidden = true;
  } else {
    statusText.textContent = `Вы: ${state.user.username} (${state.user.role})`;
    loginButton.hidden = true;
    logoutButton.hidden = false;
    messengerLink.hidden = !state.user.access;
    actorLink.hidden = !state.user.access || (state.user.role !== 'actor' && state.user.role !== 'admin' && state.user.role !== 'creator');
    adminLink.hidden = state.user.role !== 'admin' && state.user.role !== 'creator';
  }
}

async function loadUser() {
  if (!state.token) {
    setUser(null);
    return;
  }
  try {
    const result = await api('/user');
    setUser(result.user);
    await loadNotifications();
    renderProfileForms();
  } catch (err) {
    setUser(null);
  }
}

async function loadNotifications() {
  if (!state.user) {
    notificationList.innerHTML = '';
    return;
  }
  try {
    const result = await api('/notifications');
    notificationList.innerHTML = result.notifications?.length
      ? result.notifications.map((item) => `<div class="notification-item">${escapeHtml(item.text)}</div>`).join('')
      : '<div class="notification-item">Уведомлений нет.</div>';
  } catch (err) {
    notificationList.innerHTML = '<div class="notification-item">Не удалось загрузить уведомления.</div>';
  }
}

function showAuthModal() {
  authModal.classList.add('open');
  authError.hidden = true;
  authUsername.value = '';
  authPassword.value = '';
  authInviteCode.value = '';
}

function hideAuthModal() {
  authModal.classList.remove('open');
}

function setAuthTab(tab) {
  authMode = tab;
  authTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
}

async function loginOrRegister(event) {
  event.preventDefault();
  const username = authUsername.value.trim();
  const password = authPassword.value.trim();
  if (!username || !password) return;
  try {
    const result = await api(authMode === 'login' ? '/login' : '/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, inviteCode: authInviteCode.value.trim() })
    });
    setUser(result.user, result.token);
    await loadNotifications();
    renderProfileForms();
    hideAuthModal();
    setPage('home');
  } catch (err) {
    authError.hidden = false;
    authError.textContent = err.message;
  }
}

function logout() {
  setUser(null);
  notificationList.innerHTML = '';
  Object.values(state.sockets).forEach((socket) => socket.close());
  state.sockets = {};
}

async function loadQuests() {
  try {
    const result = await api('/quests');
    state.quests = result.quests || [];
    scenarioSelect.innerHTML = state.quests.map((quest) => `<option value="${escapeHtml(quest.title)}">${escapeHtml(quest.title)}</option>`).join('');
    questsGrid.innerHTML = state.quests.map((quest) => `
      <article class="quest-card">
        <img class="quest-card__image" src="${quest.imageUrl || '/uploads/default-quest.svg'}" alt="${escapeHtml(quest.title)}" />
        <div class="quest-card__body">
          <h3>${escapeHtml(quest.title)}</h3>
          <p>${escapeHtml(quest.description)}</p>
          <div class="quest-actions">
            <button class="button" data-quest="${escapeHtml(quest.title)}">Записаться</button>
            ${state.user?.canManageQuests ? `<button class="button button--ghost" data-edit-quest="${quest.id}">Изменить</button><button class="button button--ghost" data-delete-quest="${quest.id}">Удалить</button>` : ''}
          </div>
        </div>
      </article>`).join('');
    questsGrid.querySelectorAll('[data-quest]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedScenario = button.getAttribute('data-quest');
        setPage('schedule');
      });
    });
    questsGrid.querySelectorAll('[data-edit-quest]').forEach((button) => {
      button.addEventListener('click', () => {
        const quest = state.quests.find((item) => item.id === button.getAttribute('data-edit-quest'));
        if (quest) {
          fillQuestForm(quest);
          setPage('quests');
        }
      });
    });
    questsGrid.querySelectorAll('[data-delete-quest]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('Удалить этот квест?')) return;
        try {
          await api(`/quests/${button.dataset.deleteQuest}`, { method: 'DELETE' });
          await loadQuests();
        } catch (err) {
          alert(err.message);
        }
      });
    });
    if (state.user && state.user.canManageQuests) {
      questAdminPanel.hidden = false;
      questAdminPanel.innerHTML = `
        <form id="questForm" class="form-grid">
          <input id="questId" type="hidden" />
          <label>Название<input id="questTitle" type="text" required /></label>
          <label>Описание<textarea id="questDescription" rows="3" required></textarea></label>
          <label>Ссылка на изображение<input id="questImageUrl" type="text" /></label>
          <div class="status-actions">
            <button type="submit" class="button">Сохранить квест</button>
            <button type="button" id="cancelQuestEdit" class="button button--ghost">Отменить</button>
          </div>
        </form>`;
      const form = document.getElementById('questForm');
      const titleInput = document.getElementById('questTitle');
      const descriptionInput = document.getElementById('questDescription');
      const imageInput = document.getElementById('questImageUrl');
      const idInput = document.getElementById('questId');
      const cancelButton = document.getElementById('cancelQuestEdit');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.user?.canManageQuests) return;
        try {
          const payload = { title: titleInput.value.trim(), description: descriptionInput.value.trim(), imageUrl: imageInput.value.trim() };
          if (idInput.value) {
            await api(`/quests/${idInput.value}`, { method: 'PUT', body: JSON.stringify(payload) });
          } else {
            await api('/quests', { method: 'POST', body: JSON.stringify(payload) });
          }
          resetQuestForm();
          await loadQuests();
          alert('Квест сохранён.');
        } catch (err) {
          alert(err.message);
        }
      });
      cancelButton.addEventListener('click', resetQuestForm);
    } else {
      questAdminPanel.hidden = true;
    }
  } catch (err) {
    questsGrid.innerHTML = `<div class="alert alert--warning">${escapeHtml(err.message)}</div>`;
  }
}

async function loadSchedule() {
  try {
    const result = await api('/schedule');
    const selected = state.selectedScenario || 'Похищение';
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    scenarioSelect.innerHTML = state.quests.length
      ? state.quests.map((quest) => `<option value="${escapeHtml(quest.title)}" ${quest.title === selected ? 'selected' : ''}>${escapeHtml(quest.title)}</option>`).join('')
      : '<option value="Похищение">Похищение</option>';
    if (!state.user) {
      submitButton.disabled = true;
      selectedSlotNote.textContent = 'Чтобы подать заявку, войдите в аккаунт.';
    } else if (state.user.bookingStatus === 'approved') {
      submitButton.disabled = true;
      selectedSlotNote.textContent = 'У вас уже есть подтверждённый доступ к квесту.';
    } else {
      submitButton.disabled = false;
      selectedSlotNote.textContent = 'Выберите удобное время ниже. После одобрения заявки оно станет занятым.';
    }
    scheduleGrid.innerHTML = result.schedule.map((day) => `
      <div class="schedule-day">
        <h3>${escapeHtml(day.label)}</h3>
        <div class="schedule-slots">
          ${day.slots.map((slot) => `
            <button class="slot-button ${slot.status === 'booked' ? 'slot-button--disabled' : ''}" data-slot="${slot.id}" ${slot.status === 'booked' ? 'disabled' : ''}>
              <strong>${slot.time}</strong>
              <span>${slot.status === 'booked' ? 'Занято' : 'Записаться'}</span>
            </button>`).join('')}
        </div>
      </div>`).join('');
    scheduleGrid.querySelectorAll('[data-slot]').forEach((button) => {
      button.addEventListener('click', () => selectSlot(button.getAttribute('data-slot')));
    });
  } catch (err) {
    scheduleGrid.innerHTML = `<div class="alert alert--warning">${escapeHtml(err.message)}</div>`;
  }
}

function selectSlot(slotKey) {
  state.pendingSlotKey = slotKey;
  selectedSlotNote.textContent = `Выбрано время: ${slotKey.slice(11)} на ${slotKey.slice(0, 10)}. Нажмите кнопку ниже, чтобы отправить заявку.`;
}

function fillQuestForm(quest) {
  const titleInput = document.getElementById('questTitle');
  const descriptionInput = document.getElementById('questDescription');
  const imageInput = document.getElementById('questImageUrl');
  const idInput = document.getElementById('questId');
  titleInput.value = quest.title;
  descriptionInput.value = quest.description;
  imageInput.value = quest.imageUrl || '';
  idInput.value = quest.id;
  questAdminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetQuestForm() {
  const form = document.getElementById('questForm');
  if (!form) return;
  form.reset();
  document.getElementById('questId').value = '';
}

function renderMessenger() {
  if (!state.user) {
    messengerAccess.textContent = 'Войдите, чтобы получить доступ к мессенджеру.';
    messengerAccess.hidden = false;
    messengerApp.hidden = true;
    messengerLocked.hidden = true;
    return;
  }
  if (!state.user.access) {
    messengerAccess.hidden = true;
    messengerApp.hidden = true;
    messengerLocked.hidden = false;
    return;
  }
  messengerAccess.hidden = true;
  messengerApp.hidden = false;
  messengerLocked.hidden = true;
  messengerRoleBadge.textContent = state.user.role === 'admin' || state.user.role === 'creator' ? 'Админ' : state.user.role === 'actor' ? 'Актёр' : 'ГГ';
  connectRoom('quest', messagesEl, chatForm, messageInput, mediaInput, 'общий');
}

function renderActorArea() {
  if (!state.user || (state.user.role !== 'actor' && state.user.role !== 'admin' && state.user.role !== 'creator')) {
    actorLocked.hidden = false;
    actorContent.hidden = true;
    return;
  }
  actorLocked.hidden = true;
  actorContent.hidden = false;
  renderProfileForms();
  loadActorBoard();
  connectRoom('actor', actorMessagesEl, actorChatForm, actorMessageInput, actorMediaInput, 'актёрский');
}

function renderAdminArea() {
  if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'creator')) {
    adminLocked.hidden = false;
    adminContent.hidden = true;
    return;
  }
  adminLocked.hidden = true;
  adminContent.hidden = false;
  renderProfileForms();
  loadAdminData();
  connectRoom('admin', adminMessagesEl, adminChatForm, adminMessageInput, adminMediaInput, 'админский');
}

function renderProfileForms() {
  if (!state.user) return;
  if (profileName) {
    profileName.value = state.user.displayName || state.user.username || '';
    profileBio.value = state.user.bio || '';
    profilePreview.innerHTML = `<img src="${state.user.avatarUrl || '/uploads/default-quest.svg'}" alt="avatar" class="avatar-image" />`;
    updateBackgroundPreview(profileBackgroundPreview, state.user.backgroundUrl);
  }
  if (adminProfileName) {
    adminProfileName.value = state.user.displayName || state.user.username || '';
    adminProfileBio.value = state.user.bio || '';
    adminProfilePreview.innerHTML = `<img src="${state.user.avatarUrl || '/uploads/default-quest.svg'}" alt="avatar" class="avatar-image" />`;
    updateBackgroundPreview(adminBackgroundPreview, state.user.backgroundUrl);
  }
  applyCustomBackground(state.user.backgroundUrl);
}

function applyCustomBackground(url) {
  if (url) {
    document.body.style.setProperty('--chat-background', `url(${url})`);
  } else {
    document.body.style.removeProperty('--chat-background');
  }
}

function updateBackgroundPreview(preview, url) {
  if (!preview) return;
  if (url) {
    preview.innerHTML = `<img src="${escapeHtml(url)}" alt="background preview" />`;
  } else {
    preview.innerHTML = 'Фон не выбран';
  }
}

async function loadActorBoard() {
  try {
    const result = await api('/actor-board');
    actorBoard.innerHTML = result.board.length
      ? result.board.map((item) => `<li>${escapeHtml(item.username)} — ${new Date(item.bookedAt).toLocaleString('ru-RU')} (${escapeHtml(item.status || '—')})</li>`).join('')
      : '<li>Нет активных записей.</li>';
  } catch (err) {
    actorBoard.innerHTML = `<li>Ошибка загрузки данных: ${escapeHtml(err.message)}</li>`;
  }
}

async function loadAdminData() {
  try {
    const [statsResult, usersResult, bookingsResult, teamResult, scheduleResult] = await Promise.all([
      api('/stats').catch(() => ({ success: false, stats: null })),
      api('/admin/users').catch(() => ({ success: false, users: [] })),
      api('/admin/bookings').catch(() => ({ success: false, bookings: [] })),
      api('/team-applications').catch(() => ({ success: false, applications: [] })),
      api('/admin/schedule').catch(() => ({ success: false, schedule: [] }))
    ]);
    if (statsResult.success && statsResult.stats) {
      statsGrid.innerHTML = [
        ['Всего пользователей', statsResult.stats.totalUsers],
        ['Игроки', statsResult.stats.players],
        ['Актёры', statsResult.stats.actors],
        ['Ожидают', statsResult.stats.pendingBookings],
        ['Одобрено', statsResult.stats.approvedBookings]
      ].map(([label, value]) => `<div class="stats-card"><h4>${escapeHtml(label)}</h4><p>${value}</p></div>`).join('');
    } else {
      statsGrid.innerHTML = '<div class="stats-card"><h4>Статистика</h4><p>Недоступно</p></div>';
    }

    usersList.innerHTML = usersResult.users?.length
      ? usersResult.users.map((item) => `
        <li>
          <strong>${escapeHtml(item.username)}</strong> — ${escapeHtml(item.role)} • ${escapeHtml(item.bookingStatus || 'без заявки')}
          ${state.user?.canManageRoles ? `<button class="button admin-action" data-role-user="${item.id}" data-role="admin">Назначить админом</button><button class="button admin-action admin-action--reject" data-role-user="${item.id}" data-role="player">Снять права</button>` : ''}
        </li>`).join('')
      : '<li>Нет пользователей.</li>';
    usersList.querySelectorAll('[data-role-user]').forEach((button) => {
      button.addEventListener('click', () => changeUserRole(button.dataset.roleUser, button.dataset.role));
    });

    bookingsList.innerHTML = bookingsResult.bookings?.length
      ? bookingsResult.bookings.map((item) => `
        <li>
          <strong>${escapeHtml(item.username || item.scenario || 'Заявка')}</strong> — ${escapeHtml(item.scenario)}<br />
          <span>${new Date(item.date || item.createdAt).toLocaleString('ru-RU')}</span><br />
          <span>Статус: ${escapeHtml(item.status)}</span>
          ${item.status === 'pending' ? `<button class="button admin-action admin-action--approve" data-action="approve" data-id="${item.id}">Одобрить</button><button class="button admin-action admin-action--reject" data-action="reject" data-id="${item.id}">Отклонить</button>` : ''}
        </li>`).join('')
      : '<li>Нет заявок.</li>';
    bookingsList.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => reviewBooking(button.dataset.id, button.dataset.action));
    });

    teamApplicationsList.innerHTML = teamResult.applications?.length
      ? teamResult.applications.map((item) => `
        <li>
          <strong>${escapeHtml(item.applicantName)}</strong> — ${escapeHtml(item.role)}<br />
          <span>${escapeHtml(item.message)}</span><br />
          <span>Статус: ${escapeHtml(item.status)}</span>
          ${item.status === 'pending' ? `<button class="button admin-action admin-action--approve" data-team-action="approve" data-id="${item.id}">Принять</button><button class="button admin-action admin-action--reject" data-team-action="reject" data-id="${item.id}">Отклонить</button>` : ''}
        </li>`).join('')
      : '<li>Нет заявок.</li>';
    teamApplicationsList.querySelectorAll('[data-team-action]').forEach((button) => {
      button.addEventListener('click', () => reviewTeamApplication(button.dataset.id, button.dataset.teamAction));
    });

    if (scheduleResult.success) {
      renderAdminSchedule(scheduleResult.schedule || []);
    } else {
      scheduleAdminPanel.innerHTML = '<div class="alert alert--warning">Не удалось загрузить расписание.</div>';
    }
  } catch (err) {
    bookingsList.innerHTML = `<li>Ошибка загрузки админки: ${escapeHtml(err.message)}</li>`;
  }
}

async function reviewBooking(bookingId, action) {
  try {
    const result = await api(`/admin/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    alert(result.message);
    await loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}

async function reviewTeamApplication(applicationId, action) {
  try {
    const result = await api(`/admin/team-applications/${applicationId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    alert(result.success ? 'Заявка обработана.' : 'Ошибка');
    await loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}

async function changeUserRole(userId, role) {
  try {
    const result = await api(`/admin/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) });
    alert(result.success ? 'Роль обновлена.' : 'Ошибка');
    await loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}

function renderAdminSchedule(schedule) {
  scheduleAdminPanel.innerHTML = `
    <div class="board-card">
      <h3>Управление расписанием</h3>
      <form id="scheduleDayForm" class="form-grid">
        <label>Дата<input id="newScheduleDate" type="date" required /></label>
        <label>Слоты (через запятую)<input id="newScheduleSlots" type="text" placeholder="19:00,21:00" /></label>
        <button type="submit" class="button">Добавить дату</button>
      </form>
    </div>
    <div class="board-card schedule-admin-list">
      ${schedule.map((day) => `
        <div class="schedule-day">
          <div class="schedule-day__header">
            <h4>${escapeHtml(day.label)} (${escapeHtml(day.key)})</h4>
            <div class="status-actions">
              <button class="button button--ghost" data-delete-day="${escapeHtml(day.key)}">Удалить дату</button>
            </div>
          </div>
          ${day.slots.map((slot) => `
            <div class="slot-row">
              <strong>${escapeHtml(slot.time)}</strong>
              <div class="status-actions">
                <button class="button button--ghost" data-edit-slot="${escapeHtml(slot.id)}" data-day="${escapeHtml(day.key)}">Изменить</button>
                <button class="button button--ghost" data-delete-slot="${escapeHtml(slot.id)}">Удалить</button>
              </div>
            </div>
          `).join('')}
          <button class="button button--ghost" data-add-slot="${escapeHtml(day.key)}">Добавить слот</button>
        </div>
      `).join('')}
    </div>
  `;

  const scheduleDayForm = document.getElementById('scheduleDayForm');
  if (scheduleDayForm) {
    scheduleDayForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const dateInput = document.getElementById('newScheduleDate');
      const slotsInput = document.getElementById('newScheduleSlots');
      const date = dateInput.value;
      const slots = slotsInput.value.split(',').map((item) => item.trim()).filter(Boolean);
      try {
        await api('/admin/schedule/days', { method: 'POST', body: JSON.stringify({ date, slots }) });
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  scheduleAdminPanel.querySelectorAll('[data-delete-day]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Удалить эту дату и все её слоты?')) return;
      try {
        await api(`/admin/schedule/days/${button.dataset.deleteDay}`, { method: 'DELETE' });
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  scheduleAdminPanel.querySelectorAll('[data-add-slot]').forEach((button) => {
    button.addEventListener('click', async () => {
      const dayKey = button.dataset.addSlot;
      const time = prompt('Введите время нового слота (например, 19:00):', '19:00');
      if (!time) return;
      try {
        await api('/admin/schedule/slots', { method: 'POST', body: JSON.stringify({ dayKey, time }) });
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  scheduleAdminPanel.querySelectorAll('[data-delete-slot]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Удалить этот слот?')) return;
      try {
        await api(`/admin/schedule/slots/${button.dataset.deleteSlot}`, { method: 'DELETE' });
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  scheduleAdminPanel.querySelectorAll('[data-edit-slot]').forEach((button) => {
    button.addEventListener('click', async () => {
      const slotId = button.dataset.editSlot;
      const currentDay = button.dataset.day;
      const newDate = prompt('Введите новую дату (YYYY-MM-DD):', currentDay);
      if (newDate === null) return;
      const newTime = prompt('Введите новое время (HH:MM):', '19:00');
      if (newTime === null) return;
      try {
        await api(`/admin/schedule/slots/${slotId}`, { method: 'PUT', body: JSON.stringify({ date: newDate, time: newTime }) });
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function createMessageItem(message) {
  const isMine = state.user && state.user.username === message.name;
  const mediaBlock = message.media?.url
    ? message.media.kind === 'image'
      ? `<img class="message-media" src="${message.media.url}" alt="media" />`
      : message.media.kind === 'video'
        ? `<video class="message-media" controls src="${message.media.url}"></video>`
        : `<audio class="message-media" controls src="${message.media.url}"></audio>`
    : '';
  const avatarHtml = message.avatarUrl
    ? `<img class="message-avatar" src="${message.avatarUrl}" alt="avatar" />`
    : `<div class="message-avatar message-avatar--fallback">${escapeHtml((message.displayName || message.name || '?').slice(0, 1))}</div>`;
  return `
    <div class="message ${isMine ? 'message--mine' : ''}">
      <div class="message__meta">
        <div class="message__person">${avatarHtml}<span>${escapeHtml(message.displayName || message.name)}</span></div>
        <span>${new Date(message.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      ${message.text ? `<div class="message__text">${escapeHtml(message.text)}</div>` : ''}
      ${mediaBlock}
    </div>`;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function connectRoom(room, container, form, input, mediaInput, label) {
  if (!state.token) return;
  if (state.sockets[room] && state.sockets[room].readyState === WebSocket.OPEN) {
    return;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/?token=${encodeURIComponent(state.token)}&room=${encodeURIComponent(room)}`;
  const socket = new WebSocket(url);
  state.sockets[room] = socket;
  container.innerHTML = '';
  socket.addEventListener('open', () => {
    const item = document.createElement('div');
    item.className = 'message message--system';
    item.innerHTML = `<div class="message__text">Подключение к ${label} чату установлено.</div>`;
    container.appendChild(item);
  });
  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'init' && Array.isArray(payload.messages)) {
        container.innerHTML = '';
        payload.messages.forEach((message) => {
          const item = document.createElement('div');
          item.innerHTML = createMessageItem(message);
          container.appendChild(item.firstElementChild);
        });
        container.scrollTop = container.scrollHeight;
        if (payload.wallpaper) {
          document.body.dataset.wallpaper = payload.wallpaper;
        }
        return;
      }
      if (payload.type === 'wallpaper') {
        document.body.dataset.wallpaper = payload.wallpaper;
        return;
      }
      if (payload.type === 'message' || payload.type === 'system') {
        const item = document.createElement('div');
        item.innerHTML = createMessageItem(payload);
        container.appendChild(item.firstElementChild);
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Ошибка обработки сообщения:', err);
    }
  });
  socket.addEventListener('close', () => {
    const item = document.createElement('div');
    item.className = 'message message--system';
    item.innerHTML = `<div class="message__text">Соединение закрыто.</div>`;
    container.appendChild(item);
  });
  socket.addEventListener('error', () => {
    const item = document.createElement('div');
    item.className = 'message message--system';
    item.innerHTML = `<div class="message__text">Ошибка WebSocket.</div>`;
    container.appendChild(item);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const text = input.value.trim();
    let media = null;
    const selectedFile = mediaInput.files[0];
    if (selectedFile) {
      const base64 = await readFileAsDataUrl(selectedFile);
      const uploadResult = await api('/upload', { method: 'POST', body: JSON.stringify({ fileName: selectedFile.name, mimeType: selectedFile.type, dataUrl: base64 }) });
      media = { url: uploadResult.url, kind: getMediaKind(selectedFile.type) };
    }
    if (!text && !media) return;
    socket.send(JSON.stringify({ type: 'message', text, media, kind: media ? media.kind : 'text' }));
    input.value = '';
    if (mediaInput) {
      mediaInput.value = '';
    }
  });
}

function getMediaKind(mimeType) {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveProfile(formFields, preview, fileInput, backgroundInput) {
  if (!state.user || !state.user.role) return;
  let avatarUrl = '';
  let backgroundUrl = '';
  if (fileInput && fileInput.files[0]) {
    const base64 = await readFileAsDataUrl(fileInput.files[0]);
    const uploadResult = await api('/upload', { method: 'POST', body: JSON.stringify({ fileName: fileInput.files[0].name, mimeType: fileInput.files[0].type, dataUrl: base64 }) });
    avatarUrl = uploadResult.url;
  }
  if (backgroundInput && backgroundInput.files[0]) {
    const base64 = await readFileAsDataUrl(backgroundInput.files[0]);
    const uploadResult = await api('/upload', { method: 'POST', body: JSON.stringify({ fileName: backgroundInput.files[0].name, mimeType: backgroundInput.files[0].type, dataUrl: base64 }) });
    backgroundUrl = uploadResult.url;
  }
  const payload = { displayName: formFields.name, bio: formFields.bio };
  if (avatarUrl) payload.avatarUrl = avatarUrl;
  if (backgroundUrl) payload.backgroundUrl = backgroundUrl;
  const result = await api('/profile', { method: 'POST', body: JSON.stringify(payload) });
  setUser(result.user);
  renderProfileForms();
  preview.innerHTML = `<img src="${result.user.avatarUrl || '/uploads/default-quest.svg'}" alt="avatar" class="avatar-image" />`;
}

async function submitTeamApplication(form) {
  const payload = {
    name: form.querySelector('[name="name"]').value.trim(),
    role: form.dataset.role,
    experience: form.querySelector('[name="experience"]').value.trim(),
    message: form.querySelector('[name="message"]').value.trim()
  };
  if (!payload.name || !payload.message) {
    alert('Заполните имя и сообщение.');
    return;
  }
  try {
    await api('/team-applications', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    alert('Заявка отправлена в админ-чат.');
  } catch (err) {
    alert(err.message);
  }
}

function renderTeamForms() {
  const forms = [
    { role: 'Актёр', title: 'Анкета актёра', hint: 'Расскажите о своём опыте и роли.' },
    { role: 'Помощник', title: 'Анкета помощника', hint: 'Поделитесь вашими навыками и идеями.' },
    { role: 'Ведущий', title: 'Анкета ведущего', hint: 'Опишите, как вы ведёте мероприятия и общаетесь с аудиторией.' }
  ];
  teamFormContainer.innerHTML = forms.map((item) => `
    <form class="team-card" data-role="${escapeHtml(item.role)}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.hint)}</p>
      <label>Имя<input name="name" required /></label>
      <label>Опыт<textarea name="experience" rows="3"></textarea></label>
      <label>Почему вы хотите быть в команде?<textarea name="message" rows="4" required></textarea></label>
      <button type="submit" class="button">Отправить заявку</button>
    </form>`).join('');
  teamFormContainer.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitTeamApplication(form);
    });
  });
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.user) {
    showAuthModal();
    return;
  }
  if (!state.pendingSlotKey) {
    alert('Сначала выберите время из расписания.');
    return;
  }
  try {
    const result = await api('/book', { method: 'POST', body: JSON.stringify({ slotKey: state.pendingSlotKey, scenario: scenarioSelect.value, comment: bookingComment.value.trim() }) });
    alert(result.message);
    await loadSchedule();
  } catch (err) {
    alert(err.message);
  }
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveProfile({ name: profileName.value, bio: profileBio.value }, profilePreview, profileAvatarInput, profileBackgroundInput);
});

adminProfileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveProfile({ name: adminProfileName.value, bio: adminProfileBio.value }, adminProfilePreview, adminAvatarInput, adminBackgroundInput);
});

authTabs.forEach((button) => {
  button.addEventListener('click', () => setAuthTab(button.dataset.tab));
});

authForm.addEventListener('submit', loginOrRegister);
authClose.addEventListener('click', hideAuthModal);
logoutButton.addEventListener('click', logout);
loginButton.addEventListener('click', showAuthModal);

pageButtons.forEach((button) => {
  button.addEventListener('click', () => setPage(button.dataset.page));
});

wallpaperButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const room = button.dataset.room || 'quest';
    const socket = state.sockets[room];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'wallpaper', wallpaper: button.dataset.wallpaper }));
    }
  });
});

window.addEventListener('load', async () => {
  await loadUser();
  await loadQuests();
  await loadSchedule();
  renderTeamForms();
  setPage('home');
  setAuthTab('login');
});

window.addEventListener('beforeunload', () => {
  Object.values(state.sockets).forEach((socket) => socket.close());
});
