---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Capabilities: Channels, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Stimme, Medienverständnis, Bilderzeugung, Videoerzeugung, Web-Fetch, Web-
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

    Konfigurieren Sie es dann unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>
</Steps>

Wenn Sie lieber chatnative Steuerung verwenden möchten, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>` oder bloße Paketspezifikation (zuerst ClawHub, dann npm als Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Pfad zur Neuinstallation gebündelter Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren nicht vorab den gesamten
Laufzeit-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes, OpenClaw-eigenes Plugin über
die Plugin-Konfiguration, die Legacy-Channel-Konfiguration oder ein standardmäßig aktiviertes Manifest aktiv ist,
repariert der Start nur die deklarierten Laufzeitabhängigkeiten dieses Plugins, bevor es importiert wird.
Explizites Deaktivieren hat weiterhin Vorrang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` und `channels.<id>.enabled: false`
verhindern die automatische Reparatur gebündelter Laufzeitabhängigkeiten für dieses Plugin/diesen Channel.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugintypen

OpenClaw erkennt zwei Pluginformate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete              |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Features abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin Bundles](/de/plugins/bundles) für Bundle-Details.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Building Plugins](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                           |
| --------------- | --------------------- | --------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)              |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams)    |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)                |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/de/plugins/voice-call)       |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)                  |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/de/plugins/zalouser)      |

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
    - `memory-lancedb` — bedarfsweise installierbarer Langzeitspeicher mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstige">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Runtime und den Standard-Browser-Control-Service (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy Bridge (standardmäßig deaktiviert)
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
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
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
| `deny`           | Plugin-Denylist (optional; deny hat Vorrang)              |
| `load.paths`     | Zusätzliche Plugindateien/-verzeichnisse                  |
| `slots`          | Exklusive Slot-Auswahl (z. B. `memory`, `contextEngine`)  |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration               |

Konfigurationsänderungen **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurations-
Watching + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.
Es gibt keinen unterstützten Hot-Reload-Pfad für nativen Plugin-Laufzeitcode oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Channel bedient, bevor Sie erwarten,
dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools, Services oder
Provider-/Runtime-Hooks ausgeführt werden.

`openclaw plugins list` ist ein lokaler Snapshot von Plugin-Registry/Konfiguration. Ein
dort als `enabled` markiertes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufender entfernter Gateway-
Child in denselben Plugincode neu gestartet wurde. In VPS-/Container-Setups mit
Wrapper-Prozessen senden Sie Neustarts an den tatsächlichen Prozess `openclaw gateway run`,
oder verwenden Sie `openclaw gateway restart` gegen das laufende Gateway.

<Accordion title="Plugin-Status: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Erkennung und Priorität

OpenClaw scannt nach Plugins in dieser Reihenfolge (erste Übereinstimmung gewinnt):

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
    Andere erfordern explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standard-Aktivierungsmenge, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Runtime
- Codex-Routen der OpenAI-Familie behalten getrennte Plugingrenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin über `embeddedHarness.runtime: "codex"` oder Legacy-
  Modellreferenzen `codex/*` ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Nebeneffekte oder Hooks
im Live-Chatverkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie die aktive
  Gateway-URL, das Profil, den Konfigurationspfad und den Prozess, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation/Konfiguration/Code neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten oder signalisieren Sie den Child-
  Prozess `openclaw gateway run`.
- Verwenden Sie `openclaw plugins inspect <id> --json`, um Hook-Registrierungen und
  Diagnoseinformationen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellumschaltung sollten Sie `before_model_resolve` bevorzugen. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch Assistant-Ausgabe
  erzeugt hat.
- Als Nachweis für das effektive Sitzungsmodell verwenden Sie `openclaw sessions` oder die
  Sitzungs-/Statusoberflächen des Gateway und starten Sie beim Debuggen von Provider-Payloads
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (immer nur eine gleichzeitig aktiv):

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
| `contextEngine` | Aktive Kontext-Engine  | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompakte Bestandsübersicht
openclaw plugins list --enabled            # nur aktivierte Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbare Bestandsübersicht
openclaw plugins inspect <id>              # detaillierte Informationen
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellarische Übersicht über alle
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnose
openclaw plugins registry                  # persistierten Registry-Status prüfen
openclaw plugins registry --refresh        # persistierte Registry neu aufbauen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # bestehende Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # für die Entwicklung verlinken (ohne Kopie)
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

`--force` überschreibt ein bereits installiertes Plugin oder Hook-Pack direkt. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für reguläre Upgrades verfolgter npm-
Plugins. Es wird nicht mit `--link` unterstützt, da dabei der Quellpfad wiederverwendet wird,
statt in ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
ID des installierten Plugins dieser Allowlist vor der Aktivierung hinzu, sodass Installationen
nach dem Neustart sofort ladbar sind.

OpenClaw führt eine persistierte lokale Plugin-Registry als Cold-Read-Modell für
Plugin-Bestandsübersicht, Ownership von Contributions und Startplanung. Flows zum Installieren, Aktualisieren,
Deinstallieren, Aktivieren und Deaktivieren aktualisieren diese Registry nach Änderungen am Plugin-
Status. Wenn die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry
--refresh` sie aus dem dauerhaften Installations-Ledger, der Konfigurationsrichtlinie und
Manifest-/Paketmetadaten neu auf, ohne Plugin-Laufzeitmodule zu laden.

`openclaw plugins update <id-or-npm-spec>` gilt für verfolgte Installationen. Wenn Sie
eine npm-Paketspezifikation mit Dist-Tag oder exakter Version übergeben, wird der Paketname
auf den verfolgten Plugin-Datensatz zurückgeführt und die neue Spezifikation für zukünftige Updates gespeichert.
Wenn Sie den Paketnamen ohne Version übergeben, verschiebt dies eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits mit
der aufgelösten Version und der gespeicherten Artefaktidentität übereinstimmt, überspringt OpenClaw die Aktualisierung,
ohne herunterzuladen, neu zu installieren oder die Konfiguration umzuschreiben.

`--pin` ist nur für npm. Es wird nicht zusammen mit `--marketplace` unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist ein Break-Glass-Override für Fehl-
Positive des integrierten Scanners für gefährlichen Code. Damit können Plugin-Installationen
und Plugin-Aktualisierungen trotz integrierter `critical`-Funde fortgesetzt werden, aber es
umgeht weiterhin keine `before_install`-Richtlinienblöcke des Plugins oder Blockierungen wegen Scan-Fehlern.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Aktualisierungs-Flows. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen den passenden Request-Override `dangerouslyForceUnsafeInstall`, während
`openclaw skills install` der separate ClawHub-Flow zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Flow für `plugins list`/`inspect`/`enable`/`disable`
teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Command-Skills,
Claude-`settings.json`-Standardeinstellungen, Claude-`.lsp.json` und manifestdeklarierte
`lspServers`-Standardeinstellungen, Cursor-Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet auch erkannte Bundle-Capabilities sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für bundlegestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
`marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadquellen verwenden.

Siehe die [`openclaw plugins`-CLI-Referenz](/de/cli/plugins) für vollständige Details.

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

OpenClaw lädt das Entry-Objekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader greift für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als den
öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Laufzeitaktivierung. Registriert Tools, Hooks, Services, Befehle, Routen und andere Live-Nebeneffekte.                         |
| `discovery`     | Read-only-Capability-Erkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code darf geladen werden, soll aber Live-Nebeneffekte überspringen. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen schlanken Setup-Entry.                                                              |
| `setup-runtime` | Laden von Channel-Setup, das auch den Runtime-Entry benötigt.                                                                    |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                           |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` absichern.
Discovery-Ladevorgänge werden getrennt von aktivierenden Ladevorgängen gecacht und ersetzen die
laufende Gateway-Registry nicht. Discovery ist nicht aktivierend, aber auch nicht importfrei:
OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Channel-Plugin-Modul auswerten, um
den Snapshot zu erstellen. Halten Sie Module auf Top-Level leichtgewichtig und frei von Nebeneffekten und verschieben Sie
Netzwerk-Clients, Subprozesse, Listener, Credential-Lesevorgänge und Service-Start hinter Pfade der vollständigen Laufzeit.

Häufige Registrierungsmethoden:

| Methode                                  | Was sie registriert          |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)        |
| `registerChannel`                       | Chat-Channel                 |
| `registerTool`                          | Agent-Tool                   |
| `registerHook` / `on(...)`              | Lifecycle-Hooks              |
| `registerSpeechProvider`                | Text-to-Speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse           |
| `registerImageGenerationProvider`       | Bilderzeugung                |
| `registerMusicGenerationProvider`       | Musikerzeugung               |
| `registerVideoGenerationProvider`       | Videoerzeugung               |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider   |
| `registerWebSearchProvider`             | Websuche                     |
| `registerHttpRoute`                     | HTTP-Endpunkt                |
| `registerCommand` / `registerCli`       | CLI-Befehle                  |
| `registerContextEngine`                 | Kontext-Engine               |
| `registerService`                       | Hintergrunddienst            |

Hook-Guard-Verhalten für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Cancel nicht auf.

Native Codex-App-Server-Ausführungen bridgen Codex-native Tool-Ereignisse zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren,
Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Freigaben teilnehmen. Die Bridge schreibt Codex-native Tool-
Argumente derzeit noch nicht um. Die genaue Unterstützungsgrenze der Codex-Laufzeit steht im
[v1-Support-Vertrag für das Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

Das vollständige Verhalten typisierter Hooks finden Sie unter [SDK overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte Themen

- [Building plugins](/de/plugins/building-plugins) — eigenes Plugin erstellen
- [Plugin bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin manifest](/de/plugins/manifest) — Manifest-Schema
- [Registering tools](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin internals](/de/plugins/architecture) — Capability-Modell und Ladepipeline
- [Community plugins](/de/plugins/community) — Drittanbieter-Listings
