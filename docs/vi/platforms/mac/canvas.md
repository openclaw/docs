---
read_when:
    - Triển khai bảng điều khiển Canvas trên macOS
    - Thêm các điều khiển tác nhân cho không gian làm việc trực quan
    - Gỡ lỗi quá trình tải canvas trong WKWebView
summary: Bảng Canvas do tác nhân điều khiển, được nhúng qua WKWebView và lược đồ URL tùy chỉnh
title: Canvas
x-i18n:
    generated_at: "2026-07-16T14:49:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Ứng dụng macOS nhúng một **bảng Canvas** do agent điều khiển bằng `WKWebView`, một
không gian làm việc trực quan gọn nhẹ dành cho HTML/CSS/JS, A2UI và các bề mặt
giao diện người dùng tương tác nhỏ.

## Vị trí của Canvas

Trạng thái Canvas được lưu trong Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Bảng Canvas phân phối các tệp đó qua một lược đồ URL tùy chỉnh,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` ở thư mục gốc, ứng dụng sẽ hiển thị một trang khung dựng sẵn.

## Hành vi của bảng

- Bảng không viền, có thể thay đổi kích thước, được neo gần thanh menu (hoặc con trỏ chuột).
- Ghi nhớ kích thước/vị trí theo từng phiên.
- Tự động tải lại khi các tệp Canvas cục bộ thay đổi.
- Mỗi lần chỉ hiển thị một bảng Canvas (chuyển đổi phiên khi cần).

Có thể tắt Canvas trong Settings -> **Allow Canvas**. Khi bị tắt,
các lệnh Node của Canvas trả về `CANVAS_DISABLED`.

## Bề mặt API của agent

Canvas được cung cấp qua WebSocket của Gateway, vì vậy agent có thể hiện/ẩn
bảng, điều hướng đến một đường dẫn hoặc URL, thực thi JavaScript và chụp
ảnh nhanh:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` chấp nhận các đường dẫn Canvas cục bộ, URL `http(s)` và URL `file://`.
Truyền `"/"` sẽ hiển thị khung dựng cục bộ hoặc `index.html`.

Các đích do Gateway lưu trữ trong `/__openclaw__/canvas/` và
`/__openclaw__/a2ui/` được phân giải thông qua URL Canvas có phạm vi hiện tại
của phiên Node. Ứng dụng làm mới quyền hạn tồn tại ngắn đó trước khi điều hướng;
bạn không cần tự tạo hoặc sao chép URL quyền hạn.

## A2UI trong Canvas

A2UI được máy chủ Canvas của Gateway lưu trữ và kết xuất bên trong bảng
Canvas. Khi Gateway thông báo một máy chủ Canvas, ứng dụng macOS tự động điều hướng
đến trang máy chủ A2UI trong lần mở đầu tiên.

URL được thông báo có phạm vi theo quyền hạn, ví dụ:
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Hãy xem URL này là thông tin xác thực tạm thời, không phải một liên kết ổn định.

### Lệnh A2UI (v0.8)

Canvas chấp nhận các thông điệp A2UI v0.8 từ máy chủ đến máy khách: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
chưa được hỗ trợ.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Nếu bạn đọc được nội dung này thì tính năng đẩy A2UI đang hoạt động."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Kiểm thử nhanh:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Xin chào từ A2UI"
```

## Kích hoạt lượt chạy agent từ Canvas

Canvas có thể kích hoạt các lượt chạy agent mới qua liên kết sâu `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Các tham số truy vấn được hỗ trợ:

| Tham số                    | Ý nghĩa                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Lời nhắc agent được điền sẵn.                         |
| `sessionKey`               | Mã định danh phiên ổn định.                           |
| `thinking`                 | Hồ sơ suy luận tùy chọn.                              |
| `deliver`, `to`, `channel` | Đích phân phối.                                       |
| `timeoutSeconds`           | Thời gian chờ lượt chạy tùy chọn.                     |
| `key`                      | Mã thông báo an toàn do ứng dụng tạo cho các trình gọi cục bộ đáng tin cậy. |

Ứng dụng yêu cầu xác nhận trừ khi cung cấp khóa hợp lệ. Các liên kết
không có khóa hiển thị thông điệp và URL trước khi phê duyệt, đồng thời bỏ qua các trường
định tuyến phân phối; các liên kết có khóa sử dụng đường dẫn chạy Gateway thông thường.

## Lưu ý bảo mật

- Lược đồ Canvas chặn việc duyệt xuyên thư mục; các tệp phải nằm trong thư mục gốc của phiên.
- Nội dung Canvas cục bộ sử dụng một lược đồ tùy chỉnh (không cần máy chủ loopback).
- Các URL `http(s)` bên ngoài chỉ được phép khi được điều hướng rõ ràng.
- Các trang web thông thường chỉ được kết xuất. Hành động của agent chỉ được chấp nhận từ
  lược đồ Canvas do ứng dụng sở hữu hoặc đúng tài liệu A2UI của Gateway có phạm vi quyền hạn
  được ứng dụng chọn; các khung con, chuyển hướng, quyền hạn hết hạn và truy vấn đã thay đổi
  không thể gửi hành động.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [WebChat](/vi/web/webchat)
