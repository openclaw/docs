---
read_when:
    - Bạn cần đăng nhập vào các trang web để tự động hóa trình duyệt
    - Bạn muốn đăng thông tin cập nhật lên X/Twitter
summary: Đăng nhập thủ công cho tự động hóa trình duyệt + đăng bài lên X/Twitter
title: Đăng nhập bằng trình duyệt
x-i18n:
    generated_at: "2026-05-06T09:31:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Đăng nhập thủ công (được khuyến nghị)

Khi một trang web yêu cầu đăng nhập, hãy **đăng nhập thủ công** trong hồ sơ trình duyệt **máy chủ** (trình duyệt openclaw).

**Không** cung cấp thông tin đăng nhập của bạn cho mô hình. Đăng nhập tự động thường kích hoạt cơ chế chống bot và có thể khóa tài khoản.

Quay lại tài liệu trình duyệt chính: [Trình duyệt](/vi/tools/browser).

## Hồ sơ Chrome nào được sử dụng?

OpenClaw điều khiển một **hồ sơ Chrome chuyên dụng** (tên là `openclaw`, giao diện có sắc cam). Hồ sơ này tách biệt với hồ sơ trình duyệt hằng ngày của bạn.

Đối với lệnh gọi công cụ trình duyệt của tác tử:

- Lựa chọn mặc định: tác tử nên dùng trình duyệt `openclaw` cô lập của nó.
- Chỉ dùng `profile="user"` khi các phiên đã đăng nhập hiện có là cần thiết và người dùng đang ở máy tính để nhấp/phê duyệt bất kỳ lời nhắc đính kèm nào.
- Nếu bạn có nhiều hồ sơ trình duyệt người dùng, hãy chỉ định rõ hồ sơ thay vì đoán.

Hai cách dễ dàng để truy cập hồ sơ đó:

1. **Yêu cầu tác tử mở trình duyệt** rồi tự bạn đăng nhập.
2. **Mở qua CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Nếu bạn có nhiều hồ sơ, truyền `--browser-profile <name>` (mặc định là `openclaw`).

## X/Twitter: luồng được khuyến nghị

- **Đọc/tìm kiếm/chuỗi thảo luận:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).
- **Đăng cập nhật:** dùng trình duyệt **máy chủ** (đăng nhập thủ công).

## Sandbox + quyền truy cập trình duyệt máy chủ

Các phiên trình duyệt trong sandbox **có nhiều khả năng hơn** kích hoạt phát hiện bot. Đối với X/Twitter (và các trang nghiêm ngặt khác), ưu tiên dùng trình duyệt **máy chủ**.

Nếu tác tử chạy trong sandbox, công cụ trình duyệt mặc định dùng sandbox. Để cho phép điều khiển máy chủ:

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

Sau đó nhắm tới trình duyệt máy chủ:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Hoặc tắt sandbox cho tác tử đăng cập nhật.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố trình duyệt WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
