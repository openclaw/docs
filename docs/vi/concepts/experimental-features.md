---
read_when:
    - Bạn thấy một khóa cấu hình `.experimental` và muốn biết liệu nó có ổn định hay không
    - Bạn muốn thử các tính năng thời gian chạy bản xem trước mà không nhầm lẫn chúng với các giá trị mặc định thông thường
    - Bạn muốn có một nơi duy nhất để tìm các cờ thử nghiệm hiện được ghi trong tài liệu
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện đang được ghi nhận trong tài liệu
title: Tính năng thử nghiệm
x-i18n:
    generated_at: "2026-04-29T22:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm trong OpenClaw là **các bề mặt xem trước cần chọn bật**. Chúng được
đặt sau các cờ rõ ràng vì vẫn cần được kiểm chứng thêm trong thực tế trước khi
xứng đáng trở thành mặc định ổn định hoặc một hợp đồng công khai dài hạn.

Hãy xử lý chúng khác với cấu hình thông thường:

- Giữ chúng **tắt theo mặc định** trừ khi tài liệu liên quan yêu cầu bạn thử một cờ.
- Dự kiến **hình dạng và hành vi sẽ thay đổi** nhanh hơn cấu hình ổn định.
- Ưu tiên đường dẫn ổn định trước khi đã có sẵn.
- Nếu bạn đang triển khai OpenClaw trên diện rộng, hãy kiểm thử các cờ thử nghiệm trong một
  môi trường nhỏ hơn trước khi đưa chúng vào baseline dùng chung.

## Các cờ hiện được ghi tài liệu

| Bề mặt                  | Khóa                                                       | Dùng khi                                                                                                    | Xem thêm                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Thời gian chạy mô hình cục bộ      | `agents.defaults.experimental.localModelLean`             | Backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không xử lý nổi toàn bộ bề mặt công cụ mặc định của OpenClaw                             | [Mô hình cục bộ](/vi/gateway/local-models)                                                         |
| Tìm kiếm bộ nhớ            | `agents.defaults.memorySearch.experimental.sessionMemory` | Bạn muốn `memory_search` lập chỉ mục các bản ghi phiên trước đó và chấp nhận chi phí lưu trữ/lập chỉ mục bổ sung         | [Tham khảo cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental) |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                             | Bạn muốn công cụ `update_plan` có cấu trúc được hiển thị để theo dõi công việc nhiều bước trong các thời gian chạy và UI tương thích | [Tham khảo cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |

## Chế độ tinh gọn cho mô hình cục bộ

`agents.defaults.experimental.localModelLean: true` là một van xả áp lực
cho các thiết lập mô hình cục bộ yếu hơn. Nó cắt giảm các công cụ mặc định nặng như
`browser`, `cron` và `message` để hình dạng prompt nhỏ hơn và ít dễ vỡ hơn
đối với các backend tương thích OpenAI có ngữ cảnh nhỏ hoặc nghiêm ngặt hơn.

Đó cố ý **không** phải là đường dẫn thông thường. Nếu backend của bạn xử lý toàn bộ
runtime một cách sạch sẽ, hãy để tùy chọn này tắt.

## Thử nghiệm không có nghĩa là ẩn

Nếu một tính năng là thử nghiệm, OpenClaw nên nói rõ điều đó trong tài liệu và trong chính
đường dẫn cấu hình. Điều nó **không** nên làm là lén đưa hành vi xem trước vào một
núm điều chỉnh mặc định trông có vẻ ổn định rồi giả vờ rằng đó là bình thường. Đó là cách các
bề mặt cấu hình trở nên lộn xộn.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
