---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-05-03T21:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Per Symlink eingebundene `openclaw.json`-Layouts werden für Schreibvorgänge, die OpenClaw besitzt, nicht unterstützt; ein atomarer Schreibvorgang kann den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des standardmäßigen Zustandsverzeichnisses speichern, richten Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Channels verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sessions, Medien, Netzwerk oder UI abstimmen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

Agents und Automatisierung sollten `config.schema.lookup` für genaue Dokumentation auf Feldebene verwenden, bevor sie die Konfiguration bearbeiten. Verwenden Sie diese Seite für aufgabenorientierte Anleitung und die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige Copy-and-paste-Konfigurationen an.
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
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Tab **Konfiguration**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Feld-Dokumentationsmetadaten `title` / `description` sowie Plugin- und Channel-Schemas, wenn verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um einen Schema-Knoten für einen bestimmten Pfad plus Zusammenfassungen der unmittelbaren untergeordneten Elemente abzurufen.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON Schema aus, das von der Control UI und der Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus Zusammenfassungen untergeordneter Elemente für Drill-down-Tools ab. Die Feld-Dokumentationsmetadaten `title`/`description` werden durch verschachtelte Objekte, Wildcard-(`*`), Array-Item-(`[]`) sowie `anyOf`/`oneOf`/`allOf`-Zweige weitergereicht. Laufzeit-Schemas von Plugins und Channels werden zusammengeführt, wenn die Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach jedem erfolgreichen Start eine vertrauenswürdige Last-known-good-Kopie, aber Start und Hot Reload stellen sie nicht automatisch wieder her. Wenn `openclaw.json` die Validierung nicht besteht (einschließlich Plugin-lokaler Validierung), schlägt der Gateway-Start fehl oder das Neuladen wird übersprungen und die aktuelle Laufzeit behält die zuletzt akzeptierte Konfiguration. Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um präfixierte/überschriebene Konfigurationen zu reparieren oder die Last-known-good-Kopie wiederherzustellen. Die Übernahme als Last-known-good wird übersprungen, wenn ein Kandidat redigierte Secret-Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Channel einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Channel hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Die Schritte zur Einrichtung finden Sie auf der jeweiligen Channel-Seite:

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

    Alle Channels verwenden dasselbe Muster für DM-Richtlinien:

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

    - `agents.defaults.models` definiert den Modellkatalog und dient als Allowlist für `/model`.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Reine Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Verkleinerung von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren bei screenshot-lastigen Läufen in der Regel die Vision-Token-Nutzung.
    - Siehe [Modelle-CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Modell-Failover](/de/concepts/model-failover) zu Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    DM-Zugriff wird pro Channel über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Freigabe
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Speicher)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Verwenden Sie für Gruppen `groupPolicy` + `groupAllowFrom` oder Channel-spezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/config-channels#dm-and-group-access) für Details pro Channel.

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Für Gruppennachrichten ist standardmäßig **Erwähnung erforderlich**. Konfigurieren Sie Trigger-Muster pro Agent und belassen Sie sichtbare Raumantworten auf dem standardmäßigen Message-Tool-Pfad, sofern Sie nicht ausdrücklich ältere automatische finale Antworten wünschen:

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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tap-to-mention, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Message-Tool-Sends global verlangen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Channels.
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für sichtbare Antwortmodi, Overrides pro Channel und Selbstchat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann bestimmte Agents mit `agents.list[].skills`:

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

    - Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig nicht einzuschränken.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch die Gesundheitsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Channel oder Account zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Gesundheitsprüfungen](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Gateway-WebSocket-Handshake-Timeout abstimmen">
    Geben Sie lokalen Clients mehr Zeit, den Pre-auth-WebSocket-Handshake auf ausgelasteten oder leistungsschwachen Hosts abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standard ist `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat weiterhin Vorrang für einmalige Service- oder Shell-Overrides.
    - Beheben Sie Start-/Event-Loop-Blockaden vorzugsweise zuerst; dieser Regler ist für Hosts gedacht, die gesund, aber während des Warmups langsam sind.

  </Accordion>

  <Accordion title="Sessions und Zurücksetzungen konfigurieren">
    Sessions steuern Gesprächskontinuität und Isolation:

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
    - `threadBindings`: globale Standardwerte für Thread-gebundenes Session-Routing (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Session-Verwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinie.
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

    Erstellen Sie zuerst das Image — führen Sie aus einem Source-Checkout `scripts/sandbox-setup.sh` aus, oder sehen Sie bei einer npm-Installation den inline angegebenen Befehl `docker build` unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützte Push-Benachrichtigungen für offizielle iOS-Builds aktivieren">
    Relay-gestützte Push-Benachrichtigungen werden in `openclaw.json` konfiguriert.

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
    - Verwendet eine registrierungsgebundene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direkten APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendeverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen eine Verbindung herstellen.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mithilfe von App Attest plus App-Beleg und veröffentlicht dann die Relay-gestützte `push.apns.register`-Payload an das gekoppelte Gateway.
    5. Das Gateway speichert das Relay-Handle und die Sendeberechtigung und verwendet sie anschließend für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App zu einem anderen Gateway wechseln, verbinden Sie die App erneut, damit sie eine neue Relay-Registrierung veröffentlichen kann, die an dieses Gateway gebunden ist.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein nur für local loopback vorgesehener Entwicklungs-Ausweg; speichern Sie HTTP-Relay-URLs nicht dauerhaft in der Konfiguration.

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
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` bereinigen (Standard `24h`; setzen Sie `false`, um dies zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für die Funktionsübersicht und CLI-Beispiele.

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
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie das gemeinsame Gateway-Token nicht erneut.
    - Hook-Authentifizierung erfolgt nur über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Tokens werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie Webhook-Ingress auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zum Umgehen unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel zu begrenzen.
    - Verwenden Sie für Hook-gesteuerte Agents bevorzugt starke moderne Modellstufen und eine strenge Tool-Richtlinie (zum Beispiel nur Messaging plus Sandboxing, wo möglich).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agents mit separaten Arbeitsbereichen und Sitzungen aus:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Bindungsregeln und zugriffsprofile pro Agent.

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

    - **Einzelne Datei**: ersetzt das umschließende Objekt
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (spätere Werte gewinnen)
    - **Geschwisterschlüssel**: werden nach Includes zusammengeführt (überschreiben eingeschlossene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur einschließenden Datei aufgelöst
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert, der durch ein Single-File-Include wie `plugins: { $include: "./plugins.json5" }` gestützt wird, aktualisiert OpenClaw diese eingeschlossene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes mit Geschwister-Overrides schlagen für OpenClaw-eigene Schreibvorgänge geschlossen fehl, statt die Konfiguration zu verflachen
    - **Eingrenzung**: `$include`-Pfade müssen unterhalb des Verzeichnisses aufgelöst werden, das `openclaw.json` enthält. Um einen Baum über Maschinen oder Benutzer hinweg zu teilen, setzen Sie `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` auf POSIX, `;` unter Windows) zusätzlicher Verzeichnisse, auf die Includes verweisen dürfen. Symlinks werden aufgelöst und erneut geprüft, sodass ein Pfad, der lexikalisch in einem Konfigurationsverzeichnis liegt, dessen reales Ziel aber jede erlaubte Root verlässt, weiterhin abgelehnt wird.
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Config-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen werden als nicht vertrauenswürdig behandelt, bis sie validiert wurden. Der Watcher wartet, bis temporäre Schreib-/Umbenennungsaktivität des Editors abgeklungen ist, liest die endgültige Datei und lehnt ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurationsschreibvorgänge verwenden vor dem Schreiben denselben Schema-Gate; destruktive Überschreibungen wie das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt und zur Prüfung als `.rejected.*` gespeichert.

Wenn Sie `config reload skipped (invalid config)` sehen oder der Start `Invalid config` meldet, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` aus und führen Sie anschließend zur Reparatur `openclaw doctor --fix` aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config) für die Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Reload an. Startet bei kritischen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Reload an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie kümmern sich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, ob sicher oder nicht.         |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Reload angewendet wird und was einen Neustart benötigt

Die meisten Felder werden ohne Ausfallzeit per Hot-Reload angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch verarbeitet.

| Kategorie           | Felder                                                            | Neustart erforderlich? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein            |
| Agent & Modelle     | `agent`, `agents`, `models`, `routing`                            | Nein            |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                | Nein            |
| Sitzungen & Nachrichten | `session`, `messages`                                             | Nein            |
| Tools & Medien      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Nein            |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                           | Nein            |
| Gateway-Server      | `gateway.*` (Port, Bind, Auth, tailscale, TLS, HTTP)              | **Ja**          |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — Änderungen daran lösen **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, die über `$include` referenziert wird, plant OpenClaw
das Neuladen aus dem Layout der Quellautorschaft, nicht aus der abgeflachten In-Memory-Ansicht.
Dadurch bleiben Entscheidungen zum Hot-Reload (Hot-Apply gegenüber Neustart) vorhersehbar, auch wenn ein
einzelner Abschnitt auf oberster Ebene in einer eigenen eingebundenen Datei liegt, wie etwa
`plugins: { $include: "./plugins.json5" }`. Die Planung des Neuladens schlägt geschlossen fehl, wenn das
Quelllayout mehrdeutig ist.

## Konfigurations-RPC (programmatische Aktualisierungen)

Für Tools, die Konfiguration über die Gateway-API schreiben, verwenden Sie bevorzugt diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schemaknoten + untergeordnete
  Zusammenfassungen)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für Teilaktualisierungen (JSON-Merge-Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für explizite Selbstaktualisierung plus Neustart; fügen Sie `continuationMessage` ein, wenn die Sitzung nach dem Neustart einen Folge-Turn ausführen soll
- `update.status`, um den neuesten Update-Neustart-Sentinel zu prüfen und die laufende Version nach einem Neustart zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für genaue
Dokumentation und Einschränkungen auf Feldebene behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu dedizierten
Subsystemreferenzen benötigen.

<Note>
Control-Plane-Schreibvorgänge (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt. Neustartanforderungen
werden zusammengeführt und erzwingen anschließend eine Abkühlzeit von 30 Sekunden zwischen Neustartzyklen.
`update.status` ist schreibgeschützt, aber auf Admins beschränkt, da der Neustart-Sentinel
Zusammenfassungen von Aktualisierungsschritten und Enden von Befehlsausgaben enthalten kann.
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

<Accordion title="Shell-Umgebungsimport (optional)">
  Wenn dies aktiviert ist und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Umgebungsvariablen-Ersetzung in Konfigurationswerten">
  Referenzieren Sie Umgebungsvariablen in beliebigen Zeichenfolgenwerten der Konfiguration mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Großbuchstabennamen werden erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` für literale Ausgabe maskieren
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets-Verwaltung](/de/gateway/secrets).
Unterstützte Anmeldeinformationspfade sind in [SecretRef-Anmeldeinformationsoberfläche](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Die vollständige Rangfolge und Quellen finden Sie unter [Umgebung](/de/help/environment).

## Vollständige Referenz

Die vollständige Feld-für-Feld-Referenz finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
