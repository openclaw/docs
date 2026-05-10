---
read_when:
    - Chọn đường dẫn con plugin-sdk phù hợp cho import của Plugin
    - Rà soát các đường dẫn con của Plugin đi kèm và các giao diện trợ giúp
summary: 'Danh mục đường dẫn con Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:46:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con công khai hẹp trong
`openclaw/plugin-sdk/`. Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo
mục đích. Bảng kiểm kê điểm vào của trình biên dịch được tạo nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của gói là tập con công khai
sau khi trừ các đường dẫn con kiểm thử/nội bộ chỉ dùng cục bộ trong repo được liệt kê trong
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer có thể kiểm tra
số lượng export công khai bằng `pnpm plugin-sdk:surface` và các đường dẫn con trợ giúp
dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export trợ giúp
dành riêng không dùng sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong SDK công khai
như khoản nợ tương thích không hoạt động.

Để xem hướng dẫn viết Plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Mục nhập Plugin

| Đường dẫn con                 | Các export chính                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Các trợ giúp mục nhà cung cấp di trú như `createMigrationItem`, hằng lý do, dấu trạng thái mục, trợ giúp biên tập ẩn, và `summarizeMigrationItems`                      |
| `plugin-sdk/migration-runtime` | Các trợ giúp di trú runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, và `writeMigrationReport`                                                 |

### Trợ giúp tương thích và kiểm thử không còn được khuyến nghị

Các đường dẫn con này vẫn là export của gói cho các Plugin cũ hơn và bộ kiểm thử OpenClaw,
nhưng mã mới không nên thêm import từ chúng: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, và `zod`. Trong mã Plugin mới, hãy import `zod` trực tiếp từ `zod`.
`plugin-test-runtime` vẫn là một đường dẫn con trợ giúp kiểm thử tập trung đang hoạt động.

### Các đường dẫn con công khai không dùng không còn được khuyến nghị

Các đường dẫn con công khai này đã tồn tại ít nhất một tháng và hiện không có
import sản xuất nào từ Plugin được đóng gói. Chúng vẫn có thể import để tương thích,
nhưng mã Plugin mới nên dùng các đường dẫn con SDK tập trung, đang được sử dụng tích cực:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, và `zalouser`.

### Các đường dẫn con công khai hiếm dùng không còn được khuyến nghị

Các đường dẫn con công khai hiện chỉ được một hoặc hai chủ sở hữu Plugin được đóng gói
sử dụng cũng không còn được khuyến nghị cho mã Plugin mới. Chúng vẫn là export của gói
để tương thích, nhưng mã mới nên ưu tiên các đường nối SDK được chia sẻ tích cực hoặc
API gói do Plugin sở hữu. Maintainer theo dõi tập chính xác trong
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` và ngân sách hiện tại
bằng `pnpm plugin-sdk:surface`.

### Các barrel rộng không còn được khuyến nghị

Các barrel tái export rộng này vẫn có thể build được cho mã nguồn OpenClaw và
kiểm tra tương thích, nhưng mã mới nên ưu tiên các đường dẫn con SDK tập trung:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, và
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
và `text-runtime` vẫn là export của gói chỉ để tương thích ngược; thay vào đó hãy dùng
các đường dẫn con channel/runtime tập trung, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime`, và `logging-core`.

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Mục xuất chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Mục xuất schema Zod gốc của `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Trình trợ giúp xác thực JSON Schema được lưu vào bộ nhớ đệm cho các schema do plugin sở hữu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung, lời nhắc danh sách cho phép, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Bí danh tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động đa tài khoản, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa id tài khoản |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp danh sách tài khoản/hành động tài khoản phạm vi hẹp |
    | `plugin-sdk/access-groups` | Trình trợ giúp phân tích danh sách cho phép nhóm truy cập và chẩn đoán nhóm đã biên tập |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Trình trợ giúp pipeline trả lời cũ. Mã pipeline trả lời kênh mới nên dùng `createChannelMessageReplyPipeline` và `resolveChannelMessageSourceReplyDeliveryMode` từ `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Nguyên hàm schema cấu hình kênh dùng chung cùng các bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các plugin đi kèm được bảo trì |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã không còn được khuyến nghị cho các schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh phạm vi hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade tương thích nhận vào kênh cấp thấp đã không còn được khuyến nghị. Đường dẫn nhận mới nên dùng `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Bộ phân giải runtime nhận vào kênh cấp cao thử nghiệm và bộ dựng sự kiện tuyến cho các đường dẫn nhận kênh đã di trú. Ưu tiên phần này hơn việc lắp ráp danh sách cho phép hiệu lực, danh sách cho phép lệnh và các phép chiếu cũ trong từng plugin. Xem [API nhận vào kênh](/vi/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, và trình trợ giúp vòng đời luồng bản nháp cũ. Mã hoàn tất bản xem trước mới nên dùng `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Trình trợ giúp hợp đồng vòng đời thông báo giá rẻ như `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, suy dẫn năng lực durable-final, trình trợ giúp chứng minh năng lực cho các năng lực gửi/biên nhận/tác dụng phụ, `MessageReceiveContext`, chứng minh chính sách ack nhận, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, chứng minh năng lực live-preview và live-finalizer, trạng thái khôi phục bền vững, `RenderedMessageBatch`, kiểu biên nhận thông báo và trình trợ giúp id biên nhận. Xem [API thông báo kênh](/vi/plugins/sdk-channel-message). Các facade điều phối trả lời cũ chỉ là tương thích đã không còn được khuyến nghị. |
    | `plugin-sdk/channel-message-runtime` | Trình trợ giúp phân phối runtime có thể tải phân phối đi, bao gồm `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, và `withDurableMessageSendContext`. Các cầu nối điều phối trả lời đã không còn được khuyến nghị vẫn có thể nhập cho riêng các bộ điều phối tương thích. Dùng từ các mô-đun runtime giám sát/gửi, không dùng trong các tệp khởi động plugin nóng. |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp tuyến nhận vào + bộ dựng phong bì dùng chung |
    | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp ghi nhận và điều phối bản ghi nhận vào dùng chung cũ, vị từ điều phối hiển thị/cuối cùng, và tương thích `deliverDurableInboundReplyPayload` đã không còn được khuyến nghị cho các bộ điều phối kênh đã chuẩn bị. Mã nhận/điều phối kênh mới nên nhập trình trợ giúp vòng đời runtime từ `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Trình trợ giúp phân tích/khớp mục tiêu |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải phương tiện đi dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu phụ thuộc gửi đi gọn nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Trình trợ giúp danh tính đi, đại diện gửi, phiên, định dạng và lập kế hoạch payload. Các trình trợ giúp phân phối trực tiếp như `deliverOutboundPayloads` là nền tương thích đã không còn được khuyến nghị; dùng `plugin-sdk/channel-message-runtime` cho các đường dẫn gửi mới. |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa thăm dò phạm vi hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời và adapter liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload phương tiện agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp cuộc trò chuyện/liên kết luồng, ghép cặp và liên kết đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp ảnh chụp cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp ảnh chụp/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Nguyên hàm schema cấu hình kênh phạm vi hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Mục xuất mở đầu plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm` | Trình trợ giúp xác thực/bảo vệ DM trực tiếp dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã không còn được khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích chủ sở hữu được theo dõi; plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã không còn được khuyến nghị cho tương thích chủ sở hữu được theo dõi; plugin mới nên dùng trình trợ giúp runtime được tiêm hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã không còn được khuyến nghị cho các gói Lark/Zalo đã phát hành vẫn nhập ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông báo theo ngữ nghĩa, phân phối và trả lời tương tác cũ. Xem [Trình bày thông báo](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce nhận vào, khớp đề cập, trình trợ giúp chính sách đề cập và trình trợ giúp phong bì |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce nhận vào phạm vi hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp chính sách đề cập, marker đề cập và văn bản đề cập phạm vi hẹp mà không có bề mặt runtime nhận vào rộng hơn |
    | `plugin-sdk/channel-envelope` | Trình trợ giúp định dạng phong bì nhận vào phạm vi hẹp |
    | `plugin-sdk/channel-location` | Trình trợ giúp ngữ cảnh vị trí kênh và định dạng |
    | `plugin-sdk/channel-logging` | Trình trợ giúp ghi log kênh cho lỗi bỏ qua nhận vào và lỗi nhập/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động thông báo kênh, cùng với trình trợ giúp schema gốc đã không còn được khuyến nghị được giữ để tương thích plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp chuẩn hóa tuyến dùng chung, phân giải mục tiêu dựa trên trình phân tích, chuyển id luồng thành chuỗi, khóa tuyến khử trùng lặp/thu gọn, kiểu mục tiêu đã phân tích và trình trợ giúp so sánh tuyến/mục tiêu |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích mục tiêu; bên gọi so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng bí mật phạm vi hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, và kiểu mục tiêu bí mật |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình runtime |
    | `plugin-sdk/lmstudio-runtime` | facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper mô hình đã tải |
    | `plugin-sdk/provider-setup` | helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | helper phân giải API key ở runtime cho provider plugin |
    | `plugin-sdk/provider-auth-api-key` | helper onboarding/ghi profile API key như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | trình dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-env-vars` | helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, trình dựng chính sách replay dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa model-id dùng chung |
    | `plugin-sdk/provider-catalog-runtime` | hook runtime bổ sung catalog nhà cung cấp và seam registry plugin-provider cho kiểm thử contract |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | helper năng lực HTTP/endpoint nhà cung cấp tổng quát, lỗi HTTP nhà cung cấp và helper biểu mẫu multipart cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | helper contract cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | helper đăng ký/cache nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | helper cấu hình/thông tin xác thực web-search hẹp cho các nhà cung cấp không cần nối dây bật plugin |
    | `plugin-sdk/provider-web-search-contract` | helper contract cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | helper đăng ký/cache/runtime nhà cung cấp web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema Gemini + chẩn đoán |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và các helper tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper stream và helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | helper truyền tải nhà cung cấp native như guarded fetch, biến đổi thông điệp truyền tải và stream sự kiện truyền tải có thể ghi |
    | `plugin-sdk/provider-onboard` | helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | helper singleton/map/cache cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | helper chế độ kích hoạt nhóm hẹp và phân tích lệnh |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | helper profile/bộ lọc phê duyệt thực thi native |
    | `plugin-sdk/approval-delivery-runtime` | adapter năng lực/phân phối phê duyệt native |
    | `plugin-sdk/approval-gateway-runtime` | helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | helper tải adapter phê duyệt native nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | helper runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/gateway hẹp hơn khi chúng là đủ |
    | `plugin-sdk/approval-native-runtime` | helper đích phê duyệt native + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | helper payload trả lời phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt native và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | helper reset chống trùng lặp trả lời inbound hẹp |
    | `plugin-sdk/channel-contract-testing` | helper kiểm thử contract kênh hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | xác thực lệnh native, định dạng menu đối số động và helper đích phiên native |
    | `plugin-sdk/command-detection` | helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | predicate văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | helper thu thập contract bí mật hẹp cho bề mặt bí mật kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | helper ép kiểu `coerceSecretRef` và định kiểu SecretRef cho phân tích contract/cấu hình bí mật |
    | `plugin-sdk/security-runtime` | helper niềm tin dùng chung, cổng DM, helper tệp/đường dẫn giới hạn trong root bao gồm ghi chỉ-tạo, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tạm cùng cấp, fallback di chuyển khác thiết bị, helper kho tệp riêng tư, bộ bảo vệ cha symlink, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và helper thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | helper danh sách cho phép host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | helper dispatcher được ghim hẹp không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | dispatcher được ghim, fetch được bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | helper yêu cầu/đích Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | helper kích thước/thời gian chờ body yêu cầu |
  </Accordion>

  <Accordion title="Đường dẫn con runtime và lưu trữ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các helper rộng cho runtime/ghi log/sao lưu/cài đặt plugin |
    | `plugin-sdk/runtime-env` | Các helper hẹp cho env runtime, logger, timeout, thử lại và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và helper xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các helper đăng ký và tra cứu runtime-context kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các helper plugin dùng chung cho lệnh/hook/http/tương tác |
    | `plugin-sdk/hook-runtime` | Các helper pipeline webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các helper import/binding runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các helper thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các helper định dạng CLI, chờ, phiên bản, gọi theo đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và helper vá trạng thái kênh |
    | `plugin-sdk/config-contracts` | Bề mặt cấu hình chỉ kiểu tập trung cho hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các helper tra cứu cấu hình plugin runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các helper thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các helper ảnh chụp cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và bộ đặt ảnh chụp kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram tích hợp không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện liên kết tự động tham chiếu tệp mà không cần barrel văn bản rộng |
    | `plugin-sdk/approval-runtime` | Các helper phê duyệt exec/plugin, trình dựng khả năng phê duyệt, helper xác thực/hồ sơ, helper định tuyến/runtime gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các helper runtime dùng chung cho inbound/trả lời, chia đoạn, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các helper hẹp cho điều phối/hoàn tất trả lời và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các helper lịch sử trả lời cửa sổ ngắn dùng chung và marker như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các helper hẹp cho chia đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các helper đường dẫn kho phiên, khóa phiên, updated-at và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Các helper đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các helper đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các helper định tuyến/khóa phiên/binding tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các helper tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái runtime và helper metadata sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các helper bộ phân giải đích dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các helper chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các reader tham số công cụ/CLI phổ biến |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các helper đường dẫn tải xuống tạm dùng chung và không gian làm việc tạm bảo mật riêng |
    | `plugin-sdk/logging-core` | Logger hệ thống con và helper che dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các helper chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các helper ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các helper phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các helper nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/file-lock` | Các helper khóa tệp có thể vào lại |
    | `plugin-sdk/persistent-dedupe` | Các helper bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các helper runtime/phiên ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các helper nhẹ cho đăng ký backend ACP và điều phối trả lời dành cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình runtime agent hẹp |
    | `plugin-sdk/boolean-param` | Reader tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các helper phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các helper bootstrap thiết bị và token ghép nối |
    | `plugin-sdk/extension-shared` | Các primitive helper dùng chung cho kênh thụ động, trạng thái và proxy xung quanh |
    | `plugin-sdk/models-provider-runtime` | Các helper trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các helper liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các helper registry/dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, helper điều hướng/hủy lượt chạy đang hoạt động, helper cầu nối công cụ OpenClaw, helper chính sách công cụ kế hoạch runtime, phân loại kết quả terminal, helper định dạng/chi tiết tiến độ công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Facade phát hiện endpoint do nhà cung cấp Z.AI sở hữu đã ngừng khuyến nghị; dùng API công khai của plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper khóa bất đồng bộ cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Helper giới hạn đồng thời tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các helper bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Helper xả hàng đợi gửi đi đang chờ outbound |
    | `plugin-sdk/file-access-runtime` | Các helper đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các helper đánh thức, sự kiện và hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Helper ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các helper token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các helper hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Helper chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng khuyến nghị; dùng các đường dẫn con runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các helper bộ nhớ đệm giới hạn nhỏ |
    | `plugin-sdk/diagnostic-runtime` | Các helper cờ chẩn đoán, sự kiện và trace-context |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, helper phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và helper tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader response-body có giới hạn mà không cần bề mặt runtime media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding hội thoại hiện tại mà không có định tuyến binding đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/session-store-runtime` | Các helper kho phiên mà không import ghi cấu hình/bảo trì rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các helper hẹp cho ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các helper chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các helper cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Các helper thư mục/danh tính/không gian làm việc agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/directory-runtime` | Truy vấn thư mục dựa trên cấu hình/khử trùng lặp |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Đường dẫn con | Xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper tìm nạp/chuyển đổi/lưu trữ phương tiện dùng chung, dò kích thước video dựa trên ffprobe, và các trình dựng tải trọng phương tiện |
    | `plugin-sdk/media-mime` | Chuẩn hóa MIME hẹp, ánh xạ phần mở rộng tệp, phát hiện MIME, và các helper loại phương tiện |
    | `plugin-sdk/media-store` | Các helper kho phương tiện hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển dự phòng tạo phương tiện dùng chung, lựa chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng với các export helper hình ảnh/âm thanh dành cho nhà cung cấp |
    | `plugin-sdk/text-chunking` | Các helper chia đoạn/kết xuất văn bản và markdown, chuyển đổi bảng markdown, loại bỏ thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản đầu ra |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng với các export chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI, và helper giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói dùng chung, registry, chỉ thị, chuẩn hóa, và export helper giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry, và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và helper registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng với helper URL tài sản/dữ liệu hình ảnh và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển dự phòng, xác thực, và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp model-ref |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và helper cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | Re-export tương thích đã lỗi thời; import `zod` từ `zod` trực tiếp |
    | `plugin-sdk/testing` | Barrel tương thích đã lỗi thời cục bộ trong repo cho các kiểm thử OpenClaw cũ. Các kiểm thử repo mới nên import các đường dẫn con kiểm thử cục bộ có trọng tâm như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu cục bộ trong repo cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không import các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cục bộ trong repo cho các kiểm thử xác thực, phân phối, dự phòng, tool-hook, prompt-overlay, schema, và chiếu bản ghi |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh cục bộ trong repo cho các hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối đầu ra, và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử trường hợp lỗi phân giải đích dùng chung cục bộ trong repo cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, artifact công khai, import trực tiếp, API runtime, và tác dụng phụ import cục bộ trong repo |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web, và luồng cục bộ trong repo |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest opt-in cục bộ trong repo cho kiểm thử nhà cung cấp dùng `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cục bộ trong repo cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn Plugin đóng gói, terminal-text, chia đoạn, auth-token, và typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock builtin Node có trọng tâm cục bộ trong repo để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Đường dẫn con | Xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đóng gói cho helper trình quản lý/cấu hình/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export engine nền tảng host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding host bộ nhớ, truy cập registry, nhà cung cấp cục bộ, và helper lô/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export engine QMD host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Export engine lưu trữ host bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức host bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn host bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật host bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho helper nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các Plugin lân cận bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh tương thích đã lỗi thời; dùng `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    Hiện không có đường dẫn con SDK helper đóng gói dành riêng nào. Các
    helper dành riêng cho chủ sở hữu nằm trong gói Plugin sở hữu, trong khi các hợp đồng host có thể tái sử dụng
    dùng các đường dẫn con SDK chung như `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
