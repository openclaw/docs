---
read_when:
    - Sử dụng /steer hoặc /tell trong khi một tác tử đang chạy
    - So sánh chế độ /steer với /queue
    - Quyết định nên điều hướng lượt chạy hiện tại hay một phiên ACP
sidebarTitle: Steer
summary: Điều hướng một lượt chạy đang hoạt động mà không thay đổi chế độ hàng đợi
title: Điều hướng
x-i18n:
    generated_at: "2026-06-27T18:18:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` trước tiên cố gửi chỉ dẫn đến một lượt chạy đã hoạt động. Lệnh này dành cho
những thời điểm cần "điều chỉnh lượt chạy này khi nó vẫn đang xử lý". Nếu môi trường thực thi hiện tại
không thể nhận chỉ dẫn, OpenClaw sẽ gửi thông điệp dưới dạng lời nhắc thông thường thay vì
loại bỏ nó.

## Phiên hiện tại

Dùng `/steer` cấp cao nhất để nhắm đến lượt chạy đang hoạt động cho phiên hiện tại:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Hành vi:

- Chỉ nhắm đến lượt chạy đang hoạt động của phiên hiện tại.
- Hoạt động độc lập với chế độ `/queue` của phiên.
- Bắt đầu một lượt thông thường với cùng thông điệp khi phiên đang rảnh hoặc
  lượt chạy đang hoạt động không thể nhận chỉ dẫn.
- Dùng đường dẫn chỉ dẫn của môi trường thực thi đang hoạt động, vì vậy mô hình sẽ thấy chỉ dẫn tại
  ranh giới môi trường thực thi được hỗ trợ tiếp theo.

## Chỉ dẫn so với hàng đợi

`/queue steer` khiến các thông điệp đến thông thường cố chỉ dẫn lượt chạy đang hoạt động khi
chúng đến trong lúc một lượt chạy đang hoạt động. `/steer <message>` là một lệnh rõ ràng
cố chèn thông điệp của lệnh đó vào lượt chạy đang hoạt động tại ranh giới
môi trường thực thi được hỗ trợ tiếp theo, bất kể thiết lập `/queue` đã lưu. Khi
không thể chèn như vậy, tiền tố lệnh sẽ bị loại bỏ và `<message>`
tiếp tục như một lời nhắc thông thường.

Sử dụng:

- `/steer <message>` khi bạn muốn chỉ dẫn lượt chạy đang hoạt động ngay bây giờ.
- `/queue steer` khi bạn muốn các thông điệp thông thường trong tương lai mặc định chỉ dẫn các lượt chạy đang hoạt động.
- `/queue collect` hoặc `/queue followup` khi các thông điệp thông thường trong tương lai nên chờ
  một lượt sau thay vì chỉ dẫn lượt chạy đang hoạt động.
- `/queue interrupt` khi thông điệp mới nhất nên thay thế lượt chạy đang hoạt động
  thay vì chỉ dẫn nó.

Để biết các chế độ hàng đợi và ranh giới chỉ dẫn, xem [Hàng đợi lệnh](/vi/concepts/queue) và
[Hàng đợi chỉ dẫn](/vi/concepts/queue-steering).

## Tác nhân phụ

`/steer` cấp cao nhất nhắm đến lượt chạy đang hoạt động của phiên hiện tại. Tác nhân phụ báo cáo
lại cho phiên cha/người yêu cầu của chúng; `/subagents` chỉ dùng để quan sát.

## Phiên ACP

Dùng `/acp steer` khi mục tiêu là một phiên harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết cách chọn phiên ACP và hành vi
môi trường thực thi.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Hàng đợi chỉ dẫn](/vi/concepts/queue-steering)
- [Tác nhân phụ](/vi/tools/subagents)
