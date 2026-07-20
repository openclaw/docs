---
read_when:
    - Kết nối Codex, Claude Code hoặc một máy khách MCP khác với các kênh được OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Cung cấp các cuộc trò chuyện trên kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-07-20T14:46:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 07db33cc81d9e307b4bd83e0a3a283aa8a9bb66f9fbedd7f972d59333676b7e9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai nhiệm vụ:

- chạy OpenClaw dưới dạng máy chủ MCP bằng `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP gửi đi do OpenClaw quản lý bằng `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` và `unset`

`serve` là OpenClaw hoạt động dưới dạng máy chủ MCP. Các lệnh con khác là OpenClaw hoạt động dưới dạng sổ đăng ký phía máy khách MCP cho các máy chủ mà những runtime của chính OpenClaw có thể sử dụng sau này.

<Note>
  `list`, `show`, `set` và `unset` chỉ đọc và ghi các mục `mcp.servers` do OpenClaw quản lý trong cấu hình OpenClaw. Chúng không bao gồm các máy chủ mcporter từ `config/mcporter.json`; hãy dùng `mcporter list` cho sổ đăng ký đó.
</Note>

Sử dụng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ một phiên harness lập trình và định tuyến runtime đó qua ACP.

## Chọn đường dẫn MCP phù hợp

| Mục tiêu                                                                | Sử dụng                                                                  | Lý do                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Cho phép máy khách MCP bên ngoài đọc/gửi các cuộc trò chuyện trên kênh OpenClaw | `openclaw mcp serve`                                                 | OpenClaw là máy chủ MCP và cung cấp các cuộc trò chuyện được Gateway hỗ trợ qua stdio.                                 |
| Lưu các máy chủ MCP của bên thứ ba cho những lượt chạy tác nhân do OpenClaw quản lý        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw là sổ đăng ký phía máy khách MCP và sau đó đưa các máy chủ đó vào những runtime đủ điều kiện.               |
| Kiểm tra máy chủ đã lưu mà không chạy một lượt tác nhân                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` và `doctor` kiểm tra cấu hình; `probe` mở kết nối MCP trực tiếp và liệt kê các khả năng.               |
| Chỉnh sửa cấu hình MCP từ trình duyệt                                      | Giao diện điều khiển `/settings/mcp` (bí danh `/mcp`)                            | Trang này hiển thị danh mục, trạng thái bật, bản tóm tắt OAuth/bộ lọc, gợi ý lệnh và trình chỉnh sửa `mcp` theo phạm vi.         |
| Cung cấp cho Codex app-server một máy chủ MCP gốc theo phạm vi                    | `mcp.servers.<name>.codex`                                           | Khối `codex` chỉ ảnh hưởng đến việc ánh xạ luồng Codex app-server và được loại bỏ trước khi chuyển giao cấu hình gốc. |
| Chạy các phiên harness do ACP lưu trữ                                     | [`openclaw acp`](/vi/cli/acp) và [Tác nhân ACP](/vi/tools/acp-agents-setup) | Chế độ cầu nối ACP không chấp nhận việc chèn máy chủ MCP theo từng phiên; thay vào đó, hãy cấu hình các cầu nối Gateway/Plugin.     |

<Tip>
Nếu không chắc mình cần đường dẫn nào, hãy bắt đầu với `openclaw mcp status --verbose`. Lệnh này hiển thị những gì OpenClaw đã lưu mà không khởi động bất kỳ máy chủ MCP nào.
</Tip>

## OpenClaw dưới dạng máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào nên dùng serve

Sử dụng `openclaw mcp serve` khi:

- Codex, Claude Code hoặc một máy khách MCP khác cần giao tiếp trực tiếp với các cuộc trò chuyện trên kênh được OpenClaw hỗ trợ
- đã có một OpenClaw Gateway cục bộ hoặc từ xa với các phiên đã được định tuyến
- cần một máy chủ MCP hoạt động trên nhiều backend kênh của OpenClaw thay vì chạy cầu nối riêng cho từng kênh

Thay vào đó, hãy dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ runtime lập trình và giữ phiên tác nhân bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Trong khi máy khách giữ phiên stdio mở, cầu nối kết nối với OpenClaw Gateway cục bộ hoặc từ xa qua WebSocket và cung cấp các cuộc trò chuyện trên kênh đã định tuyến qua MCP.

<Steps>
  <Step title="Máy khách khởi chạy cầu nối">
    Máy khách MCP khởi chạy `openclaw mcp serve`.
  </Step>
  <Step title="Cầu nối kết nối với Gateway">
    Cầu nối kết nối với OpenClaw Gateway qua WebSocket.
  </Step>
  <Step title="Các phiên trở thành cuộc trò chuyện MCP">
    Các phiên đã định tuyến trở thành cuộc trò chuyện MCP và các công cụ bản chép lời/lịch sử.
  </Step>
  <Step title="Các sự kiện trực tiếp được đưa vào hàng đợi">
    Các sự kiện trực tiếp được xếp hàng trong bộ nhớ khi cầu nối đang kết nối.
  </Step>
  <Step title="Tùy chọn đẩy Claude">
    Nếu chế độ kênh Claude được bật, cùng phiên đó cũng có thể nhận thông báo đẩy dành riêng cho Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - trạng thái hàng đợi trực tiếp bắt đầu khi cầu nối kết nối
    - lịch sử bản chép lời cũ hơn được đọc bằng `messages_read`
    - thông báo đẩy Claude chỉ tồn tại khi phiên MCP còn hoạt động
    - khi máy khách ngắt kết nối, cầu nối thoát và hàng đợi trực tiếp biến mất
    - các điểm vào tác nhân dùng một lần như `openclaw agent` và `openclaw infer model run` đóng mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, vì vậy các lượt chạy theo tập lệnh lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy (đi kèm hoặc do người dùng cấu hình) được dừng theo toàn bộ cây tiến trình khi tắt, vì vậy các tiến trình con do máy chủ khởi động không tiếp tục tồn tại sau khi máy khách stdio cha thoát
    - việc xóa hoặc đặt lại một phiên sẽ giải phóng các máy khách MCP của phiên đó thông qua đường dẫn dọn dẹp runtime dùng chung, vì vậy không còn kết nối stdio nào gắn với phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

<Tabs>
  <Tab title="Máy khách MCP thông thường">
    Chỉ các công cụ MCP tiêu chuẩn. Sử dụng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` và các công cụ phê duyệt.
  </Tab>
  <Tab title="Claude Code">
    Các công cụ MCP tiêu chuẩn cùng bộ điều hợp kênh dành riêng cho Claude. Bật `--claude-channel-mode on` hoặc giữ giá trị mặc định `auto`.
  </Tab>
</Tabs>

<Note>
Hiện tại, `auto` hoạt động giống `on`. Chưa có tính năng phát hiện khả năng của máy khách.
</Note>

### Những gì serve cung cấp

Cầu nối sử dụng siêu dữ liệu tuyến phiên hiện có của Gateway để cung cấp các cuộc trò chuyện được kênh hỗ trợ. Một cuộc trò chuyện xuất hiện khi OpenClaw đã có trạng thái phiên với một tuyến đã biết, chẳng hạn như:

- `channel`
- siêu dữ liệu người nhận hoặc đích đến
- `accountId` tùy chọn
- `threadId` tùy chọn

Điều này cung cấp cho máy khách MCP một nơi duy nhất để:

- liệt kê các cuộc trò chuyện đã định tuyến gần đây
- đọc lịch sử bản chép lời gần đây
- chờ các sự kiện đến mới
- gửi phản hồi trở lại qua cùng một tuyến
- xem các yêu cầu phê duyệt đến trong khi cầu nối đang kết nối

### Cách sử dụng

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

<AccordionGroup>
  <Accordion title="conversations_list">
    Liệt kê các cuộc trò chuyện gần đây được phiên hỗ trợ và đã có siêu dữ liệu tuyến trong trạng thái phiên Gateway.

    Bộ lọc: `limit` (tối đa 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Trả về một cuộc trò chuyện theo `session_key` bằng cách tra cứu trực tiếp phiên Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Đọc các tin nhắn bản chép lời gần đây cho một cuộc trò chuyện được phiên hỗ trợ. `limit` mặc định là 20, tối đa 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung không phải văn bản từ một tin nhắn trong bản chép lời. Đây là chế độ xem siêu dữ liệu trên nội dung bản chép lời, không phải kho blob tệp đính kèm bền vững độc lập.
  </Accordion>
  <Accordion title="events_poll">
    Đọc các sự kiện trực tiếp đã xếp hàng kể từ một con trỏ dạng số. `limit` tối đa 200.
  </Accordion>
  <Accordion title="events_wait">
    Thăm dò dài cho đến khi sự kiện đã xếp hàng phù hợp tiếp theo đến hoặc hết thời gian chờ (mặc định 30 giây, tối đa 300 giây).

    Sử dụng tùy chọn này khi máy khách MCP thông thường cần phân phối gần thời gian thực mà không có giao thức đẩy dành riêng cho Claude.

  </Accordion>
  <Accordion title="messages_send">
    Gửi văn bản trở lại qua cùng tuyến đã được ghi trên phiên.

    Hành vi hiện tại:

    - yêu cầu một tuyến cuộc trò chuyện hiện có
    - sử dụng kênh, người nhận, id tài khoản và id luồng của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt thực thi/Plugin đang chờ xử lý mà cầu nối đã quan sát được kể từ khi kết nối với Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt thực thi/Plugin đang chờ xử lý bằng:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Mô hình sự kiện

Cầu nối duy trì một hàng đợi sự kiện trong bộ nhớ khi đang kết nối.

Các loại sự kiện hiện tại:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- hàng đợi chỉ dành cho dữ liệu trực tiếp; nó bắt đầu khi cầu nối MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- danh sách tồn đọng bền vững nên được đọc bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Cầu nối cũng có thể cung cấp các thông báo kênh dành riêng cho Claude. Đây là phiên bản tương đương của OpenClaw với bộ điều hợp kênh Claude Code: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng các tin nhắn trực tiếp đến cũng có thể xuất hiện dưới dạng thông báo MCP dành riêng cho Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: chỉ các công cụ MCP tiêu chuẩn.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: bật thông báo kênh Claude.
  </Tab>
  <Tab title="auto (mặc định)">
    `--claude-channel-mode auto`: giá trị mặc định hiện tại; hành vi cầu nối giống `on`.
  </Tab>
</Tabs>

Khi chế độ kênh Claude được bật, máy chủ công bố các khả năng thử nghiệm của Claude và có thể phát:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Hành vi cầu nối hiện tại:

- các tin nhắn bản chép lời `user` đến được chuyển tiếp dưới dạng `notifications/claude/channel`
- các yêu cầu quyền Claude nhận được qua MCP được theo dõi trong bộ nhớ
- nếu chủ sở hữu lệnh trong cuộc trò chuyện được liên kết sau đó gửi `yes <id>` hoặc `no <id>` (`<id>` là id yêu cầu gồm 5 chữ cái, không bao gồm `l`), cầu nối sẽ chuyển đổi nội dung đó thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối thì không còn đích đẩy

Điều này được thiết kế riêng cho từng máy khách. Các máy khách MCP thông thường nên dựa vào các công cụ thăm dò tiêu chuẩn.

### Cấu hình máy khách MCP

Ví dụ về cấu hình máy khách stdio:

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

Đối với hầu hết các máy khách MCP phổ dụng, hãy bắt đầu với bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude.

### Tùy chọn

`openclaw mcp serve` hỗ trợ:

<ParamField path="--url" type="string">
  URL WebSocket của Gateway. Mặc định là `gateway.remote.url` khi được cấu hình.
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
  Chế độ thông báo Claude. Mặc định là `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Ghi nhật ký chi tiết vào stderr.
</ParamField>

<Tip>
Khi có thể, ưu tiên `--token-file` hoặc `--password-file` thay vì bí mật nội tuyến.
</Tip>

### Ranh giới bảo mật và tin cậy

Cầu nối không tự tạo quy tắc định tuyến. Nó chỉ hiển thị những cuộc hội thoại mà Gateway đã biết cách định tuyến.

Điều đó có nghĩa là:

- danh sách cho phép người gửi, ghép nối và mức độ tin cậy ở cấp kênh vẫn thuộc cấu hình kênh OpenClaw cơ sở
- `messages_send` chỉ có thể trả lời qua một tuyến đã được lưu
- trạng thái phê duyệt chỉ tồn tại trực tiếp trong bộ nhớ cho phiên cầu nối hiện tại
- xác thực cầu nối nên sử dụng cùng các biện pháp kiểm soát token hoặc mật khẩu Gateway mà bạn tin dùng cho bất kỳ máy khách Gateway từ xa nào khác

Nếu một cuộc hội thoại không xuất hiện trong `conversations_list`, nguyên nhân thông thường không phải là cấu hình MCP. Nguyên nhân là siêu dữ liệu tuyến bị thiếu hoặc chưa đầy đủ trong phiên Gateway cơ sở.

### Kiểm thử

OpenClaw cung cấp một bài kiểm thử nhanh Docker có tính xác định cho cầu nối này:

```bash
pnpm test:docker:mcp-channels
```

Bài kiểm thử nhanh đó chạy một container duy nhất: nó khởi tạo trạng thái hội thoại, khởi động Gateway, sau đó tạo `openclaw mcp serve` dưới dạng tiến trình con stdio và điều khiển tiến trình đó như một máy khách MCP. Nó xác minh khả năng phát hiện cuộc hội thoại, đọc bản ghi hội thoại, đọc siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, cũng như các thông báo về kênh và quyền theo kiểu Claude qua cầu nối MCP stdio thực. Việc định tuyến gửi đi (`messages_send` tái sử dụng tuyến hội thoại đã lưu) được kiểm thử riêng bằng các kiểm thử đơn vị trong `src/mcp/channel-server.test.ts`.

Đây là cách nhanh nhất để chứng minh cầu nối hoạt động mà không cần kết nối tài khoản Telegram, Discord hoặc iMessage thực vào lượt kiểm thử.

Để biết bối cảnh kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không trả về cuộc hội thoại nào">
    Thường có nghĩa là phiên Gateway chưa thể định tuyến. Hãy xác nhận rằng phiên cơ sở đã lưu siêu dữ liệu tuyến gồm kênh/nhà cung cấp, người nhận và tài khoản/luồng tùy chọn.
  </Accordion>
  <Accordion title="events_poll hoặc events_wait bỏ lỡ các tin nhắn cũ hơn">
    Đây là hành vi dự kiến. Hàng đợi trực tiếp bắt đầu khi cầu nối kết nối. Đọc lịch sử bản ghi hội thoại cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Thông báo Claude không xuất hiện">
    Hãy kiểm tra tất cả các mục sau:

    - máy khách vẫn giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude
    - tin nhắn đến xuất hiện sau khi cầu nối kết nối

  </Accordion>
  <Accordion title="Thiếu yêu cầu phê duyệt">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát trong khi cầu nối đang kết nối. Đây không phải là API lịch sử phê duyệt lâu dài.
  </Accordion>
</AccordionGroup>

## OpenClaw dưới dạng sổ đăng ký máy khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` và `unset`.

Các lệnh này không cung cấp OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP do OpenClaw quản lý trong `mcp.servers` thuộc cấu hình OpenClaw. Chúng không đọc các máy chủ mcporter từ `config/mcporter.json`.

Các định nghĩa đã lưu đó dành cho những runtime mà OpenClaw sẽ khởi chạy hoặc cấu hình sau này, chẳng hạn như OpenClaw nhúng và các bộ điều hợp runtime khác. OpenClaw lưu trữ tập trung các định nghĩa để những runtime này không phải duy trì các danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - `status`, `list`, `show`, `doctor` khi không có `--probe`, `set`, `configure`, `tools`, `logout`, `reload` và `unset` sẽ không kết nối với máy chủ MCP đích
    - `login` thực hiện luồng mạng MCP OAuth cho máy chủ HTTP đã cấu hình và lưu thông tin xác thực cục bộ thu được
    - `status --verbose` in ra các gợi ý đã phân giải về phương thức truyền tải, xác thực, thời gian chờ, bộ lọc và gọi công cụ song song mà không kết nối
    - `doctor` kiểm tra các định nghĩa đã lưu để phát hiện vấn đề thiết lập cục bộ như thiếu lệnh stdio, thư mục làm việc không hợp lệ, thiếu tệp TLS, máy chủ bị tắt, giá trị header/biến môi trường nhạy cảm ở dạng ký tự trực tiếp và ủy quyền OAuth chưa hoàn tất
    - `doctor --probe` bổ sung cùng bằng chứng kết nối trực tiếp như `probe` sau khi các bước kiểm tra tĩnh thành công
    - `probe` kết nối với máy chủ đã chọn hoặc tất cả máy chủ đã cấu hình, liệt kê công cụ và báo cáo khả năng/chẩn đoán
    - `add` tạo định nghĩa từ các cờ và thăm dò trước khi lưu, trừ khi `--no-probe` được đặt hoặc trước tiên cần ủy quyền OAuth
    - các bộ điều hợp runtime quyết định những dạng phương thức truyền tải nào thực sự được hỗ trợ tại thời điểm thực thi
    - `enabled: false` giữ máy chủ ở trạng thái đã lưu nhưng loại máy chủ đó khỏi quá trình phát hiện của runtime nhúng
    - `requestTimeoutMs` và `connectionTimeoutMs` đặt thời gian chờ yêu cầu và kết nối theo từng máy chủ, tính bằng mili giây
    - `supportsParallelToolCalls: true` đánh dấu các máy chủ mà bộ điều hợp có thể gọi đồng thời
    - máy chủ HTTP có thể sử dụng header tĩnh, đăng nhập OAuth, tùy chọn kiểm soát xác minh TLS và đường dẫn chứng chỉ/khóa mTLS
    - OpenClaw nhúng cung cấp các công cụ MCP đã cấu hình trong hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng và `tools.deny: ["bundle-mcp"]` vô hiệu hóa chúng một cách tường minh
    - `toolFilter.include` và `toolFilter.exclude` theo từng máy chủ lọc các công cụ MCP được phát hiện trước khi chúng trở thành công cụ OpenClaw
    - các máy chủ quảng bá tài nguyên hoặc lời nhắc cũng cung cấp các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/lấy lời nhắc; các tên tiện ích được tạo đó (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) sử dụng cùng bộ lọc bao gồm/loại trừ
    - các thay đổi động đối với danh sách công cụ MCP làm mất hiệu lực danh mục được lưu vào bộ nhớ đệm cho phiên đó; lần phát hiện/sử dụng tiếp theo sẽ làm mới từ máy chủ
    - các lỗi yêu cầu/giao thức công cụ MCP lặp lại sẽ tạm dừng máy chủ đó trong thời gian ngắn để một máy chủ bị lỗi không tiêu tốn toàn bộ lượt
    - các runtime MCP đi kèm có phạm vi phiên sẽ được thu hồi sau 10 phút không hoạt động và các lượt chạy nhúng một lần sẽ dọn dẹp chúng khi lượt chạy kết thúc

  </Accordion>
</AccordionGroup>

Các bộ điều hợp runtime có thể chuẩn hóa sổ đăng ký dùng chung này thành dạng mà máy khách hạ nguồn của chúng mong đợi. Ví dụ: OpenClaw nhúng sử dụng trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` nguyên bản của CLI như `http`, `sse` hoặc `stdio`.

Codex app-server cũng tuân theo một khối `codex` tùy chọn trên mỗi máy chủ. Đây chỉ là
siêu dữ liệu chiếu của OpenClaw dành cho các luồng Codex app-server; nó không
thay đổi các phiên ACP, cấu hình harness Codex chung hoặc các bộ điều hợp runtime khác.
Sử dụng `codex.agents` không rỗng để chỉ chiếu một máy chủ vào các id tác tử OpenClaw
cụ thể. Danh sách tác tử rỗng, chỉ chứa khoảng trắng hoặc không hợp lệ sẽ bị quá trình
xác thực cấu hình từ chối và bị đường dẫn chiếu runtime bỏ qua thay vì trở thành
toàn cục. Sử dụng `codex.defaultToolsApprovalMode` (`auto`, `prompt` hoặc `approve`)
để phát ra `default_tools_approval_mode` nguyên bản của Codex cho một máy chủ đáng tin cậy.
OpenClaw loại bỏ siêu dữ liệu `codex` trước khi chuyển cấu hình `mcp_servers`
nguyên bản cho Codex.

### Các định nghĩa máy chủ MCP đã lưu

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

Lưu ý:

- `list` sắp xếp tên máy chủ.
- `show` khi không có tên sẽ in ra toàn bộ đối tượng máy chủ MCP đã cấu hình.
- `status` phân loại các phương thức truyền tải đã cấu hình mà không kết nối. `--verbose` bao gồm thông tin chi tiết đã phân giải về khởi chạy, thời gian chờ, OAuth, bộ lọc và gọi song song, kể cả khi token OAuth đã lưu cần được ủy quyền thêm. Các đối số stdio chứa thông tin xác thực được che đi trong đầu ra văn bản và JSON.
- `doctor` thực hiện các bước kiểm tra tĩnh mà không kết nối. Thêm `--probe` khi lệnh cũng cần xác minh rằng các máy chủ đã bật có thể kết nối.
- `probe` kết nối và báo cáo số lượng công cụ, khả năng hỗ trợ tài nguyên/lời nhắc, khả năng hỗ trợ thay đổi danh sách và thông tin chẩn đoán.
- `add` chấp nhận các cờ stdio như `--command`, `--arg`, `--env` và `--cwd`, hoặc các cờ HTTP như `--url`, `--transport`, `--header`, `--auth oauth`, cùng các cờ TLS, thời gian chờ và lựa chọn công cụ.
- `set` yêu cầu một giá trị đối tượng JSON trên dòng lệnh.
- `configure` cập nhật trạng thái bật, bộ lọc công cụ, thời gian chờ, OAuth, TLS và gợi ý gọi công cụ song song mà không thay thế toàn bộ định nghĩa máy chủ. Thêm `--probe` để xác minh máy chủ đã cập nhật trước khi lưu.
- `tools` cập nhật bộ lọc công cụ theo từng máy chủ. Các mục bao gồm/loại trừ là tên công cụ MCP và các mẫu glob `*` đơn giản.
- `login` chạy luồng OAuth cho các máy chủ HTTP được cấu hình với `auth: "oauth"`. Lần chạy đầu tiên in ra URL ủy quyền; chạy lại với `--code` sau khi phê duyệt.
- `logout` xóa thông tin xác thực OAuth đã lưu cho máy chủ được chỉ định mà không xóa định nghĩa máy chủ đã lưu.
- `reload` giải phóng các runtime MCP trong tiến trình được lưu vào bộ nhớ đệm chỉ cho tiến trình CLI hiện tại. Các tiến trình Gateway hoặc tác tử trong tiến trình khác vẫn cần đường dẫn tải lại hoặc khởi động lại riêng.
- Sử dụng `transport: "streamable-http"` cho các máy chủ MCP Streamable HTTP. `openclaw mcp set` cũng chuẩn hóa `type: "http"` nguyên bản của CLI thành cùng dạng cấu hình chuẩn để đảm bảo khả năng tương thích.
- `unset` thất bại nếu máy chủ được chỉ định không tồn tại.

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

### Các cấu hình máy chủ phổ biến

Các ví dụ này chỉ lưu định nghĩa máy chủ. Sau đó, chạy `openclaw mcp doctor --probe` để xác minh rằng máy chủ khởi động và cung cấp các công cụ.

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

    Giới hạn máy chủ hệ thống tệp trong cây thư mục nhỏ nhất mà agent cần đọc hoặc chỉnh sửa.

  </Tab>
  <Tab title="Bộ nhớ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sử dụng bộ lọc công cụ nếu máy chủ cung cấp các công cụ ghi mà agent thông thường không nên được phép dùng.

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

    `doctor` kiểm tra rằng `cwd` tồn tại và lệnh có thể được phân giải từ môi trường đã cấu hình.

  </Tab>
  <Tab title="HTTP từ xa">
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

    Sử dụng OAuth khi máy chủ từ xa hỗ trợ. Nếu máy chủ yêu cầu header tĩnh, tránh commit trực tiếp bearer token.

  </Tab>
  <Tab title="Máy tính để bàn/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Máy chủ điều khiển trực tiếp máy tính để bàn kế thừa quyền của tiến trình mà chúng khởi chạy. Sử dụng bộ lọc công cụ hạn chế và lời nhắc cấp quyền ở cấp hệ điều hành.

  </Tab>
</Tabs>

### Cấu trúc đầu ra JSON

Sử dụng `--json` cho tập lệnh và bảng điều khiển. Tập hợp trường có thể mở rộng theo thời gian, vì vậy phía sử dụng nên bỏ qua các khóa không xác định.

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
            "requiresAuthorization": false,
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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Thông tin xác thực OAuth chưa được cấp quyền; hãy chạy openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` thoát với mã khác 0 khi bất kỳ máy chủ đã bật và được kiểm tra nào có sự cố cấp `error`. Các sự cố `warning` và `info` được báo cáo nhưng tự chúng không khiến lệnh thất bại.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` mở một phiên máy khách MCP trực tiếp và in thẳng kết quả; không giống `status`/`doctor`, đầu ra không có trường `path` ở cấp cao nhất. Các khóa `resources` và `prompts` chỉ xuất hiện khi máy chủ thực sự công bố khả năng đó (máy chủ không có prompt sẽ bỏ qua khóa `prompts` thay vì báo cáo `false`). Sử dụng `probe` để chứng minh khả năng kết nối và các khả năng được hỗ trợ, không dùng để kiểm tra cấu hình tĩnh.

  </Accordion>
</AccordionGroup>

Ví dụ về cấu trúc cấu hình:

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
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
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

### Giao thức truyền tải Stdio

Khởi chạy một tiến trình con cục bộ và giao tiếp qua stdin/stdout.

| Trường                      | Mô tả                              |
| -------------------------- | --------------------------------- |
| `command`                  | Tệp thực thi cần khởi chạy (bắt buộc) |
| `args`                     | Mảng đối số dòng lệnh             |
| `env`                      | Các biến môi trường bổ sung       |
| `cwd` / `workingDirectory` | Thư mục làm việc của tiến trình   |

<Warning>
**Bộ lọc an toàn cho biến môi trường Stdio**

OpenClaw từ chối các khóa biến môi trường khởi động trình thông dịch, chiếm quyền trình nạp và khởi tạo shell trước khi khởi chạy máy chủ MCP stdio, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Cơ chế này sử dụng cùng chính sách bảo mật môi trường máy chủ như các tiến trình khác do OpenClaw khởi chạy: nó chặn các hook khởi động trình thông dịch đã biết (ví dụ `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), các tiền tố chèn thư viện dùng chung và hàm (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) cùng các biến kiểm soát runtime tương tự. Khi khởi động, các biến này bị loại bỏ âm thầm và một cảnh báo được ghi nhật ký để chúng không thể chèn phần mở đầu ngầm, thay trình thông dịch, bật trình gỡ lỗi hoặc chiếm quyền trình liên kết động đối với tiến trình stdio. Danh sách cho phép rõ ràng duy trì khả năng sử dụng các biến môi trường thông tin xác thực MCP thông thường (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), cùng các biến môi trường proxy và biến dành riêng cho máy chủ thông thường (`HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.). Các khóa `AWS_*` khác như `AWS_CONFIG_FILE` và `AWS_SHARED_CREDENTIALS_FILE` vẫn bị chặn vì chúng trỏ đến tệp thông tin xác thực thay vì trực tiếp chứa giá trị thông tin xác thực.

Nếu máy chủ MCP thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì trong `env` của máy chủ stdio.
</Warning>

### Giao thức truyền tải SSE / HTTP

Kết nối với máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                       | Mô tả                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `url`                       | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                 |
| `headers`                   | Ánh xạ khóa-giá trị tùy chọn của các header HTTP (ví dụ token xác thực) |
| `connectionTimeoutMs`       | Thời gian chờ kết nối riêng cho từng máy chủ, tính bằng ms (tùy chọn) |
| `requestTimeoutMs`          | Thời gian chờ yêu cầu MCP riêng cho từng máy chủ, tính bằng mili giây |
| `auth: "oauth"`             | Sử dụng thông tin xác thực MCP OAuth được lưu bởi `openclaw mcp login` |
| `sslVerify`                 | Chỉ đặt thành false cho các endpoint HTTPS riêng tư được tin cậy rõ ràng |
| `clientCert` / `clientKey`  | Đường dẫn chứng chỉ và khóa máy khách mTLS                        |
| `supportsParallelToolCalls` | Gợi ý rằng các lệnh gọi đồng thời là an toàn đối với máy chủ này |

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Các giá trị nhạy cảm trong `url` (thông tin người dùng) và `headers` được che trong nhật ký và đầu ra trạng thái. `openclaw mcp doctor` cảnh báo khi các mục `headers` hoặc `env` có vẻ nhạy cảm chứa giá trị trực tiếp, để người vận hành có thể chuyển các giá trị đó ra khỏi cấu hình đã commit.

### Quy trình OAuth

OAuth dành cho các máy chủ MCP HTTP công bố luồng OAuth của MCP. Các header `Authorization` tĩnh bị bỏ qua đối với máy chủ khi `auth: "oauth"` được bật. Thông tin xác thực được lưu bởi `openclaw mcp login` hoạt động với MCP nhúng, trình chạy CLI và app-server Codex cục bộ.

Các phiên OAuth MCP gốc nằm trong cơ sở dữ liệu SQLite dùng chung chỉ chủ sở hữu mới có quyền truy cập tại `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`). Hàng dữ liệu có thể chứa token truy cập và token làm mới, secret đăng ký máy khách động, siêu dữ liệu khám phá và trình xác minh PKCE tạm thời. Các thao tác làm mới, đăng nhập và đăng xuất sử dụng cùng một lease SQLite, vì vậy các tiến trình OpenClaw song song không thể sử dụng cùng một token làm mới hoặc khôi phục một phiên đã đăng xuất.

Việc nâng cấp từ kho lưu trữ `<state-dir>/mcp-oauth/*.json` đã ngừng sử dụng chỉ do `openclaw doctor --fix` xử lý. Mã runtime không bao giờ đọc, ghi hoặc dự phòng về các tệp đó.

Cho đến khi có thông tin xác thực, OpenClaw chỉ loại máy chủ MCP đó khỏi runtime của agent thay vì làm lượt agent thất bại. Sau đó, người vận hành hoặc agent có quyền truy cập shell có thể chạy `openclaw mcp login <name>` và sử dụng máy chủ trong một lượt sau.

Nếu máy chủ từ chối token bằng `insufficient_scope`, OpenClaw giữ nguyên phạm vi được yêu cầu và yêu cầu `openclaw mcp login <name>` thay vì lặp lại thao tác làm mới vốn không thể cấp phạm vi mới. Lần đăng nhập đó bắt đầu một yêu cầu cấp quyền mới trong khi vẫn giữ token trước đó cho đến khi thông tin xác thực thay thế được lưu.

Khi dịch vụ MCP từ xa đã được hỗ trợ bởi một hồ sơ xác thực OpenClaw riêng có khả năng làm mới, bạn có thể tùy chọn đặt `oauth.authProfileId`. OpenClaw làm mới một trong hai nguồn thông tin xác thực trước khi chiếu vào runtime và chỉ chuyển token truy cập hiện tại cho máy khách MCP phía sau.

<Steps>
  <Step title="Lưu máy chủ">
    Thêm hoặc cập nhật máy chủ bằng `auth: "oauth"` và mọi siêu dữ liệu OAuth tùy chọn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Đối với bearer được hỗ trợ bởi hồ sơ xác thực, hãy lưu liên kết hồ sơ:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Bắt đầu đăng nhập">
    Chạy lệnh đăng nhập để tạo yêu cầu ủy quyền.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw in URL ủy quyền và lưu trạng thái trình xác minh OAuth tạm thời trong SQLite dùng chung.

  </Step>
  <Step title="Hoàn tất bằng mã">
    Sau khi phê duyệt trong trình duyệt, hãy chuyển mã được trả về lại cho OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Kiểm tra ủy quyền">
    Sử dụng trạng thái hoặc doctor để xác nhận token hiện diện và không yêu cầu ủy quyền bổ sung. Nếu trạng thái báo `authorization-required` hoặc doctor yêu cầu ủy quyền bổ sung, hãy chạy lại `openclaw mcp login <name>`.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Xóa thông tin xác thực">
    Đăng xuất sẽ xóa thông tin xác thực OAuth đã lưu nhưng giữ lại định nghĩa máy chủ đã lưu.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Nếu nhà cung cấp luân chuyển token hoặc trạng thái ủy quyền bị kẹt, hãy chạy `openclaw mcp logout <name>`, rồi lặp lại `login`. `logout` có thể xóa thông tin xác thực của một máy chủ HTTP đã lưu ngay cả sau khi `auth: "oauth"` đã bị xóa khỏi cấu hình, miễn là tên và URL của máy chủ vẫn xác định được mục trong kho thông tin xác thực.

### Phương thức truyền tải HTTP có thể phát trực tiếp

`streamable-http` là một tùy chọn phương thức truyền tải bổ sung bên cạnh `sse` và `stdio`. Tùy chọn này sử dụng luồng HTTP để giao tiếp hai chiều với các máy chủ MCP từ xa.

| Trường                       | Mô tả                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                      |
| `transport`                 | Đặt thành `"streamable-http"` để chọn phương thức truyền tải này; khi bỏ qua, OpenClaw sử dụng `sse` |
| `headers`                   | Ánh xạ khóa-giá trị tùy chọn của các tiêu đề HTTP (ví dụ: token xác thực)                       |
| `connectionTimeoutMs`       | Thời gian chờ kết nối của từng máy chủ tính bằng ms (tùy chọn)                                         |
| `requestTimeoutMs`          | Thời gian chờ yêu cầu MCP của từng máy chủ tính bằng mili giây                                         |
| `auth: "oauth"`             | Sử dụng thông tin xác thực OAuth MCP được lưu bởi `openclaw mcp login`                                |
| `sslVerify`                 | Chỉ đặt thành false đối với các điểm cuối HTTPS riêng tư được tin cậy rõ ràng                          |
| `clientCert` / `clientKey`  | Đường dẫn chứng chỉ và khóa máy khách mTLS                                                  |
| `supportsParallelToolCalls` | Gợi ý rằng các lệnh gọi đồng thời là an toàn đối với máy chủ này                                    |

Cấu hình OpenClaw sử dụng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị MCP `type: "http"` gốc của CLI được chấp nhận khi lưu thông qua `openclaw mcp set` và được `openclaw doctor --fix` sửa trong cấu hình hiện có, nhưng `transport` là giá trị mà OpenClaw nhúng sử dụng trực tiếp.

Ví dụ:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Các lệnh registry không khởi động cầu nối kênh. Chỉ `probe` và `doctor --probe` mở một phiên máy khách MCP trực tiếp để chứng minh máy chủ đích có thể truy cập được.
</Note>

## Giao diện điều khiển

Giao diện điều khiển trên trình duyệt có một trang cài đặt MCP chuyên dụng tại `/settings/mcp`; đường dẫn `/mcp` trước đây vẫn là bí danh. Trang này hiển thị số lượng máy chủ đã cấu hình, bản tóm tắt về trạng thái bật/OAuth/bộ lọc, các hàng phương thức truyền tải theo từng máy chủ, điều khiển bật/tắt, các lệnh CLI phổ biến và trình chỉnh sửa có phạm vi cho phần cấu hình `mcp`.

Sử dụng trang này để người vận hành chỉnh sửa và kiểm kê nhanh. Sử dụng `openclaw mcp doctor --probe` hoặc `openclaw mcp probe` khi cần bằng chứng trực tiếp về máy chủ.

Quy trình làm việc của người vận hành:

1. Mở Giao diện điều khiển và chọn **MCP**.
2. Xem lại các thẻ tóm tắt về tổng số máy chủ, máy chủ đã bật, OAuth và máy chủ đã lọc.
3. Sử dụng từng hàng máy chủ để xem gợi ý về phương thức truyền tải, xác thực, bộ lọc, thời gian chờ và lệnh.
4. Chuyển đổi trạng thái bật khi muốn giữ lại một định nghĩa nhưng loại trừ định nghĩa đó khỏi quá trình khám phá khi chạy.
5. Chỉnh sửa phần cấu hình `mcp` có phạm vi để thực hiện các thay đổi cấu trúc như thêm máy chủ mới, tiêu đề, TLS, siêu dữ liệu OAuth hoặc bộ lọc công cụ.
6. Chọn **Lưu** để chỉ lưu cấu hình, hoặc **Lưu và phát hành** để áp dụng thông qua đường dẫn cấu hình Gateway.
7. Chạy `openclaw mcp doctor --probe` khi cần bằng chứng trực tiếp rằng máy chủ đã chỉnh sửa khởi động và liệt kê các công cụ.

Lưu ý:

- các đoạn lệnh đặt tên máy chủ trong dấu ngoặc kép để các tên khác thường vẫn có thể sao chép được trong shell
- các giá trị giống URL được hiển thị sẽ được che trước khi kết xuất nếu chứa thông tin xác thực nhúng
- trang này không tự khởi động các phương thức truyền tải MCP
- các runtime đang hoạt động có thể cần `openclaw mcp reload`, phát hành cấu hình Gateway hoặc khởi động lại tiến trình, tùy thuộc vào tiến trình nào sở hữu các máy khách MCP

## Ứng dụng MCP

OpenClaw có thể kết xuất các công cụ triển khai [tiện ích mở rộng MCP Apps](https://modelcontextprotocol.io/extensions/apps) ổn định. Ứng dụng yêu cầu bật rõ ràng vì HTML của chúng đến từ máy chủ MCP đã cấu hình và có thể yêu cầu các công cụ hoặc tài nguyên hiển thị với ứng dụng từ chính máy chủ đó.

Bật cầu nối máy chủ:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Khởi động lại Gateway sau khi thay đổi cài đặt này. Khi được bật, OpenClaw khởi động một trình lắng nghe HTTP(S) chỉ dành cho sandbox trên cổng Gateway cộng thêm một (đối với Gateway mặc định là `18790`). Giao diện điều khiển tải Ứng dụng từ nguồn gốc riêng biệt đó; trình lắng nghe không bao giờ phục vụ Giao diện điều khiển, các tuyến Gateway đã xác thực hoặc dữ liệu người dùng.

Các kết nối Gateway trực tiếp cần truy cập cả hai cổng. Nếu proxy ngược hoặc trình kết thúc TLS cung cấp Giao diện điều khiển, hãy cấp cho Ứng dụng một nguồn gốc công khai chuyên dụng và chỉ proxy nguồn gốc đó đến trình lắng nghe sandbox:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Nguồn gốc sandbox phải khác với nguồn gốc Giao diện điều khiển. Không lưu trữ nội dung đã xác thực hoặc nhạy cảm khác trên đó.

Ví dụ, bản demo React cơ bản chính thức có thể được cấu hình như sau:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Ranh giới hành vi và bảo mật:

- OpenClaw chỉ quảng bá tiện ích mở rộng `io.modelcontextprotocol/ui` khi Ứng dụng được bật.
- Chỉ các tài nguyên `ui://` có chính xác loại MIME `text/html;profile=mcp-app` mới được kết xuất.
- Tài nguyên giao diện người dùng bị giới hạn ở 2 MiB, được đặt sau proxy iframe kép trên một nguồn gốc bên ngoài chuyên dụng, được tải vào một nguồn gốc Ứng dụng bên trong mờ đục và bị ràng buộc bởi CSP được suy ra từ siêu dữ liệu tài nguyên.
- Các công cụ chỉ dành cho Ứng dụng (`_meta.ui.visibility: ["app"]`) không xuất hiện trong danh sách công cụ của mô hình. Ứng dụng chỉ có thể gọi các công cụ hiển thị với ứng dụng trên máy chủ sở hữu của mình, đồng thời các công cụ đó phải vượt qua chính sách công cụ OpenClaw có hiệu lực cho lượt chạy đã tạo chế độ xem.
- Các quyền Ứng dụng ràng buộc theo nguồn gốc như camera, micrô và vị trí địa lý không được cấp khi các tài liệu Ứng dụng bên trong sử dụng nguồn gốc mờ đục để cách ly giữa các Ứng dụng.
- HTML của Ứng dụng, đối số công cụ đầy đủ và kết quả thô tồn tại trong một hợp đồng thuê chế độ xem trong bộ nhớ có giới hạn mười phút, không được ghi vào đĩa hoặc sao chép vào siêu dữ liệu bản xem trước bản ghi. Bản ghi chỉ lưu một bộ mô tả máy chủ/công cụ/tài nguyên có giới hạn, gắn với ID lệnh gọi công cụ ban đầu. Sau khi Gateway khởi động lại, Giao diện điều khiển có thể xác minh bộ mô tả đó dựa trên bản ghi phiên đã xác thực và tìm nạp lại tài nguyên `ui://`; các chế độ xem được tái tạo chỉ có thể đọc cho đến khi một lượt chạy mới thiết lập các quyền công cụ hiện tại.
- Trong các cuộc trò chuyện qua kênh, chế độ xem Ứng dụng thành công gần nhất trong một lượt sẽ thêm một hành động kiểu **Mở ứng dụng** vào câu trả lời cuối cùng của trợ lý. Tin nhắn riêng Telegram sử dụng nút Mini App gốc; Slack và Discord kết xuất cùng hành động di động đó dưới dạng liên kết. Các kênh khác giữ nguyên văn bản trả lời ban đầu và nối thêm một liên kết HTTPS dễ hiểu.
- Các liên kết khởi chạy qua kênh chỉ khả dụng khi việc công khai Gateway qua Tailscale đã chuẩn bị một nguồn gốc HTTPS được phát hành. `gateway.tailscale.mode: "serve"` chỉ có thể truy cập từ tailnet; `"funnel"` có thể truy cập từ internet công cộng. Một Funnel do bên ngoài quản lý và được `gateway.tailscale.preserveFunnel` giữ nguyên cũng được xem là có thể truy cập từ internet. Xem [Tailscale](/vi/gateway/tailscale).
- Vé khởi chạy là dữ liệu mờ đục, chỉ được tạo khi hiện thực hóa câu trả lời cuối cùng qua kênh và hết hạn sau tối đa hai phút hoặc khi hợp đồng thuê chế độ xem nền tảng hết hạn, tùy điều kiện nào đến trước. URL không chứa thông tin xác thực bearer của Gateway, khóa phiên, siêu dữ liệu chế độ xem, HTML của Ứng dụng, đầu vào công cụ hoặc kết quả công cụ.
- Nếu không có nguồn gốc đã phát hành hoặc không còn dung lượng vé, chế độ xem hay vé đã hết hạn, hoặc phương thức truyền tải không thể kết xuất điều khiển gốc, văn bản trợ lý ban đầu vẫn khả dụng. Giao diện điều khiển giữ nguyên canvas Ứng dụng nội tuyến hiện có và không nhận hành động khởi chạy trùng lặp.
- `openclaw security audit` cảnh báo khi cầu nối được bật. Hãy tắt bằng `openclaw config set mcp.apps.enabled false --strict-json` khi không cần thiết.

## Các giới hạn hiện tại

Trang này mô tả cầu nối như được phát hành hiện nay.

Các giới hạn hiện tại:

- việc khám phá cuộc trò chuyện phụ thuộc vào siêu dữ liệu tuyến phiên Gateway hiện có
- không có giao thức đẩy chung ngoài bộ điều hợp dành riêng cho Claude
- chưa có công cụ chỉnh sửa hoặc bày tỏ cảm xúc với tin nhắn
- phương thức truyền tải HTTP/SSE/streamable-http kết nối với một máy chủ từ xa duy nhất; chưa hỗ trợ ghép kênh ngược dòng
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát trong khi cầu nối được kết nối

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Plugin](/vi/cli/plugins)
