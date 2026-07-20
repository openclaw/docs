---
read_when:
    - Tìm hiểu cách cấu hình OpenClaw
    - Đang tìm các ví dụ cấu hình
    - Thiết lập OpenClaw lần đầu tiên
summary: Các ví dụ cấu hình chính xác theo schema cho những thiết lập OpenClaw phổ biến
title: Ví dụ cấu hình
x-i18n:
    generated_at: "2026-07-20T04:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2796f28e33b631aff0f706e72e3c81072a57683c09d3bad1125c8f89cffb2ac4
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Các ví dụ dưới đây phù hợp với lược đồ cấu hình hiện tại. Để xem tài liệu tham khảo đầy đủ và ghi chú cho từng trường, hãy xem [Cấu hình](/vi/gateway/configuration).

## Bắt đầu nhanh

### Mức tối thiểu tuyệt đối

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Lưu vào `~/.openclaw/openclaw.json` và bạn có thể nhắn tin trực tiếp cho bot từ số đó.

### Cấu hình khởi đầu được đề xuất

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
          theme: "trợ lý hữu ích",
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
      visibleReplies: "message_tool", // phải chủ động bật; đầu ra hiển thị yêu cầu message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## Ví dụ mở rộng (các tùy chọn chính)

> JSON5 cho phép sử dụng chú thích và dấu phẩy ở cuối. JSON thông thường cũng hoạt động.

```json5
{
  // Môi trường + shell
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

  // Siêu dữ liệu hồ sơ xác thực (thông tin bí mật nằm trong auth-profiles.json)
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

  // Danh tính được đặt riêng cho từng tác nhân — hãy thiết lập tại agents.list[].identity bên dưới.

  // Ghi nhật ký
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Định dạng tin nhắn
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // chủ động bật cho các phòng dùng chung với những mô hình sử dụng công cụ đáng tin cậy
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

  // Công cụ
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // Phương án dự phòng CLI tùy chọn (tệp thực thi Whisper):
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

  // Hành vi phiên
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // được đề xuất cho hộp thư đến có nhiều người dùng
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
      resetArchiveRetention: "30d", // khoảng thời gian hoặc false
      maxDiskBytes: "500mb", // tùy chọn
      highWaterBytes: "400mb", // tùy chọn (mặc định là 80% của maxDiskBytes)
    },
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kênh
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

  // Môi trường chạy của tác nhân
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
      skills: ["github", "weather"], // được kế thừa bởi các tác nhân không đặt list[].skills
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
        directPolicy: "allow", // allow (mặc định) | block
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
        scope: "session", // ưu tiên hơn perSession: true cũ
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
          theme: "chú lười hữu ích",
          emoji: "🦥",
        },
        // kế thừa defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // ghi đè mức suy nghĩ cho từng tác nhân
        reasoningDefault: "on", // khả năng hiển thị lập luận cho từng tác nhân
        fastModeDefault: false, // chế độ nhanh cho từng tác nhân
      },
      {
        id: "quick",
        skills: [], // tác nhân này không có Skills
        fastModeDefault: true, // tác nhân này luôn chạy nhanh
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

  // Nhà cung cấp mô hình tùy chỉnh
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

  // Tác vụ Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
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
        messageTemplate: "Từ: {{messages[0].from}}\nChủ đề: {{messages[0].subject}}",
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

  // Gateway + mạng
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

### Kho lưu trữ Skills cùng cấp được liên kết tượng trưng

Dùng cấu hình này khi thư mục gốc của skill tích hợp sẵn chứa một symlink trỏ vào repo cùng cấp, ví dụ
`~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` quét repo cùng cấp như một thư mục gốc skill được chỉ định rõ ràng.
- `allowSymlinkTargets` cho phép các thư mục skill được liên kết bằng symlink phân giải vào thư mục gốc đích thực đáng tin cậy đó
  mà không cho phép symlink thoát tùy ý.
- Để cho phép Skill Workshop ghi thông qua cùng một đích symlink đáng tin cậy,
  hãy đặt `skills.workshop.allowSymlinkTargetWrites: true`.

## Các mẫu phổ biến

### Đường cơ sở skill dùng chung với một ghi đè

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

- `agents.defaults.skills` là đường cơ sở dùng chung.
- `agents.list[].skills` thay thế đường cơ sở đó cho một agent.
- Dùng `skills: []` khi một agent không được thấy skill nào.

### Thiết lập đa nền tảng

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

### Tự động phê duyệt mạng node đáng tin cậy

Duy trì ghép nối thiết bị theo cách thủ công trừ khi bạn kiểm soát đường truyền mạng. Với một
mạng con phòng thí nghiệm hoặc tailnet chuyên dụng, bạn có thể chọn bật tự động phê duyệt
thiết bị node lần đầu bằng các CIDR hoặc IP chính xác:

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

Tính năng này vẫn tắt khi chưa được đặt. Nó chỉ áp dụng cho hoạt động ghép nối `role: node` mới
không yêu cầu scope nào. Các client của người vận hành/trình duyệt và việc nâng cấp vai trò, scope, siêu dữ liệu hoặc
khóa công khai vẫn cần phê duyệt thủ công.

### Chế độ DM bảo mật (hộp thư dùng chung / DM đa người dùng)

Nếu nhiều người có thể gửi DM cho bot của bạn (nhiều mục trong `allowFrom`, phê duyệt ghép nối cho nhiều người hoặc `dmPolicy: "open"`), hãy bật **chế độ DM bảo mật** để DM từ những người gửi khác nhau mặc định không dùng chung một ngữ cảnh:

```json5
{
  // Chế độ DM bảo mật (khuyến nghị cho agent DM đa người dùng hoặc nhạy cảm)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Ví dụ: hộp thư WhatsApp đa người dùng
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Ví dụ: hộp thư Discord đa người dùng
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Đối với Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack, việc cấp quyền cho người gửi mặc định ưu tiên ID.
Chỉ bật đối sánh trực tiếp tên/email/biệt danh có thể thay đổi bằng `dangerouslyAllowNameMatching: true` của từng kênh nếu bạn chấp nhận rõ ràng rủi ro đó.

### Khóa API Anthropic + phương án dự phòng MiniMax

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

### Bot công việc (quyền truy cập hạn chế)

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

### Chỉ dùng mô hình cục bộ

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

## Mẹo

- Nếu bạn đặt `dmPolicy: "open"`, danh sách `allowFrom` tương ứng phải bao gồm `"*"`.
- ID của nhà cung cấp có định dạng khác nhau (số điện thoại, ID người dùng, ID kênh). Hãy dùng tài liệu của nhà cung cấp để xác nhận định dạng.
- Các phần tùy chọn có thể thêm sau: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Xem [Nhà cung cấp](/vi/providers) và [Khắc phục sự cố](/vi/gateway/troubleshooting) để biết thêm ghi chú thiết lập chuyên sâu.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Cấu hình](/vi/gateway/configuration)
