---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển Mac từ xa
summary: luồng ứng dụng macOS để điều khiển Gateway OpenClaw từ xa
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-06-27T17:42:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho một Gateway OpenClaw đang chạy trên máy chủ khác (máy tính để bàn/máy chủ). Ứng dụng có thể kết nối trực tiếp tới các URL Gateway LAN/Tailnet đáng tin cậy hoặc quản lý một đường hầm SSH khi Gateway từ xa chỉ dùng loopback. Kiểm tra tình trạng, chuyển tiếp Voice Wake và Trò chuyện Web dùng lại cùng cấu hình từ xa trong _Cài đặt → Chung_.

## Chế độ

- **Cục bộ (máy Mac này)**: Mọi thứ chạy trên laptop. Không dùng SSH.
- **Từ xa qua SSH (mặc định)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng Mac mở kết nối SSH với `-o BatchMode` cùng định danh/khóa bạn chọn và một chuyển tiếp cổng cục bộ.
- **Từ xa trực tiếp (ws/wss)**: Không có đường hầm SSH. Ứng dụng Mac kết nối trực tiếp tới URL Gateway (ví dụ qua LAN, Tailscale, Tailscale Serve hoặc proxy ngược HTTPS công khai).

## Phương thức truyền tải từ xa

Chế độ từ xa hỗ trợ hai phương thức truyền tải:

- **Đường hầm SSH** (mặc định): Dùng `ssh -N -L ...` để chuyển tiếp cổng Gateway tới localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì đường hầm là loopback.
- **Trực tiếp (ws/wss)**: Kết nối thẳng tới URL Gateway. Gateway thấy IP máy khách thật.

Ở chế độ đường hầm SSH, các tên máy chủ LAN/tailnet được phát hiện sẽ được lưu dưới dạng
`gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên điểm cuối
đường hầm cục bộ, ví dụ `ws://127.0.0.1:18789`, để CLI, Trò chuyện Web và
dịch vụ node-host cục bộ đều dùng cùng phương thức truyền tải loopback an toàn.
Nếu cổng đường hầm cục bộ khác với cổng Gateway từ xa, hãy đặt
`gateway.remote.remotePort` thành cổng trên máy chủ từ xa.

Tự động hóa trình duyệt trong chế độ từ xa thuộc về máy chủ node CLI, không thuộc về
node ứng dụng macOS gốc. Ứng dụng khởi động dịch vụ máy chủ node đã cài đặt khi
có thể; nếu bạn cần điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động bằng
`openclaw node install ...` và `openclaw node start` (hoặc chạy
`openclaw node run ...` ở foreground), rồi nhắm tới node có khả năng dùng trình duyệt đó.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm và build/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH cho shell không tương tác (symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Chỉ với truyền tải SSH: mở SSH với xác thực bằng khóa. Chúng tôi khuyến nghị dùng IP **Tailscale** để có khả năng truy cập ổn định ngoài LAN.

## Thiết lập ứng dụng macOS

Để cấu hình sẵn ứng dụng mà không qua luồng chào mừng:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Với Gateway đã truy cập được trên LAN hoặc Tailnet đáng tin cậy, bỏ qua SSH hoàn toàn:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Lệnh này ghi cấu hình từ xa, đánh dấu hoàn tất onboarding và cho phép ứng dụng sở hữu
phương thức truyền tải đã chọn khi khởi động.

1. Mở _Cài đặt → Chung_.
2. Trong **OpenClaw chạy**, chọn **Từ xa** và đặt:
   - **Phương thức truyền tải**: **Đường hầm SSH** hoặc **Trực tiếp (ws/wss)**.
   - **Mục tiêu SSH**: `user@host` (tùy chọn `:port`).
     - Nếu Gateway nằm trên cùng LAN và quảng bá Bonjour, hãy chọn từ danh sách đã phát hiện để tự động điền trường này.
   - **URL Gateway** (chỉ Trực tiếp): `wss://gateway.example.ts.net` (hoặc `ws://...` cho cục bộ/LAN).
   - **Tệp định danh** (nâng cao): đường dẫn tới khóa của bạn.
   - **Gốc dự án** (nâng cao): đường dẫn checkout từ xa dùng cho các lệnh.
   - **Đường dẫn CLI** (nâng cao): đường dẫn tùy chọn tới entrypoint/binary `openclaw` có thể chạy (tự động điền khi được quảng bá).
3. Nhấn **Kiểm tra từ xa**. Thành công cho biết `openclaw status --json` từ xa chạy đúng. Lỗi thường là vấn đề PATH/CLI; mã thoát 127 nghĩa là không tìm thấy CLI ở máy từ xa.
4. Kiểm tra tình trạng và Trò chuyện Web giờ sẽ tự động chạy qua phương thức truyền tải đã chọn.

## Trò chuyện Web

- **Đường hầm SSH**: Trò chuyện Web kết nối tới Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định 18789).
- **Trực tiếp (ws/wss)**: Trò chuyện Web kết nối thẳng tới URL Gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng nữa.

## Quyền

- Máy chủ từ xa cần các phê duyệt TCC giống như cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp một lần.
- Các node quảng bá trạng thái quyền của chúng qua `node.list` / `node.describe` để agent biết những gì có sẵn.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên máy chủ từ xa và kết nối qua SSH, Tailscale Serve hoặc URL trực tiếp Tailnet/LAN đáng tin cậy.
- Đường hầm SSH dùng kiểm tra host-key nghiêm ngặt; hãy tin cậy khóa máy chủ trước để khóa tồn tại trong `~/.ssh/known_hosts`.
- Nếu bạn bind Gateway vào một giao diện không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / không tìm thấy**: `openclaw` không nằm trong PATH cho shell không đăng nhập. Thêm nó vào `/etc/paths`, shell rc của bạn hoặc symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Thăm dò tình trạng thất bại**: kiểm tra khả năng truy cập SSH, PATH và Baileys đã đăng nhập chưa (`openclaw status --json`).
- **Trò chuyện Web bị kẹt**: xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; UI yêu cầu một kết nối WS khỏe mạnh.
- **IP node hiển thị 127.0.0.1**: đây là điều dự kiến với đường hầm SSH. Chuyển **Phương thức truyền tải** sang **Trực tiếp (ws/wss)** nếu bạn muốn Gateway thấy IP máy khách thật.
- **Dashboard hoạt động nhưng khả năng của Mac đang ngoại tuyến**: điều này nghĩa là kết nối vận hành/điều khiển của ứng dụng khỏe mạnh, nhưng kết nối node đồng hành chưa kết nối hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra Mac có đang là `paired · disconnected` không. Với các điểm cuối Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các pin TLS leaf cũ sau khi xoay vòng chứng chỉ, xóa pin cũ khi macOS tin cậy chứng chỉ mới và tự động thử lại. Nếu chứng chỉ không được hệ thống tin cậy hoặc máy chủ không phải tên Tailscale Serve, hãy đặt `gateway.remote.tlsFingerprint` thành fingerprint chứng chỉ dự kiến, xem xét chứng chỉ hoặc chuyển sang **Từ xa qua SSH**.
- **Voice Wake**: các cụm từ kích hoạt được tự động chuyển tiếp trong chế độ từ xa; không cần bộ chuyển tiếp riêng.

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ script bằng `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn công tắc "âm thanh mặc định" toàn cục trong ứng dụng nữa; bên gọi chọn một âm thanh (hoặc không có) cho từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
