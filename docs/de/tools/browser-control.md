---
read_when:
    - Skripting oder Debugging des Agent-Browsers über die lokale Steuerungs-API
    - Suchen Sie nach der `openclaw browser` CLI-Referenz
    - Benutzerdefinierte Browser-Automatisierung mit Snapshots und Referenzen hinzufügen
summary: OpenClaw-Browsersteuerungs-API, CLI-Referenz und Skripting-Aktionen
title: Browser-Steuerungs-API
x-i18n:
    generated_at: "2026-05-10T19:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

Informationen zu Einrichtung, Konfiguration und Fehlerbehebung finden Sie unter [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale Steuerungs-HTTP-API, die `openclaw browser`
CLI und Skripting-Muster (Snapshots, Refs, Warteoperationen, Debug-Flows).

## Steuerungs-API (optional)

Nur für lokale Integrationen stellt der Gateway eine kleine local loopback HTTP API bereit:

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
einmaligen Headless-Start für lokal verwaltete Profile an, ohne die persistierte
Browser-Konfiguration zu ändern; Attach-only-, Remote-CDP- und Existing-Session-Profile lehnen
diese Überschreibung ab, weil OpenClaw diese Browser-Prozesse nicht startet.

Wenn Shared-Secret-Gateway-Authentifizierung konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige local loopback Browser-API nutzt **keine** Trusted-Proxy- oder
  Tailscale Serve-Identity-Header.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` gesetzt ist, erben diese local loopback Browser-
  Routen diese Identity-tragenden Modi nicht; halten Sie sie loopback-only.

### `/act`-Fehlervertrag

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Policy-Fehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Die Aktions-Payload konnte nicht normalisiert oder validiert werden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist durch die Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): Top-level- oder gebündelte `targetId` steht im Konflikt mit dem Anfrageziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Die Aktion wird für Existing-Session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne
`code`-Feld zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Rollen-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was auch ohne Playwright funktioniert:

- ARIA-Snapshots
- Rollenartige Accessibility-Snapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`), wenn ein CDP-WebSocket pro Tab verfügbar ist. Dies ist
  ein Fallback für Inspektion und Ref-Ermittlung; Playwright bleibt die primäre
  Aktions-Engine.
- Seiten-Screenshots für den verwalteten `openclaw`-Browser, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für `existing-session`- / Chrome-MCP-Profile
- `existing-session`-Ref-basierte Screenshots (`--ref`) aus Snapshot-Ausgaben

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots, die von Playwrights nativem AI-Snapshot-Format abhängen
- CSS-Selector-Element-Screenshots (`--element`)
- vollständiger Browser-PDF-Export

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, fehlt dem paketierten
Gateway die zentrale Browser-Laufzeitabhängigkeit. Installieren oder aktualisieren Sie
OpenClaw neu und starten Sie dann den Gateway neu. Für Docker installieren Sie außerdem die Chromium-
Browser-Binaries wie unten gezeigt.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (npm-Override-Konflikte).
Verwenden Sie stattdessen die mitgelieferte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads zu persistieren, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind-Mount persistiert wird. OpenClaw erkennt das persistierte
Chromium unter Linux automatisch. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ein kleiner local loopback Steuerungsserver nimmt HTTP-Anfragen entgegen und verbindet sich über CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (click/type/snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar. Der Agent sieht eine stabile Schnittstelle, während lokale/remote Browser und Profile darunter frei austauschbar sind.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen, und `--json` für maschinenlesbare Ausgabe.

<AccordionGroup>

<Accordion title="Grundlagen: Status, Tabs, Öffnen/Fokussieren/Schließen">

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

<Accordion title="Aktionen: Navigieren, Klicken, Tippen, Ziehen, Warten, Auswerten">

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

<Accordion title="Zustand: Cookies, Storage, Offline, Header, Geo, Gerät">

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
- `click`/`type`/etc benötigen eine `ref` aus `snapshot` (numerisch `12`, Rollen-Ref `e12` oder ausführbare ARIA-Ref `ax12`). CSS-Selector werden absichtlich nicht für Aktionen unterstützt. Verwenden Sie `click-coords`, wenn die sichtbare Viewport-Position das einzige zuverlässige Ziel ist.
- Download-, Trace- und Upload-Pfade sind auf OpenClaw-Temp-Roots beschränkt: `/tmp/openclaw{,/downloads,/uploads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.

Stabile Tab-IDs und Labels überstehen den Austausch roher Chromium-Targets, wenn OpenClaw
den Ersatz-Tab nachweisen kann, etwa dieselbe URL oder wenn ein einzelner alter Tab nach einer
Formularübermittlung zu einem einzelnen neuen Tab wird. Rohe Target-IDs bleiben volatil; bevorzugen Sie
`suggestedTargetId` aus `tabs` in Skripten.

Snapshot-Flags auf einen Blick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`).
- `--format aria`: Accessibility-Baum mit `axN`-Refs. Wenn Playwright verfügbar ist, bindet OpenClaw Refs mit Backend-DOM-IDs an die Live-Seite, sodass Folgeaktionen sie verwenden können; andernfalls behandeln Sie die Ausgabe nur als Inspektion.
- `--efficient` (oder `--mode efficient`): Kompaktes Rollen-Snapshot-Preset. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies zum Standard zu machen (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Rollen-Snapshot mit `ref=e12`-Refs. `--frame "<iframe>"` begrenzt Rollen-Snapshots auf einen iframe.
- `--labels` fügt einen Viewport-only-Screenshot mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `--urls` hängt entdeckte Link-Ziele an AI-Snapshots an.

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
  - Ausgabe: der Accessibility-Baum als strukturierte Knoten.
  - Aktionen: `openclaw browser click ax12` funktioniert, wenn der Snapshot-Pfad die
    Ref über Playwright und Chrome-Backend-DOM-IDs binden kann.
- Wenn Playwright nicht verfügbar ist, können ARIA-Snapshots weiterhin für die
  Inspektion nützlich sein, aber Refs sind möglicherweise nicht ausführbar. Erstellen Sie erneut einen Snapshot mit `--format ai`
  oder `--interactive`, wenn Sie Aktions-Refs benötigen.
- Docker-Nachweis für den Raw-CDP-Fallback-Pfad: `pnpm test:docker:browser-cdp-snapshot`
  startet Chromium mit CDP, führt `browser doctor --deep` aus und verifiziert, dass Rollen-
  Snapshots Link-URLs, cursor-promoted clickables und iframe-Metadaten enthalten.

Ref-Verhalten:

- Refs sind **nicht stabil über Navigationen hinweg**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie eine frische Ref.
- `/act` gibt nach einer durch eine Aktion ausgelösten Ersetzung die aktuelle rohe `targetId` zurück,
  wenn die Ersetzungs-Registerkarte nachgewiesen werden kann. Verwenden Sie für
  Folge-Befehle weiterhin stabile Registerkarten-IDs/-Labels.
- Wenn der Rollen-Snapshot mit `--frame` erstellt wurde, sind Rollen-Refs bis zum nächsten Rollen-Snapshot auf diesen iframe beschränkt.
- Unbekannte oder veraltete `axN`-Refs schlagen schnell fehl, statt auf
  Playwrights `aria-ref`-Selector zurückzufallen. Führen Sie in diesem Fall
  einen frischen Snapshot auf derselben Registerkarte aus.

## Warte-Power-ups

Sie können auf mehr warten als nur auf Zeit/Text:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Warten, bis ein Selector sichtbar wird:
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
5. Für tiefgehendes Debugging: Zeichnen Sie eine Trace auf:
   - `openclaw browser trace start`
   - Reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tools vorgesehen.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Rollen-Snapshots in JSON enthalten `refs` plus einen kleinen `stats`-Block (Zeilen/Zeichen/Refs/interaktiv), damit Tools Größe und Dichte der Payload einschätzen können.

## Status- und Umgebungsregler

Diese sind nützlich für Workflows nach dem Muster „Website wie X verhalten lassen“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Speicher: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (das ältere `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Locale: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevoreinstellungen)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das openclaw-Browser-Profil kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann
  dies steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Hinweise zu Anmeldungen und Anti-Bot-Themen (X/Twitter usw.) finden Sie unter [Browser-Anmeldung + Posting auf X/Twitter](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (loopback oder nur tailnet).
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
- [Browser-Anmeldung](/de/tools/browser-login) - Anmeldung bei Websites
- [Browser-Linux-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)
- [Browser-WSL2-Fehlerbehebung](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
