---
read_when:
    - Giải thích cách steer hoạt động khi một agent đang sử dụng các công cụ
    - Thay đổi hành vi hàng đợi của lượt chạy đang hoạt động hoặc tích hợp điều hướng thời gian chạy
    - So sánh chế độ điều hướng với các chế độ hàng đợi followup, collect và interrupt
summary: Cách cơ chế điều hướng lượt chạy đang hoạt động xếp hàng đợi thông báo tại các ranh giới runtime
title: Hàng đợi điều hướng
x-i18n:
    generated_at: "2026-07-20T04:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 131f04f19934b9b1f6dd8ffb2cf2428950c319483abdc2ccdecec741809cda2a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Khi một prompt thông thường đến trong lúc một lượt chạy của phiên đang truyền phát và chế độ hàng đợi là `steer` (mặc định, không cần cấu hình), OpenClaw cố gắng gửi prompt đó vào runtime đang hoạt động. OpenClaw và harness app-server Codex gốc triển khai các chi tiết phân phối theo những cách khác nhau.

Trang này trình bày cơ chế điều hướng theo chế độ hàng đợi cho các tin nhắn thông thường gửi đến ở chế độ `steer`. Trong chế độ `followup` hoặc `collect`, các tin nhắn thông thường bỏ qua đường dẫn này và chờ đến khi lượt chạy đang hoạt động kết thúc. Đối với lệnh `/steer <message>` tường minh, hãy xem [Điều hướng](/vi/tools/steer).

## Ranh giới runtime

Việc điều hướng không làm gián đoạn một lệnh gọi công cụ đang chạy. OpenClaw kiểm tra các tin nhắn điều hướng trong hàng đợi tại các ranh giới mô hình:

1. Trợ lý yêu cầu các lệnh gọi công cụ.
2. OpenClaw thực thi lô lệnh gọi công cụ của tin nhắn trợ lý hiện tại.
3. OpenClaw phát sự kiện kết thúc lượt.
4. OpenClaw lấy hết các tin nhắn điều hướng trong hàng đợi.
5. OpenClaw nối thêm các tin nhắn đó dưới dạng tin nhắn người dùng trước lệnh gọi LLM tiếp theo.

Cơ chế này giữ cho kết quả công cụ được ghép với tin nhắn trợ lý đã yêu cầu chúng, sau đó cho phép lệnh gọi mô hình tiếp theo thấy dữ liệu đầu vào mới nhất của người dùng.

Harness app-server Codex gốc cung cấp `turn/steer` thay cho hàng đợi điều hướng nội bộ của runtime OpenClaw. OpenClaw gom các prompt trong hàng đợi theo khoảng lặng đã cấu hình, sau đó gửi một yêu cầu `turn/steer` duy nhất chứa toàn bộ dữ liệu đầu vào của người dùng đã thu thập theo thứ tự đến.

Các lượt review Codex và Compaction thủ công từ chối điều hướng trong cùng lượt. Khi runtime không thể chấp nhận điều hướng ở chế độ `steer`, OpenClaw chờ lượt chạy đang hoạt động kết thúc trước khi bắt đầu prompt.

## Chế độ

| Chế độ        | Hành vi khi có lượt chạy đang hoạt động                                    | Hành vi sau đó                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Điều hướng prompt vào runtime đang hoạt động khi có thể. | Chờ lượt chạy đang hoạt động kết thúc nếu không thể điều hướng.                      |
| `followup`  | Không điều hướng.                                        | Chạy các tin nhắn trong hàng đợi sau khi lượt chạy đang hoạt động kết thúc.                               |
| `collect`   | Không điều hướng.                                        | Hợp nhất các tin nhắn tương thích trong hàng đợi thành một lượt sau đó khi khoảng thời gian debounce kết thúc. |
| `interrupt` | Hủy lượt chạy đang hoạt động thay vì điều hướng lượt chạy đó.          | Bắt đầu tin nhắn mới nhất sau khi hủy.                                           |

## Ví dụ về đợt tin nhắn

Nếu bốn người dùng gửi tin nhắn trong khi tác nhân đang thực thi một lệnh gọi công cụ:

- Với hành vi mặc định, runtime đang hoạt động nhận cả bốn tin nhắn theo thứ tự đến trước quyết định tiếp theo của mô hình. OpenClaw lấy hết chúng tại ranh giới mô hình tiếp theo; Codex nhận chúng dưới dạng một `turn/steer` được gom thành lô.
- Với `/queue collect`, OpenClaw không điều hướng. OpenClaw chờ đến khi lượt chạy đang hoạt động kết thúc, sau đó tạo một lượt tiếp theo chứa các tin nhắn tương thích trong hàng đợi khi khoảng thời gian debounce kết thúc.
- Với `/queue interrupt`, OpenClaw hủy lượt chạy đang hoạt động và bắt đầu tin nhắn mới nhất thay vì điều hướng.

## Phạm vi

Việc điều hướng luôn nhắm đến lượt chạy hiện đang hoạt động của phiên. Việc này không tạo phiên mới, thay đổi chính sách công cụ của lượt chạy đang hoạt động hoặc phân chia tin nhắn theo người gửi. Trong các kênh nhiều người dùng, prompt gửi đến đã bao gồm ngữ cảnh người gửi và định tuyến, vì vậy lệnh gọi mô hình tiếp theo có thể nhận biết ai đã gửi từng tin nhắn.

Sử dụng `followup` hoặc `collect` khi bạn muốn tin nhắn được đưa vào hàng đợi theo mặc định thay vì điều hướng lượt chạy đang hoạt động. Sử dụng `interrupt` khi prompt mới nhất cần thay thế lượt chạy đang hoạt động.

## Debounce

Cơ chế debounce hàng đợi tích hợp áp dụng cho việc phân phối `followup` và `collect` trong hàng đợi. Trong chế độ `steer` với harness Codex gốc, cơ chế này cũng đặt khoảng lặng trước khi gửi các `turn/steer` được gom thành lô. Đối với OpenClaw, bản thân việc điều hướng đang hoạt động không sử dụng bộ hẹn giờ debounce vì OpenClaw tự nhiên gom các tin nhắn cho đến ranh giới mô hình tiếp theo.

## Liên quan

- [Hàng đợi lệnh](/vi/concepts/queue)
- [Điều hướng](/vi/tools/steer)
- [Tin nhắn](/vi/concepts/messages)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
