# Task 5: To-Do List Web App

A small task manager built with HTML, CSS, and JavaScript.

## Requirements

- Add a task.
- Delete a task.
- Mark a task as completed.
- Cycle through 1,000+ animated motivational quotes every five seconds without repeating until all quotes have appeared; show a celebratory quote when a task is completed.
- Play a short celebratory chime when a task is completed.
- Save tasks in `localStorage` so they remain after the page is refreshed.

## Project files

```text
index.html
css/
  style.css
js/
  app.js
```

## Run the app

Open `index.html` in a web browser. Add a task, mark it complete or delete it,
then refresh the page to confirm tasks are saved.

## How it works

The JavaScript keeps each task's id, text, and completion state in an array.
After a task is added, completed, or deleted, the app saves the array as JSON
in `localStorage` and redraws the task list. When the page opens, it reads the
saved JSON and restores valid tasks. Task text is inserted with `textContent`
so it is displayed as text rather than interpreted as HTML.
