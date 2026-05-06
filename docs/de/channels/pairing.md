---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Neue iOS/Android-Node koppeln
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Kopplungsübersicht: freigeben, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten können'
title: Kopplung
x-i18n:
    generated_at: "2026-05-06T17:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Schritt zur Zugriffsfreigabe in OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Standard-DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn vorhandener
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Freigaben im Pairing-Speicher erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder freigegeben wird.

### Einen Absender freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehls-Owner konfiguriert ist, initialisiert die Freigabe eines DM-Pairing-Codes auch
`commands.ownerAllowFrom` mit dem freigegebenen Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Owner für privilegierte Befehle und
Ausführungsfreigabe-Abfragen. Sobald ein Owner existiert, gewähren spätere Pairing-Freigaben nur DM-Zugriff;
sie fügen keine weiteren Owner hinzu.

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe vertrauenswürdige Absendergruppe für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch Gruppen-Allowlists gelten soll.

Statische Gruppen verwenden `type: "message.senders"` und werden mit
`accessGroup:<name>` aus Kanal-Allowlists referenziert:

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
- Speicher der freigegebenen Allowlist:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten der Kontoskopierung:

- Nicht-Standardkonten lesen/schreiben nur ihre zugehörige Allowlist-Datei.
- Das Standardkonto verwendet die kanalbezogene, nicht gesondert kontoskopierte Allowlist-Datei.

Behandeln Sie diese Dateien als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Allowlist-Speicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Owners ist ein separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder gruppen-
bzw. themenspezifischen Überschreibungen, je nach Kanal).
</Note>

## 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Pairing über Telegram (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram diese Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann freigeben.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token enthält das integrierte Pairing-Bootstrap-Profil:

- Das primäre übergebene `node`-Token bleibt bei `scopes: []`
- Jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfigiert, nicht ein einziger flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen Scopes weiterhin unter ihrem eigenen Rollenpräfix anfordern
- Spätere Token-Rotation/Widerruf bleibt sowohl durch den freigegebenen Rollenvertrag
  des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere mobile Remote-Pairings verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts
schlagen weiterhin geschlossen fehl, bevor QR-/Einrichtungscode ausgegeben wird.

### Ein Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Freigabe abgelehnt wird, weil die freigebende Sitzung des gekoppelten Geräts
nur mit Pairing-Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes adminfähiges gekoppeltes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel einer anderen
Rolle/anderen Scopes/einem anderen öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend weitergehenden Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine umfassendere Rolle anfordert, behält OpenClaw die vorhandene Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den derzeit freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie freigeben.
</Note>

### Optionales automatisches Freigeben von Nodes über vertrauenswürdige CIDR

Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie sich mit expliziten CIDRs oder exakten IPs für die automatische Freigabe von Nodes beim ersten Mal entscheiden:

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

Dies gilt nur für neue Pairing-Anfragen mit `role: node` ohne angeforderte
Scopes. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin eine manuelle
Freigabe. Rollen-, Scope-, Metadaten- und Public-Key-Änderungen erfordern ebenfalls weiterhin eine manuelle
Freigabe.

### Speicherung des Node-Pairing-Zustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die Legacy-API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, Gateway-eigener Pairing-Speicher. WS-Nodes benötigen weiterhin Geräte-Pairing.
- Der Pairing-Datensatz ist die dauerhafte Wahrheitsquelle für freigegebene Rollen. Aktive
  Gerätetokens bleiben auf diese freigegebene Rollengruppe begrenzt; ein einzelner Token-Eintrag
  außerhalb der freigegebenen Rollen erstellt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (Legacy): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
