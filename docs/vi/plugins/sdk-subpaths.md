---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho lệnh import của Plugin
    - Rà soát các đường dẫn con của Plugin đi kèm và các bề mặt hỗ trợ
summary: 'Danh mục đường dẫn con Plugin SDK: các lệnh import nằm ở đâu, được nhóm theo phạm vi'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng được nhóm theo
mục đích. Bản kiểm kê entrypoint của trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của gói là tập con công khai
sau khi trừ các đường dẫn con kiểm thử/nội bộ chỉ dùng trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Người bảo trì có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các đường dẫn con
trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các
export trợ giúp dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì ở lại
trong SDK công khai như khoản nợ tương thích không hoạt động.

Để xem hướng dẫn tạo Plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Đường dẫn con                  | Các export chính                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các trợ giúp mục nhà cung cấp di chuyển như `createMigrationItem`, hằng lý do, dấu trạng thái mục, trợ giúp che dữ liệu và `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Các trợ giúp di chuyển runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                               |

### Trợ giúp kiểm thử và tương thích đã ngừng khuyến nghị

Các đường dẫn con này vẫn là export của gói cho các Plugin cũ hơn và bộ kiểm thử OpenClaw,
nhưng mã mới không nên thêm import từ chúng: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` và `zod`. Trong mã Plugin mới, hãy import `zod` trực tiếp từ `zod`.
`plugin-test-runtime` vẫn là một đường dẫn con trợ giúp kiểm thử tập trung đang hoạt động.

### Đường dẫn con công khai không dùng đến đã ngừng khuyến nghị

Các đường dẫn con công khai này đã tồn tại ít nhất một tháng và hiện không có
import production nào từ tiện ích mở rộng được đóng gói. Chúng vẫn có thể được import để tương thích,
nhưng mã Plugin mới nên dùng các đường dẫn con SDK tập trung và đang được dùng chủ động thay thế:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` và `zalouser`.

### Đường dẫn con công khai hiếm dùng đã ngừng khuyến nghị

Các đường dẫn con công khai hiện chỉ được một hoặc hai chủ sở hữu Plugin được đóng gói sử dụng cũng
đã ngừng khuyến nghị cho mã Plugin mới. Chúng vẫn là export của gói để tương thích,
nhưng mã mới nên ưu tiên các đường nối SDK được chia sẻ chủ động hoặc API gói
do Plugin sở hữu. Người bảo trì theo dõi tập hợp chính xác trong
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` và ngân sách hiện tại
bằng `pnpm plugin-sdk:surface`.

### Barrel rộng đã ngừng khuyến nghị

Các barrel re-export rộng này vẫn có thể build được cho mã nguồn OpenClaw và
các kiểm tra tương thích, nhưng mã mới nên ưu tiên các đường dẫn con SDK tập trung:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` và
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
và `text-runtime` chỉ còn là export của gói để tương thích ngược; thay vào đó hãy dùng
các đường dẫn con channel/runtime tập trung, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` và `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod `openclaw.json` gốc (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema đã lưu đệm cho các schema do Plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung, lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động đa tài khoản, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp account-list/account-action phạm vi hẹp |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích cú pháp danh sách cho phép nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Trình trợ giúp pipeline trả lời cũ. Mã pipeline trả lời kênh mới nên dùng `createChannelMessageReplyPipeline` và `resolveChannelMessageSourceReplyDeliveryMode` từ `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các primitive schema cấu hình kênh dùng chung cùng với trình dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Các schema cấu hình kênh OpenClaw được đóng gói chỉ dành cho các Plugin đóng gói được bảo trì |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã lỗi thời cho schema cấu hình kênh đóng gói |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đóng gói |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh phạm vi hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích ingress kênh cấp thấp đã lỗi thời. Các đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ phân giải runtime ingress kênh cấp cao thử nghiệm và trình dựng dữ kiện tuyến cho các đường dẫn nhận kênh đã di chuyển. Ưu tiên dùng phần này thay vì lắp ráp danh sách cho phép hiệu lực, danh sách cho phép lệnh và phép chiếu kế thừa trong từng Plugin. Xem [API ingress kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, và trình trợ giúp vòng đời luồng bản nháp cũ. Mã hoàn tất bản xem trước mới nên dùng `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Trình trợ giúp hợp đồng vòng đời thông điệp chi phí thấp như `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, suy luận năng lực durable-final, trình trợ giúp bằng chứng năng lực cho năng lực gửi/biên nhận/tác dụng phụ, `MessageReceiveContext`, bằng chứng chính sách ack khi nhận, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, bằng chứng năng lực live-preview và live-finalizer, trạng thái khôi phục bền vững, `RenderedMessageBatch`, kiểu biên nhận thông điệp và trình trợ giúp id biên nhận. Xem [API thông điệp kênh](/vi/plugins/sdk-channel-message). Các facade điều phối trả lời cũ chỉ còn để tương thích đã lỗi thời. |
    | `plugin-sdk/channel-message-runtime` | Trình trợ giúp phân phối runtime có thể tải phân phối outbound, bao gồm `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, và `withDurableMessageSendContext`. Các cầu nối điều phối trả lời đã lỗi thời vẫn có thể import chỉ dành cho dispatcher tương thích. Dùng từ các mô-đun runtime monitor/send, không dùng trong các tệp bootstrap Plugin nóng. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp tuyến inbound dùng chung + trình dựng envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp ghi nhận-và-điều phối inbound dùng chung cũ, predicate điều phối hiển thị/cuối cùng, và tương thích `deliverDurableInboundReplyPayload` đã lỗi thời cho dispatcher kênh đã chuẩn bị. Mã nhận/điều phối kênh mới nên import trình trợ giúp vòng đời runtime từ `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Trình trợ giúp phân tích cú pháp/so khớp đích |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media outbound dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu phụ thuộc gửi outbound nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Trình trợ giúp danh tính outbound, delegate gửi, phiên, định dạng và lập kế hoạch payload. Trình trợ giúp phân phối trực tiếp như `deliverOutboundPayloads` là nền tương thích đã lỗi thời; dùng `plugin-sdk/channel-message-runtime` cho các đường dẫn gửi mới. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll phạm vi hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời và adapter liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Trình dựng payload media tác tử cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp liên kết, ghép cặp và liên kết đã cấu hình cho cuộc hội thoại/luồng |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh phạm vi hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export prelude Plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm` | Trình trợ giúp xác thực/bảo vệ direct-DM dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã xuất bản và tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng trình trợ giúp runtime được tiêm hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã lỗi thời cho các gói Lark/Zalo đã xuất bản vẫn import ủy quyền lệnh người gửi; Plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông điệp ngữ nghĩa, phân phối và trả lời tương tác cũ. Xem [Trình bày thông điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce inbound, so khớp đề cập, trình trợ giúp chính sách đề cập và trình trợ giúp envelope |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce inbound phạm vi hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp chính sách đề cập, marker đề cập và văn bản đề cập phạm vi hẹp, không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope` | Trình trợ giúp định dạng envelope inbound phạm vi hẹp |
    | `plugin-sdk/channel-location` | Trình trợ giúp ngữ cảnh vị trí kênh và định dạng |
    | `plugin-sdk/channel-logging` | Trình trợ giúp ghi log kênh cho lượt inbound bị bỏ và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động thông điệp kênh, cùng với trình trợ giúp schema native đã lỗi thời được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp chuẩn hóa tuyến dùng chung, phân giải đích dựa trên parser, chuyển thread-id thành chuỗi, khóa tuyến khử trùng lặp/thu gọn, kiểu parsed-target và trình trợ giúp so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích cú pháp đích; bên gọi so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Nối dây phản hồi/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng bí mật phạm vi hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, và kiểu đích bí mật |
  </Accordion>

  <Accordion title="Đường dẫn con của provider">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade provider LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper mô hình đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập provider cục bộ/tự host được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập provider tự host tương thích OpenAI có trọng tâm |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải khóa API runtime cho plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/ghi profile khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export tương thích `resolveOpenClawAgentDir` đã không còn được khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các trình dựng chính sách replay dùng chung, helper endpoint provider và helper chuẩn hóa ID mô hình dùng chung |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung catalog provider và các điểm nối registry plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint provider tổng quát, lỗi HTTP provider và helper biểu mẫu multipart cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Helper hợp đồng cấu hình/lựa chọn web-fetch phạm vi hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/bộ nhớ đệm provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper cấu hình/thông tin xác thực web-search phạm vi hẹp cho provider không cần dây nối bật plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực có phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/bộ nhớ đệm/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema Gemini + chẩn đoán |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider gốc như fetch được bảo vệ, biến đổi thông điệp transport và luồng sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper chế độ kích hoạt nhóm phạm vi hẹp và phân tích lệnh |
  </Accordion>

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper profile/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt gốc nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime trình xử lý phê duyệt rộng hơn; ưu tiên các điểm nối adapter/Gateway hẹp hơn khi chúng là đủ |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt gốc + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | Helper payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại loại trùng phản hồi đến phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử hợp đồng kênh phạm vi hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Vị từ văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập hợp đồng bí mật phạm vi hẹp cho bề mặt bí mật kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper kiểu `coerceSecretRef` và SecretRef phạm vi hẹp cho phân tích hợp đồng/cấu hình bí mật |
    | `plugin-sdk/security-runtime` | Helper tin cậy dùng chung, chặn theo DM, helper tệp/đường dẫn giới hạn theo gốc gồm ghi chỉ tạo mới, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tệp tạm cùng cấp, fallback di chuyển xuyên thiết bị, helper kho tệp riêng tư, bảo vệ symlink-parent, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và helper thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Helper danh sách host được phép và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher ghim phạm vi hẹp không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Dispatcher ghim, fetch được bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/mục tiêu Webhook và ép kiểu websocket/thân thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn con thời gian chạy và lưu trữ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Trình trợ giúp rộng cho thời gian chạy/ghi log/sao lưu/cài đặt plugin |
    | `plugin-sdk/runtime-env` | Trình trợ giúp hẹp cho env thời gian chạy, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/mặc định đã chuẩn hóa, phân tích URL CDP và trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Trình trợ giúp đăng ký và tra cứu ngữ cảnh thời gian chạy kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng dùng cho các gói kênh bên thứ ba cũ; plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng dùng cho các gói kênh bên thứ ba cũ; plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Trình trợ giúp lệnh/hook/http/tương tác dùng chung cho plugin |
    | `plugin-sdk/hook-runtime` | Trình trợ giúp pipeline Webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Trình trợ giúp import/binding thời gian chạy lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Trình trợ giúp exec tiến trình |
    | `plugin-sdk/cli-runtime` | Trình trợ giúp CLI cho định dạng, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Trình trợ giúp client Gateway, khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI của Gateway, lỗi giao thức Gateway và bản vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho các hình dạng cấu hình plugin như `OpenClawConfig` và kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Trình trợ giúp tra cứu cấu hình plugin thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp ảnh chụp cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter ảnh chụp kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-runtime` | Trình trợ giúp phê duyệt exec/plugin, bộ dựng khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ, trình trợ giúp định tuyến/thời gian chạy native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Trình trợ giúp thời gian chạy inbound/reply dùng chung, chia đoạn, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp hẹp cho điều phối/hoàn tất trả lời và nhãn cuộc hội thoại |
    | `plugin-sdk/reply-history` | Trình trợ giúp và marker lịch sử trả lời cửa sổ ngắn dùng chung như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Trình trợ giúp hẹp cho chia đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Trình trợ giúp đường dẫn kho phiên, khóa phiên, thời điểm cập nhật và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên/ràng buộc tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Trình trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái thời gian chạy và trình trợ giúp siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp trình phân giải mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Bộ chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Trình đọc tham số công cụ/CLI phổ biến |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tải xuống tạm dùng chung và không gian làm việc tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Trình trợ giúp logger hệ con và biên tập ẩn |
    | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Trình trợ giúp phân giải cấu hình nhà cung cấp trò chuyện |
    | `plugin-sdk/json-store` | Trình trợ giúp đọc/ghi trạng thái JSON nhỏ |
    | `plugin-sdk/file-lock` | Trình trợ giúp khóa tệp vào lại |
    | `plugin-sdk/persistent-dedupe` | Trình trợ giúp bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Trình trợ giúp thời gian chạy/phiên và điều phối trả lời ACP |
    | `plugin-sdk/acp-runtime-backend` | Trình trợ giúp đăng ký backend ACP gọn nhẹ và điều phối trả lời cho plugin được tải lúc khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Primitive schema cấu hình thời gian chạy agent hẹp |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Trình trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Trình trợ giúp bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Primitive trình trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Trình trợ giúp trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Trình trợ giúp liệt kê lệnh Skills |
    | `plugin-sdk/native-command-registry` | Trình trợ giúp registry/build/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch thời gian chạy, phân loại kết quả terminal, trình trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do nhà cung cấp Z.AI sở hữu đã ngừng dùng; hãy dùng API công khai của plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa async cục bộ theo tiến trình cho các tệp trạng thái thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp đồng thời tác vụ async có giới hạn |
    | `plugin-sdk/dedupe-runtime` | Trình trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp xả hàng đợi gửi đi đang chờ |
    | `plugin-sdk/file-access-runtime` | Trình trợ giúp đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng dùng; hãy dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Trình trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh trace |
    | `plugin-sdk/error-runtime` | Trình trợ giúp đồ thị lỗi, định dạng, phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và tra cứu đã ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Trình đọc body phản hồi có giới hạn mà không cần bề mặt thời gian chạy media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding cuộc hội thoại hiện tại mà không cần định tuyến binding đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên mà không import ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Trình trợ giúp hẹp cho ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Trình trợ giúp cấu hình retry và bộ chạy retry |
    | `plugin-sdk/agent-runtime` | Trình trợ giúp thư mục/danh tính/không gian làm việc agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích đã ngừng dùng `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về khả năng và kiểm thử">
    | Đường dẫn con | Nội dung xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các trình trợ giúp tìm nạp/chuyển đổi/lưu trữ phương tiện dùng chung, thăm dò kích thước video dựa trên ffprobe và trình dựng payload phương tiện |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME phạm vi hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME và trình trợ giúp loại phương tiện |
    | `plugin-sdk/media-store` | Các trình trợ giúp kho phương tiện phạm vi hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các trình trợ giúp chuyển đổi dự phòng tạo phương tiện dùng chung, lựa chọn ứng viên và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng các nội dung xuất trợ giúp hình ảnh/âm thanh/trích xuất có cấu trúc dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Các trình trợ giúp chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các nội dung xuất trợ giúp chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI và giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói dùng chung, registry, chỉ thị, chuẩn hóa và nội dung xuất trợ giúp giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và trình trợ giúp registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL dữ liệu/tài sản hình ảnh và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển đổi dự phòng, xác thực và trình trợ giúp registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/webhook-targets` | Registry mục tiêu Webhook và trình trợ giúp cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã ngừng dùng; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Các trình trợ giúp tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Tái xuất tương thích đã ngừng dùng; nhập `zod` trực tiếp từ `zod` |
    | `plugin-sdk/testing` | Barrel tương thích đã ngừng dùng cục bộ trong repo cho các bài kiểm thử OpenClaw cũ. Các bài kiểm thử repo mới nên nhập các đường dẫn con kiểm thử cục bộ tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Trình trợ giúp `createTestPluginApi` tối thiểu cục bộ trong repo cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không nhập các cầu nối trình trợ giúp kiểm thử repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng bộ điều hợp agent-runtime gốc cục bộ trong repo cho các bài kiểm thử xác thực, phân phối, dự phòng, hook công cụ, lớp phủ prompt, schema và chiếu bản ghi |
    | `plugin-sdk/channel-test-helpers` | Trình trợ giúp kiểm thử hướng kênh cục bộ trong repo cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi giải quyết mục tiêu dùng chung cục bộ trong repo cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Trình trợ giúp hợp đồng gói Plugin, đăng ký, tạo phẩm công khai, nhập trực tiếp, API runtime và hiệu ứng phụ khi nhập, cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Trình trợ giúp hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, khả năng phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web và luồng, cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest chọn dùng cục bộ trong repo cho các bài kiểm thử nhà cung cấp dùng `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cục bộ trong repo cho ghi nhận runtime CLI, ngữ cảnh sandbox, trình ghi skill, thông điệp agent, sự kiện hệ thống, tải lại module, đường dẫn Plugin đi kèm, văn bản terminal, chia đoạn, token xác thực và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Trình trợ giúp mock builtin Node tập trung cục bộ trong repo để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con bộ nhớ">
    | Đường dẫn con | Nội dung xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt trợ giúp memory-core đi kèm cho trình trợ giúp manager/config/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Nội dung xuất engine nền tảng host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding host bộ nhớ, truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Nội dung xuất engine QMD host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Nội dung xuất engine lưu trữ host bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức host bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn host bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật host bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã ngừng dùng; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Trình trợ giúp runtime CLI host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Trình trợ giúp runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho trình trợ giúp runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã ngừng dùng; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Trình trợ giúp managed-markdown dùng chung cho các Plugin liên quan đến bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã ngừng dùng; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Đường dẫn con trình trợ giúp đi kèm được dành riêng">
    Hiện chưa có đường dẫn con SDK trình trợ giúp đi kèm nào được dành riêng. Các
    trình trợ giúp riêng theo chủ sở hữu nằm trong gói Plugin sở hữu, trong khi
    các hợp đồng host có thể tái sử dụng dùng các đường dẫn con SDK chung như
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
