---
read_when:
    - Sie benötigen genaue Semantik oder Standardwerte für einzelne Konfigurationsfelder
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateways oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu Referenzen dedizierter Subsysteme
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-07-12T21:37:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referenz auf Feldebene für `~/.openclaw/openclaw.json`: Schlüssel, Standardwerte und Links zu ausführlicheren Seiten der Subsysteme. Eine aufgabenorientierte Einrichtungsanleitung finden Sie unter [Konfiguration](/de/gateway/configuration). Befehlsverzeichnisse im Besitz von Kanälen und Plugins sowie detaillierte Einstellungen für Memory/QMD finden Sie auf den jeweiligen Seiten, nicht hier.

Das Konfigurationsformat ist **JSON5** (Kommentare und abschließende Kommas sind zulässig). Alle Felder sind optional; OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

Der Code ist maßgeblicher als diese Seite:

- `openclaw config schema` gibt das für die Validierung und die Control UI verwendete aktuelle JSON-Schema aus, in das die Metadaten gebündelter Plugins und Kanäle integriert sind.
- Agenten sollten vor der Bearbeitung der Konfiguration über das Tool `gateway` die Aktion `config.schema.lookup` für genau einen pfadbezogenen Schemaknoten aufrufen.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash dieser Dokumentation gegen die aktuelle Schemaoberfläche.

Ausführliche Referenzen:

- [Referenz zur Memory-Konfiguration](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und die Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`.
- [Slash-Befehle](/de/tools/slash-commands) für das aktuelle Verzeichnis integrierter und gebündelter Befehle.
- Die zuständigen Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen.

---

## Kanäle

Kanalspezifische Konfigurationsschlüssel finden Sie unter [Konfiguration – Kanäle](/de/gateway/config-channels): `channels.*` für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und weitere gebündelte Kanäle (Authentifizierung, Zugriffskontrolle, mehrere Konten, Erwähnungsbeschränkung).

## Agent-Standardeinstellungen, mehrere Agenten, Sitzungen und Nachrichten

Siehe [Konfiguration – Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Arbeitsbereich, Modell, Denken, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindungen)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Darstellung)
- `talk.*` (Sprechmodus)
  - `talk.consultThinkingLevel`: Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeit-Konsultationen in Control UI Talk
  - `talk.consultFastMode`: einmalige Überschreibung für den Schnellmodus bei Echtzeit-Konsultationen über Talk in der Control UI
  - `talk.speechLocale`: optionale BCP-47-Gebietsschema-ID für die Talk-Spracherkennung unter iOS/macOS
  - `talk.silenceTimeoutMs`: wenn nicht festgelegt, verwendet Talk weiterhin das standardmäßige Pausenfenster der Plattform, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-Relay-Fallback für finalisierte Echtzeit-Talk-Transkripte, die `openclaw_agent_consult` überspringen

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, die Konfiguration Provider-gestützter Tools sowie die Einrichtung benutzerdefinierter Provider/Basis-URLs finden Sie unter
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Zulassungslisten und die Einrichtung benutzerdefinierter Provider finden Sie unter
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Die Wurzel `models` steuert außerdem das globale Verhalten des Modellkatalogs.

```json5
{
  models: {
    // Optional. Standard: true. Erfordert bei Änderung einen Neustart des Gateways.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: nach Provider-ID indizierte Zuordnung benutzerdefinierter Provider.
- `models.providers.*.localService`: optionaler bedarfsgesteuerter Prozessmanager für
  lokale Modellserver. OpenClaw prüft den konfigurierten Zustandsendpunkt, startet
  bei Bedarf den absoluten `command`, wartet auf die Betriebsbereitschaft und sendet dann die Modellanfrage.
  Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- `models.pricing.enabled`: steuert die Preisermittlung im Hintergrund, die
  startet, nachdem Sidecars und Kanäle den Bereitschaftspfad des Gateways erreicht haben. Bei `false`
  überspringt das Gateway den Abruf der Preiskataloge von OpenRouter und LiteLLM; konfigurierte
  Werte für `models.providers.*.models[].cost` funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
von eingebettetem OpenClaw sowie anderen Runtime-Adaptern verwendet. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne während der Konfigurationsänderungen eine Verbindung zum
Zielserver herzustellen.

```json5
{
  mcp: {
    // Optional. Standard: 600000 ms (10 Minuten). Auf 0 setzen, um das Entfernen inaktiver Sitzungen zu deaktivieren.
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
        // Optionale Projektionssteuerung für den Codex-App-Server.
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
  `openclaw doctor --fix` in das kanonische Feld `transport` überführen.
- `mcp.servers.<name>.enabled`: auf `false` setzen, um eine gespeicherte Serverdefinition
  beizubehalten, sie jedoch von der MCP-Erkennung und Tool-Projektion des eingebetteten OpenClaw auszuschließen.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: MCP-Anfragezeitüberschreitung pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: Verbindungszeitüberschreitung pro Server
  in Sekunden oder Millisekunden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionaler Parallelitätshinweis für
  Adapter, die entscheiden können, ob sie parallele MCP-Tool-Aufrufe ausführen.
- `mcp.servers.<name>.auth`: für HTTP-MCP-Server, die OAuth erfordern,
  auf `"oauth"` setzen. Führen Sie `openclaw mcp login <name>` aus, um Tokens im OpenClaw-Zustand zu speichern.
- `mcp.servers.<name>.oauth`: optionale Überschreibungen für OAuth-Berechtigungsumfang, Weiterleitungs-URL und URL
  der Client-Metadaten.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP-TLS-Steuerung
  für private Endpunkte und gegenseitiges TLS.
- `mcp.servers.<name>.toolFilter`: optionale Tool-Auswahl pro Server. `include`
  beschränkt die erkannten MCP-Tools auf übereinstimmende Namen; `exclude` blendet übereinstimmende
  Namen aus. Einträge sind exakte MCP-Tool-Namen oder einfache `*`-Glob-Muster. Server mit
  Ressourcen oder Prompts erzeugen außerdem Namen für Hilfstools (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), und diese Namen verwenden denselben
  Filter.
- `mcp.servers.<name>.codex`: optionale Projektionssteuerung für den Codex-App-Server.
  Dieser Block enthält ausschließlich OpenClaw-Metadaten für Codex-App-Server-Threads; er wirkt sich nicht
  auf ACP-Sitzungen, die generische Codex-Harness-Konfiguration oder andere Runtime-Adapter aus.
  Ein nicht leeres `codex.agents` beschränkt den Server auf die aufgeführten OpenClaw-Agent-IDs.
  Leere, unbeschriebene oder ungültige Agent-Listen mit Geltungsbereich werden von der Konfigurationsvalidierung
  abgelehnt und vom Runtime-Projektionspfad ausgelassen, statt global zu werden.
  `codex.defaultToolsApprovalMode` gibt den nativen Codex-Wert
  `default_tools_approval_mode` für diesen Server aus. OpenClaw entfernt den Block `codex`,
  bevor es die native Konfiguration `mcp_servers` an Codex übergibt. Lassen Sie den Block weg,
  damit der Server für jeden Codex-App-Server-Agent mit dem standardmäßigen
  MCP-Genehmigungsverhalten von Codex projiziert wird.
- `mcp.sessionIdleTtlMs`: Inaktivitäts-TTL für sitzungsgebundene gebündelte MCP-Runtimes.
  Einmalige eingebettete Ausführungen fordern eine Bereinigung am Ausführungsende an; diese TTL dient als Absicherung für
  langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden direkt angewendet, indem zwischengespeicherte Sitzungs-MCP-Runtimes verworfen werden.
  Bei der nächsten Tool-Erkennung oder -Verwendung werden sie aus der neuen Konfiguration neu erstellt, sodass entfernte
  Einträge in `mcp.servers` sofort bereinigt werden, statt auf die Inaktivitäts-TTL zu warten.
- Die Runtime-Erkennung berücksichtigt außerdem Benachrichtigungen über Änderungen der MCP-Tool-Liste, indem sie
  den zwischengespeicherten Katalog für diese Sitzung verwirft. Server, die Ressourcen oder
  Prompts bereitstellen, erhalten Hilfstools zum Auflisten und Lesen von Ressourcen sowie zum Auflisten und Abrufen
  von Prompts. Wiederholte Fehler bei Tool-Aufrufen pausieren den betroffenen Server kurz, bevor
  ein weiterer Aufruf versucht wird.

Zum Runtime-Verhalten siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays).

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartextzeichenfolge
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Zulassungsliste ausschließlich für gebündelte Skills (verwaltete und Workspace-Skills sind nicht betroffen).
- `load.extraDirs`: zusätzliche gemeinsam genutzte Stammverzeichnisse für Skills (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige tatsächliche Zielstammverzeichnisse, in die Skill-Symlinks
  aufgelöst werden dürfen, wenn sich der Link außerhalb seines konfigurierten Quellstammverzeichnisses befindet.
- `workshop.allowSymlinkTargetWrites`: erlaubt Skill Workshop Apply das Schreiben
  über bereits vertrauenswürdige Symlink-Ziele (Standard: false).
- `install.preferBrew`: wenn true, werden Homebrew-Installationsprogramme bevorzugt, sofern `brew`
  verfügbar ist, bevor auf andere Installationsarten zurückgegriffen wird.
- `install.nodeManager`: bevorzugtes Node-Installationsprogramm für Spezifikationen unter `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: erlaubt vertrauenswürdigen `operator.admin`-Gateway-
  Clients, private ZIP-Archive zu installieren, die über `skills.upload.*` bereitgestellt wurden
  (Standard: false). Dadurch wird nur der Pfad für hochgeladene Archive aktiviert; normale ClawHub-
  Installationen benötigen diese Option nicht.
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt oder installiert ist.
- `entries.<skillKey>.apiKey`: Komfortoption für Skills, die eine primäre Umgebungsvariable deklarieren (Klartextzeichenfolge oder SecretRef-Objekt).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: begrenzen die Skill-Erkennung und den modellseitigen Skills-Prompt.
- Die Autonomie- und Genehmigungseinstellungen von Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) sind unter [Skills-Konfiguration](/de/tools/skills-config) dokumentiert.

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

- Wird aus Paket- oder Bundle-Verzeichnissen unter `~/.openclaw/extensions` und `<workspace>/.openclaw/extensions` sowie aus den in `plugins.load.paths` aufgeführten Dateien oder Verzeichnissen geladen.
- Legen Sie eigenständige Plugin-Dateien in `plugins.load.paths` ab. Automatisch erkannte Erweiterungsstammverzeichnisse ignorieren `.js`-, `.mjs`- und `.ts`-Dateien auf oberster Ebene, damit Hilfsskripte in diesen Stammverzeichnissen den Start nicht blockieren.
- Die Erkennung unterstützt native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles mit Standardlayout.
- **Konfigurationsänderungen erfordern einen Neustart des Gateways.**
- `allow`: optionale Positivliste (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: praktisches Feld für einen API-Schlüssel auf Plugin-Ebene (sofern vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Zuordnung von Umgebungsvariablen.
- `plugins.entries.<id>.hooks.allowPromptInjection`: Wenn `false`, blockiert der Kern `before_prompt_build` und ignoriert Prompt-verändernde Felder des veralteten Hooks `before_agent_start`, behält jedoch die veralteten Felder `modelOverride` und `providerOverride` bei. Gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: Wenn `true`, dürfen vertrauenswürdige, nicht gebündelte Plugins über typisierte Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` auf unverarbeitete Gesprächsinhalte zugreifen.
- `plugins.entries.<id>.subagent.allowModelOverride`: Vertraut diesem Plugin ausdrücklich, für Hintergrundläufe von Unteragenten laufbezogene Überschreibungen für `provider` und `model` anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Positivliste kanonischer `provider/model`-Ziele für vertrauenswürdige Unteragentenüberschreibungen. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowModelOverride`: Vertraut diesem Plugin ausdrücklich, Modellüberschreibungen für `api.runtime.llm.complete` anzufordern.
- `plugins.entries.<id>.llm.allowedModels`: optionale Positivliste kanonischer `provider/model`-Ziele für vertrauenswürdige Überschreibungen bei LLM-Vervollständigungen durch Plugins. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: Vertraut diesem Plugin ausdrücklich, `api.runtime.llm.complete` mit einer von der Vorgabe abweichenden Agenten-ID auszuführen.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (wird, sofern verfügbar, anhand des Schemas des nativen OpenClaw-Plugins validiert).
- Konto- und Laufzeiteinstellungen für Kanal-Plugins befinden sich unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten im Manifest des zuständigen Plugins beschrieben werden, nicht durch ein zentrales OpenClaw-Optionsregister.

### Konfiguration des Codex-Harness-Plugins

Das gebündelte `codex`-Plugin verwaltet die Einstellungen des nativen Codex-App-Server-Harness unter
`plugins.entries.codex.config`. Die vollständige Konfigurationsoberfläche finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference), das Laufzeitmodell unter
[Codex-Harness](/de/plugins/codex-harness).

`codexPlugins` gilt nur für Sitzungen, die den nativen Codex-Harness auswählen.
Es aktiviert Codex-Plugins nicht für OpenClaw-Provider-Läufe, ACP-
Gesprächsbindungen oder andere Harnesses als Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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

- `plugins.entries.codex.config.codexPlugins.enabled`: aktiviert die native
  Plugin-/App-Unterstützung von Codex für das Codex-Harness. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: stellt in
  jedem neuen nativen Codex-Thread jede derzeit zugängliche App bereit, die mit
  dem authentifizierten Codex-Konto verbunden ist. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  standardmäßige Richtlinie für destruktive Aktionen bei Abfragen konfigurierter
  Plugin-Apps. Verwenden Sie `true`, um sichere Codex-Genehmigungsschemas ohne
  Rückfrage zu akzeptieren, `false`, um sie abzulehnen, `"auto"`, um von Codex
  erforderte Genehmigungen über Plugin-Genehmigungen von OpenClaw zu leiten,
  oder `"ask"`, um für jeden Schreibvorgang und jede destruktive Aktion eines
  Plugins ohne dauerhafte Genehmigung nachzufragen. Der Modus `"ask"` löscht
  dauerhafte werkzeugspezifische Codex-Genehmigungsüberschreibungen für die
  betroffene App und wählt den menschlichen Genehmigungsprüfer für diese App
  aus, bevor der Codex-Thread gestartet wird.
  Standard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: aktiviert
  einen konfigurierten Plugin-Eintrag, wenn auch das globale
  `codexPlugins.enabled` auf „true“ gesetzt ist. Standard: `true` für explizite
  Einträge.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabile Marketplace-Identität, die zusammen mit `pluginName` für jeden
  aufgelösten Eintrag erforderlich ist. Unterstützt `"openai-curated"` und
  `"workspace-directory"`. Einträge, denen eines der Identitätsfelder fehlt,
  werden ignoriert.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabile
  Codex-Plugin-Identität, die zusammen mit `marketplaceName` erforderlich ist.
  Ein `workspace-directory`-Eintrag muss die exakte, um den Marketplace
  qualifizierte `summary.id` verwenden, die von `plugin/list` zurückgegeben
  wird, zum Beispiel `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin-spezifische Überschreibung für destruktive Aktionen. Wenn sie
  weggelassen wird, kommt der globale Wert `allow_destructive_actions` zur
  Anwendung. Der Plugin-spezifische Wert akzeptiert dieselben Richtlinien
  `true`, `false`, `"auto"` oder `"ask"`.

Bei jeder zugelassenen Plugin-App, die `"ask"` verwendet, werden die
Genehmigungsanfragen dieser App an den menschlichen Prüfer geleitet. Andere Apps
und Genehmigungen im Thread, die nicht von Apps stammen, behalten ihren
konfigurierten Prüfer, sodass gemischte Plugin-Richtlinien das Verhalten von
`"ask"` nicht übernehmen.

`codexPlugins.enabled` ist die globale Aktivierungsdirektive. Explizite
Plugin-Einträge, die durch eine Migration geschrieben wurden, bilden die
dauerhafte, kuratierte Berechtigungsmenge für Installation und Reparatur.
Manuell konfigurierte `workspace-directory`-Einträge müssen bereits installiert
und aktiviert sein, und die zugehörigen Apps müssen zugänglich sein; OpenClaw
installiert oder authentifiziert sie nicht. Wenn Codex die explizite
Workspace-Kataloganfrage ablehnt, schlagen aktivierte Workspace-Einträge
abgesichert mit `marketplace_missing` fehl, während kuratierte Einträge aus dem
Standardkatalog verfügbar bleiben. `plugins["*"]` wird nicht unterstützt, es
gibt keinen Schalter `install`, und lokale `marketplacePath`-Werte sind
absichtlich keine Konfigurationsfelder, da sie hostspezifisch sind. Informationen
zu App-Server-Version und Bereitschaftsanforderungen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Bereitschaftsprüfungen von `app/list` werden eine Stunde lang
zwischengespeichert und bei veraltetem Stand asynchron aktualisiert. Die
App-Konfiguration des Codex-Threads wird beim Aufbau der Sitzung des
Codex-Harness berechnet, nicht bei jedem Durchlauf; verwenden Sie nach einer
Änderung der nativen Plugin-Konfiguration `/new`, `/reset` oder einen Neustart
des Gateways.

`codexPlugins.allow_all_plugins` übernimmt eine Momentaufnahme jeder derzeit
zugänglichen Konto-App in jeden neuen nativen Codex-Thread. Es installiert keine
Plugins oder Apps, und nicht zugängliche Apps bleiben ausgeschlossen. Konto-Apps
verwenden die globale Richtlinie `codexPlugins.allow_destructive_actions`.
Explizite Plugin-Einträge haben Vorrang, wenn dieselbe App über beide Pfade
vorhanden ist. Wenn `app/list` nicht gelesen werden kann, schlägt die
kontoweite Bereitstellung abgesichert fehl.

- `plugins.entries.firecrawl.config.webFetch`: Einstellungen des Firecrawl-Web-Fetch-Providers.
  - `apiKey`: Optionaler Firecrawl-API-Schlüssel für höhere Limits (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, das veraltete `tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Basis-URL der Firecrawl-API (Standard: `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte verweisen).
  - `onlyMainContent`: Nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: Maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Zeitüberschreitung für Scrape-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: Den X-Search-Provider aktivieren.
  - `model`: Für die Suche zu verwendendes Grok-Modell (z. B. `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory-Dreaming. Phasen und Schwellenwerte finden Sie unter [Dreaming](/de/concepts/dreaming).
  - `enabled`: Hauptschalter für Dreaming (Standard: `false`).
  - `frequency`: Cron-Intervall für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - `model`: Optionale Modellüberschreibung für den Dream-Diary-Subagenten. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; verwenden Sie zusätzlich `allowedModels`, um die Zielmodelle einzuschränken. Bei Fehlern aufgrund eines nicht verfügbaren Modells erfolgt ein erneuter Versuch mit dem Standardsitzungsmodell; bei Vertrauens- oder Zulassungslistenfehlern erfolgt kein stiller Rückgriff.
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration finden Sie in der [Referenz zur Memory-Konfiguration](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können außerdem eingebettete OpenClaw-Standardwerte aus `settings.json` bereitstellen; OpenClaw wendet diese als bereinigte Agenteneinstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: Wählen Sie die ID des aktiven Memory-Plugins oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: Wählen Sie die ID des aktiven Kontext-Engine-Plugins; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

---

## Zusagen

`commitments` steuert abgeleitete Follow-up-Memory-Einträge: OpenClaw kann Wiedervorlagen aus Konversationsbeiträgen erkennen und sie über Heartbeat-Läufe zustellen.

- `commitments.enabled`: Aktiviert die verborgene LLM-Extraktion, Speicherung und Heartbeat-Zustellung abgeleiteter Follow-up-Zusagen. Standard: `false`.
- `commitments.maxPerDay`: Maximale Anzahl abgeleiteter Follow-up-Zusagen, die pro Agentensitzung innerhalb eines gleitenden Tages zugestellt werden. Standard: `3`.

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
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // veralteter Alias
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
- `tabCleanup` gibt nach einer Leerlaufzeit oder wenn eine Sitzung ihr Limit
  überschreitet, verfolgte Tabs des primären Agenten wieder frei. Legen Sie
  `idleMinutes: 0` oder `maxTabsPerSession: 0` fest, um den jeweiligen
  Bereinigungsmodus zu deaktivieren.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist nicht aktiviert, wenn die Option nicht festgelegt ist, sodass die Browsernavigation standardmäßig strikt bleibt.
- Legen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur fest, wenn Sie der Browsernavigation in privaten Netzwerken ausdrücklich vertrauen.
- Im strikten Modus unterliegen Endpunkte entfernter CDP-Profile (`profiles.*.cdpUrl`) bei Erreichbarkeits- und Erkennungsprüfungen derselben Blockierung privater Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für ausdrückliche Ausnahmen.
- Entfernte Profile unterstützen nur das Anhängen (Starten/Stoppen/Zurücksetzen deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden
  Sie WS(S), wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL
  bereitstellt.
- `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` gelten für die
  CDP-Erreichbarkeit entfernter und auf `attachOnly` gesetzter Profile sowie
  für Anfragen zum Öffnen von Tabs. Verwaltete Loopback-Profile behalten die
  lokalen CDP-Standardwerte bei. Bei der dauerhaften Auflistung entfernter
  Playwright-Tabs wird der größere Wert als Zeitlimit für den Vorgang verwendet.
- Wenn ein extern verwalteter CDP-Dienst über Loopback erreichbar ist, legen Sie
  für dieses Profil `attachOnly: true` fest. Andernfalls behandelt OpenClaw den
  Loopback-Port als lokal verwaltetes Browserprofil und meldet möglicherweise
  Fehler bezüglich der lokalen Port-Inhaberschaft.
- `existing-session`-Profile verwenden Chrome MCP anstelle von CDP und können
  auf dem ausgewählten Host oder über eine verbundene Browser-Node angehängt
  werden.
- `existing-session`-Profile können `userDataDir` festlegen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge zu verwenden.
- `existing-session`-Profile können `cdpUrl` festlegen, wenn Chrome bereits
  hinter einem DevTools-HTTP(S)-Erkennungsendpunkt oder einem direkten
  WS(S)-Endpunkt ausgeführt wird. In diesem Modus übergibt OpenClaw den Endpunkt
  an Chrome MCP, statt die automatische Verbindung zu verwenden;
  `userDataDir` wird für die Startargumente von Chrome MCP ignoriert.
- Für `existing-session`-Profile gelten weiterhin die aktuellen
  Routenbeschränkungen von Chrome MCP: Snapshot-/Referenz-gesteuerte Aktionen
  statt CSS-Selektor-Targeting, Upload-Hooks für jeweils eine Datei, keine
  Überschreibungen des Dialog-Zeitlimits, kein `wait --load networkidle` und
  keine Aktionen für `responsebody`, PDF-Export, Download-Abfangung oder
  Stapelverarbeitung.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch
  zu. Legen Sie `cdpUrl` nur für entfernte CDP-Profile oder zum Anhängen an den
  Endpunkt einer bestehenden Sitzung ausdrücklich fest.
- Lokal verwaltete Profile können `executablePath` festlegen, um den globalen
  Wert `browser.executablePath` für dieses Profil zu überschreiben. Verwenden
  Sie dies, um ein Profil in Chrome und ein anderes in Brave auszuführen.
- Lokal verwaltete Profile verwenden `browser.localLaunchTimeoutMs` für die
  Chrome-CDP-HTTP-Erkennung nach dem Prozessstart und
  `browser.localCdpReadyTimeoutMs` für die CDP-WebSocket-Bereitschaft nach dem
  Start. Erhöhen Sie diese Werte auf langsameren Hosts, auf denen Chrome
  erfolgreich startet, die Bereitschaftsprüfungen jedoch mit dem Startvorgang
  konkurrieren. Beide Werte müssen positive Ganzzahlen bis `120000` ms sein;
  ungültige Konfigurationswerte werden abgelehnt.
- Reihenfolge der automatischen Erkennung: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Sowohl `browser.executablePath` als auch
  `browser.profiles.<name>.executablePath` akzeptieren vor dem Start von
  Chromium `~` und `~/...` als Ihr Betriebssystem-Home-Verzeichnis.
  Das profilspezifische `userDataDir` von `existing-session`-Profilen unterstützt
  ebenfalls die Tilde-Erweiterung.
- Steuerungsdienst: nur Loopback (Port wird von `gateway.port` abgeleitet, Standardwert `18791`).
- `extraArgs` fügt dem lokalen Chromium-Start zusätzliche Start-Flags hinzu
  (beispielsweise `--disable-gpu`, Fenstergrößen oder Debug-Flags).

---

## Benutzeroberfläche

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

- `seamColor`: Akzentfarbe für die Benutzeroberfläche nativer Apps (Färbung der Sprechmodus-Blase usw.).
- `assistant`: Überschreibt die Identität in der Steuerungsoberfläche. Fällt auf die Identität des aktiven Agenten zurück.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // lokal | entfernt
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // keine | Token | Passwort | vertrauenswürdiger Proxy
      token: "your-token",
      // password: "your-password", // oder OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // für mode=trusted-proxy; siehe /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // aus | bereitstellen | Funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // optionale KI-Zwecktitel für Tool-Aufrufe (verbraucht Utility-Modell-Token)
      // embedSandbox: "scripts", // strikt | Skripte | vertrauenswürdig
      // allowExternalEmbedUrls: false, // gefährlich: absolute externe http(s)-Einbettungs-URLs zulassen
      // chatMessageMaxWidth: "min(1280px, 82%)", // optionale maximale Breite des zentrierten Chat-Transkripts
      // allowedOrigins: ["https://control.example.com"], // für die Steuerungsoberfläche außerhalb von Loopback erforderlich
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Fallback-Modus für die Herkunft aus dem Host-Header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direkt
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Standardwert: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Standardmäßig nicht festgelegt/deaktiviert.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // SSH-verifizierte automatische Genehmigung. Standardwert: aktiviert (true).
        // Legen Sie false fest, um nur die SSH-Verifizierung zu deaktivieren;
        // dies wirkt sich nicht auf autoApproveCidrs oben aus. Legen Sie für
        // ausschließlich manuelles Node-Pairing false fest UND entfernen Sie
        // autoApproveCidrs. Übergeben Sie zur Feinabstimmung ein Objekt:
        // { user, identity, timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Zusätzliche HTTP-Sperren für /tools/invoke
      deny: ["browser"],
      // Tools für Eigentümer-/Administrator-Aufrufer aus der standardmäßigen HTTP-Sperrliste entfernen
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

<Accordion title="Details zu Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit einem entfernten Gateway verbinden). Der Gateway verweigert den Start, sofern nicht `local` festgelegt ist.
- `port`: einzelner Multiplex-Port für WS + HTTP. Rangfolge: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (Tailscale-IPv4, sofern verfügbar, andernfalls Loopback) oder `custom` (eine IPv4-Adresse). Eine aufgelöste `tailnet`-Adresse und jede `custom`-Adresse außer `127.0.0.1` oder `0.0.0.0` erfordern für Clients auf demselben Host `127.0.0.1` auf demselben Port; der Start schlägt fehl, wenn einer der beiden Listener nicht gebunden werden kann. Die Erreichbarkeit außerhalb von Loopback bleibt auf die ausgewählte Schnittstelle beschränkt.
- **Veraltete Bind-Aliasse**: Verwenden Sie in `gateway.bind` Bind-Moduswerte (`auto`, `loopback`, `lan`, `tailnet`, `custom`) und keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Die standardmäßige `loopback`-Bindung lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Netzwerken (`-p 18789:18789`) trifft der Datenverkehr auf `eth0` ein, sodass der Gateway nicht erreichbar ist. Verwenden Sie `--network host`, oder legen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`) fest, um auf allen Schnittstellen zu lauschen.
- **Authentifizierung**: standardmäßig erforderlich. Bindungen außerhalb von Loopback erfordern eine Gateway-Authentifizierung. In der Praxis bedeutet dies ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Einrichtungsassistent generiert standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), legen Sie `gateway.auth.mode` explizit auf `token` oder `password` fest. Start sowie Installations-/Reparaturabläufe des Dienstes schlagen fehl, wenn beide konfiguriert sind und kein Modus festgelegt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Verwenden Sie ihn nur für vertrauenswürdige lokale Loopback-Konfigurationen; in den Eingabeaufforderungen der Einrichtung wird er absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Delegiert die Browser-/Benutzerauthentifizierung an einen identitätsbewussten Reverse-Proxy und vertraut Identitäts-Headern von `gateway.trustedProxies` (siehe [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine Proxy-Quelle **außerhalb von Loopback**; Loopback-Reverse-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Aufrufer auf demselben Host können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem Trusted-Proxy-Modus unvereinbar.
- `gateway.auth.allowTailscale`: Wenn `true`, können Identitäts-Header von Tailscale Serve die Authentifizierung für Control UI/WebSocket erfüllen (über `tailscale whois` verifiziert). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Authentifizierung **nicht**; stattdessen folgen sie dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Ist standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Begrenzer für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und Authentifizierungsbereich (gemeinsames Geheimnis und Geräte-Token werden unabhängig voneinander erfasst). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Im asynchronen Tailscale-Serve-Pfad der Control UI werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlschlags serialisiert. Gleichzeitige ungültige Versuche desselben Clients können den Begrenzer daher bereits bei der zweiten Anfrage auslösen, statt beide aufgrund eines Wettlaufs als einfache Nichtübereinstimmungen passieren zu lassen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; legen Sie `false` fest, wenn Sie absichtlich auch den localhost-Datenverkehr begrenzen möchten (für Testkonfigurationen oder strikte Proxy-Bereitstellungen).
- WS-Authentifizierungsversuche mit Browser-Ursprung werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (mehrschichtiger Schutz vor browserbasierten Brute-Force-Angriffen auf localhost).
- Bei Loopback werden diese Sperren für Browser-Ursprünge pro normalisiertem `Origin`-Wert
  isoliert, sodass wiederholte Fehlschläge von einem localhost-Ursprung nicht automatisch
  einen anderen Ursprung sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bindung) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `tailscale.serviceName`: optionaler Name eines Tailscale Service für den Serve-Modus, etwa
  `svc:openclaw`. Wenn dieser festgelegt ist, übergibt OpenClaw ihn an `tailscale serve
--service`, sodass die Control UI über einen benannten Service statt über
  den Hostnamen des Geräts bereitgestellt werden kann. Der Wert muss das Tailscale-Format
  `svc:<dns-label>` für Service-Namen verwenden; beim Start wird die abgeleitete Service-URL gemeldet.
- `tailscale.preserveFunnel`: Wenn `true` und `tailscale.mode = "serve"`, prüft OpenClaw
  vor dem erneuten Anwenden von Serve beim Start `tailscale funnel status` und überspringt
  dies, wenn eine extern konfigurierte Funnel-Route den Gateway-Port bereits abdeckt.
  Standardwert: `false`.
- `controlUi.allowedOrigins`: explizite Zulassungsliste für Browser-Ursprünge bei Gateway-WebSocket-Verbindungen. Erforderlich für öffentliche Browser-Ursprünge außerhalb von Loopback. Private UI-Aufrufe mit gleichem Ursprung im LAN/Tailnet von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
- `controlUi.toolTitles`: Aktiviert KI-generierte Zweckbezeichnungen für Tool-Aufrufe im Chat der Control UI. Standardwert: `false` (die Tool-Darstellung bleibt vollständig deterministisch und erfolgt ohne Modellaufrufe im Hintergrund). Wenn aktiviert, beschriftet die Methode `chat.toolTitles` komplexe Aufrufe über das standardmäßige Utility-Modell-Routing — das `utilityModel` des Agenten (eine Betreiberentscheidung, durch die begrenzte Tool-Argumente an den gewählten Provider gesendet werden können, wie bei jeder Utility-Aufgabe) oder die deklarierte Standardeinstellung des Sitzungs-Providers für kleine Modelle (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) — und speichert die Ergebnisse in der agentenspezifischen Zustandsdatenbank zwischen, sodass wiederholte Ansichten nie erneut berechnet werden. `utilityModel: \"\"` deaktiviert Bezeichnungen wie bei jeder anderen Utility-Aufgabe; Bezeichnungen greifen nie auf das primäre Modell zurück.
- `controlUi.chatMessageMaxWidth`: optionale maximale Breite für das zentrierte Chat-Transkript der Control UI. Akzeptiert eingeschränkte CSS-Breitenwerte wie `960px`, `82%`, `min(1280px, 82%)` und `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der den Host-Header-Ursprungs-Fallback für Bereitstellungen aktiviert, die absichtlich auf einer Host-Header-Ursprungsrichtlinie beruhen.
- `terminal.enabled`: Aktiviert das auf Administratoren beschränkte Betreiberterminal. Standardwert: `false`. Das Terminal startet ein Host-PTY im ausgewählten Agenten-Arbeitsbereich, übernimmt die Umgebung des Gateway-Prozesses und wird für Agenten mit `sandbox.mode: "all"` verweigert. Aktivieren Sie es nur für vertrauenswürdige Betreiberbereitstellungen; eine Änderung startet den Gateway neu und aktualisiert die Content-Security-Policy der Control UI.
- `terminal.shell`: optionale ausführbare Shell-Datei. Wenn nicht festgelegt, verwendet OpenClaw unter Unix `$SHELL` und unter Windows `%ComSpec%`.
- `terminal.detachedSessionTimeoutSeconds`: Gibt an, wie lange eine Terminalsitzung nach dem Abbruch ihrer Verbindung (Neuladen der Seite, Ruhezustand des Laptops) weiterbesteht und über `terminal.attach` erneut verbunden werden kann, wobei ihre letzte Ausgabe wiedergegeben wird. Standardwert: `300`. Legen Sie `0` fest, um Sitzungen sofort beim Abbruch ihrer Verbindung zu beenden. Getrennte Sitzungen führen ihre Befehle weiter aus; verkürzen Sie diesen Wert daher auf gemeinsam genutzten oder exponierten Hosts.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Bei `direct` muss `remote.url` für öffentliche Hosts `wss://` verwenden; unverschlüsseltes `ws://` wird nur für Loopback-, LAN-, Link-Local-, `.local`-, `.ts.net`- und Tailscale-CGNAT-Hosts akzeptiert.
- `remote.remotePort`: Gateway-Port auf dem entfernten SSH-Host. Standardwert: `18789`; verwenden Sie dies, wenn sich der lokale Tunnel-Port vom Port des entfernten Gateways unterscheidet.
- `remote.sshHostKeyPolicy`: Richtlinie für Hostschlüssel des macOS-SSH-Tunnels. `strict` ist der Standard und erfordert einen bereits vertrauenswürdigen Schlüssel. `openssh` ist eine explizite Aktivierung der wirksamen OpenSSH-Konfiguration für verwaltete Aliasse; prüfen Sie vor der Verwendung die übereinstimmenden SSH-Einstellungen des Benutzers und des Systems. Die macOS-App und `configure-remote` setzen diese Richtlinie beim Wechseln von Zielen auf `strict` zurück, sofern sie nicht erneut explizit aktiviert wird.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für entfernte Clients. Sie konfigurieren für sich genommen keine Gateway-Authentifizierung.
- `gateway.push.apns.relay.baseUrl`: HTTPS-Basis-URL für das externe APNs-Relay, das verwendet wird, nachdem Relay-gestützte iOS-Builds Registrierungen am Gateway veröffentlicht haben. Öffentliche App-Store-Builds verwenden das gehostete OpenClaw-Relay. Benutzerdefinierte Relay-URLs müssen zu einem bewusst separaten iOS-Build-/Bereitstellungspfad passen, dessen Relay-URL auf dieses Relay verweist.
- `gateway.push.apns.relay.timeoutMs`: Zeitüberschreitung für Sendungen vom Gateway zum Relay in Millisekunden. Standardwert: `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet eine auf die Registrierung beschränkte Sendeberechtigung an den Gateway weiter. Ein anderer Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Umgebungsüberschreibungen für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ausschließlich für die Entwicklung vorgesehener Ausweg für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten HTTPS verwenden.
- `gateway.handshakeTimeoutMs`: Zeitüberschreitung für den Gateway-WebSocket-Handshake vor der Authentifizierung in Millisekunden. Standardwert: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` hat Vorrang, wenn es festgelegt ist. Erhöhen Sie diesen Wert auf ausgelasteten oder leistungsschwachen Hosts, auf denen lokale Clients bereits eine Verbindung herstellen können, während die Aufwärmphase des Starts noch nicht abgeschlossen ist.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Zustandsmonitors in Minuten. Legen Sie `0` fest, um Neustarts durch den Zustandsmonitor global zu deaktivieren. Standardwert: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Dieser Wert muss größer oder gleich `gateway.channelHealthCheckMinutes` sein. Standardwert: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Neustarts durch den Zustandsmonitor pro Kanal/Konto innerhalb eines gleitenden Zeitfensters von einer Stunde. Standardwert: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalspezifische Deaktivierung von Neustarts durch den Zustandsmonitor, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontospezifische Überschreibung für Kanäle mit mehreren Konten. Wenn festgelegt, hat sie Vorrang vor der Überschreibung auf Kanalebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht festgelegt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung sicher geschlossen fehl (keine Verschleierung durch einen Remote-Fallback).
- `trustedProxies`: IP-Adressen von Reverse-Proxys, die TLS terminieren oder Header für weitergeleitete Clients einfügen. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Proxy-/Lokalerkennungskonfigurationen auf demselben Host gültig (beispielsweise Tailscale Serve oder ein lokaler Reverse-Proxy), machen Loopback-Anfragen jedoch **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: Wenn `true`, akzeptiert der Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standardwert: `false`, um sicher geschlossen zu reagieren.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR-/IP-Zulassungsliste zur automatischen Genehmigung der erstmaligen Kopplung eines Node-Geräts ohne angeforderte Geltungsbereiche. Ist deaktiviert, wenn nicht festgelegt. Dies genehmigt weder die Kopplung von Betreibern/Browsern/Control UI/WebChat noch Rollen-, Geltungsbereichs-, Metadaten- oder Public-Key-Upgrades automatisch.
- `gateway.nodes.pairing.sshVerify`: SSH-verifizierte automatische Genehmigung für die erstmalige Kopplung eines Node-Geräts (Standard: aktiviert). Der Gateway stellt per SSH eine Rückverbindung zum koppelnden Host her (BatchMode, strikte Hostschlüssel) und genehmigt nur bei exakter Übereinstimmung des Geräteschlüssels von `openclaw node identity`. Es gilt dieselbe Mindestberechtigung wie bei `autoApproveCidrs`; Prüfungen sind auf private/CGNAT-Quelladressen beschränkt, sofern `cidrs` diese nicht überschreibt. Legen Sie zum Deaktivieren `false` fest oder verwenden Sie zur Anpassung `{ user, identity, timeoutMs, cidrs }`. Siehe [Node-Kopplung](/de/gateway/pairing#ssh-verified-device-auto-approval-default).
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale Zulassungs-/Sperrsteuerung für deklarierte Node-Befehle nach der Kopplung und der Auswertung der Plattform-Zulassungsliste. Verwenden Sie `allowCommands`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` und `sms.send` ausdrücklich zuzulassen; `denyCommands` entfernt einen Befehl, selbst wenn er andernfalls durch eine Plattformvorgabe oder eine explizite Zulassung enthalten wäre. Die iOS-Health-Berechtigung, die Android-SMS-Berechtigung und die Gateway-Befehlsautorisierung sind voneinander unabhängig. Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie die Gerätekopplung ab und genehmigen Sie sie erneut, damit der Gateway den aktualisierten Befehls-Snapshot speichert.
  - `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die standardmäßige Sperrliste).
  - `gateway.tools.allow`: entfernt Tool-Namen für aufrufende Eigentümer/Administratoren aus der standardmäßigen HTTP-Sperrliste. Dadurch erhalten identitätstragende Aufrufende mit `operator.write` keinen Eigentümer-/Administratorzugriff; `cron`, `gateway` und `nodes` bleiben für Aufrufende, die keine Eigentümer sind, auch dann nicht verfügbar, wenn sie in der Zulassungsliste stehen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Admin-HTTP-RPC: standardmäßig als Plugin `admin-http-rpc` deaktiviert. Aktivieren Sie das Plugin, um `POST /api/v1/admin/rpc` zu registrieren. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
- Chat Completions: standardmäßig deaktiviert. Aktivieren Sie sie mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Absicherung der URL-Eingabe für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Zulassungslisten gelten als nicht gesetzt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um das Abrufen von URLs zu deaktivieren.
- Optionaler Header zur Absicherung von Antworten:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für von Ihnen kontrollierte HTTPS-Ursprünge festlegen; siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation mehrerer Instanzen

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und Zustandsverzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfortoptionen: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

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

- `enabled`: aktiviert die TLS-Terminierung am Gateway-Listener (HTTPS/WSS) (Standard: `false`).
- `autoGenerate`: generiert automatisch ein lokales, selbstsigniertes Zertifikat-Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale Entwicklung verwenden.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur Datei mit dem privaten TLS-Schlüssel; Zugriffsberechtigungen einschränken.
- `caPath`: optionaler Pfad zum CA-Bundle für die Clientüberprüfung oder benutzerdefinierte Vertrauensketten.

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
  - `"hot"`: Änderungen ohne Neustart innerhalb des Prozesses anwenden.
  - `"hybrid"` (Standard): zuerst Hot Reload versuchen; bei Bedarf auf einen Neustart zurückgreifen.
- `debounceMs`: Entprellzeitfenster in ms, bevor Konfigurationsänderungen angewendet werden (nicht negative Ganzzahl; Standard: `300`).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms auf laufende Vorgänge, bevor ein Neustart oder Hot Reload des Kanals erzwungen wird. Lassen Sie den Wert weg, um die standardmäßige begrenzte Wartezeit (`300000`) zu verwenden; setzen Sie ihn auf `0`, um unbegrenzt zu warten und regelmäßig Warnungen über weiterhin ausstehende Vorgänge zu protokollieren.

---

## Cloud-Worker-Umgebungen

Cloud-Worker sind optional. Wenn `cloudWorkers` fehlt oder `profiles` leer ist, akzeptiert OpenClaw keine Erstellung neuer Worker. Zuvor erstellte dauerhafte Datensätze werden weiterhin abgeglichen und bleiben sichtbar; die bestehende Gateway-/Node-Projektion bleibt unverändert.

Jeder Worker-Provider muss aus der vertrauenswürdigen Bereitstellungsausgabe einen SSH-`hostKey` exakt im Format `algorithm base64` ohne Hostnamen oder Kommentar zurückgeben. Der Bootstrap schreibt diesen Schlüssel in eine isolierte `known_hosts`-Datei, verwendet `StrictHostKeyChecking=yes` und schlägt vor dem Verbindungsaufbau fehl, wenn der Provider ihn nicht bereitstellt. Es gibt keinen Trust-on-First-Use-Fallback.

Die Einrichtung des Tunnels erfolgt bei Bedarf und nicht als Teil der Bereitstellung. Beim Start leitet das Gateway einen lokalen Unix-Socket des Workers rückwärts an dessen Loopback-WebSocket-Endpunkt weiter. Der Socket befindet sich in einem zufällig zugewiesenen, ausschließlich für den Eigentümer zugänglichen Remote-Verzeichnis; anders als ein Loopback-TCP-Port ist er für andere Konten auf einem Mehrbenutzer-Worker nicht erreichbar und kann nicht mit dem Port einer anderen Umgebung kollidieren. SSH-Keepalives und ein begrenzter exponentieller Backoff für erneute Verbindungsversuche laufen nur, solange der Tunnel-Eigentümer aktuell bleibt. Beim Stoppen des Tunnels werden erneute Verbindungsversuche unterbunden, bevor der SSH-Prozess geschlossen wird.

Steuerdatenverkehr und Workspace-Übertragung verwenden getrennte SSH-Verbindungen. Beide verwenden dieselbe aufgelöste Identität und isolierte angeheftete `known_hosts`-Datei, die Workspace-Übertragung nutzt jedoch kein SSH-Verbindungs-Multiplexing gemeinsam mit dem langlebigen Tunnel, sodass rsync den Steuerdatenverkehr nicht blockieren kann.

### Crabbox-Profil

Der gebündelte Provider `crabbox` stellt über die lokale Crabbox-CLI eine SSH-fähige Lease bereit. Das innere `settings.provider` wählt das Crabbox-Backend aus; es ist von der äußeren OpenClaw-Provider-ID getrennt.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Standard; "npm" nur für eine veröffentlichte Gateway-Version verwenden.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Optionaler absoluter Pfad. Standard: benachbartes ../crabbox/bin/crabbox, dann PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (erforderlich): über `--provider` an Crabbox übergebenes Backend. Verwenden Sie ein Backend, dessen Inspect-Ausgabe einen SSH-Endpunkt enthält; `aws` wählt das direkte AWS-Backend aus.
- `settings.class` (erforderlich): über `--class` an Crabbox übergebene Maschinenklasse.
- `settings.ttl` und `settings.idleTimeout` (erforderlich): positive Go-Zeitdauerzeichenfolgen, die an `--ttl` und `--idle-timeout` übergeben werden. Diese Provider-seitigen Ausfallsicherungen unterscheiden sich von der unten aufgeführten, in OpenClaw gespeicherten `lifetime`-Richtlinie.
- `settings.binary`: optionaler absoluter Pfad zur ausführbaren Crabbox-Datei. Ohne diesen prüft OpenClaw zuerst den benachbarten Crabbox-Checkout, dann ausführbare Einträge in `PATH` und ruft schließlich `crabbox` auf, damit eine fehlende CLI als sichtbarer Provider-Fehler erhalten bleibt.

Unbekannte Einstellungen werden abgelehnt. Crabbox-Anmeldedaten und Backend-spezifische Kontokonfigurationen verbleiben in der Zuständigkeit von Crabbox; speichern Sie sie nicht in `settings`. OpenClaw ruft nur die lokale CLI auf und führt von diesem Plugin aus keine Provider-Netzwerkaufrufe durch. Bei der Bereitstellung wird immer `--keep=true` übergeben; OpenClaw verwaltet den externen Lebenszyklus und zerstört die Lease mit `crabbox stop`.

<Warning>
  OpenClaw löst den Lease-lokalen `sshKey`-Pfad von Crabbox über den Provider-eigenen Secret-Resolver auf. Die aktuelle Ausgabe von `crabbox inspect --json` stellt keinen bereitgestellten `sshHostKey` bereit, daher schlagen Crabbox-basierte Worker weiterhin sicher fehl, bevor der Bootstrap oder die Tunneleinrichtung beginnt. Crabbox muss einen autoritativen Hostschlüssel pro Lease bereitstellen und `sshHostKey` exakt im Format `algorithm base64` ohne Hostnamen oder Kommentar zurückgeben. Der aktuelle Lease-lokale `known_hosts`-Cache ist kein Vertrauensmaterial für die Bereitstellung.
</Warning>

### Statisches SSH-Entwicklungsprofil

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: benannte Worker-Profile mit nicht leeren IDs, deren umgebende Leerzeichen entfernt wurden. Jedes Profil wählt einen von einem Plugin registrierten Provider aus.
- `provider`: nicht leere Worker-Provider-ID. Die Beispiele verwenden den gebündelten Provider `crabbox` und den QA-Lab-Provider `static-ssh`.
- `install`: Installationsmethode des Workers. `"bundle"` (Standard) überträgt ein Bundle mit Inhalts-Hash des installierten Gateway-Builds und unterstützt veröffentlichte, Entwicklungs- und unveröffentlichte Versionen. `"npm"` ist eine optionale Optimierung für eine unveränderte paketierte Veröffentlichung; sie installiert `openclaw@<exact gateway version>` aus der öffentlichen npm-Registry und installiert niemals `latest`.
- Gebündelte Provider-Plugins werden bei entsprechender Konfiguration automatisch ausgewählt, explizite Deaktivierungen und `plugins.allow` gelten jedoch weiterhin. Nehmen Sie die Provider-ID (zum Beispiel `crabbox`) auf, wenn eine Zulassungsliste konfiguriert ist. Externe Provider-Plugins müssen ebenfalls installiert und explizit aktiviert werden.
- `settings`: begrenztes, dem Provider zugeordnetes JSON. Das ausgewählte Plugin definiert und validiert seine Schlüssel; verwenden Sie für Werte mit Secrets [SecretRef-Objekte](/de/gateway/secrets). Der statische SSH-Provider erfordert `host`, `user`, `hostKey` und `keyRef`; `port` ist standardmäßig `22`. `hostKey` muss eine einzelne Zeile eines öffentlichen OpenSSH-Hostschlüssels (`algorithm base64`) sein, die vom bekannten Host oder über einen anderen vertrauenswürdigen Kanal bezogen wurde, ohne vorangestellte Optionen.
- `lifetime.idleTimeoutMinutes`: positive Ganzzahl von Minuten, die für eine spätere Richtlinie zur Rückgewinnung bei Inaktivität gespeichert wird.
- `lifetime.maxLifetimeMinutes`: positive Ganzzahl von Minuten, die für eine spätere Lebenszyklusrichtlinie gespeichert wird.

Auf dem Worker muss bereits eine unterstützte Node-Laufzeit (22.19+, 23.11+ oder 24+) installiert sein. Die optionale Methode `"npm"` erfordert außerdem `npm` und ausgehenden HTTPS-Zugriff auf die öffentliche npm-Registry. Die Einrichtung einer vernetzten Toolchain ist eine Provider-Richtlinie; der Bootstrap meldet einen umsetzbaren Fehler, statt Toolchains selbst zu installieren.

Diese Grundlage installiert und überprüft den Gateway-Build und stellt den Lebenszyklus zum Starten und Stoppen des Tunnels bereit, startet jedoch nicht die allgemeine OpenClaw-CLI. Der eigenständige Worker-Einstiegspunkt und die Schleife folgen im nächsten Cloud-Worker-Meilenstein.

Jeder dauerhafte Umgebungsdatensatz behält seine validierten Provider-Einstellungen, die aufgelöste Installationsmethode und die Lebenszyklusrichtlinie in einem bei der Erstellung erzeugten Profil-Snapshot. Das Ändern oder Entfernen eines benannten Profils wirkt sich auf neue Erstellungen aus; bestehende Datensätze setzen den Lebenszyklusabgleich mit diesem Snapshot fort, sofern das zuständige Plugin verfügbar bleibt.

Lebensdauerwerte sind in der ersten Cloud-Worker-Version lediglich Daten; die automatische Durchsetzung folgt mit späteren Lebenszyklusarbeiten. Profiländerungen erfordern einen Neustart des Gateways.

<Warning>
  Der Provider `static-ssh` ist eine Entwicklungs-Testumgebung des QA Lab im Quellbaum und wird aus paketierten Distributionen ausgeschlossen. Ein Worker, der auf seinem gemeinsam genutzten Host ausgeführt wird, kann nicht zugehörige Hostdaten lesen; verwenden Sie diesen Provider daher nicht als Isolationsgrenze für die Produktion.
  Der Betreiber muss den erwarteten `hostKey` angeben; OpenClaw lernt oder akzeptiert keinen Schlüssel aus der ersten Verbindung.
  Das Zerstören seiner Lease gibt nur den logischen Datensatz von OpenClaw frei; der Host wird dadurch weder gestoppt noch bereinigt.
</Warning>

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
        messageTemplate: "Von: {{messages[0].from}}\nBetreff: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Authentifizierung: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in Abfragezeichenfolgen werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` sollte sich vom aktiven Shared-Secret-Authentifizierungswert des Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) unterscheiden; beim Start wird eine nicht schwerwiegende Sicherheitswarnung protokolliert, wenn eine Wiederverwendung erkannt wird.
- `openclaw security audit` kennzeichnet die Wiederverwendung der Hook-/Gateway-Authentifizierung als kritischen Befund, einschließlich einer Gateway-Passwortauthentifizierung, die nur zum Prüfzeitpunkt angegeben wird (`--auth password --password <password>`). Führen Sie `openclaw doctor --fix` aus, um ein persistiertes, wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Absender, damit sie das neue Hook-Token verwenden.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true` festgelegt ist, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (beispielsweise `["hook:"]`).
- Wenn eine Zuordnung oder Voreinstellung einen vorlagenbasierten `sessionKey` verwendet, legen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true` fest. Statische Zuordnungsschlüssel erfordern diese explizite Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Anfrage-Nutzlast wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` gilt (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Durch Vorlagen gerenderte `sessionKey`-Werte der Zuordnung werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Zuordnungsdetails">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht bei generischen Pfaden ein Nutzlastfeld ab.
- Vorlagen wie `{{messages[0].subject}}` lesen aus der Nutzlast.
- `transform` kann auf ein JS-/TS-Modul verweisen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Pfadtraversierung werden abgelehnt).
  - Belassen Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Workspace-Verzeichnisse für Skills werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transformationsmodul in das Hook-Transformationsverzeichnis oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs greifen auf den Standardagenten zurück.
- `allowedAgentIds`: schränkt das effektive Agenten-Routing ein, einschließlich des Pfads zum Standardagenten, wenn `agentId` ausgelassen wird (`*` oder ausgelassen = alle zulassen, `[]` = alle ablehnen).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agentenläufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und vorlagengesteuerten Sitzungsschlüsseln von Zuordnungen, `sessionKey` festzulegen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Zulassungsliste für explizite `sessionKey`-Werte (Anfrage + Zuordnung), z. B. `["hook:"]`. Sie wird erforderlich, wenn eine Zuordnung oder Voreinstellung einen vorlagenbasierten `sessionKey` verwendet.
- `deliver: true` sendet die abschließende Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss zulässig sein, wenn der Modellkatalog festgelegt ist).

</Accordion>

### Gmail-Integration

- Die integrierte Gmail-Voreinstellung verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, legen Sie `hooks.allowRequestSessionKey: true` fest und beschränken Sie `hooks.allowedSessionKeyPrefixes` auf den Gmail-Namensraum, beispielsweise `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie die Voreinstellung mit einem statischen `sessionKey` anstelle des vorlagenbasierten Standardwerts.

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

- Der Gateway startet beim Hochfahren automatisch `gog gmail watch serve`, wenn es konfiguriert ist. Legen Sie zum Deaktivieren `OPENCLAW_SKIP_GMAIL_WATCHER=1` fest.
- Führen Sie nicht zusätzlich zum Gateway eine separate Instanz von `gog gmail watch serve` aus.

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
            // aktiviert: false, // oder OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Stellt vom Agenten bearbeitbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: Behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Bindungen außerhalb von Loopback: Canvas-Routen erfordern eine Gateway-Authentifizierung (Token/Passwort/vertrauenswürdiger Proxy), ebenso wie andere HTTP-Oberflächen des Gateway.
- Node-WebViews senden normalerweise keine Authentifizierungsheader; nachdem eine Node gekoppelt und verbunden wurde, gibt der Gateway Node-spezifische Capability-URLs für den Canvas-/A2UI-Zugriff bekannt.
- Capability-URLs sind an die aktive WS-Sitzung der Node gebunden und laufen schnell ab. Ein IP-basierter Fallback wird nicht verwendet.
- Fügt einen Client für das Live-Neuladen in bereitgestelltes HTML ein.
- Erstellt bei leerem Verzeichnis automatisch eine anfängliche `index.html`.
- Stellt A2UI außerdem unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Neustart des Gateway.
- Deaktivieren Sie das Live-Neuladen bei großen Verzeichnissen oder `EMFILE`-Fehlern.

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

- `minimal` (Standard): lässt `cliPath` + `sshPort` aus TXT-Einträgen weg.
- `full`: schließt `cliPath` + `sshPort` ein; die LAN-Multicast-Ankündigung erfordert weiterhin, dass das gebündelte `bonjour`-Plugin aktiviert ist.
- `off`: unterdrückt die LAN-Multicast-Ankündigung, ohne die Aktivierung des Plugins zu ändern.
- Das gebündelte `bonjour`-Plugin startet automatisch auf macOS-Hosts und muss unter Linux, Windows und containerisierten Gateway-Bereitstellungen explizit aktiviert werden.
- Der Hostname entspricht standardmäßig dem System-Hostnamen, wenn dieser eine gültige DNS-Bezeichnung ist; andernfalls wird `openclaw` verwendet. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert mDNS-Ankündigungen vollständig und überschreibt `discovery.mdns.mode`.

### Weitbereich (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Kombinieren Sie dies für eine netzwerkübergreifende Erkennung mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split-DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (eingebettete Umgebungsvariablen)

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

- Eingebettete Umgebungsvariablen werden nur angewendet, wenn der Schlüssel in der Prozessumgebung fehlt.
- `.env`-Dateien: `.env` im CWD + `~/.openclaw/.env` (keine der beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus dem Profil Ihrer Login-Shell.
- Die vollständige Rangfolge finden Sie unter [Umgebung](/de/help/environment).

### Ersetzung von Umgebungsvariablen

Referenzieren Sie Umgebungsvariablen in einer beliebigen Konfigurationszeichenfolge mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur großgeschriebene Namen abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Maskieren Sie mit `$${VAR}`, um ein literales `${VAR}` zu erhalten.
- Funktioniert mit `$include`.

---

## Geheimnisse

SecretRef-Referenzen sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie diese eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- ID-Muster für `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID für `source: "file"`: absoluter JSON-Pointer (beispielsweise `"/providers/openai/apiKey"`)
- ID-Muster für `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (unterstützt AWS-artige Selektoren des Typs `secret#json_key`)
- IDs für `source: "exec"` dürfen keine durch Schrägstriche getrennten Pfadsegmente `.` oder `..` enthalten (beispielsweise wird `a/../b` abgelehnt)

### Unterstützte Anmeldedatenoberfläche

- Kanonische Matrix: [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Anmeldedatenpfade in `openclaw.json`.
- Referenzen aus `auth-profiles.json` werden bei der Laufzeitauflösung und Prüfungsabdeckung berücksichtigt.

### Konfiguration der Secret-Provider

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optionaler expliziter Umgebungs-Provider
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
- Pfade von Datei- und exec-Providern schlagen sicher fehl, wenn die Windows-ACL-Überprüfung nicht verfügbar ist. Legen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade fest, die nicht überprüft werden können.
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokollnutzlasten über stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Legen Sie `allowSymlinkCommand: true` fest, um Symlink-Pfade zuzulassen, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, wird die Prüfung des vertrauenswürdigen Verzeichnisses auf den aufgelösten Zielpfad angewendet.
- Die untergeordnete `exec`-Umgebung ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- SecretRef-Referenzen werden zum Aktivierungszeitpunkt in einen speicherinternen Snapshot aufgelöst; anschließend lesen Anfragepfade ausschließlich diesen Snapshot.
- Während der Aktivierung wird nach aktiven Oberflächen gefiltert: Nicht aufgelöste Referenzen auf aktivierten Oberflächen verhindern Start/Neuladen, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Authentifizierungsspeicher

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

- Agentenspezifische Profile werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Referenzen auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- Veraltete flache Zuordnungen in `auth-profiles.json` wie `{ "provider": { "apiKey": "..." } }` sind kein Laufzeitformat; `openclaw doctor --fix` schreibt sie als kanonische API-Schlüsselprofile des Typs `provider:default` neu und erstellt eine Sicherung mit dem Namen `.legacy-flat.*.bak`.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-basierten Anmeldedaten für Authentifizierungsprofile.
- Statische Laufzeitanmeldedaten stammen aus aufgelösten speicherinternen Snapshots; veraltete statische Einträge in `auth.json` werden bei ihrer Erkennung bereinigt.
- Veraltete OAuth-Importe stammen aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten von Geheimnissen und die Werkzeuge `audit/configure/apply`: [Geheimnisverwaltung](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil aufgrund tatsächlicher
  Abrechnungsfehler/Fehler wegen unzureichenden Guthabens fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  selbst bei `401`-/`403`-Antworten weiterhin hier eingeordnet werden, aber providerspezifische
  Text-Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Meldungen zu Nutzungszeiträumen oder
  Ausgabenlimits von Organisationen/Workspaces verbleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale providerspezifische Überschreibungen für den Abrechnungs-Backoff in Stunden.
- `billingMaxHours`: Obergrenze in Stunden für das exponentielle Wachstum des Abrechnungs-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für mit hoher Sicherheit erkannte `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum des `auth_permanent`-Backoffs (Standard: `60`).
- `failureWindowHours`: rollierendes Zeitfenster in Stunden für Backoff-Zähler (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl von Auth-Profil-Rotationen beim selben Provider für Überlastungsfehler, bevor zum Modell-Fallback gewechselt wird (Standard: `1`). Auf eine Provider-Auslastung hinweisende Formen wie `ModelNotReadyException` werden hier eingeordnet.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer Rotation eines überlasteten Providers/Profils (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl von Auth-Profil-Rotationen beim selben Provider für Ratenbegrenzungsfehler, bevor zum Modell-Fallback gewechselt wird (Standard: `1`). Dieser Ratenbegrenzungs-Bucket umfasst providerspezifischen Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Audit

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

Das Gateway zeichnet Audit-Ereignisse **ausschließlich mit Metadaten** für Agent-Ausführungen und
Tool-Aktionen in der gemeinsamen Zustandsdatenbank auf. Metadaten zum Nachrichtenlebenszyklus sind
separat optional aktivierbar. Das Ledger speichert Identität, Zeitangaben, Tool-Namen und normalisierte
Ergebnisse, jedoch niemals Prompts, Nachrichteninhalte, Tool-Argumente, Ergebnisse oder rohen
Fehlertext. Nachrichtenzeilen speichern keine rohen Plattformkonto-, Konversations-,
Nachrichten- und Ziel-IDs. Sitzungsschlüssel von Ausführungen/Tools bleiben für Korrelationen
verfügbar und können selbst Plattformkonto- oder Peer-IDs enthalten. Datensätze
laufen nach 30 Tagen ab und das Ledger ist auf 100.000 Zeilen begrenzt. Fragen Sie sie mit
[`openclaw audit`](/de/cli/audit) oder dem Gateway-RPC
[`audit.activity.list`](/de/gateway/protocol#audit-ledger-rpc) ab. Siehe
[Audit-Verlauf](/de/gateway/audit) für das vollständige Datenmodell, die Datenschutzsemantik
und die Abdeckungsgrenzen.

- `enabled`: neue Audit-Ereignisse aufzeichnen (Standard: `true`). Das Ledger ist
  standardmäßig aktiviert, da ein erst nach einem Vorfall aktivierter Audit-Trail
  den Vorfall nicht erklären kann. Die Einstellung `false` stoppt das Einfügen neuer Ereignisse nach dem Neustart des Gateways;
  vorhandene Datensätze bleiben bis zu ihrem Ablauf lesbar. Durch erneutes Aktivieren wird
  die Aufzeichnung ab diesem Zeitpunkt fortgesetzt – die Lücke wird nicht nachträglich aufgefüllt.
- `messages`: Umfang der Nachrichtenmetadaten (Standard: `"off"`). `"direct"` zeichnet
  nur bekannte direkte Konversationen auf. `"all"` zeichnet zusätzlich Gruppen-, Kanal- und
  unbekannte Konversationstypen auf. Beide Modi bleiben inhaltsfrei und ersetzen rohe
  Bezeichner durch installationslokale, schlüsselbasierte Pseudonyme, sofern eine Korrelation
  möglich ist. Diese dienen als Korrelationshilfen und nicht der Anonymisierung; die Zustandsdatenbank
  speichert den Ableitungsschlüssel, RPC- und CLI-Exporte jedoch nicht.

Das laufende Gateway erfasst `audit.enabled` und `audit.messages` beim Start;
starten Sie es neu, nachdem Sie eine der Einstellungen geändert haben. Die Nachrichtenabdeckung umfasst derzeit
akzeptierte eingehende Nachrichten, die den Core-Dispatch erreichen, sowie eine abschließende Zeile pro
ursprünglicher logischer Nutzlast einer ausgehenden Antwort, die die gemeinsame dauerhafte Zustellung erreicht.
Plugin-lokale Pfade und Direktversandpfade, die diese gemeinsamen Grenzen umgehen, werden
noch nicht abgedeckt. Der begrenzte Hintergrund-
Writer arbeitet nach bestem Bemühen und ist kein verlustfreies Compliance-Archiv.

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

- Standardprotokolldatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Legen Sie `logging.file` für einen stabilen Pfad fest.
- `consoleLevel` wird bei Verwendung von `--verbose` auf `debug` erhöht.
- `maxFileBytes`: maximale Größe der aktiven Protokolldatei in Bytes vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw bewahrt neben der aktiven Datei bis zu fünf nummerierte Archive auf.
- `redactSensitive` / `redactPatterns`: Best-Effort-Maskierung für Konsolenausgaben, Dateiprotokolle, OTLP-Protokolldatensätze und dauerhaft gespeicherten Sitzungstranskripttext. `redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkriptrichtlinie; Sicherheitsoberflächen für UI, Tools und Diagnose schwärzen Geheimnisse weiterhin vor der Ausgabe.

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

- `enabled`: Hauptschalter für Instrumentierungsausgaben (Standard: `true`).
- `flags`: Array von Flag-Zeichenfolgen zum Aktivieren gezielter Protokollausgaben (unterstützt Platzhalter wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwellenwert ohne Fortschritt in ms zur Klassifizierung lang laufender Verarbeitungssitzungen als `session.long_running`, `session.stalled` oder `session.stuck` (Standard: `120000`). Antwort-, Tool-, Status-, Block- und ACP-Fortschritt setzen den Timer zurück; wiederholte `session.stuck`-Diagnosen verwenden einen Backoff, solange sich nichts ändert.
- `stuckSessionAbortMs`: Altersschwellenwert ohne Fortschritt in ms, ab dem geeignete ins Stocken geratene aktive Arbeit zur Wiederherstellung durch Abbruch geleert werden kann. Ist der Wert nicht gesetzt, verwendet OpenClaw das sicherere erweiterte Zeitfenster für eingebettete Ausführungen von mindestens 5 Minuten und dem 3-Fachen von `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: erfasst einen geschwärzten Stabilitäts-Snapshot vor einem OOM, wenn der Speicherdruck `critical` erreicht (Standard: `false`). Setzen Sie den Wert auf `true`, um den Scan und das Schreiben der Stabilitätspaketdatei hinzuzufügen, während normale Speicherdruckereignisse beibehalten werden.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionale signalspezifische OTLP-Endpunkte. Wenn sie festgelegt sind, überschreiben sie `otel.endpoint` nur für das jeweilige Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: aktiviert den Export von Traces, Metriken oder Protokollen.
- `otel.logsExporter`: Ziel für den Protokollexport: `"otlp"` (Standard), `"stdout"` für ein JSON-Objekt pro stdout-Zeile oder `"both"`.
- `otel.sampleRate`: Trace-Abtastrate `0`-`1`.
- `otel.flushIntervalMs`: regelmäßiges Intervall zum Leeren der Telemetriedaten in ms.
- `otel.captureContent`: optional aktivierbare Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Der boolesche Wert `true` erfasst Nachrichten-/Tool-Inhalte außerhalb des Systems; mit der Objektform können Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` und `toolDefinitions` ausdrücklich aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsschalter für die neueste experimentelle Form von GenAI-Inferenz-Spans, einschließlich Span-Namen nach dem Muster `{gen_ai.operation.name} {gen_ai.request.model}`, der Span-Art `CLIENT` und `gen_ai.provider.name` anstelle des bisherigen `gen_ai.system`. Standardmäßig behalten Spans aus Kompatibilitätsgründen `openclaw.model.call` und `gen_ai.system` bei; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsschalter für Hosts, die bereits ein globales OpenTelemetry SDK registriert haben. OpenClaw überspringt dann den Plugin-eigenen Start und das Herunterfahren des SDK, während die Diagnose-Listener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Ausführungen protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig: `true`).

---

## Aktualisierung

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
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

- `channel`: Veröffentlichungskanal – `"stable"`, `"extended-stable"`, `"beta"` oder `"dev"`. Extended-stable ist ausschließlich paketbasiert: Vordergrundbefehle steuern die Installation, während das Gateway schreibgeschützte Aktualisierungshinweise ausgeben kann.
- `checkOnStart`: beim Start des Gateways nach npm-Aktualisierungen suchen (Standard: `true`). Gespeicherte Extended-stable-Auswahlen verwenden denselben schreibgeschützten Hinweis und den 24-Stunden-Hinweiszeitplan.
- `auto.enabled`: automatische Hintergrundaktualisierungen für Stable- und Beta-Paketinstallationen aktivieren (Standard: `false`). Extended-stable wird niemals automatisch angewendet.
- `auto.stableDelayHours`: Mindestverzögerung in Stunden vor der automatischen Anwendung im Stable-Kanal (Standard: `6`; Maximum: `168`).
- `auto.stableJitterHours`: zusätzliches Zeitfenster in Stunden zur Streuung der Einführung im Stable-Kanal (Standard: `12`; Maximum: `168`).
- `auto.betaCheckIntervalHours`: Häufigkeit der Prüfungen im Beta-Kanal in Stunden (Standard: `1`; Maximum: `24`). Einstellungen für Stable-Verzögerung/-Streuung und Beta-Abfragen gelten nicht für Extended-stable.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
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

- `enabled`: globale ACP-Funktionsfreigabe (Standard: `true`; auf `false` setzen, um Optionen für ACP-Dispatch und das Starten auszublenden).
- `dispatch.enabled`: unabhängige Freigabe für den Turn-Dispatch von ACP-Sitzungen (Standard: `true`). Auf `false` setzen, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: ID des standardmäßigen ACP-Runtime-Backends (muss mit einem registrierten ACP-Runtime-Plugin übereinstimmen).
  Installieren Sie zuerst das Backend-Plugin. Wenn `plugins.allow` festgelegt ist, nehmen Sie außerdem die Backend-Plugin-ID auf (zum Beispiel `acpx`), andernfalls wird das ACP-Backend nicht geladen.
- `fallbacks`: geordnete Liste von IDs alternativer ACP-Backends, die ausprobiert werden, wenn das primäre Backend frühzeitig mit einem vorübergehend erscheinenden Fehler fehlschlägt (nicht verfügbar, ratenbegrenzt, Kontingent ausgeschöpft oder überlastet), bevor es eine Ausgabe erzeugt hat. Jeder Eintrag muss mit dem Backend eines registrierten ACP-Runtime-Plugins übereinstimmen.
- `defaultAgent`: ID des ACP-Ziel-Agenten als Ausweichoption, wenn beim Starten kein explizites Ziel angegeben wird.
- `allowedAgents`: Zulassungsliste der Agenten-IDs, die für ACP-Runtime-Sitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Leerlaufzeitfenster in ms zum Leeren von gestreamtem Text.
- `stream.maxChunkChars`: maximale Blockgröße vor dem Aufteilen der gestreamten Blockprojektion.
- `stream.repeatSuppression`: unterdrückt wiederholte Status-/Werkzeugzeilen pro Turn (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu den abschließenden Ereignissen des Turns.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach ausgeblendeten Werkzeugereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl an Zeichen der Assistentenausgabe, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Aktualisierungszeilen.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Leerlauf-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie bereinigt werden können.
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

- `cli.banner.taglineMode` steuert den Stil des Banner-Slogans:
  - `"random"` (Standard): wechselnde humorvolle/saisonale Slogans.
  - `"default"`: fester neutraler Slogan (`All your chats, one OpenClaw.`).
  - `"off"`: kein Slogantext (Bannertitel/-version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur die Slogans), setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

---

## Assistent

Von den geführten CLI-Einrichtungsabläufen (`onboard`, `configure`, `doctor`) geschriebene Metadaten:

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

Siehe die Identitätsfelder unter `agents.list` in [Agent-Standardeinstellungen](/de/gateway/config-agents#agent-defaults).

---

## Bridge (veraltet, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes stellen die Verbindung über den Gateway-WebSocket her. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt wurden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

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
    maxConcurrentRuns: 8, // Standardwert; Cron-Verteilung + isolierte Ausführung von Cron-Agent-Turns
    webhook: "https://example.invalid/legacy", // veralteter Fallback für gespeicherte Aufträge mit notify:true
    webhookToken: "replace-with-dedicated-token", // optionales Bearer-Token für die ausgehende Webhook-Authentifizierung
    sessionRetention: "24h", // Zeitdauerzeichenfolge oder false
    runLog: {
      maxBytes: "2mb", // Standardwert: 2_000_000 Byte
      keepLines: 2000, // Standardwert: 2000
    },
  },
}
```

- `sessionRetention`: Gibt an, wie lange abgeschlossene isolierte Cron-Ausführungssitzungen aufbewahrt werden, bevor die SQLite-Sitzungszeilen bereinigt werden. Steuert außerdem die Bereinigung archivierter Transkripte gelöschter Cron-Aufträge. Standardwert: `24h`; setzen Sie den Wert auf `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: Wird zur Kompatibilität mit älteren dateibasierten Cron-Ausführungsprotokollen akzeptiert. Standardwert: `2_000_000` Byte.
- `runLog.keepLines`: Neueste pro Auftrag beibehaltene SQLite-Ausführungsverlaufszeilen. Standardwert: `2000`.
- `webhookToken`: Bearer-Token für die POST-Zustellung von Cron-Webhooks (`delivery.mode = "webhook"`); wenn es weggelassen wird, wird kein Authentifizierungs-Header gesendet.
- `webhook`: Veraltete Legacy-Fallback-Webhook-URL (http/https), die von `openclaw doctor --fix` verwendet wird, um gespeicherte Aufträge zu migrieren, die noch `notify: true` enthalten; die Laufzeitzustellung verwendet pro Auftrag `delivery.mode="webhook"` zusammen mit `delivery.to` oder `delivery.completionDestination`, wenn die Ankündigungszustellung beibehalten wird.

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

- `maxAttempts`: maximale Anzahl von Wiederholungsversuchen für Cron-Jobs bei vorübergehenden Fehlern (Standard: `3`; Bereich: `0`-`10`).
- `backoffMs`: Array der Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1-10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungsversuche auslösen – `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Lassen Sie diese Option weg, um alle vorübergehenden Fehlertypen erneut zu versuchen.

Einmalige Jobs bleiben aktiviert, bis die Wiederholungsversuche ausgeschöpft sind. Anschließend werden sie deaktiviert, wobei der endgültige Fehlerstatus erhalten bleibt. Wiederkehrende Jobs verwenden dieselbe Richtlinie für Wiederholungsversuche bei vorübergehenden Fehlern, um nach dem Backoff und vor ihrem nächsten geplanten Zeitfenster erneut ausgeführt zu werden. Bei dauerhaften Fehlern oder ausgeschöpften Wiederholungsversuchen für vorübergehende Fehler wird auf den normalen wiederkehrenden Zeitplan mit Fehler-Backoff zurückgegriffen.

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

- `enabled`: aktiviert Fehlerwarnungen für Cron-Jobs (Standard: `false`).
- `after`: Anzahl aufeinanderfolgender Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, Minimum: `1`).
- `cooldownMs`: Mindestanzahl an Millisekunden zwischen wiederholten Warnungen für denselben Job (nicht negative Ganzzahl).
- `includeSkipped`: zählt aufeinanderfolgende übersprungene Ausführungen zum Schwellenwert für Warnungen hinzu (Standard: `false`). Übersprungene Ausführungen werden separat erfasst und wirken sich nicht auf den Backoff für Ausführungsfehler aus.
- `mode`: Zustellungsmodus – `"announce"` sendet über eine Kanalnachricht; `"webhook"` sendet eine POST-Anfrage an den konfigurierten Webhook.
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

- Standardziel für Benachrichtigungen über Cron-Fehler bei allen Jobs.
- `mode`: `"announce"` oder `"webhook"`; verwendet standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Überschreibung des Kanals für die Zustellung per Ankündigung. `"last"` verwendet den zuletzt bekannten Zustellungskanal erneut.
- `to`: explizites Ziel für die Ankündigung oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- Das jobspezifische `delivery.failureDestination` überschreibt diesen globalen Standard.
- Wenn weder ein globales noch ein jobspezifisches Fehlerziel festgelegt ist, greifen Jobs, die bereits über `announce` zustellen, bei einem Fehler auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) erfasst.

---

## Templatevariablen für Medienmodelle

In `tools.media.models[].args` erweiterte Template-Platzhalter:

| Variable           | Beschreibung                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger Text der eingehenden Nachricht     |
| `{{RawBody}}`      | Unverarbeiteter Text (ohne Verlaufs-/Absender-Wrapper) |
| `{{BodyStripped}}` | Text ohne Gruppenerwähnungen                      |
| `{{From}}`         | Absenderkennung                                   |
| `{{To}}`           | Zielkennung                                       |
| `{{MessageSid}}`   | ID der Kanalnachricht                             |
| `{{SessionId}}`    | UUID der aktuellen Sitzung                       |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL der eingehenden Medien                 |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                 |
| `{{Transcript}}`   | Audiotranskript                                   |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste maximale Anzahl von Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenbetreff (nach bestem Bemühen)              |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (nach bestem Bemühen) |
| `{{SenderName}}`   | Anzeigename des Absenders (nach bestem Bemühen)   |
| `{{SenderE164}}`   | Telefonnummer des Absenders (nach bestem Bemühen) |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Konfigurationseinbindungen (`$include`)

Teilen Sie die Konfiguration auf mehrere Dateien auf:

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

**Zusammenführungsverhalten:**

- Einzelne Datei: ersetzt das enthaltende Objekt.
- Array von Dateien: wird der Reihe nach tief zusammengeführt (spätere Werte überschreiben frühere).
- Gleichgeordnete Schlüssel: werden nach den Einbindungen zusammengeführt (überschreiben eingebundene Werte).
- Verschachtelte Einbindungen: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen jedoch innerhalb des obersten Konfigurationsverzeichnisses (`dirname` von `openclaw.json`) bleiben. Absolute Formen und Formen mit `../` sind nur zulässig, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden. Legen Sie `OPENCLAW_INCLUDE_ROOTS` (absolute Pfade) fest, um zusätzliche Stammverzeichnisse außerhalb des Konfigurationsverzeichnisses zuzulassen.
- Grenzwerte: Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein; jede eingebundene Datei ist auf 2 MB begrenzt.
- Von OpenClaw ausgeführte Schreibvorgänge, die nur einen einzelnen, durch eine Einbindung einer einzelnen Datei gestützten Abschnitt der obersten Ebene ändern, schreiben direkt in diese eingebundene Datei. Beispielsweise aktualisiert `plugins install` den Abschnitt `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Einbindungen auf Stammebene, Einbindungs-Arrays und Einbindungen mit Überschreibungen durch gleichgeordnete Schlüssel sind für von OpenClaw ausgeführte Schreibvorgänge schreibgeschützt. Diese Schreibvorgänge schlagen sicher fehl, statt die Konfiguration zu verflachen.
- Fehler: klare Meldungen bei fehlenden Dateien, Parsing-Fehlern, zirkulären Einbindungen, ungültigem Pfadformat und übermäßiger Länge.

---

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Doctor](/de/gateway/doctor)
