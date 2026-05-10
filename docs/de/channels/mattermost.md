---
read_when:
    - Mattermost einrichten
    - Mattermost-Routing debuggen
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: herunterladbares Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter [mattermost.com](https://mattermost.com).

## Installieren

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
  <Step title="Sicherstellen, dass das Plugin verfügbar ist">
    Aktuelle paketierte OpenClaw-Releases enthalten es bereits. Ältere/angepasste Installationen können es mit den obigen Befehlen manuell hinzufügen.
  </Step>
  <Step title="Einen Mattermost-Bot erstellen">
    Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie den **Bot-Token**.
  </Step>
  <Step title="Die Basis-URL kopieren">
    Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw konfigurieren und den Gateway starten">
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

Native Slash-Befehle sind Opt-in. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über die Mattermost-API und empfängt Callback-POSTs auf dem Gateway-HTTP-Server.

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
  <Accordion title="Verhaltenshinweise">
    - `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
    - Wenn `callbackUrl` weggelassen wird, leitet OpenClaw eine URL aus Gateway-Host/Port + `callbackPath` ab.
    - Bei Setups mit mehreren Konten kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` festgelegt werden (Kontowerte überschreiben Felder der obersten Ebene).
    - Befehls-Callbacks werden mit den pro Befehl geltenden Tokens validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Befehle registriert.
    - OpenClaw aktualisiert die aktuelle Mattermost-Befehlsregistrierung, bevor jeder Callback akzeptiert wird, sodass veraltete Tokens aus gelöschten oder neu generierten Slash-Befehlen nicht ohne Gateway-Neustart weiter akzeptiert werden.
    - Die Callback-Validierung schlägt geschlossen fehl, wenn die Mattermost-API nicht bestätigen kann, dass der Befehl noch aktuell ist; fehlgeschlagene Validierungen werden kurz zwischengespeichert, gleichzeitige Lookups werden zusammengeführt, und neue Lookup-Starts werden pro Befehl rate-limitiert, um Replay-Druck zu begrenzen.
    - Slash-Callbacks schlagen geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise abgeschlossen wurde oder der Callback-Token nicht mit dem registrierten Token des aufgelösten Befehls übereinstimmt (ein Token, der für einen Befehl gültig ist, kann keine Upstream-Validierung für einen anderen Befehl erreichen).

  </Accordion>
  <Accordion title="Erreichbarkeitsanforderung">
    Der Callback-Endpunkt muss vom Mattermost-Server erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost-Egress-Allowlist">
    Wenn Ihr Callback auf private/tailnet/interne Adressen zielt, setzen Sie Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/die Callback-Domain enthalten ist.

    Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.

    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen (Standardkonto)

Setzen Sie diese auf dem Gateway-Host, wenn Sie Umgebungsvariablen bevorzugen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Umgebungsvariablen gelten nur für das **Standardkonto** (`default`). Andere Konten müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).
</Note>

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Kanalverhalten wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (default)">
    Nur antworten, wenn in Kanälen @erwähnt.
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

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Kanal- und Gruppenantworten im Hauptkanal bleiben oder einen Thread unter dem auslösenden Post starten.

- `off` (Standard): nur in einem Thread antworten, wenn der eingehende Post bereits in einem ist.
- `first`: Für Top-Level-Kanal-/Gruppen-Posts einen Thread unter diesem Post starten und die Unterhaltung an eine threadbezogene Sitzung weiterleiten.
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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Posts als Thread-Root.
- `first` und `all` sind derzeit äquivalent, da Folge-Chunks und Medien in demselben Thread fortgesetzt werden, sobald Mattermost einen Thread-Root hat.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` akzeptiert `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Absender mit `channels.mattermost.groupAllowFrom` auf die Allowlist setzen (Benutzer-IDs empfohlen).
- `channels.mattermost.groupAllowFrom` akzeptiert `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).
- Erwähnungsüberschreibungen pro Kanal befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
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
Bloße opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID gegenüber Kanal-ID).

OpenClaw löst sie **benutzerzuerst** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich ist), sendet OpenClaw eine **DM**, indem der direkte Kanal über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholung für DM-Kanal

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Kanal auflösen muss, wiederholt es standardmäßig vorübergehende Fehler beim Erstellen des direkten Kanals.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen, oder `channels.mattermost.accounts.<id>.dmChannelRetry` für ein Konto.

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

Mattermost streamt Denken, Tool-Aktivität und partiellen Antworttext in einen einzelnen **Entwurfsvorschau-Post**, der direkt finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Post-ID aktualisiert, anstatt den Kanal mit Nachrichten pro Chunk zu überfluten. Medien-/Fehler-Finals brechen ausstehende Vorschauänderungen ab und verwenden die normale Zustellung, statt einen Wegwerf-Vorschau-Post zu leeren.

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
  <Accordion title="Streaming-Modi">
    - `partial` ist die übliche Wahl: ein Vorschau-Post, der bearbeitet wird, während die Antwort wächst, und anschließend mit der vollständigen Antwort finalisiert wird.
    - `block` verwendet Entwurfs-Chunks im Append-Stil innerhalb des Vorschau-Posts.
    - `progress` zeigt während der Generierung eine Statusvorschau und postet die endgültige Antwort erst nach Abschluss.
    - `off` deaktiviert Preview-Streaming.

  </Accordion>
  <Accordion title="Hinweise zum Streaming-Verhalten">
    - Wenn der Stream nicht direkt finalisiert werden kann (zum Beispiel, weil der Post mitten im Stream gelöscht wurde), fällt OpenClaw darauf zurück, einen neuen finalen Post zu senden, damit die Antwort nie verloren geht.
    - Reine Reasoning-Payloads werden aus Kanal-Posts unterdrückt, einschließlich Text, der als `> Reasoning:`-Blockzitat eintrifft. Setzen Sie `/reasoning on`, um Denken in anderen Oberflächen zu sehen; der finale Mattermost-Post enthält nur die Antwort.
    - Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Channel-Mapping-Matrix.

  </Accordion>
</AccordionGroup>

## Reaktionen (Message-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Post-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolesch), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die geroutete Agent-Sitzung weitergeleitet.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard true).
- Überschreibung pro Konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Buttons (Message-Tool)

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
  Anzeigebezeichnung.
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
    Alle Buttons werden durch eine Bestätigungszeile ersetzt (z. B. "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent erhält die Auswahl">
    Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementierungshinweise">
    - Button-Callbacks verwenden HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Buttons entfernt - partielles Entfernen ist nicht möglich.
    - Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Mattermost-Routing-Einschränkung).

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Capability-Strings. Fügen Sie `"inlineButtons"` hinzu, um die Beschreibung des Button-Tools im System-Prompt des Agenten zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Button-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost den Gateway unter seinem Bind-Host nicht direkt erreichen kann.
    - In Multi-Account-Setups können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
    - Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` ab und fällt dann auf `http://localhost:<port>` zurück.
    - Erreichbarkeitsregel: Die Button-Callback-URL muss vom Mattermost-Server erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/Netzwerk-Namespace ausgeführt werden.
    - Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie seinen Host/seine Domain zu Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Buttons direkt über die Mattermost-REST-API posten, statt über das `message`-Tool des Agenten zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus dem Plugin; wenn Sie Raw-JSON posten, befolgen Sie diese Regeln:

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
            id: "mybutton01", // alphanumeric only - see below
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
2. Jede Aktion benötigt `type: "button"` - ohne dies werden Klicks stillschweigend verschluckt.
3. Jede Aktion benötigt ein `id`-Feld - Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche unterbrechen das serverseitige Aktions-Routing von Mattermost (gibt 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` des Buttons übereinstimmen, damit die Bestätigungsnachricht den Button-Namen (z. B. "Approve") statt einer Raw-ID anzeigt.
6. `context.action_id` ist erforderlich - der Interaktions-Handler gibt ohne sie 400 zurück.

</Warning>

**HMAC-Token-Generierung**

Der Gateway verifiziert Button-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens generieren, die zur Verifizierungslogik des Gateway passen:

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
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, um zur kompakten Ausgabe von JavaScript zu passen (`{"key":"val"}`).
    - Signieren Sie immer **alle** Context-Felder (abzüglich `_token`). Der Gateway entfernt `_token` und signiert dann alles Verbleibende. Das Signieren einer Teilmenge führt zu einem stillschweigenden Verifizierungsfehler.
    - Verwenden Sie `sort_keys=True` - der Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann Context-Felder beim Speichern der Payload neu anordnen.
    - Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret muss in dem Prozess, der Buttons erstellt, und im Gateway, der verifiziert, identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen über die Mattermost-API auflöst. Dies ermöglicht Ziele wie `#channel-name` und `@username` in `openclaw message send` sowie in Cron-/Webhook-Zustellungen.

Es ist keine Konfiguration erforderlich - der Adapter verwendet das Bot-Token aus der Account-Konfiguration.

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
  <Accordion title="Authentifizierungs- oder Multi-Account-Fehler">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob der Account aktiviert ist.
    - Multi-Account-Probleme: Env-Vars gelten nur für den `default`-Account.

  </Accordion>
  <Accordion title="Native Slash-Befehle schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Registrierung des Slash-Befehls ist beim Start fehlgeschlagen oder nur teilweise abgeschlossen
      - der Callback trifft den falschen Gateway/Account
      - Mattermost hat noch alte Befehle, die auf ein früheres Callback-Ziel zeigen
      - der Gateway wurde neu gestartet, ohne Slash-Befehle erneut zu aktivieren
    - Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` weggelassen wird und Logs warnen, dass der Callback zu `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host/Netzwerk-Namespace wie OpenClaw ausgeführt wird. Setzen Sie stattdessen eine explizite, extern erreichbare `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Button-Probleme">
    - Buttons erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Button-Daten. Prüfen Sie, dass jeder Button sowohl `text`- als auch `callback_data`-Felder hat.
    - Buttons werden gerendert, aber Klicks bewirken nichts: Verifizieren Sie, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in ServiceSettings `true` ist.
    - Buttons geben beim Klicken 404 zurück: Die Button-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Der Aktionsrouter von Mattermost bricht bei nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
    - Gateway-Logs zeigen `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Context-Felder signieren (nicht eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON nutzen (keine Leerzeichen). Siehe den HMAC-Abschnitt oben.
    - Gateway-Logs zeigen `missing _token in context`: Das Feld `_token` befindet sich nicht im Context des Buttons. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
    - Bestätigung zeigt Raw-ID statt Button-Namen: `context.action_id` stimmt nicht mit der `id` des Buttons überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Agent kennt Buttons nicht: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Kanäle: Übersicht](/de/channels) - alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Mention-Gating
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
