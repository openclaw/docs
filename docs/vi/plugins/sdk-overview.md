---
read_when:
    - Bạn cần biết cần nhập từ đường dẫn con nào của SDK
    - Bạn muốn tài liệu tham khảo về tất cả các phương thức đăng ký trên OpenClawPluginApi
    - Bạn đang tra cứu một mục xuất cụ thể của SDK
sidebarTitle: Plugin SDK overview
summary: Bản đồ import, tài liệu tham chiếu API đăng ký và kiến trúc SDK
title: Tổng quan về SDK Plugin
x-i18n:
    generated_at: "2026-07-21T13:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 353bcfa9a9ece30677601db275b9db9716a91a1ad33c335a8b11580a262e7d62
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK là hợp đồng có kiểu giữa các plugin và lõi. Trang này là tài liệu
tham chiếu về **những gì cần nhập** và **những gì có thể đăng ký**.

<Note>
  Trang này dành cho tác giả plugin sử dụng `openclaw/plugin-sdk/*` bên trong
  OpenClaw. Đối với các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
  muốn chạy các agent thông qua Gateway, hãy sử dụng
  [Tích hợp Gateway cho ứng dụng bên ngoài](/vi/gateway/external-apps).
</Note>

<Tip>
Bạn đang tìm hướng dẫn thực hành? Hãy bắt đầu với [Xây dựng plugin](/vi/plugins/building-plugins). Sử dụng [Plugin kênh](/vi/plugins/sdk-channel-plugins) cho các kênh, [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) cho nhà cung cấp mô hình, [Plugin backend CLI](/vi/plugins/cli-backend-plugins) cho các backend CLI AI cục bộ, [Plugin bộ thực thi agent](/vi/plugins/sdk-agent-harness) cho các trình thực thi agent gốc và [Hook plugin](/vi/plugins/hooks) cho các hook công cụ hoặc vòng đời.
</Tip>

## Quy ước nhập

Luôn nhập từ một đường dẫn con cụ thể:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Mỗi đường dẫn con là một mô-đun nhỏ, độc lập. Điều này giúp khởi động nhanh và
ngăn ngừa các vấn đề phụ thuộc vòng. Đối với các trình trợ giúp điểm vào/bản dựng dành riêng cho kênh,
hãy ưu tiên `openclaw/plugin-sdk/channel-core`; giữ `openclaw/plugin-sdk/core` cho
bề mặt bao quát rộng hơn và các trình trợ giúp dùng chung như
`buildChannelConfigSchema`.

Đối với cấu hình kênh, hãy công bố JSON Schema do kênh sở hữu thông qua
`openclaw.plugin.json#channelConfigs`. Đường dẫn con `plugin-sdk/channel-config-schema`
dành cho các thành phần schema nguyên thủy dùng chung và trình dựng chung. Các plugin
đi kèm OpenClaw sử dụng `plugin-sdk/bundled-channel-config-schema` cho các schema
kênh đi kèm được giữ lại. Đường dẫn con schema đi kèm đó không phải là mẫu cho các
plugin mới.

<Warning>
  Không nhập các seam tiện ích mang thương hiệu nhà cung cấp hoặc kênh (ví dụ:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Các plugin đi kèm kết hợp các đường dẫn con SDK chung bên trong các barrel `api.ts` /
  `runtime-api.ts` của riêng chúng; các thành phần sử dụng lõi nên dùng các barrel cục bộ
  của plugin đó hoặc thêm một hợp đồng SDK chung có phạm vi hẹp khi nhu cầu thực sự
  áp dụng cho nhiều kênh.

Một tập nhỏ các seam trợ giúp plugin đi kèm vẫn xuất hiện trong ánh xạ xuất được tạo
khi chúng có hoạt động sử dụng được theo dõi từ chủ sở hữu. Chúng chỉ tồn tại để bảo trì
plugin đi kèm và không phải là đường dẫn nhập được khuyến nghị cho các plugin bên thứ ba
mới.

`openclaw/plugin-sdk/discord` và `openclaw/plugin-sdk/telegram-account` cũng
được giữ lại dưới dạng các facade tương thích đã ngừng khuyến nghị cho hoạt động sử dụng được theo dõi từ chủ sở hữu. Không
sao chép các đường dẫn nhập đó vào plugin mới; thay vào đó, hãy sử dụng các trình trợ giúp runtime
được chèn và các đường dẫn con SDK kênh chung.
</Warning>

## Tham chiếu đường dẫn con

Plugin SDK được cung cấp dưới dạng một tập hợp các đường dẫn con có phạm vi hẹp, được nhóm theo lĩnh vực (điểm vào
plugin, kênh, nhà cung cấp, xác thực, runtime, khả năng, bộ nhớ và các trình trợ giúp
plugin đi kèm được dành riêng). Để xem danh mục đầy đủ — đã được nhóm và liên kết — hãy xem
[Đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).

Danh mục điểm vào của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các mục xuất công khai có kiểu loại trừ
các đường dẫn con nội bộ được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Các điểm vào sản xuất
trong danh sách đó vẫn giữ các mục xuất runtime máy chủ chỉ dành cho JavaScript cho các plugin chính thức
được phát hành riêng, trong khi các điểm vào chỉ dành cho kiểm thử vẫn không được xuất. Chạy
`pnpm plugin-sdk:surface` để kiểm tra số lượng mục xuất công khai. Các đường dẫn con công khai
đã ngừng khuyến nghị, đủ cũ và không được mã sản xuất của tiện ích mở rộng đi kèm sử dụng,
được theo dõi trong `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; các
barrel tái xuất rộng đã ngừng khuyến nghị được theo dõi trong
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API đăng ký

Callback `register(api)` nhận một đối tượng `OpenClawPluginApi` với các
phương thức sau:

Các plugin cung cấp bề mặt trò chuyện nhóm bên ngoài cho một phiên có thể đăng ký
nhà cung cấp duy nhất trên toàn tiến trình được xuất bởi
`openclaw/plugin-sdk/session-discussion`. Phương thức `info({ sessionKey })` của nó
cho biết một cuộc thảo luận không khả dụng, sẵn sàng mở hay đã mở;
`open({ sessionKey })` tạo hoặc phân giải cuộc thảo luận và trả về các URL nhúng
và bên ngoài của cuộc thảo luận. Việc đăng ký một nhà cung cấp khác sẽ thay thế nhà cung cấp hiện tại.

### Đăng ký khả năng

| Phương thức                                      | Nội dung đăng ký                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Suy luận văn bản (LLM)                                                             |
| `api.registerWorkerProvider(...)`                | Lease vòng đời worker đám mây                                                      |
| `api.registerModelCatalogProvider(...)`          | Các hàng danh mục mô hình cho việc tạo văn bản và nội dung đa phương tiện           |
| `api.registerAgentHarness(...)`                  | Trình thực thi agent gốc [Thử nghiệm](/vi/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend suy luận CLI cục bộ                                                        |
| `api.registerChannel(...)`                       | Kênh nhắn tin                                                                       |
| `api.registerEmbeddingProvider(...)`             | Nhà cung cấp embedding vectơ có thể tái sử dụng                                    |
| `api.registerSpeechProvider(...)`                | Tổng hợp văn bản thành giọng nói / STT                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | Phiên âm thời gian thực dạng luồng                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | Phiên thoại thời gian thực hai chiều                                               |
| `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video                                                  |
| `api.registerTranscriptSourceProvider(...)`      | Nguồn bản chép lời cuộc họp trực tiếp hoặc được nhập                               |
| `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                                                                        |
| `api.registerMusicGenerationProvider(...)`       | Tạo nhạc                                                                            |
| `api.registerVideoGenerationProvider(...)`       | Tạo video                                                                           |
| `api.registerWebFetchProvider(...)`              | Nhà cung cấp tìm nạp / thu thập dữ liệu web                                        |
| `api.registerWebSearchProvider(...)`             | Tìm kiếm web                                                                        |
| `api.registerCompactionProvider(...)`            | Backend Compaction bản chép lời có thể cắm                                         |

Các nhà cung cấp worker cũng phải khai báo id của mình trong `contracts.workerProviders`.
Lõi lưu giữ ý định bền vững trước `provision(profile, operationId)`. Các nhà cung cấp xác thực cài đặt trước khi cấp phát bên ngoài và ném `WorkerProviderError` khi hồ sơ bị từ chối vĩnh viễn. `provision` phải tiếp nhận cùng một lease khi id thao tác lặp lại.
Lõi lưu giữ các cài đặt hồ sơ đã xác thực cùng với lease và cung cấp bản chụp đó cho `destroy({ leaseId, profile })`, phương thức này phải có tính lũy đẳng, và `inspect({ leaseId, profile })`, phương thức này trả về `active`, `destroyed` hoặc `unknown`. Điều này cho phép các nhà cung cấp định tuyến các lệnh gọi vòng đời sau khi Gateway khởi động lại hoặc hồ sơ có tên bị xóa. Các điểm cuối SSH sử dụng một `SecretRef` cho `keyRef`, không bao giờ dùng trực tiếp vật liệu khóa, và bao gồm một `hostKey` từ đầu ra cấp phát đáng tin cậy dưới dạng chính xác `algorithm base64`, không có tên máy chủ hoặc chú thích. Lõi ghim `hostKey` và không bao giờ tin cậy khóa từ kết nối đầu tiên. Nhà cung cấp tạo một `keyRef` động có thể triển khai `resolveSshIdentity({ leaseId, profile, keyRef })`; khi có, trình phân giải đó là nguồn có thẩm quyền, còn các nhà cung cấp không có trình phân giải này sử dụng trình phân giải bí mật chung đã cấu hình.
Các nhà cung cấp có lease có thể gia hạn cũng có thể triển khai `renew(leaseId)`.
`inspect` phải ném lỗi đối với các lỗi tạm thời hoặc không xác định; chỉ trả về `unknown` khi sự vắng mặt đã được xác nhận chắc chắn. Lõi đánh dấu một bản ghi cục bộ đang hoạt động là mồ côi hoặc coi sự vắng mặt là việc tháo dỡ đã hoàn tất sau một yêu cầu hủy đã được lưu giữ.

Các nhà cung cấp embedding được đăng ký bằng `api.registerEmbeddingProvider(...)` cũng phải
được liệt kê trong `contracts.embeddingProviders` trong manifest plugin. Đây
là bề mặt embedding chung để tạo vectơ có thể tái sử dụng. Tìm kiếm bộ nhớ
có thể sử dụng bề mặt nhà cung cấp chung này. Seam cũ
`api.registerMemoryEmbeddingProvider(...)` và
`contracts.memoryEmbeddingProviders` là lớp tương thích đã ngừng khuyến nghị trong khi
các nhà cung cấp dành riêng cho bộ nhớ hiện có tiến hành di chuyển.

Các nhà cung cấp dành riêng cho bộ nhớ vẫn cung cấp một `batchEmbed(...)` runtime tiếp tục sử dụng
hợp đồng xử lý theo lô trên từng tệp hiện có, trừ khi runtime của chúng đặt rõ ràng
`sourceWideBatchEmbed: true`. Tùy chọn bật này cho phép máy chủ bộ nhớ gửi các đoạn từ
nhiều tệp bộ nhớ đã thay đổi và các nguồn đã bật trong một lệnh gọi `batchEmbed(...)`, tối đa
theo giới hạn lô của máy chủ. Các adapter lô tải lên tệp yêu cầu JSONL cũng phải
chia nhỏ các tác vụ nhà cung cấp trước khi đạt giới hạn kích thước tải lên cũng như giới hạn số lượng
yêu cầu. Nhà cung cấp phải trả về một embedding cho mỗi đoạn đầu vào theo cùng thứ tự như
`batch.chunks`; bỏ cờ này khi nhà cung cấp yêu cầu các lô cục bộ theo tệp hoặc
không thể giữ nguyên thứ tự đầu vào trong một tác vụ lớn hơn trên toàn nguồn.

### Công cụ và lệnh

Sử dụng [`defineToolPlugin`](/vi/plugins/tool-plugins) cho các plugin chỉ có công cụ đơn giản
với tên công cụ cố định. Sử dụng trực tiếp `api.registerTool(...)` cho các plugin hỗn hợp
hoặc việc đăng ký công cụ hoàn toàn động.

| Phương thức                            | Nội dung đăng ký                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Công cụ agent (bắt buộc hoặc `{ optional: true }`)                                                                                          |
| `api.registerCommand(def)`             | Lệnh tùy chỉnh (bỏ qua LLM)                                                                                                               |
| `api.registerNodeHostCommand(command)` | Lệnh do `openclaw node run` xử lý; siêu dữ liệu `agentTool` tùy chọn có thể hiển thị lệnh dưới dạng công cụ mà agent thấy được khi Node được kết nối |

Các lệnh plugin có thể đặt `agentPromptGuidance` khi agent cần một gợi ý định tuyến ngắn
do lệnh sở hữu. Chỉ để nội dung đó nói về chính lệnh; không thêm
chính sách dành riêng cho nhà cung cấp hoặc plugin vào các trình dựng prompt lõi.

Các mục hướng dẫn có thể là chuỗi kế thừa, áp dụng cho mọi bề mặt prompt, hoặc
các mục có cấu trúc:

```ts
agentPromptGuidance: [
  "Gợi ý lệnh toàn cục.",
  { text: "Chỉ hiển thị nội dung này trong prompt OpenClaw chính.", surfaces: ["openclaw_main"] },
];
```

`surfaces` có cấu trúc có thể bao gồm `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` hoặc `subagent`. `pi_main` vẫn là bí danh đã ngừng khuyến nghị
cho `openclaw_main`. Bỏ `surfaces` khi chủ ý áp dụng hướng dẫn cho mọi bề mặt. Không
truyền một mảng `surfaces` rỗng; mảng này sẽ bị từ chối để việc vô tình mất phạm vi không
biến thành văn bản prompt toàn cục.

Chỉ dẫn dành cho nhà phát triển của máy chủ ứng dụng Codex gốc nghiêm ngặt hơn các bề mặt prompt
khác: chỉ hướng dẫn được giới hạn phạm vi rõ ràng ở `codex_app_server` mới được đưa vào
luồng có mức ưu tiên cao hơn đó. Hướng dẫn dạng chuỗi kế thừa và hướng dẫn có cấu trúc
không giới hạn phạm vi vẫn khả dụng cho các bề mặt prompt không phải Codex nhằm đảm bảo khả năng tương thích.

Các lệnh trên máy chủ Node chạy trên máy chủ Node đã kết nối, không chạy bên trong tiến trình
Gateway. Nếu có `agentTool`, Node sẽ công bố một bộ mô tả sau khi
kết nối Gateway thành công; Gateway chỉ cung cấp bộ mô tả đó cho các lượt chạy của tác nhân trong khi
Node đó đang kết nối và chỉ khi `command` của bộ mô tả nằm trong bề mặt lệnh
được phê duyệt của Node. Đặt `agentTool.defaultPlatforms` để đưa một
lệnh không nguy hiểm vào danh sách cho phép lệnh Node mặc định; nếu không, yêu cầu
`gateway.nodes.allowCommands` rõ ràng hoặc chính sách gọi Node. `agentTool.name`
phải an toàn với nhà cung cấp: bắt đầu bằng một chữ cái, chỉ sử dụng chữ cái, chữ số,
dấu gạch dưới hoặc dấu gạch nối và không vượt quá 64 ký tự. Các công cụ Node dựa trên MCP
có thể đặt siêu dữ liệu `agentTool.mcp` để các bề mặt danh mục và tìm kiếm công cụ có thể hiển thị
danh tính máy chủ/công cụ MCP từ xa, nhưng việc thực thi vẫn đi qua
lệnh Node đã được công bố.

### Hạ tầng

| Phương thức                                      | Nội dung đăng ký                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook sự kiện                                                            |
| `api.registerHttpRoute(params)`                 | Điểm cuối HTTP của Gateway                                              |
| `api.registerGatewayMethod(name, handler)`      | Phương thức RPC của Gateway                                             |
| `api.registerGatewayDiscoveryService(service)`  | Bộ quảng bá khám phá Gateway cục bộ                                     |
| `api.registerCli(registrar, opts?)`             | Lệnh con CLI                                                            |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI tính năng Node trong `openclaw nodes`                                |
| `api.registerService(service)`                  | Dịch vụ nền                                                             |
| `api.registerInteractiveHandler(registration)`  | Trình xử lý tương tác                                                   |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware kết quả công cụ khi chạy                                     |
| `api.registerMemoryPromptSupplement(builder)`   | Phần bổ sung liên quan đến bộ nhớ trong prompt                          |
| `api.registerMemoryPromptPreparation(prepare)`  | Chuẩn bị bất đồng bộ cho phần liên quan đến bộ nhớ trong prompt         |
| `api.registerMemoryCorpusSupplement(adapter)`   | Kho dữ liệu tìm kiếm/đọc bộ nhớ bổ sung                                 |
| `api.registerHostedMediaResolver(resolver)`     | Trình phân giải URL phương tiện được lưu trữ kiểu trình duyệt           |
| `api.registerMcpServerConnectionResolver(...)`  | Vận chuyển MCP theo từng bên yêu cầu (`url`/`headers`) cho một tên máy chủ tĩnh |
| `api.registerTextTransforms(transforms)`        | Viết lại văn bản tương thích prompt/tin nhắn do Plugin sở hữu           |
| `api.registerConfigMigration(migrate)`          | Di chuyển cấu hình nhẹ chạy trước khi môi trường chạy Plugin tải        |
| `api.registerMigrationProvider(provider)`       | Trình nhập cho `openclaw migrate`                                        |
| `api.registerAutoEnableProbe(probe)`            | Phép dò cấu hình có thể tự động bật Plugin này                          |
| `api.registerReload(registration)`              | Chính sách tiền tố cấu hình khởi động lại/tải nóng/không làm gì để xử lý tải lại |
| `api.registerNodeHostCommand(command)`          | Trình xử lý lệnh được cung cấp cho các Node đã ghép cặp                  |
| `api.registerNodeInvokePolicy(policy)`          | Chính sách danh sách cho phép/phê duyệt cho các lệnh do Node gọi        |
| `api.registerSecurityAuditCollector(collector)` | Bộ thu thập phát hiện cho `openclaw security audit`                       |

#### Công việc Webhook sau khi xác nhận

Các tuyến Webhook xác nhận yêu cầu trước khi hoàn tất xử lý phải chuyển
công việc đã tách đó sang gốc tiếp nhận được theo dõi riêng:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`điều phối webhook thất bại: ${String(error)}`);
});
```

Gọi `runDetachedWebhookWork(...)` một cách đồng bộ khi yêu cầu HTTP vẫn đang
được tiếp nhận. Trình trợ giúp lập tức dành riêng một gốc độc lập, sau đó bắt đầu
callback trong vi tác vụ tiếp theo để trình xử lý yêu cầu có thể ghi
xác nhận trước. Promise được trả về tiếp nhận kết quả callback; bên gọi
vẫn chịu trách nhiệm xử lý từ chối. Điều này giúp công việc hàng đợi sau xác nhận được tiếp nhận và khiến
quá trình xả khi khởi động lại hoặc tạm ngưng chờ công việc đó. Các trình xử lý chờ toàn bộ quá trình xử lý
trước khi trả về không cần trình trợ giúp này.

#### Kết nối MCP theo phạm vi bên yêu cầu

Giữ **danh tính** máy chủ MCP ở dạng tĩnh (tên, bộ lọc công cụ) trong `mcp.servers` hoặc một
manifest gói. Có thể đăng ký thêm trình phân giải kết nối để mỗi
bên yêu cầu tin nhắn đáng tin cậy có phương thức vận chuyển riêng:

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

Ghi chú về hợp đồng:

- Ngữ cảnh trình phân giải chỉ mang danh tính máy chủ đáng tin cậy (`requesterSenderId`,
  cùng `agentAccountId` / `messageChannel` tùy chọn). Có thể bổ sung các trường đáng tin cậy trong tương lai (ví dụ
  ngữ cảnh người dùng cron/tác nhân con) theo hướng cộng thêm.
- Một Plugin sở hữu một tên máy chủ: `registerMcpServerConnectionResolver`
  trùng lặp cho cùng `serverName` từ một
  Plugin khác sẽ bị từ chối kèm chẩn đoán lỗi (lần đăng ký đầu tiên thắng), để
  quyền sở hữu kết nối không bao giờ phụ thuộc vào thứ tự tải Plugin.
- Tên công cụ được suy ra từ toàn bộ tập hợp máy chủ đã khai báo để việc phân giải một phần
  không bao giờ làm thay đổi tên máy chủ an toàn giữa các bên yêu cầu hoặc các lượt. Phần lõi không
  xác minh rằng các điểm cuối của những bên yêu cầu khác nhau cung cấp lược đồ công cụ giống nhau; một
  trình phân giải phải trỏ mọi bên yêu cầu đến cùng một dịch vụ logic, nếu không các lược đồ
  công cụ (và độ ổn định của bộ nhớ đệm prompt) sẽ khác nhau theo từng bên yêu cầu.
- Các lượt chạy không có `requesterSenderId` đáng tin cậy (cron, tác nhân con, heartbeat, Gateway
  công khai) không bao giờ hiện thực hóa máy chủ theo phạm vi bên yêu cầu. Không có
  kết nối dự phòng dùng chung.
- `resolve` bị giới hạn ở 10 giây cho mỗi máy chủ; hết thời gian chờ hoặc phát sinh ngoại lệ sẽ bỏ qua
  máy chủ đó trong lượt chạy mà không làm MCP tĩnh thất bại.
- Các kết nối đã phân giải được xác thực lại tối đa mỗi 5 phút cho mỗi bên yêu cầu:
  việc xoay vòng dựng lại phương thức vận chuyển bằng thông tin xác thực mới, còn kết quả `null`
  sẽ thu hồi kết nối đó (môi trường chạy được lưu đệm sẽ bị hủy ngay cả giữa phiên). Do đó, thông tin xác thực
  đã bị thu hồi hoặc xoay vòng có thể vẫn được sử dụng trong tối đa 5 phút.
- `headers` đã phân giải không bao giờ được ghi nhật ký hoặc lưu bền vững; phần lõi chỉ giữ một bản tóm lược
  có khóa tạm thời trong bộ nhớ (HMAC cục bộ theo tiến trình) để phát hiện việc xoay vòng thông tin xác thực và
  đăng ký các giá trị thông tin xác thực trong tiêu đề/URL đã phân giải với sổ đăng ký
  che dữ liệu của chức năng ghi nhật ký/ghi lại thông tin gỡ lỗi.
- Máy chủ theo phạm vi bên yêu cầu không tạo chế độ xem Ứng dụng MCP: một chế độ xem tồn tại lâu hơn
  lượt chạy đã xác thực bên yêu cầu và ranh giới chế độ xem Gateway không có danh tính
  bên yêu cầu, vì vậy bản xem trước ứng dụng giữ trạng thái đóng an toàn cho các máy chủ này. Kết quả công cụ
  không bị ảnh hưởng.
- Các máy chủ tĩnh không có trình phân giải tiếp tục sử dụng vòng đời theo phạm vi phiên hiện có.
- **Quy tắc phân phối của bộ kiểm thử:** máy chủ theo phạm vi bên yêu cầu không bao giờ được đưa vào
  cấu hình máy khách MCP gốc của bộ kiểm thử (luồng Codex `mcp_servers`, CLI `-c mcp_servers=…` hoặc bất kỳ
  phép chiếu MCP dùng chung theo phiên nào khác). Thay vào đó, các bộ kiểm thử phân phối chúng dưới dạng công cụ
  theo phạm vi lượt chạy:
  - Trình chạy nhúng: môi trường chạy MCP theo phiên + công cụ gói (tĩnh + theo phạm vi).
  - Máy chủ ứng dụng Codex: công cụ động thông qua
    `materializeRequesterScopedMcpToolsForHarnessRun` (chỉ theo phạm vi; các máy chủ tĩnh
    vẫn sử dụng máy khách MCP gốc của Codex).
- **Đặc tả** công cụ theo phạm vi ổn định trong phiên sau lần phân giải thành công đầu tiên
  trong phiên đó, vì vậy các bộ kiểm thử dùng chung luồng (Codex) không xoay vòng luồng khi
  người gửi thay đổi. Trước khi bất kỳ bên yêu cầu nào phân giải, không có đặc tả theo phạm vi nào được công bố.
- Các bên yêu cầu chưa xác thực trên bộ kiểm thử dùng chung luồng vẫn thấy các công cụ theo phạm vi
  đã được công bố; việc gọi một công cụ sẽ trả về lỗi công cụ chưa kết nối rõ ràng cho
  bên yêu cầu đó. OpenClaw không bao giờ dùng thông tin xác thực của bên yêu cầu khác làm dự phòng.

Các trình dựng phần bổ sung prompt bộ nhớ nhận ngữ cảnh `agentId`,
`agentSessionKey` và `sandboxed` tùy chọn. Các lệnh gọi `search`
và `get` của phần bổ sung kho dữ liệu bộ nhớ nhận ngữ cảnh `agentId` và `sandboxed` tùy chọn. Các Plugin có
bộ lưu trữ do tác nhân sở hữu phải phân giải bộ lưu trữ đó cho từng lệnh gọi thay vì
ghi nhận một đường dẫn toàn cục trong lúc đăng ký. Nếu cần ID tác nhân nhưng
bị thiếu trong một thao tác đa tác nhân, hãy đóng an toàn thay vì chọn một
tác nhân tùy ý.

Sử dụng `registerMemoryPromptPreparation(...)` khi văn bản prompt phụ thuộc vào trạng thái Plugin
bất đồng bộ. Callback chạy một lần trước mỗi prompt tác nhân đầy đủ và nhận
cùng ngữ cảnh công cụ, tác nhân, phiên và sandbox như các trình dựng prompt
bộ nhớ đồng bộ. Xác thực phiên bản chủ sở hữu bộ lưu trữ hiện tại trước khi tải trạng thái
được lưu bền vững, sau đó chỉ trả về các dòng dành cho lượt chạy đó. OpenClaw đóng băng các dòng đó và
chuyển kết quả bất biến cho quá trình hợp thành prompt đồng bộ. Giữ việc lưu bền vững,
thay thế nguyên tử và xóa khi loại bỏ chủ sở hữu bên trong Plugin sở hữu; không
thăm dò hoặc đọc tệp từ trình dựng prompt.

Các trình xử lý tương tác Telegram có thể trả về `{ submitText }` để định tuyến văn bản qua
đường dẫn tác nhân đầu vào thông thường của Telegram sau khi trình xử lý thành công. OpenClaw giữ
nút callback khi chính sách đầu vào bỏ qua văn bản hoặc quá trình xử lý thất bại, để
người dùng có thể thử lại sau khi điều kiện chặn thay đổi. Trường kết quả này dành riêng
cho Telegram; các kênh khác giữ hợp đồng kết quả tương tác riêng.

### Hook máy chủ cho Plugin quy trình công việc

Hook máy chủ là các điểm nối SDK dành cho Plugin cần tham gia vào vòng đời
máy chủ thay vì chỉ thêm nhà cung cấp, kênh hoặc công cụ. Chúng là
các hợp đồng chung; Chế độ lập kế hoạch có thể sử dụng chúng, cũng như các quy trình phê duyệt,
cổng chính sách không gian làm việc, trình giám sát nền, trình hướng dẫn thiết lập và Plugin
đồng hành giao diện người dùng.

| Phương thức                                                                          | Hợp đồng do phương thức sở hữu                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Trạng thái phiên tương thích với JSON do Plugin sở hữu, được chiếu qua các phiên Gateway                                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Ngữ cảnh bền vững, chính xác một lần được chèn vào lượt tác tử tiếp theo cho một phiên                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Chính sách công cụ tin cậy trước Plugin, được kiểm soát bằng manifest, có thể chặn hoặc viết lại các tham số công cụ                                     |
| `api.registerToolMetadata(...)`                                                      | Siêu dữ liệu hiển thị danh mục công cụ mà không thay đổi phần triển khai công cụ                                                                          |
| `api.registerCommand(...)`                                                           | Các lệnh Plugin có phạm vi; kết quả lệnh có thể đặt `continueAgent: true` hoặc `suppressReply: true`; các lệnh gốc của Discord hỗ trợ `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Bộ mô tả phần đóng góp cho Control UI đối với các bề mặt phiên, công cụ, lượt chạy, cài đặt hoặc thẻ                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Các callback dọn dẹp tài nguyên thời gian chạy do Plugin sở hữu trên các đường dẫn đặt lại/xóa/tải lại                                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Các đăng ký sự kiện đã được làm sạch dành cho trạng thái quy trình công việc và trình giám sát                                                            |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Trạng thái tạm của Plugin theo từng lượt chạy, được xóa khi lượt chạy bước vào giai đoạn kết thúc vòng đời                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Siêu dữ liệu dọn dẹp cho các công việc của bộ lập lịch do Plugin sở hữu; không lập lịch công việc hoặc tạo bản ghi tác vụ                                  |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Chỉ dành cho Plugin đi kèm: phân phối tệp đính kèm qua máy chủ đến tuyến phiên gửi trực tiếp đang hoạt động                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Chỉ dành cho Plugin đi kèm: các lượt phiên được lập lịch dựa trên Cron cùng hoạt động dọn dẹp theo thẻ                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Các hành động phiên có kiểu mà máy khách có thể điều phối qua Gateway                                                                                     |

Bộ mô tả `surface: "tab"` thêm một thẻ thanh bên vào Control UI. Bộ mô tả thẻ
của các Plugin đang hoạt động được công bố cho máy khách bảng điều khiển trong lời chào của
Gateway (`controlUiTabs`), vì vậy thẻ chỉ xuất hiện khi Plugin được bật.
Các Plugin đi kèm có thể cung cấp chế độ xem bảng điều khiển hạng nhất cho thẻ của mình; các
Plugin khác có thể đặt `path` thành một tuyến HTTP của Plugin (xem
`api.registerHttpRoute(...)`) để bảng điều khiển kết xuất trong một khung sandbox.
`icon` là gợi ý tên biểu tượng bảng điều khiển, `group` chọn phần thanh bên
(`control` hoặc `agent`), `order` sắp xếp giữa các thẻ Plugin, còn `requiredScopes`
ẩn thẻ khỏi các kết nối không có những phạm vi vận hành viên đó:

Đối với thẻ bên ngoài được Gateway bảo vệ, hãy đăng ký bộ mô tả `path` dưới một
tuyến HTTP `auth: "gateway"` thuộc cùng Plugin. Sau khi khởi tạo đã xác thực, trình duyệt nhận được một
quyền cấp HttpOnly ngắn hạn, giới hạn trong Plugin và gốc tuyến đó, để
khung sandbox có thể tải mà không cần sao chép bearer token của Gateway vào URL
hoặc JavaScript. Thành phần cha đã xác thực gia hạn quyền cấp khi thẻ bên ngoài
đang hoạt động và trước khi gắn thẻ sau thao tác điều hướng hoặc khi trình duyệt tiếp tục hoạt động. Thành phần này cũng
thăm dò quyền cấp từ chính sandbox opaque đó trước khi gắn, để các chế độ
quyền riêng tư của trình duyệt chặn cookie sẽ đóng an toàn bằng một bảng điều khiển không khả dụng.
Quyền cấp cho khung chỉ chấp nhận `GET` và `HEAD`, đồng thời luôn mang
`operator.read`; `requiredScopes` kiểm soát khả năng hiển thị thẻ nhưng không bao giờ mở rộng
quyền cấp cookie. Các thao tác thay đổi vẫn nằm trên thành phần cha được Gateway xác thực rõ ràng hoặc
các bề mặt bearer. Các thẻ bên ngoài yêu cầu HTTPS/Tailscale Serve hoặc một
nguồn loopback được trình duyệt tin cậy; HTTP thuần túy trên máy chủ LAN hiển thị
lỗi ngữ cảnh bảo mật thay vì gắn một bảng điều khiển không thể xác thực.
Việc chặn hoàn toàn cookie của bên thứ ba cũng khiến các thẻ được Gateway bảo vệ không khả dụng.
Giống như mọi bề mặt Plugin gốc, khung vẫn nằm trong ranh giới tin cậy của
Plugin đã cài đặt; OpenClaw không coi các Plugin đã cài đặt là những
chủ thể bảo mật trình duyệt được cách ly lẫn nhau.
Quyền cấp cookie sử dụng ranh giới tên máy chủ của trình duyệt, không phải ranh giới cổng. Không
đồng lưu trữ các dịch vụ không tin cậy lẫn nhau trên tên máy chủ Gateway, kể cả trên các
cổng khác.
Các thẻ được hỗ trợ bởi cơ chế xác thực do Plugin quản lý vẫn giữ hành vi iframe trực tiếp và không
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

Các phương thức phẳng tương đương vẫn khả dụng dưới dạng bí danh tương thích đã lỗi thời
cho các Plugin hiện có. Không thêm mã Plugin mới gọi trực tiếp
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` hoặc
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` là một tiện ích có phạm vi phiên nằm trên bộ lập lịch
Cron của Gateway. Cron sở hữu thời điểm và tạo bản ghi tác vụ nền khi
lượt chạy diễn ra; Plugin SDK chỉ ràng buộc phiên đích, cách đặt tên
do Plugin sở hữu và hoạt động dọn dẹp. Sử dụng `api.runtime.tasks.managedFlows` bên trong
lượt được lập lịch khi chính công việc cần trạng thái Task Flow nhiều bước bền vững.

Các hợp đồng chủ ý phân chia thẩm quyền:

- Các Plugin bên ngoài có thể sở hữu phần mở rộng phiên, bộ mô tả UI, lệnh, siêu dữ liệu
  công cụ, nội dung chèn cho lượt tiếp theo và các hook thông thường.
- Các chính sách công cụ tin cậy chạy trước các hook `before_tool_call` thông thường và được
  máy chủ tin cậy. Chính sách đi kèm chạy trước; chính sách của Plugin đã cài đặt yêu cầu
  bật rõ ràng cùng các id cục bộ của chúng trong
  `contracts.trustedToolPolicies`, sau đó chạy theo thứ tự tải Plugin. Id chính sách
  được giới hạn trong Plugin đăng ký.
- Quyền sở hữu lệnh dành riêng chỉ áp dụng cho thành phần đi kèm. Các Plugin bên ngoài nên dùng
  tên lệnh hoặc bí danh riêng.
- `allowPromptInjection=false` vô hiệu hóa các hook thay đổi prompt, bao gồm
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`
  và `enqueueNextTurnInjection`.

Ví dụ về các thành phần sử dụng không thuộc Plan:

| Kiểu mẫu Plugin                       | Hook được sử dụng                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quy trình phê duyệt                   | Phần mở rộng phiên, tiếp tục lệnh, chèn cho lượt tiếp theo, bộ mô tả UI                                                                                |
| Cổng chính sách ngân sách/không gian làm việc | Chính sách công cụ tin cậy, siêu dữ liệu công cụ, phép chiếu phiên                                                                                     |
| Trình giám sát vòng đời nền           | Dọn dẹp vòng đời thời gian chạy, đăng ký sự kiện tác tử, quyền sở hữu/dọn dẹp bộ lập lịch phiên, đóng góp prompt Heartbeat, bộ mô tả UI                |
| Trình hướng dẫn thiết lập hoặc làm quen | Phần mở rộng phiên, lệnh có phạm vi, bộ mô tả Control UI                                                                                              |

<Note>
  Các không gian tên quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) luôn giữ nguyên `operator.admin`, ngay cả khi một Plugin cố gán một
  phạm vi phương thức Gateway hẹp hơn. Ưu tiên tiền tố riêng cho từng Plugin đối với
  các phương thức do Plugin sở hữu.
</Note>

<Accordion title="Khi nào nên sử dụng middleware kết quả công cụ">
  Các Plugin đi kèm và Plugin đã cài đặt được bật rõ ràng với hợp đồng
  manifest tương ứng có thể sử dụng `api.registerAgentToolResultMiddleware(...)` khi
  cần viết lại kết quả công cụ sau khi thực thi và trước khi thời gian chạy
  đưa kết quả đó trở lại mô hình. Đây là seam trung lập với thời gian chạy, đáng tin cậy
  dành cho các bộ rút gọn đầu ra bất đồng bộ như tokenjuice.

Các Plugin phải khai báo `contracts.agentToolResultMiddleware` cho từng
thời gian chạy mục tiêu, ví dụ `["openclaw", "codex"]`. Plugin đã cài đặt không có
hợp đồng đó hoặc không được bật rõ ràng sẽ không thể đăng ký middleware này; hãy giữ
các hook Plugin OpenClaw thông thường cho công việc không cần thời điểm xử lý kết quả công cụ
trước mô hình. Đường dẫn đăng ký factory phần mở rộng cũ
chỉ dành cho trình chạy nhúng đã bị xóa.
</Accordion>

### Đăng ký khám phá Gateway

`api.registerGatewayDiscoveryService(...)` cho phép một Plugin quảng bá Gateway
đang hoạt động trên phương thức truyền tải khám phá cục bộ như mDNS/Bonjour. OpenClaw gọi
dịch vụ trong lúc Gateway khởi động khi khám phá cục bộ được bật, truyền vào
các cổng Gateway hiện tại cùng dữ liệu gợi ý TXT không bí mật, và gọi trình xử lý
`stop` được trả về trong lúc Gateway tắt.

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
thông tin xác thực. Khám phá chỉ là gợi ý định tuyến; cơ chế xác thực Gateway và ghim TLS vẫn
sở hữu việc thiết lập tin cậy.

### Siêu dữ liệu đăng ký CLI

`api.registerCli(registrar, opts?)` chấp nhận hai loại siêu dữ liệu lệnh:

- `commands`: các tên lệnh rõ ràng thuộc sở hữu của thành phần đăng ký
- `descriptors`: các bộ mô tả lệnh tại thời điểm phân tích cú pháp dùng cho phần trợ giúp CLI,
  định tuyến và đăng ký CLI Plugin theo cơ chế tải lười
- `parentPath`: đường dẫn lệnh cha tùy chọn cho các nhóm lệnh lồng nhau, chẳng hạn như
  `["nodes"]`

Đối với các tính năng Node đã ghép cặp, ưu tiên
`api.registerNodeCliFeature(registrar, opts?)`. Đây là một trình bao nhỏ quanh
`api.registerCli(..., { parentPath: ["nodes"] })` và xác định rõ các lệnh như
`openclaw nodes canvas` là tính năng Node do Plugin sở hữu.

Nếu muốn một lệnh Plugin tiếp tục được tải lười trong đường dẫn CLI gốc thông thường,
hãy cung cấp `descriptors` bao phủ mọi gốc lệnh cấp cao nhất do
thành phần đăng ký đó cung cấp.

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

Chỉ sử dụng riêng `commands` khi không cần đăng ký CLI gốc theo cơ chế tải lười.
Đường dẫn tương thích tải ngay đó vẫn được hỗ trợ, nhưng không cài đặt
các phần giữ chỗ dựa trên bộ mô tả để tải lười tại thời điểm phân tích cú pháp.

### Đăng ký backend CLI

`api.registerCliBackend(...)` cho phép một plugin sở hữu cấu hình mặc định cho một
backend CLI AI cục bộ như `claude-cli` hoặc `my-cli`.

- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình như `my-cli/gpt-5`.
- `config` của backend sử dụng cùng cấu trúc với `agents.defaults.cliBackends.<id>`.
- Cấu hình người dùng vẫn được ưu tiên. OpenClaw hợp nhất `agents.defaults.cliBackends.<id>` lên trên
  cấu hình mặc định của plugin trước khi chạy CLI.
- Sử dụng `normalizeConfig` khi backend cần chuyển đổi tương thích sau khi hợp nhất
  (ví dụ: chuẩn hóa các cấu trúc cờ cũ).
- Sử dụng `resolveExecutionArgs` cho các phép chuyển đổi argv theo phạm vi yêu cầu thuộc về
  phương ngữ CLI, chẳng hạn như ánh xạ các mức suy luận của OpenClaw sang một cờ mức nỗ lực
  gốc. Hook nhận `ctx.executionMode`; sử dụng `"side-question"` để thêm
  các cờ cô lập gốc của backend cho các lệnh gọi `/btw` tạm thời. Nếu các cờ đó
  vô hiệu hóa công cụ gốc một cách đáng tin cậy đối với một CLI vốn luôn bật chúng, hãy khai báo
  cả `sideQuestionToolMode: "disabled"`.
- Sử dụng `prepareExecution` cho môi trường khởi chạy do backend sở hữu hoặc các cầu nối
  xác thực/cấu hình tạm thời. `ctx.contextTokenBudget` của nó là giới hạn token hiệu dụng
  được chọn cho lượt chạy, để các backend có Compaction gốc có thể căn chỉnh
  ngưỡng riêng mà không cần các nhánh lõi dành riêng cho nhà cung cấp.
- Các backend có thể vô hiệu hóa tất cả công cụ gốc cho một lượt chạy cụ thể có thể khai báo
  `nativeToolMode: "selectable"`. Các lệnh gọi bị hạn chế truyền một bộ
  `ctx.toolAvailability.native` rỗng cùng với danh sách cho phép MCP được cô lập chính xác khỏi máy chủ;
  `resolveExecutionArgs` phải thực thi cả hai trên argv cuối cùng của lượt mới hoặc lượt tiếp tục.
  OpenClaw đóng an toàn nếu backend không thể thực hiện điều đó.

Để xem hướng dẫn xây dựng toàn diện, hãy tham khảo
[Plugin backend CLI](/vi/plugins/cli-backend-plugins).

### Các vị trí độc quyền

| Phương thức                                 | Nội dung đăng ký                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Công cụ ngữ cảnh (mỗi thời điểm chỉ có một công cụ hoạt động). Các callback vòng đời nhận `runtimeSettings` khi máy chủ có thể cung cấp thông tin chẩn đoán mô hình/nhà cung cấp/chế độ; các công cụ nghiêm ngặt cũ hơn được thử lại mà không có khóa đó. |
| `api.registerMemoryCapability(capability)` | Khả năng bộ nhớ hợp nhất                                                                                                                                                                          |

### Các adapter nhúng bộ nhớ không còn được khuyến nghị

| Phương thức                                     | Nội dung đăng ký                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter nhúng bộ nhớ cho plugin đang hoạt động |

- `registerMemoryCapability` là API độc quyền của plugin bộ nhớ.
- `registerMemoryCapability` cũng có thể cung cấp `publicArtifacts.listArtifacts(...)`
  cho các bản xuất do máy chủ quản lý. Các plugin đồng hành liệt kê những
  thành phần đã khai báo đó vẫn sử dụng `listActiveMemoryPublicArtifacts(...)` từ facade
  `openclaw/plugin-sdk/memory-host-core` được giữ lại cho đến khi có một API công khai
  tập trung dành cho đối tượng sử dụng; chúng không được truy cập vào bố cục riêng tư của plugin khác.
- `MemoryFlushPlan.model` có thể ghim lượt xả vào một tham chiếu `provider/model`
  chính xác, chẳng hạn như `ollama/qwen3:8b`, mà không kế thừa chuỗi dự phòng đang hoạt động.
- `registerMemoryEmbeddingProvider` không còn được khuyến nghị. Các nhà cung cấp nhúng mới
  nên sử dụng `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`.
- Các nhà cung cấp dành riêng cho bộ nhớ hiện có tiếp tục hoạt động trong giai đoạn
  chuyển đổi, nhưng tính năng kiểm tra plugin báo cáo đây là khoản nợ tương thích đối với
  các plugin không đi kèm.

### Sự kiện và vòng đời

| Phương thức                                  | Chức năng                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook vòng đời có kiểu         |
| `api.onConversationBindingResolved(handler)` | Callback liên kết cuộc hội thoại |

Xem [Hook của plugin](/vi/plugins/hooks) để biết ví dụ, tên hook phổ biến và ngữ nghĩa
của cơ chế bảo vệ.

### Ngữ nghĩa quyết định của hook

`before_install` là hook vòng đời của môi trường chạy plugin, không phải bề mặt
chính sách cài đặt dành cho người vận hành. Sử dụng `security.installPolicy` khi quyết định cho phép/chặn phải
bao phủ các đường dẫn cài đặt hoặc cập nhật qua CLI và Gateway.

- `before_tool_call`: trả về `{ block: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_tool_call`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `before_install`: trả về `{ block: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `before_install`: trả về `{ block: false }` được xem là không có quyết định (giống như bỏ qua `block`), không phải là ghi đè.
- `reply_dispatch`: trả về `{ handled: true, ... }` là kết thúc. Khi bất kỳ trình xử lý nào nhận điều phối, các trình xử lý có độ ưu tiên thấp hơn và đường dẫn điều phối mô hình mặc định sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: true }` là kết thúc. Khi bất kỳ trình xử lý nào đặt giá trị này, các trình xử lý có độ ưu tiên thấp hơn sẽ bị bỏ qua.
- `message_sending`: trả về `{ cancel: false }` được xem là không có quyết định (giống như bỏ qua `cancel`), không phải là ghi đè.
- `message_received`: sử dụng trường `threadId` có kiểu khi cần định tuyến luồng/chủ đề đầu vào. Giữ `metadata` cho các phần bổ sung dành riêng cho kênh.
- `message_sending`: sử dụng các trường định tuyến có kiểu `replyToId` / `threadId` trước khi dự phòng về `metadata` dành riêng cho kênh.
- `gateway_start`: sử dụng `ctx.config`, `ctx.workspaceDir` và `ctx.getCron?.()` cho trạng thái khởi động do Gateway sở hữu thay vì dựa vào các hook `gateway:startup` nội bộ. Cron có thể vẫn đang tải tại thời điểm này.
- `cron_reconciled`: xây dựng lại toàn bộ phép chiếu cron bên ngoài sau khi khởi động hoặc tải lại bộ lập lịch. Nó bao gồm `reason` và trạng thái `enabled` hiệu dụng, bao gồm `enabled: false`, trong khi `ctx.getCron?.()` trả về chính xác bộ lập lịch đã được đối soát. Truyền `ctx.abortSignal` vào công việc chiếu bền vững; nó hủy khi ảnh chụp bộ lập lịch đó bị thay thế hoặc Gateway đóng.
- `cron_changed`: theo dõi các thay đổi vòng đời cron do Gateway sở hữu. Các sự kiện `scheduled` và `removed` là gợi ý đối soát sau khi cam kết, không phải nhật ký thay đổi có thứ tự. `event.nextRunAtMs` của một sự kiện đã lên lịch không tồn tại khi tác vụ không có lần đánh thức tiếp theo; một sự kiện đã bị xóa vẫn mang theo ảnh chụp tác vụ đã xóa.

Các bộ lập lịch đánh thức bên ngoài nên chống dội hoặc gộp các sự kiện `cron_changed`,
sau đó đọc lại toàn bộ chế độ xem bền vững từ bộ lập lịch được
`cron_reconciled` ghi nhận gần nhất. Không sử dụng bộ lập lịch từ ngữ cảnh `cron_changed`: một
gợi ý tách rời từ bộ lập lịch cũ hơn có thể chồng lấn với lần tải lại sau đó.

Sử dụng `cron_reconciled` làm trình kích hoạt ảnh chụp đầy đủ cho trạng thái bền vững được tải khi
Gateway khởi động hoặc khi thay thế bộ lập lịch. Nó không được phát lại khi chỉ
tải nóng lại plugin. Các trình xử lý theo dõi chạy song song và những lượt
điều phối không chờ kết quả có thể chồng lấn, vì vậy đối tượng sử dụng không được phụ thuộc vào thứ tự hoàn tất sự kiện.
Giữ OpenClaw làm nguồn chân lý cho việc kiểm tra đến hạn và thực thi.

Để xem adapter đơn luồng thực thi với khả năng thay thế bền vững, thử lại/chờ lùi và
tắt sạch, hãy tham khảo [Phép chiếu cron bên ngoài an toàn](/vi/plugins/hooks#safe-external-cron-projection).

### Các trường của đối tượng API

| Trường                   | Kiểu                      | Mô tả                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Tên hiển thị                                                                                |
| `api.version`            | `string?`                 | Phiên bản plugin (không bắt buộc)                                                           |
| `api.description`        | `string?`                 | Mô tả plugin (không bắt buộc)                                                               |
| `api.source`             | `string`                  | Đường dẫn nguồn plugin                                                                      |
| `api.rootDir`            | `string?`                 | Thư mục gốc của plugin (không bắt buộc)                                                     |
| `api.config`             | `OpenClawConfig`          | Ảnh chụp cấu hình hiện tại (ảnh chụp môi trường chạy trong bộ nhớ đang hoạt động khi có)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Cấu hình dành riêng cho plugin từ `plugins.entries.<id>.config`                             |
| `api.runtime`            | `PluginRuntime`           | [Trình trợ giúp môi trường chạy](/vi/plugins/sdk-runtime)                                      |
| `api.logger`             | `PluginLogger`            | Trình ghi nhật ký theo phạm vi (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Chế độ tải hiện tại; `"setup-runtime"` là khoảng thời gian khởi động/thiết lập nhẹ trước khi tải mục nhập đầy đủ |
| `api.resolvePath(input)` | `(string) => string`      | Phân giải đường dẫn tương đối với thư mục gốc của plugin                                    |

## Quy ước mô-đun nội bộ

Trong plugin của bạn, hãy sử dụng các tệp barrel cục bộ cho các import nội bộ:

```text
my-plugin/
  api.ts            # Các phần xuất công khai cho đối tượng sử dụng bên ngoài
  runtime-api.ts    # Các phần xuất môi trường chạy chỉ dùng nội bộ
  index.ts          # Điểm vào của plugin
  setup-entry.ts    # Điểm vào nhẹ chỉ dành cho thiết lập (không bắt buộc)
```

<Warning>
  Tuyệt đối không import plugin của chính bạn thông qua `openclaw/plugin-sdk/<your-plugin>`
  từ mã sản xuất. Định tuyến các import nội bộ qua `./api.ts` hoặc
  `./runtime-api.ts`. Đường dẫn SDK chỉ là hợp đồng bên ngoài.
</Warning>

Các bề mặt công khai của plugin đi kèm được tải qua facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` và các tệp điểm vào công khai tương tự) ưu tiên
ảnh chụp nhanh cấu hình runtime đang hoạt động khi OpenClaw đã chạy. Nếu chưa có
ảnh chụp nhanh runtime, chúng sẽ dùng tệp cấu hình đã phân giải trên đĩa làm phương án dự phòng.
Các facade của plugin đi kèm đã đóng gói nên được tải thông qua các trình tải facade
plugin của OpenClaw; việc nhập trực tiếp từ `dist/extensions/...` sẽ bỏ qua các bước kiểm tra manifest
và sidecar runtime mà bản cài đặt đã đóng gói sử dụng cho mã thuộc quyền sở hữu của plugin.

Các plugin nhà cung cấp có thể cung cấp một barrel hợp đồng hẹp, cục bộ trong plugin khi một
trình trợ giúp được chủ ý thiết kế riêng cho nhà cung cấp và chưa phù hợp với một đường dẫn con SDK
chung. Các ví dụ đi kèm:

- **Anthropic**: bề mặt công khai `api.ts` / `contract-api.ts` cho các trình trợ giúp
  beta-header của Claude và luồng `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` xuất các trình dựng nhà cung cấp,
  trình trợ giúp mô hình mặc định và trình dựng nhà cung cấp thời gian thực.
- **`@openclaw/openrouter-provider`**: `api.ts` xuất trình dựng nhà cung cấp
  cùng các trình trợ giúp onboarding/cấu hình.

<Warning>
  Mã sản xuất của phần mở rộng cũng nên tránh nhập từ `openclaw/plugin-sdk/<other-plugin>`.
  Nếu một trình trợ giúp thực sự được dùng chung, hãy nâng nó lên một đường dẫn con SDK trung lập
  như `openclaw/plugin-sdk/speech`, `.../provider-model-shared` hoặc một bề mặt khác
  định hướng theo khả năng, thay vì ghép nối hai plugin với nhau.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Điểm vào" icon="door-open" href="/vi/plugins/sdk-entrypoints">
    Các tùy chọn `definePluginEntry` và `defineChannelPluginEntry`.
  </Card>
  <Card title="Trình trợ giúp runtime" icon="gears" href="/vi/plugins/sdk-runtime">
    Tài liệu tham khảo đầy đủ về namespace `api.runtime`.
  </Card>
  <Card title="Thiết lập và cấu hình" icon="sliders" href="/vi/plugins/sdk-setup">
    Đóng gói, manifest và schema cấu hình.
  </Card>
  <Card title="Kiểm thử" icon="vial" href="/vi/plugins/sdk-testing">
    Tiện ích kiểm thử và quy tắc lint.
  </Card>
  <Card title="Di chuyển SDK" icon="arrows-turn-right" href="/vi/plugins/sdk-migration">
    Di chuyển khỏi các bề mặt không còn được khuyến nghị.
  </Card>
  <Card title="Nội bộ Plugin" icon="diagram-project" href="/vi/plugins/architecture">
    Kiến trúc chuyên sâu và mô hình khả năng.
  </Card>
</CardGroup>
