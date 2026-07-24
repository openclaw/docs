---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-07-24T04:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cc04efa16f32e12d6ebcea7a1d36b336df32227fe66953c5d70107708ee6c3
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`. Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte.

Der aktive Konfigurationspfad muss eine reguläre Datei sein. Schreibvorgänge von OpenClaw ersetzen sie atomar (durch Umbenennen auf den Pfad), sodass bei einer symbolischen Verknüpfung für `openclaw.json` deren Ziel ersetzt wird, statt durch die Verknüpfung zu schreiben – vermeiden Sie Konfigurationslayouts mit symbolischen Verknüpfungen. Wenn Sie die Konfiguration außerhalb des standardmäßigen Zustandsverzeichnisses aufbewahren, lassen Sie `OPENCLAW_CONFIG_PATH` direkt auf die tatsächliche Datei verweisen.

Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden darf
- Modelle, Tools, Sandboxing oder Automatisierung (Cron, Hooks) festlegen
- Sitzungen, Medien, Netzwerk oder Benutzeroberfläche abstimmen

Alle verfügbaren Felder finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference).

Die Konfiguration folgt einer Zwei-Bereiche-Regel: Untergeordnete Elemente auf Stammebene enthalten Infrastruktur und agentenübergreifende Standardwerte, während `agents.defaults` das Verhalten der Agentenschleife enthält. Einträge unter `agents.entries` können beide Bereiche überschreiben, sofern das Schema eine agentenspezifische Überschreibung unterstützt.

Agenten und Automatisierungen sollten vor dem Bearbeiten der Konfiguration `config.schema.lookup` für eine genaue
Dokumentation auf Feldebene verwenden. Nutzen Sie diese Seite für aufgabenorientierte Anleitungen und
die [Konfigurationsreferenz](/de/gateway/configuration-reference) für die umfassendere
Übersicht der Felder und Standardwerte.

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
  <Tab title="Control UI">
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie die Registerkarte **Config**.
    Die Control UI rendert ein Formular aus dem aktiven Konfigurationsschema, einschließlich der
    Dokumentationsmetadaten der Felder `title` / `description` sowie der Plugin- und Kanalschemas, sofern
    verfügbar, und bietet als Ausweichmöglichkeit einen **Raw JSON**-Editor. Für Detailansichten
    und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten sowie Zusammenfassungen seiner unmittelbaren untergeordneten Elemente abzurufen.
    In den Einstellungen werden häufig verwendete Felder zuerst angezeigt. Jeder Abschnitt enthält seine erweiterten Felder
    in einer eingeklappten Gruppe **Advanced (N)**; verwenden Sie **Show advanced**, um alle
    Gruppen aufzuklappen. Die Einstellungssuche umfasst stets beide Ebenen und öffnet bei Bedarf
    die passende erweiterte Gruppe.
  </Tab>
  <Tab title="Direkte Bearbeitung">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Stammebene ist `$schema` (Zeichenfolge), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von der Control UI
und zur Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten sowie
Zusammenfassungen untergeordneter Elemente für Tools mit Detailansichten ab. Die Dokumentationsmetadaten der Felder `title`/`description`
werden durch verschachtelte Objekte, Platzhalter- (`*`), Array-Element- (`[]`) und `anyOf`/
`oneOf`/`allOf`-Verzweigungen weitergegeben. Laufzeit-Schemas für Plugins und Kanäle werden zusammengeführt, sobald die
Manifest-Registry geladen ist.

Jedes Konfigurationsblatt hat in `uiHints` eine allgemeine oder erweiterte Darstellungsebene.
`advanced: false` kennzeichnet allgemeine Einstellungen und `advanced: true` kennzeichnet erweiterte
Einstellungen. Ein Blatt erbt die Ebene des nächsten übergeordneten Elements, wenn es keinen direkten Hinweis besitzt;
Pfade ohne deklariertes übergeordnetes Element verwenden standardmäßig die erweiterte Ebene. Dies wirkt sich
nur auf die Darstellung aus, nicht auf Validierung, Standardwerte, Neuladeverhalten oder darauf, ob der Schlüssel festgelegt werden kann.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme anzuzeigen
- Führen Sie `openclaw doctor --fix` aus (`--repair` ist dasselbe Flag; `--yes` überspringt Rückfragen), um Reparaturen anzuwenden

Das Gateway bewahrt nach jedem erfolgreichen Start eine vertrauenswürdige, zuletzt als funktionierend bekannte Kopie auf,
aber weder der Start noch Hot Reload stellen sie automatisch wieder her – dies erfolgt ausschließlich durch `openclaw doctor --fix`.
Wenn `openclaw.json` die Validierung nicht besteht (einschließlich der Plugin-lokalen Validierung), schlägt der Start des Gateways
fehl oder das Neuladen wird übersprungen, und die aktuelle Laufzeit verwendet weiterhin die zuletzt akzeptierte
Konfiguration. Ein abgelehnter Schreibvorgang wird zur Überprüfung außerdem als `<path>.rejected.<timestamp>` gespeichert.
Das Gateway blockiert Schreibvorgänge, die wie versehentliches Überschreiben aussehen – Entfernen von `gateway.mode`,
Verlust des Blocks `meta` oder Verkleinern der Datei um mehr als die Hälfte –, sofern der Schreibvorgang
destruktive Änderungen nicht ausdrücklich erlaubt. Die Übernahme als zuletzt als funktionierend bekannte Version wird übersprungen, wenn ein
Kandidat einen Platzhalter für ein redigiertes Geheimnis wie `***` oder `[redacted]` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat unter `channels.<provider>` einen eigenen Konfigurationsabschnitt. Die Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

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

    Alle Kanäle verwenden dasselbe Muster für die Direktnachrichtenrichtlinie:

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

    - `agents.defaults.models` speichert Aliasse und modellspezifische Einstellungen; das Hinzufügen eines Eintrags schränkt Überschreibungen durch `/model` oder `--model` niemals ein.
    - `agents.defaults.modelPolicy.allow` ist die explizite Positivliste für Überschreibungen und Modellauswahlen. Sie akzeptiert exakte Referenzen und `provider/*`-Platzhalter; lassen Sie sie weg oder verwenden Sie `[]`, um jedes Modell zuzulassen.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Herunterskalierung von Bildern in Transkripten und Tools (Standardwert `1200`); niedrigere Werte reduzieren bei Durchläufen mit vielen Screenshots normalerweise die Nutzung von Vision-Tokens.
    - Informationen zum Wechseln von Modellen im Chat finden Sie unter [Modelle per CLI](/de/concepts/models), Informationen zur Authentifizierungsrotation und zum Fallback-Verhalten unter [Modell-Failover](/de/concepts/model-failover).
    - Informationen zu benutzerdefinierten oder selbst gehosteten Providern finden Sie unter [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    Der Zugriff auf Direktnachrichten wird pro Kanal über `dmPolicy` gesteuert (Standardwert `"pairing"`):

    - `"pairing"`: Unbekannte Absender erhalten einen einmaligen Kopplungscode zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im Speicher für gekoppelte Freigaben)
    - `"open"`: alle eingehenden Direktnachrichten zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle Direktnachrichten ignorieren

    Verwenden Sie für Gruppen `groupPolicy` (`"allowlist" | "open" | "disabled"`) zusammen mit `groupAllowFrom` oder kanalspezifischen Positivlisten.

    Kanalspezifische Details finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Erwähnungssperre für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Auslösemuster pro Agent. Normale Antworten in Gruppen oder Kanälen werden automatisch veröffentlicht; aktivieren Sie den Pfad über das Nachrichten-Tool für gemeinsam genutzte Räume, in denen der Agent entscheiden soll, wann er sich äußert:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // auf "message_tool" setzen, um überall Sendungen über das Nachrichten-Tool zu erzwingen
        groupChat: {
          visibleReplies: "message_tool", // Opt-in; sichtbare Ausgabe erfordert message(action=send)
          unmentionedInbound: "room_event", // nicht erwähnte, dauerhaft aktive Gruppenunterhaltung ist stiller Kontext
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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (Antippen zum Erwähnen in WhatsApp, @bot in Telegram usw.)
    - **Textmuster**: sichere reguläre Ausdrücke in `mentionPatterns`
    - **Sichtbare Antworten**: `messages.visibleReplies` kann Sendungen über das Nachrichten-Tool global erzwingen; `messages.groupChat.visibleReplies` überschreibt dies für Gruppen/Kanäle.
    - Informationen zu Modi für sichtbare Antworten, kanalspezifischen Überschreibungen und dem Selbstchat-Modus finden Sie in der [vollständigen Referenz](/de/gateway/config-channels#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` als gemeinsame Ausgangsbasis und überschreiben Sie anschließend bestimmte
    Agenten mit `agents.entries.*.skills`:

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

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig nicht eingeschränkt werden.
    - Lassen Sie `agents.entries.*.skills` weg, um die Standardwerte zu erben.
    - Legen Sie `agents.entries.*.skills: []` fest, um keine Skills zuzulassen.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Zustandsüberwachung pro Kanal konfigurieren">
    Deaktivieren oder aktivieren Sie automatische Neustarts aufgrund des Zustands eines Kanals oder Kontos:

    ```json5
    {
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

    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu steuern.
    - Informationen zur betrieblichen Fehlerdiagnose finden Sie unter [Zustandsprüfungen](/de/gateway/health), alle Felder in der [vollständigen Referenz](/de/gateway/configuration-reference#gateway).

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
    - `threadBindings`: globale Standardwerte für das Routing Thread-gebundener Sitzungen. `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age` binden, lösen, listen und konfigurieren dies pro Sitzung (Discord bindet Threads, Telegram bindet Themen/Unterhaltungen).
    - Informationen zu Gültigkeitsbereichen, Identitätsverknüpfungen und Senderichtlinien finden Sie unter [Sitzungsverwaltung](/de/concepts/session).
    - Alle Felder finden Sie in der [vollständigen Referenz](/de/gateway/config-agents#session).

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

    Erstellen Sie zuerst das Image – führen Sie aus einem Quellcode-Checkout `scripts/sandbox-setup.sh` aus oder verwenden Sie bei einer npm-Installation den eingebetteten Befehl `docker build` unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

    Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing), alle Optionen in der [vollständigen Referenz](/de/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Relay-gestützte Push-Benachrichtigungen für offizielle iOS-Builds aktivieren">
    Relay-gestützte Push-Benachrichtigungen für öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay: `https://ios-push-relay.openclaw.ai`.

    Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst getrennten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie Folgendes in der Gateway-Konfiguration fest:

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

    - Ermöglicht dem Gateway, `push.test`, Aktivierungsimpulse und Aktivierungen zur Wiederherstellung der Verbindung über das externe Relay zu senden.
    - Verwendet eine auf die Registrierung beschränkte Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein bereitstellungsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Lokale/manuelle iOS-Builds verwenden weiterhin direkte APNs. Relay-gestützte Übertragungen gelten nur für offiziell verteilte Builds, die über das Relay registriert wurden.
    - Muss mit der in den iOS-Build integrierten Relay-Basis-URL übereinstimmen, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreichen.

    End-to-End-Ablauf:

    1. Installieren Sie die offizielle iOS-App.
    2. Optional: Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur, wenn Sie einen bewusst getrennten benutzerdefinierten Relay-Build verwenden.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Bedienersitzungen eine Verbindung herstellen.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mittels App Attest und App-Beleg und veröffentlicht anschließend die Relay-gestützte `push.apns.register`-Nutzlast auf dem gekoppelten Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie anschließend für `push.test`, Aktivierungsimpulse und Aktivierungen zur Wiederherstellung der Verbindung.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build veröffentlichen, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Umgebungsvariablen-Überschreibungen.
    - Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build integrierten Relay-Basis-URL übereinstimmen; der öffentliche App-Store-Veröffentlichungskanal lehnt benutzerdefinierte Überschreibungen der iOS-Relay-URL ab.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt ein ausschließlich für Loopback vorgesehener Entwicklungsausweg; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

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

    - `every`: Zeitdauerzeichenfolge (`30m`, `2h`). Legen Sie zum Deaktivieren `0m` fest. Standardwert: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standardwert) oder `block` für DM-artige Heartbeat-Ziele
    - Den vollständigen Leitfaden finden Sie unter [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Cron-Aufträge konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: Entfernt abgeschlossene isolierte Ausführungssitzungen aus den SQLite-Sitzungszeilen (Standardwert `24h`; legen Sie zum Deaktivieren `false` fest).
    - Der Ausführungsverlauf behält automatisch die neuesten 2000 Terminalzeilen pro Auftrag bei; verlorene Zeilen behalten ihr 24-stündiges Bereinigungsfenster.
    - Eine Funktionsübersicht und CLI-Beispiele finden Sie unter [Cron-Aufträge](/de/automation/cron-jobs).

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
    - Behandeln Sie sämtliche Hook-/Webhook-Nutzlastinhalte als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie keine aktiven Gateway-Authentifizierungsgeheimnisse (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) erneut.
    - Die Hook-Authentifizierung erfolgt ausschließlich über Header (`Authorization: Bearer ...` oder `x-openclaw-token`); Token in Abfragezeichenfolgen werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; belassen Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung der Prüfung unsicherer Inhalte (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) deaktiviert, sofern Sie keine eng begrenzte Fehlerdiagnose durchführen.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie außerdem `hooks.allowedSessionKeyPrefixes` fest, um vom Aufrufer gewählte Sitzungsschlüssel zu begrenzen.
    - Bevorzugen Sie für Hook-gesteuerte Agenten leistungsfähige moderne Modellstufen und strikte Werkzeugrichtlinien (beispielsweise ausschließlich Nachrichtenübermittlung sowie Sandboxing, soweit möglich).

    Alle Zuordnungsoptionen und die Gmail-Integration finden Sie in der [vollständigen Referenz](/de/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agenten mit getrennten Arbeitsbereichen und Sitzungen aus:

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

    Bindungsregeln und agentspezifische Zugriffsprofile finden Sie unter [Multi-Agent](/de/concepts/multi-agent) und in der [vollständigen Referenz](/de/gateway/config-agents#multi-agent-routing).

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

    - **Einzelne Datei**: ersetzt das umschließende Objekt
    - **Datei-Array**: wird der Reihe nach tief zusammengeführt (spätere Werte haben Vorrang), bis zu 10 verschachtelte Ebenen
    - **Gleichgeordnete Schlüssel**: werden nach den Includes zusammengeführt (überschreiben eingebundene Werte)
    - **Relative Pfade**: werden relativ zur einbindenden Datei aufgelöst
    - **Pfadformat**: Include-Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein
    - **OpenClaw-eigene Schreibvorgänge**: Wenn ein Schreibvorgang nur einen durch ein Einzeldatei-Include wie `plugins: { $include: "./plugins.json5" }` gestützten Abschnitt der obersten Ebene ändert,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstützte Schreibweiterleitung**: Root-Includes, Include-Arrays und Includes
      mit gleichgeordneten Überschreibungen werden bei OpenClaw-eigenen Schreibvorgängen sicher abgelehnt, statt
      die Konfiguration zu einer Datei zusammenzuführen
    - **Einschließung**: `$include`-Pfade müssen unter dem Verzeichnis aufgelöst werden, das
      `openclaw.json` enthält. Um einen Verzeichnisbaum über mehrere Computer oder Benutzer hinweg gemeinsam zu verwenden, legen Sie
      `OPENCLAW_INCLUDE_ROOTS` auf eine Pfadliste (`:` unter POSIX, `;` unter Windows) mit
      zusätzlichen Verzeichnissen fest, auf die Includes verweisen dürfen. Symbolische Links werden aufgelöst
      und erneut geprüft. Daher wird ein Pfad weiterhin abgelehnt, der sich lexikalisch in einem Konfigurationsverzeichnis befindet, dessen
      tatsächliches Ziel jedoch aus allen zulässigen Stammverzeichnissen herausführt.
    - **Fehlerbehandlung**: eindeutige Fehlermeldungen für fehlende Dateien, Analysefehler, zirkuläre Includes, ungültige Pfadformate und übermäßige Länge

  </Accordion>
</AccordionGroup>

## Dynamisches Neuladen der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an – für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateiänderungen gelten bis zu ihrer erfolgreichen Validierung als nicht vertrauenswürdig. Der Datei-Watcher wartet,
bis temporäre Schreib- und Umbenennungsvorgänge des Editors abgeschlossen sind, liest die endgültige Datei und lehnt
ungültige externe Änderungen ab, ohne `openclaw.json` neu zu schreiben. OpenClaw-eigene Konfigurations-
schreibvorgänge durchlaufen vor dem Schreiben dieselbe Schemaprüfung (die für jeden Schreibvorgang geltenden Regeln zum Überschreiben und Zurücksetzen finden Sie unter [Strikte Validierung](#strict-validation)).

Wenn `config reload skipped (invalid config)` angezeigt wird oder beim Start `Invalid
config` gemeldet wird, prüfen Sie die Konfiguration, führen Sie `openclaw config validate` und anschließend zur Reparatur `openclaw
doctor --fix` aus. Die Prüfliste finden Sie unter [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

### Neulademodi

| Modus                  | Verhalten                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort im laufenden Betrieb an. Bei kritischen Änderungen erfolgt automatisch ein Neustart. |
| **`hot`**              | Wendet nur sichere Änderungen im laufenden Betrieb an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist – Sie führen ihn durch. |
| **`restart`**          | Startet den Gateway bei jeder Konfigurationsänderung neu, unabhängig davon, ob sie sicher ist. |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was im laufenden Betrieb angewendet wird und was einen Neustart erfordert

Die meisten Felder werden ohne Ausfallzeit im laufenden Betrieb angewendet; einige so angewendete Abschnitte starten nur das betreffende
Subsystem (Kanal, Cron, Heartbeat, Zustandsüberwachung) neu und nicht den gesamten Gateway. Im
Modus `hybrid` werden Änderungen, die einen Neustart des Gateways erfordern, automatisch verarbeitet.

| Kategorie            | Felder                                                                  | Gateway-Neustart erforderlich? |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| Kanäle               | `channels.*`, `web` (WhatsApp) – alle integrierten und Plugin-Kanäle | Nein (startet diesen Kanal neu) |
| Agent und Modelle    | `agent`, `agents`, `models`, `routing` | Nein                           |
| Automatisierung      | `hooks`, `cron`, `agent.heartbeat` | Nein (startet dieses Subsystem neu) |
| Sitzungen und Nachrichten | `session`, `messages` | Nein                           |
| Tools und Medien     | `tools`, `skills`, `mcp`, `audio`, `talk` | Nein                           |
| Plugin-Konfiguration | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Nein (lädt die Plugin-Laufzeit neu) |
| UI und Sonstiges     | `ui`, `logging`, `identity`, `bindings` | Nein                           |
| Gateway-Server       | `gateway.*` (Port, Bindung, Authentifizierung, Tailscale, TLS, HTTP, Push) | **Ja**                         |
| Infrastruktur        | `discovery`, `browser`, `plugins.load`, `plugins.installs` | **Ja**                         |

<Note>
`gateway.reload` und `gateway.remote` sind unter `gateway.*` Ausnahmen – ihre Änderung löst **keinen** Neustart aus. Einzelne Plugins können diese Tabelle ebenfalls überschreiben: Ein geladenes Plugin kann eigene Konfigurationspräfixe deklarieren, die einen Neustart auslösen (beispielsweise startet das mitgelieferte Canvas-Plugin den Gateway für `plugins.enabled`, `plugins.allow` und `plugins.deny` neu, nicht nur für sein eigenes `plugins.entries.canvas`). Das tatsächliche Verhalten hängt daher davon ab, welche Plugins aktiv sind.
</Note>

### Planung des Neuladens

Wenn Sie eine über `$include` referenzierte Quelldatei bearbeiten, plant OpenClaw
das Neuladen anhand der in den Quellen definierten Struktur und nicht anhand der abgeflachten Ansicht im Arbeitsspeicher.
Dadurch bleiben Entscheidungen zum Neuladen im laufenden Betrieb (Anwendung im laufenden Betrieb oder Neustart) vorhersehbar, selbst wenn sich ein
einzelner Abschnitt der obersten Ebene in einer eigenen eingebundenen Datei wie
`plugins: { $include: "./plugins.json5" }` befindet. Die Planung des Neuladens schlägt sicherheitshalber fehl, wenn die
Quellstruktur mehrdeutig ist.

## Konfigurations-RPC (programmatische Aktualisierungen)

Für Tools, die Konfigurationen über die Gateway-API schreiben, wird dieser Ablauf empfohlen:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schemaknoten plus
  Zusammenfassungen der untergeordneten Elemente)
- `config.get`, um den aktuellen Snapshot zusammen mit `hash` abzurufen
- `config.patch` für partielle Aktualisierungen (JSON-Merge-Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt, wenn dies mit `replacePaths` ausdrücklich bestätigt wurde, falls
  Einträge entfernt würden)
- `config.apply` nur, wenn Sie die gesamte Konfiguration ersetzen möchten
- `update.run` für eine ausdrückliche Selbstaktualisierung mit anschließendem Neustart; geben Sie `continuationMessage` an, wenn die Sitzung nach dem Neustart einen weiteren Durchlauf ausführen soll
- `update.status`, um den neuesten Neustart-Marker der Aktualisierung zu prüfen und nach einem Neustart die ausgeführte Version zu verifizieren

Agenten sollten `config.schema.lookup` als erste Anlaufstelle für genaue
Dokumentation und Einschränkungen auf Feldebene verwenden. Verwenden Sie die [Konfigurationsreferenz](/de/gateway/configuration-reference),
wenn Sie die umfassendere Konfigurationsübersicht, Standardwerte oder Links zu speziellen
Subsystemreferenzen benötigen.

<Note>
Schreibvorgänge der Steuerungsebene (`config.apply`, `config.patch`, `update.run`) sind
pro Methode und pro `deviceId+clientIp` auf 30 Anfragen innerhalb von 60 Sekunden
begrenzt; siehe [Ratenbegrenzung](/gateway/security/rate-limiting). Neustartanforderungen
werden zusammengefasst; anschließend gilt zwischen Neustartzyklen eine Abkühlzeit von 30 Sekunden.
`update.status` ist schreibgeschützt, aber auf Administratoren beschränkt, da der Neustart-Marker
Zusammenfassungen der Aktualisierungsschritte und Endabschnitte der Befehlsausgabe enthalten kann.
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
Konfigurationsdatei vorhanden ist (beim ersten Schreibvorgang ohne vorhandene Konfiguration entfällt die Prüfung).

`config.patch` akzeptiert außerdem `replacePaths`, ein Array von Konfigurationspfaden, deren Array-Ersetzung
beabsichtigt ist. Wenn ein Patch ein vorhandenes Array durch ein Array mit weniger Einträgen ersetzen
oder löschen würde, lehnt der Gateway den Schreibvorgang ab, sofern dieser genaue Pfad nicht in
`replacePaths` enthalten ist; verschachtelte Arrays innerhalb von Array-Einträgen verwenden `[]`, beispielsweise
`agents.entries.*.skills`. Dies verhindert, dass gekürzte `config.get`-Snapshots
Routing- oder Zulassungslisten-Arrays unbemerkt überschreiben. Verwenden Sie `config.apply`, wenn Sie
die vollständige Konfiguration ersetzen möchten.

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` im aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globale Rückfalloption)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Sie können Umgebungsvariablen auch direkt in der Konfiguration festlegen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import aus der Shell-Umgebung (optional)">
  Wenn diese Option aktiviert ist und erwartete Schlüssel nicht festgelegt sind, führt OpenClaw Ihre Anmelde-Shell aus und importiert nur die fehlenden Schlüssel:

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
  Referenzieren Sie Umgebungsvariablen in beliebigen Zeichenfolgenwerten der Konfiguration mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Nur Namen in Großbuchstaben werden berücksichtigt: `[A-Z_][A-Z0-9_]*`
- Fehlende oder leere Variablen lösen beim Laden einen Fehler aus
- Mit `$${VAR}` maskieren, um eine literale Ausgabe zu erhalten
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
      serviceAccount: {
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

_Zugehörige Themen: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Betriebshandbuch](/de/gateway)
