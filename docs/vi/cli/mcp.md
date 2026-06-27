---
read_when:
    - Kết nối Codex, Claude Code hoặc một MCP client khác với các kênh được OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Hiển thị các cuộc hội thoại kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:18:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai nhiệm vụ:

- chạy OpenClaw như một máy chủ MCP bằng `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP hướng ra ngoài do OpenClaw quản lý bằng `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, và `unset`

Nói cách khác:

- `serve` là OpenClaw hoạt động như một máy chủ MCP
- các lệnh con khác là OpenClaw hoạt động như một sổ đăng ký phía máy khách MCP cho các máy chủ MCP mà runtime của nó có thể dùng sau này

<Note>
  `list`, `show`, `set`, và `unset` chỉ đọc và ghi các mục `mcp.servers` do OpenClaw quản lý trong cấu hình OpenClaw. Chúng không bao gồm các máy chủ mcporter từ `config/mcporter.json`; hãy dùng `mcporter list` cho sổ đăng ký đó.
</Note>

Dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ một phiên coding harness và định tuyến runtime đó qua ACP.

## Chọn đường dẫn MCP phù hợp

OpenClaw có nhiều bề mặt MCP. Chọn bề mặt khớp với bên sở hữu runtime agent và bên sở hữu công cụ.

| Mục tiêu                                                            | Dùng                                                                 | Lý do                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Cho phép một máy khách MCP bên ngoài đọc/gửi các cuộc trò chuyện kênh OpenClaw | `openclaw mcp serve`                                                 | OpenClaw là máy chủ MCP và phơi bày các cuộc trò chuyện dựa trên Gateway qua stdio.                             |
| Lưu các máy chủ MCP bên thứ ba cho các lượt chạy agent do OpenClaw quản lý | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw là sổ đăng ký phía máy khách MCP và về sau chiếu các máy chủ đó vào các runtime đủ điều kiện.          |
| Kiểm tra một máy chủ đã lưu mà không chạy một lượt agent            | `openclaw mcp status`, `doctor`, `probe`                             | `status` và `doctor` kiểm tra cấu hình; `probe` mở một kết nối MCP trực tiếp và liệt kê các khả năng.           |
| Chỉnh sửa cấu hình MCP từ trình duyệt                               | Control UI `/mcp`                                                    | Trang này hiển thị kiểm kê, trạng thái bật, tóm tắt OAuth/bộ lọc, gợi ý lệnh, và trình chỉnh sửa `mcp` theo phạm vi. |
| Cung cấp cho Codex app-server một máy chủ MCP gốc theo phạm vi      | `mcp.servers.<name>.codex`                                           | Khối `codex` chỉ ảnh hưởng đến phép chiếu luồng Codex app-server và bị loại bỏ trước khi bàn giao cấu hình gốc. |
| Chạy các phiên harness do ACP lưu trữ                               | [`openclaw acp`](/vi/cli/acp) và [ACP Agents](/vi/tools/acp-agents-setup) | Chế độ cầu nối ACP không chấp nhận tiêm máy chủ MCP theo từng phiên; thay vào đó hãy cấu hình cầu nối gateway/plugin. |

<Tip>
Nếu bạn không chắc mình cần đường dẫn nào, hãy bắt đầu với `openclaw mcp status --verbose`. Lệnh này hiển thị những gì OpenClaw đã lưu mà không khởi động bất kỳ máy chủ MCP nào.
</Tip>

## OpenClaw như một máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào dùng `serve`

Dùng `openclaw mcp serve` khi:

- Codex, Claude Code, hoặc một máy khách MCP khác cần nói chuyện trực tiếp với các cuộc trò chuyện kênh được OpenClaw hỗ trợ
- bạn đã có một OpenClaw Gateway cục bộ hoặc từ xa với các phiên đã được định tuyến
- bạn muốn một máy chủ MCP hoạt động trên các backend kênh của OpenClaw thay vì chạy các cầu nối riêng cho từng kênh

Thay vào đó, dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ coding runtime và giữ phiên agent bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Khi máy khách giữ phiên stdio mở, cầu nối kết nối tới OpenClaw Gateway cục bộ hoặc từ xa qua WebSocket và phơi bày các cuộc trò chuyện kênh đã định tuyến qua MCP.

<Steps>
  <Step title="Máy khách sinh cầu nối">
    Máy khách MCP sinh `openclaw mcp serve`.
  </Step>
  <Step title="Cầu nối kết nối tới Gateway">
    Cầu nối kết nối tới OpenClaw Gateway qua WebSocket.
  </Step>
  <Step title="Phiên trở thành cuộc trò chuyện MCP">
    Các phiên đã định tuyến trở thành cuộc trò chuyện MCP và công cụ transcript/lịch sử.
  </Step>
  <Step title="Sự kiện trực tiếp xếp hàng">
    Các sự kiện trực tiếp được xếp hàng trong bộ nhớ khi cầu nối đang kết nối.
  </Step>
  <Step title="Đẩy Claude tùy chọn">
    Nếu chế độ kênh Claude được bật, cùng phiên đó cũng có thể nhận thông báo đẩy dành riêng cho Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - trạng thái hàng đợi trực tiếp bắt đầu khi cầu nối kết nối
    - lịch sử transcript cũ hơn được đọc bằng `messages_read`
    - thông báo đẩy Claude chỉ tồn tại khi phiên MCP còn sống
    - khi máy khách ngắt kết nối, cầu nối thoát và hàng đợi trực tiếp biến mất
    - các điểm vào agent một lần như `openclaw agent` và `openclaw infer model run` đóng mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, nên các lượt chạy theo script lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy (đi kèm hoặc do người dùng cấu hình) được gỡ xuống như một cây tiến trình khi tắt, nên các tiến trình con do máy chủ khởi động không tồn tại sau khi máy khách stdio cha thoát
    - việc xóa hoặc đặt lại một phiên sẽ giải phóng các máy khách MCP của phiên đó qua đường dọn dẹp runtime dùng chung, nên không còn kết nối stdio nào gắn với một phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

Dùng cùng một cầu nối theo hai cách khác nhau:

<Tabs>
  <Tab title="Máy khách MCP chung">
    Chỉ các công cụ MCP tiêu chuẩn. Dùng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, và các công cụ phê duyệt.
  </Tab>
  <Tab title="Claude Code">
    Các công cụ MCP tiêu chuẩn cộng với bộ chuyển đổi kênh dành riêng cho Claude. Bật `--claude-channel-mode on` hoặc giữ mặc định `auto`.
  </Tab>
</Tabs>

<Note>
Hiện nay, `auto` hoạt động giống `on`. Chưa có phát hiện khả năng máy khách.
</Note>

### `serve` phơi bày những gì

Cầu nối dùng metadata định tuyến phiên Gateway hiện có để phơi bày các cuộc trò chuyện dựa trên kênh. Một cuộc trò chuyện xuất hiện khi OpenClaw đã có trạng thái phiên với một tuyến đã biết như:

- `channel`
- metadata người nhận hoặc đích đến
- `accountId` tùy chọn
- `threadId` tùy chọn

Điều này cung cấp cho máy khách MCP một nơi để:

- liệt kê các cuộc trò chuyện đã định tuyến gần đây
- đọc lịch sử transcript gần đây
- chờ sự kiện đến mới
- gửi phản hồi lại qua cùng tuyến
- xem các yêu cầu phê duyệt đến khi cầu nối đang kết nối

### Cách dùng

<Tabs>
  <Tab title="Gateway cục bộ">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway từ xa (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway từ xa (mật khẩu)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Chi tiết / tắt Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Công cụ cầu nối

Cầu nối hiện tại phơi bày các công cụ MCP sau:

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
    Trả về một cuộc trò chuyện theo `session_key` bằng tra cứu phiên Gateway trực tiếp.
  </Accordion>
  <Accordion title="messages_read">
    Đọc các tin nhắn transcript gần đây cho một cuộc trò chuyện dựa trên phiên.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung tin nhắn không phải văn bản từ một tin nhắn transcript. Đây là chế độ xem metadata trên nội dung transcript, không phải kho lưu trữ blob tệp đính kèm bền vững độc lập.
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
    - dùng kênh, người nhận, id tài khoản, và id luồng của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt exec/plugin đang chờ mà cầu nối đã quan sát kể từ khi kết nối tới Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt exec/plugin đang chờ bằng:

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
- hàng đợi chỉ dành cho trực tiếp; nó bắt đầu khi cầu nối MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- backlog bền vững nên được đọc bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Cầu nối cũng có thể phơi bày thông báo kênh dành riêng cho Claude. Đây là tương đương của OpenClaw với bộ chuyển đổi kênh Claude Code: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng tin nhắn đến trực tiếp cũng có thể đến dưới dạng thông báo MCP dành riêng cho Claude.

<Tabs>
  <Tab title="tắt">
    `--claude-channel-mode off`: chỉ các công cụ MCP tiêu chuẩn.
  </Tab>
  <Tab title="bật">
    `--claude-channel-mode on`: bật thông báo kênh Claude.
  </Tab>
  <Tab title="auto (mặc định)">
    `--claude-channel-mode auto`: mặc định hiện tại; cùng hành vi cầu nối như `on`.
  </Tab>
</Tabs>

Khi chế độ kênh Claude được bật, máy chủ quảng bá các khả năng thử nghiệm Claude và có thể phát:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Hành vi cầu nối hiện tại:

- tin nhắn transcript `user` đến được chuyển tiếp dưới dạng `notifications/claude/channel`
- yêu cầu quyền Claude nhận qua MCP được theo dõi trong bộ nhớ
- nếu cuộc trò chuyện được liên kết sau đó gửi `yes abcde` hoặc `no abcde`, cầu nối chuyển đổi nội dung đó thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối, sẽ không có mục tiêu đẩy

Điều này có chủ ý dành riêng cho máy khách. Máy khách MCP chung nên dựa vào các công cụ polling tiêu chuẩn.

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

Với hầu hết máy khách MCP chung, hãy bắt đầu với bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude.

### Tùy chọn

`openclaw mcp serve` hỗ trợ:

<ParamField path="--url" type="string">
  URL WebSocket Gateway.
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
Ưu tiên `--token-file` hoặc `--password-file` thay vì bí mật viết trực tiếp khi có thể.
</Tip>

### Ranh giới bảo mật và tin cậy

Cầu nối không tự tạo định tuyến. Nó chỉ hiển thị các cuộc trò chuyện mà Gateway đã biết cách định tuyến.

Điều đó có nghĩa là:

- danh sách cho phép người gửi, ghép cặp, và mức tin cậy theo kênh vẫn thuộc về cấu hình kênh OpenClaw bên dưới
- `messages_send` chỉ có thể trả lời qua một tuyến đã lưu hiện có
- trạng thái phê duyệt chỉ live/trong bộ nhớ cho phiên cầu nối hiện tại
- xác thực cầu nối nên dùng cùng các kiểm soát token hoặc mật khẩu Gateway mà bạn tin cậy cho bất kỳ ứng dụng khách Gateway từ xa nào khác

Nếu một cuộc trò chuyện bị thiếu trong `conversations_list`, nguyên nhân thường không phải là cấu hình MCP. Đó là siêu dữ liệu tuyến bị thiếu hoặc chưa đầy đủ trong phiên Gateway bên dưới.

### Kiểm thử

OpenClaw cung cấp một Docker smoke xác định cho cầu nối này:

```bash
pnpm test:docker:mcp-channels
```

Smoke đó:

- khởi động một container Gateway đã gieo dữ liệu
- khởi động container thứ hai để sinh `openclaw mcp serve`
- xác minh khám phá cuộc trò chuyện, đọc bản ghi cuộc trò chuyện, đọc siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện live, và định tuyến gửi đi
- xác thực thông báo kênh và quyền kiểu Claude qua cầu nối MCP stdio thật

Đây là cách nhanh nhất để chứng minh cầu nối hoạt động mà không cần nối tài khoản Telegram, Discord, hoặc iMessage thật vào lần chạy kiểm thử.

Để biết thêm ngữ cảnh kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không trả về cuộc trò chuyện nào">
    Thường có nghĩa là phiên Gateway chưa có khả năng định tuyến. Xác nhận rằng phiên bên dưới đã lưu siêu dữ liệu tuyến kênh/nhà cung cấp, người nhận, và tài khoản/luồng tùy chọn.
  </Accordion>
  <Accordion title="events_poll hoặc events_wait bỏ lỡ tin nhắn cũ hơn">
    Đây là hành vi dự kiến. Hàng đợi live bắt đầu khi cầu nối kết nối. Đọc lịch sử bản ghi cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Thông báo Claude không hiển thị">
    Kiểm tra tất cả các điểm sau:

    - ứng dụng khách vẫn giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - ứng dụng khách thật sự hiểu các phương thức thông báo riêng của Claude
    - tin nhắn đến xảy ra sau khi cầu nối đã kết nối

  </Accordion>
  <Accordion title="Thiếu phê duyệt">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát khi cầu nối đã kết nối. Đây không phải là API lịch sử phê duyệt bền vững.
  </Accordion>
</AccordionGroup>

## OpenClaw như một sổ đăng ký ứng dụng khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, và `unset`.

Các lệnh này không hiển thị OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP do OpenClaw quản lý dưới `mcp.servers` trong cấu hình OpenClaw. Chúng không đọc máy chủ mcporter từ `config/mcporter.json`.

Các định nghĩa đã lưu đó dành cho runtime mà OpenClaw khởi chạy hoặc cấu hình sau, chẳng hạn như OpenClaw nhúng và các adapter runtime khác. OpenClaw lưu các định nghĩa tập trung để các runtime đó không cần giữ danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - `status`, `list`, `show`, `doctor` không có `--probe`, `set`, `configure`, `tools`, `logout`, `reload`, và `unset` không kết nối tới máy chủ MCP đích
    - `login` thực hiện luồng mạng MCP OAuth cho máy chủ HTTP đã cấu hình và lưu thông tin xác thực cục bộ thu được
    - `status --verbose` in các gợi ý transport, xác thực, thời gian chờ, bộ lọc, và lệnh gọi công cụ song song đã phân giải mà không kết nối
    - `doctor` kiểm tra các định nghĩa đã lưu để tìm vấn đề thiết lập cục bộ như thiếu lệnh stdio, thư mục làm việc không hợp lệ, thiếu tệp TLS, máy chủ bị tắt, giá trị header/env nhạy cảm dạng literal, và ủy quyền OAuth chưa hoàn tất
    - `doctor --probe` thêm cùng bằng chứng kết nối live như `probe` sau khi các kiểm tra tĩnh đạt
    - `probe` kết nối tới máy chủ đã chọn hoặc tất cả máy chủ đã cấu hình, liệt kê công cụ, và báo cáo năng lực/chẩn đoán
    - `add` dựng một định nghĩa từ cờ và probe trước khi lưu, trừ khi đã đặt `--no-probe` hoặc cần ủy quyền OAuth trước
    - adapter runtime quyết định các dạng transport mà chúng thật sự hỗ trợ tại thời điểm thực thi
    - `enabled: false` giữ một máy chủ đã lưu nhưng loại trừ nó khỏi khám phá runtime nhúng
    - `timeout` và `connectTimeout` đặt thời gian chờ yêu cầu và kết nối theo từng máy chủ, tính bằng giây
    - `supportsParallelToolCalls: true` đánh dấu các máy chủ mà adapter có thể gọi đồng thời
    - máy chủ HTTP có thể dùng header tĩnh, đăng nhập OAuth, kiểm soát xác minh TLS, và đường dẫn chứng chỉ/khóa mTLS
    - OpenClaw nhúng hiển thị các công cụ MCP đã cấu hình trong hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng, và `tools.deny: ["bundle-mcp"]` tắt chúng một cách tường minh
    - `toolFilter.include` và `toolFilter.exclude` theo từng máy chủ lọc các công cụ MCP được khám phá trước khi chúng trở thành công cụ OpenClaw
    - máy chủ quảng bá tài nguyên hoặc prompt cũng hiển thị các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/lấy prompt; các tên tiện ích được tạo đó (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) dùng cùng bộ lọc include/exclude
    - thay đổi danh sách công cụ MCP động làm mất hiệu lực catalog đã lưu trong bộ nhớ đệm cho phiên đó; lần khám phá/sử dụng tiếp theo làm mới từ máy chủ
    - lỗi yêu cầu/giao thức công cụ MCP lặp lại sẽ tạm dừng máy chủ đó trong thời gian ngắn để một máy chủ hỏng không tiêu thụ toàn bộ lượt
    - runtime MCP đóng gói theo phạm vi phiên được thu hồi sau `mcp.sessionIdleTtlMs` mili giây nhàn rỗi (mặc định 10 phút; đặt `0` để tắt) và các lần chạy nhúng một lượt sẽ dọn dẹp chúng khi kết thúc lần chạy

  </Accordion>
</AccordionGroup>

Adapter runtime có thể chuẩn hóa sổ đăng ký dùng chung này thành dạng mà ứng dụng khách hạ nguồn của chúng kỳ vọng. Ví dụ, OpenClaw nhúng tiêu thụ trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` gốc CLI như `http`, `sse`, hoặc `stdio`.

Codex app-server cũng tôn trọng khối `codex` tùy chọn trên mỗi máy chủ. Đây là
siêu dữ liệu chiếu OpenClaw chỉ dành cho luồng Codex app-server; nó không
thay đổi phiên ACP, cấu hình harness Codex chung, hoặc các adapter runtime khác.
Dùng `codex.agents` không rỗng để chỉ chiếu một máy chủ vào các id tác tử
OpenClaw cụ thể. Danh sách tác tử rỗng, trống, hoặc không hợp lệ bị từ chối bởi
xác thực cấu hình và bị bỏ qua bởi đường dẫn chiếu runtime thay vì trở thành
toàn cục. Dùng `codex.defaultToolsApprovalMode` (`auto`, `prompt`, hoặc `approve`)
để phát `default_tools_approval_mode` gốc của Codex cho một máy chủ đáng tin cậy.
OpenClaw loại bỏ siêu dữ liệu `codex` trước khi giao cấu hình `mcp_servers`
gốc cho Codex.

### Định nghĩa máy chủ MCP đã lưu

OpenClaw cũng lưu một sổ đăng ký máy chủ MCP nhẹ trong cấu hình cho các bề mặt muốn có định nghĩa MCP do OpenClaw quản lý.

Lệnh:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Ghi chú:

- `list` sắp xếp tên máy chủ.
- `show` không có tên sẽ in toàn bộ đối tượng máy chủ MCP đã cấu hình.
- `status` phân loại các transport đã cấu hình mà không kết nối. `--verbose` bao gồm chi tiết khởi chạy, thời gian chờ, OAuth, bộ lọc, và lệnh gọi song song đã phân giải.
- `doctor` thực hiện kiểm tra tĩnh mà không kết nối. Thêm `--probe` khi lệnh cũng cần xác minh rằng máy chủ đã bật có thể kết nối.
- `probe` kết nối và báo cáo số lượng công cụ, hỗ trợ tài nguyên/prompt, hỗ trợ thay đổi danh sách, và chẩn đoán.
- `add` chấp nhận các cờ stdio như `--command`, `--arg`, `--env`, và `--cwd`, hoặc các cờ HTTP như `--url`, `--transport`, `--header`, `--auth oauth`, TLS, thời gian chờ, và cờ chọn công cụ.
- `set` kỳ vọng một giá trị đối tượng JSON trên dòng lệnh.
- `configure` cập nhật trạng thái bật, bộ lọc công cụ, thời gian chờ, OAuth, TLS, và gợi ý lệnh gọi công cụ song song mà không thay thế toàn bộ định nghĩa máy chủ.
- `tools` cập nhật bộ lọc công cụ theo từng máy chủ. Mục include/exclude là tên công cụ MCP và glob `*` đơn giản.
- `login` chạy luồng OAuth cho máy chủ HTTP được cấu hình với `auth: "oauth"`. Lần chạy đầu tiên in URL ủy quyền; chạy lại với `--code` sau khi phê duyệt.
- `logout` xóa thông tin xác thực OAuth đã lưu cho máy chủ được đặt tên mà không xóa định nghĩa máy chủ đã lưu.
- `reload` hủy các runtime MCP trong tiến trình đã lưu trong bộ nhớ đệm. Tiến trình Gateway hoặc tác tử trong tiến trình khác vẫn cần đường dẫn reload hoặc khởi động lại riêng.
- Dùng `transport: "streamable-http"` cho máy chủ Streamable HTTP MCP. `openclaw mcp set` cũng chuẩn hóa `type: "http"` gốc CLI về cùng dạng cấu hình chuẩn để tương thích.
- `unset` thất bại nếu máy chủ được đặt tên không tồn tại.

Ví dụ:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Công thức máy chủ phổ biến

Các ví dụ này chỉ lưu định nghĩa máy chủ. Chạy `openclaw mcp doctor --probe` sau đó để chứng minh rằng máy chủ khởi động và hiển thị công cụ.

<Tabs>
  <Tab title="Hệ thống tệp">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Giới hạn phạm vi máy chủ hệ thống tệp vào cây thư mục nhỏ nhất mà tác tử nên đọc hoặc chỉnh sửa.

  </Tab>
  <Tab title="Bộ nhớ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Dùng bộ lọc công cụ nếu máy chủ hiển thị các công cụ ghi không nên khả dụng cho tác tử thông thường.

  </Tab>
  <Tab title="Tập lệnh cục bộ">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` kiểm tra rằng `cwd` tồn tại và lệnh phân giải được từ môi trường đã cấu hình.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Dùng OAuth khi máy chủ từ xa hỗ trợ. Nếu máy chủ yêu cầu header tĩnh, hãy tránh commit token bearer dạng chữ.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Các máy chủ điều khiển desktop trực tiếp kế thừa quyền của tiến trình mà chúng khởi chạy. Dùng bộ lọc công cụ hẹp và lời nhắc cấp quyền ở cấp hệ điều hành.

  </Tab>
</Tabs>

### Dạng đầu ra JSON

Dùng `--json` cho script và dashboard. Tập trường có thể mở rộng theo thời gian, vì vậy bên tiêu thụ nên bỏ qua các khóa không xác định.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` thoát với mã khác 0 khi bất kỳ máy chủ đã bật nào được kiểm tra có lỗi. Cảnh báo được báo cáo nhưng tự chúng không làm lệnh thất bại.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` mở một phiên MCP client trực tiếp. Dùng nó để chứng minh khả năng truy cập và năng lực, không dùng cho kiểm tra cấu hình tĩnh.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Phương thức truyền tải Stdio

Khởi chạy một tiến trình con cục bộ và giao tiếp qua stdin/stdout.

| Trường                     | Mô tả                                  |
| -------------------------- | -------------------------------------- |
| `command`                  | Tệp thực thi cần spawn (bắt buộc)      |
| `args`                     | Mảng đối số dòng lệnh                  |
| `env`                      | Biến môi trường bổ sung                |
| `cwd` / `workingDirectory` | Thư mục làm việc cho tiến trình        |

<Warning>
**Bộ lọc an toàn env của Stdio**

OpenClaw từ chối các khóa env khởi động trình thông dịch có thể thay đổi cách máy chủ MCP stdio khởi động trước RPC đầu tiên, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Các khóa bị chặn bao gồm `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`, và các biến điều khiển runtime tương tự. Quá trình khởi động từ chối các khóa này bằng lỗi cấu hình để chúng không thể chèn phần mở đầu ngầm định, hoán đổi trình thông dịch, bật trình gỡ lỗi, hoặc chuyển hướng đầu ra runtime trái với tiến trình stdio. Các biến env thông thường dành cho thông tin xác thực, proxy và máy chủ cụ thể (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.) không bị ảnh hưởng.

Nếu máy chủ MCP của bạn thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì trong `env` của máy chủ stdio.
</Warning>

### Phương thức truyền tải SSE / HTTP

Kết nối tới máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                         | Mô tả                                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| `url`                          | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                         |
| `headers`                      | Bản đồ khóa-giá trị tùy chọn của HTTP header (ví dụ token xác thực)      |
| `connectionTimeoutMs`          | Thời gian chờ kết nối theo từng máy chủ tính bằng ms (tùy chọn)          |
| `connectTimeout`               | Thời gian chờ kết nối theo từng máy chủ tính bằng giây (tùy chọn)        |
| `timeout` / `requestTimeoutMs` | Thời gian chờ yêu cầu MCP theo từng máy chủ tính bằng giây hoặc ms       |
| `auth: "oauth"`                | Dùng lưu trữ token OAuth của MCP và `openclaw mcp login`                 |
| `sslVerify`                    | Chỉ đặt false cho endpoint HTTPS riêng tư được tin cậy rõ ràng           |
| `clientCert` / `clientKey`     | Đường dẫn chứng chỉ và khóa client mTLS                                  |
| `supportsParallelToolCalls`    | Gợi ý rằng các lệnh gọi đồng thời là an toàn cho máy chủ này             |

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Các giá trị nhạy cảm trong `url` (userinfo) và `headers` được che trong log và đầu ra trạng thái. `openclaw mcp doctor` cảnh báo khi các mục `headers` hoặc `env` có vẻ nhạy cảm chứa giá trị dạng chữ, để người vận hành có thể chuyển các giá trị đó ra khỏi cấu hình đã commit.

### Quy trình OAuth

OAuth dành cho máy chủ MCP HTTP quảng bá luồng OAuth của MCP. Header `Authorization` tĩnh bị bỏ qua đối với máy chủ khi `auth: "oauth"` được bật.

<Steps>
  <Step title="Save the server">
    Thêm hoặc cập nhật máy chủ với `auth: "oauth"` và mọi siêu dữ liệu OAuth tùy chọn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Chạy login để tạo yêu cầu ủy quyền.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw in URL ủy quyền và lưu trạng thái trình xác minh OAuth tạm thời trong thư mục trạng thái OpenClaw.

  </Step>
  <Step title="Finish with the code">
    Sau khi phê duyệt trong trình duyệt, truyền mã được trả về lại cho OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Dùng status hoặc doctor để xác nhận token đã có mặt.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout xóa thông tin xác thực OAuth đã lưu nhưng giữ định nghĩa máy chủ đã lưu.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Nếu nhà cung cấp xoay vòng token hoặc trạng thái ủy quyền bị kẹt, hãy chạy `openclaw mcp logout <name>`, rồi lặp lại `login`. `logout` có thể xóa thông tin xác thực cho máy chủ HTTP đã lưu ngay cả sau khi `auth: "oauth"` bị xóa khỏi cấu hình, miễn là tên máy chủ và URL vẫn nhận diện được mục kho thông tin xác thực.

### Phương thức truyền tải Streamable HTTP

`streamable-http` là một tùy chọn truyền tải bổ sung bên cạnh `sse` và `stdio`. Nó dùng HTTP streaming để giao tiếp hai chiều với máy chủ MCP từ xa.

| Trường                         | Mô tả                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                         |
| `transport`                    | Đặt thành `"streamable-http"` để chọn phương thức truyền tải này; khi bỏ qua, OpenClaw dùng `sse` |
| `headers`                      | Bản đồ khóa-giá trị tùy chọn của HTTP header (ví dụ token xác thực)                      |
| `connectionTimeoutMs`          | Thời gian chờ kết nối theo từng máy chủ tính bằng ms (tùy chọn)                          |
| `connectTimeout`               | Thời gian chờ kết nối theo từng máy chủ tính bằng giây (tùy chọn)                        |
| `timeout` / `requestTimeoutMs` | Thời gian chờ yêu cầu MCP theo từng máy chủ tính bằng giây hoặc ms                       |
| `auth: "oauth"`                | Dùng lưu trữ token OAuth của MCP và `openclaw mcp login`                                 |
| `sslVerify`                    | Chỉ đặt false cho endpoint HTTPS riêng tư được tin cậy rõ ràng                           |
| `clientCert` / `clientKey`     | Đường dẫn chứng chỉ và khóa client mTLS                                                  |
| `supportsParallelToolCalls`    | Gợi ý rằng các lệnh gọi đồng thời là an toàn cho máy chủ này                             |

Cấu hình OpenClaw dùng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị MCP gốc của CLI `type: "http"` được chấp nhận khi lưu qua `openclaw mcp set` và được sửa bởi `openclaw doctor --fix` trong cấu hình hiện có, nhưng `transport` là thứ OpenClaw nhúng tiêu thụ trực tiếp.

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Các lệnh registry không khởi động cầu nối kênh. Chỉ `probe` và `doctor --probe` mở một phiên MCP client trực tiếp để chứng minh máy chủ đích có thể truy cập được.
</Note>

## UI điều khiển

UI điều khiển trên trình duyệt bao gồm một trang cài đặt MCP riêng tại `/mcp`. Trang này hiển thị số lượng máy chủ đã cấu hình, tóm tắt bật/OAuth/bộ lọc, các hàng phương thức truyền tải theo từng máy chủ, điều khiển bật/tắt, các lệnh CLI thường dùng, và trình chỉnh sửa theo phạm vi cho phần cấu hình `mcp`.

Dùng trang này cho chỉnh sửa của người vận hành và kiểm kê nhanh. Dùng `openclaw mcp doctor --probe` hoặc `openclaw mcp probe` khi bạn cần bằng chứng máy chủ trực tiếp.

Quy trình của người vận hành:

1. Mở Control UI và chọn **MCP**.
2. Xem lại các thẻ tóm tắt cho tổng số máy chủ, máy chủ đã bật, OAuth và máy chủ đã lọc.
3. Dùng từng hàng máy chủ để xem gợi ý về transport, xác thực, bộ lọc, thời gian chờ và lệnh.
4. Bật/tắt trạng thái kích hoạt khi bạn muốn giữ lại một định nghĩa nhưng loại trừ nó khỏi quá trình khám phá runtime.
5. Chỉnh sửa phần cấu hình `mcp` trong phạm vi tương ứng cho các thay đổi cấu trúc như máy chủ mới, header, TLS, siêu dữ liệu OAuth hoặc bộ lọc công cụ.
6. Chọn **Lưu** để chỉ lưu cấu hình, hoặc **Lưu & phát hành** để áp dụng qua đường dẫn cấu hình Gateway.
7. Chạy `openclaw mcp doctor --probe` khi bạn cần bằng chứng trực tiếp rằng máy chủ đã chỉnh sửa khởi động được và liệt kê công cụ.

Ghi chú:

- các đoạn lệnh đặt tên máy chủ trong dấu ngoặc kép để những tên bất thường vẫn có thể sao chép vào shell
- các giá trị hiển thị giống URL sẽ được biên tập ẩn trước khi render nếu chúng chứa thông tin đăng nhập nhúng
- trang này không tự khởi động MCP transport
- các runtime đang hoạt động có thể cần `openclaw mcp reload`, phát hành cấu hình Gateway, hoặc khởi động lại tiến trình tùy theo tiến trình nào sở hữu các MCP client

## Giới hạn hiện tại

Trang này ghi lại bridge như được phát hành hiện nay.

Giới hạn hiện tại:

- khám phá cuộc trò chuyện phụ thuộc vào siêu dữ liệu route phiên Gateway hiện có
- chưa có giao thức push chung ngoài adapter dành riêng cho Claude
- chưa có công cụ chỉnh sửa tin nhắn hoặc bày tỏ phản ứng
- transport HTTP/SSE/streamable-http kết nối tới một máy chủ từ xa duy nhất; chưa có upstream ghép kênh
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát trong khi bridge đang kết nối

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Plugin](/vi/cli/plugins)
