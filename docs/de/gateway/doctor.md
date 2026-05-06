---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Abwärtsinkompatible Konfigurationsänderungen einführen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T17:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Systemgesundheit und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Rückfragen akzeptieren (einschließlich Neustart-, Service- und Sandbox-Reparaturschritten, falls zutreffend).

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

    Ohne Rückfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen von Zuständen auf dem Datenträger). Überspringt Neustart-, Service- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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

## Was es tut (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Systemgesundheit, UI und Updates">
    - Optionales Vorab-Update für Git-Installationen (nur interaktiv).
    - Frischeprüfung des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Systemgesundheitsprüfung und Neustartabfrage.
    - Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flachfeldern `talk.*` nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcards oder Plugin-eigene Tools anfordert.
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
    - Migration von Legacy-Plugin-Manifestvertragschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agent-Laufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für doppelte Prompt-Rewrite-Branches, die von betroffenen 2026.4.24-Builds erstellt wurden.
    - Erkennung von Tombstones für die Neustartwiederherstellung blockierter Subagents, mit `--fix`-Unterstützung zum Entfernen veralteter abgebrochener Wiederherstellungs-Flags, damit der Start den Child nicht weiter als durch Neustart abgebrochen behandelt.
    - Integritäts- und Berechtigungsprüfungen für Zustände (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen für Konfigurationsdateien (chmod 600) bei lokaler Ausführung.
    - Systemgesundheit der Modellauthentifizierung: prüft OAuth-Ablaufzeiten, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Authentifizierungsprofilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Services und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Service-Migration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Service installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - WhatsApp-Reaktionsprüfungen für beeinträchtigte Gateway-Event-Loop-Gesundheit, während lokale TUI-Clients noch ausgeführt werden; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-Modellreferenzen `openai-codex/*` in Primärmodellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen und Sitzungsrouten-Pins; `--fix` schreibt sie zu `openai/*` um und wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat. Andernfalls wird `agentRuntime.id: "pi"` ausgewählt.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Services, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen nach Best Practices (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Tokengenerierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Gerätetoken-Cache und Authentifizierungsdrift bei Pairing-Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Warnungen bei Kürzung/nahe Grenzwert für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standard-Agent; meldet erlaubte Skills mit fehlenden Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen der Quellinstallation (pnpm-Workspace-Nichtübereinstimmung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Rückbefüllung und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Rückbefüllen**, **Zurücksetzen** und **Fundierte Einträge löschen** für den fundierten Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im doctor-Stil, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Rückbefüllen** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den fundierten REM-Tagebuchdurchlauf aus und schreibt reversible Rückbefüllungseinträge in `DREAMS.md`.
- **Zurücksetzen** entfernt nur diese markierten Rückbefüllungs-Tagebucheinträge aus `DREAMS.md`.
- **Fundierte Einträge löschen** entfernt nur bereitgestellte, ausschließlich fundierte Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung gesammelt haben.

Was sie für sich allein **nicht** tun:

- Sie bearbeiten `MEMORY.md` nicht
- Sie führen keine vollständigen doctor-Migrationen aus
- Sie stellen fundierte Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher ein, es sei denn, Sie führen zuerst ausdrücklich den bereitgestellten CLI-Pfad aus

Wenn die fundierte historische Wiedergabe die normale Deep-Promotion-Bahn beeinflussen soll, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Damit werden fundierte dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereitgestellt, während `DREAMS.md` die Prüffläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor der Ausführung von doctor ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Flachfelder von Talk. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt Legacy-Echtzeitselektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) nach `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools
    aus Plugins überein, die tatsächlich geladen werden; es umgeht nicht die exklusive Plugin-
    Allowlist. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um das vorhandene Verhalten gebündelter Provider zu erhalten, und
    verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Cron-Job-Speichermigrationen werden ebenfalls von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurierte Channel-Konfigurationen ohne sichtbare Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Für Channels mit benannten `accounts`, aber verbleibenden Single-Account-Channel-Werten auf oberster Ebene, verschieben Sie diese konto-bezogenen Werte in das hochgestufte Konto, das für diesen Channel ausgewählt wurde (`accounts.default` für die meisten Channels; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung für die Extension)
    - veraltete `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zu Konto-Standardwerten für Multi-Account-Channels:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Extension-Pfad verweist, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für Standardprofile mit automatischer Verbindung auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Inspect-Seite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway/Node-Host
    - den lokal ausgeführten Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - die Bestätigung der ersten Attach-Zustimmungsaufforderung im Browser

    Bereitschaft bezieht sich hier nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Routenlimits von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Anleitung zur Behebung aus. Unter macOS mit einem Homebrew-Node lautet die Behebung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können sie den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Versionen automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth erkannt werden, damit Sie die veraltete Transportüberschreibung entfernen oder neu schreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Native Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen plus `agentRuntime.id: "codex"`, sodass der Turn durch das Codex-App-Server-Harness statt durch den OpenClaw-PI-OpenAI-Pfad läuft.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Standard-Agent- und Pro-Agent-Referenzen um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Channel-Modellüberschreibungen und veraltetem persistiertem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die passende Agent-Laufzeit wird nur dann zu `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat.
    - Andernfalls wird die passende Agent-Laufzeit zu `agentRuntime.id: "pi"`.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Pro-Modell-Einstellungen werden vom veralteten Schlüssel zum kanonischen `openai/*`-Schlüssel verschoben.
    - Persistierte Sitzungs-`modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise, Auth-Profil-Pins und Codex-Harness-Pins werden in allen erkannten Agent-Sitzungsspeichern repariert.
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor durchsucht außerdem erkannte Agent-Sitzungsspeicher nach veraltetem automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder Runtime von einer Plugin-eigenen Route wie Codex weg verschieben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modell-Pins, Runtime-Modellmetadaten, angepinnte Harness-IDs, CLI-Sitzungsbindungen und automatische Auth-Profil-Überschreibungen löschen, wenn ihre besitzende Route nicht mehr konfiguriert ist. Explizite Benutzer- oder veraltete Sitzungsmodell-Auswahlen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Status (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Der Gateway/die CLI migriert außerdem den veralteten Sitzungsspeicher + das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im Pro-Agent-Pfad landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte hat, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor prüft außerdem den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliase → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den alten Notify-Fallback mit einem bestehenden Nicht-Webhook-Auslieferungsmodus kombiniert, gibt Doctor eine Warnung aus und lässt diesen Job zur manuellen Prüfung unverändert.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers noch das alte `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird vom aktuellen OpenClaw nicht gepflegt und kann fälschlicherweise `Gateway inactive`-Meldungen in `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Integritätsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Sperrdateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Branches">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Form, die durch den Fehler beim Prompt-Transkript-Rewrite vom 2026.4.24 erzeugt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwister-Branch mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist das operative Stammhirn. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Protokolle und Konfiguration (sofern Sie keine Sicherungen an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
    - **macOS-cloudsynchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade langsamere I/O und Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da zufällige I/O auf SD- oder eMMC-Speicher bei Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Store-Verzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (der Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf eine andere Stelle zeigt (der Verlauf kann sich zwischen Installationen aufteilen).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (dort liegt der Zustand).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, sie auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Integrität der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Auth-Store, warnt, wenn Token bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Tokenprofil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider fordert Sie auf, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht verwendbar sind aufgrund von:

    - kurzen Abklingzeiten (Ratenbegrenzungen/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Validierung des Hooks-Modells">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, zu bauen oder zu alten Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` alten von OpenClaw erzeugten Staging-Zustand für Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für gebündelte Plugin-Abhängigkeiten sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration darauf verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen vermeidet Doctor die Ausführung einer Paketmanager-Plugin-Reparatur, während das Kernpaket ausgetauscht wird; führen Sie nach der Aktualisierung erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsarbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt alte Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen gatewayähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Migration der Startmatrix">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare Migration des alten Zustands hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt anschließend die Best-Effort-Migrationsschritte aus: Migration des alten Matrix-Zustands und Vorbereitung des alten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor untersucht nun den Zustand der Gerätekopplung als Teil des normalen Integritätsdurchlaufs.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
    - gekoppelte Datensätze ohne aktives Token für eine genehmigte Rolle
    - gekoppelte Token, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für den aktuellen Rechner, die vor einer gatewayseitigen Tokenrotation liegen oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetoken nicht automatisch. Stattdessen gibt er die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“: Doctor unterscheidet nun erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn er als systemd-Benutzerdienst ausgeführt wird, stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und alte Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, Anforderungen-fehlende und durch Allowlist blockierte Skills.
    - **Alte Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnosen**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Dateien">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten Zeichenbudget liegen. Er meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es außerdem die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Startschleifen, bei denen die Kanallaufzeit entfernt ist, die Konfiguration das Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, regeneriert Doctor den Cache automatisch.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Tokenmodus ein Token benötigt und keine Tokenquelle existiert, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-fast-Verhalten zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn der Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder den Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung + Neustart">
    Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Wenn nicht, werden Reparaturhinweise einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, wenn er fehlt.
    - **Auto-Provider**: prüft zuerst die Verfügbarkeit des lokalen Modells und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Probe-Ergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den tiefen Speicherstatusbefehl, wenn Sie eine Live-Provider-Prüfung wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt doctor eine Kanalstatus-Probe aus und meldet Warnungen mit empfohlenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsaudit + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt doctor ein Update und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Es meldet weiterhin die Serviceintegrität und führt Nicht-Service-Reparaturen aus, überspringt aber Serviceinstallation/-start/-neustart/-bootstrap, Umschreibungen der Supervisor-Konfiguration und die Bereinigung älterer Services, weil ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt doctor Befehls-/Entrypoint-Metadaten nicht um, solange die zugehörige systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive zusätzliche nicht-legacy gatewayähnliche Units beim Scan nach doppelten Services, damit begleitende Servicedateien keinen Bereinigungsrauschen erzeugen.
    - Wenn Token-Authentifizierung einen Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die doctor-Serviceinstallation/-reparatur den SecretRef, persistiert aber keine aufgelösten Klartext-Tokenwerte in Supervisor-Service-Umgebungsmetadaten.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Serviceumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Servicemetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` noch einen alten `--port` festlegt, und schreibt die Servicemetadaten auf den aktuellen Port um.
    - Wenn Token-Authentifizierung einen Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-user-systemd-Units berücksichtigen doctor-Token-Drift-Prüfungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Service-Auth-Metadaten.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber tatsächlich nicht läuft. Außerdem wird auf Portkollisionen am Gateway-Port (Standard `18789`) geprüft und es werden wahrscheinliche Ursachen gemeldet (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Versionsmanager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn sie verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren. Dadurch ändern Volta, asdf, fnm, pnpm und andere Versionsmanager-Verzeichnisse nicht, welche Node-Kindprozesse auflösen. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile user-bin-Verzeichnisse bei, aber erratene Versionsmanager-Fallback-Verzeichnisse werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreibvorgang + Wizard-Metadaten">
    Doctor persistiert alle Konfigurationsänderungen und stempelt Wizard-Metadaten, um den doctor-Lauf zu protokollieren.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
