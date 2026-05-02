---
read_when:
    - Chọn đúng đường dẫn con của plugin-sdk cho một import Plugin
    - Rà soát các đường dẫn con của Plugin được đóng gói kèm và các giao diện trợ giúp
summary: 'Danh mục đường dẫn con Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-05-02T20:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin được cung cấp dưới dạng một tập hợp các đường dẫn con hẹp trong `openclaw/plugin-sdk/`.
  Trang này liệt kê các đường dẫn con thường dùng, được nhóm theo mục đích. Danh sách
  đầy đủ được tạo gồm hơn 200 đường dẫn con nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
  các đường dẫn con trợ giúp dành riêng cho Plugin đi kèm xuất hiện ở đó nhưng là chi tiết
  triển khai trừ khi một trang tài liệu quảng bá chúng rõ ràng. Maintainer có thể kiểm tra các
  đường dẫn con trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
  các export trợ giúp dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì tiếp tục nằm trong SDK công khai
  như khoản nợ tương thích không hoạt động.

  Để xem hướng dẫn tạo Plugin, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

  ## Mục nhập Plugin

  | Đường dẫn con                           | Các export chính                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel tương thích rộng cho các bài kiểm thử Plugin cũ; ưu tiên các đường dẫn con kiểm thử tập trung cho bài kiểm thử tiện ích mở rộng mới                                  |
  | `plugin-sdk/plugin-test-api`              | Bộ dựng mock `OpenClawPluginApi` tối thiểu cho các bài kiểm thử đơn vị đăng ký Plugin trực tiếp                                                                              |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho hồ sơ xác thực, chặn phân phối, phân loại dự phòng, hook công cụ, lớp phủ prompt, schema và sửa chữa transcript              |
  | `plugin-sdk/channel-test-helpers`         | Trình trợ giúp kiểm thử hợp đồng kênh chung và vòng đời tài khoản kênh, thư mục, cấu hình gửi, mock runtime, hook, mục nhập kênh đi kèm, dấu thời gian envelope, trả lời ghép nối |
  | `plugin-sdk/channel-target-testing`       | Bộ kiểm thử trường hợp lỗi phân giải mục tiêu kênh dùng chung                                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Trình trợ giúp hợp đồng cho đăng ký Plugin, manifest gói, artifact công khai, API runtime, tác dụng phụ khi import và import trực tiếp                                     |
  | `plugin-sdk/plugin-test-runtime`          | Fixture runtime Plugin, registry, đăng ký nhà cung cấp, trình hướng dẫn thiết lập và task-flow runtime cho kiểm thử                                                        |
  | `plugin-sdk/provider-test-contracts`      | Trình trợ giúp hợp đồng cho runtime nhà cung cấp, xác thực, khám phá, onboard, danh mục, khả năng media, chính sách replay, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải web và trình hướng dẫn |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/xác thực Vitest tùy chọn cho các bài kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http`                                                                     |
  | `plugin-sdk/test-env`                     | Fixture môi trường kiểm thử, fetch/mạng, máy chủ HTTP dùng một lần, yêu cầu đến, kiểm thử trực tiếp, hệ thống tệp tạm thời và điều khiển thời gian                         |
  | `plugin-sdk/test-fixtures`                | Fixture kiểm thử chung cho CLI, sandbox, skill, tin nhắn agent, sự kiện hệ thống, tải lại module, đường dẫn Plugin đi kèm, terminal, chia đoạn, token xác thực và case có kiểu |
  | `plugin-sdk/test-node-mocks`              | Trình trợ giúp mock builtin Node tập trung để dùng bên trong factory Vitest `vi.mock("node:*")`                                                                              |
  | `plugin-sdk/migration`                    | Trình trợ giúp mục nhà cung cấp migration như `createMigrationItem`, hằng lý do, dấu trạng thái mục, trình trợ giúp biên tập lại và `summarizeMigrationItems`               |
  | `plugin-sdk/migration-runtime`            | Trình trợ giúp migration runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                                  |

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung, prompt allowlist, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình nhiều tài khoản/cổng hành động, trình trợ giúp dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình kênh dùng chung cùng các bộ dựng Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các Plugin đi kèm được bảo trì |
    | `plugin-sdk/channel-config-schema-legacy` | Bí danh tương thích đã lỗi thời cho schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, trình trợ giúp vòng đời/hoàn tất luồng nháp |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp route đến dùng chung + bộ dựng envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp ghi nhận và dispatch luồng đến dùng chung |
    | `plugin-sdk/messaging-targets` | Trình trợ giúp phân tích/khớp mục tiêu |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media gửi ra dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu phụ thuộc gửi ra gọn nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Trình trợ giúp phân phối gửi ra, danh tính, delegate gửi, phiên, định dạng và lập kế hoạch payload |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa thăm dò hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời và adapter cho liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp cuộc hội thoại/liên kết luồng, ghép nối và liên kết đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các export prelude Plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình allowlist |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm` | Trình trợ giúp xác thực/bảo vệ DM trực tiếp dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã phát hành và khả năng tương thích owner được theo dõi; Plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho khả năng tương thích owner được theo dõi; Plugin mới nên dùng trình trợ giúp runtime được inject hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã lỗi thời cho các gói Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; Plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày tin nhắn ngữ nghĩa, phân phối và trả lời tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce luồng đến, khớp nhắc đến, trình trợ giúp chính sách nhắc đến và trình trợ giúp envelope |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce luồng đến hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp chính sách nhắc đến, marker nhắc đến và văn bản nhắc đến hẹp không kèm bề mặt runtime luồng đến rộng hơn |
    | `plugin-sdk/channel-envelope` | Trình trợ giúp định dạng envelope luồng đến hẹp |
    | `plugin-sdk/channel-location` | Trình trợ giúp ngữ cảnh vị trí kênh và định dạng |
    | `plugin-sdk/channel-logging` | Trình trợ giúp ghi log kênh cho các lần bỏ luồng đến và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả trả lời |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động tin nhắn kênh, cùng với trình trợ giúp schema gốc đã lỗi thời được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp chuẩn hóa route dùng chung, phân giải mục tiêu dựa trên parser, chuyển thread-id thành chuỗi, khóa route khử trùng lặp/compact, kiểu mục tiêu đã phân tích và so sánh route/mục tiêu |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích mục tiêu; bên gọi so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối phản hồi/phản ứng |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng secret hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu mục tiêu secret |
  </Accordion>

  <Accordion title="Đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá danh mục và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper cho mô hình đã tải |
    | `plugin-sdk/provider-setup` | Helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Helper thiết lập nhà cung cấp tự lưu trữ tương thích với OpenAI, có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper phân giải khóa API lúc chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/ghi hồ sơ khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Bộ dựng kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-auth-login` | Helper đăng nhập tương tác dùng chung cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-env-vars` | Helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa ID mô hình như `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime tăng cường danh mục nhà cung cấp và seam registry Plugin-nhà cung cấp cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper năng lực HTTP/endpoint chung cho nhà cung cấp, lỗi HTTP của nhà cung cấp và helper biểu mẫu multipart phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Helper hợp đồng cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper cấu hình/thông tin đăng nhập web-search hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper hợp đồng cấu hình/thông tin đăng nhập web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin đăng nhập có phạm vi |
    | `plugin-sdk/provider-web-search` | Helper đăng ký/bộ nhớ đệm/runtime cho nhà cung cấp web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán, và helper tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và các helper tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và helper wrapper dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper vận chuyển nhà cung cấp native như fetch có bảo vệ, chuyển đổi thông điệp vận chuyển và luồng sự kiện vận chuyển có thể ghi |
    | `plugin-sdk/provider-onboard` | Helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Helper chế độ kích hoạt nhóm hẹp và phân tích cú pháp lệnh |
  </Accordion>

  <Accordion title="Đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Bộ dựng thông báo lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper phân giải người phê duyệt và xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Helper hồ sơ/bộ lọc phê duyệt thực thi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/phân phối phê duyệt native |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper tải adapter phê duyệt native gọn nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/Gateway hẹp hơn khi chúng đã đủ |
    | `plugin-sdk/approval-native-runtime` | Helper mục tiêu phê duyệt native + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | Helper payload phản hồi phê duyệt exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload phê duyệt exec/Plugin, helper định tuyến/runtime phê duyệt native và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper đặt lại khử trùng lặp phản hồi đến có phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | Helper kiểm thử hợp đồng kênh hẹp không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh native, định dạng menu đối số động và helper mục tiêu phiên native |
    | `plugin-sdk/command-detection` | Helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Vị từ văn bản lệnh gọn nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper thu thập hợp đồng bí mật hẹp cho bề mặt bí mật của kênh/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper kiểu `coerceSecretRef` và SecretRef hẹp cho phân tích cú pháp hợp đồng bí mật/cấu hình |
    | `plugin-sdk/security-runtime` | Helper dùng chung cho độ tin cậy, chặn DM, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Helper danh sách cho phép máy chủ và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher hẹp không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch có bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Helper phân tích cú pháp đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Helper yêu cầu/đích Webhook và ép kiểu websocket/thân thô |
    | `plugin-sdk/webhook-request-guards` | Helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn phụ runtime và lưu trữ">
    | Đường dẫn phụ | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các helper rộng cho runtime/ghi log/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Các helper hẹp cho env runtime, logger, timeout, retry và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/mặc định đã chuẩn hóa, phân tích URL CDP và các helper xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các helper đăng ký và tra cứu runtime-context kênh chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các helper lệnh/hook/http/tương tác dùng chung cho Plugin |
    | `plugin-sdk/hook-runtime` | Các helper pipeline Webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các helper nhập/liên kết runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các helper exec tiến trình |
    | `plugin-sdk/cli-runtime` | Các helper định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và helper vá trạng thái kênh |
    | `plugin-sdk/config-types` | Bề mặt cấu hình chỉ kiểu cho các hình dạng cấu hình Plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các helper tra cứu cấu hình Plugin runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các helper chỉnh sửa cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các helper ảnh chụp cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter ảnh chụp kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram được đóng gói không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện autolink tham chiếu tệp mà không cần barrel text-runtime rộng |
    | `plugin-sdk/approval-runtime` | Các helper phê duyệt exec/Plugin, builder khả năng phê duyệt, helper xác thực/hồ sơ, helper định tuyến/runtime native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các helper runtime inbound/trả lời dùng chung, chia khúc, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các helper hẹp cho điều phối/hoàn tất trả lời và nhãn hội thoại |
    | `plugin-sdk/reply-history` | Các helper và marker lịch sử trả lời cửa sổ ngắn dùng chung như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các helper hẹp cho chia khúc văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các helper đường dẫn kho phiên, khóa phiên, updated-at và chỉnh sửa kho |
    | `plugin-sdk/cron-store-runtime` | Các helper đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các helper đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các helper định tuyến/khóa phiên/liên kết tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các helper tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái runtime và helper siêu dữ liệu vấn đề |
    | `plugin-sdk/target-resolver-runtime` | Các helper bộ phân giải mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các helper chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các reader tham số công cụ/CLI phổ biến |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các helper đường dẫn tải xuống tạm thời dùng chung |
    | `plugin-sdk/logging-core` | Logger hệ con và helper biên tập dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các helper chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các helper ghi đè model/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các helper phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các helper nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/file-lock` | Các helper khóa tệp vào lại |
    | `plugin-sdk/persistent-dedupe` | Các helper bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các helper runtime/phiên ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các helper đăng ký backend ACP nhẹ và điều phối trả lời cho Plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải binding ACP chỉ đọc mà không cần nhập khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive hẹp cho schema cấu hình runtime agent |
    | `plugin-sdk/boolean-param` | Reader tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các helper phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các helper bootstrap thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các primitive helper dùng chung cho kênh thụ động, trạng thái và proxy môi trường xung quanh |
    | `plugin-sdk/models-provider-runtime` | Các helper trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các helper liệt kê lệnh Skills |
    | `plugin-sdk/native-command-registry` | Các helper registry/xây dựng/serialize lệnh native |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin tin cậy thử nghiệm cho harness agent cấp thấp: kiểu harness, helper điều hướng/hủy active-run, helper cầu nối công cụ OpenClaw, helper chính sách công cụ runtime-plan, phân loại kết quả terminal, helper định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Các helper phát hiện endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper khóa async cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Helper giới hạn đồng thời tác vụ async |
    | `plugin-sdk/dedupe-runtime` | Các helper bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Helper xả hàng đợi giao hàng outbound đang chờ |
    | `plugin-sdk/file-access-runtime` | Các helper đường dẫn tệp cục bộ và nguồn media an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các helper sự kiện và hiển thị Heartbeat |
    | `plugin-sdk/number-runtime` | Helper ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các helper token/UUID an toàn |
    | `plugin-sdk/system-event-runtime` | Các helper hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Helper chờ sẵn sàng transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng dùng; dùng các đường dẫn phụ runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các helper bộ nhớ đệm có giới hạn nhỏ |
    | `plugin-sdk/diagnostic-runtime` | Các helper cờ chẩn đoán, sự kiện và trace-context |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, helper phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và helper tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader thân phản hồi có giới hạn mà không cần bề mặt media runtime rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái binding hội thoại hiện tại mà không cần định tuyến binding đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các helper kho phiên mà không nhập ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các helper hẹp cho ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không nhập markdown/ghi log |
    | `plugin-sdk/host-runtime` | Các helper chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các helper cấu hình retry và trình chạy retry |
    | `plugin-sdk/agent-runtime` | Các helper thư mục/danh tính/workspace agent |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các trình trợ giúp dùng chung để tìm nạp/chuyển đổi/lưu trữ phương tiện, dò kích thước video dựa trên ffprobe, và bộ dựng tải trọng phương tiện |
    | `plugin-sdk/media-store` | Các trình trợ giúp lưu trữ phương tiện phạm vi hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các trình trợ giúp dự phòng tạo phương tiện dùng chung, chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu phương tiện cùng các phần xuất trợ giúp hình ảnh/âm thanh dành cho nhà cung cấp |
    | `plugin-sdk/text-runtime` | Các trình trợ giúp văn bản/markdown/ghi nhật ký dùng chung như loại bỏ văn bản hiển thị cho trợ lý, trình trợ giúp kết xuất/chia đoạn/bảng markdown, trình trợ giúp biên tập ẩn, trình trợ giúp thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng các phần xuất chỉ thị, sổ đăng ký, xác thực, bộ dựng TTS tương thích OpenAI, và trình trợ giúp giọng nói dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói dùng chung, sổ đăng ký, chỉ thị, chuẩn hóa, và phần xuất trình trợ giúp giọng nói |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, trình trợ giúp sổ đăng ký, và trình trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và trình trợ giúp sổ đăng ký |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL tài sản/dữ liệu hình ảnh và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, dự phòng, xác thực, và trình trợ giúp sổ đăng ký |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trình trợ giúp dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, trình trợ giúp dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
    | `plugin-sdk/webhook-targets` | Sổ đăng ký đích Webhook và trình trợ giúp cài đặt tuyến |
    | `plugin-sdk/webhook-path` | Trình trợ giúp chuẩn hóa đường dẫn Webhook |
    | `plugin-sdk/web-media` | Trình trợ giúp tải phương tiện từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | `zod` được xuất lại cho người dùng SDK Plugin |
    | `plugin-sdk/testing` | Điểm xuất tương thích rộng cho các kiểm thử Plugin cũ. Các kiểm thử tiện ích mở rộng mới nên nhập các đường dẫn con SDK tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Trình trợ giúp `createTestPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không nhập các cầu nối trình trợ giúp kiểm thử của kho mã |
    | `plugin-sdk/agent-runtime-test-contracts` | Bộ cố định hợp đồng bộ chuyển đổi thời gian chạy tác tử gốc cho các kiểm thử xác thực, phân phối, dự phòng, móc công cụ, lớp phủ lời nhắc, lược đồ, và chiếu bản ghi hội thoại |
    | `plugin-sdk/channel-test-helpers` | Trình trợ giúp kiểm thử định hướng kênh cho các hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng cấu hình gửi, mô phỏng thời gian chạy, vấn đề trạng thái, phân phối gửi đi, và đăng ký móc |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi phân giải đích dùng chung cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Trình trợ giúp hợp đồng gói Plugin, đăng ký, hiện vật công khai, nhập trực tiếp, API thời gian chạy, và tác dụng phụ khi nhập |
    | `plugin-sdk/provider-test-contracts` | Trình trợ giúp hợp đồng thời gian chạy nhà cung cấp, xác thực, khám phá, hướng dẫn thiết lập, danh mục, trình hướng dẫn, năng lực phương tiện, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web, và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Mô phỏng HTTP/xác thực Vitest tùy chọn cho kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Bộ cố định chung cho chụp thời gian chạy CLI, ngữ cảnh hộp cát, trình ghi skill, tin nhắn tác tử, sự kiện hệ thống, tải lại mô-đun, đường dẫn Plugin đóng gói, văn bản terminal, chia đoạn, mã thông báo xác thực, và trường hợp có kiểu |
    | `plugin-sdk/test-node-mocks` | Trình trợ giúp mô phỏng tích hợp sẵn Node tập trung để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con bộ nhớ">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt trình trợ giúp memory-core đóng gói cho trình trợ giúp quản lý/cấu hình/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Giao diện thời gian chạy chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các phần xuất công cụ nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng nhúng máy chủ bộ nhớ, quyền truy cập sổ đăng ký, nhà cung cấp cục bộ, và trình trợ giúp lô/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các phần xuất công cụ QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các phần xuất công cụ lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Trình trợ giúp thời gian chạy CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh trung lập nhà cung cấp cho trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý dùng chung cho các Plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Giao diện thời gian chạy bộ nhớ chủ động cho quyền truy cập trình quản lý tìm kiếm |
    | `plugin-sdk/memory-host-status` | Bí danh trung lập nhà cung cấp cho trình trợ giúp trạng thái máy chủ bộ nhớ |
  </Accordion>

  <Accordion title="Đường dẫn con trình trợ giúp đóng gói dành riêng">
    Hiện không có đường dẫn con SDK trình trợ giúp đóng gói dành riêng nào. Các trình trợ giúp đặc thù chủ sở hữu
    nằm bên trong gói Plugin sở hữu, trong khi các hợp đồng máy chủ có thể tái sử dụng
    dùng các đường dẫn con SDK chung như `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
