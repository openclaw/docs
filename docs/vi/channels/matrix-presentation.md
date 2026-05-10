---
read_when:
    - Xây dựng ứng dụng khách Matrix hiển thị các phản hồi phong phú của OpenClaw
    - Gỡ lỗi nội dung sự kiện com.openclaw.presentation
summary: Siêu dữ liệu MessagePresentation của Matrix dành cho các máy khách nhận biết OpenClaw
title: Siêu dữ liệu trình bày Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw có thể đính kèm siêu dữ liệu `MessagePresentation` đã chuẩn hóa vào các sự kiện Matrix `m.room.message` gửi đi dưới `com.openclaw.presentation`.

Các ứng dụng khách Matrix mặc định tiếp tục hiển thị `body` dạng văn bản thuần. Ứng dụng khách nhận biết OpenClaw có thể đọc siêu dữ liệu có cấu trúc và hiển thị giao diện người dùng gốc như nút, ô chọn, hàng ngữ cảnh và đường phân cách.

## Nội dung sự kiện

Siêu dữ liệu được lưu trong nội dung sự kiện Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` là phiên bản lược đồ siêu dữ liệu trình bày của Matrix. `type` là bộ phân biệt ổn định dành cho ứng dụng khách nhận biết OpenClaw. Ứng dụng khách nên bỏ qua các giá trị `type` không xác định, các phiên bản không xác định mà chúng không thể diễn giải an toàn, và các loại khối không xác định.

## Hành vi dự phòng

OpenClaw luôn hiển thị nội dung dự phòng dạng văn bản thuần dễ đọc vào `body`. Siêu dữ liệu có cấu trúc là phần bổ sung và không được yêu cầu để có khả năng tương tác Matrix cơ bản.

Ứng dụng khách không được hỗ trợ nên tiếp tục hiển thị văn bản dự phòng. Ứng dụng khách nhận biết OpenClaw có thể ưu tiên siêu dữ liệu có cấu trúc để hiển thị, đồng thời giữ lại văn bản dự phòng cho việc sao chép, tìm kiếm, thông báo và khả năng truy cập.

## Các khối được hỗ trợ

Bộ chuyển đổi gửi đi của Matrix quảng bá hỗ trợ cho:

- `buttons`
- `select`
- `context`
- `divider`

Ứng dụng khách nên xem các khối này là gợi ý trình bày theo nỗ lực tối đa. Các trường không xác định và loại khối không xác định nên được bỏ qua thay vì khiến toàn bộ tin nhắn không hiển thị được.

## Tương tác

Siêu dữ liệu này không thêm ngữ nghĩa callback của Matrix. Giá trị của nút và tùy chọn chọn là payload tương tác dự phòng, thường là lệnh slash hoặc lệnh văn bản. Ứng dụng khách Matrix muốn hỗ trợ tương tác có thể gửi giá trị đã chọn trở lại phòng như một tin nhắn bình thường.

Ví dụ, một nút có giá trị `/model deepseek/deepseek-chat` có thể được xử lý bằng cách gửi giá trị đó dưới dạng tin nhắn văn bản Matrix đã mã hóa trong cùng phòng.

## Mối quan hệ với siêu dữ liệu phê duyệt

`com.openclaw.presentation` dùng cho trình bày tin nhắn giàu nội dung nói chung.

Lời nhắc phê duyệt dùng siêu dữ liệu chuyên dụng `com.openclaw.approval` vì phê duyệt mang trạng thái nhạy cảm về an toàn, quyết định và chi tiết exec/plugin. Nếu cả hai khóa siêu dữ liệu đều có trên cùng một sự kiện, ứng dụng khách nên ưu tiên bộ hiển thị phê duyệt chuyên dụng.

## Tin nhắn media

Khi một phản hồi chứa nhiều URL media, OpenClaw gửi một sự kiện Matrix cho mỗi URL media. Siêu dữ liệu trình bày chỉ được đính kèm vào sự kiện media đầu tiên để ứng dụng khách có một payload có cấu trúc ổn định và tránh các bộ hiển thị trùng lặp.

Giữ siêu dữ liệu trình bày gọn nhẹ. Văn bản lớn hiển thị cho người dùng nên nằm trong `body` và sử dụng đường dẫn chia đoạn văn bản Matrix thông thường.
