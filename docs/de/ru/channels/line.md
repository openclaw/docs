---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie müssen den Webhook für LINE und die Anmeldedaten konfigurieren
    - Sie benötigen LINE-spezifische Nachrichtenparameter
summary: Einrichtung, Konfiguration und Verwendung des LINE Messaging API-Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin arbeitet als Webhook-Empfänger
am Gateway und verwendet Ihr Channel Access Token + Channel Secret zur
Authentifizierung.

Status: ladbares Plugin. Unterstützt werden Direktnachrichten, Gruppenchats, Medien, Standorte, Flex
Messages, Template Messages und Quick Replies. Reaktionen und Threads
werden nicht unterstützt.

## Installation

Installieren Sie LINE, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/line
```

Lokale Arbeitskopie (beim Ausführen aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE Developers-Konto und öffnen Sie die Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie **Channel access token** und **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging API-Einstellungen.
5. Legen Sie die Webhook-URL für Ihren Gateway-Endpunkt fest (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung von LINE (GET) und bestätigt signierte
eingehende Ereignisse (POST) direkt nach der Signatur- und Payload-Prüfung; die Verarbeitung
durch den Agenten läuft asynchron weiter.
Wenn ein benutzerdefinierter Pfad benötigt wird, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die LINE-Signaturprüfung hängt vom Anforderungstext ab (HMAC über den unverarbeiteten Text), daher wendet OpenClaw vor der Authentifizierung strenge Größenbegrenzungen für den Text und ein Timeout an.
- OpenClaw verarbeitet Webhook-Ereignisse aus geprüften unverarbeiteten Anforderungsbytes. Werte von `req.body`, die von vorgelagerter Middleware umgewandelt wurden, werden ignoriert, um die Signaturintegrität zu erhalten.

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

Konfiguration für offene Direktnachrichten:

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

`tokenFile` und `secretFile` müssen auf reguläre Dateien verweisen. Symbolische Links werden abgelehnt.

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

Direktnachrichten erfordern standardmäßig eine Kopplung. Unbekannte Absender erhalten einen Kopplungscode, und ihre
Nachrichten werden bis zur Genehmigung ignoriert.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Zulassungslisten und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: zugelassene LINE-Benutzer-IDs für Direktnachrichten; `dmPolicy: "open"` erfordert `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: zugelassene LINE-Benutzer-IDs für Gruppen
- Überschreibungen für einzelne Gruppen: `channels.line.groups.<groupId>.allowFrom`
- Statische Zugriffgruppen für Absender können aus `allowFrom`, `groupAllowFrom` und gruppenspezifischem `allowFrom` über `accessGroup:<name>` referenziert werden.
- Runtime-Hinweis: Wenn `channels.line` vollständig fehlt, fällt die Runtime für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs unterscheiden Groß- und Kleinschreibung. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 hexadezimale Zeichen
- Gruppe: `C` + 32 hexadezimale Zeichen
- Raum: `R` + 32 hexadezimale Zeichen

## Nachrichtenverhalten

- Text wird in Fragmente von 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex
  Cards umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Fragmente mit Ladeanimation,
  während der Agent arbeitet.
- Das Herunterladen von Medien ist durch `channels.line.mediaMaxMb` begrenzt (standardmäßig 10).
- Eingehende Medien werden in `~/.openclaw/media/inbound/` gespeichert, bevor sie an den
  Agenten übergeben werden. Dies entspricht dem gemeinsamen Medienspeicher, der von anderen integrierten Kanal-Plugins
  verwendet wird.

## Kanaldaten (erweiterte Nachrichten)

Verwenden Sie `channelData.line`, um Quick Replies, Standorte, Flex Cards oder Template
Messages zu senden.

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

Das LINE-Plugin enthält außerdem den Befehl `/card` für Flex Messages-Voreinstellungen:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Bindungen (Agent Communication Protocol) für Unterhaltungen:

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive ACP-Sitzungen, die an eine Unterhaltung gebunden sind, funktionieren in LINE genauso wie in anderen Unterhaltungskanälen.

Weitere Informationen finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Nachrichtenwerkzeug des Agenten. Medien werden über den LINE-spezifischen Übermittlungspfad mit entsprechender Vorschauverarbeitung und Nachverfolgung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschauerzeugung gesendet.
- **Videos**: werden mit expliziter Vorschau- und Inhaltstypverarbeitung gesendet.
- **Audio**: wird als LINE-Audionachrichten gesendet.

URLs für ausgehende Medien müssen öffentliche HTTPS-URLs sein. OpenClaw prüft den Ziel-Hostnamen, bevor die URL an LINE übergeben wird, und lehnt local loopback, Link-Local- und private Netzwerkziele ab.

Generische Medienübermittlungen fallen nur für Bilder auf die bestehende Route zurück, wenn der LINE-spezifische Pfad nicht verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und
  `channelSecret` mit der LINE Console übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad mit `channels.line.webhookPath`
  übereinstimmt und dass das Gateway von LINE erreichbar ist.
- **Fehler beim Herunterladen von Medien:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das
  Standardlimit überschreiten.

## Siehe Auch

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Beschränkung auf Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Schutzverstärkung
