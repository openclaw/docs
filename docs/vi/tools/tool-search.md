---
read_when:
    - Bạn muốn các tác tử OpenClaw sử dụng một danh mục công cụ lớn mà không cần thêm lược đồ của mọi công cụ vào prompt
    - Bạn muốn các công cụ OpenClaw, công cụ MCP và công cụ phía máy khách được cung cấp thông qua một bề mặt runtime nhỏ gọn duy nhất
    - Bạn đang triển khai hoặc gỡ lỗi quá trình khám phá công cụ cho các lượt chạy OpenClaw
summary: 'Tìm kiếm công cụ: thu gọn các danh mục công cụ OpenClaw lớn bằng chức năng tìm kiếm, mô tả và gọi công cụ'
title: Tìm kiếm công cụ
x-i18n:
    generated_at: "2026-07-19T06:05:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d31322d5ef108c52fd14d48771cc3c6c43fcfbc4bfb95652bc29a55fd706c903
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search là một tính năng thử nghiệm của runtime agent OpenClaw. Tính năng này cung cấp cho agent một
cách nhỏ gọn để khám phá và gọi các danh mục công cụ lớn. Tính năng này hữu ích khi lượt chạy
có nhiều công cụ khả dụng nhưng mô hình có khả năng chỉ cần một vài công cụ trong số đó.

Trang này mô tả Tool Search của OpenClaw. Đây không phải là bề mặt tìm kiếm công cụ
hoặc công cụ động gốc của Codex. Chế độ mã gốc của Codex, tìm kiếm công cụ, công cụ động
trì hoãn và lệnh gọi công cụ lồng nhau là các bề mặt ổn định của bộ khung Codex và
không phụ thuộc vào `tools.toolSearch`.

Đối với runtime OpenClaw chung cung cấp bề mặt QuickJS-WASI `exec`/`wait`
thay vì các điều khiển Tool Search, hãy xem [Chế độ mã](/tools/code-mode).

Khi được bật cho các lượt chạy OpenClaw, theo mặc định mô hình nhận một công cụ `tool_search_code`,
cùng với mọi công cụ chỉ-trực-tiếp có kết quả có cấu trúc không thể đi qua
cầu nối nhỏ gọn. Công cụ mã chạy một phần thân JavaScript ngắn trong một
tiến trình con Node biệt lập với cầu nối `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Danh mục có thể bao gồm các công cụ OpenClaw đủ điều kiện đưa vào danh mục, công cụ plugin, công cụ MCP
và công cụ do máy khách cung cấp. Mô hình không thấy trước mọi lược đồ đã được lập danh mục.
Thay vào đó, mô hình tìm kiếm các bộ mô tả nhỏ gọn, xem mô tả của một
công cụ đã chọn khi cần lược đồ chính xác và gọi công cụ đó thông qua OpenClaw.
Các công cụ chỉ-trực-tiếp vẫn hiển thị với mô hình và không được thêm vào danh mục.

Các lượt chạy của bộ khung Codex không nhận những điều khiển Tool Search thử nghiệm
này của OpenClaw. OpenClaw chuyển các khả năng của sản phẩm cho Codex dưới dạng công cụ động, còn
Codex sở hữu chế độ mã gốc ổn định, tìm kiếm công cụ gốc, công cụ động
trì hoãn và lệnh gọi công cụ lồng nhau.

## Cách một lượt chạy hoạt động

Tại thời điểm lập kế hoạch, trình chạy nhúng của OpenClaw xây dựng danh mục hiệu lực cho
lượt chạy:

1. Phân giải chính sách công cụ đang hoạt động cho agent, hồ sơ, sandbox và phiên.
2. Liệt kê các công cụ OpenClaw và plugin đủ điều kiện.
3. Liệt kê các công cụ MCP đủ điều kiện thông qua runtime MCP của phiên.
4. Thêm các công cụ máy khách đủ điều kiện được cung cấp cho lượt chạy hiện tại.
5. Giữ các công cụ chỉ-trực-tiếp hiển thị với mô hình và lập chỉ mục các bộ mô tả nhỏ gọn cho
   những công cụ còn lại đủ điều kiện đưa vào danh mục.
6. Cung cấp cầu nối mã OpenClaw, các công cụ dự phòng có cấu trúc hoặc
   bề mặt thư mục nhỏ gọn cùng với các công cụ chỉ-trực-tiếp đó.

Tại thời điểm thực thi, mọi lệnh gọi công cụ thực tế đều quay lại OpenClaw. Runtime Node
biệt lập không lưu giữ phần triển khai plugin, đối tượng máy khách MCP hoặc bí mật.
`openclaw.tools.call(...)` đi qua cầu nối trở lại Gateway, nơi
việc xử lý chính sách, phê duyệt, hook, ghi nhật ký và kết quả thông thường vẫn được áp dụng.

## Chế độ

`tools.toolSearch` có ba chế độ dành cho mô hình:

- `code`: cung cấp `tool_search_code`, cầu nối JavaScript nhỏ gọn mặc định,
  cùng với các công cụ chỉ-trực-tiếp.
- `tools`: cung cấp `tool_search`, `tool_describe` và `tool_call` dưới dạng
  các công cụ có cấu trúc thuần túy cho những nhà cung cấp không nên nhận mã, cùng với
  các công cụ chỉ-trực-tiếp.
- `directory`: cung cấp `tool_search`, `tool_describe` và `tool_call` cùng với một
  thư mục lời nhắc có giới hạn chứa tên và mô tả của các công cụ khả dụng cho
  những nhà cung cấp cần thấy tên công cụ mà không cần mọi lược đồ đầy đủ. OpenClaw cũng có thể
  cung cấp trực tiếp một tập hợp nhỏ có giới hạn gồm các lược đồ công cụ có khả năng cần thiết hoặc bắt buộc
  cho lượt hiện tại. Các công cụ chỉ-trực-tiếp cũng vẫn hiển thị trong chế độ này.

Tất cả các chế độ đều sử dụng cùng danh mục đã lọc theo chính sách và đường dẫn thực thi
OpenClaw thông thường. Các công cụ được đánh dấu `catalogMode: "direct-only"` nằm ngoài danh mục đó và
vẫn hiển thị với mô hình. Nếu runtime hiện tại không thể khởi chạy tiến trình con Node biệt lập
ở chế độ mã, chế độ `code` mặc định sẽ quay về `tools` trước khi thu gọn
danh mục. Trong chế độ `directory`, các công cụ do máy khách cung cấp vẫn hiển thị trực tiếp
cho lượt chạy hiện tại, trong khi các công cụ OpenClaw, công cụ plugin và công cụ MCP có thể được
thu gọn phía sau danh mục thư mục. Một lệnh gọi trực tiếp đến tên thư mục ẩn chính xác
sẽ được nạp từ chính danh mục đã được cấp quyền đó trước khi thực thi.

Tất cả các chế độ đều đang ở trạng thái thử nghiệm. Nên ưu tiên cung cấp công cụ trực tiếp cho các danh mục công cụ
OpenClaw nhỏ và ưu tiên các bề mặt ổn định gốc của Codex cho các lượt chạy bộ khung Codex.

Không có cấu hình lựa chọn nguồn riêng. Khi Tool Search được bật,
danh mục bao gồm các công cụ OpenClaw, MCP và máy khách đủ điều kiện đưa vào danh mục sau khi
lọc theo chính sách thông thường; các công cụ chỉ-trực-tiếp được giữ lại riêng.

## Lý do tồn tại

Các danh mục lớn hữu ích nhưng tốn kém. Việc gửi mọi lược đồ công cụ cho mô hình
làm yêu cầu lớn hơn, làm chậm quá trình lập kế hoạch và tăng nguy cơ chọn nhầm
công cụ.

Tool Search thay đổi cấu trúc:

- công cụ trực tiếp: mô hình thấy mọi lược đồ đã chọn trước token đầu tiên
- chế độ mã Tool Search: mô hình thấy một công cụ mã nhỏ gọn, một hợp đồng API ngắn
  và mọi công cụ chỉ-trực-tiếp
- chế độ công cụ Tool Search: mô hình thấy ba công cụ dự phòng có cấu trúc nhỏ gọn
  cùng với mọi công cụ chỉ-trực-tiếp
- chế độ thư mục Tool Search: mô hình thấy một thư mục có giới hạn cùng với
  các điều khiển tìm kiếm/mô tả/gọi và một tập hợp nhỏ có giới hạn gồm các lược đồ
  có khả năng cần thiết hoặc bắt buộc, cùng với mọi công cụ chỉ-trực-tiếp
- trong lượt chạy: mô hình có thể tải các lược đồ còn lại khi cần

Cung cấp công cụ trực tiếp vẫn là lựa chọn mặc định phù hợp cho các danh mục nhỏ. Tool Search
phù hợp nhất khi một lượt chạy có thể thấy nhiều công cụ, đặc biệt là từ máy chủ MCP hoặc
công cụ ứng dụng do máy khách cung cấp.

## API

`openclaw.tools.search(query, options?)`

Tìm kiếm danh mục hiệu lực cho lượt chạy hiện tại. Kết quả nhỏ gọn và an toàn
để đưa trở lại ngữ cảnh lời nhắc. Mỗi kết quả khớp bao gồm một chữ ký kiểu TypeScript
`input` có giới hạn, chẳng hạn như `{ id: string; mode?: "drip" | "flood" }`, để
mô hình có thể bỏ qua `describe` khi chữ ký đó đã đủ. Một
công cụ lõi OpenClaw hoặc plugin đáng tin cậy cũng có thể bao gồm gợi ý `output` nhỏ gọn, chẳng hạn như
`Array<{ id: string; paid: boolean }>`. Các khai báo lược đồ đầu ra của MCP và máy khách
không được nâng cấp thành gợi ý đáng tin cậy này. Các lược đồ đầu vào không đáng tin cậy của chúng cũng
được trì hoãn dưới dạng `input: "unknown"`; hãy sử dụng `describe` trước khi gọi chúng. Các lược đồ đầu ra
mở, quá lớn hoặc chỉ hoàn chỉnh một phần sẽ bỏ qua gợi ý và thay vào đó vẫn
khả dụng thông qua `describe`.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tải siêu dữ liệu đầy đủ cho một kết quả tìm kiếm, bao gồm lược đồ đầu vào chính xác và
`outputSchema` đầy đủ đáng tin cậy khi công cụ khai báo lược đồ này.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Gọi một công cụ đã chọn thông qua OpenClaw và trả về phong bì `{ tool, result }`
thô. Các công cụ trả về JSON thường đặt giá trị của chúng trong
`result.details`. Nếu một công cụ đáng tin cậy khai báo `outputSchema`, OpenClaw sẽ biên dịch
lược đồ trước khi thực thi và xác thực `details` cuối cùng sau các hook công cụ
thông thường trước khi trả về lệnh gọi danh mục.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Tác giả công cụ khai báo hợp đồng đầu ra trên thuộc tính `outputSchema` của công cụ.
Thuộc tính này mô tả `AgentToolResult.details`, không phải các khối nội dung đã kết xuất. Hãy bao gồm
tất cả các biến thể không ném lỗi hoặc bỏ qua thuộc tính này đối với kết quả không ổn định. Xem
[Hợp đồng đầu ra của Chế độ mã](/tools/code-mode#declared-output-contracts) và
[Plugin công cụ](/vi/plugins/tool-plugins#output-contracts).

Chế độ dự phòng có cấu trúc cung cấp các thao tác tương tự dưới dạng công cụ:

- `tool_search`
- `tool_describe`
- `tool_call`

Chế độ thư mục cung cấp:

- `tool_search`
- `tool_describe`
- `tool_call`

Chế độ này cũng giữ các công cụ do máy khách cung cấp và mọi công cụ chỉ-trực-tiếp hiển thị trực tiếp,
đồng thời có thể cung cấp trực tiếp một tập hợp nhỏ có giới hạn gồm các lược đồ công cụ trong danh mục
có khả năng cần thiết hoặc bắt buộc cho lượt hiện tại. Nếu thư mục có giới hạn bỏ sót mục nào, hãy dùng
`tool_search` để tìm chúng. Nếu mô hình yêu cầu trực tiếp tên chính xác của một công cụ thư mục
ẩn, OpenClaw sẽ nạp công cụ đó từ danh mục đã được cấp quyền trước khi
thực thi thông thường.
Tên công cụ máy khách trong chế độ thư mục không được xung đột với tên công cụ OpenClaw, plugin hoặc MCP
vì cơ chế điều phối trì hoãn chính xác sử dụng các tên đó.

## Ranh giới runtime

Cầu nối mã chạy trong một tiến trình con Node tồn tại trong thời gian ngắn. Tiến trình con khởi động
với chế độ quyền của Node được bật, môi trường trống, không được cấp quyền truy cập hệ thống tệp hoặc
mạng và không được cấp quyền cho tiến trình con hoặc worker. OpenClaw thực thi
thời gian chờ theo đồng hồ thực tại tiến trình cha và kết thúc tiến trình con khi hết thời gian, kể cả
sau các phần tiếp diễn bất đồng bộ.

Runtime chỉ cung cấp:

- `console.log`, `console.warn` và `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Hành vi OpenClaw thông thường vẫn áp dụng cho các lệnh gọi cuối cùng:

- chính sách cho phép và từ chối công cụ
- hạn chế công cụ theo từng agent và từng sandbox
- chính sách công cụ của kênh/runtime
- hook phê duyệt
- hook `before_tool_call` của plugin
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

Thay vào đó, sử dụng các công cụ dự phòng có cấu trúc cho các lượt chạy OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Sử dụng bề mặt thư mục nhỏ gọn cho các lượt chạy OpenClaw:

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

Runtime giới hạn `codeTimeoutMs` trong khoảng 1000-60000, `maxSearchLimit` trong khoảng 1-50 và
`searchDefaultLimit` trong khoảng 1..`maxSearchLimit`.

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

- tổng số byte của công cụ và lời nhắc đã tuần tự hóa được gửi đến bộ khung
- kích thước danh mục và phân tích theo nguồn
- số lần tìm kiếm, mô tả và gọi
- các lệnh gọi công cụ cuối cùng được thực thi thông qua OpenClaw
- id và nguồn của công cụ đã chọn

Nhật ký phiên phải giúp trả lời được:

- mô hình đã thấy trước bao nhiêu lược đồ công cụ
- mô hình đã thực hiện bao nhiêu thao tác tìm kiếm và mô tả
- công cụ cuối cùng nào đã được gọi
- kết quả đến từ OpenClaw, MCP hay công cụ máy khách

## Xác thực E2E

Kịch bản Gateway của QA Lab chứng minh cả hai đường dẫn với runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Kịch bản này tạo một plugin giả tạm thời với danh mục công cụ lớn, khởi động nhà cung cấp
OpenAI mô phỏng, khởi động Gateway một lần ở chế độ trực tiếp và một lần khi đã bật Tool Search,
sau đó so sánh payload yêu cầu của nhà cung cấp và nhật ký phiên.

Kiểm thử hồi quy chứng minh:

1. Chế độ trực tiếp có thể gọi công cụ plugin giả lập.
2. Tool Search có thể gọi cùng công cụ plugin giả lập đó.
3. Chế độ trực tiếp cung cấp trực tiếp các schema của công cụ plugin giả lập cho nhà cung cấp.
4. Tool Search chỉ cung cấp cầu nối thu gọn cùng mọi công cụ chỉ dành cho chế độ trực tiếp.
5. Payload yêu cầu của Tool Search nhỏ hơn đối với danh mục giả lập lớn.
6. Nhật ký phiên hiển thị số lượt gọi công cụ dự kiến và dữ liệu đo từ xa của các lệnh gọi qua cầu nối.

## Hành vi khi lỗi

Tool Search phải đóng khi có lỗi:

- nếu một công cụ không nằm trong chính sách có hiệu lực, tìm kiếm không được trả về công cụ đó
- nếu một công cụ đã chọn trở nên không khả dụng, `tool_call` phải thất bại
- nếu chính sách hoặc quy trình phê duyệt chặn việc thực thi, kết quả lệnh gọi phải báo cáo
  việc chặn đó thay vì bỏ qua
- nếu cầu nối mã không thể tạo runtime cô lập, hãy sử dụng `mode: "tools"` hoặc
  vô hiệu hóa Tool Search cho môi trường triển khai đó

## Liên quan

- [Công cụ và plugin](/vi/tools)
- [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools)
- [Công cụ exec](/vi/tools/exec)
- [Thiết lập tác tử ACP](/vi/tools/acp-agents-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
