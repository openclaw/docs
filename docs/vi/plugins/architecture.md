---
read_when:
    - Xây dựng hoặc gỡ lỗi các Plugin OpenClaw gốc
    - Hiểu mô hình năng lực của Plugin hoặc ranh giới quyền sở hữu
    - Làm việc trên quy trình tải Plugin hoặc hệ thống đăng ký
    - Triển khai các điểm móc thời gian chạy của nhà cung cấp hoặc Plugin kênh
sidebarTitle: Internals
summary: 'Nội bộ Plugin: mô hình năng lực, quyền sở hữu, hợp đồng, quy trình tải và trình trợ giúp thời gian chạy'
title: Nội bộ Plugin
x-i18n:
    generated_at: "2026-05-02T10:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Đây là **tài liệu tham chiếu kiến trúc chuyên sâu** cho hệ thống Plugin của OpenClaw. Để xem các hướng dẫn thực hành, hãy bắt đầu với một trong các trang tập trung bên dưới.

<CardGroup cols={2}>
  <Card title="Cài đặt và sử dụng Plugin" icon="plug" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách thêm, bật và khắc phục sự cố Plugin.
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

| Năng lực                 | Phương thức đăng ký                             | Plugin ví dụ                         |
| ------------------------ | ----------------------------------------------- | ------------------------------------ |
| Suy luận văn bản         | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend suy luận CLI     | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Giọng nói                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Phiên âm thời gian thực  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Giọng nói thời gian thực | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Hiểu nội dung phương tiện | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Tạo hình ảnh             | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Tạo nhạc                 | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Tạo video                | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Tìm nạp web              | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Tìm kiếm web             | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kênh / nhắn tin          | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |
| Khám phá Gateway         | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

<Note>
Một Plugin đăng ký không năng lực nào nhưng cung cấp hook, công cụ, dịch vụ khám phá hoặc dịch vụ nền là Plugin **chỉ có hook kiểu cũ**. Mẫu này vẫn được hỗ trợ đầy đủ.
</Note>

### Lập trường tương thích bên ngoài

Mô hình năng lực đã được đưa vào core và hiện được các Plugin đóng gói/gốc sử dụng, nhưng khả năng tương thích Plugin bên ngoài vẫn cần một tiêu chuẩn chặt chẽ hơn so với “nó được xuất ra, nên nó đã đóng băng”.

| Tình huống Plugin                                | Hướng dẫn                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Plugin bên ngoài hiện có                         | Giữ cho các tích hợp dựa trên hook tiếp tục hoạt động; đây là đường cơ sở tương thích.            |
| Plugin đóng gói/gốc mới                          | Ưu tiên đăng ký năng lực rõ ràng thay vì truy cập sâu theo nhà cung cấp hoặc thiết kế mới chỉ có hook. |
| Plugin bên ngoài áp dụng đăng ký năng lực        | Được phép, nhưng hãy xem các bề mặt trợ giúp theo năng lực là đang phát triển trừ khi tài liệu đánh dấu chúng là ổn định. |

Đăng ký năng lực là hướng đi dự kiến. Hook kiểu cũ vẫn là đường an toàn nhất không gây đứt gãy cho Plugin bên ngoài trong giai đoạn chuyển tiếp. Không phải mọi subpath trợ giúp được xuất đều tương đương nhau — hãy ưu tiên các hợp đồng hẹp đã được tài liệu hóa hơn các export trợ giúp ngẫu nhiên.

### Hình dạng Plugin

OpenClaw phân loại từng Plugin đã tải thành một hình dạng dựa trên hành vi đăng ký thực tế của nó (không chỉ metadata tĩnh):

<AccordionGroup>
  <Accordion title="plain-capability">
    Đăng ký đúng một loại năng lực (ví dụ Plugin chỉ là nhà cung cấp như `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Đăng ký nhiều loại năng lực (ví dụ `openai` sở hữu suy luận văn bản, giọng nói, hiểu nội dung phương tiện và tạo hình ảnh).
  </Accordion>
  <Accordion title="hook-only">
    Chỉ đăng ký hook (có kiểu hoặc tùy chỉnh), không có năng lực, công cụ, lệnh hoặc dịch vụ.
  </Accordion>
  <Accordion title="non-capability">
    Đăng ký công cụ, lệnh, dịch vụ hoặc route nhưng không có năng lực.
  </Accordion>
</AccordionGroup>

Dùng `openclaw plugins inspect <id>` để xem hình dạng và phân tích năng lực của một Plugin. Xem [tham chiếu CLI](/vi/cli/plugins#inspect) để biết chi tiết.

### Hook kiểu cũ

Hook `before_agent_start` vẫn được hỗ trợ như một đường tương thích cho các Plugin chỉ có hook. Các Plugin thực tế kiểu cũ vẫn còn phụ thuộc vào nó.

Hướng đi:

- giữ cho nó hoạt động
- ghi tài liệu rằng nó là kiểu cũ
- ưu tiên `before_model_resolve` cho công việc ghi đè mô hình/nhà cung cấp
- ưu tiên `before_prompt_build` cho công việc chỉnh sửa prompt
- chỉ gỡ bỏ sau khi mức sử dụng thực tế giảm và phạm vi fixture chứng minh việc di chuyển là an toàn

### Tín hiệu tương thích

Khi chạy `openclaw doctor` hoặc `openclaw plugins inspect <id>`, bạn có thể thấy một trong các nhãn sau:

| Tín hiệu                     | Ý nghĩa                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| **cấu hình hợp lệ**          | Cấu hình phân tích được bình thường và Plugin được phân giải     |
| **khuyến nghị tương thích**  | Plugin dùng một mẫu được hỗ trợ nhưng cũ hơn (ví dụ `hook-only`) |
| **cảnh báo kiểu cũ**         | Plugin dùng `before_agent_start`, tính năng này đã bị phản đối  |
| **lỗi cứng**                 | Cấu hình không hợp lệ hoặc Plugin không tải được                |

Cả `hook-only` lẫn `before_agent_start` đều sẽ không làm hỏng Plugin của bạn hôm nay: `hook-only` chỉ là khuyến nghị, và `before_agent_start` chỉ kích hoạt cảnh báo. Các tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống Plugin của OpenClaw có bốn lớp:

<Steps>
  <Step title="Manifest + khám phá">
    OpenClaw tìm các Plugin ứng viên từ đường dẫn đã cấu hình, gốc workspace, gốc Plugin toàn cục và Plugin đóng gói. Khâu khám phá đọc manifest `openclaw.plugin.json` gốc cùng các manifest bundle được hỗ trợ trước.
  </Step>
  <Step title="Bật + xác thực">
    Core quyết định một Plugin đã được khám phá là được bật, bị tắt, bị chặn hay được chọn cho một slot độc quyền như bộ nhớ.
  </Step>
  <Step title="Tải runtime">
    Plugin OpenClaw gốc được tải trong tiến trình và đăng ký năng lực vào một registry trung tâm. JavaScript đóng gói tải qua `require` gốc; TypeScript nguồn cục bộ của bên thứ ba là phương án dự phòng Jiti khẩn cấp. Các bundle tương thích được chuẩn hóa thành bản ghi registry mà không import mã runtime.
  </Step>
  <Step title="Tiêu thụ bề mặt">
    Phần còn lại của OpenClaw đọc registry để phơi bày công cụ, kênh, thiết lập nhà cung cấp, hook, route HTTP, lệnh CLI và dịch vụ.
  </Step>
</Steps>

Riêng với CLI của Plugin, khám phá lệnh gốc được tách thành hai pha:

- metadata tại thời điểm phân tích cú pháp đến từ `registerCli(..., { descriptors: [...] })`
- module CLI thật của Plugin có thể vẫn lazy và đăng ký ở lần gọi đầu tiên

Điều đó giữ mã CLI do Plugin sở hữu bên trong Plugin, đồng thời vẫn cho phép OpenClaw giữ trước tên lệnh gốc trước khi phân tích cú pháp.

Ranh giới thiết kế quan trọng:

- xác thực manifest/cấu hình nên hoạt động từ **metadata manifest/schema** mà không thực thi mã Plugin
- khám phá năng lực gốc có thể tải mã entry Plugin đáng tin cậy để xây dựng snapshot registry không kích hoạt
- hành vi runtime gốc đến từ đường dẫn `register(api)` của module Plugin với `api.registrationMode === "full"`

Sự phân tách đó cho phép OpenClaw xác thực cấu hình, giải thích Plugin bị thiếu/bị tắt và xây dựng gợi ý UI/schema trước khi runtime đầy đủ hoạt động.

### Snapshot metadata Plugin và bảng tra cứu

Khi Gateway khởi động, nó xây dựng một `PluginMetadataSnapshot` cho snapshot cấu hình hiện tại. Snapshot này chỉ có metadata: nó lưu chỉ mục Plugin đã cài đặt, registry manifest, chẩn đoán manifest, bản đồ chủ sở hữu, bộ chuẩn hóa id Plugin và bản ghi manifest. Nó không giữ module Plugin đã tải, SDK nhà cung cấp, nội dung package hoặc export runtime.

Xác thực cấu hình có nhận biết Plugin, tự động bật khi khởi động và bootstrap Plugin của Gateway dùng snapshot đó thay vì tự xây dựng lại metadata manifest/chỉ mục một cách độc lập. `PluginLookUpTable` được suy ra từ cùng snapshot và thêm kế hoạch Plugin khởi động cho cấu hình runtime hiện tại.

Sau khi khởi động, Gateway giữ snapshot metadata hiện tại như một sản phẩm runtime có thể thay thế. Khám phá nhà cung cấp runtime lặp lại có thể mượn snapshot đó thay vì dựng lại chỉ mục đã cài đặt và registry manifest cho mỗi lượt catalog nhà cung cấp. Snapshot được xóa hoặc thay thế khi Gateway tắt, khi cấu hình/kho Plugin thay đổi và khi ghi chỉ mục đã cài đặt; bên gọi quay về đường dẫn manifest/chỉ mục lạnh khi không có snapshot hiện tại tương thích. Kiểm tra tương thích phải bao gồm các gốc khám phá Plugin như `plugins.load.paths` và workspace tác nhân mặc định, vì Plugin workspace là một phần của phạm vi metadata.

Snapshot và bảng tra cứu giữ các quyết định khởi động lặp lại trên đường nhanh:

- quyền sở hữu kênh
- khởi động kênh trì hoãn
- id Plugin khởi động
- quyền sở hữu nhà cung cấp và backend CLI
- quyền sở hữu nhà cung cấp thiết lập, bí danh lệnh, nhà cung cấp catalog mô hình và hợp đồng manifest
- xác thực schema cấu hình Plugin và schema cấu hình kênh
- quyết định tự động bật khi khởi động

Ranh giới an toàn là thay thế snapshot, không phải đột biến. Xây dựng lại snapshot khi cấu hình, kho Plugin, bản ghi cài đặt hoặc chính sách chỉ mục đã lưu thay đổi. Đừng xem nó là một registry toàn cục rộng có thể đột biến, và đừng giữ các snapshot lịch sử không giới hạn. Tải Plugin runtime vẫn tách biệt với snapshot metadata để trạng thái runtime cũ không thể bị che giấu phía sau cache metadata.

Quy tắc cache được ghi tài liệu trong [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals#plugin-cache-boundary): metadata manifest và khám phá là mới trừ khi bên gọi giữ một snapshot, bảng tra cứu hoặc registry manifest rõ ràng cho luồng hiện tại. Cache metadata ẩn và TTL theo đồng hồ không thuộc quy trình tải Plugin. Chỉ cache loader runtime, module và artifact phụ thuộc mới có thể tồn tại sau khi mã hoặc artifact đã cài đặt thật sự được tải.

Một số bên gọi trên đường lạnh vẫn dựng lại registry manifest trực tiếp từ chỉ mục Plugin đã cài đặt được lưu bền thay vì nhận `PluginLookUpTable` của Gateway. Đường này hiện dựng lại registry theo nhu cầu; hãy ưu tiên truyền bảng tra cứu hiện tại hoặc registry manifest rõ ràng qua các luồng runtime khi bên gọi đã có sẵn một cái.

### Lập kế hoạch kích hoạt

Lập kế hoạch kích hoạt là một phần của mặt phẳng điều khiển. Bên gọi có thể hỏi Plugin nào liên quan đến một lệnh, nhà cung cấp, kênh, route, harness tác nhân hoặc năng lực cụ thể trước khi tải các registry runtime rộng hơn.

Trình lập kế hoạch giữ hành vi manifest hiện tại tương thích:

- các trường `activation.*` là gợi ý lập kế hoạch rõ ràng
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và hook vẫn là phương án dự phòng quyền sở hữu manifest
- API trình lập kế hoạch chỉ có id vẫn có sẵn cho các bên gọi hiện có
- API kế hoạch báo nhãn lý do để chẩn đoán có thể phân biệt gợi ý rõ ràng với phương án dự phòng quyền sở hữu

<Warning>
Đừng xem `activation` là một hook vòng đời hoặc phần thay thế cho `register(...)`. Đây là siêu dữ liệu dùng để thu hẹp phạm vi tải. Ưu tiên các trường sở hữu khi chúng đã mô tả mối quan hệ; chỉ dùng `activation` cho các gợi ý bổ sung cho bộ lập kế hoạch.
</Warning>

### Plugin kênh và công cụ tin nhắn dùng chung

Plugin kênh không cần đăng ký một công cụ gửi/chỉnh sửa/thả cảm xúc riêng cho các hành động trò chuyện thông thường. OpenClaw giữ một công cụ `message` dùng chung trong lõi, còn Plugin kênh sở hữu phần khám phá và thực thi đặc thù theo kênh phía sau công cụ đó.

Ranh giới hiện tại là:

- lõi sở hữu máy chủ công cụ `message` dùng chung, nối dây prompt, ghi sổ phiên/luồng, và điều phối thực thi
- Plugin kênh sở hữu khám phá hành động theo phạm vi, khám phá năng lực, và mọi mảnh schema đặc thù theo kênh
- Plugin kênh sở hữu ngữ pháp hội thoại phiên theo nhà cung cấp, chẳng hạn cách id hội thoại mã hóa id luồng hoặc kế thừa từ hội thoại cha
- Plugin kênh thực thi hành động cuối cùng thông qua bộ chuyển đổi hành động của chúng

Đối với Plugin kênh, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Lệnh gọi khám phá hợp nhất đó cho phép một Plugin trả về các hành động hiển thị, năng lực, và phần đóng góp schema cùng nhau để các phần đó không bị lệch nhau.

Khi một tham số công cụ tin nhắn đặc thù theo kênh mang nguồn media như đường dẫn cục bộ hoặc URL media từ xa, Plugin cũng nên trả về `mediaSourceParams` từ `describeMessageTool(...)`. Lõi dùng danh sách rõ ràng đó để áp dụng chuẩn hóa đường dẫn sandbox và gợi ý truy cập media đi ra mà không mã hóa cứng tên tham số do Plugin sở hữu. Ưu tiên các map theo phạm vi hành động ở đó, không phải một danh sách phẳng cho toàn kênh, để một tham số media chỉ dành cho hồ sơ không bị chuẩn hóa trên các hành động không liên quan như `send`.

Lõi truyền phạm vi runtime vào bước khám phá đó. Các trường quan trọng gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` đầu vào đáng tin cậy

Điều đó quan trọng với các Plugin nhạy theo ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị các hành động tin nhắn dựa trên tài khoản đang hoạt động, phòng/luồng/tin nhắn hiện tại, hoặc danh tính người yêu cầu đáng tin cậy mà không mã hóa cứng các nhánh đặc thù theo kênh trong công cụ `message` của lõi.

Đây là lý do các thay đổi định tuyến runner nhúng vẫn là công việc của Plugin: runner chịu trách nhiệm chuyển tiếp danh tính chat/phiên hiện tại vào ranh giới khám phá Plugin để công cụ `message` dùng chung hiển thị đúng bề mặt do kênh sở hữu cho lượt hiện tại.

Đối với các helper thực thi do kênh sở hữu, các Plugin đi kèm nên giữ runtime thực thi bên trong các mô-đun extension của chính chúng. Lõi không còn sở hữu các runtime hành động tin nhắn Discord, Slack, Telegram, hoặc WhatsApp trong `src/agents/tools`. Chúng tôi không phát hành các subpath `plugin-sdk/*-action-runtime` riêng, và các Plugin đi kèm nên import mã runtime cục bộ của chính chúng trực tiếp từ các mô-đun do extension sở hữu.

Cùng ranh giới đó áp dụng cho các seam SDK mang tên nhà cung cấp nói chung: lõi không nên import các barrel tiện ích đặc thù theo kênh cho Slack, Discord, Signal, WhatsApp, hoặc các extension tương tự. Nếu lõi cần một hành vi, hãy dùng barrel `api.ts` / `runtime-api.ts` của chính Plugin đi kèm hoặc nâng nhu cầu đó thành một năng lực chung hẹp trong SDK dùng chung.

Các Plugin đi kèm tuân theo cùng quy tắc. `runtime-api.ts` của một Plugin đi kèm không nên re-export facade `openclaw/plugin-sdk/<plugin-id>` mang thương hiệu riêng của nó. Các facade mang thương hiệu đó vẫn là shim tương thích cho Plugin bên ngoài và người dùng cũ, nhưng các Plugin đi kèm nên dùng export cục bộ cùng các subpath SDK chung hẹp như `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, hoặc `openclaw/plugin-sdk/webhook-ingress`. Mã mới không nên thêm facade SDK đặc thù theo plugin-id trừ khi ranh giới tương thích cho một hệ sinh thái bên ngoài hiện có yêu cầu điều đó.

Riêng với bình chọn, có hai đường thực thi:

- `outbound.sendPoll` là baseline dùng chung cho các kênh phù hợp với mô hình bình chọn chung
- `actions.handleAction("poll")` là đường được ưu tiên cho ngữ nghĩa bình chọn đặc thù theo kênh hoặc các tham số bình chọn bổ sung

Lõi hiện hoãn phân tích bình chọn dùng chung cho đến sau khi điều phối bình chọn của Plugin từ chối hành động, để các handler bình chọn do Plugin sở hữu có thể nhận các trường bình chọn đặc thù theo kênh mà không bị bộ phân tích bình chọn chung chặn trước.

Xem [nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals) để biết đầy đủ trình tự khởi động.

## Mô hình sở hữu năng lực

OpenClaw xem một Plugin gốc là ranh giới sở hữu cho một **công ty** hoặc một **tính năng**, không phải một túi chứa các tích hợp không liên quan.

Điều đó có nghĩa là:

- một Plugin công ty thường nên sở hữu toàn bộ các bề mặt hướng tới OpenClaw của công ty đó
- một Plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- các kênh nên dùng các năng lực lõi dùng chung thay vì triển khai lại hành vi nhà cung cấp theo kiểu tùy biến

<AccordionGroup>
  <Accordion title="Nhà cung cấp đa năng lực">
    `openai` sở hữu suy luận văn bản, giọng nói, thoại thời gian thực, hiểu media, và tạo ảnh. `google` sở hữu suy luận văn bản cùng hiểu media, tạo ảnh, và tìm kiếm web. `qwen` sở hữu suy luận văn bản cùng hiểu media và tạo video.
  </Accordion>
  <Accordion title="Nhà cung cấp đơn năng lực">
    `elevenlabs` và `microsoft` sở hữu giọng nói; `firecrawl` sở hữu tìm nạp web; `minimax` / `mistral` / `moonshot` / `zai` sở hữu các backend hiểu media.
  </Accordion>
  <Accordion title="Plugin tính năng">
    `voice-call` sở hữu truyền tải cuộc gọi, công cụ, CLI, route, và cầu nối media-stream Twilio, nhưng dùng các năng lực giọng nói, phiên âm thời gian thực, và thoại thời gian thực dùng chung thay vì import trực tiếp Plugin nhà cung cấp.
  </Accordion>
</AccordionGroup>

Trạng thái đích mong muốn là:

- OpenAI nằm trong một Plugin ngay cả khi nó bao phủ mô hình văn bản, giọng nói, hình ảnh, và video trong tương lai
- một nhà cung cấp khác có thể làm tương tự cho phạm vi bề mặt của chính họ
- các kênh không quan tâm Plugin nhà cung cấp nào sở hữu provider; chúng dùng hợp đồng năng lực dùng chung do lõi hiển thị

Đây là điểm phân biệt chính:

- **Plugin** = ranh giới sở hữu
- **năng lực** = hợp đồng lõi mà nhiều Plugin có thể triển khai hoặc dùng

Vì vậy nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "provider nào nên mã hóa cứng xử lý video?" Câu hỏi đầu tiên là "hợp đồng năng lực video lõi là gì?" Khi hợp đồng đó tồn tại, Plugin nhà cung cấp có thể đăng ký theo nó và Plugin kênh/tính năng có thể dùng nó.

Nếu năng lực đó chưa tồn tại, hướng đi đúng thường là:

<Steps>
  <Step title="Định nghĩa năng lực">
    Định nghĩa năng lực còn thiếu trong lõi.
  </Step>
  <Step title="Hiển thị qua SDK">
    Hiển thị nó qua API/runtime Plugin theo cách có kiểu.
  </Step>
  <Step title="Nối dây bên dùng">
    Nối dây các kênh/tính năng theo năng lực đó.
  </Step>
  <Step title="Triển khai của nhà cung cấp">
    Để Plugin nhà cung cấp đăng ký triển khai.
  </Step>
</Steps>

Điều này giữ quyền sở hữu rõ ràng trong khi tránh hành vi lõi phụ thuộc vào một nhà cung cấp duy nhất hoặc một đường mã đặc thù theo Plugin dùng một lần.

### Phân lớp năng lực

Dùng mô hình tư duy này khi quyết định mã thuộc về đâu:

<Tabs>
  <Tab title="Lớp năng lực lõi">
    Điều phối dùng chung, chính sách, fallback, quy tắc merge cấu hình, ngữ nghĩa phân phối, và hợp đồng có kiểu.
  </Tab>
  <Tab title="Lớp Plugin nhà cung cấp">
    API đặc thù theo nhà cung cấp, xác thực, danh mục mô hình, tổng hợp giọng nói, tạo ảnh, backend video tương lai, endpoint sử dụng.
  </Tab>
  <Tab title="Lớp Plugin kênh/tính năng">
    Tích hợp Slack/Discord/voice-call/v.v. dùng các năng lực lõi và trình bày chúng trên một bề mặt.
  </Tab>
</Tabs>

Ví dụ, TTS đi theo hình dạng này:

- lõi sở hữu chính sách TTS tại thời điểm trả lời, thứ tự fallback, tùy chọn, và phân phối qua kênh
- `openai`, `elevenlabs`, và `microsoft` sở hữu các triển khai tổng hợp
- `voice-call` dùng helper runtime TTS điện thoại

Mẫu tương tự nên được ưu tiên cho các năng lực trong tương lai.

### Ví dụ Plugin công ty đa năng lực

Một Plugin công ty nên tạo cảm giác gắn kết từ bên ngoài. Nếu OpenClaw có các hợp đồng dùng chung cho mô hình, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu media, tạo ảnh, tạo video, tìm nạp web, và tìm kiếm web, một nhà cung cấp có thể sở hữu toàn bộ bề mặt của mình ở một nơi:

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

Điều quan trọng không phải là tên helper chính xác. Hình dạng mới là điều quan trọng:

- một Plugin sở hữu bề mặt nhà cung cấp
- lõi vẫn sở hữu các hợp đồng năng lực
- các kênh và Plugin tính năng dùng helper `api.runtime.*`, không dùng mã nhà cung cấp
- kiểm thử hợp đồng có thể xác nhận rằng Plugin đã đăng ký các năng lực mà nó tuyên bố sở hữu

### Ví dụ năng lực: hiểu video

OpenClaw đã xem hiểu hình ảnh/âm thanh/video là một năng lực dùng chung. Cùng mô hình sở hữu đó áp dụng ở đây:

<Steps>
  <Step title="Lõi định nghĩa hợp đồng">
    Lõi định nghĩa hợp đồng hiểu media.
  </Step>
  <Step title="Plugin nhà cung cấp đăng ký">
    Plugin nhà cung cấp đăng ký `describeImage`, `transcribeAudio`, và `describeVideo` khi phù hợp.
  </Step>
  <Step title="Bên dùng dùng hành vi dùng chung">
    Các kênh và Plugin tính năng dùng hành vi lõi dùng chung thay vì nối dây trực tiếp tới mã nhà cung cấp.
  </Step>
</Steps>

Điều đó tránh nhúng các giả định video của một provider vào lõi. Plugin sở hữu bề mặt nhà cung cấp; lõi sở hữu hợp đồng năng lực và hành vi fallback.

Tạo video đã dùng cùng trình tự đó: lõi sở hữu hợp đồng năng lực có kiểu và helper runtime, còn Plugin nhà cung cấp đăng ký các triển khai `api.registerVideoGenerationProvider(...)` theo nó.

Cần một checklist triển khai cụ thể? Xem [Sổ tay năng lực](/vi/plugins/architecture).

## Hợp đồng và thực thi

Bề mặt API Plugin được cố ý định kiểu và tập trung trong `OpenClawPluginApi`. Hợp đồng đó định nghĩa các điểm đăng ký được hỗ trợ và các helper runtime mà một Plugin có thể dựa vào.

Lý do điều này quan trọng:

- tác giả Plugin có một chuẩn nội bộ ổn định duy nhất
- lõi có thể từ chối quyền sở hữu trùng lặp như hai Plugin đăng ký cùng một id provider
- khởi động có thể hiển thị chẩn đoán có thể hành động cho đăng ký sai định dạng
- kiểm thử hợp đồng có thể thực thi quyền sở hữu Plugin đi kèm và ngăn trôi lệch âm thầm

Có hai lớp thực thi:

<AccordionGroup>
  <Accordion title="Thực thi đăng ký thời gian chạy">
    Sổ đăng ký plugin xác thực các đăng ký khi plugin tải. Ví dụ: id nhà cung cấp trùng lặp, id nhà cung cấp giọng nói trùng lặp và đăng ký sai định dạng sẽ tạo chẩn đoán plugin thay vì hành vi không xác định.
  </Accordion>
  <Accordion title="Kiểm thử hợp đồng">
    Các plugin đi kèm được ghi lại trong sổ đăng ký hợp đồng trong quá trình chạy kiểm thử để OpenClaw có thể khẳng định quyền sở hữu một cách tường minh. Hiện nay, cơ chế này được dùng cho nhà cung cấp mô hình, nhà cung cấp giọng nói, nhà cung cấp tìm kiếm web và quyền sở hữu đăng ký đi kèm.
  </Accordion>
</AccordionGroup>

Hiệu quả thực tế là OpenClaw biết trước plugin nào sở hữu bề mặt nào. Điều đó cho phép lõi và các kênh kết hợp liền mạch vì quyền sở hữu được khai báo, có kiểu và có thể kiểm thử thay vì ngầm định.

### Nội dung thuộc về một hợp đồng

<Tabs>
  <Tab title="Hợp đồng tốt">
    - có kiểu
    - nhỏ gọn
    - dành riêng cho năng lực
    - do lõi sở hữu
    - có thể tái sử dụng bởi nhiều plugin
    - có thể được kênh/tính năng sử dụng mà không cần biết nhà cung cấp

  </Tab>
  <Tab title="Hợp đồng xấu">
    - chính sách dành riêng cho nhà cung cấp bị ẩn trong lõi
    - lối thoát plugin dùng một lần bỏ qua sổ đăng ký
    - mã kênh truy cập thẳng vào phần triển khai của nhà cung cấp
    - đối tượng thời gian chạy tùy biến không thuộc `OpenClawPluginApi` hoặc `api.runtime`

  </Tab>
</Tabs>

Khi chưa chắc chắn, hãy nâng mức trừu tượng: định nghĩa năng lực trước, rồi để plugin cắm vào năng lực đó.

## Mô hình thực thi

Plugin OpenClaw gốc chạy **trong tiến trình** cùng với Gateway. Chúng không được đặt trong sandbox. Một plugin gốc đã tải có cùng ranh giới tin cậy cấp tiến trình như mã lõi.

<Warning>
Hệ quả của plugin gốc: plugin có thể đăng ký công cụ, trình xử lý mạng, hook và dịch vụ; lỗi plugin có thể làm sập hoặc gây mất ổn định gateway; và plugin gốc độc hại tương đương với thực thi mã tùy ý bên trong tiến trình OpenClaw.
</Warning>

Các gói tương thích mặc định an toàn hơn vì OpenClaw hiện coi chúng là gói siêu dữ liệu/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu nghĩa là Skills đi kèm.

Dùng danh sách cho phép và đường dẫn cài đặt/tải tường minh cho các plugin không đi kèm. Hãy coi plugin trong workspace là mã thời gian phát triển, không phải mặc định sản xuất.

Đối với tên gói workspace đi kèm, giữ id plugin neo theo tên npm: mặc định là `@openclaw/<id>`, hoặc một hậu tố có kiểu đã được phê duyệt như `-provider`, `-plugin`, `-speech`, `-sandbox` hoặc `-media-understanding` khi gói chủ ý phơi bày một vai trò plugin hẹp hơn.

<Note>
**Ghi chú tin cậy:** `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc xuất xứ. Một plugin workspace có cùng id với plugin đi kèm sẽ chủ ý che khuất bản đi kèm khi plugin workspace đó được bật/đưa vào danh sách cho phép. Đây là hành vi bình thường và hữu ích cho phát triển cục bộ, kiểm thử bản vá và hotfix. Mức tin cậy plugin đi kèm được phân giải từ snapshot nguồn — manifest và mã trên ổ đĩa tại thời điểm tải — thay vì từ siêu dữ liệu cài đặt. Một bản ghi cài đặt bị hỏng hoặc bị thay thế không thể âm thầm mở rộng bề mặt tin cậy của plugin đi kèm vượt quá những gì nguồn thực tế tuyên bố.
</Note>

## Ranh giới xuất

OpenClaw xuất các năng lực, không phải tiện ích triển khai.

Giữ đăng ký năng lực ở dạng công khai. Lược bỏ các export trợ giúp không thuộc hợp đồng:

- đường dẫn con trợ giúp dành riêng cho plugin đi kèm
- đường dẫn con hệ thống thời gian chạy không được chủ định làm API công khai
- trợ giúp tiện ích dành riêng cho nhà cung cấp
- trợ giúp thiết lập/onboarding là chi tiết triển khai

Các đường dẫn con trợ giúp dành riêng cho plugin đi kèm đã được dành riêng nay đã bị loại khỏi bản đồ export SDK được tạo. Giữ các trợ giúp dành riêng cho chủ sở hữu bên trong gói plugin sở hữu; chỉ nâng cấp hành vi host có thể tái sử dụng thành hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.

## Nội bộ và tham khảo

Đối với pipeline tải, mô hình sổ đăng ký, hook thời gian chạy nhà cung cấp, tuyến HTTP Gateway, schema công cụ tin nhắn, phân giải mục tiêu kênh, catalog nhà cung cấp, plugin công cụ ngữ cảnh và hướng dẫn thêm năng lực mới, xem [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Manifest Plugin](/vi/plugins/manifest)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
