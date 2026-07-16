---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, đa tài khoản)
    - Khắc phục sự cố với các khóa cấu hình riêng cho từng kênh
    - Kiểm tra chính sách tin nhắn trực tiếp, chính sách nhóm hoặc cơ chế kiểm soát lượt đề cập
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép nối, khóa riêng cho từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều nền tảng khác'
title: Cấu hình — kênh
x-i18n:
    generated_at: "2026-07-16T14:24:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo từng kênh trong `channels.*`: quyền truy cập tin nhắn trực tiếp và nhóm, thiết lập nhiều tài khoản, kiểm soát yêu cầu đề cập và các khóa riêng theo kênh cho Slack, Discord, Telegram, WhatsApp, Matrix, iMessage cùng các Plugin kênh khác.

Đối với agent, công cụ, môi trường chạy Gateway và các khóa cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của kênh tồn tại (trừ khi `enabled: false`). Telegram và iMessage được cung cấp trong gói `openclaw` lõi. Các kênh chính thức khác (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost và nhiều kênh khác) được cài đặt dưới dạng các Plugin riêng biệt bằng `openclaw plugins install <spec>`; xem [Kênh](/vi/channels) để biết danh sách đầy đủ và đặc tả cài đặt.

### Quyền truy cập tin nhắn trực tiếp và nhóm

Tất cả các kênh đều hỗ trợ chính sách tin nhắn trực tiếp và chính sách nhóm:

| Chính sách tin nhắn trực tiếp | Hành vi                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận mã ghép nối dùng một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ những người gửi trong `allowFrom` (hoặc kho danh sách cho phép đã ghép nối)             |
| `open`              | Cho phép mọi tin nhắn trực tiếp đến (yêu cầu `allowFrom: ["*"]`)             |
| `disabled`          | Bỏ qua mọi tin nhắn trực tiếp đến                                          |

| Chính sách nhóm          | Hành vi                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (mặc định) | Chỉ các nhóm khớp với danh sách cho phép đã cấu hình          |
| `open`                | Bỏ qua danh sách cho phép của nhóm (kiểm soát yêu cầu đề cập vẫn áp dụng) |
| `disabled`            | Chặn mọi tin nhắn nhóm/phòng                          |

<Note>
`channels.defaults.groupPolicy` đặt giá trị mặc định khi `groupPolicy` của nhà cung cấp chưa được thiết lập.
Mã ghép nối hết hạn sau 1 giờ. Số yêu cầu ghép nối đang chờ được giới hạn ở **3 yêu cầu mỗi tài khoản** (phạm vi theo kênh và mã định danh tài khoản).
Nếu toàn bộ khối nhà cung cấp bị thiếu (không có `channels.<provider>`), chính sách nhóm khi chạy sẽ dự phòng về `allowlist` (đóng khi có lỗi) kèm cảnh báo khi khởi động.
</Note>

### Ghi đè mô hình theo kênh

Dùng `channels.modelByChannel` để ghim các mã định danh kênh hoặc đối tác nhắn tin trực tiếp cụ thể vào một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh chỉ áp dụng khi phiên chưa có ghi đè mô hình đang hoạt động (ví dụ: ghi đè được thiết lập qua `/model`).

Đối với cuộc trò chuyện nhóm/luồng, khóa là mã định danh nhóm, mã định danh chủ đề hoặc tên kênh dành riêng cho từng kênh. Đối với cuộc trò chuyện bằng tin nhắn trực tiếp (DM), khóa là mã định danh đối tác được suy ra từ danh tính người gửi của kênh (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` hoặc `SenderId`). Dạng khóa chính xác tùy thuộc vào kênh:

| Kênh  | Dạng khóa DM         | Ví dụ                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | mã định danh người dùng thô         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | mã định danh người dùng Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | mã định danh người dùng thô         | `123456789`                                  |
| WhatsApp | số điện thoại hoặc JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Các khóa dành riêng cho DM chỉ khớp trong cuộc trò chuyện bằng tin nhắn trực tiếp; chúng không ảnh hưởng đến việc định tuyến nhóm/luồng.

### Giá trị mặc định của kênh và Heartbeat

Dùng `channels.defaults` cho chính sách nhóm và hành vi Heartbeat dùng chung giữa các nhà cung cấp:

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

- `channels.defaults.groupPolicy`: chính sách nhóm dự phòng khi `groupPolicy` cấp nhà cung cấp chưa được thiết lập.
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả các kênh. Giá trị: `all` (mặc định, bao gồm toàn bộ ngữ cảnh trích dẫn/luồng/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống danh sách cho phép nhưng giữ lại ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo từng kênh: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh bình thường trong đầu ra Heartbeat (mặc định `false`).
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra Heartbeat (mặc định `true`).
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra Heartbeat dạng chỉ báo gọn (mặc định `true`).

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = thử lại vô thời hạn
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // dấu tích xanh (false trong chế độ tự trò chuyện)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (mặc định `25000`), `connectTimeoutMs` (mặc định `60000`) và `defaultQueryTimeoutMs` (mặc định `60000`) tinh chỉnh socket Baileys.
- Giá trị mặc định của `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` thử lại vô thời hạn thay vì bỏ cuộc.
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình liên kết ACP bền vững cho DM và nhóm WhatsApp. Dùng số trực tiếp E.164 hoặc JID nhóm WhatsApp trong `match.peer.id`. Ngữ nghĩa trường được dùng chung trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).

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

- Các lệnh gửi đi mặc định dùng tài khoản `default` nếu có; nếu không, dùng mã định danh tài khoản được cấu hình đầu tiên (sau khi sắp xếp).
- `channels.whatsapp.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định dự phòng đó khi khớp với một mã định danh tài khoản đã cấu hình.
- Thư mục xác thực Baileys một tài khoản cũ được `openclaw doctor` di chuyển vào `whatsapp/default`.
- Ghi đè theo từng tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Giữ câu trả lời ngắn gọn.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Bám sát chủ đề.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Sao lưu Git" },
        { command: "generate", description: "Tạo hình ảnh" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: { mode: "partial" }, // off | partial | block | progress (mặc định: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; liên kết tượng trưng bị từ chối), với `TELEGRAM_BOT_TOKEN` làm phương án dự phòng cho tài khoản mặc định.
- `apiRoot` chỉ là gốc Telegram Bot API. Dùng `https://api.telegram.org` hoặc gốc tự lưu trữ/proxy của bạn, không dùng `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` loại bỏ hậu tố `/bot<TOKEN>` vô tình nằm ở cuối.
- Đối với máy chủ Bot API tự lưu trữ ở chế độ `--local`, `trustedLocalFileRoots` liệt kê các đường dẫn trên máy chủ mà OpenClaw có thể đọc. Gắn ổ dữ liệu máy chủ vào máy chủ OpenClaw và cấu hình thư mục gốc dữ liệu hoặc thư mục theo từng token; các đường dẫn bộ chứa trong `/var/lib/telegram-bot-api` được ánh xạ vào các thư mục gốc đó. Các đường dẫn tuyệt đối khác vẫn bị từ chối.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một mã định danh tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (2+ mã định danh tài khoản), hãy đặt rõ tài khoản mặc định (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi giá trị này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các thao tác ghi cấu hình do Telegram khởi tạo (di chuyển mã định danh siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình liên kết ACP bền vững cho các chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn tắc trong `match.peer.id`). Ngữ nghĩa trường được dùng chung trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Bản xem trước luồng Telegram sử dụng `sendMessage` + `editMessageText` (hoạt động trong cả cuộc trò chuyện trực tiếp và nhóm).
- `network.dnsResultOrder` mặc định là `"ipv4first"` để tránh các lỗi tìm nạp IPv6 phổ biến.
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
              systemPrompt: "Chỉ trả lời ngắn gọn.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (mặc định của Discord: progress)
        chunkMode: "length", // length | newline
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- Token: `channels.discord.token`, với `DISCORD_BOT_TOKEN` làm phương án dự phòng cho tài khoản mặc định.
- Các lệnh gọi đi trực tiếp cung cấp rõ ràng `token` của Discord sẽ sử dụng token đó cho lệnh gọi; các thiết lập thử lại/chính sách của tài khoản vẫn lấy từ tài khoản được chọn trong ảnh chụp nhanh runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) làm đích gửi; các ID chỉ gồm số sẽ bị từ chối.
- Slug của guild viết thường và thay khoảng trắng bằng `-`; khóa kênh sử dụng tên đã chuyển thành slug (không có `#`). Ưu tiên ID guild.
- Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua. `allowBots: true` cho phép các tin nhắn này; sử dụng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot có đề cập đến bot (tin nhắn của chính bot vẫn bị lọc).
- Các kênh hỗ trợ tin nhắn đến do bot tạo có thể sử dụng cơ chế [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Đặt `channels.defaults.botLoopProtection` cho ngân sách cặp cơ sở, sau đó chỉ ghi đè kênh hoặc tài khoản khi một bề mặt cần giới hạn khác.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và các giá trị ghi đè theo kênh) loại bỏ tin nhắn đề cập đến người dùng hoặc vai trò khác nhưng không đề cập đến bot (ngoại trừ @everyone/@here).
- `channels.discord.mentionAliases` ánh xạ văn bản `@handle` gửi đi ổn định tới ID người dùng Discord trước khi gửi, nhờ đó có thể đề cập đến các đồng đội đã biết một cách xác định ngay cả khi bộ nhớ đệm thư mục tạm thời trống. Các giá trị ghi đè theo tài khoản nằm trong `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (mặc định `17`) chia nhỏ các tin nhắn dài theo chiều dọc ngay cả khi dưới 2000 ký tự.
- `channels.discord.suppressEmbeds` mặc định là `true`, vì vậy URL gửi đi không mở rộng thành bản xem trước liên kết Discord trừ khi bị vô hiệu hóa. Các payload `embeds` rõ ràng vẫn được gửi bình thường; các lệnh gọi công cụ theo từng tin nhắn có thể ghi đè bằng `suppressEmbeds`.
- `channels.discord.threadBindings` kiểm soát định tuyến gắn với luồng của Discord:
  - `enabled`: giá trị ghi đè của Discord cho các tính năng phiên gắn với luồng (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` và việc gửi/định tuyến đã liên kết)
  - `idleHours`: giá trị ghi đè của Discord cho thời gian tự động bỏ tập trung do không hoạt động, tính bằng giờ (`0` sẽ vô hiệu hóa)
  - `maxAgeHours`: giá trị ghi đè của Discord cho tuổi tối đa tuyệt đối, tính bằng giờ (`0` sẽ vô hiệu hóa)
  - `spawnSessions`: công tắc bật tính năng tự động tạo/liên kết luồng cho `sessions_spawn({ thread: true })` và thao tác tạo luồng ACP (mặc định: `true`)
  - `defaultSpawnContext`: ngữ cảnh subagent gốc cho các phiên tạo gắn với luồng (mặc định là `"fork"`)
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình liên kết ACP lâu dài cho các kênh và luồng (sử dụng ID kênh/luồng trong `match.peer.id`). Ngữ nghĩa trường được dùng chung trong [Tác nhân ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho vùng chứa thành phần v2 của Discord.
- `channels.discord.agentComponents.ttlMs` kiểm soát thời gian các callback của thành phần Discord đã gửi tiếp tục được đăng ký. Mặc định `1800000` (30 phút), tối đa `86400000` (24 giờ). Các giá trị ghi đè theo tài khoản nằm trong `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Ưu tiên TTL ngắn nhất đáp ứng quy trình làm việc.
- `channels.discord.voice` cho phép hội thoại trong kênh thoại Discord cùng các giá trị ghi đè tùy chọn về tự động tham gia + LLM + TTS. Cấu hình Discord chỉ có văn bản mặc định tắt thoại; đặt `channels.discord.voice.enabled=true` để bật.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM dùng cho phản hồi trong kênh thoại Discord.
- `channels.discord.voice.daveEncryption` (mặc định `true`) và `channels.discord.voice.decryptionFailureTolerance` (mặc định `24`) được chuyển trực tiếp đến các tùy chọn DAVE của `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia (mặc định `30000`).
- `channels.discord.voice.reconnectGraceMs` kiểm soát thời gian tối đa để một phiên thoại bị ngắt kết nối chuyển sang báo hiệu kết nối lại trước khi OpenClaw hủy phiên đó (mặc định `15000`).
- Việc phát âm thanh thoại Discord không bị gián đoạn bởi sự kiện người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua dữ liệu thoại mới trong khi TTS đang phát.
- Ngoài ra, OpenClaw cố gắng khôi phục việc nhận thoại bằng cách rời khỏi rồi tham gia lại phiên thoại sau nhiều lần giải mã thất bại.
- `channels.discord.streaming` là khóa chế độ luồng chuẩn. Discord mặc định sử dụng `streaming.mode: "progress"` để tiến trình công cụ/công việc xuất hiện trong một tin nhắn xem trước được chỉnh sửa; đặt `streaming.mode: "off"` để vô hiệu hóa. Các khóa phẳng cũ (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) không còn được đọc trong runtime; chạy `openclaw doctor --fix` để di chuyển cấu hình đã lưu.
- `channels.discord.autoPresence` ánh xạ trạng thái khả dụng của runtime sang trạng thái hiện diện của bot (healthy => online, degraded => idle, exhausted => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.guilds.<id>.presenceEvents` định tuyến các lần trạng thái khả dụng của con người xuất hiện vào một kênh Discord đã cấu hình dưới dạng sự kiện hệ thống của tác nhân. Thành viên đủ điều kiện phải có khả năng xem `channelId`; các luồng công khai kế thừa quyền hiển thị của kênh cha, còn luồng riêng tư yêu cầu thêm tư cách thành viên hoặc Manage Threads. `users` có thể thu hẹp thêm đối tượng đó. Tính năng này khởi tạo danh sách thành viên đang trực tuyến từ các ảnh chụp nhanh `GUILD_CREATE` hoàn chỉnh, định tuyến các chuyển đổi từ ngoại tuyến sang trực tuyến được quan sát và coi tín hiệu trực tuyến đầu tiên xuất hiện sau đó của một thành viên chưa từng thấy là mới khả dụng mà không khẳng định họ vừa trực tuyến hay vừa tham gia sau ảnh chụp nhanh. Các guild vượt quá giới hạn ảnh chụp nhanh 75,000 thành viên của Discord trước tiên cần có một bản cập nhật ngoại tuyến rõ ràng. Các tham số điều tiết: `reconnectSuppressSeconds` (khoảng thời gian yên lặng sau một phiên Gateway mới trong khi trạng thái hiện diện của guild được dựng lại, mặc định 300, `0` sẽ vô hiệu hóa) và `burstLimit`/`burstWindowSeconds` (giới hạn tốc độ sự kiện được xếp hàng thành công theo từng guild, mặc định 8 sự kiện mỗi cửa sổ trượt 60s). Các phiên được tiếp tục không khởi động khoảng thời gian chặn khi kết nối lại. Thời gian hồi để chào lại theo từng người dùng hiện có vẫn là tám giờ. Tính năng này yêu cầu `channels.discord.intents.presence=true`, Presence Intent đặc quyền trong Developer Portal của Discord và Heartbeat tác nhân đã bật.
- `channels.discord.dangerouslyAllowNameMatching` bật lại việc đối sánh tên/thẻ có thể thay đổi (chế độ tương thích khẩn cấp).
- `channels.discord.execApprovals`: gửi phê duyệt thực thi theo cơ chế gốc của Discord và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false` hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt thực thi được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: các ID người dùng Discord được phép phê duyệt yêu cầu thực thi. Sử dụng `commands.ownerAllowFrom` làm phương án dự phòng khi bị bỏ qua.
  - `agentFilter`: danh sách cho phép ID tác nhân tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác nhân.
  - `sessionFilter`: các mẫu khóa phiên tùy chọn (chuỗi con hoặc biểu thức chính quy).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi tới DM của người phê duyệt, `"channel"` gửi tới kênh khởi nguồn, `"both"` gửi tới cả hai. Khi đích bao gồm `"channel"`, chỉ những người phê duyệt đã phân giải mới có thể sử dụng các nút.
  - `cleanupAfterResolve`: khi là `true`, xóa DM phê duyệt sau khi được phê duyệt, từ chối hoặc hết thời gian chờ.

**Các chế độ thông báo phản ứng:** `off` (không có), `own` (tin nhắn của bot, mặc định), `all` (tất cả tin nhắn), `allowlist` (từ `guilds.<id>.users` trên tất cả tin nhắn).

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
- SecretRef của tài khoản dịch vụ cũng được hỗ trợ (`serviceAccountRef`).
- Các phương án dự phòng từ biến môi trường: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (chỉ tài khoản mặc định).
- Sử dụng `spaces/<spaceId>` hoặc `users/<userId>` làm đích gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại việc đối sánh danh tính email có thể thay đổi (chế độ tương thích khẩn cấp).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Chỉ trả lời ngắn gọn.",
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // sử dụng API truyền phát gốc của Slack khi mode=partial
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

- **Chế độ Socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` để dự phòng về biến môi trường của tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cùng với `signingSecret` (ở cấp gốc hoặc theo từng tài khoản).
- `enterpriseOrgInstall: true` đưa một tài khoản vào đường dẫn sự kiện trên toàn tổ chức của Slack Enterprise Grid. Khi khởi động, hệ thống xác minh token bot bằng `auth.test` và
  báo lỗi khi chế độ đã cấu hình không khớp với danh tính cài đặt của Slack.
  DM doanh nghiệp phải bị tắt hoặc sử dụng `dmPolicy: "open"` với một
  `allowFrom: ["*"]` có hiệu lực. Chính sách kênh và người dùng phải sử dụng ID Slack ổn định;
  tên có thể thay đổi và tiền tố kênh không được hỗ trợ sẽ khiến quá trình khởi động thất bại. V1 chỉ xử lý
  các sự kiện Socket Mode trực tiếp hoặc HTTP `message` và `app_mention` với phản hồi
  tức thì; chuyển tiếp, lệnh, tương tác, App Home, trình lắng nghe sự kiện phản ứng,
  ghim, công cụ hành động, phê duyệt gốc, liên kết, gửi trì hoãn và
  gửi chủ động đều không khả dụng. Xác nhận, trạng thái đang nhập và
  phản ứng trạng thái do trình lắng nghe quản lý vẫn khả dụng với `reactions:write`; thông báo
  phản ứng đến và công cụ hành động phản ứng không khả dụng. Xem
  [Cài đặt trên toàn tổ chức Enterprise Grid](/vi/channels/slack#enterprise-grid-org-wide-installs)
  để biết manifest đặc quyền tối thiểu, quy trình thiết lập và toàn bộ hạn chế.
- `socketMode` chuyển trực tiếp các tùy chỉnh truyền tải Socket Mode của Slack SDK sang API bộ nhận Bolt công khai. Chỉ sử dụng khi điều tra thời gian chờ ping/pong hoặc hành vi websocket lỗi thời. `clientPingTimeout` mặc định là `15000`; `serverPingTimeout` và `pingPongLoggingEnabled` chỉ được chuyển khi đã cấu hình.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi
  văn bản thuần hoặc đối tượng SecretRef.
- Ảnh chụp nhanh tài khoản Slack cung cấp các trường nguồn/trạng thái theo từng thông tin xác thực như
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` và, trong chế độ HTTP,
  `signingSecretStatus`. `configured_unavailable` có nghĩa là tài khoản được
  cấu hình thông qua SecretRef nhưng đường dẫn lệnh/runtime hiện tại không thể
  phân giải giá trị bí mật.
- `configWrites: false` chặn các thao tác ghi cấu hình do Slack khởi tạo.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID của một tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ luồng Slack chính thức (mặc định `"partial"`). `channels.slack.streaming.nativeTransport` điều khiển cơ chế truyền phát gốc của Slack (mặc định `true`). Các giá trị cũ `streamMode`, giá trị boolean `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` và `nativeStreaming` không còn được đọc trong runtime; chạy `openclaw doctor --fix` để di chuyển cấu hình đã lưu sang `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` và `unfurlMedia` chuyển trực tiếp các giá trị boolean bung liên kết và nội dung đa phương tiện `chat.postMessage` của Slack cho phản hồi của bot. `unfurlLinks` mặc định là `false` để liên kết do bot gửi đi không mở rộng nội tuyến trừ khi được bật; `unfurlMedia` bị bỏ qua trừ khi đã cấu hình. Đặt một trong hai giá trị tại `channels.slack.accounts.<accountId>` để ghi đè giá trị cấp cao nhất cho một tài khoản.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` làm đích gửi.

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cô lập phiên luồng:** `thread.historyScope` áp dụng theo từng luồng (mặc định) hoặc được dùng chung trên toàn kênh. `thread.inheritParent` sao chép bản ghi hội thoại của kênh mẹ sang các luồng mới. `thread.initialHistoryLimit` (mặc định `20`) giới hạn số lượng tin nhắn hiện có trong luồng được truy xuất khi một phiên luồng mới bắt đầu; `0` tắt việc truy xuất lịch sử luồng.

- Cơ chế truyền phát gốc của Slack cùng trạng thái luồng kiểu trợ lý "is typing..." của Slack yêu cầu đích là một luồng phản hồi. DM cấp cao nhất mặc định vẫn nằm ngoài luồng, nên chúng vẫn có thể truyền phát thông qua bản xem trước bài đăng nháp rồi chỉnh sửa của Slack thay vì hiển thị bản xem trước luồng/trạng thái gốc theo kiểu luồng.
- `typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi đang tạo phản hồi, sau đó xóa phản ứng đó khi hoàn tất. Sử dụng mã ngắn emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: gửi bằng ứng dụng phê duyệt gốc của Slack và ủy quyền người phê duyệt thực thi. Lược đồ giống Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter` và `target` (`"dm"`, `"channel"` hoặc `"both"`). Phê duyệt Plugin có thể sử dụng đường dẫn ứng dụng gốc này cho yêu cầu bắt nguồn từ Slack khi phân giải được người phê duyệt Plugin Slack; việc gửi phê duyệt Plugin gốc của Slack cũng có thể được bật thông qua `approvals.plugin` cho phiên bắt nguồn từ Slack hoặc đích Slack. Phê duyệt Plugin sử dụng người phê duyệt Plugin Slack từ `allowFrom` và định tuyến mặc định, không sử dụng người phê duyệt thực thi.

| Nhóm hành động | Mặc định | Ghi chú                         |
| -------------- | -------- | ------------------------------- |
| reactions      | bật      | Phản ứng + liệt kê phản ứng     |
| messages       | bật      | Đọc/gửi/chỉnh sửa/xóa           |
| pins           | bật      | Ghim/bỏ ghim/liệt kê            |
| memberInfo     | bật      | Thông tin thành viên            |
| emojiList      | bật      | Danh sách emoji tùy chỉnh       |

### Mattermost

Mattermost được cài đặt dưới dạng một Plugin riêng biệt, giống như Discord, Slack và WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Kiểm tra [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) để biết các dist-tag hiện tại trước khi ghim một phiên bản.

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
        native: true, // chủ động bật
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL tường minh tùy chọn cho các triển khai proxy ngược/công khai
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Chế độ trò chuyện: `oncall` (phản hồi khi được @-đề cập, mặc định), `onmessage` (mọi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi lệnh gốc của Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải URL đầy đủ.
- `commands.callbackUrl` phải phân giải đến điểm cuối Gateway của OpenClaw và máy chủ Mattermost phải có thể truy cập được.
- Callback lệnh gạch chéo gốc được xác thực bằng token riêng cho từng lệnh do
  Mattermost trả về trong quá trình đăng ký lệnh gạch chéo. Nếu đăng ký thất bại hoặc không có
  lệnh nào được kích hoạt, OpenClaw từ chối callback với
  `Unauthorized: invalid command token.`
- Đối với máy chủ callback riêng tư/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` chứa máy chủ/tên miền callback.
  Sử dụng giá trị máy chủ/tên miền, không sử dụng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối thao tác ghi cấu hình do Mattermost khởi tạo.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi phản hồi trong các kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè điều kiện đề cập theo từng kênh (`"*"` cho mặc định).
- `channels.mattermost.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID của một tài khoản đã cấu hình.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // liên kết tài khoản tùy chọn
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
- `channels.signal.configWrites`: cho phép hoặc từ chối thao tác ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID của một tài khoản đã cấu hình.

### iMessage

OpenClaw khởi chạy `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hoặc cổng. Đây là đường dẫn được ưu tiên cho các thiết lập iMessage OpenClaw mới khi máy chủ có thể cấp quyền truy cập cơ sở dữ liệu Messages và quyền Automation.

Hỗ trợ BlueBubbles đã bị loại bỏ. `channels.bluebubbles` không phải là bề mặt cấu hình runtime được hỗ trợ trên OpenClaw hiện tại. Di chuyển cấu hình cũ sang `channels.imessage`; xem [Việc loại bỏ BlueBubbles và đường dẫn iMessage qua imsg](/vi/announcements/bluebubbles-imessage) để biết phiên bản ngắn gọn và [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng chuyển đổi đầy đủ.

Nếu Gateway không chạy trên máy Mac đã đăng nhập vào Messages, hãy giữ `channels.imessage.enabled=true` và đặt `channels.imessage.cliPath` thành một trình bao bọc SSH chạy `imsg "$@"` trên máy Mac đó. Đường dẫn cục bộ mặc định `imsg` chỉ dành cho macOS.

Trước khi dựa vào trình bao bọc SSH để gửi trong môi trường sản xuất, hãy xác minh một thao tác gửi đi `imsg send` thông qua chính trình bao bọc đó. Một số trạng thái TCC của macOS gán quyền Messages Automation cho `/usr/libexec/sshd-keygen-wrapper`, điều này có thể khiến thao tác đọc và thăm dò hoạt động trong khi thao tác gửi thất bại với AppleEvents `-1743`; xem phần khắc phục sự cố trình bao bọc SSH trên [iMessage](/vi/channels/imessage).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` tùy chọn sẽ ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Yêu cầu quyền Full Disk Access đối với cơ sở dữ liệu Messages.
- Ưu tiên các đích `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê các cuộc trò chuyện.
- `cliPath` có thể trỏ đến một trình bao bọc SSH; đặt `remoteHost` (`host` hoặc `user@host`) để tải tệp đính kèm qua SCP.
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn các đường dẫn tệp đính kèm gửi đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt, vì vậy hãy bảo đảm khóa của máy chủ chuyển tiếp đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối việc ghi cấu hình do iMessage khởi tạo.
- `channels.imessage.sendTransport`: phương thức truyền gửi RPC `imsg` ưu tiên cho các phản hồi gửi đi thông thường. `auto` (mặc định) sử dụng cầu nối IMCore cho các cuộc trò chuyện hiện có khi cầu nối đang chạy, sau đó dự phòng sang AppleScript; `bridge` yêu cầu phân phối qua API riêng tư; `applescript` buộc sử dụng đường dẫn tự động hóa Messages công khai.
- `channels.imessage.actions.*`: bật các hành động API riêng tư cũng được kiểm soát bởi `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` mặc định bị tắt; đặt thành `true` trước khi mong đợi nội dung đa phương tiện gửi đến xuất hiện trong các lượt của tác tử.
- Quá trình khôi phục tin nhắn gửi đến sau khi cầu nối/gateway khởi động lại diễn ra tự động (khử trùng lặp GUID cùng với giới hạn tuổi của tồn đọng cũ). Các cấu hình `channels.imessage.catchup.enabled: true` hiện có vẫn được hỗ trợ dưới dạng hồ sơ tương thích đã lỗi thời; `catchup` mặc định bị tắt.
- `channels.imessage.groups`: sổ đăng ký nhóm và cài đặt theo từng nhóm. Với `groupPolicy: "allowlist"`, hãy cấu hình các khóa `chat_id` tường minh hoặc một mục ký tự đại diện `"*"` để tin nhắn nhóm có thể vượt qua cổng sổ đăng ký.
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` có thể liên kết các cuộc trò chuyện iMessage với các phiên ACP liên tục. Dùng một định danh đã chuẩn hóa hoặc đích trò chuyện tường minh (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác tử ACP](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ví dụ về trình bao bọc SSH cho iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được hỗ trợ bởi plugin và được cấu hình trong `channels.matrix`.

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

- Xác thực bằng token sử dụng `accessToken`; xác thực bằng mật khẩu sử dụng `userId` + `password`.
- `channels.matrix.proxy` định tuyến lưu lượng HTTP của Matrix qua một proxy HTTP(S) tường minh. Các tài khoản có tên có thể ghi đè bằng `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép các homeserver riêng tư/nội bộ. `proxy` và lựa chọn tham gia mạng này là các cơ chế kiểm soát độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong các thiết lập nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `"off"`, vì vậy các phòng được mời và lời mời kiểu DM mới sẽ bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` với `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt thực thi theo cơ chế gốc của Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false` hoặc `"auto"` (mặc định). Trong chế độ tự động, phê duyệt thực thi được kích hoạt khi có thể xác định người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: các ID người dùng Matrix (ví dụ: `@owner:example.org`) được phép phê duyệt yêu cầu thực thi.
  - `agentFilter`: danh sách cho phép ID tác tử tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác tử.
  - `sessionFilter`: các mẫu khóa phiên tùy chọn (chuỗi con hoặc biểu thức chính quy).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định), `"channel"` (phòng khởi nguồn) hoặc `"both"`.
  - Ghi đè theo từng tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách các DM Matrix được nhóm thành phiên: `per-user` (mặc định) dùng chung theo đối tác được định tuyến, còn `per-room` cô lập từng phòng DM.
- Các phép thăm dò trạng thái Matrix và tra cứu thư mục trực tiếp sử dụng cùng chính sách proxy như lưu lượng lúc chạy.
- Cấu hình Matrix đầy đủ, quy tắc xác định đích và ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được hỗ trợ bởi plugin và được cấu hình trong `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, chính sách nhóm/kênh:
      // xem /channels/msteams
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập tại đây: `channels.msteams`, `channels.msteams.configWrites`.
- Cấu hình Teams đầy đủ (thông tin xác thực, webhook, chính sách DM/nhóm, ghi đè theo từng nhóm/từng kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được hỗ trợ bởi plugin và được cấu hình trong `channels.irc`.

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

- Các đường dẫn khóa cốt lõi được đề cập tại đây: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` tùy chọn sẽ ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (máy chủ/cổng/TLS/kênh/danh sách cho phép/cổng kiểm soát lượt đề cập) được ghi lại trong [IRC](/vi/channels/irc).

### Nhiều tài khoản (tất cả các kênh)

Chạy nhiều tài khoản trên mỗi kênh (mỗi tài khoản có `accountId` riêng):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot chính",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot cảnh báo",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` được sử dụng khi `accountId` bị bỏ qua (CLI + định tuyến).
- Token môi trường chỉ áp dụng cho tài khoản **mặc định**.
- Cài đặt kênh cơ sở áp dụng cho tất cả tài khoản trừ khi bị ghi đè theo từng tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản đến một tác tử khác nhau.
- Nếu bạn thêm một tài khoản không mặc định qua `openclaw channels add` (hoặc quá trình thiết lập kênh) trong khi vẫn sử dụng cấu hình kênh cấp cao nhất chỉ có một tài khoản, trước tiên OpenClaw sẽ chuyển các giá trị cấp cao nhất theo phạm vi tài khoản vào ánh xạ tài khoản của kênh để tài khoản ban đầu tiếp tục hoạt động. Hầu hết các kênh chuyển chúng vào `channels.<channel>.accounts.default`; thay vào đó, Matrix có thể giữ nguyên một đích mặc định/có tên hiện có và khớp.
- Các liên kết hiện có chỉ theo kênh (không có `accountId`) tiếp tục khớp với tài khoản mặc định; liên kết theo phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa chữa các cấu trúc hỗn hợp bằng cách chuyển các giá trị cấp cao nhất theo phạm vi tài khoản vào tài khoản được nâng cấp đã chọn cho kênh đó. Hầu hết các kênh sử dụng `accounts.default`; thay vào đó, Matrix có thể giữ nguyên một đích mặc định/có tên hiện có và khớp.

### Các kênh plugin khác

Nhiều kênh plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang riêng dành cho từng kênh (ví dụ: Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch và Zalo).
Xem chỉ mục kênh đầy đủ: [Kênh](/vi/channels).

### Cổng kiểm soát lượt đề cập trong trò chuyện nhóm

Tin nhắn nhóm mặc định **yêu cầu lượt đề cập** (lượt đề cập trong siêu dữ liệu hoặc các mẫu biểu thức chính quy an toàn). Áp dụng cho các cuộc trò chuyện nhóm WhatsApp, Telegram, Discord, Google Chat và iMessage.

Phản hồi hiển thị được kiểm soát riêng. Theo mặc định, các yêu cầu trực tiếp thông thường trong nhóm, kênh và WebChat nội bộ sẽ tự động phân phối kết quả cuối cùng: văn bản cuối cùng của trợ lý được đăng qua đường dẫn phản hồi hiển thị cũ. Chọn dùng `messages.visibleReplies: "message_tool"` hoặc `messages.groupChat.visibleReplies: "message_tool"` khi đầu ra hiển thị chỉ nên được đăng sau khi tác tử gọi `message(action=send)`. Nếu mô hình trả về câu trả lời cuối cùng có nội dung đáng kể mà không gọi công cụ tin nhắn trong chế độ chỉ dùng công cụ đã được chọn, văn bản cuối cùng đó vẫn ở chế độ riêng tư, nhật ký chi tiết của gateway ghi lại siêu dữ liệu tải trọng bị chặn và OpenClaw đưa vào hàng đợi một lần thử khôi phục để yêu cầu mô hình phân phối cùng phản hồi qua `message(action=send)`.

Phản hồi hiển thị chỉ dùng công cụ yêu cầu một mô hình/môi trường chạy có khả năng gọi công cụ đáng tin cậy và được khuyến nghị cho các phòng dùng chung có hoạt động nền trên các mô hình thế hệ mới nhất như GPT-5.6 Sol. Một số mô hình yếu hơn có thể trả lời bằng văn bản cuối cùng nhưng không hiểu rằng đầu ra hiển thị tại nguồn phải được gửi bằng `message(action=send)`. Theo mặc định, OpenClaw chỉ khôi phục trường hợp kết quả cuối cùng bị mắc kẹt phổ biến khi kết quả cuối cùng có nội dung đáng kể, lượt nguồn không phải là sự kiện phòng, chính sách gửi không từ chối phân phối và chưa có phản hồi nguồn nào được gửi. Quá trình khôi phục được giới hạn ở một lần thử lại; nó chặn việc lưu bền vững lời nhắc thử lại tổng hợp và loại lần thử lại đó khỏi quá trình gom lô để không thể hợp nhất với các lời nhắc không liên quan đang xếp hàng. Nếu lần thử lại cũng bị mắc kẹt hoặc không thể đưa vào hàng đợi, OpenClaw chỉ phân phối một thông báo chẩn đoán đã được làm sạch, chẳng hạn như "Tôi đã tạo phản hồi nhưng không thể gửi phản hồi đó đến cuộc trò chuyện này. Vui lòng thử lại." Văn bản cuối cùng riêng tư ban đầu không bao giờ được đánh dấu để tự động phân phối về nguồn. Đối với các mô hình liên tục làm phản hồi bị mắc kẹt, hãy dùng `"automatic"` để lượt cuối cùng của trợ lý trở thành đường dẫn phản hồi hiển thị, chuyển sang mô hình gọi công cụ mạnh hơn, kiểm tra nhật ký chi tiết của gateway để xem bản tóm tắt tải trọng bị chặn hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để sử dụng phản hồi cuối cùng hiển thị cho mọi yêu cầu nhóm/kênh.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ dự phòng sang phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Quy tắc này áp dụng cho văn bản cuối cùng thông thường của tác tử. Các liên kết cuộc trò chuyện do plugin sở hữu sử dụng phản hồi do plugin sở hữu trả về làm phản hồi hiển thị cho các lượt của luồng liên kết đã được nhận xử lý; plugin không cần gọi `message(action=send)` cho các phản hồi liên kết đó.

**Khắc phục sự cố: lượt @đề cập trong nhóm kích hoạt trạng thái đang nhập rồi im lặng (không có lỗi)**

Triệu chứng: một lượt @đề cập trong nhóm/kênh hiển thị chỉ báo đang nhập và nhật ký gateway báo cáo `dispatch complete (queuedFinal=false, replies=0)`, nhưng không có tin nhắn nào xuất hiện trong phòng. Các DM gửi đến cùng tác tử vẫn được phản hồi bình thường.

Nguyên nhân: chế độ trả lời hiển thị của nhóm/kênh được phân giải thành `"message_tool"`, vì vậy OpenClaw chạy lượt nhưng ẩn văn bản cuối cùng của trợ lý trừ khi tác tử gọi `message(action=send)`. Chế độ này không có hợp đồng `NO_REPLY`; nếu không gọi công cụ tin nhắn, văn bản cuối cùng ban đầu sẽ ở chế độ riêng tư. Đối với các lượt nguồn có nội dung đáng kể, OpenClaw hiện thử lại một lần để khôi phục có bảo vệ; các ghi chú ngắn, yêu cầu im lặng rõ ràng, sự kiện phòng, lượt bị chính sách gửi từ chối và lượt đã được gửi sẽ không được thử lại. Các lượt nhóm và kênh thông thường mặc định là `"automatic"`, nên hiện tượng này chỉ xuất hiện khi `messages.groupChat.visibleReplies` (hoặc `messages.visibleReplies` toàn cục) được đặt rõ ràng thành `"message_tool"`. `defaultVisibleReplies` của harness không áp dụng ở đây — trình phân giải nhóm/kênh bỏ qua thiết lập này; nó chỉ ảnh hưởng đến các cuộc trò chuyện trực tiếp/nguồn (harness Codex ẩn kết quả cuối cùng của cuộc trò chuyện trực tiếp theo cách đó).

Cách khắc phục: chọn mô hình gọi công cụ mạnh hơn, xóa ghi đè `"message_tool"` rõ ràng để quay về giá trị mặc định `"automatic"`, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để buộc hiển thị câu trả lời cho mọi yêu cầu nhóm/kênh. Một kết quả cuối cùng có nội dung đáng kể bị mắc kẹt sẽ không còn kết thúc bằng trạng thái thành công im lặng; nó phải được khôi phục qua một lần thử lại `message(action=send)` hoặc hiển thị chẩn đoán lỗi gửi đã được làm sạch. Gateway tự động tải nóng cấu hình `messages` sau khi tệp được lưu; chỉ khởi động lại Gateway khi tính năng theo dõi tệp hoặc tải lại cấu hình bị vô hiệu hóa trong môi trường triển khai.

**Các loại đề cập:**

- **Đề cập trong siêu dữ liệu**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự trò chuyện của WhatsApp.
- **Mẫu văn bản**: Các mẫu biểu thức chính quy an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và phép lặp lồng nhau không an toàn sẽ bị bỏ qua.
- Cơ chế kiểm soát bằng đề cập chỉ được thực thi khi có thể phát hiện (đề cập gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // buộc sử dụng cách tự động trả lời cuối cùng cũ cho các cuộc trò chuyện trực tiếp/nguồn
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // nội dung trò chuyện trong phòng không đề cập và luôn bật trở thành ngữ cảnh nền im lặng
      visibleReplies: "message_tool", // tùy chọn bật; yêu cầu message(action=send) để hiển thị câu trả lời trong phòng
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt giá trị mặc định toàn cục. Các kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo từng tài khoản). Đặt `0` để vô hiệu hóa.

`messages.groupChat.unmentionedInbound: "room_event"` gửi các tin nhắn nhóm/kênh luôn bật nhưng không có đề cập dưới dạng ngữ cảnh phòng im lặng trên các kênh được hỗ trợ. Tin nhắn có đề cập, lệnh và tin nhắn trực tiếp vẫn là yêu cầu của người dùng. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết các ví dụ đầy đủ về Discord, Slack và Telegram.

`messages.visibleReplies` là giá trị mặc định toàn cục cho sự kiện nguồn; `messages.groupChat.visibleReplies` ghi đè giá trị này cho các sự kiện nguồn của nhóm/kênh. Khi `messages.visibleReplies` chưa được đặt, các cuộc trò chuyện trực tiếp/nguồn sử dụng giá trị mặc định của runtime hoặc harness đã chọn, nhưng các lượt trực tiếp trong WebChat nội bộ sử dụng cơ chế gửi kết quả cuối cùng tự động để bảo đảm tính tương đương của prompt Pi/Codex. Đặt `messages.visibleReplies: "message_tool"` để chủ ý yêu cầu `message(action=send)` nhằm hiển thị đầu ra. Danh sách cho phép của kênh và cơ chế kiểm soát bằng đề cập vẫn quyết định sự kiện có được xử lý hay không.

#### Giới hạn lịch sử tin nhắn trực tiếp

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

Thứ tự phân giải: ghi đè theo từng tin nhắn trực tiếp → giá trị mặc định của nhà cung cấp → không giới hạn (giữ lại tất cả).

Trình phân giải này đọc `channels.<provider>.dmHistoryLimit` và `channels.<provider>.dms.<id>.historyLimit` cho mọi kênh có khóa phiên tuân theo cấu trúc `provider:direct:<id>` tiêu chuẩn (hoặc `provider:dm:<id>` cũ), vì vậy nó hoạt động trên cả các kênh đi kèm và kênh Plugin, không chỉ một danh sách cố định.

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
    restart: true, // cho phép /restart + yêu cầu khởi động lại SIGUSR1 bên ngoài
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

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp + đi kèm hiện tại, hãy xem [Lệnh dấu gạch chéo](/vi/tools/slash-commands).
- Trang này là **tài liệu tham chiếu khóa cấu hình**, không phải danh mục lệnh đầy đủ. Các lệnh do kênh/Plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép nối thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone` và Talk `/voice` được ghi lại trong các trang kênh/Plugin tương ứng cùng với [Lệnh dấu gạch chéo](/vi/tools/slash-commands).
- Lệnh văn bản phải là tin nhắn **độc lập** có `/` ở đầu.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram và để Slack ở trạng thái tắt.
- `nativeSkills: "auto"` bật lệnh skill gốc cho Discord/Telegram và để Slack ở trạng thái tắt.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (giá trị boolean hoặc `"auto"`). Đối với Discord, `false` bỏ qua việc đăng ký và dọn dẹp lệnh gốc trong quá trình khởi động.
- Ghi đè việc đăng ký skill gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục bổ sung vào menu bot Telegram.
- `bash: true` bật `! <cmd>` cho shell của máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi phải nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Đối với các máy khách Gateway `chat.send`, thao tác ghi `/config set|unset` lâu dài cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn khả dụng cho các máy khách vận hành thông thường có phạm vi ghi.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`.
- `plugins: true` bật `/plugins` cho các chức năng khám phá, cài đặt và bật/tắt Plugin.
- `channels.<provider>.configWrites` kiểm soát việc sửa đổi cấu hình theo từng kênh (mặc định: true).
- Đối với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm đến tài khoản đó (ví dụ: `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` vô hiệu hóa `/restart` và các yêu cầu khởi động lại `SIGUSR1` bên ngoài. Mặc định: `true`.
- `ownerAllowFrom` là danh sách chủ sở hữu được phép rõ ràng cho các lệnh chỉ dành cho chủ sở hữu và các hành động kênh do chủ sở hữu kiểm soát. Danh sách này tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm ID chủ sở hữu trong prompt hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` áp dụng theo từng nhà cung cấp. Khi được đặt, đây là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép nối của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép các lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` chưa được đặt.
- Bản đồ tài liệu về lệnh:
  - danh mục tích hợp + đi kèm: [Lệnh dấu gạch chéo](/vi/tools/slash-commands)
  - các bề mặt lệnh dành riêng cho kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép nối: [Ghép nối](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - mơ của bộ nhớ: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất
- [Cấu hình — tác tử](/vi/gateway/config-agents)
- [Tổng quan về kênh](/vi/channels)
