---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung inkompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-04-30T16:28:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Systemintegrität und stellt umsetzbare Reparaturschritte bereit.

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

    Standardwerte ohne Rückfragen akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, falls zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Rückfragen anwenden (Reparaturen und Neustarts, sofern sicher).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
  <Accordion title="Integrität, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - Prüfung der Aktualität des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
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
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, oberste delivery/payload-Felder, payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agenten-Laufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfiguration, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inaktive Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Branches, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für blockierte Subagent-Neustartwiederherstellung, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungsflags, damit der Start das Kind nicht weiterhin als restart-aborted behandelt.
    - Zustandsintegritäts- und Berechtigungsprüfungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfung der Konfigurationsdateiberechtigungen (chmod 600) bei lokaler Ausführung.
    - Modell-Auth-Integrität: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/deaktivierte Zustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (aus dem laufenden Gateway geprüft).
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Best-Practice-Prüfungen für die Gateway-Laufzeit (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, Sicherheit und Kopplung">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Auth-Prüfungen für lokalen Tokenmodus (bietet Token-Erstellung an, wenn keine Tokenquelle existiert; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Abweichungen im lokalen Geräte-Token-Cache und Auth-Abweichungen in Kopplungsdatensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-linger-Prüfung unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Warnungen bei Kürzung/Annäherung an Grenzwerte für Kontextdateien).
    - Prüfung des Shell-Completion-Status und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Source-Installationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Control-UI-Dreams-Szene enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden doctor-ähnliche RPC-Methoden des Gateways, sind aber **kein** Teil der Reparatur/Migration der CLI `openclaw doctor`.

Was sie tun:

- **Backfill** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Tagebuchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich grounded Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder täglichen Support angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen doctor-Migrationen aus
- sie stellen Grounded-Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher, sofern Sie nicht zuerst explizit den bereitgestellten CLI-Pfad ausführen

Wenn die historische Grounded-Wiedergabe die normale Deep-Promotion-Lane beeinflussen soll, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt Grounded-Durable-Kandidaten in den Kurzzeit-Dreaming-Speicher, während `DREAMS.md` als Prüffläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es an, vor der Ausführung von doctor zu aktualisieren (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören alte flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt doctor-Migrationen beim Start außerdem automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuellen Eingriff repariert werden. Migrationen des Cron-Job-Speichers werden von `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → oberste Ebene `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Bei Kanälen mit benannten `accounts`, aber verbleibenden einkontoartigen Kanalwerten auf oberster Ebene werden diese kontospezifischen Werte in das für diesen Kanal gewählte hochgestufte Konto verschoben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (Legacy-Relay-Einstellung der Erweiterung)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zu Account-Defaults für Multi-Account-Kanäle:

    - Wenn zwei oder mehr Einträge für `channels.<channel>.accounts` ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet konfigurierte Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und API-Routing sowie Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Anbindungsmodell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für standardmäßige Auto-Connect-Profile auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspektionsseite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser ab Version 144 auf dem Gateway/Node-Host
    - dass der Browser lokal läuft
    - aktiviertes Remote-Debugging in diesem Browser
    - Bestätigung der ersten Anbindungs-Zustimmungsaufforderung im Browser

    Bereitschaft bezieht sich hier nur auf lokale Anbindungsvoraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Korrekturhinweise aus. Unter macOS mit Homebrew-Node ist die Korrektur üblicherweise `brew postinstall ca-certificates`. Mit `--deep` läuft die Prüfung auch dann, wenn das Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor alte OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können sie den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn er diese alten Transporteinstellungen zusammen mit Codex OAuth sieht, damit Sie die veraltete Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Plugin-Routenwarnungen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft Doctor außerdem, ob primäre Modellreferenzen vom Typ `openai-codex/*` weiterhin über den standardmäßigen PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnementauthentifizierung über PI verwenden möchten, kann aber leicht mit dem nativen Codex-App-Server-Harness verwechselt werden. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, weil beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet „Codex-OAuth-/Abonnementauthentifizierung über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `runtime: "codex"` bedeutet „den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden.“

    Wenn die Warnung erscheint, wählen Sie die beabsichtigte Route und bearbeiten Sie die Konfiguration manuell. Lassen Sie die Warnung unverändert, wenn PI-Codex-OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Legacy-Zustandsmigrationen (Datenträgerlayout)">
    Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agentenverzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungszustand (Baileys):
      - von altem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

    Diese Migrationen sind Best-Effort und idempotent; Doctor gibt Warnungen aus, wenn Legacy-Ordner als Backups zurückbleiben. Das Gateway/CLI migriert außerdem die alten Sitzungen und das Agentenverzeichnis beim Start automatisch, sodass Verlauf/Authentifizierung/Modelle ohne manuellen Doctor-Lauf im Agentenpfad landen. WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt anhand struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Legacy-Plugin-Manifestmigrationen">
    Doctor scannt alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet er an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Legacy-Cron-Speichermigrationen">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellaliasse → explizites `delivery.channel`
    - einfache alte `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job alten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und lässt diesen Job zur manuellen Prüfung unverändert.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor scannt jedes Agenten-Sitzungsverzeichnis nach veralteten Schreibsperrdateien – Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Sperrdateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, den Befehl erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Branches">
    Doctor scannt Agenten-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Form, die durch den Prompt-Transkript-Umschreibungsfehler vom 2026.4.24 erzeugt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwister-Branch mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Zustandsintegritätsprüfungen (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: verifiziert Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Zustandsverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, weil synchronisationsgestützte Pfade langsamere I/O und Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn aktuelle Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (Verlauf kann sich zwischen Installationen aufteilen).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand befindet sich dort).
    - **Konfigurationsdateiberechtigungen**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, die Berechtigungen auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Authentifizierungsstatus (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Authentifizierungsspeicher, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider, der Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die vorübergehend nicht nutzbar sind aufgrund von:

    - kurzen Cooldowns (Ratenlimits/Zeitüberschreitungen/Authentifizierungsfehlern)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehlern)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht zugelassen ist.
  </Accordion>
  <Accordion title="7. Sandbox-Image-Reparatur">
    Wenn Sandboxing aktiviert ist, prüft doctor Docker-Images und bietet an, sie zu bauen oder zu Legacy-Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Laufzeitabhängigkeiten gebündelter Plugins">
    Doctor überprüft Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der aktuellen Konfiguration aktiv sind oder durch ihren gebündelten Manifest-Standard aktiviert werden, zum Beispiel `plugins.entries.discord.enabled: true`, das Legacy-`channels.discord.enabled: true`, konfigurierte `models.providers.*` / Agent-Modellreferenzen oder ein standardmäßig aktiviertes gebündeltes Plugin ohne Provider-Zuständigkeit. Falls welche fehlen, meldet doctor die Pakete und installiert sie im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin `openclaw plugins install` / `openclaw plugins update`; doctor installiert keine Abhängigkeiten für beliebige Plugin-Pfade.

    Während der doctor-Reparatur melden npm-Installationen gebündelter Laufzeitabhängigkeiten Spinner-Fortschritt in TTY-Sitzungen und periodischen Zeilenfortschritt in weitergeleiteten/headless Ausgaben. Der Gateway und die lokale CLI können aktive Laufzeitabhängigkeiten gebündelter Plugins außerdem bei Bedarf reparieren, bevor ein gebündeltes Plugin importiert wird. Diese Installationen sind auf das Installationsstammverzeichnis der Plugin-Laufzeitumgebung beschränkt, laufen mit deaktivierten Skripten, schreiben keinen Package-Lock und werden durch eine Installationsstamm-Sperre geschützt, sodass gleichzeitige CLI- oder Gateway-Starts nicht denselben `node_modules`-Baum zur selben Zeit verändern.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, und entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare Legacy-Zustandsmigration hat, erstellt doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt anschließend die bestmöglichen Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Vorbereitung des verschlüsselten Legacy-Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Abweichung">
    Doctor prüft jetzt den Gerätekopplungsstatus als Teil des normalen Health-Durchlaufs.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr dem genehmigten Datensatz entspricht
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für die aktuelle Maschine, die vor einer Gateway-seitigen Token-Rotation liegen oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Stattdessen gibt er die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber weiterhin Kopplung erforderlich“: doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veralteten Token-/Geräteidentitäts-Abweichungen.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider für Direktnachrichten ohne Allowlist offen ist oder wenn eine Policy gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn die Ausführung als systemd-Benutzerdienst erfolgt, stellt doctor sicher, dass Linger aktiviert ist, damit der Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Status für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, fehlende Anforderungen und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeitumgebung haben.
    - **Plugin-Diagnose**: zeigt alle Ladezeit-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Bootstrap-Dateigröße">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder dieses überschreiten. Er meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und insgesamt injizierte Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt doctor Tipps zur Anpassung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Boot-Schleifen, bei denen die Kanallaufzeitumgebung verschwunden ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, generiert doctor den Cache automatisch neu.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert doctor zur Installation auf (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeitumgebung abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Status-Befehlsfamilien für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Health-Check + Neustart">
    Doctor führt einen Health-Check aus und bietet an, den Gateway neu zu starten, wenn er nicht gesund wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob das `qmd`-Binary verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich des npm-Pakets und einer manuellen Binary-Pfadoption ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, falls er fehlt.
    - **Auto-Provider**: prüft zuerst die lokale Modellverfügbarkeit und versucht dann jeden Remote-Provider in der automatischen Auswahlreihenfolge.

    Wenn ein zwischengespeichertes Gateway-Probeergebnis verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung gesund), gleicht doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den ausführlichen Speicherstatusbefehl, wenn Sie eine Live-Provider-Prüfung wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn der Gateway gesund ist, führt doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsaudit + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standards (z. B. systemd-network-online-Abhängigkeiten und Neustartverzögerung). Wenn er eine Abweichung findet, empfiehlt er ein Update und kann die Dienstdatei/Aufgabe auf die aktuellen Standards umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration neu geschrieben wird.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Dienstlebenszyklus schreibgeschützt. Es meldet weiterhin die Dienstintegrität und führt Reparaturen aus, die keine Dienste betreffen, überspringt jedoch Dienstinstallation/-start/-neustart/-bootstrap, das Neuschreiben der Supervisor-Konfiguration und die Bereinigung veralteter Dienste, da ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt doctor Befehls-/Einstiegspunkt-Metadaten nicht neu, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units beim Scan auf doppelte Dienste, sodass begleitende Dienstdateien kein Bereinigungsrauschen erzeugen.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Doctor-Dienstinstallation/-Reparatur die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Dienstumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows Scheduled Task-Installationen inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach einer Änderung von `gateway.port` noch einen alten `--port` festlegt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit handlungsorientierten Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-User-systemd-Units beziehen Doctor-Prüfungen auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen ein, wenn Dienst-Auth-Metadaten verglichen werden.
    - Doctor-Dienstreparaturen verweigern das Neuschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit über `openclaw gateway install --force` ein vollständiges Neuschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Dienstlaufzeit (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber nicht tatsächlich läuft. Es prüft außerdem auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst unter Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer systemweiten Node-Installation zu migrieren, wenn sie verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte Dienste behalten explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Bin-Verzeichnisse bei, aber erratene Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Dienst-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte vorhanden sind. Dadurch bleibt der generierte Supervisor-PATH an der gleichen Minimal-PATH-Prüfung ausgerichtet, die doctor später ausführt.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen dauerhaft und versieht Wizard-Metadaten mit einem Zeitstempel, um den Doctor-Lauf zu dokumentieren.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace nicht bereits unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zu git-Backups (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
