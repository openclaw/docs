---
read_when:
    - Làm việc với các tính năng Zalo hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-29T22:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Trạng thái: thử nghiệm. Hỗ trợ DM. Phần [Khả năng](#capabilities) bên dưới phản ánh hành vi hiện tại của bot Marketplace.

## Plugin đi kèm

Zalo được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, nên các bản dựng đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng một bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Zalo, hãy cài đặt một gói npm hiện tại khi gói đó được phát hành:

- Cài đặt qua CLI: `openclaw plugins install @openclaw/zalo`
- Hoặc từ checkout mã nguồn: `openclaw plugins install ./path/to/local/zalo-plugin`
- Chi tiết: [Plugin](/vi/tools/plugin)

Nếu npm báo gói do OpenClaw sở hữu là đã ngừng dùng, hãy dùng một bản dựng OpenClaw đóng gói hiện tại hoặc đường dẫn checkout cục bộ cho đến khi một gói npm mới hơn được phát hành.

## Thiết lập nhanh (người mới)

1. Đảm bảo Plugin Zalo có sẵn.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã bao gồm nó.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Đặt token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Hoặc cấu hình: `channels.zalo.accounts.default.botToken: "..."`.
3. Khởi động lại gateway (hoặc hoàn tất thiết lập).
4. Quyền truy cập DM mặc định dùng ghép nối; phê duyệt mã ghép nối ở lần liên hệ đầu tiên.

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

Zalo là ứng dụng nhắn tin tập trung vào Việt Nam; Bot API của nó cho phép Gateway chạy bot cho các cuộc trò chuyện 1:1.
Nó phù hợp cho hỗ trợ hoặc thông báo khi bạn muốn định tuyến xác định quay lại Zalo.

Trang này phản ánh hành vi OpenClaw hiện tại cho **bot Zalo Bot Creator / Marketplace**.
**Bot Zalo Official Account (OA)** là một bề mặt sản phẩm Zalo khác và có thể hoạt động khác.

- Một kênh Zalo Bot API do Gateway sở hữu.
- Định tuyến xác định: phản hồi quay lại Zalo; mô hình không bao giờ chọn kênh.
- DM dùng chung phiên chính của agent.
- Phần [Khả năng](#capabilities) bên dưới hiển thị hỗ trợ hiện tại của bot Marketplace.

## Thiết lập (đường nhanh)

### 1) Tạo bot token (Zalo Bot Platform)

1. Truy cập [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) và đăng nhập.
2. Tạo bot mới và cấu hình cài đặt của bot.
3. Sao chép toàn bộ bot token (thường là `numeric_id:secret`). Với bot Marketplace, token runtime dùng được có thể xuất hiện trong tin nhắn chào mừng của bot sau khi tạo.

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

Nếu sau này bạn chuyển sang một bề mặt bot Zalo có nhóm, bạn có thể thêm cấu hình riêng cho nhóm như `groupPolicy` và `groupAllowFrom` một cách tường minh. Với hành vi bot Marketplace hiện tại, xem [Khả năng](#capabilities).

Tùy chọn env: `ZALO_BOT_TOKEN=...` (chỉ hoạt động cho tài khoản mặc định).

Hỗ trợ nhiều tài khoản: dùng `channels.zalo.accounts` với token theo từng tài khoản và `name` tùy chọn.

3. Khởi động lại gateway. Zalo khởi động khi token được phân giải (env hoặc cấu hình).
4. Quyền truy cập DM mặc định là ghép nối. Phê duyệt mã khi bot được liên hệ lần đầu.

## Cách hoạt động (hành vi)

- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung với placeholder media.
- Phản hồi luôn định tuyến lại cùng cuộc trò chuyện Zalo.
- Mặc định dùng long-polling; chế độ webhook có sẵn với `channels.zalo.webhookUrl`.

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn 2000 ký tự (giới hạn Zalo API).
- Tải xuống/tải lên media bị giới hạn bởi `channels.zalo.mediaMaxMb` (mặc định 5).
- Streaming bị chặn theo mặc định vì giới hạn 2000 ký tự khiến streaming kém hữu ích hơn.

## Kiểm soát truy cập (DM)

### Quyền truy cập DM

- Mặc định: `channels.zalo.dmPolicy = "pairing"`. Người gửi không xác định nhận mã ghép nối; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
- Phê duyệt qua:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Ghép nối là trao đổi token mặc định. Chi tiết: [Ghép nối](/vi/channels/pairing)
- `channels.zalo.allowFrom` chấp nhận ID người dùng dạng số (không có tra cứu tên người dùng).

## Kiểm soát truy cập (Nhóm)

Với **bot Zalo Bot Creator / Marketplace**, trên thực tế hỗ trợ nhóm không khả dụng vì bot hoàn toàn không thể được thêm vào nhóm.

Điều đó có nghĩa là các khóa cấu hình liên quan đến nhóm bên dưới tồn tại trong schema, nhưng không dùng được cho bot Marketplace:

- `channels.zalo.groupPolicy` kiểm soát xử lý tin nhắn nhóm đến: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` giới hạn ID người gửi nào có thể kích hoạt bot trong nhóm.
- Nếu `groupAllowFrom` không được đặt, Zalo quay về `allowFrom` để kiểm tra người gửi.
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.zalo`, runtime vẫn quay về `groupPolicy="allowlist"` để an toàn.

Các giá trị chính sách nhóm (khi quyền truy cập nhóm khả dụng trên bề mặt bot của bạn) là:

- `groupPolicy: "disabled"` — chặn tất cả tin nhắn nhóm.
- `groupPolicy: "open"` — cho phép bất kỳ thành viên nhóm nào (có cổng mention).
- `groupPolicy: "allowlist"` — mặc định đóng khi lỗi; chỉ chấp nhận người gửi được cho phép.

Nếu bạn đang dùng một bề mặt sản phẩm bot Zalo khác và đã xác minh hành vi nhóm hoạt động, hãy tài liệu hóa riêng thay vì giả định nó khớp với luồng bot Marketplace.

## Long-polling so với webhook

- Mặc định: long-polling (không cần URL công khai).
- Chế độ Webhook: đặt `channels.zalo.webhookUrl` và `channels.zalo.webhookSecret`.
  - Webhook secret phải dài 8-256 ký tự.
  - Webhook URL phải dùng HTTPS.
  - Zalo gửi sự kiện với header `X-Bot-Api-Secret-Token` để xác minh.
  - HTTP của Gateway xử lý yêu cầu webhook tại `channels.zalo.webhookPath` (mặc định là đường dẫn URL webhook).
  - Yêu cầu phải dùng `Content-Type: application/json` (hoặc loại media `+json`).
  - Sự kiện trùng lặp (`event_name + message_id`) bị bỏ qua trong một cửa sổ phát lại ngắn.
  - Lưu lượng tăng đột biến bị giới hạn tốc độ theo đường dẫn/nguồn và có thể trả về HTTP 429.

**Lưu ý:** getUpdates (polling) và webhook loại trừ lẫn nhau theo tài liệu Zalo API.

## Loại tin nhắn được hỗ trợ

Để xem ảnh chụp nhanh hỗ trợ, xem [Khả năng](#capabilities). Các ghi chú bên dưới bổ sung chi tiết ở những nơi hành vi cần thêm ngữ cảnh.

- **Tin nhắn văn bản**: Hỗ trợ đầy đủ với chia đoạn 2000 ký tự.
- **URL thuần trong văn bản**: Hoạt động như đầu vào văn bản thông thường.
- **Xem trước liên kết / thẻ liên kết phong phú**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); chúng không kích hoạt phản hồi một cách đáng tin cậy.
- **Tin nhắn hình ảnh**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); xử lý hình ảnh đến không ổn định (chỉ báo đang nhập mà không có phản hồi cuối).
- **Nhãn dán**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Ghi chú thoại / tệp âm thanh / video / tệp đính kèm chung**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Loại không được hỗ trợ**: Được ghi log (ví dụ: tin nhắn từ người dùng được bảo vệ).

## Khả năng

Bảng này tóm tắt hành vi hiện tại của **bot Zalo Bot Creator / Marketplace** trong OpenClaw.

| Tính năng                   | Trạng thái                                         |
| --------------------------- | -------------------------------------------------- |
| Tin nhắn trực tiếp          | ✅ Được hỗ trợ                                     |
| Nhóm                        | ❌ Không khả dụng cho bot Marketplace              |
| Media (hình ảnh đến)        | ⚠️ Hạn chế / xác minh trong môi trường của bạn     |
| Media (hình ảnh gửi đi)     | ⚠️ Chưa kiểm thử lại cho bot Marketplace           |
| URL thuần trong văn bản     | ✅ Được hỗ trợ                                     |
| Xem trước liên kết          | ⚠️ Không ổn định cho bot Marketplace               |
| Phản ứng                    | ❌ Không được hỗ trợ                               |
| Nhãn dán                    | ⚠️ Không có phản hồi agent cho bot Marketplace     |
| Ghi chú thoại / âm thanh / video | ⚠️ Không có phản hồi agent cho bot Marketplace |
| Tệp đính kèm                | ⚠️ Không có phản hồi agent cho bot Marketplace     |
| Luồng                       | ❌ Không được hỗ trợ                               |
| Bình chọn                   | ❌ Không được hỗ trợ                               |
| Lệnh gốc                    | ❌ Không được hỗ trợ                               |
| Streaming                   | ⚠️ Bị chặn (giới hạn 2000 ký tự)                   |

## Đích gửi (CLI/cron)

- Dùng chat id làm đích.
- Ví dụ: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Khắc phục sự cố

**Bot không phản hồi:**

- Kiểm tra token hợp lệ: `openclaw channels status --probe`
- Xác minh người gửi đã được phê duyệt (ghép nối hoặc allowFrom)
- Kiểm tra log gateway: `openclaw logs --follow`

**Webhook không nhận sự kiện:**

- Đảm bảo webhook URL dùng HTTPS
- Xác minh secret token dài 8-256 ký tự
- Xác nhận endpoint HTTP của gateway có thể truy cập được trên đường dẫn đã cấu hình
- Kiểm tra rằng getUpdates polling không đang chạy (chúng loại trừ lẫn nhau)

## Tham chiếu cấu hình (Zalo)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Các khóa phẳng cấp cao nhất (`channels.zalo.botToken`, `channels.zalo.dmPolicy` và tương tự) là dạng viết tắt một tài khoản kế thừa. Ưu tiên `channels.zalo.accounts.<id>.*` cho cấu hình mới. Cả hai dạng vẫn được tài liệu hóa ở đây vì chúng tồn tại trong schema.

Tùy chọn provider:

- `channels.zalo.enabled`: bật/tắt khởi động kênh.
- `channels.zalo.botToken`: bot token từ Zalo Bot Platform.
- `channels.zalo.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlink bị từ chối.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID người dùng). `open` yêu cầu `"*"`. Wizard sẽ hỏi ID dạng số.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist). Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) để biết hành vi bot Marketplace hiện tại.
- `channels.zalo.groupAllowFrom`: allowlist người gửi nhóm (ID người dùng). Quay về `allowFrom` khi không được đặt.
- `channels.zalo.mediaMaxMb`: giới hạn media đến/gửi đi (MB, mặc định 5).
- `channels.zalo.webhookUrl`: bật chế độ webhook (yêu cầu HTTPS).
- `channels.zalo.webhookSecret`: webhook secret (8-256 ký tự).
- `channels.zalo.webhookPath`: đường dẫn webhook trên máy chủ HTTP gateway.
- `channels.zalo.proxy`: proxy URL cho yêu cầu API.

Tùy chọn nhiều tài khoản:

- `channels.zalo.accounts.<id>.botToken`: token theo từng tài khoản.
- `channels.zalo.accounts.<id>.tokenFile`: tệp token thông thường theo từng tài khoản. Symlink bị từ chối.
- `channels.zalo.accounts.<id>.name`: tên hiển thị.
- `channels.zalo.accounts.<id>.enabled`: bật/tắt tài khoản.
- `channels.zalo.accounts.<id>.dmPolicy`: chính sách DM theo từng tài khoản.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist theo từng tài khoản.
- `channels.zalo.accounts.<id>.groupPolicy`: chính sách nhóm theo từng tài khoản. Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) để biết hành vi bot Marketplace hiện tại.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist người gửi nhóm theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookUrl`: webhook URL theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookSecret`: webhook secret theo từng tài khoản.
- `channels.zalo.accounts.<id>.webhookPath`: đường dẫn webhook theo từng tài khoản.
- `channels.zalo.accounts.<id>.proxy`: proxy URL theo từng tài khoản.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng mention
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
