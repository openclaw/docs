---
read_when:
    - Kết nối Codex, Claude Code hoặc một ứng dụng khách MCP khác với các kênh được OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Cung cấp các cuộc hội thoại kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:41:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai nhiệm vụ:

- chạy OpenClaw dưới dạng máy chủ MCP với `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP outbound do OpenClaw sở hữu bằng `list`, `show`, `set`, và `unset`

Nói cách khác:

- `serve` là OpenClaw hoạt động như một máy chủ MCP
- `list` / `show` / `set` / `unset` là OpenClaw hoạt động như một registry phía máy khách MCP cho các máy chủ MCP khác mà các runtime của nó có thể dùng về sau

Dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự host một phiên coding harness và định tuyến runtime đó qua ACP.

## OpenClaw dưới dạng máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào dùng `serve`

Dùng `openclaw mcp serve` khi:

- Codex, Claude Code, hoặc một máy khách MCP khác cần nói chuyện trực tiếp với các cuộc hội thoại kênh được OpenClaw hỗ trợ
- bạn đã có một OpenClaw Gateway cục bộ hoặc từ xa với các phiên đã định tuyến
- bạn muốn một máy chủ MCP hoạt động trên các backend kênh của OpenClaw thay vì chạy các bridge riêng cho từng kênh

Thay vào đó, dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự host coding runtime và giữ phiên agent bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Khi máy khách giữ phiên stdio mở, bridge kết nối tới OpenClaw Gateway cục bộ hoặc từ xa qua WebSocket và cung cấp các cuộc hội thoại kênh đã định tuyến qua MCP.

<Steps>
  <Step title="Client spawns the bridge">
    Máy khách MCP tạo `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Bridge kết nối tới OpenClaw Gateway qua WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Các phiên đã định tuyến trở thành cuộc hội thoại MCP và công cụ transcript/lịch sử.
  </Step>
  <Step title="Live events queue">
    Sự kiện trực tiếp được xếp hàng trong bộ nhớ khi bridge đang kết nối.
  </Step>
  <Step title="Optional Claude push">
    Nếu chế độ kênh Claude được bật, cùng phiên đó cũng có thể nhận thông báo đẩy riêng cho Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - trạng thái hàng đợi trực tiếp bắt đầu khi bridge kết nối
    - lịch sử transcript cũ hơn được đọc bằng `messages_read`
    - thông báo đẩy Claude chỉ tồn tại khi phiên MCP còn sống
    - khi máy khách ngắt kết nối, bridge thoát và hàng đợi trực tiếp biến mất
    - các điểm vào agent một lần như `openclaw agent` và `openclaw infer model run` sẽ dừng mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, nên các lần chạy script lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy, dù đi kèm hay do người dùng cấu hình, được gỡ xuống như một cây tiến trình khi tắt, nên các tiến trình con do máy chủ khởi động không tồn tại sau khi máy khách stdio cha thoát
    - việc xóa hoặc đặt lại một phiên sẽ giải phóng các máy khách MCP của phiên đó thông qua đường dọn dẹp runtime dùng chung, nên không còn kết nối stdio treo gắn với phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

Dùng cùng bridge theo hai cách khác nhau:

<Tabs>
  <Tab title="Generic MCP clients">
    Chỉ các công cụ MCP tiêu chuẩn. Dùng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, và các công cụ phê duyệt.
  </Tab>
  <Tab title="Claude Code">
    Các công cụ MCP tiêu chuẩn cộng với adapter kênh riêng cho Claude. Bật `--claude-channel-mode on` hoặc để mặc định `auto`.
  </Tab>
</Tabs>

<Note>
Hiện nay, `auto` hoạt động giống `on`. Chưa có phát hiện năng lực máy khách.
</Note>

### `serve` cung cấp những gì

Bridge dùng metadata định tuyến phiên Gateway hiện có để cung cấp các cuộc hội thoại được kênh hỗ trợ. Một cuộc hội thoại xuất hiện khi OpenClaw đã có trạng thái phiên với một route đã biết như:

- `channel`
- metadata người nhận hoặc đích
- `accountId` tùy chọn
- `threadId` tùy chọn

Điều này cho máy khách MCP một nơi để:

- liệt kê các cuộc hội thoại đã định tuyến gần đây
- đọc lịch sử transcript gần đây
- chờ sự kiện inbound mới
- gửi phản hồi lại qua cùng route
- xem các yêu cầu phê duyệt đến khi bridge đang kết nối

### Cách dùng

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Công cụ bridge

Bridge hiện tại cung cấp các công cụ MCP sau:

<AccordionGroup>
  <Accordion title="conversations_list">
    Liệt kê các cuộc hội thoại gần đây được phiên hỗ trợ và đã có metadata route trong trạng thái phiên Gateway.

    Bộ lọc hữu ích:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Trả về một cuộc hội thoại theo `session_key` bằng tra cứu phiên Gateway trực tiếp.
  </Accordion>
  <Accordion title="messages_read">
    Đọc các tin nhắn transcript gần đây cho một cuộc hội thoại được phiên hỗ trợ.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung tin nhắn không phải văn bản từ một tin nhắn transcript. Đây là chế độ xem metadata trên nội dung transcript, không phải kho blob tệp đính kèm bền vững độc lập.
  </Accordion>
  <Accordion title="events_poll">
    Đọc các sự kiện trực tiếp đã xếp hàng kể từ một con trỏ dạng số.
  </Accordion>
  <Accordion title="events_wait">
    Long-poll cho đến khi sự kiện đã xếp hàng khớp tiếp theo đến hoặc hết thời gian chờ.

    Dùng tính năng này khi một máy khách MCP chung cần giao gần thời gian thực mà không cần giao thức đẩy riêng cho Claude.

  </Accordion>
  <Accordion title="messages_send">
    Gửi văn bản trở lại qua cùng route đã được ghi trên phiên.

    Hành vi hiện tại:

    - yêu cầu một route cuộc hội thoại hiện có
    - dùng kênh, người nhận, id tài khoản, và id thread của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt exec/plugin đang chờ mà bridge đã quan sát kể từ khi nó kết nối tới Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt exec/plugin đang chờ với:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Mô hình sự kiện

Bridge giữ một hàng đợi sự kiện trong bộ nhớ khi đang kết nối.

Các loại sự kiện hiện tại:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- hàng đợi chỉ dành cho trực tiếp; nó bắt đầu khi bridge MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- backlog bền vững nên được đọc bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Bridge cũng có thể cung cấp thông báo kênh riêng cho Claude. Đây là tương đương của OpenClaw với adapter kênh Claude Code: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng tin nhắn inbound trực tiếp cũng có thể đến dưới dạng thông báo MCP riêng cho Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: chỉ các công cụ MCP tiêu chuẩn.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: bật thông báo kênh Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: mặc định hiện tại; hành vi bridge giống như `on`.
  </Tab>
</Tabs>

Khi chế độ kênh Claude được bật, máy chủ quảng bá các capability thử nghiệm của Claude và có thể phát:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Hành vi bridge hiện tại:

- các tin nhắn transcript inbound `user` được chuyển tiếp dưới dạng `notifications/claude/channel`
- các yêu cầu quyền Claude nhận qua MCP được theo dõi trong bộ nhớ
- nếu cuộc hội thoại được liên kết sau đó gửi `yes abcde` hoặc `no abcde`, bridge chuyển đổi nội dung đó thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối, sẽ không có đích đẩy

Điều này cố ý dành riêng cho máy khách. Các máy khách MCP chung nên dựa vào các công cụ polling tiêu chuẩn.

### Cấu hình máy khách MCP

Ví dụ cấu hình máy khách stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Với hầu hết máy khách MCP chung, hãy bắt đầu với bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu các phương thức thông báo riêng cho Claude.

### Tùy chọn

`openclaw mcp serve` hỗ trợ:

<ParamField path="--url" type="string">
  URL WebSocket của Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Đọc token từ tệp.
</ParamField>
<ParamField path="--password" type="string">
  Mật khẩu Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Đọc mật khẩu từ tệp.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Chế độ thông báo Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Nhật ký chi tiết trên stderr.
</ParamField>

<Tip>
Ưu tiên `--token-file` hoặc `--password-file` thay vì bí mật nội tuyến khi có thể.
</Tip>

### Bảo mật và ranh giới tin cậy

Bridge không tự tạo định tuyến. Nó chỉ cung cấp các cuộc hội thoại mà Gateway đã biết cách định tuyến.

Điều đó có nghĩa là:

- danh sách cho phép người gửi, pairing, và độ tin cậy cấp kênh vẫn thuộc về cấu hình kênh OpenClaw nền bên dưới
- `messages_send` chỉ có thể trả lời qua một route đã lưu hiện có
- trạng thái phê duyệt chỉ là trực tiếp/trong bộ nhớ cho phiên bridge hiện tại
- xác thực bridge nên dùng cùng các kiểm soát token hoặc mật khẩu Gateway mà bạn sẽ tin cậy cho bất kỳ máy khách Gateway từ xa nào khác

Nếu một cuộc hội thoại thiếu trong `conversations_list`, nguyên nhân thường không phải là cấu hình MCP. Đó là metadata route bị thiếu hoặc chưa hoàn chỉnh trong phiên Gateway nền bên dưới.

### Kiểm thử

OpenClaw cung cấp một smoke Docker xác định cho bridge này:

```bash
pnpm test:docker:mcp-channels
```

Smoke đó:

- khởi động một container Gateway đã seed
- khởi động một container thứ hai tạo `openclaw mcp serve`
- xác minh phát hiện cuộc hội thoại, đọc transcript, đọc metadata tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, và định tuyến gửi outbound
- xác thực thông báo kênh kiểu Claude và thông báo quyền qua bridge MCP stdio thật

Đây là cách nhanh nhất để chứng minh bridge hoạt động mà không cần nối tài khoản Telegram, Discord, hoặc iMessage thật vào lần chạy kiểm thử.

Để biết ngữ cảnh kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="No conversations returned">
    Thường có nghĩa là phiên Gateway chưa thể định tuyến. Xác nhận rằng phiên nền bên dưới đã lưu metadata route kênh/provider, người nhận, và tài khoản/thread tùy chọn.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Đúng như dự kiến. Hàng đợi trực tiếp bắt đầu khi bridge kết nối. Đọc lịch sử transcript cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Kiểm tra tất cả các mục sau:

    - máy khách đã giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - máy khách thực sự hiểu các phương thức thông báo riêng cho Claude
    - tin nhắn inbound xảy ra sau khi bridge kết nối

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát khi bridge đang kết nối. Nó không phải là API lịch sử phê duyệt bền vững.
  </Accordion>
</AccordionGroup>

## OpenClaw dưới dạng registry máy khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `set` và `unset`.

Các lệnh này không phơi bày OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP do OpenClaw sở hữu trong `mcp.servers` thuộc cấu hình OpenClaw.

Các định nghĩa đã lưu đó dành cho những runtime mà OpenClaw khởi chạy hoặc cấu hình sau này, chẳng hạn như Pi nhúng và các bộ chuyển đổi runtime khác. OpenClaw lưu trữ các định nghĩa tập trung để các runtime đó không cần duy trì danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - chúng không kết nối tới máy chủ MCP đích
    - chúng không xác thực liệu lệnh, URL hoặc transport từ xa có thể truy cập được ngay lúc này hay không
    - các bộ chuyển đổi runtime quyết định những dạng transport nào chúng thực sự hỗ trợ tại thời điểm thực thi
    - Pi nhúng phơi bày các công cụ MCP đã cấu hình trong hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng, và `tools.deny: ["bundle-mcp"]` vô hiệu hóa chúng một cách tường minh
    - các runtime MCP đóng gói theo phạm vi phiên được thu hồi sau `mcp.sessionIdleTtlMs` mili giây ở trạng thái nhàn rỗi (mặc định 10 phút; đặt `0` để vô hiệu hóa) và các lần chạy nhúng một lượt sẽ dọn dẹp chúng khi kết thúc lượt chạy

  </Accordion>
</AccordionGroup>

Các bộ chuyển đổi runtime có thể chuẩn hóa registry dùng chung này thành dạng mà client hạ nguồn của chúng kỳ vọng. Ví dụ, Pi nhúng tiêu thụ trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` gốc của CLI như `http`, `sse` hoặc `stdio`.

### Định nghĩa máy chủ MCP đã lưu

OpenClaw cũng lưu một registry máy chủ MCP gọn nhẹ trong cấu hình cho các bề mặt muốn dùng định nghĩa MCP do OpenClaw quản lý.

Lệnh:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Ghi chú:

- `list` sắp xếp tên máy chủ.
- `show` không có tên sẽ in toàn bộ đối tượng máy chủ MCP đã cấu hình.
- `set` kỳ vọng một giá trị đối tượng JSON trên dòng lệnh.
- Dùng `transport: "streamable-http"` cho máy chủ MCP Streamable HTTP. `openclaw mcp set` cũng chuẩn hóa `type: "http"` gốc của CLI sang cùng dạng cấu hình chuẩn để tương thích.
- `unset` thất bại nếu máy chủ được đặt tên không tồn tại.

Ví dụ:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

Ví dụ về dạng cấu hình:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Transport Stdio

Khởi chạy một tiến trình con cục bộ và giao tiếp qua stdin/stdout.

| Trường                     | Mô tả                                       |
| -------------------------- | ------------------------------------------ |
| `command`                  | Tệp thực thi để sinh tiến trình (bắt buộc) |
| `args`                     | Mảng đối số dòng lệnh                      |
| `env`                      | Biến môi trường bổ sung                    |
| `cwd` / `workingDirectory` | Thư mục làm việc cho tiến trình            |

<Warning>
**Bộ lọc an toàn env của Stdio**

OpenClaw từ chối các khóa env khởi động trình thông dịch có thể thay đổi cách máy chủ MCP stdio khởi động trước RPC đầu tiên, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Các khóa bị chặn bao gồm `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` và những biến điều khiển runtime tương tự. Quá trình khởi động từ chối chúng bằng lỗi cấu hình để chúng không thể chèn phần mở đầu ngầm định, thay trình thông dịch hoặc bật trình gỡ lỗi đối với tiến trình stdio. Các biến env thông thường dành cho thông tin xác thực, proxy và máy chủ cụ thể (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.) không bị ảnh hưởng.

Nếu máy chủ MCP của bạn thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì trong `env` của máy chủ stdio.
</Warning>

### Transport SSE / HTTP

Kết nối tới máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                | Mô tả                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| `url`                 | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                        |
| `headers`             | Ánh xạ khóa-giá trị tùy chọn của HTTP header (ví dụ token xác thực)     |
| `connectionTimeoutMs` | Thời gian chờ kết nối theo từng máy chủ, tính bằng ms (tùy chọn)        |

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Các giá trị nhạy cảm trong `url` (userinfo) và `headers` được che trong nhật ký và đầu ra trạng thái.

### Transport Streamable HTTP

`streamable-http` là một tùy chọn transport bổ sung bên cạnh `sse` và `stdio`. Nó dùng truyền phát HTTP để giao tiếp hai chiều với máy chủ MCP từ xa.

| Trường                | Mô tả                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                                               |
| `transport`           | Đặt thành `"streamable-http"` để chọn transport này; khi bỏ qua, OpenClaw dùng `sse`                            |
| `headers`             | Ánh xạ khóa-giá trị tùy chọn của HTTP header (ví dụ token xác thực)                                             |
| `connectionTimeoutMs` | Thời gian chờ kết nối theo từng máy chủ, tính bằng ms (tùy chọn)                                                |

Cấu hình OpenClaw dùng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị `type: "http"` MCP gốc của CLI được chấp nhận khi lưu qua `openclaw mcp set` và được `openclaw doctor --fix` sửa trong cấu hình hiện có, nhưng `transport` là giá trị mà Pi nhúng tiêu thụ trực tiếp.

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Các lệnh này chỉ quản lý cấu hình đã lưu. Chúng không khởi động cầu nối kênh, mở phiên client MCP trực tiếp hoặc chứng minh máy chủ đích có thể truy cập được.
</Note>

## Giới hạn hiện tại

Trang này ghi lại cầu nối như được phát hành hiện nay.

Giới hạn hiện tại:

- việc khám phá cuộc trò chuyện phụ thuộc vào siêu dữ liệu định tuyến phiên Gateway hiện có
- chưa có giao thức đẩy chung ngoài bộ chuyển đổi dành riêng cho Claude
- chưa có công cụ chỉnh sửa tin nhắn hoặc react
- transport HTTP/SSE/streamable-http kết nối tới một máy chủ từ xa duy nhất; chưa có upstream ghép kênh
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát khi cầu nối đang kết nối

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Plugins](/vi/cli/plugins)
