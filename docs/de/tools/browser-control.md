---
read_when:
    - Skripting oder Debugging des Agent-Browsers über die lokale Steuerungs-API
    - Suchen Sie nach der CLI-Referenz für `openclaw browser`
    - Benutzerdefinierte Browserautomatisierung mit Snapshots und Refs hinzufügen
summary: OpenClaw-Browsersteuerungs-API, CLI-Referenz und Skriptaktionen
title: Browsersteuerungs-API
x-i18n:
    generated_at: "2026-06-27T18:15:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Für Einrichtung, Konfiguration und Fehlerbehebung siehe [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale Steuerungs-HTTP-API, die `openclaw browser`
CLI und Skripting-Muster (Snapshots, Refs, Wartevorgänge, Debug-Flows).

## Steuerungs-API (optional)

Nur für lokale Integrationen stellt der Gateway eine kleine Loopback-HTTP-API bereit.
Dieser eigenständige Server ist opt-in — setzen Sie die Umgebungsvariable
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` in der Gateway-Dienstumgebung
und starten Sie den Gateway neu, bevor die HTTP-Endpunkte verfügbar werden. Ohne
diese Variable funktioniert die Browser-Control-Runtime weiterhin über die CLI und
Agent-Tools, aber auf dem Loopback-Control-Port lauscht nichts.

- Status/Start/Stopp: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/Screenshot: `GET /snapshot`, `POST /screenshot`
- Aktionen: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Berechtigungen: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netzwerk: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`. `POST /start?headless=true` fordert einen
einmaligen Headless-Start für lokal verwaltete Profile an, ohne die persistierte
Browser-Konfiguration zu ändern; Attach-only-, Remote-CDP- und Existing-session-Profile lehnen
diese Überschreibung ab, weil OpenClaw diese Browser-Prozesse nicht startet.

Für Tab-Endpunkte ist `targetId` der Kompatibilitätsfeldname. Übergeben Sie bevorzugt
`suggestedTargetId` aus `GET /tabs` oder `POST /tabs/open`; Labels und `tabId`-
Handles wie `t1` werden ebenfalls akzeptiert. Rohe CDP-Target-IDs und eindeutige rohe
Target-ID-Präfixe funktionieren weiterhin, sind aber flüchtige Diagnose-Handles.

Wenn Gateway-Auth mit gemeinsamem Geheimnis konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige Loopback-Browser-API nutzt **keine** Trusted-Proxy- oder
  Tailscale-Serve-Identity-Header.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` steht, erben diese Loopback-Browser-
  Routen diese identitätstragenden Modi nicht; halten Sie sie ausschließlich auf Loopback beschränkt.

### Fehlervertrag für `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Policy-Fehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Aktions-Payload konnte nicht normalisiert oder validiert werden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist durch die Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder in einem Batch kollidiert mit dem Anfrage-Target.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Aktion wird für Existing-session-Profile nicht unterstützt.

Andere Runtime-Fehler können weiterhin `{ "error": "<message>" }` ohne
`code`-Feld zurückgeben.

### Playwright-Anforderung

Einige Funktionen (Navigate/Act/AI-Snapshot/Role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Barrierefreiheits-Snapshots im Role-Stil (`--interactive`, `--compact`,
  `--depth`, `--efficient`), wenn ein CDP-WebSocket pro Tab verfügbar ist. Dies ist
  ein Fallback für Inspektion und Ref-Ermittlung; Playwright bleibt die primäre
  Aktions-Engine.
- Seiten-Screenshots für den verwalteten `openclaw`-Browser, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für `existing-session`- / Chrome-MCP-Profile
- Ref-basierte `existing-session`-Screenshots (`--ref`) aus Snapshot-Ausgaben

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots, die vom nativen AI-Snapshot-Format von Playwright abhängen
- Element-Screenshots per CSS-Selector (`--element`)
- vollständiger Browser-PDF-Export

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, fehlt dem paketierten
Gateway die zentrale Browser-Runtime-Abhängigkeit. Installieren oder aktualisieren Sie
OpenClaw erneut und starten Sie dann den Gateway neu. Installieren Sie bei Docker außerdem die Chromium-
Browser-Binärdateien wie unten gezeigt.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (npm-Override-Konflikte).
Backen Sie Chromium bei eigenen Images in das Image ein:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Installieren Sie bei einem vorhandenen Image stattdessen über die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads zu persistieren, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind-Mount persistiert wird. OpenClaw erkennt das persistierte
Chromium unter Linux automatisch. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ein kleiner Loopback-Control-Server akzeptiert HTTP-Anfragen und verbindet sich per CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (Klick/Tippen/Snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar. Der Agent sieht eine stabile Schnittstelle, während lokale/entfernte Browser und Profile darunter frei ausgetauscht werden.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusteuern, und `--json` für maschinenlesbare Ausgabe.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Hinweise:

- `upload` und `dialog` sind **Aktivierungs**-Aufrufe; führen Sie sie vor dem Klick/Tastendruck aus, der den Chooser/Dialog auslöst. Wenn eine Aktion ein Modal öffnet, enthält die Aktionsantwort `blockedByDialog` und `browserState.dialogs.pending`; übergeben Sie diese `dialogId`, um direkt zu antworten. Außerhalb von OpenClaw behandelte Dialoge erscheinen unter `browserState.dialogs.recent`.
- `click`/`type`/usw. erfordern eine `ref` aus `snapshot` (numerisch `12`, Role-Ref `e12` oder ausführbare ARIA-Ref `ax12`). CSS-Selektoren werden für Aktionen bewusst nicht unterstützt. Verwenden Sie `click-coords`, wenn die sichtbare Viewport-Position das einzige zuverlässige Ziel ist.
- Download- und Trace-Pfade sind auf OpenClaw-Temp-Roots beschränkt: `/tmp/openclaw{,/downloads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` akzeptiert Dateien aus dem OpenClaw-Temp-Uploads-Root und
  von OpenClaw verwaltete eingehende Medien. Verwaltete eingehende Medien können als
  `media://inbound/<id>`, sandbox-relatives `media/inbound/<id>` oder als aufgelöster
  Pfad innerhalb des verwalteten Verzeichnisses für eingehende Medien referenziert werden. Verschachtelte Media-Refs,
  Traversal, Symlinks, Hardlinks und beliebige lokale Pfade werden weiterhin abgelehnt.
- `upload` kann Datei-Eingaben auch direkt über `--input-ref` oder `--element` setzen.

Stabile Tab-IDs und Labels überstehen den Austausch roher Chromium-Targets, wenn OpenClaw
den Ersatz-Tab nachweisen kann, etwa bei derselben URL oder wenn ein einzelner alter Tab nach einer
Formularübermittlung zu einem einzelnen neuen Tab wird. Rohe Target-IDs bleiben flüchtig; bevorzugen Sie
`suggestedTargetId` aus `tabs` in Skripten.

Snapshot-Flags auf einen Blick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Referenzen (`aria-ref="<n>"`).
- `--format aria`: Accessibility-Baum mit `axN`-Referenzen. Wenn Playwright verfügbar ist, bindet OpenClaw Referenzen mit Backend-DOM-IDs an die Live-Seite, sodass Folgeaktionen sie verwenden können; andernfalls ist die Ausgabe nur zur Inspektion gedacht.
- `--efficient` (oder `--mode efficient`): kompaktes Rollen-Snapshot-Preset. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies zum Standard zu machen (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Rollen-Snapshot mit `ref=e12`-Referenzen. `--frame "<iframe>"` begrenzt Rollen-Snapshots auf ein Iframe.
- Mit Playwright fügt `--labels` einen Screenshot mit überlagerten Referenzlabels
  hinzu (gibt `MEDIA:<path>` aus) sowie ein `annotations`-Array mit der Bounding
  Box jeder Referenz. Bei `screenshot` funktionieren Playwright-gestützte Labels mit `--full-page`,
  `--ref` und `--element`; bei `snapshot` bleibt der begleitende Screenshot
  auf den Viewport beschränkt. Existing-Session-/chrome-mcp-Profile rendern Overlay-Labels auf
  Seitenscreenshots, geben aber keine `annotations` zurück und verwenden nicht den Playwright-
  Projektionshelfer für ganze Seite/Referenz/Element. Ohne Playwright oder chrome-mcp
  sind gelabelte Screenshots nicht verfügbar.
- `--urls` hängt erkannte Linkziele an AI-Snapshots an.

## Snapshots und Referenzen

OpenClaw unterstützt zwei „Snapshot“-Stile:

- **AI-Snapshot (numerische Referenzen)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, der numerische Referenzen enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird die Referenz über Playwrights `aria-ref` aufgelöst.

- **Rollen-Snapshot (Rollenreferenzen wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/ein rollenbasierter Baum mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird die Referenz über `getByRole(...)` aufgelöst (plus `nth()` bei Duplikaten).
  - Fügen Sie `--labels` hinzu, um einen Screenshot mit überlagerten `e12`-Labels einzuschließen. Bei
    Playwright-gestützten Profilen gibt dies außerdem Bounding-Box-Metadaten pro Referenz
    zurück (`annotations[]`).
  - Fügen Sie `--urls` hinzu, wenn Linktext mehrdeutig ist und der Agent konkrete
    Navigationsziele benötigt.

- **ARIA-Snapshot (ARIA-Referenzen wie `ax12`)**: `openclaw browser snapshot --format aria`
  - Ausgabe: der Accessibility-Baum als strukturierte Knoten.
  - Aktionen: `openclaw browser click ax12` funktioniert, wenn der Snapshot-Pfad
    die Referenz über Playwright und Chrome-Backend-DOM-IDs binden kann.
- Wenn Playwright nicht verfügbar ist, können ARIA-Snapshots weiterhin für die
  Inspektion nützlich sein, aber Referenzen sind möglicherweise nicht ausführbar. Erstellen Sie erneut einen Snapshot mit `--format ai`
  oder `--interactive`, wenn Sie Aktionsreferenzen benötigen.
- Docker-Nachweis für den Raw-CDP-Fallback-Pfad: `pnpm test:docker:browser-cdp-snapshot`
  startet Chromium mit CDP, führt `browser doctor --deep` aus und verifiziert, dass Rollen-
  Snapshots Link-URLs, zu Cursors hochgestufte klickbare Elemente und Iframe-Metadaten enthalten.

Referenzverhalten:

- Referenzen sind **nicht stabil über Navigationen hinweg**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie eine frische Referenz.
- `/act` gibt nach aktionsausgelöstem Austausch die aktuelle rohe `targetId` zurück,
  wenn der Austausch-Tab nachgewiesen werden kann. Verwenden Sie für
  Folgebefehle weiterhin stabile Tab-IDs/-Labels.
- Wenn der Rollen-Snapshot mit `--frame` aufgenommen wurde, sind Rollenreferenzen bis zum nächsten Rollen-Snapshot auf dieses Iframe begrenzt.
- Unbekannte oder veraltete `axN`-Referenzen schlagen schnell fehl, statt auf
  Playwrights `aria-ref`-Selector zurückzufallen. Führen Sie in diesem Fall
  einen frischen Snapshot im selben Tab aus.

## Wait-Erweiterungen

Sie können auf mehr warten als nur Zeit/Text:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
  - Unterstützt auf verwalteten `openclaw`- und Raw-/Remote-CDP-Profilen. Die Profile `user` und `existing-session` lehnen `networkidle` ab; verwenden Sie dort `--url`, `--text`, einen Selector oder `--fn`-Wartebedingungen.
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Darauf warten, dass ein Selector sichtbar wird:
  - `openclaw browser wait "#main"`

Diese können kombiniert werden:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug-Workflows

Wenn eine Aktion fehlschlägt (z. B. „not visible“, „strict mode violation“, „covered“):

1. `openclaw browser snapshot --interactive`
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Rollenreferenzen im interaktiven Modus)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite ungewöhnlich verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: zeichnen Sie einen Trace auf:
   - `openclaw browser trace start`
   - Reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tools gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Rollen-Snapshots in JSON enthalten `refs` sowie einen kleinen `stats`-Block (Zeilen/Zeichen/Referenzen/interaktiv), damit Tools über Payload-Größe und Dichte entscheiden können.

## Zustands- und Umgebungsoptionen

Diese sind für Workflows nach dem Muster „die Site soll sich wie X verhalten“ nützlich:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (das Legacy-Format `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP-Basic-Auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Locale: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Geräte-Presets)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das openclaw-Browserprofil kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann dies
  steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- `openclaw browser evaluate --fn` akzeptiert eine Funktionsquelle, einen Ausdruck oder
  einen Anweisungsrumpf. Anweisungsrümpfe werden als Async-Funktionen umschlossen; verwenden Sie daher
  `return` für den Wert, den Sie zurückerhalten möchten. Verwenden Sie `--timeout-ms <ms>`, wenn die
  seitenseitige Funktion länger als das Standard-Evaluate-Timeout benötigen kann.
- Hinweise zu Logins und Anti-Bot-Themen (X/Twitter usw.) finden Sie unter [Browser-Login + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (local loopback oder nur tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Strict-Mode-Beispiel (private/interne Ziele standardmäßig blockieren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Verwandte Themen

- [Browser](/de/tools/browser) - Übersicht, Konfiguration, Profile, Sicherheit
- [Browser-Login](/de/tools/browser-login) - Anmeldung bei Sites
- [Browser-Linux-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)
- [Browser-WSL2-Fehlerbehebung](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
