---
read_when:
    - Bạn muốn kết nối bot Feishu/Lark
    - Bạn đang cấu hình kênh Feishu
summary: Tổng quan, tính năng và cấu hình bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T14:00:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw kết nối với Feishu/Lark (nền tảng cộng tác tất cả trong một) thông qua plugin `@openclaw/feishu` chính thức: tin nhắn trực tiếp với bot, trò chuyện nhóm, phản hồi thẻ dạng luồng và các công cụ tài liệu/wiki/ổ đĩa/Bitable của Feishu.

**Trạng thái:** sẵn sàng cho môi trường production đối với tin nhắn trực tiếp với bot + trò chuyện nhóm. WebSocket là phương thức truyền sự kiện mặc định (không cần URL công khai); chế độ webhook là tùy chọn.

## Bắt đầu nhanh

<Note>
Yêu cầu OpenClaw 2026.5.29 trở lên. Chạy `openclaw --version` để kiểm tra. Nâng cấp bằng `openclaw update`.
</Note>

<Steps>
  <Step title="Chạy trình hướng dẫn thiết lập kênh">
  ```bash
  openclaw channels login --channel feishu
  ```
  Thao tác này sẽ cài đặt plugin `@openclaw/feishu` nếu chưa có, sau đó hướng dẫn thiết lập:

- **Thiết lập thủ công**: dán App ID và App Secret từ Feishu Open Platform (`https://open.feishu.cn`) hoặc Lark Developer (`https://open.larksuite.com`).
- **Thiết lập bằng QR**: quét mã QR trong ứng dụng Feishu để tự động tạo bot. Quy trình này giới hạn tin nhắn trực tiếp vào tài khoản của chính bạn (`dmPolicy: "allowlist"` với `open_id` của bạn).

Trình hướng dẫn cũng yêu cầu miền API (Feishu hoặc Lark) và chính sách nhóm. Nếu ứng dụng Feishu dành cho thị trường nội địa trên thiết bị di động không phản hồi với mã QR, hãy chạy lại quy trình thiết lập và chọn thiết lập thủ công.
</Step>

  <Step title="Sau khi hoàn tất thiết lập, hãy khởi động lại Gateway để áp dụng các thay đổi">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Kiểm soát quyền truy cập

### Tin nhắn trực tiếp

Cấu hình `channels.feishu.dmPolicy` (mặc định: `pairing`) để kiểm soát những ai có thể gửi tin nhắn trực tiếp cho bot:

| Giá trị         | Hành vi                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Người dùng không xác định nhận được mã ghép nối; phê duyệt qua CLI                                                         |
| `"allowlist"` | Chỉ người dùng được liệt kê trong `allowFrom` mới có thể trò chuyện                                                                     |
| `"open"`      | Tin nhắn trực tiếp công khai; quá trình xác thực cấu hình yêu cầu `allowFrom` phải bao gồm `"*"`. Các mục không phải ký tự đại diện vẫn thu hẹp quyền truy cập |

**Phê duyệt yêu cầu ghép nối:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Trò chuyện nhóm

**Chính sách nhóm** (`channels.feishu.groupPolicy`, mặc định: `allowlist`):

| Giá trị         | Hành vi                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Phản hồi tất cả tin nhắn trong các nhóm                                                            |
| `"allowlist"` | Chỉ phản hồi các nhóm trong `groupAllowFrom` hoặc được cấu hình rõ ràng trong `groups.<chat_id>` |
| `"disabled"`  | Tắt tất cả tin nhắn nhóm; các mục `groups.<chat_id>` được khai báo rõ ràng không ghi đè thiết lập này         |

**Yêu cầu nhắc đến** (`channels.feishu.requireMention`):

- Mặc định: bắt buộc @nhắc đến, trừ khi chính sách nhóm có hiệu lực là `"open"`; trong trường hợp đó, giá trị mặc định là `false` để các tin nhắn không thể chứa lượt nhắc đến (ví dụ: hình ảnh) vẫn đến được tác nhân.
- Đặt rõ ràng `true` hoặc `false` để ghi đè; ghi đè theo từng nhóm: `channels.feishu.groups.<chat_id>.requireMention`.
- `@all` và `@_all` chỉ dành cho phát sóng không được coi là lượt nhắc đến bot. Tin nhắn nhắc đến cả `@all` và trực tiếp nhắc đến bot vẫn được tính là lượt nhắc đến bot.

## Ví dụ cấu hình nhóm

### Cho phép tất cả các nhóm, không yêu cầu @nhắc đến

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### Cho phép tất cả các nhóm, vẫn yêu cầu @nhắc đến

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

Trong chế độ `allowlist`, bạn cũng có thể cho phép một nhóm bằng cách thêm một mục `groups.<chat_id>` rõ ràng. Các mục rõ ràng không ghi đè `groupPolicy: "disabled"`. Các giá trị mặc định dùng ký tự đại diện trong `groups.*` cấu hình các nhóm khớp, nhưng bản thân chúng không cho phép nhóm tham gia.

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

### Hạn chế người gửi trong một nhóm

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

`channels.feishu.groupSenderAllowFrom` thiết lập cùng một danh sách người gửi được phép cho tất cả các nhóm; `allowFrom` theo từng nhóm được ưu tiên.

<a id="get-groupuser-ids"></a>

## Lấy ID nhóm/người dùng

### ID nhóm (`chat_id`, định dạng: `oc_xxx`)

Mở nhóm trong Feishu/Lark, nhấp vào biểu tượng menu ở góc trên bên phải và chuyển đến **Settings**. ID nhóm (`chat_id`) được liệt kê trên trang cài đặt.

![Lấy ID nhóm](/images/feishu-get-group-id.png)

### ID người dùng (`open_id`, định dạng: `ou_xxx`)

Khởi động Gateway, gửi tin nhắn trực tiếp cho bot, sau đó kiểm tra nhật ký:

```bash
openclaw logs --follow
```

Tìm `open_id` trong đầu ra nhật ký. Bạn cũng có thể kiểm tra các yêu cầu ghép nối đang chờ xử lý:

```bash
openclaw pairing list feishu
```

## Các lệnh thường dùng

| Lệnh   | Mô tả                 |
| --------- | --------------------------- |
| `/status` | Hiển thị trạng thái bot             |
| `/reset`  | Đặt lại phiên hiện tại   |
| `/model`  | Hiển thị hoặc chuyển đổi mô hình AI |

<Note>
Feishu/Lark không hỗ trợ menu lệnh gạch chéo gốc, vì vậy hãy gửi các lệnh này dưới dạng tin nhắn văn bản thuần túy.
</Note>

## Khắc phục sự cố

### Bot không phản hồi trong trò chuyện nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @nhắc đến bot (bắt buộc theo mặc định)
3. Xác minh `groupPolicy` không phải là `"disabled"`
4. Kiểm tra nhật ký: `openclaw logs --follow`

### Bot không nhận được tin nhắn

1. Đảm bảo bot đã được phát hành và phê duyệt trong Feishu Open Platform / Lark Developer
2. Đảm bảo đăng ký sự kiện bao gồm `im.message.receive_v1`
3. Đảm bảo đã chọn **persistent connection** (WebSocket)
4. Đảm bảo tất cả các phạm vi quyền bắt buộc đã được cấp
5. Đảm bảo Gateway đang chạy: `openclaw gateway status`
6. Kiểm tra nhật ký: `openclaw logs --follow`

### Thiết lập bằng QR không phản hồi trong ứng dụng Feishu trên thiết bị di động

1. Chạy lại quy trình thiết lập: `openclaw channels login --channel feishu`
2. Chọn thiết lập thủ công
3. Trong Feishu Open Platform, tạo một ứng dụng tự xây dựng rồi sao chép App ID và App Secret của ứng dụng đó
4. Dán các thông tin xác thực đó vào trình hướng dẫn thiết lập

### App Secret bị lộ

1. Đặt lại App Secret trong Feishu Open Platform / Lark Developer
2. Cập nhật giá trị trong cấu hình của bạn
3. Khởi động lại Gateway: `openclaw gateway restart`

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

`defaultAccount` kiểm soát tài khoản được sử dụng khi API gửi đi không chỉ định `accountId`. Các mục tài khoản kế thừa thiết lập cấp cao nhất; hầu hết khóa cấp cao nhất có thể được ghi đè theo từng tài khoản.
`accounts.<id>.tts` sử dụng cùng cấu trúc với `messages.tts` và được hợp nhất sâu trên cấu hình TTS toàn cục, vì vậy các thiết lập Feishu nhiều bot có thể lưu thông tin xác thực dùng chung của nhà cung cấp ở cấp toàn cục, đồng thời chỉ ghi đè giọng nói, mô hình, vai trò hoặc chế độ tự động theo từng tài khoản.

### Giới hạn tin nhắn

- `textChunkLimit` - kích thước đoạn văn bản gửi đi (mặc định: `4000` ký tự)
- `streaming.chunkMode` - `"length"` (mặc định) chia tại giới hạn; `"newline"` ưu tiên ranh giới dòng mới
- `mediaMaxMb` - giới hạn tải lên/tải xuống nội dung đa phương tiện (mặc định: `30` MB)

### Truyền phát

Feishu/Lark hỗ trợ phản hồi dạng luồng thông qua thẻ tương tác (API truyền phát Card Kit). Khi được bật, bot cập nhật thẻ theo thời gian thực trong khi tạo văn bản.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

Đặt `streaming.mode: "off"` để gửi toàn bộ phản hồi trong một tin nhắn; `renderMode: "raw"` (văn bản thuần túy thay vì thẻ) cũng tắt thẻ truyền phát. `streaming.block.enabled` mặc định bị tắt; chỉ bật khi muốn các khối trợ lý đã hoàn tất được gửi ra trước phản hồi cuối cùng. Giá trị boolean cũ `streaming` và các khóa phẳng `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` được di chuyển sang cấu trúc lồng nhau này thông qua `openclaw doctor --fix`.

### Tối ưu hóa hạn mức

Giảm số lượng lệnh gọi API Feishu/Lark bằng hai cờ tùy chọn:

- `typingIndicator` (mặc định `true`): đặt `false` để bỏ qua các lệnh gọi phản ứng đang nhập
- `resolveSenderNames` (mặc định `true`): đặt `false` để bỏ qua việc tra cứu hồ sơ người gửi

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

### Phạm vi phiên nhóm và luồng chủ đề

`channels.feishu.groupSessionScope` (cấp cao nhất, theo từng tài khoản hoặc theo từng nhóm) kiểm soát cách tin nhắn nhóm ánh xạ tới các phiên của tác nhân:

| Giá trị                  | Phiên                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (mặc định)    | Một phiên cho mỗi cuộc trò chuyện nhóm                                       |
| `"group_sender"`       | Một phiên cho mỗi (nhóm + người gửi)                                 |
| `"group_topic"`        | Một phiên cho mỗi luồng chủ đề; dự phòng về phiên nhóm    |
| `"group_topic_sender"` | Một phiên cho mỗi (chủ đề + người gửi); dự phòng về (nhóm + người gửi) |

Đối với các phạm vi chủ đề, nhóm chủ đề gốc của Feishu/Lark sử dụng sự kiện `thread_id` (`omt_*`) làm khóa phiên chủ đề chuẩn. Nếu sự kiện bắt đầu chủ đề gốc thiếu `thread_id`, OpenClaw sẽ lấy dữ liệu này từ Feishu trước khi định tuyến lượt tương tác. Các phản hồi nhóm thông thường mà OpenClaw chuyển thành luồng tiếp tục sử dụng ID tin nhắn gốc của phản hồi (`om_*`) để lượt đầu tiên và các lượt tiếp theo vẫn nằm trong cùng một phiên.

Đặt `replyInThread: "enabled"` (cấp cao nhất hoặc theo từng nhóm) để các phản hồi của bot tạo hoặc tiếp tục một luồng chủ đề Feishu thay vì phản hồi trực tiếp trong dòng. `topicSessionMode` là phiên bản tiền nhiệm đã lỗi thời của `groupSessionScope`; nên dùng `groupSessionScope`.

### Công cụ không gian làm việc Feishu

Plugin cung cấp các công cụ tác nhân cho tài liệu, cuộc trò chuyện, cơ sở tri thức, bộ nhớ đám mây, quyền và Bitable của Feishu, cùng các Skills tương ứng (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Các nhóm công cụ được kiểm soát bởi `channels.feishu.tools`:

| Khóa             | Công cụ                                         | Mặc định             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Thao tác tài liệu `feishu_doc`              | `true`              |
| `tools.chat`    | Thông tin trò chuyện + truy vấn thành viên `feishu_chat`      | `true`              |
| `tools.wiki`    | Cơ sở tri thức `feishu_wiki` (yêu cầu `doc`) | `true`              |
| `tools.drive`   | Lưu trữ đám mây `feishu_drive`                  | `true`              |
| `tools.perm`    | Quản lý quyền `feishu_perm`           | `false` (nhạy cảm) |
| `tools.scopes`  | Chẩn đoán phạm vi ứng dụng `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Thao tác Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` là bí danh của `tools.bitable`; giá trị `bitable` được chỉ định rõ ràng sẽ được ưu tiên khi cả hai đều được đặt. Các cổng kiểm soát theo tài khoản nằm trong `accounts.<id>.tools`.

Cấp `drive:drive.metadata:readonly` để tra cứu trực tiếp `feishu_drive info` bên ngoài thư mục
gốc, trừ khi ứng dụng đã có phạm vi `drive:drive` đầy đủ. Nếu không có một trong hai phạm vi, `info`
vẫn duy trì khả năng tra cứu thư mục gốc kiểu cũ thông qua `drive:drive:readonly`.

### Phiên ACP

Feishu/Lark hỗ trợ ACP cho tin nhắn trực tiếp và tin nhắn trong luồng nhóm. ACP của Feishu/Lark được điều khiển bằng lệnh văn bản — không có menu lệnh gạch chéo gốc, vì vậy hãy sử dụng trực tiếp tin nhắn `/acp ...` trong cuộc trò chuyện.

#### Liên kết ACP cố định

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

#### Khởi tạo ACP từ cuộc trò chuyện

Trong tin nhắn trực tiếp hoặc luồng Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` hoạt động với tin nhắn trực tiếp và tin nhắn trong luồng Feishu/Lark. Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết sẽ được định tuyến trực tiếp đến phiên ACP đó.

### Định tuyến đa tác tử

Sử dụng `bindings` để định tuyến tin nhắn trực tiếp hoặc nhóm Feishu/Lark đến các tác tử khác nhau.

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

Các trường định tuyến:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (tin nhắn trực tiếp) hoặc `"group"` (trò chuyện nhóm)
- `match.peer.id`: Open ID của người dùng (`ou_xxx`) hoặc ID nhóm (`oc_xxx`)

Xem [Lấy ID nhóm/người dùng](#get-groupuser-ids) để biết các mẹo tra cứu.

## Cách ly tác tử theo người dùng (Tạo tác tử động)

Bật `dynamicAgentCreation` để tự động tạo **các phiên bản tác tử biệt lập** cho từng người dùng tin nhắn trực tiếp. Mỗi người dùng có riêng:

- Thư mục không gian làm việc độc lập
- `USER.md` / `SOUL.md` / `MEMORY.md` riêng biệt
- Lịch sử trò chuyện riêng tư
- Skills và trạng thái biệt lập

Điều này rất cần thiết đối với bot công khai khi bạn muốn mỗi người dùng có trải nghiệm trợ lý AI riêng tư của riêng họ.

<Note>
Các liên kết động bao gồm `accountId` Feishu đã chuẩn hóa, vì vậy tài khoản mặc định và tài khoản có tên sẽ định tuyến từng người gửi đến đúng tác tử động.

Nếu một tài khoản có tên đã tạo một tác tử động không có phạm vi trên bản phát hành cũ hơn, tác tử cũ đó vẫn được tính vào `maxAgents`. Hãy xác nhận rằng tài khoản mặc định không sử dụng tác tử đó trước khi xóa, hoặc tạm thời tăng `maxAgents`; OpenClaw không thể suy luận an toàn tài khoản nào sở hữu trạng thái cũ không rõ ràng.
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
    // Quan trọng: biến tin nhắn trực tiếp của mỗi người dùng thành "phiên chính" của họ
    // Tự động tải USER.md / SOUL.md / MEMORY.md
    // Để cách ly mạnh hơn, hãy sử dụng "per-channel-peer" thay thế
    dmScope: "main",
  },
}
```

### Cách hoạt động

Khi người dùng mới gửi tin nhắn trực tiếp đầu tiên:

1. Kênh tạo một `agentId` duy nhất: `feishu-{user_open_id}` cho tài khoản mặc định, hoặc một bản tóm lược danh tính có giới hạn với tiền tố tài khoản cho tài khoản có tên
2. Tạo không gian làm việc mới tại đường dẫn `workspaceTemplate`
3. Đăng ký tác tử và tạo liên kết cho người dùng này
4. Trình trợ giúp không gian làm việc bảo đảm các tệp khởi tạo (`AGENTS.md`, `SOUL.md`, `USER.md`, v.v.) trong lần truy cập đầu tiên
5. Định tuyến tất cả tin nhắn trong tương lai từ người dùng này đến tác tử chuyên dụng của họ

### Tùy chọn cấu hình

| Cài đặt                                                  | Mô tả                                | Mặc định                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Bật tự động tạo tác tử theo người dùng   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Mẫu đường dẫn cho không gian làm việc của tác tử động | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Mẫu tên thư mục tác tử              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Số lượng tác tử động tối đa được tạo | không giới hạn                            |

Các biến mẫu:

- `{agentId}` - ID tác tử được tạo (ví dụ: `feishu-ou_xxxxxx` hoặc `feishu-support-<identity_digest>`)
- `{userId}` - open_id Feishu của người gửi (ví dụ: `ou_xxxxxx`)

### Phạm vi phiên

`session.dmScope` kiểm soát cách ánh xạ tin nhắn trực tiếp đến các phiên tác tử. Đây là **cài đặt toàn cục** ảnh hưởng đến tất cả các kênh.

| Giá trị                        | Hành vi                                                            | Phù hợp nhất cho                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Tin nhắn trực tiếp của mỗi người dùng ánh xạ đến phiên chính của tác tử của họ                   | Bot một người dùng khi bạn muốn `USER.md` / `SOUL.md` tự động tải |
| `"per-peer"`                 | Mỗi đối tác nhận một phiên riêng biệt (bất kể kênh)           | Cách ly chỉ dựa trên danh tính người gửi                            |
| `"per-channel-peer"`         | Mỗi tổ hợp (kênh + người dùng) nhận một phiên riêng biệt           | Bot công khai nhiều người dùng cần cách ly mạnh hơn                  |
| `"per-account-channel-peer"` | Mỗi tổ hợp (tài khoản + kênh + người dùng) nhận một phiên riêng biệt | Bot nhiều tài khoản cần cách ly phiên ở cấp tài khoản         |

**Đánh đổi**: Sử dụng `"main"` cho phép tự động tải tệp khởi tạo (`USER.md`, `SOUL.md`, `MEMORY.md`), nhưng đồng nghĩa tất cả tin nhắn trực tiếp trên mọi kênh dùng chung cùng một mẫu khóa phiên. Đối với bot công khai nhiều người dùng, nơi việc cách ly quan trọng hơn khả năng tự động tải tệp khởi tạo, hãy cân nhắc `"per-channel-peer"` và quản lý các tệp khởi tạo theo cách thủ công.

<Note>
Sử dụng `"per-account-channel-peer"` khi các tài khoản Feishu có tên cần duy trì phiên riêng biệt cho cùng một người gửi. Các liên kết động bảo toàn phạm vi tài khoản.
</Note>

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
    // Chọn dmScope dựa trên nhu cầu cách ly của bạn:
    // "main" để tự động tải khởi tạo, "per-channel-peer" để cách ly mạnh hơn
    dmScope: "main",
  },
  bindings: [], // Trống - tác tử động tự động liên kết
}
```

### Xác minh

Kiểm tra nhật ký Gateway để xác nhận việc tạo động đang hoạt động:

```text
feishu: đang tạo tác tử động "feishu-ou_xxxxxx" cho người dùng ou_xxxxxx
  không gian làm việc: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  thư mục tác tử: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Liệt kê tất cả không gian làm việc đã tạo:

```bash
ls -la ~/.openclaw/workspace-*
```

### Ghi chú

- **Cách ly không gian làm việc**: Mỗi người dùng có thư mục không gian làm việc và phiên bản tác tử riêng. Trong luồng nhắn tin thông thường, người dùng không thể xem lịch sử trò chuyện hoặc tệp của nhau.
- **Ranh giới bảo mật**: Đây là cơ chế cách ly ngữ cảnh nhắn tin, không phải ranh giới bảo mật giữa các đối tượng cùng thuê có tính thù địch. Tiến trình tác tử và môi trường máy chủ được dùng chung.
- **Phải duy trì bật chức năng ghi cấu hình**: Việc tạo tác tử động ghi các tác tử và liên kết vào cấu hình; quá trình này bị bỏ qua khi `channels.feishu.configWrites` là `false` (mặc định: bật).
- **`bindings` nên để trống**: Các tác tử động tự động đăng ký liên kết riêng
- **Lộ trình nâng cấp**: Các liên kết thủ công hiện có tiếp tục hoạt động song song với tác tử động
- **`session.dmScope` là toàn cục**: Điều này ảnh hưởng đến tất cả các kênh, không chỉ Feishu

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình Gateway](/vi/gateway/configuration)

| Cài đặt                                                  | Mô tả                                                                          | Mặc định                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Bật/tắt kênh                                                           | `true`                               |
| `channels.feishu.domain`                                 | Miền API (`feishu`, `lark` hoặc URL cơ sở `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Phương thức truyền sự kiện (`websocket` hoặc `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Tài khoản mặc định để định tuyến gửi đi                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | Bắt buộc đối với chế độ webhook                                                            | -                                    |
| `channels.feishu.encryptKey`                             | Bắt buộc đối với chế độ webhook                                                            | -                                    |
| `channels.feishu.webhookPath`                            | Đường dẫn định tuyến webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Máy chủ liên kết webhook                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Cổng liên kết webhook                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID ứng dụng                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Khóa bí mật ứng dụng                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Ghi đè miền theo từng tài khoản                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Ghi đè TTS theo từng tài khoản                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Chính sách tin nhắn trực tiếp (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Danh sách cho phép tin nhắn trực tiếp (danh sách open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | Chính sách nhóm (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Danh sách nhóm được phép                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Danh sách người gửi được phép áp dụng cho tất cả nhóm                                               | -                                    |
| `channels.feishu.requireMention`                         | Yêu cầu @mention trong nhóm                                                           | `true` (`false` khi chính sách là `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Ghi đè @mention theo từng nhóm; ID được chỉ định rõ cũng cho phép nhóm trong chế độ danh sách cho phép     | kế thừa                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Bật/tắt một nhóm cụ thể                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Danh sách người gửi được phép theo từng nhóm (ghi đè `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Ánh xạ phiên nhóm (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Phản hồi của bot tạo/tiếp tục luồng chủ đề (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Sự kiện phản ứng gửi đến (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Bật tự động tạo agent theo từng người dùng                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Mẫu đường dẫn cho không gian làm việc động của agent                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Mẫu tên thư mục agent                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Số agent động tối đa được tạo                                           | không giới hạn                            |
| `channels.feishu.textChunkLimit`                         | Kích thước đoạn tin nhắn                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Cách chia đoạn (`length` hoặc `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Giới hạn kích thước phương tiện                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | Cách hiển thị phản hồi (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Đầu ra thẻ dạng luồng (`partial` hoặc `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Truyền phản hồi theo khối đã hoàn tất                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | Gửi phản ứng đang nhập                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Phân giải tên hiển thị của người gửi                                                         | `true`                               |
| `channels.feishu.configWrites`                           | Cho phép kênh khởi tạo thao tác ghi cấu hình (cần thiết cho agent động)                     | `true`                               |
| `channels.feishu.tools.doc`                              | Bật công cụ tài liệu                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | Bật công cụ thông tin trò chuyện                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | Bật công cụ cơ sở tri thức (yêu cầu `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Bật công cụ lưu trữ đám mây                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | Bật công cụ quản lý quyền                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | Bật công cụ chẩn đoán phạm vi ứng dụng                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Bật công cụ Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | Bí danh của `channels.feishu.tools.bitable`; `bitable` được chỉ định rõ sẽ được ưu tiên khi cả hai đều được đặt     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Cổng bật/tắt công cụ Bitable/Base theo từng tài khoản                                                   | kế thừa                            |
| `channels.feishu.accounts.<id>.tools.base`               | Bí danh theo từng tài khoản của `tools.bitable`                                                | kế thừa                            |

## Các loại tin nhắn được hỗ trợ

### Nhận

- ✅ Văn bản
- ✅ Văn bản đa dạng thức (bài đăng)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Nhãn dán

Tin nhắn âm thanh Feishu/Lark gửi đến được chuẩn hóa thành phần giữ chỗ phương tiện thay vì
JSON `file_key` thô. Khi `tools.media.audio` được cấu hình, OpenClaw
tải tài nguyên ghi chú thoại xuống và chạy quy trình phiên âm dùng chung trước lượt
của agent, để agent nhận được bản chép lời nội dung nói. Nếu Feishu đưa
văn bản chép lời trực tiếp vào tải trọng âm thanh, văn bản đó được sử dụng mà không cần
gọi ASR lần nữa. Khi không có nhà cung cấp phiên âm âm thanh, agent vẫn nhận được
phần giữ chỗ `<media:audio>` cùng với tệp đính kèm đã lưu, chứ không phải tải trọng
tài nguyên Feishu thô.

### Gửi

- ✅ Văn bản
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Thẻ tương tác (bao gồm cập nhật dạng luồng)
- ⚠️ Văn bản đa dạng thức (định dạng kiểu bài đăng; không hỗ trợ đầy đủ khả năng soạn thảo của Feishu/Lark)

Bong bóng âm thanh Feishu/Lark gốc sử dụng loại tin nhắn `audio` của Feishu và yêu cầu
phương tiện tải lên Ogg/Opus (`file_type: "opus"`). Phương tiện `.opus` và `.ogg` hiện có
được gửi trực tiếp dưới dạng âm thanh gốc. MP3/WAV/M4A và các định dạng có khả năng là âm thanh khác
chỉ được chuyển mã thành Ogg/Opus 48kHz bằng `ffmpeg` khi phản hồi yêu cầu gửi bằng giọng nói
(`audioAsVoice` / công cụ tin nhắn `asVoice`, bao gồm phản hồi ghi chú thoại
TTS). Tệp đính kèm MP3 thông thường vẫn là tệp thông thường. Nếu thiếu `ffmpeg` hoặc
chuyển đổi thất bại, OpenClaw chuyển sang tệp đính kèm và ghi lại lý do.

### Luồng và phản hồi

- ✅ Phản hồi nội tuyến
- ✅ Phản hồi trong luồng
- ✅ Phản hồi phương tiện vẫn nhận biết luồng khi trả lời một tin nhắn trong luồng

Định tuyến phiên nhóm chủ đề được trình bày trong
[Phạm vi phiên nhóm và luồng chủ đề](#group-session-scope-and-topic-threads).

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát bằng lượt nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố bảo mật
