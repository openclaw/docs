---
read_when:
    - Hinzufügen agentengesteuerter Browserautomatisierung
    - 'Fehlerbehebung: Warum OpenClaw Ihren eigenen Chrome-Browser beeinträchtigt'
    - Implementierung von Browsereinstellungen und Lebenszyklus in der macOS-App
summary: Integrierter Browsersteuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-07-12T15:56:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das der Agent steuert. Es wird über einen kleinen lokalen Steuerungsdienst innerhalb des Gateway ausgeführt (nur Loopback) und ist von Ihrem persönlichen Browser isoliert.

- Betrachten Sie es als **separaten Browser ausschließlich für den Agenten**. Das Profil `openclaw` greift niemals auf Ihr persönliches Browserprofil zu.
- Der Agent öffnet Tabs, liest Seiten, klickt und gibt Text in dieser isolierten Umgebung ein.
- Das integrierte Profil `user` stellt stattdessen über Chrome DevTools MCP eine Verbindung zu Ihrer tatsächlich angemeldeten Chrome-Sitzung her.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbener Akzentfarbe).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/eingeben/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Playwright-basierte Profile speichern direkte Navigationen zu Anhängen im verwalteten Downloadverzeichnis und geben nach der Richtlinienprüfung der endgültigen URL Metadaten im Format `{ url, suggestedFilename, path }` zurück.
- Playwright-basierte Agentenaktionen geben ein `downloads`-Array mit denselben verwalteten Metadaten zurück, wenn die Aktion unmittelbar einen oder mehrere Downloads startet.
- Ein mitgeliefertes `browser-automation`-Skill, das Agenten die Wiederherstellungsschleife für Snapshots,
  stabile Tabs, veraltete Referenzen und manuelle Blockierungen vermittelt, wenn das Browser-
  Plugin aktiviert ist.
- Optionale Unterstützung mehrerer Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** für Ihre tägliche Nutzung vorgesehen. Er bietet eine sichere, isolierte Oberfläche für die
Automatisierung und Verifizierung durch Agenten.

Unter macOS können Sie Cookies explizit aus einem Systemprofil der Chrome-Familie in ein separates verwaltetes Profil kopieren. Der verwaltete Browser verwendet weiterhin sein eigenes Benutzerdatenverzeichnis; nur die ausgewählten Cookies werden kopiert, während lokaler Speicher und IndexedDB zurückbleiben. Informationen zu Importbefehlen und Einschränkungen finden Sie unter [Profile](#profiles-multi-browser) oder in der [CLI-Referenz zu `openclaw browser`](/de/cli/browser).

## Schnellstart

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

„Browser disabled“ bedeutet, dass das Plugin oder `browser.enabled` deaktiviert ist; siehe
[Konfiguration](#configuration) und [Plugin-Steuerung](#plugin-control).

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, wechseln Sie zu [Fehlender Browserbefehl oder fehlendes Tool](#missing-browser-command-or-tool).

## Plugin-Steuerung

Das standardmäßige `browser`-Tool ist ein mitgeliefertes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben Tool-Namen `browser` registriert:

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

Für die Standardeinstellungen müssen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true` gesetzt sein. Wenn Sie nur das Plugin deaktivieren, werden die CLI `openclaw browser`, die Gateway-Methode `browser.request`, das Agenten-Tool und der Steuerungsdienst gemeinsam entfernt; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz erhalten.

Änderungen an der Browserkonfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Hinweise für Agenten

Hinweis zum Tool-Profil: `tools.profile: "coding"` umfasst `web_search` und
`web_fetch`, jedoch nicht das vollständige `browser`-Tool. Damit der Agent oder ein
gestarteter Unteragent die Browserautomatisierung verwenden kann, fügen Sie den Browser auf der Profilebene
hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie für einen einzelnen Agenten `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein reicht nicht aus, da die Richtlinie für Unteragenten
erst nach der Profilfilterung angewendet wird.

Das Browser-Plugin stellt Hinweise für Agenten auf zwei Ebenen bereit:

- Die Beschreibung des `browser`-Tools enthält den kompakten, stets aktiven Vertrag: das
  richtige Profil auswählen, Referenzen im selben Tab verwenden, `tabId`/Bezeichnungen zur
  Tab-Auswahl nutzen und für mehrstufige Aufgaben das Browser-Skill laden.
- Das mitgelieferte `browser-automation`-Skill enthält den ausführlicheren Arbeitsablauf:
  zuerst Status/Tabs prüfen, Aufgaben-Tabs bezeichnen, vor Aktionen einen Snapshot erstellen, nach
  UI-Änderungen erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und
  Blockierungen durch Anmeldung/2FA/Captcha oder Kamera/Mikrofon als erforderliche manuelle Aktion
  melden, statt zu raten.

Mit Plugins mitgelieferte Skills werden in den verfügbaren Skills des Agenten aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass bei routinemäßigen
Durchläufen nicht die vollständigen Token-Kosten anfallen.

## Fehlender Browserbefehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, liegt die Ursache normalerweise in einer `plugins.allow`-Liste, die `browser` nicht enthält, während kein `browser`-Konfigurationsblock auf der Stammebene vorhanden ist. Fügen Sie ihn hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter `browser`-Block auf der Stammebene (ein beliebiger Schlüssel unter `browser`, etwa
`browser.enabled=true` oder `browser.profiles.<name>`) aktiviert das mitgelieferte
Browser-Plugin selbst bei einer restriktiven `plugins.allow`-Liste, entsprechend dem Verhalten der Konfiguration
mitgelieferter Kanäle. `plugins.entries.browser.enabled=true` und
`tools.alsoAllow: ["browser"]` ersetzen allein nicht die Mitgliedschaft in der
Zulassungsliste. Wenn Sie `plugins.allow` vollständig entfernen, wird ebenfalls der Standard wiederhergestellt.

## Profile: `openclaw`, `user`, `chrome`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-DevTools-MCP-Verbindungsprofil für Ihre **tatsächlich
  angemeldete Chrome-Sitzung**. Chrome zeigt beim ersten Verbindungsaufbau durch OpenClaw die blockierende
  Aufforderung „Allow remote debugging?“ an, sodass sich jemand am Computer befinden muss.
- `chrome`: integriertes Profil der [Chrome-Erweiterung](/tools/chrome-extension) für
  Ihre **tatsächlich angemeldete Chrome-Sitzung**. Funktioniert von einem Smartphone aus, auch wenn niemand am
  Schreibtisch sitzt, da Tabs über die OpenClaw-Browsererweiterung statt über
  den Remote-Debugging-Port gesteuert werden; daher erscheint keine Aufforderung „Allow remote debugging?“.

Für Aufrufe des Browser-Tools durch Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="chrome"` (Erweiterung), wenn bestehende angemeldete Sitzungen erforderlich sind
  und der Benutzer **nicht am Computer** ist (Telegram, WhatsApp usw.).
- Bevorzugen Sie `profile="user"` (Chrome MCP), wenn bestehende angemeldete Sitzungen erforderlich sind
  und der Benutzer **am Computer** ist, um die Verbindungsaufforderung zu bestätigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus verwenden möchten.

Legen Sie `browser.defaultProfile: "openclaw"` fest, wenn Sie standardmäßig den verwalteten Modus verwenden möchten.

## Konfiguration

Browsereinstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    evaluateEnabled: true, // Standard: true; false deaktiviert act:evaluate (beliebiges JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // ältere Überschreibung für ein einzelnes Profil
    remoteCdpTimeoutMs: 1500, // Zeitüberschreitung für Remote-CDP-HTTP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // Zeitüberschreitung für Remote-CDP-WebSocket-Handshake (ms)
    localLaunchTimeoutMs: 15000, // Zeitüberschreitung für die lokale Erkennung des verwalteten Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // Zeitüberschreitung für lokale CDP-Bereitschaft nach dem Start (ms)
    actionTimeoutMs: 60000, // standardmäßige Zeitüberschreitung für Browseraktionen (ms)
    tabCleanup: {
      enabled: true, // Standard: true
      idleMinutes: 120, // auf 0 setzen, um die Bereinigung inaktiver Tabs zu deaktivieren
      maxTabsPerSession: 8, // auf 0 setzen, um das Limit pro Sitzung zu deaktivieren
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // standardmäßiger Snapshot-Modus, wenn der Aufrufer keinen angibt
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

`browser.snapshotDefaults.mode: "efficient"` ändert den standardmäßigen `snapshot`-
Extraktionsmodus, wenn ein Aufrufer weder ein explizites `snapshotFormat` noch einen
`mode` übergibt; Optionen für einzelne Snapshot-Aufrufe finden Sie unter [Browsersteuerungs-API](/de/tools/browser-control).

### Screenshot-Bilderkennung (Unterstützung für reine Textmodelle)

Wenn das Hauptmodell ausschließlich Text unterstützt (keine Bild-/Multimodal-Unterstützung), geben Browser-
Screenshots Bildblöcke zurück, die das Modell nicht lesen kann. Browser-Screenshots
verwenden die vorhandene Konfiguration zur Bilderkennung erneut, sodass ein für das Medienverständnis
konfiguriertes Bildmodell Screenshots ohne browserspezifische Modelleinstellungen als Text
beschreiben kann.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Fallback-Kandidaten hinzufügen; der erste Erfolg gewinnt
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Gemeinsam genutzte Medienmodelle funktionieren ebenfalls, wenn sie für Bildunterstützung gekennzeichnet sind.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Vorhandene Standardeinstellungen für Bildmodelle werden ebenfalls berücksichtigt.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Funktionsweise:**

1. Der Agent ruft `browser screenshot` auf, und ein Bild wird wie gewohnt auf dem Datenträger gespeichert.
2. Das Browser-Tool fragt die vorhandene Laufzeit zur Bilderkennung, ob sie
   den Screenshot mithilfe konfigurierter Medienbildmodelle, gemeinsam genutzter Medien-
   modelle, Bildmodell-Standardeinstellungen oder eines authentifizierungsgestützten Bild-Providers beschreiben kann.
3. Das Bildmodell gibt eine Textbeschreibung zurück, die mit
   `wrapExternalContent` (Schutz vor Prompt-Injection) umschlossen und dem Agenten
   als Textblock statt als Bildblock zurückgegeben wird.
4. Wenn die Bilderkennung nicht verfügbar ist, übersprungen wird oder fehlschlägt, gibt der Browser
   stattdessen den ursprünglichen Bildblock zurück.

Screenshot-Bildblöcke sind private Tool-Ergebnisse: Der Agent kann sie prüfen,
OpenClaw hängt sie jedoch nicht automatisch an Antworten in Kanälen an. Um einen
Screenshot zu teilen, weisen Sie den Agenten an, ihn explizit mit dem Nachrichten-Tool zu senden.

Verwenden Sie die vorhandenen Felder `tools.media.image` / `tools.media.models` für Modell-
Fallbacks, Zeitüberschreitungen, Bytelimits, Profile und Einstellungen für Provider-Anfragen.

Wenn das aktive Hauptmodell bereits Bilder unterstützt und kein explizites Modell zur
Bilderkennung konfiguriert ist, behält OpenClaw das normale Bildergebnis bei, sodass das
Hauptmodell den Screenshot direkt lesen kann.

<AccordionGroup>

<Accordion title="Ports und Erreichbarkeit">

- Der Steuerungsdienst bindet sich an die Loopback-Schnittstelle auf einem von `gateway.port` abgeleiteten Port (Standardwert `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` hat Vorrang vor `gateway.port`; beide verschieben die abgeleiteten Ports derselben Familie entsprechend.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch aus einem Bereich zu, der 9 Ports über dem Steuerungsport beginnt (standardmäßig `18800`-`18899`); legen Sie diese nur für
  Remote-CDP-Profile oder zum Verbinden mit dem Endpunkt einer bestehenden Sitzung fest. Wenn `cdpUrl` nicht festgelegt ist, wird standardmäßig
  der verwaltete lokale CDP-Port verwendet.
- `remoteCdpTimeoutMs` gilt für HTTP-Erreichbarkeitsprüfungen von Remote- und `attachOnly`-CDP-Endpunkten
  sowie für HTTP-Anfragen zum Öffnen von Tabs; `remoteCdpHandshakeTimeoutMs` gilt für
  deren CDP-WebSocket-Handshakes. Die persistente Auflistung von Remote-Playwright-Tabs
  verwendet den größeren der beiden Werte als Zeitlimit für den Vorgang.
- `localLaunchTimeoutMs` ist das Zeitbudget, innerhalb dessen ein lokal gestarteter verwalteter Chrome-
  Prozess seinen CDP-HTTP-Endpunkt bereitstellen muss. `localCdpReadyTimeoutMs` ist das
  anschließende Zeitbudget für die CDP-WebSocket-Bereitschaft, nachdem der Prozess erkannt wurde.
  Erhöhen Sie diese Werte auf Raspberry Pi, leistungsschwachen VPS oder älterer Hardware, auf der Chromium
  langsam startet. Die Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- Wiederholte Fehler beim Starten oder Herstellen der Bereitschaft von verwaltetem Chrome werden pro
  Profil durch einen Schutzschalter begrenzt. Nach mehreren aufeinanderfolgenden Fehlern pausiert OpenClaw neue Start-
  versuche kurzzeitig, anstatt Chromium bei jedem Aufruf eines Browser-Tools zu starten. Beheben Sie
  das Startproblem, deaktivieren Sie den Browser, wenn er nicht benötigt wird, oder starten Sie nach der
  Reparatur das Gateway neu.
- `actionTimeoutMs` ist das standardmäßige Zeitbudget für Browser-`act`-Anfragen, wenn der Aufrufer kein `timeoutMs` übergibt. Der Client-Transport fügt ein kleines Toleranzfenster hinzu, damit lange Wartezeiten abgeschlossen werden können, anstatt an der HTTP-Grenze eine Zeitüberschreitung auszulösen.
- `tabCleanup` führt eine Best-Effort-Bereinigung für Tabs durch, die von Browser-Sitzungen des primären Agenten geöffnet wurden. Die Lebenszyklusbereinigung für Subagenten, Cron und ACP schließt weiterhin deren explizit erfasste Tabs am Sitzungsende; primäre Sitzungen halten aktive Tabs wiederverwendbar und schließen anschließend inaktive oder überzählige erfasste Tabs im Hintergrund.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browsernavigationen und Anfragen zum Öffnen von Tabs werden vorab geprüft. Während der Aktion und einer begrenzten Nachfrist danach fangen geschützte Playwright-Interaktionen (Klick, Koordinatenklick, Darüberfahren, Ziehen, Scrollen, Auswählen, Tastendruck, Texteingabe, Formularausfüllen und Auswerten) durch die Richtlinie abgelehnte Dokumentladevorgänge im obersten Frame und in Unterframes ab, bevor Bytes der HTTP-Anfrage gesendet werden, und prüfen anschließend nach bestem Bemühen die endgültige `http(s)`-URL erneut.
- Vor jedem neuen Start eines von OpenClaw verwalteten Chrome deaktiviert OpenClaw nach bestem Bemühen die Netzwerkvorhersage und unterdrückt so die beobachteten spekulativen Vorabverbindungen von Chromium für diese abgelehnten Ladevorgänge. Dies ist eine zusätzliche Schutzebene, keine Richtliniengrenze: Ein Browser, der über einen Neustart des Steuerungsdienstes hinweg wiederverwendet wird, sowie andere Browser-Backends verfügen möglicherweise nicht über dieselbe Absicherung. Das Playwright-Routing ist weiterhin keine Netzwerk-Firewall und fängt weder Weiterleitungsschritte noch die erste Anfrage eines Pop-ups, Service-Worker-Datenverkehr, nach Ablauf des begrenzten Schutzfensters ausgeführten Seitencode oder jeden Hintergrund-/Unterressourcenpfad ab. Eine vollständige Egress-Isolierung erfordert eine Isolation auf Eigentümerseite oder einen richtliniendurchsetzenden Proxy.
- Im strikten SSRF-Modus werden auch die Ermittlung von Remote-CDP-Endpunkten und `/json/version`-Prüfungen (`cdpUrl`) geprüft.
- Die Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` des Gateway/Providers leiten den von OpenClaw verwalteten Browser nicht automatisch über einen Proxy. Verwaltetes Chrome startet standardmäßig mit direkter Verbindung, damit Proxy-Einstellungen des Providers die Browser-SSRF-Prüfungen nicht abschwächen.
- Von OpenClaw verwaltete lokale CDP-Bereitschaftsprüfungen und DevTools-WebSocket-Verbindungen umgehen den verwalteten Netzwerk-Proxy für den exakt gestarteten Loopback-Endpunkt, sodass `openclaw browser start` auch dann funktioniert, wenn ein Betreiber-Proxy ausgehenden Loopback-Datenverkehr blockiert.
- Um den verwalteten Browser selbst über einen Proxy zu leiten, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, beispielsweise `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern der Browserzugriff auf private Netzwerke nicht absichtlich aktiviert wurde.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn dem Browserzugriff auf private Netzwerke ausdrücklich vertraut wird.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; es wird nur eine Verbindung hergestellt, wenn bereits einer ausgeführt wird.
- `headless` kann global oder pro lokalem verwaltetem Profil festgelegt werden. Profilbezogene Werte überschreiben `browser.headless`, sodass ein lokal gestartetes Profil im Headless-Modus betrieben werden kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokale verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration neu zu schreiben. Profile für bestehende Sitzungen, reine Verbindungsprofile und
  Remote-CDP-Profile lehnen die Überschreibung ab, da OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` wechseln lokale verwaltete Profile
  standardmäßig automatisch in den Headless-Modus, wenn weder die Umgebung noch die profilbezogene/globale
  Konfiguration ausdrücklich den sichtbaren Modus auswählt. Verwenden Sie die eindeutige Form auf Browserebene
  `openclaw browser --json status`; das nachgestellte `openclaw browser status --json`
  funktioniert ebenfalls, da `status` kein eigenes `--json` definiert. Der Befehl meldet
  `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt für lokale verwaltete Starts des
  aktuellen Prozesses den Headless-Modus. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt für gewöhnliche
  Starts den sichtbaren Modus und gibt auf Linux-Hosts ohne Display-Server einen umsetzbaren Fehler zurück;
  eine explizite Anfrage `start --headless` hat für diesen einen Start weiterhin Vorrang.
- Die Browser-Steuerungsroute und der programmatische Client behalten den menschenlesbaren
  `error` des Fehlers bei fehlendem Display bei und stellen den stabilen Grund
  `no_display_for_headed_profile` bereit. Die zugehörigen `details` enthalten ausschließlich `profile`,
  `requestedHeadless`, `headlessSource` und `displayPresent`, sodass API-Clients
  die richtige Abhilfe wählen können, ohne Nachrichtentext abzugleichen.
- Für ein ausgeführtes lokales verwaltetes Profil fragen Status und Doctor den
  CDP-Endpunkt von Chrome auf Browserebene nach Renderer, Backend, Gerät/Treiber, Funktions-
  status, Treiber-Workarounds und Funktionen für beschleunigte Videowiedergabe ab. Das Ergebnis wird
  für diesen Browserprozess zwischengespeichert und vollständig über
  `openclaw browser --json status` bereitgestellt. Ein passiver Statusaufruf startet Chrome nicht.
  Browser für bestehende Sitzungen, Erweiterungen, Remote-CDP und Sandbox bleiben getrennt
  und werden nicht über diesen Pfad des verwalteten Hosts geprüft.
- Verwaltetes Chrome im Headless-Modus verwendet weiterhin den konservativen Standardwert `--disable-gpu`.
  Die Diagnose aktiviert keine Beschleunigung, fügt keine globale Beschleunigungseinstellung hinzu
  und gewährt Sandbox-Browsern keinen Gerätezugriff.
- `executablePath` kann global oder pro lokalem verwaltetem Profil festgelegt werden. Profilbezogene Werte überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile unterschiedliche Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für das Stammverzeichnis Ihres Betriebssystembenutzers.
- `color` (auf oberster Ebene und pro Profil) färbt die Browseroberfläche ein, damit Sie erkennen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (eigenständig verwaltet). Verwenden Sie `defaultProfile: "user"`, um den angemeldeten Benutzerbrowser zu verwenden.
- Reihenfolge der automatischen Erkennung: systemweiter Standardbrowser, falls Chromium-basiert; andernfalls Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von unverarbeitetem CDP. Die Verbindung kann über die automatische Verbindung von Chrome MCP oder über `cdpUrl` hergestellt werden, wenn Sie bereits über einen DevTools-Endpunkt für den ausgeführten Browser verfügen.
- `driver: "extension"` steuert Ihr angemeldetes Chrome über die [OpenClaw-Chrome-Erweiterung](/tools/chrome-extension). Das Relay verwaltet seinen Loopback-Endpunkt, daher akzeptieren diese Profile kein `cdpUrl`. Dies ist der einzige Modus für einen angemeldeten Browser, der funktioniert, wenn sich niemand am Computer befindet.
- Legen Sie `browser.profiles.<name>.userDataDir` fest, wenn ein Profil für eine bestehende Sitzung eine Verbindung zu einem nicht standardmäßigen Chromium-Benutzerprofil (Brave, Edge usw.) herstellen soll. Dieser Pfad akzeptiert ebenfalls `~` für das Stammverzeichnis Ihres Betriebssystembenutzers.

</Accordion>

</AccordionGroup>

## Brave oder einen anderen Chromium-basierten Browser verwenden

Wenn Ihr **systemweiter Standardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
verwendet OpenClaw ihn automatisch. Legen Sie `browser.executablePath` fest, um die
automatische Erkennung zu überschreiben. Werte für `executablePath` auf oberster Ebene und pro Profil akzeptieren `~`
für das Stammverzeichnis Ihres Betriebssystembenutzers:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Oder legen Sie den Wert plattformspezifisch in der Konfiguration fest:

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

Das profilbezogene `executablePath` wirkt sich nur auf lokale verwaltete Profile aus, die OpenClaw
startet. `existing-session`-Profile stellen stattdessen eine Verbindung zu einem bereits ausgeführten Browser her,
und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale und Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den Loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Computer aus, auf dem sich der Browser befindet; das Gateway leitet Browseraktionen als Proxy an ihn weiter.
- **Remote-CDP:** Legen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`) fest, um
  eine Verbindung zu einem entfernten Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Legen Sie für extern verwaltete CDP-Dienste auf der Loopback-Schnittstelle (beispielsweise Browserless in
  Docker, veröffentlicht unter `127.0.0.1`) zusätzlich `attachOnly: true` fest. Loopback-CDP
  ohne `attachOnly` wird als lokales, von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` wirkt sich nur auf lokale verwaltete Profile aus, die OpenClaw startet. Es startet Browser für bestehende Sitzungen oder Remote-CDP weder neu noch verändert es sie.
- `executablePath` folgt derselben Regel für lokale verwaltete Profile. Wird der Wert bei einem
  ausgeführten lokalen verwalteten Profil geändert, wird dieses Profil für einen Neustart/Abgleich markiert, sodass beim
  nächsten Start die neue Binärdatei verwendet wird.

Das Verhalten beim Beenden unterscheidet sich je nach Profilmodus:

- lokale verwaltete Profile: `openclaw browser stop` beendet den Browserprozess, den
  OpenClaw gestartet hat
- reine Verbindungs- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offlinemodus und ähnliche Zustände), obwohl
  kein Browserprozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierungsdaten enthalten:

- Abfragetoken (z. B. `https://provider.example?token=<token>`)
- HTTP-Basisauthentifizierung (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierungsdaten bei Aufrufen von `/json/*`-Endpunkten und beim Herstellen der Verbindung
zum CDP-WebSocket bei. Verwenden Sie für Token vorzugsweise Umgebungsvariablen oder Secret-Manager,
anstatt sie in Konfigurationsdateien einzuchecken.

## Node-Browser-Proxy (konfigurationsfreier Standard)

Wenn Sie einen **Node-Host** auf dem Computer ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browserkonfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Nodes (wie bei einer lokalen Konfiguration).
- Der Proxy-Befehl erlaubt unabhängig von `allowProfiles` niemals dauerhafte Profiländerungen (`create-profile`, `delete-profile`, `reset-profile`); nehmen Sie diese Änderungen direkt auf dem Node vor.
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie die Option für das bisherige/standardmäßige Verhalten leer: Alle konfigurierten Profile bleiben über den Proxy erreichbar.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` festlegen, behandelt OpenClaw dies als Least-Privilege-Grenze, die einschränkt, auf welche Profilnamen der Proxy zugreifen darf.
- Deaktivieren Sie die Funktion, wenn Sie sie nicht verwenden möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"` (akzeptiert auch `"auto"`, um einen einzelnen verbundenen Browser-Node auszuwählen, oder `"manual"`, um einen expliziten Node-Parameter zu verlangen)

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide
Formen verwenden, aber für ein Remote-Browserprofil ist die direkte WebSocket-URL
aus der Verbindungsdokumentation von Browserless die einfachste Option.

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

- Ersetzen Sie `<BROWSERLESS_API_KEY>` durch Ihr tatsächliches Browserless-Token.
- Wählen Sie den regionalen Endpunkt, der zu Ihrem Browserless-Konto passt (siehe deren Dokumentation).
- Wenn Browserless Ihnen eine HTTPS-Basis-URL bereitstellt, können Sie diese entweder
  für eine direkte CDP-Verbindung in `wss://` umwandeln oder die HTTPS-URL beibehalten
  und OpenClaw `/json/version` ermitteln lassen.

### Browserless Docker auf demselben Host

Wenn Browserless selbstgehostet in Docker ausgeführt wird und OpenClaw auf dem
Host läuft, behandeln Sie Browserless als extern verwalteten CDP-Dienst:

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

Die Adresse in `browser.profiles.browserless.cdpUrl` muss für den OpenClaw-Prozess
erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt
bekannt geben. Setzen Sie `EXTERNAL` von Browserless auf dieselbe von OpenClaw
erreichbare WebSocket-Basis, beispielsweise `ws://127.0.0.1:3000`,
`ws://browserless:3000` oder eine stabile private Docker-Netzwerkadresse. Wenn
`/json/version` eine `webSocketDebuggerUrl` zurückgibt, die auf eine für OpenClaw
nicht erreichbare Adresse verweist, kann CDP HTTP funktionsfähig erscheinen,
während das Anhängen über WebSocket dennoch fehlschlägt.

Lassen Sie `attachOnly` für ein Browserless-Profil mit Loopback-Adresse nicht
unbelegt. Ohne `attachOnly` behandelt OpenClaw den Loopback-Port als lokal
verwaltetes Browserprofil und meldet möglicherweise, dass der Port verwendet
wird, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browserdienste stellen statt der standardmäßigen HTTP-basierten
CDP-Ermittlung (`/json/version`) einen **direkten WebSocket**-Endpunkt bereit.
OpenClaw akzeptiert drei Formen von CDP-URLs und wählt automatisch die richtige
Verbindungsstrategie:

- **HTTP(S)-Ermittlung** – `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln,
  und stellt anschließend die Verbindung her. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** – `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad vom Typ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw stellt die Verbindung direkt über einen WebSocket-Handshake her und
  überspringt `/json/version` vollständig.
- **Reine WebSocket-Basisadressen** – `ws://host[:port]` oder `wss://host[:port]`
  ohne `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zunächst die
  HTTP-Ermittlung über `/json/version` (wobei das Schema zu `http`/`https`
  normalisiert wird). Wenn die Ermittlung eine `webSocketDebuggerUrl` zurückgibt,
  wird diese verwendet; andernfalls greift OpenClaw auf einen direkten
  WebSocket-Handshake an der reinen Basisadresse zurück. Wenn der bekannt gegebene
  WebSocket-Endpunkt den CDP-Handshake ablehnt, die konfigurierte reine Basisadresse
  ihn jedoch akzeptiert, greift OpenClaw ebenfalls auf diese Basisadresse zurück.
  Dadurch kann eine reine `ws://`-Adresse, die auf ein lokales Chrome verweist,
  weiterhin eine Verbindung herstellen, da Chrome WebSocket-Upgrades nur auf dem
  spezifischen zielbezogenen Pfad aus `/json/version` akzeptiert. Gehostete
  Provider können zugleich weiterhin ihren WebSocket-Basisendpunkt verwenden,
  wenn ihr Ermittlungsendpunkt eine kurzlebige URL bekannt gibt, die für
  Playwright CDP nicht geeignet ist.

`openclaw browser doctor` verwendet dieselbe Logik aus Ermittlung zuerst und
WebSocket-Fallback wie das Anhängen zur Laufzeit. Daher wird eine reine
Basis-URL, die erfolgreich eine Verbindung herstellt, von der Diagnose nicht
als unerreichbar gemeldet.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
von Headless-Browsern mit integrierter CAPTCHA-Lösung, Stealth-Modus und
Residential-Proxys.

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
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren tatsächlichen Browserbase-API-Schlüssel.
- Browserbase erstellt bei der WebSocket-Verbindung automatisch eine Browser-Sitzung,
  sodass kein manueller Schritt zum Erstellen einer Sitzung erforderlich ist.
- Die aktuellen Limits der kostenlosen Stufe und kostenpflichtigen Tarife finden Sie unter [Preise](https://www.browserbase.com/pricing).
- Die vollständige API-Referenz, SDK-Anleitungen und Integrationsbeispiele finden
  Sie in der [Browserbase-Dokumentation](https://docs.browserbase.com).

### Notte

[Notte](https://www.notte.cc) ist eine Cloud-Plattform zum Ausführen von
Headless-Browsern mit integriertem Stealth-Modus, Residential-Proxys und einem
CDP-nativen WebSocket-Gateway.

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

- [Registrieren Sie sich](https://console.notte.cc) und kopieren Sie Ihren **API Key**
  von der Einstellungsseite der Konsole.
- Ersetzen Sie `<NOTTE_API_KEY>` durch Ihren tatsächlichen Notte-API-Schlüssel.
- Notte erstellt bei der WebSocket-Verbindung automatisch eine Browser-Sitzung,
  sodass kein manueller Schritt zum Erstellen einer Sitzung erforderlich ist.
  Die Sitzung wird beendet, wenn die WebSocket-Verbindung getrennt wird.
- Die aktuellen Limits der kostenlosen Stufe und kostenpflichtigen Tarife finden Sie unter [Preise](https://www.notte.cc/#pricing).
- Die vollständige API-Referenz, SDK-Anleitungen und Integrationsbeispiele finden
  Sie in der [Notte-Dokumentation](https://docs.notte.cc).

## Sicherheit

Grundgedanken:

- Die Browsersteuerung ist ausschließlich über Loopback erreichbar; der Zugriff erfolgt über die Authentifizierung des Gateways oder die Node-Kopplung.
- Die eigenständige Loopback-Browser-HTTP-API verwendet **ausschließlich Shared-Secret-Authentifizierung**:
  Bearer-Authentifizierung mit dem Gateway-Token, `x-openclaw-password` oder
  HTTP-Basic-Authentifizierung mit dem konfigurierten Gateway-Passwort.
- Identitätsheader von Tailscale Serve und `gateway.auth.mode: "trusted-proxy"`
  authentifizieren diese eigenständige Loopback-Browser-API **nicht**.
- Wenn die Browsersteuerung aktiviert und keine Shared-Secret-Authentifizierung
  konfiguriert ist, erzeugt und speichert OpenClaw beim Start automatisch
  Zugangsdaten für die Browsersteuerung: ein Token, wenn `gateway.auth.mode`
  auf `none` gesetzt ist, oder ein Passwort, wenn der Wert `trusted-proxy` ist
  (über `gateway.auth.password` gespeichert, damit externe Loopback-Clients es
  auflösen können). Die automatische Erzeugung wird übersprungen, wenn für diesen
  Modus bereits explizite Zugangsdaten als Zeichenfolge konfiguriert sind oder
  wenn `gateway.auth.mode` auf `password` gesetzt ist.
- Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`
  oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Sie statt der erzeugten
  Zugangsdaten ein stabiles, von Ihnen kontrolliertes Geheimnis verwenden möchten.

Tipps für Remote-CDP:

- Bevorzugen Sie nach Möglichkeit verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token.
- Betten Sie langlebige Token möglichst nicht direkt in Konfigurationsdateien ein.
- Betreiben Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie eine öffentliche Bereitstellung.
- Behandeln Sie Remote-CDP-URLs und -Token als Geheimnisse; bevorzugen Sie Umgebungsvariablen oder einen Secrets-Manager.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können folgende Typen haben:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem Benutzerdatenverzeichnis und CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der an anderer Stelle ausgeführt wird)
- **bestehende Sitzung**: Ihr vorhandenes Chrome-Profil über die automatische Verbindung von Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für das Anhängen an bestehende Sitzungen über Chrome MCP integriert.
- Weitere Profile für bestehende Sitzungen außer `user` müssen explizit aktiviert werden; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus dem Bereich **18800-18899** zugewiesen.
- Beim Löschen eines Profils wird dessen lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann sich über den offiziellen Chrome-DevTools-MCP-Server auch an ein
laufendes Chromium-basiertes Browserprofil anhängen. Dabei werden die bereits
in diesem Browserprofil geöffneten Tabs und der vorhandene Anmeldestatus
wiederverwendet.

Offizielle Hintergrundinformationen und Einrichtungsreferenzen:

- [Chrome for Developers: Chrome DevTools MCP mit Ihrer Browsersitzung verwenden](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README von Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil: `user`. Erstellen Sie ein eigenes benutzerdefiniertes Profil
für bestehende Sitzungen, wenn Sie einen anderen Namen, eine andere Farbe oder
ein anderes Browser-Datenverzeichnis verwenden möchten.

Standardmäßig verwendet das integrierte Profil `user` die automatische Verbindung
von Chrome MCP, die auf das lokale Standardprofil von Google Chrome zielt.
Verwenden Sie `userDataDir` für Brave, Edge, Chromium oder ein vom Standard
abweichendes Chrome-Profil. `~` wird zu Ihrem Betriebssystem-Home-Verzeichnis
erweitert:

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

Führen Sie anschließend im entsprechenden Browser folgende Schritte aus:

1. Öffnen Sie die Inspektionsseite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser geöffnet und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Gängige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-Test für das Live-Anhängen:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

So sieht eine erfolgreiche Verbindung aus:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Referenzen aus dem ausgewählten Live-Tab zurück

Prüfen Sie Folgendes, wenn das Anhängen nicht funktioniert:

- Der Zielbrowser auf Chromium-Basis hat die Version `144+`.
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert.
- Der Browser hat die Zustimmungsaufforderung zum Anhängen angezeigt und Sie haben sie bestätigt.
- Wenn Chrome mit einem expliziten `--remote-debugging-port` gestartet wurde,
  setzen Sie `browser.profiles.<name>.cdpUrl` auf diesen DevTools-Endpunkt, statt
  sich auf die automatische Verbindung von Chrome MCP zu verlassen.
- `openclaw doctor` migriert alte erweiterungsbasierte Browserkonfigurationen und
  prüft bei standardmäßigen Profilen mit automatischer Verbindung, ob Chrome
  lokal installiert ist. Es kann Remote-Debugging im Browser jedoch nicht für
  Sie aktivieren.

Verwendung durch Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserstatus des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Profil für eine bestehende Sitzung verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer sitzt, um die
  Aufforderung zum Verbinden zu bestätigen.
- Der Gateway- oder Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten.

Hinweise:

- Dieser Pfad birgt ein höheres Risiko als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browsersitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht, sondern verbindet sich nur mit ihm.
- OpenClaw verwendet hier den offiziellen Chrome-DevTools-MCP-Ablauf `--autoConnect`. Wenn
  `userDataDir` festgelegt ist, wird es weitergereicht, um dieses Benutzerdatenverzeichnis als Ziel zu verwenden.
- Eine bestehende Sitzung kann auf dem ausgewählten Host oder über eine verbundene
  Browser-Node eingebunden werden. Wenn Chrome an einem anderen Ort ausgeführt wird und keine Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.
- Chrome-MCP-Ziele und Snapshot-Referenzen sind auf einen MCP-Unterprozess beschränkt. Nachdem
  dieser Prozess neu gestartet wurde, führen Sie `browser tabs` erneut aus, wählen Sie vor zielspezifischen
  Arbeiten ausdrücklich ein neues Ziel aus und erstellen Sie einen neuen Snapshot, bevor Sie Referenzen verwenden.
  Jede Referenz ist nur für ihr Ziel und den neuesten Snapshot gültig. Alte Aliasse werden nicht
  auf einen Ersatz-Tab übertragen, selbst wenn dessen URL übereinstimmt.
- Chrome DevTools MCP leitet Seitenwerkzeuge derzeit anhand einer prozesslokalen numerischen Seiten-
  ID weiter. Prozessgebundene Handles verhindern die Wiederverwendung nach dem Ersetzen eines Unterprozesses, aber ein
  Austausch des Browserkontexts innerhalb des Prozesses zwischen aufeinanderfolgenden Werkzeugaufrufen kann eine Aktion dennoch
  auf ein anderes Ziel umleiten. Eine vollständig atomare Weiterleitung erfordert vorgelagerte Unterstützung der Seitenwerkzeuge
  für stabile Ziel-IDs.

### Benutzerdefinierter Chrome-MCP-Start

Überschreiben Sie den gestarteten Chrome-DevTools-MCP-Server pro Profil, wenn der standardmäßige
Ablauf `npx chrome-devtools-mcp@latest` nicht Ihren Anforderungen entspricht (Offline-Hosts,
festgelegte Versionen, mitgelieferte Binärdateien):

| Feld         | Funktion                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die anstelle von `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt. |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die Standardargumente `chrome-devtools-mcp@latest --autoConnect`. |

Wenn `cdpUrl` in einem Profil für eine bestehende Sitzung festgelegt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (HTTP-Discovery-Endpunkt von DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` festgelegt ist,
wird `userDataDir` beim Start von Chrome MCP ignoriert, da Chrome MCP eine Verbindung mit
dem hinter dem Endpunkt ausgeführten Browser herstellt, statt ein Profilverzeichnis
zu öffnen.

<Accordion title="Funktionseinschränkungen bestehender Sitzungen">

Im Vergleich zum verwalteten Profil `openclaw` sind Treiber für bestehende Sitzungen stärker eingeschränkt:

- **Screenshots** – Seitenaufnahmen und Elementaufnahmen mit `--ref` funktionieren; CSS-Selektoren mit `--element` nicht. Playwright ist für Seiten- oder referenzbasierte Element-Screenshots nicht erforderlich. (`--full-page` kann in keinem Profil mit `--ref` oder `--element` kombiniert werden, nicht nur bei bestehenden Sitzungen.)
- **Aktionen** – `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Referenzen (keine CSS-Selektoren). `click-coords` klickt auf sichtbare Viewport-Koordinaten und erfordert keine Snapshot-Referenz. `click` unterstützt nur die linke Maustaste (keine Überschreibungen der Taste oder Modifikatortasten). `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select` und `fill` unterstützen keine aufrufspezifischen Überschreibungen von `timeoutMs`; `evaluate` unterstützt sie. `select` akzeptiert einen einzelnen Wert. `batch` wird nicht unterstützt; senden Sie Aktionen einzeln.
- **Warten / Upload / Dialog** – `wait --url` unterstützt exakte Muster, Teilzeichenfolgen und Glob-Muster (wie beim verwalteten Profil); `wait --load networkidle` wird bei Profilen für bestehende Sitzungen nicht unterstützt (es funktioniert bei verwalteten und rohen/Remote-CDP-Profilen). Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, und unterstützen kein CSS-`element`. Dialog-Hooks unterstützen weder Timeout-Überschreibungen noch `dialogId`.
- **Dialogsichtbarkeit** – Antworten auf verwaltete Browseraktionen enthalten `blockedByDialog` und `browserState.dialogs.pending`, wenn eine Aktion einen modalen Dialog öffnet; Snapshots enthalten ebenfalls den Status ausstehender Dialoge. Reagieren Sie mit `browser dialog --accept/--dismiss --dialog-id <id>`, solange ein Dialog aussteht. Außerhalb von OpenClaw behandelte Dialoge erscheinen unter `browserState.dialogs.recent`.
- **Nur verwaltete Funktionen** – PDF-Export, Download-Abfang und `responsebody` erfordern weiterhin den verwalteten Browserpfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: Berührt niemals Ihr persönliches Browserprofil.
- **Dedizierte Ports**: Vermeidet `9222`, um Kollisionen mit Entwicklungsabläufen zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, danach
  stabile `tabId`-Handles wie `t1`, optionale Bezeichnungen und die rohe `targetId`.
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

- macOS: Prüft `/Applications` und `~/Applications`.
- Linux: Prüft gängige Chrome-/Brave-/Edge-/Chromium-Speicherorte unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser` sowie von Playwright verwaltetes Chromium unter
  `PLAYWRIGHT_BROWSERS_PATH` oder `~/.cache/ms-playwright`.
- Windows: Prüft gängige Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt der Gateway eine kleine **nur über Loopback erreichbare HTTP-
Steuerungs-API** sowie eine entsprechende `openclaw browser`-CLI bereit (Snapshots, Referenzen, erweiterte
Wartefunktionen, JSON-Ausgabe, Debugging-Abläufe). Die vollständige Referenz finden Sie unter
[Browser-Steuerungs-API](/de/tools/browser-control).

## Fehlerbehebung

Linux-spezifische Probleme (insbesondere mit Snap-Chromium) werden unter
[Fehlerbehebung für Browser](/de/tools/browser-linux-troubleshooting) behandelt.

Informationen zu Split-Host-Konfigurationen mit WSL2-Gateway und Chrome unter Windows finden Sie unter
[Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler gegenüber SSRF-Blockierung bei Navigation

Dies sind unterschiedliche Fehlerklassen, die auf unterschiedliche Codepfade hinweisen.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene funktionsfähig ist.
- **SSRF-Blockierung bei Navigation** bedeutet, dass die Browser-Steuerungsebene funktionsfähig ist, aber ein Ziel für die Seitennavigation durch eine Richtlinie abgelehnt wird.

Gängige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer Loopback-CDP-Dienst ohne `attachOnly: true` konfiguriert ist
- SSRF-Blockierung bei Navigation:
  - Abläufe mit `open`, `navigate`, Snapshot-Erstellung oder Tab-Öffnung schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Abfolge, um die beiden Fälle zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So interpretieren Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin nicht funktionsfähig. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder bei der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende verwaltete Browser-Steuerungspfad funktionsfähig.

Wichtige Verhaltensdetails:

- Die Browserkonfiguration verwendet standardmäßig ein Fail-Closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale, verwaltete Loopback-Profil `openclaw` überspringen CDP-Zustandsprüfungen absichtlich die Durchsetzung der Browser-SSRF-Erreichbarkeit für die eigene lokale Steuerungsebene von OpenClaw.
- Der Navigationsschutz ist davon getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` zulässig ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie eng gefasste Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber einem umfassenden Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browserzugriff auf private Netzwerke erforderlich und geprüft ist.

## Agentenwerkzeuge und Funktionsweise der Steuerung

Der Agent erhält **ein Werkzeug** für die Browserautomatisierung:

- `browser` – doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (KI oder ARIA).
- `browser act` verwendet die `ref`-IDs des Snapshots zum Klicken/Eingeben/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (vollständige Seite, Element oder beschriftete Referenzen).
- `browser doctor` prüft die Bereitschaft von Gateway, Plugin, Profil, Browser und Tab.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sitzungen erfordert `target: "host"` die Einstellung `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` nicht angegeben ist: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Sitzungen ohne Sandbox standardmäßig `host`.
  - Wenn eine browserfähige Node verbunden ist, kann das Werkzeug Aufrufe automatisch an sie weiterleiten, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dies sorgt für deterministisches Agentenverhalten und vermeidet fragile Selektoren.

## Verwandte Themen

- [Werkzeugübersicht](/de/tools) – alle verfügbaren Agentenwerkzeuge
- [Sandboxing](/de/gateway/sandboxing) – Browsersteuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) – Risiken und Absicherung der Browsersteuerung
