---
read_when:
    - Agentengesteuerte Browser-Automatisierung hinzufügen
    - Fehlerbehebung, warum OpenClaw Ihren eigenen Chrome beeinträchtigt
    - Implementierung von Browsereinstellungen und Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das vom Agenten gesteuert wird.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur local loopback).

Ansicht für Einsteiger:

- Betrachten Sie es als einen **separaten Browser nur für Agenten**.
- Das Profil `openclaw` **greift nicht** auf Ihr persönliches Browserprofil zu.
- Der Agent kann in einer sicheren Lane **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` hängt sich über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie bekommen

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agent-Aktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Eine gebündelte Skill `browser-automation`, die Agenten den Recovery-Loop für Snapshot,
  stabilen Tab, veraltete Referenzen und manuelle Blocker beibringt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr täglicher Hauptbrowser. Er ist eine sichere, isolierte Oberfläche für
Agent-Automatisierung und Verifizierung.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Missing browser command or tool](/de/tools/browser#missing-browser-command-or-tool).

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

Für die Standardwerte müssen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true` gesetzt sein. Wenn nur das Plugin deaktiviert wird, werden die CLI `openclaw browser`, die Gateway-Methode `browser.request`, das Agent-Tool und der Steuerungsdienst als Einheit entfernt; Ihre Konfiguration `browser.*` bleibt für einen Ersatz erhalten.

Änderungen an der Browser-Konfiguration erfordern einen Gateway-Neustart, damit das Plugin seinen Dienst erneut registrieren kann.

## Agent-Anleitung

Hinweis zum Tool-Profil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, aber nicht das vollständige Tool `browser`. Wenn der Agent oder ein
erzeugter Subagent Browser-Automatisierung verwenden soll, fügen Sie Browser auf Ebene des
Profils hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Für einen einzelnen Agenten verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein reicht nicht aus, da die Subagent-
Richtlinie nach der Profilfilterung angewendet wird.

Das Browser-Plugin liefert zwei Ebenen von Agent-Anleitung:

- Die Beschreibung des Tools `browser` enthält den kompakten immer aktiven Vertrag: das
  richtige Profil wählen, Referenzen auf demselben Tab halten, `tabId`/Labels für das
  Tab-Targeting verwenden und für mehrstufige Arbeit die Browser-Skill laden.
- Die gebündelte Skill `browser-automation` enthält den längeren Betriebsablauf:
  zuerst Status/Tabs prüfen, Aufgaben-Tabs labeln, vor Aktionen einen Snapshot erstellen,
  nach UI-Änderungen erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und
  Login-/2FA-/Captcha- oder Kamera-/Mikrofon-Blocker als manuelle Aktion melden, statt zu raten.

Plugin-gebündelte Skills werden in den verfügbaren Skills des Agenten aufgelistet, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass
normale Turns nicht die vollen Token-Kosten tragen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, ist die übliche Ursache eine Liste `plugins.allow`, in der `browser` fehlt. Fügen Sie es hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist nicht — die Allowlist steuert das Laden des Plugins, und die Tool-Richtlinie läuft erst nach dem Laden. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls das Standardverhalten wieder her.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Attach-Profil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: den isolierten Browser `openclaw` verwenden.
- `profile="user"` bevorzugen, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine eventuelle Attach-Aufforderung zu klicken/zu genehmigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie standardmäßig den verwalteten Modus möchten.

## Konfiguration

Die Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur per Opt-in für vertrauenswürdigen Zugriff auf private Netzwerke
      // allowPrivateNetwork: true, // veralteter Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Überschreibung für ein einzelnes Profil
    remoteCdpTimeoutMs: 1500, // Remote-CDP-HTTP-Timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // Remote-CDP-WebSocket-Handshake-Timeout (ms)
    localLaunchTimeoutMs: 15000, // Timeout für die Erkennung von lokal verwaltetem Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // lokaler Timeout für CDP-Bereitschaft nach dem Start (ms)
    actionTimeoutMs: 60000, // Standard-Timeout für Browseraktionen (ms)
    tabCleanup: {
      enabled: true, // Standard: true
      idleMinutes: 120, // auf 0 setzen, um die Leerlaufbereinigung zu deaktivieren
      maxTabsPerSession: 8, // auf 0 setzen, um das Limit pro Sitzung zu deaktivieren
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

- Der Steuerungsdienst bindet an local loopback auf einen Port, der von `gateway.port` abgeleitet wird (Standard `18791` = Gateway + 2). Wenn `gateway.port` oder `OPENCLAW_GATEWAY_PORT` überschrieben wird, verschieben sich die abgeleiteten Ports in derselben Familie.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn nichts gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Reachability-Checks des Remote- und `attachOnly`-CDP-HTTP sowie für HTTP-Anfragen zum Öffnen von Tabs; `remoteCdpHandshakeTimeoutMs` gilt für deren CDP-WebSocket-Handshakes.
- `localLaunchTimeoutMs` ist das Budget dafür, dass ein lokal gestarteter verwalteter Chrome-
  Prozess seinen CDP-HTTP-Endpunkt bereitstellt. `localCdpReadyTimeoutMs` ist das
  nachgelagerte Budget für die Bereitschaft des CDP-WebSocket, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, günstigen VPS oder älterer Hardware, auf der Chromium
  langsam startet. Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- `actionTimeoutMs` ist das Standardbudget für Browser-`act`-Anfragen, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines zusätzliches Zeitfenster hinzu, damit lange Wartezeiten beendet werden können, statt an der HTTP-Grenze ein Timeout zu erreichen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browsersitzungen des primären Agenten geöffnet wurden. Die Bereinigung des Lebenszyklus von Subagenten, Cron und ACP schließt ihre explizit nachverfolgten Tabs weiterhin am Sitzungsende; primäre Sitzungen halten aktive Tabs zur Wiederverwendung offen und schließen dann im Hintergrund inaktive oder überschüssige nachverfolgte Tabs.

</Accordion>

<Accordion title="SSRF policy">

- Browser-Navigation und das Öffnen von Tabs werden vor der Navigation durch SSRF-Schutz abgesichert und danach nach bestem Bemühen erneut anhand der finalen `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch die Erkennung des Remote-CDP-Endpunkts und `/json/version`-Probes (`cdpUrl`) geprüft.
- Gateway-/Provider-Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` leiten den von OpenClaw verwalteten Browser nicht automatisch über einen Proxy. Verwaltetes Chrome startet standardmäßig direkt, sodass Proxy-Einstellungen für Provider die SSRF-Prüfungen des Browsers nicht abschwächen.
- Um den verwalteten Browser selbst über einen Proxy zu leiten, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, z. B. `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, es sei denn, Browserzugriff auf private Netzwerke wurde bewusst aktiviert.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie dies nur, wenn der Browserzugriff auf private Netzwerke bewusst als vertrauenswürdig eingestuft wird.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt als veralteter Alias unterstützt.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; nur anhängen, wenn bereits einer läuft.
- `headless` kann global oder pro lokal verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.headless`, sodass ein lokal gestartetes Profil headless bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen headless-Start für lokal verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration umzuschreiben. Existing-session-, attach-only- und
  Remote-CDP-Profile lehnen diese Überschreibung ab, da OpenClaw diese
  Browser-Prozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` werden lokal verwaltete Profile standardmäßig automatisch headless gestartet, wenn weder Umgebung noch Profil-/globale Konfiguration explizit den sichtbaren Modus wählen. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt für den aktuellen Prozess headless-Starts lokal verwalteter Browser.
  `OPENCLAW_BROWSER_HEADLESS=0` erzwingt für normale Starts den sichtbaren Modus und gibt auf Linux-Hosts ohne Display-Server einen umsetzbaren Fehler zurück;
  eine explizite Anfrage `start --headless` hat für diesen einen Start weiterhin Vorrang.
- `executablePath` kann global oder pro lokal verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile verschiedene Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für Ihr Home-Verzeichnis des Betriebssystems.
- `color` (oberste Ebene und pro Profil) färbt die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwaltet, eigenständig). Verwenden Sie `defaultProfile: "user"`, um sich standardmäßig für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge der automatischen Erkennung: Standardbrowser des Systems, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein existing-session-Profil an ein nicht standardmäßiges Chromium-Benutzerprofil angehängt werden soll (Brave, Edge usw.). Dieser Pfad akzeptiert ebenfalls `~` für Ihr Home-Verzeichnis des Betriebssystems.

</Accordion>

</AccordionGroup>

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Systemstandardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/etc),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben. `executablePath` auf oberster Ebene und pro Profil akzeptiert `~`
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

`executablePath` pro Profil wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw
startet. Profile vom Typ `existing-session` hängen sich stattdessen an einen bereits laufenden Browser
an, und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den local loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway proxyt Browser-Aktionen dorthin.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich an einen entfernten Chromium-basierten Browser anzuhängen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Für extern verwaltete CDP-Dienste auf Loopback (zum Beispiel Browserless in
  Docker, veröffentlicht auf `127.0.0.1`) setzen Sie zusätzlich `attachOnly: true`. Loopback-CDP
  ohne `attachOnly` wird als lokal von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw startet. Es startet bestehende Session-Browser oder Remote-CDP-Browser nicht neu und ändert sie auch nicht.
- Für `executablePath` gilt dieselbe Regel für lokal verwaltete Profile. Wenn es bei einem
  laufenden lokal verwalteten Profil geändert wird, markiert OpenClaw dieses Profil für Neustart/Abgleich, sodass
  beim nächsten Start das neue Binary verwendet wird.

Das Verhalten beim Stoppen unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browserprozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Emulationsüberschreibungen von Playwright/CDP frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlicher Zustand), auch
  wenn OpenClaw keinen Browserprozess gestartet hat

Remote-CDP-URLs können Auth enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Auth bei Aufrufen von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket bei. Bevorzugen Sie Umgebungsvariablen oder Secrets-Manager für
Token, anstatt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browser-Konfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen Konfiguration `browser.profiles` des Nodes (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das alte/standardmäßige Verhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich der Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur in der Allowlist stehende Profile können angesprochen werden, und persistente Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie dies, wenn Sie es nicht möchten:
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
  `/json/version` erkennen lassen.

### Browserless-Docker auf demselben Host

Wenn Browserless in Docker selbst gehostet wird und OpenClaw auf dem Host läuft, behandeln Sie
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
OpenClaw-Prozess aus erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt bekanntgeben;
setzen Sie Browserless `EXTERNAL` auf dieselbe öffentliche WebSocket-Basis, die für OpenClaw erreichbar ist, zum Beispiel
`ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private Docker-
Netzwerkadresse. Wenn `/json/version` `webSocketDebuggerUrl` zurückgibt, das auf
eine Adresse zeigt, die OpenClaw nicht erreichen kann, kann CDP-HTTP gesund aussehen, während das
Anhängen an den WebSocket trotzdem fehlschlägt.

Lassen Sie `attachOnly` für ein Browserless-Profil auf Loopback nicht ungesetzt. Ohne
`attachOnly` behandelt OpenClaw den Loopback-Port als lokal verwaltetes Browser-
Profil und meldet möglicherweise, dass der Port verwendet wird, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt bereit statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`). OpenClaw akzeptiert drei
Formen von CDP-URLs und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Nackte WebSocket-Roots** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst HTTP-
  `/json/version`-Erkennung (mit Normalisierung des Schemas auf `http`/`https`);
  wenn die Erkennung eine `webSocketDebuggerUrl` zurückgibt, wird sie verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake am nackten Root zurück. Wenn der bekanntgegebene
  WebSocket-Endpunkt den CDP-Handshake ablehnt, aber der konfigurierte nackte Root
  ihn akzeptiert, fällt OpenClaw ebenfalls auf diesen Root zurück. Dadurch kann ein nacktes `ws://`,
  das auf einen lokalen Chrome zeigt, weiterhin verbinden, da Chrome WebSocket-
  Upgrades nur auf dem spezifischen Pfad pro Ziel aus `/json/version` akzeptiert, während gehostete
  Provider weiterhin ihren Root-WebSocket-Endpunkt nutzen können, wenn ihr Erkennungs-
  Endpunkt eine kurzlebige URL bekanntgibt, die für Playwright-CDP nicht geeignet ist.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headlesser Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential
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
- Browserbase erstellt beim WebSocket-Connect automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zum Erstellen einer Sitzung erforderlich.
- Der kostenlose Tarif erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Siehe [Pricing](https://www.browserbase.com/pricing) für die Limits bezahlter Tarife.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Konzepte:

- Browser-Steuerung ist nur über Loopback erreichbar; der Zugriff läuft über die Auth des Gateway oder Node-Pairing.
- Die eigenständige Loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Auth**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige Loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Shared-Secret-Auth konfiguriert wurde, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und persistiert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exposition.
- Behandeln Sie Remote-CDP-URLs/-Token als Secrets; bevorzugen Sie Umgebungsvariablen oder einen Secrets-Manager.

Tipps für Remote-CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Token.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil per Auto-Connect über Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist integriert für das Anhängen an eine bestehende Sitzung per Chrome MCP.
- Existing-session-Profile sind zusätzlich zu `user` Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Beim Löschen eines Profils wird sein lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anhängen. Dadurch werden die Tabs und der Anmeldestatus wiederverwendet,
die in diesem Browserprofil bereits geöffnet sind.

Offizielle Hintergrund- und Setup-Referenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet Auto-Connect über Chrome MCP, das auf das
  lokale Standardprofil von Google Chrome zielt.

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

Dann im entsprechenden Browser:

1. Öffnen Sie die Inspect-Seite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser weiterlaufen und genehmigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Häufige Inspect-Seiten:

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
- `snapshot` gibt Referenzen aus dem ausgewählten Live-Tab zurück

Was Sie prüfen sollten, wenn das Anhängen nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspect-Seite dieses Browsers aktiviert
- der Browser hat die Attach-Einwilligungsaufforderung angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte browserbasierte Konfigurationen mit Erweiterung und prüft, dass
  Chrome lokal für Standardprofile mit Auto-Connect installiert ist, aber es kann
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Agent-Nutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserstatus des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-session-Profil verwenden, übergeben Sie den expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Attach-
  Aufforderung zu genehmigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer angemeldeten Browsersitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an.
- OpenClaw verwendet hier den offiziellen Chrome-DevTools-MCP-Flow `--autoConnect`. Wenn
  `userDataDir` gesetzt ist, wird es weitergereicht, um auf dieses User-Data-Verzeichnis zu zielen.
- Existing-session kann sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

### Benutzerdefinierter Chrome-MCP-Start

Überschreiben Sie den gestarteten Chrome-DevTools-MCP-Server pro Profil, wenn der Standard-
Flow `npx chrome-devtools-mcp@latest` nicht das ist, was Sie möchten (Offline-Hosts,
gepinntte Versionen, vendorte Binaries):

| Feld         | Funktion                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die anstelle von `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt. |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` bei einem Existing-session-Profil gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (HTTP-Erkennungsendpunkt von DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` für den Chrome-MCP-Start ignoriert, da Chrome MCP sich an
den laufenden Browser hinter dem Endpunkt anhängt, statt ein Profil-
verzeichnis zu öffnen.

<Accordion title="Einschränkungen bei Existing-session-Funktionen">

Im Vergleich zum verwalteten Profil `openclaw` sind Existing-session-Treiber stärker eingeschränkt:

- **Screenshots** — Seiten-Captures und Element-Captures mit `--ref` funktionieren; CSS-Selektoren mit `--element` nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Für seiten- oder ref-basierte Element-Screenshots ist Playwright nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Referenzen (keine CSS-Selektoren). `click-coords` klickt auf sichtbare Viewport-Koordinaten und benötigt keine Snapshot-Referenz. `click` ist nur mit der linken Maustaste möglich. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Wait / Upload / Dialog** — `wait --url` unterstützt exakte, Teilstring- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei zur Zeit, kein CSS-`element`. Dialog-Hooks unterstützen keine Überschreibungen für Timeouts.
- **Nur verwaltete Funktionen** — Batch-Aktionen, PDF-Export, Download-Abfangung und `responsebody` erfordern weiterhin den Pfad für den verwalteten Browser.

</Accordion>

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: greift niemals auf Ihr persönliches Browserprofil zu.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, dann
  stabile Handles `tabId` wie `t1`, optionale Labels und die rohe `targetId`.
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

## Control API (optional)

Für Skripting und Debugging stellt das Gateway eine kleine **nur über Loopback erreichbare HTTP-
Control API** sowie eine passende CLI `openclaw browser` bereit (Snapshots, Referenzen, Wait-
Power-ups, JSON-Ausgabe, Debug-Workflows). Siehe
[Browser control API](/de/tools/browser-control) für die vollständige Referenz.

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap-Chromium) siehe
[Browser troubleshooting](/de/tools/browser-linux-troubleshooting).

Für Setups mit WSL2-Gateway + Windows-Chrome auf getrennten Hosts siehe
[WSL2 + Windows + remote Chrome CDP troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Block bei der Navigation

Dies sind unterschiedliche Fehlerklassen und sie weisen auf unterschiedliche Codepfade hin.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene gesund ist.
- **SSRF-Block bei der Navigation** bedeutet, dass die Browser-Steuerungsebene gesund ist, ein Ziel für die Seitennavigation aber durch Richtlinien abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer CDP-Dienst auf Loopback ohne `attachOnly: true` konfiguriert ist
- SSRF-Block bei der Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um beides zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin ungesund. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, läuft die Browser-Steuerungsebene, und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad für den verwalteten Browser gesund.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fail-closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal verwaltete Profil `openclaw` auf Loopback überspringen CDP-Health-Checks absichtlich die SSRF-Erreichbarkeitsprüfung des Browsers für die eigene lokale Steuerungsebene von OpenClaw.
- Navigationsschutz ist getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel für `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Lockern Sie die SSRF-Richtlinie des Browsers standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browserzugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

So ist es zugeordnet:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot für Klicks/Eingaben/Ziehen/Auswahl.
- `browser screenshot` erfasst Pixel (ganze Seite, Element oder gelabelte Referenzen).
- `browser doctor` prüft Gateway, Plugin, Profil, Browser und Tab-Bereitschaft.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sitzungen erfordert `target: "host"` die Einstellung `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` fehlt: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin geleitet werden, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in sandboxierten Umgebungen
- [Security](/de/gateway/security) — Risiken der Browser-Steuerung und Härtung
