---
read_when:
    - Agentengesteuerte Browserautomatisierung hinzufügen
    - Debuggen, warum openclaw Ihren eigenen Chrome stört
    - Browser-Einstellungen und Lebenszyklus in der macOS-App implementieren
summary: Integrierter Browsersteuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-06-27T18:16:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kann ein **dediziertes Chrome/Brave/Edge/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser getrennt und wird über einen kleinen lokalen
Steuerdienst innerhalb des Gateway verwaltet (nur local loopback).

Einsteigeransicht:

- Betrachten Sie es als **separaten Browser nur für Agenten**.
- Das Profil `openclaw` berührt Ihr persönliches Browserprofil **nicht**.
- Der Agent kann in einer sicheren Umgebung **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` hängt sich über Chrome MCP an Ihre echte angemeldete Chrome-Sitzung an.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Ein gebündeltes Skill `browser-automation`, das Agenten die Snapshot-,
  Stable-Tab-, Stale-Ref- und Manual-Blocker-Recovery-Schleife beibringt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifizierung.

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
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder fehlendes Tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das standardmäßige Tool `browser` ist ein gebündeltes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben Toolnamen `browser` registriert:

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

Standardeinstellungen benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn nur das Plugin deaktiviert wird, werden die CLI `openclaw browser`, die Gateway-Methode `browser.request`, das Agenten-Tool und der Steuerdienst als eine Einheit entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browserkonfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Agentenhinweise

Hinweis zum Tool-Profil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, aber nicht das vollständige Tool `browser`. Wenn der Agent oder ein
erzeugter Sub-Agent Browserautomatisierung verwenden soll, fügen Sie den Browser auf der Profil-
Ebene hinzu:

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

Das Browser-Plugin liefert zwei Ebenen von Agentenhinweisen mit:

- Die Beschreibung des Tools `browser` enthält den kompakten, immer aktiven Vertrag: das
  richtige Profil wählen, Referenzen im selben Tab halten, `tabId`/Labels für die Tab-
  Zielauswahl verwenden und für mehrstufige Arbeit das Browser-Skill laden.
- Das gebündelte Skill `browser-automation` enthält die längere Arbeitsschleife:
  zuerst Status/Tabs prüfen, Aufgaben-Tabs labeln, vor Aktionen einen Snapshot erstellen, nach UI-Änderungen
  erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und Login/2FA/Captcha- oder
  Kamera-/Mikrofonblocker als manuelle Aktion melden, statt zu raten.

Vom Plugin gebündelte Skills werden in den verfügbaren Skills des Agenten aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass routinemäßige
Turns nicht die vollständigen Token-Kosten tragen.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent das Browser-Tool als nicht verfügbar meldet, ist die übliche Ursache eine Liste `plugins.allow`, in der `browser` fehlt, und es existiert kein Root-Konfigurationsblock `browser`. Fügen Sie ihn hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter Root-Block `browser`, zum Beispiel `browser.enabled=true` oder `browser.profiles.<name>`, aktiviert das gebündelte Browser-Plugin auch unter einer restriktiven `plugins.allow` und entspricht damit dem Verhalten der Kanalkonfiguration. `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist nicht von sich aus. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls den Standard wieder her.

## Profile: `openclaw` im Vergleich zu `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anhängeprofil für Ihre **echte angemeldete Chrome**-
  Sitzung.

Für Browser-Tool-Aufrufe durch Agenten:

- Standard: den isolierten Browser `openclaw` verwenden.
- Bevorzugen Sie `profile="user"`, wenn vorhandene angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine Anhangsaufforderung anzuklicken/zu bestätigen.
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

### Screenshot-Vision (Unterstützung für reine Textmodelle)

Wenn das Hauptmodell rein textbasiert ist (keine Vision-/multimodale Unterstützung), geben Browser-
Screenshots Bildblöcke zurück, die das Modell nicht lesen kann. Browser-Screenshots
verwenden die vorhandene Konfiguration für Bildverständnis wieder, sodass ein für Medienverständnis
konfiguriertes Bildmodell Screenshots ohne browserspezifische Modelleinstellungen als Text beschreiben kann.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**So funktioniert es:**

1. Der Agent ruft `browser screenshot` auf → Bild wird wie üblich auf der Festplatte erfasst.
2. Das Browser-Tool fragt die vorhandene Laufzeit für Bildverständnis, ob sie
   den Screenshot mit konfigurierten Medien-Bildmodellen, gemeinsamen Medien-
   Modellen, Bildmodell-Standardeinstellungen oder einem authentifizierungsbasierten Bild-Provider beschreiben kann.
3. Das Vision-Modell gibt eine Textbeschreibung zurück, die mit
   `wrapExternalContent` (Prompt-Injection-Schutz) umschlossen und dem Agenten
   als Textblock statt als Bildblock zurückgegeben wird.
4. Wenn Bildverständnis nicht verfügbar ist, übersprungen wird oder fehlschlägt, fällt der Browser
   darauf zurück, den ursprünglichen Bildblock zurückzugeben.

Verwenden Sie die vorhandenen Felder `tools.media.image` / `tools.media.models` für Modell-
Fallbacks, Timeouts, Byte-Limits, Profile und Provider-Anforderungseinstellungen.

Wenn das aktive Hauptmodell bereits Vision unterstützt und kein explizites Modell für
Bildverständnis konfiguriert ist, behält OpenClaw das normale Bildergebnis bei, damit das
Hauptmodell den Screenshot direkt lesen kann.

<AccordionGroup>

<Accordion title="Ports and reachability">

- Der Steuerdienst bindet an Loopback auf einem Port, der von `gateway.port` abgeleitet ist (Standard `18791` = Gateway + 2). Das Überschreiben von `gateway.port` oder `OPENCLAW_GATEWAY_PORT` verschiebt die abgeleiteten Ports in derselben Familie.
- Lokale Profile `openclaw` weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für
  Remote-CDP-Profile oder das Anhängen an Existing-Session-Endpunkte. `cdpUrl` ist standardmäßig
  der verwaltete lokale CDP-Port, wenn nicht gesetzt.
- `remoteCdpTimeoutMs` gilt für Remote- und `attachOnly`-CDP-HTTP-Erreichbarkeits-
  prüfungen sowie HTTP-Anfragen zum Öffnen von Tabs; `remoteCdpHandshakeTimeoutMs` gilt für
  deren CDP-WebSocket-Handshakes.
- `localLaunchTimeoutMs` ist das Budget für einen lokal gestarteten verwalteten Chrome-
  Prozess, um seinen CDP-HTTP-Endpunkt bereitzustellen. `localCdpReadyTimeoutMs` ist das
  anschließende Budget für die CDP-WebSocket-Bereitschaft, nachdem der Prozess gefunden wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, Low-End-VPS oder älterer Hardware, auf der Chromium
  langsam startet. Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- Wiederholte Fehler beim Start oder bei der Bereitschaft von verwaltetem Chrome werden pro
  Profil durch einen Circuit Breaker unterbrochen. Nach mehreren aufeinanderfolgenden Fehlern pausiert OpenClaw neue Start-
  versuche kurz, statt Chromium bei jedem Browser-Tool-Aufruf zu starten. Beheben Sie
  das Startproblem, deaktivieren Sie den Browser, wenn er nicht benötigt wird, oder starten Sie das
  Gateway nach der Reparatur neu.
- `actionTimeoutMs` ist das Standardbudget für Browser-`act`-Anfragen, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines Kulanzfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, statt an der HTTP-Grenze abzulaufen.
- `tabCleanup` ist eine Best-Effort-Bereinigung für Tabs, die von Browser-Sitzungen des primären Agenten geöffnet wurden. Die Lebenszyklusbereinigung von Sub-Agent, Cron und ACP schließt weiterhin ihre explizit nachverfolgten Tabs am Sitzungsende; primäre Sitzungen halten aktive Tabs wiederverwendbar und schließen dann untätige oder überschüssige nachverfolgte Tabs im Hintergrund.

</Accordion>

<Accordion title="SSRF policy">

- Browsernavigation und geöffnete Tabs werden vor der Navigation SSRF-geschützt und anschließend nach bestem Aufwand auf der finalen `http(s)`-URL erneut geprüft.
- Im strikten SSRF-Modus werden auch die Erkennung von Remote-CDP-Endpunkten und `/json/version`-Probes (`cdpUrl`) geprüft.
- Die Gateway/Provider-Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` proxyn den von OpenClaw verwalteten Browser nicht automatisch. Verwaltetes Chrome startet standardmäßig direkt, sodass Provider-Proxy-Einstellungen die Browser-SSRF-Prüfungen nicht abschwächen.
- Von OpenClaw verwaltete lokale CDP-Bereitschafts-Probes und DevTools-WebSocket-Verbindungen umgehen den verwalteten Netzwerkproxy für den exakt gestarteten Loopback-Endpunkt, sodass `openclaw browser start` weiterhin funktioniert, wenn ein Operator-Proxy Loopback-Egress blockiert.
- Um den verwalteten Browser selbst zu proxyn, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, etwa `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern Browserzugriff auf private Netzwerke nicht bewusst aktiviert ist.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browserzugriff auf private Netzwerke bewusst als vertrauenswürdig gilt.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; es wird nur verbunden, wenn bereits einer läuft.
- `headless` kann global oder pro lokal verwaltetem Profil gesetzt werden. Profilbezogene Werte überschreiben `browser.headless`, sodass ein lokal gestartetes Profil headless bleiben kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokal verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration neu zu schreiben. Profile mit bestehender Sitzung, Attach-only-Profile und
  Remote-CDP-Profile lehnen die Überschreibung ab, weil OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` verwenden lokal verwaltete Profile
  automatisch standardmäßig Headless, wenn weder die Umgebung noch die profilbezogene/globale
  Konfiguration ausdrücklich den Modus mit Oberfläche wählt. `openclaw browser status --json`
  meldet `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt Headless-Starts lokal verwalteter Browser für den
  aktuellen Prozess. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt den Modus mit Oberfläche für normale
  Starts und gibt auf Linux-Hosts ohne Display-Server einen handlungsorientierten Fehler zurück;
  eine ausdrückliche `start --headless`-Anforderung hat für diesen einen Start weiterhin Vorrang.
- `executablePath` kann global oder pro lokal verwaltetem Profil gesetzt werden. Profilbezogene Werte überschreiben `browser.executablePath`, sodass unterschiedliche verwaltete Profile unterschiedliche Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für Ihr Home-Verzeichnis des Betriebssystems.
- `color` (oberste Ebene und pro Profil) färbt die Browseroberfläche ein, damit Sie erkennen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (verwaltet, eigenständig). Verwenden Sie `defaultProfile: "user"`, um sich für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge der automatischen Erkennung: Systemstandardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Es kann über die automatische Verbindung von Chrome MCP oder über `cdpUrl` verbunden werden, wenn Sie bereits einen DevTools-Endpunkt für den laufenden Browser haben.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein Profil mit bestehender Sitzung an ein nicht standardmäßiges Chromium-Benutzerprofil (Brave, Edge usw.) angehängt werden soll. Dieser Pfad akzeptiert ebenfalls `~` für Ihr Home-Verzeichnis des Betriebssystems.

</Accordion>

</AccordionGroup>

## Brave oder einen anderen Chromium-basierten Browser verwenden

Wenn Ihr **Systemstandardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
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

Profilbezogenes `executablePath` wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw
startet. `existing-session`-Profile werden stattdessen mit einem bereits laufenden Browser
verbunden, und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale gegenüber Remote-Steuerung

- **Lokale Steuerung (Standard):** Der Gateway startet den local loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; der Gateway proxyt Browseraktionen an ihn.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  eine Verbindung zu einem Remote-Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Für extern verwaltete CDP-Dienste auf Loopback (zum Beispiel Browserless in
  Docker, veröffentlicht auf `127.0.0.1`) setzen Sie zusätzlich `attachOnly: true`. Loopback-CDP
  ohne `attachOnly` wird als lokales, von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` wirkt sich nur auf lokal verwaltete Profile aus, die OpenClaw startet. Es startet Browser mit bestehender Sitzung oder Remote-CDP-Browser nicht neu und ändert sie auch nicht.
- `executablePath` folgt derselben Regel für lokal verwaltete Profile. Wenn es bei einem
  laufenden lokal verwalteten Profil geändert wird, wird dieses Profil für Neustart/Abgleich markiert, sodass der
  nächste Start die neue Binärdatei verwendet.

Das Stoppverhalten unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browserprozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Locale, Zeitzone, Offline-Modus und ähnlicher Zustand), auch
  wenn kein Browserprozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Tokens (z. B. `https://provider.example?token=<token>`)
- HTTP-Basic-Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei, wenn `/json/*`-Endpunkte aufgerufen werden und wenn eine Verbindung
zum CDP-WebSocket hergestellt wird. Verwenden Sie für Tokens vorzugsweise Umgebungsvariablen oder Secret-Manager,
anstatt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browserkonfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es für das Legacy-/Standardverhalten leer: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw es als Least-Privilege-Grenze: Nur Profile auf der Allowlist können angesteuert werden, und persistente Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
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
- Wenn Browserless Ihnen eine HTTPS-Basis-URL liefert, können Sie sie entweder für eine direkte CDP-Verbindung in
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
OpenClaw-Prozess erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt bewerben;
setzen Sie Browserless `EXTERNAL` auf dieselbe für OpenClaw öffentliche WebSocket-Basis, etwa
`ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private Docker-
Netzwerkadresse. Wenn `/json/version` eine `webSocketDebuggerUrl` zurückgibt, die auf
eine Adresse verweist, die OpenClaw nicht erreichen kann, kann CDP HTTP gesund wirken, während das WebSocket-
Attach weiterhin fehlschlägt.

Lassen Sie `attachOnly` für ein Loopback-Browserless-Profil nicht ungesetzt. Ohne
`attachOnly` behandelt OpenClaw den Loopback-Port als lokal verwaltetes Browser-
profil und meldet möglicherweise, dass der Port belegt ist, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browserdienste stellen einen **direkten WebSocket**-Endpunkt statt der
standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
CDP-URL-Formen und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** - `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln, und stellt dann
  die Verbindung her. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** - `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-
  Pfad. OpenClaw verbindet sich direkt über einen WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Bloße WebSocket-Roots** - `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst die HTTP-
  `/json/version`-Erkennung (mit Normalisierung des Schemas zu `http`/`https`);
  wenn die Erkennung eine `webSocketDebuggerUrl` zurückgibt, wird sie verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake am bloßen Root zurück. Wenn der beworbene
  WebSocket-Endpunkt den CDP-Handshake ablehnt, aber der konfigurierte bloße Root
  ihn akzeptiert, fällt OpenClaw ebenfalls auf diesen Root zurück. Dadurch kann ein bloßes `ws://`,
  das auf ein lokales Chrome verweist, weiterhin verbinden, da Chrome WebSocket-
  Upgrades nur auf dem spezifischen zielbezogenen Pfad aus `/json/version` akzeptiert, während gehostete
  Provider weiterhin ihren Root-WebSocket-Endpunkt verwenden können, wenn ihr Erkennungs-
  endpunkt eine kurzlebige URL bewirbt, die für Playwright CDP nicht geeignet ist.

`openclaw browser doctor` verwendet dieselbe Discovery-first-, WebSocket-Fallback-
Logik wie das Runtime-Attach, sodass eine Bare-Root-URL, die erfolgreich verbindet, von der Diagnose nicht
als unerreichbar gemeldet wird.

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
  aus dem [Overview Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist kein
  manueller Schritt zur Sitzungserstellung erforderlich.
- Der kostenlose Tarif erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Informationen zu Limits kostenpflichtiger Tarife finden Sie unter [Preise](https://www.browserbase.com/pricing).
- Die vollständige API-Referenz, SDK-Anleitungen und Integrationsbeispiele finden Sie in der
  [Browserbase-Dokumentation](https://docs.browserbase.com).

### Notte

[Notte](https://www.notte.cc) ist eine Cloud-Plattform zum Ausführen headless
Browser mit integrierter Tarnung, Residential Proxies und einem CDP-nativen
WebSocket-Gateway.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Hinweise:

- [Registrieren Sie sich](https://console.notte.cc) und kopieren Sie Ihren **API Key** von der
  Einstellungsseite der Konsole.
- Ersetzen Sie `<NOTTE_API_KEY>` durch Ihren echten Notte-API-Schlüssel.
- Notte erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist kein manueller
  Schritt zur Sitzungserstellung erforderlich. Die Sitzung wird zerstört, wenn die
  WebSocket-Verbindung getrennt wird.
- Der kostenlose Tarif erlaubt fünf gleichzeitige Sitzungen und insgesamt 100 Browser-Stunden.
  Informationen zu Limits kostenpflichtiger Tarife finden Sie unter [Preise](https://www.notte.cc/#pricing).
- Die vollständige API-Referenz, SDK-Anleitungen und Integrationsbeispiele finden Sie in der
  [Notte-Dokumentation](https://docs.notte.cc).

## Sicherheit

Kernpunkte:

- Die Browser-Steuerung ist auf local loopback beschränkt; der Zugriff läuft über die Authentifizierung des Gateway oder Node-Pairing.
- Die eigenständige Browser-HTTP-API für local loopback verwendet **ausschließlich Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige Browser-API für local loopback **nicht**.
- Wenn die Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, generiert OpenClaw
  für diesen Start ein nur zur Laufzeit gültiges Gateway-Token. Konfigurieren Sie
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder
  `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients ein stabiles Secret über
  Neustarts hinweg benötigen.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exposition.
- Behandeln Sie Remote-CDP-URLs/-Token als Secrets; bevorzugen Sie Umgebungsvariablen oder einen Secrets Manager.

Remote-CDP-Tipps:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token, wo möglich.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **openclaw-managed**: eine dedizierte Chromium-basierte Browser-Instanz mit eigenem Benutzerdatenverzeichnis und CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo läuft)
- **existing session**: Ihr vorhandenes Chrome-Profil über automatische Verbindung per Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist für das Anhängen an vorhandene Chrome-MCP-Sitzungen integriert.
- Profile für vorhandene Sitzungen sind über `user` hinaus optional; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800-18899** zugewiesen.
- Das Löschen eines Profils verschiebt sein lokales Datenverzeichnis in den Papierkorb.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Vorhandene Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes
Chromium-basiertes Browser-Profil anhängen. Dadurch werden die Tabs und der Anmeldestatus wiederverwendet,
die in diesem Browser-Profil bereits geöffnet sind.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Profil für vorhandene Sitzungen, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis wünschen.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
  lokale Standardprofil von Google Chrome abzielt.

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
3. Lassen Sie den Browser laufen und genehmigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Häufige Inspect-Seiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Smoke-Test zum Anhängen:

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

- Der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspect-Seite dieses Browsers aktiviert
- Der Browser hat die Zustimmungsaufforderung zum Anhängen angezeigt und Sie haben sie akzeptiert
- Wenn Chrome mit einem expliziten `--remote-debugging-port` gestartet wurde, setzen Sie
  `browser.profiles.<name>.cdpUrl` stattdessen auf diesen DevTools-Endpunkt, anstatt sich
  auf die automatische Verbindung von Chrome MCP zu verlassen
- `openclaw doctor` migriert alte erweiterungsbasierte Browser-Konfigurationen und prüft, dass
  Chrome lokal für Standardprofile mit automatischer Verbindung installiert ist, kann aber
  Remote-Debugging im Browser nicht für Sie aktivieren

Agent-Nutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browser-Status des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Profil für vorhandene Sitzungen verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Aufforderung zum Anhängen
  zu genehmigen.
- Der Gateway- oder Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browser-Sitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an.
- OpenClaw verwendet hier den offiziellen Chrome DevTools MCP-Flow `--autoConnect`. Wenn
  `userDataDir` gesetzt ist, wird es durchgereicht, um dieses Benutzerdatenverzeichnis anzusteuern.
- Vorhandene Sitzungen können sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

### Benutzerdefinierter Chrome-MCP-Start

Überschreiben Sie den gestarteten Chrome DevTools MCP-Server pro Profil, wenn der Standard-Flow
`npx chrome-devtools-mcp@latest` nicht Ihren Anforderungen entspricht (Offline-Hosts,
fixierte Versionen, mitgelieferte Binärdateien):

| Feld         | Funktion                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die statt `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt.        |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` für ein Profil mit vorhandener Sitzung gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (DevTools-HTTP-Erkennungsendpunkt).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` für den Chrome-MCP-Start ignoriert, da Chrome MCP sich an
den laufenden Browser hinter dem Endpunkt anhängt, anstatt ein Profilverzeichnis
zu öffnen.

<Accordion title="Funktionsbeschränkungen vorhandener Sitzungen">

Im Vergleich zum verwalteten Profil `openclaw` sind Treiber für vorhandene Sitzungen stärker eingeschränkt:

- **Screenshots** - Seitenaufnahmen und `--ref`-Elementaufnahmen funktionieren; CSS-`--element`-Selektoren nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Playwright ist für Seiten- oder ref-basierte Element-Screenshots nicht erforderlich.
- **Aktionen** - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Refs (keine CSS-Selektoren). `click-coords` klickt sichtbare Viewport-Koordinaten und erfordert keine Snapshot-Ref. `click` verwendet nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Warten / Hochladen / Dialog** - `wait --url` unterstützt exakte Muster, Teilzeichenfolgen und Glob-Muster; `wait --load networkidle` wird für Profile mit vorhandenen Sitzungen nicht unterstützt (es funktioniert bei verwalteten und rohen/Remote-CDP-Profilen). Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, kein CSS-`element`. Dialog-Hooks unterstützen keine Timeout-Überschreibungen oder `dialogId`.
- **Dialogsichtbarkeit** - Antworten verwalteter Browser-Aktionen enthalten `blockedByDialog` und `browserState.dialogs.pending`, wenn eine Aktion einen modalen Dialog öffnet; Snapshots enthalten ebenfalls ausstehenden Dialogstatus. Antworten Sie mit `browser dialog --accept/--dismiss --dialog-id <id>`, während ein Dialog aussteht. Außerhalb von OpenClaw behandelte Dialoge erscheinen unter `browserState.dialogs.recent`.
- **Nur verwaltete Funktionen** - Batch-Aktionen, PDF-Export, Download-Abfangung und `responsebody` erfordern weiterhin den verwalteten Browser-Pfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: berührt niemals Ihr persönliches Browser-Profil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, dann
  stabile `tabId`-Handles wie `t1`, optionale Labels und die rohe `targetId`.
  Agents sollten `suggestedTargetId` wiederverwenden; rohe IDs bleiben für
  Debugging und Kompatibilität verfügbar.

## Browser-Auswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren aus:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: prüft gängige Chrome-/Brave-/Edge-/Chromium-Speicherorte unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser` sowie von Playwright verwaltetes Chromium unter
  `PLAYWRIGHT_BROWSERS_PATH` oder `~/.cache/ms-playwright`.
- Windows: prüft gängige Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt das Gateway eine kleine **nur für local loopback zugängliche HTTP-
Steuerungs-API** sowie eine passende `openclaw browser`-CLI bereit (Snapshots, Refs, Wait-
Power-Ups, JSON-Ausgabe, Debugging-Workflows). Die vollständige Referenz finden Sie unter
[Browser-Steuerungs-API](/de/tools/browser-control).

## Fehlerbehebung

Bei Linux-spezifischen Problemen (insbesondere snap Chromium) siehe
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für WSL2 Gateway + Windows Chrome Split-Host-Setups siehe
[Fehlerbehebung für WSL2 + Windows + remote Chrome CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. Navigation-SSRF-Block

Dies sind unterschiedliche Fehlerklassen, und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene fehlerfrei ist.
- **Navigation-SSRF-Block** bedeutet, dass die Browser-Steuerungsebene fehlerfrei ist, ein Ziel für die Seitennavigation aber durch eine Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer CDP-Dienst über loopback ohne `attachOnly: true` konfiguriert ist
- Navigation-SSRF-Block:
  - `open`-, `navigate`-, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um beides zu trennen:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin fehlerhaft. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv, und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad für verwaltete Browser fehlerfrei.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fail-closed SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das local loopback-verwaltete Profil `openclaw` überspringen CDP-Health-Checks absichtlich die Durchsetzung der Browser-SSRF-Erreichbarkeit für OpenClaws eigene lokale Steuerungsebene.
- Der Navigationsschutz ist separat. Ein erfolgreiches `start`- oder `tabs`-Ergebnis bedeutet nicht, dass ein späteres `open`- oder `navigate`-Ziel zulässig ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber breitem Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools und Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (KI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite, Element oder beschriftete Referenzen).
- `browser doctor` prüft Gateway, Plugin, Profil, Browser und Tab-Bereitschaft.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browser-Profil auszuwählen (openclaw, Chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser läuft.
  - In Sandbox-Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Nicht-Sandbox-Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin routen, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dies hält den Agenten deterministisch und vermeidet fragile Selektoren.

## Verwandte Themen

- [Tool-Übersicht](/de/tools) - alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) - Browser-Steuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) - Risiken und Härtung bei der Browser-Steuerung
