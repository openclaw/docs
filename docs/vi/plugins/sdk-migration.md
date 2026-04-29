---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã sử dụng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một Plugin lên kiến trúc Plugin hiện đại
    - Bạn bảo trì một Plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Chuyển đổi SDK Plugin
x-i18n:
    generated_at: "2026-04-29T23:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang kiến trúc Plugin hiện đại
với các import tập trung, có tài liệu. Nếu Plugin của bạn được xây dựng trước
kiến trúc mới, hướng dẫn này giúp bạn di chuyển.

## Những gì đang thay đổi

Hệ thống Plugin cũ cung cấp hai bề mặt rất rộng mở, cho phép Plugin import
bất kỳ thứ gì chúng cần từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** — một import duy nhất re-export hàng chục
  helper. Nó được giới thiệu để giữ cho các Plugin cũ dựa trên hook tiếp tục
  hoạt động trong khi kiến trúc Plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** — một barrel helper runtime rộng,
  trộn lẫn sự kiện hệ thống, trạng thái heartbeat, hàng đợi phân phối, helper
  fetch/proxy, helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** — một barrel tương thích cấu hình rộng
  vẫn còn mang các helper tải/ghi trực tiếp đã lỗi thời trong thời gian di chuyển.
- **`openclaw/extension-api`** — một cầu nối cho Plugin quyền truy cập trực tiếp
  vào các helper phía host như trình chạy tác tử nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** — một hook extension đóng gói
  chỉ dành cho Pi đã bị loại bỏ, có thể quan sát các sự kiện embedded-runner như
  `tool_result`.

Các bề mặt import rộng hiện đã **bị ngừng khuyến nghị**. Chúng vẫn hoạt động ở
runtime, nhưng Plugin mới không được sử dụng chúng, và các Plugin hiện có nên
di chuyển trước khi bản phát hành major tiếp theo loại bỏ chúng. API đăng ký
embedded extension factory chỉ dành cho Pi đã bị loại bỏ; hãy dùng middleware
tool-result thay thế.

OpenClaw không loại bỏ hoặc diễn giải lại hành vi Plugin đã được ghi tài liệu
trong cùng thay đổi giới thiệu phần thay thế. Các thay đổi phá vỡ hợp đồng trước
tiên phải đi qua adapter tương thích, chẩn đoán, tài liệu và thời gian ngừng
khuyến nghị. Điều đó áp dụng cho import SDK, trường manifest, API thiết lập,
hook và hành vi đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong một bản phát hành major trong tương
  lai. Các Plugin vẫn import từ những bề mặt này sẽ bị hỏng khi điều đó xảy ra.
  Các đăng ký embedded extension factory chỉ dành cho Pi hiện đã không còn được tải.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** — import một helper sẽ tải hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** — các re-export rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** — không có cách nào biết export nào ổn định và export nào là nội bộ

SDK Plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`)
là một mô-đun nhỏ, tự chứa, có mục đích rõ ràng và hợp đồng được ghi tài liệu.

Các seam tiện ích provider kế thừa cho các kênh đóng gói cũng đã bị loại bỏ.
Các seam helper mang thương hiệu kênh là lối tắt riêng trong mono-repo, không
phải hợp đồng Plugin ổn định. Hãy dùng các subpath SDK generic hẹp thay thế.
Bên trong workspace Plugin đóng gói, giữ các helper do provider sở hữu trong
`api.ts` hoặc `runtime-api.ts` riêng của Plugin đó.

Các ví dụ provider đóng gói hiện tại:

- Anthropic giữ các helper stream dành riêng cho Claude trong seam `api.ts` /
  `contract-api.ts` của riêng nó
- OpenAI giữ các builder provider, helper model mặc định và builder provider
  realtime trong `api.ts` của riêng nó
- OpenRouter giữ builder provider và helper onboarding/cấu hình trong `api.ts`
  của riêng nó

## Chính sách tương thích

Đối với Plugin bên ngoài, công việc tương thích đi theo thứ tự này:

1. thêm hợp đồng mới
2. giữ hành vi cũ được nối qua adapter tương thích
3. phát chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
4. bao phủ cả hai đường dẫn trong kiểm thử
5. ghi tài liệu về việc ngừng khuyến nghị và đường dẫn di chuyển
6. chỉ loại bỏ sau thời gian di chuyển đã công bố, thường là trong một bản phát hành major

Maintainer có thể kiểm tra hàng đợi di chuyển hiện tại bằng
`pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để
xem số đếm gọn, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
`pnpm plugins:boundary-report:ci` khi một cổng CI cần thất bại trên các bản ghi
tương thích đến hạn, import SDK dành riêng xuyên chủ sở hữu, hoặc subpath SDK
dành riêng không dùng đến. Báo cáo nhóm các bản ghi tương thích đã ngừng khuyến
nghị theo ngày loại bỏ, đếm tham chiếu code/tài liệu cục bộ, hiển thị import SDK
dành riêng xuyên chủ sở hữu, và tóm tắt cầu nối SDK memory-host riêng để việc
dọn dẹp tương thích luôn rõ ràng thay vì dựa vào các tìm kiếm ad hoc. Các
subpath SDK dành riêng phải có cách dùng của chủ sở hữu được theo dõi; các
export helper dành riêng không dùng đến nên được loại bỏ khỏi SDK công khai.

Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng
nó cho đến khi tài liệu và chẩn đoán nói khác. Code mới nên ưu tiên phần thay thế
được ghi tài liệu, nhưng các Plugin hiện có không nên bị hỏng trong các bản phát
hành minor thông thường.

## Cách di chuyển

<Steps>
  <Step title="Di chuyển các helper tải/ghi cấu hình runtime">
    Các Plugin đóng gói nên dừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được truyền
    vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần snapshot tiến
    trình hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ tác
    tử tồn tại lâu nên dùng `ctx.getRuntimeConfig()` của ngữ cảnh công cụ bên
    trong `execute` để một công cụ được tạo trước một lần ghi cấu hình vẫn thấy
    cấu hình runtime đã được làm mới.

    Việc ghi cấu hình phải đi qua các helper giao dịch và chọn một chính sách
    sau ghi:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi caller biết thay
    đổi cần một lần khởi động lại Gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi caller sở hữu bước
    tiếp theo và cố ý muốn tắt reload planner. Kết quả mutation bao gồm một tóm
    tắt `followUp` có kiểu cho kiểm thử và logging; Gateway vẫn chịu trách nhiệm
    áp dụng hoặc lên lịch khởi động lại. `loadConfig` và `writeConfigFile` vẫn
    là các helper tương thích đã ngừng khuyến nghị cho Plugin bên ngoài trong
    thời gian di chuyển và cảnh báo một lần với mã tương thích
    `runtime-config-load-write`. Các Plugin đóng gói và code runtime trong repo
    được bảo vệ bằng guardrail scanner trong
    `pnpm check:deprecated-internal-config-api` và
    `pnpm check:no-runtime-action-load-config`: cách dùng Plugin production mới
    sẽ thất bại ngay, ghi cấu hình trực tiếp thất bại, các phương thức server
    Gateway phải dùng snapshot runtime của yêu cầu, các helper runtime gửi/hành
    động/client của kênh phải nhận cấu hình từ ranh giới của chúng, và các mô-đun
    runtime tồn tại lâu có đúng không lần gọi `loadConfig()` ambient nào được phép.

    Code Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng subpath SDK hẹp khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertion cấu hình đã tải và tra cứu cấu hình plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Các Plugin đóng gói và kiểm thử của chúng được scanner bảo vệ khỏi barrel
    rộng để import và mock luôn cục bộ với hành vi chúng cần. Barrel rộng vẫn tồn
    tại để tương thích bên ngoài, nhưng code mới không nên phụ thuộc vào nó.

  </Step>

  <Step title="Di chuyển extension tool-result của Pi sang middleware">
    Các Plugin đóng gói phải thay handler tool-result
    `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho Pi bằng middleware
    trung lập với runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Đồng thời cập nhật manifest Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin bên ngoài không thể đăng ký middleware tool-result vì nó có thể ghi
    lại đầu ra công cụ có độ tin cậy cao trước khi model thấy nó.

  </Step>

  <Step title="Di chuyển handler native approval sang capability fact">
    Các Plugin kênh có khả năng phê duyệt hiện hiển thị hành vi phê duyệt native
    thông qua `approvalCapability.nativeRuntime` cùng registry runtime-context
    dùng chung.

    Các thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery dành riêng cho phê duyệt khỏi wiring `plugin.auth` /
      `plugin.approvals` kế thừa và đưa vào `approvalCapability`
    - `ChannelPlugin.approvals` đã bị loại khỏi hợp đồng channel-plugin công
      khai; chuyển các trường delivery/native/render vào `approvalCapability`
    - `plugin.auth` chỉ còn dành cho các luồng đăng nhập/đăng xuất kênh; các
      hook auth phê duyệt ở đó không còn được core đọc
    - Đăng ký các đối tượng runtime do kênh sở hữu như client, token hoặc ứng
      dụng Bolt thông qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo định tuyến lại do Plugin sở hữu từ handler phê duyệt
      native; core hiện sở hữu thông báo đã định tuyến nơi khác từ kết quả phân
      phối thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, hãy cung cấp
      bề mặt `createPluginRuntime().channel` thật. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục approval capability hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi fallback wrapper Windows">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper
    `.cmd`/`.bat` Windows chưa phân giải hiện sẽ thất bại đóng trừ khi bạn truyền
    rõ ràng `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Nếu caller của bạn không cố ý dựa vào shell fallback, đừng đặt
    `allowShellFallback` và hãy xử lý lỗi được ném ra thay thế.

  </Step>

  <Step title="Tìm các import đã ngừng khuyến nghị">
    Tìm trong Plugin của bạn các import từ một trong hai bề mặt đã ngừng khuyến nghị:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Thay bằng các import tập trung">
    Mỗi export từ bề mặt cũ ánh xạ tới một đường dẫn import hiện đại cụ thể:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Đối với các helper phía host, dùng runtime Plugin được inject thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Mẫu tương tự áp dụng cho các helper cầu nối cũ khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper kho lưu trữ phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay thế các import infra-runtime phạm vi rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích bên ngoài,
    nhưng mã mới nên import bề mặt helper tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper sự kiện Heartbeat và khả năng hiển thị | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi phân phối đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Đo từ xa hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ nhớ đệm khử trùng lặp trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper đường dẫn tệp/phương tiện cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy và fetch được bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Kiểu yêu cầu/phân giải phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload phản hồi phê duyệt và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời tác vụ bất đồng bộ có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các plugin đóng gói được scanner bảo vệ khỏi `infra-runtime`, nên mã trong repo
    không thể thoái lui về barrel phạm vi rộng.

  </Step>

  <Step title="Di chuyển các helper định tuyến kênh">
    Mã định tuyến kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ vẫn tồn tại dưới dạng bí danh
    tương thích trong khoảng thời gian di chuyển, nhưng plugin mới nên dùng các
    tên route mô tả trực tiếp hành vi:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các helper định tuyến hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    nhất quán trên phê duyệt gốc, chặn phản hồi, khử trùng lặp đầu vào,
    phân phối cron và định tuyến phiên. Nếu plugin của bạn sở hữu ngữ pháp target
    tùy chỉnh, hãy dùng `resolveChannelRouteTargetWithParser(...)` để điều chỉnh
    parser đó vào cùng hợp đồng target định tuyến.

  </Step>

  <Step title="Build và kiểm thử">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Tham chiếu đường dẫn import

  <Accordion title="Common import path table">
  | Đường dẫn import | Mục đích | Export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Trình hỗ trợ điểm vào plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export bao quát kế thừa cho định nghĩa/trình dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export schema cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình hỗ trợ điểm vào một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và trình dựng điểm vào kênh tập trung | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trình hỗ trợ wizard thiết lập dùng chung | Prompt danh sách cho phép, trình dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trình hỗ trợ runtime trong lúc thiết lập | Adapter vá thiết lập an toàn khi import, trình hỗ trợ ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Trình hỗ trợ adapter thiết lập | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Trình hỗ trợ công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trình hỗ trợ đa tài khoản | Trình hỗ trợ danh sách tài khoản/cấu hình/cổng hành động |
  | `plugin-sdk/account-id` | Trình hỗ trợ account-id | `DEFAULT_ACCOUNT_ID`, chuẩn hóa account-id |
  | `plugin-sdk/account-resolution` | Trình hỗ trợ tra cứu tài khoản | Trình hỗ trợ tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trình hỗ trợ tài khoản phạm vi hẹp | Trình hỗ trợ danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Adapter wizard thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Nối dây tiền tố trả lời, trạng thái đang nhập và gửi nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter cấu hình và trình hỗ trợ truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình dựng schema cấu hình | Chỉ các primitive schema cấu hình kênh dùng chung và trình dựng chung |
  | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình đi kèm | Chỉ các plugin đi kèm do OpenClaw duy trì; plugin mới phải định nghĩa schema cục bộ của plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schema cấu hình đi kèm đã ngừng dùng | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các plugin đi kèm được duy trì |
  | `plugin-sdk/telegram-command-config` | Trình hỗ trợ cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Trình hỗ trợ trạng thái tài khoản và vòng đời luồng bản nháp | `createAccountStatusSink`, trình hỗ trợ hoàn tất bản xem trước nháp |
  | `plugin-sdk/inbound-envelope` | Trình hỗ trợ phong bì gửi đến | Trình hỗ trợ tuyến dùng chung + trình dựng phong bì |
  | `plugin-sdk/inbound-reply-dispatch` | Trình hỗ trợ trả lời gửi đến | Trình hỗ trợ ghi nhận và điều phối dùng chung |
  | `plugin-sdk/messaging-targets` | Phân tích đích nhắn tin | Trình hỗ trợ phân tích/so khớp đích |
  | `plugin-sdk/outbound-media` | Trình hỗ trợ media gửi đi | Tải media gửi đi dùng chung |
  | `plugin-sdk/outbound-send-deps` | Trình hỗ trợ phụ thuộc gửi đi | Tra cứu `resolveOutboundSendDep` gọn nhẹ mà không import toàn bộ outbound runtime |
  | `plugin-sdk/outbound-runtime` | Trình hỗ trợ outbound runtime | Trình hỗ trợ gửi đi, ủy quyền định danh/gửi, phiên, định dạng và lập kế hoạch payload |
  | `plugin-sdk/thread-bindings-runtime` | Trình hỗ trợ ràng buộc luồng | Trình hỗ trợ vòng đời ràng buộc luồng và adapter |
  | `plugin-sdk/agent-media-payload` | Trình hỗ trợ payload media kế thừa | Trình dựng payload media của agent cho bố cục trường kế thừa |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng dùng | Chỉ tiện ích channel runtime kế thừa |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Bộ lưu trữ plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trình hỗ trợ runtime bao quát | Trình hỗ trợ runtime/ghi log/sao lưu/cài đặt plugin |
  | `plugin-sdk/runtime-env` | Trình hỗ trợ env runtime phạm vi hẹp | Logger/env runtime, timeout, retry và backoff |
  | `plugin-sdk/plugin-runtime` | Trình hỗ trợ plugin runtime dùng chung | Trình hỗ trợ lệnh/hook/http/tương tác của plugin |
  | `plugin-sdk/hook-runtime` | Trình hỗ trợ pipeline hook | Trình hỗ trợ pipeline webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trình hỗ trợ lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trình hỗ trợ tiến trình | Trình hỗ trợ exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trình hỗ trợ CLI runtime | Định dạng lệnh, chờ, trình hỗ trợ phiên bản |
  | `plugin-sdk/gateway-runtime` | Trình hỗ trợ Gateway | Client Gateway, trình hỗ trợ khởi động sẵn sàng event-loop và trình hỗ trợ vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng dùng | Ưu tiên `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trình hỗ trợ lệnh Telegram | Trình hỗ trợ xác thực lệnh Telegram ổn định khi dự phòng khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Trình hỗ trợ prompt phê duyệt | Payload phê duyệt exec/plugin, trình hỗ trợ khả năng/hồ sơ phê duyệt, trình hỗ trợ định tuyến/runtime phê duyệt native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trình hỗ trợ auth phê duyệt | Phân giải người phê duyệt, auth hành động cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Trình hỗ trợ client phê duyệt | Trình hỗ trợ hồ sơ/bộ lọc phê duyệt exec native |
  | `plugin-sdk/approval-delivery-runtime` | Trình hỗ trợ gửi phê duyệt | Adapter khả năng/gửi phê duyệt native |
  | `plugin-sdk/approval-gateway-runtime` | Trình hỗ trợ gateway phê duyệt | Trình hỗ trợ phân giải gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trình hỗ trợ adapter phê duyệt | Trình hỗ trợ tải adapter phê duyệt native gọn nhẹ cho điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Trình hỗ trợ handler phê duyệt | Trình hỗ trợ runtime handler phê duyệt rộng hơn; ưu tiên seam adapter/gateway hẹp hơn khi chúng đã đủ |
  | `plugin-sdk/approval-native-runtime` | Trình hỗ trợ đích phê duyệt | Trình hỗ trợ ràng buộc đích/tài khoản phê duyệt native |
  | `plugin-sdk/approval-reply-runtime` | Trình hỗ trợ trả lời phê duyệt | Trình hỗ trợ payload trả lời phê duyệt exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Trình hỗ trợ runtime-context của kênh | Trình hỗ trợ đăng ký/lấy/theo dõi runtime-context kênh chung |
  | `plugin-sdk/security-runtime` | Trình hỗ trợ bảo mật | Trình hỗ trợ dùng chung cho tin cậy, cổng DM, nội dung bên ngoài và thu thập bí mật |
  | `plugin-sdk/ssrf-policy` | Trình hỗ trợ chính sách SSRF | Trình hỗ trợ danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trình hỗ trợ SSRF runtime | Pinned-dispatcher, guarded fetch, trình hỗ trợ chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trình hỗ trợ sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trình hỗ trợ Heartbeat | Trình hỗ trợ sự kiện Heartbeat và khả năng hiển thị |
  | `plugin-sdk/delivery-queue-runtime` | Trình hỗ trợ hàng đợi gửi | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trình hỗ trợ hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trình hỗ trợ chống trùng lặp | Cache chống trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Trình hỗ trợ truy cập tệp | Trình hỗ trợ đường dẫn tệp/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trình hỗ trợ sẵn sàng transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Trình hỗ trợ cache giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trình hỗ trợ cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trình hỗ trợ định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình hỗ trợ đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trình hỗ trợ fetch/proxy được bọc | `resolveFetch`, trình hỗ trợ proxy, trình hỗ trợ tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trình hỗ trợ chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trình hỗ trợ retry | `RetryConfig`, `retryAsync`, trình chạy chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Ánh xạ đầu vào danh sách cho phép | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Cổng lệnh và trình hỗ trợ bề mặt lệnh | `resolveControlCommandGate`, trình hỗ trợ ủy quyền người gửi, trình hỗ trợ registry lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Trình kết xuất trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Trình hỗ trợ đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Trình hỗ trợ yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Trình hỗ trợ guard body Webhook | Trình hỗ trợ đọc/giới hạn body yêu cầu |
  | `plugin-sdk/reply-runtime` | Reply runtime dùng chung | Điều phối gửi đến, heartbeat, trình lập kế hoạch trả lời, chia nhỏ |
  | `plugin-sdk/reply-dispatch-runtime` | Trình hỗ trợ điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối provider và trình hỗ trợ nhãn cuộc trò chuyện |
  | `plugin-sdk/reply-history` | Trình hỗ trợ lịch sử trả lời | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trình hỗ trợ chia khúc trả lời | Trình hỗ trợ chia khúc văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Trình hỗ trợ kho phiên | Trình hỗ trợ đường dẫn kho + updated-at |
  | `plugin-sdk/state-paths` | Trình hỗ trợ đường dẫn trạng thái | Trình hỗ trợ thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình hỗ trợ định tuyến/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình hỗ trợ chuẩn hóa session-key |
  | `plugin-sdk/status-helpers` | Trình hỗ trợ trạng thái kênh | Trình dựng tóm tắt trạng thái kênh/tài khoản, mặc định trạng thái runtime, trình hỗ trợ metadata vấn đề |
  | `plugin-sdk/target-resolver-runtime` | Trình hỗ trợ bộ phân giải đích | Trình hỗ trợ bộ phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình hỗ trợ chuẩn hóa chuỗi | Trình hỗ trợ chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình hỗ trợ URL yêu cầu | Trích xuất URL chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình hỗ trợ lệnh có thời hạn | Trình chạy lệnh có thời hạn với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Trình đọc tham số | Trình đọc tham số công cụ/CLI phổ biến |
  | `plugin-sdk/tool-payload` | Trích xuất payload của công cụ | Trích xuất payload đã chuẩn hóa từ các đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất gửi công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi log | Trình trợ giúp logger hệ thống con và biên tập che giấu |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình trợ giúp phát hiện/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm | Cùng trình trợ giúp phát hiện/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực thời gian chạy của nhà cung cấp | Trình trợ giúp phân giải khóa API thời gian chạy |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập khóa API của nhà cung cấp | Trình trợ giúp onboarding/ghi hồ sơ khóa API |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth tiêu chuẩn |
  | `plugin-sdk/provider-auth-login` | Trình trợ giúp đăng nhập tương tác của nhà cung cấp | Trình trợ giúp đăng nhập tương tác dùng chung |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa mã định danh mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp danh mục nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình trợ giúp cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP của nhà cung cấp | Trình trợ giúp năng lực HTTP/endpoint chung cho nhà cung cấp, bao gồm trình trợ giúp biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình web-search của nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực web-search hẹp cho các nhà cung cấp không cần dây nối bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng web-search của nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp web-search của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema của nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán và trình trợ giúp tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp wrapper luồng của nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và trình trợ giúp wrapper dùng chung Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport của nhà cung cấp | Trình trợ giúp transport nhà cung cấp gốc như fetch có bảo vệ, biến đổi thông điệp transport và luồng sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi async có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp media dùng chung | Trình trợ giúp fetch/biến đổi/lưu trữ media, dò kích thước video dựa trên ffprobe và bộ dựng payload media |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo media dùng chung | Trình trợ giúp failover dùng chung, chọn ứng viên và thông báo thiếu mô hình cho tạo hình ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trợ giúp hình ảnh/âm thanh hướng nhà cung cấp |
  | `plugin-sdk/text-runtime` | Trình trợ giúp văn bản dùng chung | Tước văn bản hiển thị với assistant, trình trợ giúp render/chia đoạn/bảng Markdown, trình trợ giúp biên tập che giấu, trình trợ giúp thẻ chỉ thị, tiện ích văn bản an toàn và các trình trợ giúp văn bản/ghi log liên quan |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản gửi đi |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng các trình trợ giúp chỉ thị, registry, xác thực hướng nhà cung cấp và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải và trình trợ giúp phiên cầu nối |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo hình ảnh | Kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL dữ liệu/tài sản hình ảnh và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo hình ảnh dùng chung | Kiểu tạo hình ảnh, failover, xác thực và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/rút gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Nguyên tố cấu hình kênh | Nguyên tố schema cấu hình kênh hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Prelude kênh dùng chung | Export prelude Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình danh sách cho phép | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
  | `plugin-sdk/group-access` | Trình trợ giúp quyền truy cập nhóm | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm` | Trình trợ giúp DM trực tiếp | Trình trợ giúp xác thực/bảo vệ DM trực tiếp dùng chung |
  | `plugin-sdk/extension-shared` | Trình trợ giúp extension dùng chung | Nguyên tố trình trợ giúp proxy ambient và trạng thái/kênh thụ động |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Registry đích Webhook và trình trợ giúp cài đặt route |
  | `plugin-sdk/webhook-path` | Trình trợ giúp đường dẫn Webhook | Trình trợ giúp chuẩn hóa đường dẫn Webhook |
  | `plugin-sdk/web-media` | Trình trợ giúp media web dùng chung | Trình trợ giúp tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Tái xuất Zod | `zod` được tái xuất cho người dùng plugin SDK |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core được đóng gói | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy engine bộ nhớ | Facade thời gian chạy lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine nền tảng host bộ nhớ | Export engine nền tảng host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host bộ nhớ | Hợp đồng embedding bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa chung; các nhà cung cấp từ xa cụ thể nằm trong các Plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host bộ nhớ | Export engine QMD host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine lưu trữ host bộ nhớ | Export engine lưu trữ host bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức host bộ nhớ | Trình trợ giúp đa phương thức host bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn host bộ nhớ | Trình trợ giúp truy vấn host bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật host bộ nhớ | Trình trợ giúp bí mật host bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Trình trợ giúp nhật ký sự kiện host bộ nhớ | Trình trợ giúp nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái host bộ nhớ | Trình trợ giúp trạng thái host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Thời gian chạy CLI host bộ nhớ | Trình trợ giúp thời gian chạy CLI host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Thời gian chạy lõi host bộ nhớ | Trình trợ giúp thời gian chạy lõi host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy host bộ nhớ | Trình trợ giúp tệp/thời gian chạy host bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh thời gian chạy lõi host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp thời gian chạy lõi host bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/thời gian chạy host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp tệp/thời gian chạy host bộ nhớ |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp Markdown được quản lý | Trình trợ giúp Markdown được quản lý dùng chung cho các Plugin liền kề bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade thời gian chạy trình quản lý tìm kiếm active-memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp trạng thái host bộ nhớ |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích rộng cũ; ưu tiên các subpath kiểm thử có trọng tâm như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý chỉ là tập hợp con di chuyển chung, không phải toàn bộ bề mặt SDK. Danh sách đầy đủ hơn 200 điểm vào nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

Các seam trợ giúp dành riêng cho Plugin tích hợp đã được loại khỏi bản đồ export SDK công khai, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng, chẳng hạn như shim `plugin-sdk/discord` đã ngừng khuyến nghị nhưng vẫn được giữ cho gói đã phát hành `@openclaw/discord@2026.3.13`. Các helper dành riêng cho chủ sở hữu nằm bên trong gói Plugin sở hữu chúng; hành vi host dùng chung nên đi qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.

Hãy dùng import hẹp nhất phù hợp với công việc. Nếu bạn không tìm thấy một export, hãy kiểm tra mã nguồn tại `src/plugin-sdk/` hoặc hỏi maintainer hợp đồng chung nào nên sở hữu nó.

## Các API đang bị ngừng khuyến nghị

Các mục ngừng khuyến nghị hẹp hơn áp dụng trên plugin SDK, hợp đồng provider, bề mặt runtime và manifest. Mỗi mục hiện vẫn hoạt động nhưng sẽ bị gỡ bỏ trong một bản phát hành major trong tương lai. Mục bên dưới mỗi phần ánh xạ API cũ sang phần thay thế chuẩn của nó.

<AccordionGroup>
  <Accordion title="helper xây dựng trợ giúp command-auth → command-status">
    **Cũ (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Mới (`openclaw/plugin-sdk/command-status`)**: cùng chữ ký, cùng
    export — chỉ được import từ subpath hẹp hơn. `command-auth`
    re-export chúng dưới dạng stub tương thích.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helper cổng chặn nhắc đến → resolveInboundMentionDecision">
    **Cũ**: `resolveInboundMentionRequirement({ facts, policy })` và
    `shouldDropInboundForMention(...)` từ
    `openclaw/plugin-sdk/channel-inbound` hoặc
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Mới**: `resolveInboundMentionDecision({ facts, policy })` — trả về một
    đối tượng quyết định duy nhất thay vì hai lời gọi tách riêng.

    Các Plugin kênh phía dưới (Slack, Discord, Matrix, MS Teams) đã chuyển đổi.

  </Accordion>

  <Accordion title="shim runtime kênh và helper thao tác kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Không import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng khuyến nghị cùng với các export kênh "actions" thô. Thay vào đó, hãy
    bộc lộ năng lực thông qua bề mặt `presentation` có ngữ nghĩa — các Plugin
    kênh khai báo những gì chúng hiển thị (thẻ, nút, danh sách chọn) thay vì
    tên action thô mà chúng chấp nhận.

  </Accordion>

  <Accordion title="helper tool() của provider tìm kiếm web → createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper công cụ.

  </Accordion>

  <Accordion title="envelope kênh plaintext → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để xây dựng envelope prompt
    plaintext phẳng từ các tin nhắn kênh inbound.

    **Mới**: `BodyForAgent` cùng với các khối ngữ cảnh người dùng có cấu trúc.
    Các Plugin kênh gắn metadata định tuyến (luồng, chủ đề, trả lời đến,
    phản ứng) dưới dạng trường có kiểu thay vì nối chúng vào một chuỗi prompt.
    Helper `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope tổng hợp
    hướng đến assistant, nhưng các envelope plaintext inbound đang dần bị loại bỏ.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received` và mọi Plugin
    kênh tùy chỉnh đã hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="kiểu khám phá provider → kiểu danh mục provider">
    Bốn bí danh kiểu khám phá hiện là wrapper mỏng trên các kiểu thời kỳ
    danh mục:

    | Bí danh cũ               | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cùng với túi tĩnh `ProviderCapabilities` cũ — các Plugin provider nên dùng
    hook provider rõ ràng như `buildReplayPolicy`, `normalizeToolSchemas` và
    `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="hook chính sách suy nghĩ → resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn và danh sách
    cấp độ được xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu cũ theo
    thứ hạng hồ sơ.

    Hãy triển khai một hook thay vì ba. Các hook cũ vẫn hoạt động trong giai
    đoạn ngừng khuyến nghị nhưng không được kết hợp với kết quả hồ sơ.

  </Accordion>

  <Accordion title="fallback provider OAuth bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai `resolveExternalOAuthProfiles(...)` mà không khai báo
    provider trong manifest Plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest Plugin
    **và** triển khai `resolveExternalAuthProfiles(...)`. Đường dẫn "auth
    fallback" cũ phát cảnh báo ở runtime và sẽ bị gỡ bỏ.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="tra cứu biến môi trường provider → setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng tra cứu biến môi trường đó vào `setup.providers[].envVars`
    trên manifest. Điều này hợp nhất metadata môi trường thiết lập/trạng thái vào
    một nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu biến
    môi trường.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua adapter tương thích cho đến
    khi giai đoạn ngừng khuyến nghị kết thúc.

  </Accordion>

  <Accordion title="đăng ký Plugin bộ nhớ → registerMemoryCapability">
    **Cũ**: ba lời gọi riêng biệt —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lời gọi trên API trạng thái bộ nhớ —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các slot, một lời gọi đăng ký duy nhất. Các helper bộ nhớ bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) không bị ảnh hưởng.

  </Accordion>

  <Accordion title="đổi tên kiểu tin nhắn phiên subagent">
    Hai bí danh kiểu cũ vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng khuyến nghị để chuyển sang
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp sang
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime đột biến TaskFlow được
    quản lý cho các Plugin tạo, cập nhật, hủy hoặc chạy tác vụ con từ một flow.
    Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory tiện ích mở rộng nhúng → middleware kết quả công cụ agent">
    Được đề cập trong "Cách di chuyển → Di chuyển tiện ích mở rộng kết quả công cụ
    Pi sang middleware" ở trên. Đưa vào đây cho đầy đủ: đường dẫn chỉ dành cho Pi
    `api.registerEmbeddedExtensionFactory(...)` đã bị gỡ bỏ được thay thế bằng
    `api.registerAgentToolResultMiddleware(...)` với danh sách runtime rõ ràng
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="bí danh OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` hiện là một
    bí danh một dòng cho `OpenClawConfig`. Hãy ưu tiên tên chuẩn.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các mục ngừng khuyến nghị ở cấp tiện ích mở rộng (bên trong các Plugin
kênh/provider tích hợp dưới `extensions/`) được theo dõi trong các barrel
`api.ts` và `runtime-api.ts` riêng của chúng. Chúng không ảnh hưởng đến hợp đồng
Plugin bên thứ ba và không được liệt kê ở đây. Nếu bạn dùng trực tiếp barrel cục
bộ của một Plugin tích hợp, hãy đọc các chú thích ngừng khuyến nghị trong barrel
đó trước khi nâng cấp.
</Note>

## Lịch trình gỡ bỏ

| Khi                    | Điều xảy ra                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Hiện tại**           | Các bề mặt bị ngừng khuyến nghị phát cảnh báo runtime                   |
| **Bản phát hành major tiếp theo** | Các bề mặt bị ngừng khuyến nghị sẽ bị gỡ bỏ; Plugin vẫn dùng chúng sẽ lỗi |

Tất cả Plugin lõi đã được di chuyển. Các Plugin bên ngoài nên di chuyển trước
bản phát hành major tiếp theo.

## Tạm thời tắt các cảnh báo

Đặt các biến môi trường này trong khi bạn thực hiện di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là một lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) — xây dựng Plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu import subpath đầy đủ
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — xây dựng Plugin kênh
- [Plugin provider](/vi/plugins/sdk-provider-plugins) — xây dựng Plugin provider
- [Nội bộ Plugin](/vi/plugins/architecture) — đi sâu vào kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) — tham chiếu schema manifest
