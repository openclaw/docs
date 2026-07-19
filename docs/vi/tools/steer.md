---
read_when:
    - Sử dụng /steer hoặc /tell khi một tác tử đang chạy
    - So sánh /steer với các chế độ /queue
    - Quyết định nên điều hướng lượt chạy hiện tại hay một phiên ACP
sidebarTitle: Steer
summary: Điều hướng một lượt chạy đang hoạt động mà không thay đổi chế độ hàng đợi
title: Điều hướng
x-i18n:
    generated_at: "2026-07-19T06:00:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d420e14982d52520e415103ffa6d86923fad6f13c43ff7741ebbd8dde0d0073f
    source_path: tools/steer.md
    workflow: 16
---

`/steer` trước tiên cố gắng gửi hướng dẫn đến một lượt chạy đang hoạt động. Tính năng này dành cho
những tình huống cần "điều chỉnh lượt chạy này trong khi nó vẫn đang thực thi". Nếu runtime hiện tại
không thể tiếp nhận chỉ dẫn, OpenClaw sẽ gửi thông báo dưới dạng prompt thông thường thay vì
bỏ qua.

## Phiên hiện tại

Dùng `/steer` ở cấp cao nhất để nhắm đến lượt chạy đang hoạt động của phiên hiện tại:

```text
/steer ưu tiên bản vá nhỏ hơn và chỉ tập trung kiểm thử
/tell tóm tắt trước khi thực hiện lệnh gọi công cụ tiếp theo
```

Hành vi:

- Chỉ nhắm đến lượt chạy đang hoạt động của phiên hiện tại.
- Hoạt động độc lập với chế độ `/queue` của phiên.
- Bắt đầu một lượt thông thường với cùng thông báo khi phiên đang rảnh hoặc
  lượt chạy đang hoạt động không thể tiếp nhận chỉ dẫn.
- Sử dụng đường dẫn chỉ dẫn của runtime đang hoạt động, vì vậy mô hình sẽ nhận được hướng dẫn tại
  ranh giới runtime được hỗ trợ tiếp theo.

## Chỉ dẫn và hàng đợi

`/queue steer` khiến các thông báo đến thông thường cố gắng chỉ dẫn lượt chạy đang hoạt động khi
chúng đến trong lúc một lượt chạy đang hoạt động. `/steer <message>` là một lệnh tường minh
cố gắng chèn thông báo của lệnh đó vào lượt chạy đang hoạt động tại ranh giới
runtime được hỗ trợ tiếp theo, bất kể cài đặt `/queue` đã lưu. Khi
không thể chèn, tiền tố lệnh sẽ bị loại bỏ và `<message>`
tiếp tục dưới dạng prompt thông thường.

Lệnh tường minh `/steer` (và `/tell`) được Gateway hỗ trợ. Trong
`openclaw chat` hoặc `openclaw tui --local`, hãy chọn `/queue steer` và gửi
hướng dẫn dưới dạng thông báo thông thường; runtime nhúng áp dụng cùng một chính sách chỉ dẫn
mà không chuyển tiếp lệnh Gateway.

Cách dùng:

- `/steer <message>` khi bạn muốn hướng dẫn lượt chạy đang hoạt động ngay lúc này.
- `/queue steer` khi bạn muốn các thông báo thông thường trong tương lai mặc định chỉ dẫn các lượt chạy đang hoạt động.
- `/queue collect` hoặc `/queue followup` khi các thông báo thông thường trong tương lai cần chờ
  đến một lượt sau thay vì chỉ dẫn lượt chạy đang hoạt động.
- `/queue interrupt` khi thông báo mới nhất cần thay thế lượt chạy đang hoạt động
  thay vì chỉ dẫn lượt chạy đó.

Để biết về các chế độ hàng đợi và ranh giới chỉ dẫn, hãy xem [Hàng đợi lệnh](/vi/concepts/queue) và
[Hàng đợi chỉ dẫn](/vi/concepts/queue-steering).

## Tác nhân phụ

`/steer` ở cấp cao nhất nhắm đến lượt chạy đang hoạt động của phiên hiện tại. Tác nhân phụ báo cáo
lại cho phiên cha/yêu cầu của chúng; `/subagents` chỉ dùng để theo dõi.

## Phiên ACP

Dùng `/acp steer` khi đích đến là một phiên bộ kiểm thử ACP:

```text
/acp steer --session agent:main:acp:codex thu hẹp phạm vi tái hiện
```

Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết cách chọn phiên ACP và hành vi
runtime.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Hàng đợi chỉ dẫn](/vi/concepts/queue-steering)
- [Tác nhân phụ](/vi/tools/subagents)
