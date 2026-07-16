---
read_when:
    - Chọn đường dẫn con plugin-sdk phù hợp cho lệnh nhập của Plugin
    - Kiểm tra các đường dẫn con của plugin đi kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo lĩnh vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-16T15:02:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK được cung cấp dưới dạng một tập hợp các đường dẫn con công khai có phạm vi hẹp bên dưới
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo
mục đích. Ba tệp xác định bề mặt này:

- `scripts/lib/plugin-sdk-entrypoints.json`: danh mục điểm vào được duy trì
  mà quá trình xây dựng sẽ biên dịch.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: các đường dẫn con
  kiểm thử/nội bộ cục bộ trong kho mã. Các mục xuất của gói là danh mục sau khi loại trừ danh sách này.
- `src/plugin-sdk/entrypoints.ts`: siêu dữ liệu phân loại cho các
  đường dẫn con đã ngừng khuyến nghị, các trình trợ giúp đi kèm được dành riêng, các facade đi kèm được hỗ trợ và
  các bề mặt công khai do plugin sở hữu.

Người bảo trì kiểm tra số lượng mục xuất công khai bằng `pnpm plugin-sdk:surface` và
các đường dẫn con của trình trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
các mục xuất trình trợ giúp dành riêng không được sử dụng sẽ khiến báo cáo CI thất bại thay vì tiếp tục tồn tại trong
SDK công khai dưới dạng nợ tương thích không hoạt động.

Để xem hướng dẫn tạo plugin, hãy xem [tổng quan về Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào plugin

| Đường dẫn con                  | Các mục xuất chính                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Các trình trợ giúp mục của nhà cung cấp di chuyển như `createMigrationItem`, các hằng số lý do, các dấu trạng thái mục, các trình trợ giúp che dữ liệu và `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Các trình trợ giúp di chuyển thời gian chạy như `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Các kiểu đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng và phát hiện dành cho các thành phần sử dụng kiểm tra tình trạng đi kèm của Doctor                                                                                |
| `plugin-sdk/config-schema`     | Đã ngừng khuyến nghị. Lược đồ Zod `openclaw.json` gốc (`OpenClawSchema`); thay vào đó, hãy định nghĩa các lược đồ cục bộ trong plugin và xác thực bằng `plugin-sdk/json-schema-runtime`                                                  |

### Các trình trợ giúp tương thích và kiểm thử đã ngừng khuyến nghị

Các đường dẫn con đã ngừng khuyến nghị vẫn được xuất cho các plugin cũ, nhưng mã mới nên sử dụng
các đường dẫn con SDK chuyên biệt bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các lệnh nhập
sản xuất đi kèm từ danh sách này. Các barrel rộng như `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` và
`plugin-sdk/text-runtime` chỉ dành cho khả năng tương thích, còn `plugin-sdk/zod` là một
mục tái xuất tương thích: hãy nhập `zod` trực tiếp từ `zod`. Các barrel miền
rộng `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` và
`plugin-sdk/security-runtime` cũng đã ngừng khuyến nghị; hãy ưu tiên các
đường dẫn con chuyên biệt.

Các đường dẫn con của trình trợ giúp kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong kho mã và
không còn là mục xuất của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` và `testing`. Các bề mặt trình trợ giúp đi kèm riêng tư
`ssrf-runtime-internal` và `codex-native-task-runtime` cũng chỉ dùng cục bộ
trong kho mã.

### Các đường dẫn con của trình trợ giúp plugin đi kèm được dành riêng

`plugin-sdk/codex-mcp-projection` là đường dẫn con dành riêng duy nhất: một bề mặt
tương thích do plugin sở hữu dành cho plugin Codex đi kèm, không phải API SDK dùng chung.
Các lệnh nhập plugin xuyên chủ sở hữu bị chặn bởi các rào chắn hợp đồng gói và
CI sẽ thất bại khi một đường dẫn con dành riêng không còn được nhập.
`plugin-sdk/codex-native-task-runtime` chỉ dùng cục bộ trong kho mã và không phải là mục xuất
của gói.

`src/plugin-sdk/entrypoints.ts` cũng theo dõi các facade đi kèm được hỗ trợ, tức các
điểm vào SDK được plugin đi kèm tương ứng hỗ trợ cho đến khi các hợp đồng dùng chung thay thế
chúng: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` và `plugin-sdk/zalouser`. Một số trong đó cũng đã
ngừng khuyến nghị cho mã mới; hãy xem ghi chú theo từng hàng bên dưới.

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema có bộ nhớ đệm dành cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Các trình trợ giúp dùng chung cho trình hướng dẫn thiết lập, trình dịch thiết lập, lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã lỗi thời; sử dụng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Các trình trợ giúp cấu hình nhiều tài khoản/cổng hành động, các trình trợ giúp dự phòng về tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, các trình trợ giúp chuẩn hóa mã định danh tài khoản |
    | `plugin-sdk/account-resolution` | Các trình trợ giúp tra cứu tài khoản và dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Các trình trợ giúp chuyên biệt về danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Các trình trợ giúp phân tích danh sách cho phép của nhóm truy cập và chẩn đoán nhóm đã che thông tin nhạy cảm |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các thành phần cơ sở dùng chung của schema cấu hình kênh, cùng với Zod và các trình dựng JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Các schema cấu hình kênh OpenClaw đi kèm, chỉ dành cho các plugin đi kèm đang được duy trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Các mã định danh kênh trò chuyện đi kèm/chính thức chuẩn tắc, cùng với nhãn/bí danh của trình định dạng dành cho các plugin cần nhận diện văn bản có tiền tố phong bì mà không mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã lỗi thời cho các schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Việc chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột đã lỗi thời; sử dụng cách xử lý cấu hình lệnh cục bộ của plugin trong mã plugin mới |
    | `plugin-sdk/command-gating` | Các trình trợ giúp chuyên biệt cho cổng ủy quyền lệnh |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Trình phân giải runtime tiếp nhận kênh cấp cao đang thử nghiệm và các trình dựng thông tin tuyến cho những đường dẫn nhận kênh đã được di chuyển. Ưu tiên sử dụng thành phần này thay vì tự tập hợp danh sách cho phép có hiệu lực, danh sách lệnh được phép và các phép chiếu cũ trong từng plugin. Xem [API tiếp nhận kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Các hợp đồng vòng đời thông báo, cùng với tùy chọn pipeline phản hồi, biên nhận, bản xem trước trực tiếp/phát trực tuyến, trình trợ giúp vòng đời, danh tính gửi đi, lập kế hoạch tải trọng, gửi bền vững và trình trợ giúp ngữ cảnh gửi thông báo. Xem [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Các trình trợ giúp dùng chung để dựng tuyến nhận vào và phong bì |
    | `plugin-sdk/inbound-reply-dispatch` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-inbound` cho các trình chạy nhận vào và vị từ điều phối, và `plugin-sdk/channel-outbound` cho các trình trợ giúp phân phối thông báo. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích đích đã lỗi thời; sử dụng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Các trình trợ giúp dùng chung để tải phương tiện gửi đi và quản lý trạng thái phương tiện được lưu trữ |
    | `plugin-sdk/outbound-send-deps` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Các trình trợ giúp chuyên biệt để chuẩn hóa cuộc thăm dò ý kiến |
    | `plugin-sdk/thread-bindings-runtime` | Các trình trợ giúp vòng đời và bộ điều hợp cho việc liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Các thư mục gốc và trình tải tải trọng phương tiện của tác tử |
    | `plugin-sdk/conversation-runtime` | Barrel phạm vi rộng đã lỗi thời dành cho liên kết cuộc hội thoại/luồng, ghép nối và các trình trợ giúp liên kết đã cấu hình; ưu tiên các đường dẫn con liên kết chuyên biệt như `plugin-sdk/thread-bindings-runtime` và `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Các trình trợ giúp phân giải chính sách nhóm trong runtime |
    | `plugin-sdk/channel-status` | Các trình trợ giúp dùng chung về ảnh chụp nhanh/tóm tắt trạng thái kênh |
    | `plugin-sdk/channel-config-primitives` | Các thành phần cơ sở chuyên biệt của schema cấu hình kênh |
    | `plugin-sdk/channel-config-writes` | Các trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các mục xuất mở đầu dùng chung của plugin kênh |
    | `plugin-sdk/allowlist-config-edit` | Các trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Các trình trợ giúp quyết định quyền truy cập nhóm đã lỗi thời; sử dụng `resolveChannelMessageIngress` từ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Các lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Các trình trợ giúp chính sách bảo vệ chuyên biệt trước bước mã hóa cho tin nhắn trực tiếp |
    | `plugin-sdk/discord` | Lớp tương thích Discord đã lỗi thời dành cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích của chủ sở hữu đang được theo dõi; các plugin mới nên sử dụng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Lớp tương thích phân giải tài khoản Telegram đã lỗi thời dành cho khả năng tương thích của chủ sở hữu đang được theo dõi; các plugin mới nên sử dụng trình trợ giúp runtime được chèn hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Lớp tương thích Zalo Personal đã lỗi thời dành cho các gói Lark/Zalo đã phát hành vẫn nhập cơ chế ủy quyền lệnh của người gửi; các plugin mới nên sử dụng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/interactive-runtime` | Các trình trợ giúp trình bày thông báo theo ngữ nghĩa, phân phối và phản hồi tương tác cũ. Xem [Trình bày thông báo](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Các trình trợ giúp nhận vào dùng chung cho việc phân loại sự kiện, dựng ngữ cảnh, định dạng, thư mục gốc, chống dội, khớp lượt đề cập, chính sách đề cập và ghi nhật ký nhận vào |
    | `plugin-sdk/channel-inbound-debounce` | Các trình trợ giúp chống dội nhận vào chuyên biệt |
    | `plugin-sdk/channel-mention-gating` | Các trình trợ giúp chuyên biệt về chính sách đề cập, dấu hiệu đề cập và văn bản đề cập mà không bao gồm bề mặt runtime nhận vào rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Các lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Lớp tương thích đã lỗi thời. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Các kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Các trình trợ giúp hành động thông báo của kênh, cùng với các trình trợ giúp schema gốc đã lỗi thời được giữ lại để đảm bảo khả năng tương thích của plugin |
    | `plugin-sdk/channel-route` | Các trình trợ giúp dùng chung về chuẩn hóa tuyến, phân giải đích dựa trên trình phân tích, chuyển mã định danh luồng thành chuỗi, khóa tuyến chống trùng lặp/thu gọn, kiểu đích đã phân tích và so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Các trình trợ giúp phân tích đích; các bên gọi phép so sánh tuyến nên sử dụng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Các kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
  </Accordion>

Các nhóm helper kênh đã ngừng dùng chỉ tiếp tục khả dụng để bảo đảm khả năng
tương thích với các plugin đã phát hành. Kế hoạch loại bỏ là: duy trì chúng trong
suốt khoảng thời gian di chuyển plugin bên ngoài, duy trì các plugin trong repo/đi kèm trên `channel-inbound` và
`channel-outbound`, sau đó loại bỏ các đường dẫn con tương thích trong đợt dọn dẹp lớn tiếp theo của
SDK. Điều này áp dụng cho các nhóm cũ về thông báo/runtime của kênh, truyền phát
kênh, truy cập DM trực tiếp, các helper đầu vào bị phân mảnh, tùy chọn trả lời
và đường dẫn ghép nối.

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ để thiết lập, khám phá danh mục và chuẩn bị mô hình khi chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade thời gian chạy LM Studio được hỗ trợ cho các giá trị mặc định của máy chủ cục bộ, khám phá mô hình, tiêu đề yêu cầu và các trình trợ giúp mô hình đã tải |
    | `plugin-sdk/provider-setup` | Các trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Các trình trợ giúp thiết lập tự lưu trữ tương thích với OpenAI đã lỗi thời; hãy dùng `plugin-sdk/provider-setup` hoặc các trình trợ giúp thiết lập do plugin sở hữu |
    | `plugin-sdk/cli-backend` | Các giá trị mặc định của backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Các trình trợ giúp thời gian chạy xác thực nhà cung cấp: luồng loopback OAuth, trao đổi token, lưu giữ thông tin xác thực và phân giải khóa API |
    | `plugin-sdk/provider-oauth-runtime` | Các kiểu callback OAuth chung của nhà cung cấp, kết xuất trang callback, trình trợ giúp PKCE/trạng thái, phân tích đầu vào ủy quyền, trình trợ giúp hết hạn token và trình trợ giúp hủy |
    | `plugin-sdk/provider-auth-api-key` | Các trình trợ giúp onboarding bằng khóa API/ghi hồ sơ như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình tạo kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Các trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, các trình trợ giúp nhập xác thực OpenAI Codex, mục xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các trình tạo chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa ID mô hình dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Các trình trợ giúp danh mục mô hình nhà cung cấp trực tiếp cho hoạt động khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc ID mô hình, bộ nhớ đệm TTL và phương án dự phòng tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook thời gian chạy bổ sung danh mục nhà cung cấp và các seam registry nhà cung cấp plugin cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Các trình trợ giúp chung về khả năng HTTP/endpoint của nhà cung cấp, lỗi HTTP của nhà cung cấp và trình trợ giúp biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Các trình trợ giúp hợp đồng cấu hình/lựa chọn tìm nạp web phạm vi hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Các trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp tìm nạp web |
    | `plugin-sdk/provider-web-search-config-contract` | Các trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp cho những nhà cung cấp không cần nối dây kích hoạt plugin |
    | `plugin-sdk/provider-web-search-contract` | Các trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và các bộ đặt/lấy thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Các trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy của nhà cung cấp tìm kiếm web |
    | `plugin-sdk/embedding-providers` | Các kiểu nhà cung cấp embedding chung và trình trợ giúp đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; plugin đăng ký nhà cung cấp qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Các kiểu ảnh chụp nhanh mức sử dụng của nhà cung cấp, trình trợ giúp tìm nạp mức sử dụng dùng chung và trình tìm nạp nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, các kiểu trình bao bọc luồng, khả năng tương thích lệnh gọi công cụ văn bản thuần túy và các trình trợ giúp trình bao bọc dùng chung cho Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Các trình trợ giúp trình bao bọc luồng nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và các tiện ích luồng tương thích với Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Các trình trợ giúp vận chuyển gốc của nhà cung cấp như tìm nạp có bảo vệ, trích xuất văn bản kết quả công cụ, chuyển đổi thông điệp vận chuyển và luồng sự kiện vận chuyển có thể ghi |
    | `plugin-sdk/provider-onboard` | Các trình trợ giúp vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Các trình trợ giúp singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Các trình trợ giúp phân tích chế độ kích hoạt nhóm và lệnh phạm vi hẹp |
  </Accordion>

Ảnh chụp nhanh mức sử dụng của nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn ngạch, mỗi mục có
một nhãn, phần trăm đã sử dụng và thời gian đặt lại tùy chọn. Những nhà cung cấp hiển thị số dư hoặc
văn bản trạng thái tài khoản thay vì các cửa sổ hạn ngạch có thể đặt lại nên trả về
`summary` với mảng `windows` trống thay vì tạo phần trăm giả.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng gặp lỗi hoặc không trả về dữ liệu sử dụng khả dụng.

  <Accordion title="Các đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | Bề mặt ủy quyền lệnh rộng đã lỗi thời (`resolveControlCommandGate`, các trình trợ giúp registry lệnh bao gồm định dạng menu đối số động, trình trợ giúp ủy quyền người gửi); hãy dùng ủy quyền đầu vào kênh/thời gian chạy hoặc trình trợ giúp trạng thái lệnh |
    | `plugin-sdk/command-status` | Các trình tạo thông báo lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Các trình trợ giúp phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Các adapter khả năng/chuyển giao phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-reference-runtime` | Trình trợ giúp định vị bền vững có tính xác định cho callback phê duyệt bị giới hạn bởi phương tiện vận chuyển |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các trình trợ giúp nhẹ để tải adapter phê duyệt gốc cho điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Các trình trợ giúp thời gian chạy trình xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Các trình trợ giúp mục tiêu phê duyệt gốc, liên kết tài khoản, cổng định tuyến, phương án dự phòng chuyển tiếp và ngăn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Các liên kết phản ứng phê duyệt được mã hóa cứng, payload lời nhắc phản ứng, kho mục tiêu phản ứng, trình trợ giúp văn bản gợi ý phản ứng và mục xuất tương thích để ngăn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Các trình trợ giúp payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp payload phê duyệt exec/plugin, trình tạo khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ phê duyệt, trình trợ giúp định tuyến/thời gian chạy phê duyệt gốc và trình trợ giúp hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Các trình trợ giúp đặt lại chống trùng lặp phản hồi đến phạm vi hẹp đã lỗi thời |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và trình trợ giúp mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Các trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Các vị từ văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Các trình trợ giúp chuẩn hóa nội dung lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Các trình trợ giúp luồng đăng nhập xác thực nhà cung cấp tải lười cho việc ghép đôi bằng mã thiết bị trong kênh riêng tư và Web UI |
    | `plugin-sdk/channel-secret-runtime` | Bề mặt hợp đồng bí mật rộng đã lỗi thời (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, các kiểu mục tiêu bí mật); ưu tiên các đường dẫn con chuyên biệt bên dưới |
    | `plugin-sdk/channel-secret-basic-runtime` | Các mục xuất hợp đồng bí mật phạm vi hẹp và trình tạo registry mục tiêu cho các bề mặt bí mật kênh/plugin không phải TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Các trình trợ giúp gán bí mật TTS kênh lồng nhau phạm vi hẹp |
    | `plugin-sdk/secret-ref-runtime` | Định kiểu, phân giải và tra cứu đường dẫn mục tiêu kế hoạch SecretRef phạm vi hẹp để phân tích hợp đồng bí mật/cấu hình |
    | `plugin-sdk/secret-provider-integration` | Các hợp đồng manifest và preset tích hợp nhà cung cấp SecretRef chỉ dành cho kiểu đối với plugin công bố preset nhà cung cấp bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Barrel rộng đã lỗi thời cho độ tin cậy, kiểm soát DM, trình trợ giúp tệp/đường dẫn bị giới hạn trong thư mục gốc bao gồm ghi chỉ-tạo, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, phương án dự phòng di chuyển giữa thiết bị, trình trợ giúp kho tệp riêng tư, bộ bảo vệ thư mục cha liên kết tượng trưng, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật theo thời gian không đổi và trình trợ giúp thu thập bí mật; ưu tiên các đường dẫn con bảo mật/SSRF/bí mật chuyên biệt |
    | `plugin-sdk/ssrf-policy` | Danh sách cho phép máy chủ và trình trợ giúp chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Các trình trợ giúp dispatcher được ghim phạm vi hẹp không có bề mặt thời gian chạy hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Dispatcher được ghim, tìm nạp được bảo vệ khỏi SSRF, lỗi SSRF và trình trợ giúp chính sách SSRF |
    | `plugin-sdk/secret-input` | Các trình trợ giúp phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các trình trợ giúp yêu cầu/mục tiêu Webhook và ép kiểu websocket thô/nội dung |
    | `plugin-sdk/webhook-request-guards` | Các trình trợ giúp kích thước/thời gian chờ nội dung yêu cầu và `runDetachedWebhookWork` cho xử lý sau xác nhận có theo dõi |
  </Accordion>

  <Accordion title="Các đường dẫn con của runtime và bộ lưu trữ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp cho runtime/ghi nhật ký/sao lưu, cảnh báo về đường dẫn cài đặt plugin và trình trợ giúp tiến trình |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp phạm vi hẹp cho môi trường runtime, trình ghi nhật ký, thời gian chờ, thử lại và khoảng lùi |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ dành cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các trình trợ giúp chung cho vòng đời tác vụ và phân phối kết quả hoàn tất dành cho các tác nhân dựa trên harness sử dụng phạm vi tác vụ do máy chủ cấp |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp Codex đi kèm được dành riêng để ánh xạ cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp Codex đi kèm, cục bộ trong kho lưu trữ, dành cho việc nối dây runtime/phản chiếu tác vụ gốc; không phải mục xuất của gói |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp chung để đăng ký và tra cứu ngữ cảnh runtime của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã lỗi thời dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel rộng đã lỗi thời dành cho các trình trợ giúp lệnh/hook/http/tương tác của plugin; ưu tiên các đường dẫn con runtime plugin chuyên biệt |
    | `plugin-sdk/hook-runtime` | Barrel rộng đã lỗi thời dành cho các trình trợ giúp Webhook/quy trình hook nội bộ; ưu tiên các đường dẫn con runtime hook/plugin chuyên biệt |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp nhập/liên kết runtime theo kiểu lazy như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/node-host` | Các trình trợ giúp phân giải tệp thực thi trên máy chủ Node và tiếp tục PTY |
    | `plugin-sdk/cli-runtime` | Barrel rộng đã lỗi thời dành cho định dạng CLI, chờ, phiên bản, gọi bằng đối số và các trình trợ giúp nhóm lệnh theo kiểu lazy; ưu tiên các đường dẫn con CLI/runtime chuyên biệt |
    | `plugin-sdk/qa-runner-runtime` | Facade được hỗ trợ để cung cấp các kịch bản QA plugin thông qua bề mặt lệnh CLI |
    | `plugin-sdk/tts-runtime` | Facade được hỗ trợ dành cho các lược đồ cấu hình chuyển văn bản thành giọng nói và trình trợ giúp runtime |
    | `plugin-sdk/gateway-method-runtime` | Trình trợ giúp điều phối phương thức Gateway được dành riêng cho các tuyến HTTP của plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trình trợ giúp khởi động máy khách khi vòng lặp sự kiện sẵn sàng, RPC CLI của Gateway, lỗi giao thức Gateway, phân giải máy chủ LAN được quảng bá và các trình trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ gồm kiểu, chuyên biệt dành cho các hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các trình trợ giúp cấu hình plugin trong runtime như `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Các chuỗi gợi ý siêu dữ liệu phân phối dùng chung của công cụ tin nhắn |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp ảnh chụp nhanh cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các bộ thiết lập ảnh chụp nhanh kiểm thử |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động tạo liên kết cho tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp runtime dùng chung cho tin nhắn đến/phản hồi, chia đoạn, điều phối, Heartbeat, trình lập kế hoạch phản hồi |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp phạm vi hẹp để điều phối/hoàn tất phản hồi và xử lý nhãn cuộc trò chuyện |
    | `plugin-sdk/reply-history` | Các trình trợ giúp lịch sử phản hồi trong khoảng thời gian ngắn dùng chung. Mã lượt tin nhắn mới nên sử dụng `createChannelHistoryWindow`; các trình trợ giúp bản đồ cấp thấp hơn chỉ còn là mục xuất tương thích đã lỗi thời |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp phạm vi hẹp để chia đoạn văn bản/Markdown |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp quy trình phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), trình trợ giúp sửa chữa/vòng đời (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), trình trợ giúp dấu hiệu cho các giá trị `sessionFile` chuyển tiếp, thao tác đọc văn bản bản ghi hội thoại gần đây của người dùng/trợ lý có giới hạn theo danh tính phiên, trình trợ giúp đường dẫn kho phiên/khóa phiên và thao tác đọc thời điểm cập nhật, không nhập các chức năng ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/session-transcript-runtime` | Danh tính bản ghi hội thoại, các trình trợ giúp có phạm vi cho đích/đọc/ghi, phép chiếu mục tin nhắn hiển thị, phát hành cập nhật, khóa ghi và khóa truy cập bộ nhớ bản ghi hội thoại |
    | `plugin-sdk/sqlite-runtime` | Các trình trợ giúp chuyên biệt cho lược đồ tác nhân SQLite, đường dẫn và giao dịch dành cho runtime chính chủ, không có các cơ chế điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/cron-store-runtime` | Các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Các kiểu trạng thái có khóa SQLite sidecar của plugin, cùng các trình trợ giúp tập trung cho pragma kết nối, bảo trì WAL đã xác minh và di chuyển lược đồ STRICT nguyên tử dành cho cơ sở dữ liệu do plugin sở hữu |
    | `plugin-sdk/routing` | Các trình trợ giúp liên kết tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp dùng chung để tóm tắt trạng thái kênh/tài khoản, giá trị mặc định của trạng thái runtime và siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp dùng chung để phân giải đích |
    | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ đầu vào kiểu fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có tính giờ với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số chung cho công cụ/CLI |
    | `plugin-sdk/tool-plugin` | Định nghĩa một plugin công cụ tác nhân có kiểu đơn giản và cung cấp siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất tải trọng đã chuẩn hóa từ các đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/sandbox` | Các kiểu backend sandbox và trình trợ giúp lệnh SSH/OpenShell, bao gồm bước kiểm tra sơ bộ lệnh thực thi theo cơ chế lỗi nhanh |
    | `plugin-sdk/temp-path` | Các trình trợ giúp đường dẫn tải xuống tạm thời dùng chung và không gian làm việc tạm thời riêng tư, an toàn |
    | `plugin-sdk/logging-core` | Trình ghi nhật ký hệ thống con và các trình trợ giúp che dữ liệu |
    | `plugin-sdk/markdown-table-runtime` | Chế độ bảng Markdown và các trình trợ giúp chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trình trợ giúp phân giải cấu hình nhà cung cấp hội thoại |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Các trình trợ giúp phân tích cú pháp JSON bảo toàn các giá trị số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các trình trợ giúp khóa tệp có thể tái nhập |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp bộ nhớ đệm loại bỏ trùng lặp được lưu trên đĩa |
    | `plugin-sdk/acp-runtime` | Các trình trợ giúp runtime/phiên ACP và điều phối phản hồi |
    | `plugin-sdk/acp-runtime-backend` | Các trình trợ giúp gọn nhẹ để đăng ký backend ACP và điều phối phản hồi cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không nhập chức năng khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các phần tử nguyên thủy của lược đồ cấu hình runtime tác nhân đã lỗi thời; nhập các phần tử nguyên thủy của lược đồ từ một bề mặt do plugin được duy trì sở hữu |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean linh hoạt |
    | `plugin-sdk/dangerous-name-runtime` | Các trình trợ giúp phân giải đối sánh tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp khởi tạo thiết bị và mã thông báo ghép nối, bao gồm `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Các phần tử nguyên thủy dùng chung cho trình trợ giúp kênh thụ động, trạng thái và proxy ngữ cảnh xung quanh |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp phản hồi lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp đăng ký/xây dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt plugin tin cậy mang tính thử nghiệm dành cho các harness tác nhân cấp thấp: các kiểu harness, trình trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch runtime, phân loại kết quả đầu cuối, trình trợ giúp định dạng/chi tiết tiến độ công cụ và các tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện điểm cuối do nhà cung cấp Z.AI sở hữu đã lỗi thời; sử dụng API công khai của plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa bất đồng bộ cục bộ trong tiến trình dành cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp đo từ xa hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp giới hạn mức đồng thời của tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp bộ nhớ đệm loại bỏ trùng lặp trong bộ nhớ và có hỗ trợ lưu bền |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp xả các lượt phân phối đi đang chờ xử lý |
    | `plugin-sdk/file-access-runtime` | Các trình trợ giúp an toàn cho đường dẫn tệp cục bộ và nguồn phương tiện |
    | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp đánh thức, sự kiện và khả năng hiển thị của Heartbeat |
    | `plugin-sdk/expect-runtime` | Trình trợ giúp xác nhận giá trị bắt buộc cho các bất biến runtime có thể chứng minh |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trình trợ giúp mã thông báo/UUID an toàn |
    | `plugin-sdk/system-event-runtime` | Các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ phương tiện truyền tải sẵn sàng |
    | `plugin-sdk/exec-approvals-runtime` | Các trình trợ giúp tệp chính sách phê duyệt thực thi mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; sử dụng các đường dẫn con runtime chuyên biệt ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh theo dõi |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trình trợ giúp phân loại lỗi dùng chung, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Các trình trợ giúp fetch được bao bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Các trình trợ giúp làm sạch URL dữ liệu hình ảnh nội tuyến và nhận diện chữ ký mà không cần bề mặt runtime phương tiện rộng |
    | `plugin-sdk/response-limit-runtime` | Các trình đọc nội dung phản hồi có giới hạn theo byte, thời gian nhàn rỗi và thời hạn mà không cần bề mặt runtime phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết cuộc trò chuyện hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập các chức năng cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp phạm vi hẹp để ép kiểu và chuẩn hóa bản ghi/chuỗi nguyên thủy mà không nhập Markdown/ghi nhật ký |
    | `plugin-sdk/html-entity-runtime` | Giải mã thực thể HTML5 kết thúc bằng dấu chấm phẩy trong một lượt mà không cần các tiện ích văn bản rộng |
    | `plugin-sdk/text-utility-runtime` | Các trình trợ giúp văn bản và đường dẫn cấp thấp, bao gồm thoát năm thực thể HTML |
    | `plugin-sdk/widget-html` | Phát hiện tài liệu hoàn chỉnh, xác thực kích thước và lỗi đầu vào công cụ dành cho tiện ích HTML độc lập |
    | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Barrel rộng đã lỗi thời dành cho các trình trợ giúp thư mục/danh tính/không gian làm việc của tác nhân, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và mục xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời; ưu tiên các đường dẫn con tác nhân/runtime chuyên biệt |
    | `plugin-sdk/directory-runtime` | Truy vấn/loại bỏ trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về khả năng và kiểm thử">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel phương tiện rộng đã ngừng khuyến nghị, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã ngừng khuyến nghị; ưu tiên `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` và các đường dẫn con thời gian chạy của khả năng, đồng thời ưu tiên các trình trợ giúp kho lưu trữ trước khi đọc bộ đệm khi một URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Các trình trợ giúp chuyên biệt về chuẩn hóa MIME, ánh xạ phần mở rộng tệp, phát hiện MIME và loại phương tiện |
    | `plugin-sdk/media-store` | Các trình trợ giúp kho phương tiện chuyên biệt như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các trình trợ giúp chuyển đổi dự phòng dùng chung cho việc tạo phương tiện, lựa chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng các mục xuất trình trợ giúp hình ảnh/âm thanh/trích xuất có cấu trúc dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Phân đoạn văn bản gửi đi và phạm vi có giữ nguyên độ lệch, phân đoạn markdown/các trình trợ giúp kết xuất, mã hóa thẻ HTML có nhận biết dấu ngoặc kép, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và các tiện ích văn bản an toàn |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các mục xuất dành cho nhà cung cấp về chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI và trình trợ giúp giọng nói |
    | `plugin-sdk/speech-core` | Các mục xuất dùng chung về kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa và trình trợ giúp giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Trình trợ giúp khởi tạo hồ sơ thời gian thực để chèn ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực, trình trợ giúp registry và trình trợ giúp hành vi giọng nói thời gian thực dùng chung, bao gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp tài sản hình ảnh/URL dữ liệu và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu, cơ chế chuyển đổi dự phòng, xác thực và trình trợ giúp registry dùng chung cho việc tạo hình ảnh |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình đã ngừng khuyến nghị; ưu tiên các bề mặt nhà cung cấp nhạc do plugin sở hữu |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình |
    | `plugin-sdk/transcripts` | Các kiểu nhà cung cấp nguồn bản chép lời dùng chung, trình trợ giúp registry, bộ mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và trình trợ giúp cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã ngừng khuyến nghị; sử dụng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các trình trợ giúp dùng chung để tải phương tiện từ xa/cục bộ |
    | `plugin-sdk/zod` | Mục tái xuất tương thích đã ngừng khuyến nghị; nhập trực tiếp `zod` từ `zod` |
    | `plugin-sdk/plugin-test-api` | Trình trợ giúp `createTestPluginApi` tối thiểu, cục bộ trong kho mã, dành cho các kiểm thử đơn vị đăng ký plugin trực tiếp mà không nhập các cầu nối trình trợ giúp kiểm thử của kho mã |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng bộ điều hợp thời gian chạy agent gốc, cục bộ trong kho mã, dành cho kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, lược đồ và phép chiếu bản chép lời |
    | `plugin-sdk/channel-test-helpers` | Các trình trợ giúp kiểm thử hướng kênh, cục bộ trong kho mã, dành cho các hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, truyền luồng cấu hình gửi, mô phỏng thời gian chạy, sự cố trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi phân giải đích dùng chung, cục bộ trong kho mã, dành cho kiểm thử kênh |
    | `plugin-sdk/channel-contract-testing` | Các trình trợ giúp kiểm thử hợp đồng kênh chuyên biệt, cục bộ trong kho mã, không sử dụng barrel kiểm thử rộng |
    | `plugin-sdk/plugin-test-contracts` | Các trình trợ giúp hợp đồng, cục bộ trong kho mã, cho gói plugin, đăng ký, tài sản công khai, nhập trực tiếp, API thời gian chạy và hiệu ứng phụ khi nhập |
    | `plugin-sdk/plugin-state-test-runtime` | Các trình trợ giúp kiểm thử, cục bộ trong kho mã, cho kho trạng thái plugin, hàng đợi đầu vào và cơ sở dữ liệu trạng thái |
    | `plugin-sdk/provider-test-contracts` | Các trình trợ giúp hợp đồng, cục bộ trong kho mã, cho thời gian chạy nhà cung cấp, xác thực, khám phá, thiết lập ban đầu, danh mục, trình hướng dẫn, khả năng phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải web và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Các mô phỏng HTTP/xác thực Vitest tùy chọn, cục bộ trong kho mã, dành cho các kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Các trình trợ giúp, cục bộ trong kho mã, để gắn siêu dữ liệu vào fixture tải trọng phản hồi |
    | `plugin-sdk/sqlite-runtime-testing` | Các trình trợ giúp vòng đời SQLite, cục bộ trong kho mã, dành cho kiểm thử bên thứ nhất |
    | `plugin-sdk/test-fixtures` | Các fixture, cục bộ trong kho mã, cho ghi nhận thời gian chạy CLI chung, ngữ cảnh sandbox, trình ghi skill, thông điệp agent, sự kiện hệ thống, tải lại mô-đun, đường dẫn plugin đóng gói, văn bản terminal, phân đoạn, mã thông báo xác thực và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Các trình trợ giúp mô phỏng Node tích hợp sẵn, chuyên biệt và cục bộ trong kho mã, để sử dụng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con của bộ nhớ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bí danh tương thích đã ngừng khuyến nghị; sử dụng `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy tìm kiếm/chỉ mục bộ nhớ đã ngừng khuyến nghị; ưu tiên các đường dẫn con memory-host trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-embedding-registry` | Các trình trợ giúp registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các mục xuất engine nền tảng của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Các hợp đồng embedding của máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và trình trợ giúp từ xa/theo lô chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã ngừng khuyến nghị; sử dụng API nhà cung cấp embedding chung cho các nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các mục xuất engine QMD của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các mục xuất engine lưu trữ của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Các trình trợ giúp đa phương thức của máy chủ bộ nhớ đã ngừng khuyến nghị; ưu tiên các đường dẫn con memory-host trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-query` | Các trình trợ giúp truy vấn máy chủ bộ nhớ đã ngừng khuyến nghị; ưu tiên các đường dẫn con memory-host trung lập với nhà cung cấp |
    | `plugin-sdk/memory-core-host-secret` | Các trình trợ giúp bí mật của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã ngừng khuyến nghị; sử dụng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Các trình trợ giúp trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Các trình trợ giúp thời gian chạy CLI của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Các trình trợ giúp thời gian chạy lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Các trình trợ giúp tệp/thời gian chạy của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập với nhà cung cấp cho các trình trợ giúp thời gian chạy lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập với nhà cung cấp cho các trình trợ giúp nhật ký sự kiện của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã ngừng khuyến nghị; sử dụng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Các trình trợ giúp markdown được quản lý dùng chung cho các plugin liên quan đến bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade thời gian chạy Active Memory để truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã ngừng khuyến nghị; sử dụng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Các đường dẫn con dành riêng cho trình trợ giúp đóng gói">
    Các đường dẫn con SDK dành riêng cho trình trợ giúp đóng gói là những bề mặt chuyên biệt, hẹp theo từng chủ sở hữu dành cho
    mã plugin đóng gói. Chúng được theo dõi trong danh mục SDK để các bản dựng
    gói và việc đặt bí danh luôn có tính xác định, nhưng không phải là API
    tạo plugin dùng chung. Các hợp đồng máy chủ có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp plugin Codex đóng gói để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex (mục xuất gói dành riêng) |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp plugin Codex đóng gói để phản chiếu các agent con gốc của app-server Codex vào trạng thái tác vụ OpenClaw (chỉ cục bộ trong kho mã, không phải mục xuất gói) |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
