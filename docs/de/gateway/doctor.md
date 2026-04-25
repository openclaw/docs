---
read_when:
    - Hinzufügen oder Ändern von Doctor-Migrationen
    - Einführen von Änderungen an der Konfiguration, die nicht abwärtskompatibel sind
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete
Konfigurationen/Statusdaten, prüft den Systemzustand und bietet umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Akzeptiert Standardwerte ohne Rückfrage (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, wenn zutreffend).

```bash
openclaw doctor --repair
```

Wendet empfohlene Reparaturen ohne Rückfrage an (Reparaturen + Neustarts, wo sicher).

```bash
openclaw doctor --repair --force
```

Wendet auch aggressive Reparaturen an (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

```bash
openclaw doctor --non-interactive
```

Wird ohne Rückfragen ausgeführt und wendet nur sichere Migrationen an (Normalisierung der Konfiguration + Verschieben von Statusdaten auf dem Datenträger). Überspringt Neustart-/Service-/Sandbox-Aktionen, die menschliche Bestätigung erfordern.
Legacy-Statusmigrationen werden bei Erkennung automatisch ausgeführt.

```bash
openclaw doctor --deep
```

Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Vorab-Aktualisierung für Git-Installationen (nur interaktiv).
- Frischeprüfung des UI-Protokolls (baut Control UI neu, wenn das Protokollschema neuer ist).
- Integritätsprüfung + Aufforderung zum Neustart.
- Zusammenfassung des Skills-Status (zulässig/fehlend/blockiert) und Plugin-Status.
- Normalisierung der Konfiguration für Legacy-Werte.
- Migration der Talk-Konfiguration von den alten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
- Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
- Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI Codex OAuth-Profile.
- Legacy-Migration von Statusdaten auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Migration des Legacy-Schlüssels für Plugin-Manifest-Verträge (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
- Prüfung von Sitzungs-Lockdateien und Bereinigung veralteter Locks.
- Integritäts- und Berechtigungsprüfungen des Status (Sitzungen, Transkripte, Statusverzeichnis).
- Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
- Zustand der Modell-Authentifizierung: prüft OAuth-Ablauf, kann auslaufende Tokens aktualisieren und meldet Cooldown-/deaktivierte Zustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
- Migration von Legacy-Statusdaten des Matrix-Kanals (im Modus `--fix` / `--repair`).
- Laufzeitprüfungen des Gateways (Dienst installiert, aber nicht aktiv; gecachtes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Best-Practice-Prüfungen der Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkonflikten (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet die Erzeugung eines Tokens an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
- Erkennung von Problemen beim Geräte-Pairing (ausstehende Erst-Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Drift im lokalen Geräte-Token-Cache und Auth-Drift in Pairing-Datensätzen).
- Prüfung von systemd linger unter Linux.
- Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen zu Abschneidung/nahe am Limit für Kontextdateien).
- Prüfung des Status von Shell-Completion sowie automatische Installation/Aktualisierung.
- Bereitschaftsprüfung des Embedding-Providers für die Memory-Suche (lokales Modell, entfernter API key oder QMD-Binary).
- Prüfungen der Source-Installation (pnpm-Workspace-Mismatch, fehlende UI-Assets, fehlendes tsx-Binary).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Dreams-UI-Backfill und Reset

Die Dreams-Szene in Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded**
für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden Gateway-
RPC-Methoden im Doctor-Stil, sind jedoch **nicht** Teil der CLI-Reparatur/Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven
  Workspace, führt den Grounded-REM-Diary-Durchlauf aus und schreibt reversible Backfill-
  Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Diary-Einträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorbereitete, ausschließlich geerdete Kurzzeiteinträge,
  die aus historischem Replay stammen und noch keine Live-Recall- oder tägliche
  Unterstützung angesammelt haben.

Was sie nicht selbst tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stellen Grounded-Kandidaten nicht automatisch in den Live-Kurzzeit-
  Promotion-Speicher ein, es sei denn, Sie führen vorher explizit den vorbereiteten CLI-Pfad aus

Wenn Sie möchten, dass geerdetes historisches Replay den normalen Deep-Promotion-
Pfad beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete dauerhafte Kandidaten in den Kurzzeit-Dreaming-Speicher vorbereitet, während
`DREAMS.md` die Oberfläche zur Überprüfung bleibt.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn dies ein Git-Checkout ist und Doctor interaktiv läuft, bietet es an,
vor Ausführung von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Normalisierung der Konfiguration

Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifische Überschreibung), normalisiert Doctor diese in das aktuelle
Schema.

Dazu gehören auch alte flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte
Formen wie `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen von Legacy-Konfigurationsschlüsseln

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche Legacy-Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start auch automatisch aus, wenn es ein
Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Speichers werden durch `openclaw doctor --fix` verarbeitet.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` auf oberster Ebene
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- alte Formen von `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Bei Kanälen mit benannten `accounts`, aber verbliebenen Top-Level-Kanalwerten für ein einzelnes Konto, diese kontobezogenen Werte in das für diesen Kanal gewählte angehobene Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/default-Ziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (alte Relay-Einstellung der Erweiterung)

Doctor-Warnungen enthalten auch Hinweise zu Standardkonten bei Mehrfachkonten-Kanälen:

- Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto wählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Overrides

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den eingebauten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie das Override entfernen und das per-Modell-API-Routing + die Kosten wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration noch auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert Doctor
sie auf das aktuelle Host-lokale Chrome-MCP-Attach-Modell:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft außerdem den Host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes Profil `existing-session` verwenden:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Auto-Connect-Profile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  oder `edge://inspect/#remote-debugging`)

Doctor kann die browserseitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- einen lokal laufenden Browser
- in diesem Browser aktiviertes Remote-Debugging
- das Genehmigen der ersten Attach-Zustimmungsaufforderung im Browser

Bereitschaft bedeutet hier nur lokale Voraussetzungen für Attach. Existing-session behält
die aktuellen Routenlimits von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein Raw-CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
Headless-Abläufe. Diese verwenden weiterhin Raw CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale TLS-Stack von Node/OpenSSL
die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Behebung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt,
wenn das Gateway gesund ist.

### 2c) Codex-OAuth-Provider-Overrides

Wenn Sie zuvor alte OpenAI-Transporteinstellungen unter
`models.providers.openai-codex` hinzugefügt haben, können diese den eingebauten Codex-OAuth-
Provider-Pfad überlagern, den neuere Versionen automatisch verwenden. Doctor warnt, wenn er diese alten
Transporteinstellungen zusammen mit Codex OAuth sieht, damit Sie das veraltete Transport-Override
entfernen oder umschreiben und das eingebaute Routing-/Fallback-Verhalten
wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen
diese Warnung nicht aus.

### 3) Legacy-Statusmigrationen (Datenträgerlayout)

Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

- Sitzungs-Speicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Authentifizierungsstatus (Baileys):
  - von altem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

Diese Migrationen erfolgen nach Best Effort und sind idempotent; Doctor gibt Warnungen aus, wenn
er alte Ordner als Backups zurücklässt. Gateway/CLI migrieren die alten Sitzungen + das Agent-Verzeichnis
beim Start ebenfalls automatisch, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im
Pfad pro Agent landen. Die WhatsApp-Authentifizierung wird absichtlich nur
über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass reine Unterschiede in der Schlüsselsortierung keine wiederholten, wirkungslosen Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Legacy-Migrationen von Plugin-Manifests

Doctor scannt alle installierten Plugin-Manifeste auf veraltete Capability-Schlüssel
auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn solche gefunden werden, bietet er an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt vor Ort neu zu schreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der alte Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Legacy-Migrationen des Cron-Speichers

Doctor prüft außerdem den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus
Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Bereinigungen für Cron umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliase für Payload-`provider` → explizites `delivery.channel`
- einfache alte Webhook-Fallback-Jobs mit `notify: true` → explizit `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert Jobs mit `notify: true` nur dann automatisch, wenn dies ohne
Verhaltensänderung möglich ist. Wenn ein Job altes Notify-Fallback mit einem bestehenden
Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungs-Locks

Doctor scannt jedes Agenten-Sitzungsverzeichnis auf veraltete Schreib-Lock-Dateien — Dateien, die
zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er:
den Pfad, die PID, ob die PID noch lebt, das Alter des Locks und ob er als
veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt er veraltete Lock-Dateien automatisch; andernfalls gibt er einen Hinweis aus und
weist Sie an, mit `--fix` erneut auszuführen.

### 4) Prüfungen der Statusintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Statusverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie
Sitzungen, Anmeldedaten, Logs und Konfiguration (es sei denn, Sie haben anderswo Backups).

Doctor prüft:

- **Statusverzeichnis fehlt**: warnt vor katastrophalem Statusverlust, bietet an, das
  Verzeichnis neu zu erstellen, und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Statusverzeichnisses**: verifiziert Schreibbarkeit; bietet an, Berechtigungen zu reparieren
  (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
- **Cloud-synchronisiertes Statusverzeichnis unter macOS**: warnt, wenn der Status unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade zu langsamerem I/O
  und Lock-/Sync-Rennen führen können.
- **Statusverzeichnis auf Linux mit SD oder eMMC**: warnt, wenn der Status auf eine `mmcblk*`-
  Mount-Quelle aufgelöst wird, da zufälliges I/O auf SD- oder eMMC-Basis langsamer sein und
  unter Sitzungs- und Anmeldedatenschreibvorgängen schneller verschleißen kann.
- **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Speicherverzeichnis sind
  erforderlich, um den Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen
  Transkriptdateien fehlen.
- **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine
  Zeile hat (Verlauf akkumuliert sich nicht).
- **Mehrere Statusverzeichnisse**: warnt, wenn mehrere Ordner `~/.openclaw` über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` woandershin zeigt (der Verlauf kann
  sich zwischen Installationen aufteilen).
- **Erinnerung an den Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran,
  ihn auf dem Remote-Host auszuführen (dort liegt der Status).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Zustand der Modell-Authentifizierung (OAuth-Ablauf)

Doctor untersucht OAuth-Profile im Auth-Speicher, warnt, wenn Tokens bald
ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic API key oder den
Anthropic-Setup-Token-Pfad vor.
Aufforderungen zum Refresh erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Refresh-Versuche.

Wenn ein OAuth-Refresh dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`,
`invalid_grant` oder ein Provider Ihnen mitteilt, dass Sie sich erneut anmelden müssen), meldet Doctor,
dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen Befehl `openclaw models auth login --provider ...`
aus, den Sie ausführen müssen.

Doctor meldet auch Auth-Profile, die vorübergehend unbrauchbar sind aufgrund von:

- kurzen Cooldowns (Rate-Limits/Timeouts/Auth-Fehler)
- längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

### 6) Validierung des Hooks-Modells

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modell-Referenz gegen den
Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht zulässig ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder
auf alte Namen umzuschalten, falls das aktuelle Image fehlt.

### 7b) Runtime-Abhängigkeiten gebündelter Plugins

Doctor prüft Runtime-Abhängigkeiten nur für gebündelte Plugins, die in der aktuellen Konfiguration aktiv sind oder
durch ihren gebündelten Manifest-Standard aktiviert werden, zum Beispiel
`plugins.entries.discord.enabled: true`, altes
`channels.discord.enabled: true` oder ein standardmäßig aktivierter gebündelter Provider. Wenn welche
fehlen, meldet Doctor die Pakete und installiert sie im Modus
`openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin
`openclaw plugins install` / `openclaw plugins update`; Doctor installiert
keine Abhängigkeiten für beliebige Plugin-Pfade.

Gateway und lokale CLI können Runtime-Abhängigkeiten aktiver gebündelter Plugins
vor dem Import eines gebündelten Plugins auch bei Bedarf reparieren. Diese Installationen sind
auf die Runtime-Installationswurzel des Plugins beschränkt, werden mit deaktivierten Skripten ausgeführt, schreiben
keine Package-Lock-Datei und sind durch einen Install-Root-Lock geschützt, sodass gleichzeitige Starts von CLI
oder Gateway denselben `node_modules`-Baum nicht gleichzeitig verändern.

### 8) Migrationen von Gateway-Diensten und Hinweise zur Bereinigung

Doctor erkennt alte Gateway-Dienste (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-
Port zu installieren. Er kann auch nach zusätzlichen gatewayähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste werden als erstklassig behandelt und nicht als „zusätzlich“ markiert.

### 8b) Startup-Matrix-Migration

Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare alte Statusmigration hat,
erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Best-Effort-Migrationsschritte aus: alte Matrix-Statusmigration und Vorbereitung des alten verschlüsselten Status. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start
wird fortgesetzt. Im Nur-Lese-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 8c) Geräte-Pairing und Auth-Drift

Doctor prüft jetzt den Status des Geräte-Pairings als Teil des normalen Integritätsdurchlaufs.

Was gemeldet wird:

- ausstehende Erst-Pairing-Anfragen
- ausstehende Rollen-Upgrades für bereits gepairte Geräte
- ausstehende Scope-Upgrades für bereits gepairte Geräte
- Reparaturen bei Public-Key-Mismatch, bei denen die Geräte-ID noch übereinstimmt, die Geräte-
  Identität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
- gepairte Datensätze ohne aktives Token für eine genehmigte Rolle
- gepairte Tokens, deren Scopes außerhalb der genehmigten Pairing-Baseline driften
- lokal gecachte Geräte-Token-Einträge für den aktuellen Rechner, die einer
  gatewayseitigen Token-Rotation vorausgehen oder veraltete Scope-Metadaten enthalten

Doctor genehmigt Pair-Anfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen
gibt er die genauen nächsten Schritte aus:

- ausstehende Anfragen mit `openclaw devices list` prüfen
- die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
- ein neues Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
- einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und neu genehmigen

Dadurch wird die häufige Lücke „bereits gepairt, aber trotzdem weiterhin Pairing erforderlich“
geschlossen: Doctor unterscheidet jetzt Erst-Pairing von ausstehenden Rollen-/Scope-
Upgrades und von veralteter Token-/Geräteidentitäts-Drift.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd linger (Linux)

Wenn der Dienst als systemd-Benutzerdienst läuft, stellt Doctor sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Logout weiterläuft.

### 11) Workspace-Status (Skills, Plugins und alte Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Status für den Standard-Agenten aus:

- **Skills-Status**: zählt zulässige, fehlende Anforderungen und durch Allowlist blockierte Skills.
- **Alte Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Workspace-Verzeichnisse
  neben dem aktuellen Workspace vorhanden sind.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle
  Fehler auf; meldet Fähigkeiten von Bundle-Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnosen**: zeigt alle Warnungen oder Fehler an, die beim Laden von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe von Bootstrap-Dateien

Doctor prüft, ob Bootstrap-Dateien des Workspace (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe an oder über dem konfigurierten
Zeichenbudget liegen. Er meldet pro Datei rohe vs. injizierte Zeichenzahlen, den Abschneidungs-
Prozentsatz, die Ursache der Abschneidung (`max/file` oder `max/total`) und die gesamte Anzahl injizierter
Zeichen als Anteil des Gesamtbudgets. Wenn Dateien abgeschnitten werden oder nahe am
Limit liegen, gibt Doctor Hinweise zur Abstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell-Completion

Doctor prüft, ob Tab-Completion für die aktuelle Shell
(zsh, bash, fish oder PowerShell) installiert ist:

- Wenn das Shell-Profil ein langsames Muster für dynamische Completion verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere
  Variante mit gecachter Datei.
- Wenn Completion im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  regeneriert Doctor den Cache automatisch.
- Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

### 12) Prüfungen der Gateway-Authentifizierung (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
- Wenn `gateway.auth.token` über SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Reparaturen im Nur-Lese-Modus mit SecretRef-Bewusstsein

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das fail-fast-Verhalten der Laufzeit abzuschwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe Nur-Lese-Summary-Modell für SecretRef wie die Status-Befehlsfamilie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` mit `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, im aktuellen Befehlspfad aber nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Integritätsprüfung des Gateways + Neustart

Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund aussieht.

### 13b) Bereitschaft der Memory-Suche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Memory-Suche für den Standard-Agenten bereit ist.
Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob das Binary `qmd` verfügbar und startbar ist.
  Falls nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Option für den Binary-Pfad.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  entfernte/herunterladbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, zu einem entfernten Provider zu wechseln.
- **Expliziter entfernter Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API key
  in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Automatischer Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden entfernten
  Provider in der Reihenfolge der automatischen Auswahl.

Wenn ein Ergebnis einer Gateway-Prüfung verfügbar ist (das Gateway zum Zeitpunkt der
Prüfung gesund war), vergleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration und weist
auf Abweichungen hin.

Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu verifizieren.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt Doctor eine Prüfung des Kanalstatus aus und meldet
Warnungen mit vorgeschlagenen Korrekturen.

### 15) Prüfung der Supervisor-Konfiguration + Reparatur

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und
Neustartverzögerung). Wenn er eine Abweichung findet, empfiehlt er eine Aktualisierung und kann
die Service-Datei/Aufgabe auf die aktuellen Standardwerte umschreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standard-Reparaturaufforderungen.
- `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Installation/Reparatur des Doctor-Service den SecretRef, speichert jedoch keine aufgelösten Klartext-Token-Werte in den Umgebungsmetadaten des Supervisor-Service.
- Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
- Bei Linux-user-systemd-Units umfassen die Prüfungen von Doctor auf Token-Drift jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Auth-Metadaten.
- Sie können jederzeit ein vollständiges Umschreiben mit `openclaw gateway install --force` erzwingen.

### 16) Diagnose von Gateway-Laufzeit + Port

Doctor untersucht die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der
Service installiert, aber tatsächlich nicht aktiv ist. Er prüft auch auf Portkonflikte
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Service auf Bun oder auf einem versionsverwalteten Node-Pfad
läuft (`nvm`, `fnm`, `volta`, `asdf` usw.). WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht
lädt. Doctor bietet an, auf eine systemweite Node-Installation zu migrieren, wenn
eine verfügbar ist (Homebrew/apt/choco).

### 18) Schreiben der Konfiguration + Wizard-Metadaten

Doctor speichert alle Konfigurationsänderungen und versieht Wizard-Metadaten mit einem Zeitstempel, um den
Doctor-Lauf zu protokollieren.

### 19) Workspace-Tipps (Backup + Memory-System)

Doctor schlägt ein Workspace-Memory-System vor, wenn es fehlt, und gibt einen Backup-Hinweis aus,
wenn der Workspace nicht bereits unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zu
Workspace-Struktur und Git-Backup (empfohlen: privates GitHub oder GitLab).

## Verwandt

- [Fehlerbehebung für Gateway](/de/gateway/troubleshooting)
- [Gateway-Runbook](/de/gateway)
