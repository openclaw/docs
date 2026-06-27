---
read_when:
    - Mattermost einrichten
    - Mattermost-Routing debuggen
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Status: herunterladbares Plugin (Bot-Token + WebSocket-Ereignisse). Channels, Gruppen und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter [mattermost.com](https://mattermost.com).

## Installieren

Installieren Sie Mattermost, bevor Sie den Channel konfigurieren:

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

## Schnelle Einrichtung

<Steps>
  <Step title="Sicherstellen, dass das Plugin verfügbar ist">
    Installieren Sie `@openclaw/mattermost` mit dem obigen Befehl und starten Sie anschließend den Gateway neu, falls er bereits ausgeführt wird.
  </Step>
  <Step title="Mattermost-Bot erstellen">
    Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
  </Step>
  <Step title="Basis-URL kopieren">
    Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw konfigurieren und Gateway starten">
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
  <Accordion title="Hinweise zum Verhalten">
    - `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
    - Wenn `callbackUrl` weggelassen wird, leitet OpenClaw eine URL aus Gateway-Host/Port + `callbackPath` ab.
    - Für Multi-Account-Einrichtungen kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` gesetzt werden (Kontowerte überschreiben Felder auf oberster Ebene).
    - Befehls-Callbacks werden mit den pro Befehl zurückgegebenen Token validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*`-Befehle registriert.
    - OpenClaw aktualisiert die aktuelle Mattermost-Befehlsregistrierung, bevor jeder Callback akzeptiert wird, sodass veraltete Token von gelöschten oder neu generierten Slash-Befehlen ohne Gateway-Neustart nicht mehr akzeptiert werden.
    - Die Callback-Validierung schlägt geschlossen fehl, wenn die Mattermost-API nicht bestätigen kann, dass der Befehl noch aktuell ist; fehlgeschlagene Validierungen werden kurz zwischengespeichert, gleichzeitige Lookups werden zusammengeführt, und Starts frischer Lookups werden pro Befehl ratenbegrenzt, um Wiedergabedruck zu begrenzen.
    - Slash-Callbacks schlagen geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgreich war oder das Callback-Token nicht mit dem registrierten Token des aufgelösten Befehls übereinstimmt (ein für einen Befehl gültiges Token kann die Upstream-Validierung für einen anderen Befehl nicht erreichen).

  </Accordion>
  <Accordion title="Erreichbarkeitsanforderung">
    Der Callback-Endpunkt muss vom Mattermost-Server erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost-Egress-Allowlist">
    Wenn Ihr Callback private/Tailnet-/interne Adressen ansteuert, setzen Sie Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/die Callback-Domain enthalten ist.

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

Mattermost antwortet automatisch auf DMs. Das Channel-Verhalten wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (Standard)">
    Nur antworten, wenn in Channels per @ erwähnt.
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

- `onchar` reagiert weiterhin auf explizite @Erwähnungen.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.
- Nachdem der Bot in einem Channel-Thread eine sichtbare Antwort gesendet hat, werden spätere Nachrichten im selben Thread ohne neue @Erwähnung oder `onchar`-Präfix beantwortet, sodass mehrstufige Thread-Unterhaltungen weiterlaufen. Die Teilnahme wird für 7 Tage Thread-Inaktivität gespeichert (bei jeder Antwort aufgefrischt) und bleibt über Gateway-Neustarts hinweg bestehen. Threads, die der Bot nur beobachtet hat, sind nicht betroffen; starten Sie eine neue Top-Level-Nachricht, um wieder eine explizite Erwähnung zu verlangen.

## Threading und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Channel- und Gruppenantworten im Haupt-Channel bleiben oder einen Thread unter dem auslösenden Post starten.

- `off` (Standard): nur in einem Thread antworten, wenn der eingehende Post bereits in einem ist.
- `first`: bei Top-Level-Channel-/Gruppen-Posts einen Thread unter diesem Post starten und die Unterhaltung an eine Thread-bezogene Sitzung weiterleiten.
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

- Thread-bezogene Sitzungen verwenden die ID des auslösenden Posts als Thread-Stamm.
- `first` und `all` sind derzeit äquivalent, weil Folge-Chunks und Medien im selben Thread fortgesetzt werden, sobald Mattermost einen Thread-Stamm hat.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Kopplungscode).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` akzeptiert `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).

## Channels (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Absender mit `channels.mattermost.groupAllowFrom` erlauben (Benutzer-IDs empfohlen).
- `channels.mattermost.groupAllowFrom` akzeptiert `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).
- Erwähnungsüberschreibungen pro Channel befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder `channels.mattermost.groups["*"].requireMention` als Standardwert.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Channels: `channels.mattermost.groupPolicy="open"` (erwähnungsgesteuert).
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

- `channel:<id>` für einen Channel
- `user:<id>` für eine DM
- `@username` für eine DM (über die Mattermost-API aufgelöst)

<Warning>
Bloße opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Channel-ID).

OpenClaw löst sie **benutzerzuerst** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` succeeds), sendet OpenClaw eine **DM**, indem der direkte Channel über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Channel-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## DM-Channel-Wiederholung

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Channel auflösen muss, wiederholt es vorübergehende Fehler bei der Erstellung des direkten Channels standardmäßig.

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

- Dies gilt nur für die Erstellung von DM-Channels (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungen gelten für vorübergehende Fehler wie Ratenlimits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht erneut versucht.

## Preview-Streaming

Mattermost streamt Denkprozesse, Tool-Aktivität und Teilantworttext in einen einzelnen **Entwurfsvorschau-Post**, der direkt finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Post-ID aktualisiert, statt den Channel mit Nachrichten pro Chunk zu fluten. Medien-/Fehler-Endzustände brechen ausstehende Vorschau-Bearbeitungen ab und verwenden normale Zustellung, statt einen wegwerfbaren Vorschau-Post zu flushen.

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
    - `partial` ist die übliche Wahl: ein Vorschau-Post, der bearbeitet wird, während die Antwort wächst, und dann mit der vollständigen Antwort finalisiert wird.
    - `block` verwendet Entwurfs-Chunks im Append-Stil innerhalb des Vorschau-Posts.
    - `progress` zeigt während der Generierung eine Statusvorschau und postet die endgültige Antwort erst nach Abschluss.
    - `off` deaktiviert Preview-Streaming.

  </Accordion>
  <Accordion title="Hinweise zum Streaming-Verhalten">
    - Wenn der Stream nicht direkt finalisiert werden kann (zum Beispiel weil der Post während des Streams gelöscht wurde), fällt OpenClaw auf das Senden eines frischen finalen Posts zurück, damit die Antwort nie verloren geht.
    - Payloads, die nur Denkprozesse enthalten, werden aus Channel-Posts unterdrückt, einschließlich Text, der als `> Thinking`-Blockquote eintrifft. Setzen Sie `/reasoning on`, um Denkprozesse in anderen Oberflächen zu sehen; der finale Mattermost-Post enthält nur die Antwort.
    - Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Channel-Mapping-Matrix.

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichtentool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Post-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolesch), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die geroutete Agentensitzung weitergeleitet.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (standardmäßig true).
- Überschreibung pro Konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Buttons (Nachrichtentool)

Senden Sie Nachrichten mit anklickbaren Buttons. Wenn ein Benutzer auf einen Button klickt, erhält der Agent die Auswahl und kann antworten.

Normale Agent-Antworten können auch semantische `presentation`-Payloads enthalten. OpenClaw rendert Value-Schaltflächen als interaktive Mattermost-Schaltflächen, hält URL-Schaltflächen im Nachrichtentext sichtbar und stuft Auswahlmenüs zu lesbarem Text herab.

Aktivieren Sie Schaltflächen, indem Sie `inlineButtons` zu den Channel-Capabilities hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem `buttons`-Parameter. Schaltflächen sind ein 2D-Array (Zeilen von Schaltflächen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Schaltflächenfelder:

<ParamField path="text" type="string" required>
  Anzeigebezeichnung.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Wert, der beim Klicken zurückgesendet wird (als Aktions-ID verwendet).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Schaltflächenstil.
</ParamField>

Wenn ein Benutzer auf eine Schaltfläche klickt:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent receives the selection">
    Der Agent empfängt die Auswahl als eingehende Nachricht und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Schaltflächen-Callbacks verwenden HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Schaltflächen entfernt - eine teilweise Entfernung ist nicht möglich.
    - Aktions-IDs, die Bindestriche oder Unterstriche enthalten, werden automatisch bereinigt (Mattermost-Routing-Einschränkung).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: Array von Capability-Strings. Fügen Sie `"inlineButtons"` hinzu, um die Beschreibung des Schaltflächen-Tools im Agent-System-Prompt zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost den Gateway nicht direkt über dessen Bind-Host erreichen kann.
    - In Multi-Account-Setups können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
    - Wenn `interactions.callbackBaseUrl` ausgelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` ab und fällt dann auf `http://localhost:<port>` zurück.
    - Erreichbarkeitsregel: Die Schaltflächen-Callback-URL muss vom Mattermost-Server erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/in demselben Netzwerk-Namespace ausgeführt werden.
    - Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie seinen Host bzw. seine Domain zu Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API posten, statt über das `message`-Tool des Agent zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus dem Plugin; wenn Sie rohes JSON posten, befolgen Sie diese Regeln:

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
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche stören Mattermosts serverseitiges Aktions-Routing (liefert 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen, damit die Bestätigungsnachricht den Schaltflächennamen (z. B. "Approve") statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich - der Interaktions-Handler gibt ohne diesen Wert 400 zurück.

</Warning>

**HMAC-Token-Erzeugung**

Der Gateway verifiziert Schaltflächenklicks mit HMAC-SHA256. Externe Skripte müssen Tokens erzeugen, die mit der Verifizierungslogik des Gateway übereinstimmen:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (der Gateway verwendet `JSON.stringify` mit sortierten Schlüsseln, wodurch kompakte Ausgabe entsteht).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
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
  <Accordion title="Common HMAC pitfalls">
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, um der kompakten JavaScript-Ausgabe (`{"key":"val"}`) zu entsprechen.
    - Signieren Sie immer **alle** Kontextfelder (minus `_token`). Der Gateway entfernt `_token` und signiert dann alles, was übrig bleibt. Das Signieren einer Teilmenge führt zu einem stillen Verifizierungsfehler.
    - Verwenden Sie `sort_keys=True` - der Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann Kontextfelder beim Speichern der Payload neu anordnen.
    - Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret muss in dem Prozess, der Schaltflächen erstellt, und im Gateway, der verifiziert, identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Channel- und Benutzernamen über die Mattermost-API auflöst. Dies ermöglicht `#channel-name`- und `@username`-Ziele in `openclaw message send` sowie Cron-/Webhook-Zustellungen.

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
  <Accordion title="No replies in channels">
    Stellen Sie sicher, dass sich der Bot im Channel befindet, und erwähnen Sie ihn (oncall), verwenden Sie ein Trigger-Präfix (onchar), oder setzen Sie `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob der Account aktiviert ist.
    - Multi-Account-Probleme: Env-Vars gelten nur für den `default`-Account.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Slash-Command-Registrierung ist fehlgeschlagen oder wurde beim Start nur teilweise abgeschlossen
      - Der Callback trifft den falschen Gateway/Account
      - Mattermost hat noch alte Commands, die auf ein früheres Callback-Ziel zeigen
      - Der Gateway wurde neu gestartet, ohne Slash Commands erneut zu aktivieren
    - Wenn native Slash Commands nicht mehr funktionieren, prüfen Sie die Logs auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` ausgelassen wird und Logs warnen, dass der Callback zu `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host/in demselben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine explizite, extern erreichbare `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Buttons issues">
    - Schaltflächen erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Schaltflächendaten. Prüfen Sie, dass jede Schaltfläche sowohl ein `text`- als auch ein `callback_data`-Feld hat.
    - Schaltflächen werden gerendert, aber Klicks bewirken nichts: Stellen Sie sicher, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in ServiceSettings auf `true` gesetzt ist.
    - Schaltflächen geben beim Klicken 404 zurück: Die Schaltflächen-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Aktions-Router scheitert bei nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
    - Gateway-Logs melden `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON verwenden (keine Leerzeichen). Siehe den HMAC-Abschnitt oben.
    - Gateway-Logs melden `missing _token in context`: Das `_token`-Feld befindet sich nicht im Kontext der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
    - Bestätigung zeigt rohe ID statt Schaltflächennamen: `context.action_id` stimmt nicht mit der `id` der Schaltfläche überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Der Agent weiß nichts von Schaltflächen: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Channel-Konfiguration hinzu.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Channel-Routing](/de/channels/channel-routing) - Session-Routing für Nachrichten
- [Channel-Übersicht](/de/channels) - alle unterstützten Channels
- [Gruppen](/de/channels/groups) - Gruppenchat-Verhalten und Mention-Gating
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
