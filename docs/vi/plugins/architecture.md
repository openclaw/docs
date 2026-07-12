---
read_when:
    - Xây dựng hoặc gỡ lỗi các plugin OpenClaw gốc
    - Tìm hiểu mô hình khả năng của plugin hoặc ranh giới quyền sở hữu
    - Làm việc với quy trình tải plugin hoặc sổ đăng ký
    - Triển khai các hook thời gian chạy của nhà cung cấp hoặc các plugin kênh
sidebarTitle: Internals
summary: 'Nội bộ Plugin: mô hình năng lực, quyền sở hữu, hợp đồng, quy trình tải và các trình trợ giúp thời gian chạy'
title: Nội bộ Plugin
x-i18n:
    generated_at: "2026-07-12T08:08:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Đây là **tài liệu tham chiếu kiến trúc chuyên sâu** cho hệ thống plugin của OpenClaw. Để xem hướng dẫn thực hành, hãy bắt đầu với một trong các trang chuyên biệt bên dưới.

<CardGroup cols={2}>
  <Card title="Cài đặt và sử dụng plugin" icon="plug" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách thêm, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Xây dựng plugin" icon="rocket" href="/vi/plugins/building-plugins">
    Hướng dẫn tạo plugin đầu tiên với tệp kê khai hoạt động tối giản.
  </Card>
  <Card title="Plugin kênh" icon="comments" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="microchip" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình.
  </Card>
  <Card title="Tổng quan về SDK" icon="book" href="/vi/plugins/sdk-overview">
    Tài liệu tham chiếu về sơ đồ nhập và API đăng ký.
  </Card>
</CardGroup>

## Mô hình năng lực công khai

Năng lực là mô hình **plugin gốc** công khai bên trong OpenClaw. Mỗi plugin OpenClaw gốc đăng ký một hoặc nhiều loại năng lực:

| Năng lực                    | Phương thức đăng ký                              | Plugin ví dụ                   |
| --------------------------- | ------------------------------------------------ | ------------------------------ |
| Suy luận văn bản            | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| Phần phụ trợ suy luận CLI   | `api.registerCliBackend(...)`                    | `anthropic`, `openai`          |
| Embedding                   | `api.registerEmbeddingProvider(...)`             | Plugin vectơ do nhà cung cấp sở hữu |
| Giọng nói                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| Phiên âm thời gian thực     | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Giọng nói thời gian thực    | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| Hiểu nội dung đa phương tiện | `api.registerMediaUnderstandingProvider(...)`   | `google`, `openai`             |
| Nguồn bản chép lời          | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| Tạo hình ảnh                | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| Tạo nhạc                    | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| Tạo video                   | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| Truy xuất web               | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| Tìm kiếm web                | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| Kênh / nhắn tin             | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| Khám phá Gateway            | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
Plugin không đăng ký năng lực nào nhưng cung cấp hook, công cụ, dịch vụ khám phá hoặc dịch vụ nền là plugin **kế thừa chỉ dùng hook**. Mẫu này vẫn được hỗ trợ đầy đủ.
</Note>

### Quan điểm về khả năng tương thích bên ngoài

Mô hình năng lực đã được tích hợp vào lõi và hiện được các plugin đóng gói sẵn/gốc sử dụng, nhưng khả năng tương thích của plugin bên ngoài vẫn cần tiêu chuẩn chặt chẽ hơn so với quan niệm “đã được xuất thì sẽ bất biến”.

| Tình huống plugin                                  | Hướng dẫn                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Plugin bên ngoài hiện có                           | Duy trì hoạt động của các tích hợp dựa trên hook; đây là chuẩn cơ sở về khả năng tương thích.                       |
| Plugin đóng gói sẵn/gốc mới                        | Ưu tiên đăng ký năng lực rõ ràng thay vì truy cập sâu theo từng nhà cung cấp hoặc thiết kế mới chỉ dùng hook.       |
| Plugin bên ngoài áp dụng đăng ký năng lực           | Được phép, nhưng hãy xem các bề mặt trợ giúp dành riêng cho năng lực là đang phát triển, trừ khi tài liệu đánh dấu chúng là ổn định. |

Đăng ký năng lực là hướng phát triển chủ đích. Trong giai đoạn chuyển đổi, hook kế thừa vẫn là con đường an toàn nhất để tránh gây gián đoạn cho plugin bên ngoài. Không phải mọi đường dẫn con của trình trợ giúp đã xuất đều tương đương nhau — hãy ưu tiên các hợp đồng hẹp đã được lập tài liệu thay vì các phần xuất trình trợ giúp ngẫu nhiên.

### Hình dạng plugin

OpenClaw phân loại mỗi plugin đã tải thành một hình dạng dựa trên hành vi đăng ký thực tế của plugin đó (không chỉ dựa trên siêu dữ liệu tĩnh):

<AccordionGroup>
  <Accordion title="năng lực đơn">
    Đăng ký đúng một loại năng lực (ví dụ: plugin chỉ dành cho nhà cung cấp như `arcee` hoặc `chutes`).
  </Accordion>
  <Accordion title="năng lực lai">
    Đăng ký nhiều loại năng lực (ví dụ: `openai` sở hữu suy luận văn bản, giọng nói, hiểu nội dung đa phương tiện và tạo hình ảnh).
  </Accordion>
  <Accordion title="chỉ dùng hook">
    Chỉ đăng ký hook (có kiểu hoặc tùy chỉnh), không đăng ký năng lực, công cụ, lệnh hoặc dịch vụ.
  </Accordion>
  <Accordion title="không có năng lực">
    Đăng ký công cụ, lệnh, dịch vụ hoặc tuyến nhưng không đăng ký năng lực.
  </Accordion>
</AccordionGroup>

Sử dụng `openclaw plugins inspect <id>` để xem hình dạng và phân tích năng lực của plugin. Xem [tài liệu tham chiếu CLI](/vi/cli/plugins#inspect) để biết chi tiết.

### Hook kế thừa

Hook `before_agent_start` vẫn được hỗ trợ như một đường dẫn tương thích dành cho plugin chỉ dùng hook. Các plugin kế thừa đang được sử dụng trong thực tế vẫn phụ thuộc vào hook này.

Định hướng:

- duy trì hoạt động của hook
- ghi rõ đây là hook kế thừa trong tài liệu
- ưu tiên `before_model_resolve` cho công việc ghi đè mô hình/nhà cung cấp
- ưu tiên `before_prompt_build` cho công việc sửa đổi lời nhắc
- chỉ loại bỏ sau khi mức sử dụng thực tế giảm và phạm vi bao phủ của fixture chứng minh việc di chuyển là an toàn

### Tín hiệu tương thích

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` và `openclaw plugins doctor` hiển thị các thông báo tương thích sau:

| Tín hiệu                                        | Ý nghĩa                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **cấu hình hợp lệ**                             | Cấu hình được phân tích cú pháp bình thường và các plugin được phân giải                                                     |
| **chỉ dùng hook** (thông tin)                   | Plugin chỉ đăng ký hook; đây là đường dẫn được hỗ trợ nhưng chưa được di chuyển sang đăng ký năng lực                         |
| **`before_agent_start` kế thừa** (cảnh báo)     | Plugin sử dụng hook `before_agent_start` đã lỗi thời thay vì `before_model_resolve`/`before_prompt_build`                     |
| **API embedding bộ nhớ đã lỗi thời** (cảnh báo) | Plugin không đóng gói sẵn sử dụng API nhà cung cấp embedding dành riêng cho bộ nhớ kiểu cũ thay vì `registerEmbeddingProvider` |
| **lỗi nghiêm trọng**                            | Cấu hình không hợp lệ hoặc không tải được plugin                                                                              |

Hiện tại, không tín hiệu tư vấn/cảnh báo nào làm hỏng plugin của bạn. Các tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống plugin của OpenClaw có bốn lớp:

<Steps>
  <Step title="Tệp kê khai + khám phá">
    OpenClaw tìm các plugin tiềm năng từ đường dẫn đã cấu hình, thư mục gốc của không gian làm việc, thư mục gốc plugin toàn cục và các plugin đóng gói sẵn. Quá trình khám phá đọc trước các tệp kê khai `openclaw.plugin.json` gốc cùng các tệp kê khai gói được hỗ trợ.
  </Step>
  <Step title="Bật + xác thực">
    Lõi quyết định plugin đã khám phá được bật, tắt, chặn hay được chọn cho một vị trí độc quyền như bộ nhớ.
  </Step>
  <Step title="Tải khi chạy">
    Các plugin OpenClaw gốc được tải trong tiến trình và đăng ký năng lực vào một sổ đăng ký trung tâm. JavaScript đã đóng gói được tải thông qua `require` gốc; mã nguồn TypeScript cục bộ của bên thứ ba dùng Jiti làm phương án dự phòng khẩn cấp. Các gói tương thích được chuẩn hóa thành bản ghi sổ đăng ký mà không cần nhập mã khi chạy.
  </Step>
  <Step title="Sử dụng bề mặt">
    Phần còn lại của OpenClaw đọc sổ đăng ký để cung cấp công cụ, kênh, thiết lập nhà cung cấp, hook, tuyến HTTP, lệnh CLI và dịch vụ.
  </Step>
</Steps>

Riêng với CLI của plugin, quá trình khám phá lệnh gốc được chia thành hai giai đoạn:

- siêu dữ liệu tại thời điểm phân tích cú pháp đến từ `registerCli(..., { descriptors: [...] })`
- mô-đun CLI thực tế của plugin có thể tiếp tục tải lười và đăng ký khi được gọi lần đầu

Cách này giữ mã CLI do plugin sở hữu bên trong plugin, đồng thời vẫn cho phép OpenClaw dành trước tên lệnh gốc trước khi phân tích cú pháp.

Ranh giới thiết kế quan trọng:

- việc xác thực tệp kê khai/cấu hình phải hoạt động dựa trên **siêu dữ liệu tệp kê khai/lược đồ** mà không thực thi mã plugin
- quá trình khám phá năng lực gốc có thể tải mã điểm vào của plugin đáng tin cậy để xây dựng ảnh chụp nhanh sổ đăng ký không kích hoạt
- hành vi khi chạy gốc đến từ đường dẫn `register(api)` của mô-đun plugin với `api.registrationMode === "full"`

Việc phân tách này cho phép OpenClaw xác thực cấu hình, giải thích các plugin bị thiếu/vô hiệu hóa và xây dựng gợi ý giao diện người dùng/lược đồ trước khi toàn bộ môi trường chạy được kích hoạt.

### Ảnh chụp nhanh siêu dữ liệu plugin và bảng tra cứu

Khi Gateway khởi động, hệ thống xây dựng một `PluginMetadataSnapshot` cho ảnh chụp nhanh cấu hình hiện tại. Ảnh chụp nhanh này chỉ chứa siêu dữ liệu: chỉ mục plugin đã cài đặt, sổ đăng ký tệp kê khai, chẩn đoán tệp kê khai, ánh xạ chủ sở hữu, bộ chuẩn hóa mã định danh plugin và các bản ghi tệp kê khai. Nó không chứa mô-đun plugin đã tải, SDK của nhà cung cấp, nội dung gói hoặc các phần xuất khi chạy.

Quá trình xác thực cấu hình có nhận biết plugin, tự động bật khi khởi động và khởi tạo plugin Gateway sử dụng ảnh chụp nhanh đó thay vì tự xây dựng lại siêu dữ liệu tệp kê khai/chỉ mục một cách độc lập. `PluginLookUpTable` được tạo từ cùng ảnh chụp nhanh và bổ sung kế hoạch plugin khởi động cho cấu hình khi chạy hiện tại.

Sau khi khởi động, Gateway giữ ảnh chụp nhanh siêu dữ liệu hiện tại dưới dạng sản phẩm khi chạy có thể thay thế. Quá trình khám phá nhà cung cấp lặp lại khi chạy có thể mượn ảnh chụp nhanh đó thay vì tái tạo chỉ mục đã cài đặt và sổ đăng ký tệp kê khai cho mỗi lượt duyệt danh mục nhà cung cấp. Ảnh chụp nhanh được xóa hoặc thay thế khi Gateway tắt, khi cấu hình/kho plugin thay đổi và khi ghi chỉ mục đã cài đặt; bên gọi quay lại đường dẫn nguội của tệp kê khai/chỉ mục khi không có ảnh chụp nhanh hiện tại tương thích. Kiểm tra tương thích phải bao gồm các thư mục gốc khám phá plugin như `plugins.load.paths` và không gian làm việc tác nhân mặc định, vì plugin trong không gian làm việc là một phần phạm vi siêu dữ liệu.

Ảnh chụp nhanh và bảng tra cứu giữ các quyết định khởi động lặp lại trên đường dẫn nhanh:

- quyền sở hữu kênh
- khởi động kênh trì hoãn
- mã định danh plugin khởi động
- quyền sở hữu nhà cung cấp và phần phụ trợ CLI
- quyền sở hữu nhà cung cấp thiết lập, bí danh lệnh, nhà cung cấp danh mục mô hình và hợp đồng tệp kê khai
- xác thực lược đồ cấu hình plugin và lược đồ cấu hình kênh
- quyết định tự động bật khi khởi động

Ranh giới an toàn là thay thế ảnh chụp nhanh, không phải sửa đổi ảnh chụp nhanh. Hãy xây dựng lại ảnh chụp nhanh khi cấu hình, kho plugin, bản ghi cài đặt hoặc chính sách chỉ mục được lưu bền vững thay đổi. Không xem nó là một sổ đăng ký toàn cục có thể thay đổi rộng rãi và không giữ số lượng ảnh chụp nhanh lịch sử không giới hạn. Việc tải plugin khi chạy vẫn tách biệt với ảnh chụp nhanh siêu dữ liệu để trạng thái khi chạy cũ không thể bị che giấu sau bộ nhớ đệm siêu dữ liệu.

Quy tắc bộ nhớ đệm được ghi lại trong [Nội bộ kiến trúc plugin](/vi/plugins/architecture-internals#plugin-cache-boundary): siêu dữ liệu tệp kê khai và khám phá luôn mới, trừ khi bên gọi giữ một ảnh chụp nhanh, bảng tra cứu hoặc sổ đăng ký tệp kê khai rõ ràng cho luồng hiện tại. Bộ nhớ đệm siêu dữ liệu ẩn và TTL theo thời gian thực không thuộc quá trình tải plugin. Chỉ bộ nhớ đệm của trình tải khi chạy, mô-đun và hiện vật phụ thuộc mới có thể tồn tại sau khi mã hoặc hiện vật đã cài đặt thực sự được tải.

Một số bên gọi trên đường dẫn nguội vẫn tái tạo trực tiếp sổ đăng ký tệp kê khai từ chỉ mục plugin đã cài đặt được lưu bền vững thay vì nhận `PluginLookUpTable` từ Gateway. Đường dẫn đó hiện tái tạo sổ đăng ký theo yêu cầu; hãy ưu tiên truyền bảng tra cứu hiện tại hoặc một sổ đăng ký tệp kê khai rõ ràng qua các luồng khi chạy khi bên gọi đã có sẵn.

### Lập kế hoạch kích hoạt

Lập kế hoạch kích hoạt là một phần của mặt phẳng điều khiển. Bên gọi có thể yêu cầu xác định những plugin nào liên quan đến một lệnh, nhà cung cấp, kênh, tuyến, bộ khung tác tử hoặc khả năng cụ thể trước khi tải các sổ đăng ký thời gian chạy rộng hơn.

Bộ lập kế hoạch duy trì khả năng tương thích với hành vi manifest hiện tại:

- các trường `activation.*` là gợi ý rõ ràng cho bộ lập kế hoạch
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và các hook vẫn là phương án dự phòng dựa trên quyền sở hữu trong manifest
- API của bộ lập kế hoạch chỉ trả về ID vẫn khả dụng cho các bên gọi hiện có
- API kế hoạch báo cáo các nhãn lý do để chẩn đoán có thể phân biệt gợi ý rõ ràng với phương án dự phòng dựa trên quyền sở hữu

<Warning>
Không coi `activation` là hook vòng đời hoặc thành phần thay thế cho `register(...)`. Đây là siêu dữ liệu dùng để thu hẹp phạm vi tải. Ưu tiên các trường quyền sở hữu khi chúng đã mô tả mối quan hệ; chỉ sử dụng `activation` cho các gợi ý bổ sung dành cho bộ lập kế hoạch.
</Warning>

### Plugin kênh và công cụ tin nhắn dùng chung

Plugin kênh không cần đăng ký công cụ gửi/chỉnh sửa/phản ứng riêng cho các thao tác trò chuyện thông thường. OpenClaw duy trì một công cụ `message` dùng chung trong lõi, còn plugin kênh sở hữu việc khám phá và thực thi dành riêng cho kênh phía sau công cụ đó.

Ranh giới hiện tại là:

- lõi sở hữu máy chủ công cụ `message` dùng chung, hệ thống nối prompt, việc ghi sổ phiên/luồng và điều phối thực thi
- plugin kênh sở hữu việc khám phá thao tác theo phạm vi, khám phá khả năng và mọi đoạn schema dành riêng cho kênh
- plugin kênh sở hữu ngữ pháp hội thoại phiên dành riêng cho nhà cung cấp, chẳng hạn cách ID hội thoại mã hóa ID luồng hoặc kế thừa từ hội thoại cha
- plugin kênh thực thi thao tác cuối cùng thông qua bộ điều hợp thao tác của chúng

Đối với plugin kênh, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Lệnh gọi khám phá hợp nhất này cho phép plugin trả về đồng thời các thao tác hiển thị, khả năng và phần đóng góp schema để các thành phần đó không sai lệch khỏi nhau.

Khi một tham số công cụ tin nhắn dành riêng cho kênh mang nguồn phương tiện như đường dẫn cục bộ hoặc URL phương tiện từ xa, plugin cũng nên trả về `mediaSourceParams` từ `describeMessageTool(...)`. Lõi sử dụng danh sách rõ ràng đó để áp dụng việc chuẩn hóa đường dẫn sandbox và các gợi ý truy cập phương tiện gửi đi mà không mã hóa cứng tên tham số do plugin sở hữu. Ở đây nên ưu tiên bản đồ theo phạm vi thao tác thay vì một danh sách phẳng áp dụng cho toàn kênh, để tham số phương tiện chỉ dành cho hồ sơ không bị chuẩn hóa trên các thao tác không liên quan như `send`.

Lõi truyền phạm vi thời gian chạy vào bước khám phá đó. Các trường quan trọng bao gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` đầu vào đáng tin cậy

Điều đó quan trọng đối với các plugin nhạy theo ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị các thao tác tin nhắn dựa trên tài khoản đang hoạt động, phòng/luồng/tin nhắn hiện tại hoặc danh tính người yêu cầu đáng tin cậy mà không cần mã hóa cứng các nhánh dành riêng cho kênh trong công cụ `message` lõi.

Đây là lý do các thay đổi định tuyến trình chạy nhúng vẫn là công việc của plugin: trình chạy chịu trách nhiệm chuyển tiếp danh tính trò chuyện/phiên hiện tại vào ranh giới khám phá của plugin để công cụ `message` dùng chung hiển thị đúng bề mặt do kênh sở hữu cho lượt hiện tại.

Đối với các trình trợ giúp thực thi do kênh sở hữu, plugin đi kèm nên giữ thời gian chạy thực thi bên trong các mô-đun plugin của chính chúng. Lõi không còn sở hữu thời gian chạy thao tác tin nhắn của Discord, Slack, Telegram hoặc WhatsApp trong `src/agents/tools`. Chúng tôi không phát hành các đường dẫn con `plugin-sdk/*-action-runtime` riêng biệt, và plugin đi kèm nên nhập trực tiếp mã thời gian chạy cục bộ của chính mình từ các mô-đun do plugin sở hữu.

Ranh giới tương tự áp dụng chung cho các điểm nối SDK mang tên nhà cung cấp: lõi không nên nhập các barrel tiện ích dành riêng cho kênh đối với Discord, Signal, Slack, WhatsApp hoặc các plugin tương tự. Nếu lõi cần một hành vi, hãy sử dụng barrel `api.ts` / `runtime-api.ts` của chính plugin đi kèm hoặc nâng nhu cầu đó thành một khả năng tổng quát, hẹp trong SDK dùng chung.

Plugin đi kèm tuân theo cùng quy tắc. `runtime-api.ts` của một plugin đi kèm không nên tái xuất facade `openclaw/plugin-sdk/<plugin-id>` mang thương hiệu của chính nó. Các facade mang thương hiệu đó vẫn là shim tương thích cho plugin bên ngoài và bên sử dụng cũ, nhưng plugin đi kèm nên sử dụng các bản xuất cục bộ cùng những đường dẫn con SDK tổng quát, hẹp như `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` hoặc `openclaw/plugin-sdk/webhook-ingress`. Mã mới không nên thêm facade SDK dành riêng cho ID plugin trừ khi ranh giới tương thích của một hệ sinh thái bên ngoài hiện có yêu cầu điều đó.

Riêng đối với cuộc thăm dò, có hai đường dẫn thực thi:

- `outbound.sendPoll` là đường cơ sở dùng chung cho các kênh phù hợp với mô hình thăm dò chung
- `actions.handleAction("poll")` là đường dẫn ưu tiên cho ngữ nghĩa thăm dò dành riêng cho kênh hoặc các tham số thăm dò bổ sung

Lõi hiện trì hoãn việc phân tích cú pháp thăm dò dùng chung cho đến sau khi bước điều phối thăm dò của plugin từ chối thao tác, nhờ đó trình xử lý thăm dò do plugin sở hữu có thể chấp nhận các trường thăm dò dành riêng cho kênh mà không bị trình phân tích cú pháp thăm dò tổng quát chặn trước.

Xem [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals) để biết toàn bộ trình tự khởi động.

## Mô hình sở hữu khả năng

OpenClaw coi một plugin gốc là ranh giới sở hữu cho một **công ty** hoặc một **tính năng**, không phải một tập hợp tùy tiện các tích hợp không liên quan.

Điều đó có nghĩa là:

- một plugin công ty thường nên sở hữu tất cả các bề mặt của công ty đó hướng tới OpenClaw
- một plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- các kênh nên sử dụng các khả năng lõi dùng chung thay vì tùy tiện triển khai lại hành vi của nhà cung cấp

<AccordionGroup>
  <Accordion title="Nhà cung cấp đa khả năng">
    `google` sở hữu suy luận văn bản, phần phụ trợ CLI, embedding, giọng nói, thoại thời gian thực, hiểu phương tiện, tạo hình ảnh/nhạc/video và tìm kiếm web. `openai` sở hữu suy luận văn bản, embedding, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện và tạo hình ảnh/video. `minimax` sở hữu suy luận văn bản cùng với hiểu phương tiện, giọng nói, tạo hình ảnh/nhạc/video và tìm kiếm web.
  </Accordion>
  <Accordion title="Nhà cung cấp đơn khả năng">
    `arcee` và `chutes` chỉ sở hữu suy luận văn bản; `microsoft` chỉ sở hữu giọng nói. Một plugin nhà cung cấp có thể duy trì phạm vi hẹp như vậy cho đến khi cần bao phủ thêm bề mặt của nhà cung cấp đó.
  </Accordion>
  <Accordion title="Plugin tính năng">
    `voice-call` sở hữu phương thức truyền tải cuộc gọi, công cụ, CLI, tuyến và cầu nối luồng phương tiện Twilio, nhưng sử dụng các khả năng dùng chung về giọng nói, phiên âm thời gian thực và thoại thời gian thực thay vì nhập trực tiếp plugin nhà cung cấp.
  </Accordion>
</AccordionGroup>

Trạng thái đích mong muốn là:

- bề mặt của một nhà cung cấp hướng tới OpenClaw nằm trong một plugin, ngay cả khi trải rộng trên mô hình văn bản, giọng nói, hình ảnh và video
- các nhà cung cấp khác có thể làm tương tự cho phạm vi bề mặt của chính họ
- các kênh không quan tâm plugin nhà cung cấp nào sở hữu nhà cung cấp đó; chúng sử dụng hợp đồng khả năng dùng chung do lõi cung cấp

Đây là điểm khác biệt then chốt:

- **plugin** = ranh giới sở hữu
- **khả năng** = hợp đồng lõi mà nhiều plugin có thể triển khai hoặc sử dụng

Vì vậy, nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "nhà cung cấp nào nên mã hóa cứng việc xử lý video?" Câu hỏi đầu tiên là "hợp đồng khả năng video của lõi là gì?" Khi hợp đồng đó tồn tại, plugin nhà cung cấp có thể đăng ký theo hợp đồng này và plugin kênh/tính năng có thể sử dụng nó.

Nếu khả năng đó chưa tồn tại, hướng xử lý đúng thường là:

<Steps>
  <Step title="Định nghĩa khả năng">
    Định nghĩa khả năng còn thiếu trong lõi.
  </Step>
  <Step title="Cung cấp qua SDK">
    Cung cấp khả năng đó thông qua API/thời gian chạy của plugin theo cách có định kiểu.
  </Step>
  <Step title="Kết nối bên sử dụng">
    Kết nối các kênh/tính năng với khả năng đó.
  </Step>
  <Step title="Các triển khai của nhà cung cấp">
    Cho phép plugin nhà cung cấp đăng ký các triển khai.
  </Step>
</Steps>

Điều này giữ cho quyền sở hữu rõ ràng, đồng thời tránh hành vi lõi phụ thuộc vào một nhà cung cấp duy nhất hoặc một đường dẫn mã dành riêng cho plugin chỉ dùng một lần.

### Phân lớp khả năng

Sử dụng mô hình tư duy này khi quyết định mã thuộc về đâu:

<Tabs>
  <Tab title="Lớp khả năng lõi">
    Điều phối dùng chung, chính sách, phương án dự phòng, quy tắc hợp nhất cấu hình, ngữ nghĩa phân phối và hợp đồng có định kiểu.
  </Tab>
  <Tab title="Lớp plugin nhà cung cấp">
    API dành riêng cho nhà cung cấp, xác thực, danh mục mô hình, tổng hợp giọng nói, tạo hình ảnh, phần phụ trợ video và điểm cuối mức sử dụng.
  </Tab>
  <Tab title="Lớp plugin kênh/tính năng">
    Tích hợp Discord/Slack/voice-call/v.v. sử dụng các khả năng lõi và trình bày chúng trên một bề mặt.
  </Tab>
</Tabs>

Ví dụ, TTS tuân theo cấu trúc này:

- lõi sở hữu chính sách TTS tại thời điểm trả lời, thứ tự dự phòng, tùy chọn và phân phối qua kênh
- `elevenlabs`, `google`, `microsoft` và `openai` sở hữu các triển khai tổng hợp
- `voice-call` sử dụng trình trợ giúp thời gian chạy TTS điện thoại

Nên ưu tiên cùng mẫu này cho các khả năng trong tương lai.

### Ví dụ về plugin công ty đa khả năng

Một plugin công ty nên mang lại cảm giác thống nhất từ bên ngoài. Nếu OpenClaw có các hợp đồng dùng chung cho mô hình, giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video, truy xuất web và tìm kiếm web, một nhà cung cấp có thể sở hữu tất cả các bề mặt của mình tại một nơi:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

Điều quan trọng không phải là tên chính xác của các trình trợ giúp. Cấu trúc mới là điều quan trọng:

- một plugin sở hữu bề mặt nhà cung cấp
- lõi vẫn sở hữu các hợp đồng khả năng
- các kênh và plugin tính năng sử dụng trình trợ giúp `api.runtime.*`, không sử dụng mã của nhà cung cấp
- kiểm thử hợp đồng có thể xác nhận rằng plugin đã đăng ký các khả năng mà nó tuyên bố sở hữu

### Ví dụ về khả năng: hiểu video

OpenClaw đã coi việc hiểu hình ảnh/âm thanh/video là một khả năng dùng chung duy nhất. Mô hình sở hữu tương tự cũng áp dụng tại đây:

<Steps>
  <Step title="Lõi định nghĩa hợp đồng">
    Lõi định nghĩa hợp đồng hiểu phương tiện.
  </Step>
  <Step title="Plugin nhà cung cấp đăng ký">
    Plugin nhà cung cấp đăng ký `describeImage`, `transcribeAudio` và `describeVideo` khi phù hợp.
  </Step>
  <Step title="Bên sử dụng dùng hành vi chung">
    Các kênh và plugin tính năng sử dụng hành vi lõi dùng chung thay vì kết nối trực tiếp với mã của nhà cung cấp.
  </Step>
</Steps>

Điều đó tránh nhúng các giả định về video của một nhà cung cấp vào lõi. Plugin sở hữu bề mặt nhà cung cấp; lõi sở hữu hợp đồng khả năng và hành vi dự phòng.

Việc tạo video đã sử dụng cùng trình tự đó: lõi sở hữu hợp đồng khả năng có định kiểu và trình trợ giúp thời gian chạy, còn plugin nhà cung cấp đăng ký các triển khai `api.registerVideoGenerationProvider(...)` theo hợp đồng này.

Bạn cần danh sách kiểm tra triển khai cụ thể? Xem [Sổ tay khả năng](/vi/plugins/adding-capabilities).

## Hợp đồng và thực thi

Bề mặt API của plugin được chủ ý định kiểu và tập trung trong `OpenClawPluginApi`. Hợp đồng đó xác định các điểm đăng ký được hỗ trợ và những trình trợ giúp thời gian chạy mà plugin có thể dựa vào.

Tại sao điều này quan trọng:

- tác giả plugin có được một tiêu chuẩn nội bộ ổn định duy nhất
- lõi có thể từ chối quyền sở hữu trùng lặp, chẳng hạn như hai plugin đăng ký cùng một id nhà cung cấp
- quá trình khởi động có thể hiển thị thông tin chẩn đoán có thể xử lý cho các đăng ký không hợp lệ
- kiểm thử hợp đồng có thể thực thi quyền sở hữu của plugin đi kèm và ngăn chặn sai lệch âm thầm

Có hai lớp thực thi:

<AccordionGroup>
  <Accordion title="Thực thi đăng ký trong thời gian chạy">
    Sổ đăng ký plugin xác thực các đăng ký khi plugin được tải. Ví dụ: id nhà cung cấp trùng lặp, id nhà cung cấp giọng nói trùng lặp và đăng ký không hợp lệ sẽ tạo thông tin chẩn đoán plugin thay vì dẫn đến hành vi không xác định.
  </Accordion>
  <Accordion title="Kiểm thử hợp đồng">
    Các plugin đi kèm được ghi nhận trong sổ đăng ký hợp đồng khi chạy kiểm thử để OpenClaw có thể xác nhận rõ ràng quyền sở hữu. Hiện nay, cơ chế này được dùng cho nhà cung cấp mô hình, nhà cung cấp giọng nói, nhà cung cấp tìm kiếm web và quyền sở hữu đăng ký đi kèm.
  </Accordion>
</AccordionGroup>

Hiệu quả thực tế là OpenClaw biết ngay từ đầu plugin nào sở hữu bề mặt nào. Điều này cho phép lõi và các kênh kết hợp liền mạch vì quyền sở hữu được khai báo, định kiểu và có thể kiểm thử thay vì chỉ được ngầm hiểu.

### Những gì nên có trong hợp đồng

<Tabs>
  <Tab title="Hợp đồng tốt">
    - được định kiểu
    - nhỏ gọn
    - dành riêng cho năng lực
    - do lõi sở hữu
    - có thể được nhiều plugin tái sử dụng
    - các kênh/tính năng có thể sử dụng mà không cần biết về nhà cung cấp

  </Tab>
  <Tab title="Hợp đồng không tốt">
    - chính sách dành riêng cho nhà cung cấp bị ẩn trong lõi
    - lối thoát riêng lẻ cho plugin để bỏ qua sổ đăng ký
    - mã kênh truy cập trực tiếp vào phần triển khai của nhà cung cấp
    - các đối tượng thời gian chạy tùy biến không thuộc `OpenClawPluginApi` hoặc `api.runtime`

  </Tab>
</Tabs>

Khi chưa chắc chắn, hãy nâng mức trừu tượng: xác định năng lực trước, sau đó cho phép các plugin tích hợp vào đó.

## Mô hình thực thi

Các plugin OpenClaw gốc chạy **trong cùng tiến trình** với Gateway. Chúng không được cách ly trong sandbox. Một plugin gốc đã tải có cùng ranh giới tin cậy ở cấp tiến trình như mã lõi.

<Warning>
Hệ quả của plugin gốc: plugin có thể đăng ký công cụ, trình xử lý mạng, hook và dịch vụ; lỗi plugin có thể làm Gateway gặp sự cố hoặc mất ổn định; và plugin gốc độc hại tương đương với việc thực thi mã tùy ý bên trong tiến trình OpenClaw.
</Warning>

Theo mặc định, các gói tương thích an toàn hơn vì OpenClaw hiện coi chúng là các gói siêu dữ liệu/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là Skills đi kèm.

Hãy sử dụng danh sách cho phép và đường dẫn cài đặt/tải rõ ràng cho các plugin không đi kèm. Hãy coi plugin trong không gian làm việc là mã dùng trong giai đoạn phát triển, không phải giá trị mặc định cho môi trường sản xuất.

Đối với tên gói không gian làm việc đi kèm, hãy giữ id plugin gắn với tên npm: mặc định là `@openclaw/<id>`, hoặc dùng hậu tố được định kiểu và phê duyệt như `-provider`, `-plugin`, `-speech`, `-sandbox` hoặc `-media-understanding` khi gói chủ ý cung cấp một vai trò plugin hẹp hơn.

<Note>
**Lưu ý về độ tin cậy:** `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc mã nguồn. Một plugin trong không gian làm việc có cùng id với plugin đi kèm sẽ chủ ý thay thế bản đi kèm khi plugin trong không gian làm việc đó được bật/đưa vào danh sách cho phép. Đây là hành vi bình thường và hữu ích cho phát triển cục bộ, kiểm thử bản vá và bản sửa lỗi khẩn cấp. Độ tin cậy của plugin đi kèm được xác định từ ảnh chụp mã nguồn — tệp kê khai và mã trên đĩa tại thời điểm tải — chứ không phải từ siêu dữ liệu cài đặt. Bản ghi cài đặt bị hỏng hoặc bị thay thế không thể âm thầm mở rộng bề mặt tin cậy của plugin đi kèm vượt quá những gì mã nguồn thực tế khai báo.
</Note>

## Ranh giới xuất

OpenClaw xuất các năng lực, không xuất những tiện ích thuận tiện cho việc triển khai.

Giữ việc đăng ký năng lực ở trạng thái công khai. Loại bỏ các phần xuất trình trợ giúp không thuộc hợp đồng:

- đường dẫn con trình trợ giúp dành riêng cho plugin đi kèm
- đường dẫn con hệ thống kết nối thời gian chạy không được dùng làm API công khai
- trình trợ giúp tiện ích dành riêng cho nhà cung cấp
- trình trợ giúp thiết lập/hướng dẫn ban đầu vốn là chi tiết triển khai

Các đường dẫn con trình trợ giúp dành riêng cho plugin đi kèm đã được loại bỏ khỏi bản đồ xuất SDK được tạo. Giữ các trình trợ giúp dành riêng cho chủ sở hữu bên trong gói plugin sở hữu chúng; chỉ nâng hành vi máy chủ có thể tái sử dụng thành các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.

## Nội bộ và tài liệu tham khảo

Để tìm hiểu quy trình tải, mô hình sổ đăng ký, hook thời gian chạy của nhà cung cấp, tuyến HTTP của Gateway, lược đồ công cụ tin nhắn, phân giải đích kênh, danh mục nhà cung cấp, plugin công cụ ngữ cảnh và hướng dẫn thêm năng lực mới, hãy xem [Kiến trúc nội bộ của plugin](/vi/plugins/architecture-internals).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tệp kê khai plugin](/vi/plugins/manifest)
- [Thiết lập SDK plugin](/vi/plugins/sdk-setup)
