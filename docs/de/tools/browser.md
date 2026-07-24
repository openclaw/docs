---
read_when:
    - Hinzufügen agentengesteuerter Browserautomatisierung
    - Fehlerbehebung, warum OpenClaw Ihren eigenen Chrome-Browser beeinträchtigt
    - Browser-Einstellungen und Lebenszyklus in der macOS-App implementieren
summary: Integrierter Browsersteuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-07-24T04:11:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3afa2dda17520ae6c53fe3f1a7a12e7ca8a1414b2c12b79cf4a09ac8906bb3ca
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das vom Agenten gesteuert wird. Es wird über einen kleinen lokalen Steuerungsdienst innerhalb des Gateway ausgeführt (nur Loopback) und ist von Ihrem persönlichen Browser isoliert.

- Stellen Sie es sich als **separaten Browser ausschließlich für Agenten** vor. Das Profil `openclaw` greift niemals auf Ihr persönliches Browserprofil zu.
- Der Agent öffnet Tabs, liest Seiten, klickt und gibt Text in dieser isolierten Umgebung ein.
- Das integrierte Profil `user` stellt stattdessen über Chrome DevTools MCP eine Verbindung zu Ihrer tatsächlich angemeldeten Chrome-Sitzung her.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbener Akzentfarbe).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/eingeben/ziehen/auswählen), Snapshots, Screenshots und PDFs.
- Playwright-gestützte Profile speichern direkte Navigationen zu Anhängen im verwalteten Downloadverzeichnis und geben nach der Richtlinienprüfung der endgültigen URL Metadaten vom Typ `{ url, suggestedFilename, path }` zurück.
- Playwright-gestützte Agentenaktionen geben ein Array vom Typ `downloads` mit denselben verwalteten Metadaten zurück, wenn die Aktion unmittelbar einen oder mehrere Downloads startet.
- Ein gebündeltes Skill `browser-automation`, das Agenten bei aktiviertem Browser-Plugin die Wiederherstellungsschleife für Snapshots,
  stabile Tabs, veraltete Referenzen und manuelle Blockaden vermittelt.
- Optionale Unterstützung mehrerer Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er bietet eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifizierung.

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

„Browser deaktiviert“ bedeutet, dass das Plugin oder `browser.enabled` deaktiviert ist; siehe
[Konfiguration](#configuration) und [Plugin-Steuerung](#plugin-control).

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, fahren Sie mit [Fehlender Browserbefehl oder fehlendes Browser-Tool](#missing-browser-command-or-tool) fort.

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

Die Standardeinstellungen benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn nur das Plugin deaktiviert wird, werden die CLI `openclaw browser`, die Gateway-Methode `browser.request`, das Agenten-Tool und der Steuerungsdienst als Einheit entfernt; Ihre Konfiguration `browser.*` bleibt für einen Ersatz erhalten.

Änderungen an der Browserkonfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Dienst erneut registrieren kann.

## Anleitung für Agenten

Hinweis zum Toolprofil: `tools.profile: "coding"` enthält `web_search` und
`web_fetch`, jedoch nicht das vollständige Tool `browser`. Damit der Agent oder ein
erzeugter Unteragent die Browserautomatisierung verwenden kann, fügen Sie „browser“ in der
Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie für einen einzelnen Agenten `agents.entries.*.tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` allein genügt nicht, da die Richtlinie für Unteragenten
nach der Profilfilterung angewendet wird.

Das Browser-Plugin enthält zwei Ebenen von Anleitungen für Agenten:

- Die Beschreibung des Tools `browser` enthält den kompakten, stets aktiven Vertrag: das
  richtige Profil auswählen, Referenzen im selben Tab beibehalten, `tabId`/Bezeichnungen zur
  Auswahl von Tabs verwenden und für mehrstufige Aufgaben das Browser-Skill laden.
- Das gebündelte Skill `browser-automation` enthält den längeren Betriebsablauf:
  zuerst Status und Tabs prüfen, Aufgaben-Tabs bezeichnen, vor Aktionen einen Snapshot erstellen, nach
  Änderungen an der Benutzeroberfläche erneut einen Snapshot erstellen, veraltete Referenzen einmal wiederherstellen und
  Anmeldungs-, 2FA-, Captcha-, Kamera- oder Mikrofonblockaden als erforderliche manuelle Aktion melden, statt zu raten.

Im Plugin gebündelte Skills werden in den verfügbaren Skills des Agenten aufgeführt, wenn das
Plugin aktiviert ist. Die vollständigen Skill-Anweisungen werden bei Bedarf geladen, sodass bei routinemäßigen
Interaktionen nicht die vollständigen Token-Kosten anfallen.

## Fehlender Browserbefehl oder fehlendes Browser-Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent das Browser-Tool als nicht verfügbar meldet, ist die übliche Ursache eine Liste `plugins.allow`, in der `browser` fehlt, während kein Stammkonfigurationsblock `browser` vorhanden ist. Fügen Sie ihn hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ein expliziter Stammblock `browser` (jeder Schlüssel unter `browser`, beispielsweise
`browser.enabled=true` oder `browser.profiles.<name>`) aktiviert das gebündelte
Browser-Plugin selbst bei einer restriktiven Einstellung `plugins.allow`, entsprechend dem Verhalten der Konfiguration
gebündelter Kanäle. `plugins.entries.browser.enabled=true` und
`tools.alsoAllow: ["browser"]` ersetzen für sich genommen nicht die Mitgliedschaft in der Zulassungsliste.
Wenn `plugins.allow` vollständig entfernt wird, wird ebenfalls die Standardeinstellung wiederhergestellt.

## Profile: `openclaw`, `user`, `chrome`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-DevTools-MCP-Verbindungsprofil für Ihre **tatsächlich
  angemeldete Chrome-Sitzung**. Chrome zeigt beim ersten Verbindungsaufbau durch OpenClaw eine blockierende Aufforderung „Allow remote debugging?“
  an, daher muss sich jemand am Computer befinden.
- `chrome`: integriertes Profil für die [Chrome-Erweiterung](/de/tools/chrome-extension) für
  Ihre **tatsächlich angemeldete Chrome-Sitzung**. Funktioniert von einem Telefon aus, ohne dass sich jemand am
  Computer befindet, da Tabs über die OpenClaw-Browsererweiterung statt über
  den Remote-Debugging-Port gesteuert werden; daher erscheint keine Aufforderung „Allow remote debugging?“.

Für Aufrufe des Browser-Tools durch Agenten gilt:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="chrome"` (Erweiterung), wenn vorhandene angemeldete Sitzungen benötigt werden
  und der Benutzer **nicht am Computer** ist (Telegram, WhatsApp usw.).
- Bevorzugen Sie `profile="user"` (Chrome MCP), wenn vorhandene angemeldete Sitzungen benötigt werden
  und der Benutzer **am Computer** ist, um die Verbindungsaufforderung zu bestätigen.
- `profile` dient als explizite Außerkraftsetzung, wenn Sie einen bestimmten Browsermodus wünschen.

Legen Sie `browser.defaultProfile: "openclaw"` fest, wenn standardmäßig der verwaltete Modus verwendet werden soll.

## Konfiguration

Die Browsereinstellungen befinden sich in `~/.openclaw/openclaw.json`.

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
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Außerkraftsetzung für ein einzelnes Profil
    tabCleanup: {
      enabled: true, // Standard: true
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

`browser.snapshotDefaults.mode: "efficient"` ändert den standardmäßigen Extraktionsmodus `snapshot`,
wenn ein Aufrufer weder `snapshotFormat` noch
`mode` explizit übergibt; Informationen zu Snapshot-Optionen pro Aufruf finden Sie unter [API zur Browsersteuerung](/de/tools/browser-control).

### Zuständigkeit für die Tab-Bereinigung

Die Tab-Bereinigung einer Sitzung gilt nur für Tabs, die vom OpenClaw-Browser-Tool
mit `action: "open"` erstellt wurden. OpenClaw übernimmt keine Tabs, die bereits geöffnet waren,
vom Benutzer geöffnet wurden oder deren Eigentümerschaft anderweitig unbekannt ist. Der
Block `browser.tabCleanup` steuert regelmäßige Bereinigungen nach Inaktivität und Obergrenze für primäre
Sitzungen; seine Deaktivierung schaltet die explizite Bereinigung des Sitzungslebenszyklus nicht aus.

Bei auf dem Host lokal geöffneten Tabs wird die Eigentümerschaft mit einem stabilen nativen CDP-Ziel und einer Browseridentität
im gemeinsamen SQLite-Zustand gespeichert. Diese Datensätze überstehen einen Neustart des Gateway
und bleiben für `/new` sowie andere Bereinigungen des Sitzungslebenszyklus verfügbar;
die Bereinigung des Sitzungslebenszyklus umfasst das Ende von Unteragenten-, Cron- und ACP-Sitzungen.
Datensätze, deren für das Tool sichtbares Ziel dem nativen CDP-Ziel entspricht, bleiben nach einem Neustart auch
für Bereinigungen nach Inaktivität und sitzungsbezogener Obergrenze verfügbar. Chrome-MCP-Zielhandles sind
prozesslokal, daher warten kalte Datensätze bestehender Sitzungen auf die Lebenszyklusbereinigung,
anstatt eine Inaktivitätsbereinigung für Aktivitäten zu riskieren, die nach einem Neustart nicht
sicher zugeordnet werden können. Dieser dauerhafte Pfad kann von OpenClaw verwaltete Profile,
reguläre Remote-CDP-Profile und Profile bestehender Sitzungen mit einem expliziten
`cdpUrl` abdecken, sofern OpenClaw sowohl das native Ziel als auch eine stabile
Browseridentität auflösen kann. Vor dem Schließen eines dauerhaften Datensatzes prüft OpenClaw, ob das
konfigurierte Profil und die Browserinstanz weiterhin übereinstimmen.

Chrome MCP `--autoConnect`, CDP-Endpunkte, deren Antwort `/json/version` keine
stabile Browseridentität enthält, sowie Öffnungsvorgänge, deren natives Ziel nicht aufgelöst werden kann,
bleiben auf eine prozesslokale Nachverfolgung nach bestem Bemühen beschränkt. Sie können bereinigt werden, solange dieser
Gateway-Prozess läuft, werden jedoch nach einem Neustart des Gateway nicht automatisch
geschlossen. Tabs, die bereits geöffnet waren, bevor die dauerhafte Nachverfolgung verfügbar wurde, werden nicht
nachträglich übernommen; schließen Sie diese Tabs manuell.

Die Bereinigung erfolgt nach bestem Bemühen und garantiert nicht, dass jeder infrage kommende Tab
sofort geschlossen wird. Bei einer vorübergehend fehlgeschlagenen Eigentümerschaftsprüfung oder einem fehlgeschlagenen Schließvorgang bleibt die dauerhafte
Bereinigung für einen späteren Wiederholungsversuch ausstehend. Wiederholungsversuche sind nicht unbegrenzt: Wenn der Browser
nicht erreichbar bleibt und der Tab länger als einen Tag nicht verwendet wurde, wird die Nachverfolgungszeile
entfernt, damit der dauerhafte Speicher nicht mit Tabs gefüllt wird, die nie wieder
verifiziert werden können.

### Screenshot-Bilderkennung (Unterstützung für reine Textmodelle)

Wenn das Hauptmodell ein reines Textmodell ist (ohne Unterstützung für Bilder oder multimodale Inhalte), geben Browser-
Screenshots Bildblöcke zurück, die das Modell nicht lesen kann. Browser-Screenshots
verwenden die bestehende Konfiguration für das Bildverständnis wieder, sodass ein für das Medienverständnis
konfiguriertes Bildmodell Screenshots ohne browserspezifische Modelleinstellungen als Text
beschreiben kann.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Fallback-Kandidaten hinzufügen; der erste Erfolg wird verwendet
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Gemeinsam verwendete Medienmodelle funktionieren ebenfalls, wenn sie für Bildunterstützung gekennzeichnet sind.
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
2. Das Browser-Tool fragt die vorhandene Laufzeitumgebung für Bildverständnis, ob sie
   den Screenshot mithilfe konfigurierter Medienbildmodelle, gemeinsam genutzter
   Medienmodelle, Bildmodell-Standardeinstellungen oder eines authentifizierungsgestützten Bild-Providers beschreiben kann.
3. Das Vision-Modell gibt eine Textbeschreibung zurück, die mit
   `wrapExternalContent` (Schutz vor Prompt-Injection) umschlossen und dem Agenten
   als Textblock statt als Bildblock zurückgegeben wird.
4. Wenn das Bildverständnis nicht verfügbar ist, übersprungen wird oder fehlschlägt, gibt der Browser
   ersatzweise den ursprünglichen Bildblock zurück.

Screenshot-Bildblöcke sind private Tool-Ergebnisse: Der Agent kann sie prüfen,
OpenClaw hängt sie jedoch nicht automatisch an Kanalantworten an. Um einen
Screenshot zu teilen, weisen Sie den Agenten an, ihn ausdrücklich mit dem Nachrichten-Tool zu senden.

Verwenden Sie die vorhandenen Felder `tools.media.image` / `tools.media.models` für Modell-
Fallbacks, Zeitüberschreitungen, Byte-Limits, Profile und Einstellungen für Provider-Anfragen.

Wenn das aktive Hauptmodell bereits Vision unterstützt und kein explizites Modell
für Bildverständnis konfiguriert ist, behält OpenClaw das normale Bildergebnis bei, damit das
Hauptmodell den Screenshot direkt lesen kann.

<AccordionGroup>

<Accordion title="Ports und Erreichbarkeit">

- Der Steuerungsdienst bindet sich an die Loopback-Schnittstelle auf einem von `gateway.port` abgeleiteten Port (Standardwert `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` hat Vorrang vor `gateway.port`; beide verschieben die abgeleiteten Ports derselben Familie entsprechend.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch aus einem Bereich zu, der 9 Ports über dem Steuerungsport beginnt (standardmäßig `18800`-`18899`); legen Sie diese nur für
  Remote-CDP-Profile oder das Anhängen an Endpunkte bestehender Sitzungen fest. `cdpUrl` verwendet standardmäßig
  den verwalteten lokalen CDP-Port, wenn kein Wert festgelegt ist.
- Für die Erreichbarkeit von Remote- und `attachOnly`-CDP, WebSocket-Handshakes und den lokalen
  Start des verwalteten Chrome gelten integrierte Fristen.
- Wiederholte Fehler beim Starten beziehungsweise bei der Bereitschaft des verwalteten Chrome werden pro
  Profil durch einen Circuit Breaker begrenzt. Nach mehreren aufeinanderfolgenden Fehlern pausiert OpenClaw neue
  Startversuche kurzzeitig, statt bei jedem Aufruf des Browser-Tools Chromium zu starten. Beheben Sie
  das Startproblem, deaktivieren Sie den Browser, falls er nicht benötigt wird, oder starten Sie nach der
  Reparatur das Gateway neu.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browsernavigation und Anfragen zum Öffnen von Tabs werden vorab geprüft. Während der Aktion und einer begrenzten Kulanzfrist danach fangen geschützte Playwright-Interaktionen (Klicken, Klicken auf Koordinaten, Daraufzeigen, Ziehen, Scrollen, Auswählen, Tastendruck, Eingeben, Ausfüllen von Formularen und Auswerten) durch die Richtlinie abgelehnte Dokumentladevorgänge der obersten Ebene und von Unterframes vor dem Senden von HTTP-Anfragebytes ab und prüfen anschließend nach bestem Bemühen erneut die endgültige `http(s)`-URL.
- Vor jedem neuen Start eines von OpenClaw verwalteten Chrome deaktiviert OpenClaw nach bestem Bemühen die Netzwerkvorhersage und unterdrückt dadurch Chromiums beobachtete spekulative Vorverbindungen für diese abgelehnten Ladevorgänge. Dies ist gestaffelte Sicherheit, keine Richtliniengrenze: Ein über einen Neustart des Steuerungsdienstes hinweg wiederverwendeter Browser und andere Browser-Backends verfügen möglicherweise nicht über dieselbe Härtung. Das Playwright-Routing ist weiterhin keine Netzwerk-Firewall und fängt weder Weiterleitungsschritte noch die erste Anfrage eines Pop-ups, Service-Worker-Datenverkehr, nach Ablauf des begrenzten Schutzfensters ausgeführten Seitencode oder jeden Hintergrund-/Unterressourcenpfad ab. Eine vollständige Isolierung des ausgehenden Datenverkehrs erfordert eine betreiberseitige Isolierung oder einen richtliniendurchsetzenden Proxy.
- Im strikten SSRF-Modus werden auch die Erkennung von Remote-CDP-Endpunkten und `/json/version`-Prüfungen (`cdpUrl`) kontrolliert.
- Die Umgebungsvariablen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und `NO_PROXY` von Gateway/Provider leiten den von OpenClaw verwalteten Browser nicht automatisch über einen Proxy. Verwaltetes Chrome startet standardmäßig direkt, damit Provider-Proxy-Einstellungen die SSRF-Prüfungen des Browsers nicht abschwächen.
- Lokale CDP-Bereitschaftsprüfungen für von OpenClaw verwaltete Browser und DevTools-WebSocket-Verbindungen umgehen den verwalteten Netzwerk-Proxy für den exakt gestarteten Loopback-Endpunkt, sodass `openclaw browser start` weiterhin funktioniert, wenn ein Betreiber-Proxy ausgehenden Loopback-Datenverkehr blockiert.
- Um den verwalteten Browser selbst über einen Proxy zu leiten, übergeben Sie explizite Chrome-Proxy-Flags über `browser.extraArgs`, beispielsweise `--proxy-server=...` oder `--proxy-pac-url=...`. Der strikte SSRF-Modus blockiert explizites Browser-Proxy-Routing, sofern der Browserzugriff auf private Netzwerke nicht bewusst aktiviert wurde.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn dem Browserzugriff auf private Netzwerke bewusst vertraut wird.
- `browser.ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, dass niemals ein lokaler Browser gestartet wird; es wird nur eine Verbindung hergestellt, wenn bereits einer ausgeführt wird.
- `headless` kann global oder pro lokalem verwaltetem Profil festgelegt werden. Profilspezifische Werte überschreiben `browser.headless`, sodass ein lokal gestartetes Profil im Headless-Modus ausgeführt werden kann, während ein anderes sichtbar bleibt.
- `POST /start?headless=true` und `openclaw browser start --headless` fordern einen
  einmaligen Headless-Start für lokale verwaltete Profile an, ohne
  `browser.headless` oder die Profilkonfiguration neu zu schreiben. Profile für bestehende Sitzungen, reine
  Anhängeprofile und Remote-CDP-Profile lehnen die Überschreibung ab, da OpenClaw diese
  Browserprozesse nicht startet.
- Auf Linux-Hosts ohne `DISPLAY` oder `WAYLAND_DISPLAY` verwenden lokale verwaltete Profile
  automatisch standardmäßig den Headless-Modus, wenn weder die Umgebung noch die Profil-/globale
  Konfiguration ausdrücklich den Modus mit Benutzeroberfläche auswählt. Verwenden Sie die eindeutige Form auf Browserebene
  `openclaw browser --json status`; ein nachgestelltes `openclaw browser status --json`
  funktioniert ebenfalls, da `status` kein eigenes `--json` definiert. Der Befehl meldet
  `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` oder `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` erzwingt Headless-Starts lokaler verwalteter Browser für den
  aktuellen Prozess. `OPENCLAW_BROWSER_HEADLESS=0` erzwingt bei gewöhnlichen
  Starts den Modus mit Benutzeroberfläche und gibt auf Linux-Hosts ohne Displayserver einen handlungsorientierten Fehler zurück;
  eine explizite `start --headless`-Anforderung hat für diesen einzelnen Start weiterhin Vorrang.
- Die Browser-Steuerungsroute und der programmatische Client behalten die menschenlesbare
  `error` des Fehlers wegen fehlender Anzeige bei und stellen den stabilen Grund
  `no_display_for_headed_profile` bereit. Dessen `details` enthalten nur `profile`,
  `requestedHeadless`, `headlessSource` und `displayPresent`, sodass API-Clients
  die richtige Abhilfemaßnahme auswählen können, ohne Nachrichtentext abzugleichen.
- Bei einem ausgeführten lokalen verwalteten Profil fragen Status und Doctor den
  CDP-Endpunkt von Chrome auf Browserebene nach Renderer, Backend, Gerät/Treiber, Funktionsstatus,
  Treiber-Workarounds und Fähigkeiten für beschleunigtes Video ab. Das Ergebnis wird
  für diesen Browserprozess zwischengespeichert und vollständig über
  `openclaw browser --json status` bereitgestellt. Ein passiver Statusaufruf startet Chrome nicht.
  Browser für bestehende Sitzungen, Erweiterungsbrowser, Remote-CDP-Browser und Sandbox-Browser bleiben getrennt
  und werden nicht über diesen Pfad des verwalteten Hosts geprüft.
- Verwaltetes Chrome im Headless-Modus verwendet weiterhin die konservative Standardeinstellung `--disable-gpu`.
  Die Diagnose aktiviert keine Beschleunigung, fügt keine globale Beschleunigungseinstellung hinzu
  und gewährt Sandbox-Browsern keinen Gerätezugriff.
- `executablePath` kann global oder pro lokalem verwaltetem Profil festgelegt werden. Profilspezifische Werte überschreiben `browser.executablePath`, sodass verschiedene verwaltete Profile unterschiedliche Chromium-basierte Browser starten können. Beide Formen akzeptieren `~` für das Home-Verzeichnis Ihres Betriebssystems.
- `color` (auf oberster Ebene und pro Profil) färbt die Browser-Benutzeroberfläche ein, damit Sie erkennen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (eigenständig verwaltet). Verwenden Sie `defaultProfile: "user"`, um sich ausdrücklich für den angemeldeten Benutzerbrowser zu entscheiden.
- Reihenfolge der automatischen Erkennung: systemweiter Standardbrowser, sofern Chromium-basiert; andernfalls Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von rohem CDP. Es kann eine Verbindung über die automatische Verbindung von Chrome MCP oder über `cdpUrl` herstellen, wenn bereits ein DevTools-Endpunkt für den laufenden Browser vorhanden ist.
- `driver: "extension"` steuert Ihr angemeldetes Chrome über die [OpenClaw-Chrome-Erweiterung](/de/tools/chrome-extension). Das Relay besitzt seinen Loopback-Endpunkt, daher akzeptieren diese Profile `cdpUrl` nicht. Dies ist der einzige Modus für angemeldete Browser, der funktioniert, wenn niemand am Computer sitzt.
- Legen Sie `browser.profiles.<name>.userDataDir` fest, wenn ein Profil für eine bestehende Sitzung eine Verbindung zu einem nicht standardmäßigen Chromium-Benutzerprofil (Brave, Edge usw.) herstellen soll. Dieser Pfad akzeptiert außerdem `~` für das Home-Verzeichnis Ihres Betriebssystems.

</Accordion>

</AccordionGroup>

## Brave oder einen anderen Chromium-basierten Browser verwenden

Wenn Ihr **systemweiter Standardbrowser** Chromium-basiert ist (Chrome/Brave/Edge usw.),
verwendet OpenClaw ihn automatisch. Legen Sie `browser.executablePath` fest, um die
automatische Erkennung zu überschreiben. Werte von `executablePath` auf oberster Ebene und pro Profil akzeptieren `~`
für das Home-Verzeichnis Ihres Betriebssystems:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Oder legen Sie den Wert je Plattform in der Konfiguration fest:

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

Das profilspezifische `executablePath` wirkt sich nur auf lokale verwaltete Profile aus, die OpenClaw
startet. `existing-session`-Profile stellen stattdessen eine Verbindung zu einem bereits laufenden Browser her,
und Remote-CDP-Profile verwenden den Browser hinter `cdpUrl`.

## Lokale und Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den Loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Computer aus, auf dem sich der Browser befindet; das Gateway leitet Browseraktionen an ihn weiter.
- **Remote-CDP:** Legen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`) fest, um
  eine Verbindung zu einem entfernten Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.
- Legen Sie für extern verwaltete CDP-Dienste auf der Loopback-Schnittstelle (beispielsweise Browserless in
  Docker, veröffentlicht unter `127.0.0.1`) außerdem `attachOnly: true` fest. Loopback-CDP
  ohne `attachOnly` wird als lokales, von OpenClaw verwaltetes Browserprofil behandelt.
- `headless` wirkt sich nur auf lokale verwaltete Profile aus, die OpenClaw startet. Es startet Browser für bestehende Sitzungen oder Remote-CDP-Browser weder neu noch ändert es diese.
- `executablePath` folgt derselben Regel für lokale verwaltete Profile. Wird der Wert bei einem
  laufenden lokalen verwalteten Profil geändert, wird dieses Profil für einen Neustart/Abgleich markiert, sodass beim
  nächsten Start die neue Binärdatei verwendet wird.

Das Beendigungsverhalten unterscheidet sich je nach Profilmodus:

- lokale verwaltete Profile: `openclaw browser stop` beendet den Browserprozess, den
  OpenClaw gestartet hat
- reine Anhängeprofile und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Locale, Zeitzone, Offlinemodus und ähnliche Zustände), obwohl
  OpenClaw keinen Browserprozess gestartet hat

Remote-CDP-URLs können Authentifizierungsdaten enthalten:

- Abfragetoken (z. B. `https://provider.example?token=<token>`)
- HTTP-Basisauthentifizierung (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei Aufrufen von `/json/*`-Endpunkten und beim Herstellen einer Verbindung
zum CDP-WebSocket bei. Verwenden Sie für Token vorzugsweise Umgebungsvariablen oder Secret-Manager,
anstatt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (konfigurationsfreier Standard)

Wenn Sie einen **Node-Host** auf dem Computer ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browserkonfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Nodes (wie bei einer lokalen Ausführung).
- Der Proxy-Befehl erlaubt unabhängig von `allowProfiles` niemals dauerhafte Profiländerungen (`create-profile`, `delete-profile`, `reset-profile`); nehmen Sie diese Änderungen direkt auf dem Node vor.
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es für das bisherige Standardverhalten leer: Alle konfigurierten Profile bleiben über den Proxy erreichbar.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` festlegen, behandelt OpenClaw dies als Least-Privilege-Grenze, die einschränkt, welche Profilnamen der Proxy als Ziel verwendet.
- Deaktivieren Sie die Funktion, wenn Sie sie nicht verwenden möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"` (akzeptiert außerdem `"auto"`, um einen einzelnen verbundenen Browser-Node auszuwählen, oder `"manual"`, um einen expliziten Node-Parameter zu verlangen)

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein Remote-Browserprofil ist die direkte WebSocket-URL
aus der Verbindungsdokumentation von Browserless die einfachste Option.

Beispiel:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
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
- Wählen Sie den regionalen Endpunkt, der zu Ihrem Browserless-Konto passt (siehe die entsprechende Dokumentation).
- Wenn Browserless Ihnen eine HTTPS-Basis-URL bereitstellt, können Sie sie entweder für eine direkte CDP-Verbindung in
  `wss://` umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` ermitteln lassen.

### Browserless-Docker auf demselben Host

Wenn Browserless selbst in Docker gehostet wird und OpenClaw auf dem Host ausgeführt wird, behandeln Sie
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

Die Adresse in `browser.profiles.browserless.cdpUrl` muss für den
OpenClaw-Prozess erreichbar sein. Browserless muss außerdem einen passenden erreichbaren Endpunkt bekannt geben;
setzen Sie Browserless `EXTERNAL` auf dieselbe für OpenClaw erreichbare WebSocket-Basis,
beispielsweise `ws://127.0.0.1:3000`, `ws://browserless:3000` oder eine stabile private
Docker-Netzwerkadresse. Wenn `/json/version` den Wert `webSocketDebuggerUrl` zurückgibt, der auf
eine für OpenClaw nicht erreichbare Adresse verweist, kann CDP-HTTP funktionsfähig erscheinen, während das
Anhängen über WebSocket weiterhin fehlschlägt.

Lassen Sie `attachOnly` für ein Browserless-Loopback-Profil nicht ungesetzt. Ohne
`attachOnly` behandelt OpenClaw den Loopback-Port als lokal verwaltetes Browserprofil
und meldet möglicherweise, dass der Port verwendet wird, aber nicht OpenClaw gehört.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browserdienste stellen statt der
standardmäßigen HTTP-basierten CDP-Ermittlung (`/json/version`) einen **direkten WebSocket**-Endpunkt bereit. OpenClaw akzeptiert drei
Formen von CDP-URLs und wählt automatisch die passende Verbindungsstrategie:

- **HTTP(S)-Ermittlung** – `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu ermitteln, und stellt anschließend
  die Verbindung her. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** – `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-Pfad.
  OpenClaw stellt die Verbindung direkt über einen WebSocket-Handshake her und überspringt
  `/json/version` vollständig.
- **Unveränderte WebSocket-Stammadressen** – `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zunächst die HTTP-Ermittlung über
  `/json/version` (wobei das Schema zu `http`/`https` normalisiert wird);
  wenn die Ermittlung einen `webSocketDebuggerUrl` zurückgibt, wird dieser verwendet, andernfalls greift OpenClaw
  auf einen direkten WebSocket-Handshake an der unveränderten Stammadresse zurück. Wenn der bekannt gegebene
  WebSocket-Endpunkt den CDP-Handshake ablehnt, die konfigurierte unveränderte Stammadresse
  ihn jedoch akzeptiert, greift OpenClaw ebenfalls auf diese Stammadresse zurück. Dadurch kann eine unveränderte `ws://`,
  die auf ein lokales Chrome verweist, weiterhin eine Verbindung herstellen, da Chrome WebSocket-Upgrades nur
  auf dem spezifischen zielbezogenen Pfad aus `/json/version` akzeptiert, während gehostete
  Provider weiterhin ihren WebSocket-Stammendpunkt verwenden können, wenn ihr Ermittlungsendpunkt
  eine kurzlebige URL bekannt gibt, die für Playwright-CDP ungeeignet ist.

`openclaw browser doctor` verwendet dieselbe Logik mit Ermittlung zuerst und WebSocket-Fallback
wie das Anhängen zur Laufzeit, sodass eine erfolgreich verbundene URL mit unveränderter Stammadresse von der Diagnose nicht
als unerreichbar gemeldet wird.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und privaten
Proxys.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
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
- Browserbase erstellt beim Herstellen der WebSocket-Verbindung automatisch eine Browsersitzung, sodass kein
  manueller Schritt zur Sitzungserstellung erforderlich ist.
- Unter [Preise](https://www.browserbase.com/pricing) finden Sie die aktuellen Limits des kostenlosen Tarifs und die kostenpflichtigen Tarife.
- Die [Browserbase-Dokumentation](https://docs.browserbase.com) enthält die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

### Notte

[Notte](https://www.notte.cc) ist eine Cloud-Plattform zum Ausführen headless
Browser mit integriertem Stealth-Modus, privaten Proxys und einem CDP-nativen
WebSocket-Gateway.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
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
- Ersetzen Sie `<NOTTE_API_KEY>` durch Ihren tatsächlichen Notte-API-Schlüssel.
- Notte erstellt beim Herstellen der WebSocket-Verbindung automatisch eine Browsersitzung, sodass kein manueller
  Schritt zur Sitzungserstellung erforderlich ist. Die Sitzung wird beendet, wenn die
  WebSocket-Verbindung getrennt wird.
- Unter [Preise](https://www.notte.cc/#pricing) finden Sie die aktuellen Limits des kostenlosen Tarifs und die kostenpflichtigen Tarife.
- Die [Notte-Dokumentation](https://docs.notte.cc) enthält die vollständige API-Referenz, SDK-
  Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Aspekte:

- Die Browsersteuerung ist ausschließlich über Loopback verfügbar; der Zugriff erfolgt über die Authentifizierung des Gateways oder das Node-Pairing.
- Die eigenständige Loopback-Browser-HTTP-API verwendet **ausschließlich Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Authentifizierung, `x-openclaw-password` oder HTTP-Basic-Authentifizierung mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitätsheader und `gateway.auth.mode: "trusted-proxy"`
  authentifizieren diese eigenständige Loopback-Browser-API **nicht**.
- Wenn die Browsersteuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, generiert und speichert OpenClaw
  beim Start automatisch Zugangsdaten für die Browsersteuerung:
  ein Token, wenn `gateway.auth.mode` den Wert `none` hat, oder ein Passwort, wenn der Wert
  `trusted-proxy` ist (über `gateway.auth.password` gespeichert, damit Loopback-Clients
  außerhalb des Prozesses es auflösen können). Die automatische Generierung wird übersprungen, wenn für diesen Modus bereits
  explizite Zeichenfolgen-Zugangsdaten konfiguriert sind oder wenn
  `gateway.auth.mode` den Wert `password` hat.
- Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder
  `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Sie anstelle der generierten Zugangsdaten ein stabiles, von Ihnen kontrolliertes Secret verwenden möchten.

Tipps für Remote-CDP:

- Verwenden Sie nach Möglichkeit verschlüsselte Endpunkte (HTTPS oder WSS) und kurzlebige Token.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.
- Betreiben Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie eine öffentliche Bereitstellung.
- Behandeln Sie Remote-CDP-URLs und -Token als Secrets; verwenden Sie vorzugsweise Umgebungsvariablen oder einen Secret-Manager.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können folgende Typen haben:

- **von OpenClaw verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem Benutzerdatenverzeichnis und CDP-Port
- **Remote**: eine explizite CDP-URL (ein an anderer Stelle ausgeführter Chromium-basierter Browser)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über die automatische Verbindung von Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für das Anhängen an bestehende Sitzungen über Chrome MCP integriert.
- Weitere Profile für bestehende Sitzungen neben `user` müssen explizit aktiviert werden; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus dem Bereich **18800-18899** zugewiesen.
- Beim Löschen eines Profils wird sein lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann über den offiziellen Chrome-DevTools-MCP-Server außerdem eine Verbindung zu einem laufenden
Chromium-basierten Browserprofil herstellen. Dadurch werden die Tabs und der Anmeldestatus
wiederverwendet, die bereits in diesem Browserprofil geöffnet sind.

Offizielle Hintergrundinformationen und Einrichtungsreferenzen:

- [Chrome for Developers: Chrome DevTools MCP mit Ihrer Browsersitzung verwenden](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README zu Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil: `user`. Erstellen Sie ein eigenes benutzerdefiniertes Profil für bestehende Sitzungen, wenn
Sie einen anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis verwenden möchten.

Standardmäßig verwendet das integrierte Profil `user` die automatische Verbindung von Chrome MCP, die
auf das lokale Standardprofil von Google Chrome zielt. Verwenden Sie `userDataDir` für Brave,
Edge, Chromium oder ein nicht standardmäßiges Chrome-Profil. `~` wird zu Ihrem Betriebssystem-Benutzerverzeichnis
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

Anschließend im entsprechenden Browser:

1. Öffnen Sie die Inspektionsseite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser geöffnet und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw die Verbindung herstellt.

Übliche Inspektionsseiten:

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

So sieht eine erfolgreiche Ausführung aus:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Referenzen aus dem ausgewählten aktiven Tab zurück

Was Sie prüfen sollten, wenn das Anhängen nicht funktioniert:

- der Chromium-basierte Zielbrowser hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Zustimmungsabfrage zum Anhängen angezeigt und Sie haben sie akzeptiert
- wenn Chrome mit einem expliziten `--remote-debugging-port` gestartet wurde, setzen Sie
  `browser.profiles.<name>.cdpUrl` auf diesen DevTools-Endpunkt, statt sich
  auf die automatische Verbindung von Chrome MCP zu verlassen
- `openclaw doctor` migriert alte erweiterungsbasierte Browserkonfigurationen und prüft, ob
  Chrome für standardmäßige Profile mit automatischer Verbindung lokal installiert ist, kann jedoch
  das browserseitige Remote-Debugging nicht für Sie aktivieren

Verwendung durch Agents:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browserzustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Profil für eine bestehende Sitzung verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer ist, um die Abfrage
  zum Anhängen zu genehmigen.
- Der Gateway- oder Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten.

Hinweise:

- Dieser Pfad birgt ein höheres Risiko als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browsersitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht, sondern hängt sich nur an.
- OpenClaw verwendet hier den offiziellen `--autoConnect`-Ablauf von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, wird es weitergegeben, um dieses Benutzerdatenverzeichnis zu verwenden.
- Eine bestehende Sitzung kann auf dem ausgewählten Host oder über eine verbundene
  Browser-Node angehängt werden. Wenn Chrome auf einem anderen System ausgeführt wird und keine Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.
- Chrome-MCP-Ziele und Snapshot-Referenzen sind auf einen MCP-Unterprozess beschränkt. Nachdem
  dieser Prozess neu gestartet wurde, führen Sie `browser tabs` erneut aus, wählen Sie ausdrücklich ein neues
  Ziel aus, bevor Sie zielspezifische Aufgaben ausführen, und erstellen Sie einen neuen Snapshot, bevor Sie Referenzen verwenden.
  Jede Referenz ist nur für ihr Ziel und den neuesten Snapshot gültig. Alte Aliasse werden nicht
  auf einen Ersatztab übertragen, selbst wenn dessen URL übereinstimmt.
- Chrome DevTools MCP leitet Seitentools derzeit anhand einer prozesslokalen numerischen Seiten-ID
  weiter. Prozessgebundene Handles verhindern die Wiederverwendung nach dem Ersetzen eines Unterprozesses, aber der
  Austausch eines Browserkontexts innerhalb des Prozesses zwischen zwei aufeinanderfolgenden Tool-Aufrufen kann eine Aktion weiterhin
  auf ein anderes Ziel lenken. Eine vollständig atomare Weiterleitung erfordert Upstream-Unterstützung der Seitentools
  für stabile Ziel-IDs.

### Benutzerdefinierter Start von Chrome MCP

Überschreiben Sie den gestarteten Chrome-DevTools-MCP-Server pro Profil, wenn der standardmäßige
`npx chrome-devtools-mcp@latest`-Ablauf nicht Ihren Anforderungen entspricht (Offline-Hosts,
festgelegte Versionen, mitgelieferte Binärdateien):

| Feld        | Funktion                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ausführbare Datei, die anstelle von `npx` gestartet wird. Wird unverändert aufgelöst; absolute Pfade werden berücksichtigt.                                          |
| `mcpArgs`    | Argument-Array, das unverändert an `mcpCommand` übergeben wird. Ersetzt die standardmäßigen `chrome-devtools-mcp@latest --autoConnect`-Argumente. |

Wenn `cdpUrl` für ein Profil mit bestehender Sitzung gesetzt ist, überspringt OpenClaw
`--autoConnect` und leitet den Endpunkt automatisch an Chrome MCP weiter:

- `http(s)://...` → `--browserUrl <url>` (HTTP-Discovery-Endpunkt von DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (direkter CDP-WebSocket).

Endpunkt-Flags und `userDataDir` können nicht kombiniert werden: Wenn `cdpUrl` gesetzt ist,
wird `userDataDir` für den Start von Chrome MCP ignoriert, da Chrome MCP sich an den
hinter dem Endpunkt laufenden Browser anhängt, anstatt ein Profilverzeichnis
zu öffnen.

<Accordion title="Funktionseinschränkungen bei bestehenden Sitzungen">

Im Vergleich zum verwalteten Profil `openclaw` unterliegen Treiber für bestehende Sitzungen stärkeren Einschränkungen:

- **Screenshots** – Seitenaufnahmen und Elementaufnahmen mit `--ref` funktionieren; CSS-Selektoren mit `--element` nicht. Playwright ist für Seiten-Screenshots oder referenzbasierte Element-Screenshots nicht erforderlich. (`--full-page` kann in keinem Profil mit `--ref` oder `--element` kombiniert werden, nicht nur bei bestehenden Sitzungen.)
- **Aktionen** – `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Referenzen (keine CSS-Selektoren). `click-coords` klickt auf sichtbare Viewport-Koordinaten und erfordert keine Snapshot-Referenz. `click` unterstützt nur die linke Maustaste (keine abweichenden Tasten oder Modifikatortasten). `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `type`, `hover`, `scrollIntoView`, `drag`, `select` und `fill` unterstützen keine aufrufspezifischen Überschreibungen von `timeoutMs`; `evaluate` hingegen schon. `select` akzeptiert einen einzelnen Wert. `batch` wird nicht unterstützt; senden Sie Aktionen einzeln.
- **Warten / Upload / Dialog** – `wait --url` unterstützt exakte Muster, Teilzeichenfolgen und Glob-Muster (wie bei verwalteten Profilen); `wait --load networkidle` wird bei Profilen mit bestehenden Sitzungen nicht unterstützt (es funktioniert bei verwalteten und Raw-/Remote-CDP-Profilen). Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, ohne CSS-`element`. Dialog-Hooks unterstützen weder Timeout-Überschreibungen noch `dialogId`.
- **Sichtbarkeit von Dialogen** – Antworten verwalteter Browseraktionen enthalten `blockedByDialog` und `browserState.dialogs.pending`, wenn eine Aktion einen modalen Dialog öffnet; Snapshots enthalten ebenfalls den Status ausstehender Dialoge. Antworten Sie mit `browser dialog --accept/--dismiss --dialog-id <id>`, während ein Dialog aussteht. Außerhalb von OpenClaw behandelte Dialoge werden unter `browserState.dialogs.recent` angezeigt.
- **Nur für verwaltete Profile verfügbare Funktionen** – PDF-Export, Download-Abfangung und `responsebody` erfordern weiterhin den verwalteten Browserpfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes Benutzerdatenverzeichnis**: Greift niemals auf Ihr persönliches Browserprofil zu.
- **Dedizierte Ports**: Vermeidet `9222`, um Kollisionen mit Entwicklungsabläufen zu verhindern.
- **Deterministische Tab-Steuerung**: `tabs` gibt zuerst `suggestedTargetId` zurück, danach
  stabile `tabId`-Handles wie `t1`, optionale Bezeichnungen und die unveränderte `targetId`.
  Agents sollten `suggestedTargetId` wiederverwenden; unveränderte IDs bleiben für
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
- Linux: Prüft übliche Installationsorte von Chrome/Brave/Edge/Chromium unter `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` und
  `/usr/lib/chromium-browser` sowie von Playwright verwaltetes Chromium unter
  `PLAYWRIGHT_BROWSERS_PATH` oder `~/.cache/ms-playwright`.
- Windows: Prüft übliche Installationsorte.

## Steuerungs-API (optional)

Für Skripting und Debugging stellt der Gateway eine kleine **ausschließlich über Loopback erreichbare HTTP-
Steuerungs-API** sowie eine passende `openclaw browser`-CLI bereit (Snapshots, Referenzen, erweiterte
Wartefunktionen, JSON-Ausgabe, Debugging-Abläufe). Die vollständige Referenz finden Sie unter
[Browser-Steuerungs-API](/de/tools/browser-control).

## Fehlerbehebung

Linux-spezifische Probleme (insbesondere mit Chromium als Snap) werden unter
[Fehlerbehebung für Browser](/de/tools/browser-linux-troubleshooting) behandelt.

Informationen zu Split-Host-Konfigurationen mit WSL2-Gateway und Chrome unter Windows finden Sie unter
[Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler im Vergleich zur SSRF-Blockierung der Navigation

Dies sind unterschiedliche Fehlerklassen, die auf unterschiedliche Codepfade hinweisen.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene fehlerfrei funktioniert.
- **SSRF-Blockierung der Navigation** bedeutet, dass die Browser-Steuerungsebene fehlerfrei funktioniert, ein Navigationsziel für eine Seite jedoch durch eine Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, wenn ein
    externer Loopback-CDP-Dienst ohne `attachOnly: true` konfiguriert ist
- SSRF-Blockierung der Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerkrichtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Befehlsfolge, um die beiden Fälle zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So interpretieren Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaftsprobleme.
- Wenn `start` erfolgreich ist, `tabs` jedoch fehlschlägt, ist die Steuerungsebene weiterhin nicht funktionsfähig. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Seitennavigationsproblem.
- Wenn `start` und `tabs` erfolgreich sind, `open` oder `navigate` jedoch fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, funktioniert der grundlegende Steuerungspfad des verwalteten Browsers fehlerfrei.

Wichtige Verhaltensdetails:

- Die Browserkonfiguration verwendet standardmäßig ein geschlossen fehlschlagendes SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale verwaltete Loopback-Profil `openclaw` überspringen CDP-Zustandsprüfungen bewusst die Durchsetzung der Browser-SSRF-Erreichbarkeit für die lokale Steuerungsebene von OpenClaw.
- Der Navigationsschutz ist davon getrennt. Ein erfolgreiches Ergebnis von `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` zulässig ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie eng gefasste Hostausnahmen wie `hostnameAllowlist` oder `allowedHostnames` gegenüber einem umfassenden Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen der Browserzugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools und Funktionsweise der Steuerung

Der Agent erhält **ein Tool** für die Browserautomatisierung:

- `browser` – doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum (AI oder ARIA) zurück.
- `browser act` verwendet die `ref`-IDs des Snapshots zum Klicken, Eingeben, Ziehen und Auswählen.
- `browser screenshot` erfasst Pixel (vollständige Seite, Element oder beschriftete Referenzen).
- `browser doctor` prüft die Bereitschaft von Gateway, Plugin, Profil, Browser und Tab.
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder Remote-CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser ausgeführt wird.
  - In Sandbox-Sitzungen erfordert `target: "host"` die Option `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: Sandbox-Sitzungen verwenden standardmäßig `sandbox`, Sitzungen ohne Sandbox standardmäßig `host`.
  - Wenn eine browserfähige Node verbunden ist, kann das Tool Anfragen automatisch an sie weiterleiten, sofern Sie nicht `target="host"` oder `target="node"` fest vorgeben.

Dadurch bleibt der Agent deterministisch und fragile Selektoren werden vermieden.

## Verwandte Themen

- [Tool-Übersicht](/de/tools) – alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) – Browsersteuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) – Risiken und Absicherung der Browsersteuerung
