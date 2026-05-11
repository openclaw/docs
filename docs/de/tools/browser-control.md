---
read_when:
    - Skripting oder Debugging des Agent-Browsers über die lokale Steuerungs-API
    - Suchen Sie nach der `openclaw browser` CLI-Referenz
    - Benutzerdefinierte Browserautomatisierung mit Snapshots und Refs hinzufügen
summary: OpenClaw-API für Browsersteuerung, CLI-Referenz und Skripting-Aktionen
title: Browsersteuerungs-API
x-i18n:
    generated_at: "2026-05-11T20:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

Für Einrichtung, Konfiguration und Fehlerbehebung siehe [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale Steuerungs-HTTP-API, die `openclaw browser`
CLI und Scripting-Muster (Snapshots, Refs, Wartevorgänge, Debug-Flows).

## Steuerungs-API (optional)

Nur für lokale Integrationen stellt der Gateway eine kleine loopback-HTTP-API bereit:

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
- Zustand: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Zustand: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`. `POST /start?headless=true` fordert einen
einmaligen headless-Start für lokal verwaltete Profile an, ohne die dauerhaft gespeicherte
Browser-Konfiguration zu ändern; attach-only-, Remote-CDP- und Existing-Session-Profile lehnen
diese Überschreibung ab, weil OpenClaw diese Browser-Prozesse nicht startet.

Wenn Gateway-Authentifizierung per gemeinsamem Geheimnis konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API nutzt **keine** trusted-proxy- oder
  Tailscale-Serve-Identitätsheader.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` gesetzt ist, erben diese loopback-Browser-
  Routen diese identitätstragenden Modi nicht; halten Sie sie ausschließlich loopback-lokal.

### Fehlervertrag für `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Policy-Fehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Die Aktionsnutzlast konnte nicht normalisiert oder validiert werden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist durch die Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder in einem Batch steht im Konflikt mit dem Request-Ziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Die Aktion wird für Existing-Session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne ein
`code`-Feld zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Rollen-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Rollenbasierte Accessibility-Snapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`), wenn ein CDP-WebSocket pro Tab verfügbar ist. Dies ist
  ein Fallback für Inspektion und Ref-Ermittlung; Playwright bleibt die primäre
  Aktions-Engine.
- Seiten-Screenshots für den verwalteten `openclaw`-Browser, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für `existing-session`- / Chrome-MCP-Profile
- `existing-session`-Ref-basierte Screenshots (`--ref`) aus der Snapshot-Ausgabe

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots, die vom nativen AI-Snapshot-Format von Playwright abhängen
- CSS-Selektor-Element-Screenshots (`--element`)
- vollständiger Browser-PDF-Export

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, fehlt dem paketierten
Gateway die zentrale Browser-Laufzeitabhängigkeit. Installieren oder aktualisieren Sie
OpenClaw neu und starten Sie anschließend den Gateway neu. Für Docker installieren Sie außerdem
die Chromium-Browser-Binärdateien wie unten gezeigt.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (npm-Override-Konflikte).
Für benutzerdefinierte Images backen Sie Chromium in das Image ein:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Für ein vorhandenes Image installieren Sie stattdessen über die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads dauerhaft zu speichern, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind Mount persistent ist. OpenClaw erkennt das persistente
Chromium unter Linux automatisch. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ein kleiner loopback-Steuerungsserver akzeptiert HTTP-Requests und verbindet sich per CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (click/type/snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Nicht-Playwright-Vorgänge verfügbar. Der Agent sieht eine stabile Schnittstelle, während lokale/remote Browser und Profile darunter frei ausgetauscht werden.

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
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

- `upload` und `dialog` sind **vorbereitende** Aufrufe; führen Sie sie vor dem Klick/Tastendruck aus, der den Chooser/Dialog auslöst.
- `click`/`type`/etc erfordern eine `ref` aus `snapshot` (numerisch `12`, Rollen-Ref `e12` oder ausführbare ARIA-Ref `ax12`). CSS-Selektoren werden für Aktionen absichtlich nicht unterstützt. Verwenden Sie `click-coords`, wenn die sichtbare Viewport-Position das einzige zuverlässige Ziel ist.
- Download-, Trace- und Upload-Pfade sind auf OpenClaw-Temp-Roots beschränkt: `/tmp/openclaw{,/downloads,/uploads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kann Datei-Inputs auch direkt über `--input-ref` oder `--element` setzen.

Stabile Tab-IDs und Labels überstehen den Austausch von Chromium-Raw-Targets, wenn OpenClaw
den Ersatztab nachweisen kann, etwa bei derselben URL oder wenn ein einzelner alter Tab nach einer
Formularübermittlung zu einem einzelnen neuen Tab wird. Raw-Target-IDs bleiben volatil; bevorzugen Sie
`suggestedTargetId` aus `tabs` in Skripten.

Snapshot-Flags auf einen Blick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`).
- `--format aria`: Accessibility-Baum mit `axN`-Refs. Wenn Playwright verfügbar ist, bindet OpenClaw Refs mit Backend-DOM-IDs an die Live-Seite, sodass Folgeaktionen sie verwenden können; andernfalls behandeln Sie die Ausgabe als reine Inspektion.
- `--efficient` (oder `--mode efficient`): kompakte Rollen-Snapshot-Voreinstellung. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies zum Standard zu machen (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Rollen-Snapshot mit `ref=e12`-Refs. `--frame "<iframe>"` beschränkt Rollen-Snapshots auf ein iframe.
- `--labels` fügt einen Viewport-only-Screenshot mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `--urls` hängt gefundene Link-Ziele an AI-Snapshots an.

## Snapshots und Refs

OpenClaw unterstützt zwei „Snapshot“-Stile:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, der numerische Refs enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird die Ref über Playwrights `aria-ref` aufgelöst.

- **Rollen-Snapshot (Rollen-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/Baumstruktur mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird die Ref über `getByRole(...)` aufgelöst (plus `nth()` für Duplikate).
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit überlagerten `e12`-Labels einzuschließen.
  - Fügen Sie `--urls` hinzu, wenn Linktext mehrdeutig ist und der Agent konkrete
    Navigationsziele benötigt.

- **ARIA-Snapshot (ARIA-Refs wie `ax12`)**: `openclaw browser snapshot --format aria`
  - Ausgabe: der Barrierefreiheitsbaum als strukturierte Nodes.
  - Aktionen: `openclaw browser click ax12` funktioniert, wenn der Snapshot-Pfad
    den Ref über Playwright und DOM-IDs des Chrome-Backends binden kann.
- Wenn Playwright nicht verfügbar ist, können ARIA-Snapshots für die
  Inspektion trotzdem nützlich sein, aber Refs sind möglicherweise nicht ausführbar. Erstellen Sie erneut einen Snapshot mit `--format ai`
  oder `--interactive`, wenn Sie Aktions-Refs benötigen.
- Docker-Nachweis für den Raw-CDP-Fallback-Pfad: `pnpm test:docker:browser-cdp-snapshot`
  startet Chromium mit CDP, führt `browser doctor --deep` aus und verifiziert, dass Rollen-Snapshots
  Link-URLs, durch den Cursor hervorgehobene anklickbare Elemente und iframe-Metadaten enthalten.

Ref-Verhalten:

- Refs sind **über Navigationen hinweg nicht stabil**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen frischen Ref.
- `/act` gibt nach einer durch eine Aktion ausgelösten Ersetzung die aktuelle rohe `targetId` zurück,
  wenn der Ersatz-Tab eindeutig nachgewiesen werden kann. Verwenden Sie für
  Folgekommandos weiterhin stabile Tab-IDs/-Labels.
- Wenn der Rollen-Snapshot mit `--frame` erstellt wurde, sind Rollen-Refs bis zum nächsten Rollen-Snapshot auf dieses iframe beschränkt.
- Unbekannte oder veraltete `axN`-Refs schlagen schnell fehl, statt auf den
  `aria-ref`-Selektor von Playwright zurückzufallen. Führen Sie in diesem Fall
  einen frischen Snapshot auf demselben Tab aus.

## Wait-Erweiterungen

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Darauf warten, dass ein Selektor sichtbar wird:
  - `openclaw browser wait "#main"`

Diese Optionen können kombiniert werden:

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
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Rollen-Refs im interaktiven Modus)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite ungewöhnlich verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: Zeichnen Sie einen Trace auf:
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

Rollen-Snapshots in JSON enthalten `refs` plus einen kleinen `stats`-Block (Zeilen/Zeichen/Refs/interaktiv), damit Tools über Payload-Größe und -Dichte entscheiden können.

## Stellschrauben für Zustand und Umgebung

Diese sind nützlich für Workflows nach dem Muster „die Website soll sich wie X verhalten“:

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

- Das openclaw-Browser-Profil kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann dies steuern.
  Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Hinweise zu Anmeldungen und Anti-Bot (X/Twitter usw.) finden Sie unter [Browser-Anmeldung + Posten auf X/Twitter](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (loopback oder nur tailnet).
- Remote-CDP-Endpunkte sind leistungsfähig; tunneln und schützen Sie sie.

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

## Weitere Informationen

- [Browser](/de/tools/browser) - Überblick, Konfiguration, Profile, Sicherheit
- [Browser-Anmeldung](/de/tools/browser-login) - Anmeldung bei Websites
- [Browser-Linux-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)
- [Browser-WSL2-Fehlerbehebung](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
