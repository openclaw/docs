---
read_when:
    - DM-Zugriffskontrolle einrichten
    - Koppeln eines neuen iOS-/Android-Node
    - Überprüfung der Sicherheitslage von OpenClaw
summary: 'Pairing-Übersicht: Genehmigen Sie, wer Ihnen Direktnachrichten senden darf und welche Nodes beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-07-16T12:43:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der ausdrückliche Schritt zur Zugriffsfreigabe von OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot kommunizieren darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (Zugriff auf eingehende Chats)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen kurzen Code, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Die standardmäßigen DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur öffentlich, wenn die effektive DM-Zulassungsliste `"*"` enthält.
Einrichtung und Validierung erfordern diesen Platzhalter für öffentlich zugängliche Konfigurationen. Wenn der vorhandene
Zustand `open` mit konkreten `allowFrom`-Einträgen enthält, lässt die Laufzeit weiterhin
nur diese Absender zu, und Freigaben im Pairing-Speicher erweitern den Zugriff über `open` nicht.

Pairing-Codes:

- 8 Zeichen, Großbuchstaben, keine mehrdeutigen Zeichen (`0O1I`).
- **Verfallen nach 1 Stunde**. Der Bot sendet die Pairing-Nachricht nur, wenn eine neue Anfrage erstellt wird (ungefähr einmal pro Stunde und Absender).
- Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanalkonto** begrenzt; weitere Anfragen werden ignoriert, bis eine verfällt oder freigegeben wird.

### Einen Absender freigeben

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Fügen Sie dem Freigabebefehl `--notify` hinzu, um den Anfragenden im selben Kanal zu benachrichtigen. Kanäle mit mehreren Konten akzeptieren `--account <id>`.

Wenn noch kein Befehlsinhaber konfiguriert ist, initialisiert die Freigabe eines DM-Pairing-Codes außerdem
`commands.ownerAllowFrom` mit dem freigegebenen Absender, beispielsweise `telegram:123456789`.
Dadurch erhalten erstmalige Einrichtungen einen ausdrücklichen Inhaber für privilegierte Befehle und
Freigabeaufforderungen zur Ausführung. Sobald ein Inhaber vorhanden ist, gewähren spätere Pairing-Freigaben nur
DM-Zugriff; sie fügen keine weiteren Inhaber hinzu.

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

Zugriffsgruppen sind hier ausführlich dokumentiert: [Zugriffsgruppen](/de/channels/access-groups)

### Speicherort des Zustands

Gespeichert in der gemeinsamen SQLite-Zustandsdatenbank unter
`~/.openclaw/state/openclaw.sqlite`:

- ausstehende Anfragen in `channel_pairing_requests`
- freigegebene Absender in `channel_pairing_allow_entries`

Verhalten bei der Kontozuordnung:

- jede Anfrage und jeder freigegebene Absender ist nach Kanal und Konto verschlüsselt
- die Laufzeit liest nur die kanonischen SQLite-Zeilen; sie führt keine veralteten Dateien zusammen

Ältere Gateways schrieben `<channel>-pairing.json` und
`<channel>-<accountId>-allowFrom.json` unter `~/.openclaw/credentials/`.
Die Startmigration und `openclaw doctor --fix` importieren diese Dateien in SQLite und
entfernen jede Quelldatei nach einem erfolgreichen Import. Behandeln Sie die SQLite-Datenbank als
vertraulich, da diese Zeilen den Zugriff auf Ihren Assistenten steuern.

<Note>
Der Speicher der Pairing-Zulassungsliste dient dem DM-Zugriff. Die Gruppenautorisierung erfolgt separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Inhabers ist ein separater Konfigurationszustand
in `commands.ownerAllowFrom`, und die Zustellung von Gruppenchats folgt weiterhin den
Gruppenzulassungslisten des Kanals (beispielsweise `groupAllowFrom`, `groups` oder Überschreibungen pro Gruppe
oder Thema, abhängig vom Kanal).
</Note>

## 2) Pairing von Node-Geräten (iOS-/Android-/macOS-/Headless-Nodes)

Nodes verbinden sich als **Geräte** mit `role: node` mit dem Gateway. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Pairing über die Control UI (empfohlen)

Verwenden Sie eine bereits verbundene Control-UI-Sitzung mit Zugriff über `operator.admin`:

1. Öffnen Sie die Control UI und navigieren Sie zu **Settings → Devices**.
2. Klicken Sie auf der Seite **Devices** auf **Pair mobile device**.
3. Behalten Sie **Full access (recommended)** bei oder wählen Sie **Limited access**, um
   administrative Gateway-Steuerelemente auszuschließen.
4. Klicken Sie auf **Create setup code**.
5. Öffnen Sie auf Ihrem Telefon die OpenClaw-App → **Settings** → **Gateway**.
6. Scannen Sie den QR-Code oder fügen Sie den Einrichtungscode ein und stellen Sie dann die Verbindung her.

Offizielle OpenClaw-Apps für iOS und Android werden automatisch freigegeben, wenn ihre
Einrichtungscode-Metadaten übereinstimmen. Wenn unter **Pending approval** eine Anfrage angezeigt wird (zum
Beispiel für einen nicht offiziellen Client oder bei nicht übereinstimmenden Metadaten), prüfen Sie vor der Freigabe deren Rolle und
Geltungsbereiche.

Die Schaltfläche ist deaktiviert, wenn die aktuelle Control-UI-Sitzung keinen
Administratorzugriff besitzt. Verwenden Sie in diesem Fall den nachfolgenden CLI-Freigabeablauf auf dem Gateway-Host.

### Pairing über Telegram

Wenn Sie das Plugin `device-pair` verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram folgende Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anweisung und einer separaten Nachricht mit dem **Einrichtungscode** (in Telegram einfach zu kopieren und einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Settings → Gateway.
4. Scannen Sie den QR-Code (`/pair qr`) oder fügen Sie den Einrichtungscode ein und stellen Sie die Verbindung her.
5. Die offizielle mobile App stellt automatisch eine Verbindung her. Wenn `/pair pending` eine
   Anfrage anzeigt, prüfen Sie vor der Freigabe deren Rolle und Geltungsbereiche.

Der Einrichtungscode ist eine Base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `urls`: sofern verfügbar, die geordneten LAN-/Tailnet-Routen, die die mobile App ausprobieren kann
- `bootstrapToken`: ein einmal verwendbares Bootstrap-Token für den anfänglichen Pairing-Handshake; das Gateway lässt es nach 10 Minuten verfallen

Führen Sie `/pair cleanup` aus, um ungenutzte Einrichtungscodes nach Abschluss des Pairings ungültig zu machen.

Dieses Bootstrap-Token enthält das integrierte Pairing-Bootstrap-Profil:

- eine sichere `wss://`-Einrichtung (oder Loopback auf demselben Host) verwendet standardmäßig `node` sowie vollständigen
  nativen mobilen Zugriff über `operator`
- das übergebene `node`-Token bleibt `scopes: []`
- das standardmäßig übergebene `operator`-Token enthält `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` und
  `operator.write`
- Control UI **Limited access** und `openclaw qr --limited` lassen
  `operator.admin` aus, während die anderen Operator-Geltungsbereiche erhalten bleiben
- eine Klartext-LAN-Einrichtung über `ws://` verwendet automatisch dasselbe eingeschränkte Profil;
  konfigurieren Sie `wss://` oder Tailscale Serve und generieren Sie einen neuen Code für vollständigen Zugriff
- eine spätere Token-Rotation oder ein späterer Token-Widerruf bleibt sowohl durch den freigegebenen
  Rollenvertrag des Geräts als auch durch die Operator-Geltungsbereiche der aufrufenden Sitzung begrenzt

Behandeln Sie den Einrichtungscode wie ein Passwort, solange er gültig ist.

Die Seiten **Settings → Gateway** unter iOS und Android zeigen den Zugriff **Full** oder **Limited**
an. Um ein eingeschränktes Telefon hochzustufen, konfigurieren Sie zuerst eine sichere Route über `wss://` oder
Tailscale Serve, generieren Sie anschließend einen neuen Einrichtungscode mit vollständigem Zugriff, scannen Sie ihn oder fügen Sie ihn
auf dieser Einstellungsseite ein und stellen Sie die Verbindung erneut her.

Verwenden Sie für mobiles Pairing über Tailscale, öffentliche oder andere Remote-Verbindungen Tailscale Serve/Funnel
oder eine andere Gateway-URL über `wss://`. Klartext-Einrichtungscodes über `ws://` werden nur
für Loopback, private LAN-Adressen, Bonjour-Hosts mit `.local` und den Android-
Emulatorhost akzeptiert. Klartextrouten ohne Loopback erhalten eingeschränkten Zugriff. Tailnet-
CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts werden weiterhin vor der
Ausgabe des QR-/Einrichtungscodes standardmäßig abgelehnt.

Für Einrichtungs-URLs über `gateway.bind=lan` erkennt OpenClaw persistente HTTPS-Roots von Tailscale Serve,
die den Loopback-Port des aktiven Gateways als Proxy weiterleiten, und gibt sie
zusammen mit der LAN-Route bekannt. Der Einrichtungsbefehl fügt diesen Fallback nur
für `lan` hinzu; `custom` und `tailnet` behalten ihre ausdrücklich bekannt gegebenen Routen bei. Die
iOS-App prüft die bekannt gegebenen Routen der Reihe nach und speichert den ersten erreichbaren
Endpunkt.

### Ein Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine ausdrückliche Freigabe abgelehnt wird, weil die freigebende Sitzung des gekoppelten Geräts
nur mit Pairing-Geltungsbereich geöffnet wurde, wiederholt die CLI dieselbe Anfrage mit
`operator.admin`. Dadurch kann ein vorhandenes, administratorfähiges gekoppeltes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne den Pairing-Speicher manuell zu bearbeiten. Das
Gateway validiert die wiederholte Verbindung weiterhin; Tokens, die sich nicht
mit `operator.admin` authentifizieren können, bleiben gesperrt.

Wenn dasselbe Gerät den Vorgang mit anderen Authentifizierungsdetails wiederholt (beispielsweise mit einer anderen
Rolle, anderen Geltungsbereichen oder einem anderen öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff. Wenn es bei der erneuten Verbindung weitere Geltungsbereiche oder eine umfassendere Rolle anfordert, behält OpenClaw die vorhandene Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den derzeit freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie die Freigabe erteilen.
</Note>

### Optionale automatische Freigabe von Nodes aus vertrauenswürdigen CIDR-Bereichen

Das Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie die automatische Freigabe erstmaliger Nodes mit ausdrücklichen CIDRs oder exakten IP-Adressen aktivieren:

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

Dies gilt nur für neue Pairing-Anfragen von `role: node` ohne angeforderte
Geltungsbereiche. Operator-, Browser-, Control-UI- und WebChat-Clients benötigen weiterhin eine manuelle
Freigabe. Änderungen an Rolle, Geltungsbereich, Metadaten und öffentlichem Schlüssel erfordern ebenfalls weiterhin eine manuelle
Freigabe.

### Speicherung des Node-Pairing-Zustands

Gespeichert in der gemeinsamen SQLite-Zustandsdatenbank unter `~/.openclaw/state/openclaw.sqlite`:

- ausstehende Geräte-Pairing-Anfragen (kurzlebig; sie verfallen nach 5 Minuten)
- gekoppelte Geräte und Tokens

Ältere Gateways speicherten diesen Zustand in `~/.openclaw/devices/*.json`; diese Dateien werden
beim Start des Gateways in SQLite importiert und mit dem Suffix `.migrated` archiviert.

### Hinweise

- Die API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) verwaltet
  Freigaben für Node-Fähigkeiten, die in denselben Datensätzen gekoppelter Geräte gespeichert sind. WS-Nodes
  benötigen weiterhin ein Geräte-Pairing; siehe [Node-Pairing](/de/gateway/pairing).
- Der Pairing-Datensatz ist die dauerhafte maßgebliche Quelle für freigegebene Rollen. Aktive
  Geräte-Tokens bleiben auf diese freigegebene Rollenmenge begrenzt; ein vereinzelter Token-Eintrag
  außerhalb der freigegebenen Rollen schafft keinen neuen Zugriff.

## Zugehörige Dokumentation

- Sicherheitsmodell + Prompt-Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (Doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
