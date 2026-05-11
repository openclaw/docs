---
read_when:
    - Bạn muốn các tác nhân Pi sử dụng một danh mục công cụ lớn mà không thêm mọi lược đồ công cụ vào lời nhắc
    - Bạn muốn các công cụ OpenClaw, công cụ MCP và công cụ máy khách được hiển thị thông qua một giao diện PI nhỏ gọn
    - Bạn đang triển khai hoặc gỡ lỗi tính năng phát hiện công cụ cho các lượt chạy PI
summary: 'Tìm kiếm công cụ: thu gọn các danh mục công cụ PI lớn sau tìm kiếm, mô tả và gọi'
title: Tìm kiếm công cụ
x-i18n:
    generated_at: "2026-05-11T20:39:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Tìm kiếm công cụ là một tính năng tác nhân PI thử nghiệm của OpenClaw. Tính năng này cung cấp cho các tác nhân PI một cách gọn nhẹ để khám phá và gọi các catalog công cụ lớn. Tính năng này hữu ích khi lượt chạy có nhiều công cụ khả dụng nhưng mô hình có khả năng chỉ cần một vài công cụ trong số đó.

Trang này ghi lại Tìm kiếm công cụ PI của OpenClaw. Đây không phải là bề mặt tìm kiếm công cụ gốc của Codex hay công cụ động. Chế độ mã gốc của Codex, tìm kiếm công cụ, công cụ động trì hoãn và các lệnh gọi công cụ lồng nhau là các bề mặt harness Codex ổn định và không phụ thuộc vào `tools.toolSearch`.

Khi được bật cho PI, mô hình mặc định nhận một công cụ `tool_search_code`. Công cụ đó chạy một phần thân JavaScript ngắn trong một tiến trình con Node cô lập với cầu nối `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Catalog có thể bao gồm công cụ OpenClaw, công cụ Plugin, công cụ MCP và công cụ do client cung cấp. Mô hình không thấy trước mọi schema đầy đủ. Thay vào đó, nó tìm kiếm các mô tả gọn nhẹ, mô tả một công cụ được chọn khi cần schema chính xác, rồi gọi công cụ đó thông qua OpenClaw.

Các lượt chạy harness Codex không nhận các điều khiển Tìm kiếm công cụ thử nghiệm này của OpenClaw. OpenClaw truyền năng lực sản phẩm cho Codex dưới dạng công cụ động, và Codex sở hữu chế độ mã gốc ổn định, tìm kiếm công cụ gốc, công cụ động trì hoãn và các lệnh gọi công cụ lồng nhau.

## Cách một lượt chạy hoạt động

Tại thời điểm lập kế hoạch, trình chạy nhúng PI xây dựng catalog hiệu lực cho lượt chạy:

1. Phân giải chính sách công cụ đang hoạt động cho tác nhân, hồ sơ, sandbox và phiên.
2. Liệt kê các công cụ OpenClaw và Plugin đủ điều kiện.
3. Liệt kê các công cụ MCP đủ điều kiện thông qua runtime MCP của phiên.
4. Thêm các công cụ client đủ điều kiện được cung cấp cho lượt chạy hiện tại.
5. Lập chỉ mục các mô tả gọn nhẹ để tìm kiếm.
6. Cung cấp cầu nối mã PI hoặc các công cụ dự phòng có cấu trúc cho mô hình.

Tại thời điểm thực thi, mọi lệnh gọi công cụ thực đều quay lại OpenClaw. Runtime Node cô lập không giữ triển khai Plugin, đối tượng client MCP hay bí mật. `openclaw.tools.call(...)` đi qua cầu nối trở lại Gateway, nơi các xử lý chính sách, phê duyệt, hook, ghi log và kết quả bình thường vẫn được áp dụng.

## Chế độ

`tools.toolSearch` có hai chế độ hướng tới mô hình:

- `code`: cung cấp `tool_search_code`, cầu nối JavaScript gọn nhẹ mặc định.
- `tools`: cung cấp `tool_search`, `tool_describe` và `tool_call` dưới dạng các công cụ có cấu trúc thuần túy cho các nhà cung cấp không nên nhận mã.

Cả hai chế độ dùng cùng một catalog và đường thực thi. Khác biệt duy nhất là hình dạng mà mô hình nhìn thấy. Nếu runtime hiện tại không thể khởi chạy tiến trình con Node cô lập cho chế độ mã, chế độ `code` mặc định sẽ chuyển về `tools` trước khi nén catalog.

Cả hai chế độ đều là thử nghiệm. Ưu tiên cung cấp công cụ trực tiếp cho các catalog công cụ PI nhỏ, và ưu tiên các bề mặt ổn định gốc của Codex cho các lượt chạy harness Codex.

Không có cấu hình chọn nguồn riêng. Khi Tìm kiếm công cụ được bật, catalog bao gồm các công cụ OpenClaw, MCP và client đủ điều kiện sau khi lọc chính sách bình thường.

## Lý do tồn tại

Catalog lớn hữu ích nhưng tốn kém. Gửi mọi schema công cụ cho mô hình làm yêu cầu lớn hơn, làm chậm việc lập kế hoạch và tăng khả năng chọn nhầm công cụ.

Tìm kiếm công cụ thay đổi hình dạng:

- công cụ trực tiếp: mô hình thấy mọi schema được chọn trước token đầu tiên
- chế độ mã Tìm kiếm công cụ: mô hình thấy một công cụ mã gọn nhẹ và một hợp đồng API ngắn
- chế độ công cụ Tìm kiếm công cụ: mô hình thấy ba công cụ dự phòng có cấu trúc gọn nhẹ
- trong lượt chạy: mô hình chỉ tải các schema công cụ mà nó thực sự cần

Cung cấp công cụ trực tiếp vẫn là mặc định phù hợp cho catalog nhỏ. Tìm kiếm công cụ phù hợp nhất khi một lượt chạy có thể thấy nhiều công cụ, đặc biệt là từ máy chủ MCP hoặc công cụ ứng dụng do client cung cấp.

## API

`openclaw.tools.search(query, options?)`

Tìm kiếm catalog hiệu lực cho lượt chạy hiện tại. Kết quả gọn nhẹ và an toàn để đưa trở lại ngữ cảnh prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tải metadata đầy đủ cho một kết quả tìm kiếm, bao gồm schema đầu vào chính xác.

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

Chế độ dự phòng có cấu trúc cung cấp cùng các thao tác dưới dạng công cụ:

- `tool_search`
- `tool_describe`
- `tool_call`

## Ranh giới runtime

Cầu nối mã chạy trong một tiến trình con Node sống ngắn. Tiến trình con khởi động với chế độ quyền Node được bật, môi trường trống, không có quyền truy cập hệ thống tệp hoặc mạng, và không có quyền cấp cho tiến trình con hoặc worker. OpenClaw áp dụng timeout thời gian thực ở tiến trình cha và chấm dứt tiến trình con khi timeout, bao gồm cả sau các phần tiếp diễn bất đồng bộ.

Runtime chỉ cung cấp:

- `console.log`, `console.warn` và `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Hành vi OpenClaw bình thường vẫn áp dụng cho các lệnh gọi cuối cùng:

- chính sách cho phép và từ chối công cụ
- hạn chế công cụ theo từng tác nhân và từng sandbox
- cổng chỉ dành cho chủ sở hữu
- hook phê duyệt
- hook `before_tool_call` của Plugin
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

Điều chỉnh timeout chế độ mã và giới hạn kết quả tìm kiếm:

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

Tìm kiếm công cụ ghi lại đủ telemetry để so sánh với cung cấp công cụ trực tiếp:

- tổng số byte công cụ và prompt đã tuần tự hóa được gửi tới harness
- kích thước catalog và phân tích theo nguồn
- số lần tìm kiếm, mô tả và gọi
- các lệnh gọi công cụ cuối cùng được thực thi thông qua OpenClaw
- id và nguồn của công cụ được chọn

Log phiên nên cho phép trả lời:

- mô hình đã thấy trước bao nhiêu schema công cụ
- nó đã thực hiện bao nhiêu thao tác tìm kiếm và mô tả
- công cụ cuối cùng nào đã được gọi
- kết quả đến từ OpenClaw, MCP hay công cụ client

## Xác thực E2E

Trình chạy E2E của Gateway chứng minh cả hai đường với harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Nó tạo một Plugin giả tạm thời với catalog công cụ lớn, khởi động nhà cung cấp OpenAI mô phỏng, khởi động Gateway một lần ở chế độ trực tiếp và một lần với Tìm kiếm công cụ được bật, rồi so sánh payload yêu cầu của nhà cung cấp và log phiên.

Kiểm thử hồi quy chứng minh:

1. Chế độ trực tiếp có thể gọi công cụ Plugin giả.
2. Tìm kiếm công cụ có thể gọi cùng công cụ Plugin giả đó.
3. Chế độ trực tiếp cung cấp trực tiếp các schema công cụ Plugin giả cho nhà cung cấp.
4. Tìm kiếm công cụ chỉ cung cấp cầu nối gọn nhẹ.
5. Payload yêu cầu của Tìm kiếm công cụ nhỏ hơn với catalog giả lớn.
6. Log phiên hiển thị số lượng lệnh gọi công cụ dự kiến và telemetry lệnh gọi qua cầu nối.

## Hành vi lỗi

Tìm kiếm công cụ nên đóng khi lỗi:

- nếu một công cụ không nằm trong chính sách hiệu lực, tìm kiếm không nên trả về công cụ đó
- nếu một công cụ được chọn trở nên không khả dụng, `tool_call` nên thất bại
- nếu chính sách hoặc phê duyệt chặn thực thi, kết quả lệnh gọi nên báo cáo việc chặn đó thay vì bỏ qua nó
- nếu cầu nối mã không thể tạo runtime cô lập, hãy dùng `mode: "tools"` hoặc tắt Tìm kiếm công cụ cho triển khai đó

## Liên quan

- [Công cụ và Plugin](/vi/tools)
- [Sandbox đa tác nhân và công cụ](/vi/tools/multi-agent-sandbox-tools)
- [Công cụ Exec](/vi/tools/exec)
- [Thiết lập tác nhân ACP](/vi/tools/acp-agents-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
