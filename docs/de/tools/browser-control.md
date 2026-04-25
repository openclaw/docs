---
read_when:
    - Skripting oder Debugging des Agent-Browsers über die lokale Steuerungs-API
    - Auf der Suche nach der `openclaw browser` CLI-Referenz
    - Hinzufügen benutzerdefinierter Browser-Automatisierung mit Snapshots und Refs
summary: OpenClaw Browser-Control-API, CLI-Referenz und Scripting-Aktionen
title: Browser-Steuerungs-API
x-i18n:
    generated_at: "2026-04-25T13:57:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Für Einrichtung, Konfiguration und Fehlerbehebung siehe [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale Steuerungs-HTTP-API, die `openclaw browser`
CLI und Skripting-Muster (Snapshots, Refs, Waits, Debug-Abläufe).

## Steuerungs-API (optional)

Nur für lokale Integrationen stellt das Gateway eine kleine loopback-HTTP-API bereit:

- Status/Start/Stopp: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/Screenshot: `GET /snapshot`, `POST /screenshot`
- Aktionen: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netzwerk: `POST /response/body`
- Zustand: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Zustand: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`. `POST /start?headless=true` fordert
einen einmaligen Headless-Start für lokal verwaltete Profile an, ohne die
persistierte Browser-Konfiguration zu ändern; Attach-only-, Remote-CDP- und
Existing-Session-Profile lehnen diese Überschreibung ab, weil OpenClaw diese Browser-Prozesse nicht startet.

Wenn die Gateway-Authentifizierung mit Shared Secret konfiguriert ist, erfordern auch Browser-HTTP-Routen Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API verwendet **keine** Trusted-Proxy- oder
  Tailscale Serve-Identity-Header.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` gesetzt ist, übernehmen diese loopback-Browser-
  Routen diese Identitätsmodi nicht; halten Sie sie nur für loopback verfügbar.

### `/act`-Fehlervertrag

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Policy-Fehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Action-Payload hat Normalisierung oder Validierung nicht bestanden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einem nicht unterstützten Action-Typ verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder im Batch steht im Konflikt mit dem Anfrageziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Action wird für Existing-Session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne ein
`code`-Feld zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seiten-Screenshots für den verwalteten `openclaw`-Browser, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für `existing-session`- / Chrome MCP-Profile
- `existing-session`-ref-basierte Screenshots (`--ref`) aus der Snapshot-Ausgabe

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots / Role-Snapshots
- CSS-Selektor-Element-Screenshots (`--element`)
- vollständiger Browser-PDF-Export

Element-Screenshots lehnen auch `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, reparieren Sie die
gebündelten Laufzeitabhängigkeiten des Browser-Plugins, sodass `playwright-core` installiert ist,
und starten Sie dann das Gateway neu. Führen Sie für paketierte Installationen `openclaw doctor --fix` aus.
Installieren Sie für Docker außerdem die Chromium-Browser-Binärdateien wie unten gezeigt.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (npm-Override-Konflikte).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Damit Browser-Downloads persistent bleiben, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind Mount persistent gespeichert wird. Siehe [Docker](/de/install/docker).

## Wie es funktioniert (intern)

Ein kleiner loopback-Steuerungsserver akzeptiert HTTP-Anfragen und verbindet sich über CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (Klicken/Tippen/Snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Operationen ohne Playwright verfügbar. Der Agent sieht eine stabile Schnittstelle, während darunter lokale/remote Browser und Profile frei ausgetauscht werden.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen, und `--json` für maschinenlesbare Ausgabe.

<AccordionGroup>

<Accordion title="Grundlagen: Status, Tabs, öffnen/fokussieren/schließen">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # einmaliger lokaler verwalteter Headless-Start
openclaw browser stop            # löscht auch Emulation auf attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # Kurzform für den aktuellen Tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspektion: Screenshot, Snapshot, Konsole, Fehler, Anfragen">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # oder --ref e12
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

<Accordion title="Aktionen: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # oder e12 für Role-Refs
openclaw browser click-coords 120 340        # Viewport-Koordinaten
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

<Accordion title="Zustand: Cookies, Storage, offline, Header, Geo, Gerät">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear zum Entfernen
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Hinweise:

- `upload` und `dialog` sind **Vorbereitungsaufrufe**; führen Sie sie vor dem Klick/Tastendruck aus, der den Datei-Auswahldialog/Dialog auslöst.
- `click`/`type`/usw. benötigen eine `ref` aus `snapshot` (numerisch `12`, Role-Ref `e12` oder ausführbare ARIA-Ref `ax12`). CSS-Selektoren werden für Aktionen bewusst nicht unterstützt. Verwenden Sie `click-coords`, wenn die sichtbare Viewport-Position das einzig zuverlässige Ziel ist.
- Download-, Trace- und Upload-Pfade sind auf OpenClaw-Temp-Wurzeln beschränkt: `/tmp/openclaw{,/downloads,/uploads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kann Datei-Inputs auch direkt über `--input-ref` oder `--element` setzen.

Snapshot-Flags im Überblick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`).
- `--format aria`: Accessibility Tree mit `axN`-Refs. Wenn Playwright verfügbar ist, bindet OpenClaw Refs mit Backend-DOM-IDs an die Live-Seite, sodass nachfolgende Aktionen sie verwenden können; andernfalls sollte die Ausgabe nur zur Inspektion verwendet werden.
- `--efficient` (oder `--mode efficient`): kompaktes Role-Snapshot-Preset. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies zum Standard zu machen (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Role-Snapshot mit `ref=e12`-Refs. `--frame "<iframe>"` begrenzt Role-Snapshots auf ein iframe.
- `--labels` fügt einen Screenshot nur des Viewports mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `--urls` hängt erkannte Link-Ziele an AI-Snapshots an.

## Snapshots und Refs

OpenClaw unterstützt zwei „Snapshot“-Stile:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, das numerische Refs enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird die Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Role-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/Struktur mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird die Ref über `getByRole(...)` aufgelöst (plus `nth()` bei Duplikaten).
  - Fügen Sie `--labels` hinzu, um einen Screenshot des Viewports mit überlagerten `e12`-Labels einzuschließen.
  - Fügen Sie `--urls` hinzu, wenn Link-Text mehrdeutig ist und der Agent konkrete
    Navigationsziele benötigt.

- **ARIA-Snapshot (ARIA-Refs wie `ax12`)**: `openclaw browser snapshot --format aria`
  - Ausgabe: der Accessibility Tree als strukturierte Knoten.
  - Aktionen: `openclaw browser click ax12` funktioniert, wenn der Snapshot-Pfad die Ref über
    Playwright und Chrome-Backend-DOM-IDs binden kann.
  - Wenn Playwright nicht verfügbar ist, können ARIA-Snapshots weiterhin für
    Inspektion nützlich sein, aber Refs sind möglicherweise nicht ausführbar. Erstellen Sie erneut einen Snapshot mit `--format ai`
    oder `--interactive`, wenn Sie Action-Refs benötigen.

Verhalten von Refs:

- Refs sind **nicht stabil über Navigationsvorgänge hinweg**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie eine frische Ref.
- Wenn der Role-Snapshot mit `--frame` erstellt wurde, sind Role-Refs auf dieses iframe begrenzt, bis zum nächsten Role-Snapshot.
- Unbekannte oder veraltete `axN`-Refs schlagen schnell fehl, statt auf
  Playwrights `aria-ref`-Selektor zurückzufallen. Führen Sie in diesem Fall auf demselben Tab einen neuen Snapshot aus.

## Wait-Power-ups

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Warten, bis ein Selektor sichtbar wird:
  - `openclaw browser wait "#main"`

Diese können kombiniert werden:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug-Abläufe

Wenn eine Aktion fehlschlägt (z. B. „not visible“, „strict mode violation“, „covered“):

1. `openclaw browser snapshot --interactive`
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Role-Refs im interaktiven Modus)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite merkwürdig verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: Zeichnen Sie einen Trace auf:
   - `openclaw browser trace start`
   - reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling-Workflows.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` sowie einen kleinen `stats`-Block (lines/chars/refs/interactive), damit Tools Rückschlüsse auf Payload-Größe und -Dichte ziehen können.

## Zustands- und Umgebungsoptionen

Diese sind nützlich für Workflows vom Typ „die Website so verhalten lassen wie X“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (das ältere `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevoreinstellungen)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das `openclaw`-Browser-Profil kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt-Injection kann dies
  steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Hinweise zu Anmeldungen und Anti-Bot-Maßnahmen (X/Twitter usw.) siehe [Browser login + X/Twitter posting](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (nur loopback oder nur tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Strict-Mode-Beispiel (private/interne Ziele standardmäßig blockieren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exakte Zulassung
    },
  },
}
```

## Verwandt

- [Browser](/de/tools/browser) — Überblick, Konfiguration, Profile, Sicherheit
- [Browser login](/de/tools/browser-login) — bei Websites anmelden
- [Browser Linux troubleshooting](/de/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
