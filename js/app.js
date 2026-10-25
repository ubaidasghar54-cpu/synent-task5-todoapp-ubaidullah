const STORAGE_KEY = 'synent-todo-tasks';
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskList = document.querySelector('#task-list');
const formMessage = document.querySelector('#form-message');
const motivationalQuote = document.querySelector('#motivational-quote');
const menuToggle = document.querySelector('#menu-toggle');
const sideMenu = document.querySelector('#side-menu');
const menuBackdrop = document.querySelector('#menu-backdrop');
const menuClose = document.querySelector('#menu-close');
const soundOptions = document.querySelector('.sound-options');
const soundUpload = document.querySelector('#sound-upload');
const customSoundOption = document.querySelector('#custom-sound-option');
const customSoundRadio = customSoundOption.querySelector('input');
const customSoundLabel = document.querySelector('#custom-sound-label');
const soundHelp = document.querySelector('#sound-help');
const alarmOpenButton = document.querySelector('#alarm-open-button');
const alarmDialog = document.querySelector('#alarm-dialog');
const alarmClose = document.querySelector('#alarm-close');
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

const dailyQuotes = [
  'Small steps every day lead to big results. 🌱',
  'You have what it takes to make today count. 💪',
  'Progress begins with showing up. ✨',
  'One task at a time—you are making it happen. 🚀',
];
const completionQuotes = [
  'Fantastic work! Every finished task is progress. 🎉',
  'You did it! Take a moment to celebrate your win. 🏆',
  'One more task conquered—keep that momentum going! 🔥',
  'Done and dusted! You are building great habits. ✅',
];
const quoteOpenings = [
  'Start with one small step. 🌱',
  'Choose progress over perfection. ✨',
  'Focus on the task in front of you. 🎯',
  'Take a breath and begin again. 🌤️',
  'Make today count, one choice at a time. 💪',
  'Keep showing up for your goals. 🚀',
  'Turn your plans into action. 🔥',
  'Give your best to this next step. 🌟',
  'Build momentum with one useful action. ⚡',
  'Trust yourself enough to begin. 🧭',
  'Let your effort lead the way. 🛤️',
  'Keep moving at your own pace. 🐢',
  'Make room for steady progress. 🌿',
  'Bring your attention back to now. 🧠',
  'Take the next step with courage. 🦁',
  'Keep your eyes on what matters. 👀',
  'Make a little progress today. ☀️',
  'Give this moment your full focus. 🔎',
  'Turn a challenge into a chance to grow. 🌻',
  'Keep your goals within reach. 🙌',
  'Start where you are and use what you have. 🧰',
  'Make consistency your superpower. 🦸',
  'Keep your determination strong. 🏋️',
  'Take action before doubt takes over. 🎬',
  'Celebrate the effort you bring. 🎉',
  'Let each task teach you something. 📚',
  'Choose one thing and see it through. ✅',
  'Keep building the future you want. 🏗️',
  'Give yourself credit for trying. 💛',
  'Move forward with purpose. 🧭',
  'Make your next move a positive one. ➡️',
  'Keep your spark alive. 💫',
];
const quoteEncouragements = [
  'You are capable of more than you realize.',
  'Every bit of progress adds up.',
  'Your effort is making a difference.',
  'You are closer than you were yesterday.',
  'Small wins create lasting momentum.',
  'You can handle one step at a time.',
  'Your future self will thank you.',
  'There is strength in staying consistent.',
  'You are learning as you go.',
  'A fresh start is always within reach.',
  'Your dedication deserves to be celebrated.',
  'You have already made it this far.',
  'Good things grow from steady effort.',
  'You are turning intention into achievement.',
  'Your pace is the right pace for you.',
  'Each attempt makes you stronger.',
  'You deserve to feel proud of your progress.',
  'The next step can change everything.',
  'You have the focus to make it happen.',
  'A little patience can lead to big results.',
  'Your hard work is building something meaningful.',
  'You can make today a day to remember.',
  'Keep believing in the progress you are making.',
  'Your determination is taking you places.',
  'You are creating habits that will support you.',
  'There is no small victory when you keep going.',
  'You have what it takes to finish strong.',
  'Every completed step is worth celebrating.',
  'Your choices today shape a brighter tomorrow.',
  'You are doing better than you think.',
  'Progress is proof that your effort matters.',
  'The work you do now is an investment in you.',
];
const generatedQuotes = quoteOpenings.flatMap((opening) =>
  quoteEncouragements.map((encouragement) => `${opening} ${encouragement}`)
);
const allQuotes = [...dailyQuotes, ...completionQuotes, ...generatedQuotes];
const SOUND_STORAGE_KEY = 'synent-todo-completion-sound';
const builtInSounds = {
  chime: { frequencies: [523.25, 659.25, 783.99, 1046.5], type: 'triangle', spacing: 0.09, duration: 0.24, volume: 0.16 },
  fanfare: { frequencies: [392, 523.25, 659.25, 783.99, 1046.5], type: 'square', spacing: 0.07, duration: 0.18, volume: 0.1 },
  bell: { frequencies: [783.99, 987.77, 1174.66], type: 'sine', spacing: 0.18, duration: 0.45, volume: 0.12 },
};
const alarmPresetNames = [
  'Power Up', 'Sunrise Rush', 'Victory March', 'Rocket Launch', 'Bright Sparks',
  'Champion Call', 'Electric Rise', 'Morning Bounce', 'Brass Charge', 'Starburst',
  'High Energy', 'Winning Streak', 'Upbeat Pulse', 'Big Finish', 'Sky High',
  'Bold Start', 'Supercharge', 'Triumph Bells', 'Fast Forward', 'Rise and Shine',
];
const alarmPresetIntervals = [
  [1, 5, 8, 12], [1, 4, 7, 11], [1, 5, 8, 10], [1, 3, 7, 12],
  [1, 6, 8, 13], [1, 4, 8, 12], [1, 5, 9, 12], [1, 3, 8, 10],
  [1, 5, 7, 12], [1, 6, 9, 13], [1, 4, 7, 10], [1, 5, 8, 14],
  [1, 3, 6, 10], [1, 5, 9, 13], [1, 4, 8, 11], [1, 6, 10, 14],
  [1, 3, 7, 11], [1, 5, 10, 13], [1, 4, 9, 12], [1, 6, 8, 12],
];
const alarmSounds = alarmPresetNames.map((name, index) => ({
  id: `preset-${index + 1}`,
  name,
  frequencies: alarmPresetIntervals[index].map((interval) => 220 * (2 ** (interval / 12))),
  type: ['square', 'sawtooth', 'triangle', 'sine'][index % 4],
  spacing: 0.1 + (index % 3) * 0.025,
  duration: 0.18 + (index % 4) * 0.035,
}));
const ALARMS_STORAGE_KEY = 'synent-todo-alarms';
const ALARM_SOUND_STORAGE_KEY = 'synent-todo-alarm-sound';
const ALARM_SOUND_DB = 'synent-todo-alarm-audio';
const ALARM_SOUND_STORE = 'sounds';
let currentQuote = '';
let quoteDeck = [];
let quoteTimer;
let audioContext;
let selectedSound = loadSoundPreference();
let uploadedSoundUrl = '';
let uploadedSoundName = '';
const uploadedSound = new Audio();
let alarms = loadAlarms();
let selectedAlarmSound = loadAlarmSoundPreference();
let customAlarmSoundUrl = '';
const customAlarmAudio = new Audio();
let alarmCheckTimer;
let alarmSoundTimer;
let activeAlarmQueue = [];

let tasks = loadTasks();

/** Shuffle the quote deck and avoid repeating the previous quote at a cycle boundary. */
function refillQuoteDeck() {
  quoteDeck = [...allQuotes];
  for (let index = quoteDeck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [quoteDeck[index], quoteDeck[swapIndex]] = [quoteDeck[swapIndex], quoteDeck[index]];
  }

  if (quoteDeck.length > 1 && quoteDeck[0] === currentQuote) {
    quoteDeck.push(quoteDeck.shift());
  }
}

/** Draw the next unused quote, preferring completion quotes after a task is checked. */
function takeNextQuote(preferredQuotes = allQuotes) {
  if (quoteDeck.length === 0) refillQuoteDeck();

  const preferredIndex = quoteDeck.findIndex((quote) => preferredQuotes.includes(quote));
  return quoteDeck.splice(preferredIndex < 0 ? 0 : preferredIndex, 1)[0];
}

/** Animate each quote in, hold it for five seconds, then animate it out. */
function showNextQuote(preferredQuotes = allQuotes) {
  window.clearTimeout(quoteTimer);
  motivationalQuote.classList.remove('is-entering', 'is-visible', 'is-exiting');
  currentQuote = takeNextQuote(preferredQuotes);
  motivationalQuote.textContent = currentQuote;

  void motivationalQuote.offsetWidth;
  motivationalQuote.classList.add('is-entering');
  quoteTimer = window.setTimeout(() => {
    motivationalQuote.classList.remove('is-entering');
    motivationalQuote.classList.add('is-visible');
    quoteTimer = window.setTimeout(() => {
      motivationalQuote.classList.remove('is-visible');
      motivationalQuote.classList.add('is-exiting');
      quoteTimer = window.setTimeout(() => showNextQuote(), 600);
    }, 5000);
  }, 600);
}

/** Open or close the navigation drawer and optionally return focus to its trigger. */
function setMenuOpen(isOpen, restoreFocus = true) {
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  sideMenu.hidden = !isOpen;
  menuBackdrop.hidden = !isOpen;
  sideMenu.classList.toggle('is-open', isOpen);

  if (isOpen) {
    alarmOpenButton.focus();
  } else if (restoreFocus) {
    menuToggle.focus();
  }
}

/** Read a saved built-in sound preference. */
function loadSoundPreference() {
  try {
    const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
    return Object.prototype.hasOwnProperty.call(builtInSounds, savedSound) ? savedSound : 'chime';
  } catch (error) {
    console.warn('Could not load the completion sound preference.', error);
    return 'chime';
  }
}

/** Save a built-in sound preference and report storage errors. */
function saveSoundPreference(sound) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, sound);
  } catch (error) {
    console.error('Could not save the completion sound preference.', error);
    formMessage.textContent = 'Your sound choice could not be saved in this browser.';
  }
}

/** Load saved alarms and discard malformed records. */
function loadAlarms() {
  try {
    const savedAlarms = JSON.parse(localStorage.getItem(ALARMS_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedAlarms)) return [];

    return savedAlarms
      .filter((alarm) =>
        alarm &&
        typeof alarm.id === 'string' &&
        typeof alarm.label === 'string' &&
        Number.isFinite(alarm.time) &&
        (alarm.sound === 'custom' || alarmSounds.some((sound) => sound.id === alarm.sound)) &&
        typeof alarm.enabled === 'boolean'
      )
      .map(({ id, label, time, sound, enabled }) => ({ id, label, time, sound, enabled }));
  } catch (error) {
    console.warn('Could not load saved alarms.', error);
    return [];
  }
}

/** Persist alarm schedules in localStorage. */
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

/** Load the selected built-in alarm sound. */
function loadAlarmSoundPreference() {
  try {
    const selectedId = localStorage.getItem(ALARM_SOUND_STORAGE_KEY);
    return selectedId === 'custom' || alarmSounds.some((sound) => sound.id === selectedId)
      ? selectedId
      : alarmSounds[0].id;
  } catch (error) {
    console.warn('Could not load the alarm sound preference.', error);
    return alarmSounds[0].id;
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

async function saveCustomAlarmSound(file) {
  const database = await openAlarmSoundDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ALARM_SOUND_STORE, 'readwrite');
    transaction.objectStore(ALARM_SOUND_STORE).put({ blob: file, name: file.name }, 'custom');
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Could not save the audio file.'));
    transaction.onabort = () => reject(transaction.error || new Error('Saving the audio file was cancelled.'));
  });
  database.close();
}

async function loadCustomAlarmSound() {
  const database = await openAlarmSoundDatabase();
  const soundFile = await new Promise((resolve, reject) => {
    const request = database.transaction(ALARM_SOUND_STORE, 'readonly')
      .objectStore(ALARM_SOUND_STORE)
      .get('custom');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not read the saved audio file.'));
  });
  database.close();
  return soundFile;
}

/** Render the sound choices and saved alarms using safe DOM text. */
function renderAlarmSettings() {
  if (!alarmSoundSelect.options.length) {
    alarmSounds.forEach(({ id, name }, index) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${String(index + 1).padStart(2, '0')} · ${name}`;
      alarmSoundSelect.append(option);
    });
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Uploaded device sound';
    customOption.disabled = true;
    alarmSoundSelect.append(customOption);
  }
  alarmSoundSelect.value = selectedAlarmSound;

  alarmList.replaceChildren();
  if (alarms.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'alarm-empty-state';
    emptyMessage.textContent = 'No alarms scheduled yet.';
    alarmList.append(emptyMessage);
    return;
  }

  [...alarms].sort((first, second) => first.time - second.time).forEach((alarm) => {
    const item = document.createElement('li');
    item.className = 'alarm-list-item';
    item.dataset.alarmId = alarm.id;

    const details = document.createElement('div');
    details.className = 'alarm-details';
    const label = document.createElement('strong');
    label.textContent = alarm.label || 'Alarm';
    const schedule = document.createElement('span');
    const soundName = alarmSounds.find((sound) => sound.id === alarm.sound)?.name || 'Uploaded sound';
    const alarmState = alarm.enabled ? 'Scheduled' : 'Rang';
    schedule.textContent = `${new Date(alarm.time).toLocaleString()} · ${soundName} · ${alarmState}`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'alarm-delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete-alarm';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete alarm ${alarm.label || 'Alarm'}`);

    details.append(label, schedule);
    item.append(details, deleteButton);
    alarmList.append(item);
  });
}

function persistAlarmSoundPreference(soundId) {
  try {
    localStorage.setItem(ALARM_SOUND_STORAGE_KEY, soundId);
  } catch (error) {
    console.error('Could not save the alarm sound preference.', error);
    alarmMessage.textContent = 'Your alarm sound choice could not be saved.';
  }
}

/** Play one energetic sequence for an alarm. */
async function playAlarmSound(soundId) {
  if (soundId === 'custom') {
    try {
      if (!customAlarmSoundUrl) {
        const savedSound = await loadCustomAlarmSound();
        if (!savedSound?.blob) throw new Error('No uploaded alarm sound is available.');
        customAlarmSoundUrl = URL.createObjectURL(savedSound.blob);
        customAlarmAudio.src = customAlarmSoundUrl;
      }

      customAlarmAudio.loop = true;
      customAlarmAudio.currentTime = 0;
      await customAlarmAudio.play();
      return;
    } catch (error) {
      console.error('Could not play the uploaded alarm sound.', error);
      ringingMessage.textContent = 'The uploaded alarm sound could not be played. Dismiss and choose a built-in alarm sound.';
      return;
    }
  }

  if (typeof window.AudioContext !== 'function') {
    ringingMessage.textContent = 'This browser does not support generated alarm sounds.';
    return;
  }

  try {
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
    ringingMessage.textContent = 'The alarm sound could not be played. Dismiss and check your device audio.';
  }
}

async function prepareAlarmAudio() {
  if (typeof window.AudioContext !== 'function') return;

  try {
    if (!audioContext) audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();
  } catch (error) {
    console.warn('Could not prepare alarm audio playback.', error);
    alarmMessage.textContent = 'Use Preview selected sound to enable alarm audio in this browser.';
  }
}

function startNextAlarm() {
  const alarm = activeAlarmQueue[0];
  if (!alarm) return;

  ringingMessage.textContent = alarm.label || 'Your scheduled alarm is due.';
  if (!ringingDialog.open) ringingDialog.showModal();
  playAlarmSound(alarm.sound);
  if (alarm.sound !== 'custom') {
    alarmSoundTimer = window.setInterval(() => playAlarmSound(alarm.sound), 1600);
  }
}

function checkScheduledAlarms() {
  const dueAlarms = alarms.filter((alarm) => alarm.enabled && alarm.time <= Date.now());
  if (dueAlarms.length === 0) return;

  dueAlarms.forEach((alarm) => {
    alarm.enabled = false;
    activeAlarmQueue.push(alarm);
  });
  saveAlarms();
  renderAlarmSettings();
  if (activeAlarmQueue.length === dueAlarms.length) startNextAlarm();
}

function dismissActiveAlarm() {
  window.clearInterval(alarmSoundTimer);
  alarmSoundTimer = undefined;
  customAlarmAudio.pause();
  customAlarmAudio.currentTime = 0;
  activeAlarmQueue.shift();
  ringingDialog.close();
  startNextAlarm();
}

function addAlarm(event) {
  event.preventDefault();
  void prepareAlarmAudio();
  const time = new Date(alarmTime.value).getTime();
  if (!Number.isFinite(time) || time <= Date.now()) {
    alarmMessage.textContent = 'Choose a date and time in the future.';
    alarmTime.focus();
    return;
  }

  alarms.push({
    id: createTaskId(),
    label: alarmLabel.value.trim(),
    time,
    sound: alarmSoundSelect.value,
    enabled: true,
  });
  if (!saveAlarms()) return;

  alarmMessage.textContent = 'Alarm added. Keep this app open for it to ring.';
  alarmForm.reset();
  alarmTime.min = getLocalDateTimeValue(new Date(Date.now() + 1000));
  alarmSoundSelect.value = selectedAlarmSound;
  renderAlarmSettings();
}

function getLocalDateTimeValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

/** Play the selected uploaded sound or a generated built-in sound. */
async function playCompletionSound() {
  try {
    if (selectedSound === 'custom' && uploadedSoundUrl) {
      uploadedSound.currentTime = 0;
      await uploadedSound.play();
      return;
    }

    if (typeof window.AudioContext !== 'function') {
      throw new Error('This browser does not support built-in completion sounds.');
    }

    if (!audioContext) audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    const sound = builtInSounds[selectedSound];
    const startTime = audioContext.currentTime;
    sound.frequencies.forEach((frequency, index) => {
      const noteStart = startTime + index * sound.spacing;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      volume.gain.setValueAtTime(0.0001, noteStart);
      volume.gain.exponentialRampToValueAtTime(sound.volume, noteStart + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + sound.duration);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + sound.duration);
    });
  } catch (error) {
    console.error('Could not play the task completion sound.', error);
    formMessage.textContent = 'The selected completion sound could not be played.';
  }
}

/** Read saved tasks from localStorage and ignore records with an invalid shape. */
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) return [];

    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) return [];

    return parsedTasks
      .filter((task) =>
        task &&
        (typeof task.id === 'string' || typeof task.id === 'number') &&
        typeof task.text === 'string' &&
        typeof task.completed === 'boolean'
      )
      .map(({ id, text, completed }) => ({ id, text, completed }));
  } catch (error) {
    console.warn('Could not load saved tasks from localStorage.', error);
    return [];
  }
}

/** Save the full task list so it is restored on the next visit. */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    formMessage.textContent = '';
    return true;
  } catch (error) {
    console.error('Could not save tasks to localStorage.', error);
    formMessage.textContent = 'Your browser could not save the tasks. Check its storage settings.';
    return false;
  }
}

/** Create a unique id, including a fallback for older browsers. */
function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Build the task list with DOM elements so task text is never treated as HTML. */
function renderTasks() {
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-state';
    emptyMessage.textContent = 'No tasks yet. Add your first task above.';
    taskList.append(emptyMessage);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'task-item';
    item.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'task-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} as completed`);

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);

    if (task.completed) {
      item.classList.add('is-completed');
    }

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  });
}

/** Add a new incomplete task from the form. */
function addTask(event) {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    formMessage.textContent = 'Please enter a task before adding it.';
    taskInput.focus();
    return;
  }

  tasks.push({
    id: createTaskId(),
    text,
    completed: false,
  });

  taskInput.value = '';
  saveTasks();
  renderTasks();
  taskInput.focus();
}

/** Toggle the completed state for the task in the changed row. */
function toggleTask(item) {
  const task = tasks.find((savedTask) => String(savedTask.id) === item.dataset.taskId);
  if (!task) return;

  task.completed = !task.completed;
  if (task.completed) {
    showNextQuote(completionQuotes);
    playCompletionSound();
  }
  saveTasks();
  renderTasks();
}

/** Delete the task whose button was clicked. */
function deleteTask(item) {
  tasks = tasks.filter((task) => String(task.id) !== item.dataset.taskId);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', addTask);

taskList.addEventListener('change', (event) => {
  if (!event.target.matches('.task-checkbox')) return;

  const item = event.target.closest('.task-item');
  if (item) toggleTask(item);
});

taskList.addEventListener('click', (event) => {
  if (!event.target.matches('[data-action="delete"]')) return;

  const item = event.target.closest('.task-item');
  if (item) deleteTask(item);
});

taskInput.addEventListener('input', () => {
  formMessage.textContent = '';
});

menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});

menuClose.addEventListener('click', () => setMenuOpen(false));
menuBackdrop.addEventListener('click', () => setMenuOpen(false));

alarmOpenButton.addEventListener('click', () => {
  setMenuOpen(false, false);
  renderAlarmSettings();
  alarmTime.min = getLocalDateTimeValue(new Date(Date.now() + 1000));
  alarmDialog.showModal();
  alarmLabel.focus();
});

alarmClose.addEventListener('click', () => alarmDialog.close());
alarmForm.addEventListener('submit', addAlarm);

alarmSoundSelect.addEventListener('change', () => {
  selectedAlarmSound = alarmSoundSelect.value;
  persistAlarmSoundPreference(selectedAlarmSound);
  alarmMessage.textContent = '';
});

alarmSoundUpload.addEventListener('change', async () => {
  const [file] = alarmSoundUpload.files;
  if (!file) return;

  if (!file.type.startsWith('audio/')) {
    alarmMessage.textContent = 'Please choose a valid audio file.';
    alarmSoundUpload.value = '';
    return;
  }

  try {
    await saveCustomAlarmSound(file);
    if (customAlarmSoundUrl) URL.revokeObjectURL(customAlarmSoundUrl);
    customAlarmSoundUrl = URL.createObjectURL(file);
    customAlarmAudio.src = customAlarmSoundUrl;
    const customOption = alarmSoundSelect.querySelector('option[value="custom"]');
    customOption.disabled = false;
    customOption.textContent = `Uploaded: ${file.name}`;
    selectedAlarmSound = 'custom';
    alarmSoundSelect.value = 'custom';
    persistAlarmSoundPreference('custom');
    alarmSoundHelp.textContent = 'Uploaded audio is saved in this browser and can be used by your alarms.';
    alarmMessage.textContent = '';
  } catch (error) {
    console.error('Could not save the uploaded alarm sound.', error);
    alarmMessage.textContent = 'The selected audio file could not be saved in this browser.';
  }
});

alarmList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-action="delete-alarm"]');
  if (!deleteButton) return;
  const item = deleteButton.closest('.alarm-list-item');
  if (!item) return;

  alarms = alarms.filter((alarm) => alarm.id !== item.dataset.alarmId);
  saveAlarms();
  renderAlarmSettings();
});

dismissAlarmButton.addEventListener('click', dismissActiveAlarm);

alarmSoundPreview.addEventListener('click', async () => {
  await playAlarmSound(alarmSoundSelect.value);
  if (alarmSoundSelect.value === 'custom') {
    window.setTimeout(() => {
      customAlarmAudio.pause();
      customAlarmAudio.currentTime = 0;
    }, 2500);
  }
});

ringingDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
});

soundOptions.addEventListener('change', (event) => {
  if (!event.target.matches('input[type="radio"]')) return;

  formMessage.textContent = '';
  selectedSound = event.target.value;
  if (selectedSound !== 'custom') saveSoundPreference(selectedSound);
});

soundUpload.addEventListener('change', () => {
  const [file] = soundUpload.files;
  if (!file) return;

  if (!file.type.startsWith('audio/')) {
    formMessage.textContent = 'Please choose a valid audio file.';
    soundUpload.value = '';
    return;
  }

  if (uploadedSoundUrl) URL.revokeObjectURL(uploadedSoundUrl);
  uploadedSoundUrl = URL.createObjectURL(file);
  uploadedSoundName = file.name;
  uploadedSound.src = uploadedSoundUrl;
  customSoundRadio.disabled = false;
  customSoundRadio.checked = true;
  customSoundLabel.textContent = uploadedSoundName;
  soundHelp.textContent = 'Uploaded sound is selected. It stays in this browser tab and is not uploaded.';
  selectedSound = 'custom';
  formMessage.textContent = '';

  try {
    localStorage.removeItem(SOUND_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear the saved completion sound preference.', error);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
  }
});

renderAlarmSettings();
alarmTime.min = getLocalDateTimeValue(new Date(Date.now() + 1000));
alarmCheckTimer = window.setInterval(checkScheduledAlarms, 1000);
if (selectedAlarmSound === 'custom' || alarms.some((alarm) => alarm.sound === 'custom')) {
  loadCustomAlarmSound().then((savedSound) => {
    if (!savedSound?.blob) throw new Error('No uploaded alarm sound is available.');
    customAlarmSoundUrl = URL.createObjectURL(savedSound.blob);
    customAlarmAudio.src = customAlarmSoundUrl;
    const customOption = alarmSoundSelect.querySelector('option[value="custom"]');
    customOption.disabled = false;
    customOption.textContent = `Uploaded: ${savedSound.name}`;
    alarmSoundHelp.textContent = 'Uploaded audio is saved in this browser and can be used by your alarms.';
    alarmSoundSelect.value = selectedAlarmSound;
  }).catch((error) => {
    console.error('Could not restore the uploaded alarm sound.', error);
    alarmSoundHelp.textContent = 'The previously uploaded alarm sound could not be restored. Choose another sound file.';
    if (selectedAlarmSound === 'custom') {
      selectedAlarmSound = alarmSounds[0].id;
      alarmSoundSelect.value = selectedAlarmSound;
    }
  });
}

soundOptions.querySelector(`input[value="${selectedSound}"]`).checked = true;
window.addEventListener('beforeunload', () => {
  if (uploadedSoundUrl) URL.revokeObjectURL(uploadedSoundUrl);
  if (customAlarmSoundUrl) URL.revokeObjectURL(customAlarmSoundUrl);
  window.clearInterval(alarmCheckTimer);
  window.clearInterval(alarmSoundTimer);
});

showNextQuote(dailyQuotes);
renderTasks();
