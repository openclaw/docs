---
read_when:
    - Bạn cần biết nên import từ subpath SDK nào
    - Bạn muốn tài liệu tham khảo cho tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một export SDK cụ thể
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham khảo API đăng ký và kiến trúc SDK
title: Tổng quan Plugin SDK
x-i18n:
    generated_at: "2026-07-01T18:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin là hợp đồng có kiểu giữa Plugin và lõi. Trang này là tài liệu
tham chiếu cho **những gì cần import** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả Plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Với ứng dụng bên ngoài, script, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
  muốn chạy tác tử thông qua Gateway, hãy dùng
  [Tích hợp Gateway cho ứng dụng bên ngoài](/vi/gateway/external-apps) thay thế.
</Note>

<Tip>
Bạn đang tìm hướng dẫn thực hiện? Bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins), dùng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho Plugin kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho Plugin nhà cung cấp, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho backend CLI AI cục bộ, và [Hook Plugin](/vi/plugins/hooks) cho Plugin hook công cụ hoặc vòng đời.
</Tip>

## Quy ước import

Luôn import từ một subpath cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi subpath là một mô-đun nhỏ, khép kín. Điều này giúp khởi động nhanh và
ngăn các vấn đề phụ thuộc vòng. Với các helper entry/build dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các helper dùng chung như
`buildChannelConfigSchema`.

Với cấu hình kênh, hãy công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
dành cho các primitive schema dùng chung và builder tổng quát. Các Plugin tích hợp
của OpenClaw dùng `plugin-sdk/bundled-channel-config-schema` cho các schema
kênh tích hợp được giữ lại. Các export tương thích đã ngừng khuyến nghị vẫn nằm trên
`plugin-sdk/channel-config-schema-legacy`; không subpath schema tích hợp nào là
mẫu cho Plugin mới.

<Warning>
  Không import các seam tiện ích mang nhãn nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các Plugin tích hợp kết hợp các subpath SDK tổng quát bên trong barrel `api.ts` /
  `runtime-api.ts` của chính chúng; người dùng lõi nên dùng các barrel cục bộ của Plugin đó
  hoặc thêm một hợp đồng SDK tổng quát hẹp khi nhu cầu thật sự
  xuyên kênh.

Một tập nhỏ các seam helper của Plugin tích hợp vẫn xuất hiện trong bản đồ export
được tạo khi chúng có theo dõi việc sử dụng của chủ sở hữu. Chúng chỉ tồn tại để
bảo trì Plugin tích hợp và không được khuyến nghị làm đường dẫn import cho
Plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ làm facade tương thích đã ngừng khuyến nghị cho việc sử dụng của chủ sở hữu được theo dõi. Không
sao chép các đường dẫn import đó vào Plugin mới; thay vào đó hãy dùng helper runtime được tiêm vào và
các subpath SDK kênh tổng quát.
</Warning>

## Tham chiếu subpath

SDK Plugin được phơi bày dưới dạng một tập các subpath hẹp được nhóm theo khu vực (entry Plugin,
kênh, nhà cung cấp, xác thực, runtime, năng lực, bộ nhớ và helper
Plugin tích hợp được dành riêng). Để xem danh mục đầy đủ, được nhóm và liên kết, xem
[Subpath SDK Plugin](/vi/plugins/sdk-subpaths).

Kho entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; export gói được tạo từ
tập con công khai sau khi trừ các subpath kiểm thử/nội bộ cục bộ của repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng export công khai. Các subpath công khai
đã ngừng khuyến nghị đủ cũ và không được mã production của extension tích hợp sử dụng
được theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các barrel
re-export đã ngừng khuyến nghị phạm vi rộng được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký năng lực

| Phương thức                                      | Nội dung đăng ký                         |
| ------------------------------------------------ | ---------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                   |
| `api.registerAgentHarness(...)`                  | Trình thực thi tác tử cấp thấp thử nghiệm |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ              |
| `api.registerChannel(...)`                       | Kênh nhắn tin                            |
| `api.registerEmbeddingProvider(...)`             | Nhà cung cấp embedding vector tái sử dụng |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT   |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm realtime dạng streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại realtime hai chiều           |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video        |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                             |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                 |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp fetch / scrape web          |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                             |

Nhà cung cấp embedding được đăng ký bằng `api.registerEmbeddingProvider(...)` cũng phải
được liệt kê trong `contracts.embeddingProviders` trong manifest Plugin. Đây
là bề mặt embedding tổng quát cho việc tạo vector tái sử dụng. Tìm kiếm bộ nhớ
có thể tiêu thụ bề mặt nhà cung cấp tổng quát này. Seam cũ hơn
`api.registerMemoryEmbeddingProvider(...)` và
`contracts.memoryEmbeddingProviders` là tương thích đã ngừng khuyến nghị trong khi
các nhà cung cấp riêng cho bộ nhớ hiện có di chuyển.

Nhà cung cấp riêng cho bộ nhớ vẫn phơi bày runtime `batchEmbed(...)` sẽ ở lại trên
hợp đồng batch theo từng tệp hiện có, trừ khi runtime của chúng đặt rõ
`sourceWideBatchEmbed: true`. Tùy chọn opt-in đó cho phép host bộ nhớ gửi các chunk từ
nhiều tệp bộ nhớ bẩn và nguồn đã bật trong một lệnh gọi `batchEmbed(...)`
đến giới hạn batch của host. Bộ điều hợp batch tải lên tệp yêu cầu JSONL cũng phải
chia tác vụ nhà cung cấp trước cả giới hạn kích thước tải lên lẫn giới hạn số lượng yêu cầu.
Nhà cung cấp phải trả về một embedding cho mỗi chunk đầu vào theo cùng thứ tự với
`batch.chunks`; bỏ qua cờ này khi nhà cung cấp mong đợi batch cục bộ theo tệp hoặc
không thể bảo toàn thứ tự đầu vào trên một tác vụ rộng theo nguồn lớn hơn.

### Công cụ và lệnh

Dùng [`defineToolPlugin`](/vi/plugins/tool-plugins) cho Plugin chỉ có công cụ đơn giản
với tên công cụ cố định. Dùng trực tiếp `api.registerTool(...)` cho Plugin hỗn hợp
hoặc đăng ký công cụ hoàn toàn động.

| Phương thức                     | Nội dung đăng ký                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Công cụ tác tử (bắt buộc hoặc `{ optional: true }`) |
| `api.registerCommand(def)`      | Lệnh tùy chỉnh (bỏ qua LLM)                   |

Lệnh Plugin có thể đặt `agentPromptGuidance` khi tác tử cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ văn bản đó nói về chính lệnh; không thêm
chính sách riêng cho nhà cung cấp hoặc Plugin vào các builder prompt lõi.

Các mục hướng dẫn có thể là chuỗi legacy, áp dụng cho mọi bề mặt prompt, hoặc
mục có cấu trúc:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` có cấu trúc có thể bao gồm `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, hoặc `subagent`. `pi_main` vẫn là alias đã ngừng khuyến nghị
cho `openclaw_main`. Bỏ qua `surfaces` cho hướng dẫn chủ ý áp dụng mọi bề mặt. Không
truyền mảng `surfaces` rỗng; nó bị từ chối để việc mất phạm vi vô tình không
trở thành văn bản prompt toàn cục.

Chỉ dẫn developer gốc của app-server Codex nghiêm ngặt hơn các bề mặt prompt
khác: chỉ hướng dẫn được giới hạn rõ vào `codex_app_server` mới được nâng vào
lane ưu tiên cao hơn đó. Hướng dẫn dạng chuỗi legacy và hướng dẫn có cấu trúc không giới hạn phạm vi
vẫn khả dụng cho các bề mặt prompt không phải Codex để tương thích.

### Hạ tầng

| Phương thức                                    | Nội dung đăng ký                         |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook sự kiện                             |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                    |
| `api.registerGatewayMethod(name, handler)`     | Phương thức RPC Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | Bộ quảng bá khám phá Gateway cục bộ      |
| `api.registerCli(registrar, opts?)`            | Lệnh con CLI                             |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI tính năng Node dưới `openclaw nodes` |
| `api.registerService(service)`                 | Dịch vụ nền                              |
| `api.registerInteractiveHandler(registration)` | Handler tương tác                        |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware kết quả công cụ runtime       |
| `api.registerMemoryPromptSupplement(builder)`  | Phần prompt bổ sung liền kề bộ nhớ       |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus tìm kiếm/đọc bộ nhớ bổ sung       |

### Hook host cho Plugin quy trình làm việc

Hook host là các seam SDK cho Plugin cần tham gia vào vòng đời host
thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
các hợp đồng tổng quát; Plan Mode có thể dùng chúng, nhưng quy trình phê duyệt,
cổng chính sách workspace, bộ giám sát nền, trình hướng dẫn thiết lập và Plugin đồng hành UI
cũng có thể dùng.

| Phương thức | Hợp đồng mà nó sở hữu |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)` | Trạng thái phiên thuộc sở hữu Plugin, tương thích JSON, được chiếu qua các phiên Gateway |
| `api.session.workflow.enqueueNextTurnInjection(...)` | Ngữ cảnh bền vững đúng một lần được chèn vào lượt agent tiếp theo cho một phiên |
| `api.registerTrustedToolPolicy(...)` | Chính sách công cụ tin cậy trước Plugin được kiểm soát bằng manifest, có thể chặn hoặc ghi lại tham số công cụ |
| `api.registerToolMetadata(...)` | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ |
| `api.registerCommand(...)` | Lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true` hoặc `suppressReply: true`; lệnh gốc Discord hỗ trợ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)` | Bộ mô tả đóng góp UI điều khiển cho các bề mặt phiên, công cụ, lượt chạy hoặc cài đặt |
| `api.lifecycle.registerRuntimeLifecycle(...)` | Callback dọn dẹp cho tài nguyên runtime thuộc sở hữu Plugin trên các đường dẫn đặt lại/xóa/tải lại |
| `api.agent.events.registerAgentEventSubscription(...)` | Đăng ký sự kiện đã được làm sạch cho trạng thái workflow và trình giám sát |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Trạng thái tạm của Plugin theo từng lượt chạy, được xóa trong vòng đời lượt chạy kết thúc |
| `api.session.workflow.registerSessionSchedulerJob(...)` | Siêu dữ liệu dọn dẹp cho job scheduler thuộc sở hữu Plugin; không lên lịch công việc hoặc tạo bản ghi tác vụ |
| `api.session.workflow.sendSessionAttachment(...)` | Gửi tệp đính kèm chỉ dành cho Plugin đóng gói, qua host trung gian, đến tuyến phiên gửi trực tiếp đang hoạt động |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Lượt phiên được lên lịch dựa trên Cron chỉ dành cho Plugin đóng gói, kèm dọn dẹp theo thẻ |
| `api.session.controls.registerSessionAction(...)` | Hành động phiên có kiểu mà client có thể gửi qua Gateway |

Sử dụng các namespace được nhóm cho mã Plugin mới:

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

Các phương thức phẳng tương đương vẫn có sẵn dưới dạng alias tương thích
đã ngừng khuyến nghị cho các Plugin hiện có. Không thêm mã Plugin mới gọi
trực tiếp `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, hoặc
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là tiện ích theo phạm vi phiên nằm trên scheduler
Cron của Gateway. Cron sở hữu thời điểm chạy và tạo bản ghi tác vụ nền khi
lượt chạy thực thi; Plugin SDK chỉ ràng buộc phiên đích, cách đặt tên thuộc
sở hữu Plugin và việc dọn dẹp. Sử dụng `api.runtime.tasks.managedFlows` bên
trong lượt chạy đã lên lịch khi chính công việc cần trạng thái Task Flow
nhiều bước bền vững.

Các hợp đồng chủ ý tách quyền hạn:

- Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả UI, lệnh, siêu
  dữ liệu công cụ, phần chèn vào lượt tiếp theo và hook thông thường.
- Chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông
  thường và được host tin cậy. Chính sách đóng gói chạy trước; chính sách từ
  Plugin đã cài đặt cần được bật rõ ràng cùng với id cục bộ của chúng trong
  `contracts.trustedToolPolicies`, rồi chạy tiếp theo theo thứ tự tải Plugin.
  Id chính sách được giới hạn theo Plugin đăng ký.
- Quyền sở hữu lệnh dành riêng chỉ dành cho Plugin đóng gói. Plugin bên ngoài
  nên dùng tên lệnh hoặc alias riêng của mình.
- `allowPromptInjection=false` tắt các hook làm thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ, và
  `enqueueNextTurnInjection`.

Ví dụ về người tiêu thụ không thuộc Plan:

| Kiểu mẫu Plugin | Hook được sử dụng |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow phê duyệt | Phần mở rộng phiên, tiếp tục lệnh, chèn vào lượt tiếp theo, bộ mô tả UI |
| Cổng chính sách ngân sách/workspace | Chính sách công cụ tin cậy, siêu dữ liệu công cụ, phép chiếu phiên |
| Trình giám sát vòng đời nền | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, quyền sở hữu/dọn dẹp scheduler phiên, đóng góp prompt Heartbeat, bộ mô tả UI |
| Trình hướng dẫn thiết lập hoặc onboarding | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả UI điều khiển |

<Note>
  Các namespace quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên là `operator.admin`, ngay cả khi một Plugin cố gắng gán
  phạm vi phương thức gateway hẹp hơn. Ưu tiên tiền tố riêng theo Plugin cho
  các phương thức thuộc sở hữu Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Plugin đóng gói và Plugin đã cài đặt được bật rõ ràng với các hợp đồng
  manifest khớp có thể dùng `api.registerAgentToolResultMiddleware(...)` khi
  cần ghi lại kết quả công cụ sau khi thực thi và trước khi runtime đưa kết quả
  đó trở lại mô hình. Đây là điểm nối trung lập runtime, đáng tin cậy cho các
  bộ giảm đầu ra bất đồng bộ như tokenjuice.

Plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng runtime
được nhắm tới, ví dụ `["openclaw", "codex"]`. Plugin đã cài đặt mà không có
hợp đồng đó, hoặc không được bật rõ ràng, không thể đăng ký middleware này;
giữ các hook Plugin OpenClaw thông thường cho công việc không cần thời điểm
kết quả công cụ trước mô hình. Đường dẫn đăng ký factory phần mở rộng cũ chỉ
dành cho embedded runner đã bị xóa.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép Plugin quảng bá Gateway
đang hoạt động trên một transport khám phá cục bộ như mDNS/Bonjour. OpenClaw
gọi service trong lúc khởi động Gateway khi khám phá cục bộ được bật, truyền
các cổng Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, rồi gọi handler
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

Plugin khám phá Gateway không được xem các giá trị TXT được quảng bá là bí mật
hoặc xác thực. Khám phá là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu niềm tin.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng thuộc sở hữu của registrar
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích dùng cho trợ giúp CLI,
  định tuyến và đăng ký CLI Plugin lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với tính năng paired-node, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là wrapper nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành tính năng node thuộc sở hữu Plugin một cách
rõ ràng.

Nếu bạn muốn một lệnh Plugin vẫn được tải lười trong đường dẫn CLI gốc thông
thường, hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất mà
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

Chỉ dùng riêng `commands` khi bạn không cần đăng ký CLI gốc lười. Đường dẫn
tương thích eager đó vẫn được hỗ trợ, nhưng nó không cài đặt placeholder dựa
trên descriptor cho việc tải lười tại thời điểm phân tích.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép Plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `claude-cli` hoặc `my-cli`.

- Backend `id` trở thành tiền tố provider trong các tham chiếu mô hình như `my-cli/gpt-5`.
- Backend `config` dùng cùng hình dạng với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn được ưu tiên. OpenClaw gộp `agents.defaults.cliBackends.<id>` lên trên
  mặc định của Plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi một backend cần viết lại tương thích sau khi gộp
  (ví dụ chuẩn hóa các hình dạng cờ cũ).
- Dùng `resolveExecutionArgs` cho các viết lại argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn ánh xạ mức suy nghĩ của OpenClaw sang một cờ effort
  gốc. Hook nhận `ctx.executionMode`; dùng `"side-question"` để thêm
  các cờ cô lập gốc của backend cho các lệnh gọi `/btw` tạm thời. Nếu các cờ đó
  vô hiệu hóa đáng tin cậy các công cụ gốc cho một CLI vốn luôn bật, hãy khai báo
  thêm `sideQuestionToolMode: "disabled"`.

Để xem hướng dẫn biên soạn đầu cuối, xem
[các Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Các khe độc quyền

| Phương thức                                | Nội dung đăng ký                                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lần một công cụ hoạt động). Callback vòng đời nhận `runtimeSettings` khi host có thể cung cấp chẩn đoán mô hình/provider/chế độ; các engine nghiêm ngặt cũ hơn được thử lại mà không có khóa đó. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Bộ dựng phần prompt bộ nhớ                                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Bộ phân giải kế hoạch flush bộ nhớ                                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime bộ nhớ                                                                                                                                                                                                     |

### Adapter nhúng bộ nhớ đã ngừng khuyến nghị

| Phương thức                                    | Nội dung đăng ký                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter nhúng bộ nhớ cho Plugin đang hoạt động |

- `registerMemoryCapability` là API Plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể cung cấp `publicArtifacts.listArtifacts(...)`
  để các Plugin đồng hành có thể tiêu thụ các tạo tác bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng của một
  Plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, và
  `registerMemoryRuntime` là các API Plugin bộ nhớ độc quyền tương thích với di sản.
- `MemoryFlushPlan.model` có thể ghim lượt flush vào đúng tham chiếu `provider/model`,
  chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi fallback đang hoạt động.
- `registerMemoryEmbeddingProvider` đã ngừng khuyến nghị. Các provider nhúng mới
  nên dùng `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`.
- Các provider riêng cho bộ nhớ hiện có tiếp tục hoạt động trong cửa sổ di chuyển,
  nhưng báo cáo kiểm tra Plugin sẽ ghi nhận đây là nợ tương thích đối với
  các Plugin không được đóng gói sẵn.

### Sự kiện và vòng đời

| Phương thức                                  | Chức năng                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu         |
| `api.onConversationBindingResolved(handler)` | Callback ràng buộc hội thoại  |

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến, và ngữ nghĩa
guard.

### Ngữ nghĩa quyết định của hook

`before_install` là hook vòng đời runtime Plugin, không phải bề mặt chính sách
cài đặt của operator. Dùng `security.installPolicy` khi quyết định cho phép/chặn phải
bao phủ các đường dẫn cài đặt hoặc cập nhật dựa trên CLI và Gateway.

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ handler nào nhận xử lý dispatch, các handler có độ ưu tiên thấp hơn và đường dẫn dispatch mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ handler nào đặt giá trị này, các handler có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường có kiểu `threadId` khi bạn cần định tuyến thread/chủ đề đầu vào. Giữ `metadata` cho các phần bổ sung riêng của kênh.
- `message_sending`: dùng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi fallback về `metadata` riêng của kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` cho trạng thái khởi động do gateway sở hữu thay vì dựa vào các hook nội bộ `gateway:startup`.
- `cron_changed`: quan sát các thay đổi vòng đời cron do gateway sở hữu. Dùng `event.job?.state?.nextRunAtMs` và `ctx.getCron?.()` khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho các kiểm tra đến hạn và thực thi.

### Các trường đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                         |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                     |
| `api.name`               | `string`                  | Tên hiển thị                                                                                  |
| `api.version`            | `string?`                 | Phiên bản Plugin (tùy chọn)                                                                   |
| `api.description`        | `string?`                 | Mô tả Plugin (tùy chọn)                                                                       |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                        |
| `api.rootDir`            | `string?`                 | Thư mục gốc Plugin (tùy chọn)                                                                 |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có sẵn)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình riêng của Plugin từ `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [Trợ giúp runtime](/vi/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger theo phạm vi (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước entry đầy đủ   |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với gốc Plugin                                                   |

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
  từ mã production. Định tuyến import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin đóng gói sẵn được tải bằng facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, và các tệp entry công khai tương tự) ưu tiên
ảnh chụp cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có ảnh chụp
runtime nào, chúng fallback về tệp cấu hình đã phân giải trên ổ đĩa.
Facade của Plugin đóng gói sẵn đã đóng gói nên được tải thông qua các loader facade
Plugin của OpenClaw; import trực tiếp từ `dist/extensions/...` bỏ qua manifest
và các kiểm tra sidecar runtime mà bản cài đặt đã đóng gói dùng cho mã do Plugin sở hữu.

Các Plugin provider có thể cung cấp một barrel hợp đồng cục bộ hẹp của Plugin khi một
trợ giúp được chủ ý dành riêng cho provider và chưa thuộc về một subpath SDK chung.
Ví dụ đóng gói sẵn:

- **Anthropic**: seam `api.ts` / `contract-api.ts` công khai cho các trợ giúp stream
  beta-header Claude và `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các bộ dựng provider,
  trợ giúp mô hình mặc định, và bộ dựng provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất bộ dựng provider
  cùng các trợ giúp onboarding/cấu hình.

<Warning>
  Mã production của extension cũng nên tránh import `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trợ giúp thật sự được chia sẻ, hãy nâng nó lên một subpath SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, hoặc một
  bề mặt hướng theo khả năng khác thay vì ghép chặt hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm entry" icon="door-open" href="/vi/plugins/sdk-entrypoints">
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
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc sâu và mô hình khả năng.
  </Card>
</CardGroup>
