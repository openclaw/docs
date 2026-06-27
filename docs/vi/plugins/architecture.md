---
read_when:
    - Xây dựng hoặc gỡ lỗi các Plugin OpenClaw gốc
    - Hiểu mô hình năng lực của Plugin hoặc ranh giới quyền sở hữu
    - Đang làm việc trên quy trình nạp Plugin hoặc sổ đăng ký
    - Triển khai hook runtime của nhà cung cấp hoặc Plugin kênh
sidebarTitle: Internals
summary: 'Nội bộ Plugin: mô hình năng lực, quyền sở hữu, hợp đồng, pipeline tải và helper thời gian chạy'
title: Nội bộ Plugin
x-i18n:
    generated_at: "2026-06-27T17:43:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Đây là **tham chiếu kiến trúc chuyên sâu** cho hệ thống Plugin của OpenClaw. Với các hướng dẫn thực hành, hãy bắt đầu bằng một trong các trang tập trung bên dưới.

<CardGroup cols={2}>
  <Card title="Cài đặt và sử dụng Plugin" icon="plug" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cách thêm, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Xây dựng Plugin" icon="rocket" href="/vi/plugins/building-plugins">
    Hướng dẫn tạo Plugin đầu tiên với manifest hoạt động nhỏ nhất.
  </Card>
  <Card title="Plugin kênh" icon="comments" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="microchip" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp mô hình.
  </Card>
  <Card title="Tổng quan SDK" icon="book" href="/vi/plugins/sdk-overview">
    Tham chiếu bản đồ import và API đăng ký.
  </Card>
</CardGroup>

## Mô hình năng lực công khai

Năng lực là mô hình **Plugin gốc** công khai bên trong OpenClaw. Mỗi Plugin OpenClaw gốc đăng ký với một hoặc nhiều loại năng lực:

| Năng lực               | Phương thức đăng ký                             | Plugin ví dụ                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Suy luận văn bản       | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Plugin vector do nhà cung cấp sở hữu |
| Giọng nói              | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Chuyển lời nói thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Giọng nói thời gian thực | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Hiểu nội dung đa phương tiện | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Nguồn bản ghi          | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Tạo hình ảnh           | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Tải web                | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Khám phá Gateway       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Một Plugin đăng ký không năng lực nào nhưng cung cấp hook, công cụ, dịch vụ khám phá hoặc dịch vụ nền là Plugin **chỉ hook kế thừa**. Mẫu này vẫn được hỗ trợ đầy đủ.
</Note>

### Lập trường tương thích bên ngoài

Mô hình năng lực đã được đưa vào lõi và hiện được các Plugin đóng gói/gốc sử dụng, nhưng khả năng tương thích Plugin bên ngoài vẫn cần tiêu chuẩn chặt hơn “nó được export, nên nó đã cố định”.

| Tình huống Plugin                                | Hướng dẫn                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin bên ngoài hiện có                         | Giữ cho các tích hợp dựa trên hook tiếp tục hoạt động; đây là nền tảng tương thích.              |
| Plugin đóng gói/gốc mới                          | Ưu tiên đăng ký năng lực tường minh hơn là truy cập đặc thù theo nhà cung cấp hoặc thiết kế mới chỉ dùng hook. |
| Plugin bên ngoài áp dụng đăng ký năng lực        | Được phép, nhưng xem các bề mặt trợ giúp riêng theo năng lực là đang phát triển trừ khi tài liệu đánh dấu chúng là ổn định. |

Đăng ký năng lực là hướng đi dự kiến. Hook kế thừa vẫn là đường dẫn an toàn nhất để không gây phá vỡ cho Plugin bên ngoài trong giai đoạn chuyển tiếp. Các đường dẫn con trợ giúp đã export không ngang nhau — ưu tiên các hợp đồng hẹp đã được ghi tài liệu hơn là các export trợ giúp ngẫu nhiên.

### Hình dạng Plugin

OpenClaw phân loại mỗi Plugin đã tải thành một hình dạng dựa trên hành vi đăng ký thực tế của nó (không chỉ metadata tĩnh):

<AccordionGroup>
  <Accordion title="plain-capability">
    Đăng ký đúng một loại năng lực (ví dụ Plugin chỉ là nhà cung cấp như `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Đăng ký nhiều loại năng lực (ví dụ `openai` sở hữu suy luận văn bản, giọng nói, hiểu nội dung đa phương tiện và tạo hình ảnh).
  </Accordion>
  <Accordion title="hook-only">
    Chỉ đăng ký hook (có kiểu hoặc tùy chỉnh), không có năng lực, công cụ, lệnh hoặc dịch vụ.
  </Accordion>
  <Accordion title="non-capability">
    Đăng ký công cụ, lệnh, dịch vụ hoặc route nhưng không có năng lực.
  </Accordion>
</AccordionGroup>

Dùng `openclaw plugins inspect <id>` để xem hình dạng và phân tích năng lực của một Plugin. Xem [tham chiếu CLI](/vi/cli/plugins#inspect) để biết chi tiết.

### Hook kế thừa

Hook `before_agent_start` vẫn được hỗ trợ như một đường dẫn tương thích cho Plugin chỉ dùng hook. Các Plugin thực tế kế thừa vẫn phụ thuộc vào nó.

Định hướng:

- giữ cho nó hoạt động
- ghi tài liệu nó là kế thừa
- ưu tiên `before_model_resolve` cho công việc ghi đè mô hình/nhà cung cấp
- ưu tiên `before_prompt_build` cho công việc thay đổi prompt
- chỉ xóa sau khi mức sử dụng thực tế giảm và phạm vi fixture chứng minh việc di trú là an toàn

### Tín hiệu tương thích

Khi chạy `openclaw doctor` hoặc `openclaw plugins inspect <id>`, bạn có thể thấy một trong các nhãn này:

| Tín hiệu                   | Ý nghĩa                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config hợp lệ**          | Config phân tích được và Plugin resolve được                 |
| **khuyến nghị tương thích** | Plugin dùng một mẫu được hỗ trợ nhưng cũ hơn (ví dụ `hook-only`) |
| **cảnh báo kế thừa**       | Plugin dùng `before_agent_start`, vốn đã bị phản đối sử dụng |
| **lỗi cứng**               | Config không hợp lệ hoặc Plugin không tải được               |

Cả `hook-only` lẫn `before_agent_start` đều sẽ không làm hỏng Plugin của bạn hôm nay: `hook-only` là khuyến nghị, còn `before_agent_start` chỉ kích hoạt cảnh báo. Các tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống Plugin của OpenClaw có bốn lớp:

<Steps>
  <Step title="Manifest + khám phá">
    OpenClaw tìm các Plugin ứng viên từ những đường dẫn đã cấu hình, root workspace, root Plugin toàn cục và Plugin đóng gói. Khám phá đọc manifest gốc `openclaw.plugin.json` cùng các manifest bundle được hỗ trợ trước.
  </Step>
  <Step title="Bật + xác thực">
    Lõi quyết định một Plugin đã khám phá được bật, tắt, chặn hay được chọn cho một vị trí độc quyền như bộ nhớ.
  </Step>
  <Step title="Tải runtime">
    Plugin OpenClaw gốc được tải trong cùng tiến trình và đăng ký năng lực vào một registry trung tâm. JavaScript đã đóng gói tải qua `require` gốc; TypeScript nguồn cục bộ của bên thứ ba là fallback Jiti khẩn cấp. Các bundle tương thích được chuẩn hóa thành bản ghi registry mà không import mã runtime.
  </Step>
  <Step title="Tiêu thụ bề mặt">
    Phần còn lại của OpenClaw đọc registry để phơi bày công cụ, kênh, thiết lập nhà cung cấp, hook, route HTTP, lệnh CLI và dịch vụ.
  </Step>
</Steps>

Riêng với CLI Plugin, khám phá lệnh root được chia thành hai pha:

- metadata thời điểm phân tích đến từ `registerCli(..., { descriptors: [...] })`
- module CLI Plugin thật có thể vẫn lazy và đăng ký khi được gọi lần đầu

Điều đó giữ mã CLI do Plugin sở hữu bên trong Plugin, trong khi vẫn cho phép OpenClaw giữ trước tên lệnh root trước khi phân tích.

Ranh giới thiết kế quan trọng:

- xác thực manifest/config nên hoạt động từ **metadata manifest/schema** mà không thực thi mã Plugin
- khám phá năng lực gốc có thể tải mã entry Plugin đáng tin cậy để xây dựng snapshot registry không kích hoạt
- hành vi runtime gốc đến từ đường dẫn `register(api)` của module Plugin với `api.registrationMode === "full"`

Sự tách biệt đó cho phép OpenClaw xác thực config, giải thích Plugin bị thiếu/bị tắt và xây dựng gợi ý UI/schema trước khi runtime đầy đủ hoạt động.

### Snapshot metadata Plugin và bảng tra cứu

Khi khởi động, Gateway xây dựng một `PluginMetadataSnapshot` cho snapshot config hiện tại. Snapshot này chỉ chứa metadata: nó lưu chỉ mục Plugin đã cài đặt, registry manifest, chẩn đoán manifest, bản đồ owner, bộ chuẩn hóa id Plugin và bản ghi manifest. Nó không giữ module Plugin đã tải, SDK nhà cung cấp, nội dung gói hoặc export runtime.

Xác thực config có nhận biết Plugin, tự động bật khi khởi động và bootstrap Plugin Gateway tiêu thụ snapshot đó thay vì tự xây dựng lại metadata manifest/chỉ mục độc lập. `PluginLookUpTable` được dẫn xuất từ cùng snapshot và thêm kế hoạch Plugin khởi động cho config runtime hiện tại.

Sau khi khởi động, Gateway giữ snapshot metadata hiện tại như một sản phẩm runtime có thể thay thế. Khám phá nhà cung cấp runtime lặp lại có thể mượn snapshot đó thay vì tái tạo chỉ mục đã cài đặt và registry manifest cho mỗi lượt catalog nhà cung cấp. Snapshot được xóa hoặc thay thế khi Gateway tắt, khi config/tồn kho Plugin thay đổi và khi ghi chỉ mục đã cài đặt; caller fallback về đường dẫn manifest/chỉ mục lạnh khi không có snapshot hiện tại tương thích. Kiểm tra tương thích phải bao gồm các root khám phá Plugin như `plugins.load.paths` và workspace agent mặc định, vì Plugin workspace là một phần của phạm vi metadata.

Snapshot và bảng tra cứu giữ các quyết định khởi động lặp lại trên đường dẫn nhanh:

- quyền sở hữu kênh
- khởi động kênh bị hoãn
- id Plugin khởi động
- quyền sở hữu nhà cung cấp và backend CLI
- quyền sở hữu thiết lập nhà cung cấp, bí danh lệnh, nhà cung cấp catalog mô hình và hợp đồng manifest
- xác thực schema config Plugin và schema config kênh
- quyết định tự động bật khi khởi động

Ranh giới an toàn là thay thế snapshot, không phải đột biến. Xây dựng lại snapshot khi config, tồn kho Plugin, bản ghi cài đặt hoặc chính sách chỉ mục đã lưu thay đổi. Đừng xem nó là registry toàn cục rộng có thể đột biến, và đừng giữ các snapshot lịch sử không giới hạn. Việc tải Plugin runtime vẫn tách biệt với snapshot metadata để trạng thái runtime cũ không thể bị ẩn sau cache metadata.

Quy tắc cache được ghi tài liệu trong [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals#plugin-cache-boundary): metadata manifest và khám phá là mới trừ khi caller giữ một snapshot, bảng tra cứu hoặc registry manifest tường minh cho luồng hiện tại. Cache metadata ẩn và TTL theo đồng hồ treo tường không phải là một phần của việc tải Plugin. Chỉ cache trình tải runtime, module và artifact phụ thuộc mới có thể tồn tại sau khi mã hoặc artifact đã cài đặt thực sự được tải.

Một số caller đường dẫn lạnh vẫn tái tạo registry manifest trực tiếp từ chỉ mục Plugin đã cài đặt được lưu, thay vì nhận `PluginLookUpTable` của Gateway. Đường dẫn đó hiện tái tạo registry theo nhu cầu; ưu tiên truyền bảng tra cứu hiện tại hoặc registry manifest tường minh qua các luồng runtime khi caller đã có một cái.

### Lập kế hoạch kích hoạt

Lập kế hoạch kích hoạt là một phần của control plane. Caller có thể hỏi Plugin nào liên quan đến một lệnh, nhà cung cấp, kênh, route, harness agent hoặc năng lực cụ thể trước khi tải các registry runtime rộng hơn.

Planner giữ cho hành vi manifest hiện tại tương thích:

- Các trường `activation.*` là gợi ý rõ ràng cho bộ lập kế hoạch
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và hook vẫn là cơ chế dự phòng quyền sở hữu manifest
- API bộ lập kế hoạch chỉ dùng id vẫn còn sẵn cho các caller hiện có
- API plan báo cáo nhãn lý do để chẩn đoán có thể phân biệt gợi ý rõ ràng với cơ chế dự phòng quyền sở hữu

<Warning>
Đừng xem `activation` là hook vòng đời hoặc phần thay thế cho `register(...)`. Đây là metadata dùng để thu hẹp phạm vi tải. Ưu tiên các trường quyền sở hữu khi chúng đã mô tả mối quan hệ; chỉ dùng `activation` cho các gợi ý bổ sung cho bộ lập kế hoạch.
</Warning>

### Plugin kênh và công cụ thông báo dùng chung

Plugin kênh không cần đăng ký công cụ gửi/sửa/phản ứng riêng cho các hành động chat thông thường. OpenClaw giữ một công cụ `message` dùng chung trong lõi, còn Plugin kênh sở hữu phần khám phá và thực thi theo từng kênh phía sau công cụ đó.

Ranh giới hiện tại là:

- lõi sở hữu host của công cụ `message` dùng chung, nối prompt, ghi sổ session/thread và điều phối thực thi
- Plugin kênh sở hữu khám phá hành động theo phạm vi, khám phá capability và mọi mảnh schema riêng cho kênh
- Plugin kênh sở hữu ngữ pháp hội thoại session theo provider, chẳng hạn cách id hội thoại mã hóa id thread hoặc kế thừa từ hội thoại cha
- Plugin kênh thực thi hành động cuối cùng thông qua adapter hành động của chúng

Đối với Plugin kênh, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Lệnh gọi khám phá hợp nhất đó cho phép Plugin trả về các hành động hiển thị, capability và phần đóng góp schema cùng nhau để những phần này không bị lệch nhau.

Khi tham số message-tool riêng cho kênh mang nguồn media như đường dẫn cục bộ hoặc URL media từ xa, Plugin cũng nên trả về `mediaSourceParams` từ `describeMessageTool(...)`. Lõi dùng danh sách rõ ràng đó để áp dụng chuẩn hóa đường dẫn sandbox và gợi ý truy cập media đi ra mà không hardcode tên tham số thuộc sở hữu Plugin. Ưu tiên map theo phạm vi hành động ở đó, không phải một danh sách phẳng cho toàn kênh, để tham số media chỉ dành cho profile không bị chuẩn hóa trên các hành động không liên quan như `send`.

Lõi truyền phạm vi runtime vào bước khám phá đó. Các trường quan trọng gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound đáng tin cậy

Điều đó quan trọng với các Plugin nhạy theo ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị hành động thông báo dựa trên tài khoản đang hoạt động, phòng/thread/thông báo hiện tại hoặc định danh người yêu cầu đáng tin cậy mà không hardcode các nhánh riêng cho kênh trong công cụ `message` của lõi.

Đây là lý do các thay đổi định tuyến embedded-runner vẫn là công việc của Plugin: runner chịu trách nhiệm chuyển tiếp định danh chat/session hiện tại vào ranh giới khám phá Plugin để công cụ `message` dùng chung hiển thị đúng bề mặt thuộc sở hữu kênh cho lượt hiện tại.

Đối với helper thực thi thuộc sở hữu kênh, Plugin được đóng gói nên giữ runtime thực thi bên trong module extension của chính chúng. Lõi không còn sở hữu runtime hành động thông báo của Discord, Slack, Telegram hoặc WhatsApp trong `src/agents/tools`. Chúng tôi không phát hành các subpath `plugin-sdk/*-action-runtime` riêng, và Plugin được đóng gói nên import trực tiếp mã runtime cục bộ của chính chúng từ các module thuộc sở hữu extension.

Ranh giới tương tự áp dụng cho các seam SDK đặt tên theo provider nói chung: lõi không nên import các barrel tiện ích riêng cho kênh dành cho Slack, Discord, Signal, WhatsApp hoặc các extension tương tự. Nếu lõi cần một hành vi, hãy hoặc tiêu thụ barrel `api.ts` / `runtime-api.ts` của chính Plugin được đóng gói, hoặc nâng nhu cầu đó thành một capability chung hẹp trong SDK dùng chung.

Plugin được đóng gói tuân theo cùng quy tắc. `runtime-api.ts` của Plugin được đóng gói không nên re-export facade có thương hiệu `openclaw/plugin-sdk/<plugin-id>` của chính nó. Các facade có thương hiệu đó vẫn là shim tương thích cho Plugin bên ngoài và consumer cũ hơn, nhưng Plugin được đóng gói nên dùng export cục bộ cộng với các subpath SDK chung hẹp như `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` hoặc `openclaw/plugin-sdk/webhook-ingress`. Mã mới không nên thêm facade SDK riêng theo plugin-id trừ khi ranh giới tương thích cho một hệ sinh thái bên ngoài hiện có yêu cầu điều đó.

Riêng với poll, có hai đường thực thi:

- `outbound.sendPoll` là baseline dùng chung cho các kênh phù hợp với mô hình poll chung
- `actions.handleAction("poll")` là đường ưu tiên cho ngữ nghĩa poll riêng cho kênh hoặc tham số poll bổ sung

Lõi hiện trì hoãn phân tích cú pháp poll dùng chung cho đến sau khi điều phối poll của Plugin từ chối hành động, để handler poll thuộc sở hữu Plugin có thể chấp nhận các trường poll riêng cho kênh mà không bị trình phân tích cú pháp poll chung chặn trước.

Xem [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals) để biết toàn bộ trình tự khởi động.

## Mô hình sở hữu capability

OpenClaw xem Plugin native là ranh giới sở hữu cho một **công ty** hoặc một **tính năng**, không phải một túi gom các tích hợp không liên quan.

Điều đó có nghĩa là:

- Plugin công ty thường nên sở hữu tất cả các bề mặt hướng OpenClaw của công ty đó
- Plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- kênh nên tiêu thụ capability lõi dùng chung thay vì tự triển khai lại hành vi provider theo kiểu tùy biến

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` sở hữu suy luận văn bản, giọng nói, thoại realtime, hiểu media và tạo ảnh. `google` sở hữu suy luận văn bản cùng với hiểu media, tạo ảnh và tìm kiếm web. `qwen` sở hữu suy luận văn bản cùng với hiểu media và tạo video.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` và `microsoft` sở hữu giọng nói; `firecrawl` sở hữu web-fetch; `minimax` / `mistral` / `moonshot` / `zai` sở hữu backend hiểu media.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` sở hữu truyền tải cuộc gọi, công cụ, CLI, route và cầu nối media-stream Twilio, nhưng tiêu thụ capability giọng nói dùng chung, phiên âm realtime và thoại realtime thay vì import trực tiếp Plugin vendor.
  </Accordion>
</AccordionGroup>

Trạng thái đích dự kiến là:

- OpenAI nằm trong một Plugin ngay cả khi nó trải rộng qua mô hình văn bản, giọng nói, ảnh và video trong tương lai
- một vendor khác có thể làm tương tự cho bề mặt của chính họ
- kênh không quan tâm Plugin vendor nào sở hữu provider; chúng tiêu thụ hợp đồng capability dùng chung do lõi phơi bày

Đây là điểm khác biệt then chốt:

- **Plugin** = ranh giới sở hữu
- **capability** = hợp đồng lõi mà nhiều Plugin có thể triển khai hoặc tiêu thụ

Vì vậy, nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "provider nào nên hardcode xử lý video?" Câu hỏi đầu tiên là "hợp đồng capability video của lõi là gì?" Khi hợp đồng đó tồn tại, Plugin vendor có thể đăng ký theo hợp đồng đó và Plugin kênh/tính năng có thể tiêu thụ nó.

Nếu capability chưa tồn tại, hướng đi đúng thường là:

<Steps>
  <Step title="Define the capability">
    Định nghĩa capability còn thiếu trong lõi.
  </Step>
  <Step title="Expose through the SDK">
    Phơi bày nó qua API/runtime Plugin theo cách có kiểu.
  </Step>
  <Step title="Wire consumers">
    Nối kênh/tính năng vào capability đó.
  </Step>
  <Step title="Vendor implementations">
    Để Plugin vendor đăng ký implementation.
  </Step>
</Steps>

Điều này giữ quyền sở hữu rõ ràng trong khi tránh hành vi lõi phụ thuộc vào một vendor duy nhất hoặc một đường mã riêng cho Plugin chỉ dùng một lần.

### Phân lớp capability

Dùng mô hình tư duy này khi quyết định mã thuộc về đâu:

<Tabs>
  <Tab title="Core capability layer">
    Điều phối dùng chung, policy, fallback, quy tắc merge cấu hình, ngữ nghĩa delivery và hợp đồng có kiểu.
  </Tab>
  <Tab title="Vendor plugin layer">
    API riêng cho vendor, auth, catalog mô hình, tổng hợp giọng nói, tạo ảnh, backend video trong tương lai, endpoint usage.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Tích hợp Slack/Discord/voice-call/v.v. tiêu thụ capability lõi và trình bày chúng trên một bề mặt.
  </Tab>
</Tabs>

Ví dụ, TTS theo hình dạng này:

- lõi sở hữu policy TTS tại thời điểm trả lời, thứ tự fallback, pref và delivery qua kênh
- `openai`, `elevenlabs` và `microsoft` sở hữu implementation tổng hợp
- `voice-call` tiêu thụ helper runtime TTS điện thoại

Nên ưu tiên cùng mẫu đó cho các capability trong tương lai.

### Ví dụ Plugin công ty đa capability

Plugin công ty nên tạo cảm giác gắn kết từ bên ngoài. Nếu OpenClaw có các hợp đồng dùng chung cho mô hình, giọng nói, phiên âm realtime, thoại realtime, hiểu media, tạo ảnh, tạo video, web fetch và tìm kiếm web, vendor có thể sở hữu tất cả bề mặt của mình ở một nơi:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Điều quan trọng không phải là tên helper chính xác. Hình dạng mới quan trọng:

- một Plugin sở hữu bề mặt vendor
- lõi vẫn sở hữu hợp đồng capability
- kênh và Plugin tính năng tiêu thụ helper `api.runtime.*`, không phải mã vendor
- test hợp đồng có thể assert rằng Plugin đã đăng ký các capability mà nó tuyên bố sở hữu

### Ví dụ capability: hiểu video

OpenClaw đã xem hiểu ảnh/audio/video là một capability dùng chung. Cùng mô hình sở hữu cũng áp dụng ở đó:

<Steps>
  <Step title="Core defines the contract">
    Lõi định nghĩa hợp đồng hiểu media.
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor đăng ký `describeImage`, `transcribeAudio` và `describeVideo` khi áp dụng.
  </Step>
  <Step title="Consumers use the shared behavior">
    Kênh và Plugin tính năng tiêu thụ hành vi lõi dùng chung thay vì nối trực tiếp vào mã vendor.
  </Step>
</Steps>

Điều đó tránh đưa giả định video của một provider vào lõi. Plugin sở hữu bề mặt vendor; lõi sở hữu hợp đồng capability và hành vi fallback.

Tạo video đã dùng cùng trình tự đó: lõi sở hữu hợp đồng capability có kiểu và helper runtime, còn Plugin vendor đăng ký implementation `api.registerVideoGenerationProvider(...)` theo hợp đồng đó.

Cần checklist triển khai cụ thể? Xem [Capability Cookbook](/vi/plugins/adding-capabilities).

## Hợp đồng và thực thi

Bề mặt API Plugin được cố ý định kiểu và tập trung trong `OpenClawPluginApi`. Hợp đồng đó định nghĩa các điểm đăng ký được hỗ trợ và các helper runtime mà Plugin có thể dựa vào.

Vì sao điều này quan trọng:

- tác giả Plugin có một chuẩn nội bộ ổn định
- lõi có thể từ chối quyền sở hữu trùng lặp, chẳng hạn hai Plugin đăng ký cùng một provider id
- khởi động có thể hiển thị chẩn đoán có thể hành động cho đăng ký malformed
- test hợp đồng có thể thực thi quyền sở hữu Plugin được đóng gói và ngăn drift âm thầm

Có hai lớp thực thi:

<AccordionGroup>
  <Accordion title="Thực thi đăng ký lúc chạy">
    Sổ đăng ký Plugin xác thực các đăng ký khi Plugin được tải. Ví dụ: id nhà cung cấp trùng lặp, id nhà cung cấp giọng nói trùng lặp, và đăng ký sai định dạng sẽ tạo chẩn đoán Plugin thay vì hành vi không xác định.
  </Accordion>
  <Accordion title="Kiểm thử hợp đồng">
    Các Plugin đi kèm được ghi lại trong sổ đăng ký hợp đồng trong các lần chạy kiểm thử để OpenClaw có thể xác nhận quyền sở hữu một cách rõ ràng. Hiện nay, cơ chế này được dùng cho nhà cung cấp mô hình, nhà cung cấp giọng nói, nhà cung cấp tìm kiếm web, và quyền sở hữu đăng ký đi kèm.
  </Accordion>
</AccordionGroup>

Tác dụng thực tế là OpenClaw biết ngay từ đầu Plugin nào sở hữu bề mặt nào. Nhờ đó, lõi và các kênh có thể kết hợp liền mạch vì quyền sở hữu được khai báo, có kiểu, và có thể kiểm thử thay vì chỉ ngầm định.

### Những gì thuộc về một hợp đồng

<Tabs>
  <Tab title="Hợp đồng tốt">
    - có kiểu
    - nhỏ
    - dành riêng cho năng lực
    - do lõi sở hữu
    - có thể tái sử dụng bởi nhiều Plugin
    - có thể được kênh/tính năng tiêu thụ mà không cần biết nhà cung cấp

  </Tab>
  <Tab title="Hợp đồng xấu">
    - chính sách dành riêng cho nhà cung cấp bị ẩn trong lõi
    - lối thoát Plugin dùng một lần để vượt qua sổ đăng ký
    - mã kênh truy cập thẳng vào phần triển khai của nhà cung cấp
    - đối tượng lúc chạy tùy biến không thuộc `OpenClawPluginApi` hoặc `api.runtime`

  </Tab>
</Tabs>

Khi không chắc, hãy nâng mức trừu tượng: định nghĩa năng lực trước, rồi để các Plugin cắm vào năng lực đó.

## Mô hình thực thi

Các Plugin OpenClaw gốc chạy **trong cùng tiến trình** với Gateway. Chúng không được sandbox. Một Plugin gốc đã tải có cùng ranh giới tin cậy cấp tiến trình như mã lõi.

<Warning>
Hệ quả của Plugin gốc: một Plugin có thể đăng ký công cụ, trình xử lý mạng, hook, và dịch vụ; lỗi Plugin có thể làm sập hoặc gây mất ổn định gateway; và một Plugin gốc độc hại tương đương với việc thực thi mã tùy ý bên trong tiến trình OpenClaw.
</Warning>

Các gói tương thích mặc định an toàn hơn vì OpenClaw hiện xem chúng là gói siêu dữ liệu/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là Skills đi kèm.

Dùng danh sách cho phép và đường dẫn cài đặt/tải rõ ràng cho các Plugin không đi kèm. Xem Plugin trong workspace là mã dành cho thời gian phát triển, không phải mặc định sản xuất.

Đối với tên gói workspace đi kèm, hãy giữ id Plugin neo theo tên npm: mặc định là `@openclaw/<id>`, hoặc một hậu tố có kiểu đã được phê duyệt như `-provider`, `-plugin`, `-speech`, `-sandbox`, hoặc `-media-understanding` khi gói cố ý phơi bày một vai trò Plugin hẹp hơn.

<Note>
**Ghi chú về tin cậy:** `plugins.allow` tin cậy **id Plugin**, không phải nguồn gốc xuất xứ. Một Plugin trong workspace có cùng id với Plugin đi kèm sẽ cố ý che khuất bản đi kèm khi Plugin workspace đó được bật/đưa vào danh sách cho phép. Đây là hành vi bình thường và hữu ích cho phát triển cục bộ, kiểm thử bản vá, và hotfix. Mức tin cậy của Plugin đi kèm được xác định từ snapshot nguồn — manifest và mã trên đĩa tại thời điểm tải — chứ không phải từ siêu dữ liệu cài đặt. Một bản ghi cài đặt bị hỏng hoặc bị thay thế không thể âm thầm mở rộng bề mặt tin cậy của Plugin đi kèm vượt quá những gì nguồn thực tế khai báo.
</Note>

## Ranh giới xuất

OpenClaw xuất năng lực, không xuất tiện ích triển khai.

Giữ đăng ký năng lực ở dạng công khai. Cắt bớt các export trợ giúp không thuộc hợp đồng:

- đường dẫn con trợ giúp dành riêng cho Plugin đi kèm
- đường dẫn con hệ thống ống dẫn lúc chạy không nhằm làm API công khai
- trợ giúp tiện ích dành riêng cho nhà cung cấp
- trợ giúp thiết lập/onboarding là chi tiết triển khai

Các đường dẫn con trợ giúp dành riêng cho Plugin đi kèm đã được loại bỏ khỏi bản đồ export SDK được tạo. Giữ trợ giúp dành riêng cho chủ sở hữu bên trong gói Plugin sở hữu; chỉ nâng cấp hành vi host có thể tái sử dụng thành hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.

## Nội bộ và tham chiếu

Để biết pipeline tải, mô hình sổ đăng ký, hook lúc chạy của nhà cung cấp, route HTTP của Gateway, schema công cụ tin nhắn, phân giải mục tiêu kênh, catalog nhà cung cấp, Plugin công cụ ngữ cảnh, và hướng dẫn thêm năng lực mới, xem [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Manifest Plugin](/vi/plugins/manifest)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
