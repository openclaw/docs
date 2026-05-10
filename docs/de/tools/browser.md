---
read_when:
    - Agentengesteuerte Browser-Automatisierung hinzufügen
    - Debugging, warum openclaw Ihren eigenen Chrome beeinträchtigt
    - Implementierung von Browsereinstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-05-10T19:53:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kann ein **dediziertes Chrome/Brave/Edge/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser getrennt und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur loopback).

Einsteigeransicht:

- Stellen Sie es sich als **separaten Browser nur für Agents** vor.
- Das `openclaw`-Profil greift **nicht** auf Ihr persönliches Browser-Profil zu.
- Der Agent kann in einem sicheren Bereich **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte `user`-Profil verbindet sich über Chrome MCP mit Ihrer echten angemeldeten Chrome-Sitzung.

## Was Sie erhalten

- Ein separates Browser-Profil namens **openclaw** (standardmäßig mit orangefarbener Akzentfarbe).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agent-Aktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Ein gebündeltes `browser-automation`-Skill, das Agents den Recovery-Loop für Snapshots,
  stabile Tabs, veraltete Referenzen und manuelle Blocker vermittelt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er ist eine sichere, isolierte Oberfläche für
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

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie den
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

Für Standardwerte sind sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true` erforderlich. Wenn nur das Plugin deaktiviert wird, werden die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, das Agent-Tool und der Steuerungsdienst als eine Einheit entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browser-Konfiguration erfordern einen Gateway-Neustart, damit das Plugin seinen Dienst erneut registrieren kann.

## Agent-Anleitung

Hinweis zum Tool-Profil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, aber nicht das vollständige `browser`-Tool. Wenn der Agent oder ein
gestarteter Sub-Agent Browser-Automatisierung verwenden soll, fügen Sie Browser in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie für einen einzelnen Agent `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein reicht nicht aus, da die Sub-Agent-
Richtlinie nach der Profilfilterung angewendet wird.

Das Browser-Plugin liefert zwei Ebenen von Agent-Anleitungen:

- Die Beschreibung des `browser`-Tools enthält den kompakten, immer aktiven Vertrag: das
  richtige Profil wählen, Referenzen auf demselben Tab halten, `tabId`/Labels für die
  Tab-Zielauswahl verwenden und das Browser-Skill für mehrstufige Arbeit laden.
- Das gebündelte `browser-automation`-Skill enthält den längeren Arbeitsablauf:
  zuerst Status/Tabs prüfen, Aufgaben-Tabs labeln, vor Aktionen einen Snapshot erstellen, nach
  UI-Änderungen erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und Login/2FA/Captcha- oder
  Kamera/Mikrofon-Blocker als manuelle Aktion melden, statt zu raten.

Vom Plugin gebündelte Skills werden in den verfügbaren Skills des Agent aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass Routine-
Turns nicht die vollen Token-Kosten verursachen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, ist die übliche Ursache eine `plugins.allow`-Liste, die `browser` auslässt und kein Root-`browser`-Konfigurationsblock existiert. Fügen Sie ihn hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter Root-`browser`-Block, zum Beispiel `browser.enabled=true` oder `browser.profiles.<name>`, aktiviert das gebündelte Browser-Plugin auch bei restriktivem `plugins.allow`, entsprechend dem Verhalten der Channel-Konfiguration. `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen für sich genommen keine Mitgliedschaft in der Allowlist. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls den Standard wieder her.

## Profile: `openclaw` vs. `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anhängeprofil für Ihre **echte angemeldete Chrome**-
  Sitzung.

Für Browser-Toolaufrufe des Agent:

- Standard: Verwenden Sie den isolierten `openclaw`-Browser.
- Bevorzugen Sie `profile="user"`, wenn vorhandene angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine Anhängeaufforderung anzuklicken/zu genehmigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browser-Modus wünschen.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

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

<Accordion title="Ports und Erreichbarkeit">

- Der Steuerungsdienst bindet an loopback auf einem Port, der aus `gateway.port` abgeleitet wird (Standard `18791` = Gateway + 2). Das Überschreiben von `gateway.port` oder `OPENCLAW_GATEWAY_PORT` verschiebt die abgeleiteten Ports in derselben Familie.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn es nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Remote- und `attachOnly`-CDP-HTTP-Erreichbarkeits-
  prüfungen sowie HTTP-Anfragen zum Öffnen von Tabs; `remoteCdpHandshakeTimeoutMs` gilt für
  deren CDP-WebSocket-Handshakes.
- `localLaunchTimeoutMs` ist das Zeitbudget, damit ein lokal gestarteter verwalteter Chrome-
  Prozess seinen CDP-HTTP-Endpunkt bereitstellt. `localCdpReadyTimeoutMs` ist das
  anschließende Budget für die CDP-WebSocket-Bereitschaft, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, Low-End-VPS oder älterer Hardware, auf der Chromium
  langsam startet. Werte müssen positive ganze Zahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- Wiederholte Fehler beim Starten/Bereitwerden von verwaltetem Chrome werden pro
  Profil per Circuit Breaker unterbrochen. Nach mehreren aufeinanderfolgenden Fehlern pausiert OpenClaw neue Start-
  versuche kurz, statt Chromium bei jedem Browser-Toolaufruf zu starten. Beheben Sie
  das Startproblem, deaktivieren Sie den Browser, wenn er nicht benötigt wird, oder starten Sie den
  Gateway nach der Reparatur neu.
- `actionTimeoutMs` ist das Standardbudget für Browser-`act`-Anfragen, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines Pufferfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, statt an der HTTP-Grenze abzulaufen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browser-Sitzungen des primären Agent geöffnet wurden. Sub-Agent-, Cron- und ACP-Lifecycle-Bereinigung schließen weiterhin ihre explizit verfolgten Tabs am Sitzungsende; primäre Sitzungen halten aktive Tabs wiederverwendbar und schließen dann inaktive oder überschüssige verfolgte Tabs im Hintergrund.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browser-Navigation und das Öffnen von Tabs werden vor der Navigation per SSRF geschützt und anschließend auf der finalen `http(s)`-URL best-effort erneut geprüft.
- Im strikten SSRF-Modus werden auch Remote-CDP-Endpunkterkennung und `/json/version`-Probes (`cdpUrl`) geprüft.
- Gateway/Provider-Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` proxen den von OpenClaw verwalteten Browser nicht automatisch. Verwaltetes Chrome startet standardmäßig direkt, damit Provider-Proxy-Einstellungen die Browser-SSRF-Prüfungen nicht schwächen.
- Um den verwalteten Browser selbst zu proxen, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, zum Beispiel `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern privater Netzwerkzugriff des Browsers nicht absichtlich aktiviert ist.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig aus; aktivieren Sie es nur, wenn privater Netzwerkzugriff des Browsers absichtlich vertrauenswürdig ist.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet: Niemals einen lokalen Browser starten; nur verbinden, wenn bereits einer ausgeführt wird.
- `headless` kann global oder pro lokal verwaltetem Profil gesetzt werden. Profilbezogene Werte überschreiben `browser.headless`, sodass ein lokal gestartetes Profil im Headless-Modus bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokal verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration umzuschreiben. Existing-session-, Attach-only- und
  Remote-CDP-Profile lehnen die Überschreibung ab, weil OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` wechseln lokal verwaltete Profile
  automatisch standardmäßig in den Headless-Modus, wenn weder die Umgebung noch die profilbezogene/globale
  Konfiguration explizit den sichtbaren Modus auswählt. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt Headless-Starts lokal verwalteter Browser für den
  aktuellen Prozess. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt den sichtbaren Modus für normale
  Starts und gibt auf Linux-Hosts ohne Display-Server einen handlungsorientierten Fehler zurück;
  eine explizite Anforderung mit `start --headless` hat für genau diesen einen Start weiterhin Vorrang.
- `executablePath` kann global oder pro lokal verwaltetem Profil gesetzt werden. Profilbezogene Werte überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile unterschiedliche Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für das Home-Verzeichnis Ihres Betriebssystems.
- `color` (auf oberster Ebene und pro Profil) färbt die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwaltet, eigenständig). Verwenden Sie `defaultProfile: "user"`, um den angemeldeten Benutzerbrowser zu verwenden.
- Automatische Erkennungsreihenfolge: Systemstandardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie für diesen Treiber nicht `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn sich ein Existing-session-Profil mit einem nicht standardmäßigen Chromium-Benutzerprofil verbinden soll (Brave, Edge usw.). Dieser Pfad akzeptiert ebenfalls `~` für das Home-Verzeichnis Ihres Betriebssystems.

</Accordion>

</AccordionGroup>

## Brave oder einen anderen Chromium-basierten Browser verwenden

Wenn Ihr **Systemstandardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben. `executablePath`-Werte auf oberster Ebene und pro Profil akzeptieren `~`
für das Home-Verzeichnis Ihres Betriebssystems:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Oder setzen Sie es in der Konfiguration, je Plattform:

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

Profilbezogenes `executablePath` wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw
startet. `existing-session`-Profile verbinden sich stattdessen mit einem bereits laufenden Browser,
und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale und entfernte Steuerung

- **Lokale Steuerung (Standard):** Der Gateway startet den loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Entfernte Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Computer aus, auf dem sich der Browser befindet; der Gateway proxyt Browseraktionen an ihn.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich mit einem entfernten Chromium-basierten Browser zu verbinden. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Setzen Sie für extern verwaltete CDP-Dienste auf loopback (zum Beispiel Browserless in
  Docker, veröffentlicht auf `127.0.0.1`) auch `attachOnly: true`. Loopback-CDP
  ohne `attachOnly` wird als lokal von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw startet. Es startet keine Existing-session- oder Remote-CDP-Browser neu und ändert sie auch nicht.
- `executablePath` folgt derselben Regel für lokal verwaltete Profile. Wenn Sie es bei einem
  laufenden lokal verwalteten Profil ändern, wird dieses Profil für Neustart/Abgleich markiert, sodass der
  nächste Start die neue Binärdatei verwendet.

Das Stoppverhalten unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browserprozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Locale, Zeitzone, Offlinemodus und ähnlichen Zustand), auch
  wenn kein Browserprozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Abfragetoken (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung beim Aufruf von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket bei. Verwenden Sie für
Token vorzugsweise Umgebungsvariablen oder Secret-Manager, statt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Computer ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe automatisch ohne zusätzliche Browserkonfiguration an diesen Node weiterleiten.
Dies ist der Standardpfad für entfernte Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer, um das Legacy-/Standardverhalten zu verwenden: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur Profile auf der Allowlist können als Ziel verwendet werden, und persistente Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie es, wenn Sie es nicht verwenden möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein entferntes Browserprofil ist die einfachste Option die direkte WebSocket-URL
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
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder für eine direkte CDP-Verbindung in
  `wss://` umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

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
OpenClaw-Prozess aus erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt ankündigen;
setzen Sie Browserless `EXTERNAL` auf dieselbe öffentliche, für OpenClaw erreichbare WebSocket-Basis, etwa
`ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private Docker-
Netzwerkadresse. Wenn `/json/version` ein `webSocketDebuggerUrl` zurückgibt, das auf
eine Adresse verweist, die OpenClaw nicht erreichen kann, kann CDP HTTP fehlerfrei aussehen, während die WebSocket-
Verbindung dennoch fehlschlägt.

Lassen Sie `attachOnly` für ein loopback-Browserless-Profil nicht ungesetzt. Ohne
`attachOnly` behandelt OpenClaw den loopback-Port als lokal verwaltetes Browserprofil
und meldet möglicherweise, dass der Port belegt ist, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browserdienste stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
CDP-URL-Formen und wählt automatisch die passende Verbindungsstrategie aus:

- **HTTP(S)-Erkennung** - `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** - `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-
  Pfad. OpenClaw verbindet sich direkt über einen WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Bloße WebSocket-Roots** - `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst die HTTP-
  Erkennung über `/json/version` (mit Normalisierung des Schemas zu `http`/`https`);
  wenn die Erkennung ein `webSocketDebuggerUrl` zurückgibt, wird es verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake an der bloßen Root zurück. Wenn der angekündigte
  WebSocket-Endpunkt den CDP-Handshake ablehnt, aber die konfigurierte bloße Root
  ihn akzeptiert, fällt OpenClaw ebenfalls auf diese Root zurück. Dadurch kann eine bloße `ws://`-
  URL, die auf einen lokalen Chrome zeigt, weiterhin verbinden, da Chrome WebSocket-
  Upgrades nur auf dem spezifischen Zielpfad aus `/json/version` akzeptiert, während gehostete
  Provider weiterhin ihren Root-WebSocket-Endpunkt verwenden können, wenn ihr Erkennungs-
  Endpunkt eine kurzlebige URL ankündigt, die für Playwright CDP nicht geeignet ist.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
von Headless-Browsern mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential
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
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Tarife.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Kernideen:

- Browsersteuerung ist nur über local loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateway oder über Node-Pairing.
- Die eigenständige HTTP-API für den local loopback-Browser verwendet **ausschließlich Shared-Secret-Auth**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale Serve-Identity-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige API für den local loopback-Browser **nicht**.
- Wenn Browsersteuerung aktiviert ist und keine Shared-Secret-Auth konfiguriert ist, generiert OpenClaw
  für diesen Start ein nur zur Laufzeit gültiges Gateway-Token. Konfigurieren Sie
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder
  `OPENCLAW_GATEWAY_PASSWORD` ausdrücklich, wenn Clients über Neustarts hinweg ein stabiles Secret benötigen.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie den Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Erreichbarkeit.
- Behandeln Sie entfernte CDP-URLs/-Token als Secrets; bevorzugen Sie Umgebungsvariablen oder einen Secret-Manager.

Tipps zu entferntem CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token, wo möglich.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **openclaw-managed**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem Benutzerdatenverzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo läuft)
- **bestehende Sitzung**: Ihr vorhandenes Chrome-Profil über die automatische Verbindung von Chrome DevTools MCP

Standardeinstellungen:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist für das Anhängen an eine bestehende Sitzung per Chrome MCP integriert.
- Profile für bestehende Sitzungen sind über `user` hinaus optional; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800-18899** zugewiesen.
- Beim Löschen eines Profils wird sein lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anhängen. Dadurch werden die Tabs und der Anmeldestatus wiederverwendet, die in diesem Browserprofil bereits geöffnet sind.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Chrome DevTools MCP mit Ihrer Browsersitzung verwenden](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Profil für eine bestehende Sitzung, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browserdatenverzeichnis wünschen.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
  standardmäßige lokale Google Chrome-Profil abzielt.

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
3. Lassen Sie den Browser laufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw anhängt.

Gängige Inspect-Seiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Anhang-Smoke-Test:

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
- Remote-Debugging ist auf der Inspect-Seite dieses Browsers aktiviert
- der Browser hat die Zustimmungsaufforderung zum Anhängen angezeigt und Sie haben sie akzeptiert
- `openclaw doctor` migriert alte extension-basierte Browserkonfiguration und prüft, dass
  Chrome für standardmäßige Profile mit automatischer Verbindung lokal installiert ist, kann jedoch
  Remote-Debugging auf Browserseite nicht für Sie aktivieren

Agent-Nutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserzustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Profil für eine bestehende Sitzung verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Aufforderung zum Anhängen zu bestätigen.
- der Gateway oder Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist riskanter als das isolierte Profil `openclaw`, weil er
  in Ihrer angemeldeten Browsersitzung handeln kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt nur an.
- OpenClaw verwendet hier den offiziellen Chrome DevTools MCP-Flow `--autoConnect`. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um dieses Benutzerdatenverzeichnis anzuzielen.
- Bestehende Sitzungen können auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

### Benutzerdefinierter Chrome MCP-Start

Überschreiben Sie den gestarteten Chrome DevTools MCP-Server pro Profil, wenn der Standard-Flow
`npx chrome-devtools-mcp@latest` nicht Ihren Anforderungen entspricht (Offline-Hosts,
fixierte Versionen, vendored Binaries):

| Feld         | Was es bewirkt                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die statt `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt.        |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` in einem Profil für eine bestehende Sitzung gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (DevTools-HTTP-Discovery-Endpunkt).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` für den Chrome MCP-Start ignoriert, da Chrome MCP an den
laufenden Browser hinter dem Endpunkt anhängt, statt ein Profilverzeichnis zu öffnen.

<Accordion title="Funktionsbeschränkungen bestehender Sitzungen">

Im Vergleich zum verwalteten Profil `openclaw` sind Treiber für bestehende Sitzungen stärker eingeschränkt:

- **Screenshots** - Seitenerfassungen und `--ref`-Elementerfassungen funktionieren; CSS-`--element`-Selektoren nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Playwright ist für Seiten- oder ref-basierte Element-Screenshots nicht erforderlich.
- **Aktionen** - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Refs (keine CSS-Selektoren). `click-coords` klickt sichtbare Viewport-Koordinaten und erfordert keine Snapshot-Ref. `click` ist nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Upload / Dialog** - `wait --url` unterstützt exakte Muster, Teilzeichenfolgen und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, kein CSS-`element`. Dialog-Hooks unterstützen keine Timeout-Überschreibungen.
- **Nur verwaltete Funktionen** - Batch-Aktionen, PDF-Export, Download-Interception und `responsebody` erfordern weiterhin den verwalteten Browserpfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: berührt niemals Ihr persönliches Browserprofil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungsworkflows zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, dann
  stabile `tabId`-Handles wie `t1`, optionale Labels und die rohe `targetId`.
  Agents sollten `suggestedTargetId` wiederverwenden; rohe IDs bleiben für
  Debugging und Kompatibilität verfügbar.

## Browserauswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: prüft gängige Chrome/Brave/Edge/Chromium-Speicherorte unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser` sowie Playwright-verwaltetes Chromium unter
  `PLAYWRIGHT_BROWSERS_PATH` oder `~/.cache/ms-playwright`.
- Windows: prüft gängige Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt der Gateway eine kleine, **nur über local loopback erreichbare HTTP-Steuerungs-API** sowie eine passende `openclaw browser`-CLI bereit (Snapshots, Refs, Wait-Power-ups, JSON-Ausgabe, Debug-Workflows). Die vollständige Referenz finden Sie unter
[Browsersteuerungs-API](/de/tools/browser-control).

## Fehlerbehebung

Linux-spezifische Probleme (insbesondere snap Chromium) finden Sie unter
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für Split-Host-Setups mit WSL2 Gateway + Windows Chrome siehe
[Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. Navigations-SSRF-Blockierung

Dies sind unterschiedliche Fehlerklassen, und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browsersteuerungsebene funktionsfähig ist.
- **Navigations-SSRF-Blockierung** bedeutet, dass die Browsersteuerungsebene funktionsfähig ist, ein Seitennavigationsziel jedoch per Richtlinie abgelehnt wird.

Gängige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer CDP-Dienst über local loopback ohne `attachOnly: true` konfiguriert ist
- Navigations-SSRF-Blockierung:
  - `open`-, `navigate`-, Snapshot- oder Tab-Öffnungs-Flows schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden zu trennen:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So interpretieren Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin fehlerhaft. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Seitennavigationsproblem.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, läuft die Browsersteuerungsebene, und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad für verwaltete Browser funktionsfähig.

Wichtige Verhaltensdetails:

- Die Browserkonfiguration verwendet standardmäßig ein Fail-Closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale verwaltete Profil `openclaw` über local loopback überspringen CDP-Integritätsprüfungen absichtlich die Browser-SSRF-Erreichbarkeitserzwingung für OpenClaws eigene lokale Steuerungsebene.
- Navigationsschutz ist getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel für `open` oder `navigate` zulässig ist.

Sicherheitsleitfaden:

- Lockern Sie die Browser-SSRF-Richtlinie **nicht** standardmäßig.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

## Agentenwerkzeuge + Funktionsweise der Steuerung

Der Agent erhält **ein Werkzeug** für Browser-Automatisierung:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs des Snapshots zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite, Element oder beschriftete Referenzen).
- `browser doctor` prüft Gateway, Plugin, Profil, Browser und Tab-Bereitschaft.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browser-Profil auszuwählen (openclaw, chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser läuft.
  - In Sandbox-Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` ausgelassen wird: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn eine browserfähige Node verbunden ist, kann das Werkzeug automatisch dorthin weiterleiten, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Werkzeugübersicht](/de/tools) - alle verfügbaren Agentenwerkzeuge
- [Sandboxing](/de/gateway/sandboxing) - Browser-Steuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) - Risiken und Härtung der Browser-Steuerung
