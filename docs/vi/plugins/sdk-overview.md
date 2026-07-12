---
read_when:
    - Bạn cần biết cần nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo về tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về SDK Plugin
x-i18n:
    generated_at: "2026-07-12T08:17:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin là hợp đồng có kiểu giữa các plugin và lõi. Trang này là tài liệu
tham chiếu về **nội dung cần nhập** và **nội dung bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Đối với ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và
  tiện ích mở rộng IDE muốn chạy tác tử thông qua Gateway, hãy sử dụng
  [Tích hợp Gateway cho ứng dụng bên ngoài](/vi/gateway/external-apps).
</Note>

<Tip>
Bạn đang tìm hướng dẫn thực hành? Hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins). Sử dụng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho các kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho các nhà cung cấp mô hình, [Plugin phần phụ trợ CLI](/vi/plugins/cli-backend-plugins) cho phần phụ trợ CLI AI cục bộ, [Plugin bộ khung tác tử](/vi/plugins/sdk-agent-harness) cho trình thực thi tác tử gốc và [Hook Plugin](/vi/plugins/hooks) cho hook công cụ hoặc vòng đời.
</Tip>

## Quy ước nhập

Luôn nhập từ một đường dẫn con cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi đường dẫn con là một mô-đun nhỏ, độc lập. Cách này giúp khởi động nhanh và
ngăn các vấn đề về phụ thuộc vòng. Đối với các trình trợ giúp điểm vào/bản dựng
dành riêng cho kênh, ưu tiên `openclaw/plugin-sdk/channel-core`; dành
`openclaw/plugin-sdk/core` cho bề mặt tổng quát rộng hơn và các trình trợ giúp
dùng chung như `buildChannelConfigSchema`.

Đối với cấu hình kênh, hãy công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Đường dẫn con
`plugin-sdk/channel-config-schema` dành cho các thành phần nguyên thủy của
schema dùng chung và trình tạo tổng quát. Các plugin đi kèm OpenClaw sử dụng
`plugin-sdk/bundled-channel-config-schema` cho các schema kênh đi kèm được giữ
lại. Các bản xuất tương thích đã lỗi thời vẫn còn tại
`plugin-sdk/channel-config-schema-legacy`; không đường dẫn con schema đi kèm
nào là mẫu cho plugin mới.

<Warning>
  Không nhập các điểm nối tiện ích mang thương hiệu nhà cung cấp hoặc kênh (ví
  dụ `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`,
  `.../whatsapp`). Các plugin đi kèm kết hợp những đường dẫn con SDK tổng quát
  bên trong các barrel `api.ts` / `runtime-api.ts` của riêng chúng; người dùng
  lõi nên sử dụng các barrel cục bộ của plugin đó hoặc bổ sung một hợp đồng SDK
  tổng quát có phạm vi hẹp khi nhu cầu thực sự áp dụng cho nhiều kênh.

Một tập nhỏ các điểm nối trợ giúp cho plugin đi kèm vẫn xuất hiện trong bản đồ
xuất được tạo khi chúng có hoạt động sử dụng được theo dõi từ chủ sở hữu. Chúng
chỉ tồn tại để bảo trì plugin đi kèm và không phải là đường dẫn nhập được khuyến
nghị cho plugin bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích đã lỗi thời cho hoạt động sử dụng được
theo dõi từ chủ sở hữu. Không sao chép các đường dẫn nhập đó vào plugin mới;
thay vào đó, hãy sử dụng các trình trợ giúp runtime được chèn và các đường dẫn
con SDK kênh tổng quát.
</Warning>

## Tham chiếu đường dẫn con

SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con có phạm vi hẹp,
được nhóm theo lĩnh vực (điểm vào plugin, kênh, nhà cung cấp, xác thực, runtime,
khả năng, bộ nhớ và các trình trợ giúp dành riêng cho plugin đi kèm). Để xem
toàn bộ danh mục — đã được nhóm và liên kết — hãy xem
[Các đường dẫn con của SDK Plugin](/vi/plugins/sdk-subpaths).

Danh mục điểm vào của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các bản xuất gói được tạo từ tập con
công khai sau khi loại trừ các đường dẫn con kiểm thử/nội bộ chỉ dành cho kho
mã, được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng bản xuất công khai. Các đường dẫn
con công khai đã lỗi thời, đủ cũ và không được mã sản xuất của tiện ích mở rộng
đi kèm sử dụng, được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các barrel tái xuất
rộng đã lỗi thời được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Hàm gọi lại `register(api)` nhận một đối tượng `OpenClawPluginApi` có các phương
thức sau:

### Đăng ký khả năng

| Phương thức                                      | Nội dung đăng ký                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Phiên thuê vòng đời của trình thực thi đám mây                                      |
| `api.registerModelCatalogProvider(...)`          | Các hàng danh mục mô hình để tạo văn bản và phương tiện                             |
| `api.registerAgentHarness(...)`                  | Trình thực thi tác tử gốc [thử nghiệm](/vi/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Phần phụ trợ suy luận CLI cục bộ                                                    |
| `api.registerChannel(...)`                       | Kênh nhắn tin                                                                        |
| `api.registerEmbeddingProvider(...)`             | Nhà cung cấp nhúng véc-tơ có thể tái sử dụng                                        |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT                                              |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng luồng                                                   |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực song công                                                |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video                                                   |
| `api.registerTranscriptSourceProvider(...)`      | Nguồn bản chép lời cuộc họp trực tiếp hoặc được nhập                                |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                                                                         |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                                                             |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                                                            |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp tìm nạp / thu thập dữ liệu web                                         |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                                                                         |
| `api.registerCompactionProvider(...)`            | Phần phụ trợ Compaction bản chép lời có thể thay thế                                |

Các nhà cung cấp trình thực thi cũng phải khai báo mã định danh của mình trong `contracts.workerProviders`.
Lõi lưu bền vững ý định trước khi gọi `provision(profile, operationId)`. Nhà cung cấp xác thực thiết lập trước khi phân bổ bên ngoài và ném `WorkerProviderError` khi hồ sơ bị từ chối vĩnh viễn. `provision` phải tiếp nhận cùng một phiên thuê khi mã định danh thao tác lặp lại.
Lõi lưu bền vững các thiết lập hồ sơ đã xác thực cùng với phiên thuê và cung cấp ảnh chụp đó cho `destroy({ leaseId, profile })`, vốn phải có tính lũy đẳng, và `inspect({ leaseId, profile })`, vốn trả về `active`, `destroyed` hoặc `unknown`. Điều này cho phép nhà cung cấp định tuyến các lệnh gọi vòng đời sau khi Gateway khởi động lại hoặc hồ sơ có tên bị xóa. Các điểm cuối SSH sử dụng `SecretRef` cho `keyRef`, không bao giờ dùng trực tiếp dữ liệu khóa, và bao gồm `hostKey` từ đầu ra cấp phát đáng tin cậy theo đúng định dạng `algorithm base64`, không có tên máy chủ hoặc chú thích. Lõi ghim `hostKey` và không bao giờ tin cậy khóa từ lần kết nối đầu tiên. Nhà cung cấp tạo `keyRef` động có thể triển khai `resolveSshIdentity({ leaseId, profile, keyRef })`; khi hiện diện, trình phân giải đó có thẩm quyền quyết định, còn các nhà cung cấp không có trình phân giải này sử dụng trình phân giải bí mật tổng quát đã cấu hình.
Các nhà cung cấp có phiên thuê có thể gia hạn cũng có thể triển khai `renew(leaseId)`.
`inspect` phải ném lỗi khi gặp thất bại tạm thời hoặc không xác định; chỉ trả về `unknown` khi sự vắng mặt đã được xác nhận có thẩm quyền. Lõi đánh dấu một bản ghi cục bộ đang hoạt động là mồ côi, hoặc coi sự vắng mặt là đã hoàn tất tháo dỡ sau một yêu cầu hủy đã được lưu bền vững.

Các nhà cung cấp nhúng được đăng ký bằng `api.registerEmbeddingProvider(...)`
cũng phải được liệt kê trong `contracts.embeddingProviders` ở tệp kê khai
plugin. Đây là bề mặt nhúng tổng quát để tạo véc-tơ có thể tái sử dụng. Tìm kiếm
bộ nhớ có thể sử dụng bề mặt nhà cung cấp tổng quát này. Điểm nối cũ hơn
`api.registerMemoryEmbeddingProvider(...)` và
`contracts.memoryEmbeddingProviders` là cơ chế tương thích đã lỗi thời trong
khi các nhà cung cấp dành riêng cho bộ nhớ hiện có chuyển đổi.

Các nhà cung cấp dành riêng cho bộ nhớ vẫn cung cấp `batchEmbed(...)` ở runtime
sẽ tiếp tục dùng hợp đồng xử lý theo lô trên từng tệp hiện có, trừ khi runtime
của chúng đặt rõ ràng `sourceWideBatchEmbed: true`. Cơ chế chọn tham gia này cho
phép máy chủ bộ nhớ gửi các đoạn từ nhiều tệp bộ nhớ đã thay đổi và nhiều nguồn
đang bật trong một lệnh gọi `batchEmbed(...)`, trong phạm vi giới hạn lô của máy
chủ. Các bộ điều hợp theo lô tải lên tệp yêu cầu JSONL phải chia tác vụ của nhà
cung cấp trước khi đạt giới hạn kích thước tải lên cũng như giới hạn số lượng
yêu cầu. Nhà cung cấp phải trả về một phần nhúng cho mỗi đoạn đầu vào theo cùng
thứ tự với `batch.chunks`; bỏ cờ này khi nhà cung cấp yêu cầu các lô cục bộ theo
tệp hoặc không thể duy trì thứ tự đầu vào trong một tác vụ rộng hơn trên toàn
nguồn.

### Công cụ và lệnh

Sử dụng [`defineToolPlugin`](/vi/plugins/tool-plugins) cho các plugin đơn giản chỉ
có công cụ với tên công cụ cố định. Sử dụng trực tiếp
`api.registerTool(...)` cho plugin hỗn hợp hoặc đăng ký công cụ hoàn toàn động.

| Phương thức                             | Nội dung đăng ký                                                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`         | Công cụ tác tử (bắt buộc hoặc `{ optional: true }`)                                                                                                                   |
| `api.registerCommand(def)`              | Lệnh tùy chỉnh (bỏ qua LLM)                                                                                                                                          |
| `api.registerNodeHostCommand(command)` | Lệnh do `openclaw node run` xử lý; siêu dữ liệu `agentTool` tùy chọn có thể cung cấp lệnh này dưới dạng công cụ mà tác tử có thể thấy trong khi Node được kết nối |

Các lệnh plugin có thể đặt `agentPromptGuidance` khi tác tử cần một gợi ý định
tuyến ngắn do lệnh sở hữu. Chỉ giữ nội dung đó liên quan đến chính lệnh; không
thêm chính sách dành riêng cho nhà cung cấp hoặc plugin vào các trình tạo lời
nhắc của lõi.

Các mục hướng dẫn có thể là chuỗi kiểu cũ, áp dụng cho mọi bề mặt lời nhắc,
hoặc các mục có cấu trúc:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` có cấu trúc có thể bao gồm `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` hoặc `subagent`. `pi_main` vẫn là bí danh đã lỗi
thời của `openclaw_main`. Bỏ qua `surfaces` khi chủ ý áp dụng hướng dẫn cho mọi
bề mặt. Không truyền mảng `surfaces` rỗng; mảng này bị từ chối để việc vô tình
mất phạm vi không biến thành văn bản lời nhắc toàn cục.

Chỉ dẫn dành cho nhà phát triển của máy chủ ứng dụng Codex gốc nghiêm ngặt hơn
các bề mặt lời nhắc khác: chỉ hướng dẫn được giới hạn phạm vi rõ ràng cho
`codex_app_server` mới được nâng lên làn ưu tiên cao hơn đó. Hướng dẫn chuỗi kiểu
cũ và hướng dẫn có cấu trúc không giới hạn phạm vi vẫn khả dụng cho các bề mặt
lời nhắc không phải Codex để duy trì khả năng tương thích.

Các lệnh trên máy chủ Node chạy trên máy chủ Node đã kết nối, không chạy bên trong tiến trình Gateway. Nếu có `agentTool`, Node sẽ công bố một bộ mô tả sau khi kết nối Gateway thành công; Gateway chỉ cung cấp bộ mô tả đó cho các lượt chạy của tác tử trong khi Node ấy đang kết nối và chỉ khi `command` của bộ mô tả nằm trong phạm vi lệnh được phê duyệt của Node. Đặt `agentTool.defaultPlatforms` để đưa một lệnh không nguy hiểm vào danh sách cho phép lệnh Node mặc định; nếu không, phải có `gateway.nodes.allowCommands` rõ ràng hoặc một chính sách gọi Node. `agentTool.name` phải an toàn đối với nhà cung cấp: bắt đầu bằng một chữ cái, chỉ sử dụng chữ cái, chữ số, dấu gạch dưới hoặc dấu gạch nối và không vượt quá 64 ký tự. Các công cụ Node dựa trên MCP có thể đặt siêu dữ liệu `agentTool.mcp` để các bề mặt danh mục và tìm kiếm công cụ có thể hiển thị danh tính máy chủ/công cụ MCP từ xa, nhưng việc thực thi vẫn đi qua lệnh Node đã được quảng bá.

### Hạ tầng

| Phương thức                                      | Nội dung đăng ký                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook sự kiện                                                      |
| `api.registerHttpRoute(params)`                 | Điểm cuối HTTP của Gateway                                        |
| `api.registerGatewayMethod(name, handler)`      | Phương thức RPC của Gateway                                       |
| `api.registerGatewayDiscoveryService(service)`  | Bộ quảng bá khám phá Gateway cục bộ                               |
| `api.registerCli(registrar, opts?)`             | Lệnh con CLI                                                      |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI tính năng Node dưới `openclaw nodes`                           |
| `api.registerService(service)`                  | Dịch vụ nền                                                       |
| `api.registerInteractiveHandler(registration)`  | Trình xử lý tương tác                                             |
| `api.registerAgentToolResultMiddleware(...)`    | Phần mềm trung gian kết quả công cụ trong thời gian chạy           |
| `api.registerMemoryPromptSupplement(builder)`   | Phần prompt bổ sung liền kề bộ nhớ                                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | Kho ngữ liệu bổ sung để tìm kiếm/đọc bộ nhớ                        |
| `api.registerHostedMediaResolver(resolver)`     | Bộ phân giải URL phương tiện được lưu trữ theo kiểu trình duyệt    |
| `api.registerTextTransforms(transforms)`        | Các phép viết lại văn bản tương thích prompt/tin nhắn do Plugin sở hữu |
| `api.registerConfigMigration(migrate)`          | Di chuyển cấu hình nhẹ chạy trước khi tải thời gian chạy của Plugin |
| `api.registerMigrationProvider(provider)`       | Trình nhập cho `openclaw migrate`                                  |
| `api.registerAutoEnableProbe(probe)`            | Bộ thăm dò cấu hình có thể tự động bật Plugin này                  |
| `api.registerReload(registration)`              | Chính sách tiền tố cấu hình khởi động lại/tải nóng/không làm gì để xử lý tải lại |
| `api.registerNodeHostCommand(command)`          | Trình xử lý lệnh được cung cấp cho các Node đã ghép nối             |
| `api.registerNodeInvokePolicy(policy)`          | Chính sách danh sách cho phép/phê duyệt cho các lệnh do Node gọi   |
| `api.registerSecurityAuditCollector(collector)` | Bộ thu thập phát hiện cho `openclaw security audit`                |

Các trình dựng phần bổ sung prompt bộ nhớ nhận ngữ cảnh `agentId`, `agentSessionKey` và `sandboxed` tùy chọn. Các lệnh gọi `search` và `get` của phần bổ sung kho ngữ liệu bộ nhớ nhận ngữ cảnh `agentId` và `sandboxed` tùy chọn. Các Plugin có bộ lưu trữ do tác tử sở hữu phải phân giải bộ lưu trữ đó cho từng lệnh gọi thay vì ghi giữ một đường dẫn toàn cục trong quá trình đăng ký. Nếu cần mã tác tử nhưng bị thiếu trong một thao tác đa tác tử, hãy từ chối theo hướng an toàn thay vì chọn một tác tử tùy ý.

Các trình xử lý tương tác của Telegram có thể trả về `{ submitText }` để định tuyến văn bản qua đường dẫn tác tử đầu vào thông thường của Telegram sau khi trình xử lý thành công. OpenClaw giữ lại nút gọi lại khi chính sách đầu vào bỏ qua văn bản hoặc quá trình xử lý thất bại, để người dùng có thể thử lại sau khi điều kiện chặn thay đổi. Trường kết quả này dành riêng cho Telegram; các kênh khác giữ nguyên hợp đồng kết quả tương tác của riêng mình.

### Hook máy chủ cho các Plugin quy trình làm việc

Hook máy chủ là các điểm nối SDK dành cho những Plugin cần tham gia vào vòng đời máy chủ thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Đây là các hợp đồng dùng chung; Chế độ Lập kế hoạch có thể sử dụng chúng, cũng như các quy trình phê duyệt, cổng chính sách không gian làm việc, trình giám sát nền, trình hướng dẫn thiết lập và các Plugin đồng hành giao diện người dùng.

| Phương thức                                                                          | Hợp đồng do phương thức sở hữu                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Trạng thái phiên tương thích JSON do Plugin sở hữu, được chiếu qua các phiên Gateway                                                                              |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Ngữ cảnh bền vững, chính xác một lần, được chèn vào lượt tác tử tiếp theo của một phiên                                                                           |
| `api.registerTrustedToolPolicy(...)`                                                 | Chính sách công cụ tin cậy trước Plugin, được kiểm soát bởi bản kê khai, có thể chặn hoặc viết lại tham số công cụ                                                |
| `api.registerToolMetadata(...)`                                                      | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                                                  |
| `api.registerCommand(...)`                                                           | Các lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true` hoặc `suppressReply: true`; lệnh gốc Discord hỗ trợ `descriptionLocalizations`          |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bộ mô tả đóng góp cho giao diện điều khiển dành cho các bề mặt phiên, công cụ, lượt chạy, cài đặt hoặc thẻ                                                       |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Lệnh gọi lại dọn dẹp tài nguyên thời gian chạy do Plugin sở hữu trên các đường dẫn đặt lại/xóa/tải lại                                                           |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Đăng ký sự kiện đã được làm sạch cho trạng thái quy trình làm việc và trình giám sát                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái tạm của Plugin theo từng lượt chạy, được xóa trong vòng đời kết thúc lượt chạy                                                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Siêu dữ liệu dọn dẹp cho các công việc bộ lập lịch do Plugin sở hữu; không lập lịch công việc hoặc tạo bản ghi tác vụ                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Chỉ dành cho gói tích hợp sẵn: phân phối tệp đính kèm qua máy chủ đến tuyến gửi trực tiếp đang hoạt động của phiên                                                |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Chỉ dành cho gói tích hợp sẵn: các lượt phiên được lập lịch dựa trên Cron cùng với việc dọn dẹp theo thẻ                                                         |
| `api.session.controls.registerSessionAction(...)`                                    | Các hành động phiên có kiểu mà máy khách có thể gửi qua Gateway                                                                                                   |

Một bộ mô tả `surface: "tab"` thêm một thẻ thanh bên vào giao diện điều khiển. Bộ mô tả thẻ của các Plugin đang hoạt động được quảng bá cho máy khách bảng điều khiển trong lời chào của Gateway (`controlUiTabs`), vì vậy thẻ chỉ xuất hiện khi Plugin được bật. Các Plugin tích hợp sẵn có thể cung cấp một chế độ xem bảng điều khiển hạng nhất cho thẻ của mình; các Plugin khác có thể đặt `path` thành một tuyến HTTP của Plugin (xem `api.registerHttpRoute(...)`) để bảng điều khiển hiển thị trong một khung được cô lập. `icon` là gợi ý tên biểu tượng bảng điều khiển, `group` chọn phần thanh bên (`control` hoặc `agent`), `order` sắp xếp giữa các thẻ Plugin và `requiredScopes` ẩn thẻ khỏi các kết nối không có những phạm vi người vận hành đó:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Sử dụng các không gian tên được nhóm cho mã Plugin mới:

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

Các phương thức phẳng tương đương vẫn khả dụng dưới dạng bí danh tương thích đã ngừng khuyến nghị cho các Plugin hiện có. Không thêm mã Plugin mới gọi trực tiếp `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` hoặc `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là tiện ích theo phạm vi phiên dựa trên bộ lập lịch Cron của Gateway. Cron sở hữu thời điểm và tạo bản ghi tác vụ nền khi lượt chạy; Plugin SDK chỉ giới hạn phiên đích, cách đặt tên do Plugin sở hữu và việc dọn dẹp. Sử dụng `api.runtime.tasks.managedFlows` bên trong lượt đã lập lịch khi bản thân công việc cần trạng thái Luồng Tác vụ nhiều bước bền vững.

Các hợp đồng chủ ý phân tách thẩm quyền:

- Các Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả giao diện người dùng, lệnh, siêu dữ liệu công cụ, phần chèn lượt tiếp theo và các hook thông thường.
- Chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông thường và được máy chủ tin cậy. Các chính sách tích hợp sẵn chạy trước; chính sách của Plugin đã cài đặt yêu cầu được bật rõ ràng cùng với mã cục bộ của chúng trong `contracts.trustedToolPolicies`, rồi chạy tiếp theo thứ tự tải Plugin. Mã chính sách có phạm vi trong Plugin đăng ký.
- Quyền sở hữu lệnh dành riêng chỉ thuộc về các gói tích hợp sẵn. Các Plugin bên ngoài nên sử dụng tên lệnh hoặc bí danh riêng.
- `allowPromptInjection=false` vô hiệu hóa các hook sửa đổi prompt, bao gồm `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, các trường prompt từ `before_agent_start` cũ và `enqueueNextTurnInjection`.

Ví dụ về các đối tượng sử dụng không thuộc Chế độ Lập kế hoạch:

| Nguyên mẫu Plugin                 | Hook được sử dụng                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quy trình phê duyệt               | Phần mở rộng phiên, tiếp tục lệnh, chèn vào lượt tiếp theo, bộ mô tả UI                                                                               |
| Cổng chính sách ngân sách/không gian làm việc | Chính sách công cụ tin cậy, siêu dữ liệu công cụ, phép chiếu phiên                                                                                    |
| Trình giám sát vòng đời nền        | Dọn dẹp vòng đời runtime, đăng ký sự kiện agent, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp vào lời nhắc Heartbeat, bộ mô tả UI                  |
| Trình hướng dẫn thiết lập hoặc làm quen | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả UI điều khiển                                                                                           |

<Note>
  Các không gian tên quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên là `operator.admin`, ngay cả khi một Plugin cố gắng gán
  phạm vi phương thức Gateway hẹp hơn. Ưu tiên các tiền tố dành riêng cho Plugin đối với
  những phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào nên sử dụng phần mềm trung gian kết quả công cụ">
  Các Plugin đi kèm và Plugin đã cài đặt được bật rõ ràng có hợp đồng
  manifest phù hợp có thể sử dụng `api.registerAgentToolResultMiddleware(...)` khi
  cần viết lại kết quả công cụ sau khi thực thi và trước khi runtime
  đưa kết quả đó trở lại mô hình. Đây là điểm nối tin cậy, trung lập với runtime
  dành cho các bộ rút gọn đầu ra bất đồng bộ như tokenjuice.

Plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng runtime được nhắm đến,
ví dụ `["openclaw", "codex"]`. Plugin đã cài đặt nhưng không có hợp đồng đó,
hoặc không được bật rõ ràng, không thể đăng ký phần mềm trung gian này; hãy giữ
các hook Plugin OpenClaw thông thường cho công việc không cần định thời kết quả công cụ
trước mô hình. Đường dẫn đăng ký factory phần mở rộng cũ chỉ dành cho
trình chạy nhúng đã bị loại bỏ.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép một Plugin quảng bá Gateway đang hoạt động
trên một phương thức truyền tải khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
dịch vụ trong quá trình khởi động Gateway khi tính năng khám phá cục bộ được bật, truyền
các cổng Gateway hiện tại và dữ liệu gợi ý TXT không bí mật, đồng thời gọi trình xử lý
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

Các Plugin khám phá Gateway không được coi các giá trị TXT được quảng bá là bí mật hoặc
thông tin xác thực. Khám phá chỉ là gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
chịu trách nhiệm về độ tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng do trình đăng ký sở hữu
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho trợ giúp CLI,
  định tuyến và đăng ký CLI Plugin theo kiểu tải lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn
  `["nodes"]`

Đối với các tính năng Node được ghép cặp, hãy ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một lớp bọc nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành tính năng Node rõ ràng do Plugin sở hữu.

Nếu muốn một lệnh Plugin tiếp tục được tải lười trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất mà trình đăng ký đó
công khai.

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

Chỉ sử dụng riêng `commands` khi bạn không cần đăng ký CLI gốc theo kiểu tải lười.
Đường dẫn tương thích tải ngay đó vẫn được hỗ trợ, nhưng không cài đặt
các phần giữ chỗ dựa trên bộ mô tả để tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một Plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `claude-cli` hoặc `my-cli`.

- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình như `my-cli/gpt-5`.
- `config` của backend sử dụng cùng cấu trúc với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn được ưu tiên. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  cấu hình mặc định của Plugin trước khi chạy CLI.
- Sử dụng `normalizeConfig` khi backend cần viết lại để tương thích sau khi hợp nhất
  (ví dụ: chuẩn hóa cấu trúc cờ cũ).
- Sử dụng `resolveExecutionArgs` để viết lại argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn ánh xạ các mức suy luận của OpenClaw sang cờ mức nỗ lực
  gốc. Hook nhận `ctx.executionMode`; sử dụng `"side-question"` để thêm
  các cờ cô lập gốc của backend cho các lệnh gọi `/btw` tạm thời. Nếu các cờ đó
  vô hiệu hóa công cụ gốc một cách đáng tin cậy cho một CLI vốn luôn bật công cụ, hãy khai báo thêm
  `sideQuestionToolMode: "disabled"`.
- Các backend có thể vô hiệu hóa toàn bộ công cụ gốc cho một lần chạy cụ thể có thể khai báo
  `nativeToolMode: "selectable"`. Các lệnh gọi bị hạn chế truyền một tuple
  `ctx.toolAvailability.native` rỗng cùng với danh sách cho phép MCP được cô lập chính xác bởi máy chủ;
  `resolveExecutionArgs` phải thực thi cả hai trên argv cuối cùng cho lần chạy mới hoặc tiếp tục.
  OpenClaw sẽ từ chối an toàn nếu backend không thể thực hiện điều đó.

Để xem hướng dẫn biên soạn toàn trình, hãy xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Vị trí độc quyền

| Phương thức                                  | Nội dung đăng ký                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`     | Công cụ ngữ cảnh (mỗi lần chỉ có một công cụ hoạt động). Các callback vòng đời nhận `runtimeSettings` khi máy chủ có thể cung cấp chẩn đoán mô hình/nhà cung cấp/chế độ; các công cụ nghiêm ngặt cũ được thử lại mà không có khóa đó. |
| `api.registerMemoryCapability(capability)`   | Khả năng bộ nhớ hợp nhất                                                                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)`   | Trình tạo phần lời nhắc bộ nhớ                                                                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`      | Trình phân giải kế hoạch xả bộ nhớ                                                                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`         | Bộ điều hợp runtime bộ nhớ                                                                                                                                                                                       |

### Bộ điều hợp embedding bộ nhớ không còn được khuyến nghị

| Phương thức                                      | Nội dung đăng ký                                  |
| ------------------------------------------------ | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)`   | Bộ điều hợp embedding bộ nhớ cho Plugin đang hoạt động |

- `registerMemoryCapability` là API Plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể công khai `publicArtifacts.listArtifacts(...)`
  để các Plugin đồng hành có thể sử dụng các tạo tác bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng tư của một
  Plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` và
  `registerMemoryRuntime` là các API Plugin bộ nhớ độc quyền tương thích với hệ thống cũ.
- `MemoryFlushPlan.model` có thể ghim lượt xả vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi dự phòng đang hoạt động.
- `registerMemoryEmbeddingProvider` không còn được khuyến nghị. Các nhà cung cấp embedding mới
  nên sử dụng `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`.
- Các nhà cung cấp dành riêng cho bộ nhớ hiện có tiếp tục hoạt động trong giai đoạn chuyển đổi,
  nhưng quá trình kiểm tra Plugin báo cáo đây là nợ tương thích đối với
  các Plugin không đi kèm.

### Sự kiện và vòng đời

| Phương thức                                   | Chức năng                         |
| --------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`            | Hook vòng đời có kiểu             |
| `api.onConversationBindingResolved(handler)`  | Callback liên kết cuộc trò chuyện |

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ, các tên hook phổ biến và ngữ nghĩa
bảo vệ.

### Ngữ nghĩa quyết định của hook

`before_install` là hook vòng đời runtime Plugin, không phải bề mặt chính sách cài đặt
của người vận hành. Sử dụng `security.installPolicy` khi quyết định cho phép/chặn phải
bao phủ các đường dẫn cài đặt hoặc cập nhật dựa trên CLI và Gateway.

- `before_tool_call`: việc trả về `{ block: true }` sẽ kết thúc quá trình. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: việc trả về `{ block: false }` được xem là không đưa ra quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: việc trả về `{ block: true }` sẽ kết thúc quá trình. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: việc trả về `{ block: false }` được xem là không đưa ra quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: việc trả về `{ handled: true, ... }` sẽ kết thúc quá trình. Khi bất kỳ trình xử lý nào nhận điều phối, các trình xử lý có mức ưu tiên thấp hơn và đường dẫn điều phối mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: việc trả về `{ cancel: true }` sẽ kết thúc quá trình. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: việc trả về `{ cancel: false }` được xem là không đưa ra quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: sử dụng trường có kiểu `threadId` khi cần định tuyến luồng/chủ đề đến. Giữ `metadata` cho dữ liệu bổ sung dành riêng cho kênh.
- `message_sending`: ưu tiên sử dụng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi dự phòng sang `metadata` dành riêng cho kênh.
- `gateway_start`: sử dụng `ctx.config`, `ctx.workspaceDir` và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì phụ thuộc vào các hook nội bộ `gateway:startup`. Cron có thể vẫn đang tải tại thời điểm này.
- `cron_reconciled`: xây dựng lại toàn bộ hình chiếu cron bên ngoài sau khi khởi động hoặc tải lại bộ lập lịch. Nó bao gồm `reason` và trạng thái `enabled` có hiệu lực, kể cả `enabled: false`, trong khi `ctx.getCron?.()` trả về chính xác bộ lập lịch đã được đối soát. Truyền `ctx.abortSignal` vào công việc hình chiếu bền vững; tín hiệu này sẽ hủy khi ảnh chụp nhanh bộ lập lịch đó bị thay thế hoặc Gateway đóng.
- `cron_changed`: quan sát các thay đổi vòng đời cron do Gateway sở hữu. Các sự kiện `scheduled` và `removed` là gợi ý đối soát sau khi xác nhận, không phải nhật ký thay đổi theo thứ tự. `event.nextRunAtMs` của một sự kiện đã lập lịch sẽ không có khi tác vụ không có lần đánh thức tiếp theo; sự kiện đã xóa vẫn mang theo ảnh chụp nhanh của tác vụ đã bị xóa.

Các bộ lập lịch đánh thức bên ngoài nên chống dội hoặc hợp nhất các sự kiện `cron_changed`,
sau đó đọc lại toàn bộ chế độ xem bền vững từ bộ lập lịch được ghi nhận gần nhất bởi
`cron_reconciled`. Không tiếp nhận bộ lập lịch từ ngữ cảnh `cron_changed`: một
gợi ý tách rời từ bộ lập lịch cũ hơn có thể chồng lấn với lần tải lại sau đó.

Sử dụng `cron_reconciled` làm tác nhân kích hoạt ảnh chụp nhanh đầy đủ cho trạng thái bền vững được tải khi
Gateway khởi động hoặc khi thay thế bộ lập lịch. Sự kiện này không được phát lại khi chỉ tải nóng lại
Plugin. Các trình xử lý quan sát chạy song song và các lần điều phối không chờ kết quả
có thể chồng lấn, vì vậy bên tiêu thụ không được phụ thuộc vào thứ tự hoàn thành sự kiện.
Giữ OpenClaw làm nguồn dữ liệu chính xác cho việc kiểm tra đến hạn và thực thi.

Để xem một bộ điều hợp chỉ cho phép một lượt chạy với khả năng thay thế bền vững, thử lại/chờ lùi và
tắt sạch, hãy xem [Hình chiếu cron bên ngoài an toàn](/vi/plugins/hooks#safe-external-cron-projection).

### Các trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Mã định danh Plugin                                                                                     |
| `api.name`               | `string`                  | Tên hiển thị                                                                                            |
| `api.version`            | `string?`                 | Phiên bản Plugin (không bắt buộc)                                                                       |
| `api.description`        | `string?`                 | Mô tả Plugin (không bắt buộc)                                                                           |
| `api.source`             | `string`                  | Đường dẫn nguồn của Plugin                                                                              |
| `api.rootDir`            | `string?`                 | Thư mục gốc của Plugin (không bắt buộc)                                                                 |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp nhanh cấu hình hiện tại (ảnh chụp nhanh thời gian chạy trong bộ nhớ đang hoạt động khi có)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`                                         |
| `api.runtime`            | `PluginRuntime`           | [Các tiện ích thời gian chạy](/vi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Bộ ghi nhật ký theo phạm vi (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là khoảng khởi động/thiết lập nhẹ trước khi tải mục nhập đầy đủ |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với thư mục gốc của Plugin                                                |

## Quy ước mô-đun nội bộ

Trong Plugin của bạn, hãy sử dụng các tệp barrel cục bộ cho các lệnh nhập nội bộ:

```text
my-plugin/
  api.ts            # Các nội dung xuất công khai dành cho bên tiêu thụ bên ngoài
  runtime-api.ts    # Các nội dung xuất thời gian chạy chỉ dành cho nội bộ
  index.ts          # Điểm vào của Plugin
  setup-entry.ts    # Điểm vào nhẹ chỉ dành cho thiết lập (không bắt buộc)
```

<Warning>
  Tuyệt đối không nhập Plugin của chính bạn qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã sản xuất. Định tuyến các lệnh nhập nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của Plugin tích hợp được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các tệp mục nhập công khai tương tự) ưu tiên
ảnh chụp nhanh cấu hình thời gian chạy đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp nhanh thời gian chạy, chúng sẽ dự phòng sang tệp cấu hình đã phân giải trên đĩa.
Các facade của Plugin tích hợp đã đóng gói nên được tải qua các trình tải facade Plugin
của OpenClaw; việc nhập trực tiếp từ `dist/extensions/...` sẽ bỏ qua các bước kiểm tra
manifest và sidecar thời gian chạy mà bản cài đặt đóng gói sử dụng cho mã do Plugin sở hữu.

Các Plugin nhà cung cấp có thể cung cấp một barrel hợp đồng cục bộ hẹp dành riêng cho Plugin khi một
tiện ích được chủ ý thiết kế riêng cho nhà cung cấp và chưa phù hợp với một đường dẫn con SDK dùng chung.
Các ví dụ tích hợp:

- **Anthropic**: ranh giới `api.ts` / `contract-api.ts` công khai cho các tiện ích
  tiêu đề beta và luồng `service_tier` của Claude.
- **`@openclaw/openai-provider`**: `api.ts` xuất các trình dựng nhà cung cấp,
  tiện ích mô hình mặc định và trình dựng nhà cung cấp thời gian thực.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất trình dựng nhà cung cấp
  cùng các tiện ích hướng dẫn ban đầu/cấu hình.

<Warning>
  Mã sản xuất của phần mở rộng cũng nên tránh nhập `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một tiện ích thực sự dùng chung, hãy nâng nó lên một đường dẫn con SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared` hoặc một
  bề mặt định hướng khả năng khác thay vì ghép nối hai Plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Các tiện ích thời gian chạy" icon="gears" href="/vi/plugins/sdk-runtime">
    Tài liệu tham chiếu đầy đủ cho không gian tên `api.runtime`.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và lược đồ cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Các tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt không còn được khuyến nghị.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc chuyên sâu và mô hình khả năng.
  </Card>
</CardGroup>
