---
read_when:
    - Triển khai bảng Canvas trên macOS
    - Thêm các điều khiển tác nhân cho không gian làm việc trực quan
    - Gỡ lỗi quá trình tải canvas trong WKWebView
summary: Bảng Canvas do tác tử điều khiển, được nhúng qua WKWebView + lược đồ URL tùy chỉnh
title: Canvas
x-i18n:
    generated_at: "2026-07-19T06:03:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56532246bc06601aa753a59f85f33bfa8d6599deecade591a03972e8b9b16fc2
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Ứng dụng macOS nhúng một **bảng Canvas** do tác nhân điều khiển bằng `WKWebView`, một
không gian làm việc trực quan gọn nhẹ dành cho HTML/CSS/JS, A2UI và các
giao diện người dùng tương tác nhỏ.

## Vị trí của Canvas

Trạng thái Canvas được lưu trong Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Bảng Canvas phục vụ các tệp đó thông qua một lược đồ URL tùy chỉnh,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Nếu không có `index.html` ở thư mục gốc, ứng dụng sẽ hiển thị một trang khung dựng sẵn.

## Hành vi của bảng

- Bảng không viền, có thể thay đổi kích thước, được neo gần thanh menu (hoặc con trỏ chuột).
- Việc hiển thị Canvas không chuyển ứng dụng hoặc chiếm tiêu điểm bàn phím.
- Ghi nhớ kích thước/vị trí theo từng phiên.
- Tự động tải lại khi các tệp Canvas cục bộ thay đổi.
- Mỗi lần chỉ hiển thị một bảng Canvas (chuyển phiên khi cần).

Có thể tắt Canvas trong Settings -> **Allow Canvas**. Khi bị tắt,
các lệnh Node của Canvas trả về `CANVAS_DISABLED`.

## Bề mặt API của tác nhân

Canvas được cung cấp qua WebSocket của Gateway, vì vậy tác nhân có thể hiển thị/ẩn
bảng, điều hướng đến một đường dẫn hoặc URL, đánh giá JavaScript và chụp
ảnh nhanh:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`eval` và `a2ui.*` cập nhật nội dung mà không mở hoặc làm lộ bảng. Chỉ
`present`, `navigate` hoặc thao tác của người dùng mới hiển thị bảng; sau khi ẩn, các bản cập nhật nội dung
vẫn tiếp tục được áp dụng cho bảng đang ẩn. `snapshot` cần một bảng đang hiển thị và
nếu không sẽ trả về `CANVAS_HIDDEN`; trước tiên hãy chạy `present`.

`canvas.navigate` chấp nhận các đường dẫn Canvas cục bộ, URL `http(s)` và URL `file://`.
Truyền `"/"` sẽ hiển thị khung dựng cục bộ hoặc `index.html`.

Các đích do Gateway lưu trữ trong `/__openclaw__/canvas/` và
`/__openclaw__/a2ui/` được phân giải thông qua URL Canvas có phạm vi hiện tại của phiên
Node. Ứng dụng làm mới quyền hạn ngắn hạn đó trước khi điều hướng;
bạn không cần tự tạo hoặc sao chép URL quyền hạn.

## A2UI trong Canvas

A2UI được máy chủ Canvas của Gateway lưu trữ và hiển thị bên trong bảng
Canvas. Khi Gateway quảng bá một máy chủ Canvas, ứng dụng macOS tự động điều hướng
đến trang máy chủ A2UI trong lần mở đầu tiên.

URL được quảng bá có phạm vi theo quyền hạn, ví dụ
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Hãy coi URL này là thông tin xác thực tạm thời, không phải một liên kết ổn định.

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

## Kích hoạt lượt chạy tác nhân từ Canvas

Canvas có thể kích hoạt các lượt chạy tác nhân mới thông qua liên kết sâu `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Các tham số truy vấn được hỗ trợ:

| Tham số                    | Ý nghĩa                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`         | Lời nhắc tác nhân được điền sẵn.                      |
| `sessionKey`         | Mã định danh phiên ổn định.                           |
| `thinking`         | Hồ sơ suy luận tùy chọn.                              |
| `deliver`, `to`, `channel` | Đích phân phối.                         |
| `timeoutSeconds`         | Thời gian chờ lượt chạy tùy chọn.                     |
| `key`         | Mã thông báo an toàn do ứng dụng tạo cho các bên gọi cục bộ đáng tin cậy. |

Ứng dụng yêu cầu xác nhận trừ khi có khóa hợp lệ. Các liên kết
không có khóa hiển thị thông điệp và URL trước khi phê duyệt, đồng thời bỏ qua các trường
định tuyến phân phối; các liên kết có khóa sử dụng đường dẫn chạy Gateway thông thường.

## Ghi chú bảo mật

- Lược đồ Canvas chặn hành vi duyệt ngược thư mục; các tệp phải nằm trong thư mục gốc của phiên.
- Nội dung Canvas cục bộ sử dụng một lược đồ tùy chỉnh (không cần máy chủ loopback).
- Các URL `http(s)` bên ngoài chỉ được phép khi điều hướng rõ ràng đến chúng.
- Các trang web thông thường chỉ được dùng để hiển thị. Các thao tác của tác nhân chỉ được chấp nhận từ
  lược đồ Canvas thuộc sở hữu của ứng dụng hoặc đúng tài liệu A2UI của Gateway có phạm vi theo quyền hạn
  do ứng dụng chọn; khung con, chuyển hướng, quyền hạn hết hạn và truy vấn
  đã thay đổi không thể gửi thao tác.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [WebChat](/vi/web/webchat)
