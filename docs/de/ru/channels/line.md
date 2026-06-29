---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie müssen den LINE Webhook und die Zugangsdaten konfigurieren
    - Sie benötigen LINE-spezifische Nachrichtenparameter
summary: Einrichtung, Konfiguration und Verwendung von Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:46Z"
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
messages, template messages und Schnellantworten. Reaktionen und Threads
werden nicht unterstützt.

## Installation

Installieren Sie LINE, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/line
```

Lokale Arbeitskopie (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE-Developers-Konto und öffnen Sie die Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen Kanal **Messaging API** hinzu.
3. Kopieren Sie **Channel access token** und **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging-API-Einstellungen.
5. Legen Sie die Webhook-URL für Ihren Gateway-Endpunkt fest (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung von LINE (GET) und bestätigt signierte
eingehende Ereignisse (POST) direkt nach der Signatur- und Payload-Prüfung; die Verarbeitung
durch den Agenten läuft asynchron weiter.
Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die LINE-Signaturprüfung hängt vom Request-Body ab (HMAC über den unverarbeiteten Body), daher erzwingt OpenClaw strenge Größenbeschränkungen für den Body und ein Authentifizierungs-Timeout vor der Prüfung.
- OpenClaw verarbeitet Webhook-Ereignisse aus geprüften unverarbeiteten Request-Bytes. Von vorgeschalteter Middleware umgewandelte `req.body`-Werte werden ignoriert, um die Signaturintegrität zu erhalten.

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

`tokenFile` und `secretFile` müssen auf normale Dateien verweisen. Symbolische Links werden abgelehnt.

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

## Zugriffssteuerung

Direktnachrichten erfordern standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code, und ihre
Nachrichten werden bis zur Genehmigung ignoriert.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: zugelassene LINE-Benutzer-IDs für Direktnachrichten; `dmPolicy: "open"` erfordert `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: zugelassene LINE-Benutzer-IDs für Gruppen
- Überschreibungen für einzelne Gruppen: `channels.line.groups.<groupId>.allowFrom`
- Statische Absender-Zugriffsgruppen können aus `allowFrom`, `groupAllowFrom` und gruppenspezifischem `allowFrom` über `accessGroup:<name>` referenziert werden.
- Runtime-Hinweis: Wenn `channels.line` vollständig fehlt, fällt die Runtime für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs beachten Groß- und Kleinschreibung. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hexadezimalzeichen
- Gruppe: `C` + 32 Hexadezimalzeichen
- Raum: `R` + 32 Hexadezimalzeichen

## Nachrichtenverhalten

- Text wird in Fragmente von 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex
  cards umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Fragmente mit Ladeanimation,
  während der Agent arbeitet.
- Mediendownloads sind durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).
- Eingehende Medien werden vor der Übergabe an den Agenten in `~/.openclaw/media/inbound/`
  gespeichert. Das entspricht dem gemeinsamen Medienspeicher, der von anderen integrierten Kanal-Plugins
  verwendet wird.

## Kanaldaten (erweiterte Nachrichten)

Verwenden Sie `channelData.line`, um Schnellantworten, Standorte, Flex cards oder template
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

Das LINE-Plugin enthält außerdem den Befehl `/card` für Flex-message-Presets:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Bindungen (Agent Communication Protocol) für Unterhaltungen:

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive, an eine Unterhaltung gebundene ACP-Sitzungen funktionieren in LINE genauso wie in anderen Unterhaltungskanälen.

Siehe [ACP-Agenten](/de/tools/acp-agents) für Details.

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Nachrichten-Tool des Agenten. Medien werden über den LINE-spezifischen Zustellpfad mit entsprechender Vorschauverarbeitung und Nachverfolgung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschaugenerierung gesendet.
- **Videos**: werden mit expliziter Verarbeitung von Vorschau und Inhaltstyp gesendet.
- **Audio**: wird als LINE-Audionachrichten gesendet.

URLs für ausgehende Medien müssen öffentlich zugängliche HTTPS-URLs sein. OpenClaw prüft den Ziel-Hostnamen vor der Übergabe der URL an LINE und lehnt local loopback, Link-Local- und private Netzwerkziele ab.

Allgemeine Mediensendungen fallen nur für Bilder auf die bestehende Route zurück, wenn der LINE-spezifische Pfad nicht verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und
  `channelSecret` mit der LINE console übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad mit `channels.line.webhookPath`
  übereinstimmt und das Gateway von LINE aus erreichbar ist.
- **Fehler beim Herunterladen von Medien:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das
  Standardlimit überschreiten.

## Siehe Auch

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Einschränkung auf Erwähnungen
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
