---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho lệnh import Plugin
    - Rà soát các đường dẫn con của Plugin đi kèm và các bề mặt trợ giúp
summary: 'Danh mục đường dẫn con SDK Plugin: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-04-29T23:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60fe10982b9aa01af76bfbd72475168c8138f68dd410b4488b6b6c4c00097e53
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK được cung cấp dưới dạng một tập hợp các subpath hẹp trong `openclaw/plugin-sdk/`.
  Trang này liệt kê các subpath thường dùng, được nhóm theo mục đích. Danh sách đầy đủ được tạo
  gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
  các subpath trợ giúp dành riêng cho Plugin tích hợp xuất hiện ở đó nhưng là chi tiết triển khai,
  trừ khi một trang tài liệu quảng bá chúng rõ ràng. Maintainer có thể kiểm tra các
  subpath trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`; các export trợ giúp
  dành riêng không dùng sẽ làm báo cáo CI thất bại thay vì ở lại SDK công khai
  như khoản nợ tương thích không hoạt động.

  Để xem hướng dẫn tạo Plugin, xem [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

  ## Mục nhập Plugin

  | Subpath                                   | Các export chính                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel tương thích rộng cho các bài kiểm thử Plugin cũ; ưu tiên các subpath kiểm thử tập trung cho bài kiểm thử Plugin mới                                                                     |
  | `plugin-sdk/plugin-test-api`              | Trình dựng mock `OpenClawPluginApi` tối thiểu cho bài kiểm thử đơn vị đăng ký Plugin trực tiếp                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho hồ sơ xác thực, chặn phân phối, phân loại fallback, hook công cụ, lớp phủ prompt, schema và sửa transcript |
  | `plugin-sdk/channel-test-helpers`         | Trình trợ giúp kiểm thử hợp đồng channel chung, vòng đời tài khoản channel, thư mục, cấu hình gửi, mock runtime, hook, mục nhập channel tích hợp, dấu thời gian envelope và phản hồi ghép nối   |
  | `plugin-sdk/channel-target-testing`       | Bộ kiểm thử ca lỗi phân giải mục tiêu channel dùng chung                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Trình trợ giúp hợp đồng cho đăng ký Plugin, manifest gói, artifact công khai, API runtime, side effect khi import và import trực tiếp                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture cho kiểm thử runtime Plugin, registry, đăng ký provider, trình hướng dẫn thiết lập và task-flow runtime                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Trình trợ giúp hợp đồng cho runtime provider, xác thực, khám phá, onboard, catalog, khả năng media, chính sách replay, realtime STT live-audio, web-search/fetch và wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/xác thực Vitest dạng opt-in cho kiểm thử provider dùng `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixture môi trường kiểm thử, fetch/network, máy chủ HTTP dùng một lần, yêu cầu đến, live-test, hệ thống tệp tạm thời và điều khiển thời gian                                        |
  | `plugin-sdk/test-fixtures`                | Fixture kiểm thử chung cho CLI, sandbox, skill, agent-message, system-event, tải lại module, đường dẫn Plugin tích hợp, terminal, chunking, auth-token và typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Trình trợ giúp mock builtin Node tập trung để dùng bên trong factory Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Trình trợ giúp item provider migration như `createMigrationItem`, hằng reason, marker trạng thái item, trình trợ giúp biên tập lại và `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Trình trợ giúp migration runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod `openclaw.json` gốc (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cộng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Trình trợ giúp wizard thiết lập dùng chung, prompt allowlist, trình dựng trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Trình trợ giúp cấu hình/cổng hành động đa tài khoản, trình trợ giúp fallback tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, trình trợ giúp chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản + fallback mặc định |
    | `plugin-sdk/account-helpers` | Trình trợ giúp hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive schema cấu hình channel dùng chung và trình dựng chung |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình channel OpenClaw tích hợp chỉ dành cho Plugin tích hợp được duy trì |
    | `plugin-sdk/channel-config-schema-legacy` | Alias tương thích đã lỗi thời cho schema cấu hình bundled-channel |
    | `plugin-sdk/telegram-command-config` | Trình trợ giúp chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với fallback hợp đồng tích hợp |
    | `plugin-sdk/command-gating` | Trình trợ giúp hẹp cho cổng ủy quyền lệnh |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, trình trợ giúp vòng đời/hoàn tất draft stream |
    | `plugin-sdk/inbound-envelope` | Trình trợ giúp dùng chung cho route đến + dựng envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp dùng chung cho ghi nhận và điều phối đến |
    | `plugin-sdk/messaging-targets` | Trình trợ giúp phân tích/khớp mục tiêu |
    | `plugin-sdk/outbound-media` | Trình trợ giúp tải media gửi đi dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu phụ thuộc gửi đi nhẹ cho adapter channel |
    | `plugin-sdk/outbound-runtime` | Trình trợ giúp phân phối gửi đi, danh tính, delegate gửi, phiên, định dạng và lập kế hoạch payload |
    | `plugin-sdk/poll-runtime` | Trình trợ giúp chuẩn hóa poll hẹp |
    | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp adapter và vòng đời thread-binding |
    | `plugin-sdk/agent-media-payload` | Trình dựng payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Trình trợ giúp binding conversation/thread, ghép nối và binding đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Trình trợ giúp snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Trình trợ giúp phân giải group-policy runtime |
    | `plugin-sdk/channel-status` | Trình trợ giúp tóm tắt/snapshot trạng thái channel dùng chung |
    | `plugin-sdk/channel-config-primitives` | Primitive hẹp cho channel config-schema |
    | `plugin-sdk/channel-config-writes` | Trình trợ giúp ủy quyền ghi cấu hình channel |
    | `plugin-sdk/channel-plugin-common` | Export prelude Plugin channel dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp đọc/sửa cấu hình allowlist |
    | `plugin-sdk/group-access` | Trình trợ giúp quyết định group-access dùng chung |
    | `plugin-sdk/direct-dm` | Trình trợ giúp xác thực/guard direct-DM dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã lỗi thời cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng các subpath SDK channel chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã lỗi thời cho tương thích chủ sở hữu được theo dõi; Plugin mới nên dùng trình trợ giúp runtime được inject hoặc các subpath SDK channel chung |
    | `plugin-sdk/interactive-runtime` | Trình trợ giúp trình bày thông điệp theo ngữ nghĩa, phân phối và phản hồi tương tác cũ. Xem [Trình bày thông điệp](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce đến, khớp mention, trình trợ giúp mention-policy và trình trợ giúp envelope |
    | `plugin-sdk/channel-inbound-debounce` | Trình trợ giúp debounce đến hẹp |
    | `plugin-sdk/channel-mention-gating` | Trình trợ giúp hẹp cho mention-policy, marker mention và văn bản mention mà không có bề mặt runtime đến rộng hơn |
    | `plugin-sdk/channel-envelope` | Trình trợ giúp định dạng envelope đến hẹp |
    | `plugin-sdk/channel-location` | Ngữ cảnh vị trí channel và trình trợ giúp định dạng |
    | `plugin-sdk/channel-logging` | Trình trợ giúp ghi log channel cho lần bỏ qua đến và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Trình trợ giúp message-action channel, cộng với trình trợ giúp schema gốc đã lỗi thời được giữ lại để tương thích Plugin |
    | `plugin-sdk/channel-route` | Trình trợ giúp dùng chung cho chuẩn hóa route, phân giải mục tiêu bằng parser, chuỗi hóa thread-id, khóa route dedupe/compact, kiểu parsed-target và so sánh route/mục tiêu |
    | `plugin-sdk/channel-targets` | Trình trợ giúp phân tích mục tiêu; caller so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Kiểu hợp đồng channel |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Trình trợ giúp hợp đồng secret hẹp như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` và kiểu mục tiêu secret |
  </Accordion>

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, phát hiện danh mục và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | facade runtime LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, phát hiện mô hình, header yêu cầu và helper mô hình đã tải |
    | `plugin-sdk/provider-setup` | Các helper thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Các helper thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm |
    | `plugin-sdk/cli-backend` | Mặc định backend CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Các helper phân giải API-key lúc chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-auth-api-key` | Các helper onboarding/ghi hồ sơ API-key như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình dựng kết quả xác thực OAuth tiêu chuẩn |
    | `plugin-sdk/provider-auth-login` | Các helper đăng nhập tương tác dùng chung cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-env-vars` | Các helper tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các trình dựng chính sách phát lại dùng chung, helper endpoint nhà cung cấp và helper chuẩn hóa model-id như `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime bổ sung danh mục nhà cung cấp và các seam registry plugin-provider cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Các helper năng lực HTTP/endpoint nhà cung cấp chung, lỗi HTTP nhà cung cấp và helper biểu mẫu nhiều phần cho phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Các helper hợp đồng cấu hình/lựa chọn web-fetch hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Các helper đăng ký/cache nhà cung cấp web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Các helper cấu hình/thông tin xác thực web-search hẹp cho nhà cung cấp không cần nối dây bật plugin |
    | `plugin-sdk/provider-web-search-contract` | Các helper hợp đồng cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
    | `plugin-sdk/provider-web-search` | Các helper đăng ký/cache/runtime nhà cung cấp web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán và helper tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và các helper tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và các helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | Các helper vận chuyển nhà cung cấp gốc như fetch có bảo vệ, biến đổi thông điệp vận chuyển và luồng sự kiện vận chuyển có thể ghi |
    | `plugin-sdk/provider-onboard` | Các helper vá cấu hình onboarding |
    | `plugin-sdk/global-singleton` | Các helper singleton/map/cache cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Các helper phân tích cú pháp lệnh và chế độ kích hoạt nhóm hẹp |
  </Accordion>

  <Accordion title="Các đường dẫn con về xác thực và bảo mật">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, các helper registry lệnh bao gồm định dạng menu đối số động, helper ủy quyền người gửi |
    | `plugin-sdk/command-status` | Các trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Phân giải người phê duyệt và helper xác thực hành động trong cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các helper hồ sơ/bộ lọc phê duyệt exec gốc |
    | `plugin-sdk/approval-delivery-runtime` | Adapter năng lực/gửi phê duyệt gốc |
    | `plugin-sdk/approval-gateway-runtime` | Helper phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các helper tải adapter phê duyệt gốc nhẹ cho entrypoint kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Các helper runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam adapter/gateway hẹp hơn khi chúng đã đủ |
    | `plugin-sdk/approval-native-runtime` | Các helper mục tiêu phê duyệt gốc + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | Các helper payload phản hồi phê duyệt exec/plugin |
    | `plugin-sdk/approval-runtime` | Các helper payload phê duyệt exec/plugin, helper định tuyến/runtime phê duyệt gốc và helper hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Các helper đặt lại chống trùng lặp phản hồi đến hẹp |
    | `plugin-sdk/channel-contract-testing` | Các helper kiểm thử hợp đồng kênh hẹp không có barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh gốc, định dạng menu đối số động và helper mục tiêu phiên gốc |
    | `plugin-sdk/command-detection` | Các helper phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Predicate văn bản lệnh nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Các helper chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Các helper thu thập hợp đồng bí mật hẹp cho bề mặt bí mật kênh/plugin |
    | `plugin-sdk/secret-ref-runtime` | Các helper kiểu hóa `coerceSecretRef` và SecretRef hẹp cho phân tích cú pháp hợp đồng bí mật/cấu hình |
    | `plugin-sdk/security-runtime` | Các helper dùng chung cho độ tin cậy, chặn DM, nội dung bên ngoài, biên tập văn bản nhạy cảm, so sánh bí mật theo thời gian hằng định và thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Các helper chính sách danh sách cho phép host và SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Các helper dispatcher ghim hẹp không có bề mặt runtime hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Dispatcher ghim, fetch được bảo vệ bằng SSRF, lỗi SSRF và helper chính sách SSRF |
    | `plugin-sdk/secret-input` | Các helper phân tích cú pháp đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các helper yêu cầu/mục tiêu Webhook và ép kiểu websocket/body thô |
    | `plugin-sdk/webhook-request-guards` | Các helper kích thước/timeout thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn con thời gian chạy và lưu trữ">
    | Đường dẫn con | Các mục xuất chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trợ giúp rộng cho thời gian chạy/ghi nhật ký/sao lưu/cài đặt Plugin |
    | `plugin-sdk/runtime-env` | Các trợ giúp hẹp cho môi trường thời gian chạy, trình ghi nhật ký, thời gian chờ, thử lại và lùi dần |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/giá trị mặc định đã chuẩn hóa, phân tích URL CDP và các trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các trợ giúp đăng ký và tra cứu ngữ cảnh thời gian chạy kênh chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các trợ giúp lệnh/hook/http/tương tác dùng chung cho Plugin |
    | `plugin-sdk/hook-runtime` | Các trợ giúp đường ống Webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các trợ giúp nhập/ràng buộc thời gian chạy lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trợ giúp thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các trợ giúp định dạng CLI, chờ, phiên bản, gọi đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Ứng dụng khách Gateway, trợ giúp khởi động ứng dụng khách sẵn sàng vòng lặp sự kiện, RPC CLI Gateway, lỗi giao thức Gateway và các trợ giúp bản vá trạng thái kênh |
    | `plugin-sdk/config-types` | Bề mặt cấu hình chỉ kiểu cho các dạng cấu hình Plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các trợ giúp tra cứu cấu hình Plugin thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các trợ giúp ảnh chụp nhanh cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và các bộ đặt ảnh chụp nhanh kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện liên kết tự động tham chiếu tệp mà không cần barrel text-runtime rộng |
    | `plugin-sdk/approval-runtime` | Các trợ giúp phê duyệt exec/Plugin, bộ dựng năng lực phê duyệt, trợ giúp xác thực/hồ sơ, trợ giúp định tuyến/thời gian chạy gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các trợ giúp thời gian chạy nhận vào/trả lời dùng chung, chia đoạn, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các trợ giúp hẹp cho điều phối/hoàn tất trả lời và nhãn cuộc hội thoại |
    | `plugin-sdk/reply-history` | Các trợ giúp và dấu mốc lịch sử trả lời trong cửa sổ ngắn dùng chung như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trợ giúp hẹp cho chia đoạn văn bản/markdown |
    | `plugin-sdk/session-store-runtime` | Các trợ giúp đường dẫn kho phiên, khóa phiên, cập nhật-lúc và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Các trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các trợ giúp ràng buộc tuyến/khóa phiên/tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, giá trị mặc định trạng thái thời gian chạy và trợ giúp siêu dữ liệu vấn đề |
    | `plugin-sdk/target-resolver-runtime` | Các trợ giúp bộ phân giải mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Bộ chạy lệnh có hẹn giờ với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các bộ đọc tham số công cụ/CLI thông dụng |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn tắc từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các trợ giúp đường dẫn tải xuống tạm dùng chung |
    | `plugin-sdk/logging-core` | Các trợ giúp trình ghi nhật ký hệ thống con và biên tập ẩn |
    | `plugin-sdk/markdown-table-runtime` | Các trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/file-lock` | Các trợ giúp khóa tệp tái nhập |
    | `plugin-sdk/persistent-dedupe` | Các trợ giúp bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các trợ giúp thời gian chạy/phiên ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các trợ giúp backend ACP gọn nhẹ cho đăng ký và điều phối trả lời dành cho Plugin được tải lúc khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải ràng buộc ACP chỉ đọc mà không cần nhập khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các nguyên thủy schema cấu hình thời gian chạy agent hẹp |
    | `plugin-sdk/boolean-param` | Bộ đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trợ giúp khởi tạo thiết bị và token ghép đôi |
    | `plugin-sdk/extension-shared` | Các nguyên thủy trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các trợ giúp trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trợ giúp liệt kê lệnh Skills |
    | `plugin-sdk/native-command-registry` | Các trợ giúp đăng ký/xây dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt Plugin đáng tin cậy thử nghiệm cho các harness agent cấp thấp: kiểu harness, trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trợ giúp cầu nối công cụ OpenClaw, trợ giúp chính sách công cụ kế hoạch thời gian chạy, phân loại kết quả terminal, trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Các trợ giúp phát hiện endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trợ giúp khóa bất đồng bộ cục bộ tiến trình cho các tệp trạng thái thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trợ giúp đo lường hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trợ giúp đồng thời tác vụ bất đồng bộ có giới hạn |
    | `plugin-sdk/dedupe-runtime` | Các trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trợ giúp xả hàng đợi giao hàng đang chờ đi ra |
    | `plugin-sdk/file-access-runtime` | Các trợ giúp đường dẫn tệp cục bộ và nguồn phương tiện an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các trợ giúp sự kiện Heartbeat và khả năng hiển thị |
    | `plugin-sdk/number-runtime` | Trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trợ giúp chờ trạng thái sẵn sàng của vận chuyển |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng dùng; dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các trợ giúp bộ nhớ đệm nhỏ có giới hạn |
    | `plugin-sdk/diagnostic-runtime` | Các trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh dấu vết |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, các trợ giúp phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và các trợ giúp tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không cần nhập proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Bộ đọc thân phản hồi có giới hạn mà không cần bề mặt thời gian chạy phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái ràng buộc cuộc hội thoại hiện tại mà không cần định tuyến ràng buộc đã cấu hình hoặc kho ghép đôi |
    | `plugin-sdk/session-store-runtime` | Các trợ giúp kho phiên mà không cần nhập ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải khả năng hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không cần nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trợ giúp hẹp cho ép kiểu và chuẩn hóa bản ghi/chuỗi nguyên thủy mà không cần nhập markdown/ghi nhật ký |
    | `plugin-sdk/host-runtime` | Các trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Các trợ giúp cấu hình thử lại và bộ chạy thử lại |
    | `plugin-sdk/agent-runtime` | Các trợ giúp thư mục/định danh/không gian làm việc của agent |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Các đường dẫn con về năng lực và kiểm thử">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper chia sẻ để tìm nạp/chuyển đổi/lưu trữ media, thăm dò kích thước video dựa trên ffprobe và trình tạo tải trọng media |
    | `plugin-sdk/media-store` | Các helper lưu trữ media phạm vi hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các helper failover tạo media dùng chung, chọn ứng viên và thông báo thiếu model |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu media cùng các phần xuất helper hình ảnh/âm thanh hướng tới nhà cung cấp |
    | `plugin-sdk/text-runtime` | Các helper văn bản/markdown/ghi log dùng chung như loại bỏ văn bản hiển thị với trợ lý, helper render/chia đoạn/bảng markdown, helper biên tập, helper thẻ chỉ thị và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp speech cùng các phần xuất hướng tới nhà cung cấp cho chỉ thị, registry, xác thực, trình tạo TTS tương thích OpenAI và helper speech |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp speech dùng chung, registry, chỉ thị, chuẩn hóa và các phần xuất helper speech |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và helper registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng helper asset hình ảnh/data URL và trình tạo nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, failover, xác thực và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper failover, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper failover, tra cứu nhà cung cấp và phân tích model-ref |
    | `plugin-sdk/webhook-targets` | Registry mục tiêu Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Helper chuẩn hóa đường dẫn Webhook |
    | `plugin-sdk/web-media` | Helper tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | `zod` được xuất lại cho người dùng plugin SDK |
    | `plugin-sdk/testing` | Barrel tương thích rộng cho các bài kiểm thử Plugin cũ. Các bài kiểm thử plugin mới nên import các đường dẫn con SDK tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` hoặc `plugin-sdk/test-fixtures` thay vào đó |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu cho các bài kiểm thử đơn vị đăng ký Plugin trực tiếp mà không import cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho các bài kiểm thử xác thực, phân phối, fallback, tool-hook, prompt-overlay, schema và chiếu transcript |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh cho hợp đồng thao tác/thiết lập/trạng thái chung, kiểm tra thư mục, vòng đời khởi động tài khoản, phân luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi đi và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ kiểm thử trường hợp lỗi phân giải mục tiêu dùng chung cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng cho gói Plugin, đăng ký, artifact công khai, import trực tiếp, API runtime và tác dụng phụ khi import |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng cho runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực media, chính sách replay, âm thanh trực tiếp STT thời gian thực, tìm kiếm/tìm nạp web và stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest tùy chọn cho các bài kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, tải lại module, đường dẫn Plugin đóng gói, terminal-text, chia đoạn, auth-token và typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock Node builtin tập trung để dùng bên trong các factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Các đường dẫn con về bộ nhớ">
    | Đường dẫn con | Các phần xuất chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đóng gói cho helper trình quản lý/cấu hình/tệp/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Các phần xuất engine nền tảng host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding host bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và helper batch/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Các phần xuất engine QMD host bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Các phần xuất engine lưu trữ host bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức host bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn host bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Helper nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-core` | Bí danh trung lập nhà cung cấp cho helper runtime lõi host bộ nhớ |
    | `plugin-sdk/memory-host-events` | Bí danh trung lập nhà cung cấp cho helper nhật ký sự kiện host bộ nhớ |
    | `plugin-sdk/memory-host-files` | Bí danh trung lập nhà cung cấp cho helper tệp/runtime host bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime active memory để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Bí danh trung lập nhà cung cấp cho helper trạng thái host bộ nhớ |
  </Accordion>

  <Accordion title="Các đường dẫn con helper đóng gói dành riêng">
    Hiện không có đường dẫn con SDK helper đóng gói dành riêng nào. Các helper
    dành riêng cho chủ sở hữu nằm trong gói Plugin sở hữu chúng, còn các hợp đồng host có thể tái sử dụng
    dùng các đường dẫn con SDK chung như `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
