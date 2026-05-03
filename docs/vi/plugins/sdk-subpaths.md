---
read_when:
    - Chọn đúng đường dẫn con của plugin-sdk cho lệnh import của Plugin
    - Kiểm tra các đường dẫn con của Plugin được đóng gói kèm và các giao diện trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-05-03T10:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK được cung cấp dưới dạng một tập hợp các đường dẫn con hẹp dưới `openclaw/plugin-sdk/`.
  Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo mục đích. Danh sách đầy đủ
  được tạo gồm hơn 200 đường dẫn con nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
  các đường dẫn con trợ giúp Plugin đi kèm được dành riêng xuất hiện ở đó nhưng là chi tiết
  triển khai, trừ khi một trang tài liệu quảng bá chúng một cách rõ ràng. Maintainer có thể kiểm tra
  các đường dẫn con trợ giúp được dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export trợ giúp được dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì nằm lại trong SDK công khai
  như khoản nợ tương thích ngủ yên.

  Để xem hướng dẫn biên soạn Plugin, hãy xem [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

  ## Mục nhập Plugin

  | Đường dẫn con                            | Các export chính                                                                                                                                                            |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel tương thích rộng cho các kiểm thử Plugin cũ; nên dùng các đường dẫn con kiểm thử tập trung cho kiểm thử phần mở rộng mới                                             |
  | `plugin-sdk/plugin-test-api`              | Bộ dựng mock `OpenClawPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký Plugin trực tiếp                                                                                      |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho hồ sơ xác thực, chặn phân phối, phân loại dự phòng, hook công cụ, lớp phủ prompt, schema và sửa transcript                   |
  | `plugin-sdk/channel-test-helpers`         | Trợ giúp kiểm thử cho vòng đời tài khoản kênh, thư mục, cấu hình gửi, mock runtime, hook, mục nhập kênh đi kèm, dấu thời gian envelope, phản hồi ghép đôi và hợp đồng kênh chung |
  | `plugin-sdk/channel-target-testing`       | Bộ kiểm thử chung cho các trường hợp lỗi phân giải đích kênh                                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Trợ giúp hợp đồng cho đăng ký Plugin, manifest package, artifact công khai, API runtime, hiệu ứng phụ import và import trực tiếp                                            |
  | `plugin-sdk/plugin-test-runtime`          | Fixture cho kiểm thử runtime Plugin, registry, đăng ký provider, setup wizard và luồng tác vụ runtime                                                                       |
  | `plugin-sdk/provider-test-contracts`      | Trợ giúp hợp đồng cho runtime provider, xác thực, khám phá, onboard, catalog, khả năng media, chính sách phát lại, realtime STT live-audio, web-search/fetch và wizard      |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/xác thực Vitest tùy chọn cho kiểm thử provider có chạy qua `plugin-sdk/provider-http`                                                                              |
  | `plugin-sdk/test-env`                     | Fixture môi trường kiểm thử, fetch/mạng, máy chủ HTTP dùng một lần, request đến, live-test, hệ thống tệp tạm thời và điều khiển thời gian                                  |
  | `plugin-sdk/test-fixtures`                | Fixture kiểm thử chung cho CLI, sandbox, skill, agent-message, system-event, tải lại module, đường dẫn Plugin đi kèm, terminal, chia chunk, auth-token và typed-case        |
  | `plugin-sdk/test-node-mocks`              | Trợ giúp mock tích hợp Node tập trung để dùng bên trong các factory Vitest `vi.mock("node:*")`                                                                               |
  | `plugin-sdk/migration`                    | Trợ giúp mục provider migration như `createMigrationItem`, hằng lý do, marker trạng thái mục, trợ giúp che dữ liệu và `summarizeMigrationItems`                             |
  | `plugin-sdk/migration-runtime`            | Trợ giúp migration runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                                        |

  <AccordionGroup>
  <Accordion title="Đường dẫn con kênh">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trợ giúp setup wizard dùng chung, prompt allowlist, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trợ giúp cấu hình/action-gate đa tài khoản, trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trợ giúp hẹp cho account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình kênh dùng chung cùng bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các Plugin đi kèm được duy trì |
    | `plugin-sdk/channel-config-schema-legacy` | Alias tương thích không còn khuyến nghị cho schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, trợ giúp vòng đời/hoàn tất draft stream |
    | `plugin-sdk/inbound-envelope` | Trợ giúp tuyến inbound dùng chung + bộ dựng envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Trợ giúp ghi nhận và dispatch inbound dùng chung |
    | `plugin-sdk/messaging-targets` | Trợ giúp phân tích/khớp đích |
    | `plugin-sdk/outbound-media` | Trợ giúp tải media outbound dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu dependency gửi outbound gọn nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Trợ giúp phân phối outbound, danh tính, send delegate, phiên, định dạng và lập kế hoạch payload |
    | `plugin-sdk/poll-runtime` | Trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trợ giúp adapter và vòng đời thread-binding |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Trợ giúp conversation/thread binding, ghép đôi và binding đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trợ giúp phân giải group-policy runtime |
    | `plugin-sdk/channel-status` | Trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export prelude Plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trợ giúp chỉnh sửa/đọc cấu hình allowlist |
    | `plugin-sdk/group-access` | Trợ giúp quyết định group-access dùng chung |
    | `plugin-sdk/direct-dm` | Trợ giúp xác thực/guard direct-DM dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord không còn khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích owner được theo dõi; Plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram không còn khuyến nghị cho khả năng tương thích owner được theo dõi; Plugin mới nên dùng trợ giúp runtime được inject hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal không còn khuyến nghị cho các package Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; Plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trợ giúp trình bày thông điệp ngữ nghĩa, phân phối và phản hồi tương tác cũ. Xem [Trình bày thông điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce inbound, khớp mention, trợ giúp mention-policy và trợ giúp envelope |
    | `plugin-sdk/channel-inbound-debounce` | Trợ giúp debounce inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trợ giúp mention-policy, marker mention và văn bản mention hẹp không kèm bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope` | Trợ giúp định dạng envelope inbound hẹp |
    | `plugin-sdk/channel-location` | Trợ giúp ngữ cảnh vị trí kênh và định dạng |
    | `plugin-sdk/channel-logging` | Trợ giúp ghi log kênh cho inbound bị bỏ và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Trợ giúp message-action kênh, cùng với trợ giúp schema gốc không còn khuyến nghị được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trợ giúp chuẩn hóa tuyến dùng chung, phân giải đích dựa trên parser, chuỗi hóa thread-id, khóa tuyến dedupe/compact, kiểu parsed-target và so sánh tuyến/đích |
    | `plugin-sdk/channel-targets` | Trợ giúp phân tích đích; bên gọi so sánh tuyến nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trợ giúp hợp đồng secret hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu đích secret |
  </Accordion>

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá catalog và chuẩn bị mô hình runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho giá trị mặc định của máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper cho mô hình đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | Giá trị mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải API-key runtime cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/ghi hồ sơ API-key như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình xây dựng kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-auth-login` | Helper đăng nhập tương tác dùng chung cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các trình xây dựng chính sách replay dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa model-id như `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung catalog nhà cung cấp và seam registry plugin-provider cho kiểm thử contract |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint chung cho nhà cung cấp, lỗi HTTP nhà cung cấp và helper biểu mẫu multipart cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Helper contract cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper cấu hình/thông tin xác thực web-search hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper contract cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/bộ nhớ đệm/runtime nhà cung cấp web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán và helper tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và các helper tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu trình bọc stream và helper trình bọc Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | Helper transport nhà cung cấp native như fetch có bảo vệ, biến đổi thông điệp transport và stream sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper phân tích lệnh và chế độ kích hoạt nhóm hẹp |
  </Accordion>

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Trình xây dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper hồ sơ/bộ lọc phê duyệt exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/phân phối phê duyệt native |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt native gọn nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime bộ xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/gateway hẹp hơn khi chúng đã đủ |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt native + ràng buộc tài khoản |
    | `plugin-sdk/approval-reply-runtime` | Helper payload phản hồi phê duyệt exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/Plugin, helper định tuyến/runtime phê duyệt native và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại khử trùng lặp phản hồi đến hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử contract kênh hẹp không có barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh native, định dạng menu đối số động và helper mục tiêu phiên native |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Vị từ văn bản lệnh gọn nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập contract bí mật hẹp cho bề mặt bí mật kênh/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ép kiểu `coerceSecretRef` hẹp và helper kiểu SecretRef cho phân tích contract bí mật/cấu hình |
    | `plugin-sdk/security-runtime` | Helper dùng chung cho độ tin cậy, chặn DM, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Helper chính sách SSRF cho allowlist host và mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher hẹp không có bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch được bảo vệ SSRF, lỗi SSRF và chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/đích Webhook và ép kiểu websocket/thân thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn con runtime và lưu trữ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp rộng cho runtime/ghi log/sao lưu/cài đặt plugin |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp hẹp cho env runtime, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp đăng ký và tra cứu ngữ cảnh runtime kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã lỗi thời cho các gói kênh bên thứ ba cũ hơn; plugin mới nên import trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các trình trợ giúp dùng chung cho lệnh/hook/http/tương tác của plugin |
    | `plugin-sdk/hook-runtime` | Các trình trợ giúp pipeline Webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp import/binding runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trình trợ giúp exec tiến trình |
    | `plugin-sdk/cli-runtime` | Các trình trợ giúp CLI về định dạng, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Client Gateway, trình trợ giúp khởi động client sẵn sàng cho event loop, RPC CLI Gateway, lỗi giao thức Gateway và các trình trợ giúp bản vá trạng thái kênh |
    | `plugin-sdk/config-types` | Bề mặt cấu hình chỉ kiểu cho hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/provider |
    | `plugin-sdk/plugin-config-runtime` | Các trình trợ giúp tra cứu cấu hình plugin ở runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện autolink tham chiếu tệp mà không cần barrel text-runtime rộng |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp phê duyệt exec/plugin, builder capability phê duyệt, trình trợ giúp xác thực/hồ sơ, trình trợ giúp định tuyến/runtime native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp runtime inbound/reply dùng chung, chia đoạn, dispatch, heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp hẹp cho dispatch/finalize trả lời và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các trình trợ giúp và marker lịch sử trả lời cửa sổ ngắn dùng chung như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp hẹp để chia đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp đường dẫn kho phiên, khóa phiên, thời điểm cập nhật và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các trình trợ giúp định tuyến/khóa phiên/binding tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định trạng thái runtime và trình trợ giúp metadata vấn đề |
    | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp target resolver dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ input giống fetch/request |
    | `plugin-sdk/run-command` | Bộ chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số công cụ/CLI chung |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các trình trợ giúp đường dẫn tải xuống tạm dùng chung |
    | `plugin-sdk/logging-core` | Các trình trợ giúp logger hệ con và che giấu dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các trình trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trình trợ giúp phân giải cấu hình provider Talk |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/file-lock` | Các trình trợ giúp khóa tệp có thể vào lại |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp cache chống trùng lặp lưu trên đĩa |
    | `plugin-sdk/acp-runtime` | Các trình trợ giúp runtime/phiên ACP và dispatch trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các trình trợ giúp backend ACP nhẹ để đăng ký và dispatch trả lời cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không import khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive hẹp cho schema cấu hình runtime agent |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các trình trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các primitive trình trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp trả lời lệnh/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp registry/build/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt plugin đáng tin cậy thử nghiệm cho các harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lần chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch runtime, phân loại kết quả terminal, trình trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Các trình trợ giúp phát hiện endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa async cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp đồng thời tác vụ async có giới hạn |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp cache chống trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp xả hàng đợi giao gửi pending outbound |
    | `plugin-sdk/file-access-runtime` | Các trình trợ giúp đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp sự kiện Heartbeat và khả năng hiển thị |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã lỗi thời; dùng các đường dẫn con runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp cache nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh trace |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trình trợ giúp phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và các trình trợ giúp tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Trình đọc body phản hồi có giới hạn mà không cần bề mặt runtime media rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding hội thoại hiện tại mà không cần định tuyến binding đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp kho phiên mà không import thao tác ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không import cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp hẹp để ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không import markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các trình trợ giúp cấu hình retry và bộ chạy retry |
    | `plugin-sdk/agent-runtime` | Các trình trợ giúp thư mục/định danh/workspace agent |
    | `plugin-sdk/directory-runtime` | Truy vấn/chống trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về khả năng và kiểm thử">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper dùng chung để tìm nạp/chuyển đổi/lưu trữ phương tiện, dò kích thước video dựa trên ffprobe, và các bộ dựng tải trọng phương tiện |
    | `plugin-sdk/media-store` | Các helper kho phương tiện phạm vi hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển dự phòng tạo phương tiện dùng chung, chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng các phần xuất helper hình ảnh/âm thanh dành cho nhà cung cấp |
    | `plugin-sdk/text-runtime` | Các helper văn bản/Markdown/ghi log dùng chung như loại bỏ văn bản hiển thị với trợ lý, helper kết xuất/chia đoạn/bảng Markdown, helper biên tập, helper thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các phần xuất chỉ thị, registry, xác thực, bộ dựng TTS tương thích OpenAI, và helper giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói dùng chung, registry, chỉ thị, chuẩn hóa, và các phần xuất helper giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry, và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và helper registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng các helper URL tài sản/dữ liệu hình ảnh và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển dự phòng, xác thực, và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và helper cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Helper chuẩn hóa đường dẫn Webhook |
    | `plugin-sdk/web-media` | Helper tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | `zod` được xuất lại cho người dùng Plugin SDK |
    | `plugin-sdk/testing` | Barrel tương thích rộng cho các bài kiểm thử plugin cũ. Các bài kiểm thử extension mới nên nhập các đường dẫn con SDK tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay vào đó |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu cho các bài kiểm thử đơn vị đăng ký plugin trực tiếp mà không nhập các cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng bộ chuyển đổi runtime tác nhân gốc cho các bài kiểm thử xác thực, phân phối, dự phòng, móc công cụ, lớp phủ prompt, lược đồ, và chiếu bản ghi hội thoại |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh cho các hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, phân luồng cấu hình gửi, mock runtime, sự cố trạng thái, phân phối gửi đi, và đăng ký móc |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi giải quyết đích dùng chung cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, tạo tác công khai, nhập trực tiếp, API runtime, và tác dụng phụ khi nhập |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng cho runtime nhà cung cấp, xác thực, khám phá, onboard, danh mục, trình hướng dẫn, khả năng phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web, và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest tùy chọn cho các bài kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, thông điệp tác nhân, sự kiện hệ thống, tải lại module, đường dẫn plugin đi kèm, văn bản terminal, chia đoạn, mã xác thực, và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Helper mock nội hàm Node tập trung để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con bộ nhớ">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đi kèm cho các helper trình quản lý/cấu hình/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các phần xuất engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ, và helper lô/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các phần xuất engine QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các phần xuất engine lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Helper nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập với nhà cung cấp cho helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập với nhà cung cấp cho helper nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh trung lập với nhà cung cấp cho helper tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Helper Markdown được quản lý dùng chung cho các plugin lân cận bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active memory cho quyền truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh trung lập với nhà cung cấp cho helper trạng thái máy chủ bộ nhớ |
  </Accordion>

  <Accordion title="Các đường dẫn con helper đi kèm được dành riêng">
    Hiện không có đường dẫn con SDK helper đi kèm nào được dành riêng. Các
    helper riêng theo chủ sở hữu nằm bên trong gói plugin sở hữu chúng, trong khi
    các hợp đồng máy chủ có thể tái sử dụng dùng các đường dẫn con SDK chung như `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
