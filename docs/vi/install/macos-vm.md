---
read_when:
    - Bạn muốn OpenClaw được cô lập khỏi môi trường macOS chính của mình
    - Bạn muốn tích hợp iMessage (BlueBubbles) trong môi trường sandbox
    - Bạn muốn một môi trường macOS có thể đặt lại mà bạn có thể nhân bản
    - Bạn muốn so sánh các tùy chọn máy ảo macOS cục bộ với máy ảo macOS được lưu trữ
summary: Chạy OpenClaw trong máy ảo macOS được sandbox (cục bộ hoặc được lưu trữ) khi bạn cần cách ly hoặc iMessage
title: Máy ảo macOS
x-i18n:
    generated_at: "2026-05-06T09:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Mặc định khuyến nghị (hầu hết người dùng)

- **VPS Linux nhỏ** cho Gateway luôn bật và chi phí thấp. Xem [lưu trữ VPS](/vi/vps).
- **Phần cứng chuyên dụng** (Mac mini hoặc máy Linux) nếu bạn muốn toàn quyền kiểm soát và **IP dân cư** cho tự động hóa trình duyệt. Nhiều trang chặn IP trung tâm dữ liệu, nên duyệt cục bộ thường hoạt động tốt hơn.
- **Kết hợp:** giữ Gateway trên VPS giá rẻ, và kết nối Mac của bạn làm **Node** khi bạn cần tự động hóa trình duyệt/UI. Xem [Nodes](/vi/nodes) và [Gateway từ xa](/vi/gateway/remote).

Dùng VM macOS khi bạn đặc biệt cần các khả năng chỉ có trên macOS (iMessage/BlueBubbles) hoặc muốn cách ly nghiêm ngặt khỏi máy Mac dùng hằng ngày.

## Tùy chọn VM macOS

### VM cục bộ trên máy Mac Apple Silicon của bạn (Lume)

Chạy OpenClaw trong VM macOS sandbox trên máy Mac Apple Silicon hiện có của bạn bằng [Lume](https://cua.ai/docs/lume).

Điều này cung cấp cho bạn:

- Môi trường macOS đầy đủ trong trạng thái cách ly (máy chủ của bạn vẫn sạch)
- Hỗ trợ iMessage qua BlueBubbles (không thể thực hiện trên Linux/Windows)
- Đặt lại tức thì bằng cách sao chép VM
- Không cần thêm phần cứng hoặc chi phí đám mây

### Nhà cung cấp Mac lưu trữ (đám mây)

Nếu bạn muốn macOS trên đám mây, các nhà cung cấp Mac lưu trữ cũng hoạt động:

- [MacStadium](https://www.macstadium.com/) (Mac được lưu trữ)
- Các nhà cung cấp Mac lưu trữ khác cũng hoạt động; làm theo tài liệu VM + SSH của họ

Khi bạn có quyền truy cập SSH vào VM macOS, tiếp tục ở bước 6 bên dưới.

---

## Đường tắt nhanh (Lume, người dùng có kinh nghiệm)

1. Cài đặt Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Trợ lý thiết lập, bật Đăng nhập từ xa (SSH)
4. `lume run openclaw --no-display`
5. SSH vào, cài đặt OpenClaw, cấu hình kênh
6. Hoàn tất

---

## Những gì bạn cần (Lume)

- Máy Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia trở lên trên máy chủ
- Khoảng 60 GB dung lượng đĩa trống cho mỗi VM
- Khoảng 20 phút

---

## 1) Cài đặt Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Nếu `~/.local/bin` không có trong PATH của bạn:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Xác minh:

```bash
lume --version
```

Tài liệu: [Cài đặt Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Tạo VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Lệnh này tải macOS xuống và tạo VM. Một cửa sổ VNC tự động mở.

<Note>
Việc tải xuống có thể mất một lúc tùy vào kết nối của bạn.
</Note>

---

## 3) Hoàn tất Trợ lý thiết lập

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và khu vực
2. Bỏ qua Apple ID (hoặc đăng nhập nếu bạn muốn dùng iMessage sau)
3. Tạo tài khoản người dùng (nhớ tên người dùng và mật khẩu)
4. Bỏ qua tất cả tính năng tùy chọn

Sau khi thiết lập hoàn tất, bật SSH:

1. Mở Cài đặt hệ thống → Cài đặt chung → Chia sẻ
2. Bật "Đăng nhập từ xa"

---

## 4) Lấy địa chỉ IP của VM

```bash
lume get openclaw
```

Tìm địa chỉ IP (thường là `192.168.64.x`).

---

## 5) SSH vào VM

```bash
ssh youruser@192.168.64.X
```

Thay `youruser` bằng tài khoản bạn đã tạo, và IP bằng IP của VM.

---

## 6) Cài đặt OpenClaw

Bên trong VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Làm theo các lời nhắc onboarding để thiết lập nhà cung cấp mô hình của bạn (Anthropic, OpenAI, v.v.).

---

## 7) Cấu hình kênh

Chỉnh sửa tệp cấu hình:

```bash
nano ~/.openclaw/openclaw.json
```

Thêm các kênh của bạn:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Sau đó đăng nhập vào WhatsApp (quét QR):

```bash
openclaw channels login
```

---

## 8) Chạy VM không cần màn hình

Dừng VM và khởi động lại không có màn hình:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM chạy trong nền. Daemon của OpenClaw giữ cho Gateway hoạt động.

Để kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Thêm: tích hợp iMessage

Đây là tính năng nổi bật nhất khi chạy trên macOS. Dùng [BlueBubbles](https://bluebubbles.app) để thêm iMessage vào OpenClaw.

Bên trong VM:

1. Tải BlueBubbles từ bluebubbles.app
2. Đăng nhập bằng Apple ID của bạn
3. Bật Web API và đặt mật khẩu
4. Trỏ Webhook của BlueBubbles tới gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Thêm vào cấu hình OpenClaw của bạn:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Khởi động lại gateway. Giờ đây agent của bạn có thể gửi và nhận iMessage.

Chi tiết thiết lập đầy đủ: [Kênh BlueBubbles](/vi/channels/bluebubbles)

---

## Lưu ảnh vàng

Trước khi tùy chỉnh thêm, hãy chụp trạng thái sạch của bạn:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Đặt lại bất cứ lúc nào:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Chạy 24/7

Giữ VM chạy bằng cách:

- Luôn cắm nguồn cho máy Mac
- Tắt ngủ trong Cài đặt hệ thống → Tiết kiệm năng lượng
- Dùng `caffeinate` nếu cần

Để thực sự luôn bật, hãy cân nhắc Mac mini chuyên dụng hoặc VPS nhỏ. Xem [lưu trữ VPS](/vi/vps).

---

## Khắc phục sự cố

| Sự cố                    | Giải pháp                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Không thể SSH vào VM     | Kiểm tra "Đăng nhập từ xa" đã được bật trong Cài đặt hệ thống của VM               |
| IP VM không hiển thị     | Chờ VM khởi động hoàn tất, chạy lại `lume get openclaw`                            |
| Không tìm thấy lệnh Lume | Thêm `~/.local/bin` vào PATH của bạn                                               |
| QR WhatsApp không quét được | Đảm bảo bạn đã đăng nhập vào VM (không phải máy chủ) khi chạy `openclaw channels login` |

---

## Tài liệu liên quan

- [Lưu trữ VPS](/vi/vps)
- [Nodes](/vi/nodes)
- [Gateway từ xa](/vi/gateway/remote)
- [Kênh BlueBubbles](/vi/channels/bluebubbles)
- [Bắt đầu nhanh với Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Tham chiếu CLI của Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Thiết lập VM không giám sát](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Sandbox bằng Docker](/vi/install/docker) (cách cách ly thay thế)
