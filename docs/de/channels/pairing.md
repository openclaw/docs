---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-05-04T09:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

„Kopplung“ ist der explizite Schritt zur Zugriffsfreigabe in OpenClaw.
Sie wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Standard-DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die wirksame DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich offene Konfigurationen. Wenn der vorhandene
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Genehmigungen aus dem Kopplungsspeicher erweitern den `open`-Zugriff nicht.

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Kanal** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehls-Owner konfiguriert ist, initialisiert das Genehmigen eines DM-Kopplungscodes außerdem
`commands.ownerAllowFrom` mit dem genehmigten Absender, zum Beispiel `telegram:123456789`.
Dadurch erhalten erstmalige Einrichtungen einen expliziten Owner für privilegierte Befehle und Ausführungs-
Genehmigungsaufforderungen. Nachdem ein Owner existiert, gewähren spätere Kopplungsgenehmigungen nur DM-
Zugriff; sie fügen keine weiteren Owner hinzu.

Unterstützte Kanäle: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe vertrauenswürdige Absendermenge auf
mehrere Nachrichtenkanäle oder sowohl auf DM- als auch auf Gruppenzulassungslisten angewendet werden soll.

Statische Gruppen verwenden `type: "message.senders"` und werden mit
`accessGroup:<name>` aus Kanal-Zulassungslisten referenziert:

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
- Genehmigter Zulassungslistenspeicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten der Kontoeingrenzung:

- Nicht-Standardkonten lesen/schreiben nur ihre eingegrenzte Zulassungslistendatei.
- Das Standardkonto verwendet die kanalbezogene, nicht eingegrenzte Zulassungslistendatei.

Behandeln Sie diese Daten als vertraulich (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Kopplungs-Zulassungslistenspeicher ist für DM-Zugriff bestimmt. Gruppenautorisierung ist separat.
Das Genehmigen eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppen-
Befehle auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Owners ist ein separater Konfigurations-
zustand in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppen-Zulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängigen
Überschreibungen pro Gruppe oder Thema).
</Note>

## 2) Node-Gerätekopplung (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Gerätekopplungsanfrage, die genehmigt werden muss.

### Kopplung über Telegram (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie die erstmalige Gerätekopplung vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram eine Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anweisungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram einfach zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann genehmigen.

Der Einrichtungscode ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Bootstrap-Profil für die Kopplung:

- das primär übergebene `node`-Token bleibt bei `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Zulassungsliste begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert, nicht ein einzelner flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Widerruf bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere mobile Kopplung außerhalb von local loopback verwenden Sie Tailscale
Serve/Funnel oder eine andere `wss://`-Gateway-URL. Direkte `ws://`-Einrichtungs-
URLs außerhalb von local loopback werden vor der QR-/Einrichtungscode-Ausgabe abgelehnt. Klartext-`ws://`-Einrichtungscodes
sind auf local loopback-URLs beschränkt; `ws://`-Clients in privaten Netzwerken erfordern weiterhin die ausdrückliche
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`-Notfallfreigabe, die im Remote-
Gateway-Leitfaden beschrieben ist.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Genehmigung verweigert wird, weil die genehmigende Sitzung eines gekoppelten Geräts
nur mit Kopplungs-Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes, adminfähiges gekoppeltes Gerät eine neue
Control-UI-/Browser-Kopplung wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die erneut versuchte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff. Wenn es erneut verbindet und mehr Scopes oder eine umfassendere Rolle anfordert, behält OpenClaw die vorhandene Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.
</Note>

### Optionale automatische Genehmigung von Nodes für vertrauenswürdige CIDRs

Gerätekopplung bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Erstgenehmigung von Nodes mit expliziten CIDRs oder genauen IPs aktivieren:

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
Genehmigung. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin manuelle
Genehmigung.

### Zustandsspeicherung der Node-Kopplung

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die alte `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater Gateway-eigener Kopplungsspeicher. WS-Nodes erfordern weiterhin Gerätekopplung.
- Der Kopplungsdatensatz ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Gerätetokens bleiben auf diese genehmigte Rollenmenge begrenzt; ein verwaister Token-Eintrag
  außerhalb der genehmigten Rollen erstellt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sichere Aktualisierung (doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/de/channels/bluebubbles)
  - iMessage (alt): [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
