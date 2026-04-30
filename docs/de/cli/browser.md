---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für gängige Aufgaben
    - Sie möchten einen Browser steuern, der über einen Node-Host auf einem anderen Rechner läuft
    - Sie möchten sich über Chrome MCP mit Ihrem lokal angemeldeten Chrome verbinden
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Zustand und Debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-30T06:44:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Verwalten Sie die Browser-Steuerungsoberfläche von OpenClaw und führen Sie Browser-Aktionen aus (Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingabe, Zustandsemulation und Debugging).

Verwandt:

- Browser-Tool + API: [Browser-Tool](/de/tools/browser)

## Häufige Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Anforderungs-Timeout (ms).
- `--expect-final`: auf eine finale Gateway-Antwort warten.
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

Wenn `start` mit `not reachable after start` fehlschlägt, prüfen Sie zuerst die CDP-Bereitschaft. Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene intakt und der Fehler liegt üblicherweise an der Navigations-SSRF-Richtlinie.

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
- Für `attachOnly`- und Remote-CDP-Profile schließt `openclaw browser stop` die aktive Steuerungssitzung und löscht temporäre Emulationsüberschreibungen, selbst wenn OpenClaw den Browser-Prozess nicht selbst gestartet hat.
- Bei lokal verwalteten Profilen stoppt `openclaw browser stop` den gestarteten Browser-Prozess.
- `openclaw browser start --headless` gilt nur für diese Startanforderung und nur, wenn OpenClaw einen lokal verwalteten Browser startet. Es schreibt `browser.headless` oder die Profilkonfiguration nicht um und hat bei einem bereits laufenden Browser keine Wirkung.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` laufen lokal verwaltete Profile automatisch im Headless-Modus, es sei denn, `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` oder `browser.profiles.<name>.headless=false` fordert ausdrücklich einen sichtbaren Browser an.

## Wenn der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in `~/.openclaw/openclaw.json`.

Wenn `plugins.allow` vorhanden ist, führen Sie das gebündelte Browser-Plugin explizit auf, es sei denn, die Konfiguration hat bereits einen Root-`browser`-Block:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter Root-`browser`-Block, zum Beispiel `browser.enabled=true` oder `browser.profiles.<name>`, aktiviert das gebündelte Browser-Plugin ebenfalls unter einer restriktiven Plugin-Allowlist.

Verwandt: [Browser-Tool](/de/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Browser-Routing-Konfigurationen. In der Praxis:

- `openclaw`: startet eine dedizierte von OpenClaw verwaltete Chrome-Instanz (isoliertes Benutzerdatenverzeichnis) oder hängt sich daran an.
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

`tabs` gibt zuerst `suggestedTargetId` zurück, dann die stabile `tabId` wie `t1`, das optionale Label und die rohe `targetId`. Agenten sollten `suggestedTargetId` an `focus`, `close`, Snapshots und Aktionen zurückgeben. Sie können ein Label mit `open --label`, `tab new --label` oder `tab label` zuweisen; Labels, Tab-IDs, rohe Ziel-IDs und eindeutige Ziel-ID-Präfixe werden alle akzeptiert. Wenn Chromium das zugrunde liegende rohe Ziel während einer Navigation oder Formularübermittlung ersetzt, behält OpenClaw die stabile `tabId` bzw. das Label am Ersatztab, wenn die Zuordnung nachgewiesen werden kann. Rohe Ziel-IDs bleiben flüchtig; bevorzugen Sie `suggestedTargetId`.

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

- `--full-page` ist nur für Seitenerfassungen gedacht; es kann nicht mit `--ref` oder `--element` kombiniert werden.
- `existing-session`-/`user`-Profile unterstützen Seiten-Screenshots und `--ref`-Screenshots aus Snapshot-Ausgaben, aber keine CSS-`--element`-Screenshots.
- `--labels` blendet aktuelle Snapshot-Refs über dem Screenshot ein.
- `snapshot --urls` hängt erkannte Linkziele an KI-Snapshots an, damit Agenten direkte Navigationsziele auswählen können, statt nur anhand des Linktexts zu raten.

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

Aktionsantworten geben die aktuelle rohe `targetId` nach einem durch eine Aktion ausgelösten Seitenersatz zurück, wenn OpenClaw den Ersatztab nachweisen kann. Skripte sollten für langlebige Workflows weiterhin `suggestedTargetId`/Labels speichern und übergeben.

Datei- und Dialog-Helfer:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Verwaltete Chrome-Profile speichern gewöhnliche per Klick ausgelöste Downloads im OpenClaw-Download-Verzeichnis (`/tmp/openclaw/downloads` standardmäßig oder im konfigurierten temporären Root). Verwenden Sie `waitfordownload` oder `download`, wenn der Agent auf eine bestimmte Datei warten und deren Pfad zurückgeben muss; diese expliziten Wartefunktionen besitzen den nächsten Download.

## Zustand und Speicher

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

Dieser Pfad ist nur für den Host vorgesehen. Für Docker, Headless-Server, Browserless oder andere Remote-Setups verwenden Sie stattdessen ein CDP-Profil.

Aktuelle Einschränkungen von existing-session:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren
- `browser.actionTimeoutMs` setzt unterstützte `act`-Anforderungen standardmäßig auf 60000 ms, wenn Aufrufer `timeoutMs` weglassen; `timeoutMs` pro Aufruf hat weiterhin Vorrang.
- `click` ist nur Linksklick
- `type` unterstützt `slowly=true` nicht
- `press` unterstützt `delayMs` nicht
- `hover`, `scrollintoview`, `drag`, `select`, `fill` und `evaluate` lehnen Timeout-Überschreibungen pro Aufruf ab
- `select` unterstützt nur einen Wert
- `wait --load networkidle` wird nicht unterstützt
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS-`--element` und unterstützen derzeit jeweils nur eine Datei
- Dialog-Hooks unterstützen `--timeout` nicht
- Screenshots unterstützen Seitenerfassungen und `--ref`, aber kein CSS-`--element`
- `responsebody`, Download-Abfangung, PDF-Export und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

## Remote-Browser-Steuerung (Node-Host-Proxy)

Wenn der Gateway auf einer anderen Maschine läuft als der Browser, führen Sie einen **Node-Host** auf der Maschine aus, die Chrome/Brave/Edge/Chromium hat. Der Gateway leitet Browser-Aktionen an diesen Node weiter (kein separater Browser-Steuerungsserver erforderlich).

Verwenden Sie `gateway.nodes.browser.mode`, um das automatische Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, wenn mehrere verbunden sind.

Sicherheit + Remote-Einrichtung: [Browser-Tool](/de/tools/browser), [Remote-Zugriff](/de/gateway/remote), [Tailscale](/de/gateway/tailscale), [Sicherheit](/de/gateway/security)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Browser](/de/tools/browser)
