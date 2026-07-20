---
read_when:
    - Chọn đường dẫn con plugin-sdk phù hợp cho một lệnh nhập Plugin
    - Kiểm tra các đường dẫn con của plugin đi kèm và các bề mặt helper
summary: 'Danh mục đường dẫn con của Plugin SDK: các lệnh import nằm ở đâu, được nhóm theo lĩnh vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-20T04:46:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin chứa các đường dẫn con công khai có phạm vi hẹp và các trình trợ giúp đóng gói chỉ dùng trong kho lưu trữ dưới `openclaw/plugin-sdk/`. Trang này lập danh mục cả hai và ghi nhãn rõ ràng cho các mục riêng tư cục bộ. Ba tệp xác định ranh giới:

- `scripts/lib/plugin-sdk-entrypoints.json`: danh mục điểm vào được duy trì
  mà bản dựng biên dịch.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: các đường dẫn con
  kiểm thử/nội bộ cục bộ của kho lưu trữ. Các mục xuất của gói là danh mục trừ đi danh sách này.
- `src/plugin-sdk/entrypoints.ts`: siêu dữ liệu phân loại cho các
  đường dẫn con không còn được khuyến nghị, các trình trợ giúp đóng gói dành riêng, các facade đóng gói được hỗ trợ và
  các bề mặt công khai do plugin sở hữu.

Người bảo trì kiểm tra số lượng mục xuất công khai bằng `pnpm plugin-sdk:surface` và
các đường dẫn con trình trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
các mục xuất trình trợ giúp dành riêng không được sử dụng sẽ khiến báo cáo Pipeline CI thất bại thay vì tiếp tục nằm trong
SDK công khai dưới dạng nợ tương thích không hoạt động.

Để xem hướng dẫn tạo plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Điểm vào plugin

| Đường dẫn con                 | Các mục xuất chính                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Riêng tư cục bộ sau tháng 7 năm 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp mục nhà cung cấp di chuyển như `createMigrationItem`, hằng số lý do, dấu trạng thái mục, trình trợ giúp biên tập và `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp di chuyển thời gian chạy như `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`              |
| `plugin-sdk/health`            | Các kiểu đăng ký kiểm tra tình trạng Doctor, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng và phát hiện dành cho các trình tiêu thụ tình trạng đóng gói                                                                                |

### Trình trợ giúp tương thích và riêng tư cục bộ

Chỉ các đường dẫn con không còn được khuyến nghị thuộc giai đoạn sau vẫn được xuất. Các bí danh tháng 7 năm 2026 và
đường dẫn con không được sử dụng đã bị xóa, trong khi các trình trợ giúp chỉ dành cho bản đóng gói đã bị loại khỏi
gói công khai và được ghi nhãn riêng tư cục bộ bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các mục đóng gói
`plugin-sdk/text-runtime` chỉ dành cho tương thích, và `plugin-sdk/zod` là một
mục tái xuất tương thích: nhập trực tiếp `zod` từ `zod`. Các barrel miền rộng
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` và
`plugin-sdk/security-runtime` cũng không còn được khuyến nghị; hãy dùng các
đường dẫn con chuyên biệt thay thế.

Các đường dẫn con trình trợ giúp kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong kho lưu trữ và không
còn là mục xuất của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` và `testing`. Các bề mặt trình trợ giúp đóng gói riêng tư
`ssrf-runtime-internal` và `codex-native-task-runtime` cũng chỉ dùng cục bộ
trong kho lưu trữ.

### Các đường dẫn con trình trợ giúp plugin đóng gói

Các mô-đun trình trợ giúp chỉ dành cho bản đóng gói là riêng tư cục bộ sau đợt rà soát tháng 7 năm 2026. Các mục nhập xuyên chủ sở hữu bị chặn bởi các rào chắn hợp đồng gói. `src/plugin-sdk/entrypoints.ts` theo dõi riêng các facade đóng gói được hỗ trợ vẫn còn công khai, tức các
điểm vào SDK được plugin đóng gói tương ứng hỗ trợ cho đến khi các hợp đồng chung thay thế
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
không còn được khuyến nghị cho mã mới; xem ghi chú theo từng hàng bên dưới.

<AccordionGroup>
  <Accordion title="Các đường dẫn con kênh">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Riêng tư cục bộ sau tháng 7 năm 2026; Trình trợ giúp xác thực JSON Schema có bộ nhớ đệm cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Các trình trợ giúp trình hướng dẫn thiết lập dùng chung, bộ dịch thiết lập, lời nhắc danh sách cho phép, trình tạo trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Các trình trợ giúp cấu hình/cổng hành động đa tài khoản, các trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, các trình trợ giúp chuẩn hóa mã định danh tài khoản |
    | `plugin-sdk/account-resolution` | Các trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Các trình trợ giúp danh sách tài khoản/hành động tài khoản có phạm vi hẹp |
    | `plugin-sdk/access-groups` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp phân tích danh sách cho phép của nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các thành phần nguyên thủy của schema cấu hình kênh dùng chung cùng với Zod và các trình tạo JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Riêng tư cục bộ sau tháng 7 năm 2026; Các schema cấu hình kênh OpenClaw đóng gói chỉ dành cho các plugin đóng gói được duy trì |
    | `plugin-sdk/chat-channel-ids` | Riêng tư cục bộ sau tháng 7 năm 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Các mã định danh kênh trò chuyện đóng gói/chính thức chuẩn tắc cùng nhãn/bí danh trình định dạng dành cho các plugin cần nhận diện văn bản có tiền tố phong bì mà không mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Trình phân giải thời gian chạy đầu vào kênh cấp cao thử nghiệm, trình phân giải chính sách đề cập ngầm và trình tạo dữ kiện định tuyến cho các đường dẫn nhận kênh đã di chuyển. Ưu tiên cách này thay vì tập hợp danh sách cho phép hiệu lực, danh sách cho phép lệnh và các phép chiếu cũ trong từng plugin. Xem [API đầu vào kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Các hợp đồng vòng đời tin nhắn cùng với tùy chọn pipeline phản hồi, biên nhận, bản xem trước trực tiếp/truyền phát, trình trợ giúp vòng đời, danh tính đầu ra, lập kế hoạch tải trọng, gửi bền vững và trình trợ giúp ngữ cảnh gửi tin nhắn. Xem [API đầu ra kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích không còn được khuyến nghị cho `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Các trình trợ giúp dùng chung để tạo định tuyến đầu vào + phong bì |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-inbound` cho trình chạy đầu vào và vị từ điều phối, và `plugin-sdk/channel-outbound` cho trình trợ giúp chuyển phát tin nhắn. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích đích không còn được khuyến nghị; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp dùng chung để tải phương tiện đầu ra và quản lý trạng thái phương tiện được lưu trữ |
    | `plugin-sdk/poll-runtime` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chuẩn hóa thăm dò có phạm vi hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp bộ điều hợp và vòng đời liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Facade tương thích không còn được khuyến nghị cho các gốc và trình tải tải trọng phương tiện của tác nhân. Các plugin kênh mới sử dụng tính năng lập kế hoạch tải trọng đầu ra có định kiểu từ `plugin-sdk/channel-outbound`; việc tải phương tiện cục bộ do người vận hành cung cấp vẫn sử dụng facade được giữ lại cho đến khi có một đường nối gốc cục bộ công khai chuyên biệt. |
    | `plugin-sdk/conversation-runtime` | Barrel rộng không còn được khuyến nghị cho liên kết cuộc hội thoại/luồng, ghép nối và các trình trợ giúp liên kết đã cấu hình; ưu tiên các đường dẫn con liên kết chuyên biệt như `plugin-sdk/thread-bindings-runtime` và `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Các trình trợ giúp phân giải chính sách nhóm trong thời gian chạy |
    | `plugin-sdk/channel-status` | Các trình trợ giúp dùng chung cho ảnh chụp nhanh/tóm tắt trạng thái kênh |
    | `plugin-sdk/channel-config-primitives` | Các thành phần nguyên thủy của schema cấu hình kênh có phạm vi hẹp |
    | `plugin-sdk/channel-config-writes` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các mục xuất phần mở đầu plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Các trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Các trình trợ giúp quyết định quyền truy cập nhóm không còn được khuyến nghị; dùng `resolveChannelMessageIngress` từ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chính sách bảo vệ DM trực tiếp trước mã hóa có phạm vi hẹp |
    | `plugin-sdk/discord` | Facade tương thích Discord không còn được khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích chủ sở hữu được theo dõi; các plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram không còn được khuyến nghị cho khả năng tương thích chủ sở hữu được theo dõi; các plugin mới nên dùng trình trợ giúp thời gian chạy được chèn hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/interactive-runtime` | Các trình trợ giúp trình bày ngữ nghĩa, chuyển phát tin nhắn và phản hồi tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Phân giải các lựa chọn `ask_user` do thời gian chạy tạo thông qua Gateway từ các trình xử lý tương tác kênh |
    | `plugin-sdk/channel-inbound` | Các trình trợ giúp đầu vào dùng chung cho phân loại sự kiện, tạo ngữ cảnh, định dạng, gốc, chống dội, khớp đề cập, chính sách đề cập và ghi nhật ký đầu vào |
    | `plugin-sdk/channel-inbound-debounce` | Các trình trợ giúp chống dội đầu vào có phạm vi hẹp |
    | `plugin-sdk/channel-mention-gating` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chính sách đề cập, dấu đề cập và văn bản đề cập có phạm vi hẹp mà không bao gồm bề mặt thời gian chạy đầu vào rộng hơn |
    | `plugin-sdk/channel-streaming` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Các kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Các trình trợ giúp hành động tin nhắn kênh, cùng với các trình trợ giúp schema gốc không còn được khuyến nghị nhưng vẫn được giữ lại để tương thích với plugin |
    | `plugin-sdk/channel-route` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp dùng chung cho chuẩn hóa định tuyến, phân giải đích dựa trên trình phân tích, chuyển mã định danh luồng thành chuỗi, khóa định tuyến khử trùng lặp/rút gọn, các kiểu đích đã phân tích và so sánh định tuyến/đích |
    | `plugin-sdk/channel-targets` | Riêng tư cục bộ sau tháng 7 năm 2026; Các trình trợ giúp phân tích đích; các bên gọi so sánh định tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Các kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
  </Accordion>

Các đường dẫn con tương thích kênh thuộc giai đoạn sau chỉ tiếp tục công khai đến
các ngày trong sổ đăng ký tương ứng. Các bí danh tháng 7 như quyền truy cập DM trực tiếp, tùy chọn phản hồi, đường dẫn
ghép nối và các phần tách thời gian chạy kênh đã bị loại bỏ; các trình trợ giúp chỉ dành cho bản đóng gói
là riêng tư cục bộ.

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/cli-backend` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các giá trị mặc định của backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp runtime xác thực nhà cung cấp: luồng loopback OAuth, trao đổi token, lưu xác thực và phân giải khóa API |
    | `plugin-sdk/provider-oauth-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu callback OAuth chung cho nhà cung cấp, kết xuất trang callback, trình trợ giúp PKCE/trạng thái, phân tích đầu vào ủy quyền, trình trợ giúp hết hạn token và trình trợ giúp hủy bỏ |
    | `plugin-sdk/provider-auth-api-key` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp onboarding/ghi hồ sơ bằng khóa API, chẳng hạn như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Trình tạo kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp tra cứu biến môi trường xác thực của nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, các trình trợ giúp nhập xác thực OpenAI Codex, mục xuất tương thích `resolveOpenClawAgentDir` đã ngừng dùng |
    | `plugin-sdk/provider-model-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, các trình tạo chính sách phát lại dùng chung, trình trợ giúp endpoint của nhà cung cấp và trình trợ giúp chuẩn hóa ID mô hình dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp danh mục mô hình nhà cung cấp trực tiếp cho quá trình khám phá có bảo vệ theo kiểu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc ID mô hình, bộ nhớ đệm TTL và phương án dự phòng tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung danh mục nhà cung cấp và các seam registry nhà cung cấp Plugin cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chung về khả năng HTTP/endpoint của nhà cung cấp, lỗi HTTP của nhà cung cấp và trình trợ giúp biểu mẫu multipart để phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp hợp đồng cấu hình/lựa chọn tìm nạp web phạm vi hẹp, chẳng hạn như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp tìm nạp web |
    | `plugin-sdk/provider-web-search-config-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp cho những nhà cung cấp không cần cơ chế bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp, chẳng hạn như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, cùng các trình đặt/lấy thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp đăng ký/bộ nhớ đệm/runtime của nhà cung cấp tìm kiếm web |
    | `plugin-sdk/embedding-providers` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu nhà cung cấp embedding chung và trình trợ giúp đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; các Plugin đăng ký nhà cung cấp thông qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cùng quá trình dọn dẹp schema + chẩn đoán cho DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các kiểu ảnh chụp nhanh mức sử dụng của nhà cung cấp, trình trợ giúp tìm nạp mức sử dụng dùng chung và các trình tìm nạp nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, các kiểu trình bao bọc luồng, khả năng tương thích lời gọi công cụ văn bản thuần túy và trình trợ giúp trình bao bọc dùng chung cho Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp trình bao bọc luồng nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, cùng các tiện ích luồng tương thích với Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp truyền tải gốc của nhà cung cấp, chẳng hạn như tìm nạp có bảo vệ, trích xuất văn bản kết quả công cụ, chuyển đổi thông điệp truyền tải và luồng sự kiện truyền tải có thể ghi |
    | `plugin-sdk/provider-onboard` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp phạm vi hẹp để phân tích chế độ kích hoạt nhóm và lệnh |
  </Accordion>

Ảnh chụp nhanh mức sử dụng của nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn ngạch, mỗi mục có
nhãn, phần trăm đã sử dụng và thời gian đặt lại tùy chọn. Những nhà cung cấp hiển thị số dư hoặc
văn bản trạng thái tài khoản thay vì các khoảng hạn ngạch có thể đặt lại phải trả về
`summary` với mảng `windows` trống thay vì tạo ra các tỷ lệ phần trăm không có thật.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ sử dụng `error` khi
endpoint mức sử dụng gặp lỗi hoặc không trả về dữ liệu mức sử dụng khả dụng.

  <Accordion title="Các đường dẫn con về xác thực và bảo mật">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | Bề mặt ủy quyền lệnh phạm vi rộng đã ngừng dùng (`resolveControlCommandGate`, các trình trợ giúp registry lệnh, bao gồm định dạng menu đối số động, trình trợ giúp ủy quyền người gửi); hãy dùng ủy quyền đầu vào/runtime của kênh hoặc trình trợ giúp trạng thái lệnh |
    | `plugin-sdk/command-status` | Các trình tạo thông điệp lệnh/trợ giúp, chẳng hạn như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Các trình trợ giúp phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các trình trợ giúp hồ sơ/bộ lọc phê duyệt thực thi gốc |
    | `plugin-sdk/approval-delivery-runtime` | Các bộ điều hợp khả năng/phân phối phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-reference-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Trình trợ giúp định vị bền vững, xác định cho callback phê duyệt bị giới hạn bởi phương thức truyền tải |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các trình trợ giúp tải bộ điều hợp phê duyệt gốc nhẹ cho các điểm vào kênh có lưu lượng cao |
    | `plugin-sdk/approval-handler-runtime` | Các trình trợ giúp runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam bộ điều hợp/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Các trình trợ giúp đích phê duyệt gốc, liên kết tài khoản, cổng định tuyến, phương án dự phòng chuyển tiếp và chặn lời nhắc thực thi gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các liên kết phản ứng phê duyệt được mã hóa cứng, payload lời nhắc phản ứng, kho lưu trữ đích phản ứng, trình trợ giúp văn bản gợi ý phản ứng và mục xuất tương thích để chặn lời nhắc thực thi gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Các trình trợ giúp payload phản hồi phê duyệt thực thi/Plugin |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp payload phê duyệt thực thi/Plugin, trình tạo khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt gốc và trình trợ giúp hiển thị phê duyệt có cấu trúc, chẳng hạn như `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và trình trợ giúp đích phiên gốc |
    | `plugin-sdk/command-detection` | Các trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Các vị từ văn bản lệnh nhẹ cho đường dẫn kênh có lưu lượng cao |
    | `plugin-sdk/command-surface` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp chuẩn hóa nội dung lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp luồng đăng nhập xác thực nhà cung cấp được tải lười cho kênh riêng tư và ghép nối bằng mã thiết bị trên Web UI |
    | `plugin-sdk/channel-secret-runtime` | Bề mặt hợp đồng bí mật phạm vi rộng đã ngừng dùng (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, các kiểu đích bí mật); ưu tiên các đường dẫn con chuyên biệt bên dưới |
    | `plugin-sdk/channel-secret-basic-runtime` | Các mục xuất hợp đồng bí mật phạm vi hẹp và trình tạo registry đích cho các bề mặt bí mật kênh/Plugin không phải TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp gán bí mật TTS kênh lồng nhau phạm vi hẹp |
    | `plugin-sdk/secret-ref-runtime` | Kiểu dữ liệu, phân giải và tra cứu đường dẫn đích kế hoạch SecretRef phạm vi hẹp để phân tích hợp đồng bí mật/cấu hình |
    | `plugin-sdk/security-runtime` | Barrel phạm vi rộng đã ngừng dùng cho độ tin cậy, kiểm soát DM, trình trợ giúp tệp/đường dẫn bị giới hạn trong thư mục gốc, bao gồm ghi chỉ-khi-tạo, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, phương án dự phòng di chuyển giữa thiết bị, trình trợ giúp kho tệp riêng tư, bảo vệ thư mục cha có liên kết tượng trưng, nội dung bên ngoài, che thông tin nhạy cảm trong văn bản, so sánh bí mật theo thời gian không đổi và trình trợ giúp thu thập bí mật; ưu tiên các đường dẫn con chuyên biệt về bảo mật/SSRF/bí mật |
    | `plugin-sdk/ssrf-policy` | Các trình trợ giúp danh sách máy chủ được phép và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Chỉ dùng nội bộ cục bộ sau tháng 7 năm 2026; Các trình trợ giúp dispatcher được ghim phạm vi hẹp, không kèm bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Các trình trợ giúp dispatcher được ghim, tìm nạp có bảo vệ SSRF, lỗi SSRF và chính sách SSRF |
    | `plugin-sdk/secret-input` | Các trình trợ giúp phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các trình trợ giúp yêu cầu/đích Webhook và chuyển đổi websocket/nội dung thô |
    | `plugin-sdk/webhook-request-guards` | Các trình trợ giúp kích thước nội dung yêu cầu/thời gian chờ và `runDetachedWebhookWork` cho quá trình xử lý sau xác nhận có theo dõi |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp cho runtime/ghi nhật ký/sao lưu, cảnh báo đường dẫn cài đặt plugin và trình trợ giúp tiến trình |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp giới hạn cho môi trường runtime, trình ghi nhật ký, thời gian chờ, thử lại và thời gian chờ tăng dần |
    | `plugin-sdk/browser-config` | Nội bộ riêng tư sau tháng 7 năm 2026; facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/các giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp chung cho vòng đời tác vụ và chuyển giao khi hoàn tất dành cho các agent dựa trên harness sử dụng phạm vi tác vụ do máy chủ cấp |
    | `plugin-sdk/codex-mcp-projection` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp Codex đi kèm dành riêng để ánh xạ cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp Codex đi kèm, cục bộ trong repo, để kết nối bản sao tác vụ/runtime gốc; không phải mục xuất của gói |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp chung để đăng ký và tra cứu ngữ cảnh runtime của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời dành cho các gói kênh bên thứ ba cũ; plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel rộng đã lỗi thời cho các trình trợ giúp lệnh/hook/http/tương tác của plugin; ưu tiên các đường dẫn con runtime plugin chuyên biệt |
    | `plugin-sdk/hook-runtime` | Barrel rộng đã lỗi thời cho các trình trợ giúp pipeline webhook/hook nội bộ; ưu tiên các đường dẫn con runtime hook/plugin chuyên biệt |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp nhập/liên kết runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/node-host` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp phân giải tệp thực thi trên máy chủ Node và tiếp tục PTY |
    | `plugin-sdk/cli-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; barrel rộng đã lỗi thời cho định dạng CLI, chờ, phiên bản, gọi đối số và các trình trợ giúp nhóm lệnh lười; ưu tiên các đường dẫn con CLI/runtime chuyên biệt |
    | `plugin-sdk/qa-runner-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; facade được hỗ trợ để cung cấp các kịch bản QA của plugin qua bề mặt lệnh CLI |
    | `plugin-sdk/tts-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; facade được hỗ trợ cho các schema cấu hình chuyển văn bản thành giọng nói và trình trợ giúp runtime |
    | `plugin-sdk/gateway-method-runtime` | Trình trợ giúp điều phối phương thức Gateway dành riêng cho các tuyến HTTP của plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trình trợ giúp khởi động máy khách khi vòng lặp sự kiện sẵn sàng, RPC CLI của gateway, lỗi giao thức gateway, phân giải máy chủ LAN được quảng bá và trình trợ giúp bản vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chuyên biệt chỉ có kiểu cho các hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Facade tương thích đã lỗi thời cho các trình trợ giúp cấu hình plugin runtime; plugin mới sử dụng `api.pluginConfig` cùng các hợp đồng cấu hình, bản chụp và trình trợ giúp thay đổi chuyên biệt |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình có tính giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Nội bộ riêng tư sau tháng 7 năm 2026; các chuỗi gợi ý siêu dữ liệu chuyển giao dùng chung cho công cụ tin nhắn |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp bản chụp cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các trình thiết lập bản chụp kiểm thử |
    | `plugin-sdk/text-autolink-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; phát hiện tự động liên kết tham chiếu tệp mà không dùng barrel văn bản rộng |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp runtime dùng chung cho tin nhắn đến/phản hồi, phân đoạn, điều phối, Heartbeat, trình lập kế hoạch phản hồi |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp chuyên biệt cho điều phối/hoàn tất phản hồi và nhãn cuộc hội thoại |
    | `plugin-sdk/reply-history` | Các trình trợ giúp dùng chung cho lịch sử phản hồi trong khoảng thời gian ngắn. Mã lượt tin nhắn mới nên sử dụng `createChannelHistoryWindow`; các trình trợ giúp ánh xạ cấp thấp hơn chỉ còn là mục xuất tương thích đã lỗi thời |
    | `plugin-sdk/reply-reference` | Nội bộ riêng tư sau tháng 7 năm 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp chuyên biệt để phân đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp quy trình phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), trình trợ giúp sửa chữa/vòng đời (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), trình trợ giúp dấu mốc cho các giá trị `sessionFile` chuyển tiếp, đọc văn bản bản ghi người dùng/trợ lý gần đây có giới hạn theo danh tính phiên, trình trợ giúp đường dẫn kho phiên/khóa phiên và đọc thời điểm cập nhật, không nhập các chức năng ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/session-transcript-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; danh tính bản ghi, con trỏ thô và hiển thị có giới hạn, trình trợ giúp đích/đọc/ghi theo phạm vi, phép chiếu mục tin nhắn hiển thị, phát hành bản cập nhật, khóa ghi và khóa lần truy cập bộ nhớ bản ghi |
    | `plugin-sdk/sqlite-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp chuyên biệt cho schema agent SQLite, đường dẫn và giao dịch dành cho runtime chính chủ, không bao gồm điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/cron-store-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các hợp đồng trạng thái theo khóa, BLOB và quyền thuê SQLite hợp tác theo phạm vi plugin, cùng pragma kết nối, bảo trì WAL đã xác minh và trình trợ giúp di chuyển schema STRICT nguyên tử. Hàm gọi lại quyền thuê nhận tín hiệu hủy và các lỗi có kiểu phân biệt thời gian chờ, hủy, mất quyền sở hữu, đầu vào không hợp lệ và lỗi lưu trữ |
    | `plugin-sdk/routing` | Các trình trợ giúp liên kết tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp dùng chung cho bản tóm tắt trạng thái kênh/tài khoản, giá trị mặc định của trạng thái runtime và siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp dùng chung để phân giải đích |
    | `plugin-sdk/string-normalization-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Nội bộ riêng tư sau tháng 7 năm 2026; trích xuất URL dạng chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số chung cho công cụ/CLI |
    | `plugin-sdk/tool-plugin` | Định nghĩa plugin công cụ agent đơn giản có kiểu và cung cấp siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Nội bộ riêng tư sau tháng 7 năm 2026; trích xuất payload đã chuẩn hóa từ các đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/sandbox` | Nội bộ riêng tư sau tháng 7 năm 2026; các kiểu backend sandbox và trình trợ giúp lệnh SSH/OpenShell, bao gồm bước kiểm tra sơ bộ lệnh thực thi để thất bại nhanh |
    | `plugin-sdk/temp-path` | Các trình trợ giúp dùng chung cho đường dẫn tải xuống tạm thời và không gian làm việc tạm thời riêng tư, an toàn |
    | `plugin-sdk/logging-core` | Trình ghi nhật ký hệ thống con và trình trợ giúp che thông tin nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; chế độ bảng Markdown và trình trợ giúp chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp phân tích cú pháp JSON giữ nguyên các số nguyên dạng ký tự không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp khóa tệp tái nhập cùng chức năng thu hồi an toàn cho Doctor đối với các tệp phụ khóa đã ngừng sử dụng, chắc chắn cũ và không thay đổi |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp được lưu trên đĩa |
    | `plugin-sdk/ingress-effect-once` | Cơ chế bảo vệ nhận quyền/cam kết bền vững cho các tác dụng phụ đầu vào không lũy đẳng |
    | `plugin-sdk/acp-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp runtime/phiên ACP và điều phối phản hồi |
    | `plugin-sdk/acp-runtime-backend` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp nhẹ để đăng ký backend ACP và điều phối phản hồi cho các plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; phân giải liên kết ACP chỉ đọc mà không nhập chức năng khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các thành phần cơ bản của schema cấu hình runtime agent đã lỗi thời; nhập các thành phần cơ bản của schema từ bề mặt được duy trì do plugin sở hữu |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean linh hoạt |
    | `plugin-sdk/dangerous-name-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp phân giải đối sánh tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp khởi tạo thiết bị và token ghép nối, bao gồm `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Các thành phần trợ giúp cơ bản dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp phản hồi lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp sổ đăng ký/xây dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt thử nghiệm dành cho plugin đáng tin cậy để sử dụng các harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch runtime, phân loại kết quả đầu cuối, trình trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/async-lock-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp khóa bất đồng bộ cục bộ trong tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp đo từ xa hoạt động của kênh |
    | `plugin-sdk/concurrency-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp đồng thời tác vụ bất đồng bộ có giới hạn |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ và được hỗ trợ bởi lưu trữ bền vững |
    | `plugin-sdk/delivery-queue-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp xả hàng đợi chuyển giao đang chờ đi |
    | `plugin-sdk/file-access-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp an toàn cho tệp cục bộ và đường dẫn nguồn phương tiện |
    | `plugin-sdk/heartbeat-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
    | `plugin-sdk/expect-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp xác nhận giá trị bắt buộc cho các bất biến runtime có thể chứng minh |
    | `plugin-sdk/number-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp token/UUID an toàn |
    | `plugin-sdk/system-event-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp chờ phương tiện truyền tải sẵn sàng |
    | `plugin-sdk/exec-approvals-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp tệp chính sách phê duyệt thực thi mà không dùng barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; sử dụng các đường dẫn con runtime chuyên biệt ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh truy vết |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trình trợ giúp dùng chung để phân loại lỗi, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; các trình trợ giúp fetch được bao bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Nội bộ riêng tư sau tháng 7 năm 2026; fetch runtime nhận biết dispatcher mà không nhập proxy/fetch được bảo vệ |
    | `plugin-sdk/inline-image-data-url-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình trợ giúp làm sạch URL dữ liệu hình ảnh nội tuyến và dò tìm chữ ký mà không dùng bề mặt runtime phương tiện rộng |
    | `plugin-sdk/response-limit-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trình đọc phần thân phản hồi bị giới hạn theo byte, thời gian nhàn rỗi và hạn chót mà không dùng bề mặt runtime phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; trạng thái liên kết cuộc hội thoại hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/context-visibility-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp cơ bản chuyên biệt để ép kiểu và chuẩn hóa bản ghi/chuỗi mà không nhập markdown/ghi nhật ký |
    | `plugin-sdk/html-entity-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; giải mã thực thể HTML5 kết thúc bằng dấu chấm phẩy trong một lượt mà không dùng các tiện ích văn bản rộng |
    | `plugin-sdk/text-utility-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trình trợ giúp cấp thấp cho văn bản và đường dẫn, bao gồm thoát HTML cho năm thực thể |
    | `plugin-sdk/widget-html` | Phát hiện tài liệu hoàn chỉnh, xác thực kích thước và lỗi đầu vào công cụ cho các tiện ích HTML độc lập |
    | `plugin-sdk/host-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trình trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Nội bộ riêng sau tháng 7 năm 2026; các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Barrel tổng quát đã lỗi thời dành cho các trình trợ giúp thư mục/định danh/không gian làm việc của tác tử, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và bản xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời; ưu tiên các đường dẫn con tác tử/runtime chuyên biệt |
    | `plugin-sdk/directory-runtime` | Truy vấn/loại bỏ trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | Nội bộ riêng sau tháng 7 năm 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel phương tiện rộng đã lỗi thời, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã lỗi thời; ưu tiên `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` và các đường dẫn con runtime năng lực, đồng thời ưu tiên các helper kho lưu trữ trước khi đọc bộ đệm khi một URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Các helper chuyên biệt về chuẩn hóa MIME, ánh xạ phần mở rộng tệp, phát hiện MIME và loại phương tiện |
    | `plugin-sdk/media-store` | Các helper chuyên biệt cho kho phương tiện như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper chuyển đổi dự phòng dùng chung cho việc tạo phương tiện, lựa chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Facade tương thích đã lỗi thời dành cho các kiểu nhà cung cấp và helper nhận hiểu phương tiện; nhà cung cấp mới đăng ký thông qua API plugin được tiêm và giữ các helper yêu cầu thuộc quyền sở hữu của plugin |
    | `plugin-sdk/text-chunking` | Phân đoạn văn bản gửi đi và phạm vi có bảo toàn độ lệch, các helper phân đoạn/kết xuất markdown, token hóa thẻ HTML có nhận biết dấu ngoặc kép, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và các tiện ích văn bản an toàn |
    | `plugin-sdk/speech` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp giọng nói cùng các phần xuất về chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI và helper giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Nội bộ riêng tư sau tháng 7 năm 2026; Các phần xuất dùng chung về kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa và helper giọng nói |
    | `plugin-sdk/speech-settings` | Các primitive gọn nhẹ để phân giải và chuẩn hóa cấu hình TTS, không có registry nhà cung cấp hoặc runtime tổng hợp |
    | `plugin-sdk/realtime-transcription` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Nội bộ riêng tư sau tháng 7 năm 2026; Helper khởi tạo hồ sơ thời gian thực để tiêm ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp giọng nói thời gian thực, helper registry, cổng năng lượng âm thanh/khởi phát lời nói dùng chung và helper hành vi giọng nói thời gian thực, bao gồm bộ khung phiên độc lập với phương thức vận chuyển và theo dõi hoạt động đầu ra |
    | `plugin-sdk/meeting-runtime` | Runtime phiên họp trên trình duyệt, các engine/phương thức vận chuyển âm thanh thời gian thực, `MeetingPlatformAdapter`, điều khiển trình duyệt/node, tham vấn agent, ủy quyền cuộc gọi thoại, kiểm tra thiết lập và helper lệnh SoX |
    | `plugin-sdk/image-generation` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp tạo hình ảnh cùng helper tài sản hình ảnh/URL dữ liệu và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu, cơ chế chuyển đổi dự phòng, xác thực và helper registry dùng chung cho việc tạo hình ảnh |
    | `plugin-sdk/music-generation` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/video-generation` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu tạo video dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình |
    | `plugin-sdk/transcripts` | Nội bộ riêng tư sau tháng 7 năm 2026; Các kiểu nhà cung cấp nguồn bản phiên âm dùng chung, helper registry, bộ mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Nội bộ riêng tư sau tháng 7 năm 2026; Registry đích Webhook và helper cài đặt tuyến |
    | `plugin-sdk/web-media` | Các helper tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Phần tái xuất tương thích đã lỗi thời; nhập trực tiếp `zod` từ `zod` |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu, nội bộ repo, dành cho kiểm thử đơn vị đăng ký plugin trực tiếp mà không nhập các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng bộ điều hợp runtime agent gốc, nội bộ repo, dành cho kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, lược đồ và phép chiếu bản phiên âm |
    | `plugin-sdk/channel-test-helpers` | Các helper kiểm thử hướng kênh, nội bộ repo, dành cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng truyền cấu hình gửi, mock runtime, sự cố trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi phân giải đích dùng chung, nội bộ repo, dành cho kiểm thử kênh |
    | `plugin-sdk/channel-contract-testing` | Các helper kiểm thử hợp đồng kênh chuyên biệt, nội bộ repo, không dùng barrel kiểm thử rộng |
    | `plugin-sdk/plugin-test-contracts` | Các helper hợp đồng, nội bộ repo, dành cho gói plugin, đăng ký, tạo phẩm công khai, nhập trực tiếp, API runtime và hiệu ứng phụ khi nhập |
    | `plugin-sdk/plugin-state-test-runtime` | Các helper kiểm thử, nội bộ repo, dành cho kho trạng thái plugin, hàng đợi đầu vào và DB trạng thái |
    | `plugin-sdk/provider-test-contracts` | Các helper hợp đồng, nội bộ repo, dành cho runtime nhà cung cấp, xác thực, khám phá, hướng dẫn ban đầu, danh mục, trình hướng dẫn, năng lực phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm web/truy xuất và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Nội bộ riêng tư sau tháng 7 năm 2026; Các mock HTTP/xác thực Vitest tùy chọn, nội bộ repo, dành cho kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Các helper nội bộ repo để đính kèm siêu dữ liệu vào fixture tải trọng phản hồi |
    | `plugin-sdk/sqlite-runtime-testing` | Các helper vòng đời SQLite, nội bộ repo, dành cho kiểm thử chính chủ |
    | `plugin-sdk/test-fixtures` | Các fixture nội bộ repo dành cho thu thập runtime CLI chung, ngữ cảnh sandbox, trình ghi skill, thông điệp agent, sự kiện hệ thống, tải lại mô-đun, đường dẫn plugin đi kèm, văn bản terminal, phân đoạn, token xác thực và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Các helper mock chuyên biệt cho thành phần tích hợp sẵn của Node, nội bộ repo, để sử dụng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con của bộ nhớ">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các phần xuất engine nền tảng của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Nội bộ riêng tư sau tháng 7 năm 2026; Các hợp đồng embedding của máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và helper xử lý theo lô/từ xa dùng chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã lỗi thời; dùng API nhà cung cấp embedding chung cho các nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Nội bộ riêng tư sau tháng 7 năm 2026; Các phần xuất engine QMD của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Nội bộ riêng tư sau tháng 7 năm 2026; Các phần xuất engine lưu trữ của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper bí mật của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper trạng thái của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper runtime CLI của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper runtime cốt lõi của máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper tệp/runtime của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Facade tương thích đã lỗi thời dành cho các helper máy chủ bộ nhớ trung lập với nhà cung cấp. Plugin bộ nhớ mới sử dụng các năng lực bộ nhớ được tiêm và prompt do máy chủ chuẩn bị; các plugin đồng hành vẫn sử dụng facade được giữ lại để khám phá tạo phẩm công khai cho đến khi có bề mặt đọc chuyên biệt. |
    | `plugin-sdk/memory-host-events` | Nội bộ riêng tư sau tháng 7 năm 2026; Bí danh trung lập với nhà cung cấp cho các helper nhật ký sự kiện của máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Nội bộ riêng tư sau tháng 7 năm 2026; Các helper markdown được quản lý dùng chung cho các plugin liên quan đến bộ nhớ |
    | `plugin-sdk/memory-host-search` | Nội bộ riêng tư sau tháng 7 năm 2026; Facade runtime Active Memory để truy cập trình quản lý tìm kiếm |
  </Accordion>

  <Accordion title="Các đường dẫn con helper đi kèm được dành riêng">
    Các đường dẫn con SDK helper đi kèm được dành riêng là những bề mặt chuyên biệt hẹp theo chủ sở hữu dành cho
    mã plugin đi kèm. Chúng được theo dõi trong kho kiểm kê SDK để các bản dựng
    gói và việc đặt bí danh luôn có tính xác định, nhưng không phải là API chung để
    xây dựng plugin. Các hợp đồng máy chủ có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime` và `plugin-sdk/ssrf-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Nội bộ riêng tư sau tháng 7 năm 2026; Helper plugin Codex đi kèm để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex (phần xuất gói được dành riêng) |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex đi kèm để phản chiếu các subagent gốc của app-server Codex vào trạng thái tác vụ OpenClaw (chỉ nội bộ repo, không phải phần xuất gói) |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về SDK plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
