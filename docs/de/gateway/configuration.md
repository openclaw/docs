---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-05-06T06:47:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-basierte `openclaw.json`-
Layouts werden für OpenClaw-eigene Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Statusverzeichnisses speichern, richten Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI anpassen

Alle verfügbaren Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Agents und Automatisierungen sollten `config.schema.lookup` für exakte
Dokumentation auf Feldebene verwenden, bevor sie die Konfiguration bearbeiten. Verwenden Sie diese Seite für aufgabenorientierte Anleitung und
[Konfigurationsreferenz](/de/gateway/configuration-reference) für die breitere
Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Starten Sie mit `openclaw onboard` für die interaktive Einrichtung, oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Konfigurationen zum Kopieren und Einfügen an.
</Tip>

## Minimale Konfiguration

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Konfiguration bearbeiten

<Tabs>
  <Tab title="Interaktiver Assistent">
    ```bash
    openclaw onboard       # vollständiger Onboarding-Ablauf
    openclaw configure     # Konfigurationsassistent
    ```
  </Tab>
  <Tab title="CLI (Einzeiler)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Tab **Config**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich
    Dokumentationsmetadaten der Felder `title` / `description` sowie Plugin- und Kanalschemas, sofern
    verfügbar, mit einem **Raw JSON**-Editor als Ausweg. Für Drilldown-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen pfadbezogenen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente
    abzurufen.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von der Control UI
und der Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen der untergeordneten Elemente für Drilldown-Tools ab. Dokumentationsmetadaten der Felder `title`/`description`
werden durch verschachtelte Objekte, Wildcards (`*`), Array-Elemente (`[]`) und `anyOf`-/
`oneOf`-/`allOf`-Zweige weitergegeben. Laufzeit-Schemas von Plugins und Kanälen werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme anzuzeigen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway bewahrt nach jedem erfolgreichen Start eine vertrauenswürdige letzte funktionierende Kopie auf,
aber Start und Hot Reload stellen sie nicht automatisch wieder her. Wenn `openclaw.json`
die Validierung nicht besteht (einschließlich Plugin-lokaler Validierung), schlägt der Gateway-Start fehl oder
das Neuladen wird übersprungen, und die aktuelle Laufzeit behält die zuletzt akzeptierte Konfiguration.
Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um mit Präfixen versehene/überschriebene Konfigurationen zu reparieren oder
die letzte funktionierende Kopie wiederherzustellen. Die Übernahme als letzte funktionierende Kopie wird übersprungen, wenn ein
Kandidat redigierte geheime Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat einen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

    - [WhatsApp](/de/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/de/channels/telegram) - `channels.telegram`
    - [Discord](/de/channels/discord) - `channels.discord`
    - [Feishu](/de/channels/feishu) - `channels.feishu`
    - [Google Chat](/de/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/de/channels/msteams) - `channels.msteams`
    - [Slack](/de/channels/slack) - `channels.slack`
    - [Signal](/de/channels/signal) - `channels.signal`
    - [iMessage](/de/channels/imessage) - `channels.imessage`
    - [Mattermost](/de/channels/mattermost) - `channels.mattermost`

    Alle Kanäle teilen dasselbe DM-Richtlinienmuster:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // nur fuer allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelle auswählen und konfigurieren">
    Legen Sie das primäre Modell und optionale Fallbacks fest:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definiert den Modellkatalog und dient als Allowlist für `/model`.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Transcript-/Tool-Bildern (Standard `1200`); niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung bei screenshot-intensiven Durchläufen.
    - Siehe [Models CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Freigabe
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Verwenden Sie für Gruppen `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Details pro Kanal finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig eine **Mention**. Konfigurieren Sie Trigger-Muster pro Agent, und belassen Sie sichtbare Raumantworten auf dem standardmäßigen Message-Tool-Pfad, sofern Sie nicht bewusst ältere automatische finale Antworten verwenden möchten:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadaten-Mentions**: native @-Mentions (WhatsApp „Zum Erwähnen tippen“, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Message-Tool-Sends global erzwingen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für Modi sichtbarer Antworten, Überschreibungen pro Kanal und Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Baseline, und überschreiben Sie dann bestimmte
    Agents mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` aus, um Skills standardmäßig uneingeschränkt zuzulassen.
    - Lassen Sie `agents.list[].skills` aus, um die Standards zu übernehmen.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Health-Monitoring für Gateway-Kanäle abstimmen">
    Steuern Sie, wie aggressiv das Gateway Kanäle neu startet, die veraltet wirken:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch den Health-Monitor global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder Account zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="WebSocket-Handshake-Timeout des Gateways abstimmen">
    Geben Sie lokalen Clients mehr Zeit, den WebSocket-Handshake vor der Authentifizierung auf
    ausgelasteten oder leistungsschwachen Hosts abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standardwert ist `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat weiterhin Vorrang für einmalige Service- oder Shell-Überschreibungen.
    - Beheben Sie bevorzugt zuerst Start-/Event-Loop-Blockaden; diese Option ist für Hosts gedacht, die fehlerfrei, aber beim Warmup langsam sind.

  </Accordion>

  <Accordion title="Sitzungen und Zurücksetzungen konfigurieren">
    Sitzungen steuern Gesprächskontinuität und Isolation:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (gemeinsam genutzt) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für Thread-gebundenes Sitzungs-Routing (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinie.
    - Siehe [vollständige Referenz](/de/gateway/config-agents#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sitzungen in isolierten Sandbox-Runtimes aus:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Erstellen Sie zuerst das Image: Führen Sie aus einem Source-Checkout `scripts/sandbox-setup.sh` aus, oder lesen Sie bei einer npm-Installation den eingebetteten `docker build`-Befehl unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützten Push für offizielle iOS-Builds aktivieren">
    Relay-gestützter Push wird in `openclaw.json` konfiguriert.

    Legen Sie dies in der Gateway-Konfiguration fest:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI-Entsprechung:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Was dies bewirkt:

    - Ermöglicht dem Gateway, `push.test`, Wake-Nudges und Reconnect-Wakes über das externe Relay zu senden.
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein deploymentweites Relay-Token.
    - Bindet jede relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sends gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendetraffic dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mit App Attest plus App-Beleg und veröffentlicht anschließend die relay-gestützte `push.apns.register`-Payload an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein nur für local loopback vorgesehener Entwicklungs-Ausweg; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

    Siehe [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds) für den End-to-End-Ablauf und [Authentifizierungs- und Vertrauensablauf](/de/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

  </Accordion>

  <Accordion title="Heartbeat einrichten (periodische Check-ins)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: Dauer-String (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/de/gateway/heartbeat) für die vollständige Anleitung.

  </Accordion>

  <Accordion title="Cron-Jobs konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: abgeschlossene isolierte Run-Sitzungen aus `sessions.json` bereinigen (Standard `24h`; setzen Sie `false`, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für Feature-Übersicht und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks einrichten (Hooks)">
    Aktivieren Sie HTTP-Webhook-Endpunkte auf dem Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Sicherheitshinweis:
    - Behandeln Sie alle Hook-/Webhook-Payload-Inhalte als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie das gemeinsam genutzte Gateway-Token nicht erneut.
    - Hook-Authentifizierung erfolgt nur über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Token werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie Webhook-Ingress auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Bypass-Flags für unsichere Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel zu begrenzen.
    - Bevorzugen Sie für Hook-gesteuerte Agents starke moderne Modellklassen und strikte Tool-Policy (zum Beispiel nur Messaging plus Sandboxing, wo möglich).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agents mit separaten Workspaces und Sitzungen aus:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Siehe [Multi-Agent](/de/concepts/multi-agent) und [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Binding-Regeln und agentenspezifische Zugriffsprofile.

  </Accordion>

  <Accordion title="Konfiguration in mehrere Dateien aufteilen ($include)">
    Verwenden Sie `$include`, um große Konfigurationen zu organisieren:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Einzelne Datei**: ersetzt das umgebende Objekt
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (später gewinnt)
    - **Geschwister-Schlüssel**: werden nach Includes zusammengeführt (überschreiben eingebundene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur einbindenden Datei aufgelöst
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert, der durch einen Single-File-Include wie `plugins: { $include: "./plugins.json5" }` gestützt wird, aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes mit Geschwister-Overrides schlagen bei OpenClaw-eigenen Schreibvorgängen geschlossen fehl, statt die Konfiguration zu verflachen
    - **Einschlussbegrenzung**: `$include`-Pfade müssen unter dem Verzeichnis aufgelöst werden, das `openclaw.json` enthält. Um einen Baum über Maschinen oder Benutzer hinweg zu teilen, setzen Sie `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` unter POSIX, `;` unter Windows) zusätzlicher Verzeichnisse, auf die Includes verweisen dürfen. Symlinks werden aufgelöst und erneut geprüft, sodass ein Pfad, der lexikalisch in einem Konfigurationsverzeichnis liegt, dessen echtes Ziel aber jeden erlaubten Root verlässt, weiterhin abgelehnt wird.
    - **Fehlerbehandlung**: klare Fehler bei fehlenden Dateien, Parse-Fehlern und zirkulären Includes

  </Accordion>
</AccordionGroup>

## Config-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an: Für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen gelten als nicht vertrauenswürdig, bis sie validiert wurden. Der Watcher wartet, bis temporäre Editor-Schreib-/Umbenennungsaktivität abgeklungen ist, liest die endgültige Datei und lehnt ungültige externe Bearbeitungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurationsschreibvorgänge verwenden vor dem Schreiben denselben Schema-Gate; destruktive Überschreibungen wie das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt und zur Prüfung als `.rejected.*` gespeichert.

Wenn Sie `config reload skipped (invalid config)` sehen oder der Start `Invalid config` meldet, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` aus und anschließend `openclaw doctor --fix` zur Reparatur. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config) für die Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Apply an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist - Sie übernehmen ihn. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.                        |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Apply angewendet wird und was einen Neustart benötigt

Die meisten Felder werden ohne Ausfallzeit per Hot-Apply angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch behandelt.

| Kategorie            | Felder                                                           | Neustart erforderlich? |
| -------------------- | ---------------------------------------------------------------- | ---------------------- |
| Channels             | `channels.*`, `web` (WhatsApp) - alle eingebauten und Plugin-Channels | Nein                   |
| Agent und Modelle    | `agent`, `agents`, `models`, `routing`                           | Nein                   |
| Automatisierung      | `hooks`, `cron`, `agent.heartbeat`                               | Nein                   |
| Sitzungen und Nachrichten | `session`, `messages`                                        | Nein                   |
| Tools und Medien     | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Nein                   |
| UI und Sonstiges     | `ui`, `logging`, `identity`, `bindings`                          | Nein                   |
| Gateway-Server       | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)             | **Ja**                 |
| Infrastruktur        | `discovery`, `canvasHost`, `plugins`                             | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen: Ihre Änderung löst **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, die über `$include` referenziert wird, plant OpenClaw
den Reload aus dem im Quelltext erstellten Layout, nicht aus der flachgeführten In-Memory-Ansicht.
Dadurch bleiben Hot-Reload-Entscheidungen (Hot-Apply vs. Neustart) vorhersehbar, auch wenn ein
einzelner Abschnitt der obersten Ebene in einer eigenen eingebundenen Datei liegt, wie etwa
`plugins: { $include: "./plugins.json5" }`. Die Reload-Planung schlägt geschlossen fehl, wenn das
Quelllayout mehrdeutig ist.

## Config RPC (programmatische Updates)

Für Tooling, das Konfiguration über die Gateway-API schreibt, bevorzugen Sie diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schemaknoten + untergeordnete
  Zusammenfassungen)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für partielle Updates (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays ersetzen)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für ein explizites Selbst-Update plus Neustart; fügen Sie `continuationMessage` ein, wenn die Sitzung nach dem Neustart einen Folgeturn ausführen soll
- `update.status`, um den neuesten Update-Neustart-Sentinel zu prüfen und die laufende Version nach einem Neustart zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für exakte
feldbezogene Dokumentation und Einschränkungen behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu dedizierten
Subsystem-Referenzen benötigen.

<Note>
Control-Plane-Schreibvorgänge (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt. Neustartanforderungen
werden zusammengeführt und erzwingen anschließend eine Abklingzeit von 30 Sekunden zwischen Neustartzyklen.
`update.status` ist schreibgeschützt, aber auf Admins beschränkt, da der Neustart-Sentinel
Zusammenfassungen von Update-Schritten und Ausgabenenden von Befehlen enthalten kann.
</Note>

Beispiel für einen partiellen Patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sowohl `config.apply` als auch `config.patch` akzeptieren `raw`, `baseHash`, `sessionKey`,
`note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, wenn bereits eine
Konfiguration vorhanden ist.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt bestehende Umgebungsvariablen. Sie können auch Inline-Umgebungsvariablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Env-Import (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Äquivalente Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Referenzieren Sie Umgebungsvariablen in jedem Konfigurationszeichenfolgenwert mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Großbuchstabennamen werden erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` für literale Ausgabe escapen
- Funktioniert innerhalb von `$include`-Dateien
- Inline-Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret-Refs (env, file, exec)">
  Für Felder, die SecretRef-Objekte unterstützen, können Sie Folgendes verwenden:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef-Details (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Anmeldeinformationspfade sind in [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für vollständige Priorität und Quellen.

## Vollständige Referenz

Die vollständige feldweise Referenz finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
