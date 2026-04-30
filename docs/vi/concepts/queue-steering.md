---
read_when:
    - Giải thích cách điều hướng hoạt động khi một tác nhân đang sử dụng công cụ
    - Thay đổi hành vi hàng đợi lượt chạy đang hoạt động hoặc tích hợp điều hướng thời gian chạy
    - So sánh các chế độ steer, queue, collect và followup
summary: Cách điều hướng active-run xếp hàng thông điệp tại các ranh giới thời gian chạy
title: Hàng đợi điều hướng
x-i18n:
    generated_at: "2026-04-30T09:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Khi có thông báo đến trong lúc một lượt chạy phiên đang phát trực tuyến, OpenClaw có thể
gửi thông báo đó vào runtime đang hoạt động thay vì bắt đầu một lượt chạy khác cho
cùng phiên. Các chế độ công khai không phụ thuộc vào runtime; Pi và bộ harness
app-server Codex gốc triển khai chi tiết phân phối theo cách khác nhau.

## Ranh giới runtime

Điều hướng không ngắt một lệnh gọi công cụ đang chạy. Pi kiểm tra các thông báo
điều hướng đang chờ tại các ranh giới mô hình:

1. Trợ lý yêu cầu các lệnh gọi công cụ.
2. Pi thực thi lô lệnh gọi công cụ của thông báo trợ lý hiện tại.
3. Pi phát sự kiện kết thúc lượt.
4. Pi rút hết các thông báo điều hướng đang chờ.
5. Pi thêm các thông báo đó dưới dạng thông báo người dùng trước lệnh gọi LLM tiếp theo.

Điều này giữ cho kết quả công cụ được ghép với thông báo trợ lý đã yêu cầu chúng,
sau đó cho phép lệnh gọi mô hình tiếp theo thấy đầu vào mới nhất của người dùng.

Bộ harness app-server Codex gốc cung cấp `turn/steer` thay vì hàng đợi điều hướng
nội bộ của Pi. OpenClaw điều chỉnh cùng các chế độ tại đó:

- `steer` gom lô các thông báo đang chờ trong khoảng lặng đã cấu hình, sau đó gửi
  một yêu cầu `turn/steer` duy nhất với toàn bộ đầu vào người dùng đã thu thập theo thứ tự đến.
- `queue` giữ hình dạng tuần tự hóa cũ bằng cách gửi các yêu cầu `turn/steer`
  riêng biệt.
- `followup`, `collect`, `steer-backlog`, và `interrupt` vẫn là hành vi hàng đợi
  do OpenClaw sở hữu quanh lượt Codex đang hoạt động.

Các lượt đánh giá Codex và Compaction thủ công từ chối điều hướng trong cùng lượt. Khi một
runtime không thể chấp nhận điều hướng, OpenClaw quay về hàng đợi tiếp nối khi
chế độ đó cho phép.

## Chế độ

| Chế độ          | Hành vi khi đang có lượt chạy                                                                                              | Hành vi tiếp nối về sau                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Chèn tất cả thông báo điều hướng đang chờ cùng lúc tại ranh giới runtime tiếp theo. Đây là mặc định.                        | Chỉ quay về tiếp nối khi điều hướng không khả dụng.                                  |
| `queue`         | Điều hướng lần lượt kiểu cũ. Pi chèn một thông báo đang chờ ở mỗi ranh giới mô hình; Codex gửi các yêu cầu `turn/steer` riêng biệt. | Chỉ quay về tiếp nối khi điều hướng không khả dụng.                                  |
| `steer-backlog` | Cùng hành vi điều hướng khi đang có lượt chạy như `steer`.                                                                   | Cũng giữ cùng thông báo đó cho một lượt tiếp nối về sau.                             |
| `followup`      | Không điều hướng lượt chạy hiện tại.                                                                                        | Chạy các thông báo đang chờ sau.                                                     |
| `collect`       | Không điều hướng lượt chạy hiện tại.                                                                                        | Gộp các thông báo đang chờ tương thích thành một lượt về sau sau khoảng debounce.   |
| `interrupt`     | Hủy lượt chạy đang hoạt động, sau đó bắt đầu thông báo mới nhất.                                                            | Không có.                                                                           |

## Ví dụ cụm dồn

Nếu bốn người dùng gửi thông báo trong lúc agent đang thực thi một lệnh gọi công cụ:

- `steer`: runtime đang hoạt động nhận cả bốn thông báo theo thứ tự đến trước
  quyết định mô hình tiếp theo. Pi rút chúng tại ranh giới mô hình tiếp theo; Codex
  nhận chúng dưới dạng một `turn/steer` được gom lô.
- `queue`: điều hướng tuần tự hóa kiểu cũ. Pi chèn từng thông báo đang chờ một;
  Codex nhận các yêu cầu `turn/steer` riêng biệt.
- `collect`: OpenClaw chờ đến khi lượt chạy đang hoạt động kết thúc, sau đó tạo một lượt tiếp nối
  với các thông báo đang chờ tương thích sau khoảng debounce.

## Phạm vi

Điều hướng luôn nhắm tới lượt chạy phiên hiện đang hoạt động. Nó không tạo phiên mới,
không thay đổi chính sách công cụ của lượt chạy đang hoạt động, cũng không tách thông báo theo người gửi. Trong
các kênh nhiều người dùng, prompt đến đã bao gồm ngữ cảnh người gửi và tuyến, vì vậy
lệnh gọi mô hình tiếp theo có thể thấy ai đã gửi từng thông báo.

Dùng `collect` khi bạn muốn OpenClaw xây dựng một lượt tiếp nối về sau có thể
gộp các thông báo tương thích và giữ nguyên chính sách loại bỏ của hàng đợi tiếp nối. Chỉ dùng
`queue` khi bạn cần hành vi điều hướng từng cái một cũ hơn.

## Debounce

`messages.queue.debounceMs` áp dụng cho việc phân phối tiếp nối, bao gồm `collect`,
`followup`, `steer-backlog`, và phương án dự phòng của `steer` khi điều hướng trong lượt chạy đang hoạt động không
khả dụng. Với Pi, bản thân `steer` đang hoạt động không dùng bộ hẹn giờ debounce vì
Pi tự nhiên gom lô thông báo cho đến ranh giới mô hình tiếp theo. Với harness
Codex gốc, OpenClaw dùng cùng giá trị debounce làm khoảng lặng trước khi
gửi `turn/steer` được gom lô.

## Liên quan

- [Hàng đợi lệnh](/vi/concepts/queue)
- [Thông báo](/vi/concepts/messages)
- [Vòng lặp agent](/vi/concepts/agent-loop)
