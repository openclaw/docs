---
read_when:
    - Zugriffskontrolle für Direktnachrichten einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-07-12T15:01:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Schritt zur Zugriffsfreigabe in OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot kommunizieren darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (Zugriff auf eingehende Chats)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie genehmigen.

Die standardmäßigen DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich zugängliche Konfigurationen. Wenn der vorhandene
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Genehmigungen im Pairing-Speicher erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanalkonto** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder genehmigt wird.

### Einen Absender genehmigen

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Fügen Sie dem Genehmigungsbefehl `--notify` hinzu, um den Anfragenden im selben Kanal zu benachrichtigen. Kanäle mit mehreren Konten verwenden `--account <id>`.

Wenn noch kein Befehlseigentümer konfiguriert ist, initialisiert die Genehmigung eines DM-Pairing-Codes außerdem
`commands.ownerAllowFrom` mit dem genehmigten Absender, beispielsweise `telegram:123456789`.
Dadurch erhalten Ersteinrichtungen einen expliziten Eigentümer für privilegierte Befehle und
Genehmigungsaufforderungen für die Ausführung. Nachdem ein Eigentümer vorhanden ist, gewähren spätere Pairing-Genehmigungen nur DM-
Zugriff; sie fügen keine weiteren Eigentümer hinzu.

Unterstützte Kanäle (jedes installierte Kanal-Plugin, das Pairing deklariert; externe Plugins wie `openclaw-weixin` können weitere hinzufügen): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe Gruppe vertrauenswürdiger Absender für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch Gruppenzulassungslisten gelten soll.

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

Zugriffsgruppen werden hier ausführlich dokumentiert: [Zugriffsgruppen](/de/channels/access-groups)

### Speicherort des Zustands

Gespeichert unter `~/.openclaw/credentials/`:

- Ausstehende Anfragen: `<channel>-pairing.json`
- Speicher der genehmigten Zulassungsliste: `<channel>-<accountId>-allowFrom.json` (Genehmigungen für das
  Standardkonto verwenden `<channel>-default-allowFrom.json`)

Verhalten des Kontobereichs:

- Konten, die nicht das Standardkonto sind, lesen und schreiben nur ihre bereichsspezifische Zulassungslistendatei.
- Das Standardkonto berücksichtigt außerdem weiterhin eine ältere, nicht bereichsspezifische Datei `<channel>-allowFrom.json`
  aus früheren Installationen; Einträge aus beiden Dateien werden beim Lesen zusammengeführt.

Behandeln Sie diese als vertraulich (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Zulassungslistenspeicher ist für den DM-Zugriff vorgesehen. Die Gruppenautorisierung erfolgt separat.
Die Genehmigung eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Eigentümers ist ein separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Zustellung von Gruppenchats folgt weiterhin den
Gruppenzulassungslisten des Kanals (beispielsweise `groupAllowFrom`, `groups` oder Überschreibungen pro Gruppe
oder Thema, je nach Kanal).
</Note>

## 2) Pairing von Node-Geräten (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Anfrage zum Geräte-Pairing, die genehmigt werden muss.

### Pairing über die Control UI (empfohlen)

Verwenden Sie eine bereits verbundene Control-UI-Sitzung mit `operator.admin`-Zugriff:

1. Öffnen Sie die Control UI und wählen Sie **Nodes**.
2. Klicken Sie auf der Seite **Devices** auf **Pair mobile device**.
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-App → **Settings** → **Gateway**.
4. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und stellen Sie dann die Verbindung her.

Offizielle OpenClaw-Apps für iOS und Android werden automatisch genehmigt, wenn ihre
Metadaten des Einrichtungscodes übereinstimmen. Wenn unter **Pending approval** eine Anfrage angezeigt wird (zum
Beispiel für einen nicht offiziellen Client oder nicht übereinstimmende Metadaten), prüfen Sie deren Rolle und
Berechtigungsbereiche, bevor Sie sie genehmigen.

Die Schaltfläche ist deaktiviert, wenn die aktuelle Control-UI-Sitzung keinen
Administratorzugriff hat. Verwenden Sie in diesem Fall den nachfolgenden CLI-Genehmigungsablauf auf dem
Gateway-Host.

### Pairing über Telegram

Wenn Sie das Plugin `device-pair` verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram die Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram leicht zu kopieren und einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Settings → Gateway.
4. Scannen Sie den QR-Code (`/pair qr`) oder fügen Sie den Einrichtungscode ein und stellen Sie die Verbindung her.
5. Die offizielle mobile App stellt automatisch eine Verbindung her. Wenn `/pair pending` eine
   Anfrage anzeigt, prüfen Sie deren Rolle und Berechtigungsbereiche, bevor Sie sie genehmigen.

Der Einrichtungscode ist eine Base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `urls`: sofern verfügbar, die geordneten LAN-/Tailnet-Routen, die die mobile App ausprobieren kann
- `bootstrapToken`: ein einmal verwendbares Bootstrap-Token für den anfänglichen Pairing-Handshake; das Gateway lässt es nach 10 Minuten ablaufen

Führen Sie `/pair cleanup` aus, um nicht verwendete Einrichtungscodes ungültig zu machen, sobald das Pairing abgeschlossen ist.

Dieses Bootstrap-Token umfasst das integrierte Pairing-Bootstrap-Profil:

- Das integrierte Einrichtungsprofil erlaubt nur die Baseline für neue QR-/Einrichtungscodes:
  `node` sowie eine begrenzte `operator`-Übergabe
- Das übergebene `node`-Token behält `scopes: []`
- Das übergebene `operator`-Token ist auf `operator.approvals`,
  `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt
- `operator.admin` wird nicht durch den Bootstrap über QR-/Einrichtungscode gewährt; dafür ist ein
  separater genehmigter Operator-Pairing- oder Token-Ablauf erforderlich
- Eine spätere Rotation oder Sperrung von Tokens bleibt sowohl durch den genehmigten
  Rollenvertrag des Geräts als auch durch die Operator-Berechtigungsbereiche der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Verwenden Sie für Tailscale-, öffentliche oder andere entfernte mobile Pairings Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Einrichtungscodes mit unverschlüsseltem `ws://` werden nur
für Loopback-, private LAN-Adressen, `.local`-Bonjour-Hosts und den Host des Android-
Emulators akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts werden weiterhin
vor der Ausgabe des QR-/Einrichtungscodes standardmäßig abgelehnt.

Für `gateway.bind=lan`-Einrichtungs-URLs erkennt OpenClaw dauerhafte HTTPS-Stamm-URLs von Tailscale Serve,
die den Loopback-Port des aktiven Gateways als Proxy weiterleiten, und gibt sie
zusammen mit der LAN-Route bekannt. Der Einrichtungsbefehl fügt diesen Fallback nur
für `lan` hinzu; `custom` und `tailnet` behalten ihre explizit bekannt gegebenen Routen bei. Die
iOS-App prüft die bekannt gegebenen Routen der Reihe nach und speichert den ersten erreichbaren
Endpunkt.

### Ein Node-Gerät genehmigen

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Genehmigung abgelehnt wird, weil die genehmigende Sitzung des gekoppelten Geräts
nur mit Pairing-Berechtigungsumfang geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes, administratorfähiges gekoppeltes Gerät ein neues
Pairing für die Control UI bzw. den Browser wiederherstellen, ohne den Pairing-Speicher manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät den Versuch mit anderen Authentifizierungsdetails wiederholt (beispielsweise mit einer anderen
Rolle, anderen Berechtigungsbereichen oder einem anderen öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht unbemerkt umfassenderen Zugriff. Wenn es beim erneuten Verbinden weitere Berechtigungsbereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die vorhandene Genehmigung unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell genehmigten Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie die Genehmigung erteilen.
</Note>

### Optionale automatische Genehmigung von Nodes für vertrauenswürdige CIDRs

Das Geräte-Pairing erfolgt standardmäßig weiterhin manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Genehmigung erstmaliger Nodes mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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
Berechtigungsbereiche. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin eine manuelle
Genehmigung. Änderungen an Rolle, Berechtigungsumfang, Metadaten und öffentlichem Schlüssel erfordern weiterhin eine manuelle
Genehmigung.

### Speicherung des Node-Pairing-Zustands

Gespeichert in der gemeinsamen SQLite-Zustandsdatenbank unter `~/.openclaw/state/openclaw.sqlite`:

- ausstehende Anfragen für Geräte-Pairing (kurzlebig; sie laufen nach 5 Minuten ab)
- gekoppelte Geräte und Tokens

Ältere Gateways speicherten diesen Zustand in `~/.openclaw/devices/*.json`; diese Dateien werden
beim Start des Gateways in SQLite importiert und mit dem Suffix `.migrated` archiviert.

### Hinweise

- Die API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) verwaltet
  Genehmigungen für Node-Funktionen, die in denselben Datensätzen gekoppelter Geräte gespeichert werden. WS-Nodes
  erfordern weiterhin Geräte-Pairing; siehe [Node-Pairing](/de/gateway/pairing).
- Der Pairing-Datensatz ist die dauerhafte maßgebliche Quelle für genehmigte Rollen. Aktive
  Geräte-Tokens bleiben auf diese genehmigte Rollenmenge beschränkt; ein einzelner Token-Eintrag
  außerhalb der genehmigten Rollen erzeugt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell und Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sichere Aktualisierung (Doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
