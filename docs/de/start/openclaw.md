---
read_when:
    - Onboarding einer neuen Assistenteninstanz
    - Überprüfung der Auswirkungen auf Sicherheit und Berechtigungen
summary: End-to-End-Anleitung zum Betrieb von OpenClaw als persönlichem Assistenten mit Sicherheitshinweisen
title: Einrichtung des persönlichen Assistenten
x-i18n:
    generated_at: "2026-07-12T15:55:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8c34e31314f55647059fd600935330110add27b338a675bc0ce1529bebb207d
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw ist ein selbst gehosteter Gateway, der Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und weitere Dienste mit KI-Agenten verbindet. Diese Anleitung beschreibt die Einrichtung als „persönlicher Assistent“: eine dedizierte WhatsApp-Nummer, die sich wie Ihr ständig verfügbarer KI-Assistent verhält.

## Sicherheit zuerst

Wenn Sie einem Agenten einen Kanal bereitstellen, kann er dadurch Befehle auf Ihrem Computer ausführen (abhängig von Ihren Tool-Richtlinien), Dateien in Ihrem Arbeitsbereich lesen und schreiben sowie Nachrichten über jeden verbundenen Kanal senden. Beginnen Sie mit restriktiven Einstellungen:

- Legen Sie immer `channels.whatsapp.allowFrom` fest (betreiben Sie den Dienst auf Ihrem persönlichen Mac niemals offen für die ganze Welt).
- Verwenden Sie eine dedizierte WhatsApp-Nummer für den Assistenten.
- Heartbeats werden standardmäßig alle 30 Minuten ausgeführt. Deaktivieren Sie sie, bis Sie der Einrichtung vertrauen, indem Sie `agents.defaults.heartbeat.every: "0m"` festlegen.

## Voraussetzungen

- OpenClaw ist installiert und die Ersteinrichtung wurde abgeschlossen – siehe [Erste Schritte](/de/start/getting-started), falls Sie dies noch nicht getan haben
- Eine zweite Telefonnummer (SIM/eSIM/Prepaid) für den Assistenten

## Einrichtung mit zwei Telefonen (empfohlen)

Das gewünschte Ergebnis:

```mermaid
flowchart TB
    A["<b>Ihr Telefon (persönlich)<br></b><br>Ihr WhatsApp<br>+1-555-YOU"] -- Nachricht --> B["<b>Zweites Telefon (Assistent)<br></b><br>Assistenten-WA<br>+1-555-ASSIST"]
    B -- per QR verknüpft --> C["<b>Ihr Mac (openclaw)<br></b><br>KI-Agent"]
```

Wenn Sie Ihr persönliches WhatsApp mit OpenClaw verknüpfen, wird jede Nachricht an Sie zur „Agenteneingabe“. Das ist nur selten erwünscht.

## Schnellstart in 5 Minuten

1. Koppeln Sie WhatsApp Web (ein QR-Code wird angezeigt; scannen Sie ihn mit dem Telefon des Assistenten):

```bash
openclaw channels login
```

2. Starten Sie den Gateway (lassen Sie ihn weiterlaufen):

```bash
openclaw gateway --port 18789
```

3. Fügen Sie eine Minimalkonfiguration in `~/.openclaw/openclaw.json` ein:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Senden Sie nun von Ihrem in der Zulassungsliste eingetragenen Telefon eine Nachricht an die Nummer des Assistenten.

Nach Abschluss der Ersteinrichtung öffnet OpenClaw automatisch das Dashboard und gibt einen bereinigten Link (ohne Token) aus. Wenn das Dashboard Sie zur Authentifizierung auffordert, fügen Sie das konfigurierte gemeinsame Geheimnis in die Einstellungen der Control UI ein. Die Ersteinrichtung verwendet standardmäßig ein Token (`gateway.auth.token`), aber die Passwortauthentifizierung funktioniert ebenfalls, wenn Sie `gateway.auth.mode` auf `password` umgestellt haben. So öffnen Sie das Dashboard später erneut: `openclaw dashboard`.

## Dem Agenten einen Arbeitsbereich bereitstellen (AGENTS)

OpenClaw liest Betriebsanweisungen und den „Speicher“ aus seinem Arbeitsbereichsverzeichnis.

Standardmäßig verwendet OpenClaw `~/.openclaw/workspace` als Arbeitsbereich des Agenten und erstellt ihn (einschließlich der anfänglichen Dateien `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md` und `HEARTBEAT.md`) automatisch während der Ersteinrichtung oder bei der ersten Ausführung des Agenten. `BOOTSTRAP.md` wird nur für einen vollkommen neuen Arbeitsbereich erstellt und sollte nach dem Löschen nicht erneut erscheinen. `MEMORY.md` ist optional und wird nie automatisch erstellt; wenn die Datei vorhanden ist, wird sie für normale Sitzungen geladen. In Subagentensitzungen werden nur `AGENTS.md` und `TOOLS.md` eingefügt.

<Tip>
Behandeln Sie diesen Ordner wie den Speicher von OpenClaw und machen Sie ihn zu einem Git-Repository (idealerweise privat), damit Ihre `AGENTS.md`- und Speicherdateien gesichert werden. Wenn Git installiert ist, werden vollkommen neue Arbeitsbereiche automatisch mit `git init` initialisiert.
</Tip>

So erstellen Sie die Arbeitsbereichs- und Konfigurationsordner, ohne den vollständigen Assistenten für die Ersteinrichtung auszuführen:

```bash
openclaw setup --baseline
```

(Der einfache Befehl `openclaw setup` ist ein Alias für `openclaw onboard` und führt den vollständigen interaktiven Assistenten aus.)

Vollständige Arbeitsbereichsstruktur und Sicherungsanleitung: [Agentenarbeitsbereich](/de/concepts/agent-workspace)
Speicher-Workflow: [Speicher](/de/concepts/memory)

Optional: Wählen Sie mit `agents.defaults.workspace` einen anderen Arbeitsbereich aus (unterstützt `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Wenn Sie bereits Ihre eigenen Workspace-Dateien aus einem Repository bereitstellen, können Sie die Erstellung von Bootstrap-Dateien vollständig deaktivieren:

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

OpenClaw verfügt standardmäßig über eine gute Assistentenkonfiguration, üblicherweise sollten Sie jedoch Folgendes anpassen:

- Persona/Anweisungen in [`SOUL.md`](/de/concepts/soul)
- Standardwerte für das Denken (falls gewünscht)
- Heartbeats (sobald Sie OpenClaw vertrauen)

Beispiel:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-8" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Beginnen Sie mit 0; aktivieren Sie dies später.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
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

## Sitzungen und Speicher

- Sitzungszeilen, Transkriptzeilen und Metadaten (Token-Nutzung, letzte Route usw.): `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Legacy-/Archiv-Transkriptartefakte: `~/.openclaw/agents/<agentId>/sessions/`
- Quelle für die Migration von Legacy-Zeilen: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- `/new` oder `/reset` startet eine neue Sitzung für diesen Chat (konfigurierbar über `session.resetTriggers`). Wird der Befehl allein gesendet, bestätigt OpenClaw das Zurücksetzen, ohne das Modell aufzurufen.
- `/compact [instructions]` komprimiert den Sitzungskontext und gibt das verbleibende Kontextbudget an.

## Heartbeats (proaktiver Modus)

Standardmäßig führt OpenClaw alle 30 Minuten einen Heartbeat mit folgendem Prompt aus:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Setzen Sie `agents.defaults.heartbeat.every: "0m"`, um ihn zu deaktivieren.

- Wenn `HEARTBEAT.md` vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Codeblock-Begrenzungszeichen oder leere Checklisten-Platzhalter enthält), überspringt OpenClaw den Heartbeat-Durchlauf, um API-Aufrufe einzusparen.
- Wenn die Datei fehlt, wird der Heartbeat dennoch ausgeführt, und das Modell entscheidet, was zu tun ist.
- Wenn der Agent mit `HEARTBEAT_OK` antwortet (optional mit kurzem Zusatz; siehe `agents.defaults.heartbeat.ackMaxChars`), unterdrückt OpenClaw die ausgehende Zustellung für diesen Heartbeat.
- Standardmäßig ist die Heartbeat-Zustellung an DM-ähnliche `user:<id>`-Ziele zulässig. Legen Sie `agents.defaults.heartbeat.directPolicy: "block"` fest, um die Zustellung an direkte Ziele zu unterdrücken, während die Heartbeat-Durchläufe aktiv bleiben.
- Heartbeats führen vollständige Agent-Durchläufe aus – kürzere Intervalle verbrauchen mehr Token.

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## Medien empfangen und senden

Eingehende Anhänge (Bilder/Audio/Dokumente) können Ihrem Befehl über Vorlagen bereitgestellt werden:

- `{{MediaPath}}` (lokaler temporärer Dateipfad)
- `{{MediaUrl}}` (Pseudo-URL)
- `{{Transcript}}` (wenn die Audiotranskription aktiviert ist)

Ausgehende Anhänge des Agenten verwenden strukturierte Medienfelder im Nachrichten-Tool oder in der Antwortnutzlast, etwa `media`, `mediaUrl`, `mediaUrls`, `path` oder `filePath`. Beispielargumente für das Nachrichten-Tool:

```json
{
  "message": "Hier ist der Screenshot.",
  "mediaUrl": "https://example.com/screenshot.png"
}
```

OpenClaw sendet strukturierte Medien zusammen mit dem Text. Ältere abschließende Assistentenantworten können aus Kompatibilitätsgründen weiterhin normalisiert werden, aber Tool-Ausgaben, Browser-Ausgaben, Streaming-Blöcke und Nachrichtenaktionen interpretieren Text nicht als Anhangsbefehle.

Das Verhalten lokaler Pfade folgt demselben Vertrauensmodell für Dateizugriffe wie der Agent:

- Wenn `tools.fs.workspaceOnly` den Wert `true` hat, bleiben ausgehende lokale Medienpfade auf das temporäre Stammverzeichnis von OpenClaw, den Mediencache, Pfade im Arbeitsbereich des Agenten und in der Sandbox erzeugte Dateien beschränkt.
- Wenn `tools.fs.workspaceOnly` den Wert `false` hat, können ausgehende lokale Medien Dateien auf dem Host verwenden, die der Agent bereits lesen darf.
- Lokale Pfade können absolut, relativ zum Arbeitsbereich oder mit `~/` relativ zum Home-Verzeichnis angegeben werden.
- Beim Senden hostlokaler Dateien sind weiterhin nur Medien und sichere Dokumenttypen zulässig (Bilder, Audio, Video, PDF, Office-Dokumente und validierte Textdokumente wie Markdown/MD, TXT, JSON, YAML und YML). Dies ist eine Erweiterung der bestehenden Vertrauensgrenze für Lesezugriffe auf den Host und kein Scanner für Geheimnisse: Wenn der Agent eine hostlokale Datei `secret.txt` oder `config.json` lesen kann, kann er diese Datei anhängen, sofern Dateierweiterung und Inhaltsvalidierung übereinstimmen.

Bewahren Sie vertrauliche Dateien außerhalb des für den Agenten lesbaren Dateisystems auf oder verwenden Sie für strengere Sendebeschränkungen bei lokalen Pfaden weiterhin `tools.fs.workspaceOnly: true`.

## Betriebscheckliste

```bash
openclaw status          # lokaler Status (Anmeldedaten, Sitzungen, Ereignisse in der Warteschlange)
openclaw status --all    # vollständige Diagnose (schreibgeschützt, zum Einfügen geeignet)
openclaw status --deep   # Kanäle prüfen (WhatsApp Web + Telegram + Discord + Slack + Signal)
openclaw health --json   # Momentaufnahme des Gateway-Zustands über die WS-Verbindung
```

Protokolle befinden sich unter `/tmp/openclaw/` (Standard: `openclaw-YYYY-MM-DD.log`).

## Nächste Schritte

- WebChat: [WebChat](/de/web/webchat)
- Gateway-Betrieb: [Gateway-Betriebshandbuch](/de/gateway)
- Cron + Aktivierungen: [Cron-Aufträge](/de/automation/cron-jobs)
- macOS-Menüleistenbegleiter: [OpenClaw-App für macOS](/de/platforms/macos)
- iOS-Node-App: [iOS-App](/de/platforms/ios)
- Android-Node-App: [Android-App](/de/platforms/android)
- Windows-Hub: [Windows](/de/platforms/windows)
- Linux-Status: [Linux-App](/de/platforms/linux)
- Sicherheit: [Sicherheit](/de/gateway/security)

## Verwandte Themen

- [Erste Schritte](/de/start/getting-started)
- [Einrichtung](/de/start/setup)
- [Kanalübersicht](/de/channels)
