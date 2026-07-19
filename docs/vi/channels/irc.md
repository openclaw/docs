---
read_when:
    - Bạn muốn kết nối OpenClaw với các kênh IRC hoặc tin nhắn trực tiếp
    - Bạn đang cấu hình danh sách cho phép IRC, chính sách nhóm hoặc cơ chế kiểm soát lượt đề cập
summary: Thiết lập Plugin IRC, kiểm soát truy cập và khắc phục sự cố
title: IRC
x-i18n:
    generated_at: "2026-07-19T05:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85c3da80b45d6611872ddbd10b3be4a5742b46e355e8bb554353a478f2a1702f
    source_path: channels/irc.md
    workflow: 16
---

Sử dụng IRC khi bạn muốn OpenClaw hoạt động trong các kênh cổ điển (`#room`) và tin nhắn trực tiếp.
Cài đặt plugin IRC chính thức, sau đó cấu hình plugin này trong `channels.irc`.

## Bắt đầu nhanh

1. Cài đặt plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Thiết lập ít nhất máy chủ, biệt danh và các kênh cần tham gia trong `~/.openclaw/openclaw.json`:

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

Nên dùng máy chủ IRC riêng để điều phối bot. Nếu chủ ý sử dụng mạng IRC công cộng, các lựa chọn phổ biến gồm Libera.Chat, OFTC và Snoonet. Tránh dùng các kênh công cộng dễ đoán cho lưu lượng liên lạc hậu trường của bot hoặc cụm bot.

## Độ bền của dữ liệu đầu vào

OpenClaw ghi từng `PRIVMSG` IRC đã chấp nhận vào hàng đợi đầu vào bền vững trước khi thực hiện các bước kiểm tra chính sách thông thường và chuyển đến tác tử. Các tin nhắn đang chờ hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại và tiếp tục được tuần tự hóa theo từng kênh hoặc đối tác nhắn tin trực tiếp.

IRC không cung cấp ID giao nhận có thể phát lại hoặc gửi lại các tin nhắn mà máy khách bị ngắt kết nối đã bỏ lỡ. Vì vậy, OpenClaw gán một ID cục bộ chỉ ổn định trong kết nối TCP hiện tại. Hàng đợi bảo vệ khoảng thời gian từ lúc chấp nhận cục bộ đến khi chuyển đi; hàng đợi không thể khôi phục tin nhắn chưa bao giờ đến được OpenClaw hoặc loại bỏ trùng lặp khi máy chủ gửi lại qua các kết nối khác nhau.

## Cài đặt kết nối

| Khóa                           | Mặc định                       | Ghi chú                                                       |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | không có (bắt buộc)               | Tên máy chủ IRC                                         |
| `port`                        | `6697` với TLS, `6667` không mã hóa | 1-65535                                                     |
| `tls`                         | `true`                        | Chỉ đặt `false` khi chủ ý dùng văn bản thuần                  |
| `nick`                        | không có (bắt buộc)               | Biệt danh của bot                                                    |
| `username`                    | biệt danh, nếu không thì `openclaw`         | Tên người dùng IRC                                                |
| `realname`                    | `OpenClaw`                    | Trường tên thật/GECOS                                        |
| `password` / `passwordFile`   | không có                          | Mật khẩu máy chủ; tệp phải là tệp thông thường                |
| `channels`                    | không có                          | Các kênh cần tham gia (`["#openclaw"]`)                          |
| `accounts` / `defaultAccount` | không có                          | Thiết lập nhiều tài khoản; biến môi trường chỉ điền cho tài khoản mặc định |

## Thiết lập bảo mật mặc định

- IRC sử dụng các socket TCP/TLS thô bên ngoài cơ chế định tuyến proxy chuyển tiếp do người vận hành OpenClaw quản lý. Trong các triển khai yêu cầu toàn bộ lưu lượng đi qua proxy chuyển tiếp đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC trực tiếp được phê duyệt rõ ràng.
- `channels.irc.dmPolicy` mặc định là `"pairing"`: người gửi tin nhắn trực tiếp không xác định sẽ nhận mã ghép nối mà bạn phê duyệt bằng `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` mặc định là `"allowlist"`.
- Khi dùng `groupPolicy="allowlist"`, hãy đặt `channels.irc.groups` để xác định các kênh được phép.
- Sử dụng TLS (`channels.irc.tls=true`) trừ khi bạn chủ ý chấp nhận phương thức truyền văn bản thuần.

## Kiểm soát truy cập

Có hai "cổng" riêng biệt cho các kênh IRC:

1. **Quyền truy cập kênh** (`groupPolicy` + `groups`): bot có chấp nhận tin nhắn từ một kênh hay không.
2. **Quyền truy cập của người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom` theo từng kênh): ai được phép kích hoạt bot trong kênh đó.

Các khóa cấu hình:

- Danh sách cho phép tin nhắn trực tiếp (quyền truy cập của người gửi tin nhắn trực tiếp): `channels.irc.allowFrom`
- Danh sách cho phép người gửi trong nhóm (quyền truy cập của người gửi trong kênh): `channels.irc.groupAllowFrom`
- Các tùy chọn kiểm soát theo từng kênh (quy tắc về kênh + người gửi + lượt đề cập): `channels.irc.groups["#channel"]` với `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` và `systemPrompt`
- `channels.irc.groupPolicy="open"` cho phép các kênh chưa được cấu hình (**theo mặc định vẫn yêu cầu đề cập**)

Các mục trong danh sách cho phép nên sử dụng danh tính người gửi ổn định (`nick!user@host`).
Việc đối chiếu chỉ bằng biệt danh có thể thay đổi và chỉ được bật khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lỗi thường gặp: `allowFrom` dành cho tin nhắn trực tiếp, không phải kênh

Nếu bạn thấy nhật ký như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...điều đó có nghĩa là người gửi không được phép gửi tin nhắn **nhóm/kênh**. Khắc phục bằng một trong hai cách:

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

Ngay cả khi một kênh được cho phép (thông qua `groupPolicy` + `groups`) và người gửi được cho phép, OpenClaw vẫn mặc định **yêu cầu đề cập** trong ngữ cảnh nhóm. Bot được tính là đã được đề cập khi tin nhắn chứa biệt danh hiện đang kết nối của bot hoặc khớp với các mẫu đề cập đã cấu hình.

Điều đó có nghĩa là bạn có thể thấy nhật ký như `drop channel … (missing-mention)` trừ khi tin nhắn chứa mẫu đề cập khớp với bot.

Để bot phản hồi trong một kênh IRC **mà không cần được đề cập**, hãy tắt yêu cầu đề cập cho kênh đó:

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

Hoặc để cho phép **tất cả** các kênh IRC (không có danh sách cho phép theo từng kênh) nhưng vẫn phản hồi mà không cần được đề cập:

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

Nếu cho phép `allowFrom: ["*"]` trong một kênh công cộng, bất kỳ ai cũng có thể gửi lời nhắc cho bot.
Để giảm rủi ro, hãy hạn chế công cụ cho kênh đó.

### Cùng bộ công cụ cho mọi người trong kênh

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

Sử dụng `toolsBySender` để áp dụng chính sách nghiêm ngặt hơn cho `"*"` và chính sách ít nghiêm ngặt hơn cho biệt danh của bạn:

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

- Các khóa `toolsBySender` nên sử dụng tiền tố rõ ràng (`channel:`, `id:`, `e164:`, `username:`, `name:`). Đối với IRC, hãy sử dụng `id:` với giá trị danh tính người gửi: `id:alice` hoặc `id:alice!~alice@203.0.113.7` để đối chiếu chặt chẽ hơn.
- Các khóa cũ không có tiền tố vẫn được chấp nhận, chỉ được đối chiếu dưới dạng `id:` và phát cảnh báo ngừng hỗ trợ.
- Chính sách người gửi khớp đầu tiên sẽ được áp dụng; `"*"` là phương án dự phòng ký tự đại diện.

Để biết thêm về quyền truy cập nhóm so với yêu cầu đề cập (và cách chúng tương tác), hãy xem: [/channels/groups](/vi/channels/groups).

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

Theo mặc định, quá trình xác thực NickServ luôn chạy khi mật khẩu được đặt (`enabled` chỉ cần là `false` để không tham gia). `service` mặc định là `NickServ`; `passwordFile` là phương án thay thế cho `password` nội tuyến.

Đăng ký một lần tùy chọn khi kết nối (`register: true` yêu cầu `registerEmail`):

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

Tắt `register` sau khi biệt danh được đăng ký để tránh các lần thử REGISTER lặp lại.

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

Không thể đặt `IRC_HOST` từ `.env` của không gian làm việc; xem [Các tệp `.env` của không gian làm việc](/vi/gateway/security).

## Khắc phục sự cố

- Nếu bot kết nối nhưng không bao giờ phản hồi trong các kênh, hãy xác minh `channels.irc.groups` **và** kiểm tra xem yêu cầu đề cập có đang loại bỏ tin nhắn hay không (`missing-mention`). Nếu muốn bot phản hồi mà không cần gọi tên, hãy đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, hãy xác minh biệt danh có sẵn và mật khẩu máy chủ.
- Nếu TLS thất bại trên mạng tùy chỉnh, hãy xác minh máy chủ/cổng và thiết lập chứng chỉ.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
