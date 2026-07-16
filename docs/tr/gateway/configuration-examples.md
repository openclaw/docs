---
read_when:
    - OpenClaw'u nasıl yapılandıracağınızı öğrenme
    - Yapılandırma örnekleri aranıyor
    - OpenClaw'ı ilk kez kurma
summary: Yaygın OpenClaw kurulumları için şemayla tam uyumlu yapılandırma örnekleri
title: Yapılandırma örnekleri
x-i18n:
    generated_at: "2026-07-16T17:24:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Aşağıdaki örnekler mevcut yapılandırma şemasıyla uyumludur. Kapsamlı başvuru ve alan bazındaki notlar için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Hızlı başlangıç

### Mutlak minimum

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

`~/.openclaw/openclaw.json` konumuna kaydettiğinizde, bu numaradan bota doğrudan mesaj gönderebilirsiniz.

### Önerilen başlangıç yapılandırması

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
      visibleReplies: "message_tool", // isteğe bağlı; görünür çıktı için message(action=send) gerekir
      unmentionedInbound: "room_event",
    },
  },
}
```

## Genişletilmiş örnek (başlıca seçenekler)

> JSON5, yorumları ve sondaki virgülleri kullanmanıza olanak tanır. Normal JSON da çalışır.

```json5
{
  // Ortam + kabuk
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

  // Kimlik doğrulama profili meta verileri (gizli bilgiler auth-profiles.json içinde bulunur)
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

  // Kimlik her aracıya özeldir — aşağıdaki agents.list[].identity üzerinde ayarlayın.

  // Günlük kaydı
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // İleti biçimlendirme
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // araçları güvenilir biçimde kullanan modellerin bulunduğu paylaşımlı odalar için etkinleştirin
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

  // Araçlar
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // İsteğe bağlı CLI geri dönüşü (Whisper ikili dosyası):
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

  // Oturum davranışı
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // çok kullanıcılı gelen kutuları için önerilir
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
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı
      highWaterBytes: "400mb", // isteğe bağlı (varsayılan olarak maxDiskBytes değerinin %80'i)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kanallar
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

  // Aracı çalışma zamanı
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
      skills: ["github", "weather"], // list[].skills değerini belirtmeyen aracılar tarafından devralınır
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
        directPolicy: "allow", // allow (varsayılan) | block
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
        scope: "session", // eski perSession: true yerine tercih edilir
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
          theme: "yardımsever tembel hayvan",
          emoji: "🦥",
        },
        // defaults.skills değerini devralır -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // aracıya özgü düşünme geçersiz kılması
        reasoningDefault: "on", // aracıya özgü akıl yürütme görünürlüğü
        fastModeDefault: false, // aracıya özgü hızlı mod
      },
      {
        id: "quick",
        skills: [], // bu aracı için beceri yok
        fastModeDefault: true, // bu aracı her zaman hızlı çalışır
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

  // Özel model sağlayıcıları
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

  // Cron işleri
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // varsayılan; cron yönlendirmesi + yalıtılmış cron aracı turu yürütmesi
    sessionRetention: "24h",
  },

  // Webhook'lar
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
        messageTemplate: "Kimden: {{messages[0].from}}\nKonu: {{messages[0].subject}}",
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

  // Gateway + ağ
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

### Sembolik bağlantılı kardeş beceri deposu

Yerleşik bir beceri kökü, kardeş bir depoya yönlendiren sembolik bağlantı içerdiğinde bunu kullanın; örneğin `~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` kardeş depoyu açık bir beceri kökü olarak tarar.
- `allowSymlinkTargets`, sembolik bağlantılı beceri klasörlerinin rastgele sembolik bağlantı kaçışlarına izin vermeden bu güvenilir
  gerçek hedef köke çözümlenmesini sağlar.
- Beceri Atölyesi'nin aynı güvenilir sembolik bağlantı hedefi üzerinden yazma işlemi uygulamasına izin vermek için
  `skills.workshop.allowSymlinkTargetWrites: true` değerini ayarlayın.

## Yaygın kalıplar

### Tek bir geçersiz kılma ile paylaşılan beceri temeli

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

- `agents.defaults.skills` paylaşılan temel yapılandırmadır.
- `agents.list[].skills`, bir agent için bu temel yapılandırmanın yerini alır.
- Bir agent'ın hiçbir skills görmemesi gerektiğinde `skills: []` kullanın.

### Çok platformlu kurulum

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

### Güvenilen Node ağı için otomatik onay

Ağ yolunu denetlemediğiniz sürece cihaz eşleştirmesini manuel tutun. Ayrılmış bir
laboratuvar veya tailnet alt ağı için, tam CIDR'ler veya IP'ler kullanarak ilk
Node cihaz eşleştirmesinin otomatik onaylanmasını etkinleştirebilirsiniz:

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

Ayarlanmadığında bu özellik kapalı kalır. Yalnızca istenen kapsam bulunmayan yeni
`role: node` eşleştirmelerine uygulanır. Operatör/tarayıcı istemcileri ile rol, kapsam, meta veri veya
açık anahtar yükseltmeleri hâlâ manuel onay gerektirir.

### Güvenli DM modu (paylaşılan gelen kutusu / çok kullanıcılı DM'ler)

Botunuza birden fazla kişi DM gönderebiliyorsa (`allowFrom` içinde birden fazla giriş, birden fazla kişi için eşleştirme onayları veya `dmPolicy: "open"`), farklı gönderenlerden gelen DM'lerin varsayılan olarak tek bir bağlamı paylaşmaması için **güvenli DM modunu** etkinleştirin:

```json5
{
  // Çok kullanıcılı veya hassas DM agent'ları için önerilen güvenli DM modu
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Örnek: WhatsApp çok kullanıcılı gelen kutusu
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Örnek: Discord çok kullanıcılı gelen kutusu
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack için gönderen yetkilendirmesi varsayılan olarak öncelikle kimliğe dayanır.
Değiştirilebilir ad/e-posta/takma adların doğrudan eşleştirilmesini yalnızca bu riski açıkça kabul ediyorsanız her kanalın `dangerouslyAllowNameMatching: true` ayarıyla etkinleştirin.

### Anthropic API anahtarı + MiniMax yedeği

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

### İş botu (kısıtlı erişim)

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

### Yalnızca yerel modeller

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

## İpuçları

- `dmPolicy: "open"` ayarlarsanız eşleşen `allowFrom` listesi `"*"` değerini içermelidir.
- Sağlayıcı kimlikleri farklılık gösterir (telefon numaraları, kullanıcı kimlikleri, kanal kimlikleri). Biçimi doğrulamak için sağlayıcı belgelerini kullanın.
- Daha sonra eklenebilecek isteğe bağlı bölümler: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Daha ayrıntılı kurulum notları için [Sağlayıcılar](/tr/providers) ve [Sorun giderme](/tr/gateway/troubleshooting) bölümlerine bakın.

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Yapılandırma](/tr/gateway/configuration)
