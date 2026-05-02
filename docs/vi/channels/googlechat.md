---
read_when:
    - Đang phát triển các tính năng kênh Google Chat
summary: Trạng thái hỗ trợ, khả năng và cấu hình của ứng dụng Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T10:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Trạng thái: Plugin có thể tải xuống cho tin nhắn trực tiếp + không gian qua Webhook của Google Chat API (chỉ HTTP).

## Cài đặt

Cài đặt Google Chat trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/googlechat
```

Bản checkout cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Thiết lập nhanh (người mới bắt đầu)

1. Tạo một dự án Google Cloud và bật **Google Chat API**.
   - Truy cập: [Thông tin xác thực Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Bật API nếu API chưa được bật.
2. Tạo một **Tài khoản dịch vụ**:
   - Nhấn **Create Credentials** > **Service Account**.
   - Đặt tên tùy ý (ví dụ: `openclaw-chat`).
   - Để trống quyền (nhấn **Continue**).
   - Để trống các principal có quyền truy cập (nhấn **Done**).
3. Tạo và tải xuống **Khóa JSON**:
   - Trong danh sách tài khoản dịch vụ, nhấp vào tài khoản bạn vừa tạo.
   - Chuyển đến thẻ **Keys**.
   - Nhấp **Add Key** > **Create new key**.
   - Chọn **JSON** và nhấn **Create**.
4. Lưu tệp JSON đã tải xuống trên máy chủ gateway của bạn (ví dụ: `~/.openclaw/googlechat-service-account.json`).
5. Tạo một ứng dụng Google Chat trong [Cấu hình Chat trên Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Điền **Thông tin ứng dụng**:
     - **Tên ứng dụng**: (ví dụ: `OpenClaw`)
     - **URL ảnh đại diện**: (ví dụ: `https://openclaw.ai/logo.png`)
     - **Mô tả**: (ví dụ: `Personal AI Assistant`)
   - Bật **Tính năng tương tác**.
   - Trong **Chức năng**, chọn **Tham gia không gian và cuộc trò chuyện nhóm**.
   - Trong **Cài đặt kết nối**, chọn **URL điểm cuối HTTP**.
   - Trong **Trình kích hoạt**, chọn **Sử dụng một URL điểm cuối HTTP chung cho tất cả trình kích hoạt** và đặt thành URL công khai của gateway, theo sau là `/googlechat`.
     - _Mẹo: Chạy `openclaw status` để tìm URL công khai của gateway._
   - Trong **Mức độ hiển thị**, chọn **Cung cấp ứng dụng Chat này cho những người và nhóm cụ thể trong `<Your Domain>`**.
   - Nhập địa chỉ email của bạn (ví dụ: `user@example.com`) vào hộp văn bản.
   - Nhấp **Save** ở cuối trang.
6. **Bật trạng thái ứng dụng**:
   - Sau khi lưu, **làm mới trang**.
   - Tìm phần **Trạng thái ứng dụng** (thường ở gần đầu hoặc cuối trang sau khi lưu).
   - Đổi trạng thái thành **Live - available to users**.
   - Nhấp **Save** lần nữa.
7. Cấu hình OpenClaw với đường dẫn tài khoản dịch vụ + đối tượng Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Hoặc cấu hình: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Đặt loại + giá trị đối tượng Webhook (khớp với cấu hình ứng dụng Chat của bạn).
9. Khởi động gateway. Google Chat sẽ POST tới đường dẫn Webhook của bạn.

## Thêm vào Google Chat

Sau khi gateway đang chạy và email của bạn đã được thêm vào danh sách hiển thị:

1. Truy cập [Google Chat](https://chat.google.com/).
2. Nhấp biểu tượng **+** (dấu cộng) bên cạnh **Tin nhắn trực tiếp**.
3. Trong thanh tìm kiếm (nơi bạn thường thêm người), nhập **Tên ứng dụng** bạn đã cấu hình trong Google Cloud Console.
   - **Lưu ý**: Bot sẽ _không_ xuất hiện trong danh sách duyệt "Marketplace" vì đây là ứng dụng riêng tư. Bạn phải tìm kiếm bằng tên.
4. Chọn bot của bạn từ kết quả.
5. Nhấp **Add** hoặc **Chat** để bắt đầu cuộc trò chuyện 1:1.
6. Gửi "Xin chào" để kích hoạt trợ lý!

## URL công khai (chỉ Webhook)

Webhook của Google Chat yêu cầu một điểm cuối HTTPS công khai. Vì lý do bảo mật, **chỉ để lộ đường dẫn `/googlechat`** ra internet. Giữ bảng điều khiển OpenClaw và các điểm cuối nhạy cảm khác trên mạng riêng của bạn.

### Tùy chọn A: Tailscale Funnel (Được khuyến nghị)

Dùng Tailscale Serve cho bảng điều khiển riêng tư và Funnel cho đường dẫn Webhook công khai. Cách này giữ `/` ở chế độ riêng tư trong khi chỉ để lộ `/googlechat`.

1. **Kiểm tra gateway của bạn đang được bind vào địa chỉ nào:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Ghi lại địa chỉ IP (ví dụ: `127.0.0.1`, `0.0.0.0`, hoặc IP Tailscale của bạn như `100.x.x.x`).

2. **Chỉ để lộ bảng điều khiển cho tailnet (cổng 8443):**

   ```bash
   # Nếu bind vào localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Nếu chỉ bind vào IP Tailscale (ví dụ: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Chỉ để lộ công khai đường dẫn Webhook:**

   ```bash
   # Nếu bind vào localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Nếu chỉ bind vào IP Tailscale (ví dụ: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Ủy quyền Node để truy cập Funnel:**
   Nếu được nhắc, hãy truy cập URL ủy quyền hiển thị trong đầu ra để bật Funnel cho Node này trong chính sách tailnet của bạn.

5. **Xác minh cấu hình:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook công khai của bạn sẽ là:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Bảng điều khiển riêng tư của bạn vẫn chỉ dành cho tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Dùng URL công khai (không có `:8443`) trong cấu hình ứng dụng Google Chat.

> Lưu ý: Cấu hình này vẫn tồn tại qua các lần khởi động lại. Để xóa sau này, chạy `tailscale funnel reset` và `tailscale serve reset`.

### Tùy chọn B: Reverse Proxy (Caddy)

Nếu bạn dùng reverse proxy như Caddy, chỉ proxy đường dẫn cụ thể:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Với cấu hình này, mọi yêu cầu tới `your-domain.com/` sẽ bị bỏ qua hoặc trả về 404, trong khi `your-domain.com/googlechat` được định tuyến an toàn tới OpenClaw.

### Tùy chọn C: Cloudflare Tunnel

Cấu hình các quy tắc ingress của tunnel để chỉ định tuyến đường dẫn Webhook:

- **Đường dẫn**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Quy tắc mặc định**: HTTP 404 (Không tìm thấy)

## Cách hoạt động

1. Google Chat gửi các webhook POST tới gateway. Mỗi yêu cầu bao gồm header `Authorization: Bearer <token>`.
   - OpenClaw xác minh bearer auth trước khi đọc/phân tích cú pháp toàn bộ body Webhook khi có header.
   - Các yêu cầu Google Workspace Add-on mang `authorizationEventObject.systemIdToken` trong body được hỗ trợ qua ngân sách body tiền xác thực nghiêm ngặt hơn.
2. OpenClaw xác minh token theo `audienceType` + `audience` đã cấu hình:
   - `audienceType: "app-url"` → audience là URL Webhook HTTPS của bạn.
   - `audienceType: "project-number"` → audience là số dự án Cloud.
3. Tin nhắn được định tuyến theo không gian:
   - Tin nhắn trực tiếp dùng khóa phiên `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Không gian dùng khóa phiên `agent:<agentId>:googlechat:group:<spaceId>`.
4. Quyền truy cập tin nhắn trực tiếp mặc định là ghép nối. Người gửi không xác định nhận được mã ghép nối; phê duyệt bằng:
   - `openclaw pairing approve googlechat <code>`
5. Không gian nhóm mặc định yêu cầu @-mention. Dùng `botUser` nếu phát hiện mention cần tên người dùng của ứng dụng.

## Đích

Dùng các định danh này cho việc gửi và danh sách cho phép:

- Tin nhắn trực tiếp: `users/<userId>` (được khuyến nghị).
- Email thô `name@example.com` có thể thay đổi và chỉ được dùng để khớp danh sách cho phép trực tiếp khi `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Không dùng nữa: `users/<email>` được xử lý là id người dùng, không phải danh sách cho phép email.
- Không gian: `spaces/<spaceId>`.

## Điểm nổi bật về cấu hình

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Ghi chú:

- Thông tin xác thực tài khoản dịch vụ cũng có thể được truyền inline bằng `serviceAccount` (chuỗi JSON).
- `serviceAccountRef` cũng được hỗ trợ (env/file SecretRef), bao gồm các ref theo từng tài khoản trong `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Đường dẫn Webhook mặc định là `/googlechat` nếu `webhookPath` chưa được đặt.
- `dangerouslyAllowNameMatching` bật lại tính năng khớp principal email có thể thay đổi cho danh sách cho phép (chế độ tương thích khẩn cấp).
- Phản ứng có sẵn qua công cụ `reactions` và `channels action` khi `actions.reactions` được bật.
- Hành động tin nhắn cung cấp `send` cho văn bản và `upload-file` để gửi tệp đính kèm rõ ràng. `upload-file` chấp nhận `media` / `filePath` / `path` cùng với `message`, `filename`, và đích thread tùy chọn.
- `typingIndicator` hỗ trợ `none`, `message` (mặc định), và `reaction` (reaction yêu cầu OAuth người dùng).
- Tệp đính kèm được tải xuống qua Chat API và lưu trong pipeline media (kích thước bị giới hạn bởi `mediaMaxMb`).

Chi tiết tham chiếu secrets: [Quản lý secrets](/vi/gateway/secrets).

## Khắc phục sự cố

### 405 Phương thức không được phép

Nếu Google Cloud Logs Explorer hiển thị lỗi như:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Điều này nghĩa là handler Webhook chưa được đăng ký. Nguyên nhân thường gặp:

1. **Kênh chưa được cấu hình**: Phần `channels.googlechat` bị thiếu trong cấu hình của bạn. Xác minh bằng:

   ```bash
   openclaw config get channels.googlechat
   ```

   Nếu trả về "Config path not found", hãy thêm cấu hình (xem [Điểm nổi bật về cấu hình](#config-highlights)).

2. **Plugin chưa được bật**: Kiểm tra trạng thái Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Nếu hiển thị "disabled", hãy thêm `plugins.entries.googlechat.enabled: true` vào cấu hình của bạn.

3. **Gateway chưa được khởi động lại**: Sau khi thêm cấu hình, khởi động lại gateway:

   ```bash
   openclaw gateway restart
   ```

Xác minh kênh đang chạy:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Vấn đề khác

- Kiểm tra `openclaw channels status --probe` để xem lỗi xác thực hoặc cấu hình audience bị thiếu.
- Nếu không có tin nhắn nào đến, xác nhận URL Webhook + đăng ký sự kiện của ứng dụng Chat.
- Nếu cổng mention chặn phản hồi, đặt `botUser` thành tên tài nguyên người dùng của ứng dụng và xác minh `requireMention`.
- Dùng `openclaw logs --follow` trong khi gửi tin nhắn kiểm thử để xem các yêu cầu có đến gateway hay không.

Tài liệu liên quan:

- [Cấu hình Gateway](/vi/gateway/configuration)
- [Bảo mật](/vi/gateway/security)
- [Phản ứng](/vi/tools/reactions)

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng mention
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
