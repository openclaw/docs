---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie müssen den LINE-Webhook und die Zugangsdaten einrichten
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: Einrichtung, Konfiguration und Nutzung des LINE Messaging API-Plugins
title: ZEILE
x-i18n:
    generated_at: "2026-04-30T06:40:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE stellt über die LINE Messaging API eine Verbindung zu OpenClaw her. Das Plugin läuft als Webhook-Empfänger auf dem Gateway und verwendet Ihr Channel Access Token und Channel Secret für die Authentifizierung.

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Medien, Standorte, Flex-Nachrichten, Vorlagennachrichten und Schnellantworten werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

LINE wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale Paket-Builds keine separate Installation.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die LINE ausschließt, installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht ist:

```bash
openclaw plugins install @openclaw/line
```

Wenn npm das OpenClaw-eigene Paket als veraltet oder fehlend meldet, verwenden Sie einen aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis die npm-Paketreihe aufgeholt hat.

Lokaler Checkout (bei Ausführung aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE Developers-Konto und öffnen Sie die Konsole:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen Sie einen Provider (oder wählen Sie einen aus) und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie das **Channel Access Token** und das **Channel Secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Webhook verwenden** in den Messaging API-Einstellungen.
5. Setzen Sie die Webhook-URL auf Ihren Gateway-Endpunkt (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung (GET) und eingehende Ereignisse (POST) von LINE. Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder `channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die LINE-Signaturprüfung ist vom Body abhängig (HMAC über den rohen Body), daher wendet OpenClaw vor der Verifizierung strikte Body-Limits und ein Timeout vor der Authentifizierung an.
- OpenClaw verarbeitet Webhook-Ereignisse aus den verifizierten rohen Request-Bytes. Durch vorgeschaltete Middleware transformierte `req.body`-Werte werden zur Sicherheit der Signaturintegrität ignoriert.

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
- `channels.line.allowFrom`: erlaubte LINE-Benutzer-IDs für DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: erlaubte LINE-Benutzer-IDs für Gruppen
- Überschreibungen pro Gruppe: `channels.line.groups.<groupId>.allowFrom`
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs unterscheiden Groß- und Kleinschreibung. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hex-Zeichen
- Gruppe: `C` + 32 Hex-Zeichen
- Raum: `R` + 32 Hex-Zeichen

## Nachrichtenverhalten

- Text wird bei 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Blöcke mit einer Ladeanimation, während der Agent arbeitet.
- Medien-Downloads werden durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).
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

Das LINE-Plugin enthält außerdem einen `/card`-Befehl für Flex-Nachrichtenvorlagen:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Bindungen (Agent Communication Protocol) für Unterhaltungen:

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive unterhaltungsgebundene ACP-Sitzungen funktionieren auf LINE wie in anderen Unterhaltungskanälen.

Weitere Details finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Nachrichten-Tool des Agenten. Medien werden über den LINE-spezifischen Zustellpfad mit geeigneter Vorschau- und Tracking-Behandlung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschaugenerierung gesendet.
- **Videos**: werden mit expliziter Vorschau- und Content-Type-Behandlung gesendet.
- **Audio**: wird als LINE-Audionachrichten gesendet.

URLs für ausgehende Medien müssen öffentliche HTTPS-URLs sein. OpenClaw validiert den Ziel-Hostnamen, bevor die URL an LINE übergeben wird, und lehnt Loopback-, Link-Local- und private Netzwerkziele ab.

Generische Mediensendungen fallen auf die vorhandene Nur-Bilder-Route zurück, wenn kein LINE-spezifischer Pfad verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und `channelSecret` mit der LINE-Konsole übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad mit `channels.line.webhookPath` übereinstimmt und dass das Gateway von LINE erreichbar ist.
- **Fehler beim Medien-Download:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das Standardlimit überschreiten.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
