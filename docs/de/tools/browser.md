---
read_when:
    - Hinzufügen einer agentengesteuerten Browserautomatisierung
    - Debugging, warum OpenClaw sich in Ihr eigenes Chrome einmischt
    - Implementierung von Browsereinstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browsersteuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-25T18:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur loopback).

Einfach erklärt:

- Betrachten Sie es als einen **separaten Browser nur für den Agenten**.
- Das Profil `openclaw` greift **nicht** auf Ihr persönliches Browserprofil zu.
- Der Agent kann in einer sicheren Spur **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` hängt sich über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Ein gebündeltes Skill `browser-automation`, das Agenten die Wiederherstellungsschleife für Snapshot,
  stabile Tabs, veraltete Referenzen und manuelle Blocker vermittelt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifizierung.

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

Die Standardwerte benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn Sie nur das Plugin deaktivieren, werden CLI `openclaw browser`, Gateway-Methode `browser.request`, Agenten-Tool und Steuerungsdienst als eine Einheit entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browser-Konfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Agentenhinweise

Hinweis zum Tool-Profil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, aber nicht das vollständige Tool `browser`. Wenn der Agent oder ein
gestarteter Unteragent Browserautomatisierung verwenden soll, fügen Sie `browser`
bereits auf Profilebene hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Für einen einzelnen Agenten verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein reicht nicht aus, weil die Richtlinie für Unteragenten
nach der Profilfilterung angewendet wird.

Das Browser-Plugin enthält zwei Ebenen von Agentenhinweisen:

- Die Tool-Beschreibung von `browser` enthält den kompakten, immer aktiven Vertrag: Wählen
  Sie das richtige Profil, behalten Sie Referenzen im selben Tab, verwenden Sie `tabId`/Labels zur
  Tab-Zielauswahl und laden Sie für mehrschrittige Arbeiten das Browser-Skill.
- Das gebündelte Skill `browser-automation` enthält die längere Betriebsschleife:
  prüfen Sie zuerst Status/Tabs, beschriften Sie Aufgaben-Tabs, erstellen Sie vor Aktionen einen Snapshot,
  erstellen Sie nach UI-Änderungen erneut einen Snapshot, stellen Sie veraltete Referenzen einmal wieder her und
  melden Sie Login-/2FA-/Captcha- oder Kamera-/Mikrofon-Blocker als manuelle Aktion, statt zu raten.

Vom Plugin gebündelte Skills werden in den verfügbaren Skills des Agenten aufgelistet, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass Routine-
Züge nicht die vollen Token-Kosten tragen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent das Browser-Tool als nicht verfügbar meldet, ist die übliche Ursache eine Liste `plugins.allow`, in der `browser` fehlt. Fügen Sie es hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist nicht — die Allowlist steuert das Laden von Plugins, und die Tool-Richtlinie läuft erst nach dem Laden. Wenn Sie `plugins.allow` vollständig entfernen, wird ebenfalls der Standard wiederhergestellt.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anbindungsprofil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe durch Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um etwaige Anbindungsaufforderungen zu klicken/zu genehmigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

## Konfiguration

Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur aktivieren bei vertrauenswürdigem Zugriff auf private Netzwerke
      // allowPrivateNetwork: true, // veralteter Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Einzelprofil-Überschreibung
    remoteCdpTimeoutMs: 1500, // Remote-CDP-HTTP-Timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // Remote-CDP-WebSocket-Handshake-Timeout (ms)
    localLaunchTimeoutMs: 15000, // Timeout für lokale Erkennung von verwaltetem Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // Timeout für lokale Bereitschaft von CDP nach dem Start (ms)
    actionTimeoutMs: 60000, // Standard-Timeout für Browseraktionen (ms)
    tabCleanup: {
      enabled: true, // Standard: true
      idleMinutes: 120, // auf 0 setzen, um die Bereinigung inaktiver Tabs zu deaktivieren
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

- Der Steuerungsdienst bindet an loopback auf einem Port, der von `gateway.port` abgeleitet wird (Standard `18791` = Gateway + 2). Wenn `gateway.port` oder `OPENCLAW_GATEWAY_PORT` überschrieben wird, verschieben sich die abgeleiteten Ports derselben Familie entsprechend.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn es nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen per CDP-HTTP und für HTTP-Anfragen zum Öffnen von Tabs bei Remote- und `attachOnly`-CDP-Endpunkten; `remoteCdpHandshakeTimeoutMs` gilt für deren CDP-WebSocket-Handshakes.
- `localLaunchTimeoutMs` ist das Zeitbudget dafür, dass ein lokal gestarteter verwalteter Chrome-
  Prozess seinen CDP-HTTP-Endpunkt bereitstellt. `localCdpReadyTimeoutMs` ist das
  anschließende Budget für die Bereitschaft des CDP-WebSocket, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, günstigen VPS oder älterer Hardware, auf denen Chromium
  langsam startet. Die Werte sind auf 120000 ms begrenzt.
- `actionTimeoutMs` ist das Standardbudget für Browser-`act`-Requests, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines zusätzliches Zeitfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, statt an der HTTP-Grenze abzulaufen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browser-Sitzungen des primären Agenten geöffnet wurden. Unteragenten-, Cron- und ACP-Lebenszyklusbereinigung schließt ihre explizit verfolgten Tabs weiterhin am Sitzungsende; primäre Sitzungen halten aktive Tabs zur Wiederverwendung offen und schließen dann inaktive oder überschüssige verfolgte Tabs im Hintergrund.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browsernavigation und Tab-Öffnung werden vor der Navigation durch SSRF geschützt und danach best-effort nochmals anhand der endgültigen `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch die Erkennung von Remote-CDP-Endpunkten und Prüfungen von `/json/version` (`cdpUrl`) kontrolliert.
- Die Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` von Gateway/Anbieter proxyn den von OpenClaw verwalteten Browser nicht automatisch. Verwaltetes Chrome startet standardmäßig direkt, damit Proxy-Einstellungen für Anbieter die SSRF-Prüfungen des Browsers nicht abschwächen.
- Um den verwalteten Browser selbst zu proxyn, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, etwa `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern Zugriff des Browsers auf private Netzwerke nicht absichtlich aktiviert wurde.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browserzugriff auf private Netzwerke bewusst vertrauenswürdig ist.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; nur anhängen, wenn bereits einer läuft.
- `headless` kann global oder pro lokalem verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.headless`, sodass ein lokal gestartetes Profil headless bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen headless-Start für lokale verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration umzuschreiben. Existing-session-, attach-only- und
  Remote-CDP-Profile lehnen die Überschreibung ab, weil OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` verwenden lokale verwaltete Profile
  standardmäßig automatisch headless, wenn weder die Umgebung noch die Profil-/globale
  Konfiguration explizit den sichtbaren Modus wählen. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt headless Starts lokaler verwalteter Browser für den
  aktuellen Prozess. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt den sichtbaren Modus für normale
  Starts und gibt auf Linux-Hosts ohne Display-Server einen umsetzbaren Fehler zurück;
  ein expliziter Request `start --headless` gewinnt weiterhin für diesen einen Start.
- `executablePath` kann global oder pro lokalem verwaltetem Profil gesetzt werden. Werte pro Profil überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile unterschiedliche Chromium-basierte Browser starten können.
- `color` (auf oberster Ebene und pro Profil) färbt die Browseroberfläche ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwalteter eigenständiger Browser). Verwenden Sie `defaultProfile: "user"`, um standardmäßig den angemeldeten Benutzerbrowser zu verwenden.
- Reihenfolge der automatischen Erkennung: Systemstandardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von rohem CDP. Setzen Sie für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein existing-session-Profil an ein nicht standardmäßiges Chromium-Benutzerprofil angehängt werden soll (Brave, Edge usw.).

</Accordion>

</AccordionGroup>

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Systemstandardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben. `~` wird auf Ihr Home-Verzeichnis des Betriebssystems erweitert:

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

`executablePath` pro Profil betrifft nur lokale verwaltete Profile, die OpenClaw
startet. `existing-session`-Profile hängen sich stattdessen an einen bereits laufenden Browser
an, und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, der den Browser hat; das Gateway leitet Browseraktionen an ihn weiter.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich an einen Remote-Chromium-basierten Browser anzuhängen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Für extern verwaltete CDP-Dienste auf loopback (zum Beispiel Browserless in
  Docker, veröffentlicht auf `127.0.0.1`), setzen Sie zusätzlich `attachOnly: true`. Loopback-CDP
  ohne `attachOnly` wird als lokales von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` betrifft nur lokale verwaltete Profile, die OpenClaw startet. Es startet bestehende Session-Browser oder Remote-CDP-Browser weder neu noch ändert es sie.
- `executablePath` folgt derselben Regel für lokale verwaltete Profile. Wenn Sie es bei einem
  laufenden lokalen verwalteten Profil ändern, wird dieses Profil für Neustart/Abgleich markiert, damit der
  nächste Start das neue Binary verwendet.

Das Verhalten beim Stoppen unterscheidet sich je nach Profilmodus:

- lokale verwaltete Profile: `openclaw browser stop` stoppt den Browserprozess, den
  OpenClaw gestartet hat
- attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlicher Zustand), auch
  wenn kein Browserprozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP-Basic-Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei Aufrufen von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket bei. Bevorzugen Sie Umgebungsvariablen oder Secrets-Manager für
Token, statt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, der Ihren Browser hat, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browserkonfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das veraltete/Standardverhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Grenze mit minimalen Rechten: Nur Profile auf der Allowlist können angesprochen werden, und Routen zum Erstellen/Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie es, wenn Sie es nicht möchten:
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

### Browserless Docker auf demselben Host

Wenn Browserless selbstgehostet in Docker läuft und OpenClaw auf dem Host läuft, behandeln Sie
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
OpenClaw-Prozess aus erreichbar sein. Browserless muss außerdem einen passend erreichbaren Endpunkt bekanntgeben;
setzen Sie Browserless `EXTERNAL` auf dieselbe von OpenClaw erreichbare öffentliche WebSocket-Basis, wie etwa
`ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private Docker-
Netzwerkadresse. Wenn `/json/version` `webSocketDebuggerUrl` zurückgibt, das auf
eine Adresse zeigt, die OpenClaw nicht erreichen kann, kann CDP-HTTP gesund aussehen, während das
Anhängen des WebSocket trotzdem fehlschlägt.

Lassen Sie `attachOnly` für ein loopback-Browserless-Profil nicht ungesetzt. Ohne
`attachOnly` behandelt OpenClaw den loopback-Port als lokales verwaltetes Browser-
profil und kann melden, dass der Port in Benutzung ist, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Anbieter

Einige gehostete Browserdienste stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
Formen von CDP-URLs und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt per WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Nackte WebSocket-Wurzeln** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst HTTP-
  `/json/version`-Erkennung (normalisiert das Schema zu `http`/`https`);
  wenn die Erkennung ein `webSocketDebuggerUrl` zurückgibt, wird dieses verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake an der nackten Wurzel zurück. Wenn der bekanntgegebene
  WebSocket-Endpunkt den CDP-Handshake ablehnt, aber die konfigurierte nackte Wurzel
  ihn akzeptiert, fällt OpenClaw ebenfalls auf diese Wurzel zurück. Dadurch kann ein nacktes `ws://`,
  das auf ein lokales Chrome zeigt, weiterhin verbinden, da Chrome WebSocket-
  Upgrades nur auf dem spezifischen pro Ziel gültigen Pfad aus `/json/version` akzeptiert, während gehostete
  Anbieter weiterhin ihren Root-WebSocket-Endpunkt verwenden können, wenn ihr Erkennungs-
  Endpunkt eine kurzlebige URL bekanntgibt, die für Playwright-CDP nicht geeignet ist.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
von headless Browsern mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential-
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
  aus dem [Overview dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Key.
- Browserbase erstellt beim WebSocket-Verbinden automatisch eine Browser-Sitzung, daher ist kein
  manueller Schritt zur Sitzungserstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browserstunde pro Monat.
  Siehe [pricing](https://www.browserbase.com/pricing) für Grenzen kostenpflichtiger Tarife.
- In den [Browserbase docs](https://docs.browserbase.com) finden Sie die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Konzepte:

- Browser-Steuerung ist nur über loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateway oder Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Authentifizierung mit gemeinsamem Geheimnis**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP-Basic-Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitätsheader und `gateway.auth.mode: "trusted-proxy"` authentifizieren diese eigenständige loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Authentifizierung mit gemeinsamem Geheimnis konfiguriert ist, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Erreichbarkeit.
- Behandeln Sie Remote-CDP-URLs/-Tokens als Geheimnisse; bevorzugen Sie Umgebungsvariablen oder einen Secrets-Manager.

Tipps für Remote-CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Tokens.
- Vermeiden Sie es, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (Mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über automatische Verbindung mit Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist für das Anhängen an bestehende Sitzungen über Chrome MCP integriert.
- Existing-session-Profile sind zusätzlich zu `user` optional; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Beim Löschen eines Profils wird sein lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anhängen. Dadurch werden die bereits in diesem Browserprofil offenen Tabs und der Login-Zustand wiederverwendet.

Offizieller Hintergrund und Referenzen zur Einrichtung:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes existing-session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
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
3. Lassen Sie den Browser weiterlaufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Häufige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Anhängungs-Smoketest:

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
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Zustimmungsaufforderung zum Anhängen angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte browserbasierte Konfigurationen mit Erweiterungen und prüft, dass
  Chrome lokal für Standardprofile mit automatischer Verbindung installiert ist, aber es kann
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Agentennutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserzustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes existing-session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Aufforderung zum Anhängen zu bestätigen.
- Das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer angemeldeten Browsersitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an.
- OpenClaw verwendet hier den offiziellen Flow `--autoConnect` von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um dieses Benutzer-Datenverzeichnis anzusprechen.
- Existing-session kann sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

### Benutzerdefinierter Chrome-MCP-Start

Überschreiben Sie den gestarteten Chrome DevTools MCP-Server pro Profil, wenn der Standard-
Flow `npx chrome-devtools-mcp@latest` nicht das ist, was Sie möchten (Offline-Hosts,
fest angeheftete Versionen, vendorisierte Binaries):

| Feld         | Funktion                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die statt `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt.      |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` für ein existing-session-Profil gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (DevTools-HTTP-Erkennungsendpunkt).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` beim Start von Chrome MCP ignoriert, da Chrome MCP sich an den
laufenden Browser hinter dem Endpunkt anhängt, statt ein Profilverzeichnis
zu öffnen.

<Accordion title="Einschränkungen von existing-session-Funktionen">

Im Vergleich zum verwalteten Profil `openclaw` sind existing-session-Treiber stärker eingeschränkt:

- **Screenshots** — Seitenaufnahmen und `--ref`-Elementaufnahmen funktionieren; CSS-`--element`-Selektoren nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Playwright ist für Seiten- oder ref-basierte Element-Screenshots nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Referenzen (keine CSS-Selektoren). `click-coords` klickt auf sichtbare Viewport-Koordinaten und benötigt keine Snapshot-Referenz. `click` unterstützt nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Upload / Dialog** — `wait --url` unterstützt exakte, Teilstring- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei gleichzeitig, kein CSS-`element`. Dialog-Hooks unterstützen keine Überschreibungen für Timeouts.
- **Nur verwaltete Funktionen** — Batch-Aktionen, PDF-Export, Abfangen von Downloads und `responsebody` erfordern weiterhin den verwalteten Browserpfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: greift niemals auf Ihr persönliches Browserprofil zu.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
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

Für Scripting und Debugging stellt das Gateway eine kleine **nur über loopback erreichbare HTTP-
Steuerungs-API** sowie eine passende CLI `openclaw browser` bereit (Snapshots, Referenzen, Wait-
Erweiterungen, JSON-Ausgabe, Debug-Workflows). Die vollständige Referenz finden Sie unter
[Browser control API](/de/tools/browser-control).

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap-Chromium) siehe
[Browser troubleshooting](/de/tools/browser-linux-troubleshooting).

Für WSL2-Gateway + Windows-Chrome-Split-Host-Setups siehe
[WSL2 + Windows + remote Chrome CDP troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Block bei Navigation

Dies sind unterschiedliche Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene in Ordnung ist.
- **SSRF-Block bei Navigation** bedeutet, dass die Browser-Steuerungsebene in Ordnung ist, aber ein Navigationsziel laut Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer Loopback-CDP-Dienst ohne `attachOnly: true` konfiguriert ist
- SSRF-Block bei Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin nicht in Ordnung. Behandeln Sie dies als Problem mit der CDP-Erreichbarkeit, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad des verwalteten Browsers in Ordnung.

Wichtige Verhaltensdetails:

- Die Browserkonfiguration verwendet standardmäßig ein fail-closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale verwaltete Loopback-Profil `openclaw` überspringen CDP-Integritätsprüfungen absichtlich die SSRF-Erreichbarkeitsprüfung des Browsers für die eigene lokale Steuerungsebene von OpenClaw.
- Navigationsschutz ist separat. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browserzugriff auf private Netzwerke erforderlich und geprüft ist.

## Agenten-Tools + Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für Browserautomatisierung:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs des Snapshots zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite, Element oder beschriftete Referenzen).
- `browser doctor` prüft die Bereitschaft von Gateway, Plugin, Profil, Browser und Tab.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin geleitet werden, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und fragile Selektoren werden vermieden.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agenten-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browsersteuerung in sandboxed Umgebungen
- [Security](/de/gateway/security) — Risiken und Absicherung der Browsersteuerung
