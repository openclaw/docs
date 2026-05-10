---
read_when:
    - Hinzufügen oder Ändern von doctor-Migrationen
    - Einführung inkompatibler Konfigurationsänderungen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doktor
x-i18n:
    generated_at: "2026-05-10T19:35:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Integrität und liefert umsetzbare Reparaturschritte.

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

    Standardwerte ohne Rückfragen akzeptieren (einschließlich Neustart-/Dienst-/Sandbox-Reparaturschritten, sofern zutreffend).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Verschieben von Zuständen auf dem Datenträger). Überspringt Neustart-/Dienst-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - UI-Protokoll-Aktualitätsprüfung (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Integritätsprüfung und Neustart-Eingabeaufforderung.
    - Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Talk-Konfigurationsmigration von Legacy-Flachfeldern `talk.*` zu `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
    - OpenCode-Provider-Override-Warnungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex-OAuth-Shadowing-Warnungen (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Plugin-/Tool-Allowlist-Warnungen, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin nach Wildcard- oder Plugin-eigenen Tools verlangt.
    - Legacy-Migration von Zuständen auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Legacy-Cron-Speichermigration (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Bereinigung der Legacy-Ganzagent-Runtime-Richtlinie; die Provider-/Modell-Runtime-Richtlinie ist der aktive Routenselektor.
    - Bereinigung veralteter Plugin-Konfiguration, wenn Plugins aktiviert sind; wenn `plugins.enabled=false`, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen Builds vom 2026.4.24 erstellt wurden.
    - Erkennung von Tombstones für Neustart-Wiederherstellung blockierter Subagents, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungsflags, damit der Start das Kind nicht weiter als per Neustart abgebrochen behandelt.
    - Zustandsintegritäts- und Berechtigungsprüfungen (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen für Konfigurationsdateien (chmod 600) bei lokaler Ausführung.
    - Integrität der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Legacy-Dienstmigration und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Runtime-Prüfungen (Dienst installiert, aber nicht laufend; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway geprüft).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; Discord-Sprachkanalberechtigungen werden zum Beispiel mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - WhatsApp-Reaktionsfähigkeitsprüfungen für beeinträchtigte Gateway-Event-Loop-Integrität, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-`openai-codex/*`-Modellreferenzen in primären Modellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und Sitzungsrouten-Pins; `--fix` schreibt sie zu `openai/*` um, entfernt veraltete Sitzungs-/Ganzagent-Runtime-Pins und belässt kanonische OpenAI-Agent-Referenzen auf dem standardmäßigen Codex-Harness.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung der eingebetteten Proxy-Umgebung für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Runtime-Best-Practice-Prüfungen (Node gegenüber Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Authentifizierung, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Authentifizierungsprüfungen für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Geräte-Token-Cache und Auth-Drift bei gekoppelten Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Kürzung/nahem Limit für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standardagenten; meldet erlaubte Skills mit fehlenden Binaries, fehlender Umgebung, Konfiguration oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Prüfung des Status der Shell-Vervollständigung und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung für den Memory-Suche-Embedding-Provider (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Control-UI-Dreams-Szene enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im Doctor-Stil, sind aber **nicht** Teil der `openclaw doctor`-CLI-Reparatur/-Migration.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den grounded REM diary pass aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorbereitete, ausschließlich grounded Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder täglichen Support angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stagen grounded Kandidaten nicht automatisch in den Live-Kurzzeit-Promotion-Speicher, außer Sie führen den vorbereiteten CLI-Pfad zuerst explizit aus

Wenn Sie möchten, dass grounded historische Wiedergabe die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden grounded langlebige Kandidaten in den Kurzzeit-Dreaming-Speicher gestaged, während `DREAMS.md` die Review-Oberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es an, vor dem Ausführen von Doctor zu aktualisieren (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert Doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Talk-Flachfelder. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt Legacy-Echtzeitselektoren auf oberster Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt außerdem, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tooleinträge verwendet. `tools.allow: ["*"]` trifft nur Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-Allowlist nicht.
    Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Allowlist-Konfigurationen, um das bestehende Verhalten gebündelter Provider beizubehalten,
    und verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy-Konfigurationsschlüssel-Migrationen">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und bitten Sie, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und bittet Sie, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Cron-Job-Speichermigrationen werden ebenfalls von `openclaw doctor --fix` gehandhabt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen konfigurierter Channels ohne sichtbare Antwortrichtlinie → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Verschieben Sie bei Channels mit benannten `accounts`, aber verbliebenen Single-Account-Channel-Werten auf oberster Ebene, diese account-bezogenen Werte in den für diesen Channel ausgewählten hochgestuften Account (`accounts.default` für die meisten Channels; Matrix kann ein vorhandenes passendes benanntes/Standard-Ziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` entfernen; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` entfernen (veraltete Erweiterungs-Relay-Einstellung)
    - veraltete `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` entfernen; der Codex-App-Server behält Codex-native Workspace-Tools immer nativ bei

    Doctor-Warnungen enthalten außerdem Account-Default-Hinweise für Multi-Account-Channels:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing einen unerwarteten Account auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Account-ID gesetzt ist, warnt Doctor und listet die konfigurierten Account-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie den Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Erweiterungspfad verweist, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standard-Auto-Connect-Profile installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway/Node-Host
    - den lokal laufenden Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - die Bestätigung der ersten Attach-Zustimmungsabfrage im Browser

    Die Bereitschaft bezieht sich hier nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Raw CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungs-Endpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Korrekturhinweise aus. Unter macOS mit einem Homebrew-Node ist die Korrektur normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können sie den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Versionen automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen neben Codex OAuth erkannt werden, damit Sie den veralteten Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Natives Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen; OpenAI-Agent-Turns laufen über das Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Default-Agent- und Per-Agent-Referenzen um, einschließlich Primärmodelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Channel-Modell-Overrides und veraltetem persistiertem Session-Routenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die Codex-Absicht wird in provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge für reparierte Agent-Modellreferenzen verschoben, damit `openai-codex:...`-Auth-Profile weiterhin ausgewählt werden können, nachdem die Modellreferenz zu `openai/*` geworden ist.
    - Veraltete Runtime-Konfiguration für ganze Agents und persistierte Session-Runtime-Pins werden entfernt, da die Runtime-Auswahl provider-/modellbezogen ist.
    - Vorhandene Provider-/Modell-Runtime-Richtlinien bleiben erhalten, sofern die reparierte veraltete Modellreferenz kein Codex-Routing benötigt, um den alten Auth-Pfad beizubehalten.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Einstellungen pro Modell werden vom veralteten Schlüssel zum kanonischen `openai/*`-Schlüssel verschoben.
    - Persistierte Session-`modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Auth-Profil-Pins werden in allen gefundenen Agent-Session-Stores repariert.
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden.“

  </Accordion>
  <Accordion title="2g. Session-Routenbereinigung">
    Doctor durchsucht außerdem gefundene Agent-Session-Stores nach veraltetem automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder Runtime von einer Plugin-eigenen Route wie Codex wegbewegt haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status löschen, etwa Modell-Pins mit `modelOverrideSource: "auto"`, Runtime-Modellmetadaten, gepinnte Harness-IDs, CLI-Session-Bindings und automatische Auth-Profil-Overrides, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzer- oder veraltete Session-Modellentscheidungen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new` oder setzen Sie die Session zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen von veraltetem Zustand (Festplattenlayout)">
    Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

    - Session-Store + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Zustand (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Account-ID: `default`)

    Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Der Gateway/CLI migriert außerdem den veralteten Session- und Agent-Verzeichnis-Pfad beim Start automatisch, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agent-spezifischen Pfad landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Talk-Provider-/Provider-Map-Normalisierung vergleicht jetzt nach struktureller Gleichheit, sodass reine Schlüsselreihenfolge-Diffs keine wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das `contracts`-Objekt zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der `contracts`-Schlüssel bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Stores">
    Doctor prüft außerdem den Cron-Job-Store (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Delivery-Aliasse → explizites `delivery.channel`
    - einfache veraltete `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job veralteten Notify-Fallback mit einem vorhandenen Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und belässt diesen Job zur manuellen Prüfung.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses host-lokale Skript wird von der aktuellen OpenClaw-Version nicht gepflegt und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health-Checks.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er: den Pfad, die PID, ob die PID noch lebt, das Alter des Locks und ob es als veraltet gilt (tote PID, älter als 30 Minuten oder eine lebende PID, die nachweislich zu einem Nicht-OpenClaw-Prozess gehört). Im Modus `--fix` / `--repair` entfernt er veraltete Lock-Dateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, den Befehl erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Struktur, die durch den Prompt-Transkript-Rewrite-Bug vom 2026.4.24 entstanden ist: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Runtime-Kontext plus ein aktiver Sibling mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Historie und Memory-Reader keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Das State-Verzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Anmeldedaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **State-Verzeichnis fehlt**: warnt vor katastrophalem State-Verlust, fordert zum Neuerstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des State-Verzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-cloud-synchronisiertes State-Verzeichnis**: warnt, wenn State unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da sync-gestützte Pfade langsamere I/O und Lock-/Sync-Races verursachen können.
    - **Linux-SD- oder eMMC-State-Verzeichnis**: warnt, wenn State auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da zufällige I/O auf SD- oder eMMC-Speicher langsamer sein und unter Sitzungs- und Anmeldedatenschreibvorgängen schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Historie zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkript-Abweichung**: warnt, wenn aktuelle Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (Historie sammelt sich nicht an).
    - **Mehrere State-Verzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (Historie kann sich zwischen Installationen aufteilen).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der State lebt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor inspiziert OAuth-Profile im Auth-Store, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider Sie auffordert, sich erneut anzumelden), meldet Doctor, dass erneute Authentifizierung erforderlich ist, und gibt den exakten auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend unbrauchbar sind aufgrund von:

    - kurzen Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Billing-/Credit-Fehler)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder zu veralteten Namen zu wechseln, wenn das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor entfernt veralteten von OpenClaw generierten Plugin-Abhängigkeits-Staging-State im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Install-Stage-Verzeichnisse, paketlokale Rückstände aus früherem Abhängigkeits-Reparaturcode für gebündelte Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration sie referenziert, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Channel-/Provider-/Sucheinstellungen und konfigurierte Agent-Runtimes. Während Paketaktualisierungen vermeidet Doctor, die Package-Manager-Plugin-Reparatur auszuführen, während das Core-Paket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurations-Neuladen führen keine Package-Manager aus; Plugin-Installationen bleiben explizite Doctor-/Install-/Update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Dienste gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Benutzer-Level-Dienst, wenn der benutzerseitige Gateway-Dienst fehlt, aber ein systemweiter OpenClaw-Gateway-Dienst existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie anschließend das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    Wenn ein Matrix-Channel-Konto eine ausstehende oder handlungsfähige veraltete State-Migration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Vor-Migrations-Snapshot und führt anschließend die Best-Effort-Migrationsschritte aus: veraltete Matrix-State-Migration und veraltete Vorbereitung des verschlüsselten State. Beide Schritte sind nicht fatal; Fehler werden geloggt und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor inspiziert jetzt den Device-Pairing-State als Teil des normalen Health-Durchlaufs.

    Was er meldet:

    - ausstehende erstmalige Pairing-Anfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Public-Key-Mismatch-Reparaturen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr zum genehmigten Datensatz passt
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes außerhalb der genehmigten Pairing-Baseline abweichen
    - lokal gecachte Device-Token-Einträge für die aktuelle Maschine, die vor einer Gateway-seitigen Token-Rotation liegen oder veraltete Scope-Metadaten tragen

    Doctor genehmigt Pairing-Anfragen nicht automatisch und rotiert Device-Tokens nicht automatisch. Stattdessen gibt er die exakten nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` inspizieren
    - die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber Pairing weiterhin erforderlich“: Doctor unterscheidet jetzt erstmaliges Pairing von ausstehenden Rollen-/Scope-Upgrades und von veraltetem Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Security warnings">
    Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder wenn eine Policy gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Wenn die Ausführung als systemd-Benutzerdienst erfolgt, stellt Doctor sicher, dass Lingering aktiviert ist, damit das Gateway nach dem Abmelden aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor gibt eine Zusammenfassung des Workspace-State für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, fehlende-Anforderungen- und Allowlist-blockierte Skills.
    - **Veraltete Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere veraltete Workspace-Verzeichnisse neben dem aktuellen Workspace existieren.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Bundle-Plugin-Fähigkeiten.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Runtime haben.
    - **Plugin-Diagnosen**: zeigt alle Load-Time-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder darüber. Er meldet pro Datei rohe vs. injizierte Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und insgesamt injizierte Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt es außerdem die verwaiste Channel-bezogene Konfiguration, die dieses Plugin referenziert hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dies verhindert Gateway-Boot-Loops, bei denen die Channel-Runtime verschwunden ist, die Konfiguration das Gateway aber weiterhin auffordert, daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor prüft, ob Tab-Completion für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere gecachte Dateivariante.
    - Wenn Completion im Profil konfiguriert ist, die Cache-Datei aber fehlt, regeneriert Doctor den Cache automatisch.
    - Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; wird mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell zu regenerieren.

  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` über SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Statusbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Healthcheck + Neustart">
    Doctor führt einen Healthcheck aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Falls nicht, gibt es Reparaturhinweise aus, einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Wenn sie fehlt, wird der Wechsel zu einem Remote-Provider vorgeschlagen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Prüft, ob ein API-Schlüssel in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, wenn er fehlt.
    - **Auto-Provider**: Prüft zuerst die lokale Modellverfügbarkeit und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den tiefen Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatus-Warnungen">
    Wenn das Gateway fehlerfrei ist, führt Doctor eine Kanalstatusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Prüfung und Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor eine Aktualisierung und kann die Service-Datei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Lebenszyklus des Gateway-Service schreibgeschützt. Es meldet weiterhin den Service-Zustand und führt Nicht-Service-Reparaturen aus, überspringt aber Service-Installation/Start/Neustart/Bootstrap, das Umschreiben der Supervisor-Konfiguration und die Bereinigung veralteter Services, da ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt Doctor keine Befehls-/Entrypoint-Metadaten um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert es inaktive zusätzliche nicht veraltete Gateway-ähnliche Units während der Duplikat-Service-Prüfung, damit begleitende Service-Dateien keine Bereinigungsgeräusche erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Doctor-Service-Installation/-Reparatur den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Service-Umgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Service-Metadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Service-Befehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festschreibt, und schreibt die Service-Metadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-User-systemd-Units berücksichtigen Doctor-Prüfungen auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Authentifizierungsmetadaten.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service von einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Port-Diagnose">
    Doctor untersucht die Service-Laufzeit (PID, letzter Beendigungsstatus) und warnt, wenn der Service installiert ist, aber nicht tatsächlich läuft. Außerdem prüft es auf Port-Kollisionen am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Version-Manager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer systemweiten Node-Installation zu migrieren, wenn sie verfügbar ist (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren. Dadurch bleiben von Homebrew verwaltete System-Binärdateien verfügbar, während Volta, asdf, fnm, pnpm und andere Version-Manager-Verzeichnisse nicht ändern, welches Node von Child-Prozessen aufgelöst wird. Linux-Services behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Binärverzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Version-Managern werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreibung + Assistent-Metadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht Assistent-Metadaten mit einem Stempel, um den Doctor-Lauf zu erfassen.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
