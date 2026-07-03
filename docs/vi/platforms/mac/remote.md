---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển máy Mac từ xa
summary: Luồng ứng dụng macOS để điều khiển Gateway OpenClaw từ xa
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-07-03T23:36:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Luồng này cho phép ứng dụng macOS hoạt động như một điều khiển từ xa đầy đủ cho một OpenClaw gateway đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Ứng dụng có thể kết nối trực tiếp tới các URL Gateway LAN/Tailnet đáng tin cậy hoặc quản lý một SSH tunnel khi Gateway từ xa chỉ dùng loopback. Kiểm tra tình trạng, chuyển tiếp Voice Wake, và Trò chuyện Web dùng lại cùng cấu hình từ xa trong _Cài đặt → Chung_.

## Chế độ

- **Cục bộ (máy Mac này)**: Mọi thứ chạy trên máy tính xách tay. Không liên quan đến SSH.
- **Từ xa qua SSH (mặc định)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng Mac mở kết nối SSH với `-o BatchMode` cùng identity/key bạn chọn và một cổng chuyển tiếp cục bộ.
- **Từ xa trực tiếp (ws/wss)**: Không có SSH tunnel. Ứng dụng Mac kết nối trực tiếp tới URL Gateway (ví dụ: qua LAN, Tailscale, Tailscale Serve, hoặc reverse proxy HTTPS công khai).

## Giao thức vận chuyển từ xa

Chế độ từ xa hỗ trợ hai giao thức vận chuyển:

- **SSH tunnel** (mặc định): Dùng `ssh -N -L ...` để chuyển tiếp cổng Gateway tới localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì tunnel là loopback.
- **Trực tiếp (ws/wss)**: Kết nối thẳng tới URL Gateway. Gateway thấy IP thật của client.

Ứng dụng tắt ghép kênh kết nối SSH và chạy nền sau xác thực cho các tiến trình SSH do ứng dụng sở hữu, để có thể giám sát và khởi động lại đúng tiến trình ngay cả khi alias được chọn bật `ControlMaster` hoặc `ForkAfterAuthentication`.

Xác minh host-key SSH mặc định là nghiêm ngặt vì thông tin xác thực Gateway đi qua tunnel này. Với một SSH alias được quản lý mà bạn chủ đích muốn dùng hành vi tin cậy của nó, hãy bật bằng `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` hoặc đặt `gateway.remote.sshHostKeyPolicy` thành `"openssh"`. Tùy chọn này dùng chính sách host-key OpenSSH hiệu lực; hãy xem lại alias và mọi cấu hình `Host *` hoặc cấu hình hệ thống khớp trước. Việc thay đổi SSH target trong ứng dụng hoặc bằng `configure-remote` sẽ đặt lại chính sách về `strict` trừ khi bạn bật rõ ràng lại.

Ở chế độ SSH tunnel, các hostname LAN/tailnet được phát hiện sẽ được lưu dưới dạng
`gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên endpoint tunnel cục bộ, ví dụ `ws://127.0.0.1:18789`, để CLI, Trò chuyện Web, và dịch vụ node-host cục bộ đều dùng cùng giao thức vận chuyển loopback an toàn.
Khi quá trình phát hiện trả về cả IP Tailnet thô và hostname ổn định, ứng dụng ưu tiên Tailscale MagicDNS hoặc tên LAN để các kết nối từ xa chịu được thay đổi địa chỉ tốt hơn.
Nếu cổng tunnel cục bộ khác với cổng Gateway từ xa, hãy đặt `gateway.remote.remotePort` thành cổng trên máy chủ từ xa.

Tự động hóa trình duyệt trong chế độ từ xa thuộc về CLI node host, không thuộc về node ứng dụng macOS native. Ứng dụng khởi động dịch vụ node host đã cài đặt khi có thể; nếu bạn cần điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động bằng `openclaw node install ...` và `openclaw node start` (hoặc chạy `openclaw node run ...` ở foreground), rồi nhắm tới node có khả năng dùng trình duyệt đó.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài Node + pnpm và build/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH cho shell không tương tác (symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Chỉ với giao thức vận chuyển SSH: mở SSH với xác thực bằng key. Chúng tôi khuyến nghị IP **Tailscale** để có khả năng truy cập ổn định ngoài LAN.

## Thiết lập ứng dụng macOS

Để cấu hình sẵn ứng dụng mà không qua luồng chào mừng:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Với một Gateway đã truy cập được trên LAN hoặc Tailnet đáng tin cậy, hãy bỏ qua SSH hoàn toàn:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Lệnh này ghi cấu hình từ xa, đánh dấu onboarding đã hoàn tất, và cho phép ứng dụng sở hữu giao thức vận chuyển đã chọn khi khởi động.

1. Mở _Cài đặt → Chung_.
2. Trong **OpenClaw chạy**, chọn **Từ xa** và đặt:
   - **Giao thức vận chuyển**: **SSH tunnel** hoặc **Trực tiếp (ws/wss)**.
   - **SSH target**: `user@host` (`:port` tùy chọn).
     - Nếu Gateway ở cùng LAN và quảng bá Bonjour, hãy chọn nó từ danh sách phát hiện được để tự động điền trường này.
   - **URL Gateway** (chỉ Trực tiếp): `wss://gateway.example.ts.net` (hoặc `ws://...` cho cục bộ/LAN).
   - **Tệp identity** (nâng cao): đường dẫn tới key của bạn.
   - **Gốc dự án** (nâng cao): đường dẫn checkout từ xa dùng cho lệnh.
   - **Đường dẫn CLI** (nâng cao): đường dẫn tùy chọn tới entrypoint/binary `openclaw` có thể chạy (được tự động điền khi có quảng bá).
3. Nhấn **Kiểm tra từ xa**. Thành công nghĩa là lệnh `openclaw status --json` từ xa chạy đúng. Lỗi thường là vấn đề PATH/CLI; exit 127 nghĩa là không tìm thấy CLI từ xa.
4. Kiểm tra tình trạng và Trò chuyện Web giờ sẽ tự động chạy qua giao thức vận chuyển đã chọn.

## Trò chuyện Web

- **SSH tunnel**: Trò chuyện Web kết nối tới Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định 18789).
- **Trực tiếp (ws/wss)**: Trò chuyện Web kết nối thẳng tới URL Gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng nữa.

## Quyền

- Máy chủ từ xa cần cùng các phê duyệt TCC như cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp một lần.
- Các node quảng bá trạng thái quyền của chúng qua `node.list` / `node.describe` để agent biết những gì có sẵn.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên máy chủ từ xa và kết nối qua SSH, Tailscale Serve, hoặc URL trực tiếp Tailnet/LAN đáng tin cậy.
- SSH tunneling mặc định yêu cầu host key đã được tin cậy từ trước. Hãy tin cậy host key trước để nó tồn tại trong tệp known-hosts đã cấu hình, hoặc chọn rõ `gateway.remote.sshHostKeyPolicy: "openssh"` cho alias được quản lý mà bạn chấp nhận chính sách tin cậy OpenSSH của nó.
- Nếu bạn bind Gateway vào một interface không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / không tìm thấy**: `openclaw` không nằm trong PATH cho shell không đăng nhập. Thêm nó vào `/etc/paths`, shell rc của bạn, hoặc symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: kiểm tra khả năng truy cập SSH, PATH, và Baileys đã đăng nhập (`openclaw status --json`).
- **Trò chuyện Web bị kẹt**: xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; UI yêu cầu kết nối WS khỏe mạnh.
- **IP node hiển thị 127.0.0.1**: điều này là bình thường với SSH tunnel. Chuyển **Giao thức vận chuyển** sang **Trực tiếp (ws/wss)** nếu bạn muốn Gateway thấy IP thật của client.
- **Dashboard hoạt động nhưng khả năng của Mac đang offline**: điều này nghĩa là kết nối operator/control của ứng dụng khỏe mạnh, nhưng kết nối node đồng hành chưa kết nối hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra xem Mac có phải là `paired · disconnected` không. Với các endpoint Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các TLS leaf pin legacy đã cũ sau khi chứng chỉ xoay vòng, xóa pin cũ khi macOS tin cậy chứng chỉ mới, và tự động thử lại. Nếu chứng chỉ không được hệ thống tin cậy hoặc host không phải tên Tailscale Serve, hãy đặt `gateway.remote.tlsFingerprint` thành fingerprint chứng chỉ mong đợi, xem lại chứng chỉ, hoặc chuyển sang **Từ xa qua SSH**.
- **Voice Wake**: các cụm từ kích hoạt được tự động chuyển tiếp trong chế độ từ xa; không cần forwarder riêng.

## Âm thanh thông báo

Chọn âm thanh theo từng thông báo từ script với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn công tắc "âm thanh mặc định" toàn cục trong ứng dụng nữa; caller chọn một âm thanh (hoặc không) cho mỗi yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
