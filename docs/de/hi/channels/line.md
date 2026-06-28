---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie benötigen die Einrichtung von LINE Webhook + Zugangsdaten.
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: 'LINE Messaging API Plugin: Einrichtung, Konfiguration und Verwendung'
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-
Empfänger auf dem Gateway und verwendet Ihr Kanal-Zugriffstoken + Kanalgeheimnis zur
Authentifizierung.

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Medien, Standorte, Flex-
Nachrichten, Vorlagennachrichten und Schnellantworten werden unterstützt. Reaktionen und Threads
werden nicht unterstützt.

## Installieren

Installieren Sie LINE, bevor Sie den Kanal konfigurieren:

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
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie **Channel access token** und **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging API settings.
5. Setzen Sie die Webhook-URL auf Ihren Gateway-Endpunkt (HTTPS ist erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung (GET) von LINE und akzeptiert signierte
eingehende Ereignisse (POST) direkt nach der Signatur- und Payload-Validierung; die Agent-
Verarbeitung läuft asynchron weiter.
Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die LINE-Signaturverifizierung ist body-abhängig (HMAC über den raw body), daher erzwingt OpenClaw vor der Verifizierung strikte Pre-Auth-Body-Limits und Timeouts.
- OpenClaw verarbeitet Webhook-Ereignisse aus den verifizierten rohen Request-Bytes. Für Signaturintegrität werden durch vorgelagerte Middleware transformierte `req.body`-Werte ignoriert.

## Konfigurieren

Minimale Konfiguration:

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

Öffentliche DM-Konfiguration:

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

Umgebungsvariablen (nur Standardkonto):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token-/Geheimnisdateien:

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

`tokenFile` und `secretFile` müssen auf reguläre Dateien zeigen. Symlinks werden abgelehnt.

Mehrere Konten:

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

Direktnachrichten verwenden standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code, und ihre
Nachrichten werden ignoriert, bis sie genehmigt wurden.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlisten und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: auf der Allowlist stehende LINE-Benutzer-IDs für DMs; für `dmPolicy: "open"` ist `["*"]` erforderlich
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: auf der Allowlist stehende LINE-Benutzer-IDs für Gruppen
- Gruppenspezifische Überschreibungen: `channels.line.groups.<groupId>.allowFrom`
- Statische Absender-Zugriffsgruppen können aus `allowFrom`, `groupAllowFrom` und gruppenspezifischem `allowFrom` mit `accessGroup:<name>` referenziert werden.
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs unterscheiden Groß- und Kleinschreibung. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hex-Zeichen
- Gruppe: `C` + 32 Hex-Zeichen
- Raum: `R` + 32 Hex-Zeichen

## Nachrichtenverhalten

- Text wird bei 5000 Zeichen in Teile aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-
  Karten umgewandelt.
- Streaming-Antworten werden gepuffert; während der Agent arbeitet, erhält LINE vollständige Teile
  mit Ladeanimation.
- Mediendownloads sind durch `channels.line.mediaMaxMb` (Standard 10) begrenzt.
- Eingehende Medien werden unter `~/.openclaw/media/inbound/` gespeichert, bevor sie an den Agent weitergegeben werden,
  was dem gemeinsamen Medienspeicher entspricht, der von anderen gebündelten Kanal-
  Plugins verwendet wird.

## Kanaldaten (reichhaltige Nachrichten)

Verwenden Sie `channelData.line`, um Schnellantworten, Standorte, Flex-Karten oder Vorlagen-
Nachrichten zu senden.

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

Das LINE-Plugin liefert außerdem den Befehl `/card` für Flex-Nachrichtenvorlagen mit:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt Conversation-Bindings für ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an die ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindings und aktive konversationsgebundene ACP-Sitzungen funktionieren auf LINE wie andere Konversationskanäle.

Details finden Sie unter [ACP agents](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Agent-Nachrichten-Tool. Medien werden über den LINE-spezifischen Zustellpfad mit passender Vorschau und Tracking-Behandlung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschaugenerierung gesendet.
- **Videos**: werden mit expliziter Vorschau und Content-Type-Behandlung gesendet.
- **Audio**: wird als LINE-Audionachricht gesendet.

Ausgehende Medien-URLs müssen öffentliche HTTPS-URLs sein. OpenClaw validiert den Ziel-Hostnamen, bevor die URL an LINE übergeben wird, und lehnt loopback-, link-local- und private-network-Ziele ab.

Generische Mediensendungen fallen auf die bestehende reine Bildroute zurück, wenn der LINE-spezifische Pfad nicht verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und
  `channelSecret` mit der LINE-Konsole übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad mit `channels.line.webhookPath` übereinstimmt
  und das Gateway von LINE erreichbar ist.
- **Fehler beim Mediendownload:** Wenn Medien das Standardlimit überschreiten, erhöhen Sie `channels.line.mediaMaxMb`.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
