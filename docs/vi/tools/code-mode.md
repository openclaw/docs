---
read_when:
    - Bạn muốn bật chế độ mã của OpenClaw cho một lượt chạy tác nhân
    - Bạn cần giải thích tại sao Code Mode khác với Codex Code Mode
    - Bạn đang review hợp đồng công cụ tinh gọn, sandbox QuickJS-WASI, phép biến đổi TypeScript hoặc cầu nối danh mục công cụ ẩn
    - Bạn đang thêm hoặc review một tích hợp sổ đăng ký namespace chế độ mã nội bộ
sidebarTitle: Code Mode
summary: Sử dụng Chế độ Code của OpenClaw để khám phá, gọi và kết hợp các danh mục công cụ lớn trong quy trình làm việc JavaScript hoặc TypeScript gọn nhẹ
title: Chế độ mã nguồn
x-i18n:
    generated_at: "2026-07-19T17:03:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a21df3bcfb11668da6dde1f7c69adcc284a28dc491c95f95097ce7f41e5c45bf
    source_path: tools/code-mode.md
    workflow: 16
---

Chế độ mã là một tính năng thử nghiệm, yêu cầu chủ động bật, của môi trường chạy tác nhân OpenClaw. Khi
được bật, mô hình không còn thấy mọi lược đồ công cụ đã bật; thay vào đó, mô hình thấy
`exec`, `wait` và mọi công cụ chỉ-trực-tiếp có kết quả có cấu trúc không thể đi qua
cầu nối khách chỉ hỗ trợ JSON. Mô hình viết một chương trình JavaScript hoặc TypeScript nhỏ
để tìm kiếm, mô tả và gọi danh mục công cụ ẩn.

Trang này trình bày chế độ mã của OpenClaw, không phải Codex Code Mode. Hai tính năng
có cùng tên và cùng tên công cụ điều khiển (`exec`, `wait`), nhưng là
các cách triển khai riêng biệt:

- Codex Code Mode chạy bên trong bộ khung lập trình Codex. Công cụ `exec` của nó là một
  công cụ ngữ pháp dạng tự do: mô hình viết mã nguồn JavaScript thô (có thể
  thêm tiền tố là một dòng pragma `// @exec: {...}` cho các tùy chọn thực thi), được thực thi
  trong môi trường chạy V8 Code Mode nội tiến trình của Codex.
- Chế độ mã OpenClaw chạy trong môi trường chạy tác nhân OpenClaw dùng chung và
  bị tắt trừ khi `tools.codeMode.enabled: true` được cấu hình. Công cụ `exec`
  của nó nhận một tải trọng JSON `{ code, language }`, được thực thi trong một worker
  QuickJS-WASI.

Cả hai đều là bề mặt thực thi JavaScript, không phải bề mặt lệnh shell. Hãy coi chúng
là các tính năng độc lập, được triển khai khác nhau nhưng tình cờ cung cấp
các công cụ `exec`/`wait` có tên giống hệt nhau.

## Chức năng

- Danh sách công cụ mà mô hình thấy trở thành `exec`, `wait`, cùng mọi công cụ chỉ-trực-tiếp
  như `computer` hoặc trình tải thị giác gốc `image` có kết quả hình ảnh
  không thể đi qua cầu nối khách.
- `exec` đánh giá JavaScript hoặc TypeScript do mô hình tạo trong một luồng worker
  QuickJS-WASI biệt lập.
- Mọi công cụ đã bật đủ điều kiện đưa vào danh mục (lõi OpenClaw, plugin, MCP, máy khách) đều bị ẩn dưới dạng
  công cụ mô hình độc lập và được cung cấp bên trong chương trình khách thông qua `ALL_TOOLS`
  và `tools`.
- Phần mô tả `exec` chứa một chỉ mục nhanh có giới hạn gồm các mã định danh danh mục OpenClaw/plugin
  chính xác, gợi ý đầu vào cô đọng và gợi ý đầu ra đã khai báo cô đọng khi một
  công cụ đáng tin cậy cung cấp lược đồ đầu ra. Phần này bỏ qua mô tả, lược đồ đầy đủ,
  mục MCP và các mục vượt giới hạn; tra cứu danh mục phía khách vẫn là phương án dự phòng.
- Mã khách tìm kiếm danh mục ẩn, mô tả lược đồ của công cụ và gọi
  công cụ qua cùng đường dẫn thực thi được dùng cho các lượt tác nhân thông thường (chính sách,
  phê duyệt, hook và đo từ xa đều vẫn áp dụng).
- Các công cụ MCP được nhóm trong không gian tên `MCP`; trong chế độ mã, đây là
  cách duy nhất được hỗ trợ để gọi chúng.
- `wait` tiếp tục một lượt chạy chế độ mã đã bị tạm dừng khi các lệnh gọi công cụ lồng nhau vẫn
  đang chờ xử lý.

Chế độ mã chỉ thay đổi bề mặt điều phối dành cho mô hình. Nó không
thay thế công cụ, công cụ plugin, công cụ MCP, xác thực, chính sách phê duyệt, hành vi
kênh hoặc lựa chọn mô hình.

## Lý do sử dụng

- Bề mặt prompt nhỏ hơn: nhà cung cấp nhận hai công cụ điều khiển, một chỉ mục công cụ gốc
  có giới hạn và chỉ một vài công cụ trực tiếp bắt buộc thay vì hàng chục hoặc hàng trăm
  lược đồ công cụ đầy đủ.
- Điều phối tốt hơn: mô hình có thể dùng vòng lặp, phép nối, các phép biến đổi nhỏ,
  logic có điều kiện và các lệnh gọi công cụ lồng nhau song song trong một ô mã.
- Ít lượt trao đổi với mô hình hơn: hợp đồng đầu ra đã khai báo cho phép mô hình gọi và
  biến đổi kết quả công cụ trong một `exec`; đầu ra chưa biết vẫn ưu tiên dạng thô.
- Không phụ thuộc nhà cung cấp: hoạt động với các công cụ OpenClaw, plugin, MCP và máy khách mà không
  phụ thuộc vào việc thực thi mã gốc của nhà cung cấp.
- Đóng khi lỗi: nếu chế độ mã được bật nhưng môi trường chạy QuickJS-WASI
  không khả dụng, lượt chạy sẽ thất bại thay vì âm thầm quay về việc cung cấp trực tiếp
  nhiều công cụ.

Hữu ích nhất cho các tác nhân có danh mục công cụ đã bật lớn hoặc các quy trình
mà mô hình cần tìm kiếm, kết hợp và gọi nhiều công cụ trước khi trả lời.

Giữ việc cung cấp công cụ trực tiếp cho danh mục nhỏ hoặc mô hình không thể viết
các chương trình ngắn một cách đáng tin cậy. Dùng [Tìm kiếm công cụ](/vi/tools/tool-search) khi bạn muốn
một danh mục cô đọng nhưng ưu tiên các thao tác tìm kiếm/mô tả/gọi có cấu trúc thay vì
môi trường khách QuickJS-WASI.

## Bắt đầu nhanh

### Bật Chế độ mã

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Dạng viết tắt:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Chế độ mã vẫn tắt khi `tools.codeMode` bị bỏ qua, `false`, hoặc là một đối tượng
không có `enabled: true`.

Nếu bạn dùng tác nhân trong sandbox với các máy chủ MCP đã cấu hình, cũng cần cho phép
plugin MCP đi kèm trong chính sách công cụ sandbox, ví dụ
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Xem
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Đặt các giới hạn tường minh để có ràng buộc chặt chẽ hơn:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

### Những gì mô hình thực hiện

Đối với công cụ có đầu ra đã khai báo như
`Array<{ id: string; paid: boolean; tons: number }>`, một chương trình khách có thể
chọn, gọi và biến đổi công cụ đó:

```javascript
const [shipmentTool] = await tools.search("list shipments");
const shipments = await tools.callValue(shipmentTool.id, {});
return shipments.filter((shipment) => !shipment.paid && shipment.tons > 10);
```

Khi một dòng chỉ mục nhanh kết thúc bằng `-> ?`, hình dạng đầu ra là chưa biết. Lệnh
`exec` đầu tiên phải trả về `await tools.callValue(...)` không thay đổi. Một `exec` sau đó có thể
biến đổi giá trị đã quan sát. Việc này tốn thêm một lượt mô hình nhưng ngăn
mô hình đoán tên trường.

### Xác minh bề mặt đang hoạt động

Để xác nhận hình dạng tải trọng mô hình trong khi gỡ lỗi, hãy chạy Gateway với
ghi nhật ký có mục tiêu:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Khi chế độ mã hoạt động, tên công cụ dành cho mô hình được ghi nhật ký phải là `exec` và
`wait`. Để xem toàn bộ tải trọng nhà cung cấp đã được che thông tin nhạy cảm, hãy thêm
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` trong một phiên gỡ lỗi ngắn.

## Dùng Swarm để phân nhánh tác nhân

[Swarm](/tools/swarm) bổ sung các biến toàn cục khách `agents.run()`, `phase()` và `log()`
để điều phối các tác nhân con đồng thời từ tập lệnh Chế độ mã. Bật cả
`tools.codeMode` và `tools.swarm`, sau đó dùng luồng điều khiển JavaScript thông thường cho
việc phân nhánh, các cổng quyết định và thu thập có cấu trúc. Swarm là một cổng chủ động bật
riêng biệt; chỉ bật Chế độ mã không cung cấp API `agents.*`.

## Tổng quan kỹ thuật

Phần còn lại của trang này trình bày hợp đồng môi trường chạy và chi tiết triển khai,
dành cho người bảo trì, tác giả plugin đang gỡ lỗi việc cung cấp công cụ và người vận hành
đang xác thực các đợt triển khai có rủi ro cao.

## Trạng thái môi trường chạy

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Môi trường chạy             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Trạng thái mặc định       | bị tắt                                                                                    |
| Độ ổn định           | bề mặt OpenClaw thử nghiệm (Codex Code Mode là một bề mặt bộ khung Codex ổn định, riêng biệt) |
| Bề mặt mục tiêu      | các lượt chạy tác nhân OpenClaw dùng chung                                                                 |
| Tư thế bảo mật    | mã mô hình là mã thù địch                                                                       |
| Cam kết với người dùng | việc bật chế độ mã không bao giờ âm thầm quay về cung cấp trực tiếp nhiều công cụ                  |

## Phạm vi

Chế độ mã sở hữu hình dạng điều phối dành cho mô hình của một lượt chạy đã chuẩn bị. Nó
không sở hữu việc lựa chọn mô hình, hành vi kênh, xác thực, chính sách công cụ hoặc phần
triển khai công cụ.

Trong phạm vi: định nghĩa công cụ điều khiển/trực tiếp mà mô hình thấy, xây dựng danh mục công cụ
ẩn, thực thi khách JavaScript/TypeScript, worker QuickJS-WASI,
các callback máy chủ cho tìm kiếm/mô tả/gọi, trạng thái có thể tiếp tục cho
các chương trình khách bị tạm dừng, giới hạn đầu ra/thời gian chờ/bộ nhớ/lệnh gọi đang chờ/snapshot
và phép chiếu đo từ xa/quỹ đạo cho các lệnh gọi công cụ lồng nhau.

Ngoài phạm vi: thực thi mã từ xa gốc của nhà cung cấp, ngữ nghĩa thực thi
shell, thay đổi quyền công cụ hiện có, tập lệnh do người dùng tạo được lưu lâu dài,
quyền truy cập trình quản lý gói/tệp/mạng/mô-đun trong mã khách và việc trực tiếp
tái sử dụng phần nội bộ của Codex Code Mode.

Các công cụ do nhà cung cấp sở hữu như sandbox Python từ xa là công cụ riêng biệt. Xem
[Thực thi mã](/vi/tools/code-execution).

## Thuật ngữ

- **Chế độ mã**: chế độ môi trường chạy OpenClaw ẩn các công cụ mô hình tương thích
  với danh mục và cung cấp `exec`, `wait`, cùng các công cụ chỉ-trực-tiếp bắt buộc.
- **Môi trường chạy khách**: máy ảo JavaScript QuickJS-WASI đánh giá mã mô hình.
- **Cầu nối máy chủ**: bề mặt callback hẹp tương thích JSON từ mã khách
  quay lại OpenClaw.
- **Danh mục**: danh sách công cụ hiệu lực trong phạm vi lượt chạy sau khi phân giải
  chính sách công cụ, plugin, MCP và công cụ máy khách thông thường.
- **Lệnh gọi công cụ lồng nhau**: lệnh gọi công cụ được thực hiện từ mã khách qua cầu nối
  máy chủ.
- **Snapshot**: trạng thái máy ảo QuickJS-WASI đã tuần tự hóa được lưu để `wait` có thể tiếp tục
  một lượt chạy chế độ mã bị tạm dừng.

## Cấu hình

`tools.codeMode.enabled` là cổng kích hoạt; việc đặt các trường khác không tự
bật tính năng.

| Trường                 | Mặc định                        | Giới hạn                                           |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolean; chỉ `true` mới bật chế độ mã          |
| `runtime`             | `"quickjs-wasi"`               | giá trị duy nhất được hỗ trợ                            |
| `mode`                | `"only"`                       | cung cấp công cụ điều khiển/trực tiếp, lập danh mục phần còn lại |
| `languages`           | `["javascript", "typescript"]` | tập con bất kỳ của hai giá trị                           |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | bị giới hạn ở `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Nếu chế độ mã được bật nhưng QuickJS-WASI không thể tải, OpenClaw sẽ đóng khi lỗi
đối với lượt chạy đó; nó không âm thầm cung cấp các công cụ thông thường làm phương án dự phòng.

## Kích hoạt

Chế độ mã được đánh giá sau khi chính sách công cụ hiệu lực đã được xác định và trước khi
yêu cầu mô hình cuối cùng được tập hợp:

1. Phân giải agent, model, provider, sandbox, kênh, người gửi và chính sách
   chạy.
2. Xây dựng danh sách công cụ OpenClaw có hiệu lực, bổ sung các công cụ plugin, MCP và
   công cụ máy khách đủ điều kiện.
3. Áp dụng chính sách cho phép/từ chối.
4. Nếu `tools.codeMode.enabled` là false, tiếp tục hiển thị công cụ theo cách thông thường.
5. Nếu được bật và các công cụ đang hoạt động cho lượt chạy, giữ lại các công cụ bắt buộc
   chỉ dùng trực tiếp và đăng ký mọi công cụ có hiệu lực đủ điều kiện vào danh mục
   chế độ mã.
6. Loại các công cụ trong danh mục khỏi danh sách mà model có thể thấy; thêm `exec` và
   `wait` bên cạnh các công cụ chỉ dùng trực tiếp được giữ lại.

Các lượt chạy được chủ ý cấu hình không có công cụ (lệnh gọi model thô, `disableTools: true`,
hoặc danh sách `tools.allow` trống) không kích hoạt bề mặt chế độ mã ngay cả
khi `tools.codeMode.enabled: true` đã được cấu hình. Chế độ mã và Tìm kiếm Công cụ OpenClaw
loại trừ lẫn nhau trong một lượt chạy; nếu chế độ mã kích hoạt, quá trình
Compaction của Tìm kiếm Công cụ sẽ không kích hoạt.

Danh mục chế độ mã có phạm vi theo lượt chạy và không được làm rò rỉ công cụ từ
agent, phiên, người gửi hoặc lượt chạy khác.

## Công cụ mà model có thể thấy

Khi chế độ mã hoạt động, model thấy `exec`, `wait` và mọi công cụ bắt buộc
chỉ dùng trực tiếp. Mọi công cụ đã bật khác đều bị ẩn khỏi danh sách công cụ
dành cho model và được đăng ký trong danh mục chế độ mã.

Dùng `exec` để điều phối công cụ, nối dữ liệu, tạo vòng lặp, thực hiện song song các lệnh gọi lồng nhau
và biến đổi có cấu trúc. Chỉ dùng `wait` khi `exec` trả về kết quả
`waiting` có thể tiếp tục.

## `exec`

`exec` khởi chạy một ô chế độ mã và trả về một kết quả. Mã đầu vào do model
tạo ra và phải được coi là mã độc hại.

Đầu vào:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Quy tắc:

- Một trong `code` hoặc `command` phải khác rỗng.
- `code` là trường dành cho model được ghi trong tài liệu.
- `command` được chấp nhận làm bí danh tương thích với exec cho các chính sách hook và
  phép ghi lại đáng tin cậy (công cụ exec shell thông thường của OpenClaw cũng dùng trường `command`);
  khi cả hai cùng xuất hiện, các giá trị phải khớp nhau.
- `language` mặc định là `"javascript"`; schema hiển thị trường này dưới dạng enum chuỗi
  phẳng (`"javascript" | "typescript"`), không phải union `oneOf`/`anyOf`,
  vì một số provider từ chối các cấu trúc đó.
- Nếu `language` là `"typescript"`, OpenClaw sẽ chuyển dịch mã trước khi đánh giá.
- `exec` từ chối `import`, `require`, import động và các mẫu trình tải module.
- `exec` không bao giờ hiển thị đệ quy phần triển khai `exec` của shell thông thường.
- Các sự kiện hook `exec` của chế độ mã bên ngoài mang theo `toolKind: "code_mode_exec"` và
  `toolInputKind: "javascript" | "typescript"` (khi đã biết), để các chính sách có thể
  phân biệt ô chế độ mã với lệnh gọi `exec` kiểu shell có cùng
  tên công cụ.

Kết quả:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` trả về `waiting` khi guest tạm dừng với trạng thái có thể tiếp tục mà vẫn
cần model tiếp tục xử lý — một `yield_control(...)` tường minh hoặc một
lệnh gọi công cụ cầu nối chưa được giải quyết trong thời hạn exec. Kết quả
bao gồm `runId` dành cho `wait`. Các lệnh gọi công cụ cầu nối — `tools.search`/`describe`/
`call` và các lệnh gọi namespace, bao gồm lệnh gọi namespace MCP — được tự động xử lý hết
trong cùng lệnh gọi `exec`/`wait` nếu chúng được giải quyết trong thời hạn, nhờ đó một
khối mã nhỏ gọn chờ nhiều công cụ có thể chạy đến khi hoàn tất trong một lượt
của model thay vì buộc phải thực hiện một lệnh gọi công cụ model cho mỗi lần await. Các lượt chạy an toàn
khi khởi động lại không bao giờ tự động xử lý hết; công việc đang chờ của chúng vẫn đi qua
các bước kiểm tra an toàn khi phát lại.

`exec` chỉ trả về `completed` khi VM guest không còn công việc đang chờ và
giá trị cuối cùng tương thích với JSON sau khi bộ điều hợp đầu ra của OpenClaw chạy.

## `wait`

`wait` tiếp tục một VM chế độ mã đã bị tạm dừng.

Đầu vào:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Đầu ra là cùng union `CodeModeResult` do `exec` trả về.

`wait` tồn tại vì các công cụ OpenClaw lồng nhau có thể chậm, có tính tương tác, bị
chặn để chờ phê duyệt hoặc truyền trực tuyến các cập nhật một phần; model không cần phải giữ một lệnh gọi
`exec` kéo dài trong khi máy chủ chờ công việc bên ngoài.

Ảnh chụp/khôi phục QuickJS-WASI là cơ chế tiếp tục:

1. `exec` đánh giá mã cho đến khi hoàn tất, thất bại hoặc tạm dừng.
2. Khi tạm dừng, OpenClaw chụp lại VM QuickJS và ghi nhận công việc máy chủ đang
   chờ.
3. Khi công việc đang chờ ổn định, `wait` khôi phục ảnh chụp VM và
   đăng ký lại các callback máy chủ bằng tên ổn định.
4. OpenClaw đưa kết quả công cụ lồng nhau vào VM đã khôi phục và xử lý hết
   các công việc QuickJS đang chờ.
5. `wait` trả về `completed`, `failed` hoặc một kết quả `waiting` khác.

Ảnh chụp là trạng thái thời gian chạy, không phải hiện vật của người dùng: chúng chỉ tồn tại trong
một map nội bộ tiến trình (không ghi vào cơ sở dữ liệu hoặc đĩa), bị giới hạn kích thước, có thời hạn và
được giới hạn trong lượt chạy và phiên đã tạo ra chúng.

`wait` thất bại (dưới dạng kết quả `failed`) khi:

- `runId` không xác định hoặc ảnh chụp của nó đã hết hạn.
- bên gọi không nằm trong cùng phạm vi lượt chạy/phiên với lượt chạy đã tạm dừng.
- một `wait` đã đang được thực hiện cho `runId` đó.
- khôi phục QuickJS-WASI thất bại.
- việc tiếp tục sẽ vượt quá `maxOutputBytes` hoặc `maxSnapshotBytes`.

## API thời gian chạy của guest

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` là siêu dữ liệu nhỏ gọn cho danh mục có phạm vi theo lượt chạy; theo mặc định, nó không chứa
schema đầy đủ. Phần mô tả `exec` mà model có thể thấy cũng bao gồm một
tập con có giới hạn và mang tính xác định gồm các id OpenClaw/plugin chính xác, gợi ý đầu vào
ngắn gọn và gợi ý đầu ra đã khai báo đáng tin cậy. Các mô tả vẫn được trì hoãn để
văn xuôi độc hại trong danh mục không thể định hướng model. Khi chỉ mục đó bỏ sót một công cụ,
hãy đọc `ALL_TOOLS` hoặc gọi `tools.search(...)` bên trong chương trình guest.

Mũi tên trong mỗi dòng chỉ mục nhanh mô tả giá trị `tools.callValue(...)`.
`-> Array<{ id: string }>` là gợi ý đầu ra đã khai báo; `-> ?` nghĩa là đầu ra không xác định.
Đầu ra không xác định ưu tiên dữ liệu thô: trả về nguyên trạng giá trị, quan sát nó, sau đó
lọc hoặc ánh xạ giá trị đó trong một `exec` sau này thay vì đoán tên trường. Điều này cũng
áp dụng khi việc đọc đầu ra đã khai báo cấp dữ liệu cho lệnh gọi `-> ?` cuối cùng: hãy trả về
giá trị thô của lệnh gọi đó mà không bao bọc nó trong cấu trúc câu trả lời được yêu cầu.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
  input: string;
  output?: string;
};
```

`input` là chữ ký kiểu TypeScript có giới hạn dành cho trường hợp phổ biến. Dùng
`tools.describe(...)` khi vẫn cần schema đầy đủ chính xác. Các mục MCP
từ xa và máy khách dùng `input: "unknown"` để schema không đáng tin cậy của chúng tiếp tục
được trì hoãn cho đến `describe`. `output`
chỉ xuất hiện đối với gợi ý nhỏ gọn hoàn chỉnh được suy ra từ lõi OpenClaw đáng tin cậy
hoặc `outputSchema` của plugin. Các tuyên bố về schema đầu ra của MCP và máy khách không được nâng cấp
thành gợi ý danh mục đáng tin cậy này.

Các công cụ plugin dùng `source: "openclaw"` với `sourceName` được đặt thành id
của plugin sở hữu; không có giá trị nguồn `"plugin"` riêng biệt. `source: "mcp"` chỉ
được dùng cho các mục MCP trong siêu dữ liệu `sourceName`/`mcp` (và bị lọc khỏi
`ALL_TOOLS`/`tools.*`, xem bên dưới).

Schema đầy đủ chỉ được tải khi có yêu cầu:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
  outputSchema?: unknown;
};
```

Các hàm hỗ trợ danh mục:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  callValue(id: string, input?: unknown): Promise<unknown>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Các hàm công cụ tiện ích chỉ được cài đặt cho những tên an toàn không mơ hồ:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.callValue(fileRead.id, { path: "README.md" });

// Nếu danh mục ẩn có một mục `web_search` không mơ hồ:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

`tools.callValue(...)` trả về trực tiếp giá trị JSON `details` của công cụ thông thường.
`tools.call(...)` giữ nguyên phong bì `{ tool, result }` thô cho các bên gọi
cần khối nội dung hoặc siêu dữ liệu kết quả khác.

## Hợp đồng đầu ra đã khai báo

Các công cụ OpenClaw có thể khai báo `outputSchema` cho giá trị có cấu trúc được đặt trong
`AgentToolResult.details`. Điều này hữu ích cho Chế độ Mã và Tìm kiếm Công cụ; nó
không phải schema phản hồi công cụ gốc của provider và không thay đổi việc hiển thị trực tiếp
công cụ.

Đối với một công cụ được tạo bằng `defineToolPlugin`, hãy khai báo schema bên cạnh
`parameters`:

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const Shipment = Type.Object(
  {
    id: Type.String(),
    paid: Type.Boolean(),
    tons: Type.Number(),
  },
  { additionalProperties: false },
);

export default defineToolPlugin({
  id: "shipping",
  name: "Shipping",
  description: "Shipment tools.",
  tools: (tool) => [
    tool({
      name: "shipping_list",
      description: "List shipments.",
      parameters: Type.Object({}),
      outputSchema: Type.Array(Shipment),
      execute: async () => loadShipments(),
    }),
  ],
});
```

Đối với `api.registerTool(...)` hoặc một công cụ factory, hãy đặt cùng thuộc tính `outputSchema`
trên đối tượng `AnyAgentTool` được trả về.

Các hợp đồng tích hợp sẵn hiện tại bao gồm `agents_list`, `apply_patch`,
`conversations_list`, `conversations_send`, `conversations_turn`, `edit`,
`openclaw`, `read`, `screen`,
`sessions_history`, `sessions_list`, `sessions_search`, `sessions_send`,
`session_status`, `spawn_task`, `terminal`, `web_fetch` và `web_search`.
Các cơ chế chuyển tiếp nguyên trạng có thể tái sử dụng schema giao thức sở hữu chúng thay vì
sao chép một hợp đồng chỉ dành cho mô hình. Ví dụ, các công cụ hội thoại cung cấp
cùng các schema kết quả Gateway được `conversations.list`,
`conversations.send` và `conversations.turn` sử dụng; `web_fetch` sở hữu một
schema cục bộ của công cụ, trong đó gợi ý cung cấp siêu dữ liệu ổn định, văn bản, trạng thái bộ nhớ đệm và siêu dữ liệu tràn
lồng nhau; `web_search` khai báo hợp chính xác gồm kết quả đã chuẩn hóa/câu trả lời/lỗi/dữ liệu thô
dưới dạng một gợi ý chỉ mục nhanh hoàn chỉnh. Các hợp đồng hệ thống tệp trả về
kết quả có cấu trúc cho văn bản đã đọc, hình ảnh, việc cắt bớt và tùy chọn không tìm thấy; trạng thái thay đổi
chỉnh sửa rõ ràng cùng dữ liệu diff/patch; và bản tóm tắt đường dẫn apply-patch. Khi
chỉ mục nhanh khai báo các trường, một ô có thể kết hợp việc khám phá và gửi
mà không cần một lượt kiểm tra riêng:

```javascript
const listed = await tools.conversations_list({ query: "bot bản dựng" });
const target = listed.conversations.find((item) => item.label === "Bot bản dựng");
if (!target) throw new Error("không tìm thấy hội thoại");
return await tools.conversations_send({
  conversationRef: target.conversationRef,
  message: "Bản dựng đã hoàn tất.",
});
```

Các lệnh gọi lồng nhau vẫn sử dụng chính sách công cụ, hook và phê duyệt thông thường. Nếu một
hợp đồng đầy đủ là chính xác nhưng quá lớn đối với chỉ mục nhanh bị giới hạn, hợp đồng đó vẫn
khả dụng thông qua `tools.describe(...)` và mũi tên vẫn là `-> ?`.

Các quy tắc hợp đồng rất nghiêm ngặt:

- Mô tả chính xác giá trị `details` tương thích với JSON, không phải các khối `content`
  đã kết xuất hoặc một phong bì của nhà cung cấp.
- Bao gồm mọi biến thể thành công hoặc lỗi không ném ngoại lệ. Bỏ qua `outputSchema` khi
  công cụ không có kết quả có cấu trúc ổn định.
- Đóng các lớp đối tượng bằng `{ additionalProperties: false }` để tạo một
  gợi ý chỉ mục nhanh hoàn chỉnh. Các schema mở, quá lớn hoặc không đầy đủ vì lý do khác vẫn
  khả dụng thông qua `tools.describe(...)` nhưng không cho phép sử dụng trường trong một lượt.
- OpenClaw biên dịch schema trước khi chạy công cụ, sau đó xác thực
  `details` cuối cùng sau các hook công cụ thông thường và trước khi một lệnh gọi danh mục trả về. Một
  schema không hợp lệ không thể chạy công cụ; trường hợp không khớp sẽ thất bại mà không in
  giá trị.
- Các gợi ý thu gọn có tính xác định và bị giới hạn. `tools.describe(...)` cung cấp
  toàn bộ schema đáng tin cậy khi gợi ý thu gọn không đủ.
- Mã plugin đã cài đặt vốn đã là mã cục bộ đáng tin cậy. Siêu dữ liệu MCP và máy khách
  từ xa vẫn không đáng tin cậy và không thể chọn tham gia các gợi ý chỉ mục nhanh này.

Xem [Plugin công cụ](/vi/plugins/tool-plugins#output-contracts) để biết chi tiết
về việc tạo plugin.

Các mục danh mục MCP không thể được gọi thông qua `tools.callValue(...)`,
`tools.call(...)` hoặc các hàm tiện ích trong chế độ mã; chúng chỉ được cung cấp
thông qua không gian tên `MCP` được tạo. Các tệp khai báo kiểu TypeScript
khả dụng thông qua bề mặt tệp ảo chỉ đọc `API`, nhờ đó tác nhân có thể
kiểm tra chữ ký MCP mà không cần thêm schema MCP vào lời nhắc:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Điều tra nhật ký gateway",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "bản phát hành" },
});
```

`API.read("mcp/<server>.d.ts")` trả về các khai báo thu gọn được suy ra từ siêu dữ liệu
công cụ MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Trả về phần đầu API kiểu TypeScript này. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Tạo một issue GitHub.
   * @param owner Chủ sở hữu kho lưu trữ
   * @param repo Tên kho lưu trữ
   * @param title Tiêu đề issue
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Các tệp khai báo là tệp ảo, không được ghi trong không gian làm việc hoặc thư mục
trạng thái. Với mỗi lệnh gọi `exec` ở chế độ mã, OpenClaw xây dựng danh mục công cụ
theo phạm vi lượt chạy, giữ lại các mục MCP hiển thị, kết xuất `mcp/index.d.ts` cùng một
`mcp/<server>.d.ts` cho mỗi máy chủ hiển thị và đưa bảng chỉ đọc nhỏ đó
vào worker QuickJS. Mã khách chỉ thấy đối tượng `API`:
`API.list(prefix?)` trả về siêu dữ liệu tệp và `API.read(path)` trả về
nội dung khai báo đã chọn. Các đường dẫn không xác định và các đoạn `.`/`..`
bị từ chối.

Cách này loại các schema MCP lớn khỏi lời nhắc của mô hình: tác nhân biết
API ảo tồn tại từ phần mô tả công cụ `exec`, chỉ đọc
tệp khai báo cần thiết, sau đó gọi `MCP.<server>.<tool>()` với một đối số đối tượng.
`MCP.<server>.$api()` vẫn khả dụng dưới dạng phương án dự phòng nội tuyến cho
phản hồi schema của một công cụ duy nhất bên trong chương trình.

Môi trường chạy khách không bao giờ trực tiếp nhìn thấy các đối tượng máy chủ. Đầu vào và đầu ra đi qua
cầu nối dưới dạng các giá trị tương thích với JSON với giới hạn kích thước rõ ràng.

## Không gian tên nội bộ

Các không gian tên nội bộ cung cấp cho chế độ mã một API miền ngắn gọn mà không bổ sung thêm
công cụ hiển thị cho mô hình. Một phần tích hợp do trình tải sở hữu đăng ký một không gian tên như
`Issues` hoặc `Calendar`; sau đó mã khách gọi không gian tên đó bên trong
chương trình QuickJS trong khi mô hình vẫn chỉ thấy bề mặt điều khiển/trực tiếp thu gọn.

Hiện tại, các không gian tên là nội bộ. Không có API không gian tên SDK plugin công khai:
các không gian tên plugin bên ngoài cần một hợp đồng do trình tải sở hữu để danh tính plugin,
manifest đã cài đặt, trạng thái xác thực và các bộ mô tả danh mục được lưu vào bộ nhớ đệm không thể sai lệch
so với các công cụ plugin hỗ trợ không gian tên. Chế độ mã lõi chỉ sở hữu
sandbox, quá trình tuần tự hóa, cơ chế kiểm soát danh mục và việc điều phối cầu nối.

Mã khách có thể sử dụng trực tiếp biến toàn cục hoặc ánh xạ `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Vòng đời sổ đăng ký

Sổ đăng ký không gian tên là cục bộ theo tiến trình và được lập khóa theo id không gian tên:

1. Một trình tải đáng tin cậy gọi `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Chế độ mã tạo `ToolSearchRuntime` ẩn cho lượt chạy và đọc
   danh mục theo phạm vi lượt chạy của nó.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` chỉ giữ lại các đăng ký
   có tất cả `requiredToolNames` hiển thị và thuộc sở hữu của cùng một `pluginId`.
4. Mỗi không gian tên hiển thị gọi `createScope(ctx)` cho lượt chạy hiện tại,
   nhận ngữ cảnh lượt chạy như `agentId`, `sessionKey`, `sessionId`,
   `runId`, cấu hình và trạng thái hủy bỏ.
5. Dữ liệu phạm vi được tuần tự hóa thành một bộ mô tả thuần túy và được đưa vào QuickJS
   dưới dạng các biến toàn cục trực tiếp và `namespaces.<globalName>`.
6. Các lệnh gọi của khách tạm dừng qua cầu nối worker, phân giải đường dẫn không gian tên
   trên máy chủ, ánh xạ lệnh gọi tới một công cụ danh mục đã khai báo do plugin sở hữu và
   thực thi công cụ đó thông qua `ToolSearchRuntime.callExactId`.
7. Các lệnh gọi cầu nối không gian tên đã sẵn sàng được tự động xử lý hết bên trong lệnh gọi
   `exec`/`wait` đang hoạt động; nếu công việc không gian tên vẫn đang chờ khi hết thời gian chờ hoặc
   khách chủ động nhường quyền, `wait` sẽ tiếp tục cùng môi trường chạy không gian tên
   sau đó.
8. Việc khôi phục hoặc gỡ cài đặt plugin gọi
   `clearCodeModeNamespacesForPlugin(pluginId)` để các biến toàn cục cũ không
   tồn tại sau một lần tải plugin thất bại.

Các lệnh gọi không gian tên là lệnh gọi công cụ danh mục: chúng sử dụng cùng hook chính sách,
phê duyệt, xử lý hủy bỏ, đo từ xa, phép chiếu bản ghi và
hành vi tạm dừng/tiếp tục như `tools.call(...)`.

### Cấu trúc đăng ký

Đăng ký không gian tên từ phần tích hợp sở hữu các công cụ hỗ trợ. Giữ
phạm vi nhỏ và chỉ cung cấp các động từ miền ánh xạ tới các công cụ danh mục
đã khai báo.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "Các hàm hỗ trợ issue GitHub cho kho lưu trữ hiện tại.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Sử dụng Issues.list(params) và Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` đánh dấu một thành viên phạm vi là một
hàm không gian tên có thể gọi. `inputMapper` tùy chọn nhận các đối số
từ khách và trả về đối tượng đầu vào cho công cụ danh mục hỗ trợ; nếu không có,
đối số đầu tiên từ khách được sử dụng, hoặc `{}` khi bị bỏ qua.

Các hàm máy chủ thô bị từ chối trước khi mã khách chạy:

```typescript
createScope: () => ({
  // Sai: điều này bỏ qua vòng đời công cụ danh mục và sẽ bị từ chối.
  list: async () => githubClient.listIssues(),
});
```

### Quyền sở hữu và khả năng hiển thị

Quyền sở hữu không gian tên được liên kết với `pluginId` của bên gọi đăng ký.
`requiredToolNames` vừa là cổng kiểm soát khả năng hiển thị vừa là bước kiểm tra quyền sở hữu:

- mọi công cụ bắt buộc phải tồn tại trong danh mục của lượt chạy
- mọi công cụ bắt buộc phải có `sourceName === pluginId`
- không gian tên bị ẩn khi bất kỳ công cụ bắt buộc nào vắng mặt hoặc thuộc sở hữu của
  plugin khác
- mỗi đường dẫn có thể gọi chỉ được nhắm tới một công cụ có tên trong `requiredToolNames`

Điều này ngăn plugin khác cung cấp một không gian tên bằng cách đăng ký một
công cụ trùng tên và giữ cho các không gian tên nhất quán với chính sách tác nhân thông thường: nếu
lượt chạy không thể thấy các công cụ hỗ trợ, nó cũng không thể thấy không gian tên.

Ví dụ, một không gian tên GitHub nên nằm sau một plugin do GitHub sở hữu, plugin này
sở hữu cơ chế xác thực GitHub, các máy khách REST/GraphQL, giới hạn tốc độ, phê duyệt ghi và
kiểm thử. Chế độ mã lõi không nên nhúng API dành riêng cho GitHub, cơ chế xử lý token
hoặc chính sách nhà cung cấp.

### Quy tắc tuần tự hóa phạm vi

`createScope(ctx)` có thể trả về một đối tượng thuần túy chứa các giá trị
tương thích với JSON, mảng, đối tượng lồng nhau và các dấu hiệu lệnh gọi
`createCodeModeNamespaceTool(...)`. Các đối tượng máy chủ không bao giờ trực tiếp đi vào QuickJS.

Bộ tuần tự hóa từ chối:

- các hàm thô
- đồ thị đối tượng tuần hoàn
- các đoạn đường dẫn không an toàn: `__proto__`, `constructor`, `prototype`, khóa trống
  hoặc khóa chứa dấu phân cách đường dẫn nội bộ
- các giá trị `globalName` không phải là định danh JavaScript
- xung đột `globalName` với các biến toàn cục tích hợp sẵn của chế độ mã như `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` hoặc
  `__openclaw*`

Các giá trị không thể tuần tự hóa thành JSON được chuyển đổi thành các giá trị dự phòng
an toàn cho JSON trước khi đi qua cầu nối. Dữ liệu nhị phân, handle, socket, máy khách và
các thực thể lớp nên nằm phía sau các công cụ danh mục thông thường.

### Lời nhắc

`description` của không gian tên và `prompt` tùy chọn được nối vào schema
`exec` hiển thị cho mô hình chỉ khi không gian tên hiển thị trong lượt chạy đó. Hãy dùng
chúng để hướng dẫn bề mặt hữu ích nhỏ nhất:

```typescript
{
  description: "Các trình trợ giúp cho dịch vụ sản xuất tác phẩm hư cấu.",
  prompt:
    "Sử dụng Fictions.riskAudit(), Fictions.promoteIfReady(id, status) và Fictions.unpaidOver(amount).",
}
```

Giữ các prompt tập trung vào hợp đồng namespace, không phải thiết lập xác thực, lịch sử
triển khai hoặc hành vi Plugin không liên quan.

### Dọn dẹp

Namespace là các đăng ký cục bộ theo tiến trình. Xóa chúng khi Plugin sở hữu
bị vô hiệu hóa, gỡ cài đặt hoặc khôi phục về phiên bản trước:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Việc dọn dẹp chế độ mã do Plugin sở hữu; hãy xóa các đăng ký namespace của Plugin
khi vòng đời của nó kết thúc thay vì giữ các handle tháo dỡ riêng cho từng namespace.
Các kiểm thử có thể gọi `clearCodeModeNamespacesForTest()` để tránh làm rò rỉ
đăng ký giữa các trường hợp.

### Danh sách kiểm tra kiểm thử

Các thay đổi namespace phải bao quát ranh giới bảo mật và hành vi của guest:

- văn bản prompt của namespace chỉ xuất hiện khi các công cụ hỗ trợ hiển thị
- các công cụ cùng tên từ một `sourceName` khác không làm lộ namespace
- các hàm phạm vi thô bị từ chối
- id namespace giả mạo và đường dẫn giả mạo bị từ chối
- các đường dẫn có thể gọi không thể nhắm đến công cụ chưa khai báo
- các đối tượng lồng nhau và tham chiếu dùng chung được tuần tự hóa chính xác
- các lệnh gọi namespace thực thi qua công cụ danh mục và trả về chi tiết an toàn cho JSON
- mã guest có thể bắt lỗi
- các lệnh gọi namespace bị tạm ngưng tiếp tục qua `wait`
- việc khôi phục Plugin xóa các đăng ký namespace thuộc sở hữu của Plugin

Namespace bổ sung cho danh mục `tools.search`/`tools.call` dùng chung: dùng
danh mục cho các công cụ OpenClaw, Plugin và máy khách tùy ý đang được bật; dùng `MCP`
cho công cụ MCP; dùng các namespace khác cho API miền có tài liệu và thuộc sở hữu của Plugin
khi mã ngắn gọn đáng tin cậy hơn việc tra cứu schema lặp lại.

## API đầu ra

- `text(value)` nối đầu ra mà con người có thể đọc vào mảng `output`.
- `json(value)` nối một mục đầu ra có cấu trúc sau khi tuần tự hóa
  tương thích với JSON.
- Giá trị trả về cuối cùng của mã guest trở thành `value` trong kết quả `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Quy tắc: thứ tự đầu ra khớp với các lệnh gọi của guest; đầu ra bị giới hạn bởi
`maxOutputBytes`; các giá trị không thể tuần tự hóa được chuyển thành chuỗi thuần hoặc
lỗi; không hỗ trợ giá trị nhị phân. Hình ảnh và tệp đi qua
các công cụ OpenClaw thông thường, không qua cầu nối chế độ mã.

## Danh mục công cụ

Danh mục ẩn bao gồm các công cụ sau khi lọc theo chính sách có hiệu lực, theo thứ tự:
công cụ lõi OpenClaw, công cụ Plugin đi kèm, công cụ Plugin bên ngoài, công cụ MCP,
sau đó là công cụ do máy khách cung cấp cho lượt chạy hiện tại.

Id danh mục ổn định trong một lượt chạy và mang tính xác định giữa các
tập công cụ tương đương khi có thể. Cấu trúc thực tế:

```text
<source>:<owner>:<tool-name>
```

trong đó `<source>` là `openclaw`, `mcp` hoặc `client` (công cụ Plugin dùng
`openclaw` với id Plugin làm `<owner>`; công cụ lõi dùng `openclaw:core:*`).
Ví dụ:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Danh mục bỏ qua các công cụ điều khiển chế độ mã (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) và các công cụ chỉ dùng trực tiếp. Các điều khiển
không được đệ quy qua danh mục; các công cụ chỉ dùng trực tiếp vẫn hiển thị với mô hình
vì kết quả có cấu trúc của chúng không thể đi qua cầu nối QuickJS.

Các mục MCP vẫn nằm trong danh mục theo phạm vi lượt chạy để chính sách, phê duyệt, hook,
đo từ xa, ánh xạ bản ghi và id công cụ chính xác tiếp tục được dùng chung với
việc thực thi công cụ thông thường. Các khung nhìn `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)`, `tools.callValue(...)` và `tools.call(...)` hướng đến guest sẽ bỏ qua các mục MCP. Namespace
`MCP.<server>.<tool>({ ...input })` được tạo sẽ phân giải ngược về
id danh mục chính xác và điều phối qua cùng một đường dẫn bộ thực thi.

## Tương tác với Tìm kiếm công cụ

Chế độ mã thay thế bề mặt mô hình Tìm kiếm công cụ của OpenClaw cho các lượt chạy
mà chế độ này đang hoạt động.

Khi `tools.codeMode.enabled` là true và chế độ mã được kích hoạt:

- OpenClaw không hiển thị `tool_search_code`, `tool_search`, `tool_describe`
  hoặc `tool_call` dưới dạng công cụ hiển thị với mô hình.
- Cùng ý tưởng lập danh mục được chuyển vào bên trong runtime guest.
- Runtime guest nhận siêu dữ liệu `ALL_TOOLS` nhỏ gọn và các trình trợ giúp tìm kiếm/mô tả/
  gọi cho công cụ không phải MCP.
- Các lệnh gọi MCP dùng namespace `MCP` được tạo và các header `$api()` của nó
  thay vì `tools.call(...)`.
- Các lệnh gọi lồng nhau được điều phối qua cùng đường dẫn bộ thực thi OpenClaw mà Tìm kiếm
  công cụ sử dụng.

Xem [Tìm kiếm công cụ](/vi/tools/tool-search) để biết cầu nối danh mục nhỏ gọn của OpenClaw
mà chế độ mã thay thế cho các lượt chạy đang hoạt động.

## Tên công cụ và xung đột

Công cụ `exec` hiển thị với mô hình là công cụ chế độ mã. Nếu công cụ shell
`exec` thông thường của OpenClaw được bật, nó sẽ bị ẩn khỏi mô hình và được lập danh mục như
mọi công cụ khác.

Bên trong runtime guest:

- `tools.call("openclaw:core:exec", input)` có thể gọi công cụ shell exec nếu
  chính sách cho phép.
- `tools.exec(...)` chỉ được cài đặt nếu mục shell exec trong danh mục có
  tên an toàn không mơ hồ.
- công cụ chế độ mã `exec` không bao giờ khả dụng theo cách đệ quy qua `tools`.

Nếu hai công cụ chuẩn hóa thành cùng một tên tiện dụng an toàn, OpenClaw sẽ bỏ qua
hàm tiện dụng và yêu cầu `tools.call(id, input)`.

## Thực thi công cụ lồng nhau

Mỗi lệnh gọi công cụ lồng nhau đều đi qua cầu nối host và vào lại OpenClaw,
đồng thời giữ nguyên: id agent đang hoạt động, id và khóa phiên, ngữ cảnh người gửi và kênh,
chính sách sandbox, chính sách phê duyệt, các hook `before_tool_call` của Plugin, tín hiệu
hủy bỏ, cập nhật phát trực tuyến khi khả dụng và các sự kiện quỹ đạo/kiểm toán.

Các lệnh gọi lồng nhau được ánh xạ vào bản ghi dưới dạng lệnh gọi công cụ thực để
gói hỗ trợ hiển thị những gì đã xảy ra, trong đó ánh xạ xác định lệnh gọi
công cụ chế độ mã cha và id công cụ lồng nhau.

Cho phép các lệnh gọi lồng nhau song song tối đa `maxPendingToolCalls`.

## Vòng đời lượt chạy và snapshot

Mỗi lượt chạy chế độ mã được theo dõi trong một map nội bộ tiến trình có khóa là `runId` (không
được lưu bền vững vào ổ đĩa hoặc cơ sở dữ liệu). `exec`/`wait` trả về một trong ba trạng thái
kết quả: `completed`, `waiting` hoặc `failed`.

- Kết quả `waiting` lưu snapshot QuickJS, các yêu cầu cầu nối đang chờ và
  siêu dữ liệu phạm vi (id lượt chạy agent, id/khóa phiên) cho đến khi `wait` tiếp tục nó hoặc
  nó hết hạn.
- Các giá trị `runId` đã hết hạn, sai phiên, sai lượt chạy và không xác định/đang tiếp tục
  không tạo ra trạng thái kết thúc riêng biệt; chúng xuất hiện dưới dạng
  kết quả `failed` (`code: "invalid_input"`) với thông báo như `code mode
run is unavailable or expired.` hoặc `code mode run belongs to a different
session.`.
- Snapshot của một lượt chạy bị xóa khỏi map ngay khi nó chuyển sang
  `completed` hoặc `failed`, hoặc bị loại bỏ khi Gateway tắt (không có gì
  tồn tại sau khi khởi động lại: đây là trạng thái runtime tạm thời).
- Đối với công việc chỉ đọc, `exec` có thể đặt `restartSafe: true`. Sau đó OpenClaw từ chối
  các lệnh gọi danh mục có tác dụng phụ và namespace Plugin trước khi thực thi, đồng thời
  đánh dấu các kết quả bị tạm ngưng là an toàn để phát lại. Nếu việc khởi động lại làm gián đoạn `wait`,
  [khôi phục sau khi khởi động lại](/vi/gateway/restart-recovery) sẽ tái tạo lượt tương tác từ
  bản ghi thay vì khôi phục snapshot cục bộ theo tiến trình. Bản thân lượt khôi phục
  vẫn bị giới hạn ở các công cụ lõi chỉ đọc đã được kiểm toán và các công cụ Plugin
  được xác định rõ là an toàn để phát lại.
- OpenClaw giới hạn số lượt chạy bị tạm ngưng đồng thời trên mỗi tiến trình (64) và
  từ chối các lần tạm ngưng mới vượt quá giới hạn đó bằng `too many suspended code mode
runs.`.

Dung lượng lưu trữ snapshot bị giới hạn bởi `maxSnapshotBytes` trên mỗi lượt chạy, giới hạn
lượt chạy bị tạm ngưng theo tiến trình ở trên và `snapshotTtlSeconds`.

## Runtime QuickJS-WASI

OpenClaw tải `quickjs-wasi` dưới dạng dependency trực tiếp trong package sở hữu; nó
không dựa vào bản sao bắc cầu được cài đặt cho một dependency không liên quan.

Trách nhiệm của runtime: biên dịch/tải mô-đun WebAssembly QuickJS-WASI;
tạo một VM cô lập cho mỗi lượt chạy hoặc lần tiếp tục chế độ mã; đăng ký callback host
bằng tên ổn định; đặt giới hạn bộ nhớ và ngắt; đánh giá JavaScript; xử lý hết
các tác vụ đang chờ; tạo snapshot trạng thái VM bị tạm ngưng; khôi phục snapshot cho `wait`;
giải phóng handle VM và snapshot sau các trạng thái kết thúc.

Runtime thực thi trong một worker thread của Node.js, bên ngoài vòng lặp
sự kiện chính của OpenClaw. Một vòng lặp vô hạn của guest không được chặn tiến trình Gateway
vô thời hạn; trình xử lý ngắt của worker áp dụng thời gian chờ theo thời gian thực
độc lập với việc mã guest có hợp tác hay không.

## TypeScript

Hỗ trợ TypeScript chỉ là phép biến đổi mã nguồn: đầu vào được chấp nhận là một
chuỗi mã TypeScript; đầu ra là chuỗi JavaScript được QuickJS-WASI đánh giá.
Không có kiểm tra kiểu, không phân giải mô-đun và không có
`import`/`require`. Chẩn đoán được trả về dưới dạng kết quả `failed`.

Trình biên dịch TypeScript chỉ được tải lười cho các ô TypeScript; các ô
JavaScript thuần và chế độ mã bị vô hiệu hóa sẽ không bao giờ tải nó.

## Ranh giới bảo mật

Mã của mô hình là không đáng tin cậy. Runtime sử dụng phòng thủ theo chiều sâu:

- chạy QuickJS-WASI bên ngoài vòng lặp sự kiện chính, trong một worker thread
- tải `quickjs-wasi` dưới dạng dependency trực tiếp, không thông qua Codex hoặc một
  package bắc cầu
- không có hệ thống tệp, mạng, tiến trình con, nhập mô-đun, biến môi trường
  hoặc đối tượng toàn cục của host trong guest
- dùng giới hạn bộ nhớ và ngắt của QuickJS cùng thời gian chờ theo thời gian thực
  của tiến trình cha
- áp dụng giới hạn đầu ra, snapshot, nhật ký và lệnh gọi đang chờ
- tuần tự hóa các giá trị cầu nối host qua một adapter JSON hẹp
- chuyển lỗi host thành lỗi guest thuần, không bao giờ là đối tượng realm của host
- loại bỏ snapshot khi hết thời gian chờ, hủy bỏ, kết thúc phiên hoặc hết hạn
- từ chối truy cập đệ quy vào `exec`, `wait` và các công cụ điều khiển Tìm kiếm công cụ
- ngăn xung đột tên tiện dụng che khuất các trình trợ giúp danh mục

Sandbox là một lớp bảo mật; người vận hành vẫn có thể cần gia cố ở cấp hệ điều hành
cho các triển khai có rủi ro cao.

## Mã lỗi

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` bao gồm các đối số `exec`/`wait` không hợp lệ, ngôn ngữ bị vô hiệu hóa,
quyền truy cập mô-đun bị từ chối, lỗi biến đổi TypeScript, giá trị `runId`
không xác định/đã hết hạn/sai phạm vi và quá nhiều lượt chạy bị tạm ngưng. `runtime_unavailable`
bao gồm worker QuickJS không thể khởi động hoặc thoát với mã khác không.

Các lỗi trả về cho guest là dữ liệu thuần; các instance `Error`, đối tượng stack,
prototype và hàm host không đi vào QuickJS.

## Đo từ xa

Trường `telemetry` của mỗi kết quả báo cáo: kích thước danh mục ẩn và phân tích theo
nguồn (số lượng `openclaw`/`mcp`/`client`), tổng số lần tìm kiếm/mô tả/gọi
tích lũy cho danh mục của lượt chạy và tên công cụ hiển thị với mô hình (`exec`,
`wait` cùng các công cụ chỉ dùng trực tiếp được giữ lại).

Dữ liệu đo từ xa không được bao gồm bí mật, giá trị môi trường thô hoặc đầu vào công cụ
chưa được che thông tin nhạy cảm ngoài chính sách quỹ đạo hiện có của OpenClaw.

## Gỡ lỗi

Dùng ghi nhật ký truyền tải mô hình có mục tiêu khi chế độ mã hoạt động khác với
một lượt chạy công cụ thông thường:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Để gỡ lỗi hình dạng payload, hãy dùng `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Thao tác này ghi nhật ký một ảnh chụp nhanh JSON đã được giới hạn kích thước và che thông tin nhạy cảm của yêu cầu mô hình; chỉ dùng
trong khi gỡ lỗi vì lời nhắc và nội dung tin nhắn vẫn có thể xuất hiện.

Để gỡ lỗi luồng, hãy dùng `OPENCLAW_DEBUG_SSE=peek` để ghi nhật ký năm
sự kiện SSE đầu tiên đã được che thông tin nhạy cảm. Chế độ mã cũng dừng an toàn nếu payload cuối cùng của nhà cung cấp
không chứa chính xác một `exec`, một `wait` và chỉ các công cụ
chỉ-trực-tiếp đã được phê duyệt sau khi bề mặt chế độ mã được kích hoạt.

## Bố cục triển khai

- hợp đồng cấu hình: `tools.codeMode`
- trình tạo danh mục: chuyển các công cụ hiệu dụng thành mục nhập thu gọn và ánh xạ id
- bộ điều hợp bề mặt mô hình: thay thế các công cụ hiển thị bằng công cụ điều khiển/trực tiếp
- bộ điều hợp runtime QuickJS-WASI: tải, đánh giá, chụp nhanh, khôi phục, giải phóng
- trình giám sát worker: hết thời gian chờ, hủy bỏ, cô lập sự cố
- bộ điều hợp cầu nối: callback máy chủ an toàn với JSON và phân phối kết quả
- bộ điều hợp chuyển đổi TypeScript
- kho ảnh chụp nhanh: TTL, giới hạn kích thước, phạm vi lượt chạy/phiên
- phép chiếu quỹ đạo cho các lệnh gọi công cụ lồng nhau
- bộ đếm phép đo từ xa và chẩn đoán

Phần triển khai tái sử dụng các khái niệm danh mục và trình thực thi từ Tìm kiếm công cụ, nhưng
không dùng một phần tử con `node:vm` làm sandbox.

## Danh sách kiểm tra xác thực

Phạm vi kiểm thử chế độ mã cần chứng minh:

- cấu hình bị vô hiệu hóa giữ nguyên khả năng hiển thị công cụ hiện có
- cấu hình đối tượng không có `enabled: true` vẫn để chế độ mã ở trạng thái vô hiệu hóa
- cấu hình được bật hiển thị `exec`, `wait` và chỉ các công cụ chỉ-trực-tiếp bắt buộc cho
  mô hình khi các công cụ đang hoạt động trong lượt chạy
- các lượt chạy thô không có công cụ, `disableTools` và danh sách cho phép trống không kích hoạt
  việc thực thi bắt buộc payload chế độ mã
- tất cả công cụ hiệu dụng không phải MCP đủ điều kiện đưa vào danh mục đều xuất hiện trong `ALL_TOOLS`
- các công cụ chỉ-trực-tiếp vẫn hiển thị với mô hình và không xuất hiện trong `ALL_TOOLS`
- các công cụ bị từ chối không xuất hiện trong `ALL_TOOLS`
- `tools.search`, `tools.describe`, `tools.callValue` và `tools.call` hoạt động với các công cụ OpenClaw
- `API.list("mcp")` và `API.read("mcp/<server>.d.ts")` hiển thị các khai báo MCP theo kiểu TypeScript
  mà không cần lệnh gọi cầu nối/công cụ
- không gian tên MCP `$api()` vẫn khả dụng như một phương án dự phòng nội tuyến cho các lược đồ
- các lệnh gọi không gian tên MCP hoạt động với các công cụ MCP hiển thị có một đầu vào đối tượng, trong khi
  các mục nhập trực tiếp của danh mục MCP không có trong `tools.*`
- các công cụ điều khiển Tìm kiếm công cụ bị ẩn khỏi cả bề mặt mô hình và
  danh mục ẩn
- các lệnh gọi lồng nhau duy trì hành vi phê duyệt và hook
- shell `exec` bị ẩn khỏi mô hình nhưng có thể gọi bằng id danh mục khi
  được phép
- `exec` và `wait` của chế độ mã đệ quy không thể được gọi từ mã khách
- đầu vào TypeScript được chuyển đổi và đánh giá mà không tải TypeScript trên
  các đường dẫn bị vô hiệu hóa hoặc chỉ dành cho JavaScript
- `import`, `require`, quyền truy cập hệ thống tệp, mạng và môi trường đều thất bại
- các vòng lặp vô hạn hết thời gian chờ và không thể chặn Gateway
- các lỗi giới hạn bộ nhớ chấm dứt máy ảo khách
- các giới hạn đầu ra và ảnh chụp nhanh được thực thi cho cả lệnh gọi đã hoàn tất và bị tạm dừng
- `wait` tiếp tục một ảnh chụp nhanh bị tạm dừng và trả về giá trị cuối cùng
- các giá trị `runId` hết hạn, bị hủy bỏ, sai phiên và không xác định đều thất bại
- phát lại và lưu giữ bản chép lời bảo toàn các lệnh gọi điều khiển chế độ mã
- bản chép lời và phép đo từ xa hiển thị rõ các lệnh gọi công cụ lồng nhau

## Kế hoạch kiểm thử E2E

Chạy các kiểm thử này dưới dạng kiểm thử tích hợp hoặc kiểm thử đầu cuối khi thay đổi runtime:

1. Khởi động Gateway với `tools.codeMode.enabled: false`.
2. Gửi một lượt tác tử với một tập công cụ trực tiếp nhỏ.
3. Xác nhận các công cụ hiển thị với mô hình không thay đổi.
4. Khởi động lại với `tools.codeMode.enabled: true`.
5. Gửi một lượt tác tử với các công cụ kiểm thử OpenClaw, Plugin, MCP và máy khách.
6. Xác nhận danh sách công cụ hiển thị với mô hình là `exec`, `wait`, cộng với chỉ các công cụ
   chỉ-trực-tiếp đã được cấu hình.
7. Trong `exec`, đọc `ALL_TOOLS` và xác nhận các công cụ kiểm thử hiệu dụng đủ điều kiện đưa vào danh mục
   có mặt trong khi các công cụ chỉ-trực-tiếp không có mặt.
8. Trong `exec`, gọi các công cụ OpenClaw/Plugin/máy khách thông qua `tools.search`,
   `tools.describe` và `tools.callValue` (hoặc `tools.call` thô).
9. Trong `exec`, gọi `API.list("mcp")` và `API.read("mcp/<server>.d.ts")` rồi
   xác nhận các tệp khai báo mô tả các công cụ MCP hiển thị.
10. Trong `exec`, gọi các công cụ MCP thông qua `MCP.<server>.<tool>({ ...input })` và
    xác nhận các mục nhập trực tiếp của danh mục MCP không có trong `ALL_TOOLS` và
    `tools.*`.
11. Xác nhận các công cụ bị từ chối không có mặt và không thể được gọi bằng id phỏng đoán.
12. Bắt đầu một lệnh gọi công cụ lồng nhau được phân giải sau khi `exec` trả về `waiting`.
13. Gọi `wait` và xác nhận máy ảo đã khôi phục nhận được kết quả công cụ.
14. Xác nhận câu trả lời cuối cùng chứa đầu ra được tạo sau khi khôi phục.
15. Xác nhận việc hết thời gian chờ, hủy bỏ và hết hạn ảnh chụp nhanh sẽ dọn dẹp trạng thái runtime.
16. Xuất quỹ đạo và xác nhận các lệnh gọi lồng nhau hiển thị bên dưới lệnh gọi
    chế độ mã mẹ.

Các thay đổi chỉ dành cho tài liệu trên trang này vẫn cần chạy `pnpm check:docs`.

## Liên quan

- [Swarm](/tools/swarm) để điều phối tác tử theo kiểu fan-out từ các tập lệnh Chế độ mã
- [Tìm kiếm công cụ](/vi/tools/tool-search)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Công cụ Exec](/vi/tools/exec)
- [Thực thi mã](/vi/tools/code-execution)
