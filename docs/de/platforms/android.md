---
read_when:
    - Kopplung oder erneute Verbindung des Android-Node
    - Debugging von Android-Gateway-Erkennung oder -Authentifizierung
    - Überprüfen der Chatverlaufsparität über Clients hinweg
summary: 'Android-App (Node): Runbook für Verbindungen + Befehlsoberfläche für Connect/Chat/Voice/Canvas'
title: Android-App
x-i18n:
    generated_at: "2026-04-25T13:50:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Hinweis:** Die Android-App wurde noch nicht öffentlich veröffentlicht. Der Quellcode ist im [OpenClaw-Repository](https://github.com/openclaw/openclaw) unter `apps/android` verfügbar. Sie können sie selbst mit Java 17 und dem Android SDK bauen (`./gradlew :app:assemblePlayDebug`). Siehe [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) für Build-Anweisungen.

## Support-Überblick

- Rolle: begleitende Node-App (Android hostet das Gateway nicht).
- Gateway erforderlich: ja (führen Sie es auf macOS, Linux oder Windows über WSL2 aus).
- Installation: [Getting Started](/de/start/getting-started) + [Pairing](/de/channels/pairing).
- Gateway: [Runbook](/de/gateway) + [Configuration](/de/gateway/configuration).
  - Protokolle: [Gateway protocol](/de/gateway/protocol) (Nodes + Steuerungsebene).

## Systemsteuerung

Die Systemsteuerung (launchd/systemd) liegt auf dem Gateway-Host. Siehe [Gateway](/de/gateway).

## Verbindungs-Runbook

Android-Node-App ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android verbindet sich direkt mit dem Gateway-WebSocket und verwendet Gerätekopplung (`role: node`).

Für Tailscale oder öffentliche Hosts benötigt Android einen sicheren Endpunkt:

- Bevorzugt: Tailscale Serve / Funnel mit `https://<magicdns>` / `wss://<magicdns>`
- Ebenfalls unterstützt: jede andere `wss://`-Gateway-URL mit einem echten TLS-Endpunkt
- Unverschlüsseltes `ws://` wird weiterhin für private LAN-Adressen / `.local`-Hosts sowie `localhost`, `127.0.0.1` und die Android-Emulator-Bridge (`10.0.2.2`) unterstützt

### Voraussetzungen

- Sie können das Gateway auf dem „Master“-Rechner ausführen.
- Android-Gerät/-Emulator kann den Gateway-WebSocket erreichen:
  - Gleiches LAN mit mDNS/NSD, **oder**
  - Gleiches Tailscale-Tailnet mit Wide-Area Bonjour / unicast DNS-SD (siehe unten), **oder**
  - Manuell konfigurierter Gateway-Host/Port (Fallback)
- Mobile Kopplung über Tailnet/öffentlich verwendet **keine** rohen Tailnet-IP-`ws://`-Endpunkte. Verwenden Sie stattdessen Tailscale Serve oder eine andere `wss://`-URL.
- Sie können die CLI (`openclaw`) auf dem Gateway-Rechner ausführen (oder per SSH).

### 1) Gateway starten

```bash
openclaw gateway --port 18789 --verbose
```

Bestätigen Sie in den Logs, dass Sie etwas sehen wie:

- `listening on ws://0.0.0.0:18789`

Für entfernten Android-Zugriff über Tailscale bevorzugen Sie Serve/Funnel statt eines rohen Tailnet-Binds:

```bash
openclaw gateway --tailscale serve
```

Dadurch erhält Android einen sicheren `wss://`- / `https://`-Endpunkt. Ein einfaches `gateway.bind: "tailnet"`-Setup reicht für die erstmalige entfernte Android-Kopplung nicht aus, es sei denn, Sie terminieren TLS zusätzlich separat.

### 2) Discovery verifizieren (optional)

Vom Gateway-Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Weitere Debugging-Hinweise: [Bonjour](/de/gateway/bonjour).

Wenn Sie zusätzlich eine Wide-Area-Discovery-Domain konfiguriert haben, vergleichen Sie mit:

```bash
openclaw gateway discover --json
```

Das zeigt `local.` plus die konfigurierte Wide-Area-Domain in einem Durchlauf und verwendet den aufgelösten
Service-Endpunkt statt reiner TXT-Hinweise.

#### Tailnet-Discovery (Wien ⇄ London) über unicast DNS-SD

Android-NSD/mDNS-Discovery funktioniert nicht netzwerkübergreifend. Wenn sich Ihre Android-Node und das Gateway in unterschiedlichen Netzwerken befinden, aber über Tailscale verbunden sind, verwenden Sie stattdessen Wide-Area Bonjour / unicast DNS-SD.

Discovery allein reicht für die Android-Kopplung über Tailnet/öffentlich nicht aus. Die entdeckte Route benötigt weiterhin einen sicheren Endpunkt (`wss://` oder Tailscale Serve):

1. Richten Sie auf dem Gateway-Host eine DNS-SD-Zone ein (Beispiel `openclaw.internal.`) und veröffentlichen Sie `_openclaw-gw._tcp`-Einträge.
2. Konfigurieren Sie Tailscale Split DNS für Ihre gewählte Domain, das auf diesen DNS-Server zeigt.

Details und Beispiel für eine CoreDNS-Konfiguration: [Bonjour](/de/gateway/bonjour).

### 3) Von Android aus verbinden

In der Android-App:

- Die App hält ihre Gateway-Verbindung über einen **Foreground Service** aufrecht (persistente Benachrichtigung).
- Öffnen Sie den Tab **Connect**.
- Verwenden Sie den Modus **Setup Code** oder **Manual**.
- Wenn Discovery blockiert ist, verwenden Sie im Bereich **Advanced controls** den manuellen Host/Port. Für private LAN-Hosts funktioniert `ws://` weiterhin. Für Tailscale-/öffentliche Hosts aktivieren Sie TLS und verwenden Sie einen `wss://`- / Tailscale-Serve-Endpunkt.

Nach der ersten erfolgreichen Kopplung verbindet sich Android beim Start automatisch erneut:

- manueller Endpunkt (falls aktiviert), andernfalls
- das zuletzt entdeckte Gateway (best effort).

### 4) Kopplung genehmigen (CLI)

Auf dem Gateway-Rechner:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details zur Kopplung: [Pairing](/de/channels/pairing).

Optional: Wenn sich die Android-Node immer aus einem eng kontrollierten Subnetz verbindet,
können Sie die automatische erstmalige Node-Genehmigung mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frische Kopplung mit `role: node` ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin manuelle Genehmigung.

### 5) Verifizieren, dass die Node verbunden ist

- Über den Node-Status:

  ```bash
  openclaw nodes status
  ```

- Über Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + Verlauf

Der Android-Tab „Chat“ unterstützt Sitzungswahl (standardmäßig `main`, plus andere vorhandene Sitzungen):

- Verlauf: `chat.history` (anzeige-normalisiert; Inline-Direktiv-Tags werden
  aus dem sichtbaren Text entfernt, Klartext-XML-Payloads von Tool-Aufrufen (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` sowie
  abgeschnittener Tool-Call-Blöcke) und durchgesickerte ASCII-/Full-Width-Modell-Steuertokens
  werden entfernt, reine Assistant-Zeilen mit stillen Tokens wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden)
- Senden: `chat.send`
- Push-Updates (best effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + Kamera

#### Gateway Canvas Host (empfohlen für Webinhalte)

Wenn die Node echtes HTML/CSS/JS anzeigen soll, das der Agent auf dem Datenträger bearbeiten kann, richten Sie die Node auf den Gateway-Canvas-Host aus.

Hinweis: Nodes laden Canvas vom Gateway-HTTP-Server (derselbe Port wie `gateway.port`, standardmäßig `18789`).

1. Erstellen Sie `~/.openclaw/workspace/canvas/index.html` auf dem Gateway-Host.

2. Navigieren Sie die Node dorthin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optional): Wenn beide Geräte in Tailscale sind, verwenden Sie einen MagicDNS-Namen oder eine Tailnet-IP statt `.local`, z. B. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Dieser Server injiziert einen Live-Reload-Client in HTML und lädt bei Dateiänderungen neu.
Der A2UI-Host befindet sich unter `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-Befehle (nur im Vordergrund):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (verwenden Sie `{"url":""}` oder `{"url":"/"}`, um zum Standard-Scaffold zurückzukehren). `canvas.snapshot` gibt `{ format, base64 }` zurück (Standard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (Legacy-Alias `canvas.a2ui.pushJSONL`)

Kamera-Befehle (nur im Vordergrund; durch Berechtigungen geschützt):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Siehe [Camera node](/de/nodes/camera) für Parameter und CLI-Helfer.

### 8) Voice + erweiterte Android-Befehlsoberfläche

- Voice: Android verwendet im Tab „Voice“ einen einzelnen Mikrofon-Ein/Aus-Ablauf mit Transkripterfassung und `talk.speak`-Wiedergabe. Lokales System-TTS wird nur verwendet, wenn `talk.speak` nicht verfügbar ist. Voice stoppt, wenn die App den Vordergrund verlässt.
- Umschalter für Voice wake/Talk-Modus sind derzeit aus UX und Laufzeit von Android entfernt.
- Zusätzliche Android-Befehlsfamilien (Verfügbarkeit hängt vom Gerät + Berechtigungen ab):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (siehe [Benachrichtigungsweiterleitung](#benachrichtigungsweiterleitung) unten)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant-Einstiegspunkte

Android unterstützt das Starten von OpenClaw über den System-Assistant-Trigger (Google
Assistant). Wenn dies konfiguriert ist, öffnet das Gedrückthalten der Home-Taste oder „Hey Google, frag
OpenClaw ...“ die App und übergibt den Prompt an den Chat-Composer.

Dies verwendet Android-Metadaten für **App Actions**, die im App-Manifest deklariert sind. Auf
Gateway-Seite ist keine zusätzliche Konfiguration erforderlich — der Assistant-Intent wird vollständig von der Android-App verarbeitet und als normale Chat-Nachricht weitergeleitet.

<Note>
Die Verfügbarkeit von App Actions hängt vom Gerät, der Version der Google Play Services
und davon ab, ob der Benutzer OpenClaw als Standard-Assistant-App gesetzt hat.
</Note>

## Benachrichtigungsweiterleitung

Android kann Gerätebenachrichtigungen als Ereignisse an das Gateway weiterleiten. Mehrere Steuerelemente erlauben es Ihnen, festzulegen, welche Benachrichtigungen weitergeleitet werden und wann.

| Schlüssel                         | Typ            | Beschreibung                                                                                  |
| --------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`     | string[]       | Leitet nur Benachrichtigungen dieser Paketnamen weiter. Wenn gesetzt, werden alle anderen ignoriert. |
| `notifications.denyPackages`      | string[]       | Leitet Benachrichtigungen dieser Paketnamen niemals weiter. Wird nach `allowPackages` angewendet. |
| `notifications.quietHours.start`  | string (HH:mm) | Beginn des Ruhezeitenfensters (lokale Gerätezeit). Benachrichtigungen werden in diesem Fenster unterdrückt. |
| `notifications.quietHours.end`    | string (HH:mm) | Ende des Ruhezeitenfensters.                                                                  |
| `notifications.rateLimit`         | number         | Maximal weitergeleitete Benachrichtigungen pro Paket pro Minute. Überschüssige Benachrichtigungen werden verworfen. |

Die Benachrichtigungsauswahl verwendet auch sichereres Verhalten für weitergeleitete Benachrichtigungsereignisse und verhindert versehentliches Weiterleiten sensibler Systembenachrichtigungen.

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

- [iOS app](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Android node troubleshooting](/de/nodes/troubleshooting)
