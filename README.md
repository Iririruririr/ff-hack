# SBA Helper AI

A mobile-first CXC SBA workspace available as a responsive web app/PWA and a native Android app shell. It turns a subject and topic into an editable section checklist, keeps research and references in one place, and offers guided writing support while keeping the student’s own work at the centre.

## Run the web app

```bash
npm install
npm run dev
```

For a production web build:

```bash
npm run build
npm run preview
```

## Build the Android app

Install Android Studio (Android SDK 35) and Java 17, then run:

```bash
npm install
npm run android:build
```

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk` and can be installed on an Android device. The GitHub Actions workflow also builds the web app and APK and uploads both as workflow artifacts.

## What’s included

- Student dashboard, active projects, recent work, deadlines and section progress
- SBA builder with editable templates for English, Social Studies, Principles of Business, Principles of Accounts, Human & Social Biology, Information Technology, Technical Drawing and other CXC subjects
- Section-by-section workspace with explanations, student prompts, autosave and word-count guidance
- Context-aware SBA coach for explanations, research questions, interview/survey starters, outlines and draft feedback
- Authentic Writing Mode with Simple / Normal / More Formal preferences, personal research prompts and individually accepted, edited or rejected writing suggestions
- Research library with source records, citation drafts, section-linked notes and locally stored document attachments
- Final review checklist and teacher-friendly DOCX / print-to-PDF exports
- Light and dark themes, responsive mobile navigation, offline-capable PWA shell and offline-bundled Android app assets

## Privacy and guidance

Project content and uploaded documents are stored in the current browser or Android app’s local storage; there is no app server or account sync in this starter. Keep a backup of important files, especially before clearing browser data or uninstalling the app. The coach is a guided, local prototype rather than a connected generative-AI service. It helps students plan and improve their own work; it does not create a complete submission. Subject templates and word counts are adjustable starting points, not official CXC requirements. A student’s teacher brief and current CXC rubric always take priority.
