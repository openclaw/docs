---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã sử dụng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một Plugin sang kiến trúc Plugin hiện đại
    - Bạn duy trì một plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Di chuyển SDK Plugin
x-i18n:
    generated_at: "2026-07-20T04:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af65ffc5b71e5e2bfd3e54e6cfe80fd02a058dfa33646994386ab08ad583fbb0
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã thay thế một lớp tương thích ngược rộng bằng kiến trúc plugin
hiện đại được xây dựng từ các import nhỏ và tập trung. Nếu plugin của bạn có từ trước
thay đổi đó, hướng dẫn này sẽ giúp plugin chuyển sang các hợp đồng hiện tại.

## Những thay đổi

Trước đây, một số bề mặt import mở rộng cho phép plugin truy cập gần như mọi thứ
từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk`** và **`openclaw/plugin-sdk/compat`** - tái xuất
  hàng chục trình trợ giúp trong khi SDK tập trung đang được xây dựng. Cả hai gốc hiện đã
  bị loại bỏ; hãy import một đường dẫn con đã được ghi tài liệu để thay thế.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel rộng kết hợp các sự kiện
  hệ thống, trạng thái Heartbeat, hàng đợi phân phối, trình trợ giúp fetch/proxy, trình trợ giúp tệp,
  kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel cấu hình rộng chỉ được giữ lại
  trong khoảng thời gian tương thích sau đó; các trình trợ giúp tải/ghi trực tiếp lúc chạy
  đã bị loại bỏ.
- **`openclaw/extension-api`** - một cầu nối đã bị loại bỏ, từng cho phép plugin truy cập trực tiếp
  vào các trình trợ giúp phía máy chủ như trình chạy tác nhân nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook chỉ dành cho trình chạy nhúng
  đã bị loại bỏ, từng quan sát các sự kiện của trình chạy nhúng như `tool_result`. Thay vào đó, hãy dùng
  middleware kết quả công cụ của tác nhân (xem [Di chuyển các phần mở rộng kết quả công cụ nhúng
  sang middleware](#how-to-migrate)).

SDK gốc, barrel tương thích, cầu nối phần mở rộng và factory phần mở rộng nhúng
đã bị loại bỏ. `infra-runtime` và `config-runtime` chỉ còn tồn tại trong
các khoảng thời gian sau đó được ghi nhận riêng; plugin mới nên dùng các đường dẫn con tập trung.

<Warning>
  Các plugin import bề mặt gốc, tương thích hoặc phần mở rộng đã bị loại bỏ sẽ không còn
  tải được. Hãy làm theo các ánh xạ bên dưới trước khi nâng cấp.
</Warning>

OpenClaw không loại bỏ hoặc diễn giải lại hành vi plugin đã được ghi tài liệu trong cùng
thay đổi giới thiệu phương án thay thế. Các thay đổi hợp đồng gây phá vỡ trước tiên phải trải qua
bộ điều hợp tương thích, chẩn đoán, tài liệu và một khoảng thời gian ngừng hỗ trợ.
Điều này áp dụng cho các import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký lúc chạy.

### Lý do

- **Khởi động chậm** - việc import một trình trợ giúp đã tải hàng chục mô-đun không liên quan.
- **Phụ thuộc vòng** - các lần tái xuất rộng khiến chu trình import dễ
  phát sinh.
- **Bề mặt API không rõ ràng** - không có cách phân biệt các phần xuất ổn định với phần nội bộ.

Mỗi `openclaw/plugin-sdk/<subpath>` giờ đây là một mô-đun nhỏ, độc lập với
hợp đồng được ghi tài liệu.

Các bề mặt tiện ích nhà cung cấp cũ dành cho kênh đi kèm cũng đã bị loại bỏ -
các lối tắt trình trợ giúp mang thương hiệu kênh là tiện ích riêng của mono-repo, không phải
hợp đồng plugin ổn định. Thay vào đó, hãy dùng các đường dẫn con SDK chung và hẹp. Bên trong
không gian làm việc plugin đi kèm, hãy giữ các trình trợ giúp do nhà cung cấp sở hữu trong
`api.ts` hoặc `runtime-api.ts` của chính plugin đó:

- Anthropic giữ các trình trợ giúp luồng dành riêng cho Claude trong bề mặt `api.ts` /
  `contract-api.ts` của riêng mình.
- OpenAI giữ các trình dựng nhà cung cấp, trình trợ giúp mô hình mặc định và trình dựng nhà cung cấp
  thời gian thực trong `api.ts` của riêng mình.
- OpenRouter giữ trình dựng nhà cung cấp và các trình trợ giúp nhập môn/cấu hình trong
  `api.ts` của riêng mình.

## Chính sách tương thích

Công việc tương thích plugin bên ngoài tuân theo thứ tự sau:

1. Thêm hợp đồng mới.
2. Duy trì hành vi cũ thông qua bộ điều hợp tương thích.
3. Phát chẩn đoán hoặc cảnh báo nêu rõ đường dẫn cũ và phương án thay thế.
4. Kiểm thử cả hai đường dẫn.
5. Ghi tài liệu về việc ngừng hỗ trợ và lộ trình di chuyển.
6. Chỉ loại bỏ sau khoảng thời gian di chuyển đã công bố, thường là trong một bản phát hành
   lớn.

Nếu một trường manifest vẫn được chấp nhận, hãy tiếp tục sử dụng trường đó cho đến khi tài liệu và
chẩn đoán cho biết điều ngược lại. Mã mới nên ưu tiên phương án thay thế đã được ghi tài liệu;
plugin hiện có không nên bị hỏng trong các bản phát hành nhỏ thông thường.

Kiểm tra hàng đợi di chuyển hiện tại bằng `pnpm plugins:boundary-report`:

| Cờ                                                      | Tác dụng                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (hoặc `pnpm plugins:boundary-report:summary`) | Hiển thị số lượng rút gọn thay vì toàn bộ chi tiết.                             |
| `--json`                                                | Báo cáo có thể đọc bằng máy.                                                    |
| `--owner <id>`                                          | Lọc theo một plugin hoặc chủ sở hữu tương thích.                                |
| `--fail-on-cross-owner`                                 | Thoát với mã khác không khi có import SDK dành riêng giữa các chủ sở hữu.       |
| `--fail-on-eligible-compat`                             | Thoát với mã khác không khi ngày `removeAfter` của bản ghi tương thích đã ngừng hỗ trợ đã qua. |
| `--fail-on-unclassified-unused-reserved`                | Thoát với mã khác không khi có shim SDK dành riêng không được sử dụng.          |

`pnpm plugins:boundary-report:ci` chạy với cả ba cờ gây lỗi. Mỗi
bản ghi tương thích có một ngày `removeAfter` rõ ràng (không phải cụm từ mơ hồ "bản phát hành
lớn tiếp theo") - báo cáo nhóm các bản ghi đã ngừng hỗ trợ theo ngày đó, đếm
các tham chiếu mã/tài liệu cục bộ, chỉ ra các import SDK dành riêng giữa các chủ sở hữu và
tóm tắt cầu nối SDK máy chủ bộ nhớ riêng. Các đường dẫn con SDK dành riêng phải có
mức sử dụng của chủ sở hữu được theo dõi; các phần xuất dành riêng không được sử dụng nên bị loại bỏ khỏi
SDK công khai.

## Cách di chuyển

<Steps>
  <Step title="Di chuyển các trình trợ giúp tải/ghi cấu hình lúc chạy">
    Plugin đi kèm nên ngừng gọi trực tiếp `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được
    truyền vào đường dẫn gọi đang hoạt động. Các trình xử lý tồn tại lâu cần ảnh chụp nhanh
    hiện tại của tiến trình có thể dùng `api.runtime.config.current()`. Các công cụ tác nhân
    tồn tại lâu nên đọc `ctx.getRuntimeConfig()` bên trong `execute` để công cụ
    được tạo trước một lần ghi cấu hình vẫn thấy cấu hình đã làm mới.

    Việc ghi cấu hình đi qua trình trợ giúp giao dịch với chính sách
    sau khi ghi rõ ràng:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi thay đổi yêu cầu
    khởi động lại Gateway sạch và chỉ dùng `afterWrite: { mode: "none", reason: "..." }`
    khi bên gọi sở hữu bước tiếp theo và chủ ý vô hiệu hóa
    trình lập kế hoạch tải lại. Kết quả đột biến bao gồm bản tóm tắt `followUp` có kiểu cho
    kiểm thử và ghi nhật ký; Gateway vẫn chịu trách nhiệm áp dụng hoặc
    lên lịch khởi động lại.

    `loadConfig` và `writeConfigFile` đã bị loại bỏ khỏi môi trường
    chạy plugin. Plugin đi kèm và mã môi trường chạy của kho lưu trữ được bảo vệ bởi
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: việc sử dụng mới trong plugin sản xuất
    sẽ thất bại hoàn toàn, ghi cấu hình trực tiếp sẽ thất bại, các phương thức máy chủ Gateway phải dùng
    ảnh chụp nhanh môi trường chạy của yêu cầu, các trình trợ giúp gửi/hành động/máy khách của kênh lúc chạy
    phải nhận cấu hình từ ranh giới của chúng và các mô-đun môi trường chạy tồn tại lâu
    không cho phép bất kỳ lệnh gọi `loadConfig()` ngầm nào.

    Mã plugin mới nên tránh barrel `openclaw/plugin-sdk/config-runtime`
    rộng. Hãy dùng đường dẫn con hẹp cho từng tác vụ:

    | Nhu cầu | Import |
    | --- | --- |
    | Các kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Tra cứu cấu hình tại điểm vào plugin | `api.pluginConfig` |
    | Hợp nhất cấu hình | Logic cục bộ của plugin tại ranh giới cấu hình |
    | Đọc ảnh chụp nhanh môi trường chạy hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Trình trợ giúp kho lưu trữ phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Trình trợ giúp môi trường chạy cho chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải dữ liệu nhập bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè mô hình/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin đi kèm và kiểm thử của chúng được trình quét bảo vệ khỏi barrel rộng
    để các import và mock duy trì cục bộ theo hành vi cần thiết. Barrel
    vẫn tồn tại để tương thích bên ngoài, nhưng mã mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Di chuyển các phần mở rộng kết quả công cụ nhúng sang middleware">
    Plugin đi kèm phải thay thế các trình xử lý kết quả công cụ `api.registerEmbeddedExtensionFactory(...)`
    chỉ dành cho trình chạy nhúng bằng middleware
    không phụ thuộc môi trường chạy:

    ```typescript
    // Công cụ môi trường chạy OpenClaw và công cụ động của môi trường chạy Codex (kết quả có thể được
    // biến đổi). Kết quả công cụ gốc Codex cũng được chuyển tiếp để quan sát,
    // nhưng đầu ra đã biến đổi của chúng không bao giờ đến mô hình: hợp đồng hook
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

    Plugin đã cài đặt cũng có thể đăng ký middleware kết quả công cụ khi được
    bật rõ ràng và mọi môi trường chạy đích đều được khai báo trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài đặt
    nhưng chưa khai báo sẽ bị từ chối.

  </Step>

  <Step title="Di chuyển trình xử lý phê duyệt gốc sang dữ kiện năng lực">
    Plugin kênh hỗ trợ phê duyệt cung cấp hành vi phê duyệt gốc thông qua
    `approvalCapability.nativeRuntime` cùng registry ngữ cảnh môi trường chạy
    dùng chung:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`.
    - Chuyển xác thực/phân phối dành riêng cho phê duyệt khỏi hệ thống dây nối `plugin.auth` /
      `plugin.approvals` cũ sang `approvalCapability`.
    - `ChannelPlugin.approvals` đã bị loại bỏ khỏi hợp đồng
      plugin kênh công khai; chuyển các trường phân phối/gốc/kết xuất sang
      `approvalCapability`.
    - `plugin.auth` chỉ còn dành cho các luồng đăng nhập/đăng xuất kênh; lõi không còn
      đọc các hook xác thực phê duyệt tại đó.
    - Đăng ký các đối tượng môi trường chạy do kênh sở hữu (máy khách, token, ứng dụng Bolt)
      thông qua `openclaw/plugin-sdk/channel-runtime-context`.
    - Không gửi thông báo định tuyến lại do plugin sở hữu từ trình xử lý phê duyệt gốc;
      lõi sở hữu các thông báo đã định tuyến sang nơi khác dựa trên kết quả phân phối thực tế.
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, hãy cung cấp một
      bề mặt `createPluginRuntime().channel` thực sự - các stub không đầy đủ sẽ
      bị từ chối.

    Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins) để biết bố cục
    năng lực phê duyệt hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi dự phòng của trình bao bọc Windows">
    Nếu plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các trình bao bọc Windows
    `.cmd`/`.bat` không phân giải được giờ đây sẽ đóng khi lỗi trừ khi bạn truyền rõ ràng
    `allowShellFallback: true`:

    ```typescript
    // Trước
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sau
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Chỉ đặt giá trị này cho các bên gọi tương thích đáng tin cậy chủ ý
      // chấp nhận phương án dự phòng qua shell.
      allowShellFallback: true,
    });
    ```

    Nếu bên gọi của bạn không chủ ý phụ thuộc vào phương án dự phòng qua shell, đừng đặt
    `allowShellFallback` và thay vào đó hãy xử lý lỗi được ném ra.

  </Step>

  <Step title="Tìm các import đã ngừng hỗ trợ">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Thay thế bằng các import tập trung">
    Mỗi phần xuất từ bề mặt cũ ánh xạ đến một đường dẫn import hiện đại cụ thể:

    ```typescript
    // Trước đây (lớp tương thích ngược đã ngừng dùng)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sau này (các lệnh nhập hiện đại, tập trung)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Đối với các trình trợ giúp phía máy chủ, hãy dùng runtime Plugin được chèn thay vì
    nhập trực tiếp:

    ```typescript
    // Trước đây (cầu nối extension-api đã ngừng dùng)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Sau này (runtime được chèn)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Áp dụng cùng một mẫu cho các trình trợ giúp cầu nối cũ khác:

    | Lệnh nhập cũ | Thành phần tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | các trình trợ giúp kho lưu trữ phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay thế các lệnh nhập infra-runtime phạm vi rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để duy trì khả năng
    tương thích bên ngoài, nhưng mã mới nên nhập bề mặt tập trung mà mã đó thực sự
    cần:

    | Nhu cầu | Lệnh nhập |
    | --- | --- |
    | Các trình trợ giúp hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Các trình trợ giúp đánh thức, sự kiện và khả năng hiển thị của Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi phân phối đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Dữ liệu đo từ xa về hoạt động của kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ nhớ đệm chống trùng lặp trong bộ nhớ và có lớp lưu trữ bền vững hỗ trợ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Các trình trợ giúp đường dẫn tệp cục bộ/phương tiện an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Thao tác tìm nạp nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Các trình trợ giúp tìm nạp qua proxy và có biện pháp bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Các kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Các kiểu yêu cầu/giải quyết phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Các trình trợ giúp tải trọng phản hồi và lệnh phê duyệt | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Các trình trợ giúp định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của phương thức truyền tải | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Các trình trợ giúp token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Số lượng tác vụ bất đồng bộ chạy đồng thời có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Các xác nhận giá trị bắt buộc cho những bất biến có thể chứng minh | `openclaw/plugin-sdk/expect-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ trong tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các Plugin đi kèm được trình quét bảo vệ khỏi `infra-runtime`, vì vậy mã trong kho lưu trữ
    không thể quay lại barrel phạm vi rộng.

  </Step>

  <Step title="Di chuyển các trình trợ giúp định tuyến kênh">
    Mã định tuyến kênh mới sử dụng `openclaw/plugin-sdk/channel-route`. Các tên
    khóa định tuyến cũ vẫn được giữ dưới dạng bí danh tương thích:

    | Trình trợ giúp cũ | Trình trợ giúp hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Các trình trợ giúp định tuyến hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    một cách nhất quán trên phê duyệt gốc, chặn phản hồi, chống trùng lặp đầu vào,
    phân phối cron và định tuyến phiên.

    Không thêm cách sử dụng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    `resolveChannelRouteTargetWithParser(...)` từ
    `plugin-sdk/channel-route` — chúng đã ngừng dùng và chỉ còn được giữ cho các
    Plugin cũ. Các Plugin kênh mới nên sử dụng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa mã định danh đích
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

## Tham chiếu đường dẫn nhập

Bản đồ xuất gói công khai là nguồn đáng tin cậy cho các đường dẫn con SDK
có thể nhập. Hãy dùng các hướng dẫn SDK theo chủ đề được liên kết từ [tổng quan SDK](/vi/plugins/sdk-overview)
và ưu tiên đường dẫn con công khai được ghi tài liệu có phạm vi hẹp nhất. Danh mục của trình biên dịch trong
`scripts/lib/plugin-sdk-entrypoints.json` cũng chứa các mục riêng tư-cục bộ dùng
để xây dựng các Plugin đi kèm; sự hiện diện của chúng tại đó không biến chúng thành các thành phần xuất công khai của gói.

Bảng này là tập hợp con di chuyển thường dùng, không phải toàn bộ bề mặt SDK. Danh mục
điểm vào của trình biên dịch nằm trong `scripts/lib/plugin-sdk-entrypoints.json`;
các thành phần xuất của gói được tạo từ tập hợp con công khai.

Các đường nối trình trợ giúp dành riêng cho Plugin đi kèm đã bị loại bỏ khỏi bản đồ
xuất SDK công khai, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng, chẳng hạn như
shim `plugin-sdk/discord` đã ngừng dùng nhưng được giữ lại cho các Plugin bên ngoài vẫn
nhập trực tiếp gói `@openclaw/discord` đã phát hành. Các trình trợ giúp dành riêng cho chủ sở hữu
nằm trong gói Plugin sở hữu chúng; hành vi máy chủ dùng chung được chuyển
qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` và API Plugin được chèn.

Hãy dùng lệnh nhập có phạm vi hẹp nhất phù hợp với công việc. Nếu không tìm thấy thành phần xuất,
hãy kiểm tra mã nguồn tại `src/plugin-sdk/` hoặc hỏi người bảo trì xem hợp đồng
chung nào nên sở hữu thành phần đó.

## Các bề mặt tương thích đã bị loại bỏ

Đợt rà soát tháng 7 năm 2026 đã loại bỏ SDK gốc và các barrel compat, cầu nối API
tiện ích mở rộng, các bí danh đường dẫn con SDK đã hết hạn, các đường dẫn con SDK không dùng đến và các
thành phần xuất công khai của những mô-đun SDK chỉ dành cho Plugin đi kèm. Các mô-đun chỉ dành cho Plugin đi kèm vẫn khả dụng cho
chủ sở hữu của chúng trong kho lưu trữ thông qua ánh xạ bản dựng riêng tư-cục bộ; chúng không thể được
nhập từ gói đã phát hành.

### Công bố nhà cung cấp API toàn cục trong tiến trình

`registerApiProvider(...)` và `unregisterApiProviders(...)` đã bị loại bỏ khỏi
`openclaw/plugin-sdk/llm`. Chúng công bố các phương thức truyền tải API vào trạng thái
toàn cục trong tiến trình, khiến các runtime mô hình do vòng đời sở hữu sau đó phải sao chép chúng vào từng
registry đã chuẩn bị.

Các Plugin nhà cung cấp nên đăng ký nhà cung cấp suy luận văn bản thông qua
`api.registerProvider(...)`. Mã và kiểm thử do máy chủ sở hữu tạo
`ApiRegistry` nên đăng ký trực tiếp trên registry đó để quyền sở hữu
nhà cung cấp và quá trình tháo dỡ vẫn nằm trong phạm vi của runtime đã chuẩn bị.

### Barrel kiểm thử riêng tư

`openclaw/plugin-sdk/testing` chỉ dùng cục bộ trong kho lưu trữ và bị loại khỏi các thành phần tạo tác
của gói đã phát hành, vì vậy thành phần này đã bị loại bỏ trước ngày `removeAfter` 2026-07-28. Các kiểm thử trong kho lưu trữ
sử dụng các đường dẫn con tập trung như `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` và `plugin-sdk/test-fixtures`.

## Tham chiếu di chuyển

Các ánh xạ này bao gồm cả những bề mặt bị loại bỏ vào tháng 7 năm 2026 và các
thành phần đã ngừng dùng nhưng vẫn hoạt động trong khoảng thời gian sau đó. Một ánh xạ là hướng dẫn di chuyển, không phải bằng chứng cho thấy
bề mặt cũ vẫn khả dụng; hãy tham khảo registry tương thích và tiến trình
loại bỏ để biết trạng thái hiện tại.

<AccordionGroup>
  <Accordion title="trình tạo trợ giúp command-auth -> command-status">
    **Cũ (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Mới (`openclaw/plugin-sdk/command-status`)**: cùng chữ ký, được nhập
    từ đường dẫn con hẹp hơn. Các thành phần tái xuất tương thích `command-auth`
    đã bị loại bỏ.

    ```typescript
    // Trước đây
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Sau này
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Các trình trợ giúp kiểm soát lượt đề cập -> resolveInboundMentionDecision">
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
    `openclaw/plugin-sdk/channel-runtime` đã bị loại bỏ. Hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các trình trợ giúp lược đồ tin nhắn gốc trong `openclaw/plugin-sdk/channel-actions`
    đã bị loại bỏ cùng với các thành phần xuất hành động thô của kênh. Thay vào đó, hãy cung cấp các khả năng
    thông qua bề mặt ngữ nghĩa `presentation` — các Plugin kênh
    khai báo nội dung chúng kết xuất (thẻ, nút, trình chọn), thay vì tên
    hành động thô mà chúng chấp nhận.

  </Accordion>

  <Accordion title="Trình trợ giúp tool() của nhà cung cấp tìm kiếm web -> createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai trực tiếp `createTool(...)` trên Plugin nhà cung cấp.
    OpenClaw không còn cần trình trợ giúp SDK để đăng ký trình bao bọc công cụ.

  </Accordion>

  <Accordion title="Phong bì kênh dạng văn bản thuần -> BodyForAgent">
    **Cũ**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (và trường
    `channelEnvelope` trên các đối tượng tin nhắn đầu vào) để xây dựng phong bì
    lời nhắc văn bản thuần dạng phẳng từ tin nhắn kênh đầu vào.

    **Mới**: `BodyForAgent` cùng các khối ngữ cảnh người dùng có cấu trúc. Các Plugin
    kênh đính kèm siêu dữ liệu định tuyến (luồng, chủ đề, phản hồi đến, biểu cảm) dưới dạng
    trường có kiểu thay vì nối chúng vào chuỗi lời nhắc. Trình trợ giúp
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các phong bì tổng hợp
    hướng đến trợ lý, nhưng phong bì văn bản thuần đầu vào đang dần bị
    loại bỏ.

    Các khu vực bị ảnh hưởng: `inbound_claim`, `message_received` và mọi Plugin
    kênh tùy chỉnh đã hậu xử lý văn bản phong bì cũ.

  </Accordion>

  <Accordion title="hook deactivate -> gateway_stop">
    **Cũ**: `api.on("deactivate", handler)`.

    **Mới**: `api.on("gateway_stop", handler)`. Cùng hợp đồng dọn dẹp khi tắt;
    chỉ tên hook thay đổi.

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

    `deactivate` vẫn được nối dây dưới dạng bí danh tương thích đã ngừng dùng cho đến khi bị
    loại bỏ sau 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning -> liên kết luồng của lõi">
    **Cũ**: `api.on("subagent_spawning", handler)` trả về
    `threadBindingReady` hoặc `deliveryOrigin`.

    **Mới**: để lõi chuẩn bị các liên kết tác tử con `thread: true` thông qua
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` chỉ còn được giữ dưới dạng
    bề mặt tương thích đã ngừng dùng trong khi các Plugin bên ngoài di chuyển và sẽ bị loại bỏ
    sau 2026-08-30.

  </Accordion>

  <Accordion title="Các kiểu khám phá nhà cung cấp -> các kiểu danh mục nhà cung cấp">
    Bốn bí danh kiểu khám phá hiện là các trình bao bọc mỏng quanh những kiểu của
    thời kỳ danh mục:

    | Bí danh cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Các bí danh và túi tĩnh `ProviderCapabilities` cũ đã bị
    loại bỏ. Các Plugin nhà cung cấp
    nên sử dụng các hook nhà cung cấp rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas` và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Các hook chính sách suy luận -> resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về một
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn và một
    danh sách cấp độ được xếp hạng. OpenClaw tự động hạ cấp các giá trị cũ đã lưu
    theo thứ hạng hồ sơ.

    Ngữ cảnh bao gồm các dữ kiện `provider`, `modelId`, `reasoning` đã hợp nhất tùy chọn
    và `compat` mô hình đã hợp nhất tùy chọn. Các plugin nhà cung cấp có thể dùng những
    dữ kiện danh mục đó để chỉ cung cấp hồ sơ dành riêng cho mô hình khi hợp đồng
    yêu cầu đã cấu hình hỗ trợ hồ sơ đó.

    Triển khai một hook thay vì ba. Các hook cũ đã bị loại bỏ.

  </Accordion>

  <Accordion title="Nhà cung cấp xác thực bên ngoài -> contracts.externalAuthProviders">
    **Cũ**: triển khai các hook xác thực bên ngoài mà không khai báo nhà cung cấp
    trong manifest của plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest của plugin
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

    **Mới**: sao chép cùng cơ chế tra cứu biến môi trường vào `setup.providers[].envVars`
    trong manifest. Việc này hợp nhất siêu dữ liệu môi trường thiết lập/trạng thái tại một nơi
    và tránh phải khởi động runtime của plugin chỉ để xử lý tra cứu biến môi trường.

    `providerAuthEnvVars` không còn được chấp nhận.

  </Accordion>

  <Accordion title="Đăng ký plugin bộ nhớ -> registerMemoryCapability">
    **Cũ**: ba lệnh gọi riêng biệt - `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Mới**: một lệnh gọi trên API trạng thái bộ nhớ -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Các vị trí như cũ, một lệnh gọi đăng ký duy nhất. Các trình trợ giúp bổ sung cho lời nhắc và kho ngữ liệu
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) không
    bị ảnh hưởng.

  </Accordion>

  <Accordion title="API nhà cung cấp embedding cho bộ nhớ">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cùng với
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cùng với
    `contracts.embeddingProviders`.

    Hợp đồng nhà cung cấp embedding chung có thể tái sử dụng bên ngoài bộ nhớ và là
    phương thức được hỗ trợ cho các nhà cung cấp mới. API đăng ký dành riêng cho bộ nhớ
    vẫn được kết nối dưới dạng tương thích không còn khuyến nghị trong khi các nhà cung cấp hiện có
    di chuyển. Hoạt động kiểm tra plugin báo cáo việc sử dụng không đi kèm gói là
    nợ tương thích.

  </Accordion>

  <Accordion title="Kết quả gửi kênh thô -> OutboundDeliveryResult">
    **Cũ**: trả về `{ ok, messageId, error }` thông qua
    `ChannelSendRawResult` và chuẩn hóa bằng
    `createRawChannelSendResultAdapter(...)`.

    **Mới**: trả về các trường `OutboundDeliveryResult` và đính kèm kênh bằng
    `createAttachedChannelResultAdapter(...)`. Các lần gửi thất bại phải phát sinh ngoại lệ thay vì
    trả về chuỗi lỗi. Kiểu kết quả thô vẫn khả dụng cho đến
    bản phát hành lớn tiếp theo của plugin-SDK.

  </Accordion>

  <Accordion title="Đổi tên các kiểu thông báo phiên subagent">
    Hai bí danh kiểu cũ vẫn được xuất từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` không còn được khuyến nghị; hãy dùng
    `getSessionMessages`. Chữ ký giữ nguyên; phương thức cũ chuyển tiếp lệnh gọi sang
    phương thức mới.

  </Accordion>

  <Accordion title="Các API tệp phiên và bản chép lời đã bị loại bỏ">
    Việc chuyển phiên/bản chép lời sang SQLite loại bỏ hoặc đánh dấu không còn khuyến nghị các API dành cho plugin
    từng cung cấp kho `sessions.json` đang hoạt động, đường dẫn bản chép lời JSONL hoặc danh sách
    tệp phiên. Các plugin runtime nên dùng danh tính phiên và các trình trợ giúp runtime của SDK
    thay vì phân giải hoặc sửa đổi các tệp đang hoạt động.

    | Bề mặt cần di chuyển | Phương án thay thế |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` và `resolveSessionStoreEntry(...)` không còn được khuyến nghị | `getSessionEntry(...)`, `listSessionEntries(...)` và các thao tác sửa đổi phiên ở cấp hàng. |
    | `resolveSessionFilePath(...)` không còn được khuyến nghị | Danh tính phiên (`sessionKey`, `sessionId` và các trình trợ giúp đích runtime của SDK) cùng với các phương thức Gateway hoạt động trên phiên hiện tại. |
    | `saveSessionStore(...)` đã bị loại bỏ | Các API runtime phiên do Gateway sở hữu; mã plugin nên yêu cầu hoặc sửa đổi trạng thái phiên thông qua các trình trợ giúp runtime/ngữ cảnh đã được ghi tài liệu thay vì ghi vào tệp kho đang hoạt động. |
    | `resolveSessionTranscriptPathInDir(...)` và `resolveAndPersistSessionFile(...)` đã bị loại bỏ | Danh tính phiên và các phương thức Gateway hoạt động trên phiên hiện tại. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Các trình đọc bản chép lời dựa trên danh tính do ngữ cảnh runtime hiện tại cung cấp, hoặc các phương thức lịch sử/phiên của Gateway khi plugin nằm ngoài đường dẫn chủ sở hữu bản chép lời. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` với `agentId`, `sessionKey` và `sessionId`. |
    | Đầu vào đồng bộ bộ nhớ như `sessionFiles` | Các nguồn bản chép lời/phiên dựa trên danh tính do máy chủ cung cấp; không dò quét các tệp JSONL đang hoạt động cho phiên trực tiếp. |
    | Các tùy chọn runtime có tên `transcriptPath` hoặc `sessionFile` cho phiên đang hoạt động | Các đối tượng `sessionTarget`/đích runtime mang danh tính phiên trung lập với phương thức lưu trữ. |

    Các tệp bản chép lời JSONL cũ vẫn hợp lệ dưới dạng hiện vật nhập, lưu trữ, xuất và
    hỗ trợ. Chúng không còn là hợp đồng runtime ổn định cho
    các phiên đang hoạt động.

    Các plugin chính thức được phát hành cùng `v2026.7.1-beta.5` đã nhập bốn
    trình trợ giúp không còn được khuyến nghị ở trên. `openclaw/plugin-sdk/session-store-runtime` duy trì
    chính xác cầu nối đó đến hết 2026-10-12; các plugin mới phải dùng phương án thay thế.
    `resolveStorePath(...)` vẫn là một trình trợ giúp SDK được hỗ trợ và không thuộc
    phạm vi ngừng hỗ trợ này.

    `openclaw plugins inspect --all --runtime` báo cáo các plugin không đi kèm gói có
    lỗi tải hoặc chẩn đoán vẫn tham chiếu đến các API tệp đã bị loại bỏ này. Đợt quét tư vấn
    `@openclaw/plugin-inspector` phải dùng phiên bản `0.3.17` trở lên
    để quá trình quét gói bên ngoài cũng gắn cờ các trình trợ giúp phiên toàn kho,
    trình trợ giúp đường dẫn tệp phiên, đích tệp bản chép lời cũ và các trình trợ giúp
    bản chép lời cấp thấp trước khi phát hành.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một trình truy cập luồng tác vụ
    trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` duy trì runtime sửa đổi TaskFlow được quản lý
    cho các plugin tạo, cập nhật, hủy hoặc chạy tác vụ con từ một
    luồng. Dùng `runtime.tasks.flows` khi plugin chỉ cần
    thao tác đọc dựa trên DTO.

    ```typescript
    // Trước
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Sau
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Các bí danh cũ đã bị loại bỏ vào tháng 7 năm 2026.

  </Accordion>

  <Accordion title="Factory tiện ích mở rộng nhúng -> middleware kết quả công cụ của agent">
    Đã trình bày trong phần [Cách di chuyển](#how-to-migrate) ở trên. Nội dung này được đưa vào đây để
    đầy đủ: đường dẫn `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho trình chạy nhúng đã bị loại bỏ
    được thay thế bằng `api.registerAgentToolResultMiddleware(...)` với danh sách runtime rõ ràng
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Bí danh OpenClawSchemaType -> OpenClawConfig">
    Bí danh SDK gốc `OpenClawSchemaType` đã bị loại bỏ. Dùng tên chuẩn
    `OpenClawConfig`.

    ```typescript
    // Trước
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Sau
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các nội dung không còn được khuyến nghị ở cấp tiện ích mở rộng (bên trong các plugin kênh/nhà cung cấp đi kèm gói thuộc
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng. Chúng không ảnh hưởng đến hợp đồng plugin của bên thứ ba và không được liệt kê
ở đây. Nếu sử dụng trực tiếp barrel cục bộ của một plugin đi kèm gói, hãy đọc
các nhận xét về nội dung không còn được khuyến nghị trong barrel đó trước khi nâng cấp.
</Note>

## Di chuyển Talk và giọng nói thời gian thực

Mã giọng nói thời gian thực, điện thoại, cuộc họp và Talk trên trình duyệt dùng chung một trình điều khiển
phiên Talk được xuất bởi `openclaw/plugin-sdk/realtime-voice`. Trình điều khiển
sở hữu phong bì sự kiện Talk chung, trạng thái lượt đang hoạt động, trạng thái thu âm,
trạng thái âm thanh đầu ra, lịch sử sự kiện gần đây và cơ chế từ chối lượt cũ.
Các plugin nhà cung cấp sở hữu phiên thời gian thực dành riêng cho nhà cung cấp. Các plugin cuộc họp trên trình duyệt
dùng `openclaw/plugin-sdk/meeting-runtime` cho cơ chế phiên, trình duyệt, âm thanh, máy chủ node,
tư vấn agent và cuộc gọi thoại, sau đó triển khai `MeetingPlatformAdapter`
cho quy tắc URL, tập lệnh DOM, ánh xạ thao tác thủ công, phụ đề, tạo cuộc họp và kế hoạch
quay số tham gia. API REST nền tảng, OAuth, hiện vật, bộ chọn và tên trên đường truyền vẫn nằm trong
plugin. Kế hoạch quyền của trình duyệt nhận URL cuộc họp được yêu cầu để mỗi
nền tảng chỉ có thể cấp quyền cho chính xác các nguồn được hỗ trợ. Runtime phiên cũng phải
chuẩn hóa tình trạng hoạt động trực tiếp dành riêng cho nền tảng sau khi xác nhận rời trình duyệt;
các trường bản chép lời lịch sử có thể được giữ lại, nhưng trạng thái sẵn sàng của phụ đề và âm thanh
không được tiếp tục hoạt động sau khi rời đi.

Tất cả bề mặt đi kèm gói đều chạy trên trình điều khiển dùng chung: chuyển tiếp trình duyệt,
chuyển giao phòng được quản lý, thời gian thực của cuộc gọi thoại, STT phát trực tuyến của cuộc gọi thoại, thời gian thực của Google
Meet và nhấn để nói nguyên bản. Gateway quảng bá một kênh sự kiện Talk trực tiếp
trong `hello-ok.features.events`: `talk.event`.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi
triển khai bộ điều hợp cấp thấp hoặc fixture kiểm thử. Hãy dùng trình điều khiển dùng chung để
các sự kiện theo phạm vi lượt không thể được phát mà thiếu id lượt, các lệnh gọi `turnEnd` /
`turnCancel` cũ không thể xóa một lượt đang hoạt động mới hơn và các sự kiện
vòng đời âm thanh đầu ra luôn nhất quán trên điện thoại, cuộc họp, chuyển tiếp trình duyệt,
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

Các phiên WebRTC/websocket nhà cung cấp do trình duyệt sở hữu dùng `talk.client.create`,
vì trình duyệt sở hữu việc thương lượng với nhà cung cấp và truyền tải phương tiện, còn
Gateway sở hữu thông tin xác thực, chỉ dẫn và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho thời gian thực qua gateway-relay, phiên chép lời qua gateway-relay
và các phiên STT/TTS nguyên bản trong phòng được quản lý.

Các cấu hình cũ đặt bộ chọn thời gian thực cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime
không diễn giải lại cấu hình nhà cung cấp giọng nói/TTS thành cấu hình nhà cung cấp thời gian thực.

Các tổ hợp `talk.session.create` được hỗ trợ được chủ ý giới hạn:

| Chế độ            | Phương thức truyền tải       | Bộ não           | Thành phần sở hữu              | Ghi chú                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh song công toàn phần của nhà cung cấp được chuyển tiếp qua Gateway; các lệnh gọi công cụ được định tuyến qua công cụ agent-consult.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ truyền phát STT; bên gọi gửi âm thanh đầu vào và nhận các sự kiện bản chép lời.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu nhấn để nói và bộ đàm, trong đó client quản lý việc thu/phát và Gateway quản lý trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho quản trị viên trên các bề mặt bên thứ nhất đáng tin cậy thực thi trực tiếp các hành động công cụ của Gateway.                  |

Bản đồ phương thức dành cho người đọc đang di chuyển từ các nhóm `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` cũ (đều đã bị xóa):

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

Tập thuật ngữ điều khiển hợp nhất cũng được chủ ý giới hạn:

| Phương thức                          | Áp dụng cho                                              | Hợp đồng                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Nối thêm một đoạn âm thanh PCM mã hóa base64 vào phiên nhà cung cấp thuộc sở hữu của cùng kết nối Gateway.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu lượt người dùng trong phòng được quản lý.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt lỗi thời.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                              | Hủy tác vụ thu âm/nhà cung cấp/agent/TTS đang hoạt động của một lượt.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất lệnh gọi công cụ của nhà cung cấp sau mọi bước hoàn thành bất đồng bộ được bridge của nhà cung cấp cung cấp; truyền `options.willContinue` cho đầu ra tạm thời hoặc, khi được hỗ trợ, `options.suppressResponse` để tránh một phản hồi khác từ trợ lý. |
| `talk.session.steer`            | các phiên Talk được agent hỗ trợ                              | Gửi điều khiển bằng lời nói `status`, `steer`, `cancel` hoặc `followup` đến lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                                                                                 |
| `talk.session.close`            | tất cả phiên hợp nhất                                    | Dừng các phiên chuyển tiếp hoặc thu hồi trạng thái phòng được quản lý, sau đó quên id phiên hợp nhất.                                                                                                                                     |

Không đưa các trường hợp đặc biệt theo nhà cung cấp hoặc nền tảng vào core để tính năng này hoạt động.
Core sở hữu ngữ nghĩa phiên Talk. Các plugin nhà cung cấp sở hữu việc thiết lập phiên của nhà cung cấp.
Voice-call và Google Meet sở hữu các adapter điện thoại/cuộc họp. Trình duyệt và ứng dụng
native sở hữu UX thu/phát trên thiết bị.

## Lịch trình loại bỏ

| Thời điểm                                        | Điều xảy ra                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Hiện tại**                                     | Các bề mặt đã ngừng dùng có khả năng cảnh báo sẽ phát cảnh báo khi chạy; các cơ chế bảo vệ của kho lưu trữ từ chối import SDK đã ngừng dùng từ core và các plugin đi kèm. |
| **Ngày `removeAfter` của từng bản ghi tương thích** | Bề mặt cụ thể đó đủ điều kiện để bị loại bỏ; `pnpm plugins:boundary-report --fail-on-eligible-compat` làm Pipeline CI thất bại sau khi ngày này trôi qua.    |
| **Bản phát hành lớn tiếp theo**                      | Mọi bề mặt vẫn chưa được di chuyển sẽ bị loại bỏ; các plugin vẫn sử dụng chúng sẽ gặp lỗi.                                                          |

Các đường dẫn con SDK công khai còn lại bên dưới có thời hạn loại bỏ được registry hỗ trợ.
Các hàng ngày 30 tháng 7 đã bị loại bỏ sau đợt rà soát sớm được người bảo trì cho phép:
các đường dẫn con không được sử dụng đã bị xóa, các bí danh tương thích trước đó đã bị xóa và
các mô-đun chỉ dành cho bản đi kèm đã được hạ xuống thành ánh xạ bản dựng cục bộ riêng tư.

| `removeAfter` | Bậc                               | Đường dẫn con SDK                                                                                                                                                           |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Các mục ngừng dùng tương thích trước đó | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Các mục ngừng dùng tương thích trước đó | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Tất cả plugin core đã được di chuyển. Các plugin bên ngoài nên di chuyển
trước bản phát hành lớn tiếp theo. Chạy `pnpm plugins:boundary-report` để xem các
bản ghi tương thích nào sắp đến hạn nhất đối với những bề mặt mà plugin của bạn sử dụng.

## Tạm thời tắt các cảnh báo

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng plugin đầu tiên của bạn
- [Tổng quan về SDK](/vi/plugins/sdk-overview) - tài liệu tham khảo đầy đủ về import đường dẫn con
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng plugin nhà cung cấp
- [Nội bộ Plugin](/vi/plugins/architecture) - tìm hiểu chuyên sâu về kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) - tài liệu tham khảo lược đồ manifest
