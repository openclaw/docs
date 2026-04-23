---
read_when:
    - Agent-gesteuerte Browser-Automatisierung hinzufügen.
    - Debuggen, warum openclaw Ihren eigenen Chrome stört.
    - Browser-Einstellungen + Lebenszyklus in der macOS-App implementieren
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-23T06:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (von openclaw verwaltet)

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Steuerungsdienst im Gateway verwaltet (nur loopback).

Ansicht für Einsteiger:

- Betrachten Sie es als einen **separaten Browser nur für den Agenten**.
- Das Profil `openclaw` berührt **nicht** Ihr persönliches Browserprofil.
- Der Agent kann in einer sicheren Lane **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` hängt sich über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agent-Aktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Daily Driver. Er ist eine sichere, isolierte Oberfläche für
Agent-Automatisierung und Verifizierung.

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

Das Standard-Tool `browser` ist jetzt ein gebündeltes Plugin, das standardmäßig
aktiviert ausgeliefert wird. Das bedeutet, dass Sie es deaktivieren oder ersetzen können, ohne den Rest des
Plugin-Systems von OpenClaw zu entfernen:

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

Deaktivieren Sie das gebündelte Plugin, bevor Sie ein anderes Plugin installieren, das
denselben Tool-Namen `browser` bereitstellt. Das Standard-Browser-Erlebnis benötigt beides:

- `plugins.entries.browser.enabled` darf nicht deaktiviert sein
- `browser.enabled=true`

Wenn Sie nur das Plugin deaktivieren, verschwinden die gebündelte Browser-CLI (`openclaw browser`),
die Gateway-Methode (`browser.request`), das Agent-Tool und der Standard-Browser-Steuerungsdienst gemeinsam. Ihre `browser.*`-Konfiguration bleibt intakt, damit ein
Ersatz-Plugin sie wiederverwenden kann.

Das gebündelte Browser-Plugin besitzt jetzt auch die Browser-Laufzeitimplementierung.
Der Core behält nur gemeinsam genutzte Plugin-SDK-Helfer plus Kompatibilitäts-Re-Exports für
ältere interne Importpfade. In der Praxis entfernt das Entfernen oder Ersetzen des Browser-
Plugin-Pakets den Browser-Funktionsumfang, statt eine zweite Core-eigene Laufzeit zurückzulassen.

Änderungen an der Browser-Konfiguration erfordern weiterhin einen Gateway-Neustart, damit das gebündelte Plugin
seinen Browser-Dienst mit den neuen Einstellungen erneut registrieren kann.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade plötzlich ein unbekannter Befehl ist oder
der Agent meldet, dass das Browser-Tool fehlt, ist die häufigste Ursache eine
restriktive `plugins.allow`-Liste, die `browser` nicht enthält.

Beispiel für fehlerhafte Konfiguration:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Beheben Sie das, indem Sie `browser` zur Plugin-Zulassungsliste hinzufügen:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Wichtige Hinweise:

- `browser.enabled=true` allein reicht nicht aus, wenn `plugins.allow` gesetzt ist.
- `plugins.entries.browser.enabled=true` allein reicht ebenfalls nicht aus, wenn `plugins.allow` gesetzt ist.
- `tools.alsoAllow: ["browser"]` lädt das gebündelte Browser-Plugin **nicht**. Es passt nur die Tool-Richtlinie an, nachdem das Plugin bereits geladen wurde.
- Wenn Sie keine restriktive Plugin-Zulassungsliste benötigen, stellt auch das Entfernen von `plugins.allow` das Standardverhalten des gebündelten Browsers wieder her.

Typische Symptome:

- `openclaw browser` ist ein unbekannter Befehl.
- `browser.request` fehlt.
- Der Agent meldet das Browser-Tool als nicht verfügbar oder fehlend.

## Profile: `openclaw` vs. `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Profile zum Anhängen an Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: den isolierten Browser `openclaw` verwenden.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Rechner sitzt, um gegebenenfalls auf eine Attach-Aufforderung zu klicken/zu bestätigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig möchten.

## Konfiguration

Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
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

Hinweise:

- Der Browser-Steuerungsdienst bindet an loopback auf einem Port, der aus `gateway.port`
  abgeleitet wird (Standard: `18791`, also Gateway + 2).
- Wenn Sie den Gateway-Port überschreiben (`gateway.port` oder `OPENCLAW_GATEWAY_PORT`),
  verschieben sich die abgeleiteten Browser-Ports, damit sie in derselben „Familie“ bleiben.
- `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn nicht gesetzt.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen von entferntem (nicht loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` gilt für Erreichbarkeitsprüfungen des WebSocket-Handshakes von entferntem CDP.
- Browser-Navigation/Tab-Öffnen ist vor der Navigation durch SSRF geschützt und wird nach der Navigation best effort anhand der finalen `http(s)`-URL erneut geprüft.
- Im strikten SSRF-Modus werden auch Discovery/Probes für entfernte CDP-Endpunkte (`cdpUrl`, einschließlich `/json/version`-Lookups) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert. Setzen Sie es nur dann auf `true`, wenn Sie Browser-Zugriff im privaten Netzwerk bewusst vertrauen.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt aus Kompatibilitätsgründen als Legacy-Alias unterstützt.
- `attachOnly: true` bedeutet „niemals einen lokalen Browser starten; nur anhängen, wenn er bereits läuft.“
- `color` + `color` pro Profil färben die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Standardprofil ist `openclaw` (von OpenClaw verwalteter eigenständiger Browser). Verwenden Sie `defaultProfile: "user"`, um sich stattdessen bewusst für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge der automatischen Erkennung: Standardbrowser des Systems, wenn Chromium-basiert; sonst Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu — setzen Sie diese nur für Remote-CDP.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie
  `cdpUrl` für diesen Treiber nicht.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein existing-session-Profil
  an ein nicht standardmäßiges Chromium-Benutzerprofil wie Brave oder Edge angehängt werden soll.

## Brave (oder einen anderen Chromium-basierten Browser) verwenden

Wenn Ihr **Standardbrowser des Systems** Chromium-basiert ist (Chrome/Brave/Edge/etc),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben:

CLI-Beispiel:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Lokale vs. entfernte Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Entfernte Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway proxyt Browser-Aktionen dorthin.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich an einen entfernten Chromium-basierten Browser anzuhängen. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Stop-Verhalten unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` beendet den Browser-Prozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und hebt Emulations-Überschreibungen von Playwright/CDP (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlichen Zustand) wieder auf,
  obwohl kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Tokens (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw bewahrt die Authentifizierung beim Aufruf von Endpunkten `/json/*` und beim Verbinden
mit dem CDP-WebSocket. Bevorzugen Sie Umgebungsvariablen oder Secret-Manager für
Tokens, statt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browser-Konfiguration automatisch zu dieser Node routen.
Dies ist der Standardpfad für entfernte Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen Konfiguration `browser.profiles` der Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das Legacy-/Standardverhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur allowlistete Profile können angesprochen werden, und Routen zum Erstellen/Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren, wenn Sie das nicht möchten:
  - Auf der Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein Remote-Browserprofil ist die einfachste Option die direkte WebSocket-URL
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
- Wählen Sie den Regionalendpunkt, der zu Ihrem Browserless-Konto passt (siehe deren Doku).
- Wenn Browserless Ihnen eine HTTPS-Base-URL gibt, können Sie sie entweder in
  `wss://` für eine direkte CDP-Verbindung umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt bereit statt
der standardmäßigen HTTP-basierten CDP-Discovery (`/json/version`). OpenClaw akzeptiert drei
Formen von CDP-URLs und wählt automatisch die richtige Verbindungsstrategie aus:

- **HTTP(S)-Discovery** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Einfache WebSocket-Wurzeln** — `ws://host[:port]` oder `wss://host[:port]` ohne
  Pfad `/devtools/...` (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst HTTP-
  Discovery über `/json/version` (mit Normalisierung des Schemas zu `http`/`https`);
  wenn die Discovery ein `webSocketDebuggerUrl` zurückgibt, wird dieses verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake an der einfachen Wurzel zurück. Das deckt
  sowohl Remote-Debug-Ports im Chrome-Stil als auch reine WebSocket-Provider ab.

Reine `ws://host:port` / `wss://host:port` ohne Pfad `/devtools/...`,
die auf eine lokale Chrome-Instanz zeigen, werden über das Discovery-First-
Fallback unterstützt — Chrome akzeptiert WebSocket-Upgrades nur auf dem spezifischen Pfad pro Browser
oder pro Ziel, der von `/json/version` zurückgegeben wird; ein Handshake allein an der einfachen Wurzel
würde also fehlschlagen.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential-
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

- [Registrieren Sie sich](https://www.browserbase.com/sign-up) und kopieren Sie Ihren **API-Schlüssel**
  aus dem [Overview-Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt automatisch eine Browser-Sitzung beim WebSocket-Connect, daher ist kein
  manueller Schritt zur Sitzungserstellung nötig.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Pläne.
- Siehe die [Browserbase-Doku](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Leitfäden und Integrationsbeispiele.

## Sicherheit

Zentrale Ideen:

- Browser-Steuerung ist nur über loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateways oder Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identity-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert ist, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und persistiert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode`
  bereits `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exposition.
- Behandeln Sie Remote-CDP-URLs/Tokens als Secrets; bevorzugen Sie Umgebungsvariablen oder einen Secret-Manager.

Tipps zu Remote-CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Tokens.
- Vermeiden Sie es, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von openclaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über Auto-Connect von Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für Existing-Session-Attach per Chrome MCP integriert.
- Existing-Session-Profile sind zusätzlich zu `user` Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Das Löschen eines Profils verschiebt sein lokales Datenverzeichnis in den Papierkorb.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Existing-Session über Chrome DevTools MCP

OpenClaw kann sich auch an ein laufendes Chromium-basiertes Browserprofil über den
offiziellen Chrome-DevTools-MCP-Server anhängen. Dadurch werden die Tabs und der Anmeldestatus
wiederverwendet, die in diesem Browserprofil bereits geöffnet sind.

Offizielle Hintergründe und Referenzen zur Einrichtung:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-Session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet Auto-Connect per Chrome MCP, das auf das
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

Dann im entsprechenden Browser:

1. Öffnen Sie die Inspektionsseite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser laufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Gängige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Attach-Smoke-Test:

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

Was Sie prüfen sollten, wenn das Anhängen nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Aufforderung zur Zustimmung zum Anhängen angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte Browser-Konfiguration auf Basis von Erweiterungen und prüft, dass
  Chrome lokal für Standardprofile mit Auto-Connect installiert ist, kann aber
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Nutzung durch den Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserzustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-Session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Rechner sitzt, um die Attach-
  Aufforderung zu bestätigen.
- Das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist riskanter als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer angemeldeten Browser-Sitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an eine
  bestehende Sitzung an.
- OpenClaw verwendet hier den offiziellen Chrome-DevTools-MCP-`--autoConnect`-Ablauf. Wenn
  `userDataDir` gesetzt ist, reicht OpenClaw es weiter, um genau dieses
  Chromium-User-Data-Verzeichnis anzusteuern.
- Screenshots für Existing-Session unterstützen Seitenerfassungen und Element-
  Erfassungen per `--ref` aus Snapshots, aber keine CSS-Selektoren mit `--element`.
- Seitenscreenshots für Existing-Session funktionieren ohne Playwright über Chrome MCP.
  Element-Screenshots per Ref (`--ref`) funktionieren dort ebenfalls, aber `--full-page`
  kann nicht mit `--ref` oder `--element` kombiniert werden.
- Aktionen für Existing-Session sind weiterhin eingeschränkter als der Pfad für verwaltete Browser:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern
    Snapshot-Refs statt CSS-Selektoren
  - `click` unterstützt nur die linke Maustaste (keine Button-Overrides oder Modifikatoren)
  - `type` unterstützt kein `slowly=true`; verwenden Sie `fill` oder `press`
  - `press` unterstützt kein `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen
    keine Timeout-Überschreibungen pro Aufruf
  - `select` unterstützt derzeit nur einen einzelnen Wert
- Existing-Session `wait --url` unterstützt exakte, Teilstring- und Glob-Muster
  wie andere Browser-Treiber. `wait --load networkidle` wird noch nicht unterstützt.
- Upload-Hooks für Existing-Session erfordern `ref` oder `inputRef`, unterstützen jeweils eine Datei
  und unterstützen kein CSS-`element`-Targeting.
- Dialog-Hooks für Existing-Session unterstützen keine Timeout-Überschreibungen.
- Einige Funktionen erfordern weiterhin den Pfad für verwaltete Browser, darunter Batch-
  Aktionen, PDF-Export, Download-Abfangung und `responsebody`.
- Existing-Session kann sich auf dem ausgewählten Host oder über eine verbundene
  Browser-Node anhängen. Wenn Chrome anderswo läuft und keine Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: berührt niemals Ihr persönliches Browserprofil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungsabläufen zu verhindern.
- **Deterministische Tab-Steuerung**: Tabs per `targetId` ansteuern, nicht über „letzter Tab“.

## Browser-Auswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren:

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

Alle Endpunkte akzeptieren `?profile=<name>`.

Wenn Shared-Secret-Gateway-Authentifizierung konfiguriert ist, erfordern auch Browser-HTTP-Routen Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API konsumiert **nicht** Trusted-Proxy- oder
  Tailscale-Serve-Identity-Header.
- Wenn `gateway.auth.mode` `none` oder `trusted-proxy` ist, erben diese loopback-Browser-
  Routen diese Identitätsmodi nicht; halten Sie sie rein auf loopback beschränkt.

### Fehlervertrag von `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Richtlinienfehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle Werte für `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Aktions-Payload ist bei Normalisierung oder Validierung fehlgeschlagen.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder im Batch steht im Konflikt mit dem Ziel der Anfrage.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Aktion wird für Existing-Session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne ein
Feld `code` zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte einen
eindeutigen 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seitenscreenshots für den verwalteten Browser `openclaw`, wenn pro Tab ein CDP-
  WebSocket verfügbar ist
- Seitenscreenshots für Profile `existing-session` / Chrome MCP
- Ref-basierte Screenshots (`--ref`) für `existing-session` aus Snapshot-Ausgabe

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots / Role-Snapshots
- Element-Screenshots mit CSS-Selektor (`--element`)
- vollständiger PDF-Export des Browsers

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, reparieren Sie die Laufzeitabhängigkeiten
des gebündelten Browser-Plugins, damit `playwright-core` installiert ist,
und starten Sie dann das Gateway neu. Führen Sie bei paketierten Installationen `openclaw doctor --fix` aus.
Für Docker installieren Sie außerdem die Chromium-Browser-Binärdateien wie unten gezeigt.

#### Playwright-Installation in Docker

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (Konflikte durch npm-Overrides).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads zu persistieren, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder ein Bind-Mount persistent ist. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ablauf auf hoher Ebene:

- Ein kleiner **Steuerungsserver** akzeptiert HTTP-Anfragen.
- Er verbindet sich über **CDP** mit Chromium-basierten Browsern (Chrome/Brave/Edge/Chromium).
- Für fortgeschrittene Aktionen (klicken/tippen/Snapshot/PDF) verwendet er **Playwright** auf Basis
  von CDP.
- Wenn Playwright fehlt, sind nur Operationen ohne Playwright verfügbar.

Dieses Design gibt dem Agenten eine stabile, deterministische Schnittstelle und lässt Sie gleichzeitig lokale/entfernte Browser und Profile austauschen.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusteuern.
Alle Befehle akzeptieren außerdem `--json` für maschinenlesbare Ausgabe (stabile Payloads).

Grundlagen:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspektion:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Hinweis zum Lebenszyklus:

- Für Attach-only- und Remote-CDP-Profile ist `openclaw browser stop` weiterhin der
  richtige Bereinigungsbefehl nach Tests. Er schließt die aktive Steuerungssitzung und
  löscht temporäre Emulations-Overrides, statt den zugrunde liegenden
  Browser zu beenden.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Aktionen:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Zustand:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Hinweise:

- `upload` und `dialog` sind **Vorbereitungsaufrufe**; führen Sie sie vor dem Klick/Drücken aus,
  der den Auswahldialog/Dialog auslöst.
- Ausgabe-Pfade für Download und Trace sind auf OpenClaw-Temp-Roots beschränkt:
  - Traces: `/tmp/openclaw` (Fallback: `${os.tmpdir()}/openclaw`)
  - Downloads: `/tmp/openclaw/downloads` (Fallback: `${os.tmpdir()}/openclaw/downloads`)
- Upload-Pfade sind auf einen OpenClaw-Temp-Root für Uploads beschränkt:
  - Uploads: `/tmp/openclaw/uploads` (Fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` kann Dateieingaben auch direkt per `--input-ref` oder `--element` setzen.
- `snapshot`:
  - `--format ai` (Standard, wenn Playwright installiert ist): gibt einen AI-Snapshot mit numerischen Refs zurück (`aria-ref="<n>"`).
  - `--format aria`: gibt den Accessibility Tree zurück (keine Refs; nur zur Inspektion).
  - `--efficient` (oder `--mode efficient`): kompaktes Preset für Role-Snapshot (interactive + compact + depth + niedrigere maxChars).
  - Konfigurationsstandard (nur Tool/CLI): setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um effiziente Snapshots zu verwenden, wenn der Aufrufer keinen Modus übergibt (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
  - Role-Snapshot-Optionen (`--interactive`, `--compact`, `--depth`, `--selector`) erzwingen einen rollenbasierten Snapshot mit Refs wie `ref=e12`.
  - `--frame "<iframe selector>"` begrenzt Role-Snapshots auf ein iframe (kombiniert mit Rollen-Refs wie `e12`).
  - `--interactive` gibt eine flache, leicht auswählbare Liste interaktiver Elemente aus (am besten zum Steuern von Aktionen).
  - `--labels` fügt einen Screenshot nur des Viewports mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `click`/`type`/etc. erfordern einen `ref` aus `snapshot` (entweder numerisch `12` oder Rollen-Ref `e12`).
  CSS-Selektoren werden für Aktionen absichtlich nicht unterstützt.

## Snapshots und Refs

OpenClaw unterstützt zwei Arten von „Snapshots“:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot mit numerischen Refs.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird der Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Rollen-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/Struktur mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird der Ref über `getByRole(...)` (plus `nth()` bei Duplikaten) aufgelöst.
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit überlagerten `e12`-Labels einzuschließen.

Verhalten von Refs:

- Refs sind **über Navigationen hinweg nicht stabil**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen frischen Ref.
- Wenn der Role-Snapshot mit `--frame` erstellt wurde, sind Rollen-Refs bis zum nächsten Role-Snapshot auf dieses iframe beschränkt.

## Leistungsstarke Wait-Funktionen

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
2. `click <ref>` / `type <ref>` verwenden (im interaktiven Modus Rollen-Refs bevorzugen)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite merkwürdig verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefes Debugging: einen Trace aufzeichnen:
   - `openclaw browser trace start`
   - Problem reproduzieren
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (Zeilen/Zeichen/Refs/interaktiv), sodass Tools über Payload-Größe und Dichte nachdenken können.

## Regler für Zustand und Umgebung

Diese sind nützlich für Abläufe nach dem Muster „die Website soll sich wie X verhalten“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (Legacy `set headers --json '{"X-Debug":"1"}'` bleibt unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevorgaben)
  - `set viewport 1280 720`

## Sicherheit & Datenschutz

- Das Browserprofil openclaw kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt-Injection kann dies
  steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Logins und Anti-Bot-Hinweise (X/Twitter usw.) siehe [Browser-Login + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie Gateway/Node-Host privat (nur loopback oder tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für Strict Mode (private/interne Ziele standardmäßig blockieren):

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

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap-Chromium) siehe
[Fehlerbehebung für Browser](/de/tools/browser-linux-troubleshooting).

Für Setups mit WSL2-Gateway + Windows-Chrome auf getrennten Hosts siehe
[Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Blockierung bei Navigation

Dies sind verschiedene Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene funktionsfähig ist.
- **SSRF-Blockierung bei Navigation** bedeutet, dass die Browser-Steuerungsebene funktionsfähig ist, ein Ziel für die Seitennavigation aber durch die Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-Blockierung bei Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um beides voneinander zu trennen:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, prüfen Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin nicht funktionsfähig. Behandeln Sie das als Problem mit der CDP-Erreichbarkeit, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad des verwalteten Browsers funktionsfähig.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fail-closed-SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal über loopback verwaltete Profil `openclaw` überspringen CDP-Health-Prüfungen absichtlich die SSRF-Erreichbarkeitsdurchsetzung des Browsers für OpenClaws eigene lokale Steuerungsebene.
- Navigationsschutz ist davon getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel für `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` statt breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

Beispiel: Navigation blockiert, Steuerungsebene funktionsfähig

- `start` erfolgreich
- `tabs` erfolgreich
- `open http://internal.example` schlägt fehl

Das bedeutet in der Regel, dass der Browserstart in Ordnung ist und das Navigationsziel eine Richtlinienprüfung benötigt.

Beispiel: Start blockiert, bevor Navigation relevant wird

- `start` schlägt mit `not reachable after start` fehl
- `tabs` schlägt ebenfalls fehl oder kann nicht ausgeführt werden

Das weist auf Browserstart oder CDP-Erreichbarkeit hin, nicht auf ein Problem mit einer Allowlist für Seiten-URLs.

## Agent-Tools + Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Abbildung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot für click/type/drag/select.
- `browser screenshot` erfasst Pixel (gesamte Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sessions erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: Sandbox-Sessions verwenden standardmäßig `sandbox`, Sessions ohne Sandbox standardmäßig `host`.
  - Wenn eine browserfähige Node verbunden ist, kann das Tool automatisch dorthin routen, es sei denn, Sie pinnen `target="host"` oder `target="node"`.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
