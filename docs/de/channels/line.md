---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie müssen den LINE-Webhook und die Zugangsdaten einrichten
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: Einrichtung, Konfiguration und Verwendung des LINE Messaging API-Plugins
title: LINE
x-i18n:
    generated_at: "2026-07-12T15:02:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-
Empfänger auf dem Gateway und verwendet Ihr Channel-Zugriffstoken und Channel-Secret zur
Authentifizierung.

Status: offizielles Plugin, separat installiert. Direktnachrichten, Gruppenchats, Medien,
Standorte, Flex-Nachrichten, Vorlagennachrichten und Schnellantworten werden unterstützt.
Reaktionen und Threads werden nicht unterstützt.

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

1. Erstellen Sie ein LINE-Developers-Konto und öffnen Sie die Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie **Channel access token** und **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging-API-Einstellungen.
5. Legen Sie als Webhook-URL Ihren Gateway-Endpunkt fest (HTTPS erforderlich):

```text
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung von LINE (GET) und bestätigt signierte
eingehende Ereignisse (POST) unmittelbar nach der Signatur- und Nutzlastvalidierung; die
Verarbeitung durch den Agenten wird asynchron fortgesetzt.
Wenn Sie einen benutzerdefinierten Pfad benötigen, legen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` fest und aktualisieren Sie die URL entsprechend.

Sicherheitshinweise:

- Die LINE-Signaturverifizierung hängt vom Body ab (HMAC über den unveränderten Body). Daher wendet OpenClaw vor der Authentifizierung ein striktes Body-Limit (64 KB) und ein Zeitlimit für das Einlesen an.
- OpenClaw verarbeitet Webhook-Ereignisse anhand der verifizierten unveränderten Anfragebytes. Durch vorgelagerte Middleware transformierte `req.body`-Werte werden zum Schutz der Signaturintegrität ignoriert.

## Konfiguration

Minimalkonfiguration:

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

`tokenFile` und `secretFile` müssen auf reguläre Dateien verweisen. Symbolische Links werden abgelehnt.
Inline-Konfigurationswerte haben Vorrang vor Dateien; Umgebungsvariablen sind die letzte Ausweichoption für das Standardkonto.

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

Direktnachrichten verwenden standardmäßig das Pairing. Unbekannte Absender erhalten einen Pairing-Code, und ihre
Nachrichten werden bis zur Genehmigung ignoriert:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Zulassungslisten und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (Standardwert `pairing`)
- `channels.line.allowFrom`: zugelassene LINE-Benutzer-IDs für Direktnachrichten; `dmPolicy: "open"` erfordert `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (Standardwert `allowlist`)
- `channels.line.groupAllowFrom`: zugelassene LINE-Benutzer-IDs für Gruppen
- Gruppenspezifische Überschreibungen: `channels.line.groups.<groupId>.allowFrom` (sowie `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Statische Absender-Zugriffsgruppen können in `allowFrom`, `groupAllowFrom` und gruppenspezifischem `allowFrom` mit `accessGroup:<name>` referenziert werden; siehe [Zugriffsgruppen](/de/channels/access-groups).
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, greift die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

Bei LINE-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Gültige IDs sehen folgendermaßen aus:

- Benutzer: `U` + 32 Hexadezimalzeichen
- Gruppe: `C` + 32 Hexadezimalzeichen
- Raum: `R` + 32 Hexadezimalzeichen

## Nachrichtenverhalten

- Text wird in Abschnitte von 5000 Zeichen aufgeteilt.
- Markdown-Formatierungen werden entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-
  Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE empfängt vollständige Abschnitte mit einer Ladeanimation,
  während der Agent arbeitet.
- Mediendownloads werden durch `channels.line.mediaMaxMb` begrenzt (Standardwert 10).
- Eingehende Medien werden unter `~/.openclaw/media/inbound/` gespeichert, bevor sie an den
  Agenten übergeben werden, entsprechend dem gemeinsamen Medienspeicher anderer Kanal-Plugins.

## Kanaldaten (Rich Messages)

Verwenden Sie `channelData.line`, um Schnellantworten, Standorte, Flex-Karten oder
Vorlagennachrichten zu senden.

```json5
{
  text: "Hier ist es",
  channelData: {
    line: {
      quickReplies: ["Status", "Hilfe"],
      location: {
        title: "Büro",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Statuskarte",
        contents: {/* Flex-Nutzlast */},
      },
      templateMessage: {
        type: "confirm",
        text: "Fortfahren?",
        confirmLabel: "Ja",
        confirmData: "yes",
        cancelLabel: "Nein",
        cancelData: "no",
      },
    },
  },
}
```

Das LINE-Plugin stellt außerdem einen `/card`-Befehl für Flex-Nachrichtenvorlagen bereit:

```text
/card info "Willkommen" "Vielen Dank für Ihre Teilnahme!"
```

## ACP-Unterstützung

LINE unterstützt Konversationsbindungen des ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive konversationsgebundene ACP-Sitzungen funktionieren auf LINE wie bei anderen Konversationskanälen.

Weitere Informationen finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin sendet Bilder, Videos und Audio über das Nachrichtenwerkzeug des Agenten:

- **Bilder**: werden als LINE-Bildnachrichten gesendet; für das Vorschaubild wird standardmäßig die Medien-URL verwendet.
- **Videos**: erfordern ein Vorschaubild; legen Sie `channelData.line.previewImageUrl` auf eine Bild-URL fest.
- **Audio**: wird als LINE-Audionachricht gesendet; die Dauer beträgt standardmäßig 60 Sekunden, sofern `channelData.line.durationMs` nicht festgelegt ist.

Die Medienart wird aus `channelData.line.mediaKind` übernommen, wenn dieser Wert festgelegt ist. Andernfalls wird sie
aus den anderen LINE-Optionen oder der Dateiendung der URL abgeleitet, wobei ein Bild als Ausweichoption dient.

URLs für ausgehende Medien müssen öffentliche HTTPS-URLs mit höchstens 2000 Zeichen sein. OpenClaw
validiert den Zielhostnamen, bevor die URL an LINE übergeben wird, und lehnt Loopback-,
Link-Local- und private Netzwerkziele ab.

Generische Medienübertragungen ohne LINE-spezifische Optionen verwenden die Bildroute.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und
  `channelSecret` mit der LINE Console übereinstimmt.
- **Keine eingehenden Ereignisse:** Vergewissern Sie sich, dass der Webhook-Pfad mit `channels.line.webhookPath`
  übereinstimmt und das Gateway von LINE aus erreichbar ist.
- **Fehler beim Herunterladen von Medien:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn die Medien das
  Standardlimit überschreiten.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungsanforderungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
