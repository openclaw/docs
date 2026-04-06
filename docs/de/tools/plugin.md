---
read_when:
    - Plugins installieren oder konfigurieren
    - Die Regeln für Plugin-Discovery und Laden verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-06T03:13:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2472a3023f3c1c6ee05b0cdc228f6b713cc226a08695b327de8a3ad6973c83
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-Stimme,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch, Web-
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

Wenn Sie eine Chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizit
`clawhub:<pkg>` oder nackte Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise fehlgeschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Ausnahme für die Wiederherstellung ist ein eng begrenzter Reinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                  | Beispiele                                              |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, npm-Pakete aus der Community       |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide werden unter `openclaw plugins list` angezeigt. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Building Plugins](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Docs                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/de/plugins/zalouser)   |

### Core (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Speicher-Plugins">
    - `memory-core` — gebündelte Speichersuche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — bei Bedarf installierbarer Langzeitspeicher mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Andere">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den Standarddienst für Browser-Steuerung (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Suchen Sie nach Drittanbieter-Plugins? Siehe [Community Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld             | Beschreibung                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                          |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; deny gewinnt)                  |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration               |

Änderungen an der Konfiguration **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurations-
Watch + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.

<Accordion title="Plugin-Status: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Das Plugin existiert, aber Aktivierungsregeln haben es abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die von der Discovery nicht gefunden wurde.
  - **Ungültig**: Das Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Discovery und Priorität

OpenClaw scannt nach Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade.
  </Step>

  <Step title="Workspace-Erweiterungen">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Erweiterungen">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` gewinnt immer gegenüber allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der eingebauten Standardmenge „on“, sofern nicht überschrieben
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsaktivieren

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine kann gleichzeitig aktiv sein):

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
| `memory`        | Aktives Speicher-Plugin | `memory-core`       |
| `contextEngine` | Aktive Context-Engine  | `legacy` (eingebaut) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellenweite Übersicht
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnostik

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur von ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # von lokalem Pfad installieren
openclaw plugins install -l <path>         # für Entwicklung verlinken (ohne Kopie)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakt aufgelöste npm-Spezifikation aufzeichnen
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # ein Plugin aktualisieren
openclaw plugins update <id> --dangerously-force-unsafe-install
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

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack an Ort und Stelle.
Es wird nicht mit `--link` unterstützt, das den Quellpfad wiederverwendet, statt
über ein verwaltetes Installationsziel zu kopieren.

`--pin` gilt nur für npm. Es wird nicht mit `--marketplace` unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für False Positives
des eingebauten Scanners für gefährlichen Code. Es erlaubt, dass Plugin-Installationen
und Plugin-Aktualisierungen trotz eingebauter `critical`-Befunde fortgesetzt werden, umgeht aber weiterhin nicht Plugin-`before_install`-Policy-Blöcke oder die Blockierung bei fehlgeschlagenem Scan.

Dieses CLI-Flag gilt nur für Installations-/Aktualisierungsabläufe von Plugins. Gateway-gestützte Installationen von Skill-
Abhängigkeiten verwenden stattdessen die entsprechende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für `plugin list`/`inspect`/`enable`/`disable`
teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Befehlsskills,
Claude-Standards aus `settings.json`, Claude-Standards aus `.lsp.json` und manifestdeklarierte
`lspServers`, Cursor-Befehlsskills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Name eines bekannten Marketplace aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Stamm oder
ein Pfad `marketplace.json`, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repo-
URL oder eine git-URL sein. Für Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repositorys bleiben und dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins` CLI-Referenz](/cli/plugins).

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
Aktivierung auf. Der Loader greift für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

| Methode                                 | Was sie registriert         |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)       |
| `registerChannel`                       | Chat-Kanal                  |
| `registerTool`                          | Agent-Tool                  |
| `registerHook` / `on(...)`              | Lifecycle-Hooks             |
| `registerSpeechProvider`                | Text-to-Speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming-STT               |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeit-Stimme      |
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

Verhalten von Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt einen früheren Cancel nicht auf.

Vollständiges Verhalten typisierter Hooks finden Sie unter [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
- [Registering Tools](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin Internals](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Listen von Drittanbietern
