---
read_when:
    - Xây dựng hoặc sắp xếp lại các tab và tiện ích trong không gian làm việc
    - Cho phép một tác tử xây dựng không gian làm việc
    - Rà soát mô hình phê duyệt và hộp cát của tiện ích tùy chỉnh
summary: Không gian làm việc có thể kết hợp bởi tác tử trong giao diện điều khiển
title: Không gian làm việc
x-i18n:
    generated_at: "2026-07-12T08:30:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

Thẻ **Không gian làm việc** trong [giao diện điều khiển](/vi/web/control-ui) là nơi bạn và các tác nhân cùng nhau sắp xếp. Các thẻ, tiện ích, vị trí của chúng trên lưới 12 cột và các liên kết dữ liệu đều nằm trong một tài liệu duy nhất. Bất kỳ thành phần nào có thể chỉnh sửa tài liệu đó đều có thể tạo nên không gian làm việc: bạn, CLI `openclaw workspaces` hoặc một tác nhân gọi các công cụ `workspace_*`.

Mọi thao tác ghi đều đi qua cùng một quy trình đã được xác thực, vì vậy bố cục của người dùng và bố cục của tác nhân không thể sai lệch nhau. Mỗi thao tác ghi được chấp nhận sẽ tăng phiên bản và phát sự kiện `plugin.workspaces.changed`, nhờ đó chỉnh sửa của tác nhân xuất hiện trong trình duyệt đang mở mà không cần tải lại.

## Bật Không gian làm việc

Plugin Không gian làm việc đi kèm bị tắt theo mặc định. Trong giao diện điều khiển, mở **Plugin**, tìm **Không gian làm việc** và chọn **Bật**. Bạn cũng có thể bật Plugin này từ CLI:

```sh
openclaw plugins enable workspaces
```

Việc bật Plugin sẽ thêm thẻ **Không gian làm việc**, đồng thời cung cấp CLI `openclaw workspaces` và các công cụ tác nhân `workspace_*`. Việc tắt Plugin sẽ loại bỏ các bề mặt này mà không xóa cơ sở dữ liệu không gian làm việc hoặc tài nguyên tiện ích.

## Không gian làm việc mặc định

Trong lần tải đầu tiên, bạn sẽ có một không gian làm việc **Tổng quan**: các thẻ chi phí và token, tình trạng phiên bản đang chạy, các phiên, trạng thái cron và nguồn cấp dữ liệu hoạt động. Đây là nội dung không gian làm việc thông thường — bạn có thể kéo, thu gọn, ẩn hoặc xóa nội dung đó.

## Tiện ích tích hợp sẵn

Chín tiện ích đáng tin cậy được cung cấp cùng Plugin và hiển thị dưới dạng giao diện chính chủ:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Các tiện ích khai báo dữ liệu thông qua **liên kết** và không bao giờ tự tìm nạp dữ liệu:

| Liên kết | Phân giải thành |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | Một giá trị cố định được lưu trong tài liệu (tối đa 8 KB). |
| `file`   | Một tệp JSON, Markdown hoặc CSV trong `<stateDir>/workspaces/data/`, có thể được thu hẹp bằng con trỏ JSON. |
| `rpc`    | Một trong các phương thức Gateway chỉ đọc thuộc danh sách cho phép cố định, được giao diện điều khiển đáng tin cậy phân giải. |

Liên kết `file` là cách đơn giản nhất để đưa các số liệu của riêng bạn vào không gian làm việc: ghi một tệp JSON vào thư mục dữ liệu và trỏ một `stat-card` đến tệp đó.

## Nguồn gốc

Các thẻ và tiện ích mang dấu `createdBy` — `user`, `system` hoặc `agent:<id>` — được đặt dựa trên chủ thể thực hiện thao tác ghi. Người gọi không thể cung cấp giá trị này, vì vậy tác nhân không thể gắn nhãn sản phẩm của mình là của bạn, và nhãn "AI" trên tiện ích do tác nhân tạo luôn phản ánh đúng nguồn gốc.

## Tiện ích tùy chỉnh

Tác nhân có thể tạo một tiện ích HTML thực bằng `workspace_widget_scaffold` (hoặc bạn có thể tạo bằng `openclaw workspaces widget-scaffold <name>`). Mã do tác nhân tạo được xem là không đáng tin cậy:

- Một tiện ích vừa được dựng khung sẽ được đưa vào sổ đăng ký với trạng thái **đang chờ**. Không có iframe nào được tạo và tuyến tài nguyên trả về mã 404 cho các tệp của tiện ích cho đến khi người vận hành phê duyệt.
- Việc phê duyệt là một quyết định riêng biệt với việc chỉnh sửa bố cục: `workspaces.widget.approve` yêu cầu phạm vi `operator.approvals`, cùng phạm vi bảo vệ các phê duyệt thực thi.
- Tiện ích đã được phê duyệt sẽ hiển thị trong `<iframe sandbox="allow-scripts">` — tuyệt đối không dùng `allow-same-origin` — vì vậy nguồn gốc của tiện ích là không rõ ràng và tiện ích không thể truy cập DOM, bộ nhớ hoặc cookie của phần tử mẹ.
- Các tài nguyên của tiện ích được phân phối với `connect-src 'none'`, chặn hoạt động kết nối mạng của tập lệnh như `fetch`, XHR và WebSocket. Tiện ích không nắm giữ thông tin xác thực và không bao giờ giao tiếp với Gateway.
- Dữ liệu chỉ đến được tiện ích thông qua cầu nối `postMessage` có phiên bản. Mã tùy chỉnh có thể nhận các liên kết `static` đã khai báo, vốn là các giá trị không gian làm việc do tác nhân hoặc người vận hành tạo. Các liên kết RPC và tệp vẫn nằm trong các tiện ích tích hợp đáng tin cậy: trình duyệt cho phép phần tử con trong hộp cát điều hướng khung của chính nó, vì vậy dữ liệu đặc quyền không bao giờ được gửi vào HTML do tác nhân tạo.

Việc gửi câu lệnh vào cuộc trò chuyện từ một tiện ích còn yêu cầu một khả năng trong tệp kê khai, xác nhận cho mỗi lần gọi có trích dẫn chính xác nội dung và tuân theo giới hạn tốc độ.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` cần một thiết bị được ghép nối với phạm vi `operator.approvals`; việc phê duyệt từ giao diện điều khiển thì không cần vì trình duyệt đã có phạm vi này.

## Lưu trữ

Tài liệu không gian làm việc, sổ đăng ký tiện ích tùy chỉnh và vòng hoàn tác gồm 20 mục nằm trong `<stateDir>/workspaces/workspaces.sqlite`. Tài nguyên tiện ích do tác nhân tạo được lưu trên đĩa tại `<stateDir>/workspaces/widgets/<name>/`, còn dữ liệu liên kết tệp nằm tại `<stateDir>/workspaces/data/`, vì tác nhân tạo chúng bằng các công cụ tệp thông thường và tuyến tiện ích phân phối các byte của chúng.
