---
read_when:
    - Chọn đường dẫn con plugin-sdk phù hợp cho lệnh nhập của Plugin
    - Kiểm tra các đường dẫn con của Plugin đi kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo lĩnh vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-19T05:54:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3fa26ace32ca7e555508ec3869e67bd6ae2e5b3b2bfd0edb050e6d1ebfb61824
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin được cung cấp dưới dạng một tập hợp các đường dẫn con công khai có phạm vi hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo
mục đích. Ba tệp xác định bề mặt này:

- `scripts/lib/plugin-sdk-entrypoints.json`: danh mục điểm vào được duy trì
  mà bản dựng biên dịch.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: các đường dẫn con
  kiểm thử/nội bộ cục bộ trong kho mã nguồn. Các mục xuất của gói là danh mục sau khi loại bỏ danh sách này.
- `src/plugin-sdk/entrypoints.ts`: siêu dữ liệu phân loại cho các
  đường dẫn con không còn được khuyến nghị, các trình trợ giúp tích hợp sẵn được dành riêng, các facade tích hợp sẵn được hỗ trợ và
  các bề mặt công khai do plugin sở hữu.

Người bảo trì kiểm tra số lượng mục xuất công khai bằng `pnpm plugin-sdk:surface` và
các đường dẫn con của trình trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
các mục xuất của trình trợ giúp dành riêng không được sử dụng khiến báo cáo CI thất bại thay vì tiếp tục tồn tại trong
SDK công khai như khoản nợ tương thích không hoạt động.

Để xem hướng dẫn tạo plugin, hãy đọc [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview).

## Điểm vào của plugin

| Đường dẫn con                  | Các mục xuất chính                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Các trình trợ giúp mục của nhà cung cấp di chuyển như `createMigrationItem`, các hằng số lý do, dấu trạng thái mục, trình trợ giúp biên tập và `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Các trình trợ giúp di chuyển thời gian chạy như `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Các kiểu đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng và phát hiện của quy trình kiểm tra tình trạng Doctor dành cho các thành phần tích hợp sẵn sử dụng dữ liệu tình trạng                                                                                |
| `plugin-sdk/config-schema`     | Không còn được khuyến nghị. Lược đồ Zod `openclaw.json` gốc (`OpenClawSchema`); thay vào đó, hãy định nghĩa các lược đồ cục bộ của plugin và xác thực bằng `plugin-sdk/json-schema-runtime`                                                  |

### Các trình trợ giúp kiểm thử và tương thích không còn được khuyến nghị

Các đường dẫn con không còn được khuyến nghị vẫn được xuất cho các plugin cũ, nhưng mã mới nên sử dụng
các đường dẫn con SDK chuyên biệt bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các lệnh nhập
dùng trong môi trường sản xuất từ các plugin tích hợp sẵn thuộc danh sách này. Các barrel rộng như `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` và
`plugin-sdk/text-runtime` chỉ dành cho khả năng tương thích, còn `plugin-sdk/zod` là một
mục tái xuất tương thích: nhập trực tiếp `zod` từ `zod`. Các
barrel miền rộng `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` và
`plugin-sdk/security-runtime` cũng không còn được khuyến nghị và nên được thay thế bằng các
đường dẫn con chuyên biệt.

Các đường dẫn con của trình trợ giúp kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong kho mã nguồn và
không còn là các mục xuất của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` và `testing`. Các bề mặt trình trợ giúp tích hợp sẵn riêng tư
`ssrf-runtime-internal` và `codex-native-task-runtime` cũng chỉ dùng cục bộ
trong kho mã nguồn.

### Các đường dẫn con của trình trợ giúp plugin tích hợp sẵn được dành riêng

`plugin-sdk/codex-mcp-projection` là đường dẫn con được dành riêng duy nhất: một bề mặt
tương thích do plugin sở hữu dành cho plugin Codex tích hợp sẵn, không phải API SDK dùng chung.
Các lệnh nhập plugin xuyên ranh giới chủ sở hữu bị chặn bởi các rào chắn hợp đồng gói và
CI thất bại khi một đường dẫn con được dành riêng không còn được nhập.
`plugin-sdk/codex-native-task-runtime` chỉ dùng cục bộ trong kho mã nguồn và không phải là một mục
xuất của gói.

`src/plugin-sdk/entrypoints.ts` cũng theo dõi các facade tích hợp sẵn được hỗ trợ, tức các điểm vào
SDK được plugin tích hợp sẵn tương ứng hỗ trợ cho đến khi các hợp đồng dùng chung thay thế
chúng: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` và `plugin-sdk/zalouser`. Một số mục trong đó cũng
không còn được khuyến nghị cho mã mới; hãy xem ghi chú của từng hàng bên dưới.

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema được lưu vào bộ nhớ đệm cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Các trình trợ giúp dùng chung cho trình hướng dẫn thiết lập, trình dịch thiết lập, lời nhắc danh sách cho phép và trình tạo trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã ngừng dùng; hãy dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Các trình trợ giúp cấu hình nhiều tài khoản/cổng hành động và trình trợ giúp dự phòng về tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, các trình trợ giúp chuẩn hóa ID tài khoản |
    | `plugin-sdk/account-resolution` | Các trình trợ giúp tra cứu tài khoản và dự phòng về giá trị mặc định |
    | `plugin-sdk/account-helpers` | Các trình trợ giúp chuyên biệt cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Các trình trợ giúp phân tích danh sách cho phép của nhóm truy cập và chẩn đoán nhóm đã lược bỏ thông tin nhạy cảm |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các thành phần nguyên thủy của schema cấu hình kênh dùng chung, cùng với Zod và các trình tạo JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Các schema cấu hình kênh OpenClaw đi kèm, chỉ dành cho các plugin đi kèm được bảo trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Các ID kênh trò chuyện chính tắc đi kèm/chính thức, cùng với nhãn/bí danh của trình định dạng dành cho các plugin cần nhận diện văn bản có tiền tố phong bì mà không phải mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã ngừng dùng cho các schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Việc chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột đã ngừng dùng; trong mã plugin mới, hãy dùng cách xử lý cấu hình lệnh cục bộ của plugin |
    | `plugin-sdk/command-gating` | Các trình trợ giúp chuyên biệt cho cổng ủy quyền lệnh |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Trình phân giải runtime đầu vào kênh cấp cao đang thử nghiệm, trình phân giải chính sách đề cập ngầm định và trình tạo dữ kiện định tuyến cho các đường dẫn nhận kênh đã di chuyển. Nên dùng thành phần này thay vì tự lắp ráp danh sách cho phép hiệu lực, danh sách cho phép lệnh và các phép chiếu cũ trong từng plugin. Xem [API đầu vào kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Các hợp đồng vòng đời tin nhắn, cùng với tùy chọn pipeline phản hồi, biên nhận, bản xem trước trực tiếp/truyền phát, trình trợ giúp vòng đời, danh tính gửi đi, lập kế hoạch tải trọng, lượt gửi bền vững và trình trợ giúp ngữ cảnh gửi tin nhắn. Xem [API đầu ra kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã ngừng dùng cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích đã ngừng dùng cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Các trình trợ giúp dùng chung để tạo tuyến đầu vào và phong bì |
    | `plugin-sdk/inbound-reply-dispatch` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-inbound` cho trình chạy đầu vào và vị từ điều phối, đồng thời dùng `plugin-sdk/channel-outbound` cho các trình trợ giúp phân phối tin nhắn. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích đích đã ngừng dùng; hãy dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Các trình trợ giúp dùng chung để tải phương tiện gửi đi và quản lý trạng thái phương tiện được lưu trữ |
    | `plugin-sdk/outbound-send-deps` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Các trình trợ giúp chuyên biệt để chuẩn hóa cuộc thăm dò ý kiến |
    | `plugin-sdk/thread-bindings-runtime` | Các trình trợ giúp cho vòng đời liên kết luồng và bộ điều hợp |
    | `plugin-sdk/agent-media-payload` | Các gốc và trình tải tải trọng phương tiện của tác nhân |
    | `plugin-sdk/conversation-runtime` | Mô-đun xuất tổng hợp rộng đã ngừng dùng cho liên kết cuộc hội thoại/luồng, ghép cặp và các trình trợ giúp liên kết đã cấu hình; nên dùng các đường dẫn con liên kết chuyên biệt như `plugin-sdk/thread-bindings-runtime` và `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Các trình trợ giúp phân giải chính sách nhóm trong runtime |
    | `plugin-sdk/channel-status` | Các trình trợ giúp dùng chung cho ảnh chụp nhanh/tóm tắt trạng thái kênh |
    | `plugin-sdk/channel-config-primitives` | Các thành phần nguyên thủy chuyên biệt của schema cấu hình kênh |
    | `plugin-sdk/channel-config-writes` | Các trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các mục xuất mở đầu dùng chung của plugin kênh |
    | `plugin-sdk/allowlist-config-edit` | Các trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Các trình trợ giúp quyết định quyền truy cập nhóm đã ngừng dùng; hãy dùng `resolveChannelMessageIngress` từ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Các lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Các trình trợ giúp chính sách bảo vệ chuyên biệt trước bước mã hóa cho tin nhắn trực tiếp |
    | `plugin-sdk/discord` | Lớp tương thích Discord đã ngừng dùng cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích của chủ sở hữu được theo dõi; các plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Lớp tương thích phân giải tài khoản Telegram đã ngừng dùng cho khả năng tương thích của chủ sở hữu được theo dõi; các plugin mới nên dùng các trình trợ giúp runtime được chèn hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Lớp tương thích Zalo Personal đã ngừng dùng cho các gói Lark/Zalo đã phát hành vẫn nhập chức năng ủy quyền lệnh của người gửi; các plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/interactive-runtime` | Các trình trợ giúp trình bày, phân phối tin nhắn theo ngữ nghĩa và phản hồi tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Phân giải các lựa chọn `ask_user` do runtime tạo thông qua Gateway từ các trình xử lý tương tác kênh |
    | `plugin-sdk/channel-inbound` | Các trình trợ giúp đầu vào dùng chung cho phân loại sự kiện, tạo ngữ cảnh, định dạng, gốc, chống dội, đối sánh lượt đề cập, chính sách đề cập và ghi nhật ký đầu vào |
    | `plugin-sdk/channel-inbound-debounce` | Các trình trợ giúp chống dội đầu vào chuyên biệt |
    | `plugin-sdk/channel-mention-gating` | Các trình trợ giúp chuyên biệt cho chính sách đề cập, dấu đề cập và văn bản đề cập mà không bao gồm bề mặt runtime đầu vào rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Các lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Lớp tương thích đã ngừng dùng. Hãy dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Các kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Các trình trợ giúp hành động tin nhắn kênh, cùng với các trình trợ giúp schema gốc đã ngừng dùng nhưng vẫn được giữ lại để tương thích với plugin |
    | `plugin-sdk/channel-route` | Các trình trợ giúp dùng chung để chuẩn hóa tuyến, phân giải đích dựa trên trình phân tích, chuyển ID luồng thành chuỗi, tạo khóa tuyến chống trùng lặp/thu gọn, kiểu đích đã phân tích và so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Các trình trợ giúp phân tích đích; các bên gọi chức năng so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Các kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/cảm xúc |
  </Accordion>

Các nhóm hàm trợ giúp kênh đã lỗi thời chỉ tiếp tục khả dụng để duy trì khả năng tương thích với các plugin đã phát hành. Kế hoạch loại bỏ là: giữ chúng trong suốt giai đoạn chuyển đổi plugin bên ngoài, duy trì các plugin trong kho/đi kèm trên `channel-inbound` và `channel-outbound`, sau đó loại bỏ các đường dẫn con tương thích trong đợt dọn dẹp SDK lớn tiếp theo. Điều này áp dụng cho các nhóm cũ về thông báo/thời gian chạy của kênh, truyền phát kênh, truy cập DM trực tiếp, các hàm trợ giúp đầu vào bị phân tách, tùy chọn trả lời và đường dẫn ghép nối.

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho việc thiết lập, khám phá danh mục và chuẩn bị mô hình khi chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho các giá trị mặc định của máy chủ cục bộ, khám phá mô hình, header yêu cầu và các helper cho mô hình đã tải |
    | `plugin-sdk/provider-setup` | Các helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Các helper thiết lập tự lưu trữ tương thích với OpenAI đã lỗi thời; hãy dùng `plugin-sdk/provider-setup` hoặc các helper thiết lập do plugin sở hữu |
    | `plugin-sdk/cli-backend` | Các giá trị mặc định của backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Các helper runtime xác thực nhà cung cấp: luồng OAuth loopback, trao đổi token, lưu trạng thái xác thực và phân giải khóa API |
    | `plugin-sdk/provider-oauth-runtime` | Các kiểu callback OAuth chung cho nhà cung cấp, kết xuất trang callback, helper PKCE/trạng thái, phân tích đầu vào ủy quyền, helper hết hạn token và helper hủy |
    | `plugin-sdk/provider-auth-api-key` | Các helper hướng dẫn ban đầu/ghi hồ sơ bằng khóa API, chẳng hạn như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình tạo kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Các helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, các helper nhập xác thực OpenAI Codex, mục xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, các trình tạo chính sách phát lại dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa ID mô hình dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Các helper danh mục mô hình nhà cung cấp trực tiếp cho hoạt động khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc ID mô hình, bộ nhớ đệm TTL và phương án dự phòng tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime tăng cường danh mục nhà cung cấp và các điểm nối sổ đăng ký nhà cung cấp plugin cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Các helper khả năng HTTP/endpoint chung của nhà cung cấp, lỗi HTTP của nhà cung cấp và helper biểu mẫu multipart để phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Các helper hợp đồng cấu hình/lựa chọn tìm nạp web phạm vi hẹp, chẳng hạn như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Các helper đăng ký/bộ nhớ đệm nhà cung cấp tìm nạp web |
    | `plugin-sdk/provider-web-search-config-contract` | Các helper cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp cho những nhà cung cấp không cần nối dây kích hoạt plugin |
    | `plugin-sdk/provider-web-search-contract` | Các helper hợp đồng cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp, chẳng hạn như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, cùng các setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Các helper đăng ký/bộ nhớ đệm/runtime của nhà cung cấp tìm kiếm web |
    | `plugin-sdk/embedding-providers` | Các kiểu nhà cung cấp embedding chung và helper đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; plugin đăng ký nhà cung cấp thông qua `api.registerEmbeddingProvider(...)` để bảo đảm quyền sở hữu manifest được thực thi |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán cho DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Các kiểu ảnh chụp nhanh mức sử dụng nhà cung cấp, helper tìm nạp mức sử dụng dùng chung và các trình tìm nạp nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, các kiểu wrapper luồng, khả năng tương thích lệnh gọi công cụ văn bản thuần túy và các helper wrapper dùng chung cho Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Các helper wrapper luồng nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và các tiện ích luồng tương thích với Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Các helper vận chuyển gốc của nhà cung cấp, chẳng hạn như tìm nạp có bảo vệ, trích xuất văn bản kết quả công cụ, chuyển đổi thông điệp vận chuyển và luồng sự kiện vận chuyển có thể ghi |
    | `plugin-sdk/provider-onboard` | Các helper vá cấu hình hướng dẫn ban đầu |
    | `plugin-sdk/global-singleton` | Các helper singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Các helper phân tích lệnh và chế độ kích hoạt nhóm phạm vi hẹp |
  </Accordion>

Ảnh chụp nhanh mức sử dụng nhà cung cấp thường báo cáo một hoặc nhiều hạn mức `windows`, mỗi hạn mức có
nhãn, phần trăm đã sử dụng và thời gian đặt lại tùy chọn. Những nhà cung cấp cung cấp văn bản về số dư hoặc
trạng thái tài khoản thay vì các khoảng hạn mức có thể đặt lại nên trả về
`summary` với mảng `windows` trống thay vì tạo phần trăm giả.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng gặp lỗi hoặc không trả về dữ liệu mức sử dụng khả dụng.

  <Accordion title="Các đường dẫn con về xác thực và bảo mật">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | Bề mặt ủy quyền lệnh rộng đã lỗi thời (`resolveControlCommandGate`, các helper sổ đăng ký lệnh bao gồm định dạng menu đối số động, các helper ủy quyền người gửi); hãy dùng ủy quyền đầu vào kênh/runtime hoặc các helper trạng thái lệnh |
    | `plugin-sdk/command-status` | Các trình tạo thông báo lệnh/trợ giúp, chẳng hạn như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Các helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các helper hồ sơ/bộ lọc phê duyệt thực thi gốc |
    | `plugin-sdk/approval-delivery-runtime` | Các adapter khả năng/phân phối phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-reference-runtime` | Helper định vị bền vững có tính xác định cho callback phê duyệt bị giới hạn bởi phương thức vận chuyển |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các helper tải adapter phê duyệt gốc nhẹ cho các điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Các helper runtime xử lý phê duyệt rộng hơn; ưu tiên các điểm nối adapter/Gateway hẹp hơn khi chúng đáp ứng đủ |
    | `plugin-sdk/approval-native-runtime` | Các helper đích phê duyệt gốc, liên kết tài khoản, cổng định tuyến, phương án dự phòng chuyển tiếp và ngăn lời nhắc thực thi gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Các liên kết phản ứng phê duyệt được mã hóa cứng, payload lời nhắc phản ứng, kho lưu trữ đích phản ứng, helper văn bản gợi ý phản ứng và mục xuất tương thích để ngăn lời nhắc thực thi gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Các helper payload trả lời phê duyệt thực thi/plugin |
    | `plugin-sdk/approval-runtime` | Các helper payload phê duyệt thực thi/plugin, trình tạo khả năng phê duyệt, helper xác thực/hồ sơ phê duyệt, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Các helper đặt lại chống trùng lặp câu trả lời đến phạm vi hẹp đã lỗi thời |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và các helper đích phiên gốc |
    | `plugin-sdk/command-detection` | Các helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Các vị từ văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Các helper chuẩn hóa nội dung lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Các helper luồng đăng nhập xác thực nhà cung cấp được tải trì hoãn để ghép đôi bằng mã thiết bị cho kênh riêng tư và giao diện web |
    | `plugin-sdk/channel-secret-runtime` | Bề mặt hợp đồng bí mật rộng đã lỗi thời (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, các kiểu đích bí mật); ưu tiên các đường dẫn con tập trung bên dưới |
    | `plugin-sdk/channel-secret-basic-runtime` | Các mục xuất hợp đồng bí mật phạm vi hẹp và trình tạo sổ đăng ký đích cho các bề mặt bí mật kênh/plugin không phải TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Các helper gán bí mật TTS cho kênh lồng nhau phạm vi hẹp |
    | `plugin-sdk/secret-ref-runtime` | Kiểu SecretRef phạm vi hẹp, phân giải và tra cứu đường dẫn đích kế hoạch để phân tích hợp đồng bí mật/cấu hình |
    | `plugin-sdk/secret-provider-integration` | Hợp đồng preset và manifest tích hợp nhà cung cấp SecretRef chỉ dành cho kiểu, dành cho các plugin công bố preset nhà cung cấp bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Barrel rộng đã lỗi thời cho độ tin cậy, cổng DM, các helper tệp/đường dẫn bị giới hạn ở thư mục gốc bao gồm ghi chỉ-tạo-mới, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, phương án dự phòng di chuyển liên thiết bị, helper kho tệp riêng tư, bộ bảo vệ thư mục cha là liên kết tượng trưng, nội dung bên ngoài, che thông tin nhạy cảm trong văn bản, so sánh bí mật theo thời gian hằng định và helper thu thập bí mật; ưu tiên các đường dẫn con tập trung về bảo mật/SSRF/bí mật |
    | `plugin-sdk/ssrf-policy` | Các helper danh sách cho phép máy chủ và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Các helper dispatcher được ghim phạm vi hẹp không kèm bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Các helper dispatcher được ghim, tìm nạp có bảo vệ SSRF, lỗi SSRF và chính sách SSRF |
    | `plugin-sdk/secret-input` | Các helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các helper yêu cầu/đích Webhook và ép kiểu websocket/nội dung thô |
    | `plugin-sdk/webhook-request-guards` | Các helper kích thước/thời gian chờ nội dung yêu cầu và `runDetachedWebhookWork` cho quá trình xử lý sau xác nhận có theo dõi |
  </Accordion>

  <Accordion title="Các đường dẫn con runtime và lưu trữ">
    | Đường dẫn con | Các nội dung xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp runtime/ghi nhật ký/sao lưu, cảnh báo đường dẫn cài đặt plugin và trình trợ giúp tiến trình |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp phạm vi hẹp cho môi trường runtime, trình ghi nhật ký, thời gian chờ, thử lại và thời gian chờ lũy tiến |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các trình trợ giúp chung cho vòng đời tác vụ và chuyển giao khi hoàn tất dành cho các agent dựa trên harness sử dụng phạm vi tác vụ do máy chủ cấp |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp Codex đi kèm được dành riêng để ánh xạ cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp Codex đi kèm cục bộ trong repo dành cho kết nối runtime/bản sao tác vụ gốc; không phải nội dung xuất của gói |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp chung để đăng ký và tra cứu ngữ cảnh runtime của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng dùng dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng dùng dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel phạm vi rộng đã ngừng dùng cho các trình trợ giúp lệnh/hook/http/tương tác của plugin; ưu tiên các đường dẫn con runtime plugin chuyên biệt |
    | `plugin-sdk/hook-runtime` | Barrel phạm vi rộng đã ngừng dùng cho các trình trợ giúp pipeline webhook/hook nội bộ; ưu tiên các đường dẫn con runtime hook/plugin chuyên biệt |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp nhập/liên kết runtime trì hoãn như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/node-host` | Các trình trợ giúp phân giải tệp thực thi trên máy chủ Node và tiếp tục PTY |
    | `plugin-sdk/cli-runtime` | Barrel phạm vi rộng đã ngừng dùng cho các trình trợ giúp định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh trì hoãn; ưu tiên các đường dẫn con CLI/runtime chuyên biệt |
    | `plugin-sdk/qa-runner-runtime` | Facade được hỗ trợ để cung cấp các kịch bản QA của plugin qua bề mặt lệnh CLI |
    | `plugin-sdk/tts-runtime` | Facade được hỗ trợ cho các lược đồ cấu hình chuyển văn bản thành giọng nói và trình trợ giúp runtime |
    | `plugin-sdk/gateway-method-runtime` | Trình trợ giúp điều phối phương thức Gateway dành riêng cho các tuyến HTTP của plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trình trợ giúp khởi động máy khách sẵn sàng cho vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway, phân giải máy chủ LAN được quảng bá và trình trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chuyên biệt chỉ dành cho kiểu của các hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các trình trợ giúp cấu hình plugin trong runtime như `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Các chuỗi gợi ý siêu dữ liệu chuyển giao dùng chung cho công cụ nhắn tin |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp ảnh chụp nhanh cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các trình thiết lập ảnh chụp nhanh kiểm thử |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản phạm vi rộng |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp runtime dùng chung cho tin nhắn đến/phản hồi, chia đoạn, điều phối, Heartbeat và bộ lập kế hoạch phản hồi |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp chuyên biệt để điều phối/hoàn tất phản hồi và gắn nhãn cuộc trò chuyện |
    | `plugin-sdk/reply-history` | Các trình trợ giúp dùng chung cho lịch sử phản hồi trong khoảng thời gian ngắn. Mã lượt tin nhắn mới nên sử dụng `createChannelHistoryWindow`; các trình trợ giúp bản đồ cấp thấp chỉ còn là nội dung xuất tương thích đã ngừng dùng |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp chuyên biệt để chia đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp quy trình phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), trình trợ giúp sửa chữa/vòng đời (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), trình trợ giúp dấu đánh dấu cho các giá trị `sessionFile` chuyển tiếp, thao tác đọc văn bản bản chép lời gần đây của người dùng/trợ lý có giới hạn theo danh tính phiên, trình trợ giúp đường dẫn kho phiên/khóa phiên và thao tác đọc thời điểm cập nhật, không nhập các thao tác ghi/bảo trì cấu hình phạm vi rộng |
    | `plugin-sdk/session-transcript-runtime` | Danh tính bản chép lời, con trỏ thô và hiển thị có giới hạn, trình trợ giúp đích/đọc/ghi theo phạm vi, phép chiếu mục tin nhắn hiển thị, phát hành cập nhật, khóa ghi và khóa trúng bộ nhớ bản chép lời |
    | `plugin-sdk/sqlite-runtime` | Các trình trợ giúp chuyên biệt cho lược đồ agent SQLite, đường dẫn và giao dịch dành cho runtime chính chủ, không bao gồm điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/cron-store-runtime` | Các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Các hợp đồng trạng thái theo khóa trong phạm vi plugin, BLOB và lease SQLite phối hợp, cùng với pragma kết nối, bảo trì WAL đã xác minh và trình trợ giúp di chuyển lược đồ STRICT nguyên tử. Các callback lease nhận tín hiệu hủy và lỗi có kiểu giúp phân biệt thời gian chờ, hủy, mất quyền sở hữu, dữ liệu đầu vào không hợp lệ và lỗi lưu trữ |
    | `plugin-sdk/routing` | Các trình trợ giúp liên kết tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp dùng chung để tóm tắt trạng thái kênh/tài khoản, giá trị mặc định của trạng thái runtime và siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp dùng chung để phân giải đích |
    | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ dữ liệu đầu vào kiểu fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số chung cho công cụ/CLI |
    | `plugin-sdk/tool-plugin` | Định nghĩa plugin công cụ agent đơn giản có kiểu và cung cấp siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ các đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/sandbox` | Các kiểu backend sandbox và trình trợ giúp lệnh SSH/OpenShell, bao gồm kiểm tra trước lệnh thực thi để dừng ngay khi lỗi |
    | `plugin-sdk/temp-path` | Các trình trợ giúp dùng chung cho đường dẫn tải xuống tạm thời và không gian làm việc tạm thời riêng tư, bảo mật |
    | `plugin-sdk/logging-core` | Các trình trợ giúp ghi nhật ký và che dữ liệu của hệ thống con |
    | `plugin-sdk/markdown-table-runtime` | Chế độ bảng Markdown và các trình trợ giúp chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trình trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Các trình trợ giúp phân tích cú pháp JSON bảo toàn các literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các trình trợ giúp khóa tệp tái nhập cùng khả năng Doctor thu hồi an toàn các tệp sidecar khóa đã ngừng sử dụng, chắc chắn cũ và không thay đổi |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp bộ nhớ đệm loại bỏ trùng lặp dựa trên đĩa |
    | `plugin-sdk/ingress-effect-once` | Bộ bảo vệ claim/commit bền vững cho các tác dụng phụ đầu vào không lũy đẳng |
    | `plugin-sdk/acp-runtime` | Các trình trợ giúp runtime/phiên ACP và điều phối phản hồi |
    | `plugin-sdk/acp-runtime-backend` | Các trình trợ giúp nhẹ để đăng ký backend ACP và điều phối phản hồi cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không nhập chức năng khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các thành phần cơ bản của lược đồ cấu hình runtime agent đã ngừng dùng; nhập các thành phần cơ bản của lược đồ từ bề mặt do plugin được duy trì sở hữu |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean linh hoạt |
    | `plugin-sdk/dangerous-name-runtime` | Các trình trợ giúp phân giải đối sánh tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp khởi tạo thiết bị và token ghép nối, bao gồm `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Các thành phần trợ giúp cơ bản dùng chung cho kênh thụ động, trạng thái và proxy nền |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp phản hồi lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp sổ đăng ký/tạo/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt plugin đáng tin cậy thử nghiệm dành cho các harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch runtime, phân loại kết quả đầu cuối, trình trợ giúp định dạng/chi tiết tiến độ công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện điểm cuối do nhà cung cấp Z.AI sở hữu đã ngừng dùng; sử dụng API công khai của plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa bất đồng bộ cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp đo từ xa hoạt động của kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp giới hạn mức đồng thời của tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp bộ nhớ đệm loại bỏ trùng lặp trong bộ nhớ và có lớp lưu trữ bền vững |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp xả các lượt chuyển giao đang chờ gửi đi |
    | `plugin-sdk/file-access-runtime` | Các trình trợ giúp đường dẫn an toàn cho tệp cục bộ và nguồn phương tiện |
    | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp đánh thức, sự kiện và khả năng hiển thị của Heartbeat |
    | `plugin-sdk/expect-runtime` | Trình trợ giúp khẳng định giá trị bắt buộc cho các bất biến runtime có thể chứng minh |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ trạng thái sẵn sàng của lớp truyền tải |
    | `plugin-sdk/exec-approvals-runtime` | Các trình trợ giúp tệp chính sách phê duyệt thực thi mà không cần barrel infra-runtime phạm vi rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng dùng; sử dụng các đường dẫn con runtime chuyên biệt ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh theo dõi |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trình trợ giúp dùng chung để phân loại lỗi, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Các trình trợ giúp fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Các trình trợ giúp làm sạch URL dữ liệu hình ảnh nội tuyến và dò chữ ký mà không cần bề mặt runtime phương tiện phạm vi rộng |
    | `plugin-sdk/response-limit-runtime` | Các trình đọc phần thân phản hồi bị giới hạn theo byte, thời gian nhàn rỗi và thời hạn mà không cần bề mặt runtime phương tiện phạm vi rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết cuộc trò chuyện hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật phạm vi rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp chuyên biệt cơ bản để ép kiểu và chuẩn hóa bản ghi/chuỗi mà không nhập markdown/ghi nhật ký |
    | `plugin-sdk/html-entity-runtime` | Giải mã thực thể HTML5 kết thúc bằng dấu chấm phẩy trong một lượt mà không cần các tiện ích văn bản phạm vi rộng |
    | `plugin-sdk/text-utility-runtime` | Các trình trợ giúp văn bản và đường dẫn cấp thấp, bao gồm thoát năm thực thể HTML |
    | `plugin-sdk/widget-html` | Phát hiện tài liệu hoàn chỉnh, xác thực kích thước và lỗi đầu vào công cụ cho các tiện ích HTML độc lập |
    | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Barrel phạm vi rộng đã ngừng dùng cho các trình trợ giúp thư mục/danh tính/không gian làm việc của agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và nội dung xuất tương thích `resolveOpenClawAgentDir` đã ngừng dùng; ưu tiên các đường dẫn con agent/runtime chuyên biệt |
    | `plugin-sdk/directory-runtime` | Truy vấn/loại bỏ trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về khả năng và kiểm thử">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel phương tiện rộng đã lỗi thời, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã lỗi thời; ưu tiên `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` và các đường dẫn con runtime khả năng, đồng thời ưu tiên các trình trợ giúp kho lưu trữ trước khi đọc bộ đệm khi một URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Các trình trợ giúp phạm vi hẹp để chuẩn hóa MIME, ánh xạ phần mở rộng tệp, phát hiện MIME và xác định loại phương tiện |
    | `plugin-sdk/media-store` | Các trình trợ giúp kho phương tiện phạm vi hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các trình trợ giúp chuyển đổi dự phòng dùng chung cho việc tạo phương tiện, lựa chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp khả năng hiểu phương tiện cùng các mục xuất trình trợ giúp xử lý hình ảnh/âm thanh/trích xuất có cấu trúc dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Phân đoạn văn bản gửi đi và phạm vi có bảo toàn độ lệch, phân đoạn markdown/các trình trợ giúp kết xuất, token hóa thẻ HTML có nhận biết dấu ngoặc kép, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và các tiện ích văn bản an toàn |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các mục xuất chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI và trình trợ giúp giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa và mục xuất trình trợ giúp giọng nói dùng chung |
    | `plugin-sdk/speech-settings` | Các phần tử cơ sở để phân giải và chuẩn hóa cấu hình TTS nhẹ, không có registry nhà cung cấp hoặc runtime tổng hợp |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Trình trợ giúp khởi tạo hồ sơ thời gian thực để chèn ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp thoại thời gian thực, trình trợ giúp registry, cổng năng lượng âm thanh/khởi phát lời nói dùng chung và trình trợ giúp hành vi thoại thời gian thực, bao gồm bộ khung phiên độc lập với phương thức vận chuyển và theo dõi hoạt động đầu ra |
    | `plugin-sdk/meeting-runtime` | Runtime phiên họp trên trình duyệt, engine/phương thức vận chuyển âm thanh thời gian thực, `MeetingPlatformAdapter`, điều khiển trình duyệt/node, tham vấn tác tử, ủy quyền cuộc gọi thoại, kiểm tra thiết lập và trình trợ giúp lệnh SoX |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL dữ liệu/tài sản hình ảnh và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh, chuyển đổi dự phòng, xác thực và trình trợ giúp registry dùng chung |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình đã lỗi thời; ưu tiên các bề mặt nhà cung cấp nhạc do plugin sở hữu |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình dùng chung |
    | `plugin-sdk/transcripts` | Các kiểu nhà cung cấp nguồn bản chép lời, trình trợ giúp registry, bộ mô tả phiên và siêu dữ liệu phát ngôn dùng chung |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và trình trợ giúp cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các trình trợ giúp dùng chung để tải phương tiện từ xa/cục bộ |
    | `plugin-sdk/zod` | Mục tái xuất tương thích đã lỗi thời; nhập trực tiếp `zod` từ `zod` |
    | `plugin-sdk/plugin-test-api` | Trình trợ giúp `createTestPluginApi` tối thiểu, cục bộ trong repo, dành cho kiểm thử đơn vị đăng ký plugin trực tiếp mà không nhập các cầu nối trình trợ giúp kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng bộ điều hợp runtime tác tử gốc, cục bộ trong repo, dành cho kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, schema và phép chiếu bản chép lời |
    | `plugin-sdk/channel-test-helpers` | Các trình trợ giúp kiểm thử hướng kênh, cục bộ trong repo, dành cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, truyền luồng cấu hình gửi, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi phân giải đích dùng chung, cục bộ trong repo, dành cho kiểm thử kênh |
    | `plugin-sdk/channel-contract-testing` | Các trình trợ giúp kiểm thử hợp đồng kênh phạm vi hẹp, cục bộ trong repo, không có barrel kiểm thử rộng |
    | `plugin-sdk/plugin-test-contracts` | Các trình trợ giúp hợp đồng gói plugin, đăng ký, tạo tác công khai, nhập trực tiếp, API runtime và tác dụng phụ khi nhập, cục bộ trong repo |
    | `plugin-sdk/plugin-state-test-runtime` | Các trình trợ giúp kiểm thử kho trạng thái plugin, hàng đợi đầu vào và cơ sở dữ liệu trạng thái, cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Các trình trợ giúp hợp đồng runtime nhà cung cấp, xác thực, khám phá, hướng dẫn ban đầu, danh mục, trình hướng dẫn, khả năng phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải web và luồng, cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Các mock HTTP/xác thực Vitest tùy chọn, cục bộ trong repo, dành cho kiểm thử nhà cung cấp sử dụng `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Các trình trợ giúp cục bộ trong repo để đính kèm siêu dữ liệu vào fixture payload phản hồi |
    | `plugin-sdk/sqlite-runtime-testing` | Các trình trợ giúp vòng đời SQLite cục bộ trong repo dành cho kiểm thử chính chủ |
    | `plugin-sdk/test-fixtures` | Các fixture cục bộ trong repo cho việc ghi lại runtime CLI chung, ngữ cảnh sandbox, trình ghi skill, thông điệp tác tử, sự kiện hệ thống, tải lại mô-đun, đường dẫn plugin đóng gói sẵn, văn bản terminal, phân đoạn, token xác thực và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Các trình trợ giúp mock tích hợp sẵn của Node có trọng tâm, cục bộ trong repo, để sử dụng bên trong các factory `vi.mock("node:*")` của Vitest |
  </Accordion>

  <Accordion title="Các đường dẫn con về bộ nhớ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ đã lỗi thời; ưu tiên các đường dẫn con máy chủ bộ nhớ trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-embedding-registry` | Các trình trợ giúp registry nhà cung cấp embedding bộ nhớ nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các mục xuất engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Các hợp đồng embedding máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và các trình trợ giúp từ xa/theo lô chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã lỗi thời; sử dụng API nhà cung cấp embedding chung cho các nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các mục xuất engine QMD của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các mục xuất engine lưu trữ của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Các trình trợ giúp đa phương thức của máy chủ bộ nhớ đã lỗi thời; ưu tiên các đường dẫn con máy chủ bộ nhớ trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-query` | Các trình trợ giúp truy vấn máy chủ bộ nhớ đã lỗi thời; ưu tiên các đường dẫn con máy chủ bộ nhớ trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-secret` | Các trình trợ giúp bí mật của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Các trình trợ giúp trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Các trình trợ giúp runtime CLI của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Các trình trợ giúp runtime lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Các trình trợ giúp tệp/runtime của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập với nhà cung cấp cho các trình trợ giúp runtime lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập với nhà cung cấp cho các trình trợ giúp nhật ký sự kiện của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Các trình trợ giúp markdown được quản lý dùng chung cho các plugin liên quan đến bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Các đường dẫn con dành riêng cho trình trợ giúp đóng gói sẵn">
    Các đường dẫn con SDK dành riêng cho trình trợ giúp đóng gói sẵn là những bề mặt hẹp dành riêng cho từng chủ sở hữu đối với
    mã plugin đóng gói sẵn. Chúng được theo dõi trong danh mục SDK để quá trình dựng gói
    và đặt bí danh luôn mang tính xác định, nhưng không phải là các API biên soạn plugin
    dùng chung. Các hợp đồng máy chủ có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp plugin Codex đóng gói sẵn để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng máy chủ ứng dụng Codex (mục xuất gói dành riêng) |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp plugin Codex đóng gói sẵn để phản chiếu các tác tử con gốc của máy chủ ứng dụng Codex vào trạng thái tác vụ OpenClaw (chỉ cục bộ trong repo, không phải mục xuất gói) |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về SDK plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
