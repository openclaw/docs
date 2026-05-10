---
read_when:
    - Sie benötigen exakte Konfigurationssemantik oder Standardwerte auf Feldebene
    - Sie validieren Kanal-, Modell-, Gateway- oder Tool-Konfigurationsblöcke
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystemreferenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-05-10T19:34:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernkonfigurationsreferenz für `~/.openclaw/openclaw.json`. Eine aufgabenorientierte Übersicht finden Sie unter [Konfiguration](/de/gateway/configuration).

Deckt die wichtigsten OpenClaw-Konfigurationsoberflächen ab und verlinkt weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Kanal- und Plugin-eigene Befehlskataloge sowie detaillierte Speicher-/QMD-Regler befinden sich auf eigenen Seiten statt auf dieser.

Code-Wahrheit:

- `openclaw config schema` gibt das live verwendete JSON-Schema aus, das für Validierung und Control UI genutzt wird, wobei gebündelte/Plugin-/Kanal-Metadaten zusammengeführt werden, wenn verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen Schema-Knoten für Drill-down-Werkzeuge zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schema-Oberfläche

Agent-Suchpfad: Verwenden Sie die `gateway`-Tool-Aktion `config.schema.lookup` für
exakte feldbezogene Dokumentation und Einschränkungen vor Änderungen. Verwenden Sie
[Konfiguration](/de/gateway/configuration) für aufgabenorientierte Anleitung und diese Seite
für die breitere Feldübersicht, Standardwerte und Links zu Subsystemreferenzen.

Dedizierte ausführliche Referenzen:

- [Speicherkonfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas erlaubt). Alle Felder sind optional - OpenClaw verwendet sichere Standardwerte, wenn sie ausgelassen werden.

---

## Kanäle

Kanalspezifische Konfigurationsschlüssel wurden auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Kanäle](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Kanäle (Authentifizierung, Zugriffskontrolle, Multi-Account, Mention-Gating).

## Agent-Standardwerte, Multi-Agent, Sitzungen und Nachrichten

Auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Thinking, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindings)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.consultThinkingLevel`: Thinking-Level-Override für den vollständigen OpenClaw-Agent-Lauf hinter Control-UI-Talk-Echtzeitkonsultationen
  - `talk.consultFastMode`: einmaliger Fast-Mode-Override für Control-UI-Talk-Echtzeitkonsultationen
  - `talk.speechLocale`: optionale BCP-47-Locale-ID für Talk-Spracherkennung unter iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, behält Talk das Standard-Pausenfenster der Plattform vor dem Senden des Transkripts bei (`700 ms unter macOS und Android, 900 ms unter iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Schalter, Provider-gestützte Tool-Konfiguration und Einrichtung
benutzerdefinierter Provider / Basis-URLs wurden auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Allowlists und die Einrichtung benutzerdefinierter Provider befinden sich unter
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Der Root `models` steuert außerdem das globale Modellkatalogverhalten.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: Provider-Katalogverhalten (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID geschlüsselt.
- `models.providers.*.localService`: optionaler On-Demand-Prozessmanager für
  lokale Modellserver. OpenClaw prüft den konfigurierten Health-Endpunkt, startet
  bei Bedarf den absoluten `command`, wartet auf Bereitschaft und sendet dann die Modellanfrage.
  Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- `models.pricing.enabled`: steuert den Hintergrund-Pricing-Bootstrap, der
  startet, nachdem Sidecars und Kanäle den Gateway-Bereitschaftspfad erreicht haben. Wenn `false`,
  überspringt der Gateway OpenRouter- und LiteLLM-Pricing-Katalogabrufe; konfigurierte
  `models.providers.*.models[].cost`-Werte funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem Pi und anderen Runtime-Adaptern genutzt. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne während Konfigurationsänderungen eine Verbindung zum
Zielserver herzustellen.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: benannte stdio- oder Remote-MCP-Serverdefinitionen für Runtimes, die
  konfigurierte MCP-Tools bereitstellen.
  Remote-Einträge verwenden `transport: "streamable-http"` oder `transport: "sse"`;
  `type: "http"` ist ein CLI-nativer Alias, den `openclaw mcp set` und
  `openclaw doctor --fix` in das kanonische Feld `transport` normalisieren.
- `mcp.sessionIdleTtlMs`: Leerlauf-TTL für sitzungsbezogene gebündelte MCP-Runtimes.
  Einmalige eingebettete Läufe fordern eine Bereinigung am Laufende an; diese TTL ist die Absicherung für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden sofort angewendet, indem zwischengespeicherte Sitzungs-MCP-Runtimes verworfen werden.
  Die nächste Tool-Erkennung/-Nutzung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  `mcp.servers`-Einträge sofort bereinigt werden, statt auf die Leerlauf-TTL zu warten.

Siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays) für Runtime-Verhalten.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Arbeitsbereich-Skills bleiben unbeeinflusst).
- `load.extraDirs`: zusätzliche gemeinsam genutzte Skill-Roots (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige reale Ziel-Roots, in die Skill-Symlinks
  aufgelöst werden dürfen, wenn der Link außerhalb seines konfigurierten Quell-Roots liegt.
- `install.preferBrew`: wenn true, Homebrew-Installer bevorzugen, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgefallen wird.
- `install.nodeManager`: Node-Installer-Präferenz für `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: vertrauenswürdigen `operator.admin`-Gateway-
  Clients erlauben, private Zip-Archive zu installieren, die über `skills.upload.*`
  bereitgestellt wurden (Standard: false). Dies aktiviert nur den Pfad für hochgeladene Archive; normale ClawHub-
  Installationen erfordern dies nicht.
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Umgebungsvariable deklarieren (Klartextzeichenfolge oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Die Erkennung akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Standardlayout-Bundles.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `bundledDiscovery`: standardmäßig `"allowlist"` für neue Konfigurationen, sodass eine nicht leere
  `plugins.allow` auch gebündelte Provider-Plugins einschließt, einschließlich Web-Search-
  Runtime-Provider. Doctor schreibt `"compat"` für migrierte Legacy-Allowlist-
  Konfigurationen, um bestehendes Verhalten gebündelter Provider beizubehalten, bis Sie sich aktiv dafür entscheiden.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-bezogene Umgebungsvariablen-Map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert prompt-verändernde Felder aus Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` beibehalten werden. Gilt für native Plugin-Hooks und unterstützte Bundle-bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wenn `true`, dürfen vertrauenswürdige nicht gebündelte Plugins rohe Konversationsinhalte aus typisierten Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin ausdrücklich vertrauen, pro Lauf `provider`- und `model`-Overrides für Hintergrund-Subagent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowModelOverride`: diesem Plugin ausdrücklich vertrauen, Modell-Overrides für `api.runtime.llm.complete` anzufordern.
- `plugins.entries.<id>.llm.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Plugin-LLM-Completion-Overrides. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: diesem Plugin ausdrücklich vertrauen, `api.runtime.llm.complete` gegen eine nicht standardmäßige Agent-ID auszuführen.
- `plugins.entries.<id>.config`: Plugin-definiertes Konfigurationsobjekt (validiert durch natives OpenClaw-Plugin-Schema, wenn verfügbar).
- Konto-/Runtime-Einstellungen von Kanal-Plugins befinden sich unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten des Manifests des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistrierung.

### Codex-Harness-Plugin-Konfiguration

Das gebündelte Plugin `codex` besitzt native Codex-App-Server-Harness-Einstellungen unter
`plugins.entries.codex.config`. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference) für die vollständige Konfigurationsoberfläche
und [Codex-Harness](/de/plugins/codex-harness) für das Runtime-Modell.

`codexPlugins` gilt nur für Sitzungen, die den nativen Codex-Harness auswählen.
Es aktiviert Codex-Plugins nicht für Pi, normale OpenAI-Provider-Läufe, ACP-
Konversations-Bindings oder irgendeinen Nicht-Codex-Harness.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: aktiviert native Codex-
  Plugin-/App-Unterstützung für das Codex-Harness. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  Standardrichtlinie für destruktive Aktionen bei migrierten Plugin-App-Elicitations.
  Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: aktiviert einen
  migrierten Plugin-Eintrag, wenn das globale `codexPlugins.enabled` ebenfalls wahr ist.
  Standard: `true` für explizite Einträge.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabile Marketplace-Identität. V1 unterstützt nur `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabile
  Codex-Plugin-Identität aus der Migration, zum Beispiel `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin-spezifische Überschreibung für destruktive Aktionen. Wenn ausgelassen, wird der globale
  Wert `allow_destructive_actions` verwendet.

`codexPlugins.enabled` ist die globale Aktivierungsdirektive. Explizite Plugin-
Einträge, die von der Migration geschrieben werden, sind die dauerhafte Menge für Installations- und Reparaturberechtigung.
`plugins["*"]` wird nicht unterstützt, es gibt keinen `install`-Schalter, und lokale
`marketplacePath`-Werte sind absichtlich keine Konfigurationsfelder, da sie
host-spezifisch sind.

`app/list`-Bereitschaftsprüfungen werden eine Stunde lang zwischengespeichert und asynchron
aktualisiert, wenn sie veraltet sind. Die Codex-Thread-App-Konfiguration wird beim Aufbau der Codex-Harness-
Sitzung berechnet, nicht bei jedem Turn; verwenden Sie `/new`, `/reset` oder einen Gateway-
Neustart, nachdem Sie die native Plugin-Konfiguration geändert haben.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Web-Fetch-Provider-Einstellungen.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, das Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte zeigen).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout für Scrape-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search-Einstellungen (Grok-Websuche).
  - `enabled`: den X Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Memory-Dreaming-Einstellungen. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: zentraler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Takt für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - `model`: optionale Modellüberschreibung für den Dream-Diary-Subagent. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; zusammen mit `allowedModels` verwenden, um Ziele einzuschränken. Fehler wegen nicht verfügbarer Modelle werden einmal mit dem Standardmodell der Sitzung wiederholt; Vertrauens- oder Allowlist-Fehler fallen nicht stillschweigend zurück.
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration befindet sich in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können außerdem eingebettete Pi-Standardwerte aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurationspatches.
- `plugins.slots.memory`: wählt die aktive Memory-Plugin-ID aus oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: wählt die aktive Context-Engine-Plugin-ID aus; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

---

## Verpflichtungen

`commitments` steuert abgeleitete Follow-up-Memory: OpenClaw kann Check-ins aus Konversationsturns erkennen und sie über Heartbeat-Läufe ausliefern.

- `commitments.enabled`: aktiviert versteckte LLM-Extraktion, Speicherung und Heartbeat-Auslieferung für abgeleitete Follow-up-Verpflichtungen. Standard: `false`.
- `commitments.maxPerDay`: maximale Anzahl abgeleiteter Follow-up-Verpflichtungen, die pro Agent-Sitzung an einem rollierenden Tag ausgeliefert werden. Standard: `3`.

Siehe [Abgeleitete Verpflichtungen](/de/concepts/commitments).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `tabCleanup` gibt nach Leerlaufzeit oder wenn eine
  Sitzung ihre Obergrenze überschreitet, nachverfolgte Tabs des primären Agents frei. Setzen Sie `idleMinutes: 0` oder `maxTabsPerSession: 0`, um
  diese einzelnen Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn nicht gesetzt, sodass Browsernavigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browsernavigation in privaten Netzwerken bewusst vertrauen.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen derselben Blockierung privater Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` bleibt als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind attach-only (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` ermitteln soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für Remote- und
  `attachOnly`-CDP-Erreichbarkeit sowie Tab-Öffnungsanfragen. Verwaltete Loopback-
  Profile behalten lokale CDP-Standardwerte bei.
- Wenn ein extern verwalteter CDP-Dienst über Loopback erreichbar ist, setzen Sie
  `attachOnly: true` für dieses Profil; andernfalls behandelt OpenClaw den Loopback-Port als
  lokal verwaltetes Browserprofil und meldet möglicherweise Fehler zur lokalen Port-Eigentümerschaft.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können auf
  dem ausgewählten Host oder über einen verbundenen Browserknoten anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusteuern.
- `existing-session`-Profile behalten die aktuellen Chrome-MCP-Routenlimits bei:
  Snapshot-/Ref-gesteuerte Aktionen statt CSS-Selektor-Zielen, Datei-Upload-
  Hooks für eine Datei, keine Dialog-Timeout-Überschreibungen, kein `wait --load networkidle` und keine
  `responsebody`-, PDF-Export-, Download-Interception- oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für Remote-CDP.
- Lokal verwaltete Profile können `executablePath` setzen, um das globale
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die Chrome-CDP-HTTP-
  Discovery nach dem Prozessstart und `browser.localCdpReadyTimeoutMs` für
  die CDP-WebSocket-Bereitschaft nach dem Start. Erhöhen Sie diese auf langsameren Hosts, auf denen Chrome
  erfolgreich startet, aber Bereitschaftsprüfungen mit dem Start konkurrieren. Beide Werte müssen
  positive Ganzzahlen bis zu `120000` ms sein; ungültige Konfigurationswerte werden abgelehnt.
- Auto-Detect-Reihenfolge: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath` akzeptieren beide
  `~` und `~/...` für das Home-Verzeichnis Ihres Betriebssystems vor dem Chromium-Start.
  Profilbezogenes `userDataDir` bei `existing-session`-Profilen wird ebenfalls mit Tilde erweitert.
- Steuerungsdienst: nur Loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergrößen oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für die native App-UI-Chrome (Talk-Mode-Bubble-Färbung usw.).
- `assistant`: Überschreibung der Control-UI-Identität. Fällt auf die aktive Agent-Identität zurück.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway-Felddetails">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit Remote-Gateway verbinden). Der Gateway verweigert den Start, sofern nicht `local` gesetzt ist.
- `port`: einzelner multiplexter Port für WS + HTTP. Vorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliase**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliase (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das standardmäßige `loopback`-Bind lauscht im Container auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt Traffic auf `eth0` an, sodass der Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Authentifizierung**: Standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Authentifizierung. Praktisch bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- und Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige local loopback-Setups verwenden; dies wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Browser-/Benutzerauthentifizierung an einen identitätsbewussten Reverse Proxy delegieren und Identitäts-Headern aus `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine **Nicht-Loopback**-Proxy-Quelle; Same-Host-Loopback-Reverse-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Same-Host-Aufrufer können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem trusted-proxy-Modus gegenseitig ausgeschlossen.
- `gateway.auth.allowTailscale`: Wenn `true`, können Tailscale Serve-Identitäts-Header die Authentifizierung der Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Authentifizierung **nicht**; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierung. Gilt pro Client-IP und pro Authentifizierungs-Scope (Shared Secret und Geräte-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher den Limiter bereits bei der zweiten Anfrage auslösen, anstatt dass beide als einfache Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie localhost-Traffic absichtlich ebenfalls rate-limiten möchten (für Test-Setups oder strikte Proxy-Deployments).
- Browser-Origin-WS-Authentifizierungsversuche werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (Defense-in-Depth gegen browserbasiertes localhost-Brute-Force).
- Auf Loopback sind diese Browser-Origin-Sperren pro normalisiertem `Origin`-
  Wert isoliert, sodass wiederholte Fehler von einer localhost-Origin nicht automatisch
  eine andere Origin sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `tailscale.preserveFunnel`: Wenn `true` und `tailscale.mode = "serve"`, prüft OpenClaw
  `tailscale funnel status`, bevor Serve beim Start erneut angewendet wird, und überspringt
  dies, wenn eine extern konfigurierte Funnel-Route den Gateway-Port bereits abdeckt.
  Standard `false`.
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.chatMessageMaxWidth`: optionale maximale Breite für gruppierte Control-UI-Chatnachrichten. Akzeptiert eingeschränkte CSS-Breitenwerte wie `960px`, `82%`, `min(1280px, 82%)` und `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die absichtlich auf Host-Header-Origin-Policy angewiesen sind.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitiger Break-Glass-Override über die Prozessumgebung,
  der Klartext-`ws://` zu vertrauenswürdigen IPs in privaten Netzwerken erlaubt;
  standardmäßig bleibt Klartext nur für Loopback erlaubt. Es gibt kein entsprechendes
  `openclaw.json`, und Browser-Konfiguration für private Netzwerke wie
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` wirkt sich nicht auf Gateway-
  WebSocket-Clients aus.
- `gateway.remote.token` / `.password` sind Anmeldefelder für Remote-Clients. Sie konfigurieren für sich genommen keine Gateway-Authentifizierung.
- `gateway.push.apns.relay.baseUrl`: HTTPS-Basis-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem sie relay-gestützte Registrierungen am Gateway veröffentlicht haben. Diese URL muss mit der Relay-URL übereinstimmen, die in den iOS-Build kompiliert wurde.
- `gateway.push.apns.relay.timeoutMs`: Gateway-zu-Relay-Sendetimeout in Millisekunden. Standardmäßig `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet einen registrierungsspezifischen Sende-Grant an den Gateway weiter. Ein anderer Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ausschließlich für die Entwicklung vorgesehene Ausweichmöglichkeit für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.handshakeTimeoutMs`: Pre-Auth-Gateway-WebSocket-Handshake-Timeout in Millisekunden. Standard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat Vorrang, wenn gesetzt. Erhöhen Sie diesen Wert auf ausgelasteten oder leistungsschwachen Hosts, auf denen lokale Clients eine Verbindung herstellen können, während die Startaufwärmung noch abklingt.
- `gateway.channelHealthCheckMinutes`: Intervall des Channel-Health-Monitors in Minuten. Setzen Sie `0`, um Health-Monitor-Neustarts global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Health-Monitor-Neustarts pro Channel/Konto in einer rollierenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Opt-out pro Channel für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Override pro Konto für Multi-Account-Channels. Wenn gesetzt, hat dies Vorrang vor dem Override auf Channel-Ebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder Forwarded-Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind für Same-Host-Proxy-/Local-Detection-Setups weiterhin gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse Proxy), machen Loopback-Anfragen aber **nicht** für `gateway.auth.mode: "trusted-proxy"` berechtigt.
- `allowRealIpFallback`: Wenn `true`, akzeptiert der Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standard `false` für Fail-Closed-Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR/IP-Allowlist für die automatische Genehmigung erstmaliger Node-Gerätekopplung ohne angeforderte Scopes. Sie ist deaktiviert, wenn sie nicht gesetzt ist. Dies genehmigt Operator-/Browser-/Control-UI-/WebChat-Kopplung nicht automatisch, und es genehmigt Rollen-, Scope-, Metadaten- oder Public-Key-Upgrades nicht automatisch.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Allow-/Deny-Formung für deklarierte Node-Befehle nach Kopplung und Plattform-Allowlist-Auswertung. Verwenden Sie `allowCommands`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip` und `screen.record` explizit zuzulassen; `denyCommands` entfernt einen Befehl, selbst wenn ein Plattformstandard oder eine explizite Zulassung ihn andernfalls enthalten würde. Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie diese Gerätekopplung ab und genehmigen Sie sie erneut, damit der Gateway den aktualisierten Befehls-Snapshot speichert.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste entfernen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von URL-Eingaben für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abrufe zu deaktivieren.
- Optionaler Header zur Response-Härtung:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-Instanz-Isolation

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und State-Verzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfort-Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Multiple Gateways](/de/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: aktiviert TLS-Terminierung am Gateway-Listener (HTTPS/WSS) (Standard: `false`).
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikat/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/Entwicklungsnutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur TLS-Private-Key-Datei; halten Sie die Berechtigungen eingeschränkt.
- `caPath`: optionaler CA-Bundle-Pfad für Client-Verifizierung oder benutzerdefinierte Vertrauensketten.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: steuert, wie Konfigurationsänderungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Änderungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderungen immer neu starten.
  - `"hot"`: Änderungen prozessintern ohne Neustart anwenden.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms für laufende Operationen, bevor ein Neustart oder Channel-Hot-Reload erzwungen wird. Auslassen, um die standardmäßige begrenzte Wartezeit (`300000`) zu verwenden; auf `0` setzen, um unbegrenzt zu warten und periodische Warnungen über weiterhin ausstehende Vorgänge zu protokollieren.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Authentifizierung: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Token in Query-Strings werden abgelehnt.

Validierungs- und Sicherheitshinweise:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich von `gateway.auth.token` **unterscheiden**; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true` ist, beschränken Sie `hooks.allowedSessionKeyPrefixes` (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset eine vorlagenbasierte `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel benötigen diese explizite Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` ist (Standard: `false`).
- `POST /hooks/<name>` → über `hooks.mappings` aufgelöst
  - Per Vorlage gerenderte Mapping-Werte für `sessionKey` werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Vorlagen wie `{{messages[0].subject}}` lesen aus der Payload.
- `transform` kann auf ein JS/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
  - Belassen Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Workspace-Skill-Verzeichnisse werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transform-Modul in das Hook-Transform-Verzeichnis oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: beschränkt explizites Routing (`*` oder ausgelassen = alle zulassen, `[]` = alle ablehnen).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne explizite `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und vorlagengesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset eine vorlagenbasierte `sessionKey` verwendet.
- `deliver: true` sendet die finale Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` passend zum Gmail-Namespace, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einer statischen `sessionKey` anstelle des vorlagenbasierten Standards.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway startet `gog gmail watch serve` beim Booten automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie kein separates `gog gmail watch serve` parallel zum Gateway aus.

---

## Canvas-Plugin-Host

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Stellt durch Agenten bearbeitbares HTML/CSS/JS und A2UI per HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: Behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Bindings außerhalb von local loopback: Canvas-Routen erfordern Gateway-Authentifizierung (Token/Passwort/vertrauenswürdiger Proxy), genau wie andere HTTP-Oberflächen des Gateway.
- Node-WebViews senden normalerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, bewirbt der Gateway Node-spezifische Capability-URLs für Canvas-/A2UI-Zugriff.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. Ein IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in bereitgestelltes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn das Verzeichnis leer ist.
- Stellt A2UI außerdem unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Neustart des Gateway.
- Deaktivieren Sie Live Reload für große Verzeichnisse oder bei `EMFILE`-Fehlern.

---

## Erkennung

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (Standard, wenn das gebündelte `bonjour`-Plugin aktiviert ist): `cliPath` + `sshPort` aus TXT-Records auslassen.
- `full`: `cliPath` + `sshPort` einschließen; LAN-Multicast-Advertising erfordert weiterhin, dass das gebündelte `bonjour`-Plugin aktiviert ist.
- `off`: unterdrückt LAN-Multicast-Advertising, ohne die Plugin-Aktivierung zu ändern.
- Das gebündelte `bonjour`-Plugin startet automatisch auf macOS-Hosts und ist auf Linux, Windows und containerisierten Gateway-Deployments optional aktivierbar.
- Der Hostname ist standardmäßig der Systemhostname, wenn er ein gültiges DNS-Label ist; andernfalls wird `openclaw` verwendet. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Erkennung kombinieren Sie dies mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split-DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (Inline-Umgebungsvariablen)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Inline-Umgebungsvariablen werden nur angewendet, wenn in der Prozessumgebung der Schlüssel fehlt.
- `.env`-Dateien: CWD-`.env` + `~/.openclaw/.env` (keine überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Die vollständige Vorrangreihenfolge finden Sie unter [Umgebung](/de/help/environment).

### Ersetzung von Umgebungsvariablen

Referenzieren Sie Umgebungsvariablen in jeder Konfigurationszeichenfolge mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Namen in Großbuchstaben abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Maskieren Sie mit `$${VAR}` für ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Secrets

Secret-Referenzen sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`-`id`-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`-`id`: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"`-`id`-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine durch Schrägstriche getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Zugangsdaten-Oberfläche

- Kanonische Matrix: [SecretRef-Zugangsdaten-Oberfläche](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Zugangsdatenpfade in `openclaw.json`.
- `auth-profiles.json`-Referenzen sind in Laufzeitauflösung und Audit-Abdeckung enthalten.

### Konfiguration der Secret-Provider

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Hinweise:

- Der `file`-Provider unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im singleValue-Modus `"value"` sein).
- Datei- und exec-Provider-Pfade schlagen geschlossen fehl, wenn die Windows-ACL-Prüfung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht geprüft werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads über stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, wird die Prüfung auf vertrauenswürdige Verzeichnisse auf den aufgelösten Zielpfad angewendet.
- Die `exec`-Kindumgebung ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- Secret-Referenzen werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst; danach lesen Anfragepfade nur den Snapshot.
- Die Filterung aktiver Oberflächen wird während der Aktivierung angewendet: Nicht aufgelöste Referenzen auf aktivierten Oberflächen lassen Start/Neuladen fehlschlagen, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Auth-Speicher

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Agent-spezifische Profile werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Referenzen auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Zugangsdatenmodi.
- Veraltete flache `auth-profiles.json`-Zuordnungen wie `{ "provider": { "apiKey": "..." } }` sind kein Laufzeitformat; `openclaw doctor --fix` schreibt sie in kanonische `provider:default`-API-Schlüsselprofile mit einer `.legacy-flat.*.bak`-Sicherung um.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine durch SecretRef gestützten Zugangsdaten für Auth-Profile.
- Statische Laufzeit-Zugangsdaten stammen aus aufgelösten In-Memory-Snapshots; veraltete statische `auth.json`-Einträge werden bereinigt, wenn sie gefunden werden.
- Veraltete OAuth-Importe stammen aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Secrets-Laufzeitverhalten und `audit/configure/apply`-Werkzeuge: [Secrets-Verwaltung](/de/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil aufgrund echter
  Abrechnungs-/Guthabenmangel-Fehler fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  auch bei `401`-/`403`-Antworten weiterhin hier landen, aber providerspezifische Text-
  Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Nutzungsfenster- oder
  Ausgabenlimitmeldungen für Organisation/Workspace bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale Überschreibungen pro Provider für Abrechnungs-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Abrechnungs-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochzuverlässige `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Backoff-Wachstum von `auth_permanent` (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Auth-Profil-Rotationen beim selben Provider für Überlastungsfehler vor dem Wechsel zum Modell-Fallback (Standard: `1`). Provider-Busy-Formen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor einem erneuten Versuch einer überlasteten Provider-/Profil-Rotation (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Auth-Profil-Rotationen beim selben Provider für Rate-Limit-Fehler vor dem Wechsel zum Modell-Fallback (Standard: `1`). Dieser Rate-Limit-Bucket enthält providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Protokollierung

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Standard-Protokolldatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird bei `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Größe der aktiven Protokolldatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei.
- `redactSensitive` / `redactPatterns`: Best-Effort-Maskierung für Konsolenausgabe, Dateiprotokolle, OTLP-Protokolldatensätze und persistierten Sitzungstranskripttext. `redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkript-Richtlinie; UI-/Tool-/Diagnosesicherheitsflächen schwärzen Secrets weiterhin vor der Ausgabe.

---

## Diagnose

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: Hauptschalter für Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings, die gezielte Protokollausgabe aktivieren (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersgrenzwert ohne Fortschritt in ms zur Klassifizierung lang laufender Verarbeitungssitzungen als `session.long_running`, `session.stalled` oder `session.stuck`. Antwort-, Tool-, Status-, Block- und ACP-Fortschritt setzen den Timer zurück; wiederholte `session.stuck`-Diagnosen führen unverändert einen Backoff aus.
- `stuckSessionAbortMs`: Altersgrenzwert ohne Fortschritt in ms, bevor geeignete blockierte aktive Arbeit zur Wiederherstellung per Abort-Drain beendet werden darf. Wenn nicht gesetzt, verwendet OpenClaw das sicherere erweiterte Fenster für eingebettete Läufe von mindestens 10 Minuten und 5x `stuckSessionWarnMs`.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale signalspezifische OTLP-Endpunkte. Wenn gesetzt, überschreiben sie `otel.endpoint` nur für dieses Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Protokollexport aktivieren.
- `otel.sampleRate`: Trace-Samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodisches Telemetrie-Flush-Intervall in ms.
- `otel.captureContent`: Opt-in-Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Boolean `true` erfasst Nicht-System-Nachrichten-/Tool-Inhalte; die Objektform lässt Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` und `systemPrompt` explizit aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungs-Umschalter für neueste experimentelle GenAI-Span-Provider-Attribute. Standardmäßig behalten Spans aus Kompatibilitätsgründen das Legacy-Attribut `gen_ai.system`; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungs-Umschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann Start/Shutdown des plugin-eigenen SDK, während Diagnoselistener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der passende Konfigurationsschlüssel nicht gesetzt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Läufe protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in die Cache-Trace-Ausgabe aufgenommen wird (alle Standard: `true`).

---

## Aktualisierung

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: Release-Kanal für npm-/Git-Installationen - `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway auf npm-Updates prüfen (Standard: `true`).
- `auto.enabled`: automatische Hintergrundaktualisierung für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: Mindestverzögerung in Stunden vor automatischer Anwendung im Stable-Kanal (Standard: `6`; Max.: `168`).
- `auto.stableJitterHours`: zusätzliches Rollout-Streuungsfenster des Stable-Kanals in Stunden (Standard: `12`; Max.: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; Max.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globales ACP-Feature-Gate (Standard: `true`; setzen Sie `false`, um ACP-Dispatch und Spawn-Bedienelemente auszublenden).
- `dispatch.enabled`: unabhängiges Gate für ACP-Sitzungs-Turn-Dispatch (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: Standard-ACP-Runtime-Backend-ID (muss mit einem registrierten ACP-Runtime-Plugin übereinstimmen).
  Installieren Sie zuerst das Backend-Plugin, und falls `plugins.allow` gesetzt ist, nehmen Sie die Backend-Plugin-ID auf (zum Beispiel `acpx`), sonst wird das ACP-Backend nicht geladen.
- `defaultAgent`: Fallback-ACP-Ziel-Agent-ID, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Leerlauf-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der gestreamten Blockprojektion.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl von Assistenten-Ausgabezeichen, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Aktualisierungszeilen.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Leerlauf-TTL in Minuten für ACP-Sitzungs-Worker vor geeigneter Bereinigung.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrapping einer ACP-Runtime-Umgebung ausgeführt wird.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` steuert den Stil der Banner-Tagline:
  - `"random"` (Standard): rotierende lustige/saisonale Taglines.
  - `"default"`: feste neutrale Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Bannertitel/-version wird weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Metadaten, die von geführten CLI-Einrichtungsabläufen geschrieben werden (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identität

Siehe Identitätsfelder von `agents.list` unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (Legacy, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Legacy-Bridge-Konfiguration (historische Referenz)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Ausführungssitzungen aufbewahrt werden, bevor sie aus `sessions.json` bereinigt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Ausführungsprotokolldatei (`cron/runs/<jobId>.jsonl`) vor der Bereinigung. Standard: `2_000_000` Bytes.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn die Bereinigung des Ausführungsprotokolls ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token für die Cron-Webhook-POST-Zustellung (`delivery.mode = "webhook"`); wenn ausgelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die noch `notify: true` haben.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maximale Anzahl von Wiederholungen für einmalige Jobs bei vorübergehenden Fehlern (Standard: `3`; Bereich: `0`-`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1-10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle vorübergehenden Typen zu wiederholen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Fehlerwarnungen für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, min.: `1`).
- `cooldownMs`: Mindestanzahl an Millisekunden zwischen wiederholten Warnungen für denselben Job (nichtnegative Ganzzahl).
- `includeSkipped`: aufeinanderfolgende übersprungene Ausführungen auf den Warnschwellenwert anrechnen (Standard: `false`). Übersprungene Ausführungen werden separat nachverfolgt und wirken sich nicht auf den Backoff bei Ausführungsfehlern aus.
- `mode`: Zustellmodus - `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID zur Eingrenzung der Warnungszustellung.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Standardziel für Cron-Fehlerbenachrichtigungen über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; ist standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanalüberschreibung für die `announce`-Zustellung. `"last"` verwendet den zuletzt bekannten Zustellungskanal wieder.
- `to`: explizites `announce`-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- Pro Job überschreibt `delivery.failureDestination` diesen globalen Standard.
- Wenn weder ein globales noch ein pro Job festgelegtes Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, bei einem Fehler auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.

---

## Vorlagenvariablen für Medienmodelle

Vorlagenplatzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext        |
| `{{RawBody}}`      | Rohtext (keine Verlaufs-/Absender-Wrapper)       |
| `{{BodyStripped}}` | Text ohne Gruppenerwähnungen                     |
| `{{From}}`         | Absenderkennung                                  |
| `{{To}}`           | Zielkennung                                      |
| `{{MessageSid}}`   | Kanalnachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                           |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde  |
| `{{MediaUrl}}`     | Eingehende Medien-Pseudo-URL                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                               |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                |
| `{{Transcript}}`   | Audiotranskript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste max. Ausgabezeichen für CLI-Einträge  |
| `{{ChatType}}`     | `"direct"` oder `"group"`                        |
| `{{GroupSubject}}` | Gruppenbetreff (bestmöglich)                     |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (bestmöglich)     |
| `{{SenderName}}`   | Anzeigename des Absenders (bestmöglich)          |
| `{{SenderE164}}`   | Telefonnummer des Absenders (bestmöglich)        |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Config-Includes (`$include`)

Config auf mehrere Dateien aufteilen:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Merge-Verhalten:**

- Einzelne Datei: ersetzt das enthaltende Objekt.
- Array von Dateien: wird in Reihenfolge tief zusammengeführt (spätere überschreiben frühere).
- Geschwisterschlüssel: werden nach Includes zusammengeführt (überschreiben eingeschlossene Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einschließenden Datei aufgelöst, müssen aber innerhalb des obersten Config-Verzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur zulässig, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden.
- OpenClaw-eigene Schreibvorgänge, die nur einen obersten Abschnitt ändern, der durch einen Einzeldatei-Include gestützt wird, schreiben in diese eingeschlossene Datei durch. Beispielsweise aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit Geschwisterüberschreibungen sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen geschlossen fehl, statt die Config zu verflachen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
