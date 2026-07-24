---
read_when:
    - Sie benötigen genaue Konfigurationssemantiken oder Standardwerte auf Feldebene
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateways oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu Referenzen der jeweiligen Subsysteme
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-07-24T03:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d1efe14cc678a94416dbc10476a69bb6076f03988a2080b6d34e4171e331abf
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referenz auf Feldebene für `~/.openclaw/openclaw.json`: Schlüssel, Standardwerte und Links zu detaillierteren Subsystemseiten. Aufgabenorientierte Anleitungen zur Einrichtung finden Sie unter [Konfiguration](/de/gateway/configuration). Kanal- und Plugin-eigene Befehlskataloge sowie detaillierte Speicher-/QMD-Optionen befinden sich auf ihren jeweiligen Seiten, nicht hier.

Das Konfigurationsformat ist **JSON5** (Kommentare und nachgestellte Kommas sind zulässig). Alle Felder sind optional; OpenClaw verwendet bei Auslassung sichere Standardwerte.

Der Code ist maßgeblicher als diese Seite:

- `openclaw config schema` gibt das für die Validierung und die Control UI verwendete aktuelle JSON-Schema aus, in das gebündelte Metadaten sowie Plugin- und Kanalmetadaten integriert sind.
- Agenten sollten vor dem Bearbeiten der Konfiguration die Tool-Aktion `gateway` `config.schema.lookup` aufrufen, um genau einen pfadbezogenen Schemaknoten abzurufen.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash dieser Dokumentation anhand der aktuellen Schemaoberfläche.

Schema-`uiHints` enthalten außerdem für jeden Pfad einen aufgelösten booleschen Wert `advanced`.
Die Control UI verwendet ihn, um häufig verwendete Felder zuerst anzuzeigen und erweiterte Felder pro
Abschnitt einzuklappen; die Suche umfasst weiterhin beide Ebenen. Ebenenmetadaten dienen nur der Darstellung.
Deklarieren Sie beim Hinzufügen eines Schlüssels dessen Ebene am Blatt, oder lassen Sie ihn die Deklaration des nächsten
Vorfahren erben. Ein Pfad ohne deklarierten Vorfahren gilt standardmäßig als erweitert.

Dedizierte Detailreferenzen:

- [Referenz zur Speicherkonfiguration](/de/reference/memory-config) für `memory.search.*`, `memory.qmd.*`, `memory.citations` und die Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`.
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten und gebündelten Befehlskatalog.
- Zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen.

---

## Kanäle

Kanalspezifische Konfigurationsschlüssel finden Sie unter [Konfiguration – Kanäle](/de/gateway/config-channels): `channels.*` für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und andere gebündelte Kanäle (Authentifizierung, Zugriffssteuerung, mehrere Konten, Erwähnungssteuerung).

## Agentenstandardwerte, mehrere Agenten, Sitzungen und Nachrichten

Unter [Konfiguration – Agenten](/de/gateway/config-agents) finden Sie:

- `agents.defaults.*` (Arbeitsbereich, Modell, Denken, Heartbeat, Speicher, Medien, Skills, Sandbox)
- `multiAgent.*` (Routing und Bindungen für mehrere Agenten)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Darstellung)
- `talk.*` (Sprechmodus)
  - `talk.consultThinkingLevel`: Überschreibung der Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter Echtzeitkonsultationen der Control UI im Sprechmodus
  - `talk.consultFastMode`: einmalige Überschreibung des Schnellmodus für Echtzeitkonsultationen der Control UI im Sprechmodus
  - `talk.speechLocale`: optionale BCP-47-Gebietsschema-ID für die Spracherkennung im Sprechmodus unter Android, iOS und macOS
  - `talk.silenceTimeoutMs`: wenn nicht festgelegt, behält der Sprechmodus das standardmäßige Pausenfenster der Plattform bei, bevor das Transkript gesendet wird (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-Relay-Ausweichlösung für abgeschlossene Echtzeittranskripte des Sprechmodus, die `openclaw_agent_consult` überspringen

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, die Konfiguration Provider-gestützter Tools und die Einrichtung benutzerdefinierter
Provider/Basis-URLs finden Sie unter
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Modelle

Provider-Definitionen, Modell-Zulassungslisten und die Einrichtung benutzerdefinierter Provider finden Sie unter
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls).
Der Stamm `models` steuert außerdem das globale Verhalten des Modellkatalogs.

```json5
{
  models: {
    // Optional. Standardwert: true. Erfordert bei Änderungen einen Neustart des Gateways.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Zuordnung mit Provider-ID als Schlüssel.
- `models.providers.*.localService`: optionaler bedarfsgesteuerter Prozessmanager für
  lokale Modellserver. OpenClaw prüft den konfigurierten Integritätsendpunkt, startet
  bei Bedarf den absoluten `command`, wartet auf die Bereitschaft und sendet anschließend die Modellanfrage.
  Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- `models.pricing.enabled`: steuert die im Hintergrund ausgeführte Initialisierung der Preisdaten, die
  beginnt, nachdem Sidecars und Kanäle den Bereitschaftspfad des Gateways erreicht haben. Bei `false`
  überspringt das Gateway das Abrufen der Preiskataloge von OpenRouter und LiteLLM; konfigurierte
  `models.providers.*.models[].cost`-Werte funktionieren weiterhin für lokale Kostenschätzungen.

## MCP

Von OpenClaw verwaltete MCP-Serverdefinitionen befinden sich unter `mcp.servers` und werden
vom eingebetteten OpenClaw und anderen Laufzeitadaptern verwendet. Die Befehle `openclaw mcp list`,
`show`, `set` und `unset` verwalten diesen Block, ohne bei Konfigurationsänderungen eine Verbindung zum
Zielserver herzustellen.

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
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

- `mcp.servers`: benannte stdio- oder Remote-MCP-Serverdefinitionen für Laufzeiten, die
  konfigurierte MCP-Tools bereitstellen.
  Remote-Einträge verwenden `transport: "streamable-http"` oder `transport: "sse"`;
  `type: "http"` ist ein CLI-nativer Alias, den `openclaw mcp set` und
  `openclaw doctor --fix` in das kanonische Feld `transport` normalisieren.
- `mcp.servers.<name>.enabled`: legen Sie `false` fest, um eine gespeicherte Serverdefinition
  beizubehalten und sie gleichzeitig von der eingebetteten OpenClaw-MCP-Erkennung und Tool-Projektion auszuschließen.
- `mcp.servers.<name>.requestTimeoutMs`: MCP-Anfragezeitüberschreitung pro Server in Millisekunden.
- `mcp.servers.<name>.connectionTimeoutMs`: Verbindungszeitüberschreitung pro Server in Millisekunden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionaler Parallelitätshinweis für
  Adapter, die entscheiden können, ob parallele MCP-Tool-Aufrufe ausgeführt werden.
- `mcp.servers.<name>.auth`: legen Sie `"oauth"` für HTTP-MCP-Server fest, die
  OAuth erfordern. Führen Sie `openclaw mcp login <name>` aus, um Token im OpenClaw-Zustand zu speichern.
- `mcp.servers.<name>.oauth`: optionale Überschreibungen für OAuth-Bereich, Weiterleitungs-URL und
  Clientmetadaten-URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP-TLS-Steuerungen
  für private Endpunkte und gegenseitiges TLS.
- `mcp.servers.<name>.toolFilter`: optionale Tool-Auswahl pro Server. `include`
  beschränkt die erkannten MCP-Tools auf übereinstimmende Namen; `exclude` blendet übereinstimmende
  Namen aus. Einträge sind exakte MCP-Tool-Namen oder einfache `*`-Globs. Für Server mit
  Ressourcen oder Prompts werden außerdem Namen für Hilfstools erzeugt (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`); für diese Namen gilt derselbe
  Filter.
- `mcp.servers.<name>.codex`: optionale Projektionssteuerung für den Codex-App-Server.
  Dieser Block enthält ausschließlich OpenClaw-Metadaten für Codex-App-Server-Threads; er wirkt sich nicht
  auf ACP-Sitzungen, die generische Konfiguration des Codex-Harness oder andere Laufzeitadapter aus.
  Ein nicht leeres `codex.agents` beschränkt den Server auf die aufgeführten OpenClaw-Agenten-IDs.
  Leere, unausgefüllte oder ungültige Agentenlisten mit Geltungsbereich werden von der Konfigurationsvalidierung
  abgelehnt und vom Laufzeit-Projektionspfad ausgelassen, anstatt global zu werden.
  `codex.defaultToolsApprovalMode` gibt Codex' natives
  `default_tools_approval_mode` für diesen Server aus. OpenClaw entfernt den Block `codex`,
  bevor die native `mcp_servers`-Konfiguration an Codex übergeben wird. Lassen Sie den Block aus, damit
  der Server für jeden Codex-App-Server-Agenten mit dem standardmäßigen MCP-Genehmigungsverhalten
  von Codex projiziert wird.
- Sitzungsbezogene gebündelte MCP-Laufzeiten verwenden eine integrierte Inaktivitäts-TTL von 10 Minuten.
  Einmalige eingebettete Läufe fordern eine Bereinigung am Laufende an; die TTL dient als Absicherung für langlebige Sitzungen und zukünftige Aufrufer.
- Änderungen unter `mcp.*` werden direkt angewendet, indem zwischengespeicherte sitzungsbezogene MCP-Laufzeiten verworfen werden.
  Bei der nächsten Tool-Erkennung/-Verwendung werden sie anhand der neuen Konfiguration neu erstellt, sodass entfernte
  `mcp.servers`-Einträge sofort bereinigt werden, anstatt auf die Inaktivitäts-TTL zu warten.
- Die Laufzeiterkennung berücksichtigt außerdem Benachrichtigungen über Änderungen an MCP-Tool-Listen, indem
  der zwischengespeicherte Katalog für diese Sitzung verworfen wird. Server, die Ressourcen oder
  Prompts ankündigen, erhalten Hilfstools zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen
  von Prompts. Wiederholte Fehler bei Tool-Aufrufen pausieren den betroffenen Server kurzzeitig, bevor
  ein weiterer Aufruf versucht wird.

Siehe [MCP](/de/cli/mcp#openclaw-as-an-mcp-client-registry) und
[CLI-Backends](/de/gateway/cli-backends#bundle-mcp-overlays) zum Laufzeitverhalten.

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

- `allowBundled`: optionale Zulassungsliste ausschließlich für gebündelte Skills (verwaltete/arbeitsbereichsbezogene Skills sind nicht betroffen).
- `load.extraDirs`: zusätzliche gemeinsam genutzte Skill-Stammverzeichnisse (niedrigste Priorität).
- `load.allowSymlinkTargets`: vertrauenswürdige reale Zielstammverzeichnisse, in die Skill-Symlinks
  aufgelöst werden dürfen, wenn sich der Link außerhalb seines konfigurierten Quellstammverzeichnisses befindet.
- `workshop.allowSymlinkTargetWrites`: ermöglicht es der Anwenden-Funktion von Skill Workshop, durch
  bereits vertrauenswürdige Symlink-Ziele zu schreiben (Standardwert: false).
- `install.preferBrew`: wenn true, werden Homebrew-Installationsprogramme bevorzugt, sofern `brew`
  verfügbar ist, bevor auf andere Installationsarten zurückgegriffen wird.
- `install.nodeManager`: bevorzugtes Node-Installationsprogramm für `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: erlaubt vertrauenswürdigen `operator.admin`-Gateway-
  Clients, private ZIP-Archive zu installieren, die über `skills.upload.*` bereitgestellt wurden
  (Standardwert: false). Dies aktiviert nur den Pfad für hochgeladene Archive; normale ClawHub-
  Installationen benötigen ihn nicht.
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfunktion für Skills, die eine primäre Umgebungsvariable deklarieren (Klartextzeichenfolge oder SecretRef-Objekt).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: begrenzen die Skill-Erkennung und den modellseitigen Skills-Prompt.
- Autonomie-/Genehmigungseinstellungen von Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) sind unter [Skills-Konfiguration](/de/tools/skills-config) dokumentiert.

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
- Legen Sie eigenständige Plugin-Dateien in `plugins.load.paths` ab; automatisch erkannte Erweiterungsstammverzeichnisse ignorieren `.js`-, `.mjs`- und `.ts`-Dateien auf oberster Ebene, damit Hilfsskripte in diesen Stammverzeichnissen den Start nicht blockieren.
- Die Erkennung unterstützt native OpenClaw-Plugins sowie kompatible Codex- und Claude-Bundles, einschließlich manifestloser Claude-Bundles mit Standardlayout.
- **Konfigurationsänderungen erfordern einen Neustart des Gateways.**
- `allow`: optionale Zulassungsliste (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: praktisches Feld für einen API-Schlüssel auf Plugin-Ebene (sofern vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Zuordnung von Umgebungsvariablen.
- `plugins.entries.<id>.hooks.allowPromptInjection`: Wenn `false`, blockiert der Kern Prompt-verändernde Hooks wie `before_prompt_build`. Dies gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.hooks.allowConversationAccess`: Wenn `true`, dürfen vertrauenswürdige, nicht gebündelte Plugins rohe Gesprächsinhalte aus typisierten Hooks wie `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` und `agent_end` lesen.
- `plugins.entries.<id>.subagent.allowModelOverride`: Diesem Plugin ausdrücklich vertrauen, damit es für Subagent-Hintergrundläufe laufbezogene Überschreibungen von `provider` und `model` anfordern darf.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Zulassungsliste kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Überschreibungen. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowModelOverride`: Diesem Plugin ausdrücklich vertrauen, damit es Modellüberschreibungen für `api.runtime.llm.complete` anfordern darf.
- `plugins.entries.<id>.llm.allowedModels`: optionale Zulassungsliste kanonischer `provider/model`-Ziele für vertrauenswürdige Überschreibungen von Plugin-LLM-Vervollständigungen. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: Diesem Plugin ausdrücklich vertrauen, damit es `api.runtime.llm.complete` mit einer nicht standardmäßigen Agenten-ID ausführen darf.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (wird anhand des nativen OpenClaw-Plugin-Schemas validiert, sofern verfügbar).
- Konto- und Laufzeiteinstellungen für Kanal-Plugins befinden sich unter `channels.<id>` und sollten durch die `channelConfigs`-Metadaten im Manifest des zuständigen Plugins beschrieben werden, nicht durch eine zentrale OpenClaw-Optionsregistrierung.

### Plugin-Konfiguration des Codex-Harnesses

Das gebündelte `codex`-Plugin verwaltet die Einstellungen des nativen Codex-App-Server-Harnesses unter
`plugins.entries.codex.config`. Die vollständige Konfigurationsoberfläche finden Sie in der
[Referenz zum Codex-Harness](/de/plugins/codex-harness-reference), das Laufzeitmodell unter
[Codex-Harness](/de/plugins/codex-harness).

`codexPlugins` gilt nur für Sitzungen, die den nativen Codex-Harness auswählen.
Dadurch werden Codex-Plugins nicht für OpenClaw-Provider-Läufe, ACP-
Gesprächsbindungen oder andere Nicht-Codex-Harnesse aktiviert.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: aktiviert die native Codex-
  Plugin-/App-Unterstützung für den Codex-Harness. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: stellt in
  jedem neuen nativen Codex-Thread jede derzeit zugängliche App bereit, die mit dem
  authentifizierten Codex-Konto verbunden ist. Standard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  Standardrichtlinie für destruktive Aktionen bei konfigurierten Plugin-App-Abfragen.
  Verwenden Sie `true`, um sichere Codex-Genehmigungsschemas ohne Rückfrage zu akzeptieren, `false`,
  um sie abzulehnen, `"auto"`, um von Codex angeforderte Genehmigungen über OpenClaw-
  Plugin-Genehmigungen zu leiten, oder `"ask"`, um bei jeder schreibenden/destruktiven
  Plugin-Aktion ohne dauerhafte Genehmigung nachzufragen. Der Modus `"ask"` löscht dauerhafte
  werkzeugbezogene Codex-Genehmigungsüberschreibungen für die betroffene App und wählt vor dem
  Start des Codex-Threads den menschlichen Genehmigungsprüfer für diese App aus.
  Standard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: aktiviert einen
  konfigurierten Plugin-Eintrag, wenn auch das globale `codexPlugins.enabled` aktiviert ist.
  Standard: `true` für explizite Einträge.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabile Marketplace-Identität, die zusammen mit `pluginName` für jeden aufgelösten
  Eintrag erforderlich ist. Unterstützt `"openai-curated"` und `"workspace-directory"`. Einträge,
  denen eines der beiden Identitätsfelder fehlt, werden ignoriert.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabile
  Codex-Plugin-Identität, die zusammen mit `marketplaceName` erforderlich ist. Ein
  `workspace-directory`-Eintrag muss genau den Marketplace-qualifizierten
  `summary.id` verwenden, den `plugin/list` zurückgibt, beispielsweise
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin-spezifische Überschreibung für destruktive Aktionen. Wenn sie fehlt, wird der globale
  Wert `allow_destructive_actions` verwendet. Der Plugin-spezifische Wert akzeptiert dieselben
  Richtlinien `true`, `false`, `"auto"` oder `"ask"`.

Bei jeder zugelassenen Plugin-App, die `"ask"` verwendet, werden die Genehmigungsanfragen
dieser App an den menschlichen Prüfer weitergeleitet. Andere Apps und Genehmigungen für Threads,
die keine Apps betreffen, behalten ihren konfigurierten Prüfer, sodass gemischte Plugin-Richtlinien
das Verhalten von `"ask"` nicht übernehmen.

`codexPlugins.enabled` ist die globale Aktivierungsanweisung. Explizite Plugin-
Einträge, die durch eine Migration geschrieben wurden, bilden die dauerhafte, kuratierte Menge
der für Installation und Reparatur infrage kommenden Plugins. Manuell konfigurierte
`workspace-directory`-Einträge müssen bereits installiert und aktiviert sein, und die von ihnen
verwalteten Apps müssen zugänglich sein; OpenClaw installiert oder authentifiziert sie nicht.
Wenn Codex die explizite Arbeitsbereichskatalog-Anfrage ablehnt, schlagen aktivierte
Arbeitsbereichseinträge geschlossen mit `marketplace_missing` fehl, während kuratierte Einträge
aus dem Standardkatalog verfügbar bleiben. `plugins["*"]` wird nicht unterstützt, es gibt
keinen `install`-Schalter, und lokale `marketplacePath`-Werte sind absichtlich keine
Konfigurationsfelder, da sie hostspezifisch sind. Anforderungen an App-Server-Version und
Bereitschaft finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Bereitschaftsprüfungen für `app/list` werden eine Stunde lang zwischengespeichert und
bei Veraltung asynchron aktualisiert. Die App-Konfiguration eines Codex-Threads wird beim
Aufbau der Codex-Harness-Sitzung berechnet, nicht bei jedem Durchlauf; verwenden Sie nach
Änderungen an der nativen Plugin-Konfiguration `/new`, `/reset` oder einen
Neustart des Gateways.

`codexPlugins.allow_all_plugins` bindet jede derzeit zugängliche Konto-
App in jeden neuen nativen Codex-Thread ein. Es installiert weder Plugins noch Apps, und
nicht zugängliche Apps bleiben ausgeschlossen. Konto-Apps verwenden die globale
Richtlinie `codexPlugins.allow_destructive_actions`. Explizite Plugin-Einträge haben Vorrang,
wenn dieselbe App auf beiden Wegen vorhanden ist. Wenn `app/list` nicht gelesen
werden kann, schlägt die kontoweite Bereitstellung geschlossen fehl.

- `plugins.entries.firecrawl.config.webFetch`: Einstellungen für den Firecrawl-Webabruf-Provider.
  - `apiKey`: Optionaler Firecrawl-API-Schlüssel für höhere Limits (akzeptiert SecretRef). Fällt auf die Umgebungsvariable `plugins.entries.firecrawl.config.webSearch.apiKey` oder `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Basis-URL der Firecrawl-API (Standard: `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte verweisen).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Zeitüberschreitung für Scraping-Anfragen in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: für die Suche zu verwendendes Grok-Modell (z. B. `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für das Memory-Dreaming. Phasen und Schwellenwerte finden Sie unter [Dreaming](/de/concepts/dreaming).
  - `enabled`: Hauptschalter für Dreaming (Standard: `false`).
  - `frequency`: Cron-Intervall für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - `model`: optionale Modellüberschreibung für den Dream-Diary-Subagent. Erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`; kombinieren Sie dies mit `allowedModels`, um Ziele einzuschränken. Bei Fehlern aufgrund eines nicht verfügbaren Modells erfolgt ein erneuter Versuch mit dem Standardsitzungsmodell; Fehler bei Vertrauen oder Zulassungslisten führen nicht stillschweigend zu einem Fallback.
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration finden Sie in der [Referenz zur Memory-Konfiguration](/de/reference/memory-config):
  - `memory.search.*`
  - `agents.entries.*.memory.search.*` für agentenspezifische Überschreibungen
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können außerdem eingebettete OpenClaw-Standardwerte aus `settings.json` bereitstellen; OpenClaw wendet diese als bereinigte Agenteneinstellungen und nicht als rohe OpenClaw-Konfigurations-Patches an.
- `plugins.slots.memory`: die ID des aktiven Memory-Plugins auswählen oder Memory-Plugins mit `"none"` deaktivieren.
- `plugins.slots.contextEngine`: die ID des aktiven Kontext-Engine-Plugins auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.

Siehe [Plugins](/de/tools/plugin).

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
- `tabCleanup` steuert die nach bestem Bemühen erfolgende regelmäßige Bereinigung nachverfolgter Tabs des primären Agenten
  nach einer Leerlaufzeit oder wenn eine Sitzung ihre Obergrenze überschreitet. Die Nachverfolgung gilt nur
  für Tabs, die vom Browser-Tool `action: "open"` erstellt wurden; vom Benutzer geöffnete Tabs oder
  Tabs mit unbekannter Eigentümerschaft werden niemals übernommen. Das Deaktivieren von `tabCleanup` deaktiviert nicht die explizite Bereinigung des Sitzungslebenszyklus.
- Host-lokale Öffnungen mit einem stabilen nativen CDP-Ziel und einer stabilen Browseridentität werden
  im gemeinsamen SQLite-Zustand gespeichert und bleiben über Gateway-Neustarts hinweg für
  `/new` und die Bereinigung des Sitzungslebenszyklus berechtigt. Native, für Tools bestimmte CDP-Ziele
  bleiben nach einem Neustart ebenfalls für die Leerlauf- und Obergrenzenbereinigung berechtigt. Chrome MCP verwendet
  prozesslokale Ziel-Handles, sodass kalte Datensätze bestehender Sitzungen auf die
  Lebenszyklusbereinigung warten, statt eine Leerlaufbereinigung bei nicht zuordenbarer
  Aktivität nach dem Neustart zu riskieren. OpenClaw überprüft das Profil und die Browserinstanz,
  bevor sie geschlossen werden. Die automatische Verbindung von Chrome MCP, eine fehlende
  `/json/version`-Browseridentität und nicht aufgelöste native Ziele bleiben vollständig
  prozesslokal, sodass sie nach einem Neustart nicht automatisch geschlossen werden. Ältere,
  nicht nachverfolgte Tabs müssen manuell geschlossen werden. Vorübergehende Fehler bleiben für
  einen späteren Wiederholungsversuch ausstehend. Siehe
  [Eigentümerschaft bei der Tab-Bereinigung](/de/tools/browser#tab-cleanup-ownership).
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist nicht gesetzt standardmäßig deaktiviert, sodass die Browsernavigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie der Browsernavigation in privaten Netzwerken bewusst vertrauen.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits- und Erkennungsprüfungen derselben Blockierung privater Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile können nur angefügt werden (Starten/Stoppen/Zurücksetzen deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- Wenn ein extern verwalteter CDP-Dienst über Loopback erreichbar ist, setzen Sie
  `attachOnly: true` dieses Profils; andernfalls behandelt OpenClaw den Loopback-Port als
  lokal verwaltetes Browserprofil und meldet möglicherweise Fehler zur lokalen Port-Eigentümerschaft.
- `existing-session`-Profile verwenden Chrome MCP anstelle von CDP und können auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node angefügt werden.
- `existing-session`-Profile können `userDataDir` festlegen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile können `cdpUrl` festlegen, wenn Chrome bereits
  hinter einem DevTools-HTTP(S)-Erkennungsendpunkt oder einem direkten WS(S)-Endpunkt ausgeführt wird. In diesem
  Modus übergibt OpenClaw den Endpunkt an Chrome MCP, anstatt die automatische Verbindung zu verwenden;
  `userDataDir` wird für Chrome-MCP-Startargumente ignoriert.
- `existing-session`-Profile behalten die aktuellen Einschränkungen der Chrome-MCP-Route bei:
  Snapshot-/Referenz-gesteuerte Aktionen anstelle der Zielauswahl über CSS-Selektoren, Upload-Hooks
  für eine einzelne Datei, keine Überschreibungen des Dialog-Timeouts, kein `wait --load networkidle` und keine
  `responsebody`-, PDF-Export-, Download-Abfang- oder Stapelaktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur für Remote-CDP-Profile oder zum Anfügen an den Endpunkt einer bestehenden Sitzung explizit.
- Lokal verwaltete Profile können `executablePath` festlegen, um für dieses Profil die globale
  Einstellung `browser.executablePath` zu überschreiben. Verwenden Sie dies, um ein Profil in
  Chrome und ein anderes in Brave auszuführen.
- Reihenfolge der automatischen Erkennung: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` und `browser.profiles.<name>.executablePath`
  akzeptieren beide `~` und `~/...` für das Home-Verzeichnis Ihres Betriebssystems vor dem Start von Chromium.
  Das profilspezifische `userDataDir` bei `existing-session`-Profilen wird ebenfalls mit Tilde-Erweiterung verarbeitet.
- Steuerungsdienst: nur Loopback (Port wird aus `gateway.port` abgeleitet, Standardwert `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergrößen- oder Debug-Flags).

---

## Benutzeroberfläche

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // Emoji, Kurztext, Bild-URL oder Daten-URI
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // Behält Kommentare nach Ausführungen in der Control UI bei; übermittelt sie nicht an Kanäle
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; weglassen, um den Warteschlangenmodus des Servers zu verwenden
      showAdvancedSettings: false, // Klappt jede Gruppe „Erweitert“ in den Einstellungen auf
    },
  },
}
```

- `seamColor`: Akzentfarbe für die UI-Elemente nativer Apps (Farbton der Sprechmodus-Blase usw.).
- `assistant`: Überschreibung der Control-UI-Identität. Greift ersatzweise auf die Identität des aktiven Agenten zurück.
- `prefs`: geräteübergreifende Bedienereinstellungen. Dies ist der kanonische Speicherort, sodass Agenten
  sie über die Genehmigungsschranke ändern können und alle Control-UI-Clients
  synchron bleiben; Browser spiegeln die Werte für einen sofortigen Start in den lokalen Speicher und behalten
  eine gerätelokale Kopie, wenn sie die Konfiguration nicht schreiben können (Betrachterbereich, offline).
  `chatPersistCommentary` verwendet standardmäßig `true`. Wird es auf `false` gesetzt, bleiben Live-
  Kommentare während einer Ausführung sichtbar, werden jedoch bei deren Abschluss entfernt, und neue
  Codex-Kommentare werden nicht in die dauerhafte Transkriptspiegelung aufgenommen. Die Übermittlung über
  Nachrichtenkanäle bleibt davon getrennt und unverändert.
  `showAdvancedSettings` verwendet standardmäßig `false`; die Einstellungssuche kann vorübergehend
  eine passende erweiterte Gruppe öffnen, ohne diese Einstellung zu ändern.
  Reine Darstellungsoptionen wie Textskalierung, Chatbreite und Live-
  Aktivität der Seitenleiste bleiben browserlokal und werden in den Einstellungen konfiguriert.
  Verbundene Clients übernehmen serverseitige Änderungen live: Das Gateway sendet
  nach jedem dauerhaft gespeicherten Konfigurationsschreibvorgang ein ausschließlich den Hash enthaltendes `config.changed`-Ereignis, und
  die Clients aktualisieren ihren Snapshot (wird übersprungen, solange ein lokaler Einstellungsentwurf
  ungespeicherte Änderungen enthält). Clients gleichen sich bei einer erneuten Verbindung ab.

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
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // optionale KI-Zwecktitel für Tool-Aufrufe (verbraucht Tokens des Utility-Modells)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // gefährlich: erlaubt absolute externe http(s)-Einbettungs-URLs
      // allowedOrigins: ["https://control.example.com"], // für Control UI außerhalb von Loopback erforderlich
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Fallback-Modus für den Ursprung über den Host-Header
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Standardwert: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Standardmäßig nicht gesetzt/deaktiviert.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // SSH-verifizierte automatische Genehmigung. Standardmäßig aktiviert (true).
        // Auf false setzen, um nur die SSH-Verifizierung zu deaktivieren; dies wirkt sich nicht auf
        // autoApproveCidrs oben aus. Für ausschließlich manuelles Node-Pairing auf false setzen UND
        // autoApproveCidrs nicht setzen. Zum Anpassen ein Objekt übergeben: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      commands: {
        allow: ["canvas.navigate"],
        deny: ["system.run"],
      },
    },
    tools: {
      // Zusätzliche HTTP-Ablehnungen für /tools/invoke
      deny: ["browser"],
      // Entfernt Tools für Aufrufer mit Eigentümer-/Administratorrolle aus der standardmäßigen HTTP-Ablehnungsliste
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

<Accordion title="Details zu den Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit Remote-Gateway verbinden). Der Gateway verweigert den Start, sofern nicht `local`.
- `port`: einzelner multiplexierter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (Tailscale-IPv4, sofern verfügbar, andernfalls Loopback) oder `custom` (eine IPv4-Adresse). Eine aufgelöste `tailnet`-Adresse und jede `custom`-Adresse außer `127.0.0.1` oder `0.0.0.0` erfordern `127.0.0.1` am selben Port für Clients auf demselben Host; der Start schlägt fehl, wenn einer der Listener keine Bindung herstellen kann. Die Nicht-Loopback-Exposition bleibt auf die ausgewählte Schnittstelle beschränkt.
- **Veraltete Bind-Aliasse**: Verwenden Sie Bind-Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Die standardmäßige `loopback`-Bindung lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Netzwerken (`-p 18789:18789`) trifft Datenverkehr auf `eth0` ein, sodass der Gateway nicht erreichbar ist. Verwenden Sie `--network host` oder legen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`) fest, um auf allen Schnittstellen zu lauschen.
- **Authentifizierung**: standardmäßig erforderlich. Nicht-Loopback-Bindungen erfordern eine Gateway-Authentifizierung. In der Praxis bedeutet dies ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent generiert standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start sowie Abläufe zur Dienstinstallation/-reparatur schlagen fehl, wenn beide konfiguriert sind und kein Modus festgelegt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale Loopback-Konfigurationen verwenden; diese Option wird in Onboarding-Eingabeaufforderungen bewusst nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Browser-/Benutzerauthentifizierung an einen identitätsbewussten Reverse-Proxy delegieren und Identitäts-Header von `gateway.trustedProxies` vertrauen (siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet standardmäßig eine **Nicht-Loopback**-Proxyquelle; Loopback-Reverse-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`. Interne Aufrufer auf demselben Host können `gateway.auth.password` als lokalen direkten Fallback verwenden; `gateway.auth.token` bleibt mit dem Trusted-Proxy-Modus gegenseitig unverträglich.
- `gateway.auth.allowTailscale`: Wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung der Control UI/des WebSockets erfüllen (über `tailscale whois` verifiziert). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Authentifizierung **nicht**; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Begrenzer für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und pro Authentifizierungsbereich (gemeinsames Geheimnis und Geräte-Token werden unabhängig voneinander verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben `{scope, clientIp}` vor dem Schreiben des Fehlschlags serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können den Begrenzer daher bereits bei der zweiten Anfrage auslösen, statt beide aufgrund eines Wettlaufs lediglich als Nichtübereinstimmungen passieren zu lassen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie bewusst auch Localhost-Datenverkehr begrenzen möchten (für Testkonfigurationen oder strikte Proxy-Bereitstellungen).
- WS-Authentifizierungsversuche mit Browser-Ursprung werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (mehrschichtiger Schutz vor browserbasierten Brute-Force-Angriffen auf Localhost).
- Auf Loopback werden diese Sperren für Browser-Ursprünge pro normalisiertem `Origin`
  -Wert isoliert, sodass wiederholte Fehlschläge von einem Localhost-Ursprung nicht automatisch
  einen anderen Ursprung sperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bindung) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `tailscale.serviceName`: optionaler Tailscale-Dienstname für den Serve-Modus, beispielsweise
  `svc:openclaw`. Wenn festgelegt, übergibt OpenClaw ihn an `tailscale serve
--service`, damit die Control UI über einen benannten Dienst statt
  über den Geräte-Hostnamen bereitgestellt werden kann. Der Wert muss dem `svc:<dns-label>`
  -Dienstnamenformat von Tailscale entsprechen; beim Start wird die abgeleitete Dienst-URL ausgegeben.
- `tailscale.preserveFunnel`: Wenn `true` und `tailscale.mode = "serve"`, prüft OpenClaw
  vor der erneuten Anwendung von Serve beim Start `tailscale funnel status` und überspringt
  sie, wenn eine extern konfigurierte Funnel-Route den Gateway-Port bereits abdeckt.
  Standardwert `false`.
- `controlUi.allowedOrigins`: explizite Zulassungsliste für Browser-Ursprünge bei Gateway-WebSocket-Verbindungen. Für öffentliche Nicht-Loopback-Browser-Ursprünge erforderlich. Private UI-Ladevorgänge gleichen Ursprungs im LAN/Tailnet von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
- `controlUi.toolTitles`: Aktivieren Sie KI-generierte Zweckbezeichnungen für Tool-Aufrufe im Control-UI-Chat. Standard: `false` (die Tool-Darstellung bleibt vollständig deterministisch, ohne Modellaufrufe im Hintergrund). Bei Aktivierung kennzeichnet die Methode `chat.toolTitles` komplexe Aufrufe über das standardmäßige Utility-Modell-Routing – `utilityModel` des Agenten (eine Betreiberentscheidung, die wie bei jeder Utility-Aufgabe begrenzte Tool-Argumente an den ausgewählten Provider senden kann) oder den vom Session-Provider deklarierten Standard für kleine Modelle (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) – und speichert Ergebnisse in der agentenspezifischen Zustandsdatenbank zwischen, sodass wiederholte Ansichten nie erneut abgerechnet werden. `utilityModel: \"\"` deaktiviert Bezeichnungen wie bei jeder anderen Utility-Aufgabe; Bezeichnungen greifen nie auf das primäre Modell zurück.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der den Host-Header-Ursprungs-Fallback für Bereitstellungen aktiviert, die bewusst auf Host-Header-Ursprungsrichtlinien angewiesen sind.
- `terminal.enabled`: Aktivieren Sie das auf Administratoren beschränkte Betreiberterminal. Standard: `false`. Das Terminal startet ein Host-PTY im ausgewählten Agenten-Arbeitsbereich, übernimmt die Umgebung des Gateway-Prozesses und wird für Agenten mit `sandbox.mode: "all"` verweigert. Aktivieren Sie es nur für vertrauenswürdige Betreiberbereitstellungen; eine Änderung startet den Gateway neu und aktualisiert die Content-Security-Policy der Control UI.
- `terminal.shell`: optionale Shell-Programmdatei. Ist diese nicht festgelegt, verwendet OpenClaw `$SHELL` unter Unix und `%ComSpec%` unter Windows.
- `terminal.detachedSessionTimeoutSeconds`: wie lange eine Terminal-Sitzung nach dem Abbruch ihrer Verbindung (Neuladen der Seite, Ruhezustand des Laptops) bestehen bleibt und über `terminal.attach` erneut verbunden werden kann, wobei ihre letzten Ausgaben wiedergegeben werden. Standard: `300`. Setzen Sie `0`, um Sitzungen sofort beim Verbindungsabbruch zu beenden. Getrennte Sitzungen führen ihre Befehle weiter aus; verkürzen Sie diesen Zeitraum daher auf gemeinsam genutzten oder exponierten Hosts.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` bei öffentlichen Hosts `wss://` sein; unverschlüsseltes `ws://` wird nur für Loopback-, LAN-, Link-Local-, `.local`-, `.ts.net`- und Tailscale-CGNAT-Hosts akzeptiert.
- `remote.remotePort`: Gateway-Port auf dem entfernten SSH-Host. Standardmäßig `18789`; verwenden Sie dies, wenn der lokale Tunnel-Port vom entfernten Gateway-Port abweicht.
- `remote.tlsFingerprint`: erwarteter SHA-256-Zertifikat-Fingerabdruck für einen entfernten `wss://`-Gateway. Die macOS-App wendet ihn sowohl auf Betreiber-/Steuerungsverbindungen als auch auf Companion-Node-Verbindungen an. Ohne einen expliziten Wert zeichnet macOS einen Pin bei der ersten Verwendung erst auf, nachdem die normale Systemvertrauensprüfung erfolgreich war.
- `remote.sshHostKeyPolicy`: Richtlinie für SSH-Tunnel-Hostschlüssel unter macOS. `strict` ist der Standard und erfordert einen bereits vertrauenswürdigen Schlüssel. `openssh` ist eine explizite Zustimmung zur effektiven OpenSSH-Konfiguration für verwaltete Aliasse; prüfen Sie vor der Verwendung die übereinstimmenden SSH-Einstellungen des Benutzers und des Systems. Die macOS-App und `configure-remote` setzen diese Richtlinie beim Wechsel des Ziels auf `strict` zurück, sofern nicht erneut ausdrücklich zugestimmt wird.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für Remote-Clients. Sie konfigurieren nicht eigenständig die Gateway-Authentifizierung.
- `gateway.push.apns.relay.baseUrl`: HTTPS-Basis-URL für den externen APNs-Relay, der verwendet wird, nachdem Relay-gestützte iOS-Builds Registrierungen beim Gateway veröffentlicht haben. Öffentliche App-Store-Builds verwenden den gehosteten OpenClaw-Relay. Benutzerdefinierte Relay-URLs müssen einem bewusst separaten iOS-Build-/Bereitstellungspfad entsprechen, dessen Relay-URL auf diesen Relay verweist.
- `gateway.push.apns.relay.timeoutMs`: Zeitüberschreitung für Sendungen vom Gateway zum Relay in Millisekunden. Standardmäßig `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, nimmt diese Identität in die Relay-Registrierung auf und leitet eine auf die Registrierung beschränkte Sendeberechtigung an den Gateway weiter. Ein anderer Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Umgebungsüberschreibungen für die oben genannte Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für die Entwicklung vorgesehener Ausweg für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten HTTPS verwenden.
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: optionale Umgebungsüberschreibung für das integrierte Zeitlimit des Gateway-WebSocket-Handshakes vor der Authentifizierung.
- `channels.<provider>.healthMonitor.enabled`: kanalspezifische Deaktivierung von Neustarts durch den Zustandsmonitor, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontospezifische Überschreibung für Kanäle mit mehreren Konten. Wenn festgelegt, hat sie Vorrang vor der Überschreibung auf Kanalebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht festgelegt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung sicher geschlossen fehl (keine Verschleierung durch Remote-Fallback).
- `trustedProxies`: IP-Adressen von Reverse-Proxys, die TLS terminieren oder weitergeleitete Client-Header einfügen. Führen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Proxy-/Lokalerkennungs-Konfigurationen auf demselben Host gültig (beispielsweise Tailscale Serve oder ein lokaler Reverse-Proxy), sie machen Loopback-Anfragen jedoch **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: Wenn `true`, akzeptiert der Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standardmäßig `false` für ein sicher geschlossenes Verhalten.
- `gateway.nodes.pairing.autoApproveCidrs`: optionale CIDR-/IP-Zulassungsliste zur automatischen Genehmigung der erstmaligen Kopplung eines Node-Geräts ohne angeforderte Berechtigungsbereiche. Ist sie nicht festgelegt, ist sie deaktiviert. Dies genehmigt weder die Kopplung von Betreiber/Browser/Control UI/WebChat noch Upgrades von Rolle, Berechtigungsbereich, Metadaten oder öffentlichem Schlüssel automatisch.
- `gateway.nodes.pairing.sshVerify`: SSH-verifizierte automatische Genehmigung der erstmaligen Kopplung eines Node-Geräts (Standard: aktiviert). Der Gateway stellt per SSH eine Rückverbindung zum koppelnden Host her (BatchMode, strikte Hostschlüssel) und genehmigt nur bei einer exakten Übereinstimmung des `openclaw node identity`-Geräteschlüssels. Es gilt dieselbe Mindestvoraussetzung wie für `autoApproveCidrs`; Prüfungen sind auf private/CGNAT-Quelladressen beschränkt, sofern `cidrs` sie nicht überschreibt. Setzen Sie zum Deaktivieren `false` oder zum Anpassen `{ user, identity, timeoutMs, cidrs }`. Siehe [Node-Kopplung](/de/gateway/pairing#ssh-verified-device-auto-approval-default).
- `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny`: globale Zulassungs-/Sperrsteuerung für deklarierte Node-Befehle nach der Kopplung und der Auswertung der Plattform-Zulassungsliste. Verwenden Sie `commands.allow`, um gefährliche Node-Befehle wie `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` und `sms.send` zuzulassen; `commands.deny` entfernt einen Befehl, selbst wenn er andernfalls durch eine Plattformvorgabe oder eine ausdrückliche Zulassung eingeschlossen wäre. Die iOS-Health-Berechtigung, die Android-SMS-Berechtigung und die Gateway-Befehlsautorisierung sind voneinander unabhängig. Nachdem eine Node ihre deklarierte Befehlsliste geändert hat, lehnen Sie die Gerätekopplung ab und genehmigen Sie sie erneut, damit das Gateway den aktualisierten Befehlssnapshot speichert.
- `gateway.tools.deny`: zusätzliche Toolnamen, die für HTTP `POST /tools/invoke` gesperrt sind (erweitert die standardmäßige Sperrliste).
- `gateway.tools.allow`: Toolnamen aus der standardmäßigen HTTP-Sperrliste für
  Aufrufer mit Eigentümer-/Administratorrechten entfernen. Dadurch erhalten identitätstragende `operator.write`-
  Aufrufer keinen Eigentümer-/Administratorzugriff; `cron`, `gateway` und `nodes` bleiben
  für Aufrufer ohne Eigentümerrechte nicht verfügbar, selbst wenn sie auf der Zulassungsliste stehen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Admin-HTTP-RPC: standardmäßig deaktiviert, ebenso wie das Plugin `admin-http-rpc`. Aktivieren Sie das Plugin, um `POST /api/v1/admin/rpc` zu registrieren. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
- Chat Completions: standardmäßig deaktiviert. Aktivieren Sie sie mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Absicherung der URL-Eingabe für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Zulassungslisten gelten als nicht festgelegt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
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
- `autoGenerate`: generiert automatisch ein lokales selbstsigniertes Zertifikat-Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale Entwicklungszwecke.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zur Datei mit dem privaten TLS-Schlüssel; schränken Sie die Berechtigungen ein.
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
  - `"off"`: ignoriert Live-Änderungen; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: startet den Gateway-Prozess bei einer Konfigurationsänderung immer neu.
  - `"hot"`: wendet Änderungen prozessintern ohne Neustart an.
  - `"hybrid"` (Standard): versucht zuerst einen Hot Reload; greift bei Bedarf auf einen Neustart zurück.
- `debounceMs`: Entprellzeitraum in ms, bevor Konfigurationsänderungen angewendet werden (nicht negative Ganzzahl; Standard: `300`).
- `deferralTimeoutMs`: optionale maximale Wartezeit in ms für laufende Vorgänge, bevor ein Neustart oder Hot Reload des Kanals erzwungen wird. Lassen Sie den Wert weg, um die standardmäßige begrenzte Wartezeit (`300000`) zu verwenden; legen Sie `0` fest, um unbegrenzt zu warten und regelmäßig Warnungen über weiterhin ausstehende Vorgänge zu protokollieren.

---

## Cloud-Worker-Umgebungen

Cloud-Worker sind optional. Wenn `cloudWorkers` fehlt oder `profiles` leer ist, akzeptiert OpenClaw keine Erstellung neuer Worker. Zuvor erstellte dauerhafte Datensätze werden weiterhin abgeglichen und bleiben sichtbar; die bestehende Gateway-/Node-Projektion bleibt unverändert.

Jeder Worker-Provider muss aus der vertrauenswürdigen Bereitstellungsausgabe einen SSH-`hostKey` exakt als `algorithm base64` ohne Hostnamen oder Kommentar zurückgeben. Der Bootstrap schreibt diesen Schlüssel in eine isolierte `known_hosts`-Datei, verwendet `StrictHostKeyChecking=yes` und schlägt vor dem Verbindungsaufbau fehl, wenn der Provider ihn nicht bereitstellt. Es gibt keinen Rückgriff auf „Trust on First Use“.

Der Tunnel wird bei Bedarf und nicht als Teil der Bereitstellung eingerichtet. Nach dem Start leitet das Gateway einen lokalen Unix-Socket des Workers rückwärts an seinen Loopback-WebSocket-Endpunkt weiter. Der Socket befindet sich in einem zufällig zugewiesenen Remote-Verzeichnis, auf das nur der Eigentümer zugreifen kann. Anders als ein Loopback-TCP-Port ist er auf einem Mehrbenutzer-Worker für andere Konten nicht erreichbar und kann nicht mit dem Port einer anderen Umgebung kollidieren. SSH-Keepalives und begrenztes exponentielles Backoff für Neuverbindungen werden nur ausgeführt, solange der Tunnel-Eigentümer aktuell bleibt. Beim Beenden des Tunnels werden Neuverbindungen gesperrt, bevor der SSH-Prozess geschlossen wird.

Steuerdatenverkehr und Workspace-Übertragung verwenden separate SSH-Verbindungen. Beide verwenden dieselbe aufgelöste Identität und dieselbe isolierte, fest verankerte `known_hosts`-Datei, die Workspace-Übertragung teilt jedoch kein SSH-Verbindungs-Multiplexing mit dem langlebigen Tunnel, sodass rsync den Steuerdatenverkehr nicht blockieren kann.

### Crabbox-Profil

Der gebündelte Provider `crabbox` stellt über die lokale Crabbox-CLI eine SSH-fähige Lease bereit. Der innere Wert `settings.provider` wählt das Crabbox-Backend aus; er ist von der äußeren OpenClaw-Provider-ID getrennt.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Standard; verwenden Sie "npm" nur für eine veröffentlichte Gateway-Version.
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

- `settings.provider` (erforderlich): Crabbox-Backend, das über `--provider` weitergegeben wird. Verwenden Sie ein Backend, dessen Prüfausgabe einen SSH-Endpunkt enthält; `aws` wählt das direkte AWS-Backend aus.
- `settings.class` (erforderlich): Crabbox-Maschinenklasse, die an `--class` übergeben wird.
- `settings.ttl` und `settings.idleTimeout` (erforderlich): positive Go-Zeitdauerzeichenfolgen, die an `--ttl` und `--idle-timeout` übergeben werden. Diese Provider-seitigen Ausfallsicherungen unterscheiden sich von der unten gespeicherten `lifetime`-Richtlinie von OpenClaw.
- `settings.binary`: optionaler absoluter Pfad zur ausführbaren Crabbox-Datei. Ohne diesen prüft OpenClaw zuerst das benachbarte Crabbox-Checkout, dann ausführbare Einträge in `PATH` und ruft schließlich `crabbox` auf, sodass eine fehlende CLI als sichtbarer Provider-Fehler bestehen bleibt.

Unbekannte Einstellungen werden abgelehnt. Crabbox-Anmeldedaten und Backend-spezifische Kontokonfigurationen bleiben Eigentum von Crabbox; legen Sie sie nicht in `settings` ab. OpenClaw ruft nur die lokale CLI auf und führt aus diesem Plugin keine Provider-Netzwerkaufrufe durch. Bei der Bereitstellung wird immer `--keep=true` übergeben; OpenClaw verwaltet den externen Lebenszyklus und zerstört die Lease mit `crabbox stop`.

<Note>
  OpenClaw löst den Lease-lokalen `sshKey`-Pfad von Crabbox über den Provider-eigenen Geheimnisauflöser auf und verankert den maßgeblichen `sshHostKey`, der von `crabbox inspect --json` zurückgegeben wird. Die AWS-Zulassung erfordert außerdem `providerMetadata.instanceProfileAttached`. Installieren Sie für diesen geschlossenen Prüfvertrag Crabbox 0.38.1 oder neuer.
</Note>

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

- `profiles`: benannte Worker-Profile mit nicht leeren IDs, bei denen umgebende Leerzeichen entfernt wurden. Jedes Profil wählt einen durch ein Plugin registrierten Provider aus.
- `provider`: nicht leere Worker-Provider-ID. Die Beispiele verwenden den gebündelten Provider `crabbox` und den QA-Lab-Provider `static-ssh`.
- `install`: Installationsmethode des Workers. `"bundle"` (Standard) überträgt ein anhand des Inhalts gehashtes Bundle des installierten Gateway-Builds und unterstützt veröffentlichte, Entwicklungs- und unveröffentlichte Versionen. `"npm"` ist eine optionale Optimierung für eine unveränderte paketierte Veröffentlichung; sie installiert `openclaw@<exact gateway version>` aus der öffentlichen npm-Registry und installiert niemals `latest`.
- Gebündelte Provider-Plugins werden bei entsprechender Konfiguration automatisch ausgewählt, explizite Deaktivierungen und `plugins.allow` gelten jedoch weiterhin. Nehmen Sie die Provider-ID (zum Beispiel `crabbox`) auf, wenn eine Zulassungsliste konfiguriert ist. Externe Provider-Plugins müssen außerdem installiert und explizit aktiviert werden.
- `settings`: Provider-eigenes begrenztes JSON. Das ausgewählte Plugin definiert und validiert seine Schlüssel; verwenden Sie für geheimnistragende Werte [SecretRef-Objekte](/de/gateway/secrets). Der statische SSH-Provider erfordert `host`, `user`, `hostKey` und `keyRef`; `port` verwendet standardmäßig `22`. `hostKey` muss eine OpenSSH-Zeile mit einem öffentlichen Hostschlüssel (`algorithm base64`) sein, die vom bekannten Host oder über einen anderen vertrauenswürdigen Kanal bezogen wurde und kein Optionspräfix enthält.
- `lifetime.idleTimeoutMinutes`: positive Ganzzahl in Minuten, die für eine spätere Richtlinie zur Rückgewinnung im Leerlauf gespeichert wird.
- `lifetime.maxLifetimeMinutes`: positive Ganzzahl in Minuten, die für eine spätere Lebenszyklusrichtlinie gespeichert wird.

Auf dem Worker muss bereits eine unterstützte Node-Laufzeit (22.22.3+, 24.15+ oder 25.9+) mit WAL-Reset-sicherem SQLite installiert sein. Die optionale Methode `"npm"` erfordert außerdem `npm` und ausgehenden HTTPS-Zugriff auf die öffentliche npm-Registry. Die Einrichtung vernetzter Toolchains ist Teil der Provider-Richtlinie; der Bootstrap meldet einen handlungsrelevanten Fehler, anstatt Toolchains selbst zu installieren.

Diese Grundlage installiert und überprüft den Gateway-Build und stellt den Lebenszyklus zum Starten und Beenden des Tunnels bereit, startet jedoch nicht die allgemeine OpenClaw-CLI. Der eigenständige Worker-Einstiegspunkt und die Schleife folgen im nächsten Cloud-Worker-Meilenstein.

Jeder dauerhafte Umgebungsdatensatz behält seine validierten Provider-Einstellungen, die aufgelöste Installationsmethode und die Lebenszyklusrichtlinie in einer bei der Erstellung angelegten Profil-Momentaufnahme. Das Ändern oder Entfernen eines benannten Profils wirkt sich auf neue Erstellungen aus; bestehende Datensätze setzen den Lebenszyklusabgleich mit dieser Momentaufnahme fort, sofern das zuständige Plugin verfügbar bleibt.

Lebensdauerwerte sind in der ersten Cloud-Worker-Version lediglich Daten; die automatische Durchsetzung folgt mit späteren Lebenszyklusarbeiten. Profiländerungen erfordern einen Neustart des Gateways.

<Warning>
  Der Provider `static-ssh` ist eine QA-Lab-Entwicklungstestumgebung für den Quellbaum und von paketierten Distributionen ausgeschlossen. Ein auf seinem gemeinsam genutzten Host ausgeführter Worker kann nicht zugehörige Hostdaten lesen. Verwenden Sie diesen Provider daher nicht als Produktionsisolationsgrenze.
  Sein Betreiber muss den erwarteten `hostKey` bereitstellen; OpenClaw erlernt oder akzeptiert bei der ersten Verbindung keinen Schlüssel.
  Das Zerstören seiner Lease gibt nur den logischen Datensatz von OpenClaw frei; der Host wird dadurch weder angehalten noch bereinigt.
</Warning>

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Authentifizierung: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in Abfragezeichenfolgen werden abgelehnt.

Hinweise zur Validierung und Sicherheit:

- `hooks.enabled=true` erfordert einen nicht leeren Wert für `hooks.token`.
- `hooks.token` sollte sich von der aktiven Shared-Secret-Authentifizierung des Gateways unterscheiden (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); beim Start wird eine nicht schwerwiegende Sicherheitswarnung protokolliert, wenn eine Wiederverwendung erkannt wird.
- `openclaw security audit` kennzeichnet die Wiederverwendung der Hook-/Gateway-Authentifizierung als kritischen Befund, einschließlich einer nur zum Prüfzeitpunkt bereitgestellten Gateway-Passwortauthentifizierung (`--auth password --password <password>`). Führen Sie `openclaw doctor --fix` aus, um einen persistent gespeicherten, wiederverwendeten Wert für `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Sender, sodass sie das neue Hook-Token verwenden.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).
- Wenn eine Zuordnung oder Voreinstellung einen vorlagenbasierten Wert für `sessionKey` verwendet, legen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true` fest. Statische Zuordnungsschlüssel erfordern diese explizite Aktivierung nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Anfragenutzlast wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst
  - Durch Vorlagen gerenderte Zuordnungswerte für `sessionKey` werden als extern bereitgestellt behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Zuordnungsdetails">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht bei generischen Pfaden ein Nutzlastfeld ab.
- Vorlagen wie `{{messages[0].subject}}` lesen aus der Nutzlast.
- `transform` kann auf ein JS-/TS-Modul verweisen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Pfadtraversierung werden abgelehnt).
  - Belassen Sie `hooks.transformsDir` unter `~/.openclaw/hooks/transforms`; Skill-Verzeichnisse im Workspace werden abgelehnt. Wenn `openclaw doctor` diesen Pfad als ungültig meldet, verschieben Sie das Transformationsmodul in das Transformationsverzeichnis der Hooks oder entfernen Sie `hooks.transformsDir`.
- `agentId` leitet an einen bestimmten Agenten weiter; unbekannte IDs fallen auf den Standardagenten zurück.
- `allowedAgentIds`: beschränkt das effektive Agenten-Routing, einschließlich des Standardagentenpfads, wenn `agentId` weggelassen wird (`*` oder weggelassen = alle zulassen, `[]` = alle ablehnen).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agentenläufe ohne expliziten Wert für `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und vorlagengesteuerten Zuordnungssitzungsschlüsseln, `sessionKey` festzulegen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Zulassungsliste für explizite Werte von `sessionKey` (Anfrage + Zuordnung), z. B. `["hook:"]`. Sie wird erforderlich, sobald eine Zuordnung oder Voreinstellung einen vorlagenbasierten Wert für `sessionKey` verwendet.
- `deliver: true` sendet die endgültige Antwort an einen Kanal; `channel` verwendet standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss zulässig sein, wenn der Modellkatalog festgelegt ist).

</Accordion>

### Gmail-Integration

- Die integrierte Gmail-Voreinstellung verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Dieser nach Nachricht getrennte Schlüssel isoliert den Konversationskontext, nicht Tools oder den Workspace-Zugriff. Ohne eine benutzerdefinierte Zuordnung, die `agentId` festlegt, verwendet die Voreinstellung den Standardagenten.
- Leiten Sie Gmail bei nicht vertrauenswürdigen Posteingängen an einen dedizierten Leseagenten weiter und schränken Sie diesen Agenten durch [agentenspezifische Sandbox- und Tool-Richtlinien](/de/tools/multi-agent-sandbox-tools) ein. Wenn der Leseagent den Hauptagenten benachrichtigen muss, beschränken Sie die Übergabe mit [`tools.agentToAgent`](/de/gateway/config-tools#toolsagenttoagent). Das empfohlene Bedrohungsmodell und die Modellstufe finden Sie unter [Prompt-Injection](/de/gateway/security#prompt-injection).
- Wenn Sie dieses nach Nachricht getrennte Routing beibehalten, legen Sie `hooks.allowRequestSessionKey: true` fest und schränken Sie `hooks.allowedSessionKeyPrefixes` auf den Gmail-Namensraum ein, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie die Voreinstellung mit einem statischen Wert für `sessionKey` anstelle des vorlagenbasierten Standardwerts.

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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- Das Gateway startet `gog gmail watch serve` beim Hochfahren automatisch, wenn es konfiguriert ist. Legen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1` fest, um dies zu deaktivieren.
- Führen Sie nicht zusätzlich zum Gateway einen separaten Prozess für `gog gmail watch serve` aus.

---

## Host des Canvas-Plugins

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // oder OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Stellt vom Agenten bearbeitbares HTML/CSS/JS und A2UI über HTTP am Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: Behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Bei Bindungen außerhalb der Loopback-Schnittstelle erfordern Canvas-Routen eine Gateway-Authentifizierung (Token/Passwort/vertrauenswürdiger Proxy), wie andere HTTP-Oberflächen des Gateways.
- Node-WebViews senden normalerweise keine Authentifizierungsheader; nachdem ein Node gekoppelt und verbunden wurde, veröffentlicht das Gateway Node-spezifische Capability-URLs für den Canvas-/A2UI-Zugriff.
- Capability-URLs sind an die aktive WS-Sitzung des Nodes gebunden und laufen schnell ab. Es wird kein IP-basierter Fallback verwendet.
- Fügt den Live-Reload-Client in bereitgestelltes HTML ein.
- Erstellt automatisch eine `index.html`-Startdatei, wenn das Verzeichnis leer ist.
- Stellt A2UI außerdem unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Neustart des Gateways.
- Deaktivieren Sie Live Reload bei großen Verzeichnissen oder Fehlern vom Typ `EMFILE`.

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

- `minimal` (Standard): `cliPath` und `sshPort` aus TXT-Einträgen weglassen.
- `full`: `cliPath` und `sshPort` einschließen; für Multicast-Ankündigungen im LAN muss das mitgelieferte Plugin `bonjour` weiterhin aktiviert sein.
- `off`: unterdrückt Multicast-Ankündigungen im LAN, ohne die Plugin-Aktivierung zu ändern.
- Das mitgelieferte Plugin `bonjour` startet auf macOS-Hosts automatisch und muss unter Linux, Windows und containerisierten Gateway-Bereitstellungen explizit aktiviert werden.
- Der Hostname entspricht standardmäßig dem Systemhostnamen, wenn dieser eine gültige DNS-Bezeichnung ist; andernfalls wird `openclaw` verwendet. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert mDNS-Ankündigungen vollständig und überschreibt `discovery.mdns.mode`.

### Netzwerkübergreifend (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Kombinieren Sie dies für die netzwerkübergreifende Erkennung mit einem DNS-Server (CoreDNS empfohlen) und Tailscale Split DNS.

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

- Inline-Umgebungsvariablen werden nur angewendet, wenn der Schlüssel in der Prozessumgebung fehlt.
- `.env`-Dateien: `.env` im aktuellen Arbeitsverzeichnis und `~/.openclaw/.env` (keine davon überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus dem Profil Ihrer Anmelde-Shell.
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

- Es werden nur Namen in Großbuchstaben abgeglichen: `[A-Z_][A-Z0-9_]*`.
- Fehlende oder leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Maskieren Sie mit `$${VAR}`, um `${VAR}` als Literal zu verwenden.
- Funktioniert mit `$include`.

---

## Geheimnisse

Geheimnisreferenzen sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine der folgenden Objektformen:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- ID-Muster für `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID für `source: "file"`: absoluter JSON-Zeiger (zum Beispiel `"/providers/openai/apiKey"`)
- ID-Muster für `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (unterstützt AWS-artige `secret#json_key`-Selektoren)
- IDs für `source: "exec"` dürfen keine durch Schrägstriche getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Anmeldedatenoberfläche

- Kanonische Matrix: [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Anmeldedatenpfade von `openclaw.json`.
- Referenzen von `auth-profiles.json` werden in die Laufzeitauflösung und den Prüfumfang einbezogen.

### Konfiguration der Geheimnis-Provider

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

- Der Provider `file` unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im singleValue-Modus `"value"` sein).
- Pfade von Datei- und Exec-Providern schlagen sicher fehl, wenn die Überprüfung der Windows-ACLs nicht verfügbar ist. Legen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade fest, die nicht überprüft werden können.
- Der Provider `exec` erfordert einen absoluten Pfad für `command` und verwendet Protokollnutzlasten über Standardeingabe und Standardausgabe.
- Standardmäßig werden symbolische Verknüpfungen in Befehlspfaden abgelehnt. Legen Sie `allowSymlinkCommand: true` fest, um Pfade mit symbolischen Verknüpfungen zuzulassen und dabei den aufgelösten Zielpfad zu validieren.
- Wenn `trustedDirs` konfiguriert ist, wird die Prüfung des vertrauenswürdigen Verzeichnisses auf den aufgelösten Zielpfad angewendet.
- Die untergeordnete Umgebung von `exec` ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- Geheimnisreferenzen werden zum Aktivierungszeitpunkt in einen In-Memory-Snapshot aufgelöst; anschließend lesen Anfragepfade ausschließlich diesen Snapshot.
- Die Filterung aktiver Oberflächen erfolgt während der Aktivierung: Nicht aufgelöste Referenzen auf aktivierten Oberflächen führen dazu, dass Start oder Neuladen fehlschlagen, während inaktive Oberflächen mit Diagnosemeldungen übersprungen werden.

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

- Profile pro Agent werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Referenzen auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- Veraltete flache `auth-profiles.json`-Zuordnungen wie `{ "provider": { "apiKey": "..." } }` sind kein Laufzeitformat; `openclaw doctor --fix` schreibt sie in kanonische `provider:default`-API-Schlüsselprofile mit einer `.legacy-flat.*.bak`-Sicherung um.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine durch SecretRef bereitgestellten Anmeldedaten für Authentifizierungsprofile.
- Statische Laufzeitanmeldedaten stammen aus im Arbeitsspeicher aufgelösten Snapshots; veraltete statische `auth.json`-Einträge werden bei ihrer Erkennung bereinigt.
- Veraltete OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten von Geheimnissen und `audit/configure/apply`-Werkzeuge: [Verwaltung von Geheimnissen](/de/gateway/secrets).

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

Der Gateway zeichnet Audit-Ereignisse **ausschließlich mit Metadaten** für Agentenläufe und Werkzeugaktionen in der gemeinsam genutzten Zustandsdatenbank auf. Metadaten zum Nachrichtenlebenszyklus sind eine separate Opt-in-Funktion. Das Journal speichert Identität, Zeitangaben, Werkzeugnamen und normalisierte Ergebnisse, jedoch niemals Prompts, Nachrichtentexte, Werkzeugargumente, Ergebnisse oder unformatierten Fehlertext. Nachrichtenzeilen speichern keine unformatierten Plattformkonto-, Unterhaltungs-, Nachrichten- und Ziel-IDs. Sitzungsschlüssel für Läufe und Werkzeuge bleiben zur Korrelation verfügbar und können selbst Plattformkonto- oder Peer-IDs enthalten. Datensätze laufen nach 30 Tagen ab, und das Journal ist auf 100.000 Zeilen begrenzt. Fragen Sie sie mit [`openclaw audit`](/de/cli/audit) oder dem Gateway-RPC [`audit.activity.list`](/de/gateway/protocol#audit-ledger-rpc) ab. Das vollständige Datenmodell, die Datenschutzsemantik und die Abdeckungsgrenzen finden Sie unter [Audit-Verlauf](/de/gateway/audit).

- `enabled`: Neue Audit-Ereignisse aufzeichnen (Standard: `true`). Das Journal ist standardmäßig aktiviert, da ein erst nach einem Vorfall aktivierter Audit-Trail den Vorfall nicht erklären kann. Durch Festlegen von `false` werden nach dem Neustart des Gateways keine neuen Ereignisse mehr eingefügt; vorhandene Datensätze bleiben lesbar, bis sie ablaufen. Eine erneute Aktivierung setzt die Aufzeichnung ab diesem Zeitpunkt fort – die Lücke wird nicht nachträglich gefüllt.
- `messages`: Umfang der Nachrichtenmetadaten (Standard: `"off"`). `"direct"` zeichnet nur bekannte direkte Unterhaltungen auf. `"all"` zeichnet außerdem Gruppen, Kanäle und unbekannte Unterhaltungsarten auf. Beide Modi bleiben inhaltsfrei und ersetzen unformatierte Kennungen durch installationslokale, schlüsselbasierte Pseudonyme, sofern Korrelation verfügbar ist. Diese dienen als Korrelationshilfen und nicht zur Anonymisierung; die Zustandsdatenbank speichert den Ableitungsschlüssel, RPC- und CLI-Exporte jedoch nicht.

Der laufende Gateway erfasst `audit.enabled` und `audit.messages` beim Start; starten Sie ihn nach einer Änderung einer der beiden Einstellungen neu. Die Nachrichtenabdeckung umfasst derzeit akzeptierte eingehende Nachrichten, die die zentrale Weiterleitung erreichen, sowie eine abschließende Zeile pro ursprünglicher logischer ausgehender Antwortnutzlast, die die gemeinsam genutzte dauerhafte Zustellung erreicht. Plugin-lokale und direkte Sendepfade, die diese gemeinsamen Grenzen umgehen, sind noch nicht abgedeckt. Der begrenzte Hintergrundschreiber arbeitet nach bestem Bemühen und ist kein verlustfreies Compliance-Archiv.

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

- Standardprotokolldatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`; benannte Profile verwenden `/tmp/openclaw/openclaw-<profile>-YYYY-MM-DD.log`.
- Legen Sie `logging.file` für einen stabilen Pfad fest.
- `consoleLevel` wird auf `debug` erhöht, wenn `--verbose`.
- `maxFileBytes`: Maximale Größe der aktiven Protokolldatei in Byte vor der Rotation (positive Ganzzahl; Standard: `104857600` = 100 MB). OpenClaw bewahrt bis zu fünf nummerierte Archive neben der aktiven Datei auf.
- `redactSensitive` / `redactPatterns`: Bestmögliche Maskierung für Konsolenausgaben, Dateiprotokolle, OTLP-Protokolldatensätze und dauerhaft gespeicherten Text aus Sitzungstranskripten. `redactSensitive: "off"` deaktiviert nur diese allgemeine Richtlinie für Protokolle und Transkripte; Benutzeroberflächen-, Werkzeug- und Diagnosesicherheitsflächen schwärzen Geheimnisse weiterhin vor der Ausgabe.

---

## Diagnose

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

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

- `enabled`: Hauptschalter für die Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array aus Flag-Zeichenfolgen zum Aktivieren gezielter Protokollausgaben (unterstützt Platzhalter wie `"telegram.*"` oder `"*"`).
- `otel.enabled`: Aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`). Die vollständige Konfiguration, den Signalkatalog und das Datenschutzmodell finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: Optionale signalspezifische OTLP-Endpunkte. Wenn sie festgelegt sind, überschreiben sie `otel.endpoint` nur für das jeweilige Signal.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: Zusätzliche HTTP-/gRPC-Metadatenheader, die mit OTel-Exportanfragen gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Aktivieren den Export von Traces, Metriken oder Protokollen.
- `otel.logsExporter`: Ziel für den Protokollexport: `"otlp"` (Standard), `"stdout"` für ein JSON-Objekt pro Standardausgabezeile oder `"both"`.
- `otel.sampleRate`: Trace-Abtastrate `0`–`1`.
- `otel.flushIntervalMs`: Periodisches Telemetrie-Leerungsintervall in ms.
- `otel.captureContent`: Optionale Erfassung von Rohinhalten für OTEL-Span-Attribute. Standardmäßig deaktiviert. Der boolesche Wert `true` erfasst Nachrichten- und Werkzeuginhalte außerhalb des Systems; mit der Objektform können Sie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` und `toolDefinitions` ausdrücklich aktivieren.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: Umgebungsschalter für die neueste experimentelle Form von GenAI-Inferenz-Spans, einschließlich `{gen_ai.operation.name} {gen_ai.request.model}`-Span-Namen, der Span-Art `CLIENT` und `gen_ai.provider.name` anstelle des veralteten `gen_ai.system`. Standardmäßig behalten Spans aus Kompatibilitätsgründen `openclaw.model.call` und `gen_ai.system` bei; GenAI-Metriken verwenden begrenzte semantische Attribute.
- `OPENCLAW_OTEL_PRELOADED=1`: Umgebungsschalter für Hosts, die bereits ein globales OpenTelemetry-SDK registriert haben. OpenClaw überspringt dann den Start und das Herunterfahren des Plugin-eigenen SDKs, während die Diagnose-Listener aktiv bleiben.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` und `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: Signalspezifische Endpunkt-Umgebungsvariablen, die verwendet werden, wenn der entsprechende Konfigurationsschlüssel nicht festgelegt ist.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Läufe protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: Steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig: `true`).

---

## Aktualisierung

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`: Veröffentlichungskanal – `"stable"`, `"extended-stable"`, `"beta"` oder `"dev"`. Extended-stable ist ausschließlich paketbasiert: Vordergrundbefehle verwalten die Installation, während der Gateway schreibgeschützte Aktualisierungshinweise ausgeben kann.
- `checkOnStart`: Beim Start des Gateways nach npm-Aktualisierungen suchen (Standard: `true`). Gespeicherte Extended-stable-Auswahlen verwenden denselben schreibgeschützten Hinweis und einen Hinweiszeitplan von 24 Stunden.
- `auto.enabled`: Automatische Hintergrundaktualisierungen für Stable- und Beta-Paketinstallationen aktivieren (Standard: `false`). Extended-stable wird niemals automatisch angewendet.

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
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`: Globaler ACP-Funktionsschalter (Standard: `true`; legen Sie `false` fest, um ACP-Weiterleitungs- und Erzeugungsoptionen auszublenden).
- `dispatch.enabled`: Unabhängiger Schalter für die Weiterleitung von ACP-Sitzungszügen (Standard: `true`). Legen Sie `false` fest, um ACP-Befehle verfügbar zu halten und gleichzeitig die Ausführung zu blockieren.
- `backend`: Standard-ID des ACP-Laufzeit-Backends (muss einem registrierten ACP-Laufzeit-Plugin entsprechen).
  Installieren Sie zuerst das Backend-Plugin. Wenn `plugins.allow` festgelegt ist, nehmen Sie die Backend-Plugin-ID (zum Beispiel `acpx`) auf, da das ACP-Backend andernfalls nicht geladen wird.
- `fallbacks`: Geordnete Liste der ACP-Fallback-Backend-IDs, die ausprobiert werden, wenn das primäre Backend frühzeitig mit einem vorübergehend wirkenden Fehler fehlschlägt (nicht verfügbar, ratenbegrenzt, Kontingent ausgeschöpft oder überlastet), bevor es eine Ausgabe erzeugt hat. Jeder Eintrag muss einem registrierten Backend eines ACP-Laufzeit-Plugins entsprechen.
- `defaultAgent`: ID des ACP-Zielagenten als Fallback, wenn beim Erzeugen kein ausdrückliches Ziel angegeben wird.
- `allowedAgents`: Zulassungsliste der Agenten-IDs, die für ACP-Laufzeitsitzungen zulässig sind; leer bedeutet keine zusätzliche Einschränkung.
- `stream.repeatSuppression`: Wiederholte Status-/Werkzeugzeilen pro Zug unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu den Abschlussereignissen des Zugs.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.installCommand`: Optionaler Installationsbefehl, der beim Einrichten einer ACP-Laufzeitumgebung ausgeführt wird.

---

## Assistent

Verhalten und Metadaten für geführte CLI-Einrichtungsabläufe (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`: zu Beginn des geführten Onboardings ausgewählte Zustimmung zur Erkennung. Mit `"full"` (empfohlen) kann die Einrichtung automatisch nach KI-Anwendungen, Schlüsseln und lokalen Laufzeitumgebungen suchen; bei `"guarded"` fragt die Einrichtung einmal nach, bevor sie die Umgebung durchsucht, und bietet stattdessen eine manuelle Konfiguration an.

- `wizard.appRecommendations` ist standardmäßig auf `true` gesetzt. Setzen Sie den Wert auf `false`, um Empfehlungen für installierte Anwendungen während des geführten oder klassischen Onboardings zu deaktivieren und den Gateway-Zugriff auf `device.apps` zu sperren. Node-Hosts benötigen weiterhin ihr separates, standardmäßig deaktiviertes Freigabe-Flag für installierte Anwendungen, bevor sie den Befehl bekannt geben.

---

## Identität

Die Identitätsfelder von `agents.entries` finden Sie unter [Agent-Standardeinstellungen](/de/gateway/config-agents#agent-defaults).

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
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
  },
}
```

- `sessionRetention`: gibt an, wie lange abgeschlossene isolierte Cron-Ausführungssitzungen aufbewahrt werden, bevor SQLite-Sitzungszeilen bereinigt werden. Steuert außerdem die Bereinigung archivierter Transkripte gelöschter Cron-Aufträge. Standardwert: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- Der Ausführungsverlauf behält automatisch die neuesten 2000 Terminalzeilen pro Auftrag. Verlorene Zeilen behalten ihr Bereinigungsfenster von 24 Stunden.
- `webhookToken`: Bearer-Token für die POST-Zustellung von Cron-Webhooks (`delivery.mode = "webhook"`); wenn er weggelassen wird, wird kein Authentifizierungsheader gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die von `openclaw doctor --fix` verwendet wird, um gespeicherte Aufträge zu migrieren, die noch `notify: true` aufweisen; die Zustellung zur Laufzeit verwendet `delivery.mode="webhook"` pro Auftrag zusammen mit `delivery.to` oder `delivery.completionDestination`, wenn die Ankündigungszustellung beibehalten wird.

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

- `enabled`: aktiviert Fehlerwarnungen für Cron-Aufträge (Standardwert: `false`).
- `after`: Anzahl aufeinanderfolgender Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, Mindestwert: `1`).
- `cooldownMs`: Mindestanzahl an Millisekunden zwischen wiederholten Warnungen für denselben Auftrag (nicht negative Ganzzahl).
- `includeSkipped`: zählt aufeinanderfolgende übersprungene Ausführungen für den Warnschwellenwert mit (Standardwert: `false`). Übersprungene Ausführungen werden separat erfasst und wirken sich nicht auf den Backoff bei Ausführungsfehlern aus.
- `mode`: Zustellungsmodus – `"announce"` sendet über eine Kanalnachricht; `"webhook"` sendet an den konfigurierten Webhook.
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

- Standardziel für Cron-Fehlerbenachrichtigungen über alle Aufträge hinweg.
- `mode`: `"announce"` oder `"webhook"`; wird standardmäßig auf `"announce"` gesetzt, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanalüberschreibung für die Ankündigungszustellung. `"last"` verwendet den zuletzt bekannten Zustellungskanal erneut.
- `to`: explizites Ankündigungsziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- `delivery.failureDestination` pro Auftrag überschreibt diesen globalen Standardwert.
- Wenn weder ein globales noch ein auftragsspezifisches Fehlerziel festgelegt ist, greifen Aufträge, die bereits über `announce` zustellen, bei einem Fehler auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für `sessionTarget="isolated"`-Aufträge unterstützt, es sei denn, das primäre `delivery.mode` des Auftrags ist `"webhook"`.

Siehe [Cron-Aufträge](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) erfasst.

## Vorlagenvariablen für Medienmodelle

In `tools.media.models[].args` erweiterte Vorlagenplatzhalter:

| Variable           | Beschreibung                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger Text der eingehenden Nachricht      |
| `{{RawBody}}`      | Unverarbeiteter Text (ohne Verlaufs-/Absender-Wrapper) |
| `{{BodyStripped}}` | Text ohne Gruppenerwähnungen                       |
| `{{From}}`         | Absenderkennung                                    |
| `{{To}}`           | Zielkennung                                        |
| `{{MessageSid}}`   | Kanalnachrichten-ID                                |
| `{{SessionId}}`    | UUID der aktuellen Sitzung                        |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde |
| `{{MediaUrl}}`     | Pseudo-URL für eingehende Medien                   |
| `{{MediaPath}}`    | Lokaler Medienpfad                                 |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                  |
| `{{Transcript}}`   | Audiotranskript                                    |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge         |
| `{{MaxChars}}`     | Aufgelöste maximale Anzahl an Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                           |
| `{{GroupSubject}}` | Gruppenbetreff (nach bestem Bemühen)               |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (nach bestem Bemühen) |
| `{{SenderName}}`   | Anzeigename des Absenders (nach bestem Bemühen)    |
| `{{SenderE164}}`   | Telefonnummer des Absenders (nach bestem Bemühen)  |
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

- Einzelne Datei: ersetzt das umschließende Objekt.
- Datei-Array: wird der Reihe nach tief zusammengeführt (spätere Werte überschreiben frühere).
- Schwesterschlüssel: werden nach den Einbindungen zusammengeführt (überschreiben eingebundene Werte).
- Verschachtelte Einbindungen: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen jedoch innerhalb des obersten Konfigurationsverzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur zulässig, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden. Legen Sie `OPENCLAW_INCLUDE_ROOTS` (absolute Pfade) fest, um zusätzliche Stammverzeichnisse außerhalb des Konfigurationsverzeichnisses zuzulassen.
- Grenzwerte: Pfade dürfen keine Nullbytes enthalten und müssen vor und nach der Auflösung strikt kürzer als 4096 Zeichen sein; jede eingebundene Datei ist auf 2 MB begrenzt.
- Von OpenClaw vorgenommene Schreibvorgänge, die nur einen obersten Abschnitt ändern, der durch eine Einbindung einer einzelnen Datei bereitgestellt wird, werden in diese eingebundene Datei durchgeschrieben. Beispielsweise aktualisiert `plugins install` den Wert `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Stammeinbindungen, Einbindungs-Arrays und Einbindungen mit Schwesterschlüssel-Überschreibungen sind für von OpenClaw vorgenommene Schreibvorgänge schreibgeschützt; diese Schreibvorgänge schlagen sicher fehl, anstatt die Konfiguration zu reduzieren.
- Fehler: eindeutige Meldungen für fehlende Dateien, Parsing-Fehler, zirkuläre Einbindungen, ungültige Pfadformate und übermäßige Länge.

---

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Doctor](/de/gateway/doctor)
