---
read_when:
    - Triển khai bảng Canvas trên macOS
    - Thêm các điều khiển agent cho không gian làm việc trực quan
    - Gỡ lỗi tải canvas trong WKWebView
summary: Bảng Canvas do agent điều khiển được nhúng qua WKWebView + lược đồ URL tùy chỉnh
title: Khung vẽ
x-i18n:
    generated_at: "2026-06-28T00:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Ứng dụng macOS nhúng một **bảng Canvas** do agent điều khiển bằng `WKWebView`. Đây là không gian làm việc trực quan nhẹ cho HTML/CSS/JS, A2UI và các bề mặt UI tương tác nhỏ.

## Nơi Canvas lưu trữ

Trạng thái Canvas được lưu trong Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Bảng Canvas phục vụ các tệp đó qua một **lược đồ URL tùy chỉnh**:

- `openclaw-canvas://<session>/<path>`

Ví dụ:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` ở thư mục gốc, ứng dụng sẽ hiển thị một **trang khung dựng sẵn**.

## Hành vi của bảng

- Bảng không viền, có thể thay đổi kích thước, được neo gần thanh menu (hoặc con trỏ chuột).
- Ghi nhớ kích thước/vị trí theo từng phiên.
- Tự động tải lại khi các tệp canvas cục bộ thay đổi.
- Mỗi lần chỉ hiển thị một bảng Canvas (phiên được chuyển đổi khi cần).

Canvas có thể được tắt trong Settings → **Allow Canvas**. Khi bị tắt, các lệnh node canvas trả về `CANVAS_DISABLED`.

## Bề mặt API agent

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

A2UI được Gateway canvas host lưu trữ và được kết xuất bên trong bảng Canvas.
Khi Gateway quảng bá một Canvas host, ứng dụng macOS tự động điều hướng đến trang host A2UI trong lần mở đầu tiên.

URL host A2UI mặc định:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Lệnh A2UI (v0.8)

Canvas hiện chấp nhận các thông điệp máy chủ→máy khách **A2UI v0.8**:

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

Kiểm tra nhanh:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Kích hoạt lượt chạy agent từ Canvas

Canvas có thể kích hoạt các lượt chạy agent mới qua deep link:

- `openclaw://agent?...`

Ví dụ (trong JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Các tham số truy vấn được hỗ trợ:

- `message`: prompt agent được điền sẵn.
- `sessionKey`: mã định danh phiên ổn định.
- `thinking`: hồ sơ thinking tùy chọn.
- `deliver`, `to`, hoặc `channel`: đích phân phối.
- `timeoutSeconds`: thời gian chờ lượt chạy tùy chọn.
- `key`: mã an toàn do ứng dụng tạo cho các caller cục bộ đáng tin cậy.

Ứng dụng yêu cầu xác nhận trừ khi cung cấp khóa hợp lệ. Các liên kết không có khóa hiển thị thông điệp và URL trước khi phê duyệt, đồng thời bỏ qua các trường định tuyến phân phối; liên kết có khóa sử dụng đường dẫn chạy Gateway bình thường.

## Ghi chú bảo mật

- Lược đồ Canvas chặn duyệt vượt thư mục; các tệp phải nằm dưới thư mục gốc của phiên.
- Nội dung Canvas cục bộ sử dụng lược đồ tùy chỉnh (không cần máy chủ loopback).
- URL `http(s)` bên ngoài chỉ được cho phép khi được điều hướng rõ ràng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [WebChat](/vi/web/webchat)
