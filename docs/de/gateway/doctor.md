---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung von nicht abwärtskompatiblen Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-12T08:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft den Zustand und stellt umsetzbare Reparaturschritte bereit.

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-, Service- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Migrationen von Legacy-Zuständen werden automatisch ausgeführt, wenn sie erkannt werden.

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
  <Accordion title="Zustand, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - UI-Protokoll-Aktualitätsprüfung (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung und Neustartabfrage.
    - Zusammenfassung des Skills-Status (berechtigt/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Talk-Konfigurationsmigration von alten flachen `talk.*`-Feldern in `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcards oder Plugin-eigene Tools anfordert.
    - Migration von Legacy-Zuständen auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Bereinigung von Legacy-Laufzeitrichtlinien für den gesamten Agenten; Provider-/Modell-Laufzeitrichtlinien sind der aktive Routenselektor.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungssperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für doppelte Prompt-Rewrite-Zweige, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für Neustartwiederherstellung festgefahrener Subagenten, mit `--fix`-Unterstützung zum Bereinigen veralteter abgebrochener Wiederherstellungsflags, damit der Start den Child nicht weiter als durch Neustart abgebrochen behandelt.
    - Prüfungen von Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Zustand der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Service-Migration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Service installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; zum Beispiel werden Berechtigungen für Discord-Sprachkanäle mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` auditiert.
    - WhatsApp-Reaktionsfähigkeitsprüfungen für beeinträchtigte Gateway-Event-Loop-Gesundheit, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für alte `openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsrouten-Pins; `--fix` schreibt sie in `openai/*` um, entfernt veraltete Sitzungs-/Gesamt-Agent-Laufzeit-Pins und belässt kanonische OpenAI-Agentenreferenzen auf dem Standard-Codex-Harness.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während der Installation oder Aktualisierung Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen nach Best Practices (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Geräte-Token-Cache und Auth-Drift bei gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - Prüfung von systemd-Linger unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Warnungen bei Kürzung/Annäherung an das Limit für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standardagenten; meldet zugelassene Skills mit fehlenden Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung und automatische Installation/Aktualisierung der Shell-Vervollständigung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen von Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden RPC-Methoden im Stil von Gateway Doctor, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich grounded, kurzfristige Einträge, die aus historischem Replay stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie selbst **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stellen grounded Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, es sei denn, Sie führen zuerst ausdrücklich den bereitgestellten CLI-Pfad aus

Wenn Sie möchten, dass grounded historisches Replay die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt grounded dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereit, während `DREAMS.md` als Prüffläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es an, vor der Doctor-Ausführung zu aktualisieren (Fetch/Rebase/Build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert Doctor sie in das aktuelle Schema.

    Das umfasst alte flache Talk-Felder. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen wie `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt alte Echtzeit-Selektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` entspricht nur Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Allowlist nicht. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um bestehendes Verhalten gebündelter Provider beizubehalten, und
    verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erläutern, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Migrationen des Cron-Job-Speichers werden ebenfalls von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen für konfigurierte Kanäle ohne sichtbare Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Verschieben Sie bei Kanälen mit benannten `accounts`, aber verbleibenden Single-Account-Kanalwerten auf oberster Ebene, diese accountbezogenen Werte in den hochgestuften Account, der für diesen Kanal ausgewählt wurde (`accounts.default` für die meisten Kanäle; Matrix kann ein bestehendes passendes benanntes/standardmäßiges Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enumerationswert gesetzt ist, statt geschlossen fehlzuschlagen)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` entfernen; der Codex App-Server behält Codex-native Workspace-Tools immer nativ bei

    Doctor-Warnungen enthalten außerdem Account-Default-Hinweise für Kanäle mit mehreren Accounts:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing einen unerwarteten Account auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Account-ID gesetzt ist, warnt Doctor und listet konfigurierte Account-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@earendil-works/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie den Override entfernen und API-Routing pro Modell + Kosten wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad zeigt, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome für standardmäßige Auto-Connect-Profile auf demselben Host installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal ausgeführten Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - die Genehmigung der ersten Attach-Einwilligungsabfrage im Browser

    Die Bereitschaft hier betrifft nur lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Behebungshinweise aus. Unter macOS mit einem Homebrew-Node lautet die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können sie den integrierten Codex-OAuth-Provider-Pfad überlagern, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth erkannt werden, damit Sie den veralteten Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Natives Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen; OpenAI-Agent-Turns laufen über das Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Default-Agent- und agentenspezifische Referenzen um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veralteter persistierter Sitzungsroutenzustände:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Codex-Intent wird für reparierte Agent-Modellreferenzen in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge verschoben, sodass `openai-codex:...`-Auth-Profile weiterhin ausgewählt werden können, nachdem die Modellreferenz zu `openai/*` geworden ist.
    - Veraltete Runtime-Konfiguration für ganze Agents und persistierte Sitzungs-Runtime-Pins werden entfernt, weil die Runtime-Auswahl Provider-/modellbezogen ist.
    - Bestehende Provider-/Modell-Runtime-Richtlinien bleiben erhalten, außer die reparierte veraltete Modellreferenz benötigt Codex-Routing, um den alten Auth-Pfad beizubehalten.
    - Bestehende Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Einstellungen pro Modell werden vom veralteten Schlüssel auf den kanonischen Schlüssel `openai/*` verschoben.
    - Persistierte Sitzungswerte für `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Auth-Profil-Pins werden in allen erkannten Agent-Sitzungsspeichern repariert.
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden.“

  </Accordion>
  <Accordion title="2g. Sitzungsroutenbereinigung">
    Doctor durchsucht außerdem erkannte Agent-Sitzungsspeicher nach veraltetem automatisch erstelltem Routenzustand, nachdem Sie konfigurierte Modelle oder Runtime von einer Plugin-eigenen Route wie Codex wegbewegt haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Zustand löschen, etwa `modelOverrideSource: "auto"`-Modell-Pins, Runtime-Modellmetadaten, gepinnte Harness-IDs, CLI-Sitzungsbindungen und automatische Auth-Profil-Overrides, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzer- oder Legacy-Sitzungsmodellentscheidungen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Veraltete Zustandsmigrationen (Datenträgerlayout)">
    Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Zustand (Baileys):
      - aus veralteten `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (standardmäßige Account-ID: `default`)

    Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Gateway/CLI migriert außerdem automatisch die veralteten Sitzungen + das Agent-Verzeichnis beim Start, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im Pfad pro Agent landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt anhand struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Veraltete Plugin-Manifest-Migrationen">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet er an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Veraltete Cron-Speichermigrationen">
    Doctor prüft außerdem den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Felder der obersten Payload-Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Felder der obersten Zustellungsebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliase → explizites `delivery.channel`
    - einfache alte `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den alten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Zustellungsmodus kombiniert, gibt Doctor eine Warnung aus und überlässt diesen Job der manuellen Prüfung.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das alte `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird vom aktuellen OpenClaw nicht gepflegt und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Zustandsprüfungen.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Nicht-OpenClaw-Prozess gehört). Im Modus `--fix` / `--repair` entfernt er veraltete Sperrdateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, ihn erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungs-Transkript-Branches">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Form, die durch den Prompt-Transkript-Rewrite-Fehler vom 2026.4.24 erstellt wurde: ein aufgegebener Benutzerzug mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwisterknoten mit demselben sichtbaren Benutzerprompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Speicherleser keine doppelten Züge mehr sehen.
  </Accordion>
  <Accordion title="4. Zustandsintegritätsprüfungen (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Protokolle und Konfiguration (sofern Sie keine Sicherungen an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zum erneuten Erstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, weil synchronisierte Pfade langsamere E/A und Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte zufällige E/A langsamer sein und unter Sitzungs- und Anmeldedatenschreibvorgängen schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn aktuellen Sitzungseinträgen Transkriptdateien fehlen.
    - **Hauptsitzung „1-Zeilen-JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Verlauf sammelt sich nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Erinnerung**: Wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand liegt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Authentifizierungszustand (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Authentifizierungsspeicher, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Authentifizierungsprofile, die vorübergehend nicht nutzbar sind wegen:

    - kurzen Abkühlzeiten (Ratenlimits/Zeitüberschreitungen/Authentifizierungsfehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Validierung des Hooks-Modells">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Reparatur des Sandbox-Images">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, zu bauen oder auf alte Namen zu wechseln, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung von Plugin-Installationen">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` den alten von OpenClaw generierten Staging-Zustand für Plugin-Abhängigkeiten. Dies umfasst veraltete generierte Abhängigkeitswurzeln, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Code zur Reparatur von Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können. Doctor verknüpft außerdem das Hostpaket `openclaw` erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Updates oder npm-Reparaturen weiter aufgelöst werden.

    Doctor kann auch fehlende herunterladbare Plugins erneut installieren, wenn die Konfiguration sie referenziert, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen vermeidet Doctor die Ausführung der Paketmanager-Plugin-Reparatur, während das Kernpaket ausgetauscht wird; führen Sie nach dem Update erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway-Dienstmigrationen und Bereinigungshinweise">
    Doctor erkennt alte Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen gatewayartigen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare alte Zustandsmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Vor-Migrations-Snapshot und führt anschließend die Best-Effort-Migrationsschritte aus: alte Matrix-Zustandsmigration und Vorbereitung des alten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im Nur-Lese-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsdrift">
    Doctor untersucht jetzt den Gerätekopplungszustand als Teil des normalen Zustandsdurchlaufs.

    Was er meldet:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei öffentlichem-Schlüssel-Abgleichfehlern, bei denen die Geräte-ID noch passt, die Geräteidentität aber nicht mehr zum genehmigten Datensatz passt
    - gekoppelte Datensätze ohne aktives Token für eine genehmigte Rolle
    - gekoppelte Tokens, deren Scopes außerhalb der genehmigten Kopplungsbasislinie abdriften
    - lokal zwischengespeicherte Geräte-Token-Einträge für die aktuelle Maschine, die älter sind als eine Gateway-seitige Token-Rotation oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Stattdessen gibt er die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber weiterhin Kopplung erforderlich“: Doctor unterscheidet jetzt erstmalige Kopplung von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitätsdrift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Richtlinie gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bei Ausführung als systemd-Benutzerdienst stellt Doctor sicher, dass lingering aktiviert ist, damit der Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Arbeitsbereichsstatus (Skills, Plugins und alte Verzeichnisse)">
    Doctor gibt eine Zusammenfassung des Arbeitsbereichszustands für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, mit fehlenden Anforderungen versehene und durch Allowlist blockierte Skills.
    - **Alte Arbeitsbereichsverzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Arbeitsbereichsverzeichnisse neben dem aktuellen Arbeitsbereich existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für etwaige Fehler auf; meldet Fähigkeiten gebündelter Plugins.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Laufzeit haben.
    - **Plugin-Diagnosen**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Größe der Bootstrap-Dateien">
    Doctor prüft, ob Arbeitsbereich-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder dieses überschreiten. Er meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Kanal-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Kanal-Plugin entfernt, entfernt es auch die verwaiste kanalspezifische Konfiguration, die dieses Plugin referenziert hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Kanal benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Bootschleifen, bei denen die Kanallaufzeit verschwunden ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet (`source <(openclaw completion ...)`), aktualisiert doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn Completion im Profil konfiguriert ist, die Cache-Datei aber fehlt, generiert doctor den Cache automatisch neu.
    - Wenn überhaupt keine Completion konfiguriert ist, fordert doctor zur Installation auf (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Auth-Prüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Telegram-Reparatur von `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlicherweise als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung + Neustart">
    Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob das `qmd`-Binary verfügbar und startbar ist. Falls nicht, werden Hinweise zur Behebung ausgegeben, einschließlich npm-Paket und einer Option für einen manuellen Binary-Pfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte entfernte/herunterladbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, zu einem Remote-Provider zu wechseln.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Überprüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
    - **Auto-Provider**: Prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht doctor dessen Ergebnis mit der CLI-sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen frischen Embedding-Ping; verwenden Sie den Deep-Memory-Statusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt doctor eine Kanalstatusprüfung aus und meldet Warnungen mit empfohlenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsprüfung + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es eine Aktualisierung und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Abfragen an.
    - `openclaw doctor --repair --force` überschreibt angepasste Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Es meldet weiterhin die Service-Integrität und führt Nicht-Service-Reparaturen aus, überspringt aber Service-Installation/Start/Neustart/Bootstrap, Umschreibungen der Supervisor-Konfiguration und die Bereinigung älterer Services, da ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt doctor Befehls-/Einstiegspunkt-Metadaten nicht um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive zusätzliche nicht-veraltete Gateway-ähnliche Units während des Duplicate-Service-Scans, damit begleitende Servicedateien kein Bereinigungsrauschen erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert die doctor-Service-Installation/-Reparatur den SecretRef, persistiert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Service-Umgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Service-Metadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Service-Befehl nach Änderungen an `gateway.port` noch einen alten `--port` festschreibt, und schreibt die Service-Metadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit festgelegt ist.
    - Für Linux-User-systemd-Units berücksichtigen doctor-Prüfungen auf Token-Drift jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Service-Auth-Metadaten.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der Service installiert ist, aber tatsächlich nicht läuft. Außerdem prüft es auf Portkollisionen am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) ausgeführt wird. WhatsApp- und Telegram-Kanäle erfordern Node, und Version-Manager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn verfügbar (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren, sodass Homebrew-verwaltete System-Binaries verfügbar bleiben, während Volta, asdf, fnm, pnpm und andere Version-Manager-Verzeichnisse nicht ändern, welches Node von Kindprozessen aufgelöst wird. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile User-Bin-Verzeichnisse, aber vermutete Version-Manager-Fallback-Verzeichnisse werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte vorhanden sind.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor persistiert alle Konfigurationsänderungen und stempelt Wizard-Metadaten, um den doctor-Lauf zu protokollieren.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn sich der Workspace noch nicht unter git befindet.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zu git-Backups (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
