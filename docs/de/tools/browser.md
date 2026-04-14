---
read_when:
    - Hinzufügen einer agentengesteuerten Browser-Automatisierung
    - Fehlerbehebung, warum openclaw Ihren eigenen Chrome beeinträchtigt
    - Implementierung von Browser-Einstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-14T13:04:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# Browser (von openclaw verwaltet)

OpenClaw kann ein **dediziertes Chrome/Brave/Edge/Chromium-Profil** ausführen, das vom Agenten gesteuert wird.
Es ist von Ihrem persönlichen Browser getrennt und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur loopback).

Ansicht für Einsteiger:

- Stellen Sie es sich als einen **separaten Browser nur für Agenten** vor.
- Das Profil `openclaw` greift **nicht** auf Ihr persönliches Browserprofil zu.
- Der Agent kann in einer sicheren Spur **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` verbindet sich über Chrome MCP mit Ihrer echten angemeldeten Chrome-Sitzung.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr täglicher Hauptbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifizierung.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder fehlendes Tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das Standard-Tool `browser` ist jetzt ein gebündeltes Plugin, das standardmäßig
aktiviert ist. Das bedeutet, dass Sie es deaktivieren oder ersetzen können, ohne den Rest des
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

Deaktivieren Sie das gebündelte Plugin, bevor Sie ein anderes Plugin installieren, das denselben
`browser`-Tool-Namen bereitstellt. Für die Standard-Browser-Erfahrung werden beide benötigt:

- `plugins.entries.browser.enabled` nicht deaktiviert
- `browser.enabled=true`

Wenn Sie nur das Plugin deaktivieren, verschwinden das gebündelte Browser-CLI (`openclaw browser`),
die Gateway-Methode (`browser.request`), das Agenten-Tool und der Standard-Browser-Steuerungsdienst
gemeinsam. Ihre `browser.*`-Konfiguration bleibt für ein Ersatz-Plugin zur Wiederverwendung erhalten.

Das gebündelte Browser-Plugin besitzt jetzt auch die Browser-Laufzeitimplementierung.
Der Kern behält nur gemeinsam genutzte Plugin-SDK-Hilfen sowie Kompatibilitäts-Re-Exports für
ältere interne Importpfade. In der Praxis entfernt das Entfernen oder Ersetzen des Browser-
Plugin-Pakets den Browser-Funktionsumfang, anstatt eine zweite vom Kern verwaltete Laufzeit
zurückzulassen.

Änderungen an der Browser-Konfiguration erfordern weiterhin einen Neustart des Gateway, damit das gebündelte Plugin
seinen Browser-Dienst mit den neuen Einstellungen erneut registrieren kann.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade plötzlich ein unbekannter Befehl ist oder
der Agent meldet, dass das Browser-Tool fehlt, ist die häufigste Ursache eine
restriktive `plugins.allow`-Liste, die `browser` nicht enthält.

Beispiel für eine fehlerhafte Konfiguration:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Beheben Sie das Problem, indem Sie `browser` zur Plugin-Allowlist hinzufügen:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Wichtige Hinweise:

- `browser.enabled=true` reicht allein nicht aus, wenn `plugins.allow` gesetzt ist.
- `plugins.entries.browser.enabled=true` reicht allein ebenfalls nicht aus, wenn `plugins.allow` gesetzt ist.
- `tools.alsoAllow: ["browser"]` lädt das gebündelte Browser-Plugin **nicht**. Es passt die Tool-Richtlinie nur an, nachdem das Plugin bereits geladen wurde.
- Wenn Sie keine restriktive Plugin-Allowlist benötigen, stellt das Entfernen von `plugins.allow` ebenfalls das standardmäßige Verhalten des gebündelten Browsers wieder her.

Typische Symptome:

- `openclaw browser` ist ein unbekannter Befehl.
- `browser.request` fehlt.
- Der Agent meldet das Browser-Tool als nicht verfügbar oder fehlend.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anbindungsprofil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine eventuelle Anbindungsaufforderung anzuklicken oder zu bestätigen.
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
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Überschreibung für ein einzelnes Profil
    remoteCdpTimeoutMs: 1500, // HTTP-Timeout für Remote-CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // WebSocket-Handshake-Timeout für Remote-CDP (ms)
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

- Der Browser-Steuerungsdienst bindet an loopback auf einem Port, der von `gateway.port`
  abgeleitet ist (Standard: `18791`, also Gateway + 2).
- Wenn Sie den Gateway-Port überschreiben (`gateway.port` oder `OPENCLAW_GATEWAY_PORT`),
  verschieben sich die abgeleiteten Browser-Ports, damit sie in derselben „Familie“ bleiben.
- `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn es nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen von Remote-CDP (nicht-loopback).
- `remoteCdpHandshakeTimeoutMs` gilt für Erreichbarkeitsprüfungen des Remote-CDP-WebSocket-Handshakes.
- Browser-Navigation/Tab-Öffnung wird vor der Navigation durch SSRF-Schutz abgesichert und nach der Navigation bei der finalen `http(s)`-URL nach bestem Bemühen erneut geprüft.
- Im strikten SSRF-Modus werden auch die Erkennung und Prüfungen von Remote-CDP-Endpunkten (`cdpUrl`, einschließlich `/json/version`-Lookups) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert. Setzen Sie es nur dann auf `true`, wenn Sie den Browserzugriff auf private Netzwerke bewusst als vertrauenswürdig einstufen.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt als veralteter Alias aus Kompatibilitätsgründen unterstützt.
- `attachOnly: true` bedeutet: „Niemals einen lokalen Browser starten; nur verbinden, wenn er bereits läuft.“
- `color` + profilspezifisches `color` färben die Browser-Oberfläche ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (eigenständiger, von OpenClaw verwalteter Browser). Verwenden Sie `defaultProfile: "user"`, um den angemeldeten Benutzerbrowser zu nutzen.
- Reihenfolge der automatischen Erkennung: System-Standardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu — setzen Sie diese nur für Remote-CDP.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von rohem CDP. Setzen Sie
  für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn sich ein existing-session-Profil
  an ein nicht standardmäßiges Chromium-Benutzerprofil wie Brave oder Edge anbinden soll.

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **System-Standardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/etc),
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

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway leitet Browser-Aktionen an ihn weiter.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  eine Verbindung zu einem Remote-Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Verhalten beim Beenden unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` beendet den Browser-Prozess, den
  OpenClaw gestartet hat
- attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlichen Zustand), auch
  wenn kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei Aufrufen von `/json/*`-Endpunkten und bei der Verbindung
zum CDP-WebSocket bei. Verwenden Sie für Token bevorzugt Umgebungsvariablen oder Secrets-Manager,
anstatt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (standardmäßig ohne Konfiguration)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browser-Konfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das bisherige/standardmäßige Verhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich der Routen zum Erstellen und Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur allowlistete Profile können angesprochen werden, und Routen zum Erstellen und Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
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
- Wählen Sie den Regionsendpunkt, der zu Ihrem Browserless-Konto passt (siehe deren Dokumentation).
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder in
  `wss://` für eine direkte CDP-Verbindung umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` ermitteln lassen.

## Direkte WebSocket-CDP-Anbieter

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw unterstützt beide:

- **HTTP(S)-Endpunkte** — OpenClaw ruft `/json/version` auf, um die
  WebSocket-Debugger-URL zu ermitteln, und verbindet sich dann.
- **WebSocket-Endpunkte** (`ws://` / `wss://`) — OpenClaw verbindet sich direkt
  und überspringt `/json/version`. Verwenden Sie dies für Dienste wie
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) oder jeden Anbieter, der Ihnen eine
  WebSocket-URL bereitstellt.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Tarnmodus und Residential-
Proxys.

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
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zur Sitzungserstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits der kostenpflichtigen Tarife.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Konzepte:

- Die Browser-Steuerung ist nur über loopback erreichbar; der Zugriff erfolgt über die Authentifizierung des Gateway oder die Node-Kopplung.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identity-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige loopback-Browser-API **nicht**.
- Wenn die Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Erreichbarkeit.
- Behandeln Sie Remote-CDP-URLs/-Token als Geheimnisse; bevorzugen Sie Umgebungsvariablen oder einen Secrets-Manager.

Tipps für Remote-CDP:

- Bevorzugen Sie nach Möglichkeit verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von openclaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem Benutzerdatenverzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo ausgeführt wird)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über Chrome DevTools MCP mit automatischer Verbindung

Standardeinstellungen:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist für die Anbindung bestehender Sitzungen über Chrome MCP integriert.
- Profile für bestehende Sitzungen sind zusätzlich zu `user` opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Das Löschen eines Profils verschiebt sein lokales Datenverzeichnis in den Papierkorb.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; das CLI verwendet `--browser-profile`.

## Existing-session über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anbinden.
Dadurch werden die in diesem Browserprofil bereits geöffneten Tabs und der Anmeldestatus
wiederverwendet.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Verwenden Sie Chrome DevTools MCP mit Ihrer Browser-Sitzung](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes existing-session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
  standardmäßige lokale Google-Chrome-Profil zielt.

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
3. Lassen Sie den Browser weiterlaufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anbindet.

Gängige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Smoke-Test für die Anbindung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Woran Sie Erfolg erkennen:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Refs aus dem ausgewählten Live-Tab zurück

Was Sie prüfen sollten, wenn die Anbindung nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Einwilligungsaufforderung zur Anbindung angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte Browser-Konfigurationen auf Erweiterungsbasis und prüft,
  ob Chrome lokal für Standardprofile mit automatischer Verbindung installiert ist, kann aber
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Verwendung durch den Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserstatus des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes existing-session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die
  Verbindungsaufforderung zu bestätigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browser-Sitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es bindet sich nur an eine
  bestehende Sitzung an.
- OpenClaw verwendet hier den offiziellen `--autoConnect`-Ablauf von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, gibt OpenClaw ihn weiter, um gezielt dieses explizite
  Chromium-Benutzerdatenverzeichnis zu verwenden.
- Screenshots in bestehenden Sitzungen unterstützen Seitenaufnahmen und `--ref`-Element-
  Aufnahmen aus Snapshots, aber keine CSS-`--element`-Selektoren.
- Seitenscreenshots in bestehenden Sitzungen funktionieren ohne Playwright über Chrome MCP.
  Ref-basierte Element-Screenshots (`--ref`) funktionieren dort ebenfalls, aber `--full-page`
  kann nicht mit `--ref` oder `--element` kombiniert werden.
- Aktionen in bestehenden Sitzungen sind weiterhin eingeschränkter als im verwalteten Browser-
  Pfad:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern
    Snapshot-Refs statt CSS-Selektoren
  - `click` unterstützt nur die linke Maustaste (keine Tastenüberschreibungen oder Modifikatoren)
  - `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`
  - `press` unterstützt `delayMs` nicht
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen
    keine Timeout-Überschreibungen pro Aufruf
  - `select` unterstützt derzeit nur einen einzelnen Wert
- Existing-session `wait --url` unterstützt exakte, Teilstring- und Glob-Muster
  wie andere Browser-Treiber. `wait --load networkidle` wird noch nicht unterstützt.
- Upload-Hooks in bestehenden Sitzungen erfordern `ref` oder `inputRef`, unterstützen jeweils nur eine Datei
  und unterstützen kein CSS-`element`-Targeting.
- Dialog-Hooks in bestehenden Sitzungen unterstützen keine Timeout-Überschreibungen.
- Einige Funktionen erfordern weiterhin den verwalteten Browser-Pfad, darunter Batch-
  Aktionen, PDF-Export, Download-Abfangung und `responsebody`.
- Existing-session ist host-lokal. Wenn sich Chrome auf einem anderen Rechner oder in einem
  anderen Netzwerknamensraum befindet, verwenden Sie stattdessen Remote-CDP oder einen Node-Host.

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: greift niemals auf Ihr persönliches Browserprofil zu.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: Ziel-Tabs über `targetId`, nicht über „letzter Tab“.

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

Wenn Shared-Secret-Gateway-Authentifizierung konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API verwendet **keine** trusted-proxy- oder
  Tailscale-Serve-Identity-Header.
- Wenn `gateway.auth.mode` auf `none` oder `trusted-proxy` gesetzt ist, übernehmen diese loopback-Browser-
  Routen diese identitätstragenden Modi nicht; halten Sie sie nur auf loopback erreichbar.

### Fehlervertrag von `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierungen und
Richtlinienfehler auf Routenebene:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Die Normalisierung oder Validierung der Aktions-Payload ist fehlgeschlagen.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder in einem Batch steht im Konflikt mit dem Anfrageziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Die Aktion wird für existing-session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne ein
`code`-Feld zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seiten-Screenshots für den verwalteten Browser `openclaw`, wenn pro Tab ein CDP-
  WebSocket verfügbar ist
- Seiten-Screenshots für `existing-session` / Chrome-MCP-Profile
- `existing-session` ref-basierte Screenshots (`--ref`) aus der Snapshot-Ausgabe

Was weiterhin Playwright erfordert:

- `navigate`
- `act`
- AI-Snapshots / role-Snapshots
- Element-Screenshots mit CSS-Selektoren (`--element`)
- vollständiger PDF-Export des Browsers

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, installieren Sie das vollständige
Playwright-Paket (nicht `playwright-core`) und starten Sie das Gateway neu, oder installieren Sie
OpenClaw mit Browser-Unterstützung neu.

#### Playwright-Installation in Docker

Wenn Ihr Gateway in Docker ausgeführt wird, vermeiden Sie `npx playwright` (Konflikte mit npm-Overrides).
Verwenden Sie stattdessen das gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads dauerhaft zu speichern, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über `OPENCLAW_HOME_VOLUME`
oder einen Bind-Mount persistent gespeichert wird. Siehe [Docker](/de/install/docker).

## So funktioniert es (intern)

Ablauf auf hoher Ebene:

- Ein kleiner **Steuerungsserver** akzeptiert HTTP-Anfragen.
- Er verbindet sich über **CDP** mit Chromium-basierten Browsern (Chrome/Brave/Edge/Chromium).
- Für erweiterte Aktionen (klicken/tippen/Snapshot/PDF) verwendet er **Playwright** auf Basis
  von CDP.
- Wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar.

Dieses Design hält den Agenten auf einer stabilen, deterministischen Schnittstelle, während Sie
lokale/Remote-Browser und Profile austauschen können.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen.
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

- Für attach-only- und Remote-CDP-Profile ist `openclaw browser stop` nach Tests
  weiterhin der richtige Bereinigungsbefehl. Er schließt die aktive Steuerungssitzung und
  entfernt temporäre Emulationsüberschreibungen, anstatt den zugrunde liegenden
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

- `upload` und `dialog` sind **Vorbereitungsaufrufe**; führen Sie sie vor dem Klick/Tastendruck aus,
  der den Dateiauswahldialog/Dialog auslöst.
- Pfade für Download- und Trace-Ausgaben sind auf OpenClaw-Temp-Wurzeln beschränkt:
  - Traces: `/tmp/openclaw` (Fallback: `${os.tmpdir()}/openclaw`)
  - Downloads: `/tmp/openclaw/downloads` (Fallback: `${os.tmpdir()}/openclaw/downloads`)
- Upload-Pfade sind auf eine OpenClaw-Temp-Wurzel für Uploads beschränkt:
  - Uploads: `/tmp/openclaw/uploads` (Fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.
- `snapshot`:
  - `--format ai` (Standard, wenn Playwright installiert ist): gibt einen AI-Snapshot mit numerischen Refs zurück (`aria-ref="<n>"`).
  - `--format aria`: gibt den Accessibility-Baum zurück (keine Refs; nur zur Inspektion).
  - `--efficient` (oder `--mode efficient`): kompaktes Preset für Role-Snapshots (interactive + compact + depth + geringere maxChars).
  - Standardwert der Konfiguration (nur Tool/CLI): Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um effiziente Snapshots zu verwenden, wenn der Aufrufer keinen Modus übergibt (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
  - Role-Snapshot-Optionen (`--interactive`, `--compact`, `--depth`, `--selector`) erzwingen einen rollenbasierten Snapshot mit Refs wie `ref=e12`.
  - `--frame "<iframe selector>"` begrenzt Role-Snapshots auf ein iframe (gekoppelt mit Role-Refs wie `e12`).
  - `--interactive` gibt eine flache, leicht auswählbare Liste interaktiver Elemente aus (am besten zum Ausführen von Aktionen).
  - `--labels` fügt einen Screenshot nur des Viewports mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `click`/`type`/etc erfordern einen `ref` aus `snapshot` (entweder numerisch `12` oder Role-Ref `e12`).
  CSS-Selektoren werden für Aktionen absichtlich nicht unterstützt.

## Snapshots und Refs

OpenClaw unterstützt zwei „Snapshot“-Stile:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, der numerische Refs enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird der Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Role-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/Baumstruktur mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird der Ref über `getByRole(...)` aufgelöst (plus `nth()` bei Duplikaten).
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit überlagerten `e12`-Labels einzuschließen.

Verhalten von Refs:

- Refs sind **nicht stabil über Navigationen hinweg**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen neuen Ref.
- Wenn der Role-Snapshot mit `--frame` aufgenommen wurde, sind Role-Refs bis zum nächsten Role-Snapshot auf dieses iframe beschränkt.

## Verbesserte Wartefunktionen

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

## Debug-Workflows

Wenn eine Aktion fehlschlägt (z. B. „not visible“, „strict mode violation“, „covered“):

1. `openclaw browser snapshot --interactive`
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Role-Refs im interaktiven Modus)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite seltsam verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: Zeichnen Sie einen Trace auf:
   - `openclaw browser trace start`
   - reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling-Workflows gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (Zeilen/Zeichen/Refs/interaktiv), damit Tools Rückschlüsse auf Payload-Größe und -Dichte ziehen können.

## Regler für Zustand und Umgebung

Diese sind nützlich für Workflows nach dem Muster „die Website so verhalten lassen wie X“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (veraltet `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevoreinstellungen)
  - `set viewport 1280 720`

## Sicherheit & Datenschutz

- Das Browserprofil openclaw kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann
  dies steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Zu Anmeldungen und Anti-Bot-Hinweisen (X/Twitter usw.) siehe [Browser-Anmeldung + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie den Gateway/Node-Host privat (nur loopback oder tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für den strikten Modus (blockiert standardmäßig private/interne Ziele):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optionale exakte Zulassung
    },
  },
}
```

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap Chromium) siehe
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für Setups mit aufgeteilten Hosts zwischen WSL2-Gateway und Windows-Chrome siehe
[WSL2 + Windows + Fehlerbehebung für Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Blockierung bei Navigation

Dies sind unterschiedliche Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene fehlerfrei funktioniert.
- **SSRF-Blockierung bei Navigation** bedeutet, dass die Browser-Steuerungsebene fehlerfrei funktioniert, aber ein Ziel für die Seitennavigation durch eine Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-Blockierung bei Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden Fälle zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst Probleme mit der CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin nicht fehlerfrei. Behandeln Sie dies als Problem mit der CDP-Erreichbarkeit, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlagen, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad des verwalteten Browsers fehlerfrei.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein Fail-Closed-SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal über loopback verwaltete Profil `openclaw` überspringen CDP-Zustandsprüfungen bewusst die SSRF-Erreichbarkeitsdurchsetzung des Browsers für die eigene lokale Steuerungsebene von OpenClaw.
- Der Navigationsschutz ist getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

Beispiel: Navigation blockiert, Steuerungsebene fehlerfrei

- `start` erfolgreich
- `tabs` erfolgreich
- `open http://internal.example` fehlschlägt

Das bedeutet in der Regel, dass der Browserstart in Ordnung ist und das Navigationsziel eine Richtlinienprüfung benötigt.

Beispiel: Start blockiert, bevor Navigation relevant wird

- `start` schlägt mit `not reachable after start` fehl
- `tabs` schlägt ebenfalls fehl oder kann nicht ausgeführt werden

Das weist auf Browserstart oder CDP-Erreichbarkeit hin, nicht auf ein Problem mit der Allowlist für Seiten-URLs.

## Agenten-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für die Browser-Automatisierung:

- `browser` — Status/Start/Stopp/Tabs/Öffnen/Fokussieren/Schließen/Snapshot/Screenshot/Navigate/Act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In sandboxed Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: sandboxed Sitzungen verwenden standardmäßig `sandbox`, nicht-sandboxed Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin routen, sofern Sie `target="host"` oder `target="node"` nicht festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agenten-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in sandboxed Umgebungen
- [Sicherheit](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
