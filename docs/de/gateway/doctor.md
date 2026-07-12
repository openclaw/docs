---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung inkompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T15:22:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es korrigiert veraltete Konfigurationen und Zustände, prüft den Systemzustand und stellt umsetzbare Reparaturschritte bereit.

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

    Standardeinstellungen ohne Rückfragen akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, sofern zutreffend).

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

    Strukturierte Systemzustandsprüfungen für CI- oder Preflight-Automatisierung ausführen. Schreibgeschützt: keine
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
    Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die eine
    menschliche Bestätigung erfordern. Veraltete Zustandsmigrationen werden bei Erkennung weiterhin automatisch ausgeführt.

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
`openclaw doctor --fix`. Beide verwenden dieselbe Doctor-Regelregistrierung, wählen
und verarbeiten Regeln jedoch unterschiedlich:

| Modus                    | Rückfragen | Schreibt Konfiguration/Zustand | Ausgabe                          | Verwendungszweck                    |
| ------------------------ | ---------- | ------------------------------ | -------------------------------- | ----------------------------------- |
| `openclaw doctor`        | ja         | nein                           | verständlicher Zustandsbericht  | manuelle Statusprüfung              |
| `openclaw doctor --fix`  | manchmal   | ja, gemäß Reparaturrichtlinie  | verständliches Reparaturprotokoll | Anwenden genehmigter Reparaturen    |
| `openclaw doctor --lint` | nein       | nein                           | strukturierte Befunde            | CI-, Preflight- und Prüf-Gates      |

Standardmäßig führt `doctor --lint` das umfassende sichere Automatisierungsprofil aus: Prüfungen, die
statisch, lokal und für CI- oder Preflight-Ausgaben nützlich sind. Opt-in-Prüfungen werden übersprungen, wenn sie
nur Hinweise liefern, umgebungsabhängig sind, von aktiven Diensten abhängen, Konto-/Workspace-
Bestände erfassen oder historische Bereinigungen durchführen. Verwenden Sie `doctor --lint --all`, wenn Sie die
vollständige registrierte Lint-Prüfung einschließlich dieser Opt-in-Prüfungen wünschen, oder `--only <id>` für
eine gezielte Prüfung.

`doctor --fix` verwendet nicht das Standardprofil von Lint und akzeptiert
`--all` nicht. Es führt den geordneten Reparaturpfad von Doctor aus: Moderne Systemzustandsprüfungen können
optional eine `repair()`-Implementierung bereitstellen, während ältere Bereiche weiterhin ihren bisherigen
Doctor-Reparaturablauf verwenden. Einige Lint-Befunde sind absichtlich rein diagnostisch; daher
bedeutet das Erscheinen einer Prüfung unter `--lint --all` nicht, dass `--fix` diesen Bereich verändert.
Der Vertrag trennt `detect()` (meldet Befunde) von `repair()` (meldet
Änderungen/Diffs/Nebenwirkungen). Dadurch bleibt ein Pfad für ein zukünftiges
`doctor --fix --dry-run` offen, ohne Lint-Prüfungen in Mutationsplaner umzuwandeln.

Einige integrierte Prüfungen sind intern standardmäßig deaktiviert, damit sie für
`--all`, `--only` und Doctor-Reparaturabläufe verfügbar bleiben, ohne Teil des standardmäßigen
Automatisierungsprofils von `doctor --lint` zu werden. Der Schweregrad wird weiterhin pro
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

- `ok`: ob ein Befund den ausgewählten Schweregrad-Schwellenwert erreicht hat
- `checksRun` / `checksSkipped`: Anzahlen (durch Profil, `--only` oder `--skip` übersprungen)
- `findings`: strukturierte Diagnosen mit `checkId`, `severity`, `message` und optional `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Exit-Codes:

| Code | Bedeutung                                                               |
| ---- | ----------------------------------------------------------------------- |
| `0`  | keine Befunde auf oder über dem ausgewählten Schwellenwert               |
| `1`  | mindestens ein Befund hat den ausgewählten Schwellenwert erreicht        |
| `2`  | Befehls-/Laufzeitfehler, bevor Befunde ausgegeben werden konnten          |

Flags:

- `--severity-min info|warning|error` (Standard: `warning`): steuert sowohl die Ausgabe als auch, was einen Exit-Code ungleich null verursacht.
- `--all`: führt jede registrierte Lint-Prüfung aus, einschließlich Opt-in-Prüfungen, die aus der Standardautomatisierung ausgeschlossen sind.
- `--only <id>` (wiederholbar): führt nur die Prüfungen mit den angegebenen IDs aus; eine unbekannte ID wird als Fehlerbefund gemeldet.
- `--skip <id>` (wiederholbar): schließt eine Prüfung aus, während der Rest des Durchlaufs aktiv bleibt.
- `--json`, `--severity-min`, `--all`, `--only` und `--skip` erfordern `--lint`; einfache Ausführungen von `openclaw doctor` und `--fix` lehnen sie ab.

## Funktionsübersicht

<AccordionGroup>
  <Accordion title="Systemzustand, Benutzeroberfläche und Aktualisierungen">
    - Optionale Preflight-Aktualisierung für Git-Installationen (nur interaktiv).
    - Aktualitätsprüfung des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Systemzustandsprüfung + Aufforderung zum Neustart.
    - Skills-Statusübersicht (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für veraltete Werteformen.
    - Migration der Talk-Konfiguration von veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für veraltete Chrome-Erweiterungskonfigurationen und die Bereitschaft von Chrome MCP.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migration veralteter OpenAI-Codex-Provider/-Profile (`openai-codex` → `openai`) und Warnungen vor Überschattung durch veraltete `models.providers.openai-codex`.
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zu Plugin-/Tool-Zulassungslisten, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie jedoch weiterhin Platzhalter oder Plugin-eigene Tools anfordert.
    - Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
    - Migration veralteter Vertragsschlüssel im Plugin-Manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des veralteten Cron-Speichers (`jobId`, `schedule.cron`, Zustellungs-/Nutzlastfelder auf oberster Ebene, Nutzlast-`provider`, Webhook-Fallback-Aufträge mit `notify: true`).
    - Reparatur der Laufzeitfixierung für die Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) in `agents.defaults`, `agents.list[]` und `models.providers.*` (einschließlich modellspezifischer Einträge).
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; bei `plugins.enabled=false` bleiben veraltete Plugin-Referenzen als inaktive Isolationskonfiguration erhalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungsprotokollen mit duplizierten Prompt-Umschreibungszweigen, die von betroffenen Builds der Version 2026.4.24 erstellt wurden.
    - Erkennung blockierter Tombstones zur Neustartwiederherstellung von Subagenten, mit `--fix`-Unterstützung zum Löschen veralteter Abbruch-Flags für die Wiederherstellung, damit der Start das untergeordnete Element nicht weiterhin als durch einen Neustart abgebrochen behandelt.
    - Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Protokolle, Zustandsverzeichnis).
    - Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Systemzustand der Modellauthentifizierung: prüft den Ablauf von OAuth, kann bald ablaufende Tokens aktualisieren und meldet Abklingzeit-/Deaktivierungszustände von Authentifizierungsprofilen.

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
    - Migration des veralteten Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; beispielsweise werden die Berechtigungen von Discord-Sprachkanälen mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - Prüfungen der WhatsApp-Reaktionsfähigkeit bei beeinträchtigtem Zustand der Gateway-Ereignisschleife und weiterhin ausgeführten lokalen TUI-Clients; `--fix` beendet nur verifizierte lokale TUI-Clients.
    - Reparatur von Codex-Routen für veraltete `openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Modellen zur Bild-/Videogenerierung, Heartbeat-/Subagenten-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsrouten-Fixierungen; `--fix` schreibt sie in `openai/*` um, migriert `openai-codex:*`-Authentifizierungsprofile/-Reihenfolgen zu `openai:*`, entfernt veraltete Laufzeitfixierungen für Sitzungen/gesamte Agenten und lässt die reparierte effektive Route bestimmen, ob Codex kompatibel ist.
    - Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während der Installation oder Aktualisierung Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` übernommen haben.
    - Best-Practice-Prüfungen der Gateway-Laufzeit (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard: `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet die Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Bereichsaktualisierungen, Abweichungen im veralteten lokalen Geräte-Token-Cache und Authentifizierungsabweichungen in gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - Prüfung von systemd-Linger unter Linux.
    - Prüfung der Größe der Workspace-Bootstrap-Datei (Warnungen vor Kürzung/nahem Grenzwert für Kontextdateien).
    - Bereitschaftsprüfung der Skills für den Standardagenten; meldet zulässige Skills mit fehlenden Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen der Quellinstallation (Abweichung im pnpm-Workspace, fehlende UI-Assets, fehlende tsx-Binärdatei).
    - Schreibt aktualisierte Konfiguration + Assistentenmetadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Auffüllung und Zurücksetzung

Die Dreams-Szene der Control UI enthält die Aktionen **Auffüllen**, **Zurücksetzen** und **Verankerte Einträge löschen** für den verankerten Dreaming-Workflow. Diese verwenden Doctor-ähnliche RPC-Methoden des Gateways, sind jedoch **nicht** Teil der Reparatur/Migration der CLI `openclaw doctor`.

| Aktion                      | Funktionsweise                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auffüllen                   | Durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den verankerten REM-Tagebuchdurchlauf aus und schreibt umkehrbare Auffülleinträge in `DREAMS.md`.                                                   |
| Zurücksetzen                | Entfernt nur die markierten aufgefüllten Tagebucheinträge aus `DREAMS.md`.                                                                                                                                                            |
| Verankerte Einträge löschen | Entfernt nur bereitgestellte, ausschließlich verankerte Kurzzeiteinträge aus der historischen Wiedergabe, für die noch kein aktiver Abruf und keine tägliche Unterstützung gesammelt wurde.                                           |

  Keine dieser Aktionen bearbeitet eigenständig `MEMORY.md`, führt vollständige Doctor-Migrationen aus oder stellt fundierte Kandidaten in den aktiven Speicher für kurzfristige Promotion ein. Um die fundierte historische Wiedergabe in den normalen Ablauf für tiefgehende Promotion einzuspeisen, verwenden Sie stattdessen den CLI-Ablauf:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Dadurch werden fundierte dauerhafte Kandidaten in den kurzfristigen Dreaming-Speicher eingestellt, während `DREAMS.md` die Prüfoberfläche bleibt.

  ## Detailliertes Verhalten und Begründung

  <AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn es sich um einen Git-Checkout handelt und Doctor interaktiv ausgeführt wird, bietet er vor seiner Ausführung ein Update (Abrufen/Rebase/Build) an.
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Doctor normalisiert veraltete Wertstrukturen in das aktuelle Schema. Die aktuelle Talk-Sprachkonfiguration lautet `talk.provider` + `talk.providers.<provider>`, wobei sich die Echtzeit-Sprachkonfiguration unter `talk.realtime.*` befindet. Doctor überführt alte Strukturen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Zuordnung und verschiebt veraltete Echtzeit-Selektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) nach `talk.realtime`.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools aus Plugins überein, die tatsächlich geladen werden; es umgeht nicht die exklusive Plugin-Zulassungsliste.

  </Accordion>
  <Accordion title="2. Migrationen veralteter Konfigurationsschlüssel">
    Wenn die Konfiguration einen veralteten Schlüssel mit einer aktiven Migration enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen. Doctor erläutert, welche veralteten Schlüssel gefunden wurden, zeigt die angewendete Migration an und schreibt `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu. Der Gateway-Start verweigert veraltete Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; beim Start wird `openclaw.json` nicht neu geschrieben. Migrationen des Cron-Auftragsspeichers werden ebenfalls von `openclaw doctor --fix` durchgeführt.

    <Note>
      Doctor stellt automatische Migrationen nur für ungefähr zwei Monate nach der
      Außerbetriebnahme eines Schlüssels bereit. Für ältere veraltete Schlüssel (beispielsweise die ursprünglichen
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` auf oberster Ebene oder `identity`
      auf oberster Ebene aus der Konfigurationsstruktur vor der Unterstützung mehrerer Agenten) gibt es keinen Migrationspfad mehr;
      Konfigurationen, die sie verwenden, schlagen nun bei der Validierung fehl, anstatt neu geschrieben zu werden. Korrigieren Sie
      diese Schlüssel anhand der aktuellen Konfigurationsreferenz manuell, bevor Doctor
      fortfahren kann.
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
    | veraltete Echtzeit-Talk-Selektoren auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS-Sprecherfelder `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (alle Kanäle außer Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (alle Kanäle einschließlich Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` einen zukünftigen/unbekannten Enumerationswert hat, anstatt bei geschlossener Fehlerbehandlung fehlzuschlagen) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | entfernt (veraltete Relay-Einstellung der Chrome-Erweiterung)                             |
    | `mcp.servers.*.type` (CLI-native Aliasse)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | entfernt (der Codex-App-Server belässt Codex-native Workspace-Tools immer als native Tools) |
    | `commands.modelsWrite`                                                                           | entfernt (`/models add` ist veraltet)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | entfernt (das exakte `NO_REPLY` wird nicht mehr in sichtbaren Fallback-Text umgeschrieben)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | entfernt (OpenClaw verwaltet den generierten System-Prompt)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | entfernt (verwenden Sie `models.providers.<id>.timeoutSeconds` für Zeitüberschreitungen langsamer Modelle/Provider; der Wert bleibt unter der Obergrenze für Agenten-/Ausführungszeitüberschreitungen) |
    | `memorySearch` auf oberster Ebene                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (auf jeder Ebene)                                                            | entfernt (Speicherindizes befinden sich in der jeweiligen Agentendatenbank)                       |
    | `heartbeat` auf oberster Ebene                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | Richtlinien-IDs von `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | entfernt (veraltet)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Die obigen Zeilen zu `plugins.entries.voice-call.config.*` werden bei jedem Laden der Konfiguration
      vom Voice-Call-Plugin selbst normalisiert, nicht von `openclaw
      doctor`. Das Plugin protokolliert beim Start außerdem eine Warnung, die auf `openclaw
      doctor --fix` verweist, aber Doctor schreibt
      `openclaw.json` für diese Schlüssel derzeit nicht neu; die Plugin-eigene Normalisierung
      wendet die Änderung zur Laufzeit an.
    </Note>

    Hinweise zu Standardkonten für Kanäle mit mehreren Konten:

    - Wenn zwei oder mehr Einträge unter `channels.<channel>.accounts` ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass das Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `openclaw/plugin-sdk/llm`. Dadurch können Modelle zur falschen API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie die Überschreibung entfernen und das API-Routing sowie die Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browsermigration und Bereitschaft für Chrome MCP">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Pfad der Chrome-Erweiterung verweist, normalisiert Doctor sie auf das aktuelle hostlokale Chrome-MCP-Anbindungsmodell (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` entfernt).

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft bei standardmäßigen Profilen mit automatischer Verbindung, ob Google Chrome auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, das Remote-Debugging auf der Inspektionsseite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin einen Chromium-basierten Browser ab Version 144 auf dem Gateway-/Node-Host, der lokal ausgeführt wird, bei dem Remote-Debugging aktiviert ist und in dem die erste Zustimmungsaufforderung für das Anhängen bestätigt wurde.

    Die Bereitschaft deckt hier nur die lokalen Voraussetzungen für das Anhängen ab. Existing-session behält die aktuellen Routenbeschränkungen von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil. Diese Prüfung gilt nicht für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe, die weiterhin Raw CDP verwenden.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung aufgrund eines Zertifikatsfehlers fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ein abgelaufenes oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Fehlerbehebung aus. Unter macOS mit einer über Homebrew installierten Node-Version lautet die Lösung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei funktioniert.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überlagern. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth vorhanden sind, damit Sie die veraltete Transportüberschreibung entfernen oder neu schreiben und das aktuelle Routingverhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus, aber diese benutzerdefinierten Anfragerouten kommen nicht für die implizite Codex-Auswahl infrage.
  </Accordion>
  <Accordion title="2f. Reparatur der Codex-Route">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Das native Routing des Codex-Harness verwendet kanonische `openai/*`-Modellreferenzen, aber das Präfix allein wählt niemals Codex aus. Wenn die Laufzeitrichtlinie nicht festgelegt oder auf `auto` gesetzt ist, kommt nur eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne benutzerdefinierte Anfrageüberschreibung infrage. Siehe [Implizite OpenAI-Agentenlaufzeit](/de/providers/openai#implicit-agent-runtime).

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Referenzen des Standard-Agenten und einzelner Agenten um, einschließlich primärer Modelle, Fallbacks, Modelle zur Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen und veraltetem persistentem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die Codex-Absicht wird für reparierte Agentenmodellreferenzen in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge verschoben.
    - Veraltete Laufzeitkonfigurationen für den gesamten Agenten und persistente Sitzungs-Laufzeitbindungen werden entfernt, da die Laufzeitauswahl Provider-/modellbezogen erfolgt.
    - Die vorhandene Provider-/Modell-Laufzeitrichtlinie bleibt erhalten, sofern die reparierte veraltete Modellreferenz kein Codex-Routing benötigt, um den alten Authentifizierungspfad beizubehalten.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte modellspezifische Einstellungen werden vom veralteten Schlüssel zum kanonischen `openai/*`-Schlüssel verschoben.
    - Persistente Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Authentifizierungsprofilbindungen werden in allen erkannten Agentensitzungsspeichern repariert.
    - Doctor repariert separat veraltete `agentRuntime.id: "codex-cli"`-Bindungen (eine eigenständige veraltete Laufzeit-ID) zu `"codex"` in `agents.defaults`, `agents.list[]` und den Modelleinträgen unter `models.providers.*`.
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung über den Chat steuern oder binden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Bereinigung der Sitzungsroute">
    Doctor durchsucht außerdem erkannte Agentensitzungsspeicher nach veraltetem, automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder die Laufzeit von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie Modellbindungen mit `modelOverrideSource: "auto"`, Laufzeitmodellmetadaten, gebundene Harness-IDs, CLI-Sitzungsbindungen und automatische Authentifizierungsprofilüberschreibungen löschen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Modellentscheidungen des Benutzers oder veraltete Sitzungsmodellentscheidungen werden zur manuellen Überprüfung gemeldet und bleiben unverändert; wechseln Sie sie mit `/model ...` oder `/new`, oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr verwendet werden soll.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Datenträgerlayout)">
    Doctor kann ältere Datenträgerlayouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte: von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis: von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungszustand (Baileys): von veralteten Dateien unter `~/.openclaw/credentials/*.json` (außer `oauth.json`) nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Sicherungen zurückbleiben. Gateway/CLI migriert außerdem beim Start automatisch die veralteten Sitzungen und das Agent-Verzeichnis, damit Verlauf, Authentifizierung und Modelle ohne manuelle Ausführung von Doctor im agentenspezifischen Pfad abgelegt werden. Die WhatsApp-Authentifizierung wird bewusst nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Providern und Provider-Zuordnungen vergleicht anhand struktureller Gleichheit, sodass Unterschiede, die ausschließlich auf der Reihenfolge der Schlüssel beruhen, nicht mehr wiederholt wirkungslose Änderungen durch `doctor --fix` auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Werden solche Schlüssel gefunden, bietet Doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent; enthält `contracts` bereits dieselben Werte, wird der veraltete Schlüssel entfernt, ohne Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen des veralteten Cron-Speichers">
    Doctor prüft außerdem den Speicher für Cron-Aufträge (standardmäßig `~/.openclaw/cron/jobs.json` oder bei einer Überschreibung `cron.store`) auf alte Auftragsstrukturen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Zu den aktuellen Cron-Bereinigungen gehören:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Zustellungsaliase in der Payload `provider` → explizites `delivery.channel`
    - Veraltete `notify: true`-Webhook-Fallback-Jobs → explizite Webhook-Zustellung aus `cron.webhook`, sofern festgelegt; Ankündigungs-Jobs behalten ihre Chat-Zustellung und erhalten `delivery.completionDestination`. Wenn `cron.webhook` nicht festgelegt ist, wird die inaktive Markierung `notify` auf oberster Ebene bei Jobs ohne Ziel entfernt (die bestehende Zustellung, einschließlich Ankündigungen, bleibt erhalten), da die Laufzeitzustellung sie nie ausliest.

    Der Gateway bereinigt außerdem fehlerhafte Cron-Zeilen beim Laden, damit gültige Jobs weiter ausgeführt werden. Fehlerhafte Rohzeilen werden vor dem Entfernen aus `jobs.json` in die Datei `jobs-quarantine.json` neben dem aktiven Speicher kopiert; doctor meldet unter Quarantäne gestellte Zeilen, damit Sie sie manuell prüfen oder reparieren können.

    Der Gateway-Start normalisiert die Laufzeitprojektion und ignoriert den `notify`-Marker auf oberster Ebene, belässt jedoch die persistierte Cron-Konfiguration zur Reparatur durch Doctor. Wenn `cron.webhook` nicht gesetzt ist, entfernt Doctor den inaktiven Marker für Jobs ohne Migrationsziel (`delivery.mode` nicht gesetzt/nicht vorhanden, ein unbrauchbares Webhook-Ziel oder eine bestehende Ankündigungs-/Chat-Zustellung), ohne die bestehende Zustellung zu verändern, sodass wiederholte `doctor --fix`-Ausführungen nicht mehr vor demselben Job warnen. Wenn `cron.webhook` gesetzt ist, aber keine gültige HTTP(S)-URL enthält, gibt Doctor weiterhin eine Warnung aus und belässt den Marker, damit Sie die URL korrigieren können.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers noch das veraltete Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird von der aktuellen OpenClaw-Version nicht gepflegt und kann fälschlicherweise Meldungen des Typs `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Zustandsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien, die zurückgeblieben sind, nachdem eine Sitzung nicht ordnungsgemäß beendet wurde. Für jede gefundene Sperrdatei meldet Doctor: den Pfad, die PID, ob der Prozess mit dieser PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (beendeter Prozess, fehlerhafte Eigentümermetadaten, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Prozess gehört, der nicht Teil von OpenClaw ist). Im Modus `--fix` / `--repair` entfernt Doctor automatisch Sperren mit beendeten, verwaisten, wiederverwendeten, fehlerhaft-alten oder nicht zu OpenClaw gehörenden Eigentümern. Alte Sperren, die weiterhin einem aktiven OpenClaw-Prozess gehören, werden gemeldet, aber beibehalten, damit Doctor keinen aktiven Transkript-Schreibprozess unterbricht.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Zweigen">
    Doctor durchsucht die JSONL-Dateien der Agent-Sitzungen nach der duplizierten Zweigstruktur, die durch den Fehler bei der Neuschreibung von Prompt-Transkripten in Version 2026.4.24 entstanden ist: eine verworfene Benutzereingabe mit internem OpenClaw-Laufzeitkontext sowie ein aktiver Geschwisterzweig, der denselben sichtbaren Benutzer-Prompt enthält. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Zweig um, sodass Leser des Gateway-Verlaufs und des Speichers keine doppelten Eingaben mehr erkennen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist das operative Stammhirn. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und die Konfiguration, sofern Sie nicht an anderer Stelle Sicherungen haben.

    Doctor prüft:

    - **Fehlendes Zustandsverzeichnis**: warnt vor einem katastrophalen Verlust des Zustands, fordert zum erneuten Erstellen des Verzeichnisses auf und weist darauf hin, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: überprüft die Schreibbarkeit; bietet an, die Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
    - **Mit der macOS-Cloud synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierte Pfade langsamere E/A-Vorgänge sowie Sperr-/Synchronisationskonflikte verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand zu einer `mmcblk*`-Einhängequelle aufgelöst wird, da zufällige E/A-Vorgänge auf SD/eMMC langsamer sein und der Speicher durch Schreibvorgänge für Sitzungen und Anmeldedaten schneller verschleißen kann.
    - **Flüchtiges Linux-Zustandsverzeichnis**: warnt, wenn der Zustand zu `tmpfs` oder `ramfs` aufgelöst wird, da Sitzungen, Anmeldedaten, Konfiguration und der SQLite-Zustand (mit WAL-/Journal-Begleitdateien) bei einem Neustart verschwinden. Docker-`overlay`-Einhängungen werden absichtlich nicht gekennzeichnet, da ihre beschreibbaren Schichten Host-Neustarts überdauern, solange der Container bestehen bleibt.
    - **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Verzeichnis des Sitzungsspeichers sind erforderlich, um den Verlauf dauerhaft zu speichern und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-zeiliges JSONL“**: kennzeichnet Fälle, in denen das Haupttranskript nur eine Zeile enthält (der Verlauf wird nicht fortlaufend ergänzt).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn in verschiedenen Home-Verzeichnissen mehrere `~/.openclaw`-Ordner vorhanden sind oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort verweist (der Verlauf kann sich auf mehrere Installationen verteilen).
    - **Hinweis zum Remote-Modus**: Wenn `gateway.mode=remote` festgelegt ist, weist Doctor darauf hin, ihn auf dem Remote-Host auszuführen (dort befindet sich der Zustand).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/alle lesbar ist, und bietet an, die Berechtigungen auf `600` zu beschränken.

  </Accordion>
  <Accordion title="5. Zustand der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Authentifizierungsspeicher, warnt bei bald ablaufenden/abgelaufenen Tokens und kann sie aktualisieren, wenn dies sicher möglich ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Einrichtungstoken-Pfad vor. Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (beispielsweise `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die aufgrund kurzer Abklingzeiten (Ratenbegrenzungen/Zeitüberschreitungen/Authentifizierungsfehler) oder längerer Deaktivierungen (Abrechnungs-/Guthabenfehler) vorübergehend nicht verwendbar sind.

    Veraltete Codex-OAuth-Profile, deren Tokens im macOS-Schlüsselbund gespeichert sind (älteres Onboarding vor dem dateibasierten Begleitdatei-Layout), werden ausschließlich durch Doctor repariert. Führen Sie `openclaw doctor --fix` einmal in einem interaktiven Terminal aus, um ältere, schlüsselbundgestützte Tokens direkt in `auth-profiles.json` zu migrieren; anschließend werden sie bei eingebetteten Ausführungen (Telegram, Cron, Sub-Agent-Weiterleitung) als kanonische OpenAI-OAuth-Profile aufgelöst.

  </Accordion>
  <Accordion title="6. Modellvalidierung für Hooks">
    Wenn `hooks.gmail.model` festgelegt ist, validiert Doctor die Modellreferenz anhand des Katalogs und der Zulassungsliste und warnt, wenn sie nicht aufgelöst werden kann oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor die Docker-Images und bietet an, sie zu erstellen oder zu älteren Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` veraltete, von OpenClaw erzeugte Bereitstellungszustände für Plugin-Abhängigkeiten: veraltete erzeugte Abhängigkeitsstammverzeichnisse, alte Installations-Staging-Verzeichnisse, paketlokale Überreste aus früherem Reparaturcode für Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überlagern können. Doctor verknüpft außerdem das Host-Paket `openclaw` erneut mit verwalteten npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` auch nach Aktualisierungen oder npm-Reparaturen weiterhin aufgelöst werden.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registrierung sie jedoch nicht finden kann (wesentliche `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen, konfigurierte Agent-Laufzeiten). Während Paketaktualisierungen vermeidet Doctor die Neuinstallation von Plugin-Paketen, solange das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, falls ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Außerhalb der nachfolgend beschriebenen Ausnahme beim Start eines Container-Images führen der Gateway-Start und das Neuladen der Konfiguration keine Paketreparatur durch; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsvorgänge.

    Für den Start eines containerisierten Gateways gilt eine eng begrenzte Upgrade-Ausnahme: Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet, führt es vor der Betriebsbereitschaft sichere Zustandsmigrationen und die bestehende Plugin-Konvergenz nach dem Kernpaket aus und speichert anschließend einen versionsbezogenen Prüfpunkt. Dieser Startdurchlauf kann veraltete Datensätze gebündelter Plugins bereinigen, lokale Plugin-Verknüpfungen reparieren, konfigurierte Plugin-Pakete neu installieren, wenn der Konvergenzpfad dies erfordert, und aktive Plugin-Nutzlasten prüfen. Wenn der Start keine sichere Reparatur durchführen kann, führen Sie dasselbe Image einmal mit `openclaw doctor --fix` für denselben eingebundenen Zustand/dieselbe eingebundene Konfiguration aus, bevor Sie den Container normal neu starten.

  </Accordion>
  <Accordion title="8. Migrationen des Gateway-Dienstes und Bereinigungshinweise">
    Doctor erkennt ältere Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Nach Profilen benannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „zusätzlich“ gekennzeichnet.

    Wenn unter Linux der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene vorhanden ist, installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`; entfernen Sie anschließend das Duplikat oder legen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external` fest, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Matrix-Migration beim Start">
    Wenn für ein Matrix-Kanalkonto eine ausstehende oder erforderliche Migration eines älteren Zustands vorliegt, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt anschließend die nach bestem Bemühen möglichen Migrationsschritte aus: die Migration des älteren Matrix-Zustands und die Vorbereitung des älteren verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsabweichungen">
    Doctor prüft den Zustand der Gerätekopplung im Rahmen der normalen Integritätsprüfung und meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen- oder Bereichserweiterungen für bereits gekoppelte Geräte
    - Reparaturen bei Abweichungen öffentlicher Schlüssel, wenn die Geräte-ID weiterhin übereinstimmt, die Geräteidentität jedoch nicht mehr dem genehmigten Datensatz entspricht
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Bereiche von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für den aktuellen Rechner, die älter als eine Gateway-seitige Token-Rotation sind oder veraltete Bereichsmetadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Er gibt die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - mit `openclaw devices rotate --device <deviceId> --role <role>` ein neues Token rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch wird die erstmalige Kopplung von ausstehenden Rollen-/Bereichserweiterungen sowie von Abweichungen durch veraltete Tokens/Geräteidentitäten unterschieden und die häufige Lücke „bereits gekoppelt, aber weiterhin wird eine Kopplung verlangt“ geschlossen.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Zulassungsliste für Direktnachrichten geöffnet ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert wurde.
  </Accordion>
  <Accordion title="10. systemd-Linger-Modus (Linux)">
    Bei der Ausführung als systemd-Benutzerdienst stellt Doctor sicher, dass der Linger-Modus aktiviert ist, damit das Gateway nach der Abmeldung weiterläuft.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und TaskFlows)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

    - **Skills-Status**: zählt geeignete Skills, Skills mit fehlenden Anforderungen und durch die Zulassungsliste blockierte Skills.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet bei Fehlern die Plugin-IDs auf; meldet die Fähigkeiten gebündelter Plugins.
    - **Warnungen zur Plugin-Kompatibilität**: kennzeichnet Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit aufweisen.
    - **Plugin-Diagnose**: zeigt alle beim Laden von der Plugin-Registrierung ausgegebenen Warnungen oder Fehler an.
    - **TaskFlow-Wiederherstellung**: zeigt verdächtige verwaltete TaskFlows an, die manuell geprüft oder abgebrochen werden müssen.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Dateien">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (beispielsweise `AGENTS.md`, `CLAUDE.md` oder andere eingefügte Kontextdateien) das konfigurierte Zeichenbudget beinahe oder vollständig überschreiten. Er meldet für jede Datei die Anzahl der rohen gegenüber den eingefügten Zeichen, den Kürzungsprozentsatz, die Kürzungsursache (`max/file` oder `max/total`) sowie die Gesamtzahl der eingefügten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder sich dem Grenzwert nähern, gibt Doctor Tipps zur Anpassung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster (`source <(openclaw completion ...)`) verwendet, aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei jedoch fehlt, erzeugt Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es außerdem die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Überschreibungen. Dadurch werden Gateway-Startschleifen verhindert, bei denen die Kanallaufzeit nicht mehr vorhanden ist, die Konfiguration das Gateway jedoch weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu erzeugen.
    - Wenn `gateway.auth.token` über SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur, wenn keine Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte, SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet für gezielte Konfigurationsreparaturen dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Statusfamilie.
    - Beispiel: Bei der Reparatur von Telegram-`allowFrom` / `groupAllowFrom`-`@username` wird versucht, konfigurierte Bot-Anmeldedaten zu verwenden, sofern diese verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, im aktuellen Befehlspfad jedoch nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung und Neustart">
    Doctor führt eine Integritätsprüfung durch und bietet an, das Gateway neu zu starten, wenn es nicht ordnungsgemäß zu funktionieren scheint.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die Binärdatei `qmd` verfügbar und startfähig ist. Falls nicht, werden Hinweise zur Behebung ausgegeben, darunter `npm install -g @tobilu/qmd` (oder die entsprechende Bun-Variante) und eine Option für einen manuellen Binärdateipfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote- beziehungsweise herunterladbare Modell-URL. Falls diese fehlt, wird der Wechsel zu einem Remote-Provider vorgeschlagen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Überprüft, ob ein API-Schlüssel in der Umgebung oder im Authentifizierungsspeicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
    - **Veralteter automatischer Provider**: Behandelt `memorySearch.provider: "auto"` als OpenAI, prüft die OpenAI-Bereitschaft und `doctor --fix` schreibt die Einstellung in `provider: "openai"` um.

    Wenn ein zwischengespeichertes Ergebnis einer Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung funktionsfähig), gleicht doctor dieses Ergebnis mit der über die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den ausführlichen Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Warnungen zum Kanalstatus">
    Wenn das Gateway funktionsfähig ist, führt doctor eine Kanalstatusprüfung durch und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Prüfung und Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (beispielsweise systemd-Abhängigkeiten von network-online und die Neustartverzögerung). Wenn eine Abweichung erkannt wird, empfiehlt doctor eine Aktualisierung und kann die Dienstdatei beziehungsweise Aufgabe mit den aktuellen Standardwerten neu schreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturabfragen.
    - `openclaw doctor --fix` wendet empfohlene Korrekturen ohne Rückfragen an (`--repair` ist ein Alias).
    - `openclaw doctor --fix --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` lässt doctor für den Lebenszyklus des Gateway-Dienstes schreibgeschützt. Doctor meldet weiterhin den Dienstzustand und führt Reparaturen aus, die nicht den Dienst betreffen, überspringt jedoch Installation, Start, Neustart und Bootstrap des Dienstes, das Neuschreiben der Supervisor-Konfiguration sowie die Bereinigung veralteter Dienste, da ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt doctor keine Befehls- oder Einstiegspunktmetadaten neu, solange die entsprechende systemd-Gateway-Unit aktiv ist. Bei der Suche nach doppelten Diensten ignoriert doctor außerdem inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units, damit ergänzende Dienstdateien keine unnötigen Bereinigungshinweise erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Dienstinstallation beziehungsweise -reparatur durch doctor die SecretRef, speichert jedoch keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete, durch `.env`/SecretRef gestützte Dienstumgebungswerte, die ältere Installationen von LaunchAgent, systemd oder Windows Scheduled Task direkt eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach einer Änderung von `gateway.port` weiterhin einen alten `--port` fest vorgibt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, blockiert doctor den Installations-/Reparaturpfad und gibt umsetzbare Hinweise aus.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, blockiert doctor die Installation/Reparatur, bis der Modus ausdrücklich festgelegt wurde.
    - Bei Linux-user-systemd-Units berücksichtigen die Token-Abweichungsprüfungen von doctor beim Vergleich der Authentifizierungsmetadaten des Dienstes sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen.
    - Dienstreparaturen durch doctor verweigern das Neuschreiben, Stoppen oder Neustarten eines Gateway-Dienstes durch eine ältere OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Fehlerbehebung für das Gateway](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können ein vollständiges Neuschreiben jederzeit mit `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit- und Portdiagnose">
    Doctor untersucht die Dienstlaufzeit (PID, letzter Beendigungsstatus) und warnt, wenn der Dienst installiert ist, aber tatsächlich nicht ausgeführt wird. Außerdem prüft doctor auf Portkonflikte am Gateway-Port (standardmäßig `18789`) und meldet wahrscheinliche Ursachen (Gateway wird bereits ausgeführt, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst unter Bun oder über einen versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) ausgeführt wird. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades nicht mehr funktionieren, da der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer systemweiten Node-Installation zu migrieren, sofern eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den PATH der interaktiven Shell zu kopieren. Dadurch bleiben von Homebrew verwaltete Systembinärdateien verfügbar, während Verzeichnisse von Volta, asdf, fnm, pnpm und anderen Versionsmanagern nicht verändern, welche Node-Unterprozesse aufgelöst werden. Linux-Dienste behalten weiterhin explizite Umgebungsstammverzeichnisse (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Binärdateiverzeichnisse bei; geschätzte Ausweichverzeichnisse von Versionsmanagern werden jedoch nur dann in den Dienst-PATH geschrieben, wenn diese Verzeichnisse tatsächlich auf dem Datenträger vorhanden sind.

  </Accordion>
  <Accordion title="18. Schreiben der Konfiguration und Assistentenmetadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht die Assistentenmetadaten mit einem Eintrag, um die Ausführung von doctor zu dokumentieren.
  </Accordion>
  <Accordion title="19. Tipps zum Arbeitsbereich (Sicherung und Speichersystem)">
    Doctor schlägt ein Speichersystem für den Arbeitsbereich vor, wenn keines vorhanden ist, und gibt einen Sicherungshinweis aus, wenn der Arbeitsbereich noch nicht unter git verwaltet wird.

    Eine vollständige Anleitung zur Struktur des Arbeitsbereichs und zur git-Sicherung (empfohlen wird ein privates GitHub- oder GitLab-Repository) finden Sie unter [/concepts/agent-workspace](/de/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Fehlerbehebung für das Gateway](/de/gateway/troubleshooting)
