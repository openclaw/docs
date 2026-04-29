---
read_when:
    - Bạn cần đăng nhập vào các trang web để tự động hóa trình duyệt
    - Bạn muốn đăng các cập nhật lên X/Twitter
summary: Đăng nhập thủ công cho tự động hóa trình duyệt + đăng bài trên X/Twitter
title: Đăng nhập bằng trình duyệt
x-i18n:
    generated_at: "2026-04-29T23:16:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 16
---

# Đăng nhập trình duyệt + đăng bài lên X/Twitter

## Đăng nhập thủ công (được khuyến nghị)

Khi một trang web yêu cầu đăng nhập, hãy **đăng nhập thủ công** trong hồ sơ trình duyệt **máy chủ** (trình duyệt openclaw).

**Không** cung cấp thông tin đăng nhập của bạn cho mô hình. Đăng nhập tự động thường kích hoạt cơ chế chống bot và có thể khiến tài khoản bị khóa.

Quay lại tài liệu trình duyệt chính: [Trình duyệt](/vi/tools/browser).

## Hồ sơ Chrome nào được sử dụng?

OpenClaw điều khiển một **hồ sơ Chrome chuyên dụng** (tên là `openclaw`, giao diện có sắc cam). Hồ sơ này tách biệt với hồ sơ trình duyệt hằng ngày của bạn.

Đối với các lệnh gọi công cụ trình duyệt của agent:

- Lựa chọn mặc định: agent nên dùng trình duyệt `openclaw` cô lập của nó.
- Chỉ dùng `profile="user"` khi các phiên đã đăng nhập hiện có là quan trọng và người dùng đang ở máy tính để nhấp/phê duyệt mọi lời nhắc đính kèm.
- Nếu bạn có nhiều hồ sơ trình duyệt người dùng, hãy chỉ định rõ hồ sơ thay vì đoán.

Hai cách dễ dàng để truy cập:

1. **Yêu cầu agent mở trình duyệt** rồi tự đăng nhập.
2. **Mở qua CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Nếu bạn có nhiều hồ sơ, hãy truyền `--browser-profile <name>` (mặc định là `openclaw`).

## X/Twitter: luồng được khuyến nghị

- **Đọc/tìm kiếm/chuỗi thảo luận:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).
- **Đăng cập nhật:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).

## Cách ly sandbox + quyền truy cập trình duyệt máy chủ

Các phiên trình duyệt trong sandbox **có khả năng cao hơn** kích hoạt phát hiện bot. Với X/Twitter (và các trang nghiêm ngặt khác), nên dùng trình duyệt **máy chủ**.

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

Sau đó nhắm đến trình duyệt máy chủ:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Hoặc tắt sandboxing cho agent đăng cập nhật.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố trình duyệt WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
