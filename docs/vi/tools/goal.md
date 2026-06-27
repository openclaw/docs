---
doc-schema-version: 1
read_when:
    - Bạn muốn OpenClaw giữ một mục tiêu luôn hiển thị trong suốt một phiên dài
    - Bạn cần tạm dừng, tiếp tục, chặn, hoàn tất hoặc xóa mục tiêu phiên
    - Bạn muốn hiểu các công cụ get_goal, create_goal và update_goal
    - Bạn muốn xem các mục tiêu xuất hiện như thế nào trong TUI
summary: 'Mục tiêu phiên: mục tiêu bền vững theo từng phiên, điều khiển /goal, công cụ mục tiêu của mô hình, ngân sách token và trạng thái TUI'
title: Mục tiêu
x-i18n:
    generated_at: "2026-06-27T18:16:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Mục tiêu

Một **mục tiêu** là một mục đích bền vững gắn với phiên OpenClaw hiện tại.
Nó cung cấp cho tác nhân và người vận hành một đích chung cho công việc dài hạn,
mà không biến đích đó thành tác vụ nền, lời nhắc, Cron job hoặc
chỉ thị thường trực.

Mục tiêu là trạng thái phiên. Chúng di chuyển cùng khóa phiên, tồn tại qua các lần
khởi động lại tiến trình, xuất hiện trong `/goal`, khả dụng cho mô hình thông qua
các công cụ mục tiêu, và xuất hiện ở chân trang TUI khi phiên đang hoạt động có mục tiêu.

## Bắt đầu nhanh

Đặt mục tiêu:

```text
/goal start get CI green for PR 87469 and push the fix
```

Kiểm tra mục tiêu:

```text
/goal
```

Tạm dừng khi công việc đang cố ý chờ:

```text
/goal pause waiting for CI
```

Tiếp tục mục tiêu:

```text
/goal resume
```

Đánh dấu hoàn tất:

```text
/goal complete pushed and verified
```

Xóa mục tiêu:

```text
/goal clear
```

## Mục tiêu dùng để làm gì

Dùng mục tiêu khi một phiên có kết quả cụ thể cần luôn hiển thị
qua nhiều lượt tương tác:

- Hoàn tất PR: sửa, xác minh, autoreview, đẩy lên, và mở hoặc cập nhật PR.
- Lượt gỡ lỗi: tái hiện lỗi, xác định bề mặt sở hữu, vá, và chứng minh
  bản sửa.
- Lượt xử lý tài liệu: đọc tài liệu liên quan, viết trang mới, liên kết chéo, và
  xác minh bản dựng tài liệu.
- Tác vụ bảo trì: kiểm tra trạng thái hiện tại, thực hiện các thay đổi có giới hạn, chạy các
  kiểm tra phù hợp, và báo cáo những gì đã thay đổi.

Mục tiêu không phải là hàng đợi tác vụ. Dùng [Luồng tác vụ](/vi/automation/taskflow),
[tác vụ](/vi/automation/tasks), [Cron jobs](/vi/automation/cron-jobs), hoặc
[chỉ thị thường trực](/vi/automation/standing-orders) khi công việc cần chạy tách rời,
lặp lại theo lịch, phân nhánh thành công việc con được quản lý, hoặc tồn tại như một chính sách.

## Tham chiếu lệnh

`/goal` không có đối số sẽ in bản tóm tắt mục tiêu hiện tại:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Lệnh:

- `/goal` hoặc `/goal status` hiển thị mục tiêu hiện tại.
- `/goal start <objective>` tạo mục tiêu mới cho phiên hiện tại.
- `/goal set <objective>` và `/goal create <objective>` là bí danh cho
  `start`.
- `/goal pause [note]` tạm dừng một mục tiêu đang hoạt động.
- `/goal resume [note]` tiếp tục một mục tiêu đang tạm dừng, bị chặn, bị giới hạn theo mức dùng, hoặc
  bị giới hạn theo ngân sách.
- `/goal complete [note]` đánh dấu mục tiêu đã đạt được.
- `/goal done [note]` là bí danh cho `complete`.
- `/goal block [note]` đánh dấu mục tiêu bị chặn.
- `/goal blocked [note]` là bí danh cho `block`.
- `/goal clear` xóa mục tiêu khỏi phiên.

Mỗi phiên chỉ có thể có một mục tiêu tại một thời điểm. Việc bắt đầu mục tiêu thứ hai sẽ thất bại
cho đến khi mục tiêu hiện tại được xóa.

## Trạng thái

Mục tiêu dùng một tập trạng thái nhỏ:

- `active`: phiên đang theo đuổi mục tiêu.
- `paused`: người vận hành đã tạm dừng mục tiêu; `/goal resume` đưa mục tiêu hoạt động lại.
- `blocked`: tác nhân hoặc người vận hành đã báo cáo một điểm chặn thực sự; `/goal resume`
  đưa mục tiêu hoạt động lại khi có thông tin hoặc trạng thái mới.
- `budget_limited`: đã đạt ngân sách token đã cấu hình; `/goal resume`
  bắt đầu lại việc theo đuổi từ cùng mục đích.
- `usage_limited`: dành riêng cho các trạng thái dừng do giới hạn mức dùng; `/goal resume`
  bắt đầu lại việc theo đuổi khi được phép.
- `complete`: mục tiêu đã đạt được. Mục tiêu hoàn tất là trạng thái kết thúc; dùng
  `/goal clear` trước khi bắt đầu mục tiêu khác.

`/new` và `/reset` xóa mục tiêu của phiên hiện tại vì chúng cố ý
bắt đầu ngữ cảnh phiên mới.

## Ngân sách token

Mục tiêu có thể có ngân sách token dương tùy chọn. Ngân sách được lưu cùng
mục tiêu và được đo từ số token mới của phiên tại thời điểm tạo. Nếu
phiên hiện tại chỉ có mức dùng token cũ hoặc không xác định khi mục tiêu bắt đầu,
OpenClaw sẽ chờ ảnh chụp nhanh token phiên mới tiếp theo và dùng ảnh đó làm
đường cơ sở, vì vậy token đã dùng trước khi mục tiêu tồn tại sẽ không bị tính vào mục tiêu.

Khi mức dùng token đạt ngân sách, mục tiêu chuyển thành `budget_limited`. Điều này
không xóa mục tiêu hoặc xóa mục đích. Nó cho người vận hành và
tác nhân biết rằng mục tiêu không còn được chủ động theo đuổi cho đến khi được tiếp tục hoặc
xóa.

Ngân sách token là lan can bảo vệ cho mục tiêu phiên, không phải giới hạn thanh toán. Hạn mức nhà cung cấp,
báo cáo chi phí, và hành vi cửa sổ ngữ cảnh vẫn dùng các điều khiển mức dùng
và mô hình OpenClaw thông thường.

## Công cụ mô hình

OpenClaw cung cấp ba công cụ mục tiêu lõi cho các harness tác nhân:

- `get_goal`: đọc mục tiêu phiên hiện tại, bao gồm trạng thái, mục đích, mức dùng token,
  và ngân sách token.
- `create_goal`: chỉ tạo mục tiêu khi chỉ dẫn của người dùng, hệ thống, hoặc nhà phát triển
  yêu cầu rõ ràng. Công cụ này thất bại nếu phiên đã có
  mục tiêu.
- `update_goal`: đánh dấu mục tiêu là `complete` hoặc `blocked`.

Mô hình không thể âm thầm tạm dừng, tiếp tục, xóa, hoặc thay thế mục tiêu. Đó là
các điều khiển của người vận hành/phiên thông qua `/goal` và các lệnh đặt lại. Điều này ngăn
tác nhân lặng lẽ dịch chuyển đích trong khi vẫn giữ một đường dẫn sạch để
tác nhân báo cáo việc hoàn thành hoặc một điểm chặn thật sự.

Công cụ `update_goal` chỉ nên đánh dấu mục tiêu là `complete` khi mục đích
thực sự đã đạt được. Công cụ này chỉ nên đánh dấu mục tiêu là `blocked` khi cùng điều kiện
chặn đã lặp lại và tác nhân không thể đạt tiến triển có ý nghĩa nếu không có
đầu vào mới từ người dùng hoặc thay đổi trạng thái bên ngoài.

## TUI

TUI giữ mục tiêu của phiên đang hoạt động luôn hiển thị ở chân trang cạnh
tác nhân, phiên, mô hình, điều khiển lượt chạy, và số token.

Ví dụ chân trang:

- `Pursuing goal (12k/50k)` cho một mục tiêu đang hoạt động có ngân sách token.
- `Goal paused (/goal resume)` cho một mục tiêu đang tạm dừng.
- `Goal blocked (/goal resume)` cho một mục tiêu bị chặn.
- `Goal hit usage limits (/goal resume)` cho một mục tiêu bị giới hạn theo mức dùng.
- `Goal unmet (50k/50k)` cho một mục tiêu bị giới hạn theo ngân sách.
- `Goal achieved (42k)` cho một mục tiêu đã hoàn tất.

Chân trang được chủ ý giữ gọn. Dùng `/goal` để xem đầy đủ mục đích, ghi chú,
ngân sách token, và các lệnh khả dụng.

## Hành vi kênh

Lệnh `/goal` hoạt động trong các phiên OpenClaw có khả năng dùng lệnh, bao gồm
TUI và các bề mặt trò chuyện cho phép lệnh văn bản. Trạng thái mục tiêu được gắn với
khóa phiên, không phải phương tiện truyền tải. Nếu hai bề mặt dùng cùng phiên, chúng thấy
cùng một mục tiêu.

Trạng thái mục tiêu không phải là chỉ thị phân phối. Nó không ép phản hồi đi qua một
kênh, thay đổi hành vi hàng đợi, phê duyệt công cụ, hoặc lên lịch công việc.

## Khắc phục sự cố

`Goal error: goal already exists` nghĩa là phiên đã có mục tiêu. Dùng
`/goal` để kiểm tra, `/goal complete` nếu mục tiêu đã xong, hoặc `/goal clear` trước khi
bắt đầu một mục đích khác.

`Goal error: goal not found` nghĩa là phiên chưa có mục tiêu. Bắt đầu mục tiêu bằng
`/goal start <objective>`.

`Goal error: goal is already complete` nghĩa là mục tiêu đã ở trạng thái kết thúc. Xóa mục tiêu
trước khi bắt đầu hoặc tiếp tục mục đích khác.

Nếu mức dùng token trông như `0` hoặc đã cũ, phiên đang hoạt động có thể chưa có
ảnh chụp nhanh token mới. Mức dùng sẽ được làm mới khi OpenClaw ghi nhận mức dùng phiên và
tổng số suy ra từ bản ghi hội thoại.

## Liên quan

- [Lệnh slash](/vi/tools/slash-commands)
- [TUI](/vi/web/tui)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Compaction](/vi/concepts/compaction)
- [Luồng tác vụ](/vi/automation/taskflow)
- [Chỉ thị thường trực](/vi/automation/standing-orders)
