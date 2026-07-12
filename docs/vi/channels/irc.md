---
read_when:
    - Bạn muốn kết nối OpenClaw với các kênh IRC hoặc tin nhắn trực tiếp
    - Bạn đang cấu hình danh sách cho phép IRC, chính sách nhóm hoặc cơ chế kiểm soát lượt nhắc đến
summary: Thiết lập Plugin IRC, kiểm soát truy cập và khắc phục sự cố
title: IRC
x-i18n:
    generated_at: "2026-07-12T07:39:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Sử dụng IRC khi bạn muốn OpenClaw hoạt động trong các kênh truyền thống (`#room`) và tin nhắn trực tiếp.
Cài đặt Plugin IRC chính thức, sau đó cấu hình Plugin này trong `channels.irc`.

## Bắt đầu nhanh

1. Cài đặt Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Thiết lập tối thiểu máy chủ, biệt danh và các kênh cần tham gia trong `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Khởi động/khởi động lại Gateway:

```bash
openclaw gateway run
```

Nên dùng máy chủ IRC riêng để điều phối bot. Nếu bạn chủ ý sử dụng mạng IRC công cộng, các lựa chọn phổ biến gồm Libera.Chat, OFTC và Snoonet. Tránh dùng các kênh công cộng có tên dễ đoán cho lưu lượng liên lạc hậu tuyến của bot hoặc cụm bot.

## Cài đặt kết nối

| Khóa                          | Mặc định                      | Ghi chú                                                     |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | không có (bắt buộc)           | Tên máy chủ IRC                                             |
| `port`                        | `6697` với TLS, `6667` thường | 1-65535                                                     |
| `tls`                         | `true`                        | Chỉ đặt thành `false` khi chủ ý dùng văn bản thuần          |
| `nick`                        | không có (bắt buộc)           | Biệt danh của bot                                           |
| `username`                    | biệt danh, nếu không thì `openclaw` | Tên người dùng IRC                                     |
| `realname`                    | `OpenClaw`                    | Trường tên thật/GECOS                                       |
| `password` / `passwordFile`   | không có                      | Mật khẩu máy chủ; tệp phải là tệp thông thường              |
| `channels`                    | không có                      | Các kênh cần tham gia (`["#openclaw"]`)                     |
| `accounts` / `defaultAccount` | không có                      | Thiết lập nhiều tài khoản; biến môi trường chỉ điền cho tài khoản mặc định |

## Mặc định bảo mật

- IRC sử dụng các socket TCP/TLS thô nằm ngoài định tuyến proxy chuyển tiếp do người vận hành OpenClaw quản lý. Trong các bản triển khai yêu cầu mọi lưu lượng đi ra phải qua proxy chuyển tiếp đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC trực tiếp được phê duyệt rõ ràng.
- `channels.irc.dmPolicy` mặc định là `"pairing"`: người gửi tin nhắn trực tiếp chưa xác định sẽ nhận được mã ghép nối để bạn phê duyệt bằng `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` mặc định là `"allowlist"`.
- Với `groupPolicy="allowlist"`, hãy đặt `channels.irc.groups` để xác định các kênh được phép.
- Sử dụng TLS (`channels.irc.tls=true`) trừ khi bạn chủ ý chấp nhận truyền tải bằng văn bản thuần.

## Kiểm soát truy cập

Có hai "cổng" riêng biệt dành cho các kênh IRC:

1. **Quyền truy cập kênh** (`groupPolicy` + `groups`): bot có chấp nhận tin nhắn từ một kênh hay không.
2. **Quyền truy cập của người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom` theo từng kênh): ai được phép kích hoạt bot trong kênh đó.

Các khóa cấu hình:

- Danh sách cho phép tin nhắn trực tiếp (quyền truy cập của người gửi tin nhắn trực tiếp): `channels.irc.allowFrom`
- Danh sách cho phép người gửi trong nhóm (quyền truy cập của người gửi trong kênh): `channels.irc.groupAllowFrom`
- Các tùy chọn kiểm soát theo từng kênh (quy tắc về kênh, người gửi và lượt đề cập): `channels.irc.groups["#channel"]` với `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` và `systemPrompt`
- `channels.irc.groupPolicy="open"` cho phép các kênh chưa được cấu hình (**theo mặc định vẫn yêu cầu đề cập**)

Các mục trong danh sách cho phép nên sử dụng danh tính người gửi ổn định (`nick!user@host`).
Việc đối chiếu chỉ bằng biệt danh có thể thay đổi và chỉ được bật khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lỗi thường gặp: `allowFrom` dành cho tin nhắn trực tiếp, không phải kênh

Nếu bạn thấy nhật ký như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...điều đó có nghĩa là người gửi không được phép gửi tin nhắn **nhóm/kênh**. Hãy khắc phục bằng một trong hai cách:

- đặt `channels.irc.groupAllowFrom` (áp dụng chung cho tất cả các kênh), hoặc
- đặt danh sách cho phép người gửi theo từng kênh: `channels.irc.groups["#channel"].allowFrom`

Ví dụ (cho phép mọi người trong `#openclaw` trò chuyện với bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Kích hoạt phản hồi (lượt đề cập)

Ngay cả khi một kênh được cho phép (thông qua `groupPolicy` + `groups`) và người gửi cũng được cho phép, OpenClaw theo mặc định vẫn **yêu cầu đề cập** trong ngữ cảnh nhóm. Bot được xem là đã được đề cập khi tin nhắn chứa biệt danh hiện được kết nối của bot hoặc khớp với các mẫu đề cập mà bạn đã cấu hình.

Điều đó có nghĩa là bạn có thể thấy nhật ký như `drop channel … (missing-mention)` trừ khi tin nhắn chứa mẫu đề cập khớp với bot.

Để bot phản hồi trong một kênh IRC **mà không cần đề cập**, hãy tắt yêu cầu đề cập cho kênh đó:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Hoặc để cho phép **tất cả** các kênh IRC (không có danh sách cho phép theo từng kênh) nhưng vẫn phản hồi mà không cần đề cập:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Lưu ý bảo mật (khuyến nghị cho các kênh công cộng)

Nếu bạn cho phép `allowFrom: ["*"]` trong một kênh công cộng, bất kỳ ai cũng có thể gửi lời nhắc cho bot.
Để giảm rủi ro, hãy hạn chế các công cụ cho kênh đó.

### Cùng một bộ công cụ cho mọi người trong kênh

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Công cụ khác nhau theo từng người gửi (chủ sở hữu có nhiều quyền hơn)

Sử dụng `toolsBySender` để áp dụng chính sách nghiêm ngặt hơn cho `"*"` và chính sách ít hạn chế hơn cho biệt danh của bạn:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Các khóa `toolsBySender` nên sử dụng tiền tố rõ ràng (`channel:`, `id:`, `e164:`, `username:`, `name:`). Đối với IRC, hãy sử dụng `id:` cùng với giá trị danh tính của người gửi: `id:alice` hoặc `id:alice!~alice@203.0.113.7` để đối chiếu chặt chẽ hơn.
- Các khóa cũ không có tiền tố vẫn được chấp nhận, chỉ được đối chiếu như `id:` và sẽ tạo cảnh báo ngừng hỗ trợ.
- Chính sách người gửi khớp đầu tiên sẽ được áp dụng; `"*"` là phương án dự phòng ký tự đại diện.

Để tìm hiểu thêm về quyền truy cập nhóm so với yêu cầu đề cập (và cách chúng tương tác), hãy xem: [/channels/groups](/vi/channels/groups).

## NickServ

Để xác thực với NickServ sau khi kết nối:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Theo mặc định, việc xác thực NickServ sẽ chạy mỗi khi mật khẩu được thiết lập (`enabled` chỉ cần được đặt thành `false` nếu muốn không tham gia). `service` mặc định là `NickServ`; `passwordFile` là phương án thay thế cho `password` nội tuyến.

Tùy chọn đăng ký một lần khi kết nối (`register: true` yêu cầu `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Tắt `register` sau khi biệt danh đã được đăng ký để tránh các lần thử REGISTER lặp lại.

## Biến môi trường

Tài khoản mặc định hỗ trợ:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (phân tách bằng dấu phẩy)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

Không thể đặt `IRC_HOST` từ tệp `.env` của không gian làm việc; xem [Tệp `.env` của không gian làm việc](/vi/gateway/security).

## Khắc phục sự cố

- Nếu bot kết nối nhưng không bao giờ phản hồi trong các kênh, hãy kiểm tra `channels.irc.groups` **và** xem việc yêu cầu đề cập có đang loại bỏ tin nhắn hay không (`missing-mention`). Nếu bạn muốn bot phản hồi mà không cần gọi tên, hãy đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, hãy kiểm tra tính khả dụng của biệt danh và mật khẩu máy chủ.
- Nếu TLS thất bại trên mạng tùy chỉnh, hãy kiểm tra máy chủ/cổng và thiết lập chứng chỉ.

## Liên quan

- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
