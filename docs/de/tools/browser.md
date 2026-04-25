---
read_when:
    - Hinzufügen einer agentengesteuerten Browser-Automatisierung
    - Fehlersuche, warum openclaw Ihr eigenes Chrome beeinträchtigt
    - Implementierung von Browser-Einstellungen und -Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-25T13:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das vom Agenten gesteuert wird.  
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur local loopback).

Ansicht für Einsteiger:

- Stellen Sie es sich als **separaten, nur für den Agenten bestimmten Browser** vor.
- Das Profil `openclaw` greift **nicht** auf Ihr persönliches Browserprofil zu.
- Der Agent kann in einer sicheren Umgebung **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` bindet sich über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie erhalten

- Ein separates Browserprofil mit dem Namen **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Eine mitgelieferte Skill `browser-automation`, die Agenten den Snapshot-,
  Stable-Tab-, Stale-Ref- und Manual-Blocker-Wiederherstellungsablauf beibringt,
  wenn das Browser-Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr täglicher Standardbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifikation.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw doctor
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

Das Standard-Tool `browser` ist ein mitgeliefertes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben Tool-Namen `browser` registriert:

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

Für die Standardwerte müssen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true` gesetzt sein. Wenn nur das Plugin deaktiviert wird, entfernt das als eine Einheit die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, das Agenten-Tool und den Steuerungsdienst; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browser-Konfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Agentenhinweise

Das Browser-Plugin bringt zwei Ebenen von Agentenhinweisen mit:

- Die Tool-Beschreibung von `browser` enthält den kompakten, immer aktiven Vertrag: das
  richtige Profil wählen, Refs im selben Tab behalten, `tabId`/Labels für die
  Tab-Zielauswahl verwenden und bei mehrstufigen Aufgaben die Browser-Skill laden.
- Die mitgelieferte Skill `browser-automation` enthält den längeren Betriebsablauf:
  zuerst Status/Tabs prüfen, Aufgaben-Tabs beschriften, vor Aktionen einen Snapshot erstellen,
  nach UI-Änderungen erneut einen Snapshot erstellen, veraltete Refs einmal wiederherstellen
  und Login-/2FA-/Captcha- oder Kamera-/Mikrofon-Blocker als manuelle Aktion melden,
  statt zu raten.

Mit Plugins gebündelte Skills werden in den verfügbaren Skills des Agenten aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass
Routine-Turns nicht die vollen Token-Kosten tragen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, ist die übliche Ursache eine `plugins.allow`-Liste, in der `browser` fehlt. Fügen Sie es hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist nicht — die Allowlist steuert das Laden von Plugins, und die Tool-Richtlinie greift erst nach dem Laden. Wenn Sie `plugins.allow` vollständig entfernen, wird ebenfalls der Standard wiederhergestellt.

## Profile: `openclaw` vs. `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anbindungsprofil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe durch Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Rechner ist, um eventuell erscheinende Anbindungsaufforderungen zu klicken/zu bestätigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

## Konfiguration

Die Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // veralteter Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Einzelprofil-Überschreibung
    remoteCdpTimeoutMs: 1500, // HTTP-Timeout für Remote-CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // WebSocket-Handshake-Timeout für Remote-CDP (ms)
    localLaunchTimeoutMs: 15000, // Discovery-Timeout für lokal verwaltetes Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // Bereitschafts-Timeout für lokales verwaltetes CDP nach dem Start (ms)
    actionTimeoutMs: 60000, // Standard-Timeout für Browser-Aktionen (ms)
    tabCleanup: {
      enabled: true, // Standard: true
      idleMinutes: 120, // auf 0 setzen, um die Leerlaufbereinigung zu deaktivieren
      maxTabsPerSession: 8, // auf 0 setzen, um die Begrenzung pro Sitzung zu deaktivieren
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

- Der Steuerungsdienst bindet an local loopback auf einem von `gateway.port` abgeleiteten Port (Standard `18791` = Gateway + 2). Das Überschreiben von `gateway.port` oder `OPENCLAW_GATEWAY_PORT` verschiebt die abgeleiteten Ports innerhalb derselben Familie.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn es nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen per HTTP bei Remote-CDP (nicht-loopback); `remoteCdpHandshakeTimeoutMs` gilt für WebSocket-Handshakes bei Remote-CDP.
- `localLaunchTimeoutMs` ist das Zeitbudget dafür, dass ein lokal gestarteter verwalteter Chrome-
  Prozess seinen CDP-HTTP-Endpunkt bereitstellt. `localCdpReadyTimeoutMs` ist das
  nachgelagerte Zeitbudget für die Bereitschaft des CDP-WebSocket, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, günstigen VPS oder älterer Hardware, auf der Chromium
  langsam startet. Die Werte sind auf 120000 ms begrenzt.
- `actionTimeoutMs` ist das Standard-Zeitbudget für Browser-`act`-Anfragen, wenn der Aufrufer nicht `timeoutMs` übergibt. Der Client-Transport fügt ein kleines zusätzliches Zeitfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, statt an der HTTP-Grenze abzulaufen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browser-Sitzungen des primären Agenten geöffnet wurden. Die Lifecycle-Bereinigung von Subagent, Cron und ACP schließt ihre explizit verfolgten Tabs weiterhin am Sitzungsende; primäre Sitzungen halten aktive Tabs zur Wiederverwendung offen und schließen dann im Hintergrund inaktive oder überschüssige verfolgte Tabs.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browser-Navigation und Open-Tab werden vor der Navigation durch SSRF-Schutz abgesichert und danach nach Möglichkeit anhand der finalen `http(s)`-URL erneut geprüft.
- Im strikten SSRF-Modus werden auch die Discovery des Remote-CDP-Endpunkts und `/json/version`-Prüfungen (`cdpUrl`) geprüft.
- Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` des Gateway/Providers leiten den von OpenClaw verwalteten Browser nicht automatisch über einen Proxy. Verwaltetes Chrome startet standardmäßig direkt, damit Proxy-Einstellungen des Providers die Browser-SSRF-Prüfungen nicht abschwächen.
- Um den verwalteten Browser selbst über einen Proxy zu leiten, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, etwa `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Proxy-Routing für den Browser, sofern Browserzugriff auf private Netzwerke nicht absichtlich aktiviert wurde.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browserzugriff auf private Netzwerke ausdrücklich vertrauenswürdig ist.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; nur anbinden, wenn bereits einer läuft.
- `headless` kann global oder pro lokalem verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.headless`, sodass ein lokal gestartetes Profil headless bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokale verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration umzuschreiben. Existing-Session-, Attach-Only- und
  Remote-CDP-Profile lehnen diese Überschreibung ab, weil OpenClaw diese
  Browser-Prozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` verwenden lokale verwaltete Profile
  automatisch headless als Standard, wenn weder die Umgebung noch die Profil-/globale
  Konfiguration explizit den sichtbaren Modus auswählt. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt für lokale verwaltete Starts im
  aktuellen Prozess den Headless-Modus. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt den sichtbaren Modus für normale
  Starts und gibt auf Linux-Hosts ohne Display-Server einen umsetzbaren Fehler zurück;
  eine explizite Anfrage `start --headless` hat für diesen einen Start weiterhin Vorrang.
- `executablePath` kann global oder pro lokalem verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile unterschiedliche Chromium-basierte Browser starten können.
- `color` (auf oberster Ebene und pro Profil) färbt die Browser-Oberfläche ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwaltete eigenständige Instanz). Verwenden Sie `defaultProfile: "user"`, um sich standardmäßig für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge der automatischen Erkennung: Standard-Systembrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein Existing-Session-Profil an ein nicht standardmäßiges Chromium-Benutzerprofil angebunden werden soll (Brave, Edge usw.).

</Accordion>

</AccordionGroup>

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Standard-Systembrowser** Chromium-basiert ist (Chrome/Brave/Edge usw.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben. `~` wird zu Ihrem Home-Verzeichnis des Betriebssystems erweitert:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Oder setzen Sie es in der Konfiguration, pro Plattform:

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

`executablePath` pro Profil wirkt sich nur auf lokale verwaltete Profile aus, die OpenClaw
startet. Profile vom Typ `existing-session` binden sich stattdessen an einen bereits laufenden Browser
an, und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale vs. entfernte Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den local-loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Entfernte Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway leitet Browser-Aktionen dorthin weiter.
- **Remote CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich an einen entfernten Chromium-basierten Browser anzubinden. In diesem Fall startet OpenClaw keinen lokalen Browser.
- `headless` betrifft nur lokale verwaltete Profile, die OpenClaw startet. Es startet vorhandene Session- oder Remote-CDP-Browser weder neu noch ändert es sie.
- `executablePath` folgt derselben Regel für lokale verwaltete Profile. Wenn es bei einem
  laufenden lokalen verwalteten Profil geändert wird, wird dieses Profil zum Neustart/Abgleich markiert, damit
  der nächste Start die neue Binärdatei verwendet.

Das Stopp-Verhalten unterscheidet sich je nach Profilmodus:

- lokale verwaltete Profile: `openclaw browser stop` stoppt den Browser-Prozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und hebt Playwright-/CDP-Emulationsüberschreibungen auf (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlicher Zustand), auch
  wenn kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei Aufrufen von `/json/*`-Endpunkten und bei der Verbindung
zum CDP-WebSocket bei. Verwenden Sie für Token bevorzugt Umgebungsvariablen oder Secret-Manager,
statt sie in Konfigurationsdateien einzuchecken.

## Node-Browser-Proxy (standardmäßig ohne Konfiguration)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe automatisch an diesen Node weiterleiten, ohne zusätzliche Browser-Konfiguration.
Dies ist der Standardpfad für entfernte Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das veraltete/standardmäßige Verhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur auf der Allowlist stehende Profile können angesprochen werden, und Routen zum Erstellen/Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein entferntes Browserprofil ist die einfachste Option die direkte WebSocket-URL
aus der Browserless-Verbindungsdokumentation.

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
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder für eine direkte CDP-Verbindung in
  `wss://` umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

## Direkte WebSocket-CDP-Anbieter

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
CDP-URL-Formen und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Reine WebSocket-Roots** — `ws://host[:port]` oder `wss://host[:port]` ohne
  Pfad `/devtools/...` (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst die HTTP-
  `/json/version`-Erkennung (mit Normalisierung des Schemas auf `http`/`https`);
  wenn die Erkennung eine `webSocketDebuggerUrl` zurückgibt, wird sie verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake am Root zurück. Dadurch kann ein
  reines `ws://`, das auf ein lokales Chrome zeigt, trotzdem verbunden werden, da Chrome nur
  WebSocket-Upgrades auf dem spezifischen Pfad pro Ziel aus
  `/json/version` akzeptiert.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Tarnmodus und Residential
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
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Key.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zur Sitzungserstellung erforderlich.
- Der Free-Tier erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Informationen zu den Limits kostenpflichtiger Tarife finden Sie unter [pricing](https://www.browserbase.com/pricing).
- Die vollständige API-
  Referenz, SDK-Leitfäden und Integrationsbeispiele finden Sie in der [Browserbase-Dokumentation](https://docs.browserbase.com).

## Sicherheit

Wichtige Konzepte:

- Die Browser-Steuerung ist auf loopback beschränkt; der Zugriff erfolgt über die Authentifizierung des Gateway oder das Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitätsheader und `gateway.auth.mode: "trusted-proxy"`
  authentifizieren diese eigenständige loopback-Browser-API **nicht**.
- Wenn die Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, erzeugt OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw erzeugt dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exponierung.
- Behandeln Sie Remote-CDP-URLs/-Tokens als Geheimnisse; bevorzugen Sie Umgebungsvariablen oder einen Secret-Manager.

Hinweise zu Remote-CDP:

- Bevorzugen Sie nach Möglichkeit verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über automatische Anbindung per Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für die Existing-Session-Anbindung per Chrome MCP integriert.
- Existing-Session-Profile sind zusätzlich zu `user` ein Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Das Löschen eines Profils verschiebt dessen lokales Datenverzeichnis in den Papierkorb.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anbinden. Dadurch werden die bereits in diesem Browserprofil
geöffneten Tabs und der vorhandene Login-Status wiederverwendet.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-Session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Anbindung per Chrome MCP, die auf das
  lokale Standardprofil von Google Chrome zielt.

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
3. Lassen Sie den Browser weiterlaufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anbindet.

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

- Der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- Der Browser hat die Anbindungs-Einwilligungsaufforderung angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte browserbezogene Konfigurationen auf Basis von Erweiterungen und prüft, ob
  Chrome lokal für Standardprofile mit automatischer Anbindung installiert ist, kann jedoch
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Verwendung durch Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserstatus des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-Session-Profil verwenden, übergeben Sie dessen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Rechner ist, um die Anbindungs-
  aufforderung zu bestätigen.
- Das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browser-Sitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es bindet sich nur an.
- OpenClaw verwendet hier den offiziellen Ablauf `--autoConnect` von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um dieses User-Data-Verzeichnis anzusprechen.
- Existing-Session kann sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anbinden. Wenn sich Chrome anderswo befindet und kein Browser-Node verbunden ist, verwenden Sie stattdessen
  Remote CDP oder einen Node-Host.

### Benutzerdefinierter Start von Chrome MCP

Überschreiben Sie den pro Profil gestarteten Chrome-DevTools-MCP-Server, wenn der Standardablauf
`npx chrome-devtools-mcp@latest` nicht Ihren Anforderungen entspricht (Offline-Hosts,
fest angeheftete Versionen, mitgelieferte Binärdateien):

| Feld         | Funktion                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die anstelle von `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt. |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` für ein Existing-Session-Profil gesetzt ist, überspringt OpenClaw
`--autoConnect` und übergibt den Endpunkt automatisch an Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (DevTools-HTTP-Erkennungsendpunkt).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` beim Start von Chrome MCP ignoriert, da Chrome MCP sich an den
laufenden Browser hinter dem Endpunkt anbindet, anstatt ein Profil-
verzeichnis zu öffnen.

<Accordion title="Funktionsbeschränkungen von Existing-Session">

Im Vergleich zum verwalteten Profil `openclaw` sind Existing-Session-Treiber stärker eingeschränkt:

- **Screenshots** — Seitenaufnahmen und Elementaufnahmen mit `--ref` funktionieren; CSS-Selektoren mit `--element` jedoch nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Für seiten- oder ref-basierte Element-Screenshots ist Playwright nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Refs (keine CSS-Selektoren). `click-coords` klickt auf sichtbare Viewport-Koordinaten und erfordert keinen Snapshot-Ref. `click` unterstützt nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Upload / Dialog** — `wait --url` unterstützt exakte, Teilstring- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei gleichzeitig, kein CSS-`element`. Dialog-Hooks unterstützen keine Timeout-Überschreibungen.
- **Nur verwaltete Funktionen** — Batch-Aktionen, PDF-Export, Download-Abfangung und `responsebody` erfordern weiterhin den Pfad über den verwalteten Browser.

</Accordion>

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: Berührt niemals Ihr persönliches Browserprofil.
- **Dedizierte Ports**: Vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, dann
  stabile `tabId`-Handles wie `t1`, optionale Labels und die rohe `targetId`.
  Agenten sollten `suggestedTargetId` wiederverwenden; rohe IDs bleiben für
  Debugging und Kompatibilität verfügbar.

## Browserauswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren Browser:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: prüft gängige Speicherorte für Chrome/Brave/Edge/Chromium unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser`.
- Windows: prüft gängige Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt das Gateway eine kleine **nur über loopback erreichbare HTTP-
Steuerungs-API** sowie eine passende `openclaw browser`-CLI bereit (Snapshots, Refs, Wait-
Erweiterungen, JSON-Ausgabe, Debug-Workflows). Siehe
[Browser control API](/de/tools/browser-control) für die vollständige Referenz.

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap-Chromium) siehe
[Browser troubleshooting](/de/tools/browser-linux-troubleshooting).

Für Setups mit Gateway unter WSL2 + Chrome unter Windows auf getrennten Hosts siehe
[WSL2 + Windows + Fehlerbehebung für Remote Chrome CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Blockierung bei Navigation

Dies sind unterschiedliche Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitstellungsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene funktionsfähig ist.
- **SSRF-Blockierung bei Navigation** bedeutet, dass die Browser-Steuerungsebene funktionsfähig ist, aber ein Seitennavigationsziel durch die Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitstellungsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-Blockierung bei Navigation:
  - Abläufe mit `open`, `navigate`, Snapshot oder Tab-Öffnung schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um beides zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin nicht funktionsfähig. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder an der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad des verwalteten Browsers funktionsfähig.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein Fail-Closed-SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal per loopback erreichbare verwaltete Profil `openclaw` überspringen CDP-Zustandsprüfungen absichtlich die SSRF-Erreichbarkeitsdurchsetzung des Browsers für OpenClaws eigene lokale Steuerungsebene.
- Der Navigationsschutz ist getrennt. Ein erfolgreiches Ergebnis bei `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel bei `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Schwächen Sie die SSRF-Richtlinie des Browsers **nicht** standardmäßig ab.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` statt breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in ausdrücklich vertrauenswürdigen Umgebungen, in denen Browserzugriff auf private Netzwerke erforderlich und überprüft ist.

## Agenten-Tools + Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt eine stabile UI-Struktur zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (gesamte Seite, Element oder beschriftete Refs).
- `browser doctor` prüft Gateway, Plugin, Profil, Browser und Tab-Bereitschaft.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil zu wählen (openclaw, chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin routen, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agenten-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in Sandbox-Umgebungen
- [Security](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
