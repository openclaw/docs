---
doc-schema-version: 1
read_when:
    - Bạn muốn OpenClaw duy trì hiển thị một mục tiêu xuyên suốt phiên làm việc dài
    - Bạn cần tạm dừng, tiếp tục, chặn, hoàn tất hoặc xóa mục tiêu của phiên làm việc
    - Bạn muốn tìm hiểu các công cụ get_goal, create_goal và update_goal
    - Bạn muốn xem các mục tiêu hiển thị như thế nào trong TUI
summary: 'Mục tiêu phiên: mục tiêu lâu dài cho từng phiên, các điều khiển /goal, công cụ mục tiêu của mô hình, ngân sách token và trạng thái TUI'
title: Mục tiêu
x-i18n:
    generated_at: "2026-07-22T02:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8bfe25eb9901394b32b61729fbcb6a7bd711ed859d284fa39b637000ed7f0a18
    source_path: tools/goal.md
    workflow: 16
---

# Mục tiêu

**Mục tiêu** là một mục đích lâu dài được gắn với phiên OpenClaw hiện tại.
Nó cung cấp cho tác nhân và người vận hành một đích đến chung cho công việc kéo dài,
mà không biến đích đến đó thành tác vụ nền, lời nhắc, công việc Cron hoặc
chỉ thị thường trực.

Mục tiêu là trạng thái phiên: chúng di chuyển cùng khóa phiên, tồn tại qua các lần
khởi động lại tiến trình và xuất hiện trong `/goal`, các công cụ mục tiêu dành cho mô hình và phần chân trang
TUI.

Kết quả hoàn tất của lệnh tách rời được trả về luồng giao tiếp với người dùng ban đầu, vì vậy
lượt tiếp theo vẫn thấy cùng mục tiêu ngay cả khi việc thực thi lệnh sử dụng
một phiên có chính sách sandbox riêng.

## Bắt đầu nhanh

```text
/goal start làm cho CI đạt trạng thái xanh cho PR 87469 và đẩy bản sửa lỗi
/goal
/goal edit làm cho CI đạt trạng thái xanh cho PR 87469, đẩy bản sửa lỗi và cập nhật tài liệu
/goal pause đang chờ CI
/goal resume
/goal complete đã đẩy và xác minh
/goal clear
```

`start` là tùy chọn: `/goal get CI green for PR 87469` cũng tạo một mục tiêu,
vì mọi văn bản sau `/goal` không phải là một từ hành động đã biết đều được coi là
mục đích mới.

## Mục tiêu dùng để làm gì

Sử dụng mục tiêu khi một phiên có kết quả cụ thể cần luôn hiển thị
qua nhiều lượt:

- Hoàn tất một PR: sửa lỗi, xác minh, tự động review, đẩy lên và mở hoặc cập nhật PR.
- Một lượt gỡ lỗi: tái hiện lỗi, xác định bề mặt chịu trách nhiệm, vá lỗi và
  chứng minh bản sửa lỗi.
- Một lượt xử lý tài liệu: đọc tài liệu liên quan, viết trang mới, liên kết chéo và
  xác minh bản dựng tài liệu.
- Một tác vụ bảo trì: kiểm tra trạng thái hiện tại, thực hiện các thay đổi có giới hạn, chạy
  các bước kiểm tra phù hợp và báo cáo những gì đã thay đổi.

Mục tiêu không phải là hàng đợi tác vụ. Sử dụng [Task Flow](/vi/automation/taskflow),
[các tác vụ](/vi/automation/tasks), [công việc Cron](/vi/automation/cron-jobs) hoặc
[chỉ thị thường trực](/vi/automation/standing-orders) khi công việc cần chạy tách rời,
lặp lại theo lịch, phân nhánh thành các công việc con được quản lý hoặc tồn tại như một chính sách.

## Tham chiếu lệnh

`/goal` không có đối số sẽ in bản tóm tắt mục tiêu hiện tại:

```text
Mục tiêu
Trạng thái: đang hoạt động
Mục đích: làm cho CI đạt trạng thái xanh cho PR 87469 và đẩy bản sửa lỗi
Token đã dùng: 12k
Ngân sách token: 12k/50k

Lệnh: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Lệnh                                                | Tác dụng                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` hoặc `/goal status`                           | Hiển thị mục tiêu hiện tại.                                              |
| `/goal start <objective>`                           | Tạo mục tiêu mới cho phiên hiện tại.                                     |
| `/goal set <objective>`, `/goal create <objective>` | Bí danh của `start`.                                                     |
| `/goal <objective>`                                 | Cũng tạo mục tiêu mới (mọi văn bản không phải là từ hành động được nhận dạng). |
| `/goal edit <objective>`                            | Diễn đạt lại mục đích hiện tại; trạng thái và việc tính token được giữ nguyên. |
| `/goal pause [note]`                                | Tạm dừng một mục tiêu đang hoạt động.                                    |
| `/goal resume [note]`                               | Tiếp tục một mục tiêu đang tạm dừng, bị chặn, bị giới hạn mức sử dụng hoặc bị giới hạn ngân sách. |
| `/goal complete [note]`                             | Đánh dấu mục tiêu đã đạt được.                                           |
| `/goal done [note]`                                 | Bí danh của `complete`.                                                    |
| `/goal block [note]`                                | Đánh dấu mục tiêu bị chặn.                                                |
| `/goal blocked [note]`                              | Bí danh của `block`.                                                       |
| `/goal clear`                                       | Xóa mục tiêu khỏi phiên.                                                  |

Mỗi phiên chỉ có thể tồn tại một mục tiêu tại một thời điểm. Việc bắt đầu mục tiêu thứ hai sẽ thất bại
với `Goal error: goal already exists` cho đến khi mục tiêu hiện tại được xóa.

`/goal start` không nhận cờ ngân sách token; ngân sách chỉ có thể được đặt
thông qua công cụ dành cho mô hình `create_goal`.

## Trạng thái

- `active`: phiên đang theo đuổi mục tiêu.
- `paused`: người vận hành đã tạm dừng mục tiêu; `/goal resume` đưa mục tiêu trở lại trạng thái hoạt động.
- `blocked`: tác nhân hoặc người vận hành đã báo cáo một trở ngại thực sự; `/goal resume`
  đưa mục tiêu trở lại trạng thái hoạt động khi có thông tin hoặc trạng thái mới.
- `budget_limited`: đã đạt đến ngân sách token được cấu hình; `/goal resume`
  bắt đầu lại việc theo đuổi cùng mục đích với một khoảng ngân sách mới.
- `usage_limited`: dành riêng cho trạng thái dừng do giới hạn mức sử dụng trong tương lai; `/goal
resume` bắt đầu lại việc theo đuổi theo cùng cách.
- `complete`: mục tiêu đã đạt được. Mục tiêu hoàn tất là trạng thái kết thúc; sử dụng `/goal
clear` trước khi bắt đầu mục tiêu khác.

`/new` và `/reset` xóa mục tiêu của phiên hiện tại vì chúng chủ ý
bắt đầu ngữ cảnh phiên mới.

## Ngân sách token

Mục tiêu có thể có ngân sách token dương tùy chọn, được đặt thông qua
tham số `token_budget` của công cụ `create_goal`. Ngân sách được đo từ
số lượng token mới của phiên tại thời điểm tạo mục tiêu. Nếu phiên chỉ có
ảnh chụp token cũ hoặc không xác định khi mục tiêu bắt đầu, OpenClaw sẽ chờ
ảnh chụp mới tiếp theo và dùng ảnh chụp đó làm đường cơ sở, vì vậy token đã dùng trước khi
mục tiêu tồn tại sẽ không bị tính vào mục tiêu.

Khi mức sử dụng đạt đến ngân sách, mục tiêu chuyển sang `budget_limited`. Điều này
không xóa mục tiêu hoặc xóa bỏ mục đích; nó cho người vận hành và
tác nhân biết rằng mục tiêu không còn được chủ động theo đuổi cho đến khi được tiếp tục hoặc
xóa. Việc tiếp tục sẽ bắt đầu một khoảng ngân sách mới tại số lượng token mới
hiện tại.

Ngân sách token là rào chắn cho mục tiêu của phiên, không phải giới hạn thanh toán. Hạn mức
của nhà cung cấp, báo cáo chi phí và hành vi cửa sổ ngữ cảnh vẫn sử dụng các
cơ chế kiểm soát mô hình và mức sử dụng OpenClaw thông thường.

## Công cụ mô hình

OpenClaw cung cấp ba công cụ mục tiêu cho các bộ khung tác nhân:

| Công cụ       | Mục đích                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Đọc mục tiêu của phiên hiện tại: trạng thái, mục đích, mức sử dụng token và ngân sách token.                            |
| `create_goal` | Chỉ tạo mục tiêu khi người dùng hoặc chỉ dẫn hệ thống yêu cầu rõ ràng. Thất bại nếu phiên đã có mục tiêu.               |
| `update_goal` | Đánh dấu mục tiêu là `complete` hoặc `blocked`.                                                                         |

Mô hình không thể âm thầm tạm dừng, tiếp tục, xóa hoặc thay thế mục tiêu. Những thao tác đó vẫn là
cơ chế kiểm soát của người vận hành/phiên thông qua `/goal` và các lệnh đặt lại, để tác nhân
có thể báo cáo việc đạt được mục tiêu hoặc một trở ngại thực sự mà không âm thầm thay đổi
đích đến.

`update_goal` chỉ nên đánh dấu mục tiêu là `complete` khi mục đích
thực sự đã đạt được. Nó chỉ nên đánh dấu mục tiêu là `blocked` sau khi cùng một
điều kiện gây chặn tái diễn trong ít nhất ba lượt mục tiêu liên tiếp, không phải vì
khó khăn thông thường hoặc thiếu hoàn thiện.

## Ngữ cảnh mục tiêu trong mọi lượt

Mỗi lượt người dùng/trò chuyện có mục tiêu đang hoạt động đều bao gồm dòng ngữ cảnh vai trò người dùng này:

```text
Mục tiêu đang hoạt động: <objective> — thúc đẩy mục tiêu hoặc cập nhật trạng thái của mục tiêu (get_goal/update_goal).
```

OpenClaw giữ dòng này ngắn gọn bằng cách cắt ngắn các mục đích dài. Các mục tiêu đang tạm dừng,
bị chặn, bị giới hạn ngân sách, bị giới hạn mức sử dụng và đã hoàn tất sẽ không được chèn,
vì vậy lệnh dừng của người vận hành vẫn có hiệu lực cho đến khi mục tiêu được tiếp tục.

## Giao diện điều khiển

Giao diện điều khiển web hiển thị mục tiêu dưới dạng một nhãn nhỏ gọn phía trên trình soạn thảo trò chuyện:
biểu tượng trạng thái, nhãn trạng thái (ví dụ `Pursuing goal`), mục đích
được cắt ngắn và bộ đếm thời gian đã trôi qua trực tiếp.

Nhãn này có các nút điều khiển nội tuyến:

- **Bút chì** điền sẵn `/goal edit <objective>` vào trình soạn thảo để
  có thể diễn đạt lại và gửi mục đích.
- **Tạm dừng / tiếp tục** chuyển đổi giữa `/goal pause` và `/goal resume` dựa trên
  trạng thái hiện tại.
- **Thùng rác** gửi `/goal clear`.
- **Dấu chữ V** mở rộng nhãn để hiển thị đầy đủ mục đích, ghi chú trạng thái mới nhất,
  mức sử dụng token và thời gian đã trôi qua.

Các nút hành động bị ẩn khi trình soạn thảo không thể gửi (ví dụ
khi kết nối Gateway bị ngắt); dấu chữ V mở rộng vẫn hoạt động.

## TUI

Phần chân trang TUI giữ mục tiêu của phiên đang hoạt động hiển thị bên cạnh các trường tác nhân,
phiên và mô hình, trước các chỉ báo token/chế độ.

Ví dụ về phần chân trang:

- `Pursuing goal (12k/50k)` cho mục tiêu đang hoạt động có ngân sách token.
- `Goal paused (/goal resume)` cho mục tiêu đang tạm dừng.
- `Goal blocked (/goal resume)` cho mục tiêu bị chặn.
- `Goal hit usage limits (/goal resume)` cho mục tiêu bị giới hạn mức sử dụng.
- `Goal unmet (50k/50k)` cho mục tiêu bị giới hạn ngân sách.
- `Goal achieved (42k)` cho mục tiêu đã hoàn tất.

Phần chân trang được chủ ý giữ nhỏ gọn. Sử dụng `/goal` để xem đầy đủ mục đích,
ghi chú, ngân sách token và các lệnh có sẵn.

## Hành vi kênh

`/goal` hoạt động trong các phiên OpenClaw hỗ trợ lệnh, bao gồm TUI và
các bề mặt trò chuyện cho phép lệnh văn bản. Trạng thái mục tiêu được gắn với
khóa phiên, không phải phương tiện truyền tải, vì vậy hai bề mặt dùng chung khóa phiên sẽ thấy
cùng một mục tiêu.

Trạng thái mục tiêu không phải là chỉ thị phân phối: nó không buộc phản hồi phải đi qua một
kênh, thay đổi hành vi hàng đợi, phê duyệt công cụ hoặc lên lịch công việc.

## Khắc phục sự cố

| Thông báo                              | Ý nghĩa                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Phiên đã có một mục tiêu. Sử dụng `/goal` để kiểm tra, `/goal complete` nếu đã xong hoặc `/goal clear` trước khi bắt đầu một mục đích khác. |
| `Goal error: goal not found`           | Phiên chưa có mục tiêu. Bắt đầu một mục tiêu bằng `/goal start <objective>`.                                                                |
| `Goal error: goal is already complete` | Mục tiêu đang ở trạng thái kết thúc. Xóa mục tiêu trước khi bắt đầu hoặc tiếp tục một mục đích khác.                                          |

Nếu mức sử dụng token hiển thị `0` hoặc có vẻ đã cũ, phiên đang hoạt động có thể chưa có
ảnh chụp token mới. Mức sử dụng được làm mới khi OpenClaw ghi lại mức sử dụng phiên
và tổng số được suy ra từ bản ghi hội thoại.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [TUI](/vi/web/tui)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Compaction](/vi/concepts/compaction)
- [Task Flow](/vi/automation/taskflow)
- [Chỉ thị thường trực](/vi/automation/standing-orders)
