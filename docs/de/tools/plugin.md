---
read_when:
    - Plugins installieren oder konfigurieren
    - Informationen zur Plugin-Erkennung und zu Ladevorgaben
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modellanbieter,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Spracheingabe, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Web-
Suche und mehr. Einige Plugins sind **Core** (mit OpenClaw ausgeliefert), andere
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

    Konfigurieren Sie es anschließend unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>
</Steps>

Wenn Sie eine chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler
Pfad/Archiv, explizit `clawhub:<pkg>` oder eine reine Paketspezifikation (zuerst ClawHub, dann npm als Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise
geschlossen fehl und verweist Sie auf `openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein eng begrenzter Neuinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren nicht vorab den gesamten
Runtime-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes
OpenClaw-eigenes Plugin durch die Plugin-Konfiguration, eine ältere Kanalkonfiguration oder ein standardmäßig aktiviertes Manifest aktiv ist,
repariert der Start nur die deklarierten Runtime-Abhängigkeiten dieses Plugins, bevor es importiert wird.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativ**  | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete              |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide werden unter `openclaw plugins list` angezeigt. Einzelheiten zu Bundles finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                  | Dokumentation                       |
| --------------- | ---------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/de/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/de/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/de/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/de/plugins/zalouser)  |

### Core (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modellanbieter (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — bei Bedarf installierbarer Langzeitspeicher mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Sprachanbieter (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstige">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die `browser.request`-Gateway-Methode, die Browser-Runtime und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)
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

| Feld             | Beschreibung                                             |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                         |
| `allow`          | Plugin-Allowlist (optional)                              |
| `deny`           | Plugin-Denylist (optional; deny hat Vorrang)             |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                |
| `slots`          | Exklusive Slot-Auswahlen (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration              |

Änderungen an der Konfiguration **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurationsüberwachung und prozessinternem Neustart aktiviert ausgeführt wird
(der Standardpfad `openclaw gateway`), wird dieser
Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.
Es gibt keinen unterstützten Hot-Reload-Pfad für nativen Plugin-Runtime-Code oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Kanal bedient,
bevor Sie erwarten, dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools, Dienste oder
Anbieter-/Runtime-Hooks ausgeführt werden.

`openclaw plugins list` ist eine lokale CLI-/Konfigurationsaufnahme. Ein
dort als `loaded` angezeigtes Plugin bedeutet, dass das Plugin durch die Konfiguration/Dateien erkennbar und ladbar ist, die diese
CLI-Ausführung sieht. Es beweist nicht, dass ein bereits laufender entfernter Gateway-Unterprozess
mit demselben Plugin-Code neu gestartet wurde. Auf VPS-/Container-Setups mit Wrapper-
Prozessen senden Sie Neustarts an den tatsächlichen Prozess `openclaw gateway run`, oder verwenden
Sie `openclaw gateway restart` gegen das laufende Gateway.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Erkennung und Vorrang

OpenClaw scannt nach Plugins in dieser Reihenfolge (erster Treffer gewinnt):

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
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modellanbieter, Sprache).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standard-Aktivierung, sofern sie nicht überschrieben wird
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, z. B. eine Anbieter-Modellreferenz, Kanalkonfiguration oder Harness-
  Runtime
- OpenAI-Familien-Codex-Routen behalten separate Plugin-Grenzen bei:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `embeddedHarness.runtime: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Seiteneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess die sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation/Konfiguration/Code neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den Kindprozess
  `openclaw gateway run` neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es wird vor der Modellauflösung für Agent-Turns ausgeführt; `llm_output` läuft erst, nachdem ein Modellversuch
  eine Assistentenausgabe erzeugt hat.
- Als Nachweis für das effektive Sitzungsmodell verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Anbieter-Payloads
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

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

| Slot            | Was er steuert          | Standard            |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory Plugin    | `memory-core`       |
| `contextEngine` | Aktive Kontext-Engine   | `legacy` (integriert) |

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
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # für Entwicklung verknüpfen (ohne Kopie)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakte aufgelöste npm-Spezifikation aufzeichnen
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
gebündelte Modellanbieter, gebündelte Sprachanbieter und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein bereits installiertes Plugin oder Hook-Pack direkt vor Ort. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades verfolgter npm-
Plugins. Es wird mit `--link` nicht unterstützt, das den Quellpfad wiederverwendet,
anstatt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
ID des installierten Plugins zu dieser Allowlist hinzu, bevor es aktiviert wird, sodass Installationen
nach einem Neustart sofort ladbar sind.

`openclaw plugins update <id-or-npm-spec>` gilt für verfolgte Installationen. Die Übergabe
einer npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version löst den Paketnamen
zurück zum verfolgten Plugin-Datensatz auf und zeichnet die neue Spezifikation für zukünftige Updates auf.
Die Übergabe des Paketnamens ohne Version verschiebt eine exakt angeheftete Installation zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits mit der
aufgelösten Version und der aufgezeichneten Artefaktidentität übereinstimmt, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben.

`--pin` gilt nur für npm. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten anstelle einer npm-Spezifikation beibehalten.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für Fehlalarme
des integrierten Scanners für gefährlichen Code. Es erlaubt, dass Plugin-Installationen
und Plugin-Updates trotz integrierter `critical`-Befunde fortgesetzt werden, aber es
umgeht weiterhin weder Plugin-`before_install`-Policy-Sperren noch die Blockierung bei Scan-Fehlern.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte
Installationen von Skill-Abhängigkeiten verwenden stattdessen die entsprechende
Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` weiterhin der separate ClawHub-
Download-/Installationsablauf für Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für plugin list/inspect/enable/disable
teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehls-Skills,
Claude-Standardeinstellungen aus `settings.json`, Claude-Standardeinstellungen aus `.lsp.json` und manifestdeklarierten
`lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Funktionen sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Bekannter-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
`marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Einstiegobjekt, das `register(api)` bereitstellt. Ältere
Plugins verwenden möglicherweise weiterhin `activate(api)` als älteren Alias, aber neue Plugins sollten
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

OpenClaw lädt das Einstiegobjekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader greift für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als den
öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

| Methode                                 | Was sie registriert          |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Modellanbieter (LLM)         |
| `registerChannel`                       | Chat-Kanal                   |
| `registerTool`                          | Agent-Tool                   |
| `registerHook` / `on(...)`              | Lifecycle-Hooks              |
| `registerSpeechProvider`                | Text-zu-Sprache / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                |
| `registerRealtimeVoiceProvider`         | Bidirektionale Echtzeit-Sprache |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse           |
| `registerImageGenerationProvider`       | Bildgenerierung              |
| `registerMusicGenerationProvider`       | Musikgenerierung             |
| `registerVideoGenerationProvider`       | Videogenerierung             |
| `registerWebFetchProvider`              | Web-Abruf-/Scrape-Anbieter   |
| `registerWebSearchProvider`             | Web-Suche                    |
| `registerHttpRoute`                     | HTTP-Endpunkt                |
| `registerCommand` / `registerCli`       | CLI-Befehle                  |
| `registerContextEngine`                 | Kontext-Engine               |
| `registerService`                       | Hintergrunddienst            |

Verhalten der Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` hat keine Wirkung und hebt eine frühere Sperre nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` hat keine Wirkung und hebt eine frühere Sperre nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` hat keine Wirkung und hebt eine frühere Abbruchentscheidung nicht auf.

Das vollständige Verhalten typisierter Hooks finden Sie unter [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Drittanbieter-Übersichten
