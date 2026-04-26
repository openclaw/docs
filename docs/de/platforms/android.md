---
read_when:
    - Den Android-Node koppeln oder erneut verbinden
    - Android-Gateway-Discovery oder -Authentifizierung debuggen
    - Parität des Chatverlaufs über Clients hinweg verifizieren
summary: 'Android-App (Node): Runbook für die Verbindung + Befehlsoberfläche für Connect/Chat/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-04-26T11:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Hinweis:** Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie selbst mit Java 17 und dem Android SDK bauen (`./gradlew :app:assemblePlayDebug`). Siehe [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) für Build-Anweisungen.

## Unterstützungsübersicht

- Rolle: Companion-Node-App (Android hostet nicht das Gateway).
- Gateway erforderlich: ja (führen Sie es auf macOS, Linux oder Windows über WSL2 aus).
- Installation: [Erste Schritte](/de/start/getting-started) + [Pairing](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Konfiguration](/de/gateway/configuration).
  - Protokolle: [Gateway-Protokoll](/de/gateway/protocol) (Nodes + Control Plane).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) befindet sich auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Verbindungs-Runbook

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Device-Pairing (`role: node`).

Für Tailscale oder öffentliche Hosts erfordert Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Klartext-`ws://` bleibt auf privaten LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und der Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können das Gateway auf dem „Master“-Rechner ausführen.
- Das Android-Gerät/der Emulator kann den Gateway-WebSocket erreichen:
  - im selben LAN mit mDNS/NSD, **oder**
  - im selben Tailscale-Tailnet mit Wide-Area Bonjour / unicast DNS-SD (siehe unten), **oder**
  - per manuellem Gateway-Host/Port (Fallback)
- Mobiles Pairing über Tailnet/öffentlich verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf dem Gateway-Rechner ausführen (oder per SSH).

### 1) Das Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie in den Logs, dass Sie etwa Folgendes sehen:

- `listening on ws://0.0.0.0:18789`

Für entfernten Android-Zugriff über Tailscale bevorzugen Sie Serve/Funnel statt eines rohen Tailnet-Binds:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Ein einfaches Setup mit `gateway.bind: "tailnet"` reicht für das erste entfernte Android-Pairing nicht aus, sofern Sie TLS nicht zusätzlich separat terminieren.

### 2) Discovery prüfen (optional)

Auf dem Gateway-Rechner:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Debug-Hinweise: [Bonjour](/de/gateway/bonjour).

Wenn Sie zusätzlich eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten
Service-Endpunkt statt nur TXT-Hinweisen.

#### Tailnet-Discovery (Wien ⇄ London) über unicast DNS-SD

Android-NSD-/mDNS-Discovery funktioniert nicht netzwerkübergreifend. Wenn sich Ihr Android-Node und das Gateway in verschiedenen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / unicast DNS-SD.

Discovery allein reicht für Android-Pairing über Tailnet/öffentlich nicht aus. Die erkannte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie eine DNS-SD-Zone (Beispiel `openclaw.internal.`) auf dem Gateway-Host ein und veröffentlichen Sie `_openclaw-gw._tcp`-Records.
2. Konfigurieren Sie Tailscale Split DNS für Ihre gewählte Domain und zeigen Sie auf diesen DNS-Server.

Details und Beispielkonfiguration für CoreDNS: [Bonjour](/de/gateway/bonjour).

### 3) Von Android aus verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** aktiv (persistente Benachrichtigung).
- Öffnen Sie den Reiter **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie manuellen Host/Port in **Advanced controls**. Für private LAN-Hosts funktioniert weiterhin `ws://`. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach dem ersten erfolgreichen Pairing verbindet sich Android beim Start automatisch erneut:

- manueller Endpunkt (falls aktiviert), andernfalls
- das zuletzt erkannte Gateway (best effort).

### 4) Pairing genehmigen (CLI)

Auf dem Gateway-Rechner:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zum Pairing: [Pairing](/de/channels/pairing).

Optional: Wenn sich der Android-Node immer aus einem eng kontrollierten Subnetz verbindet,
können Sie sich für die automatische Genehmigung von erstmaligem Node-Pairing mit expliziten CIDRs oder exakten IPs entscheiden:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frisches `role: node`-Pairing ohne
angeforderte Scopes. Pairing von Operator-/Browser-Clients sowie jede Änderung von Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

### 5) Prüfen, ob der Node verbunden ist

- Über Node-Status:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Reiter Android Chat unterstützt Sitzungsauswahl (standardmäßig `main`, plus andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeige-normalisiert; Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads für Tool-Aufrufe im Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittene Tool-Call-Blöcke) sowie geleakte Modell-Steuerungstokens in ASCII/Vollbreite
  werden entfernt, reine stille-Token-Assistentenzeilen wie exaktes `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Updates (best effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (empfohlen für Web-Inhalte)

Wenn Sie möchten, dass der Node echtes HTML/CSS/JS anzeigt, das der Agent auf dem Datenträger bearbeiten kann, richten Sie den Node auf den Gateway-Canvas-Host.

Hinweis: Nodes laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, Standard `18789`).

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie den Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn sich beide Geräte in Tailscale befinden, verwenden Sie statt `.local` einen MagicDNS-Namen oder eine Tailnet-IP, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host befindet sich unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standardgerüst zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (standardmäßig `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` veralteter Alias)

Kamera-Befehle (nur im Vordergrund; an Berechtigungen gebunden):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Kamera-Node](/de/nodes/camera) für Parameter und CLI-Helfer.

### 8) Voice + erweiterte Android-Befehlsoberfläche

- Reiter Voice: Android hat zwei explizite Erfassungsmodi. **Mic** ist eine manuelle Sitzung im Voice-Reiter, die jede Pause als Chat-Zug sendet und stoppt, wenn die App den Vordergrund verlässt oder der Benutzer den Voice-Reiter verlässt. **Talk** ist der fortlaufende Talk Mode und hört weiter zu, bis er ausgeschaltet wird oder der Node die Verbindung verliert.
- Talk Mode stuft den vorhandenen Foreground Service vor Beginn der Aufnahme von `dataSync` auf `dataSync|microphone` hoch und stuft ihn zurück, wenn Talk Mode stoppt. Android 14+ erfordert die Deklaration `FOREGROUND_SERVICE_MICROPHONE`, die Runtime-Genehmigung `RECORD_AUDIO` und den Microphone-Service-Typ zur Laufzeit.
- Gesprochene Antworten verwenden `talk.speak` über den konfigurierten Gateway-Talk-Provider. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist.
- Voice Wake bleibt in Android-UX/-Laufzeit deaktiviert.
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

Android unterstützt das Starten von OpenClaw über den System-Assistenten-Trigger (Google
Assistant). Wenn konfiguriert, öffnet das Gedrückthalten der Home-Taste oder „Hey Google, frag
OpenClaw ...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-**App Actions**-Metadaten, die im App-Manifest deklariert sind. Auf
Gateway-Seite ist keine zusätzliche Konfiguration nötig — der Assistant-Intent wird vollständig
von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version von Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistenten-App gesetzt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Ereignisse an das Gateway weiterleiten. Mehrere Steuerelemente erlauben es Ihnen, den Umfang weitergeleiteter Benachrichtigungen und den Zeitpunkt zu begrenzen.

| Schlüssel                        | Typ            | Beschreibung                                                                                     |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | Nur Benachrichtigungen dieser Paketnamen weiterleiten. Wenn gesetzt, werden alle anderen Pakete ignoriert. |
| `notifications.denyPackages`     | string[]       | Benachrichtigungen dieser Paketnamen niemals weiterleiten. Wird nach `allowPackages` angewendet. |
| `notifications.quietHours.start` | string (HH:mm) | Beginn des Quiet-Hours-Fensters (lokale Gerätezeit). Benachrichtigungen werden in diesem Fenster unterdrückt. |
| `notifications.quietHours.end`   | string (HH:mm) | Ende des Quiet-Hours-Fensters.                                                                   |
| `notifications.rateLimit`        | number         | Maximale Anzahl weitergeleiteter Benachrichtigungen pro Paket und Minute. Überschüssige Benachrichtigungen werden verworfen. |

Die Benachrichtigungsauswahl verwendet außerdem ein sichereres Verhalten für weitergeleitete Benachrichtigungsereignisse, um versehentliche Weiterleitung sensibler Systembenachrichtigungen zu verhindern.

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
Benachrichtigungsweiterleitung erfordert die Android-Berechtigung Notification Listener. Die App fordert während des Setups dazu auf.
</Note>

## Verwandt

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Android-Node-Fehlerbehebung](/de/nodes/troubleshooting)
