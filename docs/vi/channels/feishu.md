---
read_when:
    - Bạn muốn kết nối bot Feishu/Lark
    - Bạn đang cấu hình kênh Feishu
summary: Tổng quan, tính năng và cấu hình bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark là một nền tảng cộng tác tất cả trong một, nơi các nhóm trò chuyện, chia sẻ tài liệu, quản lý lịch và cùng nhau hoàn thành công việc.

**Trạng thái:** sẵn sàng cho production đối với DM bot và trò chuyện nhóm. WebSocket là chế độ mặc định; chế độ Webhook là tùy chọn.

---

## Bắt đầu nhanh

<Note>
Yêu cầu OpenClaw 2026.5.29 trở lên. Chạy `openclaw --version` để kiểm tra. Nâng cấp bằng `openclaw update`.
</Note>

<Steps>
  <Step title="Chạy trình hướng dẫn thiết lập kênh">
  ```bash
  openclaw channels login --channel feishu
  ```
  Chọn thiết lập thủ công để dán App ID và App Secret từ Feishu Open Platform, hoặc chọn thiết lập QR để tự động tạo bot. Nếu ứng dụng Feishu nội địa trên di động không phản hồi mã QR, hãy chạy lại thiết lập và chọn thiết lập thủ công.
  </Step>
  
  <Step title="Sau khi thiết lập hoàn tất, khởi động lại Gateway để áp dụng thay đổi">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kiểm soát truy cập

### Tin nhắn trực tiếp

Cấu hình `dmPolicy` để kiểm soát ai có thể gửi DM cho bot:

- `"pairing"` - người dùng không xác định nhận mã ghép nối; phê duyệt qua CLI
- `"allowlist"` - chỉ người dùng được liệt kê trong `allowFrom` mới có thể trò chuyện
- `"open"` - chỉ cho phép DM công khai khi `allowFrom` bao gồm `"*"`; với các mục hạn chế, chỉ người dùng khớp mới có thể trò chuyện

**Phê duyệt yêu cầu ghép nối:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Trò chuyện nhóm

**Chính sách nhóm** (`channels.feishu.groupPolicy`):

| Giá trị       | Hành vi                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `"open"`      | Phản hồi tất cả tin nhắn trong nhóm                                                                  |
| `"allowlist"` | Chỉ phản hồi các nhóm trong `groupAllowFrom` hoặc được cấu hình rõ ràng trong `groups.<chat_id>`     |
| `"disabled"`  | Tắt tất cả tin nhắn nhóm; các mục `groups.<chat_id>` rõ ràng không ghi đè giá trị này                |

Mặc định: `allowlist`

**Yêu cầu nhắc đến** (`channels.feishu.requireMention`):

- `true` - yêu cầu @mention (mặc định)
- `false` - phản hồi mà không cần @mention
- Ghi đè theo từng nhóm: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` và `@_all` chỉ dùng để phát thông báo không được xem là nhắc đến bot. Tin nhắn nhắc đến cả `@all` và trực tiếp bot vẫn được tính là một lượt nhắc đến bot.

---

## Ví dụ cấu hình nhóm

### Cho phép tất cả nhóm, không yêu cầu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Cho phép tất cả nhóm, vẫn yêu cầu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Chỉ cho phép các nhóm cụ thể

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Ở chế độ `allowlist`, bạn cũng có thể cho phép một nhóm bằng cách thêm mục `groups.<chat_id>` rõ ràng. Các mục rõ ràng không ghi đè `groupPolicy: "disabled"`. Mặc định ký tự đại diện trong `groups.*` cấu hình các nhóm khớp, nhưng tự chúng không cho phép nhóm.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Giới hạn người gửi trong một nhóm

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Lấy ID nhóm/người dùng

### ID nhóm (`chat_id`, định dạng: `oc_xxx`)

Mở nhóm trong Feishu/Lark, nhấp vào biểu tượng menu ở góc trên bên phải, rồi vào **Cài đặt**. ID nhóm (`chat_id`) được liệt kê trên trang cài đặt.

![Lấy ID nhóm](/images/feishu-get-group-id.png)

### ID người dùng (`open_id`, định dạng: `ou_xxx`)

Khởi động Gateway, gửi DM cho bot, rồi kiểm tra nhật ký:

```bash
openclaw logs --follow
```

Tìm `open_id` trong đầu ra nhật ký. Bạn cũng có thể kiểm tra các yêu cầu ghép nối đang chờ:

```bash
openclaw pairing list feishu
```

---

## Lệnh thường dùng

| Lệnh      | Mô tả                         |
| --------- | ----------------------------- |
| `/status` | Hiển thị trạng thái bot       |
| `/reset`  | Đặt lại phiên hiện tại        |
| `/model`  | Hiển thị hoặc đổi mô hình AI  |

<Note>
Feishu/Lark không hỗ trợ menu lệnh gạch chéo gốc, vì vậy hãy gửi các lệnh này dưới dạng tin nhắn văn bản thuần.
</Note>

---

## Khắc phục sự cố

### Bot không phản hồi trong trò chuyện nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @mention bot (mặc định là bắt buộc)
3. Xác minh `groupPolicy` không phải là `"disabled"`
4. Kiểm tra nhật ký: `openclaw logs --follow`

### Bot không nhận được tin nhắn

1. Đảm bảo bot đã được phát hành và phê duyệt trong Feishu Open Platform / Lark Developer
2. Đảm bảo đăng ký sự kiện bao gồm `im.message.receive_v1`
3. Đảm bảo đã chọn **kết nối liên tục** (WebSocket)
4. Đảm bảo đã cấp tất cả phạm vi quyền bắt buộc
5. Đảm bảo Gateway đang chạy: `openclaw gateway status`
6. Kiểm tra nhật ký: `openclaw logs --follow`

### Thiết lập QR không phản hồi trong ứng dụng Feishu trên di động

1. Chạy lại thiết lập: `openclaw channels login --channel feishu`
2. Chọn thiết lập thủ công
3. Trong Feishu Open Platform, tạo ứng dụng tự xây dựng và sao chép App ID cùng App Secret của ứng dụng đó
4. Dán các thông tin xác thực đó vào trình hướng dẫn thiết lập

### App Secret bị lộ

1. Đặt lại App Secret trong Feishu Open Platform / Lark Developer
2. Cập nhật giá trị trong cấu hình của bạn
3. Khởi động lại Gateway: `openclaw gateway restart`

---

## Cấu hình nâng cao

### Nhiều tài khoản

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản nào được dùng khi các API gửi đi không chỉ định `accountId`.
`accounts.<id>.tts` dùng cùng cấu trúc với `messages.tts` và deep-merge đè lên
cấu hình TTS toàn cục, vì vậy các thiết lập Feishu nhiều bot có thể giữ thông tin
xác thực provider dùng chung ở cấp toàn cục trong khi chỉ ghi đè giọng nói, mô hình,
persona hoặc chế độ tự động theo từng tài khoản.

### Giới hạn tin nhắn

- `textChunkLimit` - kích thước đoạn văn bản gửi đi (mặc định: `2000` ký tự)
- `mediaMaxMb` - giới hạn tải lên/tải xuống phương tiện (mặc định: `30` MB)

### Streaming

Feishu/Lark hỗ trợ phản hồi streaming qua thẻ tương tác. Khi được bật, bot cập nhật thẻ theo thời gian thực trong lúc tạo văn bản.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Đặt `streaming: false` để gửi toàn bộ phản hồi trong một tin nhắn. `blockStreaming` mặc định tắt; chỉ bật khi bạn muốn các khối assistant đã hoàn tất được gửi ra trước phản hồi cuối cùng.

### Tối ưu hạn mức

Giảm số lượng lệnh gọi API Feishu/Lark bằng hai cờ tùy chọn:

- `typingIndicator` (mặc định `true`): đặt `false` để bỏ qua các lệnh gọi phản ứng đang nhập
- `resolveSenderNames` (mặc định `true`): đặt `false` để bỏ qua tra cứu hồ sơ người gửi

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Phiên ACP

Feishu/Lark hỗ trợ ACP cho DM và tin nhắn luồng nhóm. ACP của Feishu/Lark được điều khiển bằng lệnh văn bản - không có menu lệnh gạch chéo gốc, vì vậy hãy dùng trực tiếp các tin nhắn `/acp ...` trong cuộc trò chuyện.

#### Liên kết ACP lâu dài

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Spawn ACP từ chat

Trong DM hoặc luồng Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` hoạt động cho DM và tin nhắn luồng Feishu/Lark. Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết sẽ được định tuyến trực tiếp đến phiên ACP đó.

### Định tuyến nhiều agent

Dùng `bindings` để định tuyến DM hoặc nhóm Feishu/Lark đến các agent khác nhau.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Trường định tuyến:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) hoặc `"group"` (trò chuyện nhóm)
- `match.peer.id`: Open ID người dùng (`ou_xxx`) hoặc ID nhóm (`oc_xxx`)

Xem [Lấy ID nhóm/người dùng](#get-groupuser-ids) để biết mẹo tra cứu.

---

## Cô lập agent theo từng người dùng (Tạo agent động)

Bật `dynamicAgentCreation` để tự động tạo **phiên bản agent cô lập** cho từng người dùng DM. Mỗi người dùng có riêng:

- Thư mục workspace độc lập
- `USER.md` / `SOUL.md` / `MEMORY.md` riêng
- Lịch sử cuộc trò chuyện riêng tư
- Skills và trạng thái cô lập

Điều này rất cần thiết cho bot công khai khi bạn muốn mỗi người dùng có trải nghiệm trợ lý AI riêng tư của riêng họ.

<Note>
Các liên kết động bao gồm `accountId` Feishu đã chuẩn hóa, vì vậy tài khoản mặc định và tài khoản được đặt tên định tuyến từng người gửi đến đúng agent động.

Nếu một tài khoản được đặt tên đã tạo agent động không có phạm vi trên bản phát hành cũ hơn, agent cũ đó vẫn được tính vào `maxAgents`. Xác nhận rằng tài khoản mặc định không dùng nó trước khi xóa, hoặc tạm thời tăng `maxAgents`; OpenClaw không thể suy luận an toàn tài khoản nào sở hữu trạng thái cũ mơ hồ.
</Note>

### Thiết lập nhanh

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Cách hoạt động

Khi một người dùng mới gửi DM đầu tiên:

1. Kênh tạo một `agentId` duy nhất: `feishu-{user_open_id}` cho tài khoản mặc định, hoặc một digest danh tính có tiền tố tài khoản và giới hạn độ dài cho tài khoản được đặt tên
2. Tạo workspace mới tại đường dẫn `workspaceTemplate`
3. Đăng ký agent và tạo liên kết cho người dùng này
4. Trình trợ giúp workspace đảm bảo có các tệp bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md`, v.v.) trong lần truy cập đầu tiên
5. Định tuyến tất cả tin nhắn trong tương lai từ người dùng này đến agent chuyên dụng của họ

### Tùy chọn cấu hình

| Cài đặt                                                  | Mô tả                                      | Mặc định                             |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Bật tạo agent tự động theo từng người dùng | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Mẫu đường dẫn cho workspace agent động     | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Mẫu tên thư mục agent                      | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Số lượng agent động tối đa cần tạo         | không giới hạn                       |

Biến mẫu:

- `{agentId}` - ID agent được tạo (ví dụ: `feishu-ou_xxxxxx` hoặc `feishu-support-<identity_digest>`)
- `{userId}` - open_id Feishu của người gửi (ví dụ: `ou_xxxxxx`)

### Phạm vi phiên

`session.dmScope` kiểm soát cách tin nhắn trực tiếp được ánh xạ tới phiên agent. Đây là một **cài đặt toàn cục** ảnh hưởng đến tất cả các kênh.

| Giá trị                      | Hành vi                                                           | Phù hợp nhất cho                                                         |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `"main"`                     | DM của mỗi người dùng ánh xạ tới phiên chính của agent của họ     | Bot một người dùng khi bạn muốn `USER.md` / `SOUL.md` tự động tải        |
| `"per-channel-peer"`         | Mỗi tổ hợp (kênh + người dùng) có một phiên riêng                 | Bot công khai nhiều người dùng cần cách ly mạnh hơn                      |
| `"per-account-channel-peer"` | Mỗi tổ hợp (tài khoản + kênh + người dùng) có một phiên riêng     | Bot nhiều tài khoản cần cách ly phiên ở cấp tài khoản                    |

**Đánh đổi**: Dùng `"main"` cho phép tự động tải tệp bootstrap (`USER.md`, `SOUL.md`, `MEMORY.md`), nhưng nghĩa là mọi DM trên tất cả kênh dùng chung cùng mẫu khóa phiên. Với bot công khai nhiều người dùng, nơi cách ly quan trọng hơn tự động tải bootstrap, hãy cân nhắc `"per-channel-peer"` và quản lý tệp bootstrap thủ công.

<Note>
Dùng `"per-account-channel-peer"` khi các tài khoản Feishu có tên cần giữ phiên riêng cho cùng một người gửi. Liên kết động giữ nguyên phạm vi tài khoản.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Triển khai nhiều người dùng điển hình

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Xác minh

Kiểm tra nhật ký gateway để xác nhận tạo động đang hoạt động:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Liệt kê tất cả workspace đã tạo:

```bash
ls -la ~/.openclaw/workspace-*
```

### Ghi chú

- **Cách ly workspace**: Mỗi người dùng có thư mục workspace và phiên bản agent riêng. Người dùng không thể xem lịch sử hội thoại hoặc tệp của nhau trong luồng nhắn tin thông thường.
- **Ranh giới bảo mật**: Đây là cơ chế cách ly ngữ cảnh nhắn tin, không phải ranh giới bảo mật giữa các đồng thuê đối địch. Tiến trình agent và môi trường máy chủ được dùng chung.
- **`bindings` nên để trống**: Agent động tự động đăng ký liên kết riêng của chúng
- **Lộ trình nâng cấp**: Các liên kết thủ công hiện có tiếp tục hoạt động cùng với agent động
- **`session.dmScope` là toàn cục**: Điều này ảnh hưởng đến tất cả các kênh, không chỉ Feishu

---

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình Gateway](/vi/gateway/configuration)

| Cài đặt                                                  | Mô tả                                                                                       | Mặc định                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Bật/tắt kênh                                                                                | `true`                               |
| `channels.feishu.domain`                                 | Miền API (`feishu` hoặc `lark`)                                                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Truyền tải sự kiện (`websocket` hoặc `webhook`)                                             | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Tài khoản mặc định cho định tuyến gửi đi                                                    | `default`                            |
| `channels.feishu.verificationToken`                      | Bắt buộc cho chế độ webhook                                                                 | -                                    |
| `channels.feishu.encryptKey`                             | Bắt buộc cho chế độ webhook                                                                 | -                                    |
| `channels.feishu.webhookPath`                            | Đường dẫn route Webhook                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Máy chủ bind Webhook                                                                        | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Cổng bind Webhook                                                                           | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID ứng dụng                                                                                 | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Secret ứng dụng                                                                             | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Ghi đè miền theo từng tài khoản                                                             | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Ghi đè TTS theo từng tài khoản                                                              | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Chính sách DM                                                                               | `pairing`                            |
| `channels.feishu.allowFrom`                              | Danh sách cho phép DM (danh sách open_id)                                                   | -                                    |
| `channels.feishu.groupPolicy`                            | Chính sách nhóm                                                                             | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Danh sách cho phép nhóm                                                                     | -                                    |
| `channels.feishu.requireMention`                         | Yêu cầu @mention trong nhóm                                                                 | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Ghi đè @mention theo từng nhóm; ID tường minh cũng cho phép nhóm ở chế độ danh sách cho phép | kế thừa                              |
| `channels.feishu.groups.<chat_id>.enabled`               | Bật/tắt một nhóm cụ thể                                                                     | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Bật tạo agent tự động theo từng người dùng                                                  | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Mẫu đường dẫn cho workspace agent động                                                      | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Mẫu tên thư mục agent                                                                       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Số lượng agent động tối đa cần tạo                                                          | không giới hạn                       |
| `channels.feishu.textChunkLimit`                         | Kích thước đoạn tin nhắn                                                                    | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Giới hạn kích thước media                                                                   | `30`                                 |
| `channels.feishu.streaming`                              | Đầu ra thẻ streaming                                                                        | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming phản hồi theo khối đã hoàn tất                                                    | `false`                              |
| `channels.feishu.typingIndicator`                        | Gửi phản ứng đang nhập                                                                      | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Phân giải tên hiển thị của người gửi                                                        | `true`                               |
| `channels.feishu.tools.bitable`                          | Bật công cụ Bitable/Base                                                                    | `true`                               |
| `channels.feishu.tools.base`                             | Bí danh cho `channels.feishu.tools.bitable`; `bitable` tường minh được ưu tiên khi đặt cả hai | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Cổng công cụ Bitable/Base theo từng tài khoản                                               | kế thừa                              |
| `channels.feishu.accounts.<id>.tools.base`               | Bí danh theo từng tài khoản cho `tools.bitable`                                             | kế thừa                              |

---

## Loại tin nhắn được hỗ trợ

### Nhận

- ✅ Văn bản
- ✅ Văn bản giàu định dạng (bài đăng)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/media
- ✅ Nhãn dán

Tin nhắn âm thanh Feishu/Lark gửi đến được chuẩn hóa thành phần giữ chỗ media thay vì JSON `file_key` thô. Khi `tools.media.audio` được cấu hình, OpenClaw tải xuống tài nguyên ghi chú thoại và chạy phiên âm âm thanh dùng chung trước lượt agent, để agent nhận được bản chép lời nội dung nói. Nếu Feishu đưa văn bản chép lời trực tiếp vào payload âm thanh, văn bản đó được dùng mà không cần thêm lệnh gọi ASR nào khác. Khi không có nhà cung cấp phiên âm âm thanh, agent vẫn nhận được phần giữ chỗ `<media:audio>` cộng với tệp đính kèm đã lưu, không phải payload tài nguyên Feishu thô.

### Gửi

- ✅ Văn bản
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Thẻ tương tác (bao gồm cập nhật phát trực tuyến)
- ⚠️ Văn bản định dạng phong phú (định dạng kiểu bài đăng; không hỗ trợ đầy đủ các khả năng soạn thảo của Feishu/Lark)

Bong bóng âm thanh gốc của Feishu/Lark sử dụng kiểu tin nhắn `audio` của Feishu và yêu cầu
phương tiện tải lên Ogg/Opus (`file_type: "opus"`). Phương tiện `.opus` và `.ogg` hiện có
được gửi trực tiếp dưới dạng âm thanh gốc. MP3/WAV/M4A và các định dạng có khả năng là âm thanh khác
được chuyển mã sang Ogg/Opus 48kHz bằng `ffmpeg` chỉ khi phản hồi yêu cầu gửi dưới dạng giọng nói
(`audioAsVoice` / công cụ tin nhắn `asVoice`, bao gồm phản hồi ghi chú thoại TTS).
Tệp đính kèm MP3 thông thường vẫn là tệp thông thường. Nếu thiếu `ffmpeg` hoặc
chuyển đổi thất bại, OpenClaw sẽ chuyển sang dùng tệp đính kèm và ghi nhật ký lý do.

### Luồng và phản hồi

- ✅ Phản hồi nội dòng
- ✅ Phản hồi trong luồng
- ✅ Phản hồi phương tiện vẫn nhận biết luồng khi trả lời một tin nhắn trong luồng

Đối với `groupSessionScope: "group_topic"` và `"group_topic_sender"`, các nhóm chủ đề
gốc của Feishu/Lark sử dụng `thread_id` (`omt_*`) của sự kiện làm khóa phiên chủ đề
chuẩn. Nếu sự kiện khởi tạo chủ đề gốc bỏ qua `thread_id`, OpenClaw
sẽ lấy bổ sung từ Feishu trước khi định tuyến lượt. Các phản hồi nhóm thông thường mà
OpenClaw chuyển thành luồng vẫn dùng ID tin nhắn gốc của phản hồi (`om_*`) để
lượt đầu tiên và lượt tiếp theo vẫn nằm trong cùng một phiên.

---

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - luồng ghép nối và xác thực DM
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cổng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
