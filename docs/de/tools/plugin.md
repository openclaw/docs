---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-10T19:55:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Channels, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Web Fetch, Web
Search und mehr. Einige Plugins sind **Core** (werden mit OpenClaw ausgeliefert),
andere sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/clawhub) veröffentlicht und gefunden. Npm wird weiterhin für direkte
Installationen und für eine vorübergehende Gruppe von OpenClaw-eigenen
Plugin-Paketen unterstützt, bis diese Migration abgeschlossen ist.

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

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer
    Konfigurationsdatei.

  </Step>

  <Step title="Chat-native Verwaltung">
    In einem laufenden Gateway lösen die nur für Owner verfügbaren Befehle
    `/plugins enable` und `/plugins disable` den Gateway-Konfigurations-Reloader
    aus. Das Gateway lädt Plugin-Laufzeitoberflächen im Prozess neu, und neue
    Agent-Runden bauen ihre Tool-Liste aus der aktualisierten Registry neu auf.
    `/plugins install` ändert Plugin-Quellcode, daher fordert das Gateway einen
    Neustart an, statt vorzugeben, dass der aktuelle Prozess bereits importierte
    Module sicher neu laden kann.

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

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true`
und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler
Pfad/Archiv, explizites `clawhub:<pkg>`, explizites `npm:<pkg>`, explizites
`npm-pack:<path.tgz>`, explizites `git:<repo>` oder eine einfache Paketangabe
über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise
geschlossen fehl und verweist auf `openclaw doctor --fix`. Die einzige
Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte
Plugins, die `openclaw.install.allowInvalidConfigRecovery` aktivieren.
Beim Gateway-Start schlägt ungültige Plugin-Konfiguration geschlossen fehl wie
jede andere ungültige Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
die fehlerhafte Plugin-Konfiguration zu isolieren, indem dieser Plugin-Eintrag
deaktiviert und seine ungültige Konfigurationsnutzlast entfernt wird; die normale
Konfigurationssicherung behält die vorherigen Werte.
Wenn eine Channel-Konfiguration auf ein Plugin verweist, das nicht mehr auffindbar
ist, dieselbe veraltete Plugin-ID aber weiterhin in der Plugin-Konfiguration oder
in Installationsdatensätzen vorhanden ist, protokolliert der Gateway-Start
Warnungen und überspringt diesen Channel, statt alle anderen Channels zu
blockieren. Führen Sie `openclaw doctor --fix` aus, um die veralteten
Channel-/Plugin-Einträge zu entfernen; unbekannte Channel-Schlüssel ohne Hinweis
auf ein veraltetes Plugin schlagen weiterhin bei der Validierung fehl, damit
Tippfehler sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Referenzen als
inaktiv behandelt: Der Gateway-Start überspringt Plugin-Discovery-/Ladevorgänge,
und `openclaw doctor` behält die deaktivierte Plugin-Konfiguration bei, statt sie
automatisch zu entfernen. Aktivieren Sie Plugins wieder, bevor Sie die
Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter
Installations-/Aktualisierungs- oder Doctor-Reparaturabläufe. Gateway-Start,
Konfigurations-Reload und Laufzeitinspektion führen keine Paketmanager aus und
reparieren keine Abhängigkeitsbäume. Bei lokalen Plugins müssen die Abhängigkeiten
bereits installiert sein, während npm-, git- und ClawHub-Plugins unter den
verwalteten Plugin-Roots von OpenClaw installiert werden. npm-Abhängigkeiten
können innerhalb von OpenClaws verwaltetem npm-Root hochgezogen werden;
Install/Update durchsucht dieses verwaltete Root vor Trust, und Uninstall entfernt
npm-verwaltete Pakete über npm. Externe Plugins und benutzerdefinierte Ladepfade
müssen weiterhin über `openclaw plugins install` installiert werden.
Verwenden Sie `openclaw plugins list --json`, um den statischen
`dependencyStatus` für jedes sichtbare Plugin zu sehen, ohne Laufzeitcode zu
importieren oder Abhängigkeiten zu reparieren.
Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution) für den
Lebenszyklus zur Installationszeit.

### Besitz von blockierten Plugin-Pfaden

Wenn die Plugin-Diagnose meldet
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
und die Konfigurationsvalidierung mit `plugin present but blocked` folgt, hat
OpenClaw Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als dem
Prozess, der sie lädt. Behalten Sie die Plugin-Konfiguration bei; korrigieren Sie
den Dateisystembesitz oder führen Sie OpenClaw als denselben Benutzer aus, dem das
State-Verzeichnis gehört.

Bei Docker-Installationen läuft das offizielle Image als `node` (uid `1000`),
daher sollten die vom Host bind-mounteten OpenClaw-Konfigurations- und
Workspace-Verzeichnisse normalerweise uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, reparieren Sie stattdessen das
verwaltete Plugin-Root auf root-Besitz:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Nachdem der Besitz korrigiert wurde, führen Sie `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` erneut aus, damit die persistierte
Plugin-Registry zu den reparierten Dateien passt.

Bei npm-Installationen werden veränderliche Selektoren wie `latest` oder ein
Dist-Tag vor der Installation aufgelöst und anschließend auf die exakt verifizierte
Version in OpenClaws verwaltetem npm-Root festgeschrieben. Nachdem npm beendet
ist, verifiziert OpenClaw, dass der installierte `package-lock.json`-Eintrag noch
zur aufgelösten Version und Integrität passt. Wenn npm andere Paketmetadaten
schreibt, schlägt die Installation fehl und das verwaltete Paket wird
zurückgerollt, statt ein anderes Plugin-Artefakt zu akzeptieren.
Verwaltete npm-Roots erben außerdem OpenClaws paketweite npm-`overrides`, sodass
Sicherheitspins, die den paketierten Host schützen, auch für hochgezogene
Abhängigkeiten externer Plugins gelten.

Source-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an
gebündelten Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt
gebündelte Plugins dann aus `extensions/<id>`, sodass Änderungen und
paketlokale Abhängigkeiten direkt verwendet werden. Einfache npm-Root-
Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung
in Source-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                     | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativ**  | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie
unter [Plugin-Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit
[Plugins erstellen](/de/plugins/building-plugins) und der
[Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Entrypoints

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json`
deklarieren. Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und
zu einer lesbaren Laufzeitdatei auflösen oder zu einer TypeScript-Quelldatei mit
einem abgeleiteten gebauten JavaScript-Peer wie `src/index.ts` zu `dist/index.js`.
Paketierte Installationen müssen diese JavaScript-Laufzeitausgabe mitliefern.
Der TypeScript-Quellfallback ist für Source-Checkouts und lokale
Entwicklungspfade gedacht, nicht für npm-Pakete, die in OpenClaws verwaltetem
Plugin-Root installiert werden.

Wenn eine Warnung für ein verwaltetes Paket sagt, es `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht,
die OpenClaw zur Laufzeit benötigt. Das ist ein Problem der Plugin-Paketierung,
kein lokales Konfigurationsproblem. Aktualisieren oder reinstallieren Sie das
Plugin, nachdem der Publisher kompiliertes JavaScript erneut veröffentlicht hat,
oder deaktivieren/deinstallieren Sie dieses Plugin, bis ein korrigiertes Paket
verfügbar ist.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien
nicht an denselben Pfaden liegen wie die Quelleinträge. Wenn `runtimeExtensions`
vorhanden ist, muss es genau einen Eintrag für jeden `extensions`-Eintrag
enthalten. Nicht übereinstimmende Listen lassen Installation und Plugin-Discovery
fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie auch
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry`
für den gebauten JavaScript-Peer; diese Datei ist erforderlich, wenn sie
deklariert wird.

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

ClawHub ist der primäre Distributionspfad für die meisten Plugins. Aktuelle
paketierte OpenClaw-Releases bündeln bereits viele offizielle Plugins, daher
benötigen diese in normalen Setups keine separaten npm-Installationen. Bis jedes
OpenClaw-eigene Plugin zu ClawHub migriert ist, liefert OpenClaw weiterhin einige
`@openclaw/*`-Plugin-Pakete auf npm für ältere/angepasste Installationen und
direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese
Paketversion aus einer älteren externen Paketlinie. Verwenden Sie das gebündelte
Plugin aus dem aktuellen OpenClaw oder einen lokalen Checkout, bis ein neueres
npm-Paket veröffentlicht ist.

| Plugin          | Paket                      | Dokumentation                              |
| --------------- | -------------------------- | ------------------------------------------ |
| Discord         | `@openclaw/discord`        | [Discord](/de/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/de/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/de/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/de/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/de/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/de/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/de/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/de/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/de/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/de/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/de/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/de/plugins/zalouser)         |

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
    - `memory-core` - gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` - LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abruflimits und Fehlerbehebung.

  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` - gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser` CLI, die `browser.request` Gateway-Methode, die Browser-Laufzeit und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` - VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie nach Drittanbieter-Plugins? Siehe [ClawHub](/de/clawhub).

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

| Feld               | Beschreibung                                               |
| ------------------ | ---------------------------------------------------------- |
| `enabled`          | Hauptschalter (Standard: `true`)                           |
| `allow`            | Plugin-Allowlist (optional)                                |
| `bundledDiscovery` | Discovery-Modus für gebündelte Plugins (standardmäßig `allowlist`) |
| `deny`             | Plugin-Denylist (optional; Deny hat Vorrang)               |
| `load.paths`       | Zusätzliche Plugin-Dateien/-Verzeichnisse                  |
| `slots`            | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schalter + Konfiguration pro Plugin                        |

`plugins.allow` ist exklusiv. Wenn es nicht leer ist, können nur aufgeführte Plugins geladen
oder Tools bereitstellen, selbst wenn `tools.allow` `"*"` oder einen bestimmten Plugin-eigenen
Tool-Namen enthält. Wenn eine Tool-Allowlist Plugin-Tools referenziert, fügen Sie die besitzenden Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor` warnt vor dieser
Form.

`plugins.bundledDiscovery` ist bei neuen Konfigurationen standardmäßig `"allowlist"`, sodass ein
restriktives `plugins.allow`-Inventar auch ausgelassene gebündelte Provider-Plugins blockiert,
einschließlich der Discovery von Laufzeit-Websuch-Providern. Doctor versieht ältere
restriktive Allowlist-Konfigurationen während der Migration mit `"compat"`, damit Upgrades das
Legacy-Verhalten gebündelter Provider beibehalten, bis der Betreiber den strengeren Modus aktiviert.
Ein leeres `plugins.allow` wird weiterhin als nicht gesetzt/offen behandelt.

Konfigurationsänderungen über `/plugins enable` oder `/plugins disable` lösen ein
In-Process-Reload der Gateway-Plugins aus. Neue Agent-Turns bauen ihre Tool-Liste aus
der aktualisierten Plugin-Registry neu auf. Quellcodeändernde Operationen wie Installieren,
Aktualisieren und Deinstallieren starten weiterhin den Gateway-Prozess neu, weil bereits importierte
Plugin-Module nicht sicher im laufenden Betrieb ersetzt werden können.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/Konfiguration. Ein dort als
`enabled` angezeigtes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufender Remote-Gateway
neu geladen oder mit demselben Plugin-Code neu gestartet wurde. Bei VPS-/Container-Setups
mit Wrapper-Prozessen senden Sie Neustarts oder Reload-auslösende Schreibvorgänge an den tatsächlichen
`openclaw gateway run`-Prozess, oder verwenden Sie `openclaw gateway restart` gegen den
laufenden Gateway, wenn der Reload einen Fehler meldet.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, wurde aber durch Aktivierungsregeln abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Konfiguration referenziert eine Plugin-ID, die von der Discovery nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag unter Quarantäne stellen, indem er ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Discovery und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (erste Übereinstimmung gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` - explizite Datei- oder Verzeichnispfade. Pfade, die
    zurück auf OpenClaws eigene paketierte Verzeichnisse gebündelter Plugins zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den passenden paketierten Quellpfad gebunden wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses eingebundene Quellverzeichnis
als gebündeltes Source-Overlay und entdeckt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. So funktionieren Maintainer-Container-
Loops weiter, ohne jedes gebündelte Plugin zurück auf TypeScript-Quellcode umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
auch wenn Source-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Plugin-Discovery-/Ladevorgänge
- `plugins.deny` hat immer Vorrang vor Allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem integrierten standardmäßig aktivierten Set, sofern sie nicht überschrieben werden
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Laufzeit
- Veraltete Plugin-Konfiguration bleibt erhalten, während `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn Sie veraltete IDs entfernen möchten
- OpenAI-Familien-Codex-Routen behalten getrennte Plugin-Grenzen bei:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch kanonische `openai/*`-Agent-Referenzen, explizite
  Provider/Modell-`agentRuntime.id: "codex"` oder Legacy-`codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung für Laufzeit-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Nebeneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie den Live-Gateway nach Plugin-Installations-/Konfigurations-/Codeänderungen neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten oder signalisieren Sie den untergeordneten
  `openclaw gateway run`-Prozess.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Conversation-Hooks wie `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es wird vor der Modellauflösung
  für Agent-Turns ausgeführt; `llm_output` wird erst ausgeführt, nachdem ein Modellversuch
  Assistentenausgabe erzeugt hat.
- Als Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten den Gateway beim Debuggen von Provider-Payloads
  mit `--raw-stream --raw-stream-path <path>`.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu stocken scheinen, aktivieren Sie Trace-Logging und
prüfen Sie Timing-Zeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung listet die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factorys auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory mindestens
1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5 s dauert.

OpenClaw speichert erfolgreiche Ergebnisse von Plugin-Tool-Factorys für wiederholte Auflösungen
mit demselben effektiven Request-Kontext im Cache. Der Cache-Schlüssel enthält die effektive
Laufzeitkonfiguration, Workspace, Agent-/Sitzungs-IDs, Sandbox-Richtlinie, Browser-Einstellungen,
Delivery-Kontext, Identität des Anforderers und Ownership-Zustand, sodass Factorys, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Laufzeit-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren Sie dieses Plugin dann neu oder deaktivieren Sie es. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory zu tun.

### Doppelte Channel- oder Tool-Ownership

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dies bedeutet, dass mehr als ein aktiviertes Plugin versucht, denselben Channel,
Setup-Flow oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Channel-Plugin,
das neben einem gebündelten Plugin installiert ist, das nun dieselbe Channel-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen
  von Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie den Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Channel-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit
  der Plugin-ID niedrigerer Priorität deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anforderung bei und
  meldet den Konflikt. Wählen Sie einen Owner für den Channel oder benennen Sie Plugin-eigene
  Tools um, damit die Laufzeitoberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (immer nur eine aktiv):

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

| Slot            | Was er steuert             | Standard             |
| --------------- | -------------------------- | -------------------- |
| `memory`        | Aktives Memory-Plugin      | `memory-core`        |
| `contextEngine` | Aktive Context Engine      | `legacy` (integriert) |

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

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird nicht zusammen mit `--link` unterstützt, das den Quellpfad wiederverwendet,
anstatt ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor sie aktiviert wird. Wenn dieselbe Plugin-ID
in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, damit die
explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw verwaltet eine persistierte lokale Plugin-Registry als Cold-Read-Modell für
Plugin-Inventar, Besitz von Beiträgen und Startplanung. Installations-, Aktualisierungs-,
Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry, nachdem sie den Plugin-
Status geändert haben. Dieselbe Datei `plugins/installs.json` speichert dauerhafte Installationsmetadaten in
`installRecords` auf oberster Ebene und erneut erstellbare Manifestmetadaten in `plugins`. Wenn
die Registry fehlt, veraltet oder ungültig ist, erstellt `openclaw plugins registry
--refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinien und
Manifest-/Paketmetadaten neu, ohne Plugin-Laufzeitmodule zu laden.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert.
Verwalten Sie stattdessen die Auswahl von Plugin-Paketen und die Konfiguration über die Nix-Quelle für die
Installation; für nix-openclaw beginnen Sie mit dem agentenorientierten
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Wenn Sie
eine npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben, wird der Paketname
zurück zum nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für zukünftige Updates gespeichert.
Wenn Sie den Paketnamen ohne Version übergeben, wird eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry verschoben. Wenn das installierte npm-Plugin bereits
der aufgelösten Version und der gespeicherten Artefaktidentität entspricht, überspringt OpenClaw das Update
ohne Download, Neuinstallation oder Umschreiben der Konfiguration.
Wenn `openclaw update` im Beta-Kanal ausgeführt wird, versuchen npm- und ClawHub-
Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen auf default/latest zurück, wenn keine Plugin-
Beta-Version existiert. Exakte Versionen und explizite Tags bleiben gepinnt.

`--pin` gilt nur für npm. Es wird nicht mit `--marketplace` unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten anstelle einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Notfallübersteuerung für False Positives
des integrierten Scanners für gefährlichen Code. Sie erlaubt Plugin-Installationen
und Plugin-Updates, trotz integrierter `critical`-Befunde fortzufahren, umgeht aber weiterhin
keine Plugin-`before_install`-Richtlinienblockaden oder Blockierungen durch Scanfehler.
Installationsscans ignorieren häufige Testdateien und Verzeichnisse wie `tests/`,
`__tests__/`, `*.test.*` und `*.spec.*`, um paketierte Test-Mocks nicht zu blockieren;
deklarierte Plugin-Laufzeit-Einstiegspunkte werden weiterhin gescannt, auch wenn sie einen dieser
Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-
Abhängigkeiten verwenden stattdessen die passende Anfrageübersteuerung `dangerouslyForceUnsafeInstall`,
während `openclaw skills install` der separate ClawHub-Download-/Installationsablauf für Skills bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan ausgeblendet oder blockiert wird, öffnen Sie das
ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub aufzufordern,
es erneut zu prüfen. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen auf Ihrem eigenen
Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder eine blockierte Version
öffentlich zu machen.

Kompatible Bundles nehmen am selben Plugin-Ablauf für Auflisten/Prüfen/Aktivieren/Deaktivieren teil.
Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Befehl-Skills,
Claude-Standardwerte für `settings.json`, Claude-Standardwerte für `.lsp.json` und im Manifest deklarierte
`lspServers`, Cursor-Befehl-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-bekannter Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokales Marketplace-Stammverzeichnis oder ein
`marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Siehe die [`openclaw plugins` CLI-Referenz](/de/cli/plugins) für vollständige Details.

## Plugin-API-Überblick

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, neue Plugins sollten jedoch
`register` verwenden.

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

OpenClaw lädt das Entry-Objekt und ruft während der Plugin-
Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag betrachten.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Laufzeitaktivierung. Registriert Tools, Hooks, Dienste, Befehle, Routen und andere Live-Nebeneffekte.                          |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code darf geladen werden, aber Live-Nebeneffekte werden übersprungen. |
| `setup-only`    | Laden von Kanal-Setup-Metadaten über einen schlanken Setup-Entry.                                                               |
| `setup-runtime` | Kanal-Setup-Laden, das zusätzlich den Laufzeit-Entry benötigt.                                                                  |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                         |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` schützen.
Discovery-Ladevorgänge werden getrennt von Aktivierungsladevorgängen zwischengespeichert und ersetzen nicht
die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber nicht importfrei:
OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Kanal-Plugin-Modul auswerten, um
den Snapshot zu erstellen. Halten Sie Module-Top-Levels schlank und frei von Nebeneffekten, und verschieben Sie
Netzwerkclients, Subprozesse, Listener, Credential-Lesevorgänge und Dienststarts
hinter Vollzeit-Laufzeitpfade.

Häufige Registrierungsmethoden:

| Methode                                 | Was sie registriert           |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)         |
| `registerChannel`                       | Chat-Kanal                    |
| `registerTool`                          | Agent-Tool                    |
| `registerHook` / `on(...)`              | Lebenszyklus-Hooks            |
| `registerSpeechProvider`                | Text-to-Speech / STT          |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                 |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme         |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse            |
| `registerImageGenerationProvider`       | Bilderzeugung                 |
| `registerMusicGenerationProvider`       | Musikerzeugung                |
| `registerVideoGenerationProvider`       | Videoerzeugung                |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider    |
| `registerWebSearchProvider`             | Websuche                      |
| `registerHttpRoute`                     | HTTP-Endpunkt                 |
| `registerCommand` / `registerCli`       | CLI-Befehle                   |
| `registerContextEngine`                 | Kontext-Engine                |
| `registerService`                       | Hintergrunddienst             |

Hook-Guard-Verhalten für typisierte Lebenszyklus-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt einen früheren Abbruch nicht auf.

Native Codex-App-Server-Ausführungen leiten Codex-native Tool-Ereignisse zurück an diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call`
blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt Argumente
Codex-nativer Tools noch nicht um. Die genaue Unterstützungsgrenze der Codex-Laufzeit
ist im [Codex-Harness-v1-Unterstützungsvertrag](/de/plugins/codex-harness-runtime#v1-support-contract) festgelegt.

Das vollständige typisierte Hook-Verhalten finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) - eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) - Kompatibilität mit Codex/Claude/Cursor-Bundles
- [Plugin-Manifest](/de/plugins/manifest) - Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) - Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) - Capability-Modell und Ladepipeline
- [ClawHub](/de/clawhub) - Entdeckung von Drittanbieter-Plugins
