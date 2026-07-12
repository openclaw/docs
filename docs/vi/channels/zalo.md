---
read_when:
    - Phát triển các tính năng hoặc webhook của Zalo
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T07:44:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Trạng thái: thử nghiệm. Cả tin nhắn trực tiếp và trò chuyện nhóm đều đã được triển khai; bảng [Khả năng](#capabilities) bên dưới phản ánh hành vi đã được xác minh trên bot Zalo Bot Creator / Marketplace.

## Plugin đi kèm

Zalo được cung cấp dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng đóng gói không cần cài đặt riêng.

Trên bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Zalo, hãy cài đặt trực tiếp gói npm:

- Cài đặt: `openclaw plugins install @openclaw/zalo`
- Phiên bản cố định: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Từ bản mã nguồn cục bộ: `openclaw plugins install ./path/to/local/zalo-plugin`
- Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Tạo mã thông báo bot tại [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (đăng nhập, tạo bot, cấu hình các thiết lập). Mã thông báo có dạng `numeric_id:secret`; đối với bot Marketplace, mã thông báo thời gian chạy có thể sử dụng có thể xuất hiện trong tin nhắn chào mừng của bot.
2. Đặt mã thông báo qua biến môi trường `ZALO_BOT_TOKEN=...` (chỉ dành cho tài khoản mặc định) hoặc trong cấu hình.
3. Khởi động lại Gateway.
4. Phê duyệt mã ghép nối khi có liên hệ qua tin nhắn trực tiếp lần đầu (chính sách tin nhắn trực tiếp mặc định là ghép nối).

Cấu hình tối thiểu:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Nhiều tài khoản: thêm các mục khác dưới `channels.zalo.accounts.<id>`, mỗi mục có `botToken`/`name` riêng. `channels.zalo.botToken` (dạng phẳng, không có `accounts`) là dạng viết tắt cũ cho một tài khoản; với cấu hình mới, nên dùng `accounts.<id>.*`.

## Tổng quan

Zalo là ứng dụng nhắn tin tập trung vào thị trường Việt Nam. Bot API của Zalo cho phép Gateway vận hành bot cho cả cuộc trò chuyện 1:1 và trò chuyện nhóm, với định tuyến xác định trở lại Zalo (mô hình không bao giờ chọn kênh).

Trang này đề cập đến **bot Zalo Bot Creator / Marketplace**. **Bot Zalo Official Account (OA)** thuộc một bề mặt sản phẩm khác và có thể hoạt động khác; trang này không đề cập đến chúng.

## Cách hoạt động

- Tin nhắn đến được chuẩn hóa thành phong bì kênh dùng chung cùng các phần giữ chỗ cho phương tiện.
- Phản hồi luôn được định tuyến trở lại cùng cuộc trò chuyện Zalo; không sử dụng trả lời trích dẫn (`replyToMode` được cố định ở trạng thái tắt).
- Theo mặc định sử dụng thăm dò dài (`getUpdates`); chế độ Webhook khả dụng qua `channels.zalo.webhookUrl`.
- Trong nhóm, bot chỉ được kích hoạt khi được @đề cập; không thể cấu hình hành vi này theo từng kênh.

## Giới hạn

| Giới hạn                       | Giá trị                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Kích thước đoạn văn bản gửi đi | 2000 ký tự (giới hạn API của Zalo)                                                                       |
| Kích thước phương tiện (đến/đi)| `channels.zalo.mediaMaxMb`, mặc định `5` MB                                                              |
| Nội dung yêu cầu Webhook       | 1 MB, thời gian chờ đọc 30 giây                                                                          |
| Giới hạn tốc độ Webhook        | 120 yêu cầu / 60 giây cho mỗi đường dẫn+IP máy khách, sau đó trả về HTTP 429                             |
| Khoảng phát hiện sự kiện Webhook trùng lặp | 5 phút (khóa theo đường dẫn + tài khoản + tên sự kiện + cuộc trò chuyện + người gửi + mã tin nhắn) |

## Kiểm soát truy cập

### Tin nhắn trực tiếp

- `channels.zalo.dmPolicy`: `pairing` (mặc định) | `allowlist` | `open` | `disabled`.
- Ghép nối: người gửi không xác định nhận được mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt. Mã hết hạn sau 1 giờ.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Chi tiết: [Ghép nối](/vi/channels/pairing)
- `channels.zalo.allowFrom` chấp nhận mã người dùng Zalo dạng số (không tra cứu tên người dùng). `open` yêu cầu `"*"`.

### Nhóm

Plugin hỗ trợ trò chuyện nhóm (`chatTypes: ["direct", "group"]`) và kiểm soát bằng yêu cầu đề cập cùng chính sách nhóm:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` giới hạn những mã người gửi có thể kích hoạt bot trong nhóm; dùng `allowFrom` làm phương án dự phòng khi chưa đặt.
- Cách phân giải mặc định: khi `channels.zalo` được cấu hình, `groupPolicy` chưa đặt sẽ được phân giải thành `open`. Khi hoàn toàn không có `channels.zalo`, thời gian chạy sẽ đóng an toàn về `allowlist`.
- Lưu ý đã được báo cáo trong thực tế: với một số thiết lập bot Marketplace, hoàn toàn không thể thêm bot vào nhóm. Nếu gặp trường hợp này, hãy xác minh bằng các thiết lập Zalo Bot Platform của bot; đây là hạn chế từ phía nền tảng, không phải chính sách của OpenClaw.

## Thăm dò dài so với Webhook

- Mặc định: thăm dò dài (không yêu cầu URL công khai).
- Chế độ Webhook: đặt `channels.zalo.webhookUrl` và `channels.zalo.webhookSecret`.
  - URL Webhook phải sử dụng HTTPS.
  - Bí mật Webhook phải dài từ 8 đến 256 ký tự.
  - Zalo gửi sự kiện kèm tiêu đề `X-Bot-Api-Secret-Token`, được kiểm tra bằng phép so sánh thời gian hằng định.
  - HTTP của Gateway xử lý yêu cầu Webhook tại `channels.zalo.webhookPath` (mặc định là đường dẫn của URL Webhook).
  - Yêu cầu phải sử dụng `Content-Type: application/json` (hoặc loại phương tiện `+json`).
  - Theo tài liệu API của Zalo, thăm dò getUpdates và Webhook loại trừ lẫn nhau.

## Các loại tin nhắn được hỗ trợ

- Văn bản: hỗ trợ đầy đủ, được chia thành các đoạn 2000 ký tự.
- Phương tiện: cả chiều đến và chiều đi, bị giới hạn bởi `mediaMaxMb`.
- Cảm xúc, luồng thảo luận, cuộc thăm dò ý kiến, lệnh gốc: Plugin không hỗ trợ.
- Truyền phát: Plugin khai báo khả năng truyền phát theo khối, nhưng Zalo không có các nút điều chỉnh chuyên biệt cho hàng đợi gửi đi/hợp nhất văn bản (không giống một số kênh khu vực khác); nếu điều này quan trọng đối với trường hợp sử dụng của bạn, hãy xác minh hành vi hiện tại trong môi trường của bạn.

## Khả năng

| Tính năng                    | Trạng thái                                  |
| ---------------------------- | ------------------------------------------- |
| Tin nhắn trực tiếp           | Được hỗ trợ                                 |
| Nhóm                         | Được hỗ trợ (yêu cầu đề cập)                |
| Phương tiện (đến/đi)         | Được hỗ trợ, bị giới hạn bởi `mediaMaxMb`   |
| Cảm xúc                      | Không được hỗ trợ                           |
| Luồng thảo luận              | Không được hỗ trợ                           |
| Cuộc thăm dò ý kiến          | Không được hỗ trợ                           |
| Lệnh gốc                     | Không được hỗ trợ                           |
| Trả lời đến / trích dẫn      | Không được sử dụng (cố định tắt)            |

## Đích phân phối (CLI/Cron)

Sử dụng mã cuộc trò chuyện làm đích:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Khắc phục sự cố

**Bot không phản hồi:**

- Kiểm tra mã thông báo: `openclaw channels status --probe`
- Xác minh người gửi đã được phê duyệt (ghép nối hoặc `allowFrom`)
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`

**Webhook không nhận được sự kiện:**

- Xác nhận URL Webhook sử dụng HTTPS
- Xác nhận bí mật dài từ 8 đến 256 ký tự
- Xác nhận điểm cuối HTTP của Gateway có thể truy cập được trên đường dẫn đã cấu hình
- Xác nhận thăm dò getUpdates không đồng thời chạy (chúng loại trừ lẫn nhau)
- Một đợt yêu cầu dồn dập có thể trả về HTTP 429 (120 yêu cầu / 60 giây cho mỗi đường dẫn+IP); hãy giãn nhịp và thử lại

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

| Thiết lập                                    | Mô tả                                                    | Mặc định                 |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| `channels.zalo.enabled`                      | Bật/tắt khởi động kênh                                   | `true`                   |
| `channels.zalo.accounts.<id>.botToken`       | Mã thông báo bot từ Zalo Bot Platform                    | -                        |
| `channels.zalo.accounts.<id>.tokenFile`      | Đọc mã thông báo từ tệp (từ chối liên kết tượng trưng)   | -                        |
| `channels.zalo.accounts.<id>.name`           | Tên hiển thị                                             | -                        |
| `channels.zalo.accounts.<id>.enabled`        | Bật/tắt tài khoản này                                    | `true`                   |
| `channels.zalo.accounts.<id>.dmPolicy`       | Chính sách tin nhắn trực tiếp theo tài khoản             | `pairing`                |
| `channels.zalo.accounts.<id>.allowFrom`      | Danh sách cho phép tin nhắn trực tiếp (mã người dùng)     | -                        |
| `channels.zalo.accounts.<id>.groupPolicy`    | Chính sách nhóm theo tài khoản                           | xem [Nhóm](#groups)      |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Danh sách người gửi được phép trong nhóm; dùng `allowFrom` làm phương án dự phòng | - |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Giới hạn phương tiện đến/đi (MB)                         | `5`                      |
| `channels.zalo.accounts.<id>.webhookUrl`     | Bật chế độ Webhook (yêu cầu HTTPS)                       | -                        |
| `channels.zalo.accounts.<id>.webhookSecret`  | Bí mật Webhook (8-256 ký tự)                             | -                        |
| `channels.zalo.accounts.<id>.webhookPath`    | Đường dẫn Webhook trên máy chủ HTTP của Gateway          | đường dẫn URL Webhook    |
| `channels.zalo.accounts.<id>.proxy`          | URL proxy cho các yêu cầu API                            | -                        |
| `channels.zalo.accounts.<id>.responsePrefix` | Ghi đè tiền tố phản hồi gửi đi                           | -                        |
| `channels.zalo.defaultAccount`               | Tài khoản mặc định khi cấu hình nhiều tài khoản          | `default`                |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` và các khóa cấp cao nhất dạng phẳng khác là dạng viết tắt cũ cho một tài khoản của các trường bên trên; cả hai dạng đều được hỗ trợ.

Tùy chọn môi trường: `ZALO_BOT_TOKEN=...` chỉ phân giải mã thông báo của tài khoản mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
