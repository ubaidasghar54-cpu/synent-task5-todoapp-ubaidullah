// The array is the app's source of truth while the page is open.
let tasks = [];

const STORAGE_KEY = 'synent-todo-tasks';
const GREETING_STORAGE_KEY = 'synent-todo-last-greeting';
const GREETING_LINES = [
  'Small steps today make big things possible.',
  'Your future self will thank you for starting.',
  'Progress is built one completed task at a time.',
  'Focus on the next step. The rest will follow.',
  'Consistency turns plans into progress.',
  'Make today count, one task at a time.',
  'Every task you finish is momentum earned.',
  'Start where you are. Do what you can.',
];
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const reminderInput = document.querySelector('#reminder-input');
const durationInput = document.querySelector('#duration-input');
const taskList = document.querySelector('#task-list');
const formMessage = document.querySelector('#form-message');
const greetingMessage = document.querySelector('#greeting-message');
const taskCount = document.querySelector('#task-count');
const filterButtons = document.querySelectorAll('[data-filter]');
const clearCompletedButton = document.querySelector('#clear-completed');
const enableSoundButton = document.querySelector('#enable-sound');
const soundStatus = document.querySelector('#sound-status');
const enableNotificationsButton = document.querySelector('#enable-notifications');
const notificationStatus = document.querySelector('#notification-status');
const testAlarmButton = document.querySelector('#test-alarm');
const alarmTestStatus = document.querySelector('#alarm-test-status');
const alarmDialog = document.querySelector('#alarm-dialog');
const alarmTask = document.querySelector('#alarm-task');
const snoozeAlarmButton = document.querySelector('#snooze-alarm');
const dismissAlarmButton = document.querySelector('#dismiss-alarm');

let currentFilter = 'all';
let audioContext = null;
let soundEnabled = false;
let alarmQueue = [];
let activeAlarm = null;
const testAlarmTasks = new Map();
let alarmBeepInterval = null;
let alarmSafetyTimeout = null;
let alarmVibrationInterval = null;
let serviceWorkerRegistration = null;
let titleFlashInterval = null;
let titleIsFlashing = false;
const originalDocumentTitle = document.title;
const activeOscillators = new Set();

/** Show a motivational line, avoiding the one used on the previous visit. */
function showGreeting() {
  let previousIndex = -1;

  try {
    const savedIndex = localStorage.getItem(GREETING_STORAGE_KEY);
    if (savedIndex !== null) {
      previousIndex = Number(savedIndex);
    }
  } catch (error) {
    // The greeting still works when browser storage is unavailable.
  }

  let choices = GREETING_LINES.map((line, index) => index);
  if (choices.length > 1 && Number.isInteger(previousIndex)) {
    choices = choices.filter((index) => index !== previousIndex);
  }

  const nextIndex = choices[Math.floor(Math.random() * choices.length)];
  greetingMessage.textContent = GREETING_LINES[nextIndex];

  try {
    localStorage.setItem(GREETING_STORAGE_KEY, String(nextIndex));
  } catch (error) {
    // Not saving the last line does not stop the app or hide the greeting.
  }
}

/** Load valid task data from this browser, or start with an empty list. */
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (!savedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);

    // Check the saved shape before trusting it in the rest of the app.
    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks.filter((task) =>
      task &&
      (typeof task.id === 'string' || typeof task.id === 'number') &&
      typeof task.text === 'string' &&
      typeof task.completed === 'boolean'
    ).map((task) => ({
      ...task,
      // Older saved tasks did not include reminder fields.
      remindAt: Number.isFinite(task.remindAt) ? task.remindAt : null,
      notified: typeof task.notified === 'boolean' ? task.notified : false,
      // Tasks saved before time allowances were added have no deadline.
      durationMinutes: Number.isFinite(task.durationMinutes) && task.durationMinutes > 0
        ? task.durationMinutes
        : null,
      deadlineAt: Number.isFinite(task.deadlineAt) &&
        Number.isFinite(task.durationMinutes) && task.durationMinutes > 0
        ? task.deadlineAt
        : null,
    }));
  } catch (error) {
    // A damaged or unavailable saved value should not prevent the app loading.
    console.warn('Could not load saved tasks. Starting with an empty list.', error);
    return [];
  }
}

/** Store the current task array as JSON text. */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // Storage can be disabled or full, so keep the in-page app usable.
    console.warn('Could not save tasks in this browser.', error);
  }
}

/** Use the browser's UUID helper when available, with a simple fallback. */
function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Convert a timestamp into the local date/time format used by the input. */
function toLocalDateTimeValue(timestamp) {
  const date = new Date(timestamp);
  const pad = (part) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Keep date/time pickers from offering a time earlier than this minute. */
function updateReminderMinimum() {
  reminderInput.min = toLocalDateTimeValue(Date.now());
}

/** Display a reminder timestamp in the visitor's local time zone. */
function formatReminder(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

/** Turn the selected number of minutes into a readable time allowance. */
function formatDurationAllowance(minutes) {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/** Describe the time left until a task's saved deadline. */
function formatTimeRemaining(deadlineAt, completed = false, durationMinutes = null) {
  if (completed) {
    return `Time allowed: ${formatDurationAllowance(durationMinutes)}`;
  }

  const secondsLeft = Math.ceil((deadlineAt - Date.now()) / 1000);
  if (secondsLeft <= 0) {
    return "Time's up";
  }

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  if (hours > 0) {
    return `Time left: ${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `Time left: ${minutes}m ${seconds}s`;
  }

  return `Time left: ${seconds}s`;
}

/** Update visible countdown text without rebuilding task rows each second. */
function updateCountdowns() {
  document.querySelectorAll('.task-countdown').forEach((countdown) => {
    const item = countdown.closest('.task-item');
    const task = tasks.find((savedTask) => savedTask.id === item?.dataset.taskId);

    if (task && task.deadlineAt !== null && task.durationMinutes !== null) {
      countdown.textContent = formatTimeRemaining(
        task.deadlineAt,
        task.completed,
        task.durationMinutes
      );
    }
  });
}

/** Format a timestamp as an iCalendar UTC date/time value. */
function formatICSDate(timestamp) {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Escape user text according to iCalendar TEXT value rules. */
function escapeICSText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Fold long iCalendar lines without splitting a Unicode character. */
function foldICSLine(line) {
  const encoder = new TextEncoder();
  const foldedParts = [];
  let currentPart = '';
  let currentBytes = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;

    if (currentBytes + characterBytes > 75 && currentPart) {
      foldedParts.push(currentPart);
      currentPart = ' ';
      currentBytes = 1;
    }

    currentPart += character;
    currentBytes += characterBytes;
  }

  foldedParts.push(currentPart);
  return foldedParts.join('\r\n');
}

/** Build a standards-shaped calendar file for one reminded task. */
function buildICS(task) {
  const startsAt = task.remindAt;
  const endsAt = startsAt + 30 * 60 * 1000;
  const safeId = String(task.id).replace(/[^a-zA-Z0-9.-]/g, '') || String(Date.now());
  const summary = escapeICSText(task.text);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Synent Technologies//Task 5 To-Do App//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${safeId}@synent-task5-todoapp-ubaidullah`,
    `DTSTAMP:${formatICSDate(Date.now())}`,
    `DTSTART:${formatICSDate(startsAt)}`,
    `DTEND:${formatICSDate(endsAt)}`,
    `SUMMARY:${summary}`,
    'DESCRIPTION:Task reminder from My Tasks',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Task reminder',
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(foldICSLine).join('\r\n')}\r\n`;
}

/** Download the task's calendar event as a .ics file. */
function downloadICS(task) {
  const calendarBlob = new Blob([buildICS(task)], { type: 'text/calendar;charset=utf-8' });
  const downloadURL = URL.createObjectURL(calendarBlob);
  const downloadLink = document.createElement('a');
  const safeId = String(task.id).replace(/[^a-zA-Z0-9.-]/g, '') || 'task';

  downloadLink.href = downloadURL;
  downloadLink.download = `task-reminder-${safeId}.ics`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
}

/** Build a prefilled Google Calendar event link with URL-encoded values. */
function buildGoogleCalendarURL(task) {
  const startsAt = task.remindAt;
  const endsAt = startsAt + 30 * 60 * 1000;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.text,
    dates: `${formatICSDate(startsAt)}/${formatICSDate(endsAt)}`,
    details: 'Task reminder from My Tasks',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Mark reminders that passed while the app was closed so they do not ring late. */
function markOverdueRemindersMissed() {
  const now = Date.now();
  let changed = false;

  tasks = tasks.map((task) => {
    const isOverdue = task.remindAt !== null && task.remindAt <= now;

    if (isOverdue && !task.completed && !task.notified) {
      changed = true;
      return { ...task, notified: true };
    }

    return task;
  });

  if (changed) {
    saveTasks();
  }
}

/** Queue a due task so simultaneous reminders can be handled one at a time. */
function triggerAlarm(task) {
  alarmQueue.push(task.id);
  startNextAlarm();
}

/** Register the service worker used to display persistent notifications. */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    notificationStatus.textContent = 'Notifications are not supported by this browser.';
    return;
  }

  if (!window.isSecureContext) {
    notificationStatus.textContent = 'Notifications need HTTPS or localhost.';
    return;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('./sw.js');
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationStatus.textContent = 'Notifications are enabled for reminders while this page is open.';
      enableNotificationsButton.textContent = 'Notifications enabled';
    } else {
      notificationStatus.textContent = 'Service worker ready. Enable notifications to allow alerts.';
    }
  } catch (error) {
    notificationStatus.textContent = 'Could not set up notifications on this site.';
  }
}

/** Ask for notification permission directly from the user's button click. */
async function enableNotifications() {
  if (!('Notification' in window)) {
    notificationStatus.textContent = 'Notifications are not supported here. On iPhone, add this app to the Home Screen and open it there.';
    return;
  }

  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    notificationStatus.textContent = 'Notifications need service workers and HTTPS or localhost.';
    return;
  }

  let permission;
  try {
    // Keep this permission request in the direct button-click flow.
    permission = await Notification.requestPermission();
  } catch (error) {
    notificationStatus.textContent = 'The browser could not request notification permission.';
    return;
  }

  if (permission !== 'granted') {
    notificationStatus.textContent = permission === 'denied'
      ? 'Notifications are blocked in browser settings.'
      : 'Notification permission was not granted.';
    return;
  }

  try {
    serviceWorkerRegistration = serviceWorkerRegistration ||
      await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    notificationStatus.textContent = 'Notifications are enabled for reminders while this page is open.';
    enableNotificationsButton.textContent = 'Notifications enabled';
  } catch (error) {
    notificationStatus.textContent = 'Permission was granted, but the service worker is not ready.';
  }
}

/** Show a system notification using the service worker registration. */
async function showAlarmNotification(task) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !serviceWorkerRegistration) {
    return;
  }

  try {
    const title = testAlarmTasks.has(task.id) ? 'Test alarm' : 'Task reminder';
    await serviceWorkerRegistration.showNotification(title, {
      body: task.text,
      tag: `task-reminder-${task.id}`,
      data: { taskId: task.id },
    });
  } catch (error) {
    notificationStatus.textContent = 'The browser could not display this notification.';
  }
}

/** Flash the document title while an alarm is waiting for a response. */
function startTitleFlash() {
  if (titleFlashInterval !== null) {
    return;
  }

  titleFlashInterval = window.setInterval(() => {
    titleIsFlashing = !titleIsFlashing;
    document.title = titleIsFlashing ? 'Reminder due!' : originalDocumentTitle;
  }, 900);
}

/** Restore the original title when no reminder needs attention. */
function stopTitleFlash() {
  if (titleFlashInterval !== null) {
    window.clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }

  titleIsFlashing = false;
  document.title = originalDocumentTitle;
}

/** Start showing and sounding the next queued reminder. */
function startNextAlarm() {
  if (activeAlarm) {
    return;
  }

  if (alarmQueue.length === 0) {
    stopTitleFlash();
    return;
  }

  const taskId = alarmQueue.shift();
  const task = tasks.find((item) => item.id === taskId) || testAlarmTasks.get(taskId);

  if (!task) {
    startNextAlarm();
    return;
  }

  activeAlarm = taskId;
  alarmTask.textContent = task.text;
  alarmDialog.showModal();
  startTitleFlash();
  showAlarmNotification(task);
  playAlarmSound();
  startAlarmVibration();

  // Keep the modal open, but stop the repeating sound after one minute.
  alarmSafetyTimeout = window.setTimeout(stopAlarm, 60_000);
}

/** Make one short beep with the Web Audio API. */
function playAlarmBeep() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const startAt = audioContext.currentTime;

  oscillator.frequency.setValueAtTime(880, startAt);
  volume.gain.setValueAtTime(0.001, startAt);
  volume.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.001, startAt + 0.24);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  activeOscillators.add(oscillator);
  oscillator.addEventListener('ended', () => activeOscillators.delete(oscillator), { once: true });
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.25);
}

/** Repeat the generated beep until a response or the safety timeout. */
function playAlarmSound() {
  if (!soundEnabled) {
    return;
  }

  playAlarmBeep();
  alarmBeepInterval = window.setInterval(playAlarmBeep, 700);
}

/** Repeat a vibration pattern only on browsers that expose the API. */
function startAlarmVibration() {
  if (!('vibrate' in navigator)) {
    return;
  }

  const pattern = [300, 150, 300, 150, 600];

  try {
    navigator.vibrate(pattern);
    alarmVibrationInterval = window.setInterval(() => {
      navigator.vibrate(pattern);
    }, 1800);
  } catch (error) {
    // Some devices expose the API but do not allow vibration in this context.
  }
}

/** Stop repeating and cancel any vibration already in progress. */
function stopAlarmVibration() {
  if (alarmVibrationInterval !== null) {
    window.clearInterval(alarmVibrationInterval);
    alarmVibrationInterval = null;
  }

  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch (error) {
      // A device may stop exposing vibration while the page is running.
    }
  }
}

/** Stop all repeating sound and any beep that is still playing. */
function stopAlarm() {
  stopAlarmVibration();

  if (alarmBeepInterval !== null) {
    window.clearInterval(alarmBeepInterval);
    alarmBeepInterval = null;
  }

  if (alarmSafetyTimeout !== null) {
    window.clearTimeout(alarmSafetyTimeout);
    alarmSafetyTimeout = null;
  }

  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch (error) {
      // An oscillator that already stopped needs no further action.
    }
  });
  activeOscillators.clear();
}

/** Enable Web Audio only from this button's user gesture. */
async function enableAlarmSound() {
  if (soundEnabled) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    soundStatus.textContent = 'Alarm sound is not supported in this browser.';
    return;
  }

  try {
    audioContext = audioContext || new AudioContextClass();
    await audioContext.resume();
    soundEnabled = audioContext.state === 'running';
    soundStatus.textContent = soundEnabled
      ? 'Alarm sound is enabled while this page is open.'
      : 'The browser did not enable alarm sound.';
    enableSoundButton.textContent = soundEnabled ? 'Alarm sound enabled' : 'Enable alarm sound';
  } catch (error) {
    soundStatus.textContent = 'Could not enable alarm sound. Try clicking again.';
  }
}

/** Snooze the active reminder for five minutes. */
function snoozeTask(id) {
  tasks = tasks.map((task) => task.id === id
    ? { ...task, remindAt: Date.now() + 5 * 60 * 1000, notified: false }
    : task
  );
  saveTasks();
  render();
}

/** Close the active alarm and mark its task as done. */
function dismissAlarm() {
  if (activeAlarm === null) {
    return;
  }

  stopAlarm();
  if (testAlarmTasks.has(activeAlarm)) {
    testAlarmTasks.delete(activeAlarm);
    alarmTestStatus.textContent = 'Test alarm dismissed. No task was changed.';
  } else {
    tasks = tasks.map((task) => task.id === activeAlarm
      ? { ...task, completed: true, notified: true }
      : task
    );
    saveTasks();
  }

  alarmDialog.close();
  activeAlarm = null;
  render();
  startNextAlarm();
}

/** Stop the sound and schedule the active task again in five minutes. */
function snoozeActiveAlarm() {
  if (activeAlarm === null) {
    return;
  }

  stopAlarm();
  if (testAlarmTasks.has(activeAlarm)) {
    testAlarmTasks.delete(activeAlarm);
    alarmTestStatus.textContent = 'Test alarm stopped. No reminder was scheduled.';
  } else {
    snoozeTask(activeAlarm);
  }

  alarmDialog.close();
  activeAlarm = null;
  startNextAlarm();
}

/** Run the alarm interface immediately without adding or changing a task. */
function testAlarm() {
  if (activeAlarm !== null || alarmQueue.length > 0) {
    alarmTestStatus.textContent = 'Respond to the current alarm before starting a test.';
    return;
  }

  const testId = `test-${Date.now()}`;
  testAlarmTasks.set(testId, {
    id: testId,
    text: 'This is a test alarm.',
    completed: false,
    remindAt: Date.now(),
    notified: true,
  });
  alarmTestStatus.textContent = soundEnabled
    ? 'Test alarm started.'
    : 'Test alarm started without sound. Enable alarm sound to hear the beep.';
  triggerAlarm(testAlarmTasks.get(testId));
}

/** Find reminders that are due now and fire each task only once. */
function checkReminders() {
  const now = Date.now();
  const dueTasks = tasks.filter((task) =>
    task.remindAt !== null &&
    task.remindAt <= now &&
    !task.completed &&
    !task.notified
  );

  if (dueTasks.length === 0) {
    return;
  }

  const dueIds = new Set(dueTasks.map((task) => task.id));
  tasks = tasks.map((task) => dueIds.has(task.id)
    ? { ...task, notified: true }
    : task
  );

  // Save first, so refreshes or later checks cannot fire these twice.
  saveTasks();
  dueTasks.forEach(triggerAlarm);
  render();
}

/** Check immediately when a background tab becomes visible again. */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    checkReminders();
    updateCountdowns();
  }
}

/** Build the visible task list again from the tasks array. */
function render() {
  // Remove the previous view so it cannot show stale tasks.
  taskList.replaceChildren();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === 'active') {
      return !task.completed;
    }

    if (currentFilter === 'completed') {
      return task.completed;
    }

    return true;
  });

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-state';
    emptyMessage.textContent = tasks.length === 0
      ? 'Nothing to do. Add a task!'
      : 'No tasks match this filter.';
    taskList.append(emptyMessage);
  }

  // Create one safe list item for each task visible under the chosen filter.
  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'task-item';
    item.dataset.taskId = task.id;

    if (task.completed) {
      item.classList.add('is-completed');
    }

    const checkbox = document.createElement('input');
    checkbox.className = 'task-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} as completed`);

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';
    taskDetails.append(text);

    if (task.remindAt !== null) {
      const reminderLabel = document.createElement('span');
      const isMissedReminder = task.notified &&
        task.remindAt <= Date.now() &&
        !task.completed &&
        task.id !== activeAlarm &&
        !alarmQueue.includes(task.id);
      reminderLabel.className = isMissedReminder
        ? 'reminder-label reminder-missed'
        : 'reminder-label';
      reminderLabel.textContent = isMissedReminder
        ? `Missed reminder: ${formatReminder(task.remindAt)}`
        : `Reminder: ${formatReminder(task.remindAt)}`;
      taskDetails.append(reminderLabel);
    }

    if (task.deadlineAt !== null && task.durationMinutes !== null) {
      const countdown = document.createElement('span');
      countdown.className = 'task-countdown';
      countdown.textContent = formatTimeRemaining(
        task.deadlineAt,
        task.completed,
        task.durationMinutes
      );
      taskDetails.append(countdown);
    }

    const editButton = document.createElement('button');
    editButton.className = 'task-action';
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.setAttribute('aria-label', `Edit ${task.text}`);
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-action';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
    deleteButton.textContent = 'Delete';

    const taskReminderDetails = document.createElement('details');
    taskReminderDetails.className = 'task-reminder-details';

    const taskReminderSummary = document.createElement('summary');
    taskReminderSummary.textContent = 'Reminder and calendar options';
    taskReminderDetails.append(taskReminderSummary);

    const reminderControls = document.createElement('div');
    reminderControls.className = 'reminder-controls';

    const reminderEditor = document.createElement('input');
    reminderEditor.className = 'task-reminder-input';
    reminderEditor.type = 'datetime-local';
    reminderEditor.value = task.remindAt === null ? '' : toLocalDateTimeValue(task.remindAt);
    reminderEditor.setAttribute('aria-label', `Reminder date and time for ${task.text}`);
    reminderEditor.min = toLocalDateTimeValue(Date.now());

    const saveReminderButton = document.createElement('button');
    saveReminderButton.className = 'task-action';
    saveReminderButton.type = 'button';
    saveReminderButton.dataset.action = 'save-reminder';
    saveReminderButton.textContent = 'Save reminder';

    const clearReminderButton = document.createElement('button');
    clearReminderButton.className = 'task-action';
    clearReminderButton.type = 'button';
    clearReminderButton.dataset.action = 'clear-reminder';
    clearReminderButton.setAttribute('aria-label', `Clear reminder for ${task.text}`);
    clearReminderButton.textContent = 'Clear reminder';

    reminderControls.append(reminderEditor, saveReminderButton, clearReminderButton);
    taskReminderDetails.append(reminderControls);
    item.append(checkbox, taskDetails, editButton, deleteButton, taskReminderDetails);

    if (task.remindAt !== null) {
      const calendarControls = document.createElement('div');
      calendarControls.className = 'calendar-controls';

      const downloadCalendarButton = document.createElement('button');
      downloadCalendarButton.className = 'task-action';
      downloadCalendarButton.type = 'button';
      downloadCalendarButton.dataset.action = 'download-ics';
      downloadCalendarButton.setAttribute('aria-label', `Download calendar event for ${task.text}`);
      downloadCalendarButton.textContent = 'Add to Calendar (.ics)';

      const googleCalendarLink = document.createElement('a');
      googleCalendarLink.className = 'task-action calendar-link';
      googleCalendarLink.href = buildGoogleCalendarURL(task);
      googleCalendarLink.target = '_blank';
      googleCalendarLink.rel = 'noopener noreferrer';
      googleCalendarLink.setAttribute('aria-label', `Open Google Calendar event for ${task.text}`);
      googleCalendarLink.textContent = 'Google Calendar';

      calendarControls.append(downloadCalendarButton, googleCalendarLink);
      taskReminderDetails.append(calendarControls);
    }

    taskList.append(item);
  });

  const activeCount = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} left`;

  filterButtons.forEach((button) => {
    const isSelected = button.dataset.filter === currentFilter;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

/** Read the form and add a new task to the array. */
function addTask(event) {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) {
    formMessage.textContent = 'Please enter a task before adding it.';
    taskInput.focus();
    return;
  }

  if (text.length > 120) {
    formMessage.textContent = 'Please keep your task to 120 characters or fewer.';
    taskInput.focus();
    return;
  }

  const reminderValue = reminderInput.value;
  const remindAt = reminderValue ? new Date(reminderValue).getTime() : null;

  if (reminderValue && (!Number.isFinite(remindAt) || remindAt <= Date.now())) {
    formMessage.textContent = 'Please choose a reminder time in the future.';
    reminderInput.focus();
    updateReminderMinimum();
    return;
  }

  const durationMinutes = durationInput.value ? Number(durationInput.value) : null;
  const deadlineAt = durationMinutes === null
    ? null
    : Date.now() + durationMinutes * 60 * 1000;

  tasks.push({
    id: createTaskId(),
    text,
    completed: false,
    remindAt,
    notified: false,
    durationMinutes,
    deadlineAt,
  });

  taskInput.value = '';
  reminderInput.value = '';
  durationInput.value = '';
  formMessage.textContent = '';
  saveTasks();
  render();
  taskInput.focus();
}

/** Remove the task with the matching id, then refresh the view. */
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

/** Ask for replacement text and update a task if the user confirms it. */
function editTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return;
  }

  const replacement = window.prompt('Edit your task:', task.text);

  // Cancel leaves the original task unchanged.
  if (replacement === null) {
    return;
  }

  const text = replacement.trim();
  if (!text) {
    window.alert('A task cannot be empty. Your original task was kept.');
    return;
  }

  if (text.length > 120) {
    window.alert('Please keep your task to 120 characters or fewer.');
    return;
  }

  tasks = tasks.map((item) => item.id === id ? { ...item, text } : item);
  saveTasks();
  render();
}

/** Set, change, or clear the reminder for one existing task. */
function updateTaskReminder(id, value) {
  let remindAt = null;

  if (value) {
    remindAt = new Date(value).getTime();
    if (!Number.isFinite(remindAt) || remindAt <= Date.now()) {
      formMessage.textContent = 'Please choose a reminder time in the future.';
      updateReminderMinimum();
      return;
    }
  }

  tasks = tasks.map((task) => task.id === id
    ? { ...task, remindAt, notified: false }
    : task
  );
  formMessage.textContent = '';
  saveTasks();
  render();
}

/** Flip a task between active and completed. */
function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }

    return task;
  });

  saveTasks();
  render();
}

/** Change which tasks render, without changing the saved task data. */
function setFilter(filter) {
  currentFilter = filter;
  render();
}

/** Remove all completed tasks, then save and render the remaining list. */
function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
}

/** Handle task actions from one listener on the list. */
function handleTaskListClick(event) {
  const item = event.target.closest('.task-item');

  // Ignore clicks outside a task row.
  if (!item || !taskList.contains(item)) {
    return;
  }

  const taskId = item.dataset.taskId;
  const deleteButton = event.target.closest('[data-action="delete"]');
  const editButton = event.target.closest('[data-action="edit"]');
  const saveReminderButton = event.target.closest('[data-action="save-reminder"]');
  const clearReminderButton = event.target.closest('[data-action="clear-reminder"]');
  const downloadCalendarButton = event.target.closest('[data-action="download-ics"]');

  if (deleteButton) {
    item.classList.add('is-removing');
    window.setTimeout(() => deleteTask(taskId), 180);
  } else if (editButton) {
    editTask(taskId);
  } else if (saveReminderButton) {
    const reminderEditor = item.querySelector('.task-reminder-input');
    updateTaskReminder(taskId, reminderEditor.value);
  } else if (clearReminderButton) {
    updateTaskReminder(taskId, '');
  } else if (downloadCalendarButton) {
    const task = tasks.find((item) => item.id === taskId);
    if (task && task.remindAt !== null) {
      downloadICS(task);
    }
  }
}

/** Handle checkbox changes from one listener on the list. */
function handleTaskListChange(event) {
  if (!event.target.matches('.task-checkbox')) {
    return;
  }

  const item = event.target.closest('.task-item');
  if (item) {
    toggleTask(item.dataset.taskId);
  }
}

// A form submit event supports both clicking the button and pressing Enter.
taskForm.addEventListener('submit', addTask);
taskList.addEventListener('click', handleTaskListClick);
taskList.addEventListener('change', handleTaskListChange);
filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});
clearCompletedButton.addEventListener('click', clearCompleted);

// Clear an old validation message as soon as the user starts correcting it.
taskInput.addEventListener('input', () => {
  formMessage.textContent = '';
});
reminderInput.addEventListener('focus', updateReminderMinimum);
reminderInput.addEventListener('input', () => {
  formMessage.textContent = '';
});

// Restore the saved state before drawing the first page view.
showGreeting();
tasks = loadTasks();
markOverdueRemindersMissed();
updateReminderMinimum();
render();

// Background tabs may throttle timers, so also check when the page reappears.
window.setInterval(() => {
  checkReminders();
  updateCountdowns();
}, 1000);
document.addEventListener('visibilitychange', handleVisibilityChange);
enableSoundButton.addEventListener('click', enableAlarmSound);
enableNotificationsButton.addEventListener('click', enableNotifications);
snoozeAlarmButton.addEventListener('click', snoozeActiveAlarm);
dismissAlarmButton.addEventListener('click', dismissAlarm);
testAlarmButton.addEventListener('click', testAlarm);
alarmDialog.addEventListener('cancel', (event) => {
  // Escape is treated as Dismiss / Done so the sound cannot be orphaned.
  event.preventDefault();
  dismissAlarm();
});

// The first real interaction unlocks sound without requiring a separate setup click.
document.addEventListener('pointerdown', enableAlarmSound, { once: true });
document.addEventListener('keydown', enableAlarmSound, { once: true });
registerServiceWorker();
