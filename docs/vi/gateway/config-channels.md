---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, nhiều tài khoản)
    - Khắc phục sự cố các khóa cấu hình theo từng kênh
    - Kiểm tra chính sách tin nhắn trực tiếp, chính sách nhóm hoặc cơ chế kiểm soát lượt nhắc đến
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép nối, khóa theo từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều nền tảng khác'
title: Cấu hình — kênh
x-i18n:
    generated_at: "2026-05-11T20:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo từng kênh dưới `channels.*`. Bao gồm quyền truy cập DM và nhóm,
thiết lập nhiều tài khoản, điều kiện nhắc đến, và khóa theo từng kênh cho Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, cùng các Plugin kênh được đóng gói kèm khác.

Đối với agent, công cụ, runtime Gateway, và các khóa cấp cao nhất khác, xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của kênh đó tồn tại (trừ khi `enabled: false`).

### Quyền truy cập DM và nhóm

Tất cả các kênh đều hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM      | Hành vi                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận mã ghép đôi một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép đôi) |
| `open`              | Cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)             |
| `disabled`          | Bỏ qua tất cả DM đến                                           |

| Chính sách nhóm      | Hành vi                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (mặc định) | Chỉ các nhóm khớp với danh sách cho phép đã cấu hình |
| `open`                | Bỏ qua danh sách cho phép của nhóm (điều kiện nhắc đến vẫn áp dụng) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                        |

<Note>
`channels.defaults.groupPolicy` đặt giá trị mặc định khi `groupPolicy` của nhà cung cấp chưa được đặt.
Mã ghép đôi hết hạn sau 1 giờ. Các yêu cầu ghép đôi DM đang chờ được giới hạn ở **3 trên mỗi kênh**.
Nếu toàn bộ khối nhà cung cấp bị thiếu (`channels.<provider>` không tồn tại), chính sách nhóm runtime sẽ quay về `allowlist` (đóng khi lỗi) kèm cảnh báo khi khởi động.
</Note>

### Ghi đè model theo kênh

Dùng `channels.modelByChannel` để ghim các ID kênh cụ thể vào một model. Giá trị chấp nhận `provider/model` hoặc bí danh model đã cấu hình. Ánh xạ kênh được áp dụng khi phiên chưa có ghi đè model (ví dụ, được đặt qua `/model`).

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
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả kênh. Giá trị: `all` (mặc định, bao gồm mọi ngữ cảnh trích dẫn/luồng/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống allowlist nhưng giữ ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo kênh: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh khỏe mạnh trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra Heartbeat dạng chỉ báo gọn.

### WhatsApp

WhatsApp chạy qua kênh web của Gateway (Baileys Web). Kênh này tự động khởi động khi có phiên đã liên kết.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
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

- Lệnh gửi ra mặc định dùng tài khoản `default` nếu có; nếu không thì dùng id tài khoản được cấu hình đầu tiên (đã sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định dự phòng đó khi khớp với một id tài khoản đã cấu hình.
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
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (2+ id tài khoản), đặt mặc định rõ ràng (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi giá trị này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các thao tác ghi cấu hình do Telegram khởi tạo (di chuyển ID siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Bản xem trước stream của Telegram dùng `sendMessage` + `editMessageText` (hoạt động trong chat trực tiếp và nhóm).
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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

- Token: `channels.discord.token`, với `DISCORD_BOT_TOKEN` làm dự phòng cho tài khoản mặc định.
- Các lệnh gọi trực tiếp đi ra cung cấp `token` Discord rõ ràng sẽ dùng token đó cho lệnh gọi; các thiết lập thử lại/chính sách của tài khoản vẫn lấy từ tài khoản đã chọn trong ảnh chụp runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho mục tiêu gửi; các ID số trần bị từ chối.
- Slug guild dùng chữ thường và thay khoảng trắng bằng `-`; khóa kênh dùng tên đã slug hóa (không có `#`). Ưu tiên dùng ID guild.
- Tin nhắn do bot tạo mặc định bị bỏ qua. `allowBots: true` bật chúng; dùng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot (tin nhắn của chính bot vẫn bị lọc).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và ghi đè kênh) loại bỏ tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (không tính @everyone/@here).
- `channels.discord.mentionAliases` ánh xạ văn bản `@handle` gửi đi ổn định sang ID người dùng Discord trước khi gửi, để có thể nhắc đến đồng đội đã biết một cách xác định ngay cả khi cache thư mục tạm thời trống. Ghi đè theo từng tài khoản nằm dưới `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (mặc định 17) chia các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.threadBindings` điều khiển định tuyến gắn với thread Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên gắn với thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và gửi/định tuyến đã ràng buộc)
  - `idleHours`: ghi đè Discord cho tự động bỏ focus khi không hoạt động, tính bằng giờ (`0` tắt)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng, tính bằng giờ (`0` tắt)
  - `spawnSessions`: công tắc cho `sessions_spawn({ thread: true })` và tạo/ràng buộc thread tự động khi ACP thread-spawn (mặc định: `true`)
  - `defaultSpawnContext`: ngữ cảnh subagent gốc cho spawn gắn với thread (mặc định là `"fork"`)
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình ràng buộc ACP bền vững cho kênh và thread (dùng id kênh/thread trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/vi/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho container Discord components v2.
- `channels.discord.voice` bật hội thoại kênh thoại Discord và các ghi đè auto-join + LLM + TTS tùy chọn. Cấu hình Discord chỉ văn bản mặc định để tắt thoại; đặt `channels.discord.voice.enabled=true` để bật.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM dùng cho phản hồi kênh thoại Discord.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` chuyển tiếp tới tùy chọn DAVE của `@discordjs/voice` (mặc định là `true` và `24`).
- `channels.discord.voice.connectTimeoutMs` điều khiển thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử auto-join (mặc định là `30000`).
- `channels.discord.voice.reconnectGraceMs` điều khiển thời lượng một phiên thoại đã ngắt kết nối có thể dùng để vào tín hiệu kết nối lại trước khi OpenClaw hủy nó (mặc định là `15000`).
- Phát lại thoại Discord không bị gián đoạn bởi sự kiện bắt đầu nói của người dùng khác. Để tránh vòng lặp phản hồi, OpenClaw bỏ qua thu âm giọng nói mới trong khi TTS đang phát.
- OpenClaw cũng thử khôi phục nhận thoại bằng cách rời/tham gia lại phiên thoại sau các lỗi giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ luồng chính tắc. Discord mặc định là `streaming.mode: "progress"` để tiến trình công cụ/công việc xuất hiện trong một tin nhắn xem trước được chỉnh sửa; đặt `streaming.mode: "off"` để tắt. Các giá trị legacy `streamMode` và `streaming` dạng boolean vẫn là alias runtime; chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu.
- `channels.discord.autoPresence` ánh xạ trạng thái sẵn sàng runtime sang hiện diện bot (healthy => online, degraded => idle, exhausted => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` bật lại khớp tên/tag có thể thay đổi (chế độ tương thích phá kính).
- `channels.discord.execApprovals`: gửi phê duyệt exec gốc Discord và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ auto, phê duyệt exec kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Discord được phép phê duyệt yêu cầu exec. Dự phòng về `commands.ownerAllowFrom` khi bị bỏ qua.
  - `agentFilter`: allowlist ID agent tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho mọi agent.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi tới DM của người phê duyệt, `"channel"` gửi tới kênh khởi nguồn, `"both"` gửi tới cả hai. Khi target gồm `"channel"`, nút chỉ dùng được bởi người phê duyệt đã phân giải.
  - `cleanupAfterResolve`: khi `true`, xóa DM phê duyệt sau khi phê duyệt, từ chối hoặc hết thời gian.

**Chế độ thông báo reaction:** `off` (không), `own` (tin nhắn của bot, mặc định), `all` (mọi tin nhắn), `allowlist` (từ `guilds.<id>.users` trên mọi tin nhắn).

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

- JSON tài khoản dịch vụ: inline (`serviceAccount`) hoặc dựa trên tệp (`serviceAccountFile`).
- SecretRef tài khoản dịch vụ cũng được hỗ trợ (`serviceAccountRef`).
- Dự phòng env: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Dùng `spaces/<spaceId>` hoặc `users/<userId>` cho mục tiêu gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại khớp principal email có thể thay đổi (chế độ tương thích phá kính).

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
      unfurlLinks: false,
      unfurlMedia: false,
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

- **Chế độ socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` cho dự phòng env của tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cộng với `signingSecret` (ở root hoặc theo từng tài khoản).
- `socketMode` chuyển tiếp tinh chỉnh transport Socket Mode của Slack SDK tới API Bolt receiver công khai. Chỉ dùng nó khi điều tra timeout ping/pong hoặc hành vi websocket cũ.
- `botToken`, `appToken`, `signingSecret`, và `userToken` chấp nhận chuỗi plaintext
  hoặc đối tượng SecretRef.
- Ảnh chụp tài khoản Slack hiển thị các trường nguồn/trạng thái theo từng credential như
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, và, trong chế độ HTTP,
  `signingSecretStatus`. `configured_unavailable` nghĩa là tài khoản được
  cấu hình qua SecretRef nhưng đường dẫn lệnh/runtime hiện tại không thể
  phân giải giá trị secret.
- `configWrites: false` chặn ghi cấu hình do Slack khởi tạo.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ luồng Slack chính tắc. `channels.slack.streaming.nativeTransport` điều khiển transport luồng gốc của Slack. Các giá trị legacy `streamMode`, `streaming` dạng boolean, và `nativeStreaming` vẫn là alias runtime; chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu.
- `unfurlLinks` và `unfurlMedia` chuyển tiếp boolean unfurl liên kết và media của `chat.postMessage` Slack cho phản hồi bot. Bỏ qua chúng để giữ hành vi mặc định của Slack; đặt chúng tại `channels.slack.accounts.<accountId>` để ghi đè mặc định cấp cao nhất cho một tài khoản.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` cho mục tiêu gửi.

**Chế độ thông báo reaction:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cô lập phiên thread:** `thread.historyScope` là theo từng thread (mặc định) hoặc dùng chung trên kênh. `thread.inheritParent` sao chép transcript kênh cha sang thread mới.

- Streaming gốc Slack cộng với trạng thái thread kiểu trợ lý "is typing..." của Slack yêu cầu mục tiêu thread trả lời. DM cấp cao nhất mặc định vẫn ngoài thread, nên chúng vẫn có thể stream qua bản xem trước bài nháp đăng-và-sửa của Slack thay vì hiển thị bản xem trước stream/trạng thái gốc kiểu thread.
- `typingReaction` thêm reaction tạm thời vào tin nhắn Slack đến trong khi phản hồi đang chạy, rồi xóa nó khi hoàn tất. Dùng shortcode emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: gửi phê duyệt exec gốc Slack và ủy quyền người phê duyệt. Cùng schema như Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter`, và `target` (`"dm"`, `"channel"`, hoặc `"both"`).

| Nhóm hành động | Mặc định | Ghi chú                  |
| ------------ | ------- | ---------------------- |
| reactions    | đã bật | Thêm reaction + liệt kê reactions |
| messages     | đã bật | Đọc/gửi/chỉnh sửa/xóa  |
| pins         | đã bật | Ghim/bỏ ghim/liệt kê         |
| memberInfo   | đã bật | Thông tin thành viên            |
| emojiList    | đã bật | Danh sách emoji tùy chỉnh      |

### Mattermost

Mattermost được phát hành dưới dạng Plugin tích hợp trong các bản phát hành OpenClaw hiện tại. Các bản dựng cũ hơn hoặc
tùy chỉnh có thể cài đặt gói npm hiện tại bằng
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

Chế độ trò chuyện: `oncall` (phản hồi khi được @-mention, mặc định), `onmessage` (mọi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi lệnh gốc của Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải URL đầy đủ.
- `commands.callbackUrl` phải phân giải tới endpoint Gateway của OpenClaw và có thể truy cập được từ máy chủ Mattermost.
- Callback slash gốc được xác thực bằng token riêng cho từng lệnh do Mattermost trả về trong quá trình đăng ký slash command. Nếu đăng ký thất bại hoặc không có lệnh nào được kích hoạt, OpenClaw từ chối callback với `Unauthorized: invalid command token.`
- Với các máy chủ callback riêng tư/tailnet/nội bộ, Mattermost có thể yêu cầu `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ/tên miền callback. Dùng giá trị máy chủ/tên miền, không dùng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do Mattermost khởi tạo.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi phản hồi trong kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè theo từng kênh cho cơ chế chặn theo mention (`"*"` cho mặc định).
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

**Chế độ thông báo reaction:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

- `channels.signal.account`: ghim quá trình khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

### iMessage

OpenClaw sinh `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hoặc cổng. Đây là đường dẫn được ưu tiên cho các thiết lập iMessage mới của OpenClaw khi máy chủ có thể cấp quyền cho cơ sở dữ liệu Messages và Automation.

Hỗ trợ BlueBubbles đã bị loại bỏ. `channels.bluebubbles` không phải là bề mặt cấu hình runtime được hỗ trợ trên OpenClaw hiện tại. Di chuyển cấu hình cũ sang `channels.imessage`; dùng [việc loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để xem phiên bản ngắn và [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng chuyển đổi đầy đủ.

Nếu Gateway không chạy trên máy Mac đã đăng nhập Messages, giữ `channels.imessage.enabled=true` và đặt `channels.imessage.cliPath` thành một SSH wrapper chạy `imsg "$@"` trên máy Mac đó. Đường dẫn `imsg` local mặc định chỉ dành cho macOS.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

- Yêu cầu Full Disk Access đối với Messages DB.
- Ưu tiên các target `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê các cuộc trò chuyện.
- `cliPath` có thể trỏ tới một SSH wrapper; đặt `remoteHost` (`host` hoặc `user@host`) để lấy tệp đính kèm qua SCP.
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn đường dẫn tệp đính kèm đầu vào (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP dùng kiểm tra host-key nghiêm ngặt, vì vậy hãy đảm bảo khóa máy chủ relay đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do iMessage khởi tạo.
- `channels.imessage.actions.*`: bật các hành động API riêng tư cũng được kiểm soát bởi `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` mặc định tắt; đặt thành `true` trước khi mong đợi media đầu vào trong lượt agent.
- `channels.imessage.catchup.enabled`: chọn tham gia phát lại các tin nhắn đầu vào đã đến khi Gateway bị tắt.
- `channels.imessage.groups`: registry nhóm và cài đặt theo từng nhóm. Với `groupPolicy: "allowlist"`, cấu hình khóa `chat_id` rõ ràng hoặc một mục ký tự đại diện `"*"` để tin nhắn nhóm có thể vượt qua cổng registry.
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` có thể liên kết cuộc trò chuyện iMessage với phiên ACP bền vững. Dùng một handle đã chuẩn hóa hoặc target trò chuyện rõ ràng (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [ACP Agents](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ví dụ SSH wrapper cho iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được hỗ trợ bởi Plugin và được cấu hình dưới `channels.matrix`.

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
- `channels.matrix.proxy` định tuyến lưu lượng HTTP của Matrix qua một proxy HTTP(S) rõ ràng. Các tài khoản có tên có thể ghi đè bằng `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép homeserver riêng tư/nội bộ. `proxy` và tùy chọn bật mạng này là các điều khiển độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong thiết lập nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `off`, vì vậy các phòng được mời và lời mời kiểu DM mới sẽ bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` với `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt exec gốc của Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Matrix (ví dụ `@owner:example.org`) được phép phê duyệt yêu cầu exec.
  - `agentFilter`: allowlist ID agent tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả agent.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi prompt phê duyệt. `"dm"` (mặc định), `"channel"` (phòng nguồn), hoặc `"both"`.
  - Ghi đè theo từng tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách DM Matrix được nhóm vào phiên: `per-user` (mặc định) dùng chung theo peer được định tuyến, trong khi `per-room` cô lập từng phòng DM.
- Probe trạng thái Matrix và tra cứu thư mục trực tiếp dùng cùng chính sách proxy như lưu lượng runtime.
- Cấu hình Matrix đầy đủ, quy tắc nhắm mục tiêu, và ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được hỗ trợ bởi Plugin và được cấu hình dưới `channels.msteams`.

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

- Các đường dẫn khóa lõi được đề cập ở đây: `channels.msteams`, `channels.msteams.configWrites`.
- Cấu hình Teams đầy đủ (thông tin xác thực, webhook, chính sách DM/nhóm, ghi đè theo từng team/từng kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được hỗ trợ bởi Plugin và được cấu hình dưới `channels.irc`.

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

- Các đường dẫn khóa lõi được đề cập ở đây: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (máy chủ/cổng/TLS/kênh/allowlist/chặn theo mention) được ghi lại trong [IRC](/vi/channels/irc).

### Nhiều tài khoản (tất cả kênh)

Chạy nhiều tài khoản trên mỗi kênh (mỗi tài khoản có `accountId` riêng):

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
- Cài đặt kênh cơ sở áp dụng cho tất cả tài khoản trừ khi được ghi đè theo từng tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản tới một agent khác nhau.
- Nếu bạn thêm tài khoản không phải mặc định bằng `openclaw channels add` (hoặc onboarding kênh) trong khi vẫn đang dùng cấu hình kênh cấp cao nhất một tài khoản, OpenClaw trước tiên sẽ thăng cấp các giá trị một tài khoản cấp cao nhất có phạm vi tài khoản vào bản đồ tài khoản của kênh để tài khoản gốc tiếp tục hoạt động. Hầu hết kênh chuyển chúng vào `channels.<channel>.accounts.default`; Matrix có thể giữ lại một target có tên/mặc định khớp sẵn có.
- Các binding chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định; binding có phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa các dạng hỗn hợp bằng cách chuyển các giá trị một tài khoản cấp cao nhất có phạm vi tài khoản vào tài khoản được thăng cấp đã chọn cho kênh đó. Hầu hết kênh dùng `accounts.default`; Matrix có thể giữ lại một target có tên/mặc định khớp sẵn có.

### Các kênh Plugin khác

Nhiều kênh Plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang kênh chuyên biệt của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, và Twitch).
Xem chỉ mục kênh đầy đủ: [Kênh](/vi/channels).

### Chặn theo mention trong trò chuyện nhóm

Tin nhắn nhóm mặc định **yêu cầu mention** (mention metadata hoặc mẫu regex an toàn). Áp dụng cho trò chuyện nhóm WhatsApp, Telegram, Discord, Google Chat, và iMessage.

Các phản hồi hiển thị được kiểm soát riêng. Phòng nhóm/kênh mặc định là `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw vẫn xử lý lượt, nhưng các phản hồi cuối thông thường vẫn riêng tư và đầu ra phòng hiển thị yêu cầu `message(action=send)`. Chỉ đặt `"automatic"` khi bạn muốn hành vi cũ, trong đó các phản hồi thông thường được đăng lại vào phòng. Để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ cho cả trò chuyện trực tiếp, hãy đặt `messages.visibleReplies: "message_tool"`; harness Codex cũng dùng hành vi chỉ qua công cụ đó làm mặc định chưa đặt cho trò chuyện trực tiếp.

Phản hồi hiển thị chỉ qua công cụ yêu cầu một model/runtime gọi công cụ một cách đáng tin cậy. Nếu
nhật ký phiên hiển thị văn bản của assistant với `didSendViaMessagingTool: false`, thì
model đã tạo câu trả lời cuối riêng tư thay vì gọi công cụ nhắn tin.
Chuyển sang model gọi công cụ mạnh hơn cho kênh đó, hoặc đặt
`messages.groupChat.visibleReplies: "automatic"` để khôi phục các phản hồi cuối hiển thị kiểu cũ.

Nếu công cụ nhắn tin không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ quay về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Gateway tải nóng cấu hình `messages` sau khi tệp được lưu. Chỉ khởi động lại khi tính năng theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

**Loại nhắc đến:**

- **Nhắc đến bằng siêu dữ liệu**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự trò chuyện WhatsApp.
- **Mẫu văn bản**: Các mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và lặp lồng nhau không an toàn sẽ bị bỏ qua.
- Cổng nhắc đến chỉ được thực thi khi có thể phát hiện (nhắc đến gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // mặc định toàn cục cho trò chuyện trực tiếp/nguồn; harness Codex mặc định các trò chuyện trực tiếp chưa đặt thành message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // mặc định; dùng "automatic" cho phản hồi cuối kiểu cũ
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt mặc định toàn cục. Các kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo từng tài khoản). Đặt `0` để tắt.

`messages.visibleReplies` là mặc định toàn cục cho lượt nguồn; `messages.groupChat.visibleReplies` ghi đè nó cho các lượt nguồn nhóm/kênh. Khi `messages.visibleReplies` chưa được đặt, một harness có thể cung cấp mặc định trực tiếp/nguồn riêng; harness Codex mặc định là `message_tool`. Danh sách cho phép của kênh và cổng nhắc đến vẫn quyết định một lượt có được xử lý hay không.

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

Thêm số của chính bạn vào `allowFrom` để bật chế độ tự trò chuyện (bỏ qua @-mention gốc, chỉ phản hồi các mẫu văn bản):

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

### Lệnh (xử lý lệnh trò chuyện)

```json5
{
  commands: {
    native: "auto", // đăng ký lệnh gốc khi được hỗ trợ
    nativeSkills: "auto", // đăng ký lệnh skill gốc khi được hỗ trợ
    text: true, // phân tích /commands trong tin nhắn trò chuyện
    bash: false, // cho phép ! (bí danh: /bash)
    bashForegroundMs: 2000,
    config: false, // cho phép /config
    mcp: false, // cho phép /mcp
    plugins: false, // cho phép /plugins
    debug: false, // cho phép /debug
    restart: true, // cho phép /restart + công cụ khởi động lại gateway
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

<Accordion title="Chi tiết lệnh">

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp + đi kèm hiện tại, xem [Lệnh Slash](/vi/tools/slash-commands).
- Trang này là **tham chiếu khóa cấu hình**, không phải danh mục lệnh đầy đủ. Các lệnh do kênh/plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép cặp thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone`, và Talk `/voice` được ghi lại trong các trang kênh/plugin tương ứng cùng với [Lệnh Slash](/vi/tools/slash-commands).
- Lệnh văn bản phải là các tin nhắn **độc lập** bắt đầu bằng `/`.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram, tắt Slack.
- `nativeSkills: "auto"` bật lệnh skill gốc cho Discord/Telegram, tắt Slack.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). Với Discord, `false` bỏ qua đăng ký và dọn dẹp lệnh gốc trong lúc khởi động.
- Ghi đè đăng ký skill gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram bổ sung.
- `bash: true` bật `! <cmd>` cho shell máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Với các client `chat.send` của gateway, các thao tác ghi lâu dài `/config set|unset` cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn khả dụng cho các client operator phạm vi ghi thông thường.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý dưới `mcp.servers`.
- `plugins: true` bật `/plugins` cho khám phá, cài đặt và điều khiển bật/tắt plugin.
- `channels.<provider>.configWrites` kiểm soát các thay đổi cấu hình theo từng kênh (mặc định: true).
- Với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm đến tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` tắt `/restart` và các hành động công cụ khởi động lại gateway. Mặc định: `true`.
- `ownerAllowFrom` là danh sách cho phép chủ sở hữu rõ ràng cho các lệnh/công cụ chỉ dành cho chủ sở hữu. Nó tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm id chủ sở hữu trong prompt hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` là theo từng nhà cung cấp. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép cặp của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` không được đặt.
- Bản đồ tài liệu lệnh:
  - danh mục tích hợp + đi kèm: [Lệnh Slash](/vi/tools/slash-commands)
  - bề mặt lệnh riêng theo kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép cặp: [Ghép cặp](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - Dreaming bộ nhớ: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất
- [Cấu hình — agent](/vi/gateway/config-agents)
- [Tổng quan về kênh](/vi/channels)
