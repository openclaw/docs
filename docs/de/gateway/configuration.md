---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-07-12T15:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18717d03bb923d90725b263e064f932ac30006d21f4b1b1bd98a4e39f1c92cff
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest optional eine <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`. Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte.

Der aktive Konfigurationspfad muss eine reguläre Datei sein. Schreibvorgänge von OpenClaw ersetzen sie atomar (durch Umbenennen auf den Pfad), sodass bei einer über einen symbolischen Link eingebundenen `openclaw.json` deren Ziel ersetzt wird, statt durch den Link hindurch zu schreiben – vermeiden Sie daher Konfigurationslayouts mit symbolischen Links. Wenn Sie die Konfiguration außerhalb des standardmäßigen Zustandsverzeichnisses aufbewahren, lassen Sie `OPENCLAW_CONFIG_PATH` direkt auf die tatsächliche Datei verweisen.

Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung (Cron, Hooks) festlegen
- Sitzungen, Medien, Netzwerk oder Benutzeroberfläche anpassen

Alle verfügbaren Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Agenten und Automatisierungen sollten vor der Bearbeitung der Konfiguration `config.schema.lookup` verwenden, um eine genaue
Dokumentation auf Feldebene abzurufen. Verwenden Sie diese Seite für aufgabenorientierte Anleitungen und die
[Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Feldübersicht und die Standardwerte.

<Tip>
**Konfiguration ist neu für Sie?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Konfigurationen zum Kopieren und Einfügen an.
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
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie die Registerkarte **Konfiguration**.
    Die Steuerungsoberfläche rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Dokumentationsmetadaten
    `title` / `description` für Felder sowie der Plugin- und Kanalschemas, sofern
    verfügbar, und bietet einen **Raw JSON**-Editor als Ausweichmöglichkeit. Für Detailansichten
    und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten sowie Zusammenfassungen seiner direkten untergeordneten Elemente abzurufen.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strenge Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Stammebene ist `$schema` (Zeichenfolge), damit Editoren JSON-Schema-Metadaten zuordnen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von der Steuerungsoberfläche
und für die Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten sowie
Zusammenfassungen seiner untergeordneten Elemente für Tools mit Detailansichten ab. Die Dokumentationsmetadaten `title`/`description` für Felder
werden durch verschachtelte Objekte, Platzhalter (`*`), Array-Elemente (`[]`) sowie `anyOf`-/
`oneOf`-/`allOf`-Verzweigungen weitergegeben. Laufzeitschemas für Plugins und Kanäle werden zusammengeführt, wenn die
Manifest-Registry geladen wird.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme anzuzeigen
- Führen Sie `openclaw doctor --fix` aus (`--repair` ist dasselbe Flag; `--yes` überspringt Eingabeaufforderungen), um Reparaturen anzuwenden

Das Gateway bewahrt nach jedem erfolgreichen Start eine vertrauenswürdige Kopie der letzten als funktionsfähig bekannten Konfiguration auf,
stellt sie jedoch weder beim Start noch beim Hot Reload automatisch wieder her – dies erfolgt nur durch `openclaw doctor --fix`.
Wenn die Validierung von `openclaw.json` fehlschlägt (einschließlich der Plugin-lokalen Validierung), schlägt der Start des Gateways
fehl oder das erneute Laden wird übersprungen, und die aktuelle Laufzeit verwendet weiterhin die zuletzt akzeptierte
Konfiguration. Ein abgelehnter Schreibvorgang wird zur Prüfung außerdem als `<path>.rejected.<timestamp>` gespeichert.
Das Gateway blockiert Schreibvorgänge, die wie versehentliches Überschreiben aussehen – etwa das Entfernen von `gateway.mode`,
den Verlust des `meta`-Blocks oder eine Verkleinerung der Datei um mehr als die Hälfte –, sofern der Schreibvorgang
destruktive Änderungen nicht ausdrücklich zulässt. Die Übernahme als letzte als funktionsfähig bekannte Konfiguration wird übersprungen, wenn ein
Kandidat einen Platzhalter für ein geschwärztes Geheimnis wie `***` oder `[redacted]` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat unter `channels.<provider>` einen eigenen Konfigurationsabschnitt. Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

    - [Discord](/de/channels/discord) - `channels.discord`
    - [Feishu](/de/channels/feishu) - `channels.feishu`
    - [Google Chat](/de/channels/googlechat) - `channels.googlechat`
    - [iMessage](/de/channels/imessage) - `channels.imessage`
    - [Mattermost](/de/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/de/channels/msteams) - `channels.msteams`
    - [Signal](/de/channels/signal) - `channels.signal`
    - [Slack](/de/channels/slack) - `channels.slack`
    - [Telegram](/de/channels/telegram) - `channels.telegram`
    - [WhatsApp](/de/channels/whatsapp) - `channels.whatsapp`

    Alle Kanäle verwenden dasselbe Richtlinienmuster für Direktnachrichten:

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

    - `agents.defaults.models` definiert den Modellkatalog und dient als Zulassungsliste für `/model`; `provider/*`-Einträge beschränken `/model`, `/models` und Modellauswahlelemente auf ausgewählte Provider, während weiterhin die dynamische Modellerkennung verwendet wird.
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge zur Zulassungsliste hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Herunterskalierung von Bildern in Transkripten und Tools (Standardwert `1200`); niedrigere Werte reduzieren bei Durchläufen mit vielen Screenshots normalerweise die Nutzung von Vision-Tokens.
    - Informationen zum Wechseln von Modellen im Chat finden Sie unter [Modelle über die CLI](/de/concepts/models), Informationen zur Authentifizierungsrotation und zum Fallback-Verhalten unter [Modell-Failover](/de/concepts/model-failover).
    - Informationen zu benutzerdefinierten oder selbst gehosteten Providern finden Sie unter [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    Der Zugriff auf Direktnachrichten wird pro Kanal über `dmPolicy` gesteuert (Standardwert `"pairing"`):

    - `"pairing"`: Unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: Nur Absender in `allowFrom` (oder im Speicher gekoppelter zugelassener Absender)
    - `"open"`: Alle eingehenden Direktnachrichten zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: Alle Direktnachrichten ignorieren

    Verwenden Sie für Gruppen `groupPolicy` (`"allowlist" | "open" | "disabled"`) zusammen mit `groupAllowFrom` oder kanalspezifischen Zulassungslisten.

    Kanalspezifische Details finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Erwähnungspflicht für Gruppenchats einrichten">
    Gruppennachrichten **erfordern standardmäßig eine Erwähnung**. Konfigurieren Sie Auslösemuster pro Agent. Normale Gruppen-/Kanalantworten werden automatisch veröffentlicht; aktivieren Sie den Pfad über das Nachrichten-Tool für gemeinsam genutzte Räume, in denen der Agent entscheiden soll, wann er sich äußert:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // auf "message_tool" setzen, um überall Sendevorgänge über das Nachrichten-Tool zu verlangen
        groupChat: {
          visibleReplies: "message_tool", // explizit aktiviert; sichtbare Ausgabe erfordert message(action=send)
          unmentionedInbound: "room_event", // nicht erwähnte, dauerhaft aktive Gruppenunterhaltung dient als stiller Kontext
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (Antippen zum Erwähnen in WhatsApp, Telegram-@bot usw.)
    - **Textmuster**: sichere reguläre Ausdrücke in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Sendevorgänge über das Nachrichten-Tool global vorschreiben; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Informationen zu Modi für sichtbare Antworten, kanalspezifischen Überschreibungen und dem Selbstchat-Modus finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Skills pro Agent beschränken">
    Verwenden Sie `agents.defaults.skills` als gemeinsame Basis und überschreiben Sie anschließend bestimmte
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

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig nicht beschränkt sind.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
    - Legen Sie `agents.list[].skills: []` fest, um keine Skills zuzulassen.
    - Weitere Informationen finden Sie unter [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      in der [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung des Kanalzustands durch das Gateway anpassen">
    Steuern Sie, wie aggressiv das Gateway Kanäle neu startet, die veraltet zu sein scheinen:

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

    - Die angezeigten Werte sind die Standardwerte. Legen Sie `gateway.channelHealthCheckMinutes: 0` fest, um durch die Zustandsüberwachung ausgelöste Neustarts global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen einzelnen Kanal oder ein einzelnes Konto zu deaktivieren, ohne die globale Überwachung zu deaktivieren.
    - Informationen zur betrieblichen Fehlerdiagnose finden Sie unter [Zustandsprüfungen](/de/gateway/health), alle Felder in der [vollständigen Referenz](/de/gateway/configuration-reference#gateway).

  </Accordion>

  <Accordion title="Zeitüberschreitung für den WebSocket-Handshake des Gateways anpassen">
    Geben Sie lokalen Clients auf
    ausgelasteten oder leistungsschwachen Hosts mehr Zeit, den WebSocket-Handshake vor der Authentifizierung abzuschließen:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Der Standardwert beträgt `15000` Millisekunden.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat für einmalige Überschreibungen in Diensten oder Shells weiterhin Vorrang.
    - Beheben Sie vorzugsweise zuerst Verzögerungen beim Start oder in der Ereignisschleife; diese Einstellung ist für Hosts vorgesehen, die ordnungsgemäß funktionieren, aber während der Aufwärmphase langsam sind.

  </Accordion>

  <Accordion title="Sitzungen und Zurücksetzungen konfigurieren">
    Sitzungen steuern die Kontinuität und Isolation von Unterhaltungen:

    ```json5
    {
      session: {
    ```
    ```json5
        dmScope: "per-channel-peer",  // empfohlen für mehrere Benutzer
    ```
    ```json5
        threadBindings: {
    ```
    ```json5
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
    ```
    ```json5
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```
    - `dmScope`: `main` (gemeinsam genutzt) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: Globale Standardwerte für das Routing Thread-gebundener Sitzungen. `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age` binden diese Einstellung pro Sitzung, heben die Bindung auf, listen sie auf und passen sie an (Discord bindet Threads, Telegram bindet Themen/Unterhaltungen).
    - Weitere Informationen zu Geltungsbereichen, Identitätsverknüpfungen und Senderichtlinien finden Sie unter [Sitzungsverwaltung](/de/concepts/session).
    - Alle Felder finden Sie in der [vollständigen Referenz](/de/gateway/config-agents#session).

  </Accordion>

  <Accordion title="Enable sandboxing">
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

    Erstellen Sie zuerst das Image – führen Sie aus einem Quellcode-Checkout `scripts/sandbox-setup.sh` aus, oder verwenden Sie bei einer npm-Installation den eingebetteten Befehl `docker build` unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Die vollständige Anleitung finden Sie unter [Sandboxing](/de/gateway/sandboxing) und alle Optionen in der [vollständigen Referenz](/de/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Relay-gestützte Push-Benachrichtigungen für offizielle iOS-Builds aktivieren">
    Relay-gestützte Push-Benachrichtigungen für öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay: `https://ios-push-relay.openclaw.ai`.

    Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst getrennten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Relay-URL des Gateways übereinstimmt. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie Folgendes in der Gateway-Konfiguration fest:

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

    CLI-Entsprechung:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Funktionsweise:

    - Ermöglicht dem Gateway, `push.test`, Aktivierungsimpulse und Aktivierungen zur Wiederherstellung der Verbindung über das externe Relay zu senden.
    - Verwendet eine registrierungsspezifische Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Verwendet für lokale/manuelle iOS-Builds weiterhin direkte APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der in den iOS-Build integrierten Relay-Basis-URL übereinstimmen, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie die offizielle iOS-App.
    2. Optional: Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur, wenn Sie bewusst einen separaten benutzerdefinierten Relay-Build verwenden.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl die Node- als auch die Operator-Sitzung eine Verbindung herstellen.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mithilfe von App Attest und dem App-Beleg beim Relay und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Nutzlast auf dem gekoppelten Gateway.
    5. Das Gateway speichert das Relay-Handle und die Sendeberechtigung und verwendet sie anschließend für `push.test`, Aktivierungsimpulse und Aktivierungen zur Wiederherstellung der Verbindung.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Umgebungsüberschreibungen.
    - Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build integrierten Relay-Basis-URL übereinstimmen; der öffentliche App-Store-Veröffentlichungskanal lehnt benutzerdefinierte Überschreibungen der iOS-Relay-URL ab.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein ausschließlich für Loopback bestimmter Entwicklungsnotausgang; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

    Den End-to-End-Ablauf finden Sie unter [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds), das Relay-Sicherheitsmodell unter [Authentifizierungs- und Vertrauensablauf](/de/platforms/ios#authentication-and-trust-flow).

  </Accordion>

  <Accordion title="Heartbeat einrichten (regelmäßige Statusmeldungen)">
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

    - `every`: Zeichenfolge für die Dauer (`30m`, `2h`). Setzen Sie den Wert zum Deaktivieren auf `0m`. Standard: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Die vollständige Anleitung finden Sie unter [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Cron-Jobs konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // Standardwert; Cron-Weiterleitung + isolierte Ausführung von Cron-Agent-Turns
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: Sitzungen abgeschlossener isolierter Ausführungen aus den SQLite-Sitzungszeilen entfernen (Standardwert `24h`; zum Deaktivieren auf `false` setzen).
    - `runLog`: Aufbewahrte Zeilen des Cron-Ausführungsverlaufs pro Job entfernen. Der Verlauf wird in SQLite gespeichert; `maxBytes` (Standardwert `2_000_000`) wird für die Kompatibilität mit älteren dateibasierten Ausführungsprotokollen beibehalten, `keepLines` hat den Standardwert `2000`.
    - Eine Funktionsübersicht und CLI-Beispiele finden Sie unter [Cron-Jobs](/de/automation/cron-jobs).

  </Accordion>

  <Accordion title="Webhooks (Hooks) einrichten">
    Aktivieren Sie HTTP-Webhook-Endpunkte am Gateway:

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
    - Behandeln Sie sämtliche Inhalte von Hook-/Webhook-Nutzdaten als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie keine aktiven Gateway-Authentifizierungsgeheimnisse (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) erneut.
    - Die Hook-Authentifizierung erfolgt ausschließlich über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Abfragezeichenfolgen werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; verwenden Sie für eingehende Webhooks einen dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung der Prüfung unsicherer Inhalte (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) deaktiviert, außer bei eng begrenzter Fehlerdiagnose.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie außerdem `hooks.allowedSessionKeyPrefixes` fest, um die vom Aufrufer ausgewählten Sitzungsschlüssel einzugrenzen.
    - Bevorzugen Sie für Hook-gesteuerte Agenten leistungsfähige moderne Modellklassen und eine strikte Tool-Richtlinie (beispielsweise ausschließlich Nachrichtenfunktionen sowie Sandboxing, sofern möglich).

    Alle Zuordnungsoptionen und die Gmail-Integration finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agenten mit separaten Arbeitsbereichen und Sitzungen aus:

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

    Bindungsregeln und agentenspezifische Zugriffsprofile finden Sie unter [Multi-Agent](/de/concepts/multi-agent) und in der [vollständigen Referenz](/de/gateway/config-agents#multi-agent-routing).

  </Accordion>

  <Accordion title="Konfiguration auf mehrere Dateien aufteilen ($include)">
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
    - **Datei-Array**: wird der Reihe nach tief zusammengeführt (spätere Werte haben Vorrang), bis zu 10 verschachtelte Ebenen
    - **Gleichgeordnete Schlüssel**: werden nach den Includes zusammengeführt (überschreiben eingebundene Werte)
    - **Relative Pfade**: werden relativ zur einbindenden Datei aufgelöst
    - **Pfadformat**: Include-Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein
    - **Von OpenClaw ausgeführte Schreibvorgänge**: Wenn ein Schreibvorgang nur einen Abschnitt der obersten Ebene ändert,
      der durch ein Include einer einzelnen Datei wie `plugins: { $include: "./plugins.json5" }` gestützt wird,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Durchschreiben**: Root-Includes, Include-Arrays und Includes
      mit gleichgeordneten Überschreibungen werden bei von OpenClaw ausgeführten Schreibvorgängen sicher abgelehnt,
      anstatt die Konfiguration zu verflachen
    - **Einschränkung**: `$include`-Pfade müssen innerhalb des Verzeichnisses aufgelöst werden, das
      `openclaw.json` enthält. Um eine Verzeichnisstruktur über mehrere Rechner oder Benutzer hinweg gemeinsam zu verwenden, setzen Sie
      `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` unter POSIX, `;` unter Windows) mit
      zusätzlichen Verzeichnissen, auf die Includes verweisen dürfen. Symbolische Links werden aufgelöst
      und erneut geprüft. Daher wird ein Pfad weiterhin abgelehnt, der sich lexikalisch in einem Konfigurationsverzeichnis befindet,
      dessen tatsächliches Ziel jedoch außerhalb aller zulässigen Wurzelverzeichnisse liegt.
    - **Fehlerbehandlung**: eindeutige Fehler bei fehlenden Dateien, Parsing-Fehlern, zirkulären Includes, ungültigem Pfadformat und übermäßiger Länge

  </Accordion>
</AccordionGroup>

## Hot-Reload der Konfiguration

Der Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an – für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen gelten als nicht vertrauenswürdig, bis sie validiert wurden. Der Watcher wartet,
bis temporäre Schreib- und Umbenennungsvorgänge des Editors abgeschlossen sind, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. Von OpenClaw ausgeführte
Konfigurationsschreibvorgänge durchlaufen vor dem Schreiben dieselbe Schemaprüfung (siehe [Strikte Validierung](#strict-validation)
für die Regeln zum Überschreiben und Zurücksetzen, die für jeden Schreibvorgang gelten).

Wenn `config reload skipped (invalid config)` angezeigt wird oder beim Start `Invalid
config` gemeldet wird, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` und anschließend zur Reparatur `openclaw
doctor --fix` aus. Die Prüfliste finden Sie unter [Fehlerbehebung für den Gateway](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

### Reload-Modi

| Modus                  | Verhalten                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot-Reload an. Bei kritischen Änderungen erfolgt automatisch ein Neustart.                       |
| **`hot`**              | Wendet nur sichere Änderungen per Hot-Reload an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist – Sie führen ihn durch. |
| **`restart`**          | Startet den Gateway bei jeder Konfigurationsänderung neu, unabhängig davon, ob sie sicher ist.                                          |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam.                                           |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot-Reload angewendet wird und was einen Neustart erfordert

Die meisten Felder werden ohne Ausfallzeit direkt angewendet; bei einigen direkt angewendeten Abschnitten wird nur das jeweilige
Subsystem (Kanal, Cron, Heartbeat, Zustandsüberwachung) statt des gesamten Gateways neu gestartet. Im
Modus `hybrid` werden Änderungen, die einen Gateway-Neustart erfordern, automatisch verarbeitet.

| Kategorie             | Felder                                                                  | Gateway-Neustart erforderlich?       |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Kanäle                | `channels.*`, `web` (WhatsApp) – alle integrierten und Plugin-Kanäle    | Nein (startet diesen Kanal neu)      |
| Agent und Modelle     | `agent`, `agents`, `models`, `routing`                                  | Nein                                 |
| Automatisierung       | `hooks`, `cron`, `agent.heartbeat`                                      | Nein (startet dieses Subsystem neu)  |
| Sitzungen und Nachrichten | `session`, `messages`                                               | Nein                                 |
| Tools und Medien      | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Nein                                 |
| Plugin-Konfiguration  | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Nein (lädt die Plugin-Laufzeit neu)  |
| UI und Sonstiges      | `ui`, `logging`, `identity`, `bindings`                                 | Nein                                 |
| Gateway-Server        | `gateway.*` (Port, Bindung, Authentifizierung, Tailscale, TLS, HTTP, Push) | **Ja**                             |
| Infrastruktur         | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Ja**                               |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen unter `gateway.*` – ihre Änderung löst **keinen** Neustart aus. Einzelne Plugins können diese Tabelle ebenfalls überschreiben: Ein geladenes Plugin kann eigene Konfigurationspräfixe deklarieren, die einen Neustart auslösen (beispielsweise startet das mitgelieferte Canvas-Plugin den Gateway bei `plugins.enabled`, `plugins.allow` und `plugins.deny` neu, nicht nur bei seinem eigenen `plugins.entries.canvas`). Das tatsächliche Verhalten hängt daher davon ab, welche Plugins aktiv sind.
</Note>

### Planung des Neuladens

Wenn Sie eine Quelldatei bearbeiten, auf die über `$include` verwiesen wird, plant OpenClaw
das Neuladen anhand der in der Quelle definierten Struktur und nicht anhand der vereinheitlichten Ansicht im Arbeitsspeicher.
Dadurch bleiben Entscheidungen zum direkten Neuladen (direktes Anwenden oder Neustart) vorhersehbar, selbst wenn sich ein
einzelner Abschnitt der obersten Ebene in einer eigenen eingebundenen Datei befindet, beispielsweise
`plugins: { $include: "./plugins.json5" }`. Die Planung des Neuladens wird sicher abgebrochen, wenn die
Quellstruktur mehrdeutig ist.

## Konfigurations-RPC (programmatische Aktualisierungen)

Für Tools, die die Konfiguration über die Gateway-API schreiben, verwenden Sie vorzugsweise diesen Ablauf:

- `config.schema.lookup`, um einen Unterbaum zu prüfen (flacher Schemaknoten und
  Zusammenfassungen der untergeordneten Elemente)
- `config.get`, um den aktuellen Snapshot einschließlich `hash` abzurufen
- `config.patch` für teilweise Aktualisierungen (JSON-Merge-Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt, wenn dies mit `replacePaths` ausdrücklich bestätigt wird, falls
  Einträge entfernt würden)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für eine ausdrückliche Selbstaktualisierung mit anschließendem Neustart; geben Sie `continuationMessage` an, wenn die Sitzung nach dem Neustart einen weiteren Durchlauf ausführen soll
- `update.status`, um den neuesten Neustart-Marker der Aktualisierung zu prüfen und nach einem Neustart die ausgeführte Version zu verifizieren

Agents sollten `config.schema.lookup` als erste Anlaufstelle für genaue
Dokumentation und Einschränkungen auf Feldebene verwenden. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn Sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu speziellen
Subsystemreferenzen benötigen.

<Note>
Schreibvorgänge der Steuerungsebene (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden je `deviceId+clientIp` begrenzt. Neustart-
anfragen werden zusammengeführt; anschließend wird zwischen Neustartzyklen eine Abkühlzeit von 30 Sekunden durchgesetzt.
`update.status` ist schreibgeschützt, aber auf Administratoren beschränkt, da der Neustart-Marker
Zusammenfassungen der Aktualisierungsschritte und die letzten Zeilen der Befehlsausgabe enthalten kann.
</Note>

Beispiel für einen teilweisen Patch:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash erfassen
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sowohl `config.apply` als auch `config.patch` akzeptieren `raw`, `baseHash`, `sessionKey`,
`note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, sobald bereits eine
Konfigurationsdatei vorhanden ist (beim erstmaligen Schreiben ohne bestehende Konfiguration entfällt die Prüfung).

`config.patch` akzeptiert außerdem `replacePaths`, ein Array von Konfigurationspfaden, deren Array-
Ersetzung beabsichtigt ist. Wenn ein Patch ein vorhandenes Array durch eines mit weniger
Einträgen ersetzen oder löschen würde, lehnt der Gateway den Schreibvorgang ab, sofern nicht genau dieser Pfad
in `replacePaths` enthalten ist; verschachtelte Arrays innerhalb von Array-Einträgen verwenden `[]`, beispielsweise
`agents.list[].skills`. Dadurch wird verhindert, dass gekürzte `config.get`-Snapshots
Routing- oder Zulassungslisten-Arrays unbemerkt überschreiben. Verwenden Sie `config.apply`, wenn Sie
die vollständige Konfiguration ersetzen möchten.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` im aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Rückgriff)

Keine der beiden Dateien überschreibt bereits vorhandene Umgebungsvariablen. Sie können Umgebungsvariablen auch direkt in der Konfiguration festlegen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import der Shell-Umgebung (optional)">
  Wenn diese Option aktiviert ist und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Anmelde-Shell aus und importiert nur die fehlenden Schlüssel:

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
  Verweisen Sie in beliebigen Zeichenfolgenwerten der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Namen in Großbuchstaben werden erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende oder leere Variablen verursachen beim Laden einen Fehler
- Verwenden Sie `$${VAR}` für eine literale Ausgabe
- Funktioniert innerhalb von `$include`-Dateien
- Direkte Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret-Referenzen (Umgebung, Datei, Ausführung)">
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secret-Verwaltung](/de/gateway/secrets).
Unterstützte Anmeldedatenpfade sind unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Die vollständige Rangfolge und alle Quellen finden Sie unter [Umgebung](/de/help/environment).

## Vollständige Referenz

Die vollständige Referenz aller einzelnen Felder finden Sie in der **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandte Themen: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Betriebshandbuch](/de/gateway)
