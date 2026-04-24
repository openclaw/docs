---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-24T09:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Capabilities: Channels, Modell-Provider,
Agent-Harnesses, Tools, Skills, Speech, Echtzeit-Transkription, Echtzeit-Stimme,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch, Web-Search
und mehr. Einige Plugins sind **core** (mit OpenClaw ausgeliefert), andere
sind **extern** (von der Community auf npm veröffentlicht).

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

    Konfigurieren Sie es dann unter `plugins.entries.\<id\>.config` in Ihrer Config-Datei.

  </Step>
</Steps>

Wenn Sie chatnative Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>` oder bloße Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Config ungültig ist, schlägt die Installation normalerweise kontrolliert fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad
für gebündelte Plugins, der für Plugins gilt, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren den gesamten Runtime-Abhängigkeitsbaum jedes gebündelten Plugins nicht vorab. Wenn ein gebündeltes OpenClaw-eigenes Plugin durch
die Plugin-Config, veraltete Channel-Config oder ein standardmäßig aktiviertes Manifest aktiv ist,
repariert der Start nur die deklarierten Runtime-Abhängigkeiten dieses Plugins, bevor es importiert wird.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin mit
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                  | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt | Offizielle Plugins, npm-Pakete der Community          |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Features abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Building Plugins](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                         |
| --------------- | --------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams)  |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)    |
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
    - `memory-lancedb` — Long-Term Memory mit Install-on-Demand und automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Runtime und den Standarddienst zur Browser-Steuerung (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
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

| Feld             | Beschreibung                                             |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                         |
| `allow`          | Allowlist für Plugins (optional)                         |
| `deny`           | Denylist für Plugins (optional; deny gewinnt)            |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Config                     |

Änderungen an der Config **erfordern einen Neustart des Gateway**. Wenn das Gateway mit Config-Watch + In-Process-Neustart ausgeführt wird (der Standardpfad `openclaw gateway`),
wird dieser Neustart normalerweise automatisch kurz nach dem Schreiben der Config durchgeführt.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Das Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Config bleibt erhalten.
  - **Fehlend**: Die Config verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Das Plugin existiert, aber seine Config stimmt nicht mit dem deklarierten Schema überein.
</Accordion>

## Erkennung und Vorrang

OpenClaw durchsucht Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Config-Pfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` gewinnt immer gegenüber allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der eingebauten standardmäßig aktivierten Menge, sofern sie nicht überschrieben wird
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsweise aktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Config eine plugin-eigene Oberfläche benennt,
  zum Beispiel eine Modellreferenz eines Providers, eine Channel-Config oder eine Harness-Runtime
- OpenAI-Family-Codex-Routen behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `embeddedHarness.runtime: "codex"` oder veraltete
  Modellreferenzen `codex/*` ausgewählt wird

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (jeweils nur eine aktiv):

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

| Slot            | Steuert was              | Standard            |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Active Memory Plugin     | `memory-core`       |
| `contextEngine` | Aktive Context Engine    | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # ausführliche Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # Tabelle für die gesamte Flotte
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # bestehende Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # verlinken (ohne Kopie) für Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakt aufgelöste npm-Spezifikation speichern
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # ein Plugin aktualisieren
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # alle aktualisieren
openclaw plugins uninstall <id>          # Config-/Installationsdatensätze entfernen
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt vor Ort. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird mit `--link` nicht unterstützt, da dabei der Quellpfad wiederverwendet wird,
anstatt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor sie aktiviert wird, sodass Installationen
sofort nach dem Neustart ladbar sind.

`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Die Übergabe
einer npm-Paketspezifikation mit Dist-Tag oder exakter Version löst den Paketnamen
zurück auf den nachverfolgten Plugin-Datensatz auf und speichert die neue Spezifikation für künftige Updates.
Die Übergabe des Paketnamens ohne Version verschiebt eine exakt angeheftete Installation wieder zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits mit der aufgelösten Version
und der gespeicherten Artefaktidentität übereinstimmt, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Config neu zu schreiben.

`--pin` gilt nur für npm. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Metadaten zur Marketplace-Quelle statt einer npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für False Positives des integrierten Scanners für gefährlichen Code. Damit können Plugin-Installationen
und Plugin-Updates trotz integrierter `critical`-Findings fortgesetzt werden, aber
es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblöcke oder die Blockierung bei Scan-Fehlschlägen.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden stattdessen die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate Download-/Installationsablauf für ClawHub-Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für `list`/`inspect`/`enable`/`disable`
von Plugins teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Command-Skills,
Claude-`settings.json`-Standards, Claude-`.lsp.json` und manifestdeklarierte
Standardwerte für `lspServers`, Cursor-Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Capabilities sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
`marketplace.json`-Pfad, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repo-
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

OpenClaw lädt das Entry-Objekt und ruft `register(api)` bei der Plugin-
Aktivierung auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

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
| `registerImageGenerationProvider`       | Bildgenerierung             |
| `registerMusicGenerationProvider`       | Musikgenerierung            |
| `registerVideoGenerationProvider`       | Videogenerierung            |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider  |
| `registerWebSearchProvider`             | Web-Search                  |
| `registerHttpRoute`                     | HTTP-Endpunkt               |
| `registerCommand` / `registerCli`       | CLI-Befehle                 |
| `registerContextEngine`                 | Context Engine              |
| `registerService`                       | Hintergrunddienst           |

Verhalten von Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` hat keine Wirkung und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` hat keine Wirkung und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` hat keine Wirkung und hebt ein früheres Cancel nicht auf.

Das vollständige Verhalten typisierter Hooks finden Sie unter [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
- [Registering Tools](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin Internals](/de/plugins/architecture) — Capability-Modell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Auflistungen von Drittanbietern
