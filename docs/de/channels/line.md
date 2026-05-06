---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Einrichtung von LINE-Webhook und Zugangsdaten erforderlich
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: Einrichtung, Konfiguration und Nutzung des LINE Messaging API-Plugins
title: ZEILE
x-i18n:
    generated_at: "2026-05-06T09:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-Empfänger auf dem Gateway und verwendet Ihr Channel Access Token + Channel Secret für die Authentifizierung.

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Medien, Standorte, Flex-Nachrichten, Vorlagennachrichten und Schnellantworten werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Installation

Installieren Sie LINE, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/line
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE Developers-Konto und öffnen Sie die Konsole:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie das **Channel access token** und das **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging API-Einstellungen.
5. Setzen Sie die Webhook-URL auf Ihren Gateway-Endpunkt (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung (GET) und eingehende Ereignisse (POST) von LINE. Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder `channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die Signaturverifizierung von LINE hängt vom Body ab (HMAC über den Roh-Body), daher wendet OpenClaw vor der Verifizierung strikte Body-Limits vor der Authentifizierung und ein Timeout an.
- OpenClaw verarbeitet Webhook-Ereignisse aus den verifizierten Roh-Request-Bytes. Von vorgelagerter Middleware transformierte `req.body`-Werte werden zur Sicherheit der Signaturintegrität ignoriert.

## Konfiguration

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

Konfiguration für öffentliche Direktnachrichten:

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

Token-/Secret-Dateien:

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

`tokenFile` und `secretFile` müssen auf reguläre Dateien verweisen. Symlinks werden abgelehnt.

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

Direktnachrichten verwenden standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code, und ihre Nachrichten werden ignoriert, bis sie genehmigt wurden.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlisten und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlistete LINE-Benutzer-IDs für Direktnachrichten; `dmPolicy: "open"` erfordert `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlistete LINE-Benutzer-IDs für Gruppen
- Gruppenbezogene Überschreibungen: `channels.line.groups.<groupId>.allowFrom`
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

Bei LINE-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hex-Zeichen
- Gruppe: `C` + 32 Hex-Zeichen
- Raum: `R` + 32 Hex-Zeichen

## Nachrichtenverhalten

- Text wird bei 5000 Zeichen in Teile aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden, wenn möglich, in Flex-Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Teile mit einer Ladeanimation, während der Agent arbeitet.
- Mediendownloads werden durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).
- Eingehende Medien werden unter `~/.openclaw/media/inbound/` gespeichert, bevor sie an den Agent übergeben werden. Dies entspricht dem gemeinsamen Medienspeicher, der von anderen gebündelten Kanal-Plugins verwendet wird.

## Kanaldaten (Rich Messages)

Verwenden Sie `channelData.line`, um Schnellantworten, Standorte, Flex-Karten oder Vorlagennachrichten zu senden.

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

Das LINE-Plugin liefert außerdem einen `/card`-Befehl für Flex-Nachrichten-Presets mit:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Konversationsbindungen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive konversationsgebundene ACP-Sitzungen funktionieren in LINE wie in anderen Konversationskanälen.

Details finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Nachrichten-Tool des Agents. Medien werden über den LINE-spezifischen Zustellpfad mit entsprechender Vorschau- und Tracking-Verarbeitung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschaugenerierung gesendet.
- **Videos**: werden mit expliziter Vorschau- und Content-Type-Verarbeitung gesendet.
- **Audio**: wird als LINE-Audionachrichten gesendet.

URLs für ausgehende Medien müssen öffentliche HTTPS-URLs sein. OpenClaw validiert den Ziel-Hostnamen, bevor die URL an LINE übergeben wird, und lehnt local loopback-, link-local- und private Netzwerkziele ab.

Generische Mediensendungen fallen auf die vorhandene reine Bildroute zurück, wenn kein LINE-spezifischer Pfad verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und `channelSecret` mit der LINE-Konsole übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad `channels.line.webhookPath` entspricht und dass das Gateway von LINE erreichbar ist.
- **Fehler beim Mediendownload:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das Standardlimit überschreiten.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
