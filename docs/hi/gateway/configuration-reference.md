---
read_when:
    - आपको सटीक फ़ील्ड-स्तरीय कॉन्फ़िगरेशन अर्थ या डिफ़ॉल्ट चाहिए
    - आप चैनल, मॉडल, Gateway, या टूल कॉन्फ़िग ब्लॉकों को सत्यापित कर रहे हैं
summary: मुख्य OpenClaw कुंजियों, डिफ़ॉल्ट्स और समर्पित उप-प्रणाली संदर्भों के लिंक के लिए Gateway कॉन्फ़िग संदर्भ
title: कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-07-03T23:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core config संदर्भ `~/.openclaw/openclaw.json` के लिए। कार्य-उन्मुख अवलोकन के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

मुख्य OpenClaw config सतहों को कवर करता है और जब किसी subsystem का अपना गहरा संदर्भ होता है तो उससे लिंक करता है। चैनल- और plugin-स्वामित्व वाले command catalogs और deep memory/QMD knobs इस पेज के बजाय अपने अलग पेजों पर रहते हैं।

कोड सत्य:

- `openclaw config schema` validation और Control UI के लिए उपयोग किया जाने वाला live JSON Schema प्रिंट करता है, उपलब्ध होने पर bundled/plugin/channel metadata मिलाकर
- `config.schema.lookup` drill-down tooling के लिए एक path-scoped schema node लौटाता है
- `pnpm config:docs:check` / `pnpm config:docs:gen` मौजूदा schema surface के विरुद्ध config-doc baseline hash validate करते हैं

Agent lookup path: edits से पहले
सटीक field-level docs और constraints के लिए `gateway` tool action `config.schema.lookup` का उपयोग करें। कार्य-उन्मुख मार्गदर्शन के लिए
[कॉन्फ़िगरेशन](/hi/gateway/configuration) और विस्तृत field map, defaults, और subsystem references के लिंक के लिए यह पेज उपयोग करें।

समर्पित गहरे संदर्भ:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, और `plugins.entries.memory-core.config.dreaming` के अंतर्गत dreaming config के लिए [Memory configuration reference](/hi/reference/memory-config)
- मौजूदा built-in + bundled command catalog के लिए [Slash commands](/hi/tools/slash-commands)
- channel-specific command surfaces के लिए स्वामित्व वाले channel/plugin पेज

Config format **JSON5** है (comments + trailing commas अनुमत हैं)। सभी fields वैकल्पिक हैं - छूट जाने पर OpenClaw सुरक्षित defaults का उपयोग करता है।

---

## चैनल

Per-channel config keys एक समर्पित पेज पर चले गए हैं - `channels.*` के लिए
[Configuration - channels](/hi/gateway/config-channels) देखें,
जिसमें Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, और अन्य
bundled channels (auth, access control, multi-account, mention gating) शामिल हैं।

## Agent defaults, multi-agent, sessions, और messages

एक समर्पित पेज पर ले जाया गया - इसके लिए
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
  - `talk.realtime.consultRouting`: finalized realtime Talk transcripts के लिए Gateway relay fallback जो `openclaw_agent_consult` को skip करते हैं

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
- `models.providers.*.localService`: local model servers के लिए वैकल्पिक on-demand process manager। OpenClaw configured health endpoint probe करता है, जरूरत होने पर absolute `command` start करता है, readiness की प्रतीक्षा करता है, फिर model request भेजता है। [Local model services](/hi/gateway/local-model-services) देखें।
- `models.pricing.enabled`: background pricing bootstrap नियंत्रित करता है जो sidecars और channels के Gateway ready path तक पहुंचने के बाद start होता है। जब `false` हो, Gateway OpenRouter और LiteLLM pricing-catalog fetches skip करता है; configured `models.providers.*.models[].cost` values local cost estimates के लिए फिर भी काम करती हैं।

## MCP

OpenClaw-managed MCP server definitions `mcp.servers` के अंतर्गत रहती हैं और
embedded OpenClaw और अन्य runtime adapters द्वारा consume की जाती हैं। `openclaw mcp list`,
`show`, `set`, और `unset` commands config edits के दौरान target server से connect किए बिना इस block को manage करते हैं।

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
  Remote entries `transport: "streamable-http"` या `transport: "sse"` का उपयोग करती हैं;
  `type: "http"` एक CLI-native alias है जिसे `openclaw mcp set` और
  `openclaw doctor --fix` canonical `transport` field में normalize करते हैं।
- `mcp.servers.<name>.enabled`: saved server definition को बनाए रखते हुए
  embedded OpenClaw MCP discovery और tool projection से exclude करने के लिए `false` set करें।
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: per-server MCP request
  timeout seconds या milliseconds में।
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: per-server
  connection timeout seconds या milliseconds में।
- `mcp.servers.<name>.supportsParallelToolCalls`: adapters के लिए वैकल्पिक concurrency hint
  जो चुन सकते हैं कि parallel MCP tool calls issue करने हैं या नहीं।
- `mcp.servers.<name>.auth`: OAuth आवश्यक करने वाले HTTP MCP servers के लिए `"oauth"` set करें।
  OpenClaw state के अंतर्गत tokens store करने के लिए `openclaw mcp login <name>` चलाएं।
- `mcp.servers.<name>.oauth`: वैकल्पिक OAuth scope, redirect URL, और client
  metadata URL overrides।
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: private endpoints और mutual TLS के लिए HTTP TLS controls।
- `mcp.servers.<name>.toolFilter`: वैकल्पिक per-server tool selection। `include`
  discovered MCP tools को matching names तक सीमित करता है; `exclude` matching
  names छिपाता है। Entries exact MCP tool names या simple `*` globs हैं। Resources या prompts वाले servers utility tool names (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) भी generate करते हैं, और वे names वही
  filter उपयोग करते हैं।
- `mcp.servers.<name>.codex`: वैकल्पिक Codex app-server projection controls।
  यह block केवल Codex app-server threads के लिए OpenClaw metadata है; यह
  ACP sessions, generic Codex harness config, या अन्य runtime adapters को प्रभावित नहीं करता।
  Non-empty `codex.agents` server को listed OpenClaw agent ids तक सीमित करता है।
  Empty, blank, या invalid scoped agent lists config validation द्वारा reject की जाती हैं
  और global बनने के बजाय runtime projection path द्वारा omit की जाती हैं।
  `codex.defaultToolsApprovalMode` उस server के लिए Codex का native
  `default_tools_approval_mode` emit करता है। Native `mcp_servers` config Codex को pass करने से पहले OpenClaw `codex`
  block हटा देता है। Server को Codex के default MCP approval behavior के साथ हर Codex app-server agent के लिए projected रखने के लिए block omit करें।
- `mcp.sessionIdleTtlMs`: session-scoped bundled MCP runtimes के लिए idle TTL।
  One-shot embedded runs run-end cleanup request करते हैं; यह TTL long-lived sessions और future callers के लिए backstop है।
- `mcp.*` के अंतर्गत changes cached session MCP runtimes dispose करके hot-apply होते हैं।
  अगला tool discovery/use उन्हें नए config से recreate करता है, इसलिए removed
  `mcp.servers` entries idle TTL की प्रतीक्षा करने के बजाय तुरंत reap हो जाती हैं।
- Runtime discovery MCP tool-list change notifications को भी honor करता है और
  उस session के cached catalog को drop कर देता है। Resources या prompts advertise करने वाले servers को resources list/read करने और prompts list/fetch करने के लिए utility tools मिलते हैं। Repeated tool-call failures किसी और call के attempt से पहले affected server को थोड़ी देर pause करते हैं।

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
- `load.allowSymlinkTargets`: trusted real target roots जिनमें skill symlinks resolve हो सकते हैं जब link अपने configured source root के बाहर रहता है।
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply को पहले से trusted symlink targets के through write करने देता है (default: false)।
- `install.preferBrew`: true होने पर, `brew` उपलब्ध होने पर अन्य installer kinds पर fallback करने से पहले Homebrew installers को prefer करें।
- `install.nodeManager`: `metadata.openclaw.install` specs के लिए node installer preference
  (`npm` | `pnpm` | `yarn` | `bun`)।
- `install.allowUploadedArchives`: trusted `operator.admin` Gateway
  clients को `skills.upload.*` के through staged private zip archives install करने की अनुमति देता है
  (default: false)। यह केवल uploaded-archive path enable करता है; normal ClawHub
  installs को इसकी जरूरत नहीं होती।
- `entries.<skillKey>.enabled: false` bundled/installed होने पर भी skill disable करता है।
- `entries.<skillKey>.apiKey`: primary env var declare करने वाले skills के लिए convenience (plaintext string या SecretRef object)।

---

## Plugin

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
- standalone plugin files को `plugins.load.paths` में रखें; auto-discovered extension roots top-level `.js`, `.mjs`, और `.ts` files को अनदेखा करते हैं ताकि उन roots में helper scripts startup को ब्लॉक न करें।
- Discovery native OpenClaw plugins के साथ compatible Codex bundles और Claude bundles स्वीकार करती है, जिसमें manifestless Claude default-layout bundles भी शामिल हैं।
- **Config changes के लिए gateway restart आवश्यक है।**
- `allow`: वैकल्पिक allowlist (केवल सूचीबद्ध plugins लोड होते हैं)। `deny` जीतता है।
- `plugins.entries.<id>.apiKey`: plugin-level API key सुविधा field (जब plugin द्वारा समर्थित हो)।
- `plugins.entries.<id>.env`: plugin-scoped env var map।
- `plugins.entries.<id>.hooks.allowPromptInjection`: जब `false` हो, core `before_prompt_build` को ब्लॉक करता है और legacy `before_agent_start` से prompt-mutating fields को अनदेखा करता है, जबकि legacy `modelOverride` और `providerOverride` को सुरक्षित रखता है। native plugin hooks और supported bundle-provided hook directories पर लागू होता है।
- `plugins.entries.<id>.hooks.allowConversationAccess`: जब `true` हो, trusted non-bundled plugins raw conversation content को typed hooks जैसे `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, और `agent_end` से पढ़ सकते हैं।
- `plugins.entries.<id>.subagent.allowModelOverride`: इस plugin पर स्पष्ट रूप से भरोसा करें कि यह background subagent runs के लिए per-run `provider` और `model` overrides का अनुरोध कर सके।
- `plugins.entries.<id>.subagent.allowedModels`: trusted subagent overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model को अनुमति देना चाहते हों।
- `plugins.entries.<id>.llm.allowModelOverride`: इस plugin पर स्पष्ट रूप से भरोसा करें कि यह `api.runtime.llm.complete` के लिए model overrides का अनुरोध कर सके।
- `plugins.entries.<id>.llm.allowedModels`: trusted plugin LLM completion overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप जानबूझकर किसी भी model को अनुमति देना चाहते हों।
- `plugins.entries.<id>.llm.allowAgentIdOverride`: इस plugin पर स्पष्ट रूप से भरोसा करें कि यह non-default agent id के विरुद्ध `api.runtime.llm.complete` चला सके।
- `plugins.entries.<id>.config`: plugin-defined config object (उपलब्ध होने पर native OpenClaw plugin schema द्वारा validated)।
- Channel plugin account/runtime settings `channels.<id>` के अंतर्गत रहते हैं और उन्हें central OpenClaw option registry द्वारा नहीं, बल्कि owning plugin के manifest `channelConfigs` metadata द्वारा describe किया जाना चाहिए।

### Codex harness plugin config

bundled `codex` plugin native Codex app-server harness settings का स्वामी है, जो
`plugins.entries.codex.config` के अंतर्गत हैं। पूरे config
surface के लिए [Codex harness reference](/hi/plugins/codex-harness-reference) और runtime model के लिए [Codex harness](/hi/plugins/codex-harness) देखें।

`codexPlugins` केवल उन sessions पर लागू होता है जो native Codex harness चुनते हैं।
यह OpenClaw provider runs, ACP
conversation bindings, या किसी non-Codex harness के लिए Codex plugins enable नहीं करता।

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
  plugin/app support enable करता है। डिफ़ॉल्ट: `false`।
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  migrated plugin app elicitations के लिए default destructive-action policy।
  prompting के बिना safe Codex approval schemas स्वीकार करने के लिए `true`, उन्हें अस्वीकार करने के लिए `false`,
  Codex-required approvals को OpenClaw
  plugin approvals के माध्यम से route करने के लिए `"auto"`, या durable approval के बिना हर plugin write/destructive
  action के लिए prompt करने के लिए `"ask"` का उपयोग करें। `"ask"` mode प्रभावित app के लिए durable Codex
  per-tool approval overrides clear करता है और Codex thread शुरू होने से पहले उस app के लिए human
  approvals reviewer चुनता है।
  डिफ़ॉल्ट: `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global `codexPlugins.enabled` भी true होने पर
  migrated plugin entry enable करता है।
  डिफ़ॉल्ट: explicit entries के लिए `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stable marketplace identity। V1 केवल `"openai-curated"` को support करता है।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration से stable
  Codex plugin identity, उदाहरण के लिए `"google-calendar"`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  per-plugin destructive-action override। omit किए जाने पर global
  `allow_destructive_actions` value उपयोग होती है। per-plugin value वही
  `true`, `false`, `"auto"`, या `"ask"` policies स्वीकार करती है।

`"ask"` का उपयोग करने वाला प्रत्येक admitted plugin app उस app के approval requests
को human reviewer तक route करता है। अन्य apps और non-app thread approvals अपने
configured reviewer को बनाए रखते हैं, इसलिए mixed plugin policies `"ask"` behavior inherit नहीं करतीं।

`codexPlugins.enabled` global enablement directive है। migration द्वारा लिखी गई explicit plugin
entries durable install और repair eligibility set हैं।
`plugins["*"]` supported नहीं है, कोई `install` switch नहीं है, और local
`marketplacePath` values जानबूझकर config fields नहीं हैं क्योंकि वे
host-specific हैं।

`app/list` readiness checks एक घंटे के लिए cached होते हैं और stale होने पर
asynchronously refresh होते हैं। Codex thread app config Codex harness
session establishment पर compute होता है, हर turn पर नहीं; native plugin config बदलने के बाद `/new`, `/reset`, या gateway
restart का उपयोग करें।

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider settings।
  - `apiKey`: higher limits के लिए वैकल्पिक Firecrawl API key (SecretRef स्वीकार करता है)। `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, या `FIRECRAWL_API_KEY` env var पर fallback करता है।
  - `baseUrl`: Firecrawl API base URL (डिफ़ॉल्ट: `https://api.firecrawl.dev`; self-hosted overrides को private/internal endpoints target करने चाहिए)।
  - `onlyMainContent`: pages से केवल main content extract करें (डिफ़ॉल्ट: `true`)।
  - `maxAgeMs`: milliseconds में maximum cache age (डिफ़ॉल्ट: `172800000` / 2 days)।
  - `timeoutSeconds`: seconds में scrape request timeout (डिफ़ॉल्ट: `60`)।
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) settings।
  - `enabled`: X Search provider enable करें।
  - `model`: search के लिए उपयोग होने वाला Grok model (उदा. `"grok-4-1-fast"`)।
- `plugins.entries.memory-core.config.dreaming`: memory dreaming settings। phases और thresholds के लिए [Dreaming](/hi/concepts/dreaming) देखें।
  - `enabled`: master dreaming switch (डिफ़ॉल्ट `false`)।
  - `frequency`: हर full dreaming sweep के लिए cron cadence (डिफ़ॉल्ट रूप से `"0 3 * * *"`)।
  - `model`: वैकल्पिक Dream Diary subagent model override। `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है; targets restrict करने के लिए `allowedModels` के साथ pair करें। Model-unavailable errors session default model के साथ एक बार retry करते हैं; trust या allowlist failures silently fall back नहीं करते।
  - phase policy और thresholds implementation details हैं (user-facing config keys नहीं)।
- पूरा memory config [Memory configuration reference](/hi/reference/memory-config) में है:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Enabled Claude bundle plugins `settings.json` से embedded OpenClaw defaults भी contribute कर सकते हैं; OpenClaw उन्हें sanitized agent settings के रूप में apply करता है, raw OpenClaw config patches के रूप में नहीं।
- `plugins.slots.memory`: active memory plugin id चुनें, या memory plugins disable करने के लिए `"none"`।
- `plugins.slots.contextEngine`: active context engine plugin id चुनें; जब तक आप कोई दूसरा engine install और select नहीं करते, default `"legacy"` है।

[Plugins](/hi/tools/plugin) देखें।

---

## Commitments

`commitments` inferred follow-up memory को control करता है: OpenClaw conversation turns से check-ins detect कर सकता है और उन्हें heartbeat runs के माध्यम से deliver कर सकता है।

- `commitments.enabled`: inferred follow-up commitments के लिए hidden LLM extraction, storage, और heartbeat delivery enable करें। डिफ़ॉल्ट: `false`।
- `commitments.maxPerDay`: rolling day में प्रति agent session deliver किए जाने वाले maximum inferred follow-up commitments। डिफ़ॉल्ट: `3`।

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
- `tabCleanup` निष्क्रिय समय के बाद या जब कोई सत्र अपनी सीमा से अधिक हो जाता है, ट्रैक किए गए प्राथमिक-एजेंट टैब वापस प्राप्त करता है। उन अलग-अलग क्लीनअप मोड को अक्षम करने के लिए `idleMinutes: 0` या `maxTabsPerSession: 0` सेट करें।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` सेट न होने पर अक्षम रहता है, इसलिए ब्राउज़र नेविगेशन डिफ़ॉल्ट रूप से सख्त रहता है।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` केवल तब सेट करें जब आप जानबूझकर निजी-नेटवर्क ब्राउज़र नेविगेशन पर भरोसा करते हों।
- सख्त मोड में, रिमोट CDP प्रोफ़ाइल एंडपॉइंट (`profiles.*.cdpUrl`) पहुंच-योग्यता/डिस्कवरी जांचों के दौरान उसी निजी-नेटवर्क ब्लॉकिंग के अधीन होते हैं।
- `ssrfPolicy.allowPrivateNetwork` legacy alias के रूप में समर्थित रहता है।
- सख्त मोड में, स्पष्ट अपवादों के लिए `ssrfPolicy.hostnameAllowlist` और `ssrfPolicy.allowedHostnames` का उपयोग करें।
- रिमोट प्रोफ़ाइल केवल अटैच हैं (start/stop/reset अक्षम)।
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://`, और `wss://` स्वीकार करता है।
  जब आप चाहते हैं कि OpenClaw `/json/version` खोजे, तब HTTP(S) का उपयोग करें; जब आपका प्रदाता आपको सीधा DevTools WebSocket URL देता है, तब WS(S) का उपयोग करें।
- `remoteCdpTimeoutMs` और `remoteCdpHandshakeTimeoutMs` रिमोट और
  `attachOnly` CDP पहुंच-योग्यता के साथ-साथ टैब-खोलने के अनुरोधों पर लागू होते हैं। प्रबंधित लूपबैक प्रोफ़ाइल स्थानीय CDP डिफ़ॉल्ट बनाए रखते हैं।
- यदि कोई बाहरी रूप से प्रबंधित CDP सेवा लूपबैक के जरिए पहुंच-योग्य है, तो उस प्रोफ़ाइल का `attachOnly: true` सेट करें; अन्यथा OpenClaw लूपबैक पोर्ट को स्थानीय प्रबंधित ब्राउज़र प्रोफ़ाइल मानेगा और स्थानीय पोर्ट स्वामित्व त्रुटियां रिपोर्ट कर सकता है।
- `existing-session` प्रोफ़ाइल CDP के बजाय Chrome MCP का उपयोग करती हैं और चुने गए होस्ट पर या कनेक्टेड ब्राउज़र नोड के जरिए अटैच हो सकती हैं।
- `existing-session` प्रोफ़ाइल Brave या Edge जैसे किसी विशिष्ट Chromium-आधारित ब्राउज़र प्रोफ़ाइल को लक्षित करने के लिए `userDataDir` सेट कर सकती हैं।
- `existing-session` प्रोफ़ाइल `cdpUrl` सेट कर सकती हैं जब Chrome पहले से किसी DevTools HTTP(S) डिस्कवरी एंडपॉइंट या सीधे WS(S) एंडपॉइंट के पीछे चल रहा हो। उस मोड में OpenClaw auto-connect का उपयोग करने के बजाय एंडपॉइंट को Chrome MCP को पास करता है; Chrome MCP लॉन्च आर्ग्युमेंट के लिए `userDataDir` अनदेखा किया जाता है।
- `existing-session` प्रोफ़ाइल मौजूदा Chrome MCP रूट सीमाएं बनाए रखती हैं:
  CSS-selector लक्ष्यीकरण के बजाय snapshot/ref-चालित क्रियाएं, एक-फ़ाइल अपलोड हुक, कोई डायलॉग टाइमआउट ओवरराइड नहीं, कोई `wait --load networkidle` नहीं, और कोई `responsebody`, PDF निर्यात, डाउनलोड इंटरसेप्शन, या बैच क्रियाएं नहीं।
- स्थानीय प्रबंधित `openclaw` प्रोफ़ाइल `cdpPort` और `cdpUrl` अपने-आप असाइन करती हैं; `cdpUrl` को स्पष्ट रूप से केवल रिमोट CDP प्रोफ़ाइल या existing-session एंडपॉइंट अटैच के लिए सेट करें।
- स्थानीय प्रबंधित प्रोफ़ाइल उस प्रोफ़ाइल के लिए वैश्विक `browser.executablePath` को ओवरराइड करने के लिए `executablePath` सेट कर सकती हैं। इसका उपयोग एक प्रोफ़ाइल Chrome में और दूसरी Brave में चलाने के लिए करें।
- स्थानीय प्रबंधित प्रोफ़ाइल प्रक्रिया शुरू होने के बाद Chrome CDP HTTP डिस्कवरी के लिए `browser.localLaunchTimeoutMs` और लॉन्च के बाद CDP websocket readiness के लिए `browser.localCdpReadyTimeoutMs` का उपयोग करती हैं। उन्हें धीमे होस्ट पर बढ़ाएं, जहां Chrome सफलतापूर्वक शुरू होता है लेकिन readiness जांच startup से race करती हैं। दोनों मान `120000` ms तक के धनात्मक पूर्णांक होने चाहिए; अमान्य कॉन्फ़िग मान अस्वीकार किए जाते हैं।
- ऑटो-डिटेक्ट क्रम: डिफ़ॉल्ट ब्राउज़र यदि Chromium-आधारित हो → Chrome → Brave → Edge → Chromium → Chrome Canary।
- `browser.executablePath` और `browser.profiles.<name>.executablePath` दोनों Chromium लॉन्च से पहले आपके OS होम डायरेक्टरी के लिए `~` और `~/...` स्वीकार करते हैं।
  `existing-session` प्रोफ़ाइल पर प्रति-प्रोफ़ाइल `userDataDir` भी tilde-expanded होता है।
- नियंत्रण सेवा: केवल लूपबैक (पोर्ट `gateway.port` से निकला, डिफ़ॉल्ट `18791`)।
- `extraArgs` स्थानीय Chromium startup में अतिरिक्त लॉन्च फ्लैग जोड़ता है (उदाहरण के लिए
  `--disable-gpu`, विंडो आकार, या डीबग फ्लैग)।

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
- `assistant`: Control UI identity override। सक्रिय agent identity पर fallback करता है।

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

- `mode`: `local` (Gateway चलाएं) या `remote` (दूरस्थ Gateway से कनेक्ट करें). Gateway तब तक शुरू होने से इनकार करता है जब तक `local` न हो.
- `port`: WS + HTTP के लिए एकल multiplexed पोर्ट. प्राथमिकता: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (डिफ़ॉल्ट), `lan` (`0.0.0.0`), `tailnet` (केवल Tailscale IP), या `custom`.
- **Legacy bind aliases**: `gateway.bind` में bind मोड मान (`auto`, `loopback`, `lan`, `tailnet`, `custom`) उपयोग करें, host aliases (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) नहीं.
- **Docker नोट**: डिफ़ॉल्ट `loopback` bind कंटेनर के अंदर `127.0.0.1` पर सुनता है. Docker bridge networking (`-p 18789:18789`) के साथ, ट्रैफ़िक `eth0` पर आता है, इसलिए Gateway पहुंच योग्य नहीं रहता. सभी interfaces पर सुनने के लिए `--network host` उपयोग करें, या `bind: "lan"` (या `customBindHost: "0.0.0.0"` के साथ `bind: "custom"`) सेट करें.
- **Auth**: डिफ़ॉल्ट रूप से आवश्यक. non-loopback binds के लिए Gateway auth आवश्यक है. व्यवहार में इसका अर्थ साझा token/password या `gateway.auth.mode: "trusted-proxy"` के साथ identity-aware reverse proxy है. Onboarding wizard डिफ़ॉल्ट रूप से token जनरेट करता है.
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं (SecretRefs सहित), तो `gateway.auth.mode` को स्पष्ट रूप से `token` या `password` पर सेट करें. दोनों कॉन्फ़िगर होने और mode unset होने पर startup और service install/repair flows विफल हो जाते हैं.
- `gateway.auth.mode: "none"`: स्पष्ट no-auth मोड. केवल विश्वसनीय local loopback setups के लिए उपयोग करें; इसे onboarding prompts में जानबूझकर पेश नहीं किया जाता.
- `gateway.auth.mode: "trusted-proxy"`: browser/user auth को identity-aware reverse proxy को delegate करें और `gateway.trustedProxies` से identity headers पर भरोसा करें ([Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें). यह मोड डिफ़ॉल्ट रूप से **non-loopback** proxy source की अपेक्षा करता है; same-host loopback reverse proxies के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है. Internal same-host callers local direct fallback के रूप में `gateway.auth.password` उपयोग कर सकते हैं; `gateway.auth.token` trusted-proxy mode के साथ mutually exclusive रहता है.
- `gateway.auth.allowTailscale`: `true` होने पर, Tailscale Serve identity headers Control UI/WebSocket auth को संतुष्ट कर सकते हैं (`tailscale whois` के माध्यम से सत्यापित). HTTP API endpoints उस Tailscale header auth का उपयोग **नहीं** करते; वे इसके बजाय Gateway के सामान्य HTTP auth mode का पालन करते हैं. यह tokenless flow मानता है कि Gateway host विश्वसनीय है. जब `tailscale.mode = "serve"` हो तो डिफ़ॉल्ट `true` है.
- `gateway.auth.rateLimit`: वैकल्पिक failed-auth limiter. प्रति client IP और प्रति auth scope लागू होता है (shared-secret और device-token स्वतंत्र रूप से ट्रैक किए जाते हैं). Blocked attempts `429` + `Retry-After` लौटाते हैं.
  - async Tailscale Serve Control UI path पर, उसी `{scope, clientIp}` के लिए failed attempts को failure write से पहले serialized किया जाता है. इसलिए उसी client से concurrent bad attempts plain mismatches की तरह दोनों race through होने के बजाय दूसरे request पर limiter trip कर सकते हैं.
  - `gateway.auth.rateLimit.exemptLoopback` का डिफ़ॉल्ट `true` है; जब आप जानबूझकर localhost traffic को भी rate-limited करना चाहते हैं (test setups या strict proxy deployments के लिए) तो `false` सेट करें.
- Browser-origin WS auth attempts हमेशा loopback exemption disabled के साथ throttled होते हैं (browser-based localhost brute force के विरुद्ध defense-in-depth).
- loopback पर, वे browser-origin lockouts प्रति normalized `Origin`
  value अलग-थलग होते हैं, इसलिए एक localhost origin से repeated failures अपने आप
  किसी अलग origin को lock out नहीं करते.
- `tailscale.mode`: `serve` (केवल tailnet, loopback bind) या `funnel` (public, auth आवश्यक).
- `tailscale.serviceName`: Serve mode के लिए वैकल्पिक Tailscale Service name, जैसे
  `svc:openclaw`. सेट होने पर, OpenClaw इसे `tailscale serve
--service` को पास करता है ताकि Control UI device hostname के बजाय named Service के ज़रिए expose किया जा सके. मान को Tailscale के `svc:<dns-label>`
  Service name format का उपयोग करना चाहिए; startup derived Service URL report करता है.
- `tailscale.preserveFunnel`: जब `true` हो और `tailscale.mode = "serve"` हो, OpenClaw
  startup पर Serve को फिर से apply करने से पहले `tailscale funnel status` जांचता है और यदि कोई externally configured Funnel route पहले से Gateway port को cover करता है तो
  उसे छोड़ देता है. डिफ़ॉल्ट `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket connects के लिए स्पष्ट browser-origin allowlist. public non-loopback browser origins के लिए आवश्यक. loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet UI loads Host-header fallback सक्षम किए बिना स्वीकार किए जाते हैं.
- `controlUi.chatMessageMaxWidth`: grouped Control UI chat messages के लिए वैकल्पिक max-width. `960px`, `82%`, `min(1280px, 82%)`, और `calc(100% - 2rem)` जैसे constrained CSS width values स्वीकार करता है.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: खतरनाक मोड जो उन deployments के लिए Host-header origin fallback सक्षम करता है जो जानबूझकर Host-header origin policy पर निर्भर करते हैं.
- `remote.transport`: `ssh` (डिफ़ॉल्ट) या `direct` (ws/wss). `direct` के लिए, public hosts के लिए `remote.url` `wss://` होना चाहिए; plaintext `ws://` केवल loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT hosts के लिए स्वीकार किया जाता है.
- `remote.remotePort`: remote SSH host पर Gateway port. डिफ़ॉल्ट `18789`; इसे तब उपयोग करें जब local tunnel port remote Gateway port से अलग हो.
- `remote.sshHostKeyPolicy`: macOS SSH tunnel host-key policy. `strict` डिफ़ॉल्ट है और पहले से trusted key की आवश्यकता होती है. `openssh` managed aliases के लिए प्रभावी OpenSSH configuration में स्पष्ट opt-in है; इसे उपयोग करने से पहले matching user और system SSH settings की समीक्षा करें. macOS app और `configure-remote` targets बदलते समय इस policy को `strict` पर reset करते हैं, जब तक फिर से स्पष्ट opt-in न किया गया हो.
- `gateway.remote.token` / `.password` remote-client credential fields हैं. वे अपने आप Gateway auth कॉन्फ़िगर नहीं करते.
- `gateway.push.apns.relay.baseUrl`: relay-backed iOS builds द्वारा Gateway पर registrations publish करने के बाद उपयोग होने वाले external APNs relay के लिए base HTTPS URL. Public App Store builds hosted OpenClaw relay उपयोग करते हैं. Custom relay URLs को जानबूझकर अलग iOS build/deployment path से मेल खाना चाहिए जिसका relay URL उस relay की ओर इंगित करता हो.
- `gateway.push.apns.relay.timeoutMs`: Gateway-to-relay send timeout milliseconds में. डिफ़ॉल्ट `10000`.
- Relay-backed registrations किसी specific Gateway identity को delegated होते हैं. paired iOS app `gateway.identity.get` fetch करता है, relay registration में उस identity को शामिल करता है, और registration-scoped send grant को Gateway को forward करता है. दूसरा Gateway उस stored registration का reuse नहीं कर सकता.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ऊपर relay config के लिए temporary env overrides.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URLs के लिए development-only escape hatch. Production relay URLs HTTPS पर ही रहने चाहिए.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket handshake timeout milliseconds में. डिफ़ॉल्ट: `15000`. सेट होने पर `OPENCLAW_HANDSHAKE_TIMEOUT_MS` को प्राथमिकता मिलती है. इसे loaded या low-powered hosts पर बढ़ाएं जहां local clients startup warmup के अभी settle हो रहे होने पर भी connect कर सकते हैं.
- `gateway.channelHealthCheckMinutes`: channel health-monitor interval minutes में. health-monitor restarts को global रूप से disable करने के लिए `0` सेट करें. डिफ़ॉल्ट: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socket threshold minutes में. इसे `gateway.channelHealthCheckMinutes` से greater than or equal रखें. डिफ़ॉल्ट: `30`.
- `gateway.channelMaxRestartsPerHour`: rolling hour में प्रति channel/account अधिकतम health-monitor restarts. डिफ़ॉल्ट: `10`.
- `channels.<provider>.healthMonitor.enabled`: global monitor enabled रखते हुए health-monitor restarts के लिए per-channel opt-out.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account channels के लिए per-account override. सेट होने पर, यह channel-level override पर precedence लेता है.
- Local Gateway call paths `gateway.remote.*` को fallback के रूप में केवल तब उपयोग कर सकते हैं जब `gateway.auth.*` unset हो.
- यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के माध्यम से explicit रूप से configured और unresolved है, तो resolution fail closed होता है (कोई remote fallback masking नहीं).
- `trustedProxies`: reverse proxy IPs जो TLS terminate करते हैं या forwarded-client headers inject करते हैं. केवल उन्हीं proxies को सूचीबद्ध करें जिन्हें आप control करते हैं. Loopback entries same-host proxy/local-detection setups (उदाहरण के लिए Tailscale Serve या local reverse proxy) के लिए अभी भी valid हैं, लेकिन वे loopback requests को `gateway.auth.mode: "trusted-proxy"` के लिए eligible **नहीं** बनाते.
- `allowRealIpFallback`: `true` होने पर, Gateway `X-Real-IP` स्वीकार करता है यदि `X-Forwarded-For` missing हो. fail-closed behavior के लिए डिफ़ॉल्ट `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: no requested scopes के साथ first-time node device pairing को auto-approve करने के लिए वैकल्पिक CIDR/IP allowlist. unset होने पर यह disabled रहता है. यह operator/browser/Control UI/WebChat pairing को auto-approve नहीं करता, और role, scope, metadata, या public-key upgrades को auto-approve नहीं करता.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairing और platform allowlist evaluation के बाद declared node commands के लिए global allow/deny shaping. `camera.snap`, `camera.clip`, और `screen.record` जैसे dangerous node commands में opt in करने के लिए `allowCommands` उपयोग करें; `denyCommands` किसी command को हटाता है भले ही platform default या explicit allow उसे अन्यथा include करता. node द्वारा अपनी declared command list बदलने के बाद, उस device pairing को reject और re-approve करें ताकि Gateway updated command snapshot store करे.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` के लिए blocked extra tool names (default deny list को extend करता है).
- `gateway.tools.allow`: owner/admin callers के लिए default HTTP deny list से tool names हटाएं. यह identity-bearing `operator.write`
  callers को owner/admin access में upgrade नहीं करता; `cron`, `gateway`, और `nodes` allowlisted होने पर भी
  non-owner callers के लिए unavailable रहते हैं.

</Accordion>

### OpenAI-compatible endpoints

- Admin HTTP RPC: `admin-http-rpc` Plugin के रूप में डिफ़ॉल्ट रूप से off. `POST /api/v1/admin/rpc` register करने के लिए Plugin सक्षम करें. [Admin HTTP RPC](/hi/plugins/admin-http-rpc) देखें.
- Chat Completions: डिफ़ॉल्ट रूप से disabled. `gateway.http.endpoints.chatCompletions.enabled: true` के साथ सक्षम करें.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Empty allowlists को unset माना जाता है; URL fetching disable करने के लिए `gateway.http.endpoints.responses.files.allowUrl=false`
    और/या `gateway.http.endpoints.responses.images.allowUrl=false` उपयोग करें.
- वैकल्पिक response hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (केवल उन HTTPS origins के लिए सेट करें जिन्हें आप control करते हैं; [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth#tls-termination-and-hsts) देखें)

### Multi-instance isolation

unique ports और state dirs के साथ एक host पर कई Gateways चलाएं:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

सुविधा फ़्लैग: `--dev` (`~/.openclaw-dev` + पोर्ट `19001` का उपयोग करता है), `--profile <name>` (`~/.openclaw-<name>` का उपयोग करता है).

[एकाधिक Gateway](/hi/gateway/multiple-gateways) देखें.

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
- `autoGenerate`: जब स्पष्ट फ़ाइलें कॉन्फ़िगर नहीं की गई हों, तब स्थानीय स्व-हस्ताक्षरित प्रमाणपत्र/कुंजी जोड़ी अपने आप जनरेट करता है; केवल स्थानीय/डेवलपमेंट उपयोग के लिए.
- `certPath`: TLS प्रमाणपत्र फ़ाइल का फ़ाइल सिस्टम पथ.
- `keyPath`: TLS निजी कुंजी फ़ाइल का फ़ाइल सिस्टम पथ; अनुमतियों को प्रतिबंधित रखें.
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
  - `"off"`: लाइव संपादनों को अनदेखा करें; बदलावों के लिए स्पष्ट रीस्टार्ट आवश्यक है।
  - `"restart"`: कॉन्फ़िग बदलाव पर Gateway प्रक्रिया को हमेशा रीस्टार्ट करें।
  - `"hot"`: रीस्टार्ट किए बिना उसी प्रक्रिया में बदलाव लागू करें।
  - `"hybrid"` (डिफ़ॉल्ट): पहले हॉट रीलोड आज़माएँ; आवश्यकता होने पर रीस्टार्ट पर वापस जाएँ।
- `debounceMs`: कॉन्फ़िग बदलाव लागू होने से पहले ms में डिबाउंस विंडो (गैर-ऋणात्मक पूर्णांक)।
- `deferralTimeoutMs`: रीस्टार्ट या चैनल हॉट रीलोड बाध्य करने से पहले चल रहे ऑपरेशनों की प्रतीक्षा करने का वैकल्पिक अधिकतम समय ms में। डिफ़ॉल्ट सीमित प्रतीक्षा (`300000`) का उपयोग करने के लिए इसे छोड़ दें; अनिश्चितकाल तक प्रतीक्षा करने और समय-समय पर अभी भी लंबित चेतावनियाँ लॉग करने के लिए `0` सेट करें।

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
- `hooks.token` सक्रिय Gateway साझा-सीक्रेट प्रमाणीकरण (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) से अलग होना चाहिए; पुन: उपयोग का पता चलने पर स्टार्टअप गैर-घातक सुरक्षा चेतावनी लॉग करता है।
- `openclaw security audit` हुक/Gateway प्रमाणीकरण पुन: उपयोग को गंभीर निष्कर्ष के रूप में फ़्लैग करता है, जिसमें केवल ऑडिट समय पर दिया गया Gateway पासवर्ड प्रमाणीकरण (`--auth password --password <password>`) भी शामिल है। स्थायी रूप से सहेजे गए पुन: उपयोग किए गए `hooks.token` को रोटेट करने के लिए `openclaw doctor --fix` चलाएँ, फिर बाहरी हुक भेजने वालों को नया हुक टोकन उपयोग करने के लिए अपडेट करें।
- `hooks.path` `/` नहीं हो सकता; `/hooks` जैसा समर्पित उप-पथ उपयोग करें।
- यदि `hooks.allowRequestSessionKey=true` है, तो `hooks.allowedSessionKeyPrefixes` को सीमित करें (उदाहरण के लिए `["hook:"]`)।
- यदि कोई मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` उपयोग करता है, तो `hooks.allowedSessionKeyPrefixes` और `hooks.allowRequestSessionKey=true` सेट करें। स्थिर मैपिंग कुंजियों को इस ऑप्ट-इन की आवश्यकता नहीं होती।

**एंडपॉइंट:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - अनुरोध पेलोड से `sessionKey` केवल तभी स्वीकार किया जाता है जब `hooks.allowRequestSessionKey=true` हो (डिफ़ॉल्ट: `false`)।
- `POST /hooks/<name>` → `hooks.mappings` के माध्यम से रिज़ॉल्व किया गया
  - टेम्पलेट-रेंडर किए गए मैपिंग `sessionKey` मानों को बाहरी रूप से दिए गए माना जाता है और उनके लिए भी `hooks.allowRequestSessionKey=true` आवश्यक है।

<Accordion title="मैपिंग विवरण">

- `match.path` `/hooks` के बाद उप-पथ से मेल खाता है (जैसे `/hooks/gmail` → `gmail`)।
- `match.source` सामान्य पथों के लिए पेलोड फ़ील्ड से मेल खाता है।
- `{{messages[0].subject}}` जैसे टेम्पलेट पेलोड से पढ़ते हैं।
- `transform` किसी हुक एक्शन लौटाने वाले JS/TS मॉड्यूल की ओर संकेत कर सकता है।
  - `transform.module` सापेक्ष पथ होना चाहिए और `hooks.transformsDir` के भीतर ही रहता है (निरपेक्ष पथ और ट्रैवर्सल अस्वीकार किए जाते हैं)।
  - `hooks.transformsDir` को `~/.openclaw/hooks/transforms` के अंतर्गत रखें; वर्कस्पेस Skills डायरेक्टरियाँ अस्वीकार की जाती हैं। यदि `openclaw doctor` इस पथ को अमान्य बताता है, तो ट्रांसफ़ॉर्म मॉड्यूल को हुक ट्रांसफ़ॉर्म डायरेक्टरी में ले जाएँ या `hooks.transformsDir` हटा दें।
- `agentId` किसी विशिष्ट एजेंट तक रूट करता है; अज्ञात ID डिफ़ॉल्ट एजेंट पर वापस जाते हैं।
- `allowedAgentIds`: प्रभावी एजेंट रूटिंग को सीमित करता है, जिसमें `agentId` छोड़े जाने पर डिफ़ॉल्ट-एजेंट पथ भी शामिल है (`*` या छोड़ा गया = सभी की अनुमति, `[]` = सभी अस्वीकार)।
- `defaultSessionKey`: स्पष्ट `sessionKey` के बिना हुक एजेंट रन के लिए वैकल्पिक स्थिर सेशन कुंजी।
- `allowRequestSessionKey`: `/hooks/agent` कॉलर्स और टेम्पलेट-चालित मैपिंग सेशन कुंजियों को `sessionKey` सेट करने दें (डिफ़ॉल्ट: `false`)।
- `allowedSessionKeyPrefixes`: स्पष्ट `sessionKey` मानों (अनुरोध + मैपिंग) के लिए वैकल्पिक प्रीफ़िक्स अनुमत-सूची, जैसे `["hook:"]`। जब कोई भी मैपिंग या प्रीसेट टेम्पलेटेड `sessionKey` उपयोग करता है, तो यह आवश्यक हो जाता है।
- `deliver: true` अंतिम उत्तर को चैनल पर भेजता है; `channel` डिफ़ॉल्ट रूप से `last` होता है।
- `model` इस हुक रन के लिए LLM को ओवरराइड करता है (यदि मॉडल कैटलॉग सेट है तो अनुमति होनी चाहिए)।

</Accordion>

### Gmail इंटीग्रेशन

- बिल्ट-इन Gmail प्रीसेट `sessionKey: "hook:gmail:{{messages[0].id}}"` उपयोग करता है।
- यदि आप वह प्रति-संदेश रूटिंग रखते हैं, तो `hooks.allowRequestSessionKey: true` सेट करें और `hooks.allowedSessionKeyPrefixes` को Gmail नेमस्पेस से मेल खाने तक सीमित करें, उदाहरण के लिए `["hook:", "hook:gmail:"]`।
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

- कॉन्फ़िगर होने पर Gateway बूट पर `gog gmail watch serve` अपने-आप शुरू करता है। अक्षम करने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।
- Gateway के साथ अलग `gog gmail watch serve` न चलाएँ।

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
- गैर-`loopback` बाइंड: canvas रूटों को अन्य Gateway HTTP सतहों की तरह Gateway प्रमाणीकरण (टोकन/पासवर्ड/विश्वसनीय-प्रॉक्सी) चाहिए।
- Node WebViews आम तौर पर प्रमाणीकरण हेडर नहीं भेजते; किसी Node के पेयर और कनेक्ट हो जाने के बाद, Gateway canvas/A2UI एक्सेस के लिए Node-स्कोप्ड कैपेबिलिटी URL विज्ञापित करता है।
- कैपेबिलिटी URL सक्रिय Node WS सेशन से बंधे होते हैं और जल्दी समाप्त हो जाते हैं। IP-आधारित फ़ॉलबैक उपयोग नहीं किया जाता।
- सर्व किए गए HTML में लाइव-रीलोड क्लाइंट इंजेक्ट करता है।
- खाली होने पर स्टार्टर `index.html` अपने-आप बनाता है।
- A2UI को `/__openclaw__/a2ui/` पर भी सर्व करता है।
- बदलावों के लिए Gateway रीस्टार्ट आवश्यक है।
- बड़ी डायरेक्टरियों या `EMFILE` त्रुटियों के लिए लाइव रीलोड अक्षम करें।

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

- `minimal` (जब बंडल किया गया `bonjour` Plugin सक्षम हो तो डिफ़ॉल्ट): TXT रिकॉर्ड से `cliPath` + `sshPort` हटाएँ।
- `full`: `cliPath` + `sshPort` शामिल करें; LAN मल्टीकास्ट विज्ञापन के लिए फिर भी बंडल किया गया `bonjour` Plugin सक्षम होना आवश्यक है।
- `off`: Plugin सक्षमकरण बदले बिना LAN मल्टीकास्ट विज्ञापन दबाएँ।
- बंडल किया गया `bonjour` Plugin macOS होस्टों पर अपने-आप शुरू होता है और Linux, Windows, तथा कंटेनराइज़्ड Gateway डिप्लॉयमेंट पर ऑप्ट-इन है।
- होस्टनेम डिफ़ॉल्ट रूप से सिस्टम होस्टनेम होता है जब वह मान्य DNS लेबल हो, अन्यथा `openclaw` पर वापस जाता है। `OPENCLAW_MDNS_HOSTNAME` से ओवरराइड करें।

### वाइड-एरिया (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` के अंतर्गत यूनिकास्ट DNS-SD ज़ोन लिखता है। क्रॉस-नेटवर्क डिस्कवरी के लिए, इसे DNS सर्वर (CoreDNS अनुशंसित) + Tailscale स्प्लिट DNS के साथ पेयर करें।

सेटअप: `openclaw dns setup --apply`।

---

## एनवायरनमेंट

### `env` (इनलाइन env vars)

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

- इनलाइन env vars केवल तभी लागू होते हैं जब प्रक्रिया env में कुंजी मौजूद न हो।
- `.env` फ़ाइलें: CWD `.env` + `~/.openclaw/.env` (कोई भी मौजूदा vars को ओवरराइड नहीं करती)।
- `shellEnv`: आपके लॉगिन shell प्रोफ़ाइल से अपेक्षित अनुपस्थित कुंजियाँ इम्पोर्ट करता है।
- पूर्ण प्राथमिकता क्रम के लिए [एनवायरनमेंट](/hi/help/environment) देखें।

### Env var प्रतिस्थापन

किसी भी कॉन्फ़िग स्ट्रिंग में `${VAR_NAME}` से env vars संदर्भित करें:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- केवल अपरकेस नाम मेल खाते हैं: `[A-Z_][A-Z0-9_]*`।
- अनुपस्थित/रिक्त vars कॉन्फ़िग लोड पर त्रुटि देते हैं।
- शाब्दिक `${VAR}` के लिए `$${VAR}` से एस्केप करें।
- `$include` के साथ काम करता है।

---

## सीक्रेट्स

Secret refs योगात्मक हैं: प्लेनटेक्स्ट मान अभी भी काम करते हैं।

### `SecretRef`

एक ऑब्जेक्ट आकार उपयोग करें:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

सत्यापन:

- `provider` पैटर्न: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id पैटर्न: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: निरपेक्ष JSON पॉइंटर (उदाहरण के लिए `"/providers/openai/apiKey"`)
- `source: "exec"` id पैटर्न: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS-शैली `secret#json_key` सेलेक्टरों का समर्थन करता है)
- `source: "exec"` ids में `.` या `..` स्लैश-सीमांकित पथ सेगमेंट नहीं होने चाहिए (उदाहरण के लिए `a/../b` अस्वीकार किया जाता है)

### समर्थित क्रेडेंशियल सतह

- कैनॉनिकल मैट्रिक्स: [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)
- `secrets apply` समर्थित `openclaw.json` क्रेडेंशियल पथों को लक्षित करता है।
- `auth-profiles.json` refs रनटाइम रिज़ॉल्यूशन और ऑडिट कवरेज में शामिल हैं।

### सीक्रेट प्रोवाइडर कॉन्फ़िग

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

- `file` प्रोवाइडर `mode: "json"` और `mode: "singleValue"` का समर्थन करता है (`singleValue` मोड में `id` `"value"` होना चाहिए)।
- Windows ACL सत्यापन उपलब्ध न होने पर फ़ाइल और exec प्रोवाइडर पथ fail closed होते हैं। `allowInsecurePath: true` केवल उन विश्वसनीय पथों के लिए सेट करें जिन्हें सत्यापित नहीं किया जा सकता।
- `exec` प्रोवाइडर को निरपेक्ष `command` पथ चाहिए और stdin/stdout पर प्रोटोकॉल पेलोड उपयोग करता है।
- डिफ़ॉल्ट रूप से, symlink कमांड पथ अस्वीकार किए जाते हैं। रिज़ॉल्व किए गए लक्ष्य पथ को सत्यापित करते हुए symlink पथों की अनुमति देने के लिए `allowSymlinkCommand: true` सेट करें।
- यदि `trustedDirs` कॉन्फ़िगर किया गया है, तो trusted-dir जाँच रिज़ॉल्व किए गए लक्ष्य पथ पर लागू होती है।
- `exec` child एनवायरनमेंट डिफ़ॉल्ट रूप से न्यूनतम होता है; आवश्यक variables को `passEnv` के साथ स्पष्ट रूप से पास करें।
- Secret refs सक्रियण समय पर इन-मेमोरी स्नैपशॉट में रिज़ॉल्व किए जाते हैं, फिर अनुरोध पथ केवल स्नैपशॉट पढ़ते हैं।
- सक्रिय-सतह फ़िल्टरिंग सक्रियण के दौरान लागू होती है: सक्षम सतहों पर अनरिज़ॉल्व्ड refs स्टार्टअप/रीलोड विफल करते हैं, जबकि निष्क्रिय सतहें डायग्नोस्टिक्स के साथ छोड़ी जाती हैं।

---

## प्रमाणीकरण संग्रहण

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

- प्रति-एजेंट प्रोफ़ाइल `<agentDir>/auth-profiles.json` पर संग्रहीत होती हैं।
- `auth-profiles.json` स्थिर क्रेडेंशियल मोड के लिए वैल्यू-लेवल refs (`api_key` के लिए `keyRef`, `token` के लिए `tokenRef`) का समर्थन करता है।
- पुराने फ्लैट `auth-profiles.json` मैप जैसे `{ "provider": { "apiKey": "..." } }` रनटाइम फ़ॉर्मैट नहीं हैं; `openclaw doctor --fix` उन्हें `.legacy-flat.*.bak` बैकअप के साथ कैननिकल `provider:default` API-key प्रोफ़ाइल में फिर से लिखता है।
- OAuth-मोड प्रोफ़ाइल (`auth.profiles.<id>.mode = "oauth"`) SecretRef-आधारित auth-profile क्रेडेंशियल का समर्थन नहीं करतीं।
- स्थिर रनटाइम क्रेडेंशियल इन-मेमोरी resolved snapshots से आते हैं; पुराने स्थिर `auth.json` एंट्री मिलने पर साफ़ कर दी जाती हैं।
- पुराने OAuth imports `~/.openclaw/credentials/oauth.json` से होते हैं।
- [OAuth](/hi/concepts/oauth) देखें।
- Secrets रनटाइम व्यवहार और `audit/configure/apply` टूलिंग: [Secrets Management](/hi/gateway/secrets).

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

- `billingBackoffHours`: जब कोई प्रोफ़ाइल वास्तविक
  बिलिंग/अपर्याप्त-क्रेडिट त्रुटियों के कारण विफल होती है, तब घंटों में आधार backoff (डिफ़ॉल्ट: `5`)। स्पष्ट बिलिंग टेक्स्ट
  `401`/`403` responses पर भी यहाँ आ सकता है, लेकिन प्रदाता-विशिष्ट टेक्स्ट
  matchers उसी प्रदाता तक सीमित रहते हैं जिसका वे हिस्सा हैं (उदाहरण के लिए OpenRouter
  `Key limit exceeded`)। Retryable HTTP `402` usage-window या
  organization/workspace spend-limit संदेश इसके बजाय `rate_limit` path में रहते हैं।
- `billingBackoffHoursByProvider`: बिलिंग backoff घंटों के लिए वैकल्पिक प्रति-प्रदाता overrides।
- `billingMaxHours`: बिलिंग backoff exponential growth के लिए घंटों में सीमा (डिफ़ॉल्ट: `24`)।
- `authPermanentBackoffMinutes`: उच्च-विश्वास `auth_permanent` विफलताओं के लिए मिनटों में आधार backoff (डिफ़ॉल्ट: `10`)।
- `authPermanentMaxMinutes`: `auth_permanent` backoff growth के लिए मिनटों में सीमा (डिफ़ॉल्ट: `60`)।
- `failureWindowHours`: backoff counters के लिए उपयोग की जाने वाली घंटों में rolling window (डिफ़ॉल्ट: `24`)।
- `overloadedProfileRotations`: model fallback पर जाने से पहले overloaded errors के लिए अधिकतम same-provider auth-profile rotations (डिफ़ॉल्ट: `1`)। `ModelNotReadyException` जैसे provider-busy shapes यहाँ आते हैं।
- `overloadedBackoffMs`: overloaded provider/profile rotation को फिर से आज़माने से पहले fixed delay (डिफ़ॉल्ट: `0`)।
- `rateLimitedProfileRotations`: model fallback पर जाने से पहले rate-limit errors के लिए अधिकतम same-provider auth-profile rotations (डिफ़ॉल्ट: `1`)। उस rate-limit bucket में `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, और `resource exhausted` जैसे provider-shaped text शामिल हैं।

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

- डिफ़ॉल्ट log file: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- स्थिर path के लिए `logging.file` सेट करें।
- `--verbose` होने पर `consoleLevel` `debug` तक बढ़ जाता है।
- `maxFileBytes`: rotation से पहले active log file का अधिकतम आकार bytes में (positive integer; डिफ़ॉल्ट: `104857600` = 100 MB)। OpenClaw active file के पास पाँच तक numbered archives रखता है।
- `redactSensitive` / `redactPatterns`: console output, file logs, OTLP log records, और persisted session transcript text के लिए best-effort masking। `redactSensitive: "off"` केवल इस सामान्य log/transcript policy को disable करता है; UI/tool/diagnostic safety surfaces अभी भी emission से पहले secrets redact करते हैं।

---

## डायग्नॉस्टिक्स

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

- `enabled`: instrumentation output के लिए master toggle (डिफ़ॉल्ट: `true`)।
- `flags`: लक्षित log output सक्षम करने वाली flag strings की array (wildcards जैसे `"telegram.*"` या `"*"` का समर्थन करती है)।
- `stuckSessionWarnMs`: long-running processing sessions को `session.long_running`, `session.stalled`, या `session.stuck` के रूप में classify करने के लिए no-progress age threshold ms में। Reply, tool, status, block, और ACP progress timer reset करते हैं; दोहराए गए `session.stuck` diagnostics unchanged रहते हुए back off करते हैं।
- `stuckSessionAbortMs`: recovery के लिए eligible stalled active work को abort-drain करने से पहले no-progress age threshold ms में। unset होने पर, OpenClaw कम से कम 5 मिनट और 3x `stuckSessionWarnMs` वाली सुरक्षित extended embedded-run window उपयोग करता है।
- `memoryPressureSnapshot`: memory pressure `critical` पहुँचने पर redacted pre-OOM stability snapshot capture करता है (डिफ़ॉल्ट: `false`)। normal memory pressure events रखते हुए stability bundle file scan/write जोड़ने के लिए `true` सेट करें।
- `otel.enabled`: OpenTelemetry export pipeline सक्षम करता है (डिफ़ॉल्ट: `false`)। पूरी configuration, signal catalog, और privacy model के लिए [OpenTelemetry export](/hi/gateway/opentelemetry) देखें।
- `otel.endpoint`: OTel export के लिए collector URL।
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: वैकल्पिक signal-specific OTLP endpoints। सेट होने पर, वे केवल उस signal के लिए `otel.endpoint` को override करते हैं।
- `otel.protocol`: `"http/protobuf"` (डिफ़ॉल्ट) या `"grpc"`।
- `otel.headers`: OTel export requests के साथ भेजे गए extra HTTP/gRPC metadata headers।
- `otel.serviceName`: resource attributes के लिए service name।
- `otel.traces` / `otel.metrics` / `otel.logs`: trace, metrics, या log export सक्षम करें।
- `otel.logsExporter`: log export sink: `"otlp"` (डिफ़ॉल्ट), प्रति stdout line एक JSON object के लिए `"stdout"`, या `"both"`।
- `otel.sampleRate`: trace sampling rate `0`-`1`।
- `otel.flushIntervalMs`: periodic telemetry flush interval ms में।
- `otel.captureContent`: OTEL span attributes के लिए opt-in raw content capture। डिफ़ॉल्ट off है। Boolean `true` non-system message/tool content capture करता है; object form से आप `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, और `toolDefinitions` को स्पष्ट रूप से सक्षम कर सकते हैं।
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: latest experimental GenAI inference span shape के लिए environment toggle, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। डिफ़ॉल्ट रूप से spans compatibility के लिए `openclaw.model.call` और `gen_ai.system` रखते हैं; GenAI metrics bounded semantic attributes का उपयोग करते हैं।
- `OPENCLAW_OTEL_PRELOADED=1`: उन hosts के लिए environment toggle जिन्होंने पहले से global OpenTelemetry SDK register किया है। तब OpenClaw diagnostic listeners active रखते हुए plugin-owned SDK startup/shutdown skip करता है।
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, और `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: matching config key unset होने पर उपयोग होने वाले signal-specific endpoint env vars।
- `cacheTrace.enabled`: embedded runs के लिए cache trace snapshots log करें (डिफ़ॉल्ट: `false`)।
- `cacheTrace.filePath`: cache trace JSONL के लिए output path (डिफ़ॉल्ट: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)।
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace output में क्या शामिल है, इसे नियंत्रित करें (सभी डिफ़ॉल्ट: `true`)।

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
- `checkOnStart`: Gateway start होने पर npm updates के लिए check करें (डिफ़ॉल्ट: `true`)।
- `auto.enabled`: package installs के लिए background auto-update सक्षम करें (डिफ़ॉल्ट: `false`)।
- `auto.stableDelayHours`: stable-channel auto-apply से पहले घंटों में न्यूनतम delay (डिफ़ॉल्ट: `6`; अधिकतम: `168`)।
- `auto.stableJitterHours`: घंटों में extra stable-channel rollout spread window (डिफ़ॉल्ट: `12`; अधिकतम: `168`)।
- `auto.betaCheckIntervalHours`: beta-channel checks कितनी बार घंटों में चलें (डिफ़ॉल्ट: `1`; अधिकतम: `24`)।

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

- `enabled`: global ACP feature gate (डिफ़ॉल्ट: `true`; ACP dispatch और spawn affordances छिपाने के लिए `false` सेट करें)।
- `dispatch.enabled`: ACP session turn dispatch के लिए स्वतंत्र gate (डिफ़ॉल्ट: `true`)। execution block करते हुए ACP commands उपलब्ध रखने के लिए `false` सेट करें।
- `backend`: डिफ़ॉल्ट ACP runtime backend id (registered ACP runtime plugin से match करना चाहिए)।
  पहले backend plugin install करें, और यदि `plugins.allow` सेट है, तो backend plugin id (उदाहरण के लिए `acpx`) शामिल करें, वरना ACP backend load नहीं होगा।
- `defaultAgent`: spawns में explicit target न होने पर fallback ACP target agent id।
- `allowedAgents`: ACP runtime sessions के लिए अनुमत agent ids की allowlist; empty का अर्थ है कोई अतिरिक्त restriction नहीं।
- `maxConcurrentSessions`: एक साथ active ACP sessions की अधिकतम संख्या।
- `stream.coalesceIdleMs`: streamed text के लिए idle flush window ms में।
- `stream.maxChunkChars`: streamed block projection split करने से पहले maximum chunk size।
- `stream.repeatSuppression`: प्रति turn दोहराई गई status/tool lines suppress करें (डिफ़ॉल्ट: `true`)।
- `stream.deliveryMode`: `"live"` incrementally stream करता है; `"final_only"` turn terminal events तक buffer करता है।
- `stream.hiddenBoundarySeparator`: hidden tool events के बाद visible text से पहले separator (डिफ़ॉल्ट: `"paragraph"`)।
- `stream.maxOutputChars`: प्रति ACP turn projected assistant output characters की अधिकतम संख्या।
- `stream.maxSessionUpdateChars`: projected ACP status/update lines के लिए maximum characters।
- `stream.tagVisibility`: streamed events के लिए tag names से boolean visibility overrides का record।
- `runtime.ttlMinutes`: eligible cleanup से पहले ACP session workers के लिए idle TTL मिनटों में।
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
  - `"random"` (डिफ़ॉल्ट): बदलती हुई मज़ेदार/मौसमी टैगलाइन्स।
  - `"default"`: स्थिर तटस्थ टैगलाइन (`All your chats, one OpenClaw.`)।
  - `"off"`: कोई टैगलाइन टेक्स्ट नहीं (बैनर शीर्षक/वर्ज़न फिर भी दिखते हैं)।
- पूरे बैनर को छिपाने के लिए (सिर्फ टैगलाइन्स नहीं), env `OPENCLAW_HIDE_BANNER=1` सेट करें।

---

## विज़र्ड

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

## ब्रिज (लीगेसी, हटाया गया)

मौजूदा बिल्ड में अब TCP ब्रिज शामिल नहीं है। Nodes Gateway WebSocket के माध्यम से कनेक्ट होते हैं। `bridge.*` कुंजियां अब कॉन्फ़िगरेशन स्कीमा का हिस्सा नहीं हैं (हटाए जाने तक वैलिडेशन विफल होता है; `openclaw doctor --fix` अज्ञात कुंजियां हटा सकता है)।

<Accordion title="लीगेसी ब्रिज कॉन्फ़िगरेशन (ऐतिहासिक संदर्भ)">

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

- `sessionRetention`: पूर्ण हो चुके अलग-थलग Cron रन सेशनों को `sessions.json` से हटाने से पहले कितनी देर रखना है। यह संग्रहित हटाए गए Cron ट्रांसक्रिप्ट की सफाई भी नियंत्रित करता है। डिफ़ॉल्ट: `24h`; अक्षम करने के लिए `false` सेट करें।
- `runLog.maxBytes`: पुराने फ़ाइल-आधारित Cron रन लॉग के साथ संगतता के लिए स्वीकार किया जाता है। डिफ़ॉल्ट: `2_000_000` बाइट।
- `runLog.keepLines`: प्रति जॉब रखी जाने वाली नवीनतम SQLite रन-इतिहास पंक्तियां। डिफ़ॉल्ट: `2000`।
- `webhookToken`: Cron Webhook POST डिलीवरी (`delivery.mode = "webhook"`) के लिए उपयोग किया जाने वाला बेयरर टोकन; छोड़े जाने पर कोई auth हेडर नहीं भेजा जाता।
- `webhook`: अप्रचलित लीगेसी fallback Webhook URL (http/https), जिसका उपयोग `openclaw doctor --fix` उन संग्रहित जॉब को माइग्रेट करने के लिए करता है जिनमें अभी भी `notify: true` है; रनटाइम डिलीवरी प्रति-जॉब `delivery.mode="webhook"` और `delivery.to`, या announce डिलीवरी सुरक्षित रखते समय `delivery.completionDestination` का उपयोग करती है।

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

- `maxAttempts`: अस्थायी त्रुटियों पर Cron जॉब के लिए अधिकतम रीट्राई (डिफ़ॉल्ट: `3`; रेंज: `0`-`10`)।
- `backoffMs`: हर रीट्राई प्रयास के लिए ms में बैकऑफ़ विलंबों की सरणी (डिफ़ॉल्ट: `[30000, 60000, 300000]`; 1-10 प्रविष्टियां)।
- `retryOn`: रीट्राई ट्रिगर करने वाली त्रुटि प्रकार - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`। सभी अस्थायी प्रकारों पर रीट्राई करने के लिए इसे छोड़ दें।

वन-शॉट जॉब रीट्राई प्रयास समाप्त होने तक सक्षम रहते हैं, फिर अंतिम त्रुटि स्थिति रखते हुए अक्षम हो जाते हैं। आवर्ती जॉब अपनी अगली निर्धारित स्लॉट से पहले बैकऑफ़ के बाद फिर चलने के लिए वही अस्थायी रीट्राई नीति उपयोग करते हैं; स्थायी त्रुटियां या समाप्त अस्थायी रीट्राई त्रुटि बैकऑफ़ के साथ सामान्य आवर्ती शेड्यूल पर वापस चले जाते हैं।

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

- `enabled`: Cron जॉब के लिए विफलता अलर्ट सक्षम करें (डिफ़ॉल्ट: `false`)।
- `after`: अलर्ट फायर होने से पहले लगातार विफलताओं की संख्या (धनात्मक पूर्णांक, न्यूनतम: `1`)।
- `cooldownMs`: उसी जॉब के लिए दोहराए गए अलर्ट के बीच न्यूनतम मिलीसेकंड (गैर-ऋणात्मक पूर्णांक)।
- `includeSkipped`: लगातार छोड़े गए रन को अलर्ट थ्रेशोल्ड में गिनें (डिफ़ॉल्ट: `false`)। छोड़े गए रन अलग से ट्रैक होते हैं और execution-error बैकऑफ़ को प्रभावित नहीं करते।
- `mode`: डिलीवरी मोड - `"announce"` चैनल संदेश के माध्यम से भेजता है; `"webhook"` कॉन्फ़िगर किए गए Webhook पर पोस्ट करता है।
- `accountId`: अलर्ट डिलीवरी को स्कोप करने के लिए वैकल्पिक अकाउंट या चैनल id।

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

- सभी जॉब में Cron विफलता सूचनाओं के लिए डिफ़ॉल्ट गंतव्य।
- `mode`: `"announce"` या `"webhook"`; पर्याप्त लक्ष्य डेटा मौजूद होने पर डिफ़ॉल्ट `"announce"` होता है।
- `channel`: announce डिलीवरी के लिए चैनल override। `"last"` अंतिम ज्ञात डिलीवरी चैनल का पुन: उपयोग करता है।
- `to`: स्पष्ट announce लक्ष्य या Webhook URL। Webhook मोड के लिए आवश्यक।
- `accountId`: डिलीवरी के लिए वैकल्पिक अकाउंट override।
- प्रति-जॉब `delivery.failureDestination` इस वैश्विक डिफ़ॉल्ट को override करता है।
- जब न तो वैश्विक और न ही प्रति-जॉब विफलता गंतव्य सेट हो, तो वे जॉब जो पहले से `announce` के माध्यम से डिलीवर करते हैं, विफलता पर उसी प्राथमिक announce लक्ष्य पर वापस जाते हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` जॉब के लिए समर्थित है, जब तक जॉब का प्राथमिक `delivery.mode` `"webhook"` न हो।

[Cron जॉब](/hi/automation/cron-jobs) देखें। अलग-थलग Cron निष्पादन [बैकग्राउंड टास्क](/hi/automation/tasks) के रूप में ट्रैक किए जाते हैं।

---

## मीडिया मॉडल टेम्पलेट वैरिएबल

`tools.media.models[].args` में विस्तारित टेम्पलेट placeholders:

| वैरिएबल           | विवरण                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | पूरा इनबाउंड संदेश बॉडी                         |
| `{{RawBody}}`      | कच्चा बॉडी (कोई history/sender wrappers नहीं)             |
| `{{BodyStripped}}` | समूह mentions हटाया हुआ बॉडी                 |
| `{{From}}`         | प्रेषक पहचानकर्ता                                 |
| `{{To}}`           | गंतव्य पहचानकर्ता                            |
| `{{MessageSid}}`   | चैनल संदेश id                                |
| `{{SessionId}}`    | मौजूदा सेशन UUID                              |
| `{{IsNewSession}}` | नया सेशन बनने पर `"true"`                 |
| `{{MediaUrl}}`     | इनबाउंड मीडिया pseudo-URL                          |
| `{{MediaPath}}`    | स्थानीय मीडिया पाथ                                  |
| `{{MediaType}}`    | मीडिया प्रकार (image/audio/document/…)               |
| `{{Transcript}}`   | ऑडियो ट्रांसक्रिप्ट                                  |
| `{{Prompt}}`       | CLI प्रविष्टियों के लिए resolved मीडिया prompt             |
| `{{MaxChars}}`     | CLI प्रविष्टियों के लिए resolved अधिकतम आउटपुट chars         |
| `{{ChatType}}`     | `"direct"` या `"group"`                           |
| `{{GroupSubject}}` | समूह विषय (सर्वोत्तम प्रयास)                       |
| `{{GroupMembers}}` | समूह सदस्यों का पूर्वावलोकन (सर्वोत्तम प्रयास)               |
| `{{SenderName}}`   | प्रेषक प्रदर्शन नाम (सर्वोत्तम प्रयास)                 |
| `{{SenderE164}}`   | प्रेषक फ़ोन नंबर (सर्वोत्तम प्रयास)                 |
| `{{Provider}}`     | Provider संकेत (whatsapp, telegram, discord, आदि) |

---

## कॉन्फ़िगरेशन includes (`$include`)

कॉन्फ़िगरेशन को कई फ़ाइलों में विभाजित करें:

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

- एकल फ़ाइल: रखने वाले ऑब्जेक्ट को प्रतिस्थापित करती है।
- फ़ाइलों की सरणी: क्रम में deep-merged (बाद वाली पहले वाली को override करती है)।
- Sibling कुंजियां: includes के बाद मर्ज होती हैं (included values को override करती हैं)।
- Nested includes: 10 स्तर गहराई तक।
- पाथ: शामिल करने वाली फ़ाइल के सापेक्ष resolved होते हैं, लेकिन शीर्ष-स्तरीय कॉन्फ़िगरेशन डायरेक्टरी (`openclaw.json` का `dirname`) के अंदर ही रहने चाहिए। Absolute/`../` forms केवल तब अनुमत हैं जब वे फिर भी उस boundary के अंदर resolve हों। पाथ में null bytes नहीं होने चाहिए और resolution से पहले और बाद में 4096 वर्णों से सख्ती से छोटे होने चाहिए।
- OpenClaw-owned writes जो single-file include द्वारा समर्थित केवल एक top-level section बदलते हैं, उसी included file में write through करते हैं। उदाहरण के लिए, `plugins install` `plugins.json5` में `plugins: { $include: "./plugins.json5" }` अपडेट करता है और `openclaw.json` को जस का तस छोड़ता है।
- Root includes, include arrays, और sibling overrides वाले includes OpenClaw-owned writes के लिए read-only हैं; वे writes कॉन्फ़िगरेशन को flatten करने के बजाय fail closed होते हैं।
- त्रुटियां: missing files, parse errors, circular includes, invalid path format, और excessive length के लिए स्पष्ट संदेश।

---

_संबंधित: [कॉन्फ़िगरेशन](/hi/gateway/configuration) · [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples)
