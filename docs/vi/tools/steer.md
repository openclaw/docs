---
read_when:
    - Sử dụng /steer hoặc /tell khi một tác tử đang chạy
    - So sánh /steer với các chế độ /queue
    - Quyết định nên điều hướng lượt chạy hiện tại hay một phiên ACP
sidebarTitle: Steer
summary: Điều hướng một lượt chạy đang hoạt động mà không thay đổi chế độ hàng đợi
title: Điều hướng
x-i18n:
    generated_at: "2026-07-12T08:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` trước tiên cố gắng gửi hướng dẫn đến một lượt chạy đang hoạt động. Lệnh này dành cho
những tình huống cần "điều chỉnh lượt chạy này trong khi nó vẫn đang xử lý". Nếu runtime hiện tại
không thể nhận chỉ dẫn điều hướng, OpenClaw sẽ gửi thông báo dưới dạng lời nhắc thông thường thay vì
loại bỏ nó.

## Phiên hiện tại

Sử dụng `/steer` cấp cao nhất để nhắm đến lượt chạy đang hoạt động của phiên hiện tại:

```text
/steer ưu tiên bản vá nhỏ hơn và giữ cho các kiểm thử tập trung
/tell tóm tắt trước khi thực hiện lệnh gọi công cụ tiếp theo
```

Hành vi:

- Chỉ nhắm đến lượt chạy đang hoạt động của phiên hiện tại.
- Hoạt động độc lập với chế độ `/queue` của phiên.
- Bắt đầu một lượt thông thường với cùng thông báo khi phiên ở trạng thái rảnh hoặc
  lượt chạy đang hoạt động không thể nhận chỉ dẫn điều hướng.
- Sử dụng đường dẫn điều hướng của runtime đang hoạt động, vì vậy mô hình sẽ nhận được hướng dẫn tại
  ranh giới runtime được hỗ trợ tiếp theo.

## Điều hướng và hàng đợi

`/queue steer` khiến các thông báo đến thông thường cố gắng điều hướng lượt chạy đang hoạt động khi
chúng đến trong lúc một lượt chạy đang hoạt động. `/steer <message>` là một lệnh tường minh
cố gắng chèn thông báo của lệnh đó vào lượt chạy đang hoạt động tại ranh giới
runtime được hỗ trợ tiếp theo, bất kể thiết lập `/queue` đã lưu. Khi
không thể thực hiện việc chèn đó, tiền tố lệnh sẽ bị loại bỏ và `<message>`
tiếp tục dưới dạng lời nhắc thông thường.

Cách dùng:

- `/steer <message>` khi bạn muốn hướng dẫn lượt chạy đang hoạt động ngay lúc này.
- `/queue steer` khi bạn muốn các thông báo thông thường trong tương lai mặc định điều hướng các lượt chạy
  đang hoạt động.
- `/queue collect` hoặc `/queue followup` khi các thông báo thông thường trong tương lai nên chờ
  một lượt sau thay vì điều hướng lượt chạy đang hoạt động.
- `/queue interrupt` khi thông báo mới nhất nên thay thế lượt chạy đang hoạt động
  thay vì điều hướng nó.

Để biết về các chế độ hàng đợi và ranh giới điều hướng, hãy xem [Hàng đợi lệnh](/vi/concepts/queue) và
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Tác tử phụ

Lệnh `/steer` cấp cao nhất nhắm đến lượt chạy đang hoạt động của phiên hiện tại. Các tác tử phụ báo cáo
lại cho phiên cha/yêu cầu của chúng; `/subagents` chỉ dùng để theo dõi.

## Phiên ACP

Sử dụng `/acp steer` khi mục tiêu là một phiên bộ kiểm thử ACP:

```text
/acp steer --session agent:main:acp:codex thu hẹp phạm vi tái hiện
```

Xem [Tác tử ACP](/vi/tools/acp-agents) để biết cách chọn phiên ACP và hành vi
runtime.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Tác tử phụ](/vi/tools/subagents)
