---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Breaking Changes an der Konfiguration einführen
sidebarTitle: Doctor
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Diagnose
x-i18n:
    generated_at: "2026-06-27T17:29:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete Konfigurationen/Zustände, prüft die Integrität und stellt umsetzbare Reparaturschritte bereit.

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

    Standardwerte ohne Nachfrage akzeptieren (einschließlich Neustart-, Service- und Sandbox-Reparaturschritten, sofern zutreffend).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Empfohlene Reparaturen ohne Nachfrage anwenden (Reparaturen und Neustarts, sofern sicher).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Strukturierte Integritätsprüfungen für CI oder Preflight-Automatisierung ausführen. Dieser Modus ist
    schreibgeschützt: Er fragt nicht nach, repariert nicht, migriert keine Konfiguration, startet keine Dienste neu und
    berührt keinen Zustand.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Auch aggressive Reparaturen anwenden (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Ohne Eingabeaufforderungen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung und Zustandsverschiebungen auf dem Datenträger). Überspringt Neustart-, Service- und Sandbox-Aktionen, die eine menschliche Bestätigung erfordern. Legacy-Zustandsmigrationen laufen automatisch, wenn sie erkannt werden.

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

## Schreibgeschützter Lint-Modus

`openclaw doctor --lint` ist das automatisierungsfreundliche Gegenstück zu
`openclaw doctor --fix`. Beide verwenden die Integritätsprüfungen von doctor, aber ihre Ausrichtung ist
unterschiedlich:

| Modus                    | Eingabeaufforderungen | Schreibt Konfiguration/Zustand | Ausgabe                         | Verwenden für                         |
| ------------------------ | --------------------- | ------------------------------ | ------------------------------- | ------------------------------------- |
| `openclaw doctor`        | ja                    | nein                           | verständlicher Integritätsbericht | eine Person, die den Status prüft     |
| `openclaw doctor --fix`  | manchmal              | ja, gemäß Reparaturrichtlinie  | verständliches Reparaturprotokoll | genehmigte Reparaturen anwenden       |
| `openclaw doctor --lint` | nein                  | nein                           | strukturierte Befunde           | CI, Preflight und Review-Gates        |

Modernisierte Integritätsprüfungen können optional eine `repair()`-Implementierung bereitstellen.
`doctor --fix` wendet diese Reparaturen an, wenn sie vorhanden sind, und verwendet weiterhin den
bestehenden doctor-Reparaturablauf für Prüfungen, die noch nicht migriert wurden.
Der strukturierte Reparaturvertrag trennt außerdem Reparaturberichte von der Erkennung:
`detect()` meldet aktuelle Befunde, während `repair()` Änderungen,
Konfigurations-/Datei-Diffs und dateiunabhängige Nebenwirkungen melden kann. So bleibt der Migrationspfad
für zukünftige `doctor --fix --dry-run`- und Diff-Ausgaben offen, ohne dass Lint-Prüfungen
Mutationen planen.

Beispiele:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Die JSON-Ausgabe enthält:

- `ok`: ob ein sichtbarer Befund den ausgewählten Schweregrad-Schwellenwert erreicht hat
- `checksRun`: Anzahl der ausgeführten Integritätsprüfungen
- `checksSkipped`: Prüfungen, die durch das ausgewählte Profil, `--only` oder `--skip` übersprungen wurden
- `findings`: strukturierte Diagnosen mit `checkId`, `severity`, `message` und
  optional `path`, `line`, `column`, `ocPath` und `fixHint`

Exit-Codes:

- `0`: keine Befunde auf oder über dem ausgewählten Schwellenwert
- `1`: ein oder mehrere Befunde haben den ausgewählten Schwellenwert erreicht
- `2`: Befehls-/Laufzeitfehler, bevor Lint-Befunde ausgegeben werden konnten

Verwenden Sie `--severity-min info|warning|error`, um sowohl zu steuern, was ausgegeben wird, als auch,
was einen Lint-Exit ungleich null verursacht. Verwenden Sie `--all`, um das vollständige Lint-Inventar auszuführen,
einschließlich tieferer Opt-in-Prüfungen, die vom standardmäßigen Automatisierungsset ausgeschlossen sind. Verwenden Sie `--only <id>` für enge Preflight-Gates und
`--skip <id>`, um eine laute Prüfung vorübergehend auszuschließen, während der Rest des
Lint-Laufs aktiv bleibt.
Lint-Ausgabeoptionen wie `--json`, `--severity-min`, `--all`, `--only` und
`--skip` müssen mit `--lint` kombiniert werden; reguläre doctor- und Reparaturläufe lehnen
sie ab.

## Was es tut (Zusammenfassung)

<AccordionGroup>
  <Accordion title="Integrität, UI und Updates">
    - Optionales Preflight-Update für Git-Installationen (nur interaktiv).
    - Prüfung der UI-Protokollaktualität (baut die Control UI neu, wenn das Protokollschema neuer ist).
    - Integritätsprüfung und Neustartaufforderung.
    - Skills-Statuszusammenfassung (zulässig/fehlend/blockiert) und Plugin-Status.

  </Accordion>
  <Accordion title="Konfiguration und Migrationen">
    - Konfigurationsnormalisierung für Legacy-Werte.
    - Migration der Talk-Konfiguration von Legacy-Flachfeldern `talk.*` nach `talk.provider` + `talk.providers.<provider>`.
    - Browser-Migrationsprüfungen für Legacy-Konfigurationen der Chrome-Erweiterung und Chrome-MCP-Bereitschaft.
    - Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migration von Legacy-OpenAI-Codex-Providern/-Profilen (`openai-codex` → `openai`) und Shadowing-Warnungen für veraltete `models.providers.openai-codex`.
    - Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
    - Warnungen zur Plugin-/Tool-Allowlist, wenn `plugins.allow` restriktiv ist, die Tool-Richtlinie aber weiterhin Wildcard- oder Plugin-eigene Tools anfordert.
    - Migration von Legacy-Zustand auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Auth).
    - Migration von Legacy-Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration des Legacy-Cron-Speichers (`jobId`, `schedule.cron`, Top-Level-Delivery-/Payload-Felder, Payload-`provider`, `notify: true`-Webhook-Fallback-Jobs).
    - Bereinigung der Legacy-Laufzeitrichtlinie für ganze Agents; die Provider-/Modell-Laufzeitrichtlinie ist der aktive Routenauswähler.
    - Bereinigung veralteter Plugin-Konfiguration, wenn Plugins aktiviert sind; bei `plugins.enabled=false` werden veraltete Plugin-Referenzen als inerte Containment-Konfiguration behandelt und beibehalten.

  </Accordion>
  <Accordion title="Zustand und Integrität">
    - Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
    - Reparatur von Sitzungstranskripten für duplizierte Prompt-Rewrite-Zweige, die von betroffenen 2026.4.24-Builds erstellt wurden.
    - Erkennung von Tombstones für die Neustartwiederherstellung blockierter Subagents, mit `--fix`-Unterstützung zum Löschen veralteter abgebrochener Wiederherstellungsflags, damit der Start das Kind nicht weiter als neustartabgebrochen behandelt.
    - Integritäts- und Berechtigungsprüfungen des Zustands (Sitzungen, Transkripte, Zustandsverzeichnis).
    - Berechtigungsprüfungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
    - Modell-Auth-Integrität: prüft den OAuth-Ablauf, kann bald ablaufende Token aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.

  </Accordion>
  <Accordion title="Gateway, Dienste und Supervisoren">
    - Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
    - Migration von Legacy-Diensten und Erkennung zusätzlicher Gateways.
    - Migration des Legacy-Zustands des Matrix-Kanals (im Modus `--fix` / `--repair`).
    - Gateway-Laufzeitprüfungen (Dienst installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
    - Kanalstatuswarnungen (vom laufenden Gateway geprüft).
    - Kanalspezifische Berechtigungsprüfungen befinden sich unter `openclaw channels capabilities`; Discord-Sprachkanalberechtigungen werden beispielsweise mit `openclaw channels capabilities --channel discord --target channel:<channel-id>` geprüft.
    - WhatsApp-Reaktionsprüfungen für beeinträchtigte Gateway-Event-Loop-Integrität, während lokale TUI-Clients noch laufen; `--fix` stoppt nur verifizierte lokale TUI-Clients.
    - Codex-Routenreparatur für Legacy-`openai-codex/*`-Modellreferenzen in Primärmodellen, Fallbacks, Bild-/Videogenerierungsmodellen, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und Sitzungsrouten-Pins; `--fix` schreibt sie in `openai/*` um, migriert `openai-codex:*`-Auth-Profile/-Reihenfolge nach `openai:*`, entfernt veraltete Sitzungs-/Ganz-Agent-Laufzeit-Pins und belässt kanonische OpenAI-Agent-Referenzen auf dem standardmäßigen Codex-Harness.
    - Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
    - Bereinigung eingebetteter Proxy-Umgebungen für Gateway-Dienste, die während Installation oder Update Shell-Werte für `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` erfasst haben.
    - Gateway-Laufzeitprüfungen für Best Practices (Node vs. Bun, Pfade von Versionsmanagern).
    - Diagnose von Gateway-Portkonflikten (Standard `18789`).

  </Accordion>
  <Accordion title="Auth, Sicherheit und Pairing">
    - Sicherheitswarnungen für offene DM-Richtlinien.
    - Gateway-Auth-Prüfungen für lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
    - Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, Drift veralteter lokaler Geräte-Token-Caches und Auth-Drift gekoppelter Datensätze).

  </Accordion>
  <Accordion title="Workspace und Shell">
    - systemd-Linger-Prüfung unter Linux.
    - Größenprüfung der Workspace-Bootstrap-Datei (Abschneidungs-/Grenzwertwarnungen für Kontextdateien).
    - Skills-Bereitschaftsprüfung für den Standard-Agent; meldet erlaubte Skills mit fehlenden Binaries, Umgebungs-, Konfigurations- oder Betriebssystemanforderungen, und `--fix` kann nicht verfügbare Skills in `skills.entries` deaktivieren.
    - Statusprüfung der Shell-Vervollständigung und automatische Installation/Aktualisierung.
    - Bereitschaftsprüfung des Embedding-Providers für Speichersuche (lokales Modell, Remote-API-Schlüssel oder QMD-Binary).
    - Prüfungen für Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlendes tsx-Binary).
    - Schreibt aktualisierte Konfiguration und Wizard-Metadaten.

  </Accordion>
</AccordionGroup>

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded** für den grounded Dreaming-Workflow. Diese Aktionen verwenden Gateway-RPC-Methoden im doctor-Stil, sind aber **nicht** Teil der CLI-Reparatur/-Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven Workspace, führt den grounded REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur bereitgestellte, ausschließlich grounded Kurzzeiteinträge, die aus historischer Wiedergabe stammen und noch keinen Live-Recall oder tägliche Unterstützung angesammelt haben.

Was sie allein **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen doctor-Migrationen aus
- sie stellen grounded Kandidaten nicht automatisch im Live-Kurzzeit-Promotion-Speicher bereit, außer Sie führen zuerst ausdrücklich den gestagten CLI-Pfad aus

Wenn Sie möchten, dass grounded historische Wiedergabe die normale Deep-Promotion-Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Das stellt grounded dauerhafte Kandidaten im Kurzzeit-Dreaming-Speicher bereit, während `DREAMS.md` die Review-Oberfläche bleibt.

## Detailliertes Verhalten und Begründung

<AccordionGroup>
  <Accordion title="0. Optionales Update (Git-Installationen)">
    Wenn dies ein Git-Checkout ist und doctor interaktiv ausgeführt wird, bietet es vor der doctor-Ausführung ein Update an (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Konfigurationsnormalisierung">
    Wenn die Konfiguration Legacy-Werteformen enthält (zum Beispiel `messages.ackReaction` ohne kanalspezifische Überschreibung), normalisiert doctor sie in das aktuelle Schema.

    Dazu gehören Legacy-Talk-Flachfelder. Die aktuelle öffentliche Talk-Sprachkonfiguration ist `talk.provider` + `talk.providers.<provider>`, und die Echtzeit-Sprachkonfiguration ist `talk.realtime.*`. Doctor schreibt alte Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` in die Provider-Map um und schreibt Legacy-Top-Level-Echtzeitselektoren (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime` um.

    Doctor warnt auch, wenn `plugins.allow` nicht leer ist und die Tool-Richtlinie
    Wildcard- oder Plugin-eigene Tool-Einträge verwendet. `tools.allow: ["*"]` passt nur auf Tools
    aus Plugins, die tatsächlich geladen werden; es umgeht die exklusive Plugin-
    Allowlist nicht.

  </Accordion>
  <Accordion title="2. Migrationen veralteter Konfigurationsschlüssel">
    Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und bitten Sie, `openclaw doctor` auszuführen.

    Doctor wird:

    - Erklären, welche veralteten Schlüssel gefunden wurden.
    - Die angewendete Migration anzeigen.
    - `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

    Der Gateway-Start verweigert veraltete Konfigurationsformate und bittet Sie, `openclaw doctor --fix` auszuführen; er schreibt `openclaw.json` beim Start nicht neu. Migrationen des Cron-Job-Speichers werden ebenfalls von `openclaw doctor --fix` behandelt.

    Aktuelle Migrationen:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - entferne die ausgemusterten `channels.webchat` und `gateway.webchat`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` auf oberster Ebene
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - veraltete Echtzeit-Talk-Selektoren auf oberster Ebene (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` und `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` und `messages.tts.providers.microsoft`
    - TTS-Sprecherauswahlfelder (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` und `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` und `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Bei Kanälen mit benannten `accounts`, aber verbliebenen Top-Level-Kanalwerten für Einzelkonten, werden diese kontoabhängigen Werte in das hochgestufte Konto verschoben, das für diesen Kanal ausgewählt wurde (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - entferne `agents.defaults.llm`; verwenden Sie `models.providers.<id>.timeoutSeconds` für Timeouts langsamer Provider/Modelle, und halten Sie den Agent-/Run-Timeout über diesem Wert, wenn der gesamte Run länger dauern muss
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - entferne `browser.relayBindHost` (veraltete Extension-Relay-Einstellung)
    - veraltetes `models.providers.*.api: "openai"` → `"openai-completions"` (der Gateway-Start überspringt außerdem Provider, deren `api` auf einen zukünftigen oder unbekannten Enum-Wert gesetzt ist, statt geschlossen fehlzuschlagen)
    - entferne `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server behält Codex-native Workspace-Tools immer nativ bei

    Doctor-Warnungen enthalten außerdem Hinweise zu Konto-Standards für Kanäle mit mehreren Konten:

    - Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
    - Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

  </Accordion>
  <Accordion title="2b. OpenCode-Provider-Overrides">
    Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go` manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `openclaw/plugin-sdk/llm`. Das kann Modelle auf die falsche API zwingen oder Kosten auf null setzen. Doctor warnt, damit Sie den Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.
  </Accordion>
  <Accordion title="2c. Browser-Migration und Chrome-MCP-Bereitschaft">
    Wenn Ihre Browser-Konfiguration noch auf den entfernten Chrome-Extension-Pfad zeigt, normalisiert Doctor sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

    - `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
    - `browser.relayBindHost` wird entfernt

    Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile: "user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

    - prüft, ob Google Chrome auf demselben Host für Standard-Auto-Connect-Profile installiert ist
    - prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
    - erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` oder `edge://inspect/#remote-debugging`)

    Doctor kann die Chrome-seitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP erfordert weiterhin:

    - einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
    - den lokal ausgeführten Browser
    - aktiviertes Remote-Debugging in diesem Browser
    - Bestätigung der ersten Attach-Zustimmungsabfrage im Browser

    Die Bereitschaft bezieht sich hier nur auf lokale Attach-Voraussetzungen. Existing-session behält die aktuellen Chrome-MCP-Routenlimits bei; erweiterte Routen wie `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein Roh-CDP-Profil.

    Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere Headless-Flows. Diese verwenden weiterhin Roh-CDP.

  </Accordion>
  <Accordion title="2d. OAuth-TLS-Voraussetzungen">
    Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-Autorisierungs-Endpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat), gibt Doctor plattformspezifische Reparaturhinweise aus. Auf macOS mit einem Homebrew-Node lautet die Reparatur normalerweise `brew postinstall ca-certificates`. Mit `--deep` läuft die Prüfung auch dann, wenn der Gateway fehlerfrei ist.
  </Accordion>
  <Accordion title="2e. Codex-OAuth-Provider-Overrides">
    Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter `models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-Provider-Pfad überdecken, den neuere Releases automatisch verwenden. Doctor warnt, wenn es diese alten Transporteinstellungen neben Codex OAuth sieht, damit Sie den veralteten Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten zurückerhalten können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.
  </Accordion>
  <Accordion title="2f. Codex-Routenreparatur">
    Doctor prüft auf veraltete `openai-codex/*`-Modellreferenzen. Natives Codex-Harness-Routing verwendet kanonische `openai/*`-Modellreferenzen; OpenAI-Agent-Turns laufen über das Codex-App-Server-Harness statt über den OpenClaw-OpenAI-Provider-Pfad.

    Im Modus `--fix` / `--repair` schreibt Doctor betroffene Standard-Agent- und agentenspezifische Referenzen um, einschließlich primärer Modelle, Fallbacks, Modelle für Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltetem persistiertem Session-Routenstatus:

    - `openai-codex/gpt-*` wird zu `openai/gpt-*`.
    - Die Codex-Absicht wird für reparierte Agent-Modellreferenzen in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge verschoben.
    - Veraltete Laufzeitkonfiguration für ganze Agents und persistierte Session-Laufzeit-Pins werden entfernt, weil die Laufzeitauswahl Provider-/modellbezogen ist.
    - Bestehende Provider-/Modell-Laufzeitrichtlinien bleiben erhalten, sofern die reparierte veraltete Modellreferenz kein Codex-Routing benötigt, um den alten Auth-Pfad beizubehalten.
    - Bestehende Modell-Fallback-Listen bleiben erhalten, wobei ihre veralteten Einträge umgeschrieben werden; kopierte Einstellungen pro Modell werden vom veralteten Schlüssel zum kanonischen Schlüssel `openai/*` verschoben.
    - Persistierte Session-`modelProvider`/`providerOverride`, `model`/`modelOverride`, Fallback-Hinweise und Auth-Profil-Pins werden in allen erkannten Agent-Session-Speichern repariert.
    - `/codex ...` bedeutet „eine native Codex-Konversation aus dem Chat steuern oder binden.“
    - `/acp ...` oder `runtime: "acp"` bedeutet „den externen ACP/acpx-Adapter verwenden.“

  </Accordion>
  <Accordion title="2g. Bereinigung von Session-Routen">
    Doctor scannt außerdem erkannte Agent-Session-Speicher nach veraltetem automatisch erstelltem Routenstatus, nachdem Sie konfigurierte Modelle oder die Laufzeit von einer Plugin-eigenen Route wie Codex wegbewegt haben.

    `openclaw doctor --fix` kann automatisch erstellten veralteten Status wie `modelOverrideSource: "auto"`-Modell-Pins, Laufzeit-Modellmetadaten, angepinnte Harness-IDs, CLI-Session-Bindings und automatische Auth-Profil-Overrides löschen, wenn deren besitzende Route nicht mehr konfiguriert ist. Explizite Benutzer- oder veraltete Session-Modellwahlen werden zur manuellen Prüfung gemeldet und unverändert gelassen; wechseln Sie sie mit `/model ...`, `/new`, oder setzen Sie die Session zurück, wenn diese Route nicht mehr beabsichtigt ist.

  </Accordion>
  <Accordion title="3. Migrationen veralteten Zustands (Datenträgerlayout)">
    Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

    - Session-Speicher + Transkripte:
      - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-Verzeichnis:
      - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-Auth-Status (Baileys):
      - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
      - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

    Diese Migrationen erfolgen nach bestem Aufwand und sind idempotent; Doctor gibt Warnungen aus, wenn veraltete Ordner als Backups zurückbleiben. Gateway/CLI migrieren außerdem die veralteten Sessions + das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt anhand struktureller Gleichheit, sodass Diffs, die nur die Schlüsselreihenfolge betreffen, keine wiederholten wirkungslosen `doctor --fix`-Änderungen mehr auslösen.

  </Accordion>
  <Accordion title="3a. Migrationen veralteter Plugin-Manifeste">
    Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Capability-Schlüsseln auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wenn sie gefunden werden, bietet er an, sie in das Objekt `contracts` zu verschieben und die Manifestdatei direkt zu überschreiben. Diese Migration ist idempotent; wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt, ohne die Daten zu duplizieren.
  </Accordion>
  <Accordion title="3b. Migrationen veralteter Cron-Speicher">
    Doctor prüft außerdem den Cron-Job-Speicher (standardmäßig `~/.openclaw/cron/jobs.json` oder `cron.store`, wenn überschrieben) auf alte Job-Strukturen, die der Scheduler aus Kompatibilitätsgründen noch akzeptiert.

    Aktuelle Cron-Bereinigungen umfassen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
    - Zustellungsfelder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - Payload-`provider`-Zustellungsaliase → explizites `delivery.channel`
    - veraltete `notify: true`-Webhook-Fallback-Jobs → explizite Webhook-Zustellung aus `cron.webhook`, wenn gesetzt; Ankündigungsjobs behalten ihre Chat-Zustellung und erhalten `delivery.completionDestination`. Wenn `cron.webhook` nicht gesetzt ist, wird der inaktive Marker `notify` auf oberster Ebene für Jobs ohne Ziel entfernt (bestehende Zustellung, einschließlich Ankündigung, bleibt erhalten), da die Laufzeitzustellung ihn nie liest

    Der Gateway bereinigt auch fehlerhafte Cron-Zeilen beim Laden, damit gültige Jobs weiterlaufen. Rohe fehlerhafte Zeilen werden neben dem aktiven Speicher nach `jobs-quarantine.json` kopiert, bevor sie aus `jobs.json` entfernt werden; Doctor meldet isolierte Zeilen, damit Sie sie manuell prüfen oder reparieren können.

    Der Gateway-Start normalisiert die Laufzeitprojektion und ignoriert den Marker `notify` auf oberster Ebene, lässt die persistierte Cron-Konfiguration aber für die Doctor-Reparatur unverändert. Wenn `cron.webhook` nicht gesetzt ist, entfernt Doctor den inaktiven Marker für Jobs ohne Migrationsziel (`delivery.mode` none/fehlend, ein unbrauchbares Webhook-Ziel oder bestehende Ankündigungs-/Chat-Zustellung), lässt die bestehende Zustellung unverändert, sodass wiederholte `doctor --fix`-Läufe nicht mehr vor demselben Job warnen. Wenn `cron.webhook` gesetzt ist, aber keine gültige HTTP(S)-URL ist, warnt Doctor weiterhin und lässt den Marker stehen, damit Sie die URL korrigieren können.

    Unter Linux warnt Doctor außerdem, wenn die Crontab des Benutzers noch das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` aufruft. Dieses hostlokale Skript wird vom aktuellen OpenClaw nicht gewartet und kann falsche `Gateway inactive`-Meldungen nach `~/.openclaw/logs/whatsapp-health.log` schreiben, wenn Cron den systemd-Benutzerbus nicht erreichen kann. Entfernen Sie den veralteten Crontab-Eintrag mit `crontab -e`; verwenden Sie `openclaw channels status --probe`, `openclaw doctor` und `openclaw gateway status` für aktuelle Health Checks.

  </Accordion>
  <Accordion title="3c. Bereinigung von Sitzungssperren">
    Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Write-Lock-Dateien — Dateien, die zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet er: den Pfad, die PID, ob die PID noch aktiv ist, das Alter des Locks und ob er als veraltet gilt (tote PID, fehlerhafte Eigentümermetadaten, älter als 30 Minuten oder eine aktive PID, die nachweislich zu einem Nicht-OpenClaw-Prozess gehört). Im Modus `--fix` / `--repair` entfernt er Locks mit toten, verwaisten, wiederverwendeten, fehlerhaft-alten oder Nicht-OpenClaw-Eigentümern automatisch. Alte Locks, die noch einem aktiven OpenClaw-Prozess gehören, werden gemeldet, aber an Ort und Stelle belassen, damit Doctor keinen aktiven Transcript-Schreiber unterbricht.
  </Accordion>
  <Accordion title="3d. Reparatur von Sitzungstranscript-Branches">
    Doctor durchsucht Agent-Sitzungs-JSONL-Dateien nach der duplizierten Branch-Struktur, die durch den Prompt-Transcript-Rewrite-Fehler vom 2026.4.24 erstellt wurde: ein aufgegebener Benutzerturn mit internem OpenClaw-Laufzeitkontext plus ein aktiver Geschwistereintrag mit demselben sichtbaren Benutzerprompt. Im Modus `--fix` / `--repair` sichert Doctor jede betroffene Datei neben dem Original und schreibt das Transcript auf den aktiven Branch um, sodass Gateway-Verlauf und Speicherleser keine doppelten Turns mehr sehen.
  </Accordion>
  <Accordion title="4. Integritätsprüfungen des Status (Sitzungspersistenz, Routing und Sicherheit)">
    Das Statusverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie Sitzungen, Zugangsdaten, Logs und Konfiguration (es sei denn, Sie haben anderswo Backups).

    Doctor prüft:

    - **Statusverzeichnis fehlt**: warnt vor katastrophalem Statusverlust, fordert zum erneuten Erstellen des Verzeichnisses auf und erinnert Sie daran, dass fehlende Daten nicht wiederhergestellt werden können.
    - **Berechtigungen des Statusverzeichnisses**: überprüft Schreibbarkeit; bietet an, Berechtigungen zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
    - **macOS-Cloud-synchronisiertes Statusverzeichnis**: warnt, wenn der Status unter iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder `~/Library/CloudStorage/...` aufgelöst wird, da synchronisierte Pfade langsamere I/O und Lock-/Sync-Races verursachen können.
    - **Linux-SD- oder eMMC-Statusverzeichnis**: warnt, wenn der Status auf eine `mmcblk*`-Mount-Quelle aufgelöst wird, da SD- oder eMMC-gestützte zufällige I/O unter Sitzungs- und Zugangsdaten-Schreibvorgängen langsamer sein und schneller verschleißen kann.
    - **Linux-flüchtiges Statusverzeichnis**: warnt, wenn der Status auf `tmpfs` oder `ramfs` aufgelöst wird, da Sitzungen, Zugangsdaten, Konfiguration und SQLite-Status mit seinen WAL-/Journal-Sidecars beim Neustart verschwinden. Docker-`overlay`-Mounts werden absichtlich nicht markiert, da ihre beschreibbaren Layer über Host-Neustarts hinweg bestehen bleiben, solange der Container erhalten bleibt.
    - **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsspeicherverzeichnis sind erforderlich, um Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
    - **Transcript-Abweichung**: warnt, wenn aktuellen Sitzungseinträgen Transcript-Dateien fehlen.
    - **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupt-Transcript nur eine Zeile hat (Verlauf wird nicht angesammelt).
    - **Mehrere Statusverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` anderswohin zeigt (Verlauf kann sich zwischen Installationen aufteilen).
    - **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran, ihn auf dem Remote-Host auszuführen (der Status liegt dort).
    - **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json` für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

  </Accordion>
  <Accordion title="5. Modell-Auth-Gesundheit (OAuth-Ablauf)">
    Doctor untersucht OAuth-Profile im Auth-Speicher, warnt, wenn Tokens bald ablaufen oder abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-OAuth-/Token-Profil veraltet ist, schlägt er einen Anthropic-API-Schlüssel oder den Anthropic-Setup-Token-Pfad vor. Aktualisierungsaufforderungen erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive` überspringt Aktualisierungsversuche.

    Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`, `invalid_grant` oder ein Provider, der Sie auffordert, sich erneut anzumelden), meldet Doctor, dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen auszuführenden Befehl `openclaw models auth login --provider ...` aus.

    Doctor meldet außerdem Auth-Profile, die vorübergehend unbrauchbar sind wegen:

    - kurzen Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
    - längeren Deaktivierungen (Billing-/Credit-Fehler)

    Veraltete Codex-OAuth-Profile, deren Tokens im macOS-Schlüsselbund liegen (älteres Onboarding vor dem dateibasierten Sidecar-Layout), werden nur durch Doctor repariert. Führen Sie `openclaw doctor --fix` einmal aus einem interaktiven Terminal aus, um schlüsselbundgestützte Legacy-Tokens inline nach `auth-profiles.json` zu migrieren; danach lösen eingebettete Turns (Telegram, Cron, Sub-Agent-Dispatch) sie als kanonische OpenAI-OAuth-Profile auf.

  </Accordion>
  <Accordion title="6. Hooks-Modellvalidierung">
    Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.
  </Accordion>
  <Accordion title="7. Sandbox-Image-Reparatur">
    Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, zu bauen oder auf Legacy-Namen zu wechseln, wenn das aktuelle Image fehlt.
  </Accordion>
  <Accordion title="7b. Bereinigung von Plugin-Installationen">
    Doctor entfernt veralteten von OpenClaw generierten Staging-Status für Plugin-Abhängigkeiten im Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dies umfasst veraltete generierte Abhängigkeits-Roots, alte Installations-Staging-Verzeichnisse, paketlokale Rückstände aus früherem Reparaturcode für Abhängigkeiten gebündelter Plugins sowie verwaiste oder wiederhergestellte verwaltete npm-Kopien gebündelter `@openclaw/*`-Plugins, die das aktuelle gebündelte Manifest überdecken können. Doctor verlinkt außerdem das Hostpaket `openclaw` erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, sodass paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Updates oder npm-Reparaturen weiterhin aufgelöst werden.

    Doctor kann außerdem fehlende herunterladbare Plugins neu installieren, wenn die Konfiguration auf sie verweist, die lokale Plugin-Registry sie aber nicht finden kann. Beispiele umfassen konkrete `plugins.entries`, konfigurierte Channel-/Provider-/Sucheinstellungen und konfigurierte Agent-Laufzeiten. Während Paketupdates vermeidet Doctor die Ausführung von Paketmanager-Plugin-Reparaturen, während das Kernpaket ausgetauscht wird; führen Sie `openclaw doctor --fix` nach dem Update erneut aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Gateway-Start und Konfigurationsneuladen führen keine Paketmanager aus; Plugin-Installationen bleiben explizite Doctor-/Install-/Update-Arbeit.

  </Accordion>
  <Accordion title="8. Gateway-Service-Migrationen und Bereinigungshinweise">
    Doctor erkennt veraltete Gateway-Services (launchd/systemd/schtasks) und bietet an, sie zu entfernen und den OpenClaw-Service mit dem aktuellen Gateway-Port zu installieren. Er kann außerdem nach zusätzlichen gatewayähnlichen Services suchen und Bereinigungshinweise ausgeben. Profilbenannte OpenClaw-Gateway-Services gelten als vollwertig und werden nicht als „extra“ markiert.

    Unter Linux installiert Doctor nicht automatisch einen zweiten Benutzer-Level-Service, wenn der Benutzer-Level-Gateway-Service fehlt, aber ein System-Level-OpenClaw-Gateway-Service existiert. Prüfen Sie mit `openclaw gateway status --deep` oder `openclaw doctor --deep`, entfernen Sie dann das Duplikat oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein System-Supervisor den Gateway-Lebenszyklus besitzt.

  </Accordion>
  <Accordion title="8b. Startup-Matrix-Migration">
    Wenn ein Matrix-Channel-Konto eine ausstehende oder handlungsrelevante Legacy-Statusmigration hat, erstellt Doctor (im Modus `--fix` / `--repair`) einen Vormigrations-Snapshot und führt dann die Best-Effort-Migrationsschritte aus: Legacy-Matrix-Statusmigration und Vorbereitung des veralteten verschlüsselten Status. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung vollständig übersprungen.
  </Accordion>
  <Accordion title="8c. Gerätekopplung und Auth-Abweichung">
    Doctor prüft jetzt den Gerätekopplungsstatus als Teil des normalen Gesundheitsdurchlaufs.

    Was gemeldet wird:

    - ausstehende erstmalige Kopplungsanfragen
    - ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
    - ausstehende Scope-Upgrades für bereits gekoppelte Geräte
    - Reparaturen von Public-Key-Abweichungen, bei denen die Geräte-ID noch übereinstimmt, die Geräteidentität aber nicht mehr mit dem genehmigten Datensatz übereinstimmt
    - gekoppelte Datensätze, denen ein aktives Token für eine genehmigte Rolle fehlt
    - gekoppelte Tokens, deren Scopes von der genehmigten Kopplungsbasis abweichen
    - lokal zwischengespeicherte Gerätetoken-Einträge für die aktuelle Maschine, die älter sind als eine Gateway-seitige Tokenrotation oder veraltete Scope-Metadaten enthalten

    Doctor genehmigt Kopplungsanfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Stattdessen gibt er die genauen nächsten Schritte aus:

    - ausstehende Anfragen mit `openclaw devices list` prüfen
    - die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
    - ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
    - einen veralteten Datensatz mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

    Dadurch wird die häufige Lücke „bereits gekoppelt, aber weiterhin Kopplung erforderlich“ geschlossen: Doctor unterscheidet jetzt zwischen erstmaliger Kopplung, ausstehenden Rollen-/Scope-Upgrades und veralteter Token-/Geräteidentitäts-Abweichung.

  </Accordion>
  <Accordion title="9. Sicherheitswarnungen">
    Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist geöffnet ist oder wenn eine Richtlinie gefährlich konfiguriert ist.
  </Accordion>
  <Accordion title="10. systemd-Linger (Linux)">
    Bei Ausführung als systemd-Benutzerdienst stellt Doctor sicher, dass Linger aktiviert ist, damit der Gateway nach der Abmeldung aktiv bleibt.
  </Accordion>
  <Accordion title="11. Workspace-Status (Skills, Plugins und TaskFlows)">
    Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

    - **Skills-Status**: zählt geeignete, wegen fehlender Anforderungen ausgeschlossene und durch Allowlist blockierte Skills.
    - **Plugin-Status**: zählt aktivierte/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für Fehler auf; meldet Bundle-Plugin-Fähigkeiten.
    - **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit der aktuellen Runtime haben.
    - **Plugin-Diagnose**: zeigt Ladezeit-Warnungen oder -Fehler an, die von der Plugin-Registry ausgegeben wurden.
    - **TaskFlow-Wiederherstellung**: zeigt verdächtige verwaltete TaskFlows an, die manuelle Prüfung oder Abbruch erfordern.

  </Accordion>
  <Accordion title="11b. Bootstrap-Dateigröße">
    Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`, `CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten Zeichenbudget liegen oder dieses überschreiten. Er meldet pro Datei rohe gegenüber injizierten Zeichenzahlen, Kürzungsprozentsatz, Kürzungsursache (`max/file` oder `max/total`) und die insgesamt injizierten Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars` und `agents.defaults.bootstrapTotalMaxChars` aus.
  </Accordion>
  <Accordion title="11d. Bereinigung veralteter Channel-Plugins">
    Wenn `openclaw doctor --fix` ein fehlendes Channel-Plugin entfernt, entfernt es auch die verwaiste channel-bezogene Konfiguration, die auf dieses Plugin verwiesen hat: `channels.<id>`-Einträge, Heartbeat-Ziele, die den Channel benannt haben, und `agents.*.models["<channel>/*"]`-Overrides. Dadurch werden Gateway-Startschleifen verhindert, bei denen die Channel-Runtime nicht mehr vorhanden ist, die Konfiguration den Gateway aber weiterhin auffordert, sich daran zu binden.
  </Accordion>
  <Accordion title="11c. Shell-Vervollständigung">
    Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell installiert ist (zsh, bash, fish oder PowerShell):

    - Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster (`source <(openclaw completion ...)`) verwendet, aktualisiert Doctor es auf die schnellere Variante mit zwischengespeicherter Datei.
    - Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt, regeneriert Doctor den Cache automatisch.
    - Wenn gar keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

    Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

  </Accordion>
  <Accordion title="12. Gateway-Authentifizierungsprüfungen (lokales Token)">
    Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

    - Wenn der Token-Modus ein Token benötigt und keine Token-Quelle vorhanden ist, bietet Doctor an, eines zu generieren.
    - Wenn `gateway.auth.token` SecretRef-verwaltet, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
    - `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

  </Accordion>
  <Accordion title="12b. Schreibgeschützte SecretRef-bewusste Reparaturen">
    Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Runtime abzuschwächen.

    - `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Statusbefehle für gezielte Konfigurationsreparaturen.
    - Beispiel: Die Reparatur von Telegram `allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
    - Wenn das Telegram-Bot-Token über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

  </Accordion>
  <Accordion title="13. Gateway-Integritätsprüfung + Neustart">
    Doctor führt eine Integritätsprüfung aus und bietet an, den Gateway neu zu starten, wenn er nicht gesund wirkt.
  </Accordion>
  <Accordion title="13b. Bereitschaft der Memory-Suche">
    Doctor prüft, ob der konfigurierte Embedding-Provider für die Memory-Suche für den Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

    - **QMD-Backend**: prüft, ob das `qmd`-Binary verfügbar und startbar ist. Falls nicht, gibt es Reparaturhinweise einschließlich des npm-Pakets und einer Option für einen manuellen Binary-Pfad aus.
    - **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte Remote-/herunterladbare Modell-URL. Falls sie fehlt, wird ein Wechsel zu einem Remote-Provider vorgeschlagen.
    - **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel in der Umgebung oder im Authentifizierungsspeicher vorhanden ist. Gibt umsetzbare Reparaturhinweise aus, falls er fehlt.
    - **Veralteter automatischer Provider**: behandelt `memorySearch.provider: "auto"` als OpenAI, prüft die OpenAI-Bereitschaft, und `doctor --fix` schreibt es zu `provider: "openai"` um.

    Wenn ein zwischengespeichertes Gateway-Prüfergebnis verfügbar ist (der Gateway war zum Zeitpunkt der Prüfung gesund), vergleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration und weist auf Abweichungen hin. Doctor startet auf dem Standardpfad keinen frischen Embedding-Ping; verwenden Sie den ausführlichen Memory-Statusbefehl, wenn Sie eine Live-Provider-Prüfung wünschen.

    Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

  </Accordion>
  <Accordion title="14. Channel-Statuswarnungen">
    Wenn der Gateway gesund ist, führt Doctor eine Channel-Statusprüfung aus und meldet Warnungen mit vorgeschlagenen Korrekturen.
  </Accordion>
  <Accordion title="15. Supervisor-Konfigurationsprüfung + Reparatur">
    Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf fehlende oder veraltete Standards (z. B. systemd-Abhängigkeiten von network-online und Neustartverzögerung). Wenn er eine Abweichung findet, empfiehlt er eine Aktualisierung und kann die Dienstdatei/Aufgabe auf die aktuellen Standards umschreiben.

    Hinweise:

    - `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration umgeschrieben wird.
    - `openclaw doctor --yes` akzeptiert die standardmäßigen Reparaturaufforderungen.
    - `openclaw doctor --fix` wendet empfohlene Korrekturen ohne Nachfragen an (`--repair` ist ein Alias).
    - `openclaw doctor --fix --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` hält Doctor für den Lebenszyklus des Gateway-Dienstes schreibgeschützt. Er meldet weiterhin den Dienstzustand und führt Nicht-Dienst-Reparaturen aus, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap, Umschreibungen der Supervisor-Konfiguration und Bereinigung veralteter Dienste, weil ein externer Supervisor diesen Lebenszyklus besitzt.
    - Unter Linux schreibt Doctor keine Befehls-/Entrypoint-Metadaten um, während die passende systemd-Gateway-Unit aktiv ist. Außerdem ignoriert er inaktive, nicht veraltete zusätzliche gateway-ähnliche Units während der Suche nach doppelten Diensten, damit begleitende Dienstdateien keinen Bereinigungsrauschen erzeugen.
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert die Doctor-Dienstinstallation/-reparatur den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Doctor erkennt verwaltete `.env`-/SecretRef-gestützte Dienstumgebungswerte, die ältere LaunchAgent-, systemd- oder Windows Scheduled Task-Installationen inline eingebettet haben, und schreibt die Dienstmetadaten so um, dass diese Werte aus der Runtime-Quelle statt aus der Supervisor-Definition geladen werden.
    - Doctor erkennt, wenn der Dienstbefehl nach Änderungen an `gateway.port` weiterhin einen alten `--port` festschreibt, und schreibt die Dienstmetadaten auf den aktuellen Port um.
    - Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbarer Anleitung.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus ausdrücklich gesetzt wird.
    - Für Linux-user-systemd-Units beziehen Doctor-Prüfungen auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen ein, wenn Dienst-Authentifizierungsmetadaten verglichen werden.
    - Doctor-Dienstreparaturen verweigern das Umschreiben, Stoppen oder Neustarten eines Gateway-Dienstes aus einem älteren OpenClaw-Binary, wenn die Konfiguration zuletzt von einer neueren Version geschrieben wurde. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Sie können jederzeit ein vollständiges Umschreiben über `openclaw gateway install --force` erzwingen.

  </Accordion>
  <Accordion title="16. Gateway-Runtime + Port-Diagnose">
    Doctor untersucht die Dienst-Runtime (PID, letzter Exit-Status) und warnt, wenn der Dienst installiert ist, aber nicht tatsächlich läuft. Er prüft außerdem auf Portkollisionen am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits, SSH-Tunnel).
  </Accordion>
  <Accordion title="17. Gateway-Runtime Best Practices">
    Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem versionsverwalteten Node-Pfad (`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Channels erfordern Node, und Versionsmanager-Pfade können nach Upgrades brechen, weil der Dienst Ihre Shell-Initialisierung nicht lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn verfügbar (Homebrew/apt/choco).

    Neu installierte oder reparierte macOS LaunchAgents verwenden einen kanonischen System-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), statt den interaktiven Shell-PATH zu kopieren. Dadurch bleiben von Homebrew verwaltete System-Binaries verfügbar, während Volta, asdf, fnm, pnpm und andere Versionsmanager-Verzeichnisse nicht ändern, welche Node-Kindprozesse auflösen. Linux-Dienste behalten weiterhin explizite Umgebungswurzeln (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) und stabile Benutzer-Bin-Verzeichnisse, aber erratene Versionsmanager-Fallback-Verzeichnisse werden nur dann in den Dienst-PATH geschrieben, wenn diese Verzeichnisse auf der Festplatte existieren.

  </Accordion>
  <Accordion title="18. Konfigurationsschreiben + Wizard-Metadaten">
    Doctor persistiert alle Konfigurationsänderungen und stempelt Wizard-Metadaten, um den Doctor-Lauf aufzuzeichnen.
  </Accordion>
  <Accordion title="19. Workspace-Tipps (Backup + Memory-System)">
    Doctor schlägt ein Workspace-Memory-System vor, wenn es fehlt, und gibt einen Backup-Tipp aus, wenn der Workspace noch nicht unter git steht.

    Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur Workspace-Struktur und zum git-Backup (empfohlen: privates GitHub oder GitLab).

  </Accordion>
</AccordionGroup>

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
