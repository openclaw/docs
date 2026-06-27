---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-06-27T17:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-Layouts für `openclaw.json`
werden für OpenClaw-eigene Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Zustandsverzeichnisses ablegen, setzen Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe für eine Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI feinabstimmen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

Agenten und Automatisierung sollten `config.schema.lookup` für exakte feldbezogene
Dokumentation verwenden, bevor sie die Konfiguration bearbeiten. Nutzen Sie diese Seite für aufgabenorientierte Anleitung und
die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung, oder lesen Sie den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige Konfigurationen zum Kopieren und Einfügen.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich Feld-
    `title`- / `description`-Dokumentationsmetadaten sowie Plugin- und Kanalschemas, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Ausweg. Für Drilldown-
    UIs und andere Werkzeuge stellt der Gateway außerdem `config.schema.lookup` bereit, um
    einen pfadbezogenen Schemaknoten plus direkte Zusammenfassungen der untergeordneten Elemente abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Der Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass der Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON Schema aus, das von Control UI
und Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen der untergeordneten Elemente für Drilldown-Werkzeuge ab. Feld-`title`-/`description`-Dokumentationsmetadaten
werden durch verschachtelte Objekte, Wildcard- (`*`), Array-Element- (`[]`) und `anyOf`-/
`oneOf`-/`allOf`-Zweige weitergegeben. Laufzeit-Plugin- und Kanalschemas werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Der Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die exakten Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Der Gateway hält nach jedem erfolgreichen Start eine vertrauenswürdige zuletzt-funktionierende Kopie vor,
aber Start und Hot Reload stellen sie nicht automatisch wieder her. Wenn `openclaw.json`
die Validierung nicht besteht (einschließlich Plugin-lokaler Validierung), schlägt der Gateway-Start fehl oder
das Neuladen wird übersprungen, und die aktuelle Laufzeit behält die zuletzt akzeptierte Konfiguration bei.
Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um präfixierte/überschriebene Konfiguration zu reparieren oder
die zuletzt-funktionierende Kopie wiederherzustellen. Die Übernahme als zuletzt-funktionierend wird übersprungen, wenn ein
Kandidat redigierte Secret-Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Einrichtungsschritte finden Sie auf der dedizierten Kanalseite:

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
          allowFrom: ["tg:123"], // only for allowlist/open
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

    - `agents.defaults.models` definiert den Modellkatalog und dient als Allowlist für `/model`; `provider/*`-Einträge filtern `/model`, `/models` und Modellauswahlen auf ausgewählte Provider, während weiterhin dynamische Modellerkennung verwendet wird.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modell-Refs verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Transkript-/Tool-Bildern (Standard `1200`); niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Tokens bei screenshotlastigen Läufen.
    - Siehe [Modelle-CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Modell-Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbstgehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Freigabe
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Speicher)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/config-channels#dm-and-group-access) für Details pro Kanal.

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Trigger-Muster pro Agent. Normale Gruppen-/Kanalantworten werden automatisch gepostet; aktivieren Sie den Message-Tool-Pfad für gemeinsam genutzte Räume, in denen der Agent entscheiden soll, wann er spricht:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tap-to-Mention, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Message-Tool-Sends global verlangen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für sichtbare Antwortmodi, Überschreibungen pro Kanal und Selbstchat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann bestimmte
    Agenten mit `agents.list[].skills`:

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

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig uneingeschränkt sind.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Gateway-Kanalzustandsüberwachung feinabstimmen">
    Steuern Sie, wie aggressiv der Gateway Kanäle neu startet, die veraltet wirken:

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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Health-Monitor-Neustarts global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder Account zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für betriebliches Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Gateway-WebSocket-Handshake-Timeout feinabstimmen">
    Geben Sie lokalen Clients mehr Zeit, den Pre-Auth-WebSocket-Handshake auf
    ausgelasteten oder leistungsschwachen Hosts abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standard ist `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat weiterhin Vorrang für einmalige Service- oder Shell-Überschreibungen.
    - Beheben Sie Start-/Event-Loop-Blockaden vorzugsweise zuerst; dieser Regler ist für Hosts gedacht, die gesund, aber während des Warmups langsam sind.

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

    - `dmScope`: `main` (geteilt) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für sitzungsgebundenes Session-Routing (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Session-Verwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinie.
    - Siehe [vollständige Referenz](/de/gateway/config-agents#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sessions in isolierten Sandbox-Runtimes aus:

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

    Erstellen Sie zuerst das Image - führen Sie aus einem Source-Checkout `scripts/sandbox-setup.sh` aus, oder sehen Sie bei einer npm-Installation den Inline-Befehl `docker build` unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützte Push-Benachrichtigungen für offizielle iOS-Builds aktivieren">
    Relay-gestützte Push-Benachrichtigungen für öffentliche App Store-/TestFlight-Builds verwenden das gehostete OpenClaw-Relay: `https://ios-push-relay.openclaw.ai`.

    Benutzerdefinierte Relay-Deployments erfordern einen bewusst separaten iOS-Build-/Deployment-Pfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie dies in der Gateway-Konfiguration fest:

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
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direkten APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der im iOS-Build eingebetteten Relay-Basis-URL übereinstimmen, damit Registrierungs- und Sendeverkehr dasselbe Relay-Deployment erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build.
    2. Optional: Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sessions verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mit App Attest plus App-Beleg beim Relay und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Nutzlast an das gekoppelte Gateway.
    5. Das Gateway speichert das Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf ein anderes Relay-Deployment verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - Benutzerdefinierte Gateway-Relay-URLs müssen mit der im iOS-Build eingebetteten Relay-Basis-URL übereinstimmen. Der öffentliche App-Store-Release-Zweig lehnt benutzerdefinierte iOS-Relay-URL-Overrides ab.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine reine local loopback-Entwicklungsausnahme; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

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

    - `every`: Dauerzeichenfolge (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/de/gateway/heartbeat) für die vollständige Anleitung.

  </Accordion>

  <Accordion title="Cron-Jobs konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: abgeschlossene isolierte Run-Sessions aus `sessions.json` bereinigen (Standard `24h`; auf `false` setzen, um zu deaktivieren).
    - `runLog`: beibehaltene Cron-Run-History-Zeilen pro Job bereinigen. `maxBytes` wird für ältere dateibasierte Run-Logs weiterhin akzeptiert.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für Funktionsüberblick und CLI-Beispiele.

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
    - Behandeln Sie alle Hook-/Webhook-Nutzlastinhalte als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie keine aktiven Gateway-Auth-Secrets (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) erneut.
    - Hook-Auth erfolgt nur per Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Token werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie Webhook-Ingress auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Bypass-Flags für unsichere Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Session-Schlüssel zu begrenzen.
    - Bevorzugen Sie für Hook-gesteuerte Agents starke moderne Modellstufen und strikte Tool-Richtlinien (zum Beispiel nur Messaging plus Sandboxing, wo möglich).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agents mit separaten Workspaces und Sessions aus:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Binding-Regeln und agentspezifische Zugriffsprofile.

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

    - **Einzelne Datei**: ersetzt das enthaltende Objekt
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (spätere Werte gewinnen)
    - **Geschwisterschlüssel**: nach Includes zusammengeführt (überschreiben einbezogene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: relativ zur einbindenden Datei aufgelöst
    - **Pfadformat**: Include-Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert,
      der durch ein Single-File-Include wie `plugins: { $include: "./plugins.json5" }` abgesichert ist,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes
      mit Geschwister-Overrides schlagen bei OpenClaw-eigenen Schreibvorgängen geschlossen fehl,
      statt die Konfiguration zu verflachen
    - **Einschluss**: `$include`-Pfade müssen unter dem Verzeichnis aufgelöst werden, das
      `openclaw.json` enthält. Um einen Baum über Maschinen oder Benutzer hinweg zu teilen, setzen Sie
      `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` auf POSIX, `;` unter Windows) mit
      zusätzlichen Verzeichnissen, auf die Includes verweisen dürfen. Symlinks werden aufgelöst
      und erneut geprüft, sodass ein Pfad, der lexikalisch in einem Konfigurationsverzeichnis liegt, dessen
      tatsächliches Ziel jedoch jede erlaubte Root verlässt, weiterhin abgelehnt wird.
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler, zirkuläre Includes, ungültiges Pfadformat und übermäßige Länge

  </Accordion>
</AccordionGroup>

## Konfigurations-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an - für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen werden als nicht vertrauenswürdig behandelt, bis sie validiert wurden. Der Watcher wartet,
bis sich Editor-Temp-Write-/Rename-Aktivität beruhigt hat, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurations-
Schreibvorgänge verwenden vor dem Schreiben dieselbe Schema-Prüfung; destruktive Überschreibungen wie
das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt und
zur Prüfung als `.rejected.*` gespeichert.

Wenn Sie `config reload skipped (invalid config)` sehen oder der Start `Invalid
config` meldet, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` aus und führen Sie dann `openclaw
doctor --fix` zur Reparatur aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config)
für die Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Apply an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist - Sie kümmern sich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, ob sicher oder nicht.          |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Apply angewendet wird und was einen Neustart benötigt

Die meisten Felder werden ohne Ausfallzeit per Hot-Apply angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch behandelt.

| Kategorie           | Felder                                                            | Neustart erforderlich? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) - alle integrierten und Plugin-Kanäle | Nein            |
| Agent und Modelle   | `agent`, `agents`, `models`, `routing`                            | Nein            |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                | Nein            |
| Sitzungen und Nachrichten | `session`, `messages`                                             | Nein            |
| Tools und Medien    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nein            |
| UI und Sonstiges    | `ui`, `logging`, `identity`, `bindings`                           | Nein            |
| Gateway-Server      | `gateway.*` (Port, Bindung, Authentifizierung, Tailscale, TLS, HTTP) | **Ja**          |
| Infrastruktur       | `discovery`, `plugins`                                            | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen - deren Änderung löst **keinen** Neustart aus.
</Note>

### Planung des Neuladens

Wenn Sie eine Quelldatei bearbeiten, die über `$include` referenziert wird, plant OpenClaw
das Neuladen anhand des quellseitig verfassten Layouts, nicht anhand der abgeflachten In-Memory-Ansicht.
So bleiben Hot-Reload-Entscheidungen (Hot-Apply statt Neustart) vorhersehbar, selbst wenn ein
einzelner Abschnitt auf oberster Ebene in einer eigenen eingebundenen Datei liegt, etwa
`plugins: { $include: "./plugins.json5" }`. Die Planung des Neuladens schlägt geschlossen fehl, wenn das
Quelllayout mehrdeutig ist.

## Konfigurations-RPC (programmatische Updates)

Für Tools, die Konfiguration über die Gateway-API schreiben, sollten Sie diesen Ablauf bevorzugen:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schemaknoten + Zusammenfassungen
  der untergeordneten Elemente)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für partielle Updates (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt, wenn dies explizit mit `replacePaths` bestätigt wurde, falls
  Einträge entfernt würden)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für ein explizites Selbst-Update plus Neustart; fügen Sie `continuationMessage` ein, wenn die Sitzung nach dem Neustart einen Folgeturn ausführen soll
- `update.status`, um den neuesten Update-Neustart-Sentinel zu prüfen und die laufende Version nach einem Neustart zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für exakte
Dokumentation und Einschränkungen auf Feldebene behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu speziellen
Subsystemreferenzen benötigen.

<Note>
Control-Plane-Schreibvorgänge (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt. Neustartanforderungen
werden zusammengeführt und erzwingen anschließend eine Abklingzeit von 30 Sekunden zwischen Neustartzyklen.
`update.status` ist schreibgeschützt, aber auf Administratoren beschränkt, da der Neustart-Sentinel
Zusammenfassungen der Update-Schritte und Enden der Befehlsausgabe enthalten kann.
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
Konfiguration existiert.

`config.patch` akzeptiert außerdem `replacePaths`, ein Array von Konfigurationspfaden, deren Array-
Ersetzung beabsichtigt ist. Wenn ein Patch ein vorhandenes Array durch ein Array mit weniger Einträgen
ersetzen oder löschen würde, lehnt der Gateway den Schreibvorgang ab, sofern genau dieser Pfad nicht
in `replacePaths` erscheint; verschachtelte Arrays unter Array-Einträgen verwenden `[]`, etwa
`agents.list[].skills`. Dies verhindert, dass abgeschnittene `config.get`-Snapshots
Routing- oder Allowlist-Arrays stillschweigend überschreiben. Verwenden Sie `config.apply`, wenn Sie
die vollständige Konfiguration ersetzen möchten.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` im aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Sie können Inline-Umgebungsvariablen auch in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Referenzieren Sie Umgebungsvariablen in jedem Konfigurations-Stringwert mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Großbuchstabennamen werden abgeglichen: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` für wörtliche Ausgabe escapen
- Funktioniert innerhalb von `$include`-Dateien
- Inline-Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Zugangsdatenpfade sind in [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
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
