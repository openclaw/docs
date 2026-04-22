---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-22T04:22:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguration

OpenClaw liest optional eine <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI abstimmen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

<Tip>
**Neu bei der Konfiguration?** Starten Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich die Anleitung [Configuration Examples](/de/gateway/configuration-examples) für vollständige Copy-and-paste-Konfigurationen an.
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Dokumentationsmetadaten `title` / `description` sowie Plugin- und Kanalschemata, sofern verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um einen schemagebundenen einzelnen Pfadknoten plus Zusammenfassungen der unmittelbaren Kinder abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig mit dem Schema übereinstimmen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

Hinweise zu Schema-Tools:

- `openclaw config schema` gibt dieselbe JSON-Schema-Familie aus, die von der Control UI und der Konfigurationsvalidierung verwendet wird.
- Behandeln Sie diese Schema-Ausgabe als den kanonischen maschinenlesbaren Vertrag für `openclaw.json`; diese Übersicht und die Konfigurationsreferenz fassen ihn zusammen.
- Die Feldwerte `title` und `description` werden für Editor- und Formular-Tools in die Schema-Ausgabe übernommen.
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Item- (`[]`) Einträge übernehmen dieselben Dokumentationsmetadaten, sofern passende Felddokumentation vorhanden ist.
- Auch Zusammensetzungszweige `anyOf` / `oneOf` / `allOf` übernehmen dieselben Dokumentationsmetadaten, sodass Varianten von Vereinigungen/Schnittmengen dieselbe Feldhilfe beibehalten.
- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gemeinsame Grenzen und ähnliche Validierungsfelder), passenden UI-Hinweismetadaten und Zusammenfassungen der unmittelbaren Kinder für Drill-down-Tools zurück.
- Laufzeit-Plugin-/Kanalschemata werden zusammengeführt, wenn das Gateway die aktuelle Manifest-Registry laden kann.
- `pnpm config:docs:check` erkennt Abweichungen zwischen den dokumentationsbezogenen Baseline-Artefakten und der aktuellen Schemaoberfläche.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach einem erfolgreichen Start außerdem eine vertrauenswürdige letzte funktionierende Kopie. Wenn
`openclaw.json` später außerhalb von OpenClaw geändert wird und nicht mehr gültig ist, bewahren Start
und Hot Reload die fehlerhafte Datei als zeitgestempelten Snapshot `.clobbered.*` auf,
stellen die letzte funktionierende Kopie wieder her und protokollieren eine deutliche Warnung mit dem Grund der Wiederherstellung.
Der nächste Main-Agent-Turn erhält außerdem eine Systemereignis-Warnung, die mitteilt, dass die
Konfiguration wiederhergestellt wurde und nicht blind überschrieben werden darf. Die Heraufstufung zur letzten funktionierenden
Version wird nach validiertem Start und nach akzeptierten Hot Reloads aktualisiert, einschließlich
von OpenClaw-eigenen Konfigurationsschreibvorgängen, deren persistierter Datei-Hash weiterhin mit dem akzeptierten
Schreibvorgang übereinstimmt. Die Heraufstufung wird übersprungen, wenn der Kandidat redigierte Secret-
Platzhalter wie `***` oder verkürzte Token-Werte enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat einen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Siehe die dedizierte Kanalseite für Einrichtungsschritte:

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
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Token bei screenshotlastigen Läufen.
    - Siehe [Models CLI](/de/concepts/models) für das Wechseln von Modellen im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbstgehostete Provider siehe [Custom providers](/de/gateway/configuration-reference#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#dm-and-group-access) für kanalbezogene Details.

  </Accordion>

  <Accordion title="Erwähnungs-Gating für Gruppenchats einrichten">
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tap-to-Mention, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - Siehe [vollständige Referenz](/de/gateway/configuration-reference#group-chat-mention-gating) für kanalbezogene Overrides und den Self-Chat-Modus.

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
          { id: "writer" }, // erbt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig uneingeschränkt sind.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und
      die [Configuration Reference](/de/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung der Gateway-Kanalgesundheit abstimmen">
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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch die Gesundheitsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne die globale Überwachung zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für das operative Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Resets konfigurieren">
    Sitzungen steuern die Kontinuität und Isolation von Konversationen:

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
    - Siehe [Session Management](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinien.
    - Siehe die [vollständige Referenz](/de/gateway/configuration-reference#session) für alle Felder.

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

    Erstellen Sie zuerst das Image: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/de/gateway/configuration-reference#agentsdefaultssandbox) für alle Optionen.

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
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet wurde, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreicht.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` im Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operatorsitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay unter Verwendung von App Attest plus App-Receipt und veröffentlicht dann die Relay-gestützte Nutzlast `push.apns.register` an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein nur für Loopback verfügbarer Entwicklungs-Notausgang; persistieren Sie keine HTTP-Relay-URLs in der Konfiguration.

    Siehe [iOS App](/de/platforms/ios#relay-backed-push-for-official-builds) für den End-to-End-Ablauf und [Authentication and trust flow](/de/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

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
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: abgeschlossene isolierte Laufsitzungen aus `sessions.json` entfernen (Standard `24h`; setzen Sie `false`, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Siehe [Cron jobs](/de/automation/cron-jobs) für die Funktionsübersicht und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks (Hooks) einrichten">
    Aktivieren Sie HTTP-Webhook-Endpunkte im Gateway:

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
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie nicht das gemeinsam genutzte Gateway-Token erneut.
    - Die Hook-Authentifizierung erfolgt nur per Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Token werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; behalten Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel zu begrenzen.
    - Für Hook-gesteuerte Agenten bevorzugen Sie starke moderne Modell-Tiers und strikte Tool-Richtlinien (zum Beispiel nur Messaging plus wenn möglich Sandboxing).

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agenten mit separaten Workspaces und Sitzungen aus:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und die [vollständige Referenz](/de/gateway/configuration-reference#multi-agent-routing) für Bindungsregeln und agentenspezifische Zugriffsprofile.

  </Accordion>

  <Accordion title="Konfiguration in mehrere Dateien aufteilen ($include)">
    Verwenden Sie `$include`, um große Konfigurationen zu strukturieren:

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
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (spätere gewinnt)
    - **Nachbarschlüssel**: werden nach Includes zusammengeführt (überschreiben inkludierte Werte)
    - **Verschachtelte Includes**: werden bis zu einer Tiefe von 10 Ebenen unterstützt
    - **Relative Pfade**: werden relativ zur inkludierenden Datei aufgelöst
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und übernimmt Änderungen automatisch — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen werden als nicht vertrauenswürdig behandelt, bis sie validiert sind. Der Watcher wartet,
bis sich temporäre Schreib-/Umbenennungs-Vorgänge des Editors beruhigt haben, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, indem die letzte funktionierende Konfiguration wiederhergestellt wird. OpenClaw-eigene
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dieselbe Schemavalidierung; destruktive Überschreibungen wie
das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt
und zur Inspektion als `.rejected.*` gespeichert.

Wenn Sie `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` in den Logs sehen, prüfen Sie die passende
Datei `.clobbered.*` neben `openclaw.json`, beheben Sie die abgelehnte Nutzlast und führen Sie dann
`openclaw config validate` aus. Siehe [Gateway troubleshooting](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot Reload an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot Reload an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie kümmern sich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.            |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot Reload angewendet wird und was einen Neustart erfordert

Die meisten Felder werden ohne Ausfallzeit per Hot Reload angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch verarbeitet.

| Kategorie             | Felder                                                            | Neustart nötig? |
| --------------------- | ----------------------------------------------------------------- | --------------- |
| Kanäle                | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein          |
| Agent & Modelle       | `agent`, `agents`, `models`, `routing`                            | Nein            |
| Automatisierung       | `hooks`, `cron`, `agent.heartbeat`                                | Nein            |
| Sitzungen & Nachrichten | `session`, `messages`                                           | Nein            |
| Tools & Medien        | `tools`, `browser`, `skills`, `audio`, `talk`                     | Nein            |
| UI & Sonstiges        | `ui`, `logging`, `identity`, `bindings`                           | Nein            |
| Gateway-Server        | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)              | **Ja**          |
| Infrastruktur         | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — ihre Änderung löst **keinen** Neustart aus.
</Note>

## Config RPC (programmatische Updates)

<Note>
Control-Plane-Schreib-RPCs (`config.apply`, `config.patch`, `update.run`) sind auf **3 Requests pro 60 Sekunden** pro `deviceId+clientIp` begrenzt. Bei Begrenzung gibt das RPC `UNAVAILABLE` mit `retryAfterMs` zurück.
</Note>

Sicherer/Standard-Ablauf:

- `config.schema.lookup`: einen pfadgebundenen Teilbaum der Konfiguration mit einem flachen
  Schemaknoten, passenden Hinweismetadaten und Zusammenfassungen der unmittelbaren Kinder prüfen
- `config.get`: den aktuellen Snapshot + Hash abrufen
- `config.patch`: bevorzugter Pfad für partielle Updates
- `config.apply`: nur vollständiger Ersatz der gesamten Konfiguration
- `update.run`: explizites Self-Update + Neustart

Wenn Sie nicht die gesamte Konfiguration ersetzen, bevorzugen Sie `config.schema.lookup`
und dann `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (vollständiges Ersetzen)">
    Validiert + schreibt die vollständige Konfiguration und startet das Gateway in einem Schritt neu.

    <Warning>
    `config.apply` ersetzt die **gesamte Konfiguration**. Verwenden Sie `config.patch` für partielle Updates oder `openclaw config set` für einzelne Schlüssel.
    </Warning>

    Parameter:

    - `raw` (String) — JSON5-Nutzlast für die gesamte Konfiguration
    - `baseHash` (optional) — Konfigurations-Hash aus `config.get` (erforderlich, wenn eine Konfiguration existiert)
    - `sessionKey` (optional) — Sitzungsschlüssel für den Wake-up-Ping nach dem Neustart
    - `note` (optional) — Notiz für den Neustart-Sentinel
    - `restartDelayMs` (optional) — Verzögerung vor dem Neustart (Standard 2000)

    Neustartanforderungen werden zusammengefasst, während bereits eine aussteht oder in Bearbeitung ist, und zwischen Neustartzyklen gilt eine Abkühlzeit von 30 Sekunden.

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
    Führt ein partielles Update in die bestehende Konfiguration zusammen (Semantik wie JSON Merge Patch):

    - Objekte werden rekursiv zusammengeführt
    - `null` löscht einen Schlüssel
    - Arrays werden ersetzt

    Parameter:

    - `raw` (String) — JSON5 nur mit den zu ändernden Schlüsseln
    - `baseHash` (erforderlich) — Konfigurations-Hash aus `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — wie bei `config.apply`

    Das Neustartverhalten entspricht `config.apply`: zusammengefasste ausstehende Neustarts plus eine Abkühlzeit von 30 Sekunden zwischen Neustartzyklen.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

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

Äquivalent als Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Verweisen Sie in jedem Stringwert der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur Großbuchstabennamen abgeglichen: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen verursachen beim Laden einen Fehler
- Mit `$${VAR}` escapen, um eine wörtliche Ausgabe zu erhalten
- Funktioniert auch innerhalb von `$include`-Dateien
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
Unterstützte Anmeldedatenpfade sind unter [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Environment](/de/help/environment) für vollständige Priorität und Quellen.

## Vollständige Referenz

Für die vollständige Referenz Feld für Feld siehe **[Configuration Reference](/de/gateway/configuration-reference)**.

---

_Verwandt: [Configuration Examples](/de/gateway/configuration-examples) · [Configuration Reference](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_
