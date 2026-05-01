---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, đa tài khoản)
    - Khắc phục sự cố các khóa cấu hình theo từng kênh
    - Kiểm tra chính sách tin nhắn trực tiếp, chính sách nhóm hoặc cơ chế kiểm soát nhắc đến
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép nối, khóa theo từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều nền tảng khác'
title: Cấu hình — các kênh
x-i18n:
    generated_at: "2026-05-01T10:48:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce1571d51e026182d49b935780a986780a90b05afc0acca027b2541b80a1aac2
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo kênh trong `channels.*`. Bao gồm quyền truy cập DM và nhóm,
thiết lập nhiều tài khoản, kiểm soát theo lượt nhắc, và các khóa theo kênh cho Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, và các Plugin kênh đi kèm khác.

Đối với agent, công cụ, runtime Gateway và các khóa cấp cao khác, xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của nó tồn tại (trừ khi `enabled: false`).

### Quyền truy cập DM và nhóm

Tất cả kênh đều hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM       | Hành vi                                                        |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi chưa biết nhận mã ghép đôi một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép đôi) |
| `open`              | Cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)            |
| `disabled`          | Bỏ qua tất cả DM đến                                          |

| Chính sách nhóm       | Hành vi                                               |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (mặc định) | Chỉ các nhóm khớp danh sách cho phép đã cấu hình      |
| `open`                | Bỏ qua danh sách cho phép của nhóm (kiểm soát theo lượt nhắc vẫn áp dụng) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                       |

<Note>
`channels.defaults.groupPolicy` đặt mặc định khi `groupPolicy` của nhà cung cấp chưa được đặt.
Mã ghép đôi hết hạn sau 1 giờ. Các yêu cầu ghép đôi DM đang chờ được giới hạn ở **3 yêu cầu mỗi kênh**.
Nếu toàn bộ khối nhà cung cấp bị thiếu (`channels.<provider>` không tồn tại), chính sách nhóm runtime quay về `allowlist` (đóng khi lỗi) kèm cảnh báo khi khởi động.
</Note>

### Ghi đè mô hình theo kênh

Dùng `channels.modelByChannel` để ghim các ID kênh cụ thể vào một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh áp dụng khi phiên chưa có ghi đè mô hình (ví dụ, được đặt qua `/model`).

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

Dùng `channels.defaults` cho chính sách nhóm dùng chung và hành vi Heartbeat trên các nhà cung cấp:

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
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả kênh. Giá trị: `all` (mặc định, bao gồm toàn bộ ngữ cảnh trích dẫn/chuỗi/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống allowlist nhưng giữ ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo kênh: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh khỏe mạnh trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra Heartbeat dạng chỉ báo gọn.

### WhatsApp

WhatsApp chạy qua kênh web của Gateway (Baileys Web). Nó tự động khởi động khi có một phiên đã liên kết.

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

- Các lệnh gửi ra mặc định dùng tài khoản `default` nếu có; nếu không thì dùng id tài khoản được cấu hình đầu tiên (đã sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định dự phòng đó khi nó khớp với một id tài khoản đã cấu hình.
- Thư mục xác thực Baileys một tài khoản kiểu cũ được `openclaw doctor` di chuyển vào `whatsapp/default`.
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

- Token bot: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; symlink bị từ chối), với `TELEGRAM_BOT_TOKEN` làm dự phòng cho tài khoản mặc định.
- `apiRoot` chỉ là gốc Telegram Bot API. Dùng `https://api.telegram.org` hoặc gốc tự lưu trữ/proxy của bạn, không dùng `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` xóa hậu tố `/bot<TOKEN>` vô tình ở cuối.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (từ 2 id tài khoản trở lên), đặt một mặc định rõ ràng (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi mục này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các lần ghi cấu hình khởi tạo từ Telegram (di chuyển ID siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [Agent ACP](/vi/tools/acp-agents#channel-specific-settings).
- Bản xem trước stream của Telegram dùng `sendMessage` + `editMessageText` (hoạt động trong trò chuyện trực tiếp và nhóm).
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- Các lệnh gọi đi trực tiếp cung cấp Discord `token` rõ ràng sẽ dùng token đó cho lệnh gọi; cài đặt thử lại/chính sách của tài khoản vẫn lấy từ tài khoản đã chọn trong snapshot runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho đích gửi; ID số trần sẽ bị từ chối.
- Slug guild dùng chữ thường và thay khoảng trắng bằng `-`; khóa kênh dùng tên đã slug hóa (không có `#`). Nên dùng ID guild.
- Tin nhắn do bot tạo mặc định bị bỏ qua. `allowBots: true` bật các tin nhắn đó; dùng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot (tin nhắn của chính bot vẫn bị lọc).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và các ghi đè kênh) loại bỏ tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (không tính @everyone/@here).
- `maxLinesPerMessage` (mặc định 17) chia các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.threadBindings` điều khiển định tuyến ràng buộc theo thread Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên ràng buộc theo thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và gửi/định tuyến đã ràng buộc)
  - `idleHours`: ghi đè Discord cho tự động bỏ focus khi không hoạt động, tính bằng giờ (`0` tắt)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng, tính bằng giờ (`0` tắt)
  - `spawnSubagentSessions`: công tắc bật riêng cho việc tự động tạo/ràng buộc thread của `sessions_spawn({ thread: true })`
- Các mục cấp cao nhất `bindings[]` với `type: "acp"` cấu hình ràng buộc ACP lâu dài cho kênh và thread (dùng id kênh/thread trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [Tác nhân ACP](/vi/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho container components v2 của Discord.
- `channels.discord.voice` bật hội thoại kênh thoại Discord và các ghi đè tự động tham gia + LLM + TTS tùy chọn.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM dùng cho phản hồi kênh thoại Discord.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` được chuyển tiếp đến tùy chọn DAVE của `@discordjs/voice` (`true` và `24` theo mặc định).
- OpenClaw cũng cố gắng khôi phục nhận thoại bằng cách rời/tham gia lại một phiên thoại sau các lỗi giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ stream chuẩn. Các giá trị cũ `streamMode` và boolean `streaming` được tự động di trú.
- `channels.discord.autoPresence` ánh xạ trạng thái sẵn sàng runtime sang trạng thái hiện diện của bot (healthy => online, degraded => idle, exhausted => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` bật lại khớp tên/thẻ có thể thay đổi (chế độ tương thích khẩn cấp).
- `channels.discord.execApprovals`: gửi phê duyệt exec theo kiểu gốc Discord và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Discord được phép phê duyệt yêu cầu exec. Dự phòng về `commands.ownerAllowFrom` khi bỏ qua.
  - `agentFilter`: danh sách cho phép ID tác nhân tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác nhân.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi đến DM của người phê duyệt, `"channel"` gửi đến kênh gốc, `"both"` gửi đến cả hai. Khi đích bao gồm `"channel"`, nút chỉ dùng được bởi những người phê duyệt đã phân giải.
  - `cleanupAfterResolve`: khi `true`, xóa DM phê duyệt sau khi phê duyệt, từ chối hoặc hết thời gian chờ.

**Chế độ thông báo reaction:** `off` (không có), `own` (tin nhắn của bot, mặc định), `all` (tất cả tin nhắn), `allowlist` (từ `guilds.<id>.users` trên mọi tin nhắn).

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
- Dùng `spaces/<spaceId>` hoặc `users/<userId>` cho đích gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại khớp principal email có thể thay đổi (chế độ tương thích khẩn cấp).

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

- **Chế độ socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` cho dự phòng env của tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cộng với `signingSecret` (ở root hoặc theo từng tài khoản).
- `socketMode` chuyển tiếp tinh chỉnh vận chuyển Slack SDK Socket Mode đến API receiver Bolt công khai. Chỉ dùng khi điều tra thời gian chờ ping/pong hoặc hành vi websocket cũ.
- `botToken`, `appToken`, `signingSecret`, và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Snapshot tài khoản Slack hiển thị các trường nguồn/trạng thái theo từng credential như
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, và, trong chế độ HTTP,
  `signingSecretStatus`. `configured_unavailable` nghĩa là tài khoản được
  cấu hình qua SecretRef nhưng đường dẫn lệnh/runtime hiện tại không thể
  phân giải giá trị bí mật.
- `configWrites: false` chặn ghi cấu hình khởi phát từ Slack.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ stream Slack chuẩn. `channels.slack.streaming.nativeTransport` điều khiển vận chuyển streaming gốc của Slack. Các giá trị cũ `streamMode`, boolean `streaming`, và `nativeStreaming` được tự động di trú.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` cho đích gửi.

**Chế độ thông báo reaction:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cô lập phiên thread:** `thread.historyScope` là theo từng thread (mặc định) hoặc dùng chung trên kênh. `thread.inheritParent` sao chép transcript kênh cha sang thread mới.

- Streaming gốc Slack cộng với trạng thái thread kiểu trợ lý Slack "is typing..." yêu cầu một đích thread trả lời. DM cấp cao nhất mặc định không nằm trong thread, nên chúng dùng `typingReaction` hoặc cách gửi thông thường thay vì preview kiểu thread.
- `typingReaction` thêm một reaction tạm thời vào tin nhắn Slack đầu vào trong khi phản hồi đang chạy, rồi xóa nó khi hoàn tất. Dùng shortcode emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: gửi phê duyệt exec theo kiểu gốc Slack và ủy quyền người phê duyệt. Cùng schema với Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter`, và `target` (`"dm"`, `"channel"`, hoặc `"both"`).

| Nhóm hành động | Mặc định | Ghi chú                  |
| ------------ | ------- | ---------------------- |
| reactions    | bật | React + liệt kê reactions |
| messages     | bật | Đọc/gửi/sửa/xóa  |
| pins         | bật | Ghim/bỏ ghim/liệt kê         |
| memberInfo   | bật | Thông tin thành viên            |
| emojiList    | bật | Danh sách emoji tùy chỉnh      |

### Mattermost

Mattermost được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại. Các bản build cũ hơn hoặc
tùy chỉnh có thể cài một gói npm hiện tại bằng
`openclaw plugins install @openclaw/mattermost`; nếu npm báo cáo gói
do OpenClaw sở hữu là deprecated, hãy dùng Plugin đi kèm hoặc một checkout cục bộ
cho đến khi gói npm mới hơn được xuất bản.

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

Chế độ chat: `oncall` (phản hồi khi được @-mention, mặc định), `onmessage` (mọi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi lệnh gốc Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải URL đầy đủ.
- `commands.callbackUrl` phải phân giải đến endpoint Gateway OpenClaw và có thể truy cập từ máy chủ Mattermost.
- Callback slash gốc được xác thực bằng token theo từng lệnh do Mattermost trả về
  trong quá trình đăng ký slash command. Nếu đăng ký thất bại hoặc không có
  lệnh nào được kích hoạt, OpenClaw từ chối callback với
  `Unauthorized: invalid command token.`
- Đối với host callback riêng/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm host/domain callback.
  Dùng giá trị host/domain, không dùng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối ghi cấu hình khởi phát từ Mattermost.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi trả lời trong kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè kiểm soát theo mention cho từng kênh (`"*"` cho mặc định).
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
- `channels.signal.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.

### BlueBubbles

BlueBubbles là đường dẫn iMessage được khuyến nghị (được Plugin hỗ trợ, cấu hình dưới `channels.bluebubbles`).

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

- Các đường dẫn khóa lõi được đề cập ở đây: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` có thể liên kết các cuộc trò chuyện BlueBubbles với các phiên ACP bền vững. Dùng handle BlueBubbles hoặc chuỗi đích (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác nhân ACP](/vi/tools/acp-agents#channel-specific-settings).
- Cấu hình kênh BlueBubbles đầy đủ được ghi lại trong [BlueBubbles](/vi/channels/bluebubbles).

### iMessage

OpenClaw sinh `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hay cổng.

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

- Yêu cầu Full Disk Access vào Messages DB.
- Ưu tiên các đích `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê cuộc trò chuyện.
- `cliPath` có thể trỏ đến một wrapper SSH; đặt `remoteHost` (`host` hoặc `user@host`) để lấy tệp đính kèm bằng SCP.
- `attachmentRoots` và `remoteAttachmentRoots` hạn chế các đường dẫn tệp đính kèm gửi đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP dùng kiểm tra khóa máy chủ nghiêm ngặt, vì vậy hãy đảm bảo khóa máy chủ relay đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do iMessage khởi tạo.
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` có thể liên kết các cuộc trò chuyện iMessage với các phiên ACP bền vững. Dùng handle đã chuẩn hóa hoặc đích cuộc trò chuyện rõ ràng (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác nhân ACP](/vi/tools/acp-agents#channel-specific-settings).

<Accordion title="Ví dụ wrapper SSH cho iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được Plugin hỗ trợ và được cấu hình dưới `channels.matrix`.

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
- `channels.matrix.proxy` định tuyến lưu lượng HTTP của Matrix qua một proxy HTTP(S) rõ ràng. Các tài khoản được đặt tên có thể ghi đè bằng `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép các homeserver riêng tư/nội bộ. `proxy` và lựa chọn tham gia mạng này là các điều khiển độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong thiết lập nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `off`, vì vậy các phòng được mời và lời mời kiểu DM mới sẽ bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` với `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt exec gốc Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Matrix (ví dụ `@owner:example.org`) được phép phê duyệt yêu cầu exec.
  - `agentFilter`: allowlist ID tác nhân tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho mọi tác nhân.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định), `"channel"` (phòng gốc), hoặc `"both"`.
  - Ghi đè theo tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách các DM Matrix nhóm thành phiên: `per-user` (mặc định) chia sẻ theo peer đã định tuyến, trong khi `per-room` cô lập từng phòng DM.
- Các probe trạng thái Matrix và tra cứu thư mục trực tiếp dùng cùng chính sách proxy như lưu lượng runtime.
- Cấu hình Matrix đầy đủ, quy tắc nhắm đích và ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được Plugin hỗ trợ và được cấu hình dưới `channels.msteams`.

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
- Cấu hình Teams đầy đủ (thông tin xác thực, Webhook, chính sách DM/nhóm, ghi đè theo nhóm/theo kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được Plugin hỗ trợ và được cấu hình dưới `channels.irc`.

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
- Cấu hình kênh IRC đầy đủ (máy chủ/cổng/TLS/kênh/allowlist/cổng kiểm soát mention) được ghi lại trong [IRC](/vi/channels/irc).

### Đa tài khoản (tất cả kênh)

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

- `default` được dùng khi `accountId` bị bỏ qua (CLI + định tuyến).
- Token môi trường chỉ áp dụng cho tài khoản **default**.
- Cài đặt kênh cơ sở áp dụng cho mọi tài khoản trừ khi bị ghi đè theo tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản đến một tác nhân khác nhau.
- Nếu bạn thêm tài khoản không mặc định bằng `openclaw channels add` (hoặc onboarding kênh) khi vẫn đang dùng cấu hình kênh cấp cao nhất một tài khoản, OpenClaw sẽ trước tiên nâng cấp các giá trị một tài khoản cấp cao nhất thuộc phạm vi tài khoản vào bản đồ tài khoản kênh để tài khoản ban đầu tiếp tục hoạt động. Hầu hết kênh chuyển chúng vào `channels.<channel>.accounts.default`; Matrix có thể giữ lại một đích được đặt tên/mặc định hiện có khớp thay vào đó.
- Các binding chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định; binding theo phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa các dạng trộn bằng cách di chuyển các giá trị một tài khoản cấp cao nhất thuộc phạm vi tài khoản vào tài khoản đã nâng cấp được chọn cho kênh đó. Hầu hết kênh dùng `accounts.default`; Matrix có thể giữ lại một đích được đặt tên/mặc định hiện có khớp thay vào đó.

### Các kênh Plugin khác

Nhiều kênh Plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang kênh chuyên biệt của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat và Twitch).
Xem chỉ mục kênh đầy đủ: [Kênh](/vi/channels).

### Cổng kiểm soát mention trong trò chuyện nhóm

Tin nhắn nhóm mặc định là **yêu cầu mention** (mention metadata hoặc mẫu regex an toàn). Áp dụng cho WhatsApp, Telegram, Discord, Google Chat và trò chuyện nhóm iMessage.

Phản hồi hiển thị được kiểm soát riêng. Phòng nhóm/kênh mặc định là `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw vẫn xử lý lượt, nhưng các phản hồi cuối thông thường vẫn ở chế độ riêng tư và đầu ra phòng hiển thị yêu cầu `message(action=send)`. Chỉ đặt `"automatic"` khi bạn muốn hành vi cũ, trong đó phản hồi thông thường được đăng lại vào phòng. Để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ cho cả trò chuyện trực tiếp, hãy đặt `messages.visibleReplies: "message_tool"`.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ quay về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về điểm không khớp này.

Gateway hot-reload cấu hình `messages` sau khi tệp được lưu. Chỉ khởi động lại khi theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

**Loại mention:**

- **Mention metadata**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự trò chuyện của WhatsApp.
- **Mẫu văn bản**: Mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Mẫu không hợp lệ và lặp lồng nhau không an toàn bị bỏ qua.
- Cổng kiểm soát mention chỉ được thực thi khi có thể phát hiện (mention gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.groupChat.historyLimit` đặt mặc định toàn cục. Kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo tài khoản). Đặt `0` để tắt.

`messages.visibleReplies` là mặc định toàn cục cho lượt nguồn; `messages.groupChat.visibleReplies` ghi đè cho lượt nguồn nhóm/kênh. Allowlist kênh và cổng kiểm soát mention vẫn quyết định liệu một lượt có được xử lý hay không.

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

Cách phân giải: ghi đè theo DM → mặc định nhà cung cấp → không giới hạn (giữ lại tất cả).

Được hỗ trợ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Chế độ tự trò chuyện

Đưa số của chính bạn vào `allowFrom` để bật chế độ tự trò chuyện (bỏ qua @-mention gốc, chỉ phản hồi các mẫu văn bản):

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

### Lệnh (xử lý lệnh trong trò chuyện)

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

<Accordion title="Chi tiết lệnh">

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp hiện tại và đi kèm, hãy xem [Lệnh gạch chéo](/vi/tools/slash-commands).
- Trang này là **tham chiếu khóa cấu hình**, không phải toàn bộ danh mục lệnh. Các lệnh do kênh/Plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép đôi thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone`, và Talk `/voice` được ghi tài liệu trong các trang kênh/Plugin của chúng cùng với [Lệnh gạch chéo](/vi/tools/slash-commands).
- Lệnh văn bản phải là các tin nhắn **độc lập** bắt đầu bằng `/`.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram, để Slack tắt.
- `nativeSkills: "auto"` bật lệnh Skills gốc cho Discord/Telegram, để Slack tắt.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó.
- Ghi đè đăng ký Skills gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram bổ sung.
- `bash: true` bật `! <cmd>` cho shell máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Với các máy khách Gateway `chat.send`, thao tác ghi `/config set|unset` bền vững cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn khả dụng cho các máy khách operator bình thường có phạm vi ghi.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`.
- `plugins: true` bật `/plugins` cho khám phá, cài đặt và điều khiển bật/tắt Plugin.
- `channels.<provider>.configWrites` kiểm soát đột biến cấu hình theo từng kênh (mặc định: true).
- Với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm tới tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` tắt `/restart` và các hành động công cụ khởi động lại Gateway. Mặc định: `true`.
- `ownerAllowFrom` là danh sách cho phép chủ sở hữu rõ ràng dành cho các lệnh/công cụ chỉ dành cho chủ sở hữu. Nó tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm id chủ sở hữu trong lời nhắc hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` áp dụng theo từng provider. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép đôi của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép các lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` không được đặt.
- Bản đồ tài liệu lệnh:
  - danh mục tích hợp và đi kèm: [Lệnh gạch chéo](/vi/tools/slash-commands)
  - bề mặt lệnh theo kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép đôi: [Ghép đôi](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - bộ nhớ Dreaming: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất
- [Cấu hình — agent](/vi/gateway/config-agents)
- [Tổng quan kênh](/vi/channels)
