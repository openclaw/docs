---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Fehlerbehebung bei Android-Gateway-Erkennung oder -Authentifizierung
    - Überprüfen der Chatverlauf-Parität über Clients hinweg
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Verbinden/Chat/Sprache/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-05-06T06:55:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie mit Java 17 und dem Android SDK (`./gradlew :app:assemblePlayDebug`) selbst bauen. Build-Anweisungen finden Sie unter [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Support-Überblick

- Rolle: begleitende Node-App (Android hostet den Gateway nicht).
- Gateway erforderlich: ja (führen Sie ihn unter macOS, Linux oder Windows über WSL2 aus).
- Installation: [Erste Schritte](/de/start/getting-started) + [Pairing](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Control Plane).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Verbindungs-Runbook

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Geräte-Pairing (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können den Gateway auf der „Master“-Maschine ausführen.
- Das Android-Gerät bzw. der Emulator kann den Gateway-WebSocket erreichen:
  - Gleiches LAN mit mDNS/NSD, **oder**
  - Gleiches Tailscale-Tailnet mit Wide-Area Bonjour / Unicast-DNS-SD (siehe unten), **oder**
  - Manueller Gateway-Host/-Port (Fallback)
- Pairing über Tailnet/öffentliche Mobilverbindungen verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf der Gateway-Maschine ausführen (oder per SSH).

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

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Eine einfache `gateway.bind: "tailnet"`-Konfiguration reicht für das erstmalige Remote-Android-Pairing nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2) Discovery prüfen (optional)

Von der Gateway-Maschine aus:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Debugging-Hinweise: [Bonjour](/de/gateway/bonjour).

Wenn Sie außerdem eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten Dienstendpunkt statt reiner TXT-Hinweise.

#### Tailnet-Discovery (Wien ⇄ London) über Unicast-DNS-SD

Android-NSD/mDNS-Discovery überschreitet keine Netzwerkgrenzen. Wenn sich Ihr Android-Node und der Gateway in unterschiedlichen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / Unicast-DNS-SD.

Discovery allein reicht für Tailnet/öffentliches Android-Pairing nicht aus. Die gefundene Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone ein (Beispiel `openclaw.internal.`) und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für Ihre gewählte Domain, die auf diesen DNS-Server verweist.

Details und Beispiel-CoreDNS-Konfiguration: [Bonjour](/de/gateway/bonjour).

### 3) Von Android verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** aufrecht (dauerhafte Benachrichtigung).
- Öffnen Sie den Tab **Verbinden**.
- Verwenden Sie den Modus **Setup-Code** oder **Manuell**.
- Wenn Discovery blockiert ist, verwenden Sie in den **Erweiterten Steuerelementen** manuellen Host/Port. Für private LAN-Hosts funktioniert `ws://` weiterhin. Für Tailscale/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach dem ersten erfolgreichen Pairing verbindet sich Android beim Start automatisch erneut:

- Manueller Endpunkt (falls aktiviert), andernfalls
- der zuletzt gefundene Gateway (Best-Effort).

### Presence-Alive-Beacons

Nachdem die authentifizierte Node-Sitzung verbunden ist und wenn die App in den Hintergrund wechselt, während der Foreground Service weiterhin verbunden ist, ruft Android `node.event` mit `event: "node.presence.alive"` auf. Der Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gepairten Nodes/Geräts auf, nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App zählt den Beacon nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

### 4) Pairing genehmigen (CLI)

Auf der Gateway-Maschine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Pairing-Details: [Pairing](/de/channels/pairing).

Optional: Wenn sich der Android-Node immer aus einem streng kontrollierten Subnetz verbindet, können Sie die automatische Genehmigung für erstmaliges Node-Pairing mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frisches `role: node`-Pairing ohne angeforderte Scopes. Operator-/Browser-Pairing sowie jede Änderung von Rolle, Scope, Metadaten oder Public Key erfordern weiterhin eine manuelle Genehmigung.

### 5) Prüfen, ob der Node verbunden ist

- Über den Node-Status:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Android-Chat-Tab unterstützt Sitzungsauswahl (standardmäßig `main` sowie andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeige-normalisiert; Inline-Directive-Tags werden aus sichtbarem Text entfernt, Nur-Text-XML-Payloads von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufruf-Blöcke) sowie geleakte ASCII-/Full-Width-Modellsteuerungs-Tokens werden entfernt, reine Silent-Token-Assistentenzeilen wie exakt `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Aktualisierungen (Best-Effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (für Webinhalte empfohlen)

Wenn der Node echtes HTML/CSS/JS anzeigen soll, das der Agent auf der Festplatte bearbeiten kann, richten Sie den Node auf den Gateway Canvas Host aus.

<Note>
Nodes laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, standardmäßig `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte in Tailscale sind, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host befindet sich unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standard-Scaffold zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (standardmäßig `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` Legacy-Alias)

Kamerabefehle (nur im Vordergrund; berechtigungsgebunden):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parameter und CLI-Helfer finden Sie unter [Kamera-Node](/de/nodes/camera).

### 8) Sprache + erweiterte Android-Befehlsoberfläche

- Sprach-Tab: Android hat zwei explizite Aufnahmemodi. **Mikrofon** ist eine manuelle Sprach-Tab-Sitzung, die jede Pause als Chat-Turn sendet und stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Sprach-Tab verlässt. **Talk** ist der kontinuierliche Talk Mode und hört weiter zu, bis er deaktiviert wird oder der Node die Verbindung trennt.
- Talk Mode stuft den vorhandenen Foreground Service vor Beginn der Aufnahme von `dataSync` auf `dataSync|microphone` hoch und stuft ihn wieder zurück, wenn Talk Mode stoppt. Android 14+ erfordert die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Laufzeitberechtigung `RECORD_AUDIO` und den Mikrofon-Diensttyp zur Laufzeit.
- Gesprochene Antworten verwenden `talk.speak` über den konfigurierten Gateway-Talk-Provider. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Sprachaktivierung bleibt in der Android-UX/Laufzeitumgebung deaktiviert.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit hängt von Gerät + Berechtigungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (siehe [Benachrichtigungsweiterleitung](#notification-forwarding) unten)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistenten-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den Systemassistenten-Trigger (Google Assistant). Wenn konfiguriert, öffnet das Halten der Home-Taste oder das Sagen von „Hey Google, ask OpenClaw...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-**App Actions**-Metadaten, die im App-Manifest deklariert sind. Auf Gateway-Seite ist keine zusätzliche Konfiguration erforderlich -- der Assistenten-Intent wird vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version der Google Play Services und davon ab, ob der Benutzer OpenClaw als Standard-Assistenten-App festgelegt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Events an den Gateway weiterleiten. Mehrere Steuerelemente ermöglichen es Ihnen festzulegen, welche Benachrichtigungen weitergeleitet werden und wann.

| Schlüssel                         | Typ            | Beschreibung                                                                                                                   |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`     | string[]       | Nur Benachrichtigungen von diesen Paketnamen weiterleiten. Wenn gesetzt, werden alle anderen Pakete ignoriert.                  |
| `notifications.denyPackages`      | string[]       | Benachrichtigungen von diesen Paketnamen niemals weiterleiten. Wird nach `allowPackages` angewendet.                           |
| `notifications.quietHours.start`  | string (HH:mm) | Beginn des Ruhezeitenfensters (lokale Gerätezeit). Benachrichtigungen werden während dieses Fensters unterdrückt.              |
| `notifications.quietHours.end`    | string (HH:mm) | Ende des Ruhezeitenfensters.                                                                                                   |
| `notifications.rateLimit`         | number         | Maximale Anzahl weitergeleiteter Benachrichtigungen pro Paket und Minute. Überschüssige Benachrichtigungen werden verworfen.   |

Der Benachrichtigungsauswähler verwendet außerdem sichereres Verhalten für weitergeleitete Benachrichtigungs-Events und verhindert die versehentliche Weiterleitung sensibler Systembenachrichtigungen.

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
Benachrichtigungsweiterleitung erfordert die Android-Berechtigung Notification Listener. Die App fordert diese während der Einrichtung an.
</Note>

## Verwandt

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Android-Node-Fehlerbehebung](/de/nodes/troubleshooting)
