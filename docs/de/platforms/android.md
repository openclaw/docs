---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Fehlerbehebung bei der Gateway-Erkennung oder Authentifizierung unter Android
    - Spiegeln oder Steuern eines Android-Geräts von einem entfernten Mac aus
    - Parität des Chatverlaufs über verschiedene Clients hinweg überprüfen
summary: 'Android-App (Node): Verbindungsleitfaden + Befehlsumfang für Connect/Chat/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-07-12T15:29:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7cba1a3db2743dc9145ba5cd3eb3129b87952d7ec4090afd2776bb71a590627b
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die offizielle Android-App ist auf [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) und als signierte eigenständige APK in unterstützten [GitHub-Releases](https://github.com/openclaw/openclaw/releases) verfügbar. Sie ist ein begleitender Node und erfordert ein laufendes OpenClaw Gateway. Quellcode: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([Build-Anleitung](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Übersicht zur Unterstützung

- Rolle: App als begleitender Node (Android hostet das Gateway nicht).
- Gateway erforderlich: ja (führen Sie es unter macOS, Linux oder Windows über WSL2 aus).
- Installation: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) oder `OpenClaw-Android.apk` aus einem unterstützten [GitHub-Release](https://github.com/openclaw/openclaw/releases), [Erste Schritte](/de/start/getting-started) für das Gateway, anschließend [Kopplung](/de/channels/pairing).
- Gateway: [Betriebshandbuch](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Steuerungsebene).

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host – siehe [Gateway](/de/gateway).

## Installation außerhalb von Google Play

Reguläre finale und Korrektur-Releases auf GitHub enthalten eine universelle `OpenClaw-Android.apk` und `OpenClaw-Android-SHA256SUMS.txt`. Die APK wird aus dem Release-Tag erstellt, mit dem OpenClaw-Android-Release-Schlüssel signiert und enthält einen GitHub-Actions-Herkunftsnachweis.

Wählen Sie ein [Release](https://github.com/openclaw/openclaw/releases), das beide Assets aufführt, laden Sie anschließend genau dieses Tag herunter und überprüfen Sie es vor der manuellen Installation:

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
Installationen über Google Play und als eigenständige APK verwenden unterschiedliche Aktualisierungskanäle und können unterschiedliche Signaturidentitäten aufweisen. Android kann beim Wechsel zwischen den Kanälen verlangen, dass die vorhandene App deinstalliert wird, wodurch deren lokale App-Daten entfernt werden. Bleiben Sie für reguläre Aktualisierungen bei einem Kanal.
</Warning>

## Android von einem entfernten Mac spiegeln und steuern

[scrcpy](https://github.com/Genymobile/scrcpy) spiegelt einen Android-Bildschirm in einem macOS-Fenster und
leitet Tastatur- und Zeigereingaben über Android Debug Bridge (ADB) weiter. Dies ist ein betreiberseitiger
Arbeitsablauf, der von der OpenClaw-Node-Verbindung getrennt ist. Er ist nützlich, wenn sich das Android-Gerät und der
Mac an verschiedenen Standorten befinden, aber ein privates Tailscale-Netzwerk gemeinsam nutzen.

### Bevor Sie beginnen

- Installieren Sie Tailscale auf dem Android-Gerät und dem Mac und verbinden Sie beide mit demselben Tailnet.
- Aktivieren Sie unter Android **Developer options** und **USB debugging**. In Android 16 befindet sich **Wireless
  debugging** unter **Settings > System > Developer options**. Siehe [Android-Entwickleroptionen](https://developer.android.com/studio/debug/dev-options).
- Installieren Sie scrcpy und ADB auf dem Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Halten Sie das Android-Gerät für die erste Verbindung bereit. Android muss den ADB-Schlüssel jedes Macs
  genehmigen, bevor dieser Mac das Gerät steuern kann.

### ADB über TCP aktivieren

Verbinden Sie das Android-Gerät für die Ersteinrichtung per USB mit einem vertrauenswürdigen Computer und genehmigen Sie dessen
Debugging-Abfrage. Führen Sie anschließend Folgendes aus:

```bash
adb devices
adb tcpip 5555
```

Sie können die USB-Verbindung nun trennen. Falls Port 5555 nach einem Neustart des Geräts oder dem Zurücksetzen des Debuggings nicht mehr lauscht,
wiederholen Sie diesen lokalen Einrichtungsschritt. Unter Android 11 und höher kann das anfängliche Vertrauen auch über
**Wireless debugging > Pair device with pairing code** und `adb pair` hergestellt werden.

### Nur den steuernden Mac zulassen

Tailnets mit restriktiven Freigaben müssen dem steuernden Mac ausdrücklich den Zugriff auf TCP-Port 5555
des Android-Geräts erlauben. Fügen Sie der Tailnet-Richtlinie eine eng gefasste Regel hinzu und ersetzen Sie die Beispieladressen
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

Informationen zu Host-Aliassen und anderen Selektoren finden Sie unter [Tailscale-Freigaben](https://tailscale.com/docs/reference/syntax/grants).
Geben Sie diesen Port nicht für das öffentliche Internet frei und stellen Sie ihn nicht mit Funnel bereit: Ein autorisierter ADB-
Client hat weitreichende Kontrolle über das Gerät.

### Verbinden und Spiegelung starten

Auf dem entfernten Mac:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Beim ersten `adb connect` von diesem Mac wird auf Android ein Autorisierungsdialog angezeigt. Entsperren Sie das Gerät,
bestätigen Sie den Schlüsselfingerabdruck und wählen Sie **Always allow from this computer** nur aus, wenn der Mac
vertrauenswürdig ist. Ein erfolgreicher Eintrag bei `adb devices` endet mit `device`; `unauthorized` bedeutet, dass die Abfrage
auf dem Gerät noch nicht genehmigt wurde.

Sobald sich das scrcpy-Fenster öffnet, verwenden Sie es direkt oder steuern Sie es mit einem macOS-Tool zur Bildschirmautomatisierung wie
[Peekaboo](https://peekaboo.sh/) an. scrcpy überträgt die Anzeige und Eingaben; Tailscale stellt lediglich den
privaten Netzwerkpfad bereit.

### Fehlerbehebung

- `Connection timed out`: Überprüfen Sie die Tailnet-Freigabe für TCP 5555. Ein erfolgreicher `tailscale ping` belegt
  die Erreichbarkeit des Peers, nicht aber, dass die Richtlinie diesen TCP-Port zulässt. Testen Sie vom Mac aus mit
  `nc -vz <android-tailnet-ip> 5555`.
- `unauthorized`: Entsperren Sie Android und genehmigen Sie den ADB-Schlüssel des entfernten Macs oder entfernen Sie die veraltete Workstation
  unter **Wireless debugging > Paired devices** und koppeln Sie sie erneut.
- `Connection refused`: Stellen Sie erneut eine lokale Verbindung her und führen Sie nochmals `adb tcpip 5555` aus.
- Mehr als ein Gerät aufgeführt: Behalten Sie das explizite Argument `--serial <android-tailnet-ip>:5555` bei.

Schließen Sie anschließend scrcpy und trennen Sie die ADB-Verbindung:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Betriebshandbuch für die Verbindung

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android stellt eine direkte Verbindung zum Gateway-WebSocket her und verwendet die Gerätekopplung (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Unverschlüsseltes `ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie für `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Das Gateway wird auf einem anderen Computer ausgeführt (oder ist über SSH erreichbar).
- Das Android-Gerät bzw. der Emulator kann den Gateway-WebSocket erreichen:
  - dasselbe LAN mit mDNS/NSD, **oder**
  - dasselbe Tailscale-Tailnet mit Wide-Area Bonjour / Unicast-DNS-SD (siehe unten), **oder**
  - manueller Gateway-Host/-Port (Fallback)
- Bei der Kopplung über ein Tailnet oder ein öffentliches Mobilfunknetz werden **keine** unverschlüsselten Tailnet-IP-Endpunkte mit `ws://` verwendet. Nutzen Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Die `openclaw`-CLI ist auf dem Gateway-Computer (oder über SSH) verfügbar, um Kopplungsanfragen zu genehmigen.

### 1. Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie, dass in den Protokollen etwa Folgendes angezeigt wird:

- `listening on ws://0.0.0.0:18789`

Bevorzugen Sie für den entfernten Android-Zugriff über Tailscale Serve/Funnel anstelle einer unverschlüsselten Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Eine einfache Einrichtung mit `gateway.bind: "tailnet"` reicht für die erstmalige entfernte Android-Kopplung nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2. Erkennung überprüfen (optional)

Auf dem Gateway-Computer:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Hinweise zur Fehlerdiagnose: [Bonjour](/de/gateway/bonjour).

Wenn Sie außerdem eine Wide-Area-Erkennungsdomain konfiguriert haben, vergleichen Sie sie mit:

```bash
openclaw gateway discover --json
```

Damit werden `local.` und die konfigurierte Wide-Area-Domain in einem Durchlauf angezeigt. Dabei wird der aufgelöste Dienstendpunkt statt ausschließlich auf TXT-Hinweisen basierender Angaben verwendet.

#### Netzwerkübergreifende Erkennung über Unicast-DNS-SD

Die Android-NSD-/mDNS-Erkennung funktioniert nicht netzwerkübergreifend. Wenn sich der Android-Node und das Gateway in unterschiedlichen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / Unicast-DNS-SD. Die Erkennung allein reicht für die Android-Kopplung über ein Tailnet oder ein öffentliches Netz nicht aus – die erkannte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone (zum Beispiel `openclaw.internal.`) ein und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für die ausgewählte Domain und verweisen Sie dabei auf diesen DNS-Server.

Details und eine CoreDNS-Beispielkonfiguration: [Bonjour](/de/gateway/bonjour).

### 3. Von Android aus verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Vordergrunddienst** (dauerhafte Benachrichtigung) aktiv.
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn die Erkennung blockiert ist, verwenden Sie unter **Advanced controls** einen manuellen Host/Port. Für private LAN-Hosts funktioniert `ws://` weiterhin. Aktivieren Sie für Tailscale oder öffentliche Hosts TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach der ersten erfolgreichen Kopplung stellt Android beim Start automatisch wieder eine Verbindung mit dem aktiven gekoppelten Gateway her (nach bestem Bemühen bei erkannten Gateways, die im Netzwerk sichtbar sein müssen).

### Mehrere Gateways

Die App führt ein Verzeichnis aller Gateways, mit denen sie gekoppelt wurde, sodass Sie ohne erneute Kopplung zwischen ihnen wechseln können:

- **Settings -> Gateways** führt die gekoppelten Gateways auf und kennzeichnet das aktive. Tippen Sie auf einen Eintrag, um zu wechseln; die App beendet die aktuellen Sitzungen und stellt eine Verbindung zum ausgewählten Gateway her.
- Der Tab **Connect** zeigt einen Schnellumschalter an, wenn mehr als ein Gateway gekoppelt ist.
- Anmeldedaten, Geräte-Token, TLS-Vertrauen, Chatverlauf und in die Warteschlange eingereihte Offline-Nachrichten werden pro Gateway gespeichert. Beim Wechsel werden die Zustände verschiedener Gateways niemals vermischt, und offline in die Warteschlange eingereihte Nachrichten werden nur an das Gateway übermittelt, für das sie verfasst wurden.
- **Forget** entfernt den Verzeichniseintrag eines Gateways zusammen mit dessen Anmeldedaten, Geräte-Token, TLS-Pin und zwischengespeicherten Chats.

### Anwesenheits-Beacons

Nachdem die authentifizierte Node-Sitzung verbunden wurde und wenn die App in den Hintergrund wechselt, während der Vordergrunddienst weiterhin verbunden ist, ruft Android `node.event` mit `event: "node.presence.alive"` auf. Das Gateway zeichnet dies erst als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf, nachdem die authentifizierte Geräteidentität des Nodes bekannt ist.

Die App wertet das Beacon nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, gilt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Sichtung.

### 4. Kopplung genehmigen (CLI)

Auf dem Gateway-Computer:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zur Kopplung: [Kopplung](/de/channels/pairing).

Optional: Wenn der Android-Node stets eine Verbindung aus einem streng kontrollierten Subnetz herstellt, können Sie die automatische Genehmigung der erstmaligen Node-Kopplung mit expliziten CIDRs oder genauen IP-Adressen aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für eine neue Kopplung mit `role: node` ohne angeforderte Geltungsbereiche. Die Kopplung von Operatoren/Browsern sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordert weiterhin eine manuelle Genehmigung.

### 5. Prüfen, ob der Node verbunden ist

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat + Verlauf

Der Android-Tab „Chat“ unterstützt die Sitzungsauswahl (standardmäßig `main` sowie weitere vorhandene Sitzungen):

- Verlauf: `chat.history` (für die Anzeige normalisiert — eingebettete Direktiven-Tags, Nur-Text-XML-Nutzlasten von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` und gekürzte Varianten) sowie durchgesickerte ASCII-/vollbreite Modell-Steuerungstoken werden entfernt; Assistant-Zeilen mit stillen Token wie exakt `NO_REPLY` / `no_reply` werden ausgelassen; übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Dauerhaftes Senden: Jede Sendung (Text, ausgewählte Bilder und Sprachnachrichten) wird vor jedem Netzwerkversuch in einem geräteeigenen Postausgang pro Gateway protokolliert, sodass das Beenden der App übermittelte Eingaben nicht verlieren kann. Offline eingereihte Sendungen werden nach der Wiederverbindung der Reihe nach mit stabilen Idempotenzschlüsseln zugestellt, und eine Sendung wird erst entfernt, nachdem der Turn im kanonischen `chat.history` sichtbar ist — eine Bestätigung allein gilt nicht als Zustellnachweis. Mehrdeutige Ergebnisse (verlorene Bestätigung, während des Sendens beendete App, Neustart des Gateways vor dem Schreiben des Transkripts) werden als sichtbare Zeilen mit expliziten Optionen **Erneut versuchen**/**Löschen** angezeigt, statt automatisch erneut gesendet zu werden. Slash-Befehle werden nach einer Wiederverbindung niemals automatisch wiederholt; sie warten auf einen expliziten erneuten Versuch. Die Warteschlange ist begrenzt (50 Nachrichten und 48 MB an Anhangsdaten pro Gateway), und nicht gesendete Zeilen verfallen nach 48 Stunden. Entwürfe im Eingabefeld, die nie übermittelt wurden, bleiben nicht über Prozessgrenzen hinweg erhalten.
- Push-Aktualisierungen (nach bestem Bemühen): `chat.subscribe` -> `event:"chat"`
- Anhören: Drücken Sie lange auf eine Assistant-Nachricht und wählen Sie **Anhören**, um sie anzuhören; Audio wird über `tts.speak` des Gateways mit der konfigurierten TTS-Provider-Kette gerendert, und die geräteeigene System-TTS wird verwendet, wenn das Gateway kein Audio rendern kann. Die Wiedergabe endet bei einem Sitzungswechsel, einem neuen Chat, dem Wechsel der App in den Hintergrund oder dem Schließen des Chats.

### 7. Canvas + Kamera

#### Gateway-Canvas-Host (für Webinhalte empfohlen)

Damit die Node echtes HTML/CSS/JS anzeigt, das der Agent auf dem Datenträger bearbeiten kann, richten Sie die Node auf den Canvas-Host des Gateways.

<Note>
Nodes laden Canvas vom HTTP-Server des Gateways (derselbe Port wie `gateway.port`, Standardwert `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.
2. Navigieren Sie die Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte Tailscale verwenden, nutzen Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server fügt einen Live-Reload-Client in HTML ein und lädt bei Dateiänderungen neu. Das Gateway stellt außerdem `/__openclaw__/a2ui/` bereit, die Android-App behandelt entfernte A2UI-Seiten jedoch als ausschließlich zum Rendern bestimmt. Aktionsfähige A2UI-Befehle verwenden die gebündelte, app-eigene A2UI-Seite.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (Standardwert `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` als veralteter Alias). Diese verwenden die gebündelte, app-eigene A2UI-Seite für aktionsfähiges Rendering.

Kamerabefehle (nur im Vordergrund; berechtigungsabhängig): `camera.snap` (jpg), `camera.clip` (mp4). Parameter und CLI-Hilfsfunktionen finden Sie unter [Kamera-Node](/de/nodes/camera).

### 8. Sprache + erweiterte Android-Befehlsoberfläche

- Sprachregisterkarte: Android verfügt über zwei explizite Aufnahmemodi. **Mikrofon** ist eine manuelle Sitzung auf der Sprachregisterkarte, die jede Pause als Chat-Turn sendet und endet, wenn die App den Vordergrund verlässt oder der Benutzer die Sprachregisterkarte verlässt. **Sprechen** ist der kontinuierliche Sprechmodus und hört weiter zu, bis er deaktiviert oder die Verbindung zur Node getrennt wird.
- Der Sprechmodus erweitert den vorhandenen Vordergrunddienst vor Beginn der Aufnahme von `connectedDevice` auf `connectedDevice|microphone` und stuft ihn nach Ende des Sprechmodus wieder zurück. Der Node-Dienst deklariert `FOREGROUND_SERVICE_CONNECTED_DEVICE` mit `CHANGE_NETWORK_STATE`; Android 14+ erfordert außerdem die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Laufzeitberechtigung `RECORD_AUDIO` und zur Laufzeit den Mikrofon-Diensttyp.
- Standardmäßig verwendet Android Talk die native Spracherkennung, den Gateway-Chat und `talk.speak` über den konfigurierten Talk-Provider des Gateways. Die lokale System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Android Talk verwendet das Echtzeit-Relay des Gateways nur, wenn `talk.realtime.mode` den Wert `realtime` und `talk.realtime.transport` den Wert `gateway-relay` hat.
- Android gibt die Fähigkeit `voiceWake` nicht bekannt. Verwenden Sie **Mikrofon** oder **Sprechen** für die Spracheingabe.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit abhängig von Gerät, Berechtigungen und Benutzereinstellungen):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` nur, wenn **Settings > Phone Capabilities > Installed Apps** aktiviert ist; standardmäßig werden im Launcher sichtbare Apps aufgelistet (übergeben Sie `includeNonLaunchable` für die vollständige Liste).
  - `notifications.list`, `notifications.actions` (siehe unten [Benachrichtigungsweiterleitung](#notification-forwarding))
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Workspace-Dateien (schreibgeschützt)

Die Startübersicht enthält eine Karte **Dateien**, mit der Sie den Workspace des aktiven Agenten über die schreibgeschützten Gateway-RPCs `agents.workspace.list` / `agents.workspace.get` durchsuchen können: Navigation durch Verzeichnisse, Text- und Bildvorschauen sowie Export über das Android-Freigabemenü. Es gibt keine Schreiboperationen, und die Größe der Vorschauen wird durch das Gateway begrenzt.

## Befehlsfreigaben prüfen

Eine Operator-Verbindung mit `operator.admin` oder eine gekoppelte,
explizit vom Gateway adressierte `operator.approvals`-Verbindung kann
ausstehende Ausführungsanforderungen unter **Settings -> Approvals** prüfen. Die App lädt den
bereinigten Freigabedatensatz des Gateways, bevor sie ihre Schaltflächen aktiviert, zeigt alle
Sicherheitswarnungen und die exakten von dieser Anforderung angebotenen Entscheidungen an und übermittelt
die Freigabe-ID und die Eigentümerart zurück an das Gateway.

Der Freigabestatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich übermittelte Antwort gilt; Android zeigt dieses kanonische Ergebnis auch dann an, wenn
zuerst auf einer anderen Oberfläche geantwortet wurde. Wenn eine Auflösungsantwort verloren geht oder das Gateway
die Verbindung trennt, hält die App die Aktion gesperrt und liest die Freigabe erneut,
bevor sie eine weitere Entscheidung anbietet.

Gateways, die älter als die vereinheitlichten Freigabemethoden sind, greifen auf die ausgelieferten
ausführungsspezifischen Methoden zurück. Die Prüfung ausstehender Anfragen funktioniert weiterhin, aber der beibehaltene Terminalstatus
und das umfangreichere oberflächenübergreifende Ergebnis erfordern ein aktualisiertes Gateway.

## Assistant-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den System-Assistant-Auslöser (Google Assistant). Wenn Sie die Home-Taste gedrückt halten (oder einen anderen `ACTION_ASSIST`-Auslöser verwenden), wird die App geöffnet; wenn Sie „Hey Google, ask OpenClaw `<prompt>`“ sagen, entspricht dies dem deklarierten App-Actions-Abfragemuster der App und übergibt den Prompt an das Chat-Eingabefeld, ohne ihn automatisch zu senden.

Hierfür werden Android-**App Actions** (Fähigkeit in `shortcuts.xml`) verwendet, die im App-Manifest deklariert sind. Es ist keine Gateway-seitige Konfiguration erforderlich — der Assistant-Intent wird vollständig von der Android-App verarbeitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version der Google Play Services und davon ab, ob der Benutzer OpenClaw als Standard-Assistant-App festgelegt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als `node.event`-Elemente an das Gateway weiterleiten. Dies wird **auf dem Gerät** im Einstellungsblatt der App konfiguriert — nicht in der Gateway-/`openclaw.json`-Konfiguration.

| Einstellung                 | Beschreibung                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forward Notification Events | Hauptschalter. Standardmäßig deaktiviert; erfordert zunächst die Erteilung des Zugriffs auf den Benachrichtigungslistener.                                                                                          |
| Package Filter              | **Allowlist** (nur aufgeführte Paket-IDs werden weitergeleitet) oder **Blocklist** (Standard: alle Pakete außer den aufgeführten IDs). Das OpenClaw-eigene Paket ist im Blocklist-Modus immer ausgeschlossen, um Weiterleitungsschleifen zu verhindern. |
| Quiet Hours                 | Lokales Start-/Endzeitfenster im Format HH:mm, in dem die Weiterleitung unterdrückt wird. Standardmäßig deaktiviert; nach Aktivierung gelten standardmäßig `22:00`-`07:00`.                                         |
| Max Events / Minute         | Geräteratebegrenzung für weitergeleitete Benachrichtigungen. Standardwert 20.                                                                                                                                        |
| Route Session Key           | Optional. Ordnet weitergeleitete Benachrichtigungsereignisse einer bestimmten Sitzung statt der standardmäßigen Benachrichtigungsroute des Geräts zu.                                                               |

<Note>
Für die Benachrichtigungsweiterleitung ist die Android-Berechtigung für den Benachrichtigungslistener erforderlich. Die App fordert diese während der Einrichtung an.
</Note>

Benachrichtigungen von WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord und Signal werden immer ausgeschlossen. Ihre Nachrichten werden bereits von nativen OpenClaw-Kanalsitzungen verwaltet; die Weiterleitung der Android-Benachrichtigung als separates Node-Ereignis könnte eine Antwort an die falsche Unterhaltung leiten.

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Fehlerbehebung für Android-Nodes](/de/nodes/troubleshooting)
