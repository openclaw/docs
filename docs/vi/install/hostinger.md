---
read_when:
    - Thiết lập OpenClaw trên Hostinger
    - Tìm VPS được quản lý cho OpenClaw
    - Sử dụng OpenClaw 1-Click của Hostinger
summary: Lưu trữ OpenClaw trên Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T08:00:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Chạy một OpenClaw Gateway liên tục trên [Hostinger](https://www.hostinger.com/openclaw), dưới dạng triển khai được quản lý bằng **1-Click** hoặc bản cài đặt trên **VPS** do bạn tự quản trị.

## Điều kiện tiên quyết

- Tài khoản Hostinger ([đăng ký](https://www.hostinger.com/openclaw))
- Khoảng 5-10 phút

## Lựa chọn A: OpenClaw bằng 1-Click

Hostinger xử lý hạ tầng, Docker và các bản cập nhật tự động. Đây là cách nhanh nhất để có một phiên bản đang hoạt động.

<Steps>
  <Step title="Mua và khởi chạy">
    1. Từ [trang OpenClaw của Hostinger](https://www.hostinger.com/openclaw), chọn một gói OpenClaw được quản lý và hoàn tất thanh toán.

    <Note>
    Trong quá trình thanh toán, bạn có thể chọn tín dụng **Ready-to-Use AI** được mua trước và tích hợp ngay vào OpenClaw -- không cần tài khoản bên ngoài hoặc khóa API từ các nhà cung cấp khác. Bạn có thể bắt đầu trò chuyện ngay lập tức. Hoặc cung cấp khóa của riêng bạn từ Anthropic, OpenAI, Google Gemini hay xAI trong quá trình thiết lập.
    </Note>

  </Step>

  <Step title="Chọn kênh nhắn tin">
    Chọn một hoặc nhiều kênh để kết nối:

    - **WhatsApp** -- quét mã QR hiển thị trong trình hướng dẫn thiết lập.
    - **Telegram** -- dán token bot từ [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Hoàn tất cài đặt">
    Nhấp vào **Finish** để triển khai phiên bản. Khi đã sẵn sàng, truy cập bảng điều khiển OpenClaw từ **OpenClaw Overview** trong hPanel.
  </Step>

</Steps>

## Lựa chọn B: OpenClaw trên VPS

Cho phép kiểm soát máy chủ nhiều hơn. Hostinger triển khai OpenClaw qua Docker trên VPS của bạn; bạn quản lý ứng dụng này thông qua **Docker Manager** trong hPanel.

<Steps>
  <Step title="Mua VPS">
    1. Từ [trang OpenClaw của Hostinger](https://www.hostinger.com/openclaw), chọn một gói OpenClaw trên VPS và hoàn tất thanh toán.

    <Note>
    Bạn có thể chọn tín dụng **Ready-to-Use AI** trong quá trình thanh toán -- tín dụng này được mua trước và tích hợp ngay vào OpenClaw, nhờ đó bạn có thể bắt đầu trò chuyện mà không cần tài khoản bên ngoài hoặc khóa API từ các nhà cung cấp khác.
    </Note>

  </Step>

  <Step title="Cấu hình OpenClaw">
    Sau khi VPS được cấp phát, hãy điền các trường cấu hình:

    - **Gateway token** -- được tự động tạo; hãy lưu lại để sử dụng sau.
    - **WhatsApp number** -- số điện thoại của bạn kèm mã quốc gia (không bắt buộc).
    - **Telegram bot token** -- lấy từ [BotFather](https://t.me/BotFather) (không bắt buộc).
    - **API keys** -- chỉ cần thiết nếu bạn không chọn tín dụng Ready-to-Use AI trong quá trình thanh toán.

  </Step>

  <Step title="Khởi động OpenClaw">
    Nhấp vào **Deploy**. Khi OpenClaw đang chạy, hãy mở bảng điều khiển OpenClaw từ hPanel bằng cách nhấp vào **Open**.
  </Step>

</Steps>

Nhật ký, thao tác khởi động lại và cập nhật được thực hiện từ giao diện Docker Manager trong hPanel. Để cập nhật, nhấn **Update** trong Docker Manager để tải image mới nhất.

## Xác minh thiết lập

Gửi "Xin chào" đến trợ lý của bạn trên kênh đã kết nối. OpenClaw sẽ phản hồi và hướng dẫn bạn thiết lập các tùy chọn ban đầu.

## Khắc phục sự cố

**Bảng điều khiển không tải** -- Chờ vài phút để container hoàn tất quá trình cấp phát, sau đó kiểm tra nhật ký Docker Manager trong hPanel.

**Container Docker liên tục khởi động lại** -- Mở nhật ký Docker Manager và tìm các lỗi cấu hình (thiếu token, khóa API không hợp lệ).

**Bot Telegram không phản hồi** -- Nếu cần ghép nối tin nhắn trực tiếp, người gửi không xác định sẽ nhận được một mã ghép nối ngắn thay vì phản hồi. Phê duyệt mã đó từ cuộc trò chuyện trên bảng điều khiển OpenClaw hoặc bằng lệnh `openclaw pairing approve telegram <CODE>` nếu bạn có quyền truy cập shell vào container. Xem [Ghép nối](/vi/channels/pairing).

## Các bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và các kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Lưu trữ VPS](/vi/vps)
- [DigitalOcean](/vi/install/digitalocean)
