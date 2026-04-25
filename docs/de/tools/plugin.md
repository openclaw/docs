---
read_when:
    - Plugins installieren oder konfigurieren
    - Verstehen von Plugin-Erkennung und Laderegeln
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-25T13:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Stimme, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Web-
Suche und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert), andere
sind **external** (von der Community auf npm veröffentlicht).

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

Wenn Sie eine chatnative Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizit
`clawhub:<pkg>` oder eine reine Paketspezifikation (zuerst ClawHub, dann npm als Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise im geschlossenen Zustand fehl und verweist auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Pfad zur Neuinstallation gebündelter Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren nicht vorab den gesamten
Runtime-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes, OpenClaw-eigenes Plugin aus
der Plugin-Konfiguration, einer veralteten Channel-Konfiguration oder einem standardmäßig aktivierten Manifest aktiv ist,
repariert der Start nur die deklarierten Runtime-Abhängigkeiten dieses Plugins, bevor es importiert wird.
Explizites Deaktivieren hat weiterhin Vorrang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` und `channels.<id>.enabled: false`
verhindern die automatische Reparatur gebündelter Runtime-Abhängigkeiten für dieses Plugin bzw. diesen Channel.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Wie es funktioniert                                              | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt | Offizielle Plugins, npm-Pakete aus der Community       |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                  | Dokumentation                        |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/de/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/de/plugins/zalouser)   |

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
    - `memory-lancedb` — bedarfsweise installierter Langzeitspeicher mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstige">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Runtime und den Standarddienst zur Browser-Steuerung (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy Bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Suchen Sie Plugins von Drittanbietern? Siehe [Community Plugins](/de/plugins/community).

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
| `enabled`        | Master-Schalter (Standard: `true`)                       |
| `allow`          | Plugin-Zulassungsliste (optional)                        |
| `deny`           | Plugin-Verweigerungsliste (optional; Verweigern gewinnt) |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                |
| `slots`          | Exklusive Slot-Auswahlen (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Umschalter + Konfiguration pro Plugin                    |

Konfigurationsänderungen **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurations-
Überwachung und prozessinternem Neustart aktiviert läuft (der Standardpfad `openclaw gateway`),
wird dieser Neustart normalerweise kurz nach dem Schreiben der Konfiguration automatisch ausgeführt.
Es gibt keinen unterstützten Hot-Reload-Pfad für nativen Plugin-Runtime-Code oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Channel bedient, bevor Sie erwarten,
dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools, Dienste oder
Provider-/Runtime-Hooks ausgeführt werden.

`openclaw plugins list` ist ein lokaler CLI-/Konfigurations-Snapshot. Ein `loaded`-Plugin dort
bedeutet, dass das Plugin aus der Konfiguration/den Dateien erkennbar und ladbar ist, die dieser
CLI-Aufruf sieht. Es beweist nicht, dass ein bereits laufender entfernter Gateway-Kindprozess
mit demselben Plugin-Code neu gestartet wurde. In VPS-/Container-Setups mit Wrapper-
Prozessen senden Sie Neustarts an den tatsächlichen Prozess `openclaw gateway run`, oder verwenden
Sie `openclaw gateway restart` gegen das laufende Gateway.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die von der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Erkennung und Vorrang

OpenClaw sucht Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade.
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

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor `allow`
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standardmenge für Aktivierung, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Runtime
- Codex-Routen der OpenAI-Familie behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin über `embeddedHarness.runtime: "codex"` oder veraltete
  Modellreferenzen `codex/*` ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber Seiteneffekte oder Hooks von `register(api)`
nicht im Live-Chat-Traffic ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess die sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Plugin-Installations-/Konfigurations-/Codeänderungen neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den Kindprozess
  `openclaw gateway run` neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Als Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Oberflächen für Sitzung/Status und starten Sie beim Debugging von Provider-Nutzlasten
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine ist gleichzeitig aktiv):

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
| `contextEngine` | Aktive Context-Engine  | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # ausführliche Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellarische Gesamtübersicht
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # bestehende Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # verlinken (ohne Kopie) für die Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakte aufgelöste npm-Spezifikation speichern
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # ein Plugin aktualisieren
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # alle aktualisieren
openclaw plugins uninstall <id>          # Konfigurations-/Installationsdatensätze entfernen
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein bereits installiertes Plugin oder Hook-Pack direkt vor Ort. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades verfolgter npm-
Plugins. Es wird mit `--link` nicht unterstützt, da hierbei der Quellpfad wiederverwendet wird,
anstatt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
ID des installierten Plugins dieser Zulassungsliste hinzu, bevor es aktiviert wird, sodass Installationen
nach dem Neustart sofort ladbar sind.

`openclaw plugins update <id-or-npm-spec>` gilt für verfolgte Installationen. Wenn
eine npm-Paketspezifikation mit Dist-Tag oder exakter Version übergeben wird, wird der Paketname
zurück auf den verfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für künftige Updates gespeichert.
Wird der Paketname ohne Versionsangabe übergeben, wird eine exakt angeheftete Installation zurück auf
die Standard-Release-Linie der Registry verschoben. Wenn das installierte npm-Plugin bereits
der aufgelösten Version und der gespeicherten Artefaktidentität entspricht, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben.

`--pin` gilt nur für npm. Es wird mit `--marketplace` nicht unterstützt, da
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Notfall-Überschreibung für Fehlalarme
des integrierten Dangerous-Code-Scanners. Damit können Plugin-Installationen
und Plugin-Updates trotz integrierter `critical`-Befunde fortgesetzt werden, aber es
umgeht weiterhin keine `before_install`-Policy-Blockierungen von Plugins und keine Blockierung bei Scan-Fehlern.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte
Installationen von Skill-Abhängigkeiten verwenden stattdessen die entsprechende Request-Überschreibung `dangerouslyForceUnsafeInstall`,
während `openclaw skills install` weiterhin der separate ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für plugin list/inspect/enable/disable teil.
Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehls-Skills,
Claude-Standardeinstellungen aus `settings.json`, Claude-Standardeinstellungen aus `.lsp.json` und manifestdeklarierte
`lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für bundlegestützte Plugins.

Marketplace-Quellen können ein Claude-Bekannt-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokales Marketplace-Root oder ein
Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [CLI-Referenz zu `openclaw plugins`](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als veralteten Alias verwenden, aber neue Plugins sollten
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
| `full`          | Runtime-Aktivierung. Registriert Tools, Hooks, Dienste, Befehle, Routen und andere Live-Nebeneffekte.                                |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code darf laden, aber Live-Nebeneffekte werden übersprungen. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen leichtgewichtigen Setup-Entry.                                                           |
| `setup-runtime` | Laden des Channel-Setups, das auch den Runtime-Entry benötigt.                                                                        |
| `cli-metadata`  | Nur Erfassung von CLI-Befehlsmetadaten.                                                                                               |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` absichern.
Discovery-Ladevorgänge werden getrennt von aktivierenden Ladevorgängen zwischengespeichert und ersetzen
nicht die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber auch nicht importfrei:
OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Channel-Plugin-Modul auswerten, um
den Snapshot zu erstellen. Halten Sie Module auf Top-Level leichtgewichtig und frei von Nebeneffekten, und verlagern Sie
Netzwerk-Clients, Unterprozesse, Listener, das Lesen von Zugangsdaten und den Dienststart
hinter vollständige Runtime-Pfade.

Häufige Registrierungsmethoden:

| Methode                                 | Was registriert wird        |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)       |
| `registerChannel`                       | Chat-Channel                |
| `registerTool`                          | Agent-Tool                  |
| `registerHook` / `on(...)`              | Lifecycle-Hooks             |
| `registerSpeechProvider`                | Text-to-Speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming-STT               |
| `registerRealtimeVoiceProvider`         | Bidirektionale Echtzeit-Stimme |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse          |
| `registerImageGenerationProvider`       | Bildgenerierung             |
| `registerMusicGenerationProvider`       | Musikgenerierung            |
| `registerVideoGenerationProvider`       | Videogenerierung            |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider  |
| `registerWebSearchProvider`             | Websuche                    |
| `registerHttpRoute`                     | HTTP-Endpunkt               |
| `registerCommand` / `registerCli`       | CLI-Befehle                 |
| `registerContextEngine`                 | Context-Engine              |
| `registerService`                       | Hintergrunddienst           |

Schutzverhalten von Hooks für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist endgültig; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` hat keine Wirkung und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist endgültig; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` hat keine Wirkung und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist endgültig; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` hat keine Wirkung und hebt ein früheres Cancel nicht auf.

Native Codex-App-Server führen Codex-native Tool-Ereignisse zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren,
Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Freigaben teilnehmen. Die Bridge schreibt Codex-native Tool-
Argumente derzeit noch nicht um. Die genaue Grenze der Codex-Runtime-Unterstützung steht im
[Codex harness v1 support contract](/de/plugins/codex-harness#v1-support-contract).

Vollständiges typisiertes Hook-Verhalten finden Sie in der [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Zugehörig

- [Plugins erstellen](/de/plugins/building-plugins) — eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Listings von Drittanbietern
