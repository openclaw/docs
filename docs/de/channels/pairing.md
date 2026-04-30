---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Neuen iOS-/Android-Node koppeln
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-04-30T06:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist OpenClaws expliziter Schritt zur Zugriffsfreigabe.
Es wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Standard-DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die wirksame DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn vorhandener
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Genehmigungen im Pairing-Speicher erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehlsinhaber konfiguriert ist, initialisiert die Genehmigung eines DM-Pairing-Codes auch
`commands.ownerAllowFrom` mit dem genehmigten Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Inhaber für privilegierte Befehle und
Exec-Genehmigungsaufforderungen. Nachdem ein Inhaber existiert, gewähren spätere Pairing-Genehmigungen nur DM-Zugriff; sie fügen keine weiteren Inhaber hinzu.

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wo der Zustand gespeichert ist

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Speicher für genehmigte Zulassungsliste:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten beim Konto-Scope:

- Nicht-Standardkonten lesen/schreiben nur ihre scoped Zulassungslistendatei.
- Das Standardkonto verwendet die kanalbezogene, unscoped Zulassungslistendatei.

Behandeln Sie diese Dateien als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Zulassungslistenspeicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Die Genehmigung eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Inhabers ist ein separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Gruppenchat-Zustellung folgt weiterhin den
Gruppen-Zulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder je nach Kanal
gruppen- oder themenspezifischen Überschreibungen).
</Note>

## 2) Node-Gerätekopplung (iOS-/Android-/macOS-/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Gerätekopplungsanfrage, die genehmigt werden muss.

### Kopplung über Telegram (für iOS empfohlen)

Wenn Sie das Plugin `device-pair` verwenden, können Sie die erstmalige Gerätekopplung vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten **Einrichtungscode**-Nachricht (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann genehmigen.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Pairing-Bootstrap-Profil:

- Das primär übergebene `node`-Token bleibt bei `scopes: []`
- Jedes übergebene `operator`-Token bleibt auf die Bootstrap-Zulassungsliste begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert, nicht ein einziger flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern
- Spätere Token-Rotation/-Widerruf bleibt sowohl durch den genehmigten Rollenvertrag des Geräts
  als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die bestehende Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.
</Note>

### Optionale automatische Node-Genehmigung über vertrauenswürdige CIDR

Gerätekopplung bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Erstgenehmigung von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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
Scopes. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin manuelle
Genehmigung. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin manuelle
Genehmigung.

### Speicherung des Node-Pairing-Zustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die ältere `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, Gateway-eigener Pairing-Speicher. WS-Nodes erfordern weiterhin Gerätekopplung.
- Der Pairing-Datensatz ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Gerätetokens bleiben auf diese genehmigte Rollenmenge begrenzt; ein verwaister Token-Eintrag
  außerhalb der genehmigten Rollen erzeugt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
