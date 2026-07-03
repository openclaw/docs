---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Knotens
    - OpenClaw-Sicherheitslage prüfen
summary: 'Kopplungsübersicht: Genehmigen, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-07-03T13:22:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist OpenClaws expliziter Schritt zur Zugriffsfreigabe.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Standardmäßige DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn ein vorhandener
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Runtime weiterhin
nur diese Absender zu, und Genehmigungen im Pairing-Store erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehls-Owner konfiguriert ist, bootstrapt das Genehmigen eines DM-Pairing-Codes außerdem
`commands.ownerAllowFrom` auf den genehmigten Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Owner für privilegierte Befehle und Exec-
Genehmigungsabfragen. Nachdem ein Owner existiert, gewähren spätere Pairing-Genehmigungen nur DM-
Zugriff; sie fügen keine weiteren Owner hinzu.

Unterstützte Kanäle: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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
- Genehmigter Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten beim Konto-Scoping:

- Nicht-Standardkonten lesen/schreiben nur ihre scoped Allowlist-Datei.
- Das Standardkonto verwendet die kanalspezifische, unscoped Allowlist-Datei.

Behandeln Sie diese Dateien als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Allowlist-Speicher ist für den DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Das Genehmigen eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Der First-Owner-Bootstrap ist separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Gruppenchat-Zustellung folgt weiterhin den
Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder je nach Kanal
Overrides pro Gruppe oder pro Thema).
</Note>

## 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die genehmigt werden muss.

### Pairing über Telegram (empfohlen für iOS)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anweisungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann genehmigen.

Der Einrichtungscode ist eine base64-codierte JSON-Payload, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Pairing-Bootstrap-Profil:

- Das integrierte Einrichtungsprofil erlaubt nur die frische QR-/Einrichtungscode-Baseline:
  `node` plus eine begrenzte `operator`-Übergabe
- Das übergebene `node`-Token bleibt bei `scopes: []`
- Das übergebene `operator`-Token ist auf `operator.approvals`,
  `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt
- `operator.admin` wird durch QR-/Einrichtungscode-Bootstrap nicht gewährt; dafür ist ein
  separates genehmigtes Operator-Pairing oder ein Token-Flow erforderlich
- Spätere Token-Rotation/-Widerruf bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliches oder anderes Remote-Mobile-Pairing verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts schlagen weiterhin
vor der QR-/Einrichtungscode-Ausgabe geschlossen fehl.

### Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Genehmigung verweigert wird, weil die genehmigende Paired-Device-Sitzung
mit reinem Pairing-Scope geöffnet wurde, versucht die CLI dieselbe Anfrage erneut mit
`operator.admin`. Dadurch kann ein vorhandenes adminfähiges gekoppeltes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht mit
`operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel mit anderer
Rolle/anderen Scopes/anderem öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die vorhandene Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.
</Note>

### Optionale automatische Node-Genehmigung für vertrauenswürdige CIDRs

Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die erstmalige automatische Node-Genehmigung mit expliziten CIDRs oder exakten IPs aktivieren:

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
Scopes. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin manuelle
Genehmigung. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin manuelle
Genehmigung.

### Speicherung des Node-Pairing-Zustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die Legacy-API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater gateway-eigener Pairing-Speicher. WS-Nodes erfordern weiterhin Geräte-Pairing.
- Der Pairing-Datensatz ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollengruppe begrenzt; ein verirrter Token-Eintrag
  außerhalb der genehmigten Rollen erzeugt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
