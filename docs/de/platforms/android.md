---
read_when:
    - Android-Node koppeln oder erneut verbinden
    - Debugging der Android-Gateway-Erkennung oder -Authentifizierung
    - Parität des Chatverlaufs über Clients hinweg überprüfen
summary: 'Android-App (Node): Verbindungs-Runbook + Befehlsoberfläche für Verbinden/Chat/Sprache/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-04-30T07:02:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie mit Java 17 und dem Android SDK (`./gradlew :app:assemblePlayDebug`) selbst bauen. Build-Anweisungen finden Sie in [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Support-Überblick

- Rolle: Companion-Node-App (Android hostet den Gateway nicht).
- Gateway erforderlich: ja (führen Sie ihn unter macOS, Linux oder Windows über WSL2 aus).
- Installation: [Erste Schritte](/de/start/getting-started) + [Kopplung](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Control Plane).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) läuft auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Verbindungs-Runbook

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Gerätekopplung (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können den Gateway auf der „Master“-Maschine ausführen.
- Android-Gerät/-Emulator kann den Gateway-WebSocket erreichen:
  - Dasselbe LAN mit mDNS/NSD, **oder**
  - Dasselbe Tailscale-Tailnet mit Wide-Area Bonjour / Unicast DNS-SD (siehe unten), **oder**
  - Manueller Gateway-Host/-Port (Fallback)
- Tailnet-/öffentliche mobile Kopplung verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf der Gateway-Maschine ausführen (oder über SSH).

### 1) Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Prüfen Sie, ob in den Logs etwas Ähnliches erscheint:

- `listening on ws://0.0.0.0:18789`

Für Remote-Android-Zugriff über Tailscale bevorzugen Sie Serve/Funnel statt einer rohen Tailnet-Bindung:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Eine einfache `gateway.bind: "tailnet"`-Einrichtung reicht für die erstmalige Remote-Android-Kopplung nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

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

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten
Dienstendpunkt statt reiner TXT-Hinweise.

#### Tailnet-Discovery (Wien ⇄ London) über Unicast DNS-SD

Android-NSD-/mDNS-Discovery überschreitet keine Netzwerkgrenzen. Wenn Ihr Android-Node und der Gateway in unterschiedlichen Netzwerken sind, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / Unicast DNS-SD.

Discovery allein reicht für Tailnet-/öffentliche Android-Kopplung nicht aus. Die gefundene Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone ein (Beispiel `openclaw.internal.`) und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für Ihre gewählte Domain, die auf diesen DNS-Server zeigt.

Details und Beispiel-CoreDNS-Konfiguration: [Bonjour](/de/gateway/bonjour).

### 3) Von Android verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** (dauerhafte Benachrichtigung) aktiv.
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie manuellen Host/Port in **Advanced controls**. Für private LAN-Hosts funktioniert `ws://` weiterhin. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach der ersten erfolgreichen Kopplung verbindet sich Android beim Start automatisch erneut:

- Manueller Endpunkt (falls aktiviert), andernfalls
- Der zuletzt gefundene Gateway (Best-Effort).

### Presence-Alive-Beacons

Nachdem die authentifizierte Node-Sitzung verbunden ist und die App in den Hintergrund wechselt, während der
Foreground Service noch verbunden ist, ruft Android `node.event` mit
`event: "node.presence.alive"` auf. Der Gateway speichert dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den
Metadaten des gekoppelten Nodes/Geräts, wenn die authentifizierte Node-Geräteidentität bekannt ist.

Die App zählt das Beacon nur dann als erfolgreich gespeichert, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

### 4) Kopplung genehmigen (CLI)

Auf der Gateway-Maschine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Kopplungsdetails: [Kopplung](/de/channels/pairing).

Optional: Wenn der Android-Node immer aus einem streng kontrollierten Subnetz verbindet,
können Sie die automatische Erstgenehmigung von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frische `role: node`-Kopplung ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

### 5) Prüfen, ob der Node verbunden ist

- Über Nodes-Status:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Android-Chat-Tab unterstützt Sitzungsauswahl (Standard `main`, plus weitere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeigenormalisiert; Inline-Direktiven-Tags werden
  aus sichtbarem Text entfernt, Nur-Text-Tool-Call-XML-Payloads (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittene Tool-Call-Blöcke) sowie geleakte ASCII-/Full-Width-Modell-Steuerungstokens
  werden entfernt, reine Silent-Token-Assistant-Zeilen wie exaktes `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Aktualisierungen (Best-Effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway-Canvas-Host (empfohlen für Webinhalte)

Wenn der Node echtes HTML/CSS/JS anzeigen soll, das der Agent auf der Festplatte bearbeiten kann, richten Sie den Node auf den Gateway-Canvas-Host aus.

<Note>
Nodes laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, Standard `18789`).
</Note>

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte auf Tailscale sind, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host liegt unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standard-Scaffold zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (Standard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` Legacy-Alias)

Kamerabefehle (nur im Vordergrund; berechtigungsgebunden):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Kamera-Node](/de/nodes/camera) für Parameter und CLI-Helfer.

### 8) Sprache + erweiterte Android-Befehlsoberfläche

- Voice-Tab: Android hat zwei explizite Aufnahmemodi. **Mic** ist eine manuelle Voice-Tab-Sitzung, die jede Pause als Chat-Turn sendet und stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Voice-Tab verlässt. **Talk** ist kontinuierlicher Talk Mode und hört weiter zu, bis er ausgeschaltet wird oder der Node die Verbindung trennt.
- Talk Mode stuft den vorhandenen Foreground Service von `dataSync` auf `dataSync|microphone` hoch, bevor die Aufnahme startet, und stuft ihn wieder zurück, wenn Talk Mode stoppt. Android 14+ erfordert die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Runtime-Berechtigung `RECORD_AUDIO` und den Mikrofon-Servicetyp zur Laufzeit.
- Gesprochene Antworten verwenden `talk.speak` über den konfigurierten Gateway-Talk-Provider. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Voice Wake bleibt in der Android-UX/-Runtime deaktiviert.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit hängt von Gerät + Berechtigungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (siehe [Benachrichtigungsweiterleitung](#notification-forwarding) unten)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den System-Assistant-Trigger (Google
Assistant). Wenn dies konfiguriert ist, öffnet das Halten der Home-Taste oder das Sagen von „Hey Google, ask
OpenClaw...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-**App Actions**-Metadaten, die im App-Manifest deklariert sind. Auf der
Gateway-Seite ist keine zusätzliche Konfiguration erforderlich -- der Assistant-Intent wird
vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version von Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistant-App festgelegt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Events an den Gateway weiterleiten. Mehrere Steuerungen legen fest, welche Benachrichtigungen wann weitergeleitet werden.

| Schlüssel                         | Typ            | Beschreibung                                                                                                           |
| --------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`     | string[]       | Leitet nur Benachrichtigungen von diesen Paketnamen weiter. Falls gesetzt, werden alle anderen Pakete ignoriert.       |
| `notifications.denyPackages`      | string[]       | Leitet niemals Benachrichtigungen von diesen Paketnamen weiter. Wird nach `allowPackages` angewendet.                  |
| `notifications.quietHours.start`  | string (HH:mm) | Beginn des Ruhezeitfensters (lokale Gerätezeit). Benachrichtigungen werden während dieses Fensters unterdrückt.        |
| `notifications.quietHours.end`    | string (HH:mm) | Ende des Ruhezeitfensters.                                                                                             |
| `notifications.rateLimit`         | number         | Maximal weitergeleitete Benachrichtigungen pro Paket und Minute. Überschüssige Benachrichtigungen werden verworfen.    |

Der Benachrichtigungsauswähler verwendet außerdem sichereres Verhalten für weitergeleitete Benachrichtigungs-Events, um versehentliche Weiterleitung sensibler Systembenachrichtigungen zu verhindern.

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
Die Benachrichtigungsweiterleitung erfordert die Android-Berechtigung Notification Listener. Die App fordert diese während der Einrichtung an.
</Note>

## Verwandt

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Android-Node-Fehlerbehebung](/de/nodes/troubleshooting)
