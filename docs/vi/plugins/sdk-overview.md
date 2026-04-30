---
read_when:
    - Bạn cần biết nên nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo cho tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất SDK cụ thể
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK plugin là hợp đồng được định kiểu giữa plugin và lõi. Trang này là tài liệu tham khảo cho **những gì cần import** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Với ứng dụng bên ngoài, script, dashboard, tác vụ CI và tiện ích mở rộng IDE
  muốn chạy agent thông qua Gateway, hãy dùng
  [OpenClaw App SDK](/vi/concepts/openclaw-sdk) và gói `@openclaw/sdk`
  thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho plugin nhà cung cấp, và [Hook plugin](/vi/plugins/hooks) cho plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một module nhỏ, độc lập. Điều này giữ cho quá trình khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với helper entry/build riêng cho kênh,
hãy ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt tổng quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Với cấu hình kênh, hãy xuất bản JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder chung. Các plugin đi kèm của
OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho các schema kênh đi kèm
được giữ lại. Các export tương thích đã lỗi thời vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; không subpath schema đi kèm nào là
mẫu cho plugin mới.

<Warning>
  Không import các seam tiện ích mang nhãn nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các plugin đi kèm ghép các subpath SDK chung bên trong barrel `api.ts` /
  `runtime-api.ts` của riêng chúng; người dùng lõi nên dùng các barrel cục bộ của plugin đó
  hoặc thêm một hợp đồng SDK chung hẹp khi nhu cầu thật sự
  xuyên kênh.

Một nhóm nhỏ seam helper plugin đi kèm vẫn xuất hiện trong export map được tạo
khi chúng có mức sử dụng của chủ sở hữu được theo dõi. Chúng chỉ tồn tại để
bảo trì plugin đi kèm và không phải là đường dẫn import được khuyến nghị cho
plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ làm facade tương thích đã lỗi thời cho mức sử dụng của chủ sở hữu được theo dõi. Không
sao chép các đường dẫn import đó vào plugin mới; thay vào đó hãy dùng helper runtime được tiêm và
các subpath SDK kênh chung.
</Warning>

## Tài liệu tham khảo subpath

SDK plugin được hiển thị dưới dạng một tập hợp các subpath hẹp được nhóm theo khu vực (entry
plugin, kênh, nhà cung cấp, xác thực, runtime, capability, memory và helper
plugin đi kèm dành riêng). Để xem danh mục đầy đủ — được nhóm và liên kết — xem
[Subpath SDK Plugin](/vi/plugins/sdk-subpaths).

Danh sách được tạo gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký capability

| Phương thức                                      | Nội dung đăng ký                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                 |
| `api.registerAgentHarness(...)`                  | Bộ thực thi agent cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ           |
| `api.registerChannel(...)`                       | Kênh nhắn tin                         |
| `api.registerSpeechProvider(...)`                | Chuyển văn bản thành giọng nói / tổng hợp STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực song công  |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video     |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                          |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                              |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                             |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp fetch / scrape web       |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                          |

### Công cụ và lệnh

| Phương thức                     | Nội dung đăng ký                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ agent (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                   |

Lệnh plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ văn bản đó nói về chính lệnh; không thêm
chính sách riêng của nhà cung cấp hoặc plugin vào builder prompt lõi.

### Hạ tầng

| Phương thức                                   | Nội dung đăng ký                              |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC Gateway                 |
| `api.registerGatewayDiscoveryService(service)` | Trình quảng bá khám phá Gateway cục bộ  |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                            |
| `api.registerService(service)`                 | Dịch vụ nền                             |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime      |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung liền kề memory      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc memory bổ sung      |

### Hook host cho plugin workflow

Hook host là các seam SDK cho plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
hợp đồng chung; Plan Mode có thể dùng chúng, nhưng workflow phê duyệt,
cổng chính sách workspace, monitor nền, trình hướng dẫn thiết lập và plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                              | Hợp đồng mà nó sở hữu                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Trạng thái phiên do plugin sở hữu, tương thích JSON, được chiếu qua các phiên Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Ngữ cảnh bền, đúng một lần, được tiêm vào lượt agent tiếp theo cho một phiên       |
| `api.registerTrustedToolPolicy(...)`                                     | Chính sách công cụ tiền plugin tin cậy/đi kèm có thể chặn hoặc viết lại tham số công cụ |
| `api.registerToolMetadata(...)`                                          | Metadata hiển thị danh mục công cụ mà không thay đổi triển khai công cụ            |
| `api.registerCommand(...)`                                               | Lệnh plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true`              |
| `api.registerControlUiDescriptor(...)`                                   | Descriptor đóng góp Control UI cho bề mặt phiên, công cụ, lần chạy hoặc cài đặt    |
| `api.registerRuntimeLifecycle(...)`                                      | Callback dọn dẹp cho tài nguyên runtime do plugin sở hữu trên đường dẫn reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Đăng ký sự kiện đã được làm sạch cho trạng thái workflow và monitor                |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Trạng thái nháp plugin theo từng lần chạy, được xóa khi vòng đời lần chạy kết thúc |
| `api.registerSessionSchedulerJob(...)`                                   | Bản ghi tác vụ scheduler phiên do plugin sở hữu với dọn dẹp xác định               |

Các hợp đồng cố ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu extension phiên, descriptor UI, lệnh, metadata công cụ, injection lượt tiếp theo và hook thông thường.
- Chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ dành cho plugin đi kèm vì chúng tham gia vào chính sách an toàn của host.
- Quyền sở hữu lệnh dành riêng chỉ dành cho plugin đi kèm. Plugin bên ngoài nên dùng
  tên lệnh hoặc bí danh của riêng chúng.
- `allowPromptInjection=false` tắt các hook làm thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ, và
  `enqueueNextTurnInjection`.

Ví dụ về consumer không phải Plan:

| Kiểu mẫu plugin              | Hook được dùng                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow phê duyệt           | Extension phiên, tiếp tục lệnh, injection lượt tiếp theo, descriptor UI                                                               |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ tin cậy, metadata công cụ, chiếu phiên                                                                        |
| Monitor vòng đời nền         | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, quyền sở hữu/dọn dẹp scheduler phiên, đóng góp prompt Heartbeat, descriptor UI       |
| Trình hướng dẫn thiết lập hoặc onboarding | Extension phiên, lệnh có phạm vi, descriptor Control UI                                                                 |

<Note>
  Namespace admin lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ `operator.admin`, ngay cả khi plugin cố gắng gán một
  phạm vi phương thức gateway hẹp hơn. Hãy ưu tiên tiền tố riêng của plugin cho
  các phương thức do plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin đi kèm có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần viết lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại model. Đây là seam tin cậy, trung lập runtime
  cho các bộ giảm đầu ra bất đồng bộ như tokenjuice.

Plugin đi kèm phải khai báo `contracts.agentToolResultMiddleware` cho từng
runtime mục tiêu, ví dụ `["pi", "codex"]`. Plugin bên ngoài
không thể đăng ký middleware này; hãy giữ các hook plugin OpenClaw bình thường cho công việc
không cần thời điểm kết quả công cụ trước model. Đường dẫn đăng ký factory extension nhúng
chỉ dành cho Pi cũ đã bị loại bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép plugin quảng bá Gateway đang hoạt động
trên một transport khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
dịch vụ trong quá trình khởi động Gateway khi khám phá cục bộ được bật, truyền
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

Các plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Khám phá chỉ là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
chịu trách nhiệm về độ tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu cấp cao nhất:

- `commands`: các gốc lệnh tường minh thuộc sở hữu của registrar
- `descriptors`: các bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho phần trợ giúp CLI gốc,
  định tuyến, và đăng ký CLI plugin tải lười

Nếu bạn muốn một lệnh plugin tiếp tục được tải lười trong đường dẫn CLI gốc thông thường,
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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc tải lười.
Đường dẫn tương thích tải sớm đó vẫn được hỗ trợ, nhưng nó không cài đặt
các phần giữ chỗ dựa trên bộ mô tả cho tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một plugin sở hữu cấu hình mặc định cho một backend CLI
AI cục bộ như `codex-cli`.

- `id` của backend trở thành tiền tố provider trong các tham chiếu model như `codex-cli/gpt-5`.
- `config` của backend dùng cùng cấu trúc với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn được ưu tiên. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi một backend cần viết lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các dạng cờ cũ).

### Khe độc quyền

| Phương thức                                | Nội dung đăng ký                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lúc một công cụ hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để công cụ có thể điều chỉnh phần bổ sung prompt.       |
| `api.registerMemoryCapability(capability)` | Năng lực bộ nhớ hợp nhất                                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch xả bộ nhớ                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Bộ điều hợp runtime bộ nhớ                                                                                                                                               |

### Bộ điều hợp embedding bộ nhớ

| Phương thức                                    | Nội dung đăng ký                                  |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Bộ điều hợp embedding bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể phơi bày `publicArtifacts.listArtifacts(...)`
  để các plugin đồng hành có thể tiêu thụ artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng của một
  plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API plugin bộ nhớ độc quyền tương thích kế thừa.
- `MemoryFlushPlan.model` có thể ghim lượt xả vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id bộ điều hợp embedding (ví dụ `openai`, `gemini`, hoặc một id tùy chỉnh
  do plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` được phân giải theo các id bộ điều hợp đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Tác dụng                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu            |
| `api.onConversationBindingResolved(handler)` | Callback liên kết cuộc trò chuyện |

Xem [Hook plugin](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến, và ngữ nghĩa guard.

### Ngữ nghĩa quyết định của hook

- `before_tool_call`: trả về `{ block: true }` là quyết định kết thúc. Khi bất kỳ handler nào đặt nó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là quyết định kết thúc. Khi bất kỳ handler nào đặt nó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là quyết định kết thúc. Khi bất kỳ handler nào nhận xử lý điều phối, các handler có độ ưu tiên thấp hơn và đường dẫn điều phối model mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là quyết định kết thúc. Khi bất kỳ handler nào đặt nó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến luồng/chủ đề đến. Giữ `metadata` cho các phần bổ sung riêng theo kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động thuộc sở hữu của Gateway thay vì dựa vào các hook `gateway:startup` nội bộ.
- `cron_changed`: quan sát các thay đổi vòng đời Cron thuộc sở hữu của Gateway. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho kiểm tra đến hạn và thực thi.

### Trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                               |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id plugin                                                                                           |
| `api.name`               | `string`                  | Tên hiển thị                                                                                        |
| `api.version`            | `string?`                 | Phiên bản plugin (tùy chọn)                                                                         |
| `api.description`        | `string?`                 | Mô tả plugin (tùy chọn)                                                                             |
| `api.source`             | `string`                  | Đường dẫn nguồn plugin                                                                              |
| `api.rootDir`            | `string?`                 | Thư mục gốc plugin (tùy chọn)                                                                       |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có sẵn)                |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của plugin từ `plugins.entries.<id>.config`                                          |
| `api.runtime`            | `PluginRuntime`           | [Trợ giúp runtime](/vi/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước entry đầy đủ         |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc plugin                                                        |

## Quy ước module nội bộ

Trong plugin của bạn, hãy dùng các tệp barrel cục bộ cho import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import plugin của chính bạn qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai plugin đóng gói được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, và các tệp entry công khai tương tự) ưu tiên
ảnh chụp cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp runtime, chúng fallback về tệp cấu hình đã phân giải trên đĩa.
Các facade plugin đóng gói đã được package nên được tải qua các loader facade
plugin của OpenClaw; import trực tiếp từ `dist/extensions/...` bỏ qua các bản sao
phụ thuộc runtime theo giai đoạn mà bản cài đặt package dùng cho các phụ thuộc
do plugin sở hữu.

Các plugin provider có thể phơi bày một barrel hợp đồng hẹp cục bộ theo plugin khi một
trợ giúp được chủ ý thiết kế riêng cho provider và chưa thuộc về một subpath SDK chung.
Ví dụ đóng gói:

- **Anthropic**: seam `api.ts` / `contract-api.ts` công khai cho các trợ giúp
  beta-header và stream `service_tier` của Claude.
- **`@openclaw/openai-provider`**: `api.ts` xuất các bộ dựng provider,
  trợ giúp model mặc định, và bộ dựng provider thời gian thực.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất bộ dựng provider
  cùng các trợ giúp onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trợ giúp thực sự được chia sẻ, hãy nâng nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một
  bề mặt định hướng năng lực khác thay vì ghép nối hai plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu đầy đủ cho namespace `api.runtime`.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest, và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt đã ngừng khuyến nghị.
  </Card>
  <Card title="Nội bộ plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình năng lực.
  </Card>
</CardGroup>
