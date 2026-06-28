---
read_when:
    - Bạn cần đăng nhập vào các trang web để tự động hóa trình duyệt
    - Bạn muốn đăng cập nhật lên X/Twitter
summary: Đăng nhập thủ công cho tự động hóa trình duyệt + đăng bài lên X/Twitter
title: Đăng nhập bằng trình duyệt
x-i18n:
    generated_at: "2026-05-11T20:36:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Đăng nhập thủ công (khuyến nghị)

Khi một trang web yêu cầu đăng nhập, **hãy đăng nhập thủ công** trong hồ sơ trình duyệt **máy chủ** (trình duyệt openclaw).

**Không** cung cấp thông tin đăng nhập của bạn cho mô hình. Đăng nhập tự động thường kích hoạt các cơ chế chống bot và có thể khóa tài khoản.

Quay lại tài liệu chính về trình duyệt: [Trình duyệt](/vi/tools/browser).

## Hồ sơ Chrome nào được sử dụng?

OpenClaw điều khiển một **hồ sơ Chrome chuyên dụng** (tên là `openclaw`, giao diện có sắc cam). Hồ sơ này tách biệt với hồ sơ trình duyệt hằng ngày của bạn.

Đối với các lệnh gọi công cụ trình duyệt của agent:

- Lựa chọn mặc định: agent nên dùng trình duyệt `openclaw` cô lập của nó.
- Chỉ dùng `profile="user"` khi các phiên đã đăng nhập hiện có là quan trọng và người dùng đang ở máy tính để nhấp/phê duyệt bất kỳ lời nhắc đính kèm nào.
- Nếu bạn có nhiều hồ sơ trình duyệt người dùng, hãy chỉ định hồ sơ một cách rõ ràng thay vì đoán.

Hai cách dễ dàng để truy cập:

1. **Yêu cầu agent mở trình duyệt** rồi tự bạn đăng nhập.
2. **Mở qua CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Nếu bạn có nhiều hồ sơ, truyền `--browser-profile <name>` (mặc định là `openclaw`).

## X/Twitter: luồng khuyến nghị

- **Đọc/tìm kiếm/chuỗi thảo luận:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).
- **Đăng cập nhật:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).

## Sandboxing + quyền truy cập trình duyệt máy chủ

Các phiên trình duyệt sandbox **có nhiều khả năng hơn** kích hoạt phát hiện bot. Với X/Twitter (và các trang web nghiêm ngặt khác), hãy ưu tiên trình duyệt **máy chủ**.

Nếu agent đang ở trong sandbox, công cụ trình duyệt mặc định dùng sandbox. Để cho phép điều khiển máy chủ:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Sau đó tự mở trình duyệt máy chủ (các lệnh gọi CLI luôn chạy trên trình duyệt máy chủ):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Các lệnh gọi công cụ `browser` của agent sau đó có thể nhắm tới máy chủ sau khi đặt `sandbox.browser.allowHostControl: true`. Ngoài ra, hãy tắt sandboxing cho agent đăng cập nhật.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Khắc phục sự cố Browser trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố Browser WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
