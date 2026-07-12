---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für häufige Aufgaben
    - Sie möchten einen Browser, der auf einem anderen Computer ausgeführt wird, über einen Node-Host steuern
    - Sie möchten über Chrome MCP eine Verbindung mit Ihrem lokalen angemeldeten Chrome herstellen
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Zustand und Debugging)
title: Browser
x-i18n:
    generated_at: "2026-07-12T15:06:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Verwalten Sie die Browser-Steuerungsoberfläche von OpenClaw und führen Sie Browser-Aktionen aus: Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingaben, Zustandsemulation und Fehlerbehebung.

Verwandt: [Browser-Tool](/de/tools/browser)

## Allgemeine Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Zeitüberschreitung für Anfragen in ms (Standard: `30000`).
- `--expect-final`: Auf eine abschließende Gateway-Antwort warten.
- `--browser-profile <name>`: Ein Browserprofil auswählen (Standard: `openclaw` oder `browser.defaultProfile`).
- `--json`: Maschinenlesbare Ausgabe (sofern unterstützt). Dies ist eine Option auf Browserebene. Platzieren Sie sie daher für eine eindeutige Form vor dem Unterbefehl, beispielsweise
  `openclaw browser --json status`. Eine nachgestellte Platzierung wie
  `openclaw browser status --json` funktioniert ebenfalls, wenn der ausgewählte untergeordnete Befehl
  kein eigenes `--json` definiert.

## Schnellstart (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenten können dieselbe Bereitschaftsprüfung mit `browser({ action: "doctor" })` ausführen.

## Schnelle Fehlerbehebung

Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst Probleme mit der CDP-Bereitschaft. Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene funktionsfähig und der Fehler ist normalerweise auf eine Blockierung durch die SSRF-Navigationsrichtlinie zurückzuführen.

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

- `doctor --deep` fügt eine Live-Snapshot-Prüfung hinzu: nützlich, wenn die grundlegende CDP-Bereitschaft gegeben ist, Sie aber einen Nachweis benötigen, dass der aktuelle Tab untersucht werden kann.
- Für ein ausgeführtes, lokal verwaltetes Profil melden `status` und `doctor` zwischengespeicherte
  Grafikdiagnosen von Chrome: Hardware-/Softwareklassifizierung, Renderer,
  Backend, Gerät/Treiber, Details zu Funktionen und deaktivierten Zuständen sowie beschleunigte
  Videofunktionen. `openclaw browser --json status` gibt die vollständige strukturierte Nutzlast zurück.
  Eine passive Statusabfrage startet Chrome niemals nur zum Erfassen dieser Daten.
- `stop` schließt die aktive Steuerungssitzung und entfernt temporäre Emulationsüberschreibungen auch für `attachOnly`- und Remote-CDP-Profile, bei denen OpenClaw den Browserprozess nicht selbst gestartet hat. Bei lokal verwalteten Profilen beendet `stop` außerdem den gestarteten Browserprozess.
- `start --headless` gilt nur für diese Startanfrage und nur, wenn OpenClaw einen lokal verwalteten Browser startet. Es ändert weder `browser.headless` noch die Profilkonfiguration und hat bei einem bereits ausgeführten Browser keine Wirkung.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` werden lokal verwaltete Profile automatisch headless ausgeführt, sofern nicht `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` oder `browser.profiles.<name>.headless=false` ausdrücklich einen sichtbaren Browser anfordert.

## Wenn der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in `~/.openclaw/openclaw.json`. Wenn `plugins.allow` vorhanden ist, führen Sie das gebündelte Browser-Plugin ausdrücklich auf, sofern die Konfiguration nicht bereits einen `browser`-Block auf Stammebene enthält:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein ausdrücklicher `browser`-Block auf Stammebene (beispielsweise `browser.enabled=true` oder `browser.profiles.<name>`) aktiviert das gebündelte Browser-Plugin ebenfalls unter einer restriktiven Plugin-Zulassungsliste.

Verwandt: [Browser-Tool](/de/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Browser-Routing-Konfigurationen:

- `openclaw` (Standard): Startet eine dedizierte, von OpenClaw verwaltete Chrome-Instanz oder stellt eine Verbindung zu ihr her (isoliertes Benutzerdatenverzeichnis).
- `user`: Steuert Ihre vorhandene, angemeldete Chrome-Sitzung über Chrome DevTools MCP.
- Benutzerdefinierte CDP-Profile: Verweisen auf einen lokalen oder entfernten CDP-Endpunkt.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Verwenden Sie ein bestimmtes Profil mit `--browser-profile <name>` bei jedem Unterbefehl, beispielsweise `openclaw browser --browser-profile work tabs`.

Unter macOS führt `system-profiles` echte Chrome-, Brave-, Edge- oder Chromium-Profile auf, die auf dem Host verfügbar sind. `import-profile` entschlüsselt deren Cookies nach einer einmaligen Zustimmungsaufforderung über macOS Keychain/Touch ID und fügt sie in ein neues, von OpenClaw verwaltetes Profil ein. Es werden nur Cookies importiert; lokaler Speicher und IndexedDB bleiben unverändert. Einige Google-Sitzungen verwenden gerätegebundene Sitzungsanmeldedaten (DBSC) und können nach dem Import weiterhin eine erneute Authentifizierung erfordern.

Wenn die macOS-App ein lokales Gateway verwendet, kann sie diesen Import einmal anbieten und das isolierte importierte Profil zum Standard für das Browsen durch Agenten machen. Der Import erfordert immer einen ausdrücklichen Klick; ein erfolgreicher Import oder das Schließen der Aufforderung unterdrückt spätere automatische Aufforderungen, und **Settings → General → Browser login** bleibt für einen erneuten Import verfügbar.

Der Import von Systemprofilen ist standardmäßig aktiviert. Legen Sie `browser.allowSystemProfileImport=false` fest, um sowohl CLI- als auch von Agenten ausgelöste Importe zu deaktivieren. Der Import erfolgt lokal auf dem Host und kann nicht über den Browser-Node-Proxy ausgeführt werden.

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

`tabs` gibt zuerst `suggestedTargetId`, dann die stabile `tabId` (beispielsweise `t1`), die optionale Bezeichnung und die unverarbeitete `targetId` zurück. Übergeben Sie `suggestedTargetId` wieder an `focus`, `close`, Snapshots und Aktionen. Weisen Sie mit `open --label`, `tab new --label` oder `tab label` eine Bezeichnung zu; Bezeichnungen, Tab-IDs, unverarbeitete Ziel-IDs und eindeutige Ziel-ID-Präfixe werden gleichermaßen akzeptiert. Das Anfragefeld heißt aus Kompatibilitätsgründen weiterhin `targetId`, akzeptiert jedoch jede dieser Tab-Referenzen.

Unverarbeitete Ziel-IDs sind flüchtige Diagnosekennungen und kein dauerhafter Agentenspeicher: Wenn Chromium das zugrunde liegende unverarbeitete Ziel während einer Navigation oder Formularübermittlung ersetzt, behält OpenClaw die stabile `tabId`/Bezeichnung am Ersatztab bei, sofern die Übereinstimmung eindeutig nachgewiesen werden kann. Bevorzugen Sie `suggestedTargetId`.

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

- `--full-page` ist nur für Seitenaufnahmen vorgesehen; es kann nicht mit `--ref` oder `--element` kombiniert werden.
- `existing-session`- / `user`-Profile unterstützen Seiten-Screenshots und `--ref`-Screenshots aus der Snapshot-Ausgabe, jedoch keine CSS-`--element`-Screenshots.
- `--labels` legt die aktuellen Snapshot-Referenzen über den Screenshot. Bei Playwright-basierten Profilen funktioniert es mit `--full-page` (Ganzseiten-Overlay), `--ref` (auf das Element zugeschnittenes Overlay anhand der ARIA-Referenz) und `--element` (auf das Element zugeschnittenes Overlay anhand des CSS-Selektors); in Modi mit Elementzuschnitt werden Bezeichnungen relativ zum Element projiziert. Die Antwort enthält außerdem ein `annotations`-Array (entfällt, wenn es leer ist) mit dem Begrenzungsrahmen jeder Referenz: `ref`, `number`, `role`, optional `name` und `box: {x, y, width, height}` im Koordinatenraum des aufgenommenen Bildes (Viewport / Ganzseite / relativ zum Element).
  `existing-session`-Profile rendern bei Seiten-Screenshots ein chrome-mcp-Overlay, verwenden jedoch nicht die Playwright-Projektionshilfe und enthalten keine `annotations`; CSS-`--element`-Screenshots werden dort nicht unterstützt. Ohne Playwright oder chrome-mcp sind Screenshots mit Bezeichnungen nicht verfügbar.
- `snapshot --urls` hängt gefundene Linkziele an KI-Snapshots an, sodass Agenten direkte Navigationsziele auswählen können, statt allein anhand des Linktexts zu raten.

Navigieren/Klicken/Eingeben (referenzbasierte UI-Automatisierung):

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

`evaluate --fn` akzeptiert den Quelltext einer Funktion, einen Ausdruck oder einen Anweisungsblock. Anweisungsblöcke werden als asynchrone Funktionen gekapselt; verwenden Sie daher `return` für den gewünschten Rückgabewert. Verwenden Sie `--timeout-ms`, wenn die seitenseitige Funktion möglicherweise länger als die standardmäßige Zeitüberschreitung für die Auswertung benötigt. `browser.evaluateEnabled=false` (Standard: `true`) deaktiviert sowohl `evaluate` als auch `wait --fn`.

Aktionsantworten geben nach einem durch die Aktion ausgelösten Seitenaustausch die aktuelle unverarbeitete `targetId` zurück, sofern OpenClaw den Ersatztab eindeutig nachweisen kann. Skripte sollten für langlebige Workflows dennoch `suggestedTargetId`/Bezeichnungen speichern und übergeben.

Hilfsfunktionen für Dateien und Dialoge:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Verwaltete Chrome-Profile speichern gewöhnliche, durch Klicks ausgelöste Downloads im OpenClaw-Downloadverzeichnis (standardmäßig `/tmp/openclaw/downloads` oder im konfigurierten temporären Stammverzeichnis). Verwenden Sie `waitfordownload` oder `download`, wenn der Agent auf eine bestimmte Datei warten und deren Pfad zurückgeben muss; diese expliziten Wartevorgänge übernehmen den nächsten Download. Uploads akzeptieren Dateien aus dem temporären Upload-Stammverzeichnis von OpenClaw und von OpenClaw verwaltete eingehende Medien, einschließlich Referenzen vom Typ `media://inbound/<id>` und sandboxrelativer Referenzen vom Typ `media/inbound/<id>`. Verschachtelte Medienreferenzen, Verzeichnisdurchquerung und beliebige lokale Pfade werden abgelehnt.

Wenn eine Aktion einen modalen Dialog öffnet, gibt die Aktionsantwort `blockedByDialog` mit `browserState.dialogs.pending` zurück; übergeben Sie `--dialog-id`, um direkt darauf zu antworten. Außerhalb von OpenClaw behandelte Dialoge werden unter `browserState.dialogs.recent` angezeigt.

## Zustand und Speicher

Viewport und Emulation:

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

Cookies und Speicher:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Fehlerbehebung

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

## Vorhandenes Chrome über MCP

Verwenden Sie das integrierte Profil `user`, oder erstellen Sie Ihr eigenes Profil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Der standardmäßige existing-session-Pfad verwendet ausschließlich auf dem Host die automatische Chrome-MCP-Verbindung. Wenn der Browser bereits mit einem DevTools-Endpunkt ausgeführt wird, übergeben Sie `--cdp-url`, damit Chrome MCP stattdessen eine Verbindung zu diesem Endpunkt herstellt. Verwenden Sie für Docker, Browserless oder andere Remote-Konfigurationen, bei denen die Chrome-MCP-Semantik nicht benötigt wird, stattdessen ein CDP-Profil.

Aktuelle Einschränkungen von existing-session:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren.
- `browser.actionTimeoutMs` setzt unterstützte `act`-Anfragen standardmäßig auf 60000 ms, wenn Aufrufer `timeoutMs` weglassen; ein pro Aufruf festgelegtes `timeoutMs` hat weiterhin Vorrang.
- `click` unterstützt nur Linksklicks.
- `type` unterstützt `slowly=true` nicht.
- `press` unterstützt `delayMs` nicht.
- `hover`, `scrollintoview`, `drag`, `select` und `fill` lehnen Timeout-Überschreibungen pro Aufruf ab; `evaluate` akzeptiert `--timeout-ms`.
- `select` unterstützt nur einen Wert.
- `wait --load networkidle` wird nicht unterstützt (funktioniert bei verwalteten und rohen/entfernten CDP-Profilen).
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS-`--element` und jeweils nur eine Datei.
- Dialog-Hooks unterstützen `--timeout` nicht.
- Screenshots unterstützen Aufnahmen der gesamten Seite und `--ref`, aber kein CSS-`--element`.
- `responsebody`, das Abfangen von Downloads, der PDF-Export und Batch-Aktionen erfordern weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.

## Browser-Fernsteuerung (Node-Host-Proxy)

Wenn der Gateway auf einem anderen Rechner als der Browser ausgeführt wird, führen Sie einen **Node-Host** auf dem Rechner aus, auf dem Chrome/Brave/Edge/Chromium installiert ist. Der Gateway leitet Browser-Aktionen über einen Proxy an diesen Node weiter; ein separater Server zur Browser-Steuerung ist nicht erforderlich.

Verwenden Sie `gateway.nodes.browser.mode`, um das automatische Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, wenn mehrere verbunden sind.

Sicherheit und Remote-Einrichtung: [Browser-Tool](/de/tools/browser), [Remote-Zugriff](/de/gateway/remote), [Tailscale](/de/gateway/tailscale), [Sicherheit](/de/gateway/security)

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Browser](/de/tools/browser)
