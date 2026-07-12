---
read_when:
    - Bạn muốn cách ly OpenClaw khỏi môi trường macOS chính của mình
    - Bạn muốn tích hợp iMessage trong một sandbox
    - Bạn muốn một môi trường macOS có thể đặt lại và sao chép
    - Bạn muốn so sánh các tùy chọn máy ảo macOS cục bộ và được lưu trữ từ xa
summary: Chạy OpenClaw trong máy ảo macOS được cách ly (cục bộ hoặc được lưu trữ) khi bạn cần khả năng cách ly hoặc iMessage
title: Máy ảo macOS
x-i18n:
    generated_at: "2026-07-12T08:03:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Mặc định được khuyến nghị (đa số người dùng)

- **VPS Linux cấu hình nhỏ** để Gateway luôn hoạt động với chi phí thấp. Xem [lưu trữ trên VPS](/vi/vps).
- **Phần cứng chuyên dụng** (Mac mini hoặc máy Linux) nếu bạn muốn toàn quyền kiểm soát và có **IP dân dụng** để tự động hóa trình duyệt. Nhiều trang web chặn IP trung tâm dữ liệu, vì vậy duyệt web cục bộ thường hoạt động tốt hơn.
- **Kết hợp**: duy trì Gateway trên một VPS giá rẻ và kết nối máy Mac của bạn dưới dạng **Node** khi cần tự động hóa trình duyệt/giao diện người dùng. Xem [Node](/vi/nodes) và [Gateway từ xa](/vi/gateway/remote).

Chỉ sử dụng máy ảo macOS khi bạn đặc biệt cần các khả năng chỉ có trên macOS, chẳng hạn như iMessage, hoặc muốn cách ly hoàn toàn khỏi máy Mac bạn sử dụng hằng ngày.

## Các tùy chọn máy ảo macOS

### Máy ảo cục bộ trên máy Mac Apple Silicon của bạn (Lume)

Chạy OpenClaw trong một máy ảo macOS được cách ly trên máy Mac Apple Silicon hiện có bằng [Lume](https://cua.ai/docs/lume). Giải pháp này mang lại:

- Môi trường macOS đầy đủ và được cách ly (máy chủ của bạn vẫn sạch)
- Hỗ trợ iMessage thông qua `imsg`; đường dẫn cục bộ mặc định không thể sử dụng trên Linux/Windows
- Đặt lại tức thì bằng cách sao chép máy ảo
- Không cần thêm phần cứng hoặc chi phí đám mây

### Nhà cung cấp máy Mac lưu trữ trên đám mây

Nếu muốn sử dụng macOS trên đám mây, bạn cũng có thể dùng các nhà cung cấp máy Mac lưu trữ:

- [MacStadium](https://www.macstadium.com/) (máy Mac được lưu trữ)
- Các nhà cung cấp máy Mac lưu trữ khác cũng dùng được; hãy làm theo tài liệu về máy ảo và SSH của họ

Sau khi có quyền truy cập SSH vào máy ảo macOS, hãy tiếp tục với phần [Cài đặt OpenClaw](#6-install-openclaw) bên dưới.

## Quy trình nhanh (Lume, dành cho người dùng có kinh nghiệm)

1. Cài đặt Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Hoàn tất Setup Assistant, bật Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Kết nối bằng SSH, cài đặt OpenClaw, cấu hình các kênh.
6. Hoàn tất.

## Những gì bạn cần (Lume)

- Máy Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia trở lên trên máy chủ
- Khoảng 60 GB dung lượng đĩa trống cho mỗi máy ảo
- Khoảng 20 phút

## 1) Cài đặt Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Nếu `~/.local/bin` không nằm trong PATH của bạn:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Xác minh:

```bash
lume --version
```

Tài liệu: [Cài đặt Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Tạo máy ảo macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Lệnh này tải xuống macOS và tạo máy ảo. Một cửa sổ VNC sẽ tự động mở.

<Note>
Quá trình tải xuống có thể mất một lúc tùy thuộc vào kết nối của bạn.
</Note>

## 3) Hoàn tất Setup Assistant

Trong cửa sổ VNC:

1. Chọn ngôn ngữ và khu vực.
2. Bỏ qua Apple ID (hoặc đăng nhập nếu sau này bạn muốn dùng iMessage).
3. Tạo tài khoản người dùng (hãy nhớ tên người dùng và mật khẩu).
4. Bỏ qua tất cả tính năng tùy chọn.

Sau khi hoàn tất thiết lập:

1. Bật SSH: System Settings -> General -> Sharing, bật "Remote Login".
2. Để sử dụng máy ảo không giao diện, hãy bật đăng nhập tự động: System Settings -> Users & Groups, chọn "Automatically log in as:", rồi chọn người dùng máy ảo.

## 4) Lấy địa chỉ IP của máy ảo

```bash
lume get openclaw
```

Tìm địa chỉ IP (thường là `192.168.64.x`).

## 5) Kết nối SSH vào máy ảo

```bash
ssh youruser@192.168.64.X
```

Thay `youruser` bằng tài khoản bạn đã tạo và thay địa chỉ IP bằng IP của máy ảo.

## 6) Cài đặt OpenClaw

Bên trong máy ảo:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Làm theo lời nhắc hướng dẫn ban đầu để thiết lập nhà cung cấp mô hình của bạn (Anthropic, OpenAI, v.v.).

## 7) Cấu hình các kênh

Chỉnh sửa tệp cấu hình:

```bash
nano ~/.openclaw/openclaw.json
```

Thêm các kênh của bạn:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Sau đó đăng nhập WhatsApp (quét mã QR):

```bash
openclaw channels login
```

## 8) Chạy máy ảo không giao diện

Dừng máy ảo rồi khởi động lại mà không hiển thị giao diện:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Máy ảo chạy trong nền; daemon của OpenClaw duy trì hoạt động của Gateway. Để kiểm tra trạng thái:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Phần bổ sung: tích hợp iMessage

Đây là tính năng nổi bật nhất khi chạy trên macOS. Sử dụng [iMessage](/vi/channels/imessage) với `imsg` để thêm Messages vào OpenClaw.

Bên trong máy ảo:

1. Đăng nhập vào Messages.
2. Cài đặt `imsg`.
3. Cấp quyền Full Disk Access và Automation cho tiến trình chạy OpenClaw/`imsg`.
4. Xác minh khả năng hỗ trợ RPC bằng `imsg rpc --help`.

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

Khởi động lại Gateway. Giờ đây, tác nhân của bạn có thể gửi và nhận iMessage. Chi tiết thiết lập đầy đủ: [kênh iMessage](/vi/channels/imessage).

## Lưu một ảnh hệ thống chuẩn

Trước khi tùy chỉnh thêm, hãy tạo bản chụp nhanh trạng thái sạch của bạn:

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

## Chạy liên tục 24/7

Duy trì hoạt động của máy ảo bằng cách:

- Luôn cắm nguồn cho máy Mac
- Tắt chế độ ngủ trong System Settings -> Energy Saver
- Sử dụng `caffeinate` nếu cần

Để thực sự luôn hoạt động, hãy cân nhắc dùng Mac mini chuyên dụng hoặc một VPS cấu hình nhỏ. Xem [lưu trữ trên VPS](/vi/vps).

## Khắc phục sự cố

| Sự cố                            | Giải pháp                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Không thể kết nối SSH vào máy ảo | Kiểm tra xem "Remote Login" đã được bật trong System Settings của máy ảo hay chưa                            |
| IP máy ảo không hiển thị         | Chờ máy ảo khởi động hoàn toàn, sau đó chạy lại `lume get openclaw`                                          |
| Không tìm thấy lệnh Lume         | Thêm `~/.local/bin` vào PATH của bạn                                                                         |
| Không quét được mã QR WhatsApp   | Đảm bảo bạn đã đăng nhập vào máy ảo (không phải máy chủ) khi chạy `openclaw channels login`                  |

## Tài liệu liên quan

- [Lưu trữ trên VPS](/vi/vps)
- [Node](/vi/nodes)
- [Gateway từ xa](/vi/gateway/remote)
- [Kênh iMessage](/vi/channels/imessage)
- [Hướng dẫn bắt đầu nhanh với Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Tài liệu tham khảo CLI của Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Thiết lập máy ảo không cần giám sát](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (nâng cao)
- [Cách ly bằng Docker](/vi/install/docker) (phương pháp cách ly thay thế)
