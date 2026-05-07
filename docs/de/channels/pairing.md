---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: genehmigen, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-05-07T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" ist der explizite Schritt zur Zugriffsfreigabe in OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen Kurzcode, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Standard-DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn der bestehende
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

Wenn noch kein Befehls-Owner konfiguriert ist, initialisiert die Freigabe eines DM-Pairing-Codes außerdem
`commands.ownerAllowFrom` auf den freigegebenen Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Owner für privilegierte Befehle und
Exec-Freigabeaufforderungen. Sobald ein Owner vorhanden ist, gewähren spätere Pairing-Freigaben nur DM-Zugriff; sie fügen keine weiteren Owner hinzu.

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

Access Groups sind hier ausführlich dokumentiert: [Access Groups](/de/channels/access-groups)

### Wo der Zustand gespeichert ist

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Freigegebener Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht standardmäßiges Konto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Konto-Scoping:

- Nicht standardmäßige Konten lesen/schreiben nur ihre gescopete Allowlist-Datei.
- Das Standardkonto verwendet die kanalgescopete, nicht gesondert gescopete Allowlist-Datei.

Behandeln Sie diese Dateien als vertraulich (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Allowlist-Speicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle auszuführen
oder den Bot in Gruppen zu steuern. Der First-Owner-Bootstrap ist ein separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Gruppenchat-Zustellung folgt weiterhin den Gruppen-Allowlists
des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängigen Überschreibungen
pro Gruppe oder Thema).
</Note>

## 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Pairing über Telegram (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann freigeben.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Pairing-Bootstrap-Profil:

- primär übergebenes `node`-Token bleibt bei `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert, kein einzelner flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Widerruf bleiben sowohl durch den freigegebenen
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere entfernte mobile Pairings verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts
werden weiterhin vor der QR-/Einrichtungscode-Ausgabe geschlossen abgewiesen.

### Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Freigabe abgelehnt wird, weil die freigebende Sitzung eines gepairten Geräts
nur mit Pairing-Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein bestehendes admin-fähiges gepairtes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/öffentlichem Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gepairtes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die bestehende Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie freigeben.
</Note>

### Optionales automatisches Freigeben von Nodes über vertrauenswürdige CIDRs

Geräte-Pairing bleibt standardmäßig manuell. Für eng kontrollierte Node-Netzwerke
können Sie automatische Erstfreigabe von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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
Freigabe. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern ebenfalls manuelle
Freigabe.

### Zustandsspeicher für Node-Pairing

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gepairte Geräte + Tokens)

### Hinweise

- Die ältere `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater Gateway-eigener Pairing-Speicher. WS-Nodes benötigen weiterhin Geräte-Pairing.
- Der Pairing-Eintrag ist die dauerhafte Quelle der Wahrheit für freigegebene Rollen. Aktive
  Geräte-Tokens bleiben auf diese freigegebene Rollenmenge begrenzt; ein verwaister Token-Eintrag
  außerhalb der freigegebenen Rollen erstellt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (Doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - BlueBubbles (ältere iMessage-Bridge): [BlueBubbles](/de/channels/bluebubbles)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
