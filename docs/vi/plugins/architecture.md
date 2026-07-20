---
read_when:
    - Xây dựng hoặc gỡ lỗi các plugin OpenClaw native
    - Tìm hiểu mô hình khả năng của plugin hoặc ranh giới quyền sở hữu
    - Làm việc với pipeline tải Plugin hoặc registry
    - Triển khai các hook runtime của nhà cung cấp hoặc các plugin kênh
sidebarTitle: Internals
summary: 'Nội bộ Plugin: mô hình khả năng, quyền sở hữu, hợp đồng, pipeline tải và các trình trợ giúp runtime'
title: Nội bộ Plugin
x-i18n:
    generated_at: "2026-07-20T04:43:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28910ea251a40dd0840726f9f6f6aa65d3bf33b385b0cc61748f14b5ce4c0ee9
    source_path: plugins/architecture.md
    workflow: 16
---

Đây là **tài liệu tham khảo kiến trúc chuyên sâu** cho hệ thống plugin của OpenClaw. Để xem hướng dẫn thực hành, hãy bắt đầu với một trong các trang chuyên biệt dưới đây.

<CardGroup cols={2}>
  <Card title="Cài đặt và sử dụng plugin" icon="plug" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách thêm, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Xây dựng plugin" icon="rocket" href="/vi/plugins/building-plugins">
    Hướng dẫn tạo plugin đầu tiên với manifest hoạt động tối giản.
  </Card>
  <Card title="Plugin kênh" icon="comments" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="microchip" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình.
  </Card>
  <Card title="Tổng quan về SDK" icon="book" href="/vi/plugins/sdk-overview">
    Tài liệu tham khảo về sơ đồ nhập và API đăng ký.
  </Card>
</CardGroup>

## Mô hình năng lực công khai

Năng lực là mô hình **plugin gốc** công khai bên trong OpenClaw. Mỗi plugin OpenClaw gốc đăng ký với một hoặc nhiều loại năng lực:

| Năng lực               | Phương thức đăng ký                              | Plugin ví dụ                    |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| Suy luận văn bản       | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | `anthropic`, `openai`          |
| Nhúng                  | `api.registerEmbeddingProvider(...)`             | Plugin vectơ do nhà cung cấp sở hữu |
| Giọng nói              | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Giọng nói thời gian thực | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| Hiểu nội dung đa phương tiện | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`             |
| Nguồn bản phiên âm     | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| Tạo hình ảnh           | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| Tải nội dung web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| Khám phá Gateway       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
Plugin đăng ký không năng lực nào nhưng cung cấp hook, công cụ, dịch vụ khám phá hoặc dịch vụ nền là plugin **chỉ dùng hook kiểu cũ**. Mẫu này vẫn được hỗ trợ đầy đủ.
</Note>

### Quan điểm về khả năng tương thích bên ngoài

Mô hình năng lực đã được tích hợp vào lõi và hiện được các plugin đi kèm/gốc sử dụng, nhưng khả năng tương thích với plugin bên ngoài vẫn cần tiêu chuẩn chặt chẽ hơn so với quan niệm “đã được xuất thì tức là đã bất biến”.

| Tình huống plugin                                  | Hướng dẫn                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin bên ngoài hiện có                         | Duy trì hoạt động của các tích hợp dựa trên hook; đây là cơ sở tương thích.                        |
| Plugin đi kèm/gốc mới                            | Ưu tiên đăng ký năng lực rõ ràng thay vì truy cập sâu dành riêng cho nhà cung cấp hoặc thiết kế mới chỉ dùng hook. |
| Plugin bên ngoài áp dụng đăng ký năng lực | Được phép, nhưng hãy xem các bề mặt trợ giúp dành riêng cho năng lực là đang phát triển, trừ khi tài liệu đánh dấu chúng là ổn định. |

Đăng ký năng lực là hướng phát triển dự kiến. Trong giai đoạn chuyển đổi, các hook kiểu cũ vẫn là con đường an toàn nhất để plugin bên ngoài không gặp thay đổi gây lỗi. Không phải mọi đường dẫn con của trình trợ giúp đã xuất đều như nhau — hãy ưu tiên các hợp đồng hẹp đã được ghi lại trong tài liệu thay vì các phần xuất trợ giúp ngẫu nhiên.

### Dạng plugin

OpenClaw phân loại mỗi plugin đã tải thành một dạng dựa trên hành vi đăng ký thực tế của plugin đó (không chỉ dựa trên siêu dữ liệu tĩnh):

<AccordionGroup>
  <Accordion title="plain-capability">
    Đăng ký đúng một loại năng lực (ví dụ: plugin chỉ dành cho nhà cung cấp như `arcee` hoặc `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Đăng ký nhiều loại năng lực (ví dụ: `openai` sở hữu suy luận văn bản, giọng nói, hiểu nội dung đa phương tiện và tạo hình ảnh).
  </Accordion>
  <Accordion title="hook-only">
    Chỉ đăng ký hook (có kiểu hoặc tùy chỉnh), không đăng ký năng lực, công cụ, lệnh hoặc dịch vụ.
  </Accordion>
  <Accordion title="non-capability">
    Đăng ký công cụ, lệnh, dịch vụ hoặc tuyến nhưng không đăng ký năng lực.
  </Accordion>
</AccordionGroup>

Sử dụng `openclaw plugins inspect <id>` để xem dạng và phân tích năng lực của plugin. Xem [tài liệu tham khảo CLI](/vi/cli/plugins#inspect) để biết chi tiết.

### Tín hiệu tương thích

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` và `openclaw plugins doctor` hiển thị các thông báo tương thích sau:

| Tín hiệu                                     | Ý nghĩa                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **cấu hình hợp lệ**                           | Cấu hình được phân tích thành công và các plugin được phân giải                                                                        |
| **chỉ dùng hook** (thông tin)                       | Plugin chỉ đăng ký hook; đây là đường dẫn được hỗ trợ nhưng chưa được di chuyển sang đăng ký năng lực                |
| **API nhúng bộ nhớ đã lỗi thời** (cảnh báo) | Plugin không đi kèm sử dụng API nhà cung cấp nhúng dành riêng cho bộ nhớ cũ thay vì `registerEmbeddingProvider` |
| **lỗi nghiêm trọng**                             | Cấu hình không hợp lệ hoặc không thể tải plugin                                                                    |

Hiện tại, không tín hiệu tư vấn/cảnh báo nào làm hỏng plugin của bạn. Các tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống plugin của OpenClaw có bốn lớp:

<Steps>
  <Step title="Manifest + khám phá">
    OpenClaw tìm các plugin ứng viên từ những đường dẫn đã cấu hình, thư mục gốc của không gian làm việc, thư mục gốc plugin toàn cục và các plugin đi kèm. Quá trình khám phá đọc trước các manifest `openclaw.plugin.json` gốc cùng với các manifest gói được hỗ trợ.
  </Step>
  <Step title="Bật + xác thực">
    Lõi quyết định xem plugin đã khám phá được bật, tắt, chặn hay được chọn cho một vị trí độc quyền như bộ nhớ.
  </Step>
  <Step title="Tải lúc chạy">
    Các plugin OpenClaw gốc được tải trong tiến trình và đăng ký năng lực vào một sổ đăng ký trung tâm. JavaScript đã đóng gói được tải thông qua `require` gốc; mã nguồn TypeScript cục bộ của bên thứ ba sử dụng phương án dự phòng Jiti khẩn cấp. Các gói tương thích được chuẩn hóa thành bản ghi sổ đăng ký mà không nhập mã lúc chạy.
  </Step>
  <Step title="Tiêu thụ bề mặt">
    Phần còn lại của OpenClaw đọc sổ đăng ký để cung cấp công cụ, kênh, thiết lập nhà cung cấp, hook, tuyến HTTP, lệnh CLI và dịch vụ.
  </Step>
</Steps>

Riêng đối với CLI của plugin, việc khám phá lệnh gốc được chia thành hai giai đoạn:

- siêu dữ liệu tại thời điểm phân tích đến từ `registerCli(..., { descriptors: [...] })`
- mô-đun CLI thực của plugin có thể tiếp tục được tải trì hoãn và đăng ký khi được gọi lần đầu

Cách này giữ mã CLI thuộc sở hữu của plugin bên trong plugin, đồng thời vẫn cho phép OpenClaw dành riêng tên lệnh gốc trước khi phân tích.

Ranh giới thiết kế quan trọng:

- việc xác thực manifest/cấu hình phải hoạt động từ **siêu dữ liệu manifest/lược đồ** mà không thực thi mã plugin
- quá trình khám phá năng lực gốc có thể tải mã điểm vào của plugin đáng tin cậy để xây dựng ảnh chụp nhanh sổ đăng ký không kích hoạt
- hành vi lúc chạy gốc đến từ đường dẫn `register(api)` của mô-đun plugin với `api.registrationMode === "full"`

Sự phân tách đó cho phép OpenClaw xác thực cấu hình, giải thích các plugin bị thiếu/bị tắt và xây dựng gợi ý giao diện người dùng/lược đồ trước khi toàn bộ môi trường lúc chạy hoạt động.

### Ảnh chụp nhanh siêu dữ liệu plugin và bảng tra cứu

Khi khởi động, Gateway xây dựng một `PluginMetadataSnapshot` cho ảnh chụp nhanh cấu hình hiện tại. Ảnh chụp nhanh này chỉ chứa siêu dữ liệu: nó lưu chỉ mục plugin đã cài đặt, sổ đăng ký manifest, chẩn đoán manifest, ánh xạ chủ sở hữu, bộ chuẩn hóa mã định danh plugin và các bản ghi manifest. Nó không chứa mô-đun plugin đã tải, SDK nhà cung cấp, nội dung gói hoặc phần xuất lúc chạy.

Quá trình xác thực cấu hình có nhận biết plugin, tự động bật khi khởi động và khởi tạo plugin của Gateway sử dụng ảnh chụp nhanh đó thay vì tự xây dựng lại siêu dữ liệu manifest/chỉ mục một cách độc lập. `PluginLookUpTable` được dẫn xuất từ cùng ảnh chụp nhanh và bổ sung kế hoạch plugin khởi động cho cấu hình lúc chạy hiện tại.

Sau khi khởi động, Gateway giữ ảnh chụp nhanh siêu dữ liệu hiện tại như một sản phẩm lúc chạy có thể thay thế. Quá trình khám phá nhà cung cấp lặp lại trong lúc chạy có thể mượn ảnh chụp nhanh đó thay vì tái tạo chỉ mục đã cài đặt và sổ đăng ký manifest cho mỗi lượt duyệt danh mục nhà cung cấp. Ảnh chụp nhanh được xóa hoặc thay thế khi Gateway tắt, khi cấu hình/kho plugin thay đổi và khi ghi chỉ mục đã cài đặt; các bên gọi quay lại đường dẫn manifest/chỉ mục nguội khi không có ảnh chụp nhanh hiện tại tương thích. Việc kiểm tra khả năng tương thích phải bao gồm các thư mục gốc khám phá plugin như `plugins.load.paths` và không gian làm việc mặc định của tác tử, vì plugin không gian làm việc thuộc phạm vi siêu dữ liệu.

Ảnh chụp nhanh và bảng tra cứu giữ các quyết định khởi động lặp lại trên đường dẫn nhanh:

- quyền sở hữu kênh
- khởi động kênh trì hoãn
- mã định danh plugin khởi động
- quyền sở hữu nhà cung cấp và backend CLI
- quyền sở hữu nhà cung cấp thiết lập, bí danh lệnh, nhà cung cấp danh mục mô hình và hợp đồng manifest
- xác thực lược đồ cấu hình plugin và lược đồ cấu hình kênh
- quyết định tự động bật khi khởi động

Ranh giới an toàn là thay thế ảnh chụp nhanh, không phải sửa đổi ảnh chụp nhanh. Hãy xây dựng lại ảnh chụp nhanh khi cấu hình, kho plugin, bản ghi cài đặt hoặc chính sách chỉ mục được lưu bền vững thay đổi. Không xem nó như một sổ đăng ký toàn cục có thể sửa đổi trên diện rộng và không lưu giữ số lượng ảnh chụp nhanh lịch sử không giới hạn. Việc tải plugin lúc chạy vẫn tách biệt với ảnh chụp nhanh siêu dữ liệu để trạng thái lúc chạy cũ không thể bị che giấu sau bộ nhớ đệm siêu dữ liệu.

Quy tắc bộ nhớ đệm được ghi lại trong [Nội bộ kiến trúc plugin](/vi/plugins/architecture-internals#plugin-cache-boundary): siêu dữ liệu manifest và khám phá luôn mới, trừ khi bên gọi giữ một ảnh chụp nhanh, bảng tra cứu hoặc sổ đăng ký manifest rõ ràng cho luồng hiện tại. Bộ nhớ đệm siêu dữ liệu ẩn và TTL theo đồng hồ thực không thuộc quá trình tải plugin. Chỉ bộ nhớ đệm của trình tải lúc chạy, mô-đun và hiện vật phụ thuộc mới có thể tồn tại sau khi mã hoặc hiện vật đã cài đặt thực sự được tải.

Một số bên gọi trên đường dẫn nguội vẫn tái tạo trực tiếp sổ đăng ký manifest từ chỉ mục plugin đã cài đặt được lưu bền vững thay vì nhận `PluginLookUpTable` của Gateway. Đường dẫn đó hiện tái tạo sổ đăng ký theo yêu cầu; hãy ưu tiên truyền bảng tra cứu hiện tại hoặc một sổ đăng ký manifest rõ ràng qua các luồng lúc chạy khi bên gọi đã có sẵn.

### Lập kế hoạch kích hoạt

Lập kế hoạch kích hoạt là một phần của mặt phẳng điều khiển. Bên gọi có thể yêu cầu xác định plugin nào liên quan đến một lệnh, nhà cung cấp, kênh, tuyến, bộ khung tác tử hoặc năng lực cụ thể trước khi tải các sổ đăng ký lúc chạy rộng hơn.

Trình lập kế hoạch duy trì khả năng tương thích với hành vi manifest hiện tại:

- `activation.*` là các gợi ý rõ ràng cho trình lập kế hoạch
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và các hook vẫn là phương án dự phòng theo quyền sở hữu của manifest
- API trình lập kế hoạch chỉ dùng id vẫn khả dụng cho các bên gọi hiện có
- API kế hoạch báo cáo các nhãn lý do để chẩn đoán có thể phân biệt gợi ý rõ ràng với phương án dự phòng theo quyền sở hữu

<Warning>
Không coi `activation` là hook vòng đời hoặc phương án thay thế cho `register(...)`. Đây là siêu dữ liệu dùng để thu hẹp phạm vi tải. Ưu tiên các trường quyền sở hữu khi chúng đã mô tả mối quan hệ; chỉ dùng `activation` cho các gợi ý bổ sung dành cho trình lập kế hoạch.
</Warning>

### Plugin kênh và công cụ tin nhắn dùng chung

Các Plugin kênh không cần đăng ký công cụ gửi/chỉnh sửa/bày tỏ cảm xúc riêng cho các thao tác trò chuyện thông thường. OpenClaw duy trì một công cụ `message` dùng chung trong lõi, còn các Plugin kênh sở hữu việc khám phá và thực thi dành riêng cho từng kênh phía sau công cụ đó.

Ranh giới hiện tại là:

- lõi sở hữu máy chủ công cụ `message` dùng chung, kết nối prompt, quản lý sổ sách phiên/luồng và điều phối thực thi
- các Plugin kênh sở hữu việc khám phá thao tác theo phạm vi, khám phá khả năng và mọi phân đoạn schema dành riêng cho kênh
- các Plugin kênh sở hữu ngữ pháp hội thoại phiên dành riêng cho nhà cung cấp, chẳng hạn cách id hội thoại mã hóa id luồng hoặc kế thừa từ hội thoại cha
- các Plugin kênh thực thi thao tác cuối cùng thông qua adapter thao tác của chúng

Đối với các Plugin kênh, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Lệnh khám phá hợp nhất đó cho phép một Plugin trả về đồng thời các thao tác hiển thị, khả năng và phần đóng góp schema để các phần này không bị lệch nhau.

Tên thao tác tin nhắn sử dụng một tập từ vựng đóng có chủ ý do lõi sở hữu để mọi phương thức vận chuyển đều có thể hiển thị mọi thao tác. Plugin bổ sung tên thao tác thông qua PR vào lõi; việc đăng ký khi chạy được chủ ý không hỗ trợ.

Khi một tham số công cụ tin nhắn dành riêng cho kênh mang nguồn phương tiện như đường dẫn cục bộ hoặc URL phương tiện từ xa, Plugin cũng nên trả về `mediaSourceParams` từ `describeMessageTool(...)`. Lõi sử dụng danh sách rõ ràng đó để áp dụng việc chuẩn hóa đường dẫn sandbox và các gợi ý truy cập phương tiện gửi đi mà không mã hóa cứng tên tham số thuộc quyền sở hữu của Plugin. Ở đó, nên ưu tiên các ánh xạ theo phạm vi thao tác thay vì một danh sách phẳng áp dụng cho toàn kênh, để một tham số phương tiện chỉ dành cho hồ sơ không bị chuẩn hóa trên các thao tác không liên quan như `send`.

Lõi truyền phạm vi khi chạy vào bước khám phá đó. Các trường quan trọng bao gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` đầu vào đáng tin cậy

Điều đó quan trọng đối với các Plugin nhạy theo ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị các thao tác tin nhắn dựa trên tài khoản đang hoạt động, phòng/luồng/tin nhắn hiện tại hoặc danh tính bên yêu cầu đáng tin cậy mà không cần mã hóa cứng các nhánh dành riêng cho kênh trong công cụ `message` của lõi.

Đây là lý do các thay đổi định tuyến trình chạy nhúng vẫn là công việc của Plugin: trình chạy chịu trách nhiệm chuyển tiếp danh tính trò chuyện/phiên hiện tại vào ranh giới khám phá của Plugin để công cụ `message` dùng chung hiển thị đúng bề mặt thuộc quyền sở hữu của kênh cho lượt hiện tại.

Đối với các trình trợ giúp thực thi thuộc quyền sở hữu của kênh, các Plugin đóng gói sẵn nên giữ môi trường thực thi bên trong các mô-đun Plugin của riêng mình. Lõi không còn sở hữu môi trường chạy thao tác tin nhắn của Discord, Slack, Telegram hoặc WhatsApp trong `src/agents/tools`. Chúng tôi không phát hành các đường dẫn con `plugin-sdk/*-action-runtime` riêng biệt và các Plugin đóng gói sẵn nên nhập trực tiếp mã môi trường chạy cục bộ của mình từ các mô-đun thuộc quyền sở hữu của Plugin.

Ranh giới tương tự áp dụng cho các điểm nối SDK mang tên nhà cung cấp nói chung: lõi không nên nhập các barrel tiện ích dành riêng cho kênh của Discord, Signal, Slack, WhatsApp hoặc các Plugin tương tự. Nếu lõi cần một hành vi, hãy sử dụng barrel `api.ts` / `runtime-api.ts` của chính Plugin đóng gói sẵn hoặc nâng nhu cầu đó thành một khả năng tổng quát hẹp trong SDK dùng chung.

Các Plugin đóng gói sẵn tuân theo cùng quy tắc. `runtime-api.ts` của một Plugin đóng gói sẵn không nên tái xuất facade `openclaw/plugin-sdk/<plugin-id>` mang thương hiệu riêng của nó. Các facade mang thương hiệu đó vẫn là shim tương thích cho Plugin bên ngoài và bên sử dụng cũ, nhưng các Plugin đóng gói sẵn nên dùng các mục xuất cục bộ cùng các đường dẫn con SDK tổng quát hẹp như `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` hoặc `openclaw/plugin-sdk/webhook-ingress`. Mã mới không nên thêm facade SDK dành riêng cho id Plugin trừ khi ranh giới tương thích của một hệ sinh thái bên ngoài hiện có yêu cầu điều đó.

Riêng đối với cuộc thăm dò ý kiến, có hai đường thực thi:

- `outbound.sendPoll` là đường cơ sở dùng chung cho các kênh phù hợp với mô hình thăm dò ý kiến chung
- `actions.handleAction("poll")` là đường ưu tiên cho ngữ nghĩa thăm dò ý kiến dành riêng cho kênh hoặc các tham số thăm dò bổ sung

Giờ đây, lõi trì hoãn việc phân tích cú pháp thăm dò ý kiến dùng chung cho đến sau khi quá trình điều phối thăm dò của Plugin từ chối thao tác, nhờ đó các trình xử lý thăm dò thuộc quyền sở hữu của Plugin có thể chấp nhận các trường thăm dò dành riêng cho kênh mà không bị trình phân tích cú pháp thăm dò chung chặn trước.

Xem [Chi tiết nội bộ về kiến trúc Plugin](/vi/plugins/architecture-internals) để biết toàn bộ trình tự khởi động.

## Mô hình quyền sở hữu khả năng

OpenClaw coi một Plugin gốc là ranh giới quyền sở hữu cho một **công ty** hoặc một **tính năng**, chứ không phải một tập hợp tùy tiện các tích hợp không liên quan.

Điều đó có nghĩa là:

- một Plugin công ty thường nên sở hữu tất cả các bề mặt hướng đến OpenClaw của công ty đó
- một Plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- các kênh nên sử dụng các khả năng lõi dùng chung thay vì tự phát triển lại hành vi của nhà cung cấp theo cách riêng lẻ

<AccordionGroup>
  <Accordion title="Nhà cung cấp đa khả năng">
    `google` sở hữu suy luận văn bản, backend CLI, embedding, giọng nói, thoại thời gian thực, hiểu phương tiện, tạo hình ảnh/nhạc/video và tìm kiếm web. `openai` sở hữu suy luận văn bản, embedding, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo hình ảnh/video. `minimax` sở hữu suy luận văn bản cùng với hiểu phương tiện, giọng nói, tạo hình ảnh/nhạc/video và tìm kiếm web.
  </Accordion>
  <Accordion title="Nhà cung cấp đơn khả năng">
    `arcee` và `chutes` chỉ sở hữu suy luận văn bản; `microsoft` chỉ sở hữu giọng nói. Một Plugin nhà cung cấp có thể duy trì phạm vi hẹp như vậy cho đến khi cần bao phủ thêm bề mặt của nhà cung cấp đó.
  </Accordion>
  <Accordion title="Plugin tính năng">
    `voice-call` sở hữu phương thức vận chuyển cuộc gọi, công cụ, CLI, tuyến và cầu nối luồng phương tiện Twilio, nhưng sử dụng các khả năng giọng nói, phiên âm thời gian thực và thoại thời gian thực dùng chung thay vì nhập trực tiếp các Plugin nhà cung cấp.
  </Accordion>
</AccordionGroup>

Trạng thái đích mong muốn là:

- bề mặt hướng đến OpenClaw của một nhà cung cấp nằm trong một Plugin ngay cả khi trải rộng trên mô hình văn bản, giọng nói, hình ảnh và video
- các nhà cung cấp khác có thể làm tương tự cho phạm vi bề mặt của riêng họ
- các kênh không quan tâm Plugin nhà cung cấp nào sở hữu nhà cung cấp; chúng sử dụng hợp đồng khả năng dùng chung do lõi cung cấp

Đây là điểm khác biệt then chốt:

- **Plugin** = ranh giới quyền sở hữu
- **khả năng** = hợp đồng lõi mà nhiều Plugin có thể triển khai hoặc sử dụng

Vì vậy, nếu OpenClaw bổ sung một miền mới như video, câu hỏi đầu tiên không phải là "nhà cung cấp nào nên mã hóa cứng việc xử lý video?" Câu hỏi đầu tiên là "hợp đồng khả năng video của lõi là gì?" Khi hợp đồng đó tồn tại, các Plugin nhà cung cấp có thể đăng ký với nó và các Plugin kênh/tính năng có thể sử dụng nó.

Nếu khả năng đó chưa tồn tại, hướng xử lý phù hợp thường là:

<Steps>
  <Step title="Xác định khả năng">
    Xác định khả năng còn thiếu trong lõi.
  </Step>
  <Step title="Cung cấp qua SDK">
    Cung cấp khả năng đó qua API/môi trường chạy của Plugin theo cách có kiểu.
  </Step>
  <Step title="Kết nối các bên sử dụng">
    Kết nối các kênh/tính năng với khả năng đó.
  </Step>
  <Step title="Các triển khai của nhà cung cấp">
    Cho phép các Plugin nhà cung cấp đăng ký triển khai.
  </Step>
</Steps>

Điều này giữ quyền sở hữu rõ ràng đồng thời tránh hành vi lõi phụ thuộc vào một nhà cung cấp duy nhất hoặc một đường mã dành riêng cho Plugin chỉ dùng một lần.

### Phân lớp khả năng

Sử dụng mô hình tư duy này khi quyết định mã thuộc về đâu:

<Tabs>
  <Tab title="Lớp khả năng lõi">
    Điều phối, chính sách, phương án dự phòng, quy tắc hợp nhất cấu hình, ngữ nghĩa phân phối và hợp đồng có kiểu dùng chung.
  </Tab>
  <Tab title="Lớp Plugin nhà cung cấp">
    API, xác thực, danh mục mô hình, tổng hợp giọng nói, tạo hình ảnh, backend video và điểm cuối sử dụng dành riêng cho nhà cung cấp.
  </Tab>
  <Tab title="Lớp Plugin kênh/tính năng">
    Tích hợp Discord/Slack/cuộc gọi thoại/v.v. sử dụng các khả năng lõi và trình bày chúng trên một bề mặt.
  </Tab>
</Tabs>

Ví dụ, TTS tuân theo cấu trúc này:

- lõi sở hữu chính sách TTS tại thời điểm trả lời, thứ tự dự phòng, tùy chọn và phân phối qua kênh
- `elevenlabs`, `google`, `microsoft` và `openai` sở hữu các triển khai tổng hợp
- `voice-call` sử dụng trình trợ giúp môi trường chạy TTS điện thoại

Nên ưu tiên cùng mẫu này cho các khả năng trong tương lai.

### Ví dụ Plugin công ty đa khả năng

Một Plugin công ty nên tạo cảm giác nhất quán khi nhìn từ bên ngoài. Nếu OpenClaw có các hợp đồng dùng chung cho mô hình, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video, truy xuất web và tìm kiếm web, một nhà cung cấp có thể sở hữu tất cả các bề mặt của mình tại một nơi:

```ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { exampleAiMedia } from "./exampleai-media.js";

export default definePluginEntry({
  id: "exampleai",
  name: "ExampleAI",
  description: "Các mô hình và khả năng phương tiện của ExampleAI.",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // các hook xác thực/danh mục mô hình/môi trường chạy
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // cấu hình giọng nói của nhà cung cấp — triển khai trực tiếp giao diện SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      describeImage: (req) => exampleAiMedia.describeImage(req),
      transcribeAudio: (req) => exampleAiMedia.transcribeAudio(req),
      describeVideo: (req) => exampleAiMedia.describeVideo(req),
    });

    api.registerWebSearchProvider({
      id: "exampleai-search",
      createTool() {
        // Trả về công cụ tìm kiếm web thuộc quyền sở hữu của nhà cung cấp.
      },
    });
  },
});
```

Điều quan trọng không phải là tên chính xác của các trình trợ giúp. Cấu trúc mới là điều quan trọng:

- một Plugin sở hữu bề mặt nhà cung cấp
- lõi vẫn sở hữu các hợp đồng khả năng
- việc chuyển đổi yêu cầu nhà cung cấp và các trình trợ giúp HTTP vẫn nằm trong Plugin nhà cung cấp
- các kênh và Plugin tính năng sử dụng trình trợ giúp `api.runtime.*`, không sử dụng mã nhà cung cấp
- các kiểm thử hợp đồng có thể xác nhận rằng Plugin đã đăng ký những khả năng mà nó tuyên bố sở hữu

### Ví dụ khả năng: hiểu video

OpenClaw đã coi việc hiểu hình ảnh/âm thanh/video là một khả năng dùng chung. Mô hình quyền sở hữu tương tự cũng áp dụng tại đây:

<Steps>
  <Step title="Lõi xác định hợp đồng">
    Lõi xác định hợp đồng hiểu phương tiện.
  </Step>
  <Step title="Plugin nhà cung cấp đăng ký">
    Các Plugin nhà cung cấp đăng ký `describeImage`, `transcribeAudio` và `describeVideo` khi phù hợp.
  </Step>
  <Step title="Các bên sử dụng dùng hành vi chung">
    Các kênh và Plugin tính năng sử dụng hành vi lõi dùng chung thay vì kết nối trực tiếp với mã nhà cung cấp.
  </Step>
</Steps>

Điều đó tránh nhúng các giả định về video của một nhà cung cấp vào lõi. Plugin sở hữu bề mặt nhà cung cấp; lõi sở hữu hợp đồng khả năng và hành vi dự phòng.

Việc tạo video đã sử dụng chính trình tự đó: core sở hữu hợp đồng khả năng có kiểu và trình trợ giúp runtime, còn các plugin của nhà cung cấp đăng ký các triển khai `api.registerVideoGenerationProvider(...)` theo hợp đồng này.

Cần một danh sách kiểm tra triển khai cụ thể? Xem [Sổ tay khả năng](/vi/plugins/adding-capabilities).

## Hợp đồng và thực thi

Bề mặt API plugin được thiết kế có chủ đích để có kiểu và được tập trung trong `OpenClawPluginApi`. Hợp đồng đó xác định các điểm đăng ký được hỗ trợ và các trình trợ giúp runtime mà plugin có thể dựa vào.

Tầm quan trọng của điều này:

- tác giả plugin có một tiêu chuẩn nội bộ ổn định duy nhất
- core có thể từ chối quyền sở hữu trùng lặp, chẳng hạn như hai plugin đăng ký cùng một id nhà cung cấp
- quá trình khởi động có thể hiển thị thông tin chẩn đoán hữu ích cho đăng ký không đúng định dạng
- các kiểm thử hợp đồng có thể thực thi quyền sở hữu của plugin đi kèm và ngăn sai lệch âm thầm

Có hai lớp thực thi:

<AccordionGroup>
  <Accordion title="Thực thi đăng ký trong runtime">
    Sổ đăng ký plugin xác thực các đăng ký khi plugin tải. Ví dụ: id nhà cung cấp trùng lặp, id nhà cung cấp giọng nói trùng lặp và đăng ký không đúng định dạng sẽ tạo thông tin chẩn đoán plugin thay vì hành vi không xác định.
  </Accordion>
  <Accordion title="Kiểm thử hợp đồng">
    Các plugin đi kèm được ghi nhận trong sổ đăng ký hợp đồng khi chạy kiểm thử để OpenClaw có thể xác nhận quyền sở hữu một cách tường minh. Hiện nay, cơ chế này được dùng cho nhà cung cấp mô hình, nhà cung cấp giọng nói, nhà cung cấp tìm kiếm web và quyền sở hữu đăng ký đi kèm.
  </Accordion>
</AccordionGroup>

Hiệu quả thực tế là OpenClaw biết ngay từ đầu plugin nào sở hữu bề mặt nào. Điều đó cho phép core và các kênh kết hợp liền mạch vì quyền sở hữu được khai báo, có kiểu và có thể kiểm thử thay vì chỉ được ngầm hiểu.

### Nội dung phù hợp với hợp đồng

<Tabs>
  <Tab title="Hợp đồng tốt">
    - có kiểu
    - nhỏ gọn
    - dành riêng cho khả năng
    - do core sở hữu
    - có thể được nhiều plugin tái sử dụng
    - các kênh/tính năng có thể sử dụng mà không cần biết về nhà cung cấp

  </Tab>
  <Tab title="Hợp đồng không tốt">
    - chính sách dành riêng cho nhà cung cấp bị ẩn trong core
    - các lối thoát plugin dùng một lần bỏ qua sổ đăng ký
    - mã kênh truy cập trực tiếp vào triển khai của nhà cung cấp
    - các đối tượng runtime tùy biến không thuộc `OpenClawPluginApi` hoặc `api.runtime`

  </Tab>
</Tabs>

Khi không chắc chắn, hãy nâng mức trừu tượng: xác định khả năng trước, sau đó để các plugin tích hợp vào đó.

## Mô hình thực thi

Các plugin OpenClaw gốc chạy **trong cùng tiến trình** với Gateway. Chúng không được đặt trong sandbox. Plugin gốc đã tải có cùng ranh giới tin cậy ở cấp tiến trình như mã core.

<Warning>
Hệ quả của plugin gốc: plugin có thể đăng ký công cụ, trình xử lý mạng, hook và dịch vụ; lỗi plugin có thể làm Gateway gặp sự cố hoặc mất ổn định; và plugin gốc độc hại tương đương với việc thực thi mã tùy ý bên trong tiến trình OpenClaw.
</Warning>

Các gói tương thích mặc định an toàn hơn vì OpenClaw hiện coi chúng là các gói siêu dữ liệu/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là Skills đi kèm.

Sử dụng danh sách cho phép và đường dẫn cài đặt/tải tường minh cho các plugin không đi kèm. Coi plugin trong workspace là mã dùng trong quá trình phát triển, không phải giá trị mặc định cho môi trường sản xuất.

Đối với tên gói workspace đi kèm, giữ id plugin gắn với tên npm: mặc định là `@openclaw/<id>`, hoặc một hậu tố có kiểu đã được phê duyệt như `-provider`, `-plugin`, `-speech`, `-sandbox` hoặc `-media-understanding` khi gói chủ đích cung cấp một vai trò plugin hẹp hơn.

<Note>
**Lưu ý về độ tin cậy:** `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc xuất xứ. Plugin trong workspace có cùng id với plugin đi kèm sẽ chủ đích thay thế bản đi kèm khi plugin trong workspace đó được bật/đưa vào danh sách cho phép. Đây là hành vi bình thường và hữu ích cho phát triển cục bộ, kiểm thử bản vá và sửa lỗi khẩn cấp. Độ tin cậy của plugin đi kèm được xác định từ ảnh chụp nhanh mã nguồn — manifest và mã trên ổ đĩa tại thời điểm tải — thay vì từ siêu dữ liệu cài đặt. Bản ghi cài đặt bị hỏng hoặc bị thay thế không thể âm thầm mở rộng bề mặt tin cậy của plugin đi kèm vượt quá những gì mã nguồn thực tế khai báo.
</Note>

## Ranh giới xuất

OpenClaw xuất các khả năng, không xuất những tiện ích triển khai.

Giữ việc đăng ký khả năng ở trạng thái công khai. Loại bỏ các phần xuất trình trợ giúp không thuộc hợp đồng:

- các đường dẫn con của trình trợ giúp dành riêng cho plugin đi kèm
- các đường dẫn con của hệ thống kết nối runtime không dành làm API công khai
- các trình trợ giúp tiện ích dành riêng cho nhà cung cấp
- các trình trợ giúp thiết lập/giới thiệu ban đầu là chi tiết triển khai

Các đường dẫn con dành riêng cho trình trợ giúp plugin đi kèm đã bị loại bỏ khỏi bản đồ xuất SDK được tạo. Giữ các trình trợ giúp dành riêng cho chủ sở hữu bên trong gói plugin sở hữu chúng; chỉ nâng hành vi máy chủ có thể tái sử dụng thành các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và các khả năng API plugin được chèn.

## Nội bộ và tài liệu tham khảo

Để tìm hiểu pipeline tải, mô hình sổ đăng ký, hook runtime của nhà cung cấp, tuyến HTTP của Gateway, lược đồ công cụ tin nhắn, phân giải đích kênh, danh mục nhà cung cấp, plugin công cụ ngữ cảnh và hướng dẫn thêm khả năng mới, hãy xem [Kiến trúc nội bộ của plugin](/vi/plugins/architecture-internals).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Manifest plugin](/vi/plugins/manifest)
- [Thiết lập SDK plugin](/vi/plugins/sdk-setup)
