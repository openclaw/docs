---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-30T06:52:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-Layouts für `openclaw.json`
werden für von OpenClaw verwaltete Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Zustandsverzeichnisses speichern, setzen Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung (Cron, Hooks) festlegen
- Sitzungen, Medien, Netzwerk oder UI anpassen

Weitere Informationen zu jedem verfügbaren Feld finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Agenten und Automatisierungen sollten `config.schema.lookup` für genaue
Dokumentation auf Feldebene verwenden, bevor sie die Konfiguration bearbeiten. Nutzen Sie diese Seite für aufgabenorientierte Anleitung und
die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Feldübersicht und Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Starten Sie mit `openclaw onboard` für eine interaktive Einrichtung, oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) für vollständige kopierbare Konfigurationen an.
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der
    Dokumentationsmetadaten `title` / `description` auf Feldebene sowie Plugin- und Kanalschemas, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen pfadbezogenen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente abzurufen.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway **den Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von der Control UI
und der Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen untergeordneter Elemente für Drill-down-Tools ab. Die Dokumentationsmetadaten der Felder `title`/`description`
werden durch verschachtelte Objekte, Wildcard- (`*`), Array-Element- (`[]`) sowie `anyOf`-/
`oneOf`-/`allOf`-Zweige weitergegeben. Laufzeit-Plugin- und Kanalschemas werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach jedem erfolgreichen Start eine vertrauenswürdige Kopie des letzten funktionierenden Zustands.
Wenn `openclaw.json` später die Validierung nicht besteht (oder `gateway.mode` entfernt, stark
schrumpft oder eine vorangestellte verirrte Logzeile enthält), bewahrt OpenClaw die beschädigte Datei
als `.clobbered.*` auf, stellt die letzte funktionierende Kopie wieder her und protokolliert den Wiederherstellungsgrund.
Der nächste Agenten-Turn erhält außerdem eine Systemereigniswarnung, damit der Haupt-
Agent die wiederhergestellte Konfiguration nicht blind überschreibt. Die Hochstufung zur letzten funktionierenden Kopie
wird übersprungen, wenn ein Kandidat geschwärzte Secret-Platzhalter wie `***` enthält.
Wenn jedes Validierungsproblem auf `plugins.entries.<id>...` begrenzt ist, führt OpenClaw
keine Wiederherstellung der gesamten Datei durch. Die aktuelle Konfiguration bleibt aktiv und
der Plugin-lokale Fehler wird angezeigt, damit ein Plugin-Schema- oder Host-Versionskonflikt
keine unabhängigen Benutzereinstellungen zurücksetzen kann.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Die Einrichtungsschritte finden Sie auf der dedizierten Kanalseite:

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
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Transkript-/Tool-Bildern (Standard `1200`); niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Tokens bei Screenshot-lastigen Läufen.
    - Siehe [Modelle-CLI](/de/concepts/models) zum Wechseln von Modellen im Chat und [Modell-Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): Unbekannte Absender erhalten einen einmaligen Pairing-Code zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gekoppelten Allow-Speicher)
    - `"open"`: alle eingehenden DMs erlauben (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Details pro Kanal finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Trigger-Muster pro Agent und belassen Sie sichtbare Raumantworten auf dem standardmäßigen Nachrichten-Tool-Pfad, sofern Sie nicht bewusst ältere automatische Abschlussantworten verwenden möchten:

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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp-Tippen-zum-Erwähnen, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Nachrichten-Tool-Sendungen global verlangen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Siehe [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für sichtbare Antwortmodi, Überschreibungen pro Kanal und Self-Chat-Modus.

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

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig nicht eingeschränkt sind.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Zustandsüberwachung der Gateway-Kanäle anpassen">
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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch die Zustandsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Zustandsprüfungen](/de/gateway/health) für betriebliches Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="WebSocket-Handshake-Timeout des Gateways anpassen">
    Geben Sie lokalen Clients mehr Zeit, den vor der Authentifizierung stattfindenden WebSocket-Handshake auf
    ausgelasteten oder leistungsschwachen Hosts abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Standard ist `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat weiterhin Vorrang für einmalige Dienst- oder Shell-Überschreibungen.
    - Beheben Sie Start-/Event-Loop-Blockaden bevorzugt zuerst; dieser Regler ist für Hosts gedacht, die grundsätzlich gesund, aber beim Aufwärmen langsam sind.

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
    - `threadBindings`: globale Standardwerte für das Routing thread-gebundener Sitzungen (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Senderichtlinie.
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

    Erstellen Sie zuerst das Image: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

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

    - Ermöglicht dem Gateway, `push.test`, Wake-Anstöße und Reconnect-Wakes über das externe Relay zu senden.
    - Verwendet eine registrierungsspezifische Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein deploymentweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendeverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mit App Attest plus App-Beleg beim Relay und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Nutzlast an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie anschließend für `push.test`, Wake-Anstöße und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung zeigt, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt den alten Relay-Ursprung wiederzuverwenden.

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
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: entfernt abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` (Standard `24h`; setzen Sie `false`, um zu deaktivieren).
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
    - Behandeln Sie alle Hook-/Webhook-Nutzlastinhalte als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie nicht das gemeinsame Gateway-Token wieder.
    - Hook-Authentifizierung erfolgt nur über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Query-String-Token werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; legen Sie den Webhook-Eingang auf einen dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer gewählte Sitzungsschlüssel einzugrenzen.
    - Für Hook-gesteuerte Agenten sollten Sie starke moderne Modellstufen und strikte Tool-Richtlinien bevorzugen (zum Beispiel nur Messaging plus Sandboxing, wo möglich).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agenten mit getrennten Workspaces und Sitzungen aus:

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

    - **Einzelne Datei**: ersetzt das enthaltende Objekt
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (später gewinnt)
    - **Geschwisterschlüssel**: werden nach Includes zusammengeführt (überschreiben einbezogene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen Tiefe unterstützt
    - **Relative Pfade**: relativ zur einbindenden Datei aufgelöst
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert,
      der durch ein Single-File-Include wie `plugins: { $include: "./plugins.json5" }` gestützt wird,
      aktualisiert OpenClaw diese einbezogene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes
      mit Geschwister-Overrides schlagen für OpenClaw-eigene Schreibvorgänge geschlossen fehl,
      statt die Konfiguration zu verflachen
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Config-Hot-Reload

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen werden als nicht vertrauenswürdig behandelt, bis sie validiert sind. Der Watcher wartet,
bis temporäre Editor-Schreib-/Umbenennungsvorgänge abgeklungen sind, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, indem er die letzte bekanntermaßen gültige Konfiguration wiederherstellt. OpenClaw-eigene
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dasselbe Schema-Gate; destruktive Überschreibungen wie
das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt
und zur Prüfung als `.rejected.*` gespeichert.

Plugin-lokale Validierungsfehler sind die Ausnahme: Wenn alle Probleme unter
`plugins.entries.<id>...` liegen, behält der Reload die aktuelle Konfiguration bei und meldet das Plugin-
Problem, statt `.last-good` wiederherzustellen.

Wenn Sie `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` in Logs sehen, prüfen Sie die passende
`.clobbered.*`-Datei neben `openclaw.json`, korrigieren Sie die abgelehnte Nutzlast und führen Sie dann
`openclaw config validate` aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Apply an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie übernehmen ihn. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, ob sicher oder nicht.                   |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam.      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Apply angewendet wird und was einen Neustart benötigt

Die meisten Felder werden ohne Ausfallzeit per Hot-Apply angewendet. Im Modus `hybrid` werden neustartpflichtige Änderungen automatisch behandelt.

| Kategorie            | Felder                                                           | Neustart erforderlich? |
| -------------------- | ---------------------------------------------------------------- | ---------------------- |
| Channels             | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Channels | Nein                   |
| Agent & Modelle      | `agent`, `agents`, `models`, `routing`                           | Nein                   |
| Automatisierung      | `hooks`, `cron`, `agent.heartbeat`                               | Nein                   |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein                   |
| Tools & Medien       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Nein                   |
| UI & Sonstiges       | `ui`, `logging`, `identity`, `bindings`                          | Nein                   |
| Gateway-Server       | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)             | **Ja**                 |
| Infrastruktur        | `discovery`, `canvasHost`, `plugins`                             | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — ihre Änderung löst **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, die über `$include` referenziert wird, plant OpenClaw das Neuladen anhand des ursprünglichen Quelllayouts, nicht anhand der reduzierten In-Memory-Ansicht. Dadurch bleiben Hot-Reload-Entscheidungen (Hot-Apply vs. Neustart) vorhersehbar, selbst wenn ein einzelner Top-Level-Abschnitt in einer eigenen eingebundenen Datei wie `plugins: { $include: "./plugins.json5" }` liegt. Die Planung des Neuladens schlägt sicher fehl, wenn das Quelllayout mehrdeutig ist.

## Config-RPC (programmgesteuerte Aktualisierungen)

Für Tools, die Konfiguration über die Gateway-API schreiben, bevorzugen Sie diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schema-Knoten + Zusammenfassungen der Kinder)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für Teilaktualisierungen (JSON Merge Patch: Objekte werden zusammengeführt, `null` löscht, Arrays werden ersetzt)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für explizites Self-Update plus Neustart
- `update.status`, um den neuesten Update-Neustart-Sentinel zu prüfen und die laufende Version nach einem Neustart zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für exakte Dokumentation und Einschränkungen auf Feldebene behandeln. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference), wenn sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu dedizierten Subsystem-Referenzen benötigen.

<Note>
Control-Plane-Schreibvorgänge (`config.apply`, `config.patch`, `update.run`) sind auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt. Neustartanforderungen werden zusammengeführt und erzwingen anschließend eine Abkühlzeit von 30 Sekunden zwischen Neustartzyklen. `update.status` ist schreibgeschützt, aber auf Administratoren beschränkt, weil der Neustart-Sentinel Zusammenfassungen von Update-Schritten und Enden von Befehlsausgaben enthalten kann.
</Note>

Beispiel für einen Teil-Patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sowohl `config.apply` als auch `config.patch` akzeptieren `raw`, `baseHash`, `sessionKey`, `note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, wenn bereits eine Konfiguration vorhanden ist.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der Dateien überschreibt vorhandene Umgebungsvariablen. Sie können Inline-Umgebungsvariablen auch in der Konfiguration setzen:

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

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Referenzieren Sie Umgebungsvariablen in beliebigen String-Werten der Konfiguration mit `${VAR_NAME}`:

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

SecretRef-Details (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets). Unterstützte Credential-Pfade sind in der [SecretRef-Credential-Oberfläche](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für vollständige Priorität und Quellen.

## Vollständige Referenz

Die vollständige Feld-für-Feld-Referenz finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
