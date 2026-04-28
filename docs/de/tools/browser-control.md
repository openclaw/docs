---
read_when:
    - Scripting oder Debugging des Agent-Browsers über die lokale Control-API
    - Suche nach der CLI-Referenz `openclaw browser`
    - Hinzufügen benutzerdefinierter Browser-Automatisierung mit Snapshots und Refs
summary: OpenClaw-Browser-Control-API, CLI-Referenz und Scripting-Aktionen
title: Browser-Control-API
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Für Einrichtung, Konfiguration und Fehlerbehebung siehe [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale HTTP-Control-API, die CLI `openclaw browser`
und Scripting-Muster (Snapshots, Refs, Waits, Debug-Flows).

## Control-API (optional)

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
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`. `POST /start?headless=true` fordert
einen einmaligen Headless-Start für lokal verwaltete Profile an, ohne die persistierte
Browser-Konfiguration zu ändern; Nur-Attach-, Remote-CDP- und bestehende Sitzungsprofile lehnen
diese Überschreibung ab, da OpenClaw diese Browser-Prozesse nicht startet.

Wenn Gateway-Authentifizierung mit gemeinsamem Secret konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API verarbeitet **keine** Identity-Header von trusted-proxy oder Tailscale Serve.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` gesetzt ist, übernehmen diese loopback-Browser-
  Routen diese Identitätsmodi nicht; halten Sie sie nur auf loopback verfügbar.

### Fehlervertrag für `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung und
Policy-Fehler auf Routenebene:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Action-Payload hat Normalisierung oder Validierung nicht bestanden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf Top-Level oder in Batch-Anfragen steht im Konflikt mit dem Anfrageziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Aktion wird für bestehende Sitzungsprofile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne Feld
`code` zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI snapshot/role snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Accessibility-Snapshots im Rollenstil (`--interactive`, `--compact`,
  `--depth`, `--efficient`), wenn ein CDP-WebSocket pro Tab verfügbar ist. Dies ist
  ein Fallback für Inspektion und Ref-Erkennung; Playwright bleibt die primäre
  Aktions-Engine.
- Seiten-Screenshots für den verwalteten Browser `openclaw`, wenn ein CDP-WebSocket
  pro Tab verfügbar ist
- Seiten-Screenshots für Profile `existing-session` / Chrome MCP
- Ref-basierte Screenshots für `existing-session` (`--ref`) aus Snapshot-Ausgabe

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots, die vom nativen AI-Snapshot-Format von Playwright abhängen
- Element-Screenshots per CSS-Selektor (`--element`)
- vollständiger PDF-Export des Browsers

Element-Screenshots lehnen auch `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, reparieren Sie die
Laufzeitabhängigkeiten des gebündelten Browser-Plugins, sodass `playwright-core` installiert ist,
und starten Sie dann das Gateway neu. Führen Sie bei paketierten Installationen `openclaw doctor --fix` aus.
Installieren Sie für Docker zusätzlich die Chromium-Browser-Binärdateien wie unten gezeigt.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (Konflikte mit npm-Overrides).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads zu persistieren, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind-Mount persistent ist. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ein kleiner loopback-Control-Server akzeptiert HTTP-Anfragen und verbindet sich über CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (click/type/snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar. Der Agent sieht eine stabile Schnittstelle, während lokale/entfernte Browser und Profile darunter frei ausgetauscht werden.

## Kurzübersicht CLI

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen, und `--json` für maschinenlesbare Ausgabe.

<AccordionGroup>

<Accordion title="Grundlagen: Status, Tabs, öffnen/fokussieren/schließen">

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

<Accordion title="Inspektion: Screenshot, Snapshot, Konsole, Fehler, Anfragen">

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

<Accordion title="Aktionen: navigieren, klicken, tippen, ziehen, warten, auswerten">

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

<Accordion title="Status: Cookies, Storage, Offline, Header, Geo, Gerät">

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

- `upload` und `dialog` sind **Vorbereitungsaufrufe**; führen Sie sie vor dem Klick/Tastendruck aus, der den Dateiauswahldialog/Dialog auslöst.
- `click`/`type`/usw. erfordern einen `ref` aus `snapshot` (numerisch `12`, Rollen-Ref `e12` oder ausführbarer ARIA-Ref `ax12`). CSS-Selektoren werden für Aktionen bewusst nicht unterstützt. Verwenden Sie `click-coords`, wenn die sichtbare Viewport-Position das einzige zuverlässige Ziel ist.
- Download-, Trace- und Upload-Pfade sind auf die temporären OpenClaw-Wurzeln beschränkt: `/tmp/openclaw{,/downloads,/uploads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.

Stabile Tab-IDs und Labels überstehen den Austausch roher Chromium-Ziele, wenn OpenClaw
den Ersetzungstab nachweisen kann, etwa über dieselbe URL oder wenn ein einzelner alter Tab nach dem Absenden eines Formulars zu einem einzelnen neuen Tab wird. Rohe Ziel-IDs sind weiterhin volatil; bevorzugen Sie in Skripten
`suggestedTargetId` aus `tabs`.

Snapshot-Flags im Überblick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`).
- `--format aria`: Accessibility-Tree mit `axN`-Refs. Wenn Playwright verfügbar ist, bindet OpenClaw Refs mit Backend-DOM-IDs an die aktive Seite, sodass Folgeaktionen sie verwenden können; andernfalls sollte die Ausgabe nur zur Inspektion verwendet werden.
- `--efficient` (oder `--mode efficient`): kompaktes Preset für Rollen-Snapshots. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies als Standard zu verwenden (siehe [Gateway configuration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Rollen-Snapshot mit `ref=e12`-Refs. `--frame "<iframe>"` beschränkt Rollen-Snapshots auf ein iframe.
- `--labels` fügt einen nur für den Viewport gültigen Screenshot mit eingeblendeten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `--urls` hängt erkannte Link-Ziele an AI-Snapshots an.

## Snapshots und Refs

OpenClaw unterstützt zwei „Snapshot“-Stile:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot mit numerischen Refs.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird der Ref über `aria-ref` von Playwright aufgelöst.

- **Rollen-Snapshot (Rollen-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/ein rollenbasierter Baum mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird der Ref über `getByRole(...)` aufgelöst (plus `nth()` bei Duplikaten).
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit eingeblendeten `e12`-Labels einzuschließen.
  - Fügen Sie `--urls` hinzu, wenn Linktext mehrdeutig ist und der Agent konkrete
    Navigationsziele benötigt.

- **ARIA-Snapshot (ARIA-Refs wie `ax12`)**: `openclaw browser snapshot --format aria`
  - Ausgabe: der Accessibility-Tree als strukturierte Knoten.
  - Aktionen: `openclaw browser click ax12` funktioniert, wenn der Snapshot-Pfad den Ref
    über Playwright und Chrome-Backend-DOM-IDs binden kann.
- Wenn Playwright nicht verfügbar ist, können ARIA-Snapshots weiterhin für
  Inspektion nützlich sein, aber Refs sind möglicherweise nicht ausführbar. Erstellen Sie erneut einen Snapshot mit `--format ai`
  oder `--interactive`, wenn Sie Action-Refs benötigen.
- Docker-Nachweis für den Raw-CDP-Fallback-Pfad: `pnpm test:docker:browser-cdp-snapshot`
  startet Chromium mit CDP, führt `browser doctor --deep` aus und verifiziert, dass Rollen-
  Snapshots Link-URLs, per Cursor hervorgehobene anklickbare Elemente und iframe-Metadaten enthalten.

Ref-Verhalten:

- Refs sind **nicht stabil über Navigationen hinweg**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen neuen Ref.
- `/act` gibt nach aktionsausgelöstem Austausch den aktuellen rohen `targetId` zurück,
  wenn der Ersetzungstab nachgewiesen werden kann. Verwenden Sie für Folgekommandos weiterhin stabile Tab-IDs/Labels.
- Wenn der Rollen-Snapshot mit `--frame` aufgenommen wurde, sind Rollen-Refs bis zum nächsten Rollen-Snapshot auf dieses iframe beschränkt.
- Unbekannte oder veraltete `axN`-Refs schlagen sofort fehl, statt auf den
  Playwright-Selektor `aria-ref` zurückzufallen. Führen Sie in diesem Fall auf demselben Tab einen neuen Snapshot aus.

## Wait-Erweiterungen

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Warten, bis ein Selektor sichtbar wird:
  - `openclaw browser wait "#main"`

Diese lassen sich kombinieren:

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
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright abzielt
4. Wenn sich die Seite seltsam verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: Zeichnen Sie einen Trace auf:
   - `openclaw browser trace start`
   - reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Scripting und strukturierte Tools gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Rollen-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (lines/chars/refs/interactive), damit Tools über Payload-Größe und -Dichte entscheiden können.

## Einstellungen für Status und Umgebung

Diese sind nützlich für Workflows nach dem Muster „die Website soll sich wie X verhalten“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (veraltet `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevorgaben)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das Browser-Profil von `openclaw` kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann
  dies steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Anmeldungen und Hinweise zu Anti-Bot-Systemen (X/Twitter usw.) siehe [Browser-Anmeldung + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (nur loopback oder Tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für den Strict-Modus (private/interne Ziele standardmäßig blockieren):

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

## Verwandt

- [Browser](/de/tools/browser) — Überblick, Konfiguration, Profile, Sicherheit
- [Browser-Anmeldung](/de/tools/browser-login) — bei Websites anmelden
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
