---
read_when:
    - Bạn cần biết nên import từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo về tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một export SDK cụ thể
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về Plugin SDK
x-i18n:
    generated_at: "2026-05-02T10:49:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK là hợp đồng có kiểu giữa Plugin và lõi. Trang này là tài liệu tham chiếu cho **những gì cần import** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả Plugin dùng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Với ứng dụng bên ngoài, script, dashboard, tác vụ CI và phần mở rộng IDE
  muốn chạy agent thông qua Gateway, hãy dùng
  [OpenClaw App SDK](/vi/concepts/openclaw-sdk) và gói `@openclaw/sdk`
  thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn thực hành? Bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho Plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho Plugin nhà cung cấp, và [hook Plugin](/vi/plugins/hooks) cho Plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một đường dẫn con cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi đường dẫn con là một mô-đun nhỏ, độc lập. Điều này giúp khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với các helper điểm vào/xây dựng dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Với cấu hình kênh, hãy phát hành JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Đường dẫn con `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và bộ dựng chung. Các Plugin đi kèm của OpenClaw
dùng `plugin-sdk/bundled-channel-config-schema` cho các schema kênh đi kèm được giữ lại.
Các export tương thích đã lỗi thời vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; không đường dẫn con schema đi kèm nào là
khuôn mẫu cho Plugin mới.

<Warning>
  Không import các seam tiện ích mang nhãn nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các Plugin đi kèm kết hợp những đường dẫn con SDK chung bên trong barrel `api.ts` /
  `runtime-api.ts` của riêng chúng; người dùng lõi nên dùng các barrel cục bộ theo Plugin đó
  hoặc thêm một hợp đồng SDK chung hẹp khi nhu cầu thật sự
  xuyên kênh.

Một tập nhỏ các seam helper của Plugin đi kèm vẫn xuất hiện trong bản đồ export được tạo
khi chúng có mức sử dụng của chủ sở hữu đã được theo dõi. Chúng chỉ tồn tại để bảo trì
Plugin đi kèm và không được khuyến nghị làm đường dẫn import cho Plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích đã lỗi thời cho mức sử dụng của chủ sở hữu đã theo dõi. Không
sao chép các đường dẫn import đó vào Plugin mới; thay vào đó hãy dùng các helper runtime được tiêm và
các đường dẫn con SDK kênh chung.
</Warning>

## Tham chiếu đường dẫn con

Plugin SDK được cung cấp dưới dạng một tập các đường dẫn con hẹp được nhóm theo khu vực (điểm vào
Plugin, kênh, nhà cung cấp, xác thực, runtime, khả năng, bộ nhớ, và các helper
Plugin đi kèm được dành riêng). Để xem toàn bộ danh mục — được nhóm và liên kết — hãy xem
[Các đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).

Danh sách được tạo gồm hơn 200 đường dẫn con nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký khả năng

| Phương thức                                      | Nội dung đăng ký                         |
| ------------------------------------------------ | ---------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                   |
| `api.registerAgentHarness(...)`                  | Bộ thực thi agent cấp thấp thử nghiệm    |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ              |
| `api.registerChannel(...)`                       | Kênh nhắn tin                            |
| `api.registerSpeechProvider(...)`                | Tổng hợp chuyển văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên giọng nói thời gian thực hai chiều |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video        |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                             |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                 |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp fetch / scrape web          |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                             |

### Công cụ và lệnh

| Phương thức                     | Nội dung đăng ký                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ agent (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                   |

Lệnh Plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ phần văn bản đó nói về chính lệnh; không thêm
chính sách dành riêng cho nhà cung cấp hoặc Plugin vào các bộ dựng prompt lõi.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                         |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                             |
| `api.registerHttpRoute(params)`                | Endpoint HTTP của Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC của Gateway              |
| `api.registerGatewayDiscoveryService(service)` | Bộ quảng bá khám phá Gateway cục bộ      |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                             |
| `api.registerService(service)`                 | Dịch vụ nền                              |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                        |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime       |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung gần bộ nhớ           |
| `api.registerMemoryCorpusSupplement(adapter)`  | Kho ngữ liệu tìm kiếm/đọc bộ nhớ bổ sung |

### Host hook cho Plugin quy trình làm việc

Host hook là các seam SDK cho Plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
các hợp đồng chung; Plan Mode có thể dùng chúng, nhưng quy trình phê duyệt,
cổng chính sách workspace, trình giám sát nền, trình hướng dẫn thiết lập và Plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                               | Hợp đồng mà nó sở hữu                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Trạng thái phiên do Plugin sở hữu, tương thích JSON, được chiếu qua các phiên Gateway                                             |
| `api.enqueueNextTurnInjection(...)`                                      | Ngữ cảnh bền vững đúng một lần được tiêm vào lượt agent tiếp theo cho một phiên                                                   |
| `api.registerTrustedToolPolicy(...)`                                     | Chính sách công cụ trước Plugin đi kèm/đáng tin cậy có thể chặn hoặc viết lại tham số công cụ                                     |
| `api.registerToolMetadata(...)`                                          | Metadata hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                      |
| `api.registerCommand(...)`                                               | Lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true`; lệnh gốc Discord hỗ trợ `descriptionLocalizations`        |
| `api.registerControlUiDescriptor(...)`                                   | Descriptor đóng góp Control UI cho các bề mặt phiên, công cụ, lần chạy hoặc cài đặt                                               |
| `api.registerRuntimeLifecycle(...)`                                      | Callback dọn dẹp cho tài nguyên runtime do Plugin sở hữu trên các đường dẫn reset/xóa/tải lại                                     |
| `api.registerAgentEventSubscription(...)`                                | Đăng ký sự kiện đã được làm sạch cho trạng thái quy trình làm việc và trình giám sát                                              |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Trạng thái nháp của Plugin theo từng lần chạy, được xóa ở vòng đời lần chạy kết thúc                                              |
| `api.registerSessionSchedulerJob(...)`                                   | Bản ghi tác vụ lập lịch phiên do Plugin sở hữu với dọn dẹp xác định                                                               |

Các hợp đồng cố ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, descriptor UI, lệnh, metadata công cụ,
  lần tiêm lượt tiếp theo và hook thông thường.
- Chính sách công cụ đáng tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ dành cho
  Plugin đi kèm vì chúng tham gia vào chính sách an toàn của host.
- Quyền sở hữu lệnh dành riêng chỉ dành cho Plugin đi kèm. Plugin bên ngoài nên dùng
  tên lệnh hoặc alias của riêng chúng.
- `allowPromptInjection=false` vô hiệu hóa các hook làm thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ, và
  `enqueueNextTurnInjection`.

Ví dụ về người dùng không thuộc Plan:

| Mẫu hình Plugin                | Hook được dùng                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Quy trình phê duyệt            | Phần mở rộng phiên, tiếp tục lệnh, tiêm lượt tiếp theo, descriptor UI                                                                 |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ đáng tin cậy, metadata công cụ, chiếu phiên                                                                    |
| Trình giám sát vòng đời nền    | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt heartbeat, descriptor UI    |
| Trình hướng dẫn thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, descriptor Control UI                                                                  |

<Note>
  Các namespace quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ `operator.admin`, ngay cả khi Plugin cố gắng gán một
  phạm vi phương thức gateway hẹp hơn. Ưu tiên tiền tố dành riêng cho Plugin đối với
  các phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin đi kèm có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần viết lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại mô hình. Đây là seam trung lập runtime đáng tin cậy
  cho các bộ giảm đầu ra bất đồng bộ như tokenjuice.

Plugin đi kèm phải khai báo `contracts.agentToolResultMiddleware` cho từng
runtime mục tiêu, ví dụ `["pi", "codex"]`. Plugin bên ngoài
không thể đăng ký middleware này; giữ các hook Plugin OpenClaw thông thường cho công việc
không cần thời điểm kết quả công cụ trước mô hình. Đường dẫn đăng ký factory phần mở rộng nhúng
chỉ dành cho Pi cũ đã bị loại bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép plugin quảng bá Gateway đang hoạt động
trên một phương tiện khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
dịch vụ trong lúc khởi động Gateway khi khám phá cục bộ được bật, truyền các
cổng Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, rồi gọi trình xử lý
`stop` được trả về trong lúc tắt Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Các plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Khám phá là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
chịu trách nhiệm về niềm tin.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu cấp cao nhất:

- `commands`: các gốc lệnh tường minh do registrar sở hữu
- `descriptors`: các bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho trợ giúp CLI gốc,
  định tuyến, và đăng ký CLI plugin lazy

Nếu bạn muốn một lệnh plugin tiếp tục được tải lazy trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất mà registrar đó
công bố.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc lazy.
Đường dẫn tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt
các placeholder dựa trên descriptor để tải lazy tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `codex-cli`.

- `id` của backend trở thành tiền tố provider trong tham chiếu model như `codex-cli/gpt-5`.
- `config` của backend dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định của plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi backend cần viết lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các dạng flag cũ).

### Slot độc quyền

| Phương thức                                | Nội dung được đăng ký                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lần chỉ một công cụ hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để công cụ có thể điều chỉnh phần bổ sung prompt. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ thống nhất                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch flush bộ nhớ                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                     |

### Adapter embedding bộ nhớ

| Phương thức                                    | Nội dung được đăng ký                         |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể công bố `publicArtifacts.listArtifacts(...)`
  để các plugin đồng hành có thể dùng các artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng của một
  plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API plugin bộ nhớ độc quyền tương thích với legacy.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào đúng tham chiếu `provider/model`
  như `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id adapter embedding (ví dụ `openai`, `gemini`, hoặc một id tùy chỉnh
  do plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` được phân giải dựa trên các id adapter
  đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Chức năng                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu          |
| `api.onConversationBindingResolved(handler)` | Callback liên kết hội thoại    |

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến, và ngữ nghĩa guard.

### Ngữ nghĩa quyết định hook

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận xử lý dispatch, các handler có độ ưu tiên thấp hơn và đường dẫn dispatch model mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/topic đến. Giữ `metadata` cho các phần bổ sung riêng theo kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động do gateway sở hữu thay vì dựa vào các hook nội bộ `gateway:startup`.
- `cron_changed`: quan sát các thay đổi vòng đời cron do gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho việc kiểm tra đến hạn và thực thi.

### Trường đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản plugin (tùy chọn)                                                                 |
| `api.description`        | `string?`                 | Mô tả plugin (tùy chọn)                                                                     |
| `api.source`             | `string`                  | Đường dẫn nguồn plugin                                                                      |
| `api.rootDir`            | `string?`                 | Thư mục gốc plugin (tùy chọn)                                                              |
| `api.config`             | `OpenClawConfig`          | Snapshot cấu hình hiện tại (snapshot runtime trong bộ nhớ đang hoạt động khi có sẵn)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của plugin từ `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước full-entry   |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc plugin                                                |

## Quy ước module nội bộ

Trong plugin của bạn, dùng các tệp barrel cục bộ cho import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import chính plugin của bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của plugin bundled được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, và các tệp entry công khai tương tự) ưu tiên
snapshot cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
snapshot runtime, chúng fallback về tệp cấu hình đã phân giải trên đĩa.
Các facade plugin bundled đã đóng gói nên được tải thông qua các trình tải facade plugin
của OpenClaw; import trực tiếp từ `dist/extensions/...` bỏ qua manifest
và các kiểm tra sidecar runtime mà bản cài đặt đóng gói dùng cho mã do plugin sở hữu.

Plugin provider có thể công bố một barrel hợp đồng hẹp, cục bộ trong plugin khi một
trình trợ giúp cố ý là riêng cho provider và chưa thuộc về một subpath SDK chung.
Ví dụ bundled:

- **Anthropic**: seam công khai `api.ts` / `contract-api.ts` cho các trình trợ giúp stream
  beta-header Claude và `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các bộ dựng provider,
  trình trợ giúp model mặc định, và bộ dựng provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất bộ dựng provider
  cùng trình trợ giúp onboarding/cấu hình.

<Warning>
  Mã production extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trình trợ giúp thực sự dùng chung, hãy đưa nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một
  bề mặt khác hướng theo khả năng thay vì ghép chặt hai plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trình trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tài liệu tham chiếu đầy đủ cho không gian tên `api.runtime`.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển từ các giao diện đã bị ngừng khuyến nghị.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc chuyên sâu và mô hình khả năng.
  </Card>
</CardGroup>
