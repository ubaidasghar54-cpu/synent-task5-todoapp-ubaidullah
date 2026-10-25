# Task 5: To-Do List Web App

A small task manager built with HTML, CSS, and JavaScript.

## Requirements

- Choose from three different built-in completion sounds or upload multiple sounds from your device using the hamburger sidebar. Uploaded sounds and the selected sound are saved separately in this browser.
- Open the dedicated Alarms page to schedule reminders with 20 built-in sound patterns or multiple separately saved audio uploads from your device. The browser requests notification permission when the first alarm is created; optional notifications may appear while the Alarms page is open in the background and permission is granted. This static web app cannot guarantee reminders after the page/app is closed or while the device sleeps; reliable closed-app delivery requires native app support or a push-notification server.
- Add a task.
- Delete a task.
- Mark a task as completed.
- Display numbered tasks and live counts for total, completed, and remaining tasks.
- Keep the task list, task controls, and summary usable on phone, tablet, and desktop screen sizes.
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
