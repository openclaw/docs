---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung nicht abwärtskompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doktor
x-i18n:
    generated_at: "2026-07-24T05:02:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3f599553a2455759cd0fe56bafbc16948f7ab4d381d344b08a496bf19c9dc636
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen und Zustände, prüft den Systemzustand und stellt konkrete Reparaturschritte bereit.

## Schnellstart

```bash
openclaw doctor
```

### Headless- und Automatisierungsmodi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Standardeinstellungen ohne Rückfrage akzeptieren (gegebenenfalls einschließlich Reparaturschritten für Neustart, Dienst und Sandbox).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Empfohlene Reparaturen ohne Rückfrage anwenden (`--repair` ist ein Alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Strukturierte Zustandsprüfungen für CI oder Preflight-Automatisierung ausführen. Schreibgeschützt: keine
    Rückfragen, Reparaturen, Migrationen, Neustarts oder Zustandsänderungen.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Auch aggressive Reparaturen anwenden (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Ohne Rückfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung +
    Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen,
    die eine menschliche Bestätigung erfordern. Erkannte Migrationen veralteter Zustände werden weiterhin
    automatisch ausgeführt.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Um Änderungen vor dem Schreiben zu prüfen, öffnen Sie zunächst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Schreibgeschützter Lint-Modus

`openclaw doctor --lint` ist das automatisierungsfreundliche Gegenstück zu
`openclaw doctor --fix`. Beide verwenden dieselbe Doctor-Regelregistrierung, wählen
Regeln jedoch unterschiedlich aus und führen sie unterschiedlich aus:

| Modus                     | Rückfragen | Schreibt Konfiguration/Zustand | Ausgabe                      | Verwendungszweck                  |
| ------------------------- | ---------- | ------------------------------ | ---------------------------- | --------------------------------- |
| `openclaw doctor`        | ja         | nein                           | verständlicher Zustandsbericht | manuelle Statusprüfung             |
| `openclaw doctor --fix`        | manchmal   | ja, gemäß Reparaturrichtlinie  | verständliches Reparaturprotokoll | Anwenden genehmigter Reparaturen |
| `openclaw doctor --lint`        | nein       | nein                           | strukturierte Befunde        | CI-, Preflight- und Review-Gates  |

Der standardmäßige Aufruf `doctor --lint` führt das umfassende, sichere Automatisierungsprofil aus: Prüfungen, die
statisch, lokal und für CI- oder Preflight-Ausgaben nützlich sind. Er überspringt optionale Prüfungen, die
nur beratenden Charakter haben, von der Umgebung abhängen, einen aktiven Dienst erfordern, den Konto-/Workspace-
Bestand erfassen oder historische Bereinigungen durchführen. Verwenden Sie `doctor --lint --all`, wenn Sie die
vollständige registrierte Lint-Prüfung einschließlich dieser optionalen Prüfungen wünschen, oder `--only <id>` für
eine gezielte Prüfung.

`doctor --fix` verwendet nicht das standardmäßige Lint-Profil und akzeptiert
`--all` nicht. Es führt den geordneten Reparaturpfad von Doctor aus: Moderne Zustandsprüfungen können
eine optionale `repair()`-Implementierung bereitstellen, während ältere Bereiche weiterhin ihren bisherigen
Doctor-Reparaturablauf verwenden. Einige Lint-Befunde dienen absichtlich nur der Diagnose; eine
in `--lint --all` enthaltene Prüfung bedeutet daher nicht, dass `--fix` diesen Bereich verändert.
Der Vertrag trennt `detect()` (meldet Befunde) von `repair()` (meldet
Änderungen/Diffs/Nebeneffekte). Dadurch bleibt ein Pfad für eine zukünftige
`doctor --fix --dry-run` offen, ohne Lint-Prüfungen in Änderungsplaner umzuwandeln.

Einige integrierte Prüfungen sind intern standardmäßig deaktiviert, damit sie für
`--all`, `--only` und Doctor-Reparaturabläufe verfügbar bleiben, ohne Teil des standardmäßigen
`doctor --lint`-Automatisierungsprofils zu werden. Der Schweregrad wird weiterhin pro
Befund ausgegeben (`info`, `warning` oder `error`); die standardmäßige Auswahl ist keine
Schweregradstufe.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Felder der JSON-Ausgabe:

- `ok`: ob mindestens ein Befund den ausgewählten Schweregrad-Schwellenwert erreicht hat
- `checksRun` / `checksSkipped`: Anzahlen (durch das Profil, `--only` oder `--skip` übersprungen)
- `findings`: strukturierte Diagnosen mit `checkId`, `severity`, `message` und optional `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Exit-Codes:

| Code | Bedeutung                                                        |
| ---- | ---------------------------------------------------------------- |
| `0`  | keine Befunde auf oder über dem ausgewählten Schwellenwert         |
| `1`  | mindestens ein Befund hat den ausgewählten Schwellenwert erreicht |
| `2`  | Befehls-/Laufzeitfehler, bevor Befunde ausgegeben werden konnten   |

Flags:

- `--severity-min info|warning|error` (Standardwert `warning`): steuert sowohl die Ausgabe als auch, was einen Exit-Code ungleich null verursacht.
- `--all`: führt jede registrierte Lint-Prüfung aus, einschließlich optionaler Prüfungen, die von der standardmäßigen Automatisierungsmenge ausgeschlossen sind.
- `--only <id>` (wiederholbar): führt nur die Prüfung(en) mit der angegebenen ID aus; eine unbekannte ID wird als Fehlerbefund gemeldet.
- `--skip <id>` (wiederholbar): schließt eine Prüfung aus, während der Rest des Laufs aktiv bleibt.
- `--json`, `--severity-min`, `--all`, `--only` und `--skip` erfordern `--lint`; einfache Ausführungen von `openclaw doctor` und `--fix` lehnen sie ab.

## Funktionsübersicht

<AccordionGroup>
  <Accordion title="Systemzustand, Benutzeroberfläche und Aktualisierungen">
    - Optionale Preflight-Aktualisierung für Git-Installationen (nur interaktiv).
    - Aktualitätsprüfung des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung + Aufforderung zum Neustart.
    - Hinweise zu Skills und Plugins nur bei Problemen; ein fehlerfreier Bestand bleibt in `openclaw skills check` und `openclaw plugins list`.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für veraltete Werteformen.
    - Migration der Talk-Konfiguration von veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für veraltete Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen bei OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migration veralteter OpenAI-Codex-Provider/-Profile (`openai-codex` → `openai`) und Warnungen vor Überschattung durch veraltete `models.providers.openai-codex`.
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Zulassungsliste, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie jedoch weiterhin Platzhalter oder Plugin-eigene Tools anfordert.
    - Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
    - Migration veralteter Vertragsschlüssel im Plugin-Manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des veralteten Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload `provider`, `notify: true`-Webhook-Fallback-Aufträge).
    - Reparatur der Codex-CLI-Laufzeitbindung (`agentRuntime.id: "codex-cli"` → `"codex"`) in `agents.defaults`, `agents.entries.*` und `models.providers.*` (einschließlich modellspezifischer Einträge).
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; bei `plugins.enabled=false` bleiben veraltete Plugin-Referenzen als inaktive Eindämmungskonfiguration erhalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungsprotokollen mit duplizierten Prompt-Umschreibungszweigen, die von betroffenen Builds der Version 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für die Wiederherstellung nach dem Neustart blockierter Hauptsitzungen und Subagenten. Doctor meldet die blockierten Sitzungen und repariert nur veraltete Abbruch-Flags, die einem vorhandenen Tombstone widersprechen; die automatische Wiederherstellung wird nicht erneut aktiviert.
    - Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Protokolle, Zustandsverzeichnis).
    - Prüfungen der Konfigurationsdateiberechtigungen (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft den OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Abkühlungs-/Deaktivierungszustände von Authentifizierungsprofilen.

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
    - Migration veralteter Matrix-Kanalzustände (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway abgefragt).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; beispielsweise werden Berechtigungen für Discord-Sprachkanäle mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - Prüfungen der WhatsApp-Reaktionsfähigkeit bei beeinträchtigtem Zustand der Gateway-Ereignisschleife und weiterhin laufenden lokalen TUI-Clients; `--fix` beendet nur verifizierte lokale TUI-Clients.
    - Reparatur von Codex-Routen für veraltete `openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Modellen zur Bild-/Videogenerierung, Heartbeat-/Subagenten-/Compaction-Überschreibungen, Hooks, kanalbezogenen Modellüberschreibungen und Sitzungsroutenbindungen; `--fix` schreibt sie zu `openai/*` um, migriert `openai-codex:*`-Authentifizierungsprofile/-Reihenfolgen zu `openai:*`, entfernt veraltete Laufzeitbindungen für Sitzungen/gesamte Agenten und lässt die reparierte effektive Route bestimmen, ob Codex kompatibel ist.
    - Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während der Installation oder Aktualisierung Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` übernommen haben.
    - Gateway-Laufzeitprüfungen (nicht unterstützte veraltete Bun-Dienste, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standardwert `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen bei offenen Richtlinien für Direktnachrichten.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet die Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Bereichserweiterungen, Abweichungen im veralteten lokalen Geräte-Token-Cache und Authentifizierungsabweichungen in gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - Prüfung von systemd-Linger unter Linux.
    - Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Kürzung oder Annäherung an den Grenzwert für Kontextdateien).
    - Bereitschaftsprüfung der Skills für den Standardagenten; meldet zulässige Skills, bei denen Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen fehlen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen der Quellinstallation (abweichender pnpm-Workspace, fehlende UI-Assets, fehlende tsx-Binärdatei).
    - Schreibt die aktualisierte Konfiguration + Assistentenmetadaten.

  </Accordion>
</AccordionGroup>

## Nachtragen und Zurücksetzen der Dreams-Benutzeroberfläche

  Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese verwenden RPC-Methoden im Gateway-Doctor-Stil, sind jedoch **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

  | Aktion         | Funktionsweise                                                                                                                                                      |
  | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Backfill       | Durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Tagebuchdurchlauf aus und schreibt umkehrbare Backfill-Einträge in `DREAMS.md`. |
  | Reset          | Entfernt ausschließlich die markierten Backfill-Tagebucheinträge aus `DREAMS.md`.                                                                                                  |
  | Clear Grounded | Entfernt ausschließlich bereitgestellte, nur für Grounded bestimmte Kurzzeiteinträge aus der historischen Wiedergabe, für die sich noch kein Live-Abruf oder täglicher Support angesammelt hat.                           |

  Keine dieser Aktionen bearbeitet `MEMORY.md`, führt vollständige Doctor-Migrationen aus oder stellt eigenständig Grounded-Kandidaten im Live-Speicher für die Kurzzeit-Promotion bereit. Um die historische Grounded-Wiedergabe in den normalen tiefen Promotion-Pfad einzuspeisen, verwenden Sie stattdessen den CLI-Ablauf:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Dadurch werden dauerhafte Grounded-Kandidaten im Kurzzeit-Dreaming-Speicher bereitgestellt, während `DREAMS.md` die Review-Oberfläche bleibt.

  ## Detailliertes Verhalten und Begründung

  <AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn es sich um einen Git-Checkout handelt und Doctor interaktiv ausgeführt wird, bietet er vor seiner Ausführung ein Update (Abrufen/Rebase/Build) an.
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Doctor normalisiert veraltete Werteformen in das aktuelle Schema. Die aktuelle Talk-Sprachkonfiguration besteht aus `talk.provider` und `talk.providers.<provider>`, die Echtzeit-Sprachkonfiguration befindet sich unter `talk.realtime.*`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Zuordnung um und überführt veraltete Echtzeit-Selektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools von Plugins überein, die tatsächlich geladen werden; die exklusive Plugin-Zulassungsliste wird dadurch nicht umgangen.

  </Accordion>
  <Accordion title="2. Migrationen veralteter Konfigurationsschlüssel">
    Wenn die Konfiguration einen veralteten Schlüssel mit einer aktiven Migration enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen. Doctor erläutert, welche veralteten Schlüssel gefunden wurden, zeigt die angewendete Migration an und schreibt `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu. Der Gateway-Start lehnt veraltete Konfigurationsformate ab und fordert Sie auf, `openclaw doctor --fix` auszuführen; `openclaw.json` wird beim Start nicht neu geschrieben. Migrationen des Cron-Auftragsspeichers werden ebenfalls von `openclaw doctor --fix` durchgeführt.

    <Note>
      Doctor stellt automatische Migrationen nur ungefähr zwei Monate lang
      bereit, nachdem ein Schlüssel eingestellt wurde. Für ältere veraltete Schlüssel
      (beispielsweise die ursprünglichen `routing.queue`, `routing.bindings`,
      `routing.agents`/`defaultAgentId`, `routing.transcribeAudio`, `agent.*`
      auf oberster Ebene oder `identity` auf oberster Ebene aus der
      Konfigurationsform vor der Multi-Agent-Unterstützung) gibt es keinen
      Migrationspfad mehr; Konfigurationen, die sie verwenden, schlagen nun bei
      der Validierung fehl, statt neu geschrieben zu werden. Korrigieren Sie
      diese Schlüssel anhand der aktuellen Konfigurationsreferenz manuell,
      bevor Doctor fortfahren kann.
    </Note>

    Aktive Migrationen:

    | Veralteter Schlüssel                                                                                    | Aktueller Schlüssel                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | entfernt (WebChat wurde eingestellt)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (und pro Konto)      | `...threadBindings.idleHours`                                               |
    | veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | veraltete übergeordnete Echtzeit-Talk-Selektoren (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts`                                                                                  | übergeordneter `tts`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `tts.providers.<provider>`                                                   |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `tts.provider: "microsoft"` / `tts.providers.microsoft`                    |
    | `tools.exec.security` + `tools.exec.ask`                                                         | `tools.exec.mode`                                                            |
    | `session.idleMinutes`                                                                            | `session.reset.idleMinutes`                                                  |
    | `messages.responsePrefix` mit expliziten Kanalblöcken                                           | in `responsePrefix` des konfigurierten Kanals/Kontos kopiert; globaler Fallback für implizite/benutzerdefinierte Kanäle beibehalten |
    | `web.enabled`                                                                                    | `channels.whatsapp.enabled`                                                  |
    | `meta.lastTouchedAt`, Hook-Installationen, Cron-Speicher, gebündelte Erkennung, globaler Pfad für TTS-Einstellungen            | gemeinsamer SQLite-Zustand                                                       |
    | TTS-Sprecherfelder `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (alle Kanäle außer Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (alle Kanäle einschließlich Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (beim Start des Gateways werden außerdem Provider übersprungen, deren `api` einen zukünftigen/unbekannten Enum-Wert aufweist, statt geschlossen fehlzuschlagen) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | entfernt (veraltete Relay-Einstellung der Chrome-Erweiterung)                             |
    | `mcp.servers.*.type` (CLI-native Aliasse)                                                        | `mcp.servers.*.transport`                                                    |
    | `mcp.servers.*.disabled`                                                                         | inverses `mcp.servers.*.enabled`                                              |
    | MCP-Timeout-Aliasse `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | MCP-Serverfelder in Snake Case                                                                     | MCP-Serverfelder in camelCase                                                   |
    | `tools.media.image/audio/video.models`                                                           | mit Fähigkeiten gekennzeichnete `tools.media.models`                                        |
    | `tools.media.asyncCompletion`                                                                    | entfernt                                                                       |
    | `tools.message.allowCrossContextSend`                                                            | `tools.message.crossContext`                                                  |
    | `deepgram`-Optionen des Medienmodells                                                                   | `providerOptions.deepgram`                                                    |
    | `talk.realtime.voice`, Discord-Echtzeit-`voice`                                                 | `speakerVoice`                                                                |
    | `agents.defaults.pdfMaxBytesMb`                                                                  | `agents.defaults.pdfMaxMb`                                                    |
    | `tools.exec.timeoutSec`                                                                          | `tools.exec.timeoutSeconds`                                                   |
    | `browser.ssrfPolicy.hostnameAllowlist`                                                           | Platzhalter berücksichtigende `browser.ssrfPolicy.allowedHostnames`                          |
    | Sandbox-Browser-`enableNoVnc`                                                                    | `noVncEnabled`                                                                |
    | Stamm-`media`                                                                                     | `attachments`                                                                |
    | Sichtbarkeitsblöcke für Kanal/Konto `heartbeat`                                                   | `heartbeatVisibility`                                                         |
    | `channels.slack.identity`                                                                        | `channels.slack.postAs`                                                       |
    | Stamm-`audit`                                                                                     | `logging.audit`                                                               |
    | `gateway.nodes.skills.enabled`                                                                   | `gateway.nodes.allowSkills`                                                   |
    | `gateway.nodes.allowCommands`/`denyCommands`                                                    | `gateway.nodes.commands.allow`/`deny`                                         |
    | Standardwerte des Generierungsmodells                                                                       | `agents.defaults.mediaModels.{image,video,music}`                              |
    | eingestellte Optionen zur Feinabstimmung des endgültigen Layouts                                                               | integriertes Standardverhalten                                                     |
    | `channels.whatsapp.messagePrefix` und veraltetes `messages.messagePrefix`                            | `channels.whatsapp.responsePrefix`                                            |
    | `channels.whatsapp.ackReaction`                                                                  | globales `messages.ackReaction` und `ackReactionScope`, sofern übersetzbar        |
    | `cron.failureDestination`                                                                        | Zielfelder in `cron.failureAlert`                                     |
    | `gateway.controlUi.chatMessageMaxWidth`, ausschließlich darstellungsbezogene `ui.prefs`-Schlüssel                       | entfernt (Textskalierung, Chatbreite und Live-Seitenleistenaktivität sind browserlokal) |
    | `agents.list`                                                                                    | schlüsselbasiertes `agents.entries`                                                        |
    | übergeordnetes `defaultModel`                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.responsePrefix`                                            |
    | `session.maintenance.pruneDays`, `session.resetByType.dm`                                        | `session.maintenance.pruneAfter`, `session.resetByType.direct`               |
    | übergeordnetes `tui`                                                                                  | entfernt (die TUI-Fußzeile verwendet die kompakte Standardeinstellung)                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | entfernt (der Codex-App-Server behält Codex-native Workspace-Tools stets nativ bei) |
    | `commands.modelsWrite`                                                                           | entfernt (`/models add` ist veraltet)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | entfernt (exaktes `NO_REPLY` wird nicht mehr in sichtbaren Fallback-Text umgeschrieben)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | entfernt (OpenClaw besitzt den generierten System-Prompt)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | entfernt (verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Modelle/Provider; diese bleiben unterhalb der Timeout-Obergrenze für Agenten/Ausführungen) |
    | oberste Ebene `memorySearch`, `agents.defaults.memorySearch`                                         | `memory.search`                                                             |
    | `agents.entries.*.memorySearch`                                                                     | `agents.entries.*.memory.search`                                               |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (auf jeder Ebene)                                                            | entfernt (Speicherindizes befinden sich in der jeweiligen Agentendatenbank)                       |
    | oberste Ebene `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex`-Richtlinien-IDs                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | entfernt (veraltet)                                                        |
    | 2026.7 außer Betrieb genommene Optionen zur Laufzeit- und Kanaloptimierung                                               | entfernt (integrierte Produktionsstandardwerte werden angewendet)                               |

    <Note>
      Die obigen `plugins.entries.voice-call.config.*`-Zeilen werden bei jedem Laden der Konfiguration durch
      das Voice-Call-Plugin selbst normalisiert, nicht durch `openclaw
      doctor`. Das Plugin protokolliert außerdem beim Start eine Warnung mit einem Verweis auf `openclaw
      doctor --fix`, aber Doctor schreibt
      `openclaw.json` für diese Schlüssel derzeit nicht neu; die eigene Normalisierung des Plugins
      wendet die Änderung zur Laufzeit an.
    </Note>

    Hinweise zum Standardkonto für Kanäle mit mehreren Konten:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass das Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `openclaw/plugin-sdk/llm`. Dadurch können Modelle gezwungen werden, die falsche API zu verwenden, oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie die Überschreibung entfernen und das API-Routing sowie die Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browsermigration und Bereitschaft von Chrome MCP">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Pfad der Chrome-Erweiterung verweist, normalisiert Doctor sie auf das aktuelle hostlokale Anbindungsmodell von Chrome MCP (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` entfernt).

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft bei standardmäßigen Profilen mit automatischer Verbindung, ob Google Chrome auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie niedriger als Chrome 144 ist
    - erinnert Sie daran, das Remote-Debugging auf der Inspektionsseite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Das hostlokale Chrome MCP erfordert weiterhin einen Chromium-basierten Browser ab Version 144 auf dem Gateway-/Node-Host, der lokal ausgeführt wird, bei dem das Remote-Debugging aktiviert ist und dessen erste Zustimmungsaufforderung zur Anbindung im Browser bestätigt wurde.

    Die Bereitschaft deckt hier nur die Voraussetzungen für die lokale Anbindung ab. Existing-session behält die aktuellen Routenbeschränkungen von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfang und Stapelaktionen erfordern weiterhin einen verwalteten Browser oder ein reines CDP-Profil. Diese Prüfung gilt nicht für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe, die weiterhin reines CDP verwenden.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ein abgelaufenes Zertifikat oder ein selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einer Homebrew-Node-Installation lautet die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt, wenn das Gateway fehlerfrei arbeitet.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überlagern. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth vorhanden sind, damit Sie die veraltete Transportüberschreibung entfernen oder neu schreiben und das aktuelle Routingverhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus, aber solche eigens definierten Anfragerouten kommen nicht für die implizite Codex-Auswahl infrage.
  </Accordion>
  <Accordion title="2f. Reparatur von Codex-Routen">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Das native Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen, aber das Präfix allein wählt niemals Codex aus. Wenn keine Laufzeitrichtlinie festgelegt oder `auto` eingestellt ist, kommt nur eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne eigens definierte Anfrageüberschreibung infrage. Siehe [Implizite OpenAI-Agentenlaufzeit](/de/providers/openai#implicit-agent-runtime).

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Referenzen des Standardagenten und einzelner Agenten neu, einschließlich primärer Modelle, Fallbacks, Modelle zur Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen und veraltetem persistentem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die Codex-Absicht wird für reparierte Agentenmodellreferenzen in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge verschoben.
    - Veraltete Laufzeitkonfigurationen für den gesamten Agenten und persistente Laufzeitbindungen der Sitzung werden entfernt, da die Laufzeitauswahl Provider-/modellbezogen erfolgt.
    - Die vorhandene Provider-/Modell-Laufzeitrichtlinie bleibt erhalten, sofern die reparierte veraltete Modellreferenz nicht Codex-Routing benötigt, um den alten Authentifizierungspfad beizubehalten.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge neu geschrieben werden; kopierte modellspezifische Einstellungen werden vom veralteten Schlüssel in den kanonischen Schlüssel `openai/*` verschoben.
    - Persistente Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Authentifizierungsprofilbindungen werden in allen erkannten Sitzungsspeichern der Agenten repariert.
    - Doctor repariert separat veraltete `agentRuntime.id: "codex-cli"`-Bindungen (eine eigenständige veraltete Laufzeit-ID) zu `"codex"` in den Modelleinträgen `agents.defaults`, `agents.entries.*` und `models.providers.*`.
    - `/codex ...` bedeutet „eine native Codex-Konversation über den Chat steuern oder anbinden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Bereinigung von Sitzungsrouten">
    Doctor durchsucht außerdem erkannte Sitzungsspeicher der Agenten nach veraltetem, automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder die Laufzeit von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modellbindungen, Laufzeitmodellmetadaten, gebundene Harness-IDs, CLI-Sitzungsbindungen und automatische Authentifizierungsprofilüberschreibungen löschen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite benutzerseitige oder veraltete Sitzungsmodellentscheidungen werden zur manuellen Prüfung gemeldet und unverändert belassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr vorgesehen ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Datenträgerlayout)">
    Doctor kann ältere Datenträgerlayouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher und Transkripte: von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agentenverzeichnis: von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungsstatus (Baileys): vom veralteten `~/.openclaw/credentials/*.json` (außer `oauth.json`) nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)
    - Signierte Geräteidentität: von `~/.openclaw/identity/device.json` in die Zeile `primary` `device_identities` in `state/openclaw.sqlite`; die separate Geräteauthentifizierungsdatei bleibt unverändert

    Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Sicherungen zurückbleiben. Das Gateway/die CLI migriert außerdem den veralteten Sitzungsspeicher und das Agentenverzeichnis beim Start automatisch, sodass Verlauf, Authentifizierung und Modelle ohne manuelle Ausführung von Doctor im agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung des Talk-Providers bzw. der Provider-Zuordnung vergleicht anhand struktureller Gleichheit, sodass Unterschiede ausschließlich in der Schlüsselreihenfolge keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Funktionsschlüsseln der obersten Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Werden sie gefunden, bietet Doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent; wenn `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen des veralteten Cron-Speichers">
    Doctor prüft außerdem den veralteten Cron-Auftragsspeicher (`~/.openclaw/cron/jobs.json`) auf alte Auftragsstrukturen, bevor kanonische Zeilen in SQLite importiert werden.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Nutzdatenfelder der obersten Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder der obersten Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Zustellungsaliase in den Nutzdaten unter `provider` → explizites `delivery.channel`
    - veraltete `notify: true`-Webhook-Fallback-Aufträge → explizite Webhook-Zustellung aus dem eingestellten unverarbeiteten `cron.webhook`-Wert, sofern dieser gültig ist; Ankündigungsaufträge behalten ihre Chat-Zustellung und erhalten `delivery.completionDestination`. Anschließend entfernt Doctor den alten Konfigurationsschlüssel. Ohne einen nutzbaren veralteten Webhook wird die inaktive `notify`-Markierung der obersten Ebene bei Aufträgen ohne Ziel entfernt (die vorhandene Zustellung einschließlich Ankündigungen bleibt erhalten), da die Laufzeitzustellung sie niemals liest.

    Das Gateway bereinigt außerdem fehlerhafte Cron-Zeilen beim Laden, damit gültige Aufträge weiterhin ausgeführt werden. Unverarbeitete fehlerhafte Zeilen werden vor ihrer Entfernung aus `jobs.json` neben dem aktiven Speicher nach `jobs-quarantine.json` kopiert; Doctor meldet unter Quarantäne gestellte Zeilen, damit Sie sie manuell prüfen oder reparieren können.

    Beim Start normalisiert das Gateway die Laufzeitprojektion und ignoriert die `notify`-Markierung der obersten Ebene, belässt jedoch den persistenten Cron-Status für die Reparatur durch Doctor. Doctor entfernt inaktive Markierungen für Aufträge ohne Migrationsziel (`delivery.mode` nicht vorhanden/abwesend, ein unbrauchbares veraltetes Webhook-Ziel oder eine vorhandene Ankündigungs-/Chat-Zustellung), wobei die vorhandene Zustellung unverändert bleibt, sodass wiederholte Ausführungen von `doctor --fix` nicht mehr erneut vor demselben Auftrag warnen.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird vom aktuellen OpenClaw nicht verwaltet und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Zustandsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien, die nach einer abnormal beendeten Sitzung zurückgeblieben sind. Für jede gefundene Sperrdatei meldet Doctor: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (inaktive PID, fehlerhafte Eigentümermetadaten, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Prozess gehört, der nicht von OpenClaw stammt). Im Modus `--fix` / `--repair` entfernt Doctor automatisch Sperren mit inaktiven, verwaisten, wiederverwendeten, fehlerhaft-alten oder nicht zu OpenClaw gehörenden Eigentümern. Alte Sperren, die noch einem aktiven OpenClaw-Prozess gehören, werden gemeldet, aber beibehalten, damit Doctor keinen aktiven Transkript-Schreibvorgang unterbricht.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Zweigen">
    Doctor durchsucht die JSONL-Dateien der Agent-Sitzungen nach der duplizierten Zweigstruktur, die durch den Fehler bei der Neuschreibung von Prompt-Transkripten in Version 2026.4.24 verursacht wurde: eine verworfene Benutzereingabe mit internem OpenClaw-Laufzeitkontext sowie ein aktiver Geschwisterzweig mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Zweig um, sodass Gateway-Verlauf und Speicherleser keine doppelten Eingaben mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist das operative Stammhirn. Wenn es verschwindet, gehen Sitzungen, Anmeldedaten, Protokolle und Konfiguration verloren, sofern keine Sicherungen an anderer Stelle vorhanden sind.

    Doctor prüft:

    - **Fehlendes Zustandsverzeichnis**: warnt vor einem katastrophalen Zustandsverlust, fordert zur Neuerstellung des Verzeichnisses auf und weist darauf hin, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: überprüft die Schreibbarkeit; bietet an, die Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer oder Gruppe erkannt wird).
    - **Mit der Cloud synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn sich der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` befindet, da synchronisierte Pfade langsamere E/A und Sperr-/Synchronisationskonflikte verursachen können.
    - **Zustandsverzeichnis auf SD oder eMMC unter Linux**: warnt, wenn sich der Zustand auf einer `mmcblk*`-Mount-Quelle befindet, da zufällige E/A auf SD-/eMMC-Speicher langsamer sein und dieser durch Schreibvorgänge für Sitzungen und Anmeldedaten schneller verschleißen kann.
    - **Flüchtiges Zustandsverzeichnis unter Linux**: warnt, wenn sich der Zustand unter `tmpfs` oder `ramfs` befindet, da Sitzungen, Anmeldedaten, Konfiguration und der SQLite-Zustand (mit WAL-/Journal-Begleitdateien) beim Neustart verschwinden. Docker-`overlay`-Mounts werden absichtlich nicht gekennzeichnet, da ihre beschreibbaren Ebenen Host-Neustarts überdauern, solange der Container erhalten bleibt.
    - **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um den Verlauf dauerhaft zu speichern und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung mit „1-zeiligem JSONL“**: kennzeichnet, wenn das Haupttranskript nur eine Zeile enthält (der Verlauf wird nicht fortgeschrieben).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner in verschiedenen Home-Verzeichnissen vorhanden sind oder `OPENCLAW_STATE_DIR` auf einen anderen Ort verweist (der Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Hinweis zum Remote-Modus**: Wenn `gateway.mode=remote`, erinnert Doctor daran, ihn auf dem Remote-Host auszuführen (der Zustand befindet sich dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe oder alle Benutzer lesbar ist, und bietet an, die Berechtigungen auf `600` zu beschränken.

  </Accordion>
  <Accordion title="5. Zustand der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor überprüft OAuth-Profile im Authentifizierungsspeicher, warnt vor bald ablaufenden oder abgelaufenen Tokens und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt Doctor einen Anthropic-API-Schlüssel oder den Anthropic-Einrichtungstoken-Pfad vor. Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (beispielsweise `refresh_token_reused`, `invalid_grant` oder wenn ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakt auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die wegen kurzer Abklingzeiten (Ratenbegrenzungen/Zeitüberschreitungen/Authentifizierungsfehler) oder längerer Deaktivierungen (Abrechnungs-/Guthabenfehler) vorübergehend nicht verwendbar sind.

    Veraltete Codex-OAuth-Profile, deren Tokens im macOS-Schlüsselbund gespeichert sind (älteres Onboarding vor dem dateibasierten Begleitdatei-Layout), werden ausschließlich von Doctor repariert. Führen Sie `openclaw doctor --fix` einmal in einem interaktiven Terminal aus, um ältere, durch den Schlüsselbund gestützte Tokens direkt nach `auth-profiles.json` zu migrieren; danach werden sie bei eingebetteten Durchläufen (Telegram, Cron, Sub-Agent-Dispatch) als kanonische OpenAI-OAuth-Profile aufgelöst.

  </Accordion>
  <Accordion title="6. Modellvalidierung für Hooks">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz anhand des Katalogs und der Positivliste und warnt, wenn sie nicht aufgelöst werden kann oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur von Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu erstellen oder zu älteren Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` veraltete, von OpenClaw generierte Bereitstellungszustände für Plugin-Abhängigkeiten: veraltete generierte Abhängigkeitsstammverzeichnisse, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überlagern können. Doctor verknüpft außerdem das Host-Paket `openclaw` erneut mit verwalteten npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Aktualisierungen oder npm-Reparaturen weiterhin aufgelöst werden.

    Doctor kann auch fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie jedoch nicht finden kann (wesentliche `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen, konfigurierte Agent-Laufzeiten). Während Paketaktualisierungen vermeidet Doctor die Neuinstallation von Plugin-Paketen, solange das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Außerhalb der unten beschriebenen Ausnahme für den Start eines Container-Images führen der Gateway-Start und das erneute Laden der Konfiguration keine Paketreparatur aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsvorgänge.

    Der Start eines containerisierten Gateways verfügt über eine eng begrenzte Upgrade-Ausnahme: Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet, führt es vor der Betriebsbereitschaft sichere Zustandsmigrationen und die bestehende Plugin-Konvergenz nach der Kernaktualisierung aus und zeichnet anschließend einen versionsspezifischen Prüfpunkt auf. Dieser Startdurchlauf kann veraltete Datensätze gebündelter Plugins bereinigen, lokale Plugin-Verknüpfungen reparieren, konfigurierte Plugin-Pakete neu installieren, wenn der Konvergenzpfad dies erfordert, und aktive Plugin-Nutzlasten prüfen. Wenn beim Start keine sichere Reparatur möglich ist, führen Sie dasselbe Image einmal mit `openclaw doctor --fix` für denselben eingebundenen Zustand und dieselbe eingebundene Konfiguration aus, bevor Sie den Container normal neu starten.

  </Accordion>
  <Accordion title="8. Migrationen des Gateway-Dienstes und Bereinigungshinweise">
    Doctor erkennt ältere Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Doctor kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Hinweise zu deren Bereinigung ausgeben. Nach Profil benannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „zusätzlich“ gekennzeichnet.

    Wenn unter Linux der Gateway-Dienst auf Benutzerebene fehlt, aber ein systemweiter OpenClaw-Gateway-Dienst vorhanden ist, installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep` und entfernen Sie anschließend das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Matrix-Migration beim Start">
    Wenn für ein Matrix-Kanalkonto eine ausstehende oder erforderliche Migration eines älteren Zustands vorliegt, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt anschließend die bestmöglichen Migrationsschritte aus: die Migration des älteren Matrix-Zustands und die Vorbereitung des älteren verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsabweichungen">
    Doctor überprüft den Zustand der Gerätekopplung im Rahmen der normalen Zustandsprüfung und meldet:

    - ausstehende Anfragen zur erstmaligen Kopplung
    - ausstehende Rollen- oder Bereichserweiterungen für bereits gekoppelte Geräte
    - Reparaturen bei Abweichungen öffentlicher Schlüssel, wenn die Geräte-ID weiterhin übereinstimmt, die Geräteidentität aber nicht mehr dem genehmigten Datensatz entspricht
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Berechtigungsbereiche von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Geräte-Token-Einträge für den aktuellen Rechner, die vor einer Gateway-seitigen Token-Rotation erstellt wurden oder veraltete Metadaten zu Berechtigungsbereichen enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Doctor gibt die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die konkrete Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - mit `openclaw devices rotate --device <deviceId> --role <role>` ein neues Token rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch werden die erstmalige Kopplung, ausstehende Rollen-/Bereichserweiterungen und Abweichungen durch veraltete Tokens oder Geräteidentitäten voneinander unterschieden und die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“ geschlossen.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt nur dann einen Sicherheitshinweis aus, wenn eine Warnung gefunden wird, etwa ein Provider, der ohne Positivliste für Direktnachrichten offen ist, oder eine gefährlich konfigurierte Richtlinie. Verwenden Sie `openclaw security audit` für das vollständige Sicherheitsinventar.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Bei der Ausführung als systemd-Benutzerdienst stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und TaskFlows)">
    Doctor gibt Probleme und Maßnahmen für den Standard-Agenten aus, nicht das Inventar des fehlerfreien Zustands:

    - **Skills**: listet die Namen zulässiger, aber nicht verwendbarer Skills auf; verwenden Sie `openclaw skills check` für Details zu den Anforderungen und vollständige Anzahlen.
    - **Plugins**: meldet nur fehlerhafte Plugin-IDs; verwenden Sie `openclaw plugins list` für das Inventar geladener, importierter, deaktivierter und gebündelter Plugins.
    - **Warnungen zur Plugin-Kompatibilität**: kennzeichnet Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit aufweisen.
    - **Plugin-Diagnose**: zeigt alle beim Laden von der Plugin-Registry ausgegebenen Warnungen oder Fehler an.
    - **TaskFlow-Wiederherstellung**: zeigt verdächtige verwaltete TaskFlows an, die manuell geprüft oder abgebrochen werden müssen.
    - **Claude CLI**: meldet nur Probleme mit Binärdatei, Authentifizierung, Profil, Workspace oder Projektverzeichnis; Details erfolgreicher Prüfungen werden ausgelassen.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Dateien">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (beispielsweise `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder dieses überschreiten. Doctor meldet für jede Datei die rohe gegenüber der injizierten Zeichenzahl, den Kürzungsprozentsatz, die Kürzungsursache (`max/file` oder `max/total`) und die Gesamtzahl injizierter Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Grenzwert liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob die Tabulatorvervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Completion im Profil konfiguriert ist, aber die Cache-Datei fehlt, erzeugt Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Überschreibungen. Dies verhindert Gateway-Startschleifen, bei denen die Kanal-Runtime nicht mehr vorhanden ist, die Konfiguration das Gateway jedoch weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft, ob die lokale Gateway-Token-Authentifizierung einsatzbereit ist.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu erzeugen.
    - Wenn `gateway.auth.token` durch SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur, wenn keine Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte, SecretRef-fähige Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Runtime abzuschwächen.

    - `openclaw doctor --fix` verwendet für gezielte Konfigurationsreparaturen dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Statusfamilie.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, sofern diese verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, im aktuellen Befehlspfad jedoch nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung und Neustart">
    Doctor führt eine Zustandsprüfung durch und bietet einen Neustart des Gateways an, wenn es nicht ordnungsgemäß zu funktionieren scheint.
  </Accordion>
  <Accordion title="13b. Einsatzbereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agenten einsatzbereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob das `qmd`-Binary verfügbar und startfähig ist. Falls nicht, werden Anweisungen zur Behebung einschließlich `npm install -g @tobilu/qmd` (oder des Bun-Äquivalents) sowie eine Option für einen manuellen Binary-Pfad ausgegeben.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote- beziehungsweise herunterladbare Modell-URL. Falls diese fehlt, wird der Wechsel zu einem Remote-Provider empfohlen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Überprüft, ob ein API-Schlüssel in der Umgebung oder im Authentifizierungsspeicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
    - **Veralteter automatischer Provider**: Behandelt `memorySearch.provider: "auto"` als OpenAI, prüft die Einsatzbereitschaft von OpenAI und `doctor --fix` schreibt ihn in `provider: "openai"` um.

    Wenn ein zwischengespeichertes Ergebnis der Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung funktionsfähig), gleicht Doctor dessen Ergebnis mit der in der CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den umfassenden Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Einsatzbereitschaft von Embeddings zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Warnungen zum Kanalstatus">
    Wenn das Gateway funktionsfähig ist, führt Doctor eine Kanalstatusprüfung durch und meldet Warnungen mit Lösungsvorschlägen.
  </Accordion>
  <Accordion title="15. Prüfung und Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (beispielsweise systemd-Abhängigkeiten von network-online und die Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor eine Aktualisierung und kann die Dienstdatei beziehungsweise Aufgabe mit den aktuellen Standardwerten neu schreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturabfragen.
    - `openclaw doctor --fix` wendet empfohlene Korrekturen ohne Rückfragen an (`--repair` ist ein Alias).
    - `openclaw doctor --fix --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` sorgt dafür, dass Doctor für den Lebenszyklus des Gateway-Dienstes schreibgeschützt bleibt. Doctor meldet weiterhin den Dienstzustand und führt Reparaturen außerhalb des Dienstes durch, überspringt jedoch Installation, Start, Neustart und Bootstrap des Dienstes, das Neuschreiben der Supervisor-Konfiguration sowie die Bereinigung veralteter Dienste, da ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt Doctor keine Befehls- oder Einstiegspunkt-Metadaten neu, während die entsprechende systemd-Gateway-Unit aktiv ist. Bei der Suche nach doppelten Diensten ignoriert Doctor außerdem inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units, damit ergänzende Dienstdateien keinen unnötigen Bereinigungsaufwand verursachen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` durch SecretRef verwaltet wird, validiert die Dienstinstallation beziehungsweise -reparatur von Doctor die SecretRef, speichert aufgelöste Klartext-Tokenwerte jedoch nicht dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`- beziehungsweise SecretRef-gestützte Dienstumgebungswerte, die ältere Installationen von LaunchAgent, systemd oder geplanten Windows-Aufgaben inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Runtime-Quelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` fest vorgibt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations- beziehungsweise Reparaturpfad und gibt umsetzbare Anweisungen aus.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor die Installation beziehungsweise Reparatur, bis der Modus explizit festgelegt wurde.
    - Bei Linux-Units für Benutzer-systemd berücksichtigen die Prüfungen von Doctor auf Token-Abweichungen beim Vergleich der Dienst-Authentifizierungsmetadaten sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen.
    - Dienstreparaturen durch Doctor verweigern das Neuschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Über `openclaw gateway install --force` können Sie jederzeit ein vollständiges Neuschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Runtime- und Portdiagnose">
    Doctor prüft die Dienst-Runtime (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber tatsächlich nicht ausgeführt wird. Doctor prüft außerdem auf Portkonflikte am Gateway-Port (Standard: `18789`) und meldet wahrscheinliche Ursachen (Gateway wird bereits ausgeführt, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Runtime">
    Doctor warnt, wenn der Gateway-Dienst unter Bun oder über einen von einem Versionsmanager verwalteten Node-Pfad ausgeführt wird (`nvm`, `fnm`, `volta`, `asdf` usw.). Bun kann den `node:sqlite`-Zustandsspeicher von OpenClaw nicht öffnen, daher migrieren Reparaturen veraltete Bun-Dienste zu Node. Pfade von Versionsmanagern können nach Aktualisierungen nicht mehr funktionieren, da der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet die Migration zu einer systemweiten Node-Installation an, sofern eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), anstatt den PATH der interaktiven Shell zu kopieren. Dadurch bleiben von Homebrew verwaltete System-Binaries verfügbar, während Volta, asdf, fnm, pnpm und andere Verzeichnisse von Versionsmanagern nicht beeinflussen, welche Node-Version von untergeordneten Prozessen aufgelöst wird. Linux-Dienste behalten weiterhin explizite Umgebungs-Stammverzeichnisse (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Binary-Verzeichnisse bei; vermutete Fallback-Verzeichnisse von Versionsmanagern werden jedoch nur dann in den Dienst-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger vorhanden sind.

  </Accordion>
  <Accordion title="18. Schreiben der Konfiguration und Assistentenmetadaten">
    Doctor speichert sämtliche Konfigurationsänderungen dauerhaft und versieht die Assistentenmetadaten mit einem Vermerk, um den Doctor-Lauf zu protokollieren.
  </Accordion>
  <Accordion title="19. Tipps zum Arbeitsbereich (Sicherung und Speichersystem)">
    Doctor empfiehlt ein Speichersystem für den Arbeitsbereich, wenn keines vorhanden ist, und gibt einen Sicherungshinweis aus, falls der Arbeitsbereich nicht bereits unter Git verwaltet wird.

    Unter [/concepts/agent-workspace](/de/concepts/agent-workspace) finden Sie eine vollständige Anleitung zur Struktur des Arbeitsbereichs und zur Git-Sicherung (ein privates GitHub- oder GitLab-Repository wird empfohlen).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
