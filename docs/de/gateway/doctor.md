---
read_when:
    - doctor-Migrationen hinzufügen oder ändern
    - Nicht abwärtskompatible Konfigurationsänderungen einführen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-05-11T20:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
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

    Standardwerte ohne Nachfrage akzeptieren (einschließlich Neustart-, Dienst- und Sandbox-Reparaturschritten, sofern zutreffend).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Empfohlene Reparaturen ohne Nachfrage anwenden (Reparaturen + Neustarts, sofern sicher).

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

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung + Zustandsverschiebungen auf dem Datenträger). Überspringt Neustart-, Dienst- und Sandbox-Aktionen, die menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

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
  <Accordion title="Zustand, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - UI-Protokoll-Aktualitätsprüfung (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Zustandsprüfung + Neustartaufforderung.
    - Skills-Statuszusammenfassung (berechtigt/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flat-`talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Zulassungsliste, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Platzhalter- oder Plugin-eigene Tools anfordert.
    - Legacy-Migration des Zustands auf dem Datenträger (Sitzungen/Agentenverzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Schlüsseln des Plugin-Manifestvertrags (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Stores (`jobId`, `schedule.cron`, Felder der obersten Ebene für Zustellung/Payload, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
    - Bereinigung von Legacy-Laufzeitrichtlinien für ganze Agenten; die Provider-/Modell-Laufzeitrichtlinie ist der aktive Routenselektor.
    - Bereinigung veralteter Plugin-Konfigurationen, wenn Plugins aktiviert sind; wenn `plugins.enabled=false` gilt, werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Branches, die von betroffenen 2026.4.24-Builds erstellt wurden.
    - Erkennung von Tombstones für die Neustartwiederherstellung festhängender Subagenten, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungsflags, damit der Start das Kind nicht weiter als per Neustart abgebrochen behandelt.
    - Integritäts- und Berechtigungsprüfungen für Zustände (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Modell-Auth-Zustand: prüft OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
    - Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisors">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht aktiv; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway abgefragt).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; zum Beispiel werden Discord-Sprachkanalberechtigungen mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - WhatsApp-Reaktionsfähigkeitsprüfungen für eine beeinträchtigte Gateway-Event-Loop-Gesundheit bei weiterhin laufenden lokalen TUI-Clients; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-`openai-codex/*`-Modellreferenzen in Primärmodellen, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und Sitzungs-Routen-Pins; `--fix` schreibt sie nach `openai/*` um, entfernt veraltete Sitzungs-/Whole-Agent-Laufzeit-Pins und belässt kanonische OpenAI-Agentenreferenzen auf dem standardmäßigen Codex-Harness.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen zu Best Practices (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkollisionen (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Auth-Prüfungen für den lokalen Token-Modus (bietet Token-Erzeugung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Device-Token-Cache und Auth-Drift bei Pairing-Datensätzen).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Warnungen bei Kürzung/nahem Grenzwert für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standardagenten; meldet erlaubte Skills mit fehlenden Binaries, Umgebungs-, Konfigurations- oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Prüfung des Status der Shell-Vervollständigung und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für die Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Nichtübereinstimmung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden RPC-Methoden im Stil von Gateway Doctor, sind aber **nicht** Teil der Reparatur/Migration der `openclaw doctor`-CLI.

Was sie tun:

- **Backfill** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den Grounded-REM-Diary-Pass aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Diary-Einträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich grounded Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie für sich genommen **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stellen Grounded-Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Store bereit, sofern Sie nicht zuerst ausdrücklich den bereitgestellten CLI-Pfad ausführen

Wenn Sie möchten, dass grounded historische Wiedergabe die normale tiefe Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden grounded langlebige Kandidaten im Kurzzeit-Dreaming-Store bereitgestellt, während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es an, vor der Ausführung von doctor zu aktualisieren (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifischen Override), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Flat-Felder von Talk. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt Legacy-Echtzeitselektoren der obersten Ebene (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt auch, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Platzhalter- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` stimmt nur mit Tools
    aus Plugins überein, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Zulassungsliste nicht. Doctor schreibt `plugins.bundledDiscovery: "compat"` für migrierte
    Legacy-Zulassungslistenkonfigurationen, um das bestehende Verhalten gebündelter Provider beizubehalten, und
    verweist dann auf die strengere Einstellung `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrationen von Legacy-Konfigurationsschlüsseln">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern Sie auf, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erläutern, welche Legacy-Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert Legacy-Konfigurationsformate und fordert Sie auf, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Migrationen des Cron-Job-Stores werden ebenfalls von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - Konfigurationen konfigurierter Kanäle mit fehlender Richtlinie für sichtbare Antworten → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - Legacy-`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - Legacy-Selektoren für Realtime Talk auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Verschieben Sie bei Kanälen mit benannten `accounts`, aber verbleibenden Kanalwerten auf oberster Ebene für ein einzelnes Konto, diese kontobezogenen Werte in das hochgestufte Konto, das für diesen Kanal ausgewählt wurde (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - Entfernen Sie `agents.defaults.llm`; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - Entfernen Sie `browser.relayBindHost` (Legacy-Relay-Einstellung der Erweiterung)
    - Legacy-`models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)
    - Entfernen Sie `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server belässt Codex-native Workspace-Tools immer nativ

    Doctor-Warnungen enthalten außerdem Hinweise zum Standardkonto für Mehrkonten-Kanäle:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog von `@earendil-works/pi-ai`. Dadurch können Modelle auf die falsche API gezwungen oder Kosten auf null gesetzt werden. Doctor warnt, damit Sie die Überschreibung entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Wenn Ihre Browserkonfiguration noch auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert Doctor sie auf das aktuelle host-lokale Chrome-MCP-Anfügemodell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den host-lokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer Verbindung installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Inspect-Seite des Browsers zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Host-lokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal ausgeführten Browser
    - in diesem Browser aktiviertes Remote-Debugging
    - die Genehmigung der ersten Zustimmungsaufforderung zum Anfügen im Browser

    Bereitschaft bezieht sich hier nur auf lokale Voraussetzungen zum Anfügen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Reparaturhinweise aus. Unter macOS mit einem Homebrew-Node ist die Lösung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch ausgeführt, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Wenn Sie zuvor Legacy-OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad verdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn diese alten Transporteinstellungen zusammen mit Codex OAuth gefunden werden, damit Sie die veraltete Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor prüft auf Legacy-`openai-codex/*`-Modellreferenzen. Das native Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen; OpenAI-Agent-Turns laufen über das Codex-App-Server-Harness statt über den OpenClaw-PI-OpenAI-Pfad.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Referenzen des Standard-Agenten und einzelner Agenten um, einschließlich primärer Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und veraltetem persistentem Sitzungsroutenzustand:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Codex-Absicht wird in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge für reparierte Agent-Modellreferenzen verschoben, sodass `openai-codex:...`-Authentifizierungsprofile weiterhin ausgewählt werden können, nachdem die Modellreferenz zu `openai/*` geworden ist.
    - Veraltete Runtime-Konfiguration des gesamten Agenten und persistente Runtime-Pins von Sitzungen werden entfernt, weil die Runtime-Auswahl Provider-/modellbezogen ist.
    - Vorhandene Provider-/Modell-Runtime-Richtlinien bleiben erhalten, sofern die reparierte Legacy-Modellreferenz kein Codex-Routing benötigt, um den alten Authentifizierungspfad beizubehalten.
    - Vorhandene Modell-Fallback-Listen bleiben erhalten, wobei ihre Legacy-Einträge umgeschrieben werden; kopierte modellspezifische Einstellungen werden vom Legacy-Schlüssel zum kanonischen `openai/*`-Schlüssel verschoben.
    - Persistente Sitzungsfelder `modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Authentifizierungsprofil-Pins werden in allen gefundenen Agent-Sitzungsspeichern repariert.
    - `/codex ...` bedeutet „eine native Codex-Unterhaltung aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP-/acpx-Adapter verwenden.“

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor durchsucht gefundene Agent-Sitzungsspeicher außerdem nach veraltetem automatisch erstelltem Routenzustand, nachdem Sie konfigurierte Modelle oder Runtime von einer Plugin-eigenen Route wie Codex wegbewegt haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Zustand löschen, etwa `modelOverrideSource: "auto"`-Modell-Pins, Runtime-Modellmetadaten, angeheftete Harness-IDs, CLI-Sitzungsbindungen und automatische Authentifizierungsprofil-Überschreibungen, wenn die zugehörige Route nicht mehr konfiguriert ist. Explizite Benutzer- oder Legacy-Sitzungsmodellauswahlen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new`, oder setzen Sie die Sitzung zurück, wenn diese Route nicht mehr vorgesehen ist.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

    - Sitzungsspeicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Authentifizierungszustand (Baileys):
      - von Legacy-`~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn Legacy-Ordner als Sicherungen zurückgelassen werden. Der Gateway/die CLI migriert beim Start außerdem automatisch die Legacy-Sitzungen + das Agent-Verzeichnis, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. WhatsApp-Auth wird absichtlich nur über `openclaw doctor` migriert. Die Talk-Provider-/Provider-Map-Normalisierung vergleicht jetzt per struktureller Gleichheit, sodass reine Unterschiede in der Schlüsselreihenfolge keine wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet Doctor an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen weiterhin akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliasse → explizites `delivery.channel`
    - einfache alte `notify: true`-Webhook-Fallback-Jobs → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

    Doctor migriert `notify: true`-Jobs nur dann automatisch, wenn dies ohne Verhaltensänderung möglich ist. Wenn ein Job den alten Notify-Fallback mit einem bestehenden Nicht-Webhook-Zustellungsmodus kombiniert, warnt Doctor und belässt diesen Job zur manuellen Prüfung.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers weiterhin das alte `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird von aktuellem OpenClaw nicht gepflegt und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Integritätsprüfungen.

  </Accordion>
  <Accordion title="3c. Session-Sperrenbereinigung">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als veraltet gilt (tote PID, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Nicht-OpenClaw-Prozess gehört). Im Modus `--fix` / `--repair` entfernt er veraltete Sperrdateien automatisch; andernfalls gibt er einen Hinweis aus und weist Sie an, ihn erneut mit `--fix` auszuführen.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungs-Transkript-Branches">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Form, die durch den Fehler beim Prompt-Transkript-Rewrite vom 2026.4.24 entstanden ist: ein aufgegebener Benutzer-Turn mit internem OpenClaw-Laufzeitkontext plus ein aktives Geschwisterelement mit demselben sichtbaren Benutzer-Prompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transkript auf den aktiven Branch um, sodass Gateway-Verlauf und Speicher-Leser keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Zustandsintegritätsprüfungen (Sitzungspersistenz, Routing und Sicherheit)">
    Das Zustandsverzeichnis ist die operative Steuerzentrale. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

    Doctor prüft:

    - **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Zustandsverzeichnisses**: überprüft die Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Besitzer/Gruppe erkannt wird).
    - **macOS-Cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, weil sync-gestützte Pfade langsamere I/O und Sperr-/Synchronisationsrennen verursachen können.
    - **Linux-SD- oder eMMC-Zustandsverzeichnis**: warnt, wenn der Zustand auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, weil SD- oder eMMC-gestützte zufällige I/O bei Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Store-Verzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transkriptabweichung**: warnt, wenn neuere Sitzungseinträge fehlende Transkriptdateien haben.
    - **Hauptsitzung „1-zeilige JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat (der Verlauf wächst nicht an).
    - **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (der Verlauf kann zwischen Installationen aufgeteilt werden).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote` gesetzt ist, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Zustand befindet sich dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, sie auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Authentifizierungsstatus (OAuth-Ablauf)">
    Doctor prüft OAuth-Profile im Auth-Store, warnt, wenn Token bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider fordert Sie auf, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend nicht nutzbar sind aufgrund von:

    - kurzen Abklingzeiten (Rate Limits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Sandbox-Image-Reparatur">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu erstellen oder auf alte Namen umzuschalten, falls das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Plugin-Installationsbereinigung">
    Doctor entfernt im Modus `openclaw doctor --fix` / `openclaw doctor --repair` alte von OpenClaw generierte Plugin-Abhängigkeits-Staging-Zustände. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Install-Stage-Verzeichnisse, paketlokale Überreste aus früherem Abhängigkeits-Reparaturcode für gebündelte Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest verdecken können.

    Doctor kann auch fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration darauf verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele sind materielle `plugins.entries`, konfigurierte Kanal-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen vermeidet Doctor die Ausführung von Paketmanager-Plugin-Reparaturen, während das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach der Aktualisierung erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladung führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Installations-/Aktualisierungsarbeit.

  </Accordion>
  <Accordion title="8. Migrationen von Gateway-Diensten und Bereinigungshinweise">
    Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-Port zu installieren. Es kann außerdem nach zusätzlichen Gateway-ähnlichen Diensten suchen und Bereinigungshinweise ausgeben. OpenClaw-Gateway-Dienste mit Profilnamen gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Dienst auf Benutzerebene, wenn der Gateway-Dienst auf Benutzerebene fehlt, aber ein OpenClaw-Gateway-Dienst auf Systemebene existiert. Prüfen Sie dies mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus verwaltet.

  </Accordion>
  <Accordion title="8b. Migration der Startup-Matrix">
    Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Migration eines veralteten Zustands hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt anschließend die Best-Effort-Migrationsschritte aus: Migration des veralteten Matrix-Zustands und Vorbereitung des veralteten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Authentifizierungsabweichungen">
    Doctor prüft jetzt den Zustand der Gerätekopplung als Teil des normalen Integritätsdurchlaufs.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen bei Abweichungen des öffentlichen Schlüssels, bei denen die Geräte-ID weiterhin übereinstimmt, die Geräteidentität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Geräte-Token-Einträge für den aktuellen Computer, die vor einer Gateway-seitigen Token-Rotation erstellt wurden oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Geräte-Tokens nicht automatisch. Stattdessen werden die genauen nächsten Schritte ausgegeben:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Eintrag mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dies schließt die häufige Lücke „bereits gekoppelt, aber weiterhin Kopplung erforderlich“: Die Diagnose unterscheidet nun zwischen erstmaliger Kopplung, ausstehenden Rollen-/Scope-Upgrades und veraltetem Token-/Geräteidentitäts-Drift.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Die Diagnose gibt Warnungen aus, wenn ein Provider für Direktnachrichten ohne Allowlist geöffnet ist oder wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Bei Ausführung als systemd-Benutzerdienst stellt die Diagnose sicher, dass Linger aktiviert ist, damit der Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)">
    Die Diagnose gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

    - **Skills-Status**: zählt geeignete Skills sowie Skills mit fehlenden Anforderungen und durch Allowlist blockierte Skills.
    - **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse neben dem aktuellen Workspace vorhanden sind.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle Fehler auf; meldet Bundle-Plugin-Fähigkeiten.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Runtime haben.
    - **Plugin-Diagnose**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der Plugin-Registrierung ausgegeben wurden.

  </Accordion>
  <Accordion title="11b. Bootstrap-Dateigröße">
    Die Diagnose prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder es überschreiten. Sie meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) sowie die gesamten injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt die Diagnose Hinweise zur Anpassung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Channel-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt es auch die verwaiste channel-bezogene Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dadurch werden Gateway-Bootschleifen verhindert, bei denen die Channel-Runtime entfernt ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Die Diagnose prüft, ob die Tab-Vervollständigung für die aktuelle Shell (zsh, bash, fish oder PowerShell) installiert ist:

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster (`source <(openclaw completion ...)`) verwendet, aktualisiert die Diagnose es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, die Cache-Datei aber fehlt, regeneriert die Diagnose den Cache automatisch.
    - Wenn überhaupt keine Vervollständigung konfiguriert ist, fragt die Diagnose nach, ob sie installiert werden soll (nur interaktiver Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die lokale Gateway-Token-Authentifizierungsbereitschaft.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-fähige Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten zur Laufzeit abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Statusbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Zustandsprüfung + Neustart">
    Doctor führt eine Zustandsprüfung aus und bietet an, das Gateway neu zu starten, wenn es fehlerhaft wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Speichersuche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Speichersuche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: Prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist. Falls nicht, werden Hinweise zur Behebung ausgegeben, einschließlich des npm-Pakets und einer Option für einen manuellen Binärpfad.
    - **Expliziter lokaler Provider**: Prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Wenn sie fehlt, wird der Wechsel zu einem Remote-Provider vorgeschlagen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): Prüft, ob ein API-Schlüssel in der Umgebung oder im Auth Store vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
    - **Automatischer Provider**: Prüft zuerst die lokale Modellverfügbarkeit und versucht dann jeden Remote-Provider in der Reihenfolge der automatischen Auswahl.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der Prüfung fehlerfrei), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und weist auf Abweichungen hin. Doctor startet im Standardpfad keinen neuen Embedding-Ping; verwenden Sie den ausführlichen Speicherstatusbefehl, wenn Sie eine Live-Prüfung des Providers wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Kanalstatuswarnungen">
    Wenn das Gateway fehlerfrei ist, führt Doctor eine Kanalstatusprüfung aus und meldet Warnungen mit empfohlenen Korrekturen.
  </Accordion>
  <Accordion title="15. Prüfung und Reparatur der Supervisor-Konfiguration">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standardwerte (z. B. systemd-`network-online`-Abhängigkeiten und Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt Doctor ein Update und kann die Servicedatei/Aufgabe auf die aktuellen Standardwerte umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration umgeschrieben wird.
    - `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
    - `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Nachfragen an.
    - `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Gateway-Service-Lebenszyklus schreibgeschützt. Doctor meldet weiterhin den Servicezustand und führt Reparaturen außerhalb des Service aus, überspringt aber Service-Installation/-Start/-Neustart/-Bootstrap, Umschreibungen der Supervisor-Konfiguration und Bereinigung veralteter Services, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt Doctor Befehls-/Entrypoint-Metadaten nicht um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert Doctor inaktive, nicht veraltete zusätzliche Gateway-ähnliche Units während der Suche nach doppelten Services, damit begleitende Servicedateien keine Bereinigungsstörungen erzeugen.
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert die Doctor-Serviceinstallation/-reparatur den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Service.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Service-Umgebungswerte, die ältere LaunchAgent-, systemd- oder Windows-Scheduled-Task-Installationen inline eingebettet haben, und schreibt die Service-Metadaten so um, dass diese Werte aus der Laufzeitquelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Servicebefehl nach Änderungen an `gateway.port` noch einen alten `--port` festlegt, und schreibt die Service-Metadaten auf den aktuellen Port um.
    - Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
    - Für Linux-User-systemd-Units berücksichtigen Doctors Token-Drift-Prüfungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Authentifizierungsmetadaten.
    - Doctor-Service-Reparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Service aus einer älteren OpenClaw-Binärdatei, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können eine vollständige Umschreibung jederzeit mit `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Laufzeit + Portdiagnose">
    Doctor untersucht die Service-Laufzeit (PID, letzter Exitstatus) und warnt, wenn der Service installiert ist, aber tatsächlich nicht läuft. Außerdem prüft Doctor auf Portkonflikte am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Best Practices für die Gateway-Laufzeit">
    Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node, und Versionsmanager-Pfade können nach Upgrades brechen, weil der Service Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn verfügbar (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS-LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren. Dadurch bleiben von Homebrew verwaltete Systembinärdateien verfügbar, während Volta, asdf, fnm, pnpm und andere Versionsmanager-Verzeichnisse nicht ändern, welche Node-Child-Prozesse auflösen. Linux-Services behalten weiterhin explizite Umgebungs-Roots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Binärverzeichnisse bei, aber vermutete Fallback-Verzeichnisse von Versionsmanagern werden nur dann in den Service-PATH geschrieben, wenn diese Verzeichnisse auf dem Datenträger vorhanden sind.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Assistentenmetadaten">
    Doctor speichert alle Konfigurationsänderungen und versieht die Assistentenmetadaten mit einem Zeitstempel, um den Doctor-Lauf zu erfassen.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Speichersystem)">
    Doctor schlägt ein Workspace-Speichersystem vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
