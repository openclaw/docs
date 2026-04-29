---
read_when:
    - Bạn cần chữ ký kiểu chính xác của definePluginEntry hoặc defineChannelPluginEntry
    - Bạn muốn hiểu chế độ đăng ký (full so với setup so với siêu dữ liệu CLI)
    - Bạn đang tra cứu các tùy chọn điểm vào
sidebarTitle: Entry Points
summary: Tài liệu tham chiếu cho definePluginEntry, defineChannelPluginEntry và defineSetupPluginEntry
title: Điểm vào của Plugin
x-i18n:
    generated_at: "2026-04-29T23:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Mỗi Plugin xuất một đối tượng mục nhập mặc định. SDK cung cấp ba trình trợ giúp để
tạo chúng.

Đối với các Plugin đã cài đặt, `package.json` nên trỏ việc tải thời gian chạy đến
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

`extensions` và `setupEntry` vẫn là các mục nhập nguồn hợp lệ cho quá trình phát
triển trong workspace và git checkout. `runtimeExtensions` và `runtimeSetupEntry`
được ưu tiên khi OpenClaw tải một gói đã cài đặt và cho phép các gói npm tránh
biên dịch TypeScript trong thời gian chạy. Nếu một gói đã cài đặt chỉ khai báo
một mục nhập nguồn TypeScript, OpenClaw sẽ dùng một peer `dist/*.js` đã build
tương ứng khi tồn tại, rồi quay lại nguồn TypeScript.

Tất cả đường dẫn mục nhập phải nằm trong thư mục gói Plugin. Các mục nhập thời gian chạy
và các peer JavaScript đã build được suy luận không làm cho một đường dẫn nguồn
`extensions` hoặc `setupEntry` thoát ra ngoài trở nên hợp lệ.

<Tip>
  **Bạn cần một hướng dẫn từng bước?** Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins)
  hoặc [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) để biết các hướng dẫn từng bước.
</Tip>

## `definePluginEntry`

**Nhập:** `openclaw/plugin-sdk/plugin-entry`

Dành cho Plugin nhà cung cấp, Plugin công cụ, Plugin hook và bất kỳ thứ gì **không phải**
là kênh nhắn tin.

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
| `id`           | `string`                                                         | Có       | —                   |
| `name`         | `string`                                                         | Có       | —                   |
| `description`  | `string`                                                         | Có       | —                   |
| `kind`         | `string`                                                         | Không    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Có       | —                   |

- `id` phải khớp với manifest `openclaw.plugin.json` của bạn.
- `kind` dành cho các slot độc quyền: `"memory"` hoặc `"context-engine"`.
- `configSchema` có thể là một hàm để đánh giá lười.
- OpenClaw phân giải và ghi nhớ schema đó trong lần truy cập đầu tiên, vì vậy các
  trình xây dựng schema tốn kém chỉ chạy một lần.

## `defineChannelPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Bọc `definePluginEntry` với phần nối dây dành riêng cho kênh. Tự động gọi
`api.registerChannel({ plugin })`, để lộ một seam siêu dữ liệu CLI trợ giúp gốc tùy chọn,
và chặn `registerFull` theo chế độ đăng ký.

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
| `id`                  | `string`                                                         | Có       | —                   |
| `name`                | `string`                                                         | Có       | —                   |
| `description`         | `string`                                                         | Có       | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Có       | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Không    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Không    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Không    | —                   |

- `setRuntime` được gọi trong quá trình đăng ký để bạn có thể lưu tham chiếu thời gian chạy
  (thường thông qua `createPluginRuntimeStore`). Nó bị bỏ qua trong quá trình thu thập
  siêu dữ liệu CLI.
- `registerCliMetadata` chạy trong `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` và
  `api.registrationMode === "full"`.
  Dùng nó làm nơi chuẩn cho các mô tả CLI do kênh sở hữu để trợ giúp gốc
  không kích hoạt, snapshot khám phá bao gồm siêu dữ liệu lệnh tĩnh, và
  đăng ký lệnh CLI thông thường vẫn tương thích với tải Plugin đầy đủ.
- Đăng ký khám phá là không kích hoạt, không phải không cần nhập. OpenClaw có thể
  đánh giá mục nhập Plugin đáng tin cậy và mô-đun Plugin kênh để xây dựng
  snapshot, vì vậy hãy giữ các import cấp cao nhất không có tác dụng phụ và đặt socket,
  client, worker và dịch vụ phía sau các đường dẫn chỉ dành cho `"full"`.
- `registerFull` chỉ chạy khi `api.registrationMode === "full"`. Nó bị bỏ qua
  trong khi tải chỉ dành cho thiết lập.
- Giống `definePluginEntry`, `configSchema` có thể là một factory lười và OpenClaw
  ghi nhớ schema đã phân giải trong lần truy cập đầu tiên.
- Đối với các lệnh CLI gốc do Plugin sở hữu, hãy ưu tiên `api.registerCli(..., { descriptors: [...] })`
  khi bạn muốn lệnh vẫn được tải lười mà không biến mất khỏi cây phân tích CLI
  gốc. Đối với Plugin kênh, hãy ưu tiên đăng ký các mô tả đó từ
  `registerCliMetadata(...)` và giữ `registerFull(...)` tập trung vào công việc chỉ dành cho thời gian chạy.
- Nếu `registerFull(...)` cũng đăng ký các phương thức RPC Gateway, hãy giữ chúng trên một
  tiền tố dành riêng cho Plugin. Các namespace quản trị lõi được dành riêng (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) luôn bị ép thành
  `operator.admin`.

## `defineSetupPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Dành cho tệp `setup-entry.ts` gọn nhẹ. Chỉ trả về `{ plugin }` mà không có
phần nối dây thời gian chạy hoặc CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw tải mục này thay vì mục đầy đủ khi một kênh bị tắt,
chưa được cấu hình, hoặc khi tải trì hoãn được bật. Xem
[Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết khi nào điều này quan trọng.

Trong thực tế, hãy ghép `defineSetupPluginEntry(...)` với các nhóm trợ giúp thiết lập hẹp:

- `openclaw/plugin-sdk/setup-runtime` cho các trình trợ giúp thiết lập an toàn với thời gian chạy như
  bộ điều hợp bản vá thiết lập an toàn khi import, đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries` và proxy thiết lập được ủy quyền
- `openclaw/plugin-sdk/channel-setup` cho các bề mặt thiết lập cài đặt tùy chọn
- `openclaw/plugin-sdk/setup-tools` cho các trình trợ giúp CLI/lưu trữ/tài liệu thiết lập/cài đặt

Giữ SDK nặng, đăng ký CLI và các dịch vụ thời gian chạy tồn tại lâu trong mục
đầy đủ.

Các kênh workspace đi kèm tách bề mặt thiết lập và thời gian chạy có thể dùng
`defineBundledChannelSetupEntry(...)` từ
`openclaw/plugin-sdk/channel-entry-contract` thay vào đó. Hợp đồng đó cho phép
mục thiết lập giữ các export Plugin/secrets an toàn cho thiết lập trong khi vẫn để lộ một
setter thời gian chạy:

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
});
```

Chỉ dùng hợp đồng đi kèm đó khi các luồng thiết lập thật sự cần một setter thời gian chạy
gọn nhẹ trước khi mục kênh đầy đủ được tải.

## Chế độ đăng ký

`api.registrationMode` cho Plugin của bạn biết nó đã được tải như thế nào:

| Chế độ           | Khi nào                           | Cần đăng ký                                                                                                             |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | Khởi động Gateway thông thường    | Mọi thứ                                                                                                                 |
| `"discovery"`    | Khám phá khả năng chỉ đọc         | Đăng ký kênh cộng với các mô tả CLI tĩnh; mã mục nhập có thể tải, nhưng bỏ qua socket, worker, client và dịch vụ        |
| `"setup-only"`   | Kênh bị tắt/chưa cấu hình         | Chỉ đăng ký kênh                                                                                                        |
| `"setup-runtime"` | Luồng thiết lập có thời gian chạy | Đăng ký kênh cộng với chỉ phần thời gian chạy gọn nhẹ cần thiết trước khi mục đầy đủ tải                               |
| `"cli-metadata"` | Thu thập trợ giúp gốc / siêu dữ liệu CLI | Chỉ các mô tả CLI                                                                                                  |

`defineChannelPluginEntry` tự động xử lý phần tách này. Nếu bạn dùng
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

Chế độ khám phá xây dựng một snapshot registry không kích hoạt. Nó vẫn có thể đánh giá
mục nhập Plugin và đối tượng Plugin kênh để OpenClaw có thể đăng ký
khả năng kênh và các mô tả CLI tĩnh. Hãy coi việc đánh giá mô-đun trong khám phá là
đáng tin cậy nhưng gọn nhẹ: không có client mạng, tiến trình con, listener, kết nối
cơ sở dữ liệu, worker nền, đọc thông tin xác thực hoặc các tác dụng phụ thời gian chạy
trực tiếp khác ở cấp cao nhất.

Hãy coi `"setup-runtime"` là khoảng thời gian mà các bề mặt khởi động chỉ dành cho thiết lập phải
tồn tại mà không tái nhập thời gian chạy kênh đi kèm đầy đủ. Các trường hợp phù hợp là
đăng ký kênh, route HTTP an toàn cho thiết lập, phương thức Gateway an toàn cho thiết lập và
trình trợ giúp thiết lập được ủy quyền. Dịch vụ nền nặng, trình đăng ký CLI và
bootstrap SDK nhà cung cấp/client vẫn thuộc về `"full"`.

Riêng với các trình đăng ký CLI:

- dùng `descriptors` khi trình đăng ký sở hữu một hoặc nhiều lệnh gốc và bạn
  muốn OpenClaw tải lười mô-đun CLI thật khi gọi lần đầu
- đảm bảo các mô tả đó bao phủ mọi gốc lệnh cấp cao nhất do
  trình đăng ký để lộ
- giữ tên lệnh trong mô tả gồm chữ cái, chữ số, dấu gạch nối và dấu gạch dưới,
  bắt đầu bằng chữ cái hoặc chữ số; OpenClaw từ chối tên mô tả nằm ngoài
  dạng đó và loại bỏ các chuỗi điều khiển terminal khỏi mô tả trước khi
  hiển thị trợ giúp
- chỉ dùng `commands` riêng cho các đường dẫn tương thích tải ngay

## Hình dạng Plugin

OpenClaw phân loại các Plugin đã tải theo hành vi đăng ký của chúng:

| Hình dạng             | Mô tả                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Một loại năng lực (ví dụ: chỉ nhà cung cấp)        |
| **hybrid-capability** | Nhiều loại năng lực (ví dụ: nhà cung cấp + giọng nói) |
| **hook-only**         | Chỉ có hook, không có năng lực                     |
| **non-capability**    | Công cụ/lệnh/dịch vụ nhưng không có năng lực       |

Dùng `openclaw plugins inspect <id>` để xem hình dạng của một plugin.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) — API đăng ký và tham chiếu đường dẫn con
- [Trình trợ giúp Runtime](/vi/plugins/sdk-runtime) — `api.runtime` và `createPluginRuntimeStore`
- [Thiết lập và cấu hình](/vi/plugins/sdk-setup) — manifest, điểm vào thiết lập, tải trì hoãn
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — xây dựng đối tượng `ChannelPlugin`
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) — đăng ký nhà cung cấp và hook
