---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Fehlerbehebung bei der Gateway-Erkennung oder Authentifizierung unter Android
    - Ein Android-Gerät von einem entfernten Mac aus spiegeln oder steuern
    - Überprüfung der Übereinstimmung des Chatverlaufs über verschiedene Clients hinweg
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Connect/Chat/OpenClaw/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-07-24T04:30:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a134a678e26924abc24dd107c3feaad9d09e83e3829eef73514c7ef078d578f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die offizielle Android-App ist bei [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) und als signierte eigenständige APK in unterstützten [GitHub-Releases](https://github.com/openclaw/openclaw/releases) verfügbar. Sie ist eine begleitende Node-App und erfordert einen laufenden OpenClaw Gateway. Quellcode: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([Build-Anleitung](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Unterstützungsübersicht

- Rolle: begleitende Node-App (Android hostet den Gateway nicht).
- Gateway erforderlich: ja (unter macOS, Linux oder Windows über WSL2 ausführen).
- Installation: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) oder `OpenClaw-Android.apk` aus einem unterstützten [GitHub-Release](https://github.com/openclaw/openclaw/releases), [Erste Schritte](/de/start/getting-started) für den Gateway, anschließend [Kopplung](/de/channels/pairing).
- Gateway: [Betriebshandbuch](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Steuerungsebene).
- **Settings → OpenClaw** öffnet einen dedizierten Assistenten für Gateway-Einstellungen, wenn die Operator-Verbindung über `operator.admin` verfügt und der Gateway `openclaw.chat` unterstützt. Die Einrichtungskonversation bleibt vom normalen Chat getrennt, schwärzt geheime Antworten lokal und wechselt erst zum Chat, nachdem Sie auf **Open Chat** getippt haben.

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host – siehe [Gateway](/de/gateway).

## Gleichzeitige Gateway-Sitzungen

Koppeln Sie jeden Gateway einmal und öffnen Sie anschließend **Settings → Gateway**. Das Häkchen kennzeichnet
den fokussierten Gateway, und jeder Schalter steuert, ob die Operator-Sitzung eines nicht fokussierten Gateways
verbunden bleibt. Aktivierte Gateways stellen die Verbindung unabhängig voneinander wieder her,
während sich die App im Vordergrund befindet. Daher werden die anderen Verbindungen beim Wechseln des Fokus
nicht getrennt. Nur der fokussierte Gateway verwaltet die Android-Node-Sitzung und die Gerätefunktionen.
Dadurch wird verhindert, dass mehrere Gateways gleichzeitig Kamera-, Standort-, Bildschirm- oder
Benachrichtigungsbefehle an dasselbe Smartphone senden. Android kann die sekundären Verbindungen
unterbrechen, nachdem die App den Vordergrund verlassen hat.

## Wear-OS-Begleit-App

Die Wear-OS-Begleit-App verwendet die authentifizierte Gateway-Verbindung des gekoppelten Android-Smartphones; die Uhr empfängt oder speichert niemals Gateway-Anmeldedaten. Sie kann Agenten und Sitzungen auswählen, begrenzte Transkripte lesen, Textantworten oder diktierte Antworten senden, einen aktiven Lauf abbrechen, Talk in Echtzeit innerhalb der ausgewählten Sitzung starten und die Verbindung des gekoppelten Smartphones zum Gateway herstellen oder trennen. Außerdem bietet sie lokale Antwortbenachrichtigungen, ein dunkles oder helles Erscheinungsbild und optionales automatisches Vorlesen von Antworten. Agenten- und Gateway-Steuerelemente werden für zeitversetzte Smartphone-/Uhr-Aktualisierungen anhand der Fähigkeiten ausgehandelt. Talk in Echtzeit überträgt Mikrofon- und Wiedergabeaudio über einen temporären Wear-OS-Data-Layer-Kanal und wird beendet, wenn das ausgewählte Smartphone, die Gateway-Verbindung oder der Audiokanal verloren geht.

## Installation außerhalb von Google Play

Reguläre finale und Korrektur-Releases auf GitHub enthalten eine universelle `OpenClaw-Android.apk` und `OpenClaw-Android-SHA256SUMS.txt`. Die APK wird aus dem Release-Tag erstellt, mit dem OpenClaw-Android-Release-Schlüssel signiert und verfügt über eine GitHub-Actions-Provenienz.

Wählen Sie einen [Release](https://github.com/openclaw/openclaw/releases), der beide Assets aufführt, laden Sie anschließend genau dieses Tag herunter und verifizieren Sie es vor dem Sideloading:

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
Installationen über Google Play und als eigenständige APK verwenden unterschiedliche Aktualisierungskanäle und können unterschiedliche Signaturidentitäten aufweisen. Android kann beim Wechseln des Kanals verlangen, dass die vorhandene App deinstalliert wird, wodurch ihre lokalen App-Daten entfernt werden. Bleiben Sie für reguläre Aktualisierungen bei einem Kanal.
</Warning>

## Android von einem entfernten Mac spiegeln und steuern

[scrcpy](https://github.com/Genymobile/scrcpy) spiegelt einen Android-Bildschirm in einem macOS-Fenster und
leitet Tastatur- und Zeigereingaben über Android Debug Bridge (ADB) weiter. Dies ist ein operatorseitiger
Arbeitsablauf, der von der OpenClaw-Node-Verbindung getrennt ist. Er ist nützlich, wenn sich das Android-Gerät und der
Mac an unterschiedlichen Standorten befinden, aber ein privates Tailscale-Netzwerk gemeinsam nutzen.

### Vorbereitung

- Installieren Sie Tailscale auf dem Android-Gerät und dem Mac und verbinden Sie beide mit demselben Tailnet.
- Aktivieren Sie unter Android **Developer options** und **USB debugging**. Unter Android 16 befindet sich **Wireless
  debugging** unter **Settings > System > Developer options**. Siehe [Android-Entwickleroptionen](https://developer.android.com/studio/debug/dev-options).
- Installieren Sie scrcpy und ADB auf dem Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Halten Sie das Android-Gerät für die erste Verbindung bereit. Android muss den ADB-
  Schlüssel jedes Macs genehmigen, bevor dieser Mac das Gerät steuern kann.

### ADB über TCP aktivieren

Verbinden Sie das Android-Gerät für die Ersteinrichtung per USB mit einem vertrauenswürdigen Computer und bestätigen Sie die
Debugging-Abfrage. Führen Sie anschließend Folgendes aus:

```bash
adb devices
adb tcpip 5555
```

Sie können die USB-Verbindung jetzt trennen. Falls Port 5555 nach einem Geräteneustart oder dem Zurücksetzen des Debuggings
nicht mehr lauscht, wiederholen Sie diesen lokalen Einrichtungsschritt. Unter Android 11 und neuer kann das anfängliche Vertrauen auch über
**Wireless debugging > Pair device with pairing code** und `adb pair` hergestellt werden.

### Nur den steuernden Mac zulassen

Tailnets mit restriktiven Berechtigungen müssen dem steuernden Mac ausdrücklich erlauben, TCP-Port 5555
auf dem Android-Gerät zu erreichen. Fügen Sie der Tailnet-Richtlinie eine eng gefasste Regel hinzu und ersetzen Sie die Beispieladressen
durch die stabilen Tailscale-IP-Adressen der beiden Geräte:

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

Informationen zu Host-Aliasen und anderen Selektoren finden Sie unter [Tailscale-Berechtigungen](https://tailscale.com/docs/reference/syntax/grants).
Geben Sie diesen Port nicht für das öffentliche Internet frei und stellen Sie ihn nicht mit Funnel bereit: Ein autorisierter ADB-
Client hat weitreichende Kontrolle über das Gerät.

### Verbindung herstellen und Spiegelung starten

Auf dem entfernten Mac:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Der erste `adb connect` von diesem Mac zeigt unter Android einen Autorisierungsdialog an. Entsperren Sie das Gerät,
bestätigen Sie den Fingerabdruck des Schlüssels und wählen Sie **Always allow from this computer** nur aus, wenn der Mac
vertrauenswürdig ist. Ein erfolgreicher `adb devices`-Eintrag endet mit `device`; `unauthorized` bedeutet, dass die Abfrage auf dem Gerät
noch nicht bestätigt wurde.

Sobald das scrcpy-Fenster geöffnet ist, können Sie es direkt verwenden oder mit einem macOS-Bildschirmautomatisierungswerkzeug wie
[Peekaboo](https://peekaboo.sh/) ansteuern. scrcpy überträgt die Anzeige und Eingaben; Tailscale stellt lediglich den
privaten Netzwerkpfad bereit.

### Fehlerbehebung

- `Connection timed out`: Überprüfen Sie die Tailnet-Berechtigung für TCP 5555. Ein erfolgreicher `tailscale ping` weist
  die Erreichbarkeit des Peers nach, nicht jedoch, dass die Richtlinie diesen TCP-Port zulässt. Testen Sie dies mit
  `nc -vz <android-tailnet-ip> 5555` vom Mac aus.
- `unauthorized`: Entsperren Sie Android und genehmigen Sie den ADB-Schlüssel des entfernten Macs oder entfernen Sie die veraltete Arbeitsstation
  unter **Wireless debugging > Paired devices** und koppeln Sie sie erneut.
- `Connection refused`: Stellen Sie lokal erneut eine Verbindung her und führen Sie `adb tcpip 5555` erneut aus.
- Mehr als ein Gerät aufgeführt: Behalten Sie das explizite Argument `--serial <android-tailnet-ip>:5555` bei.

Wenn Sie fertig sind, schließen Sie scrcpy und trennen Sie ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Verbindungshandbuch

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android stellt eine direkte Verbindung zum Gateway-WebSocket her und verwendet die Gerätekopplung (`role: node`).

Für Tailscale- oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve/Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Unverschlüsseltes `ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie für `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt; eine Einrichtung außerhalb des Loopbacks verwendet automatisch eingeschränkten Operatorzugriff

### Voraussetzungen

- Gateway wird auf einem anderen Computer ausgeführt (oder ist über SSH erreichbar).
- Android-Gerät/-Emulator kann den Gateway-WebSocket erreichen:
  - Dasselbe LAN mit mDNS/NSD, **oder**
  - Dasselbe Tailscale-Tailnet mit Wide-Area Bonjour/Unicast-DNS-SD (siehe unten), **oder**
  - Manueller Gateway-Host/-Port (Fallback)
- Die mobile Kopplung über Tailnet/öffentliche Netzwerke verwendet **keine** direkten Tailnet-IP-Endpunkte vom Typ `ws://`. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Die CLI `openclaw` ist auf dem Gateway-Computer (oder über SSH) verfügbar, um Kopplungsanfragen zu genehmigen.

### 1. Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Vergewissern Sie sich, dass in den Protokollen etwas wie Folgendes angezeigt wird:

- `listening on ws://0.0.0.0:18789`

Bevorzugen Sie für den entfernten Android-Zugriff über Tailscale Serve/Funnel statt einer direkten Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren Endpunkt vom Typ `wss://` / `https://`. Eine einfache `gateway.bind: "tailnet"`-Einrichtung reicht für die erstmalige entfernte Android-Kopplung nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2. Erkennung überprüfen (optional)

Auf dem Gateway-Computer:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Hinweise zur Fehlerbehebung: [Bonjour](/de/gateway/bonjour).

Falls Sie außerdem eine Wide-Area-Erkennungsdomain konfiguriert haben, vergleichen Sie sie mit:

```bash
openclaw gateway discover --json
```

Dadurch werden `local.` und die konfigurierte Wide-Area-Domain in einem Durchlauf angezeigt, wobei der aufgelöste Dienstendpunkt anstelle von reinen TXT-Hinweisen verwendet wird.

#### Netzwerkübergreifende Erkennung über Unicast-DNS-SD

Die Android-NSD-/mDNS-Erkennung funktioniert nicht netzwerkübergreifend. Wenn sich die Android-Node und der Gateway in verschiedenen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour/Unicast-DNS-SD. Die Erkennung allein reicht für die Kopplung von Android über Tailnet/öffentliche Netzwerke nicht aus – die erkannte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone (Beispiel: `openclaw.internal.`) ein und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für die gewählte Domain, sodass es auf diesen DNS-Server verweist.

Details und eine CoreDNS-Beispielkonfiguration: [Bonjour](/de/gateway/bonjour).

### 3. Verbindung von Android herstellen

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Vordergrunddienst** (dauerhafte Benachrichtigung) aufrecht.
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn die Erkennung blockiert ist, verwenden Sie unter **Advanced controls** manuell Host und Port. Für private LAN-Hosts funktioniert `ws://` weiterhin. Aktivieren Sie für Tailscale-/öffentliche Hosts TLS und verwenden Sie einen Endpunkt vom Typ `wss://` / Tailscale Serve.

Nach der ersten erfolgreichen Kopplung stellt Android beim Start automatisch wieder eine Verbindung zum aktiven gekoppelten Gateway her (nach bestem Bemühen bei erkannten Gateways, die im Netzwerk sichtbar sein müssen).

Offizielle Einrichtungscodes verbinden Android als Node und gewähren standardmäßig über `wss://` vollständigen Gateway-Operatorzugriff. Bei einer Klartext-Einrichtung über `ws://` außerhalb des Loopbacks wird zur Sicherheit des Bearer-Tokens automatisch eingeschränkter Zugriff verwendet. Unter **Settings → Gateway** wird der Zugriff als **Full** oder **Limited** angezeigt. Konfigurieren Sie für eine eingeschränkte Verbindung `wss://` oder Tailscale Serve, generieren Sie in der Control UI oder mit `openclaw qr` einen neuen Code mit vollständigem Zugriff, scannen Sie ihn auf dieser Seite oder fügen Sie ihn dort ein und stellen Sie die Verbindung erneut her. Operatoren, die das reduzierte Profil verwenden möchten, können in der Control UI **Limited access** auswählen oder `openclaw qr --limited` ausführen.

### Gekoppelte Gateways verwalten

Die App führt eine Registrierung aller Gateways, mit denen sie gekoppelt wurde. So können Operator-Sitzungen verbunden bleiben und der Fokus kann ohne erneute Kopplung gewechselt werden:

- Unter **Settings → Gateway** werden gekoppelte Gateways aufgelistet und das fokussierte Gateway wird gekennzeichnet. Tippen Sie auf einen Eintrag, um ihn zu fokussieren; die anderen aktivierten Operator-Sitzungen bleiben verbunden.
- Jeder Schalter legt fest, ob das nicht fokussierte Gateway verbunden bleibt, während sich die App im Vordergrund befindet. Das fokussierte Gateway bleibt aktiviert und steuert die Node-Verbindung und die Gerätefunktionen des Smartphones.
- Wenn mehr als ein Gateway gekoppelt ist, zeigt die Registerkarte **Connect** eine Schnellauswahl an.
- Anmeldedaten, Geräte-Tokens, TLS-Vertrauen, Chatverlauf und in die Offline-Warteschlange eingereihte Nachrichten werden pro Gateway gespeichert. Beim Wechseln des Fokus werden die Zustände verschiedener Gateways niemals vermischt, und offline eingereihte Nachrichten werden ausschließlich an das Gateway zugestellt, für das sie verfasst wurden.
- **Forget** entfernt den Registrierungseintrag eines Gateways einschließlich seiner Anmeldedaten, Geräte-Tokens, TLS-Pin und zwischengespeicherten Chats.

### Beacons für aktive Präsenz

Nachdem die authentifizierte Node-Sitzung verbunden wurde und wenn die App in den Hintergrund wechselt, während der Vordergrunddienst weiterhin verbunden ist, ruft Android `node.event` mit `event: "node.presence.alive"` auf. Das Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten der gekoppelten Node beziehungsweise des gekoppelten Geräts auf, wenn die authentifizierte Geräteidentität der Node bekannt ist.

Die App wertet den Beacon nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, gilt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Aktivität.

### 4. Kopplung genehmigen (CLI)

Auf dem Gateway-Rechner:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zur Kopplung: [Kopplung](/de/channels/pairing).

Optional: Wenn sich die Android-Node stets aus einem streng kontrollierten Subnetz verbindet, können Sie die automatische Genehmigung der erstmaligen Node-Kopplung mit expliziten CIDRs oder genauen IP-Adressen aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt ausschließlich für eine neue `role: node`-Kopplung ohne angeforderte Geltungsbereiche. Die Kopplung von Operatoren oder Browsern sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordert weiterhin eine manuelle Genehmigung.

### 5. Verbindung der Node überprüfen

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat und Verlauf

Die Android-Registerkarte „Chat“ unterstützt die Sitzungsauswahl (standardmäßig `main` sowie weitere vorhandene Sitzungen):

- Verlauf: `chat.history` (für die Anzeige normalisiert — eingebettete Direktiven-Tags, Nur-Text-XML-Nutzlasten von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` und gekürzte Varianten) sowie offengelegte ASCII- oder vollbreite Modellsteuerungs-Tokens werden entfernt; Assistant-Zeilen, die ausschließlich stille Tokens wie exakt `NO_REPLY` / `no_reply` enthalten, werden ausgelassen; übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Dauerhaftes Senden: Jede Sendung (Text, ausgewählte Bilder und Sprachnachrichten) wird vor jedem Netzwerkversuch in einem geräteeigenen Postausgang pro Gateway protokolliert, sodass ein Beenden der App übermittelte Eingaben nicht verlieren kann. Offline eingereihte Sendungen werden bei der erneuten Verbindung der Reihe nach mit stabilen Idempotenzschlüsseln zugestellt. Eine Sendung wird erst entfernt, nachdem die Interaktion im kanonischen `chat.history` sichtbar ist — eine Bestätigung allein gilt nicht als Zustellnachweis. Mehrdeutige Ergebnisse (verlorene Bestätigung, Beenden der App während des Sendens, Neustart des Gateways vor dem Schreiben des Transkripts) werden als sichtbare Zeilen mit den expliziten Optionen **Retry**/**Delete** angezeigt, statt automatisch erneut gesendet zu werden. Slash-Befehle werden nach einer erneuten Verbindung niemals automatisch wiederholt; sie werden für eine explizite Wiederholung zurückgestellt. Die Warteschlange ist begrenzt (50 Nachrichten und 48 MB Anhangsdaten pro Gateway), und nicht gesendete Zeilen verfallen nach 48 Stunden. Entwürfe im Eingabefeld, die nie übermittelt wurden, bleiben nach dem Beenden des Prozesses nicht erhalten.
- Push-Aktualisierungen (nach bestem Bemühen): `chat.subscribe` -> `event:"chat"`
- Anhören: Drücken Sie lange auf eine Assistant-Nachricht und wählen Sie **Listen**, um sie anzuhören. Audio wird über Gateway-`tts.speak` mit der konfigurierten TTS-Provider-Kette gerendert; wenn das Gateway kein Audio rendern kann, wird die systemeigene TTS des Geräts verwendet. Die Wiedergabe endet beim Wechsel der Sitzung, bei einem neuen Chat, beim Wechsel der App in den Hintergrund oder beim Schließen des Chats.

### 7. Canvas und Kamera

#### Gateway-Canvas-Host (für Webinhalte empfohlen)

Damit die Node echtes HTML/CSS/JS anzeigt, das der Agent auf dem Datenträger bearbeiten kann, richten Sie die Node auf den Canvas-Host des Gateways aus.

<Note>
Nodes laden Canvas vom HTTP-Server des Gateways (derselbe Port wie `gateway.port`, standardmäßig `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.
2. Navigieren Sie die Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn sich beide Geräte in Tailscale befinden, verwenden Sie anstelle von `.local` einen MagicDNS-Namen oder eine Tailnet-IP, beispielsweise `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server fügt einen Live-Reload-Client in HTML ein und lädt bei Dateiänderungen neu. Das Gateway stellt außerdem `/__openclaw__/a2ui/` bereit, die Android-App behandelt entfernte A2UI-Seiten jedoch als ausschließlich zum Rendern bestimmt. Aktionsfähige A2UI-Befehle verwenden die gebündelte, von der App verwaltete A2UI-Seite.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (standardmäßig `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (veralteter Alias `canvas.a2ui.pushJSONL`). Diese verwenden die gebündelte, von der App verwaltete A2UI-Seite für aktionsfähiges Rendering.

Kamerabefehle (nur im Vordergrund; berechtigungsabhängig): `camera.snap` (jpg), `camera.clip` (mp4). Parameter und CLI-Hilfsfunktionen finden Sie unter [Kamera-Node](/de/nodes/camera).

### 8. Sprache und erweiterter Android-Befehlsumfang

- Die Shell-Navigation von Android umfasst **Home**, **Chat** und **Settings**. Die Spracheingabe
  gehört zum Chat-Eingabefeld; es gibt keine separate Registerkarte für Sprache.
- Tippen Sie auf das Mikrofon im Eingabefeld, um die geräteeigene Spracherkennung zu verwenden, die ein
  Transkript in den Entwurf einfügt. Drücken Sie lange auf das Mikrofon, um einen Sprachnachrichten-
  anhang aufzunehmen. Die Benutzeroberfläche meldet eine nicht verfügbare Erkennung, eine fehlende Berechtigung,
  Belegt-/Netzwerkfehler und Ergebnisse ohne erkannte Sprache, statt
  den Versuch stillschweigend zu verwerfen.
- Starten Sie kontinuierliches **Talk** über die Chat-Wellenform. Diktat, Sprachnachrichten-
  aufnahme und Talk schließen sich als Mikrofonpfade gegenseitig aus.
- Der Talk-Modus stuft den vorhandenen Vordergrunddienst vor Beginn der Aufnahme von `connectedDevice` auf `connectedDevice|microphone` hoch und stuft ihn nach dem Beenden des Talk-Modus wieder zurück. Der Node-Dienst deklariert `FOREGROUND_SERVICE_CONNECTED_DEVICE` mit `CHANGE_NETWORK_STATE`; Android 14+ erfordert außerdem die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Laufzeitgewährung `RECORD_AUDIO` und zur Laufzeit den Diensttyp „Mikrofon“.
- Standardmäßig verwendet Android Talk die native Spracherkennung, den Gateway-Chat und `talk.speak` über den konfigurierten Talk-Provider des Gateways. Lokale System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Android Talk verwendet das Echtzeit-Gateway-Relay nur, wenn `talk.realtime.mode` den Wert `realtime` und `talk.realtime.transport` den Wert `gateway-relay` hat.
- Android kündigt die Fähigkeit `voiceWake` nicht an. Verwenden Sie für Spracheingaben das Chat-Diktat,
  eine Sprachnachricht oder Talk.
- Zusätzliche Android-Befehlsfamilien (die Verfügbarkeit hängt vom Gerät, den Berechtigungen und den Benutzereinstellungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` nur, wenn **Settings > Phone Capabilities > Installed Apps** aktiviert ist; standardmäßig werden im Launcher sichtbare Apps aufgelistet (übergeben Sie für die vollständige Liste `includeNonLaunchable`).
  - `notifications.list`, `notifications.actions` (siehe unten [Benachrichtigungsweiterleitung](#notification-forwarding))
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Arbeitsbereichsdateien (schreibgeschützt)

Die Übersicht unter **Home** enthält eine Karte **Files**, mit der der Arbeitsbereich des aktiven Agenten über die schreibgeschützten Gateway-RPCs `agents.workspace.list` / `agents.workspace.get` durchsucht werden kann: Navigation durch Verzeichnisse, Vorschauen für Text und Bilder sowie Export über das Android-Freigabemenü. Schreibvorgänge sind nicht verfügbar, und das Gateway begrenzt die Größe der Vorschauen.

## Befehlsausführungen genehmigen

Eine Operator-Verbindung mit `operator.admin` oder eine gekoppelte, vom Gateway explizit ausgewählte
`operator.approvals`-Verbindung kann ausstehende Ausführungsanfragen unter **Settings -> Approvals**
prüfen. Die App lädt den bereinigten Genehmigungsdatensatz des Gateways, bevor sie die zugehörigen
Schaltflächen aktiviert, zeigt alle Sicherheitswarnungen und genau die von der Anfrage angebotenen
Entscheidungen an und sendet die Genehmigungs-ID und die Eigentümerart an das Gateway zurück.

Der Genehmigungsstatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich gespeicherte Antwort gewinnt; Android zeigt dieses kanonische Ergebnis auch dann an,
wenn zuerst auf einer anderen Oberfläche geantwortet wurde. Wenn eine Auflösungsantwort verloren geht oder das Gateway
die Verbindung trennt, lässt die App die Aktion gesperrt und liest die Genehmigung erneut ein,
bevor sie eine weitere Entscheidung anbietet.

Gateways, die älter als die vereinheitlichten Genehmigungsmethoden sind, greifen auf die ausgelieferten,
ausführungsspezifischen Methoden zurück. Die Prüfung ausstehender Anfragen funktioniert weiterhin, aber der beibehaltene Terminalstatus
und das umfangreichere oberflächenübergreifende Ergebnis erfordern ein aktualisiertes Gateway.

## Fragen des Agenten beantworten

Der Chat zeigt ausstehende Gateway-Fragen für Operator-Verbindungen mit
`operator.questions` (oder `operator.admin`) als native Karten an. Die Karten unterstützen Optionen
mit Einzel- und Mehrfachauswahl, Optionsbeschreibungen, Freitextantworten über **Other** und einen
Countdown bis zum Ablauf. Bei erneuten Verbindungen werden ausstehende Fragen vom Gateway neu geladen. Eine Karte
wird gesperrt, wenn auf diesem Gerät geantwortet wird, auf einer anderen Oberfläche zuerst geantwortet wird oder die
Frage abläuft beziehungsweise abgebrochen wird.

## Assistant-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den Auslöser des System-Assistants (Google Assistant). Durch Gedrückthalten der Home-Taste (oder einen anderen `ACTION_ASSIST`-Auslöser) wird die App geöffnet; die Äußerung „Hey Google, ask OpenClaw `<prompt>`“ entspricht dem deklarierten App-Actions-Abfragemuster der App und übergibt die Eingabe an das Chat-Eingabefeld, ohne sie automatisch zu senden.

Hierfür werden Android-**App Actions** (Fähigkeit `shortcuts.xml`) verwendet, die im App-Manifest deklariert sind. Es ist keine Gateway-seitige Konfiguration erforderlich — der Assistant-Intent wird vollständig von der Android-App verarbeitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version der Google Play Services und davon ab, ob OpenClaw als Standard-Assistant-App festgelegt wurde.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als `node.event`-Elemente an das Gateway weiterleiten. Dies wird **auf dem Gerät** im Einstellungsbereich der App konfiguriert — nicht in der Gateway-/`openclaw.json`-Konfiguration.

| Einstellung                  | Beschreibung                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Benachrichtigungsereignisse weiterleiten | Hauptschalter. Standardmäßig deaktiviert; zunächst muss der Zugriff auf den Benachrichtigungs-Listener gewährt werden.                                                                                         |
| Paketfilter                  | **Positivliste** (nur aufgeführte Paket-IDs werden weitergeleitet) oder **Sperrliste** (Standard: alle Pakete außer den aufgeführten IDs). Das OpenClaw-eigene Paket wird im Sperrlistenmodus immer ausgeschlossen, um Weiterleitungsschleifen zu verhindern. |
| Ruhezeiten                   | Lokales Start-/Endzeitfenster im Format HH:mm, in dem die Weiterleitung unterdrückt wird. Standardmäßig deaktiviert; nach der Aktivierung gelten standardmäßig `22:00`-`07:00`.          |
| Max. Ereignisse / Minute     | Ratenbegrenzung pro Gerät für weitergeleitete Benachrichtigungen. Standardwert: 20.                                                                                                                           |
| Sitzungs-Routing-Schlüssel   | Optional. Ordnet weitergeleitete Benachrichtigungsereignisse einer bestimmten Sitzung statt der standardmäßigen Benachrichtigungsroute des Geräts zu.                                                         |

<Note>
Für die Benachrichtigungsweiterleitung ist die Android-Berechtigung für den Benachrichtigungs-Listener erforderlich. Die App fordert diese während der Einrichtung an.
</Note>

Benachrichtigungen von WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord und Signal werden immer ausgeschlossen. Ihre Nachrichten werden bereits von nativen OpenClaw-Kanalsitzungen verwaltet; die Weiterleitung der Android-Benachrichtigung als separates Node-Ereignis könnte eine Antwort an die falsche Unterhaltung leiten.

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Fehlerbehebung für Android-Nodes](/de/nodes/troubleshooting)
