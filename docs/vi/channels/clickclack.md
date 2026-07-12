---
read_when:
    - Kết nối OpenClaw với một không gian làm việc ClickClack
    - Kiểm thử danh tính bot ClickClack
summary: Thiết lập kênh bằng token bot ClickClack và cú pháp đích
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T07:39:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một không gian làm việc ClickClack tự lưu trữ thông qua token bot ClickClack được hỗ trợ chính thức.

Sử dụng cách này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ bot dịch vụ độc lập và bot thuộc sở hữu của người dùng; bot thuộc sở hữu của người dùng giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Tạo token bot trên máy chủ ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Đối với bot thuộc sở hữu của người dùng, hãy thêm `--owner <user_id>`.

Cấu hình OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Sau đó chạy:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Một tài khoản chỉ được coi là đã cấu hình khi `baseUrl`, `token` và `workspace` đều được đặt. `workspace` chấp nhận mã định danh không gian làm việc (`wsp_...`), slug hoặc tên; Gateway phân giải giá trị đó thành mã định danh khi khởi động.

### Các khóa cấu hình tài khoản

| Khóa                    | Mặc định            | Ghi chú                                                                                              |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `baseUrl`               | không có (bắt buộc) | URL máy chủ ClickClack.                                                                              |
| `token`                 | không có (bắt buộc) | Chuỗi thuần hoặc tham chiếu bí mật (`source: "env" \| "file" \| "exec"`).                            |
| `workspace`             | không có (bắt buộc) | Mã định danh, slug hoặc tên không gian làm việc.                                                      |
| `replyMode`             | `"agent"`           | `"agent"` chạy toàn bộ quy trình agent; `"model"` gửi các kết quả hoàn thành trực tiếp, ngắn từ mô hình. |
| `defaultTo`             | `"channel:general"` | Đích được dùng khi đường gửi đi không cung cấp đích.                                                  |
| `allowFrom`             | `["*"]`             | Danh sách cho phép theo mã người dùng đối với tin nhắn trực tiếp và tin nhắn kênh đến.                |
| `botUserId`             | tự động phát hiện   | Được phân giải từ danh tính của token bot khi khởi động.                                              |
| `agentId`               | mặc định của tuyến  | Ghim tin nhắn đến của tài khoản này vào một agent.                                                    |
| `toolsAllow`            | không có            | Danh sách công cụ được phép dùng cho phản hồi của agent từ tài khoản này.                             |
| `model`, `systemPrompt` | không có            | Được dùng cho các kết quả hoàn thành của `replyMode: "model"`.                                        |
| `reconnectMs`           | `1500`              | Độ trễ kết nối lại theo thời gian thực (100 đến 60000).                                               |

Nếu `plugins.allow` là một danh sách hạn chế không rỗng, việc chọn rõ ràng
ClickClack trong phần thiết lập kênh hoặc chạy `openclaw plugins enable clickclack`
sẽ thêm `clickclack` vào danh sách đó. Quá trình cài đặt khi thiết lập ban đầu sử dụng
cùng hành vi chọn rõ ràng này. Các đường này không ghi đè `plugins.deny` hoặc cài đặt
`plugins.enabled: false` toàn cục. Việc chạy trực tiếp
`openclaw plugins install @openclaw/clickclack` tuân theo chính sách cài đặt
Plugin thông thường và cũng ghi ClickClack vào danh sách cho phép hiện có.

## Nhiều bot

Mỗi tài khoản mở kết nối thời gian thực ClickClack riêng và sử dụng token bot riêng.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Chế độ phản hồi

- `replyMode: "agent"` (mặc định) điều phối tin nhắn đến qua quy trình agent thông thường, bao gồm ghi phiên và chính sách công cụ.
- `replyMode: "model"` bỏ qua quy trình agent và sử dụng `llm.complete` của môi trường chạy Plugin để tạo phản hồi bot trực tiếp, ngắn (có thể được định hình bằng `model` và `systemPrompt`).

Chế độ mô hình chạy các kết quả hoàn thành theo mã định danh agent của bot đã phân giải, việc này yêu cầu
cờ tin cậy `plugins.entries.clickclack.llm.allowAgentIdOverride: true`
được đặt rõ ràng:

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
}
```

Hãy giữ cờ tin cậy ở trạng thái tắt nếu bạn chỉ sử dụng chế độ phản hồi `agent` mặc định;
chế độ đó không cần cờ này.

Sử dụng chế độ `agent` để thu thập bằng chứng tương quan giữa các dịch vụ. Đối với một
mã định danh tin nhắn ClickClack có thẩm quyền ở dạng chuẩn `msg_<ulid>`, kênh sẽ suy ra
mã định danh lượt chạy OpenClaw xác định `clickclack:<message-id>`. Mỗi lần gọi mô hình
sau đó hiển thị trong dữ liệu chẩn đoán dưới dạng `clickclack:<message-id>:model:<n>`; khi
lượt đó sử dụng ClawRouter, cùng mã định danh lần gọi mô hình được gửi dưới dạng `X-Request-ID`.
Chế độ `model` bỏ qua dữ liệu chẩn đoán lượt chạy/phiên agent thông thường và do đó
không phù hợp với đường thu thập bằng chứng này.

Khi một sự kiện thời gian thực chứa `payload.correlation_id` đã được xác thực, kênh
chuyển giá trị đó dưới dạng `X-Correlation-ID` trong yêu cầu truy xuất tin nhắn có thẩm quyền và
các yêu cầu phản hồi ClickClack phát sinh. Các giá trị sử dụng tập ký tự an toàn
128 ký tự của ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` và `-`); các giá trị không hợp lệ
sẽ bị bỏ qua. Các phép nối này chỉ chứa mã định danh, tuyệt đối không chứa nội dung tin nhắn,
lời nhắc, kết quả hoàn thành, thông tin xác thực hoặc đầu ra công cụ.

## Các hàng hoạt động của agent

Theo mặc định, một kênh ClickClack không hiển thị gì trong khi lượt agent đang chạy; chỉ phản hồi cuối cùng được gửi đến. Đặt `agentActivity: true` trên một tài khoản để đăng các hàng tin nhắn `agent_commentary` và `agent_tool` bền vững trong khi lượt đang diễn ra:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Yêu cầu và hành vi:

- **Tắt theo mặc định.** Các thiết lập tiêu chuẩn và máy chủ ClickClack cũ không bị ảnh hưởng.
- **Yêu cầu phạm vi token `agent_activity:write`.** Phạm vi này tách biệt với `bot:write` và không được kế thừa từ phạm vi đó; hãy tạo token bot với `--scopes bot:write,agent_activity:write` (hoặc cấp phạm vi này cho token hiện có) trước khi bật tùy chọn.
- **Suy giảm theo nỗ lực tối đa.** Nếu token thiếu `agent_activity:write` hoặc máy chủ từ chối ghi hoạt động, lỗi sẽ được ghi nhật ký và phản hồi cuối cùng vẫn được gửi bình thường; không có hàng hoạt động nào xuất hiện.
- Các hàng được nhóm theo lượt (`turn_id`), được hợp nhất để mỗi bước logic tương ứng với một hàng, và các hàng công cụ sử dụng cùng định dạng tiến trình như Discord/Slack/Telegram (tên công cụ cùng chi tiết lệnh).
- **Siêu dữ liệu quy thuộc.** Các bài đăng do agent tạo (các hàng hoạt động và phản hồi cuối cùng) mang các trường `author_model` và `author_thinking` được phân giải từ mô hình thực tế dùng cho lượt đó (kể cả sau khi dự phòng). Các máy chủ không định nghĩa những cột này sẽ bỏ qua các trường JSON không xác định; các máy chủ lưu chúng có thể trả lời “mô hình nào đã nói dòng này, ở mức suy nghĩ nào” cho từng tin nhắn.

## Đích

- `channel:<name-or-id>` gửi đến một kênh trong không gian làm việc. Đích không có tiền tố mặc định dùng `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` phản hồi trong luồng bắt nguồn từ tin nhắn đó.

Đích gửi đi được chỉ định rõ ràng cũng có thể mang tiền tố nhà cung cấp `clickclack:` hoặc `cc:`.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu không gian làm việc/kênh/tin nhắn/luồng/tin nhắn trực tiếp/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cộng với tin nhắn kênh, phản hồi luồng, tin nhắn trực tiếp và tải lên.
- `bot:admin`: `bot:write` cộng với tạo kênh.
- `agent_activity:write`: các hàng hoạt động bền vững của agent (`agent_commentary` / `agent_tool`). Không được kế thừa từ `bot:write` hoặc `bot:admin`; chỉ bắt buộc khi đặt `agentActivity: true`.

OpenClaw chỉ cần `bot:write` cho trò chuyện agent thông thường. Thêm `agent_activity:write` khi bật [các hàng hoạt động của agent](#agent-activity-rows).

## Khắc phục sự cố

- `ClickClack is not configured for account "<id>"`: đặt `baseUrl`, `token` (ví dụ thông qua `CLICKCLACK_BOT_TOKEN`) và `workspace` cho tài khoản đó.
- `ClickClack workspace not found: <value>`: đặt `workspace` thành mã định danh, slug hoặc tên không gian làm việc do ClickClack trả về.
- Không có phản hồi đến: xác nhận token có quyền đọc theo thời gian thực và lưu ý rằng bot bỏ qua tin nhắn của chính nó cũng như tin nhắn từ các bot khác.
- Gửi đến kênh thất bại: xác minh bot là thành viên của không gian làm việc và có `bot:write`.
