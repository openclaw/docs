---
read_when:
    - Bạn muốn tách biệt OpenClaw khỏi môi trường macOS chính của mình
    - Bạn muốn tích hợp iMessage trong môi trường cách ly
    - Bạn muốn một môi trường macOS có thể đặt lại mà bạn có thể nhân bản
    - Bạn muốn so sánh các tùy chọn VM macOS cục bộ và được lưu trữ
summary: Chạy OpenClaw trong máy ảo macOS cách ly (cục bộ hoặc được lưu trữ) khi bạn cần cô lập hoặc iMessage
title: Máy ảo macOS
x-i18n:
    generated_at: "2026-05-10T19:40:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Mặc định được khuyến nghị (hầu hết người dùng)

- **VPS Linux nhỏ** cho Gateway luôn bật và chi phí thấp. Xem [lưu trữ VPS](/vi/vps).
- **Phần cứng chuyên dụng** (Mac mini hoặc máy Linux) nếu bạn muốn toàn quyền kiểm soát và **IP dân cư** cho tự động hóa trình duyệt. Nhiều trang chặn IP trung tâm dữ liệu, nên duyệt cục bộ thường hoạt động tốt hơn.
- **Kết hợp:** giữ Gateway trên một VPS giá rẻ, và kết nối Mac của bạn làm **Node** khi bạn cần tự động hóa trình duyệt/UI. Xem [Node](/vi/nodes) và [Gateway từ xa](/vi/gateway/remote).

Dùng VM macOS khi bạn đặc biệt cần các khả năng chỉ có trên macOS như iMessage hoặc muốn cách ly nghiêm ngặt khỏi máy Mac dùng hằng ngày.

## Tùy chọn VM macOS

### VM cục bộ trên Apple Silicon Mac của bạn (Lume)

Chạy OpenClaw trong một VM macOS dạng sandbox trên Apple Silicon Mac hiện có của bạn bằng [Lume](https://cua.ai/docs/lume).

Cách này cho bạn:

- Môi trường macOS đầy đủ trong trạng thái cách ly (máy chủ của bạn vẫn sạch)
- Hỗ trợ iMessage qua `imsg` (đường dẫn cục bộ mặc định là không thể trên Linux/Windows)
- Đặt lại tức thì bằng cách nhân bản VM
- Không cần thêm phần cứng hoặc chi phí đám mây

### Nhà cung cấp Mac lưu trữ (đám mây)

Nếu bạn muốn macOS trên đám mây, các nhà cung cấp Mac lưu trữ cũng hoạt động:

- [MacStadium](https://www.macstadium.com/) (Mac được lưu trữ)
- Các nhà cung cấp Mac lưu trữ khác cũng hoạt động; làm theo tài liệu VM + SSH của họ

Khi đã có quyền truy cập SSH vào VM macOS, tiếp tục ở bước 6 bên dưới.

---

## Đường dẫn nhanh (Lume, người dùng có kinh nghiệm)

1. Cài đặt Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Setup Assistant, bật Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH vào, cài đặt OpenClaw, cấu hình các kênh
6. Xong

---

## Bạn cần gì (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia hoặc mới hơn trên máy chủ
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

Lệnh này tải macOS xuống và tạo VM. Một cửa sổ VNC sẽ tự động mở.

<Note>
Quá trình tải xuống có thể mất một lúc tùy vào kết nối của bạn.
</Note>

---

## 3) Hoàn tất Setup Assistant

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và khu vực
2. Bỏ qua Apple ID (hoặc đăng nhập nếu sau này bạn muốn dùng iMessage)
3. Tạo tài khoản người dùng (ghi nhớ tên người dùng và mật khẩu)
4. Bỏ qua mọi tính năng tùy chọn

Sau khi thiết lập hoàn tất, bật SSH:

1. Mở System Settings → General → Sharing
2. Bật "Remote Login"

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

## 8) Chạy VM không có giao diện hiển thị

Dừng VM và khởi động lại không có màn hình:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM chạy trong nền. Daemon của OpenClaw giữ cho gateway tiếp tục chạy.

Để kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bổ sung: tích hợp iMessage

Đây là tính năng nổi bật nhất khi chạy trên macOS. Dùng [iMessage](/vi/channels/imessage) với `imsg` để thêm Messages vào OpenClaw.

Bên trong VM:

1. Đăng nhập vào Messages.
2. Cài đặt `imsg`.
3. Cấp quyền Full Disk Access và Automation cho tiến trình đang chạy OpenClaw/`imsg`.
4. Xác minh hỗ trợ RPC bằng `imsg rpc --help`.

Thêm vào cấu hình OpenClaw của bạn:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Khởi động lại gateway. Giờ đây tác nhân của bạn có thể gửi và nhận iMessage.

Chi tiết thiết lập đầy đủ: [kênh iMessage](/vi/channels/imessage)

---

## Lưu một image chuẩn

Trước khi tùy chỉnh thêm, chụp nhanh trạng thái sạch của bạn:

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

- Luôn cắm nguồn cho Mac của bạn
- Tắt chế độ ngủ trong System Settings → Energy Saver
- Dùng `caffeinate` nếu cần

Để thật sự luôn bật, hãy cân nhắc một Mac mini chuyên dụng hoặc một VPS nhỏ. Xem [lưu trữ VPS](/vi/vps).

---

## Khắc phục sự cố

| Vấn đề                         | Giải pháp                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Không thể SSH vào VM           | Kiểm tra "Remote Login" đã được bật trong System Settings của VM                           |
| IP của VM không hiển thị       | Chờ VM khởi động hoàn toàn, chạy lại `lume get openclaw`                                   |
| Không tìm thấy lệnh Lume       | Thêm `~/.local/bin` vào PATH của bạn                                                       |
| QR WhatsApp không quét được    | Đảm bảo bạn đã đăng nhập vào VM (không phải máy chủ) khi chạy `openclaw channels login`    |

---

## Tài liệu liên quan

- [lưu trữ VPS](/vi/vps)
- [Node](/vi/nodes)
- [Gateway từ xa](/vi/gateway/remote)
- [kênh iMessage](/vi/channels/imessage)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Tham chiếu CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Thiết lập VM không cần giám sát](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Sandboxing bằng Docker](/vi/install/docker) (cách cách ly thay thế)
