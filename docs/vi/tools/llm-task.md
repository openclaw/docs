---
read_when:
    - Bạn muốn một bước LLM chỉ xuất JSON bên trong các quy trình làm việc
    - Bạn cần đầu ra của LLM được xác thực theo schema để tự động hóa
summary: Các tác vụ LLM chỉ dùng JSON cho quy trình làm việc (công cụ plugin tùy chọn)
title: Tác vụ LLM
x-i18n:
    generated_at: "2026-07-12T08:26:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` là một **công cụ Plugin tùy chọn được tích hợp sẵn**, thực hiện một lệnh gọi LLM chỉ trả về JSON và trả về đầu ra có cấu trúc, có thể tùy chọn xác thực theo JSON Schema. Công cụ này cung cấp cho các công cụ quy trình như Lobster một bước LLM mà không cần mã OpenClaw tùy chỉnh cho từng quy trình.

## Bật

1. Bật Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Cho phép công cụ:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` bổ sung `llm-task` vào hồ sơ công cụ đang hoạt động mà không hạn chế các công cụ cốt lõi khác. Chỉ sử dụng `tools.allow` nếu bạn muốn dùng chế độ danh sách cho phép có tính hạn chế.

## Cấu hình (tùy chọn)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` là danh sách cho phép gồm các chuỗi `provider/model`; yêu cầu đối với bất kỳ mô hình nào khác sẽ bị từ chối. Tất cả các khóa khác là giá trị dự phòng cho từng lệnh gọi, được sử dụng khi lệnh gọi công cụ bỏ qua tham số tương ứng.

## Tham số công cụ

| Tham số         | Kiểu   | Ghi chú                                                                                                                                                                  |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`        | string | Bắt buộc. Chỉ dẫn tác vụ cho LLM.                                                                                                                                        |
| `input`         | any    | Dữ liệu đầu vào tùy chọn; được tuần tự hóa thành JSON và nối vào lời nhắc.                                                                                                |
| `schema`        | object | JSON Schema tùy chọn mà đầu ra đã phân tích phải đáp ứng khi xác thực.                                                                                                    |
| `provider`      | string | Ghi đè `defaultProvider` / nhà cung cấp mặc định của tác tử.                                                                                                              |
| `model`         | string | Ghi đè `defaultModel`; chấp nhận mã định danh mô hình thuần, bí danh hoặc tham chiếu `provider/model` (tiền tố nhà cung cấp trùng lặp sẽ tự động bị loại bỏ).              |
| `thinking`      | string | Mức độ suy luận (ví dụ: `low`, `medium`); phải là một mức được mô hình đã phân giải hỗ trợ.                                                                               |
| `authProfileId` | string | Ghi đè `defaultAuthProfileId`.                                                                                                                                            |
| `temperature`   | number | Áp dụng trong phạm vi có thể; không phải mọi nhà cung cấp đều tuân thủ giá trị này.                                                                                       |
| `maxTokens`     | number | Giới hạn tối đa số token đầu ra trong phạm vi có thể.                                                                                                                     |
| `timeoutMs`     | number | Thời gian chờ khi chạy; mặc định là `30000`.                                                                                                                              |

## Đầu ra

Trả về `details.json` (JSON đã được phân tích và xác thực theo lược đồ), cùng với `details.provider` và `details.model` cho biết nhà cung cấp và mô hình thực tế đã chạy.

## Ví dụ: bước trong quy trình Lobster

### Giới hạn quan trọng

Ví dụ dưới đây giả định **CLI Lobster độc lập** đang chạy trong môi trường mà `openclaw.invoke` đã có đúng URL Gateway/ngữ cảnh xác thực.

Đối với trình chạy Lobster **nhúng** được tích hợp bên trong OpenClaw, mẫu CLI lồng nhau này **hiện không đáng tin cậy**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Cho đến khi Lobster nhúng có cầu nối được hỗ trợ cho luồng này, hãy ưu tiên một trong các cách sau:

- gọi trực tiếp công cụ `llm-task` bên ngoài Lobster, hoặc
- sử dụng các bước Lobster không phụ thuộc vào lệnh gọi `openclaw.invoke` lồng nhau.

Ví dụ về CLI Lobster độc lập:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Lưu ý an toàn

- **Chỉ JSON**: mô hình được chỉ dẫn chỉ trả về một giá trị JSON, không có hàng rào mã và không có bình luận.
- **Không có công cụ**: lần chạy nền đã tắt các công cụ, vì vậy mô hình không thể gọi ra bên ngoài giữa chừng trong tác vụ.
- Xem đầu ra là không đáng tin cậy, trừ khi bạn xác thực đầu ra bằng `schema`.
- Đặt các bước phê duyệt trước mọi bước gây tác dụng phụ (gửi, đăng, thực thi) sử dụng đầu ra này.

## Liên quan

- [Các mức suy luận](/vi/tools/thinking)
- [Tác tử con](/vi/tools/subagents)
- [Lệnh gạch chéo](/vi/tools/slash-commands)
