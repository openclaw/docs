---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung von nicht abwärtskompatiblen Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-07T01:52:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Systemintegrität und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Rückfragen akzeptieren (einschließlich Neustart-, Service- und Sandbox-Reparaturschritten, sofern zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Rückfragen anwenden (Reparaturen und Neustarts, wo sicher).

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

    Ohne Rückfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen von Zustand auf dem Datenträger). Überspringt Neustart-, Service- und Sandbox-Aktionen, die menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
  <Accordion title="Integrität, UI und Updates">
    - Optionales Vorab-Update für Git-Installationen (nur interaktiv).
    - Prüfung der UI-Protokollaktualität (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Integritätsprüfung und Neustartabfrage.
    - Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von alten flachen `talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zu Plugin-/Tool-Zulassungslisten, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Platzhalter oder Plugin-eigene Tools anfordert.
    - Legacy-Migration von Zustand auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Felder der obersten Ebene für Zustellung/Payload, Payload-`provider`, einfache Webhook-Fallback-Jobs mit `notify: true`).
    - Migration der Legacy-Agent-Laufzeitrichtlinie nach `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inaktive Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen 2026.4.24-Builds erstellt wurden.
    - Erkennung von Tombstones für Neustartwiederherstellung festgefahrener Subagenten, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungsflags, damit der Start das Kind nicht weiter als durch Neustart abgebrochen behandelt.
    - Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Integrität der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Authentifizierungsprofilen.
    - Erkennung zusätzlicher Arbeitsbereichsverzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Services und Supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Service-Migration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Service installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
    - WhatsApp-Reaktionsprüfungen für beeinträchtigte Gateway-Event-Loop-Integrität, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-Modellreferenzen `openai-codex/*` in Primärmodellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsrouten-Pins; `--fix` schreibt sie nach `openai/*` um und wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, das `codex`-Harness beiträgt und nutzbares OAuth hat. Andernfalls wird `agentRuntime.id: "pi"` ausgewählt.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Services, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Best-Practice-Prüfungen der Gateway-Laufzeit (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle existiert; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Abweichungen im lokalen Geräte-Token-Cache und Authentifizierungsabweichungen bei Pairing-Datensätzen).

  </Accordion>
  <Accordion title="Arbeitsbereich und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Größenprüfung der Arbeitsbereich-Bootstrap-Datei (Warnungen zu Kürzung/nahem Limit für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standardagenten; meldet zugelassene Skills mit fehlenden Binaries, fehlender Umgebung, Konfiguration oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen der Quellinstallation (pnpm-Arbeitsbereichsabweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Zurücksetzen** und **Grounded leeren** für den grounded Dreaming-Workflow. Diese Aktionen verwenden doctor-artige RPC-Methoden des Gateways, sind aber **nicht** Teil der Reparatur/Migration der CLI `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Arbeitsbereich, führt den grounded REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Zurücksetzen** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Grounded leeren** entfernt nur bereitgestellte grounded-only-Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie selbst **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen doctor-Migrationen aus
- sie stellen grounded-Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, sofern Sie nicht zuerst explizit den bereitgestellten CLI-Pfad ausführen

Wenn Sie möchten, dass grounded historische Wiedergabe die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt grounded dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereit, während `DREAMS.md` als Prüffläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor dem Ausführen von doctor ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Werteformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören alte flache Talk-Felder. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen wie `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt alte Echtzeit-Selektoren der obersten Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) nach `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` passt nur auf Tools
    von Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Zulassungsliste nicht. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Zulassungslistenkonfigurationen, um vorhandenes Verhalten gebündelter Provider beizubehalten, und
    verweist anschließend auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy-Konfigurationsschlüsselmigrationen">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Migrationen des Cron-Job-Speichers werden ebenfalls von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen konfigurierter Kanäle ohne sichtbare Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → oberste Ebene `bindings`
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
    - Bei Kanälen mit benannten `accounts`, aber verbleibenden Single-Account-Kanalwerten auf oberster Ebene, verschieben Sie diese kontobezogenen Werte in das für diesen Kanal hochgestufte Konto (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zum Kontostandard für Multi-Account-Kanäle:

    - Wenn zwei oder mehr Einträge unter `channels.<channel>.accounts` ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt doctor, dass das Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und API-Routing sowie Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad zeigt, normalisiert doctor sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für Standardprofile mit automatischer Verbindung auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Inspect-Seite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal ausgeführten Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - Bestätigung der ersten Attach-Einwilligungsaufforderung im Browser

    Die Bereitschaft hier betrifft nur die Voraussetzungen für lokales Attach. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Roh-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere headless Abläufe. Diese verwenden weiterhin Roh-CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Behebung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn es diese alten Transporteinstellungen zusammen mit Codex OAuth erkennt, damit Sie die veraltete Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Natives Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen plus `agentRuntime.id: "codex"`, damit der Turn über das Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad läuft.

    Im Modus `--fix` / `--repair` schreibt doctor betroffene Standard-Agent- und agentenspezifische Referenzen um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und veraltetem persistiertem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die passende Agent-Laufzeit wird nur dann zu `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat.
    - Andernfalls wird die passende Agent-Laufzeit zu `agentRuntime.id: "pi"`.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte modellspezifische Einstellungen werden vom veralteten Schlüssel zum kanonischen Schlüssel `openai/*` verschoben.
    - Persistierte Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise, Authentifizierungsprofil-Pins und Codex-Harness-Pins werden über alle erkannten Agent-Sitzungsspeicher hinweg repariert.
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Sitzungsrouten-Bereinigung">
    Doctor durchsucht außerdem erkannte Agent-Sitzungsspeicher nach veraltetem automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder Laufzeiten von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modell-Pins, Laufzeitmodell-Metadaten, angeheftete Harness-IDs, CLI-Sitzungsbindungen und automatische Authentifizierungsprofil-Überschreibungen löschen, wenn deren besitzende Route nicht mehr konfiguriert ist. Explizite Benutzer- oder veraltete Sitzungsmodell-Auswahlen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Veraltete Statusmigrationen (Festplattenlayout)">
    Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungsstatus (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Der Gateway/die CLI migriert außerdem den veralteten Sitzungsspeicher und das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Authentifizierung/Modelle ohne manuellen doctor-Lauf im agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Talk-Provider-/Provider-Map-Normalisierung vergleicht jetzt nach struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Veraltete Plugin-Manifest-Migrationen">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Veraltete Cron-Speichermigrationen">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellaliase → explizites `delivery.channel`
    - ungültige persistierte Cron-`payload.model`-Sentinels (`"default"`, `"null"`, leere Zeichenfolgen, JSON `null`) → entfernte Modellüberschreibung
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den Legacy-Notify-Fallback mit einem bestehenden Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und belässt diesen Job zur manuellen Prüfung.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers noch das Legacy-Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses host-lokale Skript wird vom aktuellen OpenClaw nicht gewartet und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzer-Bus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health Checks.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Lock-Dateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, den Befehl erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur des Sitzungstranskript-Zweigs">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Zweigstruktur, die durch den Fehler beim Prompt-Transkript-Rewrite vom 2026.4.24 entstanden ist: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwisterzweig mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Zweig um, sodass Gateway-Historie und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, weil synchronisierte Pfade langsamere I/O und Lock-/Sync-Races verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte Random-I/O unter Sitzungs- und Anmeldedaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Store-Verzeichnis sind erforderlich, um Historie zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Abweichung**: warnt, wenn neuere Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-zeiliges JSONL“**: kennzeichnet, wenn das Haupttranskript nur eine Zeile hat (Historie sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (Historie kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Hinweis**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand befindet sich dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Auth-Zustand (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Auth-Store, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungs-Prompts erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider, der Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht nutzbar sind aufgrund von:

    - kurzen Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur von Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder auf Legacy-Namen umzuschalten, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung von Plugin-Installationen">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` veralteten, von OpenClaw generierten Staging-Zustand für Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Install-Stage-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für gebündelte Plugin-Abhängigkeiten sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration sie referenziert, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Channel-/Provider-/Sucheinstellungen und konfigurierte Agent-Runtimes. Während Paketaktualisierungen vermeidet Doctor eine Plugin-Reparatur durch den Paketmanager, während das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Install-/Update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Channel-Konto eine ausstehende oder umsetzbare Legacy-Zustandsmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Vorbereitung des verschlüsselten Legacy-Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im Read-only-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor prüft den Gerätekopplungszustand jetzt als Teil des normalen Health-Passes.

    Gemeldet werden:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr zum genehmigten Datensatz passt
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungs-Baseline abweichen
    - lokal zwischengespeicherte Geräte-Token-Einträge für den aktuellen Rechner, die älter sind als eine Gateway-seitige Token-Rotation oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen gibt er die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“: Doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades sowie von veralteter Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn Doctor als systemd-Benutzerdienst ausgeführt wird, stellt er sicher, dass Lingering aktiviert ist, damit das Gateway nach dem Abmelden aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

    - **Skills-Status**: zählt geeignete, mit fehlenden Anforderungen versehene und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: kennzeichnet Plugins, die Kompatibilitätsprobleme mit der aktuellen Runtime haben.
    - **Plugin-Diagnosen**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Bootstrap-Dateigröße">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten Zeichenbudget liegen. Er meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil des Gesamtbudgets. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Channel-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt es außerdem die verwaiste channel-spezifische Konfiguration, die dieses Plugin referenziert hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Boot-Loops, bei denen die Channel-Runtime verschwunden ist, die Konfiguration das Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt, generiert Doctor den Cache automatisch neu.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur interaktiver Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das schnelle Fehlschlagen zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Statusbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Telegram-Reparatur für `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung + Neustart">
    Doctor führt eine Zustandsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standardagenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die Binärdatei `qmd` verfügbar und startbar ist. Falls nicht, werden Hinweise zur Behebung ausgegeben, einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Verifiziert, dass ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
    - **Auto-Provider**: Prüft zuerst die lokale Modellverfügbarkeit und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Probeergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den tiefgehenden Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers möchten.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu verifizieren.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Behebungen.
  </Accordion>
  <Accordion title="15. Prüfung + Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es ein Update und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Behebungen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Es meldet weiterhin den Servicezustand und führt Reparaturen aus, die keinen Service betreffen, überspringt aber Serviceinstallation, -start, -neustart und Bootstrap, das Umschreiben der Supervisor-Konfiguration sowie die Bereinigung alter Services, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt doctor Befehls-/Entrypoint-Metadaten nicht um, solange die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive, nicht veraltete zusätzliche gateway-ähnliche Units während der Suche nach doppelten Services, damit begleitende Servicedateien keine Bereinigungswarnungen erzeugen.
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die doctor-Serviceinstallation/-reparatur die SecretRef, persistiert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Service-Umgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Service-Metadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` noch einen alten `--port` festlegt, und schreibt die Service-Metadaten auf den aktuellen Port um.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt wurde.
    - Für Linux-User-systemd-Units beziehen die Token-Drift-Prüfungen von doctor jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen ein, wenn Service-Auth-Metadaten verglichen werden.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber nicht tatsächlich läuft. Es prüft außerdem auf Portkollisionen auf dem Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle benötigen Node, und Versionsmanager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren, sodass Volta-, asdf-, fnm-, pnpm- und andere Versionsmanager-Verzeichnisse nicht ändern, welcher Node von Child-Prozessen aufgelöst wird. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile User-Bin-Verzeichnisse bei, aber geschätzte Versionsmanager-Fallback-Verzeichnisse werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreibvorgang + Wizard-Metadaten">
    Doctor persistiert alle Konfigurationsänderungen und versieht Wizard-Metadaten mit einem Zeitstempel, um den doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zu git-Backups (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
