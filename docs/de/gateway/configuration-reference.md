---
read_when:
    - Sie benötigen exakte Konfigurationssemantik oder Standardwerte auf Feldebene
    - Sie validieren Kanal-, Modell-, Gateway- oder Tool-Konfigurationsblöcke
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystemreferenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-07-02T08:10:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernkonfigurationsreferenz für `~/.openclaw/openclaw.json`. Eine aufgabenorientierte Übersicht finden Sie unter [Konfiguration](/de/gateway/configuration).

Deckt die wichtigsten OpenClaw-Konfigurationsoberflächen ab und verweist auf weiterführende Referenzen, wenn ein Subsystem eine eigene, detailliertere Referenz hat. Channel- und Plugin-eigene Befehlskataloge sowie detaillierte Speicher-/QMD-Schalter befinden sich auf eigenen Seiten statt auf dieser.

Code-Wahrheit:

- `openclaw config schema` gibt das live verwendete JSON Schema aus, das für Validierung und Control UI genutzt wird, wobei gebündelte/Plugin-/Channel-Metadaten zusammengeführt werden, sofern verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen Schema-Knoten für Drill-down-Werkzeuge zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schema-Oberfläche

Agent-Nachschlagepfad: Verwenden Sie die `gateway`-Tool-Aktion `config.schema.lookup` für
exakte feldbezogene Dokumentation und Einschränkungen vor Bearbeitungen. Verwenden Sie
[Konfiguration](/de/gateway/configuration) für aufgabenorientierte Anleitung und diese Seite
für die breitere Feldübersicht, Standardwerte und Links zu Subsystem-Referenzen.

Dedizierte Detailreferenzen:

- [Speicherkonfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Channel-/Plugin-Seiten für channelspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas erlaubt). Alle Felder sind optional - OpenClaw verwendet sichere Standardwerte, wenn sie ausgelassen werden.

---

## Channels

Konfigurationsschlüssel pro Channel wurden auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Channels](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Channels (Authentifizierung, Zugriffskontrolle, Mehrfachkonten, Mention-Gating).

## Agent-Standardwerte, Multi-Agent, Sitzungen und Nachrichten

Auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Agents](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Thinking, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.consultThinkingLevel`: Thinking-Level-Override für den vollständigen OpenClaw-Agent-Lauf hinter Control UI Talk-Echtzeitkonsultationen
  - `talk.consultFastMode`: einmaliger Fast-Mode-Override für Control UI Talk-Echtzeitkonsultationen
  - `talk.speechLocale`: optionale BCP-47-Locale-ID für Talk-Spracherkennung auf iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, behält Talk das plattformseitige Standard-Pausenfenster vor dem Senden des Transkripts bei (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-Relay-Fallback für finalisierte Echtzeit-Talk-Transkripte, die `openclaw_agent_consult` überspringen

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Schalter, Provider-gestützte Tool-Konfiguration und Einrichtung von
benutzerdefinierten Providern / Basis-URLs wurden auf eine dedizierte Seite verschoben - siehe
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Allowlists und die Einrichtung benutzerdefinierter Provider befinden sich in
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Der Root `models` besitzt außerdem globales Verhalten des Modellkatalogs.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: Zuordnung benutzerdefinierter Provider, nach Provider-ID indiziert.
- `models.providers.*.localService`: optionaler On-Demand-Prozessmanager für
  lokale Modellserver. OpenClaw prüft den konfigurierten Health-Endpunkt, startet
  den absoluten `command` bei Bedarf, wartet auf Bereitschaft und sendet dann die Modellanfrage.
  Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- `models.pricing.enabled`: steuert den Hintergrundstart der Preisinitialisierung, die
  startet, nachdem Sidecars und Channels den Gateway-Bereit-Pfad erreicht haben. Bei `false`
  überspringt der Gateway OpenRouter- und LiteLLM-Preiskatalog-Abrufe; konfigurierte
  `models.providers.*.models[].cost`-Werte funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem OpenClaw und anderen Runtime-Adaptern genutzt. Die Befehle `openclaw mcp list`,
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
  beizubehalten, sie aber von eingebetteter OpenClaw-MCP-Discovery und Tool-Projektion auszuschließen.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: MCP-Anfrage-Timeout pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: Verbindungs-Timeout pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionaler Parallelitätshinweis für
  Adapter, die entscheiden können, ob parallele MCP-Tool-Aufrufe ausgeführt werden sollen.
- `mcp.servers.<name>.auth`: auf `"oauth"` setzen für HTTP-MCP-Server, die
  OAuth erfordern. Führen Sie `openclaw mcp login <name>` aus, um Tokens im OpenClaw-State zu speichern.
- `mcp.servers.<name>.oauth`: optionale Overrides für OAuth-Scope, Redirect-URL und Client-
  Metadaten-URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP-TLS-Steuerungen
  für private Endpunkte und gegenseitiges TLS.
- `mcp.servers.<name>.toolFilter`: optionale Tool-Auswahl pro Server. `include`
  beschränkt die entdeckten MCP-Tools auf passende Namen; `exclude` blendet passende
  Namen aus. Einträge sind exakte MCP-Tool-Namen oder einfache `*`-Globs. Server mit
  Ressourcen oder Prompts erzeugen außerdem Utility-Tool-Namen (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), und diese Namen verwenden denselben
  Filter.
- `mcp.servers.<name>.codex`: optionale Codex-App-Server-Projektionssteuerungen.
  Dieser Block ist OpenClaw-Metadaten nur für Codex-App-Server-Threads; er wirkt sich nicht
  auf ACP-Sitzungen, generische Codex-Harness-Konfiguration oder andere Runtime-Adapter aus.
  Nicht leere `codex.agents` beschränken den Server auf die aufgeführten OpenClaw-Agent-IDs.
  Leere, blanke oder ungültige scoped Agent-Listen werden von der Konfigurationsvalidierung
  abgelehnt und vom Runtime-Projektionspfad ausgelassen, statt global zu werden.
  `codex.defaultToolsApprovalMode` emittiert Codex' natives
  `default_tools_approval_mode` für diesen Server. OpenClaw entfernt den `codex`-
  Block, bevor native `mcp_servers`-Konfiguration an Codex übergeben wird. Lassen Sie den Block weg,
  um den Server für jeden Codex-App-Server-Agent mit Codex' Standard-MCP-Genehmigungsverhalten
  zu projizieren.
- `mcp.sessionIdleTtlMs`: Idle-TTL für sitzungsbezogene gebündelte MCP-Runtimes.
  Einmalige eingebettete Läufe fordern Bereinigung am Laufende an; diese TTL ist die Absicherung für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden per Hot-Apply übernommen, indem zwischengespeicherte Sitzungs-MCP-Runtimes verworfen werden.
  Die nächste Tool-Discovery/-Nutzung erstellt sie aus der neuen Konfiguration neu, sodass entfernte
  `mcp.servers`-Einträge sofort bereinigt werden, statt auf die Idle-TTL zu warten.
- Runtime-Discovery berücksichtigt außerdem MCP-Benachrichtigungen über Änderungen der Tool-Liste, indem
  der zwischengespeicherte Katalog für diese Sitzung verworfen wird. Server, die Ressourcen oder
  Prompts bewerben, erhalten Utility-Tools zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen
  von Prompts. Wiederholte Tool-Call-Fehler pausieren den betroffenen Server kurz, bevor
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

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Arbeitsbereich-Skills nicht betroffen).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Roots (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige echte Ziel-Roots, in die Skill-Symlinks
  aufgelöst werden dürfen, wenn der Link außerhalb seines konfigurierten Quell-Roots liegt.
- `workshop.allowSymlinkTargetWrites`: erlaubt Skill Workshop Apply, durch bereits
  vertrauenswürdige Symlink-Ziele zu schreiben (Standard: false).
- `install.preferBrew`: wenn true, Homebrew-Installer bevorzugen, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgefallen wird.
- `install.nodeManager`: Node-Installer-Präferenz für `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: erlaubt vertrauenswürdigen `operator.admin`-Gateway-
  Clients, private ZIP-Archive zu installieren, die über `skills.upload.*` bereitgestellt wurden
  (Standard: false). Dies aktiviert nur den Pfad für hochgeladene Archive; normale ClawHub-
  Installationen benötigen ihn nicht.
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
- `allow`: optionale Zulassungsliste (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: Komfortfeld für einen API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-bezogene Env-Var-Zuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: Wenn `false`, blockiert der Core `before_prompt_build` und ignoriert prompt-verändernde Felder aus dem Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` beibehalten werden. Gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: Wenn `true`, dürfen vertrauenswürdige, nicht gebündelte Plugins rohe Gesprächsinhalte aus typisierten Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: Diesem Plugin ausdrücklich vertrauen, pro Lauf `provider`- und `model`-Overrides für Hintergrund-Subagent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Zulassungsliste kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell erlauben möchten.
- `plugins.entries.<id>.llm.allowModelOverride`: Diesem Plugin ausdrücklich vertrauen, Modell-Overrides für `api.runtime.llm.complete` anzufordern.
- `plugins.entries.<id>.llm.allowedModels`: optionale Zulassungsliste kanonischer `provider/model`-Ziele für vertrauenswürdige LLM-Completion-Overrides von Plugins. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell erlauben möchten.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: Diesem Plugin ausdrücklich vertrauen, `api.runtime.llm.complete` gegen eine nicht standardmäßige Agent-ID auszuführen.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- Konto- und Laufzeiteinstellungen von Channel-Plugins liegen unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten des Manifests des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistrierung.

### Codex-Harness-Plugin-Konfiguration

Das gebündelte `codex`-Plugin besitzt native Codex-App-Server-Harness-Einstellungen unter
`plugins.entries.codex.config`. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference) für die vollständige Konfigurationsoberfläche
und [Codex-Harness](/de/plugins/codex-harness) für das Laufzeitmodell.

`codexPlugins` gilt nur für Sitzungen, die den nativen Codex-Harness auswählen.
Es aktiviert keine Codex-Plugins für OpenClaw-Provider-Läufe, ACP-
Gesprächsbindungen oder andere Nicht-Codex-Harnesses.

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
  Standardrichtlinie für destruktive Aktionen bei migrierten Plugin-App-Elicitations.
  Verwenden Sie `true`, um sichere Codex-Genehmigungsschemas ohne Nachfrage zu akzeptieren, `false`,
  um sie abzulehnen, `"auto"`, um von Codex erforderliche Genehmigungen über OpenClaw-
  Plugin-Genehmigungen zu leiten, oder `"ask"`, um bei jeder schreibenden/destruktiven
  Plugin-Aktion ohne dauerhafte Genehmigung nachzufragen. Der Modus `"ask"` löscht dauerhafte Codex-
  Genehmigungs-Overrides pro Tool für die betroffene App und wählt den menschlichen
  Genehmigungs-Reviewer für diese App aus, bevor der Codex-Thread startet.
  Standard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: aktiviert einen
  migrierten Plugin-Eintrag, wenn global `codexPlugins.enabled` ebenfalls true ist.
  Standard: `true` für explizite Einträge.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabile Marketplace-Identität. V1 unterstützt nur `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabile
  Codex-Plugin-Identität aus der Migration, zum Beispiel `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  destruktive-Aktions-Override pro Plugin. Wenn ausgelassen, wird der globale
  Wert `allow_destructive_actions` verwendet. Der Wert pro Plugin akzeptiert dieselben
  Richtlinien `true`, `false`, `"auto"` oder `"ask"`.

Jede zugelassene Plugin-App, die `"ask"` verwendet, leitet die Genehmigungsanfragen dieser App
an den menschlichen Reviewer. Andere Apps und Nicht-App-Thread-Genehmigungen behalten ihren
konfigurierten Reviewer, sodass gemischte Plugin-Richtlinien kein `"ask"`-Verhalten erben.

`codexPlugins.enabled` ist die globale Aktivierungsanweisung. Explizite Plugin-
Einträge, die durch die Migration geschrieben werden, bilden den dauerhaften Installations- und Reparaturberechtigungssatz.
`plugins["*"]` wird nicht unterstützt, es gibt keinen `install`-Schalter, und lokale
`marketplacePath`-Werte sind absichtlich keine Konfigurationsfelder, weil sie
hostspezifisch sind.

`app/list`-Bereitschaftsprüfungen werden eine Stunde lang zwischengespeichert und bei
Veraltung asynchron aktualisiert. Die Codex-Thread-App-Konfiguration wird beim Aufbau der Codex-Harness-
Sitzung berechnet, nicht bei jedem Turn; verwenden Sie `/new`, `/reset` oder einen Gateway-
Neustart, nachdem Sie die native Plugin-Konfiguration geändert haben.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Web-Fetch-Provider-Einstellungen.
  - `apiKey`: Optionaler Firecrawl-API-Schlüssel für höhere Limits (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Env-Var `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`; selbst gehostete Overrides müssen auf private/interne Endpunkte zeigen).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Zeitlimit für Scrape-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok-Websuche)-Einstellungen.
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Memory-Dreaming-Einstellungen. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: Hauptschalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Takt für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - `model`: optionaler Modell-Override für den Dream-Diary-Subagent. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; mit `allowedModels` kombinieren, um Ziele einzuschränken. Fehler wegen nicht verfügbarem Modell werden einmal mit dem Standardmodell der Sitzung erneut versucht; Vertrauens- oder Zulassungslistenfehler fallen nicht stillschweigend zurück.
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration finden Sie in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete OpenClaw-Standards aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurationspatches.
- `plugins.slots.memory`: die aktive Memory-Plugin-ID auswählen oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: die aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

---

## Verpflichtungen

`commitments` steuert abgeleitete Follow-up-Memory: OpenClaw kann Check-ins aus Gesprächs-Turns erkennen und sie über Heartbeat-Läufe zustellen.

- `commitments.enabled`: versteckte LLM-Extraktion, Speicherung und Heartbeat-Zustellung für abgeleitete Follow-up-Verpflichtungen aktivieren. Standard: `false`.
- `commitments.maxPerDay`: maximale Anzahl abgeleiteter Follow-up-Verpflichtungen, die pro Agent-Sitzung innerhalb eines rollierenden Tages zugestellt werden. Standard: `3`.

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
- `tabCleanup` gibt nach Leerlaufzeit oder wenn eine Sitzung ihre Obergrenze
  überschreitet, nachverfolgte Tabs des primären Agenten frei. Setzen Sie `idleMinutes: 0` oder `maxTabsPerSession: 0`, um
  diese einzelnen Bereinigungsmodi zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass Browsernavigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browsernavigation im privaten Netzwerk ausdrücklich vertrauen.
- Im strikten Modus unterliegen entfernte CDP-Profilendpunkte (`profiles.*.cdpUrl`) denselben Blockierungen privater Netzwerke bei Erreichbarkeits-/Discovery-Prüfungen.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Entfernte Profile sind nur zum Anhängen vorgesehen (Start/Stopp/Zurücksetzen deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für entfernte und
  `attachOnly`-CDP-Erreichbarkeit sowie Anfragen zum Öffnen von Tabs. Verwaltete loopback
  Profile behalten lokale CDP-Standardwerte bei.
- Wenn ein extern verwalteter CDP-Dienst über loopback erreichbar ist, setzen Sie für dieses
  Profil `attachOnly: true`; andernfalls behandelt OpenClaw den loopback-Port als
  lokal verwaltetes Browserprofil und kann Fehler zur lokalen Port-Zuständigkeit melden.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich an
  den ausgewählten Host oder über einen verbundenen Browserknoten anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusteuern.
- `existing-session`-Profile können `cdpUrl` setzen, wenn Chrome bereits hinter
  einem DevTools-HTTP(S)-Discovery-Endpunkt oder einem direkten WS(S)-Endpunkt läuft. In diesem
  Modus übergibt OpenClaw den Endpunkt an Chrome MCP, statt Auto-Connect zu verwenden;
  `userDataDir` wird für Chrome-MCP-Startargumente ignoriert.
- `existing-session`-Profile behalten die aktuellen Routenlimits von Chrome MCP bei:
  Snapshot-/Ref-gesteuerte Aktionen statt CSS-Selektor-Targeting, Ein-Datei-Upload-
  Hooks, keine Dialog-Timeout-Overrides, kein `wait --load networkidle` und kein
  `responsebody`, PDF-Export, Download-Abfangen oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur für entfernte CDP-Profile oder das Anhängen an existing-session-Endpunkte
  explizit.
- Lokal verwaltete Profile können `executablePath` setzen, um den globalen
  `browser.executablePath` für dieses Profil zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die Chrome-CDP-HTTP-
  Discovery nach Prozessstart und `browser.localCdpReadyTimeoutMs` für
  CDP-WebSocket-Bereitschaft nach dem Start. Erhöhen Sie diese Werte auf langsameren Hosts, auf denen Chrome
  erfolgreich startet, Bereitschaftsprüfungen aber mit dem Start konkurrieren. Beide Werte müssen
  positive Ganzzahlen bis zu `120000` ms sein; ungültige Konfigurationswerte werden abgelehnt.
- Auto-Erkennungsreihenfolge: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath` akzeptieren beide
  `~` und `~/...` für das Home-Verzeichnis Ihres OS vor dem Chromium-Start.
  `userDataDir` pro Profil wird bei `existing-session`-Profilen ebenfalls mit Tilde erweitert.
- Control-Dienst: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
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
      avatar: "CB", // Emoji, kurzer Text, Bild-URL oder Daten-URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für Chrome der nativen App-UI (Talk-Mode-Sprechblasenfärbung usw.).
- `assistant`: Identitätsüberschreibung der Control UI. Fällt auf die aktive Agentenidentität zurück.

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

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Gateway verweigert den Start, wenn nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Vorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliase**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliase (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das standardmäßige `loopback`-Bind lauscht im Container auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt Traffic auf `eth0` an, daher ist das Gateway nicht erreichbar. Verwenden Sie `--network host`, oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Auth. Praktisch bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Auth. Nur für vertrauenswürdige local loopback-Setups verwenden; dies wird absichtlich nicht in Onboarding-Eingabeaufforderungen angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Browser-/Benutzer-Auth an einen identitätsbewussten Reverse Proxy delegieren und Identitäts-Headern von `gateway.trustedProxies` vertrauen (siehe [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine **Nicht-Loopback**-Proxy-Quelle; Reverse Proxies auf demselben Host über Loopback erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Aufrufer auf demselben Host können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem Trusted-Proxy-Modus gegenseitig ausgeschlossen.
- `gateway.auth.allowTailscale`: Wenn `true`, können Tailscale Serve-Identitäts-Header die Control UI-/WebSocket-Auth erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Auth. Gilt pro Client-IP und Auth-Scope (Shared-Secret und Device-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale Serve-Control UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher den Limiter beim zweiten Request auslösen, statt dass beide als einfache Nichtübereinstimmungen parallel durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie localhost-Traffic absichtlich ebenfalls rate-limiten möchten (für Test-Setups oder strikte Proxy-Deployments).
- WS-Auth-Versuche aus Browser-Origins werden immer gedrosselt, mit deaktivierter Loopback-Ausnahme (Defense-in-Depth gegen browserbasiertes localhost-Brute-Force).
- Auf Loopback sind diese Browser-Origin-Sperren pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlschläge von einem localhost-Origin nicht automatisch einen anderen Origin sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Auth).
- `tailscale.serviceName`: optionaler Tailscale-Service-Name für den Serve-Modus, z. B. `svc:openclaw`. Wenn gesetzt, übergibt OpenClaw ihn an `tailscale serve --service`, sodass die Control UI über einen benannten Service statt über den Geräte-Hostnamen verfügbar gemacht werden kann. Der Wert muss das Tailscale-Service-Namensformat `svc:<dns-label>` verwenden; beim Start wird die abgeleitete Service-URL gemeldet.
- `tailscale.preserveFunnel`: Wenn `true` und `tailscale.mode = "serve"`, prüft OpenClaw vor dem erneuten Anwenden von Serve beim Start `tailscale funnel status` und überspringt es, wenn eine extern konfigurierte Funnel-Route den Gateway-Port bereits abdeckt. Standard `false`.
- `controlUi.allowedOrigins`: explizite Allowlist für Browser-Origins bei Gateway-WebSocket-Verbindungen. Erforderlich für öffentliche Nicht-Loopback-Browser-Origins. Private Same-Origin-LAN-/Tailnet-UI-Ladevorgänge von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
- `controlUi.chatMessageMaxWidth`: optionale maximale Breite für gruppierte Control UI-Chatnachrichten. Akzeptiert eingeschränkte CSS-Breitenwerte wie `960px`, `82%`, `min(1280px, 82%)` und `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der den Host-Header-Origin-Fallback für Deployments aktiviert, die sich absichtlich auf Host-Header-Origin-Policy verlassen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` bei öffentlichen Hosts `wss://` sein; Klartext `ws://` wird nur für Loopback-, LAN-, Link-Local-, `.local`-, `.ts.net`- und Tailscale-CGNAT-Hosts akzeptiert.
- `remote.remotePort`: Gateway-Port auf dem entfernten SSH-Host. Standardmäßig `18789`; verwenden Sie dies, wenn sich der lokale Tunnel-Port vom entfernten Gateway-Port unterscheidet.
- `gateway.remote.token` / `.password` sind Zugangsdatenfelder für Remote-Clients. Sie konfigurieren Gateway-Auth nicht eigenständig.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das verwendet wird, nachdem relay-gestützte iOS-Builds Registrierungen am Gateway veröffentlichen. Öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay. Benutzerdefinierte Relay-URLs müssen zu einem bewusst separaten iOS-Build-/Deployment-Pfad passen, dessen Relay-URL auf dieses Relay zeigt.
- `gateway.push.apns.relay.timeoutMs`: Gateway-zu-Relay-Sende-Timeout in Millisekunden. Standardmäßig `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet eine registrierungsspezifische Sendeberechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Overrides für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für die Entwicklung vorgesehener Ausweg für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.handshakeTimeoutMs`: Pre-Auth-Gateway-WebSocket-Handshake-Timeout in Millisekunden. Standard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat Vorrang, wenn gesetzt. Erhöhen Sie diesen Wert auf ausgelasteten oder leistungsschwachen Hosts, auf denen lokale Clients eine Verbindung herstellen können, während sich das Startup-Warmup noch stabilisiert.
- `gateway.channelHealthCheckMinutes`: Intervall des Channel-Health-Monitors in Minuten. Setzen Sie `0`, um Health-Monitor-Neustarts global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Health-Monitor-Neustarts pro Channel/Konto in einer gleitenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Opt-out pro Channel für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Override pro Konto für Multi-Konto-Channels. Wenn gesetzt, hat er Vorrang vor dem Override auf Channel-Ebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (kein maskierender Remote-Fallback).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder Forwarded-Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Same-Host-Proxy-/Lokalerkennungs-Setups gültig (z. B. Tailscale Serve oder ein lokaler Reverse Proxy), machen Loopback-Requests aber **nicht** für `gateway.auth.mode: "trusted-proxy"` geeignet.
- `allowRealIpFallback`: Wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für Fail-Closed-Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR/IP-Allowlist zum automatischen Genehmigen erstmaliger Node-Gerätekopplung ohne angeforderte Scopes. Sie ist deaktiviert, wenn nicht gesetzt. Dies genehmigt Operator-/Browser-/Control UI-/WebChat-Kopplung nicht automatisch und genehmigt Rollen-, Scope-, Metadaten- oder Public-Key-Upgrades nicht automatisch.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globales Allow-/Deny-Shaping für deklarierte Node-Befehle nach Kopplung und Plattform-Allowlist-Auswertung. Verwenden Sie `allowCommands`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip` und `screen.record` zuzulassen; `denyCommands` entfernt einen Befehl, selbst wenn ein Plattformstandard oder eine explizite Allow-Regel ihn andernfalls einschließen würde. Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie diese Gerätekopplung ab und genehmigen Sie sie erneut, damit das Gateway den aktualisierten Befehls-Snapshot speichert.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste für Owner-/Admin-Aufrufer entfernen. Dies stuft identitätstragende `operator.write`-Aufrufer nicht auf Owner-/Admin-Zugriff hoch; `cron`, `gateway` und `nodes` bleiben für Nicht-Owner-Aufrufer auch dann nicht verfügbar, wenn sie in der Allowlist stehen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Admin-HTTP-RPC: standardmäßig als Plugin `admin-http-rpc` deaktiviert. Aktivieren Sie das Plugin, um `POST /api/v1/admin/rpc` zu registrieren. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses-URL-Eingabehärtung:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Abrufe zu deaktivieren.
- Optionaler Response-Härtungs-Header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-Instanz-Isolation

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und State-Verzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Praktische Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Mehrere Gateways](/de/gateway/multiple-gateways).

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
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikat-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/Dev-Nutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur TLS-Private-Key-Datei; halten Sie Berechtigungen eingeschränkt.
- `caPath`: optionaler CA-Bundle-Pfad für Client-Verifizierung oder benutzerdefinierte Trust Chains.

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
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderung immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms für laufende Vorgänge, bevor ein Neustart oder Channel-Hot-Reload erzwungen wird. Weglassen, um die standardmäßige begrenzte Wartezeit (`300000`) zu verwenden; auf `0` setzen, um unbegrenzt zu warten und regelmäßig Warnungen zu noch ausstehenden Vorgängen zu protokollieren.

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

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` sollte sich von der aktiven Gateway-Shared-Secret-Authentifizierung unterscheiden (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); beim Start wird eine nicht fatale Sicherheitswarnung protokolliert, wenn Wiederverwendung erkannt wird.
- `openclaw security audit` kennzeichnet die Wiederverwendung von Hook-/Gateway-Authentifizierung als kritischen Befund, einschließlich Gateway-Passwortauthentifizierung, die nur zum Audit-Zeitpunkt bereitgestellt wird (`--auth password --password <password>`). Führen Sie `openclaw doctor --fix` aus, um ein persistiertes wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Sender, damit sie das neue Hook-Token verwenden.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true` ist, beschränken Sie `hooks.allowedSessionKeyPrefixes` (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen vorlagenbasierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern diese ausdrückliche Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus dem Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` ist (Standard: `false`).
- `POST /hooks/<name>` → über `hooks.mappings` aufgelöst
  - Durch Vorlagen gerenderte Mapping-`sessionKey`-Werte werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping-Details">

- `match.path` entspricht dem Unterpfad nach `/hooks` (z. B. `/hooks/gmail` → `gmail`).
- `match.source` entspricht einem Payload-Feld für generische Pfade.
- Vorlagen wie `{{messages[0].subject}}` lesen aus dem Payload.
- `transform` kann auf ein JS-/TS-Modul verweisen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
  - Belassen Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Workspace-Skill-Verzeichnisse werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transform-Modul in das Hook-Transforms-Verzeichnis oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf den Standardagenten zurück.
- `allowedAgentIds`: beschränkt das effektive Agenten-Routing, einschließlich des Standardagenten-Pfads, wenn `agentId` weggelassen wird (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt `/hooks/agent`-Aufrufern und vorlagengesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Zulassungsliste für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen vorlagenbasierten `sessionKey` verwendet.
- `deliver: true` sendet die finale Antwort an einen Channel; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn der Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` passend zum Gmail-Namespace, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` statt mit dem vorlagenbasierten Standard.

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
- Führen Sie kein separates `gog gmail watch serve` neben dem Gateway aus.

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

- Stellt durch Agenten editierbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: Behalten Sie `gateway.bind: "loopback"` (Standard) bei.
- Nicht-loopback-Binds: Canvas-Routen erfordern Gateway-Authentifizierung (Token/Passwort/Trusted-Proxy), wie andere Gateway-HTTP-Oberflächen.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, bewirbt der Gateway Node-bezogene Capability-URLs für Canvas-/A2UI-Zugriff.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in bereitgestelltes HTML.
- Erstellt automatisch ein Starter-`index.html`, wenn leer.
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

- `minimal` (Standard, wenn das gebündelte `bonjour`-Plugin aktiviert ist): `cliPath` + `sshPort` aus TXT-Records weglassen.
- `full`: `cliPath` + `sshPort` einschließen; LAN-Multicast-Advertising erfordert weiterhin, dass das gebündelte `bonjour`-Plugin aktiviert ist.
- `off`: LAN-Multicast-Advertising unterdrücken, ohne die Plugin-Aktivierung zu ändern.
- Das gebündelte `bonjour`-Plugin startet automatisch auf macOS-Hosts und ist unter Linux, Windows und containerisierten Gateway-Bereitstellungen opt-in.
- Der Hostname ist standardmäßig der Systemhostname, wenn er ein gültiges DNS-Label ist, andernfalls `openclaw`. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Erkennung kombinieren Sie sie mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split-DNS.

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
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine davon überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Siehe [Umgebung](/de/help/environment) für die vollständige Vorrangreihenfolge.

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
- Mit `$${VAR}` für ein literales `${VAR}` escapen.
- Funktioniert mit `$include`.

---

## Secrets

Secret-Verweise sind additiv: Klartextwerte funktionieren weiterhin.

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

### Unterstützte Oberfläche für Anmeldeinformationen

- Kanonische Matrix: [SecretRef-Oberfläche für Anmeldeinformationen](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Anmeldeinformationspfade in `openclaw.json`.
- `auth-profiles.json`-Verweise sind in der Runtime-Auflösung und Audit-Abdeckung enthalten.

### Konfiguration von Secret-Providern

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
- Datei- und exec-Provider-Pfade schlagen geschlossen fehl, wenn die Windows-ACL-Verifizierung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, gilt die Prüfung des vertrauenswürdigen Verzeichnisses für den aufgelösten Zielpfad.
- Die `exec`-Kindumgebung ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- Secret-Verweise werden bei der Aktivierung in einen In-Memory-Snapshot aufgelöst; anschließend lesen Anforderungspfade nur den Snapshot.
- Active-Surface-Filterung wird während der Aktivierung angewendet: Nicht aufgelöste Verweise auf aktivierten Oberflächen lassen Start/Neuladen fehlschlagen, während inaktive Oberflächen mit Diagnosemeldungen übersprungen werden.

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

- Pro-Agent-Profile werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Zugangsdatenmodi.
- Ältere flache `auth-profiles.json`-Maps wie `{ "provider": { "apiKey": "..." } }` sind kein Laufzeitformat; `openclaw doctor --fix` schreibt sie in kanonische `provider:default`-API-Key-Profile um und legt eine `.legacy-flat.*.bak`-Sicherung an.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Auth-Profil-Zugangsdaten.
- Statische Laufzeit-Zugangsdaten stammen aus im Arbeitsspeicher aufgelösten Snapshots; ältere statische `auth.json`-Einträge werden bereinigt, wenn sie entdeckt werden.
- Ältere OAuth-Importe stammen aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten für Secrets und `audit/configure/apply`-Werkzeuge: [Secrets-Verwaltung](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil wegen echter
  Abrechnungsfehler oder unzureichender Guthaben fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  hier auch bei `401`/`403`-Antworten landen, aber Provider-spezifische Text-
  Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Meldungen zu Nutzungsfenstern oder
  Ausgabenlimits für Organisationen/Workspaces bleiben stattdessen im `rate_limit`-Pfad.
- `billingBackoffHoursByProvider`: optionale Überschreibungen pro Provider für Abrechnungs-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Abrechnungs-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochverlässliche `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für `auth_permanent`-Backoff-Wachstum (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden für Backoff-Zähler (Standard: `24`).
- `overloadedProfileRotations`: maximale Auth-Profil-Rotationen beim selben Provider für Überlastungsfehler, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Provider-ausgelastete Formen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer Rotation für einen überlasteten Provider/ein überlastetes Profil (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Auth-Profil-Rotationen beim selben Provider für Rate-Limit-Fehler, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst Provider-geprägte Texte wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

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
- `maxFileBytes`: maximale Größe der aktiven Protokolldatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw bewahrt bis zu fünf nummerierte Archive neben der aktiven Datei auf.
- `redactSensitive` / `redactPatterns`: Best-Effort-Maskierung für Konsolenausgabe, Dateiprotokolle, OTLP-Protokolldatensätze und dauerhaft gespeicherten Sitzungstranskripttext. `redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkriptrichtlinie; UI-, Tool- und Diagnose-Sicherheitsoberflächen schwärzen Secrets weiterhin vor der Ausgabe.

---

## Diagnose

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
- `flags`: Array von Flag-Strings, die gezielte Protokollausgabe aktivieren (unterstützt Platzhalter wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersgrenze ohne Fortschritt in ms, um lang laufende Verarbeitungssitzungen als `session.long_running`, `session.stalled` oder `session.stuck` zu klassifizieren. Antwort, Tool, Status, Block und ACP-Fortschritt setzen den Timer zurück; wiederholte `session.stuck`-Diagnosen werden bei unverändertem Zustand zurückgefahren.
- `stuckSessionAbortMs`: Altersgrenze ohne Fortschritt in ms, bevor geeignete blockierte aktive Arbeit zur Wiederherstellung abgebrochen und geleert werden kann. Wenn nicht gesetzt, verwendet OpenClaw das sicherere erweiterte Fenster für eingebettete Ausführungen von mindestens 5 Minuten und 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: erfasst einen geschwärzten Stabilitäts-Snapshot vor einem OOM, wenn Speicherdruck `critical` erreicht (Standard: `false`). Setzen Sie dies auf `true`, um den Scan/Schreibvorgang der Stabilitäts-Bundle-Datei hinzuzufügen, während normale Speicherdruckereignisse beibehalten werden.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Die vollständige Konfiguration, den Signal-Katalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale signalspezifische OTLP-Endpunkte. Wenn gesetzt, überschreiben sie `otel.endpoint` nur für dieses Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP/gRPC-Metadaten-Header, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Protokollexport aktivieren.
- `otel.logsExporter`: Ziel für Protokollexport: `"otlp"` (Standard), `"stdout"` für ein JSON-Objekt pro stdout-Zeile oder `"both"`.
- `otel.sampleRate`: Trace-Samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodisches Telemetrie-Flush-Intervall in ms.
- `otel.captureContent`: optionale Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig aus. Boolesch `true` erfasst Nicht-System-Nachrichten-/Tool-Inhalte; mit der Objektform können Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` und `toolDefinitions` explizit aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsschalter für die neueste experimentelle GenAI-Inferenz-Span-Form, einschließlich `{gen_ai.operation.name} {gen_ai.request.model}`-Span-Namen, `CLIENT`-Span-Art und `gen_ai.provider.name` statt des älteren `gen_ai.system`. Standardmäßig behalten Spans aus Kompatibilitätsgründen `openclaw.model.call` und `gen_ai.system`; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann den Plugin-eigenen SDK-Start/-Shutdown, während Diagnose-Listener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der passende Konfigurationsschlüssel nicht gesetzt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Ausführungen protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in die Cache-Trace-Ausgabe aufgenommen wird (alle Standard: `true`).

---

## Update

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
- `checkOnStart`: beim Start des Gateway nach npm-Updates suchen (Standard: `true`).
- `auto.enabled`: automatische Hintergrundaktualisierung für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: Mindestverzögerung in Stunden vor automatischer Anwendung im Stable-Kanal (Standard: `6`; max.: `168`).
- `auto.stableJitterHours`: zusätzliches Verteilungsfenster für Stable-Kanal-Rollouts in Stunden (Standard: `12`; max.: `168`).
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

- `enabled`: globaler ACP-Feature-Schalter (Standard: `true`; setzen Sie `false`, um ACP-Dispatch und Spawn-Bedienelemente auszublenden).
- `dispatch.enabled`: unabhängiger Schalter für ACP-Sitzungs-Turn-Dispatch (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, aber die Ausführung zu blockieren.
- `backend`: Standard-ID des ACP-Laufzeit-Backends (muss mit einem registrierten ACP-Laufzeit-Plugin übereinstimmen).
  Installieren Sie zuerst das Backend-Plugin, und wenn `plugins.allow` gesetzt ist, nehmen Sie die Backend-Plugin-ID auf (zum Beispiel `acpx`), sonst wird das ACP-Backend nicht geladen.
- `defaultAgent`: Fallback-ID des ACP-Ziel-Agenten, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Laufzeitsitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der gestreamten Blockprojektion.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trenner vor sichtbarem Text nach ausgeblendeten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl von Assistant-Ausgabezeichen, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Datensatz von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie bereinigt werden können.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrapping einer ACP-Laufzeitumgebung ausgeführt wird.

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
  - `"off"`: kein Tagline-Text (Bannertitel/-version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Metadaten, die von geführten CLI-Einrichtungsabläufen (`onboard`, `configure`, `doctor`) geschrieben werden:

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

Siehe die Identitätsfelder von `agents.list` unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (veraltet, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt wurden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Veraltete Bridge-Konfiguration (historische Referenz)">

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

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Laufsitzungen vor dem Entfernen aus `sessions.json` aufbewahrt werden. Steuert außerdem die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: wird aus Kompatibilitätsgründen mit älteren dateibasierten Cron-Laufprotokollen akzeptiert. Standard: `2_000_000` Byte.
- `runLog.keepLines`: neueste SQLite-Laufverlaufszeilen, die pro Job beibehalten werden. Standard: `2000`.
- `webhookToken`: Bearer-Token für die Cron-Webhook-POST-Zustellung (`delivery.mode = "webhook"`); wenn weggelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Fallback-Webhook-URL (http/https), die von `openclaw doctor --fix` verwendet wird, um gespeicherte Jobs zu migrieren, die noch `notify: true` haben; die Laufzeitzustellung verwendet pro Job `delivery.mode="webhook"` plus `delivery.to` oder `delivery.completionDestination`, wenn die Ankündigungszustellung erhalten bleibt.

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

- `maxAttempts`: maximale Wiederholungsversuche für Cron-Jobs bei vorübergehenden Fehlern (Standard: `3`; Bereich: `0`-`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1-10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungsversuche auslösen - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle vorübergehenden Typen zu wiederholen.

Einmaljobs bleiben aktiviert, bis die Wiederholungsversuche erschöpft sind, und werden dann deaktiviert, wobei der endgültige Fehlerzustand erhalten bleibt. Wiederkehrende Jobs verwenden dieselbe Richtlinie für vorübergehende Wiederholungsversuche, um nach dem Backoff vor dem nächsten geplanten Zeitfenster erneut zu laufen; permanente Fehler oder erschöpfte vorübergehende Wiederholungsversuche fallen mit Fehler-Backoff auf den normalen wiederkehrenden Zeitplan zurück.

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
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nichtnegative Ganzzahl).
- `includeSkipped`: aufeinanderfolgende übersprungene Läufe auf den Warnschwellenwert anrechnen (Standard: `false`). Übersprungene Läufe werden separat verfolgt und wirken sich nicht auf den Backoff bei Ausführungsfehlern aus.
- `mode`: Zustellmodus - `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID, um die Warnzustellung einzuschränken.

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
- `channel`: Kanalüberschreibung für die Ankündigungszustellung. `"last"` verwendet den zuletzt bekannten Zustellungskanal erneut.
- `to`: explizites Ankündigungsziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder global noch pro Job ein Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Vorlagenvariablen für Medienmodelle

Vorlagen-Platzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext        |
| `{{RawBody}}`      | Rohtext (ohne Verlaufs-/Absender-Wrapper)        |
| `{{BodyStripped}}` | Text mit entfernten Gruppenerwähnungen           |
| `{{From}}`         | Absenderkennung                                  |
| `{{To}}`           | Zielkennung                                      |
| `{{MessageSid}}`   | Kanalnachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                           |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde  |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                    |
| `{{MediaPath}}`    | Lokaler Medienpfad                               |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                |
| `{{Transcript}}`   | Audio-Transkript                                 |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                        |
| `{{GroupSubject}}` | Gruppenthema (bestmöglich)                       |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (bestmöglich)     |
| `{{SenderName}}`   | Anzeigename des Absenders (bestmöglich)          |
| `{{SenderE164}}`   | Telefonnummer des Absenders (bestmöglich)        |
| `{{Provider}}`     | Provider-Hinweis (WhatsApp, Telegram, Discord usw.) |

---

## Konfigurations-Includes (`$include`)

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
- Array von Dateien: wird der Reihe nach tief zusammengeführt (spätere überschreiben frühere).
- Geschwisterschlüssel: werden nach Includes zusammengeführt (überschreiben inkludierte Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur inkludierenden Datei aufgelöst, müssen aber innerhalb des obersten Konfigurationsverzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur zulässig, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden. Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein.
- OpenClaw-eigene Schreibvorgänge, die nur einen obersten Abschnitt ändern, der durch ein Single-File-Include gestützt wird, schreiben in diese inkludierte Datei durch. Beispielsweise aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit Geschwisterüberschreibungen sind für OpenClaw-eigene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen geschlossen fehl, statt die Konfiguration zu verflachen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler, zirkuläre Includes, ungültiges Pfadformat und übermäßige Länge.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
