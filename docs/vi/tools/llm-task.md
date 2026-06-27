---
read_when:
    - Bạn muốn một bước LLM chỉ JSON bên trong các workflow
    - Bạn cần đầu ra LLM được xác thực bằng schema cho tự động hóa
summary: Tác vụ LLM chỉ JSON cho quy trình công việc (công cụ Plugin tùy chọn)
title: Tác vụ LLM
x-i18n:
    generated_at: "2026-06-27T18:16:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` là một **công cụ Plugin tùy chọn** chạy một tác vụ LLM chỉ dùng JSON và
trả về đầu ra có cấu trúc (tùy chọn xác thực theo JSON Schema).

Công cụ này lý tưởng cho các công cụ workflow như Lobster: bạn có thể thêm một bước LLM duy nhất
mà không cần viết mã OpenClaw tùy chỉnh cho từng workflow.

## Bật Plugin

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

2. Cho phép công cụ tùy chọn:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Chỉ dùng `tools.allow` khi bạn muốn chế độ danh sách cho phép hạn chế.

## Cấu hình (tùy chọn)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` là danh sách cho phép gồm các chuỗi `provider/model`. Nếu được đặt, mọi yêu cầu
nằm ngoài danh sách đều bị từ chối.

## Tham số công cụ

- `prompt` (chuỗi, bắt buộc)
- `input` (bất kỳ, tùy chọn)
- `schema` (đối tượng, JSON Schema tùy chọn)
- `provider` (chuỗi, tùy chọn)
- `model` (chuỗi, tùy chọn)
- `thinking` (chuỗi, tùy chọn)
- `authProfileId` (chuỗi, tùy chọn)
- `temperature` (số, tùy chọn)
- `maxTokens` (số, tùy chọn)
- `timeoutMs` (số, tùy chọn)

`thinking` chấp nhận các giá trị đặt sẵn reasoning tiêu chuẩn của OpenClaw, chẳng hạn như `low` hoặc `medium`.

## Đầu ra

Trả về `details.json` chứa JSON đã phân tích cú pháp (và xác thực theo
`schema` khi được cung cấp).

## Ví dụ: bước workflow Lobster

### Giới hạn quan trọng

Ví dụ bên dưới giả định **CLI Lobster độc lập** đang chạy trong một môi trường mà `openclaw.invoke` đã có đúng URL Gateway/ngữ cảnh xác thực.

Đối với trình chạy Lobster **nhúng** đi kèm bên trong OpenClaw, mẫu CLI lồng nhau này **hiện chưa đáng tin cậy**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Cho đến khi Lobster nhúng có cầu nối được hỗ trợ cho luồng này, hãy ưu tiên một trong hai cách:

- gọi công cụ `llm-task` trực tiếp bên ngoài Lobster, hoặc
- các bước Lobster không phụ thuộc vào lệnh gọi `openclaw.invoke` lồng nhau.

Ví dụ CLI Lobster độc lập:

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

## Ghi chú an toàn

- Công cụ này **chỉ dùng JSON** và hướng dẫn mô hình chỉ xuất JSON (không có
  khối mã, không có bình luận).
- Không công cụ nào được cung cấp cho mô hình trong lần chạy này.
- Xem đầu ra là không đáng tin cậy trừ khi bạn xác thực bằng `schema`.
- Đặt phê duyệt trước mọi bước có tác dụng phụ (gửi, đăng, thực thi).

## Liên quan

- [Mức thinking](/vi/tools/thinking)
- [Tác nhân con](/vi/tools/subagents)
- [Lệnh slash](/vi/tools/slash-commands)
