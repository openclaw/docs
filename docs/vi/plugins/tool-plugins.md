---
read_when:
    - Bạn muốn xây dựng một plugin OpenClaw đơn giản chỉ bổ sung các công cụ cho tác nhân
    - Bạn muốn sử dụng defineToolPlugin thay vì tự viết thủ công siêu dữ liệu manifest của Plugin
    - Bạn cần tạo khung, sinh mã, xác thực, kiểm thử hoặc phát hành một plugin chỉ dành cho công cụ
sidebarTitle: Tool Plugins
summary: Xây dựng các công cụ agent có kiểu đơn giản bằng defineToolPlugin và openclaw plugins init/build/validate
title: Plugin công cụ
x-i18n:
    generated_at: "2026-07-19T06:17:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6363ccc810e969e1efa2aa0b4208f27244f01db196713fc2dc25cf106b86429
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` xây dựng một plugin chỉ bổ sung các công cụ mà tác tử có thể gọi: không có
kênh, nhà cung cấp mô hình, hook, dịch vụ hoặc backend thiết lập. Nó tạo siêu dữ liệu
manifest mà OpenClaw cần để khám phá các công cụ mà không tải mã runtime của
plugin.

Đối với các plugin nhà cung cấp, kênh, hook, dịch vụ hoặc plugin có nhiều khả năng kết hợp, hãy bắt đầu với
[Xây dựng plugin](/vi/plugins/building-plugins), [Plugin kênh](/vi/plugins/sdk-channel-plugins),
hoặc [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Yêu cầu

- Node 22.22.3+, Node 24.15+ hoặc Node 25.9+.
- Đầu ra gói TypeScript ESM.
- `typebox` trong `dependencies` (không chỉ `devDependencies` — plugin được tạo
  sẽ nhập gói này trong runtime).
- `openclaw >=2026.5.17`, phiên bản đầu tiên xuất
  `openclaw/plugin-sdk/tool-plugin`.
- Một thư mục gốc của gói phân phối `dist/`, `openclaw.plugin.json` và
  `package.json`.

## Bắt đầu nhanh

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` tạo khung:

| Tệp                    | Mục đích                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Điểm vào `defineToolPlugin` với một công cụ `echo`                     |
| `src/index.test.ts`    | Kiểm thử siêu dữ liệu xác nhận danh sách công cụ                             |
| `tsconfig.json`        | Đầu ra TypeScript NodeNext vào `dist/`                             |
| `vitest.config.ts`     | Cấu hình Vitest cho `src/**/*.test.ts`                              |
| `package.json`         | Script, phần phụ thuộc runtime, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Siêu dữ liệu manifest được tạo cho công cụ ban đầu                  |

`npm run plugin:build` chạy `npm run build` (tsc), sau đó chạy
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
xây dựng lại và chạy `openclaw plugins validate --entry ./dist/index.js`.
Khi xác thực thành công, kết quả sau được in ra:

```text
Plugin stock-quotes is valid.
```

Các tùy chọn của `openclaw plugins init <id>`:

| Cờ                   | Mặc định            | Tác dụng                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Thư mục đầu ra                       |
| `--name <name>`      | `<id>` viết hoa kiểu tiêu đề | Tên hiển thị                           |
| `--type <type>`      | `tool`             | Loại khung: `tool` hoặc `provider`    |
| `--force`            | tắt                | Ghi đè một thư mục đầu ra hiện có |

## Viết một công cụ

`defineToolPlugin` nhận danh tính plugin, một schema cấu hình tùy chọn và một
danh sách công cụ tĩnh. Kiểu tham số và cấu hình được suy ra từ các
schema TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Tên công cụ là API ổn định. Hãy chọn tên duy nhất, viết thường và
đủ cụ thể để tránh xung đột với các công cụ lõi hoặc plugin khác.

## Công cụ tùy chọn và công cụ factory

Đặt `optional: true` khi người dùng cần đưa công cụ vào danh sách cho phép một cách rõ ràng trước khi
gửi công cụ đó đến mô hình. `openclaw plugins build` ghi mục manifest
`toolMetadata.<tool>.optional` tương ứng để OpenClaw có thể nhận biết rằng
công cụ này là tùy chọn mà không tải mã runtime của plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Sử dụng `factory` khi một công cụ cần ngữ cảnh công cụ runtime trước khi có thể được
tạo — để loại công cụ khỏi một lượt chạy cụ thể, kiểm tra trạng thái sandbox hoặc liên kết
các trình trợ giúp runtime. Siêu dữ liệu vẫn ở dạng tĩnh dù công cụ cụ thể được xây dựng
trong runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Các factory vẫn khai báo trước một tên công cụ cố định. Sử dụng trực tiếp `definePluginEntry`
khi plugin tính toán tên công cụ một cách động hoặc kết hợp công cụ
với hook, dịch vụ, nhà cung cấp hoặc lệnh.

## Giá trị trả về

`defineToolPlugin` đóng gói các giá trị trả về thuần túy theo định dạng kết quả công cụ
của OpenClaw:

- Trả về một chuỗi khi mô hình cần thấy chính xác văn bản đó.
- Trả về một giá trị tương thích với JSON khi bạn muốn mô hình thấy JSON đã định dạng
  và OpenClaw giữ giá trị gốc trong `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Sử dụng công cụ factory khi bạn cần một `AgentToolResult` tùy chỉnh hoặc muốn tái sử dụng một
triển khai `api.registerTool` hiện có.

## Hợp đồng đầu ra

Thêm `outputSchema` khi một công cụ trả về dữ liệu tương thích với JSON và ổn định. Schema này mô tả
giá trị gốc được lưu trong `AgentToolResult.details`, không phải văn bản đã định dạng
trong `content`:

```typescript
tool({
  name: "shipment_list",
  description: "List shipments.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[Chế độ mã](/tools/code-mode) và [Tìm kiếm công cụ](/vi/tools/tool-search) chuyển
schema này thành một gợi ý đầu ra kiểu TypeScript có giới hạn. Nhờ đó, mô hình có thể gọi và
biến đổi một kết quả đã biết trong một chương trình thay vì dùng thêm một lượt mô hình
để quan sát cấu trúc của kết quả.

OpenClaw biên dịch schema trước khi thực thi một lệnh gọi danh mục, sau đó xác thực
giá trị `details` cuối cùng sau các hook công cụ trước khi trả về qua cầu nối.
Schema không hợp lệ khiến công cụ không thể chạy; kết quả không khớp khiến lệnh gọi đã hoàn tất
thất bại. Hãy bao gồm mọi biến thể kết quả không ném lỗi, kể cả các biến thể lỗi
có cấu trúc, hoặc bỏ qua schema khi kết quả không ổn định. Không đưa thông tin bí mật
hoặc giá trị nhạy cảm vào phần mô tả schema vì siêu dữ liệu đầu ra đáng tin cậy có thể
hiển thị cho mô hình.
Sử dụng `{ additionalProperties: false }` trên các lớp đối tượng khi bạn muốn một
gợi ý đầu ra nhỏ gọn và đầy đủ; các schema mở hoặc bị cắt bớt vẫn khả dụng thông qua
`tools.describe(...)` nhưng không được quảng bá là hợp đồng chỉ mục nhanh đầy đủ.

Các công cụ factory khai báo `outputSchema` trên `AnyAgentTool` cụ thể mà chúng
trả về. Khai báo `tool({ factory })` tĩnh không chấp nhận một
schema đầu ra riêng vì schema đó có thể lệch khỏi công cụ runtime.

## Cấu hình

`configSchema` là tùy chọn. Nếu bỏ qua, OpenClaw áp dụng một schema đối tượng rỗng nghiêm ngặt;
manifest được tạo vẫn bao gồm `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Với một `configSchema`, đối số `execute` thứ hai được định kiểu từ schema đó:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw đọc cấu hình plugin từ mục của plugin trong cấu hình Gateway. Không
mã hóa cứng thông tin bí mật trong mã nguồn hoặc ví dụ tài liệu; hãy sử dụng cấu hình, biến
môi trường hoặc SecretRefs theo mô hình bảo mật của plugin.

## Siêu dữ liệu được tạo

OpenClaw phải đọc manifest plugin trước khi nhập mã runtime của plugin.
`defineToolPlugin` cung cấp siêu dữ liệu tĩnh cho mục đích này và
`openclaw plugins build` ghi siêu dữ liệu đó vào gói. Chạy lại trình tạo sau khi
thay đổi id, tên, mô tả, schema cấu hình, điều kiện kích hoạt hoặc tên công cụ
của plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifest được tạo cho plugin có một công cụ:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` là hợp đồng khám phá quan trọng: nó cho OpenClaw biết plugin nào
sở hữu từng công cụ mà không cần tải runtime của mọi plugin đã cài đặt. Một
manifest lỗi thời có thể khiến công cụ không xuất hiện trong quá trình khám phá hoặc khiến lỗi đăng ký
bị quy cho sai plugin.

## Siêu dữ liệu gói

`openclaw plugins build` cũng căn chỉnh `package.json` theo điểm vào runtime
đã chọn:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Phân phối JavaScript đã xây dựng (`./dist/index.js`), không phải điểm vào mã nguồn TypeScript.
Điểm vào mã nguồn chỉ hoạt động khi phát triển cục bộ trong workspace.

## Xác thực trong CI

`plugins build --check` sẽ thất bại mà không ghi lại tệp khi siêu dữ liệu được tạo
đã lỗi thời:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` kiểm tra rằng:

- `openclaw.plugin.json` tồn tại và vượt qua trình tải manifest thông thường.
- Điểm vào hiện tại xuất siêu dữ liệu `defineToolPlugin`.
- Các trường manifest được tạo khớp với siêu dữ liệu của điểm vào.
- `contracts.tools` khớp với các tên công cụ đã khai báo.
- `package.json` trỏ `openclaw.extensions` đến điểm vào runtime đã chọn.

## Cài đặt và kiểm tra cục bộ

Từ một checkout OpenClaw riêng hoặc CLI đã cài đặt, hãy cài đặt đường dẫn gói:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Để kiểm thử nhanh gói đã đóng gói, trước tiên hãy đóng gói rồi cài đặt tệp tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Sau khi cài đặt, hãy khởi động lại hoặc tải lại Gateway và yêu cầu agent sử dụng
công cụ. Nếu công cụ không hiển thị, hãy kiểm tra runtime của plugin và danh mục
công cụ có hiệu lực trước khi thay đổi mã (xem [Khắc phục sự cố](#troubleshooting)).

## Phát hành

Phát hành qua ClawHub sau khi gói đã sẵn sàng. `clawhub package publish`
nhận một nguồn: thư mục cục bộ, kho lưu trữ GitHub (`owner/repo[@ref]`) hoặc
URL tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Cài đặt bằng bộ định vị ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Các thông số gói npm thuần vẫn được cài đặt từ npm trong giai đoạn chuyển đổi ra mắt, nhưng
ClawHub là bề mặt khám phá và phân phối ưu tiên dành cho các plugin
OpenClaw. Xem [Phát hành trên ClawHub](/vi/clawhub/publishing) để biết phạm vi chủ sở hữu và
quy trình review bản phát hành.

## Khắc phục sự cố

### `plugin entry not found: ./dist/index.js`

Tệp mục nhập đã chọn không tồn tại. Chạy `npm run build`, sau đó chạy lại
`openclaw plugins build --entry ./dist/index.js` hoặc
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Mục nhập không xuất giá trị được tạo bởi `defineToolPlugin`. Hãy xác nhận rằng
phần xuất mặc định của mô-đun là kết quả `defineToolPlugin(...)`, hoặc truyền
mục nhập chính xác bằng `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Tệp kê khai không còn khớp với siêu dữ liệu mục nhập. Chạy:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit cả thay đổi `openclaw.plugin.json` và `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Siêu dữ liệu gói trỏ đến một mục nhập runtime khác. Chạy
`openclaw plugins build --entry ./dist/index.js` để trình tạo căn chỉnh
siêu dữ liệu gói với mục nhập bạn định phát hành.

### `Cannot find package 'typebox'`

Plugin đã xây dựng nhập `typebox` trong thời gian chạy. Giữ nó trong `dependencies`,
cài đặt lại, xây dựng lại và chạy lại quy trình xác thực.

### Công cụ không xuất hiện sau khi cài đặt

Kiểm tra các mục sau theo thứ tự:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` có `contracts.tools` với tên công cụ như dự kiến.
4. `package.json` có `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway đã được khởi động lại hoặc tải lại sau khi cài đặt plugin.

## Xem thêm

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Điểm mục nhập Plugin](/vi/plugins/sdk-entrypoints)
- [Đường dẫn con của Plugin SDK](/vi/plugins/sdk-subpaths)
- [Tệp kê khai Plugin](/vi/plugins/manifest)
- [CLI plugin](/vi/cli/plugins)
- [Phát hành trên ClawHub](/vi/clawhub/publishing)
