const STORAGE_KEY = 'synent-todo-tasks';
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskList = document.querySelector('#task-list');
const formMessage = document.querySelector('#form-message');
const motivationalQuote = document.querySelector('#motivational-quote');

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
let currentQuote = '';
let quoteDeck = [];
let quoteTimer;
let audioContext;

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

/** Play a short ascending chime when a task is completed. */
async function playCompletionSound() {
  if (typeof window.AudioContext !== 'function') return;

  try {
    if (!audioContext) audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    const startTime = audioContext.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const noteStart = startTime + index * 0.09;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      volume.gain.setValueAtTime(0.0001, noteStart);
      volume.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.23);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.24);
    });
  } catch (error) {
    console.warn('Could not play the task completion sound.', error);
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

showNextQuote(dailyQuotes);
renderTasks();
