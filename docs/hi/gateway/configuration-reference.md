---
read_when:
    - आपको सटीक फ़ील्ड-स्तरीय कॉन्फ़िगरेशन सिमैंटिक्स या डिफ़ॉल्ट चाहिए
    - आप चैनल, मॉडल, Gateway या टूल कॉन्फ़िगरेशन ब्लॉक सत्यापित कर रहे हैं
summary: मुख्य OpenClaw कुंजियों, डिफ़ॉल्टों और समर्पित सबसिस्टम संदर्भों के लिंक के लिए Gateway कॉन्फ़िग संदर्भ
title: कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-06-28T23:06:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` के लिए मुख्य config संदर्भ। कार्य-उन्मुख अवलोकन के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

मुख्य OpenClaw config सतहों को कवर करता है और जब किसी subsystem का अपना गहरा संदर्भ हो तो वहाँ लिंक करता है। Channel- और Plugin-स्वामित्व वाले command catalogs और deep memory/QMD knobs इस पेज के बजाय अपने पेजों पर रहते हैं।

कोड सत्य:

- `openclaw config schema` validation और Control UI के लिए इस्तेमाल होने वाला live JSON Schema प्रिंट करता है, उपलब्ध होने पर bundled/Plugin/channel metadata को merge करके
- `config.schema.lookup` drill-down tooling के लिए एक path-scoped schema node लौटाता है
- `pnpm config:docs:check` / `pnpm config:docs:gen` config-doc baseline hash को मौजूदा schema surface के विरुद्ध validate करते हैं

Agent lookup path: edits से पहले सटीक field-level docs और constraints के लिए `gateway` tool action `config.schema.lookup` का उपयोग करें। कार्य-उन्मुख मार्गदर्शन के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration) और व्यापक field map, defaults, और subsystem references के links के लिए यह पेज उपयोग करें।

समर्पित गहरे संदर्भ:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, और `plugins.entries.memory-core.config.dreaming` के अंतर्गत dreaming config के लिए [Memory configuration reference](/hi/reference/memory-config)
- मौजूदा built-in + bundled command catalog के लिए [Slash commands](/hi/tools/slash-commands)
- channel-specific command surfaces के लिए स्वामी channel/Plugin पेज

Config format **JSON5** है (comments + trailing commas allowed)। सभी fields optional हैं - omit करने पर OpenClaw safe defaults उपयोग करता है।

---

## Channels

Per-channel config keys एक dedicated page पर चले गए हैं - `channels.*` के लिए [कॉन्फ़िगरेशन - channels](/hi/gateway/config-channels) देखें, जिसमें Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, और अन्य bundled channels शामिल हैं (auth, access control, multi-account, mention gating)।

## Agent defaults, multi-agent, sessions, और messages

एक dedicated page पर चले गए हैं - इसके लिए [कॉन्फ़िगरेशन - agents](/hi/gateway/config-agents) देखें:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (multi-agent routing और bindings)
- `session.*` (session lifecycle, compaction, pruning)
- `messages.*` (message delivery, TTS, markdown rendering)
- `talk.*` (Talk mode)
  - `talk.consultThinkingLevel`: Control UI Talk realtime consults के पीछे full OpenClaw agent run के लिए thinking level override
  - `talk.consultFastMode`: Control UI Talk realtime consults के लिए one-shot fast-mode override
  - `talk.speechLocale`: iOS/macOS पर Talk speech recognition के लिए optional BCP 47 locale id
  - `talk.silenceTimeoutMs`: unset होने पर, transcript भेजने से पहले Talk platform default pause window रखता है (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: finalized realtime Talk transcripts के लिए Gateway relay fallback जो `openclaw_agent_consult` skip करते हैं

## Tools और custom providers

Tool policy, experimental toggles, provider-backed tool config, और custom provider / base-URL setup एक dedicated page पर चले गए हैं - [कॉन्फ़िगरेशन - tools और custom providers](/hi/gateway/config-tools) देखें।

## Models

Provider definitions, model allowlists, और custom provider setup [कॉन्फ़िगरेशन - tools और custom providers](/hi/gateway/config-tools#custom-providers-and-base-urls) में हैं। `models` root global model-catalog behavior का भी स्वामी है।

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: provider catalog behavior (`merge` या `replace`)।
- `models.providers`: provider id से keyed custom provider map।
- `models.providers.*.localService`: local model servers के लिए optional on-demand process manager। OpenClaw configured health endpoint probe करता है, आवश्यकता होने पर absolute `command` start करता है, readiness की प्रतीक्षा करता है, फिर model request भेजता है। [Local model services](/hi/gateway/local-model-services) देखें।
- `models.pricing.enabled`: background pricing bootstrap control करता है जो sidecars और channels के Gateway ready path तक पहुँचने के बाद start होता है। `false` होने पर, Gateway OpenRouter और LiteLLM pricing-catalog fetches skip करता है; configured `models.providers.*.models[].cost` values अभी भी local cost estimates के लिए काम करती हैं।

## MCP

OpenClaw-managed MCP server definitions `mcp.servers` के अंतर्गत रहती हैं और embedded OpenClaw तथा अन्य runtime adapters द्वारा consumed होती हैं। `openclaw mcp list`, `show`, `set`, और `unset` commands config edits के दौरान target server से connect किए बिना इस block को manage करते हैं।

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

- `mcp.servers`: configured MCP tools expose करने वाले runtimes के लिए named stdio या remote MCP server definitions।
  Remote entries `transport: "streamable-http"` या `transport: "sse"` उपयोग करती हैं; `type: "http"` एक CLI-native alias है जिसे `openclaw mcp set` और `openclaw doctor --fix` canonical `transport` field में normalize करते हैं।
- `mcp.servers.<name>.enabled`: saved server definition को बनाए रखते हुए embedded OpenClaw MCP discovery और tool projection से exclude करने के लिए `false` set करें।
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: per-server MCP request timeout seconds या milliseconds में।
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: per-server connection timeout seconds या milliseconds में।
- `mcp.servers.<name>.supportsParallelToolCalls`: adapters के लिए optional concurrency hint जो यह चुन सकते हैं कि parallel MCP tool calls issue करने हैं या नहीं।
- `mcp.servers.<name>.auth`: OAuth आवश्यक करने वाले HTTP MCP servers के लिए `"oauth"` set करें। OpenClaw state के अंतर्गत tokens store करने के लिए `openclaw mcp login <name>` चलाएँ।
- `mcp.servers.<name>.oauth`: optional OAuth scope, redirect URL, और client metadata URL overrides।
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: private endpoints और mutual TLS के लिए HTTP TLS controls।
- `mcp.servers.<name>.toolFilter`: optional per-server tool selection। `include` discovered MCP tools को matching names तक सीमित करता है; `exclude` matching names छिपाता है। Entries exact MCP tool names या simple `*` globs हैं। Resources या prompts वाले servers utility tool names (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) भी generate करते हैं, और वे names भी वही filter उपयोग करते हैं।
- `mcp.servers.<name>.codex`: optional Codex app-server projection controls। यह block केवल Codex app-server threads के लिए OpenClaw metadata है; यह ACP sessions, generic Codex harness config, या अन्य runtime adapters को प्रभावित नहीं करता। Non-empty `codex.agents` server को listed OpenClaw agent ids तक सीमित करता है। Empty, blank, या invalid scoped agent lists config validation द्वारा reject की जाती हैं और global बनने के बजाय runtime projection path द्वारा omit की जाती हैं। `codex.defaultToolsApprovalMode` उस server के लिए Codex का native `default_tools_approval_mode` emit करता है। OpenClaw native `mcp_servers` config को Codex को pass करने से पहले `codex` block strip करता है। हर Codex app-server agent के लिए server को Codex के default MCP approval behavior के साथ projected रखने के लिए block omit करें।
- `mcp.sessionIdleTtlMs`: session-scoped bundled MCP runtimes के लिए idle TTL। One-shot embedded runs run-end cleanup request करते हैं; यह TTL long-lived sessions और future callers के लिए backstop है।
- `mcp.*` के अंतर्गत changes cached session MCP runtimes को dispose करके hot-apply होते हैं। अगली tool discovery/use उन्हें नए config से recreate करती है, इसलिए removed `mcp.servers` entries idle TTL की प्रतीक्षा करने के बजाय तुरंत reaped हो जाती हैं।
- Runtime discovery MCP tool-list change notifications का भी सम्मान करती है और उस session के लिए cached catalog drop करती है। Resources या prompts advertise करने वाले servers को listing/reading resources और listing/fetching prompts के लिए utility tools मिलते हैं। Repeated tool-call failures प्रभावित server को किसी अन्य call का attempt होने से पहले थोड़ी देर pause कर देते हैं।

Runtime behavior के लिए [MCP](/hi/cli/mcp#openclaw-as-an-mcp-client-registry) और [CLI backends](/hi/gateway/cli-backends#bundle-mcp-overlays) देखें।

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

- `allowBundled`: केवल bundled skills के लिए optional allowlist (managed/workspace skills अप्रभावित)।
- `load.extraDirs`: extra shared skill roots (सबसे कम precedence)।
- `load.allowSymlinkTargets`: trusted real target roots जिनमें skill symlinks resolve हो सकते हैं जब link अपने configured source root के बाहर रहता है।
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply को पहले से trusted symlink targets के through write करने की अनुमति देता है (default: false)।
- `install.preferBrew`: true होने पर, `brew` उपलब्ध होने पर other installer kinds पर fallback करने से पहले Homebrew installers को prefer करें।
- `install.nodeManager`: `metadata.openclaw.install` specs के लिए node installer preference (`npm` | `pnpm` | `yarn` | `bun`)।
- `install.allowUploadedArchives`: trusted `operator.admin` Gateway clients को `skills.upload.*` के through staged private zip archives install करने की अनुमति दें (default: false)। यह केवल uploaded-archive path enable करता है; normal ClawHub installs को इसकी आवश्यकता नहीं होती।
- `entries.<skillKey>.enabled: false` skill को disable करता है, भले ही वह bundled/installed हो।
- `entries.<skillKey>.apiKey`: primary env var declare करने वाली skills के लिए convenience (plaintext string या SecretRef object)।

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

- `~/.openclaw/extensions` और `<workspace>/.openclaw/extensions` के अंतर्गत पैकेज या बंडल डायरेक्टरी से लोड किया गया, साथ ही `plugins.load.paths` में सूचीबद्ध फ़ाइलों या डायरेक्टरी से भी।
- स्टैंडअलोन Plugin फ़ाइलें `plugins.load.paths` में रखें; अपने-आप खोजे गए extension roots शीर्ष-स्तर की `.js`, `.mjs`, और `.ts` फ़ाइलों को अनदेखा करते हैं ताकि उन roots में helper scripts startup को ब्लॉक न करें।
- Discovery native OpenClaw Plugins के साथ compatible Codex bundles और Claude bundles को स्वीकार करती है, जिसमें manifestless Claude default-layout bundles भी शामिल हैं।
- **Config बदलावों के लिए Gateway restart आवश्यक है।**
- `allow`: वैकल्पिक allowlist (केवल सूचीबद्ध plugins load होते हैं)। `deny` को प्राथमिकता मिलती है।
- `plugins.entries.<id>.apiKey`: Plugin-स्तर API key सुविधा फ़ील्ड (जब Plugin द्वारा समर्थित हो)।
- `plugins.entries.<id>.env`: Plugin-scoped env var map।
- `plugins.entries.<id>.hooks.allowPromptInjection`: जब `false` हो, core `before_prompt_build` को ब्लॉक करता है और legacy `before_agent_start` से prompt बदलने वाले fields को अनदेखा करता है, जबकि legacy `modelOverride` और `providerOverride` को संरक्षित रखता है। यह native Plugin hooks और समर्थित bundle-provided hook directories पर लागू होता है।
- `plugins.entries.<id>.hooks.allowConversationAccess`: जब `true` हो, trusted non-bundled plugins typed hooks जैसे `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, और `agent_end` से raw conversation content पढ़ सकते हैं।
- `plugins.entries.<id>.subagent.allowModelOverride`: background subagent runs के लिए per-run `provider` और `model` overrides का अनुरोध करने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.subagent.allowedModels`: trusted subagent overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model की अनुमति देना चाहते हों।
- `plugins.entries.<id>.llm.allowModelOverride`: `api.runtime.llm.complete` के लिए model overrides का अनुरोध करने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.llm.allowedModels`: trusted Plugin LLM completion overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model की अनुमति देना चाहते हों।
- `plugins.entries.<id>.llm.allowAgentIdOverride`: non-default agent id के विरुद्ध `api.runtime.llm.complete` चलाने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.config`: Plugin-defined config object (उपलब्ध होने पर native OpenClaw Plugin schema द्वारा validate किया गया)।
- Channel Plugin account/runtime settings `channels.<id>` के अंतर्गत रहते हैं और उन्हें किसी central OpenClaw option registry द्वारा नहीं, बल्कि owning Plugin के manifest `channelConfigs` metadata द्वारा वर्णित किया जाना चाहिए।

### Codex harness Plugin config

Bundled `codex` Plugin native Codex app-server harness settings का मालिक है, जो
`plugins.entries.codex.config` के अंतर्गत हैं। पूरे config
surface के लिए [Codex harness संदर्भ](/hi/plugins/codex-harness-reference) और runtime model के लिए [Codex harness](/hi/plugins/codex-harness) देखें।

`codexPlugins` केवल उन sessions पर लागू होता है जो native Codex harness चुनते हैं।
यह OpenClaw provider runs, ACP
conversation bindings, या किसी non-Codex harness के लिए Codex plugins सक्षम नहीं करता।

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness के लिए native Codex
  Plugin/app support सक्षम करता है। Default: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  migrated Plugin app elicitations के लिए default destructive-action policy।
  Safe Codex approval schemas को बिना prompt किए स्वीकार करने के लिए `true`, उन्हें decline करने के लिए `false`,
  Codex-required approvals को OpenClaw
  Plugin approvals के माध्यम से route करने के लिए `"auto"`, या हर Plugin write/destructive
  action के लिए durable approval के बिना पूछने हेतु `"always"` का उपयोग करें। `"always"` mode thread शुरू करने से पहले प्रभावित app के लिए durable Codex
  per-tool approval overrides clear करता है।
  Default: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global `codexPlugins.enabled` भी true होने पर
  migrated Plugin entry सक्षम करता है।
  Default: explicit entries के लिए `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stable marketplace identity। V1 केवल `"openai-curated"` को support करता है।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration से stable
  Codex Plugin identity, उदाहरण के लिए `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  per-Plugin destructive-action override। जब omit किया जाए, global
  `allow_destructive_actions` value उपयोग होती है। Per-Plugin value वही
  `true`, `false`, `"auto"`, या `"always"` policies स्वीकार करती है।

`codexPlugins.enabled` global enablement directive है। Migration द्वारा लिखी गई explicit Plugin
entries durable install और repair eligibility set हैं।
`plugins["*"]` समर्थित नहीं है, कोई `install` switch नहीं है, और local
`marketplacePath` values जानबूझकर config fields नहीं हैं क्योंकि वे
host-specific हैं।

`app/list` readiness checks एक घंटे के लिए cache किए जाते हैं और stale होने पर
asynchronously refresh होते हैं। Codex thread app config Codex harness
session establishment पर compute होता है, हर turn पर नहीं; native Plugin config बदलने के बाद `/new`, `/reset`, या Gateway
restart का उपयोग करें।

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider settings.
  - `apiKey`: उच्च limits के लिए वैकल्पिक Firecrawl API key (SecretRef स्वीकार करता है)। `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, या `FIRECRAWL_API_KEY` env var पर fallback करता है।
  - `baseUrl`: Firecrawl API base URL (default: `https://api.firecrawl.dev`; self-hosted overrides को private/internal endpoints target करने होंगे)।
  - `onlyMainContent`: pages से केवल main content extract करें (default: `true`)।
  - `maxAgeMs`: milliseconds में maximum cache age (default: `172800000` / 2 days)।
  - `timeoutSeconds`: seconds में scrape request timeout (default: `60`)।
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) settings.
  - `enabled`: X Search provider सक्षम करें।
  - `model`: search के लिए उपयोग होने वाला Grok model (जैसे `"grok-4-1-fast"`)।
- `plugins.entries.memory-core.config.dreaming`: memory dreaming settings. Phases और thresholds के लिए [Dreaming](/hi/concepts/dreaming) देखें।
  - `enabled`: master dreaming switch (default `false`)।
  - `frequency`: हर full dreaming sweep के लिए cron cadence (default रूप से `"0 3 * * *"`)।
  - `model`: वैकल्पिक Dream Diary subagent model override। `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है; targets को restrict करने के लिए `allowedModels` के साथ pair करें। Model-unavailable errors session default model के साथ एक बार retry करते हैं; trust या allowlist failures silently fall back नहीं करते।
  - phase policy और thresholds implementation details हैं (user-facing config keys नहीं)।
- Full memory config [Memory configuration reference](/hi/reference/memory-config) में है:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Enabled Claude bundle plugins `settings.json` से embedded OpenClaw defaults भी contribute कर सकते हैं; OpenClaw उन्हें sanitized agent settings के रूप में लागू करता है, raw OpenClaw config patches के रूप में नहीं।
- `plugins.slots.memory`: active memory Plugin id चुनें, या memory plugins disable करने के लिए `"none"`।
- `plugins.slots.contextEngine`: active context engine Plugin id चुनें; जब तक आप कोई दूसरा engine install और select नहीं करते, default `"legacy"` है।

[Plugins](/hi/tools/plugin) देखें।

---

## Commitments

`commitments` inferred follow-up memory नियंत्रित करता है: OpenClaw conversation turns से check-ins detect कर सकता है और उन्हें Heartbeat runs के माध्यम से deliver कर सकता है।

- `commitments.enabled`: inferred follow-up commitments के लिए hidden LLM extraction, storage, और Heartbeat delivery सक्षम करें। Default: `false`.
- `commitments.maxPerDay`: rolling day में प्रति agent session deliver किए जाने वाले maximum inferred follow-up commitments। Default: `3`.

[Inferred commitments](/hi/concepts/commitments) देखें।

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

- `evaluateEnabled: false` `act:evaluate` और `wait --fn` को अक्षम करता है।
- `tabCleanup` निष्क्रिय समय के बाद या जब कोई
  सत्र अपनी सीमा से अधिक हो जाता है, ट्रैक किए गए प्राथमिक-एजेंट टैब वापस प्राप्त करता है। उन अलग-अलग cleanup मोड को अक्षम करने के लिए `idleMinutes: 0` या `maxTabsPerSession: 0` सेट करें।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` सेट न होने पर अक्षम रहता है, इसलिए browser navigation डिफ़ॉल्ट रूप से strict रहती है।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` केवल तब सेट करें जब आप जानबूझकर private-network browser navigation पर भरोसा करते हों।
- strict mode में, remote CDP profile endpoints (`profiles.*.cdpUrl`) reachability/discovery checks के दौरान उसी private-network blocking के अधीन होते हैं।
- `ssrfPolicy.allowPrivateNetwork` legacy alias के रूप में समर्थित रहता है।
- strict mode में, स्पष्ट exceptions के लिए `ssrfPolicy.hostnameAllowlist` और `ssrfPolicy.allowedHostnames` का उपयोग करें।
- Remote profiles केवल attach-only हैं (start/stop/reset अक्षम)।
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://`, और `wss://` स्वीकार करता है।
  जब आप चाहते हैं कि OpenClaw `/json/version` discover करे, तो HTTP(S) का उपयोग करें; जब आपका provider आपको direct DevTools WebSocket URL देता है, तो WS(S) का उपयोग करें।
- `remoteCdpTimeoutMs` और `remoteCdpHandshakeTimeoutMs` remote और
  `attachOnly` CDP reachability के साथ tab-opening requests पर लागू होते हैं। Managed loopback
  profiles local CDP defaults बनाए रखते हैं।
- यदि कोई externally managed CDP service loopback के माध्यम से reachable है, तो उस
  profile का `attachOnly: true` सेट करें; अन्यथा OpenClaw loopback port को
  local managed browser profile मानता है और local port ownership errors रिपोर्ट कर सकता है।
- `existing-session` profiles CDP के बजाय Chrome MCP का उपयोग करते हैं और selected host या connected browser node के माध्यम से attach कर सकते हैं।
- `existing-session` profiles Brave या Edge जैसे किसी विशिष्ट
  Chromium-based browser profile को target करने के लिए `userDataDir` सेट कर सकते हैं।
- `existing-session` profiles `cdpUrl` सेट कर सकते हैं जब Chrome पहले से ही
  DevTools HTTP(S) discovery endpoint या direct WS(S) endpoint के पीछे चल रहा हो। उस
  mode में OpenClaw auto-connect का उपयोग करने के बजाय endpoint को Chrome MCP को पास करता है;
  Chrome MCP launch arguments के लिए `userDataDir` को अनदेखा किया जाता है।
- `existing-session` profiles मौजूदा Chrome MCP route limits बनाए रखते हैं:
  CSS-selector targeting के बजाय snapshot/ref-driven actions, one-file upload
  hooks, कोई dialog timeout overrides नहीं, कोई `wait --load networkidle` नहीं, और कोई
  `responsebody`, PDF export, download interception, या batch actions नहीं।
- Local managed `openclaw` profiles `cdpPort` और `cdpUrl` auto-assign करते हैं; `cdpUrl` स्पष्ट रूप से केवल remote CDP profiles या existing-session endpoint
  attach के लिए सेट करें।
- Local managed profiles उस profile के लिए global
  `browser.executablePath` को override करने के लिए `executablePath` सेट कर सकते हैं। इसका उपयोग एक profile को
  Chrome में और दूसरे को Brave में चलाने के लिए करें।
- Local managed profiles process start के बाद Chrome CDP HTTP
  discovery के लिए `browser.localLaunchTimeoutMs` और
  post-launch CDP websocket readiness के लिए `browser.localCdpReadyTimeoutMs` का उपयोग करते हैं। उन्हें उन धीमे hosts पर बढ़ाएँ जहाँ Chrome
  सफलतापूर्वक शुरू होता है लेकिन readiness checks startup से race करते हैं। दोनों values
  `120000` ms तक के positive integers होनी चाहिए; invalid config values अस्वीकार की जाती हैं।
- Auto-detect order: default browser यदि Chromium-based हो → Chrome → Brave → Edge → Chromium → Chrome Canary।
- `browser.executablePath` और `browser.profiles.<name>.executablePath` दोनों
  Chromium launch से पहले आपके OS home directory के लिए `~` और `~/...` स्वीकार करते हैं।
  `existing-session` profiles पर per-profile `userDataDir` भी tilde-expanded होता है।
- Control service: केवल loopback (port `gateway.port` से derived, default `18791`)।
- `extraArgs` local Chromium startup में extra launch flags जोड़ता है (उदाहरण के लिए
  `--disable-gpu`, window sizing, या debug flags)।

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

- `seamColor`: native app UI chrome के लिए accent color (Talk Mode bubble tint, आदि)।
- `assistant`: Control UI identity override। active agent identity पर fallback करता है।

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

<Accordion title="Gateway field details">

- `mode`: `local` (Gateway चलाएं) या `remote` (रिमोट Gateway से कनेक्ट करें)। Gateway तब तक शुरू होने से मना करता है जब तक यह `local` न हो।
- `port`: WS + HTTP के लिए एकल multiplexed पोर्ट। प्राथमिकता: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (डिफ़ॉल्ट), `lan` (`0.0.0.0`), `tailnet` (केवल Tailscale IP), या `custom`.
- **लेगेसी bind aliases**: `gateway.bind` में bind mode मानों (`auto`, `loopback`, `lan`, `tailnet`, `custom`) का उपयोग करें, host aliases (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) का नहीं।
- **Docker नोट**: डिफ़ॉल्ट `loopback` bind कंटेनर के भीतर `127.0.0.1` पर सुनता है। Docker bridge networking (`-p 18789:18789`) के साथ, ट्रैफ़िक `eth0` पर आता है, इसलिए gateway पहुंच से बाहर रहता है। सभी interfaces पर सुनने के लिए `--network host` का उपयोग करें, या `bind: "lan"` (या `customBindHost: "0.0.0.0"` के साथ `bind: "custom"`) सेट करें।
- **Auth**: डिफ़ॉल्ट रूप से आवश्यक। Non-loopback binds के लिए gateway auth आवश्यक है। व्यवहार में इसका अर्थ shared token/password या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy है। Onboarding wizard डिफ़ॉल्ट रूप से token बनाता है।
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं (SecretRefs सहित), तो `gateway.auth.mode` को स्पष्ट रूप से `token` या `password` पर सेट करें। दोनों configured होने और mode unset होने पर startup और service install/repair flows विफल होते हैं।
- `gateway.auth.mode: "none"`: स्पष्ट no-auth mode। केवल trusted local loopback setups के लिए उपयोग करें; इसे जानबूझकर onboarding prompts में पेश नहीं किया जाता।
- `gateway.auth.mode: "trusted-proxy"`: browser/user auth को identity-aware reverse proxy को delegate करें और `gateway.trustedProxies` से identity headers पर भरोसा करें ([Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें)। यह mode डिफ़ॉल्ट रूप से **non-loopback** proxy source की अपेक्षा करता है; same-host loopback reverse proxies के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है। Internal same-host callers local direct fallback के रूप में `gateway.auth.password` का उपयोग कर सकते हैं; `gateway.auth.token` trusted-proxy mode के साथ mutually exclusive रहता है।
- `gateway.auth.allowTailscale`: जब `true` हो, Tailscale Serve identity headers Control UI/WebSocket auth को पूरा कर सकते हैं (`tailscale whois` से verified)। HTTP API endpoints उस Tailscale header auth का उपयोग **नहीं** करते; वे इसके बजाय gateway के सामान्य HTTP auth mode का पालन करते हैं। यह tokenless flow मानता है कि gateway host trusted है। जब `tailscale.mode = "serve"` हो तो डिफ़ॉल्ट `true` है।
- `gateway.auth.rateLimit`: वैकल्पिक failed-auth limiter। प्रति client IP और प्रति auth scope लागू होता है (shared-secret और device-token को स्वतंत्र रूप से tracked किया जाता है)। Blocked attempts `429` + `Retry-After` लौटाते हैं।
  - async Tailscale Serve Control UI path पर, समान `{scope, clientIp}` के लिए failed attempts को failure write से पहले serialized किया जाता है। इसलिए समान client से concurrent bad attempts दूसरे request पर limiter trip कर सकते हैं, बजाय इसके कि दोनों साधारण mismatches की तरह race through करें।
  - `gateway.auth.rateLimit.exemptLoopback` का डिफ़ॉल्ट `true` है; जब आप जानबूझकर localhost traffic को भी rate-limit करना चाहते हैं (test setups या strict proxy deployments के लिए), तब `false` सेट करें।
- Browser-origin WS auth attempts हमेशा loopback exemption disabled के साथ throttled होते हैं (browser-based localhost brute force के विरुद्ध defense-in-depth)।
- loopback पर, वे browser-origin lockouts normalized `Origin`
  value के अनुसार अलग-थलग रहते हैं, इसलिए एक localhost origin से repeated failures अपने आप
  किसी दूसरे origin को lock out नहीं करते।
- `tailscale.mode`: `serve` (केवल tailnet, loopback bind) या `funnel` (public, auth आवश्यक)।
- `tailscale.serviceName`: Serve mode के लिए वैकल्पिक Tailscale Service नाम, जैसे
  `svc:openclaw`। सेट होने पर, OpenClaw इसे `tailscale serve
--service` को पास करता है ताकि Control UI को device hostname के बजाय named Service के माध्यम से expose किया जा सके। मान को Tailscale के `svc:<dns-label>`
  Service name format का उपयोग करना होगा; startup derived Service URL report करता है।
- `tailscale.preserveFunnel`: जब `true` हो और `tailscale.mode = "serve"` हो, OpenClaw
  startup पर Serve फिर से apply करने से पहले `tailscale funnel status` जांचता है और
  यदि externally configured Funnel route पहले से gateway port को cover करता है तो उसे skip करता है।
  डिफ़ॉल्ट `false`।
- `controlUi.allowedOrigins`: Gateway WebSocket connects के लिए स्पष्ट browser-origin allowlist। Public non-loopback browser origins के लिए आवश्यक। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet UI loads Host-header fallback enable किए बिना accepted हैं।
- `controlUi.chatMessageMaxWidth`: grouped Control UI chat messages के लिए वैकल्पिक max-width। `960px`, `82%`, `min(1280px, 82%)`, और `calc(100% - 2rem)` जैसे constrained CSS width values स्वीकार करता है।
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: खतरनाक mode जो उन deployments के लिए Host-header origin fallback enable करता है जो जानबूझकर Host-header origin policy पर निर्भर हैं।
- `remote.transport`: `ssh` (डिफ़ॉल्ट) या `direct` (ws/wss)। `direct` के लिए, public hosts हेतु `remote.url` को `wss://` होना चाहिए; plaintext `ws://` केवल loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT hosts के लिए accepted है।
- `remote.remotePort`: remote SSH host पर gateway port। डिफ़ॉल्ट `18789`; इसका उपयोग तब करें जब local tunnel port remote gateway port से अलग हो।
- `gateway.remote.token` / `.password` remote-client credential fields हैं। वे अपने आप gateway auth configure नहीं करते।
- `gateway.push.apns.relay.baseUrl`: relay-backed iOS builds द्वारा gateway पर registrations publish करने के बाद उपयोग किए जाने वाले external APNs relay के लिए base HTTPS URL। Public App Store/TestFlight builds hosted OpenClaw relay का उपयोग करते हैं। Custom relay URLs को जानबूझकर अलग iOS build/deployment path से match करना होगा जिसका relay URL उस relay की ओर point करता है।
- `gateway.push.apns.relay.timeoutMs`: gateway-to-relay send timeout milliseconds में। डिफ़ॉल्ट `10000`।
- Relay-backed registrations किसी specific gateway identity को delegated होते हैं। Paired iOS app `gateway.identity.get` fetch करता है, relay registration में वह identity शामिल करता है, और gateway को registration-scoped send grant forward करता है। दूसरा gateway उस stored registration का reuse नहीं कर सकता।
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ऊपर दिए गए relay config के लिए temporary env overrides।
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URLs के लिए development-only escape hatch। Production relay URLs HTTPS पर ही रहने चाहिए।
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket handshake timeout milliseconds में। डिफ़ॉल्ट: `15000`। सेट होने पर `OPENCLAW_HANDSHAKE_TIMEOUT_MS` precedence लेता है। Loaded या low-powered hosts पर इसे बढ़ाएं जहां local clients startup warmup के settle होने के दौरान connect कर सकते हैं।
- `gateway.channelHealthCheckMinutes`: channel health-monitor interval minutes में। Health-monitor restarts को globally disable करने के लिए `0` सेट करें। डिफ़ॉल्ट: `5`।
- `gateway.channelStaleEventThresholdMinutes`: stale-socket threshold minutes में। इसे `gateway.channelHealthCheckMinutes` से बड़ा या उसके बराबर रखें। डिफ़ॉल्ट: `30`।
- `gateway.channelMaxRestartsPerHour`: rolling hour में प्रति channel/account अधिकतम health-monitor restarts। डिफ़ॉल्ट: `10`।
- `channels.<provider>.healthMonitor.enabled`: global monitor enabled रखते हुए health-monitor restarts के लिए per-channel opt-out।
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account channels के लिए per-account override। सेट होने पर, यह channel-level override पर precedence लेता है।
- Local gateway call paths `gateway.remote.*` को fallback के रूप में केवल तब उपयोग कर सकते हैं जब `gateway.auth.*` unset हो।
- यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के माध्यम से स्पष्ट रूप से configured है और unresolved है, तो resolution fail closed होता है (कोई remote fallback masking नहीं)।
- `trustedProxies`: reverse proxy IPs जो TLS terminate करते हैं या forwarded-client headers inject करते हैं। केवल उन proxies को list करें जिन्हें आप control करते हैं। Loopback entries same-host proxy/local-detection setups (उदाहरण के लिए Tailscale Serve या local reverse proxy) के लिए अब भी valid हैं, लेकिन वे loopback requests को `gateway.auth.mode: "trusted-proxy"` के लिए eligible **नहीं** बनाते।
- `allowRealIpFallback`: जब `true` हो, Gateway `X-Forwarded-For` missing होने पर `X-Real-IP` स्वीकार करता है। Fail-closed behavior के लिए डिफ़ॉल्ट `false`।
- `gateway.nodes.pairing.autoApproveCidrs`: requested scopes के बिना first-time node device pairing को auto-approve करने के लिए वैकल्पिक CIDR/IP allowlist। Unset होने पर यह disabled रहती है। यह operator/browser/Control UI/WebChat pairing को auto-approve नहीं करता, और role, scope, metadata, या public-key upgrades को auto-approve नहीं करता।
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairing और platform allowlist evaluation के बाद declared node commands के लिए global allow/deny shaping। `camera.snap`, `camera.clip`, और `screen.record` जैसे dangerous node commands में opt into करने के लिए `allowCommands` का उपयोग करें; `denyCommands` किसी command को हटा देता है, भले ही platform default या explicit allow अन्यथा उसे शामिल करता। Node द्वारा अपनी declared command list बदलने के बाद, उस device pairing को reject और re-approve करें ताकि Gateway updated command snapshot store करे।
- `gateway.tools.deny`: HTTP `POST /tools/invoke` के लिए blocked extra tool names (default deny list को extend करता है)।
- `gateway.tools.allow`: owner/admin callers के लिए default HTTP deny list से tool names हटाएं। यह identity-bearing `operator.write`
  callers को owner/admin access में upgrade नहीं करता; `cron`, `gateway`, और `nodes` allowlisted होने पर भी
  non-owner callers के लिए unavailable रहते हैं।

</Accordion>

### OpenAI-संगत endpoints

- Admin HTTP RPC: `admin-http-rpc` Plugin के रूप में डिफ़ॉल्ट रूप से off। `POST /api/v1/admin/rpc` register करने के लिए Plugin enable करें। [Admin HTTP RPC](/hi/plugins/admin-http-rpc) देखें।
- Chat Completions: डिफ़ॉल्ट रूप से disabled। `gateway.http.endpoints.chatCompletions.enabled: true` के साथ enable करें।
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Empty allowlists को unset माना जाता है; URL fetching disable करने के लिए `gateway.http.endpoints.responses.files.allowUrl=false`
    और/या `gateway.http.endpoints.responses.images.allowUrl=false` का उपयोग करें।
- वैकल्पिक response hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (केवल उन HTTPS origins के लिए सेट करें जिन्हें आप control करते हैं; [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth#tls-termination-and-hsts) देखें)

### Multi-instance isolation

Unique ports और state dirs के साथ एक host पर कई gateways चलाएं:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

सुविधा फ़्लैग: `--dev` (`~/.openclaw-dev` + पोर्ट `19001` का उपयोग करता है), `--profile <name>` (`~/.openclaw-<name>` का उपयोग करता है).

[कई Gateways](/hi/gateway/multiple-gateways) देखें.

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

- `enabled`: Gateway लिस्नर (HTTPS/WSS) पर TLS टर्मिनेशन सक्षम करता है (डिफ़ॉल्ट: `false`).
- `autoGenerate`: जब स्पष्ट फ़ाइलें कॉन्फ़िगर नहीं होती हैं, तब स्थानीय self-signed प्रमाणपत्र/कुंजी जोड़ी अपने-आप जनरेट करता है; केवल स्थानीय/dev उपयोग के लिए.
- `certPath`: TLS प्रमाणपत्र फ़ाइल का फ़ाइलसिस्टम पथ.
- `keyPath`: TLS निजी कुंजी फ़ाइल का फ़ाइलसिस्टम पथ; अनुमतियों को प्रतिबंधित रखें.
- `caPath`: क्लाइंट सत्यापन या कस्टम ट्रस्ट चेन के लिए वैकल्पिक CA बंडल पथ.

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

- `mode`: नियंत्रित करता है कि रनटाइम पर कॉन्फ़िग संपादन कैसे लागू किए जाते हैं।
  - `"off"`: लाइव संपादन अनदेखा करें; बदलावों के लिए स्पष्ट रीस्टार्ट आवश्यक है।
  - `"restart"`: कॉन्फ़िग बदलने पर हमेशा Gateway प्रक्रिया रीस्टार्ट करें।
  - `"hot"`: रीस्टार्ट किए बिना बदलाव इन-प्रोसेस लागू करें।
  - `"hybrid"` (डिफ़ॉल्ट): पहले हॉट रीलोड का प्रयास करें; आवश्यक होने पर रीस्टार्ट पर वापस जाएं।
- `debounceMs`: कॉन्फ़िग बदलाव लागू करने से पहले ms में डिबाउंस विंडो (ऋणात्मक नहीं पूर्णांक)।
- `deferralTimeoutMs`: रीस्टार्ट या चैनल हॉट रीलोड को बाध्य करने से पहले इन-फ्लाइट ऑपरेशन के लिए प्रतीक्षा करने का वैकल्पिक अधिकतम समय, ms में। डिफ़ॉल्ट सीमित प्रतीक्षा (`300000`) उपयोग करने के लिए इसे छोड़ दें; अनिश्चितकाल तक प्रतीक्षा करने और आवधिक अभी-भी-लंबित चेतावनियां लॉग करने के लिए `0` सेट करें।

---

## हुक

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

प्रमाणीकरण: `Authorization: Bearer <token>` या `x-openclaw-token: <token>`।
क्वेरी-स्ट्रिंग हुक टोकन अस्वीकार किए जाते हैं।

सत्यापन और सुरक्षा नोट्स:

- `hooks.enabled=true` के लिए खाली नहीं `hooks.token` आवश्यक है।
- `hooks.token` सक्रिय Gateway साझा-गुप्त प्रमाणीकरण (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) से अलग होना चाहिए; पुनः उपयोग का पता चलने पर स्टार्टअप गैर-घातक सुरक्षा चेतावनी लॉग करता है।
- `openclaw security audit` हुक/Gateway प्रमाणीकरण पुनः उपयोग को गंभीर निष्कर्ष के रूप में फ़्लैग करता है, जिसमें केवल ऑडिट समय पर दिया गया Gateway पासवर्ड प्रमाणीकरण (`--auth password --password <password>`) भी शामिल है। स्थायी रूप से सहेजे गए पुनः प्रयुक्त `hooks.token` को रोटेट करने के लिए `openclaw doctor --fix` चलाएं, फिर बाहरी हुक भेजने वालों को नया हुक टोकन उपयोग करने के लिए अपडेट करें।
- `hooks.path` `/` नहीं हो सकता; `/hooks` जैसा समर्पित उपपथ उपयोग करें।
- यदि `hooks.allowRequestSessionKey=true` है, तो `hooks.allowedSessionKeyPrefixes` सीमित करें (उदाहरण के लिए `["hook:"]`)।
- यदि कोई मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` उपयोग करता है, तो `hooks.allowedSessionKeyPrefixes` और `hooks.allowRequestSessionKey=true` सेट करें। स्थिर मैपिंग कुंजियों को उस ऑप्ट-इन की आवश्यकता नहीं होती।

**एंडपॉइंट्स:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - अनुरोध पेलोड से `sessionKey` केवल तब स्वीकार किया जाता है जब `hooks.allowRequestSessionKey=true` हो (डिफ़ॉल्ट: `false`)।
- `POST /hooks/<name>` → `hooks.mappings` के माध्यम से हल किया गया
  - टेम्पलेट-रेंडर किए गए मैपिंग `sessionKey` मानों को बाहरी रूप से दिए गए माना जाता है और उन्हें भी `hooks.allowRequestSessionKey=true` चाहिए।

<Accordion title="Mapping details">

- `match.path` `/hooks` के बाद उप-पथ से मेल खाता है (जैसे `/hooks/gmail` → `gmail`)।
- `match.source` सामान्य पथों के लिए पेलोड फ़ील्ड से मेल खाता है।
- `{{messages[0].subject}}` जैसे टेम्पलेट पेलोड से पढ़ते हैं।
- `transform` किसी JS/TS मॉड्यूल की ओर संकेत कर सकता है जो हुक क्रिया लौटाता है।
  - `transform.module` सापेक्ष पथ होना चाहिए और `hooks.transformsDir` के भीतर रहता है (निरपेक्ष पथ और ट्रैवर्सल अस्वीकार किए जाते हैं)।
  - `hooks.transformsDir` को `~/.openclaw/hooks/transforms` के अंतर्गत रखें; वर्कस्पेस skill निर्देशिकाएं अस्वीकार की जाती हैं। यदि `openclaw doctor` इस पथ को अमान्य बताता है, तो ट्रांसफ़ॉर्म मॉड्यूल को हुक ट्रांसफ़ॉर्म निर्देशिका में ले जाएं या `hooks.transformsDir` हटाएं।
- `agentId` किसी विशिष्ट एजेंट तक रूट करता है; अज्ञात ID डिफ़ॉल्ट एजेंट पर वापस जाते हैं।
- `allowedAgentIds`: प्रभावी एजेंट रूटिंग को सीमित करता है, जिसमें `agentId` छोड़े जाने पर डिफ़ॉल्ट-एजेंट पथ भी शामिल है (`*` या छोड़ा गया = सभी की अनुमति, `[]` = सभी अस्वीकार)।
- `defaultSessionKey`: स्पष्ट `sessionKey` के बिना हुक एजेंट रन के लिए वैकल्पिक निश्चित सेशन कुंजी।
- `allowRequestSessionKey`: `/hooks/agent` कॉलर और टेम्पलेट-चालित मैपिंग सेशन कुंजियों को `sessionKey` सेट करने की अनुमति दें (डिफ़ॉल्ट: `false`)।
- `allowedSessionKeyPrefixes`: स्पष्ट `sessionKey` मानों (अनुरोध + मैपिंग) के लिए वैकल्पिक उपसर्ग अनुमति-सूची, जैसे `["hook:"]`। जब कोई मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` उपयोग करता है, तो यह आवश्यक हो जाती है।
- `deliver: true` अंतिम उत्तर को चैनल पर भेजता है; `channel` डिफ़ॉल्ट रूप से `last` होता है।
- `model` इस हुक रन के लिए LLM को ओवरराइड करता है (यदि मॉडल कैटलॉग सेट है, तो इसकी अनुमति होनी चाहिए)।

</Accordion>

### Gmail एकीकरण

- अंतर्निहित Gmail प्रीसेट `sessionKey: "hook:gmail:{{messages[0].id}}"` उपयोग करता है।
- यदि आप वह प्रति-संदेश रूटिंग रखते हैं, तो `hooks.allowRequestSessionKey: true` सेट करें और Gmail नेमस्पेस से मेल खाने के लिए `hooks.allowedSessionKeyPrefixes` सीमित करें, उदाहरण के लिए `["hook:", "hook:gmail:"]`।
- यदि आपको `hooks.allowRequestSessionKey: false` चाहिए, तो प्रीसेट को टेम्पलेटेड डिफ़ॉल्ट के बजाय स्थिर `sessionKey` से ओवरराइड करें।

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

- कॉन्फ़िगर होने पर Gateway बूट पर `gog gmail watch serve` स्वतः शुरू करता है। अक्षम करने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।
- Gateway के साथ अलग `gog gmail watch serve` न चलाएं।

---

## Canvas Plugin होस्ट

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

- Gateway पोर्ट के अंतर्गत HTTP पर एजेंट-संपादन योग्य HTML/CSS/JS और A2UI सर्व करता है:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- केवल-स्थानीय: `gateway.bind: "loopback"` रखें (डिफ़ॉल्ट)।
- गैर-loopback बाइंड: कैनवास रूट्स को अन्य Gateway HTTP सतहों की तरह Gateway प्रमाणीकरण (टोकन/पासवर्ड/विश्वसनीय-प्रॉक्सी) चाहिए।
- Node WebViews आम तौर पर प्रमाणीकरण हेडर नहीं भेजते; किसी नोड के पेयर और कनेक्ट होने के बाद, Gateway कैनवास/A2UI एक्सेस के लिए नोड-स्कोप्ड क्षमता URL विज्ञापित करता है।
- क्षमता URL सक्रिय नोड WS सेशन से बंधे होते हैं और जल्दी समाप्त हो जाते हैं। IP-आधारित फ़ॉलबैक उपयोग नहीं किया जाता।
- सर्व किए गए HTML में लाइव-रीलोड क्लाइंट इंजेक्ट करता है।
- खाली होने पर स्टार्टर `index.html` स्वतः बनाता है।
- A2UI को `/__openclaw__/a2ui/` पर भी सर्व करता है।
- बदलावों के लिए Gateway रीस्टार्ट आवश्यक है।
- बड़ी निर्देशिकाओं या `EMFILE` त्रुटियों के लिए लाइव रीलोड अक्षम करें।

---

## खोज

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

- `minimal` (जब बंडल किया गया `bonjour` Plugin सक्षम हो तो डिफ़ॉल्ट): TXT रिकॉर्ड से `cliPath` + `sshPort` छोड़ें।
- `full`: `cliPath` + `sshPort` शामिल करें; LAN मल्टीकास्ट विज्ञापन के लिए अब भी बंडल किया गया `bonjour` Plugin सक्षम होना आवश्यक है।
- `off`: Plugin सक्षमकरण बदले बिना LAN मल्टीकास्ट विज्ञापन दबाएं।
- बंडल किया गया `bonjour` Plugin macOS होस्ट पर स्वतः शुरू होता है और Linux, Windows, तथा कंटेनरीकृत Gateway परिनियोजनों पर ऑप्ट-इन है।
- होस्टनेम वैध DNS लेबल होने पर सिस्टम होस्टनेम पर डिफ़ॉल्ट होता है, अन्यथा `openclaw` पर वापस जाता है। `OPENCLAW_MDNS_HOSTNAME` से ओवरराइड करें।

### विस्तृत-क्षेत्र (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` के अंतर्गत एक यूनिकास्ट DNS-SD ज़ोन लिखता है। क्रॉस-नेटवर्क खोज के लिए, इसे DNS सर्वर (CoreDNS अनुशंसित) + Tailscale split DNS के साथ जोड़ें।

सेटअप: `openclaw dns setup --apply`.

---

## परिवेश

### `env` (इनलाइन परिवेश चर)

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

- इनलाइन परिवेश चर केवल तब लागू होते हैं जब प्रक्रिया परिवेश में वह कुंजी मौजूद न हो।
- `.env` फ़ाइलें: CWD `.env` + `~/.openclaw/.env` (इनमें से कोई भी मौजूदा चरों को ओवरराइड नहीं करती)।
- `shellEnv`: आपके लॉगिन शेल प्रोफ़ाइल से अनुपस्थित अपेक्षित कुंजियाँ आयात करता है।
- पूरी प्राथमिकता के लिए [परिवेश](/hi/help/environment) देखें।

### परिवेश चर प्रतिस्थापन

किसी भी कॉन्फ़िग स्ट्रिंग में `${VAR_NAME}` के साथ परिवेश चरों का संदर्भ दें:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- केवल अपरकेस नाम मेल खाते हैं: `[A-Z_][A-Z0-9_]*`.
- अनुपस्थित/खाली चर कॉन्फ़िग लोड पर त्रुटि देते हैं।
- शाब्दिक `${VAR}` के लिए `$${VAR}` से एस्केप करें।
- `$include` के साथ काम करता है।

---

## सीक्रेट

सीक्रेट refs योगात्मक हैं: प्लेनटेक्स्ट मान अभी भी काम करते हैं।

### `SecretRef`

एक ऑब्जेक्ट आकार का उपयोग करें:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

सत्यापन:

- `provider` पैटर्न: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id पैटर्न: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: निरपेक्ष JSON पॉइंटर (उदाहरण के लिए `"/providers/openai/apiKey"`)
- `source: "exec"` id पैटर्न: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS-शैली `secret#json_key` चयनकर्ताओं का समर्थन करता है)
- `source: "exec"` ids में `.` या `..` स्लैश-सीमांकित पाथ सेगमेंट नहीं होने चाहिए (उदाहरण के लिए `a/../b` अस्वीकृत होता है)

### समर्थित क्रेडेंशियल सतह

- कैननिकल मैट्रिक्स: [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)
- `secrets apply` समर्थित `openclaw.json` क्रेडेंशियल पाथ को लक्ष्य करता है।
- `auth-profiles.json` refs रनटाइम रिज़ॉल्यूशन और ऑडिट कवरेज में शामिल हैं।

### सीक्रेट प्रदाता कॉन्फ़िग

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

नोट्स:

- `file` प्रदाता `mode: "json"` और `mode: "singleValue"` का समर्थन करता है (`singleValue` मोड में `id` `"value"` होना चाहिए)।
- Windows ACL सत्यापन अनुपलब्ध होने पर फ़ाइल और exec प्रदाता पाथ बंद-स्थिति में विफल होते हैं। `allowInsecurePath: true` केवल भरोसेमंद पाथ के लिए सेट करें जिन्हें सत्यापित नहीं किया जा सकता।
- `exec` प्रदाता को निरपेक्ष `command` पाथ की आवश्यकता होती है और stdin/stdout पर प्रोटोकॉल पेलोड का उपयोग करता है।
- डिफ़ॉल्ट रूप से, symlink कमांड पाथ अस्वीकृत होते हैं। रिज़ॉल्व किए गए लक्ष्य पाथ को सत्यापित करते हुए symlink पाथ की अनुमति देने के लिए `allowSymlinkCommand: true` सेट करें।
- यदि `trustedDirs` कॉन्फ़िग किया गया है, तो भरोसेमंद-निर्देशिका जाँच रिज़ॉल्व किए गए लक्ष्य पाथ पर लागू होती है।
- `exec` चाइल्ड परिवेश डिफ़ॉल्ट रूप से न्यूनतम होता है; आवश्यक चर `passEnv` के साथ स्पष्ट रूप से पास करें।
- सीक्रेट refs सक्रियण समय पर इन-मेमोरी स्नैपशॉट में रिज़ॉल्व होते हैं, फिर अनुरोध पाथ केवल स्नैपशॉट पढ़ते हैं।
- सक्रिय-सतह फ़िल्टरिंग सक्रियण के दौरान लागू होती है: सक्षम सतहों पर अनरिज़ॉल्व्ड refs स्टार्टअप/रीलोड को विफल करते हैं, जबकि निष्क्रिय सतहें डायग्नोस्टिक्स के साथ छोड़ दी जाती हैं।

---

## Auth संग्रहण

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

- प्रति-एजेंट प्रोफाइल `<agentDir>/auth-profiles.json` पर संग्रहीत होते हैं।
- `auth-profiles.json` स्थिर क्रेडेंशियल मोड के लिए वैल्यू-स्तर refs (`api_key` के लिए `keyRef`, `token` के लिए `tokenRef`) का समर्थन करता है।
- पुराने फ्लैट `auth-profiles.json` मैप, जैसे `{ "provider": { "apiKey": "..." } }`, रनटाइम फ़ॉर्मेट नहीं हैं; `openclaw doctor --fix` उन्हें `.legacy-flat.*.bak` बैकअप के साथ कैनॉनिकल `provider:default` API-key प्रोफाइल में फिर से लिखता है।
- OAuth-मोड प्रोफाइल (`auth.profiles.<id>.mode = "oauth"`) SecretRef-समर्थित auth-profile क्रेडेंशियल का समर्थन नहीं करते।
- स्थिर रनटाइम क्रेडेंशियल इन-मेमोरी रिज़ॉल्व किए गए स्नैपशॉट से आते हैं; पुराने स्थिर `auth.json` एंट्री मिलने पर साफ़ कर दिए जाते हैं।
- पुराने OAuth इंपोर्ट `~/.openclaw/credentials/oauth.json` से होते हैं।
- [OAuth](/hi/concepts/oauth) देखें।
- सीक्रेट्स रनटाइम व्यवहार और `audit/configure/apply` टूलिंग: [सीक्रेट्स प्रबंधन](/hi/gateway/secrets)।

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

- `billingBackoffHours`: जब कोई प्रोफाइल वास्तविक
  बिलिंग/अपर्याप्त-क्रेडिट त्रुटियों के कारण विफल होता है, तो घंटों में बेस बैकऑफ
  (डिफ़ॉल्ट: `5`)। स्पष्ट बिलिंग टेक्स्ट अब भी `401`/`403` प्रतिक्रियाओं पर भी
  यहाँ आ सकता है, लेकिन प्रदाता-विशिष्ट टेक्स्ट मैचर उसी प्रदाता तक सीमित रहते हैं
  जिसका वह स्वामी है (उदाहरण के लिए OpenRouter `Key limit exceeded`)।
  फिर से प्रयास किए जा सकने वाले HTTP `402` उपयोग-विंडो या
  संगठन/वर्कस्पेस खर्च-सीमा संदेश इसके बजाय `rate_limit` पथ में रहते हैं।
- `billingBackoffHoursByProvider`: बिलिंग बैकऑफ घंटों के लिए वैकल्पिक प्रति-प्रदाता ओवरराइड।
- `billingMaxHours`: बिलिंग बैकऑफ की घातांकीय वृद्धि के लिए घंटों में सीमा (डिफ़ॉल्ट: `24`)।
- `authPermanentBackoffMinutes`: उच्च-विश्वास `auth_permanent` विफलताओं के लिए मिनटों में बेस बैकऑफ (डिफ़ॉल्ट: `10`)।
- `authPermanentMaxMinutes`: `auth_permanent` बैकऑफ वृद्धि के लिए मिनटों में सीमा (डिफ़ॉल्ट: `60`)।
- `failureWindowHours`: बैकऑफ काउंटरों के लिए उपयोग की जाने वाली घंटों में रोलिंग विंडो (डिफ़ॉल्ट: `24`)।
- `overloadedProfileRotations`: मॉडल फ़ॉलबैक पर स्विच करने से पहले ओवरलोडेड त्रुटियों के लिए समान-प्रदाता auth-profile रोटेशन की अधिकतम संख्या (डिफ़ॉल्ट: `1`)। `ModelNotReadyException` जैसे प्रदाता-व्यस्त आकार यहाँ आते हैं।
- `overloadedBackoffMs`: ओवरलोडेड प्रदाता/प्रोफाइल रोटेशन को फिर से आज़माने से पहले निश्चित विलंब (डिफ़ॉल्ट: `0`)।
- `rateLimitedProfileRotations`: मॉडल फ़ॉलबैक पर स्विच करने से पहले रेट-लिमिट त्रुटियों के लिए समान-प्रदाता auth-profile रोटेशन की अधिकतम संख्या (डिफ़ॉल्ट: `1`)। उस रेट-लिमिट बकेट में प्रदाता-आकार का टेक्स्ट शामिल है, जैसे `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, और `resource exhausted`।

---

## लॉगिंग

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

- डिफ़ॉल्ट लॉग फ़ाइल: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`।
- स्थिर पथ के लिए `logging.file` सेट करें।
- `--verbose` होने पर `consoleLevel` `debug` तक बढ़ जाता है।
- `maxFileBytes`: रोटेशन से पहले सक्रिय लॉग फ़ाइल का अधिकतम आकार बाइट्स में (धनात्मक पूर्णांक; डिफ़ॉल्ट: `104857600` = 100 MB)। OpenClaw सक्रिय फ़ाइल के पास अधिकतम पाँच क्रमांकित आर्काइव रखता है।
- `redactSensitive` / `redactPatterns`: कंसोल आउटपुट, फ़ाइल लॉग, OTLP लॉग रिकॉर्ड, और स्थायी सेशन ट्रांसक्रिप्ट टेक्स्ट के लिए सर्वोत्तम-प्रयास मास्किंग। `redactSensitive: "off"` केवल इस सामान्य लॉग/ट्रांसक्रिप्ट नीति को अक्षम करता है; UI/टूल/डायग्नोस्टिक सुरक्षा सतहें अब भी उत्सर्जन से पहले सीक्रेट्स को रेडैक्ट करती हैं।

---

## डायग्नोस्टिक्स

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

- `enabled`: इंस्ट्रुमेंटेशन आउटपुट के लिए मास्टर टॉगल (डिफ़ॉल्ट: `true`)।
- `flags`: लक्षित लॉग आउटपुट सक्षम करने वाली फ़्लैग स्ट्रिंग की ऐरे (`"telegram.*"` या `"*"` जैसे वाइल्डकार्ड समर्थित)।
- `stuckSessionWarnMs`: लंबे समय तक चलने वाले प्रोसेसिंग सेशन को `session.long_running`, `session.stalled`, या `session.stuck` के रूप में वर्गीकृत करने के लिए ms में नो-प्रोग्रेस आयु सीमा। Reply, tool, status, block, और ACP प्रगति टाइमर को रीसेट करते हैं; दोहराए गए `session.stuck` डायग्नोस्टिक्स अपरिवर्तित रहने पर बैक ऑफ करते हैं।
- `stuckSessionAbortMs`: रिकवरी के लिए पात्र stalled सक्रिय कार्य को abort-drain करने से पहले ms में नो-प्रोग्रेस आयु सीमा। सेट न होने पर, OpenClaw कम से कम 5 मिनट और 3x `stuckSessionWarnMs` की सुरक्षित विस्तारित embedded-run विंडो का उपयोग करता है।
- `memoryPressureSnapshot`: मेमोरी प्रेशर `critical` तक पहुँचने पर रेडैक्टेड प्री-OOM स्थिरता स्नैपशॉट कैप्चर करता है (डिफ़ॉल्ट: `false`)। सामान्य मेमोरी प्रेशर इवेंट्स बनाए रखते हुए स्थिरता बंडल फ़ाइल स्कैन/लिखाई जोड़ने के लिए `true` सेट करें।
- `otel.enabled`: OpenTelemetry एक्सपोर्ट पाइपलाइन सक्षम करता है (डिफ़ॉल्ट: `false`)। पूर्ण कॉन्फ़िगरेशन, सिग्नल कैटलॉग, और गोपनीयता मॉडल के लिए [OpenTelemetry एक्सपोर्ट](/hi/gateway/opentelemetry) देखें।
- `otel.endpoint`: OTel एक्सपोर्ट के लिए कलेक्टर URL।
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: वैकल्पिक सिग्नल-विशिष्ट OTLP एंडपॉइंट। सेट होने पर, वे केवल उस सिग्नल के लिए `otel.endpoint` को ओवरराइड करते हैं।
- `otel.protocol`: `"http/protobuf"` (डिफ़ॉल्ट) या `"grpc"`।
- `otel.headers`: OTel एक्सपोर्ट अनुरोधों के साथ भेजे गए अतिरिक्त HTTP/gRPC मेटाडेटा हेडर।
- `otel.serviceName`: रिसोर्स एट्रिब्यूट्स के लिए सेवा नाम।
- `otel.traces` / `otel.metrics` / `otel.logs`: ट्रेस, मेट्रिक्स, या लॉग एक्सपोर्ट सक्षम करें।
- `otel.logsExporter`: लॉग एक्सपोर्ट सिंक: `"otlp"` (डिफ़ॉल्ट), प्रति stdout लाइन एक JSON ऑब्जेक्ट के लिए `"stdout"`, या `"both"`।
- `otel.sampleRate`: ट्रेस सैंपलिंग दर `0`-`1`।
- `otel.flushIntervalMs`: आवधिक टेलीमेट्री फ्लश अंतराल ms में।
- `otel.captureContent`: OTEL span एट्रिब्यूट्स के लिए ऑप्ट-इन रॉ कंटेंट कैप्चर। डिफ़ॉल्ट रूप से बंद। Boolean `true` non-system message/tool कंटेंट कैप्चर करता है; ऑब्जेक्ट रूप आपको `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, और `toolDefinitions` को स्पष्ट रूप से सक्षम करने देता है।
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: नवीनतम प्रयोगात्मक GenAI inference span आकार के लिए environment टॉगल, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span नाम, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। डिफ़ॉल्ट रूप से spans संगतता के लिए `openclaw.model.call` और `gen_ai.system` रखते हैं; GenAI metrics bounded semantic attributes का उपयोग करते हैं।
- `OPENCLAW_OTEL_PRELOADED=1`: उन hosts के लिए environment टॉगल जिन्होंने पहले ही global OpenTelemetry SDK पंजीकृत कर दिया है। OpenClaw फिर diagnostic listeners को सक्रिय रखते हुए plugin-owned SDK startup/shutdown छोड़ देता है।
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, और `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: मिलती-जुलती कॉन्फ़िग कुंजी unset होने पर उपयोग किए जाने वाले signal-specific endpoint env vars।
- `cacheTrace.enabled`: embedded runs के लिए cache trace snapshots लॉग करें (डिफ़ॉल्ट: `false`)।
- `cacheTrace.filePath`: cache trace JSONL के लिए आउटपुट पथ (डिफ़ॉल्ट: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)।
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace आउटपुट में क्या शामिल है, नियंत्रित करें (सभी डिफ़ॉल्ट: `true`)।

---

## अपडेट

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

- `channel`: npm/git installs के लिए रिलीज़ चैनल - `"stable"`, `"beta"`, या `"dev"`।
- `checkOnStart`: Gateway शुरू होने पर npm अपडेट की जाँच करें (डिफ़ॉल्ट: `true`)।
- `auto.enabled`: package installs के लिए background auto-update सक्षम करें (डिफ़ॉल्ट: `false`)।
- `auto.stableDelayHours`: stable-channel auto-apply से पहले घंटों में न्यूनतम विलंब (डिफ़ॉल्ट: `6`; अधिकतम: `168`)।
- `auto.stableJitterHours`: घंटों में अतिरिक्त stable-channel rollout spread window (डिफ़ॉल्ट: `12`; अधिकतम: `168`)।
- `auto.betaCheckIntervalHours`: beta-channel checks कितनी बार घंटों में चलते हैं (डिफ़ॉल्ट: `1`; अधिकतम: `24`)।

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

- `enabled`: वैश्विक ACP feature gate (डिफ़ॉल्ट: `true`; ACP dispatch और spawn affordances छिपाने के लिए `false` सेट करें)।
- `dispatch.enabled`: ACP session turn dispatch के लिए स्वतंत्र gate (डिफ़ॉल्ट: `true`)। execution को block करते हुए ACP commands उपलब्ध रखने के लिए `false` सेट करें।
- `backend`: डिफ़ॉल्ट ACP runtime backend id (किसी पंजीकृत ACP runtime plugin से मेल खाना चाहिए)।
  पहले backend plugin इंस्टॉल करें, और यदि `plugins.allow` सेट है, तो backend plugin id (उदाहरण के लिए `acpx`) शामिल करें, नहीं तो ACP backend लोड नहीं होगा।
- `defaultAgent`: जब spawns explicit target निर्दिष्ट नहीं करते, तब fallback ACP target agent id।
- `allowedAgents`: ACP runtime sessions के लिए अनुमत agent ids की allowlist; खाली का अर्थ है कोई अतिरिक्त प्रतिबंध नहीं।
- `maxConcurrentSessions`: अधिकतम समवर्ती रूप से सक्रिय ACP sessions।
- `stream.coalesceIdleMs`: streamed text के लिए ms में idle flush window।
- `stream.maxChunkChars`: streamed block projection को split करने से पहले अधिकतम chunk size।
- `stream.repeatSuppression`: प्रति turn दोहराई गई status/tool lines दबाएँ (डिफ़ॉल्ट: `true`)।
- `stream.deliveryMode`: `"live"` क्रमिक रूप से stream करता है; `"final_only"` turn terminal events तक buffer करता है।
- `stream.hiddenBoundarySeparator`: hidden tool events के बाद visible text से पहले separator (डिफ़ॉल्ट: `"paragraph"`)।
- `stream.maxOutputChars`: प्रति ACP turn projected assistant output characters की अधिकतम संख्या।
- `stream.maxSessionUpdateChars`: projected ACP status/update lines के लिए अधिकतम characters।
- `stream.tagVisibility`: streamed events के लिए tag names से boolean visibility overrides का record।
- `runtime.ttlMinutes`: eligible cleanup से पहले ACP session workers के लिए मिनटों में idle TTL।
- `runtime.installCommand`: ACP runtime environment bootstrap करते समय चलाने के लिए वैकल्पिक install command।

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

- `cli.banner.taglineMode` बैनर टैगलाइन शैली नियंत्रित करता है:
  - `"random"` (डिफ़ॉल्ट): घूमती हुई मज़ेदार/मौसमी टैगलाइन।
  - `"default"`: स्थिर तटस्थ टैगलाइन (`All your chats, one OpenClaw.`)।
  - `"off"`: कोई टैगलाइन टेक्स्ट नहीं (बैनर शीर्षक/वर्ज़न फिर भी दिखता है)।
- पूरे बैनर को छिपाने के लिए (सिर्फ़ टैगलाइन नहीं), env `OPENCLAW_HIDE_BANNER=1` सेट करें।

---

## विज़ार्ड

CLI निर्देशित सेटअप फ़्लो (`onboard`, `configure`, `doctor`) द्वारा लिखा गया मेटाडेटा:

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

## पहचान

[Agent डिफ़ॉल्ट](/hi/gateway/config-agents#agent-defaults) के अंतर्गत `agents.list` पहचान फ़ील्ड देखें।

---

## ब्रिज (लेगेसी, हटाया गया)

वर्तमान बिल्ड में अब TCP ब्रिज शामिल नहीं है। नोड्स Gateway WebSocket के ज़रिए कनेक्ट होते हैं। `bridge.*` कुंजियाँ अब कॉन्फ़िग स्कीमा का हिस्सा नहीं हैं (हटाए जाने तक सत्यापन विफल होता है; `openclaw doctor --fix` अज्ञात कुंजियाँ हटा सकता है)।

<Accordion title="लेगेसी ब्रिज कॉन्फ़िग (ऐतिहासिक संदर्भ)">

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

- `sessionRetention`: पूर्ण हो चुके अलग-थलग cron रन सत्रों को `sessions.json` से काटने से पहले कितनी देर तक रखना है। संग्रहित हटाए गए cron ट्रांसक्रिप्ट की सफ़ाई भी नियंत्रित करता है। डिफ़ॉल्ट: `24h`; अक्षम करने के लिए `false` सेट करें।
- `runLog.maxBytes`: पुराने फ़ाइल-समर्थित cron रन लॉग के साथ संगतता के लिए स्वीकार किया जाता है। डिफ़ॉल्ट: `2_000_000` बाइट।
- `runLog.keepLines`: प्रति जॉब रखी गई नवीनतम SQLite रन-इतिहास पंक्तियाँ। डिफ़ॉल्ट: `2000`।
- `webhookToken`: cron webhook POST डिलीवरी (`delivery.mode = "webhook"`) के लिए इस्तेमाल किया गया bearer टोकन; अगर छोड़ा गया है, तो कोई auth हेडर नहीं भेजा जाता।
- `webhook`: अप्रचलित लेगेसी फ़ॉलबैक webhook URL (http/https), जिसे `openclaw doctor --fix` उन संग्रहीत जॉब को माइग्रेट करने के लिए इस्तेमाल करता है जिनमें अब भी `notify: true` है; रनटाइम डिलीवरी प्रति-जॉब `delivery.mode="webhook"` और `delivery.to`, या announce डिलीवरी संरक्षित रखते समय `delivery.completionDestination` का इस्तेमाल करती है।

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

- `maxAttempts`: अस्थायी त्रुटियों पर cron जॉब के लिए अधिकतम रीट्राई (डिफ़ॉल्ट: `3`; रेंज: `0`-`10`)।
- `backoffMs`: हर रीट्राई प्रयास के लिए ms में बैकऑफ़ विलंबों की ऐरे (डिफ़ॉल्ट: `[30000, 60000, 300000]`; 1-10 प्रविष्टियाँ)।
- `retryOn`: वे त्रुटि प्रकार जो रीट्राई ट्रिगर करते हैं - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`। सभी अस्थायी प्रकारों पर रीट्राई करने के लिए इसे छोड़ दें।

वन-शॉट जॉब रीट्राई प्रयास समाप्त होने तक सक्षम रहते हैं, फिर अंतिम त्रुटि स्थिति रखते हुए अक्षम हो जाते हैं। आवर्ती जॉब अपने अगले निर्धारित स्लॉट से पहले बैकऑफ़ के बाद फिर से चलने के लिए वही अस्थायी रीट्राई नीति इस्तेमाल करते हैं; स्थायी त्रुटियाँ या समाप्त अस्थायी रीट्राई त्रुटि बैकऑफ़ के साथ सामान्य आवर्ती शेड्यूल पर लौट जाते हैं।

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

- `enabled`: cron जॉब के लिए विफलता अलर्ट सक्षम करें (डिफ़ॉल्ट: `false`)।
- `after`: अलर्ट चलने से पहले लगातार विफलताओं की संख्या (धनात्मक पूर्णांक, न्यूनतम: `1`)।
- `cooldownMs`: एक ही जॉब के लिए दोहराए गए अलर्ट के बीच न्यूनतम मिलीसेकंड (गैर-ऋणात्मक पूर्णांक)।
- `includeSkipped`: लगातार छोड़े गए रन को अलर्ट सीमा में गिनें (डिफ़ॉल्ट: `false`)। छोड़े गए रन अलग से ट्रैक किए जाते हैं और निष्पादन-त्रुटि बैकऑफ़ को प्रभावित नहीं करते।
- `mode`: डिलीवरी मोड - `"announce"` चैनल संदेश के ज़रिए भेजता है; `"webhook"` कॉन्फ़िगर किए गए webhook पर पोस्ट करता है।
- `accountId`: अलर्ट डिलीवरी को सीमित करने के लिए वैकल्पिक अकाउंट या चैनल id।

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

- सभी जॉब में cron विफलता सूचनाओं के लिए डिफ़ॉल्ट गंतव्य।
- `mode`: `"announce"` या `"webhook"`; पर्याप्त लक्ष्य डेटा मौजूद होने पर डिफ़ॉल्ट `"announce"` होता है।
- `channel`: announce डिलीवरी के लिए चैनल ओवरराइड। `"last"` अंतिम ज्ञात डिलीवरी चैनल का फिर से इस्तेमाल करता है।
- `to`: स्पष्ट announce लक्ष्य या webhook URL। webhook मोड के लिए आवश्यक।
- `accountId`: डिलीवरी के लिए वैकल्पिक अकाउंट ओवरराइड।
- प्रति-जॉब `delivery.failureDestination` इस ग्लोबल डिफ़ॉल्ट को ओवरराइड करता है।
- जब न ग्लोबल और न ही प्रति-जॉब विफलता गंतव्य सेट हो, तो जो जॉब पहले से `announce` के ज़रिए डिलीवर करते हैं वे विफलता पर उसी प्राथमिक announce लक्ष्य पर लौटते हैं।
- `delivery.failureDestination` सिर्फ़ `sessionTarget="isolated"` जॉब के लिए समर्थित है, जब तक कि जॉब का प्राथमिक `delivery.mode` `"webhook"` न हो।

[Cron जॉब](/hi/automation/cron-jobs) देखें। अलग-थलग cron निष्पादन [बैकग्राउंड टास्क](/hi/automation/tasks) के रूप में ट्रैक किए जाते हैं।

---

## मीडिया मॉडल टेम्पलेट वैरिएबल

`tools.media.models[].args` में विस्तारित किए गए टेम्पलेट प्लेसहोल्डर:

| वैरिएबल           | विवरण                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | पूर्ण इनबाउंड संदेश बॉडी                         |
| `{{RawBody}}`      | रॉ बॉडी (कोई इतिहास/प्रेषक रैपर नहीं)             |
| `{{BodyStripped}}` | ग्रुप मेंशन हटाई हुई बॉडी                 |
| `{{From}}`         | प्रेषक पहचानकर्ता                                 |
| `{{To}}`           | गंतव्य पहचानकर्ता                            |
| `{{MessageSid}}`   | चैनल संदेश id                                |
| `{{SessionId}}`    | वर्तमान सत्र UUID                              |
| `{{IsNewSession}}` | नया सत्र बनने पर `"true"`                 |
| `{{MediaUrl}}`     | इनबाउंड मीडिया pseudo-URL                          |
| `{{MediaPath}}`    | स्थानीय मीडिया पाथ                                  |
| `{{MediaType}}`    | मीडिया प्रकार (इमेज/ऑडियो/दस्तावेज़/…)               |
| `{{Transcript}}`   | ऑडियो ट्रांसक्रिप्ट                                  |
| `{{Prompt}}`       | CLI प्रविष्टियों के लिए हल किया गया मीडिया प्रॉम्प्ट             |
| `{{MaxChars}}`     | CLI प्रविष्टियों के लिए हल किए गए अधिकतम आउटपुट वर्ण         |
| `{{ChatType}}`     | `"direct"` या `"group"`                           |
| `{{GroupSubject}}` | ग्रुप विषय (सर्वश्रेष्ठ प्रयास)                       |
| `{{GroupMembers}}` | ग्रुप सदस्यों का प्रीव्यू (सर्वश्रेष्ठ प्रयास)               |
| `{{SenderName}}`   | प्रेषक डिस्प्ले नाम (सर्वश्रेष्ठ प्रयास)                 |
| `{{SenderE164}}`   | प्रेषक फ़ोन नंबर (सर्वश्रेष्ठ प्रयास)                 |
| `{{Provider}}`     | प्रदाता संकेत (WhatsApp, Telegram, Discord, आदि) |

---

## कॉन्फ़िग इन्क्लूड (`$include`)

कॉन्फ़िग को कई फ़ाइलों में बाँटें:

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

**मर्ज व्यवहार:**

- एकल फ़ाइल: शामिल ऑब्जेक्ट को बदल देती है।
- फ़ाइलों की ऐरे: क्रम में डीप-मर्ज की जाती है (बाद वाली पहले वाली को ओवरराइड करती है)।
- सिबलिंग कुंजियाँ: इन्क्लूड के बाद मर्ज की जाती हैं (शामिल मानों को ओवरराइड करती हैं)।
- नेस्टेड इन्क्लूड: 10 स्तर तक गहरे।
- पाथ: इन्क्लूड करने वाली फ़ाइल के सापेक्ष हल किए जाते हैं, लेकिन शीर्ष-स्तरीय कॉन्फ़िग डायरेक्टरी (`openclaw.json` का `dirname`) के अंदर ही रहने चाहिए। Absolute/`../` फ़ॉर्म सिर्फ़ तब अनुमत हैं जब वे फिर भी उस सीमा के अंदर हल हों। पाथ में null बाइट नहीं होने चाहिए और हल करने से पहले और बाद में 4096 वर्णों से सख़्ती से छोटे होने चाहिए।
- OpenClaw-स्वामित्व वाली लिखाइयाँ, जो केवल एक शीर्ष-स्तरीय सेक्शन बदलती हैं और जो एकल-फ़ाइल इन्क्लूड द्वारा समर्थित है, उसी शामिल फ़ाइल में लिखती हैं। उदाहरण के लिए, `plugins install` `plugins.json5` में `plugins: { $include: "./plugins.json5" }` अपडेट करता है और `openclaw.json` को जस का तस छोड़ता है।
- रूट इन्क्लूड, इन्क्लूड ऐरे, और सिबलिंग ओवरराइड वाले इन्क्लूड OpenClaw-स्वामित्व वाली लिखाइयों के लिए रीड-ओनली हैं; वे लिखाइयाँ कॉन्फ़िग को फ़्लैटन करने के बजाय बंद होकर विफल होती हैं।
- त्रुटियाँ: गुम फ़ाइलों, पार्स त्रुटियों, चक्रीय इन्क्लूड, अमान्य पाथ फ़ॉर्मैट, और अत्यधिक लंबाई के लिए स्पष्ट संदेश।

---

_संबंधित: [कॉन्फ़िगरेशन](/hi/gateway/configuration) · [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
