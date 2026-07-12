---
read_when:
    - Giải thích cách steer hoạt động khi một tác nhân đang sử dụng các công cụ
    - Thay đổi hành vi hàng đợi của lượt chạy đang hoạt động hoặc tích hợp điều hướng thời gian chạy
    - So sánh chế độ điều hướng với các chế độ hàng đợi followup, collect và interrupt
summary: Cách cơ chế điều hướng lượt chạy đang hoạt động xếp hàng đợi thông báo tại các ranh giới thời gian chạy
title: Hàng đợi điều hướng
x-i18n:
    generated_at: "2026-07-12T07:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Khi một lời nhắc thông thường đến trong lúc một lượt chạy của phiên đang truyền phát và chế độ hàng đợi là `steer` (mặc định, không cần cấu hình), OpenClaw cố gắng gửi lời nhắc đó vào môi trường thực thi đang hoạt động. OpenClaw và bộ khung app-server Codex nguyên bản triển khai các chi tiết chuyển giao theo những cách khác nhau.

Trang này trình bày việc điều hướng bằng chế độ hàng đợi đối với các tin nhắn đến thông thường trong chế độ `steer`. Trong chế độ `followup` hoặc `collect`, các tin nhắn thông thường bỏ qua đường dẫn này và chờ đến khi lượt chạy đang hoạt động kết thúc. Đối với lệnh `/steer <message>` tường minh, hãy xem [Điều hướng](/vi/tools/steer).

## Ranh giới môi trường thực thi

Việc điều hướng không làm gián đoạn một lệnh gọi công cụ đang chạy. OpenClaw kiểm tra các tin nhắn điều hướng trong hàng đợi tại các ranh giới mô hình:

1. Trợ lý yêu cầu các lệnh gọi công cụ.
2. OpenClaw thực thi lô lệnh gọi công cụ của tin nhắn trợ lý hiện tại.
3. OpenClaw phát sự kiện kết thúc lượt.
4. OpenClaw lấy hết các tin nhắn điều hướng trong hàng đợi.
5. OpenClaw nối các tin nhắn đó dưới dạng tin nhắn người dùng trước lệnh gọi LLM tiếp theo.

Cơ chế này giữ kết quả công cụ đi cùng tin nhắn trợ lý đã yêu cầu chúng, sau đó cho phép lệnh gọi mô hình tiếp theo thấy dữ liệu đầu vào mới nhất của người dùng.

Bộ khung app-server Codex nguyên bản cung cấp `turn/steer` thay cho hàng đợi điều hướng nội bộ của môi trường thực thi OpenClaw. OpenClaw gom các lời nhắc trong hàng đợi theo khoảng thời gian yên lặng đã cấu hình, sau đó gửi một yêu cầu `turn/steer` duy nhất chứa toàn bộ dữ liệu đầu vào của người dùng đã thu thập theo thứ tự đến.

Các lượt đánh giá Codex và Compaction thủ công từ chối việc điều hướng trong cùng lượt. Khi môi trường thực thi không thể chấp nhận việc điều hướng trong chế độ `steer`, OpenClaw chờ lượt chạy đang hoạt động kết thúc trước khi bắt đầu lời nhắc.

## Chế độ

| Chế độ      | Hành vi khi có lượt chạy đang hoạt động                    | Hành vi sau đó                                                                            |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `steer`     | Điều hướng lời nhắc vào môi trường thực thi đang hoạt động khi có thể. | Chờ lượt chạy đang hoạt động kết thúc nếu không thể điều hướng.                            |
| `followup`  | Không điều hướng.                                          | Chạy các tin nhắn trong hàng đợi sau khi lượt chạy đang hoạt động kết thúc.                |
| `collect`   | Không điều hướng.                                          | Gộp các tin nhắn tương thích trong hàng đợi thành một lượt sau đó khi hết khoảng chống dội. |
| `interrupt` | Hủy lượt chạy đang hoạt động thay vì điều hướng vào đó.    | Bắt đầu tin nhắn mới nhất sau khi hủy.                                                     |

## Ví dụ về loạt tin nhắn

Nếu bốn người dùng gửi tin nhắn trong lúc tác nhân đang thực thi một lệnh gọi công cụ:

- Với hành vi mặc định, môi trường thực thi đang hoạt động nhận cả bốn tin nhắn theo thứ tự đến trước quyết định tiếp theo của mô hình. OpenClaw lấy hết các tin nhắn đó tại ranh giới mô hình tiếp theo; Codex nhận chúng dưới dạng một `turn/steer` được gom thành lô.
- Với `/queue collect`, OpenClaw không điều hướng. OpenClaw chờ đến khi lượt chạy đang hoạt động kết thúc, sau đó tạo một lượt tiếp nối chứa các tin nhắn tương thích trong hàng đợi khi hết khoảng chống dội.
- Với `/queue interrupt`, OpenClaw hủy lượt chạy đang hoạt động và bắt đầu tin nhắn mới nhất thay vì điều hướng.

## Phạm vi

Việc điều hướng luôn nhắm đến lượt chạy đang hoạt động hiện tại của phiên. Nó không tạo phiên mới, thay đổi chính sách công cụ của lượt chạy đang hoạt động hoặc phân tách tin nhắn theo người gửi. Trong các kênh nhiều người dùng, lời nhắc đến đã bao gồm ngữ cảnh người gửi và định tuyến, vì vậy lệnh gọi mô hình tiếp theo có thể biết ai đã gửi từng tin nhắn.

Sử dụng `followup` hoặc `collect` khi bạn muốn các tin nhắn mặc định được đưa vào hàng đợi thay vì điều hướng vào lượt chạy đang hoạt động. Sử dụng `interrupt` khi lời nhắc mới nhất cần thay thế lượt chạy đang hoạt động.

## Chống dội

`messages.queue.debounceMs` áp dụng cho việc chuyển giao các tin nhắn `followup` và `collect` trong hàng đợi. Trong chế độ `steer` với bộ khung Codex nguyên bản, tùy chọn này cũng đặt khoảng thời gian yên lặng trước khi gửi `turn/steer` theo lô. Đối với OpenClaw, bản thân việc điều hướng đang hoạt động không sử dụng bộ hẹn giờ chống dội vì OpenClaw tự nhiên gom các tin nhắn thành lô cho đến ranh giới mô hình tiếp theo.

## Liên quan

- [Hàng đợi lệnh](/vi/concepts/queue)
- [Điều hướng](/vi/tools/steer)
- [Tin nhắn](/vi/concepts/messages)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
