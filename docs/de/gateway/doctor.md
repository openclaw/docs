---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Eingreifende Konfigurationsänderungen einführen
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-06T03:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c0a15c522994552a1eef39206bed71fc5bf45746776372f24f31c101bfbd411
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft den Systemzustand und liefert umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Akzeptiert Standardwerte ohne Rückfrage (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, sofern zutreffend).

```bash
openclaw doctor --repair
```

Wendet empfohlene Reparaturen ohne Rückfrage an (Reparaturen + Neustarts, wenn sicher).

```bash
openclaw doctor --repair --force
```

Wendet auch aggressive Reparaturen an (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

```bash
openclaw doctor --non-interactive
```

Wird ohne Rückfragen ausgeführt und wendet nur sichere Migrationen an (Konfigurationsnormalisierung + Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-/Service-/Sandbox-Aktionen, die eine Bestätigung durch Menschen erfordern.
Veraltete Zustandsmigrationen werden bei Erkennung automatisch ausgeführt.

```bash
openclaw doctor --deep
```

Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Vorabaktualisierung für Git-Installationen (nur interaktiv).
- Prüfung auf Aktualität des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
- Integritätsprüfung + Aufforderung zum Neustart.
- Zusammenfassung des Skills-Status (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für veraltete Werte.
- Talk-Konfigurationsmigration von veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
- Prüfungen zur Browser-Migration für veraltete Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen bei OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
- Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Migration veralteter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration veralteter Cron-Store-Daten (`jobId`, `schedule.cron`, Delivery-/Payload-Felder der obersten Ebene, Payload-`provider`, einfache Fallback-Jobs mit `notify: true` für Webhooks).
- Prüfung von Sitzungs-Lock-Dateien und Bereinigung veralteter Locks.
- Prüfungen auf Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
- Prüfungen der Berechtigungen für Konfigurationsdateien (`chmod 600`) bei lokaler Ausführung.
- Zustand der Modell-Authentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände für Auth-Profile.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
- Migration veralteter Matrix-Kanalzustände (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Prüfungen zu Best Practices für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkonflikten (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Tokenerzeugung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine SecretRef-Token-Konfigurationen).
- Prüfung auf systemd linger unter Linux.
- Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Kürzung/nahe am Limit für Kontextdateien).
- Prüfung des Status der Shell-Vervollständigung und automatische Installation/Aktualisierung.
- Prüfung der Einsatzbereitschaft des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
- Prüfungen der Quellinstallationen (pnpm-Workspace-Mismatch, fehlende UI-Assets, fehlende tsx-Binärdatei).
- Schreibt aktualisierte Konfiguration + Assistenten-Metadaten.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn es sich um ein Git-Checkout handelt und Doctor interaktiv ausgeführt wird, bietet es an, vor dem Ausführen von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration veraltete Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalbezogenen Override), normalisiert Doctor sie in das aktuelle Schema.

Dazu gehören veraltete flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen veralteter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche veralteten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein veraltetes Konfigurationsformat erkennt. Dadurch werden veraltete Konfigurationen ohne manuelles Eingreifen repariert.
Migrationen des Cron-Job-Stores werden von `openclaw doctor --fix` verarbeitet.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` auf oberster Ebene
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Für Kanäle mit benannten `accounts`, aber verbliebenen kanalbezogenen Werten der obersten Ebene aus Einzelkonto-Konfigurationen, diese kontobezogenen Werte in das für diesen Kanal ausgewählte hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)

Doctor-Warnungen enthalten außerdem Hinweise zu Standardkonten für Mehrkonten-Kanäle:

- Wenn zwei oder mehr Einträge in `channels.<channel>.accounts` konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt Doctor, dass Fallback-Routing möglicherweise ein unerwartetes Konto auswählt.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Overrides

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt davor, damit Sie den Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration weiterhin auf den entfernten Chrome-Erweiterungspfad zeigt, normalisiert Doctor sie auf das aktuelle Host-lokale Chrome-MCP-Attach-Modell:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft außerdem den Host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes Profil `existing-session` verwenden:

- prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer Verbindung installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert Sie daran, Remote-Debugging auf der Browser-Inspektionsseite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

Doctor kann die browserseitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- dass der Browser lokal ausgeführt wird
- aktiviertes Remote-Debugging in diesem Browser
- das Bestätigen der ersten Attach-Zustimmungsaufforderung im Browser

Die Bereitschaft hier betrifft nur lokale Voraussetzungen für das Attach. Existing-session behält die aktuellen Routing-Beschränkungen von Chrome MCP bei; fortgeschrittene Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale TLS-Stack von Node/OpenSSL die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Behebung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt, wenn das Gateway gesund ist.

### 3) Migrationen veralteter Zustände (Datenträgerlayout)

Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

- Sitzungsspeicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Authentifizierungszustand (Baileys):
  - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

Diese Migrationen sind Best-Effort und idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Das Gateway/CLI migriert auch die veralteten Sitzungen + das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Auth/Modelle ohne manuelle Ausführung von Doctor im pfadspezifischen Agent-Verzeichnis landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach struktureller Gleichheit, sodass Unterschiede nur in der Schlüsselreihenfolge keine wiederholten No-op-Änderungen bei `doctor --fix` mehr auslösen.

### 3a) Migrationen veralteter Plugin-Manifeste

Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.

### 3b) Migrationen veralteter Cron-Stores

Doctor prüft auch den Cron-Job-Store (`~/.openclaw/cron/jobs.json` standardmäßig oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Bereinigungen für Cron umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder der obersten Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder der obersten Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Payload-`provider`-Delivery-Aliase → explizites `delivery.channel`
- einfache veraltete Fallback-Jobs mit `notify: true` für Webhooks → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den veralteten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungs-Locks

Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreib-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung ungewöhnlich beendet wurde. Für jede gefundene Lock-Datei meldet es:
den Pfad, die PID, ob die PID noch aktiv ist, das Alter des Locks und ob es als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt es veraltete Lock-Dateien automatisch; andernfalls gibt es einen Hinweis aus und weist Sie an, den Befehl mit `--fix` erneut auszuführen.

### 4) Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist das operative Rückgrat. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfigurationen (sofern Sie keine Backups an anderer Stelle haben).

Doctor prüft:

- **Fehlendes Zustandsverzeichnis**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: verifiziert Schreibbarkeit; bietet eine Reparatur der Berechtigungen an (und gibt einen `chown`-Hinweis aus, wenn ein Eigentümer-/Gruppen-Mismatch erkannt wird).
- **Cloud-synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn sich der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` befindet, da synchronisierte Pfade langsamere I/O-Leistung sowie Lock-/Synchronisationskonflikte verursachen können.
- **Zustandsverzeichnis auf Linux-SD oder eMMC**: warnt, wenn sich der Zustand auf einer Einhängequelle `mmcblk*` befindet, da zufällige I/O auf SD- oder eMMC-Medien bei Schreibvorgängen für Sitzungen und Anmeldedaten langsamer sein und schneller verschleißen kann.
- **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Verzeichnis des Sitzungsspeichers sind erforderlich, um den Verlauf zu speichern und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
- **Hauptsitzung mit „1-zeiligem JSONL“**: meldet, wenn das Haupttranskript nur eine Zeile hat (der Verlauf wächst nicht an).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere Ordner `~/.openclaw` in Home-Verzeichnissen vorhanden sind oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort verweist (der Verlauf kann sich zwischen Installationen aufteilen).
- **Erinnerung an den Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor daran, den Befehl auf dem Remote-Host auszuführen (der Zustand liegt dort).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Zustand der Modell-Authentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Store, warnt bei bald ablaufenden/abgelaufenen Tokens und kann sie aktualisieren, wenn dies sicher ist. Wenn das OAuth-/Token-Profil von Anthropic veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den veralteten Setup-Token-Pfad für Anthropic vor.
Aufforderungen zur Aktualisierung werden nur bei interaktiver Ausführung (TTY) angezeigt; `--non-interactive` überspringt Aktualisierungsversuche.

Doctor erkennt auch veraltete entfernte Anthropic-Claude-CLI-Zustände. Wenn alte Credential-Bytes für `anthropic:claude-cli` weiterhin in `auth-profiles.json` vorhanden sind, wandelt Doctor sie zurück in Anthropic-Token-/OAuth-Profile um und schreibt veraltete Modellreferenzen `claude-cli/...` neu.
Wenn die Bytes nicht mehr vorhanden sind, entfernt Doctor die veraltete Konfiguration und gibt Befehle zur Wiederherstellung aus.

Doctor meldet auch Auth-Profile, die vorübergehend unbenutzbar sind aufgrund von:

- kurzen Cooldowns (Ratenbegrenzungen/Timeouts/Auth-Fehler)
- längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

### 6) Modellvalidierung für Hooks

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegenüber dem Katalog und der Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht zulässig ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu erstellen oder bei fehlendem aktuellem Image zu veralteten Namen zu wechseln.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert, dass Laufzeitabhängigkeiten gebündelter Plugins (zum Beispiel die Laufzeitpakete des Discord-Plugins) im OpenClaw-Installationsstamm vorhanden sind.
Wenn welche fehlen, meldet Doctor die Pakete und installiert sie im Modus `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrationen von Gateway-Diensten und Hinweise zur Bereinigung

Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Es kann auch nach zusätzlichen Gateway-ähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn für ein Matrix-Kanalkonto eine ausstehende oder durchführbare Migration veralteter Zustände vorhanden ist, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Migration des veralteten Matrix-Zustands und Vorbereitung des veralteten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd linger (Linux)

Wenn Doctor als systemd-Benutzerdienst ausgeführt wird, stellt es sicher, dass Linger aktiviert ist, damit das Gateway nach dem Abmelden weiterläuft.

### 11) Workspace-Status (Skills, Plugins und veraltete Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

- **Skills-Status**: zählt geeignete, mit fehlenden Voraussetzungen und durch Allowlist blockierte Skills.
- **Veraltete Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere veraltete Workspace-Verzeichnisse neben dem aktuellen Workspace vorhanden sind.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet bei Fehlern Plugin-IDs auf; meldet Capabilitys gebündelter Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
- **Plugin-Diagnose**: zeigt alle beim Laden ausgegebenen Warnungen oder Fehler der Plugin-Registry an.

### 11b) Größe der Bootstrap-Datei

Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder es überschreiten. Es meldet pro Datei Roh- gegenüber injizierten Zeichenanzahlen, Kürzungsprozentsatz, Ursache der Kürzung (`max/file` oder `max/total`) und die Gesamtzahl injizierter Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt sind oder nahe am Limit liegen, gibt Doctor Hinweise zur Abstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Vervollständigung

Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell installiert ist
(zsh, bash, fish oder PowerShell):

- Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
- Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  regeneriert Doctor den Cache automatisch.
- Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

### 12) Prüfungen der Gateway-Authentifizierung (lokaler Token)

Doctor prüft die Einsatzbereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu erzeugen.
- Wenn `gateway.auth.token` durch SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Erzeugung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Schreibgeschützte SecretRef-bewusste Reparaturen

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie die Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von `allowFrom` / `groupAllowFrom` mit `@username` für Telegram versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
- Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Integritätsprüfung des Gateways + Neustart

Doctor führt eine Integritätsprüfung durch und bietet an, das Gateway neu zu starten, wenn es ungesund erscheint.

### 13b) Bereitschaft der Speichersuche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agenten einsatzbereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Wenn nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Option für den Binärpfad.
- **Expliziter lokaler Provider**: prüft, ob eine lokale Modelldatei oder eine erkannte Remote-/downloadbare Modell-URL vorhanden ist. Wenn nicht, wird vorgeschlagen, auf einen Remote-Provider umzuschalten.
- **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel in der Umgebung oder im Auth-Store vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der automatischen Auswahlreihenfolge.

Wenn ein Ergebnis der Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung gesund), gleicht Doctor dessen Ergebnis mit der in der CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin.

Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt Doctor eine Prüfung des Kanalstatus aus und meldet Warnungen mit vorgeschlagenen Behebungen.

### 15) Audit + Reparatur der Supervisor-Konfiguration

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standards (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es eine Aktualisierung und kann die Dienstdatei/Aufgabe auf die aktuellen Standards neu schreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standard-Reparaturaufforderungen.
- `openclaw doctor --repair` wendet empfohlene Behebungen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token benötigt und `gateway.auth.token` von SecretRef verwaltet wird, validiert die Dienstinstallation/-reparatur von Doctor den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor die Installation/Reparatur, bis der Modus explizit gesetzt ist.
- Für Linux-Benutzer-systemd-Units umfassen die Prüfungen von Doctor auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleichen von Dienst-Auth-Metadaten.
- Sie können jederzeit ein vollständiges Neuschreiben mit `openclaw gateway install --force` erzwingen.

### 16) Laufzeit- + Portdiagnosen des Gateways

Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert, aber tatsächlich nicht ausgeführt wird. Es prüft auch auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Dienst auf Bun oder auf einem Node-Pfad eines Versionsmanagers
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle benötigen Node,
und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer systemweiten Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).

### 18) Konfigurationsschreiben + Assistenten-Metadaten

Doctor speichert alle Konfigurationsänderungen und setzt Assistenten-Metadaten, um den Doctor-Lauf zu protokollieren.

### 19) Workspace-Hinweise (Backup + Speichersystem)

Doctor schlägt ein Workspace-Speichersystem vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus, wenn sich der Workspace nicht bereits unter Git befindet.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und Git-Backups (empfohlen: privates GitHub oder GitLab).
