---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie benötigen die Einrichtung von LINE Webhook + Zugangsdaten
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: LINE Messaging API Plugin Einrichtung, Konfiguration und Verwendung
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-
Empfänger auf dem Gateway und verwendet Ihr channel access token + channel secret zur
Authentifizierung.

Status: herunterladbares Plugin. direct messages, group chats, media, locations, Flex
messages, template messages und quick replies werden unterstützt. Reactions und threads
werden nicht unterstützt.

## Installieren

Installieren Sie LINE, bevor Sie den channel konfigurieren:

```bash
openclaw plugins install @openclaw/line
```

Lokaler Checkout (wenn Sie aus einem git repo ausführen):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE Developers account und öffnen Sie die Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API** channel hinzu.
3. Kopieren Sie **Channel access token** und **Channel secret** aus den channel settings.
4. Aktivieren Sie **Use webhook** in den Messaging API settings.
5. Setzen Sie die Webhook URL auf Ihren Gateway endpoint (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook verification (GET) von LINE und akzeptiert signed
inbound events (POST) unmittelbar nach signature- und payload validation; agent
processing läuft asynchron weiter.
Wenn Sie einen custom path benötigen, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- LINE signature verification ist body-dependent (HMAC über den raw body), daher erzwingt OpenClaw vor der verification strikte pre-auth body limits und ein timeout.
- OpenClaw verarbeitet Webhook events aus den verified raw request bytes. Für signature-integrity safety werden upstream middleware-transformed `req.body` values ignoriert.

## Konfigurieren

Minimale config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Public DM config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars (nur default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token-/secret-Dateien:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` und `secretFile` sollten auf regular files verweisen. Symlinks werden abgelehnt.

Mehrere accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Zugriffskontrolle

Direct messages verwenden standardmäßig pairing. Unbekannte senders erhalten einen pairing code und ihre
messages werden ignoriert, bis sie approved sind.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists und policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE user IDs für DMs; für `dmPolicy: "open"` ist `["*"]` erforderlich
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE user IDs für groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups können mit `accessGroup:<name>` aus `allowFrom`, `groupAllowFrom` und per-group `allowFrom` referenziert werden.
- Runtime-Hinweis: Wenn `channels.line` vollständig fehlt, fällt die runtime für group checks auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE IDs sind case-sensitive. Gültige IDs sehen so aus:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Nachrichtenverhalten

- Text wird bei 5000 characters in chunks aufgeteilt.
- Markdown formatting wird entfernt; code blocks und tables werden, wenn möglich, in Flex
  cards umgewandelt.
- Streaming responses werden buffered; während der agent arbeitet, erhält LINE vollständige chunks
  mit loading animation.
- Media downloads sind durch `channels.line.mediaMaxMb` (default 10) begrenzt.
- Inbound media werden unter `~/.openclaw/media/inbound/` gespeichert, bevor sie an den agent weitergegeben werden,
  entsprechend dem shared media store, den andere bundled channel
  plugins verwenden.

## Channel data (Rich Messages)

Verwenden Sie `channelData.line`, um quick replies, locations, Flex cards oder template
messages zu senden.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Das LINE Plugin liefert auch den `/card` command für Flex message presets mit:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP support

LINE unterstützt ACP (Agent Communication Protocol) conversation bindings:

- `/acp spawn <agent> --bind here` bindet den current LINE chat an die ACP session, ohne einen child thread zu erstellen.
- Configured ACP bindings und active conversation-bound ACP sessions funktionieren auf LINE wie andere conversation channels.

Details finden Sie unter [ACP agents](/de/tools/acp-agents).

## Outbound media

Das LINE Plugin unterstützt das Senden von images, videos und audio files über das agent message tool. Media werden über den LINE-specific delivery path mit passender preview- und tracking handling gesendet:

- **Images**: werden mit automatic preview generation als LINE image messages gesendet.
- **Videos**: werden mit explicit preview und content-type handling gesendet.
- **Audio**: wird als LINE audio messages gesendet.

Outbound media URLs müssen public HTTPS URLs sein. OpenClaw validiert den target hostname, bevor die URL an LINE übergeben wird, und lehnt loopback, link-local und private-network targets ab.

Generic media sends fallen auf die existing image-only route zurück, wenn der LINE-specific path nicht verfügbar ist.

## Fehlerbehebung

- **Webhook verification fails:** Stellen Sie sicher, dass die Webhook URL HTTPS ist und
  `channelSecret` mit der LINE console übereinstimmt.
- **No inbound events:** Bestätigen Sie, dass der Webhook path `channels.line.webhookPath` entspricht
  und das Gateway für LINE erreichbar ist.
- **Media download errors:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn media das default limit überschreiten.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten channels
- [Pairing](/de/channels/pairing) — DM authentication und pairing flow
- [Groups](/de/channels/groups) — group chat behavior und mention gating
- [Channel Routing](/de/channels/channel-routing) — session routing für messages
- [Security](/de/gateway/security) — access model und hardening
