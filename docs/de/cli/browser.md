---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für häufige Aufgaben
    - Sie möchten einen Browser steuern, der auf einem anderen Rechner über einen Node-Host läuft
    - Sie möchten über Chrome MCP eine Verbindung zu Ihrem lokal angemeldeten Chrome herstellen
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Zustand und Debugging)
title: Browser
x-i18n:
    generated_at: "2026-06-27T17:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Verwalten Sie die Browser-Kontrollfläche von OpenClaw und führen Sie Browser-Aktionen aus (Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingabe, Zustandsemulation und Debugging).

Verwandt:

- Browser-Tool + API: [Browser-Tool](/de/tools/browser)

## Allgemeine Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (Standardwert aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Anfrage-Timeout (ms).
- `--expect-final`: auf eine finale Gateway-Antwort warten.
- `--browser-profile <name>`: ein Browser-Profil auswählen (Standardwert aus der Konfiguration).
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

Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft. Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Kontrollebene funktionsfähig, und der Fehler liegt normalerweise an der Navigations-SSRF-Richtlinie.

Minimale Abfolge:

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
- Für `attachOnly`- und Remote-CDP-Profile schließt `openclaw browser stop` die aktive Kontrollsitzung und löscht temporäre Emulationsüberschreibungen, auch wenn OpenClaw den Browser-Prozess nicht selbst gestartet hat.
- Für lokal verwaltete Profile stoppt `openclaw browser stop` den erzeugten Browser-Prozess.
- `openclaw browser start --headless` gilt nur für diese Startanfrage und nur, wenn OpenClaw einen lokal verwalteten Browser startet. Es schreibt weder `browser.headless` noch die Profilkonfiguration um und hat bei einem bereits laufenden Browser keine Wirkung.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` werden lokal verwaltete Profile automatisch headless ausgeführt, sofern nicht `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` oder `browser.profiles.<name>.headless=false` ausdrücklich einen sichtbaren Browser anfordert.

## Wenn der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in `~/.openclaw/openclaw.json`.

Wenn `plugins.allow` vorhanden ist, listen Sie das gebündelte Browser-Plugin ausdrücklich auf, sofern die Konfiguration nicht bereits einen `browser`-Block auf Root-Ebene enthält:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein ausdrücklicher `browser`-Block auf Root-Ebene, zum Beispiel `browser.enabled=true` oder `browser.profiles.<name>`, aktiviert das gebündelte Browser-Plugin ebenfalls unter einer restriktiven Plugin-Zulassungsliste.

Verwandt: [Browser-Tool](/de/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Routing-Konfigurationen für Browser. In der Praxis:

- `openclaw`: startet eine dedizierte, von OpenClaw verwaltete Chrome-Instanz oder verbindet sich damit (isoliertes Benutzerdatenverzeichnis).
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

`tabs` gibt zuerst `suggestedTargetId` zurück, dann die stabile `tabId` wie `t1`, das optionale Label und die rohe `targetId`. Agenten sollten `suggestedTargetId` wieder an `focus`, `close`, Snapshots und Aktionen übergeben. Sie können ein Label mit `open --label`, `tab new --label` oder `tab label` zuweisen; Labels, Tab-IDs, rohe Target-IDs und eindeutige Target-ID-Präfixe werden alle akzeptiert. Das Anfragefeld heißt aus Kompatibilitätsgründen weiterhin `targetId`, akzeptiert aber diese Tab-Referenzen. Behandeln Sie rohe Target-IDs als Diagnose-Handles, nicht als dauerhafte Agentenspeicher.
Wenn Chromium das zugrunde liegende rohe Target während einer Navigation oder Formularübermittlung ersetzt, hält OpenClaw die stabile `tabId`/das Label am Ersatz-Tab fest, wenn es die Übereinstimmung nachweisen kann. Rohe Target-IDs bleiben flüchtig; bevorzugen Sie `suggestedTargetId`.

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

- `--full-page` ist nur für Seitenerfassungen vorgesehen; es kann nicht mit `--ref` oder `--element` kombiniert werden.
- `existing-session`- / `user`-Profile unterstützen Seiten-Screenshots und `--ref`-Screenshots aus der Snapshot-Ausgabe, aber keine CSS-`--element`-Screenshots.
- `--labels` blendet aktuelle Snapshot-Refs auf dem Screenshot ein. Bei Playwright-gestützten Profilen funktioniert es mit `--full-page` (Label-Overlay für vollständige Seiten), `--ref` (Label-Overlay für Elementausschnitt nach ARIA-Ref) und `--element` (Label-Overlay für Elementausschnitt nach CSS-Selektor); in Elementausschnitt-Modi werden Labels relativ zum Element projiziert. Die Antwort enthält außerdem ein `annotations`-Array mit der Begrenzungsbox jeder Ref. Jedes Element hat `ref`, `number`, `role`, optional `name` und `box: {x, y, width, height}`; Koordinaten befinden sich im Raum des erfassten Bildes (Viewport / vollständige Seite / elementrelativ). Das Feld wird ausgelassen, wenn es leer ist.
  `existing-session`-Profile rendern ein chrome-mcp-Overlay auf Seiten-Screenshots, verwenden aber nicht den Playwright-Projektionshelfer und enthalten keine `annotations`; CSS-`--element`-Screenshots werden dort nicht unterstützt. Ohne Playwright oder chrome-mcp sind beschriftete Screenshots nicht verfügbar. Frühere Releases haben `--full-page`, `--ref` und `--element` bei beschrifteten Playwright-Screenshots ignoriert und immer eine Viewport-Erfassung zurückgegeben; beschriftete Screenshots berücksichtigen diese Bereiche jetzt.
- `snapshot --urls` hängt entdeckte Linkziele an KI-Snapshots an, sodass Agenten direkte Navigationsziele auswählen können, statt nur aus dem Linktext zu raten.

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` akzeptiert eine Funktionsquelle, einen Ausdruck oder einen Anweisungskörper. Anweisungskörper werden als Async-Funktionen umschlossen; verwenden Sie daher `return` für den Wert, den Sie zurückhaben möchten. Verwenden Sie `evaluate --timeout-ms <ms>`, wenn die seitenseitige Funktion länger als den standardmäßigen Evaluate-Timeout benötigen kann.

Aktionsantworten geben die aktuelle rohe `targetId` nach einer durch eine Aktion ausgelösten Seitenersetzung zurück, wenn OpenClaw den Ersatz-Tab nachweisen kann. Skripte sollten für langlebige Workflows weiterhin `suggestedTargetId`/Labels speichern und übergeben.

Datei- und Dialoghelfer:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Verwaltete Chrome-Profile speichern gewöhnliche, durch Klicks ausgelöste Downloads im OpenClaw-Downloadverzeichnis (`/tmp/openclaw/downloads` standardmäßig oder im konfigurierten temporären Root). Verwenden Sie `waitfordownload` oder `download`, wenn der Agent auf eine bestimmte Datei warten und ihren Pfad zurückgeben muss; diese expliziten Wartemechanismen besitzen den nächsten Download.
Uploads akzeptieren Dateien aus dem temporären Upload-Root von OpenClaw und von OpenClaw verwaltete eingehende Medien, einschließlich `media://inbound/<id>`- und sandboxrelativer `media/inbound/<id>`-Referenzen. Verschachtelte Medien-Refs, Pfadtraversierung und beliebige lokale Pfade bleiben abgelehnt.
Wenn eine Aktion einen modalen Dialog öffnet, gibt die Aktionsantwort `blockedByDialog` mit `browserState.dialogs.pending` zurück; übergeben Sie `--dialog-id`, um direkt darauf zu antworten. Außerhalb von OpenClaw behandelte Dialoge erscheinen unter `browserState.dialogs.recent`.

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Der standardmäßige existing-session-Pfad ist eine host-only automatische Chrome-MCP-Verbindung. Wenn der Browser bereits mit einem DevTools-Endpunkt ausgeführt wird, übergeben Sie `--cdp-url`, damit Chrome MCP stattdessen an diesen Endpunkt anschließt.
Verwenden Sie für Docker, Browserless oder andere Remote-Setups, bei denen Chrome-MCP-Semantik nicht erforderlich ist, ein CDP-Profil.

Aktuelle existing-session-Einschränkungen:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren
- `browser.actionTimeoutMs` setzt unterstützte `act`-Anfragen standardmäßig auf 60000 ms, wenn
  Aufrufer `timeoutMs` weglassen; `timeoutMs` pro Aufruf hat weiterhin Vorrang.
- `click` ist nur ein Linksklick
- `type` unterstützt `slowly=true` nicht
- `press` unterstützt `delayMs` nicht
- `hover`, `scrollintoview`, `drag`, `select`, `fill` und `evaluate` lehnen
  Timeout-Überschreibungen pro Aufruf ab
- `select` unterstützt nur einen Wert
- `wait --load networkidle` wird bei Profilen mit bestehender Sitzung nicht unterstützt (funktioniert mit verwalteten und Raw-/Remote-CDP-Profilen)
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS
  `--element` und unterstützen derzeit jeweils nur eine Datei
- Dialog-Hooks unterstützen `--timeout` nicht
- Screenshots unterstützen Seitenaufnahmen und `--ref`, aber kein CSS-`--element`
- `responsebody`, Download-Abfangen, PDF-Export und Batch-Aktionen erfordern weiterhin
  einen verwalteten Browser oder ein Raw-CDP-Profil

## Remote-Browser-Steuerung (Node-Host-Proxy)

Wenn der Gateway auf einem anderen Rechner als der Browser läuft, führen Sie einen **Node-Host** auf dem Rechner aus, auf dem Chrome/Brave/Edge/Chromium installiert ist. Der Gateway leitet Browser-Aktionen per Proxy an diesen Node weiter (kein separater Browser-Steuerungsserver erforderlich).

Verwenden Sie `gateway.nodes.browser.mode`, um das automatische Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, falls mehrere verbunden sind.

Sicherheit + Remote-Einrichtung: [Browser-Tool](/de/tools/browser), [Remote-Zugriff](/de/gateway/remote), [Tailscale](/de/gateway/tailscale), [Sicherheit](/de/gateway/security)

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Browser](/de/tools/browser)
