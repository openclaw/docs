---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach häufigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-23T06:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguration

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und abschließende Kommata">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Layouts mit
verlinkter `openclaw.json` werden für von OpenClaw verwaltete Schreibvorgänge
nicht unterstützt; ein atomarer Schreibvorgang kann den Pfad ersetzen,
anstatt den Symlink beizubehalten. Wenn du die Konfiguration außerhalb des
Standard-Statusverzeichnisses speicherst, verweise mit `OPENCLAW_CONFIG_PATH`
direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI abstimmen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

<Tip>
**Neu bei der Konfiguration?** Starte mit `openclaw onboard` für die interaktive Einrichtung oder sieh dir die Anleitung [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Copy-Paste-Konfigurationen an.
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
    Öffne [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwende den Tab **Config**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Docs-Metadaten
    `title` / `description` sowie Plugin- und Kanalschemata, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten plus Zusammenfassungen der unmittelbaren Kindknoten abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeite `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

Hinweise zu Schema-Tools:

- `openclaw config schema` gibt dieselbe JSON-Schema-Familie aus, die von Control UI
  und der Konfigurationsvalidierung verwendet wird.
- Behandle diese Schemaausgabe als den maßgeblichen maschinenlesbaren Vertrag für
  `openclaw.json`; diese Übersicht und die Konfigurationsreferenz fassen ihn zusammen.
- Feldwerte `title` und `description` werden in die Schemaausgabe übernommen für
  Editor- und Formular-Tools.
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Element- (`[]`) Einträge übernehmen dieselben
  Docs-Metadaten, wo passende Felddokumentation existiert.
- Auch Kompositionszweige `anyOf` / `oneOf` / `allOf` übernehmen dieselben Docs-
  Metadaten, sodass Varianten von Union/Intersection dieselbe Feldhilfe behalten.
- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gemeinsame Grenzen
  und ähnliche Validierungsfelder), passenden UI-Hinweis-Metadaten und Zusammenfassungen der unmittelbaren Kindknoten
  für Drill-down-Tools zurück.
- Laufzeit-Plugin-/Kanalschemata werden zusammengeführt, wenn das Gateway die
  aktuelle Manifest-Registry laden kann.
- `pnpm config:docs:check` erkennt Abweichungen zwischen docsseitigen Artefakten der Konfigurations-Baseline
  und der aktuellen Schemaoberfläche.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führe `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führe `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält außerdem nach einem erfolgreichen Start eine vertrauenswürdige letzte funktionierende Kopie. Wenn
`openclaw.json` später außerhalb von OpenClaw geändert wird und nicht mehr gültig ist, bewahren Start
und Hot Reload die defekte Datei als zeitgestempelten `.clobbered.*`-Snapshot auf,
stellen die letzte funktionierende Kopie wieder her und protokollieren eine deutliche Warnung mit dem Grund der Wiederherstellung.
Die Wiederherstellung beim Lesen während des Starts behandelt auch starke Größenabnahmen, fehlende Konfigurationsmetadaten und ein
fehlendes `gateway.mode` als kritische Clobber-Signaturen, wenn die letzte funktionierende
Kopie diese Felder hatte.
Wenn versehentlich eine Status-/Protokollzeile vor eine ansonsten gültige JSON-
Konfiguration gesetzt wird, können Gateway-Start und `openclaw doctor --fix` das Präfix entfernen,
die verunreinigte Datei als `.clobbered.*` bewahren und mit der wiederhergestellten
JSON fortfahren.
Der nächste Turn des Haupt-Agenten erhält außerdem eine Systemereigniswarnung, die ihm mitteilt, dass die
Konfiguration wiederhergestellt wurde und nicht blind überschrieben werden darf. Die Beförderung zur letzten funktionierenden Kopie
wird nach validiertem Start und nach akzeptierten Hot Reloads aktualisiert, einschließlich
von OpenClaw verwalteter Konfigurationsschreibvorgänge, deren persistierter Datei-Hash weiterhin mit dem akzeptierten
Schreibvorgang übereinstimmt. Die Beförderung wird übersprungen, wenn der Kandidat redigierte Secret-
Platzhalter wie `***` oder verkürzte Tokenwerte enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat einen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Siehe die jeweilige Kanalseite für die Einrichtungsschritte:

    - [WhatsApp](/de/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/de/channels/telegram) — `channels.telegram`
    - [Discord](/de/channels/discord) — `channels.discord`
    - [Feishu](/de/channels/feishu) — `channels.feishu`
    - [Google Chat](/de/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/de/channels/msteams) — `channels.msteams`
    - [Slack](/de/channels/slack) — `channels.slack`
    - [Signal](/de/channels/signal) — `channels.signal`
    - [iMessage](/de/channels/imessage) — `channels.imessage`
    - [Mattermost](/de/channels/mattermost) — `channels.mattermost`

    Alle Kanäle teilen sich dasselbe DM-Richtlinienmuster:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // nur für allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelle auswählen und konfigurieren">
    Lege das primäre Modell und optionale Fallbacks fest:

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
    - Verwende `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern du nicht `--replace` übergibst.
    - Modell-Refs verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Bildern in Transcript/Tools (Standard `1200`); niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung bei Läufen mit vielen Screenshots.
    - Siehe [Models CLI](/de/concepts/models) für das Wechseln von Modellen im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Custom providers](/de/gateway/configuration-reference#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwende `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#dm-and-group-access) für details pro Kanal.

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig **eine Erwähnung**. Konfiguriere Muster pro Agent:

    ```json5
    {
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tippen-zum-Erwähnen, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - Siehe [vollständige Referenz](/de/gateway/configuration-reference#group-chat-mention-gating) für Überschreibungen pro Kanal und den Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwende `agents.defaults.skills` für eine gemeinsame Basis und überschreibe dann bestimmte
    Agenten mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // übernimmt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lasse `agents.defaults.skills` weg für standardmäßig uneingeschränkte Skills.
    - Lasse `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
    - Setze `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung der Gateway-Kanalgesundheit abstimmen">
    Steuere, wie aggressiv das Gateway Kanäle neu startet, die veraltet wirken:

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

    - Setze `gateway.channelHealthCheckMinutes: 0`, um Neustarts der Gesundheitsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwende `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Resets konfigurieren">
    Sitzungen steuern die Kontinuität und Isolation von Unterhaltungen:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // empfohlen für mehrere Benutzer
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
    - `threadBindings`: globale Standardwerte für threadgebundenes Sitzungsrouting (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Session Management](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinien.
    - Siehe die [vollständige Referenz](/de/gateway/configuration-reference#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Agentensitzungen in isolierten Sandbox-Laufzeiten ausführen:

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

    Erstelle das Image zuerst: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/de/gateway/configuration-reference#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützten Push für offizielle iOS-Builds aktivieren">
    Relay-gestützter Push wird in `openclaw.json` konfiguriert.

    Setze dies in der Gateway-Konfiguration:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Standard: 10000
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

    Was das bewirkt:

    - Ermöglicht dem Gateway, `push.test`, Weckanstöße und Reconnect-Wecksignale über das externe Relay zu senden.
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein relayweites Token für die gesamte Bereitstellung.
    - Bindet jede relaygestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendetraffic dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installiere einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfiguriere `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Kopple die iOS-App mit dem Gateway und lasse sowohl Node- als auch Operatorsitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mit App Attest plus App-Receipt und veröffentlicht dann die relaygestützte Payload `push.apns.register` an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Weckanstöße und Reconnect-Wecksignale.

    Betriebliche Hinweise:

    - Wenn du die iOS-App auf ein anderes Gateway umstellst, verbinde die App erneut, damit sie eine neue an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn du einen neuen iOS-Build auslieferst, der auf eine andere Relay-Bereitstellung zeigt, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Überschreibungen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für Loopback gedachte Entwicklungs-Notfalloption; persistiere keine HTTP-Relay-URLs in der Konfiguration.

    Siehe [iOS App](/de/platforms/ios#relay-backed-push-for-official-builds) für den End-to-End-Ablauf und [Authentication and trust flow](/de/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

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

    - `every`: Dauerzeichenfolge (`30m`, `2h`). Setze `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/de/gateway/heartbeat) für die vollständige Anleitung.

  </Accordion>

  <Accordion title="Cron-Jobs konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: abgeschlossene isolierte Laufsitzungen aus `sessions.json` entfernen (Standard `24h`; setze `false`, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen beschneiden.
    - Siehe [Cron jobs](/de/automation/cron-jobs) für den Funktionsüberblick und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks einrichten (Hooks)">
    HTTP-Webhook-Endpunkte auf dem Gateway aktivieren:

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
    - Behandle den gesamten Inhalt von Hook-/Webhook-Payloads als nicht vertrauenswürdige Eingabe.
    - Verwende ein dediziertes `hooks.token`; verwende nicht das gemeinsame Gateway-Token erneut.
    - Hook-Auth ist nur headerbasiert (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Query-Strings werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halte den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lasse Flags zum Umgehen unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), es sei denn, du führst eng begrenztes Debugging durch.
    - Wenn du `hooks.allowRequestSessionKey` aktivierst, setze auch `hooks.allowedSessionKeyPrefixes`, um von Aufrufern gewählte Sitzungsschlüssel einzugrenzen.
    - Für hookgesteuerte Agenten bevorzuge starke moderne Modell-Tiers und eine strikte Tool-Richtlinie (zum Beispiel nur Messaging plus nach Möglichkeit Sandboxing).

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Mehrere isolierte Agenten mit separaten Workspaces und Sitzungen ausführen:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und die [vollständige Referenz](/de/gateway/configuration-reference#multi-agent-routing) für Bindungsregeln und Zugriffprofile pro Agent.

  </Accordion>

  <Accordion title="Konfiguration auf mehrere Dateien aufteilen ($include)">
    Verwende `$include`, um große Konfigurationen zu organisieren:

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
    - **Array von Dateien**: wird in Reihenfolge per Deep Merge zusammengeführt (spätere gewinnt)
    - **Benachbarte Schlüssel**: werden nach den Includes zusammengeführt (überschreiben inkludierte Werte)
    - **Verschachtelte Includes**: werden bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur inkludierenden Datei aufgelöst
    - **Von OpenClaw verwaltete Schreibvorgänge**: wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert,
      der von einem Include mit einzelner Datei gestützt wird, etwa `plugins: { $include: "./plugins.json5" }`,
      aktualisiert OpenClaw diese inkludierte Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Write-through**: Root-Includes, Include-Arrays und Includes
      mit benachbarten Überschreibungen schlagen für von OpenClaw verwaltete Schreibvorgänge fail-closed fehl, statt
      die Konfiguration zu flatten
    - **Fehlerbehandlung**: klare Fehler bei fehlenden Dateien, Parse-Fehlern und zirkulären Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und übernimmt Änderungen automatisch — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen werden als nicht vertrauenswürdig behandelt, bis sie validiert sind. Der Watcher wartet,
bis temporäre Schreib-/Umbenennungsvorgänge des Editors abgeschlossen sind, liest die endgültige Datei und lehnt
ungültige externe Bearbeitungen ab, indem er die letzte funktionierende Konfiguration wiederherstellt. Von OpenClaw verwaltete
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dieselbe Schema-Gate-Prüfung; destruktive Beschädigungen wie
das Entfernen von `gateway.mode` oder eine Verkleinerung der Datei um mehr als die Hälfte werden abgelehnt
und zur Inspektion als `.rejected.*` gespeichert.

Wenn du in Logs `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` siehst, prüfe die passende
Datei `.clobbered.*` neben `openclaw.json`, korrigiere die abgelehnte Payload und führe dann
`openclaw config validate` aus. Siehe [Gateway troubleshooting](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Sichere Änderungen werden sofort per Hot Apply übernommen. Für kritische Änderungen erfolgt automatisch ein Neustart. |
| **`hot`**              | Übernimmt nur sichere Änderungen per Hot Apply. Protokolliert eine Warnung, wenn ein Neustart nötig ist — du kümmerst dich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.           |
| **`off`**              | Deaktiviert die Dateibeobachtung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot Apply übernommen wird und was einen Neustart braucht

Die meisten Felder werden ohne Downtime per Hot Apply übernommen. Im Modus `hybrid` werden Änderungen mit Neustartbedarf automatisch behandelt.

| Kategorie            | Felder                                                            | Neustart nötig? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanäle             | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein            |
| Agent & Modelle    | `agent`, `agents`, `models`, `routing`                            | Nein            |
| Automatisierung    | `hooks`, `cron`, `agent.heartbeat`                                | Nein            |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein            |
| Tools & Medien     | `tools`, `browser`, `skills`, `audio`, `talk`                     | Nein            |
| UI & Sonstiges     | `ui`, `logging`, `identity`, `bindings`                           | Nein            |
| Gateway-Server     | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Ja**          |
| Infrastruktur      | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — ihre Änderung löst **keinen** Neustart aus.
</Note>

## Config RPC (programmatische Updates)

<Note>
Control-Plane-Schreib-RPCs (`config.apply`, `config.patch`, `update.run`) sind auf **3 Anfragen pro 60 Sekunden** pro `deviceId+clientIp` rate-limitiert. Bei Limitierung gibt die RPC `UNAVAILABLE` mit `retryAfterMs` zurück.
</Note>

Sicherer/standardmäßiger Ablauf:

- `config.schema.lookup`: einen pfadbezogenen Teilbaum der Konfiguration mit einem flachen
  Schemaknoten, passenden Hinweis-Metadaten und Zusammenfassungen der unmittelbaren Kindknoten prüfen
- `config.get`: den aktuellen Snapshot + Hash abrufen
- `config.patch`: bevorzugter Pfad für partielle Updates
- `config.apply`: nur für vollständigen Austausch der Konfiguration
- `update.run`: explizites Self-Update + Neustart

Wenn du nicht die gesamte Konfiguration ersetzt, verwende bevorzugt `config.schema.lookup`
und dann `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (vollständiger Austausch)">
    Validiert + schreibt die vollständige Konfiguration und startet das Gateway in einem Schritt neu.

    <Warning>
    `config.apply` ersetzt die **gesamte Konfiguration**. Verwende `config.patch` für partielle Updates oder `openclaw config set` für einzelne Schlüssel.
    </Warning>

    Parameter:

    - `raw` (string) — JSON5-Payload für die gesamte Konfiguration
    - `baseHash` (optional) — Konfigurations-Hash aus `config.get` (erforderlich, wenn Konfiguration existiert)
    - `sessionKey` (optional) — Sitzungsschlüssel für den Wake-up-Ping nach dem Neustart
    - `note` (optional) — Hinweis für das Neustart-Sentinel
    - `restartDelayMs` (optional) — Verzögerung vor dem Neustart (Standard 2000)

    Neustartanforderungen werden zusammengefasst, solange bereits eine aussteht/in Bearbeitung ist, und zwischen Neustartzyklen gilt eine Abklingzeit von 30 Sekunden.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash erfassen
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (partielles Update)">
    Führt ein partielles Update mit der vorhandenen Konfiguration zusammen (JSON-Merge-Patch-Semantik):

    - Objekte werden rekursiv zusammengeführt
    - `null` löscht einen Schlüssel
    - Arrays werden ersetzt

    Parameter:

    - `raw` (string) — JSON5 nur mit den zu ändernden Schlüsseln
    - `baseHash` (erforderlich) — Konfigurations-Hash aus `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — wie bei `config.apply`

    Das Neustartverhalten entspricht `config.apply`: Zusammenfassung ausstehender Neustarts plus eine Abklingzeit von 30 Sekunden zwischen Neustartzyklen.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess plus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Du kannst auch Inline-Umgebungsvariablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Env-Import (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw deine Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env-Variablen-Äquivalent: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Verweise in jedem Stringwert der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Namen in Großbuchstaben werden abgeglichen: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen werfen beim Laden einen Fehler
- Mit `$${VAR}` für wörtliche Ausgabe escapen
- Funktioniert innerhalb von `$include`-Dateien
- Inline-Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef-Referenzen (env, file, exec)">
  Für Felder, die SecretRef-Objekte unterstützen, kannst du Folgendes verwenden:

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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) findest du unter [Secrets Management](/de/gateway/secrets).
Unterstützte Anmeldedatenpfade sind unter [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Environment](/de/help/environment) für die vollständige Priorität und die Quellen.

## Vollständige Referenz

Die vollständige Referenz für alle Felder findest du unter **[Configuration Reference](/de/gateway/configuration-reference)**.

---

_Verwandt: [Configuration Examples](/de/gateway/configuration-examples) · [Configuration Reference](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_
