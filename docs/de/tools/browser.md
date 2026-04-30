---
read_when:
    - Agentengesteuerte Browserautomatisierung hinzufügen
    - 'Fehlerbehebung: Warum OpenClaw Ihren eigenen Chrome beeinträchtigt'
    - Implementierung von Browsereinstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-30T07:16:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kann ein **dediziertes Chrome/Brave/Edge/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Steuerdienst innerhalb des Gateway verwaltet (nur loopback).

Einsteigeransicht:

- Stellen Sie es sich als **separaten Browser nur für Agenten** vor.
- Das Profil `openclaw` berührt Ihr persönliches Browserprofil **nicht**.
- Der Agent kann **Tabs öffnen, Seiten lesen, klicken und tippen** in einem sicheren Bereich.
- Das integrierte Profil `user` verbindet sich über Chrome MCP mit Ihrer echten angemeldeten Chrome-Sitzung.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbener Akzentfarbe).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Ein gebündeltes Skill `browser-automation`, das Agenten den Wiederherstellungsablauf für Snapshot,
  stabile Tabs, veraltete Referenzen und manuelle Blocker vermittelt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifikation.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser deaktiviert“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder fehlendes Tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das standardmäßige `browser`-Tool ist ein gebündeltes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben `browser`-Toolnamen registriert:

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

Standardwerte benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn nur das Plugin deaktiviert wird, werden die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, das Agenten-Tool und der Steuerdienst als Einheit entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz intakt.

Änderungen an der Browserkonfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Agenten-Anleitung

Hinweis zum Tool-Profil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, aber nicht das vollständige `browser`-Tool. Wenn der Agent oder ein
gestarteter Sub-Agent Browserautomatisierung verwenden soll, fügen Sie Browser auf der Profilstufe hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Für einen einzelnen Agenten verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein reicht nicht aus, weil die Sub-Agenten-
Richtlinie nach der Profilfilterung angewendet wird.

Das Browser-Plugin liefert zwei Ebenen von Agenten-Anleitungen mit:

- Die Beschreibung des `browser`-Tools enthält den kompakten, immer aktiven Vertrag: das
  richtige Profil wählen, Referenzen im selben Tab halten, `tabId`/Labels für die Tab-
  Zielauswahl verwenden und für mehrschrittige Arbeit das Browser-Skill laden.
- Das gebündelte Skill `browser-automation` enthält den längeren Betriebsablauf:
  zuerst Status/Tabs prüfen, Aufgabentabs labeln, vor Aktionen einen Snapshot erstellen, nach UI-Änderungen
  erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und Login/2FA/Captcha oder
  Kamera-/Mikrofonblocker als manuelle Aktion melden, statt zu raten.

Vom Plugin gebündelte Skills werden in den verfügbaren Skills des Agenten aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass routinemäßige
Durchläufe nicht die vollen Tokenkosten verursachen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent das Browser-Tool als nicht verfügbar meldet, ist die übliche Ursache eine `plugins.allow`-Liste, die `browser` auslässt, und dass kein Root-Konfigurationsblock `browser` vorhanden ist. Fügen Sie ihn hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter Root-Block `browser`, zum Beispiel `browser.enabled=true` oder `browser.profiles.<name>`, aktiviert das gebündelte Browser-Plugin auch bei restriktivem `plugins.allow`, entsprechend dem Verhalten der Kanalkonfiguration. `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist für sich genommen nicht. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls den Standard wieder her.

## Profile: `openclaw` vs. `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anhängeprofil für Ihre **echte angemeldete Chrome**-
  Sitzung.

Für Browser-Toolaufrufe von Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn vorhandene angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine etwaige Anhängeabfrage anzuklicken/zu genehmigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus wünschen.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

## Konfiguration

Browsereinstellungen befinden sich in `~/.openclaw/openclaw.json`.

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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

<Accordion title="Ports and reachability">

- Der Steuerdienst bindet an loopback auf einem Port, der von `gateway.port` abgeleitet wird (Standard `18791` = Gateway + 2). Das Überschreiben von `gateway.port` oder `OPENCLAW_GATEWAY_PORT` verschiebt die abgeleiteten Ports in derselben Familie.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn kein Wert gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Remote- und `attachOnly`-CDP-HTTP-Erreichbarkeitsprüfungen
  sowie HTTP-Anfragen zum Öffnen von Tabs; `remoteCdpHandshakeTimeoutMs` gilt für
  deren CDP-WebSocket-Handshakes.
- `localLaunchTimeoutMs` ist das Zeitbudget für einen lokal gestarteten verwalteten Chrome-
  Prozess, um seinen CDP-HTTP-Endpunkt bereitzustellen. `localCdpReadyTimeoutMs` ist das
  anschließende Budget für die CDP-WebSocket-Bereitschaft, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, leistungsschwachen VPS oder älterer Hardware, auf der Chromium
  langsam startet. Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- Wiederholte Fehler beim Start oder bei der Bereitschaft von verwaltetem Chrome werden pro
  Profil per Circuit Breaker unterbrochen. Nach mehreren aufeinanderfolgenden Fehlern pausiert OpenClaw neue Start-
  versuche kurz, statt Chromium bei jedem Browser-Toolaufruf zu starten. Beheben Sie
  das Startproblem, deaktivieren Sie den Browser, wenn er nicht benötigt wird, oder starten Sie das
  Gateway nach der Reparatur neu.
- `actionTimeoutMs` ist das Standardbudget für Browser-`act`-Anfragen, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines Toleranzfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, statt an der HTTP-Grenze abzulaufen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browser-Sitzungen des Primäragenten geöffnet wurden. Die Lebenszyklusbereinigung von Subagenten, Cron und ACP schließt weiterhin deren explizit nachverfolgte Tabs am Sitzungsende; Primärsitzungen halten aktive Tabs wiederverwendbar und schließen dann im Hintergrund inaktive oder überschüssige nachverfolgte Tabs.

</Accordion>

<Accordion title="SSRF policy">

- Browsernavigation und Tab-Öffnen werden vor der Navigation durch SSRF-Schutz geprüft und anschließend nach Best-Effort erneut auf der finalen `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch die Erkennung von Remote-CDP-Endpunkten und `/json/version`-Probes (`cdpUrl`) geprüft.
- Gateway-/Provider-Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` proxysieren den von OpenClaw verwalteten Browser nicht automatisch. Verwaltetes Chrome startet standardmäßig direkt, damit Provider-Proxy-Einstellungen die Browser-SSRF-Prüfungen nicht abschwächen.
- Um den verwalteten Browser selbst zu proxysieren, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, etwa `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern privater Netzwerkzugriff des Browsers nicht absichtlich aktiviert ist.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browserzugriff auf private Netzwerke absichtlich vertrauenswürdig ist.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; es wird nur angehängt, wenn bereits einer läuft.
- `headless` kann global oder pro lokal verwaltetem Profil festgelegt werden. Werte pro Profil überschreiben `browser.headless`, sodass ein lokal gestartetes Profil headless bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokal verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration umzuschreiben. Profile mit bestehender Sitzung, nur Anhängen und
  Remote-CDP-Profile lehnen die Überschreibung ab, weil OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` verwenden lokal verwaltete Profile
  automatisch standardmäßig headless, wenn weder die Umgebung noch die Profil-/globale
  Konfiguration explizit den sichtbaren Modus auswählt. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt Headless-Starts für lokal verwaltete Browser für den
  aktuellen Prozess. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt den sichtbaren Modus für normale
  Starts und gibt auf Linux-Hosts ohne Display-Server einen handlungsorientierten Fehler zurück;
  eine explizite `start --headless`-Anforderung hat für diesen einen Start dennoch Vorrang.
- `executablePath` kann global oder pro lokal verwaltetem Profil festgelegt werden. Werte pro Profil überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile verschiedene Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für Ihr Home-Verzeichnis des Betriebssystems.
- `color` (auf oberster Ebene und pro Profil) färbt die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwaltet, eigenständig). Verwenden Sie `defaultProfile: "user"`, um den angemeldeten Benutzerbrowser zu nutzen.
- Reihenfolge der automatischen Erkennung: Systemstandardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von rohem CDP. Legen Sie für diesen Treiber kein `cdpUrl` fest.
- Legen Sie `browser.profiles.<name>.userDataDir` fest, wenn ein Profil mit bestehender Sitzung an ein nicht standardmäßiges Chromium-Benutzerprofil (Brave, Edge usw.) anhängen soll. Dieser Pfad akzeptiert ebenfalls `~` für Ihr Home-Verzeichnis des Betriebssystems.

</Accordion>

</AccordionGroup>

## Brave oder einen anderen Chromium-basierten Browser verwenden

Wenn Ihr **Systemstandardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
verwendet OpenClaw ihn automatisch. Legen Sie `browser.executablePath` fest, um die
automatische Erkennung zu überschreiben. `executablePath`-Werte auf oberster Ebene und pro Profil akzeptieren `~`
für Ihr Home-Verzeichnis des Betriebssystems:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Oder legen Sie es pro Plattform in der Konfiguration fest:

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

`executablePath` pro Profil betrifft nur lokal verwaltete Profile, die OpenClaw
startet. `existing-session`-Profile hängen stattdessen an einen bereits laufenden Browser an,
und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Der Gateway startet den Loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Computer aus, auf dem sich der Browser befindet; der Gateway leitet Browseraktionen an ihn weiter.
- **Remote-CDP:** Legen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`) fest, um
  an einen entfernten Chromium-basierten Browser anzuhängen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Für extern verwaltete CDP-Dienste auf Loopback (zum Beispiel Browserless in
  Docker, veröffentlicht auf `127.0.0.1`) legen Sie außerdem `attachOnly: true` fest. Loopback-CDP
  ohne `attachOnly` wird als lokales, von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` betrifft nur lokal verwaltete Profile, die OpenClaw startet. Es startet vorhandene Sitzungen oder Remote-CDP-Browser nicht neu und ändert sie nicht.
- `executablePath` folgt derselben Regel für lokal verwaltete Profile. Wenn Sie ihn bei einem
  laufenden lokal verwalteten Profil ändern, wird dieses Profil für Neustart/Abgleich markiert, sodass der
  nächste Start die neue Binärdatei verwendet.

Das Stoppverhalten unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browserprozess, den
  OpenClaw gestartet hat
- Profile nur zum Anhängen und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuersitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlicher Zustand), obwohl
  kein Browserprozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Abfrage-Tokens (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw bewahrt die Authentifizierung beim Aufrufen von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket. Bevorzugen Sie Umgebungsvariablen oder Secret Manager für
Tokens, statt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Computer ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe automatisch ohne zusätzliche Browserkonfiguration an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Nodes (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es für das Legacy-/Standardverhalten leer: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` festlegen, behandelt OpenClaw es als Least-Privilege-Grenze: Nur Profile auf der Allowlist können als Ziel verwendet werden, und persistente Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie es, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein Remote-Browserprofil ist die einfachste Option die direkte WebSocket-URL
aus den Verbindungsdokumenten von Browserless.

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
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder für eine
  direkte CDP-Verbindung in `wss://` umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` ermitteln lassen.

### Browserless Docker auf demselben Host

Wenn Browserless selbst gehostet in Docker läuft und OpenClaw auf dem Host ausgeführt wird, behandeln Sie
Browserless als extern verwalteten CDP-Dienst:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Die Adresse in `browser.profiles.browserless.cdpUrl` muss vom
OpenClaw-Prozess erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt ankündigen;
setzen Sie Browserless `EXTERNAL` auf dieselbe von außen für OpenClaw erreichbare WebSocket-Basis, etwa
`ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private Docker-
Netzwerkadresse. Wenn `/json/version` ein `webSocketDebuggerUrl` zurückgibt, das auf
eine Adresse verweist, die OpenClaw nicht erreichen kann, kann CDP-HTTP gesund wirken, während das WebSocket-
Anhängen dennoch fehlschlägt.

Lassen Sie `attachOnly` für ein Loopback-Browserless-Profil nicht unset. Ohne
`attachOnly` behandelt OpenClaw den Loopback-Port als lokal verwaltetes Browser-
Profil und meldet möglicherweise, dass der Port verwendet wird, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browserdienste stellen einen **direkten WebSocket**-Endpunkt bereit, statt
der standardmäßigen HTTP-basierten CDP-Ermittlung (`/json/version`). OpenClaw akzeptiert drei
CDP-URL-Formen und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Ermittlung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln, und stellt dann
  die Verbindung her. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Bare-WebSocket-Roots** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst die HTTP-
  Ermittlung über `/json/version` (mit Normalisierung des Schemas zu `http`/`https`);
  wenn die Ermittlung ein `webSocketDebuggerUrl` zurückgibt, wird es verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake am Bare Root zurück. Wenn der angekündigte
  WebSocket-Endpunkt den CDP-Handshake ablehnt, aber der konfigurierte Bare Root
  ihn akzeptiert, fällt OpenClaw ebenfalls auf diesen Root zurück. Dadurch kann ein bloßes `ws://`,
  das auf ein lokales Chrome zeigt, weiterhin verbinden, da Chrome WebSocket-
  Upgrades nur auf dem spezifischen Zielpfad aus `/json/version` akzeptiert, während gehostete
  Provider weiterhin ihren Root-WebSocket-Endpunkt verwenden können, wenn ihr Ermittlungs-
  Endpunkt eine kurzlebige URL ankündigt, die nicht für Playwright CDP geeignet ist.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential
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
  aus dem [Übersichts-Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browsersitzung, daher ist kein
  manueller Schritt zur Sitzungserstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browserstunde pro Monat.
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Pläne.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Leitfäden und Integrationsbeispiele.

## Sicherheit

Wichtige Ideen:

- Die Browser-Steuerung ist nur per Loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateway oder das Node-Pairing.
- Die eigenständige Loopback-HTTP-API für den Browser verwendet **ausschließlich Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP-Basic-Authentifizierung mit dem
  konfigurierten Gateway-Passwort.
- Tailscale Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige Loopback-Browser-API **nicht**.
- Wenn die Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert ist, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es dauerhaft in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie den Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exposition.
- Behandeln Sie Remote-CDP-URLs/-Tokens als Geheimnisse; bevorzugen Sie Env-Vars oder einen Secrets-Manager.

Remote-CDP-Tipps:

- Bevorzugen Sie, wo möglich, verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Tokens.
- Vermeiden Sie, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **openclaw-verwaltet**: eine dedizierte Chromium-basierte Browser-Instanz mit eigenem Benutzerdatenverzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo läuft)
- **vorhandene Sitzung**: Ihr vorhandenes Chrome-Profil über die automatische Verbindung von Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für das Anhängen an eine vorhandene Sitzung per Chrome MCP integriert.
- Profile für vorhandene Sitzungen sind über `user` hinaus optional; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** vergeben.
- Das Löschen eines Profils verschiebt sein lokales Datenverzeichnis in den Papierkorb.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Vorhandene Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browser-Profil anhängen. Dadurch werden die Tabs und der Anmeldestatus wiederverwendet, die in diesem Browser-Profil bereits geöffnet sind.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Profil für eine vorhandene Sitzung, wenn Sie
einen anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis wünschen.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
  standardmäßige lokale Google-Chrome-Profil abzielt.

Verwenden Sie `userDataDir` für Brave, Edge, Chromium oder ein nicht standardmäßiges Chrome-Profil.
`~` wird zu Ihrem Home-Verzeichnis des Betriebssystems erweitert:

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

1. Öffnen Sie die Inspect-Seite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser laufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Gängige Inspect-Seiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Anhänge-Smoke-Test:

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

- der Ziel-Browser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspect-Seite dieses Browsers aktiviert
- der Browser hat die Zustimmung zum Anhängen angezeigt, und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte erweiterungsbasierte Browser-Konfiguration und prüft, dass
  Chrome lokal für Standardprofile mit automatischer Verbindung installiert ist, kann jedoch
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Agent-Nutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browser-Status des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Profil für vorhandene Sitzungen verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Anhängeaufforderung
  zu bestätigen.
- der Gateway oder Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer angemeldeten Browser-Sitzung handeln kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an.
- OpenClaw verwendet hier den offiziellen Chrome DevTools MCP-Flow `--autoConnect`. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um auf dieses Benutzerdatenverzeichnis abzuzielen.
- Eine vorhandene Sitzung kann sich auf dem ausgewählten Host oder über eine verbundene
  Browser-Node anhängen. Wenn Chrome anderswo läuft und keine Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

### Benutzerdefinierter Chrome-MCP-Start

Überschreiben Sie den gestarteten Chrome DevTools MCP-Server pro Profil, wenn der standardmäßige
Flow `npx chrome-devtools-mcp@latest` nicht Ihren Anforderungen entspricht (Offline-Hosts,
fixierte Versionen, vendored Binaries):

| Feld         | Was es bewirkt                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die anstelle von `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt. |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` in einem Profil für vorhandene Sitzungen gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (DevTools-HTTP-Discovery-Endpunkt).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` für den Chrome-MCP-Start ignoriert, da Chrome MCP sich an
den laufenden Browser hinter dem Endpunkt anhängt, statt ein Profilverzeichnis
zu öffnen.

<Accordion title="Existing-session feature limitations">

Im Vergleich zum verwalteten Profil `openclaw` sind Treiber für vorhandene Sitzungen stärker eingeschränkt:

- **Screenshots** — Seitenerfassungen und Elementerfassungen mit `--ref` funktionieren; CSS-Selektoren mit `--element` nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Playwright ist für seiten- oder ref-basierte Element-Screenshots nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` benötigen Snapshot-Refs (keine CSS-Selektoren). `click-coords` klickt sichtbare Viewport-Koordinaten und benötigt keine Snapshot-Ref. `click` verwendet nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Upload / Dialog** — `wait --url` unterstützt exakte, Teilzeichenfolgen- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks benötigen `ref` oder `inputRef`, jeweils eine Datei, kein CSS-`element`. Dialog-Hooks unterstützen keine Timeout-Überschreibungen.
- **Nur verwaltet verfügbare Funktionen** — Batch-Aktionen, PDF-Export, Download-Interception und `responsebody` benötigen weiterhin den verwalteten Browser-Pfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: berührt niemals Ihr persönliches Browser-Profil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungsworkflows zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, dann
  stabile `tabId`-Handles wie `t1`, optionale Labels und die rohe `targetId`.
  Agenten sollten `suggestedTargetId` wiederverwenden; rohe IDs bleiben für
  Debugging und Kompatibilität verfügbar.

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
- Linux: prüft gängige Chrome-/Brave-/Edge-/Chromium-Orte unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser`.
- Windows: prüft gängige Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt der Gateway eine kleine **nur über Loopback erreichbare HTTP-Steuerungs-API**
plus eine passende CLI `openclaw browser` bereit (Snapshots, Refs, Wait-Power-ups,
JSON-Ausgabe, Debug-Workflows). Die vollständige Referenz finden Sie unter
[Browser-Steuerungs-API](/de/tools/browser-control).

## Fehlerbehebung

Linux-spezifische Probleme (insbesondere snap Chromium) finden Sie unter
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für Split-Host-Setups mit WSL2-Gateway + Windows Chrome siehe
[Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. Navigations-SSRF-Blockierung

Dies sind unterschiedliche Fehlerklassen, und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene intakt ist.
- **Navigations-SSRF-Blockierung** bedeutet, dass die Browser-Steuerungsebene intakt ist, aber ein Seitennavigationsziel durch Richtlinie abgelehnt wird.

Gängige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer Loopback-CDP-Dienst ohne `attachOnly: true` konfiguriert ist
- Navigations-SSRF-Blockierung:
  - `open`-, `navigate`-, Snapshot- oder Tab-Öffnungsflows schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden zu trennen:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin fehlerhaft. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Seitennavigationsproblem.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv, und der Fehler liegt in der Navigationsrichtlinie oder der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende verwaltete Browser-Steuerungspfad intakt.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein Fail-Closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale Loopback-verwaltete Profil `openclaw` überspringen CDP-Health-Checks absichtlich die Durchsetzung der Browser-SSRF-Erreichbarkeit für OpenClaws eigene lokale Steuerungsebene.
- Der Navigationsschutz ist separat. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie **nicht** standardmäßig.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in absichtlich vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools + Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt eine stabile UI-Struktur zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot, um zu klicken, zu tippen, zu ziehen oder auszuwählen.
- `browser screenshot` erfasst Pixel (ganze Seite, Element oder beschriftete refs).
- `browser doctor` prüft die Bereitschaft von Gateway, Plugin, Profil, Browser und Tab.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser läuft.
  - In sandboxed Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: sandboxed Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn ein Node mit Browser-Unterstützung verbunden ist, kann das Tool automatisch dorthin routen, sofern Sie nicht `target="host"` oder `target="node"` fest vorgeben.

Das hält den Agenten deterministisch und vermeidet fragile Selektoren.

## Verwandte Themen

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browsersteuerung in sandboxed Umgebungen
- [Sicherheit](/de/gateway/security) — Risiken und Härtung bei der Browsersteuerung
