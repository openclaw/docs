---
read_when:
    - Thiết lập các tích hợp IDE dựa trên ACP
    - Gỡ lỗi định tuyến phiên ACP đến Gateway
summary: Chạy cầu nối ACP cho các tích hợp IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:16:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Chạy cầu nối [Giao thức Máy khách Tác tử (ACP)](https://agentclientprotocol.com/) giao tiếp với OpenClaw Gateway.

Lệnh này giao tiếp ACP qua stdio cho IDE và chuyển tiếp prompt đến Gateway
qua WebSocket. Lệnh giữ các phiên ACP được ánh xạ tới khóa phiên Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải runtime trình soạn thảo
ACP-native đầy đủ. Nó tập trung vào định tuyến phiên, chuyển prompt và các cập nhật
streaming cơ bản.

Nếu bạn muốn một máy khách MCP bên ngoài giao tiếp trực tiếp với các cuộc hội thoại
kênh OpenClaw thay vì lưu trữ phiên harness ACP, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp).

## Đây không phải là gì

Trang này thường bị nhầm với các phiên harness ACP.

`openclaw acp` nghĩa là:

- OpenClaw hoạt động như một máy chủ ACP
- một IDE hoặc máy khách ACP kết nối với OpenClaw
- OpenClaw chuyển tiếp công việc đó vào một phiên Gateway

Điều này khác với [Tác tử ACP](/vi/tools/acp-agents), nơi OpenClaw chạy một harness
bên ngoài như Codex hoặc Claude Code thông qua `acpx`.

Quy tắc nhanh:

- trình soạn thảo/máy khách muốn giao tiếp ACP với OpenClaw: dùng `openclaw acp`
- OpenClaw nên khởi chạy Codex/Claude/Gemini dưới dạng harness ACP: dùng `/acp spawn` và [Tác tử ACP](/vi/tools/acp-agents)

## Ma trận tương thích

| Khu vực ACP                                                           | Trạng thái   | Ghi chú                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai | Luồng cầu nối lõi qua stdio tới Gateway chat/send + abort.                                                                                                                                                                                     |
| `listSessions`, lệnh gạch chéo                                        | Đã triển khai | Danh sách phiên hoạt động dựa trên trạng thái phiên Gateway với phân trang con trỏ có giới hạn và lọc `cwd` khi các hàng phiên Gateway mang metadata workspace; lệnh được quảng bá qua `available_commands_update`.                           |
| Metadata dòng dõi phiên                                               | Đã triển khai | Danh sách phiên và snapshot thông tin phiên bao gồm dòng dõi cha và con của OpenClaw trong `_meta` để máy khách ACP có thể kết xuất đồ thị subagent mà không cần kênh phụ Gateway riêng tư.                                                     |
| `resumeSession`, `closeSession`                                       | Đã triển khai | Resume liên kết lại một phiên ACP với phiên Gateway hiện có mà không phát lại lịch sử. Close hủy công việc cầu nối đang hoạt động, giải quyết các prompt đang chờ là đã hủy, và giải phóng trạng thái phiên cầu nối.                            |
| `loadSession`                                                         | Một phần      | Liên kết lại phiên ACP với khóa phiên Gateway và phát lại lịch sử sổ cái sự kiện ACP cho các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái quay về dùng văn bản người dùng/trợ lý đã lưu.                                                 |
| Nội dung prompt (`text`, `resource` nhúng, hình ảnh)                  | Một phần      | Văn bản/tài nguyên được làm phẳng vào đầu vào chat; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                    |
| Chế độ phiên                                                          | Một phần      | `session/set_mode` được hỗ trợ và cầu nối hiển thị các điều khiển phiên ban đầu dựa trên Gateway cho mức suy nghĩ, độ dài dòng công cụ, reasoning, chi tiết sử dụng và hành động nâng quyền. Các bề mặt chế độ/cấu hình ACP-native rộng hơn vẫn nằm ngoài phạm vi. |
| Thông tin phiên và cập nhật sử dụng                                   | Một phần      | Cầu nối phát thông báo `session_info_update` và `usage_update` theo nỗ lực tốt nhất từ các snapshot phiên Gateway đã lưu cache. Mức sử dụng là xấp xỉ và chỉ được gửi khi tổng token Gateway được đánh dấu là mới.                              |
| Streaming công cụ                                                     | Một phần      | Sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp theo nỗ lực tốt nhất khi tham số/kết quả công cụ Gateway phơi bày chúng. Terminal nhúng và đầu ra diff-native phong phú hơn vẫn chưa được phơi bày.     |
| Phê duyệt exec                                                        | Một phần      | Các prompt phê duyệt exec của Gateway trong lượt prompt ACP đang hoạt động được chuyển tiếp tới máy khách ACP bằng `session/request_permission`.                                                                                                |
| Máy chủ MCP theo phiên (`mcpServers`)                                 | Không hỗ trợ  | Chế độ cầu nối từ chối yêu cầu máy chủ MCP theo phiên. Hãy cấu hình MCP trên Gateway hoặc tác tử OpenClaw thay vào đó.                                                                                                                          |
| Phương thức hệ thống tệp máy khách (`fs/read_text_file`, `fs/write_text_file`) | Không hỗ trợ  | Cầu nối không gọi các phương thức hệ thống tệp máy khách ACP.                                                                                                                                                                                   |
| Phương thức terminal máy khách (`terminal/*`)                         | Không hỗ trợ  | Cầu nối không tạo terminal máy khách ACP hoặc stream id terminal qua các lệnh gọi công cụ.                                                                                                                                                      |
| Kế hoạch phiên / streaming suy nghĩ                                   | Không hỗ trợ  | Cầu nối hiện chỉ phát văn bản đầu ra và trạng thái công cụ, không phát cập nhật kế hoạch hoặc suy nghĩ ACP.                                                                                                                                      |

## Hạn chế đã biết

- `loadSession` chỉ có thể phát lại lịch sử sổ cái sự kiện ACP hoàn chỉnh cho
  các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái vẫn dùng bản ghi hội thoại
  dự phòng và không tái tạo các lệnh gọi công cụ hoặc thông báo hệ thống trong quá khứ.
- Nếu nhiều máy khách ACP chia sẻ cùng một khóa phiên Gateway, việc định tuyến sự kiện
  và hủy là theo nỗ lực tốt nhất thay vì được cô lập nghiêm ngặt theo từng máy khách.
  Ưu tiên các phiên `acp-bridge:<uuid>` cô lập mặc định khi bạn cần các lượt
  cục bộ theo trình soạn thảo sạch.
- Trạng thái dừng Gateway được chuyển thành lý do dừng ACP, nhưng ánh xạ đó
  kém biểu đạt hơn runtime ACP-native đầy đủ.
- Các điều khiển phiên ban đầu hiện chỉ hiển thị một tập con tập trung của các nút Gateway:
  mức suy nghĩ, độ dài dòng công cụ, reasoning, chi tiết sử dụng và hành động nâng quyền.
  Lựa chọn mô hình và điều khiển máy chủ exec chưa được phơi bày dưới dạng tùy chọn
  cấu hình ACP.
- `session_info_update` và `usage_update` được suy ra từ snapshot phiên Gateway,
  không phải kế toán runtime ACP-native trực tiếp. Mức sử dụng là xấp xỉ,
  không mang dữ liệu chi phí, và chỉ được phát khi Gateway đánh dấu dữ liệu tổng token
  là mới.
- Dữ liệu theo dõi công cụ là theo nỗ lực tốt nhất. Cầu nối có thể hiển thị đường dẫn tệp
  xuất hiện trong tham số/kết quả công cụ đã biết, nhưng chưa phát terminal ACP hoặc
  diff tệp có cấu trúc.
- Chuyển tiếp phê duyệt exec được giới hạn trong lượt prompt ACP đang hoạt động; phê duyệt từ
  các phiên Gateway khác bị bỏ qua.

## Cách dùng

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Máy khách ACP (gỡ lỗi)

Dùng máy khách ACP tích hợp để kiểm tra nhanh cầu nối mà không cần IDE.
Nó sinh cầu nối ACP và cho phép bạn nhập prompt tương tác.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ gỡ lỗi máy khách):

- Tự động phê duyệt dựa trên danh sách cho phép và chỉ áp dụng cho các ID công cụ lõi đáng tin cậy.
- Tự động phê duyệt `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- ACP chỉ tự động phê duyệt các lớp readonly hẹp: lệnh gọi `read` có phạm vi dưới cwd đang hoạt động cộng với các công cụ tìm kiếm readonly (`search`, `web_search`, `memory_search`). Công cụ không xác định/không phải lõi, lệnh đọc ngoài phạm vi, công cụ có khả năng exec, công cụ control-plane, công cụ thay đổi trạng thái và luồng tương tác luôn yêu cầu phê duyệt prompt rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được xem là metadata không đáng tin cậy (không phải nguồn ủy quyền).
- Chính sách cầu nối ACP này tách biệt với quyền harness ACPX. Nếu bạn chạy OpenClaw qua backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` là công tắc "yolo" phá kính cho phiên harness đó.

## Kiểm thử smoke giao thức

Để gỡ lỗi ở cấp giao thức, khởi động Gateway với trạng thái cô lập và điều khiển
`openclaw acp` qua stdio bằng máy khách ACP JSON-RPC. Bao phủ `initialize`,
`session/new`, `session/list` với `cwd` tuyệt đối, `session/resume`,
`session/close`, đóng trùng lặp và resume bị thiếu.

Bằng chứng nên bao gồm các năng lực vòng đời được quảng bá, một hàng phiên dựa trên Gateway,
thông báo cập nhật và log `sessions.list` của Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Tránh dùng `openclaw gateway call sessions.list` làm bằng chứng ACP duy nhất. Đường dẫn
CLI đó có thể yêu cầu nâng cấp phạm vi toán tử fresh-token; tính đúng đắn của cầu nối ACP
được chứng minh bằng các frame stdio ACP cộng với log `sessions.list` của Gateway.

## Cách sử dụng mục này

Dùng ACP khi một IDE (hoặc máy khách khác) giao tiếp bằng Giao thức Máy khách Tác tử và bạn muốn
nó điều khiển một phiên OpenClaw Gateway.

1. Đảm bảo Gateway đang chạy (cục bộ hoặc từ xa).
2. Cấu hình mục tiêu Gateway (cấu hình hoặc cờ).
3. Trỏ IDE của bạn để chạy `openclaw acp` qua stdio.

Ví dụ cấu hình (được lưu):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ví dụ chạy trực tiếp (không ghi cấu hình):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Chọn tác tử

ACP không chọn tác tử trực tiếp. Nó định tuyến theo khóa phiên Gateway.

Dùng khóa phiên có phạm vi tác tử để nhắm tới một tác tử cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ tới một khóa phiên Gateway duy nhất. Một tác tử có thể có nhiều
phiên; ACP mặc định dùng một phiên `acp-bridge:<uuid>` biệt lập trừ khi bạn ghi đè
khóa hoặc nhãn.

`mcpServers` theo từng phiên không được hỗ trợ trong chế độ cầu nối. Nếu một máy khách ACP
gửi chúng trong `newSession` hoặc `loadSession`, cầu nối sẽ trả về một lỗi rõ ràng
thay vì âm thầm bỏ qua chúng.

Nếu bạn muốn các phiên dựa trên ACPX thấy các công cụ Plugin OpenClaw hoặc những
công cụ tích hợp sẵn được chọn như `cron`, hãy bật các cầu nối ACPX MCP phía Gateway
thay vì cố truyền `mcpServers` theo từng phiên. Xem
[Tác tử ACP](/vi/tools/acp-agents-setup#plugin-tools-mcp-bridge) và
[cầu nối MCP cho công cụ OpenClaw](/vi/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Sử dụng từ `acpx` (Codex, Claude, các máy khách ACP khác)

Nếu bạn muốn một tác tử lập trình như Codex hoặc Claude Code trao đổi với
bot OpenClaw của bạn qua ACP, hãy dùng `acpx` với mục tiêu `openclaw` tích hợp sẵn.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể truy cập nó.
2. Trỏ `acpx openclaw` tới `openclaw acp`.
3. Nhắm tới khóa phiên OpenClaw mà bạn muốn tác tử lập trình sử dụng.

Ví dụ:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Nếu bạn muốn `acpx openclaw` luôn nhắm tới một Gateway và khóa phiên cụ thể,
hãy ghi đè lệnh tác tử `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Với một bản checkout OpenClaw cục bộ theo repo, hãy dùng điểm vào CLI trực tiếp thay vì
trình chạy dev để luồng ACP luôn sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để Codex, Claude Code hoặc một máy khách nhận biết ACP khác
lấy thông tin ngữ cảnh từ một tác tử OpenClaw mà không phải quét terminal.

## Thiết lập trình biên tập Zed

Thêm một tác tử ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc dùng giao diện Cài đặt của Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Để nhắm tới một Gateway hoặc tác tử cụ thể:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Trong Zed, mở bảng Tác tử và chọn "OpenClaw ACP" để bắt đầu một luồng.

## Ánh xạ phiên

Theo mặc định, các phiên cầu nối ACP nhận một khóa phiên Gateway biệt lập với tiền tố
`acp-bridge:`. Các phiên cầu nối mô hình thường này là phiên tổng hợp và
chịu quy trình cắt tỉa mục cũ cùng giới hạn số lượng mục. Để dùng lại một phiên đã biết,
hãy truyền khóa phiên hoặc nhãn:

- `--session <key>`: dùng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: phân giải một phiên hiện có theo nhãn.
- `--reset-session`: tạo một id phiên mới cho khóa đó (cùng khóa, bản ghi hội thoại mới).

Nếu máy khách ACP của bạn hỗ trợ siêu dữ liệu, bạn có thể ghi đè theo từng phiên:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Tìm hiểu thêm về khóa phiên tại [/concepts/session](/vi/concepts/session).

## Tùy chọn

- `--url <url>`: URL WebSocket của Gateway (mặc định là gateway.remote.url khi được cấu hình).
- `--token <token>`: mã thông báo xác thực Gateway.
- `--token-file <path>`: đọc mã thông báo xác thực Gateway từ tệp.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ tệp.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định cần phân giải.
- `--require-existing`: thất bại nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước lần sử dụng đầu tiên.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào lời nhắc.
- `--provenance <off|meta|meta+receipt>`: bao gồm siêu dữ liệu hoặc biên nhận nguồn gốc ACP.
- `--verbose, -v`: ghi nhật ký chi tiết vào stderr.

Ghi chú bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình cục bộ trên một số hệ thống.
- Nên dùng `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Quy trình phân giải xác thực Gateway tuân theo hợp đồng dùng chung bởi các máy khách Gateway khác:
  - chế độ cục bộ: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> phương án dự phòng `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được đặt (SecretRefs cục bộ đã cấu hình nhưng không phân giải được sẽ thất bại theo hướng đóng)
  - chế độ từ xa: `gateway.remote.*` với phương án dự phòng env/config theo quy tắc ưu tiên từ xa
  - `--url` an toàn khi ghi đè và không dùng lại ngầm thông tin xác thực config/env; hãy truyền `--token`/`--password` rõ ràng (hoặc các biến thể tệp)
- Các tiến trình con của backend thời gian chạy ACP nhận `OPENCLAW_SHELL=acp`, có thể dùng cho các quy tắc shell/hồ sơ theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình cầu nối được khởi chạy.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: đối số bổ sung được truyền tới máy chủ ACP.
- `--server-verbose`: bật ghi nhật ký chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi nhật ký máy khách chi tiết.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác tử ACP](/vi/tools/acp-agents)
