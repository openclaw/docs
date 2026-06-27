---
read_when:
    - Bạn cần biết nên import từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo cho tất cả các phương thức đăng ký trong OpenClawPluginApi
    - Bạn đang tra cứu một mục được xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ nhập, tài liệu tham khảo API đăng ký và kiến trúc SDK
title: Tổng quan về Plugin SDK
x-i18n:
    generated_at: "2026-06-27T17:57:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin là hợp đồng có kiểu giữa Plugin và lõi. Trang này là tài liệu
tham chiếu cho **cần import gì** và **bạn có thể đăng ký gì**.

<Note>
  Trang này dành cho tác giả Plugin dùng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Đối với ứng dụng, script, dashboard, tác vụ CI và tiện ích mở rộng
  IDE bên ngoài muốn chạy tác nhân qua Gateway, hãy dùng
  [tích hợp Gateway cho ứng dụng bên ngoài](/vi/gateway/external-apps).
</Note>

<Tip>
Bạn đang tìm hướng dẫn cách làm? Hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho Plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho Plugin nhà cung cấp, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho backend CLI AI cục bộ, và [hook Plugin](/vi/plugins/hooks) cho Plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một mô-đun nhỏ, tự chứa. Điều này giữ cho quá trình khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Đối với helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Đối với cấu hình kênh, công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder chung. Các Plugin đi kèm của
OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho các schema kênh đi kèm
được giữ lại. Các export tương thích đã lỗi thời vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; cả hai subpath schema đi kèm đều không phải là
mẫu cho Plugin mới.

<Warning>
  Không import các seam tiện ích mang thương hiệu nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các Plugin đi kèm kết hợp các subpath SDK chung bên trong barrel `api.ts` /
  `runtime-api.ts` riêng của chúng; người dùng lõi nên dùng các barrel cục bộ của Plugin đó
  hoặc thêm một hợp đồng SDK chung hẹp khi nhu cầu thật sự
  xuyên kênh.

Một tập nhỏ các seam helper của Plugin đi kèm vẫn xuất hiện trong bản đồ export
được tạo khi chúng có mức sử dụng của chủ sở hữu được theo dõi. Chúng chỉ tồn tại cho
bảo trì Plugin đi kèm và không phải là đường dẫn import được khuyến nghị cho
Plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích đã lỗi thời cho mức sử dụng của chủ sở hữu được theo dõi. Không
sao chép các đường dẫn import đó vào Plugin mới; thay vào đó hãy dùng helper runtime được tiêm vào và
các subpath SDK kênh chung.
</Warning>

## Tham chiếu subpath

SDK Plugin được phơi bày dưới dạng một tập các subpath hẹp được nhóm theo khu vực (entry
Plugin, kênh, nhà cung cấp, xác thực, runtime, năng lực, bộ nhớ và các
helper Plugin đi kèm được dành riêng). Để xem danh mục đầy đủ — được nhóm và liên kết — xem
[Subpath SDK Plugin](/vi/plugins/sdk-subpaths).

Kho kiểm kê entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; export của package được tạo từ
tập con công khai sau khi trừ các subpath test/internal cục bộ của repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng export công khai. Các subpath công khai
đã lỗi thời đủ cũ và không được mã production của extension đi kèm dùng
được theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các
barrel re-export đã lỗi thời diện rộng được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký năng lực

| Phương thức                                      | Nội dung đăng ký                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                 |
| `api.registerAgentHarness(...)`                  | Trình thực thi tác nhân cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ            |
| `api.registerChannel(...)`                       | Kênh nhắn tin                          |
| `api.registerEmbeddingProvider(...)`             | Nhà cung cấp embedding vector tái sử dụng |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực song công   |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video      |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                           |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                               |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                              |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp fetch / scrape web        |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                           |

Các nhà cung cấp embedding được đăng ký bằng `api.registerEmbeddingProvider(...)` cũng phải
được liệt kê trong `contracts.embeddingProviders` trong manifest Plugin. Đây
là bề mặt embedding chung cho việc tạo vector tái sử dụng. Tìm kiếm bộ nhớ
có thể dùng bề mặt nhà cung cấp chung này. Seam cũ hơn
`api.registerMemoryEmbeddingProvider(...)` và
`contracts.memoryEmbeddingProviders` là tương thích đã lỗi thời trong khi
các nhà cung cấp chuyên cho bộ nhớ hiện có di chuyển.

Các nhà cung cấp chuyên cho bộ nhớ vẫn phơi bày runtime `batchEmbed(...)` tiếp tục ở trên
hợp đồng batching theo từng tệp hiện có, trừ khi runtime của chúng đặt rõ
`sourceWideBatchEmbed: true`. Tùy chọn opt-in đó cho phép host bộ nhớ gửi các chunk từ
nhiều tệp bộ nhớ bẩn và nguồn đã bật trong một lệnh gọi `batchEmbed(...)`
đến tối đa giới hạn batch của host. Các adapter batch tải lên tệp yêu cầu JSONL phải
chia tác vụ nhà cung cấp trước giới hạn kích thước tải lên cũng như giới hạn số lượng yêu cầu
của chúng. Nhà cung cấp phải trả về một embedding cho mỗi chunk đầu vào theo cùng thứ tự như
`batch.chunks`; bỏ qua cờ này khi nhà cung cấp mong đợi batch cục bộ theo tệp hoặc
không thể giữ thứ tự đầu vào trên một tác vụ rộng theo nguồn lớn hơn.

### Công cụ và lệnh

Dùng [`defineToolPlugin`](/vi/plugins/tool-plugins) cho các Plugin đơn giản chỉ có công cụ
với tên công cụ cố định. Dùng trực tiếp `api.registerTool(...)` cho Plugin hỗn hợp
hoặc đăng ký công cụ hoàn toàn động.

| Phương thức                    | Nội dung đăng ký                              |
| ----------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ tác nhân (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                  |

Lệnh Plugin có thể đặt `agentPromptGuidance` khi tác nhân cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ văn bản đó nói về chính lệnh; không thêm
chính sách dành riêng cho nhà cung cấp hoặc Plugin vào các prompt builder lõi.

Các mục hướng dẫn có thể là chuỗi legacy, áp dụng cho mọi bề mặt prompt, hoặc
mục có cấu trúc:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` có cấu trúc có thể bao gồm `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, hoặc `subagent`. `pi_main` vẫn là alias đã lỗi thời
cho `openclaw_main`. Bỏ qua `surfaces` đối với hướng dẫn cố ý áp dụng cho mọi bề mặt. Không
truyền mảng `surfaces` rỗng; nó bị từ chối để việc mất phạm vi ngoài ý muốn không
trở thành văn bản prompt toàn cục.

Chỉ dẫn developer của app-server Codex gốc nghiêm ngặt hơn các bề mặt prompt
khác: chỉ hướng dẫn được đặt phạm vi rõ ràng tới `codex_app_server` mới được nâng vào
luồng ưu tiên cao hơn đó. Hướng dẫn chuỗi legacy và hướng dẫn có cấu trúc không đặt phạm vi
vẫn khả dụng cho các bề mặt prompt không phải Codex để tương thích.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                       |
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
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung gần bộ nhớ          |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc bộ nhớ bổ sung      |

### Hook host cho Plugin workflow

Hook host là các seam SDK cho Plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
các hợp đồng chung; Plan Mode có thể dùng chúng, nhưng workflow phê duyệt,
cổng chính sách workspace, trình giám sát nền, trình hướng dẫn thiết lập và Plugin đồng hành UI
cũng có thể dùng.

| Phương thức                                                                           | Hợp đồng mà nó sở hữu                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Trạng thái phiên do Plugin sở hữu, tương thích JSON, được chiếu qua các phiên Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Ngữ cảnh bền vững đúng-một-lần được chèn vào lượt agent kế tiếp cho một phiên                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Chính sách công cụ đáng tin cậy trước plugin, được kiểm soát bằng manifest, có thể chặn hoặc ghi lại tham số công cụ                                               |
| `api.registerToolMetadata(...)`                                                      | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                            |
| `api.registerCommand(...)`                                                           | Lệnh plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true`; lệnh gốc Discord hỗ trợ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bộ mô tả đóng góp Control UI cho bề mặt phiên, công cụ, lần chạy hoặc cài đặt                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback dọn dẹp cho tài nguyên runtime do plugin sở hữu trên các đường dẫn đặt lại/xóa/tải lại                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Đăng ký sự kiện đã được làm sạch cho trạng thái workflow và trình giám sát                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái nháp plugin theo từng lần chạy, được xóa ở vòng đời kết thúc lần chạy                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Siêu dữ liệu dọn dẹp cho tác vụ lập lịch do plugin sở hữu; không lập lịch công việc hoặc tạo bản ghi tác vụ                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Phân phối tệp đính kèm qua host, chỉ dành cho bundled, tới tuyến phiên gửi trực tiếp đang hoạt động                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Lượt phiên đã lập lịch dựa trên Cron, chỉ dành cho bundled, cùng dọn dẹp dựa trên thẻ                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Hành động phiên có kiểu mà client có thể gửi qua Gateway                                                                    |

Sử dụng các namespace được nhóm cho mã plugin mới:

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

Các phương thức phẳng tương đương vẫn khả dụng dưới dạng alias tương thích
đã ngừng khuyến nghị cho các plugin hiện có. Không thêm mã plugin mới gọi trực tiếp
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, hoặc
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là một tiện ích theo phạm vi phiên nằm trên bộ lập lịch
Cron của Gateway. Cron sở hữu thời điểm thực thi và tạo bản ghi tác vụ nền khi
lượt chạy; Plugin SDK chỉ ràng buộc phiên đích, cách đặt tên do plugin sở hữu
và việc dọn dẹp. Dùng `api.runtime.tasks.managedFlows` bên trong lượt đã lập lịch
khi bản thân công việc cần trạng thái Task Flow nhiều bước bền vững.

Các hợp đồng chủ ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả UI, lệnh, siêu dữ liệu
  công cụ, chèn lượt kế tiếp và các hook thông thường.
- Chính sách công cụ đáng tin cậy chạy trước các hook `before_tool_call` thông thường và được
  host tin cậy. Chính sách bundled chạy trước; chính sách của plugin đã cài đặt yêu cầu
  bật rõ ràng cùng với id cục bộ của chúng trong
  `contracts.trustedToolPolicies`, rồi chạy tiếp theo theo thứ tự tải plugin. Id chính sách
  được giới hạn phạm vi theo plugin đăng ký.
- Quyền sở hữu lệnh dành riêng chỉ dành cho bundled. Plugin bên ngoài nên dùng tên lệnh
  hoặc alias riêng của chúng.
- `allowPromptInjection=false` tắt các hook làm thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  trường prompt từ `before_agent_start` cũ và
  `enqueueNextTurnInjection`.

Ví dụ về các consumer không phải Plan:

| Kiểu mẫu Plugin              | Hook được dùng                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow phê duyệt           | Phần mở rộng phiên, tiếp tục lệnh, chèn lượt kế tiếp, bộ mô tả UI                                                            |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ đáng tin cậy, siêu dữ liệu công cụ, chiếu phiên                                                                                 |
| Trình giám sát vòng đời nền | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt heartbeat, bộ mô tả UI |
| Trình hướng dẫn thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả Control UI                                                                              |

<Note>
  Các namespace quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên `operator.admin`, ngay cả khi một plugin cố gắng gán
  phạm vi phương thức gateway hẹp hơn. Ưu tiên tiền tố riêng theo plugin cho
  các phương thức do plugin sở hữu.
</Note>

<Accordion title="Khi nào dùng middleware kết quả công cụ">
  Plugin bundled và plugin đã cài đặt được bật rõ ràng với các hợp đồng
  manifest khớp có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  chúng cần ghi lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại mô hình. Đây là ranh giới trung lập runtime đáng tin cậy
  cho các bộ rút gọn đầu ra bất đồng bộ như tokenjuice.

Plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng runtime
đích, ví dụ `["openclaw", "codex"]`. Plugin đã cài đặt không có hợp đồng đó,
hoặc không được bật rõ ràng, không thể đăng ký middleware này; giữ các hook
plugin OpenClaw thông thường cho công việc không cần thời điểm kết quả công cụ
trước mô hình. Đường dẫn đăng ký factory mở rộng cũ chỉ dành cho
embedded-runner đã bị loại bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép plugin quảng bá Gateway đang hoạt động
trên một transport khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi dịch vụ này
trong quá trình khởi động Gateway khi khám phá cục bộ được bật, truyền các cổng
Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, rồi gọi handler
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

Plugin khám phá Gateway không được coi các giá trị TXT được quảng bá là bí mật hoặc
xác thực. Khám phá là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu sự tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng do registrar sở hữu
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp, dùng cho trợ giúp CLI,
  định tuyến và đăng ký CLI plugin lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với tính năng paired-node, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một wrapper nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành tính năng node rõ ràng do plugin sở hữu.

Nếu bạn muốn một lệnh plugin tiếp tục được tải lười trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất do
registrar đó cung cấp.

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

Lệnh lồng nhau nhận lệnh cha đã phân giải dưới dạng `program`:

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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc lười.
Đường dẫn tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt
placeholder dựa trên descriptor cho tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép plugin sở hữu cấu hình mặc định cho một backend
AI CLI cục bộ như `claude-cli` hoặc `my-cli`.

- `id` của backend trở thành tiền tố provider trong model ref như `my-cli/gpt-5`.
- `config` của backend dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn thắng. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  mặc định của plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi backend cần ghi lại cấu hình để tương thích sau khi hợp nhất
  (ví dụ chuẩn hóa hình dạng flag cũ).
- Dùng `resolveExecutionArgs` cho các lần ghi lại argv theo phạm vi yêu cầu thuộc về
  dialect CLI, chẳng hạn ánh xạ mức suy nghĩ của OpenClaw sang một flag effort gốc.
  Hook nhận `ctx.executionMode`; dùng `"side-question"` để thêm
  flag cô lập gốc của backend cho các lệnh gọi `/btw` tạm thời. Nếu các flag đó
  vô hiệu hóa đáng tin cậy các công cụ gốc cho một CLI vốn luôn bật, hãy khai báo thêm
  `sideQuestionToolMode: "disabled"`.

Để xem hướng dẫn biên soạn từ đầu đến cuối, xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Slot độc quyền

| Phương thức                                  | Nội dung đăng ký                                                                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lần một công cụ hoạt động). Các callback vòng đời nhận `runtimeSettings` khi host có thể cung cấp chẩn đoán model/provider/mode; các công cụ nghiêm ngặt cũ hơn được thử lại mà không có khóa đó. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Trình dựng phần prompt bộ nhớ                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch xả bộ nhớ                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                                                             |

### Adapter nhúng bộ nhớ đã ngừng khuyến nghị

| Phương thức                                      | Nội dung đăng ký                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter nhúng bộ nhớ cho Plugin đang hoạt động |

- `registerMemoryCapability` là API Plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể cung cấp `publicArtifacts.listArtifacts(...)`
  để các Plugin đồng hành có thể dùng các artifact bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng của
  một Plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API Plugin bộ nhớ độc quyền tương thích cũ.
- `MemoryFlushPlan.model` có thể ghim lượt xả vào một tham chiếu `provider/model`
  chính xác, chẳng hạn như `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback
  đang hoạt động.
- `registerMemoryEmbeddingProvider` đã ngừng khuyến nghị. Các provider nhúng mới
  nên dùng `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`.
- Các provider dành riêng cho bộ nhớ hiện có tiếp tục hoạt động trong giai đoạn
  di chuyển, nhưng báo cáo kiểm tra Plugin sẽ ghi nhận đây là nợ tương thích đối với
  các Plugin không được đóng gói sẵn.

### Sự kiện và vòng đời

| Phương thức                                   | Chức năng                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu          |
| `api.onConversationBindingResolved(handler)` | Callback liên kết cuộc hội thoại |

Xem [Plugin hooks](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến, và ngữ nghĩa
guard.

### Ngữ nghĩa quyết định của hook

`before_install` là một hook vòng đời runtime Plugin, không phải bề mặt chính sách
cài đặt của operator. Dùng `security.installPolicy` khi quyết định cho phép/chặn phải
bao phủ các đường dẫn cài đặt hoặc cập nhật được hỗ trợ bởi CLI và Gateway.

- `before_tool_call`: trả về `{ block: true }` là trạng thái kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là trạng thái kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là trạng thái kết thúc. Khi bất kỳ handler nào nhận xử lý dispatch, các handler có độ ưu tiên thấp hơn và đường dẫn dispatch model mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là trạng thái kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường `threadId` có kiểu khi bạn cần định tuyến luồng/chủ đề gửi đến. Giữ `metadata` cho các phần bổ sung dành riêng cho kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback về `metadata` dành riêng cho kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì dựa vào các hook nội bộ `gateway:startup`.
- `cron_changed`: quan sát các thay đổi vòng đời Cron do Gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho các kiểm tra đến hạn và việc thực thi.

### Trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản Plugin (tùy chọn)                                                                   |
| `api.description`        | `string?`                 | Mô tả Plugin (tùy chọn)                                                               |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Thư mục gốc Plugin (tùy chọn)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot cấu hình hiện tại (snapshot runtime trong bộ nhớ đang hoạt động khi có sẵn)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/vi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước entry đầy đủ |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc Plugin                                                        |

## Quy ước module nội bộ

Trong Plugin của bạn, dùng các file barrel cục bộ cho import nội bộ:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Không bao giờ import Plugin của chính bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin đóng gói sẵn được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, và các file entry công khai tương tự) ưu tiên
snapshot cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có snapshot runtime,
chúng fallback về file cấu hình đã phân giải trên đĩa.
Facade Plugin đóng gói sẵn trong package nên được tải thông qua các loader facade Plugin của
OpenClaw; import trực tiếp từ `dist/extensions/...` bỏ qua manifest
và các kiểm tra sidecar runtime mà các bản cài đặt theo package dùng cho mã do Plugin sở hữu.

Các Plugin provider có thể cung cấp một barrel hợp đồng hẹp cục bộ theo Plugin khi một
helper có chủ đích dành riêng cho provider và chưa thuộc về một đường dẫn con SDK chung.
Ví dụ đóng gói sẵn:

- **Anthropic**: bề mặt công khai `api.ts` / `contract-api.ts` cho các helper stream
  beta-header Claude và `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các trình dựng provider,
  helper model mặc định, và trình dựng provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất trình dựng provider
  cùng các helper onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một helper thật sự được chia sẻ, hãy nâng nó lên một đường dẫn con SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một
  bề mặt định hướng theo khả năng khác thay vì ghép chặt hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/vi/plugins/sdk-runtime">
    Tham chiếu đầy đủ cho namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest, và schema cấu hình.
  </Card>
  <Card title="Testing" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển từ các bề mặt đã ngừng khuyến nghị.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình khả năng.
  </Card>
</CardGroup>
