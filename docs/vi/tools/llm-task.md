---
read_when:
    - Bạn muốn một bước LLM chỉ xuất JSON trong các quy trình công việc
    - Bạn cần đầu ra LLM được xác thực theo lược đồ để tự động hóa
summary: Tác vụ LLM chỉ dùng JSON cho quy trình làm việc (công cụ Plugin tùy chọn)
title: tác vụ LLM
x-i18n:
    generated_at: "2026-05-04T02:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` là một **công cụ Plugin tùy chọn** chạy một tác vụ LLM chỉ dùng JSON và
trả về đầu ra có cấu trúc (tùy chọn xác thực theo JSON Schema).

Điều này lý tưởng cho các công cụ workflow như Lobster: bạn có thể thêm một bước LLM duy nhất
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

- `prompt` (string, bắt buộc)
- `input` (any, tùy chọn)
- `schema` (object, JSON Schema tùy chọn)
- `provider` (string, tùy chọn)
- `model` (string, tùy chọn)
- `thinking` (string, tùy chọn)
- `authProfileId` (string, tùy chọn)
- `temperature` (number, tùy chọn)
- `maxTokens` (number, tùy chọn)
- `timeoutMs` (number, tùy chọn)

`thinking` chấp nhận các preset suy luận tiêu chuẩn của OpenClaw, chẳng hạn như `low` hoặc `medium`.

## Đầu ra

Trả về `details.json` chứa JSON đã phân tích cú pháp (và xác thực theo
`schema` khi được cung cấp).

## Ví dụ: bước workflow Lobster

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
  code fence, không có bình luận).
- Không công cụ nào được cung cấp cho mô hình trong lần chạy này.
- Xem đầu ra là không đáng tin cậy trừ khi bạn xác thực bằng `schema`.
- Đặt phê duyệt trước bất kỳ bước nào có tác động phụ (gửi, đăng, thực thi).

## Liên quan

- [Mức thinking](/vi/tools/thinking)
- [Sub-agents](/vi/tools/subagents)
- [Lệnh slash](/vi/tools/slash-commands)
