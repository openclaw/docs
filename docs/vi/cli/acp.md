---
read_when:
    - Thiết lập các tích hợp IDE dựa trên ACP
    - Gỡ lỗi định tuyến phiên ACP đến Gateway
summary: Chạy cầu nối ACP cho các tích hợp IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Chạy cầu nối [Giao thức Máy khách Tác tử (ACP)](https://agentclientprotocol.com/) giao tiếp với OpenClaw Gateway.

Lệnh này giao tiếp bằng ACP qua stdio cho IDE và chuyển tiếp prompt tới Gateway
qua WebSocket. Lệnh giữ các phiên ACP được ánh xạ tới khóa phiên Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải runtime trình biên tập
ACP-native đầy đủ. Nó tập trung vào định tuyến phiên, gửi prompt và các bản cập
nhật streaming cơ bản.

Nếu bạn muốn một máy khách MCP bên ngoài giao tiếp trực tiếp với các cuộc trò
chuyện kênh OpenClaw thay vì lưu trữ một phiên ACP harness, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp).

## Đây không phải là gì

Trang này thường bị nhầm với các phiên ACP harness.

`openclaw acp` có nghĩa là:

- OpenClaw hoạt động như một máy chủ ACP
- một IDE hoặc máy khách ACP kết nối tới OpenClaw
- OpenClaw chuyển tiếp công việc đó vào một phiên Gateway

Điều này khác với [ACP Agents](/vi/tools/acp-agents), nơi OpenClaw chạy một
harness bên ngoài như Codex hoặc Claude Code thông qua `acpx`.

Quy tắc nhanh:

- trình biên tập/máy khách muốn giao tiếp ACP với OpenClaw: dùng `openclaw acp`
- OpenClaw cần khởi chạy Codex/Claude/Gemini như một ACP harness: dùng `/acp spawn` và [ACP Agents](/vi/tools/acp-agents)

## Ma trận tương thích

| Khu vực ACP                                                           | Trạng thái          | Ghi chú                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai       | Luồng cầu nối lõi qua stdio tới Gateway chat/send + abort.                                                                                                                                                                                     |
| `listSessions`, lệnh gạch chéo                                        | Đã triển khai       | Danh sách phiên hoạt động dựa trên trạng thái phiên Gateway; các lệnh được quảng bá qua `available_commands_update`.                                                                                                                           |
| `loadSession`                                                         | Một phần            | Liên kết lại phiên ACP với một khóa phiên Gateway và phát lại lịch sử văn bản người dùng/trợ lý đã lưu. Lịch sử công cụ/hệ thống chưa được tái tạo.                                                                                            |
| Nội dung prompt (`text`, `resource` nhúng, hình ảnh)                  | Một phần            | Văn bản/tài nguyên được làm phẳng vào đầu vào chat; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                   |
| Chế độ phiên                                                          | Một phần            | `session/set_mode` được hỗ trợ và cầu nối phơi bày các điều khiển phiên ban đầu dựa trên Gateway cho mức suy nghĩ, độ dài đầu ra công cụ, reasoning, chi tiết mức sử dụng và hành động nâng quyền. Các bề mặt chế độ/cấu hình ACP-native rộng hơn vẫn nằm ngoài phạm vi. |
| Thông tin phiên và cập nhật mức sử dụng                               | Một phần            | Cầu nối phát thông báo `session_info_update` và `usage_update` theo best-effort từ các ảnh chụp nhanh phiên Gateway được lưu trong bộ nhớ đệm. Mức sử dụng là gần đúng và chỉ được gửi khi tổng token của Gateway được đánh dấu là mới.       |
| Streaming công cụ                                                     | Một phần            | Sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp theo best-effort khi đối số/kết quả công cụ Gateway phơi bày chúng. Terminal nhúng và đầu ra giàu hơn ở dạng diff-native vẫn chưa được phơi bày.    |
| Máy chủ MCP theo từng phiên (`mcpServers`)                            | Không được hỗ trợ   | Chế độ cầu nối từ chối yêu cầu máy chủ MCP theo từng phiên. Thay vào đó, hãy cấu hình MCP trên gateway hoặc agent OpenClaw.                                                                                                                    |
| Phương thức hệ thống tệp máy khách (`fs/read_text_file`, `fs/write_text_file`) | Không được hỗ trợ   | Cầu nối không gọi các phương thức hệ thống tệp máy khách ACP.                                                                                                                                                                                   |
| Phương thức terminal máy khách (`terminal/*`)                         | Không được hỗ trợ   | Cầu nối không tạo terminal máy khách ACP hoặc truyền id terminal qua các lệnh gọi công cụ.                                                                                                                                                      |
| Kế hoạch phiên / streaming suy nghĩ                                   | Không được hỗ trợ   | Cầu nối hiện phát văn bản đầu ra và trạng thái công cụ, không phát cập nhật kế hoạch hoặc suy nghĩ ACP.                                                                                                                                         |

## Hạn chế đã biết

- `loadSession` phát lại lịch sử văn bản người dùng và trợ lý đã lưu, nhưng
  không tái tạo các lệnh gọi công cụ lịch sử, thông báo hệ thống hoặc các loại
  sự kiện ACP-native phong phú hơn.
- Nếu nhiều máy khách ACP dùng chung cùng một khóa phiên Gateway, định tuyến sự
  kiện và hủy chỉ là best-effort thay vì được cô lập nghiêm ngặt theo từng máy
  khách. Ưu tiên các phiên `acp:<uuid>` cô lập mặc định khi bạn cần các lượt
  trình biên tập cục bộ sạch.
- Trạng thái dừng Gateway được chuyển đổi thành lý do dừng ACP, nhưng ánh xạ đó
  kém biểu đạt hơn một runtime ACP-native đầy đủ.
- Các điều khiển phiên ban đầu hiện chỉ phơi bày một tập con tập trung của các
  núm điều khiển Gateway: mức suy nghĩ, độ dài đầu ra công cụ, reasoning, chi
  tiết mức sử dụng và hành động nâng quyền. Lựa chọn mô hình và điều khiển
  exec-host chưa được phơi bày dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được suy ra từ ảnh chụp nhanh phiên
  Gateway, không phải kế toán runtime ACP-native trực tiếp. Mức sử dụng là gần
  đúng, không mang dữ liệu chi phí và chỉ được phát khi Gateway đánh dấu dữ liệu
  tổng token là mới.
- Dữ liệu theo dõi công cụ là best-effort. Cầu nối có thể hiển thị các đường dẫn
  tệp xuất hiện trong đối số/kết quả công cụ đã biết, nhưng chưa phát terminal
  ACP hoặc diff tệp có cấu trúc.

## Cách sử dụng

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
Nó sinh tiến trình cầu nối ACP và cho phép bạn nhập prompt tương tác.

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
- ACP chỉ tự động phê duyệt các lớp chỉ đọc hẹp: các lệnh gọi `read` có phạm vi trong cwd đang hoạt động cộng với công cụ tìm kiếm chỉ đọc (`search`, `web_search`, `memory_search`). Công cụ không xác định/không thuộc lõi, lượt đọc ngoài phạm vi, công cụ có khả năng exec, công cụ control-plane, công cụ có thay đổi dữ liệu và luồng tương tác luôn yêu cầu phê duyệt prompt rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được xem là siêu dữ liệu không đáng tin cậy (không phải nguồn ủy quyền).
- Chính sách cầu nối ACP này tách biệt với quyền ACPX harness. Nếu bạn chạy OpenClaw thông qua backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` là công tắc "yolo" phá kính cho phiên harness đó.

## Cách dùng nội dung này

Dùng ACP khi một IDE (hoặc máy khách khác) giao tiếp bằng Agent Client Protocol và bạn muốn
nó điều khiển một phiên OpenClaw Gateway.

1. Đảm bảo Gateway đang chạy (cục bộ hoặc từ xa).
2. Cấu hình đích Gateway (cấu hình hoặc cờ).
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

## Chọn agent

ACP không chọn agent trực tiếp. Nó định tuyến theo khóa phiên Gateway.

Dùng khóa phiên theo phạm vi agent để nhắm tới một agent cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ tới một khóa phiên Gateway duy nhất. Một agent có thể có nhiều
phiên; ACP mặc định dùng một phiên `acp:<uuid>` cô lập trừ khi bạn ghi đè
khóa hoặc nhãn.

`mcpServers` theo từng phiên không được hỗ trợ trong chế độ cầu nối. Nếu một máy khách ACP
gửi chúng trong `newSession` hoặc `loadSession`, cầu nối trả về lỗi rõ ràng
thay vì âm thầm bỏ qua chúng.

Nếu bạn muốn các phiên dựa trên ACPX thấy công cụ Plugin OpenClaw hoặc các công cụ
tích hợp được chọn như `cron`, hãy bật các cầu nối ACPX MCP phía gateway thay vì
cố truyền `mcpServers` theo từng phiên. Xem
[ACP Agents](/vi/tools/acp-agents-setup#plugin-tools-mcp-bridge) và
[cầu nối MCP công cụ OpenClaw](/vi/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Dùng từ `acpx` (Codex, Claude, máy khách ACP khác)

Nếu bạn muốn một coding agent như Codex hoặc Claude Code giao tiếp với bot
OpenClaw của bạn qua ACP, hãy dùng `acpx` với đích `openclaw` tích hợp của nó.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể tiếp cận nó.
2. Trỏ `acpx openclaw` tới `openclaw acp`.
3. Nhắm tới khóa phiên OpenClaw mà bạn muốn coding agent sử dụng.

Ví dụ:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Nếu bạn muốn `acpx openclaw` nhắm tới một Gateway và khóa phiên cụ thể mỗi
lần, hãy ghi đè lệnh agent `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Đối với một checkout OpenClaw cục bộ theo repo, hãy dùng entrypoint CLI trực tiếp thay vì
dev runner để luồng ACP luôn sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để Codex, Claude Code hoặc một máy khách nhận biết ACP khác
kéo thông tin ngữ cảnh từ một agent OpenClaw mà không cần cào dữ liệu từ terminal.

## Thiết lập trình biên tập Zed

Thêm một agent ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc dùng Settings UI của Zed):

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

Để nhắm đến một Gateway hoặc tác nhân cụ thể:

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

Trong Zed, mở bảng Agent và chọn "OpenClaw ACP" để bắt đầu một luồng.

## Ánh xạ phiên

Theo mặc định, các phiên ACP nhận một khóa phiên Gateway cô lập với tiền tố `acp:`.
Để dùng lại một phiên đã biết, hãy truyền khóa phiên hoặc nhãn:

- `--session <key>`: dùng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: phân giải một phiên hiện có theo nhãn.
- `--reset-session`: tạo một id phiên mới cho khóa đó (cùng khóa, transcript mới).

Nếu client ACP của bạn hỗ trợ siêu dữ liệu, bạn có thể ghi đè theo từng phiên:

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
- `--token <token>`: token xác thực Gateway.
- `--token-file <path>`: đọc token xác thực Gateway từ tệp.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ tệp.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định để phân giải.
- `--require-existing`: thất bại nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước lần sử dụng đầu tiên.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào prompt.
- `--provenance <off|meta|meta+receipt>`: bao gồm siêu dữ liệu hoặc biên nhận nguồn gốc ACP.
- `--verbose, -v`: ghi log chi tiết vào stderr.

Lưu ý bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình cục bộ trên một số hệ thống.
- Nên dùng `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Cơ chế phân giải xác thực Gateway tuân theo hợp đồng dùng chung được các client Gateway khác sử dụng:
  - chế độ cục bộ: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> dự phòng `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được đặt (SecretRefs cục bộ đã cấu hình nhưng chưa phân giải sẽ thất bại đóng)
  - chế độ từ xa: `gateway.remote.*` với dự phòng env/config theo các quy tắc ưu tiên từ xa
  - `--url` an toàn để ghi đè và không dùng lại thông tin xác thực config/env ngầm định; hãy truyền rõ ràng `--token`/`--password` (hoặc các biến thể tệp)
- Các tiến trình con backend runtime ACP nhận `OPENCLAW_SHELL=acp`, có thể được dùng cho các quy tắc shell/profile theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình bridge được sinh ra.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: đối số bổ sung được truyền cho máy chủ ACP.
- `--server-verbose`: bật ghi log chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi log client chi tiết.

## Liên quan

- [Tham khảo CLI](/vi/cli)
- [Tác nhân ACP](/vi/tools/acp-agents)
