---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho lệnh nhập Plugin
    - Kiểm tra các đường dẫn con của Plugin đóng gói kèm và các bề mặt helper
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo lĩnh vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:46:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các subpath công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các subpath thường dùng, được nhóm theo
mục đích. Bảng kiểm kê entrypoint trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của gói là tập con công khai
sau khi trừ các subpath kiểm thử/nội bộ cục bộ trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các subpath helper
dự trữ đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export
helper dự trữ không dùng đến sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong
SDK công khai như khoản nợ tương thích ngủ yên.

Để xem hướng dẫn tạo Plugin, xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Entry Plugin

| Subpath                        | Export chính                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các helper mục nhà cung cấp migration như `createMigrationItem`, hằng số lý do, marker trạng thái mục, helper biên tập ẩn, và `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Các helper migration runtime như `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`            |
| `plugin-sdk/health`            | Đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng, và kiểu finding cho kiểm tra sức khỏe Doctor dành cho các consumer sức khỏe được đóng gói                                               |

### Helper tương thích và kiểm thử không còn được khuyến nghị

Các subpath không còn được khuyến nghị vẫn được export cho các Plugin cũ hơn, nhưng mã mới nên dùng các
subpath SDK tập trung bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các import sản xuất được đóng gói
từ danh sách này. Các barrel rộng như `compat`, `config-types`,
`infra-runtime`, `text-runtime`, và `zod` chỉ dành cho tương thích. Import `zod`
trực tiếp từ `zod`.

Các subpath helper kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong repo và
không còn là export của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, và `testing`.

### Subpath helper Plugin đóng gói dự trữ

Các subpath này là bề mặt tương thích do Plugin sở hữu cho Plugin đóng gói chủ sở hữu
của chúng, không phải API SDK chung: `plugin-sdk/codex-mcp-projection` và
`plugin-sdk/codex-native-task-runtime`. Các import extension xuyên chủ sở hữu bị chặn
bởi các rào chắn hợp đồng gói.

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các bản xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Bản xuất sơ đồ Zod gốc `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema được lưu đệm cho các sơ đồ do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cộng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung, trình dịch thiết lập, lời nhắc danh sách cho phép, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã ngừng dùng; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động đa tài khoản, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích cú pháp danh sách cho phép nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các primitive sơ đồ cấu hình kênh dùng chung cộng với bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Sơ đồ cấu hình kênh OpenClaw đi kèm chỉ dành cho các plugin đi kèm được bảo trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID kênh trò chuyện đi kèm/chính thức chuẩn tắc cộng với nhãn/bí danh trình định dạng cho các plugin cần nhận diện văn bản có tiền tố phong bì mà không mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã ngừng dùng cho sơ đồ cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích ingress kênh cấp thấp đã ngừng dùng. Đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Trình phân giải runtime ingress kênh cấp cao thử nghiệm và bộ dựng dữ kiện tuyến cho các đường dẫn nhận kênh đã di chuyển. Ưu tiên dùng phần này thay vì tự ghép danh sách cho phép hiệu dụng, danh sách cho phép lệnh và phép chiếu cũ trong từng plugin. Xem [API ingress kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Hợp đồng vòng đời tin nhắn cộng với tùy chọn pipeline trả lời, biên nhận, xem trước/phát trực tuyến trực tiếp, trình trợ giúp vòng đời, danh tính gửi ra, lập kế hoạch payload, gửi bền vững và trình trợ giúp ngữ cảnh gửi tin nhắn. Xem [API outbound kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã ngừng dùng cho `plugin-sdk/channel-outbound` cộng với facade điều phối trả lời cũ. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích đã ngừng dùng cho `plugin-sdk/channel-outbound` cộng với facade điều phối trả lời cũ. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dùng chung cho tuyến inbound + bộ dựng phong bì |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-inbound` cho runner inbound và vị từ điều phối, và `plugin-sdk/channel-outbound` cho trình trợ giúp gửi tin nhắn. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích cú pháp đích đã ngừng dùng; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Trình trợ giúp dùng chung để tải phương tiện outbound và trạng thái phương tiện được lưu trữ |
    | `plugin-sdk/outbound-send-deps` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa thăm dò hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời gắn kết luồng và adapter |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload phương tiện agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp gắn kết, ghép cặp và gắn kết đã cấu hình cho cuộc hội thoại/luồng |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive sơ đồ cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Bản xuất phần mở đầu plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp chính sách bảo vệ direct-DM hẹp trước mã hóa |
    | `plugin-sdk/discord` | Facade tương thích Discord đã ngừng dùng cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích chủ sở hữu được theo dõi; plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã ngừng dùng cho khả năng tương thích chủ sở hữu được theo dõi; plugin mới nên dùng trình trợ giúp runtime được chèn hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã ngừng dùng cho các gói Lark/Zalo đã phát hành vẫn nhập ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày tin nhắn theo ngữ nghĩa, gửi và trả lời tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Trình trợ giúp inbound dùng chung cho phân loại sự kiện, dựng ngữ cảnh, định dạng, gốc, chống dội, khớp nhắc đến, chính sách nhắc đến và ghi log inbound |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp chống dội inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho chính sách nhắc đến, dấu nhắc đến và văn bản nhắc đến mà không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade tương thích đã ngừng dùng. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động tin nhắn kênh, cộng với trình trợ giúp sơ đồ native đã ngừng dùng được giữ lại để tương thích plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp chuẩn hóa tuyến dùng chung, phân giải đích theo trình phân tích cú pháp, chuyển thread-id thành chuỗi, khóa tuyến khử trùng lặp/compact, kiểu đích đã phân tích cú pháp và so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích cú pháp đích; caller so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng bí mật hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu đích bí mật |
  </Accordion>

Các nhóm trình trợ giúp kênh không còn được khuyến nghị vẫn chỉ còn khả dụng để tương thích với Plugin đã phát hành. Kế hoạch loại bỏ là: giữ chúng trong suốt khoảng thời gian di chuyển Plugin bên ngoài, giữ các Plugin trong repo/được đóng gói sẵn trên `channel-inbound` và `channel-outbound`, rồi loại bỏ các đường dẫn con tương thích trong lần dọn dẹp SDK lớn tiếp theo. Điều này áp dụng cho các nhóm cũ về thông báo/thời gian chạy kênh, phát trực tuyến kênh, quyền truy cập direct-DM, nhánh trình trợ giúp inbound, reply-options, và pairing-path.

  <Accordion title="Đường dẫn con của provider">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade provider LM Studio được hỗ trợ cho thiết lập, khám phá danh mục và chuẩn bị model khi chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá model, header yêu cầu và helper model đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập provider cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập provider tự lưu trữ tương thích OpenAI có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải khóa API khi chạy cho Plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Kiểu callback OAuth provider tổng quát, kết xuất trang callback, helper PKCE/trạng thái, phân tích đầu vào ủy quyền, helper hết hạn token và helper hủy |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding khóa API/ghi profile, chẳng hạn như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Bộ dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper nhập xác thực OpenAI Codex, export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, helper endpoint provider và helper chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper danh mục model provider trực tiếp cho khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc model-id, bộ đệm TTL và dự phòng tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung danh mục provider và seam registry plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint provider tổng quát, lỗi HTTP provider và helper biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Helper hợp đồng cấu hình/lựa chọn web-fetch hẹp, chẳng hạn như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/bộ đệm provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper cấu hình/thông tin đăng nhập web-search hẹp cho provider không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper hợp đồng cấu hình/thông tin đăng nhập web-search hẹp, chẳng hạn như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin đăng nhập có phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/bộ đệm/runtime provider web-search |
    | `plugin-sdk/embedding-providers` | Kiểu provider embedding tổng quát và helper đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; Plugin đăng ký provider thông qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Kiểu snapshot mức dùng provider, helper lấy mức dùng dùng chung và fetcher provider như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper stream, tương thích lời gọi công cụ văn bản thuần và helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream provider dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và tiện ích stream tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider gốc, chẳng hạn như fetch có bảo vệ, trích xuất văn bản kết quả công cụ, biến đổi thông điệp transport và stream sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/bộ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper chế độ kích hoạt nhóm hẹp và phân tích lệnh |
  </Accordion>

Snapshot mức dùng provider thường báo cáo một hoặc nhiều `windows` hạn ngạch, mỗi mục có
nhãn, phần trăm đã dùng và thời gian đặt lại tùy chọn. Provider cung cấp văn bản số dư hoặc
trạng thái tài khoản thay vì các cửa sổ hạn ngạch có thể đặt lại nên trả về
`summary` với mảng `windows` rỗng thay vì bịa ra phần trăm.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức dùng thất bại hoặc không trả về dữ liệu mức dùng có thể sử dụng.

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Bộ dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper profile/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt gốc nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler phê duyệt rộng hơn; ưu tiên các seam adapter/Gateway hẹp hơn khi chúng là đủ |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt gốc, liên kết tài khoản, cổng tuyến, dự phòng chuyển tiếp và chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Liên kết phản ứng phê duyệt hardcoded, payload prompt phản ứng, kho mục tiêu phản ứng, helper văn bản gợi ý phản ứng và export tương thích cho chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Helper payload trả lời phê duyệt exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/Plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại chống trùng lặp trả lời đến có phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử hợp đồng kênh hẹp, không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Predicate văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper luồng đăng nhập xác thực provider tải lười cho kênh riêng tư và ghép cặp device-code Web UI |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập hợp đồng bí mật hẹp cho bề mặt bí mật kênh/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper định kiểu `coerceSecretRef` hẹp và SecretRef cho phân tích hợp đồng bí mật/cấu hình |
    | `plugin-sdk/secret-provider-integration` | Manifest tích hợp provider SecretRef chỉ kiểu và hợp đồng preset cho Plugin xuất bản preset provider bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Helper dùng chung cho độ tin cậy, kiểm soát DM, tệp/đường dẫn giới hạn trong root bao gồm ghi chỉ tạo mới, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tạm sibling, dự phòng di chuyển qua thiết bị khác, helper kho tệp riêng tư, guard symlink-parent, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và helper thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Helper danh sách cho phép host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher hẹp, không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch được SSRF bảo vệ, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/đích Webhook và ép kiểu websocket/thân thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các hàm trợ giúp rộng cho runtime/ghi log/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Các hàm trợ giúp hẹp cho môi trường runtime, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho profile/giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các hàm trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các hàm trợ giúp vòng đời tác vụ và chuyển phát hoàn tất chung cho agent dựa trên harness sử dụng phạm vi tác vụ do host cấp |
    | `plugin-sdk/codex-mcp-projection` | Hàm trợ giúp Codex đóng gói được dành riêng để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Hàm trợ giúp Codex đóng gói riêng tư cho nối dây bản sao tác vụ/runtime native; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/channel-runtime-context` | Các hàm trợ giúp đăng ký và tra cứu runtime-context kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các hàm trợ giúp chung cho lệnh/hook/http/tương tác của Plugin |
    | `plugin-sdk/hook-runtime` | Các hàm trợ giúp pipeline webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các hàm trợ giúp import/binding runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các hàm trợ giúp exec tiến trình |
    | `plugin-sdk/cli-runtime` | Các hàm trợ giúp định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh lười |
    | `plugin-sdk/qa-live-transport-scenarios` | ID kịch bản QA transport trực tiếp dùng chung, các hàm trợ giúp độ phủ baseline và hàm trợ giúp chọn kịch bản |
    | `plugin-sdk/gateway-method-runtime` | Hàm trợ giúp dispatch phương thức Gateway được dành riêng cho các route HTTP của Plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, hàm trợ giúp khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI gateway, lỗi giao thức gateway, phân giải host LAN được quảng bá và các hàm trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho các hình dạng cấu hình Plugin như `OpenClawConfig` và các kiểu cấu hình kênh/provider |
    | `plugin-sdk/plugin-config-runtime` | Các hàm trợ giúp tra cứu plugin-config runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các hàm trợ giúp đột biến cấu hình có giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chuỗi gợi ý metadata chuyển phát message-tool dùng chung |
    | `plugin-sdk/runtime-config-snapshot` | Các hàm trợ giúp snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đóng gói không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaction phê duyệt hardcoded, payload lời nhắc reaction, kho mục tiêu reaction, hàm trợ giúp văn bản gợi ý reaction và export tương thích để chặn lời nhắc exec native cục bộ |
    | `plugin-sdk/approval-runtime` | Các hàm trợ giúp phê duyệt exec/Plugin, builder khả năng phê duyệt, hàm trợ giúp auth/profile, hàm trợ giúp định tuyến/runtime native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các hàm trợ giúp runtime inbound/reply dùng chung, chia khúc, dispatch, Heartbeat, bộ lập kế hoạch reply |
    | `plugin-sdk/reply-dispatch-runtime` | Các hàm trợ giúp hẹp cho dispatch/hoàn tất reply và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các hàm trợ giúp lịch sử reply cửa sổ ngắn dùng chung. Mã lượt tin nhắn mới nên dùng `createChannelHistoryWindow`; các hàm trợ giúp map cấp thấp hơn chỉ còn là export tương thích đã ngừng khuyến nghị |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các hàm trợ giúp chia khúc văn bản/markdown hẹp |
    | `plugin-sdk/session-store-runtime` | Các hàm trợ giúp workflow phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), đọc văn bản transcript người dùng/assistant gần đây có giới hạn theo danh tính phiên, các hàm trợ giúp đường dẫn kho phiên cũ/session-key, đọc updated-at và các hàm trợ giúp tương thích chỉ chuyển tiếp cho toàn bộ kho/đường dẫn tệp |
    | `plugin-sdk/session-transcript-runtime` | Danh tính transcript, các hàm trợ giúp mục tiêu/đọc/ghi có phạm vi, phát hành cập nhật, khóa ghi và khóa lần trúng bộ nhớ transcript |
    | `plugin-sdk/sqlite-runtime` | Các hàm trợ giúp tập trung cho agent-schema, đường dẫn và giao dịch SQLite dành cho runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Các hàm trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các hàm trợ giúp đường dẫn thư mục State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Các kiểu trạng thái có khóa SQLite sidecar của Plugin cộng với thiết lập tập trung cho pragma kết nối và bảo trì WAL dành cho cơ sở dữ liệu do Plugin sở hữu |
    | `plugin-sdk/routing` | Các hàm trợ giúp binding route/session-key/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các hàm trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định runtime-state và hàm trợ giúp metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Các hàm trợ giúp resolver mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các hàm trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có thời hạn với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Bộ đọc tham số tool/CLI chung |
    | `plugin-sdk/tool-plugin` | Định nghĩa một Plugin agent-tool có kiểu đơn giản và phơi bày metadata tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ các đối tượng kết quả tool |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn tắc từ đối số tool |
    | `plugin-sdk/sandbox` | Các kiểu backend sandbox và hàm trợ giúp lệnh SSH/OpenShell, bao gồm preflight lệnh exec fail-fast |
    | `plugin-sdk/temp-path` | Các hàm trợ giúp đường dẫn tải xuống tạm thời dùng chung và workspace tạm thời bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Các hàm trợ giúp logger phân hệ và biên tập ẩn |
    | `plugin-sdk/markdown-table-runtime` | Các hàm trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các hàm trợ giúp ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các hàm trợ giúp phân giải cấu hình provider talk |
    | `plugin-sdk/json-store` | Các hàm trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Các hàm trợ giúp phân tích cú pháp JSON giữ nguyên literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các hàm trợ giúp khóa tệp re-entrant |
    | `plugin-sdk/persistent-dedupe` | Các hàm trợ giúp cache khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các hàm trợ giúp runtime/phiên ACP và reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Các hàm trợ giúp đăng ký backend ACP nhẹ và reply-dispatch cho Plugin được tải lúc khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không cần import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive config-schema runtime agent hẹp |
    | `plugin-sdk/boolean-param` | Bộ đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các hàm trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các hàm trợ giúp bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các primitive trợ giúp passive-channel, trạng thái và proxy ambient dùng chung |
    | `plugin-sdk/models-provider-runtime` | Các hàm trợ giúp reply lệnh/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các hàm trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các hàm trợ giúp registry/build/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt trusted-plugin thử nghiệm cho agent harness cấp thấp: kiểu harness, hàm trợ giúp steer/abort active-run, hàm trợ giúp cầu nối tool OpenClaw, hàm trợ giúp chính sách tool runtime-plan, phân loại kết quả terminal, hàm trợ giúp định dạng/chi tiết tiến trình tool và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do provider Z.AI sở hữu đã ngừng khuyến nghị; dùng API công khai của Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Hàm trợ giúp khóa bất đồng bộ cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Hàm trợ giúp telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Hàm trợ giúp giới hạn đồng thời tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các hàm trợ giúp cache khử trùng lặp trong bộ nhớ và có backend bền vững |
    | `plugin-sdk/delivery-queue-runtime` | Hàm trợ giúp drain chuyển phát đang chờ outbound |
    | `plugin-sdk/file-access-runtime` | Các hàm trợ giúp đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các hàm trợ giúp đánh thức, sự kiện và hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Hàm trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các hàm trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các hàm trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Hàm trợ giúp chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/exec-approvals-runtime` | Các hàm trợ giúp tệp chính sách phê duyệt exec mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng khuyến nghị; dùng các đường dẫn con runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các hàm trợ giúp cache nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các hàm trợ giúp cờ chẩn đoán, sự kiện và trace-context |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các hàm trợ giúp phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Các hàm trợ giúp fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu đã ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không cần import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Các hàm trợ giúp làm sạch URL dữ liệu ảnh inline và dò chữ ký mà không cần bề mặt runtime media rộng |
    | `plugin-sdk/response-limit-runtime` | Bộ đọc response-body có giới hạn mà không cần bề mặt runtime media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding hội thoại hiện tại mà không cần định tuyến binding đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các hàm trợ giúp session-store mà không cần import ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/sqlite-runtime` | Các hàm trợ giúp tập trung cho agent-schema, đường dẫn và giao dịch SQLite mà không có điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không cần import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các hàm trợ giúp hẹp cho ép kiểu và chuẩn hóa record/string primitive mà không cần import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các hàm trợ giúp chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các hàm trợ giúp cấu hình retry và trình chạy retry |
    | `plugin-sdk/agent-runtime` | Các hàm trợ giúp thư mục/danh tính/workspace agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích đã ngừng khuyến nghị `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper dùng chung để tải nạp/chuyển đổi/lưu trữ media, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã ngừng khuyến nghị; ưu tiên dùng helper lưu trữ trước khi đọc buffer khi một URL cần trở thành media của OpenClaw |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME phạm vi hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME và các helper loại media |
    | `plugin-sdk/media-store` | Các helper lưu trữ media phạm vi hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển đổi dự phòng tạo media dùng chung, chọn ứng viên và thông báo thiếu model |
    | `plugin-sdk/media-understanding` | Kiểu provider hiểu media cùng các export helper ảnh/âm thanh/trích xuất có cấu trúc dành cho provider |
    | `plugin-sdk/text-chunking` | Các helper chia khúc/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ directive và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia khúc văn bản gửi ra ngoài |
    | `plugin-sdk/speech` | Kiểu provider giọng nói cùng các export helper directive, registry, xác thực, bộ dựng TTS tương thích OpenAI và helper giọng nói dành cho provider |
    | `plugin-sdk/speech-core` | Các kiểu provider giọng nói, registry, directive, chuẩn hóa và export helper giọng nói dùng chung |
    | `plugin-sdk/realtime-transcription` | Kiểu provider phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Helper khởi tạo hồ sơ thời gian thực để chèn ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Kiểu provider giọng nói thời gian thực, helper registry và helper hành vi giọng nói thời gian thực dùng chung, bao gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Kiểu provider tạo ảnh cùng helper URL dữ liệu/tài sản ảnh và bộ dựng provider ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo ảnh, chuyển đổi dự phòng, xác thực và helper registry dùng chung |
    | `plugin-sdk/music-generation` | Kiểu provider/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển đổi dự phòng, tra cứu provider và phân tích model-ref |
    | `plugin-sdk/video-generation` | Kiểu provider/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển đổi dự phòng, tra cứu provider và phân tích model-ref |
    | `plugin-sdk/transcripts` | Kiểu provider nguồn transcript dùng chung, helper registry, bộ mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Re-export tương thích đã ngừng khuyến nghị; import `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích đã ngừng khuyến nghị, cục bộ trong repo, cho các kiểm thử OpenClaw cũ. Kiểm thử repo mới nên import các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` hoặc `plugin-sdk/test-fixtures` thay vào đó |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu, cục bộ trong repo, cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không import các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc, cục bộ trong repo, cho các kiểm thử xác thực, phân phối, dự phòng, tool-hook, prompt-overlay, schema và phép chiếu transcript |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh, cục bộ trong repo, cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi ra ngoài và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử trường hợp lỗi phân giải đích dùng chung, cục bộ trong repo, cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, artifact công khai, import trực tiếp, API runtime và tác dụng phụ khi import, cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng provider runtime, xác thực, discovery, onboard, catalog, wizard, năng lực media, chính sách replay, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải nạp web và stream, cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest opt-in, cục bộ trong repo, cho kiểm thử provider sử dụng `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chụp runtime CLI chung, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn Plugin đóng gói, terminal-text, chia khúc, auth-token và typed-case, cục bộ trong repo |
    | `plugin-sdk/test-node-mocks` | Helper mock tích hợp sẵn Node phạm vi hẹp, cục bộ trong repo, để dùng bên trong factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con bộ nhớ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đóng gói cho các helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry provider embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export engine nền tảng host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding host bộ nhớ, truy cập registry, provider cục bộ và helper batch/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã ngừng khuyến nghị; dùng API provider embedding chung cho provider mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export engine QMD host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Export engine lưu trữ host bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức host bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn host bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật host bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập về nhà cung cấp cho helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập về nhà cung cấp cho helper nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các Plugin gần bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Đường dẫn con helper đóng gói dành riêng">
    Các đường dẫn con SDK helper đóng gói dành riêng là các bề mặt hẹp, theo chủ sở hữu cụ thể, dành cho
    mã Plugin đóng gói. Chúng được theo dõi trong kho kiểm kê SDK để các bản dựng
    gói và việc đặt bí danh luôn xác định, nhưng chúng không phải API
    biên soạn Plugin chung. Các hợp đồng host có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex đóng gói để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex đóng gói để phản chiếu subagent gốc của app-server Codex vào trạng thái tác vụ OpenClaw |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
