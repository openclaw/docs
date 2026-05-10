---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsüberblick: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-05-10T19:34:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-Layouts für `openclaw.json`
werden für von OpenClaw ausgeführte Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Zustandsverzeichnisses aufbewahren, zeigen Sie mit `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI anpassen

Alle verfügbaren Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Agenten und Automatisierung sollten `config.schema.lookup` für genaue Dokumentation
auf Feldebene verwenden, bevor sie die Konfiguration bearbeiten. Nutzen Sie diese Seite für aufgabenorientierte Hinweise und
die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für eine interaktive Einrichtung, oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige Konfigurationen zum Kopieren an.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Tab **Config**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich Feld-
    Dokumentationsmetadaten `title` / `description` sowie Plugin- und Kanalschemas, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Ausweg. Für Drilldown-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen pfadbezogenen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente abzurufen.
  </Tab>
  <Tab title="Direct edit">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Stammebene ist `$schema` (string), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von Control UI
und Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen untergeordneter Elemente für Drilldown-Tools ab. Feld-Dokumentationsmetadaten `title`/`description`
werden durch verschachtelte Objekte, Wildcard- (`*`), Array-Item- (`[]`) und `anyOf`/
`oneOf`/`allOf`-Zweige weitergereicht. Runtime-Plugin- und Kanalschemas werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway speichert nach jedem erfolgreichen Start eine vertrauenswürdige zuletzt als funktionsfähig bekannte Kopie,
aber Start und Hot Reload stellen sie nicht automatisch wieder her. Wenn `openclaw.json`
die Validierung nicht besteht (einschließlich Plugin-lokaler Validierung), schlägt der Gateway-Start fehl oder
das Neuladen wird übersprungen und die aktuelle Runtime behält die zuletzt akzeptierte Konfiguration bei.
Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um präfixierte/überschriebene Konfiguration zu reparieren oder
die zuletzt als funktionsfähig bekannte Kopie wiederherzustellen. Die Übernahme als zuletzt funktionsfähig bekannte Kopie wird übersprungen, wenn ein
Kandidat redigierte Secret-Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Jeder Kanal hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

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

    Alle Kanäle verwenden dasselbe Muster für DM-Richtlinien:

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

  <Accordion title="Choose and configure models">
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

    - `agents.defaults.models` definiert den Modellkatalog und dient als Allowlist für `/model`; `provider/*`-Einträge filtern `/model`, `/models` und Modellauswahlen auf ausgewählte Provider, während weiterhin dynamische Modellermittlung verwendet wird.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Transcript-/Tool-Bildern (Standard `1200`); niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung bei Screenshot-lastigen Läufen.
    - Siehe [Modelle-CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Modell-Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Control who can message the bot">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Freigabe
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Kanalspezifische Details finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Gruppennachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Trigger-Muster pro Agent und belassen Sie sichtbare Raumantworten auf dem standardmäßigen Nachrichtentool-Pfad, sofern Sie nicht bewusst alte automatische Abschlussantworten verwenden möchten:

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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Antippen-zum-Erwähnen, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Nachrichtentool-Sendungen global erzwingen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für Modi sichtbarer Antworten, kanalspezifische Überschreibungen und Self-Chat-Modus.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis, und überschreiben Sie anschließend bestimmte
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

    - Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig uneingeschränkt zuzulassen.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Health-Monitor-Neustarts global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für operative Fehlersuche und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
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
    - Beheben Sie bevorzugt zuerst Start-/Event-Loop-Blockaden; dieser Regler ist für Hosts gedacht, die gesund, aber während des Warmups langsam sind.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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

    - `dmScope`: `main` (gemeinsam) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für sitzungsgebundenes Routing threadgebundener Sitzungen (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinien.
    - Siehe [vollständige Referenz](/de/gateway/config-agents#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sitzungen in isolierten Sandbox-Laufzeiten aus:

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

    Erstellen Sie zuerst das Image: Führen Sie aus einem Source-Checkout `scripts/sandbox-setup.sh` aus, oder sehen Sie bei einer npm-Installation den inline angegebenen `docker build`-Befehl unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestütztes Push für offizielle iOS-Builds aktivieren">
    Relay-gestütztes Push wird in `openclaw.json` konfiguriert.

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

    CLI-Äquivalent:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Das bewirkt Folgendes:

    - Ermöglicht dem Gateway, `push.test`, Wake-Nudges und Reconnect-Wakes über das externe Relay zu senden.
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein deploymentweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direkten APNs. Relay-gestützte Sends gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendetraffic dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mit App Attest plus App-Receipt und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Payload an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue Relay-Registrierung veröffentlichen kann, die an dieses Gateway gebunden ist.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein nur für loopback gedachter Entwicklungs-Ausweg; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

    Siehe [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds) für den End-to-End-Ablauf und [Authentifizierungs- und Vertrauensablauf](/de/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

  </Accordion>

  <Accordion title="Heartbeat einrichten (regelmäßige Check-ins)">
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

    - `sessionRetention`: bereinigt abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` (Standard `24h`; setzen Sie `false`, um zu deaktivieren).
    - `runLog`: bereinigt `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für Funktionsübersicht und CLI-Beispiele.

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
    - Behandeln Sie alle Hook-/Webhook-Payload-Inhalte als nicht vertrauenswürdige Eingabe.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie das gemeinsame Gateway-Token nicht wieder.
    - Hook-Authentifizierung erfolgt nur über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Token werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie den Webhook-Ingress auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Bypass-Flags für unsichere Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel einzugrenzen.
    - Für Hook-gesteuerte Agents bevorzugen Sie starke moderne Modell-Tiers und eine strikte Tool-Richtlinie (zum Beispiel nur Messaging plus, wo möglich, Sandboxing).

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Bindungsregeln und agentbezogene Zugriffsprofile.

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
    - **Array von Dateien**: wird in Reihenfolge tief zusammengeführt (spätere gewinnen)
    - **Sibling-Schlüssel**: werden nach Includes zusammengeführt (überschreiben enthaltene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur einschließenden Datei aufgelöst
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert,
      der durch einen Einzeldatei-Include wie `plugins: { $include: "./plugins.json5" }` abgesichert ist,
      aktualisiert OpenClaw diese enthaltene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Write-through**: Root-Includes, Include-Arrays und Includes
      mit Sibling-Overrides schlagen für OpenClaw-eigene Schreibvorgänge geschlossen fehl, statt
      die Konfiguration zu flatten
    - **Einschränkung**: `$include`-Pfade müssen unter dem Verzeichnis aufgelöst werden, das
      `openclaw.json` enthält. Um einen Baum über Maschinen oder Benutzer hinweg zu teilen, setzen Sie
      `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` auf POSIX, `;` unter Windows) aus
      zusätzlichen Verzeichnissen, auf die Includes verweisen dürfen. Symlinks werden aufgelöst
      und erneut geprüft, sodass ein Pfad, der lexikalisch in einem Konfigurationsverzeichnis liegt, dessen
      reales Ziel aber aus jeder erlaubten Root ausbricht, weiterhin abgelehnt wird.
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an: Für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen gelten als nicht vertrauenswürdig, bis sie validiert wurden. Der Watcher wartet,
bis Temp-Write-/Rename-Aktivität von Editoren zur Ruhe gekommen ist, liest die finale Datei und lehnt
ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurations-
Schreibvorgänge verwenden vor dem Schreiben denselben Schema-Gate; destruktive Clobbers wie das
Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt und
zur Prüfung als `.rejected.*` gespeichert.

Wenn Sie `config reload skipped (invalid config)` sehen oder der Start `Invalid
config` meldet, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` aus und führen Sie anschließend `openclaw
doctor --fix` zur Reparatur aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config)
für die Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot Apply an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist - Sie übernehmen das. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, ob sicher oder nicht.          |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot Apply angewendet wird und was einen Neustart benötigt

Die meisten Felder werden ohne Ausfallzeit per Hot Apply angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch behandelt.

| Kategorie           | Felder                                                           | Neustart erforderlich? |
| ------------------- | ---------------------------------------------------------------- | ---------------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) - alle integrierten und Plugin-Kanäle | Nein                   |
| Agent & Modelle     | `agent`, `agents`, `models`, `routing`                           | Nein                   |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                               | Nein                   |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein                   |
| Tools & Medien      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Nein                   |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                          | Nein                   |
| Gateway-Server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Ja**                 |
| Infrastruktur       | `discovery`, `plugins`                                           | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen - Änderungen daran lösen **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, die über `$include` referenziert wird, plant OpenClaw
den Reload anhand des in der Quelle verfassten Layouts, nicht anhand der abgeflachten In-Memory-Ansicht.
Dadurch bleiben Hot-Reload-Entscheidungen (Hot-Apply vs. Neustart) vorhersehbar, selbst wenn ein
einzelner Top-Level-Abschnitt in einer eigenen eingebundenen Datei liegt, zum Beispiel
`plugins: { $include: "./plugins.json5" }`. Die Reload-Planung schlägt geschlossen fehl, wenn das
Quelllayout mehrdeutig ist.

## Konfigurations-RPC (programmatische Aktualisierungen)

Für Tools, die Konfiguration über die Gateway-API schreiben, verwenden Sie bevorzugt diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schema-Node + Child-
  Zusammenfassungen)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für teilweise Aktualisierungen (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für ein explizites Self-Update plus Neustart; geben Sie `continuationMessage` an, wenn die Sitzung nach dem Neustart einen Follow-up-Turn ausführen soll
- `update.status`, um den neuesten Update-Neustart-Sentinel zu prüfen und die laufende Version nach einem Neustart zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für genaue
Dokumentation und Einschränkungen auf Feldebene behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu dedizierten
Subsystem-Referenzen benötigen.

<Note>
Schreibvorgänge der Control Plane (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden je `deviceId+clientIp` begrenzt. Neustart-
Anfragen werden zusammengeführt und erzwingen anschließend eine Abkühlzeit von 30 Sekunden zwischen Neustartzyklen.
`update.status` ist schreibgeschützt, aber auf Admins beschränkt, weil der Neustart-Sentinel
Zusammenfassungen von Update-Schritten und Auszüge aus der Befehlsausgabe enthalten kann.
</Note>

Beispiel für einen Teil-Patch:

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

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
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

<Accordion title="Shell-env-Import (optional)">
  Falls aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Referenzieren Sie Umgebungsvariablen in beliebigen Zeichenfolgenwerten der Konfiguration mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur großgeschriebene Namen passen: `[A-Z_][A-Z0-9_]*`
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

SecretRef-Details (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie in [Secrets-Verwaltung](/de/gateway/secrets).
Unterstützte Anmeldeinformationspfade sind unter [SecretRef-Anmeldeinformationsoberfläche](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für die vollständige Rangfolge und Quellen.

## Vollständige Referenz

Die vollständige Feld-für-Feld-Referenz finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
