---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Fehlerbehebung bei der Gateway-Erkennung oder Authentifizierung unter Android
    - Spiegeln oder Steuern eines Android-Geräts von einem entfernten Mac aus
    - Überprüfung der Übereinstimmung des Chatverlaufs zwischen Clients
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Verbinden/Chat/Sprachsteuerung/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-07-16T13:01:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die offizielle Android-App ist auf [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) und als signierte eigenständige APK in unterstützten [GitHub-Releases](https://github.com/openclaw/openclaw/releases) verfügbar. Sie ist ein begleitender Node und erfordert einen laufenden OpenClaw Gateway. Quelle: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([Build-Anleitung](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Unterstützungsübersicht

- Rolle: begleitende Node-App (Android hostet den Gateway nicht).
- Gateway erforderlich: ja (führen Sie ihn unter macOS, Linux oder Windows über WSL2 aus).
- Installation: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) oder `OpenClaw-Android.apk` aus einem unterstützten [GitHub-Release](https://github.com/openclaw/openclaw/releases), [Erste Schritte](/de/start/getting-started) für den Gateway, anschließend [Kopplung](/de/channels/pairing).
- Gateway: [Betriebshandbuch](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Steuerungsebene).

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host – siehe [Gateway](/de/gateway).

## Installation außerhalb von Google Play

Reguläre finale und Korrektur-Releases auf GitHub enthalten eine universelle `OpenClaw-Android.apk` und `OpenClaw-Android-SHA256SUMS.txt`. Die APK wird aus dem Release-Tag erstellt, mit dem Android-Release-Schlüssel von OpenClaw signiert und enthält einen GitHub-Actions-Herkunftsnachweis.

Wählen Sie ein [Release](https://github.com/openclaw/openclaw/releases), das beide Assets aufführt, laden Sie dann genau dieses Tag herunter und verifizieren Sie es vor dem Sideloading:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Installationen über Google Play und als eigenständige APK verwenden unterschiedliche Aktualisierungskanäle und können unterschiedliche Signaturidentitäten besitzen. Android kann verlangen, dass die vorhandene App vor dem Wechsel des Kanals deinstalliert wird, wodurch deren lokale App-Daten entfernt werden. Bleiben Sie für reguläre Aktualisierungen bei einem Kanal.
</Warning>

## Android von einem entfernten Mac spiegeln und steuern

[scrcpy](https://github.com/Genymobile/scrcpy) spiegelt einen Android-Bildschirm in einem macOS-Fenster und
leitet Tastatur- und Zeigereingaben über Android Debug Bridge (ADB) weiter. Dies ist ein betreiberseitiger
Workflow, der von der OpenClaw-Node-Verbindung getrennt ist. Er ist nützlich, wenn sich das Android-Gerät und der
Mac an verschiedenen Orten befinden, aber dasselbe private Tailscale-Netzwerk nutzen.

### Vorbereitungen

- Installieren Sie Tailscale auf dem Android-Gerät und dem Mac und verbinden Sie beide mit demselben Tailnet.
- Aktivieren Sie unter Android **Developer options** und **USB debugging**. Android 16 führt **Wireless
  debugging** unter **Settings > System > Developer options** auf. Siehe [Android-Entwickleroptionen](https://developer.android.com/studio/debug/dev-options).
- Installieren Sie scrcpy und ADB auf dem Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Halten Sie das Android-Gerät für die erste Verbindung verfügbar. Android muss den ADB-
  Schlüssel jedes Macs genehmigen, bevor dieser Mac das Gerät steuern kann.

### ADB über TCP aktivieren

Verbinden Sie das Android-Gerät zur Ersteinrichtung per USB mit einem vertrauenswürdigen Computer und bestätigen Sie dessen
Debugging-Abfrage. Führen Sie anschließend Folgendes aus:

```bash
adb devices
adb tcpip 5555
```

Sie können die USB-Verbindung nun trennen. Falls Port 5555 nach einem Geräteneustart oder dem Zurücksetzen des Debuggings nicht mehr lauscht,
wiederholen Sie diesen lokalen Einrichtungsschritt. Ab Android 11 kann die anfängliche Vertrauensstellung auch über
**Wireless debugging > Pair device with pairing code** und `adb pair` hergestellt werden.

### Nur den steuernden Mac zulassen

Tailnets mit restriktiven Freigaben müssen dem steuernden Mac ausdrücklich erlauben, TCP-Port 5555
auf dem Android-Gerät zu erreichen. Fügen Sie der Tailnet-Richtlinie eine eng gefasste Regel hinzu und ersetzen Sie die Beispieladressen
durch die stabilen Tailscale-IPs der beiden Geräte:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Informationen zu Host-Aliasen und anderen Selektoren finden Sie unter [Tailscale-Freigaben](https://tailscale.com/docs/reference/syntax/grants).
Geben Sie diesen Port nicht für das öffentliche Internet frei und exponieren Sie ihn nicht mit Funnel: Ein autorisierter ADB-
Client besitzt umfassende Kontrolle über das Gerät.

### Verbinden und Spiegelung starten

Auf dem entfernten Mac:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Der erste `adb connect` von diesem Mac zeigt unter Android einen Autorisierungsdialog an. Entsperren Sie das Gerät,
bestätigen Sie den Schlüsselfingerabdruck und wählen Sie **Always allow from this computer** nur aus, wenn der Mac
vertrauenswürdig ist. Ein erfolgreicher `adb devices`-Eintrag endet mit `device`; `unauthorized` bedeutet, dass die Abfrage auf dem Gerät
noch nicht genehmigt wurde.

Sobald sich das scrcpy-Fenster öffnet, können Sie es direkt verwenden oder mit einem macOS-Tool zur Bildschirmautomatisierung wie
[Peekaboo](https://peekaboo.sh/) ansteuern. scrcpy überträgt die Anzeige und Eingaben; Tailscale stellt lediglich den
privaten Netzwerkpfad bereit.

### Fehlerbehebung

- `Connection timed out`: Überprüfen Sie die Tailnet-Freigabe für TCP 5555. Ein erfolgreicher `tailscale ping` belegt
  die Erreichbarkeit des Peers, nicht jedoch, dass die Richtlinie diesen TCP-Port zulässt. Testen Sie dies mit
  `nc -vz <android-tailnet-ip> 5555` vom Mac aus.
- `unauthorized`: Entsperren Sie Android und genehmigen Sie den ADB-Schlüssel des entfernten Macs, oder entfernen Sie die veraltete Workstation
  unter **Wireless debugging > Paired devices** und koppeln Sie sie erneut.
- `Connection refused`: Stellen Sie erneut eine lokale Verbindung her und führen Sie `adb tcpip 5555` erneut aus.
- Mehr als ein Gerät aufgeführt: Behalten Sie das explizite Argument `--serial <android-tailnet-ip>:5555` bei.

Schließen Sie nach Abschluss scrcpy und trennen Sie ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Verbindungsleitfaden

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android stellt eine direkte Verbindung zum Gateway-WebSocket her und verwendet die Gerätekopplung (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Unverschlüsseltes `ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt; bei einer Einrichtung außerhalb des Loopbacks wird automatisch eingeschränkter Betreiberzugriff verwendet

### Voraussetzungen

- Gateway läuft auf einem anderen Computer (oder ist über SSH erreichbar).
- Das Android-Gerät bzw. der Emulator kann den Gateway-WebSocket erreichen:
  - Dasselbe LAN mit mDNS/NSD, **oder**
  - Dasselbe Tailscale-Tailnet mit Wide-Area Bonjour / Unicast-DNS-SD (siehe unten), **oder**
  - Manueller Gateway-Host/-Port (Fallback)
- Die Kopplung über Tailnet/öffentliches Mobilfunknetz verwendet **keine** unformatierten Tailnet-IP-Endpunkte vom Typ `ws://`. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Die CLI `openclaw` ist auf dem Gateway-Computer (oder über SSH) verfügbar, um Kopplungsanfragen zu genehmigen.

### 1. Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Vergewissern Sie sich, dass die Protokolle etwa Folgendes enthalten:

- `listening on ws://0.0.0.0:18789`

Bevorzugen Sie für entfernten Android-Zugriff über Tailscale Serve/Funnel anstelle einer direkten Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Eine einfache `gateway.bind: "tailnet"`-Einrichtung reicht für die erstmalige entfernte Android-Kopplung nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2. Erkennung überprüfen (optional)

Auf dem Gateway-Computer:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Hinweise zur Fehlerdiagnose: [Bonjour](/de/gateway/bonjour).

Wenn Sie außerdem eine Wide-Area-Erkennungsdomäne konfiguriert haben, vergleichen Sie dies mit:

```bash
openclaw gateway discover --json
```

Dies zeigt `local.` und die konfigurierte Wide-Area-Domäne in einem Durchlauf an, wobei der aufgelöste Dienstendpunkt statt ausschließlich der TXT-Hinweise verwendet wird.

#### Netzwerkübergreifende Erkennung über Unicast-DNS-SD

Die Android-NSD/mDNS-Erkennung funktioniert nicht netzwerkübergreifend. Wenn sich der Android-Node und der Gateway in unterschiedlichen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / Unicast-DNS-SD. Die Erkennung allein reicht für die Android-Kopplung über Tailnet/öffentliche Netze nicht aus – die erkannte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone (Beispiel: `openclaw.internal.`) ein und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für Ihre ausgewählte Domäne so, dass es auf diesen DNS-Server verweist.

Details und eine CoreDNS-Beispielkonfiguration: [Bonjour](/de/gateway/bonjour).

### 3. Von Android verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Vordergrunddienst** aufrecht (permanente Benachrichtigung).
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn die Erkennung blockiert ist, verwenden Sie unter **Advanced controls** manuell Host und Port. Für private LAN-Hosts funktioniert `ws://` weiterhin. Aktivieren Sie für Tailscale/öffentliche Hosts TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach der ersten erfolgreichen Kopplung stellt Android beim Start automatisch erneut eine Verbindung zum aktiven gekoppelten Gateway her (nach bestem Bemühen bei erkannten Gateways, die im Netzwerk sichtbar sein müssen).

Offizielle Einrichtungscodes verbinden Android als Node und gewähren standardmäßig vollständigen
Gateway-Betreiberzugriff über `wss://`. Bei einer unverschlüsselten `ws://`-Einrichtung außerhalb des Loopbacks
wird zur Sicherheit von Bearer-Tokens automatisch eingeschränkter Zugriff verwendet. **Settings → Gateway**
zeigt den Zugriff **Full** oder **Limited** an. Konfigurieren Sie für eine eingeschränkte Verbindung
`wss://` oder Tailscale Serve, generieren Sie in der Control UI oder
mit `openclaw qr` einen neuen Code für vollständigen Zugriff, scannen Sie ihn anschließend auf dieser Seite oder fügen Sie ihn dort ein und stellen Sie die Verbindung erneut her. Betreiber,
die das eingeschränkte Profil verwenden möchten, können in der Control UI **Limited access** auswählen oder
`openclaw qr --limited` ausführen.

### Mehrere Gateways

Die App führt eine Registrierung aller Gateways, mit denen sie gekoppelt wurde, sodass Sie zwischen ihnen wechseln können, ohne sie erneut zu koppeln:

- **Settings -> Gateways** listet gekoppelte Gateways auf und markiert das aktive. Tippen Sie auf einen Eintrag, um zu wechseln; die App beendet die aktuellen Sitzungen und stellt die Verbindung zum ausgewählten Gateway her.
- Der Tab **Connect** zeigt einen Schnellwechsler an, wenn mehr als ein Gateway gekoppelt ist.
- Anmeldedaten, Geräte-Tokens, TLS-Vertrauensinformationen, Chatverlauf und in der Offline-Warteschlange befindliche Nachrichten werden pro Gateway gespeichert. Beim Wechsel werden niemals Zustände verschiedener Gateways vermischt, und offline in die Warteschlange eingereihte Nachrichten werden nur an den Gateway zugestellt, für den sie erstellt wurden.
- **Forget** entfernt den Registrierungseintrag eines Gateways zusammen mit dessen Anmeldedaten, Geräte-Tokens, TLS-Pin und zwischengespeicherten Chats.

### Präsenzsignale zur Aktivitätsbestätigung

Nachdem die authentifizierte Node-Sitzung verbunden wurde und wenn die App in den Hintergrund wechselt, während der Vordergrunddienst weiterhin verbunden ist, ruft Android `node.event` mit `event: "node.presence.alive"` auf. Der Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf, wenn die Identität des authentifizierten Node-Geräts bekannt ist.

Die App wertet das Signal nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist kompatibel, zählt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Sichtung.

### 4. Kopplung genehmigen (CLI)

Auf dem Gateway-Computer:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zur Kopplung: [Kopplung](/de/channels/pairing).

Optional: Wenn die Android-Node immer eine Verbindung aus einem streng kontrollierten Subnetz herstellt, können Sie die automatische Genehmigung der erstmaligen Node-Kopplung mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für eine neue `role: node`-Kopplung ohne angeforderte Geltungsbereiche. Die Kopplung von Operatoren bzw. Browsern sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordert weiterhin eine manuelle Genehmigung.

### 5. Verbindung der Node überprüfen

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat und Verlauf

Der Android-Tab „Chat“ unterstützt die Sitzungsauswahl (standardmäßig `main` sowie weitere vorhandene Sitzungen):

- Verlauf: `chat.history` (für die Anzeige normalisiert – Inline-Direktiven-Tags, Nur-Text-XML-Nutzdaten von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` und gekürzte Varianten) sowie durchgesickerte ASCII-/vollbreite Modellsteuerungstoken werden entfernt; Assistant-Zeilen mit stillen Token wie exakt `NO_REPLY` / `no_reply` werden ausgelassen; übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Dauerhaftes Senden: Jede Sendung (Text, ausgewählte Bilder und Sprachnachrichten) wird vor jedem Netzwerkversuch in einem Gateway-spezifischen Postausgang auf dem Gerät protokolliert, sodass beim Beenden der App keine übermittelten Eingaben verloren gehen können. Offline in die Warteschlange gestellte Sendungen werden nach dem erneuten Verbinden mit stabilen Idempotenzschlüsseln der Reihe nach zugestellt. Eine Sendung wird erst entfernt, nachdem die Interaktion im kanonischen `chat.history` sichtbar ist – eine Bestätigung allein gilt nicht als Zustellnachweis. Mehrdeutige Ergebnisse (verlorene Bestätigung, Beenden der App während des Sendens, Gateway-Neustart vor dem Schreiben des Transkripts) werden als sichtbare Zeilen mit den expliziten Optionen **Retry**/**Delete** angezeigt, statt automatisch erneut gesendet zu werden. Slash-Befehle werden nach einer erneuten Verbindung nie automatisch wiederholt, sondern für einen expliziten erneuten Versuch zurückgestellt. Die Warteschlange ist begrenzt (50 Nachrichten und 48 MB an Anhangsdaten pro Gateway), und nicht gesendete Zeilen verfallen nach 48 Stunden. Entwürfe im Eingabefeld, die nie abgesendet wurden, bleiben nicht über Prozessgrenzen hinweg erhalten.
- Push-Aktualisierungen (Best Effort): `chat.subscribe` -> `event:"chat"`
- Anhören: Drücken Sie lange auf eine Assistant-Nachricht und wählen Sie **Listen**, um sie anzuhören. Audio wird über Gateway-`tts.speak` mit der konfigurierten TTS-Provider-Kette gerendert; wenn das Gateway kein Audio rendern kann, wird die systemeigene TTS-Funktion des Geräts verwendet. Die Wiedergabe endet beim Wechsel der Sitzung, bei einem neuen Chat, beim Verschieben der App in den Hintergrund oder beim Schließen des Chats.

### 7. Canvas und Kamera

#### Gateway-Canvas-Host (für Webinhalte empfohlen)

Damit die Node echtes HTML/CSS/JS anzeigt, das der Agent auf dem Datenträger bearbeiten kann, richten Sie die Node auf den Gateway-Canvas-Host aus.

<Note>
Nodes laden Canvas vom HTTP-Server des Gateways (derselbe Port wie `gateway.port`, standardmäßig `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.
2. Navigieren Sie die Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn sich beide Geräte in Tailscale befinden, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server fügt HTML einen Live-Reload-Client hinzu und lädt bei Dateiänderungen neu. Das Gateway stellt auch `/__openclaw__/a2ui/` bereit, die Android-App behandelt entfernte A2UI-Seiten jedoch ausschließlich als darstellbar. Aktionsfähige A2UI-Befehle verwenden die gebündelte, App-eigene A2UI-Seite.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (standardmäßig `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (veralteter Alias `canvas.a2ui.pushJSONL`). Diese verwenden die gebündelte, App-eigene A2UI-Seite für aktionsfähige Darstellungen.

Kamerabefehle (nur im Vordergrund; berechtigungsabhängig): `camera.snap` (jpg), `camera.clip` (mp4). Parameter und CLI-Hilfsprogramme finden Sie unter [Kamera-Node](/de/nodes/camera).

### 8. Sprache und erweiterter Android-Befehlsumfang

- Tab „Sprache“: Android bietet zwei explizite Aufnahmemodi. **Mic** ist eine manuelle Sitzung im Tab „Sprache“, die jede Pause als Chat-Interaktion sendet und endet, wenn die App den Vordergrund verlässt oder die Person den Tab „Sprache“ verlässt. **Talk** ist der kontinuierliche Gesprächsmodus und hört weiter zu, bis er deaktiviert oder die Verbindung zur Node getrennt wird.
- Der Gesprächsmodus stuft den vorhandenen Vordergrunddienst vor Beginn der Aufnahme von `connectedDevice` auf `connectedDevice|microphone` hoch und stuft ihn nach dem Ende des Gesprächsmodus wieder zurück. Der Node-Dienst deklariert `FOREGROUND_SERVICE_CONNECTED_DEVICE` mit `CHANGE_NETWORK_STATE`; Android 14+ erfordert außerdem die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Laufzeitberechtigung `RECORD_AUDIO` und zur Laufzeit den Mikrofon-Diensttyp.
- Standardmäßig verwendet Android Talk die native Spracherkennung, den Gateway-Chat und `talk.speak` über den konfigurierten Talk-Provider des Gateways. Die lokale System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Android Talk verwendet das Echtzeit-Gateway-Relay nur, wenn `talk.realtime.mode` den Wert `realtime` und `talk.realtime.transport` den Wert `gateway-relay` hat.
- Android weist die Fähigkeit `voiceWake` nicht aus. Verwenden Sie **Mic** oder **Talk** für die Spracheingabe.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit abhängig von Gerät, Berechtigungen und Benutzereinstellungen):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` nur, wenn **Settings > Phone Capabilities > Installed Apps** aktiviert ist; standardmäßig werden im Launcher sichtbare Apps aufgeführt (übergeben Sie `includeNonLaunchable` für die vollständige Liste).
  - `notifications.list`, `notifications.actions` (siehe unten [Benachrichtigungsweiterleitung](#notification-forwarding))
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Arbeitsbereichsdateien (schreibgeschützt)

Die Startübersicht enthält eine Karte **Dateien**, mit der sich der Arbeitsbereich des aktiven Agenten über die schreibgeschützten Gateway-RPCs `agents.workspace.list` / `agents.workspace.get` durchsuchen lässt: Navigation durch Verzeichnisse, Vorschauen von Texten und Bildern sowie Export über das Android-Freigabemenü. Es gibt keine Schreiboperationen, und die Größe der Vorschauen wird vom Gateway begrenzt.

## Befehlsfreigaben prüfen

Eine Operatorverbindung mit `operator.admin` oder eine gekoppelte,
vom Gateway explizit adressierte `operator.approvals`-Verbindung kann
ausstehende Ausführungsanfragen unter **Settings -> Approvals** prüfen. Die App lädt den
bereinigten Freigabedatensatz des Gateways, bevor sie ihre Schaltflächen aktiviert, zeigt
alle Sicherheitswarnungen und die von der Anfrage angebotenen genauen Entscheidungen an und übermittelt
die Freigabe-ID und die Art des Eigentümers an das Gateway zurück.

Der Freigabestatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich gespeicherte Antwort gewinnt; Android zeigt dieses kanonische Ergebnis auch dann an, wenn
eine andere Oberfläche zuerst geantwortet hat. Wenn eine Auflösungsantwort verloren geht oder die Verbindung zum Gateway
getrennt wird, hält die App die Aktion gesperrt und liest die Freigabe erneut,
bevor sie eine weitere Entscheidung anbietet.

Gateways, die älter als die einheitlichen Freigabemethoden sind, greifen auf die ausgelieferten
ausführungsspezifischen Methoden zurück. Die Prüfung ausstehender Anfragen funktioniert weiterhin, aber der beibehaltene Terminalstatus
und das umfassendere oberflächenübergreifende Ergebnis erfordern ein aktualisiertes Gateway.

## Assistant-Einstiegspunkte

Android unterstützt den Start von OpenClaw über den System-Assistant-Auslöser (Google Assistant). Durch Gedrückthalten der Starttaste (oder einen anderen `ACTION_ASSIST`-Auslöser) wird die App geöffnet; die Aussage „Hey Google, ask OpenClaw `<prompt>`“ entspricht dem in der App deklarierten App-Actions-Abfragemuster und übergibt die Eingabe an das Chat-Eingabefeld, ohne sie automatisch zu senden.

Hierfür werden Android-**App Actions** (Fähigkeit `shortcuts.xml`) verwendet, die im App-Manifest deklariert sind. Es ist keine Gateway-seitige Konfiguration erforderlich – die Assistant-Absicht wird vollständig von der Android-App verarbeitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, von der Version der Google Play-Dienste und davon ab, ob OpenClaw als Standard-Assistant-App festgelegt wurde.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als `node.event`-Elemente an das Gateway weiterleiten. Dies wird **auf dem Gerät** im Einstellungsblatt der App konfiguriert – nicht in der Gateway-/`openclaw.json`-Konfiguration.

| Einstellung                 | Beschreibung                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forward Notification Events | Hauptschalter. Standardmäßig deaktiviert; erfordert zunächst die Gewährung von Notification Listener Access.                                                                                           |
| Package Filter              | **Allowlist** (nur aufgeführte Paket-IDs werden weitergeleitet) oder **Blocklist** (Standard: alle Pakete außer den aufgeführten IDs). Das OpenClaw-eigene Paket wird im Blocklist-Modus immer ausgeschlossen, um Weiterleitungsschleifen zu verhindern. |
| Quiet Hours                 | Lokales Start-/Endzeitfenster im Format HH:mm, das die Weiterleitung unterdrückt. Standardmäßig deaktiviert; nach der Aktivierung gilt standardmäßig `22:00`-`07:00`.             |
| Max Events / Minute         | Gerätebezogene Ratenbegrenzung für weitergeleitete Benachrichtigungen. Standardwert: 20.                                                                                                               |
| Route Session Key           | Optional. Ordnet weitergeleitete Benachrichtigungsereignisse einer bestimmten Sitzung statt der standardmäßigen Benachrichtigungsroute des Geräts zu.                                                  |

<Note>
Die Benachrichtigungsweiterleitung erfordert die Android-Berechtigung „Notification Listener“. Die App fordert während der Einrichtung dazu auf.
</Note>

Benachrichtigungen von WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord und Signal werden immer ausgeschlossen. Ihre Nachrichten gehören bereits zu nativen OpenClaw-Kanalsitzungen; die Weiterleitung der Android-Benachrichtigung als separates Node-Ereignis könnte eine Antwort an die falsche Unterhaltung weiterleiten.

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Fehlerbehebung für Android-Nodes](/de/nodes/troubleshooting)
