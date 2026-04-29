---
read_when:
    - Bạn muốn một bước LLM chỉ xuất JSON bên trong các quy trình công việc
    - Bạn cần đầu ra LLM được xác thực theo schema để tự động hóa
summary: Tác vụ LLM chỉ dùng JSON cho quy trình làm việc (công cụ Plugin tùy chọn)
title: Tác vụ LLM
x-i18n:
    generated_at: "2026-04-29T23:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` là một **công cụ Plugin tùy chọn** chạy tác vụ LLM chỉ dùng JSON và
trả về đầu ra có cấu trúc (tùy chọn xác thực theo JSON Schema).

Điều này lý tưởng cho các engine quy trình làm việc như Lobster: bạn có thể thêm một bước LLM duy nhất
mà không cần viết mã OpenClaw tùy chỉnh cho từng quy trình làm việc.

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

2. Đưa công cụ vào danh sách cho phép (công cụ được đăng ký với `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Cấu hình (tùy chọn)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` là danh sách cho phép gồm các chuỗi `provider/model`. Nếu được đặt, mọi yêu cầu
nằm ngoài danh sách sẽ bị từ chối.

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

`thinking` chấp nhận các preset suy luận tiêu chuẩn của OpenClaw, chẳng hạn như `low` hoặc `medium`.

## Đầu ra

Trả về `details.json` chứa JSON đã phân tích cú pháp (và xác thực theo
`schema` khi được cung cấp).

## Ví dụ: bước quy trình làm việc Lobster

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
  code fences, không có bình luận).
- Không có công cụ nào được cung cấp cho mô hình trong lần chạy này.
- Xem đầu ra là không đáng tin cậy trừ khi bạn xác thực bằng `schema`.
- Đặt phê duyệt trước mọi bước có tác dụng phụ (send, post, exec).

## Liên quan

- [Mức thinking](/vi/tools/thinking)
- [Sub-agent](/vi/tools/subagents)
- [Lệnh slash](/vi/tools/slash-commands)
