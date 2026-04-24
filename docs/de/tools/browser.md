---
read_when:
    - Hinzufügen von agentgesteuerter Browser-Automatisierung
    - Debuggen, warum openclaw Ihren eigenen Chrome beeinträchtigt
    - Implementierung von Browser-Einstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browser-Control-Service + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-24T09:01:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Control-Service innerhalb des Gateway verwaltet (nur loopback).

Ansicht für Einsteiger:

- Betrachten Sie es als einen **separaten Browser nur für den Agenten**.
- Das Profil `openclaw` greift **nicht** auf Ihr persönliches Browser-Profil zu.
- Der Agent kann in einer sicheren Spur **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` bindet über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie erhalten

- Ein separates Browser-Profil namens **openclaw** (standardmäßig mit orangem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agent-Aktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung mehrerer Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr täglicher Hauptbrowser. Er ist eine sichere, isolierte Oberfläche für
Agent-Automatisierung und Verifikation.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent sagt, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder fehlendes Tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das Standard-Tool `browser` ist ein gebündeltes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben Tool-Namen `browser` registriert:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Die Standardwerte benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn Sie nur das Plugin deaktivieren, werden die CLI `openclaw browser`, die Gateway-Methode `browser.request`, das Agent-Tool und der Control-Service als Einheit entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browser-Konfiguration erfordern einen Gateway-Neustart, damit das Plugin seinen Service erneut registrieren kann.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, ist die übliche Ursache eine `plugins.allow`-Liste, in der `browser` fehlt. Fügen Sie es hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Allowlist-Mitgliedschaft nicht — die Allowlist steuert das Laden von Plugins, und die Tool-Richtlinie greift erst nach dem Laden. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls den Standard wieder her.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anbindungsprofil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer sitzt, um eine eventuelle Anbindungsabfrage zu klicken/zu bestätigen.
- `profile` ist der explizite Override, wenn Sie einen bestimmten Browser-Modus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

## Konfiguration

Die Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // Legacy-Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // Legacy-Override für ein einzelnes Profil
    remoteCdpTimeoutMs: 1500, // Remote-CDP-HTTP-Timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // Timeout für Remote-CDP-WebSocket-Handshake (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Ports und Erreichbarkeit">

- Der Control-Service bindet an loopback auf einem Port, der von `gateway.port` abgeleitet wird (Standard `18791` = Gateway + 2). Wenn `gateway.port` oder `OPENCLAW_GATEWAY_PORT` überschrieben wird, verschieben sich die abgeleiteten Ports in derselben Familie.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn er nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für HTTP-Erreichbarkeitsprüfungen von Remote-CDP (nicht-loopback); `remoteCdpHandshakeTimeoutMs` gilt für WebSocket-Handshakes von Remote-CDP.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browser-Navigation und Open-Tab werden vor der Navigation durch SSRF geschützt und danach nach bestem Bemühen erneut gegen die endgültige `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch Remote-CDP-Endpunkterkennung und `/json/version`-Abfragen (`cdpUrl`) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browser-Zugriff auf private Netzwerke absichtlich vertrauenswürdig ist.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, dass niemals ein lokaler Browser gestartet wird; es wird nur angebunden, wenn bereits einer läuft.
- `color` (auf oberster Ebene und pro Profil) färbt die Browser-Oberfläche ein, sodass Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwalteter eigenständiger Browser). Verwenden Sie `defaultProfile: "user"`, um sich standardmäßig für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge für Auto-Erkennung: Standardbrowser des Systems, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie für diesen Treiber nicht `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein existing-session-Profil an ein nicht standardmäßiges Chromium-Benutzerprofil (Brave, Edge usw.) angebunden werden soll.

</Accordion>

</AccordionGroup>

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Standardbrowser des Systems** Chromium-basiert ist (Chrome/Brave/Edge/etc.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
Auto-Erkennung zu überschreiben:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Oder setzen Sie es in der Konfiguration, je nach Plattform:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Control-Service und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf der Maschine aus, auf der sich der Browser befindet; das Gateway leitet Browser-Aktionen per Proxy dorthin weiter.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  eine Verbindung zu einem Remote-Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Stop-Verhalten unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browser-Prozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Control-Sitzung und hebt Playwright-/CDP-Emulations-Overrides auf (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlicher Status), auch
  wenn kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Auth enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP-Basic-Auth (z. B. `https://user:pass@provider.example`)

OpenClaw bewahrt die Auth beim Aufruf von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket. Bevorzugen Sie Umgebungsvariablen oder Secret-Manager für
Token, statt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (standardmäßig ohne Konfiguration)

Wenn Sie einen **Node-Host** auf der Maschine ausführen, auf der sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe automatisch an diesen Node weiterleiten, ohne zusätzliche Browser-Konfiguration.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Control-Server über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das Legacy-/Standardverhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur Profile in der Allowlist können angesprochen werden, und Routen zum Erstellen/Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie es, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Service, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein Remote-Browser-Profil ist die einfachste Option die direkte WebSocket-URL
aus der Verbindungsdokumentation von Browserless.

Beispiel:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Hinweise:

- Ersetzen Sie `<BROWSERLESS_API_KEY>` durch Ihr echtes Browserless-Token.
- Wählen Sie den Regionsendpunkt, der zu Ihrem Browserless-Konto passt (siehe deren Dokumentation).
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder in
  `wss://` für eine direkte CDP-Verbindung umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

## Direkte WebSocket-CDP-Anbieter

Einige gehostete Browser-Services stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
Formen von CDP-URLs und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Bloße WebSocket-Roots** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst eine HTTP-
  `/json/version`-Erkennung (wobei das Schema auf `http`/`https` normalisiert wird);
  wenn die Erkennung eine `webSocketDebuggerUrl` zurückgibt, wird diese verwendet, andernfalls greift OpenClaw
  auf einen direkten WebSocket-Handshake an der bloßen Root zurück. Dadurch kann ein
  bloßes `ws://`, das auf einen lokalen Chrome zeigt, weiterhin verbinden, da Chrome WebSocket-Upgrades nur auf dem spezifischen Pfad pro Ziel aus
  `/json/version` akzeptiert.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential
Proxies.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Hinweise:

- [Registrieren Sie sich](https://www.browserbase.com/sign-up) und kopieren Sie Ihren **API Key**
  aus dem [Overview-Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Session, daher ist
  kein manueller Schritt zur Session-Erstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Session und eine Browser-Stunde pro Monat.
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits der kostenpflichtigen Tarife.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Ideen:

- Browser-Steuerung ist nur über loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateway oder Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP-Basic-Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren diese eigenständige loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert ist, erzeugt OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw erzeugt dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exponierung.
- Behandeln Sie Remote-CDP-URLs/-Tokens als Geheimnisse; bevorzugen Sie Env-Variablen oder einen Secret-Manager.

Tipps zu Remote-CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Tokens.
- Vermeiden Sie es, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (Multi-Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browser-Instanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Session**: Ihr bestehendes Chrome-Profil über automatisches Verbinden mit Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für die Anbindung bestehender Sessions über Chrome MCP integriert.
- Existing-session-Profile sind zusätzlich zu `user` Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Das Löschen eines Profils verschiebt sein lokales Datenverzeichnis in den Papierkorb.

Alle Control-Endpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Existing-session über Chrome DevTools MCP

OpenClaw kann auch an ein laufendes Chromium-basiertes Browser-Profil über den
offiziellen Chrome-DevTools-MCP-Server anbinden. Dadurch werden die Tabs und der Login-Status
wiederverwendet, die bereits in diesem Browser-Profil geöffnet sind.

Offizielle Hintergründe und Setup-Referenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet automatisches Verbinden per Chrome MCP und zielt auf das
  lokale Standardprofil von Google Chrome.

Verwenden Sie `userDataDir` für Brave, Edge, Chromium oder ein nicht standardmäßiges Chrome-Profil:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Dann im passenden Browser:

1. Öffnen Sie die Inspektionsseite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser weiterlaufen und genehmigen Sie die Verbindungsabfrage, wenn OpenClaw anbindet.

Häufige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Anbindungs-Smoke-Test:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

So sieht Erfolg aus:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Refs aus dem ausgewählten Live-Tab zurück

Was Sie prüfen sollten, wenn die Anbindung nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Anbindungs-Zustimmungsabfrage angezeigt und Sie haben sie bestätigt
- `openclaw doctor` migriert alte Browser-Konfigurationen auf Basis von Erweiterungen und prüft, dass
  Chrome lokal für Standardprofile mit Auto-Connect installiert ist, kann aber
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Verwendung durch Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browser-Status des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-session-Profil verwenden, geben Sie diesen expliziten Profilnamen an.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer sitzt, um die Anbindungs-
  abfrage zu genehmigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist riskanter als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browser-Session handeln kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es bindet nur an.
- OpenClaw verwendet hier den offiziellen Chrome DevTools MCP-`--autoConnect`-Flow. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um auf dieses User-Data-Verzeichnis zu zielen.
- Existing-session kann auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anbinden. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie stattdessen
  Remote-CDP oder einen Node-Host.

<Accordion title="Einschränkungen der Existing-session-Funktion">

Im Vergleich zum verwalteten Profil `openclaw` sind Existing-session-Treiber stärker eingeschränkt:

- **Screenshots** — Seitenerfassungen und Elementerfassungen mit `--ref` funktionieren; CSS-`--element`-Selektoren jedoch nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Playwright ist für seiten- oder ref-basierte Element-Screenshots nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Refs (keine CSS-Selektoren). `click` unterstützt nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Upload / Dialog** — `wait --url` unterstützt exakte, Teilstring- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, kein CSS-`element`. Dialog-Hooks unterstützen keine Timeout-Overrides.
- **Nur verwaltete Features** — Batch-Aktionen, PDF-Export, Download-Interception und `responsebody` erfordern weiterhin den verwalteten Browser-Pfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: greift niemals auf Ihr persönliches Browser-Profil zu.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: Zielsteuerung von Tabs über `targetId`, nicht über „letzter Tab“.

## Browser-Auswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren Browser:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: sucht nach `google-chrome`, `brave`, `microsoft-edge`, `chromium` usw.
- Windows: prüft gängige Installationsorte.

## Control API (optional)

Für Skripting und Debugging stellt das Gateway eine kleine **nur über loopback erreichbare HTTP-
Control-API** sowie eine passende CLI `openclaw browser` bereit (Snapshots, Refs, Wait-
Erweiterungen, JSON-Ausgabe, Debug-Workflows). Siehe
[Browser Control API](/de/tools/browser-control) für die vollständige Referenz.

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap Chromium) siehe
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für Split-Host-Setups mit WSL2-Gateway + Windows-Chrome siehe
[Fehlerbehebung für WSL2 + Windows + Remote Chrome CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. Navigations-SSRF-Block

Dies sind unterschiedliche Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Control-Ebene funktionsfähig ist.
- **Navigations-SSRF-Block** bedeutet, dass die Browser-Control-Ebene funktionsfähig ist, aber ein Ziel für die Seitennavigation von der Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigations-SSRF-Block:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungs-Flows schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden Fälle zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Control-Ebene weiterhin nicht funktionsfähig. Behandeln Sie dies als Problem mit der CDP-Erreichbarkeit, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Control-Ebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder an der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Pfad für die verwaltete Browser-Steuerung funktionsfähig.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fail-closed-SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal verwaltete loopback-Profil `openclaw` überspringen CDP-Health-Checks absichtlich die Durchsetzung der Browser-SSRF-Erreichbarkeit für die eigene lokale Control-Ebene von OpenClaw.
- Navigationsschutz ist separat. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel für `open` oder `navigate` erlaubt ist.

Sicherheitsempfehlung:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breit gefasstem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in absichtlich vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browser-Profil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser läuft.
  - In sandboxed Sessions erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: sandboxed Sessions verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sessions standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin geroutet werden, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dies hält den Agenten deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in sandboxed Umgebungen
- [Security](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
