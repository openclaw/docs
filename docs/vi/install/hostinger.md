---
read_when:
    - Thiết lập OpenClaw trên Hostinger
    - Tìm VPS được quản lý cho OpenClaw
    - Sử dụng Hostinger 1-Click OpenClaw
summary: Lưu trữ OpenClaw trên Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-29T22:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 16
---

Chạy một OpenClaw Gateway bền vững trên [Hostinger](https://www.hostinger.com/openclaw) thông qua triển khai được quản lý bằng **1 cú nhấp** hoặc cài đặt trên **VPS**.

## Điều kiện tiên quyết

- Tài khoản Hostinger ([đăng ký](https://www.hostinger.com/openclaw))
- Khoảng 5-10 phút

## Tùy chọn A: OpenClaw bằng 1 cú nhấp

Cách nhanh nhất để bắt đầu. Hostinger xử lý hạ tầng, Docker và cập nhật tự động.

<Steps>
  <Step title="Mua và khởi chạy">
    1. Từ [trang Hostinger OpenClaw](https://www.hostinger.com/openclaw), chọn một gói OpenClaw được quản lý và hoàn tất thanh toán.

    <Note>
    Trong quá trình thanh toán, bạn có thể chọn tín dụng **AI sẵn dùng** đã được mua trước và tích hợp tức thì bên trong OpenClaw -- không cần tài khoản bên ngoài hoặc khóa API từ nhà cung cấp khác. Bạn có thể bắt đầu trò chuyện ngay. Hoặc, cung cấp khóa riêng của bạn từ Anthropic, OpenAI, Google Gemini hoặc xAI trong quá trình thiết lập.
    </Note>

  </Step>

  <Step title="Chọn kênh nhắn tin">
    Chọn một hoặc nhiều kênh để kết nối:

    - **WhatsApp** -- quét mã QR hiển thị trong trình hướng dẫn thiết lập.
    - **Telegram** -- dán mã thông báo bot từ [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Hoàn tất cài đặt">
    Nhấp **Hoàn tất** để triển khai phiên bản. Khi đã sẵn sàng, truy cập bảng điều khiển OpenClaw từ **Tổng quan OpenClaw** trong hPanel.
  </Step>

</Steps>

## Tùy chọn B: OpenClaw trên VPS

Kiểm soát máy chủ của bạn nhiều hơn. Hostinger triển khai OpenClaw qua Docker trên VPS của bạn và bạn quản lý nó thông qua **Trình quản lý Docker** trong hPanel.

<Steps>
  <Step title="Mua VPS">
    1. Từ [trang Hostinger OpenClaw](https://www.hostinger.com/openclaw), chọn một gói OpenClaw trên VPS và hoàn tất thanh toán.

    <Note>
    Bạn có thể chọn tín dụng **AI sẵn dùng** trong quá trình thanh toán -- các tín dụng này đã được mua trước và tích hợp tức thì bên trong OpenClaw, để bạn có thể bắt đầu trò chuyện mà không cần bất kỳ tài khoản bên ngoài hoặc khóa API nào từ nhà cung cấp khác.
    </Note>

  </Step>

  <Step title="Cấu hình OpenClaw">
    Sau khi VPS được cấp phát, hãy điền các trường cấu hình:

    - **Mã thông báo Gateway** -- được tạo tự động; lưu lại để sử dụng sau.
    - **Số WhatsApp** -- số của bạn kèm mã quốc gia (không bắt buộc).
    - **Mã thông báo bot Telegram** -- từ [BotFather](https://t.me/BotFather) (không bắt buộc).
    - **Khóa API** -- chỉ cần nếu bạn không chọn tín dụng AI sẵn dùng trong quá trình thanh toán.

  </Step>

  <Step title="Khởi động OpenClaw">
    Nhấp **Triển khai**. Khi đã chạy, mở bảng điều khiển OpenClaw từ hPanel bằng cách nhấp vào **Mở**.
  </Step>

</Steps>

Nhật ký, khởi động lại và cập nhật được quản lý trực tiếp từ giao diện Trình quản lý Docker trong hPanel. Để cập nhật, nhấn **Cập nhật** trong Trình quản lý Docker và thao tác đó sẽ kéo hình ảnh mới nhất.

## Xác minh thiết lập của bạn

Gửi "Hi" tới trợ lý của bạn trên kênh bạn đã kết nối. OpenClaw sẽ trả lời và hướng dẫn bạn qua các tùy chọn ban đầu.

## Khắc phục sự cố

**Bảng điều khiển không tải** -- Chờ vài phút để container hoàn tất cấp phát. Kiểm tra nhật ký Trình quản lý Docker trong hPanel.

**Container Docker liên tục khởi động lại** -- Mở nhật ký Trình quản lý Docker và tìm lỗi cấu hình (thiếu mã thông báo, khóa API không hợp lệ).

**Bot Telegram không phản hồi** -- Gửi trực tiếp tin nhắn mã ghép nối của bạn từ Telegram dưới dạng một tin nhắn bên trong cuộc trò chuyện OpenClaw để hoàn tất kết nối.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Lưu trữ VPS](/vi/vps)
- [DigitalOcean](/vi/install/digitalocean)
