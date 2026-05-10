---
read_when:
    - Bạn cần biết nên nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo về tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ nhập, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK plugin là hợp đồng được định kiểu giữa các plugin và lõi. Trang này là
tài liệu tham chiếu cho **những gì cần import** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Với các ứng dụng, script, dashboard, tác vụ CI và tiện ích mở rộng IDE
  bên ngoài muốn chạy agent thông qua Gateway, hãy dùng
  [OpenClaw App SDK](/vi/concepts/openclaw-sdk) và gói `@openclaw/sdk`
  thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho plugin nhà cung cấp, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho backend CLI AI cục bộ, và [Hook plugin](/vi/plugins/hooks) cho plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một mô-đun nhỏ, độc lập. Điều này giữ cho quá trình khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Với cấu hình kênh, hãy công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder chung. Các plugin tích hợp
của OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho các schema
kênh tích hợp được giữ lại. Các export tương thích không còn được khuyến nghị vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; cả hai subpath schema tích hợp đều không phải là
mẫu cho plugin mới.

<Warning>
  Không import các seam tiện ích gắn thương hiệu nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các plugin tích hợp kết hợp các subpath SDK chung bên trong barrel `api.ts` /
  `runtime-api.ts` của riêng chúng; người tiêu dùng lõi nên dùng các barrel cục bộ
  của plugin đó hoặc thêm một hợp đồng SDK chung hẹp khi nhu cầu thực sự
  xuyên kênh.

Một tập nhỏ các seam helper của plugin tích hợp vẫn xuất hiện trong bản đồ export
được tạo khi chúng có mức sử dụng của chủ sở hữu được theo dõi. Chúng chỉ tồn tại
để bảo trì plugin tích hợp và không phải là đường dẫn import được khuyến nghị cho
plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích không còn được khuyến nghị cho mức sử dụng
của chủ sở hữu được theo dõi. Không sao chép các đường dẫn import đó vào plugin mới; thay vào đó hãy dùng
helper runtime được inject và các subpath SDK kênh chung.
</Warning>

## Tham chiếu subpath

SDK plugin được cung cấp dưới dạng một tập các subpath hẹp được nhóm theo khu vực (entry
plugin, kênh, nhà cung cấp, auth, runtime, capability, bộ nhớ và helper
plugin tích hợp dành riêng). Để xem toàn bộ danh mục — được nhóm và liên kết — hãy xem
[Subpath SDK plugin](/vi/plugins/sdk-subpaths).

Inventory entrypoint của compiler nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; package export được tạo từ
tập con công khai sau khi trừ đi các subpath test/internal cục bộ trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng export công khai. Các subpath công khai
không còn được khuyến nghị đã đủ cũ và không còn được mã production của extension tích hợp sử dụng
được theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các barrel re-export
rộng không còn được khuyến nghị được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký capability

| Phương thức                                      | Nội dung đăng ký                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                |
| `api.registerAgentHarness(...)`                  | Bộ thực thi agent cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ           |
| `api.registerChannel(...)`                       | Kênh nhắn tin                         |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực hai chiều  |
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
chính sách dành riêng cho nhà cung cấp hoặc plugin vào các prompt builder của lõi.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                          |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP của Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC của Gateway               |
| `api.registerGatewayDiscoveryService(service)` | Trình quảng bá phát hiện Gateway cục bộ   |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                              |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI tính năng Node dưới `openclaw nodes`  |
| `api.registerService(service)`                 | Dịch vụ nền                               |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                         |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime        |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung liền kề bộ nhớ        |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc bộ nhớ bổ sung        |

### Hook host cho plugin workflow

Hook host là các seam SDK cho plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
các hợp đồng chung; Plan Mode có thể dùng chúng, và các workflow phê duyệt,
cổng chính sách workspace, trình giám sát nền, trình hướng dẫn thiết lập và plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                              | Hợp đồng sở hữu                                                                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Trạng thái phiên do plugin sở hữu, tương thích JSON, được chiếu qua phiên Gateway                                                  |
| `api.enqueueNextTurnInjection(...)`                                      | Ngữ cảnh bền vững, đúng một lần, được inject vào lượt agent tiếp theo cho một phiên                                                |
| `api.registerTrustedToolPolicy(...)`                                     | Chính sách công cụ trước plugin, tích hợp/đáng tin cậy, có thể chặn hoặc viết lại tham số công cụ                                  |
| `api.registerToolMetadata(...)`                                          | Metadata hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                       |
| `api.registerCommand(...)`                                               | Lệnh plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true`; lệnh native Discord hỗ trợ `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptor đóng góp Control UI cho bề mặt phiên, công cụ, lần chạy hoặc cài đặt                                                    |
| `api.registerRuntimeLifecycle(...)`                                      | Callback dọn dẹp cho tài nguyên runtime do plugin sở hữu trên các đường dẫn reset/delete/reload                                    |
| `api.registerAgentEventSubscription(...)`                                | Subscription sự kiện đã được làm sạch cho trạng thái workflow và trình giám sát                                                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Trạng thái nháp plugin theo từng lần chạy, được xóa khi vòng đời lần chạy kết thúc                                                 |
| `api.registerSessionSchedulerJob(...)`                                   | Bản ghi job scheduler phiên do plugin sở hữu với dọn dẹp xác định                                                                  |

Các hợp đồng cố ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu extension phiên, descriptor UI, lệnh, metadata công cụ,
  injection lượt tiếp theo và hook thông thường.
- Chính sách công cụ đáng tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ dành cho
  plugin tích hợp vì chúng tham gia vào chính sách an toàn của host.
- Quyền sở hữu lệnh dành riêng chỉ dành cho plugin tích hợp. Plugin bên ngoài nên dùng
  tên lệnh hoặc alias của riêng chúng.
- `allowPromptInjection=false` vô hiệu hóa các hook thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ, và
  `enqueueNextTurnInjection`.

Ví dụ về người tiêu dùng không phải Plan:

| Kiểu mẫu plugin                | Hook được dùng                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow phê duyệt             | Extension phiên, tiếp tục lệnh, injection lượt tiếp theo, descriptor UI                                                              |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ đáng tin cậy, metadata công cụ, chiếu phiên                                                                   |
| Trình giám sát vòng đời nền    | Dọn dẹp vòng đời runtime, subscription sự kiện agent, quyền sở hữu/dọn dẹp scheduler phiên, đóng góp prompt Heartbeat, descriptor UI |
| Trình hướng dẫn thiết lập hoặc onboarding | Extension phiên, lệnh có phạm vi, descriptor Control UI                                                                    |

<Note>
  Namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ `operator.admin`, ngay cả khi một plugin cố gắng gán
  phạm vi phương thức Gateway hẹp hơn. Ưu tiên prefix dành riêng cho plugin cho
  các phương thức do plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin được đóng gói có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần ghi lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại mô hình. Đây là seam đáng tin cậy, trung lập với runtime
  cho các bộ giảm đầu ra bất đồng bộ như tokenjuice.

Plugin được đóng gói phải khai báo `contracts.agentToolResultMiddleware` cho từng
runtime được nhắm tới, ví dụ `["pi", "codex"]`. Plugin bên ngoài
không thể đăng ký middleware này; hãy giữ các hook Plugin OpenClaw thông thường cho công việc
không cần thời điểm kết quả công cụ trước mô hình. Đường dẫn đăng ký factory
extension nhúng chỉ dành cho Pi cũ đã bị gỡ bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép một plugin quảng bá Gateway đang hoạt động
trên một transport khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
service này trong quá trình khởi động Gateway khi khám phá cục bộ được bật, truyền vào
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

Plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Khám phá là một gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu phần tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh tường minh do registrar sở hữu
- `descriptors`: descriptor lệnh tại thời điểm phân tích cú pháp, dùng cho trợ giúp CLI,
  định tuyến, và đăng ký CLI plugin theo kiểu tải lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với các tính năng node ghép cặp, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một wrapper nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành các tính năng node do plugin sở hữu một cách tường minh.

Nếu bạn muốn một lệnh plugin vẫn được tải lười trong đường dẫn CLI gốc thông thường,
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

Các lệnh lồng nhau nhận lệnh cha đã phân giải dưới dạng `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc theo kiểu tải lười.
Đường dẫn tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt
placeholder dựa trên descriptor để tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `codex-cli`.

- Backend `id` trở thành tiền tố provider trong các tham chiếu mô hình như `codex-cli/gpt-5`.
- Backend `config` dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định của plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi một backend cần ghi lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các hình dạng flag cũ).
- Dùng `resolveExecutionArgs` cho các lần ghi lại argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn ánh xạ các mức thinking của OpenClaw sang một flag effort
  gốc.

Để xem hướng dẫn biên soạn đầu cuối, xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Slot độc quyền

| Phương thức                                | Nội dung đăng ký                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (mỗi lần một cái đang hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để engine có thể điều chỉnh phần bổ sung prompt. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch flush bộ nhớ                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                    |

### Adapter embedding bộ nhớ

| Phương thức                                    | Nội dung đăng ký                                  |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể phơi bày `publicArtifacts.listArtifacts(...)`
  để các plugin đồng hành có thể tiêu thụ artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng của một
  plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API plugin bộ nhớ độc quyền tương thích legacy.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id adapter embedding (ví dụ `openai`, `gemini`, hoặc một id tùy chỉnh
  do plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` phân giải dựa trên các id adapter
  đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Tác dụng                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu         |
| `api.onConversationBindingResolved(handler)` | Callback liên kết hội thoại   |

Xem [Hook Plugin](/vi/plugins/hooks) để có ví dụ, tên hook phổ biến, và ngữ nghĩa guard.

### Ngữ nghĩa quyết định của hook

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận xử lý dispatch, các handler có mức ưu tiên thấp hơn và đường dẫn dispatch mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt nó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/chủ đề đầu vào. Giữ `metadata` cho phần bổ sung riêng theo channel.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo channel.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động do gateway sở hữu thay vì dựa vào các hook `gateway:startup` nội bộ.
- `cron_changed`: quan sát các thay đổi vòng đời cron do gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho việc kiểm tra đến hạn và thực thi.

### Trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản Plugin (tùy chọn)                                                                 |
| `api.description`        | `string?`                 | Mô tả Plugin (tùy chọn)                                                                     |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                      |
| `api.rootDir`            | `string?`                 | Thư mục gốc Plugin (tùy chọn)                                                               |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có)            |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của Plugin từ `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Trợ giúp runtime](/vi/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước full-entry   |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc Plugin                                                 |

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
  Không bao giờ import plugin của chính bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin đi kèm được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các tệp entry công khai tương tự) ưu tiên
ảnh chụp cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp runtime nào, chúng sẽ quay về tệp cấu hình đã được phân giải trên đĩa.
Các facade Plugin đi kèm đã đóng gói nên được tải thông qua trình tải facade
Plugin của OpenClaw; import trực tiếp từ `dist/extensions/...` sẽ bỏ qua manifest
và các kiểm tra sidecar runtime mà bản cài đặt đóng gói dùng cho mã do Plugin sở hữu.

Các Plugin nhà cung cấp có thể phơi bày một barrel hợp đồng hẹp cục bộ trong Plugin khi một
trợ giúp được chủ ý dành riêng cho nhà cung cấp và chưa thuộc về một subpath SDK
chung. Ví dụ đi kèm:

- **Anthropic**: seam công khai `api.ts` / `contract-api.ts` cho các trợ giúp
  header beta Claude và stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các builder nhà cung cấp,
  trợ giúp model mặc định và builder nhà cung cấp realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất builder nhà cung cấp
  cùng các trợ giúp onboarding/cấu hình.

<Warning>
  Mã sản xuất của tiện ích mở rộng cũng nên tránh các import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trợ giúp thực sự được dùng chung, hãy nâng cấp nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một bề mặt
  hướng theo năng lực khác thay vì ghép chặt hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu đầy đủ namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và schema cấu hình.
  </Card>
  <Card title="Testing" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt đã ngừng khuyến nghị.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình năng lực.
  </Card>
</CardGroup>
