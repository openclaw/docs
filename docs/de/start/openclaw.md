---
read_when:
    - Einrichten einer neuen Assistenteninstanz
    - Prüfen der Auswirkungen auf Sicherheit und Berechtigungen
summary: End-to-End-Leitfaden für den Betrieb von OpenClaw als persönlicher Assistent mit Sicherheitshinweisen
title: Einrichtung des persönlichen Assistenten
x-i18n:
    generated_at: "2026-05-02T22:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f6087d0756c98741166135df8b915eb5a0803b23e68e486d2d25ec98d4dca79
    source_path: start/openclaw.md
    workflow: 16
---

# Einen persönlichen Assistenten mit OpenClaw erstellen

OpenClaw ist ein selbst gehostetes Gateway, das Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere Dienste mit KI-Agenten verbindet. Diese Anleitung behandelt die Einrichtung als „persönlicher Assistent“: eine dedizierte WhatsApp-Nummer, die sich wie Ihr ständig verfügbarer KI-Assistent verhält.

## ⚠️ Sicherheit zuerst

Sie versetzen einen Agenten in die Lage:

- Befehle auf Ihrem Rechner auszuführen (abhängig von Ihrer Tool-Richtlinie)
- Dateien in Ihrem Arbeitsbereich zu lesen/schreiben
- Nachrichten über WhatsApp/Telegram/Discord/Mattermost und andere gebündelte Kanäle zurückzusenden

Beginnen Sie konservativ:

- Setzen Sie immer `channels.whatsapp.allowFrom` (betreiben Sie auf Ihrem persönlichen Mac niemals einen weltweit offenen Zugang).
- Verwenden Sie eine dedizierte WhatsApp-Nummer für den Assistenten.
- Heartbeats laufen jetzt standardmäßig alle 30 Minuten. Deaktivieren Sie sie, bis Sie der Einrichtung vertrauen, indem Sie `agents.defaults.heartbeat.every: "0m"` setzen.

## Voraussetzungen

- OpenClaw ist installiert und eingerichtet — siehe [Erste Schritte](/de/start/getting-started), falls Sie dies noch nicht getan haben
- Eine zweite Telefonnummer (SIM/eSIM/Prepaid) für den Assistenten

## Das Zwei-Telefon-Setup (empfohlen)

Das Ziel ist:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Wenn Sie Ihr persönliches WhatsApp mit OpenClaw verknüpfen, wird jede Nachricht an Sie zu „Agent-Eingabe“. Das ist selten das, was Sie wollen.

## 5-Minuten-Schnellstart

1. Koppeln Sie WhatsApp Web (zeigt QR an; mit dem Assistenten-Telefon scannen):

```bash
openclaw channels login
```

2. Starten Sie das Gateway (laufen lassen):

```bash
openclaw gateway --port 18789
```

3. Legen Sie eine minimale Konfiguration in `~/.openclaw/openclaw.json` ab:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Senden Sie jetzt von Ihrem zugelassenen Telefon eine Nachricht an die Assistenten-Nummer.

Wenn das Onboarding abgeschlossen ist, öffnet OpenClaw automatisch das Dashboard und gibt einen sauberen Link (ohne Token) aus. Wenn das Dashboard nach Authentifizierung fragt, fügen Sie das konfigurierte gemeinsame Secret in die Control-UI-Einstellungen ein. Onboarding verwendet standardmäßig einen Token (`gateway.auth.token`), aber Passwortauthentifizierung funktioniert ebenfalls, wenn Sie `gateway.auth.mode` auf `password` umgestellt haben. Später erneut öffnen: `openclaw dashboard`.

## Dem Agenten einen Arbeitsbereich geben (AGENTS)

OpenClaw liest Betriebsanweisungen und „Memory“ aus seinem Arbeitsbereichsverzeichnis.

Standardmäßig verwendet OpenClaw `~/.openclaw/workspace` als Arbeitsbereich des Agenten und erstellt ihn (plus die Starterdateien `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automatisch bei der Einrichtung bzw. beim ersten Agent-Lauf. `BOOTSTRAP.md` wird nur erstellt, wenn der Arbeitsbereich ganz neu ist (die Datei sollte nicht wieder erscheinen, nachdem Sie sie gelöscht haben). `MEMORY.md` ist optional (wird nicht automatisch erstellt); wenn vorhanden, wird sie für normale Sitzungen geladen. Subagent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md`.

<Tip>
Behandeln Sie diesen Ordner wie das Memory von OpenClaw und machen Sie ihn zu einem Git-Repository (idealerweise privat), damit Ihre `AGENTS.md` und Memory-Dateien gesichert sind. Wenn Git installiert ist, werden ganz neue Arbeitsbereiche automatisch initialisiert.
</Tip>

```bash
openclaw setup
```

Vollständiges Arbeitsbereichslayout + Backup-Anleitung: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
Memory-Workflow: [Memory](/de/concepts/memory)

Optional: Wählen Sie mit `agents.defaults.workspace` einen anderen Arbeitsbereich (unterstützt `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Wenn Sie bereits eigene Arbeitsbereichsdateien aus einem Repository ausliefern, können Sie die Erstellung von Bootstrap-Dateien vollständig deaktivieren:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## Die Konfiguration, die daraus „einen Assistenten“ macht

OpenClaw ist standardmäßig gut als Assistent eingerichtet, aber üblicherweise möchten Sie Folgendes anpassen:

- Persona/Anweisungen in [`SOUL.md`](/de/concepts/soul)
- Thinking-Standards (falls gewünscht)
- Heartbeats (sobald Sie ihnen vertrauen)

Beispiel:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sitzungen und Memory

- Sitzungsdateien: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Sitzungsmetadaten (Token-Nutzung, letzte Route usw.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (Legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` oder `/reset` startet eine neue Sitzung für diesen Chat (konfigurierbar über `resetTriggers`). Wenn es allein gesendet wird, bestätigt OpenClaw das Zurücksetzen, ohne das Modell aufzurufen.
- `/compact [instructions]` verdichtet den Sitzungskontext und meldet das verbleibende Kontextbudget.

## Heartbeats (proaktiver Modus)

Standardmäßig führt OpenClaw alle 30 Minuten einen Heartbeat mit folgendem Prompt aus:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Setzen Sie `agents.defaults.heartbeat.every: "0m"`, um ihn zu deaktivieren.

- Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur Leerzeilen und Markdown-Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
- Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.
- Wenn der Agent mit `HEARTBEAT_OK` antwortet (optional mit kurzer Auffüllung; siehe `agents.defaults.heartbeat.ackMaxChars`), unterdrückt OpenClaw die ausgehende Zustellung für diesen Heartbeat.
- Standardmäßig ist die Heartbeat-Zustellung an DM-artige Ziele `user:<id>` erlaubt. Setzen Sie `agents.defaults.heartbeat.directPolicy: "block"`, um Zustellungen an direkte Ziele zu unterdrücken, während Heartbeat-Läufe aktiv bleiben.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Medien ein- und ausgehend

Eingehende Anhänge (Bilder/Audio/Dokumente) können Ihrem Befehl über Templates bereitgestellt werden:

- `{{MediaPath}}` (lokaler temporärer Dateipfad)
- `{{MediaUrl}}` (Pseudo-URL)
- `{{Transcript}}` (wenn Audiotranskription aktiviert ist)

Ausgehende Anhänge vom Agenten: Fügen Sie `MEDIA:<path-or-url>` in einer eigenen Zeile ein (keine Leerzeichen). Beispiel:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw extrahiert diese und sendet sie zusammen mit dem Text als Medien.

Das Verhalten lokaler Pfade folgt demselben Datei-Lese-Vertrauensmodell wie der Agent:

- Wenn `tools.fs.workspaceOnly` `true` ist, bleiben lokale ausgehende `MEDIA:`-Pfade auf das temporäre OpenClaw-Stammverzeichnis, den Medien-Cache, Pfade im Agent-Arbeitsbereich und von der Sandbox erzeugte Dateien beschränkt.
- Wenn `tools.fs.workspaceOnly` `false` ist, kann ausgehendes `MEDIA:` Host-lokale Dateien verwenden, die der Agent bereits lesen darf.
- Lokale Pfade können absolut, arbeitsbereichsrelativ oder mit `~/` relativ zum Home-Verzeichnis sein.
- Host-lokale Sends erlauben weiterhin nur Medien und sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Reiner Text und geheimnisähnliche Dateien werden nicht als sendbare Medien behandelt.

Das bedeutet, dass generierte Bilder/Dateien außerhalb des Arbeitsbereichs jetzt gesendet werden können, wenn Ihre FS-Richtlinie diese Lesezugriffe bereits erlaubt, ohne eine beliebige Exfiltration von Host-Textanhängen wieder zu öffnen.

## Betriebs-Checkliste

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Logs befinden sich unter `/tmp/openclaw/` (Standard: `openclaw-YYYY-MM-DD.log`).

## Nächste Schritte

- WebChat: [WebChat](/de/web/webchat)
- Gateway-Betrieb: [Gateway-Runbook](/de/gateway)
- Cron + Wakeups: [Cron-Jobs](/de/automation/cron-jobs)
- macOS-Menüleisten-Begleiter: [OpenClaw-macOS-App](/de/platforms/macos)
- iOS-Node-App: [iOS-App](/de/platforms/ios)
- Android-Node-App: [Android-App](/de/platforms/android)
- Windows-Status: [Windows (WSL2)](/de/platforms/windows)
- Linux-Status: [Linux-App](/de/platforms/linux)
- Sicherheit: [Sicherheit](/de/gateway/security)

## Verwandt

- [Erste Schritte](/de/start/getting-started)
- [Einrichtung](/de/start/setup)
- [Kanalübersicht](/de/channels)
