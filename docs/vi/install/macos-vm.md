---
read_when:
    - Bạn muốn cô lập OpenClaw khỏi môi trường macOS chính của mình
    - Bạn muốn tích hợp iMessage (BlueBubbles) trong một môi trường cô lập
    - Bạn muốn có một môi trường macOS có thể đặt lại và nhân bản
    - Bạn muốn so sánh các tùy chọn VM macOS cục bộ và được lưu trữ
summary: Chạy OpenClaw trong máy ảo macOS có cơ chế cách ly (cục bộ hoặc được lưu trữ) khi bạn cần môi trường cô lập hoặc iMessage
title: Máy ảo macOS
x-i18n:
    generated_at: "2026-04-29T22:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw trên máy ảo macOS (Sandboxing)

## Mặc định được khuyến nghị (đa số người dùng)

- **VPS Linux nhỏ** cho Gateway luôn bật và chi phí thấp. Xem [lưu trữ VPS](/vi/vps).
- **Phần cứng chuyên dụng** (Mac mini hoặc máy Linux) nếu bạn muốn toàn quyền kiểm soát và **IP dân cư** cho tự động hóa trình duyệt. Nhiều trang chặn IP trung tâm dữ liệu, nên duyệt web cục bộ thường hoạt động tốt hơn.
- **Kết hợp:** giữ Gateway trên một VPS giá rẻ, và kết nối máy Mac của bạn dưới dạng **Node** khi cần tự động hóa trình duyệt/UI. Xem [Nodes](/vi/nodes) và [Gateway từ xa](/vi/gateway/remote).

Dùng máy ảo macOS khi bạn cần riêng các khả năng chỉ có trên macOS (iMessage/BlueBubbles) hoặc muốn cách ly nghiêm ngặt khỏi máy Mac hằng ngày của mình.

## Tùy chọn máy ảo macOS

### Máy ảo cục bộ trên máy Mac Apple Silicon của bạn (Lume)

Chạy OpenClaw trong một máy ảo macOS được sandbox trên máy Mac Apple Silicon hiện có của bạn bằng [Lume](https://cua.ai/docs/lume).

Điều này mang lại cho bạn:

- Môi trường macOS đầy đủ trong trạng thái cách ly (máy chủ của bạn vẫn sạch)
- Hỗ trợ iMessage qua BlueBubbles (không thể trên Linux/Windows)
- Đặt lại tức thì bằng cách sao chép máy ảo
- Không cần phần cứng bổ sung hoặc chi phí đám mây

### Nhà cung cấp Mac lưu trữ (đám mây)

Nếu bạn muốn macOS trên đám mây, các nhà cung cấp Mac lưu trữ cũng hoạt động:

- [MacStadium](https://www.macstadium.com/) (Mac được lưu trữ)
- Các nhà cung cấp Mac lưu trữ khác cũng hoạt động; làm theo tài liệu VM + SSH của họ

Sau khi có quyền truy cập SSH vào máy ảo macOS, tiếp tục ở bước 6 bên dưới.

---

## Đường dẫn nhanh (Lume, người dùng có kinh nghiệm)

1. Cài đặt Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Setup Assistant, bật Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH vào, cài đặt OpenClaw, cấu hình các kênh
6. Xong

---

## Những gì bạn cần (Lume)

- Máy Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia hoặc mới hơn trên máy chủ
- Khoảng 60 GB dung lượng đĩa trống cho mỗi máy ảo
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

## 2) Tạo máy ảo macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Lệnh này tải xuống macOS và tạo máy ảo. Một cửa sổ VNC sẽ tự động mở.

<Note>
Quá trình tải xuống có thể mất một lúc tùy theo kết nối của bạn.
</Note>

---

## 3) Hoàn tất Setup Assistant

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và khu vực
2. Bỏ qua Apple ID (hoặc đăng nhập nếu bạn muốn dùng iMessage sau này)
3. Tạo một tài khoản người dùng (ghi nhớ tên người dùng và mật khẩu)
4. Bỏ qua tất cả tính năng tùy chọn

Sau khi thiết lập hoàn tất, bật SSH:

1. Mở System Settings → General → Sharing
2. Bật "Remote Login"

---

## 4) Lấy địa chỉ IP của máy ảo

```bash
lume get openclaw
```

Tìm địa chỉ IP (thường là `192.168.64.x`).

---

## 5) SSH vào máy ảo

```bash
ssh youruser@192.168.64.X
```

Thay `youruser` bằng tài khoản bạn đã tạo, và thay IP bằng IP của máy ảo.

---

## 6) Cài đặt OpenClaw

Bên trong máy ảo:

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

## 8) Chạy máy ảo không có giao diện hiển thị

Dừng máy ảo và khởi động lại không có hiển thị:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Máy ảo chạy trong nền. Daemon của OpenClaw giữ cho gateway tiếp tục chạy.

Để kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Phần bổ sung: tích hợp iMessage

Đây là tính năng nổi bật nhất khi chạy trên macOS. Dùng [BlueBubbles](https://bluebubbles.app) để thêm iMessage vào OpenClaw.

Bên trong máy ảo:

1. Tải BlueBubbles từ bluebubbles.app
2. Đăng nhập bằng Apple ID của bạn
3. Bật Web API và đặt mật khẩu
4. Trỏ các Webhook của BlueBubbles tới gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Khởi động lại gateway. Bây giờ agent của bạn có thể gửi và nhận iMessage.

Chi tiết thiết lập đầy đủ: [kênh BlueBubbles](/vi/channels/bluebubbles)

---

## Lưu một ảnh vàng

Trước khi tùy chỉnh thêm, hãy chụp lại trạng thái sạch của bạn:

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

Giữ máy ảo chạy bằng cách:

- Giữ máy Mac của bạn cắm nguồn
- Tắt chế độ ngủ trong System Settings → Energy Saver
- Dùng `caffeinate` nếu cần

Để thực sự luôn bật, hãy cân nhắc một Mac mini chuyên dụng hoặc một VPS nhỏ. Xem [lưu trữ VPS](/vi/vps).

---

## Khắc phục sự cố

| Sự cố                     | Giải pháp                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Không thể SSH vào máy ảo  | Kiểm tra "Remote Login" đã được bật trong System Settings của máy ảo               |
| Không hiển thị IP máy ảo  | Đợi máy ảo khởi động đầy đủ, chạy lại `lume get openclaw`                          |
| Không tìm thấy lệnh Lume  | Thêm `~/.local/bin` vào PATH của bạn                                                |
| QR WhatsApp không quét được | Đảm bảo bạn đã đăng nhập vào máy ảo (không phải máy chủ) khi chạy `openclaw channels login` |

---

## Tài liệu liên quan

- [lưu trữ VPS](/vi/vps)
- [Nodes](/vi/nodes)
- [Gateway từ xa](/vi/gateway/remote)
- [kênh BlueBubbles](/vi/channels/bluebubbles)
- [Khởi động nhanh Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Tham chiếu CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Thiết lập máy ảo không cần giám sát](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Docker Sandboxing](/vi/install/docker) (cách cách ly thay thế)
