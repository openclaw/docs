---
read_when:
    - Cấu hình Plugin kênh (xác thực, kiểm soát truy cập, nhiều tài khoản)
    - Khắc phục sự cố các khóa cấu hình theo từng kênh
    - Kiểm tra chính sách DM, chính sách nhóm hoặc cổng kiểm soát lượt nhắc tới
summary: 'Cấu hình kênh: kiểm soát truy cập, ghép nối, khóa theo từng kênh trên Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và nhiều kênh khác'
title: Cấu hình — kênh
x-i18n:
    generated_at: "2026-06-27T17:28:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Các khóa cấu hình theo kênh dưới `channels.*`. Bao gồm quyền truy cập DM và nhóm,
thiết lập nhiều tài khoản, kiểm soát theo lượt nhắc, và các khóa theo kênh cho Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, và các plugin kênh đi kèm khác.

Đối với tác tử, công cụ, runtime Gateway, và các khóa cấp cao khác, xem
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Kênh

Mỗi kênh tự động khởi động khi phần cấu hình của kênh đó tồn tại (trừ khi `enabled: false`).

### Quyền truy cập DM và nhóm

Tất cả kênh đều hỗ trợ chính sách DM và chính sách nhóm:

| Chính sách DM        | Hành vi                                                        |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (mặc định) | Người gửi chưa biết nhận mã ghép đôi một lần; chủ sở hữu phải phê duyệt |
| `allowlist`          | Chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép đôi) |
| `open`               | Cho phép tất cả DM gửi đến (yêu cầu `allowFrom: ["*"]`)        |
| `disabled`           | Bỏ qua tất cả DM gửi đến                                       |

| Chính sách nhóm        | Hành vi                                               |
| ---------------------- | ----------------------------------------------------- |
| `allowlist` (mặc định) | Chỉ các nhóm khớp danh sách cho phép đã cấu hình      |
| `open`                 | Bỏ qua danh sách cho phép của nhóm (vẫn áp dụng kiểm soát theo lượt nhắc) |
| `disabled`             | Chặn tất cả tin nhắn nhóm/phòng                       |

<Note>
`channels.defaults.groupPolicy` đặt mặc định khi `groupPolicy` của nhà cung cấp chưa được đặt.
Mã ghép đôi hết hạn sau 1 giờ. Các yêu cầu ghép đôi DM đang chờ được giới hạn ở **3 mỗi kênh**.
Nếu toàn bộ khối nhà cung cấp bị thiếu (`channels.<provider>` không có), chính sách nhóm runtime quay về `allowlist` (đóng khi lỗi) kèm cảnh báo lúc khởi động.
</Note>

### Ghi đè mô hình theo kênh

Dùng `channels.modelByChannel` để ghim ID kênh cụ thể hoặc peer tin nhắn trực tiếp vào một mô hình. Giá trị chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình. Ánh xạ kênh áp dụng khi phiên chưa có ghi đè mô hình (ví dụ, được đặt qua `/model`).

Đối với cuộc trò chuyện nhóm/luồng, khóa là ID nhóm theo kênh, ID chủ đề, hoặc tên kênh. Đối với cuộc trò chuyện tin nhắn trực tiếp (DM), khóa là định danh peer bắt nguồn từ danh tính người gửi của kênh (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, hoặc `SenderId`). Dạng khóa chính xác tùy thuộc vào kênh:

| Kênh     | Dạng khóa DM       | Ví dụ                                        |
| -------- | ------------------ | -------------------------------------------- |
| Slack    | `user:U...`        | `user:U12345`                                |
| Telegram | ID người dùng thô  | `123456789`                                  |
| Discord  | ID người dùng thô  | `987654321`                                  |
| WhatsApp | số điện thoại hoặc JID | `15551234567`                            |
| Matrix   | ID người dùng Matrix | `@user:matrix.org`                         |
| Feishu   | `feishu:ou_...`    | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
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

Các khóa riêng cho DM chỉ khớp trong cuộc trò chuyện tin nhắn trực tiếp; chúng không ảnh hưởng đến định tuyến nhóm/luồng.

### Mặc định kênh và Heartbeat

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

- `channels.defaults.groupPolicy`: chính sách nhóm dự phòng khi `groupPolicy` cấp nhà cung cấp chưa được đặt.
- `channels.defaults.contextVisibility`: chế độ hiển thị ngữ cảnh bổ sung mặc định cho tất cả kênh. Giá trị: `all` (mặc định, bao gồm toàn bộ ngữ cảnh trích dẫn/luồng/lịch sử), `allowlist` (chỉ bao gồm ngữ cảnh từ người gửi trong danh sách cho phép), `allowlist_quote` (giống allowlist nhưng giữ ngữ cảnh trích dẫn/trả lời rõ ràng). Ghi đè theo kênh: `channels.<channel>.contextVisibility`.
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

- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho DM và nhóm WhatsApp. Dùng số trực tiếp E.164 hoặc JID nhóm WhatsApp trong `match.peer.id`. Ngữ nghĩa trường được dùng chung trong [Tác tử ACP](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Multi-account WhatsApp">

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

- Bot token: `channels.telegram.botToken` hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; từ chối symlink), với `TELEGRAM_BOT_TOKEN` làm dự phòng cho tài khoản mặc định.
- `apiRoot` chỉ là gốc Telegram Bot API. Dùng `https://api.telegram.org` hoặc gốc tự lưu trữ/proxy của bạn, không dùng `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` xóa hậu tố `/bot<TOKEN>` vô tình ở cuối.
- `channels.telegram.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Trong thiết lập nhiều tài khoản (2+ ID tài khoản), đặt mặc định rõ ràng (`channels.telegram.defaultAccount` hoặc `channels.telegram.accounts.default`) để tránh định tuyến dự phòng; `openclaw doctor` cảnh báo khi mục này bị thiếu hoặc không hợp lệ.
- `configWrites: false` chặn các lần ghi cấu hình khởi phát từ Telegram (di chuyển ID siêu nhóm, `/config set|unset`).
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho chủ đề diễn đàn (dùng `chatId:topic:topicId` chuẩn trong `match.peer.id`). Ngữ nghĩa trường được dùng chung trong [Tác tử ACP](/vi/tools/acp-agents#persistent-channel-bindings).
- Bản xem trước luồng Telegram dùng `sendMessage` + `editMessageText` (hoạt động trong trò chuyện trực tiếp và trò chuyện nhóm).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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
- Các lệnh gọi trực tiếp ra ngoài cung cấp Discord `token` rõ ràng sẽ dùng token đó cho lệnh gọi; thiết lập thử lại/chính sách của tài khoản vẫn đến từ tài khoản đã chọn trong ảnh chụp runtime đang hoạt động.
- `channels.discord.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một id tài khoản đã cấu hình.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` (kênh guild) cho đích gửi; ID số trần sẽ bị từ chối.
- Slug của guild dùng chữ thường, khoảng trắng được thay bằng `-`; khóa kênh dùng tên đã slug hóa (không có `#`). Ưu tiên dùng ID guild.
- Tin nhắn do bot tạo mặc định bị bỏ qua. `allowBots: true` bật chúng; dùng `allowBots: "mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot (tin nhắn của chính bot vẫn bị lọc).
- Các kênh hỗ trợ tin nhắn đến do bot tạo có thể dùng chung [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection). Đặt `channels.defaults.botLoopProtection` cho ngân sách cặp cơ sở, rồi chỉ ghi đè kênh hoặc tài khoản khi một bề mặt cần giới hạn khác.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (và các ghi đè kênh) loại bỏ tin nhắn nhắc đến người dùng hoặc vai trò khác nhưng không nhắc đến bot (trừ @everyone/@here).
- `channels.discord.mentionAliases` ánh xạ văn bản gửi đi `@handle` ổn định sang ID người dùng Discord trước khi gửi, để các đồng đội đã biết có thể được nhắc đến một cách xác định ngay cả khi bộ nhớ đệm thư mục tạm thời trống. Ghi đè theo tài khoản nằm dưới `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (mặc định 17) chia các tin nhắn cao ngay cả khi dưới 2000 ký tự.
- `channels.discord.suppressEmbeds` mặc định là `true`, nên URL gửi đi không mở rộng thành bản xem trước liên kết Discord trừ khi bị tắt. Payload `embeds` rõ ràng vẫn gửi bình thường; các lệnh gọi công cụ theo từng tin nhắn có thể ghi đè bằng `suppressEmbeds`.
- `channels.discord.threadBindings` điều khiển định tuyến gắn với luồng Discord:
  - `enabled`: ghi đè Discord cho các tính năng phiên gắn với luồng (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và gửi/định tuyến đã gắn)
  - `idleHours`: ghi đè Discord cho tự động bỏ focus khi không hoạt động, tính bằng giờ (`0` để tắt)
  - `maxAgeHours`: ghi đè Discord cho tuổi tối đa cứng, tính bằng giờ (`0` để tắt)
  - `spawnSessions`: công tắc cho `sessions_spawn({ thread: true })` và việc ACP tự động tạo/gắn luồng khi sinh luồng từ luồng (mặc định: `true`)
  - `defaultSpawnContext`: ngữ cảnh subagent gốc cho các lần sinh gắn với luồng (mặc định là `"fork"`)
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` cấu hình liên kết ACP bền vững cho kênh và luồng (dùng id kênh/luồng trong `match.peer.id`). Ngữ nghĩa trường được chia sẻ trong [ACP Agents](/vi/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` đặt màu nhấn cho vùng chứa thành phần Discord v2.
- `channels.discord.agentComponents.ttlMs` kiểm soát thời gian các callback thành phần Discord đã gửi còn được đăng ký. Mặc định là `1800000` (30 phút), tối đa là `86400000` (24 giờ), và ghi đè theo tài khoản nằm dưới `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Giá trị dài hơn giữ cho các nút/lựa chọn/biểu mẫu cũ dùng được lâu hơn, nên hãy ưu tiên TTL ngắn nhất phù hợp với quy trình.
- `channels.discord.voice` bật hội thoại kênh thoại Discord và các ghi đè tự động tham gia + LLM + TTS tùy chọn. Cấu hình Discord chỉ văn bản mặc định tắt thoại; đặt `channels.discord.voice.enabled=true` để tham gia.
- `channels.discord.voice.model` tùy chọn ghi đè mô hình LLM dùng cho phản hồi kênh thoại Discord.
- `channels.discord.voice.daveEncryption` và `channels.discord.voice.decryptionFailureTolerance` truyền tiếp đến tùy chọn DAVE của `@discordjs/voice` (mặc định là `true` và `24`).
- `channels.discord.voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần tự động tham gia (mặc định là `30000`).
- `channels.discord.voice.reconnectGraceMs` kiểm soát thời gian một phiên thoại bị ngắt kết nối có thể dùng để vào tín hiệu kết nối lại trước khi OpenClaw hủy phiên đó (mặc định là `15000`).
- Phát lại thoại Discord không bị ngắt bởi sự kiện bắt đầu nói của người dùng khác. Để tránh vòng lặp phản hồi, OpenClaw bỏ qua việc thu thoại mới trong khi TTS đang phát.
- OpenClaw cũng cố gắng khôi phục nhận thoại bằng cách rời/tham gia lại một phiên thoại sau các lỗi giải mã lặp lại.
- `channels.discord.streaming` là khóa chế độ luồng chuẩn. Discord mặc định là `streaming.mode: "progress"` để tiến trình công cụ/công việc xuất hiện trong một tin nhắn xem trước được chỉnh sửa; đặt `streaming.mode: "off"` để tắt. Các giá trị `streamMode` cũ và `streaming` dạng boolean vẫn là alias runtime; chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu.
- `channels.discord.autoPresence` ánh xạ trạng thái sẵn sàng của runtime sang hiện diện bot (healthy => online, degraded => idle, exhausted => dnd) và cho phép ghi đè văn bản trạng thái tùy chọn.
- `channels.discord.dangerouslyAllowNameMatching` bật lại việc khớp tên/thẻ có thể thay đổi (chế độ tương thích phá kính).
- `channels.discord.execApprovals`: gửi phê duyệt exec gốc Discord và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ auto, phê duyệt exec kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Discord được phép phê duyệt yêu cầu exec. Dự phòng về `commands.ownerAllowFrom` khi bị bỏ qua.
  - `agentFilter`: allowlist ID agent tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả agent.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định) gửi đến DM của người phê duyệt, `"channel"` gửi đến kênh khởi nguồn, `"both"` gửi đến cả hai. Khi đích bao gồm `"channel"`, các nút chỉ dùng được bởi người phê duyệt đã phân giải.
  - `cleanupAfterResolve`: khi là `true`, xóa DM phê duyệt sau khi phê duyệt, từ chối hoặc hết thời gian.

**Chế độ thông báo phản ứng:** `off` (không có), `own` (tin nhắn của bot, mặc định), `all` (tất cả tin nhắn), `allowlist` (từ `guilds.<id>.users` trên tất cả tin nhắn).

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
- Phương án dự phòng env: `GOOGLE_CHAT_SERVICE_ACCOUNT` hoặc `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Dùng `spaces/<spaceId>` hoặc `users/<userId>` cho đích gửi.
- `channels.googlechat.dangerouslyAllowNameMatching` bật lại việc khớp principal email có thể thay đổi (chế độ tương thích phá kính).

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
- **Chế độ HTTP** yêu cầu `botToken` cùng với `signingSecret` (ở gốc hoặc theo từng tài khoản).
- `socketMode` truyền tinh chỉnh vận chuyển Socket Mode của Slack SDK tới API Bolt receiver công khai. Chỉ dùng khi điều tra thời gian chờ ping/pong hoặc hành vi websocket cũ. `clientPingTimeout` mặc định là `15000`; `serverPingTimeout` và `pingPongLoggingEnabled` chỉ được truyền khi đã cấu hình.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Ảnh chụp nhanh tài khoản Slack hiển thị các trường nguồn/trạng thái theo từng thông tin xác thực như
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` và, trong chế độ HTTP,
  `signingSecretStatus`. `configured_unavailable` nghĩa là tài khoản được
  cấu hình qua SecretRef nhưng đường dẫn lệnh/runtime hiện tại không thể
  phân giải giá trị bí mật.
- `configWrites: false` chặn các lần ghi cấu hình do Slack khởi tạo.
- `channels.slack.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.
- `channels.slack.streaming.mode` là khóa chế độ stream chuẩn của Slack. `channels.slack.streaming.nativeTransport` điều khiển vận chuyển streaming gốc của Slack. Các giá trị cũ `streamMode`, boolean `streaming` và `nativeStreaming` vẫn là bí danh runtime; chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu.
- `unfurlLinks` và `unfurlMedia` truyền các boolean mở rộng liên kết và phương tiện của `chat.postMessage` trong Slack cho phản hồi của bot. `unfurlLinks` mặc định là `false` để liên kết bot gửi ra không mở rộng nội tuyến trừ khi được bật; `unfurlMedia` bị bỏ qua trừ khi được cấu hình. Đặt một trong hai giá trị tại `channels.slack.accounts.<accountId>` để ghi đè giá trị cấp cao nhất cho một tài khoản.
- Dùng `user:<id>` (DM) hoặc `channel:<id>` cho mục tiêu gửi.

**Chế độ thông báo phản ứng:** `off`, `own` (mặc định), `all`, `allowlist` (từ `reactionAllowlist`).

**Cô lập phiên luồng:** `thread.historyScope` là theo từng luồng (mặc định) hoặc dùng chung trên toàn kênh. `thread.inheritParent` sao chép transcript kênh cha sang các luồng mới.

- Streaming gốc của Slack cùng trạng thái luồng kiểu trợ lý Slack "đang nhập..." yêu cầu mục tiêu luồng trả lời. DM cấp cao nhất mặc định vẫn nằm ngoài luồng, nên chúng vẫn có thể stream qua bản xem trước bài nháp đăng-và-sửa của Slack thay vì hiển thị bản xem trước stream/trạng thái gốc kiểu luồng.
- `typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đi vào trong khi phản hồi đang chạy, rồi xóa phản ứng đó khi hoàn tất. Dùng shortcode emoji Slack như `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: gửi approval-client gốc của Slack và ủy quyền người phê duyệt exec. Cùng schema như Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID người dùng Slack), `agentFilter`, `sessionFilter` và `target` (`"dm"`, `"channel"` hoặc `"both"`). Phê duyệt Plugin có thể dùng đường dẫn native-client này cho các yêu cầu bắt nguồn từ Slack khi người phê duyệt Plugin Slack phân giải được; gửi phê duyệt Plugin gốc Slack cũng có thể được bật qua `approvals.plugin` cho phiên bắt nguồn từ Slack hoặc mục tiêu Slack. Phê duyệt Plugin dùng người phê duyệt Plugin Slack từ `allowFrom` và định tuyến mặc định, không dùng người phê duyệt exec.

| Nhóm hành động | Mặc định | Ghi chú                    |
| ------------ | ------- | ---------------------- |
| reactions    | bật | Phản ứng + liệt kê phản ứng |
| messages     | bật | Đọc/gửi/sửa/xóa  |
| pins         | bật | Ghim/bỏ ghim/liệt kê         |
| memberInfo   | bật | Thông tin thành viên            |
| emojiList    | bật | Danh sách emoji tùy chỉnh      |

### Mattermost

Mattermost được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại. Các bản dựng cũ hơn hoặc
tùy chỉnh có thể cài đặt gói npm hiện tại bằng
`openclaw plugins install @openclaw/mattermost`. Kiểm tra
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
để xem các dist-tag hiện tại trước khi ghim một phiên bản.

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
- `commands.callbackUrl` phải phân giải tới điểm cuối Gateway OpenClaw và có thể truy cập được từ máy chủ Mattermost.
- Callback slash gốc được xác thực bằng các token theo từng lệnh do
  Mattermost trả về trong quá trình đăng ký slash command. Nếu đăng ký thất bại hoặc không có
  lệnh nào được kích hoạt, OpenClaw từ chối callback với
  `Unauthorized: invalid command token.`
- Đối với máy chủ callback riêng tư/tailnet/nội bộ, Mattermost có thể yêu cầu
  `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ/tên miền callback.
  Dùng giá trị máy chủ/tên miền, không dùng URL đầy đủ.
- `channels.mattermost.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do Mattermost khởi tạo.
- `channels.mattermost.requireMention`: yêu cầu `@mention` trước khi trả lời trong kênh.
- `channels.mattermost.groups.<channelId>.requireMention`: ghi đè chặn theo đề cập cho từng kênh (`"*"` cho mặc định).
- `channels.mattermost.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

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

- `channels.signal.account`: ghim khởi động kênh vào một danh tính tài khoản Signal cụ thể.
- `channels.signal.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do Signal khởi tạo.
- `channels.signal.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

### iMessage

OpenClaw khởi chạy `imsg rpc` (JSON-RPC qua stdio). Không cần daemon hoặc cổng. Đây là đường dẫn ưu tiên cho các thiết lập iMessage OpenClaw mới khi máy chủ có thể cấp quyền cơ sở dữ liệu Messages và Automation.

Hỗ trợ BlueBubbles đã bị loại bỏ. `channels.bluebubbles` không phải là bề mặt cấu hình runtime được hỗ trợ trên OpenClaw hiện tại. Di chuyển cấu hình cũ sang `channels.imessage`; dùng [Loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để xem bản ngắn và [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng dịch đầy đủ.

Nếu Gateway không chạy trên máy Mac Messages đã đăng nhập, giữ `channels.imessage.enabled=true` và đặt `channels.imessage.cliPath` thành wrapper SSH chạy `imsg "$@"` trên máy Mac đó. Đường dẫn `imsg` cục bộ mặc định chỉ dành cho macOS.

Trước khi dựa vào wrapper SSH cho gửi trong production, xác minh một lệnh gửi ra `imsg send` qua đúng wrapper đó. Một số trạng thái TCC của macOS gán Messages Automation cho `/usr/libexec/sshd-keygen-wrapper`, điều này có thể khiến đọc và probe hoạt động trong khi gửi thất bại với AppleEvents `-1743`; xem [Gửi qua wrapper SSH thất bại với AppleEvents -1743](/vi/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- `channels.imessage.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi nó khớp với một id tài khoản đã cấu hình.

- Yêu cầu Full Disk Access tới Messages DB.
- Ưu tiên mục tiêu `chat_id:<id>`. Dùng `imsg chats --limit 20` để liệt kê chat.
- `cliPath` có thể trỏ tới wrapper SSH; đặt `remoteHost` (`host` hoặc `user@host`) để lấy tệp đính kèm bằng SCP.
- `attachmentRoots` và `remoteAttachmentRoots` giới hạn đường dẫn tệp đính kèm đi vào (mặc định: `/Users/*/Library/Messages/Attachments`).
- SCP dùng kiểm tra host-key nghiêm ngặt, nên hãy đảm bảo khóa máy chủ relay đã tồn tại trong `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: cho phép hoặc từ chối các lần ghi cấu hình do iMessage khởi tạo.
- `channels.imessage.sendTransport`: vận chuyển gửi RPC `imsg` ưu tiên cho phản hồi gửi ra thông thường. `auto` (mặc định) dùng cầu nối IMCore cho các chat hiện có khi nó đang chạy, rồi fallback sang AppleScript; `bridge` yêu cầu gửi qua private-API; `applescript` buộc dùng đường dẫn tự động hóa Messages công khai.
- `channels.imessage.actions.*`: bật các hành động API riêng tư cũng được kiểm soát bởi `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` mặc định tắt; đặt thành `true` trước khi kỳ vọng phương tiện đi vào trong lượt agent.
- Khôi phục đi vào sau khi khởi động lại bridge/gateway là tự động (khử trùng lặp GUID cộng với hàng rào tuổi backlog cũ). Các cấu hình `channels.imessage.catchup.enabled: true` hiện có vẫn được tôn trọng như một hồ sơ tương thích đã lỗi thời.
- `channels.imessage.groups`: sổ đăng ký nhóm và thiết lập theo từng nhóm. Với `groupPolicy: "allowlist"`, cấu hình khóa `chat_id` rõ ràng hoặc mục ký tự đại diện `"*"` để tin nhắn nhóm có thể vượt qua cổng sổ đăng ký.
- Các mục `bindings[]` cấp cao nhất với `type: "acp"` có thể liên kết cuộc trò chuyện iMessage với phiên ACP bền vững. Dùng handle đã chuẩn hóa hoặc mục tiêu chat rõ ràng (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) trong `match.peer.id`. Ngữ nghĩa trường dùng chung: [Agent ACP](/vi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ví dụ wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix được hỗ trợ bằng Plugin và cấu hình dưới `channels.matrix`.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` cho phép homeserver riêng tư/nội bộ. `proxy` và tùy chọn tham gia mạng này là các điều khiển độc lập.
- `channels.matrix.defaultAccount` chọn tài khoản ưu tiên trong các thiết lập nhiều tài khoản.
- `channels.matrix.autoJoin` mặc định là `off`, nên các phòng được mời và lời mời kiểu DM mới sẽ bị bỏ qua cho đến khi bạn đặt `autoJoin: "allowlist"` với `autoJoinAllowlist` hoặc `autoJoin: "always"`.
- `channels.matrix.execApprovals`: phân phối phê duyệt exec gốc Matrix và ủy quyền người phê duyệt.
  - `enabled`: `true`, `false`, hoặc `"auto"` (mặc định). Ở chế độ tự động, phê duyệt exec kích hoạt khi có thể phân giải người phê duyệt từ `approvers` hoặc `commands.ownerAllowFrom`.
  - `approvers`: ID người dùng Matrix (ví dụ `@owner:example.org`) được phép phê duyệt yêu cầu exec.
  - `agentFilter`: danh sách cho phép ID agent tùy chọn. Bỏ qua để chuyển tiếp phê duyệt cho tất cả agent.
  - `sessionFilter`: mẫu khóa phiên tùy chọn (chuỗi con hoặc regex).
  - `target`: nơi gửi lời nhắc phê duyệt. `"dm"` (mặc định), `"channel"` (phòng khởi nguồn), hoặc `"both"`.
  - Ghi đè theo tài khoản: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kiểm soát cách DM Matrix nhóm thành phiên: `per-user` (mặc định) chia sẻ theo peer được định tuyến, còn `per-room` cô lập từng phòng DM.
- Probe trạng thái Matrix và tra cứu thư mục trực tiếp dùng cùng chính sách proxy như lưu lượng runtime.
- Cấu hình Matrix đầy đủ, quy tắc nhắm mục tiêu và ví dụ thiết lập được ghi lại trong [Matrix](/vi/channels/matrix).

### Microsoft Teams

Microsoft Teams được Plugin hậu thuẫn và được cấu hình trong `channels.msteams`.

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
- Cấu hình Teams đầy đủ (thông tin xác thực, webhook, chính sách DM/nhóm, ghi đè theo team/theo kênh) được ghi lại trong [Microsoft Teams](/vi/channels/msteams).

### IRC

IRC được Plugin hậu thuẫn và được cấu hình trong `channels.irc`.

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
- `channels.irc.defaultAccount` tùy chọn ghi đè lựa chọn tài khoản mặc định khi khớp với một ID tài khoản đã cấu hình.
- Cấu hình kênh IRC đầy đủ (host/port/TLS/kênh/danh sách cho phép/chặn theo mention) được ghi lại trong [IRC](/vi/channels/irc).

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
- Token env chỉ áp dụng cho tài khoản **default**.
- Thiết lập kênh cơ sở áp dụng cho tất cả tài khoản trừ khi được ghi đè theo tài khoản.
- Dùng `bindings[].match.accountId` để định tuyến từng tài khoản đến một agent khác nhau.
- Nếu bạn thêm tài khoản không mặc định qua `openclaw channels add` (hoặc onboarding kênh) trong khi vẫn dùng cấu hình kênh cấp cao một tài khoản, OpenClaw trước tiên sẽ nâng cấp các giá trị một tài khoản cấp cao theo phạm vi tài khoản vào bản đồ tài khoản của kênh để tài khoản ban đầu tiếp tục hoạt động. Hầu hết kênh chuyển chúng vào `channels.<channel>.accounts.default`; Matrix có thể giữ nguyên một đích đã đặt tên/mặc định hiện có nếu khớp.
- Các binding chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định; binding theo phạm vi tài khoản vẫn là tùy chọn.
- `openclaw doctor --fix` cũng sửa các dạng trộn lẫn bằng cách chuyển các giá trị một tài khoản cấp cao theo phạm vi tài khoản vào tài khoản đã nâng cấp được chọn cho kênh đó. Hầu hết kênh dùng `accounts.default`; Matrix có thể giữ nguyên một đích đã đặt tên/mặc định hiện có nếu khớp.

### Các kênh Plugin khác

Nhiều kênh Plugin được cấu hình dưới dạng `channels.<id>` và được ghi lại trong các trang kênh riêng của chúng (ví dụ Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat và Twitch).
Xem chỉ mục kênh đầy đủ: [Kênh](/vi/channels).

### Chặn group chat theo mention

Tin nhắn nhóm mặc định là **yêu cầu mention** (mention metadata hoặc mẫu regex an toàn). Áp dụng cho group chat WhatsApp, Telegram, Discord, Google Chat và iMessage.

Phản hồi hiển thị được kiểm soát riêng. Các yêu cầu trực tiếp thông thường trong nhóm, kênh và WebChat nội bộ mặc định dùng phân phối cuối tự động: văn bản cuối của trợ lý được đăng qua đường dẫn phản hồi hiển thị cũ. Chọn `messages.visibleReplies: "message_tool"` hoặc `messages.groupChat.visibleReplies: "message_tool"` khi đầu ra hiển thị chỉ nên được đăng sau khi agent gọi `message(action=send)`. Nếu model trả về văn bản cuối mà không gọi công cụ tin nhắn trong chế độ chỉ dùng công cụ đã chọn, văn bản cuối đó vẫn riêng tư và nhật ký verbose của Gateway ghi lại metadata payload đã bị chặn.

Phản hồi hiển thị chỉ dùng công cụ yêu cầu model/runtime gọi công cụ đáng tin cậy, và được khuyến nghị cho các phòng dùng chung xung quanh trên model thế hệ mới nhất như GPT 5.5. Một số model yếu hơn có thể trả lời văn bản cuối nhưng không hiểu rằng đầu ra hiển thị tại nguồn phải được gửi bằng `message(action=send)`. Với các model đó, dùng `"automatic"` để lượt trợ lý cuối là đường dẫn phản hồi hiển thị. Nếu nhật ký phiên hiển thị văn bản trợ lý với `didSendViaMessagingTool: false`, model đã tạo văn bản cuối riêng tư thay vì gọi công cụ tin nhắn. Chuyển sang model gọi công cụ mạnh hơn cho kênh đó, kiểm tra nhật ký verbose của Gateway để xem tóm tắt payload đã bị chặn, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để dùng phản hồi cuối hiển thị cho mọi yêu cầu nhóm/kênh.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw quay về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về điểm không khớp này.

Quy tắc này áp dụng cho văn bản cuối thông thường của agent. Binding hội thoại do Plugin sở hữu dùng phản hồi được trả về từ Plugin sở hữu làm phản hồi hiển thị cho các lượt bound-thread đã được nhận; Plugin không cần gọi `message(action=send)` cho các phản hồi binding đó.

**Khắc phục sự cố: group @mention kích hoạt trạng thái đang nhập rồi im lặng (không có lỗi)**

Triệu chứng: một @mention nhóm/kênh hiển thị chỉ báo đang nhập và nhật ký Gateway báo `dispatch complete (queuedFinal=false, replies=0)`, nhưng không có tin nhắn nào xuất hiện trong phòng. DM đến cùng agent vẫn trả lời bình thường.

Nguyên nhân: chế độ phản hồi hiển thị của nhóm/kênh phân giải thành `"message_tool"`, nên OpenClaw chạy lượt nhưng chặn văn bản cuối của trợ lý trừ khi agent gọi `message(action=send)`. Không có hợp đồng `NO_REPLY` trong chế độ này; không có lệnh gọi công cụ tin nhắn nghĩa là không có phản hồi nguồn. Không có lỗi vì chặn là hành vi đã cấu hình. Các lượt nhóm và kênh thông thường mặc định là `"automatic"`, nên triệu chứng này chỉ xuất hiện khi `messages.groupChat.visibleReplies` (hoặc `messages.visibleReplies` toàn cục) được đặt rõ ràng thành `"message_tool"`. Harness `defaultVisibleReplies` không áp dụng ở đây — bộ phân giải nhóm/kênh bỏ qua nó; nó chỉ ảnh hưởng đến chat trực tiếp/nguồn (Codex harness chặn kết quả cuối của chat trực tiếp theo cách đó).

Cách sửa: chọn model gọi công cụ mạnh hơn, xóa ghi đè `"message_tool"` rõ ràng để quay về mặc định `"automatic"`, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để buộc phản hồi hiển thị cho mọi yêu cầu nhóm/kênh. Gateway hot-reload cấu hình `messages` sau khi tệp được lưu; chỉ khởi động lại Gateway khi theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

**Loại mention:**

- **Mention metadata**: @-mention gốc của nền tảng. Bị bỏ qua trong chế độ tự chat WhatsApp.
- **Mẫu văn bản**: Mẫu regex an toàn trong `agents.list[].groupChat.mentionPatterns`. Mẫu không hợp lệ và lặp lồng nhau không an toàn sẽ bị bỏ qua.
- Chặn theo mention chỉ được thực thi khi có thể phát hiện (mention gốc hoặc ít nhất một mẫu).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` đặt mặc định toàn cục. Kênh có thể ghi đè bằng `channels.<channel>.historyLimit` (hoặc theo tài khoản). Đặt `0` để tắt.

`messages.groupChat.unmentionedInbound: "room_event"` gửi tin nhắn nhóm/kênh luôn bật không được mention dưới dạng ngữ cảnh phòng im lặng trên các kênh được hỗ trợ. Tin nhắn được mention, lệnh và tin nhắn trực tiếp vẫn là yêu cầu của người dùng. Xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events) để có ví dụ Discord, Slack và Telegram đầy đủ.

`messages.visibleReplies` là mặc định sự kiện nguồn toàn cục; `messages.groupChat.visibleReplies` ghi đè cho sự kiện nguồn nhóm/kênh. Khi `messages.visibleReplies` chưa được đặt, chat trực tiếp/nguồn dùng mặc định runtime hoặc harness đã chọn, nhưng các lượt trực tiếp WebChat nội bộ dùng phân phối cuối tự động để giữ tương đồng prompt Pi/Codex. Đặt `messages.visibleReplies: "message_tool"` để cố ý yêu cầu `message(action=send)` cho đầu ra hiển thị. Danh sách cho phép của kênh và chặn theo mention vẫn quyết định liệu một sự kiện có được xử lý hay không.

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

Thứ tự phân giải: ghi đè theo DM → mặc định của provider → không giới hạn (giữ lại tất cả).

Được hỗ trợ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Chế độ tự chat

Đưa số của chính bạn vào `allowFrom` để bật chế độ tự chat (bỏ qua @-mention gốc, chỉ phản hồi mẫu văn bản):

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

### Lệnh (xử lý lệnh chat)

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

- Khối này cấu hình các bề mặt lệnh. Để xem danh mục lệnh tích hợp sẵn + đóng gói hiện tại, hãy xem [Lệnh Slash](/vi/tools/slash-commands).
- Trang này là **tài liệu tham chiếu khóa cấu hình**, không phải danh mục lệnh đầy đủ. Các lệnh do kênh/Plugin sở hữu như QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, ghép cặp thiết bị `/pair`, bộ nhớ `/dreaming`, điều khiển điện thoại `/phone`, và Talk `/voice` được ghi lại trong các trang kênh/Plugin của chúng cùng với [Lệnh Slash](/vi/tools/slash-commands).
- Lệnh văn bản phải là tin nhắn **độc lập** có `/` ở đầu.
- `native: "auto"` bật lệnh gốc cho Discord/Telegram, để Slack tắt.
- `nativeSkills: "auto"` bật lệnh kỹ năng gốc cho Discord/Telegram, để Slack tắt.
- Ghi đè theo từng kênh: `channels.discord.commands.native` (bool hoặc `"auto"`). Với Discord, `false` bỏ qua việc đăng ký và dọn dẹp lệnh gốc trong lúc khởi động.
- Ghi đè đăng ký kỹ năng gốc theo từng kênh bằng `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` thêm các mục menu bot Telegram bổ sung.
- `bash: true` bật `! <cmd>` cho shell máy chủ. Yêu cầu `tools.elevated.enabled` và người gửi nằm trong `tools.elevated.allowFrom.<channel>`.
- `config: true` bật `/config` (đọc/ghi `openclaw.json`). Với máy khách Gateway `chat.send`, các thao tác ghi lâu dài `/config set|unset` cũng yêu cầu `operator.admin`; `/config show` chỉ đọc vẫn khả dụng cho máy khách người vận hành thông thường có phạm vi ghi.
- `mcp: true` bật `/mcp` cho cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`.
- `plugins: true` bật `/plugins` cho khám phá, cài đặt, và điều khiển bật/tắt Plugin.
- `channels.<provider>.configWrites` kiểm soát các thay đổi cấu hình theo từng kênh (mặc định: true).
- Với các kênh nhiều tài khoản, `channels.<provider>.accounts.<id>.configWrites` cũng kiểm soát các thao tác ghi nhắm đến tài khoản đó (ví dụ `/allowlist --config --account <id>` hoặc `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` tắt `/restart` và các hành động công cụ khởi động lại Gateway. Mặc định: `true`.
- `ownerAllowFrom` là danh sách cho phép chủ sở hữu rõ ràng cho các lệnh chỉ dành cho chủ sở hữu và các hành động kênh được kiểm soát bởi chủ sở hữu. Nó tách biệt với `allowFrom`.
- `ownerDisplay: "hash"` băm id chủ sở hữu trong lời nhắc hệ thống. Đặt `ownerDisplaySecret` để kiểm soát việc băm.
- `allowFrom` áp dụng theo từng nhà cung cấp. Khi được đặt, nó là nguồn ủy quyền **duy nhất** (danh sách cho phép/ghép cặp của kênh và `useAccessGroups` bị bỏ qua).
- `useAccessGroups: false` cho phép lệnh bỏ qua chính sách nhóm truy cập khi `allowFrom` không được đặt.
- Bản đồ tài liệu lệnh:
  - danh mục tích hợp sẵn + đóng gói: [Lệnh Slash](/vi/tools/slash-commands)
  - bề mặt lệnh riêng theo kênh: [Kênh](/vi/channels)
  - lệnh QQ Bot: [QQ Bot](/vi/channels/qqbot)
  - lệnh ghép cặp: [Ghép cặp](/vi/channels/pairing)
  - lệnh thẻ LINE: [LINE](/vi/channels/line)
  - bộ nhớ Dreaming: [Dreaming](/vi/concepts/dreaming)

</Accordion>

---

## Liên quan

- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) — khóa cấp cao nhất
- [Cấu hình — agent](/vi/gateway/config-agents)
- [Tổng quan về kênh](/vi/channels)
