---
read_when:
    - Sie benötigen exakte feldbezogene Konfigurationssemantik oder Standardwerte
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateway oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystemreferenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-07-03T23:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernkonfigurationsreferenz für `~/.openclaw/openclaw.json`. Eine aufgabenorientierte Übersicht finden Sie unter [Konfiguration](/de/gateway/configuration).

Deckt die wichtigsten OpenClaw-Konfigurationsoberflächen ab und verweist weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Kanal- und Plugin-eigene Befehlskataloge sowie tiefe Speicher-/QMD-Regler befinden sich auf eigenen Seiten statt auf dieser.

Code-Wahrheit:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird; gebündelte/Plugin-/Kanal-Metadaten werden zusammengeführt, wenn verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen Schemaknoten für Drill-down-Werkzeuge zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schema-Oberfläche

Agent-Suchpfad: Verwenden Sie die `gateway`-Tool-Aktion `config.schema.lookup` für
exakte feldbezogene Dokumentation und Einschränkungen vor Änderungen. Verwenden Sie
[Konfiguration](/de/gateway/configuration) für aufgabenorientierte Anleitung und diese Seite
für die breitere Feldübersicht, Standardwerte und Links zu Subsystemreferenzen.

Dedizierte Detailreferenzen:

- [Referenz zur Speicherkonfiguration](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas sind erlaubt). Alle Felder sind optional - OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Kanalspezifische Konfigurationsschlüssel wurden auf eine eigene Seite verschoben - siehe
[Konfiguration - Kanäle](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Kanäle (Authentifizierung, Zugriffskontrolle, Multi-Account, Mention-Gating).

## Agent-Standards, Multi-Agent, Sitzungen und Nachrichten

Auf eine eigene Seite verschoben - siehe
[Konfiguration - Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Denken, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.consultThinkingLevel`: Thinking-Level-Override für den vollständigen OpenClaw-Agentenlauf hinter Control-UI-Talk-Echtzeitkonsultationen
  - `talk.consultFastMode`: einmaliger Fast-Mode-Override für Control-UI-Talk-Echtzeitkonsultationen
  - `talk.speechLocale`: optionale BCP-47-Locale-ID für Talk-Spracherkennung unter iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, behält Talk das plattformübliche Standard-Pausenfenster bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-Relay-Fallback für finalisierte Echtzeit-Talk-Transkripte, die `openclaw_agent_consult` überspringen

## Tools und benutzerdefinierte Provider

Tool-Richtlinie, experimentelle Umschalter, Provider-gestützte Tool-Konfiguration und
benutzerdefinierter Provider-/Base-URL-Setup wurden auf eine eigene Seite verschoben - siehe
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Allowlists und benutzerdefinierter Provider-Setup befinden sich unter
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Der Root `models` besitzt außerdem globales Modellkatalogverhalten.

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
  startet, nachdem Sidecars und Kanäle den Gateway-Bereitpfad erreicht haben. Wenn `false`,
  überspringt der Gateway OpenRouter- und LiteLLM-Pricing-Katalogabrufe; konfigurierte
  `models.providers.*.models[].cost`-Werte funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem OpenClaw und anderen Runtime-Adaptern konsumiert. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne während der Konfigurationsänderungen eine Verbindung zum
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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
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
- `mcp.servers.<name>.enabled`: auf `false` setzen, um eine gespeicherte Serverdefinition
  beizubehalten, sie aber aus der eingebetteten OpenClaw-MCP-Erkennung und Tool-Projektion auszuschließen.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: MCP-Anfrage-Timeout pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: Verbindungs-Timeout pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionaler Nebenläufigkeitshinweis für
  Adapter, die wählen können, ob parallele MCP-Tool-Aufrufe ausgegeben werden.
- `mcp.servers.<name>.auth`: auf `"oauth"` setzen für HTTP-MCP-Server, die
  OAuth erfordern. Führen Sie `openclaw mcp login <name>` aus, um Tokens im OpenClaw-State zu speichern.
- `mcp.servers.<name>.oauth`: optionale Overrides für OAuth-Scope, Redirect-URL und Client-
  Metadaten-URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP-TLS-Steuerungen
  für private Endpunkte und gegenseitiges TLS.
- `mcp.servers.<name>.toolFilter`: optionale Tool-Auswahl pro Server. `include`
  begrenzt die erkannten MCP-Tools auf passende Namen; `exclude` blendet passende
  Namen aus. Einträge sind exakte MCP-Tool-Namen oder einfache `*`-Globs. Server mit
  Ressourcen oder Prompts erzeugen außerdem Utility-Tool-Namen (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), und diese Namen verwenden denselben
  Filter.
- `mcp.servers.<name>.codex`: optionale Projektionssteuerungen für den Codex-App-Server.
  Dieser Block ist OpenClaw-Metadaten nur für Codex-App-Server-Threads; er wirkt sich nicht auf
  ACP-Sitzungen, generische Codex-Harness-Konfiguration oder andere Runtime-Adapter aus.
  Nicht leere `codex.agents` begrenzen den Server auf die aufgeführten OpenClaw-Agenten-IDs.
  Leere, blanke oder ungültig eingeschränkte Agentenlisten werden von der Konfigurationsvalidierung
  abgelehnt und vom Runtime-Projektionspfad ausgelassen, statt global zu werden.
  `codex.defaultToolsApprovalMode` gibt Codex' natives
  `default_tools_approval_mode` für diesen Server aus. OpenClaw entfernt den `codex`-
  Block, bevor die native `mcp_servers`-Konfiguration an Codex übergeben wird. Lassen Sie den Block weg, um
  den Server für jeden Codex-App-Server-Agenten mit Codex' standardmäßigem
  MCP-Genehmigungsverhalten zu projizieren.
- `mcp.sessionIdleTtlMs`: Idle-TTL für sitzungsbezogene gebündelte MCP-Runtimes.
  Einmalige eingebettete Läufe fordern Bereinigung am Laufende an; diese TTL ist die Absicherung für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden durch Entsorgen zwischengespeicherter sitzungsbezogener MCP-Runtimes heiß angewendet.
  Die nächste Tool-Erkennung/-Nutzung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  `mcp.servers`-Einträge sofort bereinigt werden, statt auf die Idle-TTL zu warten.
- Die Runtime-Erkennung berücksichtigt außerdem Änderungsbenachrichtigungen für MCP-Tool-Listen, indem sie
  den zwischengespeicherten Katalog für diese Sitzung verwirft. Server, die Ressourcen oder
  Prompts ankündigen, erhalten Utility-Tools zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen
  von Prompts. Wiederholte Tool-Aufruf-Fehler pausieren den betroffenen Server kurz, bevor
  ein weiterer Aufruf versucht wird.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Arbeitsbereich-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche geteilte Skill-Roots (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige reale Ziel-Roots, in die Skill-Symlinks
  aufgelöst werden dürfen, wenn der Link außerhalb seines konfigurierten Quell-Roots liegt.
- `workshop.allowSymlinkTargetWrites`: erlaubt Skill Workshop Apply, durch bereits
  vertrauenswürdige Symlink-Ziele zu schreiben (Standard: false).
- `install.preferBrew`: wenn true, Homebrew-Installer bevorzugen, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Typen zurückgefallen wird.
- `install.nodeManager`: Node-Installer-Präferenz für `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: vertrauenswürdigen `operator.admin`-Gateway-
  Clients erlauben, private Zip-Archive zu installieren, die über `skills.upload.*`
  bereitgestellt wurden (Standard: false). Dies aktiviert nur den Uploaded-Archive-Pfad; normale ClawHub-
  Installationen benötigen dies nicht.
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfunktion für Skills, die eine primäre Umgebungsvariable deklarieren (Klartext-String oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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

- Geladen aus Paket- oder Bundle-Verzeichnissen unter `~/.openclaw/extensions` und `<workspace>/.openclaw/extensions` sowie aus Dateien oder Verzeichnissen, die in `plugins.load.paths` aufgeführt sind.
- Legen Sie eigenständige Plugin-Dateien in `plugins.load.paths` ab; automatisch erkannte Erweiterungs-Roots ignorieren `.js`-, `.mjs`- und `.ts`-Dateien auf oberster Ebene, damit Hilfsskripte in diesen Roots den Start nicht blockieren.
- Die Erkennung akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles mit Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Positivliste (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Zuordnung von Umgebungsvariablen.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert Prompt-verändernde Felder aus dem Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` beibehalten werden. Gilt für native Plugin-Hooks und unterstützte von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wenn `true`, dürfen vertrauenswürdige nicht gebündelte Plugins rohe Gesprächsinhalte aus typisierten Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertraut diesem Plugin ausdrücklich, pro Lauf `provider`- und `model`-Überschreibungen für Hintergrund-Subagent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Positivliste kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Überschreibungen. Verwenden Sie `"*"` nur, wenn Sie absichtlich jedes Modell erlauben möchten.
- `plugins.entries.<id>.llm.allowModelOverride`: vertraut diesem Plugin ausdrücklich, Modellüberschreibungen für `api.runtime.llm.complete` anzufordern.
- `plugins.entries.<id>.llm.allowedModels`: optionale Positivliste kanonischer `provider/model`-Ziele für vertrauenswürdige Plugin-LLM-Completion-Überschreibungen. Verwenden Sie `"*"` nur, wenn Sie absichtlich jedes Modell erlauben möchten.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: vertraut diesem Plugin ausdrücklich, `api.runtime.llm.complete` mit einer nicht standardmäßigen Agent-ID auszuführen.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- Konto-/Laufzeiteinstellungen von Kanal-Plugins befinden sich unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten des Manifests des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistrierung.

### Konfiguration des Codex-Harness-Plugins

Das gebündelte `codex`-Plugin verwaltet native Codex-App-Server-Harness-Einstellungen unter
`plugins.entries.codex.config`. Die vollständige Konfigurationsoberfläche finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference), das Laufzeitmodell unter [Codex-Harness](/de/plugins/codex-harness).

`codexPlugins` gilt nur für Sitzungen, die den nativen Codex-Harness auswählen.
Es aktiviert keine Codex-Plugins für OpenClaw-Provider-Läufe, ACP-Gesprächsbindungen
oder andere Nicht-Codex-Harnesses.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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
  Plugin-/App-Unterstützung für den Codex-Harness. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  Standardrichtlinie für destruktive Aktionen bei migrierten Plugin-App-Anfragen.
  Verwenden Sie `true`, um sichere Codex-Genehmigungsschemas ohne Nachfrage zu akzeptieren, `false`,
  um sie abzulehnen, `"auto"`, um von Codex erforderliche Genehmigungen über OpenClaw-
  Plugin-Genehmigungen zu leiten, oder `"ask"`, um bei jeder schreibenden/destruktiven
  Plugin-Aktion ohne dauerhafte Genehmigung nachzufragen. Der Modus `"ask"` löscht dauerhafte Codex-
  Genehmigungsüberschreibungen pro Tool für die betroffene App und wählt den menschlichen
  Genehmigungsprüfer für diese App aus, bevor der Codex-Thread startet.
  Standard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: aktiviert einen
  migrierten Plugin-Eintrag, wenn das globale `codexPlugins.enabled` ebenfalls wahr ist.
  Standard: `true` für explizite Einträge.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabile Marketplace-Identität. V1 unterstützt nur `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabile
  Codex-Plugin-Identität aus der Migration, zum Beispiel `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Überschreibung für destruktive Aktionen pro Plugin. Wenn ausgelassen, wird der globale
  Wert `allow_destructive_actions` verwendet. Der Wert pro Plugin akzeptiert dieselben
  Richtlinien `true`, `false`, `"auto"` oder `"ask"`.

Jede zugelassene Plugin-App, die `"ask"` verwendet, leitet die Genehmigungsanfragen dieser App
an den menschlichen Prüfer weiter. Andere Apps und Nicht-App-Thread-Genehmigungen behalten ihren
konfigurierten Prüfer, sodass gemischte Plugin-Richtlinien das `"ask"`-Verhalten nicht übernehmen.

`codexPlugins.enabled` ist die globale Aktivierungsdirektive. Explizite Plugin-
Einträge, die durch die Migration geschrieben werden, sind die dauerhafte Installations- und Reparatur-Eignungsmenge.
`plugins["*"]` wird nicht unterstützt, es gibt keinen `install`-Schalter, und lokale
`marketplacePath`-Werte sind absichtlich keine Konfigurationsfelder, da sie
host-spezifisch sind.

`app/list`-Bereitschaftsprüfungen werden eine Stunde lang zwischengespeichert und
asynchron aktualisiert, wenn sie veraltet sind. Die Codex-Thread-App-Konfiguration wird beim Aufbau der Codex-Harness-
Sitzung berechnet, nicht bei jedem Turn; verwenden Sie `/new`, `/reset` oder einen Gateway-
Neustart, nachdem Sie die native Plugin-Konfiguration geändert haben.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Web-Fetch-Provider-Einstellungen.
  - `apiKey`: Optionaler Firecrawl-API-Schlüssel für höhere Limits (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte zeigen).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Zeitlimit für Scrape-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet wird (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Memory-Dreaming-Einstellungen. Phasen und Schwellenwerte finden Sie unter [Dreaming](/de/concepts/dreaming).
  - `enabled`: Hauptschalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Takt für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - `model`: optionale Modellüberschreibung für Dream-Diary-Subagent. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; kombinieren Sie dies mit `allowedModels`, um Ziele einzuschränken. Fehler wegen nicht verfügbarem Modell werden einmal mit dem Standardsitzungsmodell wiederholt; Vertrauens- oder Positivlistenfehler fallen nicht stillschweigend zurück.
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration befindet sich in der [Referenz zur Memory-Konfiguration](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können außerdem eingebettete OpenClaw-Standardeinstellungen aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: wählen Sie die aktive Memory-Plugin-ID oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: wählen Sie die aktive Kontext-Engine-Plugin-ID; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

---

## Zusagen

`commitments` steuert abgeleitetes Follow-up-Memory: OpenClaw kann Check-ins aus Gesprächs-Turns erkennen und sie über Heartbeat-Läufe zustellen.

- `commitments.enabled`: aktiviert versteckte LLM-Extraktion, Speicherung und Heartbeat-Zustellung für abgeleitete Follow-up-Zusagen. Standard: `false`.
- `commitments.maxPerDay`: maximale Anzahl abgeleiteter Follow-up-Zusagen, die pro Agent-Sitzung an einem rollierenden Tag zugestellt werden. Standard: `3`.

Siehe [Abgeleitete Zusagen](/de/concepts/commitments).

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
- `tabCleanup` gibt nach Leerlaufzeit oder wenn eine Sitzung ihre Obergrenze
  überschreitet, nachverfolgte Tabs des primären Agenten frei. Setzen Sie
  `idleMinutes: 0` oder `maxTabsPerSession: 0`, um diese einzelnen
  Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass die Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browser-Navigation im privaten Netzwerk absichtlich vertrauen.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen derselben Blockierung privater Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen vorgesehen (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden
  Sie WS(S), wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für Remote- und
  `attachOnly`-CDP-Erreichbarkeit sowie Anfragen zum Öffnen von Tabs. Verwaltete
  local loopback-Profile behalten lokale CDP-Standardwerte bei.
- Wenn ein extern verwalteter CDP-Dienst über local loopback erreichbar ist,
  setzen Sie für dieses Profil `attachOnly: true`; andernfalls behandelt OpenClaw
  den local loopback-Port als lokal verwaltetes Browserprofil und meldet
  möglicherweise Fehler zur lokalen Port-Zuständigkeit.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` festlegen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusteuern.
- `existing-session`-Profile können `cdpUrl` festlegen, wenn Chrome bereits
  hinter einem DevTools-HTTP(S)-Discovery-Endpunkt oder einem direkten
  WS(S)-Endpunkt läuft. In diesem Modus übergibt OpenClaw den Endpunkt an Chrome
  MCP, statt Auto-Connect zu verwenden; `userDataDir` wird für
  Chrome-MCP-Startargumente ignoriert.
- `existing-session`-Profile behalten die aktuellen Routenbeschränkungen von
  Chrome MCP bei: Snapshot-/Ref-gesteuerte Aktionen statt CSS-Selektor-Targeting,
  Hooks für Ein-Datei-Uploads, keine Dialog-Timeout-Überschreibungen, kein
  `wait --load networkidle` und keine `responsebody`, kein PDF-Export, keine
  Download-Abfangung und keine Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch
  zu; setzen Sie `cdpUrl` nur für Remote-CDP-Profile oder das Anhängen an einen
  existing-session-Endpunkt explizit.
- Lokal verwaltete Profile können `executablePath` festlegen, um das globale
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies,
  um ein Profil in Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die
  Chrome-CDP-HTTP-Discovery nach dem Prozessstart und
  `browser.localCdpReadyTimeoutMs` für die CDP-WebSocket-Bereitschaft nach dem
  Start. Erhöhen Sie diese Werte auf langsameren Hosts, auf denen Chrome
  erfolgreich startet, Bereitschaftsprüfungen den Start aber überholen. Beide
  Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
  Konfigurationswerte werden abgelehnt.
- Reihenfolge der automatischen Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath`
  akzeptieren beide `~` und `~/...` für das Home-Verzeichnis Ihres Betriebssystems
  vor dem Chromium-Start. Profilbezogenes `userDataDir` in `existing-session`-Profilen
  wird ebenfalls mit Tilde erweitert.
- Steuerungsdienst: nur local loopback (Port von `gateway.port` abgeleitet, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an
  (zum Beispiel `--disable-gpu`, Fenstergrößen oder Debug-Flags).

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

- `seamColor`: Akzentfarbe für den nativen App-UI-Rahmen (Talk-Mode-Blasentönung usw.).
- `assistant`: Überschreibung der Control-UI-Identität. Fällt auf die aktive Agentenidentität zurück.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Gateway startet nur, wenn `local` gesetzt ist.
- `port`: einzelner multiplexter Port für WS + HTTP. Rangfolge: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das standardmäßige `loopback`-Bind lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt Traffic auf `eth0` an, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Auth. Praktisch bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent generiert standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` ausdrücklich auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: ausdrücklicher Modus ohne Auth. Nur für vertrauenswürdige lokale local loopback-Setups verwenden; dies wird in Onboarding-Eingabeaufforderungen absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Browser-/Benutzer-Auth an einen identitätsbewussten Reverse Proxy delegieren und Identitäts-Header von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine **Nicht-Loopback**-Proxy-Quelle; Same-Host-Loopback-Reverse-Proxies erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Same-Host-Aufrufer können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem trusted-proxy-Modus gegenseitig exklusiv.
- `gateway.auth.allowTailscale`: Wenn `true`, können Tailscale-Serve-Identitäts-Header die Auth für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Standardmäßig `true`, wenn `tailscale.mode = "serve"` gesetzt ist.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Auth. Gilt pro Client-IP und pro Auth-Bereich (shared-secret und device-token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige ungültige Versuche vom selben Client können den Limiter daher bei der zweiten Anfrage auslösen, statt dass beide nur als einfache Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie es auf `false`, wenn Sie localhost-Traffic absichtlich ebenfalls rate-limitieren möchten (für Test-Setups oder strikte Proxy-Deployments).
- Browser-Origin-WS-Auth-Versuche werden immer gedrosselt, mit deaktivierter Loopback-Ausnahme (Defense-in-Depth gegen browserbasierte localhost-Brute-Force-Angriffe).
- Bei Loopback sind diese Browser-Origin-Sperren pro normalisiertem `Origin`
  Wert isoliert, sodass wiederholte Fehler von einem localhost-Origin nicht automatisch
  einen anderen Origin sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Auth).
- `tailscale.serviceName`: optionaler Tailscale-Service-Name für den Serve-Modus, etwa
  `svc:openclaw`. Wenn gesetzt, übergibt OpenClaw ihn an `tailscale serve
--service`, damit die Control UI über einen benannten Service statt
  über den Geräte-Hostnamen bereitgestellt werden kann. Der Wert muss Tailscales Service-Namensformat `svc:<dns-label>`
  verwenden; beim Start wird die abgeleitete Service-URL gemeldet.
- `tailscale.preserveFunnel`: Wenn `true` und `tailscale.mode = "serve"` gesetzt ist, prüft OpenClaw
  vor dem erneuten Anwenden von Serve beim Start `tailscale funnel status` und überspringt
  dies, wenn eine extern konfigurierte Funnel-Route den Gateway-Port bereits abdeckt.
  Standard `false`.
- `controlUi.allowedOrigins`: ausdrückliche Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich für öffentliche Nicht-Loopback-Browser-Origins. Private Same-Origin-LAN-/Tailnet-UI-Loads von Loopback, RFC1918/Link-Local, `.local`, `.ts.net` oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne Host-Header-Fallback zu aktivieren.
- `controlUi.chatMessageMaxWidth`: optionale maximale Breite für gruppierte Control-UI-Chatnachrichten. Akzeptiert eingeschränkte CSS-Breitenwerte wie `960px`, `82%`, `min(1280px, 82%)` und `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die sich absichtlich auf Host-Header-Origin-Richtlinien verlassen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` bei öffentlichen Hosts `wss://` sein; Klartext-`ws://` wird nur für Loopback, LAN, Link-Local, `.local`, `.ts.net` und Tailscale-CGNAT-Hosts akzeptiert.
- `remote.remotePort`: Gateway-Port auf dem entfernten SSH-Host. Standardmäßig `18789`; verwenden Sie dies, wenn sich der lokale Tunnel-Port vom entfernten Gateway-Port unterscheidet.
- `remote.sshHostKeyPolicy`: macOS-SSH-Tunnel-Host-Key-Richtlinie. `strict` ist der Standard und erfordert einen bereits vertrauenswürdigen Schlüssel. `openssh` ist ein ausdrückliches Opt-in in die effektive OpenSSH-Konfiguration für verwaltete Aliasse; prüfen Sie passende Benutzer- und System-SSH-Einstellungen, bevor Sie es verwenden. Die macOS-App und `configure-remote` setzen diese Richtlinie beim Ändern von Zielen auf `strict` zurück, sofern nicht erneut ausdrücklich zugestimmt wird.
- `gateway.remote.token` / `.password` sind Zugangsdatenfelder für Remote-Clients. Sie konfigurieren Gateway-Auth nicht eigenständig.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das verwendet wird, nachdem relaygestützte iOS-Builds Registrierungen im Gateway veröffentlicht haben. Öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay. Benutzerdefinierte Relay-URLs müssen zu einem bewusst getrennten iOS-Build-/Deployment-Pfad passen, dessen Relay-URL auf dieses Relay zeigt.
- `gateway.push.apns.relay.timeoutMs`: Gateway-zu-Relay-Sende-Timeout in Millisekunden. Standardmäßig `10000`.
- Relaygestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet eine registrierungsbezogene Sendeberechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung vorgesehene Ausweichoption für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.handshakeTimeoutMs`: Pre-Auth-Gateway-WebSocket-Handshake-Timeout in Millisekunden. Standard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat Vorrang, wenn gesetzt. Erhöhen Sie dies auf ausgelasteten oder leistungsschwachen Hosts, auf denen lokale Clients eine Verbindung herstellen können, während die Startaufwärmung noch abschließt.
- `gateway.channelHealthCheckMinutes`: Intervall des Channel-Health-Monitors in Minuten. Setzen Sie `0`, um Health-Monitor-Neustarts global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Health-Monitor-Neustarts pro Channel/Konto in einer rollierenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Opt-out pro Channel für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Override pro Konto für Multi-Account-Channels. Wenn gesetzt, hat dies Vorrang vor dem Override auf Channel-Ebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` ausdrücklich über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder Forwarded-Client-Header injizieren. Listen Sie nur Proxies auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Same-Host-Proxy-/Local-Detection-Setups gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse Proxy), machen Loopback-Anfragen aber **nicht** für `gateway.auth.mode: "trusted-proxy"` berechtigt.
- `allowRealIpFallback`: Wenn `true`, akzeptiert das Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR/IP-Allowlist zum automatischen Genehmigen erstmaliger Node-Gerätekopplungen ohne angeforderte Scopes. Sie ist deaktiviert, wenn nicht gesetzt. Dies genehmigt keine Operator-/Browser-/Control-UI-/WebChat-Kopplung automatisch und genehmigt auch keine Rollen-, Scope-, Metadaten- oder Public-Key-Upgrades automatisch.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Allow-/Deny-Formung für deklarierte Node-Befehle nach Kopplung und Plattform-Allowlist-Auswertung. Verwenden Sie `allowCommands`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip` und `screen.record` freizuschalten; `denyCommands` entfernt einen Befehl, selbst wenn ein Plattformstandard oder explizites Allow ihn sonst einschließen würde. Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie diese Gerätekopplung ab und genehmigen Sie sie erneut, damit das Gateway den aktualisierten Befehls-Snapshot speichert.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die standardmäßige Deny-Liste).
- `gateway.tools.allow`: entfernt Tool-Namen aus der standardmäßigen HTTP-Deny-Liste für
  Owner-/Admin-Aufrufer. Dies stuft identitätstragende `operator.write`
  Aufrufer nicht auf Owner-/Admin-Zugriff hoch; `cron`, `gateway` und `nodes` bleiben
  für Nicht-Owner-Aufrufer nicht verfügbar, auch wenn sie auf der Allowlist stehen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Admin-HTTP-RPC: standardmäßig als `admin-http-rpc`-Plugin deaktiviert. Aktivieren Sie das Plugin, um `POST /api/v1/admin/rpc` zu registrieren. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung für Responses-URL-Eingaben:
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
- `autoGenerate`: generiert automatisch ein lokales selbstsigniertes Zertifikat/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/Dev-Nutzung.
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
- `debounceMs`: Entprellfenster in ms, bevor Konfigurationsänderungen angewendet werden (nicht negative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms für laufende Vorgänge, bevor ein Neustart oder Channel-Hot-Reload erzwungen wird. Lassen Sie den Wert weg, um die standardmäßige begrenzte Wartezeit (`300000`) zu verwenden; setzen Sie ihn auf `0`, um unbegrenzt zu warten und regelmäßig Warnungen zu noch ausstehenden Vorgängen zu protokollieren.

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

Auth: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in Query-Strings werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` sollte sich von der aktiven Gateway-Shared-Secret-Auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) unterscheiden; beim Start wird eine nicht fatale Sicherheitswarnung protokolliert, wenn eine Wiederverwendung erkannt wird.
- `openclaw security audit` kennzeichnet die Wiederverwendung von Hook-/Gateway-Auth als kritischen Befund, einschließlich Gateway-Passwort-Auth, die nur zur Audit-Zeit angegeben wird (`--auth password --password <password>`). Führen Sie `openclaw doctor --fix` aus, um ein persistiertes, wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Sender so, dass sie das neue Hook-Token verwenden.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true` ist, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern diese explizite Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus dem Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` ist (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Per Template gerenderte Mapping-`sessionKey`-Werte werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping-Details">

- `match.path` stimmt mit dem Unterpfad nach `/hooks` überein (z. B. `/hooks/gmail` → `gmail`).
- `match.source` stimmt mit einem Payload-Feld für generische Pfade überein.
- Templates wie `{{messages[0].subject}}` lesen aus dem Payload.
- `transform` kann auf ein JS-/TS-Modul verweisen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
  - Belassen Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Workspace-Skill-Verzeichnisse werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transform-Modul in das Hook-Transforms-Verzeichnis oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf den Standardagenten zurück.
- `allowedAgentIds`: beschränkt das effektive Agent-Routing, einschließlich des Standardagentenpfads, wenn `agentId` weggelassen wird (`*` oder weggelassen = alle zulassen, `[]` = alle ablehnen).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt `/hooks/agent`-Aufrufern und templategesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die abschließende Antwort an einen Channel; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Pro-Nachricht-Routing beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und schränken Sie `hooks.allowedSessionKeyPrefixes` auf den Gmail-Namespace ein, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` statt des templatisierten Standards.

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

- Stellt von Agenten bearbeitbares HTML/CSS/JS und A2UI per HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Nicht-Loopback-Binds: Canvas-Routen erfordern Gateway-Auth (Token/Passwort/Trusted-Proxy), wie andere Gateway-HTTP-Oberflächen.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, bewirbt der Gateway nodebezogene Capability-URLs für Canvas-/A2UI-Zugriff.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in bereitgestelltes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn leer.
- Stellt A2UI auch unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live Reload für große Verzeichnisse oder `EMFILE`-Fehler.

---

## Discovery

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
- `full`: `cliPath` + `sshPort` einschließen; LAN-Multicast-Ankündigungen erfordern weiterhin, dass das gebündelte `bonjour`-Plugin aktiviert ist.
- `off`: LAN-Multicast-Ankündigungen unterdrücken, ohne die Plugin-Aktivierung zu ändern.
- Das gebündelte `bonjour`-Plugin startet auf macOS-Hosts automatisch und ist auf Linux, Windows und containerisierten Gateway-Deployments optional.
- Der Hostname ist standardmäßig der Systemhostname, wenn er ein gültiges DNS-Label ist; andernfalls wird `openclaw` verwendet. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery kombinieren Sie dies mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split-DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (Inline-Env-Vars)

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

- Inline-Env-Vars werden nur angewendet, wenn der Prozess-Env der Schlüssel fehlt.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Siehe [Umgebung](/de/help/environment) für die vollständige Priorität.

### Env-Var-Substitution

Referenzieren Sie Env-Vars in beliebigen Konfigurationsstrings mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Nur Großbuchstabennamen werden abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Escapen Sie mit `$${VAR}` für ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Secrets

Secret-Refs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`-ID-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`-ID: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"`-ID-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (unterstützt AWS-artige `secret#json_key`-Selektoren)
- `source: "exec"`-IDs dürfen keine durch Schrägstriche getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Credential-Oberfläche

- Kanonische Matrix: [SecretRef-Credential-Oberfläche](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte `openclaw.json`-Credential-Pfade.
- `auth-profiles.json`-Refs sind in Laufzeitauflösung und Audit-Abdeckung enthalten.

### Secret-Provider-Konfiguration

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
- Datei- und Exec-Provider-Pfade schlagen geschlossen fehl, wenn die Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zu erlauben, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, gilt die Trusted-Dir-Prüfung für den aufgelösten Zielpfad.
- Die `exec`-Child-Umgebung ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- Secret-Refs werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst; danach lesen Request-Pfade nur den Snapshot.
- Active-Surface-Filterung wird während der Aktivierung angewendet: nicht aufgelöste Refs auf aktivierten Oberflächen lassen Start/Reload fehlschlagen, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Auth-Speicher

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Profile pro Agent werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Referenzen auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- Legacy-Flachzuordnungen in `auth-profiles.json` wie `{ "provider": { "apiKey": "..." } }` sind kein Runtime-Format; `openclaw doctor --fix` schreibt sie in kanonische `provider:default`-API-Schlüsselprofile mit einem `.legacy-flat.*.bak`-Backup um.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine von SecretRef gestützten Auth-Profile-Anmeldedaten.
- Statische Runtime-Anmeldedaten stammen aus im Arbeitsspeicher aufgelösten Snapshots; Legacy-statische `auth.json`-Einträge werden entfernt, wenn sie entdeckt werden.
- Legacy-OAuth-Importe erfolgen aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Runtime-Verhalten von Secrets und `audit/configure/apply`-Werkzeuge: [Secrets-Verwaltung](/de/gateway/secrets).

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
  auch bei `401`/`403`-Antworten weiterhin hier landen, aber providerspezifische Text-
  Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Nutzungsfenster- oder
  Organisations-/Workspace-Ausgabenlimitmeldungen bleiben stattdessen im `rate_limit`-Pfad.
- `billingBackoffHoursByProvider`: optionale providerbezogene Überschreibungen für Abrechnungs-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Abrechnungs-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochzuverlässige `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für `auth_permanent`-Backoff-Wachstum (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Auth-Profilrotationen beim selben Provider für Überlastungsfehler, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Provider-Auslastungsformen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer überlasteten Provider-/Profilrotation (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Auth-Profilrotationen beim selben Provider für Rate-Limit-Fehler, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

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
- Legen Sie `logging.file` für einen stabilen Pfad fest.
- `consoleLevel` wird bei `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Größe der aktiven Protokolldatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei.
- `redactSensitive` / `redactPatterns`: Best-Effort-Maskierung für Konsolenausgabe, Dateiprotokolle, OTLP-Protokolldatensätze und persistierten Sitzungstranskripttext. `redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkriptrichtlinie; UI-/Tool-/Diagnosesicherheitsflächen schwärzen Secrets weiterhin vor der Ausgabe.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `flags`: Array von Flag-Zeichenfolgen, die gezielte Protokollausgabe aktivieren (unterstützt Platzhalter wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersgrenzwert ohne Fortschritt in ms, um lang laufende Verarbeitungssitzungen als `session.long_running`, `session.stalled` oder `session.stuck` einzustufen. Antwort-, Tool-, Status-, Block- und ACP-Fortschritt setzen den Timer zurück; wiederholte `session.stuck`-Diagnosen führen ein Backoff aus, solange sie unverändert bleiben.
- `stuckSessionAbortMs`: Altersgrenzwert ohne Fortschritt in ms, bevor geeignete blockierte aktive Arbeit zur Wiederherstellung abbruchentleert werden kann. Wenn nicht festgelegt, verwendet OpenClaw das sicherere erweiterte eingebettete Ausführungsfenster von mindestens 5 Minuten und 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: erfasst einen geschwärzten Stabilitätssnapshot vor OOM, wenn der Speicherdruck `critical` erreicht (Standard: `false`). Setzen Sie dies auf `true`, um den Scan/Schreibvorgang der Stabilitäts-Bundle-Datei hinzuzufügen, während normale Speicherdruckereignisse beibehalten werden.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale signalspezifische OTLP-Endpunkte. Wenn festgelegt, überschreiben sie `otel.endpoint` nur für dieses Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Exportanforderungen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Protokollexport aktivieren.
- `otel.logsExporter`: Ziel für Protokollexport: `"otlp"` (Standard), `"stdout"` für ein JSON-Objekt pro stdout-Zeile oder `"both"`.
- `otel.sampleRate`: Trace-Samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodisches Telemetrie-Flush-Intervall in ms.
- `otel.captureContent`: Opt-in-Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Boolean `true` erfasst Nicht-System-Nachrichten-/Tool-Inhalte; die Objektform ermöglicht Ihnen, `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` und `toolDefinitions` explizit zu aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsumschalter für die neueste experimentelle GenAI-Inferenz-Span-Form, einschließlich `{gen_ai.operation.name} {gen_ai.request.model}`-Span-Namen, `CLIENT`-Span-Art und `gen_ai.provider.name` anstelle des Legacy-`gen_ai.system`. Standardmäßig behalten Spans aus Kompatibilitätsgründen `openclaw.model.call` und `gen_ai.system`; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsumschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann den Plugin-eigenen SDK-Start/-Stopp, während Diagnoselistener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der passende Konfigurationsschlüssel nicht festgelegt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Ausführungen protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle Standard: `true`).

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

- `channel`: Release-Kanal für npm-/git-Installationen - `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway nach npm-Aktualisierungen suchen (Standard: `true`).
- `auto.enabled`: automatische Hintergrundaktualisierung für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor der automatischen Anwendung im Stable-Kanal (Standard: `6`; max.: `168`).
- `auto.stableJitterHours`: zusätzliches Rollout-Verteilungsfenster im Stable-Kanal in Stunden (Standard: `12`; max.: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; max.: `24`).

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

- `enabled`: globales ACP-Feature-Gate (Standard: `true`; auf `false` setzen, um ACP-Dispatch und Spawn-Bedienelemente auszublenden).
- `dispatch.enabled`: unabhängiges Gate für ACP-Sitzungsturn-Dispatch (Standard: `true`). Setzen Sie dies auf `false`, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: Standard-ACP-Runtime-Backend-ID (muss mit einem registrierten ACP-Runtime-Plugin übereinstimmen).
  Installieren Sie zuerst das Backend-Plugin, und wenn `plugins.allow` gesetzt ist, nehmen Sie die Backend-Plugin-ID auf (zum Beispiel `acpx`), sonst wird das ACP-Backend nicht geladen.
- `defaultAgent`: Fallback-ACP-Ziel-Agent-ID, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen zugelassen sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der gestreamten Blockprojektion.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu Turn-Terminalereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach ausgeblendeten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Ausgabezeichen des Assistenten, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Zeichenzahl für projizierte ACP-Status-/Aktualisierungszeilen.
- `stream.tagVisibility`: Datensatz von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungsworker vor berechtigter Bereinigung.
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
  - `"random"` (Standard): wechselnde lustige/saisonale Taglines.
  - `"default"`: feste neutrale Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Banner-Titel/-Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie env `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Metadaten, die von geführten CLI-Setup-Flows (`onboard`, `configure`, `doctor`) geschrieben werden:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identität

Siehe `agents.list`-Identitätsfelder unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (Legacy, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt wurden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Run-Sitzungen vor dem Entfernen aus `sessions.json` aufbewahrt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: zur Kompatibilität mit älteren dateibasierten Cron-Run-Logs akzeptiert. Standard: `2_000_000` Bytes.
- `runLog.keepLines`: neueste SQLite-Run-History-Zeilen, die pro Job beibehalten werden. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die Cron-Webhook-POST-Zustellung (`delivery.mode = "webhook"`) verwendet wird; wenn ausgelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die von `openclaw doctor --fix` verwendet wird, um gespeicherte Jobs zu migrieren, die noch `notify: true` haben; die Runtime-Zustellung verwendet pro Job `delivery.mode="webhook"` plus `delivery.to` oder `delivery.completionDestination`, wenn die Ankündigungszustellung beibehalten wird.

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

- `maxAttempts`: maximale Wiederholungen für Cron-Jobs bei transienten Fehlern (Standard: `3`; Bereich: `0`-`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1-10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle transienten Typen zu wiederholen.

Einmalige Jobs bleiben aktiviert, bis die Wiederholungsversuche ausgeschöpft sind, und werden dann deaktiviert, wobei der endgültige Fehlerzustand beibehalten wird. Wiederkehrende Jobs verwenden dieselbe transiente Wiederholungsrichtlinie, um nach dem Backoff vor ihrem nächsten geplanten Slot erneut auszuführen; permanente Fehler oder ausgeschöpfte transiente Wiederholungen fallen auf den normalen wiederkehrenden Zeitplan mit Fehler-Backoff zurück.

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

- `enabled`: Fehlerbenachrichtigungen für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor eine Benachrichtigung ausgelöst wird (positive Ganzzahl, min: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Benachrichtigungen für denselben Job (nichtnegative Ganzzahl).
- `includeSkipped`: aufeinanderfolgende übersprungene Runs auf den Benachrichtigungsschwellenwert anrechnen (Standard: `false`). Übersprungene Runs werden separat verfolgt und wirken sich nicht auf den Backoff für Ausführungsfehler aus.
- `mode`: Zustellmodus - `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID, um die Benachrichtigungszustellung einzugrenzen.

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
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanal-Override für die `announce`-Zustellung. `"last"` verwendet den letzten bekannten Zustellungskanal erneut.
- `to`: explizites `announce`-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionaler Konto-Override für die Zustellung.
- Pro Job überschreibt `delivery.failureDestination` diesen globalen Standard.
- Wenn weder globales noch jobbezogenes Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur für `sessionTarget="isolated"`-Jobs unterstützt, es sei denn, das primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Template-Variablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext        |
| `{{RawBody}}`      | Rohtext (ohne History-/Absender-Wrapper)         |
| `{{BodyStripped}}` | Text mit entfernten Gruppenerwähnungen           |
| `{{From}}`         | Absenderkennung                                  |
| `{{To}}`           | Zielkennung                                      |
| `{{MessageSid}}`   | Kanalnachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                           |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde  |
| `{{MediaUrl}}`     | Eingehende Medien-Pseudo-URL                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                               |
| `{{MediaType}}`    | Medientyp (image/audio/document/…)               |
| `{{Transcript}}`   | Audiotranskript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                        |
| `{{GroupSubject}}` | Gruppenthema (bestmöglicher Versuch)             |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (bestmöglicher Versuch) |
| `{{SenderName}}`   | Anzeigename des Absenders (bestmöglicher Versuch) |
| `{{SenderE164}}`   | Telefonnummer des Absenders (bestmöglicher Versuch) |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Config-Includes (`$include`)

Konfiguration auf mehrere Dateien aufteilen:

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
- Array von Dateien: wird der Reihenfolge nach tief zusammengeführt (spätere überschreiben frühere).
- Geschwisterschlüssel: werden nach Includes zusammengeführt (überschreiben eingeschlossene Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen aber innerhalb des obersten Konfigurationsverzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur erlaubt, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden. Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein.
- OpenClaw-eigene Schreibvorgänge, die nur einen obersten Abschnitt ändern, der durch ein Single-File-Include abgesichert ist, schreiben in diese eingeschlossene Datei durch. Beispielsweise aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit Geschwister-Overrides sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen geschlossen fehl, statt die Konfiguration zu flattenen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler, zirkuläre Includes, ungültiges Pfadformat und übermäßige Länge.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
