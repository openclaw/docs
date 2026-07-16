---
read_when:
    - Kết nối Codex, Claude Code hoặc một MCP client khác với các kênh được OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Cung cấp các cuộc hội thoại trên kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-07-16T15:04:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai chức năng:

- chạy OpenClaw dưới dạng máy chủ MCP bằng `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP gửi đi do OpenClaw quản lý bằng `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` và `unset`

`serve` là OpenClaw hoạt động dưới dạng máy chủ MCP. Các lệnh con khác là OpenClaw hoạt động dưới dạng sổ đăng ký phía máy khách MCP cho những máy chủ mà các runtime của chính OpenClaw có thể sử dụng sau này.

<Note>
  `list`, `show`, `set` và `unset` chỉ đọc và ghi các mục `mcp.servers` do OpenClaw quản lý trong cấu hình OpenClaw. Chúng không bao gồm các máy chủ mcporter từ `config/mcporter.json`; hãy dùng `mcporter list` cho sổ đăng ký đó.
</Note>

Dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ một phiên bộ công cụ lập trình và định tuyến runtime đó qua ACP.

## Chọn đường dẫn MCP phù hợp

| Mục tiêu                                                                | Sử dụng                                                                  | Lý do                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Cho phép máy khách MCP bên ngoài đọc/gửi các cuộc trò chuyện trên kênh OpenClaw | `openclaw mcp serve`                                                 | OpenClaw là máy chủ MCP và cung cấp các cuộc trò chuyện được Gateway hỗ trợ qua stdio.                                 |
| Lưu các máy chủ MCP của bên thứ ba cho các lượt chạy tác tử do OpenClaw quản lý        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw là sổ đăng ký phía máy khách MCP và sau đó ánh xạ các máy chủ đó vào những runtime đủ điều kiện.               |
| Kiểm tra máy chủ đã lưu mà không chạy lượt tác tử                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` và `doctor` kiểm tra cấu hình; `probe` mở kết nối MCP trực tiếp và liệt kê các khả năng.               |
| Chỉnh sửa cấu hình MCP từ trình duyệt                                      | Giao diện điều khiển `/settings/mcp` (bí danh `/mcp`)                            | Trang này hiển thị danh mục, trạng thái bật, tóm tắt OAuth/bộ lọc, gợi ý lệnh và trình chỉnh sửa `mcp` có phạm vi.         |
| Cung cấp cho Codex app-server một máy chủ MCP gốc có phạm vi                    | `mcp.servers.<name>.codex`                                           | Khối `codex` chỉ ảnh hưởng đến việc ánh xạ luồng Codex app-server và bị loại bỏ trước khi chuyển giao cấu hình gốc. |
| Chạy các phiên bộ công cụ do ACP lưu trữ                                     | [`openclaw acp`](/vi/cli/acp) và [Tác tử ACP](/vi/tools/acp-agents-setup) | Chế độ cầu nối ACP không chấp nhận việc chèn máy chủ MCP theo từng phiên; hãy cấu hình cầu nối Gateway/Plugin thay thế.     |

<Tip>
Nếu chưa chắc cần đường dẫn nào, hãy bắt đầu với `openclaw mcp status --verbose`. Lệnh này hiển thị những gì OpenClaw đã lưu mà không khởi động bất kỳ máy chủ MCP nào.
</Tip>

## OpenClaw dưới dạng máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào nên dùng serve

Dùng `openclaw mcp serve` khi:

- Codex, Claude Code hoặc một máy khách MCP khác cần giao tiếp trực tiếp với các cuộc trò chuyện trên kênh được OpenClaw hỗ trợ
- đã có Gateway OpenClaw cục bộ hoặc từ xa với các phiên được định tuyến
- cần một máy chủ MCP hoạt động trên mọi phần phụ trợ kênh của OpenClaw thay vì chạy các cầu nối riêng cho từng kênh

Thay vào đó, hãy dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ runtime lập trình và giữ phiên tác tử bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Trong khi máy khách giữ phiên stdio mở, cầu nối kết nối với Gateway OpenClaw cục bộ hoặc từ xa qua WebSocket và cung cấp các cuộc trò chuyện trên kênh đã định tuyến qua MCP.

<Steps>
  <Step title="Máy khách khởi chạy cầu nối">
    Máy khách MCP khởi chạy `openclaw mcp serve`.
  </Step>
  <Step title="Cầu nối kết nối với Gateway">
    Cầu nối kết nối với Gateway OpenClaw qua WebSocket.
  </Step>
  <Step title="Các phiên trở thành cuộc trò chuyện MCP">
    Các phiên đã định tuyến trở thành cuộc trò chuyện MCP cùng các công cụ bản ghi/lịch sử.
  </Step>
  <Step title="Các sự kiện trực tiếp được đưa vào hàng đợi">
    Các sự kiện trực tiếp được đưa vào hàng đợi trong bộ nhớ khi cầu nối đang kết nối.
  </Step>
  <Step title="Tùy chọn đẩy Claude">
    Nếu chế độ kênh Claude được bật, cùng một phiên cũng có thể nhận thông báo đẩy dành riêng cho Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - trạng thái hàng đợi trực tiếp bắt đầu khi cầu nối kết nối
    - lịch sử bản ghi cũ hơn được đọc bằng `messages_read`
    - thông báo đẩy Claude chỉ tồn tại khi phiên MCP còn hoạt động
    - khi máy khách ngắt kết nối, cầu nối thoát và hàng đợi trực tiếp bị xóa
    - các điểm vào tác tử một lần như `openclaw agent` và `openclaw infer model run` dừng mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, nhờ đó các lượt chạy bằng tập lệnh lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy (đi kèm hoặc do người dùng cấu hình) được dừng dưới dạng cây tiến trình khi tắt, để các tiến trình con do máy chủ khởi động không tiếp tục tồn tại sau khi máy khách stdio mẹ thoát
    - việc xóa hoặc đặt lại một phiên sẽ giải phóng các máy khách MCP của phiên đó thông qua đường dẫn dọn dẹp runtime dùng chung, vì vậy không còn kết nối stdio tồn đọng gắn với phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

<Tabs>
  <Tab title="Máy khách MCP thông thường">
    Chỉ có các công cụ MCP tiêu chuẩn. Dùng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` và các công cụ phê duyệt.
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

Điều này cung cấp cho máy khách MCP một nơi để:

- liệt kê các cuộc trò chuyện được định tuyến gần đây
- đọc lịch sử bản ghi gần đây
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
    Đọc các thông điệp bản ghi gần đây của một cuộc trò chuyện được phiên hỗ trợ. `limit` mặc định là 20, tối đa 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung thông điệp không phải văn bản từ một thông điệp bản ghi. Đây là chế độ xem siêu dữ liệu trên nội dung bản ghi, không phải kho blob tệp đính kèm bền vững độc lập.
  </Accordion>
  <Accordion title="events_poll">
    Đọc các sự kiện trực tiếp trong hàng đợi kể từ một con trỏ dạng số. `limit` tối đa 200.
  </Accordion>
  <Accordion title="events_wait">
    Thực hiện long-poll cho đến khi sự kiện tiếp theo phù hợp trong hàng đợi xuất hiện hoặc hết thời gian chờ (mặc định 30s, tối đa 300s).

    Dùng công cụ này khi máy khách MCP thông thường cần phân phối gần thời gian thực mà không có giao thức đẩy dành riêng cho Claude.

  </Accordion>
  <Accordion title="messages_send">
    Gửi văn bản trở lại qua cùng tuyến đã được ghi trên phiên.

    Hành vi hiện tại:

    - yêu cầu một tuyến cuộc trò chuyện hiện có
    - sử dụng kênh, người nhận, id tài khoản và id luồng của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt exec/Plugin đang chờ mà cầu nối đã quan sát được kể từ khi kết nối với Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt exec/Plugin đang chờ bằng:

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
- hàng đợi chỉ dành cho dữ liệu trực tiếp; hàng đợi bắt đầu khi cầu nối MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- dữ liệu tồn đọng bền vững nên được đọc bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Cầu nối cũng có thể cung cấp các thông báo kênh dành riêng cho Claude. Đây là thành phần tương đương với bộ điều hợp kênh Claude Code của OpenClaw: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng thông điệp trực tiếp đến cũng có thể xuất hiện dưới dạng thông báo MCP dành riêng cho Claude.

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

Khi chế độ kênh Claude được bật, máy chủ quảng bá các khả năng thử nghiệm của Claude và có thể phát:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Hành vi cầu nối hiện tại:

- các thông điệp bản ghi `user` đến được chuyển tiếp dưới dạng `notifications/claude/channel`
- các yêu cầu quyền Claude nhận được qua MCP được theo dõi trong bộ nhớ
- nếu chủ sở hữu lệnh trong cuộc trò chuyện được liên kết sau đó gửi `yes <id>` hoặc `no <id>` (`<id>` là id yêu cầu gồm 5 chữ cái, không bao gồm `l`), cầu nối sẽ chuyển đổi thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối thì không còn đích đẩy

Đây là hành vi dành riêng cho máy khách theo chủ đích. Máy khách MCP thông thường nên dựa vào các công cụ thăm dò tiêu chuẩn.

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

Đối với hầu hết các máy khách MCP thông dụng, hãy bắt đầu với bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude.

### Tùy chọn

`openclaw mcp serve` hỗ trợ:

<ParamField path="--url" type="string">
  URL WebSocket của Gateway. Mặc định là `gateway.remote.url` khi được cấu hình.
</ParamField>
<ParamField path="--token" type="string">
  Token của Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Đọc token từ tệp.
</ParamField>
<ParamField path="--password" type="string">
  Mật khẩu của Gateway.
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
Khi có thể, nên dùng `--token-file` hoặc `--password-file` thay vì đặt bí mật trực tiếp.
</Tip>

### Ranh giới bảo mật và tin cậy

Cầu nối không tự tạo định tuyến. Nó chỉ hiển thị các cuộc hội thoại mà Gateway đã biết cách định tuyến.

Điều đó có nghĩa là:

- danh sách cho phép người gửi, ghép nối và mức độ tin cậy ở cấp kênh vẫn thuộc về cấu hình kênh OpenClaw bên dưới
- `messages_send` chỉ có thể trả lời thông qua một tuyến đã được lưu
- trạng thái phê duyệt chỉ tồn tại trực tiếp/trong bộ nhớ cho phiên cầu nối hiện tại
- xác thực cầu nối nên sử dụng cùng các biện pháp kiểm soát token hoặc mật khẩu Gateway mà bạn tin dùng cho bất kỳ máy khách Gateway từ xa nào khác

Nếu một cuộc hội thoại không xuất hiện trong `conversations_list`, nguyên nhân thường không phải là cấu hình MCP. Nguyên nhân là siêu dữ liệu tuyến bị thiếu hoặc chưa đầy đủ trong phiên Gateway bên dưới.

### Kiểm thử

OpenClaw cung cấp một phép kiểm tra nhanh Docker có tính xác định cho cầu nối này:

```bash
pnpm test:docker:mcp-channels
```

Phép kiểm tra nhanh đó chạy một vùng chứa duy nhất: nó khởi tạo trạng thái hội thoại, khởi động Gateway, sau đó tạo `openclaw mcp serve` dưới dạng tiến trình con stdio và điều khiển tiến trình này như một máy khách MCP. Nó xác minh việc khám phá cuộc hội thoại, đọc bản chép lời, đọc siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, cùng các thông báo về kênh và quyền theo kiểu Claude qua cầu nối MCP stdio thực. Việc định tuyến gửi đi (`messages_send` tái sử dụng tuyến hội thoại đã lưu) được kiểm thử riêng bằng các bài kiểm thử đơn vị trong `src/mcp/channel-server.test.ts`.

Đây là cách nhanh nhất để chứng minh cầu nối hoạt động mà không cần đưa tài khoản Telegram, Discord hoặc iMessage thực vào lần chạy kiểm thử.

Để biết bối cảnh kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không trả về cuộc hội thoại nào">
    Thường có nghĩa là phiên Gateway chưa thể định tuyến. Hãy xác nhận rằng phiên bên dưới đã lưu siêu dữ liệu tuyến gồm kênh/nhà cung cấp, người nhận và tài khoản/luồng tùy chọn.
  </Accordion>
  <Accordion title="events_poll hoặc events_wait bỏ sót các tin nhắn cũ hơn">
    Đây là hành vi dự kiến. Hàng đợi trực tiếp bắt đầu khi cầu nối kết nối. Đọc lịch sử bản chép lời cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Thông báo Claude không xuất hiện">
    Hãy kiểm tra tất cả các điều sau:

    - máy khách đã giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude
    - tin nhắn đến xuất hiện sau khi cầu nối kết nối

  </Accordion>
  <Accordion title="Thiếu yêu cầu phê duyệt">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát trong khi cầu nối đang kết nối. Đây không phải là API lịch sử phê duyệt bền vững.
  </Accordion>
</AccordionGroup>

## OpenClaw dưới dạng sổ đăng ký máy khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` và `unset`.

Các lệnh này không cung cấp OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP do OpenClaw quản lý trong `mcp.servers` của cấu hình OpenClaw. Chúng không đọc các máy chủ mcporter từ `config/mcporter.json`.

Các định nghĩa đã lưu này dành cho những runtime mà OpenClaw sẽ khởi chạy hoặc cấu hình sau này, chẳng hạn như OpenClaw nhúng và các bộ điều hợp runtime khác. OpenClaw lưu trữ tập trung các định nghĩa để các runtime đó không phải duy trì danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - `status`, `list`, `show`, `doctor` không có `--probe`, `set`, `configure`, `tools`, `logout`, `reload` và `unset` sẽ không kết nối với máy chủ MCP đích
    - `login` thực hiện luồng mạng OAuth MCP cho máy chủ HTTP đã cấu hình và lưu thông tin xác thực cục bộ thu được
    - `status --verbose` in ra các gợi ý đã phân giải về phương thức truyền tải, xác thực, thời gian chờ, bộ lọc và lệnh gọi công cụ song song mà không kết nối
    - `doctor` kiểm tra các định nghĩa đã lưu để tìm các vấn đề thiết lập cục bộ như thiếu lệnh stdio, thư mục làm việc không hợp lệ, thiếu tệp TLS, máy chủ bị vô hiệu hóa, giá trị tiêu đề/biến môi trường nhạy cảm ở dạng văn bản thuần và việc ủy quyền OAuth chưa hoàn tất
    - `doctor --probe` bổ sung cùng bằng chứng kết nối trực tiếp như `probe` sau khi các bước kiểm tra tĩnh thành công
    - `probe` kết nối với máy chủ đã chọn hoặc tất cả máy chủ đã cấu hình, liệt kê công cụ và báo cáo khả năng/chẩn đoán
    - `add` tạo một định nghĩa từ các cờ và thăm dò trước khi lưu, trừ khi `--no-probe` được đặt hoặc trước tiên cần ủy quyền OAuth
    - các bộ điều hợp runtime quyết định hình dạng phương thức truyền tải nào mà chúng thực sự hỗ trợ tại thời điểm thực thi
    - `enabled: false` giữ máy chủ ở trạng thái đã lưu nhưng loại máy chủ đó khỏi quá trình khám phá runtime nhúng
    - `timeout` và `connectTimeout` đặt thời gian chờ yêu cầu và kết nối theo từng máy chủ, tính bằng giây
    - `supportsParallelToolCalls: true` đánh dấu các máy chủ mà bộ điều hợp có thể gọi đồng thời
    - máy chủ HTTP có thể sử dụng tiêu đề tĩnh, đăng nhập OAuth, kiểm soát xác minh TLS và đường dẫn chứng chỉ/khóa mTLS
    - OpenClaw nhúng hiển thị các công cụ MCP đã cấu hình trong các hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng và `tools.deny: ["bundle-mcp"]` vô hiệu hóa chúng một cách rõ ràng
    - `toolFilter.include` và `toolFilter.exclude` theo từng máy chủ lọc các công cụ MCP được khám phá trước khi chúng trở thành công cụ OpenClaw
    - các máy chủ quảng bá tài nguyên hoặc prompt cũng hiển thị các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/truy xuất prompt; các tên tiện ích được tạo đó (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) sử dụng cùng bộ lọc bao gồm/loại trừ
    - các thay đổi động đối với danh sách công cụ MCP làm mất hiệu lực danh mục đã lưu vào bộ nhớ đệm cho phiên đó; lần khám phá/sử dụng tiếp theo sẽ làm mới từ máy chủ
    - các lỗi yêu cầu/giao thức công cụ MCP lặp lại sẽ tạm dừng máy chủ đó trong thời gian ngắn để một máy chủ bị lỗi không tiêu tốn toàn bộ lượt
    - các runtime MCP đi kèm có phạm vi phiên sẽ bị thu hồi sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10 phút; đặt `0` để vô hiệu hóa) và các lần chạy nhúng một lần sẽ dọn dẹp chúng khi kết thúc lượt chạy

  </Accordion>
</AccordionGroup>

Các bộ điều hợp runtime có thể chuẩn hóa sổ đăng ký dùng chung này thành hình dạng mà máy khách hạ nguồn của chúng yêu cầu. Ví dụ: OpenClaw nhúng sử dụng trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` gốc của CLI như `http`, `sse` hoặc `stdio`.

Codex app-server cũng tuân theo một khối `codex` tùy chọn trên mỗi máy chủ. Đây là
siêu dữ liệu ánh xạ OpenClaw chỉ dành cho các luồng Codex app-server; nó không
thay đổi các phiên ACP, cấu hình bộ điều phối Codex thông dụng hoặc các bộ điều hợp runtime khác.
Sử dụng `codex.agents` không rỗng để chỉ ánh xạ một máy chủ vào các mã định danh
tác nhân OpenClaw cụ thể. Danh sách tác nhân rỗng, chỉ chứa khoảng trắng hoặc không hợp lệ sẽ bị quy trình xác thực
cấu hình từ chối và bị bỏ qua trong đường dẫn ánh xạ runtime thay vì trở thành
toàn cục. Sử dụng `codex.defaultToolsApprovalMode` (`auto`, `prompt` hoặc `approve`)
để phát ra `default_tools_approval_mode` gốc của Codex cho một máy chủ đáng tin cậy.
OpenClaw loại bỏ siêu dữ liệu `codex` trước khi chuyển cấu hình `mcp_servers`
gốc cho Codex.

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

Ghi chú:

- `list` sắp xếp tên máy chủ.
- `show` không có tên sẽ in ra toàn bộ đối tượng máy chủ MCP đã cấu hình.
- `status` phân loại các phương thức truyền tải đã cấu hình mà không kết nối. `--verbose` bao gồm thông tin chi tiết đã phân giải về khởi chạy, thời gian chờ, OAuth, bộ lọc và lệnh gọi song song.
- `doctor` thực hiện kiểm tra tĩnh mà không kết nối. Thêm `--probe` khi lệnh cũng cần xác minh rằng các máy chủ đã bật có thể kết nối.
- `probe` kết nối và báo cáo số lượng công cụ, khả năng hỗ trợ tài nguyên/prompt, khả năng hỗ trợ thay đổi danh sách và thông tin chẩn đoán.
- `add` chấp nhận các cờ stdio như `--command`, `--arg`, `--env` và `--cwd`, hoặc các cờ HTTP như `--url`, `--transport`, `--header`, `--auth oauth`, cùng các cờ TLS, thời gian chờ và lựa chọn công cụ.
- `set` yêu cầu một giá trị đối tượng JSON trên dòng lệnh.
- `configure` cập nhật trạng thái bật, bộ lọc công cụ, thời gian chờ, OAuth, TLS và gợi ý lệnh gọi công cụ song song mà không thay thế toàn bộ định nghĩa máy chủ. Thêm `--probe` để xác minh máy chủ đã cập nhật trước khi lưu.
- `tools` cập nhật bộ lọc công cụ theo từng máy chủ. Các mục bao gồm/loại trừ là tên công cụ MCP và các glob `*` đơn giản.
- `login` chạy luồng OAuth cho các máy chủ HTTP được cấu hình bằng `auth: "oauth"`. Lần chạy đầu tiên in ra URL ủy quyền; chạy lại với `--code` sau khi phê duyệt.
- `logout` xóa thông tin xác thực OAuth đã lưu cho máy chủ được chỉ định mà không xóa định nghĩa máy chủ đã lưu.
- `reload` hủy các runtime MCP trong tiến trình đã được lưu vào bộ nhớ đệm, chỉ dành cho tiến trình CLI hiện tại. Các tiến trình Gateway hoặc tác nhân trong tiến trình khác vẫn cần đường dẫn tải lại hoặc khởi động lại riêng.
- Sử dụng `transport: "streamable-http"` cho các máy chủ MCP HTTP có thể truyền phát. `openclaw mcp set` cũng chuẩn hóa `type: "http"` gốc của CLI về cùng hình dạng cấu hình chuẩn để bảo đảm khả năng tương thích.
- `unset` sẽ thất bại nếu máy chủ được chỉ định không tồn tại.

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

### Các công thức máy chủ phổ biến

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

    Giới hạn phạm vi máy chủ hệ thống tệp ở cây thư mục nhỏ nhất mà tác nhân cần đọc hoặc chỉnh sửa.

  </Tab>
  <Tab title="Bộ nhớ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sử dụng bộ lọc công cụ nếu máy chủ cung cấp các công cụ ghi mà tác nhân thông thường không nên được phép sử dụng.

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

    `doctor` kiểm tra rằng `cwd` tồn tại và lệnh được phân giải từ môi trường đã cấu hình.

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

    Sử dụng OAuth khi máy chủ từ xa hỗ trợ. Nếu máy chủ yêu cầu tiêu đề tĩnh, tránh commit trực tiếp mã thông báo bearer.

  </Tab>
  <Tab title="Máy tính để bàn/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Các máy chủ điều khiển máy tính để bàn trực tiếp kế thừa quyền của tiến trình mà chúng khởi chạy. Sử dụng bộ lọc công cụ chặt chẽ và lời nhắc cấp quyền ở cấp hệ điều hành.

  </Tab>
</Tabs>

### Cấu trúc đầu ra JSON

Sử dụng `--json` cho tập lệnh và bảng điều khiển. Tập hợp trường có thể mở rộng theo thời gian, vì vậy trình tiêu thụ nên bỏ qua các khóa không xác định.

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

    `doctor --json` thoát với mã khác 0 khi bất kỳ máy chủ đã bật nào được kiểm tra có sự cố cấp `error`. Các sự cố `warning` và `info` được báo cáo nhưng bản thân chúng không làm lệnh thất bại.

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

    `probe --json` mở một phiên máy khách MCP trực tiếp và in thẳng kết quả; không giống `status`/`doctor`, đầu ra không có trường `path` ở cấp cao nhất. Các khóa `resources` và `prompts` chỉ xuất hiện khi máy chủ thực sự công bố khả năng đó (máy chủ không có lời nhắc sẽ bỏ qua khóa `prompts` thay vì báo cáo `false`). Sử dụng `probe` để xác minh khả năng kết nối và năng lực, không dùng để kiểm tra cấu hình tĩnh.

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

| Trường                      | Mô tả                                |
| -------------------------- | --------------------------------- |
| `command`                  | Tệp thực thi cần khởi chạy (bắt buộc)    |
| `args`                     | Mảng đối số dòng lệnh   |
| `env`                      | Các biến môi trường bổ sung       |
| `cwd` / `workingDirectory` | Thư mục làm việc của tiến trình |

<Warning>
**Bộ lọc an toàn cho môi trường Stdio**

OpenClaw từ chối các khóa môi trường khởi động trình thông dịch, chiếm quyền trình nạp và khởi tạo shell trước khi khởi chạy máy chủ MCP stdio, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Cơ chế này sử dụng cùng chính sách bảo mật môi trường máy chủ như các tiến trình khác do OpenClaw khởi chạy: chặn các hook khởi động trình thông dịch đã biết (ví dụ `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), các tiền tố chèn thư viện dùng chung và hàm (`DYLD_*`, `LD_*`, `BASH_FUNC_*`), cùng các biến điều khiển thời gian chạy tương tự. Khi khởi động, hệ thống âm thầm loại bỏ các biến này và ghi cảnh báo để chúng không thể chèn phần mở đầu ngầm, tráo đổi trình thông dịch, bật trình gỡ lỗi hoặc chiếm quyền trình liên kết động đối với tiến trình stdio. Một danh sách cho phép rõ ràng duy trì khả năng sử dụng các biến môi trường thông tin xác thực MCP thông thường (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), cùng với các biến môi trường proxy và biến dành riêng cho máy chủ thông thường (`HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.). Các khóa `AWS_*` khác như `AWS_CONFIG_FILE` và `AWS_SHARED_CREDENTIALS_FILE` vẫn bị chặn vì chúng trỏ đến các tệp thông tin xác thực thay vì trực tiếp chứa giá trị thông tin xác thực.

Nếu máy chủ MCP của bạn thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì trong `env` của máy chủ stdio.
</Warning>

### Phương thức truyền tải SSE / HTTP

Kết nối với máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                          | Mô tả                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                |
| `headers`                      | Ánh xạ khóa-giá trị tùy chọn của các tiêu đề HTTP (ví dụ mã thông báo xác thực) |
| `connectionTimeoutMs`          | Thời gian chờ kết nối cho mỗi máy chủ tính bằng ms (tùy chọn)                   |
| `connectTimeout`               | Thời gian chờ kết nối cho mỗi máy chủ tính bằng giây (tùy chọn)              |
| `timeout` / `requestTimeoutMs` | Thời gian chờ yêu cầu MCP cho mỗi máy chủ tính bằng giây hoặc ms                  |
| `auth: "oauth"`                | Sử dụng thông tin xác thực MCP OAuth được lưu bởi `openclaw mcp login`          |
| `sslVerify`                    | Chỉ đặt thành false cho các điểm cuối HTTPS riêng tư được tin cậy rõ ràng    |
| `clientCert` / `clientKey`     | Đường dẫn chứng chỉ và khóa máy khách mTLS                            |
| `supportsParallelToolCalls`    | Gợi ý rằng các lệnh gọi đồng thời là an toàn cho máy chủ này              |

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

Các giá trị nhạy cảm trong `url` (thông tin người dùng) và `headers` được che trong nhật ký và đầu ra trạng thái. `openclaw mcp doctor` cảnh báo khi các mục `headers` hoặc `env` có vẻ nhạy cảm chứa giá trị trực tiếp, để người vận hành có thể chuyển các giá trị đó ra khỏi cấu hình đã commit.

### Quy trình OAuth

OAuth dành cho các máy chủ MCP HTTP công bố luồng MCP OAuth. Các tiêu đề `Authorization` tĩnh bị bỏ qua đối với máy chủ khi `auth: "oauth"` được bật. Thông tin xác thực được lưu bởi `openclaw mcp login` hoạt động với MCP nhúng, trình chạy CLI và máy chủ ứng dụng Codex cục bộ.

Cho đến khi có thông tin xác thực, OpenClaw chỉ loại máy chủ MCP đó khỏi thời gian chạy của tác nhân thay vì làm lượt tác nhân thất bại. Sau đó, người vận hành hoặc tác nhân có quyền truy cập shell có thể chạy `openclaw mcp login <name>` và sử dụng máy chủ ở lượt sau.

Khi một dịch vụ MCP từ xa đã được hỗ trợ bởi một hồ sơ xác thực OpenClaw riêng biệt có khả năng làm mới, bạn có thể tùy chọn đặt `oauth.authProfileId`. OpenClaw làm mới một trong hai nguồn thông tin xác thực trước khi chiếu vào thời gian chạy và chỉ chuyển mã thông báo truy cập hiện tại cho máy khách MCP phía hạ nguồn.

<Steps>
  <Step title="Lưu máy chủ">
    Thêm hoặc cập nhật máy chủ bằng `auth: "oauth"` và mọi siêu dữ liệu OAuth tùy chọn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Đối với bearer được hồ sơ xác thực hỗ trợ, hãy lưu liên kết hồ sơ:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Bắt đầu đăng nhập">
    Chạy lệnh đăng nhập để tạo yêu cầu cấp quyền.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw in URL cấp quyền và lưu trạng thái trình xác minh OAuth tạm thời trong thư mục trạng thái OpenClaw.

  </Step>
  <Step title="Hoàn tất bằng mã">
    Sau khi phê duyệt trong trình duyệt, hãy chuyển mã được trả về lại cho OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Kiểm tra ủy quyền">
    Sử dụng trạng thái hoặc doctor để xác nhận rằng các token hiện diện.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Xóa thông tin xác thực">
    Đăng xuất sẽ xóa thông tin xác thực OAuth đã lưu nhưng vẫn giữ định nghĩa máy chủ đã lưu.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Nếu nhà cung cấp luân chuyển token hoặc trạng thái ủy quyền bị kẹt, hãy chạy `openclaw mcp logout <name>`, sau đó lặp lại `login`. `logout` có thể xóa thông tin xác thực cho một máy chủ HTTP đã lưu ngay cả sau khi `auth: "oauth"` đã bị xóa khỏi cấu hình, miễn là tên và URL của máy chủ vẫn xác định được mục tương ứng trong kho thông tin xác thực.

### Phương thức truyền tải HTTP có thể phát trực tuyến

`streamable-http` là một tùy chọn phương thức truyền tải bổ sung bên cạnh `sse` và `stdio`. Tùy chọn này sử dụng truyền phát HTTP để giao tiếp hai chiều với các máy chủ MCP từ xa.

| Trường                          | Mô tả                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                      |
| `transport`                    | Đặt thành `"streamable-http"` để chọn phương thức truyền tải này; khi bỏ qua, OpenClaw sử dụng `sse` |
| `headers`                      | Ánh xạ khóa-giá trị tùy chọn của các tiêu đề HTTP (ví dụ: token xác thực)                       |
| `connectionTimeoutMs`          | Thời gian chờ kết nối riêng cho từng máy chủ, tính bằng ms (tùy chọn)                                         |
| `connectTimeout`               | Thời gian chờ kết nối riêng cho từng máy chủ, tính bằng giây (tùy chọn)                                    |
| `timeout` / `requestTimeoutMs` | Thời gian chờ yêu cầu MCP riêng cho từng máy chủ, tính bằng giây hoặc ms                                        |
| `auth: "oauth"`                | Sử dụng thông tin xác thực MCP OAuth được lưu bởi `openclaw mcp login`                                |
| `sslVerify`                    | Chỉ đặt thành false đối với các điểm cuối HTTPS riêng tư được tin cậy rõ ràng                          |
| `clientCert` / `clientKey`     | Đường dẫn chứng chỉ và khóa máy khách mTLS                                                  |
| `supportsParallelToolCalls`    | Gợi ý rằng các lệnh gọi đồng thời là an toàn đối với máy chủ này                                    |

Cấu hình OpenClaw sử dụng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị `type: "http"` MCP gốc của CLI được chấp nhận khi lưu thông qua `openclaw mcp set` và được `openclaw doctor --fix` sửa trong cấu hình hiện có, nhưng `transport` là giá trị mà OpenClaw nhúng sử dụng trực tiếp.

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
Các lệnh sổ đăng ký không khởi động cầu nối kênh. Chỉ `probe` và `doctor --probe` mở một phiên máy khách MCP trực tiếp để chứng minh rằng có thể kết nối đến máy chủ đích.
</Note>

## Giao diện điều khiển

Giao diện điều khiển trên trình duyệt bao gồm một trang cài đặt MCP chuyên dụng tại `/settings/mcp`; đường dẫn `/mcp` trước đây vẫn là một bí danh. Trang này hiển thị số lượng máy chủ đã cấu hình, bản tóm tắt trạng thái bật/OAuth/bộ lọc, các hàng phương thức truyền tải theo từng máy chủ, các điều khiển bật/tắt, những lệnh CLI phổ biến và trình chỉnh sửa có phạm vi cho phần cấu hình `mcp`.

Sử dụng trang này để người vận hành chỉnh sửa và kiểm kê nhanh. Sử dụng `openclaw mcp doctor --probe` hoặc `openclaw mcp probe` khi cần bằng chứng trực tiếp về máy chủ.

Quy trình dành cho người vận hành:

1. Mở Giao diện điều khiển và chọn **MCP**.
2. Xem lại các thẻ tóm tắt về tổng số máy chủ, máy chủ đã bật, máy chủ OAuth và máy chủ được lọc.
3. Sử dụng từng hàng máy chủ để xem gợi ý về phương thức truyền tải, xác thực, bộ lọc, thời gian chờ và lệnh.
4. Chuyển đổi trạng thái bật khi muốn giữ lại một định nghĩa nhưng loại định nghĩa đó khỏi quá trình khám phá trong thời gian chạy.
5. Chỉnh sửa phần cấu hình `mcp` có phạm vi để thực hiện các thay đổi cấu trúc như thêm máy chủ mới, tiêu đề, TLS, siêu dữ liệu OAuth hoặc bộ lọc công cụ.
6. Chọn **Save** để chỉ lưu cấu hình hoặc **Save & Publish** để áp dụng thông qua đường dẫn cấu hình Gateway.
7. Chạy `openclaw mcp doctor --probe` khi cần bằng chứng trực tiếp rằng máy chủ đã chỉnh sửa khởi động và liệt kê các công cụ.

Lưu ý:

- các đoạn lệnh đặt tên máy chủ trong dấu ngoặc kép để những tên bất thường vẫn có thể sao chép được trong shell
- các giá trị trông giống URL được hiển thị sẽ bị che trước khi kết xuất nếu chứa thông tin xác thực nhúng
- trang này không tự khởi động các phương thức truyền tải MCP
- các môi trường chạy đang hoạt động có thể cần `openclaw mcp reload`, xuất bản cấu hình Gateway hoặc khởi động lại tiến trình, tùy theo tiến trình nào sở hữu các máy khách MCP

## Ứng dụng MCP

OpenClaw có thể kết xuất các công cụ triển khai [phần mở rộng Ứng dụng MCP](https://modelcontextprotocol.io/extensions/apps) ổn định. Ứng dụng yêu cầu chủ động bật vì HTML của chúng đến từ máy chủ MCP đã cấu hình và có thể yêu cầu các công cụ hoặc tài nguyên hiển thị với ứng dụng từ chính máy chủ đó.

Bật cầu nối máy chủ:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Khởi động lại Gateway sau khi thay đổi cài đặt này. Khi được bật, OpenClaw khởi động một trình lắng nghe HTTP(S) chỉ dành cho sandbox trên cổng Gateway cộng thêm một cổng (đối với Gateway mặc định là `18790`). Giao diện điều khiển tải Ứng dụng từ nguồn riêng biệt đó; trình lắng nghe không bao giờ phục vụ Giao diện điều khiển, các tuyến Gateway đã xác thực hoặc dữ liệu người dùng.

Các kết nối Gateway trực tiếp cần quyền truy cập vào cả hai cổng. Nếu một proxy ngược hoặc trình kết thúc TLS cung cấp Giao diện điều khiển, hãy cấp cho Ứng dụng một nguồn công khai chuyên dụng và chỉ chuyển tiếp nguồn đó đến trình lắng nghe sandbox:

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

Nguồn sandbox phải khác với nguồn của Giao diện điều khiển. Không lưu trữ nội dung nhạy cảm hoặc nội dung khác yêu cầu xác thực trên đó.

Ví dụ: có thể cấu hình bản minh họa React cơ bản chính thức như sau:

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

- OpenClaw chỉ quảng bá phần mở rộng `io.modelcontextprotocol/ui` khi Ứng dụng được bật.
- Chỉ các tài nguyên `ui://` có chính xác kiểu MIME `text/html;profile=mcp-app` mới được kết xuất.
- Tài nguyên giao diện người dùng bị giới hạn ở 2 MiB, được đặt sau một proxy iframe kép trên một nguồn bên ngoài chuyên dụng, được tải vào một nguồn Ứng dụng bên trong không rõ nguồn gốc và bị giới hạn bởi CSP được suy ra từ siêu dữ liệu tài nguyên.
- Các công cụ chỉ dành cho Ứng dụng (`_meta.ui.visibility: ["app"]`) không xuất hiện trong danh sách công cụ của mô hình. Ứng dụng chỉ có thể gọi các công cụ hiển thị với ứng dụng trên máy chủ sở hữu của chúng mà cũng vượt qua chính sách công cụ OpenClaw có hiệu lực cho lượt chạy đã tạo chế độ xem.
- Các quyền của Ứng dụng gắn với nguồn, chẳng hạn như camera, micrô và vị trí địa lý, không được cấp khi tài liệu Ứng dụng bên trong sử dụng nguồn không rõ nguồn gốc để cô lập giữa các Ứng dụng.
- HTML của Ứng dụng, toàn bộ đối số công cụ và kết quả thô tồn tại trong một hợp đồng thuê chế độ xem trong bộ nhớ có giới hạn mười phút và không được ghi vào đĩa hoặc sao chép vào siêu dữ liệu xem trước bản chép lời. Bản chép lời chỉ lưu một bộ mô tả máy chủ/công cụ/tài nguyên có giới hạn, gắn với ID lệnh gọi công cụ ban đầu. Sau khi Gateway khởi động lại, Giao diện điều khiển có thể xác minh bộ mô tả đó dựa trên bản chép lời phiên đã xác thực và tìm nạp lại tài nguyên `ui://`; các chế độ xem được dựng lại chỉ cho phép đọc cho đến khi một lượt chạy mới thiết lập các quyền công cụ hiện tại.
- `openclaw security audit` đưa ra cảnh báo khi cầu nối được bật. Tắt cầu nối bằng `openclaw config set mcp.apps.enabled false --strict-json` khi không cần sử dụng.

## Các giới hạn hiện tại

Trang này mô tả cầu nối như được phát hành hiện nay.

Các giới hạn hiện tại:

- việc khám phá cuộc hội thoại phụ thuộc vào siêu dữ liệu tuyến phiên Gateway hiện có
- không có giao thức đẩy chung ngoài bộ điều hợp dành riêng cho Claude
- chưa có công cụ chỉnh sửa tin nhắn hoặc bày tỏ cảm xúc
- phương thức truyền tải HTTP/SSE/streamable-http kết nối đến một máy chủ từ xa duy nhất; chưa hỗ trợ ghép kênh phía nguồn
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát trong khi cầu nối đang kết nối

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Plugin](/vi/cli/plugins)
