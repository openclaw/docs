---
read_when:
    - Bạn muốn kết nối bot Yuanbao
    - Bạn đang cấu hình kênh Yuanbao
summary: Tổng quan, tính năng và cấu hình bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T07:46:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao là nền tảng trợ lý AI của Tencent. Plugin `openclaw-plugin-yuanbao` do cộng đồng duy trì kết nối bot Yuanbao với OpenClaw qua WebSocket để nhắn tin trực tiếp và trò chuyện nhóm.

**Trạng thái:** sẵn sàng cho môi trường sản xuất đối với tin nhắn trực tiếp cho bot và trò chuyện nhóm. WebSocket là chế độ kết nối duy nhất được hỗ trợ. Plugin này do nhóm Tencent Yuanbao duy trì dưới dạng một mục danh mục bên ngoài, không phải bởi phần lõi OpenClaw; các chi tiết về cấu hình/hành vi bên dưới (ngoài phần cài đặt và giao diện CLI chung) đến từ tài liệu riêng của plugin và chưa được xác minh dựa trên mã nguồn lõi OpenClaw.

## Bắt đầu nhanh

Yêu cầu OpenClaw 2026.4.10 trở lên. Kiểm tra bằng `openclaw --version`; nâng cấp bằng `openclaw update`.

<Steps>
  <Step title="Thêm kênh Yuanbao bằng thông tin xác thực của bạn">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` sử dụng `appKey:appSecret` được phân tách bằng dấu hai chấm. Lấy các giá trị này từ ứng dụng Yuanbao bằng cách tạo bot trong phần cài đặt ứng dụng của bạn.
  </Step>

  <Step title="Khởi động lại Gateway để áp dụng thay đổi">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Thiết lập tương tác (phương án thay thế)

```bash
openclaw channels login --channel yuanbao
```

Làm theo lời nhắc để nhập App ID và App Secret.

## Kiểm soát truy cập

### Tin nhắn trực tiếp

`channels.yuanbao.dm.policy`:

| Giá trị          | Hành vi                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `open` (mặc định) | Cho phép tất cả người dùng                                        |
| `pairing`        | Người dùng không xác định nhận mã ghép nối; phê duyệt qua CLI     |
| `allowlist`      | Chỉ người dùng trong `allowFrom` mới có thể trò chuyện            |
| `disabled`       | Tắt toàn bộ tin nhắn trực tiếp                                    |

Phê duyệt yêu cầu ghép nối:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Trò chuyện nhóm

`channels.yuanbao.requireMention` (mặc định `true`): yêu cầu @đề cập trước khi bot phản hồi trong nhóm. Việc trả lời chính tin nhắn của bot được coi là một lượt đề cập ngầm.

## Ví dụ cấu hình

Thiết lập cơ bản, chính sách tin nhắn trực tiếp mở:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Giới hạn tin nhắn trực tiếp cho những người dùng cụ thể:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Tắt yêu cầu @đề cập trong nhóm:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Tinh chỉnh việc gửi đi:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // lưu vào bộ đệm cho đến khi đạt số ký tự này
      maxChars: 3000, // buộc chia nhỏ khi vượt quá giới hạn này
      idleMs: 5000, // tự động đẩy sau thời gian chờ không hoạt động (ms)
    },
  },
}
```

Đặt `outboundQueueStrategy: "immediate"` để gửi từng phần mà không lưu vào bộ đệm.

## Các lệnh thường dùng

| Lệnh       | Mô tả                              |
| ---------- | ---------------------------------- |
| `/help`    | Hiển thị các lệnh khả dụng         |
| `/status`  | Hiển thị trạng thái bot            |
| `/new`     | Bắt đầu phiên mới                  |
| `/stop`    | Dừng lượt chạy hiện tại            |
| `/restart` | Khởi động lại OpenClaw             |
| `/compact` | Thu gọn ngữ cảnh phiên             |

Yuanbao hỗ trợ menu lệnh gạch chéo nguyên bản; các lệnh tự động đồng bộ với nền tảng khi Gateway khởi động.

## Khắc phục sự cố

**Bot không phản hồi trong trò chuyện nhóm:**

1. Xác nhận bot đã được thêm vào nhóm
2. Xác nhận bạn @đề cập bot (được yêu cầu theo mặc định)
3. Kiểm tra nhật ký: `openclaw logs --follow`

**Bot không nhận được tin nhắn:**

1. Xác nhận bot đã được tạo và phê duyệt trong ứng dụng Yuanbao
2. Xác nhận `appKey` và `appSecret` được cấu hình chính xác
3. Xác nhận Gateway đang chạy: `openclaw gateway status`
4. Kiểm tra nhật ký: `openclaw logs --follow`

**Bot gửi phản hồi trống hoặc phản hồi dự phòng:**

1. Kiểm tra xem mô hình AI có trả về nội dung hợp lệ hay không
2. Phản hồi dự phòng mặc định: "暂时无法解答，你可以换个问题问问我哦"
3. Tùy chỉnh bằng `channels.yuanbao.fallbackReply`

**App Secret bị rò rỉ:**

1. Đặt lại App Secret trong ứng dụng Yuanbao
2. Cập nhật giá trị trong cấu hình của bạn
3. Khởi động lại Gateway: `openclaw gateway restart`

## Cấu hình nâng cao

### Nhiều tài khoản

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản được sử dụng khi các API gửi đi không chỉ định `accountId`.

### Giới hạn tin nhắn

- `maxChars`: số ký tự tối đa của một tin nhắn (mặc định `3000`)
- `mediaMaxMb`: giới hạn tải lên/tải xuống phương tiện (mặc định `20` MB)
- `overflowPolicy`: hành vi khi tin nhắn vượt quá giới hạn, `"split"` (mặc định) hoặc `"stop"`

### Truyền phát

Yuanbao hỗ trợ đầu ra truyền phát theo cấp khối; bot gửi văn bản thành từng phần trong quá trình tạo.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // bật truyền phát theo khối (mặc định)
    },
  },
}
```

Đặt `disableBlockStreaming: true` để gửi toàn bộ phản hồi trong một tin nhắn.

### Ngữ cảnh lịch sử trò chuyện nhóm

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // mặc định: 100, đặt thành 0 để tắt
    },
  },
}
```

Kiểm soát số lượng tin nhắn lịch sử được đưa vào ngữ cảnh AI cho các cuộc trò chuyện nhóm.

### Chế độ trả lời tin nhắn

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (mặc định: "first")
    },
  },
}
```

| Giá trị | Hành vi                                                               |
| ------- | --------------------------------------------------------------------- |
| `off`   | Không trả lời bằng trích dẫn                                           |
| `first` | Chỉ trích dẫn phản hồi đầu tiên cho mỗi tin nhắn đến (mặc định)       |
| `all`   | Trích dẫn mọi phản hồi                                                  |

### Chèn gợi ý Markdown

Theo mặc định, bot chèn một chỉ dẫn vào lời nhắc hệ thống để ngăn mô hình bao bọc toàn bộ phản hồi trong một khối mã markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // mặc định: true
    },
  },
}
```

### Chế độ gỡ lỗi

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Bật đầu ra nhật ký chưa được làm sạch cho các ID bot được liệt kê.

### Định tuyến đa tác tử

Sử dụng `bindings` để định tuyến tin nhắn trực tiếp hoặc nhóm Yuanbao đến các tác tử khác nhau:

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (tin nhắn trực tiếp) hoặc `"group"` (trò chuyện nhóm)
- `match.peer.id`: ID người dùng hoặc mã nhóm

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình Gateway](/vi/gateway/configuration)

| Cài đặt                                    | Mô tả                                                         | Mặc định                               |
| ------------------------------------------ | ------------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Bật/tắt kênh                                                  | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Tài khoản mặc định cho định tuyến gửi đi                      | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (ký + tạo phiếu)                                      | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (ký)                                               | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Mã thông báo đã ký trước (bỏ qua tự động ký phiếu)            | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Tên hiển thị của tài khoản                                    | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Bật/tắt một tài khoản cụ thể                                  | `true`                                 |
| `channels.yuanbao.dm.policy`               | Chính sách tin nhắn trực tiếp                                 | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Danh sách cho phép tin nhắn trực tiếp (danh sách ID người dùng) | -                                    |
| `channels.yuanbao.requireMention`          | Yêu cầu @đề cập trong nhóm                                    | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Xử lý tin nhắn dài (`split` hoặc `stop`)                      | `split`                                |
| `channels.yuanbao.replyToMode`             | Chiến lược trả lời tin nhắn trong nhóm (`off`, `first`, `all`) | `first`                               |
| `channels.yuanbao.outboundQueueStrategy`   | Chiến lược gửi đi (`merge-text` hoặc `immediate`)             | `merge-text`                           |
| `channels.yuanbao.minChars`                | Gộp văn bản: số ký tự tối thiểu để kích hoạt gửi              | `2800`                                 |
| `channels.yuanbao.maxChars`                | Gộp văn bản: số ký tự tối đa cho mỗi tin nhắn                 | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Gộp văn bản: thời gian chờ không hoạt động trước khi tự động đẩy (ms) | `5000`                        |
| `channels.yuanbao.mediaMaxMb`              | Giới hạn kích thước phương tiện (MB)                          | `20`                                   |
| `channels.yuanbao.historyLimit`            | Số mục ngữ cảnh lịch sử trò chuyện nhóm                       | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Tắt đầu ra truyền phát theo cấp khối                          | `false`                                |
| `channels.yuanbao.fallbackReply`           | Phản hồi dự phòng khi mô hình không trả về nội dung           | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Chèn chỉ dẫn ngăn bao bọc bằng markdown                       | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID bot trong danh sách cho phép gỡ lỗi (nhật ký chưa làm sạch) | `[]`                                  |

## Các loại tin nhắn được hỗ trợ

**Nhận:** văn bản, hình ảnh, tệp, âm thanh/giọng nói, video, nhãn dán/biểu tượng cảm xúc tùy chỉnh, phần tử tùy chỉnh (thẻ liên kết).

**Gửi:** văn bản (markdown), hình ảnh, tệp, âm thanh, video, nhãn dán.

**Luồng và phản hồi:** phản hồi trích dẫn (có thể cấu hình qua `replyToMode`); nền tảng không hỗ trợ phản hồi theo luồng.

## Liên quan

- [Tổng quan về các kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát bằng yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
