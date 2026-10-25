const ALARMS_STORAGE_KEY = 'synent-todo-alarms';
const ALARM_SOUND_STORAGE_KEY = 'synent-todo-alarm-sound';
const ALARM_SOUND_DB = 'synent-todo-alarm-audio';
const ALARM_SOUND_STORE = 'sounds';

const alarmForm = document.querySelector('#alarm-form');
const alarmLabel = document.querySelector('#alarm-label');
const alarmTime = document.querySelector('#alarm-time');
const alarmSoundSelect = document.querySelector('#alarm-sound');
const alarmSoundPreview = document.querySelector('#alarm-sound-preview');
const alarmSoundUpload = document.querySelector('#alarm-sound-upload');
const alarmSoundHelp = document.querySelector('#alarm-sound-help');
const alarmMessage = document.querySelector('#alarm-message');
const alarmList = document.querySelector('#alarm-list');
const ringingDialog = document.querySelector('#ringing-dialog');
const ringingMessage = document.querySelector('#ringing-message');
const dismissAlarmButton = document.querySelector('#dismiss-alarm');
const notificationButton = document.querySelector('#enable-notifications');
const notificationHelp = document.querySelector('#notification-help');

const alarmSounds = window.alarmPresets;
let alarms = loadAlarms();
let selectedAlarmSound = loadAlarmSoundPreference();
let uploadedSounds = [];
let customAlarmSoundUrl = '';
const customAlarmAudio = new Audio();
let audioContext;
let alarmSoundTimer;
let activeAlarmQueue = [];

function createAlarmId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadAlarms() {
  try {
    const savedAlarms = JSON.parse(localStorage.getItem(ALARMS_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedAlarms)) return [];

    return savedAlarms.filter((alarm) =>
      alarm &&
      typeof alarm.id === 'string' &&
      typeof alarm.label === 'string' &&
      Number.isFinite(alarm.time) &&
      (alarmSounds.some((sound) => sound.id === alarm.sound) ||
        alarm.sound === 'custom' ||
        (typeof alarm.sound === 'string' && alarm.sound.startsWith('device:'))) &&
      typeof alarm.enabled === 'boolean'
    );
  } catch (error) {
    console.warn('Could not load saved alarms.', error);
    return [];
  }
}

function saveAlarms() {
  try {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
    return true;
  } catch (error) {
    console.error('Could not save alarms.', error);
    alarmMessage.textContent = 'Your alarms could not be saved in this browser.';
    return false;
  }
}

function loadAlarmSoundPreference() {
  try {
    return localStorage.getItem(ALARM_SOUND_STORAGE_KEY) || alarmSounds[0].id;
  } catch (error) {
    console.warn('Could not load the alarm sound preference.', error);
    return alarmSounds[0].id;
  }
}

function saveAlarmSoundPreference(soundId) {
  try {
    localStorage.setItem(ALARM_SOUND_STORAGE_KEY, soundId);
  } catch (error) {
    console.error('Could not save the alarm sound preference.', error);
    alarmMessage.textContent = 'Your sound selection could not be saved.';
  }
}

function updateNotificationStatus() {
  if (!window.isSecureContext || !('Notification' in window)) {
    notificationButton.disabled = true;
    notificationHelp.textContent = 'Notifications are unavailable here. Use a secure HTTPS site in a supported browser.';
    return;
  }

  if (Notification.permission === 'granted') {
    notificationButton.textContent = 'Background notifications enabled';
    notificationButton.disabled = true;
    notificationHelp.textContent = 'Notifications can appear while this page is open in the background. They cannot run after the app is closed.';
    return;
  }

  if (Notification.permission === 'denied') {
    notificationButton.disabled = true;
    notificationHelp.textContent = 'Notifications are blocked in browser settings. You can change that permission there.';
    return;
  }

  notificationHelp.textContent = 'Allow notifications for a reminder when this page is open but in the background.';
}

async function enableNotifications() {
  if (!window.isSecureContext || !('Notification' in window)) {
    updateNotificationStatus();
    return;
  }

  try {
    await Notification.requestPermission();
    updateNotificationStatus();
  } catch (error) {
    console.error('Could not request notification permission.', error);
    notificationHelp.textContent = 'The browser could not enable notifications. Check browser settings and try again.';
  }
}

function notifyAlarm(alarm) {
  if (document.visibilityState === 'visible' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(alarm.label || 'Your scheduled alarm is due.', {
      body: 'Open the Alarms page to dismiss this reminder.',
      tag: `todo-alarm-${alarm.id}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Could not show the alarm notification.', error);
    notificationHelp.textContent = 'The browser could not show an alarm notification.';
  }
}

function openAlarmSoundDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('This browser does not support saved audio files.'));
      return;
    }

    const request = window.indexedDB.open(ALARM_SOUND_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ALARM_SOUND_STORE)) {
        request.result.createObjectStore(ALARM_SOUND_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open audio storage.'));
  });
}

async function saveUploadedSound(file, id) {
  const database = await openAlarmSoundDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ALARM_SOUND_STORE, 'readwrite');
    transaction.objectStore(ALARM_SOUND_STORE).put({ blob: file, name: file.name }, id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Could not save the audio file.'));
    transaction.onabort = () => reject(transaction.error || new Error('Saving the audio file was cancelled.'));
  });
  database.close();
}

async function loadUploadedSounds() {
  const database = await openAlarmSoundDatabase();
  const sounds = await new Promise((resolve, reject) => {
    const transaction = database.transaction(ALARM_SOUND_STORE, 'readonly');
    const store = transaction.objectStore(ALARM_SOUND_STORE);
    const keysRequest = store.getAllKeys();
    const valuesRequest = store.getAll();
    transaction.oncomplete = () => {
      resolve(keysRequest.result.map((id, index) => ({ id, ...valuesRequest.result[index] })));
    };
    transaction.onerror = () => reject(transaction.error || new Error('Could not load uploaded sounds.'));
  });
  database.close();
  return sounds.filter((sound) => sound.blob instanceof Blob);
}

function soundDisplayName(soundId) {
  const preset = alarmSounds.find((sound) => sound.id === soundId);
  if (preset) return preset.name;
  if (soundId === 'custom') return uploadedSounds.find((sound) => sound.id === 'custom')?.name || 'Uploaded sound';
  return uploadedSounds.find((sound) => `device:${sound.id}` === soundId)?.name || 'Uploaded sound';
}

function renderSoundOptions() {
  const previousValue = alarmSoundSelect.value || selectedAlarmSound;
  alarmSoundSelect.replaceChildren();

  alarmSounds.forEach((sound, index) => {
    const option = document.createElement('option');
    option.value = sound.id;
    option.textContent = `${String(index + 1).padStart(2, '0')} · ${sound.name}`;
    alarmSoundSelect.append(option);
  });

  uploadedSounds.forEach((sound) => {
    const option = document.createElement('option');
    option.value = sound.id === 'custom' ? 'custom' : `device:${sound.id}`;
    option.textContent = `Device · ${sound.name}`;
    alarmSoundSelect.append(option);
  });

  if (![...alarmSoundSelect.options].some((option) => option.value === previousValue)) {
    alarmSoundSelect.value = alarmSounds[0].id;
  } else {
    alarmSoundSelect.value = previousValue;
  }
  selectedAlarmSound = alarmSoundSelect.value;
}

function renderAlarms() {
  alarmList.replaceChildren();
  if (alarms.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.className = 'alarm-empty-state';
    emptyState.textContent = 'No alarms scheduled yet.';
    alarmList.append(emptyState);
    return;
  }

  [...alarms].sort((first, second) => first.time - second.time).forEach((alarm) => {
    const item = document.createElement('li');
    item.className = 'alarm-list-item';
    item.dataset.alarmId = alarm.id;

    const details = document.createElement('div');
    details.className = 'alarm-details';
    const name = document.createElement('strong');
    name.textContent = alarm.label || 'Alarm';
    const schedule = document.createElement('span');
    schedule.textContent = `${new Date(alarm.time).toLocaleString()} · ${soundDisplayName(alarm.sound)} · ${alarm.enabled ? 'Scheduled' : 'Rang'}`;

    const remove = document.createElement('button');
    remove.className = 'alarm-delete-button';
    remove.type = 'button';
    remove.dataset.action = 'delete-alarm';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete alarm ${alarm.label || 'Alarm'}`);

    details.append(name, schedule);
    item.append(details, remove);
    alarmList.append(item);
  });
}

function getLocalDateTimeValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

async function playAlarmSound(soundId) {
  const uploaded = uploadedSounds.find((sound) =>
    soundId === 'custom' ? sound.id === 'custom' : `device:${sound.id}` === soundId
  );
  if (uploaded) {
    try {
      customAlarmAudio.pause();
      if (customAlarmSoundUrl) URL.revokeObjectURL(customAlarmSoundUrl);
      customAlarmSoundUrl = URL.createObjectURL(uploaded.blob);
      customAlarmAudio.src = customAlarmSoundUrl;
      customAlarmAudio.loop = true;
      customAlarmAudio.currentTime = 0;
      await customAlarmAudio.play();
      return;
    } catch (error) {
      console.error('Could not play the selected uploaded alarm sound.', error);
      ringingMessage.textContent = 'The uploaded sound could not be played. Dismiss this alarm and choose another sound.';
      return;
    }
  }

  try {
    if (typeof window.AudioContext !== 'function') {
      throw new Error('This browser does not support generated alarm sounds.');
    }
    if (!audioContext) audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    const sound = alarmSounds.find((preset) => preset.id === soundId);
    if (!sound) throw new Error('The selected alarm sound is not available.');
    const startTime = audioContext.currentTime;

    sound.frequencies.forEach((frequency, index) => {
      const noteStart = startTime + index * sound.spacing;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      volume.gain.setValueAtTime(0.0001, noteStart);
      volume.gain.exponentialRampToValueAtTime(0.22, noteStart + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + sound.duration);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + sound.duration);
    });
  } catch (error) {
    console.error('Could not play the alarm sound.', error);
    ringingMessage.textContent = 'The alarm sound could not be played. Check your device audio.';
  }
}

function addAlarm(event) {
  event.preventDefault();
  const time = new Date(alarmTime.value).getTime();
  if (!Number.isFinite(time) || time <= Date.now()) {
    alarmMessage.textContent = 'Choose a date and time in the future.';
    alarmTime.focus();
    return;
  }

  alarms.push({
    id: createAlarmId(),
    label: alarmLabel.value.trim(),
    time,
    sound: alarmSoundSelect.value,
    enabled: true,
  });
  if (!saveAlarms()) return;

  alarmForm.reset();
  alarmTime.min = getLocalDateTimeValue(new Date(Date.now() + 1000));
  alarmSoundSelect.value = selectedAlarmSound;
  alarmMessage.textContent = 'Alarm saved. Keep this page open for it to ring; notifications may appear in the background if enabled.';
  renderAlarms();
}

function checkAlarms() {
  const due = alarms.filter((alarm) => alarm.enabled && alarm.time <= Date.now());
  if (!due.length) return;

  due.forEach((alarm) => {
    alarm.enabled = false;
    activeAlarmQueue.push(alarm);
    notifyAlarm(alarm);
  });
  saveAlarms();
  renderAlarms();
  if (activeAlarmQueue.length === due.length) startNextAlarm();
}

function startNextAlarm() {
  const alarm = activeAlarmQueue[0];
  if (!alarm) return;

  ringingMessage.textContent = alarm.label || 'Your scheduled alarm is due.';
  if (!ringingDialog.open) ringingDialog.showModal();
  playAlarmSound(alarm.sound);
  if (!uploadedSounds.some((sound) =>
    alarm.sound === 'custom' ? sound.id === 'custom' : `device:${sound.id}` === alarm.sound
  )) {
    alarmSoundTimer = window.setInterval(() => playAlarmSound(alarm.sound), 1600);
  }
}

function dismissAlarm() {
  window.clearInterval(alarmSoundTimer);
  alarmSoundTimer = undefined;
  customAlarmAudio.pause();
  customAlarmAudio.currentTime = 0;
  activeAlarmQueue.shift();
  ringingDialog.close();
  startNextAlarm();
}

alarmForm.addEventListener('submit', addAlarm);

alarmSoundSelect.addEventListener('change', () => {
  selectedAlarmSound = alarmSoundSelect.value;
  saveAlarmSoundPreference(selectedAlarmSound);
});

alarmSoundUpload.addEventListener('change', async () => {
  const [file] = alarmSoundUpload.files;
  if (!file) return;
  if (!file.type.startsWith('audio/')) {
    alarmMessage.textContent = 'Choose a valid audio file.';
    alarmSoundUpload.value = '';
    return;
  }

  const soundId = `device-${createAlarmId()}`;
  try {
    await saveUploadedSound(file, soundId);
    uploadedSounds.push({ id: soundId, name: file.name, blob: file });
    renderSoundOptions();
    alarmSoundSelect.value = `device:${soundId}`;
    selectedAlarmSound = alarmSoundSelect.value;
    saveAlarmSoundPreference(selectedAlarmSound);
    alarmSoundHelp.textContent = `${file.name} is saved alongside your other uploaded sounds.`;
    alarmMessage.textContent = '';
    alarmSoundUpload.value = '';
  } catch (error) {
    console.error('Could not save the uploaded alarm sound.', error);
    alarmMessage.textContent = 'The sound could not be saved. Check browser storage and try again.';
  }
});

alarmSoundPreview.addEventListener('click', async () => {
  await playAlarmSound(alarmSoundSelect.value);
  if (alarmSoundSelect.value.startsWith('device:') || alarmSoundSelect.value === 'custom') {
    window.setTimeout(() => {
      customAlarmAudio.pause();
      customAlarmAudio.currentTime = 0;
    }, 2500);
  }
});

alarmList.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-action="delete-alarm"]');
  if (!remove) return;
  const item = remove.closest('.alarm-list-item');
  alarms = alarms.filter((alarm) => alarm.id !== item.dataset.alarmId);
  saveAlarms();
  renderAlarms();
});

dismissAlarmButton.addEventListener('click', dismissAlarm);
notificationButton.addEventListener('click', enableNotifications);
ringingDialog.addEventListener('cancel', (event) => event.preventDefault());

alarmTime.min = getLocalDateTimeValue(new Date(Date.now() + 1000));
renderAlarms();
updateNotificationStatus();

loadUploadedSounds().then((sounds) => {
  uploadedSounds = sounds;
  renderSoundOptions();
  if (uploadedSounds.length) {
    alarmSoundHelp.textContent = `${uploadedSounds.length} uploaded sound${uploadedSounds.length === 1 ? '' : 's'} saved in this browser.`;
  }
  if (!alarmSoundSelect.value) {
    alarmSoundSelect.value = alarmSounds[0].id;
    selectedAlarmSound = alarmSoundSelect.value;
  }
}).catch((error) => {
  console.error('Could not load uploaded alarm sounds.', error);
  alarmSoundHelp.textContent = 'Saved audio could not be loaded. You can still use the built-in sounds.';
  renderSoundOptions();
});

window.setInterval(checkAlarms, 1000);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && ringingDialog.open) event.preventDefault();
});
window.addEventListener('beforeunload', () => {
  window.clearInterval(alarmSoundTimer);
  customAlarmAudio.pause();
  if (customAlarmSoundUrl) URL.revokeObjectURL(customAlarmSoundUrl);
});
