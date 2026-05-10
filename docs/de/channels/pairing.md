---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Kopplungsübersicht: freigeben, wer Ihnen Direktnachrichten senden darf + welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-05-10T19:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

"Kopplung" ist OpenClaws expliziter Schritt zur Zugriffsgenehmigung.
Sie wird an zwei Stellen verwendet:

1. **DM-Kopplung** (wer mit dem Bot sprechen darf)
2. **Node-Kopplung** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Kopplung (eingehender Chat-Zugriff)

Wenn ein Channel mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Standard-DM-Richtlinien sind dokumentiert unter: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Allowlist `"*"` enthält.
Einrichtung und Validierung erfordern diesen Wildcard-Wert für öffentliche offene Konfigurationen. Wenn bestehender
Status `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Runtime weiterhin
nur diese Absender zu, und Genehmigungen im Kopplungsspeicher erweitern den `open`-Zugriff nicht.

Kopplungscodes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Kopplungsnachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Kopplungsanfragen sind standardmäßig auf **3 pro Channel** begrenzt; weitere Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Wenn noch kein Befehls-Owner konfiguriert ist, initialisiert das Genehmigen eines DM-Kopplungscodes auch
`commands.ownerAllowFrom` mit dem genehmigten Absender, etwa `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Owner für privilegierte Befehle und Exec-
Genehmigungsabfragen. Nachdem ein Owner vorhanden ist, gewähren spätere Kopplungsgenehmigungen nur DM-
Zugriff; sie fügen keine weiteren Owner hinzu.

Unterstützte Channels: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe vertrauenswürdige Absendergruppe für
mehrere Nachrichten-Channels oder sowohl für DM- als auch Gruppen-Allowlists gelten soll.

Statische Gruppen verwenden `type: "message.senders"` und werden mit
`accessGroup:<name>` aus Channel-Allowlists referenziert:

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

### Wo der Status gespeichert wird

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Genehmigter Allowlist-Speicher:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht standardmäßiges Konto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Konto-Scoping:

- Nicht standardmäßige Konten lesen/schreiben nur ihre scoped Allowlist-Datei.
- Das Standardkonto verwendet die channelbezogene, nicht scoped Allowlist-Datei.

Behandeln Sie diese Dateien als vertraulich (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Kopplungs-Allowlist-Speicher ist für DM-Zugriff vorgesehen. Gruppenautorisierung ist separat.
Das Genehmigen eines DM-Kopplungscodes erlaubt diesem Absender nicht automatisch, Gruppen-
Befehle auszuführen oder den Bot in Gruppen zu steuern. Die Bootstrap-Logik für den ersten Owner ist ein separater Konfigurations-
Status in `commands.ownerAllowFrom`, und die Gruppenchat-Zustellung folgt weiterhin den
Gruppen-Allowlists des Channels (zum Beispiel `groupAllowFrom`, `groups` oder gruppen-
bzw. themenspezifischen Überschreibungen, abhängig vom Channel).
</Note>

## 2) Node-Gerätekopplung (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Gerätekopplungsanfrage, die genehmigt werden muss.

### Per Telegram koppeln (für iOS empfohlen)

Wenn Sie das `device-pair`-Plugin verwenden, können Sie die erstmalige Gerätekopplung vollständig aus Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten **Einrichtungscode**-Nachricht (leicht in Telegram zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und verbinden Sie sich.
5. Zurück in Telegram: `/pair pending` (Anfrage-IDs, Rolle und Scopes prüfen), dann genehmigen.

Der Einrichtungscode ist eine Base64-codierte JSON-Payload mit:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Kopplungs-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Kopplungs-Bootstrap-Profil:

- das primär übergebene `node`-Token bleibt bei `scopes: []`
- jedes übergebene `operator`-Token bleibt auf die Bootstrap-Allowlist begrenzt:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert, nicht ein flacher Scope-Pool:
  Operator-Scope-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-Rollen
  müssen weiterhin Scopes unter ihrem eigenen Rollenpräfix anfordern
- spätere Token-Rotation/-Sperrung bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere Remote-Mobile-Kopplung verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-`ws://`-Einrichtungscodes werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts schlagen weiterhin
geschlossen fehl, bevor QR-/Einrichtungscode ausgegeben werden.

### Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Genehmigung verweigert wird, weil die genehmigende gekoppelte Gerätesitzung
mit nur für Kopplung vorgesehenem Scope geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein bestehendes adminfähiges gekoppeltes Gerät eine neue
Control-UI-/Browser-Kopplung wiederherstellen, ohne `devices/paired.json` von Hand zu bearbeiten. Das
Gateway validiert die erneut versuchte Verbindung weiterhin; Tokens, die sich nicht mit
`operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel anderer
Rolle/Scopes/Public Key), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die bestehende Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den derzeit genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie genehmigen.
</Note>

### Optionale automatische Node-Genehmigung für vertrauenswürdige CIDRs

Gerätekopplung bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie automatische Erstgenehmigung für Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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
Genehmigung. Rollen-, Scope-, Metadaten- und Public-Key-Änderungen erfordern weiterhin manuelle
Genehmigung.

### Statusspeicher für Node-Kopplung

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die alte `node.pair.*`-API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, vom Gateway verwalteter Kopplungsspeicher. WS-Nodes erfordern weiterhin Gerätekopplung.
- Der Kopplungsdatensatz ist die dauerhafte Quelle der Wahrheit für genehmigte Rollen. Aktive
  Gerätetokens bleiben auf diese genehmigte Rollengruppe begrenzt; ein vereinzelter Token-Eintrag
  außerhalb der genehmigten Rollen erzeugt keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (doctor ausführen): [Aktualisieren](/de/install/updating)
- Channel-Konfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
