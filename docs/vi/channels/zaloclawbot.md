---
read_when:
    - Bạn muốn một bot trợ lý Zalo cá nhân có chức năng đăng nhập bằng mã QR
    - Bạn đang cài đặt hoặc khắc phục sự cố Plugin kênh openclaw-zaloclawbot
summary: Thiết lập kênh Zalo ClawBot thông qua plugin openclaw-zaloclawbot bên ngoài
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T07:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw kết nối với Zalo ClawBot thông qua Plugin bên ngoài `@zalo-platforms/openclaw-zaloclawbot` có trong danh mục. Quá trình đăng nhập sử dụng mã QR của Zalo Mini App; ID Plugin trong cấu hình là `openclaw-zaloclawbot`.

## Khả năng tương thích

| Phiên bản Plugin | Phiên bản OpenClaw | npm dist-tag | Trạng thái          |
| ---------------- | ------------------ | ------------ | ------------------- |
| 0.1.4            | >=2026.4.10        | `latest`     | Đang hoạt động / Beta |

## Điều kiện tiên quyết

- Node.js >= 22
- Đã cài đặt [OpenClaw](https://docs.openclaw.ai/install) (có thể sử dụng CLI `openclaw`)
- Một tài khoản Zalo trên thiết bị di động để quét mã QR đăng nhập

## Cài đặt bằng quy trình thiết lập ban đầu (khuyến nghị)

```bash
openclaw onboard
```

Chọn **Zalo ClawBot** trong trình đơn kênh. Trình hướng dẫn sẽ cài đặt Plugin từ danh mục chính thức (đã xác minh tính toàn vẹn), hiển thị mã QR đăng nhập trong terminal và hoàn tất thiết lập kênh sau khi bạn quét mã bằng ứng dụng Zalo.

## Cài đặt thủ công

Để thêm kênh vào một Gateway đã hoàn tất thiết lập ban đầu:

### 1. Cài đặt Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Hãy sử dụng chính xác phiên bản cố định này để OpenClaw xác minh gói dựa trên hàm băm toàn vẹn trong danh mục khi cài đặt.

### 2. Bật Plugin trong cấu hình

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Tạo mã QR và đăng nhập

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Quét mã QR hiển thị trong terminal bằng ứng dụng Zalo trên thiết bị di động, chấp nhận Điều khoản sử dụng bên trong Zalo Mini App và cấp quyền cho phiên.

### 4. Khởi động lại Gateway

```bash
openclaw gateway restart
```

## Cách thức hoạt động

Không giống kênh Zalo tiêu chuẩn, vốn yêu cầu bạn đăng ký Zalo Official Account (OA) riêng và cấu hình thông tin xác thực tĩnh dành cho nhà phát triển, Zalo ClawBot là một **trợ lý cá nhân gắn với chủ sở hữu** trên hạ tầng chính thức dùng chung:

1. **Thiết lập ban đầu:** mã QR dẫn đến một Zalo Mini App, ứng dụng này liên kết trực tiếp một bot riêng tư mới được cấp phát dưới một OA chính thức dùng chung với ID người dùng Zalo của bạn.
2. **Quyền riêng tư gắn với chủ sở hữu:** bot chỉ giao tiếp với chủ sở hữu. Tin nhắn từ người dùng khác bị loại bỏ ở cấp nền tảng.
3. **Đường dẫn API chính thức:** Plugin sử dụng API của Zalo Bot Platform, không sử dụng tự động hóa trình duyệt hoặc phiên web.

## Cơ chế bên trong

Plugin giao tiếp với Zalo qua một vòng lặp long-polling liên tục (`getUpdates`). Webhook mặc định bị vô hiệu hóa đối với các phiên chạy Gateway cục bộ trên máy tính hoặc terminal. Tin nhắn được xử lý ở phía máy khách và ánh xạ đến môi trường thực thi tác tử cục bộ của bạn.

Plugin quản lý thông tin xác thực của bot trong thư mục trạng thái OpenClaw. Hãy coi thư mục này là dữ liệu nhạy cảm và áp dụng cho nó cùng chính sách kiểm soát truy cập và sao lưu như phần còn lại của trạng thái OpenClaw.

Môi trường thực thi của Plugin này nằm hoàn toàn trong gói bên ngoài `@zalo-platforms/openclaw-zaloclawbot`; các chi tiết hành vi bên dưới ngoài phạm vi cài đặt/cấu hình được trình bày theo thông tin từ những người bảo trì Plugin và chưa được xác minh dựa trên mã nguồn lõi OpenClaw.

## Khắc phục sự cố

- **Hết thời gian đăng nhập bằng mã QR:** vì lý do bảo mật, mã thông báo đăng nhập (`zbsk`) hết hạn sau 5 phút. Nếu mã QR hết hạn trước khi bạn quét, hãy chạy lại lệnh đăng nhập để tạo mã mới.
- **Gateway không tải được:** hãy xác nhận phiên bản máy chủ OpenClaw của bạn là `2026.4.10` trở lên. Các phiên bản cũ hơn không hỗ trợ sổ theo dõi cài đặt Plugin npm bên ngoài mà ID này yêu cầu.

## Nội dung liên quan

- [Tổng quan về các kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Zalo](/vi/channels/zalo) - kênh Zalo Bot Creator / Marketplace được đóng gói sẵn
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực tin nhắn trực tiếp và ghép nối
- [Plugin](/vi/tools/plugin) - cài đặt và quản lý các Plugin
