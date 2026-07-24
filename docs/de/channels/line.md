---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie müssen den LINE-Webhook und die Anmeldedaten einrichten
    - Sie möchten LINE-spezifische Nachrichtenoptionen
summary: Einrichtung, Konfiguration und Verwendung des LINE Messaging API-Plugins
title: LINE
x-i18n:
    generated_at: "2026-07-24T04:52:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin wird als Webhook-
Empfänger auf dem Gateway ausgeführt und verwendet Ihr Channel-Zugriffstoken und Channel-Secret zur
Authentifizierung.

Status: offizielles Plugin, separat installiert. Direktnachrichten, Gruppenchats, Medien,
Standorte, Flex-Nachrichten, Vorlagennachrichten und Schnellantworten werden unterstützt.
Reaktionen und Threads werden nicht unterstützt.

## Installation

Installieren Sie LINE, bevor Sie den Channel konfigurieren:

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
2. Erstellen (oder wählen) Sie einen Provider und fügen Sie einen **Messaging API**-Channel hinzu.
3. Kopieren Sie das **Channel access token** und das **Channel secret** aus den Channel-Einstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging-API-Einstellungen.
5. Legen Sie als Webhook-URL Ihren Gateway-Endpunkt fest (HTTPS erforderlich):

```text
https://gateway-host/line/webhook
```

Das Gateway beantwortet die Webhook-Verifizierung von LINE (GET). Bei signierten eingehenden Ereignissen
(POST) schreibt es jedes Ereignis in die persistente Eingangswarteschlange, bevor es `200` zurückgibt;
die Verarbeitung durch den Agenten wird asynchron fortgesetzt. Fehlgeschlagene Zustellungen werden aus der
Warteschlange erneut versucht, auch nach einem Neustart des Gateways, und problematische Ereignisse werden nach einer begrenzten Anzahl von Versuchen
zu fehlgeschlagenen Warteschlangeneinträgen. Wenn die persistente Speicherung fehlschlägt, gibt die Anfrage
`500` zurück, statt ein Ereignis zu bestätigen, das verloren gehen könnte.
Die Zustellung über die Grenze zwischen Warteschlange und Agent erfolgt mindestens einmal: Wird das Gateway während
einer aktiven Zustellung heruntergefahren oder stürzt ab, kann der Durchlauf erneut ausgeführt werden. Nachrichtenereignisse werden anhand der
LINE-Nachrichten-ID dedupliziert; andere Ereignistypen verwenden `webhookEventId`. Aufbewahrte Abschlussdatensätze
unterdrücken gewöhnliche doppelte Webhooks, Handler mit externen Nebenwirkungen
sollten dennoch idempotent sein.
Wenn Sie einen benutzerdefinierten Pfad benötigen, legen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` fest und aktualisieren Sie die URL entsprechend.

Sicherheitshinweise:

- Die LINE-Signaturprüfung hängt vom Body ab (HMAC über den unveränderten Body). Daher wendet OpenClaw vor der Authentifizierung eine strikte Größenbegrenzung für den Body (64 KB) und ein Lese-Timeout an.
- OpenClaw verarbeitet Webhook-Ereignisse aus den verifizierten unveränderten Anfragebytes. Durch vorgeschaltete Middleware veränderte `req.body`-Werte werden zum Schutz der Signaturintegrität ignoriert.

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

`tokenFile` und `secretFile` müssen auf reguläre Dateien verweisen. Symbolische Links werden abgelehnt.
Direkt in der Konfiguration angegebene Werte haben Vorrang vor Dateien; Umgebungsvariablen sind der letzte Rückgriff für das Standardkonto.

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

Direktnachrichten verwenden standardmäßig die Kopplung. Unbekannte Absender erhalten einen Kopplungscode, und ihre
Nachrichten werden bis zur Genehmigung ignoriert:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Zulassungslisten und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`)
- `channels.line.allowFrom`: zugelassene LINE-Benutzer-IDs für Direktnachrichten; `dmPolicy: "open"` erfordert `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (Standard: `allowlist`)
- `channels.line.groupAllowFrom`: zugelassene LINE-Benutzer-IDs für Gruppen; Einträge in `allowFrom` für Direktnachrichten lassen keine Gruppenabsender zu
- Gruppenspezifische Überschreibungen: `channels.line.groups.<groupId>.allowFrom` (sowie `enabled`, `requireMention`, `systemPrompt`, `skills`). Legen Sie bei
  `groupPolicy: "allowlist"` `groupAllowFrom` oder das gruppenspezifische `allowFrom` fest; eine leere Gruppenzulassungsliste blockiert Gruppennachrichten, selbst wenn Direktnachrichten offen sind.
- Statische Absenderzugriffsgruppen können aus `allowFrom`, `groupAllowFrom` und dem gruppenspezifischen `allowFrom` mit `accessGroup:<name>` referenziert werden; siehe [Zugriffsgruppen](/de/channels/access-groups).
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, greift die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

Bei LINE-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Gültige IDs sehen wie folgt aus:

- Benutzer: `U` + 32 Hexadezimalzeichen
- Gruppe: `C` + 32 Hexadezimalzeichen
- Raum: `R` + 32 Hexadezimalzeichen

## Nachrichtenverhalten

- Text wird in Abschnitte von 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-
  Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE empfängt vollständige Abschnitte mit einer Lade-
  animation, während der Agent arbeitet.
- Mediendownloads werden durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).
- Eingehende Medien werden unter `~/.openclaw/media/inbound/` gespeichert, bevor sie an den
  Agenten übergeben werden. Dies entspricht dem gemeinsamen Medienspeicher anderer Channel-Plugins.

## Channel-Daten (umfangreiche Nachrichten)

Verwenden Sie `channelData.line`, um Schnellantworten, Standorte, Flex-Karten oder Vorlagen-
nachrichten zu senden.

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

Das LINE-Plugin enthält außerdem einen `/card`-Befehl für Flex-Nachrichtenvorlagen:

```text
/card info "Willkommen" "Vielen Dank für Ihre Teilnahme!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Konversationsbindungen (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive, an Konversationen gebundene ACP-Sitzungen funktionieren unter LINE wie bei anderen Konversations-Channels.

Weitere Informationen finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Ausgehende Medien

Das LINE-Plugin sendet Bilder, Videos und Audio über das Agenten-Nachrichtentool:

- **Bilder**: werden als LINE-Bildnachrichten gesendet; standardmäßig wird die Medien-URL als Vorschaubild verwendet.
- **Videos**: benötigen ein Vorschaubild; setzen Sie `channelData.line.previewImageUrl` auf eine Bild-URL.
- **Audio**: wird als LINE-Audionachricht gesendet; die Dauer beträgt standardmäßig 60 Sekunden, sofern `channelData.line.durationMs` nicht festgelegt ist.

Der Medientyp wird aus `channelData.line.mediaKind` übernommen, wenn es festgelegt ist; andernfalls wird er
aus den anderen LINE-Optionen oder der Dateiendung der URL abgeleitet, wobei Bild als Rückgriff dient.

URLs ausgehender Medien müssen öffentliche HTTPS-URLs mit höchstens 2000 Zeichen sein. OpenClaw
validiert den Zielhostnamen, bevor die URL an LINE übergeben wird, und lehnt Loopback-,
Link-Local- und private Netzwerkziele ab.

Allgemeine Medienübertragungen ohne LINE-spezifische Optionen verwenden die Bildroute.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und
  `channelSecret` mit der LINE Console übereinstimmt.
- **Keine eingehenden Ereignisse:** Vergewissern Sie sich, dass der Webhook-Pfad mit `channels.line.webhookPath` übereinstimmt
  und das Gateway von LINE aus erreichbar ist.
- **Fehler beim Mediendownload:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien den
  Standardgrenzwert überschreiten.

## Verwandte Themen

- [Channel-Übersicht](/de/channels) — alle unterstützten Channels
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Steuerung durch Erwähnungen
- [Channel-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
