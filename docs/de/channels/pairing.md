---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Einen neuen iOS-/Android-Knoten koppeln
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Kopplungsübersicht: genehmigen, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten können'
title: Koppeln
x-i18n:
    generated_at: "2026-06-27T17:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Schritt zur Zugriffsgenehmigung in OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen Kurzcode und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Standardmäßige DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern dieses Wildcard für öffentlich geöffnete Konfigurationen. Wenn bestehender
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Runtime weiterhin
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

Wenn noch kein Befehlsinhaber konfiguriert ist, initialisiert die Genehmigung eines DM-Pairing-Codes außerdem
`commands.ownerAllowFrom` mit dem genehmigten Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten erstmalige Einrichtungen einen expliziten Inhaber für privilegierte Befehle und
Exec-Genehmigungsabfragen. Nachdem ein Inhaber existiert, gewähren spätere Pairing-Genehmigungen nur DM-
Zugriff; sie fügen keine weiteren Inhaber hinzu.

Unterstützte Kanäle: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe vertrauenswürdige Absendermenge für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch Gruppen-Allowlists gelten soll.

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

Access Groups sind hier ausführlich dokumentiert: [Access Groups](/de/channels/access-groups)

### Wo der Zustand gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Genehmigter Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten der Konto-Begrenzung:

- Nicht-Standardkonten lesen/schreiben nur ihre begrenzte Allowlist-Datei.
- Das Standardkonto verwendet die kanalbezogene, unbegrenzte Allowlist-Datei.

Behandeln Sie diese Daten als sensibel (sie regeln den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Allowlist-Speicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist getrennt.
Die Genehmigung eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppen-
befehle auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Inhabers ist ein separater Konfigurations-
zustand in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängigen
Überschreibungen pro Gruppe oder Thema).
</Note>

## 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die genehmigt werden muss.

### Pairing über Telegram (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann genehmigen.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den anfänglichen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token enthält das integrierte Pairing-Bootstrap-Profil:

- das integrierte Einrichtungsprofil erlaubt nur die frische QR-/Einrichtungscode-Baseline:
  `node` plus eine begrenzte `operator`-Übergabe
- das übergebene `node`-Token bleibt bei `scopes: []`
- das übergebene `operator`-Token ist auf `operator.approvals`,
  `operator.read` und `operator.write` beschränkt
- `operator.admin` und `operator.pairing` werden durch QR-/Einrichtungscode-
  Bootstrap nicht gewährt; sie erfordern ein separates genehmigtes Operator-Pairing oder einen Token-Flow
- spätere Token-Rotation/-Widerruf bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliches oder anderes Remote-Mobile-Pairing verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für local loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts werden weiterhin
vor der QR-/Einrichtungscode-Ausgabe abgelehnt.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Genehmigung verweigert wird, weil die genehmigende Sitzung des gekoppelten Geräts
nur mit Pairing-Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein bestehendes adminfähiges gekoppeltes Gerät ein neues
Control UI-/Browser-Pairing wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die erneut versuchte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die bestehende Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.
</Note>

### Optionale automatische Node-Genehmigung per vertrauenswürdigem CIDR

Geräte-Pairing bleibt standardmäßig manuell. Für eng kontrollierte Node-Netzwerke
können Sie sich mit expliziten CIDRs oder genauen IPs für die automatische Erstgenehmigung von Nodes entscheiden:

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

Dies gilt nur für frische `role: node`-Pairing-Anfragen ohne angeforderte
Scopes. Operator-, Browser-, Control UI- und WebChat-Clients erfordern weiterhin manuelle
Genehmigung. Rollen-, Scope-, Metadaten- und Public-Key-Änderungen erfordern weiterhin manuelle
Genehmigung.

### Speicherung des Node-Pairing-Zustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die veraltete `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater Gateway-eigener Pairing-Speicher. WS-Nodes erfordern weiterhin Geräte-Pairing.
- Der Pairing-Eintrag ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollengruppe begrenzt; ein vereinzelter Token-Eintrag
  außerhalb der genehmigten Rollen erstellt keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (Doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
