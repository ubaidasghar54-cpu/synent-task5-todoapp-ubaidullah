# To-Do List Web App

A responsive task management app built for Task 5 of the Synent Technologies Web Development Internship. It helps you add, organize, and complete everyday tasks in a simple browser interface.

## Features

- Add tasks, edit their text, delete them, and mark them complete or active.
- Save tasks in the browser with `localStorage`, so they remain after a refresh.
- Filter the list by All, Active, or Completed.
- See the number of active tasks and clear all completed tasks.
- Get a helpful message for blank input and a 120-character task limit.
- Use Enter to submit a task, and see an empty-state message when appropriate.
- Use keyboard-friendly controls, visible focus styles, and reduced-motion support.
- See short animations when tasks appear and are removed.
- Set optional date and time reminders, then edit or clear them later.
- Get an in-page alarm with generated sound, vibration where supported, and an optional system notification.
- Snooze an alarm for five minutes, dismiss it as done, or test the alarm from the settings panel.
- Export reminded tasks as `.ics` calendar events or open a prefilled Google Calendar event.
- See missed reminders after reopening the app and reschedule them.
- Show the fixed **Ubaid Ullah · Developer** brand and a rotating motivational greeting on each visit.
- Optionally choose a time allowance for a new task and track its live countdown.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Browser `localStorage`
- Web Audio API, service workers, Notifications API, and Calendar export
- Poppins from Google Fonts, with a sans-serif fallback

No frameworks or JavaScript libraries are used.

## Project files

```text
synent-task5-todoapp-ubaidullah/
|-- index.html
|-- manifest.json
|-- sw.js
|-- css/
|   `-- style.css
|-- js/
|   `-- app.js
`-- README.md
```

## How it works

The JavaScript keeps tasks in an array of objects. Each task has an `id`, `text`, and `completed` value, plus optional `remindAt` and `notified` reminder fields and optional `durationMinutes` and `deadlineAt` time allowance fields. A deadline is an absolute timestamp, so the countdown stays accurate across refreshes and background-tab timer throttling.

When a task changes, the app updates this array, saves it to `localStorage`, and calls `render()` to rebuild the visible list. A small countdown updater changes only the timer labels each second instead of rebuilding the whole list.

On page load, `loadTasks()` reads and checks the saved JSON before the first render. Older saved tasks get safe defaults for reminder fields. If the saved data is missing, corrupted, or unavailable, the app starts with an empty list. Task text is added to the page with `textContent` and DOM elements, so it is displayed as text rather than interpreted as HTML.

The developer brand is fixed in the HTML and is not an editable field or task setting. A motivational greeting is selected on each page load; only its last message index is saved so the next visit can show a different line. The name itself is not saved in browser storage.

While the page is open, a timestamp checker looks for due reminders. The service worker displays a system notification when permission is granted. The alarm sound uses Web Audio and must be unlocked by clicking **Enable alarm sound**. Vibration is attempted only when the browser provides the Vibration API.

## How to run

1. Download or clone this repository.
2. Serve the folder from `localhost` or an HTTPS host. For example, with Python installed, run `python -m http.server 8000` in the project folder, then open `http://localhost:8000`.
3. Add a task and refresh the page to see local storage persistence.

The app has no build step or package installation. Service workers and system notifications require HTTPS or localhost; opening the HTML directly as a `file://` URL will not enable them. An internet connection is needed to load Poppins from Google Fonts; the page uses a sans-serif fallback if the font cannot be reached.

## Enable sound and notifications

- Sound unlocks automatically on the first click, tap, or keypress after the page opens. The **Enable alarm sound** button remains as a manual fallback. Browsers require a user gesture before playing generated audio.
- Click **Enable notifications** and grant the browser permission. The app also needs a working service worker registration.
- Use **Test alarm** to check the in-page alarm without adding or changing a task.

## Reminder limits

- This static app cannot wake itself after the page is closed. Its in-page sound and vibration work only while the page is open; background tabs may be throttled by the browser.
- A task time allowance is a visible countdown, not a separate alarm. The countdown catches up from its saved timestamp when the app is reopened.
- To get an alert while this app is closed, use **Add to Calendar (.ics)** and import the event into a calendar app that supports event alarms. Calendar and device notification settings control the alert. The Google Calendar link opens a prefilled event.
- On iPhone, web notifications require a supported iOS version and the site to be added to the Home Screen and opened as a web app. On other devices, browser support and permission are required.
- Vibration is not available on every device; the app only attempts it when `navigator.vibrate` exists.
- Tasks are stored in this browser only. There is no backend, cross-device sync, or push service to wake a closed app.

## Screenshots

<img width="1146" height="813" alt="image" src="https://github.com/user-attachments/assets/49e3d534-03bf-4ecb-9ac2-457c6b4e1bb9" />


## Live demo

https://synent-task5-todoapp-ubaidullah.vercel.app/
