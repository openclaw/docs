---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho một lệnh nhập Plugin
    - Kiểm tra các đường dẫn con của Plugin đóng gói kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này lập danh mục các đường dẫn con thường dùng, được nhóm theo
mục đích. Bản kiểm kê điểm vào trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các bản xuất của gói là tập con công khai
sau khi trừ các đường dẫn con kiểm thử/nội bộ cục bộ của repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Người bảo trì có thể kiểm tra
số lượng bản xuất công khai bằng `pnpm plugin-sdk:surface` và các đường dẫn con
trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các bản xuất
trợ giúp dành riêng không dùng sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong SDK công khai như
nợ tương thích không hoạt động.

Để xem hướng dẫn tạo Plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Đường dẫn con                  | Các bản xuất chính                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các trình trợ giúp mục nhà cung cấp di chuyển như `createMigrationItem`, hằng số lý do, dấu hiệu trạng thái mục, trình trợ giúp biên tập che giấu, và `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Các trình trợ giúp di chuyển runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`                                        |
| `plugin-sdk/health`            | Đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng, và kiểu phát hiện cho kiểm tra sức khỏe Doctor dành cho các trình tiêu thụ sức khỏe được đóng gói          |

### Tương thích đã ngừng khuyến nghị và trình trợ giúp kiểm thử

Các đường dẫn con đã ngừng khuyến nghị vẫn được xuất cho các Plugin cũ hơn, nhưng mã mới nên dùng
các đường dẫn con SDK tập trung bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các lượt nhập production
được đóng gói từ danh sách này. Các barrel rộng như `compat`, `config-types`,
`infra-runtime`, `text-runtime`, và `zod` chỉ dành cho tương thích. Nhập `zod`
trực tiếp từ `zod`.

Các đường dẫn con trình trợ giúp kiểm thử dựa trên Vitest của OpenClaw chỉ dùng cục bộ trong repo và
không còn là bản xuất của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, và `testing`.

### Đường dẫn con trình trợ giúp Plugin được đóng gói dành riêng

Các đường dẫn con này là bề mặt tương thích do Plugin sở hữu cho Plugin được đóng gói sở hữu chúng,
không phải API SDK dùng chung: `plugin-sdk/codex-mcp-projection` và
`plugin-sdk/codex-native-task-runtime`. Các lượt nhập tiện ích mở rộng khác chủ sở hữu bị chặn
bởi các cơ chế bảo vệ hợp đồng gói.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod `openclaw.json` cấp gốc (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema được lưu trong bộ nhớ đệm cho các schema do Plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp wizard thiết lập dùng chung, trình dịch thiết lập, lời nhắc danh sách cho phép, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình nhiều tài khoản/cổng hành động, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa mã định danh tài khoản |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích cú pháp danh sách cho phép của nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình kênh dùng chung cùng các bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw được đóng gói kèm chỉ dành cho các Plugin đóng gói kèm được duy trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Các mã định danh kênh chat đóng gói kèm/chính thức chuẩn tắc cùng nhãn định dạng/bí danh cho các Plugin cần nhận diện văn bản có tiền tố envelope mà không hardcode bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã lỗi thời cho schema cấu hình kênh đóng gói kèm |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đóng gói kèm |
    | `plugin-sdk/command-gating` | Trình trợ giúp hẹp cho cổng ủy quyền lệnh |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích ingress kênh cấp thấp đã lỗi thời. Các đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ phân giải runtime ingress kênh cấp cao thử nghiệm và bộ dựng dữ kiện route cho các đường dẫn nhận kênh đã di chuyển. Ưu tiên phần này thay vì tự lắp ráp danh sách cho phép hiệu lực, danh sách cho phép lệnh và projection legacy trong từng Plugin. Xem [API ingress kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Hợp đồng vòng đời tin nhắn cùng tùy chọn pipeline trả lời, biên nhận, xem trước/phát trực tiếp, trình trợ giúp vòng đời, danh tính outbound, lập kế hoạch payload, gửi bền vững và trình trợ giúp ngữ cảnh gửi tin nhắn. Xem [API outbound kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng các facade điều phối trả lời legacy. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng các facade điều phối trả lời legacy. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dựng route inbound + envelope dùng chung |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` cho runner inbound và predicate điều phối, và `plugin-sdk/channel-outbound` cho trình trợ giúp gửi tin nhắn. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích cú pháp target đã lỗi thời; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media outbound dùng chung và trạng thái media được lưu trữ |
    | `plugin-sdk/outbound-send-deps` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời thread-binding và adapter |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload media agent legacy |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp liên kết cuộc hội thoại/thread, ghép cặp và liên kết đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export prelude Plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp hẹp cho chính sách bảo vệ direct-DM trước mã hóa |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng trình trợ giúp runtime được tiêm hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã lỗi thời cho các gói Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; Plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày tin nhắn ngữ nghĩa, phân phối và trả lời tương tác legacy. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Trình trợ giúp inbound dùng chung cho phân loại sự kiện, dựng ngữ cảnh, định dạng, root, debounce, khớp mention, chính sách mention và ghi log inbound |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho chính sách mention, marker mention và văn bản mention mà không kèm bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động tin nhắn kênh, cùng với trình trợ giúp schema native đã lỗi thời được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp dùng chung cho chuẩn hóa route, phân giải target dựa trên parser, chuyển thread-id thành chuỗi, khóa route dedupe/compact, kiểu parsed-target và so sánh route/target |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích cú pháp target; caller so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hẹp cho hợp đồng secret như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu target secret |
  </Accordion>

Các họ trình trợ giúp kênh đã lỗi thời chỉ còn khả dụng để tương thích với
Plugin đã phát hành. Kế hoạch gỡ bỏ là: giữ chúng trong suốt khung thời gian
di chuyển Plugin bên ngoài, giữ Plugin trong repo/đóng gói kèm trên
`channel-inbound` và `channel-outbound`, rồi gỡ các đường dẫn con tương thích
trong lần dọn dẹp SDK major tiếp theo. Điều này áp dụng cho các họ cũ về
tin nhắn/runtime kênh, streaming kênh, quyền truy cập direct-DM, mảnh ghép
trình trợ giúp inbound, tùy chọn trả lời và pairing-path.

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper cho mô hình đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải khóa API lúc chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-oauth-runtime` | Kiểu callback OAuth nhà cung cấp chung, render trang callback, helper PKCE/trạng thái, phân tích đầu vào ủy quyền, helper hết hạn token và helper hủy |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/ghi hồ sơ khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình dựng kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper nhập xác thực OpenAI Codex, export tương thích đã ngừng khuyến nghị `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, trình dựng chính sách phát lại dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper catalog mô hình nhà cung cấp trực tiếp cho khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc model-id, cache TTL và fallback tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung catalog nhà cung cấp và điểm nối registry plugin-provider cho kiểm thử contract |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint chung của nhà cung cấp, lỗi HTTP của nhà cung cấp và helper biểu mẫu multipart cho phiên âm audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper contract cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/cache nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper cấu hình/thông tin xác thực web-search hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper contract cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/cache/runtime nhà cung cấp web-search |
    | `plugin-sdk/embedding-providers` | Kiểu nhà cung cấp embedding chung và helper đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; Plugin đăng ký nhà cung cấp thông qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Kiểu snapshot mức sử dụng nhà cung cấp, helper fetch mức sử dụng dùng chung và fetcher nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper stream, tương thích lệnh gọi công cụ plain-text và helper wrapper dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và tiện ích stream tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport nhà cung cấp gốc như fetch có bảo vệ, trích xuất văn bản tool-result, chuyển đổi thông điệp transport và stream sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper chế độ kích hoạt nhóm hẹp và phân tích lệnh |
  </Accordion>

Snapshot mức sử dụng nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn mức, mỗi cửa sổ có
nhãn, phần trăm đã dùng và thời điểm đặt lại tùy chọn. Các nhà cung cấp hiển thị số dư hoặc
văn bản trạng thái tài khoản thay vì các cửa sổ hạn mức có thể đặt lại nên trả về
`summary` với mảng `windows` rỗng thay vì dựng phần trăm giả.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng thất bại hoặc không trả về dữ liệu mức sử dụng có thể dùng được.

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt gốc nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime trình xử lý phê duyệt rộng hơn; ưu tiên các điểm nối adapter/gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt gốc, ràng buộc tài khoản, cổng định tuyến, fallback chuyển tiếp và chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Liên kết reaction phê duyệt hardcoded, payload prompt reaction, kho mục tiêu reaction và export tương thích cho chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Helper payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại chống trùng lặp phản hồi đến hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử contract kênh hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Predicate văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập secret-contract hẹp cho bề mặt secret của kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` hẹp và kiểu SecretRef cho phân tích secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Contract manifest tích hợp nhà cung cấp SecretRef chỉ ở mức kiểu và preset cho Plugin phát hành preset nhà cung cấp secret bên ngoài |
    | `plugin-sdk/security-runtime` | Helper dùng chung về tin cậy, cổng DM, file/đường dẫn giới hạn theo root, bao gồm ghi chỉ tạo mới, thay thế file nguyên tử sync/async, ghi tạm sibling, fallback di chuyển xuyên thiết bị, helper kho file riêng tư, guard parent symlink, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh secret hằng thời gian và helper thu thập secret |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher hẹp không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch được bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích đầu vào secret |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/mục tiêu Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/timeout thân yêu cầu |
  </Accordion>

  <Accordion title="Đường dẫn con thời gian chạy và lưu trữ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Trình trợ giúp rộng cho thời gian chạy/ghi log/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Trình trợ giúp hẹp cho môi trường thời gian chạy, bộ ghi log, thời gian chờ, thử lại và lùi thời gian |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/mặc định đã chuẩn hóa, phân tích URL CDP và trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Trình trợ giúp chung cho vòng đời tác vụ và phân phối hoàn tất cho các tác tử dựa trên harness sử dụng phạm vi tác vụ do host phát hành |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp Codex đóng gói được dành riêng để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp Codex đóng gói riêng tư cho nối dây gương tác vụ gốc/thời gian chạy; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/channel-runtime-context` | Trình trợ giúp chung để đăng ký và tra cứu ngữ cảnh thời gian chạy của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Trình trợ giúp chung cho lệnh/móc/http/tương tác của Plugin |
    | `plugin-sdk/hook-runtime` | Trình trợ giúp chung cho pipeline Webhook/móc nội bộ |
    | `plugin-sdk/lazy-runtime` | Trình trợ giúp import/liên kết thời gian chạy lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Trình trợ giúp CLI cho định dạng, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/qa-live-transport-scenarios` | ID kịch bản QA vận chuyển trực tiếp dùng chung, trình trợ giúp độ phủ đường cơ sở và trình trợ giúp chọn kịch bản |
    | `plugin-sdk/gateway-method-runtime` | Trình trợ giúp điều phối phương thức Gateway được dành riêng cho các tuyến HTTP của Plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trình trợ giúp khởi động máy khách sẵn sàng vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và trình trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho các hình dạng cấu hình Plugin như `OpenClawConfig` và kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Trình trợ giúp tra cứu cấu hình Plugin thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Trình trợ giúp biến đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chuỗi gợi ý siêu dữ liệu phân phối công cụ tin nhắn dùng chung |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp ảnh chụp nhanh cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và bộ đặt ảnh chụp nhanh kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đóng gói không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-reaction-runtime` | Liên kết phản ứng phê duyệt được mã hóa cứng, payload lời nhắc phản ứng, kho đích phản ứng và export tương thích để chặn lời nhắc thực thi gốc cục bộ |
    | `plugin-sdk/approval-runtime` | Trình trợ giúp phê duyệt thực thi/Plugin, bộ dựng khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ, trình trợ giúp định tuyến/thời gian chạy gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Trình trợ giúp thời gian chạy chung cho tin đến/trả lời, chia khúc, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp hẹp cho điều phối/hoàn tất trả lời và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Trình trợ giúp lịch sử trả lời cửa sổ ngắn dùng chung. Mã lượt tin nhắn mới nên dùng `createChannelHistoryWindow`; các trình trợ giúp map cấp thấp hơn chỉ còn là export tương thích đã ngừng khuyến nghị |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Trình trợ giúp hẹp cho chia khúc văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Trình trợ giúp quy trình phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), đọc văn bản transcript người dùng/trợ lý gần đây có giới hạn theo danh tính phiên, trình trợ giúp đường dẫn kho phiên cũ/khóa phiên, đọc updated-at và trình trợ giúp tương thích toàn bộ kho/đường dẫn tệp chỉ trong giai đoạn chuyển tiếp |
    | `plugin-sdk/session-transcript-runtime` | Danh tính transcript, trình trợ giúp đích/đọc/ghi theo phạm vi, phát hành cập nhật, khóa ghi và khóa trúng bộ nhớ transcript |
    | `plugin-sdk/sqlite-runtime` | Trình trợ giúp SQLite tập trung cho schema tác tử, đường dẫn và giao dịch dành cho thời gian chạy bên thứ nhất |
    | `plugin-sdk/cron-store-runtime` | Trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Kiểu trạng thái theo khóa SQLite sidecar của Plugin cộng với thiết lập pragma kết nối tập trung và bảo trì WAL cho cơ sở dữ liệu do Plugin sở hữu |
    | `plugin-sdk/routing` | Trình trợ giúp liên kết tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Trình trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái thời gian chạy và trình trợ giúp siêu dữ liệu vấn đề |
    | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp phân giải đích dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có thời hạn với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Trình đọc tham số công cụ/CLI chung |
    | `plugin-sdk/tool-plugin` | Định nghĩa Plugin công cụ tác tử có kiểu đơn giản và phơi bày siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/sandbox` | Kiểu backend sandbox và trình trợ giúp lệnh SSH/OpenShell, bao gồm preflight lệnh thực thi fail-fast |
    | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tải xuống tạm dùng chung và không gian làm việc tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Trình trợ giúp bộ ghi log hệ con và biên tập dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Trình trợ giúp phân giải cấu hình nhà cung cấp nói chuyện |
    | `plugin-sdk/json-store` | Trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Trình trợ giúp phân tích JSON giữ nguyên literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Trình trợ giúp khóa tệp có thể tái nhập |
    | `plugin-sdk/persistent-dedupe` | Trình trợ giúp bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Trình trợ giúp thời gian chạy/phiên ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Trình trợ giúp nhẹ cho đăng ký backend ACP và điều phối trả lời dành cho Plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Primitive schema cấu hình thời gian chạy tác tử hẹp |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Trình trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Trình trợ giúp bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Primitive trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Trình trợ giúp trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Trình trợ giúp registry/xây dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin đáng tin cậy thử nghiệm cho harness tác tử cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lần chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch thời gian chạy, phân loại kết quả terminal, trình trợ giúp định dạng/chi tiết tiến độ công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do nhà cung cấp Z.AI sở hữu đã ngừng khuyến nghị; dùng API công khai của Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa bất đồng bộ cục bộ theo tiến trình cho các tệp trạng thái thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp đo từ xa hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp giới hạn đồng thời tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Trình trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp xả hàng đợi phân phối đi đang chờ |
    | `plugin-sdk/file-access-runtime` | Trình trợ giúp đường dẫn tệp cục bộ và nguồn phương tiện an toàn |
    | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ trạng thái sẵn sàng vận chuyển |
    | `plugin-sdk/exec-approvals-runtime` | Trình trợ giúp tệp chính sách phê duyệt thực thi không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng khuyến nghị; dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh truy vết |
    | `plugin-sdk/error-runtime` | Trình trợ giúp đồ thị lỗi, định dạng, phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Trình trợ giúp làm sạch URL dữ liệu hình ảnh inline và dò chữ ký mà không cần bề mặt thời gian chạy phương tiện rộng |
    | `plugin-sdk/response-limit-runtime` | Trình đọc body phản hồi có giới hạn mà không cần bề mặt thời gian chạy phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết hội thoại hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên không import ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/sqlite-runtime` | Trình trợ giúp SQLite tập trung cho schema tác tử, đường dẫn và giao dịch mà không có điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Trình trợ giúp hẹp cho ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa tên host và host SCP |
    | `plugin-sdk/retry-runtime` | Trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Trình trợ giúp thư mục/danh tính/không gian làm việc của tác tử, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper tìm nạp/chuyển đổi/lưu trữ phương tiện dùng chung, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` và `fetchRemoteMedia` đã ngừng khuyến nghị; ưu tiên helper lưu trữ trước khi đọc buffer khi URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME và các helper loại phương tiện |
    | `plugin-sdk/media-store` | Các helper kho phương tiện hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển dự phòng tạo phương tiện dùng chung, chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng các export helper xử lý hình ảnh/âm thanh/trích xuất có cấu trúc dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Các helper chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các export helper chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI và giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói dùng chung, registry, chỉ thị, chuẩn hóa và các export helper giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap hồ sơ thời gian thực để chèn ngữ cảnh giới hạn từ `IDENTITY.md`, `USER.md` và `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực, helper registry và helper hành vi giọng nói thời gian thực dùng chung, bao gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng helper asset hình ảnh/data URL và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển dự phòng, xác thực và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/transcripts` | Các kiểu nhà cung cấp nguồn bản chép lời dùng chung, helper registry, bộ mô tả phiên và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các helper tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Re-export tương thích đã ngừng khuyến nghị; import `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích cục bộ trong repo đã ngừng khuyến nghị cho các bài kiểm thử OpenClaw cũ. Bài kiểm thử repo mới nên import các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu cục bộ trong repo cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không import các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter runtime agent gốc cục bộ trong repo cho các bài kiểm thử xác thực, phân phối, dự phòng, tool-hook, prompt-overlay, schema và chiếu transcript |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh cục bộ trong repo cho hợp đồng hành động/thiết lập/trạng thái chung, assertion thư mục, vòng đời khởi động tài khoản, phân luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ ca lỗi phân giải đích dùng chung cục bộ trong repo cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, artifact công khai, import trực tiếp, API runtime và hiệu ứng phụ import cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực phương tiện, chính sách phát lại, STT thời gian thực với âm thanh trực tiếp, tìm kiếm/tìm nạp web và stream cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest bật tùy chọn cục bộ trong repo cho các bài kiểm thử nhà cung cấp dùng `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cục bộ trong repo cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn Plugin đóng gói, terminal-text, chia đoạn, auth-token và typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock Node builtin tập trung cục bộ trong repo để dùng trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con bộ nhớ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đóng gói cho các helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các export engine nền tảng host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding host bộ nhớ, truy cập registry, nhà cung cấp cục bộ và helper batch/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã ngừng khuyến nghị; dùng API nhà cung cấp embedding chung cho nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các export engine QMD host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các export engine lưu trữ host bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức host bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn host bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật host bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập theo nhà cung cấp cho helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập theo nhà cung cấp cho helper nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các Plugin lân cận bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã ngừng khuyến nghị; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Đường dẫn con helper đóng gói được dành riêng">
    Các đường dẫn con SDK helper đóng gói được dành riêng là các bề mặt hẹp dành riêng cho chủ sở hữu đối với
    mã Plugin đóng gói. Chúng được theo dõi trong kho SDK để các bản build
    gói và alias luôn xác định, nhưng chúng không phải là API viết Plugin
    chung. Hợp đồng host tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex đóng gói để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex đóng gói để phản chiếu subagent gốc app-server Codex vào trạng thái tác vụ OpenClaw |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
