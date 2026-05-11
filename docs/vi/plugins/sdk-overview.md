---
read_when:
    - Bạn cần biết cần nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham chiếu cho tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ nhập, tài liệu tham khảo API đăng ký và kiến trúc SDK
title: Tổng quan về Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:34:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK plugin là hợp đồng có kiểu giữa plugin và lõi. Trang này là
tài liệu tham chiếu về **những gì cần import** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin dùng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Với ứng dụng ngoài, script, dashboard, tác vụ CI và phần mở rộng IDE
  muốn chạy agent thông qua Gateway, hãy dùng
  [OpenClaw App SDK](/vi/concepts/openclaw-sdk) và gói `@openclaw/sdk`
  thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho plugin nhà cung cấp, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho backend CLI AI cục bộ, và [Hook plugin](/vi/plugins/hooks) cho plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một đường dẫn con cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi đường dẫn con là một mô-đun nhỏ, tự chứa. Điều này giữ cho quá trình khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Với cấu hình kênh, hãy xuất bản JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Đường dẫn con `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder tổng quát. Các plugin
đóng gói sẵn của OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho các
schema kênh đóng gói sẵn được giữ lại. Các export tương thích đã lỗi thời vẫn còn trên
`plugin-sdk/channel-config-schema-legacy`; cả hai đường dẫn con schema đóng gói sẵn đều không phải là
mẫu cho plugin mới.

<Warning>
  Không import các điểm nối tiện ích mang thương hiệu nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các plugin đóng gói sẵn kết hợp những đường dẫn con SDK tổng quát bên trong barrel `api.ts` /
  `runtime-api.ts` riêng của chúng; người dùng lõi nên dùng các barrel cục bộ của plugin đó
  hoặc thêm một hợp đồng SDK tổng quát hẹp khi nhu cầu thực sự là
  đa kênh.

Một tập nhỏ các điểm nối helper plugin đóng gói sẵn vẫn xuất hiện trong bản đồ export được tạo
khi chúng có mức sử dụng từ owner được theo dõi. Chúng chỉ tồn tại để bảo trì plugin đóng gói sẵn
và không được khuyến nghị làm đường dẫn import cho plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích đã lỗi thời cho mức sử dụng từ owner được theo dõi. Không
sao chép các đường dẫn import đó vào plugin mới; thay vào đó hãy dùng helper runtime được tiêm và
các đường dẫn con SDK kênh tổng quát.
</Warning>

## Tài liệu tham chiếu đường dẫn con

SDK plugin được cung cấp dưới dạng một tập các đường dẫn con hẹp được nhóm theo lĩnh vực (entry plugin,
kênh, nhà cung cấp, xác thực, runtime, capability, bộ nhớ và các helper
plugin đóng gói sẵn được dự trữ). Để xem danh mục đầy đủ — được nhóm và liên kết — hãy xem
[Đường dẫn con SDK Plugin](/vi/plugins/sdk-subpaths).

Kho entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; package export được tạo từ
tập con công khai sau khi trừ các đường dẫn con kiểm thử/nội bộ cục bộ của repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng export công khai. Các đường dẫn con công khai đã lỗi thời
đủ cũ và không được mã production của phần mở rộng đóng gói sẵn dùng
được theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các barrel
re-export đã lỗi thời phạm vi rộng được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký capability

| Phương thức                                      | Nội dung đăng ký                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                 |
| `api.registerAgentHarness(...)`                  | Bộ thực thi agent cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ           |
| `api.registerChannel(...)`                       | Kênh nhắn tin                          |
| `api.registerSpeechProvider(...)`                | Tổng hợp chuyển văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên giọng nói thời gian thực hai chiều |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video     |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                          |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                              |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                             |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp tải / scrape web         |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                          |

### Công cụ và lệnh

| Phương thức                     | Nội dung đăng ký                                  |
| ------------------------------- | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ agent (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                       |

Lệnh plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ văn bản đó xoay quanh chính lệnh; không thêm
chính sách riêng cho nhà cung cấp hoặc plugin vào trình xây dựng prompt lõi.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP của Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC của Gateway             |
| `api.registerGatewayDiscoveryService(service)` | Bộ quảng bá khám phá Gateway cục bộ     |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                            |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI tính năng Node dưới `openclaw nodes` |
| `api.registerService(service)`                 | Dịch vụ nền                             |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime      |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung liền kề bộ nhớ      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc bộ nhớ bổ sung      |

### Hook host cho plugin workflow

Hook host là các điểm nối SDK cho plugin cần tham gia vào vòng đời host
thay vì chỉ thêm một nhà cung cấp, kênh hoặc công cụ. Chúng là
hợp đồng tổng quát; Plan Mode có thể dùng chúng, nhưng workflow phê duyệt,
cổng chính sách workspace, trình giám sát nền, trình hướng dẫn thiết lập và plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                                           | Hợp đồng mà phương thức sở hữu                                                                                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Trạng thái phiên do plugin sở hữu, tương thích JSON, được chiếu qua phiên Gateway                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Ngữ cảnh bền vững đúng một lần được tiêm vào lượt agent tiếp theo cho một phiên                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | Chính sách công cụ trước plugin đóng gói sẵn/được tin cậy có thể chặn hoặc viết lại tham số công cụ                                |
| `api.registerToolMetadata(...)`                                                      | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                    |
| `api.registerCommand(...)`                                                           | Lệnh plugin theo phạm vi; kết quả lệnh có thể đặt `continueAgent: true`; lệnh native Discord hỗ trợ `descriptionLocalizations`    |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptor đóng góp UI điều khiển cho bề mặt phiên, công cụ, lượt chạy hoặc cài đặt                                               |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback dọn dẹp cho tài nguyên runtime do plugin sở hữu trên các đường dẫn reset/xóa/tải lại                                     |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Đăng ký sự kiện đã được làm sạch cho trạng thái workflow và trình giám sát                                                         |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái tạm của plugin theo từng lượt chạy, được xóa khi vòng đời lượt chạy kết thúc                                            |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Siêu dữ liệu dọn dẹp cho tác vụ scheduler do plugin sở hữu; không lên lịch công việc hoặc tạo bản ghi tác vụ                       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Chỉ dành cho gói đóng sẵn: phân phối tệp đính kèm qua host tới tuyến phiên gửi trực tiếp đang hoạt động                           |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Chỉ dành cho gói đóng sẵn: lượt phiên đã lên lịch dựa trên Cron cộng với dọn dẹp theo thẻ                                          |
| `api.session.controls.registerSessionAction(...)`                                    | Hành động phiên có kiểu mà client có thể dispatch thông qua Gateway                                                                |

Dùng các namespace được nhóm cho mã plugin mới:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Các phương thức phẳng tương đương vẫn có sẵn dưới dạng alias tương thích đã lỗi thời
cho plugin hiện có. Không thêm mã plugin mới gọi trực tiếp
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, hoặc
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là tiện ích theo phạm vi phiên nằm trên trình lập lịch Cron của Gateway. Cron sở hữu việc định thời và tạo bản ghi tác vụ nền khi lượt chạy; Plugin SDK chỉ ràng buộc phiên đích, cách đặt tên do plugin sở hữu, và dọn dẹp. Dùng `api.runtime.tasks.managedFlows` bên trong lượt đã lên lịch khi chính công việc cần trạng thái TaskFlow nhiều bước bền vững.

Các hợp đồng cố ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả UI, lệnh, siêu dữ liệu công cụ, chèn lượt kế tiếp, và các hook thông thường.
- Chính sách công cụ đáng tin cậy chạy trước các hook `before_tool_call` thông thường và chỉ dành cho bundled vì chúng tham gia vào chính sách an toàn của máy chủ.
- Quyền sở hữu lệnh dành riêng chỉ dành cho bundled. Plugin bên ngoài nên dùng tên lệnh hoặc bí danh riêng của chúng.
- `allowPromptInjection=false` tắt các hook làm thay đổi prompt, bao gồm `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, các trường prompt từ `before_agent_start` cũ, và `enqueueNextTurnInjection`.

Ví dụ về các bên tiêu thụ không thuộc Plan:

| Mẫu Plugin                   | Hook được dùng                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Quy trình phê duyệt          | Phần mở rộng phiên, tiếp tục lệnh, chèn lượt kế tiếp, bộ mô tả UI                                                                    |
| Cổng chính sách ngân sách/không gian làm việc | Chính sách công cụ đáng tin cậy, siêu dữ liệu công cụ, chiếu phiên                                                     |
| Trình giám sát vòng đời nền  | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, quyền sở hữu/dọn dẹp trình lập lịch phiên, đóng góp Heartbeat prompt, bộ mô tả UI |
| Trình hướng dẫn thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả UI điều khiển                                                           |

<Note>
  Các namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ `operator.admin`, ngay cả khi một plugin cố gắng gán phạm vi phương thức Gateway
  hẹp hơn. Ưu tiên tiền tố dành riêng cho plugin đối với các phương thức do
  plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Bundled plugin có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần ghi lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại vào mô hình. Đây là seam đáng tin cậy, trung lập runtime
  cho các bộ rút gọn đầu ra bất đồng bộ như tokenjuice.

Bundled plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng
runtime đích, ví dụ `["pi", "codex"]`. Plugin bên ngoài
không thể đăng ký middleware này; hãy giữ các hook Plugin OpenClaw thông thường cho công việc
không cần định thời kết quả công cụ trước mô hình. Đường dẫn đăng ký factory
phần mở rộng nhúng chỉ dành cho Pi cũ đã bị xóa.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép một plugin quảng bá Gateway
đang hoạt động trên một phương thức truyền tải khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
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

Plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Khám phá là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu niềm tin.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng do registrar sở hữu
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho trợ giúp CLI,
  định tuyến, và đăng ký CLI plugin tải lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với các tính năng node ghép cặp, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là wrapper nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành các tính năng node do plugin sở hữu một cách rõ ràng.

Nếu bạn muốn một lệnh plugin vẫn được tải lười trong đường dẫn CLI root thông thường,
hãy cung cấp `descriptors` bao phủ mọi root lệnh cấp cao nhất do
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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI root tải lười.
Đường dẫn tương thích tải ngay đó vẫn được hỗ trợ, nhưng nó không cài đặt
placeholder dựa trên descriptor cho việc tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `codex-cli`.

- `id` của backend trở thành tiền tố provider trong model ref như `codex-cli/gpt-5`.
- `config` của backend dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định của plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi một backend cần ghi lại tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa các hình dạng flag cũ).
- Dùng `resolveExecutionArgs` cho các lần ghi lại argv theo phạm vi yêu cầu thuộc về
  dialect CLI, chẳng hạn ánh xạ mức suy nghĩ của OpenClaw sang flag effort gốc.

Để xem hướng dẫn soạn thảo đầu-cuối, xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Slot độc quyền

| Phương thức                                 | Nội dung đăng ký                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (mỗi lúc một cái hoạt động). Callback `assemble()` nhận `availableTools` và `citationsMode` để engine có thể điều chỉnh phần bổ sung prompt. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch flush bộ nhớ                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                     |

### Adapter embedding bộ nhớ

| Phương thức                                    | Nội dung đăng ký                                  |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể phơi bày `publicArtifacts.listArtifacts(...)`
  để các plugin đồng hành có thể tiêu thụ artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì đi vào bố cục riêng tư của một
  plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API plugin bộ nhớ độc quyền tương thích cũ.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback
  đang hoạt động.
- `registerMemoryEmbeddingProvider` cho phép plugin bộ nhớ đang hoạt động đăng ký một
  hoặc nhiều id adapter embedding (ví dụ `openai`, `gemini`, hoặc một id tùy chỉnh
  do plugin định nghĩa).
- Cấu hình người dùng như `agents.defaults.memorySearch.provider` và
  `agents.defaults.memorySearch.fallback` phân giải theo các id adapter đã đăng ký đó.

### Sự kiện và vòng đời

| Phương thức                                  | Tác dụng                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu          |
| `api.onConversationBindingResolved(handler)` | Callback binding hội thoại     |

Xem [Plugin hooks](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến, và
ngữ nghĩa guard.

### Ngữ nghĩa quyết định của hook

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận dispatch, các handler có độ ưu tiên thấp hơn và đường dẫn dispatch mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị đó, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/topic đến. Giữ `metadata` cho các phần bổ sung riêng theo kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback sang `metadata` riêng theo kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động do gateway sở hữu thay vì dựa vào các hook `gateway:startup` nội bộ.
- `cron_changed`: quan sát các thay đổi vòng đời Cron do gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các trình lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn chân lý cho kiểm tra đến hạn và thực thi.

### Trường đối tượng API

| Trường                    | Kiểu                      | Mô tả                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Mã định danh Plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản Plugin (tùy chọn)                                                                   |
| `api.description`        | `string?`                 | Mô tả Plugin (tùy chọn)                                                               |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Thư mục gốc của Plugin (tùy chọn)                                                            |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp nhanh cấu hình hiện tại (ảnh chụp nhanh runtime trong bộ nhớ đang hoạt động khi có sẵn)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Trình ghi log theo phạm vi (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước entry đầy đủ |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc Plugin                                                        |

## Quy ước mô-đun nội bộ

Trong Plugin của bạn, hãy dùng các tệp barrel cục bộ cho các import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import chính Plugin của bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến các import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin đóng gói được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, và các tệp entry công khai tương tự) ưu tiên ảnh chụp nhanh
cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có ảnh chụp nhanh runtime,
chúng sẽ fallback về tệp cấu hình đã phân giải trên đĩa.
Các facade Plugin đóng gói đã được package nên được tải thông qua các bộ tải facade Plugin
của OpenClaw; import trực tiếp từ `dist/extensions/...` sẽ bỏ qua manifest
và các kiểm tra sidecar runtime mà các bản cài đặt đã package dùng cho mã do Plugin sở hữu.

Provider Plugin có thể phơi bày một barrel hợp đồng cục bộ hẹp của Plugin khi một
trình trợ giúp được chủ ý thiết kế riêng cho provider và chưa thuộc về một subpath SDK
chung. Ví dụ đóng gói:

- **Anthropic**: seam công khai `api.ts` / `contract-api.ts` cho các trình trợ giúp stream
  beta-header Claude và `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các builder provider,
  trình trợ giúp model mặc định, và builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất builder provider
  cùng các trình trợ giúp onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trình trợ giúp thực sự dùng chung, hãy nâng nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một bề mặt khác
  theo hướng capability thay vì ghép chặt hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Entry point" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trình trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu đầy đủ cho namespace `api.runtime`.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt đã ngừng dùng.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc chuyên sâu và mô hình capability.
  </Card>
</CardGroup>
