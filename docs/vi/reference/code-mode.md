---
read_when:
    - Bạn muốn bật chế độ mã OpenClaw cho một lượt chạy tác tử
    - Bạn cần giải thích vì sao chế độ mã khác với chế độ Codex Code.
    - Bạn đang rà soát hợp đồng exec/wait, sandbox QuickJS-WASI, biến đổi TypeScript, hoặc cầu nối danh mục công cụ ẩn
    - Bạn đang thêm hoặc xem xét một tích hợp sổ đăng ký namespace chế độ mã nội bộ
sidebarTitle: Code mode
summary: 'Chế độ mã của OpenClaw: một bề mặt công cụ exec/wait bật theo lựa chọn, được hỗ trợ bởi QuickJS-WASI và một danh mục công cụ ẩn theo phạm vi lượt chạy'
title: Chế độ mã
x-i18n:
    generated_at: "2026-06-27T18:08:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Chế độ mã là một tính năng agent-runtime thử nghiệm của OpenClaw. Tính năng này tắt theo
mặc định. Khi bạn bật tính năng này, OpenClaw thay đổi những gì mô hình thấy trong một lần chạy:
thay vì hiển thị trực tiếp mọi schema công cụ đã bật, mô hình chỉ thấy
`exec` và `wait`.

Trang này ghi lại chế độ mã của OpenClaw. Đây không phải là chế độ mã của Codex. Hai
tính năng có cùng tên, nhưng được triển khai bởi các runtime khác nhau và hiển thị
các hợp đồng `exec` khác nhau:

- Codex Code Mode được bật cho các luồng app-server của Codex trừ khi chính sách
  công cụ hạn chế tắt chế độ mã gốc. Nó chạy trong harness lập trình của Codex,
  nơi mô hình viết lệnh shell thông qua hợp đồng `exec.command`.
- Chế độ mã của OpenClaw bị tắt trừ khi `tools.codeMode.enabled: true` được
  cấu hình. Nó chạy trong runtime agent tổng quát của OpenClaw, nơi mô hình
  viết chương trình JavaScript hoặc TypeScript thông qua hợp đồng `exec.code`.

Codex Code Mode và tìm kiếm công cụ động gốc của Codex là các bề mặt harness Codex
ổn định. Chế độ mã của OpenClaw là một bộ điều hợp bề mặt công cụ thử nghiệm
do OpenClaw sở hữu cho các lần chạy OpenClaw tổng quát. Nó sử dụng `quickjs-wasi`,
một danh mục công cụ OpenClaw ẩn, và trình thực thi công cụ OpenClaw thông thường.

## Đây là gì?

Chế độ mã của OpenClaw cho phép mô hình viết một chương trình JavaScript hoặc TypeScript nhỏ
thay vì chọn trực tiếp từ một danh sách dài các công cụ.

Khi chế độ mã đang hoạt động:

- Danh sách công cụ mà mô hình thấy chính xác là `exec` và `wait`.
- `exec` đánh giá JavaScript hoặc TypeScript do mô hình tạo trong một worker
  QuickJS-WASI bị ràng buộc.
- Các công cụ OpenClaw thông thường được ẩn khỏi prompt của mô hình và được hiển thị bên trong
  chương trình khách thông qua `ALL_TOOLS` và `tools`.
- Mã khách có thể tìm kiếm danh mục ẩn, mô tả một công cụ, và gọi một công cụ
  thông qua cùng đường dẫn thực thi OpenClaw dùng bởi các lượt agent thông thường.
- Công cụ MCP được nhóm dưới namespace `MCP`. Trong chế độ mã, namespace này
  là cách duy nhất được hỗ trợ để gọi công cụ MCP.
- `wait` tiếp tục một lần chạy chế độ mã đã tạm dừng khi các lệnh gọi công cụ lồng nhau vẫn
  đang chờ.

Điểm khác biệt quan trọng: chế độ mã thay đổi bề mặt điều phối hướng tới mô hình.
Nó không thay thế công cụ OpenClaw, công cụ Plugin, công cụ MCP, xác thực,
chính sách phê duyệt, hành vi kênh, hay lựa chọn mô hình.

## Vì sao điều này tốt?

Chế độ mã giúp mô hình dễ dùng các danh mục công cụ lớn hơn.

- Bề mặt prompt nhỏ hơn: nhà cung cấp nhận hai công cụ điều khiển thay vì hàng chục
  hoặc hàng trăm schema công cụ đầy đủ.
- Điều phối tốt hơn: mô hình có thể dùng vòng lặp, phép nối, biến đổi nhỏ,
  logic điều kiện, và các lệnh gọi công cụ lồng nhau song song bên trong một ô mã.
- Trung lập với nhà cung cấp: nó hoạt động cho OpenClaw, Plugin, MCP, và công cụ phía client mà không
  phụ thuộc vào thực thi mã gốc của nhà cung cấp.
- Chính sách hiện có vẫn được áp dụng: các lệnh gọi công cụ lồng nhau vẫn đi qua chính sách OpenClaw,
  phê duyệt, hook, ngữ cảnh phiên, và đường dẫn kiểm toán.
- Chế độ lỗi rõ ràng: khi chế độ mã được bật rõ ràng và runtime không
  khả dụng, OpenClaw thất bại đóng thay vì quay về hiển thị trực tiếp công cụ rộng.

Chế độ mã đặc biệt hữu ích cho các agent có danh mục công cụ đã bật lớn hoặc
cho các quy trình nơi mô hình thường xuyên cần tìm kiếm, kết hợp, và gọi
công cụ trước khi tạo câu trả lời.

## Cách bật

Thêm `tools.codeMode.enabled: true` vào cấu hình agent hoặc runtime:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Dạng rút gọn cũng được chấp nhận:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Chế độ mã vẫn tắt khi `tools.codeMode` bị bỏ qua, là `false`, hoặc là một đối tượng
không có `enabled: true`.

Khi bạn dùng agent sandbox với các máy chủ MCP đã cấu hình, cũng hãy đảm bảo
chính sách công cụ sandbox cho phép Plugin MCP đi kèm, ví dụ với
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Xem
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Dùng giới hạn rõ ràng khi bạn muốn các ràng buộc chặt hơn:

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

Để xác nhận dạng payload của mô hình khi gỡ lỗi, chạy Gateway với
ghi log có mục tiêu:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Khi chế độ mã đang hoạt động, tên công cụ hướng tới mô hình trong log phải là `exec` và
`wait`. Nếu bạn cần payload nhà cung cấp đã biên tập, hãy thêm
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` cho một phiên gỡ lỗi ngắn.

## Chuyến tham quan kỹ thuật

Phần còn lại của trang này mô tả hợp đồng runtime và chi tiết triển khai.
Nó dành cho maintainer, tác giả Plugin đang gỡ lỗi việc hiển thị công cụ, và
operator xác thực các triển khai rủi ro cao.

## Trạng thái runtime

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Trạng thái mặc định: đã tắt.
- Độ ổn định: bề mặt OpenClaw thử nghiệm; Codex Code mode là một bề mặt harness Codex
  ổn định riêng biệt.
- Bề mặt mục tiêu: các lần chạy agent OpenClaw tổng quát.
- Tư thế bảo mật: mã mô hình là thù địch.
- Cam kết hướng tới người dùng: bật chế độ mã không bao giờ âm thầm quay về
  hiển thị trực tiếp công cụ rộng.

## Phạm vi

Chế độ mã sở hữu dạng điều phối hướng tới mô hình cho một lần chạy đã chuẩn bị. Nó không
sở hữu lựa chọn mô hình, hành vi kênh, xác thực, chính sách công cụ, hay các
triển khai công cụ.

Trong phạm vi:

- định nghĩa công cụ `exec` và `wait` mà mô hình thấy
- xây dựng danh mục công cụ ẩn
- thực thi khách JavaScript và TypeScript
- runtime worker QuickJS-WASI
- callback host cho tìm kiếm danh mục, mô tả schema, và gọi công cụ
- trạng thái có thể tiếp tục cho các chương trình khách bị tạm dừng
- giới hạn đầu ra, timeout, bộ nhớ, lệnh gọi đang chờ, và snapshot
- telemetry và chiếu trajectory cho các lệnh gọi công cụ lồng nhau

Ngoài phạm vi:

- thực thi mã từ xa gốc của nhà cung cấp
- ngữ nghĩa thực thi shell
- thay đổi ủy quyền công cụ hiện có
- script do người dùng tạo được lưu bền vững
- quyền truy cập package manager, file, mạng, hoặc module trong mã khách
- tái sử dụng trực tiếp nội bộ của Codex Code mode

Các công cụ do nhà cung cấp sở hữu như sandbox Python từ xa vẫn là các công cụ riêng. Xem
[Thực thi mã](/vi/tools/code-execution).

## Thuật ngữ

**Chế độ mã** là chế độ runtime OpenClaw ẩn các công cụ mô hình thông thường và
chỉ hiển thị `exec` và `wait`.

**Runtime khách** là VM JavaScript QuickJS-WASI đánh giá mã mô hình.

**Cầu nối host** là bề mặt callback tương thích JSON hẹp từ mã khách
quay lại OpenClaw.

**Danh mục** là danh sách công cụ hiệu dụng theo phạm vi lần chạy sau chính sách công cụ thông thường,
Plugin, MCP, và phân giải công cụ client.

**Lệnh gọi công cụ lồng nhau** là một lệnh gọi công cụ được thực hiện từ mã khách thông qua cầu nối host.

**Snapshot** là trạng thái VM QuickJS-WASI đã tuần tự hóa được lưu để `wait` có thể tiếp tục một
lần chạy chế độ mã đã tạm dừng.

## Cấu hình

`tools.codeMode.enabled` là cổng kích hoạt. Việc đặt các trường chế độ mã khác
không bật tính năng.

Các trường được hỗ trợ:

- `enabled`: boolean. Mặc định `false`. Chỉ bật chế độ mã khi là `true`.
- `runtime`: `"quickjs-wasi"`. Runtime duy nhất được hỗ trợ.
- `mode`: `"only"`. Hiển thị `exec` và `wait`, ẩn các công cụ mô hình thông thường.
- `languages`: mảng gồm `"javascript"` và `"typescript"`. Mặc định bao gồm
  cả hai.
- `timeoutMs`: giới hạn thời gian đồng hồ cho một `exec` hoặc `wait`. Mặc định `10000`.
  Kẹp runtime: `100` đến `60000`.
- `memoryLimitBytes`: giới hạn heap QuickJS. Mặc định `67108864`. Kẹp runtime:
  `1048576` đến `1073741824`.
- `maxOutputBytes`: giới hạn cho văn bản, JSON, và log trả về. Mặc định `65536`.
  Kẹp runtime: `1024` đến `10485760`.
- `maxSnapshotBytes`: giới hạn cho snapshot VM đã tuần tự hóa. Mặc định `10485760`.
  Kẹp runtime: `1024` đến `268435456`.
- `maxPendingToolCalls`: giới hạn cho các lệnh gọi công cụ lồng nhau đồng thời. Mặc định `16`.
  Kẹp runtime: `1` đến `128`.
- `snapshotTtlSeconds`: thời gian một VM bị tạm dừng có thể được tiếp tục. Mặc định `900`.
  Kẹp runtime: `1` đến `86400`.
- `searchDefaultLimit`: số lượng kết quả tìm kiếm danh mục ẩn mặc định. Mặc định `8`.
  Runtime kẹp giá trị này theo `maxSearchLimit`.
- `maxSearchLimit`: số lượng kết quả tìm kiếm danh mục ẩn tối đa. Mặc định `50`.
  Kẹp runtime: `1` đến `50`.

Nếu chế độ mã được bật nhưng QuickJS-WASI không thể tải, OpenClaw thất bại đóng cho
lần chạy đó. Nó không âm thầm hiển thị công cụ thông thường làm fallback.

## Kích hoạt

Chế độ mã được đánh giá sau khi chính sách công cụ hiệu dụng đã biết và trước khi
yêu cầu mô hình cuối cùng được lắp ráp.

Thứ tự kích hoạt:

1. Phân giải agent, mô hình, nhà cung cấp, sandbox, kênh, người gửi, và chính sách lần chạy.
2. Xây dựng danh sách công cụ OpenClaw hiệu dụng.
3. Thêm các công cụ Plugin, MCP, và client đủ điều kiện.
4. Áp dụng chính sách cho phép và từ chối.
5. Nếu `tools.codeMode.enabled` là false, tiếp tục với hiển thị công cụ thông thường.
6. Nếu đã bật và công cụ đang hoạt động cho lần chạy, đăng ký các công cụ hiệu dụng trong
   danh mục chế độ mã.
7. Xóa mọi công cụ thông thường khỏi danh sách công cụ mà mô hình thấy.
8. Thêm `exec` và `wait` của chế độ mã.

Các lần chạy cố ý không có công cụ, như lệnh gọi mô hình thô, `disableTools`,
hoặc allowlist rỗng, không kích hoạt bề mặt chế độ mã ngay cả khi cấu hình
chứa `tools.codeMode.enabled: true`.

Danh mục chế độ mã có phạm vi theo lần chạy. Nó không được rò rỉ công cụ từ agent,
phiên, người gửi, hoặc lần chạy khác.

## Công cụ mà mô hình thấy

Khi chế độ mã đang hoạt động, mô hình thấy chính xác các công cụ cấp cao nhất này:

- `exec`
- `wait`

Mọi công cụ đã bật khác được ẩn khỏi danh sách công cụ hướng tới mô hình và được đăng ký
trong danh mục chế độ mã.

Mô hình nên dùng `exec` để điều phối công cụ, nối dữ liệu, vòng lặp,
các lệnh gọi lồng nhau song song, và các biến đổi có cấu trúc. Mô hình chỉ nên dùng
`wait` khi `exec` trả về kết quả `waiting` có thể tiếp tục.

## `exec`

`exec` khởi động một ô chế độ mã và trả về một kết quả. Mã đầu vào do mô hình
tạo và phải được xem là thù địch.

Đầu vào:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Quy tắc đầu vào:

- Một trong `code` hoặc `command` phải không rỗng.
- `code` là trường hướng tới mô hình được ghi trong tài liệu.
- `command` được chấp nhận như một bí danh tương thích exec cho chính sách hook và
  các lần viết lại đáng tin cậy; khi cả hai có mặt, các giá trị phải khớp.
- Sự kiện hook `exec` chế độ mã bên ngoài bao gồm `toolKind: "code_mode_exec"` và
  bao gồm `toolInputKind: "javascript" | "typescript"` khi ngôn ngữ đầu vào
  được biết, để chính sách có thể phân biệt ô chế độ mã với các lệnh gọi `exec`
  kiểu shell có cùng tên công cụ.
- `language` mặc định là `"javascript"`.
- Nếu `language` là `"typescript"`, OpenClaw chuyển dịch trước khi đánh giá.
- `exec` từ chối `import`, `require`, import động, và các mẫu module-loader
  trong v1.
- `exec` không hiển thị đệ quy triển khai `exec` shell thông thường.

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

`exec` trả về `waiting` khi VM QuickJS tạm dừng với trạng thái có thể tiếp tục mà
vẫn cần một bước tiếp tục hiển thị với mô hình. Kết quả bao gồm `runId` cho
`wait`. Các lệnh gọi cầu nối namespace, bao gồm lệnh gọi namespace MCP, được tự động xả
bên trong cùng lệnh gọi `exec`/`wait` khi chúng sẵn sàng, vì vậy một khối mã gọn
có thể kiểm tra `$api()` và gọi một công cụ MCP mà không buộc phải có một lệnh gọi công cụ mô hình cho mỗi
lần await namespace.

`exec` chỉ trả về `completed` khi VM khách không còn công việc đang chờ xử lý và
giá trị cuối cùng tương thích JSON sau khi bộ điều hợp đầu ra của OpenClaw chạy.

## `wait`

`wait` tiếp tục một VM chế độ mã đang bị tạm dừng.

Đầu vào:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Đầu ra là cùng hợp `CodeModeResult` mà `exec` trả về.

`wait` tồn tại vì các công cụ OpenClaw lồng nhau có thể chậm, tương tác, bị chặn
bởi phê duyệt, hoặc phát trực tuyến các cập nhật từng phần. Mô hình không cần
giữ một lệnh gọi `exec` dài đang mở trong khi máy chủ chờ công việc bên ngoài.

Ảnh chụp và khôi phục QuickJS-WASI là cơ chế tiếp tục v1:

1. `exec` đánh giá mã cho đến khi hoàn tất, thất bại, hoặc tạm dừng.
2. Khi tạm dừng, OpenClaw chụp ảnh VM QuickJS và ghi lại công việc máy chủ đang
   chờ xử lý.
3. Khi công việc đang chờ ổn định, `wait` khôi phục ảnh chụp VM.
4. OpenClaw đăng ký lại các callback máy chủ bằng tên ổn định.
5. OpenClaw chuyển kết quả công cụ lồng nhau vào VM đã khôi phục.
6. OpenClaw xả các tác vụ QuickJS đang chờ.
7. `wait` trả về kết quả `completed`, `failed`, hoặc một kết quả `waiting` khác.

Ảnh chụp là trạng thái runtime, không phải tạo tác người dùng. Chúng bị giới hạn
kích thước, hết hạn, và được giới hạn trong lượt chạy và phiên đã tạo ra chúng.

`wait` thất bại khi:

- `runId` không xác định.
- ảnh chụp đã hết hạn.
- lượt chạy cha hoặc phiên đã bị hủy.
- bên gọi không ở trong cùng phạm vi lượt chạy/phiên.
- khôi phục QuickJS-WASI thất bại.
- việc khôi phục sẽ vượt quá các giới hạn đã cấu hình.

## API runtime khách

Runtime khách cung cấp một API toàn cục nhỏ:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` là siêu dữ liệu gọn cho danh mục trong phạm vi lượt chạy. Theo mặc
định, nó không chứa đầy đủ schema.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Schema đầy đủ chỉ được tải theo nhu cầu:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Các helper danh mục:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Các hàm công cụ tiện dụng chỉ được cài đặt cho các tên an toàn, không mơ hồ:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Các mục danh mục MCP không thể được gọi qua `tools.call(...)` hoặc các hàm tiện
dụng trong chế độ mã. Chúng chỉ được cung cấp qua namespace `MCP` được tạo ra.
Các tệp khai báo kiểu TypeScript có sẵn qua bề mặt tệp ảo chỉ đọc `API`, để các
agent có thể kiểm tra chữ ký MCP mà không thêm schema MCP vào prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` trả về các khai báo gọn được suy luận từ siêu dữ
liệu công cụ MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Các tệp khai báo là ảo, không phải tệp được ghi dưới workspace hoặc thư mục
trạng thái. Với mỗi lệnh gọi `exec` ở chế độ mã, OpenClaw xây dựng danh mục công
cụ trong phạm vi lượt chạy, giữ các mục MCP hiển thị, render `mcp/index.d.ts`
cộng với một khai báo `mcp/<server>.d.ts` cho mỗi máy chủ hiển thị, rồi tiêm bảng
nhỏ chỉ đọc đó vào worker QuickJS. Mã khách chỉ thấy đối tượng `API`:
`API.list(prefix?)` trả về siêu dữ liệu tệp và `API.read(path)` trả về nội dung
khai báo đã chọn. Các đường dẫn không xác định và các đoạn `.` / `..` bị từ chối.

Điều này giữ các schema MCP lớn nằm ngoài prompt của mô hình. Agent biết rằng API
ảo tồn tại từ mô tả công cụ `exec`, chỉ đọc tệp khai báo cần thiết, rồi gọi
`MCP.<server>.<tool>()` với một đối số đối tượng. `MCP.<server>.$api()` vẫn có
sẵn như một phương án dự phòng nội tuyến khi agent cần phản hồi schema cho một
công cụ duy nhất bên trong chương trình.

Runtime khách không được để lộ trực tiếp các đối tượng máy chủ. Đầu vào và đầu ra
đi qua cầu nối dưới dạng các giá trị tương thích JSON với giới hạn kích thước rõ
ràng.

## Namespace nội bộ

Namespace nội bộ cung cấp cho chế độ mã một API miền ngắn gọn mà không thêm nhiều
công cụ hiển thị với mô hình hơn. Một tích hợp do loader sở hữu có thể đăng ký
một namespace như `Issues`, `Fictions`, hoặc `Calendar`; mã khách sau đó gọi
namespace đó bên trong chương trình QuickJS trong khi OpenClaw vẫn chỉ hiển thị
`exec` và `wait` cho mô hình.

Hiện tại namespace là nội bộ. Không có API namespace SDK Plugin công khai:
namespace của Plugin bên ngoài cần một hợp đồng do loader sở hữu để danh tính
Plugin, manifest đã cài đặt, trạng thái xác thực, và bộ mô tả danh mục đã lưu
đệm không bị lệch khỏi các công cụ Plugin hỗ trợ namespace. Chế độ mã lõi chỉ sở
hữu sandbox, tuần tự hóa, kiểm soát danh mục, và điều phối cầu nối.

Mã khách sau đó có thể dùng trực tiếp global hoặc bản đồ `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Vòng đời registry

Registry namespace là cục bộ theo tiến trình và được khóa theo id namespace. Một
lượt chạy điển hình theo đường dẫn này:

1. Một loader đáng tin cậy gọi `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Chế độ mã tạo `ToolSearchRuntime` ẩn cho lượt chạy và đọc danh mục trong phạm
   vi lượt chạy của nó.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` chỉ giữ các đăng ký có toàn bộ
   `requiredToolNames` hiển thị và do cùng `pluginId` sở hữu.
4. Mỗi namespace hiển thị gọi `createScope(ctx)` cho lượt chạy hiện tại. Phạm vi
   nhận ngữ cảnh lượt chạy như `agentId`, `sessionKey`, `sessionId`, `runId`,
   cấu hình, và trạng thái hủy.
5. Dữ liệu phạm vi được tuần tự hóa thành một bộ mô tả thuần và được tiêm vào
   QuickJS dưới dạng global trực tiếp và `namespaces.<globalName>`.
6. Các lệnh gọi của khách tạm dừng qua cầu nối worker, phân giải đường dẫn
   namespace trên máy chủ, ánh xạ lệnh gọi tới một công cụ danh mục đã khai báo
   do Plugin sở hữu, và thực thi công cụ đó qua `ToolSearchRuntime.call`.
7. OpenClaw tự động xả các lệnh gọi cầu nối namespace đã sẵn sàng bên trong lệnh
   gọi công cụ `exec`/`wait` đang hoạt động. Nếu công việc namespace vẫn đang chờ
   khi hết thời gian chờ hoặc khách chủ động nhường quyền, `wait` tiếp tục cùng
   runtime namespace sau đó.
8. Rollback hoặc gỡ cài đặt Plugin gọi `clearCodeModeNamespacesForPlugin(pluginId)`
   để các global cũ không tồn tại sau khi tải Plugin thất bại.

Bất biến quan trọng: lệnh gọi namespace là lệnh gọi công cụ danh mục. Chúng dùng
cùng các hook chính sách, phê duyệt, xử lý hủy, telemetry, chiếu bản ghi, và hành
vi tạm dừng/tiếp tục như `tools.call(...)`.

### Hình dạng đăng ký

Đăng ký namespace từ tích hợp sở hữu các công cụ nền. Giữ phạm vi nhỏ và chỉ để
lộ các động từ miền ánh xạ tới các công cụ danh mục đã khai báo.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` đánh dấu một thành viên phạm
vi là hàm namespace có thể gọi. `inputMapper` tùy chọn nhận các đối số từ khách
và trả về đối tượng đầu vào cho công cụ danh mục nền. Khi không có bộ ánh xạ đầu
vào, đối số đầu tiên của khách được dùng, hoặc `{}` khi bị bỏ qua.

Các hàm máy chủ thô bị từ chối trước khi mã khách chạy:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Quyền sở hữu và khả năng hiển thị

Quyền sở hữu namespace gắn với `pluginId` của bên gọi đăng ký.
`requiredToolNames` vừa là cổng hiển thị vừa là kiểm tra quyền sở hữu:

- mọi công cụ bắt buộc phải tồn tại trong danh mục lượt chạy
- mọi công cụ bắt buộc phải có `sourceName === pluginId`
- namespace bị ẩn khi bất kỳ công cụ bắt buộc nào vắng mặt hoặc do Plugin khác
  sở hữu
- mỗi đường dẫn có thể gọi chỉ được nhắm đến một công cụ có tên trong
  `requiredToolNames`

Điều này ngăn Plugin khác để lộ một namespace bằng cách đăng ký một công cụ cùng
tên. Nó cũng giữ namespace nhất quán với chính sách agent thông thường: nếu lượt
chạy không thấy các công cụ nền, nó không thấy namespace.

Ví dụ, một namespace GitHub nên nằm sau một phần mở rộng do GitHub sở hữu, quản
lý xác thực GitHub, client REST hoặc GraphQL, giới hạn tốc độ, phê duyệt ghi, và
kiểm thử. Chế độ mã lõi không nên nhúng API đặc thù GitHub, xử lý token, hoặc
chính sách provider.

### Quy tắc tuần tự hóa phạm vi

`createScope(ctx)` có thể trả về một đối tượng thuần chứa các giá trị tương thích
JSON, mảng, đối tượng lồng nhau, và các dấu lệnh gọi
`createCodeModeNamespaceTool(...)`. Đối tượng máy chủ không bao giờ đi trực tiếp
vào QuickJS.

Bộ tuần tự hóa từ chối:

- hàm thô
- đồ thị đối tượng vòng
- đoạn đường dẫn không an toàn: `__proto__`, `constructor`, `prototype`, khóa
  rỗng, hoặc khóa chứa dấu phân tách đường dẫn nội bộ
- giá trị `globalName` không phải là định danh JavaScript
- xung đột `globalName` với các global chế độ mã tích hợp sẵn như `tools`,
  `namespaces`, `text`, `json`, `yield_control`, hoặc `__openclaw*`

Các giá trị không thể tuần tự hóa JSON được chuyển thành giá trị dự phòng an
toàn JSON trước khi đi qua cầu nối. Dữ liệu nhị phân, handle, socket, client, và
thể hiện lớp nên ở sau các công cụ danh mục thông thường.

### Prompt

`description` của namespace và `prompt` tùy chọn được nối vào schema `exec` hiển
thị với mô hình chỉ khi namespace hiển thị cho lượt chạy đó. Dùng chúng để dạy bề
mặt hữu ích nhỏ nhất:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Giữ prompt xoay quanh hợp đồng namespace, không phải thiết lập xác thực, lịch sử
triển khai, hoặc hành vi Plugin không liên quan.

### Dọn dẹp

Namespace là các đăng ký cục bộ theo tiến trình. Hãy xóa chúng khi plugin sở hữu
bị tắt, gỡ cài đặt hoặc rollback:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Việc dọn dẹp code-mode thuộc sở hữu của plugin; hãy xóa các đăng ký namespace của plugin
khi vòng đời của nó kết thúc thay vì giữ các handle teardown theo từng namespace. Các bài kiểm thử
có thể gọi `clearCodeModeNamespacesForTest()` để tránh rò rỉ đăng ký
giữa các trường hợp.

### Danh sách kiểm thử

Các thay đổi namespace nên bao phủ ranh giới bảo mật và hành vi của guest:

- văn bản prompt namespace chỉ xuất hiện khi các công cụ hỗ trợ hiển thị
- các công cụ trùng tên từ một `sourceName` khác không để lộ namespace
- các hàm scope thô bị từ chối
- id namespace giả mạo và đường dẫn giả mạo bị từ chối
- các đường dẫn có thể gọi không thể nhắm tới công cụ chưa khai báo
- các đối tượng lồng nhau và tham chiếu dùng chung được tuần tự hóa đúng cách
- các lệnh gọi namespace thực thi thông qua công cụ catalog và trả về chi tiết an toàn với JSON
- lỗi có thể được mã guest bắt
- các lệnh gọi namespace bị tạm dừng tiếp tục thông qua `wait`
- rollback plugin xóa các đăng ký namespace thuộc sở hữu đó

Namespace bổ sung cho catalog `tools.search` / `tools.call` chung. Dùng
catalog cho các công cụ OpenClaw, plugin và client tùy ý đã bật; dùng `MCP` cho
các công cụ MCP; dùng các namespace khác cho API miền được tài liệu hóa, thuộc sở hữu plugin, nơi
mã ngắn gọn đáng tin cậy hơn việc tra cứu schema lặp lại.

## API đầu ra

`text(value)` thêm đầu ra mà con người có thể đọc vào mảng `output`.

`json(value)` thêm một mục đầu ra có cấu trúc sau khi tuần tự hóa tương thích JSON.

Giá trị trả về cuối cùng của mã guest trở thành `value` trong kết quả `completed`.

Mục đầu ra:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Quy tắc đầu ra:

- thứ tự đầu ra khớp với các lệnh gọi của guest
- đầu ra bị giới hạn bởi `maxOutputBytes`
- các giá trị không thể tuần tự hóa được chuyển thành chuỗi thuần hoặc lỗi
- giá trị nhị phân không được hỗ trợ trong v1
- hình ảnh và tệp đi qua các công cụ OpenClaw thông thường, không đi qua
  cầu nối code-mode

## Catalog công cụ

Catalog ẩn bao gồm các công cụ sau khi lọc chính sách hiệu lực:

1. Công cụ lõi OpenClaw.
2. Công cụ plugin được đóng gói kèm.
3. Công cụ plugin bên ngoài.
4. Công cụ MCP.
5. Công cụ do client cung cấp cho lần chạy hiện tại.

Id catalog ổn định trong một lần chạy và có tính xác định trên các tập công cụ tương đương
khi có thể.

Dạng id được khuyến nghị:

```text
<source>:<owner>:<tool-name>
```

Ví dụ:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Catalog bỏ qua các công cụ điều khiển code-mode:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Điều này ngăn đệ quy và giữ hợp đồng hướng tới model gọn hẹp.

Các mục MCP vẫn nằm trong catalog theo phạm vi lần chạy để chính sách, phê duyệt, hook,
telemetry, phép chiếu transcript và id công cụ chính xác vẫn được chia sẻ với quá trình
thực thi công cụ bình thường. Các chế độ xem dành cho guest `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` và `tools.call(...)` bỏ qua các mục MCP. Namespace
`MCP.<server>.<tool>({ ...input })` được tạo sẽ phân giải trở lại
đúng id catalog rồi điều phối qua cùng đường dẫn executor.

## Tương tác Tool Search

Code mode thay thế bề mặt model Tool Search của OpenClaw cho các lần chạy mà nó
đang hoạt động.

Khi `tools.codeMode.enabled` là true và code mode kích hoạt:

- OpenClaw không để lộ `tool_search_code`, `tool_search`, `tool_describe`,
  hoặc `tool_call` như các công cụ hiển thị với model.
- Cùng ý tưởng cataloging chuyển vào bên trong runtime guest.
- Runtime guest nhận metadata `ALL_TOOLS` nhỏ gọn và các helper search, describe,
  và call cho các công cụ không phải MCP.
- Các lệnh gọi MCP dùng namespace `MCP` được tạo và header `$api()` của nó thay vì
  `tools.call(...)`.
- Các lệnh gọi lồng nhau điều phối qua cùng đường dẫn executor OpenClaw mà Tool Search
  sử dụng.

Trang [Tool Search](/vi/tools/tool-search) hiện có mô tả cầu nối catalog nhỏ gọn của OpenClaw.
Code mode là lựa chọn thay thế OpenClaw chung cho các lần chạy có thể
dùng `exec` và `wait`.

## Tên công cụ và xung đột

Công cụ `exec` hiển thị với model là công cụ code-mode. Nếu công cụ shell `exec`
bình thường của OpenClaw được bật, nó bị ẩn khỏi model và được đưa vào catalog như bất kỳ
công cụ nào khác.

Bên trong runtime guest:

- `tools.call("openclaw:core:exec", input)` có thể gọi công cụ shell exec nếu
  chính sách cho phép.
- `tools.exec(...)` chỉ được cài đặt nếu mục catalog shell exec có
  tên an toàn không mơ hồ.
- công cụ code-mode `exec` không bao giờ có sẵn đệ quy thông qua `tools`.

Nếu hai công cụ chuẩn hóa thành cùng một tên tiện ích an toàn, OpenClaw bỏ qua
hàm tiện ích và yêu cầu `tools.call(id, input)`.

## Thực thi công cụ lồng nhau

Mỗi lệnh gọi công cụ lồng nhau đi qua cầu nối host và vào lại OpenClaw.

Thực thi lồng nhau giữ nguyên:

- id agent đang hoạt động
- id phiên và khóa phiên
- ngữ cảnh người gửi và kênh
- chính sách sandbox
- chính sách phê duyệt
- hook `before_tool_call` của plugin
- tín hiệu abort
- cập nhật streaming khi có
- sự kiện trajectory và audit

Các lệnh gọi lồng nhau được chiếu vào transcript như lệnh gọi công cụ thật để các gói hỗ trợ
có thể hiển thị điều đã xảy ra. Phép chiếu xác định lệnh gọi công cụ code-mode cha
và id công cụ lồng nhau.

Các lệnh gọi lồng nhau song song được cho phép tới `maxPendingToolCalls`.

## Trạng thái runtime

Mỗi lần chạy code-mode có một máy trạng thái:

- `running`: VM đang thực thi hoặc các lệnh gọi lồng nhau đang diễn ra.
- `waiting`: snapshot VM tồn tại và có thể tiếp tục bằng `wait`.
- `completed`: giá trị cuối cùng đã trả về; snapshot đã xóa.
- `failed`: lỗi đã trả về; snapshot đã xóa.
- `expired`: snapshot hoặc trạng thái pending vượt quá thời gian lưu giữ; không thể tiếp tục.
- `aborted`: lần chạy/phiên cha đã hủy; snapshot đã xóa.

Trạng thái được giới hạn theo lần chạy agent, phiên và id lệnh gọi công cụ. Một lệnh gọi `wait` từ
lần chạy hoặc phiên khác sẽ thất bại.

Lưu trữ snapshot có giới hạn:

- số byte snapshot tối đa cho mỗi lần chạy
- số snapshot live tối đa cho mỗi tiến trình
- TTL snapshot
- dọn dẹp khi kết thúc lần chạy
- dọn dẹp khi Gateway tắt ở nơi không hỗ trợ persistence

## Runtime QuickJS-WASI

OpenClaw tải `quickjs-wasi` như một dependency trực tiếp trong package sở hữu. Runtime
không dựa vào một bản sao bắc cầu được cài đặt cho proxy, PAC hoặc các dependency
không liên quan khác.

Trách nhiệm của runtime:

- biên dịch hoặc tải module WebAssembly QuickJS-WASI
- tạo một VM cô lập cho mỗi lần chạy hoặc tiếp tục code-mode
- đăng ký callback host bằng tên ổn định
- đặt giới hạn bộ nhớ và interrupt
- đánh giá JavaScript
- rút cạn các job đang chờ
- snapshot trạng thái VM bị tạm dừng
- khôi phục snapshot cho `wait`
- dispose các handle VM và snapshot sau các trạng thái kết thúc

Runtime thực thi bên ngoài vòng lặp sự kiện chính của OpenClaw trong một worker. Một vòng lặp vô hạn
của guest không được chặn tiến trình Gateway vô thời hạn.

## TypeScript

Hỗ trợ TypeScript chỉ là một phép biến đổi nguồn:

- đầu vào được chấp nhận: một chuỗi mã TypeScript
- đầu ra: chuỗi JavaScript được QuickJS-WASI đánh giá
- không typechecking
- không phân giải module
- không `import` hoặc `require` trong v1
- diagnostics được trả về dưới dạng kết quả `failed`

Trình biên dịch TypeScript được tải lười chỉ cho các ô TypeScript. Các ô
JavaScript thuần và code mode bị tắt không tải trình biên dịch.

Phép biến đổi nên giữ lại số dòng hữu ích khi khả thi.

## Ranh giới bảo mật

Mã model là thù địch. Runtime dùng phòng thủ nhiều lớp:

- chạy QuickJS-WASI bên ngoài vòng lặp sự kiện chính
- tải `quickjs-wasi` như một dependency trực tiếp, không thông qua Codex hoặc package
  bắc cầu
- không có hệ thống tệp, mạng, subprocess, import module, biến môi trường hoặc
  đối tượng global host trong guest
- dùng giới hạn bộ nhớ và interrupt của QuickJS
- thực thi timeout wall-clock của tiến trình cha
- thực thi giới hạn đầu ra, snapshot, log và lệnh gọi pending
- tuần tự hóa giá trị cầu nối host qua adapter JSON hẹp
- chuyển lỗi host thành lỗi guest thuần, không bao giờ là đối tượng realm host
- bỏ snapshot khi timeout, abort, kết thúc phiên hoặc hết hạn
- từ chối truy cập đệ quy tới `exec`, `wait` và các công cụ điều khiển Tool Search
- ngăn xung đột tên tiện ích che khuất helper catalog

Sandbox là một lớp bảo mật. Operator vẫn có thể cần gia cố cấp OS
cho các triển khai rủi ro cao.

## Mã lỗi

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Lỗi trả về cho guest là dữ liệu thuần. Các instance `Error` của host, đối tượng stack,
prototype và hàm host không đi vào QuickJS.

## Telemetry

Code mode báo cáo:

- tên công cụ hiển thị được gửi tới model
- kích thước catalog ẩn và phân tách theo nguồn
- số lượng `exec` và `wait`
- số lượng search, describe và call lồng nhau
- id công cụ lồng nhau đã gọi
- lỗi timeout, bộ nhớ, snapshot và giới hạn đầu ra
- sự kiện vòng đời snapshot

Telemetry không được bao gồm secrets, giá trị môi trường thô hoặc đầu vào công cụ chưa redact
vượt ngoài chính sách trajectory hiện có của OpenClaw.

## Gỡ lỗi

Dùng logging truyền tải model có mục tiêu khi code mode hoạt động khác với một
lần chạy công cụ bình thường:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Để gỡ lỗi hình dạng payload, dùng `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Điều này ghi log một snapshot JSON bị redact, có giới hạn của yêu cầu model; chỉ nên
dùng trong khi gỡ lỗi vì prompt và văn bản tin nhắn vẫn có thể xuất hiện.

Để gỡ lỗi stream, dùng `OPENCLAW_DEBUG_SSE=peek` để ghi log năm sự kiện SSE đầu tiên
đã redact. Code mode cũng fail closed nếu payload provider cuối cùng
không chứa đúng `exec` và `wait` sau khi bề mặt code-mode đã
kích hoạt.

## Bố cục triển khai

Các đơn vị triển khai:

- hợp đồng cấu hình: `tools.codeMode`
- trình dựng catalog: công cụ hiệu lực thành mục nhỏ gọn và map id
- adapter bề mặt model: thay thế công cụ hiển thị bằng `exec` và `wait`
- adapter runtime QuickJS-WASI: load, eval, snapshot, restore, dispose
- supervisor worker: timeout, abort, cô lập crash
- adapter cầu nối: callback host an toàn với JSON và phân phối kết quả
- adapter biến đổi TypeScript
- kho snapshot: TTL, giới hạn kích thước, phạm vi lần chạy/phiên
- phép chiếu trajectory cho lệnh gọi công cụ lồng nhau
- bộ đếm telemetry và diagnostics

Triển khai tái sử dụng các khái niệm catalog và executor từ Tool Search, nhưng
không dùng child `node:vm` làm sandbox.

## Danh sách kiểm chứng

Phạm vi code mode nên chứng minh:

- cấu hình bị tắt giữ nguyên việc hiển thị công cụ hiện có
- cấu hình dạng đối tượng không có `enabled: true` giữ chế độ code ở trạng thái tắt
- cấu hình được bật chỉ hiển thị `exec` và `wait` cho mô hình khi các công cụ đang
  hoạt động cho lần chạy
- các lần chạy thô không dùng công cụ, `disableTools`, và danh sách cho phép rỗng không kích hoạt
  việc thực thi payload chế độ code
- tất cả công cụ không phải MCP có hiệu lực đều xuất hiện trong `ALL_TOOLS`
- các công cụ bị từ chối không xuất hiện trong `ALL_TOOLS`
- `tools.search`, `tools.describe`, và `tools.call` hoạt động với các công cụ OpenClaw
- `API.list("mcp")` và `API.read("mcp/<server>.d.ts")` hiển thị các khai báo MCP kiểu TypeScript
  mà không cần bridge/lệnh gọi công cụ
- không gian tên MCP `$api()` vẫn khả dụng như một phương án dự phòng nội tuyến cho schema
- các lệnh gọi không gian tên MCP hoạt động với công cụ MCP hiển thị có một đầu vào đối tượng, trong khi
  các mục danh mục MCP trực tiếp không có trong `tools.*`
- các công cụ điều khiển Tìm kiếm công cụ bị ẩn khỏi cả bề mặt mô hình và danh mục
  ẩn
- các lệnh gọi lồng nhau giữ nguyên hành vi phê duyệt và hook
- shell `exec` bị ẩn khỏi mô hình nhưng có thể gọi bằng id danh mục khi được cho phép
- `exec` và `wait` chế độ code đệ quy không thể được gọi từ code khách
- đầu vào TypeScript được chuyển đổi và đánh giá mà không tải TypeScript trên
  các đường dẫn bị tắt hoặc chỉ dùng JavaScript
- `import`, `require`, quyền truy cập hệ thống tệp, mạng và môi trường đều thất bại
- vòng lặp vô hạn hết thời gian chờ và không thể chặn Gateway
- lỗi giới hạn bộ nhớ sẽ chấm dứt VM khách
- giới hạn đầu ra và snapshot được thực thi cho các lệnh gọi đã hoàn tất và bị tạm dừng
- `wait` tiếp tục một snapshot bị tạm dừng và trả về giá trị cuối cùng
- các giá trị `runId` hết hạn, bị hủy, sai phiên và không xác định đều thất bại
- phát lại transcript và lưu bền vững giữ nguyên các lệnh gọi điều khiển chế độ code
- transcript và telemetry hiển thị rõ ràng các lệnh gọi công cụ lồng nhau

## Kế hoạch kiểm thử E2E

Chạy các kiểm thử này dưới dạng kiểm thử tích hợp hoặc đầu cuối khi thay đổi runtime:

1. Khởi động Gateway với `tools.codeMode.enabled: false`.
2. Gửi một lượt agent với một tập công cụ trực tiếp nhỏ.
3. Xác nhận các công cụ hiển thị với mô hình không thay đổi.
4. Khởi động lại với `tools.codeMode.enabled: true`.
5. Gửi một lượt agent với các công cụ kiểm thử OpenClaw, Plugin, MCP và client.
6. Xác nhận danh sách công cụ hiển thị với mô hình chính xác là `exec`, `wait`.
7. Trong `exec`, đọc `ALL_TOOLS` và xác nhận các công cụ kiểm thử có hiệu lực có mặt.
8. Trong `exec`, gọi các công cụ OpenClaw/Plugin/client thông qua `tools.search`,
   `tools.describe`, và `tools.call`.
9. Trong `exec`, gọi `API.list("mcp")` và `API.read("mcp/<server>.d.ts")` và
   xác nhận các tệp khai báo mô tả các công cụ MCP hiển thị.
10. Trong `exec`, gọi các công cụ MCP thông qua `MCP.<server>.<tool>({ ...input })` và
    xác nhận các mục danh mục MCP trực tiếp không có trong `ALL_TOOLS` và `tools.*`.
11. Xác nhận các công cụ bị từ chối không có mặt và không thể được gọi bằng id đoán trước.
12. Bắt đầu một lệnh gọi công cụ lồng nhau phân giải sau khi `exec` trả về `waiting`.
13. Gọi `wait` và xác nhận VM đã khôi phục nhận được kết quả công cụ.
14. Xác nhận câu trả lời cuối cùng chứa đầu ra được tạo sau khi khôi phục.
15. Xác nhận hết thời gian chờ, hủy bỏ và hết hạn snapshot dọn dẹp trạng thái runtime.
16. Xuất trajectory và xác nhận các lệnh gọi lồng nhau hiển thị dưới lệnh gọi
    chế độ code cha.

Các thay đổi chỉ liên quan đến tài liệu trên trang này vẫn nên chạy `pnpm check:docs`.

## Liên quan

- [Tìm kiếm công cụ](/vi/tools/tool-search)
- [Runtime agent](/vi/concepts/agent-runtimes)
- [Công cụ Exec](/vi/tools/exec)
- [Thực thi code](/vi/tools/code-execution)
