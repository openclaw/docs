---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung nicht abwärtskompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doktor
x-i18n:
    generated_at: "2026-07-16T12:47:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen und Zustände, prüft den Systemzustand und bietet konkrete Reparaturschritte.

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

    Standardwerte ohne Rückfragen akzeptieren (gegebenenfalls einschließlich Reparaturschritten für Neustart, Dienst und Sandbox).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Empfohlene Reparaturen ohne Rückfragen anwenden (`--repair` ist ein Alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Strukturierte Zustandsprüfungen für CI oder Preflight-Automatisierung ausführen. Schreibgeschützt: keine
    Rückfragen, Reparaturen, Migrationen, Neustarts oder Schreibvorgänge am Zustand.

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
    Verschieben des Zustands auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die eine
    menschliche Bestätigung erfordern. Erkannte Migrationen von Altzuständen werden weiterhin automatisch ausgeführt.

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

`openclaw doctor --lint` ist die automatisierungsfreundliche Variante von
`openclaw doctor --fix`. Beide verwenden dieselbe Doctor-Regelregistrierung, wählen Regeln jedoch
unterschiedlich aus und wenden sie unterschiedlich an:

| Modus                     | Rückfragen   | Schreibt Konfiguration/Zustand     | Ausgabe                 | Verwendungszweck                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | ja       | nein                      | verständlicher Zustandsbericht | manuelle Statusprüfung         |
| `openclaw doctor --fix`  | manchmal | ja, gemäß Reparaturrichtlinie | verständliches Reparaturprotokoll    | Anwenden genehmigter Reparaturen       |
| `openclaw doctor --lint` | nein        | nein                      | strukturierte Befunde    | CI-, Preflight- und Review-Gates |

Standardmäßig führt `doctor --lint` das umfassende sichere Automatisierungsprofil aus: Prüfungen, die
statisch, lokal und für CI- oder Preflight-Ausgaben nützlich sind. Ausgelassen werden optionale Prüfungen, die
nur Hinweise liefern, von der Umgebung abhängen, einen aktiven Dienst erfordern, den Bestand von Konten oder Arbeitsbereichen
erfassen oder historische Bereinigungen durchführen. Verwenden Sie `doctor --lint --all` für die
vollständige registrierte Lint-Prüfung einschließlich dieser optionalen Prüfungen oder `--only <id>` für
eine gezielte Prüfung.

`doctor --fix` verwendet nicht das standardmäßige Lint-Profil und akzeptiert
`--all` nicht. Es führt den geordneten Reparaturpfad von Doctor aus: Moderne Zustandsprüfungen können
eine optionale `repair()`-Implementierung bereitstellen, während ältere Bereiche weiterhin ihren bisherigen
Doctor-Reparaturablauf verwenden. Einige Lint-Befunde sind absichtlich rein diagnostisch; daher bedeutet eine
in `--lint --all` enthaltene Prüfung nicht, dass `--fix` diesen Bereich verändert.
Der Vertrag trennt `detect()` (meldet Befunde) von `repair()` (meldet
Änderungen/Diffs/Nebenwirkungen). Dadurch bleibt ein Weg für ein zukünftiges
`doctor --fix --dry-run` offen, ohne Lint-Prüfungen in Änderungsplaner umzuwandeln.

Einige integrierte Prüfungen sind intern standardmäßig deaktiviert, damit sie für
`--all`, `--only` und Doctor-Reparaturabläufe verfügbar bleiben, ohne Teil des standardmäßigen
`doctor --lint`-Automatisierungsprofils zu werden. Der Schweregrad wird weiterhin pro
Befund ausgegeben (`info`, `warning` oder `error`); die Standardauswahl ist keine
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

| Code | Bedeutung                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | keine Befunde auf oder über dem ausgewählten Schwellenwert           |
| `1`  | mindestens ein Befund hat den ausgewählten Schwellenwert erreicht          |
| `2`  | Befehls-/Laufzeitfehler, bevor Befunde ausgegeben werden konnten |

Flags:

- `--severity-min info|warning|error` (Standard: `warning`): steuert sowohl die Ausgabe als auch die Bedingungen für einen Exit-Code ungleich null.
- `--all`: führt jede registrierte Lint-Prüfung aus, einschließlich optionaler Prüfungen, die nicht zum standardmäßigen Automatisierungssatz gehören.
- `--only <id>` (wiederholbar): führt nur die Prüfungen mit den angegebenen IDs aus; eine unbekannte ID wird als Fehlerbefund gemeldet.
- `--skip <id>` (wiederholbar): schließt eine Prüfung aus, während der übrige Durchlauf aktiv bleibt.
- `--json`, `--severity-min`, `--all`, `--only` und `--skip` erfordern `--lint`; einfache Durchläufe mit `openclaw doctor` und `--fix` lehnen sie ab.

## Funktionsübersicht

<AccordionGroup>
  <Accordion title="Systemzustand, UI und Updates">
    - Optionale Preflight-Aktualisierung für Git-Installationen (nur interaktiv).
    - Prüfung der Aktualität des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung + Aufforderung zum Neustart.
    - Nur problembezogene Hinweise zu Skills und Plugins; ein fehlerfreier Bestand verbleibt in `openclaw skills check` und `openclaw plugins list`.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für veraltete Werteformen.
    - Migration der Talk-Konfiguration von veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für veraltete Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu Überschreibungen des OpenCode-Providers (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migration veralteter OpenAI-Codex-Provider/-Profile (`openai-codex` → `openai`) und Warnungen vor Überschattung durch veraltete `models.providers.openai-codex`.
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zu Plugin-/Tool-Zulassungslisten, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie jedoch weiterhin Platzhalter oder Plugin-eigene Tools anfordert.
    - Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
    - Migration veralteter Vertragsschlüssel im Plugin-Manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des veralteten Cron-Speichers (`jobId`, `schedule.cron`, Zustellungs-/Nutzlastfelder auf oberster Ebene, Nutzlast `provider`, `notify: true`-Webhook-Fallback-Aufgaben).
    - Reparatur der Laufzeitbindung der Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) in `agents.defaults`, `agents.list[]` und `models.providers.*` (einschließlich modellspezifischer Einträge).
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; bei `plugins.enabled=false` bleiben veraltete Plugin-Referenzen als inaktive Eindämmungskonfiguration erhalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten mit duplizierten Prompt-Umschreibungszweigen, die von betroffenen Builds der Version 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für die Neustartwiederherstellung blockierter Subagenten, mit Unterstützung für `--fix` zum Löschen veralteter Abbruchkennzeichnungen, damit der Startprozess das Kind nicht weiterhin als durch einen Neustart abgebrochen behandelt.
    - Prüfungen von Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft den OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Abklingzeit-/Deaktivierungszustände von Authentifizierungsprofilen.

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
    - Migration des veralteten Matrix-Kanalzustands (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway abgefragt).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; beispielsweise werden Berechtigungen für Discord-Sprachkanäle mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - Prüfung der WhatsApp-Reaktionsfähigkeit bei beeinträchtigtem Zustand der Gateway-Ereignisschleife, während lokale TUI-Clients noch ausgeführt werden; `--fix` beendet ausschließlich verifizierte lokale TUI-Clients.
    - Reparatur der Codex-Route für veraltete `openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Modellen zur Bild-/Videogenerierung, Heartbeat-/Subagenten-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsroutenbindungen; `--fix` schreibt sie zu `openai/*` um, migriert `openai-codex:*`-Authentifizierungsprofile und deren Reihenfolge zu `openai:*`, entfernt veraltete Laufzeitbindungen für Sitzungen und vollständige Agenten und lässt die reparierte effektive Route bestimmen, ob Codex kompatibel ist.
    - Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungsvariablen für Gateway-Dienste, die während der Installation oder Aktualisierung Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` übernommen haben.
    - Gateway-Laufzeitprüfungen (nicht unterstützte veraltete Bun-Dienste, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard: `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen bei offenen Richtlinien für Direktnachrichten.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet die Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine SecretRef-Konfigurationen für Token).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Bereichserweiterungen, Abweichungen im veralteten lokalen Geräte-Token-Cache und Authentifizierungsabweichungen in gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Arbeitsbereich und Shell">
    - Prüfung der systemd-Linger-Funktion unter Linux.
    - Prüfung der Größe von Bootstrap-Dateien im Arbeitsbereich (Warnungen bei Kürzung bzw. Annäherung an das Limit für Kontextdateien).
    - Prüfung der Skills-Bereitschaft für den Standardagenten; meldet zulässige Skills, bei denen Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen fehlen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Prüfung des Status der Shell-Vervollständigung sowie automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen der Quellinstallation (Nichtübereinstimmung des pnpm-Arbeitsbereichs, fehlende UI-Assets, fehlende tsx-Binärdatei).
    - Schreibt die aktualisierte Konfiguration + Assistentenmetadaten.

  </Accordion>
</AccordionGroup>

## Nachträgliches Auffüllen und Zurücksetzen der Dreams-UI

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Zurücksetzen** und **Grounded-Einträge löschen** für den Grounded-Dreaming-Workflow. Diese verwenden RPC-Methoden im Gateway-Doctor-Stil, sind jedoch **nicht** Teil der CLI-Reparatur/-Migration mit `openclaw doctor`.

| Aktion                   | Funktionsweise                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backfill                 | Durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.             |
| Zurücksetzen             | Entfernt ausschließlich die markierten Backfill-Tagebucheinträge aus `DREAMS.md`.                                                                                                        |
| Grounded-Einträge löschen | Entfernt ausschließlich bereitgestellte, nur Grounded betreffende Kurzzeiteinträge aus der historischen Wiedergabe, für die noch kein Live-Abruf oder keine tägliche Unterstützung vorhanden ist. |

Keine dieser Aktionen bearbeitet `MEMORY.md`, führt vollständige Doctor-Migrationen aus oder stellt eigenständig Grounded-Kandidaten im Live-Promotion-Speicher für Kurzzeiteinträge bereit. Um die historische Grounded-Wiedergabe in den normalen Deep-Promotion-Pfad einzuspeisen, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden dauerhafte Grounded-Kandidaten im Kurzzeit-Dreaming-Speicher bereitgestellt, während `DREAMS.md` die Überprüfungsoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn es sich um einen Git-Checkout handelt und Doctor interaktiv ausgeführt wird, bietet Doctor vor der Ausführung ein Update (Fetch/Rebase/Build) an.
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Doctor normalisiert veraltete Wertstrukturen in das aktuelle Schema. Die aktuelle Talk-Sprachkonfiguration besteht aus `talk.provider` + `talk.providers.<provider>`, wobei sich die Echtzeit-Sprachkonfiguration unter `talk.realtime.*` befindet. Doctor überführt alte Strukturen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Zuordnung und überführt veraltete Echtzeit-Selektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools aus tatsächlich geladenen Plugins überein; die exklusive Plugin-Zulassungsliste wird dadurch nicht umgangen.

  </Accordion>
  <Accordion title="2. Migrationen veralteter Konfigurationsschlüssel">
    Wenn die Konfiguration einen veralteten Schlüssel mit einer aktiven Migration enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen. Doctor erläutert, welche veralteten Schlüssel gefunden wurden, zeigt die angewendete Migration und schreibt `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu. Der Gateway-Start verweigert veraltete Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; `openclaw.json` wird beim Start nicht neu geschrieben. Migrationen des Cron-Auftragsspeichers werden ebenfalls von `openclaw doctor --fix` verarbeitet.

    <Note>
      Doctor stellt automatische Migrationen nur für ungefähr zwei Monate nach
      der Außerdienststellung eines Schlüssels bereit. Für ältere veraltete Schlüssel (zum Beispiel die ursprünglichen
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` auf oberster Ebene oder `identity`
      auf oberster Ebene aus der Konfigurationsstruktur vor der Multi-Agent-Unterstützung) ist kein Migrationspfad mehr vorhanden;
      Konfigurationen, die sie verwenden, schlagen nun bei der Validierung fehl, statt neu geschrieben zu werden. Korrigieren Sie
      diese Schlüssel anhand der aktuellen Konfigurationsreferenz manuell, bevor Doctor
      fortfahren kann.
    </Note>

    Aktive Migrationen:

    | Veralteter Schlüssel                                                                            | Aktueller Schlüssel                                                                 |
    | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                                  |
    | `routing.groupChat.requireMention`                                                                              | `channels.whatsapp/telegram/imessage.groups."*".requireMention`                                                                  |
    | `routing.groupChat.historyLimit`                                                                              | `messages.groupChat.historyLimit`                                                                  |
    | `routing.groupChat.mentionPatterns`                                                                              | `messages.groupChat.mentionPatterns`                                                                  |
    | `channels.telegram.requireMention`                                                                              | `channels.telegram.groups."*".requireMention`                                                                  |
    | `channels.webchat`, `gateway.webchat`                                                         | entfernt (WebChat wurde eingestellt)                                                |
    | `channels.feishu.accounts.<accountId>.botName`                                                                              | `channels.feishu.accounts.<accountId>.name`                                                                  |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (sowie pro Konto)                                       | `...threadBindings.idleHours`                                                                  |
    | veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` | `talk.provider` + `talk.providers.<provider>`                               |
    | veraltete Echtzeit-Talk-Selektoren auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                    |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) | `messages.tts.providers.<provider>`                                                                  |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                                        | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`                                            |
    | TTS-Sprecherfelder `voice`/`voiceName`/`voiceId`                    | `speakerVoice`/`speakerVoiceId`                                               |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (alle Kanäle außer Discord)                            | `...tts.providers.<provider>`                                                                  |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (alle Kanäle einschließlich Discord)                   | `...voice.tts.providers.<provider>`                                                                  |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) | `plugins.entries.voice-call.config.tts.providers.<provider>`                                                                  |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                                                        | `provider: "microsoft"` / `...tts.providers.microsoft`                                            |
    | `plugins.entries.voice-call.config.provider: "log"`                                                                              | `"mock"`                                                                  |
    | `plugins.entries.voice-call.config.twilio.from`                                                                              | `plugins.entries.voice-call.config.fromNumber`                                                                  |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                                                              | `plugins.entries.voice-call.config.streaming.provider`                                                                  |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold`                   | `plugins.entries.voice-call.config.streaming.providers.openai.*`                                                                  |
    | `models.providers.*.api: "openai"`                                                                              | `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` ein zukünftiger/unbekannter Enum-Wert ist, statt mit geschlossener Fehlerbehandlung abzubrechen) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                                              | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                                                                  |
    | `browser.profiles.*.driver: "extension"`                                                                              | `"existing-session"`                                                                  |
    | `browser.relayBindHost`                                                                              | entfernt (veraltete Relay-Einstellung der Chrome-Erweiterung)                       |
    | `mcp.servers.*.type` (CLI-native Aliasse)                                                        | `mcp.servers.*.transport`                                                                  |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                                                              | entfernt (der Codex-App-Server belässt Codex-native Workspace-Tools stets nativ)    |
    | `commands.modelsWrite`                                                                              | entfernt (`/models add` ist veraltet)                                         |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                                                         | entfernt (der exakte Wert `NO_REPLY` wird nicht mehr in sichtbaren Fallback-Text umgeschrieben) |
    | `agents.defaults/list[].systemPromptOverride`                                                                              | entfernt (OpenClaw verwaltet den generierten System-Prompt)                         |
    | `agents.defaults/list[].embeddedPi`                                                                              | `embeddedAgent`                                                                  |
    | `agents.defaults/list[].sandbox.perSession`                                                                              | `sandbox.scope`                                                                  |
    | `agents.defaults.llm`                                                                              | entfernt (verwenden Sie `models.providers.<id>.timeoutSeconds` für Zeitüberschreitungen langsamer Modelle/Provider; der Wert bleibt unterhalb der Zeitüberschreitungsgrenze für Agent/Ausführung) |
    | `memorySearch` auf oberster Ebene                                                          | `agents.defaults.memorySearch`                                                                  |
    | `memorySearch.provider: "auto"`                                                                              | `"openai"`                                                                  |
    | `memorySearch.store.path` (auf beliebiger Ebene)                                                      | entfernt (Speicherindizes befinden sich in der jeweiligen Agent-Datenbank)          |
    | `heartbeat` auf oberster Ebene                                                          | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                                            |
    | Richtlinien-IDs von `plugins.openai-codex`                                                         | `plugins.openai`                                                                  |
    | `tools.web.x_search.apiKey`                                                                              | `plugins.entries.xai.config.webSearch.apiKey`                                                                  |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                                         | entfernt (veraltet)                                                                 |
    | `diagnostics.memoryPressureBundle`                                                                              | `diagnostics.memoryPressureSnapshot`                                                                  |

    <Note>
      Die obigen `plugins.entries.voice-call.config.*`-Zeilen werden bei jedem Laden der Konfiguration vom
      Voice-Call-Plugin selbst normalisiert, nicht von `openclaw
      doctor`. Das Plugin protokolliert außerdem eine Startwarnung mit Verweis auf `openclaw
      doctor --fix`, aber Doctor schreibt
      `openclaw.json` für diese Schlüssel derzeit nicht neu; die eigene Normalisierung des Plugins
      wendet die Änderung zur Laufzeit an.
    </Note>

    Anleitung für Kontostandardwerte bei Kanälen mit mehreren Konten:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass das Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `openclaw/plugin-sdk/llm`. Dadurch können Modelle gezwungen werden, die falsche API zu verwenden, oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie die Überschreibung entfernen und das API-Routing sowie die Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browsermigration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle hostlokale Anbindungsmodell von Chrome MCP (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` entfernt).

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft bei standardmäßigen Profilen mit automatischer Verbindung, ob Google Chrome auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie älter als Chrome 144 ist
    - erinnert Sie daran, Remote-Debugging auf der Inspektionsseite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin einen lokal ausgeführten Chromium-basierten Browser ab Version 144 auf dem Gateway-/Node-Host, bei dem Remote-Debugging aktiviert und die erste Zustimmungsaufforderung zur Anbindung im Browser bestätigt wurde.

    Die Bereitschaftsprüfung deckt hier nur die Voraussetzungen für die lokale Anbindung ab. Existing-session unterliegt weiterhin den aktuellen Routenbeschränkungen von Chrome MCP; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfang und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil. Diese Prüfung gilt nicht für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe, die weiterhin Raw CDP verwenden.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ein abgelaufenes Zertifikat oder ein selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Anweisungen zur Behebung aus. Unter macOS mit einer Homebrew-Version von Node lautet die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn das Gateway fehlerfrei funktioniert.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad verdecken. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth vorhanden sind, damit Sie die veraltete Transportüberschreibung entfernen oder neu schreiben und das aktuelle Routingverhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus; diese selbst definierten Anforderungsrouten kommen jedoch nicht für eine implizite Codex-Auswahl infrage.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Das native Routing des Codex-Harness verwendet kanonische `openai/*`-Modellreferenzen, aber das Präfix allein wählt Codex niemals aus. Wenn die Laufzeitrichtlinie nicht festgelegt oder auf `auto` gesetzt ist, kommt nur eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne selbst definierte Anforderungsüberschreibung infrage. Siehe [Implizite OpenAI-Agentenlaufzeit](/de/providers/openai#implicit-agent-runtime).

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Referenzen für den Standardagenten und einzelne Agenten um, einschließlich primärer Modelle, Fallbacks, Modelle zur Bild-/Videogenerierung, Heartbeat-/Subagenten-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen und veraltetem persistentem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die Codex-Absicht wird für reparierte Agentenmodellreferenzen in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge verschoben.
    - Veraltete Laufzeitkonfigurationen für den gesamten Agenten und persistente Laufzeitfixierungen von Sitzungen werden entfernt, da die Laufzeitauswahl Provider-/modellbezogen erfolgt.
    - Bestehende Provider-/Modell-Laufzeitrichtlinien bleiben erhalten, sofern die reparierte veraltete Modellreferenz kein Codex-Routing benötigt, um den alten Authentifizierungspfad beizubehalten.
    - Bestehende Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Einstellungen pro Modell werden vom veralteten Schlüssel zum kanonischen Schlüssel `openai/*` verschoben.
    - Persistente Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Authentifizierungsprofil-Fixierungen werden in allen erkannten Agentensitzungsspeichern repariert.
    - Doctor repariert separat veraltete `agentRuntime.id: "codex-cli"`-Fixierungen (eine eigenständige veraltete Laufzeit-ID) zu `"codex"` in den Modelleinträgen `agents.defaults`, `agents.list[]` und `models.providers.*`.
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder anbinden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Bereinigung von Sitzungsrouten">
    Doctor durchsucht außerdem erkannte Agentensitzungsspeicher nach veraltetem, automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder die Laufzeit von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modellfixierungen, Laufzeitmodell-Metadaten, fixierte Harness-IDs, CLI-Sitzungsbindungen und automatische Authentifizierungsprofil-Überschreibungen löschen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Modellentscheidungen des Benutzers oder veraltete Sitzungsmodellentscheidungen werden zur manuellen Prüfung gemeldet und nicht verändert; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr vorgesehen ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Datenträgerlayout)">
    Doctor kann ältere Datenträgerlayouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher und Transkripte: von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agentenverzeichnis: von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungsstatus (Baileys): vom veralteten `~/.openclaw/credentials/*.json` (außer `oauth.json`) nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen werden nach bestem Bemühen ausgeführt und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Sicherungen zurückbleiben. Das Gateway/die CLI migriert außerdem beim Start automatisch die veralteten Sitzungen und das Agentenverzeichnis, sodass Verlauf, Authentifizierung und Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad abgelegt werden. Die WhatsApp-Authentifizierung wird absichtlich ausschließlich über `openclaw doctor` migriert. Bei der Normalisierung von Talk-Providern/Provider-Zuordnungen erfolgt der Vergleich anhand struktureller Gleichheit, sodass Unterschiede, die nur die Schlüsselreihenfolge betreffen, keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn solche Schlüssel gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent; wenn `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Auftragsspeicher (standardmäßig `~/.openclaw/cron/jobs.json` oder bei einer Überschreibung `cron.store`) auf alte Auftragsstrukturen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Zustellungsaliase für Payload `provider` → explizites `delivery.channel`
    - veraltete `notify: true`-Webhook-Fallback-Aufträge → explizite Webhook-Zustellung aus `cron.webhook`, wenn festgelegt; Ankündigungsaufträge behalten ihre Chat-Zustellung und erhalten `delivery.completionDestination`. Wenn `cron.webhook` nicht festgelegt ist, wird die wirkungslose Markierung `notify` auf oberster Ebene bei Aufträgen ohne Ziel entfernt (die bestehende Zustellung, einschließlich Ankündigungen, bleibt erhalten), da die Laufzeitzustellung sie niemals ausliest.

    Das Gateway bereinigt außerdem fehlerhafte Cron-Zeilen beim Laden, damit gültige Aufträge weiter ausgeführt werden. Unverarbeitete fehlerhafte Zeilen werden vor ihrer Entfernung aus `jobs.json` in `jobs-quarantine.json` neben dem aktiven Speicher kopiert; Doctor meldet unter Quarantäne gestellte Zeilen, damit Sie diese manuell prüfen oder reparieren können.

    Beim Start normalisiert das Gateway die Laufzeitprojektion und ignoriert die Markierung `notify` auf oberster Ebene, belässt die persistente Cron-Konfiguration jedoch zur Reparatur durch Doctor. Wenn `cron.webhook` nicht festgelegt ist, entfernt Doctor die wirkungslose Markierung bei Aufträgen ohne Migrationsziel (`delivery.mode` auf „none“ gesetzt oder nicht vorhanden, ein unbrauchbares Webhook-Ziel oder eine bestehende Ankündigungs-/Chat-Zustellung), ohne die bestehende Zustellung zu verändern, sodass wiederholte `doctor --fix`-Läufe nicht mehr vor demselben Auftrag warnen. Wenn `cron.webhook` festgelegt, aber keine gültige HTTP(S)-URL ist, warnt Doctor weiterhin und belässt die Markierung, damit Sie die URL korrigieren können.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird vom aktuellen OpenClaw nicht gepflegt und kann falsche `Gateway inactive`-Meldungen in `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Funktionsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agentensitzungsverzeichnis nach veralteten Schreibsperrdateien, die nach einer abnormal beendeten Sitzung zurückgeblieben sind. Für jede gefundene Sperrdatei meldet Doctor den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID, fehlerhafte Eigentümermetadaten, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Prozess gehört, der nicht OpenClaw ist). Im Modus `--fix` / `--repair` entfernt Doctor Sperren mit toten, verwaisten, wiederverwendeten, alten fehlerhaften oder nicht zu OpenClaw gehörenden Eigentümern automatisch. Alte Sperren, die noch einem aktiven OpenClaw-Prozess gehören, werden gemeldet, bleiben jedoch bestehen, damit Doctor keinen aktiven Transkriptschreiber unterbricht.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Branches">
    Doctor durchsucht JSONL-Dateien von Agentensitzungen nach der duplizierten Branch-Struktur, die durch den Fehler bei der Umschreibung von Prompt-Transkripten in Version 2026.4.24 entstanden ist: eine verworfene Benutzereingabe mit internem OpenClaw-Laufzeitkontext sowie ein aktiver gleichgeordneter Eintrag mit derselben sichtbaren Benutzereingabe. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlaufs- und Speicherleser keine doppelten Eingaben mehr sehen.
  </Accordion>
  <Accordion title="4. Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfiguration, sofern Sie nicht andernorts über Sicherungen verfügen.

    Doctor prüft:

    - **Fehlendes Zustandsverzeichnis**: warnt vor katastrophalem Verlust des Zustands, fordert zur Neuerstellung des Verzeichnisses auf und weist darauf hin, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: überprüft die Schreibberechtigung; bietet an, die Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
    - **Mit der macOS-Cloud synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierungsbasierte Pfade langsamere E/A sowie Sperr-/Synchronisierungswettläufe verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-Einhängequelle aufgelöst wird, da zufällige E/A auf SD-/eMMC-Medien langsamer sein und diese bei Schreibvorgängen für Sitzungen und Anmeldedaten schneller verschleißen können.
    - **Flüchtiges Linux-Zustandsverzeichnis**: warnt, wenn der Zustand auf `tmpfs` oder `ramfs` aufgelöst wird, da Sitzungen, Anmeldedaten, Konfiguration und SQLite-Zustand (mit WAL-/Journal-Begleitdateien) beim Neustart verschwinden. Docker-`overlay`-Einhängungen werden absichtlich nicht gekennzeichnet, da ihre beschreibbaren Schichten Neustarts des Hosts überdauern, solange der Container bestehen bleibt.
    - **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Verzeichnis des Sitzungsspeichers sind erforderlich, um den Verlauf dauerhaft zu speichern und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn bei kürzlich erstellten Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „einzeiliges JSONL“**: kennzeichnet, wenn das Haupttranskript nur eine Zeile enthält (der Verlauf wird nicht fortgeschrieben).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner in verschiedenen Home-Verzeichnissen vorhanden sind oder `OPENCLAW_STATE_DIR` auf einen anderen Ort verweist (der Verlauf kann auf mehrere Installationen verteilt werden).
    - **Erinnerung an den Remote-Modus**: Falls `gateway.mode=remote`, erinnert Doctor daran, ihn auf dem Remote-Host auszuführen (dort befindet sich der Zustand).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/alle lesbar ist, und bietet an, die Berechtigungen auf `600` zu beschränken.

  </Accordion>
  <Accordion title="5. Integrität der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Authentifizierungsspeicher, warnt bei bald ablaufenden oder abgelaufenen Tokens und kann sie aktualisieren, wenn dies sicher möglich ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (beispielsweise `refresh_token_reused`, `invalid_grant` oder wenn ein Provider zur erneuten Anmeldung auffordert), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakt auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die aufgrund kurzer Abklingzeiten (Ratenbegrenzungen/Zeitüberschreitungen/Authentifizierungsfehler) oder längerer Deaktivierungen (Abrechnungs-/Guthabenfehler) vorübergehend nicht verwendbar sind.

    Veraltete Codex-OAuth-Profile, deren Tokens im macOS-Schlüsselbund gespeichert sind (älteres Onboarding vor dem dateibasierten Begleitdatei-Layout), werden ausschließlich durch Doctor repariert. Führen Sie `openclaw doctor --fix` einmal in einem interaktiven Terminal aus, um schlüsselbundbasierte veraltete Tokens direkt nach `auth-profiles.json` zu migrieren; danach lösen eingebettete Ausführungen (Telegram, Cron, Sub-Agent-Dispatch) sie als kanonische OpenAI-OAuth-Profile auf.

  </Accordion>
  <Accordion title="6. Modellvalidierung für Hooks">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz anhand des Katalogs und der Zulassungsliste und warnt, wenn sie nicht aufgelöst werden kann oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, überprüft Doctor Docker-Images und bietet an, sie zu erstellen oder zu veralteten Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im `openclaw doctor --fix`- / `openclaw doctor --repair`-Modus den von OpenClaw generierten veralteten Bereitstellungszustand für Plugin-Abhängigkeiten: veraltete generierte Abhängigkeitswurzeln, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest verdecken können. Doctor verknüpft außerdem das Host-Paket `openclaw` erneut mit verwalteten npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Aktualisierungen oder npm-Reparaturen weiterhin aufgelöst werden.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registrierung sie jedoch nicht finden kann (materielles `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen, konfigurierte Agent-Laufzeitumgebungen). Während Paketaktualisierungen vermeidet Doctor die Neuinstallation von Plugin-Paketen, während das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Außerhalb der nachfolgend beschriebenen Ausnahme für den Start des Container-Images führen der Gateway-Start und das Neuladen der Konfiguration keine Paketreparatur aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsaufgaben.

    Der Start eines containerisierten Gateways verfügt über eine eng begrenzte Upgrade-Ausnahme: Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet, führt es vor der Bereitschaft sichere Zustandsmigrationen und die vorhandene Plugin-Konvergenz nach der Kernaktualisierung aus und zeichnet anschließend einen versionsbezogenen Prüfpunkt auf. Dieser Startdurchlauf kann veraltete Datensätze gebündelter Plugins bereinigen, lokale Plugin-Verknüpfungen reparieren, konfigurierte Plugin-Pakete neu installieren, wenn der Konvergenzpfad dies erfordert, und aktive Plugin-Nutzlasten überprüfen. Wenn der Start keine sichere Reparatur durchführen kann, führen Sie dasselbe Image einmal mit `openclaw doctor --fix` für denselben eingebundenen Zustand und dieselbe eingebundene Konfiguration aus, bevor Sie den Container normal neu starten.

  </Accordion>
  <Accordion title="8. Migrationen des Gateway-Dienstes und Bereinigungshinweise">
    Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst unter Verwendung des aktuellen Gateway-Ports zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Nach Profilen benannte OpenClaw-Gateway-Dienste gelten als vollwertige Dienste und werden nicht als „zusätzlich“ gekennzeichnet.

    Wenn unter Linux der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene vorhanden ist, installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep` und entfernen Sie anschließend das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Matrix-Migration beim Start">
    Wenn für ein Matrix-Kanalkonto eine ausstehende oder erforderliche Migration eines veralteten Zustands vorliegt, erstellt Doctor (im `--fix`- / `--repair`-Modus) einen Snapshot vor der Migration und führt anschließend die bestmöglichen Migrationsschritte aus: die Migration des veralteten Matrix-Zustands und die Vorbereitung des veralteten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsabweichungen">
    Doctor untersucht den Zustand der Gerätekopplung im Rahmen der regulären Integritätsprüfung und meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen- oder Bereichserweiterungen für bereits gekoppelte Geräte
    - Reparaturen bei Abweichungen öffentlicher Schlüssel, wenn die Geräte-ID weiterhin übereinstimmt, die Geräteidentität jedoch nicht mehr dem genehmigten Datensatz entspricht
    - gekoppelte Datensätze ohne aktives Token für eine genehmigte Rolle
    - gekoppelte Tokens, deren Bereiche von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Geräte-Token-Einträge für den aktuellen Computer, die älter als eine Gateway-seitige Token-Rotation sind oder veraltete Bereichsmetadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Er gibt die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein neues Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch wird zwischen erstmaliger Kopplung, ausstehenden Rollen-/Bereichserweiterungen und Abweichungen bei veralteten Tokens/Geräteidentitäten unterschieden und die häufige Lücke geschlossen, bei der ein Gerät „bereits gekoppelt ist, aber weiterhin eine Kopplung erforderlich ist“.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt nur dann einen Sicherheitshinweis aus, wenn eine Warnung gefunden wird, beispielsweise ein für Direktnachrichten ohne Zulassungsliste offener Provider oder eine gefährlich konfigurierte Richtlinie. Verwenden Sie `openclaw security audit` für die vollständige Sicherheitsübersicht.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Bei Ausführung als systemd-Benutzerdienst stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach der Abmeldung weiter ausgeführt wird.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und TaskFlows)">
    Doctor gibt Probleme und Maßnahmen für den Standard-Agenten aus, nicht eine Bestandsaufnahme des fehlerfreien Zustands:

    - **Skills**: listet zulässige, aber nicht verwendbare Namen von Skills auf; verwenden Sie `openclaw skills check` für Details zu den Anforderungen und vollständige Anzahlen.
    - **Plugins**: meldet nur fehlerhafte Plugin-IDs; verwenden Sie `openclaw plugins list` für die Bestandsaufnahme geladener, importierter und deaktivierter Plugins sowie gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: kennzeichnet Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeitumgebung aufweisen.
    - **Plugin-Diagnose**: zeigt alle beim Laden von der Plugin-Registrierung ausgegebenen Warnungen oder Fehler an.
    - **TaskFlow-Wiederherstellung**: zeigt verdächtige verwaltete TaskFlows an, die manuell geprüft oder abgebrochen werden müssen.
    - **Claude CLI**: meldet nur Probleme mit Binärdatei, Authentifizierung, Profil, Workspace oder Projektverzeichnis; Details erfolgreicher Prüfungen werden ausgelassen.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Dateien">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (beispielsweise `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder es überschreiten. Er meldet pro Datei die unverarbeitete gegenüber der injizierten Zeichenanzahl, den Kürzungsprozentsatz, die Kürzungsursache (`max/file` oder `max/total`) und die Gesamtzahl injizierter Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Grenzwert liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster (`source <(openclaw completion ...)`) verwendet, aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei jedoch fehlt, erzeugt Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es außerdem die verwaiste kanalbezogene Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Überschreibungen. Dies verhindert Gateway-Startschleifen, bei denen die Kanallaufzeitumgebung nicht mehr vorhanden ist, die Konfiguration das Gateway jedoch weiterhin zur Bindung an sie auffordert.
  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` von SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn keine Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-berücksichtigende Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten untersuchen, ohne das Fail-Fast-Verhalten der Laufzeitumgebung abzuschwächen.

    - `openclaw doctor --fix` verwendet für gezielte Konfigurationsreparaturen dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Statusfamilie.
    - Beispiel: Bei der Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` wird versucht, konfigurierte Bot-Anmeldedaten zu verwenden, sofern verfügbar.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung und Neustart">
    Doctor führt eine Zustandsprüfung durch und bietet einen Neustart des Gateways an, wenn dieser fehlerhaft zu sein scheint.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die Binärdatei `qmd` verfügbar und startfähig ist. Andernfalls werden Hinweise zur Fehlerbehebung ausgegeben, einschließlich `npm install -g @tobilu/qmd` (oder der entsprechenden Bun-Variante) sowie einer Option für einen manuellen Binärdateipfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote- bzw. herunterladbare Modell-URL. Fehlt diese, wird der Wechsel zu einem Remote-Provider empfohlen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Überprüft, ob in der Umgebung oder im Authentifizierungsspeicher ein API-Schlüssel vorhanden ist. Fehlt dieser, werden konkrete Hinweise zur Fehlerbehebung ausgegeben.
    - **Veralteter automatischer Provider**: Behandelt `memorySearch.provider: "auto"` als OpenAI, prüft die Bereitschaft von OpenAI und `doctor --fix` schreibt ihn in `provider: "openai"` um.

    Wenn ein zwischengespeichertes Ergebnis der Gateway-Prüfung verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht doctor dessen Ergebnis mit der in der CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping. Verwenden Sie den detaillierten Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Warnungen zum Kanalstatus">
    Wenn der Gateway fehlerfrei ist, führt doctor eine Kanalstatusprüfung durch und meldet Warnungen mit empfohlenen Korrekturen.
  </Accordion>
  <Accordion title="15. Prüfung und Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (beispielsweise systemd-Abhängigkeiten von network-online und die Neustartverzögerung). Wird eine Abweichung gefunden, empfiehlt doctor eine Aktualisierung und kann die Dienstdatei bzw. Aufgabe entsprechend den aktuellen Standardwerten neu schreiben.

    Hinweise:

    - `openclaw doctor` fordert vor dem Neuschreiben der Supervisor-Konfiguration zur Bestätigung auf.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturabfragen.
    - `openclaw doctor --fix` wendet empfohlene Korrekturen ohne Rückfragen an (`--repair` ist ein Alias).
    - `openclaw doctor --fix --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` lässt doctor bezüglich des Lebenszyklus des Gateway-Dienstes schreibgeschützt. Der Dienstzustand wird weiterhin gemeldet und Reparaturen außerhalb des Dienstes werden ausgeführt, aber Installation, Start, Neustart und Bootstrap des Dienstes, das Neuschreiben der Supervisor-Konfiguration sowie die Bereinigung veralteter Dienste werden übersprungen, da ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt doctor die Befehls- bzw. Einstiegspunkt-Metadaten nicht neu, solange die zugehörige systemd-Gateway-Unit aktiv ist. Bei der Suche nach doppelten Diensten werden außerdem inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units ignoriert, damit begleitende Dienstdateien keine unnötigen Bereinigungshinweise verursachen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Installation bzw. Reparatur des Dienstes durch doctor die SecretRef, speichert aber keine aufgelösten Token-Klartextwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`- bzw. SecretRef-gestützte Dienstumgebungswerte, die von älteren LaunchAgent-, systemd- oder Windows-Aufgabenplanungsinstallationen inline eingebettet wurden, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` fest vorgibt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, blockiert doctor den Installations- bzw. Reparaturpfad und gibt konkrete Hinweise zur Behebung aus.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, blockiert doctor die Installation bzw. Reparatur, bis der Modus ausdrücklich festgelegt wurde.
    - Bei benutzerspezifischen systemd-Units unter Linux beziehen die Prüfungen von doctor auf Token-Abweichungen beim Vergleich der Dienst-Authentifizierungsmetadaten sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen ein.
    - Dienstreparaturen durch doctor verweigern das Neuschreiben, Stoppen oder Neustarten eines Gateway-Dienstes durch eine ältere OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Fehlerbehebung für den Gateway](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Über `openclaw gateway install --force` können Sie jederzeit ein vollständiges Neuschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit- und Portdiagnose">
    Doctor untersucht die Dienstlaufzeit (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber tatsächlich nicht ausgeführt wird. Außerdem wird auf Portkonflikte am Gateway-Port (Standard: `18789`) geprüft, und wahrscheinliche Ursachen werden gemeldet (Gateway wird bereits ausgeführt, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst unter Bun oder über einen von einem Versionsmanager verwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) ausgeführt wird. Bun kann den `node:sqlite`-Zustandsspeicher von OpenClaw nicht öffnen, daher migrieren Reparaturen veraltete Bun-Dienste zu Node. Pfade von Versionsmanagern können nach Upgrades ungültig werden, da der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet die Migration zu einer systemweiten Node-Installation an, sofern eine solche verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), anstatt den PATH der interaktiven Shell zu kopieren. Dadurch bleiben von Homebrew verwaltete Systembinärdateien verfügbar, während Verzeichnisse von Volta, asdf, fnm, pnpm und anderen Versionsmanagern nicht verändern, welche Node-Kindprozesse aufgelöst werden. Linux-Dienste behalten weiterhin explizite Umgebungsstammverzeichnisse (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile benutzerspezifische Binärverzeichnisse bei; vermutete Fallback-Verzeichnisse von Versionsmanagern werden jedoch nur in den Dienst-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger vorhanden sind.

  </Accordion>
  <Accordion title="18. Schreiben der Konfiguration und Assistentenmetadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht die Assistentenmetadaten mit einem Vermerk zur Ausführung von doctor.
  </Accordion>
  <Accordion title="19. Tipps zum Arbeitsbereich (Sicherung und Speichersystem)">
    Doctor empfiehlt ein Speichersystem für den Arbeitsbereich, wenn keines vorhanden ist, und gibt einen Sicherungshinweis aus, falls der Arbeitsbereich noch nicht mit git verwaltet wird.

    Eine vollständige Anleitung zur Struktur des Arbeitsbereichs und zur Sicherung mit git (empfohlen wird ein privates GitHub- oder GitLab-Repository) finden Sie unter [/concepts/agent-workspace](/de/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Fehlerbehebung für den Gateway](/de/gateway/troubleshooting)
