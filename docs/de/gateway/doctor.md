---
read_when:
    - Hinzufügen oder Ändern von doctor-Migrationen
    - Einführung inkompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Zustandsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T06:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Integrität und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Nachfragen akzeptieren (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, wenn zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Nachfragen anwenden (Reparaturen und Neustarts, sofern sicher).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Auch aggressive Reparaturen anwenden (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Ohne Nachfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen von Zustand auf dem Datenträger). Überspringt Neustart-/Service-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - Prüfung der UI-Protokollaktualität (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Integritätsprüfung und Neustartabfrage.
    - Skills-Statusübersicht (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Config and migrations">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Feldern im flachen Format `talk.*` nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcard- oder Plugin-eigene Tools anfordert.
    - Migration von Legacy-Zustand auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Schlüsseln im Plugin-Manifestvertrag (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Zustellungs-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agent-Laufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false` gilt, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="State and integrity">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für die Neustartwiederherstellung festhängender Subagenten, mit `--fix`-Unterstützung zum Bereinigen veralteter abgebrochener Wiederherstellungs-Flags, damit der Start das Kind nicht weiter als neustartabgebrochen behandelt.
    - Prüfungen von Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfungen der Konfigurationsdateiberechtigungen (chmod 600) bei lokaler Ausführung.
    - Modell-Auth-Integrität: prüft den OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
    - Erkennung zusätzlicher Arbeitsbereichsverzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Service installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - WhatsApp-Reaktionsfähigkeitsprüfungen für beeinträchtigte Gateway-Event-Loop-Integrität, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-Modellreferenzen `openai-codex/*` in Primärmodellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und Sitzungsrouten-Pins; `--fix` schreibt sie zu `openai/*` um und wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, den `codex`-Harness beiträgt und nutzbares OAuth hat. Andernfalls wird `agentRuntime.id: "pi"` ausgewählt.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Services, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen für Best Practices (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Auth-Prüfungen für den lokalen Token-Modus (bietet Tokengenerierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Drift im lokalen Gerätetoken-Cache und Auth-Drift bei gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Prüfung von systemd-linger unter Linux.
    - Größenprüfung der Arbeitsbereich-Bootstrap-Datei (Warnungen bei Kürzung/Annäherung an Grenzwerte für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standard-Agenten; meldet erlaubte Skills mit fehlenden Binaries, Umgebungs-, Konfigurations- oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung der Shell-Vervollständigung sowie automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung für den Embedding-Provider der Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen von Quellinstallationen (pnpm-Arbeitsbereich stimmt nicht überein, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden doctor-artige RPC-Methoden des Gateway, sind aber **nicht** Teil der Reparatur/Migration der CLI `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Arbeitsbereich, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich geerdete Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder keine tägliche Unterstützung gesammelt haben.

Was sie **nicht** selbst tun:

- Sie bearbeiten `MEMORY.md` nicht
- Sie führen keine vollständigen doctor-Migrationen aus
- Sie stellen geerdete Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, es sei denn, Sie führen zuerst explizit den bereitgestellten CLI-Pfad aus

Wenn Sie möchten, dass geerdete historische Wiedergabe den normalen Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete langlebige Kandidaten im Kurzzeit-Dreaming-Speicher bereitgestellt, während `DREAMS.md` als Prüfoberfläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor dem Ausführen von doctor ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Config normalization">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert doctor sie in das aktuelle Schema.

    Das umfasst Legacy-Talk-Felder im flachen Format. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt Legacy-Echtzeitselektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` passt nur zu Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Allowlist nicht. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um bestehendes Verhalten gebündelter Provider beizubehalten, und
    verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und bitten Sie, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erläutern, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt doctor-Migrationen beim Start außerdem automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden. Migrationen des Cron-Job-Speichers werden durch `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Kanalkonfigurationen für konfigurierte Kanäle mit fehlender Richtlinie für sichtbare Antworten → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - veraltete Realtime-Talk-Selektoren auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` und `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` und `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` und `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` und `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Bei Kanälen mit benannten `accounts`, aber verbleibenden Einzelkonto-Kanalwerten auf oberster Ebene, verschieben Sie diese kontobezogenen Werte in das hochgestufte Konto, das für diesen Kanal ausgewählt wurde (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standard-Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, anstatt restriktiv fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zum Standardkonto für Mehrkonto-Kanäle:

    - Wenn zwei oder mehr Einträge unter `channels.<channel>.accounts` ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet konfigurierte Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browsermigration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle hostlokale Chrome-MCP-Anbindungsmodell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für standardmäßige Auto-Connect-Profile auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Inspect-Seite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome-MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal laufenden Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - das Bestätigen der ersten Attach-Zustimmungsaufforderung im Browser

    Bereitschaft bezieht sich hier nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Routenlimits von Chrome-MCP bei; erweiterte Routen wie `responsebody`, PDF-Export, Abfangen von Downloads und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker, Sandbox, Remote-Browser oder andere Headless-Flows. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Behebung normalerweise `brew postinstall ca-certificates`. Mit `--deep` läuft die Prüfung auch dann, wenn das Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad verdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn es diese alten Transporteinstellungen zusammen mit Codex-OAuth sieht, damit Sie die veraltete Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Natives Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen plus `agentRuntime.id: "codex"`, damit der Turn über den Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad läuft.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Default-Agent- und agentenspezifische Referenzen um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanal-Modellüberschreibungen und veraltetem persistiertem Sitzungsroutenzustand:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die passende Agent-Runtime wird nur dann zu `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, den `codex`-Harness beiträgt und nutzbares OAuth hat.
    - Andernfalls wird die passende Agent-Runtime zu `agentRuntime.id: "pi"`.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Einstellungen pro Modell werden vom veralteten Schlüssel zum kanonischen Schlüssel `openai/*` verschoben.
    - Persistierte Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise, Auth-Profile-Pins und Codex-Harness-Pins werden in allen gefundenen Agent-Sitzungsspeichern repariert.
    - `/codex ...` bedeutet "eine native Codex-Unterhaltung aus dem Chat steuern oder binden."
    - `/acp ...` oder `runtime: "acp"` bedeutet "den externen ACP/acpx-Adapter verwenden."

  </Accordion>
  <Accordion title="2g. Bereinigung von Sitzungsrouten">
    Doctor scannt außerdem gefundene Agent-Sitzungsspeicher nach veraltetem, automatisch erstelltem Routenzustand, nachdem Sie konfigurierte Modelle oder Runtime von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Zustand bereinigen, z. B. `modelOverrideSource: "auto"`-Modell-Pins, Runtime-Modellmetadaten, angepinnte Harness-IDs, CLI-Sitzungsbindungen und automatische Auth-Profile-Überschreibungen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzerentscheidungen oder veraltete Sitzungsmodell-Auswahlen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Datenträgerlayout)">
    Doctor kann ältere Datenträgerlayouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Zustand (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

    Diese Migrationen erfolgen nach Best-Effort und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Das Gateway/die CLI migriert außerdem automatisch die veralteten Sitzungen + das Agent-Verzeichnis beim Start, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. WhatsApp-Auth wird bewusst nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt anhand struktureller Gleichheit, sodass Diffs, die nur die Schlüsselreihenfolge betreffen, keine wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor scannt alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn solche gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt zu überschreiben. Diese Migration ist idempotent; wenn der `contracts`-Schlüssel bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` bzw. `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellaliase → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den alten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und lässt diesen Job zur manuellen Prüfung unverändert.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das alte `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird von aktuellem OpenClaw nicht gewartet und kann falsche `Gateway inactive`-Meldungen in `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health Checks.

  </Accordion>
  <Accordion title="3c. Bereinigung von Session-Locks">
    Doctor durchsucht jedes Agent-Session-Verzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Session abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter des Locks und ob er als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Lock-Dateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Session-Transcript-Branches">
    Doctor durchsucht Agent-Session-JSONL-Dateien nach der duplizierten Branch-Struktur, die durch den Fehler beim Prompt-Transcript-Rewrite vom 2026.4.24 erzeugt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Sibling mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transcript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Session-Persistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist das operative Stammhirn. Wenn es verschwindet, verlieren Sie Sessions, Anmeldedaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Zustandsverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierte Pfade langsamere I/O und Lock-/Sync-Rennen verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da zufällige I/O auf SD- oder eMMC-Speicher unter Session- und Anmeldedaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Session-Verzeichnisse fehlen**: `sessions/` und das Session-Store-Verzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transcript-Abweichung**: warnt, wenn neuere Session-Einträge fehlende Transcript-Dateien haben.
    - **Haupt-Session „1-zeiliges JSONL“**: markiert, wenn das Haupt-Transcript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand befindet sich dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Auth-Zustand (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Auth-Store, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungs-Prompts erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht nutzbar sind wegen:

    - kurzer Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längerer Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Sandbox-Image-Reparatur">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, zu bauen oder auf alte Namen umzuschalten, wenn das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` alten von OpenClaw erzeugten Staging-Zustand für Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Dependency-Roots, alte Install-Stage-Verzeichnisse, package-lokale Rückstände aus früherem Reparaturcode für gebündelte Plugin-Abhängigkeiten sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann auch fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen und konfigurierte Agent-Runtimes. Während Package-Updates vermeidet Doctor eine Plugin-Reparatur über Package-Manager, während das Core-Package ausgetauscht wird; führen Sie `openclaw doctor --fix` nach dem Update erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurations-Reload führen keine Package-Manager aus; Plugin-Installationen bleiben explizite Doctor-/Install-/Update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway-Service-Migrationen und Bereinigungshinweise">
    Doctor erkennt alte Gateway-Services (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Service mit dem aktuellen Gateway-Port zu installieren. Er kann auch nach zusätzlichen Gateway-ähnlichen Services suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Services gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Service auf Benutzerebene, wenn der Gateway-Service auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Service auf Systemebene existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Legacy-State-Migration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-State-Migration und Legacy-Encrypted-State-Vorbereitung. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Geräte-Pairing und Auth-Drift">
    Doctor untersucht den Geräte-Pairing-Zustand jetzt als Teil des normalen Health-Passes.

    Was gemeldet wird:

    - ausstehende erstmalige Pairing-Anfragen
    - ausstehende Rollen-Upgrades für bereits gepairte Geräte
    - ausstehende Scope-Upgrades für bereits gepairte Geräte
    - Public-Key-Mismatch-Reparaturen, bei denen die Geräte-ID weiterhin übereinstimmt, die Geräteidentität aber nicht mehr zum genehmigten Datensatz passt
    - gepairte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gepairte Tokens, deren Scopes außerhalb der genehmigten Pairing-Basislinie driften
    - lokal zwischengespeicherte Geräte-Token-Einträge für die aktuelle Maschine, die einer Gateway-seitigen Token-Rotation vorausgehen oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Pairing-Anfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen gibt er die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gepairt, aber Pairing weiterhin erforderlich“: Doctor unterscheidet jetzt erstmaliges Pairing von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Policy gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Wenn Doctor als systemd-Benutzerdienst ausgeführt wird, stellt er sicher, dass Lingering aktiviert ist, damit der Gateway nach dem Logout aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und alte Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt berechtigte Skills, Skills mit fehlenden Anforderungen und durch Allowlist blockierte Skills.
    - **Alte Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Runtime haben.
    - **Plugin-Diagnosen**: zeigt alle Ladezeit-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Datei">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten Zeichenbudget liegen. Er meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt wurden oder nahe am Limit liegen, gibt Doctor Tipps zum Tuning von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalbezogene Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dadurch werden Gateway-Boot-Loops verhindert, bei denen die Kanal-Runtime verschwunden ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit gecachter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, generiert Doctor den Cache automatisch neu.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur interaktiver Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie statusbezogene Befehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung + Neustart">
    Doctor führt eine Zustandsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich npm-Paket und Option für einen manuellen Binärpfad ausgegeben.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Wenn sie fehlt, wird ein Wechsel zu einem Remote-Provider vorgeschlagen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, wenn er fehlt.
    - **Auto-Provider**: Prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der Auto-Auswahlreihenfolge.

    Wenn ein zwischengespeichertes Gateway-Probeergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den tiefen Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Reparaturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsprüfung + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt doctor eine Aktualisierung und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Reparaturen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Es meldet weiterhin den Servicezustand und führt Nicht-Service-Reparaturen aus, überspringt aber Serviceinstallation/-start/-neustart/-bootstrap, Umschreibungen der Supervisor-Konfiguration und die Bereinigung alter Services, da ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt doctor Befehls-/Entrypoint-Metadaten nicht um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units während der Suche nach doppelten Services, damit begleitende Servicedateien kein Bereinigungsrauschen erzeugen.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert die doctor-Serviceinstallation/-reparatur die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete, `.env`-/SecretRef-gestützte Serviceumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Servicemetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festlegt, und schreibt die Servicemetadaten auf den aktuellen Port um.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-user-systemd-Units beziehen die Token-Drift-Prüfungen von doctor jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Service-Auth-Metadaten ein.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit über `openclaw gateway install --force` ein vollständiges Umschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Servicelaufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber nicht tatsächlich läuft. Außerdem prüft es auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades fehlschlagen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn diese verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren, sodass Volta-, asdf-, fnm-, pnpm- und andere Versionsmanager-Verzeichnisse nicht ändern, welches Node von Kindprozessen aufgelöst wird. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile user-bin-Verzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger vorhanden sind.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und stempelt Wizard-Metadaten, um den doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Arbeitsbereichstipps (Backup + Speichersystem)">
    Doctor schlägt ein Speichersystem für den Arbeitsbereich vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Arbeitsbereich noch nicht unter git liegt.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Arbeitsbereichsstruktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
