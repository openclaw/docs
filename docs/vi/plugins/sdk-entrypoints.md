---
read_when:
    - Bạn cần chữ ký kiểu chính xác của definePluginEntry hoặc defineChannelPluginEntry
    - Bạn muốn hiểu chế độ đăng ký (đầy đủ so với thiết lập so với siêu dữ liệu CLI)
    - Bạn đang tra cứu các tùy chọn điểm vào
sidebarTitle: Entry Points
summary: Tài liệu tham khảo cho definePluginEntry, defineChannelPluginEntry và defineSetupPluginEntry
title: Các điểm vào Plugin
x-i18n:
    generated_at: "2026-05-06T09:24:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Mỗi Plugin xuất một đối tượng entry mặc định. SDK cung cấp ba helper để
tạo chúng.

Đối với các Plugin đã cài đặt, `package.json` nên trỏ việc tải runtime tới
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

`extensions` và `setupEntry` vẫn là các entry nguồn hợp lệ cho phát triển trong
workspace và git checkout. `runtimeExtensions` và `runtimeSetupEntry` được ưu tiên
khi OpenClaw tải một gói đã cài đặt và cho phép các gói npm tránh biên dịch
TypeScript ở runtime. Các entry runtime tường minh là bắt buộc: `runtimeSetupEntry`
yêu cầu `setupEntry`, và việc thiếu artifact `runtimeExtensions` hoặc
`runtimeSetupEntry` sẽ làm cài đặt/khám phá thất bại thay vì âm thầm quay về nguồn.
Nếu một gói đã cài đặt chỉ khai báo entry nguồn TypeScript, OpenClaw sẽ dùng một
peer `dist/*.js` đã build tương ứng khi tồn tại, rồi sau đó quay về nguồn TypeScript.

Tất cả đường dẫn entry phải nằm trong thư mục gói Plugin. Các entry runtime
và peer JavaScript đã build được suy luận không làm cho đường dẫn nguồn
`extensions` hoặc `setupEntry` thoát ra ngoài trở nên hợp lệ.

<Tip>
  **Bạn cần một hướng dẫn từng bước?** Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins)
  hoặc [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) để xem hướng dẫn từng bước.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dành cho Plugin nhà cung cấp, Plugin công cụ, Plugin hook, và bất kỳ thứ gì
**không phải** là một kênh nhắn tin.

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
| `id`           | `string`                                                         | Có       | -                   |
| `name`         | `string`                                                         | Có       | -                   |
| `description`  | `string`                                                         | Có       | -                   |
| `kind`         | `string`                                                         | Không    | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Có       | -                   |

- `id` phải khớp với manifest `openclaw.plugin.json` của bạn.
- `kind` dành cho các slot độc quyền: `"memory"` hoặc `"context-engine"`.
- `configSchema` có thể là một hàm để đánh giá lười.
- OpenClaw phân giải và ghi nhớ schema đó ở lần truy cập đầu tiên, vì vậy các
  bộ dựng schema tốn kém chỉ chạy một lần.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Bọc `definePluginEntry` với wiring dành riêng cho kênh. Tự động gọi
`api.registerChannel({ plugin })`, cung cấp một seam metadata CLI root-help tùy chọn,
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
| `id`                  | `string`                                                         | Có       | -                   |
| `name`                | `string`                                                         | Có       | -                   |
| `description`         | `string`                                                         | Có       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Có       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Không    | Schema đối tượng rỗng |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Không    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Không    | -                   |

- `setRuntime` được gọi trong quá trình đăng ký để bạn có thể lưu tham chiếu runtime
  (thường thông qua `createPluginRuntimeStore`). Nó được bỏ qua trong quá trình
  thu thập metadata CLI.
- `registerCliMetadata` chạy trong `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, và
  `api.registrationMode === "full"`.
  Dùng nó làm nơi chuẩn cho các descriptor CLI do kênh sở hữu để root help
  không kích hoạt, snapshot khám phá bao gồm metadata lệnh tĩnh, và
  đăng ký lệnh CLI thông thường vẫn tương thích với các lần tải Plugin đầy đủ.
- Đăng ký khám phá là không kích hoạt, không phải không import. OpenClaw có thể
  đánh giá entry Plugin tin cậy và module Plugin kênh để xây dựng
  snapshot, vì vậy hãy giữ các import cấp cao nhất không có side effect và đặt socket,
  client, worker, và service sau các đường dẫn chỉ dành cho `"full"`.
- `registerFull` chỉ chạy khi `api.registrationMode === "full"`. Nó được bỏ qua
  trong quá trình tải chỉ dành cho setup.
- Giống `definePluginEntry`, `configSchema` có thể là một factory lười và OpenClaw
  ghi nhớ schema đã phân giải ở lần truy cập đầu tiên.
- Với các lệnh CLI gốc do Plugin sở hữu, ưu tiên `api.registerCli(..., { descriptors: [...] })`
  khi bạn muốn lệnh vẫn được tải lười mà không biến mất khỏi cây phân tích CLI gốc.
  Với Plugin kênh, ưu tiên đăng ký các descriptor đó từ `registerCliMetadata(...)`
  và giữ `registerFull(...)` tập trung vào công việc chỉ dành cho runtime.
- Nếu `registerFull(...)` cũng đăng ký các phương thức RPC Gateway, hãy giữ chúng trên
  một tiền tố dành riêng cho Plugin. Các namespace quản trị core được dành riêng (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) luôn bị ép thành
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dành cho tệp `setup-entry.ts` nhẹ. Chỉ trả về `{ plugin }`, không có
wiring runtime hoặc CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw tải phần này thay cho entry đầy đủ khi một kênh bị tắt,
chưa được cấu hình, hoặc khi tải trì hoãn được bật. Xem
[Setup và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết khi nào điều này quan trọng.

Trong thực tế, hãy ghép `defineSetupPluginEntry(...)` với các nhóm helper setup hẹp:

- `openclaw/plugin-sdk/setup-runtime` dành cho các helper setup an toàn với runtime như
  adapter vá setup an toàn khi import, đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và proxy setup được ủy quyền
- `openclaw/plugin-sdk/channel-setup` dành cho các bề mặt setup cài đặt tùy chọn
- `openclaw/plugin-sdk/setup-tools` dành cho các helper setup/cài đặt CLI/archive/tài liệu

Giữ các SDK nặng, đăng ký CLI, và service runtime tồn tại lâu trong entry đầy đủ.

Các kênh workspace được bundle có tách bề mặt setup và runtime có thể dùng
`defineBundledChannelSetupEntry(...)` từ
`openclaw/plugin-sdk/channel-entry-contract` thay thế. Contract đó cho phép
entry setup giữ các export Plugin/secret an toàn cho setup trong khi vẫn cung cấp
một setter runtime:

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

Chỉ dùng contract bundle đó khi các luồng setup thật sự cần một setter runtime
nhẹ trước khi entry kênh đầy đủ được tải.

## Chế độ đăng ký

`api.registrationMode` cho Plugin của bạn biết nó đã được tải như thế nào:

| Chế độ           | Khi nào                           | Cần đăng ký                                                                                                             |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | Khởi động Gateway thông thường    | Mọi thứ                                                                                                                 |
| `"discovery"`    | Khám phá capability chỉ đọc       | Đăng ký kênh cùng các descriptor CLI tĩnh; mã entry có thể tải, nhưng bỏ qua socket, worker, client, và service         |
| `"setup-only"`   | Kênh bị tắt/chưa cấu hình         | Chỉ đăng ký kênh                                                                                                        |
| `"setup-runtime"` | Luồng setup có runtime khả dụng  | Đăng ký kênh cùng chỉ phần runtime nhẹ cần thiết trước khi entry đầy đủ tải                                             |
| `"cli-metadata"` | Thu thập root help / metadata CLI | Chỉ descriptor CLI                                                                                                      |

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
entry Plugin và đối tượng Plugin kênh để OpenClaw có thể đăng ký capability kênh
và descriptor CLI tĩnh. Hãy xem việc đánh giá module trong khám phá là
tin cậy nhưng nhẹ: không có client mạng, subprocess, listener, kết nối cơ sở dữ liệu,
worker nền, đọc credential, hoặc side effect runtime trực tiếp khác ở cấp cao nhất.

Xem `"setup-runtime"` là khoảng thời gian mà các bề mặt khởi động chỉ dành cho setup
phải tồn tại mà không vào lại runtime kênh bundle đầy đủ. Những thứ phù hợp là
đăng ký kênh, route HTTP an toàn cho setup, phương thức Gateway an toàn cho setup, và
helper setup được ủy quyền. Service nền nặng, registrar CLI, và
khởi động SDK nhà cung cấp/client vẫn thuộc về `"full"`.

Riêng với registrar CLI:

- dùng `descriptors` khi registrar sở hữu một hoặc nhiều lệnh gốc và bạn
  muốn OpenClaw tải lười module CLI thật ở lần gọi đầu tiên
- đảm bảo các descriptor đó bao phủ mọi root lệnh cấp cao nhất mà
  registrar cung cấp
- giữ tên lệnh descriptor gồm chữ cái, chữ số, dấu gạch nối, và dấu gạch dưới,
  bắt đầu bằng chữ cái hoặc chữ số; OpenClaw từ chối tên descriptor nằm ngoài
  dạng đó và loại bỏ chuỗi điều khiển terminal khỏi phần mô tả trước khi
  render help
- chỉ dùng `commands` đơn lẻ cho các đường dẫn tương thích tải háo hức

## Hình dạng Plugin

OpenClaw phân loại các Plugin đã tải theo hành vi đăng ký của chúng:

| Hình dạng             | Mô tả                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Một loại capability (ví dụ: chỉ provider)           |
| **hybrid-capability** | Nhiều loại capability (ví dụ: provider + speech)    |
| **hook-only**         | Chỉ có hook, không có capability                    |
| **non-capability**    | Công cụ/lệnh/dịch vụ nhưng không có capability      |

Dùng `openclaw plugins inspect <id>` để xem hình dạng của một Plugin.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) - API đăng ký và tham chiếu subpath
- [Trình trợ giúp Runtime](/vi/plugins/sdk-runtime) - `api.runtime` và `createPluginRuntimeStore`
- [Thiết lập và cấu hình](/vi/plugins/sdk-setup) - manifest, mục nhập thiết lập, tải trì hoãn
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng đối tượng `ChannelPlugin`
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - đăng ký provider và hook
