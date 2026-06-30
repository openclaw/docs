---
read_when:
    - आपको सटीक फ़ील्ड-स्तरीय कॉन्फ़िगरेशन अर्थ-व्यवहार या डिफ़ॉल्ट मान चाहिए
    - आप चैनल, मॉडल, Gateway या टूल कॉन्फ़िगरेशन ब्लॉक सत्यापित कर रहे हैं
summary: मुख्य OpenClaw कुंजियों, डिफ़ॉल्ट्स, और समर्पित सबसिस्टम संदर्भों के लिंक के लिए Gateway कॉन्फ़िग संदर्भ
title: कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-06-30T22:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` के लिए मुख्य कॉन्फ़िग संदर्भ। कार्य-उन्मुख अवलोकन के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

मुख्य OpenClaw कॉन्फ़िग सतहों को कवर करता है और जब किसी सबसिस्टम का अपना गहरा संदर्भ होता है तो उससे लिंक करता है। चैनल- और plugin-स्वामित्व वाले कमांड कैटलॉग और गहरे मेमोरी/QMD नॉब्स इस पेज के बजाय अपने अलग पेजों पर रहते हैं।

कोड सत्य:

- `openclaw config schema` सत्यापन और Control UI के लिए इस्तेमाल किया जाने वाला लाइव JSON Schema प्रिंट करता है, उपलब्ध होने पर bundled/plugin/channel मेटाडेटा मर्ज करके
- `config.schema.lookup` ड्रिल-डाउन टूलिंग के लिए एक path-scoped schema node लौटाता है
- `pnpm config:docs:check` / `pnpm config:docs:gen` मौजूदा schema surface के विरुद्ध config-doc baseline hash सत्यापित करते हैं

Agent lookup path: edits से पहले सटीक field-level docs और constraints के लिए
`gateway` tool action `config.schema.lookup` का उपयोग करें। कार्य-उन्मुख मार्गदर्शन के लिए
[Configuration](/hi/gateway/configuration) और व्यापक field map, defaults, और subsystem references के links के लिए यह पेज उपयोग करें।

समर्पित गहरे संदर्भ:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, और `plugins.entries.memory-core.config.dreaming` के अंतर्गत dreaming config के लिए [Memory configuration reference](/hi/reference/memory-config)
- मौजूदा built-in + bundled command catalog के लिए [Slash commands](/hi/tools/slash-commands)
- channel-specific command surfaces के लिए स्वामित्व वाले channel/plugin पेज

Config format **JSON5** है (comments + trailing commas allowed)। सभी fields optional हैं - omit किए जाने पर OpenClaw safe defaults उपयोग करता है।

---

## Channels

Per-channel config keys एक समर्पित पेज पर चले गए हैं - `channels.*` के लिए
[Configuration - channels](/hi/gateway/config-channels) देखें,
जिसमें Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, और अन्य
bundled channels (auth, access control, multi-account, mention gating) शामिल हैं।

## Agent defaults, multi-agent, sessions, and messages

एक समर्पित पेज पर ले जाया गया - देखें
[Configuration - agents](/hi/gateway/config-agents):

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (multi-agent routing और bindings)
- `session.*` (session lifecycle, compaction, pruning)
- `messages.*` (message delivery, TTS, markdown rendering)
- `talk.*` (Talk mode)
  - `talk.consultThinkingLevel`: Control UI Talk realtime consults के पीछे चलने वाले पूरे OpenClaw agent run के लिए thinking level override
  - `talk.consultFastMode`: Control UI Talk realtime consults के लिए one-shot fast-mode override
  - `talk.speechLocale`: iOS/macOS पर Talk speech recognition के लिए optional BCP 47 locale id
  - `talk.silenceTimeoutMs`: unset होने पर, Talk transcript भेजने से पहले platform default pause window रखता है (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: finalized realtime Talk transcripts के लिए Gateway relay fallback जो `openclaw_agent_consult` को skip करते हैं

## Tools and custom providers

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
- `models.providers.*.localService`: local model servers के लिए optional on-demand process manager। OpenClaw configured health endpoint को probe करता है, जरूरत होने पर absolute `command` start करता है, readiness का इंतजार करता है, फिर model request भेजता है। देखें [Local model services](/hi/gateway/local-model-services)।
- `models.pricing.enabled`: background pricing bootstrap को नियंत्रित करता है जो sidecars और channels के Gateway ready path तक पहुंचने के बाद शुरू होता है। जब `false` हो, Gateway OpenRouter और LiteLLM pricing-catalog fetches छोड़ देता है; configured `models.providers.*.models[].cost` values फिर भी local cost estimates के लिए काम करती हैं।

## MCP

OpenClaw-managed MCP server definitions `mcp.servers` के अंतर्गत रहती हैं और embedded OpenClaw तथा अन्य runtime adapters द्वारा consume की जाती हैं। `openclaw mcp list`,
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
  Remote entries `transport: "streamable-http"` या `transport: "sse"` उपयोग करती हैं;
  `type: "http"` एक CLI-native alias है जिसे `openclaw mcp set` और
  `openclaw doctor --fix` canonical `transport` field में normalize करते हैं।
- `mcp.servers.<name>.enabled`: saved server definition को बनाए रखते हुए embedded OpenClaw MCP discovery और tool projection से बाहर रखने के लिए `false` set करें।
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: per-server MCP request timeout seconds या milliseconds में।
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: per-server connection timeout seconds या milliseconds में।
- `mcp.servers.<name>.supportsParallelToolCalls`: adapters के लिए optional concurrency hint जो तय कर सकते हैं कि parallel MCP tool calls issue करने हैं या नहीं।
- `mcp.servers.<name>.auth`: OAuth की जरूरत वाले HTTP MCP servers के लिए `"oauth"` set करें। OpenClaw state के अंतर्गत tokens store करने के लिए `openclaw mcp login <name>` चलाएं।
- `mcp.servers.<name>.oauth`: optional OAuth scope, redirect URL, और client metadata URL overrides।
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: private endpoints और mutual TLS के लिए HTTP TLS controls।
- `mcp.servers.<name>.toolFilter`: optional per-server tool selection। `include`
  discovered MCP tools को matching names तक सीमित करता है; `exclude` matching names छिपाता है। Entries exact MCP tool names या simple `*` globs हैं। Resources या prompts वाले servers utility tool names (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) भी generate करते हैं, और वे names वही filter उपयोग करते हैं।
- `mcp.servers.<name>.codex`: optional Codex app-server projection controls।
  यह block केवल Codex app-server threads के लिए OpenClaw metadata है; यह ACP sessions, generic Codex harness config, या अन्य runtime adapters को affect नहीं करता।
  Non-empty `codex.agents` server को listed OpenClaw agent ids तक सीमित करता है।
  Empty, blank, या invalid scoped agent lists config validation द्वारा reject की जाती हैं
  और runtime projection path द्वारा global बनने के बजाय omit की जाती हैं।
  `codex.defaultToolsApprovalMode` उस server के लिए Codex का native
  `default_tools_approval_mode` emit करता है। OpenClaw native `mcp_servers` config Codex को pass करने से पहले `codex` block strip करता है। Server को हर Codex app-server agent के लिए Codex के default MCP approval behavior के साथ projected रखने के लिए block omit करें।
- `mcp.sessionIdleTtlMs`: session-scoped bundled MCP runtimes के लिए idle TTL।
  One-shot embedded runs run-end cleanup request करते हैं; यह TTL long-lived sessions और future callers के लिए backstop है।
- `mcp.*` के अंतर्गत changes cached session MCP runtimes dispose करके hot-apply होते हैं।
  अगली tool discovery/use उन्हें नए config से recreate करती है, इसलिए removed
  `mcp.servers` entries idle TTL का इंतजार करने के बजाय तुरंत reap हो जाती हैं।
- Runtime discovery MCP tool-list change notifications का भी honor करती है और
  उस session के cached catalog को drop करती है। Resources या prompts advertise करने वाले servers को resources list/read और prompts list/fetch करने के लिए utility tools मिलते हैं। Repeated tool-call failures affected server को briefly pause करते हैं, फिर दूसरा call attempt किया जाता है।

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

- `allowBundled`: केवल bundled skills के लिए optional allowlist (managed/workspace skills अप्रभावित)।
- `load.extraDirs`: extra shared skill roots (lowest precedence)।
- `load.allowSymlinkTargets`: trusted real target roots जिनमें skill symlinks resolve हो सकते हैं, जब link अपने configured source root के बाहर रहता है।
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply को पहले से trusted symlink targets के through write करने देता है (default: false)।
- `install.preferBrew`: true होने पर, `brew` available होने पर other installer kinds पर fallback करने से पहले Homebrew installers को prefer करें।
- `install.nodeManager`: `metadata.openclaw.install` specs के लिए node installer preference (`npm` | `pnpm` | `yarn` | `bun`)।
- `install.allowUploadedArchives`: trusted `operator.admin` Gateway clients को `skills.upload.*` के through staged private zip archives install करने की अनुमति दें (default: false)। यह केवल uploaded-archive path enable करता है; normal ClawHub installs को इसकी जरूरत नहीं होती।
- `entries.<skillKey>.enabled: false` skill को disable करता है, भले ही वह bundled/installed हो।
- `entries.<skillKey>.apiKey`: primary env var declare करने वाली skills के लिए सुविधा (plaintext string या SecretRef object)।

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
- standalone Plugin files को `plugins.load.paths` में रखें; auto-discovered extension roots top-level `.js`, `.mjs`, और `.ts` files को अनदेखा करते हैं ताकि उन roots में helper scripts startup को block न करें।
- Discovery native OpenClaw Plugins के साथ compatible Codex bundles और Claude bundles स्वीकार करता है, जिसमें manifestless Claude default-layout bundles भी शामिल हैं।
- **Config changes के लिए Gateway restart आवश्यक है।**
- `allow`: वैकल्पिक allowlist (केवल सूचीबद्ध Plugins load होते हैं)। `deny` जीतता है।
- `plugins.entries.<id>.apiKey`: Plugin-level API key सुविधा field (जब Plugin द्वारा supported हो)।
- `plugins.entries.<id>.env`: Plugin-scoped env var map।
- `plugins.entries.<id>.hooks.allowPromptInjection`: जब `false` हो, core `before_prompt_build` को block करता है और legacy `before_agent_start` से prompt-mutating fields को अनदेखा करता है, जबकि legacy `modelOverride` और `providerOverride` को बनाए रखता है। native Plugin hooks और supported bundle-provided hook directories पर लागू होता है।
- `plugins.entries.<id>.hooks.allowConversationAccess`: जब `true` हो, trusted non-bundled Plugins raw conversation content को `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, और `agent_end` जैसे typed hooks से पढ़ सकते हैं।
- `plugins.entries.<id>.subagent.allowModelOverride`: background subagent runs के लिए per-run `provider` और `model` overrides मांगने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.subagent.allowedModels`: trusted subagent overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप सचमुच किसी भी model को allow करना चाहते हों।
- `plugins.entries.<id>.llm.allowModelOverride`: `api.runtime.llm.complete` के लिए model overrides मांगने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.llm.allowedModels`: trusted Plugin LLM completion overrides के लिए canonical `provider/model` targets की वैकल्पिक allowlist। `"*"` का उपयोग केवल तब करें जब आप सचमुच किसी भी model को allow करना चाहते हों।
- `plugins.entries.<id>.llm.allowAgentIdOverride`: non-default agent id के विरुद्ध `api.runtime.llm.complete` चलाने हेतु इस Plugin पर स्पष्ट रूप से trust करें।
- `plugins.entries.<id>.config`: Plugin-defined config object (उपलब्ध होने पर native OpenClaw Plugin schema द्वारा validated)।
- Channel Plugin account/runtime settings `channels.<id>` के अंतर्गत रहते हैं और इन्हें owning Plugin के manifest `channelConfigs` metadata द्वारा describe किया जाना चाहिए, किसी central OpenClaw option registry द्वारा नहीं।

### Codex harness Plugin config

bundled `codex` Plugin native Codex app-server harness settings का स्वामी है, जो
`plugins.entries.codex.config` के अंतर्गत हैं। पूरे config
surface के लिए [Codex harness reference](/hi/plugins/codex-harness-reference) और runtime model के लिए [Codex harness](/hi/plugins/codex-harness) देखें।

`codexPlugins` केवल उन sessions पर लागू होता है जो native Codex harness चुनते हैं।
यह OpenClaw provider runs, ACP conversation bindings, या किसी non-Codex harness के लिए Codex Plugins enable नहीं करता।

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
  Plugin/app support enable करता है। Default: `false`।
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  migrated Plugin app elicitations के लिए default destructive-action policy।
  safe Codex approval schemas को बिना prompt किए accept करने के लिए `true`, उन्हें decline करने के लिए `false`,
  Codex-required approvals को OpenClaw
  Plugin approvals के माध्यम से route करने के लिए `"auto"`, या durable approval के बिना हर Plugin write/destructive
  action के लिए पूछने हेतु `"always"` का उपयोग करें। `"always"` mode thread शुरू करने से पहले affected app के लिए durable Codex
  per-tool approval overrides clear करता है।
  Default: `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: जब global `codexPlugins.enabled` भी true हो, तब migrated Plugin entry enable करता है।
  Default: explicit entries के लिए `true`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stable marketplace identity। V1 केवल `"openai-curated"` support करता है।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration से stable
  Codex Plugin identity, उदाहरण के लिए `"google-calendar"`।
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  per-Plugin destructive-action override। छोड़े जाने पर, global
  `allow_destructive_actions` value का उपयोग होता है। per-Plugin value वही
  `true`, `false`, `"auto"`, या `"always"` policies स्वीकार करती है।

`codexPlugins.enabled` global enablement directive है। migration द्वारा लिखी गई explicit Plugin
entries durable install और repair eligibility set हैं।
`plugins["*"]` supported नहीं है, कोई `install` switch नहीं है, और local
`marketplacePath` values जानबूझकर config fields नहीं हैं क्योंकि वे
host-specific हैं।

`app/list` readiness checks एक घंटे के लिए cached रहते हैं और stale होने पर
asynchronously refreshed होते हैं। Codex thread app config Codex harness
session establishment पर computed होता है, हर turn पर नहीं; native Plugin config बदलने के बाद `/new`, `/reset`, या Gateway
restart का उपयोग करें।

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider settings।
  - `apiKey`: higher limits के लिए वैकल्पिक Firecrawl API key (SecretRef स्वीकार करता है)। `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, या `FIRECRAWL_API_KEY` env var पर fall back करता है।
  - `baseUrl`: Firecrawl API base URL (default: `https://api.firecrawl.dev`; self-hosted overrides को private/internal endpoints target करने चाहिए)।
  - `onlyMainContent`: pages से केवल main content extract करें (default: `true`)।
  - `maxAgeMs`: milliseconds में maximum cache age (default: `172800000` / 2 days)।
  - `timeoutSeconds`: seconds में scrape request timeout (default: `60`)।
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) settings।
  - `enabled`: X Search provider enable करें।
  - `model`: search के लिए उपयोग किया जाने वाला Grok model (जैसे `"grok-4-1-fast"`)।
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming settings। phases और thresholds के लिए [Dreaming](/hi/concepts/dreaming) देखें।
  - `enabled`: master Dreaming switch (default `false`)।
  - `frequency`: प्रत्येक full Dreaming sweep के लिए Cron cadence (default रूप से `"0 3 * * *"`)।
  - `model`: वैकल्पिक Dream Diary subagent model override। `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है; targets को restrict करने के लिए `allowedModels` के साथ pair करें। Model-unavailable errors session default model के साथ एक बार retry करते हैं; trust या allowlist failures silently fall back नहीं करते।
  - phase policy और thresholds implementation details हैं (user-facing config keys नहीं)।
- पूरा memory config [Memory configuration reference](/hi/reference/memory-config) में है:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Enabled Claude bundle Plugins `settings.json` से embedded OpenClaw defaults भी contribute कर सकते हैं; OpenClaw उन्हें sanitized agent settings के रूप में apply करता है, raw OpenClaw config patches के रूप में नहीं।
- `plugins.slots.memory`: active memory Plugin id चुनें, या memory Plugins disable करने के लिए `"none"`।
- `plugins.slots.contextEngine`: active context engine Plugin id चुनें; जब तक आप कोई दूसरा engine install और select नहीं करते, default `"legacy"` होता है।

[Plugins](/hi/tools/plugin) देखें।

---

## Commitments

`commitments` inferred follow-up memory नियंत्रित करता है: OpenClaw conversation turns से check-ins detect कर सकता है और उन्हें Heartbeat runs के माध्यम से deliver कर सकता है।

- `commitments.enabled`: inferred follow-up commitments के लिए hidden LLM extraction, storage, और Heartbeat delivery enable करें। Default: `false`।
- `commitments.maxPerDay`: rolling day में प्रति agent session deliver किए गए अधिकतम inferred follow-up commitments। Default: `3`।

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
- `tabCleanup` निष्क्रिय समय के बाद या किसी session के अपनी सीमा पार करने पर ट्रैक किए गए primary-agent tabs को वापस प्राप्त करता है। उन अलग-अलग cleanup modes को अक्षम करने के लिए `idleMinutes: 0` या `maxTabsPerSession: 0` सेट करें।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` सेट न होने पर अक्षम रहता है, इसलिए browser navigation डिफ़ॉल्ट रूप से सख्त रहती है।
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` केवल तब सेट करें जब आप जानबूझकर private-network browser navigation पर भरोसा करते हों।
- सख्त मोड में, remote CDP profile endpoints (`profiles.*.cdpUrl`) reachability/discovery checks के दौरान उसी private-network blocking के अधीन होते हैं।
- `ssrfPolicy.allowPrivateNetwork` legacy alias के रूप में समर्थित रहता है।
- सख्त मोड में, स्पष्ट अपवादों के लिए `ssrfPolicy.hostnameAllowlist` और `ssrfPolicy.allowedHostnames` का उपयोग करें।
- Remote profiles केवल attach-only हैं (start/stop/reset अक्षम)।
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://`, और `wss://` स्वीकार करता है।
  जब आप चाहते हैं कि OpenClaw `/json/version` खोजे, तो HTTP(S) का उपयोग करें; जब आपका provider आपको सीधा DevTools WebSocket URL देता है, तो WS(S) का उपयोग करें।
- `remoteCdpTimeoutMs` और `remoteCdpHandshakeTimeoutMs` remote और `attachOnly` CDP reachability के साथ-साथ tab-opening requests पर लागू होते हैं। Managed loopback profiles local CDP defaults बनाए रखते हैं।
- यदि बाहरी रूप से managed CDP service loopback के माध्यम से reachable है, तो उस profile का `attachOnly: true` सेट करें; अन्यथा OpenClaw loopback port को local managed browser profile मानता है और local port ownership errors रिपोर्ट कर सकता है।
- `existing-session` profiles CDP के बजाय Chrome MCP का उपयोग करते हैं और चुने गए host पर या connected browser node के माध्यम से attach कर सकते हैं।
- `existing-session` profiles Brave या Edge जैसे किसी विशिष्ट Chromium-आधारित browser profile को target करने के लिए `userDataDir` सेट कर सकते हैं।
- जब Chrome पहले से DevTools HTTP(S) discovery endpoint या direct WS(S) endpoint के पीछे चल रहा हो, तो `existing-session` profiles `cdpUrl` सेट कर सकते हैं। उस मोड में OpenClaw auto-connect का उपयोग करने के बजाय endpoint को Chrome MCP को पास करता है; Chrome MCP launch arguments के लिए `userDataDir` अनदेखा किया जाता है।
- `existing-session` profiles मौजूदा Chrome MCP route limits बनाए रखते हैं:
  CSS-selector targeting के बजाय snapshot/ref-driven actions, one-file upload hooks, कोई dialog timeout overrides नहीं, कोई `wait --load networkidle` नहीं, और कोई `responsebody`, PDF export, download interception, या batch actions नहीं।
- Local managed `openclaw` profiles `cdpPort` और `cdpUrl` अपने-आप assign करते हैं; `cdpUrl` स्पष्ट रूप से केवल remote CDP profiles या existing-session endpoint attach के लिए सेट करें।
- Local managed profiles उस profile के लिए global `browser.executablePath` को override करने के लिए `executablePath` सेट कर सकते हैं। इसका उपयोग एक profile को Chrome में और दूसरे को Brave में चलाने के लिए करें।
- Local managed profiles process start के बाद Chrome CDP HTTP discovery के लिए `browser.localLaunchTimeoutMs` और post-launch CDP websocket readiness के लिए `browser.localCdpReadyTimeoutMs` का उपयोग करते हैं। उन्हें धीमे hosts पर बढ़ाएँ, जहाँ Chrome सफलतापूर्वक शुरू होता है लेकिन readiness checks startup से race करते हैं। दोनों values `120000` ms तक के positive integers होने चाहिए; invalid config values अस्वीकार कर दी जाती हैं।
- Auto-detect order: default browser यदि Chromium-आधारित हो → Chrome → Brave → Edge → Chromium → Chrome Canary।
- `browser.executablePath` और `browser.profiles.<name>.executablePath` दोनों Chromium launch से पहले आपके OS home directory के लिए `~` और `~/...` स्वीकार करते हैं।
  `existing-session` profiles पर per-profile `userDataDir` भी tilde-expanded होता है।
- Control service: केवल loopback (port `gateway.port` से derived, default `18791`)।
- `extraArgs` local Chromium startup में extra launch flags जोड़ता है (उदाहरण के लिए `--disable-gpu`, window sizing, या debug flags)।

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

- `mode`: `local` (Gateway चलाएं) या `remote` (रिमोट Gateway से कनेक्ट करें). Gateway तब तक शुरू होने से इनकार करता है जब तक यह `local` न हो.
- `port`: WS + HTTP के लिए एकल multiplexed पोर्ट. प्राथमिकता: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (डिफ़ॉल्ट), `lan` (`0.0.0.0`), `tailnet` (केवल Tailscale IP), या `custom`.
- **लेगेसी bind उपनाम**: `gateway.bind` में bind मोड मानों का उपयोग करें (`auto`, `loopback`, `lan`, `tailnet`, `custom`), होस्ट उपनामों का नहीं (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker नोट**: डिफ़ॉल्ट `loopback` bind कंटेनर के अंदर `127.0.0.1` पर सुनता है. Docker ब्रिज नेटवर्किंग (`-p 18789:18789`) के साथ, ट्रैफ़िक `eth0` पर आता है, इसलिए Gateway पहुंच से बाहर रहता है. सभी इंटरफ़ेस पर सुनने के लिए `--network host` का उपयोग करें, या `bind: "lan"` सेट करें (या `customBindHost: "0.0.0.0"` के साथ `bind: "custom"`).
- **Auth**: डिफ़ॉल्ट रूप से आवश्यक. non-loopback binds के लिए Gateway auth आवश्यक है. व्यवहार में इसका अर्थ है साझा टोकन/पासवर्ड या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy. Onboarding wizard डिफ़ॉल्ट रूप से टोकन बनाता है.
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं (SecretRefs सहित), तो `gateway.auth.mode` को स्पष्ट रूप से `token` या `password` पर सेट करें. दोनों कॉन्फ़िगर होने और मोड unset रहने पर startup और service install/repair flows विफल होते हैं.
- `gateway.auth.mode: "none"`: स्पष्ट no-auth मोड. केवल भरोसेमंद local loopback सेटअप के लिए उपयोग करें; इसे जानबूझकर onboarding prompts में पेश नहीं किया जाता.
- `gateway.auth.mode: "trusted-proxy"`: browser/user auth को identity-aware reverse proxy को सौंपें और `gateway.trustedProxies` से identity headers पर भरोसा करें (देखें [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth)). यह मोड डिफ़ॉल्ट रूप से **non-loopback** proxy source अपेक्षित करता है; same-host loopback reverse proxies के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है. आंतरिक same-host callers स्थानीय direct fallback के रूप में `gateway.auth.password` का उपयोग कर सकते हैं; `gateway.auth.token` trusted-proxy mode के साथ mutually exclusive रहता है.
- `gateway.auth.allowTailscale`: जब `true` हो, Tailscale Serve identity headers Control UI/WebSocket auth को संतुष्ट कर सकते हैं (`tailscale whois` के ज़रिए सत्यापित). HTTP API endpoints उस Tailscale header auth का उपयोग **नहीं** करते; वे इसके बजाय Gateway के सामान्य HTTP auth mode का पालन करते हैं. यह tokenless flow मानता है कि Gateway host भरोसेमंद है. `tailscale.mode = "serve"` होने पर डिफ़ॉल्ट `true`.
- `gateway.auth.rateLimit`: वैकल्पिक failed-auth limiter. प्रति client IP और प्रति auth scope लागू होता है (shared-secret और device-token स्वतंत्र रूप से track किए जाते हैं). अवरोधित प्रयास `429` + `Retry-After` लौटाते हैं.
  - async Tailscale Serve Control UI path पर, समान `{scope, clientIp}` के failed attempts failure write से पहले serialize किए जाते हैं. इसलिए एक ही client से concurrent bad attempts, दोनों के plain mismatches की तरह race through करने के बजाय, दूसरे request पर limiter trip कर सकते हैं.
  - `gateway.auth.rateLimit.exemptLoopback` डिफ़ॉल्ट रूप से `true` है; जब आप जानबूझकर localhost traffic को भी rate-limited करना चाहते हों (test setups या strict proxy deployments के लिए), तो `false` सेट करें.
- Browser-origin WS auth attempts हमेशा loopback exemption disabled के साथ throttle किए जाते हैं (browser-based localhost brute force के खिलाफ defense-in-depth).
- loopback पर, वे browser-origin lockouts normalized `Origin`
  value के अनुसार अलग-थलग रहते हैं, इसलिए एक localhost origin से दोहराई गई failures किसी अलग origin को अपने-आप
  lock out नहीं करतीं.
- `tailscale.mode`: `serve` (केवल tailnet, loopback bind) या `funnel` (public, auth आवश्यक).
- `tailscale.serviceName`: Serve mode के लिए वैकल्पिक Tailscale Service नाम, जैसे
  `svc:openclaw`. सेट होने पर, OpenClaw इसे `tailscale serve
--service` को पास करता है ताकि Control UI को device hostname के बजाय named Service के माध्यम से expose किया जा सके. मान को Tailscale के `svc:<dns-label>`
  Service name format का उपयोग करना होगा; startup derived Service URL रिपोर्ट करता है.
- `tailscale.preserveFunnel`: जब `true` हो और `tailscale.mode = "serve"`, OpenClaw
  startup पर Serve फिर से लागू करने से पहले `tailscale funnel status` जांचता है और यदि externally configured Funnel route पहले से Gateway port को cover करता है तो
  इसे skip करता है. डिफ़ॉल्ट `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket connects के लिए स्पष्ट browser-origin allowlist. public non-loopback browser origins के लिए आवश्यक. loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से आने वाले private same-origin LAN/Tailnet UI loads Host-header fallback सक्षम किए बिना स्वीकार किए जाते हैं.
- `controlUi.chatMessageMaxWidth`: grouped Control UI chat messages के लिए वैकल्पिक max-width. `960px`, `82%`, `min(1280px, 82%)`, और `calc(100% - 2rem)` जैसे constrained CSS width values स्वीकार करता है.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: खतरनाक मोड जो उन deployments के लिए Host-header origin fallback सक्षम करता है जो जानबूझकर Host-header origin policy पर निर्भर करते हैं.
- `remote.transport`: `ssh` (डिफ़ॉल्ट) या `direct` (ws/wss). `direct` के लिए, public hosts के लिए `remote.url` का `wss://` होना आवश्यक है; plaintext `ws://` केवल loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT hosts के लिए स्वीकार किया जाता है.
- `remote.remotePort`: remote SSH host पर Gateway port. डिफ़ॉल्ट `18789`; जब local tunnel port, remote Gateway port से अलग हो, तब इसका उपयोग करें.
- `gateway.remote.token` / `.password` remote-client credential fields हैं. वे अपने-आप Gateway auth कॉन्फ़िगर नहीं करते.
- `gateway.push.apns.relay.baseUrl`: external APNs relay के लिए base HTTPS URL, जिसका उपयोग relay-backed iOS builds द्वारा Gateway पर registrations publish करने के बाद किया जाता है. Public App Store/TestFlight builds hosted OpenClaw relay का उपयोग करते हैं. Custom relay URLs को जानबूझकर अलग iOS build/deployment path से match करना होगा जिसका relay URL उसी relay की ओर point करता हो.
- `gateway.push.apns.relay.timeoutMs`: Gateway-to-relay send timeout milliseconds में. डिफ़ॉल्ट `10000`.
- Relay-backed registrations किसी विशिष्ट Gateway identity को delegate किए जाते हैं. paired iOS app `gateway.identity.get` fetch करता है, relay registration में वह identity शामिल करता है, और registration-scoped send grant को Gateway तक forward करता है. दूसरा Gateway उस stored registration का पुनः उपयोग नहीं कर सकता.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ऊपर के relay config के लिए अस्थायी env overrides.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URLs के लिए केवल-development escape hatch. Production relay URLs HTTPS पर ही रहने चाहिए.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket handshake timeout milliseconds में. डिफ़ॉल्ट: `15000`. सेट होने पर `OPENCLAW_HANDSHAKE_TIMEOUT_MS` प्राथमिकता लेता है. इसे loaded या low-powered hosts पर बढ़ाएं, जहां local clients startup warmup के स्थिर होने के दौरान connect कर सकते हैं.
- `gateway.channelHealthCheckMinutes`: channel health-monitor interval minutes में. health-monitor restarts को globally disable करने के लिए `0` सेट करें. डिफ़ॉल्ट: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socket threshold minutes में. इसे `gateway.channelHealthCheckMinutes` से अधिक या बराबर रखें. डिफ़ॉल्ट: `30`.
- `gateway.channelMaxRestartsPerHour`: rolling hour में प्रति channel/account अधिकतम health-monitor restarts. डिफ़ॉल्ट: `10`.
- `channels.<provider>.healthMonitor.enabled`: global monitor enabled रखते हुए health-monitor restarts के लिए per-channel opt-out.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account channels के लिए per-account override. सेट होने पर, यह channel-level override पर प्राथमिकता लेता है.
- Local Gateway call paths केवल तब fallback के रूप में `gateway.remote.*` का उपयोग कर सकते हैं जब `gateway.auth.*` unset हो.
- यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के माध्यम से स्पष्ट रूप से कॉन्फ़िगर है और unresolved है, तो resolution fails closed (कोई remote fallback masking नहीं).
- `trustedProxies`: reverse proxy IPs जो TLS terminate करते हैं या forwarded-client headers inject करते हैं. केवल उन proxies को सूचीबद्ध करें जिन्हें आप नियंत्रित करते हैं. Loopback entries same-host proxy/local-detection setups (उदाहरण के लिए Tailscale Serve या local reverse proxy) के लिए फिर भी valid हैं, लेकिन वे loopback requests को `gateway.auth.mode: "trusted-proxy"` के लिए eligible **नहीं** बनाते.
- `allowRealIpFallback`: जब `true` हो, तो `X-Forwarded-For` missing होने पर Gateway `X-Real-IP` स्वीकार करता है. fail-closed behavior के लिए डिफ़ॉल्ट `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: बिना requested scopes के first-time node device pairing को auto-approve करने के लिए वैकल्पिक CIDR/IP allowlist. unset होने पर यह disabled है. यह operator/browser/Control UI/WebChat pairing को auto-approve नहीं करता, और role, scope, metadata, या public-key upgrades को भी auto-approve नहीं करता.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairing और platform allowlist evaluation के बाद declared node commands के लिए global allow/deny shaping. `camera.snap`, `camera.clip`, और `screen.record` जैसे dangerous node commands में opt in करने के लिए `allowCommands` का उपयोग करें; `denyCommands` किसी command को हटा देता है, भले ही platform default या explicit allow उसे अन्यथा शामिल करता. node द्वारा अपनी declared command list बदलने के बाद, उस device pairing को reject करें और फिर से approve करें ताकि Gateway updated command snapshot store करे.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` के लिए blocked extra tool names (default deny list को extend करता है).
- `gateway.tools.allow`: owner/admin callers के लिए default HTTP deny list से tool names हटाएं.
  यह identity-bearing `operator.write` callers को owner/admin access में upgrade नहीं करता; `cron`, `gateway`, और `nodes` allowlisted होने पर भी
  non-owner callers के लिए unavailable रहते हैं.

</Accordion>

### OpenAI-संगत एंडपॉइंट्स

- Admin HTTP RPC: `admin-http-rpc` plugin के रूप में डिफ़ॉल्ट रूप से बंद. `POST /api/v1/admin/rpc` register करने के लिए plugin सक्षम करें. देखें [Admin HTTP RPC](/hi/plugins/admin-http-rpc).
- Chat Completions: डिफ़ॉल्ट रूप से disabled. `gateway.http.endpoints.chatCompletions.enabled: true` से सक्षम करें.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    खाली allowlists को unset माना जाता है; URL fetching disable करने के लिए `gateway.http.endpoints.responses.files.allowUrl=false`
    और/या `gateway.http.endpoints.responses.images.allowUrl=false` का उपयोग करें.
- वैकल्पिक response hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity` (केवल उन HTTPS origins के लिए सेट करें जिन्हें आप नियंत्रित करते हैं; देखें [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-instance isolation

एक host पर unique ports और state dirs के साथ कई gateways चलाएं:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

सुविधा flags: `--dev` (`~/.openclaw-dev` + port `19001` का उपयोग करता है), `--profile <name>` (`~/.openclaw-<name>` का उपयोग करता है).

देखें [Multiple Gateways](/hi/gateway/multiple-gateways).

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

- `enabled`: Gateway listener (HTTPS/WSS) पर TLS termination सक्षम करता है (डिफ़ॉल्ट: `false`).
- `autoGenerate`: explicit files कॉन्फ़िगर न होने पर local self-signed cert/key pair auto-generate करता है; केवल local/dev उपयोग के लिए.
- `certPath`: TLS certificate file का filesystem path.
- `keyPath`: TLS private key file का filesystem path; permissions restricted रखें.
- `caPath`: client verification या custom trust chains के लिए वैकल्पिक CA bundle path.

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

- `mode`: रनटाइम पर कॉन्फ़िगरेशन संपादन कैसे लागू होते हैं, इसे नियंत्रित करता है।
  - `"off"`: लाइव संपादन अनदेखा करें; बदलावों के लिए स्पष्ट रीस्टार्ट आवश्यक है।
  - `"restart"`: कॉन्फ़िगरेशन बदलने पर हमेशा gateway प्रक्रिया रीस्टार्ट करें।
  - `"hot"`: रीस्टार्ट किए बिना इन-प्रोसेस बदलाव लागू करें।
  - `"hybrid"` (डिफ़ॉल्ट): पहले hot reload आज़माएँ; आवश्यकता होने पर रीस्टार्ट पर वापस जाएँ।
- `debounceMs`: कॉन्फ़िगरेशन बदलाव लागू होने से पहले ms में debounce विंडो (गैर-ऋणात्मक पूर्णांक)।
- `deferralTimeoutMs`: रीस्टार्ट या channel hot reload को बाध्य करने से पहले चल रहे ऑपरेशनों की प्रतीक्षा करने का वैकल्पिक अधिकतम समय, ms में। डिफ़ॉल्ट सीमित प्रतीक्षा (`300000`) का उपयोग करने के लिए इसे छोड़ दें; अनिश्चितकाल तक प्रतीक्षा करने और आवधिक अभी-लंबित चेतावनियाँ लॉग करने के लिए `0` सेट करें।

---

## हुक्स

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
क्वेरी-स्ट्रिंग hook token अस्वीकार किए जाते हैं।

सत्यापन और सुरक्षा नोट्स:

- `hooks.enabled=true` के लिए गैर-रिक्त `hooks.token` आवश्यक है।
- `hooks.token` सक्रिय Gateway shared-secret auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) से अलग होना चाहिए; दोबारा उपयोग का पता चलने पर startup एक non-fatal सुरक्षा चेतावनी लॉग करता है।
- `openclaw security audit` hook/Gateway auth के दोबारा उपयोग को critical finding के रूप में चिह्नित करता है, जिसमें केवल audit समय पर दिया गया Gateway password auth (`--auth password --password <password>`) भी शामिल है। persist किए गए reused `hooks.token` को rotate करने के लिए `openclaw doctor --fix` चलाएँ, फिर बाहरी hook senders को नए hook token का उपयोग करने के लिए अपडेट करें।
- `hooks.path` `/` नहीं हो सकता; `/hooks` जैसा dedicated subpath उपयोग करें।
- अगर `hooks.allowRequestSessionKey=true` है, तो `hooks.allowedSessionKeyPrefixes` सीमित करें (उदाहरण के लिए `["hook:"]`)।
- अगर कोई mapping या preset templated `sessionKey` उपयोग करता है, तो `hooks.allowedSessionKeyPrefixes` और `hooks.allowRequestSessionKey=true` सेट करें। Static mapping keys के लिए वह opt-in आवश्यक नहीं है।

**एंडपॉइंट्स:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - request payload से `sessionKey` केवल तब स्वीकार किया जाता है जब `hooks.allowRequestSessionKey=true` हो (डिफ़ॉल्ट: `false`)।
- `POST /hooks/<name>` → `hooks.mappings` के माध्यम से resolve किया जाता है
  - Template-rendered mapping `sessionKey` मान externally supplied माने जाते हैं और इनके लिए भी `hooks.allowRequestSessionKey=true` आवश्यक है।

<Accordion title="Mapping विवरण">

- `match.path` `/hooks` के बाद sub-path से match करता है (जैसे `/hooks/gmail` → `gmail`)।
- `match.source` generic paths के लिए payload field से match करता है।
- `{{messages[0].subject}}` जैसे templates payload से पढ़ते हैं।
- `transform` hook action लौटाने वाले JS/TS module की ओर point कर सकता है।
  - `transform.module` relative path होना चाहिए और `hooks.transformsDir` के भीतर रहता है (absolute paths और traversal अस्वीकार किए जाते हैं)।
  - `hooks.transformsDir` को `~/.openclaw/hooks/transforms` के तहत रखें; workspace skill directories अस्वीकार की जाती हैं। अगर `openclaw doctor` इस path को invalid बताता है, तो transform module को hooks transforms directory में move करें या `hooks.transformsDir` हटाएँ।
- `agentId` किसी specific agent को route करता है; unknown IDs default agent पर वापस जाते हैं।
- `allowedAgentIds`: effective agent routing को सीमित करता है, जिसमें `agentId` छोड़े जाने पर default-agent path भी शामिल है (`*` या omitted = सभी allow, `[]` = सभी deny)।
- `defaultSessionKey`: explicit `sessionKey` के बिना hook agent runs के लिए वैकल्पिक fixed session key।
- `allowRequestSessionKey`: `/hooks/agent` callers और template-driven mapping session keys को `sessionKey` सेट करने की अनुमति दें (डिफ़ॉल्ट: `false`)।
- `allowedSessionKeyPrefixes`: explicit `sessionKey` values (request + mapping) के लिए वैकल्पिक prefix allowlist, जैसे `["hook:"]`। जब कोई mapping या preset templated `sessionKey` उपयोग करता है, तब यह required हो जाता है।
- `deliver: true` final reply को channel पर भेजता है; `channel` का डिफ़ॉल्ट `last` है।
- `model` इस hook run के लिए LLM override करता है (model catalog सेट होने पर allowed होना चाहिए)।

</Accordion>

### Gmail integration

- built-in Gmail preset `sessionKey: "hook:gmail:{{messages[0].id}}"` का उपयोग करता है।
- अगर आप वह per-message routing रखते हैं, तो `hooks.allowRequestSessionKey: true` सेट करें और `hooks.allowedSessionKeyPrefixes` को Gmail namespace से match करने के लिए सीमित करें, उदाहरण के लिए `["hook:", "hook:gmail:"]`।
- अगर आपको `hooks.allowRequestSessionKey: false` चाहिए, तो templated default के बजाय static `sessionKey` से preset को override करें।

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

- configured होने पर Gateway boot पर `gog gmail watch serve` को auto-start करता है। disable करने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।
- Gateway के साथ अलग `gog gmail watch serve` न चलाएँ।

---

## Canvas Plugin host

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

- Gateway port के तहत HTTP पर agent-editable HTML/CSS/JS और A2UI serve करता है:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- केवल local: `gateway.bind: "loopback"` (डिफ़ॉल्ट) रखें।
- non-loopback binds: canvas routes के लिए अन्य Gateway HTTP surfaces की तरह Gateway auth (token/password/trusted-proxy) आवश्यक है।
- Node WebViews आम तौर पर auth headers नहीं भेजते; node pair और connect होने के बाद, Gateway canvas/A2UI access के लिए node-scoped capability URLs advertise करता है।
- Capability URLs active node WS session से bound होते हैं और जल्दी expire होते हैं। IP-based fallback उपयोग नहीं किया जाता।
- served HTML में live-reload client inject करता है।
- खाली होने पर starter `index.html` auto-create करता है।
- A2UI को `/__openclaw__/a2ui/` पर भी serve करता है।
- बदलावों के लिए gateway restart आवश्यक है।
- बड़े directories या `EMFILE` errors के लिए live reload disable करें।

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

- `minimal` (जब bundled `bonjour` Plugin enabled हो, तब डिफ़ॉल्ट): TXT records से `cliPath` + `sshPort` छोड़ें।
- `full`: `cliPath` + `sshPort` शामिल करें; LAN multicast advertising के लिए फिर भी bundled `bonjour` Plugin enabled होना आवश्यक है।
- `off`: Plugin enablement बदले बिना LAN multicast advertising suppress करें।
- bundled `bonjour` Plugin macOS hosts पर auto-start होता है और Linux, Windows, तथा containerized Gateway deployments पर opt-in है।
- Hostname का डिफ़ॉल्ट system hostname होता है, जब वह valid DNS label हो, अन्यथा `openclaw` पर fallback होता है। `OPENCLAW_MDNS_HOSTNAME` से override करें।

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

यूनिकास्ट DNS-SD ज़ोन को `~/.openclaw/dns/` के अंतर्गत लिखता है। क्रॉस-नेटवर्क डिस्कवरी के लिए, इसे DNS server (CoreDNS अनुशंसित) + Tailscale split DNS के साथ जोड़ें।

सेटअप: `openclaw dns setup --apply`.

---

## पर्यावरण

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

- इनलाइन env vars केवल तब लागू होते हैं जब process env में key मौजूद न हो।
- `.env` फ़ाइलें: CWD `.env` + `~/.openclaw/.env` (दोनों मौजूदा vars को override नहीं करतीं)।
- `shellEnv`: आपके login shell profile से गायब अपेक्षित keys आयात करता है।
- पूर्ण प्राथमिकता क्रम के लिए [पर्यावरण](/hi/help/environment) देखें।

### Env var प्रतिस्थापन

किसी भी config string में env vars को `${VAR_NAME}` से संदर्भित करें:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- केवल uppercase नाम match होते हैं: `[A-Z_][A-Z0-9_]*`.
- गायब/खाली vars config load के समय error फेंकते हैं।
- शाब्दिक `${VAR}` के लिए `$${VAR}` से escape करें।
- `$include` के साथ काम करता है।

---

## सीक्रेट्स

Secret refs additive हैं: plaintext values अब भी काम करते हैं।

### `SecretRef`

एक object shape का उपयोग करें:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

सत्यापन:

- `provider` pattern: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id pattern: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: absolute JSON pointer (उदाहरण के लिए `"/providers/openai/apiKey"`)
- `source: "exec"` id pattern: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS-style `secret#json_key` selectors का समर्थन करता है)
- `source: "exec"` ids में `.` या `..` slash-delimited path segments नहीं होने चाहिए (उदाहरण के लिए `a/../b` अस्वीकार किया जाता है)

### समर्थित credential surface

- Canonical matrix: [SecretRef Credential Surface](/hi/reference/secretref-credential-surface)
- `secrets apply` समर्थित `openclaw.json` credential paths को target करता है।
- `auth-profiles.json` refs runtime resolution और audit coverage में शामिल हैं।

### Secret providers config

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

- `file` provider `mode: "json"` और `mode: "singleValue"` का समर्थन करता है (`singleValue` mode में `id` को `"value"` होना चाहिए)।
- Windows ACL verification अनुपलब्ध होने पर file और exec provider paths fail closed करते हैं। `allowInsecurePath: true` केवल उन trusted paths के लिए set करें जिन्हें verify नहीं किया जा सकता।
- `exec` provider को absolute `command` path चाहिए और stdin/stdout पर protocol payloads का उपयोग करता है।
- default रूप से, symlink command paths अस्वीकार किए जाते हैं। resolved target path validate करते हुए symlink paths की अनुमति देने के लिए `allowSymlinkCommand: true` set करें।
- यदि `trustedDirs` configured है, तो trusted-dir check resolved target path पर लागू होता है।
- `exec` child environment default रूप से minimal होता है; आवश्यक variables को `passEnv` के साथ स्पष्ट रूप से pass करें।
- Secret refs activation time पर in-memory snapshot में resolve किए जाते हैं, फिर request paths केवल snapshot पढ़ते हैं।
- Active-surface filtering activation के दौरान लागू होती है: enabled surfaces पर unresolved refs startup/reload fail करते हैं, जबकि inactive surfaces diagnostics के साथ skip किए जाते हैं।

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

- प्रति-एजेंट प्रोफाइल `<agentDir>/auth-profiles.json` पर संग्रहीत होती हैं।
- `auth-profiles.json` स्थिर क्रेडेंशियल मोड के लिए वैल्यू-लेवल refs (`api_key` के लिए `keyRef`, `token` के लिए `tokenRef`) का समर्थन करता है।
- पुराने फ्लैट `auth-profiles.json` मैप, जैसे `{ "provider": { "apiKey": "..." } }`, runtime फॉर्मैट नहीं हैं; `openclaw doctor --fix` उन्हें `.legacy-flat.*.bak` बैकअप के साथ canonical `provider:default` API-key प्रोफाइल में फिर से लिखता है।
- OAuth-मोड प्रोफाइल (`auth.profiles.<id>.mode = "oauth"`) SecretRef-समर्थित auth-profile क्रेडेंशियल का समर्थन नहीं करती हैं।
- स्थिर runtime क्रेडेंशियल इन-मेमोरी resolved snapshots से आते हैं; पुराने स्थिर `auth.json` entries मिलने पर साफ कर दिए जाते हैं।
- पुरानी OAuth imports `~/.openclaw/credentials/oauth.json` से होती हैं।
- देखें [OAuth](/hi/concepts/oauth)।
- Secrets runtime व्यवहार और `audit/configure/apply` टूलिंग: [Secrets Management](/hi/gateway/secrets)।

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
  billing/insufficient-credit त्रुटियों के कारण विफल होती है, तो घंटों में base backoff
  (डिफॉल्ट: `5`)। स्पष्ट billing text अब भी `401`/`403` responses पर भी
  यहां आ सकता है, लेकिन provider-specific text matchers अपने स्वामी provider तक
  सीमित रहते हैं (उदाहरण के लिए OpenRouter
  `Key limit exceeded`)। Retryable HTTP `402` usage-window या
  organization/workspace spend-limit messages इसके बजाय
  `rate_limit` पथ में रहते हैं।
- `billingBackoffHoursByProvider`: billing backoff घंटों के लिए वैकल्पिक per-provider overrides।
- `billingMaxHours`: billing backoff exponential growth के लिए घंटों में सीमा (डिफॉल्ट: `24`)।
- `authPermanentBackoffMinutes`: high-confidence `auth_permanent` विफलताओं के लिए मिनटों में base backoff (डिफॉल्ट: `10`)।
- `authPermanentMaxMinutes`: `auth_permanent` backoff growth के लिए मिनटों में सीमा (डिफॉल्ट: `60`)।
- `failureWindowHours`: backoff counters के लिए उपयोग की जाने वाली घंटों में rolling window (डिफॉल्ट: `24`)।
- `overloadedProfileRotations`: model fallback पर स्विच करने से पहले overloaded त्रुटियों के लिए maximum same-provider auth-profile rotations (डिफॉल्ट: `1`)। `ModelNotReadyException` जैसे provider-busy shapes यहां आते हैं।
- `overloadedBackoffMs`: overloaded provider/profile rotation को retry करने से पहले fixed delay (डिफॉल्ट: `0`)।
- `rateLimitedProfileRotations`: model fallback पर स्विच करने से पहले rate-limit त्रुटियों के लिए maximum same-provider auth-profile rotations (डिफॉल्ट: `1`)। उस rate-limit bucket में provider-shaped text शामिल है, जैसे `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, और `resource exhausted`।

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
- `--verbose` होने पर `consoleLevel` `debug` तक बढ़ जाता है।
- `maxFileBytes`: rotation से पहले active log file का अधिकतम आकार bytes में (positive integer; डिफॉल्ट: `104857600` = 100 MB)। OpenClaw active file के पास पांच numbered archives तक रखता है।
- `redactSensitive` / `redactPatterns`: console output, file logs, OTLP log records, और persisted session transcript text के लिए best-effort masking। `redactSensitive: "off"` केवल इस general log/transcript policy को disable करता है; UI/tool/diagnostic safety surfaces emission से पहले अभी भी secrets को redact करते हैं।

---

## Diagnostics

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

- `enabled`: instrumentation output के लिए master toggle (डिफॉल्ट: `true`)।
- `flags`: लक्षित log output सक्षम करने वाली flag strings की array (wildcards जैसे `"telegram.*"` या `"*"` का समर्थन)।
- `stuckSessionWarnMs`: long-running processing sessions को `session.long_running`, `session.stalled`, या `session.stuck` के रूप में वर्गीकृत करने के लिए ms में no-progress age threshold। Reply, tool, status, block, और ACP progress timer reset करते हैं; repeated `session.stuck` diagnostics unchanged रहने पर back off करते हैं।
- `stuckSessionAbortMs`: recovery के लिए eligible stalled active work को abort-drain करने से पहले ms में no-progress age threshold। unset होने पर, OpenClaw कम से कम 5 मिनट और 3x `stuckSessionWarnMs` की safer extended embedded-run window का उपयोग करता है।
- `memoryPressureSnapshot`: memory pressure `critical` तक पहुंचने पर redacted pre-OOM stability snapshot capture करता है (डिफॉल्ट: `false`)। normal memory pressure events रखते हुए stability bundle file scan/write जोड़ने के लिए `true` सेट करें।
- `otel.enabled`: OpenTelemetry export pipeline सक्षम करता है (डिफॉल्ट: `false`)। full configuration, signal catalog, और privacy model के लिए, देखें [OpenTelemetry export](/hi/gateway/opentelemetry)।
- `otel.endpoint`: OTel export के लिए collector URL।
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: वैकल्पिक signal-specific OTLP endpoints। सेट होने पर, वे केवल उस signal के लिए `otel.endpoint` को override करते हैं।
- `otel.protocol`: `"http/protobuf"` (डिफॉल्ट) या `"grpc"`।
- `otel.headers`: OTel export requests के साथ भेजे गए extra HTTP/gRPC metadata headers।
- `otel.serviceName`: resource attributes के लिए service name।
- `otel.traces` / `otel.metrics` / `otel.logs`: trace, metrics, या log export सक्षम करें।
- `otel.logsExporter`: log export sink: `"otlp"` (डिफॉल्ट), प्रति stdout line एक JSON object के लिए `"stdout"`, या `"both"`।
- `otel.sampleRate`: trace sampling rate `0`-`1`।
- `otel.flushIntervalMs`: periodic telemetry flush interval ms में।
- `otel.captureContent`: OTEL span attributes के लिए opt-in raw content capture। डिफॉल्ट रूप से off। Boolean `true` non-system message/tool content capture करता है; object form आपको `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`, और `toolDefinitions` स्पष्ट रूप से सक्षम करने देता है।
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: latest experimental GenAI inference span shape के लिए environment toggle, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। डिफॉल्ट रूप से spans compatibility के लिए `openclaw.model.call` और `gen_ai.system` रखते हैं; GenAI metrics bounded semantic attributes का उपयोग करते हैं।
- `OPENCLAW_OTEL_PRELOADED=1`: उन hosts के लिए environment toggle जिन्होंने पहले से global OpenTelemetry SDK register किया है। OpenClaw तब diagnostic listeners active रखते हुए plugin-owned SDK startup/shutdown छोड़ देता है।
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, और `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: matching config key unset होने पर उपयोग किए जाने वाले signal-specific endpoint env vars।
- `cacheTrace.enabled`: embedded runs के लिए cache trace snapshots log करें (डिफॉल्ट: `false`)।
- `cacheTrace.filePath`: cache trace JSONL के लिए output path (डिफॉल्ट: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)।
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace output में क्या शामिल है इसे नियंत्रित करें (सभी डिफॉल्ट: `true`)।

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
- `checkOnStart`: gateway शुरू होने पर npm updates की जांच करें (डिफॉल्ट: `true`)।
- `auto.enabled`: package installs के लिए background auto-update सक्षम करें (डिफॉल्ट: `false`)।
- `auto.stableDelayHours`: stable-channel auto-apply से पहले घंटों में न्यूनतम delay (डिफॉल्ट: `6`; max: `168`)।
- `auto.stableJitterHours`: घंटों में extra stable-channel rollout spread window (डिफॉल्ट: `12`; max: `168`)।
- `auto.betaCheckIntervalHours`: beta-channel checks कितनी बार घंटों में चलते हैं (डिफॉल्ट: `1`; max: `24`)।

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
- `dispatch.enabled`: ACP session turn dispatch के लिए independent gate (डिफॉल्ट: `true`)। execution block करते हुए ACP commands उपलब्ध रखने के लिए `false` सेट करें।
- `backend`: डिफॉल्ट ACP runtime backend id (registered ACP runtime plugin से match होना चाहिए)।
  पहले backend plugin install करें, और यदि `plugins.allow` सेट है, तो backend plugin id (उदाहरण के लिए `acpx`) शामिल करें वरना ACP backend load नहीं होगा।
- `defaultAgent`: जब spawns explicit target specify नहीं करते, तब fallback ACP target agent id।
- `allowedAgents`: ACP runtime sessions के लिए अनुमति प्राप्त agent ids की allowlist; खाली का अर्थ है कोई अतिरिक्त restriction नहीं।
- `maxConcurrentSessions`: concurrently active ACP sessions की अधिकतम संख्या।
- `stream.coalesceIdleMs`: streamed text के लिए idle flush window ms में।
- `stream.maxChunkChars`: streamed block projection को split करने से पहले maximum chunk size।
- `stream.repeatSuppression`: प्रति turn repeated status/tool lines को suppress करें (डिफॉल्ट: `true`)।
- `stream.deliveryMode`: `"live"` incrementally stream करता है; `"final_only"` turn terminal events तक buffer करता है।
- `stream.hiddenBoundarySeparator`: hidden tool events के बाद visible text से पहले separator (डिफॉल्ट: `"paragraph"`)।
- `stream.maxOutputChars`: प्रति ACP turn projected maximum assistant output characters।
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
  - `"random"` (डिफ़ॉल्ट): बदलती हुई मज़ेदार/मौसमी टैगलाइन।
  - `"default"`: स्थिर तटस्थ टैगलाइन (`All your chats, one OpenClaw.`)।
  - `"off"`: कोई टैगलाइन टेक्स्ट नहीं (बैनर शीर्षक/संस्करण फिर भी दिखाया जाता है)।
- पूरा बैनर छिपाने के लिए (सिर्फ़ टैगलाइन नहीं), env `OPENCLAW_HIDE_BANNER=1` सेट करें।

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

मौजूदा बिल्ड में अब TCP ब्रिज शामिल नहीं है। Nodes Gateway WebSocket पर कनेक्ट होते हैं। `bridge.*` कुंजियाँ अब कॉन्फ़िग स्कीमा का हिस्सा नहीं हैं (हटाए जाने तक वैलिडेशन विफल रहता है; `openclaw doctor --fix` अज्ञात कुंजियाँ हटा सकता है)।

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

- `sessionRetention`: `sessions.json` से छँटाई से पहले पूर्ण हो चुके अलग-थलग Cron रन सेशन कितने समय तक रखे जाएँ। आर्काइव किए गए हटाए गए Cron ट्रांसक्रिप्ट की सफ़ाई भी नियंत्रित करता है। डिफ़ॉल्ट: `24h`; अक्षम करने के लिए `false` सेट करें।
- `runLog.maxBytes`: पुराने फ़ाइल-समर्थित Cron रन लॉग के साथ संगतता के लिए स्वीकार किया जाता है। डिफ़ॉल्ट: `2_000_000` बाइट।
- `runLog.keepLines`: प्रति जॉब रखी जाने वाली नवीनतम SQLite रन-इतिहास पंक्तियाँ। डिफ़ॉल्ट: `2000`।
- `webhookToken`: Cron Webhook POST डिलीवरी (`delivery.mode = "webhook"`) के लिए उपयोग किया गया bearer token; छोड़े जाने पर कोई auth header नहीं भेजा जाता।
- `webhook`: बहिष्कृत लेगेसी fallback Webhook URL (http/https), जिसका उपयोग `openclaw doctor --fix` उन संग्रहीत जॉब को माइग्रेट करने के लिए करता है जिनमें अभी भी `notify: true` है; रनटाइम डिलीवरी प्रति-जॉब `delivery.mode="webhook"` और `delivery.to`, या announce डिलीवरी संरक्षित करते समय `delivery.completionDestination` का उपयोग करती है।

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

- `maxAttempts`: अस्थायी त्रुटियों पर Cron जॉब के लिए अधिकतम retries (डिफ़ॉल्ट: `3`; सीमा: `0`-`10`)।
- `backoffMs`: प्रत्येक retry प्रयास के लिए ms में backoff विलंबों की array (डिफ़ॉल्ट: `[30000, 60000, 300000]`; 1-10 entries)।
- `retryOn`: retries ट्रिगर करने वाले त्रुटि प्रकार - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`। सभी अस्थायी प्रकारों पर retry करने के लिए छोड़ दें।

One-shot जॉब retry प्रयास समाप्त होने तक सक्षम रहते हैं, फिर अंतिम त्रुटि स्थिति रखते हुए अक्षम हो जाते हैं। Recurring जॉब अपने अगले scheduled slot से पहले backoff के बाद फिर से चलने के लिए वही अस्थायी retry policy उपयोग करते हैं; स्थायी त्रुटियाँ या समाप्त हो चुके अस्थायी retries error backoff के साथ सामान्य recurring schedule पर लौट जाते हैं।

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
- `includeSkipped`: लगातार छोड़े गए runs को alert threshold में गिनें (डिफ़ॉल्ट: `false`)। छोड़े गए runs अलग से track किए जाते हैं और execution-error backoff को प्रभावित नहीं करते।
- `mode`: डिलीवरी mode - `"announce"` channel message के माध्यम से भेजता है; `"webhook"` कॉन्फ़िगर किए गए Webhook पर post करता है।
- `accountId`: alert delivery को scope करने के लिए वैकल्पिक account या channel id।

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

- सभी जॉब के लिए Cron failure notifications का डिफ़ॉल्ट destination।
- `mode`: `"announce"` या `"webhook"`; पर्याप्त target data मौजूद होने पर डिफ़ॉल्ट `"announce"` होता है।
- `channel`: announce delivery के लिए channel override। `"last"` अंतिम ज्ञात delivery channel का पुनः उपयोग करता है।
- `to`: स्पष्ट announce target या Webhook URL। Webhook mode के लिए आवश्यक।
- `accountId`: delivery के लिए वैकल्पिक account override।
- प्रति-जॉब `delivery.failureDestination` इस global default को override करता है।
- जब global या प्रति-जॉब failure destination में से कोई भी सेट नहीं होता, तो जो जॉब पहले से `announce` के माध्यम से deliver करते हैं वे failure पर उसी primary announce target पर fall back करते हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` जॉब के लिए supported है, जब तक कि जॉब का primary `delivery.mode` `"webhook"` न हो।

[Cron Jobs](/hi/automation/cron-jobs) देखें। अलग-थलग Cron executions को [background tasks](/hi/automation/tasks) के रूप में track किया जाता है।

---

## मीडिया मॉडल टेम्पलेट वेरिएबल

`tools.media.models[].args` में विस्तारित template placeholders:

| वेरिएबल           | विवरण                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | पूर्ण inbound message body                         |
| `{{RawBody}}`      | raw body (कोई history/sender wrappers नहीं)             |
| `{{BodyStripped}}` | group mentions हटाया हुआ body                 |
| `{{From}}`         | Sender identifier                                 |
| `{{To}}`           | Destination identifier                            |
| `{{MessageSid}}`   | Channel message id                                |
| `{{SessionId}}`    | मौजूदा session UUID                              |
| `{{IsNewSession}}` | नया session बनाया जाने पर `"true"`                 |
| `{{MediaUrl}}`     | inbound media pseudo-URL                          |
| `{{MediaPath}}`    | local media path                                  |
| `{{MediaType}}`    | media type (image/audio/document/…)               |
| `{{Transcript}}`   | Audio transcript                                  |
| `{{Prompt}}`       | CLI entries के लिए resolved media prompt             |
| `{{MaxChars}}`     | CLI entries के लिए resolved max output chars         |
| `{{ChatType}}`     | `"direct"` या `"group"`                           |
| `{{GroupSubject}}` | group subject (best effort)                       |
| `{{GroupMembers}}` | group members preview (best effort)               |
| `{{SenderName}}`   | sender display name (best effort)                 |
| `{{SenderE164}}`   | sender phone number (best effort)                 |
| `{{Provider}}`     | Provider hint (whatsapp, telegram, discord, आदि) |

---

## कॉन्फ़िग includes (`$include`)

कॉन्फ़िग को कई फ़ाइलों में विभाजित करें:

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

- Single file: containing object को बदल देता है।
- Array of files: क्रम में deep-merged (बाद वाली पहले वाली को override करती है)।
- Sibling keys: includes के बाद merged (included values को override करती हैं)।
- Nested includes: 10 levels तक deep।
- Paths: including file के सापेक्ष resolve किए जाते हैं, लेकिन top-level config directory (`openclaw.json` का `dirname`) के अंदर ही रहने चाहिए। Absolute/`../` forms केवल तब allowed हैं जब वे फिर भी उस boundary के अंदर resolve हों। Paths में null bytes नहीं होने चाहिए और resolution से पहले और बाद में 4096 characters से सख़्ती से छोटे होने चाहिए।
- OpenClaw-owned writes, जो single-file include द्वारा backed केवल एक top-level section बदलते हैं, उस included file में write through करते हैं। उदाहरण के लिए, `plugins install` `plugins.json5` में `plugins: { $include: "./plugins.json5" }` को update करता है और `openclaw.json` को intact छोड़ता है।
- Root includes, include arrays, और sibling overrides वाले includes OpenClaw-owned writes के लिए read-only हैं; वे writes config को flatten करने के बजाय fail closed होते हैं।
- Errors: missing files, parse errors, circular includes, invalid path format, और excessive length के लिए स्पष्ट messages।

---

_संबंधित: [Configuration](/hi/gateway/configuration) · [Configuration Examples](/hi/gateway/configuration-examples) · [Doctor](/hi/gateway/doctor)_

## संबंधित

- [Configuration](/hi/gateway/configuration)
- [Configuration examples](/hi/gateway/configuration-examples)
