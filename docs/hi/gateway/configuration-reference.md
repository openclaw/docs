---
read_when:
    - आपको सटीक फ़ील्ड-स्तरीय कॉन्फ़िगरेशन सिमैंटिक्स या डिफ़ॉल्ट मान चाहिए
    - आप चैनल, मॉडल, गेटवे, या टूल कॉन्फ़िगरेशन ब्लॉक को मान्य कर रहे हैं
summary: core OpenClaw कुंजियों, डिफ़ॉल्ट्स, और समर्पित सबसिस्टम संदर्भों के लिंक के लिए Gateway कॉन्फ़िगरेशन संदर्भ
title: कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-07-02T00:56:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw के मुख्य कॉन्फ़िगरेशन संदर्भ `~/.openclaw/openclaw.json` के लिए। कार्य-केंद्रित अवलोकन के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

मुख्य OpenClaw कॉन्फ़िगरेशन सतहों को कवर करता है और जब किसी उप-प्रणाली का अपना गहरा संदर्भ होता है, तो वहाँ लिंक करता है। चैनल- और plugin-स्वामित्व वाले कमांड कैटलॉग और गहरे memory/QMD नॉब इस पेज के बजाय अपने अलग पेजों पर रहते हैं।

कोड सत्य:

- `openclaw config schema` सत्यापन और Control UI के लिए उपयोग होने वाला लाइव JSON Schema प्रिंट करता है, उपलब्ध होने पर bundled/plugin/channel मेटाडेटा को मर्ज करके
- `config.schema.lookup` ड्रिल-डाउन टूलिंग के लिए एक path-scoped schema node लौटाता है
- `pnpm config:docs:check` / `pnpm config:docs:gen` मौजूदा schema surface के विरुद्ध config-doc baseline hash को मान्य करते हैं

Agent lookup path: संपादन से पहले सटीक field-level दस्तावेज़ों और constraints के लिए
`gateway` tool action `config.schema.lookup` का उपयोग करें। कार्य-केंद्रित मार्गदर्शन के लिए
[कॉन्फ़िगरेशन](/hi/gateway/configuration) और व्यापक field map, defaults, और subsystem references के लिंक के लिए यह पेज
उपयोग करें।

समर्पित गहरे संदर्भ:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, और `plugins.entries.memory-core.config.dreaming` के अंतर्गत dreaming config के लिए [Memory configuration reference](/hi/reference/memory-config)
- मौजूदा built-in + bundled command catalog के लिए [Slash commands](/hi/tools/slash-commands)
- channel-specific command surfaces के लिए स्वामित्व वाले channel/plugin पेज

Config format **JSON5** है (comments + trailing commas की अनुमति है)। सभी fields वैकल्पिक हैं - छोड़े जाने पर OpenClaw सुरक्षित defaults का उपयोग करता है।

---

## चैनल

Per-channel config keys एक समर्पित पेज पर चले गए हैं - `channels.*` के लिए
[Configuration - channels](/hi/gateway/config-channels) देखें,
जिसमें Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, और अन्य
bundled channels (auth, access control, multi-account, mention gating) शामिल हैं।

## Agent defaults, multi-agent, sessions, और messages

एक समर्पित पेज पर स्थानांतरित - इसके लिए
[Configuration - agents](/hi/gateway/config-agents) देखें:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (multi-agent routing और bindings)
- `session.*` (session lifecycle, compaction, pruning)
- `messages.*` (message delivery, TTS, markdown rendering)
- `talk.*` (Talk mode)
  - `talk.consultThinkingLevel`: Control UI Talk realtime consults के पीछे पूरे OpenClaw agent run के लिए thinking level override
  - `talk.consultFastMode`: Control UI Talk realtime consults के लिए one-shot fast-mode override
  - `talk.speechLocale`: iOS/macOS पर Talk speech recognition के लिए वैकल्पिक BCP 47 locale id
  - `talk.silenceTimeoutMs`: unset होने पर, transcript भेजने से पहले Talk platform default pause window रखता है (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` को छोड़ने वाले finalized realtime Talk transcripts के लिए Gateway relay fallback

## Tools और custom providers

Tool policy, experimental toggles, provider-backed tool config, और custom
provider / base-URL setup एक समर्पित पेज पर चले गए हैं - देखें
[Configuration - tools and custom providers](/hi/gateway/config-tools).

## Models

Provider definitions, model allowlists, और custom provider setup
[Configuration - tools and custom providers](/hi/gateway/config-tools#custom-providers-and-base-urls) में हैं।
`models` root global model-catalog behavior का भी स्वामी है।

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
- `models.providers.*.localService`: local model servers के लिए वैकल्पिक on-demand process manager। OpenClaw configured health endpoint को probe करता है, ज़रूरत पड़ने पर absolute `command` शुरू करता है, readiness की प्रतीक्षा करता है, फिर model request भेजता है। [Local model services](/hi/gateway/local-model-services) देखें।
- `models.pricing.enabled`: background pricing bootstrap को नियंत्रित करता है जो sidecars और channels के Gateway ready path तक पहुँचने के बाद शुरू होता है। जब `false` हो, Gateway OpenRouter और LiteLLM pricing-catalog fetches छोड़ देता है; configured `models.providers.*.models[].cost` values अभी भी local cost estimates के लिए काम करती हैं।

## MCP

OpenClaw-managed MCP server definitions `mcp.servers` के अंतर्गत रहती हैं और
embedded OpenClaw और अन्य runtime adapters द्वारा उपभोग की जाती हैं। `openclaw mcp list`,
`show`, `set`, और `unset` commands config edits के दौरान target server से जुड़े बिना इस block को manage करते हैं।

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

- `mcp.servers`: configured MCP tools को expose करने वाले runtimes के लिए named stdio या remote MCP server definitions।
  Remote entries `transport: "streamable-http"` या `transport: "sse"` का उपयोग करती हैं;
  `type: "http"` एक CLI-native alias है जिसे `openclaw mcp set` और
  `openclaw doctor --fix` canonical `transport` field में normalize करते हैं।
- `mcp.servers.<name>.enabled`: saved server definition को बनाए रखते हुए उसे embedded OpenClaw MCP discovery और tool projection से बाहर रखने के लिए `false` set करें।
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: प्रति-server MCP request timeout seconds या milliseconds में।
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: प्रति-server connection timeout seconds या milliseconds में।
- `mcp.servers.<name>.supportsParallelToolCalls`: adapters के लिए वैकल्पिक concurrency hint जो चुन सकते हैं कि parallel MCP tool calls issue करने हैं या नहीं।
- `mcp.servers.<name>.auth`: OAuth की आवश्यकता वाले HTTP MCP servers के लिए `"oauth"` set करें। OpenClaw state के अंतर्गत tokens store करने के लिए `openclaw mcp login <name>` चलाएँ।
- `mcp.servers.<name>.oauth`: वैकल्पिक OAuth scope, redirect URL, और client metadata URL overrides।
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: private endpoints और mutual TLS के लिए HTTP TLS controls।
- `mcp.servers.<name>.toolFilter`: वैकल्पिक प्रति-server tool selection। `include`
  discovered MCP tools को matching names तक सीमित करता है; `exclude` matching
  names छिपाता है। Entries exact MCP tool names या simple `*` globs हैं। Resources या prompts वाले servers utility tool names (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) भी generate करते हैं, और वे names वही
  filter उपयोग करते हैं।
- `mcp.servers.<name>.codex`: वैकल्पिक Codex app-server projection controls।
  यह block केवल Codex app-server threads के लिए OpenClaw metadata है; यह
  ACP sessions, generic Codex harness config, या अन्य runtime adapters को
  प्रभावित नहीं करता। Non-empty `codex.agents` server को listed OpenClaw agent ids तक सीमित करता है।
  Empty, blank, या invalid scoped agent lists को config validation द्वारा reject किया जाता है
  और runtime projection path द्वारा global बनने के बजाय omit किया जाता है।
  `codex.defaultToolsApprovalMode` उस server के लिए Codex का native
  `default_tools_approval_mode` emit करता है। OpenClaw native `mcp_servers` config Codex को pass करने से पहले `codex`
  block strip कर देता है। Server को हर Codex app-server agent के लिए Codex के
  default MCP approval behavior के साथ projected रखने के लिए block omit करें।
- `mcp.sessionIdleTtlMs`: session-scoped bundled MCP runtimes के लिए idle TTL।
  One-shot embedded runs run-end cleanup request करते हैं; यह TTL long-lived sessions और future callers के लिए backstop है।
- `mcp.*` के अंतर्गत changes cached session MCP runtimes को dispose करके hot-apply होते हैं।
  अगला tool discovery/use उन्हें नए config से recreate करता है, इसलिए removed
  `mcp.servers` entries idle TTL की प्रतीक्षा करने के बजाय तुरंत reaped हो जाती हैं।
- Runtime discovery MCP tool-list change notifications का भी सम्मान करता है और
  उस session के cached catalog को drop करता है। Resources या prompts advertise करने वाले servers
  resources list/read और prompts list/fetch करने के लिए utility tools प्राप्त करते हैं। Repeated tool-call failures प्रभावित server को कुछ समय के लिए pause करते हैं
  फिर दूसरा call attempt होता है।

Runtime behavior के लिए [MCP](/hi/cli/mcp#openclaw-as-an-mcp-client-registry) और
[CLI backends](/hi/gateway/cli-backends#bundle-mcp-overlays) देखें।

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

- `allowBundled`: केवल bundled skills के लिए वैकल्पिक allowlist (managed/workspace skills अप्रभावित)।
- `load.extraDirs`: extra shared skill roots (सबसे कम precedence)।
- `load.allowSymlinkTargets`: trusted real target roots जिनमें skill symlinks resolve हो सकते हैं
  जब link अपने configured source root के बाहर रहता है।
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply को पहले से trusted symlink targets के माध्यम से write करने की अनुमति देता है (default: false)।
- `install.preferBrew`: true होने पर, जब `brew` उपलब्ध हो तो अन्य installer kinds पर fall back करने से पहले Homebrew installers को prefer करें।
- `install.nodeManager`: `metadata.openclaw.install` specs के लिए node installer preference (`npm` | `pnpm` | `yarn` | `bun`)।
- `install.allowUploadedArchives`: trusted `operator.admin` Gateway
  clients को `skills.upload.*` के माध्यम से staged private zip archives install करने की अनुमति दें
  (default: false)। यह केवल uploaded-archive path enable करता है; सामान्य ClawHub
  installs को इसकी आवश्यकता नहीं होती।
- `entries.<skillKey>.enabled: false` किसी skill को disable करता है, भले ही वह bundled/installed हो।
- `entries.<skillKey>.apiKey`: primary env var घोषित करने वाली skills के लिए सुविधा (plaintext string या SecretRef object)।

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

- `~/.openclaw/extensions` और `<workspace>/.openclaw/extensions` के अंतर्गत package या bundle directories से, साथ ही `plugins.load.paths` में सूचीबद्ध files या directories से लोड किया गया।
- standalone plugin files को `plugins.load.paths` में रखें; auto-discovered extension roots top-level `.js`, `.mjs`, और `.ts` files को अनदेखा करते हैं ताकि उन roots में helper scripts startup को block न करें।
- Discovery native OpenClaw plugins के साथ compatible Codex bundles और Claude bundles स्वीकार करता है, जिनमें manifestless Claude default-layout bundles भी शामिल हैं।
- **Config changes के लिए gateway restart आवश्यक है।**
- `allow`: वैकल्पिक allowlist (केवल सूचीबद्ध plugins लोड होते हैं)। `deny` प्राथमिकता लेता है।
- `plugins.entries.<id>.apiKey`: plugin-level API key सुविधा field (जब plugin द्वारा समर्थित हो)।
- `plugins.entries.<id>.env`: plugin-scoped env var map।
- `plugins.entries.<id>.hooks.allowPromptInjection`: जब `false` हो, core `before_prompt_build` को block करता है और legacy `before_agent_start` से prompt-mutating fields को अनदेखा करता है, जबकि legacy `modelOverride` और `providerOverride` को बनाए रखता है। यह native plugin hooks और समर्थित bundle-provided hook directories पर लागू होता है।
- `plugins.entries.<id>.hooks.allowConversationAccess`: जब `true` हो, trusted non-bundled plugins typed hooks जैसे `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, और `agent_end` से raw conversation content पढ़ सकते हैं।
- `plugins.entries.<id>.subagent.allowModelOverride`: इस plugin को background subagent runs के लिए per-run `provider` और `model` overrides का अनुरोध करने के लिए स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.subagent.allowedModels`: trusted subagent overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model को allow करना चाहते हों।
- `plugins.entries.<id>.llm.allowModelOverride`: इस plugin को `api.runtime.llm.complete` के लिए model overrides का अनुरोध करने के लिए स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.llm.allowedModels`: trusted plugin LLM completion overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model को allow करना चाहते हों।
- `plugins.entries.<id>.llm.allowAgentIdOverride`: इस plugin को non-default agent id के विरुद्ध `api.runtime.llm.complete` चलाने के लिए स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.config`: plugin-defined config object (उपलब्ध होने पर native OpenClaw plugin schema द्वारा validated)।
- Channel plugin account/runtime settings `channels.<id>` के अंतर्गत रहते हैं और इन्हें central OpenClaw option registry से नहीं, बल्कि owning plugin के manifest `channelConfigs` metadata से describe किया जाना चाहिए।

### Codex harness plugin config

bundled `codex` plugin native Codex app-server harness settings का स्वामी है, जो
`plugins.entries.codex.config` के अंतर्गत हैं। पूरे config surface के लिए
[Codex harness reference](/hi/plugins/codex-harness-reference) और runtime model के लिए
[Codex harness](/hi/plugins/codex-harness) देखें।

`codexPlugins` केवल उन sessions पर लागू होता है जो native Codex harness select करते हैं।
यह OpenClaw provider runs, ACP conversation bindings, या किसी non-Codex harness के लिए
Codex plugins enable नहीं करता।

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
  plugin/app support enable करता है। Default: `false`।
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  migrated plugin app elicitations के लिए default destructive-action policy।
  prompting के बिना safe Codex approval schemas accept करने के लिए `true`, उन्हें
  decline करने के लिए `false`, Codex-required approvals को OpenClaw
  plugin approvals के जरिए route करने के लिए `"auto"`, या हर plugin write/destructive
  action के लिए durable approval के बिना prompt करने हेतु `"ask"` का उपयोग करें।
  `"ask"` mode affected app के लिए durable Codex per-tool approval overrides clear करता है
  और Codex thread शुरू होने से पहले उस app के लिए human approvals reviewer select करता है।
  Default: `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: जब global
  `codexPlugins.enabled` भी true हो, तब migrated plugin entry enable करता है।
  Default: explicit entries के लिए `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stable marketplace identity। V1 केवल `"openai-curated"` support करता है।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration से stable
  Codex plugin identity, उदाहरण के लिए `"google-calendar"`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  per-plugin destructive-action override। omit होने पर global
  `allow_destructive_actions` value उपयोग होती है। per-plugin value वही
  `true`, `false`, `"auto"`, या `"ask"` policies स्वीकार करती है।

हर admitted plugin app जो `"ask"` उपयोग करता है, उस app की approval requests को
human reviewer तक route करता है। अन्य apps और non-app thread approvals अपना
configured reviewer रखते हैं, इसलिए mixed plugin policies `"ask"` behavior inherit नहीं करतीं।

`codexPlugins.enabled` global enablement directive है। migration द्वारा लिखी गई explicit plugin
entries durable install और repair eligibility set हैं।
`plugins["*"]` supported नहीं है, कोई `install` switch नहीं है, और local
`marketplacePath` values जानबूझकर config fields नहीं हैं क्योंकि वे
host-specific हैं।

`app/list` readiness checks एक घंटे के लिए cache किए जाते हैं और stale होने पर
asynchronously refresh होते हैं। Codex thread app config Codex harness
session establishment पर compute होता है, हर turn पर नहीं; native plugin config बदलने के बाद
`/new`, `/reset`, या gateway restart का उपयोग करें।

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider settings।
  - `apiKey`: higher limits के लिए वैकल्पिक Firecrawl API key (SecretRef स्वीकार करता है)। `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, या `FIRECRAWL_API_KEY` env var पर fallback करता है।
  - `baseUrl`: Firecrawl API base URL (default: `https://api.firecrawl.dev`; self-hosted overrides को private/internal endpoints target करने चाहिए)।
  - `onlyMainContent`: pages से केवल main content extract करें (default: `true`)।
  - `maxAgeMs`: milliseconds में maximum cache age (default: `172800000` / 2 दिन)।
  - `timeoutSeconds`: seconds में scrape request timeout (default: `60`)।
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) settings।
  - `enabled`: X Search provider enable करें।
  - `model`: search के लिए उपयोग होने वाला Grok model (जैसे `"grok-4-1-fast"`)।
- `plugins.entries.memory-core.config.dreaming`: memory dreaming settings। phases और thresholds के लिए [Dreaming](/hi/concepts/dreaming) देखें।
  - `enabled`: master dreaming switch (default `false`)।
  - `frequency`: हर full dreaming sweep के लिए cron cadence (default रूप से `"0 3 * * *"`)।
  - `model`: वैकल्पिक Dream Diary subagent model override। `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है; targets restrict करने के लिए `allowedModels` के साथ pair करें। Model-unavailable errors session default model के साथ एक बार retry करते हैं; trust या allowlist failures silently fall back नहीं करते।
  - phase policy और thresholds implementation details हैं (user-facing config keys नहीं)।
- पूरा memory config [Memory configuration reference](/hi/reference/memory-config) में है:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Enabled Claude bundle plugins `settings.json` से embedded OpenClaw defaults भी contribute कर सकते हैं; OpenClaw इन्हें sanitized agent settings के रूप में apply करता है, raw OpenClaw config patches के रूप में नहीं।
- `plugins.slots.memory`: active memory plugin id चुनें, या memory plugins disable करने के लिए `"none"`।
- `plugins.slots.contextEngine`: active context engine plugin id चुनें; जब तक आप कोई दूसरा engine install और select नहीं करते, default `"legacy"` है।

[Plugins](/hi/tools/plugin) देखें।

---

## प्रतिबद्धताएँ

`commitments` inferred follow-up memory को control करता है: OpenClaw conversation turns से check-ins detect कर सकता है और उन्हें heartbeat runs के जरिए deliver कर सकता है।

- `commitments.enabled`: inferred follow-up commitments के लिए hidden LLM extraction, storage, और heartbeat delivery enable करें। Default: `false`।
- `commitments.maxPerDay`: rolling day में प्रति agent session deliver किए जाने वाले maximum inferred follow-up commitments। Default: `3`।

[Inferred commitments](/hi/concepts/commitments) देखें।

---

## ब्राउज़र

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
- `tabCleanup` निष्क्रिय समय के बाद या जब कोई सत्र अपनी सीमा से अधिक हो जाता है, ट्रैक किए गए primary-agent टैब वापस लेता है। उन अलग-अलग cleanup मोड को अक्षम करने के लिए `idleMinutes: 0` या `maxTabsPerSession: 0` सेट करें।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` सेट न होने पर अक्षम रहता है, इसलिए browser navigation डिफ़ॉल्ट रूप से सख्त रहती है।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` केवल तब सेट करें जब आप जानबूझकर private-network browser navigation पर भरोसा करते हों।
- सख्त मोड में, remote CDP profile endpoints (`profiles.*.cdpUrl`) reachability/discovery जांचों के दौरान उसी private-network blocking के अधीन होते हैं।
- `ssrfPolicy.allowPrivateNetwork` legacy alias के रूप में समर्थित रहता है।
- सख्त मोड में, स्पष्ट अपवादों के लिए `ssrfPolicy.hostnameAllowlist` और `ssrfPolicy.allowedHostnames` का उपयोग करें।
- Remote profiles attach-only होते हैं (start/stop/reset अक्षम)।
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://`, और `wss://` स्वीकार करता है।
  जब आप चाहते हैं कि OpenClaw `/json/version` खोजे, तब HTTP(S) का उपयोग करें; जब आपका provider आपको सीधा DevTools WebSocket URL देता है, तब WS(S) का उपयोग करें।
- `remoteCdpTimeoutMs` और `remoteCdpHandshakeTimeoutMs` remote और
  `attachOnly` CDP reachability तथा tab-opening अनुरोधों पर लागू होते हैं। Managed loopback
  profiles स्थानीय CDP defaults बनाए रखते हैं।
- यदि कोई externally managed CDP service loopback के माध्यम से पहुंच योग्य है, तो उस
  profile का `attachOnly: true` सेट करें; अन्यथा OpenClaw loopback port को
  local managed browser profile मानेगा और local port ownership errors रिपोर्ट कर सकता है।
- `existing-session` profiles CDP के बजाय Chrome MCP का उपयोग करते हैं और
  चयनित host पर या connected browser node के माध्यम से attach कर सकते हैं।
- `existing-session` profiles Brave या Edge जैसे किसी विशिष्ट
  Chromium-based browser profile को target करने के लिए `userDataDir` सेट कर सकते हैं।
- `existing-session` profiles `cdpUrl` सेट कर सकते हैं जब Chrome पहले से
  DevTools HTTP(S) discovery endpoint या direct WS(S) endpoint के पीछे चल रहा हो। उस
  मोड में OpenClaw auto-connect का उपयोग करने के बजाय endpoint को Chrome MCP को पास करता है;
  Chrome MCP launch arguments के लिए `userDataDir` अनदेखा किया जाता है।
- `existing-session` profiles वर्तमान Chrome MCP route limits बनाए रखते हैं:
  CSS-selector targeting के बजाय snapshot/ref-driven actions, one-file upload
  hooks, कोई dialog timeout overrides नहीं, कोई `wait --load networkidle` नहीं, और कोई
  `responsebody`, PDF export, download interception, या batch actions नहीं।
- Local managed `openclaw` profiles `cdpPort` और `cdpUrl` को auto-assign करते हैं; `cdpUrl` को स्पष्ट रूप से केवल remote CDP profiles या existing-session endpoint attach के लिए सेट करें।
- Local managed profiles उस profile के लिए global
  `browser.executablePath` को override करने के लिए `executablePath` सेट कर सकते हैं। इसका उपयोग एक profile को
  Chrome में और दूसरे को Brave में चलाने के लिए करें।
- Local managed profiles process start के बाद Chrome CDP HTTP
  discovery के लिए `browser.localLaunchTimeoutMs` और
  post-launch CDP websocket readiness के लिए `browser.localCdpReadyTimeoutMs` का उपयोग करते हैं। इन्हें धीमे hosts पर बढ़ाएं जहां Chrome
  सफलतापूर्वक शुरू होता है लेकिन readiness checks startup से race करते हैं। दोनों values
  `120000` ms तक positive integers होनी चाहिए; invalid config values अस्वीकार की जाती हैं।
- Auto-detect order: default browser यदि Chromium-based हो → Chrome → Brave → Edge → Chromium → Chrome Canary।
- `browser.executablePath` और `browser.profiles.<name>.executablePath` दोनों
  Chromium launch से पहले आपके OS home directory के लिए `~` और `~/...` स्वीकार करते हैं।
  `existing-session` profiles पर per-profile `userDataDir` भी tilde-expanded होता है।
- Control service: केवल loopback (port `gateway.port` से derived, default `18791`)।
- `extraArgs` local Chromium startup में अतिरिक्त launch flags जोड़ता है (उदाहरण के लिए
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

- `mode`: `local` (Gateway चलाएं) या `remote` (दूरस्थ Gateway से कनेक्ट करें)। Gateway तब तक शुरू होने से इंकार करता है जब तक `local` न हो।
- `port`: WS + HTTP के लिए एकल मल्टीप्लेक्स्ड पोर्ट। प्राथमिकता: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`।
- `bind`: `auto`, `loopback` (डिफ़ॉल्ट), `lan` (`0.0.0.0`), `tailnet` (केवल Tailscale IP), या `custom`।
- **पुराने bind उपनाम**: `gateway.bind` में bind मोड मान (`auto`, `loopback`, `lan`, `tailnet`, `custom`) का उपयोग करें, host उपनामों (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) का नहीं।
- **Docker नोट**: डिफ़ॉल्ट `loopback` bind कंटेनर के अंदर `127.0.0.1` पर सुनता है। Docker bridge networking (`-p 18789:18789`) के साथ, ट्रैफ़िक `eth0` पर आता है, इसलिए Gateway पहुंच योग्य नहीं रहता। सभी इंटरफ़ेस पर सुनने के लिए `--network host` का उपयोग करें, या `bind: "lan"` (या `customBindHost: "0.0.0.0"` के साथ `bind: "custom"`) सेट करें।
- **Auth**: डिफ़ॉल्ट रूप से आवश्यक। non-loopback binds के लिए Gateway auth आवश्यक है। व्यवहार में इसका अर्थ साझा token/password या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy है। Onboarding wizard डिफ़ॉल्ट रूप से token जनरेट करता है।
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं (SecretRefs सहित), तो `gateway.auth.mode` को स्पष्ट रूप से `token` या `password` पर सेट करें। दोनों कॉन्फ़िगर होने और mode सेट न होने पर startup और service install/repair flows विफल हो जाते हैं।
- `gateway.auth.mode: "none"`: स्पष्ट no-auth मोड। केवल विश्वसनीय local loopback सेटअप के लिए उपयोग करें; इसे जानबूझकर onboarding prompts में नहीं दिया जाता।
- `gateway.auth.mode: "trusted-proxy"`: browser/user auth को identity-aware reverse proxy को सौंपें और `gateway.trustedProxies` से identity headers पर भरोसा करें ([Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें)। यह मोड डिफ़ॉल्ट रूप से **non-loopback** proxy source की अपेक्षा करता है; same-host loopback reverse proxies के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है। Internal same-host callers local direct fallback के रूप में `gateway.auth.password` का उपयोग कर सकते हैं; `gateway.auth.token` trusted-proxy mode के साथ परस्पर अपवर्जित रहता है।
- `gateway.auth.allowTailscale`: जब `true` हो, Tailscale Serve identity headers Control UI/WebSocket auth को संतुष्ट कर सकते हैं (`tailscale whois` के माध्यम से सत्यापित)। HTTP API endpoints उस Tailscale header auth का उपयोग **नहीं** करते; वे इसके बजाय Gateway के सामान्य HTTP auth mode का पालन करते हैं। यह tokenless flow मानता है कि Gateway host विश्वसनीय है। `tailscale.mode = "serve"` होने पर डिफ़ॉल्ट `true`।
- `gateway.auth.rateLimit`: वैकल्पिक failed-auth limiter। प्रति client IP और प्रति auth scope लागू होता है (shared-secret और device-token अलग-अलग ट्रैक होते हैं)। रोके गए प्रयास `429` + `Retry-After` लौटाते हैं।
  - async Tailscale Serve Control UI path पर, समान `{scope, clientIp}` के लिए विफल प्रयास failure write से पहले serialized होते हैं। इसलिए एक ही client से concurrent खराब प्रयास plain mismatches की तरह दोनों के race through होने के बजाय दूसरे request पर limiter trigger कर सकते हैं।
  - `gateway.auth.rateLimit.exemptLoopback` का डिफ़ॉल्ट `true` है; जब आप जानबूझकर localhost traffic को भी rate-limit करना चाहते हों (test setups या strict proxy deployments के लिए), तो `false` सेट करें।
- Browser-origin WS auth प्रयासों को हमेशा loopback exemption disabled के साथ throttled किया जाता है (browser-based localhost brute force के विरुद्ध defense-in-depth)।
- loopback पर, वे browser-origin lockouts normalized `Origin`
  value के अनुसार अलग रखे जाते हैं, इसलिए एक localhost origin से repeated failures स्वतः
  किसी अलग origin को lock out नहीं करते।
- `tailscale.mode`: `serve` (केवल tailnet, loopback bind) या `funnel` (public, auth आवश्यक)।
- `tailscale.serviceName`: Serve mode के लिए वैकल्पिक Tailscale Service name, जैसे
  `svc:openclaw`। सेट होने पर, OpenClaw इसे `tailscale serve
--service` को पास करता है ताकि Control UI को device hostname के बजाय named Service के माध्यम से expose किया जा सके। मान को Tailscale के `svc:<dns-label>`
  Service name format का उपयोग करना होगा; startup derived Service URL रिपोर्ट करता है।
- `tailscale.preserveFunnel`: जब `true` हो और `tailscale.mode = "serve"` हो, OpenClaw
  startup पर Serve को फिर से apply करने से पहले `tailscale funnel status` जांचता है और यदि externally configured Funnel route पहले से Gateway port को cover करता है तो उसे skip कर देता है।
  डिफ़ॉल्ट `false`।
- `controlUi.allowedOrigins`: Gateway WebSocket connects के लिए स्पष्ट browser-origin allowlist। public non-loopback browser origins के लिए आवश्यक। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet UI loads को Host-header fallback सक्षम किए बिना स्वीकार किया जाता है।
- `controlUi.chatMessageMaxWidth`: grouped Control UI chat messages के लिए वैकल्पिक max-width। `960px`, `82%`, `min(1280px, 82%)`, और `calc(100% - 2rem)` जैसे constrained CSS width values स्वीकार करता है।
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: खतरनाक मोड जो उन deployments के लिए Host-header origin fallback सक्षम करता है जो जानबूझकर Host-header origin policy पर निर्भर करते हैं।
- `remote.transport`: `ssh` (डिफ़ॉल्ट) या `direct` (ws/wss)। `direct` के लिए, public hosts हेतु `remote.url` को `wss://` होना चाहिए; plaintext `ws://` केवल loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT hosts के लिए स्वीकार किया जाता है।
- `remote.remotePort`: दूरस्थ SSH host पर Gateway port। डिफ़ॉल्ट `18789`; इसका उपयोग तब करें जब local tunnel port दूरस्थ Gateway port से अलग हो।
- `gateway.remote.token` / `.password` remote-client credential fields हैं। वे स्वयं Gateway auth कॉन्फ़िगर नहीं करते।
- `gateway.push.apns.relay.baseUrl`: relay-backed iOS builds द्वारा Gateway पर registrations publish करने के बाद उपयोग किए जाने वाले बाहरी APNs relay का base HTTPS URL। Public App Store/TestFlight builds hosted OpenClaw relay का उपयोग करते हैं। Custom relay URLs को जानबूझकर अलग iOS build/deployment path से मेल खाना चाहिए जिसका relay URL उसी relay की ओर इंगित करता हो।
- `gateway.push.apns.relay.timeoutMs`: gateway-to-relay send timeout milliseconds में। डिफ़ॉल्ट `10000`।
- Relay-backed registrations एक विशिष्ट Gateway identity को delegated होते हैं। paired iOS app `gateway.identity.get` fetch करता है, उस identity को relay registration में शामिल करता है, और registration-scoped send grant को Gateway को forward करता है। कोई दूसरा Gateway उस stored registration का पुनः उपयोग नहीं कर सकता।
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ऊपर दिए गए relay config के लिए अस्थायी env overrides।
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URLs के लिए केवल development escape hatch। Production relay URLs HTTPS पर ही रहने चाहिए।
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket handshake timeout milliseconds में। डिफ़ॉल्ट: `15000`। सेट होने पर `OPENCLAW_HANDSHAKE_TIMEOUT_MS` प्राथमिकता लेता है। इसे loaded या low-powered hosts पर बढ़ाएं जहां local clients startup warmup के अभी settle हो रहे होने के दौरान connect कर सकते हैं।
- `gateway.channelHealthCheckMinutes`: channel health-monitor interval minutes में। health-monitor restarts को globally disabled करने के लिए `0` सेट करें। डिफ़ॉल्ट: `5`।
- `gateway.channelStaleEventThresholdMinutes`: stale-socket threshold minutes में। इसे `gateway.channelHealthCheckMinutes` से अधिक या उसके बराबर रखें। डिफ़ॉल्ट: `30`।
- `gateway.channelMaxRestartsPerHour`: rolling hour में प्रति channel/account अधिकतम health-monitor restarts। डिफ़ॉल्ट: `10`।
- `channels.<provider>.healthMonitor.enabled`: global monitor enabled रखते हुए health-monitor restarts के लिए per-channel opt-out।
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account channels के लिए per-account override। सेट होने पर, यह channel-level override पर प्राथमिकता लेता है।
- Local Gateway call paths `gateway.remote.*` को fallback के रूप में केवल तब उपयोग कर सकते हैं जब `gateway.auth.*` unset हो।
- यदि `gateway.auth.token` / `gateway.auth.password` स्पष्ट रूप से SecretRef के माध्यम से कॉन्फ़िगर है और unresolved है, तो resolution fail closed होता है (कोई remote fallback masking नहीं)।
- `trustedProxies`: reverse proxy IPs जो TLS terminate करते हैं या forwarded-client headers inject करते हैं। केवल उन proxies को सूचीबद्ध करें जिन्हें आप नियंत्रित करते हैं। Loopback entries same-host proxy/local-detection setups (उदाहरण के लिए Tailscale Serve या local reverse proxy) के लिए अभी भी valid हैं, लेकिन वे loopback requests को `gateway.auth.mode: "trusted-proxy"` के लिए eligible **नहीं** बनाते।
- `allowRealIpFallback`: जब `true` हो, यदि `X-Forwarded-For` missing हो तो Gateway `X-Real-IP` स्वीकार करता है। fail-closed behavior के लिए डिफ़ॉल्ट `false`।
- `gateway.nodes.pairing.autoApproveCidrs`: बिना requested scopes के first-time node device pairing को auto-approve करने के लिए वैकल्पिक CIDR/IP allowlist। unset होने पर यह disabled रहता है। यह operator/browser/Control UI/WebChat pairing को auto-approve नहीं करता, और role, scope, metadata, या public-key upgrades को auto-approve नहीं करता।
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairing और platform allowlist evaluation के बाद declared node commands के लिए global allow/deny shaping। `camera.snap`, `camera.clip`, और `screen.record` जैसे खतरनाक node commands को opt into करने के लिए `allowCommands` का उपयोग करें; `denyCommands` किसी command को हटा देता है, भले ही platform default या explicit allow अन्यथा उसे शामिल करता हो। node द्वारा अपनी declared command list बदलने के बाद, उस device pairing को reject और re-approve करें ताकि Gateway updated command snapshot store करे।
- `gateway.tools.deny`: HTTP `POST /tools/invoke` के लिए blocked अतिरिक्त tool names (default deny list को extend करता है)।
- `gateway.tools.allow`: owner/admin callers के लिए default HTTP deny list से tool names हटाएं। यह identity-bearing `operator.write`
  callers को owner/admin access में upgrade नहीं करता; `cron`, `gateway`, और `nodes` allowlisted होने पर भी
  non-owner callers के लिए unavailable रहते हैं।

</Accordion>

### OpenAI-compatible endpoints

- Admin HTTP RPC: `admin-http-rpc` Plugin के रूप में डिफ़ॉल्ट रूप से off। `POST /api/v1/admin/rpc` register करने के लिए Plugin सक्षम करें। [Admin HTTP RPC](/hi/plugins/admin-http-rpc) देखें।
- Chat Completions: डिफ़ॉल्ट रूप से disabled। `gateway.http.endpoints.chatCompletions.enabled: true` से सक्षम करें।
- Responses API: `gateway.http.endpoints.responses.enabled`।
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    खाली allowlists को unset माना जाता है; URL fetching disable करने के लिए `gateway.http.endpoints.responses.files.allowUrl=false`
    और/या `gateway.http.endpoints.responses.images.allowUrl=false` का उपयोग करें।
- वैकल्पिक response hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (केवल उन HTTPS origins के लिए सेट करें जिन्हें आप नियंत्रित करते हैं; [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth#tls-termination-and-hsts) देखें)

### Multi-instance isolation

एक host पर unique ports और state dirs के साथ कई Gateways चलाएं:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

सुविधा flags: `--dev` (`~/.openclaw-dev` + port `19001` का उपयोग करता है), `--profile <name>` (`~/.openclaw-<name>` का उपयोग करता है)।

[Multiple Gateways](/hi/gateway/multiple-gateways) देखें।

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

- `enabled`: Gateway listener (HTTPS/WSS) पर TLS termination सक्षम करता है (डिफ़ॉल्ट: `false`)।
- `autoGenerate`: explicit files कॉन्फ़िगर न होने पर local self-signed cert/key pair auto-generate करता है; केवल local/dev उपयोग के लिए।
- `certPath`: TLS certificate file का filesystem path।
- `keyPath`: TLS private key file का filesystem path; permission-restricted रखें।
- `caPath`: client verification या custom trust chains के लिए वैकल्पिक CA bundle path।

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

- `mode`: नियंत्रित करता है कि रनटाइम पर कॉन्फ़िगरेशन संपादन कैसे लागू किए जाते हैं।
  - `"off"`: लाइव संपादनों को अनदेखा करें; बदलावों के लिए स्पष्ट पुनरारंभ आवश्यक है।
  - `"restart"`: कॉन्फ़िगरेशन बदलने पर हमेशा Gateway प्रक्रिया को पुनरारंभ करें।
  - `"hot"`: पुनरारंभ किए बिना इन-प्रोसेस बदलाव लागू करें।
  - `"hybrid"` (डिफ़ॉल्ट): पहले हॉट रीलोड आज़माएँ; आवश्यकता होने पर पुनरारंभ पर वापस जाएँ।
- `debounceMs`: कॉन्फ़िगरेशन बदलाव लागू होने से पहले ms में डिबाउंस विंडो (गैर-ऋणात्मक पूर्णांक)।
- `deferralTimeoutMs`: पुनरारंभ या चैनल हॉट रीलोड को बाध्य करने से पहले चल रहे ऑपरेशनों की प्रतीक्षा करने के लिए ms में वैकल्पिक अधिकतम समय। डिफ़ॉल्ट सीमित प्रतीक्षा (`300000`) का उपयोग करने के लिए इसे छोड़ दें; अनिश्चितकाल तक प्रतीक्षा करने और समय-समय पर अभी भी लंबित चेतावनियाँ लॉग करने के लिए `0` सेट करें।

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

- `hooks.enabled=true` के लिए गैर-रिक्त `hooks.token` आवश्यक है।
- `hooks.token` सक्रिय Gateway साझा-सीक्रेट प्रमाणीकरण (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) से अलग होना चाहिए; पुन: उपयोग का पता लगने पर स्टार्टअप एक गैर-घातक सुरक्षा चेतावनी लॉग करता है।
- `openclaw security audit` हुक/Gateway प्रमाणीकरण पुन: उपयोग को गंभीर निष्कर्ष के रूप में चिह्नित करता है, जिसमें केवल ऑडिट समय पर प्रदान किया गया Gateway पासवर्ड प्रमाणीकरण (`--auth password --password <password>`) भी शामिल है। स्थायी रूप से सहेजे गए पुन: उपयोग किए गए `hooks.token` को रोटेट करने के लिए `openclaw doctor --fix` चलाएँ, फिर नए हुक टोकन का उपयोग करने के लिए बाहरी हुक प्रेषकों को अपडेट करें।
- `hooks.path` `/` नहीं हो सकता; `/hooks` जैसा समर्पित उप-पथ उपयोग करें।
- यदि `hooks.allowRequestSessionKey=true` है, तो `hooks.allowedSessionKeyPrefixes` को सीमित करें (उदाहरण के लिए `["hook:"]`)।
- यदि कोई मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` का उपयोग करता है, तो `hooks.allowedSessionKeyPrefixes` और `hooks.allowRequestSessionKey=true` सेट करें। स्थैतिक मैपिंग कुंजियों के लिए उस ऑप्ट-इन की आवश्यकता नहीं होती।

**एंडपॉइंट्स:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - अनुरोध पेलोड से `sessionKey` केवल तभी स्वीकार किया जाता है जब `hooks.allowRequestSessionKey=true` हो (डिफ़ॉल्ट: `false`)।
- `POST /hooks/<name>` → `hooks.mappings` के माध्यम से हल किया गया
  - टेम्पलेट-रेंडर किए गए मैपिंग `sessionKey` मान बाहरी रूप से प्रदान किए गए माने जाते हैं और उन्हें भी `hooks.allowRequestSessionKey=true` की आवश्यकता होती है।

<Accordion title="मैपिंग विवरण">

- `match.path` `/hooks` के बाद उप-पथ से मेल खाता है (जैसे `/hooks/gmail` → `gmail`)।
- `match.source` सामान्य पथों के लिए पेलोड फ़ील्ड से मेल खाता है।
- `{{messages[0].subject}}` जैसे टेम्पलेट पेलोड से पढ़ते हैं।
- `transform` हुक कार्रवाई लौटाने वाले JS/TS मॉड्यूल की ओर संकेत कर सकता है।
  - `transform.module` एक रिलेटिव पथ होना चाहिए और `hooks.transformsDir` के भीतर ही रहता है (एब्सोल्यूट पथ और ट्रैवर्सल अस्वीकार किए जाते हैं)।
  - `hooks.transformsDir` को `~/.openclaw/hooks/transforms` के अंतर्गत रखें; वर्कस्पेस skill डायरेक्टरी अस्वीकार की जाती हैं। यदि `openclaw doctor` इस पथ को अमान्य रिपोर्ट करता है, तो ट्रांसफ़ॉर्म मॉड्यूल को हुक ट्रांसफ़ॉर्म डायरेक्टरी में ले जाएँ या `hooks.transformsDir` हटाएँ।
- `agentId` किसी विशिष्ट एजेंट तक रूट करता है; अज्ञात ID डिफ़ॉल्ट एजेंट पर वापस जाते हैं।
- `allowedAgentIds`: प्रभावी एजेंट रूटिंग को सीमित करता है, जिसमें `agentId` छोड़े जाने पर डिफ़ॉल्ट-एजेंट पथ भी शामिल है (`*` या छोड़ा गया = सभी को अनुमति दें, `[]` = सभी को अस्वीकार करें)।
- `defaultSessionKey`: स्पष्ट `sessionKey` के बिना हुक एजेंट रन के लिए वैकल्पिक स्थिर सेशन कुंजी।
- `allowRequestSessionKey`: `/hooks/agent` कॉलर और टेम्पलेट-चालित मैपिंग सेशन कुंजियों को `sessionKey` सेट करने दें (डिफ़ॉल्ट: `false`)।
- `allowedSessionKeyPrefixes`: स्पष्ट `sessionKey` मानों (अनुरोध + मैपिंग) के लिए वैकल्पिक प्रीफ़िक्स अनुमति-सूची, जैसे `["hook:"]`। जब कोई मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` का उपयोग करता है तो यह आवश्यक हो जाता है।
- `deliver: true` अंतिम उत्तर को किसी चैनल पर भेजता है; `channel` डिफ़ॉल्ट रूप से `last` होता है।
- `model` इस हुक रन के लिए LLM को ओवरराइड करता है (यदि मॉडल कैटलॉग सेट है तो इसकी अनुमति होनी चाहिए)।

</Accordion>

### Gmail इंटीग्रेशन

- बिल्ट-इन Gmail प्रीसेट `sessionKey: "hook:gmail:{{messages[0].id}}"` का उपयोग करता है।
- यदि आप उस प्रति-संदेश रूटिंग को रखते हैं, तो `hooks.allowRequestSessionKey: true` सेट करें और `hooks.allowedSessionKeyPrefixes` को Gmail नेमस्पेस से मिलाने के लिए सीमित करें, उदाहरण के लिए `["hook:", "hook:gmail:"]`।
- यदि आपको `hooks.allowRequestSessionKey: false` चाहिए, तो टेम्पलेटेड डिफ़ॉल्ट के बजाय स्थिर `sessionKey` से प्रीसेट को ओवरराइड करें।

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

- Gateway कॉन्फ़िगर होने पर बूट पर `gog gmail watch serve` को स्वतः शुरू करता है। अक्षम करने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।
- Gateway के साथ अलग से `gog gmail watch serve` न चलाएँ।

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
- केवल लोकल: `gateway.bind: "loopback"` (डिफ़ॉल्ट) रखें।
- नॉन-लूपबैक बाइंड्स: Canvas रूट्स को अन्य Gateway HTTP सतहों की तरह Gateway प्रमाणीकरण (टोकन/पासवर्ड/विश्वसनीय-प्रॉक्सी) की आवश्यकता होती है।
- Node WebViews आमतौर पर प्रमाणीकरण हेडर नहीं भेजते; नोड पेयर और कनेक्ट होने के बाद, Gateway Canvas/A2UI एक्सेस के लिए नोड-स्कोप्ड क्षमता URL विज्ञापित करता है।
- क्षमता URL सक्रिय नोड WS सेशन से बंधे होते हैं और जल्दी समाप्त हो जाते हैं। IP-आधारित फ़ॉलबैक उपयोग नहीं किया जाता।
- सर्व किए गए HTML में लाइव-रीलोड क्लाइंट इंजेक्ट करता है।
- खाली होने पर स्टार्टर `index.html` स्वतः बनाता है।
- A2UI को `/__openclaw__/a2ui/` पर भी सर्व करता है।
- बदलावों के लिए Gateway पुनरारंभ आवश्यक है।
- बड़ी डायरेक्टरी या `EMFILE` त्रुटियों के लिए लाइव रीलोड अक्षम करें।

---

## डिस्कवरी

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

- `minimal` (डिफ़ॉल्ट जब बंडल किया गया `bonjour` Plugin सक्षम हो): TXT रिकॉर्ड्स से `cliPath` + `sshPort` हटाएँ।
- `full`: `cliPath` + `sshPort` शामिल करें; LAN मल्टीकास्ट विज्ञापन के लिए अभी भी बंडल किए गए `bonjour` Plugin का सक्षम होना आवश्यक है।
- `off`: Plugin सक्षम स्थिति बदले बिना LAN मल्टीकास्ट विज्ञापन को दबाएँ।
- बंडल किया गया `bonjour` Plugin macOS होस्ट्स पर स्वतः शुरू होता है और Linux, Windows, तथा कंटेनराइज़्ड Gateway डिप्लॉयमेंट्स पर ऑप्ट-इन है।
- होस्टनेम डिफ़ॉल्ट रूप से सिस्टम होस्टनेम होता है जब वह मान्य DNS लेबल हो, अन्यथा `openclaw` पर फ़ॉलबैक होता है। `OPENCLAW_MDNS_HOSTNAME` से ओवरराइड करें।

### वाइड-एरिया (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` के अंतर्गत एक यूनिकास्ट DNS-SD ज़ोन लिखता है। क्रॉस-नेटवर्क डिस्कवरी के लिए, इसे DNS सर्वर (CoreDNS अनुशंसित) + Tailscale स्प्लिट DNS के साथ जोड़ें।

सेटअप: `openclaw dns setup --apply`.

---

## पर्यावरण

### `env` (इनलाइन पर्यावरण वेरिएबल)

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

- इनलाइन पर्यावरण वेरिएबल केवल तब लागू होते हैं जब प्रोसेस env में वह कुंजी मौजूद न हो।
- `.env` फ़ाइलें: CWD `.env` + `~/.openclaw/.env` (इनमें से कोई भी मौजूदा वेरिएबल को ओवरराइड नहीं करता)।
- `shellEnv`: आपके लॉगिन शेल प्रोफ़ाइल से अनुपस्थित अपेक्षित कुंजियाँ आयात करता है।
- पूरी प्रीसिडेंस के लिए [पर्यावरण](/hi/help/environment) देखें।

### पर्यावरण वेरिएबल प्रतिस्थापन

किसी भी config स्ट्रिंग में `${VAR_NAME}` के साथ पर्यावरण वेरिएबल संदर्भित करें:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- केवल अपरकेस नाम मेल खाते हैं: `[A-Z_][A-Z0-9_]*`.
- अनुपस्थित/खाली वेरिएबल config लोड पर त्रुटि देते हैं।
- शाब्दिक `${VAR}` के लिए `$${VAR}` से एस्केप करें।
- `$include` के साथ काम करता है।

---

## सीक्रेट्स

Secret refs additive हैं: plaintext मान अब भी काम करते हैं।

### `SecretRef`

एक ऑब्जेक्ट आकार का उपयोग करें:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

सत्यापन:

- `provider` पैटर्न: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id पैटर्न: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: एब्सोल्यूट JSON pointer (उदाहरण के लिए `"/providers/openai/apiKey"`)
- `source: "exec"` id पैटर्न: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS-शैली `secret#json_key` सेलेक्टर का समर्थन करता है)
- `source: "exec"` ids में `.` या `..` स्लैश-सीमांकित path segments नहीं होने चाहिए (उदाहरण के लिए `a/../b` अस्वीकार किया जाता है)

### समर्थित क्रेडेंशियल सतह

- कैनॉनिकल मैट्रिक्स: [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)
- `secrets apply` समर्थित `openclaw.json` क्रेडेंशियल पाथ को लक्ष्य करता है।
- `auth-profiles.json` refs runtime resolution और audit coverage में शामिल हैं।

### सीक्रेट providers config

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

- `file` provider `mode: "json"` और `mode: "singleValue"` का समर्थन करता है (`singleValue` मोड में `id` को `"value"` होना चाहिए)।
- Windows ACL सत्यापन उपलब्ध न होने पर file और exec provider paths बंद स्थिति में विफल होते हैं। `allowInsecurePath: true` केवल उन विश्वसनीय paths के लिए सेट करें जिन्हें सत्यापित नहीं किया जा सकता।
- `exec` provider को एब्सोल्यूट `command` path चाहिए और stdin/stdout पर protocol payloads का उपयोग करता है।
- डिफ़ॉल्ट रूप से, symlink command paths अस्वीकार किए जाते हैं। resolved target path को validate करते हुए symlink paths की अनुमति देने के लिए `allowSymlinkCommand: true` सेट करें।
- यदि `trustedDirs` configured है, तो trusted-dir check resolved target path पर लागू होता है।
- `exec` child environment डिफ़ॉल्ट रूप से न्यूनतम होता है; आवश्यक वेरिएबल को `passEnv` के साथ स्पष्ट रूप से पास करें।
- Secret refs activation time पर in-memory snapshot में resolve होते हैं, फिर request paths केवल snapshot पढ़ते हैं।
- Active-surface filtering activation के दौरान लागू होती है: enabled surfaces पर unresolved refs startup/reload को विफल करते हैं, जबकि inactive surfaces diagnostics के साथ skip हो जाती हैं।

---

## Auth storage

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

- प्रति-एजेंट प्रोफाइल `<agentDir>/auth-profiles.json` पर संग्रहित होते हैं।
- `auth-profiles.json` स्थिर क्रेडेंशियल मोड के लिए वैल्यू-स्तर refs (`api_key` के लिए `keyRef`, `token` के लिए `tokenRef`) का समर्थन करता है।
- पुराने फ्लैट `auth-profiles.json` मैप, जैसे `{ "provider": { "apiKey": "..." } }`, runtime फॉर्मेट नहीं हैं; `openclaw doctor --fix` उन्हें `.legacy-flat.*.bak` बैकअप के साथ कैनॉनिकल `provider:default` API-key प्रोफाइल में दोबारा लिखता है।
- OAuth-मोड प्रोफाइल (`auth.profiles.<id>.mode = "oauth"`) SecretRef-समर्थित auth-profile क्रेडेंशियल का समर्थन नहीं करते।
- स्थिर runtime क्रेडेंशियल इन-मेमरी resolved snapshots से आते हैं; पुराने स्थिर `auth.json` एंट्री मिलने पर साफ कर दिए जाते हैं।
- पुराना OAuth `~/.openclaw/credentials/oauth.json` से इम्पोर्ट करता है।
- [OAuth](/hi/concepts/oauth) देखें।
- Secrets runtime व्यवहार और `audit/configure/apply` टूलिंग: [सीक्रेट्स प्रबंधन](/hi/gateway/secrets)।

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
  बिलिंग/अपर्याप्त-क्रेडिट त्रुटियों के कारण विफल होता है, तो घंटों में आधार backoff (डिफॉल्ट: `5`)। स्पष्ट बिलिंग टेक्स्ट
  अब भी यहाँ आ सकता है, यहाँ तक कि `401`/`403` responses पर भी, लेकिन provider-विशिष्ट टेक्स्ट
  matchers उन्हीं provider तक सीमित रहते हैं जिनके वे स्वामी हैं (उदाहरण के लिए OpenRouter
  `Key limit exceeded`)। Retryable HTTP `402` उपयोग-window या
  organization/workspace spend-limit संदेश इसके बजाय `rate_limit` path
  में रहते हैं।
- `billingBackoffHoursByProvider`: बिलिंग backoff घंटों के लिए वैकल्पिक प्रति-provider overrides।
- `billingMaxHours`: बिलिंग backoff exponential growth के लिए घंटों में सीमा (डिफॉल्ट: `24`)।
- `authPermanentBackoffMinutes`: उच्च-विश्वसनीयता `auth_permanent` विफलताओं के लिए मिनटों में आधार backoff (डिफॉल्ट: `10`)।
- `authPermanentMaxMinutes`: `auth_permanent` backoff growth के लिए मिनटों में सीमा (डिफॉल्ट: `60`)।
- `failureWindowHours`: backoff counters के लिए उपयोग होने वाली rolling window, घंटों में (डिफॉल्ट: `24`)।
- `overloadedProfileRotations`: model fallback पर स्विच करने से पहले overloaded त्रुटियों के लिए अधिकतम same-provider auth-profile rotations (डिफॉल्ट: `1`)। Provider-busy आकार, जैसे `ModelNotReadyException`, यहाँ आते हैं।
- `overloadedBackoffMs`: overloaded provider/profile rotation को retry करने से पहले निश्चित देरी (डिफॉल्ट: `0`)।
- `rateLimitedProfileRotations`: model fallback पर स्विच करने से पहले rate-limit त्रुटियों के लिए अधिकतम same-provider auth-profile rotations (डिफॉल्ट: `1`)। उस rate-limit bucket में provider-shaped टेक्स्ट शामिल है, जैसे `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, और `resource exhausted`।

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

- डिफॉल्ट log file: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`।
- स्थिर path के लिए `logging.file` सेट करें।
- `--verbose` होने पर `consoleLevel` बढ़कर `debug` हो जाता है।
- `maxFileBytes`: rotation से पहले सक्रिय log file का अधिकतम आकार bytes में (positive integer; डिफॉल्ट: `104857600` = 100 MB)। OpenClaw सक्रिय file के साथ अधिकतम पाँच numbered archives रखता है।
- `redactSensitive` / `redactPatterns`: console output, file logs, OTLP log records, और persisted session transcript text के लिए best-effort masking। `redactSensitive: "off"` केवल इस सामान्य log/transcript नीति को अक्षम करता है; UI/tool/diagnostic safety surfaces अब भी emission से पहले secrets को redact करते हैं।

---

## निदान

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

- `enabled`: instrumentation output के लिए मुख्य toggle (डिफॉल्ट: `true`)।
- `flags`: targeted log output सक्षम करने वाली flag strings की array (`"telegram.*"` या `"*"` जैसे wildcards का समर्थन करती है)।
- `stuckSessionWarnMs`: long-running processing sessions को `session.long_running`, `session.stalled`, या `session.stuck` के रूप में वर्गीकृत करने के लिए ms में no-progress age threshold। Reply, tool, status, block, और ACP progress timer को reset करते हैं; दोहराए गए `session.stuck` diagnostics unchanged रहने पर back off करते हैं।
- `stuckSessionAbortMs`: recovery के लिए eligible stalled active work को abort-drain करने से पहले ms में no-progress age threshold। unset होने पर, OpenClaw कम से कम 5 मिनट और 3x `stuckSessionWarnMs` की अधिक सुरक्षित extended embedded-run window का उपयोग करता है।
- `memoryPressureSnapshot`: memory pressure के `critical` पर पहुँचने पर redacted pre-OOM stability snapshot कैप्चर करता है (डिफॉल्ट: `false`)। सामान्य memory pressure events रखते हुए stability bundle file scan/write जोड़ने के लिए इसे `true` पर सेट करें।
- `otel.enabled`: OpenTelemetry export pipeline सक्षम करता है (डिफॉल्ट: `false`)। पूरी configuration, signal catalog, और privacy model के लिए [OpenTelemetry export](/hi/gateway/opentelemetry) देखें।
- `otel.endpoint`: OTel export के लिए collector URL।
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: वैकल्पिक signal-specific OTLP endpoints। सेट होने पर, वे केवल उस signal के लिए `otel.endpoint` को override करते हैं।
- `otel.protocol`: `"http/protobuf"` (डिफॉल्ट) या `"grpc"`।
- `otel.headers`: OTel export requests के साथ भेजे गए अतिरिक्त HTTP/gRPC metadata headers।
- `otel.serviceName`: resource attributes के लिए service name।
- `otel.traces` / `otel.metrics` / `otel.logs`: trace, metrics, या log export सक्षम करें।
- `otel.logsExporter`: log export sink: `"otlp"` (डिफॉल्ट), प्रति stdout line एक JSON object के लिए `"stdout"`, या `"both"`।
- `otel.sampleRate`: trace sampling rate `0`-`1`।
- `otel.flushIntervalMs`: periodic telemetry flush interval, ms में।
- `otel.captureContent`: OTEL span attributes के लिए opt-in raw content capture। डिफॉल्ट रूप से off। Boolean `true` non-system message/tool content कैप्चर करता है; object form आपको `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, और `toolDefinitions` को स्पष्ट रूप से सक्षम करने देता है।
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: latest experimental GenAI inference span shape के लिए environment toggle, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। डिफॉल्ट रूप से spans compatibility के लिए `openclaw.model.call` और `gen_ai.system` रखते हैं; GenAI metrics bounded semantic attributes का उपयोग करते हैं।
- `OPENCLAW_OTEL_PRELOADED=1`: उन hosts के लिए environment toggle जिन्होंने पहले से global OpenTelemetry SDK register किया है। फिर OpenClaw diagnostic listeners active रखते हुए plugin-owned SDK startup/shutdown छोड़ देता है।
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, और `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: matching config key unset होने पर उपयोग होने वाले signal-specific endpoint env vars।
- `cacheTrace.enabled`: embedded runs के लिए cache trace snapshots log करें (डिफॉल्ट: `false`)।
- `cacheTrace.filePath`: cache trace JSONL के लिए output path (डिफॉल्ट: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)।
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace output में क्या शामिल है, इसे नियंत्रित करें (सभी डिफॉल्ट: `true`)।

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

- `channel`: npm/git installs के लिए release channel - `"stable"`, `"beta"`, या `"dev"`।
- `checkOnStart`: gateway शुरू होने पर npm updates की जाँच करें (डिफॉल्ट: `true`)।
- `auto.enabled`: package installs के लिए background auto-update सक्षम करें (डिफॉल्ट: `false`)।
- `auto.stableDelayHours`: stable-channel auto-apply से पहले घंटों में न्यूनतम देरी (डिफॉल्ट: `6`; अधिकतम: `168`)।
- `auto.stableJitterHours`: घंटों में अतिरिक्त stable-channel rollout spread window (डिफॉल्ट: `12`; अधिकतम: `168`)।
- `auto.betaCheckIntervalHours`: beta-channel checks कितनी बार चलें, घंटों में (डिफॉल्ट: `1`; अधिकतम: `24`)।

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

- `enabled`: global ACP feature gate (डिफॉल्ट: `true`; ACP dispatch और spawn affordances छिपाने के लिए `false` सेट करें)।
- `dispatch.enabled`: ACP session turn dispatch के लिए स्वतंत्र gate (डिफॉल्ट: `true`)। ACP commands उपलब्ध रखते हुए execution block करने के लिए `false` सेट करें।
- `backend`: डिफॉल्ट ACP runtime backend id (किसी registered ACP runtime plugin से match होना चाहिए)।
  पहले backend plugin install करें, और यदि `plugins.allow` सेट है, तो backend plugin id (उदाहरण के लिए `acpx`) शामिल करें, वरना ACP backend load नहीं होगा।
- `defaultAgent`: जब spawns कोई explicit target निर्दिष्ट नहीं करते, तब fallback ACP target agent id।
- `allowedAgents`: ACP runtime sessions के लिए अनुमति प्राप्त agent ids की allowlist; empty का अर्थ है कोई अतिरिक्त restriction नहीं।
- `maxConcurrentSessions`: अधिकतम concurrently active ACP sessions।
- `stream.coalesceIdleMs`: streamed text के लिए idle flush window, ms में।
- `stream.maxChunkChars`: streamed block projection split करने से पहले अधिकतम chunk size।
- `stream.repeatSuppression`: प्रति turn repeated status/tool lines suppress करें (डिफॉल्ट: `true`)।
- `stream.deliveryMode`: `"live"` incremental stream करता है; `"final_only"` turn terminal events तक buffer करता है।
- `stream.hiddenBoundarySeparator`: hidden tool events के बाद visible text से पहले separator (डिफॉल्ट: `"paragraph"`)।
- `stream.maxOutputChars`: प्रति ACP turn projected assistant output characters की अधिकतम संख्या।
- `stream.maxSessionUpdateChars`: projected ACP status/update lines के लिए अधिकतम characters।
- `stream.tagVisibility`: streamed events के लिए tag names से boolean visibility overrides का record।
- `runtime.ttlMinutes`: eligible cleanup से पहले ACP session workers के लिए idle TTL, मिनटों में।
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
  - `"default"`: निश्चित तटस्थ टैगलाइन (`All your chats, one OpenClaw.`)।
  - `"off"`: कोई टैगलाइन टेक्स्ट नहीं (बैनर शीर्षक/संस्करण फिर भी दिखता है)।
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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## पहचान

[एजेंट डिफ़ॉल्ट](/hi/gateway/config-agents#agent-defaults) के अंतर्गत `agents.list` पहचान फ़ील्ड देखें।

---

## ब्रिज (लेगेसी, हटाया गया)

मौजूदा बिल्ड में अब TCP ब्रिज शामिल नहीं है। Node Gateway WebSocket पर कनेक्ट होते हैं। `bridge.*` कुंजियाँ अब config schema का हिस्सा नहीं हैं (हटाए जाने तक सत्यापन विफल होता है; `openclaw doctor --fix` अज्ञात कुंजियाँ हटा सकता है)।

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: पूर्ण हो चुके अलग-थलग Cron रन सेशन को `sessions.json` से हटाने से पहले कितनी देर रखना है। संग्रहीत हटाए गए Cron ट्रांस्क्रिप्ट की सफ़ाई भी नियंत्रित करता है। डिफ़ॉल्ट: `24h`; अक्षम करने के लिए `false` सेट करें।
- `runLog.maxBytes`: पुराने फ़ाइल-आधारित Cron रन लॉग के साथ संगतता के लिए स्वीकार किया जाता है। डिफ़ॉल्ट: `2_000_000` बाइट।
- `runLog.keepLines`: हर जॉब के लिए रखी जाने वाली नवीनतम SQLite रन-इतिहास पंक्तियाँ। डिफ़ॉल्ट: `2000`।
- `webhookToken`: Cron Webhook POST डिलीवरी (`delivery.mode = "webhook"`) के लिए उपयोग किया जाने वाला bearer token; छोड़े जाने पर कोई auth header नहीं भेजा जाता।
- `webhook`: deprecated लेगेसी फ़ॉलबैक Webhook URL (http/https), जिसका उपयोग `openclaw doctor --fix` उन संग्रहित जॉब को माइग्रेट करने के लिए करता है जिनमें अब भी `notify: true` है; runtime delivery हर-जॉब `delivery.mode="webhook"` और `delivery.to`, या announce delivery बनाए रखते समय `delivery.completionDestination` का उपयोग करती है।

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

- `maxAttempts`: क्षणिक त्रुटियों पर Cron जॉब के लिए अधिकतम retry (डिफ़ॉल्ट: `3`; सीमा: `0`-`10`)।
- `backoffMs`: हर retry प्रयास के लिए ms में backoff delay की array (डिफ़ॉल्ट: `[30000, 60000, 300000]`; 1-10 entries)।
- `retryOn`: retry ट्रिगर करने वाली त्रुटि प्रकार - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`। सभी क्षणिक प्रकारों पर retry करने के लिए इसे छोड़ दें।

One-shot जॉब retry प्रयास समाप्त होने तक enabled रहते हैं, फिर अंतिम त्रुटि स्थिति रखते हुए disable हो जाते हैं। Recurring जॉब अपने अगले scheduled slot से पहले backoff के बाद दोबारा चलने के लिए वही transient retry policy उपयोग करते हैं; permanent errors या exhausted transient retries error backoff के साथ सामान्य recurring schedule पर लौट जाते हैं।

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

- `enabled`: Cron जॉब के लिए failure alerts सक्षम करें (डिफ़ॉल्ट: `false`)।
- `after`: alert चलने से पहले लगातार failures (धनात्मक पूर्णांक, न्यूनतम: `1`)।
- `cooldownMs`: उसी जॉब के लिए दोहराए गए alerts के बीच न्यूनतम milliseconds (गैर-ऋणात्मक पूर्णांक)।
- `includeSkipped`: alert threshold में लगातार skipped runs गिनें (डिफ़ॉल्ट: `false`)। Skipped runs अलग से track होते हैं और execution-error backoff को प्रभावित नहीं करते।
- `mode`: delivery mode - `"announce"` channel message के ज़रिए भेजता है; `"webhook"` configured Webhook पर post करता है।
- `accountId`: alert delivery scope करने के लिए optional account या channel id।

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

- सभी जॉब में Cron failure notifications के लिए डिफ़ॉल्ट destination।
- `mode`: `"announce"` या `"webhook"`; पर्याप्त target data मौजूद होने पर default `"announce"` होता है।
- `channel`: announce delivery के लिए channel override। `"last"` अंतिम ज्ञात delivery channel का पुनः उपयोग करता है।
- `to`: explicit announce target या Webhook URL। Webhook mode के लिए आवश्यक।
- `accountId`: delivery के लिए optional account override।
- हर-जॉब `delivery.failureDestination` इस global default को override करता है।
- जब न global और न हर-जॉब failure destination सेट हो, तो जो जॉब पहले से `announce` के ज़रिए deliver करते हैं वे failure पर उसी primary announce target पर fall back करते हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` जॉब के लिए समर्थित है, जब तक कि जॉब का primary `delivery.mode` `"webhook"` न हो।

[Cron जॉब](/hi/automation/cron-jobs) देखें। Isolated Cron executions को [background tasks](/hi/automation/tasks) के रूप में track किया जाता है।

---

## मीडिया मॉडल टेम्पलेट variables

`tools.media.models[].args` में विस्तारित template placeholders:

| Variable           | विवरण                                            |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | पूरा inbound message body                         |
| `{{RawBody}}`      | Raw body (history/sender wrappers नहीं)           |
| `{{BodyStripped}}` | group mentions हटाया हुआ body                    |
| `{{From}}`         | Sender identifier                                 |
| `{{To}}`           | Destination identifier                            |
| `{{MessageSid}}`   | Channel message id                                |
| `{{SessionId}}`    | मौजूदा session UUID                               |
| `{{IsNewSession}}` | नया session बनने पर `"true"`                     |
| `{{MediaUrl}}`     | Inbound media pseudo-URL                          |
| `{{MediaPath}}`    | Local media path                                  |
| `{{MediaType}}`    | Media type (image/audio/document/…)               |
| `{{Transcript}}`   | Audio transcript                                  |
| `{{Prompt}}`       | CLI entries के लिए resolved media prompt          |
| `{{MaxChars}}`     | CLI entries के लिए resolved max output chars      |
| `{{ChatType}}`     | `"direct"` या `"group"`                           |
| `{{GroupSubject}}` | Group subject (best effort)                       |
| `{{GroupMembers}}` | Group members preview (best effort)               |
| `{{SenderName}}`   | Sender display name (best effort)                 |
| `{{SenderE164}}`   | Sender phone number (best effort)                 |
| `{{Provider}}`     | Provider hint (whatsapp, telegram, discord, आदि)  |

---

## Config includes (`$include`)

Config को कई फ़ाइलों में बाँटें:

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

**Merge behavior:**

- एकल फ़ाइल: containing object को replace करती है।
- फ़ाइलों की array: क्रम में deep-merge होती है (बाद वाली पहले वाली को override करती है)।
- Sibling keys: includes के बाद merge होती हैं (included values को override करती हैं)।
- Nested includes: 10 स्तर गहराई तक।
- Paths: including file के सापेक्ष resolve होते हैं, लेकिन top-level config directory (`openclaw.json` का `dirname`) के अंदर ही रहने चाहिए। Absolute/`../` forms केवल तब allowed हैं जब वे फिर भी उस boundary के अंदर resolve हों। Paths में null bytes नहीं होने चाहिए और resolution से पहले और बाद में 4096 characters से strictly छोटे होने चाहिए।
- OpenClaw-owned writes जो single-file include से backed केवल एक top-level section बदलते हैं, उसी included file में write through करते हैं। उदाहरण के लिए, `plugins install`, `plugins: { $include: "./plugins.json5" }` को `plugins.json5` में update करता है और `openclaw.json` को intact छोड़ता है।
- Root includes, include arrays, और sibling overrides वाले includes OpenClaw-owned writes के लिए read-only हैं; वे writes config flatten करने के बजाय fail closed होते हैं।
- Errors: missing files, parse errors, circular includes, invalid path format, और excessive length के लिए स्पष्ट messages।

---

_संबंधित: [Configuration](/hi/gateway/configuration) · [Configuration Examples](/hi/gateway/configuration-examples) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [Configuration](/hi/gateway/configuration)
- [Configuration examples](/hi/gateway/configuration-examples)
