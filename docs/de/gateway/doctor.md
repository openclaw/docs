---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführen nicht abwärtskompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen und Zustände, prüft den Zustand und bietet umsetzbare Reparaturschritte.

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

    Empfohlene Reparaturen ohne Nachfrage anwenden (Reparaturen und Neustarts, wenn sicher).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen des Zustands auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
  <Accordion title="Zustand, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - UI-Protokoll-Aktualitätsprüfung (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung und Neustartabfrage.
    - Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flachfeldern `talk.*` zu `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Zulassungsliste, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcard- oder Plugin-eigene Tools anfordert.
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
    - Migration von Legacy-Plugin-Manifestvertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Felder für Zustellung/Payload auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agentenlaufzeitrichtlinie zu `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Branches, die von betroffenen Builds vom 2026-04-24 erstellt wurden.
    - Erkennung von Tombstones zur Neustart-Wiederherstellung festhängender Subagents, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungs-Flags, damit der Start den Child nicht weiterhin als neustartabgebrochen behandelt.
    - Integritäts- und Berechtigungsprüfungen für den Zustand (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen für Konfigurationsdateien (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Authentifizierungsprofilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Dienstmigration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen für bewährte Verfahren (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für lokalen Token-Modus (bietet Token-Erzeugung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Scope-Upgrades, Drift veralteter lokaler Geräte-Token-Caches und Authentifizierungsdrift gekoppelter Datensätze).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Warnungen zu Kürzung/nahe Grenzwerten für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standardagenten; meldet erlaubte Skills mit fehlenden Binaries, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Assistentenmetadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den geerdeten Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im Stil von doctor, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, rein geerdete Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie allein **nicht** tun:

- Sie bearbeiten `MEMORY.md` nicht
- Sie führen keine vollständigen doctor-Migrationen aus
- Sie stellen geerdete Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, sofern Sie nicht zuerst explizit den bereitgestellten CLI-Pfad ausführen

Wenn Sie möchten, dass geerdete historische Wiedergabe die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt geerdete dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereit, während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor dem Ausführen von doctor ein Update (fetch/rebase/build) an.
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Flachfelder von Talk. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` entspricht nur Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht nicht die exklusive Plugin-
    Zulassungsliste.

  </Accordion>
  <Accordion title="2. Legacy-Konfigurationsschlüssel-Migrationen">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt doctor-Migrationen beim Start außerdem automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden. Cron-Job-Speichermigrationen werden von `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - Configs konfigurierter Channels ohne sichtbare Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltetes `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Bei Channels mit benannten `accounts`, aber verbleibenden Top-Level-Channel-Werten für ein einzelnes Konto, verschieben Sie diese kontospezifischen Werte in das für diesen Channel ausgewählte hochgestufte Konto (`accounts.default` für die meisten Channels; Matrix kann ein vorhandenes passendes benanntes/Standard-Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt auch Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Multi-Account-Channels:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie das Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer Verbindung installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway/Node-Host
    - den lokal laufenden Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - das Bestätigen der ersten Attach-Zustimmungsaufforderung im Browser

    Die Bereitschaft hier bezieht sich nur auf Voraussetzungen für lokales Attach. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Behebung üblicherweise `brew postinstall ca-certificates`. Mit `--deep` läuft die Prüfung auch dann, wenn der Gateway gesund ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth gefunden werden, damit Sie das veraltete Transport-Override entfernen oder neu schreiben und das integrierte Routing-/Fallback-Verhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Plugin-Routenwarnungen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft Doctor außerdem, ob primäre Modellreferenzen für `openai-codex/*` noch über den Standard-PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnement-Auth über PI verwenden möchten, kann aber leicht mit dem nativen Codex-App-Server-Harness verwechselt werden. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, da beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet „Codex-OAuth-/Abonnement-Auth über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `agentRuntime.id: "codex"` bedeutet „den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden.“

    Wenn die Warnung angezeigt wird, wählen Sie die beabsichtigte Route und bearbeiten Sie die Konfiguration manuell. Lassen Sie die Warnung unverändert, wenn PI-Codex-OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Festplattenlayout)">
    Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Status (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Gateway/CLI migrieren außerdem automatisch den veralteten Sitzungsspeicher + das Agent-Verzeichnis beim Start, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass reine Key-Order-Diffs keine wiederholten No-Op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor scannt alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt zu überschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellaliasse → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den veralteten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und lässt diesen Job zur manuellen Prüfung unverändert.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers noch das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses host-lokale Skript wird vom aktuellen OpenClaw nicht gepflegt und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-User-Bus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health Checks.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien – Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet es: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und weist Sie an, den Befehl erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur des Sitzungstranskript-Branches">
    Doctor durchsucht Agent-Sitzungsdateien im JSONL-Format nach der duplizierten Branch-Form, die durch den Fehler beim Prompt-Transkript-Rewrite vom 24.4.2026 erzeugt wurde: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext sowie ein aktiver Geschwister-Branch mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Leser keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen für den Zustand (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfiguration (sofern Sie keine Sicherungen an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert dazu auf, das Verzeichnis neu zu erstellen, und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: verifiziert die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Zustandsverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade langsamere E/A sowie Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da zufällige E/A auf SD- oder eMMC-Speicher unter Sitzungs- und Anmeldedaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` an einen anderen Ort zeigt (Verlauf kann sich zwischen Installationen aufteilen).
    - **Hinweis zum Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, es auf dem Remote-Host auszuführen (der Zustand liegt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Zustand der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Authentifizierungsspeicher, warnt, wenn Tokens bald ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Tokenprofil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakt auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die vorübergehend nicht nutzbar sind aufgrund von:

    - kurzen Abklingzeiten (Rate Limits/Zeitüberschreitungen/Authentifizierungsfehlern)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehlern)

  </Accordion>
  <Accordion title="6. Modellvalidierung für Hooks">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Reparatur von Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder auf Legacy-Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` von OpenClaw erzeugten Legacy-Staging-Zustand für Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Abhängigkeitswurzeln, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann außerdem konfigurierte herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie aber nicht finden kann. Für die Externalisierung gebündelter Plugins am 2.5.2026 installiert Doctor automatisch herunterladbare Plugins, die von der bestehenden Konfiguration bereits verwendet werden, und verlässt sich dann auf `meta.lastTouchedVersion`, damit dieser Release-Durchlauf nur einmal ausgeführt wird. Gateway-Start und Neuladen der Konfiguration führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsarbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Es kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

    Unter Linux installiert Doctor keinen zweiten Dienst auf Benutzerebene automatisch, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder handlungsrelevante Legacy-Zustandsmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Vorbereitung des verschlüsselten Legacy-Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsabweichung">
    Doctor prüft jetzt den Gerätekopplungszustand als Teil des normalen Zustandsdurchlaufs.

    Was es meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr dem genehmigten Datensatz entspricht
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokale zwischengespeicherte Geräte-Token-Einträge für den aktuellen Rechner, die älter sind als eine Gateway-seitige Token-Rotation oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen gibt es die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“: Doctor unterscheidet nun erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veralteten Token-/Geräteidentitätsabweichungen.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist geöffnet ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Wenn die Ausführung als systemd-Benutzerdienst erfolgt, stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt zulässige Skills, Skills mit fehlenden Anforderungen und durch die Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Funktionen von Bundle-Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnose**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Datei">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten Zeichenbudget liegen. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Anpassung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalspezifische Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Boot-Loops, bei denen die Kanallaufzeit verschwunden ist, die Konfiguration das Gateway aber weiterhin auffordert, daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt, generiert Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur interaktiver Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn keine Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Status-Family-Befehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Telegram-Reparatur von `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung + Neustart">
    Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standardagenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die Binärdatei `qmd` verfügbar und startbar ist. Falls nicht, werden Hinweise zur Behebung ausgegeben, einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
    - **Auto-Provider**: Prüft zuerst die Verfügbarkeit des lokalen Modells und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Ergebnis einer Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den tiefgehenden Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatus-Warnungen">
    Wenn das Gateway fehlerfrei ist, führt Doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Behebungen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsaudit + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standards (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor eine Aktualisierung und kann die Servicedatei/Aufgabe auf die aktuellen Standards umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Behebungen ohne Nachfragen an.
    - `openclaw doctor --repair --force` überschreibt angepasste Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Servicezustand wird weiterhin gemeldet und Nicht-Service-Reparaturen werden ausgeführt, aber Serviceinstallation/-start/-neustart/-bootstrap, Umschreiben der Supervisor-Konfiguration und Bereinigung veralteter Services werden übersprungen, da ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt Doctor Befehls-/Einstiegspunkt-Metadaten nicht um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert Doctor inaktive zusätzliche nicht-veraltete Gateway-ähnliche Units während der Suche nach doppelten Services, damit begleitende Servicedateien keinen Bereinigungsrauschen erzeugen.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` von SecretRef verwaltet wird, validiert die Doctor-Serviceinstallation/-reparatur die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Service-Umgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Servicemetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festlegt, und schreibt die Servicemetadaten auf den aktuellen Port um.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus ausdrücklich gesetzt ist.
    - Für Linux-user-systemd-Units berücksichtigen die Token-Drift-Prüfungen von Doctor jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Auth-Metadaten.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber nicht tatsächlich läuft. Außerdem wird auf Portkonflikte am Gateway-Port (Standard `18789`) geprüft und wahrscheinliche Ursachen werden gemeldet (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades brechen, da der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, sofern verfügbar (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren. Dadurch ändern Volta, asdf, fnm, pnpm und andere Versionsmanager-Verzeichnisse nicht, welche Node-Kindprozesse aufgelöst werden. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-bin-Verzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger existieren.

  </Accordion>
  <Accordion title="18. Schreiben der Konfiguration + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht die Wizard-Metadaten mit einem Eintrag, um den Doctor-Lauf zu protokollieren.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
