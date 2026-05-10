---
read_when:
    - Thiết lập các tích hợp IDE dựa trên ACP
    - Gỡ lỗi định tuyến phiên ACP tới Gateway
summary: Chạy cầu nối ACP cho các tích hợp IDE
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Chạy cầu nối [Giao thức máy khách tác tử (ACP)](https://agentclientprotocol.com/) giao tiếp với OpenClaw Gateway.

Lệnh này dùng ACP qua stdio cho IDE và chuyển tiếp prompt đến Gateway
qua WebSocket. Lệnh duy trì ánh xạ các phiên ACP với khóa phiên Gateway.

`openclaw acp` là cầu nối ACP dựa trên Gateway, không phải runtime trình soạn thảo
ACP-native đầy đủ. Lệnh tập trung vào định tuyến phiên, gửi prompt và các cập nhật
streaming cơ bản.

Nếu bạn muốn một máy khách MCP bên ngoài giao tiếp trực tiếp với các cuộc hội thoại
kênh OpenClaw thay vì lưu trữ một phiên ACP harness, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay thế.

## Đây không phải là gì

Trang này thường bị nhầm với các phiên ACP harness.

`openclaw acp` nghĩa là:

- OpenClaw hoạt động như một máy chủ ACP
- một IDE hoặc máy khách ACP kết nối với OpenClaw
- OpenClaw chuyển tiếp công việc đó vào một phiên Gateway

Điều này khác với [Tác tử ACP](/vi/tools/acp-agents), nơi OpenClaw chạy một
harness bên ngoài như Codex hoặc Claude Code thông qua `acpx`.

Quy tắc nhanh:

- trình soạn thảo/máy khách muốn giao tiếp ACP với OpenClaw: dùng `openclaw acp`
- OpenClaw nên khởi chạy Codex/Claude/Gemini như một ACP harness: dùng `/acp spawn` và [Tác tử ACP](/vi/tools/acp-agents)

## Ma trận tương thích

| Khu vực ACP                                                            | Trạng thái   | Ghi chú                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai | Luồng cầu nối lõi qua stdio đến chat/send + abort của Gateway.                                                                                                                                                                                  |
| `listSessions`, lệnh slash                                            | Đã triển khai | Danh sách phiên hoạt động dựa trên trạng thái phiên Gateway với phân trang con trỏ có giới hạn và lọc `cwd` khi các hàng phiên Gateway mang siêu dữ liệu workspace; các lệnh được quảng bá qua `available_commands_update`.                    |
| `resumeSession`, `closeSession`                                       | Đã triển khai | Resume liên kết lại một phiên ACP với phiên Gateway hiện có mà không phát lại lịch sử. Close hủy công việc cầu nối đang hoạt động, giải quyết các prompt đang chờ thành đã hủy và giải phóng trạng thái phiên cầu nối.                         |
| `loadSession`                                                         | Một phần     | Liên kết lại phiên ACP với khóa phiên Gateway và phát lại lịch sử sổ cái sự kiện ACP cho các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái dùng fallback văn bản người dùng/trợ lý đã lưu.                                                |
| Nội dung prompt (`text`, `resource` nhúng, hình ảnh)                  | Một phần     | Văn bản/tài nguyên được làm phẳng vào đầu vào chat; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                    |
| Chế độ phiên                                                          | Một phần     | `session/set_mode` được hỗ trợ và cầu nối hiển thị các điều khiển phiên ban đầu dựa trên Gateway cho mức suy nghĩ, độ chi tiết công cụ, suy luận, chi tiết sử dụng và hành động nâng quyền. Các bề mặt chế độ/cấu hình ACP-native rộng hơn vẫn nằm ngoài phạm vi. |
| Thông tin phiên và cập nhật sử dụng                                   | Một phần     | Cầu nối phát thông báo `session_info_update` và `usage_update` theo nỗ lực tốt nhất từ ảnh chụp nhanh phiên Gateway đã lưu cache. Mức sử dụng là xấp xỉ và chỉ được gửi khi tổng token của Gateway được đánh dấu là mới.                      |
| Streaming công cụ                                                     | Một phần     | Sự kiện `tool_call` / `tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp theo nỗ lực tốt nhất khi args/kết quả công cụ Gateway cung cấp chúng. Terminal nhúng và đầu ra diff-native phong phú hơn vẫn chưa được hiển thị.       |
| Phê duyệt exec                                                        | Một phần     | Prompt phê duyệt exec của Gateway trong các lượt prompt ACP đang hoạt động được chuyển tiếp đến máy khách ACP bằng `session/request_permission`.                                                                                                 |
| Máy chủ MCP theo từng phiên (`mcpServers`)                            | Không hỗ trợ | Chế độ cầu nối từ chối các yêu cầu máy chủ MCP theo từng phiên. Thay vào đó, hãy cấu hình MCP trên Gateway hoặc tác tử OpenClaw.                                                                                                                |
| Phương thức hệ thống tệp máy khách (`fs/read_text_file`, `fs/write_text_file`) | Không hỗ trợ | Cầu nối không gọi các phương thức hệ thống tệp máy khách ACP.                                                                                                                                                                                    |
| Phương thức terminal máy khách (`terminal/*`)                         | Không hỗ trợ | Cầu nối không tạo terminal máy khách ACP hoặc stream ID terminal qua các lệnh gọi công cụ.                                                                                                                                                       |
| Kế hoạch phiên / streaming suy nghĩ                                   | Không hỗ trợ | Cầu nối hiện phát văn bản đầu ra và trạng thái công cụ, không phát cập nhật kế hoạch hoặc suy nghĩ ACP.                                                                                                                                          |

## Hạn chế đã biết

- `loadSession` chỉ có thể phát lại lịch sử sổ cái sự kiện ACP đầy đủ cho
  các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái vẫn dùng transcript
  fallback và không tái dựng các lệnh gọi công cụ hoặc thông báo hệ thống trong lịch sử.
- Nếu nhiều máy khách ACP dùng chung cùng một khóa phiên Gateway, việc định tuyến
  sự kiện và hủy là theo nỗ lực tốt nhất thay vì cô lập nghiêm ngặt theo từng máy khách. Nên dùng
  các phiên `acp:<uuid>` cô lập mặc định khi bạn cần các lượt cục bộ trong trình soạn thảo
  sạch sẽ.
- Trạng thái dừng của Gateway được dịch sang lý do dừng ACP, nhưng ánh xạ đó
  kém biểu đạt hơn một runtime ACP-native đầy đủ.
- Các điều khiển phiên ban đầu hiện hiển thị một tập con tập trung của các núm chỉnh Gateway:
  mức suy nghĩ, độ chi tiết công cụ, suy luận, chi tiết sử dụng và hành động nâng quyền.
  Lựa chọn mô hình và điều khiển exec-host chưa được hiển thị dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được suy ra từ ảnh chụp nhanh phiên Gateway,
  không phải kế toán runtime ACP-native trực tiếp. Mức sử dụng là xấp xỉ,
  không có dữ liệu chi phí và chỉ được phát khi Gateway đánh dấu dữ liệu tổng token
  là mới.
- Dữ liệu theo dõi công cụ là theo nỗ lực tốt nhất. Cầu nối có thể hiển thị đường dẫn tệp
  xuất hiện trong args/kết quả công cụ đã biết, nhưng chưa phát terminal ACP hoặc
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
Nó tạo cầu nối ACP và cho phép bạn nhập prompt một cách tương tác.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ gỡ lỗi máy khách):

- Tự động phê duyệt dựa trên danh sách cho phép và chỉ áp dụng cho ID công cụ lõi đáng tin cậy.
- Tự động phê duyệt `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- ACP chỉ tự động phê duyệt các lớp chỉ đọc hẹp: lệnh gọi `read` có phạm vi dưới cwd đang hoạt động cùng với các công cụ tìm kiếm chỉ đọc (`search`, `web_search`, `memory_search`). Công cụ không xác định/không thuộc lõi, đọc ngoài phạm vi, công cụ có khả năng exec, công cụ control-plane, công cụ thay đổi dữ liệu và luồng tương tác luôn yêu cầu phê duyệt prompt rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được xem là siêu dữ liệu không đáng tin cậy (không phải nguồn ủy quyền).
- Chính sách cầu nối ACP này tách biệt với quyền ACPX harness. Nếu bạn chạy OpenClaw thông qua backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` là công tắc "yolo" phá kính cho phiên harness đó.

## Kiểm thử smoke giao thức

Để gỡ lỗi ở cấp giao thức, khởi động một Gateway với trạng thái cô lập và điều khiển
`openclaw acp` qua stdio bằng máy khách JSON-RPC ACP. Bao phủ `initialize`,
`session/new`, `session/list` với `cwd` tuyệt đối, `session/resume`,
`session/close`, đóng trùng lặp và resume bị thiếu.

Bằng chứng nên bao gồm các khả năng vòng đời được quảng bá, một hàng phiên dựa trên
Gateway, thông báo cập nhật và nhật ký `sessions.list` của Gateway:

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
CLI đó có thể yêu cầu nâng cấp phạm vi operator token mới; tính đúng đắn của cầu nối ACP
được chứng minh bằng frame stdio ACP cộng với nhật ký `sessions.list` của Gateway.

## Cách sử dụng mục này

Dùng ACP khi một IDE (hoặc máy khách khác) nói Agent Client Protocol và bạn muốn
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

Dùng khóa phiên có phạm vi tác tử để nhắm đến một tác tử cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ tới một khóa phiên Gateway duy nhất. Một tác tử có thể có nhiều
phiên; ACP mặc định dùng một phiên `acp:<uuid>` cô lập trừ khi bạn ghi đè
khóa hoặc nhãn.

Các `mcpServers` theo phiên không được hỗ trợ trong chế độ cầu nối. Nếu một client ACP
gửi chúng trong `newSession` hoặc `loadSession`, cầu nối sẽ trả về một lỗi rõ ràng
thay vì âm thầm bỏ qua chúng.

Nếu bạn muốn các phiên dựa trên ACPX thấy được các công cụ Plugin OpenClaw hoặc các
công cụ tích hợp sẵn được chọn như `cron`, hãy bật các cầu nối ACPX MCP phía Gateway
thay vì cố truyền `mcpServers` theo phiên. Xem
[Tác nhân ACP](/vi/tools/acp-agents-setup#plugin-tools-mcp-bridge) và
[cầu nối MCP công cụ OpenClaw](/vi/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Sử dụng từ `acpx` (Codex, Claude, các client ACP khác)

Nếu bạn muốn một tác nhân lập trình như Codex hoặc Claude Code giao tiếp với bot
OpenClaw của bạn qua ACP, hãy dùng `acpx` với đích `openclaw` tích hợp sẵn của nó.

Luồng điển hình:

1. Chạy Gateway và đảm bảo cầu nối ACP có thể kết nối tới nó.
2. Trỏ `acpx openclaw` tới `openclaw acp`.
3. Nhắm tới khóa phiên OpenClaw mà bạn muốn tác nhân lập trình sử dụng.

Ví dụ:

```bash
# Yêu cầu một lần vào phiên ACP OpenClaw mặc định của bạn
acpx openclaw exec "Summarize the active OpenClaw session state."

# Phiên có tên, duy trì liên tục cho các lượt theo dõi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Nếu bạn muốn `acpx openclaw` luôn nhắm tới một Gateway và khóa phiên cụ thể
mỗi lần, hãy ghi đè lệnh tác nhân `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Với một bản checkout OpenClaw cục bộ của repo, hãy dùng điểm vào CLI trực tiếp
thay cho trình chạy dev để luồng ACP luôn sạch. Ví dụ:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để cho Codex, Claude Code hoặc một client khác hiểu ACP
kéo thông tin ngữ cảnh từ một tác nhân OpenClaw mà không cần thu thập từ terminal.

## Thiết lập trình chỉnh sửa Zed

Thêm một tác nhân ACP tùy chỉnh trong `~/.config/zed/settings.json` (hoặc dùng giao diện Settings của Zed):

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

Trong Zed, mở bảng Agent và chọn "OpenClaw ACP" để bắt đầu một luồng.

## Ánh xạ phiên

Theo mặc định, các phiên ACP nhận một khóa phiên Gateway tách biệt với tiền tố `acp:`.
Để dùng lại một phiên đã biết, hãy truyền khóa phiên hoặc nhãn:

- `--session <key>`: dùng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: phân giải một phiên hiện có theo nhãn.
- `--reset-session`: tạo một id phiên mới cho khóa đó (cùng khóa, transcript mới).

Nếu client ACP của bạn hỗ trợ metadata, bạn có thể ghi đè theo từng phiên:

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

- `--url <url>`: URL WebSocket của Gateway (mặc định là gateway.remote.url khi đã cấu hình).
- `--token <token>`: token xác thực Gateway.
- `--token-file <path>`: đọc token xác thực Gateway từ tệp.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ tệp.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định để phân giải.
- `--require-existing`: thất bại nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước lần sử dụng đầu tiên.
- `--no-prefix-cwd`: không thêm tiền tố thư mục làm việc vào prompt.
- `--provenance <off|meta|meta+receipt>`: bao gồm metadata hoặc biên nhận nguồn gốc ACP.
- `--verbose, -v`: ghi log chi tiết vào stderr.

Lưu ý bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình cục bộ trên một số hệ thống.
- Ưu tiên `--token-file`/`--password-file` hoặc biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Phân giải xác thực Gateway tuân theo hợp đồng dùng chung bởi các client Gateway khác:
  - chế độ cục bộ: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> dự phòng `gateway.remote.*` chỉ khi `gateway.auth.*` chưa được đặt (các SecretRef cục bộ đã cấu hình nhưng chưa phân giải sẽ thất bại đóng)
  - chế độ từ xa: `gateway.remote.*` với dự phòng env/config theo quy tắc ưu tiên từ xa
  - `--url` an toàn khi ghi đè và không dùng lại ngầm định thông tin đăng nhập config/env; hãy truyền rõ ràng `--token`/`--password` (hoặc các biến thể tệp)
- Các tiến trình con backend runtime ACP nhận `OPENCLAW_SHELL=acp`, có thể dùng cho các quy tắc shell/profile theo ngữ cảnh.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình cầu nối được sinh ra.

### Tùy chọn `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: đối số bổ sung được truyền cho máy chủ ACP.
- `--server-verbose`: bật ghi log chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi log client chi tiết.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác nhân ACP](/vi/tools/acp-agents)
