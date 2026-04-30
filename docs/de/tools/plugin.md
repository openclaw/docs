---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-30T07:19:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bilderzeugung, Videoerzeugung, Web-Abruf, Web-
Suche und mehr. Einige Plugins sind **Core** (werden mit OpenClaw ausgeliefert),
andere sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte
Installationen und für eine vorübergehende Gruppe OpenClaw-eigener Plugin-Pakete
unterstützt, während diese Migration abgeschlossen wird.

## Schnellstart

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>`, explizites `npm:<pkg>` oder eine reine Paketangabe (zuerst ClawHub, dann
npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.
Während des Gateway-Starts wird ungültige Konfiguration für ein einzelnes Plugin auf dieses Plugin isoliert:
Der Start protokolliert das Problem mit `plugins.entries.<id>.config`, überspringt dieses Plugin beim
Laden und hält andere Plugins und Kanäle online. Führen Sie `openclaw doctor --fix` aus,
um die fehlerhafte Plugin-Konfiguration zu quarantänisieren, indem dieser Plugin-Eintrag deaktiviert und
seine ungültige Konfigurationsnutzlast entfernt wird; das normale Konfigurations-Backup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar ist, aber dieselbe
veraltete Plugin-ID in der Plugin-Konfiguration oder in Installationsdatensätzen verbleibt, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, statt jeden anderen Kanal zu blockieren.
Führen Sie `openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge zu entfernen; unbekannte
Kanalschlüssel ohne Nachweis eines veralteten Plugins schlagen weiterhin bei der Validierung fehl, damit Tippfehler
sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als inaktiv behandelt:
Der Gateway-Start überspringt Plugin-Erkennung/-Ladearbeit, und `openclaw doctor` behält
die deaktivierte Plugin-Konfiguration bei, statt sie automatisch zu entfernen. Aktivieren Sie Plugins erneut, bevor
Sie die Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden sollen.

Paketierte OpenClaw-Installationen installieren nicht vorsorglich den gesamten
Runtime-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes, OpenClaw-eigenes Plugin aus
der Plugin-Konfiguration, alter Kanalkonfiguration oder einem standardmäßig aktivierten Manifest aktiv ist, repariert der Start
nur die deklarierten Runtime-Abhängigkeiten dieses Plugins, bevor es importiert wird.
Persistierter Kanal-Authentifizierungsstatus allein aktiviert keinen gebündelten Kanal für die
Runtime-Abhängigkeitsreparatur beim Gateway-Start.
Explizite Deaktivierung hat weiterhin Vorrang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` und `channels.<id>.enabled: false`
verhindern die automatische Reparatur gebündelter Runtime-Abhängigkeiten für dieses Plugin/diesen Kanal.
Ein nicht leeres `plugins.allow` begrenzt ebenfalls die standardmäßig aktivierte Reparatur gebündelter Runtime-Abhängigkeiten;
explizite Aktivierung gebündelter Kanäle (`channels.<id>.enabled: true`) kann
die Plugin-Abhängigkeiten dieses Kanals weiterhin reparieren.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                     | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json` deklarieren.
Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu einer lesbaren
Runtime-Datei auflösen oder zu einer TypeScript-Quelldatei mit einem abgeleiteten gebauten JavaScript-
Peer wie `src/index.ts` zu `dist/index.js`.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Runtime-Dateien nicht unter
denselben Pfaden wie die Quelleinträge liegen. Wenn vorhanden, muss `runtimeExtensions`
genau einen Eintrag für jeden `extensions`-Eintrag enthalten. Nicht übereinstimmende Listen lassen Installation und
Plugin-Erkennung fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen.

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

ClawHub ist der primäre Verteilungsweg für die meisten Plugins. Aktuelle paketierte
OpenClaw-Releases bündeln bereits viele offizielle Plugins, sodass diese in normalen Setups keine
separaten npm-Installationen benötigen. Bis jedes OpenClaw-eigene Plugin zu
ClawHub migriert wurde, liefert OpenClaw weiterhin einige `@openclaw/*`-Plugin-Pakete auf
npm für ältere/benutzerdefinierte Installationen und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese Paketversion
aus einem älteren externen Paketstrang. Verwenden Sie das gebündelte Plugin aus
dem aktuellen OpenClaw oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht wird.

| Plugin          | Paket                      | Dokumentation                              |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/de/channels/bluebubbles)       |
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

### Core (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — bei Bedarf installierbare Langzeit-Memory mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abruflimits und Fehlerbehebung.

  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstige">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die `browser.request`-Gateway-Methode, Browser-Runtime und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie Drittanbieter-Plugins? Siehe [Community-Plugins](/de/plugins/community).

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

| Feld             | Beschreibung                                             |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                         |
| `allow`          | Plugin-Zulassungsliste (optional)                        |
| `deny`           | Plugin-Sperrliste (optional; Sperre hat Vorrang)         |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration              |

Konfigurationsänderungen **erfordern einen Gateway-Neustart**. Wenn der Gateway mit Konfigurations-
Überwachung + prozessinternem Neustart läuft (der standardmäßige `openclaw gateway`-Pfad), wird dieser
Neustart normalerweise kurz nach dem Schreiben der Konfiguration automatisch ausgeführt.
Es gibt keinen unterstützten Hot-Reload-Pfad für nativen Plugin-Runtime-Code oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Kanal bedient, bevor
Sie erwarten, dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools, Dienste oder
Provider-/Runtime-Hooks ausgeführt werden.

`openclaw plugins list` ist ein lokaler Snapshot von Plugin-Registry/Konfiguration. Ein dort
`enabled` gesetztes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufendes entferntes Gateway-
Kind mit demselben Plugin-Code neu gestartet wurde. In VPS-/Container-Setups mit
Wrapper-Prozessen senden Sie Neustarts an den tatsächlichen `openclaw gateway run`-Prozess
oder verwenden Sie `openclaw gateway restart` gegen den laufenden Gateway.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die die Erkennung nicht gefunden hat.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem es ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die
    zurück auf OpenClaws eigene paketierte gebündelte Plugin-Verzeichnisse zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Wird mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein gebündeltes Plugin-Quellverzeichnis
über den passenden paketierten Quellpfad bind-gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und entdeckt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. So funktionieren Maintainer-Container-
Schleifen weiter, ohne jedes gebündelte Plugin wieder auf TypeScript-Quellcode
umzustellen. Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles
auch dann zu erzwingen, wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Plugin-Discovery-/Ladearbeit
- `plugins.deny` hat immer Vorrang vor `allow`
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins mit Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standard-aktiviert-Menge, sofern sie nicht überschrieben wird
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Runtime
- Veraltete Plugin-Konfiguration bleibt erhalten, solange `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- Codex-Routen der OpenAI-Familie behalten getrennte Plugin-Grenzen bei:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Nebeneffekte oder Hooks
im Live-Chat-Traffic nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass aktive
  Gateway-URL, Profil, Konfigurationspfad und Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation, Konfiguration oder Code neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den untergeordneten
  Prozess `openclaw gateway run` neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Conversation-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Als Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Payloads das
  Gateway mit `--raw-stream --raw-stream-path <path>`.

### Doppelte Channel- oder Tool-Zuständigkeit

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Diese Meldungen bedeuten, dass mehr als ein aktiviertes Plugin versucht, denselben Channel,
Einrichtungsablauf oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Channel-Plugin,
das neben einem gebündelten Plugin installiert ist, das inzwischen dieselbe Channel-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Änderungen an Installation, Registry oder Konfiguration neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Channel-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit der
  niedriger priorisierten Plugin-ID deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anforderung bei und
  meldet den Konflikt. Wählen Sie einen Zuständigen für den Channel aus oder benennen Sie Plugin-eigene
  Tools um, damit die Runtime-Oberfläche eindeutig ist.

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

| Slot            | Was er steuert       | Standard            |
| --------------- | -------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin | `memory-core`       |
| `contextEngine` | Aktive Context Engine | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird nicht zusammen mit `--link` unterstützt, das den Quellpfad wiederverwendet,
statt ein verwaltetes Installationsziel zu überschreiben.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID zu dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID
in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, damit die
explizite Installation nach einem Neustart sofort ladbar ist.

OpenClaw hält eine persistierte lokale Plugin-Registry als Cold-Read-Modell für
Plugin-Inventar, Beitragszuständigkeit und Startplanung. Installations-, Aktualisierungs-,
Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry nach Änderungen am Plugin-
Status. Dieselbe Datei `plugins/installs.json` hält dauerhafte Installationsmetadaten in
`installRecords` auf oberster Ebene und neu aufbaubare Manifestmetadaten in `plugins`. Wenn
die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry
--refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinie und
Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Wird
eine npm-Paketspezifikation mit Dist-Tag oder exakter Version übergeben, wird der Paketname
zurück zum nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für zukünftige Updates gespeichert.
Wird der Paketname ohne Version übergeben, wird eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry verschoben. Wenn das installierte npm-Plugin bereits der
aufgelösten Version und der aufgezeichneten Artefaktidentität entspricht, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Konfiguration umzuschreiben.

`--pin` ist nur für npm. Es wird nicht zusammen mit `--marketplace` unterstützt, da
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist ein Break-Glass-Override für False Positives
des integrierten Scanners für gefährlichen Code. Es erlaubt Plugin-Installationen
und Plugin-Updates trotz integrierter `critical`-Funde fortzufahren, umgeht aber weiterhin
keine Plugin-`before_install`-Richtlinienblöcke oder Scan-Fehler-Blockierung.
Installationsscans ignorieren übliche Testdateien und Verzeichnisse wie `tests/`,
`__tests__/`, `*.test.*` und `*.spec.*`, damit paketierte Test-Mocks nicht blockieren;
deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, selbst wenn sie einen dieser
Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen den passenden `dangerouslyForceUnsafeInstall`-Request-
Override, während `openclaw skills install` der separate ClawHub-
Skill-Download-/Installationsablauf bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan ausgeblendet oder blockiert ist, öffnen Sie das
ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub um eine erneute Prüfung
zu bitten. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen auf Ihrem eigenen
Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder eine blockierte Veröffentlichung
öffentlich zu machen.

Kompatible Bundles nehmen am selben Plugin-Listen-/Inspect-/Enable-/Disable-
Ablauf teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude Command-Skills,
Claude-`settings.json`-Standardwerte, Claude-`.lsp.json`- und im Manifest deklarierte
`lspServers`-Standardwerte, Cursor Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
`marketplace.json`-Pfad, ein GitHub-Kürzel wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Für Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Siehe [`openclaw plugins` CLI-Referenz](/de/cli/plugins) für vollständige Details.

## Plugin-API-Überblick

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, neue Plugins sollten
jedoch `register` verwenden.

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

OpenClaw lädt das Entry-Objekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag betrachten.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-Aktivierung. Registriert Tools, Hooks, Dienste, Befehle, Routen und andere aktive Seiteneffekte.                                 |
| `discovery`     | Schreibgeschützte Capability-Erkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Einstiegscode kann geladen werden, aber aktive Seiteneffekte werden übersprungen. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen schlanken Setup-Einstieg.                                                                    |
| `setup-runtime` | Laden des Channel-Setups, das zusätzlich den Runtime-Einstieg benötigt.                                                                   |
| `cli-metadata`  | Nur Erfassung von CLI-Befehlsmetadaten.                                                                                                  |

Plugin-Einträge, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Seiteneffekte mit `api.registrationMode === "full"`
absichern. Discovery-Ladevorgänge werden getrennt von aktivierenden Ladevorgängen
zwischengespeichert und ersetzen nicht die laufende Gateway-Registry. Discovery
aktiviert nicht, ist aber nicht importfrei: OpenClaw kann den vertrauenswürdigen
Plugin-Eintrag oder das Channel-Plugin-Modul auswerten, um den Snapshot zu
erstellen. Halten Sie Modul-Top-Level schlank und frei von Seiteneffekten, und
verschieben Sie Netzwerk-Clients, Unterprozesse, Listener, das Lesen von
Zugangsdaten und den Dienststart hinter Full-Runtime-Pfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was registriert wird        |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)       |
| `registerChannel`                       | Chat-Channel                |
| `registerTool`                          | Agent-Tool                  |
| `registerHook` / `on(...)`              | Lifecycle-Hooks             |
| `registerSpeechProvider`                | Text-to-Speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming-STT               |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme       |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse          |
| `registerImageGenerationProvider`       | Bilderzeugung               |
| `registerMusicGenerationProvider`       | Musikerzeugung              |
| `registerVideoGenerationProvider`       | Videoerzeugung              |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider  |
| `registerWebSearchProvider`             | Websuche                    |
| `registerHttpRoute`                     | HTTP-Endpunkt               |
| `registerCommand` / `registerCli`       | CLI-Befehle                 |
| `registerContextEngine`                 | Kontext-Engine              |
| `registerService`                       | Hintergrunddienst           |

Guard-Verhalten von Hooks für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keinen früheren Block auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt keinen früheren Block auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keinen früheren Abbruch auf.

Native Codex-App-Server-Läufe leiten Codex-native Tool-Events zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call`
blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt Argumente
Codex-nativer Tools derzeit noch nicht um. Die genaue Grenze der Codex-Runtime-
Unterstützung ist im
[Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract) beschrieben.

Das vollständige Verhalten typisierter Hooks finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — erstellen Sie Ihr eigenes Plugin
- [Plugin-Bundles](/de/plugins/bundles) — Bundle-Kompatibilität mit Codex/Claude/Cursor
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Capability-Modell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Drittanbieter-Listings
