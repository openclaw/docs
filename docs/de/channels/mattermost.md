---
read_when:
    - Mattermost einrichten
    - Fehlersuche beim Mattermost-Routing
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Status: herunterladbares Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter [mattermost.com](https://mattermost.com).

## Installation

Installieren Sie Mattermost, bevor Sie den Kanal konfigurieren:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

<Steps>
  <Step title="Ensure plugin is available">
    Aktuelle paketierte OpenClaw-Releases bündeln es bereits. Ältere/angepasste Installationen können es manuell mit den obigen Befehlen hinzufügen.
  </Step>
  <Step title="Create a Mattermost bot">
    Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
  </Step>
  <Step title="Copy the base URL">
    Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
    Minimale Konfiguration:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## Native Slash-Befehle

Native Slash-Befehle sind optional. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über die Mattermost-API und empfängt Callback-POSTs auf dem Gateway-HTTP-Server.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
    - Wenn `callbackUrl` ausgelassen wird, leitet OpenClaw eine URL aus Gateway-Host/-Port + `callbackPath` ab.
    - Für Multi-Account-Setups kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` festgelegt werden (Account-Werte überschreiben Felder auf oberster Ebene).
    - Befehls-Callbacks werden mit den pro Befehl zurückgegebenen Tokens validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Befehle registriert.
    - OpenClaw aktualisiert die aktuelle Mattermost-Befehlsregistrierung, bevor jeder Callback akzeptiert wird, sodass veraltete Tokens aus gelöschten oder neu generierten Slash-Befehlen ohne Gateway-Neustart nicht mehr akzeptiert werden.
    - Die Callback-Validierung schlägt geschlossen fehl, wenn die Mattermost-API nicht bestätigen kann, dass der Befehl noch aktuell ist; fehlgeschlagene Validierungen werden kurz zwischengespeichert, gleichzeitige Lookups werden zusammengeführt, und neue Lookup-Starts werden pro Befehl rate-limitiert, um Replay-Druck zu begrenzen.
    - Slash-Callbacks schlagen geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise abgeschlossen wurde oder das Callback-Token nicht mit dem registrierten Token des aufgelösten Befehls übereinstimmt (ein für einen Befehl gültiges Token kann keine Upstream-Validierung für einen anderen Befehl erreichen).

  </Accordion>
  <Accordion title="Reachability requirement">
    Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL reverse-proxyt `/api/channels/mattermost/command` zu OpenClaw.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Wenn Ihr Callback auf private/tailnet/interne Adressen zeigt, setzen Sie Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/die Callback-Domain enthalten ist.

    Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.

    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen (Standard-Account)

Setzen Sie diese auf dem Gateway-Host, wenn Sie Umgebungsvariablen bevorzugen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Umgebungsvariablen gelten nur für den **Standard**-Account (`default`). Andere Accounts müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).
</Note>

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Kanalverhalten wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (default)">
    Nur antworten, wenn in Kanälen per @ erwähnt.
  </Tab>
  <Tab title="onmessage">
    Auf jede Kanalnachricht antworten.
  </Tab>
  <Tab title="onchar">
    Antworten, wenn eine Nachricht mit einem Trigger-Präfix beginnt.
  </Tab>
</Tabs>

Konfigurationsbeispiel:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Hinweise:

- `onchar` antwortet weiterhin auf explizite @Erwähnungen.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im Hauptkanal bleiben oder unter dem auslösenden Beitrag einen Thread starten.

- `off` (Standard): nur in einem Thread antworten, wenn der eingehende Beitrag bereits in einem Thread ist.
- `first`: für Top-Level-Beiträge in Kanälen/Gruppen einen Thread unter diesem Beitrag starten und die Unterhaltung an eine thread-bezogene Sitzung weiterleiten.
- `all`: heute dasselbe Verhalten wie `first` für Mattermost.
- Direktnachrichten ignorieren diese Einstellung und bleiben ohne Thread.

Konfigurationsbeispiel:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Hinweise:

- Thread-bezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Root.
- `first` und `all` sind derzeit äquivalent, weil Folge-Chunks und Medien im selben Thread fortgesetzt werden, sobald Mattermost einen Thread-Root hat.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Erlauben Sie Absender mit `channels.mattermost.groupAllowFrom` (Benutzer-IDs empfohlen).
- Erwähnungs-Overrides pro Kanal befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Matching ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true` gesetzt ist.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (erwähnungsgesteuert).
- Laufzeithinweis: Wenn `channels.mattermost` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

Beispiel:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Ziele für ausgehende Zustellung

Verwenden Sie diese Zielformate mit `openclaw message send` oder Cron/Webhooks:

- `channel:<id>` für einen Kanal
- `user:<id>` für eine DM
- `@username` für eine DM (über die Mattermost-API aufgelöst)

<Warning>
Bloße undurchsichtige IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Kanal-ID).

OpenClaw löst sie **benutzerzuerst** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich ist), sendet OpenClaw eine **DM**, indem der direkte Kanal über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholung für DM-Kanal

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Kanal auflösen muss, wiederholt es transiente Fehler bei der Erstellung direkter Kanäle standardmäßig.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen, oder `channels.mattermost.accounts.<id>.dmChannelRetry` für einen Account.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Hinweise:

- Dies gilt nur für die Erstellung von DM-Kanälen (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungen gelten für transiente Fehler wie Rate Limits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Client-Fehler außer `429` werden als permanent behandelt und nicht wiederholt.

## Vorschau-Streaming

Mattermost streamt Denken, Tool-Aktivität und Teilantworttext in einen einzelnen **Entwurfs-Vorschau-Beitrag**, der an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird mit derselben Beitrags-ID aktualisiert, statt den Kanal mit Nachrichten pro Chunk zu überfluten. Medien-/Fehler-Finalnachrichten brechen ausstehende Vorschau-Bearbeitungen ab und verwenden die normale Zustellung, statt einen Wegwerf-Vorschau-Beitrag zu leeren.

Aktivieren über `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming modes">
    - `partial` ist die übliche Wahl: ein Vorschau-Beitrag, der bearbeitet wird, während die Antwort wächst, und dann mit der vollständigen Antwort finalisiert wird.
    - `block` verwendet Entwurfs-Chunks im Append-Stil innerhalb des Vorschau-Beitrags.
    - `progress` zeigt während der Generierung eine Statusvorschau und postet die endgültige Antwort erst nach Abschluss.
    - `off` deaktiviert Vorschau-Streaming.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Wenn der Stream nicht an Ort und Stelle finalisiert werden kann (zum Beispiel, weil der Beitrag während des Streams gelöscht wurde), fällt OpenClaw auf das Senden eines neuen finalen Beitrags zurück, damit die Antwort nie verloren geht.
    - Payloads, die nur Reasoning enthalten, werden in Kanalbeiträgen unterdrückt, einschließlich Text, der als `> Reasoning:`-Blockquote ankommt. Setzen Sie `/reasoning on`, um Denken in anderen Oberflächen zu sehen; der finale Mattermost-Beitrag enthält nur die Antwort.
    - Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Kanalzuordnungsmatrix.

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichtentool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolesch), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agent-Sitzung weitergegeben.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (standardmäßig true).
- Override pro Account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Buttons (Nachrichtentool)

Senden Sie Nachrichten mit anklickbaren Buttons. Wenn ein Benutzer auf einen Button klickt, empfängt der Agent die Auswahl und kann antworten.

Aktivieren Sie Buttons, indem Sie `inlineButtons` zu den Kanalfunktionen hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem `buttons`-Parameter. Buttons sind ein 2D-Array (Button-Zeilen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Button-Felder:

<ParamField path="text" type="string" required>
  Anzeigebeschriftung.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Wert, der beim Klicken zurückgesendet wird (wird als Aktions-ID verwendet).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Button-Stil.
</ParamField>

Wenn ein Benutzer auf einen Button klickt:

<Steps>
  <Step title="Buttons durch Bestätigung ersetzt">
    Alle Buttons werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** selected by @user“).
  </Step>
  <Step title="Agent erhält die Auswahl">
    Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementierungshinweise">
    - Button-Callbacks verwenden HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Buttons entfernt — teilweises Entfernen ist nicht möglich.
    - Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Routing-Einschränkung von Mattermost).

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Capability-Strings. Fügen Sie `"inlineButtons"` hinzu, um die Tool-Beschreibung für Buttons im System-Prompt des Agents zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Button-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost das Gateway nicht direkt über dessen Bind-Host erreichen kann.
    - In Setups mit mehreren Konten können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
    - Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` ab und fällt dann auf `http://localhost:<port>` zurück.
    - Erreichbarkeitsregel: Die Button-Callback-URL muss vom Mattermost-Server erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/in demselben Netzwerk-Namespace laufen.
    - Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie seinen Host bzw. seine Domain zu `ServiceSettings.AllowedUntrustedInternalConnections` in Mattermost hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Buttons direkt über die Mattermost-REST-API posten, statt über das `message`-Tool des Agents zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus dem Plugin; wenn Sie rohes JSON posten, befolgen Sie diese Regeln:

**Payload-Struktur:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Kritische Regeln**

1. Anhänge gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dieses Feld werden Klicks stillschweigend verschluckt.
3. Jede Aktion benötigt ein `id`-Feld — Mattermost ignoriert Aktionen ohne IDs.
4. Die `id` einer Aktion darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche brechen das serverseitige Aktionsrouting von Mattermost (gibt 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` des Buttons übereinstimmen, damit die Bestätigungsnachricht den Button-Namen (z. B. „Approve“) statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaktions-Handler gibt ohne dieses Feld 400 zurück.

</Warning>

**HMAC-Token-Erzeugung**

Das Gateway verifiziert Button-Klicks mit HMAC-SHA256. Externe Skripte müssen Token erzeugen, die zur Verifizierungslogik des Gateways passen:

<Steps>
  <Step title="Secret aus dem Bot-Token ableiten">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Kontextobjekt erstellen">
    Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
  </Step>
  <Step title="Mit sortierten Schlüsseln serialisieren">
    Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (das Gateway verwendet `JSON.stringify` mit sortierten Schlüsseln, wodurch kompakte Ausgabe entsteht).
  </Step>
  <Step title="Payload signieren">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Token hinzufügen">
    Fügen Sie den resultierenden Hex-Digest als `_token` im Kontext hinzu.
  </Step>
</Steps>

Python-Beispiel:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Häufige HMAC-Fallstricke">
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, um die kompakte Ausgabe von JavaScript zu erhalten (`{"key":"val"}`).
    - Signieren Sie immer **alle** Kontextfelder (ohne `_token`). Das Gateway entfernt `_token` und signiert dann alles, was übrig bleibt. Das Signieren einer Teilmenge führt zu einem stillschweigenden Verifizierungsfehler.
    - Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann Kontextfelder beim Speichern der Payload neu anordnen.
    - Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret muss über den Prozess, der Buttons erstellt, und das Gateway, das verifiziert, hinweg identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen über die Mattermost-API auflöst. Dadurch werden Ziele wie `#channel-name` und `@username` in `openclaw message send` sowie bei Cron-/Webhook-Zustellungen ermöglicht.

Es ist keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Kontokonfiguration.

## Mehrere Konten

Mattermost unterstützt mehrere Konten unter `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Stellen Sie sicher, dass der Bot im Kanal ist, und erwähnen Sie ihn (oncall), verwenden Sie ein Trigger-Präfix (onchar), oder setzen Sie `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Authentifizierungs- oder Mehrkontofehler">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob das Konto aktiviert ist.
    - Probleme mit mehreren Konten: Umgebungsvariablen gelten nur für das Konto `default`.

  </Accordion>
  <Accordion title="Native Slash-Commands schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Registrierung des Slash-Commands ist beim Start fehlgeschlagen oder wurde nur teilweise abgeschlossen
      - der Callback trifft das falsche Gateway/Konto
      - Mattermost hat noch alte Commands, die auf ein früheres Callback-Ziel zeigen
      - das Gateway wurde neu gestartet, ohne Slash-Commands erneut zu aktivieren
    - Wenn native Slash-Commands nicht mehr funktionieren, prüfen Sie die Logs auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` weggelassen wird und Logs warnen, dass der Callback zu `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine explizite, extern erreichbare `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Probleme mit Buttons">
    - Buttons erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Button-Daten. Prüfen Sie, dass jeder Button sowohl die Felder `text` als auch `callback_data` hat.
    - Buttons werden gerendert, aber Klicks bewirken nichts: Verifizieren Sie, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in ServiceSettings auf `true` gesetzt ist.
    - Buttons geben beim Klicken 404 zurück: Die Button-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Der Aktionsrouter von Mattermost bricht bei nicht alphanumerischen IDs. Verwenden Sie ausschließlich `[a-zA-Z0-9]`.
    - Gateway-Logs zeigen `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON nutzen (keine Leerzeichen). Siehe HMAC-Abschnitt oben.
    - Gateway-Logs zeigen `missing _token in context`: Das Feld `_token` befindet sich nicht im Kontext des Buttons. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
    - Bestätigung zeigt rohe ID statt Button-Namen: `context.action_id` stimmt nicht mit der `id` des Buttons überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Agent kennt Buttons nicht: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungs-Gating
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
