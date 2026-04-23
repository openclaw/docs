---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Lade-Regeln verstehen
    - Mit Plugin-Bundles arbeiten, die mit Codex/Claude kompatibel sind
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-23T06:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb81789de548aed0cd0404e8c42a2d9ce00d0e9163f944e07237b164d829ac40
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Tools, Skills, Sprache, Realtime-Transkription, Realtime-Voice,
Medienverständnis, Bilderzeugung, Videoerzeugung, Webabruf, Web-
Suche und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert), andere
sind **external** (werden von der Community auf npm veröffentlicht).

## Schnellstart

<Steps>
  <Step title="Sehen, was geladen ist">
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

    Dann unter `plugins.entries.\<id\>.config` in deiner Konfigurationsdatei konfigurieren.

  </Step>
</Steps>

Wenn du native Steuerung im Chat bevorzugst, aktiviere `commands.plugins: true` und verwende:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler
Pfad/Archiv, explizites `clawhub:<pkg>` oder nackte Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise fail-closed fehl und verweist dich auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Pfad zur Neuinstallation gebündelter Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren nicht eager den vollständigen
Laufzeit-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes OpenClaw-eigenes Plugin
über Plugin-Konfiguration, Legacy-Kanalkonfiguration oder ein standardmäßig aktiviertes Manifest aktiv ist,
repariert der Start nur die deklarierten Laufzeitabhängigkeiten dieses Plugins, bevor es importiert wird.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; Ausführung in-process    | Offizielle Plugins, npm-Pakete der Community          |
| **Bundle** | Mit Codex/Claude/Cursor kompatibles Layout; auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin Bundles](/de/plugins/bundles) für Details zu Bundles.

Wenn du ein natives Plugin schreibst, beginne mit [Building Plugins](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                        |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/de/plugins/voice-call)    |
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

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — On-Demand-Installation für Langzeit-Memory mit automatischem Recall/Capture (setze `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Weitere">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den Standard-Browser-Control-Service (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy Bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Du suchst nach Drittanbieter-Plugins? Siehe [Community Plugins](/de/plugins/community).

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
| `enabled`        | Master-Schalter (Standard: `true`)                        |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; deny gewinnt)                  |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggles + Konfiguration pro Plugin                        |

Konfigurationsänderungen **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurations-
Watch + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.

<Accordion title="Plugin-Zustände: disabled vs missing vs invalid">
  - **Disabled**: Plugin existiert, aber Aktivierungsregeln haben es deaktiviert. Die Konfiguration bleibt erhalten.
  - **Missing**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Invalid**: Das Plugin existiert, aber seine Konfiguration stimmt nicht mit dem deklarierten Schema überein.
</Accordion>

## Erkennung und Priorität

OpenClaw durchsucht Plugins in dieser Reihenfolge (der erste Treffer gewinnt):

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
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` gewinnt immer vor `allow`
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der eingebauten Standard-Aktivierungsmenge, sofern nicht überschrieben
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsaktivieren

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

| Slot            | Steuert                  | Standard             |
| --------------- | ------------------------ | -------------------- |
| `memory`        | Aktives Memory-Plugin    | `memory-core`        |
| `contextEngine` | Aktive Context-Engine    | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # flotteweite Tabelle
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # verlinken (ohne Kopie) für Entwicklung
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
gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Paket direkt. Verwende
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades verfolgter npm-
Plugins. Es wird nicht mit `--link` unterstützt, da dabei der Quellpfad wiederverwendet wird,
anstatt über ein verwaltetes Installationsziel zu kopieren.

`openclaw plugins update <id-or-npm-spec>` gilt für verfolgte Installationen. Wenn du
eine npm-Paketspezifikation mit Dist-Tag oder exakter Version übergibst, wird der Paketname
zum verfolgten Plugin-Datensatz zurück aufgelöst und die neue Spezifikation für zukünftige Updates gespeichert.
Wenn du den Paketnamen ohne Versionsangabe übergibst, wird eine exakt angeheftete Installation wieder auf
die Standard-Release-Linie der Registry zurückgesetzt. Wenn das installierte npm-Plugin bereits mit
der aufgelösten Version und der gespeicherten Artefaktidentität übereinstimmt, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Konfiguration umzuschreiben.

`--pin` gilt nur für npm. Es wird nicht mit `--marketplace` unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist ein Notfall-Override für Fehlalarme
des eingebauten Scanners für gefährlichen Code. Es erlaubt Plugin-Installationen
und Plugin-Updates, trotz eingebauter `critical`-Befunde fortzufahren, umgeht aber weiterhin weder Plugin-`before_install`-Policy-Blocks noch das Blockieren bei Scan-Fehlern.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen das passende Request-Override `dangerouslyForceUnsafeInstall`, während `openclaw skills install` weiterhin der separate ClawHub-
Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen an demselben Ablauf `plugin list/inspect/enable/disable` teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Befehlsskills,
Claude-Standards aus `settings.json`, Claude-Standards aus `.lsp.json` und im Manifest deklarierte
`lspServers`, Cursor-Befehlsskills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Funktionen sowie
unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für bundlegestützte Plugins.

Marketplace-Quellen können ein Claude-Known-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
ein Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Für entfernte Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadquellen verwenden.

Siehe die [`openclaw plugins` CLI reference](/de/cli/plugins) für alle Details.

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, aber neue Plugins sollten
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
Aktivierung `register(api)` auf. Der Loader greift für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als den
öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

| Methode                                 | Was sie registriert          |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)        |
| `registerChannel`                       | Chat-Kanal                   |
| `registerTool`                          | Agenten-Tool                 |
| `registerHook` / `on(...)`              | Lifecycle-Hooks              |
| `registerSpeechProvider`                | Text-to-Speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                |
| `registerRealtimeVoiceProvider`         | Duplex-Realtime-Voice        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse           |
| `registerImageGenerationProvider`       | Bilderzeugung                |
| `registerMusicGenerationProvider`       | Musikerzeugung               |
| `registerVideoGenerationProvider`       | Videoerzeugung               |
| `registerWebFetchProvider`              | Webabruf-/Scrape-Provider    |
| `registerWebSearchProvider`             | Websuche                     |
| `registerHttpRoute`                     | HTTP-Endpoint                |
| `registerCommand` / `registerCli`       | CLI-Befehle                  |
| `registerContextEngine`                 | Context-Engine               |
| `registerService`                       | Hintergrunddienst            |

Verhalten von Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt ein früheres Cancel nicht auf.

Für das vollständige Verhalten typisierter Hooks siehe [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — dein eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin Manifest](/de/plugins/manifest) — Manifestschema
- [Registering Tools](/de/plugins/building-plugins#registering-agent-tools) — Agenten-Tools in einem Plugin hinzufügen
- [Plugin Internals](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Listen mit Drittanbieter-Plugins
