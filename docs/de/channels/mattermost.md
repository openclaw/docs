---
read_when:
    - Mattermost einrichten
    - Mattermost-Routing debuggen
summary: Einrichtung des Mattermost-Bots und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Channels, Gruppen und DMs werden unterstützt.
Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter
[mattermost.com](https://mattermost.com).

## Gebündeltes Plugin

Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation verwenden, die Mattermost ausschließt,
installieren Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokaler Checkout (wenn aus einem Git-Repository ausgeführt):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Mattermost-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
3. Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`).
4. Konfigurieren Sie OpenClaw und starten Sie das Gateway.

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

## Native Slash-Befehle

Native Slash-Befehle sind Opt-in. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über
die Mattermost-API und empfängt Callback-POSTs auf dem HTTP-Server des Gateways.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Verwenden, wenn Mattermost das Gateway nicht direkt erreichen kann (Reverse-Proxy/öffentliche URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Hinweise:

- `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
- Wenn `callbackUrl` weggelassen wird, leitet OpenClaw eine URL aus Gateway-Host/-Port + `callbackPath` ab.
- Für Multi-Account-Setups kann `commands` auf der obersten Ebene oder unter
  `channels.mattermost.accounts.<id>.commands` gesetzt werden (Konto-Werte überschreiben Felder der obersten Ebene).
- Befehls-Callbacks werden mit den pro Befehl zurückgegebenen Tokens validiert,
  die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Befehle registriert.
- Slash-Callbacks schlagen mit Fail-Closed fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgte oder
  das Callback-Token nicht mit einem der registrierten Befehle übereinstimmt.
- Erreichbarkeitsanforderung: Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.
  - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft im selben Host-/Netzwerk-Namespace wie OpenClaw.
  - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse-Proxy an OpenClaw weiter.
  - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.
- Mattermost-Egress-Allowlist-Anforderung:
  - Wenn Ihr Callback private/tailnet/interne Adressen als Ziel hat, setzen Sie Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/Domain enthalten ist.
  - Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.
    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

## Umgebungsvariablen (Standardkonto)

Setzen Sie diese auf dem Gateway-Host, wenn Sie Umgebungsvariablen bevorzugen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Umgebungsvariablen gelten nur für das **Standard**-Konto (`default`). Andere Konten müssen Konfigurationswerte verwenden.

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Channels wird über `chatmode` gesteuert:

- `oncall` (Standard): nur in Channels antworten, wenn per @mention erwähnt.
- `onmessage`: auf jede Channel-Nachricht antworten.
- `onchar`: antworten, wenn eine Nachricht mit einem Trigger-Präfix beginnt.

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

- `onchar` antwortet weiterhin auf explizite @mentions.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threading und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Channels und Gruppen im
Haupt-Channel bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): nur in einem Thread antworten, wenn sich der eingehende Beitrag bereits in einem befindet.
- `first`: bei Channel-/Gruppen-Beiträgen der obersten Ebene einen Thread unter diesem Beitrag starten und die
  Unterhaltung an eine threadbezogene Sitzung weiterleiten.
- `all`: heute in Mattermost dasselbe Verhalten wie `first`.
- Direktnachrichten ignorieren diese Einstellung und bleiben ohne Threading.

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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Wurzel.
- `first` und `all` sind derzeit äquivalent, da, sobald Mattermost eine Thread-Wurzel hat,
  nachfolgende Chunks und Medien in demselben Thread fortgesetzt werden.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channels (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (durch Erwähnung gesteuert).
- Sender mit `channels.mattermost.groupAllowFrom` auf die Allowlist setzen (Benutzer-IDs empfohlen).
- Erwähnungsüberschreibungen pro Channel befinden sich unter `channels.mattermost.groups.<channelId>.requireMention`
  oder `channels.mattermost.groups["*"].requireMention` für einen Standardwert.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Channels: `channels.mattermost.groupPolicy="open"` (durch Erwähnung gesteuert).
- Laufzeithinweis: Wenn `channels.mattermost` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

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

- `channel:<id>` für einen Channel
- `user:<id>` für eine DM
- `@username` für eine DM (über die Mattermost-API aufgelöst)

Reine intransparente IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Channel-ID).

OpenClaw löst sie **zuerst als Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich), sendet OpenClaw eine **DM**, indem der direkte Channel über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Channel-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).

## DM-Channel-Wiederholung

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Channel auflösen muss,
versucht es vorübergehende Fehler bei der Erstellung des direkten Channels standardmäßig erneut.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin abzustimmen,
oder `channels.mattermost.accounts.<id>.dmChannelRetry` für ein einzelnes Konto.

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

- Dies gilt nur für die DM-Channel-Erstellung (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungen gelten für vorübergehende Fehler wie Rate Limits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht erneut versucht.

## Vorschau-Streaming

Mattermost streamt Denken, Tool-Aktivität und teilweisen Antworttext in einen einzelnen **Entwurfs-Vorschau-Beitrag**, der an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Beitrags-ID aktualisiert, anstatt den Channel mit Nachrichten pro Chunk zu fluten. Finale Medien-/Fehlerantworten verwerfen ausstehende Vorschau-Bearbeitungen und verwenden normale Zustellung, anstatt einen Wegwerf-Vorschau-Beitrag zu flushen.

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

Hinweise:

- `partial` ist die übliche Wahl: ein Vorschau-Beitrag, der bearbeitet wird, während die Antwort wächst, und dann mit der vollständigen Antwort finalisiert wird.
- `block` verwendet Entwurfs-Chunks im Append-Stil innerhalb des Vorschau-Beitrags.
- `progress` zeigt während der Generierung eine Statusvorschau an und sendet die endgültige Antwort erst nach Abschluss.
- `off` deaktiviert Vorschau-Streaming.
- Wenn der Stream nicht an Ort und Stelle finalisiert werden kann (zum Beispiel wenn der Beitrag während des Streams gelöscht wurde), sendet OpenClaw ersatzweise einen neuen finalen Beitrag, sodass die Antwort nie verloren geht.
- Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Channel-Zuordnungsmatrix.

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agent-Sitzung übermittelt.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- Überschreibung pro Konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn ein Benutzer auf eine Schaltfläche klickt, empfängt der Agent die
Auswahl und kann antworten.

Aktivieren Sie Schaltflächen, indem Sie `inlineButtons` zu den Channel-Fähigkeiten hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem `buttons`-Parameter. Schaltflächen sind ein 2D-Array (Zeilen mit Schaltflächen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Schaltflächenfelder:

- `text` (erforderlich): angezeigte Beschriftung.
- `callback_data` (erforderlich): Wert, der beim Klicken zurückgesendet wird (wird als Aktions-ID verwendet).
- `style` (optional): `"default"`, `"primary"` oder `"danger"`.

Wenn ein Benutzer auf eine Schaltfläche klickt:

1. Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** ausgewählt von @user“).
2. Der Agent empfängt die Auswahl als eingehende Nachricht und antwortet.

Hinweise:

- Schaltflächen-Callbacks verwenden HMAC-SHA256-Validierung (automatisch, keine Konfiguration erforderlich).
- Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Schaltflächen
  entfernt — eine teilweise Entfernung ist nicht möglich.
- Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt
  (Mattermost-Routing-Einschränkung).

Konfiguration:

- `channels.mattermost.capabilities`: Array von Fähigkeits-Strings. Fügen Sie `"inlineButtons"` hinzu, um
  die Beschreibung des Schaltflächen-Tools im System-Prompt des Agenten zu aktivieren.
- `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-
  Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost das
  Gateway an seinem Bind-Host nicht direkt erreichen kann.
- In Multi-Account-Setups können Sie dasselbe Feld auch unter
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
- Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus
  `gateway.customBindHost` + `gateway.port` ab und greift dann auf `http://localhost:<port>` zurück.
- Erreichbarkeitsregel: Die URL für den Schaltflächen-Callback muss vom Mattermost-Server aus erreichbar sein.
  `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/im selben Netzwerk-Namespace laufen.
- Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie dessen Host/Domain zu Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API posten,
anstatt über das `message`-Tool des Agenten zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus
der Erweiterung; wenn Sie rohes JSON posten, befolgen Sie diese Regeln:

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
            id: "mybutton01", // nur alphanumerisch — siehe unten
            type: "button", // erforderlich, sonst werden Klicks stillschweigend ignoriert
            name: "Approve", // angezeigte Beschriftung
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // muss mit der Button-ID übereinstimmen (für Namensauflösung)
                action: "approve",
                // ... beliebige benutzerdefinierte Felder ...
                _token: "<hmac>", // siehe HMAC-Abschnitt unten
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Kritische Regeln:**

1. Attachments gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dies werden Klicks stillschweigend verschluckt.
3. Jede Aktion benötigt ein Feld `id` — Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche beeinträchtigen
   Mattermosts serverseitiges Aktions-Routing (liefert 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen, damit die Bestätigungsnachricht den
   Namen der Schaltfläche (z. B. „Approve“) statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaktions-Handler gibt ohne dieses Feld 400 zurück.

**HMAC-Token-Erzeugung:**

Das Gateway verifiziert Schaltflächen-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens erzeugen,
die mit der Verifizierungslogik des Gateways übereinstimmen:

1. Leiten Sie das Secret aus dem Bot-Token ab:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
3. Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (das Gateway verwendet `JSON.stringify`
   mit sortierten Schlüsseln, was eine kompakte Ausgabe erzeugt).
4. Signieren: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Fügen Sie den resultierenden Hex-Digest als `_token` zum Kontext hinzu.

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

Häufige HMAC-Stolperfallen:

- Python `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie
  `separators=(",", ":")`, damit es zu Javascripts kompakter Ausgabe passt (`{"key":"val"}`).
- Signieren Sie immer **alle** Kontextfelder (ohne `_token`). Das Gateway entfernt `_token` und
  signiert dann alles Verbleibende. Das Signieren nur einer Teilmenge führt zu einem stillen Verifizierungsfehler.
- Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann
  Kontextfelder beim Speichern der Payload neu anordnen.
- Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret
  muss in dem Prozess, der Schaltflächen erstellt, und im Gateway, das sie verifiziert, identisch sein.

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Channel- und Benutzernamen
über die Mattermost-API auflöst. Dadurch werden `#channel-name`- und `@username`-Ziele in
`openclaw message send` und bei Cron-/Webhook-Zustellungen unterstützt.

Es ist keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Kontokonfiguration.

## Multi-Account

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

- Keine Antworten in Channels: Stellen Sie sicher, dass der Bot im Channel ist und erwähnen Sie ihn (`oncall`), verwenden Sie ein Trigger-Präfix (`onchar`) oder setzen Sie `chatmode: "onmessage"`.
- Authentifizierungsfehler: Prüfen Sie das Bot-Token, die Basis-URL und ob das Konto aktiviert ist.
- Probleme mit Multi-Account: Umgebungsvariablen gelten nur für das Konto `default`.
- Native Slash-Befehle geben `Unauthorized: invalid command token.` zurück: OpenClaw
  hat das Callback-Token nicht akzeptiert. Typische Ursachen:
  - die Registrierung des Slash-Befehls ist fehlgeschlagen oder wurde beim Start nur teilweise abgeschlossen
  - der Callback trifft das falsche Gateway/Konto
  - Mattermost hat noch alte Befehle, die auf ein früheres Callback-Ziel zeigen
  - das Gateway wurde neu gestartet, ohne Slash-Befehle erneut zu aktivieren
- Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf
  `mattermost: failed to register slash commands` oder
  `mattermost: native slash commands enabled but no commands could be registered`.
- Wenn `callbackUrl` weggelassen wird und die Logs warnen, dass der Callback zu
  `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn
  Mattermost auf demselben Host/im selben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen
  eine explizite extern erreichbare `commands.callbackUrl`.
- Schaltflächen erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Schaltflächendaten. Prüfen Sie, ob jede Schaltfläche sowohl die Felder `text` als auch `callback_data` hat.
- Schaltflächen werden gerendert, aber Klicks bewirken nichts: Vergewissern Sie sich, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in ServiceSettings auf `true` gesetzt ist.
- Schaltflächen geben beim Klicken 404 zurück: Die `id` der Schaltfläche enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Aktions-Router funktioniert mit nicht alphanumerischen IDs nicht. Verwenden Sie nur `[a-zA-Z0-9]`.
- Gateway protokolliert `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON (ohne Leerzeichen) nutzen. Siehe den HMAC-Abschnitt oben.
- Gateway protokolliert `missing _token in context`: Das Feld `_token` befindet sich nicht im Kontext der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
- Die Bestätigung zeigt eine rohe ID statt des Namens der Schaltfläche: `context.action_id` stimmt nicht mit der `id` der Schaltfläche überein. Setzen Sie beide auf denselben bereinigten Wert.
- Der Agent kennt keine Schaltflächen: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Channel-Konfiguration hinzu.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung per Erwähnung
- [Channel Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
