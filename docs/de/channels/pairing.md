---
read_when:
    - DM-Zugriffssteuerung einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-05-06T06:40:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

„Kopplung“ ist OpenClaws expliziter Schritt zur Zugriffsfreigabe.
Sie wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen Kurzcode, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Standard-DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn vorhandener
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Freigaben im Kopplungsspeicher erweitern den `open`-Zugriff nicht.

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder freigegeben wird.

### Einen Absender freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehlsinhaber konfiguriert ist, initialisiert die Freigabe eines DM-Kopplungscodes auch
`commands.ownerAllowFrom` mit dem freigegebenen Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten Erstkonfigurationen einen expliziten Besitzer für privilegierte Befehle und
Exec-Freigabeaufforderungen. Nachdem ein Besitzer existiert, gewähren spätere Kopplungsfreigaben nur
DM-Zugriff; sie fügen keine weiteren Besitzer hinzu.

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn derselbe Satz vertrauenswürdiger Absender für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch für Gruppen-Allowlists gelten soll.

Statische Gruppen verwenden `type: "message.senders"` und werden aus Kanal-Allowlists mit
`accessGroup:<name>` referenziert:

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

Zugriffsgruppen sind hier im Detail dokumentiert: [Zugriffsgruppen](/de/channels/access-groups)

### Wo der Zustand gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Freigegebener Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht standardmäßiges Konto: `<channel>-<accountId>-allowFrom.json`

Verhalten beim Konto-Scoping:

- Nicht standardmäßige Konten lesen/schreiben nur ihre scoped Allowlist-Datei.
- Das Standardkonto verwendet die kanalbezogene, unscoped Allowlist-Datei.

Behandeln Sie diese Daten als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Kopplungs-Allowlist-Speicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Die Freigabe eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Besitzers ist separater
Konfigurationszustand in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängig
Überschreibungen pro Gruppe oder pro Thema).
</Note>

## 2) Node-Gerätekopplung (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Gerätekopplungsanfrage, die freigegeben werden muss.

### Über Telegram koppeln (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie die erstmalige Gerätekopplung vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram eine Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann freigeben.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den anfänglichen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Kopplungs-Bootstrap-Profil:

- primär übergebenes `node`-Token bleibt bei `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert und kein flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen Scopes weiterhin unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Sperrung bleibt sowohl durch den freigegebenen
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere entfernte mobile Kopplung verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts schlagen weiterhin
vor der QR-/Einrichtungscode-Ausgabe geschlossen fehl.

### Ein Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Freigabe abgelehnt wird, weil die freigebende Paired-Device-Sitzung
mit reinem Kopplungs-Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes adminfähiges gekoppeltes Gerät eine neue
Control-UI-/Browser-Kopplung wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die vorhandene Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie freigeben.
</Note>

### Optionale automatische Node-Freigabe per vertrauenswürdigem CIDR

Gerätekopplung bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Freigabe von erstmaligen Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies gilt nur für neue `role: node`-Kopplungsanfragen ohne angeforderte
Scopes. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin manuelle
Freigabe. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin manuelle
Freigabe.

### Speicherung des Node-Kopplungszustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die alte `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, Gateway-eigener Kopplungsspeicher. WS-Nodes erfordern weiterhin Gerätekopplung.
- Der Kopplungsdatensatz ist die dauerhafte maßgebliche Quelle für freigegebene Rollen. Aktive
  Gerätetokens bleiben auf diesen freigegebenen Rollensatz begrenzt; ein einzelner Token-Eintrag
  außerhalb der freigegebenen Rollen erzeugt keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (alt): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
