---
read_when:
    - Giải thích cách điều hướng hoạt động khi một tác nhân đang sử dụng công cụ
    - Thay đổi hành vi hàng đợi lượt chạy đang hoạt động hoặc tích hợp điều hướng thời gian chạy
    - So sánh các chế độ điều hướng, xếp hàng, thu thập và theo dõi
summary: Cách điều hướng lượt chạy đang hoạt động xếp hàng đợi thông điệp tại các ranh giới thời gian chạy
title: Hàng đợi định hướng
x-i18n:
    generated_at: "2026-05-04T02:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Khi một tin nhắn đến trong lúc một lượt chạy phiên đang phát trực tuyến, OpenClaw có thể
gửi tin nhắn đó vào runtime đang hoạt động thay vì bắt đầu một lượt chạy khác cho
cùng phiên. Các chế độ công khai trung lập với runtime; Pi và harness app-server
Codex gốc triển khai chi tiết phân phối theo cách khác nhau.

## Ranh giới runtime

Điều hướng không ngắt một lệnh gọi công cụ đang chạy. Pi kiểm tra
các tin nhắn điều hướng đã xếp hàng tại các ranh giới mô hình:

1. Trợ lý yêu cầu các lệnh gọi công cụ.
2. Pi thực thi lô lệnh gọi công cụ của tin nhắn trợ lý hiện tại.
3. Pi phát sự kiện kết thúc lượt.
4. Pi xả các tin nhắn điều hướng đã xếp hàng.
5. Pi thêm các tin nhắn đó dưới dạng tin nhắn người dùng trước lệnh gọi LLM tiếp theo.

Điều này giữ các kết quả công cụ đi kèm với tin nhắn trợ lý đã yêu cầu chúng,
sau đó cho phép lệnh gọi mô hình tiếp theo thấy dữ liệu nhập mới nhất của người dùng.

Harness app-server Codex gốc cung cấp `turn/steer` thay vì hàng đợi điều hướng
nội bộ của Pi. OpenClaw điều chỉnh cùng các chế độ tại đó:

- `steer` gom các tin nhắn đã xếp hàng trong cửa sổ yên lặng đã cấu hình, sau đó gửi một
  yêu cầu `turn/steer` duy nhất với toàn bộ dữ liệu nhập của người dùng đã thu thập theo thứ tự đến.
- `queue` giữ dạng tuần tự cũ bằng cách gửi các yêu cầu `turn/steer`
  riêng biệt.
- `followup`, `collect`, `steer-backlog`, và `interrupt` vẫn là hành vi hàng đợi
  do OpenClaw sở hữu quanh lượt Codex đang hoạt động.

Các lượt đánh giá Codex và Compaction thủ công từ chối điều hướng trong cùng lượt. Khi một
runtime không thể chấp nhận điều hướng, OpenClaw quay về hàng đợi theo dõi tiếp nếu
chế độ đó cho phép.

Trang này giải thích điều hướng ở chế độ hàng đợi cho các tin nhắn đến thông thường. Đối với
lệnh `/steer <message>` tường minh, hãy xem [Điều hướng](/vi/tools/steer).

## Chế độ

| Chế độ          | Hành vi khi lượt chạy đang hoạt động                                                                                         | Hành vi theo dõi tiếp về sau                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `steer`         | Chèn toàn bộ tin nhắn điều hướng đã xếp hàng cùng lúc tại ranh giới runtime tiếp theo. Đây là mặc định.                      | Chỉ quay về theo dõi tiếp khi điều hướng không khả dụng.                           |
| `queue`         | Điều hướng từng tin nhắn theo kiểu cũ. Pi chèn một tin nhắn đã xếp hàng cho mỗi ranh giới mô hình; Codex gửi các yêu cầu `turn/steer` riêng biệt. | Chỉ quay về theo dõi tiếp khi điều hướng không khả dụng.                           |
| `steer-backlog` | Cùng hành vi điều hướng khi lượt chạy đang hoạt động như `steer`.                                                            | Cũng giữ cùng tin nhắn cho một lượt theo dõi tiếp về sau.                          |
| `followup`      | Không điều hướng lượt chạy hiện tại.                                                                                         | Chạy các tin nhắn đã xếp hàng sau.                                                 |
| `collect`       | Không điều hướng lượt chạy hiện tại.                                                                                         | Gộp các tin nhắn đã xếp hàng tương thích thành một lượt sau trong cửa sổ debounce. |
| `interrupt`     | Hủy lượt chạy đang hoạt động, sau đó bắt đầu tin nhắn mới nhất.                                                              | Không có.                                                                          |

## Ví dụ bùng phát

Nếu bốn người dùng gửi tin nhắn trong lúc agent đang thực thi một lệnh gọi công cụ:

- `steer`: runtime đang hoạt động nhận cả bốn tin nhắn theo thứ tự đến trước
  quyết định mô hình tiếp theo. Pi xả chúng tại ranh giới mô hình tiếp theo; Codex
  nhận chúng dưới dạng một `turn/steer` theo lô.
- `queue`: điều hướng tuần tự kiểu cũ. Pi chèn từng tin nhắn đã xếp hàng một;
  Codex nhận các yêu cầu `turn/steer` riêng biệt.
- `collect`: OpenClaw đợi đến khi lượt chạy đang hoạt động kết thúc, sau đó tạo một lượt theo dõi tiếp
  với các tin nhắn đã xếp hàng tương thích sau cửa sổ debounce.

## Phạm vi

Điều hướng luôn nhắm đến lượt chạy phiên đang hoạt động hiện tại. Nó không tạo phiên mới,
thay đổi chính sách công cụ của lượt chạy đang hoạt động, hoặc tách tin nhắn theo người gửi. Trong
các kênh nhiều người dùng, prompt đến đã bao gồm ngữ cảnh người gửi và định tuyến, vì vậy
lệnh gọi mô hình tiếp theo có thể thấy ai đã gửi từng tin nhắn.

Dùng `collect` khi bạn muốn OpenClaw xây dựng một lượt theo dõi tiếp về sau có thể
gộp các tin nhắn tương thích và bảo toàn chính sách loại bỏ của hàng đợi theo dõi tiếp. Chỉ dùng
`queue` khi bạn cần hành vi điều hướng từng tin nhắn kiểu cũ.

## Debounce

`messages.queue.debounceMs` áp dụng cho việc phân phối theo dõi tiếp, bao gồm `collect`,
`followup`, `steer-backlog`, và phương án dự phòng của `steer` khi điều hướng trong lượt chạy đang hoạt động
không khả dụng. Với Pi, bản thân `steer` đang hoạt động không dùng bộ đếm thời gian debounce vì
Pi tự nhiên gom các tin nhắn cho đến ranh giới mô hình tiếp theo. Với harness
Codex gốc, OpenClaw dùng cùng giá trị debounce làm cửa sổ yên lặng trước khi
gửi `turn/steer` theo lô.

## Liên quan

- [Hàng đợi lệnh](/vi/concepts/queue)
- [Điều hướng](/vi/tools/steer)
- [Tin nhắn](/vi/concepts/messages)
- [Vòng lặp agent](/vi/concepts/agent-loop)
