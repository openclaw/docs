---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung nicht abwärtskompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Zustandsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-07T13:17:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Gesundheit und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Nachfragen akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, sofern zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Nachfragen anwenden (Reparaturen und Neustarts, sofern sicher).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschiebungen des Zustands auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Systemdienste nach zusätzlichen Gateway-Installationen scannen (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es macht (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Gesundheit, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - Aktualitätsprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Gesundheitsprüfung und Neustartabfrage.
    - Skills-Statuszusammenfassung (berechtigt/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Talk-Konfigurationsmigration von alten flachen `talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Platzhalter- oder Plugin-eigene Tools anfordert.
    - Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
    - Migration von Legacy-Vertragsschlüsseln im Plugin-Manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Legacy-Cron-Speichermigration (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Migration der Legacy-Agent-Runtime-Richtlinie nach `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Branches, die von betroffenen Builds vom 2026-04-24 erstellt wurden.
    - Erkennung von festhängenden Subagent-Neustart-Recovery-Tombstones, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Recovery-Flags, damit der Start das Child nicht weiter als nach Neustart abgebrochen behandelt.
    - Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Modell-Authentifizierungsgesundheit: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Authentifizierungsprofilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Dienstmigration und Erkennung zusätzlicher Gateways.
    - Migration von Legacy-Zustand für den Matrix-Kanal (im Modus `--fix` / `--repair`).
    - Gateway-Runtime-Prüfungen (Dienst installiert, aber nicht laufend; gecachtes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway abgefragt).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; Discord-Sprachkanalberechtigungen werden beispielsweise mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` auditiert.
    - WhatsApp-Reaktionsfähigkeitsprüfungen auf beeinträchtigte Gateway-Event-Loop-Gesundheit, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-`openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsrouten-Pins; `--fix` schreibt sie zu `openai/*` um und wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, das `codex`-Harness beisteuert und nutzbares OAuth hat. Andernfalls wird `agentRuntime.id: "pi"` ausgewählt.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Best-Practice-Prüfungen für die Gateway-Runtime (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, veraltete Abweichungen im lokalen Geräte-Token-Cache und Authentifizierungsabweichungen in gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Prüfung der Größe der Workspace-Bootstrap-Datei (Warnungen zu Kürzung/Annäherung an Grenzwerte für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standard-Agenten; meldet erlaubte Skills mit fehlenden Binaries, Umgebungs-, Konfigurations- oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung der Shell-Vervollständigung und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen von Quellinstallationen (pnpm-Workspace-Nichtübereinstimmung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Zurücksetzen** und **Grounded löschen** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden RPC-Methoden im Gateway-Doctor-Stil, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Zurücksetzen** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Grounded löschen** entfernt nur vorbereitete rein Grounded-bezogene Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung gesammelt haben.

Was sie für sich genommen **nicht** tun:

- Sie bearbeiten `MEMORY.md` nicht
- Sie führen keine vollständigen Doctor-Migrationen aus
- Sie stellen Grounded-Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher, sofern Sie nicht zuerst explizit den vorbereiteten CLI-Pfad ausführen

Wenn Sie möchten, dass Grounded-Historical-Replay die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden Grounded-Durable-Kandidaten in den Kurzzeit-Dreaming-Speicher gestellt, während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es vor dem Ausführen von Doctor ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert Doctor sie in das aktuelle Schema.

    Dazu gehören flache Legacy-Talk-Felder. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen wie `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Zuordnung um und schreibt Legacy-Echtzeit-Selektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools
    aus Plugins überein, die tatsächlich geladen werden; es umgeht nicht die exklusive Plugin-
    Allowlist. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um bestehendes Verhalten gebündelter Provider zu erhalten,
    und verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Migrationen des Cron-Job-Speichers werden ebenfalls von `openclaw doctor --fix` verarbeitet.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen konfigurierter Kanäle mit fehlender sichtbarer Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltetes `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - veraltete Echtzeit-Talk-Selektoren auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Verschieben Sie bei Kanälen mit benannten `accounts`, aber verbliebenen Einzelkonto-Kanalwerten auf oberster Ebene, diese kontobezogenen Werte in das für diesen Kanal heraufgestufte Konto (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/standardmäßiges Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - entfernen Sie `agents.defaults.llm`; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - entfernen Sie `browser.relayBindHost` (veraltete Extension-Relay-Einstellung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)

    Doctor-Warnungen enthalten außerdem Hinweise zu Standardkonten für Kanäle mit mehreren Konten:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Überschreibungen">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und das API-Routing + die Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Extension-Pfad verweist, normalisiert Doctor sie auf das aktuelle hostlokale Chrome-MCP-Anhängemodell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für standardmäßige Auto-Connect-Profile auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Inspect-Seite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal ausgeführten Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - die Genehmigung der ersten Anhänge-Zustimmungsaufforderung im Browser

    Die Bereitschaft hier betrifft nur lokale Anhänge-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um sicherzustellen, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt, wenn das Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Überschreibungen">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth erkannt werden, damit Sie die veraltete Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Das native Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen; OpenAI-Agent-Turns laufen über das Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Standardagent- und agentenspezifische Referenzen um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und veraltetem persistentem Sitzungsroutenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die passende Agent-Laufzeit wird nur dann zu `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat.
    - Andernfalls wird die passende Agent-Laufzeit zu `agentRuntime.id: "pi"`.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Pro-Modell-Einstellungen werden vom veralteten Schlüssel zum kanonischen `openai/*`-Schlüssel verschoben.
    - Persistente Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise, Auth-Profil-Pins und Codex-Harness-Pins werden in allen gefundenen Agent-Sitzungsspeichern repariert.
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden“.
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden“.

  </Accordion>
  <Accordion title="2g. Sitzungsroutenbereinigung">
    Doctor scannt außerdem gefundene Agent-Sitzungsspeicher nach veraltetem automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder Laufzeiten von einer Plugin-eigenen Route wie Codex weg verschoben haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modell-Pins, Laufzeitmodell-Metadaten, gepinnte Harness-IDs, CLI-Sitzungsbindungen und automatische Auth-Profil-Überschreibungen löschen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzer- oder Legacy-Sitzungsmodellwahlen werden zur manuellen Prüfung gemeldet und bleiben unverändert; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Legacy-Statusmigrationen (Datenträgerlayout)">
    Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Status (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn Legacy-Ordner als Backups zurückbleiben. Das Gateway/die CLI migriert außerdem beim Start automatisch die veralteten Sitzungen + das Agent-Verzeichnis, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Talk-Provider-/Provider-Map-Normalisierung vergleicht jetzt per struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor scannt alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliasse → explizites `delivery.channel`
    - einfache Legacy-`notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den Legacy-Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und lässt diesen Job zur manuellen Prüfung unverändert.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das Legacy-Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses host-lokale Skript wird vom aktuellen OpenClaw nicht gewartet und kann fälschliche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Zustandsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair` entfernt er veraltete Sperrdateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, den Befehl erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranskript-Zweigen">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Zweigform, die durch den Prompt-Transkript-Rewrite-Bug vom 2026.4.24 entstanden ist: eine aufgegebene Benutzerrunde mit internem OpenClaw-Laufzeitkontext sowie ein aktiver Geschwisterzweig mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Zweig um, sodass Gateway-Verlauf und Speicherleser keine doppelten Runden mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Protokolle und Konfiguration (sofern Sie keine Sicherungen an anderer Stelle haben).

    Doctor prüft:

    - **Fehlendes Zustandsverzeichnis**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Zustandsverzeichnis mit Cloud-Synchronisierung**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierte Pfade langsamere I/O und Sperr-/Synchronisierungsrennen verursachen können.
    - **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf dauerhaft zu speichern und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Abweichung**: warnt, wenn aktuelle Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner in Home-Verzeichnissen existieren oder wenn `OPENCLAW_STATE_DIR` auf eine andere Stelle zeigt (Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand liegt dort).
    - **Konfigurationsdatei-Berechtigungen**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu beschränken.

  </Accordion>
  <Accordion title="5. Modell-Auth-Zustand (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Auth-Speicher, warnt, wenn Token bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher möglich ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend unbenutzbar sind wegen:

    - kurzer Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längerer Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Reparatur von Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder auf Legacy-Namen umzuschalten, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung der Plugin-Installation">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` den Legacy-Staging-Zustand für von OpenClaw generierte Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Install-Stage-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für gebündelte Plugin-Abhängigkeiten sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann auch fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Channel-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen vermeidet Doctor die Plugin-Reparatur über Paketmanager, während das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsarbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. OpenClaw-Gateway-Dienste mit Profilnamen gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor keinen zweiten Dienst auf Benutzerebene automatisch, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Migration der Startup Matrix">
    Wenn ein Matrix-Channel-Konto eine ausstehende oder ausführbare Legacy-Zustandsmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Zustandsmigration und Vorbereitung des Legacy-verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im Nur-Lese-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Drift">
    Doctor untersucht jetzt den Zustand der Gerätekopplung als Teil des normalen Zustandsdurchlaufs.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen von Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr zum genehmigten Datensatz passt
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Token, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für die aktuelle Maschine, die älter sind als eine Token-Rotation auf Gateway-Seite oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetoken nicht automatisch. Stattdessen gibt er die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch wird die häufige Lücke „bereits gekoppelt, aber Kopplung weiterhin erforderlich“ geschlossen: Doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veralteter Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Policy gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn OpenClaw als systemd-Benutzerdienst ausgeführt wird, stellt Doctor sicher, dass Linger aktiviert ist, damit das Gateway nach dem Abmelden aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt berechtigte, Anforderungen-nicht-erfüllt- und Allowlist-blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für etwaige Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnose**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Datei">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten Zeichenbudget liegen. Er meldet pro Datei Roh- gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und gesamte injizierte Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zum Abstimmen von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Channel-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt er auch die verwaiste channel-bezogene Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dadurch werden Gateway-Boot-Schleifen verhindert, bei denen die Channel-Laufzeit entfernt wurde, die Konfiguration das Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, generiert Doctor den Cache automatisch neu.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-fähige Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das frühe Fehlschlagen zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Statusfamilie für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Telegram-`allowFrom`-/`groupAllowFrom`-`@username`-Reparatur versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung + Neustart">
    Doctor führt eine Integritätsprüfung aus und bietet an, den Gateway neu zu starten, wenn er fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standardagenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Falls nicht, werden Reparaturhinweise einschließlich npm-Paket und einer Option für einen manuellen Binärpfad ausgegeben.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Authentifizierungsspeicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, falls er fehlt.
    - **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den ausführlichen Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn der Gateway fehlerfrei ist, führt Doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsprüfung + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-network-online-Abhängigkeiten und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor eine Aktualisierung und kann die Dienstdatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration umgeschrieben wird.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Gateway-Dienstlebenszyklus schreibgeschützt. Es meldet weiterhin die Dienstintegrität und führt Reparaturen ohne Dienstbezug aus, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap, Supervisor-Konfigurationsumschreibungen und die Bereinigung älterer Dienste, weil ein externer Supervisor diesen Lebenszyklus verwaltet.
    - Unter Linux schreibt Doctor Befehls-/Entrypoint-Metadaten nicht um, solange die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units während der Suche nach doppelten Diensten, damit begleitende Dienstdateien kein Bereinigungsrauschen erzeugen.
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Doctor-Dienstinstallation/-reparatur die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Dienstumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festlegt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Bei Linux-Benutzer-systemd-Units beziehen Doctor-Prüfungen auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen ein, wenn Dienst-Authentifizierungsmetadaten verglichen werden.
    - Doctor-Dienstreparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können über `openclaw gateway install --force` jederzeit ein vollständiges Umschreiben erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Dienstlaufzeit (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber nicht tatsächlich läuft. Außerdem prüft Doctor auf Portkollisionen am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Bewährte Verfahren für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Pfade von Versionsmanagern können nach Upgrades brechen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn eine verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren, sodass Volta-, asdf-, fnm-, pnpm- und andere Versionsmanager-Verzeichnisse nicht ändern, welche Node-Kindprozesse aufgelöst werden. Linux-Dienste behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Binärverzeichnisse bei, aber erratene Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Dienst-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht Wizard-Metadaten mit einem Zeitstempel, um den Doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Arbeitsbereichstipps (Backup + Speichersystem)">
    Doctor schlägt ein Arbeitsbereichs-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Arbeitsbereich noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zu Arbeitsbereichsstruktur und git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
