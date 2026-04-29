---
read_when:
    - Bạn cần biết nên nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham chiếu cho tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một thành phần xuất cụ thể của SDK
sidebarTitle: SDK overview
summary: Bản đồ import, tài liệu tham khảo API đăng ký và kiến trúc SDK
title: Tổng quan về SDK Plugin
x-i18n:
    generated_at: "2026-04-29T23:02:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7652c2be756dad14792f59f36fa2fc2becd1681454005cf391e401b89999b857
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin là hợp đồng được định kiểu giữa Plugin và lõi. Trang này là
tài liệu tham chiếu cho **những gì cần nhập** và **những gì bạn có thể đăng ký**.

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho Plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho Plugin nhà cung cấp, và [Hook Plugin](/vi/plugins/hooks) cho Plugin công cụ hoặc hook vòng đời.
</Tip>

## Quy ước nhập

Luôn nhập từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một mô-đun nhỏ, độc lập. Điều này giữ cho quá trình khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với các helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Đối với cấu hình kênh, hãy xuất bản JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder tổng quát. Các Plugin
được đóng gói của OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho
các schema kênh đóng gói được giữ lại. Các export tương thích đã ngừng khuyến nghị vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; không subpath schema đóng gói nào là
mẫu cho Plugin mới.

<Warning>
  Không nhập các seam tiện ích gắn thương hiệu nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các Plugin được đóng gói kết hợp các subpath SDK tổng quát bên trong các barrel
  `api.ts` / `runtime-api.ts` của riêng chúng; người dùng lõi nên dùng các barrel cục bộ theo Plugin đó
  hoặc thêm một hợp đồng SDK tổng quát hẹp khi nhu cầu thật sự
  liên kênh.

Một tập nhỏ các seam helper của Plugin được đóng gói vẫn xuất hiện trong export map
được tạo khi chúng có mức sử dụng của chủ sở hữu đã được theo dõi. Chúng chỉ tồn tại để
bảo trì Plugin được đóng gói và không phải là đường dẫn nhập được khuyến nghị cho Plugin bên thứ ba
mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ làm facade tương thích đã ngừng khuyến nghị cho mức sử dụng của chủ sở hữu đã được theo dõi. Không
sao chép các đường dẫn nhập đó vào Plugin mới; thay vào đó hãy dùng các helper runtime được tiêm và
các subpath SDK kênh tổng quát.
</Warning>

## Tham chiếu subpath

SDK Plugin được cung cấp dưới dạng một tập các subpath hẹp được nhóm theo khu vực (entry
Plugin, kênh, nhà cung cấp, xác thực, runtime, capability, bộ nhớ, và helper
Plugin được đóng gói dành riêng). Để xem danh mục đầy đủ — được nhóm và liên kết — hãy xem
[Subpath SDK Plugin](/vi/plugins/sdk-subpaths).

Danh sách được tạo gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký capability

| Phương thức                                      | Nội dung đăng ký                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                 |
| `api.registerAgentHarness(...)`                  | Bộ thực thi tác tử cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ            |
| `api.registerChannel(...)`                       | Kênh nhắn tin                          |
| `api.registerSpeechProvider(...)`                | Tổng hợp chuyển văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm realtime dạng streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên giọng nói realtime hai chiều     |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video      |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                           |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                               |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                              |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp tìm nạp / scrape web      |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                           |

### Công cụ và lệnh

| Phương thức                    | Nội dung đăng ký                              |
| ----------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ tác tử (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                  |

Lệnh Plugin có thể đặt `agentPromptGuidance` khi tác tử cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ văn bản đó nói về chính lệnh; không thêm
chính sách dành riêng cho nhà cung cấp hoặc Plugin vào các trình xây dựng prompt lõi.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                        |
| --------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | Trình quảng bá phát hiện Gateway cục bộ |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                            |
| `api.registerService(service)`                 | Dịch vụ nền                             |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime      |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung liền kề bộ nhớ      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc bộ nhớ bổ sung      |

### Hook host cho Plugin quy trình làm việc

Hook host là các seam SDK dành cho Plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là các hợp đồng
tổng quát; Plan Mode có thể dùng chúng, nhưng các workflow phê duyệt,
cổng chính sách workspace, trình giám sát nền, wizard thiết lập và Plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                               | Hợp đồng sở hữu                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Trạng thái phiên do Plugin sở hữu, tương thích JSON, được chiếu qua các phiên Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Ngữ cảnh bền vững đúng-một-lần được tiêm vào lượt tác tử tiếp theo cho một phiên |
| `api.registerTrustedToolPolicy(...)`                                     | Chính sách công cụ tiền Plugin được đóng gói/tin cậy có thể chặn hoặc viết lại tham số công cụ |
| `api.registerToolMetadata(...)`                                          | Metadata hiển thị danh mục công cụ mà không thay đổi triển khai công cụ |
| `api.registerCommand(...)`                                               | Lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptor đóng góp Control UI cho các bề mặt phiên, công cụ, lượt chạy hoặc cài đặt |
| `api.registerRuntimeLifecycle(...)`                                      | Callback dọn dẹp cho tài nguyên runtime do Plugin sở hữu trên các đường dẫn reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Đăng ký sự kiện đã được làm sạch cho trạng thái workflow và trình giám sát |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Trạng thái nháp Plugin theo từng lượt chạy, được xóa khi vòng đời lượt chạy kết thúc |
| `api.registerSessionSchedulerJob(...)`                                   | Bản ghi job bộ lập lịch phiên do Plugin sở hữu với dọn dẹp xác định |

Các hợp đồng cố ý tách thẩm quyền:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, descriptor UI, lệnh, metadata công cụ, tiêm lượt kế tiếp và hook thông thường.
- Chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ dành cho bản đóng gói vì chúng tham gia vào chính sách an toàn của host.
- Quyền sở hữu lệnh dành riêng chỉ dành cho bản đóng gói. Plugin bên ngoài nên dùng tên lệnh hoặc alias của riêng chúng.
- `allowPromptInjection=false` vô hiệu hóa các hook làm thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ, và
  `enqueueNextTurnInjection`.

Ví dụ về người dùng không phải Plan:

| Kiểu Plugin                  | Hook được dùng                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow phê duyệt           | Phần mở rộng phiên, tiếp tục lệnh, tiêm lượt kế tiếp, descriptor UI                                                                    |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ tin cậy, metadata công cụ, chiếu phiên                                                                        |
| Trình giám sát vòng đời nền  | Dọn dẹp vòng đời runtime, đăng ký sự kiện tác tử, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt heartbeat, descriptor UI |
| Wizard thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, descriptor Control UI                                                                         |

<Note>
  Namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ `operator.admin`, ngay cả khi một Plugin cố gắng gán
  phạm vi phương thức gateway hẹp hơn. Ưu tiên tiền tố dành riêng cho Plugin cho
  các phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin được đóng gói có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần viết lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại mô hình. Đây là seam tin cậy trung lập với runtime
  cho các bộ giảm đầu ra bất đồng bộ như tokenjuice.

Plugin được đóng gói phải khai báo `contracts.agentToolResultMiddleware` cho từng
runtime được nhắm tới, ví dụ `["pi", "codex"]`. Plugin bên ngoài
không thể đăng ký middleware này; hãy giữ các hook Plugin OpenClaw thông thường cho công việc
không cần thời điểm kết quả công cụ trước mô hình. Đường dẫn đăng ký factory extension nhúng
chỉ dành cho Pi cũ đã bị xóa.
</Accordion>

### Đăng ký phát hiện Gateway

`api.registerGatewayDiscoveryService(...)` cho phép một Plugin quảng bá Gateway đang hoạt động
trên một transport phát hiện cục bộ như mDNS/Bonjour. OpenClaw gọi
dịch vụ trong quá trình khởi động Gateway khi phát hiện cục bộ được bật, truyền vào
các cổng Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, rồi gọi handler
`stop` được trả về trong quá trình tắt Gateway.

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

Plugin phát hiện Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Phát hiện là một gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu niềm tin.

### Metadata đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại metadata cấp cao nhất:

- `commands`: gốc lệnh rõ ràng thuộc sở hữu của registrar
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp, dùng cho trợ giúp CLI gốc,
  định tuyến và đăng ký CLI plugin theo kiểu lazy

Nếu bạn muốn một lệnh plugin vẫn được tải lazy trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất mà
registrar đó phơi bày.

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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc theo kiểu lazy.
Đường dẫn tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt
placeholder dựa trên descriptor cho tải lazy tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `codex-cli`.

- `id` của backend trở thành tiền tố provider trong tham chiếu model như `codex-cli/gpt-5`.
- `config` của backend dùng cùng cấu trúc với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định của plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi một backend cần viết lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các dạng flag cũ).

### Slot độc quyền

| Phương thức                                 | Nội dung đăng ký                                                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine ngữ cảnh (mỗi lần chỉ một engine hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để engine có thể tùy chỉnh phần bổ sung prompt. |
| `api.registerMemoryCapability(capability)` | Capability bộ nhớ hợp nhất                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch flush bộ nhớ                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                         |

### Adapter embedding bộ nhớ

| Phương thức                                     | Nội dung đăng ký                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể phơi bày `publicArtifacts.listArtifacts(...)`
  để các plugin đồng hành có thể dùng artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào layout riêng của một
  plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` và
  `registerMemoryRuntime` là các API plugin bộ nhớ độc quyền tương thích legacy.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id adapter embedding (ví dụ `openai`, `gemini` hoặc một id tùy chỉnh
  do plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` được phân giải theo các id adapter đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Tác dụng                       |
| ------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`          | Hook vòng đời có kiểu          |
| `api.onConversationBindingResolved(handler)` | Callback liên kết hội thoại    |

Xem [hook Plugin](/vi/plugins/hooks) để biết ví dụ, các tên hook phổ biến và ngữ nghĩa guard.

### Ngữ nghĩa quyết định của hook

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận xử lý dispatch, các handler ưu tiên thấp hơn và đường dẫn dispatch model mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/chủ đề đến. Giữ `metadata` cho phần bổ sung riêng theo kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir` và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì dựa vào các hook nội bộ `gateway:startup`.
- `cron_changed`: quan sát các thay đổi vòng đời Cron do Gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw là nguồn sự thật cho kiểm tra đến hạn và thực thi.

### Các trường đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id plugin                                                                                  |
| `api.name`               | `string`                  | Tên hiển thị                                                                               |
| `api.version`            | `string?`                 | Phiên bản plugin (tùy chọn)                                                                |
| `api.description`        | `string?`                 | Mô tả plugin (tùy chọn)                                                                    |
| `api.source`             | `string`                  | Đường dẫn nguồn plugin                                                                     |
| `api.rootDir`            | `string?`                 | Thư mục gốc plugin (tùy chọn)                                                              |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có sẵn)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của plugin từ `plugins.entries.<id>.config`                                 |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/vi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước full-entry  |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc plugin                                               |

## Quy ước module nội bộ

Trong plugin của bạn, dùng các file barrel cục bộ cho import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import plugin của chính bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt public của plugin bundled được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các file entry public tương tự) ưu tiên
ảnh chụp cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp runtime, chúng fallback về file cấu hình đã phân giải trên đĩa.
Facade plugin bundled đã đóng gói nên được tải thông qua các loader facade SDK
của OpenClaw; import trực tiếp từ `dist/extensions/...` sẽ bỏ qua các mirror phụ thuộc runtime theo giai đoạn mà bản cài đặt đóng gói dùng cho dependency do plugin sở hữu.

Plugin provider có thể phơi bày một barrel hợp đồng hẹp, cục bộ trong plugin khi một
helper được chủ ý thiết kế riêng cho provider và chưa thuộc về một subpath SDK chung.
Ví dụ bundled:

- **Anthropic**: seam public `api.ts` / `contract-api.ts` cho các helper Claude
  beta-header và luồng `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các provider builder,
  helper model mặc định và realtime provider builder.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất provider builder
  cùng helper onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một helper thật sự được chia sẻ, hãy đưa nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared` hoặc một
  bề mặt khác hướng theo capability thay vì ghép nối hai plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu namespace `api.runtime` đầy đủ.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt đã ngừng khuyến nghị.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình capability.
  </Card>
</CardGroup>
