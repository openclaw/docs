---
read_when:
    - OpenClaw को कॉन्फ़िगर करना सीखना
    - कॉन्फ़िगरेशन के उदाहरण खोज रहे हैं
    - OpenClaw को पहली बार सेट अप करना
summary: सामान्य OpenClaw सेटअप के लिए स्कीमा-सटीक कॉन्फ़िगरेशन उदाहरण
title: कॉन्फ़िगरेशन के उदाहरण
x-i18n:
    generated_at: "2026-07-19T08:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

नीचे दिए गए उदाहरण वर्तमान कॉन्फ़िग स्कीमा के अनुरूप हैं। विस्तृत संदर्भ और प्रत्येक फ़ील्ड के नोट्स के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

## त्वरित शुरुआत

### न्यूनतम आवश्यक कॉन्फ़िगरेशन

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

इसे `~/.openclaw/openclaw.json` में सहेजें और आप उस नंबर से बॉट को सीधे संदेश भेज सकते हैं।

### अनुशंसित शुरुआती कॉन्फ़िगरेशन

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-4-6" },
    },
    list: [
      {
        id: "main",
        identity: {
          name: "Clawd",
          theme: "helpful assistant",
          emoji: "🦞",
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: {
    visibleReplies: "automatic",
    groupChat: {
      visibleReplies: "message_tool", // ऑप्ट-इन; दृश्यमान आउटपुट के लिए message(action=send) आवश्यक है
      unmentionedInbound: "room_event",
    },
  },
}
```

## विस्तृत उदाहरण (प्रमुख विकल्प)

> JSON5 में टिप्पणियों और अंतिम अल्पविरामों का उपयोग किया जा सकता है। सामान्य JSON भी काम करता है।

```json5
{
  // परिवेश + शेल
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

  // प्रमाणीकरण प्रोफ़ाइल मेटाडेटा (गोपनीय मान auth-profiles.json में रहते हैं)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal", "openai:default"],
    },
  },

  // पहचान प्रत्येक एजेंट के लिए अलग होती है — इसे नीचे agents.list[].identity में सेट करें।

  // लॉगिंग
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // संदेश स्वरूपण
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // टूल-विश्वसनीय मॉडल वाले साझा कक्षों के लिए इसे चुनें
      unmentionedInbound: "room_event",
    },
    queue: {
      mode: "followup",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
        discord: "collect",
        slack: "collect",
        signal: "followup",
        imessage: "followup",
        webchat: "followup",
      },
    },
  },

  // टूलिंग
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // वैकल्पिक CLI फ़ॉलबैक (Whisper बाइनरी):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // सत्र का व्यवहार
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // बहु-उपयोगकर्ता इनबॉक्स के लिए अनुशंसित
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/main/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // अवधि या false
      maxDiskBytes: "500mb", // वैकल्पिक
      highWaterBytes: "400mb", // वैकल्पिक (डिफ़ॉल्ट रूप से maxDiskBytes का 80%)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // चैनल
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { enabled: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // एजेंट रनटाइम
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // उन एजेंटों को विरासत में मिलता है जिनमें list[].skills नहीं है
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // अनुमति दें (डिफ़ॉल्ट) | अवरुद्ध करें
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // पुराने perSession: true की तुलना में इसे प्राथमिकता दें
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    list: [
      {
        id: "main",
        default: true,
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
        },
        // defaults.skills विरासत में लेता है -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // प्रत्येक एजेंट के लिए चिंतन ओवरराइड
        reasoningDefault: "on", // प्रत्येक एजेंट के लिए तर्क की दृश्यता
        fastModeDefault: false, // प्रत्येक एजेंट के लिए तेज़ मोड
      },
      {
        id: "quick",
        skills: [], // इस एजेंट के लिए कोई Skills नहीं
        fastModeDefault: true, // यह एजेंट हमेशा तेज़ी से चलता है
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // कस्टम मॉडल प्रदाता
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // Cron जॉब
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // डिफ़ॉल्ट; Cron प्रेषण + पृथक Cron एजेंट-टर्न निष्पादन
    sessionRetention: "24h",
  },

  // Webhook
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + नेटवर्किंग
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway-host.ts.net:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

### सिमलिंक किया हुआ सहोदर Skills रिपॉज़िटरी

इसका उपयोग तब करें जब किसी अंतर्निहित Skills रूट में सहोदर रिपॉज़िटरी का सिमलिंक हो, उदाहरण के
लिए `~/.agents/skills/manager -> ~/Projects/manager/skills`।

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

- `extraDirs` सहोदर रिपॉज़िटरी को एक स्पष्ट Skills रूट के रूप में स्कैन करता है।
- `allowSymlinkTargets` सिमलिंक किए गए Skills फ़ोल्डरों को उस विश्वसनीय
  वास्तविक लक्ष्य रूट में रिज़ॉल्व होने देता है, बिना मनमाने सिमलिंक पलायन की अनुमति दिए।
- Skill Workshop को उसी विश्वसनीय सिमलिंक लक्ष्य के माध्यम से लिखने की अनुमति देने के लिए,
  `skills.workshop.allowSymlinkTargetWrites: true` सेट करें।

## सामान्य पैटर्न

### एक ओवरराइड के साथ साझा Skills आधाररेखा

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills` साझा आधाररेखा है।
- `agents.list[].skills` एक एजेंट के लिए उस आधाररेखा को प्रतिस्थापित करता है।
- जब किसी एजेंट को कोई Skills नहीं दिखना चाहिए, तब `skills: []` का उपयोग करें।

### बहु-प्लेटफ़ॉर्म सेटअप

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### विश्वसनीय Node नेटवर्क के लिए स्वचालित स्वीकृति

जब तक नेटवर्क पथ आपके नियंत्रण में न हो, डिवाइस पेयरिंग मैन्युअल रखें। किसी समर्पित
लैब या टेलनेट सबनेट के लिए, आप सटीक CIDR या IP के साथ पहली बार होने वाली Node
डिवाइस पेयरिंग की स्वचालित स्वीकृति चुन सकते हैं:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

इसे सेट न करने पर यह बंद रहता है। यह केवल बिना किसी अनुरोधित स्कोप वाली नई `role: node` पेयरिंग पर
लागू होता है। ऑपरेटर/ब्राउज़र क्लाइंट और भूमिका, स्कोप, मेटाडेटा या
पब्लिक-की अपग्रेड के लिए अब भी मैन्युअल स्वीकृति आवश्यक है।

### सुरक्षित DM मोड (साझा इनबॉक्स / बहु-उपयोगकर्ता DM)

यदि एक से अधिक व्यक्ति आपके बॉट को DM भेज सकते हैं (`allowFrom` में कई प्रविष्टियाँ, कई लोगों के लिए पेयरिंग स्वीकृतियाँ या `dmPolicy: "open"`), तो **सुरक्षित DM मोड** सक्षम करें, ताकि अलग-अलग प्रेषकों के DM डिफ़ॉल्ट रूप से एक ही संदर्भ साझा न करें:

```json5
{
  // बहु-उपयोगकर्ता या संवेदनशील DM एजेंटों के लिए सुरक्षित DM मोड अनुशंसित है
  session: { dmScope: "per-channel-peer" },

  channels: {
    // उदाहरण: WhatsApp बहु-उपयोगकर्ता इनबॉक्स
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // उदाहरण: Discord बहु-उपयोगकर्ता इनबॉक्स
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack के लिए, प्रेषक प्राधिकरण डिफ़ॉल्ट रूप से पहले ID पर आधारित होता है।
हर चैनल के `dangerouslyAllowNameMatching: true` के साथ सीधे परिवर्तनशील नाम/ईमेल/निक मिलान को केवल तभी सक्षम करें, जब आप स्पष्ट रूप से उस जोखिम को स्वीकार करते हों।

### Anthropic API कुंजी + MiniMax फ़ॉलबैक

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

### कार्य बॉट (प्रतिबंधित पहुँच)

```json5
{
  agents: {
    defaults: {
      workspace: "~/work-openclaw",
      elevatedDefault: "off",
    },
    list: [
      {
        id: "main",
        identity: {
          name: "WorkBot",
          theme: "professional assistant",
        },
      },
    ],
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { enabled: true, requireMention: true },
        "#general": { enabled: true, requireMention: true },
      },
    },
  },
}
```

### केवल स्थानीय मॉडल

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "lmstudio/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## सुझाव

- यदि आप `dmPolicy: "open"` सेट करते हैं, तो संबंधित `allowFrom` सूची में `"*"` अवश्य शामिल होना चाहिए।
- प्रदाता ID अलग-अलग होते हैं (फ़ोन नंबर, उपयोगकर्ता ID, चैनल ID)। प्रारूप की पुष्टि करने के लिए प्रदाता दस्तावेज़ों का उपयोग करें।
- बाद में जोड़े जा सकने वाले वैकल्पिक अनुभाग: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`।
- सेटअप के अधिक विस्तृत विवरण के लिए [प्रदाता](/hi/providers) और [समस्या निवारण](/hi/gateway/troubleshooting) देखें।

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
