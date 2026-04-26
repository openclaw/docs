---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach häufigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-26T11:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw liest optional eine <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Layouts mit
symlink-verknüpfter `openclaw.json` werden für von OpenClaw verwaltete Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink zu erhalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Zustandsverzeichnisses aufbewahren, zeigen Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung (Cron, Hooks) festlegen
- Sitzungen, Medien, Netzwerk oder UI anpassen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

Agenten und Automatisierungen sollten `config.schema.lookup` für eine genaue
feldbezogene Dokumentation verwenden, bevor sie die Konfiguration bearbeiten. Verwenden Sie diese Seite für aufgabenorientierte Hinweise und die
[Konfigurationsreferenz](/de/gateway/configuration-reference) für die breitere
Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung, oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige Copy-and-Paste-Konfigurationen an.
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Metadaten
    `title` / `description` für die Felddokumentation sowie Plugin- und Kanalschemata, sofern
    verfügbar, mit einem Editor **Raw JSON** als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten plus Zusammenfassungen der unmittelbaren Kinder abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (string), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von Control UI
und der Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen der Kindknoten für Drill-down-Tools ab. Die Metadaten `title`/`description` für die Felddokumentation
werden in verschachtelten Objekten, Wildcard- (`*`), Array-Item- (`[]`) und `anyOf`/
`oneOf`/`allOf`-Zweigen weitergeführt. Laufzeit-Plugin- und Kanalschemata werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach jedem erfolgreichen Start eine vertrauenswürdige zuletzt funktionierende Kopie.
Wenn `openclaw.json` später die Validierung nicht besteht (oder `gateway.mode` entfernt, stark
schrumpft oder eine fremde Logzeile vorangestellt bekommt), bewahrt OpenClaw die defekte Datei
als `.clobbered.*` auf, stellt die zuletzt funktionierende Kopie wieder her und protokolliert den Grund der Wiederherstellung.
Der nächste Agent-Turn erhält außerdem eine Systemereigniswarnung, damit der Hauptagent die wiederhergestellte Konfiguration nicht blind neu überschreibt. Die Übernahme als zuletzt funktionierende Kopie
wird übersprungen, wenn ein Kandidat redigierte Secret-Platzhalter wie `***` enthält.
Wenn alle Validierungsprobleme auf `plugins.entries.<id>...` begrenzt sind, führt OpenClaw
keine Wiederherstellung der gesamten Datei durch. Die aktuelle Konfiguration bleibt aktiv und
der pluginlokale Fehler wird angezeigt, damit ein Plugin-Schema- oder Hostversionskonflikt
keine nicht zusammenhängenden Benutzereinstellungen zurücksetzt.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Setup-Schritte finden Sie auf der jeweiligen Kanalseite:

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

    Alle Kanäle verwenden dasselbe DM-Richtlinienmuster:

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
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne bestehende Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modell-Refs verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Verkleinerung von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren bei screenshotlastigen Läufen in der Regel den Verbrauch von Vision-Tokens.
    - Siehe [Models CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbstgehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/config-channels#dm-and-group-access) für details pro Kanal.

  </Accordion>

  <Accordion title="Steuerung über Erwähnungen im Gruppenchat einrichten">
    Gruppennachrichten erfordern standardmäßig **eine Erwähnung**. Konfigurieren Sie Muster pro Agent:

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

    - **Metadaten-Erwähnungen**: native @Erwähnungen (WhatsApp-Tap-to-Mention, Telegram-@bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für Überschreibungen pro Kanal und den Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basislinie und überschreiben Sie dann bestimmte
    Agenten mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // erbt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, wenn Skills standardmäßig uneingeschränkt sein sollen.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zu haben.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Gateway-Zustandsüberwachung für Kanäle anpassen">
    Steuern Sie, wie aggressiv das Gateway Kanäle neu startet, die veraltet erscheinen:

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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch die Zustandsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne die globale Überwachung zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Zurücksetzungen konfigurieren">
    Sitzungen steuern Kontinuität und Isolation von Unterhaltungen:

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

    - `dmScope`: `main` (gemeinsam) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für threadgebundenes Sitzungsrouting (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Sende-Richtlinien.
    - Siehe [vollständige Referenz](/de/gateway/config-agents#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agentensitzungen in isolierten Sandbox-Laufzeitumgebungen aus:

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

    Bauen Sie zuerst das Image: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützten Push für offizielle iOS-Builds aktivieren">
    Relay-gestützter Push wird in `openclaw.json` konfiguriert.

    Setzen Sie dies in der Gateway-Konfiguration:

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

    Was dies bewirkt:

    - Ermöglicht dem Gateway, `push.test`, Wake-Nudges und Reconnect-Wakes über das externe Relay zu senden.
    - Verwendet eine registrierungsgebundene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet wurde, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operatorsitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mit dem Relay unter Verwendung von App Attest plus dem App-Receipt und veröffentlicht dann die relay-gestützte Payload `push.apns.register` an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung zeigt, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Umgebungsvariablen-Überschreibungen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für local loopback gedachte Entwicklungs-Ausweichmöglichkeit; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

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

    - `every`: Dauerzeichenfolge (`30m`, `2h`). Setzen Sie `0m`, um dies zu deaktivieren.
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

    - `sessionRetention`: abgeschlossene isolierte Laufsitzungen aus `sessions.json` entfernen (Standard `24h`; setzen Sie `false`, um dies zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für die Funktionsübersicht und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks (Hooks) einrichten">
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
    - Behandeln Sie alle Payload-Inhalte von Hook/Webhook als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie das gemeinsame Gateway-Token nicht wieder.
    - Hook-Authentifizierung ist nur per Header möglich (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Query-Strings werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer gewählte Sitzungsschlüssel zu begrenzen.
    - Für Hook-gesteuerte Agenten sollten Sie starke moderne Modell-Tiers und eine strikte Tool-Richtlinie bevorzugen (zum Beispiel nur Messaging plus nach Möglichkeit Sandboxing).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Bindungsregeln und Zugriffsprofile pro Agent.

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
    - **Datei-Array**: wird in Reihenfolge per Deep-Merge zusammengeführt (spätere gewinnt)
    - **Benachbarte Schlüssel**: werden nach Includes zusammengeführt (überschreiben inkludierte Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur inkludierenden Datei aufgelöst
    - **Von OpenClaw verwaltete Schreibvorgänge**: wenn ein Schreibvorgang nur einen Root-Abschnitt ändert,
      der durch ein Single-File-Include gestützt wird wie `plugins: { $include: "./plugins.json5" }`,
      aktualisiert OpenClaw diese inkludierte Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes
      mit benachbarten Überschreibungen schlagen für von OpenClaw verwaltete Schreibvorgänge kontrolliert fehl, statt
      die Konfiguration abzuflachen
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Konfigurations-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und übernimmt Änderungen automatisch — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen gelten als nicht vertrauenswürdig, bis sie validiert sind. Der Watcher wartet,
bis temporäre Schreib-/Umbenennungsvorgänge des Editors abgeschlossen sind, liest die endgültige Datei und lehnt
ungültige externe Bearbeitungen ab, indem die zuletzt funktionierende Konfiguration wiederhergestellt wird. Von OpenClaw verwaltete
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dieselbe Schema-Prüfung; destruktive Beschädigungen wie
das Entfernen von `gateway.mode` oder das Schrumpfen der Datei um mehr als die Hälfte werden abgelehnt
und als `.rejected.*` zur Inspektion gespeichert.

Plugin-lokale Validierungsfehler sind die Ausnahme: Wenn alle Probleme unter
`plugins.entries.<id>...` liegen, behält das Neuladen die aktuelle Konfiguration bei und meldet das Plugin-
Problem, statt `.last-good` wiederherzustellen.

Wenn Sie in den Logs `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` sehen, prüfen Sie die passende
Datei `.clobbered.*` neben `openclaw.json`, beheben Sie die abgelehnte Payload und führen Sie dann
`openclaw config validate` aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Mode                   | Verhalten                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Übernimmt sichere Änderungen sofort per Hot-Reload. Startet bei kritischen automatisch neu. |
| **`hot`**              | Übernimmt nur sichere Änderungen per Hot-Reload. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie übernehmen ihn. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.           |
| **`off`**              | Deaktiviert die Dateibeobachtung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Reload übernommen wird und was einen Neustart braucht

Die meisten Felder werden ohne Downtime per Hot-Reload übernommen. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch verarbeitet.

| Kategorie           | Felder                                                            | Neustart erforderlich? |
| ------------------- | ----------------------------------------------------------------- | ---------------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein                |
| Agent & Modelle     | `agent`, `agents`, `models`, `routing`                            | Nein                   |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                | Nein                   |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein                   |
| Tools & Medien      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nein                   |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                           | Nein                   |
| Gateway-Server      | `gateway.*` (Port, Bind, Auth, tailscale, TLS, HTTP)              | **Ja**                 |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — Änderungen daran lösen **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, auf die über `$include` verwiesen wird, plant OpenClaw
das Neuladen aus dem quellseitig verfassten Layout und nicht aus der abgeflachten In-Memory-Ansicht.
Dadurch bleiben Entscheidungen zum Hot-Reload (Hot-Apply vs. Neustart) vorhersehbar, selbst wenn ein
einzelner Root-Abschnitt in einer eigenen inkludierten Datei lebt, etwa
`plugins: { $include: "./plugins.json5" }`. Die Reload-Planung schlägt kontrolliert fehl, wenn das
Quelllayout mehrdeutig ist.

## Config RPC (programmatische Updates)

Für Tools, die die Konfiguration über die Gateway-API schreiben, bevorzugen Sie diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher
  Schemaknoten + Zusammenfassungen der Kindknoten)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für partielle Updates (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt)
- `config.apply` nur dann, wenn Sie beabsichtigen, die gesamte Konfiguration zu ersetzen
- `update.run` für ein explizites Self-Update plus Neustart

Agenten sollten `config.schema.lookup` als ersten Anlaufpunkt für genaue
feldbezogene Dokumentation und Einschränkungen behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn sie die breitere Konfigurationsübersicht, Standardwerte oder Links zu dedizierten
Subsystem-Referenzen benötigen.

<Note>
Control-Plane-Schreibvorgänge (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt.
Neustartanfragen werden zusammengefasst und erzwingen dann eine Abkühlphase von 30 Sekunden zwischen Neustartzyklen.
</Note>

Beispiel für einen partiellen Patch:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash erfassen
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sowohl `config.apply` als auch `config.patch` akzeptieren `raw`, `baseHash`, `sessionKey`,
`note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, wenn bereits
eine Konfiguration existiert.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem Elternprozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Sie können auch Inline-Umgebungsvariablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Umgebungsimport (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Äquivalent als Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitution von Umgebungsvariablen in Konfigurationswerten">
  Verweisen Sie in jedem String-Wert der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur großgeschriebene Namen erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` escapen Sie für literale Ausgabe
- Funktioniert auch in `$include`-Dateien
- Inline-Substitution: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Pfade für Anmeldedaten sind unter [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für die vollständige Reihenfolge und die Quellen.

## Vollständige Referenz

Für die vollständige Feld-für-Feld-Referenz siehe **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
