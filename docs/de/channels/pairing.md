---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-07-24T03:40:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc874d660509f59bc26795c8b3ce13f5d238cd61154c717637f5d545b995fb08
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Zugriffsfreigabeschritt von OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot kommunizieren darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (Zugriff auf eingehende Chats)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Die standardmäßigen DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich zugängliche Konfigurationen. Wenn der vorhandene
Status `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Freigaben im Pairing-Speicher erweitern den `open`-Zugriff nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Laufen nach 1 Stunde ab**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanalkonto** begrenzt; zusätzliche Anfragen werden ignoriert, bis eine abläuft oder freigegeben wird.

### Über die Control UI freigeben

Öffnen Sie **Settings → Channels → DM access requests**. Die Warteschlange fasst ausstehende
Anfragen aus allen konfigurierten Kanalkonten zusammen, deren DM-Richtlinie `pairing` lautet.
Filtern Sie nach Kanal oder Konto, prüfen Sie Absender-ID und Metadaten und wählen Sie anschließend
**Approve**.

Die Freigabe gewährt nur Zugriff auf Direktnachrichten. Sie gewährt keinen Gruppenzugriff. Der
Freigabedialog bietet außerdem die folgenden expliziten Optionen, sofern unterstützt:

- **Anfragenden nach der Freigabe benachrichtigen**
- **Diesen Absender außerdem zum ersten Befehlsinhaber machen**, wird nur angezeigt, wenn kein Befehlsinhaber
  vorhanden ist und die Control-UI-Sitzung über `operator.admin` verfügt

Wählen Sie **Dismiss**, um eine ausstehende Anfrage zu entfernen, ohne sie freizugeben. Das Verwerfen ist
keine dauerhafte Sperre; der Absender kann später erneut Zugriff anfordern.

### Über die CLI freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Fügen Sie `--notify` hinzu, um den Anfragenden auf demselben Kanal zu benachrichtigen. Kanäle mit mehreren Konten
akzeptieren `--account <id>`.

Anders als beim expliziten Kontrollkästchen der Control UI initialisiert die CLI automatisch
`commands.ownerAllowFrom`, wenn kein Befehlsinhaber konfiguriert ist, und verwendet dabei einen Eintrag
wie `telegram:123456789`. Dadurch erhalten erstmalige Einrichtungen einen expliziten Inhaber für
privilegierte Befehle und Aufforderungen zur Ausführungsfreigabe. Sobald ein Inhaber vorhanden ist,
gewähren spätere Pairing-Freigaben nur DM-Zugriff; sie fügen keine weiteren Inhaber hinzu.

<Note>
Der Anmelde-QR-Code von WhatsApp verknüpft ein WhatsApp-Konto mit OpenClaw. DM-Zugriffsanfragen
geben Personen frei, die diesem Konto Nachrichten senden. Dies sind separate Abläufe.
</Note>

Unterstützte Kanäle (jedes installierte Kanal-Plugin, das Pairing deklariert; externe Plugins wie `openclaw-weixin` können weitere hinzufügen): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn derselbe Satz vertrauenswürdiger Absender für
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

Zugriffsgruppen sind hier ausführlich dokumentiert: [Zugriffsgruppen](/de/channels/access-groups)

### Speicherort des Status

Gespeichert in der gemeinsam genutzten SQLite-Statusdatenbank unter
`~/.openclaw/state/openclaw.sqlite`:

- ausstehende Anfragen in `channel_pairing_requests`
- freigegebene Absender in `channel_pairing_allow_entries`

Verhalten der Kontobereichszuordnung:

- jede Anfrage und jeder freigegebene Absender wird nach Kanal und Konto schlüsselbasiert gespeichert
- die Laufzeit liest nur die kanonischen SQLite-Zeilen; sie führt keine Legacy-Dateien zusammen

Ältere Gateways schrieben `<channel>-pairing.json` und
`<channel>-<accountId>-allowFrom.json` unter `~/.openclaw/credentials/`.
Die Startmigration und `openclaw doctor --fix` importieren diese Dateien in SQLite und
entfernen jede Quelldatei nach einem erfolgreichen Import. Behandeln Sie die SQLite-Datenbank als
vertraulich, da diese Zeilen den Zugriff auf Ihren Assistenten steuern.

<Note>
Der Speicher der Pairing-Zulassungsliste ist für den DM-Zugriff vorgesehen. Die Gruppenautorisierung erfolgt separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Inhabers ist ein separater Konfigurationsstatus
in `commands.ownerAllowFrom`, und die Zustellung von Gruppenchats folgt weiterhin den
Gruppenzulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder gruppen-
beziehungsweise themenspezifischen Überschreibungen, abhängig vom Kanal).
</Note>

## 2) Pairing von Node-Geräten (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Pairing über die Control UI (empfohlen)

Verwenden Sie eine bereits verbundene Control-UI-Sitzung mit `operator.admin`-Zugriff:

1. Öffnen Sie die Control UI und navigieren Sie zu **Settings → Devices**.
2. Klicken Sie auf der Seite **Devices** auf **Pair mobile device**.
3. Behalten Sie **Full access (recommended)** bei oder wählen Sie **Limited access**, um
   administrative Gateway-Steuerelemente auszulassen.
4. Klicken Sie auf **Create setup code**.
5. Öffnen Sie auf Ihrem Telefon die OpenClaw-App → **Settings** → **Gateway**.
6. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und stellen Sie anschließend die Verbindung her.

Offizielle OpenClaw-Apps für iOS und Android werden automatisch freigegeben, wenn ihre
Einrichtungscode-Metadaten übereinstimmen. Wenn **Pending approval** eine Anfrage anzeigt (zum
Beispiel für einen nicht offiziellen Client oder nicht übereinstimmende Metadaten), prüfen Sie vor
der Freigabe dessen Rolle und Berechtigungsbereiche.

Die Schaltfläche ist deaktiviert, wenn die aktuelle Control-UI-Sitzung keinen
Administratorzugriff besitzt. Verwenden Sie in diesem Fall den nachstehenden CLI-Freigabeablauf auf dem
Gateway-Host.

### Pairing über Telegram

Wenn Sie das Plugin `device-pair` verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram folgende Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram einfach zu kopieren und einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Settings → Gateway.
4. Scannen Sie den QR-Code (`/pair qr`) oder fügen Sie den Einrichtungscode ein und stellen Sie eine Verbindung her.
5. Die offizielle mobile App stellt automatisch eine Verbindung her. Wenn `/pair pending` eine
   Anfrage anzeigt, prüfen Sie vor der Freigabe deren Rolle und Berechtigungsbereiche.

Der Einrichtungscode ist eine Base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `urls`: sofern verfügbar, die geordneten LAN-/Tailnet-Routen, welche die mobile App ausprobieren kann
- `bootstrapToken`: ein einmalig verwendbares Bootstrap-Token für den initialen Pairing-Handshake; das Gateway lässt es nach 10 Minuten ablaufen

Führen Sie `/pair cleanup` aus, um nicht verwendete Einrichtungscodes nach Abschluss des Pairings ungültig zu machen.

Dieses Bootstrap-Token enthält das integrierte Pairing-Bootstrap-Profil:

- eine sichere `wss://`-Einrichtung (oder ein Loopback auf demselben Host) verwendet standardmäßig `node` sowie vollständigen
  nativen mobilen `operator`-Zugriff
- das übergebene `node`-Token bleibt `scopes: []`
- das standardmäßig übergebene `operator`-Token umfasst `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` und
  `operator.write`
- **Limited access** in der Control UI und `openclaw qr --limited` lassen
  `operator.admin` aus, behalten jedoch die anderen Operator-Berechtigungsbereiche bei
- eine Klartext-LAN-Einrichtung über `ws://` verwendet automatisch dasselbe eingeschränkte Profil;
  konfigurieren Sie `wss://` oder Tailscale Serve und erzeugen Sie einen neuen Code für vollständigen Zugriff
- spätere Token-Rotation beziehungsweise ein späterer Token-Widerruf bleibt sowohl durch den freigegebenen
  Rollenvertrag des Geräts als auch durch die Operator-Berechtigungsbereiche der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Die Seiten **Settings → Gateway** unter iOS und Android zeigen den Zugriff als **Full** oder **Limited**
an. Um den Zugriff eines eingeschränkten Telefons zu erweitern, konfigurieren Sie zunächst eine sichere `wss://`- oder
Tailscale-Serve-Route. Erzeugen Sie anschließend einen neuen Einrichtungscode für vollständigen Zugriff, scannen Sie ihn
oder fügen Sie ihn auf dieser Einstellungsseite ein und stellen Sie die Verbindung erneut her.

Verwenden Sie für das mobile Pairing über Tailscale, öffentliche oder andere Remote-Verbindungen Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-Einrichtungscodes für `ws://` werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Host des Android-
Emulators akzeptiert. Klartext-Routen ohne Loopback erhalten eingeschränkten Zugriff. Tailnet-
CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts werden weiterhin standardmäßig abgelehnt, bevor
QR- beziehungsweise Einrichtungscodes ausgegeben werden.

Für `gateway.bind=lan`-Einrichtungs-URLs erkennt OpenClaw persistente HTTPS-Roots von Tailscale Serve,
die den Loopback-Port des aktiven Gateways als Proxy bereitstellen, und kündigt sie
zusammen mit der LAN-Route an. Der Einrichtungsbefehl fügt diesen Fallback nur
für `lan` hinzu; `custom` und `tailnet` behalten ihre explizit angekündigten Routen bei. Die
iOS-App prüft die angekündigten Routen der Reihe nach und speichert den ersten erreichbaren
Endpunkt.

### Ein Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Freigabe abgelehnt wird, weil die freigebende Sitzung des gekoppelten Geräts
nur mit Pairing-Berechtigungsbereich geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes, für Administratorzugriff geeignetes gekoppeltes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne den Pairing-Speicher manuell zu bearbeiten. Das
Gateway validiert die erneut versuchte Verbindung weiterhin; Tokens, die sich nicht mit
`operator.admin` authentifizieren können, bleiben gesperrt.

Wenn dasselbe Gerät den Vorgang mit anderen Authentifizierungsdetails wiederholt (zum Beispiel mit einer anderen
Rolle, anderen Berechtigungsbereichen oder einem anderen öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht unbemerkt weitergehenden Zugriff. Wenn es beim erneuten Verbinden mehr Berechtigungsbereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die bestehende Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie die Freigabe erteilen.
</Note>

### Optionale automatische Freigabe von Nodes aus vertrauenswürdigen CIDR-Bereichen

Das Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Freigabe erstmaliger Nodes mit expliziten CIDR-Bereichen oder exakten IP-Adressen aktivieren:

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
Berechtigungsbereiche. Operator-, Browser-, Control-UI- und WebChat-Clients erfordern weiterhin eine manuelle
Freigabe. Änderungen an Rolle, Berechtigungsbereich, Metadaten und öffentlichem Schlüssel erfordern ebenfalls eine manuelle
Freigabe.

### Speicherung des Node-Pairing-Status

Gespeichert in der gemeinsam genutzten SQLite-Statusdatenbank unter `~/.openclaw/state/openclaw.sqlite`:

- ausstehende Geräte-Pairing-Anfragen (kurzlebig; sie laufen nach 5 Minuten ab)
- gekoppelte Geräte und Tokens

Ältere Gateways speicherten diesen Zustand in `~/.openclaw/devices/*.json`; diese Dateien werden
beim Start des Gateways in SQLite importiert und mit dem Suffix `.migrated` archiviert.

### Hinweise

- Die API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) verwaltet
  Genehmigungen für Node-Funktionen, die in denselben Datensätzen der gekoppelten Geräte gespeichert sind. WS-Nodes
  erfordern weiterhin eine Gerätekopplung; siehe [Node-Kopplung](/de/gateway/pairing).
- Der Kopplungsdatensatz ist die dauerhafte maßgebliche Quelle für genehmigte Rollen. Aktive
  Geräte-Token bleiben auf diese genehmigte Rollenmenge beschränkt; ein vereinzelter Token-Eintrag
  außerhalb der genehmigten Rollen gewährt keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell und Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (Doctor ausführen): [Aktualisieren](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
