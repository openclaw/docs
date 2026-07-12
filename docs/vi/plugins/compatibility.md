---
read_when:
    - Bạn duy trì một plugin OpenClaw
    - Bạn thấy cảnh báo về khả năng tương thích của plugin
    - Bạn đang lên kế hoạch di chuyển SDK Plugin hoặc tệp kê khai
summary: Hợp đồng tương thích của Plugin, siêu dữ liệu ngừng hỗ trợ và các yêu cầu về di chuyển
title: Khả năng tương thích của Plugin
x-i18n:
    generated_at: "2026-07-12T08:10:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw duy trì các hợp đồng Plugin cũ thông qua các bộ điều hợp tương thích
có tên trước khi loại bỏ chúng. Điều này bảo vệ các Plugin đi kèm và bên ngoài
hiện có trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và môi trường
chạy tác tử phát triển.

## Sổ đăng ký tương thích

Các hợp đồng tương thích Plugin được theo dõi trong sổ đăng ký lõi tại
`src/plugins/compat/registry.ts`. Mỗi bản ghi có:

- một mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending` hoặc `removed`
- chủ sở hữu: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` hoặc `core`
- ngày giới thiệu và ngày ngừng hỗ trợ khi áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao quát hành vi cũ và mới

Sổ đăng ký là nguồn phục vụ việc lập kế hoạch của người bảo trì và các bước
kiểm tra Plugin trong tương lai. Nếu một hành vi hướng tới Plugin thay đổi,
hãy thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi bổ sung bộ
điều hợp.

Khả năng tương thích của việc sửa chữa và di chuyển bằng doctor được theo dõi
riêng tại `src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó
bao quát các hình dạng cấu hình cũ, bố cục sổ cái cài đặt và các lớp trung gian
sửa chữa có thể cần tiếp tục khả dụng sau khi đường dẫn tương thích trong môi
trường chạy bị loại bỏ.

Các đợt rà soát bản phát hành nên kiểm tra cả hai sổ đăng ký. Không xóa một
quy trình di chuyển của doctor chỉ vì bản ghi tương thích môi trường chạy hoặc
cấu hình tương ứng đã hết hạn; trước tiên hãy xác minh rằng không còn đường
dẫn nâng cấp được hỗ trợ nào vẫn cần việc sửa chữa đó. Đồng thời, hãy xác thực
lại từng chú thích thay thế trong quá trình lập kế hoạch phát hành, vì quyền
sở hữu Plugin và phạm vi cấu hình có thể thay đổi khi các nhà cung cấp và kênh
được chuyển ra khỏi lõi.

## Chính sách ngừng hỗ trợ

OpenClaw không nên loại bỏ một hợp đồng Plugin đã được lập tài liệu trong cùng
bản phát hành giới thiệu phương án thay thế của hợp đồng đó. Trình tự di chuyển:

1. Thêm hợp đồng mới.
2. Duy trì hành vi cũ thông qua một bộ điều hợp tương thích có tên.
3. Phát chẩn đoán hoặc cảnh báo khi tác giả Plugin có thể thực hiện hành động.
4. Lập tài liệu về phương án thay thế và tiến trình thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ hết khoảng thời gian di chuyển đã công bố.
7. Chỉ loại bỏ khi có phê duyệt rõ ràng cho bản phát hành có thay đổi phá vỡ tương thích.

Các bản ghi đã ngừng hỗ trợ phải bao gồm ngày bắt đầu cảnh báo, phương án thay
thế, liên kết tài liệu và ngày loại bỏ cuối cùng không quá ba tháng sau khi
cảnh báo bắt đầu. Không thêm một đường dẫn tương thích đã ngừng hỗ trợ với
khoảng thời gian loại bỏ không xác định, trừ khi người bảo trì quyết định rõ
ràng rằng đó là khả năng tương thích vĩnh viễn và thay vào đó đánh dấu nó là
`active`.

## Các khu vực tương thích hiện tại

Sổ đăng ký hiện theo dõi khoảng 70 mã tương thích trong các khu vực sau. Mã
Plugin mới nên sử dụng phương án thay thế trong từng khu vực và trong hướng
dẫn di chuyển cụ thể; các Plugin hiện có có thể tiếp tục sử dụng một đường
dẫn tương thích cho đến khi tài liệu, chẩn đoán và ghi chú phát hành công bố
khoảng thời gian loại bỏ.

- các lệnh nhập SDK rộng cũ như `openclaw/plugin-sdk/compat`
- các hình dạng Plugin cũ chỉ có hook và `before_agent_start`
- tên hook dọn dẹp cũ `api.on("deactivate", ...)` trong khi các Plugin
  di chuyển sang `gateway_stop`
- điểm vào Plugin cũ `activate(api)` trong khi các Plugin di chuyển sang
  `register(api)`
- các bí danh SDK cũ như `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, các trình dựng trạng thái
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (được
  thay thế bằng các đường dẫn con kiểm thử `openclaw/plugin-sdk/*` chuyên biệt)
  và các bí danh kiểu `ClawdbotConfig` / `OpenClawSchemaType`
- danh sách cho phép và hành vi kích hoạt Plugin đi kèm
- siêu dữ liệu manifest biến môi trường cũ của nhà cung cấp/kênh
- các hook và bí danh kiểu cũ của Plugin nhà cung cấp trong khi các nhà cung
  cấp chuyển sang các hook danh mục, xác thực, suy luận, phát lại và truyền tải
  tường minh
- các bí danh môi trường chạy cũ như `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` và
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  đã ngừng hỗ trợ
- các trường callback phẳng `WebInboundMessage` của WhatsApp (xem bên dưới)
- các trường tiếp nhận cấp cao nhất của `WebInboundMessage` trên WhatsApp
  (xem bên dưới)
- đăng ký tách biệt cũ của Plugin bộ nhớ trong khi các Plugin bộ nhớ chuyển
  sang `registerMemoryCapability`
- đăng ký nhà cung cấp embedding dành riêng cho bộ nhớ kiểu cũ trong khi các
  nhà cung cấp embedding chuyển sang `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`
- các trình trợ giúp SDK kênh cũ cho lược đồ tin nhắn gốc, kiểm soát lượt đề
  cập, định dạng phong bì đầu vào và cấu trúc lồng nhau của khả năng phê duyệt
- các bí danh cũ cho khóa định tuyến kênh và trình trợ giúp mục tiêu có thể so
  sánh trong khi các Plugin chuyển sang `openclaw/plugin-sdk/channel-route`
- các gợi ý kích hoạt được thay thế bằng quyền sở hữu phần đóng góp manifest
- cơ chế dự phòng môi trường chạy `setup-api` trong khi các bộ mô tả thiết lập
  chuyển sang siêu dữ liệu tĩnh `setup.requiresRuntime: false`
- các hook `discovery` của nhà cung cấp trong khi các hook danh mục nhà cung
  cấp chuyển sang `catalog.run(...)`
- siêu dữ liệu `showConfigured` / `showInSetup` của kênh trong khi các gói kênh
  chuyển sang `openclaw.channel.exposure`
- các khóa cấu hình chính sách môi trường chạy cũ trong khi doctor di chuyển
  người vận hành sang `agentRuntime`
- cơ chế dự phòng siêu dữ liệu cấu hình kênh đi kèm được tạo trong khi siêu dữ
  liệu `channelConfigs` ưu tiên sổ đăng ký được triển khai
- các cờ môi trường vô hiệu hóa sổ đăng ký Plugin được lưu bền và di chuyển cài
  đặt trong khi các luồng sửa chữa di chuyển người vận hành sang
  `openclaw plugins registry --refresh` và `openclaw doctor --fix`
- các đường dẫn cấu hình cũ do Plugin sở hữu cho tìm kiếm web, truy xuất web và
  x_search trong khi doctor di chuyển chúng sang
  `plugins.entries.<plugin>.config`
- cấu hình `plugins.installs` cũ do người dùng tạo và các bí danh đường dẫn tải
  Plugin đi kèm trong khi siêu dữ liệu cài đặt chuyển vào sổ cái Plugin do trạng
  thái quản lý

### Các bí danh phẳng của callback đầu vào WhatsApp

Các callback môi trường chạy WhatsApp cung cấp `WebInboundMessage`: các ngữ
cảnh `event`, `payload`, `quote`, `group` và `platform` lồng nhau chính tắc,
cùng các bí danh phẳng đã ngừng hỗ trợ cho những trường callback đã phát hành.
Mã callback mới nên đọc các ngữ cảnh lồng nhau. Mã tạo thông điệp callback lồng
nhau sạch có thể sử dụng `WebInboundCallbackMessage`; các trình lắng nghe tương
thích vẫn chèn thông điệp kiểm thử hoặc Plugin phẳng cũ nên sử dụng
`LegacyFlatWebInboundMessage` hoặc `WebInboundMessageInput`.

Các bí danh phẳng tiếp tục khả dụng đến **2026-08-30**; khoảng thời gian đó chỉ
áp dụng cho việc truy cập bí danh phẳng, không áp dụng cho hình dạng lồng nhau,
vốn là hợp đồng môi trường chạy chính tắc. Chú thích TypeScript `@deprecated`
của mỗi bí danh phẳng nêu rõ phương án thay thế lồng nhau chính xác. Các ví dụ
phổ biến:

- `id`, `timestamp` và `isBatched` chuyển vào `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  và `untrustedStructuredContext` chuyển vào `payload`.
- `to`, `chatId`, các trường người gửi/bản thân, `sendComposing`, `reply(...)`
  và `sendMedia(...)` chuyển vào `platform`.
- các trường `replyTo*` chuyển vào `quote`; các trường chủ đề/thành viên/lượt
  đề cập của nhóm chuyển vào `group`.

`payload.untrustedStructuredContext` được trích xuất từ các tải trọng đầu vào
của nhà cung cấp. Các Plugin nên kiểm tra `label`, `source` và `type` trước khi
coi `payload` của nó là nguồn có thẩm quyền.

### Các trường tiếp nhận đầu vào WhatsApp

Các thông điệp callback WhatsApp được chấp nhận mang theo `admission`, một
phong bì an toàn để công khai cho quyết định kiểm soát truy cập đã cho phép
thông điệp. Mã callback mới nên đọc các dữ kiện tiếp nhận từ `msg.admission`
thay vì các trường tiếp nhận cấp cao nhất cũ.

Các trường cấp cao nhất tiếp tục khả dụng đến **2026-08-30**. Chú thích
TypeScript `@deprecated` của mỗi trường nêu rõ phương án thay thế:

- `from` và `conversationId` chuyển sang `admission.conversation.id`.
- `accountId` chuyển sang `admission.accountId`.
- `accessControlPassed` là một chế độ xem tương thích được suy ra từ
  `admission.ingress.decision === "allow"`; trên các thông điệp đã mang
  `admission`, việc ghi giá trị boolean cũ không ghi lại đồ thị đầu vào.
- `chatType` chuyển sang `admission.conversation.kind`.

## Gói trình kiểm tra Plugin

Trình kiểm tra Plugin nên nằm ngoài kho lưu trữ lõi OpenClaw dưới dạng một
gói/kho lưu trữ riêng, dựa trên các hợp đồng tương thích và manifest có phiên
bản. CLI cho ngày đầu tiên nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên xuất kết quả xác thực manifest/lược đồ, phiên bản tương thích hợp đồng
đang được kiểm tra, các bước kiểm tra siêu dữ liệu cài đặt/nguồn, kiểm tra nhập
trên đường dẫn tĩnh và các cảnh báo ngừng hỗ trợ/tương thích. Sử dụng `--json`
để có đầu ra ổn định mà máy có thể đọc trong các chú thích CI. Lõi OpenClaw
nên cung cấp các hợp đồng và fixture mà trình kiểm tra có thể sử dụng, nhưng
không nên phát hành tệp nhị phân của trình kiểm tra từ gói `openclaw` chính.

### Luồng nghiệm thu dành cho người bảo trì

Sử dụng Blacksmith Testbox dựa trên Crabbox cho luồng nghiệm thu gói có thể cài
đặt khi xác thực trình kiểm tra bên ngoài với các gói Plugin OpenClaw. Chạy nó
từ một bản checkout OpenClaw sạch sau khi gói được dựng:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Giữ luồng này ở chế độ người bảo trì chủ động chọn dùng, vì nó cài đặt một gói
npm bên ngoài và có thể kiểm tra các gói Plugin được sao chép bên ngoài kho lưu
trữ. Các biện pháp bảo vệ của kho lưu trữ cục bộ bao quát ánh xạ xuất SDK, siêu
dữ liệu sổ đăng ký tương thích, việc loại bỏ dần các lệnh nhập SDK đã ngừng hỗ
trợ và các ranh giới nhập của tiện ích mở rộng đi kèm; bằng chứng từ trình kiểm
tra Testbox bao quát gói theo cách các tác giả Plugin bên ngoài sử dụng nó.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các đợt ngừng hỗ trợ Plugin sắp tới cùng ngày mục
tiêu và liên kết đến tài liệu di chuyển, trước khi một đường dẫn tương thích
chuyển sang `removal-pending` hoặc `removed`.
