---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfen der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen, wer Ihnen DMs senden darf + welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-05-02T06:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Schritt zur Zugriffsfreigabe von OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Standard-DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn vorhandener
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Freigaben im Pairing-Speicher erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder freigegeben wird.

### Absender freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehlsinhaber konfiguriert ist, initialisiert die Freigabe eines DM-Pairing-Codes auch
`commands.ownerAllowFrom` auf den freigegebenen Absender, beispielsweise `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Inhaber für privilegierte Befehle und
Exec-Freigabeaufforderungen. Sobald ein Inhaber vorhanden ist, gewähren spätere Pairing-Freigaben nur DM-
Zugriff; sie fügen keine weiteren Inhaber hinzu.

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn derselbe vertrauenswürdige Absendersatz für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch für Gruppenzulassungslisten gelten soll.

Statische Gruppen verwenden `type: "message.senders"` und werden mit
`accessGroup:<name>` aus Kanalzulassungslisten referenziert:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Zugriffsgruppen sind hier ausführlich dokumentiert: [Zugriffsgruppen](/de/channels/access-groups)

### Speicherort des Zustands

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Speicher für freigegebene Zulassungsliste:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht standardmäßiges Konto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Kontobereichseinschränkung:

- Nicht standardmäßige Konten lesen/schreiben nur ihre bereichsspezifische Zulassungslistendatei.
- Das Standardkonto verwendet die kanalbezogene, nicht bereichsspezifische Zulassungslistendatei.

Behandeln Sie diese Daten als vertraulich (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Zulassungslistenspeicher gilt für DM-Zugriff. Gruppenautorisierung ist separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Inhabers ist ein separater
Konfigurationszustand in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppenzulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder gruppen- bzw. themenspezifische
Überschreibungen, je nach Kanal).
</Note>

## 2) Node-Geräte-Pairing (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Pairing über Telegram (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram eine Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram einfach zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Bereiche prüfen), dann freigeben.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den anfänglichen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Pairing-Bootstrap-Profil:

- das primär übergebene `node`-Token bleibt bei `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Zulassungsliste beschränkt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Bereichsprüfungen sind rollenpräfixiert, kein einzelner flacher Bereichspool:
  Operator-Bereichseinträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen Bereiche weiterhin unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Widerruf bleibt sowohl durch den freigegebenen Rollenvertrag des Geräts
  als auch durch die Operator-Bereiche der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

### Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/anderen Bereichen/anderem öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend erweiterten Zugriff. Wenn es sich erneut verbindet und mehr Bereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die vorhandene Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie freigeben.
</Note>

### Optionale automatische Freigabe für Nodes in vertrauenswürdigen CIDRs

Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Erstfreigabe von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies gilt nur für neue `role: node`-Pairing-Anfragen ohne angeforderte
Bereiche. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin eine manuelle
Freigabe. Änderungen an Rolle, Bereichen, Metadaten und öffentlichem Schlüssel erfordern weiterhin eine manuelle
Freigabe.

### Speicherung des Node-Pairing-Zustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die veraltete `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, Gateway-eigener Pairing-Speicher. WS-Nodes erfordern weiterhin Geräte-Pairing.
- Der Pairing-Datensatz ist die dauerhafte Quelle der Wahrheit für freigegebene Rollen. Aktive
  Gerätetokens bleiben auf diesen freigegebenen Rollensatz begrenzt; ein versehentlicher Tokeneintrag
  außerhalb der freigegebenen Rollen erzeugt keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (veraltet): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
