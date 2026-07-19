---
read_when:
    - Bạn cần biết cần nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo về tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Sơ đồ nhập, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về SDK Plugin
x-i18n:
    generated_at: "2026-07-19T05:53:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 783bafd34098e5d77aab8e574b6518f5df91ba622c9736aef8addff4914f3a9f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK plugin là hợp đồng có kiểu giữa các plugin và phần lõi. Trang này là
tài liệu tham chiếu về **những gì cần nhập** và **những gì bạn có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Đối với các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
  muốn chạy agent thông qua Gateway, hãy sử dụng
  [Tích hợp Gateway cho ứng dụng bên ngoài](/vi/gateway/external-apps).
</Note>

<Tip>
Nếu bạn đang tìm hướng dẫn thực hành, hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins). Sử dụng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho các kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho các nhà cung cấp mô hình, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho các backend CLI AI cục bộ, [Plugin bộ khung agent](/vi/plugins/sdk-agent-harness) cho các trình thực thi agent gốc và [Hook plugin](/vi/plugins/hooks) cho các hook công cụ hoặc vòng đời.
</Tip>

## Quy ước nhập

Luôn nhập từ một đường dẫn con cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi đường dẫn con là một mô-đun nhỏ, độc lập. Điều này giúp khởi động nhanh và
ngăn ngừa vấn đề phụ thuộc vòng. Đối với các trình trợ giúp mục nhập/xây dựng dành riêng cho kênh,
ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các trình trợ giúp dùng chung như
`buildChannelConfigSchema`.

Đối với cấu hình kênh, hãy công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Đường dẫn con `plugin-sdk/channel-config-schema`
dành cho các thành phần nguyên thủy của schema dùng chung và trình dựng chung. Các plugin
đi kèm OpenClaw sử dụng `plugin-sdk/bundled-channel-config-schema` cho các schema
kênh đi kèm được giữ lại. Các mục xuất tương thích đã lỗi thời vẫn còn trên
`plugin-sdk/channel-config-schema-legacy`; không đường dẫn con schema đi kèm nào là
mẫu cho plugin mới.

<Warning>
  Không nhập các seam tiện ích mang thương hiệu nhà cung cấp hoặc kênh (ví dụ
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các plugin đi kèm kết hợp các đường dẫn con SDK chung bên trong các barrel `api.ts` /
  `runtime-api.ts` riêng của chúng; người dùng phần lõi nên sử dụng các barrel cục bộ
  của plugin đó hoặc thêm một hợp đồng SDK chung có phạm vi hẹp khi nhu cầu thực sự
  xuyên kênh.

Một tập nhỏ các seam trình trợ giúp plugin đi kèm vẫn xuất hiện trong bản đồ xuất
được tạo khi chúng có hoạt động sử dụng được theo dõi từ chủ sở hữu. Chúng chỉ tồn tại để
bảo trì plugin đi kèm và không phải là đường dẫn nhập được khuyến nghị cho các plugin
bên thứ ba mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng facade tương thích đã lỗi thời cho hoạt động sử dụng được theo dõi từ chủ sở hữu. Không
sao chép các đường dẫn nhập đó vào plugin mới; thay vào đó, hãy sử dụng các trình trợ giúp runtime được chèn và
các đường dẫn con SDK kênh chung.
</Warning>

## Tham chiếu đường dẫn con

SDK plugin được cung cấp dưới dạng một tập hợp các đường dẫn con có phạm vi hẹp, được nhóm theo lĩnh vực (mục nhập
plugin, kênh, nhà cung cấp, xác thực, runtime, khả năng, bộ nhớ và các
trình trợ giúp plugin đi kèm dành riêng). Để xem danh mục đầy đủ — đã được nhóm và liên kết — hãy xem
[Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).

Danh mục điểm vào của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các mục xuất gói được tạo từ
tập con công khai sau khi loại trừ các đường dẫn con kiểm thử/nội bộ cục bộ của kho mã được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng mục xuất công khai. Các
đường dẫn con công khai đã lỗi thời đủ lâu và không được mã sản xuất của tiện ích mở rộng đi kèm sử dụng được
theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các
barrel tái xuất rộng đã lỗi thời được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

### Đăng ký khả năng

| Phương thức                                       | Nội dung đăng ký                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                                                             |
| `api.registerWorkerProvider(...)`                | Lease vòng đời của worker đám mây                                                  |
| `api.registerModelCatalogProvider(...)`          | Các hàng danh mục mô hình để tạo văn bản và phương tiện                            |
| `api.registerAgentHarness(...)`                  | Trình thực thi agent gốc [Thử nghiệm](/vi/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ                                                        |
| `api.registerChannel(...)`                       | Kênh nhắn tin                                                                      |
| `api.registerEmbeddingProvider(...)`             | Nhà cung cấp embedding vectơ có thể tái sử dụng                                    |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng luồng                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực song công                                               |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video                                                  |
| `api.registerTranscriptSourceProvider(...)`      | Nguồn bản ghi cuộc họp trực tiếp hoặc được nhập                                    |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                                                                       |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                                                           |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                                                          |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp tìm nạp / thu thập dữ liệu web                                        |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend Compaction bản ghi có thể cắm                                              |

Các nhà cung cấp worker cũng phải khai báo id của mình trong `contracts.workerProviders`.
Phần lõi duy trì ý định lâu dài trước `provision(profile, operationId)`. Các nhà cung cấp xác thực cài đặt trước khi phân bổ bên ngoài và ném `WorkerProviderError` khi hồ sơ bị từ chối vĩnh viễn. `provision` phải tiếp nhận cùng một lease khi id thao tác lặp lại.
Phần lõi duy trì các cài đặt hồ sơ đã xác thực cùng với lease và cung cấp snapshot đó cho `destroy({ leaseId, profile })`, vốn phải có tính lũy đẳng, và `inspect({ leaseId, profile })`, vốn trả về `active`, `destroyed` hoặc `unknown`. Điều này cho phép nhà cung cấp định tuyến các lệnh gọi vòng đời sau khi Gateway khởi động lại hoặc hồ sơ có tên bị xóa. Các điểm cuối SSH sử dụng `SecretRef` cho `keyRef`, tuyệt đối không dùng vật liệu khóa nội tuyến, và bao gồm `hostKey` từ đầu ra cấp phát đáng tin cậy dưới dạng chính xác `algorithm base64`, không có tên máy chủ hoặc nhận xét. Phần lõi ghim `hostKey` và không bao giờ tin tưởng khóa từ kết nối đầu tiên. Nhà cung cấp tạo `keyRef` động có thể triển khai `resolveSshIdentity({ leaseId, profile, keyRef })`; khi có, trình phân giải đó là nguồn có thẩm quyền, còn nhà cung cấp không có nó sẽ sử dụng trình phân giải bí mật chung đã cấu hình.
Các nhà cung cấp có lease có thể gia hạn cũng có thể triển khai `renew(leaseId)`.
`inspect` phải ném lỗi khi gặp lỗi tạm thời hoặc không xác định; chỉ trả về `unknown` khi sự vắng mặt là chắc chắn. Phần lõi đánh dấu một bản ghi cục bộ đang hoạt động là mồ côi hoặc coi sự vắng mặt đó là việc hoàn tất tháo dỡ sau một yêu cầu hủy đã được duy trì.

Các nhà cung cấp embedding được đăng ký bằng `api.registerEmbeddingProvider(...)` cũng phải
được liệt kê trong `contracts.embeddingProviders` của manifest plugin. Đây
là bề mặt embedding chung để tạo vectơ có thể tái sử dụng. Tìm kiếm bộ nhớ
có thể sử dụng bề mặt nhà cung cấp chung này. Seam
`api.registerMemoryEmbeddingProvider(...)` và
`contracts.memoryEmbeddingProviders` cũ là khả năng tương thích đã lỗi thời trong khi
các nhà cung cấp dành riêng cho bộ nhớ hiện có chuyển đổi.

Các nhà cung cấp dành riêng cho bộ nhớ vẫn cung cấp `batchEmbed(...)` runtime sẽ tiếp tục sử dụng
hợp đồng xử lý theo lô trên từng tệp hiện có, trừ khi runtime của chúng đặt rõ ràng
`sourceWideBatchEmbed: true`. Việc chọn tham gia này cho phép máy chủ bộ nhớ gửi các đoạn từ
nhiều tệp bộ nhớ đã thay đổi và các nguồn được bật trong một lệnh gọi `batchEmbed(...)`,
tối đa đến giới hạn lô của máy chủ. Các bộ điều hợp lô tải lên tệp yêu cầu JSONL cũng phải
chia nhỏ tác vụ nhà cung cấp trước giới hạn kích thước tải lên cũng như giới hạn số lượng
yêu cầu. Nhà cung cấp phải trả về một embedding cho mỗi đoạn đầu vào theo cùng thứ tự với
`batch.chunks`; bỏ cờ này khi nhà cung cấp yêu cầu các lô cục bộ theo tệp hoặc
không thể duy trì thứ tự đầu vào trong một tác vụ lớn hơn trên toàn nguồn.

### Công cụ và lệnh

Sử dụng [`defineToolPlugin`](/vi/plugins/tool-plugins) cho các plugin đơn giản chỉ có công cụ
với tên công cụ cố định. Sử dụng trực tiếp `api.registerTool(...)` cho các plugin hỗn hợp
hoặc việc đăng ký công cụ hoàn toàn động.

| Phương thức                            | Nội dung đăng ký                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Công cụ agent (bắt buộc hoặc `{ optional: true }`)                                                                                           |
| `api.registerCommand(def)`             | Lệnh tùy chỉnh (bỏ qua LLM)                                                                                                               |
| `api.registerNodeHostCommand(command)` | Lệnh do `openclaw node run` xử lý; siêu dữ liệu `agentTool` tùy chọn có thể cung cấp lệnh này dưới dạng công cụ hiển thị cho agent khi Node được kết nối |

Các lệnh plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Giữ nội dung đó tập trung vào chính lệnh; không thêm
chính sách dành riêng cho nhà cung cấp hoặc plugin vào các trình dựng prompt của phần lõi.

Các mục hướng dẫn có thể là chuỗi cũ, áp dụng cho mọi bề mặt prompt, hoặc
các mục có cấu trúc:

```ts
agentPromptGuidance: [
  "Gợi ý lệnh chung.",
  { text: "Chỉ hiển thị nội dung này trong prompt OpenClaw chính.", surfaces: ["openclaw_main"] },
];
```

`surfaces` có cấu trúc có thể bao gồm `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` hoặc `subagent`. `pi_main` vẫn là một bí danh
đã lỗi thời cho `openclaw_main`. Bỏ `surfaces` đối với hướng dẫn cố ý áp dụng cho mọi bề mặt. Không
truyền mảng `surfaces` rỗng; mảng này bị từ chối để việc vô tình mất phạm vi
không trở thành văn bản prompt toàn cục.

Hướng dẫn dành cho nhà phát triển của app-server Codex gốc nghiêm ngặt hơn các bề mặt
prompt khác: chỉ hướng dẫn được xác định phạm vi rõ ràng cho `codex_app_server` mới được đưa vào
luồng có mức ưu tiên cao hơn đó. Hướng dẫn dạng chuỗi cũ và hướng dẫn có cấu trúc không xác định phạm vi
vẫn khả dụng cho các bề mặt prompt không phải Codex để đảm bảo khả năng tương thích.

Các lệnh máy chủ Node chạy trên máy chủ Node được kết nối, không phải bên trong tiến trình
Gateway. Nếu có `agentTool`, Node sẽ công bố một bộ mô tả sau khi
kết nối Gateway thành công; Gateway chỉ cung cấp bộ mô tả đó cho các lượt chạy agent khi
Node đó đang được kết nối và chỉ khi `command` của bộ mô tả nằm trong
bề mặt lệnh được phê duyệt của Node. Đặt `agentTool.defaultPlatforms` để đưa một
lệnh không nguy hiểm vào danh sách cho phép lệnh Node mặc định; nếu không, yêu cầu
`gateway.nodes.allowCommands` rõ ràng hoặc chính sách gọi Node. `agentTool.name`
phải an toàn với nhà cung cấp: bắt đầu bằng một chữ cái, chỉ sử dụng chữ cái, chữ số,
dấu gạch dưới hoặc dấu gạch nối và không vượt quá 64 ký tự. Các công cụ Node dựa trên MCP
có thể đặt siêu dữ liệu `agentTool.mcp` để các bề mặt danh mục và tìm kiếm công cụ có thể hiển thị
danh tính máy chủ/công cụ MCP từ xa, nhưng quá trình thực thi vẫn đi qua
lệnh Node được quảng bá.

### Hạ tầng

| Phương thức                                      | Nội dung đăng ký                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Hook sự kiện                                                              |
| `api.registerHttpRoute(params)`                 | Điểm cuối HTTP của Gateway                                                |
| `api.registerGatewayMethod(name, handler)`      | Phương thức RPC của Gateway                                               |
| `api.registerGatewayDiscoveryService(service)`  | Bộ quảng bá khám phá Gateway cục bộ                                       |
| `api.registerCli(registrar, opts?)`             | Lệnh con CLI                                                              |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI tính năng Node trong `openclaw nodes`                                |
| `api.registerService(service)`                  | Dịch vụ nền                                                              |
| `api.registerInteractiveHandler(registration)`  | Trình xử lý tương tác                                                     |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware kết quả công cụ trong thời gian chạy                           |
| `api.registerMemoryPromptSupplement(builder)`   | Phần prompt bổ sung liên quan đến bộ nhớ                                  |
| `api.registerMemoryPromptPreparation(prepare)`  | Khâu chuẩn bị bất đồng bộ cho phần prompt liên quan đến bộ nhớ            |
| `api.registerMemoryCorpusSupplement(adapter)`   | Kho ngữ liệu tìm kiếm/đọc bộ nhớ bổ sung                                  |
| `api.registerHostedMediaResolver(resolver)`     | Trình phân giải URL phương tiện được lưu trữ theo kiểu trình duyệt         |
| `api.registerMcpServerConnectionResolver(...)`  | Phương thức truyền tải MCP theo từng bên yêu cầu (`url`/`headers`) cho một tên máy chủ tĩnh |
| `api.registerTextTransforms(transforms)`        | Viết lại văn bản tương thích prompt/tin nhắn do Plugin sở hữu             |
| `api.registerConfigMigration(migrate)`          | Di chuyển cấu hình nhẹ chạy trước khi thời gian chạy của Plugin được tải   |
| `api.registerMigrationProvider(provider)`       | Trình nhập cho `openclaw migrate`                                         |
| `api.registerAutoEnableProbe(probe)`            | Trình thăm dò cấu hình có thể tự động bật Plugin này                       |
| `api.registerReload(registration)`              | Chính sách tiền tố cấu hình restart/hot/noop để xử lý tải lại              |
| `api.registerNodeHostCommand(command)`          | Trình xử lý lệnh được cung cấp cho các Node đã ghép đôi                    |
| `api.registerNodeInvokePolicy(policy)`          | Chính sách danh sách cho phép/phê duyệt đối với các lệnh do Node gọi       |
| `api.registerSecurityAuditCollector(collector)` | Trình thu thập phát hiện cho `openclaw security audit`                            |

#### Công việc Webhook sau khi xác nhận

Các tuyến Webhook xác nhận yêu cầu trước khi xử lý hoàn tất phải chuyển công
việc tách rời đó sang một gốc tiếp nhận được theo dõi riêng:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`điều phối webhook thất bại: ${String(error)}`);
});
```

Gọi `runDetachedWebhookWork(...)` một cách đồng bộ trong khi yêu cầu HTTP vẫn đang
được tiếp nhận. Trình trợ giúp lập tức dành riêng một gốc độc lập, sau đó bắt đầu
callback trong vi tác vụ tiếp theo để trình xử lý yêu cầu có thể ghi nội dung
xác nhận trước. Promise được trả về tiếp nhận kết quả callback; bên gọi vẫn
chịu trách nhiệm xử lý trường hợp bị từ chối. Điều này giữ cho công việc trong
hàng đợi sau khi xác nhận được chấp nhận và khiến quá trình tháo cạn khi khởi
động lại hoặc tạm ngưng phải chờ công việc đó. Các trình xử lý chờ toàn bộ quá
trình xử lý hoàn tất trước khi trả về không cần trình trợ giúp này.

#### Kết nối MCP theo phạm vi bên yêu cầu

Giữ **danh tính** máy chủ MCP ở dạng tĩnh (tên, bộ lọc công cụ) trong `mcp.servers` hoặc
manifest gói. Có thể đăng ký thêm một trình phân giải kết nối để mỗi bên yêu cầu
tin nhắn đáng tin cậy nhận phương thức truyền tải riêng:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId được máy chủ tin cậy; tuyệt đối không tự tạo danh tính người gửi tại đây.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // bỏ qua máy chủ này trong lượt chạy hiện tại
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

Ghi chú hợp đồng:

- Ngữ cảnh trình phân giải chỉ mang danh tính máy chủ đáng tin cậy (`requesterSenderId`,
  cùng `agentAccountId` / `messageChannel` không bắt buộc). Các trường đáng tin cậy trong tương lai (ví
  dụ: ngữ cảnh người dùng cron/tác tử con) có thể được thêm theo cách bổ sung.
- Một Plugin sở hữu một tên máy chủ: `registerMcpServerConnectionResolver` trùng lặp
  cho cùng `serverName` từ một Plugin khác sẽ bị từ chối kèm chẩn đoán
  lỗi (đăng ký đầu tiên được ưu tiên), vì vậy quyền sở hữu kết nối không bao giờ
  phụ thuộc vào thứ tự tải Plugin.
- Tên công cụ được dẫn xuất từ toàn bộ tập máy chủ đã khai báo để việc phân giải
  một phần không bao giờ thay đổi tên máy chủ an toàn giữa các bên yêu cầu hoặc
  các lượt. Phần lõi không xác minh rằng các điểm cuối của những bên yêu cầu khác
  nhau cung cấp lược đồ công cụ giống hệt nhau; trình phân giải phải trỏ mọi bên
  yêu cầu đến cùng một dịch vụ logic, nếu không lược đồ công cụ (và độ ổn định
  của bộ nhớ đệm prompt) sẽ khác nhau theo từng bên yêu cầu.
- Các lượt chạy không có `requesterSenderId` đáng tin cậy (cron, tác tử con, Heartbeat, Gateway
  công khai) không bao giờ khởi tạo máy chủ theo phạm vi bên yêu cầu. Không có
  kết nối dự phòng dùng chung.
- `resolve` bị giới hạn ở 10 giây cho mỗi máy chủ; hết thời gian chờ hoặc phát sinh
  ngoại lệ sẽ bỏ qua máy chủ đó trong lượt chạy mà không làm MCP tĩnh thất bại.
- Các kết nối đã phân giải được xác thực lại tối đa mỗi 5 phút cho mỗi bên yêu cầu:
  việc luân chuyển xây dựng lại phương thức truyền tải với thông tin xác thực mới,
  còn kết quả `null` sẽ thu hồi kết nối đó (thời gian chạy được lưu
  trong bộ nhớ đệm sẽ bị hủy ngay cả giữa phiên). Vì vậy, thông tin xác thực đã
  bị thu hồi hoặc luân chuyển có thể tiếp tục được sử dụng trong tối đa 5 phút.
- `headers` đã phân giải không bao giờ được ghi nhật ký hoặc lưu bền vững; phần lõi chỉ giữ
  một bản tóm lược có khóa tạm thời trong bộ nhớ (HMAC cục bộ theo tiến trình)
  để phát hiện việc luân chuyển thông tin xác thực, đồng thời đăng ký các giá trị
  thông tin xác thực trong header/URL đã phân giải với sổ đăng ký che dữ liệu
  khi ghi nhật ký/thu thập gỡ lỗi.
- Máy chủ theo phạm vi bên yêu cầu không tạo chế độ xem MCP App: chế độ xem tồn tại lâu hơn
  lượt chạy đã xác thực bên yêu cầu, còn ranh giới chế độ xem của Gateway không
  có danh tính bên yêu cầu, vì vậy bản xem trước ứng dụng vẫn đóng khi không
  đáp ứng điều kiện đối với các máy chủ này. Kết quả công cụ không bị ảnh hưởng.
- Máy chủ tĩnh không có trình phân giải tiếp tục sử dụng vòng đời theo phạm vi phiên hiện có.
- **Quy tắc phân phối của harness:** máy chủ theo phạm vi bên yêu cầu không bao giờ đi vào
  cấu hình máy khách MCP gốc của harness (luồng Codex `mcp_servers`, CLI `-c mcp_servers=…` hoặc bất kỳ
  phép chiếu MCP dùng chung theo phiên nào khác). Thay vào đó, harness phân phối
  chúng dưới dạng công cụ theo phạm vi lượt chạy:
  - Trình chạy nhúng: thời gian chạy MCP của phiên + công cụ gói (tĩnh + theo phạm vi).
  - Máy chủ ứng dụng Codex: các công cụ động thông qua
    `materializeRequesterScopedMcpToolsForHarnessRun` (chỉ theo phạm vi; máy chủ tĩnh
    vẫn sử dụng máy khách MCP gốc của Codex).
- **Đặc tả** công cụ theo phạm vi ổn định trong phiên sau lần phân giải thành công đầu tiên
  của phiên đó, vì vậy harness dùng chung luồng (Codex) không luân chuyển luồng
  khi người gửi thay đổi. Trước khi bất kỳ bên yêu cầu nào được phân giải, không
  có đặc tả theo phạm vi nào được quảng bá.
- Các bên yêu cầu chưa xác thực trên harness dùng chung luồng vẫn nhìn thấy các công cụ
  theo phạm vi được quảng bá; việc gọi một công cụ sẽ trả về lỗi công cụ chưa kết
  nối rõ ràng cho bên yêu cầu đó. OpenClaw không bao giờ dùng thông tin xác thực
  của bên yêu cầu khác làm phương án dự phòng.

Các trình dựng phần bổ sung cho prompt bộ nhớ nhận ngữ cảnh `agentId`,
`agentSessionKey` và `sandboxed` không bắt buộc. Các lệnh gọi phần bổ sung kho ngữ liệu bộ nhớ `search`
và `get` nhận ngữ cảnh `agentId` và `sandboxed` không bắt buộc. Các Plugin có
bộ lưu trữ do tác tử sở hữu nên phân giải bộ lưu trữ đó cho từng lệnh gọi thay
vì ghi nhận một đường dẫn toàn cục trong lúc đăng ký. Nếu cần id tác tử nhưng
id này bị thiếu trong một thao tác đa tác tử, hãy đóng khi không đáp ứng điều
kiện thay vì chọn một tác tử tùy ý.

Dùng `registerMemoryPromptPreparation(...)` khi văn bản prompt phụ thuộc vào trạng thái
Plugin bất đồng bộ. Callback chạy một lần trước mỗi prompt tác tử đầy đủ và nhận
cùng ngữ cảnh công cụ, tác tử, phiên và sandbox như các trình dựng prompt bộ nhớ
đồng bộ. Xác thực phiên bản hiện tại của chủ sở hữu bộ lưu trữ trước khi tải trạng
thái được lưu bền vững, sau đó chỉ trả về các dòng dành cho lượt chạy đó. OpenClaw
đóng băng các dòng này và chuyển kết quả bất biến cho quá trình lắp ráp prompt
đồng bộ. Giữ việc lưu bền vững, thay thế nguyên tử và xóa khi loại bỏ chủ sở hữu
bên trong Plugin sở hữu; không thăm dò hoặc đọc tệp từ trình dựng prompt.

Các trình xử lý tương tác của Telegram có thể trả về `{ submitText }` để định tuyến văn bản qua
đường dẫn tác tử gửi đến thông thường của Telegram sau khi trình xử lý thành công. OpenClaw giữ
nút callback khi chính sách gửi đến bỏ qua văn bản hoặc quá trình xử lý thất bại,
để người dùng có thể thử lại sau khi điều kiện chặn thay đổi. Trường kết quả này
chỉ dành riêng cho Telegram; các kênh khác duy trì hợp đồng kết quả tương tác riêng.

### Hook máy chủ dành cho Plugin quy trình làm việc

Hook máy chủ là các đường nối SDK dành cho Plugin cần tham gia vào vòng đời
máy chủ thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Đây là các hợp đồng
chung; Chế độ lập kế hoạch có thể sử dụng chúng, cũng như các quy trình phê duyệt,
cổng chính sách không gian làm việc, trình giám sát nền, trình hướng dẫn thiết lập
và Plugin đồng hành giao diện người dùng.

| Phương thức                                                                          | Hợp đồng do phương thức sở hữu                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Trạng thái phiên tương thích với JSON do Plugin sở hữu, được chiếu qua các phiên Gateway                                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Ngữ cảnh bền vững, chính xác một lần được chèn vào lượt tác nhân tiếp theo cho một phiên                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Chính sách công cụ tin cậy trước Plugin, được kiểm soát bằng manifest, có thể chặn hoặc ghi lại các tham số công cụ                                         |
| `api.registerToolMetadata(...)`                                                      | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                                            |
| `api.registerCommand(...)`                                                           | Các lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true` hoặc `suppressReply: true`; các lệnh gốc của Discord hỗ trợ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bộ mô tả đóng góp cho Control UI dành cho các bề mặt phiên, công cụ, lượt chạy, cài đặt hoặc thẻ                                                            |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Các hàm gọi lại dọn dẹp cho tài nguyên thời gian chạy do Plugin sở hữu trên các đường dẫn đặt lại/xóa/tải lại                                                |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Các đăng ký sự kiện đã được làm sạch cho trạng thái quy trình công việc và trình giám sát                                                                   |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái tạm của Plugin theo từng lượt chạy, được xóa trong vòng đời lượt chạy đầu cuối                                                                   |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Siêu dữ liệu dọn dẹp cho các công việc bộ lập lịch do Plugin sở hữu; không lập lịch công việc hoặc tạo bản ghi tác vụ                                        |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Chỉ dành cho Plugin đi kèm: phân phối tệp đính kèm qua trung gian máy chủ đến tuyến phiên gửi trực tiếp đang hoạt động                                       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Chỉ dành cho Plugin đi kèm: các lượt phiên được lập lịch dựa trên Cron cùng việc dọn dẹp theo thẻ                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Các hành động phiên có kiểu mà ứng dụng khách có thể gửi qua Gateway                                                                                        |

Bộ mô tả `surface: "tab"` thêm một thẻ thanh bên vào Control UI. Bộ mô tả thẻ
của các Plugin đang hoạt động được quảng bá cho ứng dụng khách bảng điều khiển trong lời chào
của Gateway (`controlUiTabs`), vì vậy thẻ chỉ xuất hiện khi Plugin được bật.
Các Plugin đi kèm có thể cung cấp một chế độ xem bảng điều khiển hạng nhất cho thẻ của mình; các
Plugin khác có thể đặt `path` thành một tuyến HTTP của Plugin (xem
`api.registerHttpRoute(...)`) mà bảng điều khiển kết xuất trong một khung được cách ly.
`icon` là gợi ý tên biểu tượng bảng điều khiển, `group` chọn phần thanh bên
(`control` hoặc `agent`), `order` sắp xếp giữa các thẻ Plugin, và `requiredScopes`
ẩn thẻ khỏi các kết nối không có những phạm vi người vận hành đó:

Đối với một thẻ bên ngoài được Gateway bảo vệ, hãy đăng ký bộ mô tả `path` dưới một
tuyến HTTP `auth: "gateway"` của cùng Plugin. Sau khi khởi tạo có xác thực, trình duyệt nhận được một
quyền cấp HttpOnly ngắn hạn, có phạm vi giới hạn ở Plugin đó và gốc tuyến, để
khung được cách ly có thể tải mà không cần sao chép bearer token của Gateway vào URL
hoặc JavaScript. Trang cha đã xác thực gia hạn quyền cấp khi thẻ bên ngoài
đang hoạt động và trước khi gắn thẻ sau khi điều hướng hoặc tiếp tục phiên trình duyệt. Trang này cũng
thăm dò quyền cấp từ cùng sandbox không rõ nguồn gốc trước khi gắn thẻ, để các chế độ
quyền riêng tư của trình duyệt chặn cookie sẽ đóng an toàn với bảng điều khiển không khả dụng.
Quyền cấp cho khung chỉ chấp nhận `GET` và `HEAD` và luôn mang theo
`operator.read`; `requiredScopes` kiểm soát khả năng hiển thị thẻ nhưng không bao giờ mở rộng
quyền cấp cookie. Các thao tác thay đổi vẫn nằm trên các bề mặt trang cha được Gateway xác thực rõ ràng hoặc
các bề mặt bearer. Các thẻ bên ngoài yêu cầu HTTPS/Tailscale Serve hoặc một
nguồn loopback được trình duyệt tin cậy; HTTP thuần túy trên máy chủ LAN hiển thị
lỗi ngữ cảnh bảo mật thay vì gắn một bảng điều khiển không thể xác thực.
Việc chặn hoàn toàn cookie bên thứ ba cũng khiến các thẻ được Gateway bảo vệ không khả dụng.
Cũng như mọi bề mặt Plugin gốc, khung vẫn nằm trong ranh giới tin cậy của
Plugin đã cài đặt; OpenClaw không coi các Plugin đã cài đặt là những
chủ thể bảo mật trình duyệt được cách ly lẫn nhau.
Quyền cấp cookie sử dụng ranh giới tên máy chủ của trình duyệt, không phải ranh giới cổng. Không
đồng lưu trữ các dịch vụ không tin cậy lẫn nhau trên tên máy chủ Gateway, kể cả trên các
cổng khác.
Các thẻ được hỗ trợ bởi cơ chế xác thực do Plugin quản lý giữ nguyên hành vi iframe trực tiếp và không
yêu cầu hoặc cần quyền cấp Gateway này.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Nhật ký",
  description: "Ngày của bạn dưới dạng dòng thời gian, được tạo từ các ảnh chụp màn hình.",
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

Các phương thức phẳng tương đương vẫn khả dụng dưới dạng bí danh tương thích
đã ngừng khuyến nghị cho các Plugin hiện có. Không thêm mã Plugin mới gọi trực tiếp
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` hoặc
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là một tiện ích có phạm vi phiên dựa trên bộ lập lịch
Cron của Gateway. Cron sở hữu việc định thời và tạo bản ghi tác vụ nền khi
lượt chạy diễn ra; Plugin SDK chỉ giới hạn phiên đích, cách đặt tên do Plugin sở hữu
và việc dọn dẹp. Sử dụng `api.runtime.tasks.managedFlows` bên trong lượt
được lập lịch khi bản thân công việc cần trạng thái Task Flow nhiều bước bền vững.

Các hợp đồng chủ ý phân chia quyền hạn:

- Các Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả giao diện người dùng, lệnh, siêu dữ liệu
  công cụ, nội dung chèn cho lượt tiếp theo và các hook thông thường.
- Các chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông thường và được
  máy chủ tin cậy. Các chính sách đi kèm chạy trước; các chính sách của Plugin đã cài đặt yêu cầu
  bật rõ ràng cùng với các id cục bộ của chúng trong
  `contracts.trustedToolPolicies`, rồi chạy tiếp theo thứ tự tải Plugin. Id chính sách
  có phạm vi giới hạn ở Plugin đăng ký.
- Quyền sở hữu lệnh dành riêng chỉ thuộc về Plugin đi kèm. Các Plugin bên ngoài nên sử dụng
  tên lệnh hoặc bí danh riêng của mình.
- `allowPromptInjection=false` vô hiệu hóa các hook thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  các trường prompt từ `before_agent_start` cũ và
  `enqueueNextTurnInjection`.

Ví dụ về các thành phần sử dụng không thuộc Plan:

| Kiểu mẫu Plugin               | Các hook được sử dụng                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Quy trình phê duyệt           | Phần mở rộng phiên, tiếp tục lệnh, nội dung chèn cho lượt tiếp theo, bộ mô tả giao diện người dùng                                      |
| Cổng chính sách ngân sách/không gian làm việc | Chính sách công cụ tin cậy, siêu dữ liệu công cụ, phép chiếu phiên                                                       |
| Trình giám sát vòng đời nền   | Dọn dẹp vòng đời thời gian chạy, đăng ký sự kiện tác nhân, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt Heartbeat, bộ mô tả giao diện người dùng |
| Trình hướng dẫn thiết lập hoặc làm quen | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả Control UI                                                                    |

<Note>
  Các không gian tên quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên `operator.admin`, ngay cả khi một Plugin cố gắng gán
  phạm vi phương thức Gateway hẹp hơn. Ưu tiên các tiền tố dành riêng cho Plugin đối với
  các phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào nên sử dụng middleware kết quả công cụ">
  Các Plugin đi kèm và các Plugin đã cài đặt được bật rõ ràng với hợp đồng
  manifest phù hợp có thể sử dụng `api.registerAgentToolResultMiddleware(...)` khi
  cần viết lại kết quả công cụ sau khi thực thi và trước khi thời gian chạy
  đưa kết quả đó trở lại mô hình. Đây là điểm nối trung lập với thời gian chạy và được tin cậy
  dành cho các bộ rút gọn đầu ra bất đồng bộ như tokenjuice.

Các Plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng
thời gian chạy mục tiêu, ví dụ `["openclaw", "codex"]`. Các Plugin đã cài đặt không có
hợp đồng đó hoặc không được bật rõ ràng thì không thể đăng ký middleware này; hãy giữ
các hook Plugin OpenClaw thông thường cho công việc không cần định thời kết quả công cụ
trước mô hình. Đường dẫn đăng ký factory phần mở rộng cũ chỉ dành cho
trình chạy nhúng đã bị xóa.
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
thông tin xác thực. Khám phá là một gợi ý định tuyến; xác thực Gateway và ghim TLS vẫn
sở hữu quan hệ tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: tên lệnh rõ ràng do bên đăng ký sở hữu
- `descriptors`: bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho phần trợ giúp CLI,
  định tuyến và đăng ký CLI Plugin tải lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn như
  `["nodes"]`

Đối với các tính năng Node đã ghép cặp, hãy ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một trình bao bọc nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và làm cho các lệnh như
`openclaw nodes canvas` trở thành các tính năng Node rõ ràng do Plugin sở hữu.

Nếu muốn một lệnh Plugin tiếp tục được tải lười trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất được bên
đăng ký đó cung cấp.

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
        description: "Quản lý tài khoản Matrix, quy trình xác minh, thiết bị và trạng thái hồ sơ",
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
        description: "Chụp hoặc kết xuất nội dung canvas từ một Node đã ghép đôi",
        hasSubcommands: true,
      },
    ],
  },
);
```

Chỉ dùng riêng `commands` khi không cần đăng ký CLI gốc theo kiểu tải lười.
Đường dẫn tương thích tải sớm đó vẫn được hỗ trợ, nhưng không cài đặt
các phần giữ chỗ dựa trên bộ mô tả để tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một Plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `claude-cli` hoặc `my-cli`.

- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình như `my-cli/gpt-5`.
- `config` của backend sử dụng cùng cấu trúc với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn được ưu tiên. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  cấu hình mặc định của Plugin trước khi chạy CLI.
- Dùng `normalizeConfig` khi backend cần viết lại để tương thích sau khi hợp nhất
  (ví dụ: chuẩn hóa các cấu trúc cờ cũ).
- Dùng `resolveExecutionArgs` cho các phép viết lại argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn ánh xạ các mức suy luận của OpenClaw sang một cờ mức độ nỗ lực
  gốc. Hook nhận `ctx.executionMode`; dùng `"side-question"` để thêm
  các cờ cô lập gốc của backend cho các lệnh gọi `/btw` tạm thời. Nếu những cờ đó
  vô hiệu hóa các công cụ gốc một cách đáng tin cậy đối với một CLI vốn luôn bật chúng, hãy khai báo
  cả `sideQuestionToolMode: "disabled"`.
- Dùng `prepareExecution` cho môi trường khởi chạy do backend sở hữu hoặc các cầu nối
  xác thực/cấu hình tạm thời. `ctx.contextTokenBudget` của nó là giới hạn token hiệu dụng
  được chọn cho lần chạy, nhờ đó các backend có Compaction gốc có thể căn chỉnh
  ngưỡng riêng mà không cần các nhánh lõi dành riêng cho nhà cung cấp.
- Các backend có thể vô hiệu hóa mọi công cụ gốc cho một lần chạy cụ thể có thể khai báo
  `nativeToolMode: "selectable"`. Các lệnh gọi bị hạn chế truyền một tuple
  `ctx.toolAvailability.native` rỗng cùng một danh sách cho phép MCP được cô lập chính xác khỏi máy chủ;
  `resolveExecutionArgs` phải thực thi cả hai trên argv mới cuối cùng hoặc argv tiếp tục.
  OpenClaw từ chối thực thi theo nguyên tắc đóng nếu backend không thể làm vậy.

Để xem hướng dẫn xây dựng toàn trình, hãy xem
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Vị trí độc quyền

| Phương thức                                  | Nội dung đăng ký                                                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi lần chỉ có một công cụ hoạt động). Các callback vòng đời nhận `runtimeSettings` khi máy chủ có thể cung cấp thông tin chẩn đoán mô hình/nhà cung cấp/chế độ; các công cụ nghiêm ngặt cũ hơn được thử lại mà không có khóa đó. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Trình tạo phần lời nhắc bộ nhớ                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Trình phân giải kế hoạch xả bộ nhớ                                                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | Bộ điều hợp runtime bộ nhớ                                                                                                                                                                         |

### Các bộ điều hợp nhúng bộ nhớ đã lỗi thời

| Phương thức                                    | Nội dung đăng ký                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Bộ điều hợp nhúng bộ nhớ cho Plugin đang hoạt động |

- `registerMemoryCapability` là API Plugin bộ nhớ độc quyền được ưu tiên.
- `registerMemoryCapability` cũng có thể cung cấp `publicArtifacts.listArtifacts(...)`
  để các Plugin đồng hành có thể sử dụng những tạo tác bộ nhớ đã xuất thông qua
  `openclaw/plugin-sdk/memory-host-core` thay vì truy cập vào bố cục riêng tư của một
  Plugin bộ nhớ cụ thể.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` và
  `registerMemoryRuntime` là các API Plugin bộ nhớ độc quyền tương thích với phiên bản cũ.
- `MemoryFlushPlan.model` có thể ghim lượt xả vào một tham chiếu `provider/model`
  chính xác, chẳng hạn `ollama/qwen3:8b`, mà không kế thừa chuỗi dự phòng đang hoạt động.
- `registerMemoryEmbeddingProvider` đã lỗi thời. Các nhà cung cấp nhúng mới
  nên dùng `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`.
- Các nhà cung cấp hiện có dành riêng cho bộ nhớ tiếp tục hoạt động trong khoảng thời gian
  di chuyển, nhưng quy trình kiểm tra Plugin báo cáo đây là khoản nợ tương thích đối với
  các Plugin không đi kèm.

### Sự kiện và vòng đời

| Phương thức                                  | Chức năng                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu         |
| `api.onConversationBindingResolved(handler)` | Callback liên kết cuộc hội thoại |

Xem [Hook Plugin](/vi/plugins/hooks) để biết các ví dụ, tên hook phổ biến và ngữ nghĩa
của cơ chế bảo vệ.

### Ngữ nghĩa quyết định của hook

`before_install` là một hook vòng đời runtime của Plugin, không phải bề mặt chính sách
cài đặt của người vận hành. Dùng `security.installPolicy` khi một quyết định cho phép/chặn phải
bao quát các đường dẫn cài đặt hoặc cập nhật dựa trên CLI và Gateway.

- `before_tool_call`: việc trả về `{ block: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: việc trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: việc trả về `{ block: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: việc trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: việc trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ trình xử lý nào nhận quyền điều phối, các trình xử lý có mức ưu tiên thấp hơn và đường dẫn điều phối mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: việc trả về `{ cancel: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có mức ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: việc trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: dùng trường `threadId` có kiểu khi cần định tuyến luồng/chủ đề đến. Giữ `metadata` cho các phần bổ sung dành riêng cho kênh.
- `message_sending`: dùng các trường định tuyến `replyToId` / `threadId` có kiểu trước khi chuyển sang phương án dự phòng `metadata` dành riêng cho kênh.
- `gateway_start`: dùng `ctx.config`, `ctx.workspaceDir` và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì dựa vào các hook `gateway:startup` nội bộ. Cron có thể vẫn đang tải tại thời điểm này.
- `cron_reconciled`: xây dựng lại toàn bộ phép chiếu cron bên ngoài sau khi khởi động hoặc tải lại bộ lập lịch. Nó bao gồm `reason` và trạng thái `enabled` hiệu dụng, bao gồm `enabled: false`, trong khi `ctx.getCron?.()` trả về chính xác bộ lập lịch đã được đối soát. Truyền `ctx.abortSignal` vào công việc chiếu bền vững; nó hủy khi ảnh chụp nhanh của bộ lập lịch đó bị thay thế hoặc Gateway đóng.
- `cron_changed`: theo dõi các thay đổi vòng đời cron do Gateway sở hữu. Các sự kiện `scheduled` và `removed` là gợi ý đối soát sau khi commit, không phải nhật ký chênh lệch có thứ tự. `event.nextRunAtMs` của một sự kiện đã lên lịch không tồn tại khi tác vụ không có lần đánh thức tiếp theo; một sự kiện đã xóa vẫn mang ảnh chụp nhanh của tác vụ đã bị xóa.

Các bộ lập lịch đánh thức bên ngoài nên chống dội hoặc gộp các sự kiện `cron_changed`,
sau đó đọc lại toàn bộ chế độ xem bền vững từ bộ lập lịch được
`cron_reconciled` ghi lại gần nhất. Không tiếp nhận bộ lập lịch từ ngữ cảnh `cron_changed`: một
gợi ý tách rời từ bộ lập lịch cũ hơn có thể chồng lấn với một lần tải lại sau đó.

Dùng `cron_reconciled` làm trình kích hoạt ảnh chụp nhanh đầy đủ cho trạng thái bền vững được tải khi
Gateway khởi động hoặc khi thay thế bộ lập lịch. Nó không được phát lại khi chỉ tải nóng lại
một Plugin. Các trình xử lý theo dõi chạy song song và các lần điều phối
không chờ kết quả có thể chồng lấn, vì vậy bên sử dụng không được phụ thuộc vào thứ tự hoàn tất sự kiện.
Giữ OpenClaw làm nguồn dữ liệu chuẩn cho việc kiểm tra đến hạn và thực thi.

Để xem một bộ điều hợp chỉ chạy một luồng với khả năng thay thế bền vững, thử lại/lùi thời gian và tắt
sạch, hãy xem [Phép chiếu cron bên ngoài an toàn](/vi/plugins/hooks#safe-external-cron-projection).

### Các trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                        |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                    |
| `api.name`               | `string`                  | Tên hiển thị                                                                                 |
| `api.version`            | `string?`                 | Phiên bản Plugin (không bắt buộc)                                                             |
| `api.description`        | `string?`                 | Mô tả Plugin (không bắt buộc)                                                                |
| `api.source`             | `string`                  | Đường dẫn nguồn Plugin                                                                       |
| `api.rootDir`            | `string?`                 | Thư mục gốc của Plugin (không bắt buộc)                                                       |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp nhanh cấu hình hiện tại (ảnh chụp nhanh runtime trong bộ nhớ đang hoạt động khi có) |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`                              |
| `api.runtime`            | `PluginRuntime`           | [Các trình trợ giúp runtime](/vi/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Trình ghi nhật ký theo phạm vi (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là khoảng thời gian khởi động/thiết lập nhẹ trước khi vào đầy đủ |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với thư mục gốc của Plugin                                     |

## Quy ước mô-đun nội bộ

Trong Plugin, hãy dùng các tệp barrel cục bộ cho các lệnh nhập nội bộ:

```text
my-plugin/
  api.ts            # Các nội dung xuất công khai dành cho đối tượng sử dụng bên ngoài
  runtime-api.ts    # Các nội dung xuất chỉ dành cho runtime nội bộ
  index.ts          # Điểm vào của Plugin
  setup-entry.ts    # Điểm vào nhẹ chỉ dành cho thiết lập (tùy chọn)
```

<Warning>
  Tuyệt đối không nhập chính plugin của bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã production. Định tuyến các lệnh nhập nội bộ thông qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của plugin tích hợp sẵn được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các tệp điểm vào công khai tương tự) ưu tiên
ảnh chụp nhanh cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp nhanh runtime, chúng sẽ dùng dự phòng là tệp cấu hình đã phân giải trên đĩa.
Các facade của plugin tích hợp sẵn đã đóng gói phải được tải thông qua các trình tải
facade plugin của OpenClaw; việc nhập trực tiếp từ `dist/extensions/...` sẽ bỏ qua các bước kiểm tra
manifest và sidecar runtime mà bản cài đặt đóng gói sử dụng cho mã do plugin sở hữu.

Các plugin nhà cung cấp có thể cung cấp một barrel hợp đồng hẹp cục bộ trong plugin khi một
trình trợ giúp được chủ ý thiết kế riêng cho nhà cung cấp và chưa phù hợp với một đường dẫn con SDK
chung. Các ví dụ tích hợp sẵn:

- **Anthropic**: seam công khai `api.ts` / `contract-api.ts` cho trình trợ giúp
  beta-header và luồng `service_tier` của Claude.
- **`@openclaw/openai-provider`**: `api.ts` xuất các trình dựng nhà cung cấp,
  trình trợ giúp mô hình mặc định và trình dựng nhà cung cấp thời gian thực.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất trình dựng nhà cung cấp
  cùng các trình trợ giúp onboarding/cấu hình.

<Warning>
  Mã production của phần mở rộng cũng nên tránh các lệnh nhập `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trình trợ giúp thực sự được dùng chung, hãy nâng nó lên một đường dẫn con SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared` hoặc một bề mặt khác
  định hướng theo khả năng thay vì ghép nối hai plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trình trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tài liệu tham chiếu đầy đủ về namespace `api.runtime`.
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
