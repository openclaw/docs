---
read_when:
    - Einrichten der Zugriffssteuerung für Direktnachrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Prüfen der Sicherheitssituation von OpenClaw
summary: 'Kopplungsübersicht: genehmigen, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten können'
title: Kopplung
x-i18n:
    generated_at: "2026-04-26T11:23:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

„Kopplung“ ist der explizite Schritt zur **Eigentümergenehmigung** in OpenClaw.
Er wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Security](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Die Standard-DM-Richtlinien sind dokumentiert unter: [Security](/de/gateway/security)

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wo der Zustand gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Genehmigter Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Kontoabgrenzung:

- Nicht-Standardkonten lesen/schreiben nur ihre abgegrenzte Allowlist-Datei.
- Das Standardkonto verwendet die nicht abgegrenzte kanalbezogene Allowlist-Datei.

Behandeln Sie diese Dateien als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

Wichtig: Dieser Speicher ist für DM-Zugriff. Gruppenautorisierung ist getrennt.
Das Genehmigen eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppenbefehle auszuführen oder den Bot in Gruppen zu steuern. Für Gruppenzugriff konfigurieren Sie die expliziten Gruppen-Allowlists des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängig Überschreibungen pro Gruppe/pro Thema).

## 2) Node-Gerätekopplung (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Gerätekopplungsanfrage, die genehmigt werden muss.

### Über Telegram koppeln (empfohlen für iOS)

Wenn Sie das Plugin `device-pair` verwenden, können Sie die erstmalige Gerätekopplung vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram die Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitung und einer separaten Nachricht mit dem **Setup-Code** (in Telegram einfach zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw iOS-App → Einstellungen → Gateway.
4. Fügen Sie den Setup-Code ein und stellen Sie die Verbindung her.
5. Zurück in Telegram: `/pair pending` (prüfen Sie Anforderungs-IDs, Rolle und Scopes), dann genehmigen.

Der Setup-Code ist eine base64-kodierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den anfänglichen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token trägt das eingebaute Bootstrap-Profil für die Kopplung:

- das primär übergebene `node`-Token bleibt `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Prüfungen von Bootstrap-Scopes sind nach Rollen präfixiert, nicht ein einziger flacher Scope-Pool:
  Operator-Scoped-Einträge erfüllen nur Operator-Anfragen, und Rollen, die keine Operatoren sind,
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Widerruf bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Setup-Code wie ein Passwort, solange er gültig ist.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel mit anderer
Rolle/anderen Scopes/anderem öffentlichem Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

Wichtig: Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff. Wenn es
die Verbindung wiederherstellt und dabei mehr Scopes oder eine umfassendere Rolle anfordert, behält OpenClaw die
bestehende Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie
`openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu
angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.

### Optionale Auto-Genehmigung für vertrauenswürdige CIDR-Node

Die Gerätekopplung bleibt standardmäßig manuell. Für eng kontrollierte Node-Netzwerke
können Sie die erstmalige automatische Genehmigung von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies gilt nur für neue Kopplungsanfragen mit `role: node`, für die keine Scopes
angefordert wurden. Operator-, Browser-, Control UI- und WebChat-Clients erfordern weiterhin eine manuelle
Genehmigung. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin eine manuelle
Genehmigung.

### Speicherung des Node-Kopplungszustands

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die ältere API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) ist ein
  separater Gateway-eigener Kopplungsspeicher. WS-Nodes erfordern weiterhin Gerätekopplung.
- Der Kopplungseintrag ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollenmenge begrenzt; ein verirrter Token-Eintrag
  außerhalb der genehmigten Rollen schafft keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt Injection: [Security](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Updating](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (Legacy): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
