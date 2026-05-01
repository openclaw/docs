---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Inkompatible Konfigurationsänderungen einführen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-01T06:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52183eaf6024eface20089f9d11143ef1e952d2488eee766dc154512f5d3c6b4
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustandsdaten, prüft den Zustand und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Rückfragen akzeptieren (einschließlich Neustart-/Dienst-/Sandbox-Reparaturschritten, falls zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Rückfragen anwenden (Reparaturen + Neustarts, wo sicher).

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

    Ohne Prompts ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung + Verschiebungen von Zustandsdaten auf dem Datenträger). Überspringt Neustart-/Dienst-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Veraltete Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
    - Aktualitätsprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung + Neustart-Prompt.
    - Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für veraltete Werte.
    - Migration der Talk-Konfiguration von veralteten flachen `talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für veraltete Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcard- oder Plugin-eigene Tools anfordert.
    - Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
    - Migration veralteter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des veralteten Cron-Speichers (`jobId`, `schedule.cron`, Zustellungs-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration veralteter Agent-Laufzeitrichtlinien nach `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen Builds 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für die Neustart-Wiederherstellung festhängender Subagents, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungs-Flags, damit der Start das Child nicht weiterhin als neustartabgebrochen behandelt.
    - Integritäts- und Berechtigungsprüfungen für Zustandsdaten (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen für Konfigurationsdateien (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Abkühl-/Deaktiviert-Zustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
    - Migration veralteter Matrix-Channel-Zustände (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Channel-Statuswarnungen (vom laufenden Gateway abgefragt).
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Dienste, die bei Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen für Best Practices (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende erstmalige Kopplungsanfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Geräte-Token-Cache und Authentifizierungsdrift bei gekoppelten Einträgen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Prüfung der Dateigröße von Workspace-Bootstrap-Dateien (Warnungen bei Kürzung/nahem Grenzwert für Kontextdateien).
    - Statusprüfung der Shell-Vervollständigung und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Konflikt, fehlende UI-Assets, fehlende tsx-Binärdatei).
    - Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Backfill und Zurücksetzen der Dreams-UI

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Zurücksetzen** und **Grounded löschen** für den quellengestützten Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im Stil von doctor, sind aber **kein** Bestandteil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den quellengestützten REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Zurücksetzen** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Grounded löschen** entfernt nur bereitgestellte, ausschließlich quellengestützte Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keine Live-Erinnerung oder tägliche Unterstützung angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen doctor-Migrationen aus
- sie stellen quellengestützte Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher, es sei denn, Sie führen zuerst ausdrücklich den bereitgestellten CLI-Pfad aus

Wenn Sie möchten, dass quellengestützte historische Wiedergabe den normalen tiefen Promotion-Pfad beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt quellengestützte dauerhafte Kandidaten in den Kurzzeit-Dreaming-Speicher, während `DREAMS.md` die Prüffläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor der doctor-Ausführung ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration veraltete Werteformen enthält (zum Beispiel `messages.ackReaction` ohne channel-spezifischen Override), normalisiert doctor sie in das aktuelle Schema.

    Das umfasst veraltete flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` entspricht nur Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-Allowlist
    nicht.

  </Accordion>
  <Accordion title="2. Migrationen veralteter Konfigurationsschlüssel">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und bitten Sie, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche veralteten Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein veraltetes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuellen Eingriff repariert werden. Migrationen des Cron-Job-Speichers werden von `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → oberste Ebene `bindings`
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
    - Verschieben Sie bei Kanälen mit benannten `accounts`, aber verbliebenen kanalweiten Werten der obersten Ebene für ein Einzelkonto, diese kontobezogenen Werte in das für diesen Kanal ausgewählte hochgestufte Konto (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standard-Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltete `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zu Standardkonten für Kanäle mit mehreren Konten:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie den Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
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

    - einen Chromium-basierten Browser 144+ auf dem Gateway/Node-Host
    - den lokal laufenden Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - Bestätigung der ersten Attach-Zustimmungsabfrage im Browser

    Bereitschaft bezieht sich hier nur auf die Voraussetzungen für lokales Attach. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI Codex-OAuth-Profil konfiguriert ist, prüft doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node lautet die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transport-Einstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Versionen automatisch verwenden. Doctor warnt, wenn es diese alten Transport-Einstellungen zusammen mit Codex OAuth sieht, damit Sie den veralteten Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Plugin-Routenwarnungen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft doctor außerdem, ob `openai-codex/*`-Primärmodellreferenzen weiterhin über den Standard-PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnement-Authentifizierung über PI verwenden möchten, kann aber leicht mit dem nativen Codex-App-Server-Harness verwechselt werden. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, weil beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet: „Codex-OAuth-/Abonnement-Authentifizierung über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `runtime: "codex"` bedeutet: „Den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet: „Eine native Codex-Unterhaltung aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet: „Den externen ACP/acpx-Adapter verwenden.“

    Wenn die Warnung angezeigt wird, wählen Sie die beabsichtigte Route und bearbeiten Sie die Konfiguration manuell. Behalten Sie die Warnung unverändert bei, wenn PI Codex OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteter Zustände (Datenträgerlayout)">
    Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Status (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Der Gateway/die CLI migriert außerdem beim Start automatisch die veralteten Sitzungen + das Agent-Verzeichnis, damit Verlauf/Auth/Modelle ohne manuellen doctor-Lauf im agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor scannt alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln der obersten Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt zu überschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Nutzlastfelder der obersten Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder der obersten Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - `provider`-Zustellungsaliasse in der Nutzlast → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job veralteten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellmodus kombiniert, warnt doctor und belässt diesen Job zur manuellen Prüfung.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor scannt jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien – Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet es: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und weist Sie an, es erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Branches">
    Doctor scannt Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Form, die durch den Fehler beim Prompt-Transkript-Rewrite vom 2026.4.24 entstanden ist: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwistereintrag mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen für den Zustand (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Statusverzeichnis fehlt**: warnt vor katastrophalem Statusverlust, fordert Sie auf, das Verzeichnis neu zu erstellen, und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Statusverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Statusverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Status unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade langsamere I/O und Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-SD- oder eMMC-Statusverzeichnis**: warnt, wenn der Status auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Anmeldedatenschreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um den Verlauf dauerhaft zu speichern und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile enthält (der Verlauf sammelt sich nicht an).
    - **Mehrere Statusverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (der Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Erinnerung für Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Status befindet sich dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/alle lesbar ist, und bietet an, die Berechtigungen auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Zustand der Modellauthentifizierung (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Auth-Speicher, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht verwendbar sind wegen:

    - kurzen Abkühlzeiten (Ratenbegrenzungen/Zeitüberschreitungen/Auth-Fehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz anhand des Katalogs und der Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, zu bauen oder auf Legacy-Namen umzuschalten, wenn das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Laufzeitabhängigkeiten gebündelter Plugins">
    Doctor prüft Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der aktuellen Konfiguration aktiv oder durch ihren gebündelten Manifest-Standard aktiviert sind, zum Beispiel `plugins.entries.discord.enabled: true`, das Legacy-`channels.discord.enabled: true`, konfigurierte `models.providers.*` / Agent-Modellreferenzen oder ein standardmäßig aktiviertes gebündeltes Plugin ohne Provider-Zuständigkeit. Wenn welche fehlen, meldet Doctor die Pakete und installiert sie im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin `openclaw plugins install` / `openclaw plugins update`; Doctor installiert keine Abhängigkeiten für beliebige Plugin-Pfade.

    Während der Doctor-Reparatur melden npm-Installationen gebündelter Laufzeitabhängigkeiten in TTY-Sitzungen Spinner-Fortschritt und in per Pipe weitergeleiteter/headless Ausgabe periodischen Zeilenfortschritt. Der Gateway und die lokale CLI können aktive gebündelte Plugin-Laufzeitabhängigkeiten außerdem bei Bedarf reparieren, bevor ein gebündeltes Plugin importiert wird. Diese Installationen sind auf das Plugin-Laufzeitinstallationsverzeichnis beschränkt, werden mit deaktivierten Skripten ausgeführt, schreiben keinen Package-Lock und werden durch eine Installationsverzeichnis-Sperre geschützt, sodass gleichzeitige CLI- oder Gateway-Starts nicht gleichzeitig denselben `node_modules`-Baum verändern.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Es kann außerdem nach zusätzlichen gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

    Unter Linux installiert Doctor keinen zweiten Dienst auf Benutzerebene automatisch, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Migration der Startup-Matrix">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Legacy-Statusmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Statusmigration und Legacy-Vorbereitung für verschlüsselten Status. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor untersucht den Status der Gerätekopplung jetzt als Teil des normalen Gesundheitsdurchlaufs.

    Was es meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Abweichungen des öffentlichen Schlüssels, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
    - gekoppelte Datensätze ohne aktives Token für eine genehmigte Rolle
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbaseline abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für die aktuelle Maschine, die älter als eine gateway-seitige Token-Rotation sind oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Es gibt stattdessen die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“: Doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veralteten Token-/Geräteidentitätsabweichungen.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs geöffnet ist oder wenn eine Richtlinie gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Wenn Doctor als systemd-Benutzerdienst ausgeführt wird, stellt es sicher, dass Lingering aktiviert ist, damit der Gateway nach dem Abmelden weiterläuft.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Status für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, durch fehlende Anforderungen blockierte und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Funktionen von Bundle-Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnose**: macht alle Ladezeitwarnungen oder -fehler sichtbar, die von der Plugin-Registry ausgegeben werden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Datei">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder es überschreiten. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil des Gesamtbudgets. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalbezogene Konfiguration, die dieses Plugin referenziert hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Überschreibungen. Dies verhindert Gateway-Boot-Loops, bei denen die Kanallaufzeit weg ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, erzeugt Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur interaktiver Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` von SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten untersuchen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Status-Familienbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert-aber-nicht-verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Gesundheitsprüfung + Neustart">
    Doctor führt eine Gesundheitsprüfung aus und bietet an, den Gateway neu zu starten, wenn er fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich npm-Paket und manueller Binärpfadoption ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte entfernte/herunterladbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, wenn er fehlt.
    - **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der Auto-Auswahlreihenfolge.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den Befehl für den detaillierten Speicherstatus, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt Doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsprüfung + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor eine Aktualisierung und kann die Dienstdatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration umgeschrieben wird.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Lebenszyklus des Gateway-Dienstes schreibgeschützt. Doctor meldet weiterhin den Dienstzustand und führt Reparaturen aus, die keine Dienste betreffen, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap, Umschreibungen der Supervisor-Konfiguration und die Bereinigung veralteter Dienste, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt Doctor Befehls-/Entrypoint-Metadaten nicht um, solange die passende systemd-Gateway-Unit aktiv ist. Doctor ignoriert außerdem inaktive zusätzliche gatewayähnliche Units, die nicht veraltet sind, während der Suche nach doppelten Diensten, damit begleitende Dienstdateien keinen Bereinigungsrauschen erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Doctor-Dienstinstallation/-reparatur den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Dienstumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach einer Änderung von `gateway.port` noch einen alten `--port` festlegt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst werden kann, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbarer Anleitung.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus ausdrücklich gesetzt ist.
    - Bei Linux-Benutzer-systemd-Units berücksichtigen Doctor-Prüfungen auf Token-Drift jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Dienst-Authentifizierungsmetadaten.
    - Doctor-Dienstreparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Dienstlaufzeit (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber nicht tatsächlich ausgeführt wird. Doctor prüft außerdem auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, auf eine Systeminstallation von Node zu migrieren, sofern verfügbar (Homebrew/apt/choco).

    Neu installierte oder reparierte Dienste behalten explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-bin-Verzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Dienst-`PATH` geschrieben, wenn diese Verzeichnisse auf dem Datenträger vorhanden sind. Dadurch bleibt der generierte Supervisor-`PATH` an der gleichen Minimal-`PATH`-Prüfung ausgerichtet, die Doctor später ausführt.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und stempelt Wizard-Metadaten, um den Doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
