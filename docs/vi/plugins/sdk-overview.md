---
read_when:
    - Bạn cần biết nên nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo cho tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục được xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham khảo API đăng ký và kiến trúc SDK
title: Tổng quan về Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK là hợp đồng có kiểu giữa các Plugin và lõi. Trang này là
tài liệu tham chiếu về **cần import gì** và **bạn có thể đăng ký gì**.

<Note>
  Trang này dành cho tác giả Plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Đối với ứng dụng bên ngoài, script, dashboard, tác vụ CI và phần mở rộng IDE
  muốn chạy agent thông qua Gateway, hãy dùng
  [OpenClaw App SDK](/vi/concepts/openclaw-sdk) và gói `@openclaw/sdk`
  thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho Plugin kênh, [Plugin provider](/vi/plugins/sdk-provider-plugins) cho Plugin provider, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho backend CLI AI cục bộ, và [hook Plugin](/vi/plugins/hooks) cho Plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một mô-đun nhỏ, độc lập. Điều này giúp khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Đối với helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Đối với cấu hình kênh, hãy xuất bản JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder tổng quát. Các Plugin đi kèm của OpenClaw
dùng `plugin-sdk/bundled-channel-config-schema` cho các schema kênh đi kèm được giữ lại.
Các export tương thích đã ngừng khuyến nghị vẫn còn trên
`plugin-sdk/channel-config-schema-legacy`; cả hai subpath schema đi kèm đều không phải là
mẫu cho Plugin mới.

<Warning>
  Không import các seam tiện ích gắn thương hiệu provider hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các Plugin đi kèm kết hợp những subpath SDK tổng quát bên trong barrel `api.ts` /
  `runtime-api.ts` của riêng chúng; consumer lõi nên dùng các barrel cục bộ của Plugin đó
  hoặc thêm một hợp đồng SDK tổng quát hẹp khi nhu cầu thực sự
  xuyên kênh.

Một tập nhỏ các seam helper của Plugin đi kèm vẫn xuất hiện trong bản đồ export được tạo
khi chúng có mức sử dụng của owner được theo dõi. Chúng chỉ tồn tại để bảo trì Plugin đi kèm
và không được khuyến nghị làm đường dẫn import cho Plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng được
giữ lại dưới dạng facade tương thích đã ngừng khuyến nghị cho mức sử dụng của owner được theo dõi. Không
sao chép các đường dẫn import đó vào Plugin mới; thay vào đó hãy dùng helper runtime được tiêm vào và
các subpath SDK kênh tổng quát.
</Warning>

## Tham chiếu subpath

Plugin SDK được cung cấp dưới dạng một tập các subpath hẹp được nhóm theo khu vực (entry
Plugin, kênh, provider, xác thực, runtime, capability, memory và helper
Plugin đi kèm được dành riêng). Để xem danh mục đầy đủ — đã nhóm và liên kết — hãy xem
[Subpath Plugin SDK](/vi/plugins/sdk-subpaths).

Danh sách được tạo gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký capability

| Phương thức                                      | Nội dung đăng ký                         |
| ------------------------------------------------ | ---------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                   |
| `api.registerAgentHarness(...)`                  | Bộ thực thi agent cấp thấp thử nghiệm    |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ              |
| `api.registerChannel(...)`                       | Kênh nhắn tin                            |
| `api.registerSpeechProvider(...)`                | Tổng hợp chuyển văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên giọng nói thời gian thực song công |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video        |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                             |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                 |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                |
| `api.registerWebFetchProvider(...)`              | Provider tìm nạp / scrape web            |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                             |

### Công cụ và lệnh

| Phương thức                    | Nội dung đăng ký                                      |
| ------------------------------ | ----------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ agent (bắt buộc hoặc `{ optional: true }`)    |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                           |

Các lệnh Plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ nội dung đó nói về chính lệnh; không thêm
chính sách dành riêng cho provider hoặc Plugin vào các trình dựng prompt lõi.

### Hạ tầng

| Phương thức                                     | Nội dung đăng ký                                  |
| ----------------------------------------------- | ------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook sự kiện                                      |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP của Gateway                         |
| `api.registerGatewayMethod(name, handler)`      | Phương thức RPC của Gateway                       |
| `api.registerGatewayDiscoveryService(service)`  | Bộ quảng bá khám phá Gateway cục bộ               |
| `api.registerCli(registrar, opts?)`             | Lệnh con CLI                                      |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI tính năng Node dưới `openclaw nodes`          |
| `api.registerService(service)`                  | Dịch vụ nền                                       |
| `api.registerInteractiveHandler(registration)`  | Handler tương tác                                 |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware kết quả công cụ lúc runtime            |
| `api.registerMemoryPromptSupplement(builder)`   | Phần prompt bổ sung liền kề bộ nhớ                |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus bổ sung cho tìm kiếm/đọc bộ nhớ            |

### Hook host cho các Plugin workflow

Hook host là các đường nối SDK cho Plugin cần tham gia vào vòng đời của host
thay vì chỉ thêm provider, kênh hoặc công cụ. Chúng là
các hợp đồng tổng quát; Plan Mode có thể dùng chúng, và các workflow phê duyệt,
cổng chính sách workspace, bộ giám sát nền, trình hướng dẫn thiết lập và Plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                               | Hợp đồng mà nó sở hữu                                                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                       | Trạng thái phiên do Plugin sở hữu, tương thích JSON, được chiếu qua các phiên Gateway                                                 |
| `api.enqueueNextTurnInjection(...)`                                       | Ngữ cảnh bền vững đúng-một-lần được chèn vào lượt agent tiếp theo cho một phiên                                                       |
| `api.registerTrustedToolPolicy(...)`                                      | Chính sách công cụ tiền-Plugin đáng tin cậy/được gói kèm, có thể chặn hoặc viết lại tham số công cụ                                   |
| `api.registerToolMetadata(...)`                                           | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi triển khai công cụ                                                           |
| `api.registerCommand(...)`                                                | Lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true`; lệnh gốc Discord hỗ trợ `descriptionLocalizations`             |
| `api.registerControlUiDescriptor(...)`                                    | Descriptor đóng góp Control UI cho các bề mặt phiên, công cụ, lần chạy hoặc cài đặt                                                   |
| `api.registerRuntimeLifecycle(...)`                                       | Callback dọn dẹp cho tài nguyên runtime do Plugin sở hữu trên các đường reset/delete/reload                                           |
| `api.registerAgentEventSubscription(...)`                                 | Subscription sự kiện đã được làm sạch cho trạng thái workflow và bộ giám sát                                                          |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái tạm của Plugin theo từng lần chạy, được xóa ở vòng đời kết thúc của lần chạy                                               |
| `api.registerSessionSchedulerJob(...)`                                    | Bản ghi job lập lịch phiên do Plugin sở hữu với cơ chế dọn dẹp xác định                                                               |

Các hợp đồng cố ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, descriptor UI, lệnh, siêu dữ liệu công cụ,
  chèn lượt tiếp theo và các hook thông thường.
- Chính sách công cụ đáng tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ
  dành cho gói kèm vì chúng tham gia vào chính sách an toàn của host.
- Quyền sở hữu lệnh dành riêng chỉ dành cho gói kèm. Plugin bên ngoài nên dùng
  tên lệnh hoặc bí danh riêng của chúng.
- `allowPromptInjection=false` vô hiệu hóa các hook làm biến đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ và
  `enqueueNextTurnInjection`.

Ví dụ về bên tiêu thụ không phải Plan:

| Mẫu hình Plugin               | Hook được dùng                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow phê duyệt            | Phần mở rộng phiên, tiếp tục lệnh, chèn lượt tiếp theo, descriptor UI                                                                 |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ đáng tin cậy, siêu dữ liệu công cụ, chiếu phiên                                                               |
| Bộ giám sát vòng đời nền      | Dọn dẹp vòng đời runtime, subscription sự kiện agent, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt Heartbeat, descriptor UI |
| Trình hướng dẫn thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, descriptor Control UI                                                                   |

<Note>
  Các namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên `operator.admin`, ngay cả khi một Plugin cố gắng gán
  phạm vi phương thức gateway hẹp hơn. Ưu tiên prefix dành riêng cho Plugin đối với
  các phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin được gói kèm có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần viết lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại model. Đây là đường nối đáng tin cậy, trung lập với runtime
  cho các bộ giảm đầu ra bất đồng bộ như tokenjuice.

Các Plugin được đóng gói kèm phải khai báo `contracts.agentToolResultMiddleware` cho từng runtime được nhắm tới, ví dụ `["pi", "codex"]`. Plugin bên ngoài không thể đăng ký middleware này; hãy giữ các hook Plugin OpenClaw thông thường cho công việc không cần thời điểm kết quả công cụ trước mô hình. Đường dẫn đăng ký factory extension nhúng cũ chỉ dành cho Pi đã bị loại bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép Plugin quảng bá Gateway đang hoạt động trên một transport khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi dịch vụ trong lúc khởi động Gateway khi khám phá cục bộ được bật, truyền các cổng Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, đồng thời gọi trình xử lý `stop` được trả về trong lúc tắt Gateway.

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

Plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc xác thực. Khám phá là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn sở hữu độ tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng do registrar sở hữu
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho trợ giúp CLI,
  định tuyến và đăng ký CLI Plugin lazy
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với các tính năng node được ghép cặp, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một wrapper nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành các tính năng node do Plugin sở hữu một cách rõ ràng.

Nếu bạn muốn một lệnh Plugin vẫn được tải lazy trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất mà registrar đó phơi bày.

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

Các lệnh lồng nhau nhận lệnh cha đã được phân giải dưới dạng `program`:

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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc lazy. Đường dẫn tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt các placeholder dựa trên descriptor để tải lazy tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép Plugin sở hữu cấu hình mặc định cho một backend CLI AI cục bộ như `codex-cli`.

- `id` của backend trở thành tiền tố provider trong các tham chiếu mô hình như `codex-cli/gpt-5`.
- `config` của backend dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên mặc định của Plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi backend cần các bản viết lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các hình dạng flag cũ).
- Dùng `resolveExecutionArgs` cho các bản viết lại argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn ánh xạ các mức suy nghĩ của OpenClaw sang flag effort gốc.

Để xem hướng dẫn biên soạn đầu cuối, hãy xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Slot độc quyền

| Phương thức                                | Nội dung đăng ký                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lần một công cụ hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để công cụ có thể điều chỉnh các phần bổ sung prompt. |
| `api.registerMemoryCapability(capability)` | Năng lực bộ nhớ hợp nhất                                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Trình dựng phần prompt bộ nhớ                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Trình phân giải kế hoạch flush bộ nhớ                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Bộ chuyển đổi runtime bộ nhớ                                                                                                                                    |

### Bộ chuyển đổi embedding bộ nhớ

| Phương thức                                    | Nội dung đăng ký                                |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Bộ chuyển đổi embedding bộ nhớ cho Plugin đang hoạt động |

- `registerMemoryCapability` là API Plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể phơi bày `publicArtifacts.listArtifacts(...)`
  để các Plugin đồng hành có thể tiêu thụ artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng tư của một
  Plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` và
  `registerMemoryRuntime` là các API Plugin bộ nhớ độc quyền tương thích legacy.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép Plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id bộ chuyển đổi embedding (ví dụ `openai`, `gemini` hoặc id tùy chỉnh
  do Plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` phân giải dựa trên các id bộ chuyển đổi đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Chức năng                       |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu           |
| `api.onConversationBindingResolved(handler)` | Callback liên kết cuộc trò chuyện |

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến và ngữ nghĩa guard.

### Ngữ nghĩa quyết định của hook

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận dispatch, các handler có mức ưu tiên thấp hơn và đường dẫn dispatch mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/topic đầu vào. Giữ `metadata` cho phần bổ sung riêng theo kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir` và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì dựa vào các hook `gateway:startup` nội bộ.
- `cron_changed`: quan sát các thay đổi vòng đời Cron do Gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các bộ lập lịch đánh thức bên ngoài, đồng thời giữ OpenClaw làm nguồn sự thật cho kiểm tra hạn chạy và thực thi.

### Trường đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id Plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản Plugin (tùy chọn)                                                                 |
| `api.description`        | `string?`                 | Mô tả Plugin (tùy chọn)                                                                     |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                      |
| `api.rootDir`            | `string?`                 | Thư mục gốc Plugin (tùy chọn)                                                               |
| `api.config`             | `OpenClawConfig`          | Snapshot cấu hình hiện tại (snapshot runtime trong bộ nhớ đang hoạt động khi có sẵn)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của Plugin từ `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước full-entry    |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc Plugin                                                |

## Quy ước module nội bộ

Trong Plugin của bạn, dùng các tệp barrel cục bộ cho import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import Plugin của chính bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ thông qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin đóng gói kèm được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các tệp entry công khai tương tự) ưu tiên snapshot cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có snapshot runtime nào, chúng fallback về tệp cấu hình đã phân giải trên đĩa. Facade Plugin đóng gói nên được tải thông qua các loader facade Plugin của OpenClaw; import trực tiếp từ `dist/extensions/...` bỏ qua manifest và các kiểm tra sidecar runtime mà bản cài đặt đóng gói dùng cho mã do Plugin sở hữu.

Các Plugin nhà cung cấp có thể công bố một barrel hợp đồng hẹp, cục bộ cho Plugin khi một
trình trợ giúp được chủ ý thiết kế riêng cho nhà cung cấp và chưa thuộc về một đường dẫn con
SDK chung. Các ví dụ đi kèm:

- **Anthropic**: điểm nối `api.ts` / `contract-api.ts` công khai cho các trình trợ giúp luồng
  beta-header Claude và `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các builder nhà cung cấp,
  trình trợ giúp mô hình mặc định, và builder nhà cung cấp realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất builder nhà cung cấp
  cùng các trình trợ giúp onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh các import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trình trợ giúp thực sự được dùng chung, hãy nâng cấp nó lên một đường dẫn con SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một bề mặt khác
  hướng theo capability thay vì ghép nối hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trình trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu namespace `api.runtime` đầy đủ.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest, và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển từ các bề mặt đã ngừng dùng.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình capability.
  </Card>
</CardGroup>
