---
read_when:
    - Phát triển các tính năng của kênh Google Chat
summary: Trạng thái hỗ trợ, khả năng và cấu hình ứng dụng Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-19T17:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5300ce6da3bf69136b7286dc87f14a5809c5f28a206c881a95f520376304b97d
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat hoạt động dưới dạng plugin `@openclaw/googlechat` chính thức: hỗ trợ tin nhắn trực tiếp và không gian thông qua webhook của Google Chat API (chỉ điểm cuối HTTP, không có Pub/Sub).

## Cài đặt

```bash
openclaw plugins install @openclaw/googlechat
```

Bản checkout cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Thiết lập nhanh (cho người mới bắt đầu)

1. Tạo một dự án Google Cloud và bật **Google Chat API**.
   - Truy cập: [Thông tin xác thực Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Bật API nếu API chưa được bật.
2. Tạo một **Service Account**:
   - Nhấn **Create Credentials** > **Service Account**.
   - Đặt tên tùy ý (ví dụ: `openclaw-chat`).
   - Để trống quyền và principal (**Continue**, sau đó **Done**).
3. Tạo và tải xuống **khóa JSON**:
   - Nhấp vào tài khoản dịch vụ mới > thẻ **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Lưu tệp JSON đã tải xuống trên máy chủ Gateway (ví dụ: `~/.openclaw/googlechat-service-account.json`).
5. Tạo ứng dụng Google Chat trong [phần cấu hình Chat của Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Điền **Application info** (tên ứng dụng, URL ảnh đại diện, mô tả).
   - Bật **Interactive features**.
   - Trong **Functionality**, chọn **Join spaces and group conversations**.
   - Trong **Connection settings**, chọn **HTTP endpoint URL**.
   - Trong **Triggers**, chọn **Use a common HTTP endpoint URL for all triggers** và đặt thành URL Gateway công khai, theo sau bởi `/googlechat` (xem [URL công khai](#public-url-webhook-only)).
   - Trong **Visibility**, chọn **Make this Chat app available to specific people and groups in `<Your Domain>`** và nhập địa chỉ email của bạn.
   - Nhấp vào **Save**.
6. Bật trạng thái ứng dụng: làm mới trang, tìm **App status**, đặt thành **Live - available to users**, rồi nhấp vào **Save** lần nữa.
7. Cấu hình OpenClaw bằng tài khoản dịch vụ và đối tượng nhận webhook (phải khớp với cấu hình ứng dụng Chat):
   - Biến môi trường: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (chỉ tài khoản mặc định), hoặc
   - Cấu hình: xem [Các điểm chính về cấu hình](#config-highlights). `openclaw channels add --channel googlechat` cũng chấp nhận `--audience-type`, `--audience`, `--webhook-path` và `--webhook-url`.
8. Khởi động Gateway. Google Chat sẽ gửi yêu cầu POST đến đường dẫn webhook của bạn (mặc định là `/googlechat`).

## Thêm vào Google Chat

Sau khi Gateway đang chạy và email của bạn nằm trong danh sách hiển thị:

1. Truy cập [Google Chat](https://chat.google.com/).
2. Nhấp vào biểu tượng **+** (dấu cộng) bên cạnh **Direct Messages**.
3. Tìm **App name** mà bạn đã cấu hình trong Google Cloud Console.
   - Bot _không_ xuất hiện trong danh sách duyệt Marketplace vì đây là ứng dụng riêng tư; hãy tìm theo tên.
4. Chọn bot, nhấp vào **Add** hoặc **Chat**, rồi gửi tin nhắn.

## URL công khai (chỉ Webhook)

Webhook Google Chat yêu cầu một điểm cuối HTTPS công khai. Để bảo mật, chỉ cung cấp **đường dẫn `/googlechat`** ra internet và giữ bảng điều khiển OpenClaw cùng các điểm cuối khác ở chế độ riêng tư.

### Tùy chọn A: Tailscale Funnel (Khuyến nghị)

Sử dụng Tailscale Serve cho bảng điều khiển riêng tư và Funnel cho đường dẫn webhook công khai.

1. Kiểm tra địa chỉ mà Gateway đang liên kết:

   ```bash
   ss -tlnp | grep 18789
   ```

   Ghi lại địa chỉ IP (ví dụ: `127.0.0.1`, `0.0.0.0` hoặc địa chỉ Tailscale `100.x.x.x`).

2. Chỉ cung cấp bảng điều khiển cho tailnet (cổng 8443):

   ```bash
   # Nếu được liên kết với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Nếu chỉ được liên kết với IP Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Chỉ cung cấp công khai đường dẫn webhook:

   ```bash
   # Nếu được liên kết với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Nếu chỉ được liên kết với IP Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Nếu được nhắc, hãy truy cập URL ủy quyền hiển thị trong đầu ra để bật Funnel cho Node này.

5. Xác minh:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook công khai của bạn là `https://<node-name>.<tailnet>.ts.net/googlechat`; bảng điều khiển vẫn chỉ khả dụng trong tailnet tại `https://<node-name>.<tailnet>.ts.net:8443/`. Sử dụng URL công khai (không có `:8443`) trong cấu hình ứng dụng Google Chat.

> Lưu ý: Cấu hình này được duy trì qua các lần khởi động lại. Sau này, hãy xóa cấu hình bằng `tailscale funnel reset` và `tailscale serve reset`.

### Tùy chọn B: Proxy ngược (Caddy)

Chỉ proxy đường dẫn webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Các yêu cầu đến `your-domain.com/` bị bỏ qua hoặc trả về 404, trong khi `your-domain.com/googlechat` được định tuyến đến OpenClaw.

### Tùy chọn C: Cloudflare Tunnel

Cấu hình các quy tắc ingress của tunnel để chỉ định tuyến đường dẫn webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Cách hoạt động

1. Google Chat gửi JSON bằng phương thức POST đến đường dẫn webhook của Gateway (chỉ POST, bắt buộc loại nội dung JSON, giới hạn tốc độ theo IP).
2. OpenClaw xác thực mọi yêu cầu trước khi điều phối:
   - Các sự kiện ứng dụng Chat mang theo `Authorization: Bearer <token>`; token được xác minh trước khi toàn bộ phần thân được phân tích cú pháp.
   - Các sự kiện tiện ích bổ sung Google Workspace mang token trong phần thân (`authorizationEventObject.systemIdToken`) và được đọc với ngân sách tiền xác thực nghiêm ngặt hơn (16 KB, 3 s) trước khi xác minh.
3. Token được kiểm tra dựa trên `audienceType` + `audience`:
   - `audienceType: "app-url"` → đối tượng nhận là URL webhook HTTPS của bạn.
   - `audienceType: "project-number"` → đối tượng nhận là số dự án Cloud.
   - Token tiện ích bổ sung trong `app-url` còn yêu cầu `appPrincipal` được đặt thành mã ứng dụng khách OAuth 2.0 dạng số của ứng dụng (21 chữ số, không phải email); nếu không, quá trình xác minh sẽ thất bại và ghi lại cảnh báo.
4. Tin nhắn được định tuyến theo không gian:
   - Các không gian có phiên riêng cho từng không gian `agent:<agentId>:googlechat:group:<spaceId>`; phản hồi được gửi đến luồng tin nhắn.
   - Theo mặc định, tin nhắn trực tiếp được gộp vào phiên chính của tác nhân; đặt `session.dmScope` để sử dụng phiên tin nhắn trực tiếp riêng cho từng người dùng ngang hàng (xem [Phiên](/vi/concepts/session)).
5. Theo mặc định, quyền truy cập tin nhắn trực tiếp sử dụng ghép đôi. Người gửi không xác định sẽ nhận được mã ghép đôi; phê duyệt bằng:
   - `openclaw pairing approve googlechat <code>`
6. Theo mặc định, không gian nhóm yêu cầu đề cập bằng @. Các lượt đề cập được phát hiện từ chú thích `USER_MENTION` của Chat nhắm đến ứng dụng; đặt `botUser` (ví dụ: `users/1234567890`) nếu quá trình phát hiện cần tên tài nguyên người dùng của ứng dụng.
7. Khi quy trình phê duyệt lệnh thực thi hoặc plugin bắt đầu từ Google Chat và đã cấu hình người phê duyệt `users/<id>` ổn định, OpenClaw sẽ đăng thẻ phê duyệt gốc (`cardsV2`) trong không gian hoặc luồng ban đầu. Các nút trên thẻ mang token gọi lại dạng opaque; lời nhắc thủ công `/approve <id> <decision>` chỉ xuất hiện khi không thể gửi theo cách gốc.

### Độ bền của dữ liệu đầu vào

Sau khi xác thực yêu cầu, OpenClaw xóa đối tượng ủy quyền của tiện ích bổ sung khỏi bộ nhớ và đưa bền vững các sự kiện `MESSAGE` của Google Chat vào hàng đợi trước khi trả về `200`. Lỗi lưu trữ sẽ trả về `503`, cho phép Google Chat thử lại thay vì xác nhận một sự kiện có thể bị mất.

Các tin nhắn đang chờ xử lý hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại, tiếp tục được tuần tự hóa theo từng không gian và sử dụng tên tài nguyên tin nhắn Google Chat để ngăn các mục hàng đợi trùng lặp trong khi bản ghi hoàn thành đang hoạt động hoặc được giữ lại vẫn tồn tại. Các hành động không phải tin nhắn tiếp tục sử dụng đường dẫn webhook tách rời hiện có và không được bảo đảm bởi hàng đợi bền vững này. Việc phân phối vẫn bảo đảm ít nhất một lần qua ranh giới từ hàng đợi đến tác nhân, vì vậy sự cố trong lúc chuyển giao có thể phát lại một lượt.

## Đích

Sử dụng các mã định danh sau cho việc phân phối và danh sách cho phép:

- Tin nhắn trực tiếp: `users/<userId>` (khuyến nghị).
- Không gian: `spaces/<spaceId>`.
- Email thô `name@example.com` có thể thay đổi và chỉ được dùng để đối chiếu danh sách cho phép khi `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Đã ngừng khuyến nghị: `users/<email>` được coi là mã người dùng, không phải mục email trong danh sách cho phép.
- Các tiền tố `googlechat:`, `google-chat:` và `gchat:` được chấp nhận và loại bỏ.

## Các điểm chính về cấu hình

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // hoặc serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // chỉ dành cho xác minh tiện ích bổ sung; mã ứng dụng khách OAuth dạng số
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // tùy chọn; hỗ trợ phát hiện lượt đề cập
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Chỉ trả lời ngắn gọn.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Lưu ý:

- Thông tin xác thực tài khoản dịch vụ: `serviceAccountFile` (đường dẫn), `serviceAccount` (chuỗi hoặc đối tượng JSON nội tuyến) hoặc `serviceAccountRef` (SecretRef từ biến môi trường/tệp). Các biến môi trường `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON nội tuyến) và `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (đường dẫn) chỉ áp dụng cho tài khoản mặc định. Thiết lập nhiều tài khoản sử dụng `channels.googlechat.accounts.<id>` với cùng các khóa, bao gồm `serviceAccountRef` riêng cho từng tài khoản.
- Đường dẫn webhook mặc định là `/googlechat` khi chưa đặt `webhookPath`; `webhookUrl` cũng có thể cung cấp đường dẫn.
- Khóa nhóm phải là mã không gian ổn định (`spaces/<spaceId>`). Khóa tên hiển thị đã ngừng được khuyến nghị và được ghi nhật ký tương ứng.
- `dangerouslyAllowNameMatching` bật lại việc đối chiếu principal email có thể thay đổi cho danh sách cho phép (chế độ tương thích khẩn cấp); doctor cảnh báo về các mục email.
- Các hành động phản ứng của Google Chat không được cung cấp. Plugin sử dụng xác thực tài khoản dịch vụ, trong khi các điểm cuối phản ứng của Google Chat yêu cầu xác thực người dùng. Cấu hình `actions.reactions` hiện có được chấp nhận để tương thích nhưng không có tác dụng.
- Thẻ phê duyệt gốc sử dụng lượt nhấp nút `cardsV2` của Google Chat, không dùng sự kiện phản ứng. Người phê duyệt được lấy từ `allowFrom` hoặc `defaultTo` và phải là các giá trị `users/<id>` dạng số ổn định.
- Các hành động tin nhắn chỉ cung cấp văn bản `send`. Việc tải tệp đính kèm lên Google Chat yêu cầu xác thực người dùng, trong khi plugin này sử dụng xác thực tài khoản dịch vụ, vì vậy tính năng tải tệp đầu ra lên không được cung cấp.
- `typingIndicator`: `message` (mặc định) đăng một phần giữ chỗ `_<Bot> is typing..._` và chỉnh sửa phần đó thành phản hồi đầu tiên; `none` vô hiệu hóa tính năng này; `reaction` yêu cầu OAuth người dùng và hiện chuyển về `message`, đồng thời ghi lại lỗi khi sử dụng xác thực tài khoản dịch vụ.
- Tệp đính kèm đầu vào (tệp đính kèm đầu tiên trong mỗi tin nhắn) được tải xuống thông qua Chat API vào pipeline phương tiện, với giới hạn do `mediaMaxMb` đặt ra (mặc định 20).
- Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua. Khi dùng `allowBots: true`, các tin nhắn bot được chấp nhận sẽ sử dụng [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung: cấu hình `channels.defaults.botLoopProtection`, sau đó ghi đè bằng `channels.googlechat.botLoopProtection` hoặc `channels.googlechat.groups.<space>.botLoopProtection`.

Chi tiết tham khảo về bí mật: [Quản lý bí mật](/vi/gateway/secrets).

## Khắc phục sự cố

### 405 Method Not Allowed

Nếu Google Cloud Logs Explorer hiển thị các lỗi như:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Trình xử lý Webhook chưa được đăng ký. Các nguyên nhân thường gặp:

1. **Kênh chưa được cấu hình**: thiếu phần `channels.googlechat`. Xác minh bằng:

   ```bash
   openclaw config get channels.googlechat
   ```

   Nếu lệnh trả về "Config path not found", hãy thêm cấu hình (xem [Các điểm chính về cấu hình](#config-highlights)).

2. **Plugin chưa được bật**: kiểm tra trạng thái Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Nếu hiển thị "disabled", hãy thêm `plugins.entries.googlechat.enabled: true` vào cấu hình.

3. **Gateway chưa được khởi động lại** sau khi thay đổi cấu hình:

   ```bash
   openclaw gateway restart
   ```

Xác minh kênh đang chạy:

```bash
openclaw channels status
# Phải hiển thị: Google Chat default: enabled, configured, ...
```

### Các sự cố khác

- `openclaw channels status --probe` hiển thị các lỗi xác thực và cấu hình đối tượng nhận còn thiếu (cả `audience` và `audienceType` đều bắt buộc).
- Nếu không nhận được tin nhắn nào, hãy xác nhận URL Webhook và cấu hình trình kích hoạt của ứng dụng Chat.
- Nếu cơ chế chặn theo lượt đề cập ngăn phản hồi, hãy đặt `botUser` thành tên tài nguyên người dùng của ứng dụng và kiểm tra `requireMention`.
- `openclaw logs --follow` trong khi gửi tin nhắn kiểm thử cho biết các yêu cầu có đến được Gateway hay không.

## Liên quan

- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế chặn theo lượt đề cập
- [Ghép đôi](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép đôi
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
