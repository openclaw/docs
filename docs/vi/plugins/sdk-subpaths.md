---
read_when:
    - Chọn đường dẫn con plugin-sdk phù hợp cho lệnh import Plugin
    - Kiểm tra các đường dẫn con của plugin đi kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: các lệnh import nằm ở đâu, được nhóm theo lĩnh vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-21T13:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b39919e7e12be394ed8f384dcd99bec5ce801e32d9de2ed1e9add7c2d644932
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin chứa các đường dẫn con công khai có phạm vi hẹp và các trình trợ giúp đi kèm chỉ dùng trong kho lưu trữ
thuộc `openclaw/plugin-sdk/`. Trang này lập danh mục cả hai và gắn nhãn rõ ràng
cho các mục private-local. Ba tệp xác định ranh giới:

- `scripts/lib/plugin-sdk-entrypoints.json`: danh mục điểm vào được duy trì
  mà bản dựng biên dịch.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: các đường dẫn con nội bộ
  bị loại khỏi SDK có kiểu và được lập tài liệu. Các mục production vẫn khả dụng
  dưới dạng các bản xuất runtime máy chủ chỉ có JavaScript cho các plugin chính thức
  được phát hành riêng; các mục chỉ dùng cho kiểm thử vẫn không được xuất.
- `src/plugin-sdk/entrypoints.ts`: siêu dữ liệu phân loại cho các đường dẫn con
  đã ngừng dùng, các trình trợ giúp đi kèm được dành riêng, các facade đi kèm được hỗ trợ và
  các bề mặt công khai do plugin sở hữu.

Người duy trì kiểm tra số lượng bản xuất công khai bằng `pnpm plugin-sdk:surface` và
các đường dẫn con của trình trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
các bản xuất trình trợ giúp dành riêng không được sử dụng khiến báo cáo CI thất bại thay vì tiếp tục nằm trong
SDK công khai dưới dạng nợ tương thích không hoạt động.

Để xem hướng dẫn tạo plugin, hãy xem [Tổng quan về SDK plugin](/vi/plugins/sdk-overview).

## Mục plugin

| Đường dẫn con                  | Các bản xuất chính                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Private-local sau tháng 7 năm 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Private-local sau tháng 7 năm 2026; Các trình trợ giúp mục nhà cung cấp di chuyển như `createMigrationItem`, các hằng số lý do, dấu trạng thái mục, trình trợ giúp biên tập và `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp di chuyển runtime như `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`              |
| `plugin-sdk/health`            | Các kiểu đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng và phát hiện trong kiểm tra tình trạng Doctor dành cho các bên sử dụng tình trạng đi kèm                                                        |

### Các trình trợ giúp tương thích và private-local

Chỉ các đường dẫn con đã ngừng dùng thuộc cửa sổ muộn hơn vẫn được xuất. Các bí danh tháng 7 năm 2026 và
đường dẫn con không được sử dụng đã bị xóa, còn các trình trợ giúp chỉ dùng đi kèm đã bị loại khỏi
gói công khai và được gắn nhãn private-local bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các mục đi kèm
`plugin-sdk/text-runtime` chỉ dành cho khả năng tương thích, và `plugin-sdk/zod` là một
bản tái xuất tương thích: nhập trực tiếp `zod` từ `zod`. Các barrel miền rộng
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` và
`plugin-sdk/security-runtime` cũng đã ngừng dùng để chuyển sang các
đường dẫn con chuyên biệt.

Các đường dẫn con của trình trợ giúp kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong kho lưu trữ và
không còn là bản xuất của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` và `testing`. Các bề mặt trình trợ giúp đi kèm riêng tư
`ssrf-runtime-internal` và `codex-native-task-runtime` cũng chỉ
dùng cục bộ trong kho lưu trữ.

### Các đường dẫn con của trình trợ giúp plugin đi kèm

Các mô-đun trợ giúp chỉ dùng đi kèm là private-local sau đợt rà soát tháng 7 năm 2026. Các thao tác nhập xuyên chủ sở hữu bị chặn bởi các rào chắn hợp đồng gói. `src/plugin-sdk/entrypoints.ts` theo dõi riêng các facade đi kèm được hỗ trợ vẫn giữ trạng thái công khai, các điểm vào SDK
được plugin đi kèm tương ứng hỗ trợ cho đến khi các hợp đồng chung thay thế
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
đã ngừng dùng cho mã mới; xem ghi chú theo từng hàng bên dưới.

<AccordionGroup>
  <Accordion title="Các đường dẫn con của kênh">
    | Đường dẫn con | Các bản xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Private-local sau tháng 7 năm 2026; Trình trợ giúp xác thực JSON Schema được lưu bộ nhớ đệm cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Các trình trợ giúp dùng chung cho trình hướng dẫn thiết lập, trình biên dịch thiết lập, lời nhắc danh sách cho phép, trình tạo trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Các trình trợ giúp cấu hình/cổng hành động cho nhiều tài khoản, các trình trợ giúp dự phòng về tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, các trình trợ giúp chuẩn hóa ID tài khoản |
    | `plugin-sdk/account-resolution` | Các trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Các trình trợ giúp danh sách tài khoản/hành động tài khoản có phạm vi hẹp |
    | `plugin-sdk/access-groups` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp phân tích danh sách cho phép của nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích đã ngừng dùng. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các thành phần nguyên thủy của schema cấu hình kênh dùng chung cùng với Zod và các trình tạo JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Private-local sau tháng 7 năm 2026; Các schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các plugin đi kèm được duy trì |
    | `plugin-sdk/chat-channel-ids` | Private-local sau tháng 7 năm 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Các ID kênh trò chuyện đi kèm/chính thức chuẩn tắc cùng với nhãn/bí danh trình định dạng cho những plugin cần nhận diện văn bản có tiền tố phong bì mà không phải mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Trình phân giải runtime nhận vào của kênh cấp cao ở giai đoạn thử nghiệm, trình phân giải chính sách đề cập ngầm và các trình tạo dữ kiện định tuyến cho những đường dẫn nhận của kênh đã di chuyển. Nên dùng phần này thay vì lắp ghép danh sách cho phép có hiệu lực, danh sách cho phép lệnh và các phép chiếu cũ trong từng plugin. Xem [API nhận vào của kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích đã ngừng dùng. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Các hợp đồng vòng đời thông báo cùng với tùy chọn pipeline trả lời, biên nhận, bản xem trước trực tiếp/truyền phát, trình trợ giúp vòng đời, danh tính gửi đi, lập kế hoạch payload, lượt gửi bền vững và trình trợ giúp ngữ cảnh gửi thông báo. Xem [API gửi ra của kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã ngừng dùng cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Các trình trợ giúp định tuyến nhận vào + tạo phong bì dùng chung |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích đã ngừng dùng. Sử dụng `plugin-sdk/channel-inbound` cho các trình chạy nhận vào và vị từ điều phối, và `plugin-sdk/channel-outbound` cho các trình trợ giúp phân phối thông báo. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích đích đã ngừng dùng; sử dụng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp dùng chung để tải phương tiện gửi ra và trạng thái phương tiện được lưu trữ |
    | `plugin-sdk/poll-runtime` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp chuẩn hóa cuộc thăm dò có phạm vi hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp vòng đời và bộ điều hợp liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Facade tương thích đã ngừng dùng cho các gốc và trình tải payload phương tiện của tác tử. Các plugin kênh mới sử dụng tính năng lập kế hoạch payload gửi ra có kiểu từ `plugin-sdk/channel-outbound`; việc tải phương tiện cục bộ do toán tử cung cấp vẫn sử dụng facade được giữ lại cho đến khi có một seam gốc cục bộ công khai chuyên biệt. |
    | `plugin-sdk/conversation-runtime` | Barrel rộng đã ngừng dùng cho liên kết cuộc hội thoại/luồng, ghép nối và các trình trợ giúp liên kết đã cấu hình; nên dùng các đường dẫn con liên kết chuyên biệt như `plugin-sdk/thread-bindings-runtime` và `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Các trình trợ giúp phân giải chính sách nhóm trong runtime |
    | `plugin-sdk/channel-status` | Các trình trợ giúp ảnh chụp nhanh/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Các thành phần nguyên thủy của schema cấu hình kênh có phạm vi hẹp |
    | `plugin-sdk/channel-config-writes` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các bản xuất phần mở đầu của plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Các trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Các trình trợ giúp quyết định quyền truy cập nhóm đã ngừng dùng; sử dụng `resolveChannelMessageIngress` từ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp chính sách bảo vệ trước mã hóa cho DM trực tiếp có phạm vi hẹp |
    | `plugin-sdk/discord` | Facade tương thích Discord đã ngừng dùng cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích chủ sở hữu được theo dõi; các plugin mới nên sử dụng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã ngừng dùng cho khả năng tương thích chủ sở hữu được theo dõi; các plugin mới nên sử dụng trình trợ giúp runtime được chèn hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/interactive-runtime` | Các trình trợ giúp trình bày, phân phối và trả lời tương tác cũ cho thông báo theo ngữ nghĩa. Xem [Trình bày thông báo](/vi/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Phân giải các lựa chọn `ask_user` do runtime tạo thông qua Gateway từ các trình xử lý tương tác kênh |
    | `plugin-sdk/channel-inbound` | Các trình trợ giúp nhận vào dùng chung cho phân loại sự kiện, tạo ngữ cảnh, định dạng, gốc, chống dội, khớp đề cập, chính sách đề cập và ghi nhật ký nhận vào |
    | `plugin-sdk/channel-inbound-debounce` | Các trình trợ giúp chống dội nhận vào có phạm vi hẹp |
    | `plugin-sdk/channel-mention-gating` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp chính sách đề cập, dấu đề cập và văn bản đề cập có phạm vi hẹp mà không có bề mặt runtime nhận vào rộng hơn |
    | `plugin-sdk/channel-streaming` | Facade tương thích đã ngừng dùng. Sử dụng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Các kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Các trình trợ giúp hành động thông báo của kênh, cùng với các trình trợ giúp schema gốc đã ngừng dùng được giữ lại để tương thích với plugin |
    | `plugin-sdk/channel-route` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp dùng chung cho chuẩn hóa định tuyến, phân giải đích dựa trên trình phân tích, chuyển ID luồng thành chuỗi, khóa định tuyến chống trùng lặp/thu gọn, các kiểu đích đã phân tích và so sánh định tuyến/đích |
    | `plugin-sdk/channel-targets` | Private-local sau tháng 7 năm 2026; Các trình trợ giúp phân tích đích; các bên gọi so sánh định tuyến nên sử dụng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Các kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
  </Accordion>

Các đường dẫn con tương thích của kênh thuộc cửa sổ muộn hơn chỉ duy trì công khai đến
các ngày tương ứng trong registry. Các bí danh tháng 7 như quyền truy cập DM trực tiếp, tùy chọn trả lời, đường dẫn
ghép nối và các nhánh runtime kênh đã bị loại bỏ; các trình trợ giúp chỉ dùng đi kèm
là private-local.

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các bản xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/cli-backend` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các giá trị mặc định của backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp runtime xác thực nhà cung cấp: luồng loopback OAuth, trao đổi token, lưu giữ xác thực và phân giải khóa API |
    | `plugin-sdk/provider-oauth-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu callback OAuth chung của nhà cung cấp, kết xuất trang callback, trình trợ giúp PKCE/trạng thái, phân tích đầu vào ủy quyền, trình trợ giúp hết hạn token và trình trợ giúp hủy bỏ |
    | `plugin-sdk/provider-auth-api-key` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp onboarding/ghi hồ sơ bằng khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Trình tạo kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, các trình trợ giúp nhập xác thực OpenAI Codex, bản xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời |
    | `plugin-sdk/provider-model-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, các trình tạo chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa ID mô hình dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp danh mục mô hình nhà cung cấp trực tiếp cho hoạt động khám phá có bảo vệ kiểu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc ID mô hình, bộ nhớ đệm TTL và phương án dự phòng tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung danh mục nhà cung cấp và các seam registry nhà cung cấp của plugin cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp khả năng HTTP/endpoint chung của nhà cung cấp, lỗi HTTP của nhà cung cấp và trình trợ giúp biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp hợp đồng cấu hình/lựa chọn web-fetch phạm vi hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp cấu hình/thông tin xác thực web-search phạm vi hẹp cho những nhà cung cấp không cần nối dây kích hoạt plugin |
    | `plugin-sdk/provider-web-search-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và các bộ đặt/lấy thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp đăng ký/bộ nhớ đệm/runtime của nhà cung cấp web-search |
    | `plugin-sdk/embedding-providers` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp embedding chung và trình trợ giúp đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; các plugin đăng ký nhà cung cấp thông qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán cho DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu ảnh chụp nhanh mức sử dụng của nhà cung cấp, trình trợ giúp truy xuất mức sử dụng dùng chung và các trình truy xuất nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, các kiểu wrapper luồng, khả năng tương thích lệnh gọi công cụ văn bản thuần túy và các trình trợ giúp wrapper dùng chung cho Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp wrapper luồng công khai dùng chung của nhà cung cấp, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và các tiện ích luồng tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp truyền tải gốc của nhà cung cấp như truy xuất có bảo vệ, trích xuất văn bản kết quả công cụ, chuyển đổi thông điệp truyền tải và luồng sự kiện truyền tải có thể ghi |
    | `plugin-sdk/provider-onboard` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp bản vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp phân tích lệnh và chế độ kích hoạt nhóm phạm vi hẹp |
  </Accordion>

Ảnh chụp nhanh mức sử dụng của nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn ngạch, mỗi mục có
nhãn, phần trăm đã sử dụng và thời gian đặt lại tùy chọn. Các nhà cung cấp cung cấp văn bản số dư hoặc
trạng thái tài khoản thay vì các khoảng hạn ngạch có thể đặt lại nên trả về
`summary` với mảng `windows` trống thay vì tạo ra các tỷ lệ phần trăm giả.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ sử dụng `error` khi
endpoint mức sử dụng gặp lỗi hoặc không trả về dữ liệu mức sử dụng có thể dùng được.

  <Accordion title="Các đường dẫn con về xác thực và bảo mật">
    | Đường dẫn con | Các bản xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | Bề mặt ủy quyền lệnh rộng đã lỗi thời (`resolveControlCommandGate`, các trình trợ giúp registry lệnh bao gồm định dạng menu đối số động, các trình trợ giúp ủy quyền người gửi); sử dụng ủy quyền đầu vào kênh/runtime hoặc trình trợ giúp trạng thái lệnh |
    | `plugin-sdk/command-status` | Các trình tạo thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Các trình trợ giúp phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Các bộ điều hợp khả năng/phân phối phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-reference-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Trình trợ giúp định vị bền vững xác định cho các callback phê duyệt bị giới hạn bởi phương thức truyền tải |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các trình trợ giúp tải bộ điều hợp phê duyệt gốc nhẹ cho các điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Các trình trợ giúp runtime xử lý phê duyệt rộng hơn; ưu tiên các seam bộ điều hợp/Gateway phạm vi hẹp hơn khi chúng đã đủ |
    | `plugin-sdk/approval-native-runtime` | Các trình trợ giúp mục tiêu phê duyệt gốc, liên kết tài khoản, cổng định tuyến, phương án dự phòng chuyển tiếp và chặn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các liên kết phản ứng phê duyệt được mã hóa cứng, payload lời nhắc phản ứng, kho mục tiêu phản ứng, trình trợ giúp văn bản gợi ý phản ứng và bản xuất tương thích để chặn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Các trình trợ giúp payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp payload phê duyệt exec/plugin, trình tạo khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt gốc và trình trợ giúp hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và trình trợ giúp mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Các trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Các vị từ văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chuẩn hóa nội dung lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp luồng đăng nhập xác thực nhà cung cấp tải lười cho việc ghép đôi bằng mã thiết bị trên kênh riêng tư và Web UI |
    | `plugin-sdk/channel-secret-runtime` | Bề mặt hợp đồng bí mật rộng đã lỗi thời (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, các kiểu mục tiêu bí mật); ưu tiên các đường dẫn con chuyên biệt bên dưới |
    | `plugin-sdk/channel-secret-basic-runtime` | Các bản xuất hợp đồng bí mật phạm vi hẹp và trình tạo registry mục tiêu cho các bề mặt bí mật kênh/plugin không phải TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp gán bí mật TTS kênh lồng nhau phạm vi hẹp |
    | `plugin-sdk/secret-ref-runtime` | Định kiểu, phân giải SecretRef và tra cứu đường dẫn mục tiêu kế hoạch phạm vi hẹp cho việc phân tích hợp đồng bí mật/cấu hình |
    | `plugin-sdk/security-runtime` | Barrel rộng đã lỗi thời cho độ tin cậy, kiểm soát DM, các trình trợ giúp tệp/đường dẫn giới hạn theo thư mục gốc bao gồm ghi chỉ-tạo, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, phương án dự phòng di chuyển giữa các thiết bị, trình trợ giúp kho tệp riêng tư, trình bảo vệ thư mục cha là liên kết tượng trưng, nội dung bên ngoài, che thông tin nhạy cảm trong văn bản, so sánh bí mật theo thời gian không đổi và trình trợ giúp thu thập bí mật; ưu tiên các đường dẫn con chuyên biệt về bảo mật/SSRF/bí mật |
    | `plugin-sdk/ssrf-policy` | Các trình trợ giúp danh sách máy chủ được phép và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp dispatcher được ghim phạm vi hẹp không có bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Các trình trợ giúp dispatcher được ghim, truy xuất được bảo vệ khỏi SSRF, lỗi SSRF và chính sách SSRF |
    | `plugin-sdk/secret-input` | Các trình trợ giúp phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các trình trợ giúp yêu cầu/mục tiêu Webhook và ép kiểu websocket thô/nội dung |
    | `plugin-sdk/webhook-request-guards` | Các trình trợ giúp kích thước/thời gian chờ nội dung yêu cầu và `runDetachedWebhookWork` cho việc xử lý sau xác nhận có theo dõi |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trợ giúp về runtime/ghi nhật ký/sao lưu, cảnh báo đường dẫn cài đặt plugin và trợ giúp tiến trình |
    | `plugin-sdk/runtime-env` | Các trợ giúp phạm vi hẹp về môi trường runtime, trình ghi nhật ký, thời gian chờ, thử lại và khoảng lùi |
    | `plugin-sdk/browser-config` | Nội bộ riêng sau tháng 7 năm 2026; facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích URL CDP và các trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp chung về vòng đời tác vụ và chuyển giao kết quả hoàn tất cho các agent dựa trên harness sử dụng phạm vi tác vụ do máy chủ cấp |
    | `plugin-sdk/codex-mcp-projection` | Trợ giúp Codex đi kèm dành riêng để ánh xạ cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trợ giúp Codex đi kèm, nội bộ repo, dành cho việc nối dây phản chiếu tác vụ/runtime nguyên bản; không phải export của gói |
    | `plugin-sdk/channel-runtime-context` | Các trợ giúp chung về đăng ký và tra cứu ngữ cảnh runtime của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel rộng đã lỗi thời cho các trợ giúp về lệnh/hook/http/tương tác của plugin; ưu tiên các đường dẫn con runtime plugin chuyên biệt |
    | `plugin-sdk/hook-runtime` | Barrel rộng đã lỗi thời cho các trợ giúp pipeline webhook/hook nội bộ; ưu tiên các đường dẫn con runtime hook/plugin chuyên biệt |
    | `plugin-sdk/lazy-runtime` | Các trợ giúp nhập/liên kết runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp thực thi tiến trình |
    | `plugin-sdk/node-host` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp phân giải tệp thực thi trên máy chủ Node và tiếp tục PTY |
    | `plugin-sdk/cli-runtime` | Nội bộ riêng sau tháng 7 năm 2026; barrel rộng đã lỗi thời cho các trợ giúp định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh lười; ưu tiên các đường dẫn con CLI/runtime chuyên biệt |
    | `plugin-sdk/qa-runner-runtime` | Nội bộ riêng sau tháng 7 năm 2026; facade được hỗ trợ để cung cấp các kịch bản QA của plugin qua bề mặt lệnh CLI |
    | `plugin-sdk/tts-runtime` | Nội bộ riêng sau tháng 7 năm 2026; facade được hỗ trợ cho các schema cấu hình chuyển văn bản thành giọng nói và trợ giúp runtime |
    | `plugin-sdk/gateway-method-runtime` | Trợ giúp điều phối phương thức Gateway dành riêng cho các tuyến HTTP của plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trợ giúp khởi động máy khách khi vòng lặp sự kiện sẵn sàng, RPC CLI của gateway, lỗi giao thức gateway, phân giải máy chủ LAN được quảng bá và trợ giúp bản vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chuyên biệt chỉ dành cho kiểu, cho các hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Facade tương thích đã lỗi thời cho các trợ giúp cấu hình plugin runtime; plugin mới dùng `api.pluginConfig` cùng các hợp đồng cấu hình, snapshot và trợ giúp đột biến chuyên biệt |
    | `plugin-sdk/config-mutation` | Các trợ giúp đột biến cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Nội bộ riêng sau tháng 7 năm 2026; các chuỗi gợi ý siêu dữ liệu chuyển giao dùng chung cho công cụ tin nhắn |
    | `plugin-sdk/runtime-config-snapshot` | Các trợ giúp snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các bộ đặt snapshot kiểm thử |
    | `plugin-sdk/text-autolink-runtime` | Nội bộ riêng sau tháng 7 năm 2026; phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/reply-runtime` | Các trợ giúp runtime dùng chung cho tin nhắn đến/phản hồi, phân đoạn, điều phối, Heartbeat, trình lập kế hoạch phản hồi |
    | `plugin-sdk/reply-dispatch-runtime` | Các trợ giúp chuyên biệt về điều phối/hoàn tất phản hồi và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các trợ giúp dùng chung cho lịch sử phản hồi trong khoảng thời gian ngắn. Mã lượt tin nhắn mới nên dùng `createChannelHistoryWindow`; các trợ giúp bản đồ cấp thấp hơn chỉ còn là export tương thích đã lỗi thời |
    | `plugin-sdk/reply-reference` | Nội bộ riêng sau tháng 7 năm 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trợ giúp phân đoạn văn bản/markdown chuyên biệt |
    | `plugin-sdk/session-store-runtime` | Các trợ giúp quy trình làm việc phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), trợ giúp sửa chữa/vòng đời (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), trợ giúp điểm đánh dấu cho các giá trị `sessionFile` chuyển tiếp, đọc văn bản bản ghi gần đây có giới hạn của người dùng/trợ lý theo danh tính phiên, trợ giúp đường dẫn kho phiên/khóa phiên và đọc thời điểm cập nhật, không nhập các thao tác ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/session-transcript-runtime` | Nội bộ riêng sau tháng 7 năm 2026; danh tính bản ghi, con trỏ thô và hiển thị có giới hạn, các trợ giúp đích/đọc/ghi theo phạm vi, phép chiếu mục tin nhắn hiển thị, xuất bản cập nhật, khóa ghi và khóa lần trúng bộ nhớ bản ghi |
    | `plugin-sdk/sqlite-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp chuyên biệt về schema agent SQLite, đường dẫn và giao dịch cho runtime bên thứ nhất, không bao gồm điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/cron-store-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các hợp đồng trạng thái theo khóa trong phạm vi plugin, BLOB và hợp đồng thuê SQLite hợp tác, cùng pragma kết nối, bảo trì WAL đã xác minh và trợ giúp di chuyển schema STRICT nguyên tử. Callback thuê nhận tín hiệu hủy và các lỗi có kiểu phân biệt thời gian chờ, hủy bỏ, mất quyền sở hữu, đầu vào không hợp lệ và lỗi lưu trữ |
    | `plugin-sdk/routing` | Các trợ giúp liên kết tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định trạng thái runtime và trợ giúp siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp phân giải đích dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Nội bộ riêng sau tháng 7 năm 2026; trích xuất URL dạng chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có định thời với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số công cụ/CLI thông dụng |
    | `plugin-sdk/tool-plugin` | Định nghĩa một plugin công cụ agent đơn giản có kiểu và cung cấp siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Nội bộ riêng sau tháng 7 năm 2026; trích xuất payload đã chuẩn hóa từ các đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/sandbox` | Nội bộ riêng sau tháng 7 năm 2026; các kiểu backend sandbox và trợ giúp lệnh SSH/OpenShell, bao gồm kiểm tra trước lệnh thực thi để thất bại nhanh |
    | `plugin-sdk/temp-path` | Các trợ giúp đường dẫn tải xuống tạm thời dùng chung và không gian làm việc tạm thời riêng tư, an toàn |
    | `plugin-sdk/logging-core` | Trình ghi nhật ký hệ thống con và các trợ giúp biên tập |
    | `plugin-sdk/markdown-table-runtime` | Nội bộ riêng sau tháng 7 năm 2026; chế độ bảng Markdown và các trợ giúp chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp phân tích JSON giữ nguyên các literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp khóa tệp có thể tái nhập cùng khả năng Doctor thu hồi an toàn các tệp phụ khóa đã ngừng dùng, chắc chắn cũ và không thay đổi |
    | `plugin-sdk/persistent-dedupe` | Các trợ giúp bộ nhớ đệm chống trùng lặp dựa trên đĩa |
    | `plugin-sdk/ingress-effect-once` | Bộ bảo vệ yêu cầu/commit bền vững cho các hiệu ứng phụ đầu vào không lũy đẳng |
    | `plugin-sdk/acp-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp runtime/phiên ACP và điều phối phản hồi |
    | `plugin-sdk/acp-runtime-backend` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp đăng ký backend ACP gọn nhẹ và điều phối phản hồi cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Nội bộ riêng sau tháng 7 năm 2026; phân giải liên kết ACP chỉ đọc mà không nhập phần khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các thành phần cơ bản của schema cấu hình runtime agent đã lỗi thời; nhập các thành phần schema cơ bản từ một bề mặt do plugin duy trì |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean linh hoạt |
    | `plugin-sdk/dangerous-name-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp phân giải đối sánh tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trợ giúp khởi tạo thiết bị và token ghép nối, bao gồm `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Các thành phần trợ giúp cơ bản dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các trợ giúp phản hồi lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trợ giúp đăng ký/xây dựng/tuần tự hóa lệnh nguyên bản |
    | `plugin-sdk/agent-harness` | Bề mặt plugin đáng tin cậy ở giai đoạn thử nghiệm dành cho harness agent cấp thấp: các kiểu harness, trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trợ giúp cầu nối công cụ OpenClaw, trợ giúp chính sách công cụ kế hoạch runtime, phân loại kết quả đầu cuối, trợ giúp định dạng/chi tiết tiến độ công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/async-lock-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp khóa bất đồng bộ nội bộ tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp đo từ xa hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp giới hạn mức đồng thời của tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các trợ giúp bộ nhớ đệm chống trùng lặp trong bộ nhớ và có hậu thuẫn lưu trữ bền vững |
    | `plugin-sdk/delivery-queue-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp tháo cạn các lượt chuyển giao đang chờ gửi đi |
    | `plugin-sdk/file-access-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp an toàn cho đường dẫn tệp cục bộ và nguồn phương tiện |
    | `plugin-sdk/heartbeat-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp đánh thức, sự kiện và khả năng hiển thị của Heartbeat |
    | `plugin-sdk/expect-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp xác nhận giá trị bắt buộc cho các bất biến runtime có thể chứng minh |
    | `plugin-sdk/number-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp token/UUID an toàn |
    | `plugin-sdk/system-event-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trợ giúp chờ vận chuyển sẵn sàng |
    | `plugin-sdk/exec-approvals-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp tệp chính sách phê duyệt thực thi mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; dùng các đường dẫn con runtime chuyên biệt ở trên |
    | `plugin-sdk/collection-runtime` | Các trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh truy vết |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trợ giúp phân loại lỗi dùng chung, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu cố định |
    | `plugin-sdk/runtime-fetch` | Nội bộ riêng sau tháng 7 năm 2026; fetch runtime nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trợ giúp làm sạch URL dữ liệu hình ảnh nội tuyến và dò chữ ký mà không cần bề mặt runtime phương tiện rộng |
    | `plugin-sdk/response-limit-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trình đọc nội dung phản hồi bị giới hạn theo byte, thời gian nhàn rỗi và hạn chót mà không cần bề mặt runtime phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Nội bộ riêng sau tháng 7 năm 2026; trạng thái liên kết hội thoại hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/context-visibility-runtime` | Nội bộ riêng sau tháng 7 năm 2026; phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trợ giúp chuyên biệt về ép kiểu và chuẩn hóa bản ghi/chuỗi cơ bản mà không nhập markdown/ghi nhật ký |
    | `plugin-sdk/html-entity-runtime` | Nội bộ riêng sau tháng 7 năm 2026; giải mã thực thể HTML5 kết thúc bằng dấu chấm phẩy trong một lượt mà không cần các tiện ích văn bản rộng |
    | `plugin-sdk/text-utility-runtime` | Nội bộ cục bộ sau tháng 7 năm 2026; các trình trợ giúp văn bản và đường dẫn cấp thấp, bao gồm thoát HTML cho năm thực thể |
    | `plugin-sdk/widget-html` | Phát hiện tài liệu hoàn chỉnh, xác thực kích thước và lỗi đầu vào công cụ cho các tiện ích HTML độc lập |
    | `plugin-sdk/host-runtime` | Nội bộ cục bộ sau tháng 7 năm 2026; các trình trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Nội bộ cục bộ sau tháng 7 năm 2026; các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Barrel tổng quát đã ngừng dùng cho các trình trợ giúp thư mục tác nhân/danh tính/không gian làm việc, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và bản xuất tương thích `resolveOpenClawAgentDir` đã ngừng dùng; ưu tiên các đường dẫn con tác nhân/runtime chuyên biệt |
    | `plugin-sdk/directory-runtime` | Truy vấn/loại bỏ trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | Nội bộ cục bộ sau tháng 7 năm 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về khả năng và kiểm thử">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel phương tiện rộng đã ngừng dùng, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã ngừng dùng; ưu tiên `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` và các đường dẫn con runtime khả năng, đồng thời ưu tiên các helper kho lưu trữ trước khi đọc bộ đệm khi URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Các helper phạm vi hẹp cho việc chuẩn hóa MIME, ánh xạ phần mở rộng tệp, phát hiện MIME và loại phương tiện |
    | `plugin-sdk/media-store` | Các helper kho phương tiện phạm vi hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper chuyển đổi dự phòng dùng chung cho việc tạo phương tiện, lựa chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Facade tương thích đã ngừng dùng cho các kiểu và helper nhà cung cấp hiểu phương tiện; các nhà cung cấp mới đăng ký thông qua API Plugin được chèn và giữ các helper yêu cầu thuộc sở hữu của Plugin |
    | `plugin-sdk/text-chunking` | Chia đoạn văn bản gửi đi và phạm vi bảo toàn độ lệch, các helper chia đoạn/kết xuất markdown, mã hóa thẻ HTML có nhận biết dấu ngoặc kép, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và các tiện ích văn bản an toàn |
    | `plugin-sdk/speech` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp giọng nói cùng với chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI hướng tới nhà cung cấp và các mục xuất helper giọng nói |
    | `plugin-sdk/speech-core` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa và các mục xuất helper giọng nói dùng chung |
    | `plugin-sdk/speech-settings` | Các thành phần cơ bản nhẹ để phân giải và chuẩn hóa cấu hình TTS, không có registry nhà cung cấp hoặc runtime tổng hợp |
    | `plugin-sdk/realtime-transcription` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Helper khởi tạo hồ sơ thời gian thực để chèn ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp giọng nói thời gian thực, helper registry, cổng năng lượng âm thanh/khởi phát lời nói dùng chung và helper hành vi giọng nói thời gian thực, bao gồm bộ kiểm thử phiên độc lập với lớp truyền tải và theo dõi hoạt động đầu ra |
    | `plugin-sdk/meeting-runtime` | Runtime phiên họp trên trình duyệt, các engine/lớp truyền tải âm thanh thời gian thực, `MeetingPlatformAdapter`, điều khiển trình duyệt/Node, tư vấn tác tử, ủy quyền cuộc gọi thoại, kiểm tra thiết lập và helper lệnh SoX |
    | `plugin-sdk/image-generation` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp tạo hình ảnh cùng với helper tài sản hình ảnh/URL dữ liệu và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu tạo hình ảnh dùng chung cùng với helper chuyển đổi dự phòng, xác thực và registry |
    | `plugin-sdk/music-generation` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/video-generation` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu tạo video dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình |
    | `plugin-sdk/transcripts` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp nguồn bản ghi dùng chung, helper registry, bộ mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Registry đích Webhook và helper cài đặt tuyến |
    | `plugin-sdk/web-media` | Các helper dùng chung để tải phương tiện từ xa/cục bộ |
    | `plugin-sdk/zod` | Mục tái xuất tương thích đã ngừng dùng; nhập trực tiếp `zod` từ `zod` |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu, chỉ dùng trong repo, dành cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không nhập các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng bộ điều hợp runtime tác tử gốc, chỉ dùng trong repo, dành cho kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, schema và phép chiếu bản ghi |
    | `plugin-sdk/channel-test-helpers` | Các helper kiểm thử hướng kênh, chỉ dùng trong repo, dành cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, truyền cấu hình gửi, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi dùng chung để phân giải đích, chỉ dùng trong repo, dành cho kiểm thử kênh |
    | `plugin-sdk/channel-contract-testing` | Các helper kiểm thử hợp đồng kênh phạm vi hẹp, chỉ dùng trong repo, không có barrel kiểm thử rộng |
    | `plugin-sdk/plugin-test-contracts` | Các helper hợp đồng, chỉ dùng trong repo, cho gói Plugin, đăng ký, tài sản công khai, nhập trực tiếp, API runtime và tác dụng phụ khi nhập |
    | `plugin-sdk/plugin-state-test-runtime` | Các helper kiểm thử, chỉ dùng trong repo, cho kho trạng thái Plugin, hàng đợi đầu vào và cơ sở dữ liệu trạng thái |
    | `plugin-sdk/provider-test-contracts` | Các helper hợp đồng, chỉ dùng trong repo, cho runtime nhà cung cấp, xác thực, khám phá, hướng dẫn ban đầu, danh mục, trình hướng dẫn, khả năng phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải web và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các mock HTTP/xác thực Vitest tùy chọn, chỉ dùng trong repo, dành cho kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Các helper, chỉ dùng trong repo, để đính kèm siêu dữ liệu vào fixture payload phản hồi |
    | `plugin-sdk/sqlite-runtime-testing` | Các helper vòng đời SQLite, chỉ dùng trong repo, dành cho kiểm thử chính chủ |
    | `plugin-sdk/test-fixtures` | Các fixture, chỉ dùng trong repo, cho ghi nhận runtime CLI chung, ngữ cảnh sandbox, trình ghi skill, thông điệp tác tử, sự kiện hệ thống, tải lại mô-đun, đường dẫn Plugin đi kèm, văn bản terminal, chia đoạn, token xác thực và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Các helper mock thành phần tích hợp sẵn của Node có trọng tâm, chỉ dùng trong repo, để sử dụng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con bộ nhớ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper registry nhà cung cấp embedding bộ nhớ nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các mục xuất engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các hợp đồng embedding của máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và helper xử lý hàng loạt/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã ngừng dùng; hãy sử dụng API nhà cung cấp embedding chung cho các nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các mục xuất engine QMD của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các mục xuất engine lưu trữ của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper bí mật của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper trạng thái của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper runtime CLI của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper runtime cốt lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper tệp/runtime của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Facade tương thích đã ngừng dùng cho các helper máy chủ bộ nhớ trung lập với nhà cung cấp. Các Plugin bộ nhớ mới sử dụng khả năng bộ nhớ được chèn và prompt do máy chủ chuẩn bị; các Plugin đồng hành vẫn sử dụng facade được giữ lại để khám phá tài sản công khai cho đến khi có một đường nối đọc chuyên biệt. |
    | `plugin-sdk/memory-host-events` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Bí danh trung lập với nhà cung cấp cho các helper nhật ký sự kiện của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các helper markdown được quản lý dùng chung cho các Plugin liên quan đến bộ nhớ |
    | `plugin-sdk/memory-host-search` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Facade runtime Active Memory để truy cập trình quản lý tìm kiếm |
  </Accordion>

  <Accordion title="Các đường dẫn con helper đi kèm được dành riêng">
    Các đường dẫn con SDK của helper đi kèm được dành riêng là những bề mặt hẹp dành riêng cho chủ sở hữu đối với
    mã Plugin đi kèm. Chúng được theo dõi trong danh mục SDK để các bản dựng gói
    và việc đặt bí danh luôn xác định, nhưng không phải là API chung để
    xây dựng Plugin. Các hợp đồng máy chủ có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime` và `plugin-sdk/ssrf-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Helper Plugin Codex đi kèm để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng máy chủ ứng dụng Codex (mục xuất gói được dành riêng) |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex đi kèm để phản chiếu các tác tử con gốc của máy chủ ứng dụng Codex vào trạng thái tác vụ OpenClaw (chỉ dùng trong repo, không phải mục xuất gói) |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
