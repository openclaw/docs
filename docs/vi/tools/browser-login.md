---
read_when:
    - Bạn cần đăng nhập vào các trang web để tự động hóa trình duyệt
    - Bạn muốn đăng thông tin cập nhật lên X/Twitter
summary: Đăng nhập thủ công để tự động hóa trình duyệt và đăng bài lên X/Twitter
title: Đăng nhập qua trình duyệt
x-i18n:
    generated_at: "2026-07-12T08:23:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Đăng nhập thủ công (khuyến nghị)

Khi một trang web yêu cầu đăng nhập, hãy đăng nhập thủ công trong hồ sơ `openclaw`
của trình duyệt trên máy chủ. Không cung cấp thông tin xác thực của bạn cho mô hình: đăng nhập tự động thường
kích hoạt cơ chế chống bot và có thể khiến tài khoản bị khóa.

Hãy sử dụng trình duyệt trên máy chủ (đăng nhập thủ công) cho cả việc đọc (tìm kiếm/luồng thảo luận) và
đăng bài trên X/Twitter cũng như các trang web nhạy cảm với bot khác. Các phiên trình duyệt trong sandbox
có nhiều khả năng kích hoạt cơ chế phát hiện bot hơn.

Quay lại tài liệu chính về trình duyệt: [Trình duyệt](/vi/tools/browser).

## Hồ sơ Chrome nào được sử dụng?

OpenClaw kiểm soát một hồ sơ Chrome chuyên dụng có tên `openclaw` (giao diện
tông màu cam), tách biệt với hồ sơ trình duyệt bạn dùng hằng ngày.

Đối với các lệnh gọi công cụ trình duyệt của tác tử:

- Lựa chọn mặc định: tác tử sử dụng trình duyệt `openclaw` biệt lập của mình.
- Chỉ sử dụng `profile="user"` khi cần các phiên đã đăng nhập hiện có và bạn
  đang ở máy tính để nhấp/phê duyệt mọi lời nhắc đính kèm.
- Nếu bạn có nhiều hồ sơ trình duyệt người dùng, hãy chỉ định rõ hồ sơ
  thay vì phỏng đoán.

Có hai cách để truy cập hồ sơ `openclaw`:

1. Yêu cầu tác tử mở trình duyệt, sau đó tự đăng nhập.
2. Mở hồ sơ qua CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Đối với hồ sơ không phải mặc định, hãy đặt `--browser-profile <name>` trước
lệnh con (mặc định là `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: cho phép truy cập trình duyệt trên máy chủ

Nếu tác tử đang chạy trong sandbox, các lệnh gọi công cụ `browser` của tác tử theo mặc định sẽ nhắm đến trình duyệt
trong sandbox, không phải trên máy chủ. Để cho phép tác tử nhắm đến trình duyệt trên máy chủ:

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

Các lệnh gọi CLI luôn nhắm đến trình duyệt trên máy chủ, không bao giờ nhắm đến sandbox, vì vậy bạn có thể
tự mở trình duyệt trên máy chủ bất kể cài đặt này:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Sau khi đặt `sandbox.browser.allowHostControl: true`, các lệnh gọi công cụ `browser`
của tác tử cũng có thể nhắm đến máy chủ. Ngoài ra, hãy tắt sandbox
cho tác tử đăng các nội dung cập nhật.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố trình duyệt WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
