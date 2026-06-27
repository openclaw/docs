---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho lệnh nhập Plugin
    - Kiểm tra các đường dẫn con của Plugin được đóng gói kèm và các bề mặt helper
summary: 'Danh mục đường dẫn con Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con Plugin SDK
x-i18n:
    generated_at: "2026-06-27T17:59:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các subpath công khai hẹp bên dưới
`openclaw/plugin-sdk/`. Trang này liệt kê các subpath thường dùng, được nhóm theo
mục đích. Bản kiểm kê entrypoint trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của gói là tập con công khai
sau khi loại trừ các subpath kiểm thử/nội bộ chỉ dùng trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các subpath helper dành
riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export helper
dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong SDK
công khai như khoản nợ tương thích ngủ yên.

Để xem hướng dẫn tạo Plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Subpath                        | Các export chính                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các helper mục nhà cung cấp di chuyển như `createMigrationItem`, hằng lý do, marker trạng thái mục, helper biên tập thông tin nhạy cảm, và `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | Các helper di chuyển runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Đăng ký kiểm tra sức khỏe Doctor, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng, và các kiểu phát hiện cho những consumer sức khỏe được đóng gói                  |

### Tương thích đã ngừng khuyến nghị và helper kiểm thử

Các subpath đã ngừng khuyến nghị vẫn được export cho Plugin cũ, nhưng mã mới nên dùng
các subpath SDK chuyên biệt bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các import sản xuất
được đóng gói từ danh sách này. Các barrel rộng như `compat`, `config-types`,
`infra-runtime`, `text-runtime`, và `zod` chỉ dành cho tương thích. Import `zod`
trực tiếp từ `zod`.

Các subpath test-helper dựa trên Vitest của OpenClaw chỉ dùng trong repo và không còn là
export của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, và `testing`.

### Subpath helper Plugin được đóng gói dành riêng

Các subpath này là bề mặt tương thích do Plugin sở hữu cho Plugin được đóng gói sở hữu
chúng, không phải API SDK chung: `plugin-sdk/codex-mcp-projection` và
`plugin-sdk/codex-native-task-runtime`. Các import phần mở rộng xuyên chủ sở hữu bị chặn
bởi các rào chắn hợp đồng gói.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc của `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema có bộ nhớ đệm cho các schema do Plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp wizard thiết lập dùng chung, bộ dịch thiết lập, prompt danh sách cho phép, trình dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias tương thích đã lỗi thời; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động đa tài khoản, trình trợ giúp fallback tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + fallback mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích danh sách cho phép access-group và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình kênh dùng chung cùng với trình dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw được đóng gói chỉ dành cho các Plugin đóng gói được duy trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID kênh chat đóng gói/chính thức chuẩn cùng với nhãn/alias định dạng cho các Plugin cần nhận diện văn bản có tiền tố envelope mà không hardcode bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias tương thích đã lỗi thời cho schema cấu hình kênh đóng gói |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với fallback theo hợp đồng đóng gói |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích ingress kênh cấp thấp đã lỗi thời. Các đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ phân giải runtime ingress kênh cấp cao thử nghiệm và trình dựng fact route cho các đường dẫn nhận kênh đã di chuyển. Ưu tiên dùng phần này thay vì lắp ráp danh sách cho phép hiệu lực, danh sách lệnh cho phép và phép chiếu legacy trong từng Plugin. Xem [API ingress kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Hợp đồng vòng đời thông điệp cùng với tùy chọn pipeline trả lời, biên nhận, xem trước/phát trực tiếp live, trình trợ giúp vòng đời, danh tính outbound, lập kế hoạch payload, gửi bền vững và trình trợ giúp ngữ cảnh gửi thông điệp. Xem [API outbound kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng với các facade điều phối trả lời legacy. |
    | `plugin-sdk/channel-message-runtime` | Alias tương thích đã lỗi thời cho `plugin-sdk/channel-outbound` cùng với các facade điều phối trả lời legacy. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dựng route inbound + envelope dùng chung |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` cho runner inbound và predicate điều phối, và `plugin-sdk/channel-outbound` cho trình trợ giúp gửi thông điệp. |
    | `plugin-sdk/messaging-targets` | Alias phân tích target đã lỗi thời; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media outbound dùng chung và trạng thái hosted-media |
    | `plugin-sdk/outbound-send-deps` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời thread-binding và adapter |
    | `plugin-sdk/agent-media-payload` | Trình dựng payload media agent legacy |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp binding hội thoại/thread, ghép cặp và binding đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải group-policy runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export prelude Plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định group-access dùng chung |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp chính sách guard direct-DM tiền mã hóa hẹp |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích owner được theo dõi; Plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho khả năng tương thích owner được theo dõi; Plugin mới nên dùng trình trợ giúp runtime được tiêm vào hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã lỗi thời cho các gói Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; Plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông điệp theo ngữ nghĩa, gửi và trả lời tương tác legacy. Xem [Trình bày thông điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Trình trợ giúp inbound dùng chung cho phân loại sự kiện, dựng ngữ cảnh, định dạng, root, debounce, khớp mention, mention-policy và ghi log inbound |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho mention-policy, marker mention và văn bản mention mà không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade tương thích đã lỗi thời. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động thông điệp kênh, cùng với trình trợ giúp schema native đã lỗi thời được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp chuẩn hóa route dùng chung, phân giải target do parser điều khiển, chuỗi hóa thread-id, khóa route dedupe/compact, kiểu parsed-target và so sánh route/target |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích target; caller so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp secret-contract hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu target bí mật |
  </Accordion>

Các họ trình trợ giúp kênh đã lỗi thời chỉ còn khả dụng cho khả năng tương thích
với Plugin đã phát hành. Kế hoạch gỡ bỏ là: giữ chúng trong suốt khoảng thời gian
di chuyển Plugin bên ngoài, giữ Plugin trong repo/được đóng gói trên `channel-inbound` và
`channel-outbound`, rồi gỡ các đường dẫn con tương thích trong lần dọn dẹp lớn tiếp theo
của SDK. Điều này áp dụng cho các họ cũ về thông điệp/runtime kênh, phát trực tuyến
kênh, truy cập direct-DM, phần tách nhỏ của trình trợ giúp inbound, reply-options,
và pairing-path.

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và trình trợ giúp mô hình đã tải |
    | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp phân giải API-key runtime cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-oauth-runtime` | Kiểu callback OAuth nhà cung cấp chung, render trang callback, trình trợ giúp PKCE/trạng thái, phân tích đầu vào ủy quyền, trình trợ giúp hết hạn token và trình trợ giúp hủy bỏ |
    | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp onboarding/ghi hồ sơ API-key như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Bộ dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-env-vars` | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, trình trợ giúp nhập xác thực OpenAI Codex, export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách replay dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Trình trợ giúp catalog mô hình nhà cung cấp live cho khám phá kiểu `/models` có bảo vệ: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc model-id, bộ nhớ đệm TTL và fallback tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung catalog nhà cung cấp và seam registry plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Trình trợ giúp khả năng HTTP/endpoint nhà cung cấp chung, lỗi HTTP nhà cung cấp và trình trợ giúp biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Trình trợ giúp hợp đồng cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình/thông tin xác thực web-search hẹp cho nhà cung cấp không cần nối dây bật plugin |
    | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Trình trợ giúp đăng ký/bộ nhớ đệm/runtime nhà cung cấp web-search |
    | `plugin-sdk/embedding-providers` | Kiểu nhà cung cấp embedding chung và trình trợ giúp đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; plugin đăng ký nhà cung cấp qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Kiểu snapshot mức sử dụng nhà cung cấp, trình trợ giúp fetch mức sử dụng dùng chung và fetcher nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper stream, tương thích lệnh gọi công cụ văn bản thuần và trình trợ giúp wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-stream-shared` | Trình trợ giúp wrapper stream nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và tiện ích stream tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport nhà cung cấp gốc như fetch có bảo vệ, biến đổi thông điệp transport và stream sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Trình trợ giúp patch cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Trình trợ giúp singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Trình trợ giúp chế độ kích hoạt nhóm hẹp và phân tích lệnh |
  </Accordion>

Snapshot mức sử dụng nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn mức, mỗi cửa sổ có
nhãn, phần trăm đã dùng và thời điểm đặt lại tùy chọn. Nhà cung cấp phơi bày văn bản số dư hoặc
trạng thái tài khoản thay vì các cửa sổ hạn mức có thể đặt lại nên trả về
`summary` cùng mảng `windows` rỗng thay vì tự tạo phần trăm.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng thất bại hoặc không trả về dữ liệu mức sử dụng dùng được.

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, trình trợ giúp registry lệnh bao gồm định dạng menu đối số động, trình trợ giúp ủy quyền người gửi |
    | `plugin-sdk/command-status` | Bộ dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp phân giải người phê duyệt và xác thực hành động cùng chat |
    | `plugin-sdk/approval-client-runtime` | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter khả năng/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp tải adapter phê duyệt gốc nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp runtime handler phê duyệt rộng hơn; ưu tiên các seam adapter/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Trình trợ giúp mục tiêu phê duyệt gốc, liên kết tài khoản, cổng định tuyến, fallback chuyển tiếp và chặn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaction phê duyệt hardcoded, payload lời nhắc reaction, kho mục tiêu reaction và export tương thích cho chặn lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp payload trả lời phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Trình trợ giúp payload phê duyệt exec/plugin, trình trợ giúp định tuyến/runtime phê duyệt gốc và trình trợ giúp hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Trình trợ giúp đặt lại chống trùng lặp trả lời inbound hẹp |
    | `plugin-sdk/channel-contract-testing` | Trình trợ giúp kiểm thử hợp đồng kênh hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và trình trợ giúp mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Vị từ văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Trình trợ giúp chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp thu thập hợp đồng bí mật hẹp cho bề mặt bí mật kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | Trình trợ giúp `coerceSecretRef` hẹp và kiểu SecretRef cho phân tích hợp đồng/cấu hình bí mật |
    | `plugin-sdk/secret-provider-integration` | Hợp đồng manifest tích hợp nhà cung cấp SecretRef chỉ kiểu và preset cho plugin phát hành preset nhà cung cấp bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Trình trợ giúp dùng chung về tin cậy, cổng DM, file/đường dẫn giới hạn theo root, bao gồm ghi chỉ tạo mới, thay thế file nguyên tử sync/async, ghi temp cùng cấp, fallback di chuyển liên thiết bị, trình trợ giúp kho file riêng tư, guard symlink-parent, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và trình trợ giúp thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Trình trợ giúp allowlist host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Trình trợ giúp pinned-dispatcher hẹp không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Trình trợ giúp pinned-dispatcher, fetch được bảo vệ SSRF, lỗi SSRF và chính sách SSRF |
    | `plugin-sdk/secret-input` | Trình trợ giúp phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu/mục tiêu Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | Trình trợ giúp kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn con thời gian chạy và lưu trữ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp rộng cho thời gian chạy/ghi log/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp hẹp cho môi trường thời gian chạy, trình ghi log, thời gian chờ, thử lại và lùi dần |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích URL CDP và trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các trình trợ giúp vòng đời tác vụ và gửi hoàn tất chung cho agent dựa trên harness dùng phạm vi tác vụ do host phát hành |
    | `plugin-sdk/codex-mcp-projection` | Trình trợ giúp Codex đi kèm được dành riêng để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Trình trợ giúp Codex đi kèm riêng tư cho liên kết mirror/thời gian chạy tác vụ gốc; không dành cho Plugin bên thứ ba |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp đăng ký và tra cứu ngữ cảnh thời gian chạy kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; Plugin mới nên nhập trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các trình trợ giúp lệnh/hook/http/tương tác dùng chung cho Plugin |
    | `plugin-sdk/hook-runtime` | Các trình trợ giúp pipeline hook nội bộ/Webhook dùng chung |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp nhập/liên kết thời gian chạy lazy như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các trình trợ giúp định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID kịch bản QA vận chuyển live dùng chung, trình trợ giúp phạm vi baseline và trình trợ giúp chọn kịch bản |
    | `plugin-sdk/gateway-method-runtime` | Trình trợ giúp điều phối phương thức Gateway được dành riêng cho các route HTTP của Plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, trình trợ giúp khởi động client sẵn sàng vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và trình trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho các hình dạng cấu hình Plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các trình trợ giúp tra cứu cấu hình Plugin ở thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Các chuỗi gợi ý siêu dữ liệu gửi công cụ tin nhắn dùng chung |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-reaction-runtime` | Liên kết phản ứng phê duyệt hardcode, payload lời nhắc phản ứng, kho mục tiêu phản ứng và mục xuất tương thích để triệt tiêu lời nhắc exec gốc cục bộ |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp phê duyệt exec/Plugin, bộ dựng năng lực phê duyệt, trình trợ giúp xác thực/hồ sơ, trình trợ giúp định tuyến/thời gian chạy gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp thời gian chạy trả lời/đầu vào dùng chung, chia đoạn, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp hẹp cho điều phối/hoàn tất trả lời và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các trình trợ giúp lịch sử trả lời cửa sổ ngắn dùng chung. Mã lượt tin nhắn mới nên dùng `createChannelHistoryWindow`; các trình trợ giúp map cấp thấp hơn chỉ còn là mục xuất tương thích đã lỗi thời |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp chia đoạn văn bản/markdown hẹp |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp quy trình phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), đọc văn bản transcript người dùng/assistant gần đây có giới hạn theo danh tính phiên, trình trợ giúp đường dẫn kho phiên/khóa phiên cũ, đọc updated-at và các trình trợ giúp tương thích chỉ dùng trong chuyển tiếp cho toàn bộ kho/đường dẫn tệp |
    | `plugin-sdk/session-transcript-runtime` | Danh tính transcript, trình trợ giúp mục tiêu/đọc/ghi có phạm vi, xuất bản cập nhật, khóa ghi và khóa hit bộ nhớ transcript |
    | `plugin-sdk/sqlite-runtime` | Các trình trợ giúp tập trung cho schema agent SQLite, đường dẫn và giao dịch dành cho thời gian chạy bên thứ nhất |
    | `plugin-sdk/cron-store-runtime` | Các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Các kiểu trạng thái theo khóa trong SQLite sidecar của Plugin cùng thiết lập tập trung cho pragma kết nối và bảo trì WAL dành cho cơ sở dữ liệu do Plugin sở hữu |
    | `plugin-sdk/routing` | Các trình trợ giúp liên kết route/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định trạng thái thời gian chạy và trình trợ giúp siêu dữ liệu issue |
    | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp bộ phân giải mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có thời gian giới hạn với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số công cụ/CLI chung |
    | `plugin-sdk/tool-plugin` | Định nghĩa một Plugin công cụ agent có kiểu đơn giản và phơi bày siêu dữ liệu tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn từ đối số công cụ |
    | `plugin-sdk/sandbox` | Các kiểu backend sandbox và trình trợ giúp lệnh SSH/OpenShell, bao gồm preflight lệnh exec fail-fast |
    | `plugin-sdk/temp-path` | Các trình trợ giúp đường dẫn tải xuống tạm dùng chung và workspace tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Trình ghi log hệ con và trình trợ giúp biên tập thông tin nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Chế độ bảng Markdown và trình trợ giúp chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trình trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/json-unsafe-integers` | Các trình trợ giúp phân tích JSON bảo toàn literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các trình trợ giúp khóa tệp tái nhập |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các trình trợ giúp phiên/thời gian chạy ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các trình trợ giúp đăng ký backend ACP nhẹ và điều phối trả lời cho Plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không nhập khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình thời gian chạy agent hẹp |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các trình trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các primitive trình trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp registry/xây dựng/serialize lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy run đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch thời gian chạy, phân loại kết quả terminal, trình trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do nhà cung cấp Z.AI sở hữu đã lỗi thời; dùng API công khai của Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa async cục bộ tiến trình cho các tệp trạng thái thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp giới hạn đồng thời tác vụ async |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp drain gửi đang chờ đi ra ngoài |
    | `plugin-sdk/file-access-runtime` | Các trình trợ giúp đường dẫn nguồn media và tệp cục bộ an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ vận chuyển sẵn sàng |
    | `plugin-sdk/exec-approvals-runtime` | Các trình trợ giúp tệp chính sách phê duyệt exec mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh trace |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trình trợ giúp phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và trình trợ giúp tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Trình làm sạch URL dữ liệu ảnh inline và trình trợ giúp dò chữ ký mà không cần bề mặt thời gian chạy media rộng |
    | `plugin-sdk/response-limit-runtime` | Trình đọc body phản hồi có giới hạn mà không cần bề mặt thời gian chạy media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết hội thoại hiện tại mà không có định tuyến liên kết đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp kho phiên mà không nhập ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/sqlite-runtime` | Các trình trợ giúp tập trung cho schema agent SQLite, đường dẫn và giao dịch mà không có điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp hẹp cho ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không nhập markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Các trình trợ giúp thư mục/danh tính/workspace agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và mục xuất tương thích đã lỗi thời `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các trợ giúp tìm nạp/chuyển đổi/lưu trữ phương tiện dùng chung, gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, và `fetchRemoteMedia` đã không còn được khuyến nghị; ưu tiên các trợ giúp lưu trữ trước khi đọc bộ đệm khi một URL cần trở thành phương tiện OpenClaw |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME phạm vi hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME, và các trợ giúp loại phương tiện |
    | `plugin-sdk/media-store` | Các trợ giúp kho phương tiện phạm vi hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các trợ giúp chuyển dự phòng tạo phương tiện dùng chung, chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu provider hiểu phương tiện cùng các export trợ giúp ảnh/âm thanh/trích xuất có cấu trúc dành cho provider |
    | `plugin-sdk/text-chunking` | Các trợ giúp chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Trợ giúp chia đoạn văn bản gửi ra ngoài |
    | `plugin-sdk/speech` | Các kiểu provider giọng nói cùng các export trợ giúp về chỉ thị, sổ đăng ký, xác thực, bộ dựng TTS tương thích OpenAI, và giọng nói dành cho provider |
    | `plugin-sdk/speech-core` | Các kiểu provider giọng nói dùng chung, sổ đăng ký, chỉ thị, chuẩn hóa, và các export trợ giúp giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu provider phiên âm thời gian thực, trợ giúp sổ đăng ký, và trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Trợ giúp khởi tạo hồ sơ thời gian thực cho việc chèn ngữ cảnh `IDENTITY.md`, `USER.md`, và `SOUL.md` có giới hạn |
    | `plugin-sdk/realtime-voice` | Các kiểu provider giọng nói thời gian thực, trợ giúp sổ đăng ký, và trợ giúp hành vi giọng nói thời gian thực dùng chung, bao gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Các kiểu provider tạo ảnh cùng các trợ giúp URL dữ liệu/tài sản ảnh và bộ dựng provider ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo ảnh dùng chung, chuyển dự phòng, xác thực, và trợ giúp sổ đăng ký |
    | `plugin-sdk/music-generation` | Các kiểu provider/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trợ giúp chuyển dự phòng, tra cứu provider, và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu provider/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, trợ giúp chuyển dự phòng, tra cứu provider, và phân tích model-ref |
    | `plugin-sdk/transcripts` | Các kiểu provider nguồn bản chép lời dùng chung, trợ giúp sổ đăng ký, mô tả phiên, và siêu dữ liệu phát ngôn |
    | `plugin-sdk/webhook-targets` | Sổ đăng ký mục tiêu Webhook và trợ giúp cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các trợ giúp tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Tái export tương thích đã không còn được khuyến nghị; nhập `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích đã không còn được khuyến nghị, cục bộ trong repo, cho các kiểm thử OpenClaw cũ. Các kiểm thử repo mới nên nhập các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Trợ giúp `createTestPluginApi` tối thiểu, cục bộ trong repo, cho các kiểm thử đơn vị đăng ký Plugin trực tiếp mà không nhập các cầu nối trợ giúp kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng bộ chuyển đổi runtime tác nhân gốc, cục bộ trong repo, cho các kiểm thử xác thực, phân phối, chuyển dự phòng, tool-hook, prompt-overlay, lược đồ, và phép chiếu bản chép lời |
    | `plugin-sdk/channel-test-helpers` | Các trợ giúp kiểm thử hướng kênh, cục bộ trong repo, cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi ra ngoài, và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử trường hợp lỗi phân giải mục tiêu dùng chung, cục bộ trong repo, cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Các trợ giúp hợp đồng gói Plugin, đăng ký, tạo phẩm công khai, nhập trực tiếp, API runtime, và hiệu ứng phụ khi nhập, cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Các trợ giúp hợp đồng runtime provider, xác thực, khám phá, onboard, danh mục, trình hướng dẫn, năng lực phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web, và luồng, cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Các mock HTTP/xác thực Vitest chọn dùng, cục bộ trong repo, cho kiểm thử provider thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Các fixture ghi nhận runtime CLI chung, ngữ cảnh sandbox, trình ghi skill, thông điệp tác nhân, sự kiện hệ thống, tải lại mô-đun, đường dẫn Plugin đi kèm, văn bản terminal, chia đoạn, token xác thực, và trường hợp có kiểu, cục bộ trong repo |
    | `plugin-sdk/test-node-mocks` | Các trợ giúp mock builtin Node tập trung, cục bộ trong repo, để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con bộ nhớ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt trợ giúp memory-core đi kèm cho các trợ giúp trình quản lý/cấu hình/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-embedding-registry` | Các trợ giúp sổ đăng ký provider embedding bộ nhớ gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các export công cụ nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding máy chủ bộ nhớ, truy cập sổ đăng ký, provider cục bộ, và các trợ giúp lô/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã không còn được khuyến nghị; dùng API provider embedding chung cho provider mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các export công cụ QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các export công cụ lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Các trợ giúp đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Các trợ giúp truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Các trợ giúp bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Các trợ giúp trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Các trợ giúp runtime CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Các trợ giúp runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Các trợ giúp tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho các trợ giúp runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho các trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Các trợ giúp markdown được quản lý dùng chung cho các Plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime bộ nhớ chủ động để truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Các đường dẫn con trợ giúp đi kèm được dành riêng">
    Các đường dẫn con SDK trợ giúp đi kèm được dành riêng là các bề mặt phạm vi hẹp, dành riêng cho chủ sở hữu, cho
    mã Plugin đi kèm. Chúng được theo dõi trong kiểm kê SDK để các bản dựng
    gói và việc đặt bí danh luôn xác định, nhưng chúng không phải là API chung
    để tác giả Plugin sử dụng. Các hợp đồng máy chủ có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Chủ sở hữu và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Trợ giúp Plugin Codex đi kèm để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Trợ giúp Plugin Codex đi kèm để phản chiếu các subagent gốc của app-server Codex vào trạng thái tác vụ OpenClaw |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
