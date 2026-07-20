---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, đa tài khoản)
    - Khắc phục sự cố với các khóa cấu hình theo từng kênh
    - Kiểm tra chính sách DM, chính sách nhóm hoặc cơ chế kiểm soát lượt đề cập
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép nối, khóa riêng cho từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều nền tảng khác'
title: Cấu hình — các kênh
x-i18n:
    generated_at: "2026-07-20T04:25:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e1c32077ec770c04bdf3c49aa187572a271a954bccec7b31fef776f768a6ed9b
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo từng kênh trong `channels.*`: quyền truy cập DM và nhóm, thiết lập nhiều tài khoản, kiểm soát bằng lượt nhắc đến và các khóa theo từng kênh cho Slack, Discord, Telegram, WhatsApp, Matrix, iMessage cùng các plugin kênh khác.

Đối với agent, công cụ, runtime Gateway và các khóa cấp cao nhất khác, hãy xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của kênh đó tồn tại (trừ khi `enabled: false`). Telegram và iMessage được cung cấp trong gói `openclaw` cốt lõi. Các kênh chính thức khác (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost và nhiều kênh khác) được cài đặt dưới dạng các plugin riêng biệt bằng `openclaw plugins install <spec>`; xem [Kênh](/vi/channels) để biết danh sách đầy đủ và thông số cài đặt.

### Quyền truy cập DM và nhóm

Tất cả các kênh đều hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM           | Hành vi                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi không xác định nhận được mã ghép đôi dùng một lần; chủ sở hữu phải phê duyệt |
| `allowlist`         | Chỉ những người gửi trong `allowFrom` (hoặc kho danh sách cho phép đã ghép đôi)             |
| `open`              | Cho phép tất cả DM gửi đến (yêu cầu `allowFrom: ["*"]`)             |
| `disabled`          | Bỏ qua tất cả DM gửi đến                                          |

| Chính sách nhóm          | Hành vi                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (mặc định) | Chỉ các nhóm khớp với danh sách cho phép đã cấu hình          |
| `open`                | Bỏ qua danh sách cho phép của nhóm (kiểm soát bằng lượt nhắc đến vẫn được áp dụng) |
| `disabled`            | Chặn tất cả tin nhắn nhóm/phòng                          |

<Note>
`channels.defaults.groupPolicy` đặt giá trị mặc định khi `groupPolicy` của nhà cung cấp chưa được đặt.
Mã ghép đôi hết hạn sau 1 giờ. Số yêu cầu ghép đôi đang chờ được giới hạn ở **3 yêu cầu cho mỗi tài khoản** (phạm vi theo kênh và mã định danh tài khoản).
Nếu thiếu hoàn toàn khối nhà cung cấp (không có `channels.<provider>`), chính sách nhóm của runtime sẽ chuyển về `allowlist` (đóng khi lỗi) kèm cảnh báo khi khởi động.
</Note>

### Ghi đè mô hình theo kênh

Dùng `channels.modelByChannel` để ghim các mã định danh kênh cụ thể hoặc đối tác nhắn tin trực tiếp vào một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh chỉ áp dụng khi phiên chưa có ghi đè mô hình đang hoạt động (ví dụ: ghi đè được đặt qua `/model`).

Đối với cuộc trò chuyện nhóm/luồng, các khóa là mã định danh nhóm, mã định danh chủ đề hoặc tên kênh dành riêng cho từng kênh. Đối với cuộc trò chuyện bằng tin nhắn trực tiếp (DM), các khóa là mã định danh đối tác được lấy từ danh tính người gửi của kênh (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` hoặc `SenderId`). Dạng khóa chính xác phụ thuộc vào kênh:

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

Dùng `channels.defaults` cho chính sách nhóm, lượt nhắc đến ngầm định và hành vi Heartbeat dùng chung giữa các nhà cung cấp:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: chính sách nhóm dự phòng khi `groupPolicy` ở cấp nhà cung cấp chưa được đặt.
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả các kênh. Giá trị: `all` (mặc định, bao gồm toàn bộ ngữ cảnh trích dẫn/luồng/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống danh sách cho phép nhưng giữ lại ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo từng kênh: `channels.<channel>.contextVisibility`.
- `channels.defaults.implicitMentions`: kiểm soát những dữ kiện gửi đến được hỗ trợ nào được tính là lượt nhắc đến. `replyToBot`, `quotedBot` và `threadParticipation` đều mặc định là `true`, duy trì hành vi hiện tại. Ghi đè theo từng kênh bằng `channels.<channel>.implicitMentions` hoặc theo từng tài khoản bằng `channels.<channel>.accounts.<id>.implicitMentions`; mỗi cờ được phân giải độc lập theo thứ tự tài khoản -> kênh -> giá trị mặc định. Tên cờ mang nghĩa khẳng định: đặt cờ thành `false` để ngăn dữ kiện đó bỏ qua cơ chế kiểm soát bằng lượt nhắc đến. Các lượt nhắc đến tường minh nguyên bản luôn được cho phép và cờ không có tác dụng khi kênh không tạo ra dữ kiện đó. Xem [Kiểm soát bằng lượt nhắc đến](/vi/channels/groups#mention-gating-default) để biết ma trận nguồn tạo hiện tại. Các thiết lập này không thay đổi chế độ trả lời/luồng gửi đi hoặc việc xử lý lệnh được ủy quyền.
- `channels.defaults.heartbeat.showOk`: bao gồm trạng thái kênh bình thường trong đầu ra Heartbeat (mặc định `false`).
- `channels.defaults.heartbeat.showAlerts`: bao gồm trạng thái suy giảm/lỗi trong đầu ra Heartbeat (mặc định `true`).
- `channels.defaults.heartbeat.useIndicator`: hiển thị đầu ra Heartbeat kiểu chỉ báo nhỏ gọn (mặc định `true`).

### WhatsApp

WhatsApp chạy qua kênh web của Gateway (Baileys Web). Kênh tự động khởi động khi tồn tại một phiên đã liên kết.

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình liên kết ACP lâu dài cho DM và nhóm WhatsApp. Dùng số trực tiếp theo chuẩn E.164 hoặc JID nhóm WhatsApp trong `match.peer.id`. Ngữ nghĩa trường được dùng chung trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).

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
- Thư mục xác thực Baileys một tài khoản kiểu cũ được `openclaw doctor` di chuyển vào `whatsapp/default`.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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

- Token bot: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; liên kết tượng trưng bị từ chối), với `TELEGRAM_BOT_TOKEN` làm giá trị dự phòng cho tài khoản mặc định.
- `apiRoot` chỉ là gốc Telegram Bot API. Dùng `https://api.telegram.org` hoặc gốc tự lưu trữ/proxy của bạn, không dùng `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` loại bỏ hậu tố `/bot<TOKEN>` vô tình nằm ở cuối.
- Đối với máy chủ Bot API tự lưu trữ ở chế độ `--local`, `trustedLocalFileRoots` liệt kê các đường dẫn máy chủ mà OpenClaw có thể đọc. Gắn volume dữ liệu máy chủ trên máy chủ OpenClaw và cấu hình thư mục gốc dữ liệu hoặc thư mục theo từng token; các đường dẫn container trong `/var/lib/telegram-bot-api` được ánh xạ vào các thư mục gốc đó. Các đường dẫn tuyệt đối khác vẫn bị từ chối.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một mã định danh tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (từ 2 mã định danh tài khoản trở lên), hãy đặt rõ tài khoản mặc định (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi thiết lập này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các thao tác ghi cấu hình do Telegram khởi tạo (di chuyển mã định danh siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình liên kết ACP lâu dài cho các chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được dùng chung trong [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Bản xem trước luồng Telegram dùng `sendMessage` + `editMessageText` (hoạt động trong cuộc trò chuyện trực tiếp và nhóm).
- `network.dnsResultOrder` mặc định là `"ipv4first"` để tránh các lỗi truy xuất IPv6 thường gặp.
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
- Các lệnh gọi đi trực tiếp cung cấp rõ ràng Discord `token` sẽ sử dụng token đó cho lệnh gọi; các thiết lập thử lại/chính sách của tài khoản vẫn lấy từ tài khoản được chọn trong ảnh chụp nhanh runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè việc chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) làm đích gửi; các ID chỉ gồm số sẽ bị từ chối.
- Slug của guild dùng chữ thường và thay dấu cách bằng `-`; khóa kênh sử dụng tên đã được chuyển thành slug (không có `#`). Nên ưu tiên ID guild.
- Theo mặc định, các tin nhắn do bot tạo sẽ bị bỏ qua. `allowBots: true` bật chúng; sử dụng `allowBots: "mentions"` để chỉ chấp nhận các tin nhắn của bot có đề cập đến bot (tin nhắn của chính bot vẫn bị lọc).
- Các kênh hỗ trợ tin nhắn đến do bot tạo có thể sử dụng cơ chế [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Đặt `channels.defaults.botLoopProtection` cho ngân sách cặp cơ sở, sau đó chỉ ghi đè ở cấp kênh hoặc tài khoản khi một bề mặt cần giới hạn khác.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và các ghi đè của kênh) loại bỏ những tin nhắn đề cập đến người dùng hoặc vai trò khác nhưng không đề cập đến bot (không bao gồm @everyone/@here).
- `channels.discord.mentionAliases` ánh xạ văn bản `@handle` ổn định ở đầu ra sang ID người dùng Discord trước khi gửi, nhờ đó có thể đề cập đến các đồng đội đã biết một cách xác định ngay cả khi bộ nhớ đệm thư mục tạm thời trống. Các ghi đè theo tài khoản nằm trong `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (mặc định `17`) chia nhỏ các tin nhắn dài theo chiều dọc ngay cả khi dưới 2000 ký tự.
- `channels.discord.suppressEmbeds` mặc định là `true`, vì vậy các URL gửi đi không mở rộng thành bản xem trước liên kết Discord trừ khi bị tắt. Các payload `embeds` được chỉ định rõ vẫn gửi bình thường; các lệnh gọi công cụ theo từng tin nhắn có thể ghi đè bằng `suppressEmbeds`.
- `channels.discord.threadBindings` kiểm soát định tuyến gắn với luồng Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên gắn với luồng (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, cùng việc gửi/định tuyến đã liên kết)
  - `idleHours`: ghi đè Discord cho thời gian không hoạt động trước khi tự động bỏ tập trung, tính bằng giờ (`0` sẽ vô hiệu hóa)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa tuyệt đối, tính bằng giờ (`0` sẽ vô hiệu hóa)
  - `spawnSessions`: công tắc cho `sessions_spawn({ thread: true })` và việc tự động tạo/liên kết luồng khi ACP tạo luồng con (mặc định: `true`)
  - `defaultSpawnContext`: ngữ cảnh subagent gốc cho các lần tạo gắn với luồng (mặc định là `"fork"`)
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` cấu hình các liên kết ACP lâu dài cho kênh và luồng (sử dụng ID kênh/luồng trong `match.peer.id`). Ngữ nghĩa của các trường được dùng chung trong [Tác tử ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho các vùng chứa thành phần Discord v2.
- `channels.discord.agentComponents.ttlMs` kiểm soát thời gian các callback của thành phần Discord đã gửi tiếp tục được đăng ký. Mặc định `1800000` (30 phút), tối đa `86400000` (24 giờ). Các ghi đè theo tài khoản nằm trong `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Nên dùng TTL ngắn nhất phù hợp với quy trình.
- `channels.discord.voice` bật hội thoại trong kênh thoại Discord và các ghi đè tùy chọn cho tự động tham gia + LLM + TTS. Các cấu hình Discord chỉ dùng văn bản mặc định tắt thoại; đặt `channels.discord.voice.enabled=true` để bật.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM được sử dụng cho phản hồi trong kênh thoại Discord.
- `channels.discord.voice.daveEncryption` (mặc định `true`) và `channels.discord.voice.decryptionFailureTolerance` (mặc định `24`) được chuyển tiếp đến các tùy chọn DAVE của `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` kiểm soát khoảng chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia (mặc định `30000`).
- `channels.discord.voice.reconnectGraceMs` kiểm soát thời gian một phiên thoại bị ngắt kết nối được phép dùng để chuyển sang phát tín hiệu kết nối lại trước khi OpenClaw hủy phiên đó (mặc định `15000`).
- Việc phát âm thanh thoại Discord không bị gián đoạn bởi sự kiện người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua việc thu âm thoại mới trong khi TTS đang phát.
- OpenClaw cũng cố gắng khôi phục việc nhận thoại bằng cách rời khỏi rồi tham gia lại phiên thoại sau nhiều lần giải mã thất bại.
- `channels.discord.streaming` là khóa chế độ luồng chuẩn. Discord mặc định dùng `streaming.mode: "progress"` để tiến trình công cụ/công việc xuất hiện trong một tin nhắn xem trước được chỉnh sửa; đặt `streaming.mode: "off"` để vô hiệu hóa. Các khóa phẳng cũ (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) không còn được đọc trong runtime; chạy `openclaw doctor --fix` để di chuyển cấu hình đã lưu.
- `channels.discord.autoPresence` ánh xạ mức độ sẵn sàng của runtime sang trạng thái hiện diện của bot (khỏe mạnh => trực tuyến, suy giảm => không hoạt động, cạn kiệt => không làm phiền) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.guilds.<id>.presenceEvents` định tuyến các lần người dùng chuyển sang trạng thái sẵn sàng vào một kênh Discord đã cấu hình dưới dạng sự kiện hệ thống của tác tử. Các thành viên đủ điều kiện phải có khả năng xem `channelId`; luồng công khai kế thừa khả năng hiển thị của luồng cha, còn luồng riêng tư cần thêm tư cách thành viên hoặc quyền Manage Threads. `users` có thể thu hẹp thêm đối tượng đó. Tính năng này khởi tạo các thành viên hiện đang trực tuyến từ ảnh chụp nhanh `GUILD_CREATE` hoàn chỉnh, định tuyến các chuyển đổi từ ngoại tuyến sang trực tuyến được quan sát và coi tín hiệu trực tuyến đầu tiên sau đó của một thành viên chưa từng thấy là mới sẵn sàng mà không khẳng định họ vừa trực tuyến hay vừa tham gia sau ảnh chụp nhanh. Các guild vượt quá giới hạn ảnh chụp nhanh 75,000 thành viên của Discord trước tiên cần một bản cập nhật ngoại tuyến rõ ràng. Các tùy chọn điều tiết: `reconnectSuppressSeconds` (khoảng lặng sau một phiên Gateway mới trong khi trạng thái hiện diện của guild được dựng lại, mặc định 300, `0` sẽ vô hiệu hóa) và `burstLimit`/`burstWindowSeconds` (giới hạn tốc độ sự kiện đã xếp hàng thành công theo từng guild, mặc định 8 sự kiện trong mỗi cửa sổ trượt 60 giây). Các phiên được tiếp tục không khởi động cửa sổ chặn khi kết nối lại. Thời gian hồi giữa các lần chào lại hiện có theo từng người dùng vẫn là tám giờ. Tính năng này yêu cầu `channels.discord.intents.presence=true`, Presence Intent đặc quyền trong Developer Portal của Discord và Heartbeat của tác tử đã được bật.
- `channels.discord.dangerouslyAllowNameMatching` bật lại việc so khớp tên/thẻ có thể thay đổi (chế độ tương thích dùng trong tình huống khẩn cấp).
- `channels.discord.execApprovals`: gửi phê duyệt thực thi và xác thực người phê duyệt theo cơ chế gốc của Discord.
  - `enabled`: `true`, `false` hoặc `"auto"` (mặc định). Trong chế độ tự động, phê duyệt thực thi được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: các ID người dùng Discord được phép phê duyệt yêu cầu thực thi. Dùng `commands.ownerAllowFrom` làm phương án dự phòng khi bị bỏ qua.
  - `agentFilter`: danh sách cho phép ID tác tử tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác tử.
  - `sessionFilter`: các mẫu khóa phiên tùy chọn (chuỗi con hoặc biểu thức chính quy).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi đến DM của người phê duyệt, `"channel"` gửi đến kênh khởi nguồn, `"both"` gửi đến cả hai. Khi đích bao gồm `"channel"`, chỉ những người phê duyệt đã phân giải mới có thể sử dụng các nút.
  - `cleanupAfterResolve`: khi `true`, xóa các DM phê duyệt sau khi được phê duyệt, bị từ chối hoặc hết thời gian chờ.

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
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại việc so khớp định danh email có thể thay đổi (chế độ tương thích dùng trong tình huống khẩn cấp).

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
        nativeTransport: true, // sử dụng API phát trực tiếp gốc của Slack khi mode=partial
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

- **Chế độ Socket** yêu cầu cả `botToken` và `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` để dự phòng bằng biến môi trường của tài khoản mặc định).
- **Chế độ HTTP** yêu cầu `botToken` cùng với `signingSecret` (ở cấp gốc hoặc theo từng tài khoản).
- **Danh tính người dùng** (`identity: "user"`) đăng và đọc với tư cách người đã cấp quyền. Tính năng này yêu cầu `userToken` cùng với `appToken` trong Chế độ Socket, hoặc `userToken` cùng với `signingSecret` trong chế độ HTTP. Không yêu cầu token bot hoặc người dùng bot. Xem [Danh tính người dùng](/vi/channels/slack#user-identity-post-as-a-real-person) để biết các phạm vi người dùng và đăng ký sự kiện.
- `enterpriseOrgInstall: true` cho phép một tài khoản sử dụng đường dẫn sự kiện
  trên toàn tổ chức của Slack Enterprise Grid. Khi khởi động, hệ thống xác minh token bot bằng `auth.test` và
  báo lỗi khi chế độ đã cấu hình không khớp với danh tính cài đặt của Slack.
  DM doanh nghiệp phải bị vô hiệu hóa hoặc sử dụng `dmPolicy: "open"` với
  `allowFrom: ["*"]` có hiệu lực. Chính sách kênh và người dùng phải sử dụng ID Slack ổn định;
  tên có thể thay đổi và tiền tố kênh không được hỗ trợ sẽ khiến quá trình khởi động thất bại. V1 chỉ xử lý
  trực tiếp các sự kiện Chế độ Socket hoặc HTTP `message` và `app_mention` với phản hồi
  tức thì; chuyển tiếp, lệnh, tương tác, App Home, trình lắng nghe sự kiện phản ứng,
  ghim, công cụ hành động, phê duyệt gốc, liên kết, phân phối trì hoãn và
  gửi chủ động đều không khả dụng. Việc xác nhận, nhập liệu và
  phản ứng trạng thái do trình lắng nghe quản lý vẫn khả dụng với `reactions:write`; thông báo
  phản ứng đến và công cụ hành động phản ứng không khả dụng. Xem
  [Cài đặt trên toàn tổ chức Enterprise Grid](/vi/channels/slack#enterprise-grid-org-wide-installs)
  để biết manifest có đặc quyền tối thiểu, quy trình thiết lập và đầy đủ các hạn chế.
- `socketMode` chuyển tiếp các tùy chỉnh truyền tải Chế độ Socket của Slack SDK đến API bộ nhận Bolt công khai. Chỉ sử dụng khi điều tra thời gian chờ ping/pong hoặc hành vi websocket cũ. `clientPingTimeout` mặc định là `15000`; `serverPingTimeout` và `pingPongLoggingEnabled` chỉ được chuyển tiếp khi đã cấu hình.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi
  văn bản thuần hoặc đối tượng SecretRef.
- Ảnh chụp nhanh tài khoản Slack hiển thị các trường nguồn/trạng thái theo từng thông tin xác thực, chẳng hạn như
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus` và, trong chế độ HTTP, `signingSecretStatus`.
  `configured_unavailable` có nghĩa là tài khoản được
  cấu hình thông qua SecretRef nhưng đường dẫn lệnh/runtime hiện tại không thể
  phân giải giá trị bí mật.
- `configWrites: false` chặn các thao tác ghi cấu hình do Slack khởi tạo.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ luồng Slack chuẩn (mặc định `"partial"`). `channels.slack.streaming.nativeTransport` kiểm soát cơ chế truyền tải phát trực tiếp gốc của Slack (mặc định `true`). Các giá trị cũ `streamMode`, giá trị boolean `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` và `nativeStreaming` không còn được đọc trong runtime; chạy `openclaw doctor --fix` để di chuyển cấu hình đã lưu sang `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` và `unfurlMedia` chuyển tiếp các giá trị boolean bung nội dung liên kết và phương tiện `chat.postMessage` của Slack cho phản hồi của bot. `unfurlLinks` mặc định là `false` để liên kết gửi đi của bot không mở rộng nội tuyến trừ khi được bật; `unfurlMedia` bị bỏ qua nếu chưa cấu hình. Đặt một trong hai giá trị tại `channels.slack.accounts.<accountId>` để ghi đè giá trị cấp cao nhất cho một tài khoản.
- Sử dụng `user:<id>` (DM) hoặc `channel:<id>` làm đích phân phối.

**Các chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cách ly phiên luồng:** `thread.historyScope` áp dụng theo từng luồng (mặc định) hoặc dùng chung trong toàn kênh. `thread.inheritParent` sao chép bản ghi hội thoại của kênh cha sang các luồng mới. `thread.initialHistoryLimit` (mặc định `20`) giới hạn số lượng tin nhắn hiện có trong luồng được tải khi một phiên luồng mới bắt đầu; `0` vô hiệu hóa việc tải lịch sử luồng.

- Tính năng phát trực tiếp gốc của Slack cùng trạng thái luồng kiểu trợ lý "đang nhập..." của Slack yêu cầu đích phản hồi là một luồng. DM cấp cao nhất mặc định vẫn nằm ngoài luồng, vì vậy chúng vẫn có thể phát trực tiếp thông qua bản xem trước đăng bản nháp rồi chỉnh sửa của Slack thay vì hiển thị bản xem trước luồng/trạng thái gốc kiểu luồng.
- `typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi phản hồi đang chạy, rồi xóa phản ứng đó khi hoàn tất. Sử dụng mã viết tắt emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: phân phối máy khách phê duyệt gốc của Slack và ủy quyền người phê duyệt thực thi. Cùng schema với Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter` và `target` (`"dm"`, `"channel"` hoặc `"both"`). Phê duyệt Plugin có thể sử dụng đường dẫn máy khách gốc này cho các yêu cầu bắt nguồn từ Slack khi phân giải được người phê duyệt Plugin Slack; việc phân phối phê duyệt Plugin gốc của Slack cũng có thể được bật thông qua `approvals.plugin` cho các phiên bắt nguồn từ Slack hoặc đích Slack. Phê duyệt Plugin sử dụng người phê duyệt Plugin Slack từ `allowFrom` và định tuyến mặc định, không dùng người phê duyệt thực thi.

| Nhóm hành động | Mặc định | Ghi chú                         |
| -------------- | -------- | ------------------------------- |
| reactions      | bật      | Phản ứng + liệt kê phản ứng     |
| messages       | bật      | Đọc/gửi/chỉnh sửa/xóa           |
| pins           | bật      | Ghim/bỏ ghim/liệt kê            |
| memberInfo     | bật      | Thông tin thành viên            |
| emojiList      | bật      | Danh sách emoji tùy chỉnh       |

### Mattermost

Mattermost được cài đặt dưới dạng một Plugin riêng biệt, tương tự Discord, Slack và WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Kiểm tra [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) để biết các dist-tag hiện tại trước khi ghim phiên bản.

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
        native: true, // cần chủ động bật
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL tường minh tùy chọn cho các bản triển khai qua proxy ngược/công khai
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Các chế độ trò chuyện: `oncall` (phản hồi khi được @-đề cập, mặc định), `onmessage` (mọi tin nhắn), `onchar` (tin nhắn bắt đầu bằng tiền tố kích hoạt).

Khi các lệnh gốc của Mattermost được bật:

- `commands.callbackPath` phải là một đường dẫn (ví dụ `/api/channels/mattermost/command`), không phải URL đầy đủ.
- `commands.callbackUrl` phải phân giải đến điểm cuối Gateway OpenClaw và máy chủ Mattermost phải có thể truy cập được.
- Các callback lệnh gạch chéo gốc được xác thực bằng token theo từng lệnh do
  Mattermost trả về trong quá trình đăng ký lệnh gạch chéo. Nếu đăng ký thất bại hoặc không có
  lệnh nào được kích hoạt, OpenClaw từ chối callback với
  `Unauthorized: invalid command token.`
- Đối với máy chủ callback riêng/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ/tên miền callback.
  Sử dụng giá trị máy chủ/tên miền, không sử dụng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do Mattermost khởi tạo.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi phản hồi trong các kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè điều kiện đề cập theo từng kênh (`"*"` cho mặc định).
- `channels.mattermost.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID tài khoản đã cấu hình.

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

**Các chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

- `channels.signal.account`: ghim quá trình khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các thao tác ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với ID tài khoản đã cấu hình.

### iMessage

OpenClaw khởi chạy `imsg rpc` (JSON-RPC qua stdio). Không yêu cầu daemon hoặc cổng. Đây là đường dẫn được ưu tiên cho các thiết lập OpenClaw iMessage mới khi máy chủ có thể cấp quyền truy cập cơ sở dữ liệu Messages và quyền Automation.

Hỗ trợ BlueBubbles đã bị loại bỏ. `channels.bluebubbles` không phải là bề mặt cấu hình runtime được hỗ trợ trên OpenClaw hiện tại. Di chuyển cấu hình cũ sang `channels.imessage`; xem [Việc loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để biết phiên bản ngắn và [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng chuyển đổi đầy đủ.

Nếu Gateway không chạy trên máy Mac đã đăng nhập Messages, hãy giữ `channels.imessage.enabled=true` và đặt `channels.imessage.cliPath` thành một trình bao bọc SSH chạy `imsg "$@"` trên máy Mac đó. Đường dẫn `imsg` cục bộ mặc định chỉ dành cho macOS.

Trước khi dựa vào trình bao bọc SSH để gửi trong môi trường production, hãy xác minh một `imsg send` gửi đi thông qua chính trình bao bọc đó. Một số trạng thái TCC của macOS gán quyền Tự động hóa Messages cho `/usr/libexec/sshd-keygen-wrapper`, điều này có thể khiến thao tác đọc và thăm dò hoạt động trong khi thao tác gửi thất bại với AppleEvents `-1743`; xem phần khắc phục sự cố trình bao bọc SSH tại [iMessage](/vi/channels/imessage).

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

- `channels.imessage.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Yêu cầu quyền Full Disk Access đối với cơ sở dữ liệu Messages.
- Ưu tiên các đích `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê các cuộc trò chuyện.
- `cliPath` có thể trỏ đến một trình bao bọc SSH; đặt `remoteHost` (`host` hoặc `user@host`) để tìm nạp tệp đính kèm qua SCP.
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn các đường dẫn tệp đính kèm gửi đến (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt, vì vậy hãy bảo đảm khóa của máy chủ chuyển tiếp đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối việc ghi cấu hình do iMessage khởi tạo.
- `channels.imessage.sendTransport`: phương thức truyền gửi RPC `imsg` ưu tiên cho các phản hồi gửi đi thông thường. `auto` (mặc định) sử dụng cầu nối IMCore cho các cuộc trò chuyện hiện có khi cầu nối đang chạy, rồi chuyển sang AppleScript nếu không thành công; `bridge` yêu cầu phân phối qua API riêng tư; `applescript` buộc sử dụng đường dẫn tự động hóa Messages công khai.
- `channels.imessage.actions.*`: bật các hành động API riêng tư cũng được kiểm soát bởi `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` mặc định bị tắt; đặt thành `true` trước khi mong đợi phương tiện gửi đến xuất hiện trong các lượt của tác nhân.
- Quá trình khôi phục dữ liệu gửi đến sau khi cầu nối/gateway khởi động lại diễn ra tự động (loại trùng lặp GUID cộng với hàng rào tuổi cho backlog cũ). Các cấu hình `channels.imessage.catchup.enabled: true` hiện có vẫn được hỗ trợ dưới dạng hồ sơ tương thích không còn được khuyến nghị; `catchup` mặc định bị tắt.
- `channels.imessage.groups`: sổ đăng ký nhóm và các thiết lập cho từng nhóm. Với `groupPolicy: "allowlist"`, hãy cấu hình các khóa `chat_id` tường minh hoặc một mục ký tự đại diện `"*"` để tin nhắn nhóm có thể vượt qua cổng sổ đăng ký.
- Các mục `bindings[]` cấp cao nhất có `type: "acp"` có thể liên kết các cuộc trò chuyện iMessage với các phiên ACP bền vững. Dùng một định danh liên hệ đã chuẩn hóa hoặc đích trò chuyện tường minh (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Tác nhân ACP](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ví dụ về trình bao bọc SSH cho iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được hỗ trợ bởi Plugin và được cấu hình trong `channels.matrix`.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép các homeserver riêng tư/nội bộ. `proxy` và tùy chọn tham gia mạng này là các biện pháp kiểm soát độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong cấu hình nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `"off"`, vì vậy các phòng được mời và lời mời mới theo kiểu DM bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` bằng `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt thực thi theo cơ chế gốc của Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false` hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt thực thi được kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: các ID người dùng Matrix (ví dụ: `@owner:example.org`) được phép phê duyệt yêu cầu thực thi.
  - `agentFilter`: danh sách cho phép ID tác nhân tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả tác nhân.
  - `sessionFilter`: các mẫu khóa phiên tùy chọn (chuỗi con hoặc biểu thức chính quy).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định), `"channel"` (phòng khởi nguồn) hoặc `"both"`.
  - Ghi đè theo tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách các DM của Matrix được nhóm thành phiên: `per-user` (mặc định) dùng chung theo đối tác được định tuyến, còn `per-room` cô lập từng phòng DM.
- Các phép thăm dò trạng thái Matrix và tra cứu thư mục trực tiếp sử dụng cùng chính sách proxy như lưu lượng thời gian chạy.
- Cấu hình Matrix đầy đủ, quy tắc nhắm đích và các ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được hỗ trợ bởi Plugin và được cấu hình trong `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // xem /channels/msteams
    },
  },
}
```

- Các đường dẫn khóa cốt lõi được đề cập tại đây: `channels.msteams`, `channels.msteams.configWrites`.
- Cấu hình Teams đầy đủ (thông tin xác thực, webhook, chính sách DM/nhóm, ghi đè theo nhóm/kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được hỗ trợ bởi Plugin và được cấu hình trong `channels.irc`.

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
- `channels.irc.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (máy chủ/cổng/TLS/kênh/danh sách cho phép/kiểm soát đề cập) được ghi lại trong [IRC](/vi/channels/irc).

### Nhiều tài khoản (tất cả các kênh)

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

- `default` được sử dụng khi `accountId` bị bỏ qua (CLI + định tuyến).
- Token môi trường chỉ áp dụng cho tài khoản **mặc định**.
- Các thiết lập kênh cơ sở áp dụng cho tất cả tài khoản trừ khi bị ghi đè theo từng tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản đến một tác nhân khác nhau.
- Nếu bạn thêm một tài khoản không mặc định qua `openclaw channels add` (hoặc quy trình tích hợp kênh) trong khi vẫn dùng cấu hình kênh một tài khoản cấp cao nhất, trước tiên OpenClaw đưa các giá trị cấp cao nhất dành cho một tài khoản và có phạm vi tài khoản vào bản đồ tài khoản của kênh để tài khoản ban đầu tiếp tục hoạt động. Hầu hết các kênh chuyển chúng vào `channels.<channel>.accounts.default`; thay vào đó, Matrix có thể giữ nguyên một đích có tên/mặc định hiện có và khớp.
- Các liên kết chỉ dành cho kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định; các liên kết có phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa chữa các cấu trúc hỗn hợp bằng cách chuyển các giá trị cấp cao nhất dành cho một tài khoản và có phạm vi tài khoản vào tài khoản được nâng cấp đã chọn cho kênh đó. Hầu hết các kênh sử dụng `accounts.default`; thay vào đó, Matrix có thể giữ nguyên một đích có tên/mặc định hiện có và khớp.

### Các kênh Plugin khác

Nhiều kênh Plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang kênh riêng (ví dụ: Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch và Zalo).
Xem chỉ mục kênh đầy đủ: [Các kênh](/vi/channels).

### Kiểm soát đề cập trong trò chuyện nhóm

Tin nhắn nhóm mặc định **yêu cầu đề cập** (đề cập trong siêu dữ liệu hoặc các mẫu biểu thức chính quy an toàn). Áp dụng cho các cuộc trò chuyện nhóm WhatsApp, Telegram, Discord, Google Chat và iMessage.

Các phản hồi hiển thị được kiểm soát riêng. Theo mặc định, các yêu cầu trực tiếp thông thường trong nhóm, kênh và WebChat nội bộ được phân phối kết quả cuối tự động: văn bản cuối cùng của trợ lý được đăng qua đường dẫn phản hồi hiển thị cũ. Chọn dùng `messages.visibleReplies: "message_tool"` hoặc `messages.groupChat.visibleReplies: "message_tool"` khi các phản hồi nguồn do mô hình tạo chỉ nên được đăng sau khi tác nhân gọi `message(action=send)`. Nếu mô hình trả về một câu trả lời cuối có nội dung đáng kể mà không gọi công cụ tin nhắn trong chế độ chỉ dùng công cụ đã được chọn, văn bản cuối đó vẫn ở chế độ riêng tư, nhật ký chi tiết của Gateway ghi lại siêu dữ liệu tải trọng bị chặn và OpenClaw đưa vào hàng đợi một lần thử lại khôi phục để yêu cầu mô hình phân phối cùng phản hồi đó qua `message(action=send)`.

Chính sách chỉ dùng công cụ chi phối các phản hồi nguồn của trợ lý và phương tiện công cụ chung. Chính sách này không chặn đầu ra đầu cuối do thời gian chạy sở hữu, chẳng hạn như phản hồi lệnh đã được ủy quyền, thông báo hoàn tất bền vững hoặc tạo phẩm gốc của nhà cung cấp mà bộ kiểm thử sở hữu xác định rõ là do máy chủ sở hữu. Các tạo phẩm do máy chủ sở hữu được phân phối qua đường dẫn điều phối kênh thông thường và vẫn tuân thủ việc từ chối `sendPolicy` gửi đi. Các lượt `room_event` xung quanh vẫn im lặng trừ khi chúng là lệnh tường minh, ngay cả khi đầu ra thời gian chạy được đánh dấu là do máy chủ sở hữu.

Phản hồi hiển thị chỉ dùng công cụ yêu cầu một mô hình/thời gian chạy gọi công cụ đáng tin cậy và được khuyến nghị cho các phòng dùng chung xung quanh trên các mô hình thế hệ mới nhất như GPT-5.6 Sol. Một số mô hình yếu hơn có thể trả lời bằng văn bản cuối nhưng không hiểu rằng đầu ra hiển thị tại nguồn phải được gửi bằng `message(action=send)`. Theo mặc định, OpenClaw chỉ khôi phục trường hợp phổ biến khi câu trả lời cuối bị mắc kẹt nếu câu trả lời đó có nội dung đáng kể, lượt nguồn không phải là sự kiện phòng, chính sách gửi không từ chối phân phối và chưa có phản hồi nguồn nào được gửi. Quá trình khôi phục được giới hạn ở một lần thử lại; nó ngăn việc lưu lời nhắc thử lại tổng hợp và giữ lần thử lại đó ngoài quá trình gom lô để không thể hợp nhất với các lời nhắc không liên quan đang xếp hàng. Nếu lần thử lại cũng bị mắc kẹt hoặc không thể đưa vào hàng đợi, OpenClaw chỉ phân phối một thông báo chẩn đoán đã được làm sạch, chẳng hạn như "Tôi đã tạo phản hồi nhưng không thể gửi phản hồi đó đến cuộc trò chuyện này. Vui lòng thử lại." Văn bản cuối riêng tư ban đầu không bao giờ được đánh dấu để tự động phân phối đến nguồn. Đối với các mô hình liên tục làm mắc kẹt phản hồi, hãy dùng `"automatic"` để lượt trợ lý cuối cùng trở thành đường dẫn phản hồi hiển thị, chuyển sang một mô hình gọi công cụ mạnh hơn, kiểm tra nhật ký chi tiết của Gateway để xem bản tóm tắt tải trọng bị chặn hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để sử dụng phản hồi cuối hiển thị cho mọi yêu cầu nhóm/kênh.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ chuyển sang các phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Quy tắc này áp dụng cho văn bản cuối thông thường của tác nhân. Các liên kết hội thoại do Plugin sở hữu sử dụng phản hồi do Plugin sở hữu trả về làm phản hồi hiển thị cho các lượt trong luồng đã liên kết mà Plugin xác nhận xử lý; Plugin không cần gọi `message(action=send)` cho các phản hồi liên kết đó.

**Khắc phục sự cố: @mention trong nhóm kích hoạt trạng thái đang nhập rồi im lặng (không có lỗi)**

Triệu chứng: một @mention trong nhóm/kênh hiển thị chỉ báo đang nhập và nhật ký Gateway báo `dispatch complete (queuedFinal=false, replies=0)`, nhưng không có tin nhắn nào xuất hiện trong phòng. Tin nhắn trực tiếp gửi đến cùng tác nhân vẫn được phản hồi bình thường.

Nguyên nhân: chế độ phản hồi hiển thị của nhóm/kênh được phân giải thành `"message_tool"`, vì vậy OpenClaw chạy lượt nhưng chặn văn bản cuối của trợ lý trừ khi tác nhân gọi `message(action=send)`. Không có hợp đồng `NO_REPLY` trong chế độ này; không gọi công cụ tin nhắn đồng nghĩa với việc văn bản cuối ban đầu là riêng tư. Đối với các lượt nguồn có nội dung thực chất, OpenClaw hiện thử lại một lần để khôi phục có bảo vệ; ghi chú ngắn, yêu cầu im lặng rõ ràng, sự kiện phòng, lượt bị chính sách gửi từ chối và lượt đã được gửi sẽ không được thử lại. Các lượt nhóm và kênh thông thường mặc định là `"automatic"`, vì vậy triệu chứng này chỉ xuất hiện khi `messages.groupChat.visibleReplies` (hoặc `messages.visibleReplies` toàn cục) được đặt rõ ràng thành `"message_tool"`. `defaultVisibleReplies` của harness không áp dụng ở đây — bộ phân giải nhóm/kênh bỏ qua tùy chọn này; nó chỉ ảnh hưởng đến các cuộc trò chuyện trực tiếp/nguồn (harness Codex chặn phần kết của cuộc trò chuyện trực tiếp theo cách đó).

Cách khắc phục: chọn một mô hình gọi công cụ mạnh hơn, xóa ghi đè `"message_tool"` rõ ràng để quay về mặc định `"automatic"`, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để buộc hiển thị phản hồi cho mọi yêu cầu nhóm/kênh. Một văn bản cuối có nội dung thực chất bị mắc kẹt sẽ không còn kết thúc dưới dạng thành công trong im lặng; nó phải khôi phục qua một lần thử lại `message(action=send)` hoặc hiển thị thông báo chẩn đoán lỗi gửi đã được làm sạch. Gateway tự động tải lại nóng cấu hình `messages` sau khi tệp được lưu; chỉ khởi động lại Gateway khi tính năng theo dõi tệp hoặc tải lại cấu hình bị vô hiệu hóa trong môi trường triển khai.

**Các loại lượt đề cập:**

- **Lượt đề cập trong siêu dữ liệu**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự trò chuyện của WhatsApp.
- **Mẫu văn bản**: Các mẫu biểu thức chính quy an toàn trong `agents.list[].groupChat.mentionPatterns`. Các mẫu không hợp lệ và phép lặp lồng nhau không an toàn sẽ bị bỏ qua.
- Cổng kiểm soát lượt đề cập chỉ được thực thi khi có thể phát hiện (lượt đề cập gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // buộc dùng phản hồi cuối tự động cũ cho các cuộc trò chuyện trực tiếp/nguồn
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // hội thoại trong phòng luôn bật nhưng không có lượt đề cập trở thành ngữ cảnh yên lặng
      visibleReplies: "message_tool", // tự nguyện bật; yêu cầu message(action=send) để phản hồi trong phòng được hiển thị
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt giá trị mặc định toàn cục. Các kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo từng tài khoản). Đặt `0` để vô hiệu hóa.

`messages.groupChat.unmentionedInbound: "room_event"` gửi các tin nhắn nhóm/kênh luôn bật nhưng không có lượt đề cập dưới dạng ngữ cảnh phòng yên lặng trên các kênh được hỗ trợ. Tin nhắn có lượt đề cập, lệnh và tin nhắn trực tiếp vẫn là yêu cầu của người dùng. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết các ví dụ đầy đủ về Discord, Slack và Telegram.

`messages.visibleReplies` là giá trị mặc định toàn cục cho sự kiện nguồn; `messages.groupChat.visibleReplies` ghi đè giá trị này cho sự kiện nguồn của nhóm/kênh. Khi `messages.visibleReplies` chưa được đặt, các cuộc trò chuyện trực tiếp/nguồn sử dụng giá trị mặc định của runtime hoặc harness đã chọn, nhưng các lượt trực tiếp nội bộ của WebChat sử dụng tính năng gửi văn bản cuối tự động để bảo đảm tính tương đồng về prompt giữa Pi/Codex. Đặt `messages.visibleReplies: "message_tool"` để chủ ý yêu cầu `message(action=send)` cho đầu ra hiển thị. Danh sách cho phép của kênh và cổng kiểm soát lượt đề cập vẫn quyết định một sự kiện có được xử lý hay không.

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

Thứ tự phân giải: ghi đè theo từng tin nhắn trực tiếp → mặc định của nhà cung cấp → không giới hạn (giữ lại tất cả).

Bộ phân giải này đọc `channels.<provider>.dmHistoryLimit` và `channels.<provider>.dms.<id>.historyLimit` cho mọi kênh có khóa phiên tuân theo dạng `provider:direct:<id>` tiêu chuẩn (hoặc `provider:dm:<id>` cũ), vì vậy nó hoạt động trên cả các kênh đi kèm lẫn kênh Plugin, không chỉ một danh sách cố định.

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
    nativeSkills: "auto", // đăng ký lệnh Skills gốc khi được hỗ trợ
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

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp sẵn và đi kèm hiện tại, hãy xem [Lệnh dấu gạch chéo](/vi/tools/slash-commands).
- Trang này là **tài liệu tham chiếu khóa cấu hình**, không phải toàn bộ danh mục lệnh. Các lệnh do kênh/Plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép nối thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone` và Talk `/voice` được ghi lại trên các trang kênh/Plugin tương ứng cùng với [Lệnh dấu gạch chéo](/vi/tools/slash-commands).
- Các lệnh văn bản phải là tin nhắn **độc lập** với `/` đứng đầu.
- `native: "auto"` bật các lệnh gốc cho Discord/Telegram và giữ chúng tắt trên Slack.
- `nativeSkills: "auto"` bật các lệnh Skills gốc cho Discord/Telegram và giữ chúng tắt trên Slack.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (giá trị boolean hoặc `"auto"`). Đối với Discord, `false` bỏ qua việc đăng ký và dọn dẹp lệnh gốc trong quá trình khởi động.
- Ghi đè việc đăng ký Skills gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục bổ sung vào menu bot Telegram.
- `bash: true` bật `! <cmd>` cho shell của máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi phải nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Đối với các máy khách `chat.send` của Gateway, các thao tác ghi `/config set|unset` được duy trì lâu dài cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn khả dụng cho các máy khách vận hành thông thường có phạm vi ghi.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`.
- `plugins: true` bật `/plugins` cho các chức năng khám phá, cài đặt và bật/tắt Plugin.
- `channels.<provider>.configWrites` kiểm soát các thay đổi cấu hình theo từng kênh (mặc định: true).
- Đối với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm đến tài khoản đó (ví dụ: `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` vô hiệu hóa `/restart` và các yêu cầu khởi động lại `SIGUSR1` bên ngoài. Mặc định: `true`.
- `ownerAllowFrom` là danh sách chủ sở hữu được phép rõ ràng dành cho các lệnh chỉ dành cho chủ sở hữu và các thao tác kênh được kiểm soát theo chủ sở hữu. Danh sách này tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm mã định danh chủ sở hữu trong prompt hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` áp dụng theo từng nhà cung cấp. Khi được đặt, đây là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép nối của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép các lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` chưa được đặt.
- Bản đồ tài liệu lệnh:
  - danh mục tích hợp sẵn và đi kèm: [Lệnh dấu gạch chéo](/vi/tools/slash-commands)
  - bề mặt lệnh dành riêng cho từng kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép nối: [Ghép nối](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - Dreaming của bộ nhớ: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất
- [Cấu hình — tác nhân](/vi/gateway/config-agents)
- [Tổng quan về kênh](/vi/channels)
