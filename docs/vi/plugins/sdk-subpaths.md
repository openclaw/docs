---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho một import Plugin
    - Kiểm tra các đường dẫn con của Plugin đóng gói kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con SDK Plugin: import nào nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK được cung cấp dưới dạng một tập hợp các đường dẫn con công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo
mục đích. Bảng kiểm kê entrypoint của trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của package là tập con công khai
sau khi trừ các đường dẫn con kiểm thử/nội bộ chỉ dùng trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các đường dẫn con helper
dự trữ đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export helper
dự trữ không dùng sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong SDK công khai
như một khoản nợ tương thích ngủ yên.

Để xem hướng dẫn tạo Plugin, xem [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Đường dẫn con                  | Các export chính                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các helper mục của nhà cung cấp migration như `createMigrationItem`, hằng số lý do, marker trạng thái mục, helper biên tập dữ liệu nhạy cảm, và `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Các helper migration lúc chạy như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`                                               |
| `plugin-sdk/health`            | Các kiểu đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng, và phát hiện kiểm tra sức khỏe Doctor cho các consumer sức khỏe đi kèm                            |

### Tương thích đã ngừng khuyến nghị và helper kiểm thử

Các đường dẫn con đã ngừng khuyến nghị vẫn được export cho Plugin cũ hơn, nhưng code mới nên dùng
các đường dẫn con SDK tập trung bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các import sản xuất
đi kèm từ danh sách này. Các barrel rộng như `compat`, `config-types`,
`infra-runtime`, `text-runtime`, và `zod` chỉ dành cho tương thích. Import `zod`
trực tiếp từ `zod`.

Các đường dẫn con helper kiểm thử dựa trên Vitest của OpenClaw chỉ dùng nội bộ repo và không
còn là export của package: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, và `testing`.

### Đường dẫn con helper Plugin đi kèm dự trữ

Các đường dẫn con này là bề mặt tương thích do Plugin sở hữu cho Plugin đi kèm sở hữu chúng,
không phải API SDK chung: `plugin-sdk/codex-mcp-projection` và
`plugin-sdk/codex-native-task-runtime`. Các import extension xuyên chủ sở hữu bị chặn
bởi các hàng rào hợp đồng package.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Đường dẫn con | Phần xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Phần xuất schema Zod gốc của `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema có bộ nhớ đệm cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung, bộ dịch thiết lập, lời nhắc danh sách cho phép, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động nhiều tài khoản, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích cú pháp danh sách cho phép nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Nguyên thủy schema cấu hình kênh dùng chung cùng các bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đóng gói chỉ dành cho các plugin đóng gói được duy trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id kênh trò chuyện đóng gói/chính thức chuẩn cùng nhãn/bí danh định dạng cho các plugin cần nhận diện văn bản có tiền tố phong bì mà không mã hóa cứng bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã lỗi thời cho schema cấu hình kênh đóng gói |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng theo hợp đồng đóng gói |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích đầu vào kênh cấp thấp đã lỗi thời. Các đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ phân giải runtime đầu vào kênh cấp cao thử nghiệm và bộ dựng dữ kiện định tuyến cho các đường dẫn nhận kênh đã di trú. Ưu tiên dùng phần này thay vì tự lắp ráp danh sách cho phép hiệu lực, danh sách cho phép lệnh và các phép chiếu kế thừa trong từng plugin. Xem [API đầu vào kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Hợp đồng vòng đời thông điệp cùng tùy chọn pipeline trả lời, biên nhận, xem trước/phát trực tuyến trực tiếp, trình trợ giúp vòng đời, danh tính đầu ra, lập kế hoạch payload, gửi bền vững và trình trợ giúp ngữ cảnh gửi thông điệp. Xem [API đầu ra kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng các facade điều phối trả lời kế thừa. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng các facade điều phối trả lời kế thừa. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dùng chung để dựng tuyến đầu vào + phong bì |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` cho trình chạy đầu vào và vị từ điều phối, và `plugin-sdk/channel-outbound` cho trình trợ giúp phân phối thông điệp. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích cú pháp đích đã lỗi thời; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Trình trợ giúp dùng chung để tải phương tiện đầu ra và trạng thái hosted-media |
    | `plugin-sdk/outbound-send-deps` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời và bộ chuyển đổi ràng buộc luồng |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload phương tiện agent kế thừa |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp ràng buộc hội thoại/luồng, ghép đôi và ràng buộc đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Nguyên thủy schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Phần xuất prelude plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp chính sách bảo vệ direct-DM hẹp trước mã hóa |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích chủ sở hữu được theo dõi; plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho khả năng tương thích chủ sở hữu được theo dõi; plugin mới nên dùng trình trợ giúp runtime được tiêm hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã lỗi thời cho các gói Lark/Zalo đã phát hành vẫn nhập ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông điệp theo ngữ nghĩa, phân phối và trả lời tương tác kế thừa. Xem [Trình bày thông điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Trình trợ giúp đầu vào dùng chung cho phân loại sự kiện, dựng ngữ cảnh, định dạng, gốc, debounce, khớp mention, chính sách mention và ghi log đầu vào |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce đầu vào hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho chính sách mention, dấu mention và văn bản mention mà không bao gồm bề mặt runtime đầu vào rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động thông điệp kênh, cùng các trình trợ giúp schema native đã lỗi thời được giữ lại để tương thích plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp dùng chung cho chuẩn hóa tuyến, phân giải đích do parser điều khiển, chuyển thread-id thành chuỗi, khóa tuyến dedupe/compact, kiểu parsed-target và so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích cú pháp đích; các caller so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Nối dây phản hồi/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng bí mật hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu đích bí mật |
  </Accordion>

Các nhóm helper kênh không còn được khuyến nghị chỉ tiếp tục khả dụng để tương thích với plugin đã phát hành. Kế hoạch loại bỏ là: giữ chúng trong suốt giai đoạn chuyển đổi plugin bên ngoài, giữ các plugin trong repo/được đóng gói sẵn trên `channel-inbound` và `channel-outbound`, sau đó loại bỏ các đường dẫn con tương thích trong lần dọn dẹp SDK lớn tiếp theo. Điều này áp dụng cho các nhóm cũ về thông điệp/thời gian chạy kênh, truyền phát kênh, truy cập DM trực tiếp, phần tách helper inbound, tùy chọn trả lời, và đường dẫn ghép nối.

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper mô hình đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI, có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải API key lúc chạy cho provider plugins |
    | `plugin-sdk/provider-oauth-runtime` | Kiểu callback OAuth nhà cung cấp dùng chung, render trang callback, helper PKCE/state, phân tích authorization-input, helper hết hạn token và helper hủy |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/ghi profile API key, chẳng hạn `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Bộ dựng kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper nhập xác thực OpenAI Codex, export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng replay-policy dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper catalog mô hình nhà cung cấp trực tiếp cho khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc model-id, bộ nhớ đệm TTL và fallback tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung catalog nhà cung cấp và seam registry plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint nhà cung cấp dùng chung, lỗi HTTP nhà cung cấp và helper biểu mẫu nhiều phần cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Helper hợp đồng config/lựa chọn web-fetch phạm vi hẹp, chẳng hạn `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper config/thông tin xác thực web-search phạm vi hẹp cho các nhà cung cấp không cần nối dây bật plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper hợp đồng config/thông tin xác thực web-search phạm vi hẹp, chẳng hạn `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực có phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/bộ nhớ đệm/runtime nhà cung cấp web-search |
    | `plugin-sdk/embedding-providers` | Kiểu nhà cung cấp embedding tổng quát và helper đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; plugins đăng ký nhà cung cấp thông qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Kiểu snapshot mức sử dụng nhà cung cấp, helper lấy mức sử dụng dùng chung và các fetcher nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper stream, tương thích tool-call văn bản thuần và helper wrapper dùng chung Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và tiện ích stream tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport nhà cung cấp gốc, chẳng hạn fetch có bảo vệ, trích xuất văn bản tool-result, chuyển đổi thông điệp transport và stream sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper chế độ kích hoạt nhóm phạm vi hẹp và phân tích lệnh |
  </Accordion>

Snapshot mức sử dụng nhà cung cấp thường báo cáo một hoặc nhiều quota `windows`, mỗi cửa sổ có
nhãn, phần trăm đã dùng và thời gian đặt lại tùy chọn. Các nhà cung cấp hiển thị văn bản số dư hoặc
trạng thái tài khoản thay vì các cửa sổ quota có thể đặt lại nên trả về
`summary` cùng mảng `windows` trống thay vì bịa ra tỷ lệ phần trăm.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng thất bại hoặc không trả về dữ liệu mức sử dụng khả dụng.

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu tham số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Bộ dựng thông điệp lệnh/trợ giúp, chẳng hạn `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper profile/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt gốc gọn nhẹ cho điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler phê duyệt rộng hơn; ưu tiên seam adapter/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt gốc, liên kết tài khoản, route-gate, fallback chuyển tiếp và chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaction phê duyệt được mã hóa cứng, payload prompt reaction, kho mục tiêu reaction và export tương thích cho chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Helper payload trả lời phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc, chẳng hạn `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại khử trùng lặp trả lời inbound phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử hợp đồng kênh phạm vi hẹp không có barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu tham số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Predicate văn bản lệnh gọn nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập hợp đồng bí mật phạm vi hẹp cho bề mặt bí mật của kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` phạm vi hẹp và helper định kiểu SecretRef cho phân tích hợp đồng bí mật/config |
    | `plugin-sdk/secret-provider-integration` | Manifest tích hợp nhà cung cấp SecretRef chỉ kiểu và hợp đồng preset cho plugins xuất bản preset nhà cung cấp bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Helper dùng chung cho độ tin cậy, chặn DM, tệp/đường dẫn giới hạn bởi root bao gồm ghi chỉ tạo mới, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tạm thời sibling, fallback di chuyển liên thiết bị, helper kho tệp riêng tư, guard symlink-parent, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và helper thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher phạm vi hẹp không có bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch có bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/mục tiêu Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các helper rộng cho thời gian chạy/ghi nhật ký/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Các helper hẹp cho môi trường thời gian chạy, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho profile/defaults đã chuẩn hóa, phân tích cú pháp URL CDP và helper xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các helper vòng đời tác vụ chung và chuyển giao hoàn tất cho các agent dựa trên harness dùng phạm vi tác vụ do host cấp |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex đóng gói được dành riêng để chiếu cấu hình MCP server của người dùng vào cấu hình thread Codex; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex đóng gói riêng tư cho đấu nối mirror/thời gian chạy tác vụ native; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/channel-runtime-context` | Các helper chung để đăng ký và tra cứu runtime-context của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các helper dùng chung cho lệnh/hook/http/tương tác của Plugin |
    | `plugin-sdk/hook-runtime` | Các helper dùng chung cho pipeline hook Webhook/nội bộ |
    | `plugin-sdk/lazy-runtime` | Các helper import/binding thời gian chạy lazy như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các helper thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các helper định dạng CLI, chờ, phiên bản, gọi đối số và nhóm lệnh lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID kịch bản QA transport live dùng chung, helper độ phủ baseline và helper chọn kịch bản |
    | `plugin-sdk/gateway-method-runtime` | Helper dispatch phương thức Gateway dành riêng cho các route HTTP của Plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper khởi động client sẵn sàng cho event loop, RPC CLI Gateway, lỗi giao thức Gateway, phân giải host LAN được quảng bá và helper vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu được tập trung cho các shape cấu hình Plugin như `OpenClawConfig` và kiểu cấu hình kênh/provider |
    | `plugin-sdk/plugin-config-runtime` | Các helper tra cứu cấu hình Plugin thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các helper biến đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Các chuỗi gợi ý metadata chuyển giao message-tool dùng chung |
    | `plugin-sdk/runtime-config-snapshot` | Các helper snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đóng gói không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện autolink tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-reaction-runtime` | Binding phản ứng phê duyệt hardcoded, payload prompt phản ứng, store target phản ứng và export tương thích để ức chế prompt exec native cục bộ |
    | `plugin-sdk/approval-runtime` | Các helper phê duyệt exec/Plugin, builder capability phê duyệt, helper xác thực/profile, helper định tuyến/thời gian chạy native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các helper thời gian chạy inbound/reply dùng chung, chia đoạn, dispatch, Heartbeat, bộ lập kế hoạch reply |
    | `plugin-sdk/reply-dispatch-runtime` | Các helper hẹp cho dispatch/finalize reply và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các helper lịch sử reply cửa sổ ngắn dùng chung. Mã message-turn mới nên dùng `createChannelHistoryWindow`; các helper map cấp thấp hơn chỉ còn là export tương thích đã lỗi thời |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các helper chia đoạn text/markdown hẹp |
    | `plugin-sdk/session-store-runtime` | Các helper quy trình session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), đọc văn bản transcript người dùng/assistant gần đây có giới hạn theo danh tính session, helper đường dẫn store session cũ/session-key, đọc updated-at và helper tương thích whole-store/file-path chỉ dành cho chuyển tiếp |
    | `plugin-sdk/session-transcript-runtime` | Danh tính transcript, helper target/read/write theo phạm vi, phát hành cập nhật, khóa ghi và khóa hit bộ nhớ transcript |
    | `plugin-sdk/sqlite-runtime` | Các helper tập trung cho schema agent SQLite, đường dẫn và giao dịch cho thời gian chạy first-party |
    | `plugin-sdk/cron-store-runtime` | Các helper đường dẫn/tải/lưu store Cron |
    | `plugin-sdk/state-paths` | Các helper đường dẫn thư mục state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Kiểu keyed-state SQLite sidecar của Plugin cùng thiết lập pragma kết nối tập trung và bảo trì WAL cho cơ sở dữ liệu do Plugin sở hữu |
    | `plugin-sdk/routing` | Các helper binding route/session-key/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các helper tóm tắt trạng thái kênh/tài khoản dùng chung, default trạng thái thời gian chạy và helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Các helper phân giải target dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các helper chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ input dạng fetch/request |
    | `plugin-sdk/run-command` | Bộ chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các reader tham số tool/CLI chung |
    | `plugin-sdk/tool-plugin` | Định nghĩa một Plugin agent-tool có kiểu đơn giản và phơi bày metadata tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả tool |
    | `plugin-sdk/tool-send` | Trích xuất các trường target gửi chuẩn từ đối số tool |
    | `plugin-sdk/sandbox` | Kiểu backend sandbox và helper lệnh SSH/OpenShell, bao gồm preflight lệnh exec fail-fast |
    | `plugin-sdk/temp-path` | Các helper đường dẫn tải xuống tạm dùng chung và workspace tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Logger hệ con và helper biên tập thông tin nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các helper chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các helper ghi đè model/session như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các helper phân giải cấu hình talk provider |
    | `plugin-sdk/json-store` | Các helper đọc/ghi state JSON nhỏ |
    | `plugin-sdk/json-unsafe-integers` | Các helper phân tích cú pháp JSON giữ nguyên literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các helper file-lock tái nhập |
    | `plugin-sdk/persistent-dedupe` | Các helper cache dedupe dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các helper thời gian chạy/session ACP và reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Các helper đăng ký backend ACP nhẹ và reply-dispatch cho Plugin được tải lúc khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không cần import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình thời gian chạy agent hẹp |
    | `plugin-sdk/boolean-param` | Reader tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các helper phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các helper bootstrap thiết bị và token ghép nối |
    | `plugin-sdk/extension-shared` | Các primitive helper dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các helper reply cho lệnh/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các helper liệt kê lệnh Skills |
    | `plugin-sdk/native-command-registry` | Các helper registry/build/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, helper steer/abort active-run, helper cầu nối tool OpenClaw, helper chính sách tool runtime-plan, phân loại outcome terminal, helper định dạng/chi tiết tiến trình tool và tiện ích kết quả attempt |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do provider Z.AI sở hữu đã lỗi thời; dùng API công khai của Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper khóa async cục bộ theo tiến trình cho các tệp state thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Helper concurrency tác vụ async có giới hạn |
    | `plugin-sdk/dedupe-runtime` | Các helper cache dedupe trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain chuyển giao đang chờ outbound |
    | `plugin-sdk/file-access-runtime` | Các helper đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các helper đánh thức, sự kiện và khả năng hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Helper ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các helper token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các helper hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Helper chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/exec-approvals-runtime` | Các helper tệp chính sách phê duyệt exec mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các helper cache nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các helper cờ chẩn đoán, sự kiện và trace-context |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, helper phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và helper tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Bộ làm sạch URL dữ liệu hình ảnh inline và helper dò chữ ký mà không cần bề mặt thời gian chạy media rộng |
    | `plugin-sdk/response-limit-runtime` | Reader response-body có giới hạn mà không cần bề mặt thời gian chạy media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding hội thoại hiện tại mà không có định tuyến binding đã cấu hình hoặc store ghép nối |
    | `plugin-sdk/session-store-runtime` | Các helper session-store mà không import ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/sqlite-runtime` | Các helper tập trung cho schema agent SQLite, đường dẫn và giao dịch mà không có điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị context và lọc context bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các helper hẹp cho ép kiểu và chuẩn hóa primitive record/chuỗi mà không import markdown/ghi nhật ký |
    | `plugin-sdk/host-runtime` | Các helper chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các helper cấu hình retry và bộ chạy retry |
    | `plugin-sdk/agent-runtime` | Các helper thư mục/danh tính/workspace của agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích đã lỗi thời `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Truy vấn/chống trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper dùng chung để lấy/chuyển đổi/lưu trữ media, gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã ngừng khuyến nghị; ưu tiên helper lưu trữ trước khi đọc buffer khi một URL cần trở thành media của OpenClaw |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME và các helper loại media |
    | `plugin-sdk/media-store` | Các helper kho media hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển đổi dự phòng tạo media dùng chung, chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu media cùng các export helper hình ảnh/âm thanh/trích xuất có cấu trúc dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Các helper chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các export chỉ thị, registry, xác thực, bộ dựng TTS tương thích OpenAI và helper giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các export kiểu nhà cung cấp giọng nói dùng chung, registry, chỉ thị, chuẩn hóa và helper giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Helper khởi tạo hồ sơ thời gian thực cho việc chèn ngữ cảnh `IDENTITY.md`, `USER.md` và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực, helper registry và helper hành vi giọng nói thời gian thực dùng chung, gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng helper asset hình ảnh/data URL và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển đổi dự phòng, xác thực và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/transcripts` | Các kiểu nhà cung cấp nguồn bản ghi dùng chung, helper registry, mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Registry mục tiêu Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Tái xuất tương thích đã ngừng khuyến nghị; nhập `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích đã ngừng khuyến nghị, cục bộ trong repo, dành cho các kiểm thử OpenClaw cũ. Kiểm thử mới trong repo nên nhập các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu, cục bộ trong repo, dành cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không nhập các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc, cục bộ trong repo, cho các kiểm thử xác thực, phân phối, chuyển đổi dự phòng, tool-hook, prompt-overlay, schema và chiếu bản ghi |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh, cục bộ trong repo, cho các hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử trường hợp lỗi phân giải mục tiêu dùng chung, cục bộ trong repo, cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, artifact công khai, nhập trực tiếp, API runtime và tác dụng phụ khi nhập, cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực media, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, web-search/fetch và stream, cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest chọn dùng, cục bộ trong repo, cho các kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung, cục bộ trong repo, cho ghi nhận runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn Plugin đóng gói, terminal-text, chia đoạn, auth-token và typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock Node builtin tập trung, cục bộ trong repo, để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con về bộ nhớ">
    | Đường dẫn con | Xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đóng gói cho các helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding máy chủ bộ nhớ, truy cập registry, nhà cung cấp cục bộ và helper batch/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã ngừng khuyến nghị; dùng API nhà cung cấp embedding chung cho nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export engine QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Export engine lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho helper nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các Plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Đường dẫn con helper đóng gói dành riêng">
    Các đường dẫn con SDK helper đóng gói dành riêng là những bề mặt hẹp theo chủ sở hữu
    dành cho mã Plugin đóng gói. Chúng được theo dõi trong kho SDK để các bản build
    gói và bí danh luôn xác định, nhưng không phải là API soạn thảo Plugin chung.
    Các hợp đồng máy chủ tái sử dụng mới nên dùng các đường dẫn con SDK chung
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
