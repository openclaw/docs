---
read_when:
    - Bạn muốn một agent chia tách, tập trung, đóng hoặc điều hướng các ngăn trong giao diện điều khiển
    - Bạn muốn một agent hiển thị hoặc ẩn thanh bên, cửa sổ dòng lệnh hoặc các bảng trình duyệt
    - Bạn cần capability ui.command và hợp đồng fan-out
sidebarTitle: Screen
summary: Cho phép một agent sắp xếp Control UI đã kết nối
title: Màn hình
x-i18n:
    generated_at: "2026-07-19T06:06:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df2215db96af29fa6b0db8abad79a0a2787a194dab6d00f9ef32f45521907ae1
    source_path: tools/screen.md
    workflow: 16
---

Công cụ `screen` cho phép tác nhân sắp xếp Control UI trên trình duyệt. Đây là một
bề mặt bố cục và điều hướng có kiểu, không phải công cụ chụp ảnh màn hình hay tự động hóa
trình duyệt.

Công cụ chỉ được cung cấp khi máy khách khởi tạo quảng bá khả năng
`ui-commands`. Ít nhất một Control UI có khả năng này vẫn phải được
kết nối khi công cụ chạy; nếu không, Gateway sẽ trả về `UNAVAILABLE`.

## Hành động

| Hành động                         | Tác dụng                                           | Đầu vào tùy chọn                                      |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `split_right`                | Chia ngăn phiên đích sang bên phải                 | `sessionKey` (mặc định là phiên hiện tại)       |
| `split_down`                | Chia ngăn phiên đích xuống dưới                    | `sessionKey` (mặc định là phiên hiện tại)       |
| `close_pane`                | Đóng ngăn phiên đích                               | `sessionKey` (mặc định là phiên hiện tại)       |
| `focus`                | Đưa tiêu điểm vào ngăn phiên đích                  | `sessionKey` (mặc định là phiên hiện tại)       |
| `navigate`                | Mở phiên đích                                      | `sessionKey` (mặc định là phiên hiện tại)       |
| `sidebar_show` / `sidebar_hide` | Hiện hoặc ẩn thanh bên chính                 | -                                                     |
| `terminal_show` / `terminal_hide` | Hiện hoặc ẩn bảng thiết bị đầu cuối của người vận hành | `dock` (`bottom` hoặc `right`) khi hiển thị |
| `browser_show` / `browser_hide` | Hiện hoặc ẩn bảng trình duyệt                | `dock` (`bottom` hoặc `right`) khi hiển thị |

Một lệnh thành công sẽ trả về `{ "ok": true }` sau khi Gateway phát
sự kiện có kiểu `ui.command`.

## Định tuyến và bảo mật

Protocol v1 chủ ý gửi lệnh đến mọi Control UI đang kết nối có
quảng bá `ui-commands`; lệnh không nhắm đến một thẻ trình duyệt cụ thể. Điều này quan trọng khi
cùng một người vận hành mở nhiều bảng điều khiển.

RPC của Gateway yêu cầu `operator.write`. Công cụ chỉ có thể thay đổi trạng thái
trình bày: công cụ không thể đọc pixel, chụp ảnh màn hình, nhấp vào nội dung
trang tùy ý hoặc bỏ qua quyền của các bảng phiên và người vận hành
đã chọn.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Giao thức Gateway](/vi/gateway/protocol#method-families)
- [Công cụ trình duyệt](/vi/tools/browser)
