---
read_when:
    - Bạn muốn các tác tử Pi sử dụng một danh mục công cụ lớn mà không cần thêm mọi lược đồ công cụ vào lời nhắc
    - Bạn muốn các công cụ OpenClaw, công cụ MCP và công cụ máy khách được cung cấp qua một bề mặt PI nhỏ gọn duy nhất
    - Bạn đang triển khai hoặc gỡ lỗi việc phát hiện công cụ cho các lần chạy PI
summary: 'Tìm kiếm công cụ: thu gọn các danh mục công cụ PI lớn phía sau tìm kiếm, mô tả và gọi'
title: Tìm kiếm công cụ
x-i18n:
    generated_at: "2026-05-10T19:55:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Tìm kiếm công cụ cung cấp cho các tác tử PI một cách gọn nhẹ để khám phá và gọi các danh mục công cụ lớn. Tính năng này hữu ích khi lượt chạy có nhiều công cụ khả dụng nhưng mô hình có khả năng chỉ cần một vài công cụ trong số đó.

Khi được bật cho PI, mặc định mô hình nhận một công cụ `tool_search_code`. Công cụ đó chạy một phần thân JavaScript ngắn trong một tiến trình con Node cô lập với cầu nối `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Danh mục có thể bao gồm công cụ OpenClaw, công cụ plugin, công cụ MCP và công cụ do máy khách cung cấp. Mô hình không thấy trước toàn bộ mọi schema đầy đủ. Thay vào đó, mô hình tìm kiếm các mô tả gọn nhẹ, mô tả một công cụ đã chọn khi cần schema chính xác, rồi gọi công cụ đó thông qua OpenClaw.

Các lượt chạy của Codex harness không nhận các điều khiển Tìm kiếm công cụ này của OpenClaw. OpenClaw truyền các năng lực sản phẩm cho Codex dưới dạng công cụ động, và Codex sở hữu chế độ mã gốc, tìm kiếm công cụ gốc, công cụ động trì hoãn và lời gọi công cụ lồng nhau.

## Cách một lượt chạy hoạt động

Tại thời điểm lập kế hoạch, trình chạy nhúng PI xây dựng danh mục hiệu lực cho lượt chạy:

1. Phân giải chính sách công cụ đang hoạt động cho tác tử, hồ sơ, sandbox và phiên.
2. Liệt kê các công cụ OpenClaw và plugin đủ điều kiện.
3. Liệt kê các công cụ MCP đủ điều kiện thông qua runtime MCP của phiên.
4. Thêm các công cụ máy khách đủ điều kiện được cung cấp cho lượt chạy hiện tại.
5. Lập chỉ mục các mô tả gọn nhẹ để tìm kiếm.
6. Phơi bày cầu nối mã PI hoặc các công cụ dự phòng có cấu trúc cho mô hình.

Tại thời điểm thực thi, mọi lời gọi công cụ thực đều trả về OpenClaw. Runtime Node cô lập không giữ các triển khai plugin, đối tượng máy khách MCP hoặc bí mật. `openclaw.tools.call(...)` băng qua cầu nối để quay lại Gateway, nơi chính sách, phê duyệt, hook, ghi log và xử lý kết quả thông thường vẫn được áp dụng.

## Chế độ

`tools.toolSearch` có hai chế độ hướng tới mô hình:

- `code`: phơi bày `tool_search_code`, cầu nối JavaScript gọn nhẹ mặc định.
- `tools`: phơi bày `tool_search`, `tool_describe` và `tool_call` dưới dạng công cụ có cấu trúc thuần túy cho các nhà cung cấp không nên nhận mã.

Cả hai chế độ dùng cùng một danh mục và đường dẫn thực thi. Khác biệt duy nhất là hình dạng mà mô hình nhìn thấy. Nếu runtime hiện tại không thể khởi chạy tiến trình con Node chế độ mã cô lập, chế độ `code` mặc định sẽ quay về `tools` trước khi nén danh mục.

Không có cấu hình chọn nguồn riêng. Khi Tìm kiếm công cụ được bật, danh mục bao gồm các công cụ OpenClaw, MCP và máy khách đủ điều kiện sau khi lọc chính sách thông thường.

## Lý do tồn tại

Danh mục lớn hữu ích nhưng tốn kém. Gửi mọi schema công cụ cho mô hình làm yêu cầu lớn hơn, làm chậm việc lập kế hoạch và tăng khả năng chọn nhầm công cụ.

Tìm kiếm công cụ thay đổi hình dạng:

- công cụ trực tiếp: mô hình thấy mọi schema đã chọn trước token đầu tiên
- chế độ mã Tìm kiếm công cụ: mô hình thấy một công cụ mã gọn nhẹ và một hợp đồng API ngắn
- chế độ công cụ Tìm kiếm công cụ: mô hình thấy ba công cụ dự phòng có cấu trúc gọn nhẹ
- trong lượt chạy: mô hình chỉ tải các schema công cụ mà nó thực sự cần

Phơi bày công cụ trực tiếp vẫn là mặc định đúng cho các danh mục nhỏ. Tìm kiếm công cụ phù hợp nhất khi một lượt chạy có thể thấy nhiều công cụ, đặc biệt là từ máy chủ MCP hoặc công cụ ứng dụng do máy khách cung cấp.

## API

`openclaw.tools.search(query, options?)`

Tìm kiếm danh mục hiệu lực cho lượt chạy hiện tại. Kết quả gọn nhẹ và an toàn để đưa trở lại ngữ cảnh prompt.

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

## Ranh giới runtime

Cầu nối mã chạy trong một tiến trình con Node ngắn hạn. Tiến trình con khởi động với chế độ quyền của Node được bật, môi trường trống, không có quyền hệ thống tệp hoặc mạng, và không có quyền tiến trình con hoặc worker. OpenClaw thực thi thời gian chờ theo đồng hồ treo tường của tiến trình cha và hủy tiến trình con khi hết thời gian, kể cả sau các phần tiếp diễn bất đồng bộ.

Runtime chỉ phơi bày:

- `console.log`, `console.warn` và `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Hành vi OpenClaw thông thường vẫn áp dụng cho các lời gọi cuối cùng:

- chính sách cho phép và từ chối công cụ
- hạn chế công cụ theo tác tử và theo sandbox
- cổng chỉ dành cho chủ sở hữu
- hook phê duyệt
- hook `before_tool_call` của plugin
- danh tính phiên, log và telemetry

## Cấu hình

Bật Tìm kiếm công cụ cho các lượt chạy PI với cầu nối mã mặc định:

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

Thay vào đó dùng các công cụ dự phòng có cấu trúc cho các lượt chạy PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Tinh chỉnh thời gian chờ chế độ mã và giới hạn kết quả tìm kiếm:

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

- tổng số byte công cụ đã tuần tự hóa và prompt được gửi đến harness
- kích thước danh mục và phân tách theo nguồn
- số lần tìm kiếm, mô tả và gọi
- các lời gọi công cụ cuối cùng được thực thi thông qua OpenClaw
- id và nguồn của công cụ đã chọn

Log phiên nên giúp có thể trả lời:

- mô hình đã thấy trước bao nhiêu schema công cụ
- mô hình đã thực hiện bao nhiêu thao tác tìm kiếm và mô tả
- công cụ cuối cùng nào đã được gọi
- kết quả đến từ OpenClaw, MCP hay công cụ máy khách

## Xác thực E2E

Trình chạy E2E của Gateway chứng minh cả hai đường dẫn với PI harness:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Nó tạo một plugin giả tạm thời với danh mục công cụ lớn, khởi động nhà cung cấp OpenAI giả lập, khởi động Gateway một lần ở chế độ trực tiếp và một lần khi bật Tìm kiếm công cụ, rồi so sánh payload yêu cầu của nhà cung cấp và log phiên.

Hồi quy chứng minh:

1. Chế độ trực tiếp có thể gọi công cụ plugin giả.
2. Tìm kiếm công cụ có thể gọi cùng công cụ plugin giả đó.
3. Chế độ trực tiếp phơi bày trực tiếp các schema công cụ plugin giả cho nhà cung cấp.
4. Tìm kiếm công cụ chỉ phơi bày cầu nối gọn nhẹ.
5. Payload yêu cầu Tìm kiếm công cụ nhỏ hơn đối với danh mục giả lớn.
6. Log phiên hiển thị số lần gọi công cụ dự kiến và telemetry lời gọi qua cầu nối.

## Hành vi khi lỗi

Tìm kiếm công cụ nên thất bại theo hướng đóng:

- nếu một công cụ không nằm trong chính sách hiệu lực, tìm kiếm không nên trả về công cụ đó
- nếu một công cụ đã chọn trở nên không khả dụng, `tool_call` nên thất bại
- nếu chính sách hoặc phê duyệt chặn thực thi, kết quả lời gọi nên báo cáo chặn đó thay vì bỏ qua nó
- nếu cầu nối mã không thể tạo runtime cô lập, hãy dùng `mode: "tools"` hoặc tắt Tìm kiếm công cụ cho triển khai đó

## Liên quan

- [Công cụ và plugin](/vi/tools)
- [Sandbox đa tác tử và công cụ](/vi/tools/multi-agent-sandbox-tools)
- [Công cụ exec](/vi/tools/exec)
- [Thiết lập tác tử ACP](/vi/tools/acp-agents-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
