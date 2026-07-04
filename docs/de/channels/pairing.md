---
read_when:
    - Zugriffskontrolle für Direktnachrichten einrichten
    - Einen neuen iOS-/Android-Node koppeln
    - OpenClaw-Sicherheitslage überprüfen
summary: 'Kopplungsübersicht: Genehmigen, wer Ihnen Direktnachrichten senden darf und welche Knoten beitreten dürfen'
title: Kopplung
x-i18n:
    generated_at: "2026-07-04T17:53:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

„Pairing“ ist der explizite Schritt zur Zugriffsfreigabe in OpenClaw.
Es wird an zwei Stellen verwendet:

1. **DM-Pairing** (wer mit dem Bot sprechen darf)
2. **Node-Pairing** (welche Geräte/Nodes dem Gateway-Netzwerk beitreten dürfen)

Sicherheitskontext: [Sicherheit](/de/gateway/security)

## 1) DM-Pairing (eingehender Chat-Zugriff)

Wenn ein Kanal mit der DM-Richtlinie `pairing` konfiguriert ist, erhalten unbekannte Absender einen Kurzcode, und ihre Nachricht wird **nicht verarbeitet**, bis Sie sie freigeben.

Standard-DM-Richtlinien sind hier dokumentiert: [Sicherheit](/de/gateway/security)

`dmPolicy: "open"` ist nur dann öffentlich, wenn die effektive DM-Zulassungsliste `"*"` enthält.
Setup und Validierung verlangen diesen Platzhalter für öffentlich offene Konfigurationen. Wenn der vorhandene
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

Wenn noch kein Befehls-Owner konfiguriert ist, initialisiert die Freigabe eines DM-Pairing-Codes auch
`commands.ownerAllowFrom` mit dem freigegebenen Absender, beispielsweise `telegram:123456789`.
Damit erhalten Erst-Setups einen expliziten Owner für privilegierte Befehle und Exec-
Freigabeaufforderungen. Nachdem ein Owner vorhanden ist, gewähren spätere Pairing-Freigaben nur DM-
Zugriff; sie fügen keine weiteren Owner hinzu.

Unterstützte Kanäle: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wiederverwendbare Absendergruppen

Verwenden Sie `accessGroups` auf oberster Ebene, wenn dieselbe vertrauenswürdige Absendermenge für
mehrere Nachrichtenkanäle oder sowohl für DM- als auch Gruppen-Zulassungslisten gelten soll.

Statische Gruppen verwenden `type: "message.senders"` und werden in Kanal-Zulassungslisten mit
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
- Speicher für freigegebene Zulassungsliste:
  - Standardkonto: `<channel>-allowFrom.json`
  - Nicht-Standardkonto: `<channel>-<accountId>-allowFrom.json`

Verhalten bei Konten-Scopes:

- Nicht-Standardkonten lesen/schreiben nur ihre gescopte Zulassungslisten-Datei.
- Das Standardkonto verwendet die kanalbezogene, nicht gescopte Zulassungslisten-Datei.

Behandeln Sie diese Daten als sensibel (sie steuern den Zugriff auf Ihren Assistenten).

<Note>
Der Pairing-Zulassungslisten-Speicher dient dem DM-Zugriff. Gruppenautorisierung ist separat.
Die Freigabe eines DM-Pairing-Codes erlaubt diesem Absender nicht automatisch, Gruppenbefehle
auszuführen oder den Bot in Gruppen zu steuern. Die Initialisierung des ersten Owners ist ein separater
Konfigurationszustand in `commands.ownerAllowFrom`, und die Zustellung in Gruppenchats folgt weiterhin den
Gruppen-Zulassungslisten des Kanals (zum Beispiel `groupAllowFrom`, `groups` oder kanalabhängigen
Überschreibungen pro Gruppe oder pro Thema).
</Note>

## 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)

Nodes verbinden sich mit dem Gateway als **Geräte** mit `role: node`. Das Gateway
erstellt eine Geräte-Pairing-Anfrage, die freigegeben werden muss.

### Über die Control UI koppeln (empfohlen)

Verwenden Sie eine bereits verbundene Control-UI-Sitzung mit `operator.admin`-Zugriff:

1. Öffnen Sie die Control UI und wählen Sie **Nodes** aus.
2. Klicken Sie unter **Geräte** auf **Mobiles Gerät koppeln**.
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-App → **Einstellungen** → **Gateway**.
4. Scannen Sie den QR-Code oder fügen Sie den Setup-Code ein und stellen Sie dann die Verbindung her.

Offizielle OpenClaw-Apps für iOS und Android werden automatisch freigegeben, wenn ihre
Setup-Code-Metadaten übereinstimmen. Wenn **Geräte** eine ausstehende Anfrage anzeigt (zum
Beispiel für einen nicht offiziellen Client oder nicht übereinstimmende Metadaten), prüfen Sie Rolle und
Scopes, bevor Sie sie freigeben.

Die Schaltfläche ist deaktiviert, wenn die aktuelle Control-UI-Sitzung keinen Administratorzugriff hat.
Verwenden Sie in diesem Fall den untenstehenden CLI-Freigabeablauf vom Gateway-Host aus.

### Über Telegram koppeln

Wenn Sie das `device-pair`-Plugin verwenden, können Sie das erstmalige Geräte-Pairing vollständig über Telegram durchführen:

1. Senden Sie Ihrem Bot in Telegram eine Nachricht: `/pair`
2. Der Bot antwortet mit zwei Nachrichten: einer Anleitungsnachricht und einer separaten Nachricht mit dem **Setup-Code** (in Telegram leicht zu kopieren/einzufügen).
3. Öffnen Sie auf Ihrem Telefon die OpenClaw-iOS-App → Einstellungen → Gateway.
4. Scannen Sie den QR-Code oder fügen Sie den Setup-Code ein und verbinden Sie sich.
5. Die offizielle mobile App verbindet sich automatisch. Wenn `/pair pending` eine
   Anfrage anzeigt, prüfen Sie Rolle und Scopes, bevor Sie sie freigeben.

Der Setup-Code ist eine base64-codierte JSON-Nutzlast, die Folgendes enthält:

- `url`: die Gateway-WebSocket-URL (`ws://...` oder `wss://...`)
- `bootstrapToken`: ein kurzlebiges Bootstrap-Token für ein einzelnes Gerät, das für den initialen Pairing-Handshake verwendet wird

Dieses Bootstrap-Token trägt das integrierte Pairing-Bootstrap-Profil:

- Das integrierte Setup-Profil erlaubt nur die frische QR-/Setup-Code-Baseline:
  `node` plus eine begrenzte `operator`-Übergabe
- Das übergebene `node`-Token bleibt `scopes: []`
- Das übergebene `operator`-Token ist auf `operator.approvals`,
  `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt
- `operator.admin` wird durch den QR-/Setup-Code-Bootstrap nicht gewährt; dafür ist ein
  separater freigegebener Operator-Pairing- oder Token-Ablauf erforderlich
- Spätere Token-Rotation/-Widerruf bleiben sowohl durch den freigegebenen
  Rollenvertrag des Geräts als auch durch die Operator-Scopes der aufrufenden Sitzung begrenzt

Behandeln Sie den Setup-Code wie ein Passwort, solange er gültig ist.

Für Tailscale, öffentliche oder andere entfernte mobile Pairing-Szenarien verwenden Sie Tailscale Serve/Funnel
oder eine andere `wss://`-Gateway-URL. Klartext-Setup-Codes mit `ws://` werden nur
für Loopback, private LAN-Adressen, `.local`-Bonjour-Hosts und den Android-
Emulator-Host akzeptiert. Tailnet-CGNAT-Adressen, `.ts.net`-Namen und öffentliche Hosts werden weiterhin
vor der QR-/Setup-Code-Ausgabe fail-closed abgelehnt.

### Node-Gerät freigeben

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Wenn eine explizite Freigabe verweigert wird, weil die freigebende gekoppelte Gerätesitzung
nur mit Pairing-Scope geöffnet wurde, versucht die CLI dieselbe Anfrage erneut mit
`operator.admin`. Dadurch kann ein vorhandenes, adminfähiges gekoppeltes Gerät ein neues
Control-UI-/Browser-Pairing wiederherstellen, ohne `devices/paired.json` manuell zu bearbeiten. Das
Gateway validiert die erneut versuchte Verbindung weiterhin; Tokens, die sich nicht mit
`operator.admin` authentifizieren können, bleiben blockiert.

Wenn dasselbe Gerät es mit anderen Authentifizierungsdetails erneut versucht (zum Beispiel mit anderer
Rolle/anderen Scopes/anderem öffentlichen Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue
`requestId` erstellt.

<Note>
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend breiteren Zugriff. Wenn es sich erneut verbindet und mehr Scopes oder eine breitere Rolle anfordert, behält OpenClaw die bestehende Freigabe unverändert bei und erstellt eine neue ausstehende Upgrade-Anfrage. Verwenden Sie `openclaw devices list`, um den aktuell freigegebenen Zugriff mit dem neu angeforderten Zugriff zu vergleichen, bevor Sie freigeben.
</Note>

### Optionales automatisches Freigeben von Nodes über vertrauenswürdige CIDRs

Geräte-Pairing bleibt standardmäßig manuell. Für streng kontrollierte Node-Netzwerke
können Sie sich mit expliziten CIDRs oder exakten IPs für die automatische erstmalige Node-Freigabe entscheiden:

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
Freigabe. Änderungen an Rolle, Scope, Metadaten und öffentlichem Schlüssel erfordern weiterhin manuelle
Freigabe.

### Zustandsspeicherung für Node-Pairing

Gespeichert unter `~/.openclaw/devices/`:

- `pending.json` (kurzlebig; ausstehende Anfragen laufen ab)
- `paired.json` (gekoppelte Geräte + Tokens)

### Hinweise

- Die Legacy-API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) ist ein
  separater, vom Gateway verwalteter Pairing-Speicher. WS-Nodes benötigen weiterhin Geräte-Pairing.
- Der Pairing-Datensatz ist die dauerhafte Quelle der Wahrheit für freigegebene Rollen. Aktive
  Geräte-Tokens bleiben auf diese freigegebene Rollenmenge begrenzt; ein verwaister Token-Eintrag
  außerhalb der freigegebenen Rollen schafft keinen neuen Zugriff.

## Verwandte Dokumentation

- Sicherheitsmodell + Prompt Injection: [Sicherheit](/de/gateway/security)
- Sicher aktualisieren (Doctor ausführen): [Aktualisierung](/de/install/updating)
- Kanalkonfigurationen:
  - Telegram: [Telegram](/de/channels/telegram)
  - WhatsApp: [WhatsApp](/de/channels/whatsapp)
  - Signal: [Signal](/de/channels/signal)
  - iMessage: [iMessage](/de/channels/imessage)
  - Discord: [Discord](/de/channels/discord)
  - Slack: [Slack](/de/channels/slack)
