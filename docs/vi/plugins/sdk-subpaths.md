---
read_when:
    - Chọn đúng đường dẫn con plugin-sdk cho lệnh import của Plugin
    - Rà soát các đường dẫn con của Plugin đóng gói kèm và các giao diện helper
summary: 'Danh mục đường dẫn con của Plugin SDK: các import nằm ở đâu, được nhóm theo khu vực'
title: Các đường dẫn con của Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:25:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK được cung cấp dưới dạng một tập hợp các subpath hẹp trong `openclaw/plugin-sdk/`.
Trang này liệt kê các subpath thường dùng, được nhóm theo mục đích. Danh sách đầy đủ
được tạo gồm hơn 200 subpath nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
các subpath trợ giúp dành riêng cho bundled-plugin cũng xuất hiện ở đó nhưng là chi tiết
triển khai trừ khi một trang tài liệu quảng bá rõ ràng. Maintainer có thể kiểm tra các
subpath trợ giúp dành riêng đang hoạt động bằng `pnpm plugins:boundary-report:summary`;
các helper export dành riêng không dùng đến sẽ làm báo cáo CI thất bại thay vì tiếp tục
tồn tại trong SDK công khai như món nợ tương thích không hoạt động.

Để xem hướng dẫn viết plugin, xem [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào Plugin

| Subpath                                   | Export chính                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Barrel tương thích rộng cho các kiểm thử plugin kế thừa; ưu tiên các subpath kiểm thử tập trung cho kiểm thử extension mới                                                   |
| `plugin-sdk/plugin-test-api`              | Bộ dựng mock `OpenClawPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký plugin trực tiếp                                                                                       |
| `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng bộ chuyển đổi agent-runtime gốc cho hồ sơ xác thực, chặn gửi, phân loại dự phòng, hook công cụ, lớp phủ prompt, schema và sửa chữa transcript |
| `plugin-sdk/channel-test-helpers`         | Helper kiểm thử vòng đời tài khoản kênh, thư mục, cấu hình gửi, mock runtime, hook, điểm vào kênh đi kèm, dấu thời gian envelope, trả lời ghép đôi và hợp đồng kênh chung   |
| `plugin-sdk/channel-target-testing`       | Bộ kiểm thử trường hợp lỗi phân giải đích kênh dùng chung                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Helper hợp đồng cho đăng ký plugin, package manifest, artifact công khai, API runtime, tác dụng phụ khi import và import trực tiếp                                                  |
| `plugin-sdk/plugin-test-runtime`          | Fixture runtime plugin, registry, đăng ký provider, setup-wizard và runtime task-flow cho kiểm thử                                                                      |
| `plugin-sdk/provider-test-contracts`      | Helper hợp đồng cho runtime provider, xác thực, khám phá, onboard, catalog, năng lực media, chính sách replay, âm thanh trực tiếp STT thời gian thực, web-search/fetch và wizard                 |
| `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/xác thực Vitest opt-in cho các kiểm thử provider thực thi `plugin-sdk/provider-http`                                                                                    |
| `plugin-sdk/test-env`                     | Fixture môi trường kiểm thử, fetch/mạng, máy chủ HTTP dùng một lần, yêu cầu đến, kiểm thử live, hệ thống tệp tạm thời và điều khiển thời gian                                        |
| `plugin-sdk/test-fixtures`                | Fixture kiểm thử chung cho CLI, sandbox, skill, thông điệp agent, sự kiện hệ thống, nạp lại module, đường dẫn bundled plugin, terminal, chia chunk, auth-token và typed-case                   |
| `plugin-sdk/test-node-mocks`              | Helper mock tập trung cho Node builtin để dùng bên trong các factory Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | Helper mục provider di trú như `createMigrationItem`, hằng lý do, marker trạng thái mục, helper biên tập và `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | Helper di trú runtime như `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` và `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Đường dẫn con của kênh">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export schema Zod gốc của `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Các helper dùng chung cho trình hướng dẫn thiết lập, prompt danh sách cho phép, bộ tạo trạng thái thiết lập |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Các helper cấu hình nhiều tài khoản/cổng hành động, helper dự phòng tài khoản mặc định |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, các helper chuẩn hóa account-id |
    | `plugin-sdk/account-resolution` | Các helper tra cứu tài khoản + dự phòng mặc định |
    | `plugin-sdk/account-helpers` | Các helper hẹp cho danh sách tài khoản/hành động tài khoản |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Các helper pipeline phản hồi cũ. Mã pipeline phản hồi kênh mới nên dùng `createChannelMessageReplyPipeline` và `resolveChannelMessageSourceReplyDeliveryMode` từ `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Các primitive schema cấu hình kênh dùng chung cùng với các builder Zod và JSON/TypeBox trực tiếp |
    | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình kênh OpenClaw đi kèm chỉ dành cho các plugin đi kèm được duy trì |
    | `plugin-sdk/channel-config-schema-legacy` | Alias tương thích đã ngừng khuyến nghị cho schema cấu hình kênh đi kèm |
    | `plugin-sdk/telegram-command-config` | Các helper chuẩn hóa/xác thực lệnh tùy chỉnh Telegram với dự phòng hợp đồng đi kèm |
    | `plugin-sdk/command-gating` | Các helper hẹp cho cổng ủy quyền lệnh |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, và các helper vòng đời luồng bản nháp cũ. Mã hoàn tất bản xem trước mới nên dùng `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Các helper hợp đồng vòng đời tin nhắn nhẹ như `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, facade tương thích, suy dẫn năng lực durable-final, helper chứng minh năng lực cho năng lực gửi/biên nhận/tác dụng phụ, `MessageReceiveContext`, chứng minh chính sách ack khi nhận, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, chứng minh năng lực live-preview và live-finalizer, trạng thái khôi phục bền vững, `RenderedMessageBatch`, kiểu biên nhận tin nhắn, và helper id biên nhận. Xem [API tin nhắn kênh](/vi/plugins/sdk-channel-message). `createChannelTurnReplyPipeline` cũ chỉ còn dành cho bộ điều phối tương thích. |
    | `plugin-sdk/channel-message-runtime` | Các helper phân phối runtime có thể tải phân phối outbound, bao gồm `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase`, và `recordChannelMessageReplyDispatch`. Dùng từ các mô-đun runtime giám sát/gửi, không dùng trong các tệp khởi động nóng của plugin. |
    | `plugin-sdk/inbound-envelope` | Các helper dùng chung cho route inbound + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Các helper inbound dùng chung cũ để ghi nhận và điều phối, predicate điều phối hiển thị/cuối cùng, và tương thích `deliverDurableInboundReplyPayload` đã ngừng khuyến nghị cho các bộ điều phối kênh đã chuẩn bị. Mã nhận/điều phối kênh mới nên import helper vòng đời runtime từ `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Các helper phân tích/khớp mục tiêu |
    | `plugin-sdk/outbound-media` | Các helper tải media outbound dùng chung |
    | `plugin-sdk/outbound-send-deps` | Tra cứu phụ thuộc gửi outbound gọn nhẹ cho adapter kênh |
    | `plugin-sdk/outbound-runtime` | Các helper phân phối outbound, định danh, đại diện gửi, phiên, định dạng và lập kế hoạch payload |
    | `plugin-sdk/poll-runtime` | Các helper hẹp cho chuẩn hóa poll |
    | `plugin-sdk/thread-bindings-runtime` | Các helper adapter và vòng đời liên kết luồng |
    | `plugin-sdk/agent-media-payload` | Builder payload media agent cũ |
    | `plugin-sdk/conversation-runtime` | Các helper hội thoại/liên kết luồng, ghép cặp và liên kết đã cấu hình |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot cấu hình runtime |
    | `plugin-sdk/runtime-group-policy` | Các helper phân giải chính sách nhóm runtime |
    | `plugin-sdk/channel-status` | Các helper snapshot/tóm tắt trạng thái kênh dùng chung |
    | `plugin-sdk/channel-config-primitives` | Các primitive hẹp cho schema cấu hình kênh |
    | `plugin-sdk/channel-config-writes` | Các helper ủy quyền ghi cấu hình kênh |
    | `plugin-sdk/channel-plugin-common` | Các export prelude plugin kênh dùng chung |
    | `plugin-sdk/allowlist-config-edit` | Các helper chỉnh sửa/đọc cấu hình danh sách cho phép |
    | `plugin-sdk/group-access` | Các helper quyết định quyền truy cập nhóm dùng chung |
    | `plugin-sdk/direct-dm` | Các helper xác thực/bảo vệ direct-DM dùng chung |
    | `plugin-sdk/discord` | Facade tương thích Discord đã ngừng khuyến nghị cho `@openclaw/discord@2026.3.13` đã phát hành và tương thích chủ sở hữu được theo dõi; plugin mới nên dùng các đường dẫn con SDK kênh chung |
    | `plugin-sdk/telegram-account` | Facade tương thích phân giải tài khoản Telegram đã ngừng khuyến nghị cho tương thích chủ sở hữu được theo dõi; plugin mới nên dùng helper runtime được inject hoặc các đường dẫn con SDK kênh chung |
    | `plugin-sdk/zalouser` | Facade tương thích Zalo Personal đã ngừng khuyến nghị cho các gói Lark/Zalo đã phát hành vẫn import ủy quyền lệnh người gửi; plugin mới nên dùng `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Trình bày, phân phối tin nhắn theo ngữ nghĩa và các helper phản hồi tương tác cũ. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel tương thích cho debounce inbound, khớp mention, helper chính sách mention và helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Các helper hẹp cho debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Các helper hẹp cho chính sách mention, marker mention và văn bản mention mà không có bề mặt runtime inbound rộng hơn |
    | `plugin-sdk/channel-envelope` | Các helper hẹp cho định dạng envelope inbound |
    | `plugin-sdk/channel-location` | Ngữ cảnh vị trí kênh và các helper định dạng |
    | `plugin-sdk/channel-logging` | Các helper ghi log kênh cho inbound bị loại và lỗi typing/ack |
    | `plugin-sdk/channel-send-result` | Các kiểu kết quả phản hồi |
    | `plugin-sdk/channel-actions` | Các helper hành động tin nhắn kênh, cùng với helper schema native đã ngừng khuyến nghị được giữ lại để tương thích plugin |
    | `plugin-sdk/channel-route` | Các helper dùng chung cho chuẩn hóa route, phân giải mục tiêu dựa trên parser, chuyển thread-id thành chuỗi, khóa route dedupe/compact, kiểu parsed-target và so sánh route/mục tiêu |
    | `plugin-sdk/channel-targets` | Các helper phân tích mục tiêu; caller so sánh route nên dùng `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Các kiểu hợp đồng kênh |
    | `plugin-sdk/channel-feedback` | Kết nối feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Các helper hẹp cho hợp đồng secret như `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, và các kiểu mục tiêu secret |
  </Accordion>

  <Accordion title="Các đường dẫn con của nhà cung cấp">
    | Đường dẫn con | Các xuất chính |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade nhà cung cấp LM Studio được hỗ trợ cho thiết lập, khám phá danh mục và chuẩn bị mô hình lúc chạy |
    | `plugin-sdk/lmstudio-runtime` | Facade lúc chạy LM Studio được hỗ trợ cho mặc định máy chủ cục bộ, khám phá mô hình, tiêu đề yêu cầu và các trình trợ giúp mô hình đã tải |
    | `plugin-sdk/provider-setup` | Các trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ đã tuyển chọn |
    | `plugin-sdk/self-hosted-provider-setup` | Các trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm |
    | `plugin-sdk/cli-backend` | Mặc định hậu phương CLI + hằng số watchdog |
    | `plugin-sdk/provider-auth-runtime` | Các trình trợ giúp phân giải khóa API lúc chạy cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-auth-api-key` | Các trình trợ giúp tiếp nhận/ghi hồ sơ khóa API như `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Trình dựng kết quả xác thực OAuth chuẩn |
    | `plugin-sdk/provider-auth-login` | Các trình trợ giúp đăng nhập tương tác dùng chung cho Plugin nhà cung cấp |
    | `plugin-sdk/provider-env-vars` | Các trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, xuất tương thích `resolveOpenClawAgentDir` đã lỗi thời |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các trình dựng chính sách phát lại dùng chung, trình trợ giúp điểm cuối nhà cung cấp và trình trợ giúp chuẩn hóa mã định danh mô hình như `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Móc lúc chạy bổ sung danh mục nhà cung cấp và các đường nối sổ đăng ký Plugin-nhà cung cấp cho kiểm thử hợp đồng |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Các trình trợ giúp năng lực HTTP/điểm cuối nhà cung cấp chung, lỗi HTTP nhà cung cấp và trình trợ giúp biểu mẫu nhiều phần phiên âm âm thanh |
    | `plugin-sdk/provider-web-fetch-contract` | Các trình trợ giúp hợp đồng cấu hình/lựa chọn tìm nạp web phạm vi hẹp như `enablePluginInConfig` và `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Các trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp tìm nạp web |
    | `plugin-sdk/provider-web-search-config-contract` | Các trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp cho nhà cung cấp không cần dây nối bật Plugin |
    | `plugin-sdk/provider-web-search-contract` | Các trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, và các bộ đặt/lấy thông tin xác thực có phạm vi |
    | `plugin-sdk/provider-web-search` | Các trình trợ giúp đăng ký/bộ nhớ đệm/lúc chạy nhà cung cấp tìm kiếm web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp lược đồ Gemini + chẩn đoán, và các trình trợ giúp tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` và tương tự |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu trình bao bọc luồng, và các trình trợ giúp trình bao bọc Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
    | `plugin-sdk/provider-transport-runtime` | Các trình trợ giúp truyền tải nhà cung cấp nguyên sinh như tìm nạp có bảo vệ, biến đổi thông điệp truyền tải và luồng sự kiện truyền tải có thể ghi |
    | `plugin-sdk/provider-onboard` | Các trình trợ giúp vá cấu hình tiếp nhận |
    | `plugin-sdk/global-singleton` | Các trình trợ giúp singleton/bản đồ/bộ nhớ đệm cục bộ theo tiến trình |
    | `plugin-sdk/group-activation` | Các trình trợ giúp phân tích cú pháp lệnh và chế độ kích hoạt nhóm phạm vi hẹp |
  </Accordion>

  <Accordion title="Các đường dẫn con xác thực và bảo mật">
    | Đường dẫn con | Các xuất chính |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, các trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động, trình trợ giúp ủy quyền người gửi |
    | `plugin-sdk/command-status` | Các trình dựng thông điệp lệnh/trợ giúp như `buildCommandsMessagePaginated` và `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Các trình trợ giúp phân giải người phê duyệt và xác thực hành động cùng cuộc trò chuyện |
    | `plugin-sdk/approval-client-runtime` | Các trình trợ giúp hồ sơ/bộ lọc phê duyệt thực thi nguyên sinh |
    | `plugin-sdk/approval-delivery-runtime` | Các bộ điều hợp năng lực/phân phối phê duyệt nguyên sinh |
    | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Các trình trợ giúp tải bộ điều hợp phê duyệt nguyên sinh gọn nhẹ cho điểm vào kênh nóng |
    | `plugin-sdk/approval-handler-runtime` | Các trình trợ giúp lúc chạy bộ xử lý phê duyệt rộng hơn; ưu tiên các đường nối bộ điều hợp/Gateway hẹp hơn khi chúng đủ dùng |
    | `plugin-sdk/approval-native-runtime` | Các trình trợ giúp mục tiêu phê duyệt nguyên sinh + liên kết tài khoản |
    | `plugin-sdk/approval-reply-runtime` | Các trình trợ giúp tải trọng phản hồi phê duyệt thực thi/Plugin |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp tải trọng phê duyệt thực thi/Plugin, trình trợ giúp định tuyến/lúc chạy phê duyệt nguyên sinh, và trình trợ giúp hiển thị phê duyệt có cấu trúc như `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Các trình trợ giúp đặt lại loại bỏ trùng lặp phản hồi đến phạm vi hẹp |
    | `plugin-sdk/channel-contract-testing` | Các trình trợ giúp kiểm thử hợp đồng kênh phạm vi hẹp mà không có barrel kiểm thử rộng |
    | `plugin-sdk/command-auth-native` | Xác thực lệnh nguyên sinh, định dạng menu đối số động và trình trợ giúp mục tiêu phiên nguyên sinh |
    | `plugin-sdk/command-detection` | Các trình trợ giúp phát hiện lệnh dùng chung |
    | `plugin-sdk/command-primitives-runtime` | Các vị từ văn bản lệnh gọn nhẹ cho đường dẫn kênh nóng |
    | `plugin-sdk/command-surface` | Các trình trợ giúp chuẩn hóa thân lệnh và bề mặt lệnh |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Các trình trợ giúp thu thập hợp đồng bí mật phạm vi hẹp cho bề mặt bí mật kênh/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Các trình trợ giúp `coerceSecretRef` phạm vi hẹp và định kiểu SecretRef cho phân tích cú pháp hợp đồng/cấu hình bí mật |
    | `plugin-sdk/security-runtime` | Các trình trợ giúp tin cậy dùng chung, chặn DM, tệp/đường dẫn giới hạn trong gốc bao gồm ghi chỉ tạo mới, thay thế tệp nguyên tử đồng bộ/bất đồng bộ, ghi tạm thời cùng thư mục, dự phòng di chuyển khác thiết bị, trình trợ giúp kho tệp riêng tư, bộ bảo vệ thư mục cha liên kết tượng trưng, nội dung bên ngoài, che văn bản nhạy cảm, so sánh bí mật thời gian hằng định và trình trợ giúp thu thập bí mật |
    | `plugin-sdk/ssrf-policy` | Các trình trợ giúp danh sách cho phép máy chủ và chính sách SSRF mạng riêng |
    | `plugin-sdk/ssrf-dispatcher` | Các trình trợ giúp bộ điều phối ghim phạm vi hẹp không có bề mặt lúc chạy hạ tầng rộng |
    | `plugin-sdk/ssrf-runtime` | Bộ điều phối ghim, tìm nạp được bảo vệ SSRF, lỗi SSRF và trình trợ giúp chính sách SSRF |
    | `plugin-sdk/secret-input` | Các trình trợ giúp phân tích cú pháp đầu vào bí mật |
    | `plugin-sdk/webhook-ingress` | Các trình trợ giúp yêu cầu/đích Webhook và ép kiểu websocket/thân thô |
    | `plugin-sdk/webhook-request-guards` | Các trình trợ giúp kích thước/thời gian chờ thân yêu cầu |
  </Accordion>

  <Accordion title="Các đường dẫn con thời gian chạy và lưu trữ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/runtime` | Các trình trợ giúp rộng cho thời gian chạy/ghi nhật ký/sao lưu/cài đặt plugin |
    | `plugin-sdk/runtime-env` | Các trình trợ giúp hẹp cho môi trường thời gian chạy, logger, timeout, thử lại và backoff |
    | `plugin-sdk/browser-config` | Facade cấu hình trình duyệt được hỗ trợ cho hồ sơ/mặc định đã chuẩn hóa, phân tích cú pháp URL CDP và các trình trợ giúp xác thực điều khiển trình duyệt |
    | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp đăng ký và tra cứu ngữ cảnh thời gian chạy kênh chung |
    | `plugin-sdk/matrix` | Facade tương thích Matrix đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên nhập trực tiếp `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade tương thích Mattermost đã ngừng khuyến nghị cho các gói kênh bên thứ ba cũ hơn; plugin mới nên nhập trực tiếp các đường dẫn con SDK chung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Các trình trợ giúp lệnh/hook/http/tương tác dùng chung cho plugin |
    | `plugin-sdk/hook-runtime` | Các trình trợ giúp đường ống Webhook/hook nội bộ dùng chung |
    | `plugin-sdk/lazy-runtime` | Các trình trợ giúp nhập/liên kết thời gian chạy lười như `createLazyRuntimeModule`, `createLazyRuntimeMethod` và `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Các trình trợ giúp thực thi tiến trình |
    | `plugin-sdk/cli-runtime` | Các trình trợ giúp định dạng CLI, chờ, phiên bản, gọi bằng đối số và nhóm lệnh lười |
    | `plugin-sdk/gateway-runtime` | Máy khách Gateway, trình trợ giúp khởi động máy khách sẵn sàng vòng lặp sự kiện, RPC CLI gateway, lỗi giao thức gateway và các trình trợ giúp vá trạng thái kênh |
    | `plugin-sdk/config-types` | Bề mặt cấu hình chỉ gồm kiểu cho các hình dạng cấu hình plugin như `OpenClawConfig` và các kiểu cấu hình kênh/nhà cung cấp |
    | `plugin-sdk/plugin-config-runtime` | Các trình trợ giúp tra cứu cấu hình plugin thời gian chạy như `requireRuntimeConfig`, `resolvePluginConfigObject` và `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Các trình trợ giúp thay đổi cấu hình theo giao dịch như `mutateConfigFile`, `replaceConfigFile` và `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Các trình trợ giúp snapshot cấu hình tiến trình hiện tại như `getRuntimeConfig`, `getRuntimeConfigSnapshot` và bộ đặt snapshot kiểm thử |
    | `plugin-sdk/telegram-command-config` | Chuẩn hóa tên/mô tả lệnh Telegram và kiểm tra trùng lặp/xung đột, ngay cả khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
    | `plugin-sdk/text-autolink-runtime` | Phát hiện tự động liên kết tham chiếu tệp mà không cần barrel text-runtime rộng |
    | `plugin-sdk/approval-runtime` | Các trình trợ giúp phê duyệt exec/plugin, bộ dựng khả năng phê duyệt, trình trợ giúp xác thực/hồ sơ, trình trợ giúp định tuyến/thời gian chạy gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
    | `plugin-sdk/reply-runtime` | Các trình trợ giúp thời gian chạy inbound/trả lời dùng chung, chia khúc, điều phối, Heartbeat, bộ lập kế hoạch trả lời |
    | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp hẹp cho điều phối/hoàn tất trả lời và nhãn cuộc trò chuyện |
    | `plugin-sdk/reply-history` | Các trình trợ giúp và marker lịch sử trả lời cửa sổ ngắn dùng chung như `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Các trình trợ giúp chia khúc văn bản/markdown hẹp |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp đường dẫn kho phiên, khóa phiên, cập nhật lúc và thay đổi kho |
    | `plugin-sdk/cron-store-runtime` | Các trình trợ giúp đường dẫn/tải/lưu kho Cron |
    | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn thư mục trạng thái/OAuth |
    | `plugin-sdk/routing` | Các trình trợ giúp định tuyến/khóa phiên/liên kết tài khoản như `resolveAgentRoute`, `buildAgentSessionKey` và `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Các trình trợ giúp tóm tắt trạng thái kênh/tài khoản dùng chung, mặc định trạng thái thời gian chạy và trình trợ giúp siêu dữ liệu sự cố |
    | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp bộ phân giải mục tiêu dùng chung |
    | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa slug/chuỗi |
    | `plugin-sdk/request-url` | Trích xuất URL chuỗi từ các đầu vào giống fetch/request |
    | `plugin-sdk/run-command` | Trình chạy lệnh có định thời với kết quả stdout/stderr đã chuẩn hóa |
    | `plugin-sdk/param-readers` | Các trình đọc tham số công cụ/CLI chung |
    | `plugin-sdk/tool-payload` | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
    | `plugin-sdk/tool-send` | Trích xuất các trường mục tiêu gửi chuẩn từ đối số công cụ |
    | `plugin-sdk/temp-path` | Các trình trợ giúp đường dẫn tải xuống tạm dùng chung và không gian làm việc tạm bảo mật riêng tư |
    | `plugin-sdk/logging-core` | Logger hệ thống con và trình trợ giúp biên tập lại |
    | `plugin-sdk/markdown-table-runtime` | Các trình trợ giúp chế độ bảng Markdown và chuyển đổi |
    | `plugin-sdk/model-session-runtime` | Các trình trợ giúp ghi đè mô hình/phiên như `applyModelOverrideToSessionEntry` và `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Các trình trợ giúp phân giải cấu hình nhà cung cấp Talk |
    | `plugin-sdk/json-store` | Các trình trợ giúp nhỏ để đọc/ghi trạng thái JSON |
    | `plugin-sdk/file-lock` | Các trình trợ giúp khóa tệp có thể vào lại |
    | `plugin-sdk/persistent-dedupe` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp dựa trên đĩa |
    | `plugin-sdk/acp-runtime` | Các trình trợ giúp thời gian chạy/phiên ACP và điều phối trả lời |
    | `plugin-sdk/acp-runtime-backend` | Các trình trợ giúp đăng ký backend ACP nhẹ và điều phối trả lời cho plugin được tải khi khởi động |
    | `plugin-sdk/acp-binding-resolve-runtime` | Phân giải liên kết ACP chỉ đọc mà không cần nhập khởi động vòng đời |
    | `plugin-sdk/agent-config-primitives` | Các primitive schema cấu hình thời gian chạy agent hẹp |
    | `plugin-sdk/boolean-param` | Trình đọc tham số boolean lỏng |
    | `plugin-sdk/dangerous-name-runtime` | Các trình trợ giúp phân giải khớp tên nguy hiểm |
    | `plugin-sdk/device-bootstrap` | Các trình trợ giúp bootstrap thiết bị và token ghép nối |
    | `plugin-sdk/extension-shared` | Các primitive trình trợ giúp dùng chung cho kênh thụ động, trạng thái và proxy môi trường |
    | `plugin-sdk/models-provider-runtime` | Các trình trợ giúp trả lời lệnh/nhà cung cấp `/models` |
    | `plugin-sdk/skill-commands-runtime` | Các trình trợ giúp liệt kê lệnh Skills |
    | `plugin-sdk/native-command-registry` | Các trình trợ giúp registry/dựng/tuần tự hóa lệnh gốc |
    | `plugin-sdk/agent-harness` | Bề mặt plugin đáng tin cậy thử nghiệm cho các harness agent cấp thấp: kiểu harness, trình trợ giúp điều hướng/hủy lượt chạy đang hoạt động, trình trợ giúp cầu nối công cụ OpenClaw, trình trợ giúp chính sách công cụ kế hoạch thời gian chạy, phân loại kết quả terminal, trình trợ giúp định dạng/chi tiết tiến trình công cụ và tiện ích kết quả lần thử |
    | `plugin-sdk/provider-zai-endpoint` | Các trình trợ giúp phát hiện endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Trình trợ giúp khóa async cục bộ theo tiến trình cho các tệp trạng thái thời gian chạy nhỏ |
    | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp đo lường từ xa hoạt động kênh |
    | `plugin-sdk/concurrency-runtime` | Trình trợ giúp giới hạn đồng thời tác vụ async |
    | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp bộ nhớ đệm khử trùng lặp trong bộ nhớ |
    | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp rút hàng đợi giao hàng đang chờ gửi đi |
    | `plugin-sdk/file-access-runtime` | Các trình trợ giúp đường dẫn tệp cục bộ và nguồn phương tiện an toàn |
    | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp sự kiện Heartbeat và hiển thị |
    | `plugin-sdk/number-runtime` | Trình trợ giúp ép kiểu số |
    | `plugin-sdk/secure-random-runtime` | Các trình trợ giúp token/UUID bảo mật |
    | `plugin-sdk/system-event-runtime` | Các trình trợ giúp hàng đợi sự kiện hệ thống |
    | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp chờ trạng thái sẵn sàng của transport |
    | `plugin-sdk/infra-runtime` | Shim tương thích đã ngừng khuyến nghị; dùng các đường dẫn con thời gian chạy tập trung ở trên |
    | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm giới hạn nhỏ |
    | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp cờ chẩn đoán, sự kiện và ngữ cảnh trace |
    | `plugin-sdk/error-runtime` | Đồ thị lỗi, định dạng, trình trợ giúp phân loại lỗi dùng chung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch được bọc, proxy, tùy chọn EnvHttpProxyAgent và trình trợ giúp tra cứu được ghim |
    | `plugin-sdk/runtime-fetch` | Fetch thời gian chạy nhận biết dispatcher mà không cần nhập proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Trình đọc body phản hồi giới hạn mà không cần bề mặt thời gian chạy phương tiện rộng |
    | `plugin-sdk/session-binding-runtime` | Trạng thái liên kết cuộc trò chuyện hiện tại mà không cần định tuyến liên kết đã cấu hình hoặc kho ghép nối |
    | `plugin-sdk/session-store-runtime` | Các trình trợ giúp kho phiên mà không cần nhập ghi/bảo trì cấu hình rộng |
    | `plugin-sdk/context-visibility-runtime` | Phân giải mức hiển thị ngữ cảnh và lọc ngữ cảnh bổ sung mà không cần nhập cấu hình/bảo mật rộng |
    | `plugin-sdk/string-coerce-runtime` | Các trình trợ giúp hẹp để ép kiểu và chuẩn hóa bản ghi primitive/chuỗi mà không cần nhập markdown/ghi nhật ký |
    | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa tên máy chủ và máy chủ SCP |
    | `plugin-sdk/retry-runtime` | Các trình trợ giúp cấu hình thử lại và trình chạy thử lại |
    | `plugin-sdk/agent-runtime` | Các trình trợ giúp thư mục/danh tính/không gian làm việc agent, bao gồm `resolveAgentDir`, `resolveDefaultAgentDir` và export tương thích `resolveOpenClawAgentDir` đã ngừng khuyến nghị |
    | `plugin-sdk/directory-runtime` | Truy vấn/khử trùng lặp thư mục dựa trên cấu hình |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Đường dẫn con cho năng lực và kiểm thử">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Các helper dùng chung để tìm nạp/chuyển đổi/lưu trữ media, thăm dò kích thước video dựa trên ffprobe, và các trình tạo payload media |
    | `plugin-sdk/media-store` | Các helper lưu trữ media hẹp như `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Các helper chuyển đổi dự phòng dùng chung cho tạo media, chọn ứng viên, và thông báo thiếu mô hình |
    | `plugin-sdk/media-understanding` | Các kiểu nhà cung cấp hiểu media cùng các export helper hình ảnh/âm thanh dành cho nhà cung cấp |
    | `plugin-sdk/text-runtime` | Các helper văn bản/markdown/ghi log dùng chung như loại bỏ văn bản hiển thị với assistant, helper render/chia đoạn/bảng markdown, helper biên tập che giấu, helper thẻ chỉ thị, và tiện ích văn bản an toàn |
    | `plugin-sdk/text-chunking` | Helper chia đoạn văn bản gửi đi |
    | `plugin-sdk/speech` | Các kiểu nhà cung cấp speech cùng các export helper chỉ thị, registry, xác thực, trình tạo TTS tương thích OpenAI, và speech dành cho nhà cung cấp |
    | `plugin-sdk/speech-core` | Các kiểu nhà cung cấp speech dùng chung, registry, chỉ thị, chuẩn hóa, và các export helper speech |
    | `plugin-sdk/realtime-transcription` | Các kiểu nhà cung cấp phiên âm thời gian thực, helper registry, và helper phiên WebSocket dùng chung |
    | `plugin-sdk/realtime-voice` | Các kiểu nhà cung cấp giọng nói thời gian thực và helper registry |
    | `plugin-sdk/image-generation` | Các kiểu nhà cung cấp tạo hình ảnh cùng helper asset hình ảnh/data URL và trình tạo nhà cung cấp hình ảnh tương thích OpenAI |
    | `plugin-sdk/image-generation-core` | Các kiểu tạo hình ảnh dùng chung, chuyển đổi dự phòng, xác thực, và helper registry |
    | `plugin-sdk/music-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
    | `plugin-sdk/music-generation-core` | Các kiểu tạo nhạc dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp model-ref |
    | `plugin-sdk/video-generation` | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
    | `plugin-sdk/video-generation-core` | Các kiểu tạo video dùng chung, helper chuyển đổi dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp model-ref |
    | `plugin-sdk/webhook-targets` | Registry đích Webhook và helper cài đặt route |
    | `plugin-sdk/webhook-path` | Helper chuẩn hóa đường dẫn Webhook |
    | `plugin-sdk/web-media` | Helper tải media từ xa/cục bộ dùng chung |
    | `plugin-sdk/zod` | `zod` được re-export cho người dùng SDK Plugin |
    | `plugin-sdk/testing` | Barrel tương thích rộng cho kiểm thử Plugin cũ. Các kiểm thử tiện ích mở rộng mới nên import các đường dẫn con SDK tập trung như `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay vào đó |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` tối thiểu cho kiểm thử đơn vị đăng ký Plugin trực tiếp mà không import cầu nối helper kiểm thử của repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture hợp đồng adapter agent-runtime gốc cho kiểm thử xác thực, phân phối, dự phòng, tool-hook, prompt-overlay, schema, và chiếu transcript |
    | `plugin-sdk/channel-test-helpers` | Helper kiểm thử hướng kênh cho hợp đồng hành động/thiết lập/trạng thái chung, xác nhận thư mục, vòng đời khởi động tài khoản, luồng send-config, mock runtime, vấn đề trạng thái, phân phối gửi đi, và đăng ký hook |
    | `plugin-sdk/channel-target-testing` | Bộ trường hợp lỗi phân giải đích dùng chung cho kiểm thử kênh |
    | `plugin-sdk/plugin-test-contracts` | Helper hợp đồng gói Plugin, đăng ký, artifact công khai, import trực tiếp, API runtime, và tác dụng phụ khi import |
    | `plugin-sdk/provider-test-contracts` | Helper hợp đồng runtime nhà cung cấp, xác thực, khám phá, onboard, catalog, wizard, năng lực media, chính sách replay, realtime STT live-audio, web-search/fetch, và stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/xác thực Vitest tùy chọn cho kiểm thử nhà cung cấp thực thi `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture chung cho ghi lại runtime CLI, ngữ cảnh sandbox, trình ghi skill, agent-message, system-event, nạp lại module, đường dẫn Plugin đi kèm, terminal-text, chia đoạn, auth-token, và typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock Node builtin tập trung để dùng bên trong factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Đường dẫn con bộ nhớ">
    | Đường dẫn con | Các export chính |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bề mặt helper memory-core đi kèm cho helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime chỉ mục/tìm kiếm bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export engine nền tảng máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Hợp đồng embedding máy chủ bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ, và helper batch/từ xa chung |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export engine QMD máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-engine-storage` | Export engine lưu trữ máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-multimodal` | Helper đa phương thức máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-query` | Helper truy vấn máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-secret` | Helper bí mật máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-events` | Helper nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-status` | Helper trạng thái máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-core` | Alias trung lập với nhà cung cấp cho helper runtime lõi máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-events` | Alias trung lập với nhà cung cấp cho helper nhật ký sự kiện máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-files` | Alias trung lập với nhà cung cấp cho helper tệp/runtime máy chủ bộ nhớ |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown dùng chung cho các Plugin liền kề bộ nhớ |
    | `plugin-sdk/memory-host-search` | Facade runtime bộ nhớ chủ động để truy cập search-manager |
    | `plugin-sdk/memory-host-status` | Alias trung lập với nhà cung cấp cho helper trạng thái máy chủ bộ nhớ |
  </Accordion>

  <Accordion title="Đường dẫn con helper đi kèm được dành riêng">
    Hiện không có đường dẫn con SDK helper đi kèm nào được dành riêng. Các
    helper dành riêng cho chủ sở hữu nằm trong gói Plugin sở hữu, trong khi
    các hợp đồng host có thể tái sử dụng dùng đường dẫn con SDK chung như
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
