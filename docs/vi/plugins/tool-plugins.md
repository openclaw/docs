---
read_when:
    - Bạn muốn xây dựng một plugin OpenClaw đơn giản chỉ bổ sung các công cụ cho tác nhân
    - Bạn muốn sử dụng defineToolPlugin thay vì tự viết siêu dữ liệu manifest của Plugin
    - Bạn cần tạo khung, sinh mã, xác thực, kiểm thử hoặc phát hành một Plugin chỉ cung cấp công cụ
sidebarTitle: Tool Plugins
summary: Xây dựng các công cụ agent có kiểu đơn giản bằng defineToolPlugin và openclaw plugins init/build/validate
title: Plugin công cụ
x-i18n:
    generated_at: "2026-07-16T15:43:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` xây dựng một plugin chỉ thêm các công cụ mà tác nhân có thể gọi: không có
kênh, nhà cung cấp mô hình, hook, dịch vụ hoặc backend thiết lập. Lệnh này tạo
siêu dữ liệu manifest mà OpenClaw cần để khám phá các công cụ mà không cần tải
mã runtime của plugin.

Đối với các plugin nhà cung cấp, kênh, hook, dịch vụ hoặc plugin có nhiều khả năng, hãy bắt đầu bằng
[Xây dựng plugin](/vi/plugins/building-plugins), [Plugin kênh](/vi/plugins/sdk-channel-plugins),
hoặc [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Yêu cầu

- Node 22.22.3+, Node 24.15+ hoặc Node 25.9+.
- Đầu ra gói TypeScript ESM.
- `typebox` trong `dependencies` (không chỉ `devDependencies` - plugin được tạo
  sẽ nhập gói này khi chạy).
- `openclaw >=2026.5.17`, phiên bản đầu tiên xuất
  `openclaw/plugin-sdk/tool-plugin`.
- Thư mục gốc của gói cung cấp `dist/`, `openclaw.plugin.json` và
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
| `src/index.test.ts`    | Kiểm thử siêu dữ liệu để xác nhận danh sách công cụ                             |
| `tsconfig.json`        | Đầu ra TypeScript NodeNext vào `dist/`                             |
| `vitest.config.ts`     | Cấu hình Vitest cho `src/**/*.test.ts`                              |
| `package.json`         | Tập lệnh, phần phụ thuộc runtime, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Siêu dữ liệu manifest được tạo cho công cụ ban đầu                  |

`npm run plugin:build` chạy `npm run build` (tsc), sau đó chạy
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
xây dựng lại và chạy `openclaw plugins validate --entry ./dist/index.js`.
Khi xác thực thành công, kết quả hiển thị:

```text
Plugin stock-quotes hợp lệ.
```

Các tùy chọn của `openclaw plugins init <id>`:

| Cờ                   | Mặc định           | Tác dụng                               |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Thư mục đầu ra                       |
| `--name <name>`      | `<id>` viết hoa kiểu tiêu đề | Tên hiển thị                           |
| `--type <type>`      | `tool`             | Loại khung: `tool` hoặc `provider`    |
| `--force`            | tắt                | Ghi đè thư mục đầu ra hiện có |

## Viết một công cụ

`defineToolPlugin` nhận danh tính plugin, một lược đồ cấu hình tùy chọn và một
danh sách công cụ tĩnh. Các kiểu tham số và cấu hình được suy luận từ
lược đồ TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Lấy ảnh chụp nhanh báo giá cổ phiếu.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Khóa API báo giá." })),
    baseUrl: Type.Optional(Type.String({ description: "URL cơ sở của API báo giá." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Báo giá cổ phiếu",
      description: "Lấy ảnh chụp nhanh báo giá cổ phiếu.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Mã chứng khoán, ví dụ OPEN." }),
      }),
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

Đặt `optional: true` khi người dùng cần thêm công cụ vào danh sách cho phép một cách rõ ràng trước khi
công cụ được gửi đến mô hình. `openclaw plugins build` ghi mục manifest
`toolMetadata.<tool>.optional` tương ứng để OpenClaw có thể nhận biết
công cụ là tùy chọn mà không cần tải mã runtime của plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Chạy một quy trình làm việc bên ngoài.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Sử dụng `factory` khi một công cụ cần ngữ cảnh công cụ runtime trước khi có thể được
tạo — để loại trừ công cụ khỏi một lần chạy cụ thể, kiểm tra trạng thái sandbox hoặc liên kết
các trình trợ giúp runtime. Siêu dữ liệu vẫn ở dạng tĩnh dù công cụ cụ thể được tạo
trong runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Chạy một quy trình làm việc cục bộ bên ngoài các phiên được sandbox.",
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
khi plugin tính toán tên công cụ động hoặc kết hợp công cụ
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
  description: "Lặp lại văn bản đầu vào.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Lặp lại đầu vào dưới dạng JSON có cấu trúc.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Sử dụng công cụ factory khi bạn cần một `AgentToolResult` tùy chỉnh hoặc muốn tái sử dụng
một triển khai `api.registerTool` hiện có.

## Cấu hình

`configSchema` là tùy chọn. Nếu bỏ qua, OpenClaw áp dụng một lược đồ đối tượng rỗng
nghiêm ngặt; manifest được tạo vẫn bao gồm `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Thêm các công cụ không cần cấu hình.",
  tools: () => [],
});
```

Với `configSchema`, đối số `execute` thứ hai được định kiểu từ đó:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Thêm các công cụ đã cấu hình.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Kiểm tra cấu hình có sẵn hay không.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw đọc cấu hình plugin từ mục của plugin trong cấu hình Gateway. Không
mã hóa cứng bí mật trong mã nguồn hoặc ví dụ tài liệu; hãy sử dụng cấu hình, biến
môi trường hoặc SecretRefs theo mô hình bảo mật của plugin.

## Siêu dữ liệu được tạo

OpenClaw phải đọc manifest plugin trước khi nhập mã runtime của plugin.
`defineToolPlugin` cung cấp siêu dữ liệu tĩnh cho việc này và
`openclaw plugins build` ghi siêu dữ liệu đó vào gói. Chạy lại trình tạo sau khi
thay đổi id, tên, mô tả, lược đồ cấu hình, chế độ kích hoạt hoặc tên
công cụ của plugin:

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
manifest lỗi thời có thể khiến công cụ biến mất khỏi quá trình khám phá hoặc lỗi đăng ký
bị quy cho nhầm plugin.

## Siêu dữ liệu gói

`openclaw plugins build` cũng căn chỉnh `package.json` với điểm vào runtime
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

`plugins build --check` thất bại mà không ghi lại tệp khi siêu dữ liệu được tạo
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

Để kiểm thử nhanh gói đã đóng gói, trước tiên hãy đóng gói rồi cài đặt tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Sau khi cài đặt, hãy khởi động lại hoặc tải lại Gateway và yêu cầu tác nhân sử dụng
công cụ. Nếu công cụ không hiển thị, hãy kiểm tra runtime của plugin và danh mục
công cụ hiệu lực trước khi thay đổi mã (xem [Khắc phục sự cố](#troubleshooting)).

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

Các thông số gói npm thuần vẫn được cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt, nhưng
ClawHub là bề mặt khám phá và phân phối được ưu tiên cho các plugin
OpenClaw. Xem [Phát hành trên ClawHub](/vi/clawhub/publishing) để biết phạm vi chủ sở hữu và
quy trình đánh giá bản phát hành.

## Khắc phục sự cố

### `plugin entry not found: ./dist/index.js`

Tệp điểm vào đã chọn không tồn tại. Chạy `npm run build`, sau đó chạy lại
`openclaw plugins build --entry ./dist/index.js` hoặc
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Điểm vào không xuất một giá trị được tạo bởi `defineToolPlugin`. Xác nhận rằng
giá trị xuất mặc định của mô-đun là kết quả `defineToolPlugin(...)`, hoặc truyền
điểm vào chính xác bằng `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest không còn khớp với siêu dữ liệu của điểm vào. Chạy:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit các thay đổi của cả `openclaw.plugin.json` và `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Siêu dữ liệu gói trỏ đến một điểm vào runtime khác. Chạy
`openclaw plugins build --entry ./dist/index.js` để trình tạo căn chỉnh
siêu dữ liệu gói với điểm vào bạn định phân phối.

### `Cannot find package 'typebox'`

Plugin đã xây dựng nhập `typebox` trong runtime. Giữ nó trong `dependencies`,
cài đặt lại, xây dựng lại và chạy lại quy trình xác thực.

### Công cụ không xuất hiện sau khi cài đặt

Kiểm tra theo thứ tự sau:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` có `contracts.tools` với tên công cụ như mong đợi.
4. `package.json` có `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway đã được khởi động lại hoặc tải lại sau khi cài đặt plugin.

## Xem thêm

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Điểm vào của plugin](/vi/plugins/sdk-entrypoints)
- [Đường dẫn con của Plugin SDK](/vi/plugins/sdk-subpaths)
- [Tệp kê khai plugin](/vi/plugins/manifest)
- [CLI plugin](/vi/cli/plugins)
- [Xuất bản trên ClawHub](/vi/clawhub/publishing)
