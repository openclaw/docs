---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển Mac từ xa
summary: Luồng ứng dụng macOS để điều khiển Gateway OpenClaw từ xa qua SSH
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-05-06T09:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho một Gateway OpenClaw đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Đây là tính năng **Remote over SSH** (chạy từ xa) của ứng dụng. Tất cả tính năng kiểm tra tình trạng, chuyển tiếp Voice Wake và Web Chat đều tái sử dụng cùng cấu hình SSH từ xa trong _Settings → General_.

## Chế độ

- **Local (this Mac)**: Mọi thứ chạy trên laptop. Không liên quan đến SSH.
- **Remote over SSH (default)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng Mac mở kết nối SSH với `-o BatchMode`, cùng danh tính/khóa bạn chọn và chuyển tiếp cổng cục bộ.
- **Remote direct (ws/wss)**: Không có đường hầm SSH. Ứng dụng Mac kết nối trực tiếp tới URL Gateway (ví dụ, qua Tailscale Serve hoặc reverse proxy HTTPS công khai).

## Phương thức truyền tải từ xa

Chế độ từ xa hỗ trợ hai phương thức truyền tải:

- **Đường hầm SSH** (mặc định): Dùng `ssh -N -L ...` để chuyển tiếp cổng Gateway tới localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì đường hầm là loopback.
- **Trực tiếp (ws/wss)**: Kết nối thẳng tới URL Gateway. Gateway thấy IP thật của máy khách.

Ở chế độ đường hầm SSH, các tên máy chủ LAN/tailnet được phát hiện sẽ được lưu thành
`gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên endpoint đường hầm
cục bộ, ví dụ `ws://127.0.0.1:18789`, để CLI, Web Chat và
dịch vụ node-host cục bộ đều dùng cùng phương thức truyền tải loopback an toàn.

Tự động hóa trình duyệt ở chế độ từ xa do CLI node host sở hữu, không phải do
node của ứng dụng macOS native. Ứng dụng khởi động dịch vụ node host đã cài đặt khi
có thể; nếu bạn cần điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động bằng
`openclaw node install ...` và `openclaw node start` (hoặc chạy
`openclaw node run ...` ở foreground), rồi nhắm tới node có khả năng trình duyệt đó.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm và build/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trên PATH cho shell không tương tác (symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Mở SSH với xác thực bằng khóa. Chúng tôi khuyến nghị dùng IP **Tailscale** để có khả năng truy cập ổn định khi ở ngoài LAN.

## Thiết lập ứng dụng macOS

1. Mở _Settings → General_.
2. Trong **OpenClaw runs**, chọn **Remote over SSH** và đặt:
   - **Transport**: **SSH tunnel** hoặc **Direct (ws/wss)**.
   - **SSH target**: `user@host` (tùy chọn `:port`).
     - Nếu Gateway ở cùng LAN và quảng bá Bonjour, hãy chọn từ danh sách đã phát hiện để tự động điền trường này.
   - **Gateway URL** (chỉ Direct): `wss://gateway.example.ts.net` (hoặc `ws://...` cho cục bộ/LAN).
   - **Identity file** (nâng cao): đường dẫn tới khóa của bạn.
   - **Project root** (nâng cao): đường dẫn checkout từ xa dùng cho lệnh.
   - **CLI path** (nâng cao): đường dẫn tùy chọn tới entrypoint/binary `openclaw` có thể chạy được (tự động điền khi được quảng bá).
3. Nhấn **Test remote**. Thành công cho biết `openclaw status --json` từ xa chạy đúng. Lỗi thường là vấn đề PATH/CLI; mã thoát 127 nghĩa là không tìm thấy CLI ở máy từ xa.
4. Kiểm tra tình trạng và Web Chat giờ sẽ tự động chạy qua đường hầm SSH này.

## Web Chat

- **Đường hầm SSH**: Web Chat kết nối tới Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định 18789).
- **Trực tiếp (ws/wss)**: Web Chat kết nối thẳng tới URL Gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng nữa.

## Quyền

- Máy chủ từ xa cần cùng các phê duyệt TCC như cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp chúng một lần.
- Các node quảng bá trạng thái quyền của chúng qua `node.list` / `node.describe` để agent biết những gì khả dụng.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên máy chủ từ xa và kết nối qua SSH hoặc Tailscale.
- Đường hầm SSH dùng kiểm tra host-key nghiêm ngặt; hãy tin cậy host key trước để nó tồn tại trong `~/.ssh/known_hosts`.
- Nếu bạn bind Gateway vào một giao diện không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / not found**: `openclaw` không nằm trên PATH cho shell không đăng nhập. Thêm nó vào `/etc/paths`, shell rc của bạn, hoặc symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: kiểm tra khả năng truy cập SSH, PATH, và việc Baileys đã đăng nhập (`openclaw status --json`).
- **Web Chat bị kẹt**: xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; UI yêu cầu kết nối WS khỏe mạnh.
- **IP Node hiển thị 127.0.0.1**: đây là điều dự kiến với đường hầm SSH. Chuyển **Transport** sang **Direct (ws/wss)** nếu bạn muốn Gateway thấy IP thật của máy khách.
- **Dashboard hoạt động nhưng khả năng của Mac đang ngoại tuyến**: điều này nghĩa là kết nối operator/control của ứng dụng khỏe mạnh, nhưng kết nối node đồng hành chưa được kết nối hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra Mac có ở trạng thái `paired · disconnected` hay không. Với endpoint Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các ghim TLS leaf cũ đã lỗi thời sau khi xoay vòng chứng chỉ, xóa ghim lỗi thời khi macOS tin cậy chứng chỉ mới, và tự động thử lại. Nếu chứng chỉ không được hệ thống tin cậy hoặc host không phải tên Tailscale Serve, hãy xem lại chứng chỉ hoặc chuyển sang **Remote over SSH**.
- **Voice Wake**: cụm từ kích hoạt được tự động chuyển tiếp ở chế độ từ xa; không cần bộ chuyển tiếp riêng.

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ script với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn công tắc “âm thanh mặc định” toàn cục trong ứng dụng nữa; bên gọi chọn âm thanh (hoặc không chọn) cho từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
