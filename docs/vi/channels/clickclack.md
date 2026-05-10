---
read_when:
    - Kết nối OpenClaw với một không gian làm việc ClickClack
    - Kiểm thử các danh tính bot ClickClack
summary: Thiết lập kênh bot-token ClickClack và cú pháp mục tiêu
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một không gian làm việc ClickClack tự lưu trữ thông qua các token bot ClickClack được hỗ trợ như thành phần hạng nhất.

Dùng tùy chọn này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ các bot dịch vụ độc lập và bot do người dùng sở hữu; bot do người dùng sở hữu giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Tạo một token bot trong ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Đối với bot do người dùng sở hữu, thêm `--owner <user_id>`.

Cấu hình OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Sau đó chạy:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Nhiều bot

Mỗi tài khoản mở kết nối thời gian thực ClickClack riêng và dùng token bot riêng.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` dùng trực tiếp `api.runtime.llm.complete` cho các phản hồi bot ngắn.
Khi một tài khoản đặt `agentId`, OpenClaw yêu cầu bit tin cậy rõ ràng
`plugins.entries.clickclack.llm.allowAgentIdOverride` để plugin
có thể chạy hoàn tất cho agent bot đó. Hãy tắt tùy chọn này nếu bạn chỉ dùng tuyến agent mặc định.

## Đích

- `channel:<name-or-id>` gửi đến một kênh trong không gian làm việc. Các đích trần mặc định thành `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng một cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` trả lời trong một luồng hiện có.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu không gian làm việc/kênh/tin nhắn/luồng/DM/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cộng với tin nhắn kênh, trả lời luồng, DM và tải lên.
- `bot:admin`: `bot:write` cộng với tạo kênh.

OpenClaw chỉ cần `bot:write` cho trò chuyện agent thông thường.

## Khắc phục sự cố

- `ClickClack is not configured`: đặt `channels.clickclack.token` hoặc `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: đặt `workspace` thành id hoặc slug của không gian làm việc do ClickClack trả về.
- Không có phản hồi đến: xác nhận token có quyền đọc thời gian thực và bot không trả lời tin nhắn của chính nó.
- Gửi đến kênh không thành công: xác minh bot là thành viên của không gian làm việc và có `bot:write`.
