---
read_when:
    - Làm việc với các tính năng hoặc Webhook của Zalo
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Status: thử nghiệm. DM được hỗ trợ. Phần [Khả năng](#capabilities) bên dưới phản ánh hành vi hiện tại của bot Marketplace.

## Plugin đi kèm

Zalo được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, nên các bản dựng đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc một bản cài đặt tùy chỉnh không bao gồm Zalo, hãy cài trực tiếp gói npm:

- Cài qua CLI: `openclaw plugins install @openclaw/zalo`
- Phiên bản ghim cố định: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Hoặc từ checkout mã nguồn: `openclaw plugins install ./path/to/local/zalo-plugin`
- Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh (người mới bắt đầu)

1. Đảm bảo Plugin Zalo khả dụng.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã đi kèm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Đặt token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Hoặc cấu hình: `channels.zalo.accounts.default.botToken: "..."`.
3. Khởi động lại Gateway (hoặc hoàn tất thiết lập).
4. Quyền truy cập DM mặc định dùng ghép đôi; phê duyệt mã ghép đôi trong lần liên hệ đầu tiên.

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

## Đây là gì

Zalo là ứng dụng nhắn tin tập trung vào Việt Nam; Bot API của Zalo cho phép Gateway chạy bot cho các cuộc trò chuyện 1:1.
Nó phù hợp cho hỗ trợ hoặc thông báo khi bạn muốn định tuyến xác định trở lại Zalo.

Trang này phản ánh hành vi hiện tại của OpenClaw cho **bot Zalo Bot Creator / Marketplace**.
**Bot Zalo Official Account (OA)** là một bề mặt sản phẩm Zalo khác và có thể hoạt động khác.

- Một kênh Zalo Bot API do Gateway sở hữu.
- Định tuyến xác định: phản hồi quay lại Zalo; mô hình không bao giờ chọn kênh.
- DM dùng chung phiên chính của agent.
- Phần [Khả năng](#capabilities) bên dưới cho biết hỗ trợ hiện tại của bot Marketplace.

## Thiết lập (đường nhanh)

### 1) Tạo token bot (Zalo Bot Platform)

1. Truy cập [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) và đăng nhập.
2. Tạo bot mới và cấu hình thiết lập của bot.
3. Sao chép token bot đầy đủ (thường là `numeric_id:secret`). Với bot Marketplace, token runtime có thể dùng được có thể xuất hiện trong tin nhắn chào mừng của bot sau khi tạo.

### 2) Cấu hình token (env hoặc cấu hình)

Ví dụ:

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

Nếu sau này bạn chuyển sang một bề mặt bot Zalo có hỗ trợ nhóm, bạn có thể thêm rõ ràng cấu hình dành riêng cho nhóm như `groupPolicy` và `groupAllowFrom`. Với hành vi hiện tại của bot Marketplace, xem [Khả năng](#capabilities).

Tùy chọn env: `ZALO_BOT_TOKEN=...` (chỉ hoạt động cho tài khoản mặc định).

Hỗ trợ nhiều tài khoản: dùng `channels.zalo.accounts` với token theo từng tài khoản và `name` tùy chọn.

3. Khởi động lại Gateway. Zalo khởi động khi token được phân giải (env hoặc cấu hình).
4. Quyền truy cập DM mặc định dùng ghép đôi. Phê duyệt mã khi bot được liên hệ lần đầu.

## Cách hoạt động (hành vi)

- Tin nhắn đến được chuẩn hóa vào envelope kênh dùng chung với placeholder media.
- Phản hồi luôn được định tuyến trở lại cùng cuộc trò chuyện Zalo.
- Mặc định dùng long-polling; chế độ Webhook khả dụng với `channels.zalo.webhookUrl`.

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn 2000 ký tự (giới hạn API Zalo).
- Tải xuống/tải lên media bị giới hạn bởi `channels.zalo.mediaMaxMb` (mặc định 5).
- Streaming mặc định bị chặn vì giới hạn 2000 ký tự khiến streaming ít hữu ích hơn.

## Kiểm soát truy cập (DM)

### Quyền truy cập DM

- Mặc định: `channels.zalo.dmPolicy = "pairing"`. Người gửi chưa biết sẽ nhận mã ghép đôi; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Ghép đôi là trao đổi token mặc định. Chi tiết: [Ghép đôi](/vi/channels/pairing)
- `channels.zalo.allowFrom` chấp nhận ID người dùng dạng số (không có tra cứu tên người dùng).

## Kiểm soát truy cập (Nhóm)

Đối với **bot Zalo Bot Creator / Marketplace**, hỗ trợ nhóm trên thực tế không khả dụng vì hoàn toàn không thể thêm bot vào nhóm.

Điều đó có nghĩa là các khóa cấu hình liên quan đến nhóm bên dưới tồn tại trong schema, nhưng không dùng được cho bot Marketplace:

- `channels.zalo.groupPolicy` kiểm soát xử lý tin nhắn đến trong nhóm: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` giới hạn ID người gửi nào có thể kích hoạt bot trong nhóm.
- Nếu `groupAllowFrom` chưa được đặt, Zalo quay về dùng `allowFrom` cho kiểm tra người gửi.
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.zalo`, runtime vẫn quay về `groupPolicy="allowlist"` để đảm bảo an toàn.

Các giá trị chính sách nhóm (khi bề mặt bot của bạn có quyền truy cập nhóm) là:

- `groupPolicy: "disabled"` — chặn tất cả tin nhắn nhóm.
- `groupPolicy: "open"` — cho phép bất kỳ thành viên nhóm nào (có cổng theo lượt nhắc).
- `groupPolicy: "allowlist"` — mặc định đóng khi lỗi; chỉ chấp nhận người gửi được cho phép.

Nếu bạn đang dùng một bề mặt sản phẩm bot Zalo khác và đã xác minh hành vi nhóm hoạt động, hãy ghi lại riêng thay vì giả định nó khớp với luồng bot Marketplace.

## Long-polling so với Webhook

- Mặc định: long-polling (không cần URL công khai).
- Chế độ Webhook: đặt `channels.zalo.webhookUrl` và `channels.zalo.webhookSecret`.
  - Webhook secret phải dài 8-256 ký tự.
  - URL Webhook phải dùng HTTPS.
  - Zalo gửi sự kiện kèm header `X-Bot-Api-Secret-Token` để xác minh.
  - HTTP của Gateway xử lý yêu cầu Webhook tại `channels.zalo.webhookPath` (mặc định là đường dẫn URL Webhook).
  - Yêu cầu phải dùng `Content-Type: application/json` (hoặc kiểu media `+json`).
  - Sự kiện trùng lặp (`event_name + message_id`) bị bỏ qua trong một cửa sổ phát lại ngắn.
  - Lưu lượng bùng phát bị giới hạn tốc độ theo đường dẫn/nguồn và có thể trả về HTTP 429.

**Lưu ý:** getUpdates (polling) và Webhook loại trừ lẫn nhau theo tài liệu API Zalo.

## Loại tin nhắn được hỗ trợ

Để xem ảnh chụp nhanh hỗ trợ, xem [Khả năng](#capabilities). Các ghi chú bên dưới bổ sung chi tiết ở những nơi hành vi cần thêm ngữ cảnh.

- **Tin nhắn văn bản**: Hỗ trợ đầy đủ với chia đoạn 2000 ký tự.
- **URL thuần trong văn bản**: Hoạt động như đầu vào văn bản thông thường.
- **Xem trước liên kết / thẻ liên kết phong phú**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); chúng không kích hoạt phản hồi một cách đáng tin cậy.
- **Tin nhắn hình ảnh**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); xử lý hình ảnh đến không đáng tin cậy (chỉ báo đang nhập nhưng không có phản hồi cuối).
- **Nhãn dán**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Ghi âm thoại / tệp âm thanh / video / tệp đính kèm chung**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Loại không được hỗ trợ**: Được ghi log (ví dụ: tin nhắn từ người dùng được bảo vệ).

## Khả năng

Bảng này tóm tắt hành vi hiện tại của **bot Zalo Bot Creator / Marketplace** trong OpenClaw.

| Tính năng                   | Trạng thái                                        |
| --------------------------- | ------------------------------------------------- |
| Tin nhắn trực tiếp          | ✅ Được hỗ trợ                                    |
| Nhóm                        | ❌ Không khả dụng cho bot Marketplace             |
| Media (hình ảnh đến)        | ⚠️ Giới hạn / xác minh trong môi trường của bạn   |
| Media (hình ảnh gửi đi)     | ⚠️ Chưa kiểm thử lại cho bot Marketplace          |
| URL thuần trong văn bản     | ✅ Được hỗ trợ                                    |
| Xem trước liên kết          | ⚠️ Không đáng tin cậy cho bot Marketplace         |
| Phản ứng                    | ❌ Không được hỗ trợ                              |
| Nhãn dán                    | ⚠️ Không có phản hồi agent cho bot Marketplace    |
| Ghi âm thoại / âm thanh / video | ⚠️ Không có phản hồi agent cho bot Marketplace |
| Tệp đính kèm                | ⚠️ Không có phản hồi agent cho bot Marketplace    |
| Luồng thảo luận             | ❌ Không được hỗ trợ                              |
| Cuộc thăm dò                | ❌ Không được hỗ trợ                              |
| Lệnh native                 | ❌ Không được hỗ trợ                              |
| Streaming                   | ⚠️ Bị chặn (giới hạn 2000 ký tự)                  |

## Đích phân phối (CLI/Cron)

- Dùng chat id làm đích.
- Ví dụ: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Khắc phục sự cố

**Bot không phản hồi:**

- Kiểm tra token có hợp lệ không: `openclaw channels status --probe`
- Xác minh người gửi đã được phê duyệt (ghép đôi hoặc allowFrom)
- Kiểm tra log Gateway: `openclaw logs --follow`

**Webhook không nhận sự kiện:**

- Đảm bảo URL Webhook dùng HTTPS
- Xác minh token secret dài 8-256 ký tự
- Xác nhận endpoint HTTP của Gateway có thể truy cập được trên đường dẫn đã cấu hình
- Kiểm tra polling getUpdates không đang chạy (chúng loại trừ lẫn nhau)

## Tham chiếu cấu hình (Zalo)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Các khóa cấp cao dạng phẳng (`channels.zalo.botToken`, `channels.zalo.dmPolicy` và tương tự) là dạng viết tắt một tài khoản kế thừa. Nên dùng `channels.zalo.accounts.<id>.*` cho cấu hình mới. Cả hai dạng vẫn được ghi lại ở đây vì chúng tồn tại trong schema.

Tùy chọn provider:

- `channels.zalo.enabled`: bật/tắt khởi động kênh.
- `channels.zalo.botToken`: token bot từ Zalo Bot Platform.
- `channels.zalo.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlink bị từ chối.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.zalo.allowFrom`: danh sách cho phép DM (ID người dùng). `open` yêu cầu `"*"`. Trình hướng dẫn sẽ yêu cầu ID dạng số.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist). Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) để biết hành vi hiện tại của bot Marketplace.
- `channels.zalo.groupAllowFrom`: danh sách cho phép người gửi trong nhóm (ID người dùng). Quay về `allowFrom` khi chưa đặt.
- `channels.zalo.mediaMaxMb`: giới hạn media đến/gửi đi (MB, mặc định 5).
- `channels.zalo.webhookUrl`: bật chế độ Webhook (yêu cầu HTTPS).
- `channels.zalo.webhookSecret`: Webhook secret (8-256 ký tự).
- `channels.zalo.webhookPath`: đường dẫn Webhook trên máy chủ HTTP của Gateway.
- `channels.zalo.proxy`: URL proxy cho yêu cầu API.

Tùy chọn nhiều tài khoản:

- `channels.zalo.accounts.<id>.botToken`: token theo từng tài khoản.
- `channels.zalo.accounts.<id>.tokenFile`: tệp token thông thường theo từng tài khoản. Symlink bị từ chối.
- `channels.zalo.accounts.<id>.name`: tên hiển thị.
- `channels.zalo.accounts.<id>.enabled`: bật/tắt tài khoản.
- `channels.zalo.accounts.<id>.dmPolicy`: chính sách DM theo từng tài khoản.
- `channels.zalo.accounts.<id>.allowFrom`: danh sách cho phép theo từng tài khoản.
- `channels.zalo.accounts.<id>.groupPolicy`: chính sách nhóm theo từng tài khoản. Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) để biết hành vi hiện tại của bot Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: danh sách cho phép người gửi trong nhóm theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookSecret`: Webhook secret theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookPath`: đường dẫn Webhook theo từng tài khoản.
- `channels.zalo.accounts.<id>.proxy`: URL proxy theo từng tài khoản.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng theo lượt nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
