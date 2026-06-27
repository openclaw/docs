---
read_when:
    - Bạn duy trì một Plugin OpenClaw
    - Bạn thấy cảnh báo tương thích Plugin
    - Bạn đang lập kế hoạch di chuyển SDK Plugin hoặc manifest
summary: Hợp đồng tương thích Plugin, siêu dữ liệu ngừng hỗ trợ và kỳ vọng về quá trình di chuyển
title: Khả năng tương thích Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw giữ các hợp đồng Plugin cũ được nối qua những bộ chuyển đổi tương thích có tên trước khi loại bỏ chúng. Điều này bảo vệ các Plugin tích hợp sẵn và bên ngoài hiện có trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và runtime tác tử phát triển.

## Sổ đăng ký tương thích

Các hợp đồng tương thích Plugin được theo dõi trong sổ đăng ký lõi tại
`src/plugins/compat/registry.ts`.

Mỗi bản ghi có:

- mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending`, hoặc `removed`
- chủ sở hữu: SDK, cấu hình, thiết lập, kênh, nhà cung cấp, thực thi Plugin, runtime tác tử,
  hoặc lõi
- ngày giới thiệu và ngừng hỗ trợ khi áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao phủ hành vi cũ và mới

Sổ đăng ký là nguồn cho việc lập kế hoạch của maintainer và các kiểm tra trình kiểm tra Plugin trong tương lai. Nếu một hành vi hướng tới Plugin thay đổi, hãy thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi thêm bộ chuyển đổi.

Tương thích sửa chữa và di chuyển của doctor được theo dõi riêng tại
`src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó bao phủ các dạng cấu hình cũ, bố cục sổ cái cài đặt và các shim sửa chữa có thể cần tiếp tục khả dụng sau khi đường dẫn tương thích runtime bị loại bỏ.

Các đợt quét phát hành nên kiểm tra cả hai sổ đăng ký. Đừng xóa một migration doctor chỉ vì bản ghi tương thích runtime hoặc cấu hình tương ứng đã hết hạn; trước tiên hãy xác minh không còn đường dẫn nâng cấp được hỗ trợ nào vẫn cần sửa chữa đó. Đồng thời xác thực lại từng chú thích thay thế trong quá trình lập kế hoạch phát hành vì quyền sở hữu Plugin và phạm vi cấu hình có thể thay đổi khi nhà cung cấp và kênh được chuyển ra khỏi lõi.

## Gói trình kiểm tra Plugin

Trình kiểm tra Plugin nên nằm bên ngoài repo OpenClaw lõi dưới dạng một gói/kho riêng được hỗ trợ bởi các hợp đồng tương thích và manifest có phiên bản.

CLI ngày đầu nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên xuất ra:

- xác thực manifest/schema
- phiên bản tương thích hợp đồng đang được kiểm tra
- kiểm tra metadata cài đặt/nguồn
- kiểm tra import đường dẫn lạnh
- cảnh báo ngừng hỗ trợ và tương thích

Dùng `--json` để có đầu ra ổn định, máy đọc được trong chú thích CI. Lõi OpenClaw nên phơi bày các hợp đồng và fixture mà trình kiểm tra có thể tiêu thụ, nhưng không nên phát hành binary trình kiểm tra từ gói `openclaw` chính.

### Lane chấp nhận của maintainer

Dùng Blacksmith Testbox được Crabbox hỗ trợ cho lane chấp nhận gói có thể cài đặt khi xác thực trình kiểm tra bên ngoài với các gói Plugin OpenClaw. Chạy từ một checkout OpenClaw sạch sau khi gói được build:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Giữ lane này ở dạng opt-in cho maintainer vì nó cài một gói npm bên ngoài và có thể kiểm tra các gói Plugin được clone bên ngoài repo. Các guard repo cục bộ bao phủ export map SDK, metadata sổ đăng ký tương thích, quá trình giảm dần import SDK đã ngừng hỗ trợ và ranh giới import của extension tích hợp sẵn; bằng chứng trình kiểm tra Testbox bao phủ gói theo cách tác giả Plugin bên ngoài tiêu thụ nó.

## Chính sách ngừng hỗ trợ

OpenClaw không nên loại bỏ một hợp đồng Plugin đã được ghi tài liệu trong cùng bản phát hành giới thiệu thay thế của nó.

Trình tự migration là:

1. Thêm hợp đồng mới.
2. Giữ hành vi cũ được nối qua một bộ chuyển đổi tương thích có tên.
3. Phát chẩn đoán hoặc cảnh báo khi tác giả Plugin có thể hành động.
4. Ghi tài liệu thay thế và mốc thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ qua khoảng thời gian migration đã công bố.
7. Chỉ loại bỏ khi có phê duyệt phát hành phá vỡ rõ ràng.

Các bản ghi đã ngừng hỗ trợ phải bao gồm ngày bắt đầu cảnh báo, thay thế, liên kết tài liệu và ngày loại bỏ cuối cùng không quá ba tháng sau khi cảnh báo bắt đầu. Không thêm đường dẫn tương thích đã ngừng hỗ trợ với khoảng thời gian loại bỏ mở, trừ khi maintainer quyết định rõ ràng đó là tương thích vĩnh viễn và đánh dấu nó là `active` thay vào đó.

## Các khu vực tương thích hiện tại

Các bản ghi tương thích hiện tại bao gồm:

- các import SDK rộng cũ như `openclaw/plugin-sdk/compat`
- các dạng Plugin cũ chỉ có hook và `before_agent_start`
- tên hook dọn dẹp `api.on("deactivate", ...)` cũ trong khi Plugin di chuyển sang
  `gateway_stop`
- entrypoint Plugin `activate(api)` cũ trong khi Plugin di chuyển sang
  `register(api)`
- alias SDK cũ như `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder trạng thái `openclaw/plugin-sdk/command-auth`
  , `openclaw/plugin-sdk/test-utils` (được thay bằng các subpath kiểm thử
  `openclaw/plugin-sdk/*` tập trung), và alias kiểu `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist Plugin tích hợp sẵn và hành vi bật
- metadata manifest env-var nhà cung cấp/kênh cũ
- hook Plugin nhà cung cấp và alias kiểu cũ trong khi nhà cung cấp chuyển sang
  các hook catalog, auth, thinking, replay và transport rõ ràng
- alias runtime cũ như `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, và
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` đã ngừng hỗ trợ
- các trường callback phẳng của WhatsApp `WebInboundMessage` như `body`, `chatId`,
  `reply(...)`, và `mediaPath` trong khi người tiêu thụ callback di chuyển sang các ngữ cảnh lồng nhau
  `WebInboundCallbackMessage` `event`, `payload`, `quote`, `group`, và
  `platform`
- các trường admission cấp cao nhất của WhatsApp `WebInboundMessage` như `from`,
  `conversationId`, `accountId`, `accessControlPassed`, và `chatType` trong khi
  người tiêu thụ callback di chuyển sang envelope `admission`
- đăng ký tách rời Plugin bộ nhớ cũ trong khi Plugin bộ nhớ chuyển sang
  `registerMemoryCapability`
- đăng ký nhà cung cấp embedding riêng cho bộ nhớ cũ trong khi nhà cung cấp embedding
  chuyển sang `api.registerEmbeddingProvider(...)` và
  `contracts.embeddingProviders`
- helper SDK kênh cũ cho schema tin nhắn native, kiểm soát mention,
  định dạng envelope inbound và lồng năng lực phê duyệt
- alias khóa route kênh và helper comparable-target cũ trong khi Plugin
  chuyển sang `openclaw/plugin-sdk/channel-route`
- gợi ý kích hoạt đang được thay bằng quyền sở hữu đóng góp manifest
- fallback runtime `setup-api` trong khi descriptor thiết lập chuyển sang metadata lạnh
  `setup.requiresRuntime: false`
- hook `discovery` của nhà cung cấp trong khi hook catalog nhà cung cấp chuyển sang
  `catalog.run(...)`
- metadata kênh `showConfigured` / `showInSetup` trong khi gói kênh chuyển
  sang `openclaw.channel.exposure`
- khóa cấu hình runtime-policy cũ trong khi doctor di chuyển operator sang
  `agentRuntime`
- fallback metadata cấu hình kênh tích hợp sẵn được tạo trong khi metadata ưu tiên sổ đăng ký
  `channelConfigs` được đưa vào
- cờ env vô hiệu hóa sổ đăng ký Plugin đã lưu và install-migration trong khi
  luồng sửa chữa di chuyển operator sang `openclaw plugins registry --refresh` và
  `openclaw doctor --fix`
- các đường dẫn cấu hình web search, web fetch và x_search thuộc sở hữu Plugin cũ trong khi
  doctor di chuyển chúng sang `plugins.entries.<plugin>.config`
- cấu hình do `plugins.installs` cũ tạo và alias đường dẫn tải Plugin tích hợp sẵn
  trong khi metadata cài đặt chuyển vào sổ cái Plugin do state quản lý

Mã Plugin mới nên ưu tiên thay thế được liệt kê trong sổ đăng ký và trong hướng dẫn migration cụ thể. Plugin hiện có có thể tiếp tục dùng đường dẫn tương thích cho đến khi tài liệu, chẩn đoán và ghi chú phát hành công bố khoảng thời gian loại bỏ.

### Alias Phẳng Callback Inbound WhatsApp

Callback runtime WhatsApp phân phối `WebInboundMessage`: các ngữ cảnh lồng nhau chính tắc
`event`, `payload`, `quote`, `group`, và `platform` cùng với các alias phẳng đã ngừng hỗ trợ cho các trường callback đã phát hành. Mã callback mới nên đọc các ngữ cảnh lồng nhau. Mã tạo tin nhắn callback lồng nhau sạch có thể dùng
`WebInboundCallbackMessage`; listener tương thích vẫn tiêm tin nhắn kiểm thử hoặc Plugin phẳng cũ nên dùng `LegacyFlatWebInboundMessage` hoặc
`WebInboundMessageInput`.

Các alias phẳng vẫn khả dụng đến **2026-08-30**. Khoảng thời gian loại bỏ đó chỉ áp dụng cho việc truy cập alias phẳng; dạng callback lồng nhau là hợp đồng runtime chính tắc. Chú thích TypeScript `@deprecated` trên từng alias phẳng nêu chính xác thay thế lồng nhau của nó. Ví dụ thường gặp:

- `id`, `timestamp`, và `isBatched` chuyển vào `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`, và
  `untrustedStructuredContext` chuyển vào `payload`.
- `to`, `chatId`, các trường sender/self, `sendComposing`, `reply(...)`, và
  `sendMedia(...)` chuyển vào `platform`.
- các trường `replyTo*` chuyển vào `quote`, và các trường subject/participant/mention của nhóm
  chuyển vào `group`.

`payload.untrustedStructuredContext` được trích xuất từ payload nhà cung cấp inbound.
Plugin nên kiểm tra `label`, `source`, và `type` trước khi xem
`payload` của nó là có thẩm quyền.

### Trường Admission Inbound WhatsApp

Tin nhắn callback WhatsApp được chấp nhận giờ mang `admission`, một envelope an toàn cho public cho quyết định kiểm soát truy cập đã cho phép tin nhắn. Mã callback mới nên đọc các dữ kiện admission từ `msg.admission` thay vì các trường admission cấp cao nhất cũ hơn.

Các trường cấp cao nhất vẫn khả dụng đến **2026-08-30**. Chú thích TypeScript
`@deprecated` nêu từng thay thế:

- `from` và `conversationId` chuyển sang `admission.conversation.id`.
- `accountId` chuyển sang `admission.accountId`.
- `accessControlPassed` là một chế độ xem tương thích được suy ra từ
  `admission.ingress.decision === "allow"`; trên tin nhắn đã mang
  `admission`, việc ghi boolean cũ không ghi lại đồ thị ingress.
- `chatType` chuyển sang `admission.conversation.kind`.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các ngừng hỗ trợ Plugin sắp tới cùng ngày mục tiêu và liên kết đến tài liệu migration. Cảnh báo đó cần diễn ra trước khi một đường dẫn tương thích chuyển sang `removal-pending` hoặc `removed`.
