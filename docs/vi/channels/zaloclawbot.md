---
read_when:
    - Bạn muốn có một bot trợ lý Zalo cá nhân với đăng nhập bằng mã QR
    - Bạn đang cài đặt hoặc khắc phục sự cố Plugin kênh openclaw-zaloclawbot
summary: Thiết lập kênh Zalo ClawBot thông qua Plugin openclaw-zaloclawbot bên ngoài
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw kết nối với Zalo ClawBot thông qua Plugin bên ngoài
`@zalo-platforms/openclaw-zaloclawbot` được liệt kê trong danh mục. Đăng nhập dùng mã QR của Zalo Mini App.

## Khả năng tương thích

| Phiên bản Plugin | Phiên bản OpenClaw | npm dist-tag | Trạng thái        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Đang hoạt động / Beta |

## Điều kiện tiên quyết

- Node.js **>= 22**
- Phải cài đặt [OpenClaw](https://docs.openclaw.ai/install) (có sẵn CLI `openclaw`).
- Một tài khoản Zalo trên thiết bị di động để quét mã QR đăng nhập.

## Cài đặt bằng onboard (khuyến nghị)

Chạy trình hướng dẫn onboarding của OpenClaw và chọn **Zalo ClawBot** từ menu kênh:

```bash
openclaw onboard
```

Trình hướng dẫn cài đặt Plugin từ danh mục chính thức (đã xác minh tính toàn vẹn), hiển thị QR đăng nhập ngay trong terminal và hoàn tất kênh sau khi bạn quét bằng ứng dụng Zalo. Không cần lệnh bổ sung nào.

## Cài đặt thủ công

Để thêm kênh vào một Gateway đã onboard, hãy làm theo các bước sau:

### 1. Cài đặt Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Dùng đúng phiên bản đã ghim hiển thị ở trên (khớp với mục trong danh mục chính thức), để OpenClaw xác minh gói dựa trên hash toàn vẹn của danh mục trong quá trình cài đặt.

### 2. Bật Plugin trong cấu hình

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Tạo mã QR và đăng nhập

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Quét mã QR được hiển thị trong terminal bằng ứng dụng di động Zalo, chấp nhận Điều khoản sử dụng trong Zalo Mini App và cấp quyền cho phiên.

### 4. Khởi động lại Gateway

```bash
openclaw gateway restart
```

---

## Cách hoạt động

Khác với kênh Zalo dành cho nhà phát triển tiêu chuẩn, vốn yêu cầu bạn đăng ký Zalo Official Account (OA) riêng và dán thông tin xác thực nhà phát triển tĩnh, Zalo ClawBot hoạt động như một **trợ lý cá nhân gắn với chủ sở hữu** bằng hạ tầng chính thức dùng chung:

1. **Onboarding bảo mật:** Mã QR trỏ đến một Zalo Mini App bảo mật, liên kết một bot riêng mới được cấp phát dưới một OA chính thức dùng chung trực tiếp với Zalo User ID của bạn.
2. **Quyền riêng tư gắn với chủ sở hữu:** Theo thiết kế, bot bị giới hạn chỉ giao tiếp _duy nhất_ với chủ sở hữu của nó. Tin nhắn từ người dùng khác bị loại bỏ ở cấp nền tảng, giúp kết nối riêng tư và bảo mật.
3. **Đường dẫn API chính thức:** Plugin sử dụng API Zalo Bot Platform thay vì
   tự động hóa trình duyệt hoặc phiên web.

## Bên dưới hệ thống

Plugin Zalo ClawBot giao tiếp với API Zalo thông qua một vòng lặp tin nhắn long-polling liên tục. Để duy trì runtime gọn nhẹ và sạch:

- Kết nối long-poll sử dụng endpoint `getUpdates`.
- Webhook được tắt theo mặc định cho các lần chạy Gateway local trên máy tính/terminal.
- Tin nhắn được xử lý phía máy khách và ánh xạ trực tiếp vào runtime tác nhân local của bạn.

Plugin bên ngoài quản lý thông tin xác thực của bot trong thư mục trạng thái OpenClaw.
Hãy coi thư mục đó là nhạy cảm và đưa nó vào cùng chính sách kiểm soát truy cập và
sao lưu như phần còn lại của trạng thái OpenClaw.

---

## Khắc phục sự cố

- **Hết thời gian đăng nhập bằng QR:** Token đăng nhập (`zbsk`) hết hạn sau 5 phút vì lý do bảo mật. Nếu mã QR hết hạn trước khi bạn quét, chỉ cần chạy lại lệnh đăng nhập để tạo mã mới.
- **Gateway không tải được:** Đảm bảo phiên bản máy chủ OpenClaw của bạn là `2026.4.10` trở lên. Các phiên bản cũ hơn không hỗ trợ sổ cái cài đặt Plugin npm bên ngoài.
