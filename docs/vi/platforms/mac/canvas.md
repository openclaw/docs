---
read_when:
    - Triển khai bảng Canvas trên macOS
    - Thêm các điều khiển tác nhân cho không gian làm việc trực quan
    - Gỡ lỗi quá trình tải canvas trong WKWebView
summary: Bảng Canvas do tác nhân điều khiển được nhúng qua WKWebView + lược đồ URL tùy chỉnh
title: Khung vẽ
x-i18n:
    generated_at: "2026-05-06T09:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Ứng dụng macOS nhúng một **bảng Canvas** do agent điều khiển bằng `WKWebView`. Đây là một không gian làm việc trực quan nhẹ cho HTML/CSS/JS, A2UI và các bề mặt UI tương tác nhỏ.

## Vị trí của Canvas

Trạng thái Canvas được lưu trong Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Bảng Canvas phục vụ các tệp đó qua một **lược đồ URL tùy chỉnh**:

- `openclaw-canvas://<session>/<path>`

Ví dụ:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` ở gốc, ứng dụng sẽ hiển thị một **trang khung dựng sẵn**.

## Hành vi của bảng

- Bảng không viền, có thể đổi kích thước, neo gần thanh menu (hoặc con trỏ chuột).
- Ghi nhớ kích thước/vị trí theo từng phiên.
- Tự động tải lại khi các tệp canvas cục bộ thay đổi.
- Mỗi lần chỉ hiển thị một bảng Canvas (phiên được chuyển đổi khi cần).

Có thể tắt Canvas từ Settings → **Allow Canvas**. Khi bị tắt, các lệnh node canvas trả về `CANVAS_DISABLED`.

## Bề mặt API cho agent

Canvas được cung cấp qua **Gateway WebSocket**, vì vậy agent có thể:

- hiển thị/ẩn bảng
- điều hướng đến một đường dẫn hoặc URL
- đánh giá JavaScript
- chụp ảnh snapshot

Ví dụ CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Ghi chú:

- `canvas.navigate` chấp nhận **đường dẫn canvas cục bộ**, URL `http(s)` và URL `file://`.
- Nếu bạn truyền `"/"`, Canvas sẽ hiển thị khung dựng cục bộ hoặc `index.html`.

## A2UI trong Canvas

A2UI được lưu trữ bởi máy chủ canvas của Gateway và được kết xuất bên trong bảng Canvas.
Khi Gateway quảng bá một máy chủ Canvas, ứng dụng macOS sẽ tự động điều hướng đến trang máy chủ A2UI trong lần mở đầu tiên.

URL máy chủ A2UI mặc định:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Lệnh A2UI (v0.8)

Canvas hiện chấp nhận thông điệp server→client **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) chưa được hỗ trợ.

Ví dụ CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Kiểm thử nhanh:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Kích hoạt các lượt chạy agent từ Canvas

Canvas có thể kích hoạt các lượt chạy agent mới qua deep link:

- `openclaw://agent?...`

Ví dụ (trong JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Ứng dụng sẽ yêu cầu xác nhận trừ khi có khóa hợp lệ được cung cấp.

## Ghi chú bảo mật

- Lược đồ Canvas chặn việc duyệt thư mục ngược; các tệp phải nằm dưới gốc phiên.
- Nội dung Canvas cục bộ dùng lược đồ tùy chỉnh (không cần máy chủ loopback).
- URL `http(s)` bên ngoài chỉ được cho phép khi được điều hướng rõ ràng.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [WebChat](/vi/web/webchat)
