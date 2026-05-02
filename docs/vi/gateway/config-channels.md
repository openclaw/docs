---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, đa tài khoản)
    - Khắc phục sự cố các khóa cấu hình theo từng kênh
    - Kiểm tra chính sách tin nhắn trực tiếp, chính sách nhóm hoặc kiểm soát điều kiện nhắc đến
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép đôi, khóa theo từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều kênh khác'
title: Cấu hình — kênh
x-i18n:
    generated_at: "2026-05-02T22:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5231efba32fab480313c05dfd5dcec12e32020a79001c4a72df4c3844966e65e
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo kênh trong `channels.*`. Bao gồm quyền truy cập DM và nhóm,
thiết lập nhiều tài khoản, chặn theo lượt nhắc, và các khóa theo kênh cho Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, và các Plugin kênh được đóng gói khác.

Đối với agent, công cụ, runtime Gateway, và các khóa cấp cao nhất khác, xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của kênh đó tồn tại (trừ khi `enabled: false`).

### Quyền truy cập DM và nhóm

Tất cả kênh đều hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM       | Hành vi                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận mã ghép nối một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép nối)        |
| `open`              | Cho phép tất cả DM gửi đến (yêu cầu `allowFrom: ["*"]`)                |
| `disabled`          | Bỏ qua tất cả DM gửi đến                                               |

| Chính sách nhóm       | Hành vi                                                     |
| --------------------- | ----------------------------------------------------------- |
| `allowlist` (mặc định) | Chỉ các nhóm khớp với danh sách cho phép đã cấu hình        |
| `open`                | Bỏ qua danh sách cho phép nhóm (vẫn áp dụng chặn theo lượt nhắc) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                             |

<Note>
`channels.defaults.groupPolicy` đặt mặc định khi `groupPolicy` của nhà cung cấp chưa được đặt.
Mã ghép nối hết hạn sau 1 giờ. Các yêu cầu ghép nối DM đang chờ được giới hạn ở **3 cho mỗi kênh**.
Nếu toàn bộ khối nhà cung cấp bị thiếu (`channels.<provider>` vắng mặt), chính sách nhóm runtime sẽ quay về `allowlist` (đóng khi lỗi) kèm cảnh báo khi khởi động.
</Note>

### Ghi đè mô hình theo kênh

Dùng `channels.modelByChannel` để ghim ID kênh cụ thể vào một mô hình. Giá trị chấp nhận `provider/model` hoặc alias mô hình đã cấu hình. Ánh xạ kênh áp dụng khi phiên chưa có ghi đè mô hình (ví dụ, được đặt qua `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Mặc định kênh và Heartbeat

Dùng `channels.defaults` cho hành vi chính sách nhóm và Heartbeat dùng chung giữa các nhà cung cấp:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: chính sách nhóm dự phòng khi `groupPolicy` cấp nhà cung cấp chưa được đặt.
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả kênh. Giá trị: `all` (mặc định, bao gồm tất cả ngữ cảnh trích dẫn/luồng/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống allowlist nhưng giữ ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo kênh: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh khỏe mạnh trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra Heartbeat dạng chỉ báo gọn.

### WhatsApp

WhatsApp chạy qua kênh web của Gateway (Baileys Web). Kênh này tự động khởi động khi có phiên đã liên kết.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp nhiều tài khoản">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Lệnh gửi đi mặc định dùng tài khoản `default` nếu có; nếu không thì dùng ID tài khoản được cấu hình đầu tiên (đã sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định dự phòng đó khi khớp với một ID tài khoản đã cấu hình.
- Thư mục xác thực Baileys một tài khoản cũ được `openclaw doctor` di chuyển vào `whatsapp/default`.
- Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; từ chối symlink), với `TELEGRAM_BOT_TOKEN` làm dự phòng cho tài khoản mặc định.
- `apiRoot` chỉ là gốc Telegram Bot API. Dùng `https://api.telegram.org` hoặc gốc tự lưu trữ/proxy của bạn, không dùng `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` xóa hậu tố `/bot<TOKEN>` vô tình ở cuối.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (2+ ID tài khoản), hãy đặt mặc định rõ ràng (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi giá trị này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các lần ghi cấu hình do Telegram khởi tạo (di chuyển ID siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Bản xem trước luồng Telegram dùng `sendMessage` + `editMessageText` (hoạt động trong trò chuyện trực tiếp và nhóm).
- Chính sách thử lại: xem [Chính sách thử lại](/vi/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Mã thông báo: `channels.discord.token`, với `DISCORD_BOT_TOKEN` làm dự phòng cho tài khoản mặc định.
- Các lệnh gọi đi trực tiếp cung cấp Discord `token` rõ ràng sẽ dùng mã thông báo đó cho lệnh gọi; các thiết lập thử lại/chính sách của tài khoản vẫn lấy từ tài khoản đã chọn trong ảnh chụp nhanh môi trường thực thi đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn sẽ ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho mục tiêu gửi; ID số trần sẽ bị từ chối.
- Slug của guild là chữ thường với khoảng trắng được thay bằng `-`; khóa kênh dùng tên đã chuyển thành slug (không có `#`). Ưu tiên ID guild.
- Tin nhắn do bot tạo mặc định bị bỏ qua. `allowBots: true` bật các tin nhắn này; dùng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot (tin nhắn của chính nó vẫn bị lọc).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và các ghi đè kênh) loại bỏ tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (không tính @everyone/@here).
- `channels.discord.mentionAliases` ánh xạ văn bản `@handle` gửi đi ổn định sang ID người dùng Discord trước khi gửi, để có thể nhắc đến đồng đội đã biết một cách xác định ngay cả khi bộ nhớ đệm thư mục tạm thời đang trống. Ghi đè theo tài khoản nằm dưới `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (mặc định 17) tách các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.threadBindings` điều khiển định tuyến gắn với chuỗi Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên gắn với chuỗi (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và gửi/định tuyến đã ràng buộc)
  - `idleHours`: ghi đè Discord cho tự động bỏ focus do không hoạt động, tính bằng giờ (`0` tắt)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng, tính bằng giờ (`0` tắt)
  - `spawnSessions`: công tắc cho `sessions_spawn({ thread: true })` và tự động tạo/ràng buộc chuỗi khi ACP sinh chuỗi (mặc định: `true`)
  - `defaultSpawnContext`: ngữ cảnh subagent gốc cho các lần sinh gắn với chuỗi (`"fork"` theo mặc định)
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình ràng buộc ACP bền vững cho kênh và chuỗi (dùng id kênh/chuỗi trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/vi/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho các container Discord components v2.
- `channels.discord.voice` bật hội thoại kênh thoại Discord cùng các ghi đè tự động tham gia + LLM + TTS tùy chọn. Cấu hình Discord chỉ văn bản mặc định tắt thoại; đặt `channels.discord.voice.enabled=true` để bật.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM dùng cho phản hồi kênh thoại Discord.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` chuyển tiếp đến các tùy chọn DAVE của `@discordjs/voice` (`true` và `24` theo mặc định).
- `channels.discord.voice.connectTimeoutMs` điều khiển thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia (`30000` theo mặc định).
- `channels.discord.voice.reconnectGraceMs` điều khiển thời gian một phiên thoại đã ngắt kết nối có thể cần để vào tín hiệu kết nối lại trước khi OpenClaw hủy nó (`15000` theo mặc định).
- OpenClaw cũng cố khôi phục nhận thoại bằng cách rời/tham gia lại một phiên thoại sau các lỗi giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ stream chuẩn. Các giá trị `streamMode` cũ và `streaming` dạng boolean được tự động di chuyển.
- `channels.discord.autoPresence` ánh xạ độ sẵn sàng của môi trường thực thi sang trạng thái hiện diện của bot (healthy => online, degraded => idle, exhausted => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` bật lại đối sánh tên/thẻ có thể thay đổi (chế độ tương thích phá kính khẩn cấp).
- `channels.discord.execApprovals`: gửi phê duyệt exec gốc Discord và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Discord được phép phê duyệt yêu cầu exec. Dự phòng về `commands.ownerAllowFrom` khi bị bỏ qua.
  - `agentFilter`: danh sách cho phép ID agent tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho mọi agent.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi đến DM của người phê duyệt, `"channel"` gửi đến kênh gốc, `"both"` gửi đến cả hai. Khi target bao gồm `"channel"`, nút chỉ người phê duyệt đã phân giải mới dùng được.
  - `cleanupAfterResolve`: khi `true`, xóa DM phê duyệt sau khi phê duyệt, từ chối hoặc hết thời gian chờ.

**Chế độ thông báo phản ứng:** `off` (không có), `own` (tin nhắn của bot, mặc định), `all` (mọi tin nhắn), `allowlist` (từ `guilds.<id>.users` trên mọi tin nhắn).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON tài khoản dịch vụ: nội tuyến (`serviceAccount`) hoặc dựa trên tệp (`serviceAccountFile`).
- SecretRef tài khoản dịch vụ cũng được hỗ trợ (`serviceAccountRef`).
- Dự phòng env: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Dùng `spaces/<spaceId>` hoặc `users/<userId>` cho mục tiêu gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại đối sánh principal email có thể thay đổi (chế độ tương thích phá kính khẩn cấp).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` cho dự phòng env tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cùng với `signingSecret` (ở gốc hoặc theo tài khoản).
- `socketMode` chuyển tiếp tinh chỉnh transport Slack SDK Socket Mode đến API Bolt receiver công khai. Chỉ dùng khi điều tra thời gian chờ ping/pong hoặc hành vi websocket cũ.
- `botToken`, `appToken`, `signingSecret`, và `userToken` chấp nhận chuỗi plaintext
  hoặc đối tượng SecretRef.
- Ảnh chụp nhanh tài khoản Slack hiển thị các trường nguồn/trạng thái theo từng thông tin xác thực như
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, và, ở chế độ HTTP,
  `signingSecretStatus`. `configured_unavailable` nghĩa là tài khoản được
  cấu hình qua SecretRef nhưng đường dẫn lệnh/môi trường thực thi hiện tại không thể
  phân giải giá trị secret.
- `configWrites: false` chặn các thao tác ghi cấu hình khởi tạo từ Slack.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ stream Slack chuẩn. `channels.slack.streaming.nativeTransport` điều khiển transport streaming gốc của Slack. Các giá trị `streamMode` cũ, `streaming` dạng boolean, và `nativeStreaming` được tự động di chuyển.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` cho mục tiêu gửi.

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cô lập phiên chuỗi:** `thread.historyScope` là theo từng chuỗi (mặc định) hoặc chia sẻ trên toàn kênh. `thread.inheritParent` sao chép transcript kênh cha sang chuỗi mới.

- Streaming gốc của Slack cùng trạng thái chuỗi kiểu trợ lý Slack "is typing..." yêu cầu mục tiêu chuỗi trả lời. DM cấp cao nhất mặc định ở ngoài chuỗi, nên chúng dùng `typingReaction` hoặc gửi thông thường thay cho bản xem trước kiểu chuỗi.
- `typingReaction` thêm phản ứng tạm thời vào tin nhắn Slack đầu vào trong khi phản hồi đang chạy, rồi xóa khi hoàn tất. Dùng shortcode emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: gửi phê duyệt exec gốc Slack và ủy quyền người phê duyệt. Cùng schema như Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter`, và `target` (`"dm"`, `"channel"`, hoặc `"both"`).

| Nhóm hành động | Mặc định | Ghi chú                     |
| ------------ | ------- | ---------------------- |
| reactions    | bật | Phản ứng + liệt kê phản ứng |
| messages     | bật | Đọc/gửi/sửa/xóa             |
| pins         | bật | Ghim/bỏ ghim/liệt kê        |
| memberInfo   | bật | Thông tin thành viên        |
| emojiList    | bật | Danh sách emoji tùy chỉnh   |

### Mattermost

Mattermost được phát hành dưới dạng Plugin đóng gói kèm trong các bản phát hành OpenClaw hiện tại. Các bản dựng cũ hơn hoặc
tùy chỉnh có thể cài đặt một gói npm hiện tại bằng
`openclaw plugins install @openclaw/mattermost`. Kiểm tra
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
để xem các dist-tag hiện tại trước khi ghim phiên bản.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chế độ trò chuyện: `oncall` (phản hồi khi có @-mention, mặc định), `onmessage` (mọi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi lệnh gốc Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải URL đầy đủ.
- `commands.callbackUrl` phải phân giải tới điểm cuối Gateway OpenClaw và có thể truy cập được từ máy chủ Mattermost.
- Các callback slash gốc được xác thực bằng token theo từng lệnh do Mattermost trả về
  trong quá trình đăng ký lệnh slash. Nếu đăng ký thất bại hoặc không có
  lệnh nào được kích hoạt, OpenClaw sẽ từ chối callback với
  `Unauthorized: invalid command token.`
- Với các máy chủ callback riêng tư/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ/miền callback.
  Dùng giá trị máy chủ/miền, không dùng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do Mattermost khởi tạo.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi trả lời trong kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè kiểm soát yêu cầu nhắc đến theo từng kênh (`"*"` cho mặc định).
- `channels.mattermost.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

- `channels.signal.account`: ghim quá trình khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

### BlueBubbles

BlueBubbles là đường dẫn iMessage được khuyến nghị (được Plugin hỗ trợ, cấu hình trong `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` có thể liên kết các cuộc trò chuyện BlueBubbles với phiên ACP liên tục. Dùng một handle BlueBubbles hoặc chuỗi đích (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác nhân ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Cấu hình kênh BlueBubbles đầy đủ được ghi lại trong [BlueBubbles](/vi/channels/bluebubbles).

### iMessage

OpenClaw sinh `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hoặc cổng.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

- Yêu cầu Full Disk Access tới Messages DB.
- Ưu tiên mục tiêu `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê các cuộc trò chuyện.
- `cliPath` có thể trỏ tới một trình bọc SSH; đặt `remoteHost` (`host` hoặc `user@host`) để tìm nạp tệp đính kèm bằng SCP.
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn đường dẫn tệp đính kèm đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP dùng kiểm tra host-key nghiêm ngặt, vì vậy hãy đảm bảo khóa máy chủ chuyển tiếp đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do iMessage khởi tạo.
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` có thể liên kết các cuộc trò chuyện iMessage với phiên ACP liên tục. Dùng handle đã chuẩn hóa hoặc mục tiêu trò chuyện rõ ràng (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác nhân ACP](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được Plugin hỗ trợ và được cấu hình trong `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Xác thực bằng token dùng `accessToken`; xác thực bằng mật khẩu dùng `userId` + `password`.
- `channels.matrix.proxy` định tuyến lưu lượng HTTP Matrix qua proxy HTTP(S) rõ ràng. Các tài khoản có tên có thể ghi đè bằng `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép homeserver riêng tư/nội bộ. `proxy` và tùy chọn tham gia mạng này là các kiểm soát độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong các thiết lập nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `off`, nên các phòng được mời và lời mời kiểu DM mới sẽ bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` với `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt exec gốc Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Matrix (ví dụ `@owner:example.org`) được phép phê duyệt yêu cầu exec.
  - `agentFilter`: danh sách cho phép ID tác nhân tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác nhân.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định), `"channel"` (phòng nguồn), hoặc `"both"`.
  - Ghi đè theo từng tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách DM Matrix nhóm vào phiên: `per-user` (mặc định) chia sẻ theo peer được định tuyến, trong khi `per-room` cô lập từng phòng DM.
- Các thăm dò trạng thái Matrix và tra cứu thư mục trực tiếp dùng cùng chính sách proxy như lưu lượng khi chạy.
- Cấu hình Matrix đầy đủ, quy tắc nhắm mục tiêu và ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được Plugin hỗ trợ và được cấu hình trong `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.msteams`, `channels.msteams.configWrites`.
- Cấu hình Teams đầy đủ (thông tin xác thực, Webhook, chính sách DM/nhóm, ghi đè theo từng đội/theo từng kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được Plugin hỗ trợ và được cấu hình trong `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập ở đây: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (máy chủ/cổng/TLS/kênh/danh sách cho phép/kiểm soát yêu cầu nhắc đến) được ghi lại trong [IRC](/vi/channels/irc).

### Nhiều tài khoản (tất cả kênh)

Chạy nhiều tài khoản cho mỗi kênh (mỗi tài khoản có `accountId` riêng):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` được dùng khi bỏ qua `accountId` (CLI + định tuyến).
- Token env chỉ áp dụng cho tài khoản **mặc định**.
- Các thiết lập kênh cơ sở áp dụng cho mọi tài khoản trừ khi bị ghi đè theo từng tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản tới một tác nhân khác nhau.
- Nếu bạn thêm một tài khoản không mặc định qua `openclaw channels add` (hoặc onboarding kênh) khi vẫn đang dùng cấu hình kênh cấp cao nhất một tài khoản, OpenClaw trước tiên sẽ đẩy các giá trị một tài khoản cấp cao nhất thuộc phạm vi tài khoản vào bản đồ tài khoản của kênh để tài khoản gốc tiếp tục hoạt động. Hầu hết kênh chuyển chúng vào `channels.<channel>.accounts.default`; Matrix có thể giữ nguyên một mục tiêu có tên/mặc định khớp hiện có thay vào đó.
- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định; liên kết theo phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa các hình dạng trộn lẫn bằng cách chuyển các giá trị một tài khoản cấp cao nhất thuộc phạm vi tài khoản vào tài khoản đã được nâng cấp được chọn cho kênh đó. Hầu hết kênh dùng `accounts.default`; Matrix có thể giữ nguyên một mục tiêu có tên/mặc định khớp hiện có thay vào đó.

### Các kênh Plugin khác

Nhiều kênh Plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang kênh riêng của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat và Twitch).
Xem chỉ mục kênh đầy đủ: [Kênh](/vi/channels).

### Kiểm soát yêu cầu nhắc đến trong trò chuyện nhóm

Tin nhắn nhóm mặc định là **yêu cầu nhắc đến** (metadata nhắc đến hoặc mẫu regex an toàn). Áp dụng cho WhatsApp, Telegram, Discord, Google Chat và trò chuyện nhóm iMessage.

Phản hồi hiển thị được kiểm soát riêng. Phòng nhóm/kênh mặc định là `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw vẫn xử lý lượt, nhưng phản hồi cuối thông thường vẫn ở chế độ riêng tư và đầu ra phòng hiển thị yêu cầu `message(action=send)`. Chỉ đặt `"automatic"` khi bạn muốn hành vi cũ, trong đó phản hồi thông thường được đăng lại vào phòng. Để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ cho trò chuyện trực tiếp, hãy đặt `messages.visibleReplies: "message_tool"`; harness Codex cũng dùng hành vi chỉ qua công cụ đó làm mặc định trò chuyện trực tiếp khi chưa đặt.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ quay về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Gateway tải nóng cấu hình `messages` sau khi tệp được lưu. Chỉ khởi động lại khi theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

**Loại nhắc đến:**

- **Nhắc đến bằng metadata**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự trò chuyện WhatsApp.
- **Mẫu văn bản**: Mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và phép lặp lồng nhau không an toàn sẽ bị bỏ qua.
- Kiểm soát yêu cầu nhắc đến chỉ được thực thi khi có thể phát hiện (nhắc đến gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt mặc định toàn cục. Các kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo từng tài khoản). Đặt `0` để tắt.

`messages.visibleReplies` là mặc định lượt nguồn toàn cục; `messages.groupChat.visibleReplies` ghi đè giá trị đó cho các lượt nguồn nhóm/kênh. Khi `messages.visibleReplies` chưa được đặt, harness có thể cung cấp mặc định trực tiếp/nguồn riêng; harness Codex mặc định là `message_tool`. Danh sách cho phép của kênh và cổng kiểm soát nhắc đến vẫn quyết định một lượt có được xử lý hay không.

#### Giới hạn lịch sử DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Thứ tự phân giải: ghi đè theo từng DM → mặc định của nhà cung cấp → không giới hạn (giữ lại tất cả).

Được hỗ trợ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Chế độ tự trò chuyện

Bao gồm số của chính bạn trong `allowFrom` để bật chế độ tự trò chuyện (bỏ qua @-mention gốc, chỉ phản hồi các mẫu văn bản):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Lệnh (xử lý lệnh trong chat)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Command details">

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp sẵn + đi kèm hiện tại, xem [Lệnh Slash](/vi/tools/slash-commands).
- Trang này là **tham chiếu khóa cấu hình**, không phải danh mục lệnh đầy đủ. Các lệnh do kênh/plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép cặp thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone`, và Talk `/voice` được ghi trong tài liệu ở các trang kênh/plugin tương ứng cùng với [Lệnh Slash](/vi/tools/slash-commands).
- Lệnh văn bản phải là các tin nhắn **độc lập** bắt đầu bằng `/`.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram, để Slack tắt.
- `nativeSkills: "auto"` bật lệnh Skills gốc cho Discord/Telegram, để Slack tắt.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó.
- Ghi đè đăng ký Skills gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram bổ sung.
- `bash: true` bật `! <cmd>` cho shell máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Đối với các máy khách `chat.send` của Gateway, thao tác ghi `/config set|unset` lâu dài cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn có sẵn cho các máy khách operator thông thường có phạm vi ghi.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`.
- `plugins: true` bật `/plugins` cho khám phá, cài đặt và điều khiển bật/tắt plugin.
- `channels.<provider>.configWrites` kiểm soát việc thay đổi cấu hình theo từng kênh (mặc định: true).
- Đối với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm tới tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` tắt `/restart` và các hành động công cụ khởi động lại Gateway. Mặc định: `true`.
- `ownerAllowFrom` là danh sách cho phép chủ sở hữu rõ ràng cho các lệnh/công cụ chỉ dành cho chủ sở hữu. Nó tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm ID chủ sở hữu trong prompt hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` là theo từng nhà cung cấp. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép cặp của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` chưa được đặt.
- Bản đồ tài liệu lệnh:
  - danh mục tích hợp sẵn + đi kèm: [Lệnh Slash](/vi/tools/slash-commands)
  - bề mặt lệnh theo từng kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép cặp: [Ghép cặp](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - Dreaming của bộ nhớ: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — khóa cấp cao nhất
- [Cấu hình — agent](/vi/gateway/config-agents)
- [Tổng quan về kênh](/vi/channels)
