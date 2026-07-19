---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã sử dụng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một plugin sang kiến trúc plugin hiện đại
    - Bạn duy trì một plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Di chuyển SDK Plugin
x-i18n:
    generated_at: "2026-07-19T05:54:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50cd42eb7512d223d7693a9dbc99db27392bf2797e409d096bbcf11c59c1fd2b
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã thay thế một lớp tương thích ngược rộng bằng kiến trúc plugin hiện đại
được xây dựng từ các import nhỏ, tập trung. Nếu plugin của bạn có trước
thay đổi đó, hướng dẫn này sẽ giúp plugin chuyển sang các hợp đồng hiện tại.

## Những thay đổi

Trước đây, hai bề mặt import mở rộng cho phép plugin truy cập gần như mọi thứ từ
một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - tái xuất hàng chục helper để duy trì
  hoạt động của các plugin dựa trên hook cũ trong khi kiến trúc mới được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel rộng kết hợp các sự kiện
  hệ thống, trạng thái Heartbeat, hàng đợi phân phối, helper fetch/proxy, helper tệp,
  kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel cấu hình rộng vẫn
  chứa các helper tải/ghi trực tiếp đã bị phản đối trong giai đoạn chuyển đổi.
- **`openclaw/extension-api`** - một cầu nối cho phép plugin truy cập trực tiếp vào
  các helper phía máy chủ như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook chỉ dành cho trình chạy nhúng
  đã bị loại bỏ, dùng để theo dõi các sự kiện của trình chạy nhúng như `tool_result`. Thay vào đó, hãy dùng
  middleware kết quả công cụ của agent (xem [Chuyển các phần mở rộng kết quả công cụ nhúng
  sang middleware](#how-to-migrate)).

Các bề mặt này đã **bị phản đối**: chúng vẫn hoạt động, nhưng plugin mới không được
sử dụng chúng, và các plugin hiện có nên chuyển đổi trước khi bản phát hành lớn tiếp theo
loại bỏ chúng. `registerEmbeddedExtensionFactory` đã bị loại bỏ;
các đăng ký cũ không còn được tải.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong một bản phát hành lớn trong tương lai.
  Các plugin vẫn import từ những bề mặt này sẽ ngừng hoạt động khi điều đó xảy ra.
</Warning>

OpenClaw không loại bỏ hoặc diễn giải lại hành vi plugin đã được ghi lại trong cùng
thay đổi giới thiệu phương án thay thế. Các thay đổi hợp đồng gây gián đoạn trước tiên phải trải qua
bộ điều hợp tương thích, chẩn đoán, tài liệu và một giai đoạn phản đối. Điều này
áp dụng cho các import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký thời gian chạy.

### Lý do

- **Khởi động chậm** - import một helper sẽ tải hàng chục mô-đun không liên quan.
- **Phụ thuộc vòng** - các tái xuất rộng khiến chu trình import dễ
  hình thành.
- **Bề mặt API không rõ ràng** - không có cách phân biệt các export ổn định với các export nội bộ.

Mỗi `openclaw/plugin-sdk/<subpath>` giờ đây là một mô-đun nhỏ, độc lập với
hợp đồng được ghi lại rõ ràng.

Các đường nối tiện ích cũ của nhà cung cấp dành cho các kênh đi kèm cũng đã bị loại bỏ -
các lối tắt helper mang thương hiệu kênh là tiện ích riêng của mono-repo, không phải
hợp đồng plugin ổn định. Thay vào đó, hãy dùng các đường dẫn con SDK chung, phạm vi hẹp. Bên trong
không gian làm việc plugin đi kèm, hãy giữ các helper thuộc sở hữu của nhà cung cấp trong
`api.ts` hoặc `runtime-api.ts` của chính plugin đó:

- Anthropic giữ các helper luồng dành riêng cho Claude trong đường nối `api.ts` /
  `contract-api.ts` của riêng mình.
- OpenAI giữ các trình dựng nhà cung cấp, helper mô hình mặc định và trình dựng nhà cung cấp
  thời gian thực trong `api.ts` của riêng mình.
- OpenRouter giữ trình dựng nhà cung cấp cùng các helper onboarding/cấu hình trong
  `api.ts` của riêng mình.

## Chính sách tương thích

Công việc tương thích plugin bên ngoài tuân theo thứ tự sau:

1. Thêm hợp đồng mới.
2. Duy trì hành vi cũ thông qua bộ điều hợp tương thích.
3. Phát chẩn đoán hoặc cảnh báo nêu rõ đường dẫn cũ và phương án thay thế.
4. Kiểm thử cả hai đường dẫn.
5. Ghi lại việc phản đối và lộ trình chuyển đổi.
6. Chỉ loại bỏ sau giai đoạn chuyển đổi đã công bố, thường là trong một bản
   phát hành lớn.

Nếu một trường manifest vẫn được chấp nhận, hãy tiếp tục sử dụng trường đó cho đến khi tài liệu và
chẩn đoán có chỉ dẫn khác. Mã mới nên ưu tiên phương án thay thế đã được ghi lại;
các plugin hiện có không được ngừng hoạt động trong các bản phát hành nhỏ thông thường.

Kiểm tra hàng đợi chuyển đổi hiện tại bằng `pnpm plugins:boundary-report`:

| Cờ                                                      | Tác dụng                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (hoặc `pnpm plugins:boundary-report:summary`) | Hiển thị số lượng rút gọn thay vì toàn bộ chi tiết.                            |
| `--json`                                                | Báo cáo có thể đọc bằng máy.                                                   |
| `--owner <id>`                                          | Lọc theo một plugin hoặc chủ sở hữu tương thích.                               |
| `--fail-on-cross-owner`                                 | Thoát với mã khác 0 khi có import SDK dành riêng vượt qua ranh giới chủ sở hữu. |
| `--fail-on-eligible-compat`                             | Thoát với mã khác 0 khi ngày `removeAfter` của một bản ghi tương thích đã bị phản đối đã qua. |
| `--fail-on-unclassified-unused-reserved`                | Thoát với mã khác 0 khi có shim SDK dành riêng không được sử dụng.             |

`pnpm plugins:boundary-report:ci` chạy với cả ba cờ gây lỗi. Mỗi
bản ghi tương thích có một ngày `removeAfter` rõ ràng (không phải câu mơ hồ "bản
phát hành lớn tiếp theo") - báo cáo nhóm các bản ghi đã bị phản đối theo ngày đó, đếm
các tham chiếu mã/tài liệu cục bộ, hiển thị các import SDK dành riêng vượt qua ranh giới chủ sở hữu và
tóm tắt cầu nối SDK máy chủ bộ nhớ riêng. Các đường dẫn con SDK dành riêng phải có
mức sử dụng của chủ sở hữu được theo dõi; các export dành riêng không được sử dụng nên bị loại khỏi
SDK công khai.

## Cách chuyển đổi

<Steps>
  <Step title="Chuyển đổi các helper tải/ghi cấu hình thời gian chạy">
    Các plugin đi kèm nên ngừng gọi trực tiếp `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được
    truyền vào đường dẫn lệnh gọi đang hoạt động. Các trình xử lý tồn tại lâu cần
    ảnh chụp nhanh tiến trình hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ
    agent tồn tại lâu nên đọc `ctx.getRuntimeConfig()` bên trong `execute` để một công cụ
    được tạo trước khi ghi cấu hình vẫn thấy cấu hình đã làm mới.

    Việc ghi cấu hình phải đi qua helper giao dịch với chính sách
    sau khi ghi rõ ràng:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi thay đổi cần
    khởi động lại Gateway sạch sẽ, và chỉ dùng `afterWrite: { mode: "none", reason: "..." }`
    khi bên gọi chịu trách nhiệm cho bước tiếp theo và chủ ý ngăn
    trình lập kế hoạch tải lại. Kết quả đột biến bao gồm bản tóm tắt `followUp` có kiểu cho
    kiểm thử và ghi nhật ký; Gateway vẫn chịu trách nhiệm áp dụng hoặc
    lên lịch khởi động lại.

    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích
    đã bị phản đối dành cho plugin bên ngoài và cảnh báo một lần bằng
    mã tương thích `runtime-config-load-write`. Các plugin đi kèm và mã
    thời gian chạy của repo được bảo vệ bởi `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: việc sử dụng mới trong plugin sản xuất
    sẽ thất bại hoàn toàn, ghi cấu hình trực tiếp sẽ thất bại, các phương thức máy chủ Gateway phải dùng
    ảnh chụp nhanh thời gian chạy của yêu cầu, các helper gửi/hành động/máy khách kênh thời gian chạy
    phải nhận cấu hình từ ranh giới của chúng, và các mô-đun thời gian chạy tồn tại lâu
    không cho phép bất kỳ lệnh gọi `loadConfig()` ngầm nào.

    Mã plugin mới nên tránh barrel rộng `openclaw/plugin-sdk/config-runtime`.
    Hãy dùng đường dẫn con phạm vi hẹp phù hợp với tác vụ:

    | Nhu cầu | Import |
    | --- | --- |
    | Các kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Xác nhận cấu hình đã tải, tra cứu cấu hình điểm vào plugin và hợp nhất cấu hình | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc ảnh chụp nhanh thời gian chạy hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho lưu trữ phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper thời gian chạy cho chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải đầu vào bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè mô hình/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Các plugin đi kèm và kiểm thử của chúng được trình quét bảo vệ khỏi barrel rộng
    để các import và mock chỉ nằm cục bộ trong hành vi cần thiết. Barrel
    vẫn tồn tại để tương thích với bên ngoài, nhưng mã mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Chuyển các phần mở rộng kết quả công cụ nhúng sang middleware">
    Các plugin đi kèm phải thay thế các trình xử lý kết quả công cụ
    `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho trình chạy nhúng bằng
    middleware trung lập với thời gian chạy:

    ```typescript
    // Các công cụ thời gian chạy OpenClaw và công cụ động của thời gian chạy Codex (kết quả có thể được
    // biến đổi). Kết quả công cụ Codex gốc cũng được chuyển tiếp để quan sát,
    // nhưng đầu ra đã biến đổi của chúng không bao giờ đến được mô hình: hợp đồng hook
    // PostToolUse của Codex không thể thay thế phản hồi công cụ gốc.
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Đồng thời cập nhật manifest plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Các plugin đã cài đặt cũng có thể đăng ký middleware kết quả công cụ khi được
    bật rõ ràng và mọi thời gian chạy được nhắm đến đều được khai báo trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài đặt
    nhưng chưa khai báo sẽ bị từ chối.

  </Step>

  <Step title="Chuyển các trình xử lý phê duyệt gốc sang dữ kiện khả năng">
    Các plugin kênh hỗ trợ phê duyệt cung cấp hành vi phê duyệt gốc thông qua
    `approvalCapability.nativeRuntime` cùng registry ngữ cảnh thời gian chạy
    dùng chung:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`.
    - Chuyển xác thực/phân phối dành riêng cho phê duyệt khỏi hệ thống kết nối cũ `plugin.auth` /
      `plugin.approvals` sang `approvalCapability`.
    - `ChannelPlugin.approvals` đã bị loại khỏi hợp đồng
      plugin kênh công khai; chuyển các trường phân phối/gốc/kết xuất sang
      `approvalCapability`.
    - `plugin.auth` chỉ còn dành cho luồng đăng nhập/đăng xuất kênh; lõi không
      còn đọc các hook xác thực phê duyệt tại đó.
    - Đăng ký các đối tượng thời gian chạy thuộc sở hữu của kênh (máy khách, token, ứng dụng Bolt)
      thông qua `openclaw/plugin-sdk/channel-runtime-context`.
    - Không gửi thông báo định tuyến lại thuộc sở hữu plugin từ các trình xử lý phê duyệt gốc;
      lõi sở hữu các thông báo đã định tuyến sang nơi khác dựa trên kết quả phân phối thực tế.
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, hãy cung cấp một
      bề mặt `createPluginRuntime().channel` thực sự - các stub một phần sẽ
      bị từ chối.

    Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins) để biết bố cục
    khả năng phê duyệt hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi dự phòng của wrapper Windows">
    Nếu plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` không phân giải được giờ đây sẽ đóng khi lỗi trừ khi bạn truyền rõ ràng
    `allowShellFallback: true`:

    ```typescript
    // Trước
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sau
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Chỉ đặt tùy chọn này cho các bên gọi tương thích đáng tin cậy chủ ý
      // chấp nhận phương án dự phòng qua shell.
      allowShellFallback: true,
    });
    ```

    Nếu bên gọi của bạn không chủ ý phụ thuộc vào phương án dự phòng qua shell, đừng đặt
    `allowShellFallback` và thay vào đó hãy xử lý lỗi được ném ra.

  </Step>

  <Step title="Tìm các import đã bị phản đối">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Thay thế bằng các import tập trung">
    Mỗi export từ bề mặt cũ ánh xạ tới một đường dẫn import hiện đại cụ thể:

    ```typescript
    // Trước đây (lớp tương thích ngược đã lỗi thời)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sau này (các import hiện đại, tập trung)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Đối với các helper phía máy chủ, hãy sử dụng runtime của plugin được chèn thay vì
    import trực tiếp:

    ```typescript
    // Trước đây (cầu nối extension-api đã lỗi thời)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Sau này (runtime được chèn)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Áp dụng cùng mẫu này cho các helper cầu nối cũ khác:

    | Import cũ | Thành phần tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | các helper kho lưu trữ phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay thế các import infra-runtime phạm vi rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để bảo đảm khả năng tương thích
    bên ngoài, nhưng mã mới nên import bề mặt tập trung mà mã đó thực sự
    cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Các helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Các helper đánh thức, sự kiện và khả năng hiển thị của Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi phân phối đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Dữ liệu đo từ xa về hoạt động của kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ nhớ đệm chống trùng lặp trong bộ nhớ và được hỗ trợ bởi lưu trữ bền vững | `openclaw/plugin-sdk/dedupe-runtime` |
    | Các helper an toàn cho đường dẫn tệp cục bộ/phương tiện | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết bộ điều phối | `openclaw/plugin-sdk/runtime-fetch` |
    | Các helper fetch qua proxy và có cơ chế bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Các kiểu chính sách bộ điều phối SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Các kiểu yêu cầu/giải quyết phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Các helper payload phản hồi phê duyệt và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Các helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của lớp truyền tải | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Các helper token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Khả năng xử lý đồng thời tác vụ bất đồng bộ có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Các xác nhận giá trị bắt buộc cho những bất biến có thể chứng minh | `openclaw/plugin-sdk/expect-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ trong tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các plugin đi kèm được trình quét bảo vệ khỏi `infra-runtime`, vì vậy mã trong repo
    không thể quay lại barrel phạm vi rộng.

  </Step>

  <Step title="Di chuyển các helper định tuyến kênh">
    Mã định tuyến kênh mới sử dụng `openclaw/plugin-sdk/channel-route`. Các tên
    khóa định tuyến cũ vẫn được giữ làm bí danh tương thích:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Các helper định tuyến hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    một cách nhất quán trên các luồng phê duyệt gốc, chặn phản hồi, chống trùng lặp đầu vào,
    phân phối cron và định tuyến phiên.

    Không thêm cách sử dụng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    `resolveChannelRouteTargetWithParser(...)` từ
    `plugin-sdk/channel-route` — các thành phần này đã lỗi thời và chỉ được giữ lại cho các
    plugin cũ. Các plugin kênh mới nên sử dụng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa ID đích
    và dự phòng khi không tìm thấy trong thư mục,
    `messaging.inferTargetChatType(...)` khi lõi cần xác định sớm loại đối tác,
    và `messaging.resolveOutboundSessionRoute(...)` cho danh tính
    phiên và luồng gốc của nhà cung cấp.

  </Step>

  <Step title="Xây dựng và kiểm thử">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Tham chiếu đường dẫn import

  <Accordion title="Common import path table">
  | Đường dẫn nhập | Mục đích | Các mục xuất chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Trình trợ giúp điểm vào Plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Tái xuất tổng hợp cũ cho các định nghĩa/trình dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Mục xuất lược đồ cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình trợ giúp điểm vào cho một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Các định nghĩa và trình dựng điểm vào kênh chuyên biệt | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | Các trình trợ giúp trình hướng dẫn thiết lập dùng chung | Trình dịch thiết lập, lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Các trình trợ giúp thời gian chạy trong lúc thiết lập | `createSetupTranslator`, bộ điều hợp bản vá thiết lập an toàn khi nhập, trình trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Bí danh bộ điều hợp thiết lập không còn được khuyến nghị | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Các trình trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Các trình trợ giúp đa tài khoản | Trình trợ giúp danh sách/cấu hình/cổng hành động tài khoản |
  | `plugin-sdk/account-id` | Các trình trợ giúp ID tài khoản | `DEFAULT_ACCOUNT_ID`, chuẩn hóa ID tài khoản |
  | `plugin-sdk/account-resolution` | Các trình trợ giúp tra cứu tài khoản | Trình trợ giúp tra cứu tài khoản + phương án dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Các trình trợ giúp tài khoản phạm vi hẹp | Trình trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ điều hợp trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Các thành phần cơ bản để ghép đôi DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Đấu nối tiền tố trả lời, trạng thái đang nhập và phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Các hàm tạo bộ điều hợp cấu hình và trình trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình dựng lược đồ cấu hình | Chỉ gồm các thành phần cơ bản của lược đồ cấu hình kênh dùng chung và trình dựng chung |
  | `plugin-sdk/bundled-channel-config-schema` | Các lược đồ cấu hình đi kèm | Chỉ dành cho các plugin đi kèm do OpenClaw duy trì; plugin mới phải định nghĩa lược đồ cục bộ trong plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Các lược đồ cấu hình đi kèm không còn được khuyến nghị | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các plugin đi kèm đang được duy trì |
  | `plugin-sdk/telegram-command-config` | Các trình trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, rút gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Lớp giao diện tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Các trình trợ giúp phong bì đầu vào | Trình trợ giúp dùng chung để dựng tuyến + phong bì |
  | `plugin-sdk/channel-inbound` | Các trình trợ giúp nhận đầu vào | Dựng ngữ cảnh, định dạng, gốc, trình chạy, điều phối trả lời đã chuẩn bị và các vị từ điều phối |
  | `plugin-sdk/messaging-targets` | Đường dẫn nhập phân tích đích không còn được khuyến nghị | Dùng `plugin-sdk/channel-targets` cho các trình trợ giúp phân tích đích chung, `plugin-sdk/channel-route` để so sánh tuyến và `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do plugin sở hữu để phân giải đích dành riêng cho nhà cung cấp |
  | `plugin-sdk/outbound-media` | Các trình trợ giúp phương tiện đầu ra | Tải phương tiện đầu ra dùng chung |
  | `plugin-sdk/outbound-send-deps` | Lớp giao diện tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Các trình trợ giúp vòng đời tin nhắn đầu ra | Bộ điều hợp tin nhắn, biên nhận, trình trợ giúp gửi bền vững, trình trợ giúp xem trước trực tiếp/truyền luồng, tùy chọn trả lời, trình trợ giúp vòng đời, danh tính đầu ra và lập kế hoạch tải trọng |
  | `plugin-sdk/channel-streaming` | Lớp giao diện tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Lớp giao diện tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Các trình trợ giúp liên kết luồng | Vòng đời liên kết luồng và trình trợ giúp bộ điều hợp |
  | `plugin-sdk/agent-media-payload` | Các trình trợ giúp tải trọng phương tiện cũ | Trình dựng tải trọng phương tiện tác tử cho bố cục trường cũ |
  | `plugin-sdk/channel-runtime` | Shim tương thích không còn được khuyến nghị | Chỉ dành cho các tiện ích thời gian chạy kênh cũ |
  | `plugin-sdk/channel-send-result` | Các kiểu kết quả gửi | Các kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Bộ lưu trữ plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Các trình trợ giúp thời gian chạy phạm vi rộng | Trình trợ giúp thời gian chạy/ghi nhật ký/sao lưu/cài đặt plugin |
  | `plugin-sdk/runtime-env` | Các trình trợ giúp môi trường thời gian chạy phạm vi hẹp | Trình trợ giúp bộ ghi nhật ký/môi trường thời gian chạy, thời gian chờ, thử lại và thời gian chờ tăng dần |
  | `plugin-sdk/plugin-runtime` | Các trình trợ giúp thời gian chạy plugin dùng chung | Trình trợ giúp lệnh/hook/http/tương tác của plugin |
  | `plugin-sdk/hook-runtime` | Các trình trợ giúp pipeline hook | Trình trợ giúp pipeline Webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Các trình trợ giúp thời gian chạy tải lười | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Các trình trợ giúp tiến trình | Các trình trợ giúp thực thi dùng chung |
  | `plugin-sdk/cli-runtime` | Các trình trợ giúp thời gian chạy CLI | Định dạng lệnh, chờ, trình trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Các trình trợ giúp Gateway | Máy khách Gateway, trình trợ giúp khởi động khi vòng lặp sự kiện sẵn sàng, phân giải máy chủ LAN được quảng bá và trình trợ giúp vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình không còn được khuyến nghị | Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Các trình trợ giúp lệnh Telegram | Trình trợ giúp xác thực lệnh Telegram có phương án dự phòng ổn định khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Các trình trợ giúp lời nhắc phê duyệt | Tải trọng phê duyệt thực thi/plugin, trình trợ giúp năng lực/hồ sơ phê duyệt, trình trợ giúp định tuyến/thời gian chạy phê duyệt gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Các trình trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động trong cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Các trình trợ giúp máy khách phê duyệt | Trình trợ giúp hồ sơ/bộ lọc phê duyệt thực thi gốc |
  | `plugin-sdk/approval-delivery-runtime` | Các trình trợ giúp phân phối phê duyệt | Bộ điều hợp năng lực/phân phối phê duyệt gốc |
  | `plugin-sdk/approval-gateway-runtime` | Các trình trợ giúp Gateway phê duyệt | Trình phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-reference-runtime` | Tham chiếu phương thức truyền tải phê duyệt | Trình trợ giúp bộ định vị bền vững, tất định cho các lệnh gọi lại bị giới hạn bởi phương thức truyền tải |
  | `plugin-sdk/approval-handler-adapter-runtime` | Các trình trợ giúp bộ điều hợp phê duyệt | Trình trợ giúp nhẹ để tải bộ điều hợp phê duyệt gốc cho các điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Các trình trợ giúp trình xử lý phê duyệt | Trình trợ giúp thời gian chạy của trình xử lý phê duyệt phạm vi rộng hơn; ưu tiên các đường nối bộ điều hợp/Gateway hẹp hơn khi chúng đã đủ |
  | `plugin-sdk/approval-native-runtime` | Các trình trợ giúp đích phê duyệt | Trình trợ giúp liên kết đích/tài khoản phê duyệt gốc |
  | `plugin-sdk/approval-reply-runtime` | Các trình trợ giúp trả lời phê duyệt | Trình trợ giúp tải trọng trả lời phê duyệt thực thi/plugin |
  | `plugin-sdk/channel-runtime-context` | Các trình trợ giúp ngữ cảnh thời gian chạy kênh | Trình trợ giúp chung để đăng ký/lấy/theo dõi ngữ cảnh thời gian chạy kênh |
  | `plugin-sdk/security-runtime` | Các trình trợ giúp bảo mật | Trình trợ giúp dùng chung về độ tin cậy, kiểm soát DM, tệp/đường dẫn giới hạn trong thư mục gốc, nội dung bên ngoài và thu thập bí mật |
  | `plugin-sdk/ssrf-policy` | Các trình trợ giúp chính sách SSRF | Trình trợ giúp danh sách máy chủ cho phép và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Các trình trợ giúp thời gian chạy SSRF | Bộ điều phối được ghim, tìm nạp có bảo vệ, trình trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Các trình trợ giúp sự kiện hệ thống | `enqueueSystemEvent` (bao gồm thay thế theo khóa), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Các trình trợ giúp Heartbeat | Trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Các trình trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Các trình trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Các trình trợ giúp loại bỏ trùng lặp | Bộ nhớ đệm loại bỏ trùng lặp trong bộ nhớ và có phần lưu trữ bền vững hỗ trợ |
  | `plugin-sdk/file-access-runtime` | Các trình trợ giúp truy cập tệp | Trình trợ giúp đường dẫn tệp/phương tiện cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Các trình trợ giúp trạng thái sẵn sàng của phương thức truyền tải | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Các trình trợ giúp chính sách phê duyệt thực thi | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Các trình trợ giúp bộ nhớ đệm có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Các trình trợ giúp kiểm soát chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Các trình trợ giúp lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình trợ giúp đồ thị lỗi, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Các trình trợ giúp tìm nạp được bọc/proxy | `resolveFetch`, trình trợ giúp proxy, trình trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Các trình trợ giúp chuẩn hóa máy chủ | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Các trình trợ giúp thử lại | `RetryConfig`, `retryAsync`, trình chạy chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép và ánh xạ đầu vào | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Các trình trợ giúp kiểm soát lệnh và bề mặt lệnh | `resolveControlCommandGate`, trình trợ giúp ủy quyền người gửi, trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Trình kết xuất trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Các trình trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Các trình trợ giúp yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Các trình trợ giúp bảo vệ phần thân Webhook | Trình trợ giúp đọc/giới hạn phần thân yêu cầu |
  | `plugin-sdk/reply-runtime` | Thời gian chạy trả lời dùng chung | Điều phối đầu vào, Heartbeat, trình lập kế hoạch trả lời, phân đoạn |
  | `plugin-sdk/reply-dispatch-runtime` | Các trình trợ giúp điều phối trả lời phạm vi hẹp | Trình trợ giúp hoàn tất, điều phối nhà cung cấp và nhãn cuộc trò chuyện |
  | `plugin-sdk/reply-history` | Các trình trợ giúp lịch sử trả lời | `createChannelHistoryWindow`; các mục xuất tương thích của trình trợ giúp ánh xạ không còn được khuyến nghị như `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Các trình trợ giúp phân đoạn trả lời | Trình trợ giúp phân đoạn văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Các trình trợ giúp kho phiên | Trình trợ giúp hàng phiên có phạm vi, trình trợ giúp đường dẫn kho và đọc thời điểm cập nhật |
  | `plugin-sdk/state-paths` | Các trình trợ giúp đường dẫn trạng thái | Trình trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Các trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Các trình trợ giúp trạng thái kênh | Trình dựng bản tóm tắt trạng thái kênh/tài khoản, giá trị mặc định trạng thái thời gian chạy, trình trợ giúp siêu dữ liệu sự cố |
  | `plugin-sdk/target-resolver-runtime` | Các trình trợ giúp phân giải đích | Các trình trợ giúp phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Các trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Các trình trợ giúp URL yêu cầu | Trích xuất URL dạng chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Các trình trợ giúp lệnh có tính giờ | Trình chạy lệnh có tính giờ với stdout/stderr được chuẩn hóa |
  | `plugin-sdk/param-readers` | Trình đọc tham số | Trình đọc tham số công cụ/CLI dùng chung |
  | `plugin-sdk/tool-payload` | Trích xuất tải trọng công cụ | Trích xuất tải trọng đã chuẩn hóa từ các đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất thông tin gửi của công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Các trình trợ giúp đường dẫn tạm thời | Trình trợ giúp đường dẫn tải xuống tạm thời dùng chung |
  | `plugin-sdk/logging-core` | Các trình trợ giúp ghi nhật ký | Trình ghi nhật ký hệ thống con và trình trợ giúp che dữ liệu |
  | `plugin-sdk/markdown-table-runtime` | Các trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Các kiểu trả lời tin nhắn | Các kiểu tải trọng trả lời |
  | `plugin-sdk/provider-setup` | Các trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Các trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI chuyên biệt | Cùng các trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Các trình trợ giúp xác thực thời gian chạy của nhà cung cấp | Trình trợ giúp phân giải khóa API trong thời gian chạy |
  | `plugin-sdk/provider-auth-api-key` | Các trình trợ giúp thiết lập khóa API của nhà cung cấp | Trình trợ giúp hướng dẫn sử dụng ban đầu khóa API/ghi hồ sơ |
  | `plugin-sdk/provider-auth-result` | Các trình trợ giúp kết quả xác thực của nhà cung cấp | Trình dựng kết quả xác thực OAuth tiêu chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Các trình trợ giúp lựa chọn nhà cung cấp | Lựa chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Các trình trợ giúp biến môi trường của nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại dùng chung của nhà cung cấp | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, trình dựng chính sách phát lại dùng chung, trình trợ giúp điểm cuối nhà cung cấp và trình trợ giúp chuẩn hóa ID mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp danh mục nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá quy trình làm quen với nhà cung cấp | Trình trợ giúp cấu hình quy trình làm quen |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP của nhà cung cấp | Trình trợ giúp chung về khả năng HTTP/điểm cuối của nhà cung cấp, bao gồm trình trợ giúp biểu mẫu nhiều phần để phiên âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp tìm nạp web của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp tìm nạp web |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình tìm kiếm web của nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web có phạm vi hẹp cho các nhà cung cấp không cần nối dây kích hoạt plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng tìm kiếm web của nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web có phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và các hàm thiết lập/truy xuất thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp tìm kiếm web của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy của nhà cung cấp tìm kiếm web |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/lược đồ của nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và chức năng dọn dẹp lược đồ + chẩn đoán DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng của nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng khác của nhà cung cấp |
  | `plugin-sdk/provider-stream` | Trình trợ giúp trình bao bọc luồng của nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, các kiểu trình bao bọc luồng và trình trợ giúp trình bao bọc dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp lớp truyền tải của nhà cung cấp | Trình trợ giúp lớp truyền tải gốc của nhà cung cấp như tìm nạp có bảo vệ, trích xuất văn bản kết quả công cụ, chuyển đổi thông điệp truyền tải và luồng sự kiện truyền tải có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp phương tiện dùng chung | Trình trợ giúp tìm nạp/chuyển đổi/lưu trữ phương tiện, thăm dò kích thước video dựa trên ffprobe và trình dựng tải trọng phương tiện |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo phương tiện dùng chung | Trình trợ giúp chuyển đổi dự phòng dùng chung, lựa chọn ứng viên và thông báo thiếu mô hình cho việc tạo hình ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu phương tiện | Các kiểu nhà cung cấp hiểu phương tiện cùng các bản xuất trình trợ giúp hình ảnh/âm thanh dành cho nhà cung cấp |
  | `plugin-sdk/text-runtime` | Bản xuất tương thích văn bản phạm vi rộng đã lỗi thời | Sử dụng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản gửi đi và phạm vi bảo toàn độ lệch |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Các kiểu nhà cung cấp giọng nói cùng trình trợ giúp chỉ thị, sổ đăng ký và xác thực dành cho nhà cung cấp, cũng như trình dựng TTS tương thích với OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Các kiểu nhà cung cấp giọng nói, sổ đăng ký, chỉ thị, chuẩn hóa |
  | `plugin-sdk/speech-settings` | Cài đặt giọng nói | Các thành phần cơ bản nhẹ để phân giải và chuẩn hóa cấu hình TTS mà không có sổ đăng ký nhà cung cấp hoặc thời gian chạy tổng hợp |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm theo thời gian thực | Các kiểu nhà cung cấp, trình trợ giúp sổ đăng ký và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp thoại theo thời gian thực | Các kiểu nhà cung cấp, trình trợ giúp đăng ký/phân giải, trình trợ giúp phiên cầu nối, bộ khung phiên độc lập với lớp truyền tải, cổng năng lượng âm thanh/khởi phát lời nói, hàng đợi phản hồi bằng lời của tác tử dùng chung, điều khiển thoại của lượt chạy đang hoạt động, tình trạng bản chép lời/sự kiện, khử tiếng vọng, đối sánh câu hỏi tham vấn, điều phối tham vấn bắt buộc, theo dõi ngữ cảnh lượt, theo dõi hoạt động đầu ra và trình trợ giúp tham vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo hình ảnh | Các kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL dữ liệu/tài sản hình ảnh và trình dựng nhà cung cấp hình ảnh tương thích với OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo hình ảnh dùng chung | Các kiểu tạo hình ảnh, chuyển đổi dự phòng, xác thực và trình trợ giúp sổ đăng ký |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Các kiểu tạo nhạc, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Các kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Các kiểu tạo video, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích tham chiếu mô hình |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/rút gọn tải trọng trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Thành phần cơ bản của cấu hình kênh | Các thành phần cơ bản có phạm vi hẹp của lược đồ cấu hình kênh |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Phần mở đầu kênh dùng chung | Các bản xuất phần mở đầu plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp ảnh chụp nhanh/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình danh sách cho phép | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
  | `plugin-sdk/group-access` | Trình trợ giúp quyền truy cập nhóm | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Các facade tương thích đã lỗi thời | Sử dụng `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp bảo vệ DM trực tiếp | Trình trợ giúp chính sách bảo vệ có phạm vi hẹp trước mã hóa |
  | `plugin-sdk/extension-shared` | Trình trợ giúp tiện ích mở rộng dùng chung | Các thành phần cơ bản của trình trợ giúp kênh thụ động/trạng thái và proxy môi trường xung quanh |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Trình trợ giúp sổ đăng ký đích Webhook và cài đặt tuyến |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn Webhook đã lỗi thời | Sử dụng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp phương tiện web dùng chung | Trình trợ giúp tải phương tiện từ xa/cục bộ |
  | `plugin-sdk/zod` | Bản tái xuất tương thích Zod đã lỗi thời | Nhập `zod` trực tiếp từ `zod` |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core đi kèm | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI của bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy của công cụ bộ nhớ | Facade thời gian chạy lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-embedding-registry` | Sổ đăng ký nhúng bộ nhớ | Trình trợ giúp sổ đăng ký nhẹ cho nhà cung cấp nhúng bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Công cụ nền tảng máy chủ bộ nhớ | Các bản xuất công cụ nền tảng máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Công cụ nhúng máy chủ bộ nhớ | Hợp đồng nhúng bộ nhớ, quyền truy cập sổ đăng ký, nhà cung cấp cục bộ và trình trợ giúp hàng loạt/từ xa chung; các nhà cung cấp từ xa cụ thể nằm trong các plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Công cụ QMD của máy chủ bộ nhớ | Các bản xuất công cụ QMD của máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Công cụ lưu trữ máy chủ bộ nhớ | Các bản xuất công cụ lưu trữ máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức của máy chủ bộ nhớ | Trình trợ giúp đa phương thức của máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn máy chủ bộ nhớ | Trình trợ giúp truy vấn máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật máy chủ bộ nhớ | Trình trợ giúp bí mật máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ đã lỗi thời | Sử dụng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái máy chủ bộ nhớ | Trình trợ giúp trạng thái máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Thời gian chạy CLI của máy chủ bộ nhớ | Trình trợ giúp thời gian chạy CLI của máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Thời gian chạy lõi của máy chủ bộ nhớ | Trình trợ giúp thời gian chạy lõi của máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy của máy chủ bộ nhớ | Trình trợ giúp tệp/thời gian chạy của máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh thời gian chạy lõi của máy chủ bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp thời gian chạy lõi của máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện máy chủ bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/thời gian chạy bộ nhớ đã lỗi thời | Sử dụng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp Markdown được quản lý | Trình trợ giúp Markdown được quản lý dùng chung cho các plugin liên quan đến bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade thời gian chạy của trình quản lý tìm kiếm Active Memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái máy chủ bộ nhớ đã lỗi thời | Sử dụng `plugin-sdk/memory-core-host-status` |
</Accordion>

  Bảng này là tập con di chuyển chung, không phải toàn bộ bề mặt SDK. Danh mục
  điểm vào trình biên dịch nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
  các phần xuất của gói được tạo từ tập con công khai.

  Các seam trợ giúp dành riêng cho plugin đi kèm đã được loại bỏ khỏi bản đồ xuất
  SDK công khai, ngoại trừ các facade tương thích được ghi rõ trong tài liệu, chẳng hạn như
  shim `plugin-sdk/discord` đã lỗi thời được giữ lại cho các plugin bên ngoài vẫn
  nhập trực tiếp gói `@openclaw/discord` đã phát hành. Các
  trình trợ giúp dành riêng cho chủ sở hữu nằm trong gói plugin sở hữu; hành vi máy chủ dùng chung được chuyển
  qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` và `plugin-sdk/plugin-config-runtime`.

  Hãy dùng phần nhập hẹp nhất phù hợp với tác vụ. Nếu không tìm thấy phần xuất,
  hãy kiểm tra mã nguồn tại `src/plugin-sdk/` hoặc hỏi người bảo trì xem hợp đồng
  chung nào nên sở hữu phần đó.

  ## Các bề mặt tương thích đã bị loại bỏ

  ### Barrel kiểm thử riêng tư

  `openclaw/plugin-sdk/testing` chỉ dùng nội bộ kho mã và bị loại khỏi các tạo tác gói
  được phát hành, vì vậy nó đã bị xóa trước ngày `removeAfter` 2026-07-28. Các kiểm thử trong kho mã
  sử dụng những đường dẫn con tập trung như `plugin-sdk/plugin-test-runtime`,
  `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
  `plugin-sdk/test-env` và `plugin-sdk/test-fixtures`.

  ## Các mục ngừng hỗ trợ đang hoạt động

  Các mục ngừng hỗ trợ có phạm vi hẹp hơn trong SDK plugin, hợp đồng nhà cung cấp, bề mặt
  runtime và manifest. Mỗi mục vẫn hoạt động hiện nay nhưng sẽ bị loại bỏ trong một
  bản phát hành lớn trong tương lai. Mỗi mục ánh xạ API cũ sang phương án thay thế chuẩn tắc.

  <AccordionGroup>
  <Accordion title="Các trình dựng trợ giúp command-auth -> command-status">
    **Cũ (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Mới (`openclaw/plugin-sdk/command-status`)**: cùng chữ ký, cùng
    phần xuất — chỉ được nhập từ đường dẫn con hẹp hơn. `command-auth`
    tái xuất chúng dưới dạng stub tương thích.

    ```typescript
    // Trước đây
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Sau này
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Các trình trợ giúp kiểm soát đề cập -> resolveInboundMentionDecision">
    **Cũ**: `resolveMentionGating(params)` và
    `resolveMentionGatingWithBypass(params)` từ
    `openclaw/plugin-sdk/channel-inbound` hoặc
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Mới**: `resolveInboundMentionDecision({ facts, policy })` — một đối tượng
    quyết định thay cho hai dạng lời gọi tách biệt.

    Đã được áp dụng trên Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp và Zalo. Mô hình sự kiện `app_mention` riêng của Slack
    không sử dụng trình trợ giúp này.

  </Accordion>

  <Accordion title="Shim runtime kênh và các trình trợ giúp hành động kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích dành cho các
    plugin kênh cũ hơn. Không nhập nó trong mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các trình trợ giúp `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng hỗ trợ cùng với các phần xuất kênh "actions" thô. Thay vào đó, hãy cung cấp các khả năng
    thông qua bề mặt ngữ nghĩa `presentation` — các plugin kênh
    khai báo nội dung chúng kết xuất (thẻ, nút, danh sách chọn) thay vì tên
    hành động thô mà chúng chấp nhận.

  </Accordion>

  <Accordion title="Trình trợ giúp tool() của nhà cung cấp tìm kiếm web -> createTool() trên plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai trực tiếp `createTool(...)` trên plugin nhà cung cấp.
    OpenClaw không còn cần trình trợ giúp SDK để đăng ký trình bao bọc công cụ.

  </Accordion>

  <Accordion title="Phong bì kênh văn bản thuần túy -> BodyForAgent">
    **Cũ**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (và trường
    `channelEnvelope` trên các đối tượng tin nhắn đến) để dựng một phong bì
    lời nhắc văn bản thuần túy phẳng từ các tin nhắn kênh đến.

    **Mới**: `BodyForAgent` cùng các khối ngữ cảnh người dùng có cấu trúc. Các
    plugin kênh đính kèm siêu dữ liệu định tuyến (luồng, chủ đề, trả lời, phản ứng) dưới dạng
    các trường có kiểu thay vì nối chúng vào một chuỗi lời nhắc. Trình trợ giúp
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các phong bì hướng đến
    trợ lý được tổng hợp, nhưng các phong bì văn bản thuần túy đầu vào đang dần bị
    loại bỏ.

    Các khu vực bị ảnh hưởng: `inbound_claim`, `message_received` và mọi
    plugin kênh tùy chỉnh đã xử lý hậu kỳ văn bản phong bì cũ.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Cũ**: `api.on("deactivate", handler)`.

    **Mới**: `api.on("gateway_stop", handler)`. Cùng hợp đồng dọn dẹp khi tắt;
    chỉ thay đổi tên hook.

    ```typescript
    // Trước đây
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Sau này
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` vẫn được nối dây dưới dạng bí danh tương thích đã lỗi thời cho đến khi bị
    loại bỏ sau ngày 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> liên kết luồng lõi">
    **Cũ**: `api.on("subagent_spawning", handler)` trả về
    `threadBindingReady` hoặc `deliveryOrigin`.

    **Mới**: để lõi chuẩn bị các liên kết subagent `thread: true` thông qua
    bộ điều hợp liên kết phiên kênh. Chỉ dùng `api.on("subagent_spawned", handler)`
    để quan sát sau khi khởi chạy.

    ```typescript
    // Trước đây
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Sau này
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` và
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` chỉ còn tồn tại dưới dạng
    các bề mặt tương thích đã lỗi thời trong khi plugin bên ngoài di chuyển và sẽ bị loại bỏ
    sau ngày 2026-08-30.

  </Accordion>

  <Accordion title="Kiểu khám phá nhà cung cấp -> kiểu danh mục nhà cung cấp">
    Bốn bí danh kiểu khám phá hiện là các trình bao bọc mỏng quanh những kiểu thời kỳ
    danh mục:

    | Bí danh cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cùng với túi tĩnh `ProviderCapabilities` cũ — các plugin nhà cung cấp
    nên dùng các hook nhà cung cấp rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas` và `wrapStreamFn` thay cho một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách suy luận -> resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn tắc, `label` tùy chọn và một
    danh sách cấp độ được xếp hạng. OpenClaw tự động hạ cấp các giá trị lưu trữ cũ
    theo thứ hạng hồ sơ.

    Ngữ cảnh bao gồm `provider`, `modelId`, `reasoning` hợp nhất tùy chọn
    và các dữ kiện mô hình `compat` hợp nhất tùy chọn. Các plugin nhà cung cấp có thể dùng những
    dữ kiện danh mục đó để cung cấp hồ sơ riêng cho mô hình chỉ khi hợp đồng
    yêu cầu đã cấu hình hỗ trợ nó.

    Triển khai một hook thay vì ba. Các hook cũ vẫn hoạt động trong
    khoảng thời gian ngừng hỗ trợ nhưng không được kết hợp với kết quả hồ sơ.

  </Accordion>

  <Accordion title="Nhà cung cấp xác thực bên ngoài -> contracts.externalAuthProviders">
    **Cũ**: triển khai các hook xác thực bên ngoài mà không khai báo nhà cung cấp
    trong manifest plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest plugin
    **và** triển khai `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Tra cứu biến môi trường của nhà cung cấp -> setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng phép tra cứu biến môi trường vào `setup.providers[].envVars`
    trên manifest. Việc này hợp nhất siêu dữ liệu môi trường thiết lập/trạng thái tại một nơi
    và tránh khởi động runtime plugin chỉ để trả lời các phép tra cứu biến môi trường.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua một bộ điều hợp tương thích
    cho đến khi khoảng thời gian ngừng hỗ trợ kết thúc.

  </Accordion>

  <Accordion title="Đăng ký plugin bộ nhớ -> registerMemoryCapability">
    **Cũ**: ba lời gọi riêng biệt — `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Mới**: một lời gọi trên API trạng thái bộ nhớ —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các vị trí, một lời gọi đăng ký duy nhất. Các trình trợ giúp lời nhắc và kho ngữ liệu
    bổ sung (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) không
    bị ảnh hưởng.

  </Accordion>

  <Accordion title="API nhà cung cấp embedding bộ nhớ">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cùng
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cùng
    `contracts.embeddingProviders`.

    Hợp đồng nhà cung cấp embedding chung có thể được tái sử dụng bên ngoài bộ nhớ và là
    đường dẫn được hỗ trợ cho các nhà cung cấp mới. API đăng ký dành riêng cho bộ nhớ
    vẫn được nối dây dưới dạng tương thích đã lỗi thời trong khi các nhà cung cấp hiện có
    di chuyển. Hoạt động kiểm tra plugin báo cáo việc sử dụng không đi kèm là nợ
    tương thích.

  </Accordion>

  <Accordion title="Kết quả gửi kênh thô -> OutboundDeliveryResult">
    **Cũ**: trả về `{ ok, messageId, error }` thông qua
    `ChannelSendRawResult` và chuẩn hóa nó bằng
    `createRawChannelSendResultAdapter(...)`.

    **Mới**: trả về các trường `OutboundDeliveryResult` và đính kèm kênh bằng
    `createAttachedChannelResultAdapter(...)`. Các lần gửi thất bại nên ném ngoại lệ
    thay vì trả về một chuỗi lỗi. Kiểu kết quả thô vẫn khả dụng cho đến
    bản phát hành lớn tiếp theo của SDK plugin.

  </Accordion>

  <Accordion title="Đổi tên các kiểu tin nhắn phiên subagent">
    Hai bí danh kiểu cũ vẫn được xuất từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng hỗ trợ để chuyển sang
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp đến
    phương thức mới.

  </Accordion>

  <Accordion title="Các API tệp phiên và bản chép lời đã bị loại bỏ">
    Việc chuyển phiên/bản chép lời sang SQLite loại bỏ hoặc ngừng hỗ trợ các API hướng đến plugin
    từng cung cấp các kho `sessions.json` đang hoạt động, đường dẫn bản chép lời JSONL hoặc danh sách
    tệp phiên. Các plugin runtime nên sử dụng danh tính phiên và các trình trợ giúp runtime SDK
    thay vì phân giải hoặc sửa đổi các tệp đang hoạt động.

    | Bề mặt cần di chuyển | Phương án thay thế |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` và `resolveSessionStoreEntry(...)` đã lỗi thời | `getSessionEntry(...)`, `listSessionEntries(...)` và các thao tác sửa đổi phiên ở cấp hàng. |
    | `resolveSessionFilePath(...)` đã lỗi thời | Danh tính phiên (`sessionKey`, `sessionId` và các trình trợ giúp đích runtime SDK) cùng các phương thức Gateway hoạt động trên phiên hiện tại. |
    | `saveSessionStore(...)` đã bị loại bỏ | Các API runtime phiên do Gateway sở hữu; mã plugin nên yêu cầu hoặc sửa đổi trạng thái phiên thông qua các trình trợ giúp runtime/ngữ cảnh được ghi trong tài liệu thay vì ghi vào tệp kho đang hoạt động. |
    | `resolveSessionTranscriptPathInDir(...)` và `resolveAndPersistSessionFile(...)` đã bị loại bỏ | Danh tính phiên và các phương thức Gateway hoạt động trên phiên hiện tại. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Các trình đọc bản chép lời dựa trên danh tính do ngữ cảnh runtime hiện tại cung cấp, hoặc các phương thức lịch sử/phiên của Gateway khi plugin nằm ngoài đường dẫn sở hữu bản chép lời. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` với `agentId`, `sessionKey` và `sessionId`. |
    | Đầu vào đồng bộ bộ nhớ như `sessionFiles` | Các nguồn bản chép lời/phiên dựa trên danh tính do máy chủ cung cấp; không quét các tệp JSONL đang hoạt động cho phiên trực tiếp. |
    | Các tùy chọn runtime có tên `transcriptPath` hoặc `sessionFile` dành cho phiên đang hoạt động | Các đối tượng `sessionTarget`/đích runtime mang danh tính phiên trung lập với lớp lưu trữ. |

    Các tệp bản ghi hội thoại JSONL cũ vẫn hợp lệ dưới dạng các thành phần phục vụ nhập, lưu trữ, xuất và
    hỗ trợ. Chúng không còn là hợp đồng runtime ở trạng thái ổn định cho
    các phiên đang hoạt động.

    Các plugin chính thức được phát hành cùng `v2026.7.1-beta.5` đã nhập bốn
    hàm trợ giúp không còn được khuyến nghị ở trên. `openclaw/plugin-sdk/session-store-runtime` duy trì
    chính xác cầu nối đó đến hết 2026-10-12; các plugin mới phải sử dụng các phương án thay thế.
    `resolveStorePath(...)` vẫn là một hàm trợ giúp SDK được hỗ trợ và không thuộc
    phạm vi ngừng hỗ trợ này.

    `openclaw plugins inspect --all --runtime` báo cáo các plugin không được đóng gói có
    lỗi tải hoặc chẩn đoán vẫn tham chiếu đến các API tệp đã bị loại bỏ này. Đợt
    rà soát cảnh báo `@openclaw/plugin-inspector` phải sử dụng phiên bản `0.3.17` hoặc
    mới hơn để quá trình quét gói bên ngoài cũng gắn cờ các hàm trợ giúp phiên trên toàn bộ kho,
    các hàm trợ giúp đường dẫn tệp phiên, các đích tệp bản ghi hội thoại cũ và các hàm trợ giúp
    bản ghi hội thoại cấp thấp trước khi phát hành.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một trình truy cập luồng tác vụ
    trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` duy trì runtime chỉnh sửa TaskFlow được quản lý
    cho các plugin tạo, cập nhật, hủy hoặc chạy tác vụ con từ một
    luồng. Sử dụng `runtime.tasks.flows` khi plugin chỉ cần
    thao tác đọc dựa trên DTO.

    ```typescript
    // Trước
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Sau
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Bị loại bỏ sau 2026-07-26.

  </Accordion>

  <Accordion title="Các factory tiện ích mở rộng nhúng -> middleware kết quả công cụ của tác nhân">
    Đã được trình bày trong phần [Cách di chuyển](#how-to-migrate) ở trên. Được đưa vào đây để
    đầy đủ thông tin: đường dẫn chỉ dành cho trình chạy nhúng đã bị loại bỏ
    `api.registerEmbeddedExtensionFactory(...)` được thay thế bằng
    `api.registerAgentToolResultMiddleware(...)` với danh sách runtime tường minh
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Bí danh OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType` được tái xuất từ `openclaw/plugin-sdk` hiện là
    bí danh một dòng cho `OpenClawConfig`. Nên dùng tên chuẩn.

    ```typescript
    // Trước
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Sau
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các mục ngừng hỗ trợ ở cấp tiện ích mở rộng (bên trong các plugin kênh/nhà cung cấp được đóng gói thuộc
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng plugin của bên thứ ba và không được liệt kê
tại đây. Nếu bạn sử dụng trực tiếp barrel cục bộ của một plugin được đóng gói, hãy đọc các
chú thích ngừng hỗ trợ trong barrel đó trước khi nâng cấp.
</Note>

## Di chuyển Talk và thoại thời gian thực

Mã thoại thời gian thực, điện thoại, cuộc họp và Talk trên trình duyệt dùng chung một bộ điều khiển
phiên Talk được xuất bởi `openclaw/plugin-sdk/realtime-voice`. Bộ
điều khiển sở hữu phong bì sự kiện Talk chung, trạng thái lượt đang hoạt động, trạng thái
thu nhận, trạng thái âm thanh đầu ra, lịch sử sự kiện gần đây và cơ chế từ chối lượt lỗi thời.
Các plugin nhà cung cấp sở hữu những phiên thời gian thực riêng cho từng nhà cung cấp. Các plugin cuộc họp trên trình duyệt
sử dụng `openclaw/plugin-sdk/meeting-runtime` cho cơ chế phiên, trình duyệt, âm thanh, máy chủ node,
tư vấn tác nhân và cuộc gọi thoại, sau đó triển khai `MeetingPlatformAdapter`
cho quy tắc URL, tập lệnh DOM, ánh xạ thao tác thủ công, phụ đề, tạo cuộc họp và kế hoạch
quay số tham gia. Các API REST của nền tảng, OAuth, thành phần tạo tác, bộ chọn và tên trên đường truyền vẫn nằm trong
plugin. Kế hoạch quyền của trình duyệt nhận URL cuộc họp được yêu cầu để mỗi
nền tảng chỉ có thể cấp quyền cho đúng các nguồn gốc mà nền tảng đó hỗ trợ. Runtime phiên cũng phải
chuẩn hóa tình trạng hoạt động trực tiếp riêng của nền tảng sau khi xác nhận trình duyệt đã rời đi;
các trường bản ghi hội thoại lịch sử có thể được giữ lại, nhưng trạng thái sẵn sàng của phụ đề và âm thanh không được
tiếp tục hoạt động sau khi rời đi.

Tất cả bề mặt được đóng gói đều chạy trên bộ điều khiển dùng chung: chuyển tiếp trình duyệt,
chuyển giao phòng được quản lý, cuộc gọi thoại thời gian thực, STT phát trực tuyến cho cuộc gọi thoại, Google
Meet thời gian thực và nhấn để nói nguyên bản. Gateway quảng bá một kênh sự kiện Talk trực tiếp
trong `hello-ok.features.events`: `talk.event`.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi
triển khai một bộ điều hợp cấp thấp hoặc fixture kiểm thử. Hãy sử dụng bộ điều khiển dùng chung để
không thể phát các sự kiện theo phạm vi lượt khi thiếu mã định danh lượt, các lệnh gọi `turnEnd` /
`turnCancel` lỗi thời không thể xóa một lượt đang hoạt động mới hơn, và các sự kiện vòng đời
âm thanh đầu ra vẫn nhất quán trên điện thoại, cuộc họp, chuyển tiếp trình duyệt,
chuyển giao phòng được quản lý và các máy khách Talk nguyên bản.

Hình dạng API công khai:

```typescript
// API phiên Talk do Gateway sở hữu.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// API phiên nhà cung cấp do máy khách sở hữu.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Các phiên WebRTC/websocket nhà cung cấp do trình duyệt sở hữu sử dụng `talk.client.create`,
vì trình duyệt sở hữu quá trình thương lượng với nhà cung cấp và vận chuyển phương tiện, trong khi
Gateway sở hữu thông tin xác thực, hướng dẫn và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho hoạt động thời gian thực qua gateway-relay, phiên âm qua gateway-relay
và các phiên STT/TTS nguyên bản trong phòng được quản lý.

Các cấu hình cũ đặt bộ chọn thời gian thực cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk trong runtime
không diễn giải lại cấu hình nhà cung cấp giọng nói/TTS thành cấu hình nhà cung cấp thời gian thực.

Các tổ hợp `talk.session.create` được hỗ trợ được chủ ý giới hạn:

| Chế độ            | Phương thức vận chuyển       | Bộ não           | Chủ sở hữu              | Ghi chú                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh nhà cung cấp song công toàn phần được bắc cầu qua Gateway; các lệnh gọi công cụ được định tuyến qua công cụ tư vấn tác nhân.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ STT phát trực tuyến; bên gọi gửi âm thanh đầu vào và nhận các sự kiện bản ghi lời nói.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng nguyên bản/máy khách | Các phòng theo kiểu nhấn để nói và bộ đàm, trong đó máy khách sở hữu việc thu/phát và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng nguyên bản/máy khách | Chế độ phòng chỉ dành cho quản trị viên đối với các bề mặt bên thứ nhất đáng tin cậy thực thi trực tiếp các thao tác công cụ của Gateway.                  |

Ánh xạ phương thức dành cho người đọc đang di chuyển từ các họ `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` cũ hơn (tất cả đều đã bị loại bỏ):

| Cũ                              | Mới                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` hoặc `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Từ vựng điều khiển hợp nhất cũng được chủ ý giới hạn:

| Phương thức                          | Áp dụng cho                                              | Hợp đồng                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Nối thêm một đoạn âm thanh PCM base64 vào phiên nhà cung cấp do cùng một kết nối Gateway sở hữu.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng trong phòng được quản lý.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt lỗi thời.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | tất cả các phiên do Gateway sở hữu                              | Hủy công việc thu nhận/nhà cung cấp/tác nhân/TTS đang hoạt động cho một lượt.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lệnh gọi công cụ của nhà cung cấp sau mọi quá trình hoàn tất bất đồng bộ do cầu nối của nó cung cấp; truyền `options.willContinue` cho đầu ra tạm thời hoặc, khi được hỗ trợ, `options.suppressResponse` để tránh một phản hồi khác từ trợ lý. |
| `talk.session.steer`            | các phiên Talk được tác nhân hỗ trợ                              | Gửi điều khiển bằng lời nói `status`, `steer`, `cancel` hoặc `followup` đến lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                                                                                 |
| `talk.session.close`            | tất cả các phiên hợp nhất                                    | Dừng các phiên chuyển tiếp hoặc thu hồi trạng thái phòng được quản lý, sau đó quên mã định danh phiên hợp nhất.                                                                                                                                     |

Không đưa các trường hợp đặc biệt dành riêng cho nhà cung cấp hoặc nền tảng vào phần lõi để tính năng này hoạt động.
Phần lõi sở hữu ngữ nghĩa phiên Talk. Các plugin nhà cung cấp sở hữu việc thiết lập phiên của nhà cung cấp.
Cuộc gọi thoại và Google Meet sở hữu các bộ điều hợp điện thoại/cuộc họp. Trình duyệt và ứng dụng
gốc sở hữu trải nghiệm người dùng về thu/phát trên thiết bị.

## Lộ trình loại bỏ

| Thời điểm                                        | Điều xảy ra                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Hiện tại**                                     | Các bề mặt đã ngừng dùng có khả năng cảnh báo sẽ phát cảnh báo khi chạy; các cơ chế bảo vệ kho mã từ chối việc nhập SDK đã ngừng dùng từ phần lõi và các plugin đi kèm. |
| **Ngày `removeAfter` của từng bản ghi tương thích** | Bề mặt cụ thể đó đủ điều kiện để bị loại bỏ; `pnpm plugins:boundary-report --fail-on-eligible-compat` khiến CI thất bại sau khi ngày đó trôi qua.    |
| **Bản phát hành lớn tiếp theo**                      | Mọi bề mặt vẫn chưa được di chuyển sẽ bị loại bỏ; các plugin vẫn sử dụng chúng sẽ gặp lỗi.                                                          |

Các đường dẫn con SDK công khai bên dưới có khoảng thời gian loại bỏ hoặc hạ cấp
được hỗ trợ bởi registry. Hiện tại, chúng không phát cảnh báo khi chạy nếu một plugin bên ngoài nhập
chúng. Cơ chế bảo vệ việc sử dụng thành phần đã ngừng dùng của kho mã chỉ áp dụng cho tầng
θ1 hoàn toàn không còn được sử dụng và tầng tương thích trước đó; θ2 vẫn khả dụng cho các plugin
đi kèm trong khoảng thời gian này.

Đối với khoảng thời gian bắt đầu từ 2026-07-15, θ1 không có đối tượng sử dụng bên ngoài hoặc đi kèm
nào đã biết và sẽ bị xóa sau khoảng thời gian này. θ2 có các đối tượng sử dụng đi kèm nhưng không có
đối tượng sử dụng bên ngoài nào đã biết; chỉ phần xuất gói công khai của nó sẽ bị ngừng cung cấp. Mô-đun
của nó sẽ vẫn khả dụng cho các plugin đi kèm dưới dạng đường dẫn con riêng tư, chỉ dùng cục bộ.

| `removeAfter` | Cấp                                    | Đường dẫn con SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-30`  | Các nội dung ngừng hỗ trợ tương thích trước đây | `agent-dir-compat`, `channel-envelope`, `channel-inbound-roots`, `channel-location`, `channel-message-runtime`, `channel-pairing-paths`, `channel-reply-options-runtime`, `config-schema`, `config-types`, `direct-dm`, `direct-dm-access`, `mattermost`, `media-generation-runtime-shared`, `memory-core`, `memory-core-engine-runtime`, `memory-core-host-events`, `memory-core-host-multimodal`, `memory-core-host-query`, `memory-host-files`, `memory-host-status`, `music-generation-core`, `outbound-runtime`, `outbound-send-deps`, `provider-auth-login`, `provider-zai-endpoint`, `reply-dedupe`, `runtime-logger`, `runtime-secret-resolution`, `self-hosted-provider-setup`, `setup-adapter-runtime`, `telegram-command-config`, `webhook-path`, `zalouser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `2026-07-30`  | θ1: hoàn toàn không được dùng; xóa đường dẫn con       | `command-gating`, `lmstudio`, `lmstudio-runtime`, `secret-provider-integration`, `skills-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `2026-07-30`  | θ2: chỉ dành cho bản đóng gói; ngừng cung cấp bản xuất công khai | `access-groups`, `account-resolution-runtime`, `acp-binding-resolve-runtime`, `acp-binding-runtime`, `acp-runtime`, `acp-runtime-backend`, `agent-core`, `agent-harness-exec-review-runtime`, `agent-harness-task-runtime`, `agent-harness-tool-runtime`, `agent-media-payload`, `agent-sessions`, `approval-reaction-runtime`, `approval-reference-runtime`, `async-lock-runtime`, `browser-config`, `bundled-channel-config-schema`, `channel-activity-runtime`, `channel-config-writes`, `channel-mention-gating`, `channel-route`, `channel-secret-tts-runtime`, `channel-targets`, `chat-channel-ids`, `cli-backend`, `cli-runtime`, `codex-mcp-projection`, `command-status-runtime`, `command-surface`, `concurrency-runtime`, `context-visibility-runtime`, `conversation-binding-runtime`, `cron-store-runtime`, `dangerous-name-runtime`, `delivery-queue-runtime`, `direct-dm-guard-policy`, `directory-config-runtime`, `document-extractor`, `embedding-providers`, `exec-approvals-runtime`, `expect-runtime`, `fetch-runtime`, `file-access-runtime`, `file-lock`, `global-singleton`, `group-activation`, `heartbeat-runtime`, `host-runtime`, `html-entity-runtime`, `image-generation`, `image-generation-core`, `image-generation-runtime`, `inline-image-data-url-runtime`, `json-schema-runtime`, `json-unsafe-integers`, `keyed-async-queue`, `llm`, `markdown-table-runtime`, `media-generation-runtime`, `media-understanding`, `memory-core-host-embedding-registry`, `memory-core-host-engine-embeddings`, `memory-core-host-engine-qmd`, `memory-core-host-engine-storage`, `memory-core-host-runtime-cli`, `memory-core-host-runtime-core`, `memory-core-host-runtime-files`, `memory-core-host-secret`, `memory-core-host-status`, `memory-host-core`, `memory-host-events`, `memory-host-markdown`, `memory-host-search`, `message-tool-delivery-hints`, `migration`, `migration-runtime`, `music-generation`, `node-host`, `number-runtime`, `outbound-media`, `pair-loop-guard-runtime`, `plugin-config-runtime`, `plugin-state-runtime`, `poll-runtime`, `process-runtime`, `provider-auth-api-key`, `provider-auth-login-flow-runtime`, `provider-auth-result`, `provider-auth-runtime`, `provider-catalog-live-runtime`, `provider-catalog-shared`, `provider-entry`, `provider-env-vars`, `provider-http`, `provider-model-shared`, `provider-model-types`, `provider-oauth-runtime`, `provider-onboard`, `provider-selection-runtime`, `provider-setup`, `provider-stream`, `provider-stream-family`, `provider-stream-shared`, `provider-tools`, `provider-transport-runtime`, `provider-usage`, `provider-web-fetch`, `provider-web-fetch-contract`, `provider-web-search`, `provider-web-search-config-contract`, `provider-web-search-contract`, `qa-runner-runtime`, `realtime-bootstrap-context`, `realtime-transcription`, `realtime-voice`, `reply-reference`, `request-url`, `response-limit-runtime`, `retry-runtime`, `runtime-doctor`, `runtime-fetch`, `sandbox`, `secret-file-runtime`, `secure-random-runtime`, `session-binding-runtime`, `session-catalog`, `session-key-runtime`, `session-transcript-hit`, `session-transcript-runtime`, `session-visibility`, `simple-completion-runtime`, `speech`, `speech-core`, `sqlite-runtime`, `ssrf-dispatcher`, `string-normalization-runtime`, `system-event-runtime`, `talk-config-runtime`, `target-resolver-runtime`, `text-autolink-runtime`, `text-utility-runtime`, `thread-bindings-runtime`, `thread-bindings-session-runtime`, `time-runtime`, `tool-payload`, `tool-plugin`, `tool-results`, `transcripts`, `transport-ready-runtime`, `tts-runtime`, `types`, `video-generation`, `video-generation-core`, `video-generation-runtime`, `web-content-extractor`, `webhook-targets`, `windows-spawn` |
| `2026-08-15`  | Các trường hợp ngừng hỗ trợ tương thích trước đây     | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `2026-09-01`  | Các lần ngừng hỗ trợ tương thích trước đây     | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Tất cả plugin lõi đã được di chuyển. Các plugin bên ngoài nên di chuyển
trước bản phát hành chính tiếp theo. Chạy `pnpm plugins:boundary-report` để xem những
bản ghi tương thích nào sắp đến hạn nhất đối với các bề mặt mà plugin của bạn sử dụng.

## Tạm thời ẩn cảnh báo

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là một cơ chế thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng plugin đầu tiên của bạn
- [Tổng quan về SDK](/vi/plugins/sdk-overview) - tài liệu tham khảo đầy đủ về nhập đường dẫn con
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng plugin nhà cung cấp
- [Cơ chế nội bộ của plugin](/vi/plugins/architecture) - tìm hiểu chuyên sâu về kiến trúc
- [Tệp kê khai plugin](/vi/plugins/manifest) - tài liệu tham khảo về lược đồ tệp kê khai
