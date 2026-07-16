---
read_when:
    - Đang phát triển các tính năng của kênh Nextcloud Talk
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T14:02:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk là một plugin kênh có thể tải xuống (`@openclaw/nextcloud-talk`), kết nối OpenClaw với một phiên bản Nextcloud tự lưu trữ thông qua bot webhook Talk. Hỗ trợ tin nhắn trực tiếp, phòng, phản ứng và tin nhắn markdown; nội dung đa phương tiện được gửi dưới dạng URL.

## Cài đặt

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Sử dụng đặc tả gói trần để theo dõi thẻ phát hành chính thức hiện tại. Chỉ ghim một phiên bản chính xác khi cần một quy trình cài đặt có thể tái lập.

Từ một bản checkout cục bộ (quy trình phát triển):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Khởi động lại Gateway sau khi cài đặt. Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh (cho người mới bắt đầu)

1. Cài đặt plugin (ở trên).
2. Trên máy chủ Nextcloud, tạo một bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Giữ lại `--feature response`: nếu không có, các phản hồi gửi đi sẽ thất bại với mã 401. Sửa một bot hiện có bằng `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Bật bot trong phần cài đặt của phòng đích.
4. Cấu hình OpenClaw:
   - Cấu hình: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc biến môi trường: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)

   Thiết lập bằng CLI (`--url`/`--token` là bí danh của các trường tường minh; `nc-talk` và `nc` hoạt động như bí danh kênh):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Các trường tường minh tương đương:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Bí mật lưu trong tệp:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Khởi động lại Gateway (hoặc hoàn tất thiết lập).

Cấu hình tối thiểu:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Lưu ý

- Bot không thể chủ động bắt đầu tin nhắn trực tiếp. Người dùng phải nhắn tin cho bot trước.
- URL webhook phải có thể truy cập được từ máy chủ Nextcloud; đặt `webhookPublicUrl` khi Gateway nằm sau proxy. Yêu cầu webhook được ký bằng HMAC-SHA256 với bí mật của bot; chữ ký không hợp lệ sẽ bị từ chối và giới hạn tốc độ.
- API bot không hỗ trợ tải nội dung đa phương tiện lên; nội dung đa phương tiện gửi đi được nối thêm dưới dạng một dòng `Attachment: <url>`.
- Tải trọng webhook không phân biệt tin nhắn trực tiếp với phòng; đặt `apiUser` + `apiPassword` để bật tra cứu loại phòng (được lưu vào bộ nhớ đệm khoảng 5 phút). Nếu không có chúng, mọi cuộc trò chuyện đều được xử lý như một phòng.
- Các yêu cầu gửi đi đi qua cơ chế bảo vệ SSRF. Với máy chủ Nextcloud trên mạng riêng/nội bộ đáng tin cậy, hãy chủ động cho phép bằng `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Khi đã đặt `apiUser`/`apiPassword` và `webhookPublicUrl`, `openclaw channels status` sẽ thăm dò bot và cảnh báo khi thiếu tính năng `response`.

## Kiểm soát truy cập (tin nhắn trực tiếp)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định sẽ nhận được mã ghép nối.
- Phê duyệt qua:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Tin nhắn trực tiếp công khai: `channels.nextcloud-talk.dmPolicy="open"` cùng với `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp với ID người dùng Nextcloud (được chuyển thành chữ thường); tên hiển thị bị bỏ qua.

## Phòng (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (yêu cầu đề cập).
- Cho phép các phòng bằng danh sách cho phép `channels.nextcloud-talk.rooms`, với khóa là token của phòng; `"*"` đặt giá trị mặc định bằng ký tự đại diện:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Các khóa theo từng phòng: `requireMention` (mặc định là true), `enabled` (false sẽ vô hiệu hóa phòng), `allowFrom` (danh sách cho phép người gửi theo từng phòng), `tools` (ghi đè cho phép/từ chối công cụ), `skills` (giới hạn Skills được tải), `systemPrompt`.
- Để không cho phép phòng nào, hãy để trống danh sách cho phép hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng          | Trạng thái             |
| ------------------ | ---------------------- |
| Tin nhắn trực tiếp | Được hỗ trợ            |
| Phòng              | Được hỗ trợ            |
| Luồng thảo luận    | Không được hỗ trợ      |
| Nội dung đa phương tiện | Chỉ URL           |
| Phản ứng           | Được hỗ trợ            |
| Lệnh gốc           | Không được hỗ trợ      |

## Tham chiếu cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.nextcloud-talk.enabled`: bật/tắt quá trình khởi động kênh.
- `channels.nextcloud-talk.baseUrl`: URL phiên bản Nextcloud.
- `channels.nextcloud-talk.botSecret`: bí mật dùng chung của bot (chuỗi hoặc tham chiếu bí mật).
- `channels.nextcloud-talk.botSecretFile`: đường dẫn bí mật đến tệp thông thường. Liên kết tượng trưng bị từ chối.
- `channels.nextcloud-talk.apiUser`: người dùng API để tra cứu phòng (phát hiện tin nhắn trực tiếp) và thăm dò trạng thái.
- `channels.nextcloud-talk.apiPassword`: mật khẩu API/ứng dụng để tra cứu phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn tệp mật khẩu API.
- `channels.nextcloud-talk.webhookPort`: cổng trình lắng nghe webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: máy chủ webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: ghép nối). `open` yêu cầu `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: danh sách cho phép tin nhắn trực tiếp (ID người dùng).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (mặc định: danh sách cho phép).
- `channels.nextcloud-talk.groupAllowFrom`: danh sách cho phép người gửi trong phòng (ID người dùng); dự phòng về `allowFrom` khi chưa đặt.
- `channels.nextcloud-talk.rooms`: cài đặt và danh sách cho phép theo từng phòng (xem ở trên).
- Có thể tham chiếu các nhóm truy cập tĩnh của người gửi từ `allowFrom` và `groupAllowFrom` bằng `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 sẽ vô hiệu hóa).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp (0 sẽ vô hiệu hóa).
- `channels.nextcloud-talk.dms`: ghi đè theo từng tin nhắn trực tiếp, với khóa là ID người dùng (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: kích thước phân đoạn văn bản gửi đi, tính bằng ký tự (mặc định: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (mặc định) hoặc `newline` để phân tách tại các dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.nextcloud-talk.streaming.block.enabled`: bật hoặc tắt truyền phát theo khối cho kênh này.
- `channels.nextcloud-talk.streaming.block.coalesce`: tinh chỉnh việc hợp nhất khi truyền phát theo khối.
- `channels.nextcloud-talk.responsePrefix`: tiền tố phản hồi gửi đi.
- `channels.nextcloud-talk.markdown.tables`: chế độ kết xuất bảng markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn nội dung đa phương tiện đến (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: cho phép máy chủ Nextcloud riêng/nội bộ vượt qua cơ chế bảo vệ SSRF.
- `channels.nextcloud-talk.accounts.<id>`: ghi đè theo từng tài khoản (cùng các khóa); `defaultAccount` chọn tài khoản mặc định. Các biến môi trường `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` chỉ áp dụng cho tài khoản mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — luồng xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
