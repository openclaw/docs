---
read_when:
    - Mattermost einrichten
    - Fehlersuche beim Mattermost-Routing
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T06:40:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter [mattermost.com](https://mattermost.com).

## Gebündeltes Plugin

<Note>
Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.
</Note>

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Mattermost ausschließt, installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht ist:

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

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten
OpenClaw-Build oder den lokalen Checkout-Pfad, bis ein neueres npm-Paket
veröffentlicht ist.

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

<Steps>
  <Step title="Ensure plugin is available">
    Aktuelle paketierte OpenClaw-Releases bündeln es bereits. Ältere oder benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
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

## Native Slash-Commands

Native Slash-Commands sind optional. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Commands über die Mattermost-API und empfängt Callback-POSTs auf dem Gateway-HTTP-Server.

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
    - Wenn `callbackUrl` ausgelassen wird, leitet OpenClaw sie aus Gateway-Host/Port + `callbackPath` ab.
    - Für Multi-Account-Setups kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` gesetzt werden (Account-Werte überschreiben Felder der obersten Ebene).
    - Command-Callbacks werden mit den pro Command zurückgegebenen Tokens validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Commands registriert.
    - Slash-Callbacks schlagen geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start teilweise erfolgte oder das Callback-Token mit keinem der registrierten Commands übereinstimmt.

  </Accordion>
  <Accordion title="Reachability requirement">
    Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host bzw. in demselben Netzwerk-Namespace wie OpenClaw.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Wenn Ihr Callback auf private/tailnet/interne Adressen zeigt, setzen Sie Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host bzw. die Callback-Domain enthalten ist.

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
    Antworten Sie in Kanälen nur bei @Erwähnung.
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

- `onchar` antwortet weiterhin auf ausdrückliche @Erwähnungen.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im Hauptkanal bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): Nur in einem Thread antworten, wenn der eingehende Beitrag bereits in einem ist.
- `first`: Für Top-Level-Beiträge in Kanälen/Gruppen einen Thread unter diesem Beitrag starten und die Unterhaltung an eine thread-spezifische Sitzung weiterleiten.
- `all`: derzeit dasselbe Verhalten wie `first` für Mattermost.
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

- Thread-spezifische Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Root.
- `first` und `all` sind derzeit äquivalent, da Folge-Chunks und Medien im selben Thread fortgesetzt werden, sobald Mattermost einen Thread-Root hat.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Absender mit `channels.mattermost.groupAllowFrom` erlauben (Benutzer-IDs empfohlen).
- Erwähnungs-Overrides pro Kanal befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true` gesetzt ist.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (erwähnungsgesteuert).
- Laufzeit-Hinweis: Wenn `channels.mattermost` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

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
- `@username` für eine DM (wird über die Mattermost-API aufgelöst)

<Warning>
Unqualifizierte undurchsichtige IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Kanal-ID).

OpenClaw löst sie **benutzerzuerst** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` ist erfolgreich), sendet OpenClaw eine **DM**, indem es den direkten Kanal über `/api/v4/channels/direct` auflöst.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die ausdrücklichen Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholung für DM-Kanäle

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Kanal auflösen muss, wiederholt es standardmäßig vorübergehende Fehler bei der Erstellung direkter Kanäle.

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
- Wiederholungen gelten für vorübergehende Fehler wie Rate Limits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht wiederholt.

## Preview-Streaming

Mattermost streamt Denken, Tool-Aktivität und teilweisen Antworttext in einen einzelnen **Entwurfsvorschau-Beitrag**, der direkt finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Beitrags-ID aktualisiert, statt den Kanal mit Nachrichten pro Chunk zu überfluten. Medien-/Fehlerfinalisierungen brechen ausstehende Vorschauänderungen ab und verwenden die normale Zustellung, statt einen Wegwerf-Vorschau-Beitrag auszugeben.

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
    - `progress` zeigt während der Generierung eine Statusvorschau und postet erst bei Abschluss die endgültige Antwort.
    - `off` deaktiviert Preview-Streaming.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Wenn der Stream nicht direkt finalisiert werden kann (zum Beispiel, wenn der Beitrag mitten im Stream gelöscht wurde), fällt OpenClaw darauf zurück, einen neuen finalen Beitrag zu senden, damit die Antwort nie verloren geht.
    - Payloads, die nur Reasoning enthalten, werden aus Kanalbeiträgen unterdrückt, einschließlich Text, der als `> Reasoning:`-Blockzitat ankommt. Setzen Sie `/reasoning on`, um Denken auf anderen Oberflächen zu sehen; der finale Mattermost-Beitrag enthält nur die Antwort.
    - Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Channel-Mapping-Matrix.

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die geroutete Agentensitzung weitergeleitet.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (standardmäßig true).
- Pro-Account-Override: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Buttons (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Buttons. Wenn ein Benutzer auf einen Button klickt, erhält der Agent die Auswahl und kann antworten.

Aktivieren Sie Buttons, indem Sie `inlineButtons` zu den Kanalfähigkeiten hinzufügen:

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
  Wert, der beim Klick zurückgesendet wird (wird als Aktions-ID verwendet).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Button-Stil.
</ParamField>

Wenn ein Benutzer auf einen Button klickt:

<Steps>
  <Step title="Buttons durch Bestätigung ersetzt">
    Alle Buttons werden durch eine Bestätigungszeile ersetzt (z. B. "✓ **Ja** ausgewählt von @user").
  </Step>
  <Step title="Agent erhält die Auswahl">
    Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementierungshinweise">
    - Button-Callbacks verwenden HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Buttons entfernt — partielles Entfernen ist nicht möglich.
    - Action-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Mattermost-Routing-Einschränkung).

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Capability-Strings. Fügen Sie `"inlineButtons"` hinzu, um die Beschreibung des Button-Tools im System-Prompt des Agents zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Button-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost den Gateway nicht direkt über dessen Bind-Host erreichen kann.
    - In Multi-Account-Setups können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
    - Wenn `interactions.callbackBaseUrl` ausgelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` ab und fällt dann auf `http://localhost:<port>` zurück.
    - Erreichbarkeitsregel: Die Button-Callback-URL muss vom Mattermost-Server erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/in demselben Netzwerk-Namespace laufen.
    - Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie dessen Host/Domain zu Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

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

1. Attachments gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird stillschweigend ignoriert).
2. Jede Action benötigt `type: "button"` — ohne dies werden Klicks stillschweigend verschluckt.
3. Jede Action benötigt ein `id`-Feld — Mattermost ignoriert Actions ohne IDs.
4. Action-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche unterbrechen Mattermosts serverseitiges Action-Routing (gibt 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` des Buttons übereinstimmen, damit die Bestätigungsnachricht den Button-Namen (z. B. "Approve") statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaction-Handler gibt ohne dieses Feld 400 zurück.

</Warning>

**HMAC-Token-Generierung**

Der Gateway verifiziert Button-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens generieren, die zur Verifizierungslogik des Gateways passen:

<Steps>
  <Step title="Secret aus dem Bot-Token ableiten">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Context-Objekt erstellen">
    Erstellen Sie das Context-Objekt mit allen Feldern **außer** `_token`.
  </Step>
  <Step title="Mit sortierten Schlüsseln serialisieren">
    Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (der Gateway verwendet `JSON.stringify` mit sortierten Schlüsseln, was kompakte Ausgabe erzeugt).
  </Step>
  <Step title="Payload signieren">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Token hinzufügen">
    Fügen Sie den resultierenden Hex-Digest als `_token` im Context hinzu.
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
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, um die kompakte Ausgabe von JavaScript (`{"key":"val"}`) zu erzeugen.
    - Signieren Sie immer **alle** Context-Felder (ohne `_token`). Der Gateway entfernt `_token` und signiert dann alles Verbleibende. Das Signieren einer Teilmenge führt zu einem stillen Verifizierungsfehler.
    - Verwenden Sie `sort_keys=True` — der Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann Context-Felder beim Speichern der Payload neu anordnen.
    - Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret muss im Prozess, der Buttons erstellt, und im Gateway, der verifiziert, identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen über die Mattermost-API auflöst. Dies ermöglicht Ziele wie `#channel-name` und `@username` in `openclaw message send` sowie in Cron-/Webhook-Zustellungen.

Es ist keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Account-Konfiguration.

## Multi-Account

Mattermost unterstützt mehrere Accounts unter `channels.mattermost.accounts`:

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
  <Accordion title="Auth- oder Multi-Account-Fehler">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob der Account aktiviert ist.
    - Multi-Account-Probleme: Env-Vars gelten nur für den `default`-Account.

  </Accordion>
  <Accordion title="Native Slash-Befehle schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Registrierung des Slash-Befehls ist beim Start fehlgeschlagen oder nur teilweise abgeschlossen worden
      - Der Callback trifft den falschen Gateway/Account
      - Mattermost hat noch alte Befehle, die auf ein vorheriges Callback-Ziel zeigen
      - Der Gateway wurde neu gestartet, ohne Slash-Befehle erneut zu aktivieren
    - Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` ausgelassen wird und Logs warnen, dass der Callback zu `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen ein explizites, extern erreichbares `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Button-Probleme">
    - Buttons erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Button-Daten. Prüfen Sie, dass jeder Button sowohl `text`- als auch `callback_data`-Felder hat.
    - Buttons werden gerendert, aber Klicks bewirken nichts: Verifizieren Sie, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in ServiceSettings `true` ist.
    - Buttons geben beim Klicken 404 zurück: Die Button-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Action-Router schlägt bei nicht alphanumerischen IDs fehl. Verwenden Sie nur `[a-zA-Z0-9]`.
    - Gateway-Logs zeigen `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Context-Felder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON nutzen (keine Leerzeichen). Siehe den HMAC-Abschnitt oben.
    - Gateway-Logs zeigen `missing _token in context`: Das `_token`-Feld ist nicht im Context des Buttons. Stellen Sie sicher, dass es beim Erstellen der Integration-Payload enthalten ist.
    - Die Bestätigung zeigt eine rohe ID statt des Button-Namens: `context.action_id` stimmt nicht mit der `id` des Buttons überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Agent kennt Buttons nicht: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
