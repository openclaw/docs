---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-07-16T13:01:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`. Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte.

Der aktive Konfigurationspfad muss eine reguläre Datei sein. Schreibvorgänge von OpenClaw ersetzen sie atomar (durch Umbenennen auf den Pfad), sodass bei einer als symbolischer Link angelegten `openclaw.json` deren Ziel ersetzt wird, statt über den Link zu schreiben – vermeiden Sie Konfigurationslayouts mit symbolischen Links. Wenn Sie die Konfiguration außerhalb des standardmäßigen Zustandsverzeichnisses speichern, lassen Sie `OPENCLAW_CONFIG_PATH` direkt auf die tatsächliche Datei verweisen.

Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder Benutzeroberfläche abstimmen

Alle verfügbaren Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Agenten und Automatisierungen sollten vor dem Bearbeiten der Konfiguration `config.schema.lookup` für eine genaue
Dokumentation auf Feldebene verwenden. Nutzen Sie diese Seite für aufgabenorientierte Anleitungen und
die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Feldübersicht und die Standardwerte.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder lesen Sie den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Konfigurationen zum Kopieren und Einfügen.
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
  <Tab title="Steuerungsoberfläche">
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Tab **Config**.
    Die Steuerungsoberfläche erzeugt aus dem aktuellen Konfigurationsschema ein Formular, einschließlich der
    Dokumentationsmetadaten `title` / `description` auf Feldebene sowie der Plugin- und Kanalschemata,
    sofern verfügbar, und bietet als Ausweichmöglichkeit einen Editor für **Raw JSON**. Für Detailansichten
    und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten samt Zusammenfassungen seiner direkten untergeordneten Knoten abzurufen.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf der obersten Ebene ist `$schema` (Zeichenfolge), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von der Steuerungsoberfläche
und für die Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten samt
Zusammenfassungen seiner untergeordneten Knoten für Detailansichts-Tools ab. Die Dokumentationsmetadaten `title`/`description` auf Feldebene
werden durch verschachtelte Objekte, Platzhalter- (`*`), Array-Element- (`[]`) und `anyOf`/
`oneOf`/`allOf`-Verzweigungen weitergegeben. Laufzeit-Schemata für Plugins und Kanäle werden zusammengeführt, sobald die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme anzuzeigen
- Führen Sie `openclaw doctor --fix` aus (`--repair` ist dieselbe Option; `--yes` überspringt Eingabeaufforderungen), um Reparaturen anzuwenden

Das Gateway bewahrt nach jedem erfolgreichen Start eine vertrauenswürdige Kopie der letzten als funktionsfähig bekannten Konfiguration auf,
stellt sie beim Start oder Hot Reload jedoch nicht automatisch wieder her – dies geschieht nur durch `openclaw doctor --fix`.
Wenn `openclaw.json` die Validierung nicht besteht (einschließlich der Plugin-internen Validierung), schlägt der Start des Gateways
fehl oder das erneute Laden wird übersprungen, und die aktuelle Laufzeit verwendet weiterhin die zuletzt akzeptierte
Konfiguration. Ein abgelehnter Schreibvorgang wird außerdem zur Überprüfung als `<path>.rejected.<timestamp>` gespeichert.
Das Gateway blockiert Schreibvorgänge, die wie versehentliches Überschreiben aussehen – das Entfernen von `gateway.mode`,
der Verlust des Blocks `meta` oder eine Verkleinerung der Datei um mehr als die Hälfte –, sofern der Schreibvorgang
destruktive Änderungen nicht ausdrücklich erlaubt. Eine Kandidatenkonfiguration wird nicht zur letzten als funktionsfähig bekannten Version hochgestuft, wenn sie
einen Platzhalter für ein geschwärztes Secret wie `***` oder `[redacted]` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal besitzt unter `channels.<provider>` einen eigenen Konfigurationsabschnitt. Die Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

    - [Discord](/de/channels/discord) – `channels.discord`
    - [Feishu](/de/channels/feishu) – `channels.feishu`
    - [Google Chat](/de/channels/googlechat) – `channels.googlechat`
    - [iMessage](/de/channels/imessage) – `channels.imessage`
    - [Mattermost](/de/channels/mattermost) – `channels.mattermost`
    - [Microsoft Teams](/de/channels/msteams) – `channels.msteams`
    - [Signal](/de/channels/signal) – `channels.signal`
    - [Slack](/de/channels/slack) – `channels.slack`
    - [Telegram](/de/channels/telegram) – `channels.telegram`
    - [WhatsApp](/de/channels/whatsapp) – `channels.whatsapp`

    Alle Kanäle verwenden dasselbe Muster für DM-Richtlinien:

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

    - `agents.defaults.models` definiert den Modellkatalog und dient als Positivliste für `/model`; Einträge in `provider/*` beschränken `/model`, `/models` und die Modellauswahl auf ausgewählte Provider, während weiterhin die dynamische Modellerkennung verwendet wird.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge zur Positivliste hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Herunterskalierung von Bildern in Transkripten und Tools (Standardwert `1200`); niedrigere Werte reduzieren bei Durchläufen mit vielen Screenshots in der Regel die Nutzung von Vision-Tokens.
    - Informationen zum Wechseln von Modellen im Chat finden Sie unter [Modelle per CLI](/de/concepts/models), Informationen zur Authentifizierungsrotation und zum Fallback-Verhalten unter [Modell-Failover](/de/concepts/model-failover).
    - Informationen zu benutzerdefinierten oder selbst gehosteten Providern finden Sie unter [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert (Standardwert `"pairing"`):

    - `"pairing"`: Unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: Nur Absender in `allowFrom` (oder im Speicher für gekoppelte Zulassungen)
    - `"open"`: Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: Alle DMs ignorieren

    Verwenden Sie für Gruppen `groupPolicy` (`"allowlist" | "open" | "disabled"`) zusammen mit `groupAllowFrom` oder kanalspezifischen Positivlisten.

    Kanalspezifische Details finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Erwähnungssperre für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig **eine Erwähnung**. Konfigurieren Sie Auslösemuster pro Agent. Normale Gruppen- und Kanalantworten werden automatisch veröffentlicht; aktivieren Sie für gemeinsam genutzte Räume, in denen der Agent selbst entscheiden soll, wann er spricht, den Pfad über das Nachrichten-Tool:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // auf "message_tool" setzen, um überall das Senden über das Nachrichten-Tool zu verlangen
        groupChat: {
          visibleReplies: "message_tool", // explizit aktivieren; sichtbare Ausgabe erfordert message(action=send)
          unmentionedInbound: "room_event", // nicht erwähnte, dauerhaft aktive Gruppenunterhaltungen dienen als stiller Kontext
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (Antippen zur Erwähnung in WhatsApp, Telegram-@bot usw.)
    - **Textmuster**: sichere reguläre Ausdrücke in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann global das Senden über das Nachrichten-Tool erfordern; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen und Kanäle.
    - Weitere Informationen zu Modi für sichtbare Antworten, kanalspezifischen Überschreibungen und dem Selbstchat-Modus finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` als gemeinsame Grundlage und überschreiben Sie anschließend bestimmte
    Agenten mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // übernimmt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig nicht eingeschränkt werden.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung des Kanalzustands im Gateway abstimmen">
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

    - Die angezeigten Werte sind die Standardwerte. Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch die Zustandsüberwachung global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen einzelnen Kanal oder ein einzelnes Konto zu deaktivieren, ohne die globale Überwachung zu deaktivieren.
    - Informationen zur operativen Fehlerdiagnose finden Sie unter [Zustandsprüfungen](/de/gateway/health), alle Felder in der [vollständigen Referenz](/de/gateway/configuration-reference#gateway).

  </Accordion>

  <Accordion title="Zeitlimit für den WebSocket-Handshake des Gateways abstimmen">
    Geben Sie lokalen Clients auf ausgelasteten oder leistungsschwachen Hosts mehr Zeit, den WebSocket-Handshake
    vor der Authentifizierung abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Der Standardwert beträgt `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat bei einmaligen Überschreibungen für Dienste oder Shells weiterhin Vorrang.
    - Beheben Sie vorzugsweise zuerst Blockierungen beim Start oder in der Ereignisschleife; diese Einstellung ist für Hosts vorgesehen, die fehlerfrei funktionieren, sich während der Aufwärmphase jedoch langsam verhalten.

  </Accordion>

  <Accordion title="Sitzungen und Zurücksetzungen konfigurieren">
    Sitzungen steuern die Kontinuität und Isolation von Unterhaltungen:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // für mehrere Benutzer empfohlen
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
    - `threadBindings`: globale Standardwerte für das Routing threadgebundener Sitzungen. `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age` binden, lösen, listen und konfigurieren dies pro Sitzung (Discord bindet Threads, Telegram bindet Themen/Unterhaltungen).
    - Unter [Sitzungsverwaltung](/de/concepts/session) finden Sie Informationen zu Gültigkeitsbereichen, Identitätsverknüpfungen und Senderichtlinien.
    - Alle Felder finden Sie in der [vollständigen Referenz](/de/gateway/config-agents#session).

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sitzungen in isolierten Sandbox-Laufzeitumgebungen aus:

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

    Erstellen Sie zuerst das Image: Führen Sie aus einem Quellcode-Checkout `scripts/sandbox-setup.sh` aus. Bei einer npm-Installation finden Sie den eingebetteten Befehl `docker build` unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing), alle Optionen in der [vollständigen Referenz](/de/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Relay-gestützte Push-Benachrichtigungen für offizielle iOS-Builds aktivieren">
    Relay-gestützte Push-Benachrichtigungen für öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay: `https://ios-push-relay.openclaw.ai`.

    Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst separaten iOS-Build- und Bereitstellungspfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie Folgendes in der Gateway-Konfiguration fest:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Standardwert: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Entsprechender CLI-Befehl:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Funktionsweise:

    - Ermöglicht dem Gateway, `push.test`, Aktivierungsimpulse und Reaktivierungen für erneute Verbindungen über das externe Relay zu senden.
    - Verwendet eine registrierungsspezifische Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Lokale und manuelle iOS-Builds verwenden weiterhin direkte APNs. Relay-gestützte Übertragungen gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der in den iOS-Build eingebetteten Relay-Basis-URL übereinstimmen, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie die offizielle iOS-App.
    2. Optional: Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Bedienersitzungen eine Verbindung herstellen.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mithilfe von App Attest und dem App-Beleg beim Relay und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Nutzlast auf dem gekoppelten Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie anschließend für `push.test`, Aktivierungsimpulse und Reaktivierungen für erneute Verbindungen.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Umgebungsüberschreibungen.
    - Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build eingebetteten Relay-Basis-URL übereinstimmen; der öffentliche App-Store-Veröffentlichungskanal lehnt benutzerdefinierte Überschreibungen der iOS-Relay-URL ab.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein ausschließlich für Loopback vorgesehener Notbehelf für die Entwicklung; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

    Unter [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds) finden Sie den End-to-End-Ablauf und unter [Authentifizierungs- und Vertrauensablauf](/de/platforms/ios#authentication-and-trust-flow) das Relay-Sicherheitsmodell.

  </Accordion>

  <Accordion title="Heartbeat (regelmäßige Statusmeldungen) einrichten">
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

    - `every`: Zeitdauerzeichenfolge (`30m`, `2h`). Legen Sie zum Deaktivieren `0m` fest. Standardwert: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standardwert) oder `block` für DM-artige Heartbeat-Ziele
    - Den vollständigen Leitfaden finden Sie unter [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Cron-Aufgaben konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // Standardwert; Cron-Verteilung + isolierte Ausführung von Cron-Agent-Durchläufen
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: Entfernt Sitzungen abgeschlossener isolierter Durchläufe aus den SQLite-Sitzungszeilen (Standardwert `24h`; legen Sie zum Deaktivieren `false` fest).
    - Der Ausführungsverlauf behält automatisch die neuesten 2000 Abschlusszeilen pro Aufgabe; verwaiste Zeilen behalten ihr 24-stündiges Bereinigungsfenster.
    - Eine Funktionsübersicht und CLI-Beispiele finden Sie unter [Cron-Aufgaben](/de/automation/cron-jobs).

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
    - Behandeln Sie sämtliche Inhalte von Hook-/Webhook-Nutzlasten als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie einen dedizierten `hooks.token`; verwenden Sie keine aktiven Gateway-Authentifizierungsgeheimnisse erneut (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Die Hook-Authentifizierung erfolgt ausschließlich über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Token in Abfragezeichenfolgen werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; belassen Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Umgehungsoptionen für unsichere Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), sofern Sie keine eng begrenzte Fehlersuche durchführen.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie zusätzlich `hooks.allowedSessionKeyPrefixes` fest, um die vom Aufrufer ausgewählten Sitzungsschlüssel einzuschränken.
    - Bevorzugen Sie für Hook-gesteuerte Agents leistungsfähige moderne Modellklassen und strikte Tool-Richtlinien (zum Beispiel ausschließlich Nachrichtenübermittlung sowie nach Möglichkeit Sandboxing).

    Alle Zuordnungsoptionen und die Gmail-Integration finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#hooks).

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

    Informationen zu Bindungsregeln und agentspezifischen Zugriffsprofilen finden Sie unter [Multi-Agent](/de/concepts/multi-agent) und in der [vollständigen Referenz](/de/gateway/config-agents#multi-agent-routing).

  </Accordion>

  <Accordion title="Konfiguration auf mehrere Dateien aufteilen ($include)">
    Verwenden Sie `$include`, um umfangreiche Konfigurationen zu organisieren:

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
    - **Datei-Array**: wird der Reihe nach tief zusammengeführt (spätere Werte haben Vorrang), bis zu einer Verschachtelungstiefe von 10 Ebenen
    - **Gleichgeordnete Schlüssel**: werden nach den Includes zusammengeführt (überschreiben eingebundene Werte)
    - **Relative Pfade**: werden relativ zur einbindenden Datei aufgelöst
    - **Pfadformat**: Include-Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Abschnitt der obersten Ebene ändert,
      der durch ein Include einer einzelnen Datei wie `plugins: { $include: "./plugins.json5" }` bereitgestellt wird,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstützte Schreibweiterleitung**: Root-Includes, Include-Arrays und Includes
      mit gleichgeordneten Überschreibungen schlagen bei OpenClaw-eigenen Schreibvorgängen sicher fehl,
      anstatt die Konfiguration zu verflachen
    - **Einschränkung**: `$include`-Pfade müssen unterhalb des Verzeichnisses aufgelöst werden,
      das `openclaw.json` enthält. Um einen Verzeichnisbaum maschinen- oder benutzerübergreifend freizugeben, setzen Sie
      `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` unter POSIX, `;` unter Windows) mit
      zusätzlichen Verzeichnissen, auf die Includes verweisen dürfen. Symbolische Links werden aufgelöst
      und erneut geprüft. Daher wird ein Pfad weiterhin abgelehnt, der sich lexikalisch in einem Konfigurationsverzeichnis befindet,
      dessen tatsächliches Ziel jedoch außerhalb aller zulässigen Stammverzeichnisse liegt.
    - **Fehlerbehandlung**: eindeutige Fehler bei fehlenden Dateien, Analysefehlern, zirkulären Includes, ungültigem Pfadformat und übermäßiger Länge

  </Accordion>
</AccordionGroup>

## Hot-Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an – für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen gelten als nicht vertrauenswürdig, bis sie validiert wurden. Der Watcher wartet,
bis temporäre Schreib- und Umbenennungsvorgänge des Editors abgeschlossen sind, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurations-
schreibvorgänge durchlaufen vor dem Schreiben dieselbe Schemaprüfung (siehe [Strikte Validierung](#strict-validation)
für die Regeln zum Überschreiben und Zurücksetzen, die für jeden Schreibvorgang gelten).

Wenn `config reload skipped (invalid config)` angezeigt wird oder der Start `Invalid
config` meldet, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` und anschließend zur Reparatur `openclaw
doctor --fix` aus. Die Prüfliste finden Sie unter [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

### Neulademodi

| Modus                   | Verhalten                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort im laufenden Betrieb an. Bei kritischen Änderungen erfolgt automatisch ein Neustart.           |
| **`hot`**              | Wendet nur sichere Änderungen im laufenden Betrieb an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist – Sie führen ihn durch. |
| **`restart`**          | Startet den Gateway bei jeder Konfigurationsänderung neu, unabhängig davon, ob sie sicher ist.                                 |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was im laufenden Betrieb angewendet wird und was einen Neustart erfordert

Die meisten Felder werden ohne Ausfallzeit im laufenden Betrieb angewendet; bei einigen so angewendeten Abschnitten wird nur das jeweilige
Subsystem (Kanal, Cron, Heartbeat, Zustandsüberwachung) neu gestartet und nicht der gesamte Gateway. Im
Modus `hybrid` werden Änderungen, die einen Gateway-Neustart erfordern, automatisch verarbeitet.

| Kategorie            | Felder                                                                  | Gateway-Neustart erforderlich?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kanäle            | `channels.*`, `web` (WhatsApp) – alle integrierten und Plugin-Kanäle       | Nein (startet diesen Kanal neu)   |
| Agent und Modelle      | `agent`, `agents`, `models`, `routing`                                  | Nein                           |
| Automatisierung          | `hooks`, `cron`, `agent.heartbeat`                                      | Nein (startet dieses Subsystem neu) |
| Sitzungen und Nachrichten | `session`, `messages`                                                   | Nein                           |
| Werkzeuge und Medien       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Nein                           |
| Plugin-Konfiguration       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Nein (lädt die Plugin-Laufzeit neu)  |
| Benutzeroberfläche und Sonstiges           | `ui`, `logging`, `identity`, `bindings`                                 | Nein                           |
| Gateway-Server      | `gateway.*` (Port, Bindung, Authentifizierung, Tailscale, TLS, HTTP, Push)              | **Ja**                      |
| Infrastruktur      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ja**                      |

<Note>
`gateway.reload` und `gateway.remote` sind unter `gateway.*` Ausnahmen – ihre Änderung löst **keinen** Neustart aus. Einzelne Plugins können diese Tabelle ebenfalls überschreiben: Ein geladenes Plugin kann eigene Konfigurationspräfixe deklarieren, die einen Neustart auslösen (beispielsweise startet das mitgelieferte Canvas-Plugin den Gateway für `plugins.enabled`, `plugins.allow` und `plugins.deny` neu, nicht nur für sein eigenes `plugins.entries.canvas`). Das tatsächliche Verhalten hängt daher davon ab, welche Plugins aktiv sind.
</Note>

### Planung des Neuladens

Wenn Sie eine Quelldatei bearbeiten, auf die über `$include` verwiesen wird, plant OpenClaw
das Neuladen anhand der in der Quelle definierten Struktur und nicht anhand der abgeflachten Ansicht im Arbeitsspeicher.
Dadurch bleiben Entscheidungen beim Neuladen im laufenden Betrieb (Anwendung im laufenden Betrieb oder Neustart) vorhersehbar, selbst wenn sich ein
einzelner Abschnitt der obersten Ebene in einer eigenen eingebundenen Datei wie
`plugins: { $include: "./plugins.json5" }` befindet. Bei einer mehrdeutigen
Quellstruktur schlägt die Planung des Neuladens sicherheitsorientiert fehl.

## Konfigurations-RPC (programmatische Aktualisierungen)

Für Werkzeuge, die Konfigurationen über die Gateway-API schreiben, wird dieser Ablauf empfohlen:

- `config.schema.lookup`, um einen Teilbaum zu untersuchen (flacher Schemaknoten und Zusammenfassungen
  der untergeordneten Elemente)
- `config.get`, um den aktuellen Snapshot einschließlich `hash` abzurufen
- `config.patch` für partielle Aktualisierungen (JSON-Merge-Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt, wenn dies ausdrücklich mit `replacePaths` bestätigt wird, falls
  Einträge entfernt würden)
- `config.apply` nur, wenn die gesamte Konfiguration ersetzt werden soll
- `update.run` für eine ausdrückliche Selbstaktualisierung mit anschließendem Neustart; fügen Sie `continuationMessage` hinzu, wenn die Sitzung nach dem Neustart einen weiteren Durchlauf ausführen soll
- `update.status`, um den neuesten Neustart-Marker der Aktualisierung zu untersuchen und nach einem Neustart die ausgeführte Version zu überprüfen

Agenten sollten `config.schema.lookup` als erste Anlaufstelle für genaue
Dokumentation und Einschränkungen auf Feldebene verwenden. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu speziellen
Subsystemreferenzen benötigt werden.

<Note>
Schreibvorgänge der Steuerungsebene (`config.apply`, `config.patch`, `update.run`) sind
pro `deviceId+clientIp` auf 3 Anfragen pro 60 Sekunden begrenzt. Neustartanforderungen
werden zusammengefasst; anschließend gilt zwischen Neustartzyklen eine Abkühlzeit von 30 Sekunden.
`update.status` ist schreibgeschützt, erfordert jedoch Administratorrechte, da der Neustart-Marker
Zusammenfassungen der Aktualisierungsschritte und die letzten Zeilen der Befehlsausgabe enthalten kann.
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
`note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, sobald bereits eine
Konfigurationsdatei vorhanden ist (bei einem erstmaligen Schreibvorgang ohne vorhandene Konfiguration wird die Prüfung übersprungen).

`config.patch` akzeptiert außerdem `replacePaths`, ein Array mit Konfigurationspfaden, deren Array-Ersetzung
beabsichtigt ist. Wenn ein Patch ein vorhandenes Array durch eines mit weniger Einträgen ersetzen oder es löschen würde,
lehnt der Gateway den Schreibvorgang ab, sofern nicht genau dieser Pfad in
`replacePaths` enthalten ist; verschachtelte Arrays innerhalb von Array-Einträgen verwenden `[]`, beispielsweise
`agents.list[].skills`. Dadurch wird verhindert, dass abgeschnittene `config.get`-Snapshots
unbemerkt Routing- oder Zulassungslisten-Arrays überschreiben. Verwenden Sie `config.apply`, wenn die
gesamte Konfiguration ersetzt werden soll.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` im aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Rückgriff)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Sie können Umgebungsvariablen auch direkt in der Konfiguration festlegen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import der Shell-Umgebung (optional)">
  Wenn diese Funktion aktiviert ist und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Anmelde-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`. Standardwert für `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Verweisen Sie in einem beliebigen Zeichenfolgenwert der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Namen in Großbuchstaben werden berücksichtigt: `[A-Z_][A-Z0-9_]*`
- Fehlende oder leere Variablen lösen beim Laden einen Fehler aus
- Für eine literale Ausgabe mit `$${VAR}` maskieren
- Funktioniert innerhalb von `$include`-Dateien
- Direkte Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRefs (Umgebung, Datei, Ausführung)">
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Geheimnisverwaltung](/de/gateway/secrets).
Unterstützte Anmeldeinformationspfade sind unter [SecretRef-Anmeldeinformationsoberfläche](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Die vollständige Rangfolge und alle Quellen finden Sie unter [Umgebung](/de/help/environment).

## Vollständige Referenz

Die vollständige Referenz zu jedem einzelnen Feld finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Zugehörige Themen: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Betriebshandbuch](/de/gateway)
