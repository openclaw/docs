---
read_when:
    - Hinzufügen oder Ändern von Doctor-Migrationen
    - Einführen inkompatibler Konfigurationsänderungen
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` ist das Reparatur- und Migrationswerkzeug für OpenClaw. Es behebt veraltete
Konfigurations-/Statusdaten, prüft die Integrität und bietet umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Standardwerte ohne Rückfrage akzeptieren (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, sofern anwendbar).

```bash
openclaw doctor --repair
```

Empfohlene Reparaturen ohne Rückfrage anwenden (Reparaturen + Neustarts, wo sicher).

```bash
openclaw doctor --repair --force
```

Auch aggressive Reparaturen anwenden (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

```bash
openclaw doctor --non-interactive
```

Ohne Rückfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung + Verschieben von Statusdaten auf der Festplatte). Überspringt Neustart-/Service-/Sandbox-Aktionen, die eine Bestätigung durch Menschen erfordern.
Alte Statusmigrationen werden bei Erkennung automatisch ausgeführt.

```bash
openclaw doctor --deep
```

Systemdienste auf zusätzliche Gateway-Installationen prüfen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben überprüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Vorab-Aktualisierung für Git-Installationen (nur interaktiv).
- Prüfung der Aktualität des UI-Protokolls (erstellt Control UI neu, wenn das Protokollschema neuer ist).
- Integritätsprüfung + Neustart-Aufforderung.
- Zusammenfassung des Skills-Status (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Altwerte.
- Migration der Talk-Konfiguration von alten flachen `talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
- Browser-Migrationsprüfungen für alte Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
- Warnungen zu überschattendem Codex OAuth (`models.providers.openai-codex`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
- Migration von alten Statusdaten auf der Festplatte (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
- Migration alter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration des alten Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
- Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
- Prüfungen auf Statusintegrität und Berechtigungen (Sitzungen, Transkripte, Statusverzeichnis).
- Prüfung der Berechtigungen der Konfigurationsdatei (`chmod 600`) bei lokaler Ausführung.
- Integrität der Modell-Authentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration alter Dienste und Erkennung zusätzlicher Gateways.
- Migration des alten Matrix-Kanalstatus (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
- Kanalstatuswarnungen (vom laufenden Gateway geprüft).
- Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Best-Practice-Prüfungen für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Kollisionen des Gateway-Ports (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Gateway-Auth-Prüfungen für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-`SecretRef`-Konfigurationen).
- Erkennung von Problemen beim Geräte-Pairing (ausstehende Pair-Anfragen beim ersten Mal, ausstehende Rollen-/Bereichsupgrades, Drift des veralteten lokalen Geräte-Token-Caches und Auth-Drift gepaarter Datensätze).
- Prüfung von systemd-linger unter Linux.
- Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Abschneidung/nahe am Grenzwert für Kontextdateien).
- Prüfung des Shell-Completion-Status und automatische Installation/Aktualisierung.
- Bereitschaftsprüfung des Embedding-Providers für die Memory-Suche (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
- Prüfungen der Quellinstallation (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlende `tsx`-Binärdatei).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Backfill und Zurücksetzen der Dreams UI

Die Dreams-Szene in Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded**
für den geerdeten Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im
Doctor-Stil, sind aber **nicht** Teil der Reparatur/Migration der CLI `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven
  Workspace, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt umkehrbare Backfill-
  Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte geerdete Kurzzeiteinträge, die
  aus historischer Wiedergabe stammen und noch keine Live-Erinnerung oder tägliche
  Unterstützung angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stellen geerdete Kandidaten nicht automatisch in den Live-Kurzzeit-
  Promotion-Speicher bereit, es sei denn, Sie führen zuerst explizit den gestuften CLI-Pfad aus

Wenn Sie möchten, dass die geerdete historische Wiedergabe die normale Deep-Promotion-
Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete dauerhafte Kandidaten in den Kurzzeit-Dreaming-Speicher bereitgestellt, während
`DREAMS.md` als Prüfoberfläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es an,
vor der Ausführung von doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration alte Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifische Überschreibung), normalisiert doctor sie in das aktuelle
Schema.

Das umfasst auch alte flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Zuordnung um.

### 2) Migrationen alter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche alten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein
altes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Speichers werden von `openclaw doctor --fix` übernommen.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` auf oberster Ebene
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- alte `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Für Kanäle mit benannten `accounts`, aber noch vorhandenen einkonto-spezifischen Kanalwerten auf oberster Ebene, diese konto-spezifischen Werte in das für diesen Kanal hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein bestehendes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (alte Erweiterungs-Relay-Einstellung)

Doctor-Warnungen enthalten auch Hinweise zu Kontostandards für Mehrkonto-Kanäle:

- Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Überschreibungen

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt das den eingebauten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt Sie, damit Sie die Überschreibung entfernen und das per-Modell-API-Routing + die Kosten wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration noch auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert doctor
sie auf das aktuelle hostlokale Attach-Modell von Chrome MCP:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft auch den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Auto-Connect-Profile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  oder `edge://inspect/#remote-debugging`)

Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- den lokal laufenden Browser
- aktiviertes Remote-Debugging in diesem Browser
- die Zustimmung zum ersten Attach-Consent-Prompt im Browser

Die Bereitschaft hier betrifft nur lokale Attach-Voraussetzungen. Existing-session behält
die aktuellen Routenbeschränkungen von Chrome MCP; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
headless Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack
die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Behebung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt,
wenn das Gateway gesund ist.

### 2c) Codex-OAuth-Provider-Überschreibungen

Wenn Sie zuvor alte OpenAI-Transporteinstellungen unter
`models.providers.openai-codex` hinzugefügt haben, können diese den eingebauten Codex-OAuth-
Provider-Pfad überlagern, den neuere Releases automatisch verwenden. Doctor warnt, wenn es diese
alten Transporteinstellungen zusammen mit Codex OAuth sieht, damit Sie die veraltete Transport-
Überschreibung entfernen oder umschreiben und das eingebaute Routing-/Fallback-Verhalten
wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen
diese Warnung nicht aus.

### 3) Migrationen alten Statuses (Festplattenlayout)

Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

- Sitzungs-Speicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Auth-Status (Baileys):
  - von altem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; doctor gibt Warnungen aus, wenn
alte Ordner als Backups zurückbleiben. Gateway/CLI migrieren die alten Sitzungen + das Agent-Verzeichnis beim Start ebenfalls automatisch,
sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. WhatsApp-Auth wird absichtlich nur
über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, daher lösen Unterschiede nur in der Schlüsselsortierung keine wiederholten, wirkungslosen `doctor --fix`-Änderungen mehr aus.

### 3a) Alte Plugin-Manifest-Migrationen

Doctor scannt alle installierten Plugin-Manifeste auf veraltete Capability-
Schlüssel der obersten Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist
idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte hat, wird der alte Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Alte Cron-Speicher-Migrationen

Doctor prüft auch den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen
weiterhin akzeptiert.

Aktuelle Cron-Bereinigungen umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliasse für Payload-`provider` → explizites `delivery.channel`
- einfache alte `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert `notify: true`-Jobs nur automatisch, wenn es dies ohne
Verhaltensänderung tun kann. Wenn ein Job altes Notify-Fallback mit einem vorhandenen
Nicht-Webhook-Delivery-Modus kombiniert, warnt doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungssperren

Doctor scannt jedes Agenten-Sitzungsverzeichnis auf veraltete Schreibsperrdateien — Dateien, die
zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet es:
den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie
als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und
fordert Sie auf, den Lauf mit `--fix` zu wiederholen.

### 4) Prüfungen der Statusintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Statusverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie
Sitzungen, Anmeldedaten, Logs und Konfiguration (es sei denn, Sie haben Backups an anderer Stelle).

Doctor prüft:

- **Fehlendes Statusverzeichnis**: warnt vor katastrophalem Statusverlust, fordert zum Neuerstellen
  des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Statusverzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen
  zu reparieren (und gibt einen `chown`-Hinweis aus, wenn ein Eigentümer-/Gruppen-Mismatch erkannt wird).
- **Cloud-synchronisiertes Statusverzeichnis unter macOS**: warnt, wenn der Status unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, weil synchronisationsgestützte Pfade langsamere I/O-
  Vorgänge und Sperr-/Synchronisations-Race-Conditions verursachen können.
- **Statusverzeichnis auf Linux-SD oder eMMC**: warnt, wenn der Status auf eine `mmcblk*`-
  Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte zufällige I/O-Zugriffe unter Sitzungs- und
  Anmeldedaten-Schreibvorgängen langsamer sein und schneller verschleißen können.
- **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Sitzungs-Speicherverzeichnis sind
  erforderlich, um Verlauf beizubehalten und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen
  Transkriptdateien fehlen.
- **Hauptsitzung „1-zeilige JSONL“**: markiert, wenn das Haupttranskript nur eine
  Zeile hat (der Verlauf wächst nicht an).
- **Mehrere Statusverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf etwas anderes zeigt (der Verlauf kann
  sich auf Installationen aufteilen).
- **Hinweis zum Remote-Modus**: wenn `gateway.mode=remote`, erinnert doctor Sie daran,
  es auf dem Remote-Host auszuführen (dort liegt der Status).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Integrität der Modell-Authentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Speicher, warnt, wenn Token
bald ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den
Anthropic-Setup-Token-Pfad vor.
Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`,
`invalid_grant` oder wenn ein Provider Ihnen mitteilt, sich erneut anzumelden), meldet doctor,
dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten Befehl `openclaw models auth login --provider ...`
aus, der ausgeführt werden muss.

Doctor meldet auch Auth-Profile, die aufgrund von Folgendem vorübergehend nicht nutzbar sind:

- kurze Cooldowns (Ratenbegrenzungen/Timeouts/Auth-Fehler)
- längere Deaktivierungen (Abrechnungs-/Guthabenfehler)

### 6) Validierung des Hooks-Modells

Wenn `hooks.gmail.model` gesetzt ist, validiert doctor die Modellreferenz gegenüber dem
Katalog und der Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft doctor Docker-Images und bietet an, sie zu bauen oder
auf alte Namen umzuschalten, wenn das aktuelle Image fehlt.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der
aktuellen Konfiguration aktiv sind oder durch ihren gebündelten Manifest-Standard aktiviert werden, zum Beispiel
`plugins.entries.discord.enabled: true`, altes
`channels.discord.enabled: true` oder ein standardmäßig aktivierter gebündelter Provider. Wenn welche
fehlen, meldet doctor die Pakete und installiert sie im
Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin
`openclaw plugins install` / `openclaw plugins update`; doctor installiert keine
Abhängigkeiten für beliebige Plugin-Pfade.

Gateway und lokale CLI können aktive Laufzeitabhängigkeiten gebündelter Plugins
bei Bedarf auch vor dem Import eines gebündelten Plugins reparieren. Diese Installationen sind
auf die Plugin-Laufzeit-Installationswurzel beschränkt, werden mit deaktivierten Skripten ausgeführt, schreiben
keine Package-Lock-Datei und sind durch eine Installationswurzel-Sperre geschützt, damit gleichzeitige CLI-
oder Gateway-Starts nicht denselben `node_modules`-Baum gleichzeitig verändern.

### 8) Migrationen von Gateway-Diensten und Hinweise zur Bereinigung

Doctor erkennt alte Gateway-Dienste (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen Gateway-ähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht
als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare alte Statusmigration hat,
erstellt doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Best-Effort-Migrationsschritte aus: alte Matrix-Statusmigration und alte
Vorbereitung verschlüsselten Status. Beide Schritte sind nicht fatal; Fehler werden protokolliert und
der Start wird fortgesetzt. Im Nur-Lese-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 8c) Geräte-Pairing und Auth-Drift

Doctor prüft jetzt den Geräte-Pairing-Status als Teil des normalen Integritätsdurchlaufs.

Was es meldet:

- ausstehende Pairing-Anfragen beim ersten Mal
- ausstehende Rollen-Upgrades für bereits gepaarte Geräte
- ausstehende Scope-Upgrades für bereits gepaarte Geräte
- Reparaturen bei Public-Key-Mismatch, bei denen die Geräte-ID zwar noch passt, aber die Geräte-
  Identität nicht mehr zum genehmigten Datensatz passt
- gepaarte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
- gepaarte Token, deren Scopes von der genehmigten Pairing-Basislinie abweichen
- lokal zwischengespeicherte Geräte-Token-Einträge für den aktuellen Rechner, die älter sind als eine
  gatewayseitige Token-Rotation oder veraltete Scope-Metadaten enthalten

Doctor genehmigt Pair-Anfragen nicht automatisch und rotiert Geräte-Token nicht automatisch. Es
gibt stattdessen die exakten nächsten Schritte aus:

- ausstehende Anfragen mit `openclaw devices list` prüfen
- die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
- ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
- einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

Dies schließt die häufige Lücke „bereits gepaart, aber weiterhin Pairing erforderlich“:
doctor unterscheidet jetzt zwischen erstmaligem Pairing, ausstehenden Rollen-/Scope-
Upgrades und veraltetem Token-/Geräteidentitäts-Drift.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd-linger (Linux)

Wenn es als systemd-Benutzerdienst läuft, stellt doctor sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Logout aktiv bleibt.

### 11) Workspace-Status (Skills, Plugins und alte Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Status für den Standard-Agenten aus:

- **Skills-Status**: zählt geeignete, mit fehlenden Anforderungen und durch Allowlist blockierte Skills.
- **Alte Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Workspace-Verzeichnisse
  neben dem aktuellen Workspace vorhanden sind.
- **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für
  Fehler auf; meldet Fähigkeiten von Bundle-Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnose**: zeigt alle Warnungen oder Fehler beim Laden an, die von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe der Bootstrap-Datei

Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten
Zeichenbudget liegen oder es überschreiten. Es meldet pro Datei rohe vs. injizierte Zeichenanzahlen, Abschneidungs-
Prozent, Abschneidungsursache (`max/file` oder `max/total`) und insgesamt injizierte
Zeichen als Anteil am Gesamtbudget. Wenn Dateien abgeschnitten werden oder nahe am Limit liegen,
gibt doctor Hinweise zur Abstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Completion

Doctor prüft, ob Tab-Completion für die aktuelle Shell installiert ist
(zsh, bash, fish oder PowerShell):

- Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet
  (`source <(openclaw completion ...)`), aktualisiert doctor es auf die schnellere
  Variante mit zwischengespeicherter Datei.
- Wenn Completion im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  erzeugt doctor den Cache automatisch neu.
- Wenn überhaupt keine Completion konfiguriert ist, fordert doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

### 12) Gateway-Auth-Prüfungen (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet doctor an, eines zu erzeugen.
- Wenn `gateway.auth.token` per `SecretRef` verwaltet wird, aber nicht verfügbar ist, warnt doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur dann, wenn kein Token-`SecretRef` konfiguriert ist.

### 12b) SecretRef-bewusste Reparaturen im Nur-Lese-Modus

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Laufzeitverhalten beim schnellen Fehlschlagen abzuschwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe Nur-Lese-Zusammenfassungsmodell für `SecretRef` wie Befehle der Statusfamilie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom`-`@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token per `SecretRef` konfiguriert ist, aber im aktuellen Befehlsablauf nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Gateway-Integritätsprüfung + Neustart

Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund wirkt.

### 13b) Bereitschaft der Memory-Suche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Memory-Suche für den
Standard-Agenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Wenn nicht, werden Hinweise zur Behebung ausgegeben, einschließlich des npm-Pakets und einer manuellen Binärpfad-Option.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  Remote-/herunterladbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
- **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel
  in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-
  Provider in der automatischen Auswahlreihenfolge.

Wenn ein Ergebnis der Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung gesund), gleicht doctor dieses Ergebnis mit der in der CLI sichtbaren Konfiguration ab und vermerkt
alle Abweichungen.

Verwenden Sie `openclaw memory status --deep`, um die Bereitschaft von Embeddings zur Laufzeit zu verifizieren.

### 14) Kanalstatuswarnungen

Wenn das Gateway gesund ist, führt doctor eine Prüfung des Kanalstatus aus und meldet
Warnungen mit Vorschlägen zur Behebung.

### 15) Audit der Supervisor-Konfiguration + Reparatur

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-`network-online`-Abhängigkeiten und
Neustartverzögerung). Wenn es eine Abweichung findet, empfiehlt es eine Aktualisierung und kann
die Service-Datei/Aufgabe auf die aktuellen Standardwerte umschreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturaufforderungen.
- `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per `SecretRef` verwaltet wird, validiert die Installation/Reparatur des Doctor-Dienstes den `SecretRef`, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-`SecretRef` nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt wird.
- Für Linux-Benutzer-systemd-Units umfassen die Prüfungen von doctor auf Token-Drift jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Auth-Metadaten.
- Sie können jederzeit ein vollständiges Umschreiben mit `openclaw gateway install --force` erzwingen.

### 16) Gateway-Laufzeit- + Port-Diagnose

Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der
Dienst installiert, aber tatsächlich nicht ausgeführt wird. Es prüft auch auf Portkollisionen
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem per Versionsmanager verwalteten Node-Pfad
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades kaputtgehen, weil der Dienst Ihre
Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn
verfügbar (Homebrew/apt/choco).

### 18) Schreiben der Konfiguration + Wizard-Metadaten

Doctor speichert alle Konfigurationsänderungen und versieht Wizard-Metadaten mit einem Zeitstempel, um den
Doctor-Lauf zu dokumentieren.

### 19) Workspace-Hinweise (Backup + Memory-System)

Doctor schlägt ein Workspace-Memory-System vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus,
wenn der Workspace noch nicht unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur
Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).

## Verwandt

- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Gateway-Runbook](/de/gateway)
