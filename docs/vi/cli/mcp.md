---
read_when:
    - Kết nối Codex, Claude Code hoặc máy khách MCP khác với các kênh do OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Cung cấp các cuộc trò chuyện trên kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-04-29T22:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai nhiệm vụ:

- chạy OpenClaw như một máy chủ MCP bằng `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP đi ra do OpenClaw sở hữu bằng `list`, `show`, `set` và `unset`

Nói cách khác:

- `serve` là OpenClaw hoạt động như một máy chủ MCP
- `list` / `show` / `set` / `unset` là OpenClaw hoạt động như một sổ đăng ký phía máy khách MCP cho các máy chủ MCP khác mà runtime của nó có thể dùng sau này

Dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw nên tự lưu trữ một phiên harness lập trình và định tuyến runtime đó qua ACP.

## OpenClaw như một máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào dùng `serve`

Dùng `openclaw mcp serve` khi:

- Codex, Claude Code hoặc một máy khách MCP khác cần trao đổi trực tiếp với các cuộc trò chuyện kênh được OpenClaw hỗ trợ
- bạn đã có một OpenClaw Gateway cục bộ hoặc từ xa với các phiên đã được định tuyến
- bạn muốn một máy chủ MCP hoạt động trên các backend kênh của OpenClaw thay vì chạy các cầu nối riêng cho từng kênh

Thay vào đó, dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw nên tự lưu trữ runtime lập trình và giữ phiên agent bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Trong khi máy khách giữ phiên stdio mở, cầu nối kết nối tới OpenClaw Gateway cục bộ hoặc từ xa qua WebSocket và cung cấp các cuộc trò chuyện kênh đã định tuyến qua MCP.

<Steps>
  <Step title="Client spawns the bridge">
    Máy khách MCP sinh `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Cầu nối kết nối tới OpenClaw Gateway qua WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Các phiên đã định tuyến trở thành cuộc trò chuyện MCP và công cụ bản ghi/lịch sử.
  </Step>
  <Step title="Live events queue">
    Sự kiện trực tiếp được xếp hàng trong bộ nhớ khi cầu nối đang kết nối.
  </Step>
  <Step title="Optional Claude push">
    Nếu chế độ kênh Claude được bật, cùng phiên đó cũng có thể nhận thông báo đẩy dành riêng cho Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - trạng thái hàng đợi trực tiếp bắt đầu khi cầu nối kết nối
    - lịch sử bản ghi cũ hơn được đọc bằng `messages_read`
    - thông báo đẩy Claude chỉ tồn tại khi phiên MCP còn sống
    - khi máy khách ngắt kết nối, cầu nối thoát và hàng đợi trực tiếp biến mất
    - các điểm vào agent chạy một lần như `openclaw agent` và `openclaw infer model run` sẽ kết thúc mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, nên các lần chạy script lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy (đi kèm hoặc do người dùng cấu hình) được dọn như một cây tiến trình khi tắt, nên các tiến trình con do máy chủ khởi động sẽ không còn tồn tại sau khi máy khách stdio cha thoát
    - xóa hoặc đặt lại một phiên sẽ hủy các máy khách MCP của phiên đó qua đường dọn dẹp runtime dùng chung, nên không có kết nối stdio tồn đọng gắn với phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

Dùng cùng cầu nối theo hai cách khác nhau:

<Tabs>
  <Tab title="Generic MCP clients">
    Chỉ các công cụ MCP tiêu chuẩn. Dùng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` và các công cụ phê duyệt.
  </Tab>
  <Tab title="Claude Code">
    Các công cụ MCP tiêu chuẩn cộng với bộ chuyển đổi kênh dành riêng cho Claude. Bật `--claude-channel-mode on` hoặc giữ mặc định `auto`.
  </Tab>
</Tabs>

<Note>
Hiện tại, `auto` hoạt động giống `on`. Chưa có phát hiện năng lực máy khách.
</Note>

### `serve` cung cấp gì

Cầu nối dùng metadata tuyến phiên hiện có của Gateway để cung cấp các cuộc trò chuyện dựa trên kênh. Một cuộc trò chuyện xuất hiện khi OpenClaw đã có trạng thái phiên với một tuyến đã biết như:

- `channel`
- metadata người nhận hoặc đích
- `accountId` tùy chọn
- `threadId` tùy chọn

Điều này cho máy khách MCP một nơi để:

- liệt kê các cuộc trò chuyện đã định tuyến gần đây
- đọc lịch sử bản ghi gần đây
- chờ sự kiện đến mới
- gửi phản hồi trở lại qua cùng tuyến
- xem yêu cầu phê duyệt đến trong khi cầu nối đang kết nối

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

### Công cụ cầu nối

Cầu nối hiện tại cung cấp các công cụ MCP này:

<AccordionGroup>
  <Accordion title="conversations_list">
    Liệt kê các cuộc trò chuyện gần đây dựa trên phiên đã có metadata tuyến trong trạng thái phiên Gateway.

    Bộ lọc hữu ích:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Trả về một cuộc trò chuyện theo `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Đọc các tin nhắn bản ghi gần đây cho một cuộc trò chuyện dựa trên phiên.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung tin nhắn không phải văn bản từ một tin nhắn bản ghi. Đây là dạng xem metadata trên nội dung bản ghi, không phải kho blob tệp đính kèm bền vững độc lập.
  </Accordion>
  <Accordion title="events_poll">
    Đọc các sự kiện trực tiếp đã xếp hàng kể từ một con trỏ số.
  </Accordion>
  <Accordion title="events_wait">
    Long-poll cho đến khi sự kiện đã xếp hàng khớp tiếp theo đến hoặc hết thời gian chờ.

    Dùng mục này khi một máy khách MCP chung cần phân phối gần thời gian thực mà không có giao thức đẩy dành riêng cho Claude.

  </Accordion>
  <Accordion title="messages_send">
    Gửi văn bản trở lại qua cùng tuyến đã được ghi trên phiên.

    Hành vi hiện tại:

    - yêu cầu một tuyến cuộc trò chuyện hiện có
    - dùng kênh, người nhận, id tài khoản và id luồng của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt exec/Plugin đang chờ mà cầu nối đã quan sát kể từ khi kết nối tới Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt exec/Plugin đang chờ bằng:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Mô hình sự kiện

Cầu nối giữ một hàng đợi sự kiện trong bộ nhớ khi đang kết nối.

Các loại sự kiện hiện tại:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- hàng đợi chỉ trực tiếp; nó bắt đầu khi cầu nối MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- backlog bền vững nên được đọc bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Cầu nối cũng có thể cung cấp thông báo kênh dành riêng cho Claude. Đây là phần tương đương trong OpenClaw của bộ chuyển đổi kênh Claude Code: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng tin nhắn đến trực tiếp cũng có thể đến dưới dạng thông báo MCP dành riêng cho Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: chỉ các công cụ MCP tiêu chuẩn.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: bật thông báo kênh Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: mặc định hiện tại; hành vi cầu nối giống `on`.
  </Tab>
</Tabs>

Khi chế độ kênh Claude được bật, máy chủ quảng bá các năng lực thử nghiệm của Claude và có thể phát:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Hành vi cầu nối hiện tại:

- các tin nhắn bản ghi `user` đến được chuyển tiếp dưới dạng `notifications/claude/channel`
- các yêu cầu quyền Claude nhận qua MCP được theo dõi trong bộ nhớ
- nếu cuộc trò chuyện liên kết sau đó gửi `yes abcde` hoặc `no abcde`, cầu nối chuyển đổi thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối, không có đích đẩy

Điều này có chủ đích dành riêng cho máy khách. Máy khách MCP chung nên dựa vào các công cụ polling tiêu chuẩn.

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

Với hầu hết máy khách MCP chung, hãy bắt đầu bằng bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude.

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

Cầu nối không tự tạo định tuyến. Nó chỉ cung cấp các cuộc trò chuyện mà Gateway đã biết cách định tuyến.

Điều đó nghĩa là:

- danh sách cho phép người gửi, ghép cặp và mức tin cậy cấp kênh vẫn thuộc về cấu hình kênh OpenClaw bên dưới
- `messages_send` chỉ có thể phản hồi qua một tuyến đã lưu hiện có
- trạng thái phê duyệt chỉ trực tiếp/trong bộ nhớ cho phiên cầu nối hiện tại
- xác thực cầu nối nên dùng cùng token hoặc mật khẩu Gateway mà bạn sẽ tin cậy cho bất kỳ máy khách Gateway từ xa nào khác

Nếu một cuộc trò chuyện bị thiếu trong `conversations_list`, nguyên nhân thường không phải cấu hình MCP. Đó là metadata tuyến bị thiếu hoặc chưa đầy đủ trong phiên Gateway bên dưới.

### Kiểm thử

OpenClaw cung cấp một smoke Docker xác định cho cầu nối này:

```bash
pnpm test:docker:mcp-channels
```

Smoke đó:

- khởi động một container Gateway đã gieo dữ liệu
- khởi động container thứ hai sinh `openclaw mcp serve`
- xác minh phát hiện cuộc trò chuyện, đọc bản ghi, đọc metadata tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp và định tuyến gửi đi
- xác thực thông báo kênh và quyền kiểu Claude qua cầu nối MCP stdio thật

Đây là cách nhanh nhất để chứng minh cầu nối hoạt động mà không cần nối tài khoản Telegram, Discord hoặc iMessage thật vào lần chạy kiểm thử.

Để biết ngữ cảnh kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="No conversations returned">
    Thường nghĩa là phiên Gateway chưa thể định tuyến. Xác nhận rằng phiên bên dưới có metadata tuyến kênh/nhà cung cấp, người nhận và tài khoản/luồng tùy chọn đã lưu.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Đúng như thiết kế. Hàng đợi trực tiếp bắt đầu khi cầu nối kết nối. Đọc lịch sử bản ghi cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Kiểm tra tất cả mục sau:

    - máy khách đã giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude
    - tin nhắn đến xảy ra sau khi cầu nối kết nối

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát trong khi cầu nối đang kết nối. Đây không phải API lịch sử phê duyệt bền vững.
  </Accordion>
</AccordionGroup>

## OpenClaw như một sổ đăng ký máy khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `set` và `unset`.

Các lệnh này không cung cấp OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP thuộc sở hữu của OpenClaw dưới `mcp.servers` trong cấu hình OpenClaw.

Những định nghĩa đã lưu đó dành cho các runtime mà OpenClaw khởi chạy hoặc cấu hình sau này, chẳng hạn như Pi nhúng và các adapter runtime khác. OpenClaw lưu trữ các định nghĩa tập trung để các runtime đó không cần giữ danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - chúng không kết nối đến máy chủ MCP đích
    - chúng không xác thực xem lệnh, URL hoặc transport từ xa hiện có thể truy cập được hay không
    - adapter runtime quyết định những dạng transport nào chúng thực sự hỗ trợ tại thời điểm thực thi
    - Pi nhúng cung cấp các công cụ MCP đã cấu hình trong hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng, và `tools.deny: ["bundle-mcp"]` vô hiệu hóa chúng một cách tường minh
    - runtime MCP đóng gói theo phạm vi phiên được dọn dẹp sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10 phút; đặt `0` để vô hiệu hóa) và các lần chạy Pi nhúng một lần sẽ dọn dẹp chúng khi kết thúc lần chạy

  </Accordion>
</AccordionGroup>

Các adapter runtime có thể chuẩn hóa registry dùng chung này thành dạng mà client hạ nguồn của chúng mong đợi. Ví dụ, Pi nhúng dùng trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` nguyên bản của CLI như `http`, `sse` hoặc `stdio`.

### Định nghĩa máy chủ MCP đã lưu

OpenClaw cũng lưu một registry máy chủ MCP gọn nhẹ trong cấu hình cho các bề mặt muốn dùng định nghĩa MCP do OpenClaw quản lý.

Lệnh:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Ghi chú:

- `list` sắp xếp tên máy chủ.
- `show` không kèm tên sẽ in toàn bộ đối tượng máy chủ MCP đã cấu hình.
- `set` mong đợi một giá trị đối tượng JSON trên dòng lệnh.
- Dùng `transport: "streamable-http"` cho máy chủ MCP Streamable HTTP. `openclaw mcp set` cũng chuẩn hóa `type: "http"` nguyên bản của CLI thành cùng dạng cấu hình chuẩn để tương thích.
- `unset` thất bại nếu máy chủ được đặt tên không tồn tại.

Ví dụ:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

Ví dụ dạng cấu hình:

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

### Transport stdio

Khởi chạy một tiến trình con cục bộ và giao tiếp qua stdin/stdout.

| Trường                     | Mô tả                              |
| -------------------------- | ---------------------------------- |
| `command`                  | Tệp thực thi để tạo tiến trình (bắt buộc) |
| `args`                     | Mảng đối số dòng lệnh              |
| `env`                      | Biến môi trường bổ sung            |
| `cwd` / `workingDirectory` | Thư mục làm việc cho tiến trình    |

<Warning>
**Bộ lọc an toàn env của stdio**

OpenClaw từ chối các khóa env khởi động trình thông dịch có thể thay đổi cách máy chủ MCP stdio khởi động trước RPC đầu tiên, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Các khóa bị chặn bao gồm `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` và các biến điều khiển runtime tương tự. Quá trình khởi động từ chối chúng bằng lỗi cấu hình để chúng không thể chèn phần mở đầu ngầm định, thay trình thông dịch hoặc bật trình gỡ lỗi đối với tiến trình stdio. Các biến env thông thường dành cho thông tin xác thực, proxy và riêng máy chủ (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.) không bị ảnh hưởng.

Nếu máy chủ MCP của bạn thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì dưới `env` của máy chủ stdio.
</Warning>

### Transport SSE / HTTP

Kết nối đến máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                | Mô tả                                                          |
| --------------------- | -------------------------------------------------------------- |
| `url`                 | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)               |
| `headers`             | Bản đồ khóa-giá trị tùy chọn của header HTTP (ví dụ token xác thực) |
| `connectionTimeoutMs` | Thời gian chờ kết nối cho từng máy chủ tính bằng ms (tùy chọn) |

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

`streamable-http` là một tùy chọn transport bổ sung bên cạnh `sse` và `stdio`. Nó dùng HTTP streaming để giao tiếp hai chiều với máy chủ MCP từ xa.

| Trường                | Mô tả                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                      |
| `transport`           | Đặt thành `"streamable-http"` để chọn transport này; khi bỏ qua, OpenClaw dùng `sse` |
| `headers`             | Bản đồ khóa-giá trị tùy chọn của header HTTP (ví dụ token xác thực)                   |
| `connectionTimeoutMs` | Thời gian chờ kết nối cho từng máy chủ tính bằng ms (tùy chọn)                        |

Cấu hình OpenClaw dùng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị MCP `type: "http"` nguyên bản của CLI được chấp nhận khi lưu qua `openclaw mcp set` và được sửa bởi `openclaw doctor --fix` trong cấu hình hiện có, nhưng `transport` là thứ Pi nhúng dùng trực tiếp.

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

- khám phá cuộc trò chuyện phụ thuộc vào metadata định tuyến phiên Gateway hiện có
- chưa có giao thức đẩy chung ngoài adapter dành riêng cho Claude
- chưa có công cụ sửa tin nhắn hoặc thả phản ứng
- transport HTTP/SSE/streamable-http kết nối đến một máy chủ từ xa duy nhất; chưa có upstream ghép kênh
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát khi cầu nối đang kết nối

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Plugins](/vi/cli/plugins)
