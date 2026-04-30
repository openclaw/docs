---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung von inkompatiblen Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-04-30T06:53:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen und Zustände, prüft die Integrität und stellt umsetzbare Reparaturschritte bereit.

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

    Standardwerte ohne Nachfrage akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, sofern zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Nachfrage anwenden (Reparaturen und Neustarts, wo sicher).

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

    Ohne Nachfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Zustandsverschiebungen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
    - Optionales Pre-Flight-Update für Git-Installationen (nur interaktiv).
    - Prüfung der UI-Protokollaktualität (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Integritätsprüfung und Neustartabfrage.
    - Skills-Statuszusammenfassung (berechtigt/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flachfeldern `talk.*` nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI Codex-OAuth-Profile.
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, oberste delivery-/payload-Felder, payload-`provider`, einfache `notify: true` Webhook-Fallback-Jobs).
    - Migration der Legacy-Agent-Laufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfiguration, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Zustandsintegritäts- und Berechtigungsprüfungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Modell-Auth-Integrität: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Auth-Profil-Cooldown-/Deaktiviert-Zustände.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Dienstmigration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Dienste, die bei Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Best-Practice-Prüfungen der Gateway-Laufzeit (Node vs. Bun, Version-Manager-Pfade).
    - Diagnose von Gateway-Port-Konflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Auth-Prüfungen für den lokalen Tokenmodus (bietet Tokengenerierung an, wenn keine Tokenquelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Abweichungen im veralteten lokalen Geräte-Token-Cache und Auth-Abweichungen bei gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Prüfung der Dateigröße von Workspace-Bootstrap-Dateien (Warnungen bei Abschneidung/nahem Limit für Kontextdateien).
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Konflikt, fehlende UI-Assets, fehlende tsx-Binärdatei).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und -Zurücksetzung

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den geerdeten Dreaming-Workflow. Diese Aktionen verwenden doctor-artige RPC-Methoden des Gateways, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich geerdete Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen doctor-Migrationen aus
- sie stellen geerdete Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, sofern Sie nicht zuerst ausdrücklich den bereitgestellten CLI-Pfad ausführen

Wenn geerdete historische Wiedergabe die normale Deep-Promotion-Lane beeinflussen soll, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Damit werden geerdete dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereitgestellt, während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es an, vor dem Ausführen von doctor zu aktualisieren (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Flachfelder von Talk. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuellen Eingriff repariert werden. Cron-Job-Speichermigrationen werden von `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → oberstes `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - Legacy-`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Für Kanäle mit benannten `accounts`, aber verbleibenden einkontoartigen Kanalwerten auf oberster Ebene, diese kontobezogenen Werte in das für diesen Kanal hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/standardmäßiges Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (Legacy-Einstellung für Erweiterungs-Relay)
    - Legacy-`models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten auch Hinweise zum Kontostandard für Mehrkontokanäle:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt doctor und listet konfigurierte Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie den Override entfernen und API-Routing sowie Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer Verbindung installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren, zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser ab Version 144 auf dem Gateway-/Node-Host
    - den lokal laufenden Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - die Bestätigung der ersten Attach-Zustimmungsaufforderung im Browser

    Die Bereitschaft hier bezieht sich nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker, Sandbox, Remote-Browser oder andere Headless-Flows. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt, zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat, gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Lösung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor alte OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth gefunden werden, damit Sie den veralteten Transport-Override entfernen oder neu schreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Plugin-Routenwarnungen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft Doctor außerdem, ob primäre Modell-Refs vom Typ `openai-codex/*` weiterhin über den Standard-PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnementauthentifizierung über PI verwenden möchten, kann aber leicht mit dem nativen Codex-App-Server-Harness verwechselt werden. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, da beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet „Codex-OAuth-/Abonnementauthentifizierung über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `runtime: "codex"` bedeutet „den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden.“

    Wenn die Warnung erscheint, wählen Sie die beabsichtigte Route und bearbeiten Sie die Konfiguration manuell. Lassen Sie die Warnung unverändert, wenn PI Codex OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen von Legacy-Zustand (Festplattenlayout)">
    Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungszustand (Baileys):
      - von Legacy-`~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn Legacy-Ordner als Sicherungen zurückbleiben. Der Gateway/die CLI migriert außerdem die Legacy-Sitzungen und das Agent-Verzeichnis beim Start automatisch, damit Verlauf, Authentifizierung und Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen von Legacy-Plugin-Manifesten">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt zu überschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen von Legacy-Cron-Speichern">
    Doctor prüft außerdem den Cron-Aufgabenspeicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Aufgabenformen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliase → explizites `delivery.channel`
    - einfache Legacy-`notify: true`-Webhook-Fallback-Aufgaben → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Aufgaben nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn eine Aufgabe einen Legacy-Benachrichtigungs-Fallback mit einem vorhandenen Nicht-Webhook-Zustellungsmodus kombiniert, warnt Doctor und lässt diese Aufgabe zur manuellen Prüfung unverändert.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien – Dateien, die zurückbleiben, wenn eine Sitzung ungewöhnlich beendet wurde. Für jede gefundene Sperrdatei meldet Doctor: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt Doctor veraltete Sperrdateien automatisch; andernfalls gibt Doctor einen Hinweis aus und weist Sie an, erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Zweigen">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Zweigform, die durch den Prompt-Transkript-Rewrite-Bug vom 2026.4.24 erstellt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwisterzweig mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Zweig um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen für Zustand (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Protokolle und Konfiguration (sofern Sie keine Sicherungen an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert Sie auf, das Verzeichnis neu zu erstellen, und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: verifiziert Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Eigentümer-/Gruppenabweichung erkannt wird).
    - **macOS-Zustandsverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierte Pfade langsamere I/O und Sperr-/Synchronisierungsrennen verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Abweichung**: warnt, wenn aktuelle Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort verweist (Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, Doctor auf dem Remote-Host auszuführen (der Zustand lebt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, sie auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Auth-Zustand (OAuth-Ablauf)">
    Doctor inspiziert OAuth-Profile im Auth-Speicher, warnt, wenn Token bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt Doctor einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt, zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden, meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakt auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht verwendbar sind aufgrund von:

    - kurzen Cooldowns (Ratenlimits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Validierung des Hooks-Modells">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder auf Legacy-Namen umzuschalten, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Laufzeitabhängigkeiten gebündelter Plugins">
    Doctor verifiziert Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der aktuellen Konfiguration aktiv sind oder durch ihren gebündelten Manifeststandard aktiviert werden, zum Beispiel `plugins.entries.discord.enabled: true`, Legacy-`channels.discord.enabled: true`, konfigurierte `models.providers.*`-/Agent-Modell-Refs oder ein standardmäßig aktiviertes gebündeltes Plugin ohne Provider-Eigentümerschaft. Wenn welche fehlen, meldet Doctor die Pakete und installiert sie im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin `openclaw plugins install` / `openclaw plugins update`; Doctor installiert keine Abhängigkeiten für beliebige Plugin-Pfade.

    Während der Doctor-Reparatur melden gebündelte npm-Installationen von Laufzeitabhängigkeiten in TTY-Sitzungen Spinner-Fortschritt und in umgeleiteter/headless Ausgabe regelmäßigen Zeilenfortschritt. Der Gateway und die lokale CLI können aktive gebündelte Plugin-Laufzeitabhängigkeiten auch bei Bedarf reparieren, bevor ein gebündeltes Plugin importiert wird. Diese Installationen sind auf den Installations-Root der Plugin-Laufzeitumgebung beschränkt, laufen mit deaktivierten Skripten, schreiben keine Package-Lock-Datei und werden durch eine Installations-Root-Sperre geschützt, sodass gleichzeitige CLI- oder Gateway-Starts denselben `node_modules`-Baum nicht gleichzeitig verändern.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Außerdem kann Doctor nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein externer System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Migration der Startup-Matrix">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare Legacy-Zustandsmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Legacy-Vorbereitung verschlüsselter Zustände. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsdrift">
    Doctor prüft jetzt den Gerätekopplungszustand als Teil des normalen Health-Passes.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr dem genehmigten Eintrag entspricht
    - gekoppelte Einträge, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokale zwischengespeicherte Geräte-Token-Einträge für die aktuelle Maschine, die älter sind als eine gatewayseitige Token-Rotation oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen werden die exakten nächsten Schritte ausgegeben:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Eintrag mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch wird die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“ geschlossen: Doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitätsdrift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist geöffnet ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn Doctor als systemd-Benutzerdienst ausgeführt wird, stellt er sicher, dass Lingering aktiviert ist, damit der Gateway nach dem Abmelden aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete Skills, Skills mit fehlenden Anforderungen und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Bundle-Plugin-Fähigkeiten.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeitumgebung haben.
    - **Plugin-Diagnosen**: zeigt alle Ladezeit-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Datei">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder dieses überschreiten. Er meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die insgesamt injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwies: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Das verhindert Gateway-Boot-Loops, bei denen die Kanal-Laufzeitumgebung nicht mehr vorhanden ist, die Konfiguration den Gateway aber weiterhin auffordert, daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, regeneriert Doctor den Cache automatisch.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur interaktiver Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell zu regenerieren.

  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu erzeugen.
    - Wenn `gateway.auth.token` durch SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeitumgebung abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Status-Family-Befehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Telegram-`allowFrom`- / `groupAllowFrom`-`@username`-Reparatur versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, im aktuellen Befehlspfad aber nicht verfügbar ist, meldet Doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Health-Check + Neustart">
    Doctor führt einen Health-Check aus und bietet an, den Gateway neu zu starten, wenn er fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob das `qmd`-Binary verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich npm-Paket und Option für einen manuellen Binary-Pfad ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Store vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, wenn er fehlt.
    - **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der Auto-Auswahlreihenfolge.

    Wenn ein zwischengespeichertes Gateway-Probe-Ergebnis verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den ausführlichen Speicherstatusbefehl, wenn Sie eine Live-Provider-Prüfung wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn der Gateway fehlerfrei ist, führt Doctor eine Kanalstatus-Probe aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsaudit + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-network-online-Abhängigkeiten und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor ein Update und kann die Dienstdatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturaufforderungen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Aufforderungen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Gateway-Dienstlebenszyklus schreibgeschützt. Doctor meldet weiterhin den Dienstzustand und führt Reparaturen aus, die keine Dienste betreffen, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap, Umschreibungen der Supervisor-Konfiguration und Legacy-Dienstbereinigung, weil ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt Doctor Befehls-/Entrypoint-Metadaten nicht um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert Doctor inaktive nicht-Legacy zusätzliche Gateway-ähnliche Units während des Duplikatdienst-Scans, damit begleitende Dienstdateien keinen Bereinigungslärm erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` durch SecretRef verwaltet wird, validiert die Doctor-Dienstinstallation/-reparatur den SecretRef, persistiert aber keine aufgelösten Klartext-Token-Werte in Supervisor-Dienstumgebungsmetadaten.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Dienstumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festlegt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-user-systemd-Units umfassen Doctors Token-Drift-Prüfungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Dienst-Authentifizierungsmetadaten.
    - Doctor-Dienstreparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber nicht tatsächlich ausgeführt wird. Außerdem prüft er auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) ausgeführt wird. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer systemweiten Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte Services behalten explizite Umgebungs-Roots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Bin-Verzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte vorhanden sind. Dadurch bleibt der generierte Supervisor-PATH mit derselben Minimal-PATH-Prüfung abgestimmt, die Doctor später ausführt.

  </Accordion>
  <Accordion title="18. Konfigurationsschreibvorgang + Assistentenmetadaten">
    Doctor speichert alle Konfigurationsänderungen dauerhaft und versieht die Assistentenmetadaten mit einem Zeitstempel, um den Doctor-Lauf zu protokollieren.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git verwaltet wird.

    Eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab) finden Sie unter [/concepts/agent-workspace](/de/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
