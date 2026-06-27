---
read_when:
    - Bạn cần chữ ký kiểu chính xác của defineToolPlugin, definePluginEntry hoặc defineChannelPluginEntry
    - Bạn muốn hiểu chế độ đăng ký (đầy đủ so với thiết lập so với siêu dữ liệu CLI)
    - Bạn đang tra cứu các tùy chọn điểm vào
sidebarTitle: Entry Points
summary: Tài liệu tham khảo cho defineToolPlugin, definePluginEntry, defineChannelPluginEntry và defineSetupPluginEntry
title: Điểm vào Plugin
x-i18n:
    generated_at: "2026-06-27T17:57:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Mỗi Plugin xuất một đối tượng mục nhập mặc định. SDK cung cấp các helper để
tạo chúng.

Đối với các Plugin đã cài đặt, `package.json` nên trỏ phần tải runtime đến
JavaScript đã build khi có sẵn:

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

`extensions` và `setupEntry` vẫn là các mục nhập nguồn hợp lệ cho workspace và
phát triển bằng git checkout. `runtimeExtensions` và `runtimeSetupEntry` được ưu
tiên khi OpenClaw tải một gói đã cài đặt, đồng thời cho phép các gói npm tránh
biên dịch TypeScript trong runtime. Các mục nhập runtime tường minh là bắt buộc:
`runtimeSetupEntry` yêu cầu `setupEntry`, và các artifact `runtimeExtensions` hoặc
`runtimeSetupEntry` bị thiếu sẽ làm cài đặt/khám phá thất bại thay vì âm thầm
quay về nguồn. Nếu một gói đã cài đặt chỉ khai báo mục nhập nguồn TypeScript,
OpenClaw sẽ dùng một peer `dist/*.js` đã build tương ứng khi có, rồi quay về
nguồn TypeScript.

Tất cả đường dẫn mục nhập phải nằm trong thư mục gói Plugin. Các mục nhập runtime
và peer JavaScript đã build được suy luận không làm cho đường dẫn nguồn
`extensions` hoặc `setupEntry` thoát ra ngoài trở nên hợp lệ.

<Tip>
  **Bạn đang tìm hướng dẫn từng bước?** Xem [Plugin công cụ](/vi/plugins/tool-plugins),
  [Plugin kênh](/vi/plugins/sdk-channel-plugins), hoặc
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) để có hướng dẫn từng bước.
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Dành cho các Plugin đơn giản chỉ thêm công cụ cho agent. `defineToolPlugin` giữ
nguồn tác giả nhỏ gọn, suy luận kiểu cấu hình và tham số công cụ từ schema
TypeBox, bọc các giá trị trả về thuần trong định dạng kết quả công cụ của
OpenClaw, và phơi bày metadata tĩnh mà `openclaw plugins build` ghi vào manifest
Plugin.

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
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` là tùy chọn. Khi bỏ qua, OpenClaw dùng một schema đối tượng rỗng
  nghiêm ngặt và manifest được tạo vẫn bao gồm `configSchema`.
- `execute` trả về một chuỗi thuần hoặc giá trị có thể tuần tự hóa thành JSON.
  Helper bọc nó thành kết quả công cụ dạng văn bản với `details`.
- Tên công cụ là tĩnh. `openclaw plugins build` suy ra `contracts.tools` từ các
  công cụ đã khai báo, nên tác giả không cần tự nhân đôi tên.
- Việc tải runtime vẫn nghiêm ngặt. Các Plugin đã cài đặt vẫn cần
  `openclaw.plugin.json` và `package.json` `openclaw.extensions`; OpenClaw không
  thực thi mã Plugin để suy luận dữ liệu manifest bị thiếu.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dành cho Plugin nhà cung cấp, Plugin công cụ nâng cao, Plugin hook, và mọi thứ
**không phải** là kênh nhắn tin.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Trường         | Kiểu                                                             | Bắt buộc | Mặc định             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Có       | -                   |
| `name`         | `string`                                                         | Có       | -                   |
| `description`  | `string`                                                         | Có       | -                   |
| `kind`         | `string`                                                         | Không    | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Có       | -                   |

- `id` phải khớp với manifest `openclaw.plugin.json` của bạn.
- `kind` dành cho các vị trí độc quyền: `"memory"` hoặc `"context-engine"`.
- `configSchema` có thể là một hàm để đánh giá lười.
- OpenClaw phân giải và ghi nhớ schema đó trong lần truy cập đầu tiên, nên các
  trình tạo schema tốn kém chỉ chạy một lần.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Bọc `definePluginEntry` với phần nối dây dành riêng cho kênh. Tự động gọi
`api.registerChannel({ plugin })`, phơi bày một seam metadata CLI trợ giúp gốc
tùy chọn, và khóa `registerFull` theo chế độ đăng ký.

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

| Trường                | Kiểu                                                             | Bắt buộc | Mặc định             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Có       | -                   |
| `name`                | `string`                                                         | Có       | -                   |
| `description`         | `string`                                                         | Có       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Có       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Không    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |

- `setRuntime` được gọi trong quá trình đăng ký để bạn có thể lưu tham chiếu
  runtime (thường qua `createPluginRuntimeStore`). Nó được bỏ qua trong quá trình
  thu thập metadata CLI.
- `registerCliMetadata` chạy trong `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, và
  `api.registrationMode === "full"`.
  Dùng nó làm nơi chính thức cho các descriptor CLI do kênh sở hữu để trợ giúp
  gốc không kích hoạt Plugin, snapshot khám phá bao gồm metadata lệnh tĩnh, và
  việc đăng ký lệnh CLI thông thường vẫn tương thích với tải Plugin đầy đủ.
- Đăng ký khám phá là không kích hoạt, không phải không import. OpenClaw có thể
  đánh giá mục nhập Plugin đáng tin cậy và module Plugin kênh để xây dựng
  snapshot, vì vậy hãy giữ các import cấp cao nhất không có hiệu ứng phụ và đặt
  socket, client, worker, và service phía sau các đường dẫn chỉ dành cho `"full"`.
- `registerFull` chỉ chạy khi `api.registrationMode === "full"`. Nó được bỏ qua
  trong quá trình tải chỉ dành cho thiết lập.
- Giống `definePluginEntry`, `configSchema` có thể là một factory lười và OpenClaw
  ghi nhớ schema đã phân giải trong lần truy cập đầu tiên.
- Đối với các lệnh CLI gốc do Plugin sở hữu, ưu tiên `api.registerCli(..., { descriptors: [...] })`
  khi bạn muốn lệnh vẫn được tải lười mà không biến mất khỏi cây phân tích CLI
  gốc. Đối với các lệnh tính năng nút theo cặp, ưu tiên
  `api.registerNodeCliFeature(...)` để lệnh nằm dưới `openclaw nodes`.
  Đối với các lệnh Plugin lồng khác, thêm `parentPath` và đăng ký lệnh trên đối
  tượng `program` được truyền cho registrar; OpenClaw phân giải nó tới lệnh cha
  trước khi gọi Plugin. Đối với Plugin kênh, ưu tiên đăng ký các descriptor đó từ
  `registerCliMetadata(...)` và giữ `registerFull(...)` tập trung vào công việc
  chỉ dành cho runtime.
- Nếu `registerFull(...)` cũng đăng ký các phương thức RPC Gateway, hãy giữ chúng
  trên tiền tố riêng của Plugin. Các namespace quản trị lõi được dành riêng
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) luôn bị ép về
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dành cho tệp `setup-entry.ts` nhẹ. Chỉ trả về `{ plugin }` mà không có nối dây
runtime hoặc CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw tải tệp này thay cho mục nhập đầy đủ khi một kênh bị tắt, chưa cấu
hình, hoặc khi bật tải trì hoãn. Xem
[Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết khi nào điều này
quan trọng.

Trong thực tế, hãy ghép `defineSetupPluginEntry(...)` với các họ helper thiết lập
hẹp:

- `openclaw/plugin-sdk/setup-runtime` dành cho các helper thiết lập an toàn với
  runtime như `createSetupTranslator`, adapter vá thiết lập an toàn để import,
  đầu ra ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, và proxy
  thiết lập được ủy quyền
- `openclaw/plugin-sdk/channel-setup` dành cho các bề mặt thiết lập cài đặt tùy chọn
- `openclaw/plugin-sdk/setup-tools` dành cho các helper CLI/kho lưu trữ/tài liệu
  về thiết lập/cài đặt

Giữ các SDK nặng, đăng ký CLI, và service runtime tồn tại lâu trong mục nhập đầy
đủ.

Các kênh workspace được đóng gói tách bề mặt thiết lập và runtime có thể dùng
`defineBundledChannelSetupEntry(...)` từ
`openclaw/plugin-sdk/channel-entry-contract` thay thế. Contract đó cho phép mục
nhập thiết lập giữ các export Plugin/secret an toàn cho thiết lập trong khi vẫn
phơi bày một setter runtime:

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
        /* setup-safe route */
      },
    });
  },
});
```

Chỉ dùng contract đóng gói đó khi các luồng thiết lập thật sự cần một setter
runtime nhẹ hoặc bề mặt Gateway an toàn cho thiết lập trước khi mục nhập kênh đầy
đủ được tải. `registerSetupRuntime` chỉ chạy cho các lần tải `"setup-runtime"`;
giữ nó giới hạn ở các route hoặc phương thức chỉ liên quan đến cấu hình phải tồn
tại trước khi kích hoạt đầy đủ trì hoãn.

## Chế độ đăng ký

`api.registrationMode` cho Plugin của bạn biết nó đã được tải như thế nào:

| Chế độ            | Khi nào                                | Nội dung cần đăng ký                                                                                                                     |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Khởi động Gateway thông thường         | Mọi thứ                                                                                                                                  |
| `"discovery"`     | Khám phá khả năng chỉ đọc              | Đăng ký kênh cộng với các mô tả CLI tĩnh; mã entry có thể tải, nhưng bỏ qua socket, worker, client và dịch vụ                            |
| `"setup-only"`    | Kênh bị tắt/chưa cấu hình              | Chỉ đăng ký kênh                                                                                                                         |
| `"setup-runtime"` | Luồng thiết lập có runtime khả dụng    | Đăng ký kênh cộng với chỉ runtime nhẹ cần thiết trước khi entry đầy đủ tải                                                               |
| `"cli-metadata"`  | Trợ giúp gốc / ghi nhận siêu dữ liệu CLI | Chỉ các mô tả CLI                                                                                                                        |

`defineChannelPluginEntry` tự động xử lý việc tách này. Nếu bạn dùng
`definePluginEntry` trực tiếp cho một kênh, hãy tự kiểm tra chế độ:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Chế độ khám phá xây dựng một ảnh chụp registry không kích hoạt. Nó vẫn có thể đánh giá
entry của Plugin và đối tượng Plugin kênh để OpenClaw có thể đăng ký các khả năng
kênh và các mô tả CLI tĩnh. Hãy xem việc đánh giá mô-đun trong khám phá là
đáng tin cậy nhưng nhẹ: không có client mạng, tiến trình con, listener, kết nối
cơ sở dữ liệu, worker nền, đọc thông tin xác thực, hay tác dụng phụ runtime trực tiếp
nào khác ở cấp cao nhất.

Hãy xem `"setup-runtime"` là khoảng thời gian mà các bề mặt khởi động chỉ dành cho thiết lập phải
tồn tại mà không vào lại runtime kênh đi kèm đầy đủ. Các lựa chọn phù hợp là
đăng ký kênh, route HTTP an toàn cho thiết lập, phương thức Gateway an toàn cho thiết lập, và
trình trợ giúp thiết lập được ủy quyền. Các dịch vụ nền nặng, trình đăng ký CLI, và
khởi tạo SDK nhà cung cấp/client vẫn thuộc về `"full"`.

Riêng với trình đăng ký CLI:

- dùng `descriptors` khi trình đăng ký sở hữu một hoặc nhiều lệnh gốc và bạn
  muốn OpenClaw tải lười mô-đun CLI thật ở lần gọi đầu tiên
- bảo đảm các mô tả đó bao phủ mọi gốc lệnh cấp cao nhất do
  trình đăng ký cung cấp
- giữ tên lệnh trong mô tả chỉ gồm chữ cái, chữ số, dấu gạch nối và dấu gạch dưới,
  bắt đầu bằng chữ cái hoặc chữ số; OpenClaw từ chối tên mô tả nằm ngoài
  dạng đó và loại bỏ các chuỗi điều khiển terminal khỏi phần mô tả trước khi
  hiển thị trợ giúp
- chỉ dùng riêng `commands` cho các đường dẫn tương thích eager

## Hình dạng Plugin

OpenClaw phân loại các Plugin đã tải theo hành vi đăng ký của chúng:

| Hình dạng             | Mô tả                                             |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Một loại khả năng (ví dụ: chỉ nhà cung cấp)       |
| **hybrid-capability** | Nhiều loại khả năng (ví dụ: nhà cung cấp + giọng nói) |
| **hook-only**         | Chỉ hook, không có khả năng                       |
| **non-capability**    | Công cụ/lệnh/dịch vụ nhưng không có khả năng      |

Dùng `openclaw plugins inspect <id>` để xem hình dạng của một Plugin.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) - API đăng ký và tham chiếu subpath
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime) - `api.runtime` và `createPluginRuntimeStore`
- [Thiết lập và cấu hình](/vi/plugins/sdk-setup) - manifest, entry thiết lập, tải trì hoãn
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng đối tượng `ChannelPlugin`
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - đăng ký nhà cung cấp và hook
