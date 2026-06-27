---
read_when:
    - Kết nối OpenClaw với không gian làm việc ClickClack
    - Kiểm thử danh tính bot ClickClack
summary: Thiết lập kênh bot-token ClickClack và cú pháp mục tiêu
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một workspace ClickClack tự host thông qua các token bot ClickClack hạng nhất.

Dùng tính năng này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ bot dịch vụ độc lập và bot thuộc sở hữu người dùng; bot thuộc sở hữu người dùng giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Tạo token bot trong ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Đối với bot thuộc sở hữu người dùng, thêm `--owner <user_id>`.

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

Nếu `plugins.allow` là một danh sách hạn chế không rỗng, việc chọn rõ
ClickClack trong thiết lập kênh hoặc chạy `openclaw plugins enable clickclack`
sẽ thêm `clickclack` vào danh sách đó. Cài đặt trong quá trình onboarding sử dụng cùng
hành vi chọn rõ ràng này. Các đường dẫn này không ghi đè `plugins.deny` hoặc
thiết lập `plugins.enabled: false` toàn cục. Lệnh trực tiếp
`openclaw plugins install @openclaw/clickclack` tuân theo chính sách cài đặt
Plugin thông thường và cũng ghi nhận ClickClack vào allowlist hiện có.

## Nhiều bot

Mỗi tài khoản mở kết nối thời gian thực ClickClack riêng và sử dụng token bot riêng.

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

`replyMode: "model"` sử dụng trực tiếp `api.runtime.llm.complete` cho các câu trả lời bot ngắn.
Khi một tài khoản đặt `agentId`, OpenClaw yêu cầu bit tin cậy rõ ràng
`plugins.entries.clickclack.llm.allowAgentIdOverride` để plugin
có thể chạy completion cho agent bot đó. Giữ tắt nếu bạn chỉ dùng tuyến agent
mặc định.

## Đích

- `channel:<name-or-id>` gửi tới một kênh workspace. Đích trần mặc định là `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng một cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` trả lời trong một thread hiện có.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu workspace/kênh/tin nhắn/thread/DM/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cộng với tin nhắn kênh, trả lời thread, DM và tải lên.
- `bot:admin`: `bot:write` cộng với tạo kênh.

OpenClaw chỉ cần `bot:write` cho chat agent thông thường.

## Khắc phục sự cố

- `ClickClack is not configured`: đặt `channels.clickclack.token` hoặc `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: đặt `workspace` thành id hoặc slug workspace do ClickClack trả về.
- Không có trả lời đến: xác nhận token có quyền đọc thời gian thực và bot không trả lời tin nhắn của chính nó.
- Gửi kênh thất bại: xác minh bot là thành viên của workspace và có `bot:write`.
