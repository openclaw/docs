---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für häufige Aufgaben.
    - Sie möchten einen Browser steuern, der auf einem anderen Rechner über einen Node-Host läuft.
    - Sie möchten sich über Chrome MCP mit Ihrem lokal angemeldeten Chrome verbinden.
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Status und Debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-25T13:43:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Die Browser-Steuerungsoberfläche von OpenClaw verwalten und Browser-Aktionen ausführen (Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingaben, Status-Emulation und Debugging).

Verwandt:

- Browser-Tool + API: [Browser tool](/de/tools/browser)

## Allgemeine Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Anfrage-Timeout (ms).
- `--expect-final`: auf eine abschließende Gateway-Antwort warten.
- `--browser-profile <name>`: ein Browser-Profil auswählen (Standard aus der Konfiguration).
- `--json`: maschinenlesbare Ausgabe (wo unterstützt).

## Schnellstart (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenten können dieselbe Bereitschaftsprüfung mit `browser({ action: "doctor" })` ausführen.

## Schnelle Fehlerbehebung

Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst Probleme mit der CDP-Bereitschaft. Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene in Ordnung und der Fehler liegt meist an der SSRF-Richtlinie für Navigation.

Minimale Sequenz:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Detaillierte Hinweise: [Browser troubleshooting](/de/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lebenszyklus

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Hinweise:

- Für `attachOnly`- und Remote-CDP-Profile schließt `openclaw browser stop` die aktive Steuerungssitzung und entfernt temporäre Emulationsüberschreibungen, auch wenn OpenClaw den Browser-Prozess nicht selbst gestartet hat.
- Für lokal verwaltete Profile beendet `openclaw browser stop` den gestarteten Browser-Prozess.
- `openclaw browser start --headless` gilt nur für diese Startanfrage und nur dann, wenn OpenClaw einen lokal verwalteten Browser startet. Es überschreibt weder `browser.headless` noch die Profilkonfiguration und hat bei einem bereits laufenden Browser keine Wirkung.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` laufen lokal verwaltete Profile automatisch headless, sofern nicht `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` oder `browser.profiles.<name>.headless=false` ausdrücklich einen sichtbaren Browser anfordert.

## Falls der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in `~/.openclaw/openclaw.json`.

Wenn `plugins.allow` vorhanden ist, muss das gebündelte Browser-Plugin ausdrücklich aufgeführt sein:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` stellt den CLI-Unterbefehl nicht wieder her, wenn die Plugin-Allowlist `browser` ausschließt.

Verwandt: [Browser tool](/de/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Browser-Routing-Konfigurationen. In der Praxis:

- `openclaw`: startet oder verbindet sich mit einer dedizierten, von OpenClaw verwalteten Chrome-Instanz (isoliertes User-Data-Verzeichnis).
- `user`: steuert Ihre bestehende angemeldete Chrome-Sitzung über Chrome DevTools MCP.
- benutzerdefinierte CDP-Profile: verweisen auf einen lokalen oder Remote-CDP-Endpunkt.

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

`tabs` gibt zuerst `suggestedTargetId`, dann die stabile `tabId` wie `t1`, das optionale Label und die rohe `targetId` zurück. Agenten sollten `suggestedTargetId` an `focus`, `close`, Snapshots und Aktionen zurückgeben. Sie können ein Label mit `open --label`, `tab new --label` oder `tab label` zuweisen; Labels, Tab-IDs, rohe Target-IDs und eindeutige Target-ID-Präfixe werden alle akzeptiert.

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

- `--full-page` ist nur für Seitenaufnahmen gedacht; es kann nicht mit `--ref` oder `--element` kombiniert werden.
- `existing-session`- / `user`-Profile unterstützen Seiten-Screenshots und `--ref`-Screenshots aus der Snapshot-Ausgabe, aber keine CSS-`--element`-Screenshots.
- `--labels` blendet aktuelle Snapshot-Refs im Screenshot ein.
- `snapshot --urls` hängt entdeckte Link-Ziele an AI-Snapshots an, damit Agenten direkte Navigationsziele wählen können, statt nur anhand des Link-Texts zu raten.

Navigieren/Klicken/Tippen (Ref-basierte UI-Automatisierung):

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

Hilfen für Dateien + Dialoge:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Verwaltete Chrome-Profile speichern normale, durch Klicken ausgelöste Downloads im OpenClaw-Download-Verzeichnis (`/tmp/openclaw/downloads` standardmäßig oder im konfigurierten Temp-Root). Verwenden Sie `waitfordownload` oder `download`, wenn der Agent auf eine bestimmte Datei warten und ihren Pfad zurückgeben soll; diese expliziten Waiter übernehmen den nächsten Download.

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

Verwenden Sie das integrierte `user`-Profil oder erstellen Sie Ihr eigenes `existing-session`-Profil:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Dieser Pfad ist nur für den Host. Für Docker, headless Server, Browserless oder andere Remote-Setups verwenden Sie stattdessen ein CDP-Profil.

Aktuelle Einschränkungen von existing-session:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren
- `browser.actionTimeoutMs` setzt für unterstützte `act`-Anfragen standardmäßig 60000 ms, wenn Aufrufer `timeoutMs` weglassen; `timeoutMs` pro Aufruf hat weiterhin Vorrang.
- `click` unterstützt nur Linksklick
- `type` unterstützt `slowly=true` nicht
- `press` unterstützt `delayMs` nicht
- `hover`, `scrollintoview`, `drag`, `select`, `fill` und `evaluate` lehnen Timeout-Überschreibungen pro Aufruf ab
- `select` unterstützt nur einen Wert
- `wait --load networkidle` wird nicht unterstützt
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS-`--element` und unterstützen derzeit jeweils nur eine Datei
- Dialog-Hooks unterstützen `--timeout` nicht
- Screenshots unterstützen Seitenaufnahmen und `--ref`, aber kein CSS-`--element`
- `responsebody`, Download-Abfangung, PDF-Export und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

## Remote-Browser-Steuerung (Node-Host-Proxy)

Wenn das Gateway auf einem anderen Rechner läuft als der Browser, führen Sie einen **Node-Host** auf dem Rechner aus, auf dem Chrome/Brave/Edge/Chromium vorhanden ist. Das Gateway leitet Browser-Aktionen an diesen Node weiter (kein separater Browser-Control-Server erforderlich).

Verwenden Sie `gateway.nodes.browser.mode`, um Auto-Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, wenn mehrere verbunden sind.

Sicherheit + Remote-Setup: [Browser tool](/de/tools/browser), [Remote access](/de/gateway/remote), [Tailscale](/de/gateway/tailscale), [Security](/de/gateway/security)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Browser](/de/tools/browser)
