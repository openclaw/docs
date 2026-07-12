---
read_when:
    - Cho phép tác nhân Gateway xem và điều khiển màn hình nền của máy Mac
    - Kích hoạt, quyền hạn hoặc an toàn khi sử dụng máy tính
    - Mở rộng lệnh Node `computer.act` hoặc các trình thực thi của lệnh này
summary: Điều khiển máy tính để bàn bằng tác nhân trên Node macOS đã ghép đôi thông qua công cụ computer và lệnh Node computer.act
title: Sử dụng máy tính
x-i18n:
    generated_at: "2026-07-12T08:04:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Tính năng sử dụng máy tính cho phép tác tử Gateway xem và điều khiển máy tính để bàn **macOS** đã ghép đôi: tính năng này chụp ảnh màn hình bằng lệnh Node `screen.snapshot` hiện có và điều khiển con trỏ cùng bàn phím thông qua một lệnh Node nguy hiểm duy nhất là `computer.act`. Tập hành động tuân theo các hành động sử dụng máy tính cốt lõi của Anthropic; tính năng thu phóng `computer_20251124` tùy chọn không được cung cấp. Một mô hình có khả năng thị giác điều khiển tính năng này thông qua công cụ tác tử `computer` tích hợp sẵn.

Tác tử phát ra một lệnh thống nhất duy nhất là `computer.act`; tác tử không thể biết một Node thực thi lệnh đó bằng cách nào. Node macOS thực thi `computer.act` trong cùng tiến trình bằng các dịch vụ Peekaboo nhúng cùng một số thành phần CoreGraphics tối thiểu (quyền TCC chính xác, không có tiến trình bổ sung). Sau này, các nền tảng khác có thể thực thi cùng lệnh mà không cần thay đổi hợp đồng dành cho tác tử.

## Yêu cầu

- Một Node **macOS** đã ghép đôi (ứng dụng OpenClaw macOS đang chạy ở chế độ Node).
- Đã bật cài đặt **Allow Computer Control** trong ứng dụng macOS (mặc định: tắt).
- Đã cấp quyền **Accessibility** của macOS cho OpenClaw (để đưa đầu vào con trỏ/bàn phím vào hệ thống) và quyền **Screen Recording** (cho `screen.snapshot`).
- Lệnh `computer.act` đã được kích hoạt trên Gateway (lệnh này nguy hiểm và mặc định bị vô hiệu hóa).
- Một mô hình tác tử có khả năng thị giác.
- Chính sách công cụ cung cấp `computer`. Hồ sơ `coding` mặc định không cung cấp công cụ này. Thêm `computer` vào `tools.alsoAllow`; các tác tử trong sandbox cũng cần công cụ này trong `tools.sandbox.tools.alsoAllow`.

## Công cụ tác tử `computer`

Công cụ `computer` tích hợp sẵn nhận một hành động cho mỗi lần gọi. Tọa độ là số nguyên pixel không âm trong ảnh chụp màn hình gần nhất; Node ánh xạ chúng thành các điểm trên màn hình. Các hành động dùng tọa độ phải gửi lại `frameId` từ kết quả ảnh chụp màn hình và `screenIndex` được chỉ định rõ phải khớp với khung hình đó. OpenClaw cũng chuyển danh tính màn hình do Node cấp từ ảnh chụp màn hình vào hành động, nhờ đó việc màn hình kết nối lại hoặc thay đổi hình học sẽ bị từ chối an toàn thay vì âm thầm chuyển mục tiêu sang cùng chỉ mục. Các bước kiểm tra này từ chối token được đoán và token từ một khung hình hoặc màn hình khác đã được gửi. Token không bảo đảm tính mới: ứng dụng có thể thay đổi các pixel trên cùng màn hình sau khi chụp, vì vậy hãy chụp ảnh màn hình mới bất cứ khi nào cảnh có thể đã thay đổi.

- Đọc: `screenshot`.
- Con trỏ: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (với `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Cuộn: `scroll` với `scrollDirection` (`up|down|left|right`) và `scrollAmount` (số nấc bánh xe).
- Bàn phím: `type` (văn bản), `key` (tổ hợp như `cmd+shift+t` hoặc `Return`), `hold_key` (giữ tổ hợp trong `text` trong `duration` giây).
- Điều tiết nhịp: `wait` (`duration` giây).

Các phím bổ trợ được truyền qua trường `text` trong hành động nhấp và cuộn (`shift`, `ctrl`, `alt`, `cmd`). Sau một hành động nhập liệu, công cụ trả về ảnh chụp màn hình mới để mô hình có thể quan sát kết quả. Nếu có nhiều hơn một Node hỗ trợ điều khiển máy tính được kết nối, hãy truyền `node` một cách rõ ràng.

Ảnh chụp màn hình được giữ **chỉ dành cho mô hình**: chúng không bao giờ tự động được gửi đến kênh trò chuyện. Hãy coi toàn bộ nội dung trên màn hình là đầu vào không đáng tin cậy; công cụ cảnh báo mô hình không làm theo các hướng dẫn trên màn hình xung đột với yêu cầu của người dùng.

## Lệnh Node `computer.act`

`computer.act` là lệnh Node duy nhất mà công cụ dùng để định tuyến đầu vào (`node.invoke` với `command: "computer.act"`). Lệnh này:

- **Mặc định nguy hiểm**: được liệt kê trong các lệnh Node nguy hiểm tích hợp sẵn và bị loại khỏi danh sách cho phép khi chạy cho đến khi được kích hoạt rõ ràng. Node macOS vẫn có thể khai báo lệnh này khi ghép đôi để bề mặt được phê duyệt một lần.
- Hiện tại **chỉ dành cho macOS**: chỉ được quảng bá bởi Node macOS đã bật **Allow Computer Control**.

Các thao tác đọc tái sử dụng `screen.snapshot`; không có đường dẫn chụp thứ hai. Xem [Node camera và màn hình](/vi/nodes/camera) để biết lệnh chụp dùng chung.

## Bật và kích hoạt

1. Trong ứng dụng macOS, bật **Settings → Allow Computer Control**. Sau đó, mở **Settings → Permissions** và cấp **Accessibility** cùng **Screen Recording** trong phần Cài đặt hệ thống của macOS.
2. Phê duyệt bản cập nhật ghép đôi trên Gateway (lệnh mới buộc phải ghép đôi lại).
3. Cung cấp công cụ cho tác tử có khả năng thị giác. Với hồ sơ `coding` mặc định:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Các tác tử trong sandbox cũng cần cổng kiểm soát thứ hai này:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Kích hoạt `computer.act` trong một khoảng thời gian hữu hạn. Plugin `phone-control` cung cấp nhóm `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Việc kích hoạt yêu cầu `operator.admin` (hoặc chủ sở hữu) và tự động hết hạn. Nhóm `/phone arm all` cũ cố ý không bao gồm quyền điều khiển máy tính để bàn; hãy sử dụng nhóm `computer` rõ ràng. Việc kích hoạt chỉ chuyển đổi những gì Gateway có thể gọi; ứng dụng macOS vẫn thực thi cài đặt **Allow Computer Control** và các quyền hệ điều hành của ứng dụng.

Để cấp quyền lâu dài, hãy thêm `computer.act` vào `gateway.nodes.allowCommands` **và xóa lệnh này khỏi** `gateway.nodes.denyCommands`; danh sách từ chối được ưu tiên. Quyền lâu dài không tự động hết hạn. Các mục đã tồn tại trước `/phone arm` vẫn còn sau `/phone disarm`; không chuyển một quyền cấp tạm thời thành quyền lâu dài trong khi quyền đó đang được kích hoạt.

Việc cấp quyền được chủ ý tách biệt giữa thao tác bật và thao tác sử dụng. Kích hoạt hoặc
cấu hình lâu dài `computer.act` yêu cầu thẩm quyền quản trị.
Sau khi được kích hoạt, một người vận hành đã xác thực có `operator.write` có thể gọi
`computer.act` thông qua `node.invoke` cho đến khi quyền cấp hết hạn hoặc bị vô hiệu hóa;
không có bước kiểm tra quản trị cho từng hành động. Việc phê duyệt một Node khai báo
`computer.act` chỉ ghi nhận bề mặt để sau này có thể kích hoạt và bản thân thao tác đó không
cho phép gọi lệnh.

## An toàn

- Trước khi cấp quyền, mọi lớp (chính sách công cụ, chính sách lệnh Gateway, cài đặt macOS, Accessibility và Screen Recording) đều phải đồng thuận. Sau khi được kích hoạt, các hành động thực thi mà không cần xác nhận cho từng hành động cho đến khi hết hạn hoặc chạy `/phone disarm`.
- Văn bản được nhập từng cụm tự vị một. Việc hủy, ngắt kết nối, tạm dừng, vô hiệu hóa hoặc thay thế điểm cuối sẽ dừng trước cụm tự vị tiếp theo thay vì để phần còn lại đã lỗi thời tiếp tục.
- Ảnh chụp màn hình chỉ dành cho mô hình và không bao giờ được tự động gửi đến cuộc trò chuyện (vấn đề [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Hãy coi nội dung màn hình là không đáng tin cậy; nội dung này có thể chứa hành vi tiêm chỉ dẫn.

## Mối quan hệ với các đường dẫn điều khiển máy tính để bàn khác

Đây là đường dẫn do tác tử điều khiển. Xem [cầu nối Peekaboo](/vi/platforms/mac/peekaboo) để biết mối quan hệ của đường dẫn này với máy chủ PeekabooBridge, Codex Computer Use và MCP `cua-driver` trực tiếp.
