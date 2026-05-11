---
read_when:
    - Thiết lập các tích hợp IDE dựa trên ACP
    - Gỡ lỗi định tuyến phiên ACP đến Gateway
summary: Chạy cầu nối ACP cho các tích hợp IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Chạy cầu nối [Giao thức Máy khách Tác nhân (ACP)](https://agentclientprotocol.com/) giao tiếp với OpenClaw Gateway.

Lệnh này dùng ACP qua stdio cho IDE và chuyển tiếp lời nhắc đến Gateway
qua WebSocket. Nó giữ các phiên ACP được ánh xạ với khóa phiên Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải runtime trình chỉnh sửa
ACP-native đầy đủ. Nó tập trung vào định tuyến phiên, gửi lời nhắc và các cập nhật
truyền phát cơ bản.

Nếu bạn muốn một máy khách MCP bên ngoài giao tiếp trực tiếp với các cuộc hội thoại
kênh OpenClaw thay vì lưu trữ phiên ACP harness, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay thế.

## Đây không phải là gì

Trang này thường bị nhầm với các phiên ACP harness.

`openclaw acp` nghĩa là:

- OpenClaw hoạt động như một máy chủ ACP
- một IDE hoặc máy khách ACP kết nối với OpenClaw
- OpenClaw chuyển tiếp công việc đó vào một phiên Gateway

Điều này khác với [Tác nhân ACP](/vi/tools/acp-agents), nơi OpenClaw chạy một
harness bên ngoài như Codex hoặc Claude Code thông qua `acpx`.

Quy tắc nhanh:

- trình chỉnh sửa/máy khách muốn giao tiếp ACP với OpenClaw: dùng `openclaw acp`
- OpenClaw nên khởi chạy Codex/Claude/Gemini như một ACP harness: dùng `/acp spawn` và [Tác nhân ACP](/vi/tools/acp-agents)

## Ma trận tương thích

| Khu vực ACP                                                           | Trạng thái  | Ghi chú                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai | Luồng cầu nối lõi qua stdio đến chat/send + hủy của Gateway.                                                                                                                                                                                     |
| `listSessions`, lệnh gạch chéo                                        | Đã triển khai | Danh sách phiên hoạt động dựa trên trạng thái phiên Gateway với phân trang con trỏ có giới hạn và lọc `cwd` khi các hàng phiên Gateway mang siêu dữ liệu không gian làm việc; lệnh được quảng bá qua `available_commands_update`.              |
| Siêu dữ liệu dòng dõi phiên                                           | Đã triển khai | Danh sách phiên và ảnh chụp nhanh thông tin phiên bao gồm dòng dõi cha và con của OpenClaw trong `_meta` để máy khách ACP có thể hiển thị đồ thị subagent mà không cần kênh phụ Gateway riêng tư.                                               |
| `resumeSession`, `closeSession`                                       | Đã triển khai | Tiếp tục sẽ liên kết lại một phiên ACP với phiên Gateway hiện có mà không phát lại lịch sử. Đóng sẽ hủy công việc cầu nối đang hoạt động, giải quyết các lời nhắc đang chờ là đã hủy và giải phóng trạng thái phiên cầu nối.                   |
| `loadSession`                                                         | Một phần    | Liên kết lại phiên ACP với khóa phiên Gateway và phát lại lịch sử sổ cái sự kiện ACP cho các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái sẽ dùng dự phòng văn bản người dùng/trợ lý đã lưu.                                             |
| Nội dung lời nhắc (`text`, `resource` nhúng, hình ảnh)                | Một phần    | Văn bản/tài nguyên được làm phẳng thành đầu vào chat; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                  |
| Chế độ phiên                                                          | Một phần    | `session/set_mode` được hỗ trợ và cầu nối hiển thị các điều khiển phiên ban đầu dựa trên Gateway cho mức suy nghĩ, độ chi tiết công cụ, lập luận, chi tiết sử dụng và hành động nâng quyền. Các bề mặt chế độ/cấu hình ACP-native rộng hơn vẫn nằm ngoài phạm vi. |
| Thông tin phiên và cập nhật sử dụng                                   | Một phần    | Cầu nối phát thông báo `session_info_update` và `usage_update` theo nỗ lực tốt nhất từ các ảnh chụp nhanh phiên Gateway đã lưu đệm. Mức sử dụng là xấp xỉ và chỉ được gửi khi tổng token của Gateway được đánh dấu là mới.                    |
| Truyền phát công cụ                                                   | Một phần    | Sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp theo nỗ lực tốt nhất khi đối số/kết quả công cụ Gateway phơi bày chúng. Terminal nhúng và đầu ra diff-native phong phú hơn vẫn chưa được phơi bày.       |
| Phê duyệt exec                                                        | Một phần    | Lời nhắc phê duyệt exec của Gateway trong lượt lời nhắc ACP đang hoạt động được chuyển tiếp đến máy khách ACP bằng `session/request_permission`.                                                                                                  |
| Máy chủ MCP theo phiên (`mcpServers`)                                 | Không hỗ trợ | Chế độ cầu nối từ chối yêu cầu máy chủ MCP theo phiên. Thay vào đó, hãy cấu hình MCP trên gateway hoặc tác nhân OpenClaw.                                                                                                                       |
| Phương thức hệ thống tệp máy khách (`fs/read_text_file`, `fs/write_text_file`) | Không hỗ trợ | Cầu nối không gọi các phương thức hệ thống tệp của máy khách ACP.                                                                                                                                                                                |
| Phương thức terminal máy khách (`terminal/*`)                         | Không hỗ trợ | Cầu nối không tạo terminal máy khách ACP hoặc truyền phát id terminal qua lệnh gọi công cụ.                                                                                                                                                     |
| Kế hoạch phiên / truyền phát suy nghĩ                                 | Không hỗ trợ | Cầu nối hiện phát văn bản đầu ra và trạng thái công cụ, không phát cập nhật kế hoạch hoặc suy nghĩ ACP.                                                                                                                                         |

## Hạn chế đã biết

- `loadSession` chỉ có thể phát lại lịch sử sổ cái sự kiện ACP hoàn chỉnh cho
  các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái vẫn dùng dự phòng
  bản ghi hội thoại và không tái tạo lệnh gọi công cụ hoặc thông báo hệ thống
  trong lịch sử.
- Nếu nhiều máy khách ACP dùng chung cùng một khóa phiên Gateway, việc định tuyến
  sự kiện và hủy là theo nỗ lực tốt nhất thay vì được cô lập nghiêm ngặt theo
  từng máy khách. Hãy ưu tiên các phiên `acp:<uuid>` cô lập mặc định khi bạn
  cần các lượt cục bộ với trình chỉnh sửa sạch sẽ.
- Trạng thái dừng Gateway được dịch thành lý do dừng ACP, nhưng ánh xạ đó kém
  biểu đạt hơn runtime ACP-native đầy đủ.
- Các điều khiển phiên ban đầu hiện chỉ hiển thị một tập con tập trung các nút
  điều chỉnh của Gateway: mức suy nghĩ, độ chi tiết công cụ, lập luận, chi tiết
  sử dụng và hành động nâng quyền. Lựa chọn mô hình và điều khiển máy chủ exec
  chưa được phơi bày dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được dẫn xuất từ ảnh chụp nhanh phiên
  Gateway, không phải kế toán runtime ACP-native trực tiếp. Mức sử dụng là xấp xỉ,
  không mang dữ liệu chi phí và chỉ được phát khi Gateway đánh dấu dữ liệu tổng
  token là mới.
- Dữ liệu theo dõi công cụ là theo nỗ lực tốt nhất. Cầu nối có thể hiển thị đường
  dẫn tệp xuất hiện trong các đối số/kết quả công cụ đã biết, nhưng chưa phát
  terminal ACP hoặc diff tệp có cấu trúc.
- Chuyển tiếp phê duyệt exec chỉ nằm trong phạm vi lượt lời nhắc ACP đang hoạt động;
  phê duyệt từ các phiên Gateway khác bị bỏ qua.

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

Sử dụng client ACP tích hợp sẵn để kiểm tra nhanh cầu nối mà không cần IDE.
Nó khởi chạy cầu nối ACP và cho phép bạn nhập prompt theo cách tương tác.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ gỡ lỗi client):

- Tự động phê duyệt dựa trên danh sách cho phép và chỉ áp dụng cho ID công cụ lõi đáng tin cậy.
- Tự động phê duyệt `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- ACP chỉ tự động phê duyệt các lớp chỉ đọc hẹp: các lệnh gọi `read` có phạm vi dưới cwd đang hoạt động cùng với các công cụ tìm kiếm chỉ đọc (`search`, `web_search`, `memory_search`). Công cụ không xác định/không thuộc lõi, lượt đọc ngoài phạm vi, công cụ có khả năng thực thi, công cụ mặt phẳng điều khiển, công cụ thay đổi trạng thái và luồng tương tác luôn yêu cầu phê duyệt prompt rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được xem là siêu dữ liệu không đáng tin cậy (không phải nguồn ủy quyền).
- Chính sách cầu nối ACP này tách biệt với quyền của harness ACPX. Nếu bạn chạy OpenClaw qua backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` là công tắc “yolo” phá kính cho phiên harness đó.

## Kiểm thử smoke giao thức

Để gỡ lỗi ở cấp giao thức, hãy khởi động một Gateway với trạng thái cô lập và điều khiển
`openclaw acp` qua stdio bằng một client JSON-RPC ACP. Bao phủ `initialize`,
`session/new`, `session/list` với `cwd` tuyệt đối, `session/resume`,
`session/close`, đóng trùng lặp và resume bị thiếu.

Bằng chứng nên bao gồm các khả năng vòng đời được quảng bá, một hàng phiên được Gateway hỗ trợ,
thông báo cập nhật và nhật ký `sessions.list` của Gateway:

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
CLI đó có thể yêu cầu nâng cấp phạm vi toán tử bằng token mới; tính đúng đắn của cầu nối ACP
được chứng minh bằng các frame stdio ACP cùng với nhật ký `sessions.list` của Gateway.

## Cách sử dụng

Dùng ACP khi một IDE (hoặc client khác) nói Giao thức Client Tác tử và bạn muốn
nó điều khiển một phiên OpenClaw Gateway.

1. Đảm bảo Gateway đang chạy (cục bộ hoặc từ xa).
2. Cấu hình đích Gateway (cấu hình hoặc cờ).
3. Trỏ IDE của bạn để chạy `openclaw acp` qua stdio.

Cấu hình ví dụ (được lưu):

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

Dùng khóa phiên theo phạm vi tác tử để nhắm tới một tác tử cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ tới một khóa phiên Gateway duy nhất. Một tác nhân có thể có nhiều
phiên; ACP mặc định dùng phiên `acp:<uuid>` tách biệt trừ khi bạn ghi đè
khóa hoặc nhãn.

`mcpServers` theo từng phiên không được hỗ trợ trong chế độ cầu nối. Nếu một máy khách ACP
gửi chúng trong `newSession` hoặc `loadSession`, cầu nối sẽ trả về một
lỗi rõ ràng thay vì âm thầm bỏ qua.

Nếu bạn muốn các phiên dựa trên ACPX nhìn thấy công cụ Plugin OpenClaw hoặc các
công cụ tích hợp sẵn được chọn như `cron`, hãy bật các cầu nối ACPX MCP phía Gateway
thay vì cố truyền `mcpServers` theo từng phiên. Xem
[Tác nhân ACP](/vi/tools/acp-agents-setup#plugin-tools-mcp-bridge) và
[Cầu nối MCP công cụ OpenClaw](/vi/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Sử dụng từ `acpx` (Codex, Claude, các máy khách ACP khác)

Nếu bạn muốn một tác nhân lập trình như Codex hoặc Claude Code giao tiếp với bot
OpenClaw của bạn qua ACP, hãy dùng `acpx` với mục tiêu `openclaw` tích hợp sẵn.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể kết nối tới nó.
2. Trỏ `acpx openclaw` tới `openclaw acp`.
3. Nhắm tới khóa phiên OpenClaw mà bạn muốn tác nhân lập trình sử dụng.

Ví dụ:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Nếu bạn muốn `acpx openclaw` luôn nhắm tới một Gateway và khóa phiên cụ thể, hãy ghi đè
lệnh tác nhân `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Đối với bản checkout OpenClaw cục bộ theo repo, hãy dùng điểm vào CLI trực tiếp thay vì
trình chạy dev để luồng ACP luôn sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để cho Codex, Claude Code hoặc một máy khách hiểu ACP khác
lấy thông tin ngữ cảnh từ một tác nhân OpenClaw mà không cần quét nội dung terminal.

## Thiết lập trình soạn thảo Zed

Thêm một tác nhân ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc dùng giao diện Cài đặt của Zed):

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

Để nhắm tới một Gateway hoặc tác nhân cụ thể:

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

Trong Zed, mở bảng Tác nhân và chọn "OpenClaw ACP" để bắt đầu một luồng.

## Ánh xạ phiên

Theo mặc định, các phiên ACP nhận một khóa phiên Gateway tách biệt với tiền tố `acp:`.
Để dùng lại một phiên đã biết, hãy truyền khóa phiên hoặc nhãn:

- `--session <key>`: dùng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: phân giải một phiên hiện có theo nhãn.
- `--reset-session`: tạo một mã định danh phiên mới cho khóa đó (cùng khóa, bản ghi hội thoại mới).

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

- `--url <url>`: URL WebSocket Gateway (mặc định là gateway.remote.url khi được cấu hình).
- `--token <token>`: mã thông báo xác thực Gateway.
- `--token-file <path>`: đọc mã thông báo xác thực Gateway từ tệp.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ tệp.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định để phân giải.
- `--require-existing`: thất bại nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước lần sử dụng đầu tiên.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào lời nhắc.
- `--provenance <off|meta|meta+receipt>`: bao gồm siêu dữ liệu hoặc biên nhận nguồn gốc ACP.
- `--verbose, -v`: ghi nhật ký chi tiết vào stderr.

Ghi chú bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình cục bộ trên một số hệ thống.
- Ưu tiên `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Cơ chế phân giải xác thực Gateway tuân theo hợp đồng dùng chung bởi các máy khách Gateway khác:
  - chế độ cục bộ: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> dự phòng `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được đặt (các SecretRef cục bộ đã cấu hình nhưng không phân giải được sẽ đóng an toàn)
  - chế độ từ xa: `gateway.remote.*` với dự phòng env/config theo quy tắc ưu tiên từ xa
  - `--url` an toàn khi ghi đè và không dùng lại thông tin xác thực config/env ngầm định; hãy truyền rõ `--token`/`--password` (hoặc các biến thể tệp)
- Các tiến trình con backend thời gian chạy ACP nhận `OPENCLAW_SHELL=acp`, có thể dùng cho các quy tắc shell/profile theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình cầu nối được sinh ra.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: đối số bổ sung được truyền tới máy chủ ACP.
- `--server-verbose`: bật ghi nhật ký chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi nhật ký máy khách chi tiết.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác nhân ACP](/vi/tools/acp-agents)
