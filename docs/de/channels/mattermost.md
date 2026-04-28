---
read_when:
    - Mattermost einrichten
    - Fehlerbehebung beim Mattermost-Routing
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Channels, Gruppen und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter [mattermost.com](https://mattermost.com).

## Gebündeltes Plugin

<Note>
Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, daher ist bei normalen Paket-Builds keine separate Installation erforderlich.
</Note>

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation verwenden, die Mattermost ausschließt, installieren Sie es manuell:

<Tabs>
  <Tab title="npm-Registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokaler Checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

<Steps>
  <Step title="Sicherstellen, dass das Plugin verfügbar ist">
    Aktuelle paketierte OpenClaw-Releases enthalten es bereits. Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
  </Step>
  <Step title="Einen Mattermost-Bot erstellen">
    Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
  </Step>
  <Step title="Die Basis-URL kopieren">
    Kopieren Sie die **Basis-URL** von Mattermost (z. B. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw konfigurieren und das Gateway starten">
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

Native Slash-Befehle sind optional. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über die Mattermost-API und empfängt Callback-POSTs auf dem HTTP-Server des Gateway.

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

<AccordionGroup>
  <Accordion title="Hinweise zum Verhalten">
    - `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
    - Wenn `callbackUrl` weggelassen wird, leitet OpenClaw sie aus Gateway-Host/-Port + `callbackPath` ab.
    - Für Setups mit mehreren Accounts kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` gesetzt werden (Account-Werte überschreiben Felder auf oberster Ebene).
    - Befehls-Callbacks werden mit den pro Befehl zurückgegebenen Token validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Befehle registriert.
    - Slash-Callbacks schlagen fail-closed fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgt ist oder das Callback-Token nicht mit einem der registrierten Befehle übereinstimmt.

  </Accordion>
  <Accordion title="Anforderung an die Erreichbarkeit">
    Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, außer Mattermost läuft auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, außer diese URL leitet `/api/channels/mattermost/command` per Reverse-Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost-Egress-Allowlist">
    Wenn Ihr Callback auf private/Tailnet-/interne Adressen abzielt, setzen Sie in Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host bzw. die Callback-Domain enthalten ist.

    Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.

    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen (Standardkonto)

Setzen Sie diese auf dem Gateway-Host, wenn Sie lieber Umgebungsvariablen verwenden:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Umgebungsvariablen gelten nur für das **Standardkonto** (`default`). Andere Konten müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).
</Note>

## Chatmodi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Channels wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (Standard)">
    Nur in Channels antworten, wenn eine @Erwähnung erfolgt.
  </Tab>
  <Tab title="onmessage">
    Auf jede Channel-Nachricht antworten.
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

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Channels und Gruppen im Haupt-Channel bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): nur in einem Thread antworten, wenn sich der eingehende Beitrag bereits in einem befindet.
- `first`: bei Top-Level-Beiträgen in Channels/Gruppen einen Thread unter diesem Beitrag starten und die Konversation an eine threadbezogene Sitzung weiterleiten.
- `all`: derzeit in Mattermost dasselbe Verhalten wie `first`.
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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Wurzel.
- `first` und `all` sind derzeit gleichwertig, weil nach dem Vorhandensein einer Thread-Wurzel in Mattermost nachfolgende Chunks und Medien in demselben Thread fortgesetzt werden.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigung über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channels (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (durch Erwähnung gesteuert).
- Sender mit `channels.mattermost.groupAllowFrom` auf die Allowlist setzen (Benutzer-IDs empfohlen).
- Erwähnungsüberschreibungen pro Channel befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Channels: `channels.mattermost.groupPolicy="open"` (durch Erwähnung gesteuert).
- Laufzeithinweis: Wenn `channels.mattermost` vollständig fehlt, greift die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

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

<Warning>
Reine opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Channel-ID).

OpenClaw löst sie **zuerst als Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich), sendet OpenClaw eine **DM**, indem der Direkt-Channel über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Channel-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholung bei DM-Channel-Auflösung

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und dafür zuerst den Direkt-Channel auflösen muss, versucht es vorübergehende Fehler bei der Erstellung von Direkt-Channels standardmäßig erneut.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen, oder `channels.mattermost.accounts.<id>.dmChannelRetry` für ein einzelnes Konto.

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

- Dies gilt nur für die Erstellung von DM-Channels (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungen gelten für vorübergehende Fehler wie Ratenlimits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht erneut versucht.

## Vorschau-Streaming

Mattermost streamt Denken, Tool-Aktivität und teilweisen Antworttext in einen einzigen **Entwurfs-Vorschau-Beitrag**, der an Ort und Stelle finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Beitrags-ID aktualisiert, statt den Channel mit Nachrichten pro Chunk zu überfluten. Finale Medien-/Fehlerantworten brechen ausstehende Vorschau-Bearbeitungen ab und verwenden normale Zustellung, statt einen wegwerfbaren Vorschau-Beitrag zu flushen.

Aktivierung über `channels.mattermost.streaming`:

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
    - `partial` ist die übliche Wahl: ein Vorschau-Beitrag, der bearbeitet wird, während die Antwort wächst, und dann mit der vollständigen Antwort finalisiert wird.
    - `block` verwendet Entwurfs-Chunks im Anhänge-Stil innerhalb des Vorschau-Beitrags.
    - `progress` zeigt während der Generierung eine Statusvorschau und veröffentlicht die endgültige Antwort erst nach Abschluss.
    - `off` deaktiviert Vorschau-Streaming.

  </Accordion>
  <Accordion title="Hinweise zum Streaming-Verhalten">
    - Wenn der Stream nicht an Ort und Stelle finalisiert werden kann (zum Beispiel wenn der Beitrag während des Streams gelöscht wurde), greift OpenClaw auf das Senden eines neuen finalen Beitrags zurück, damit die Antwort nie verloren geht.
    - Reine Reasoning-Payloads werden in Channel-Beiträgen unterdrückt, einschließlich Text, der als `> Reasoning:`-Blockquote ankommt. Setzen Sie `/reasoning on`, um das Denken auf anderen Oberflächen zu sehen; der finale Mattermost-Beitrag enthält nur die Antwort.
    - Die Zuordnungsmatrix für Channels finden Sie unter [Streaming](/de/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (Boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agentensitzung übermittelt.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- Überschreibung pro Konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn ein Benutzer auf eine Schaltfläche klickt, erhält der Agent die Auswahl und kann darauf antworten.

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

Verwenden Sie `message action=send` mit einem Parameter `buttons`. Schaltflächen sind ein 2D-Array (Zeilen von Schaltflächen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Schaltflächenfelder:

<ParamField path="text" type="string" required>
  Anzuzeigende Beschriftung.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Beim Klick zurückgesendeter Wert (wird als Aktions-ID verwendet).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Stil der Schaltfläche.
</ParamField>

Wenn ein Benutzer auf eine Schaltfläche klickt:

<Steps>
  <Step title="Schaltflächen werden durch eine Bestätigung ersetzt">
    Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** ausgewählt von @user“).
  </Step>
  <Step title="Agent erhält die Auswahl">
    Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hinweise zur Implementierung">
    - Für Schaltflächen-Callbacks wird HMAC-SHA256-Verifizierung verwendet (automatisch, keine Konfiguration erforderlich).
    - Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klick alle Schaltflächen entfernt — eine teilweise Entfernung ist nicht möglich.
    - Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Routing-Einschränkung in Mattermost).

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Fähigkeits-Strings. Fügen Sie `"inlineButtons"` hinzu, um die Tool-Beschreibung für Schaltflächen im Agenten-System-Prompt zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie diese, wenn Mattermost das Gateway unter seinem Bind-Host nicht direkt erreichen kann.
    - In Setups mit mehreren Accounts können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
    - Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` ab und greift dann auf `http://localhost:<port>` zurück.
    - Erreichbarkeitsregel: Die Schaltflächen-Callback-URL muss vom Mattermost-Server aus erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/im selben Netzwerk-Namespace laufen.
    - Wenn Ihr Callback-Ziel privat/Tailnet/intern ist, fügen Sie dessen Host/Domain zu `ServiceSettings.AllowedUntrustedInternalConnections` in Mattermost hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API veröffentlichen, statt über das `message`-Tool des Agenten zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus dem Plugin; wenn Sie rohes JSON senden, befolgen Sie diese Regeln:

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
            id: "mybutton01", // alphanumerisch nur — siehe unten
            type: "button", // erforderlich, sonst werden Klicks stillschweigend ignoriert
            name: "Approve", // Anzeigebeschriftung
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // muss mit der Schaltflächen-ID übereinstimmen (für die Namensauflösung)
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

<Warning>
**Wichtige Regeln**

1. Attachments gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dies werden Klicks stillschweigend geschluckt.
3. Jede Aktion benötigt ein Feld `id` — Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche brechen das serverseitige Aktions-Routing von Mattermost (liefert 404). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen, damit in der Bestätigungsnachricht der Schaltflächenname (z. B. „Approve“) statt einer rohen ID angezeigt wird.
6. `context.action_id` ist erforderlich — der Interaktions-Handler gibt ohne diesen Wert 400 zurück.
</Warning>

**HMAC-Token-Erzeugung**

Das Gateway verifiziert Schaltflächenklicks mit HMAC-SHA256. Externe Skripte müssen Token erzeugen, die der Verifizierungslogik des Gateway entsprechen:

<Steps>
  <Step title="Das Geheimnis aus dem Bot-Token ableiten">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Das Kontextobjekt erstellen">
    Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
  </Step>
  <Step title="Mit sortierten Schlüsseln serialisieren">
    Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (das Gateway verwendet `JSON.stringify` mit sortierten Schlüsseln, was kompakte Ausgabe erzeugt).
  </Step>
  <Step title="Die Payload signieren">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Das Token hinzufügen">
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
  <Accordion title="Häufige HMAC-Stolperfallen">
    - `json.dumps` in Python fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, damit die kompakte Ausgabe von JavaScript übereinstimmt (`{"key":"val"}`).
    - Signieren Sie immer **alle** Kontextfelder (ohne `_token`). Das Gateway entfernt `_token` und signiert dann alles Verbleibende. Das Signieren einer Teilmenge führt zu stillschweigendem Verifizierungsfehler.
    - Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann Kontextfelder beim Speichern der Payload neu anordnen.
    - Leiten Sie das Geheimnis aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Geheimnis muss in dem Prozess, der Schaltflächen erstellt, und im Gateway, das sie verifiziert, identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Channel- und Benutzernamen über die Mattermost-API auflöst. Dadurch werden `#channel-name`- und `@username`-Ziele in `openclaw message send` sowie bei Cron-/Webhook-Zustellungen ermöglicht.

Es ist keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Account-Konfiguration.

## Mehrere Accounts

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
  <Accordion title="Keine Antworten in Channels">
    Stellen Sie sicher, dass sich der Bot im Channel befindet und erwähnt wird (oncall), verwenden Sie ein Trigger-Präfix (onchar), oder setzen Sie `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Authentifizierungs- oder Mehrfach-Account-Fehler">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob der Account aktiviert ist.
    - Probleme mit mehreren Accounts: Umgebungsvariablen gelten nur für den `default`-Account.

  </Accordion>
  <Accordion title="Native Slash-Befehle schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Registrierung des Slash-Befehls ist fehlgeschlagen oder beim Start nur teilweise abgeschlossen worden.
      - Das Callback trifft das falsche Gateway/den falschen Account.
      - Mattermost hat noch alte Befehle, die auf ein vorheriges Callback-Ziel zeigen.
      - Das Gateway wurde neu gestartet, ohne die Slash-Befehle erneut zu aktivieren.
    - Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` weggelassen wird und Logs warnen, dass das Callback zu `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host/im selben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine explizite extern erreichbare `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Probleme mit Schaltflächen">
    - Schaltflächen erscheinen als weiße Kästchen: Der Agent sendet möglicherweise fehlerhafte Schaltflächendaten. Prüfen Sie, ob jede Schaltfläche sowohl `text`- als auch `callback_data`-Felder hat.
    - Schaltflächen werden gerendert, aber Klicks bewirken nichts: Prüfen Sie, ob `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und ob `EnablePostActionIntegration` in `ServiceSettings` auf `true` gesetzt ist.
    - Schaltflächen geben beim Klick 404 zurück: Die Schaltflächen-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Aktionsrouter funktioniert nicht mit nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
    - Gateway-Logs `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, ob Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON (ohne Leerzeichen) verwenden. Siehe den HMAC-Abschnitt oben.
    - Gateway-Logs `missing _token in context`: Das Feld `_token` fehlt im Kontext der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
    - In der Bestätigung wird die rohe ID statt des Schaltflächennamens angezeigt: `context.action_id` stimmt nicht mit der `id` der Schaltfläche überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Der Agent weiß nichts über Schaltflächen: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Channel-Konfiguration hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Inhalte

- [Channel-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Channels-Überblick](/de/channels) — alle unterstützten Channels
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung per Erwähnung
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
