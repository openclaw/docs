---
read_when:
    - Xây dựng ứng dụng khách Matrix hiển thị phản hồi phong phú của OpenClaw
    - Gỡ lỗi nội dung sự kiện com.openclaw.presentation
summary: Siêu dữ liệu MessagePresentation của Matrix dành cho các máy khách hỗ trợ OpenClaw
title: Siêu dữ liệu trình bày của Matrix
x-i18n:
    generated_at: "2026-07-12T07:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw đính kèm siêu dữ liệu `MessagePresentation` đã chuẩn hóa vào các sự kiện Matrix `m.room.message` gửi đi dưới khóa nội dung `com.openclaw.presentation`.

Các ứng dụng Matrix tiêu chuẩn vẫn hiển thị `body` ở dạng văn bản thuần. Các ứng dụng hỗ trợ OpenClaw có thể đọc siêu dữ liệu có cấu trúc và hiển thị giao diện người dùng gốc như nút, danh sách chọn, hàng ngữ cảnh và đường phân cách.

## Nội dung sự kiện

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` là phiên bản lược đồ siêu dữ liệu; phiên bản hiện tại là `1`. `type` là giá trị phân biệt ổn định, luôn là `"message.presentation"`. Bộ điều hợp Matrix chỉ phát các tải trọng có chính xác phiên bản và kiểu này; tương tự, ứng dụng nên bỏ qua các phiên bản không xác định mà chúng không thể diễn giải an toàn, các giá trị `type` không xác định và các kiểu khối không xác định.
- `title` và `tone` (`info`, `success`, `warning`, `danger`, `neutral`) là các gợi ý không bắt buộc.
- Nút và tùy chọn chọn có thể mang một `action` được định kiểu (`{ "type": "command", "command": "/..." }` hoặc `{ "type": "callback", "value": "..." }`) cùng với chuỗi `value` cũ. Ưu tiên `action` khi cả hai cùng xuất hiện.

## Hành vi dự phòng

OpenClaw luôn hiển thị nội dung dự phòng dạng văn bản thuần có thể đọc được vào `body`. Siêu dữ liệu có cấu trúc chỉ mang tính bổ sung và không được là yêu cầu bắt buộc để có khả năng tương tác Matrix cơ bản.

Quy tắc hiển thị dự phòng:

- Nội dung `title`, `text` và `context` được hiển thị thành các dòng văn bản thuần.
- Nút có hành động `command` được hiển thị thành ``nhãn: `/command` `` để lệnh vẫn có thể sao chép được. Nút có hành động `callback` hoặc chỉ có `value` cũ chỉ hiển thị nhãn để các giá trị gọi lại không rõ nghĩa vẫn được giữ riêng tư; nút bị vô hiệu hóa luôn chỉ hiển thị nhãn. Nút URL và ứng dụng web được hiển thị thành `nhãn: URL`.
- Khối chọn hiển thị phần giữ chỗ (hoặc `Tùy chọn:`) làm tiêu đề, theo sau là các dòng tùy chọn chỉ có nhãn.
- Nếu không hiển thị được nội dung nào, chẳng hạn một phần trình bày chỉ có đường phân cách, phần nội dung sẽ dùng `---` làm dự phòng.

Các ứng dụng không được hỗ trợ vẫn hiển thị văn bản dự phòng. Các ứng dụng hỗ trợ OpenClaw có thể ưu tiên siêu dữ liệu có cấu trúc để hiển thị, đồng thời giữ lại nội dung dự phòng cho việc sao chép, tìm kiếm, thông báo và khả năng tiếp cận.

## Các khối được hỗ trợ

Bộ điều hợp gửi đi của Matrix công bố hỗ trợ gốc cho:

- `buttons`
- `select`
- `context`
- `divider`

Các khối `text` luôn được hỗ trợ thông qua phần nội dung dự phòng. Hãy coi tất cả các khối là gợi ý trình bày theo khả năng tốt nhất; bỏ qua các trường và kiểu khối không xác định thay vì làm hỏng toàn bộ thông báo.

## Tương tác

Siêu dữ liệu này không bổ sung ngữ nghĩa gọi lại cho Matrix. Giá trị của nút và tùy chọn chọn là các tải trọng tương tác dự phòng, thường là lệnh bắt đầu bằng dấu gạch chéo hoặc lệnh văn bản. Ứng dụng Matrix muốn hỗ trợ tương tác sẽ phân giải giá trị điều khiển (`action.command`, sau đó là `action.value`, rồi đến `value`) và gửi giá trị đó trở lại phòng dưới dạng thông báo thông thường.

Ví dụ: một nút có giá trị `/model deepseek/deepseek-chat` có thể được xử lý bằng cách gửi giá trị đó dưới dạng thông báo văn bản Matrix được mã hóa trong cùng phòng.

## Mối quan hệ với siêu dữ liệu phê duyệt

`com.openclaw.presentation` dùng để trình bày thông báo đa dạng nói chung.

Lời nhắc phê duyệt sử dụng siêu dữ liệu chuyên dụng `com.openclaw.approval` vì các phê duyệt chứa trạng thái nhạy cảm về an toàn, quyết định và chi tiết thực thi/Plugin. Nếu cả hai khóa siêu dữ liệu cùng xuất hiện trên một sự kiện, ứng dụng nên ưu tiên trình hiển thị phê duyệt chuyên dụng.

## Thông báo đa phương tiện

Khi câu trả lời chứa nhiều URL đa phương tiện, OpenClaw gửi một sự kiện Matrix cho mỗi URL đa phương tiện. Văn bản chú thích và siêu dữ liệu trình bày chỉ được đính kèm vào sự kiện đầu tiên để ứng dụng nhận được một tải trọng có cấu trúc ổn định mà không có trình hiển thị trùng lặp. Quy tắc tương tự áp dụng khi văn bản dài được chia thành nhiều phần trên các sự kiện: siêu dữ liệu chỉ đi kèm sự kiện đầu tiên.

Hãy giữ siêu dữ liệu trình bày gọn nhẹ. Văn bản dài hiển thị cho người dùng nên được giữ trong `body` và sử dụng luồng chia nhỏ văn bản Matrix thông thường.
