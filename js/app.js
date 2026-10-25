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
let currentQuote = '';

let tasks = loadTasks();

/** Show a motivational quote without repeating the one currently displayed. */
function showQuote(quotes) {
  const availableQuotes = quotes.filter((quote) => quote !== currentQuote);
  currentQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
  motivationalQuote.textContent = currentQuote;
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
  if (task.completed) showQuote(completionQuotes);
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

showQuote(dailyQuotes);
renderTasks();
