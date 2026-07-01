---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho một lệnh nhập Plugin
    - Kiểm tra các đường dẫn con của Plugin được đóng gói kèm và các bề mặt hỗ trợ
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:24:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo
mục đích. Danh mục entrypoint trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của gói là tập con công khai
sau khi trừ các đường dẫn con thử nghiệm/nội bộ chỉ dùng trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các đường dẫn con helper
dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export
helper dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong
SDK công khai như khoản nợ tương thích ngủ yên.

Để xem hướng dẫn tạo Plugin, xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Đường dẫn con                  | Các export chính                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các helper mục nhà cung cấp di chuyển như `createMigrationItem`, hằng số lý do, marker trạng thái mục, helper biên tập, và `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Các helper di chuyển runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Đăng ký, phát hiện, sửa chữa, lựa chọn, mức độ nghiêm trọng, và kiểu phát hiện của kiểm tra sức khỏe Doctor cho các consumer sức khỏe được đóng gói                     |

### Tương thích không còn khuyến nghị và helper thử nghiệm

Các đường dẫn con không còn khuyến nghị vẫn được export cho Plugin cũ hơn, nhưng mã mới nên dùng các
đường dẫn con SDK tập trung bên dưới. Danh sách được duy trì là
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI từ chối các import
production được đóng gói từ danh sách này. Các barrel rộng như `compat`, `config-types`,
`infra-runtime`, `text-runtime`, và `zod` chỉ dành cho tương thích. Import `zod`
trực tiếp từ `zod`.

Các đường dẫn con test-helper dựa trên Vitest của OpenClaw chỉ dùng trong repo và không còn là
export của gói: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, và `testing`.

### Đường dẫn con helper Plugin được đóng gói dành riêng

Các đường dẫn con này là bề mặt tương thích thuộc sở hữu Plugin cho Plugin được đóng gói sở hữu chúng,
không phải API SDK dùng chung: `plugin-sdk/codex-mcp-projection` và
`plugin-sdk/codex-native-task-runtime`. Các import extension xuyên chủ sở hữu bị chặn
bởi các hàng rào bảo vệ hợp đồng gói.

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc của `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema được lưu cache cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp wizard thiết lập dùng chung, trình dịch thiết lập, lời nhắc allowlist, trình dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích không còn được khuyến nghị; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình nhiều tài khoản/cổng hành động, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích allowlist nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các primitive schema cấu hình kênh dùng chung cùng trình dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các plugin đi kèm được bảo trì |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id kênh chat đi kèm/chính thức chuẩn cùng nhãn/bí danh định dạng cho các plugin cần nhận diện văn bản có tiền tố envelope mà không hardcode bảng riêng. |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích không còn được khuyến nghị cho schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích ingress kênh cấp thấp không còn được khuyến nghị. Đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ giải quyết runtime ingress kênh cấp cao thử nghiệm và trình dựng dữ kiện tuyến cho các đường dẫn nhận kênh đã di trú. Ưu tiên dùng mục này thay vì tự lắp ráp allowlist hiệu dụng, allowlist lệnh và phép chiếu cũ trong từng plugin. Xem [API ingress kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Hợp đồng vòng đời tin nhắn cùng tùy chọn pipeline trả lời, biên nhận, xem trước/streaming trực tiếp, trình trợ giúp vòng đời, danh tính outbound, lập kế hoạch payload, gửi bền vững và trình trợ giúp ngữ cảnh gửi tin nhắn. Xem [API outbound kênh](/vi/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Bí danh tương thích không còn được khuyến nghị cho `plugin-sdk/channel-outbound` cùng các facade dispatch trả lời cũ. |
    | `plugin-sdk/channel-message-runtime` | Bí danh tương thích không còn được khuyến nghị cho `plugin-sdk/channel-outbound` cùng các facade dispatch trả lời cũ. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dựng tuyến inbound + envelope dùng chung |
    | `plugin-sdk/inbound-reply-dispatch` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-inbound` cho runner inbound và predicate dispatch, và `plugin-sdk/channel-outbound` cho trình trợ giúp phân phối tin nhắn. |
    | `plugin-sdk/messaging-targets` | Bí danh phân tích mục tiêu không còn được khuyến nghị; dùng `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media outbound dùng chung và trạng thái media được lưu trữ |
    | `plugin-sdk/outbound-send-deps` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời binding luồng và adapter |
    | `plugin-sdk/agent-media-payload` | Trình dựng payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp binding cuộc hội thoại/luồng, ghép cặp và binding đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp giải quyết chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export phần mở đầu plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình allowlist |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp chính sách guard direct-DM hẹp trước crypto |
    | `plugin-sdk/discord` | Facade tương thích Discord không còn được khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích chủ sở hữu được theo dõi; plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích giải quyết tài khoản Telegram không còn được khuyến nghị cho tương thích chủ sở hữu được theo dõi; plugin mới nên dùng trình trợ giúp runtime được inject hoặc đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal không còn được khuyến nghị cho các gói Lark/Zalo đã phát hành vẫn nhập ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày, phân phối tin nhắn ngữ nghĩa và trả lời tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Trình trợ giúp inbound dùng chung cho phân loại sự kiện, dựng ngữ cảnh, định dạng, gốc, debounce, khớp mention, chính sách mention và ghi log inbound |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho chính sách mention, marker mention và văn bản mention không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-inbound` hoặc `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade tương thích không còn được khuyến nghị. Dùng `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động tin nhắn kênh, cùng các trình trợ giúp schema native không còn được khuyến nghị được giữ lại để tương thích plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp dùng chung cho chuẩn hóa tuyến, giải quyết mục tiêu dựa trên parser, chuyển thread-id thành chuỗi, khóa tuyến dedupe/compact, kiểu mục tiêu đã phân tích và so sánh tuyến/mục tiêu |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích mục tiêu; caller so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng secret hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, và kiểu mục tiêu secret |
  </Accordion>

Các họ trình trợ giúp kênh đã ngừng dùng chỉ tiếp tục khả dụng để tương thích
với Plugin đã phát hành. Kế hoạch loại bỏ là: giữ chúng trong suốt khoảng thời
gian di chuyển Plugin bên ngoài, giữ các Plugin trong repo/được đóng gói trên
`channel-inbound` và `channel-outbound`, rồi loại bỏ các đường dẫn con tương
thích trong lần dọn dẹp SDK lớn tiếp theo. Điều này áp dụng cho các họ cũ về
thông báo/thời gian chạy của kênh, truyền phát kênh, quyền truy cập DM trực tiếp,
nhánh tách của trình trợ giúp inbound, tùy chọn trả lời, và đường dẫn ghép cặp.

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình thời gian chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade thời gian chạy LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, tiêu đề yêu cầu và trình trợ giúp mô hình đã tải |
    | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ đã tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp phân giải khóa API thời gian chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-oauth-runtime` | Kiểu callback OAuth nhà cung cấp chung, kết xuất trang callback, trình trợ giúp PKCE/trạng thái, phân tích cú pháp đầu vào ủy quyền, trình trợ giúp hết hạn token và trình trợ giúp hủy |
    | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp onboarding/ghi hồ sơ khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Bộ dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-env-vars` | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, trình trợ giúp nhập xác thực OpenAI Codex, export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-live-runtime` | Trình trợ giúp catalog mô hình nhà cung cấp trực tiếp cho khám phá có bảo vệ kiểu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, lọc model-id, bộ nhớ đệm TTL và fallback tĩnh |
    | `plugin-sdk/provider-catalog-runtime` | Hook thời gian chạy bổ sung catalog nhà cung cấp và điểm nối sổ đăng ký plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Trình trợ giúp năng lực HTTP/endpoint nhà cung cấp chung, lỗi HTTP nhà cung cấp và trình trợ giúp biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Trình trợ giúp hợp đồng cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy nhà cung cấp tìm kiếm web |
    | `plugin-sdk/embedding-providers` | Kiểu nhà cung cấp embedding tổng quát và trình trợ giúp đọc, bao gồm `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` và `listEmbeddingProviders(...)`; Plugin đăng ký nhà cung cấp qua `api.registerEmbeddingProvider(...)` để thực thi quyền sở hữu manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán cho DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Kiểu snapshot mức sử dụng nhà cung cấp, trình trợ giúp lấy mức sử dụng dùng chung và bộ lấy dữ liệu nhà cung cấp như `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng, tương thích lệnh gọi công cụ văn bản thuần và trình trợ giúp wrapper dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Trình trợ giúp wrapper luồng nhà cung cấp dùng chung công khai, bao gồm `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` và tiện ích luồng tương thích Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp vận chuyển nhà cung cấp gốc như fetch có bảo vệ, trích xuất văn bản kết quả công cụ, biến đổi thông điệp vận chuyển và luồng sự kiện vận chuyển có thể ghi |
    | `plugin-sdk/provider-onboard` | Trình trợ giúp vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Trình trợ giúp singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Trình trợ giúp chế độ kích hoạt nhóm hẹp và phân tích cú pháp lệnh |
  </Accordion>

Snapshot mức sử dụng nhà cung cấp thường báo cáo một hoặc nhiều `windows` hạn mức, mỗi mục có
nhãn, phần trăm đã dùng và thời gian đặt lại tùy chọn. Các nhà cung cấp hiển thị văn bản số dư hoặc
trạng thái tài khoản thay vì các cửa sổ hạn mức có thể đặt lại nên trả về
`summary` với mảng `windows` rỗng thay vì tạo ra phần trăm giả.
OpenClaw hiển thị văn bản tóm tắt đó trong đầu ra trạng thái; chỉ dùng `error` khi
endpoint mức sử dụng thất bại hoặc không trả về dữ liệu mức sử dụng có thể dùng.

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động, trình trợ giúp ủy quyền người gửi |
    | `plugin-sdk/command-status` | Bộ dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Bộ chuyển đổi năng lực/phân phối phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp tải bộ chuyển đổi phê duyệt gốc nhẹ cho điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp thời gian chạy handler phê duyệt rộng hơn; ưu tiên các điểm nối adapter/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Trình trợ giúp đích phê duyệt gốc, liên kết tài khoản, cổng định tuyến, fallback chuyển tiếp và chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reaction-runtime` | Liên kết reaction phê duyệt hardcoded, payload prompt reaction, kho đích reaction và export tương thích cho việc chặn prompt exec gốc cục bộ |
    | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp payload phản hồi phê duyệt exec/Plugin |
    | `plugin-sdk/approval-runtime` | Trình trợ giúp payload phê duyệt exec/Plugin, trình trợ giúp định tuyến/thời gian chạy phê duyệt gốc và trình trợ giúp hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Trình trợ giúp đặt lại chống trùng lặp phản hồi đến hẹp |
    | `plugin-sdk/channel-contract-testing` | Trình trợ giúp kiểm thử hợp đồng kênh hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và trình trợ giúp đích phiên gốc |
    | `plugin-sdk/command-detection` | Trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Predicate văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Trình trợ giúp chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Trình trợ giúp luồng đăng nhập xác thực nhà cung cấp tải lười cho kênh riêng tư và ghép đôi mã thiết bị Web UI |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp thu thập hợp đồng bí mật hẹp cho bề mặt bí mật kênh/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Trình trợ giúp định kiểu `coerceSecretRef` và SecretRef hẹp để phân tích cú pháp hợp đồng bí mật/cấu hình |
    | `plugin-sdk/secret-provider-integration` | Manifest tích hợp nhà cung cấp SecretRef chỉ kiểu và hợp đồng preset cho Plugin xuất bản preset nhà cung cấp bí mật bên ngoài |
    | `plugin-sdk/security-runtime` | Trợ giúp dùng chung về tin cậy, cổng DM, file/đường dẫn giới hạn theo root, bao gồm ghi chỉ-tạo, thay thế file nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, fallback di chuyển xuyên thiết bị, trình trợ giúp kho file riêng tư, guard cha symlink, nội dung bên ngoài, che văn bản nhạy cảm, so sánh bí mật hằng thời gian và trình trợ giúp thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Trình trợ giúp allowlist host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Trình trợ giúp dispatcher ghim hẹp không dùng bề mặt thời gian chạy hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Dispatcher ghim, fetch có bảo vệ SSRF, lỗi SSRF và trình trợ giúp chính sách SSRF |
    | `plugin-sdk/secret-input` | Trình trợ giúp phân tích cú pháp đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu/đích Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | Trình trợ giúp kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các helper rộng cho runtime/ghi log/sao lưu/cài đặt plugin |
    | `plugin-sdk/runtime-env` | Các helper hẹp cho env runtime, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các helper xác thực điều khiển trình duyệt |
    | `plugin-sdk/agent-harness-task-runtime` | Các helper vòng đời tác vụ chung và gửi hoàn tất cho agent được hỗ trợ bằng harness dùng phạm vi tác vụ do host cấp |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex đóng gói được dành riêng để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng Codex; không dành cho plugin bên thứ ba |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex đóng gói riêng tư cho nối dây bản sao tác vụ native/runtime; không dành cho plugin bên thứ ba |
    | `plugin-sdk/channel-runtime-context` | Các helper chung để đăng ký và tra cứu ngữ cảnh runtime của kênh |
    | `plugin-sdk/matrix` | Facade tương thích Matrix không còn được khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost không còn được khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các helper lệnh/hook/http/tương tác dùng chung cho plugin |
    | `plugin-sdk/hook-runtime` | Các helper pipeline webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các helper import/binding runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các helper exec tiến trình |
    | `plugin-sdk/cli-runtime` | Các helper định dạng CLI, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/qa-live-transport-scenarios` | Id kịch bản QA transport trực tiếp dùng chung, helper phạm vi baseline và helper chọn kịch bản |
    | `plugin-sdk/gateway-method-runtime` | Helper điều phối phương thức Gateway được dành riêng cho các route HTTP plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI gateway, lỗi giao thức gateway, phân giải host LAN được quảng bá và helper vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho các shape cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/provider |
    | `plugin-sdk/plugin-config-runtime` | Các helper tra cứu plugin-config runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các helper thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chuỗi gợi ý metadata gửi message-tool dùng chung |
    | `plugin-sdk/runtime-config-snapshot` | Các helper snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, kể cả khi bề mặt hợp đồng Telegram đóng gói không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện autolink tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaction phê duyệt hardcode, payload prompt reaction, kho đích reaction và export tương thích để chặn prompt exec native cục bộ |
    | `plugin-sdk/approval-runtime` | Các helper phê duyệt exec/plugin, builder khả năng phê duyệt, helper auth/hồ sơ, helper định tuyến/runtime native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các helper runtime inbound/reply dùng chung, chia khúc, điều phối, heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các helper hẹp cho điều phối/hoàn tất trả lời và nhãn cuộc hội thoại |
    | `plugin-sdk/reply-history` | Các helper lịch sử trả lời cửa sổ ngắn dùng chung. Mã lượt tin nhắn mới nên dùng `createChannelHistoryWindow`; các helper map cấp thấp hơn chỉ còn là export tương thích không còn được khuyến nghị |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các helper hẹp để chia khúc văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các helper workflow phiên (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), đọc văn bản transcript người dùng/assistant gần đây có giới hạn theo danh tính phiên, helper đường dẫn kho phiên/khóa phiên legacy, đọc updated-at và helper tương thích toàn kho/đường dẫn tệp chỉ dành cho chuyển tiếp |
    | `plugin-sdk/session-transcript-runtime` | Danh tính transcript, helper đích/đọc/ghi theo phạm vi, phát hành cập nhật, khóa ghi và khóa hit bộ nhớ transcript |
    | `plugin-sdk/sqlite-runtime` | Các helper tập trung cho schema agent SQLite, đường dẫn và giao dịch dành cho runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Các helper đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các helper đường dẫn thư mục state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Các kiểu state theo khóa SQLite sidecar của Plugin cùng thiết lập pragma kết nối tập trung và bảo trì WAL cho cơ sở dữ liệu do Plugin sở hữu |
    | `plugin-sdk/routing` | Các helper binding route/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các helper tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái runtime và helper metadata sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các helper phân giải đích dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các helper chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ input giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có định thời với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Trình đọc tham số tool/CLI dùng chung |
    | `plugin-sdk/tool-plugin` | Định nghĩa một Plugin agent-tool có kiểu đơn giản và phơi bày metadata tĩnh để tạo manifest |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả tool |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn từ đối số tool |
    | `plugin-sdk/sandbox` | Các kiểu backend sandbox và helper lệnh SSH/OpenShell, bao gồm preflight lệnh exec fail-fast |
    | `plugin-sdk/temp-path` | Các helper đường dẫn tải xuống tạm dùng chung và workspace tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Logger hệ con và helper che dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các helper chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các helper ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các helper phân giải cấu hình provider Talk |
    | `plugin-sdk/json-store` | Các helper nhỏ để đọc/ghi state JSON |
    | `plugin-sdk/json-unsafe-integers` | Các helper phân tích cú pháp JSON giữ nguyên literal số nguyên không an toàn dưới dạng chuỗi |
    | `plugin-sdk/file-lock` | Các helper khóa tệp re-entrant |
    | `plugin-sdk/persistent-dedupe` | Các helper cache khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các helper ACP runtime/phiên và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các helper đăng ký backend ACP nhẹ và điều phối trả lời cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình runtime agent hẹp |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các helper phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các helper bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các primitive helper dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các helper trả lời lệnh/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các helper liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các helper registry/build/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, helper steer/abort active-run, helper cầu nối tool OpenClaw, helper chính sách tool kế hoạch runtime, phân loại kết quả terminal, helper định dạng/chi tiết tiến trình tool và tiện ích kết quả attempt |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do provider Z.AI sở hữu không còn được khuyến nghị; dùng API công khai của Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper khóa async cục bộ tiến trình cho các tệp state runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Helper giới hạn đồng thời tác vụ async |
    | `plugin-sdk/dedupe-runtime` | Các helper cache khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Các helper đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các helper đánh thức, sự kiện và hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Helper ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các helper token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các helper hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Helper chờ transport sẵn sàng |
    | `plugin-sdk/exec-approvals-runtime` | Các helper tệp chính sách phê duyệt exec mà không cần barrel infra-runtime rộng |
    | `plugin-sdk/infra-runtime` | Shim tương thích không còn được khuyến nghị; dùng các đường dẫn con runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các helper cache nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các helper cờ chẩn đoán, sự kiện và ngữ cảnh trace |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, helper phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và helper tra cứu ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Helper làm sạch URL dữ liệu hình ảnh inline và dò chữ ký mà không cần bề mặt media runtime rộng |
    | `plugin-sdk/response-limit-runtime` | Trình đọc nội dung phản hồi có giới hạn mà không cần bề mặt media runtime rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding cuộc hội thoại hiện tại mà không có định tuyến binding đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các helper kho phiên mà không import ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/sqlite-runtime` | Các helper tập trung cho schema agent SQLite, đường dẫn và giao dịch mà không có điều khiển vòng đời cơ sở dữ liệu |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các helper hẹp để ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các helper chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các helper cấu hình retry và trình chạy retry |
    | `plugin-sdk/agent-runtime` | Các helper thư mục/danh tính/workspace agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích không còn được khuyến nghị `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper dùng chung để tìm nạp/chuyển đổi/lưu trữ media, bao gồm `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, và `fetchRemoteMedia` đã không còn được khuyến nghị; ưu tiên các helper lưu trữ trước khi đọc buffer khi một URL cần trở thành media của OpenClaw |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME phạm vi hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME, và các helper loại media |
    | `plugin-sdk/media-store` | Các helper lưu trữ media phạm vi hẹp như `saveMediaBuffer` và `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Các helper dùng chung cho dự phòng tạo media, chọn ứng viên, và thông báo thiếu model |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu media cùng các export helper phía nhà cung cấp cho hình ảnh/âm thanh/trích xuất có cấu trúc |
    | `plugin-sdk/text-chunking` | Các helper chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp speech cùng các export helper phía nhà cung cấp cho chỉ thị, registry, xác thực, trình tạo TTS tương thích OpenAI, và speech |
    | `plugin-sdk/speech-core` | Các export dùng chung về kiểu nhà cung cấp speech, registry, chỉ thị, chuẩn hóa, và helper speech |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry, và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-bootstrap-context` | Helper khởi tạo hồ sơ thời gian thực để chèn ngữ cảnh giới hạn từ `IDENTITY.md`, `USER.md`, và `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực, helper registry, và helper hành vi giọng nói thời gian thực dùng chung, bao gồm theo dõi hoạt động đầu ra |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo ảnh cùng helper asset ảnh/data URL và trình tạo nhà cung cấp ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo ảnh dùng chung, dự phòng, xác thực, và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
    | `plugin-sdk/transcripts` | Các kiểu nhà cung cấp nguồn bản ghi dùng chung, helper registry, mô tả phiên, và metadata lời thoại |
    | `plugin-sdk/webhook-targets` | Registry mục tiêu Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các helper tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Re-export tương thích đã không còn được khuyến nghị; import `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích đã không còn được khuyến nghị trong repo cho các kiểm thử OpenClaw cũ. Các kiểm thử repo mới nên import các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay vào đó |
    | `plugin-sdk/plugin-test-api` | Helper tối thiểu `createTestPluginApi` cục bộ trong repo cho kiểm thử đơn vị đăng ký plugin trực tiếp mà không import các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Các fixture hợp đồng adapter agent-runtime gốc cục bộ trong repo cho kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, schema, và chiếu bản ghi |
    | `plugin-sdk/channel-test-helpers` | Các helper kiểm thử hướng kênh cục bộ trong repo cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, sự cố trạng thái, phân phối gửi đi, và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử dùng chung cục bộ trong repo cho các trường hợp lỗi phân giải mục tiêu trong kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Các helper hợp đồng cục bộ trong repo cho gói plugin, đăng ký, artifact công khai, import trực tiếp, API runtime, và tác dụng phụ khi import |
    | `plugin-sdk/provider-test-contracts` | Các helper hợp đồng cục bộ trong repo cho runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực media, chính sách phát lại, STT thời gian thực với âm thanh trực tiếp, tìm kiếm/tìm nạp web, và stream |
    | `plugin-sdk/provider-http-test-mocks` | Các mock HTTP/xác thực Vitest tùy chọn cục bộ trong repo cho kiểm thử nhà cung cấp dùng `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Các fixture chung cục bộ trong repo cho thu thập runtime CLI, ngữ cảnh sandbox, trình ghi skill, thông điệp agent, sự kiện hệ thống, tải lại module, đường dẫn plugin đi kèm, văn bản terminal, chia đoạn, mã xác thực, và case có kiểu |
    | `plugin-sdk/test-node-mocks` | Các helper mock Node builtin tập trung cục bộ trong repo để dùng bên trong factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con về Memory">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đi kèm cho các helper manager/config/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime lập chỉ mục/tìm kiếm memory |
    | `plugin-sdk/memory-core-host-embedding-registry` | Các helper registry nhà cung cấp embedding memory gọn nhẹ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các export engine nền tảng host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Các hợp đồng embedding host memory, truy cập registry, nhà cung cấp cục bộ, và helper batch/từ xa chung. `registerMemoryEmbeddingProvider` trên bề mặt này đã không còn được khuyến nghị; dùng API nhà cung cấp embedding chung cho nhà cung cấp mới. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các export engine QMD host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Các export engine lưu trữ host memory |
    | `plugin-sdk/memory-core-host-multimodal` | Các helper đa phương thức host memory |
    | `plugin-sdk/memory-core-host-query` | Các helper truy vấn host memory |
    | `plugin-sdk/memory-core-host-secret` | Các helper secret host memory |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Các helper trạng thái host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Các helper runtime CLI host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Các helper runtime lõi host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Các helper tệp/runtime host memory |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho các helper runtime lõi host memory |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho các helper nhật ký sự kiện host memory |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Các helper managed-markdown dùng chung cho plugin liên quan đến memory |
    | `plugin-sdk/memory-host-search` | Facade runtime active memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Đường dẫn con helper đi kèm được đặt trước">
    Các đường dẫn con SDK helper đi kèm được đặt trước là các bề mặt hẹp dành riêng cho owner cho
    mã plugin đi kèm. Chúng được theo dõi trong inventory SDK để các bản dựng gói
    và alias luôn xác định, nhưng không phải là API biên soạn plugin
    chung. Các hợp đồng host có thể tái sử dụng mới nên dùng các đường dẫn con SDK chung
    như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và
    `plugin-sdk/plugin-config-runtime`.

    | Đường dẫn con | Owner và mục đích |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper plugin Codex đi kèm để chiếu cấu hình máy chủ MCP của người dùng vào cấu hình luồng app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex đi kèm để phản chiếu subagent gốc của app-server Codex vào trạng thái tác vụ OpenClaw |

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
