---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung abwärtsinkompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft den Zustand und stellt umsetzbare Reparaturschritte bereit.

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

    Standardwerte ohne Nachfrage akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, falls zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Nachfrage anwenden (Reparaturen und Neustarts, sofern sicher).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen von Zuständen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Systemdienste auf zusätzliche Gateway-Installationen prüfen (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es macht (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Optionale Preflight-Aktualisierung für Git-Installationen (nur interaktiv).
    - Prüfung der Aktualität des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung und Neustartabfrage.
    - Statuszusammenfassung für Skills (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Config and migrations">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von flachen Legacy-Feldern `talk.*` in `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcards oder Plugin-eigene Tools anfordert.
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
    - Migration von Legacy-Vertragsschlüsseln im Plugin-Manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agent-Laufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="State and integrity">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Branches, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für Neustartwiederherstellung festgefahrener Subagenten, mit `--fix`-Unterstützung zum Entfernen veralteter abgebrochener Wiederherstellungs-Flags, damit der Start das Kind nicht weiter als durch Neustart abgebrochen behandelt.
    - Prüfungen von Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Abklingzeiten/deaktivierte Zustände von Authentifizierungsprofilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, läuft aber nicht; zwischengespeichertes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway abgefragt).
    - WhatsApp-Reaktionsprüfungen für beeinträchtigten Zustand des Gateway-Ereignisloops, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die beim Installieren oder Aktualisieren Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` übernommen haben.
    - Prüfungen der Best Practices für die Gateway-Laufzeit (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Token-Erzeugung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Abweichungen im lokalen Geräte-Token-Cache und Authentifizierungsabweichungen gekoppelter Einträge).

  </Accordion>
  <Accordion title="Workspace and shell">
    - systemd-Linger-Prüfung unter Linux.
    - Prüfung der Größe der Workspace-Bootstrap-Datei (Warnungen bei Kürzung/nahem Grenzwert für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standard-Agenten; meldet erlaubte Skills mit fehlenden Binaries, Umgebungen, Konfigurationen oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung der Shell-Vervollständigung sowie automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Control-UI-Dreams-Szene enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden RPC-Methoden im Stil von Gateway Doctor, sind aber **nicht** Teil der Reparatur/Migration der `openclaw doctor`-CLI.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt umkehrbare Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorgemerkte rein geerdete Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Abruf oder tägliche Unterstützung gesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie übernehmen geerdete Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher, es sei denn, Sie führen zuerst explizit den vorgemerkten CLI-Pfad aus

Wenn Sie möchten, dass die geerdete historische Wiedergabe die normale tiefe Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher vorgemerkt, während `DREAMS.md` die Prüffläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Wenn dies ein Git-Checkout ist und Doctor interaktiv läuft, bietet es vor der Ausführung von Doctor eine Aktualisierung an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Config normalization">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert Doctor sie in das aktuelle Schema.

    Dazu gehören flache Legacy-Felder von Talk. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Zuordnung um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` passt nur auf Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Allowlist nicht. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um vorhandenes Verhalten gebündelter Provider beizubehalten, und
    verweist anschließend auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt Doctor-Migrationen beim Start auch automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuellen Eingriff repariert werden. Migrationen des Cron-Jobspeichers werden von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen für konfigurierte Kanäle ohne sichtbare Antwort-Richtlinie → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → Top-Level-`bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Bei Kanälen mit benannten `accounts`, aber verbleibenden Single-Account-Top-Level-Kanalwerten, verschieben Sie diese Account-bezogenen Werte in den für diesen Kanal ausgewählten hochgestuften Account (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standard-Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Account-Standardhinweise für Multi-Account-Kanäle:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt doctor, dass Fallback-Routing einen unerwarteten Account auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Account-ID gesetzt ist, warnt doctor und listet die konfigurierten Account-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie das Override entfernen und das API-Routing + die Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad zeigt, normalisiert doctor sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer Verbindung installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal laufenden Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - die Genehmigung der ersten Attach-Zustimmungsabfrage im Browser

    Die Bereitschaft bezieht sich hier nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI Codex OAuth-Profil konfiguriert ist, testet doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn der Test mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node lautet die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird der Test auch ausgeführt, wenn das Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth gefunden werden, damit Sie das veraltete Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Plugin-Routenwarnungen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft doctor außerdem, ob `openai-codex/*`-Primärmodell-Refs weiterhin über den Standard-PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnementauthentifizierung über PI verwenden möchten, kann aber leicht mit dem nativen Codex-App-Server-Harness verwechselt werden. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, weil beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet „Codex-OAuth-/Abonnementauthentifizierung über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `agentRuntime.id: "codex"` bedeutet „den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden.“

    Wenn die Warnung erscheint, wählen Sie die beabsichtigte Route und bearbeiten Sie die Konfiguration manuell. Belassen Sie die Warnung unverändert, wenn PI Codex OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="2g. Bereinigung von Sitzungsrouten">
    Doctor durchsucht außerdem den aktiven Sitzungsspeicher nach veraltetem, automatisch erstelltem Routenstatus, nachdem Sie das konfigurierte Standard-/Fallback-Modell oder die Runtime von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status bereinigen, etwa `modelOverrideSource: "auto"`-Modell-Pins, Runtime-Modellmetadaten, gepinnte Harness-IDs, CLI-Sitzungsbindungen und automatische Auth-Profil-Overrides, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzer- oder Legacy-Sitzungsmodellentscheidungen werden zur manuellen Prüfung gemeldet und unverändert belassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Festplattenlayout)">
    Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungsstatus (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Account-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; doctor gibt Warnungen aus, wenn Legacy-Ordner als Backups zurückbleiben. Das Gateway/die CLI migriert außerdem den veralteten Sitzungsspeicher + das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Auth/Modelle ohne manuellen doctor-Lauf im Pfad pro Agent landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Talk-Provider-/Provider-Map-Normalisierung vergleicht jetzt per struktureller Gleichheit, sodass Diffs, die nur die Schlüsselreihenfolge betreffen, keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Top-Level-Capability-Schlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen des veralteten Cron-Speichers">
    Doctor prüft außerdem den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Top-Level-Payload-Felder (`message`, `model`, `thinking`, ...) → `payload`
    - Top-Level-Zustellungsfelder (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliase → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den veralteten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellungsmodus kombiniert, warnt doctor und belässt diesen Job zur manuellen Prüfung.

    Unter Linux warnt doctor außerdem, wenn die Crontab des Benutzers noch das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses host-lokale Skript wird vom aktuellen OpenClaw nicht gepflegt und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health-Checks.

  </Accordion>
  <Accordion title="3c. Sitzungs-Lock-Bereinigung">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er: Pfad, PID, ob die PID noch aktiv ist, Lock-Alter und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Lock-Dateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungs-Transkript-Branches">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Struktur, die durch den Prompt-Transkript-Rewrite-Fehler vom 2026.4.24 erzeugt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwister-Branch mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn ein Besitzer-/Gruppen-Mismatch erkannt wird).
    - **macOS-cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, weil sync-gestützte Pfade langsamere I/O und Lock-/Sync-Rennen verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Session-Store-Verzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Mismatch**: warnt, wenn neuere Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` an eine andere Stelle zeigt (Verlauf kann sich zwischen Installationen aufteilen).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand liegt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Zustand der Modell-Authentifizierung (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Auth-Store, warnt, wenn Token bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend unbrauchbar sind aufgrund von:

    - kurzen Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Billing-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht zugelassen ist.
  </Accordion>
  <Accordion title="7. Sandbox-Image-Reparatur">
    Wenn Sandboxing aktiviert ist, prüft doctor Docker-Images und bietet an, zu bauen oder auf Legacy-Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Plugin-Installationsbereinigung">
    Doctor entfernt veralteten von OpenClaw generierten Staging-Zustand für Plugin-Abhängigkeiten im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Install-Stage-Verzeichnisse, package-lokale Rückstände aus früherem Reparaturcode für gebündelte Plugin-Abhängigkeiten sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest verdecken können.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Channel-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen vermeidet doctor, die Plugin-Reparatur des Paketmanagers auszuführen, während das Core-Paket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite doctor-/install-/update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert doctor nicht automatisch einen zweiten Benutzer-Level-Dienst, wenn der Benutzer-Level-Gateway-Dienst fehlt, aber ein System-Level-OpenClaw-Gateway-Dienst existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Channel-Konto eine ausstehende oder umsetzbare Legacy-Zustandsmigration hat, erstellt doctor (im Modus `--fix` / `--repair`) einen Vor-Migrations-Snapshot und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Legacy-Encrypted-State-Vorbereitung. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor prüft den Gerätekopplungszustand jetzt als Teil des normalen Health-Durchlaufs.

    Er meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen von Public-Key-Mismatches, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
    - gekoppelte Datensätze ohne aktives Token für eine genehmigte Rolle
    - gekoppelte Token, deren Scopes außerhalb der genehmigten Pairing-Baseline driften
    - lokal zwischengespeicherte Geräte-Token-Einträge für die aktuelle Maschine, die vor einer gateway-seitigen Token-Rotation liegen oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Token nicht automatisch. Stattdessen gibt er die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber trotzdem Pairing erforderlich“: doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Policy gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Bei Ausführung als systemd-Benutzerdienst stellt doctor sicher, dass Linger aktiviert ist, damit das Gateway nach dem Abmelden aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete Skills, Skills mit fehlenden Anforderungen und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnose**: zeigt alle Ladezeit-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Bootstrap-Dateigröße">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder es überschreiten. Er meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und insgesamt injizierte Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Channel-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt es auch die hängende channel-spezifische Konfiguration, die auf dieses Plugin verwies: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannten, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Boot-Loops, bei denen die Channel-Laufzeit weg ist, die Konfiguration das Gateway aber weiterhin auffordert, daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert doctor es auf die schnellere Variante mit gecachter Datei.
    - Wenn Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, erzeugt doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert doctor zur Installation auf (nur interaktiver Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet doctor an, eines zu erzeugen.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Status-Familienbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass der Anmeldenachweis konfiguriert, aber nicht verfügbar ist, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung + Neustart">
    Doctor führt eine Zustandsprüfung aus und bietet an, den Gateway neu zu starten, wenn er ungesund wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob das `qmd`-Binary verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich des npm-Pakets und einer Option für einen manuellen Binary-Pfad ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, falls er fehlt.
    - **Auto-Provider**: prüft zuerst die Verfügbarkeit des lokalen Modells und versucht dann jeden Remote-Provider in der Auto-Auswahlreihenfolge.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung gesund), gleicht doctor dessen Ergebnis mit der CLI-sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den Deep-Memory-Statusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu verifizieren.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn der Gateway gesund ist, führt doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsaudit + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-network-online-Abhängigkeiten und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt doctor eine Aktualisierung und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration umgeschrieben wird.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Servicezustand wird weiterhin gemeldet und Nicht-Service-Reparaturen werden ausgeführt, aber Serviceinstallation/-start/-neustart/-bootstrap, Supervisor-Konfigurationsumschreibungen und Legacy-Service-Bereinigung werden übersprungen, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt doctor Befehls-/Einstiegspunkt-Metadaten nicht um, solange die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert doctor während der Suche nach doppelten Services inaktive zusätzliche Gateway-ähnliche Units, die nicht Legacy sind, damit begleitende Servicedateien kein Bereinigungsrauschen erzeugen.
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die doctor-Serviceinstallation/-reparatur die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Serviceumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Servicemetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` noch einen alten `--port` festschreibt, und schreibt die Servicemetadaten auf den aktuellen Port um.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-User-systemd-Units umfassen doctor-Token-Drift-Prüfungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Service-Auth-Metadaten.
    - Doctor-Servicereparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit über `openclaw gateway install --force` ein vollständiges Umschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor untersucht die Servicelaufzeit (PID, letzter Beendigungsstatus) und warnt, wenn der Service installiert ist, aber nicht tatsächlich läuft. Außerdem prüft doctor auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle benötigen Node, und Versionsmanager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren, sodass Volta-, asdf-, fnm-, pnpm- und andere Versionsmanager-Verzeichnisse nicht ändern, welche Node-Kindprozesse auflösen. Linux-Services behalten weiterhin explizite Umgebungsstämme (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile User-bin-Verzeichnisse bei, aber erratene Versionsmanager-Fallback-Verzeichnisse werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen dauerhaft und versieht Wizard-Metadaten mit einem Zeitstempel, um den doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Arbeitsbereichstipps (Sicherung + Speichersystem)">
    Doctor schlägt ein Arbeitsbereichs-Speichersystem vor, wenn es fehlt, und gibt einen Sicherungstipp aus, wenn der Arbeitsbereich nicht bereits unter git liegt.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Arbeitsbereichsstruktur und git-Sicherung (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
