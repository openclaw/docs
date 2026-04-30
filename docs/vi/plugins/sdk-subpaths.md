---
read_when:
    - Chọn đúng đường dẫn con của plugin-sdk cho lệnh import trong Plugin
    - Kiểm tra các đường dẫn con của Plugin được đóng gói kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con của Plugin SDK: import nào nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:39:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK được cung cấp dưới dạng một tập hợp các subpath hẹp trong `openclaw/plugin-sdk/`.
  Trang này liệt kê các subpath thường dùng, được nhóm theo mục đích. Danh sách đầy đủ
  được tạo gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
  các subpath trợ giúp dành riêng cho plugin đóng gói sẵn xuất hiện ở đó nhưng là chi tiết
  triển khai, trừ khi một trang tài liệu quảng bá chúng một cách rõ ràng. Maintainer có thể kiểm tra các
  subpath trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export trợ giúp
  dành riêng không dùng sẽ làm báo cáo CI thất bại thay vì ở lại SDK công khai
  như nợ tương thích không hoạt động.

  Để xem hướng dẫn tạo plugin, xem [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

  ## Điểm vào Plugin

  | Subpath                                   | Export chính                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel tương thích rộng cho các kiểm thử plugin cũ; ưu tiên các subpath kiểm thử tập trung cho kiểm thử extension mới                                                                     |
  | `plugin-sdk/plugin-test-api`              | Bộ dựng mock `OpenClawPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký plugin trực tiếp                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho hồ sơ xác thực, chặn gửi, phân loại fallback, hook công cụ, lớp phủ prompt, schema và sửa transcript |
  | `plugin-sdk/channel-test-helpers`         | Trình trợ giúp kiểm thử vòng đời tài khoản kênh, thư mục, cấu hình gửi, mock runtime, hook, điểm vào kênh đóng gói sẵn, dấu thời gian envelope, phản hồi ghép đôi và hợp đồng kênh chung   |
  | `plugin-sdk/channel-target-testing`       | Bộ kiểm thử chung cho các trường hợp lỗi phân giải đích kênh                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Trình trợ giúp hợp đồng cho đăng ký plugin, manifest gói, artifact công khai, runtime API, hiệu ứng phụ khi import và import trực tiếp                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture cho runtime plugin, registry, đăng ký provider, trình hướng dẫn thiết lập và task-flow runtime trong kiểm thử                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Trình trợ giúp hợp đồng cho runtime provider, xác thực, khám phá, onboard, catalog, khả năng media, chính sách phát lại, realtime STT live-audio, web-search/fetch và wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/xác thực Vitest dạng opt-in cho kiểm thử provider thực thi `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixture cho môi trường kiểm thử, fetch/network, máy chủ HTTP dùng một lần, yêu cầu đến, live-test, hệ thống tệp tạm thời và điều khiển thời gian                                        |
  | `plugin-sdk/test-fixtures`                | Fixture kiểm thử chung cho CLI, sandbox, kỹ năng, agent-message, system-event, tải lại mô-đun, đường dẫn plugin đóng gói sẵn, terminal, chunking, auth-token và typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Trình trợ giúp mock builtin Node tập trung để dùng trong các factory Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Trình trợ giúp mục provider migration như `createMigrationItem`, hằng reason, marker trạng thái mục, trình trợ giúp biên tập lại và `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Trình trợ giúp migration runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpath | Export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp wizard thiết lập dùng chung, prompt allowlist, bộ dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/action-gate đa tài khoản, trình trợ giúp fallback tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + fallback mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình kênh dùng chung và bộ dựng chung |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đóng gói sẵn chỉ dành cho các plugin đóng gói sẵn được bảo trì |
    | `plugin-sdk/channel-config-schema-legacy` | Alias tương thích đã ngừng khuyến nghị cho schema cấu hình kênh đóng gói sẵn |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với fallback hợp đồng đóng gói sẵn |
    | `plugin-sdk/command-gating` | Trình trợ giúp cổng ủy quyền lệnh hẹp |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, trình trợ giúp vòng đời/hoàn tất luồng bản nháp |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dùng chung cho route đến + bộ dựng envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp dùng chung cho ghi nhận và điều phối inbound |
    | `plugin-sdk/messaging-targets` | Trình trợ giúp phân tích/khớp đích |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media gửi đi dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu dependency gửi đi gọn nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Trình trợ giúp gửi đi, định danh, send delegate, phiên, định dạng và lập kế hoạch payload |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp vòng đời thread-binding và adapter |
    | `plugin-sdk/agent-media-payload` | Bộ dựng payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp binding hội thoại/thread, ghép đôi và binding đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive schema cấu hình kênh hẹp |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Export prelude plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp chỉnh sửa/đọc cấu hình allowlist |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm` | Trình trợ giúp xác thực/guard direct-DM dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã ngừng khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích owner đang được theo dõi; plugin mới nên dùng các subpath SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã ngừng khuyến nghị cho tương thích owner đang được theo dõi; plugin mới nên dùng trình trợ giúp runtime được inject hoặc các subpath SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã ngừng khuyến nghị cho các gói Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông điệp ngữ nghĩa, gửi và phản hồi tương tác cũ. Xem [Trình Bày Thông Điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce inbound, khớp mention, trình trợ giúp chính sách mention và trình trợ giúp envelope |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce inbound hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho chính sách mention, marker mention và văn bản mention mà không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope` | Trình trợ giúp định dạng envelope inbound hẹp |
    | `plugin-sdk/channel-location` | Trình trợ giúp ngữ cảnh vị trí kênh và định dạng |
    | `plugin-sdk/channel-logging` | Trình trợ giúp ghi log kênh cho inbound bị bỏ và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Trình trợ giúp hành động thông điệp kênh, cùng với trình trợ giúp schema native đã ngừng khuyến nghị được giữ lại để tương thích plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp dùng chung cho chuẩn hóa route, phân giải đích dựa trên parser, chuỗi hóa thread-id, khóa route dedupe/compact, kiểu parsed-target và so sánh route/target |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích đích; caller so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Nối dây feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng secret hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu đích secret |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Đường dẫn phụ | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá danh mục và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, header yêu cầu và helper mô hình đã tải |
    | `plugin-sdk/provider-setup` | helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có phạm vi tập trung |
    | `plugin-sdk/cli-backend` | mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | helper phân giải khóa API lúc chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-auth-api-key` | helper onboarding/ghi hồ sơ khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | trình dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-auth-login` | helper đăng nhập tương tác dùng chung cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-env-vars` | helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, trình dựng chính sách phát lại dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa mã mô hình như `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | hook runtime bổ sung danh mục nhà cung cấp và seam registry plugin-nhà cung cấp cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | helper năng lực HTTP/endpoint nhà cung cấp chung, lỗi HTTP nhà cung cấp và helper biểu mẫu multipart cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | helper hợp đồng cấu hình/lựa chọn web-fetch phạm vi hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | helper đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | helper cấu hình/thông tin xác thực web-search phạm vi hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | helper hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | helper đăng ký/bộ nhớ đệm/runtime nhà cung cấp web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán và helper tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và các helper tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | helper transport nhà cung cấp gốc như fetch có bảo vệ, biến đổi thông điệp transport và luồng sự kiện transport có thể ghi |
    | `plugin-sdk/provider-onboard` | helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | helper singleton/map/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | helper phân tích cú pháp lệnh và chế độ kích hoạt nhóm phạm vi hẹp |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Đường dẫn phụ | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | helper phân giải người phê duyệt và xác thực hành động cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | helper hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | adapter năng lực/phân phối phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | helper tải adapter phê duyệt gốc gọn nhẹ cho điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | helper runtime bộ xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/gateway hẹp hơn khi chúng đã đủ |
    | `plugin-sdk/approval-native-runtime` | helper mục tiêu phê duyệt gốc + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | helper payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | helper đặt lại khử trùng lặp phản hồi đến phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | helper kiểm thử hợp đồng kênh phạm vi hẹp, không dùng barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | xác thực lệnh gốc, định dạng menu đối số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | predicate văn bản lệnh gọn nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | chuẩn hóa thân lệnh và helper bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | helper thu thập hợp đồng bí mật phạm vi hẹp cho bề mặt bí mật kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | helper định kiểu `coerceSecretRef` và SecretRef phạm vi hẹp cho phân tích hợp đồng/cấu hình bí mật |
    | `plugin-sdk/security-runtime` | helper dùng chung về độ tin cậy, cổng DM, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật hằng thời gian và thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | helper danh sách cho phép host và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | helper dispatcher ghim phạm vi hẹp, không dùng bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | dispatcher ghim, fetch có bảo vệ SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | helper phân tích đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | helper yêu cầu/mục tiêu Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | helper kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các helper runtime/ghi nhật ký/sao lưu/cài đặt plugin phạm vi rộng |
    | `plugin-sdk/runtime-env` | Các helper runtime env, logger, timeout, retry và backoff phạm vi hẹp |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho profile/defaults đã chuẩn hóa, phân tích URL CDP và các helper xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các helper đăng ký và tra cứu runtime-context kênh chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các helper lệnh/hook/http/tương tác dùng chung cho plugin |
    | `plugin-sdk/hook-runtime` | Các helper pipeline webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các helper nhập/liên kết runtime lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các helper thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các helper định dạng CLI, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Gateway client, helper khởi động client sẵn sàng cho vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và các helper bản vá trạng thái kênh |
    | `plugin-sdk/config-types` | Bề mặt cấu hình chỉ kiểu cho các dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các helper tra cứu plugin-config runtime như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các helper thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các helper snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và setter snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện autolink tham chiếu tệp mà không dùng barrel text-runtime phạm vi rộng |
    | `plugin-sdk/approval-runtime` | Các helper phê duyệt exec/plugin, builder khả năng phê duyệt, helper auth/profile, helper định tuyến/runtime gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các helper runtime nhận vào/trả lời dùng chung, chia đoạn, dispatch, heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các helper dispatch/hoàn tất trả lời và nhãn hội thoại phạm vi hẹp |
    | `plugin-sdk/reply-history` | Các helper lịch sử trả lời cửa sổ ngắn dùng chung và marker như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các helper chia đoạn văn bản/markdown phạm vi hẹp |
    | `plugin-sdk/session-store-runtime` | Các helper đường dẫn kho phiên, khóa phiên, thời điểm cập nhật và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Các helper đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các helper đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các helper định tuyến/khóa phiên/liên kết tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các helper tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định runtime-state và helper siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các helper trình phân giải đích dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các helper chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL dạng chuỗi từ các input giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có giới hạn thời gian với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các reader tham số công cụ/CLI dùng chung |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường đích gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các helper đường dẫn tải xuống tạm dùng chung |
    | `plugin-sdk/logging-core` | Các helper logger hệ con và che giấu dữ liệu nhạy cảm |
    | `plugin-sdk/markdown-table-runtime` | Các helper chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các helper ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các helper phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các helper đọc/ghi trạng thái JSON nhỏ |
    | `plugin-sdk/file-lock` | Các helper file-lock tái nhập |
    | `plugin-sdk/persistent-dedupe` | Các helper bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các helper runtime/phiên ACP và dispatch trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các helper đăng ký backend ACP gọn nhẹ và dispatch trả lời cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không nhập khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình runtime tác tử phạm vi hẹp |
    | `plugin-sdk/boolean-param` | Reader tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các helper phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các helper bootstrap thiết bị và token ghép nối |
    | `plugin-sdk/extension-shared` | Các primitive helper dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các helper trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các helper liệt kê lệnh Skill |
    | `plugin-sdk/native-command-registry` | Các helper registry/build/serialize lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt plugin đáng tin cậy thử nghiệm cho harness tác tử cấp thấp: kiểu harness, helper điều hướng/hủy lần chạy đang hoạt động, helper cầu nối công cụ OpenClaw, helper chính sách công cụ runtime-plan, phân loại kết quả terminal, helper định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Các helper phát hiện endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper khóa bất đồng bộ cục bộ theo tiến trình cho các tệp trạng thái runtime nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetry hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Helper giới hạn concurrency tác vụ bất đồng bộ |
    | `plugin-sdk/dedupe-runtime` | Các helper bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Helper xả hàng đợi giao hàng đang chờ đi ra |
    | `plugin-sdk/file-access-runtime` | Các helper đường dẫn tệp cục bộ và nguồn phương tiện an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các helper sự kiện Heartbeat và khả năng hiển thị |
    | `plugin-sdk/number-runtime` | Helper ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các helper token/UUID an toàn |
    | `plugin-sdk/system-event-runtime` | Các helper hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Helper chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng dùng; hãy dùng các đường dẫn con runtime tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các helper bộ nhớ đệm giới hạn nhỏ |
    | `plugin-sdk/diagnostic-runtime` | Các helper cờ chẩn đoán, sự kiện và trace-context |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các helper phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và helper tra cứu ghim |
    | `plugin-sdk/runtime-fetch` | Fetch runtime nhận biết dispatcher mà không nhập proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader response-body có giới hạn mà không dùng bề mặt runtime phương tiện phạm vi rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết hội thoại hiện tại mà không cần định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/session-store-runtime` | Các helper session-store mà không nhập ghi/bảo trì cấu hình phạm vi rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không nhập cấu hình/bảo mật phạm vi rộng |
    | `plugin-sdk/string-coerce-runtime` | Các helper ép kiểu và chuẩn hóa primitive record/chuỗi phạm vi hẹp mà không nhập markdown/ghi nhật ký |
    | `plugin-sdk/host-runtime` | Các helper chuẩn hóa hostname và host SCP |
    | `plugin-sdk/retry-runtime` | Các helper cấu hình retry và trình chạy retry |
    | `plugin-sdk/agent-runtime` | Các helper thư mục/danh tính/workspace tác tử |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Nội dung xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các trình trợ giúp chung để tải nạp/chuyển đổi/lưu trữ media, dò kích thước video dựa trên ffprobe, và trình dựng payload media |
    | `plugin-sdk/media-store` | Các trình trợ giúp media store phạm vi hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các trình trợ giúp dự phòng khi tạo media, chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu media cùng với nội dung xuất trình trợ giúp hình ảnh/âm thanh hướng tới nhà cung cấp |
    | `plugin-sdk/text-runtime` | Các trình trợ giúp văn bản/markdown/ghi log chung như loại bỏ văn bản hiển thị cho trợ lý, trình trợ giúp render/chia đoạn/bảng markdown, trình trợ giúp biên tập ẩn, trình trợ giúp thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp giọng nói cùng với nội dung xuất chỉ thị, registry, xác thực, trình dựng TTS tương thích OpenAI, và trình trợ giúp giọng nói hướng tới nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa, và nội dung xuất trình trợ giúp giọng nói dùng chung |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, trình trợ giúp registry, và trình trợ giúp phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và trình trợ giúp registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng với trình trợ giúp asset hình ảnh/data URL và trình dựng nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh, dự phòng, xác thực, và trình trợ giúp registry dùng chung |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, trình trợ giúp dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, trình trợ giúp dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và trình trợ giúp cài đặt route |
    | `plugin-sdk/webhook-path` | Trình trợ giúp chuẩn hóa đường dẫn Webhook |
    | `plugin-sdk/web-media` | Trình trợ giúp tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | `zod` được xuất lại cho người dùng SDK plugin |
    | `plugin-sdk/testing` | Barrel tương thích rộng cho các kiểm thử plugin cũ. Các kiểm thử extension mới nên nhập các đường dẫn con SDK tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay thế |
    | `plugin-sdk/plugin-test-api` | Trình trợ giúp `createTestPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký plugin trực tiếp mà không nhập các cầu nối trình trợ giúp kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho kiểm thử xác thực, phân phối, dự phòng, tool-hook, prompt-overlay, schema, và chiếu transcript |
    | `plugin-sdk/channel-test-helpers` | Trình trợ giúp kiểm thử hướng kênh cho các hợp đồng hành động/thiết lập/trạng thái chung, khẳng định thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối đi, và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ ca lỗi phân giải đích dùng chung cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Trình trợ giúp hợp đồng gói plugin, đăng ký, artifact công khai, nhập trực tiếp, API runtime, và tác dụng phụ khi nhập |
    | `plugin-sdk/provider-test-contracts` | Trình trợ giúp hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực media, chính sách phát lại, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tải web, và luồng |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest tùy chọn cho kiểm thử nhà cung cấp chạy qua `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn plugin đi kèm, terminal-text, chia đoạn, auth-token, và typed-case |
    | `plugin-sdk/test-node-mocks` | Trình trợ giúp mock Node builtin tập trung để dùng bên trong factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con bộ nhớ">
    | Đường dẫn con | Nội dung xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt trình trợ giúp memory-core đi kèm cho trình trợ giúp manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Nội dung xuất engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ, và trình trợ giúp batch/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Nội dung xuất engine QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Nội dung xuất engine lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Trình trợ giúp runtime CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Trình trợ giúp runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp file/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập với nhà cung cấp cho trình trợ giúp runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập với nhà cung cấp cho trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh trung lập với nhà cung cấp cho trình trợ giúp file/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Trình trợ giúp managed-markdown dùng chung cho các plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh trung lập với nhà cung cấp cho trình trợ giúp trạng thái máy chủ bộ nhớ |
  </Accordion>

  <Accordion title="Các đường dẫn con trình trợ giúp đi kèm được dự trữ">
    Hiện không có đường dẫn con SDK trình trợ giúp đi kèm nào được dự trữ. Các
    trình trợ giúp riêng theo chủ sở hữu nằm trong gói plugin sở hữu chúng, trong khi các hợp đồng host có thể tái sử dụng
    dùng các đường dẫn con SDK chung như `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
