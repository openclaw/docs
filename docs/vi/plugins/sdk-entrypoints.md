---
read_when:
    - Bạn cần chữ ký kiểu chính xác của defineToolPlugin, definePluginEntry hoặc defineChannelPluginEntry
    - Bạn muốn tìm hiểu chế độ đăng ký (đầy đủ so với thiết lập so với siêu dữ liệu CLI)
    - Bạn đang tra cứu các tùy chọn điểm vào
sidebarTitle: Entry Points
summary: Tham chiếu cho defineToolPlugin, definePluginEntry, defineChannelPluginEntry và defineSetupPluginEntry
title: Các điểm vào Plugin
x-i18n:
    generated_at: "2026-07-19T06:16:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Mỗi plugin xuất một đối tượng điểm vào mặc định. SDK cung cấp một hàm trợ giúp cho
từng dạng điểm vào: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Bạn đang tìm hướng dẫn chi tiết?** Xem [Plugin công cụ](/vi/plugins/tool-plugins),
  [Plugin kênh](/vi/plugins/sdk-channel-plugins), hoặc
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) để biết hướng dẫn từng bước.
</Tip>

## Điểm vào gói

Các plugin đã cài đặt trỏ các trường `package.json` `openclaw` đến cả điểm vào nguồn và
điểm vào đã dựng:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` và `setupEntry` là các điểm vào nguồn, được dùng để phát triển trong workspace và
  bản checkout git.
- `runtimeExtensions` và `runtimeSetupEntry` được ưu tiên cho các gói đã
  cài đặt: chúng cho phép các gói npm bỏ qua việc biên dịch TypeScript trong thời gian chạy.
- `runtimeExtensions`, khi có, phải khớp với `extensions` về độ dài mảng
  (các điểm vào được ghép đôi theo vị trí). `runtimeSetupEntry` yêu cầu `setupEntry`.
- Nếu một tạo phẩm `runtimeExtensions`/`runtimeSetupEntry` được khai báo nhưng
  bị thiếu, quá trình cài đặt/khám phá sẽ thất bại với lỗi đóng gói; OpenClaw không
  âm thầm quay về nguồn. Việc quay về nguồn (bên dưới) chỉ áp dụng khi hoàn toàn
  không có điểm vào thời gian chạy nào được khai báo.
- Nếu một gói đã cài đặt chỉ khai báo điểm vào nguồn TypeScript, OpenClaw
  sẽ tìm bản dựng tương ứng `dist/*.js` (hoặc `.mjs`/`.cjs`) và sử dụng nó;
  nếu không, hệ thống sẽ quay về nguồn TypeScript.
- Tất cả đường dẫn điểm vào phải nằm trong thư mục gói plugin. Các điểm vào
  thời gian chạy và bản dựng JS tương ứng được suy luận không làm cho đường dẫn nguồn `extensions` hoặc
  `setupEntry` thoát ra ngoài trở nên hợp lệ.

## `defineToolPlugin`

**Nhập:** `openclaw/plugin-sdk/tool-plugin`

Dành cho các plugin chỉ thêm công cụ tác tử. Giữ mã nguồn nhỏ gọn, suy luận kiểu cấu hình
và kiểu tham số công cụ từ các schema TypeBox, bọc giá trị trả về thuần túy theo
định dạng kết quả công cụ của OpenClaw, đồng thời cung cấp siêu dữ liệu tĩnh mà
`openclaw plugins build` ghi vào manifest plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` là tùy chọn; nếu bỏ qua, một schema đối tượng rỗng nghiêm ngặt sẽ được dùng
  (manifest được tạo vẫn bao gồm `configSchema`).
- `execute` trả về một chuỗi thuần túy hoặc giá trị có thể tuần tự hóa thành JSON; hàm trợ giúp
  bọc giá trị đó thành kết quả công cụ dạng văn bản với `details` được đặt thành giá trị trả về
  gốc (chưa chuyển thành chuỗi).
- `outputSchema` có thể mô tả giá trị `details` gốc đó cho Chế độ mã
  và Tìm kiếm công cụ. Các lệnh gọi danh mục từ chối schema không hợp lệ trước khi thực thi
  và xác thực giá trị cuối cùng trước khi trả về.
- Đối với kết quả công cụ tùy chỉnh, `openclaw/plugin-sdk/tool-results` xuất
  `textResult` và `jsonResult`.
- Tên công cụ là tĩnh, vì vậy `openclaw plugins build` suy ra
  `contracts.tools` từ các công cụ đã khai báo mà không cần sao chép thủ công tên.
- Quá trình tải thời gian chạy vẫn nghiêm ngặt: các plugin đã cài đặt vẫn cần
  `openclaw.plugin.json` và `package.json` `openclaw.extensions`. OpenClaw
  không bao giờ thực thi mã plugin để suy luận dữ liệu manifest còn thiếu.

## `definePluginEntry`

**Nhập:** `openclaw/plugin-sdk/plugin-entry`

Dành cho plugin nhà cung cấp, plugin công cụ nâng cao, plugin hook và mọi thứ
**không phải** là kênh nhắn tin.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Trường                    | Kiểu                                                             | Bắt buộc | Mặc định            |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | Có       | -                   |
| `name`                    | `string`                                                         | Có       | -                   |
| `description`             | `string`                                                         | Có       | -                   |
| `kind`                    | `string` (không còn được khuyến nghị, xem bên dưới)              | Không    | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Không    | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Không    | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Không    | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Có       | -                   |

- `id` phải khớp với manifest `openclaw.plugin.json` của bạn.
- Danh mục phiên bên ngoài sử dụng
  `openclaw/plugin-sdk/session-catalog` và
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Phần lõi sở hữu các phương thức Gateway `sessions.catalog.*`; nhà cung cấp trả về máy chủ,
  phiên và các phép chiếu bản ghi đã chuẩn hóa mà không đăng ký RPC. Nhà cung cấp
  danh sách nên gọi callback `onHost(host)` tùy chọn khi từng máy chủ
  hoàn tất; mảng máy chủ được trả về vẫn bắt buộc làm ảnh chụp nhanh tương thích
  cuối cùng.
- `kind` không còn được khuyến nghị: thay vào đó, hãy khai báo một khe độc quyền (`"memory"` hoặc
  `"context-engine"`) trong trường `kind` của manifest `openclaw.plugin.json`.
  `kind` của điểm vào thời gian chạy chỉ còn là phương án tương thích dự phòng cho
  các plugin cũ hơn.
- `configSchema` có thể là một hàm để đánh giá lười. OpenClaw phân giải và
  ghi nhớ schema trong lần truy cập đầu tiên, vì vậy các trình dựng schema tốn kém chỉ chạy
  một lần.
- Một bộ mô tả `nodeHostCommands` có thể định nghĩa `isAvailable({ config, env })`.
  Việc trả về `false` sẽ loại bỏ lệnh đó và khả năng tương ứng khỏi khai báo Gateway
  của node không giao diện. OpenClaw đánh giá nó dựa trên cấu hình khởi động cục bộ
  của node; các trình xử lý lệnh vẫn nên xác thực tính khả dụng khi
  được gọi.

## `defineChannelPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Bọc `definePluginEntry` bằng cơ chế nối dây dành riêng cho kênh: tự động
gọi `api.registerChannel({ plugin })`, cung cấp một điểm nối siêu dữ liệu CLI trợ giúp gốc
tùy chọn và giới hạn `registerFull` theo chế độ đăng ký.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Trường                | Kiểu                                                             | Bắt buộc | Mặc định            |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Có       | -                   |
| `name`                | `string`                                                         | Có       | -                   |
| `description`         | `string`                                                         | Có       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Có       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Không    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |

Các callback chạy theo từng chế độ đăng ký (bảng đầy đủ tại
[Chế độ đăng ký](#registration-mode)):

- `setRuntime` chạy trong mọi chế độ ngoại trừ `"cli-metadata"` và
  `"tool-discovery"`. Lưu tham chiếu thời gian chạy tại đây, thường thông qua
  `createPluginRuntimeStore`.
- `registerCliMetadata` chạy cho `"cli-metadata"`, `"discovery"` và
  `"full"`. Sử dụng nó làm vị trí chuẩn cho các bộ mô tả CLI thuộc sở hữu của kênh
  để phần trợ giúp gốc không kích hoạt hệ thống, ảnh chụp nhanh khám phá bao gồm siêu dữ liệu
  lệnh tĩnh và việc đăng ký CLI thông thường vẫn tương thích với quá trình tải đầy đủ
  plugin.
- `registerFull` chỉ chạy cho `"full"` và `"tool-discovery"`. Đối với
  `"tool-discovery"`, nó chạy _thay cho_ việc đăng ký kênh: OpenClaw
  hoàn toàn bỏ qua `registerChannel`/`setRuntime` và chỉ gọi
  `registerFull`, vì vậy mọi đăng ký nhà cung cấp/công cụ mà kênh của bạn cần để
  khám phá hoặc thực thi công cụ độc lập phải nằm ở đó, không phải phía sau phần thiết lập
  kênh thông thường.
- Đăng ký khám phá không kích hoạt hệ thống, nhưng không có nghĩa là không nhập mô-đun: OpenClaw có thể
  đánh giá điểm vào plugin đáng tin cậy và mô-đun plugin kênh để xây dựng
  ảnh chụp nhanh. Giữ các lệnh nhập cấp cao nhất không có hiệu ứng phụ và đặt socket,
  client, worker cùng dịch vụ phía sau các đường dẫn chỉ dành cho `"full"`.
- Giống như `definePluginEntry`, `configSchema` có thể là một hàm tạo lười; OpenClaw
  ghi nhớ schema đã phân giải trong lần truy cập đầu tiên.

Đăng ký CLI:

- Dùng `api.registerCli(..., { descriptors: [...] })` cho các lệnh CLI gốc do plugin sở hữu
  mà bạn muốn tải lười nhưng không biến mất khỏi cây phân tích cú pháp của CLI
  gốc. Tên bộ mô tả phải chỉ gồm chữ cái, chữ số, dấu gạch nối và
  dấu gạch dưới, bắt đầu bằng chữ cái hoặc chữ số; OpenClaw từ chối các
  dạng khác và loại bỏ chuỗi điều khiển đầu cuối khỏi phần mô tả trước khi
  hiển thị trợ giúp. Bao phủ mọi gốc lệnh cấp cao nhất mà trình đăng ký cung cấp.
  Chỉ riêng `commands` vẫn nằm trên đường dẫn tương thích tải sớm.
- Dùng `api.registerNodeCliFeature(...)` cho các lệnh tính năng của Node đã ghép cặp để
  chúng nằm dưới `openclaw nodes` (tương đương với
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Đối với các lệnh plugin lồng nhau khác, hãy thêm `parentPath` và đăng ký lệnh
  trên đối tượng `program` được truyền vào trình đăng ký; OpenClaw phân giải đối tượng đó thành
  lệnh cha trước khi gọi plugin.
- Đối với plugin kênh, hãy đăng ký các bộ mô tả CLI từ `registerCliMetadata`
  và giữ `registerFull` tập trung vào công việc chỉ dành cho runtime.
- Nếu `registerFull` cũng đăng ký các phương thức RPC của Gateway, hãy đặt chúng dưới
  một tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi được dành riêng (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) luôn bị ép thành
  `operator.admin`.

## `defineSetupPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Dành cho tệp `setup-entry.ts` nhẹ. Chỉ trả về `{ plugin }` mà không
kết nối runtime hoặc CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw tải mục nhập này thay cho mục nhập đầy đủ khi một kênh bị vô hiệu hóa,
chưa được cấu hình hoặc khi tải trì hoãn được bật. Xem
[Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết khi nào điều này quan trọng.

Kết hợp `defineSetupPluginEntry(...)` với các nhóm trình trợ giúp thiết lập phạm vi hẹp:

| Nhập                                | Dùng cho                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Các trình trợ giúp thiết lập an toàn cho runtime: `createSetupTranslator`, bộ điều hợp bản vá thiết lập an toàn khi nhập, đầu ra ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
| `openclaw/plugin-sdk/channel-setup` | Các bề mặt thiết lập cài đặt tùy chọn                                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Các trình trợ giúp CLI thiết lập/cài đặt, kho lưu trữ và tài liệu                                                                                                                   |

Giữ các SDK nặng, đăng ký CLI và dịch vụ runtime tồn tại lâu dài trong
mục nhập đầy đủ.

Các kênh workspace đi kèm có phân tách bề mặt thiết lập và runtime có thể dùng
`defineBundledChannelSetupEntry(...)` từ
`openclaw/plugin-sdk/channel-entry-contract` để thay thế. Nó cho phép mục nhập thiết lập
giữ lại các phần xuất plugin/bí mật an toàn cho thiết lập trong khi vẫn cung cấp một
hàm thiết lập runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* tuyến an toàn cho thiết lập */
      },
    });
  },
});
```

Chỉ dùng cách này khi luồng thiết lập thực sự cần một hàm thiết lập runtime nhẹ hoặc
bề mặt Gateway an toàn cho thiết lập trước khi mục nhập kênh đầy đủ được tải.
`registerSetupRuntime` chỉ chạy cho các lần tải `"setup-runtime"`; hãy giới hạn nó
ở các tuyến hoặc phương thức chỉ dành cho cấu hình phải tồn tại trước khi
kích hoạt đầy đủ theo cơ chế trì hoãn.

## Chế độ đăng ký

`api.registrationMode` cho plugin biết cách nó được tải:

| Chế độ             | Khi nào                                            | Nội dung cần đăng ký                                                                                                    |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Khởi động Gateway thông thường                     | Mọi thứ                                                                                                                 |
| `"discovery"`      | Khám phá khả năng chỉ đọc                          | Đăng ký kênh cùng các bộ mô tả CLI tĩnh; mã mục nhập có thể tải, nhưng bỏ qua socket, worker, máy khách và dịch vụ |
| `"tool-discovery"` | Tải có phạm vi để liệt kê hoặc chạy công cụ của các plugin cụ thể | Chỉ đăng ký khả năng/công cụ; không kích hoạt kênh                                                                       |
| `"setup-only"`     | Kênh bị vô hiệu hóa/chưa cấu hình                   | Chỉ đăng ký kênh                                                                                                        |
| `"setup-runtime"`  | Luồng thiết lập có runtime khả dụng                 | Đăng ký kênh cùng chỉ phần runtime nhẹ cần thiết trước khi mục nhập đầy đủ được tải                                      |
| `"cli-metadata"`   | Thu thập siêu dữ liệu trợ giúp gốc / CLI            | Chỉ các bộ mô tả CLI                                                                                                    |

`defineChannelPluginEntry` tự động xử lý phần phân tách này. Nếu dùng
`definePluginEntry` trực tiếp cho một kênh, hãy tự kiểm tra chế độ và nhớ rằng
`"tool-discovery"` bỏ qua đăng ký kênh:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Chỉ đăng ký các bề mặt khả năng (nhà cung cấp/công cụ), không đăng ký kênh.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Các đăng ký nặng chỉ dành cho runtime
  api.registerService(/* ... */);
}
```

Các dịch vụ tồn tại lâu dài có thể phát ra các sự kiện vô hiệu hóa hoặc vòng đời nhỏ thông qua
ngữ cảnh dịch vụ của chúng:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw đặt không gian tên cho sự kiện này là `plugin.<plugin-id>.changed`. Tên sự kiện là một
đoạn viết thường, payload phải là JSON có giới hạn và phạm vi phải là
`operator.read`, `operator.write` hoặc `operator.admin`. Bộ phát chỉ tồn tại
trong vòng đời dịch vụ và bị thu hồi sau khi dừng hoặc khởi động thất bại. Nên ưu tiên
payload phiên bản hoặc vô hiệu hóa thay vì bản ghi đầy đủ để các máy khách được ủy quyền đọc lại
trạng thái chuẩn thông qua các phương thức Gateway có phạm vi của plugin.

Chế độ khám phá tạo một ảnh chụp nhanh sổ đăng ký không kích hoạt. Chế độ này vẫn có thể
đánh giá mục nhập plugin và đối tượng plugin kênh để OpenClaw có thể
đăng ký khả năng của kênh và các bộ mô tả CLI tĩnh. Hãy coi việc đánh giá mô-đun
trong chế độ khám phá là đáng tin cậy nhưng nhẹ: không có máy khách mạng,
tiến trình con, trình lắng nghe, kết nối cơ sở dữ liệu, worker nền,
hoạt động đọc thông tin xác thực hoặc các hiệu ứng phụ runtime trực tiếp khác ở cấp cao nhất.

Hãy coi `"setup-runtime"` là khoảng thời gian mà các bề mặt khởi động chỉ dành cho thiết lập phải
tồn tại mà không tái nhập runtime đầy đủ của kênh đi kèm. Các trường hợp phù hợp gồm
đăng ký kênh, tuyến HTTP an toàn cho thiết lập, phương thức Gateway an toàn cho thiết lập
và trình trợ giúp thiết lập được ủy quyền. Các dịch vụ nền nặng, trình đăng ký CLI và
quy trình khởi tạo SDK nhà cung cấp/máy khách vẫn thuộc về `"full"`.

## Các dạng plugin

OpenClaw phân loại các plugin đã tải theo hành vi đăng ký của chúng:

| Dạng                  | Mô tả                                             |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Một loại khả năng (ví dụ: chỉ nhà cung cấp)       |
| **hybrid-capability** | Nhiều loại khả năng (ví dụ: nhà cung cấp + giọng nói) |
| **hook-only**         | Chỉ có hook, không có khả năng                    |
| **non-capability**    | Công cụ/lệnh/dịch vụ nhưng không có khả năng      |

Dùng `openclaw plugins inspect <id>` để xem dạng của plugin.

## Liên quan

- [Tổng quan về SDK](/vi/plugins/sdk-overview) - API đăng ký và tham chiếu đường dẫn con
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime) - `api.runtime` và `createPluginRuntimeStore`
- [Thiết lập và cấu hình](/vi/plugins/sdk-setup) - manifest, mục nhập thiết lập, tải trì hoãn
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng đối tượng `ChannelPlugin`
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - đăng ký nhà cung cấp và hook
