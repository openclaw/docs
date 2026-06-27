---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Android-Gateway-Erkennung oder -Authentifizierung debuggen
    - Überprüfung der Chatverlauf-Parität über Clients hinweg
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Connect/Chat/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-06-27T17:41:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die offizielle Android-App ist auf [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) verfügbar. Sie ist ein Begleitknoten und erfordert einen laufenden OpenClaw Gateway. Der Quellcode ist ebenfalls im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar; Build-Anweisungen finden Sie unter [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Support-Momentaufnahme

- Rolle: Begleitknoten-App (Android hostet den Gateway nicht).
- Gateway erforderlich: ja (führen Sie ihn unter macOS, Linux oder Windows über WSL2 aus).
- Installation: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) für die App, [Erste Schritte](/de/start/getting-started) für den Gateway, dann [Kopplung](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Knoten + Steuerungsebene).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Verbindungs-Runbook

Android-Knoten-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet die Gerätekopplung (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können den Gateway auf dem „Master“-Computer ausführen.
- Android-Gerät/-Emulator kann den Gateway-WebSocket erreichen:
  - Gleiches LAN mit mDNS/NSD, **oder**
  - Gleiches Tailscale-Tailnet mit Wide-Area Bonjour / Unicast-DNS-SD (siehe unten), **oder**
  - Manueller Gateway-Host/-Port (Fallback)
- Tailnet-/öffentliche mobile Kopplung verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf dem Gateway-Computer ausführen (oder per SSH).

### 1) Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie in den Logs, dass Sie etwas wie Folgendes sehen:

- `listening on ws://0.0.0.0:18789`

Für Remote-Android-Zugriff über Tailscale bevorzugen Sie Serve/Funnel statt einer rohen Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Eine einfache `gateway.bind: "tailnet"`-Einrichtung reicht für die erstmalige Remote-Android-Kopplung nicht aus, es sei denn, Sie terminieren TLS zusätzlich separat.

### 2) Discovery überprüfen (optional)

Vom Gateway-Computer aus:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Debugging-Hinweise: [Bonjour](/de/gateway/bonjour).

Wenn Sie außerdem eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten
Dienstendpunkt statt reiner TXT-Hinweise.

#### Tailnet-Discovery (Wien ⇄ London) über Unicast-DNS-SD

Android-NSD-/mDNS-Discovery überschreitet keine Netzwerke. Wenn Ihr Android-Knoten und der Gateway in unterschiedlichen Netzwerken sind, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / Unicast-DNS-SD.

Discovery allein reicht für Tailnet-/öffentliche Android-Kopplung nicht aus. Die erkannte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie eine DNS-SD-Zone (Beispiel `openclaw.internal.`) auf dem Gateway-Host ein und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split-DNS für Ihre gewählte Domain, die auf diesen DNS-Server zeigt.

Details und Beispiel-CoreDNS-Konfiguration: [Bonjour](/de/gateway/bonjour).

### 3) Von Android verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Vordergrunddienst** (dauerhafte Benachrichtigung) aktiv.
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie manuellen Host/Port in **Advanced controls**. Für private LAN-Hosts funktioniert `ws://` weiterhin. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach der ersten erfolgreichen Kopplung verbindet sich Android beim Start automatisch erneut:

- Manueller Endpunkt (falls aktiviert), andernfalls
- Der zuletzt erkannte Gateway (Best-Effort).

### Presence-Alive-Beacons

Nachdem die authentifizierte Knotensitzung verbunden ist und wenn die App in den Hintergrund wechselt, während der
Vordergrunddienst weiterhin verbunden ist, ruft Android `node.event` mit
`event: "node.presence.alive"` auf. Der Gateway speichert dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den
gekoppelten Knoten-/Gerätemetadaten, nachdem die authentifizierte Knotengeräteidentität bekannt ist.

Die App zählt den Beacon nur dann als erfolgreich gespeichert, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist
kompatibel, zählt jedoch nicht als dauerhaftes Last-Seen-Update.

### 4) Kopplung genehmigen (CLI)

Auf dem Gateway-Computer:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Kopplungsdetails: [Kopplung](/de/channels/pairing).

Optional: Wenn der Android-Knoten immer aus einem streng kontrollierten Subnetz verbindet,
können Sie sich für die erstmalige automatische Knotengenehmigung mit expliziten CIDRs oder genauen IPs entscheiden:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frische `role: node`-Kopplungen ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Rollen-, Scope-, Metadaten- oder
Public-Key-Änderung erfordern weiterhin manuelle Genehmigung.

### 5) Überprüfen, ob der Knoten verbunden ist

- Über Knotenstatus:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Android-Chat-Tab unterstützt Sitzungsauswahl (Standard `main`, plus andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeige-normalisiert; Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, Plain-Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  gekürzten Tool-Aufrufblöcken) sowie geleakte ASCII-/Vollbreiten-Modellsteuerungstoken
  werden entfernt, reine Silent-Token-Assistentenzeilen wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Updates (Best-Effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (für Webinhalte empfohlen)

Wenn der Knoten echtes HTML/CSS/JS anzeigen soll, das der Agent auf der Festplatte bearbeiten kann, richten Sie den Knoten auf den Gateway-Canvas-Host.

<Note>
Knoten laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, Standard `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Knoten dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte in Tailscale sind, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der Gateway stellt auch `/__openclaw__/a2ui/` bereit, aber die Android-App behandelt Remote-A2UI-Seiten als reines Rendering. Aktionsfähige A2UI-Befehle verwenden die gebündelte app-eigene A2UI-Seite, bevor Nachrichten angewendet werden.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (Standard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` Legacy-Alias). Diese Befehle verwenden die gebündelte app-eigene A2UI-Seite für aktionsfähiges Rendering.

Kamerabefehle (nur im Vordergrund; berechtigungsgebunden):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Kamera-Knoten](/de/nodes/camera) für Parameter und CLI-Hilfsfunktionen.

### 8) Sprache + erweiterte Android-Befehlsoberfläche

- Voice-Tab: Android hat zwei explizite Aufnahmemodi. **Mic** ist eine manuelle Voice-Tab-Sitzung, die jede Pause als Chat-Turn sendet und stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Voice-Tab verlässt. **Talk** ist der kontinuierliche Talk Mode und hört weiter zu, bis er ausgeschaltet wird oder der Knoten die Verbindung trennt.
- Talk Mode stuft den vorhandenen Vordergrunddienst vor Beginn der Aufnahme von `connectedDevice` auf `connectedDevice|microphone` hoch und stuft ihn wieder herab, wenn Talk Mode stoppt. Der Knotendienst deklariert `FOREGROUND_SERVICE_CONNECTED_DEVICE` mit `CHANGE_NETWORK_STATE`; Android 14+ erfordert außerdem die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Laufzeitberechtigung `RECORD_AUDIO` und den Mikrofon-Diensttyp zur Laufzeit.
- Standardmäßig verwendet Android Talk native Spracherkennung, Gateway-Chat und `talk.speak` über den konfigurierten Gateway-Talk-Provider. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Android Talk verwendet den Echtzeit-Gateway-Relay nur, wenn `talk.realtime.mode` `realtime` ist und `talk.realtime.transport` `gateway-relay` ist.
- Voice Wake bleibt in der Android-UX/-Laufzeit deaktiviert.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit hängt von Gerät, Berechtigungen und Benutzereinstellungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` nur, wenn **Settings > Phone Capabilities > Installed Apps** aktiviert ist; es listet standardmäßig launcher-sichtbare Apps auf.
  - `notifications.list`, `notifications.actions` (siehe [Benachrichtigungsweiterleitung](#notification-forwarding) unten)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistenten-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den Systemassistenten-Trigger (Google
Assistant). Wenn konfiguriert, öffnet das Halten der Home-Taste oder das Sagen von „Hey Google, frag
OpenClaw...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-**App Actions**-Metadaten, die im App-Manifest deklariert sind. Auf
Gateway-Seite ist keine zusätzliche Konfiguration erforderlich -- der Assistenten-Intent wird
vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version der Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistenten-App festgelegt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Ereignisse an den Gateway weiterleiten. Mehrere Steuerelemente erlauben es Ihnen, festzulegen, welche Benachrichtigungen weitergeleitet werden und wann.

| Schlüssel                        | Typ            | Beschreibung                                                                                          |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Nur Benachrichtigungen von diesen Paketnamen weiterleiten. Wenn gesetzt, werden alle anderen Pakete ignoriert. |
| `notifications.denyPackages`     | string[]       | Benachrichtigungen von diesen Paketnamen niemals weiterleiten. Wird nach `allowPackages` angewendet. |
| `notifications.quietHours.start` | string (HH:mm) | Beginn des Ruhezeitenfensters (lokale Gerätezeit). Benachrichtigungen werden während dieses Fensters unterdrückt. |
| `notifications.quietHours.end`   | string (HH:mm) | Ende des Ruhezeitenfensters.                                                                          |
| `notifications.rateLimit`        | number         | Maximale weitergeleitete Benachrichtigungen pro Paket pro Minute. Überschüssige Benachrichtigungen werden verworfen. |

Die Benachrichtigungsauswahl verwendet außerdem sichereres Verhalten für weitergeleitete Benachrichtigungsereignisse und verhindert so die versehentliche Weiterleitung sensibler Systembenachrichtigungen.

Beispielkonfiguration:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Die Weiterleitung von Benachrichtigungen erfordert die Android-Berechtigung für den Notification Listener. Die App fordert Sie während der Einrichtung dazu auf.
</Note>

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Fehlerbehebung für Android-Node](/de/nodes/troubleshooting)
