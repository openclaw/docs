---
read_when:
    - Plugins installieren oder konfigurieren
    - Discovery- und Laderegeln für Plugins verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Stimme, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Web-
Suche und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert), andere
sind **external** (werden von der Community auf npm veröffentlicht).

## Schnellstart

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # Von npm
    openclaw plugins install @openclaw/voice-call

    # Aus einem lokalen Verzeichnis oder Archiv
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Das Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie es dann unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>
</Steps>

Wenn Sie native Steuerung per Chat bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler
Pfad/Archiv, explizites `clawhub:<pkg>` oder bloße Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise kontrolliert fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein eng begrenzter
Neuinstallationspfad für gebündelte Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

Paketierte OpenClaw-Installationen installieren nicht eager den gesamten
Laufzeit-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes OpenClaw-eigenes Plugin aus
der Plugin-Konfiguration, älterer Kanalkonfiguration oder einem standardmäßig aktivierten Manifest aktiv ist,
repariert der Start nur die deklarierten Laufzeitabhängigkeiten dieses Plugins, bevor es importiert wird.
Persistierter Kanal-Authentifizierungszustand allein aktiviert einen gebündelten Kanal nicht für die Reparatur
von Laufzeitabhängigkeiten beim Gateway-Start.
Explizites Deaktivieren hat weiterhin Vorrang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` und `channels.<id>.enabled: false`
verhindern die automatische Reparatur gebündelter Laufzeitabhängigkeiten für dieses Plugin/diesen Kanal.
Eine nicht leere `plugins.allow` begrenzt ebenfalls die Reparatur standardmäßig aktivierter gebündelter Laufzeitabhängigkeiten;
explizite Aktivierung gebündelter Kanäle (`channels.<id>.enabled: true`) kann
die Abhängigkeiten des Plugins dieses Kanals dennoch reparieren.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin mit
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                      | Beispiele                                              |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt  | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide werden unter `openclaw plugins list` angezeigt. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json` deklarieren.
Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu einer lesbaren
Laufzeitdatei aufgelöst werden oder zu einer TypeScript-Quelldatei mit einem abgeleiteten
gebauten JavaScript-Gegenstück wie `src/index.ts` zu `dist/index.js`.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien nicht unter denselben
Pfaden liegen wie die Quell-Einträge. Falls vorhanden, muss `runtimeExtensions`
genau einen Eintrag für jeden `extensions`-Eintrag enthalten. Nicht übereinstimmende Listen lassen Installation und
Plugin-Discovery fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen.

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

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                         |
| --------------- | --------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams)  |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/de/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/de/plugins/zalouser)    |

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
    - `memory-lancedb` — bei Bedarf installierbarer Langzeitspeicher mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Weitere">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den Standard-Browser-Control-Service (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy Bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Suchen Sie nach Plugins von Drittanbietern? Siehe [Community Plugins](/de/plugins/community).

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

| Feld             | Beschreibung                                            |
| ---------------- | ------------------------------------------------------- |
| `enabled`        | Master-Schalter (Standard: `true`)                      |
| `allow`          | Plugin-Allowlist (optional)                             |
| `deny`           | Plugin-Denylist (optional; deny hat Vorrang)            |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse               |
| `slots`          | Selektoren für exklusive Slots (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schalter + Konfiguration pro Plugin                     |

Änderungen an der Konfiguration **erfordern einen Gateway-Neustart**. Wenn das Gateway mit
Konfigurationsüberwachung + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`),
wird dieser Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.
Es gibt keinen unterstützten Hot-Reload-Pfad für nativen Plugin-Laufzeitcode oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Kanal bedient, bevor Sie
erwarten, dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools, Services oder
Provider-/Laufzeit-Hooks ausgeführt werden.

`openclaw plugins list` ist ein lokaler Snapshot von Plugin-Registry/Konfiguration. Ein
dort als `enabled` markiertes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufender entfernter Gateway-
Child in denselben Plugin-Code neu gestartet wurde. In VPS-/Container-Setups mit
Wrapper-Prozessen senden Sie Neustarts an den tatsächlichen Prozess `openclaw gateway run`,
oder verwenden Sie `openclaw gateway restart` für das laufende Gateway.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die Discovery nicht gefunden hat.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Discovery und Priorität

OpenClaw durchsucht Plugins in dieser Reihenfolge (erste Übereinstimmung gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die
    zurück auf die eigenen paketierten gebündelten Plugin-Verzeichnisse von OpenClaw zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten Baum `dist/extensions` auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den entsprechenden paketierten Quellpfad bind-gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und entdeckt es vor dem paketierten
Bundle `/app/dist/extensions/synology-chat`. Dadurch bleiben Container-Schleifen für Maintainer
funktionsfähig, ohne jedes gebündelte Plugin wieder auf TypeScript-Quellcode umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
auch wenn Source-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins mit Ursprung im Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standardmenge mit Default-on, sofern nicht überschrieben
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsweise aktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Kanalkonfiguration oder Harness-
  Laufzeit
- OpenAI-Familien-Codex-Routen behalten separate Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin über `agentRuntime.id: "codex"` oder ältere
  Modellreferenzen `codex/*` ausgewählt wird

## Fehlerbehebung bei Laufzeit-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber Nebeneffekte von `register(api)` oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess die sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Plugin-Installations-/Konfigurations-/Code-Änderungen neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den Child-
  Prozess `openclaw gateway run` neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellumschaltung bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Für einen Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Status-Oberflächen und starten Sie beim Debuggen von Provider-Payloads
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

### Doppelte Zuständigkeit für Kanal oder Tool

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dies bedeutet, dass mehr als ein aktiviertes Plugin versucht, denselben Kanal,
denselben Setup-Ablauf oder denselben Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Kanal-Plugin,
das neben einem gebündelten Plugin installiert wurde, das jetzt dieselbe Kanal-ID bereitstellt.

Schritte zum Debuggen:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung anzuzeigen.
- Führen Sie `openclaw plugins inspect <id> --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten den aktuellen Installationszustand widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Optionen zur Behebung:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Kanal-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit
  der Plugin-ID niedrigerer Priorität deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich entstanden ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anforderung bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Kanal oder benennen Sie plugin-eigene
  Tools um, damit die Laufzeitoberfläche eindeutig bleibt.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (jeweils nur eine gleichzeitig aktiv):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oder "none" zum Deaktivieren
      contextEngine: "legacy", // oder eine Plugin-ID
    },
  },
}
```

| Slot            | Was er steuert         | Standard            |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Aktives Memory-Plugin  | `memory-core`       |
| `contextEngine` | Aktive Context Engine  | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur aktivierte Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellarische Übersicht des gesamten Bestands
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen
openclaw plugins registry                  # persistierten Zustand der Registry prüfen
openclaw plugins registry --refresh        # persistierte Registry neu aufbauen
openclaw doctor --fix                      # Zustand der Plugin-Registry reparieren

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # verlinken (ohne Kopie) für Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakt aufgelöste npm-Spezifikation speichern
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # ein Plugin aktualisieren
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # alle aktualisieren
openclaw plugins uninstall <id>          # Konfiguration und Plugin-Index-Einträge entfernen
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Paket direkt. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für reguläre Upgrades verfolgter npm-
Plugins. Es wird mit `--link` nicht unterstützt, da dabei der Quellpfad wiederverwendet wird,
anstatt in ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID
in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, damit das
explizit installierte Plugin nach dem Neustart sofort geladen werden kann.

OpenClaw verwaltet eine persistierte lokale Plugin-Registry als Cold-Read-Modell für
Plugin-Inventar, Zuständigkeit von Beiträgen und Startplanung. Installations-, Aktualisierungs-,
Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry nach Änderungen am Plugin-
Zustand. Dieselbe Datei `plugins/installs.json` speichert dauerhafte Installationsmetadaten in
`installRecords` auf oberster Ebene und rekonstruierbare Manifest-Metadaten in `plugins`. Wenn
die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry
--refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinie und
Manifest-/Paket-Metadaten neu auf, ohne Laufzeitmodule von Plugins zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für verfolgte Installationen. Die Übergabe
einer npm-Paketspezifikation mit Dist-Tag oder exakter Version löst den Paketnamen
zurück auf den verfolgten Plugin-Datensatz auf und speichert die neue Spezifikation für künftige Aktualisierungen.
Die Übergabe des Paketnamens ohne Version verschiebt eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits mit
der aufgelösten Version und der gespeicherten Artefaktidentität übereinstimmt, überspringt OpenClaw die Aktualisierung,
ohne herunterzuladen, neu zu installieren oder die Konfiguration umzuschreiben.

`--pin` ist nur für npm. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist ein Break-Glass-Override für falsch positive Treffer
des integrierten Scanners für gefährlichen Code. Es erlaubt Plugin-Installationen
und Plugin-Aktualisierungen, trotz integrierter `critical`-Befunde fortzufahren, umgeht aber
weiterhin keine `before_install`-Richtlinienblöcke von Plugins oder die Blockierung durch Scan-Fehler.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Installationen
von Skill-Abhängigkeiten verwenden stattdessen das passende Request-Override
`dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-
Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für `plugins list`/`inspect`/`enable`/`disable`
teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude Command-Skills,
Claude-Standards aus `settings.json`, Claude-Standards aus `.lsp.json` und manifestdeklarierten
`lspServers`, Cursor-Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
Pfad zu `marketplace.json`, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der CLI-Referenz [`openclaw plugins`](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als älteren Alias verwenden, aber neue Plugins sollten
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

OpenClaw lädt das Entry-Objekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Laufzeitaktivierung. Registrieren Sie Tools, Hooks, Services, Befehle, Routen und andere Live-Nebeneffekte.                         |
| `discovery`     | Schreibgeschützte Discovery von Fähigkeiten. Registrieren Sie Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code darf geladen werden, aber überspringen Sie Live-Nebeneffekte. |
| `setup-only`    | Laden von Kanal-Setup-Metadaten über einen leichtgewichtigen Setup-Einstiegspunkt.                                                  |
| `setup-runtime` | Laden von Kanal-Setup, das zusätzlich den Laufzeit-Entry benötigt.                                                                   |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                               |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` absichern.
Discovery-Ladevorgänge werden getrennt von aktivierenden Ladevorgängen gecacht und ersetzen
nicht die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber auch nicht importfrei:
OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Kanal-Plugin-Modul auswerten, um
den Snapshot zu erstellen. Halten Sie Module auf oberster Ebene leichtgewichtig und frei von Nebeneffekten und verschieben Sie
Netzwerk-Clients, Subprozesse, Listener, das Lesen von Anmeldedaten und den Start von Services
hinter Pfade für vollständige Laufzeit.

Gängige Registrierungsmethoden:

| Methode                                 | Was registriert wird          |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)         |
| `registerChannel`                       | Chat-Kanal                    |
| `registerTool`                          | Agent-Tool                    |
| `registerHook` / `on(...)`              | Lifecycle-Hooks               |
| `registerSpeechProvider`                | Text-to-Speech / STT          |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                 |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeit-Stimme        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse            |
| `registerImageGenerationProvider`       | Bildgenerierung               |
| `registerMusicGenerationProvider`       | Musikgenerierung              |
| `registerVideoGenerationProvider`       | Videogenerierung              |
| `registerWebFetchProvider`              | Provider für Web-Abruf / Scraping |
| `registerWebSearchProvider`             | Web-Suche                     |
| `registerHttpRoute`                     | HTTP-Endpunkt                 |
| `registerCommand` / `registerCli`       | CLI-Befehle                   |
| `registerContextEngine`                 | Context Engine                |
| `registerService`                       | Hintergrunddienst             |

Verhalten der Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt eine frühere Abbruchentscheidung nicht auf.

Native Codex-App-Server-Ausführungen spiegeln Codex-native Tool-Ereignisse zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren,
Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt Codex-native Tool-
Argumente derzeit noch nicht um. Die genaue Support-Grenze der Codex-Laufzeit befindet sich im
[Support-Vertrag für Codex Harness v1](/de/plugins/codex-harness#v1-support-contract).

Das vollständige Verhalten typisierter Hooks finden Sie unter [SDK overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Listings von Drittanbietern
