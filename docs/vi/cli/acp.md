---
read_when:
    - Thiết lập tích hợp IDE dựa trên ACP
    - Gỡ lỗi định tuyến phiên ACP đến Gateway
summary: Chạy cầu nối ACP cho các tích hợp IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T07:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Chạy cầu nối [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) giao tiếp với một Gateway OpenClaw.

`openclaw acp` giao tiếp bằng ACP qua stdio cho các IDE và chuyển tiếp lời nhắc đến Gateway qua WebSocket, đồng thời duy trì ánh xạ các phiên ACP với khóa phiên Gateway. Đây là cầu nối ACP dựa trên Gateway, không phải môi trường thời gian chạy trình soạn thảo thuần ACP đầy đủ: nó tập trung vào định tuyến phiên, chuyển phát lời nhắc và truyền trực tiếp các bản cập nhật.

Nếu bạn muốn một máy khách MCP bên ngoài giao tiếp trực tiếp với các cuộc hội thoại trên kênh OpenClaw thay vì lưu trữ một phiên bộ khung ACP, hãy dùng [`openclaw mcp serve`](/vi/cli/mcp).

## Đây không phải là gì

`openclaw acp` có nghĩa là OpenClaw hoạt động như một máy chủ ACP: IDE hoặc máy khách ACP kết nối với OpenClaw, rồi OpenClaw chuyển tiếp công việc đó vào một phiên Gateway.

Điều này khác với [Tác nhân ACP](/vi/tools/acp-agents), nơi OpenClaw chạy một bộ khung bên ngoài như Codex hoặc Claude Code thông qua `acpx`.

Quy tắc nhanh:

- trình soạn thảo/máy khách muốn giao tiếp bằng ACP với OpenClaw: dùng `openclaw acp`
- OpenClaw cần khởi chạy Codex/Claude/Gemini dưới dạng bộ khung ACP: dùng `/acp spawn` và [Tác nhân ACP](/vi/tools/acp-agents)

## Ma trận tương thích

| Phạm vi ACP                                                            | Trạng thái       | Ghi chú                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Đã triển khai    | Luồng cầu nối cốt lõi qua stdio đến chức năng trò chuyện/gửi + hủy của Gateway.                                                                                                                                                                                       |
| `listSessions`, lệnh gạch chéo                                       | Đã triển khai    | Danh sách phiên hoạt động dựa trên trạng thái phiên Gateway với phân trang bằng con trỏ có giới hạn và lọc theo `cwd` khi các hàng phiên Gateway có siêu dữ liệu không gian làm việc; các lệnh được công bố qua `available_commands_update`.                            |
| Siêu dữ liệu quan hệ phiên                                            | Đã triển khai    | Danh sách phiên và ảnh chụp nhanh thông tin phiên bao gồm quan hệ cha-con của OpenClaw trong `_meta`, để máy khách ACP có thể hiển thị đồ thị tác nhân con mà không cần các kênh phụ riêng tư của Gateway.                                                             |
| `resumeSession`, `closeSession`                                       | Đã triển khai    | Tiếp tục sẽ liên kết lại một phiên ACP với phiên Gateway hiện có mà không phát lại lịch sử. Đóng sẽ hủy công việc cầu nối đang hoạt động, giải quyết các lời nhắc đang chờ thành trạng thái đã hủy và giải phóng trạng thái phiên cầu nối.                               |
| `loadSession`                                                         | Một phần         | Liên kết lại phiên ACP với khóa phiên Gateway và phát lại lịch sử sổ cái sự kiện ACP cho các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái sẽ dự phòng bằng văn bản người dùng/trợ lý đã lưu.                                                                    |
| Nội dung lời nhắc (`text`, `resource` nhúng, hình ảnh)                | Một phần         | Văn bản/tài nguyên được làm phẳng thành đầu vào trò chuyện; hình ảnh trở thành tệp đính kèm Gateway.                                                                                                                                                                  |
| Chế độ phiên                                                          | Một phần         | Có hỗ trợ `session/set_mode`; cầu nối cung cấp các điều khiển phiên dựa trên Gateway cho mức độ suy nghĩ, độ chi tiết của công cụ, suy luận, chi tiết mức sử dụng và hành động đặc quyền. Các bề mặt cấu hình/chế độ thuần ACP rộng hơn vẫn nằm ngoài phạm vi.          |
| Truyền trực tiếp quá trình suy nghĩ                                   | Đã triển khai    | Nội dung suy nghĩ của mô hình được truyền dưới dạng các bản cập nhật phiên `agent_thought_chunk`. Không phát ra kế hoạch phiên thuần ACP.                                                                                                                             |
| Thông tin phiên và cập nhật mức sử dụng                               | Một phần         | Cầu nối phát thông báo `session_info_update` và `usage_update` theo khả năng tốt nhất từ các ảnh chụp nhanh phiên Gateway được lưu đệm. Mức sử dụng chỉ là xấp xỉ và chỉ được gửi khi tổng số token của Gateway được đánh dấu là mới.                                  |
| Truyền trực tiếp công cụ                                              | Một phần         | Các sự kiện `tool_call`/`tool_call_update` bao gồm I/O thô, nội dung văn bản và vị trí tệp theo khả năng tốt nhất khi đối số/kết quả công cụ Gateway cung cấp chúng. Không cung cấp terminal nhúng và đầu ra giàu thông tin hơn theo dạng diff gốc.                    |
| Phê duyệt thực thi                                                    | Một phần         | Lời nhắc phê duyệt thực thi của Gateway trong lượt lời nhắc ACP đang hoạt động được chuyển tiếp đến máy khách ACP bằng `session/request_permission`.                                                                                                                  |
| Máy chủ MCP theo phiên (`mcpServers`)                                 | Không được hỗ trợ | Chế độ cầu nối từ chối yêu cầu máy chủ MCP theo phiên. Thay vào đó, hãy cấu hình MCP trên Gateway OpenClaw hoặc tác nhân.                                                                                                                                             |
| Phương thức hệ thống tệp của máy khách (`fs/read_text_file`, `fs/write_text_file`) | Không được hỗ trợ | Cầu nối không gọi các phương thức hệ thống tệp của máy khách ACP.                                                                                                                                                                                                    |
| Phương thức terminal của máy khách (`terminal/*`)                     | Không được hỗ trợ | Cầu nối không tạo terminal máy khách ACP hoặc truyền trực tiếp mã định danh terminal thông qua các lệnh gọi công cụ.                                                                                                                                                  |

## Các giới hạn đã biết

- `loadSession` chỉ phát lại toàn bộ lịch sử sổ cái sự kiện ACP cho các phiên do cầu nối tạo. Các phiên cũ/không có sổ cái sử dụng phương án dự phòng bằng bản ghi hội thoại và không tái dựng các lệnh gọi công cụ hoặc thông báo hệ thống trong quá khứ.
- Nếu nhiều máy khách ACP dùng chung một khóa phiên Gateway, việc định tuyến sự kiện và lệnh hủy chỉ được thực hiện theo khả năng tốt nhất thay vì cách ly nghiêm ngặt theo từng máy khách. Nên dùng các phiên `acp-bridge:<uuid>` được cách ly mặc định khi bạn cần các lượt cục bộ trong trình soạn thảo rõ ràng.
- Trạng thái dừng của Gateway được chuyển thành lý do dừng ACP, nhưng ánh xạ đó ít biểu đạt hơn một môi trường thời gian chạy thuần ACP đầy đủ.
- Điều khiển phiên cung cấp một tập con tập trung của các nút điều chỉnh Gateway: mức độ suy nghĩ, độ chi tiết của công cụ, suy luận, chi tiết mức sử dụng và hành động đặc quyền. Lựa chọn mô hình và điều khiển máy chủ thực thi không được cung cấp dưới dạng tùy chọn cấu hình ACP.
- `session_info_update` và `usage_update` được suy ra từ ảnh chụp nhanh phiên Gateway, không phải dữ liệu tính toán thời gian chạy thuần ACP trực tiếp. Mức sử dụng chỉ là xấp xỉ, không chứa dữ liệu chi phí và chỉ được phát khi Gateway đánh dấu dữ liệu tổng số token là mới.
- Dữ liệu theo dõi công cụ được cung cấp theo khả năng tốt nhất: cầu nối hiển thị các đường dẫn tệp xuất hiện trong những đối số/kết quả công cụ đã biết, nhưng không phát terminal ACP hoặc diff tệp có cấu trúc.
- Việc chuyển tiếp phê duyệt thực thi chỉ giới hạn trong lượt lời nhắc ACP đang hoạt động; các phê duyệt từ phiên Gateway khác sẽ bị bỏ qua.

## Cách dùng

```bash
openclaw acp

# Gateway từ xa
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway từ xa (token từ tệp)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gắn vào một khóa phiên hiện có
openclaw acp --session agent:main:main

# Gắn theo nhãn (phải tồn tại sẵn)
openclaw acp --session-label "support inbox"

# Đặt lại khóa phiên trước lời nhắc đầu tiên
openclaw acp --session agent:main:main --reset-session
```

## Máy khách ACP (gỡ lỗi)

Dùng máy khách ACP tích hợp sẵn để kiểm tra nhanh cầu nối mà không cần IDE. Nó tạo tiến trình cầu nối ACP và cho phép bạn nhập lời nhắc theo cách tương tác.

```bash
openclaw acp client

# Trỏ cầu nối được tạo đến một Gateway từ xa
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Ghi đè lệnh máy chủ (mặc định: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Mô hình quyền (chế độ gỡ lỗi máy khách):

- Phê duyệt tự động dựa trên danh sách cho phép và chỉ áp dụng cho mã định danh công cụ cốt lõi đáng tin cậy.
- Phê duyệt tự động cho `read` được giới hạn trong thư mục làm việc hiện tại (`--cwd` khi được đặt).
- ACP chỉ tự động phê duyệt các lớp chỉ đọc hẹp: các lệnh gọi `read` trong phạm vi `cwd` đang hoạt động, cùng với các công cụ tìm kiếm chỉ đọc (`search`, `web_search`, `memory_search`). Công cụ không xác định/không thuộc lõi, thao tác đọc ngoài phạm vi, công cụ có khả năng thực thi, công cụ mặt phẳng điều khiển, công cụ thay đổi dữ liệu và luồng tương tác luôn yêu cầu phê duyệt lời nhắc rõ ràng.
- `toolCall.kind` do máy chủ cung cấp được xem là siêu dữ liệu không đáng tin cậy, không phải nguồn cấp quyền.
- Chính sách cầu nối ACP này tách biệt với quyền của bộ khung ACPX. Nếu bạn chạy OpenClaw thông qua phần phụ trợ `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` là công tắc khẩn cấp "yolo" cho phiên bộ khung đó.

## Kiểm thử nhanh giao thức

Để gỡ lỗi ở cấp giao thức, hãy khởi động một Gateway với trạng thái cách ly và điều khiển `openclaw acp` qua stdio bằng một máy khách ACP JSON-RPC. Bao quát `initialize`, `session/new`, `session/list` với `cwd` tuyệt đối, `session/resume`, `session/close`, đóng trùng lặp và tiếp tục phiên không tồn tại.

Bằng chứng cần bao gồm các khả năng vòng đời được công bố, một hàng phiên dựa trên Gateway, thông báo cập nhật và nhật ký `sessions.list` của Gateway:

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

Tránh dùng `openclaw gateway call sessions.list` làm bằng chứng ACP duy nhất. Đường dẫn CLI đó có thể yêu cầu nâng cấp phạm vi người vận hành bằng token mới; tính đúng đắn của cầu nối ACP được chứng minh bằng các khung ACP qua stdio cùng với nhật ký `sessions.list` của Gateway.

## Cách sử dụng tính năng này

Dùng ACP khi một IDE (hoặc máy khách khác) giao tiếp bằng Agent Client Protocol và bạn muốn nó điều khiển một phiên Gateway OpenClaw.

1. Đảm bảo Gateway đang chạy (cục bộ hoặc từ xa).
2. Cấu hình đích Gateway (bằng cấu hình hoặc cờ).
3. Trỏ IDE của bạn để chạy `openclaw acp` qua stdio.

Ví dụ cấu hình (được lưu lâu dài):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Ví dụ chạy trực tiếp (không ghi cấu hình):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# được ưu tiên để bảo đảm an toàn cho tiến trình cục bộ
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Chọn tác nhân

ACP không trực tiếp chọn tác nhân. Nó định tuyến theo khóa phiên Gateway. Dùng khóa phiên theo phạm vi tác nhân để nhắm đến một tác nhân cụ thể:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Mỗi phiên ACP ánh xạ đến một khóa phiên Gateway duy nhất. Một tác nhân có thể có nhiều phiên; ACP mặc định dùng phiên `acp-bridge:<uuid>` được cách ly, trừ khi bạn ghi đè khóa hoặc nhãn.

`mcpServers` theo từng phiên không được hỗ trợ trong chế độ cầu nối. Nếu một máy khách ACP gửi chúng trong `newSession` hoặc `loadSession`, cầu nối sẽ trả về lỗi rõ ràng thay vì âm thầm bỏ qua.

Nếu bạn muốn các phiên sử dụng ACPX có thể truy cập công cụ Plugin của OpenClaw hoặc các công cụ tích hợp sẵn được chọn như `cron`, hãy bật các cầu nối ACPX MCP phía Gateway thay vì cố truyền `mcpServers` theo từng phiên. Xem [Tác nhân ACP](/vi/tools/acp-agents-setup#plugin-tools-mcp-bridge) và [Cầu nối MCP cho công cụ OpenClaw](/vi/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Sử dụng từ `acpx` (Codex, Claude và các máy khách ACP khác)

Nếu bạn muốn một tác nhân lập trình như Codex hoặc Claude Code giao tiếp với bot OpenClaw của mình qua ACP, hãy sử dụng `acpx` cùng đích `openclaw` tích hợp sẵn.

Quy trình điển hình:

1. Chạy Gateway và bảo đảm cầu nối ACP có thể kết nối tới Gateway.
2. Trỏ `acpx openclaw` tới `openclaw acp`.
3. Chọn khóa phiên OpenClaw mà bạn muốn tác nhân lập trình sử dụng.

Ví dụ:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Nếu bạn muốn `acpx openclaw` luôn nhắm tới một Gateway và khóa phiên cụ thể, hãy ghi đè lệnh tác nhân `openclaw` trong `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Đối với bản mã nguồn OpenClaw cục bộ trong kho lưu trữ, hãy sử dụng trực tiếp điểm vào CLI thay vì trình chạy phát triển để luồng ACP không bị lẫn nội dung ngoài ý muốn:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Đây là cách dễ nhất để Codex, Claude Code hoặc một máy khách khác hỗ trợ ACP lấy thông tin ngữ cảnh từ tác nhân OpenClaw mà không cần thu thập dữ liệu từ cửa sổ dòng lệnh.

## Thiết lập trình soạn thảo Zed

Thêm một tác nhân ACP tùy chỉnh vào `~/.config/zed/settings.json` (hoặc sử dụng giao diện Settings của Zed):

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

Trong Zed, mở bảng Agent và chọn "OpenClaw ACP" để bắt đầu một luồng hội thoại.

## Ánh xạ phiên

Theo mặc định, các phiên cầu nối ACP nhận một khóa phiên Gateway biệt lập có tiền tố `acp-bridge:`. Các phiên cầu nối dùng mô hình thông thường này là phiên tổng hợp và có thể loại bỏ: chúng chịu quy trình dọn dẹp mục cũ và không được xem là bề mặt hội thoại với con người cần bảo vệ. Để sử dụng lại một phiên đã biết, hãy truyền khóa hoặc nhãn phiên:

- `--session <key>`: sử dụng một khóa phiên Gateway cụ thể.
- `--session-label <label>`: phân giải một phiên hiện có theo nhãn.
- `--reset-session`: tạo mã định danh phiên mới cho khóa đó (cùng khóa, bản ghi hội thoại mới).

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

- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` khi đã cấu hình).
- `--token <token>`: token xác thực Gateway.
- `--token-file <path>`: đọc token xác thực Gateway từ tệp.
- `--password <password>`: mật khẩu xác thực Gateway.
- `--password-file <path>`: đọc mật khẩu xác thực Gateway từ tệp.
- `--session <key>`: khóa phiên mặc định.
- `--session-label <label>`: nhãn phiên mặc định cần phân giải.
- `--require-existing`: báo lỗi nếu khóa/nhãn phiên không tồn tại.
- `--reset-session`: đặt lại khóa phiên trước lần sử dụng đầu tiên.
- `--no-prefix-cwd`: không thêm thư mục làm việc vào đầu lời nhắc.
- `--provenance <off|meta|meta+receipt>`: bao gồm siêu dữ liệu hoặc biên nhận nguồn gốc ACP.
- `--verbose, -v`: ghi nhật ký chi tiết vào stderr.

Lưu ý bảo mật:

- `--token` và `--password` có thể hiển thị trong danh sách tiến trình cục bộ trên một số hệ thống. Nên dùng `--token-file`/`--password-file` hoặc các biến môi trường (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Việc phân giải thông tin xác thực Gateway tuân theo hợp đồng dùng chung của các máy khách Gateway khác:
  - chế độ cục bộ: biến môi trường (`OPENCLAW_GATEWAY_*`), sau đó là `gateway.auth.*`; chỉ dự phòng sang `gateway.remote.*` khi chưa đặt `gateway.auth.*` (một SecretRef cục bộ đã cấu hình nhưng không phân giải được sẽ từ chối an toàn thay vì âm thầm dùng phương án dự phòng)
  - chế độ từ xa: `gateway.remote.*` với cơ chế dự phòng biến môi trường/cấu hình theo các quy tắc ưu tiên từ xa
  - `--url` là tùy chọn ghi đè an toàn và không tái sử dụng ngầm thông tin xác thực từ cấu hình/biến môi trường; hãy truyền rõ `--token`/`--password` (hoặc các biến thể dùng tệp)

### Tùy chọn của `acp client`

- `--cwd <dir>`: thư mục làm việc cho phiên ACP.
- `--server <command>`: lệnh máy chủ ACP (mặc định: `openclaw`).
- `--server-args <args...>`: các đối số bổ sung được truyền cho máy chủ ACP.
- `--server-verbose`: bật ghi nhật ký chi tiết trên máy chủ ACP.
- `--verbose, -v`: ghi nhật ký máy khách chi tiết.
- `openclaw acp client` đặt `OPENCLAW_SHELL=acp-client` trên tiến trình cầu nối được khởi chạy; có thể sử dụng giá trị này cho các quy tắc shell/hồ sơ dành riêng cho ngữ cảnh.

## Nội dung liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
- [Tác nhân ACP](/vi/tools/acp-agents)
