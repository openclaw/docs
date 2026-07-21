---
read_when:
    - Kết nối Codex, Claude Code hoặc một máy khách MCP khác với các kênh được OpenClaw hỗ trợ
    - Đang chạy `openclaw mcp serve`
    - Quản lý các định nghĩa máy chủ MCP do OpenClaw lưu
sidebarTitle: MCP
summary: Cung cấp quyền truy cập vào các cuộc hội thoại trên kênh OpenClaw qua MCP và quản lý các định nghĩa máy chủ MCP đã lưu
title: MCP
x-i18n:
    generated_at: "2026-07-21T13:29:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee6146bbc0181d10997336094d1bd693d0afb0985f1febef8e8c6b0d6e656cf9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` có hai chức năng:

- chạy OpenClaw dưới dạng máy chủ MCP với `openclaw mcp serve`
- quản lý các định nghĩa máy chủ MCP gửi đi do OpenClaw quản lý bằng `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` và `unset`

`serve` là OpenClaw hoạt động dưới dạng máy chủ MCP. Các lệnh con khác là OpenClaw hoạt động dưới dạng registry phía máy khách MCP cho các máy chủ mà runtime của chính OpenClaw có thể sử dụng sau này.

<Note>
  `list`, `show`, `set` và `unset` chỉ đọc và ghi các mục `mcp.servers` do OpenClaw quản lý trong cấu hình OpenClaw. Chúng không bao gồm các máy chủ mcporter từ `config/mcporter.json`; hãy dùng `mcporter list` cho registry đó.
</Note>

Dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ một phiên coding harness và định tuyến runtime đó qua ACP.

## Chọn đường dẫn MCP phù hợp

| Mục tiêu                                                                | Sử dụng                                                                  | Lý do                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Cho phép máy khách MCP bên ngoài đọc/gửi các cuộc hội thoại trên kênh OpenClaw | `openclaw mcp serve`                                                 | OpenClaw là máy chủ MCP và cung cấp các cuộc hội thoại được Gateway hỗ trợ qua stdio.                                 |
| Lưu các máy chủ MCP bên thứ ba cho các lượt chạy agent do OpenClaw quản lý        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw là registry phía máy khách MCP và sau đó ánh xạ các máy chủ đó vào những runtime đủ điều kiện.               |
| Kiểm tra một máy chủ đã lưu mà không chạy lượt agent                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` và `doctor` kiểm tra cấu hình; `probe` mở kết nối MCP trực tiếp và liệt kê các khả năng.               |
| Chỉnh sửa cấu hình MCP từ trình duyệt                                      | Control UI `/settings/mcp` (bí danh `/mcp`)                            | Trang này hiển thị danh mục, trạng thái bật, bản tóm tắt OAuth/bộ lọc, gợi ý lệnh và trình chỉnh sửa `mcp` có phạm vi giới hạn.         |
| Cung cấp cho Codex app-server một máy chủ MCP gốc có phạm vi giới hạn                    | `mcp.servers.<name>.codex`                                           | Khối `codex` chỉ ảnh hưởng đến việc ánh xạ luồng Codex app-server và được loại bỏ trước khi chuyển giao cấu hình gốc. |
| Chạy các phiên harness do ACP lưu trữ                                     | [`openclaw acp`](/vi/cli/acp) và [Agent ACP](/vi/tools/acp-agents-setup) | Chế độ cầu nối ACP không chấp nhận việc chèn máy chủ MCP theo từng phiên; thay vào đó, hãy cấu hình các cầu nối Gateway/Plugin.     |

<Tip>
Nếu chưa chắc cần đường dẫn nào, hãy bắt đầu với `openclaw mcp status --verbose`. Lệnh này hiển thị những gì OpenClaw đã lưu mà không khởi động bất kỳ máy chủ MCP nào.
</Tip>

## OpenClaw dưới dạng máy chủ MCP

Đây là đường dẫn `openclaw mcp serve`.

### Khi nào nên dùng serve

Dùng `openclaw mcp serve` khi:

- Codex, Claude Code hoặc một máy khách MCP khác cần giao tiếp trực tiếp với các cuộc hội thoại trên kênh do OpenClaw hỗ trợ
- đã có Gateway OpenClaw cục bộ hoặc từ xa với các phiên được định tuyến
- muốn có một máy chủ MCP hoạt động trên nhiều backend kênh của OpenClaw thay vì chạy cầu nối riêng cho từng kênh

Thay vào đó, dùng [`openclaw acp`](/vi/cli/acp) khi OpenClaw cần tự lưu trữ runtime lập trình và giữ phiên agent bên trong OpenClaw.

### Cách hoạt động

`openclaw mcp serve` khởi động một máy chủ MCP stdio. Máy khách MCP sở hữu tiến trình đó. Trong khi máy khách duy trì phiên stdio mở, cầu nối kết nối với Gateway OpenClaw cục bộ hoặc từ xa qua WebSocket và cung cấp các cuộc hội thoại trên kênh đã được định tuyến qua MCP.

<Steps>
  <Step title="Máy khách khởi chạy cầu nối">
    Máy khách MCP khởi chạy `openclaw mcp serve`.
  </Step>
  <Step title="Cầu nối kết nối với Gateway">
    Cầu nối kết nối với Gateway OpenClaw qua WebSocket.
  </Step>
  <Step title="Các phiên trở thành cuộc hội thoại MCP">
    Các phiên đã định tuyến trở thành cuộc hội thoại MCP cùng các công cụ bản chép lời/lịch sử.
  </Step>
  <Step title="Xếp hàng các sự kiện trực tiếp">
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
    - khi máy khách ngắt kết nối, cầu nối thoát và hàng đợi trực tiếp bị mất
    - các điểm vào agent chạy một lần như `openclaw agent` và `openclaw infer model run` sẽ dừng mọi runtime MCP đi kèm mà chúng mở khi phản hồi hoàn tất, vì vậy các lượt chạy bằng script lặp lại không tích lũy tiến trình con MCP stdio
    - các máy chủ MCP stdio do OpenClaw khởi chạy (đi kèm hoặc do người dùng cấu hình) được dừng theo toàn bộ cây tiến trình khi tắt, vì vậy các tiến trình con do máy chủ khởi động không tiếp tục tồn tại sau khi máy khách stdio mẹ thoát
    - việc xóa hoặc đặt lại một phiên sẽ giải phóng các máy khách MCP của phiên đó thông qua đường dẫn dọn dẹp runtime dùng chung, nên không còn kết nối stdio tồn đọng gắn với phiên đã bị xóa

  </Accordion>
</AccordionGroup>

### Chọn chế độ máy khách

<Tabs>
  <Tab title="Máy khách MCP chung">
    Chỉ các công cụ MCP tiêu chuẩn. Dùng `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` và các công cụ phê duyệt.
  </Tab>
  <Tab title="Claude Code">
    Các công cụ MCP tiêu chuẩn cùng bộ điều hợp kênh dành riêng cho Claude. Bật `--claude-channel-mode on` hoặc giữ giá trị mặc định `auto`.
  </Tab>
</Tabs>

<Note>
Hiện tại, `auto` hoạt động giống `on`. Chưa có cơ chế phát hiện khả năng của máy khách.
</Note>

### Những gì serve cung cấp

Cầu nối sử dụng siêu dữ liệu định tuyến phiên hiện có của Gateway để cung cấp các cuộc hội thoại dựa trên kênh. Một cuộc hội thoại xuất hiện khi OpenClaw đã có trạng thái phiên với định tuyến đã biết, chẳng hạn như:

- `channel`
- siêu dữ liệu người nhận hoặc đích đến
- `accountId` tùy chọn
- `threadId` tùy chọn

Điều này cung cấp cho máy khách MCP một nơi để:

- liệt kê các cuộc hội thoại đã định tuyến gần đây
- đọc lịch sử bản chép lời gần đây
- chờ các sự kiện đến mới
- gửi phản hồi trở lại qua cùng định tuyến
- xem các yêu cầu phê duyệt đến khi cầu nối đang kết nối

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
  <Tab title="Chi tiết / Tắt Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Công cụ cầu nối

<AccordionGroup>
  <Accordion title="conversations_list">
    Liệt kê các cuộc hội thoại dựa trên phiên gần đây đã có siêu dữ liệu định tuyến trong trạng thái phiên Gateway.

    Bộ lọc: `limit` (tối đa 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Trả về một cuộc hội thoại theo `session_key` bằng cách tra cứu trực tiếp phiên Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Đọc các tin nhắn bản chép lời gần đây của một cuộc hội thoại dựa trên phiên. `limit` mặc định là 20, tối đa 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Trích xuất các khối nội dung tin nhắn không phải văn bản từ một tin nhắn trong bản chép lời. Đây là chế độ xem siêu dữ liệu trên nội dung bản chép lời, không phải kho lưu trữ blob tệp đính kèm bền vững độc lập.
  </Accordion>
  <Accordion title="events_poll">
    Đọc các sự kiện trực tiếp trong hàng đợi kể từ một con trỏ số. `limit` tối đa 200.
  </Accordion>
  <Accordion title="events_wait">
    Thăm dò dài cho đến khi sự kiện tiếp theo phù hợp trong hàng đợi xuất hiện hoặc hết thời gian chờ (mặc định 30s, tối đa 300s).

    Dùng công cụ này khi máy khách MCP chung cần phân phối gần thời gian thực mà không có giao thức đẩy dành riêng cho Claude.

  </Accordion>
  <Accordion title="messages_send">
    Gửi văn bản trở lại qua cùng định tuyến đã được ghi trên phiên.

    Hành vi hiện tại:

    - yêu cầu định tuyến cuộc hội thoại hiện có
    - sử dụng kênh, người nhận, id tài khoản và id luồng của phiên
    - chỉ gửi văn bản

  </Accordion>
  <Accordion title="permissions_list_open">
    Liệt kê các yêu cầu phê duyệt exec/Plugin đang chờ xử lý mà cầu nối đã quan sát được kể từ khi kết nối với Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Giải quyết một yêu cầu phê duyệt exec/Plugin đang chờ xử lý bằng:

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
- hàng đợi chỉ dành cho sự kiện trực tiếp; nó bắt đầu khi cầu nối MCP khởi động
- `events_poll` và `events_wait` không tự phát lại lịch sử Gateway cũ hơn
- nên đọc phần tồn đọng bền vững bằng `messages_read`

</Warning>

### Thông báo kênh Claude

Cầu nối cũng có thể cung cấp thông báo kênh dành riêng cho Claude. Đây là phiên bản tương đương của bộ điều hợp kênh Claude Code trong OpenClaw: các công cụ MCP tiêu chuẩn vẫn khả dụng, nhưng tin nhắn trực tiếp đến cũng có thể xuất hiện dưới dạng thông báo MCP dành riêng cho Claude.

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

- các tin nhắn bản chép lời `user` đến được chuyển tiếp dưới dạng `notifications/claude/channel`
- các yêu cầu quyền Claude nhận qua MCP được theo dõi trong bộ nhớ
- nếu chủ sở hữu lệnh trong cuộc hội thoại được liên kết sau đó gửi `yes <id>` hoặc `no <id>` (`<id>` là id yêu cầu gồm 5 chữ cái, không bao gồm `l`), cầu nối sẽ chuyển đổi thành `notifications/claude/channel/permission`
- các thông báo này chỉ dành cho phiên trực tiếp; nếu máy khách MCP ngắt kết nối thì không còn đích đẩy

Điều này được thiết kế riêng cho máy khách. Máy khách MCP chung nên dựa vào các công cụ thăm dò tiêu chuẩn.

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

Đối với hầu hết các máy khách MCP thông dụng, hãy bắt đầu với bề mặt công cụ tiêu chuẩn và bỏ qua chế độ Claude. Chỉ bật chế độ Claude cho các máy khách thực sự hiểu những phương thức thông báo dành riêng cho Claude.

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
  Nhật ký chi tiết trên stderr.
</ParamField>

<Tip>
Khi có thể, nên dùng `--token-file` hoặc `--password-file` thay vì bí mật nội tuyến.
</Tip>

### Ranh giới bảo mật và tin cậy

Cầu nối không tự tạo định tuyến. Nó chỉ hiển thị những cuộc hội thoại mà Gateway đã biết cách định tuyến.

Điều đó có nghĩa là:

- danh sách cho phép người gửi, ghép cặp và mức độ tin cậy ở cấp kênh vẫn thuộc về cấu hình kênh OpenClaw bên dưới
- `messages_send` chỉ có thể trả lời thông qua một tuyến hiện có đã được lưu
- trạng thái phê duyệt chỉ tồn tại trực tiếp/trong bộ nhớ cho phiên cầu nối hiện tại
- xác thực cầu nối nên sử dụng cùng các biện pháp kiểm soát token hoặc mật khẩu Gateway mà bạn sẽ tin dùng cho bất kỳ máy khách Gateway từ xa nào khác

Nếu một cuộc hội thoại không xuất hiện trong `conversations_list`, nguyên nhân thường không phải là cấu hình MCP. Nguyên nhân là siêu dữ liệu tuyến bị thiếu hoặc không đầy đủ trong phiên Gateway bên dưới.

### Kiểm thử

OpenClaw cung cấp một bài kiểm tra nhanh Docker có tính xác định cho cầu nối này:

```bash
pnpm test:docker:mcp-channels
```

Bài kiểm tra nhanh đó chạy một vùng chứa duy nhất: nó khởi tạo trạng thái cuộc hội thoại, khởi động Gateway, sau đó sinh `openclaw mcp serve` dưới dạng tiến trình con stdio và điều khiển tiến trình đó như một máy khách MCP. Bài kiểm tra xác minh khả năng khám phá cuộc hội thoại, đọc bản chép lời, đọc siêu dữ liệu tệp đính kèm, hành vi của hàng đợi sự kiện trực tiếp, cũng như thông báo kênh và quyền kiểu Claude qua cầu nối MCP stdio thực. Định tuyến gửi đi (`messages_send` sử dụng lại tuyến cuộc hội thoại đã lưu) được kiểm thử riêng bằng các bài kiểm thử đơn vị trong `src/mcp/channel-server.test.ts`.

Đây là cách nhanh nhất để chứng minh cầu nối hoạt động mà không cần kết nối tài khoản Telegram, Discord hoặc iMessage thực vào lượt kiểm thử.

Để biết bối cảnh kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing).

### Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không trả về cuộc hội thoại nào">
    Thường có nghĩa là phiên Gateway chưa thể định tuyến. Hãy xác nhận rằng phiên bên dưới đã lưu siêu dữ liệu tuyến về kênh/nhà cung cấp, người nhận và tài khoản/luồng tùy chọn.
  </Accordion>
  <Accordion title="events_poll hoặc events_wait bỏ lỡ các tin nhắn cũ hơn">
    Đây là hành vi dự kiến. Hàng đợi trực tiếp bắt đầu khi cầu nối kết nối. Đọc lịch sử bản chép lời cũ hơn bằng `messages_read`.
  </Accordion>
  <Accordion title="Thông báo Claude không xuất hiện">
    Hãy kiểm tra tất cả các mục sau:

    - máy khách vẫn giữ phiên MCP stdio mở
    - `--claude-channel-mode` là `on` hoặc `auto`
    - máy khách thực sự hiểu các phương thức thông báo dành riêng cho Claude
    - tin nhắn đến xuất hiện sau khi cầu nối kết nối

  </Accordion>
  <Accordion title="Thiếu phê duyệt">
    `permissions_list_open` chỉ hiển thị các yêu cầu phê duyệt được quan sát trong khi cầu nối đang kết nối. Đây không phải là API lịch sử phê duyệt lâu dài.
  </Accordion>
</AccordionGroup>

## OpenClaw dưới dạng sổ đăng ký máy khách MCP

Đây là đường dẫn `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` và `unset`.

Các lệnh này không cung cấp OpenClaw qua MCP. Chúng quản lý các định nghĩa máy chủ MCP do OpenClaw quản lý trong `mcp.servers` thuộc cấu hình OpenClaw. Chúng không đọc các máy chủ mcporter từ `config/mcporter.json`.

Các định nghĩa đã lưu đó dành cho những môi trường chạy mà OpenClaw sẽ khởi chạy hoặc cấu hình sau này, chẳng hạn như OpenClaw nhúng và các bộ điều hợp môi trường chạy khác. OpenClaw lưu trữ tập trung các định nghĩa để những môi trường chạy đó không cần duy trì danh sách máy chủ MCP trùng lặp riêng.

<AccordionGroup>
  <Accordion title="Hành vi quan trọng">
    - các lệnh này chỉ đọc hoặc ghi cấu hình OpenClaw
    - `status`, `list`, `show`, `doctor` không có `--probe`, `set`, `configure`, `tools`, `logout`, `reload` và `unset` không kết nối đến máy chủ MCP đích
    - `login` thực hiện luồng mạng OAuth MCP cho máy chủ HTTP đã cấu hình và lưu thông tin xác thực cục bộ thu được
    - `status --verbose` in ra các gợi ý về phương thức truyền tải, xác thực, thời gian chờ, bộ lọc và lệnh gọi công cụ song song đã phân giải mà không kết nối
    - `doctor` kiểm tra các định nghĩa đã lưu để tìm sự cố thiết lập cục bộ như thiếu lệnh stdio, thư mục làm việc không hợp lệ, thiếu tệp TLS, máy chủ bị vô hiệu hóa, giá trị tiêu đề/biến môi trường nhạy cảm ở dạng chữ và ủy quyền OAuth chưa hoàn tất
    - `doctor --probe` bổ sung cùng bằng chứng kết nối trực tiếp như `probe` sau khi các bước kiểm tra tĩnh đạt yêu cầu
    - `probe` kết nối đến máy chủ đã chọn hoặc tất cả máy chủ đã cấu hình, liệt kê công cụ và báo cáo các khả năng/chẩn đoán
    - `add` tạo một định nghĩa từ các cờ và thăm dò trước khi lưu, trừ khi đặt `--no-probe` hoặc cần ủy quyền OAuth trước
    - các bộ điều hợp môi trường chạy quyết định những dạng phương thức truyền tải mà chúng thực sự hỗ trợ tại thời điểm thực thi
    - `enabled: false` giữ máy chủ ở trạng thái đã lưu nhưng loại trừ máy chủ khỏi quá trình khám phá của môi trường chạy nhúng
    - `requestTimeoutMs` và `connectionTimeoutMs` đặt thời gian chờ yêu cầu và kết nối theo từng máy chủ, tính bằng mili giây
    - `supportsParallelToolCalls: true` đánh dấu các máy chủ mà bộ điều hợp có thể gọi đồng thời
    - máy chủ HTTP có thể sử dụng tiêu đề tĩnh, đăng nhập OAuth, kiểm soát xác minh TLS và đường dẫn chứng chỉ/khóa mTLS
    - OpenClaw nhúng cung cấp các công cụ MCP đã cấu hình trong hồ sơ công cụ `coding` và `messaging` thông thường; `minimal` vẫn ẩn chúng và `tools.deny: ["bundle-mcp"]` vô hiệu hóa chúng một cách rõ ràng
    - `toolFilter.include` và `toolFilter.exclude` theo từng máy chủ lọc các công cụ MCP được khám phá trước khi chúng trở thành công cụ OpenClaw
    - các máy chủ quảng bá tài nguyên hoặc lời nhắc cũng cung cấp các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/tìm nạp lời nhắc; các tên tiện ích được tạo đó (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) sử dụng cùng bộ lọc bao gồm/loại trừ
    - các thay đổi động đối với danh sách công cụ MCP làm mất hiệu lực danh mục được lưu đệm cho phiên đó; lần khám phá/sử dụng tiếp theo sẽ làm mới từ máy chủ
    - các lỗi yêu cầu/giao thức công cụ MCP lặp lại sẽ tạm dừng máy chủ đó trong thời gian ngắn để một máy chủ bị lỗi không chiếm toàn bộ lượt
    - các môi trường chạy MCP đi kèm có phạm vi phiên sẽ được dọn dẹp sau 10 phút không hoạt động và các lượt chạy nhúng một lần sẽ dọn dẹp chúng khi lượt chạy kết thúc

  </Accordion>
</AccordionGroup>

Các bộ điều hợp môi trường chạy có thể chuẩn hóa sổ đăng ký dùng chung này thành dạng mà máy khách hạ nguồn mong đợi. Ví dụ: OpenClaw nhúng sử dụng trực tiếp các giá trị `transport` của OpenClaw, trong khi Claude Code và Gemini nhận các giá trị `type` gốc của CLI như `http`, `sse` hoặc `stdio`.

Máy chủ ứng dụng Codex cũng tuân theo một khối `codex` tùy chọn trên mỗi máy chủ. Đây là
siêu dữ liệu ánh xạ OpenClaw chỉ dành cho các luồng máy chủ ứng dụng Codex; nó không
thay đổi các phiên ACP, cấu hình bộ khai thác Codex thông dụng hoặc các bộ điều hợp môi trường chạy khác.
Sử dụng `codex.agents` không rỗng để chỉ ánh xạ một máy chủ vào các
ID tác nhân OpenClaw cụ thể. Danh sách tác nhân rỗng, để trống hoặc không hợp lệ sẽ bị quá trình xác thực
cấu hình từ chối và bị đường dẫn ánh xạ môi trường chạy bỏ qua thay vì trở thành
toàn cục. Sử dụng `codex.defaultToolsApprovalMode` (`auto`, `prompt` hoặc `approve`)
để phát ra `default_tools_approval_mode` gốc của Codex cho một máy chủ đáng tin cậy.
OpenClaw loại bỏ siêu dữ liệu `codex` trước khi chuyển cấu hình `mcp_servers`
gốc cho Codex.

### Định nghĩa máy chủ MCP đã lưu

Các lệnh:

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
- `status` phân loại các phương thức truyền tải đã cấu hình mà không kết nối. `--verbose` bao gồm thông tin chi tiết đã phân giải về khởi chạy, thời gian chờ, OAuth, bộ lọc và lệnh gọi song song, kể cả khi các token OAuth đã lưu yêu cầu ủy quyền bổ sung. Các đối số stdio chứa thông tin xác thực sẽ được che trong đầu ra văn bản và JSON.
- `doctor` thực hiện kiểm tra tĩnh mà không kết nối. Thêm `--probe` khi lệnh cũng cần xác minh rằng các máy chủ đã bật có thể kết nối.
- `probe` kết nối và báo cáo số lượng công cụ, khả năng hỗ trợ tài nguyên/lời nhắc, khả năng hỗ trợ thay đổi danh sách và chẩn đoán.
- `add` chấp nhận các cờ stdio như `--command`, `--arg`, `--env` và `--cwd`, hoặc các cờ HTTP như `--url`, `--transport`, `--header`, `--auth oauth`, TLS, thời gian chờ và các cờ lựa chọn công cụ.
- `set` yêu cầu một giá trị đối tượng JSON trên dòng lệnh.
- `configure` cập nhật trạng thái bật, bộ lọc công cụ, thời gian chờ, OAuth, TLS và gợi ý lệnh gọi công cụ song song mà không thay thế toàn bộ định nghĩa máy chủ. Thêm `--probe` để xác minh máy chủ đã cập nhật trước khi lưu.
- `tools` cập nhật bộ lọc công cụ theo từng máy chủ. Các mục bao gồm/loại trừ là tên công cụ MCP và các glob `*` đơn giản.
- `login` chạy luồng OAuth cho các máy chủ HTTP được cấu hình với `auth: "oauth"`. Lần chạy đầu tiên in URL ủy quyền; chạy lại với `--code` sau khi phê duyệt.
- `logout` xóa thông tin xác thực OAuth đã lưu cho máy chủ được đặt tên mà không xóa định nghĩa máy chủ đã lưu.
- `reload` hủy các môi trường chạy MCP trong tiến trình được lưu đệm chỉ cho tiến trình CLI hiện tại. Các tiến trình Gateway hoặc tác nhân trong một tiến trình khác vẫn cần đường dẫn tải lại hoặc khởi động lại riêng.
- Sử dụng `transport: "streamable-http"` cho các máy chủ MCP HTTP có thể truyền phát. `openclaw mcp set` cũng chuẩn hóa `type: "http"` gốc của CLI thành cùng dạng cấu hình chuẩn để tương thích.
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

Các ví dụ này chỉ lưu định nghĩa máy chủ. Sau đó, hãy chạy `openclaw mcp doctor --probe` để xác minh rằng máy chủ khởi động và cung cấp các công cụ.

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

    Giới hạn phạm vi máy chủ hệ thống tệp ở cây thư mục nhỏ nhất mà tác tử cần đọc hoặc chỉnh sửa.

  </Tab>
  <Tab title="Bộ nhớ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Sử dụng bộ lọc công cụ nếu máy chủ cung cấp các công cụ ghi không nên khả dụng cho các tác tử thông thường.

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

    Sử dụng OAuth khi máy chủ từ xa hỗ trợ. Nếu máy chủ yêu cầu tiêu đề tĩnh, tránh commit trực tiếp mã thông báo mang quyền.

  </Tab>
  <Tab title="Máy tính/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,get_window_state,click,type_text'
    openclaw mcp doctor cua-driver --probe
    ```

    Các máy chủ điều khiển máy tính trực tiếp kế thừa quyền của tiến trình mà chúng khởi chạy. Hãy sử dụng bộ lọc công cụ chặt chẽ và lời nhắc cấp quyền ở cấp hệ điều hành.

  </Tab>
</Tabs>

### Cấu trúc đầu ra JSON

Sử dụng `--json` cho tập lệnh và bảng điều khiển. Tập hợp trường có thể mở rộng theo thời gian, vì vậy bên sử dụng nên bỏ qua các khóa không xác định.

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

    `doctor --json` thoát với mã khác 0 khi bất kỳ máy chủ đã bật và được kiểm tra nào có sự cố cấp `error`. Các sự cố `warning` và `info` được báo cáo nhưng tự chúng không làm lệnh thất bại.

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

    `probe --json` mở một phiên máy khách MCP trực tiếp và in thẳng kết quả; không giống `status`/`doctor`, đầu ra không có trường `path` ở cấp cao nhất. Các khóa `resources` và `prompts` chỉ xuất hiện khi máy chủ thực sự công bố khả năng đó (máy chủ không có lời nhắc sẽ bỏ qua khóa `prompts` thay vì báo cáo `false`). Sử dụng `probe` để chứng minh khả năng kết nối và năng lực, không dùng để kiểm tra cấu hình tĩnh.

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

### Phương thức truyền tải Stdio

Khởi chạy một tiến trình con cục bộ và giao tiếp qua stdin/stdout.

| Trường                     | Mô tả                                |
| -------------------------- | ------------------------------------ |
| `command`                  | Tệp thực thi cần khởi chạy (bắt buộc) |
| `args`                     | Mảng đối số dòng lệnh                |
| `env`                      | Các biến môi trường bổ sung          |
| `cwd` / `workingDirectory` | Thư mục làm việc của tiến trình      |

<Warning>
**Bộ lọc an toàn môi trường Stdio**

OpenClaw từ chối các khóa môi trường khởi động trình thông dịch, chiếm quyền bộ nạp và khởi tạo shell trước khi khởi chạy máy chủ MCP stdio, ngay cả khi chúng xuất hiện trong khối `env` của máy chủ. Cơ chế này sử dụng cùng chính sách bảo mật môi trường máy chủ như các tiến trình khác do OpenClaw khởi chạy: nó chặn các móc khởi động trình thông dịch đã biết (ví dụ: `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), các tiền tố chèn thư viện dùng chung và hàm (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) cùng các biến điều khiển thời gian chạy tương tự. Khi khởi động, các biến này bị loại bỏ âm thầm và một cảnh báo được ghi vào nhật ký để chúng không thể chèn phần mở đầu ngầm, hoán đổi trình thông dịch, bật trình gỡ lỗi hoặc chiếm quyền bộ liên kết động đối với tiến trình stdio. Một danh sách cho phép rõ ràng duy trì khả năng sử dụng các biến môi trường thông tin xác thực MCP thông thường (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), cùng với các biến môi trường proxy thông thường và biến dành riêng cho máy chủ (`HTTP_PROXY`, `*_API_KEY` tùy chỉnh, v.v.). Các khóa `AWS_*` khác như `AWS_CONFIG_FILE` và `AWS_SHARED_CREDENTIALS_FILE` vẫn bị chặn vì chúng trỏ đến các tệp thông tin xác thực thay vì trực tiếp chứa giá trị thông tin xác thực.

Nếu máy chủ MCP thực sự cần một trong các biến bị chặn, hãy đặt biến đó trên tiến trình máy chủ Gateway thay vì trong `env` của máy chủ stdio.
</Warning>

### Phương thức truyền tải SSE / HTTP

Kết nối với máy chủ MCP từ xa qua HTTP Server-Sent Events.

| Trường                      | Mô tả                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| `url`                       | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                           |
| `headers`                   | Ánh xạ khóa-giá trị tùy chọn của tiêu đề HTTP (ví dụ: mã thông báo xác thực) |
| `connectionTimeoutMs`       | Thời gian chờ kết nối theo từng máy chủ tính bằng ms (tùy chọn)            |
| `requestTimeoutMs`          | Thời gian chờ yêu cầu MCP theo từng máy chủ tính bằng mili giây            |
| `auth: "oauth"`             | Sử dụng thông tin xác thực MCP OAuth được lưu bởi `openclaw mcp login`       |
| `sslVerify`                 | Chỉ đặt thành false cho các điểm cuối HTTPS riêng tư được tin cậy rõ ràng  |
| `clientCert` / `clientKey`  | Đường dẫn chứng chỉ và khóa máy khách mTLS                                 |
| `supportsParallelToolCalls` | Gợi ý rằng các lệnh gọi đồng thời là an toàn cho máy chủ này               |

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

OAuth dành cho các máy chủ MCP HTTP công bố luồng MCP OAuth. Các tiêu đề `Authorization` tĩnh bị bỏ qua đối với máy chủ khi `auth: "oauth"` được bật. Thông tin xác thực do `openclaw mcp login` lưu hoạt động với MCP nhúng, các trình chạy CLI và máy chủ ứng dụng Codex cục bộ.

Các phiên MCP OAuth gốc nằm trong cơ sở dữ liệu SQLite dùng chung chỉ dành cho chủ sở hữu tại `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`). Hàng dữ liệu có thể chứa mã thông báo truy cập và làm mới, bí mật đăng ký máy khách động, siêu dữ liệu khám phá và trình xác minh PKCE tạm thời. Làm mới, đăng nhập và đăng xuất sử dụng cùng một hợp đồng thuê SQLite, do đó các tiến trình OpenClaw song song không thể sử dụng cùng một mã thông báo làm mới hoặc khôi phục phiên đã đăng xuất.

Việc nâng cấp từ kho `<state-dir>/mcp-oauth/*.json` đã ngừng sử dụng chỉ do `openclaw doctor --fix` xử lý. Mã thời gian chạy không bao giờ đọc, ghi hoặc dự phòng về các tệp đó.

Cho đến khi có thông tin xác thực, OpenClaw chỉ loại máy chủ MCP đó khỏi thời gian chạy của tác tử thay vì làm lượt tác tử thất bại. Sau đó, người vận hành hoặc tác tử có quyền truy cập shell có thể chạy `openclaw mcp login <name>` và sử dụng máy chủ trong một lượt sau.

Nếu máy chủ từ chối mã thông báo với `insufficient_scope`, OpenClaw giữ nguyên phạm vi được yêu cầu và yêu cầu `openclaw mcp login <name>` thay vì lặp lại thao tác làm mới vốn không thể cấp phạm vi mới. Lần đăng nhập đó bắt đầu một yêu cầu cấp quyền mới trong khi vẫn giữ mã thông báo trước đó cho đến khi thông tin xác thực thay thế được lưu.

Khi một dịch vụ MCP từ xa đã được hỗ trợ bởi một hồ sơ xác thực OpenClaw riêng có khả năng làm mới, bạn có thể tùy chọn đặt `oauth.authProfileId`. OpenClaw làm mới một trong hai nguồn thông tin xác thực trước khi chiếu vào thời gian chạy và chỉ chuyển mã thông báo truy cập hiện tại cho máy khách MCP hạ nguồn.

<Steps>
  <Step title="Lưu máy chủ">
    Thêm hoặc cập nhật máy chủ bằng `auth: "oauth"` cùng mọi siêu dữ liệu OAuth tùy chọn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Đối với bearer dựa trên hồ sơ xác thực, hãy lưu liên kết hồ sơ:

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
    Sau khi phê duyệt trong trình duyệt, hãy chuyển mã được trả về cho OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Kiểm tra ủy quyền">
    Dùng trạng thái hoặc doctor để xác nhận token đã có và không yêu cầu ủy quyền bổ sung. Nếu trạng thái báo `authorization-required` hoặc doctor yêu cầu ủy quyền bổ sung, hãy chạy lại `openclaw mcp login <name>`.

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

Nếu nhà cung cấp luân chuyển token hoặc trạng thái ủy quyền bị kẹt, hãy chạy `openclaw mcp logout <name>`, rồi lặp lại `login`. `logout` có thể xóa thông tin xác thực cho máy chủ HTTP đã lưu ngay cả sau khi `auth: "oauth"` đã bị xóa khỏi cấu hình, miễn là tên và URL của máy chủ vẫn xác định được mục tương ứng trong kho thông tin xác thực.

### Giao thức truyền tải HTTP có thể truyền phát

`streamable-http` là một tùy chọn giao thức truyền tải bổ sung bên cạnh `sse` và `stdio`. Tùy chọn này sử dụng truyền phát HTTP để giao tiếp hai chiều với các máy chủ MCP từ xa.

| Trường                      | Mô tả                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | URL HTTP hoặc HTTPS của máy chủ từ xa (bắt buộc)                                       |
| `transport`                 | Đặt thành `"streamable-http"` để chọn giao thức truyền tải này; khi bỏ qua, OpenClaw sử dụng `sse` |
| `headers`                   | Ánh xạ khóa-giá trị tùy chọn của các tiêu đề HTTP (ví dụ: token xác thực)               |
| `connectionTimeoutMs`       | Thời gian chờ kết nối theo từng máy chủ, tính bằng ms (tùy chọn)                        |
| `requestTimeoutMs`          | Thời gian chờ yêu cầu MCP theo từng máy chủ, tính bằng mili giây                        |
| `auth: "oauth"`             | Sử dụng thông tin xác thực MCP OAuth được lưu bởi `openclaw mcp login`                    |
| `sslVerify`                 | Chỉ đặt thành false cho các điểm cuối HTTPS riêng tư được tin cậy rõ ràng               |
| `clientCert` / `clientKey`  | Đường dẫn chứng chỉ và khóa máy khách mTLS                                              |
| `supportsParallelToolCalls` | Gợi ý rằng các lệnh gọi đồng thời là an toàn đối với máy chủ này                        |

Cấu hình OpenClaw sử dụng `transport: "streamable-http"` làm cách viết chuẩn. Các giá trị MCP `type: "http"` gốc của CLI được chấp nhận khi lưu qua `openclaw mcp set` và được `openclaw doctor --fix` sửa trong cấu hình hiện có, nhưng `transport` là giá trị mà OpenClaw nhúng sử dụng trực tiếp.

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
Các lệnh đăng ký không khởi động cầu nối kênh. Chỉ `probe` và `doctor --probe` mới mở một phiên máy khách MCP trực tiếp để xác minh máy chủ đích có thể truy cập được.
</Note>

## Giao diện điều khiển

Giao diện điều khiển trên trình duyệt có một trang cài đặt MCP chuyên biệt tại `/settings/mcp`; đường dẫn `/mcp` trước đây vẫn là một bí danh. Trang này hiển thị số lượng máy chủ đã cấu hình, bản tóm tắt trạng thái bật/OAuth/bộ lọc, các hàng giao thức truyền tải theo từng máy chủ, các điều khiển bật/tắt, các lệnh CLI phổ biến và trình chỉnh sửa có phạm vi cho phần cấu hình `mcp`.

Sử dụng trang này để chỉnh sửa ở cấp vận hành và kiểm kê nhanh. Sử dụng `openclaw mcp doctor --probe` hoặc `openclaw mcp probe` khi cần xác minh máy chủ trực tiếp.

Quy trình vận hành:

1. Mở Giao diện điều khiển và chọn **MCP**.
2. Xem lại các thẻ tóm tắt về tổng số máy chủ, máy chủ đã bật, OAuth và máy chủ được lọc.
3. Sử dụng từng hàng máy chủ để xem gợi ý về giao thức truyền tải, xác thực, bộ lọc, thời gian chờ và lệnh.
4. Chuyển đổi trạng thái bật khi muốn giữ một định nghĩa nhưng loại định nghĩa đó khỏi quá trình khám phá khi chạy.
5. Chỉnh sửa phần cấu hình `mcp` có phạm vi để thực hiện các thay đổi cấu trúc như máy chủ mới, tiêu đề, TLS, siêu dữ liệu OAuth hoặc bộ lọc công cụ.
6. Chọn **Lưu** để chỉ duy trì cấu hình, hoặc **Lưu và phát hành** để áp dụng thông qua đường dẫn cấu hình Gateway.
7. Chạy `openclaw mcp doctor --probe` khi cần bằng chứng trực tiếp rằng máy chủ đã chỉnh sửa khởi động và liệt kê các công cụ.

Lưu ý:

- các đoạn lệnh đặt tên máy chủ trong dấu nháy để những tên khác thường vẫn có thể sao chép vào shell
- các giá trị giống URL được hiển thị sẽ được che bớt trước khi kết xuất nếu chứa thông tin xác thực nhúng
- trang này không tự khởi động các giao thức truyền tải MCP
- các môi trường chạy đang hoạt động có thể cần `openclaw mcp reload`, phát hành cấu hình Gateway hoặc khởi động lại tiến trình, tùy theo tiến trình nào sở hữu các máy khách MCP

## Ứng dụng MCP

OpenClaw có thể kết xuất các công cụ triển khai [tiện ích mở rộng MCP Apps](https://modelcontextprotocol.io/extensions/apps) ổn định. Ứng dụng yêu cầu bật chủ động vì HTML của chúng đến từ máy chủ MCP đã cấu hình và có thể yêu cầu các công cụ hoặc tài nguyên hiển thị cho ứng dụng từ chính máy chủ đó.

Bật cầu nối máy chủ:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Khởi động lại Gateway sau khi thay đổi cài đặt này. Khi được bật, OpenClaw khởi động một trình lắng nghe HTTP(S) chỉ dành cho sandbox trên cổng Gateway cộng một (đối với Gateway mặc định là `18790`). Giao diện điều khiển tải Ứng dụng từ nguồn riêng biệt đó; trình lắng nghe không bao giờ phục vụ Giao diện điều khiển, các tuyến Gateway đã xác thực hoặc dữ liệu người dùng.

Các kết nối Gateway trực tiếp cần truy cập cả hai cổng. Nếu proxy ngược hoặc bộ kết thúc TLS công khai Giao diện điều khiển, hãy cấp cho Ứng dụng một nguồn công khai chuyên dụng và chỉ chuyển tiếp nguồn đó đến trình lắng nghe sandbox:

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

Nguồn sandbox phải khác nguồn của Giao diện điều khiển. Không lưu trữ nội dung nhạy cảm hoặc đã xác thực khác trên đó.

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
- Chỉ các tài nguyên `ui://` có chính xác kiểu MIME `text/html;profile=mcp-app` mới được kết xuất.
- Tài nguyên giao diện người dùng bị giới hạn ở 2 MiB, được đặt sau một proxy iframe kép trên nguồn ngoài chuyên dụng, được tải vào một nguồn Ứng dụng bên trong dạng opaque và bị ràng buộc bởi CSP bắt nguồn từ siêu dữ liệu tài nguyên.
- Các công cụ chỉ dành cho Ứng dụng (`_meta.ui.visibility: ["app"]`) không xuất hiện trong danh sách công cụ của mô hình. Ứng dụng chỉ có thể gọi các công cụ hiển thị cho ứng dụng trên máy chủ sở hữu của chúng mà cũng vượt qua chính sách công cụ OpenClaw có hiệu lực đối với lượt chạy đã tạo chế độ xem.
- Các quyền Ứng dụng gắn với nguồn như camera, micrô và vị trí địa lý không được cấp khi các tài liệu Ứng dụng bên trong sử dụng nguồn opaque để cô lập giữa các Ứng dụng.
- HTML của Ứng dụng, đầy đủ đối số công cụ và kết quả thô tồn tại trong thời hạn chế độ xem mười phút có giới hạn trong bộ nhớ, không được ghi ra đĩa hoặc sao chép vào siêu dữ liệu xem trước bản chép lời. Bản chép lời chỉ lưu một bộ mô tả máy chủ/công cụ/tài nguyên có giới hạn được gắn với ID lệnh gọi công cụ ban đầu. Sau khi Gateway khởi động lại, Giao diện điều khiển có thể xác minh bộ mô tả đó dựa trên bản chép lời phiên đã xác thực và tìm nạp lại tài nguyên `ui://`; các chế độ xem được tái tạo chỉ có quyền đọc cho đến khi một lượt chạy mới thiết lập các quyền công cụ hiện tại.
- Trong các cuộc trò chuyện qua kênh, chế độ xem Ứng dụng thành công gần nhất trong một lượt sẽ thêm một hành động kiểu **Mở ứng dụng** vào câu trả lời cuối cùng của trợ lý. Tin nhắn trực tiếp Telegram sử dụng nút Mini App gốc; Slack và Discord kết xuất cùng hành động di động dưới dạng liên kết. Các kênh khác giữ nguyên văn bản trả lời ban đầu và nối thêm một liên kết HTTPS dễ hiểu.
- Liên kết khởi chạy qua kênh chỉ khả dụng khi khả năng công khai Gateway qua Tailscale đã chuẩn bị một nguồn HTTPS được phát hành. `gateway.tailscale.mode: "serve"` chỉ có thể truy cập từ tailnet; `"funnel"` có thể truy cập từ internet công cộng. Funnel được quản lý bên ngoài và được `gateway.tailscale.preserveFunnel` giữ lại cũng được xem là có thể truy cập từ internet. Xem [Tailscale](/vi/gateway/tailscale).
- Vé khởi chạy là giá trị opaque, chỉ được tạo khi hiện thực hóa câu trả lời cuối cùng qua kênh và hết hạn sau tối đa hai phút hoặc khi thời hạn chế độ xem cơ sở hết hạn, tùy điều kiện nào đến trước. URL không chứa thông tin xác thực bearer của Gateway, khóa phiên, siêu dữ liệu chế độ xem, HTML của Ứng dụng, đầu vào công cụ hoặc kết quả công cụ.
- Nếu không có nguồn đã phát hành hoặc dung lượng vé, chế độ xem hoặc vé đã hết hạn, hay giao thức truyền tải không thể kết xuất các điều khiển gốc, văn bản ban đầu của trợ lý vẫn khả dụng. Giao diện điều khiển giữ nguyên canvas Ứng dụng nội tuyến hiện có và không nhận hành động khởi chạy trùng lặp.
- `openclaw security audit` cảnh báo khi cầu nối được bật. Tắt bằng `openclaw config set mcp.apps.enabled false --strict-json` khi không cần thiết.

## Giới hạn hiện tại

Trang này ghi lại cầu nối như được phát hành hiện nay.

Giới hạn hiện tại:

- quá trình khám phá cuộc trò chuyện phụ thuộc vào siêu dữ liệu tuyến phiên Gateway hiện có
- không có giao thức đẩy chung ngoài bộ điều hợp dành riêng cho Claude
- chưa có công cụ chỉnh sửa hoặc bày tỏ cảm xúc với tin nhắn
- giao thức truyền tải HTTP/SSE/streamable-http kết nối đến một máy chủ từ xa duy nhất; chưa có upstream ghép kênh
- `permissions_list_open` chỉ bao gồm các phê duyệt được quan sát trong khi cầu nối được kết nối

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Plugin](/vi/cli/plugins)
