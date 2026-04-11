---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suchen nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsüberblick: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-11T02:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguration

OpenClaw liest optional eine <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Channels verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung (Cron, Hooks) festlegen
- Sitzungen, Medien, Netzwerk oder UI abstimmen

In der [vollständigen Referenz](/de/gateway/configuration-reference) finden Sie jedes verfügbare Feld.

<Tip>
**Neu bei der Konfiguration?** Starten Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige Konfigurationen zum Kopieren und Einfügen an.
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der
    Dokumentationsmetadaten `title` / `description` für Felder sowie Plugin- und Channel-Schemata, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen pfadbezogenen Schemaknoten plus Zusammenfassungen der unmittelbaren Kindknoten abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (string), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

Hinweise zu den Schema-Tools:

- `openclaw config schema` gibt dieselbe JSON-Schema-Familie aus, die von der Control UI
  und der Konfigurationsvalidierung verwendet wird.
- Behandeln Sie diese Schema-Ausgabe als den kanonischen maschinenlesbaren Vertrag für
  `openclaw.json`; diese Übersicht und die Konfigurationsreferenz fassen ihn zusammen.
- Die Werte der Felder `title` und `description` werden in die Schema-Ausgabe übernommen für
  Editor- und Formular-Tools.
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Element- (`[]`) Einträge übernehmen dieselben
  Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist.
- Verzweigungen mit `anyOf` / `oneOf` / `allOf` übernehmen diese
  Dokumentationsmetadaten ebenfalls, sodass Union-/Intersection-Varianten dieselbe Feldhilfe behalten.
- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gemeinsame Grenzen
  und ähnliche Validierungsfelder), passenden UI-Hinweismetadaten und Zusammenfassungen der unmittelbaren
  Kindknoten für Drill-down-Tools zurück.
- Laufzeit-Plugin-/Channel-Schemata werden zusammengeführt, wenn das Gateway das
  aktuelle Manifest-Registry laden kann.
- `pnpm config:docs:check` erkennt Abweichungen zwischen Doku-bezogenen Konfigurations-Baseline-
  Artefakten und der aktuellen Schema-Oberfläche.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Channel einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Channel hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Auf der jeweiligen Channel-Seite finden Sie die Einrichtungsschritte:

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

    Alle Channels teilen dasselbe DM-Richtlinienmuster:

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
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung bei screenshotlastigen Durchläufen.
    - Siehe [Models CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbstgehostete Provider siehe [Custom providers](/de/gateway/configuration-reference#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Channel über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): Unbekannte Absender erhalten einen einmaligen Pairing-Code zur Freigabe
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)
    - `"open"`: alle eingehenden DMs erlauben (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder Channel-spezifische Allowlists.

    Einzelheiten pro Channel finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppen-Nachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Muster pro Agent:

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

    - **Metadata mentions**: native @-Erwähnungen (WhatsApp Tap-to-Mention, Telegram @bot usw.)
    - **Text patterns**: sichere Regex-Muster in `mentionPatterns`
    - Siehe die [vollständige Referenz](/de/gateway/configuration-reference#group-chat-mention-gating) für Channel-spezifische Overrides und den Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann bestimmte
    Agents mit `agents.list[].skills`:

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

    - Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu verwenden.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Gateway-Überwachung der Channel-Gesundheit abstimmen">
    Steuern Sie, wie aggressiv das Gateway Channels neu startet, die veraltet wirken:

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
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um Auto-Neustarts für einen einzelnen Channel oder Account zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für das operative Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Resets konfigurieren">
    Sitzungen steuern die Kontinuität und Isolierung von Unterhaltungen:

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
    - Alle Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#session).

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sitzungen in isolierten Docker-Containern aus:

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

    Bauen Sie das Image zuerst: `scripts/sandbox-setup.sh`

    Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing) und alle Optionen in der [vollständigen Referenz](/de/gateway/configuration-reference#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Relay-basierten Push für offizielle iOS-Builds aktivieren">
    Relay-basierter Push wird in `openclaw.json` konfiguriert.

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

    - Ermöglicht dem Gateway, `push.test`, Weckimpulse und Wiederverbindungs-Wecksignale über das externe Relay zu senden.
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein Relay-Token für die gesamte Bereitstellung.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Behält für lokale/manuelle iOS-Builds direktes APNs bei. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreicht.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mit App Attest plus dem App-Beleg beim Relay und veröffentlicht dann die Relay-gestützte Payload `push.apns.register` an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Weckimpulse und Wiederverbindungs-Wecksignale.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung zeigt, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für Loopback gedachte Entwicklungs-Ausweichmöglichkeit; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

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

    - `every`: Dauerzeichenfolge (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Den vollständigen Leitfaden finden Sie unter [Heartbeat](/de/gateway/heartbeat).

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

    - `sessionRetention`: abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` bereinigen (Standard `24h`; auf `false` setzen, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Einen Funktionsüberblick und CLI-Beispiele finden Sie unter [Cron jobs](/de/automation/cron-jobs).

  </Accordion>

  <Accordion title="Webhooks (Hooks) einrichten">
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
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie nicht das gemeinsame Gateway-Token erneut.
    - Hook-Authentifizierung ist nur per Header möglich (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Query-Strings werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zum Umgehen unsicherer Inhalte (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) deaktiviert, außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel zu begrenzen.
    - Für Hook-gesteuerte Agents sollten Sie starke moderne Modellstufen und eine strikte Tool-Richtlinie bevorzugen (zum Beispiel nur Messaging plus nach Möglichkeit Sandboxing).

    Alle Mapping-Optionen und die Gmail-Integration finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#hooks).

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und die [vollständige Referenz](/de/gateway/configuration-reference#multi-agent-routing) für Binding-Regeln und agent-spezifische Zugriffsprofile.

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
    - **Datei-Array**: wird in Reihenfolge tief zusammengeführt (spätere gewinnt)
    - **Benachbarte Schlüssel**: werden nach den Includes zusammengeführt (überschreiben eingeschlossene Werte)
    - **Verschachtelte Includes**: werden bis zu 10 Ebenen Tiefe unterstützt
    - **Relative Pfade**: werden relativ zur einschließenden Datei aufgelöst
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Konfigurations-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und übernimmt Änderungen automatisch — für die meisten Einstellungen ist kein manueller Neustart nötig.

### Reload-Modi

| Modus                  | Verhalten                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Apply an. Protokolliert eine Warnung, wenn ein Neustart nötig ist — Sie übernehmen das dann. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, egal ob sicher oder nicht.   |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Apply übernommen wird und was einen Neustart benötigt

Die meisten Felder werden ohne Downtime per Hot-Apply übernommen. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch behandelt.

| Kategorie             | Felder                                                               | Neustart nötig? |
| --------------------- | -------------------------------------------------------------------- | --------------- |
| Channels              | `channels.*`, `web` (WhatsApp) — alle eingebauten und Erweiterungs-Channels | Nein            |
| Agent & Modelle       | `agent`, `agents`, `models`, `routing`                               | Nein            |
| Automatisierung       | `hooks`, `cron`, `agent.heartbeat`                                   | Nein            |
| Sitzungen & Nachrichten | `session`, `messages`                                              | Nein            |
| Tools & Medien        | `tools`, `browser`, `skills`, `audio`, `talk`                        | Nein            |
| UI & Sonstiges        | `ui`, `logging`, `identity`, `bindings`                              | Nein            |
| Gateway-Server        | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Ja**          |
| Infrastruktur         | `discovery`, `canvasHost`, `plugins`                                 | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — ihre Änderung löst **keinen** Neustart aus.
</Note>

## Config RPC (programmatische Updates)

<Note>
Control-Plane-Schreib-RPCs (`config.apply`, `config.patch`, `update.run`) sind auf **3 Anfragen pro 60 Sekunden** pro `deviceId+clientIp` begrenzt. Bei Begrenzung gibt der RPC `UNAVAILABLE` mit `retryAfterMs` zurück.
</Note>

Sicherer/empfohlener Ablauf:

- `config.schema.lookup`: einen pfadbezogenen Konfigurations-Teilbaum mit einem flachen
  Schemaknoten, passenden Hinweis-Metadaten und Zusammenfassungen der unmittelbaren Kindknoten untersuchen
- `config.get`: den aktuellen Snapshot + Hash abrufen
- `config.patch`: bevorzugter Pfad für partielle Updates
- `config.apply`: nur für vollständigen Konfigurationsersatz
- `update.run`: explizites Selbst-Update + Neustart

Wenn Sie nicht die gesamte Konfiguration ersetzen, bevorzugen Sie `config.schema.lookup`
und dann `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (vollständiges Ersetzen)">
    Validiert + schreibt die vollständige Konfiguration und startet das Gateway in einem Schritt neu.

    <Warning>
    `config.apply` ersetzt die **gesamte Konfiguration**. Verwenden Sie `config.patch` für partielle Updates oder `openclaw config set` für einzelne Schlüssel.
    </Warning>

    Parameter:

    - `raw` (string) — JSON5-Payload für die gesamte Konfiguration
    - `baseHash` (optional) — Konfigurations-Hash aus `config.get` (erforderlich, wenn Konfiguration existiert)
    - `sessionKey` (optional) — Sitzungsschlüssel für den Wake-up-Ping nach dem Neustart
    - `note` (optional) — Notiz für den Neustart-Sentinel
    - `restartDelayMs` (optional) — Verzögerung vor dem Neustart (Standard 2000)

    Neustartanforderungen werden zusammengefasst, solange bereits eine ausstehende/laufende Anforderung besteht, und zwischen Neustartzyklen gilt eine Abklingzeit von 30 Sekunden.

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
    Führt ein partielles Update in die bestehende Konfiguration zusammen (JSON-Merge-Patch-Semantik):

    - Objekte werden rekursiv zusammengeführt
    - `null` löscht einen Schlüssel
    - Arrays werden ersetzt

    Parameter:

    - `raw` (string) — JSON5 nur mit den zu ändernden Schlüsseln
    - `baseHash` (erforderlich) — Konfigurations-Hash aus `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — wie bei `config.apply`

    Das Neustartverhalten entspricht `config.apply`: ausstehende Neustarts werden zusammengefasst, plus eine Abklingzeit von 30 Sekunden zwischen Neustartzyklen.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

OpenClaw liest Env-Variablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt vorhandene Env-Variablen. Sie können auch Inline-Env-Variablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Env-Import (optional)">
  Falls aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env-Variablen-Äquivalent: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env-Variablen-Substitution in Konfigurationswerten">
  Referenzieren Sie Env-Variablen in jedem Stringwert der Konfiguration mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur Großbuchstabennamen erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` escapen Sie für eine literale Ausgabe
- Funktioniert auch in `$include`-Dateien
- Inline-Substitution: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRefs (env, file, exec)">
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

Einzelheiten zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Pfade für Anmeldedaten sind unter [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Unter [Environment](/de/help/environment) finden Sie die vollständige Reihenfolge und alle Quellen.

## Vollständige Referenz

Die vollständige Referenz für alle Felder finden Sie unter **[Configuration Reference](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Configuration Reference](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_
