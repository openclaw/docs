---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für häufige Aufgaben
    - Sie möchten einen Browser steuern, der auf einem anderen Rechner über einen Node-Host läuft
    - Sie möchten sich über Chrome MCP mit Ihrem lokal angemeldeten Chrome verbinden
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Status und Debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:25:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Verwalten Sie die Browser-Steuerungsoberfläche von OpenClaw und führen Sie Browser-Aktionen aus (Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingabe, Status-Emulation und Debugging).

Verwandt:

- Browser-Tool + API: [Browser-Tool](/de/tools/browser)

## Häufige Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Anfrage-Timeout (ms).
- `--expect-final`: Auf eine endgültige Gateway-Antwort warten.
- `--browser-profile <name>`: Ein Browser-Profil auswählen (Standard aus der Konfiguration).
- `--json`: Maschinenlesbare Ausgabe (wo unterstützt).

## Schnellstart (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenten können dieselbe Bereitschaftsprüfung mit `browser({ action: "doctor" })` ausführen.

## Schnelle Fehlerbehebung

Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft. Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene funktionsfähig, und der Fehler liegt gewöhnlich an der SSRF-Richtlinie für Navigation.

Minimale Sequenz:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Ausführliche Anleitung: [Browser-Fehlerbehebung](/de/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lebenszyklus

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Hinweise:

- `doctor --deep` fügt eine Live-Snapshot-Prüfung hinzu. Das ist nützlich, wenn die grundlegende CDP-Bereitschaft grün ist, Sie aber einen Nachweis möchten, dass der aktuelle Tab inspiziert werden kann.
- Für `attachOnly`- und Remote-CDP-Profile schließt `openclaw browser stop` die aktive Steuerungssitzung und entfernt temporäre Emulations-Overrides, auch wenn OpenClaw den Browser-Prozess nicht selbst gestartet hat.
- Für lokal verwaltete Profile beendet `openclaw browser stop` den gestarteten Browser-Prozess.
- `openclaw browser start --headless` gilt nur für diese Startanfrage und nur dann, wenn OpenClaw einen lokal verwalteten Browser startet. Es überschreibt weder `browser.headless` noch die Profilkonfiguration und hat bei einem bereits laufenden Browser keine Wirkung.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` laufen lokal verwaltete Profile automatisch headless, sofern nicht `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` oder `browser.profiles.<name>.headless=false` ausdrücklich einen sichtbaren Browser anfordert.

## Wenn der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in
`~/.openclaw/openclaw.json`.

Wenn `plugins.allow` vorhanden ist, muss das gebündelte Browser-Plugin ausdrücklich aufgeführt sein:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` stellt den CLI-Unterbefehl nicht wieder her, wenn die Plugin-Allowlist `browser` ausschließt.

Verwandt: [Browser-Tool](/de/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Routing-Konfigurationen für Browser. In der Praxis:

- `openclaw`: startet oder verbindet sich mit einer dedizierten, von OpenClaw verwalteten Chrome-Instanz (isoliertes User-Data-Verzeichnis).
- `user`: steuert Ihre bestehende angemeldete Chrome-Sitzung über Chrome DevTools MCP.
- Benutzerdefinierte CDP-Profile: verweisen auf einen lokalen oder entfernten CDP-Endpunkt.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Ein bestimmtes Profil verwenden:

```bash
openclaw browser --browser-profile work tabs
```

## Tabs

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` gibt zuerst `suggestedTargetId` zurück, dann die stabile `tabId` wie `t1`,
das optionale Label und die rohe `targetId`. Agenten sollten
`suggestedTargetId` an `focus`, `close`, Snapshots und Aktionen zurückgeben. Sie können
ein Label mit `open --label`, `tab new --label` oder `tab label` zuweisen; Labels,
Tab-IDs, rohe Target-IDs und eindeutige Präfixe von Target-IDs werden alle akzeptiert.
Wenn Chromium während einer Navigation oder eines Formular-Submit das zugrunde liegende rohe Target ersetzt,
behält OpenClaw die stabile `tabId`/das Label am Ersatz-Tab bei, wenn die Übereinstimmung nachgewiesen werden kann. Rohe Target-IDs bleiben flüchtig; bevorzugen Sie
`suggestedTargetId`.

## Snapshot / Screenshot / Aktionen

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Hinweise:

- `--full-page` ist nur für Seitenerfassungen gedacht; es kann nicht mit `--ref`
  oder `--element` kombiniert werden.
- Profile vom Typ `existing-session` / `user` unterstützen Seiten-Screenshots und `--ref`-Screenshots aus der Snapshot-Ausgabe, aber keine CSS-`--element`-Screenshots.
- `--labels` legt die aktuellen Snapshot-Refs über den Screenshot.
- `snapshot --urls` hängt entdeckte Link-Ziele an KI-Snapshots an, damit Agenten direkte Navigationsziele auswählen können, statt nur anhand des Linktexts zu raten.

Navigieren/Klicken/Tippen (ref-basierte UI-Automatisierung):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Aktionsantworten geben nach aktionsausgelöstem Seitenersatz die aktuelle rohe `targetId` zurück,
wenn OpenClaw den Ersatz-Tab nachweisen kann. Skripte sollten für langlebige Workflows trotzdem
`suggestedTargetId`/Labels speichern und weitergeben.

Datei- und Dialog-Helfer:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Verwaltete Chrome-Profile speichern gewöhnliche, durch Klick ausgelöste Downloads im OpenClaw-Downloadverzeichnis
(`/tmp/openclaw/downloads` standardmäßig oder im konfigurierten temporären Wurzelverzeichnis).
Verwenden Sie `waitfordownload` oder `download`, wenn der Agent auf eine bestimmte Datei warten und ihren Pfad zurückgeben muss; diese expliziten Waiter übernehmen den nächsten Download.

## Status und Speicher

Viewport + Emulation:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + Speicher:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugging

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Bestehendes Chrome über MCP

Verwenden Sie das integrierte Profil `user`, oder erstellen Sie Ihr eigenes Profil vom Typ `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Dieser Pfad ist nur für den Host gedacht. Für Docker, headless Server, Browserless oder andere Remote-Setups verwenden Sie stattdessen ein CDP-Profil.

Aktuelle Einschränkungen von `existing-session`:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren
- `browser.actionTimeoutMs` setzt bei unterstützten `act`-Anfragen ohne angegebenes `timeoutMs` standardmäßig 60000 ms; `timeoutMs` pro Aufruf hat weiterhin Vorrang.
- `click` ist nur Linksklick
- `type` unterstützt `slowly=true` nicht
- `press` unterstützt `delayMs` nicht
- `hover`, `scrollintoview`, `drag`, `select`, `fill` und `evaluate` lehnen Timeout-Overrides pro Aufruf ab
- `select` unterstützt nur einen Wert
- `wait --load networkidle` wird nicht unterstützt
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS-
  `--element` und unterstützen derzeit jeweils nur eine Datei
- Dialog-Hooks unterstützen `--timeout` nicht
- Screenshots unterstützen Seitenerfassungen und `--ref`, aber kein CSS-`--element`
- `responsebody`, Download-Abfangung, PDF-Export und Batch-Aktionen erfordern weiterhin
  einen verwalteten Browser oder ein rohes CDP-Profil

## Remote-Browsersteuerung (Node-Host-Proxy)

Wenn das Gateway auf einem anderen Rechner als der Browser läuft, führen Sie einen **Node-Host** auf dem Rechner aus, auf dem Chrome/Brave/Edge/Chromium vorhanden ist. Das Gateway leitet Browser-Aktionen an diesen Node weiter (kein separater Server für Browsersteuerung erforderlich).

Verwenden Sie `gateway.nodes.browser.mode`, um das automatische Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, wenn mehrere verbunden sind.

Sicherheit + Remote-Setup: [Browser-Tool](/de/tools/browser), [Remote-Zugriff](/de/gateway/remote), [Tailscale](/de/gateway/tailscale), [Sicherheit](/de/gateway/security)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Browser](/de/tools/browser)
