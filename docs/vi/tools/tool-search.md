---
read_when:
    - Bạn muốn các agent OpenClaw sử dụng một danh mục công cụ lớn mà không cần thêm mọi schema công cụ vào prompt
    - Bạn muốn các công cụ OpenClaw, công cụ MCP và công cụ máy khách được hiển thị qua một bề mặt runtime gọn nhẹ duy nhất
    - Bạn đang triển khai hoặc gỡ lỗi việc khám phá công cụ cho các lượt chạy OpenClaw
summary: 'Tìm kiếm công cụ: thu gọn các danh mục công cụ lớn của OpenClaw phía sau tìm kiếm, mô tả và gọi'
title: Tìm kiếm công cụ
x-i18n:
    generated_at: "2026-06-30T14:11:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Tìm kiếm công cụ là một tính năng thử nghiệm của runtime tác nhân OpenClaw. Tính năng này cung cấp cho tác nhân một cách
gọn nhẹ để khám phá và gọi các danh mục công cụ lớn. Tính năng này hữu ích khi lượt chạy
có nhiều công cụ khả dụng nhưng mô hình có khả năng chỉ cần một vài công cụ trong số đó.

Trang này ghi lại Tìm kiếm công cụ của OpenClaw. Đây không phải là bề mặt tìm kiếm
công cụ gốc của Codex hay công cụ động. Chế độ mã gốc của Codex, tìm kiếm công cụ, công cụ động
trì hoãn và lệnh gọi công cụ lồng nhau là các bề mặt ổn định của harness Codex và
không phụ thuộc vào `tools.toolSearch`.

Khi được bật cho các lượt chạy OpenClaw, theo mặc định mô hình nhận một công cụ `tool_search_code`.
Công cụ đó chạy một phần thân JavaScript ngắn trong một tiến trình con Node
được cô lập với một cầu nối `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Danh mục có thể bao gồm công cụ OpenClaw, công cụ Plugin, công cụ MCP và
công cụ do client cung cấp. Mô hình không thấy trước mọi schema đầy đủ.
Thay vào đó, nó tìm kiếm các bộ mô tả gọn nhẹ, mô tả một công cụ được chọn khi
cần schema chính xác, và gọi công cụ đó thông qua OpenClaw.

Các lượt chạy harness Codex không nhận các điều khiển Tìm kiếm công cụ thử nghiệm
này của OpenClaw. OpenClaw chuyển các năng lực sản phẩm cho Codex dưới dạng công cụ động, và
Codex sở hữu chế độ mã gốc ổn định, tìm kiếm công cụ gốc, công cụ động
trì hoãn và lệnh gọi công cụ lồng nhau.

## Cách một lượt chạy hoạt động

Ở thời điểm lập kế hoạch, runner nhúng của OpenClaw xây dựng danh mục hiệu lực cho
lượt chạy:

1. Phân giải chính sách công cụ đang hoạt động cho tác nhân, hồ sơ, sandbox và phiên.
2. Liệt kê các công cụ OpenClaw và Plugin đủ điều kiện.
3. Liệt kê các công cụ MCP đủ điều kiện thông qua runtime MCP của phiên.
4. Thêm các công cụ client đủ điều kiện được cung cấp cho lượt chạy hiện tại.
5. Lập chỉ mục các bộ mô tả gọn nhẹ để tìm kiếm.
6. Phơi bày cầu nối mã OpenClaw, các công cụ dự phòng có cấu trúc, hoặc bề mặt
   thư mục gọn nhẹ cho mô hình.

Ở thời điểm thực thi, mọi lệnh gọi công cụ thật đều quay về OpenClaw. Runtime Node
được cô lập không giữ các triển khai Plugin, đối tượng client MCP, hay bí mật.
`openclaw.tools.call(...)` đi qua cầu nối trở lại Gateway, nơi
chính sách, phê duyệt, hook, ghi nhật ký và xử lý kết quả bình thường vẫn được áp dụng.

## Chế độ

`tools.toolSearch` có ba chế độ hướng tới mô hình:

- `code`: phơi bày `tool_search_code`, cầu nối JavaScript gọn nhẹ mặc định.
- `tools`: phơi bày `tool_search`, `tool_describe` và `tool_call` dưới dạng các
  công cụ có cấu trúc thông thường cho những nhà cung cấp không nên nhận mã.
- `directory`: phơi bày `tool_search`, `tool_describe` và `tool_call` cùng một
  thư mục prompt có giới hạn gồm tên và mô tả công cụ khả dụng cho
  những nhà cung cấp nên thấy tên công cụ mà không thấy mọi schema đầy đủ. OpenClaw cũng có thể
  phơi bày trực tiếp một tập nhỏ có giới hạn gồm các schema công cụ có khả năng cần hoặc bắt buộc
  cho lượt hiện tại.

Mọi chế độ dùng cùng danh mục đã lọc theo chính sách và đường dẫn thực thi OpenClaw
bình thường. Nếu runtime hiện tại không thể khởi chạy tiến trình con chế độ mã Node
được cô lập, chế độ `code` mặc định sẽ chuyển về `tools` trước khi nén
danh mục. Trong chế độ `directory`, công cụ do client cung cấp vẫn hiển thị trực tiếp
cho lượt chạy hiện tại, còn công cụ OpenClaw, công cụ Plugin và công cụ MCP có thể được
nén phía sau danh mục thư mục. Một lệnh gọi trực tiếp tới một tên thư mục chính xác bị ẩn
sẽ được nạp từ cùng danh mục đã được ủy quyền đó trước khi thực thi.

Tất cả chế độ đều là thử nghiệm. Ưu tiên phơi bày công cụ trực tiếp cho các danh mục công cụ
OpenClaw nhỏ, và ưu tiên các bề mặt ổn định gốc của Codex cho các lượt chạy harness Codex.

Không có cấu hình chọn nguồn riêng. Khi Tìm kiếm công cụ được bật, danh mục
bao gồm các công cụ OpenClaw, MCP và client đủ điều kiện sau khi lọc chính sách
bình thường.

## Vì sao tính năng này tồn tại

Danh mục lớn hữu ích nhưng tốn kém. Gửi mọi schema công cụ cho mô hình
làm yêu cầu lớn hơn, làm chậm việc lập kế hoạch và tăng khả năng chọn nhầm công cụ.

Tìm kiếm công cụ thay đổi hình dạng:

- công cụ trực tiếp: mô hình thấy mọi schema được chọn trước token đầu tiên
- chế độ mã Tìm kiếm công cụ: mô hình thấy một công cụ mã gọn nhẹ và một hợp đồng API
  ngắn
- chế độ công cụ Tìm kiếm công cụ: mô hình thấy ba công cụ dự phòng có cấu trúc
  gọn nhẹ
- chế độ thư mục Tìm kiếm công cụ: mô hình thấy một thư mục có giới hạn cùng
  các điều khiển tìm kiếm/mô tả/gọi và một tập nhỏ có giới hạn gồm các schema có khả năng cần hoặc bắt buộc
- trong lượt chạy: mô hình có thể tải các schema còn lại khi cần

Phơi bày công cụ trực tiếp vẫn là mặc định phù hợp cho các danh mục nhỏ. Tìm kiếm công cụ
phù hợp nhất khi một lượt chạy có thể thấy nhiều công cụ, đặc biệt từ máy chủ MCP hoặc
công cụ ứng dụng do client cung cấp.

## API

`openclaw.tools.search(query, options?)`

Tìm kiếm danh mục hiệu lực cho lượt chạy hiện tại. Kết quả gọn nhẹ và an toàn
để đưa lại vào ngữ cảnh prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tải siêu dữ liệu đầy đủ cho một kết quả tìm kiếm, bao gồm schema đầu vào chính xác.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Gọi một công cụ đã chọn thông qua OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Chế độ dự phòng có cấu trúc phơi bày cùng các thao tác dưới dạng công cụ:

- `tool_search`
- `tool_describe`
- `tool_call`

Chế độ thư mục phơi bày:

- `tool_search`
- `tool_describe`
- `tool_call`

Nó cũng giữ các công cụ do client cung cấp hiển thị trực tiếp và có thể phơi bày trực tiếp
một tập nhỏ có giới hạn gồm các schema công cụ danh mục có khả năng cần hoặc bắt buộc cho lượt
hiện tại. Nếu thư mục có giới hạn bỏ sót mục, hãy dùng `tool_search` để tìm chúng. Nếu
mô hình yêu cầu trực tiếp một tên công cụ thư mục chính xác bị ẩn, OpenClaw
sẽ nạp nó từ danh mục đã được ủy quyền trước khi thực thi bình thường.
Tên công cụ client trong chế độ thư mục không được xung đột với tên công cụ OpenClaw, Plugin hoặc MCP
vì cơ chế điều phối trì hoãn chính xác dùng các tên đó.

## Ranh giới runtime

Cầu nối mã chạy trong một tiến trình con Node tồn tại ngắn. Tiến trình con bắt đầu
với chế độ quyền của Node được bật, môi trường trống, không có quyền hệ thống tệp hay
mạng, và không có quyền tiến trình con hay worker. OpenClaw thực thi
timeout theo thời gian thực ở tiến trình cha và hủy tiến trình con khi timeout, bao gồm
sau các phần tiếp diễn bất đồng bộ.

Runtime chỉ phơi bày:

- `console.log`, `console.warn` và `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Hành vi OpenClaw bình thường vẫn áp dụng cho các lệnh gọi cuối cùng:

- chính sách cho phép và từ chối công cụ
- hạn chế công cụ theo tác nhân và theo sandbox
- chính sách công cụ của kênh/runtime
- hook phê duyệt
- hook Plugin `before_tool_call`
- danh tính phiên, nhật ký và telemetry

## Cấu hình

Bật Tìm kiếm công cụ cho các lượt chạy OpenClaw với cầu nối mã mặc định:

```bash
openclaw config set tools.toolSearch true
```

JSON tương đương:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Dùng các công cụ dự phòng có cấu trúc thay thế cho các lượt chạy OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Dùng bề mặt thư mục gọn nhẹ thay thế cho các lượt chạy OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Tinh chỉnh timeout chế độ mã và giới hạn kết quả tìm kiếm:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Tắt tính năng:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt và telemetry

Tìm kiếm công cụ ghi lại đủ telemetry để so sánh với việc phơi bày công cụ trực tiếp:

- tổng số byte công cụ và prompt đã tuần tự hóa được gửi tới harness
- kích thước danh mục và phân tách theo nguồn
- số lượt tìm kiếm, mô tả và gọi
- các lệnh gọi công cụ cuối cùng được thực thi thông qua OpenClaw
- id và nguồn của công cụ đã chọn

Nhật ký phiên nên cho phép trả lời:

- mô hình đã thấy trước bao nhiêu schema công cụ
- mô hình đã thực hiện bao nhiêu thao tác tìm kiếm và mô tả
- công cụ cuối cùng nào đã được gọi
- kết quả đến từ OpenClaw, MCP hay một công cụ client

## Xác thực E2E

Kịch bản Gateway của QA Lab chứng minh cả hai đường dẫn với runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Nó tạo một Plugin giả tạm thời với danh mục công cụ lớn, khởi động nhà cung cấp
OpenAI mô phỏng, khởi động Gateway một lần ở chế độ trực tiếp và một lần với Tìm kiếm công cụ
được bật, rồi so sánh payload yêu cầu của nhà cung cấp và nhật ký phiên.

Kiểm thử hồi quy chứng minh:

1. Chế độ trực tiếp có thể gọi công cụ Plugin giả.
2. Tìm kiếm công cụ có thể gọi cùng công cụ Plugin giả đó.
3. Chế độ trực tiếp phơi bày trực tiếp các schema công cụ Plugin giả cho nhà cung cấp.
4. Tìm kiếm công cụ chỉ phơi bày cầu nối gọn nhẹ.
5. Payload yêu cầu của Tìm kiếm công cụ nhỏ hơn đối với danh mục giả lớn.
6. Nhật ký phiên hiển thị số lượt gọi công cụ dự kiến và telemetry lệnh gọi qua cầu nối.

## Hành vi khi lỗi

Tìm kiếm công cụ nên đóng an toàn khi lỗi:

- nếu một công cụ không nằm trong chính sách hiệu lực, tìm kiếm không nên trả về công cụ đó
- nếu một công cụ đã chọn không còn khả dụng, `tool_call` nên thất bại
- nếu chính sách hoặc phê duyệt chặn thực thi, kết quả lệnh gọi nên báo cáo
  việc chặn đó thay vì vượt qua nó
- nếu cầu nối mã không thể tạo runtime được cô lập, hãy dùng `mode: "tools"` hoặc
  tắt Tìm kiếm công cụ cho triển khai đó

## Liên quan

- [Công cụ và Plugin](/vi/tools)
- [Sandbox đa tác nhân và công cụ](/vi/tools/multi-agent-sandbox-tools)
- [Công cụ Exec](/vi/tools/exec)
- [Thiết lập tác nhân ACP](/vi/tools/acp-agents-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
