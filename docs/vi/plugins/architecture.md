---
read_when:
    - Xây dựng hoặc gỡ lỗi các Plugin OpenClaw gốc
    - Tìm hiểu mô hình năng lực Plugin hoặc các ranh giới sở hữu
    - Làm việc với pipeline tải Plugin hoặc sổ đăng ký
    - Triển khai các móc nối thời gian chạy của nhà cung cấp hoặc Plugin kênh
sidebarTitle: Internals
summary: 'Nội bộ Plugin: mô hình khả năng, quyền sở hữu, hợp đồng, quy trình nạp và trình trợ giúp thời gian chạy'
title: Nội bộ Plugin
x-i18n:
    generated_at: "2026-04-29T22:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Đây là **tham chiếu kiến trúc chuyên sâu** cho hệ thống Plugin của OpenClaw. Để xem các hướng dẫn thực hành, hãy bắt đầu với một trong các trang tập trung bên dưới.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cách thêm, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/vi/plugins/building-plugins">
    Hướng dẫn tạo Plugin đầu tiên với manifest hoạt động nhỏ nhất.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp mô hình.
  </Card>
  <Card title="SDK overview" icon="book" href="/vi/plugins/sdk-overview">
    Tham chiếu import map và API đăng ký.
  </Card>
</CardGroup>

## Mô hình năng lực công khai

Năng lực là mô hình **Plugin gốc** công khai bên trong OpenClaw. Mỗi Plugin OpenClaw gốc đăng ký với một hoặc nhiều loại năng lực:

| Năng lực               | Phương thức đăng ký                              | Plugin ví dụ                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Suy luận văn bản       | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Giọng nói              | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Chép lời thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Giọng nói thời gian thực | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Hiểu phương tiện       | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Tạo hình ảnh           | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Tải web                | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Phát hiện Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Một Plugin đăng ký không năng lực nào nhưng cung cấp hook, công cụ, dịch vụ phát hiện hoặc dịch vụ nền là Plugin **legacy chỉ dùng hook**. Mẫu này vẫn được hỗ trợ đầy đủ.
</Note>

### Lập trường tương thích bên ngoài

Mô hình năng lực đã được đưa vào core và hiện được các Plugin đi kèm/gốc sử dụng, nhưng khả năng tương thích Plugin bên ngoài vẫn cần tiêu chuẩn chặt hơn “nó được export, vì vậy nó đã đóng băng.”

| Tình huống Plugin                                | Hướng dẫn                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin bên ngoài hiện có                         | Giữ cho các tích hợp dựa trên hook hoạt động; đây là đường cơ sở tương thích.                    |
| Plugin đi kèm/gốc mới                            | Ưu tiên đăng ký năng lực tường minh thay vì truy cập sâu theo nhà cung cấp hoặc thiết kế mới chỉ dùng hook. |
| Plugin bên ngoài áp dụng đăng ký năng lực        | Được phép, nhưng hãy xem các bề mặt helper theo từng năng lực là đang phát triển trừ khi tài liệu đánh dấu chúng ổn định. |

Đăng ký năng lực là hướng đi dự kiến. Các hook legacy vẫn là lộ trình an toàn nhất không gây phá vỡ cho Plugin bên ngoài trong giai đoạn chuyển tiếp. Không phải mọi subpath helper được export đều như nhau — hãy ưu tiên các hợp đồng hẹp đã được ghi tài liệu thay vì các export helper ngẫu nhiên.

### Hình dạng Plugin

OpenClaw phân loại mỗi Plugin được tải thành một hình dạng dựa trên hành vi đăng ký thực tế của nó (không chỉ metadata tĩnh):

<AccordionGroup>
  <Accordion title="plain-capability">
    Đăng ký đúng một loại năng lực (ví dụ một Plugin chỉ dành cho nhà cung cấp như `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Đăng ký nhiều loại năng lực (ví dụ `openai` sở hữu suy luận văn bản, giọng nói, hiểu phương tiện và tạo hình ảnh).
  </Accordion>
  <Accordion title="hook-only">
    Chỉ đăng ký hook (có kiểu hoặc tùy chỉnh), không có năng lực, công cụ, lệnh hoặc dịch vụ.
  </Accordion>
  <Accordion title="non-capability">
    Đăng ký công cụ, lệnh, dịch vụ hoặc route nhưng không có năng lực.
  </Accordion>
</AccordionGroup>

Dùng `openclaw plugins inspect <id>` để xem hình dạng và phần phân tích năng lực của một Plugin. Xem [tham chiếu CLI](/vi/cli/plugins#inspect) để biết chi tiết.

### Hook legacy

Hook `before_agent_start` vẫn được hỗ trợ như một lộ trình tương thích cho các Plugin chỉ dùng hook. Các Plugin legacy trong thực tế vẫn phụ thuộc vào nó.

Hướng đi:

- giữ cho nó hoạt động
- ghi tài liệu rằng nó là legacy
- ưu tiên `before_model_resolve` cho công việc ghi đè mô hình/nhà cung cấp
- ưu tiên `before_prompt_build` cho công việc thay đổi prompt
- chỉ loại bỏ sau khi mức sử dụng thực tế giảm và phạm vi fixture chứng minh việc di trú an toàn

### Tín hiệu tương thích

Khi chạy `openclaw doctor` hoặc `openclaw plugins inspect <id>`, bạn có thể thấy một trong các nhãn sau:

| Tín hiệu                   | Ý nghĩa                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config hợp lệ**          | Config phân tích được bình thường và Plugin phân giải được   |
| **khuyến cáo tương thích** | Plugin dùng một mẫu được hỗ trợ nhưng cũ hơn (ví dụ `hook-only`) |
| **cảnh báo legacy**        | Plugin dùng `before_agent_start`, vốn đã bị ngừng khuyến nghị |
| **lỗi cứng**               | Config không hợp lệ hoặc Plugin tải thất bại                 |

Hiện tại cả `hook-only` lẫn `before_agent_start` đều sẽ không làm hỏng Plugin của bạn: `hook-only` là khuyến cáo, còn `before_agent_start` chỉ kích hoạt cảnh báo. Các tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống Plugin của OpenClaw có bốn lớp:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw tìm các Plugin ứng viên từ các đường dẫn đã cấu hình, root workspace, root Plugin toàn cục và các Plugin đi kèm. Việc phát hiện đọc manifest `openclaw.plugin.json` gốc cùng với các manifest bundle được hỗ trợ trước.
  </Step>
  <Step title="Enablement + validation">
    Core quyết định một Plugin đã phát hiện được bật, tắt, bị chặn hay được chọn cho một slot độc quyền như bộ nhớ.
  </Step>
  <Step title="Runtime loading">
    Các Plugin OpenClaw gốc được tải trong tiến trình qua jiti và đăng ký năng lực vào một registry trung tâm. Các bundle tương thích được chuẩn hóa thành bản ghi registry mà không import mã runtime.
  </Step>
  <Step title="Surface consumption">
    Phần còn lại của OpenClaw đọc registry để phơi bày công cụ, kênh, thiết lập nhà cung cấp, hook, route HTTP, lệnh CLI và dịch vụ.
  </Step>
</Steps>

Riêng với CLI của Plugin, việc phát hiện lệnh root được tách thành hai pha:

- metadata tại thời điểm phân tích đến từ `registerCli(..., { descriptors: [...] })`
- module CLI Plugin thật có thể vẫn lazy và đăng ký khi được gọi lần đầu

Điều đó giữ mã CLI do Plugin sở hữu bên trong Plugin, đồng thời vẫn cho phép OpenClaw giữ trước tên lệnh root trước khi phân tích.

Ranh giới thiết kế quan trọng:

- xác thực manifest/config nên hoạt động từ **metadata manifest/schema** mà không thực thi mã Plugin
- phát hiện năng lực gốc có thể tải mã entry Plugin đáng tin cậy để xây dựng snapshot registry không kích hoạt
- hành vi runtime gốc đến từ đường dẫn `register(api)` của module Plugin với `api.registrationMode === "full"`

Sự phân tách đó cho phép OpenClaw xác thực config, giải thích Plugin bị thiếu/bị tắt và xây dựng gợi ý UI/schema trước khi runtime đầy đủ hoạt động.

### Snapshot metadata Plugin và bảng tra cứu

Khi khởi động Gateway, một `PluginMetadataSnapshot` được xây dựng cho snapshot config hiện tại. Snapshot này chỉ chứa metadata: nó lưu chỉ mục Plugin đã cài đặt, registry manifest, chẩn đoán manifest, bản đồ chủ sở hữu, bộ chuẩn hóa id Plugin và bản ghi manifest. Nó không giữ module Plugin đã tải, SDK nhà cung cấp, nội dung package hoặc export runtime.

Xác thực config nhận biết Plugin, tự động bật khi khởi động và bootstrap Plugin Gateway sử dụng snapshot đó thay vì tự xây dựng lại metadata manifest/chỉ mục. `PluginLookUpTable` được dẫn xuất từ cùng snapshot và thêm kế hoạch Plugin khởi động cho config runtime hiện tại.

Sau khi khởi động, Gateway giữ snapshot metadata hiện tại như một sản phẩm runtime có thể thay thế. Việc phát hiện nhà cung cấp runtime lặp lại có thể mượn snapshot đó thay vì dựng lại chỉ mục đã cài đặt và registry manifest cho mỗi lượt catalog nhà cung cấp. Snapshot được xóa hoặc thay thế khi Gateway tắt, khi config/kho Plugin thay đổi và khi ghi chỉ mục đã cài đặt; caller quay về đường dẫn manifest/chỉ mục lạnh khi không có snapshot hiện tại tương thích. Kiểm tra tương thích phải bao gồm các root phát hiện Plugin như `plugins.load.paths` và workspace agent mặc định, vì Plugin workspace là một phần của phạm vi metadata.

Snapshot và bảng tra cứu giữ các quyết định khởi động lặp lại trên đường dẫn nhanh:

- quyền sở hữu kênh
- khởi động kênh bị trì hoãn
- id Plugin khởi động
- quyền sở hữu backend nhà cung cấp và CLI
- thiết lập nhà cung cấp, bí danh lệnh, nhà cung cấp catalog mô hình và quyền sở hữu hợp đồng manifest
- xác thực schema config Plugin và schema config kênh
- quyết định tự động bật khi khởi động

Ranh giới an toàn là thay thế snapshot, không phải mutation. Hãy xây dựng lại snapshot khi config, kho Plugin, bản ghi cài đặt hoặc chính sách chỉ mục được lưu thay đổi. Đừng xem nó là một registry toàn cục rộng có thể thay đổi, và đừng giữ snapshot lịch sử không giới hạn. Việc tải Plugin runtime vẫn tách biệt với snapshot metadata để trạng thái runtime cũ không thể bị che khuất sau cache metadata.

Quy tắc cache được ghi tài liệu trong [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals#plugin-cache-boundary): metadata manifest và phát hiện là mới trừ khi caller giữ snapshot, bảng tra cứu hoặc registry manifest tường minh cho luồng hiện tại. Cache metadata ẩn và TTL theo đồng hồ không thuộc về việc tải Plugin. Chỉ cache loader runtime, module và artifact phụ thuộc mới có thể tồn tại sau khi mã hoặc artifact đã cài đặt thực sự được tải.

Một số caller đường dẫn lạnh vẫn dựng lại registry manifest trực tiếp từ chỉ mục Plugin đã cài đặt được lưu, thay vì nhận `PluginLookUpTable` của Gateway. Đường dẫn đó hiện dựng lại registry theo yêu cầu; hãy ưu tiên truyền bảng tra cứu hiện tại hoặc registry manifest tường minh qua các luồng runtime khi caller đã có sẵn.

### Lập kế hoạch kích hoạt

Lập kế hoạch kích hoạt là một phần của mặt phẳng điều khiển. Caller có thể hỏi Plugin nào liên quan đến một lệnh, nhà cung cấp, kênh, route, harness agent hoặc năng lực cụ thể trước khi tải các registry runtime rộng hơn.

Bộ lập kế hoạch giữ hành vi manifest hiện tại tương thích:

- các trường `activation.*` là gợi ý bộ lập kế hoạch tường minh
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và hook vẫn là fallback quyền sở hữu manifest
- API bộ lập kế hoạch chỉ chứa id vẫn khả dụng cho caller hiện có
- API kế hoạch báo cáo nhãn lý do để chẩn đoán có thể phân biệt gợi ý tường minh với fallback quyền sở hữu

<Warning>
Đừng xem `activation` là hook vòng đời hay phần thay thế cho `register(...)`. Đây là siêu dữ liệu dùng để thu hẹp phạm vi tải. Ưu tiên các trường quyền sở hữu khi chúng đã mô tả mối quan hệ; chỉ dùng `activation` cho các gợi ý bổ sung dành cho bộ lập kế hoạch.
</Warning>

### Plugin kênh và công cụ tin nhắn dùng chung

Plugin kênh không cần đăng ký một công cụ gửi/chỉnh sửa/bày tỏ cảm xúc riêng cho các thao tác trò chuyện thông thường. OpenClaw giữ một công cụ `message` dùng chung trong lõi, còn Plugin kênh sở hữu phần khám phá và thực thi dành riêng cho kênh phía sau công cụ đó.

Ranh giới hiện tại là:

- lõi sở hữu máy chủ công cụ `message` dùng chung, nối dây prompt, sổ sách phiên/luồng, và điều phối thực thi
- Plugin kênh sở hữu việc khám phá hành động có phạm vi, khám phá năng lực, và mọi mảnh schema dành riêng cho kênh
- Plugin kênh sở hữu ngữ pháp hội thoại phiên dành riêng cho provider, chẳng hạn cách id hội thoại mã hóa id luồng hoặc kế thừa từ hội thoại cha
- Plugin kênh thực thi hành động cuối cùng thông qua bộ chuyển đổi hành động của chúng

Đối với Plugin kênh, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Lệnh gọi khám phá thống nhất đó cho phép Plugin trả về các hành động hiển thị, năng lực, và phần đóng góp schema cùng nhau để những phần này không bị lệch nhau.

Khi một tham số công cụ tin nhắn dành riêng cho kênh mang nguồn media như đường dẫn cục bộ hoặc URL media từ xa, Plugin cũng nên trả về `mediaSourceParams` từ `describeMessageTool(...)`. Lõi dùng danh sách tường minh đó để áp dụng chuẩn hóa đường dẫn sandbox và gợi ý truy cập media đi ra mà không hardcode tên tham số do Plugin sở hữu. Ưu tiên các map theo phạm vi hành động ở đó, không dùng một danh sách phẳng toàn kênh, để tham số media chỉ dành cho hồ sơ không bị chuẩn hóa trên các hành động không liên quan như `send`.

Lõi truyền phạm vi runtime vào bước khám phá đó. Các trường quan trọng gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` đầu vào đáng tin cậy

Điều đó quan trọng với các Plugin nhạy theo ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị hành động tin nhắn dựa trên tài khoản đang hoạt động, phòng/luồng/tin nhắn hiện tại, hoặc danh tính người yêu cầu đáng tin cậy mà không hardcode các nhánh dành riêng cho kênh trong công cụ `message` của lõi.

Đây là lý do các thay đổi định tuyến trình chạy nhúng vẫn là công việc của Plugin: trình chạy chịu trách nhiệm chuyển tiếp danh tính trò chuyện/phiên hiện tại vào ranh giới khám phá Plugin để công cụ `message` dùng chung hiển thị đúng bề mặt do kênh sở hữu cho lượt hiện tại.

Đối với các helper thực thi do kênh sở hữu, các Plugin đi kèm nên giữ runtime thực thi bên trong các module extension của chính chúng. Lõi không còn sở hữu các runtime hành động tin nhắn Discord, Slack, Telegram, hoặc WhatsApp trong `src/agents/tools`. Chúng tôi không phát hành các subpath `plugin-sdk/*-action-runtime` riêng, và các Plugin đi kèm nên nhập trực tiếp mã runtime cục bộ của chúng từ các module do extension sở hữu.

Ranh giới tương tự áp dụng cho các seam SDK được đặt tên theo provider nói chung: lõi không nên nhập các barrel tiện ích dành riêng cho kênh cho Slack, Discord, Signal, WhatsApp, hoặc các extension tương tự. Nếu lõi cần một hành vi, hãy tiêu thụ barrel `api.ts` / `runtime-api.ts` của chính Plugin đi kèm hoặc nâng nhu cầu đó thành một năng lực chung hẹp trong SDK dùng chung.

Các Plugin đi kèm tuân theo cùng quy tắc. `runtime-api.ts` của một Plugin đi kèm không nên tái xuất facade `openclaw/plugin-sdk/<plugin-id>` có thương hiệu riêng của nó. Các facade có thương hiệu đó vẫn là shim tương thích cho Plugin bên ngoài và người tiêu thụ cũ hơn, nhưng Plugin đi kèm nên dùng export cục bộ cùng các subpath SDK chung hẹp như `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, hoặc `openclaw/plugin-sdk/webhook-ingress`. Mã mới không nên thêm facade SDK dành riêng cho plugin-id trừ khi ranh giới tương thích cho một hệ sinh thái bên ngoài hiện có yêu cầu điều đó.

Riêng với cuộc thăm dò ý kiến, có hai đường dẫn thực thi:

- `outbound.sendPoll` là đường cơ sở dùng chung cho các kênh phù hợp với mô hình thăm dò ý kiến phổ biến
- `actions.handleAction("poll")` là đường dẫn ưu tiên cho ngữ nghĩa thăm dò ý kiến dành riêng cho kênh hoặc các tham số thăm dò ý kiến bổ sung

Lõi hiện trì hoãn phân tích cú pháp thăm dò ý kiến dùng chung cho đến sau khi điều phối thăm dò ý kiến của Plugin từ chối hành động, để các handler thăm dò ý kiến do Plugin sở hữu có thể chấp nhận các trường thăm dò ý kiến dành riêng cho kênh mà không bị trình phân tích cú pháp thăm dò ý kiến chung chặn trước.

Xem [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals) để biết toàn bộ trình tự khởi động.

## Mô hình sở hữu năng lực

OpenClaw xem một Plugin native là ranh giới sở hữu cho một **công ty** hoặc một **tính năng**, không phải một túi gom các tích hợp không liên quan.

Điều đó có nghĩa là:

- một Plugin công ty thường nên sở hữu tất cả các bề mặt hướng OpenClaw của công ty đó
- một Plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- kênh nên tiêu thụ các năng lực lõi dùng chung thay vì tự triển khai lại hành vi provider theo kiểu ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` sở hữu suy luận văn bản, giọng nói, thoại thời gian thực, hiểu media, và tạo ảnh. `google` sở hữu suy luận văn bản cùng với hiểu media, tạo ảnh, và tìm kiếm web. `qwen` sở hữu suy luận văn bản cùng với hiểu media và tạo video.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` và `microsoft` sở hữu giọng nói; `firecrawl` sở hữu tìm nạp web; `minimax` / `mistral` / `moonshot` / `zai` sở hữu các backend hiểu media.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` sở hữu truyền tải cuộc gọi, công cụ, CLI, route, và cầu nối luồng media Twilio, nhưng tiêu thụ các năng lực giọng nói, phiên âm thời gian thực, và thoại thời gian thực dùng chung thay vì nhập trực tiếp Plugin vendor.
  </Accordion>
</AccordionGroup>

Trạng thái đích mong muốn là:

- OpenAI nằm trong một Plugin ngay cả khi nó trải rộng qua mô hình văn bản, giọng nói, ảnh, và video trong tương lai
- vendor khác có thể làm điều tương tự cho phạm vi bề mặt của riêng mình
- kênh không quan tâm Plugin vendor nào sở hữu provider; chúng tiêu thụ hợp đồng năng lực dùng chung do lõi phơi bày

Đây là điểm khác biệt cốt lõi:

- **Plugin** = ranh giới sở hữu
- **năng lực** = hợp đồng lõi mà nhiều Plugin có thể triển khai hoặc tiêu thụ

Vì vậy, nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "provider nào nên hardcode xử lý video?" Câu hỏi đầu tiên là "hợp đồng năng lực video của lõi là gì?" Khi hợp đồng đó tồn tại, Plugin vendor có thể đăng ký với nó và Plugin kênh/tính năng có thể tiêu thụ nó.

Nếu năng lực đó chưa tồn tại, bước đúng thường là:

<Steps>
  <Step title="Define the capability">
    Định nghĩa năng lực còn thiếu trong lõi.
  </Step>
  <Step title="Expose through the SDK">
    Phơi bày nó thông qua API/runtime Plugin theo cách có kiểu.
  </Step>
  <Step title="Wire consumers">
    Nối dây các kênh/tính năng với năng lực đó.
  </Step>
  <Step title="Vendor implementations">
    Cho phép Plugin vendor đăng ký các triển khai.
  </Step>
</Steps>

Điều này giữ quyền sở hữu tường minh đồng thời tránh hành vi lõi phụ thuộc vào một vendor đơn lẻ hoặc một đường dẫn mã dành riêng cho Plugin kiểu một lần.

### Phân lớp năng lực

Dùng mô hình tư duy này khi quyết định mã thuộc về đâu:

<Tabs>
  <Tab title="Core capability layer">
    Điều phối dùng chung, chính sách, fallback, quy tắc gộp cấu hình, ngữ nghĩa phân phối, và hợp đồng có kiểu.
  </Tab>
  <Tab title="Vendor plugin layer">
    API dành riêng cho vendor, xác thực, catalog mô hình, tổng hợp giọng nói, tạo ảnh, backend video trong tương lai, endpoint mức sử dụng.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Tích hợp Slack/Discord/voice-call/v.v. tiêu thụ năng lực lõi và trình bày chúng trên một bề mặt.
  </Tab>
</Tabs>

Ví dụ, TTS tuân theo hình dạng này:

- lõi sở hữu chính sách TTS tại thời điểm trả lời, thứ tự fallback, tùy chọn, và phân phối qua kênh
- `openai`, `elevenlabs`, và `microsoft` sở hữu các triển khai tổng hợp
- `voice-call` tiêu thụ helper runtime TTS điện thoại

Nên ưu tiên cùng mẫu đó cho các năng lực trong tương lai.

### Ví dụ Plugin công ty đa năng lực

Một Plugin công ty nên tạo cảm giác gắn kết từ bên ngoài. Nếu OpenClaw có hợp đồng dùng chung cho mô hình, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu media, tạo ảnh, tạo video, tìm nạp web, và tìm kiếm web, một vendor có thể sở hữu tất cả các bề mặt của mình ở một nơi:

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
- lõi vẫn sở hữu các hợp đồng năng lực
- kênh và Plugin tính năng tiêu thụ helper `api.runtime.*`, không phải mã vendor
- kiểm thử hợp đồng có thể xác nhận rằng Plugin đã đăng ký các năng lực mà nó tuyên bố sở hữu

### Ví dụ năng lực: hiểu video

OpenClaw đã xem hiểu ảnh/âm thanh/video là một năng lực dùng chung. Cùng mô hình sở hữu cũng áp dụng ở đó:

<Steps>
  <Step title="Core defines the contract">
    Lõi định nghĩa hợp đồng hiểu media.
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor đăng ký `describeImage`, `transcribeAudio`, và `describeVideo` khi áp dụng.
  </Step>
  <Step title="Consumers use the shared behavior">
    Kênh và Plugin tính năng tiêu thụ hành vi lõi dùng chung thay vì nối dây trực tiếp tới mã vendor.
  </Step>
</Steps>

Điều đó tránh nhúng các giả định video của một provider vào lõi. Plugin sở hữu bề mặt vendor; lõi sở hữu hợp đồng năng lực và hành vi fallback.

Tạo video đã dùng cùng trình tự đó: lõi sở hữu hợp đồng năng lực có kiểu và helper runtime, còn Plugin vendor đăng ký các triển khai `api.registerVideoGenerationProvider(...)` với nó.

Cần một checklist triển khai cụ thể? Xem [Capability Cookbook](/vi/plugins/architecture).

## Hợp đồng và thực thi

Bề mặt API Plugin được cố ý định kiểu và tập trung trong `OpenClawPluginApi`. Hợp đồng đó định nghĩa các điểm đăng ký được hỗ trợ và các helper runtime mà Plugin có thể dựa vào.

Vì sao điều này quan trọng:

- tác giả Plugin có một tiêu chuẩn nội bộ ổn định
- lõi có thể từ chối quyền sở hữu trùng lặp như hai Plugin đăng ký cùng một provider id
- khởi động có thể hiển thị chẩn đoán có thể hành động cho đăng ký sai định dạng
- kiểm thử hợp đồng có thể thực thi quyền sở hữu Plugin đi kèm và ngăn drift âm thầm

Có hai lớp thực thi:

<AccordionGroup>
  <Accordion title="Thực thi đăng ký runtime">
    Sổ đăng ký plugin xác thực các đăng ký khi plugin được tải. Ví dụ: id nhà cung cấp trùng lặp, id nhà cung cấp giọng nói trùng lặp, và đăng ký sai định dạng sẽ tạo chẩn đoán plugin thay vì hành vi không xác định.
  </Accordion>
  <Accordion title="Kiểm thử hợp đồng">
    Các plugin đi kèm được ghi lại trong sổ đăng ký hợp đồng trong khi chạy kiểm thử để OpenClaw có thể khẳng định quyền sở hữu một cách rõ ràng. Hiện nay, việc này được dùng cho nhà cung cấp mô hình, nhà cung cấp giọng nói, nhà cung cấp tìm kiếm web, và quyền sở hữu đăng ký đi kèm.
  </Accordion>
</AccordionGroup>

Hiệu quả thực tế là OpenClaw biết ngay từ đầu plugin nào sở hữu bề mặt nào. Điều đó cho phép lõi và các kênh kết hợp liền mạch vì quyền sở hữu được khai báo, có kiểu, và có thể kiểm thử thay vì ngầm định.

### Những gì thuộc về một hợp đồng

<Tabs>
  <Tab title="Hợp đồng tốt">
    - có kiểu
    - nhỏ
    - đặc thù theo năng lực
    - do lõi sở hữu
    - có thể tái sử dụng bởi nhiều plugin
    - các kênh/tính năng có thể dùng mà không cần biết nhà cung cấp

  </Tab>
  <Tab title="Hợp đồng xấu">
    - chính sách đặc thù theo nhà cung cấp bị ẩn trong lõi
    - lối thoát một lần cho plugin bỏ qua sổ đăng ký
    - mã kênh truy cập thẳng vào triển khai của nhà cung cấp
    - đối tượng runtime tùy tiện không thuộc `OpenClawPluginApi` hoặc `api.runtime`

  </Tab>
</Tabs>

Khi nghi ngờ, hãy nâng mức trừu tượng: định nghĩa năng lực trước, rồi để plugin cắm vào năng lực đó.

## Mô hình thực thi

Plugin OpenClaw gốc chạy **trong cùng tiến trình** với Gateway. Chúng không được sandbox. Một plugin gốc đã tải có cùng ranh giới tin cậy ở cấp tiến trình như mã lõi.

<Warning>
Hệ quả của plugin gốc: plugin có thể đăng ký công cụ, trình xử lý mạng, hook, và dịch vụ; lỗi plugin có thể làm sập hoặc gây mất ổn định gateway; và một plugin gốc độc hại tương đương với thực thi mã tùy ý bên trong tiến trình OpenClaw.
</Warning>

Các gói tương thích an toàn hơn theo mặc định vì OpenClaw hiện xử lý chúng như các gói metadata/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là Skills đi kèm.

Dùng danh sách cho phép và đường dẫn cài đặt/tải rõ ràng cho các plugin không đi kèm. Xem plugin trong workspace là mã dành cho thời điểm phát triển, không phải mặc định sản xuất.

Đối với tên gói workspace đi kèm, hãy giữ id plugin neo vào tên npm: mặc định là `@openclaw/<id>`, hoặc hậu tố có kiểu đã được phê duyệt như `-provider`, `-plugin`, `-speech`, `-sandbox`, hoặc `-media-understanding` khi gói cố ý phơi bày vai trò plugin hẹp hơn.

<Note>
**Ghi chú tin cậy:** `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc xuất xứ. Plugin workspace có cùng id với plugin đi kèm sẽ cố ý che khuất bản đi kèm khi plugin workspace đó được bật/đưa vào danh sách cho phép. Đây là điều bình thường và hữu ích cho phát triển cục bộ, kiểm thử bản vá, và hotfix. Độ tin cậy của plugin đi kèm được phân giải từ snapshot nguồn — manifest và mã trên đĩa tại thời điểm tải — chứ không phải từ metadata cài đặt. Một bản ghi cài đặt bị hỏng hoặc bị thay thế không thể âm thầm mở rộng bề mặt tin cậy của plugin đi kèm vượt quá những gì nguồn thực tế tuyên bố.
</Note>

## Ranh giới xuất

OpenClaw xuất năng lực, không xuất tiện ích triển khai.

Giữ việc đăng ký năng lực ở chế độ công khai. Cắt bớt các export helper không thuộc hợp đồng:

- subpath helper đặc thù cho plugin đi kèm
- subpath đường ống runtime không được dự định làm API công khai
- helper tiện ích đặc thù theo nhà cung cấp
- helper thiết lập/onboarding là chi tiết triển khai

Các subpath helper dành riêng cho plugin đi kèm đã được gỡ khỏi bản đồ export SDK được tạo. Giữ các helper đặc thù theo chủ sở hữu bên trong gói plugin sở hữu chúng; chỉ nâng cấp hành vi host có thể tái sử dụng thành các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.

## Nội bộ và tham khảo

Để biết pipeline tải, mô hình sổ đăng ký, hook runtime của nhà cung cấp, tuyến HTTP Gateway, schema công cụ tin nhắn, phân giải mục tiêu kênh, catalog nhà cung cấp, plugin công cụ ngữ cảnh, và hướng dẫn thêm năng lực mới, xem [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Manifest Plugin](/vi/plugins/manifest)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
