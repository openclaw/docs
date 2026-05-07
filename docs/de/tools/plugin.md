---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:26:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeittranskription, Echtzeitstimme,
Medienverständnis, Bilderzeugung, Videogenerierung, Webabruf, Websuche und
mehr. Einige Plugins sind **Kern-Plugins** (werden mit OpenClaw ausgeliefert),
andere sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte
Installationen und für eine temporäre Gruppe von OpenClaw-eigenen Plugin-Paketen
unterstützt, solange diese Migration abgeschlossen wird.

## Schnellstart

Beispiele zum Kopieren und Einfügen für Installation, Auflisten, Deinstallation,
Aktualisierung und Veröffentlichung finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins).

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>

  <Step title="Chat-native Verwaltung">
    In einem laufenden Gateway lösen die nur dem Owner vorbehaltenen Befehle
    `/plugins enable` und `/plugins disable` den Gateway-Konfigurations-Reloader
    aus. Das Gateway lädt Plugin-Laufzeitoberflächen im Prozess neu, und neue
    Agent-Durchläufe bauen ihre Tool-Liste aus der aktualisierten Registry neu
    auf. `/plugins install` ändert den Plugin-Quellcode, daher fordert das
    Gateway stattdessen einen Neustart an, anstatt vorzugeben, der aktuelle
    Prozess könne bereits importierte Module sicher neu laden.

  </Step>

  <Step title="Plugin verifizieren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Dienste,
    Gateway-Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen.
    Einfaches `inspect` ist eine kalte Manifest-/Registry-Prüfung und vermeidet
    absichtlich den Import der Plugin-Laufzeit.

  </Step>
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>`, explizites `npm:<pkg>`, explizites `npm-pack:<path.tgz>`,
explizites `git:<repo>` oder eine bloße Paketspezifikation über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise
geschlossen fehl und verweist Sie auf `openclaw doctor --fix`. Die einzige
Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte
Plugins, die `openclaw.install.allowInvalidConfigRecovery` aktivieren.
Während des Gateway-Starts schlägt ungültige Plugin-Konfiguration geschlossen
fehl, wie jede andere ungültige Konfiguration. Führen Sie `openclaw doctor --fix`
aus, um die fehlerhafte Plugin-Konfiguration zu isolieren, indem dieser
Plugin-Eintrag deaktiviert und seine ungültige Konfigurationsnutzlast entfernt
wird; das normale Konfigurationsbackup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar
ist, dieselbe veraltete Plugin-ID aber weiterhin in Plugin-Konfiguration oder
Installationsdatensätzen vorhanden ist, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, anstatt alle anderen Kanäle zu
blockieren. Führen Sie `openclaw doctor --fix` aus, um die veralteten
Kanal-/Plugin-Einträge zu entfernen; unbekannte Kanalschlüssel ohne Hinweise auf
veraltete Plugins schlagen weiterhin bei der Validierung fehl, damit Tippfehler
sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als
inaktiv behandelt: Der Gateway-Start überspringt Plugin-Erkennung und
Ladeaufgaben, und `openclaw doctor` behält die deaktivierte Plugin-Konfiguration
bei, anstatt sie automatisch zu entfernen. Aktivieren Sie Plugins erneut, bevor
Sie die Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden
sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter
Installations-/Aktualisierungs- oder Doctor-Reparaturabläufe. Gateway-Start,
Konfigurationsneuladen und Laufzeitinspektion führen keine Paketmanager aus und
reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre Abhängigkeiten
bereits installiert haben, während npm-, git- und ClawHub-Plugins unter den von
OpenClaw verwalteten Plugin-Wurzeln installiert werden. npm-Abhängigkeiten
können innerhalb der von OpenClaw verwalteten npm-Wurzel gehoben werden;
Installation/Aktualisierung durchsucht diese verwaltete Wurzel vor der
Vertrauensprüfung, und die Deinstallation entfernt npm-verwaltete Pakete über
npm. Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden. Verwenden Sie
`openclaw plugins list --json`, um den statischen `dependencyStatus` jedes
sichtbaren Plugins zu sehen, ohne Laufzeitcode zu importieren oder Abhängigkeiten
zu reparieren. Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution)
für den Lebenszyklus zur Installationszeit.

### Blockierter Besitz des Plugin-Pfads

Wenn die Plugin-Diagnose
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
meldet und die Konfigurationsvalidierung mit `plugin present but blocked` folgt,
hat OpenClaw Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als
dem Prozess, der sie lädt. Behalten Sie die Plugin-Konfiguration bei; korrigieren
Sie den Dateisystembesitz oder führen Sie OpenClaw als denselben Benutzer aus,
dem das Zustandsverzeichnis gehört.

Bei Docker-Installationen läuft das offizielle Image als `node` (uid `1000`),
daher sollten die vom Host bind-gemounteten OpenClaw-Konfigurations- und
Arbeitsbereichsverzeichnisse normalerweise uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, reparieren Sie stattdessen die
verwaltete Plugin-Wurzel auf root-Besitz:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Nachdem Sie den Besitz korrigiert haben, führen Sie erneut `openclaw doctor --fix`
oder `openclaw plugins registry --refresh` aus, damit die persistierte
Plugin-Registry den reparierten Dateien entspricht.

Bei npm-Installationen werden veränderliche Selektoren wie `latest` oder ein
dist-tag vor der Installation aufgelöst und dann auf die exakt verifizierte
Version in OpenClaws verwalteter npm-Wurzel fixiert. Nachdem npm fertig ist,
verifiziert OpenClaw, dass der installierte `package-lock.json`-Eintrag weiterhin
der aufgelösten Version und Integrität entspricht. Wenn npm andere
Paketmetadaten schreibt, schlägt die Installation fehl und das verwaltete Paket
wird zurückgesetzt, anstatt ein anderes Plugin-Artefakt zu akzeptieren.
Verwaltete npm-Wurzeln erben außerdem OpenClaws npm-`overrides` auf Paketebene,
sodass Sicherheits-Pins, die den paketierten Host schützen, auch für gehobene
externe Plugin-Abhängigkeiten gelten.

Quellcode-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an
gebündelten Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt
gebündelte Plugins dann aus `extensions/<id>`, sodass Änderungen und
paketlokale Abhängigkeiten direkt verwendet werden. Einfache npm-Root-
Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung
in Quellcode-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                     | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativ**  | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin-Bundles](/de/plugins/bundles) für Bundle-Details.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json`
deklarieren. Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu
einer lesbaren Laufzeitdatei auflösen, oder zu einer TypeScript-Quelldatei mit
einem abgeleiteten gebauten JavaScript-Peer wie `src/index.ts` zu
`dist/index.js`. Paketierte Installationen müssen diese JavaScript-Laufzeitausgabe
mitliefern. Der TypeScript-Quellfallback ist für Quellcode-Checkouts und lokale
Entwicklungspfade gedacht, nicht für npm-Pakete, die in OpenClaws verwaltete
Plugin-Wurzel installiert werden.

Wenn eine Warnung für ein verwaltetes Paket sagt, dass es
`requires compiled runtime output for TypeScript entry ...`, wurde das Paket
ohne die JavaScript-Dateien veröffentlicht, die OpenClaw zur Laufzeit benötigt.
Das ist ein Problem der Plugin-Paketierung, kein lokales Konfigurationsproblem.
Aktualisieren oder installieren Sie das Plugin neu, nachdem der Herausgeber
kompiliertes JavaScript erneut veröffentlicht hat, oder deaktivieren/deinstallieren
Sie dieses Plugin, bis ein korrigiertes Paket verfügbar ist.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien
nicht an denselben Pfaden liegen wie die Quelleinträge. Wenn vorhanden, muss
`runtimeExtensions` genau einen Eintrag für jeden `extensions`-Eintrag enthalten.
Nicht übereinstimmende Listen lassen Installation und Plugin-Erkennung
fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie auch
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry`
für seinen gebauten JavaScript-Peer; diese Datei ist erforderlich, wenn sie
deklariert ist.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Offizielle Plugins

### OpenClaw-eigene npm-Pakete während der Migration

ClawHub ist der primäre Verteilungsweg für die meisten Plugins. Aktuelle
paketierte OpenClaw-Releases bündeln bereits viele offizielle Plugins, sodass
diese in normalen Setups keine separaten npm-Installationen benötigen. Bis jedes
OpenClaw-eigene Plugin zu ClawHub migriert ist, liefert OpenClaw weiterhin einige
`@openclaw/*`-Plugin-Pakete auf npm für ältere/benutzerdefinierte Installationen
und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese
Paketversion aus einem älteren externen Paketstrang. Verwenden Sie das
gebündelte Plugin aus aktuellem OpenClaw oder einen lokalen Checkout, bis ein
neueres npm-Paket veröffentlicht wird.

| Plugin          | Paket                      | Dokumentation                             |
| --------------- | -------------------------- | ----------------------------------------- |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/de/channels/bluebubbles)      |
| Discord         | `@openclaw/discord`        | [Discord](/de/channels/discord)              |
| Feishu          | `@openclaw/feishu`         | [Feishu](/de/channels/feishu)                |
| Matrix          | `@openclaw/matrix`         | [Matrix](/de/channels/matrix)                |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/de/channels/mattermost)        |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/de/channels/msteams)      |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/de/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/de/channels/nostr)                  |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/de/channels/synology-chat)  |
| Tlon            | `@openclaw/tlon`           | [Tlon](/de/channels/tlon)                    |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/de/channels/whatsapp)            |
| Zalo            | `@openclaw/zalo`           | [Zalo](/de/channels/zalo)                    |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/de/plugins/zalouser)        |

### Core (wird mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` - gebündelte Speichersuche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` - LanceDB-gestützter Langzeitspeicher mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abruflimits und Fehlerbehebung.

  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` - gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die `browser.request`-Gateway-Methode, die Browser-Laufzeitumgebung und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; deaktivieren Sie es, bevor Sie es ersetzen)
    - `copilot-proxy` - VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie nach Drittanbieter-Plugins? Siehe [Community-Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld               | Beschreibung                                              |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Hauptschalter (Standard: `true`)                          |
| `allow`            | Plugin-Allowlist (optional)                               |
| `bundledDiscovery` | Erkennungsmodus für gebündelte Plugins (standardmäßig `allowlist`) |
| `deny`             | Plugin-Denylist (optional; deny gewinnt)                  |
| `load.paths`       | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`            | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schalter pro Plugin + Konfiguration                       |

`plugins.allow` ist exklusiv. Wenn es nicht leer ist, können nur aufgeführte Plugins geladen
oder Tools bereitgestellt werden, selbst wenn `tools.allow` `"*"` oder einen bestimmten
Tool-Namen enthält, der einem Plugin gehört. Wenn eine Tool-Allowlist auf Plugin-Tools verweist,
fügen Sie die IDs der besitzenden Plugins zu `plugins.allow` hinzu oder entfernen Sie
`plugins.allow`; `openclaw doctor` warnt vor dieser Form.

`plugins.bundledDiscovery` ist für neue Konfigurationen standardmäßig `"allowlist"`, sodass ein
restriktives `plugins.allow`-Inventar auch ausgelassene gebündelte Provider-Plugins blockiert,
einschließlich der Laufzeiterkennung von Web-Such-Providern. Doctor versieht ältere
restriktive Allowlist-Konfigurationen während der Migration mit `"compat"`, damit Upgrades das
bisherige Verhalten gebündelter Provider beibehalten, bis der Betreiber sich für den strengeren
Modus entscheidet. Ein leeres `plugins.allow` wird weiterhin als nicht gesetzt/offen behandelt.

Konfigurationsänderungen, die über `/plugins enable` oder `/plugins disable` vorgenommen werden,
lösen ein prozessinternes Neuladen der Gateway-Plugins aus. Neue Agent-Turns erstellen ihre
Tool-Liste aus der aktualisierten Plugin-Registry neu. Operationen, die Quellen ändern, wie
Installieren, Aktualisieren und Deinstallieren, starten den Gateway-Prozess weiterhin neu, da
bereits importierte Plugin-Module nicht sicher an Ort und Stelle ersetzt werden können.

`openclaw plugins list` ist ein lokaler Schnappschuss von Plugin-Registry/Konfiguration. Ein dort
als `enabled` aufgeführtes Plugin bedeutet, dass die persistierte Registry und die aktuelle
Konfiguration zulassen, dass das Plugin teilnimmt. Es beweist nicht, dass ein bereits laufendes
Remote-Gateway mit demselben Plugin-Code neu geladen oder neu gestartet wurde. Senden Sie in
VPS-/Container-Setups mit Wrapper-Prozessen Neustarts oder Schreibvorgänge, die ein Neuladen
auslösen, an den tatsächlichen `openclaw gateway run`-Prozess, oder verwenden Sie
`openclaw gateway restart` für das laufende Gateway, wenn das Neuladen einen Fehler meldet.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Das Plugin existiert, aber Aktivierungsregeln haben es abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Das Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem er ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (erste Übereinstimmung gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` - explizite Datei- oder Verzeichnispfade. Pfade, die zurück
    auf OpenClaws eigene paketierte gebündelte Plugin-Verzeichnisse zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den passenden paketierten Quellpfad bind-gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und erkennt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. Dadurch funktionieren Maintainer-Container-
Schleifen weiter, ohne jedes gebündelte Plugin zurück auf TypeScript-Quellen umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
auch wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Erkennungs-/Ladearbeit für Plugins
- `plugins.deny` gewinnt immer gegenüber allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins mit Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standard-aktiv-Menge, sofern sie nicht überschrieben wird
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Kanalkonfiguration oder Harness-
  Laufzeitumgebung
- Veraltete Plugin-Konfiguration bleibt erhalten, während `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- Codex-Routen der OpenAI-Familie behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin über `agentRuntime.id: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Laufzeit-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Seiteneffekte oder Hooks
im Live-Chat-Traffic nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Plugin-Installations-, Konfigurations- oder Codeänderungen neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den untergeordneten
  `openclaw gateway run`-Prozess neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modellauflösung
  für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistentenausgabe erzeugt hat.
- Als Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Payloads
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu stocken scheinen, aktivieren Sie Trace-Logging und
prüfen Sie auf Zeitmessungszeilen der Plugin-Tool-Factories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung listet die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factories auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory
mindestens 1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factory mindestens 5 s dauert.

OpenClaw cached erfolgreiche Ergebnisse von Plugin-Tool-Factories für wiederholte Auflösungen
mit demselben effektiven Anfragekontext. Der Cache-Schlüssel enthält die effektive
Laufzeitkonfiguration, Workspace, Agent-/Sitzungs-IDs, Sandbox-Richtlinie, Browser-Einstellungen,
Auslieferungskontext, Identität des Anfragenden und Eigentumszustand, sodass Factories, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin die Zeitmessung dominiert, prüfen Sie seine Laufzeitregistrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren Sie dann dieses Plugin neu oder deaktivieren Sie es. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory zu tun.

### Doppelte Kanal- oder Tool-Eigentümerschaft

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Diese bedeuten, dass mehr als ein aktiviertes Plugin versucht, denselben Kanal,
Setup-Flow oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Kanal-Plugin,
das neben einem gebündelten Plugin installiert ist, das inzwischen dieselbe Kanal-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes vermutete Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Kanal-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit der
  Plugin-ID niedrigerer Priorität deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat unbeabsichtigt ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anfrage bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Kanal oder benennen Sie Plugin-eigene
  Tools um, damit die Laufzeitoberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine gleichzeitig aktiv):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Was er steuert         | Standard            |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin   | `memory-core`       |
| `contextEngine` | Aktive Kontext-Engine  | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Paket direkt an Ort und Stelle. Verwenden Sie `openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-Plugins. Dies wird nicht mit `--link` unterstützt, da dabei der Quellpfad wiederverwendet wird, anstatt ein verwaltetes Installationsziel zu überschreiben.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, sodass die explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw hält eine persistierte lokale Plugin-Registry als Cold-Read-Modell für Plugin-Inventar, Eigentümerschaft von Beiträgen und Startplanung vor. Installations-, Update-, Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry, nachdem sie den Plugin-Status geändert haben. Dieselbe Datei `plugins/installs.json` enthält dauerhafte Installationsmetadaten in `installRecords` auf oberster Ebene und neu aufbaubare Manifestmetadaten in `plugins`. Wenn die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry --refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinien sowie Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwalten Sie stattdessen die Auswahl von Plugin-Paketen und die Konfiguration über die Nix-Quelle der Installation; beginnen Sie für nix-openclaw mit dem agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Wenn Sie eine npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben, wird der Paketname wieder zum nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für zukünftige Updates aufgezeichnet. Wenn Sie den Paketnamen ohne Version übergeben, wird eine exakt gepinnte Installation wieder auf die Standard-Release-Linie der Registry gesetzt. Wenn das installierte npm-Plugin bereits der aufgelösten Version und der aufgezeichneten Artefaktidentität entspricht, überspringt OpenClaw das Update ohne Download, Neuinstallation oder Umschreiben der Konfiguration.
Wenn `openclaw update` im Beta-Kanal ausgeführt wird, versuchen Plugin-Datensätze der Standardlinie aus npm und ClawHub zuerst `@beta` und fallen auf default/latest zurück, wenn keine Beta-Version des Plugins vorhanden ist. Exakte Versionen und explizite Tags bleiben gepinnt.

`--pin` gilt nur für npm. Es wird nicht mit `--marketplace` unterstützt, da Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Notfallübersteuerung für False Positives des eingebauten Scanners für gefährlichen Code. Sie ermöglicht Plugin-Installationen und Plugin-Updates trotz eingebauter `critical`-Befunde fortzufahren, umgeht aber weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockaden durch Scan-Fehler. Installationsscans ignorieren gängige Testdateien und Verzeichnisse wie `tests/`, `__tests__/`, `*.test.*` und `*.spec.*`, damit paketierte Test-Mocks nicht blockieren; deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, selbst wenn sie einen dieser Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden stattdessen die passende Anfrageübersteuerung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-Download-/Installationsablauf für Skills bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan verborgen oder blockiert wird, öffnen Sie das ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub zu bitten, es erneut zu prüfen. `--dangerously-force-unsafe-install` betrifft nur Installationen auf Ihrem eigenen Computer; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder ein blockiertes Release öffentlich zu machen.

Kompatible Bundles nehmen am selben Ablauf zum Auflisten, Prüfen, Aktivieren und Deaktivieren von Plugins teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehls-Skills, Claude-Standardwerte für `settings.json`, Claude-Standardwerte für `.lsp.json` und per Manifest deklarierte `lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder ein `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL sein. Bei entfernten Marketplaces müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere Plugins können `activate(api)` weiterhin als Legacy-Alias verwenden, neue Plugins sollten jedoch `register` verwenden.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw lädt das Entry-Objekt und ruft während der Plugin-Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück, aber gebündelte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-Aktivierung. Registriert Tools, Hooks, Dienste, Befehle, Routen und andere aktive Seiteneffekte.                         |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code kann geladen werden, aber aktive Seiteneffekte überspringen. |
| `setup-only`    | Laden von Kanal-Setup-Metadaten über einen leichtgewichtigen Setup-Entry.                                                        |
| `setup-runtime` | Laden des Kanal-Setups, das zusätzlich den Runtime-Entry benötigt.                                                               |
| `cli-metadata`  | Nur Erfassung von CLI-Befehlsmetadaten.                                                                                          |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige Clients öffnen, sollten diese Seiteneffekte mit `api.registrationMode === "full"` absichern. Discovery-Ladevorgänge werden getrennt von aktivierenden Ladevorgängen gecacht und ersetzen nicht die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber nicht importfrei: OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Kanal-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie Module auf oberster Ebene leichtgewichtig und frei von Seiteneffekten, und verschieben Sie Netzwerk-Clients, Unterprozesse, Listener, Lesevorgänge für Zugangsdaten und Dienststarts hinter vollständige Runtime-Pfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was registriert wird              |
| --------------------------------------- | --------------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)             |
| `registerChannel`                       | Chat-Kanal                        |
| `registerTool`                          | Agent-Tool                        |
| `registerHook` / `on(...)`              | Lebenszyklus-Hooks                |
| `registerSpeechProvider`                | Text-to-Speech / STT              |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                     |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme             |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse                |
| `registerImageGenerationProvider`       | Bilderzeugung                     |
| `registerMusicGenerationProvider`       | Musikerzeugung                    |
| `registerVideoGenerationProvider`       | Videoerzeugung                    |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider        |
| `registerWebSearchProvider`             | Websuche                          |
| `registerHttpRoute`                     | HTTP-Endpunkt                     |
| `registerCommand` / `registerCli`       | CLI-Befehle                       |
| `registerContextEngine`                 | Context Engine                    |
| `registerService`                       | Hintergrunddienst                 |

Guard-Verhalten für typisierte Lebenszyklus-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keinen früheren Block auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt keinen früheren Block auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keinen früheren Abbruch auf.

Native Codex-App-Server-Läufe leiten Codex-native Tool-Ereignisse zurück an diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call`
blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt native Codex-
Tool-Argumente noch nicht um. Die genaue Grenze der Codex-Runtime-Unterstützung ist im
[Codex-Harness-v1-Support-Kontrakt](/de/plugins/codex-harness#v1-support-contract) festgelegt.

Das vollständig typisierte Hook-Verhalten finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) - erstellen Sie Ihr eigenes Plugin
- [Plugin-Bundles](/de/plugins/bundles) - Bundle-Kompatibilität mit Codex/Claude/Cursor
- [Plugin-Manifest](/de/plugins/manifest) - Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) - Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) - Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) - Verzeichnisse von Drittanbietern
