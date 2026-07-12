---
doc-schema-version: 1
read_when:
    - Bạn muốn OpenClaw luôn hiển thị một mục tiêu xuyên suốt một phiên làm việc dài
    - Bạn cần tạm dừng, tiếp tục, chặn, hoàn thành hoặc xóa mục tiêu của phiên làm việc
    - Bạn muốn tìm hiểu các công cụ get_goal, create_goal và update_goal
    - Bạn muốn xem các mục tiêu hiển thị như thế nào trong TUI
summary: 'Mục tiêu phiên: mục tiêu bền vững theo từng phiên, các lệnh điều khiển /goal, công cụ mục tiêu của mô hình, ngân sách token và trạng thái TUI'
title: Mục tiêu
x-i18n:
    generated_at: "2026-07-12T08:24:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Mục tiêu

Một **mục tiêu** là một mục đích lâu dài được gắn với phiên OpenClaw hiện tại.
Nó cung cấp cho tác nhân và người vận hành một đích đến chung cho công việc kéo dài,
mà không biến đích đến đó thành tác vụ nền, lời nhắc, tác vụ Cron hoặc
chỉ thị thường trực.

Mục tiêu là trạng thái phiên: chúng di chuyển cùng khóa phiên, tồn tại sau khi
tiến trình khởi động lại và xuất hiện trong `/goal`, các công cụ mục tiêu dành cho mô hình và phần chân trang
TUI.

## Bắt đầu nhanh

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` là tùy chọn: `/goal get CI green for PR 87469` cũng tạo một mục tiêu,
vì mọi văn bản sau `/goal` không phải là một từ chỉ hành động đã biết đều được xem là một
mục đích mới.

## Mục tiêu dùng để làm gì

Hãy dùng mục tiêu khi một phiên có kết quả cụ thể cần luôn hiển thị
qua nhiều lượt:

- Hoàn tất một PR: sửa lỗi, xác minh, tự động đánh giá, đẩy thay đổi và mở hoặc cập nhật PR.
- Một phiên gỡ lỗi: tái hiện lỗi, xác định bề mặt sở hữu, vá lỗi và
  chứng minh bản sửa.
- Một lượt xử lý tài liệu: đọc tài liệu liên quan, viết trang mới, tạo liên kết chéo và
  xác minh quá trình dựng tài liệu.
- Một tác vụ bảo trì: kiểm tra trạng thái hiện tại, thực hiện các thay đổi có giới hạn, chạy
  các bước kiểm tra phù hợp và báo cáo những gì đã thay đổi.

Mục tiêu không phải là hàng đợi tác vụ. Hãy dùng [Task Flow](/vi/automation/taskflow),
[các tác vụ](/vi/automation/tasks), [tác vụ Cron](/vi/automation/cron-jobs) hoặc
[chỉ thị thường trực](/vi/automation/standing-orders) khi công việc cần chạy tách biệt,
lặp lại theo lịch, phân nhánh thành các công việc con được quản lý hoặc tồn tại dưới dạng chính sách.

## Tham chiếu lệnh

`/goal` không có đối số sẽ in bản tóm tắt mục tiêu hiện tại:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Lệnh                                                | Tác dụng                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` hoặc `/goal status`                         | Hiển thị mục tiêu hiện tại.                                              |
| `/goal start <objective>`                           | Tạo mục tiêu mới cho phiên hiện tại.                                     |
| `/goal set <objective>`, `/goal create <objective>` | Bí danh của `start`.                                                      |
| `/goal <objective>`                                 | Cũng tạo một mục tiêu mới (mọi văn bản không phải là từ chỉ hành động được nhận dạng). |
| `/goal edit <objective>`                            | Diễn đạt lại mục đích hiện tại; trạng thái và số liệu token được giữ nguyên. |
| `/goal pause [note]`                                | Tạm dừng mục tiêu đang hoạt động.                                        |
| `/goal resume [note]`                               | Tiếp tục mục tiêu đang tạm dừng, bị chặn, bị giới hạn mức sử dụng hoặc bị giới hạn ngân sách. |
| `/goal complete [note]`                             | Đánh dấu mục tiêu đã đạt được.                                           |
| `/goal done [note]`                                 | Bí danh của `complete`.                                                   |
| `/goal block [note]`                                | Đánh dấu mục tiêu bị chặn.                                               |
| `/goal blocked [note]`                              | Bí danh của `block`.                                                      |
| `/goal clear`                                       | Xóa mục tiêu khỏi phiên.                                                 |

Mỗi phiên chỉ có thể có một mục tiêu tại một thời điểm. Việc bắt đầu mục tiêu thứ hai sẽ thất bại
với `Goal error: goal already exists` cho đến khi mục tiêu hiện tại được xóa.

`/goal start` không nhận cờ ngân sách token; chỉ có thể đặt ngân sách
thông qua công cụ `create_goal` dành cho mô hình.

## Trạng thái

- `active`: phiên đang theo đuổi mục tiêu.
- `paused`: người vận hành đã tạm dừng mục tiêu; `/goal resume` kích hoạt lại
  mục tiêu.
- `blocked`: tác nhân hoặc người vận hành đã báo cáo một trở ngại thực sự; `/goal resume`
  kích hoạt lại mục tiêu khi có thông tin hoặc trạng thái mới.
- `budget_limited`: đã đạt ngân sách token được cấu hình; `/goal resume`
  tiếp tục theo đuổi cùng mục đích với một khoảng ngân sách mới.
- `usage_limited`: dành riêng cho trạng thái dừng do giới hạn mức sử dụng trong tương lai; `/goal
resume` tiếp tục theo đuổi theo cách tương tự.
- `complete`: mục tiêu đã đạt được. Mục tiêu đã hoàn tất là trạng thái cuối; hãy dùng `/goal
clear` trước khi bắt đầu mục tiêu khác.

`/new` và `/reset` xóa mục tiêu của phiên hiện tại vì chúng chủ ý
bắt đầu ngữ cảnh phiên mới.

## Ngân sách token

Mục tiêu có thể có ngân sách token dương tùy chọn, được đặt thông qua
tham số `token_budget` của công cụ `create_goal`. Ngân sách được đo từ
số lượng token mới của phiên tại thời điểm tạo mục tiêu. Nếu khi mục tiêu bắt đầu,
phiên chỉ có ảnh chụp token cũ hoặc không xác định, OpenClaw sẽ chờ
ảnh chụp mới tiếp theo và dùng ảnh đó làm đường cơ sở, do đó các token đã sử dụng trước khi
mục tiêu tồn tại sẽ không bị tính vào mục tiêu.

Khi mức sử dụng đạt ngân sách, mục tiêu chuyển sang `budget_limited`. Điều này
không xóa mục tiêu hoặc mục đích; nó cho người vận hành và
tác nhân biết rằng mục tiêu không còn được chủ động theo đuổi cho đến khi được tiếp tục hoặc
xóa. Việc tiếp tục sẽ bắt đầu một khoảng ngân sách mới tại số lượng token mới
hiện tại.

Ngân sách token là rào chắn cho mục tiêu của phiên, không phải giới hạn thanh toán. Hạn mức
của nhà cung cấp, báo cáo chi phí và hành vi cửa sổ ngữ cảnh vẫn sử dụng các
biện pháp kiểm soát mức sử dụng và mô hình thông thường của OpenClaw.

## Công cụ mô hình

OpenClaw cung cấp ba công cụ mục tiêu cho các bộ khung tác nhân:

| Công cụ       | Mục đích                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Đọc mục tiêu của phiên hiện tại: trạng thái, mục đích, mức sử dụng token và ngân sách token.                           |
| `create_goal` | Chỉ tạo mục tiêu khi chỉ dẫn của người dùng hoặc hệ thống yêu cầu rõ ràng. Thất bại nếu phiên đã có mục tiêu.          |
| `update_goal` | Đánh dấu mục tiêu là `complete` hoặc `blocked`.                                                                         |

Mô hình không thể âm thầm tạm dừng, tiếp tục, xóa hoặc thay thế mục tiêu. Các thao tác đó vẫn là
quyền kiểm soát của người vận hành/phiên thông qua `/goal` và các lệnh đặt lại, nhờ đó tác nhân
có thể báo cáo việc đạt mục tiêu hoặc một trở ngại thực sự mà không âm thầm thay đổi
đích đến.

`update_goal` chỉ nên đánh dấu mục tiêu là `complete` khi mục đích
thực sự đã đạt được. Nó chỉ nên đánh dấu mục tiêu là `blocked` sau khi cùng một
điều kiện gây cản trở tái diễn trong ít nhất ba lượt mục tiêu liên tiếp, không phải vì
khó khăn thông thường hoặc thiếu hoàn thiện.

## Ngữ cảnh mục tiêu trong mỗi lượt

Mỗi lượt người dùng/trò chuyện có mục tiêu đang hoạt động đều bao gồm dòng ngữ cảnh ở vai trò người dùng này:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw giữ dòng này ngắn gọn bằng cách cắt bớt các mục đích dài. Các mục tiêu đang tạm dừng,
bị chặn, bị giới hạn ngân sách, bị giới hạn mức sử dụng và đã hoàn tất sẽ không được chèn,
để việc dừng của người vận hành tiếp tục có hiệu lực cho đến khi mục tiêu được tiếp tục.

## Giao diện điều khiển

Giao diện điều khiển web hiển thị mục tiêu dưới dạng một thẻ nhỏ gọn phía trên trình soạn thảo trò chuyện:
một biểu tượng trạng thái, nhãn trạng thái (ví dụ `Pursuing goal`), mục đích đã được cắt bớt
và bộ đếm thời gian đã trôi qua theo thời gian thực.

Thẻ này có các nút điều khiển nội tuyến:

- **Bút chì** điền sẵn `/goal edit <objective>` vào trình soạn thảo để có thể
  diễn đạt lại và gửi mục đích.
- **Tạm dừng / tiếp tục** chuyển đổi giữa `/goal pause` và `/goal resume` dựa
  trên trạng thái hiện tại.
- **Thùng rác** gửi `/goal clear`.
- **Dấu chữ V** mở rộng thẻ để hiển thị toàn bộ mục đích, ghi chú trạng thái mới nhất,
  mức sử dụng token và thời gian đã trôi qua.

Các nút hành động bị ẩn khi trình soạn thảo không thể gửi (ví dụ
khi kết nối Gateway bị gián đoạn); dấu chữ V mở rộng vẫn hoạt động.

## TUI

Phần chân trang TUI giữ cho mục tiêu của phiên đang hoạt động hiển thị bên cạnh các trường tác nhân,
phiên và mô hình, trước các chỉ báo token/chế độ.

Ví dụ về phần chân trang:

- `Pursuing goal (12k/50k)` cho mục tiêu đang hoạt động có ngân sách token.
- `Goal paused (/goal resume)` cho mục tiêu đang tạm dừng.
- `Goal blocked (/goal resume)` cho mục tiêu bị chặn.
- `Goal hit usage limits (/goal resume)` cho mục tiêu bị giới hạn mức sử dụng.
- `Goal unmet (50k/50k)` cho mục tiêu bị giới hạn ngân sách.
- `Goal achieved (42k)` cho mục tiêu đã hoàn tất.

Phần chân trang được chủ ý giữ ngắn gọn. Hãy dùng `/goal` để xem đầy đủ mục đích,
ghi chú, ngân sách token và các lệnh có sẵn.

## Hành vi kênh

`/goal` hoạt động trong các phiên OpenClaw hỗ trợ lệnh, bao gồm TUI và
các bề mặt trò chuyện cho phép lệnh văn bản. Trạng thái mục tiêu được gắn với
khóa phiên, không phải phương thức truyền tải, vì vậy hai bề mặt dùng chung khóa phiên sẽ thấy
cùng một mục tiêu.

Trạng thái mục tiêu không phải là chỉ thị phân phối: nó không buộc phản hồi đi qua một
kênh, thay đổi hành vi hàng đợi, phê duyệt công cụ hoặc lên lịch công việc.

## Khắc phục sự cố

| Thông báo                              | Ý nghĩa                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Phiên đã có mục tiêu. Dùng `/goal` để kiểm tra, `/goal complete` nếu đã xong hoặc `/goal clear` trước khi bắt đầu một mục đích khác.          |
| `Goal error: goal not found`           | Phiên chưa có mục tiêu. Hãy bắt đầu bằng `/goal start <objective>`.                                                                           |
| `Goal error: goal is already complete` | Mục tiêu đang ở trạng thái cuối. Hãy xóa mục tiêu trước khi bắt đầu hoặc tiếp tục một mục đích khác.                                          |

Nếu mức sử dụng token hiển thị `0` hoặc có vẻ đã cũ, phiên đang hoạt động có thể chưa có
ảnh chụp token mới. Mức sử dụng được làm mới khi OpenClaw ghi nhận mức sử dụng của phiên
và tổng số liệu được suy ra từ bản chép lời.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [TUI](/vi/web/tui)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Compaction](/vi/concepts/compaction)
- [Task Flow](/vi/automation/taskflow)
- [Chỉ thị thường trực](/vi/automation/standing-orders)
