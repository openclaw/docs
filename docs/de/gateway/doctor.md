---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Änderungen mit Breaking Changes an der Konfiguration einführen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Health-Checks, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` ist das Reparatur- + Migrations-Tool für OpenClaw. Es behebt veraltete Konfiguration/Zustände, prüft die Systemintegrität und liefert umsetzbare Reparaturschritte.

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

    Akzeptiert Standardwerte ohne Rückfragen (einschließlich Neustart-/Dienst-/Sandbox-Reparaturschritten, wenn anwendbar).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung + Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-/Dienst-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Systemdienste auf zusätzliche Gateway-Installationen scannen (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Health, UI und Updates">
    - Optionales Vorab-Update für Git-Installationen (nur interaktiv).
    - Frischeprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Health-Check + Neustartaufforderung.
    - Zusammenfassung des Skills-Status (zulässig/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flachfeldern `talk.*` nach `talk.provider` + `talk.providers.<provider>`.
    - Prüfungen der Browser-Migration für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der TLS-Voraussetzungen für OAuth bei OpenAI-Codex-OAuth-Profilen.
    - Migration von Legacy-Zuständen auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Vertragsschlüsseln in Plugin-Manifests (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Stores (`jobId`, `schedule.cron`, Top-Level-Felder für delivery/payload, Payload-`provider`, einfache Webhook-Fallback-Jobs mit `notify: true`).
    - Migration der Legacy-Richtlinie zur Agent-Laufzeit nach `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Lock-Dateien und Bereinigung veralteter Locks.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen Builds 2026.4.24 erstellt wurden.
    - Prüfungen von Integrität und Berechtigungen des Zustands (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Prüfungen der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Zustand der Model-Authentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur von Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht aktiv; gecachtes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway sondiert).
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Best-Practice-Prüfungen für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Kopplung">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Tokenerzeugung an, wenn keine Token-Quelle existiert; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen bei der Gerätekopplung (ausstehende Kopplungsanfragen beim ersten Mal, ausstehende Rollen-/Scope-Upgrades, Drift in veraltetem lokalem Device-Token-Cache und Drift in Auth-Status gepaarter Einträge).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - Prüfung von systemd-linger unter Linux.
    - Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen zu Abschneidung/nahe am Limit für Kontextdateien).
    - Prüfung des Shell-Completion-Status und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Anbieters für die Speichersuche (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
    - Prüfungen von Source-Installationen (pnpm-Workspace-Mismatch, fehlende UI-Assets, fehlende `tsx`-Binärdatei).
    - Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Reset

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Workflow des geerdeten Dreaming. Diese Aktionen verwenden RPC-Methoden im Stil von Gateway-Doctor, sind aber **nicht** Teil der Reparatur-/Migration über die CLI `openclaw doctor`.

Was sie tun:

- **Backfill** scannt historische Dateien `memory/YYYY-MM-DD.md` im aktiven Workspace, führt den grounded-REM-Diary-Durchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Diary-Einträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorgemerkte kurzfristige Einträge nur für grounded, die aus historischer Wiedergabe stammen und noch keine Live-Erinnerung oder tägliche Unterstützung angesammelt haben.

Was sie selbst **nicht** tun:

- Sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stellen grounded-Kandidaten nicht automatisch in den Live-Store für kurzfristige Promotion bereit, außer Sie führen zuvor explizit den dafür vorgesehenen CLI-Pfad aus

Wenn Sie möchten, dass grounded-historische Wiedergabe die normale tiefe Promotion beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden grounded-dauerhafte Kandidaten in den kurzfristigen Dreaming-Store vorgemerkt, während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es an, vor dem Doctor-Lauf ein Update auszuführen (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert Doctor sie in das aktuelle Schema.

    Dazu gehören auch flache Legacy-Felder für Talk. Die aktuelle öffentliche Talk-Konfiguration ist `talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird dann:

    - Erläutern, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden. Migrationen des Cron-Job-Stores werden durch `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → Top-Level-`bindings`
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
    - Für Kanäle mit benannten `accounts`, aber verbliebenen Top-Level-Kanalwerten für Einzelkonten, diese kontobezogenen Werte in das für diesen Kanal ausgewählte hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (Legacy-Relay-Einstellung der Erweiterung)

    Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Multi-Konto-Kanäle:

    - Wenn zwei oder mehr Einträge unter `channels.<channel>.accounts` konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Das kann Modelle auf die falsche API zwingen oder Kosten auf null setzen. Doctor warnt Sie, damit Sie die Überschreibung entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration weiterhin auf den entfernten Pfad der Chrome-Erweiterung verweist, normalisiert Doctor sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes Profil `existing-session` verwenden:

    - prüft, ob Google Chrome auf demselben Host installiert ist für Standardprofile mit automatischer Verbindung
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die browserseitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - dass der Browser lokal ausgeführt wird
    - dass Remote-Debugging in diesem Browser aktiviert ist
    - dass die erste Zustimmungsaufforderung zum Anhängen im Browser bestätigt wird

    Die Bereitschaft bezieht sich hier nur auf Voraussetzungen für lokales Anhängen. `existing-session` behält die aktuellen Beschränkungen von Chrome-MCP-Routen bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, sondiert Doctor den OpenAI-Autorisierungsendpunkt, um zu überprüfen, ob der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Sondierung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Behebung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Sondierung auch dann ausgeführt, wenn das Gateway gesund ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor Legacy-OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Providerpfad überschreiben, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth erkannt werden, damit Sie die veraltete Transport-Überschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Warnungen zu Codex-Plugin-Routen">
    Wenn das gebündelte Codex-Plugin aktiviert ist, prüft Doctor auch, ob primäre Modellreferenzen `openai-codex/*` weiterhin über den Standard-PI-Runner aufgelöst werden. Diese Kombination ist gültig, wenn Sie Codex-OAuth-/Abonnement-Authentifizierung über PI verwenden möchten, sie lässt sich aber leicht mit dem nativen Codex-App-Server-Harness verwechseln. Doctor warnt und verweist auf die explizite App-Server-Form: `openai/*` plus `agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repariert dies nicht automatisch, weil beide Routen gültig sind:

    - `openai-codex/*` + PI bedeutet „Codex-OAuth-/Abonnement-Authentifizierung über den normalen OpenClaw-Runner verwenden.“
    - `openai/*` + `runtime: "codex"` bedeutet „den eingebetteten Turn über den nativen Codex-App-Server ausführen.“
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden.“

    Wenn die Warnung erscheint, wählen Sie die Route, die Sie beabsichtigt haben, und bearbeiten Sie die Konfiguration manuell. Lassen Sie die Warnung unverändert, wenn PI Codex OAuth beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen von Legacy-Zuständen (Datenträgerlayout)">
    Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungszustand (Baileys):
      - von Legacy-`~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

    Diese Migrationen sind Best-Effort und idempotent; Doctor gibt Warnungen aus, wenn Legacy-Ordner als Backups zurückbleiben. Das Gateway/die CLI migriert die Legacy-Sitzungen + das Agent-Verzeichnis beim Start ebenfalls automatisch, sodass Verlauf/Auth/Modelle ohne manuelles Ausführen von Doctor im agentbezogenen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass Diffs nur in der Schlüsselreihenfolge keine wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen von Legacy-Plugin-Manifests">
    Doctor scannt alle installierten Plugin-Manifests auf veraltete Top-Level-Fähigkeitsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn solche gefunden werden, bietet Doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen des Legacy-Cron-Stores">
    Doctor prüft auch den Cron-Job-Store (`~/.openclaw/cron/jobs.json` standardmäßig oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Bereinigungen für Cron umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Top-Level-Payload-Felder (`message`, `model`, `thinking`, ...) → `payload`
    - Top-Level-Delivery-Felder (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Delivery-Aliasse für Payload-`provider` → explizites `delivery.channel`
    - einfache Legacy-Webhooks-Fallback-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert Jobs mit `notify: true` nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job Legacy-Notify-Fallback mit einem vorhandenen Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungs-Locks">
    Doctor scannt jedes Agent-Sitzungsverzeichnis auf veraltete Schreib-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet Doctor: den Pfad, die PID, ob die PID noch lebt, das Alter des Locks und ob er als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt Doctor veraltete Lock-Dateien automatisch; andernfalls wird ein Hinweis ausgegeben und Sie werden aufgefordert, den Befehl mit `--fix` erneut auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Zweigen">
    Doctor scannt JSONL-Dateien von Agent-Sitzungen auf die duplizierte Zweigform, die durch den Fehler beim Prompt-Transkript-Rewrite in 2026.4.24 entstanden ist: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwisterzweig mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` erstellt Doctor neben jeder betroffenen Datei ein Backup und schreibt das Transkript auf den aktiven Zweig um, sodass Gateway-Verlauf und Memory-Leser keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Logs und Konfiguration (es sei denn, Sie haben an anderer Stelle Backups).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: überprüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn ein Eigentümer-/Gruppen-Mismatch erkannt wird).
    - **Cloud-synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn sich der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` befindet, weil synchronisationsgestützte Pfade zu langsamerem I/O und zu Lock-/Synchronisierungsrennen führen können.
    - **Zustandsverzeichnis auf Linux auf SD oder eMMC**: warnt, wenn sich der Zustand auf einer Mount-Quelle `mmcblk*` befindet, weil zufällige I/O auf SD- oder eMMC-Basis bei Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile enthält (der Verlauf wächst nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere Ordner `~/.openclaw` über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Pfad zeigt (der Verlauf kann sich zwischen Installationen aufteilen).
    - **Hinweis zum Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (dort liegt der Zustand).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Zustand der Model-Authentifizierung (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Auth-Store, warnt, wenn Tokens bald ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn das sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt Doctor einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder wenn ein Anbieter verlangt, dass Sie sich erneut anmelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten Befehl `openclaw models auth login --provider ...` aus, den Sie ausführen müssen.

    Doctor meldet auch Auth-Profile, die vorübergehend nicht nutzbar sind wegen:

    - kurzer Cooldowns (Ratenlimits/Timeouts/Auth-Fehler)
    - längerer Deaktivierungen (Abrechnungs-/Kreditfehler)

  </Accordion>
  <Accordion title="6. Modellvalidierung für Hooks">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen Katalog und Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht zulässig ist.
  </Accordion>
  <Accordion title="7. Reparatur von Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder auf Legacy-Namen zu wechseln, wenn das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Laufzeitabhängigkeiten gebündelter Plugins">
    Doctor überprüft Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der aktuellen Konfiguration aktiv sind oder durch den Standardwert ihres gebündelten Manifests aktiviert werden, zum Beispiel `plugins.entries.discord.enabled: true`, Legacy-`channels.discord.enabled: true` oder ein standardmäßig aktivierter gebündelter Anbieter. Wenn Abhängigkeiten fehlen, meldet Doctor die Pakete und installiert sie im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin `openclaw plugins install` / `openclaw plugins update`; Doctor installiert keine Abhängigkeiten für beliebige Plugin-Pfade.

    Das Gateway und die lokale CLI können Laufzeitabhängigkeiten aktiver gebündelter Plugins bei Bedarf auch reparieren, bevor ein gebündeltes Plugin importiert wird. Diese Installationen sind auf das Laufzeit-Installations-Root des Plugins beschränkt, werden mit deaktivierten Skripten ausgeführt, schreiben kein Package-Lock und sind durch einen Installations-Root-Lock geschützt, sodass gleichzeitige Starts von CLI oder Gateway nicht denselben `node_modules`-Baum gleichzeitig verändern.

  </Accordion>
  <Accordion title="8. Migrationen von Gateway-Diensten und Hinweise zur Bereinigung">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Es kann auch nach zusätzlichen gatewayähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.
  </Accordion>
  <Accordion title="8b. Matrix-Migration beim Start">
    Wenn für ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Migration des Legacy-Zustands vorliegt, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Migration des Legacy-Matrix-Zustands und Vorbereitung des Legacy-Zustands für Verschlüsselung. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor prüft jetzt den Zustand der Gerätekopplung als Teil des normalen Health-Durchlaufs.

    Was gemeldet wird:

    - ausstehende Kopplungsanfragen beim ersten Mal
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Mismatch des öffentlichen Schlüssels, bei denen die Geräte-ID noch übereinstimmt, aber die Geräteidentität nicht mehr mit dem genehmigten Eintrag übereinstimmt
    - gekoppelte Einträge, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Basislinie der Kopplung abweichen
    - lokal gecachte Device-Token-Einträge für die aktuelle Maschine, die einer gatewayseitigen Token-Rotation vorausgehen oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert auch Device-Tokens nicht automatisch. Stattdessen werden die genauen nächsten Schritte ausgegeben:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Eintrag mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Das schließt die häufige Lücke „bereits gekoppelt, aber trotzdem weiterhin Kopplung erforderlich“: Doctor unterscheidet jetzt zwischen erstmaliger Kopplung, ausstehenden Rollen-/Scope-Upgrades und veralteter Drift von Token-/Geräteidentität.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Anbieter für DMs ohne Allowlist offen ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn es als systemd-Benutzerdienst ausgeführt wird, stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

    - **Skills-Status**: zählt zulässige, fehlende Anforderungen und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnosen**: zeigt Warnungen oder Fehler an, die die Plugin-Registry beim Laden ausgibt.

  </Accordion>
  <Accordion title="11b. Größe von Bootstrap-Dateien">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe an oder über dem konfigurierten Zeichenbudget liegen. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen, Abschneidungsprozentsatz, Ursache der Abschneidung (`max/file` oder `max/total`) sowie die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien abgeschnitten werden oder nahe am Limit liegen, gibt Doctor Hinweise zur Anpassung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11c. Shell-Completion">
    Doctor prüft, ob Tab-Completion für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Completion im Profil konfiguriert ist, aber die Cache-Datei fehlt, regeneriert Doctor den Cache automatisch.
    - Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; übersprungen mit `--non-interactive`).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

  </Accordion>
  <Accordion title="12. Prüfungen der Gateway-Authentifizierung (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu erzeugen.
    - Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur dann, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von `allowFrom` / `groupAllowFrom` mit `@username` für Telegram versucht, wenn verfügbar, konfigurierte Bot-Zugangsdaten zu verwenden.
    - Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, im aktuellen Befehlspfad aber nicht verfügbar ist, meldet Doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Health-Check + Neustart">
    Doctor führt einen Health-Check aus und bietet an, das Gateway neu zu starten, wenn es ungesund erscheint.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Anbieter für die Speichersuche für den Standard-Agenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Anbieter ab:

    - **QMD-Backend**: sondiert, ob die Binärdatei `qmd` verfügbar und startbar ist. Wenn nicht, gibt Doctor Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad.
    - **Expliziter lokaler Anbieter**: prüft, ob eine lokale Modelldatei oder eine erkannte entfernte/herunterladbare Modell-URL vorhanden ist. Wenn nicht, wird vorgeschlagen, zu einem entfernten Anbieter zu wechseln.
    - **Expliziter entfernter Anbieter** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Store vorhanden ist. Gibt umsetzbare Hinweise aus, wenn er fehlt.
    - **Automatischer Anbieter**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden entfernten Anbieter in der Reihenfolge der automatischen Auswahl.

    Wenn ein Ergebnis einer Gateway-Sondierung verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung gesund), gleicht Doctor dessen Ergebnis mit der in der CLI sichtbaren Konfiguration ab und weist auf etwaige Abweichungen hin.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Warnungen zum Kanalstatus">
    Wenn das Gateway gesund ist, führt Doctor eine Sondierung des Kanalstatus aus und meldet Warnungen mit vorgeschlagenen Behebungen.
  </Accordion>
  <Accordion title="15. Audit + Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. `network-online`-Abhängigkeiten in systemd und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es eine Aktualisierung und kann die Service-Datei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standardaufforderungen zur Reparatur.
    - `openclaw doctor --repair` wendet empfohlene Behebungen ohne Rückfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Lebenszyklus des Gateway-Dienstes schreibgeschützt. Es meldet weiterhin den Dienststatus und führt Reparaturen außerhalb des Dienstes aus, überspringt aber Dienstinstallation/-start/-neustart/-Bootstrap, das Umschreiben der Supervisor-Konfiguration und die Bereinigung von Legacy-Diensten, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Wenn Token-Authentifizierung ein Token benötigt und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Dienstinstallation/-reparatur von Doctor das SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Authentifizierung ein Token benötigt und das konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Bei Linux-Benutzer-systemd-Units umfassen die Token-Drift-Prüfungen von Doctor jetzt sowohl Quellen aus `Environment=` als auch `EnvironmentFile=` beim Vergleich von Dienst-Authentifizierungsmetadaten.
    - Reparaturen von Doctor für Dienste verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Fehlerbehebung beim Gateway](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit mit `openclaw gateway install --force` ein vollständiges Neuschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert, aber tatsächlich nicht aktiv ist. Es prüft außerdem auf Portkollisionen am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem von einem Versionsmanager verwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- + Telegram-Kanäle erfordern Node, und Pfade aus Versionsmanagern können nach Upgrades kaputtgehen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht die Wizard-Metadaten mit einem Eintrag, um den Doctor-Lauf zu erfassen.
  </Accordion>
  <Accordion title="19. Workspace-Hinweise (Backup + Memory-System)">
    Doctor schlägt ein Workspace-Memory-System vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus, wenn der Workspace nicht bereits unter Git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Fehlerbehebung beim Gateway](/de/gateway/troubleshooting)
