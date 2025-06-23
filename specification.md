# Pomodoro Web App - Spezifikation

## Überblick

Diese Anwendung ist eine fortschrittliche Pomodoro-Zeitmanagement-App für das Web, die als Progressive Web App (PWA) umgesetzt wird. Sie basiert auf dem MERN-Stack (MongoDB, Express.js, React, Node.js), verwendet TypeScript sowie das UI-Toolkit Shadcn und ist für Benutzer mit Benutzerkonto-Unterstützung, Aufgabenverwaltung und Statistiken konzipiert.

## Technologie-Stack

- **Frontend**: React, TypeScript, Shadcn UI
- **Backend**: Node.js mit Express
- **Datenbank**: MongoDB
- **Auth**: JWT-basierte Authentifizierung mit optionalem OAuth (z.B. Google)
- **Hosting**: z.B. Vercel, Netlify oder eigenes Hosting

---

## App-Struktur

### 1. Startbildschirm / Timer-Screen

#### Funktionen:

- Auswahl zwischen drei Modi:
  - **Pomodoro** (25 Minuten Standard)
  - **Short Break** (5 Minuten Standard)
  - **Long Break** (15 Minuten Standard)
- Timer-Anzeige:
  - Start / Stop Button
  - Reset Button
- Aufgabenliste mit folgenden Funktionen:
  - Neue Aufgabe hinzufügen
  - Aufgabe löschen
  - Aufgabe als abgeschlossen markieren
  - Aufgabe mit Projekt verknüpfen
  - Geschätzte Pomodoros für Aufgabe setzen

#### Zustand:

- Aktueller Modus
- Restzeit
- Timer-Status (laufend/pausiert)
- Aktive Aufgabe

---

### 2. Statistikseite

#### Zugriff:

- über Button in der oberen Navigationsleiste erreichbar

#### Anzeige:

- Anzahl abgeschlossener Pomodoros
  - nach Woche
  - nach Monat
  - nach Jahr
- Optionale Filter:
  - Nach Projekt
  - Nach Aufgabe

#### Hinweis:

- Nur nach Anmeldung verfügbar

---

### 3. Einstellungen

#### Zugriff:

- über "Settings"-Button oben rechts

#### Funktionen:

- Timerzeiten anpassen:
  - Pomodoro-Länge
  - Kurzpausen-Länge
  - Langpausen-Länge
- Autostart-Optionen:
  - Nächste Session automatisch starten (Pomodoro → Pause, Pause → Pomodoro)
- Töne / Alarm einstellen

---

### 4. Authentifizierung / Benutzerkonto

#### Funktionen:

- Anmelden / Registrieren
  - E-Mail + Passwort
  - Optional: OAuth (z.B. Google)
- Persistente Speicherung:
  - Statistiken
  - Einstellungen
  - Aufgaben und ihre Historie

---

## Aufgaben-Management

### Aufgabe:

- Titel (Pflicht)
- Projekt (optional)
- Geschätzte Pomodoro-Zyklen (optional)
- Tatsächlich verwendete Pomodoros (automatisch gezählt)
- Erledigt-Status

### Projekt:

- Name
- Farbe (optional)

---

## Datenmodell (MongoDB)

### User

```ts
interface User {
  _id: string;
  email: string;
  passwordHash: string;
  settings: UserSettings;
  stats: PomodoroStats;
}
```

### Task

```ts
interface Task {
  _id: string;
  userId: string;
  title: string;
  projectId?: string;
  estimatedPomodoros?: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: Date;
}
```

### Project

```ts
interface Project {
  _id: string;
  userId: string;
  name: string;
  color?: string;
}
```

### UserSettings

```ts
interface UserSettings {
  pomodoroDuration: number; // in Minuten
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
}
```

### PomodoroStats

```ts
interface PomodoroStats {
  completed: Array<{
    taskId?: string;
    projectId?: string;
    timestamp: Date;
  }>;
}
```

---

## Weitere Anforderungen

### PWA-Funktionalität

- Offline-Nutzung
- Add-to-Home-Screen
- Push-Benachrichtigungen (optional)

### UI/UX mit Shadcn

- Einheitliches Theme (Hell/Dunkelmodus)
- Klare visuelle Rückmeldungen (Timer, Aufgabenstatus, Fortschritt)
- Responsive Design für Mobil/Tablet/Desktop

---

## Navigation

- **Home (/)**: Timer + Aufgaben
- **/stats**: Statistiken
- **/settings**: Einstellungen
- **/login**, **/register**: Auth

---

## Entwicklungshinweise

- Komponenten modular aufbauen (Timer, TaskList, Header, Modals)
- Zustand mit Zustand/Redux oder Context API verwalten
- Lokale Speicherung über IndexedDB/LocalStorage für Offline-Nutzung
- Persistenz der Daten nach Login synchronisieren

---

## Zielgruppe

- Produktive Nutzer, die mit der Pomodoro-Technik arbeiten
- Projektbasierte Arbeiter (z.B. Entwickler, Designer, Studenten)

---

## To-Do für MVP

-

---

Bei Rückfragen oder zur Klärung von Funktionen bitte zuerst diesen Spezifikationstext konsultieren.

