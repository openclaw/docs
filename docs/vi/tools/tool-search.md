---
read_when:
    - Bạn muốn các tác nhân OpenClaw sử dụng một danh mục công cụ lớn mà không cần thêm mọi lược đồ công cụ vào lời nhắc
    - Bạn muốn các công cụ OpenClaw, công cụ MCP và công cụ phía máy khách được cung cấp thông qua một bề mặt runtime duy nhất, gọn nhẹ
    - Bạn đang triển khai hoặc gỡ lỗi cơ chế khám phá công cụ cho các lượt chạy OpenClaw
summary: 'Tìm kiếm công cụ: thu gọn các danh mục công cụ OpenClaw lớn bằng chức năng tìm kiếm, mô tả và gọi công cụ'
title: Tìm kiếm công cụ
x-i18n:
    generated_at: "2026-07-12T08:26:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search là một tính năng thử nghiệm của môi trường chạy tác nhân OpenClaw. Tính năng này cung cấp cho tác nhân một cách thức nhỏ gọn duy nhất để khám phá và gọi các danh mục công cụ lớn. Tính năng này hữu ích khi một lượt chạy có nhiều công cụ khả dụng nhưng mô hình có khả năng chỉ cần một vài công cụ trong số đó.

Trang này trình bày về Tool Search của OpenClaw. Đây không phải là bề mặt tìm kiếm công cụ hoặc công cụ động nguyên bản của Codex. Chế độ mã nguyên bản của Codex, tìm kiếm công cụ, công cụ động trì hoãn và lệnh gọi công cụ lồng nhau là các bề mặt ổn định của bộ khung Codex và không phụ thuộc vào `tools.toolSearch`.

Khi được bật cho các lượt chạy OpenClaw, theo mặc định mô hình nhận một công cụ `tool_search_code`, cùng với mọi công cụ chỉ-trực-tiếp có kết quả có cấu trúc không thể đi qua cầu nối nhỏ gọn. Công cụ mã chạy một đoạn JavaScript ngắn trong một tiến trình con Node biệt lập có cầu nối `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Danh mục có thể bao gồm các công cụ OpenClaw đủ điều kiện đưa vào danh mục, công cụ Plugin, công cụ MCP và công cụ do máy khách cung cấp. Mô hình không nhìn thấy trước mọi lược đồ trong danh mục. Thay vào đó, mô hình tìm kiếm các bộ mô tả nhỏ gọn, lấy mô tả của một công cụ đã chọn khi cần lược đồ chính xác, rồi gọi công cụ đó thông qua OpenClaw. Các công cụ chỉ-trực-tiếp vẫn hiển thị với mô hình và không được thêm vào danh mục.

Các lượt chạy của bộ khung Codex không nhận những tùy chọn điều khiển Tool Search thử nghiệm này của OpenClaw. OpenClaw truyền các khả năng sản phẩm cho Codex dưới dạng công cụ động, còn Codex sở hữu chế độ mã nguyên bản ổn định, tìm kiếm công cụ nguyên bản, công cụ động trì hoãn và lệnh gọi công cụ lồng nhau.

## Cách một lượt hoạt động

Ở thời điểm lập kế hoạch, trình chạy nhúng của OpenClaw xây dựng danh mục có hiệu lực cho lượt chạy:

1. Phân giải chính sách công cụ đang hoạt động cho tác nhân, hồ sơ, sandbox và phiên.
2. Liệt kê các công cụ OpenClaw và Plugin đủ điều kiện.
3. Liệt kê các công cụ MCP đủ điều kiện thông qua môi trường chạy MCP của phiên.
4. Thêm các công cụ máy khách đủ điều kiện được cung cấp cho lượt chạy hiện tại.
5. Giữ các công cụ chỉ-trực-tiếp hiển thị với mô hình và lập chỉ mục các bộ mô tả nhỏ gọn cho những công cụ đủ điều kiện đưa vào danh mục còn lại.
6. Cung cấp cầu nối mã OpenClaw, các công cụ dự phòng có cấu trúc hoặc bề mặt thư mục nhỏ gọn cùng với những công cụ chỉ-trực-tiếp đó.

Ở thời điểm thực thi, mọi lệnh gọi công cụ thực tế đều quay lại OpenClaw. Môi trường chạy Node biệt lập không nắm giữ các triển khai Plugin, đối tượng máy khách MCP hoặc bí mật. `openclaw.tools.call(...)` đi qua cầu nối trở lại Gateway, nơi chính sách, phê duyệt, hook, ghi nhật ký và xử lý kết quả thông thường vẫn được áp dụng.

## Chế độ

`tools.toolSearch` có ba chế độ hướng tới mô hình:

- `code`: cung cấp `tool_search_code`, cầu nối JavaScript nhỏ gọn mặc định, cùng với các công cụ chỉ-trực-tiếp.
- `tools`: cung cấp `tool_search`, `tool_describe` và `tool_call` dưới dạng các công cụ có cấu trúc thuần túy cho những nhà cung cấp không nên nhận mã, cùng với các công cụ chỉ-trực-tiếp.
- `directory`: cung cấp `tool_search`, `tool_describe` và `tool_call`, cùng một thư mục có giới hạn trong lời nhắc gồm tên và mô tả các công cụ khả dụng, dành cho những nhà cung cấp cần thấy tên công cụ nhưng không cần mọi lược đồ đầy đủ. OpenClaw cũng có thể cung cấp trực tiếp một tập hợp nhỏ có giới hạn gồm các lược đồ công cụ có khả năng cần thiết hoặc bắt buộc cho lượt hiện tại. Các công cụ chỉ-trực-tiếp cũng vẫn hiển thị trong chế độ này.

Mọi chế độ đều sử dụng cùng một danh mục đã lọc theo chính sách và đường dẫn thực thi OpenClaw thông thường. Các công cụ được đánh dấu `catalogMode: "direct-only"` nằm ngoài danh mục đó và vẫn hiển thị với mô hình. Nếu môi trường chạy hiện tại không thể khởi chạy tiến trình con Node biệt lập cho chế độ mã, chế độ `code` mặc định sẽ chuyển sang `tools` trước khi Compaction danh mục. Trong chế độ `directory`, các công cụ do máy khách cung cấp vẫn hiển thị trực tiếp cho lượt chạy hiện tại, trong khi các công cụ OpenClaw, công cụ Plugin và công cụ MCP có thể được thu gọn phía sau danh mục thư mục. Một lệnh gọi trực tiếp đến tên thư mục chính xác đang bị ẩn sẽ được nạp từ chính danh mục đã được ủy quyền đó trước khi thực thi.

Mọi chế độ đều đang ở trạng thái thử nghiệm. Nên ưu tiên cung cấp công cụ trực tiếp cho các danh mục công cụ OpenClaw nhỏ và ưu tiên các bề mặt ổn định nguyên bản của Codex cho các lượt chạy của bộ khung Codex.

Không có cấu hình chọn nguồn riêng biệt. Khi Tool Search được bật, danh mục bao gồm các công cụ OpenClaw, MCP và máy khách đủ điều kiện đưa vào danh mục sau khi lọc theo chính sách thông thường; các công cụ chỉ-trực-tiếp được giữ riêng.

## Lý do tồn tại

Danh mục lớn rất hữu ích nhưng tốn kém. Việc gửi mọi lược đồ công cụ đến mô hình làm yêu cầu lớn hơn, làm chậm quá trình lập kế hoạch và tăng khả năng vô tình chọn nhầm công cụ.

Tool Search thay đổi cấu trúc:

- công cụ trực tiếp: mô hình thấy mọi lược đồ đã chọn trước token đầu tiên
- chế độ mã Tool Search: mô hình thấy một công cụ mã nhỏ gọn, một hợp đồng API ngắn và mọi công cụ chỉ-trực-tiếp
- chế độ công cụ Tool Search: mô hình thấy ba công cụ dự phòng có cấu trúc nhỏ gọn cùng với mọi công cụ chỉ-trực-tiếp
- chế độ thư mục Tool Search: mô hình thấy một thư mục có giới hạn cùng với các tùy chọn điều khiển tìm kiếm/mô tả/gọi và một tập hợp nhỏ có giới hạn gồm các lược đồ có khả năng cần thiết hoặc bắt buộc, cùng với mọi công cụ chỉ-trực-tiếp
- trong lượt: mô hình có thể tải các lược đồ còn lại khi cần

Cung cấp công cụ trực tiếp vẫn là lựa chọn mặc định phù hợp cho các danh mục nhỏ. Tool Search phù hợp nhất khi một lượt chạy có thể thấy nhiều công cụ, đặc biệt là từ các máy chủ MCP hoặc công cụ ứng dụng do máy khách cung cấp.

## API

`openclaw.tools.search(query, options?)`

Tìm kiếm danh mục có hiệu lực cho lượt chạy hiện tại. Kết quả nhỏ gọn và an toàn để đưa trở lại ngữ cảnh lời nhắc.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tải siêu dữ liệu đầy đủ cho một kết quả tìm kiếm, bao gồm lược đồ đầu vào chính xác.

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

Chế độ thư mục cung cấp:

- `tool_search`
- `tool_describe`
- `tool_call`

Chế độ này cũng giữ các công cụ do máy khách cung cấp và mọi công cụ chỉ-trực-tiếp hiển thị trực tiếp, đồng thời có thể cung cấp trực tiếp một tập hợp nhỏ có giới hạn gồm các lược đồ công cụ trong danh mục có khả năng cần thiết hoặc bắt buộc cho lượt hiện tại. Nếu thư mục có giới hạn bỏ sót mục nhập, hãy dùng `tool_search` để tìm chúng. Nếu mô hình yêu cầu trực tiếp một tên công cụ thư mục chính xác đang bị ẩn, OpenClaw sẽ nạp công cụ đó từ danh mục đã được ủy quyền trước khi thực thi thông thường.
Tên công cụ máy khách trong chế độ thư mục không được xung đột với tên công cụ OpenClaw, Plugin hoặc MCP vì hoạt động điều phối trì hoãn chính xác sử dụng các tên đó.

## Ranh giới môi trường chạy

Cầu nối mã chạy trong một tiến trình con Node tồn tại ngắn hạn. Tiến trình con khởi động với chế độ quyền Node được bật, môi trường trống, không được cấp quyền truy cập hệ thống tệp hoặc mạng, và không được cấp quyền tạo tiến trình con hoặc worker. OpenClaw áp dụng thời gian chờ theo thời gian thực tế tại tiến trình cha và kết thúc tiến trình con khi hết thời gian chờ, kể cả sau các phần tiếp tục bất đồng bộ.

Môi trường chạy chỉ cung cấp:

- `console.log`, `console.warn` và `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Hành vi OpenClaw thông thường vẫn áp dụng cho các lệnh gọi cuối cùng:

- chính sách cho phép và từ chối công cụ
- giới hạn công cụ theo từng tác nhân và từng sandbox
- chính sách công cụ của kênh/môi trường chạy
- hook phê duyệt
- hook `before_tool_call` của Plugin
- danh tính phiên, nhật ký và dữ liệu đo từ xa

## Cấu hình

Bật Tool Search cho các lượt chạy OpenClaw bằng cầu nối mã mặc định:

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

Thay vào đó, dùng các công cụ dự phòng có cấu trúc cho các lượt chạy OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Thay vào đó, dùng bề mặt thư mục nhỏ gọn cho các lượt chạy OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Điều chỉnh thời gian chờ của chế độ mã và giới hạn kết quả tìm kiếm (các giá trị hiển thị là mặc định):

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

Môi trường chạy giới hạn `codeTimeoutMs` trong khoảng 1000-60000, `maxSearchLimit` trong khoảng 1-50 và `searchDefaultLimit` trong khoảng 1..`maxSearchLimit`.

Tắt tính năng:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Lời nhắc và dữ liệu đo từ xa

Tool Search ghi lại đủ dữ liệu đo từ xa để so sánh với việc cung cấp công cụ trực tiếp:

- tổng số byte công cụ và lời nhắc đã tuần tự hóa được gửi đến bộ khung
- kích thước danh mục và phân tích theo nguồn
- số lần tìm kiếm, mô tả và gọi
- các lệnh gọi công cụ cuối cùng được thực thi thông qua OpenClaw
- mã định danh và nguồn của các công cụ đã chọn

Nhật ký phiên cần cho phép trả lời:

- mô hình đã thấy trước bao nhiêu lược đồ công cụ
- mô hình đã thực hiện bao nhiêu thao tác tìm kiếm và mô tả
- công cụ cuối cùng nào đã được gọi
- kết quả đến từ OpenClaw, MCP hay công cụ máy khách

## Xác thực E2E

Kịch bản Gateway của Phòng thí nghiệm QA chứng minh cả hai đường dẫn với môi trường chạy OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Kịch bản này tạo một Plugin giả tạm thời có danh mục công cụ lớn, khởi động nhà cung cấp OpenAI giả lập, khởi động Gateway một lần ở chế độ trực tiếp và một lần khi bật Tool Search, sau đó so sánh tải trọng yêu cầu của nhà cung cấp và nhật ký phiên.

Kiểm thử hồi quy chứng minh:

1. Chế độ trực tiếp có thể gọi công cụ Plugin giả.
2. Tool Search có thể gọi cùng công cụ Plugin giả đó.
3. Chế độ trực tiếp cung cấp trực tiếp các lược đồ công cụ Plugin giả cho nhà cung cấp.
4. Tool Search chỉ cung cấp cầu nối nhỏ gọn cùng với mọi công cụ chỉ-trực-tiếp.
5. Tải trọng yêu cầu của Tool Search nhỏ hơn đối với danh mục giả lớn.
6. Nhật ký phiên hiển thị số lượng lệnh gọi công cụ dự kiến và dữ liệu đo từ xa của lệnh gọi qua cầu nối.

## Hành vi khi lỗi

Tool Search phải đóng an toàn khi lỗi:

- nếu một công cụ không nằm trong chính sách có hiệu lực, tìm kiếm không được trả về công cụ đó
- nếu một công cụ đã chọn không còn khả dụng, `tool_call` phải thất bại
- nếu chính sách hoặc phê duyệt chặn việc thực thi, kết quả lệnh gọi phải báo cáo việc chặn đó thay vì bỏ qua
- nếu cầu nối mã không thể tạo môi trường chạy biệt lập, hãy dùng `mode: "tools"` hoặc tắt Tool Search cho hệ thống triển khai đó

## Liên quan

- [Công cụ và Plugin](/vi/tools)
- [Sandbox và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
- [Công cụ thực thi](/vi/tools/exec)
- [Thiết lập tác nhân ACP](/vi/tools/acp-agents-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
