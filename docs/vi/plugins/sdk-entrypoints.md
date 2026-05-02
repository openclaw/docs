---
read_when:
    - Bạn cần chữ ký kiểu chính xác của definePluginEntry hoặc defineChannelPluginEntry
    - Bạn muốn hiểu chế độ đăng ký (full so với setup so với siêu dữ liệu CLI)
    - Bạn đang tra cứu các tùy chọn điểm vào
sidebarTitle: Entry Points
summary: Tài liệu tham chiếu cho definePluginEntry, defineChannelPluginEntry và defineSetupPluginEntry
title: Các điểm vào Plugin
x-i18n:
    generated_at: "2026-05-02T10:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Mỗi Plugin xuất một đối tượng mục nhập mặc định. SDK cung cấp ba helper để
tạo chúng.

Đối với các Plugin đã cài đặt, `package.json` nên trỏ việc tải runtime đến
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

`extensions` và `setupEntry` vẫn là các mục nhập nguồn hợp lệ cho phát triển
trong workspace và git checkout. `runtimeExtensions` và `runtimeSetupEntry` được
ưu tiên khi OpenClaw tải một gói đã cài đặt và cho phép các gói npm tránh biên
dịch TypeScript ở runtime. Các mục nhập runtime tường minh là bắt buộc:
`runtimeSetupEntry` yêu cầu `setupEntry`, và các artifact `runtimeExtensions`
hoặc `runtimeSetupEntry` bị thiếu sẽ làm cài đặt/khám phá thất bại thay vì âm
thầm quay lại nguồn. Nếu một gói đã cài đặt chỉ khai báo một mục nhập nguồn
TypeScript, OpenClaw sẽ dùng peer `dist/*.js` đã build tương ứng khi có, rồi mới
quay lại nguồn TypeScript.

Tất cả đường dẫn mục nhập phải nằm bên trong thư mục gói Plugin. Các mục nhập
runtime và peer JavaScript đã build được suy luận không làm cho đường dẫn nguồn
`extensions` hoặc `setupEntry` thoát ra ngoài trở nên hợp lệ.

<Tip>
  **Bạn đang tìm một hướng dẫn từng bước?** Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins)
  hoặc [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) để có hướng dẫn từng bước.
</Tip>

## `definePluginEntry`

**Nhập:** `openclaw/plugin-sdk/plugin-entry`

Dành cho Plugin nhà cung cấp, Plugin công cụ, Plugin hook, và bất cứ thứ gì **không phải**
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

| Trường         | Kiểu                                                             | Bắt buộc | Mặc định            |
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
- OpenClaw phân giải và ghi nhớ schema đó trong lần truy cập đầu tiên, vì vậy
  các builder schema tốn kém chỉ chạy một lần.

## `defineChannelPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Bao bọc `definePluginEntry` bằng phần nối dây riêng cho kênh. Tự động gọi
`api.registerChannel({ plugin })`, phơi bày một seam metadata CLI root-help tùy chọn,
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

| Trường                | Kiểu                                                             | Bắt buộc | Mặc định            |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Có       | —                   |
| `name`                | `string`                                                         | Có       | —                   |
| `description`         | `string`                                                         | Có       | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Có       | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Không    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Không    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Không    | —                   |

- `setRuntime` được gọi trong quá trình đăng ký để bạn có thể lưu tham chiếu runtime
  (thường thông qua `createPluginRuntimeStore`). Nó được bỏ qua trong quá trình thu thập metadata CLI.
- `registerCliMetadata` chạy khi `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, và
  `api.registrationMode === "full"`.
  Dùng nó làm nơi chuẩn cho các descriptor CLI do kênh sở hữu để trợ giúp root
  không kích hoạt, snapshot khám phá bao gồm metadata lệnh tĩnh, và đăng ký lệnh
  CLI thông thường vẫn tương thích với các lần tải Plugin đầy đủ.
- Đăng ký khám phá là không kích hoạt, không phải không nhập. OpenClaw có thể
  đánh giá mục nhập Plugin tin cậy và mô-đun Plugin kênh để xây dựng
  snapshot, vì vậy hãy giữ các import cấp cao nhất không có side effect và đặt socket,
  client, worker, và dịch vụ phía sau các đường dẫn chỉ dành cho `"full"`.
- `registerFull` chỉ chạy khi `api.registrationMode === "full"`. Nó được bỏ qua
  trong quá trình tải chỉ thiết lập.
- Giống `definePluginEntry`, `configSchema` có thể là một factory lười và OpenClaw
  ghi nhớ schema đã phân giải trong lần truy cập đầu tiên.
- Đối với các lệnh CLI root do Plugin sở hữu, ưu tiên `api.registerCli(..., { descriptors: [...] })`
  khi bạn muốn lệnh vẫn được tải lười mà không biến mất khỏi cây phân tích cú pháp
  CLI root. Đối với Plugin kênh, ưu tiên đăng ký các descriptor đó
  từ `registerCliMetadata(...)` và giữ `registerFull(...)` tập trung vào công việc chỉ dành cho runtime.
- Nếu `registerFull(...)` cũng đăng ký các phương thức RPC Gateway, hãy giữ chúng trên một
  tiền tố riêng cho Plugin. Các namespace quản trị core dành riêng (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) luôn bị ép thành
  `operator.admin`.

## `defineSetupPluginEntry`

**Nhập:** `openclaw/plugin-sdk/channel-core`

Dành cho tệp `setup-entry.ts` nhẹ. Chỉ trả về `{ plugin }` mà không có
phần nối dây runtime hoặc CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw tải mục nhập này thay vì mục nhập đầy đủ khi một kênh bị vô hiệu hóa,
chưa được cấu hình, hoặc khi tải trì hoãn được bật. Xem
[Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết khi nào điều này quan trọng.

Trong thực tế, hãy ghép `defineSetupPluginEntry(...)` với các họ helper thiết lập hẹp:

- `openclaw/plugin-sdk/setup-runtime` cho các helper thiết lập an toàn runtime như
  adapter patch thiết lập an toàn khi import, đầu ra lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và proxy thiết lập được ủy quyền
- `openclaw/plugin-sdk/channel-setup` cho các bề mặt thiết lập cài đặt tùy chọn
- `openclaw/plugin-sdk/setup-tools` cho các helper CLI/archive/tài liệu thiết lập/cài đặt

Giữ các SDK nặng, đăng ký CLI, và dịch vụ runtime sống lâu trong mục nhập đầy đủ.

Các kênh workspace được bundled có tách bề mặt thiết lập và runtime có thể dùng
`defineBundledChannelSetupEntry(...)` từ
`openclaw/plugin-sdk/channel-entry-contract` thay thế. Contract đó cho phép
mục nhập thiết lập giữ các export Plugin/secrets an toàn cho thiết lập trong khi vẫn phơi bày một
setter runtime:

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

Chỉ dùng contract bundled đó khi các luồng thiết lập thật sự cần một setter runtime nhẹ
trước khi mục nhập kênh đầy đủ tải.

## Chế độ đăng ký

`api.registrationMode` cho Plugin của bạn biết nó đã được tải như thế nào:

| Chế độ           | Khi nào                           | Cần đăng ký                                                                                                             |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | Khởi động Gateway thông thường    | Mọi thứ                                                                                                                 |
| `"discovery"`    | Khám phá capability chỉ đọc       | Đăng ký kênh cùng descriptor CLI tĩnh; mã mục nhập có thể tải, nhưng bỏ qua socket, worker, client, và dịch vụ |
| `"setup-only"`   | Kênh bị vô hiệu hóa/chưa cấu hình | Chỉ đăng ký kênh                                                                                                        |
| `"setup-runtime"` | Luồng thiết lập có runtime sẵn có | Đăng ký kênh cùng chỉ phần runtime nhẹ cần trước khi mục nhập đầy đủ tải                                                |
| `"cli-metadata"` | Thu thập trợ giúp root / metadata CLI | Chỉ descriptor CLI                                                                                                      |

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
mục nhập Plugin và đối tượng Plugin kênh để OpenClaw có thể đăng ký các
capability kênh và descriptor CLI tĩnh. Hãy xem việc đánh giá mô-đun trong khám phá là
đáng tin cậy nhưng nhẹ: không có client mạng, subprocess, listener, kết nối cơ sở dữ liệu,
worker nền, đọc thông tin đăng nhập, hoặc side effect runtime đang chạy nào khác ở cấp cao nhất.

Xem `"setup-runtime"` là khoảng thời gian mà các bề mặt khởi động chỉ thiết lập phải
tồn tại mà không vào lại runtime kênh bundled đầy đủ. Các lựa chọn phù hợp là
đăng ký kênh, route HTTP an toàn cho thiết lập, phương thức Gateway an toàn cho thiết lập, và
helper thiết lập được ủy quyền. Dịch vụ nền nặng, registrar CLI, và
bootstrap SDK nhà cung cấp/client vẫn thuộc về `"full"`.

Riêng đối với registrar CLI:

- dùng `descriptors` khi registrar sở hữu một hoặc nhiều lệnh root và bạn
  muốn OpenClaw tải lười mô-đun CLI thật trong lần gọi đầu tiên
- đảm bảo các descriptor đó bao phủ mọi root lệnh cấp cao nhất được
  registrar phơi bày
- giữ tên lệnh descriptor chỉ gồm chữ cái, chữ số, dấu gạch nối, và dấu gạch dưới,
  bắt đầu bằng chữ cái hoặc chữ số; OpenClaw từ chối tên descriptor nằm ngoài
  hình dạng đó và loại bỏ chuỗi điều khiển terminal khỏi mô tả trước khi
  kết xuất trợ giúp
- chỉ dùng riêng `commands` cho các đường dẫn tương thích tải eager

## Hình dạng Plugin

OpenClaw phân loại các Plugin đã tải theo hành vi đăng ký của chúng:

| Hình dạng             | Mô tả                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Một loại năng lực (ví dụ: chỉ nhà cung cấp)         |
| **hybrid-capability** | Nhiều loại năng lực (ví dụ: nhà cung cấp + giọng nói) |
| **hook-only**         | Chỉ có hook, không có năng lực                      |
| **non-capability**    | Công cụ/lệnh/dịch vụ nhưng không có năng lực        |

Dùng `openclaw plugins inspect <id>` để xem hình dạng của một Plugin.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) — API đăng ký và tham chiếu đường dẫn con
- [Trình trợ giúp thời gian chạy](/vi/plugins/sdk-runtime) — `api.runtime` và `createPluginRuntimeStore`
- [Thiết lập và cấu hình](/vi/plugins/sdk-setup) — manifest, mục nhập thiết lập, tải trì hoãn
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — xây dựng đối tượng `ChannelPlugin`
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) — đăng ký nhà cung cấp và hook
