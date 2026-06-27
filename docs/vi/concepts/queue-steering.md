---
read_when:
    - Giải thích cách steer hoạt động khi một agent đang sử dụng công cụ
    - Thay đổi hành vi hàng đợi phiên chạy đang hoạt động hoặc tích hợp điều hướng runtime
    - So sánh cách điều hướng với các chế độ hàng đợi theo dõi, thu thập và ngắt ngang
summary: Cách điều hướng lượt chạy đang hoạt động xếp hàng thông điệp tại các ranh giới runtime
title: Hàng đợi điều hướng
x-i18n:
    generated_at: "2026-06-27T17:25:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Khi một prompt thông thường đến trong lúc một lượt chạy phiên đang phát trực tiếp, OpenClaw
mặc định cố gắng gửi prompt đó vào runtime đang hoạt động khi chế độ hàng đợi
là `steer`. Không cần mục cấu hình hay chỉ thị hàng đợi nào cho hành vi mặc định
đó. OpenClaw và harness app-server Codex gốc triển khai chi tiết phân phối
theo cách khác nhau.

## Ranh giới runtime

Điều hướng không ngắt một lệnh gọi công cụ đang chạy. OpenClaw kiểm tra
các thông điệp điều hướng đã xếp hàng tại ranh giới mô hình:

1. Trợ lý yêu cầu các lệnh gọi công cụ.
2. OpenClaw thực thi lô lệnh gọi công cụ của thông điệp trợ lý hiện tại.
3. OpenClaw phát sự kiện kết thúc lượt.
4. OpenClaw xả các thông điệp điều hướng đã xếp hàng.
5. OpenClaw thêm các thông điệp đó dưới dạng thông điệp người dùng trước lệnh gọi LLM tiếp theo.

Điều này giữ kết quả công cụ được ghép với thông điệp trợ lý đã yêu cầu chúng,
sau đó cho phép lệnh gọi mô hình tiếp theo thấy đầu vào người dùng mới nhất.

Harness app-server Codex gốc cung cấp `turn/steer` thay vì hàng đợi điều hướng
nội bộ của runtime OpenClaw. OpenClaw gom nhóm các prompt đã xếp hàng trong
khoảng yên lặng đã cấu hình, rồi gửi một yêu cầu `turn/steer` duy nhất với toàn bộ
đầu vào người dùng đã thu thập theo thứ tự đến.

Các lượt review Codex và Compaction thủ công từ chối điều hướng trong cùng lượt. Khi một
runtime không thể chấp nhận điều hướng ở chế độ `steer`, OpenClaw chờ lượt chạy
đang hoạt động hoàn tất trước khi bắt đầu prompt.

Trang này giải thích điều hướng theo chế độ hàng đợi cho các thông điệp đến thông thường khi chế độ
là `steer`. Nếu chế độ là `followup` hoặc `collect`, thông điệp thông thường không đi vào
đường điều hướng này; chúng chờ cho đến khi lượt chạy đang hoạt động hoàn tất. Với lệnh
`/steer <message>` tường minh, xem [Điều hướng](/vi/tools/steer).

## Chế độ

| Chế độ      | Hành vi khi có lượt chạy đang hoạt động                | Hành vi sau đó                                                                     |
| ----------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `steer`     | Điều hướng prompt vào runtime đang hoạt động khi có thể. | Chờ lượt chạy đang hoạt động hoàn tất nếu điều hướng không khả dụng.              |
| `followup`  | Không điều hướng.                                      | Chạy các thông điệp đã xếp hàng sau khi lượt chạy đang hoạt động kết thúc.         |
| `collect`   | Không điều hướng.                                      | Gộp các thông điệp đã xếp hàng tương thích thành một lượt sau cửa sổ debounce.     |
| `interrupt` | Hủy bỏ lượt chạy đang hoạt động thay vì điều hướng nó. | Bắt đầu thông điệp mới nhất sau khi hủy bỏ.                                        |

## Ví dụ bùng phát

Nếu bốn người dùng gửi thông điệp trong lúc tác tử đang thực thi một lệnh gọi công cụ:

- Với hành vi mặc định, runtime đang hoạt động nhận cả bốn thông điệp theo
  thứ tự đến trước quyết định mô hình tiếp theo. OpenClaw xả chúng tại ranh giới mô hình
  tiếp theo; Codex nhận chúng dưới dạng một `turn/steer` đã gom nhóm.
- Với `/queue collect`, OpenClaw không điều hướng. Nó chờ đến khi lượt chạy đang hoạt động
  kết thúc, rồi tạo một lượt tiếp nối với các thông điệp đã xếp hàng tương thích sau
  cửa sổ debounce.
- Với `/queue interrupt`, OpenClaw hủy bỏ lượt chạy đang hoạt động và bắt đầu
  thông điệp mới nhất thay vì điều hướng.

## Phạm vi

Điều hướng luôn nhắm đến lượt chạy phiên đang hoạt động hiện tại. Nó không tạo phiên
mới, thay đổi chính sách công cụ của lượt chạy đang hoạt động, hoặc tách thông điệp theo người gửi. Trong
các kênh nhiều người dùng, prompt đến đã bao gồm ngữ cảnh người gửi và tuyến, nên
lệnh gọi mô hình tiếp theo có thể thấy ai đã gửi từng thông điệp.

Dùng `followup` hoặc `collect` khi bạn muốn thông điệp mặc định được xếp hàng thay vì
điều hướng lượt chạy đang hoạt động. Dùng `interrupt` khi prompt mới nhất nên
thay thế lượt chạy đang hoạt động.

## Debounce

`messages.queue.debounceMs` áp dụng cho phân phối `followup` và `collect` đã xếp hàng.
Trong chế độ `steer` với harness Codex gốc, nó cũng đặt khoảng yên lặng
trước khi gửi `turn/steer` đã gom nhóm. Với OpenClaw, bản thân điều hướng đang hoạt động không dùng
bộ đếm thời gian debounce vì OpenClaw tự nhiên gom nhóm thông điệp cho đến ranh giới mô hình
tiếp theo.

## Liên quan

- [Hàng đợi lệnh](/vi/concepts/queue)
- [Điều hướng](/vi/tools/steer)
- [Thông điệp](/vi/concepts/messages)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
