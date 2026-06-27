---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã sử dụng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một Plugin sang kiến trúc Plugin hiện đại
    - Bạn bảo trì một Plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Di chuyển Plugin SDK
x-i18n:
    generated_at: "2026-06-27T17:58:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang kiến trúc plugin hiện đại với các import tập trung, có tài liệu rõ ràng. Nếu plugin của bạn được xây dựng trước kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Điều gì đang thay đổi

Hệ thống plugin cũ cung cấp hai bề mặt mở rộng cho phép plugin import mọi thứ cần thiết từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất tái xuất hàng chục helper. Nó được giới thiệu để giữ cho các plugin dựa trên hook cũ tiếp tục hoạt động trong khi kiến trúc plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel helper runtime rộng, trộn lẫn sự kiện hệ thống, trạng thái heartbeat, hàng đợi phân phối, helper fetch/proxy, helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng vẫn còn mang các helper tải/ghi trực tiếp đã lỗi thời trong thời gian di chuyển.
- **`openclaw/extension-api`** - một cầu nối cho phép plugin truy cập trực tiếp các helper phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook extension đóng gói chỉ dành cho embedded-runner đã bị gỡ bỏ, từng có thể quan sát các sự kiện embedded-runner như `tool_result`.

Các bề mặt import rộng hiện đã **bị ngừng khuyến nghị**. Chúng vẫn hoạt động ở runtime, nhưng plugin mới không được dùng chúng, và plugin hiện có nên di chuyển trước khi bản phát hành major tiếp theo gỡ bỏ chúng. API đăng ký extension factory chỉ dành cho embedded-runner đã bị gỡ bỏ; hãy dùng middleware tool-result thay thế.

OpenClaw không gỡ bỏ hoặc diễn giải lại hành vi plugin đã được tài liệu hóa trong cùng thay đổi giới thiệu phần thay thế. Các thay đổi phá vỡ hợp đồng trước tiên phải đi qua adapter tương thích, chẩn đoán, tài liệu và một khoảng thời gian ngừng khuyến nghị. Điều đó áp dụng cho SDK import, trường manifest, API thiết lập, hook và hành vi đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị gỡ bỏ trong một bản phát hành major trong tương lai.
  Plugin vẫn import từ các bề mặt này sẽ bị hỏng khi điều đó xảy ra.
  Các đăng ký embedded extension factory kế thừa hiện đã không còn được tải.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** - import một helper đã tải hàng chục module không liên quan
- **Phụ thuộc vòng** - các tái xuất rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách nào biết export nào là ổn định và export nào là nội bộ

SDK plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`) là một module nhỏ, độc lập, có mục đích rõ ràng và hợp đồng được tài liệu hóa.

Các seam tiện ích provider kế thừa cho những kênh đóng gói cũng đã bị gỡ bỏ.
Các seam helper mang thương hiệu kênh là shortcut riêng trong mono-repo, không phải hợp đồng plugin ổn định. Thay vào đó hãy dùng các subpath SDK generic hẹp. Bên trong workspace plugin đóng gói, giữ helper thuộc sở hữu provider trong `api.ts` hoặc `runtime-api.ts` của chính plugin đó.

Ví dụ provider đóng gói hiện tại:

- Anthropic giữ các helper stream riêng cho Claude trong seam `api.ts` /
  `contract-api.ts` của chính nó
- OpenAI giữ provider builder, helper model mặc định và realtime provider
  builder trong `api.ts` của chính nó
- OpenRouter giữ provider builder và helper onboarding/cấu hình trong `api.ts` của chính nó

## Kế hoạch di chuyển Talk và giọng nói thời gian thực

Mã Talk cho giọng nói thời gian thực, điện thoại, cuộc họp và trình duyệt đang chuyển từ ghi sổ lượt cục bộ theo bề mặt sang một bộ điều khiển phiên Talk dùng chung được export bởi `openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu phong bì sự kiện Talk chung, trạng thái lượt đang hoạt động, trạng thái capture, trạng thái output-audio, lịch sử sự kiện gần đây và việc từ chối lượt đã cũ. Plugin provider nên tiếp tục sở hữu các phiên thời gian thực riêng của nhà cung cấp; plugin bề mặt nên tiếp tục sở hữu các khác biệt về capture, playback, điện thoại và cuộc họp.

Quá trình di chuyển Talk này cố ý phá vỡ sạch sẽ:

1. Giữ các primitive controller/runtime dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt đóng gói sang bộ điều khiển dùng chung: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime và native push-to-talk.
3. Thay thế các họ RPC Talk cũ bằng API cuối cùng `talk.session.*` và
   `talk.client.*`.
4. Quảng bá một kênh sự kiện Talk live trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP realtime cũ và mọi đường dẫn ghi đè instruction theo thời điểm request.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi đang triển khai adapter cấp thấp hoặc test fixture. Ưu tiên bộ điều khiển dùng chung để sự kiện theo phạm vi lượt không thể được phát ra nếu không có turn id, các lệnh gọi `turnEnd` /
`turnCancel` đã cũ không thể xóa một lượt đang hoạt động mới hơn, và các sự kiện vòng đời output-audio luôn nhất quán trên điện thoại, cuộc họp, browser relay, managed-room handoff và client Talk native.

Hình dạng API công khai mục tiêu là:

```typescript
// Gateway-owned Talk session API.
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

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Các phiên WebRTC/provider-websocket do trình duyệt sở hữu dùng `talk.client.create`, vì trình duyệt sở hữu thương lượng provider và truyền tải media trong khi Gateway sở hữu thông tin xác thực, instruction và chính sách tool. `talk.session.*` là bề mặt chung do Gateway quản lý cho gateway-relay realtime, gateway-relay transcription và các phiên STT/TTS native managed-room.

Các cấu hình kế thừa đặt bộ chọn realtime bên cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk ở runtime không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider realtime.

Các kết hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Transport       | Brain           | Chủ sở hữu         | Ghi chú                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh provider song công được nối qua Gateway; các lệnh gọi tool được định tuyến qua tool agent-consult.        |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ streaming STT; caller gửi âm thanh đầu vào và nhận sự kiện transcript.                                         |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie, nơi client sở hữu capture/playback và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt first-party đáng tin cậy thực thi trực tiếp hành động tool Gateway. |

Bản đồ method đã gỡ bỏ:

| Cũ                               | Mới                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Từ vựng điều khiển hợp nhất cũng được cố ý giữ hẹp:

  | Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                                                                                                                                             |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Nối một đoạn âm thanh PCM base64 vào phiên nhà cung cấp thuộc sở hữu của cùng kết nối Gateway.                                                                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng managed-room.                                                                                                                                                                            |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt cũ.                                                                                                                                                              |
  | `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                          | Hủy công việc capture/nhà cung cấp/agent/TTS đang hoạt động cho một lượt.                                                                                                                                            |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                                                        |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lệnh gọi công cụ của nhà cung cấp do relay phát ra; truyền `options.willContinue` cho đầu ra tạm thời hoặc `options.suppressResponse` để đáp ứng lệnh gọi mà không có phản hồi trợ lý khác. |
  | `talk.session.steer`            | các phiên Talk được agent hỗ trợ                        | Gửi điều khiển bằng lời nói `status`, `steer`, `cancel`, hoặc `followup` tới lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                                                            |
  | `talk.session.close`            | tất cả phiên hợp nhất                                   | Dừng các phiên relay hoặc thu hồi trạng thái managed-room, rồi quên id phiên hợp nhất.                                                                                                                               |

  Không đưa các trường hợp đặc biệt theo nhà cung cấp hoặc nền tảng vào phần lõi để làm việc này.
  Phần lõi sở hữu ngữ nghĩa phiên Talk. Plugin nhà cung cấp sở hữu phần thiết lập phiên của nhà cung cấp.
  Cuộc gọi thoại và Google Meet sở hữu các bộ chuyển đổi điện thoại/họp. Trình duyệt và ứng dụng gốc
  sở hữu UX thu/phát thiết bị.

  ## Chính sách tương thích

  Với Plugin bên ngoài, công việc tương thích tuân theo thứ tự này:

  1. thêm hợp đồng mới
  2. giữ hành vi cũ được nối qua một bộ chuyển đổi tương thích
  3. phát một chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
  4. bao phủ cả hai đường dẫn trong kiểm thử
  5. ghi lại lộ trình ngừng hỗ trợ và di trú trong tài liệu
  6. chỉ gỡ bỏ sau khoảng thời gian di trú đã công bố, thường trong một bản phát hành lớn

  Maintainer có thể kiểm tra hàng đợi di trú hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để có
  số lượng gọn, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi một cổng CI cần thất bại trên các bản ghi
  tương thích đã đến hạn, import SDK dành riêng xuyên chủ sở hữu, hoặc các
  đường dẫn con SDK dành riêng không dùng. Báo cáo nhóm các bản ghi
  tương thích đã ngừng hỗ trợ theo ngày gỡ bỏ, đếm tham chiếu mã/tài liệu cục bộ,
  làm nổi bật các import SDK dành riêng xuyên chủ sở hữu, và tóm tắt cầu nối SDK
  memory-host riêng tư để việc dọn dẹp tương thích luôn rõ ràng thay vì
  dựa vào các tìm kiếm tùy tiện. Các đường dẫn con SDK dành riêng phải có theo dõi sử dụng theo chủ sở hữu;
  các export helper dành riêng không dùng nên được gỡ khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng nó cho đến khi
  tài liệu và chẩn đoán nói khác đi. Mã mới nên ưu tiên phần thay thế đã được ghi trong tài liệu,
  nhưng Plugin hiện có không nên bị hỏng trong các bản phát hành nhỏ thông thường.

  ## Cách di trú

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin được bundled nên ngừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên config đã được
    truyền vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần
    snapshot tiến trình hiện tại có thể dùng `api.runtime.config.current()`. Các
    công cụ agent tồn tại lâu nên dùng `ctx.getRuntimeConfig()` của ngữ cảnh công cụ bên trong
    `execute` để một công cụ được tạo trước một lần ghi config vẫn thấy
    config runtime đã được làm mới.

    Các lần ghi config phải đi qua helper giao dịch và chọn một
    chính sách sau ghi:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi caller biết
    thay đổi yêu cầu khởi động lại gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi caller sở hữu
    phần theo sau và chủ ý muốn chặn reload planner.
    Kết quả mutation bao gồm tóm tắt `followUp` có kiểu cho kiểm thử và ghi log;
    gateway vẫn chịu trách nhiệm áp dụng hoặc lên lịch khởi động lại.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng hỗ trợ
    cho Plugin bên ngoài trong khoảng thời gian di trú và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Plugin được bundled và mã runtime
    trong repo được bảo vệ bằng rào chắn scanner trong
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: việc sử dụng Plugin production mới
    thất bại hoàn toàn, các lần ghi config trực tiếp thất bại, phương thức server gateway phải dùng
    snapshot runtime của request, helper gửi/hành động/client của kênh runtime
    phải nhận config từ ranh giới của chúng, và module runtime tồn tại lâu có
    đúng không lần gọi ambient `loadConfig()` nào được cho phép.

    Mã Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng đường dẫn con SDK hẹp
    khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu config như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion config đã tải và tra cứu config plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi config | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Config bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải đầu vào bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè model/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin được bundled và kiểm thử của chúng được scanner bảo vệ khỏi barrel rộng
    để import và mock luôn cục bộ theo hành vi chúng cần. Barrel rộng
    vẫn tồn tại cho tương thích bên ngoài, nhưng mã mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Plugin được bundled phải thay các handler kết quả công cụ chỉ dành cho embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` bằng middleware trung lập runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Đồng thời cập nhật manifest Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin đã cài cũng có thể đăng ký middleware kết quả công cụ khi chúng được
    bật rõ ràng và khai báo mọi runtime được nhắm đến trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài nhưng
    chưa khai báo sẽ bị từ chối.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin kênh có khả năng approval nay phơi bày hành vi approval gốc thông qua
    `approvalCapability.nativeRuntime` cộng với registry runtime-context dùng chung.

    Thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery riêng cho approval khỏi dây nối legacy `plugin.auth` /
      `plugin.approvals` và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị gỡ khỏi hợp đồng channel-plugin công khai;
      chuyển các trường delivery/native/render sang `approvalCapability`
    - `plugin.auth` chỉ còn dành cho luồng đăng nhập/đăng xuất kênh; các hook auth
      approval ở đó không còn được phần lõi đọc
    - Đăng ký các đối tượng runtime do kênh sở hữu như client, token, hoặc ứng dụng Bolt
      thông qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo chuyển tuyến lại do Plugin sở hữu từ handler approval gốc;
      phần lõi nay sở hữu thông báo đã định tuyến sang nơi khác từ kết quả delivery thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, cung cấp một
      bề mặt `createPluginRuntime().channel` thật. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục approval capability hiện tại.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` không phân giải được nay thất bại đóng trừ khi bạn truyền rõ ràng
    `allowShellFallback: true`.

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

    Nếu caller của bạn không chủ ý dựa vào shell fallback, đừng đặt
    `allowShellFallback` và hãy xử lý lỗi được ném ra thay vào đó.

  </Step>

  <Step title="Find deprecated imports">
    Tìm trong Plugin của bạn các import từ một trong hai bề mặt đã ngừng hỗ trợ:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
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

    Với các helper phía host, hãy dùng runtime Plugin được tiêm thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
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
    | các helper kho phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích bên ngoài,
    nhưng mã mới nên import bề mặt helper tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Các helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Các helper đánh thức Heartbeat, sự kiện và khả năng hiển thị | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi phân phối đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Đo lường hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ đệm khử trùng lặp trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Các helper đường dẫn tệp/phương tiện cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch có nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Các helper proxy và fetch có bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Các kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Các kiểu yêu cầu/giải quyết phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Payload trả lời phê duyệt và helper lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Các helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Các helper token an toàn | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời hóa tác vụ async có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa async cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các Plugin đi kèm được scanner bảo vệ khỏi `infra-runtime`, nên mã trong repo
    không thể thoái lui về barrel rộng.

  </Step>

  <Step title="Migrate channel route helpers">
    Mã route kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ vẫn là alias tương thích
    trong khoảng thời gian di trú, nhưng Plugin mới nên dùng các tên route
    mô tả trực tiếp hành vi:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các helper route hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    một cách nhất quán trên phê duyệt gốc, chặn trả lời, khử trùng lặp đầu vào,
    phân phối Cron và định tuyến phiên.

    Không thêm cách dùng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    các helper loaded-route dựa trên parser (`parseExplicitTargetForLoadedChannel`
    hoặc `resolveRouteTargetForLoadedChannel`) hoặc
    `resolveChannelRouteTargetWithParser(...)` từ `plugin-sdk/channel-route`.
    Các hook đó đã bị ngừng khuyến nghị và chỉ còn dành cho Plugin cũ trong
    khoảng thời gian di trú. Plugin kênh mới nên dùng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa id đích
    và fallback khi thiếu thư mục, `messaging.inferTargetChatType(...)` khi core
    cần loại peer sớm, và `messaging.resolveOutboundSessionRoute(...)`
    cho phiên gốc của provider và định danh luồng.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Tham chiếu đường dẫn import

  <Accordion title="Common import path table">
  | Đường dẫn import | Mục đích | Các export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Hàm trợ giúp điểm vào Plugin chuẩn tắc | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export ô bao kế thừa cho định nghĩa/trình xây dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export lược đồ cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hàm trợ giúp điểm vào cho một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và trình xây dựng điểm vào kênh chuyên biệt | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Hàm trợ giúp trình hướng dẫn thiết lập dùng chung | Bộ dịch thiết lập, lời nhắc danh sách cho phép, trình xây dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Hàm trợ giúp runtime trong lúc thiết lập | `createSetupTranslator`, bộ chuyển đổi bản vá thiết lập an toàn khi import, hàm trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Bí danh bộ chuyển đổi thiết lập đã ngừng dùng | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Hàm trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hàm trợ giúp nhiều tài khoản | Hàm trợ giúp danh sách/cấu hình/cổng hành động tài khoản |
  | `plugin-sdk/account-id` | Hàm trợ giúp mã định danh tài khoản | `DEFAULT_ACCOUNT_ID`, chuẩn hóa mã định danh tài khoản |
  | `plugin-sdk/account-resolution` | Hàm trợ giúp tra cứu tài khoản | Hàm trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Hàm trợ giúp tài khoản phạm vi hẹp | Hàm trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ chuyển đổi trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cộng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Nguyên hàm ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Kết nối tiền tố trả lời, trạng thái đang nhập và phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory bộ chuyển đổi cấu hình và hàm trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình xây dựng lược đồ cấu hình | Chỉ gồm nguyên hàm lược đồ cấu hình kênh dùng chung và trình xây dựng chung |
  | `plugin-sdk/bundled-channel-config-schema` | Lược đồ cấu hình đi kèm | Chỉ dành cho các Plugin đi kèm do OpenClaw duy trì; Plugin mới phải định nghĩa lược đồ cục bộ trong Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Lược đồ cấu hình đi kèm đã ngừng dùng | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các Plugin đi kèm được duy trì |
  | `plugin-sdk/telegram-command-config` | Hàm trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Hàm trợ giúp phong bì đến | Hàm trợ giúp tuyến dùng chung + trình xây dựng phong bì |
  | `plugin-sdk/channel-inbound` | Hàm trợ giúp nhận đầu vào | Xây dựng ngữ cảnh, định dạng, gốc, trình chạy, điều phối trả lời đã chuẩn bị và vị từ điều phối |
  | `plugin-sdk/messaging-targets` | Đường dẫn import phân tích đích đã ngừng dùng | Dùng `plugin-sdk/channel-targets` cho hàm trợ giúp phân tích đích chung, `plugin-sdk/channel-route` cho so sánh tuyến và `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do Plugin sở hữu cho phân giải đích riêng theo nhà cung cấp |
  | `plugin-sdk/outbound-media` | Hàm trợ giúp phương tiện gửi đi | Tải phương tiện gửi đi dùng chung |
  | `plugin-sdk/outbound-send-deps` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Hàm trợ giúp vòng đời tin nhắn gửi đi | Bộ chuyển đổi tin nhắn, biên nhận, hàm trợ giúp gửi bền vững, hàm trợ giúp xem trước trực tiếp/streaming, tùy chọn trả lời, hàm trợ giúp vòng đời, danh tính gửi đi và lập kế hoạch payload |
  | `plugin-sdk/channel-streaming` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Hàm trợ giúp ràng buộc luồng | Hàm trợ giúp vòng đời và bộ chuyển đổi ràng buộc luồng |
  | `plugin-sdk/agent-media-payload` | Hàm trợ giúp payload phương tiện kế thừa | Trình xây dựng payload phương tiện tác tử cho bố cục trường kế thừa |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng dùng | Chỉ dành cho tiện ích runtime kênh kế thừa |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Hàm trợ giúp runtime phạm vi rộng | Hàm trợ giúp runtime/ghi log/sao lưu/cài đặt Plugin |
  | `plugin-sdk/runtime-env` | Hàm trợ giúp môi trường runtime phạm vi hẹp | Hàm trợ giúp logger/môi trường runtime, timeout, thử lại và backoff |
  | `plugin-sdk/plugin-runtime` | Hàm trợ giúp runtime Plugin dùng chung | Hàm trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Hàm trợ giúp pipeline hook | Hàm trợ giúp pipeline Webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Hàm trợ giúp runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Hàm trợ giúp tiến trình | Hàm trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Hàm trợ giúp runtime CLI | Định dạng lệnh, chờ, hàm trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Hàm trợ giúp Gateway | Client Gateway, hàm trợ giúp khởi động sẵn sàng cho vòng lặp sự kiện và hàm trợ giúp vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng dùng | Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hàm trợ giúp lệnh Telegram | Hàm trợ giúp xác thực lệnh Telegram ổn định khi dự phòng nếu bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Hàm trợ giúp lời nhắc phê duyệt | Payload phê duyệt exec/Plugin, hàm trợ giúp năng lực/hồ sơ phê duyệt, định tuyến/runtime phê duyệt gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Hàm trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Hàm trợ giúp client phê duyệt | Hàm trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
  | `plugin-sdk/approval-delivery-runtime` | Hàm trợ giúp phân phối phê duyệt | Bộ chuyển đổi năng lực/phân phối phê duyệt gốc |
  | `plugin-sdk/approval-gateway-runtime` | Hàm trợ giúp Gateway phê duyệt | Hàm trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hàm trợ giúp bộ chuyển đổi phê duyệt | Hàm trợ giúp tải bộ chuyển đổi phê duyệt gốc nhẹ cho điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Hàm trợ giúp trình xử lý phê duyệt | Hàm trợ giúp runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam bộ chuyển đổi/Gateway hẹp hơn khi đã đủ |
  | `plugin-sdk/approval-native-runtime` | Hàm trợ giúp đích phê duyệt | Hàm trợ giúp ràng buộc đích/tài khoản phê duyệt gốc |
  | `plugin-sdk/approval-reply-runtime` | Hàm trợ giúp trả lời phê duyệt | Hàm trợ giúp payload trả lời phê duyệt exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Hàm trợ giúp ngữ cảnh runtime kênh | Hàm trợ giúp đăng ký/lấy/theo dõi ngữ cảnh runtime kênh chung |
  | `plugin-sdk/security-runtime` | Hàm trợ giúp bảo mật | Hàm trợ giúp độ tin cậy dùng chung, cổng DM, tệp/đường dẫn giới hạn theo gốc, nội dung bên ngoài và thu thập bí mật |
  | `plugin-sdk/ssrf-policy` | Hàm trợ giúp chính sách SSRF | Hàm trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Hàm trợ giúp runtime SSRF | Bộ điều phối ghim, fetch được bảo vệ, hàm trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Hàm trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Hàm trợ giúp Heartbeat | Hàm trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Hàm trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hàm trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hàm trợ giúp chống trùng lặp | Bộ nhớ đệm chống trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Hàm trợ giúp truy cập tệp | Hàm trợ giúp đường dẫn tệp/phương tiện cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Hàm trợ giúp trạng thái sẵn sàng của transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Hàm trợ giúp chính sách phê duyệt exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Hàm trợ giúp bộ nhớ đệm có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hàm trợ giúp cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hàm trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, hàm trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Hàm trợ giúp fetch/proxy được bọc | `resolveFetch`, hàm trợ giúp proxy, hàm trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Hàm trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hàm trợ giúp thử lại | `RetryConfig`, `retryAsync`, trình chạy chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép và ánh xạ đầu vào | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hàm trợ giúp cổng lệnh và bề mặt lệnh | `resolveControlCommandGate`, hàm trợ giúp ủy quyền người gửi, hàm trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Trình render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Hàm trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Hàm trợ giúp yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Hàm trợ giúp bảo vệ thân Webhook | Hàm trợ giúp đọc/giới hạn thân yêu cầu |
  | `plugin-sdk/reply-runtime` | Runtime trả lời dùng chung | Điều phối đầu vào, Heartbeat, trình lập kế hoạch trả lời, chia khúc |
  | `plugin-sdk/reply-dispatch-runtime` | Hàm trợ giúp điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối nhà cung cấp và hàm trợ giúp nhãn hội thoại |
  | `plugin-sdk/reply-history` | Hàm trợ giúp lịch sử trả lời | `createChannelHistoryWindow`; export tương thích hàm trợ giúp map đã ngừng dùng như `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hàm trợ giúp khúc trả lời | Hàm trợ giúp chia khúc văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Hàm trợ giúp kho phiên | Hàm trợ giúp đường dẫn kho + updated-at |
  | `plugin-sdk/state-paths` | Hàm trợ giúp đường dẫn trạng thái | Hàm trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Bộ dựng tóm tắt trạng thái kênh/tài khoản, mặc định trạng thái thời gian chạy, trình trợ giúp siêu dữ liệu vấn đề |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp bộ phân giải đích | Trình trợ giúp bộ phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL dạng chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có giới hạn thời gian | Bộ chạy lệnh có giới hạn thời gian với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Bộ đọc tham số | Bộ đọc tham số công cụ/CLI dùng chung |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất lệnh gửi của công cụ | Trích xuất các trường đích gửi chuẩn từ tham số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi nhật ký | Trình ghi nhật ký hệ thống con và trình trợ giúp biên tập dữ liệu nhạy cảm |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ tuyển chọn | Trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI chuyên biệt | Cùng các trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực thời gian chạy của nhà cung cấp | Trình trợ giúp phân giải khóa API thời gian chạy |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập khóa API của nhà cung cấp | Trình trợ giúp onboarding/ghi hồ sơ cho khóa API |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa mã định danh mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp catalog nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình trợ giúp cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP nhà cung cấp | Trình trợ giúp năng lực HTTP/endpoint nhà cung cấp chung, bao gồm trình trợ giúp biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình web-search nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực web-search phạm vi hẹp cho các nhà cung cấp không cần đấu nối bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng web-search nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực có phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp web-search nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán cho DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp bộ bao luồng nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu bộ bao luồng và trình trợ giúp bộ bao dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp truyền tải nhà cung cấp | Trình trợ giúp truyền tải nhà cung cấp gốc như fetch có bảo vệ, biến đổi thông điệp truyền tải và luồng sự kiện truyền tải có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp phương tiện dùng chung | Trình trợ giúp fetch/biến đổi/lưu trữ phương tiện, thăm dò kích thước video dựa trên ffprobe và bộ dựng payload phương tiện |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo phương tiện dùng chung | Trình trợ giúp failover dùng chung, chọn ứng viên và thông báo thiếu mô hình cho tạo ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu phương tiện | Kiểu nhà cung cấp hiểu phương tiện cùng các export trình trợ giúp ảnh/âm thanh hướng đến nhà cung cấp |
  | `plugin-sdk/text-runtime` | Export tương thích văn bản phạm vi rộng đã lỗi thời | Dùng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản gửi ra |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng trình trợ giúp chỉ thị, registry, xác thực hướng đến nhà cung cấp và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải, trình trợ giúp phiên cầu nối, hàng đợi phản hồi bằng giọng nói của agent dùng chung, điều khiển giọng nói lượt chạy đang hoạt động, sức khỏe bản ghi/sự kiện, triệt vọng âm, khớp câu hỏi tham vấn, phối hợp tham vấn bắt buộc, theo dõi ngữ cảnh lượt, theo dõi hoạt động đầu ra và trình trợ giúp tham vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo ảnh | Kiểu nhà cung cấp tạo ảnh cùng trình trợ giúp URL dữ liệu/tài sản ảnh và bộ dựng nhà cung cấp ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo ảnh dùng chung | Kiểu tạo ảnh, failover, xác thực và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích cú pháp model-ref |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích cú pháp model-ref |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/rút gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Primitive cấu hình kênh | Primitive schema cấu hình kênh phạm vi hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Prelude kênh dùng chung | Export prelude Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp ảnh chụp/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình danh sách cho phép | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
  | `plugin-sdk/group-access` | Trình trợ giúp truy cập nhóm | Trình trợ giúp quyết định truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã lỗi thời | Dùng `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp bảo vệ Direct-DM | Trình trợ giúp chính sách bảo vệ trước mã hóa phạm vi hẹp |
  | `plugin-sdk/extension-shared` | Trình trợ giúp phần mở rộng dùng chung | Primitive trợ giúp kênh thụ động/trạng thái và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Trình trợ giúp registry đích Webhook và cài đặt tuyến |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn Webhook đã lỗi thời | Dùng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp phương tiện web dùng chung | Trình trợ giúp tải phương tiện từ xa/cục bộ |
  | `plugin-sdk/zod` | Tái xuất tương thích Zod đã lỗi thời | Nhập `zod` từ `zod` trực tiếp |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core đóng gói | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy bộ máy bộ nhớ | Facade thời gian chạy lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding bộ nhớ | Trình trợ giúp registry nhà cung cấp embedding bộ nhớ nhẹ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bộ máy nền tảng máy chủ bộ nhớ | Export bộ máy nền tảng máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bộ máy embedding máy chủ bộ nhớ | Hợp đồng embedding bộ nhớ, truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa chung; nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu của chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bộ máy QMD máy chủ bộ nhớ | Export bộ máy QMD máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Bộ máy lưu trữ máy chủ bộ nhớ | Export bộ máy lưu trữ máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức máy chủ bộ nhớ | Trình trợ giúp đa phương thức máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn máy chủ bộ nhớ | Trình trợ giúp truy vấn máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật máy chủ bộ nhớ | Trình trợ giúp bí mật máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái máy chủ bộ nhớ | Trình trợ giúp trạng thái máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Thời gian chạy CLI máy chủ bộ nhớ | Trình trợ giúp thời gian chạy CLI máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Thời gian chạy lõi máy chủ bộ nhớ | Trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ | Trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh thời gian chạy lõi máy chủ bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện máy chủ bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/thời gian chạy bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý | Trình trợ giúp markdown được quản lý dùng chung cho các Plugin lân cận bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade thời gian chạy trình quản lý tìm kiếm Active Memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái máy chủ bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích đã lỗi thời nội bộ repo; dùng các đường dẫn con kiểm thử nội bộ repo chuyên biệt như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý chỉ là tập con di chuyển chung, không phải toàn bộ bề mặt SDK.
Bản kiểm kê entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các export của package được tạo từ
tập con công khai.

Các seam trợ giúp dành riêng cho bundled-plugin đã được loại bỏ khỏi export map
SDK công khai, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng, chẳng hạn
shim `plugin-sdk/discord` đã ngừng khuyến nghị nhưng vẫn được giữ lại cho package
`@openclaw/discord@2026.3.13` đã phát hành. Các helper dành riêng cho owner nằm trong
package Plugin sở hữu; hành vi host dùng chung nên đi qua các hợp đồng SDK tổng quát
như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
và `plugin-sdk/plugin-config-runtime`.

Dùng import hẹp nhất phù hợp với công việc. Nếu bạn không tìm thấy một export,
hãy kiểm tra mã nguồn tại `src/plugin-sdk/` hoặc hỏi maintainer xem hợp đồng tổng quát nào
nên sở hữu nó.

## Các mục ngừng khuyến nghị đang hoạt động

Các mục ngừng khuyến nghị hẹp hơn áp dụng trên plugin SDK, hợp đồng nhà cung cấp,
bề mặt thời gian chạy, và manifest. Mỗi mục hiện vẫn hoạt động nhưng sẽ bị loại bỏ
trong một bản phát hành major trong tương lai. Mục bên dưới mỗi phần ánh xạ API cũ
sang phần thay thế chuẩn của nó.

<AccordionGroup>
  <Accordion title="trình dựng trợ giúp command-auth → command-status">
    **Cũ (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Mới (`openclaw/plugin-sdk/command-status`)**: cùng chữ ký, cùng
    export - chỉ được import từ subpath hẹp hơn. `command-auth`
    re-export chúng dưới dạng stub tương thích.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper kiểm soát mention → resolveInboundMentionDecision">
    **Cũ**: `resolveInboundMentionRequirement({ facts, policy })` và
    `shouldDropInboundForMention(...)` từ
    `openclaw/plugin-sdk/channel-inbound` hoặc
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Mới**: `resolveInboundMentionDecision({ facts, policy })` - trả về một
    đối tượng quyết định duy nhất thay vì hai lệnh gọi tách rời.

    Các Plugin kênh downstream (Slack, Discord, Matrix, MS Teams) đã
    chuyển đổi.

  </Accordion>

  <Accordion title="Shim runtime kênh và helper hành động kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Đừng import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    thời gian chạy.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng khuyến nghị cùng với các export kênh "actions" thô. Hãy phơi bày capability
    qua bề mặt `presentation` theo ngữ nghĩa thay vào đó - các Plugin kênh
    khai báo những gì chúng render (card, nút, select) thay vì tên hành động thô
    mà chúng chấp nhận.

  </Accordion>

  <Accordion title="Helper tool() của nhà cung cấp tìm kiếm web → createTool() trên plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin nhà cung cấp.
    OpenClaw không còn cần helper SDK để đăng ký wrapper công cụ.

  </Accordion>

  <Accordion title="Envelope kênh văn bản thuần → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để xây dựng một envelope prompt
    văn bản thuần phẳng từ các tin nhắn kênh inbound.

    **Mới**: `BodyForAgent` cộng với các khối ngữ cảnh người dùng có cấu trúc. Các
    Plugin kênh đính kèm metadata định tuyến (thread, topic, reply-to, reaction) dưới dạng
    trường có kiểu thay vì nối chúng vào một chuỗi prompt. Helper
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope được tổng hợp
    hướng tới assistant, nhưng envelope inbound dạng văn bản thuần đang được
    loại bỏ dần.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và bất kỳ
    Plugin kênh tùy chỉnh nào hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="Hook deactivate → gateway_stop">
    **Cũ**: `api.on("deactivate", handler)`.

    **Mới**: `api.on("gateway_stop", handler)`. Sự kiện và ngữ cảnh là cùng
    một hợp đồng dọn dẹp khi tắt; chỉ tên hook thay đổi.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` vẫn được nối dây dưới dạng alias tương thích đã ngừng khuyến nghị cho đến sau
    2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning → binding thread lõi">
    **Cũ**: `api.on("subagent_spawning", handler)` trả về
    `threadBindingReady` hoặc `deliveryOrigin`.

    **Mới**: để lõi chuẩn bị binding subagent `thread: true` thông qua
    adapter session-binding của kênh. Chỉ dùng `api.on("subagent_spawned", handler)`
    để quan sát sau khi khởi chạy.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, và
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` chỉ còn là
    các bề mặt tương thích đã ngừng khuyến nghị trong khi Plugin bên ngoài di chuyển.

  </Accordion>

  <Accordion title="Kiểu khám phá nhà cung cấp → kiểu catalog nhà cung cấp">
    Bốn alias kiểu khám phá hiện là wrapper mỏng trên các kiểu
    thời catalog:

    | Alias cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng với túi tĩnh `ProviderCapabilities` cũ - các Plugin nhà cung cấp
    nên dùng các hook nhà cung cấp rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas`, và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách thinking → resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn, và
    danh sách cấp độ được xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu cũ
    theo thứ hạng hồ sơ.

    Ngữ cảnh bao gồm `provider`, `modelId`, `reasoning` đã hợp nhất tùy chọn,
    và các fact `compat` của model đã hợp nhất tùy chọn. Các Plugin nhà cung cấp có thể dùng
    những fact catalog đó để chỉ phơi bày hồ sơ theo model khi hợp đồng request
    đã cấu hình hỗ trợ nó.

    Triển khai một hook thay vì ba. Các hook cũ tiếp tục hoạt động trong
    cửa sổ ngừng khuyến nghị nhưng không được kết hợp với kết quả hồ sơ.

  </Accordion>

  <Accordion title="Nhà cung cấp auth bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai hook auth bên ngoài mà không khai báo nhà cung cấp
    trong manifest Plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest Plugin
    **và** triển khai `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Tra cứu env-var nhà cung cấp → setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng tra cứu env-var vào `setup.providers[].envVars`
    trên manifest. Việc này hợp nhất metadata env của setup/status vào một
    nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu
    env-var.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua adapter tương thích
    cho đến khi cửa sổ ngừng khuyến nghị đóng lại.

  </Accordion>

  <Accordion title="Đăng ký Plugin bộ nhớ → registerMemoryCapability">
    **Cũ**: ba lệnh gọi riêng biệt -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lệnh gọi trên API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các slot, một lệnh gọi đăng ký duy nhất. Các helper prompt và corpus bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) không
    bị ảnh hưởng.

  </Accordion>

  <Accordion title="API nhà cung cấp embedding bộ nhớ">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cộng với
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cộng với
    `contracts.embeddingProviders`.

    Hợp đồng nhà cung cấp embedding tổng quát có thể tái sử dụng ngoài bộ nhớ và là
    đường dẫn được hỗ trợ cho nhà cung cấp mới. API đăng ký dành riêng cho bộ nhớ
    vẫn được nối dây dưới dạng tương thích đã ngừng khuyến nghị trong khi các nhà cung cấp hiện có di chuyển.
    Báo cáo kiểm tra Plugin ghi nhận việc sử dụng không bundled là nợ tương thích.

  </Accordion>

  <Accordion title="Đổi tên kiểu tin nhắn session subagent">
    Hai alias kiểu cũ vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng khuyến nghị để ưu tiên
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi xuyên qua
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime đột biến TaskFlow được quản lý
    cho các Plugin tạo, cập nhật, hủy, hoặc chạy tác vụ con từ một
    flow. Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension nhúng → middleware kết quả công cụ của agent">
    Được đề cập trong "Cách di chuyển → Di chuyển extension kết quả công cụ nhúng sang
    middleware" ở trên. Được đưa vào đây để đầy đủ: đường dẫn embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` đã bị loại bỏ được thay bằng
    `api.registerAgentToolResultMiddleware(...)` với danh sách runtime rõ ràng
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` hiện là
    alias một dòng cho `OpenClawConfig`. Hãy ưu tiên tên chuẩn.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các mục ngừng khuyến nghị cấp extension (bên trong các Plugin kênh/nhà cung cấp bundled dưới
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin bên thứ ba và không được liệt kê
ở đây. Nếu bạn dùng trực tiếp barrel cục bộ của một Plugin bundled, hãy đọc
các bình luận ngừng khuyến nghị trong barrel đó trước khi nâng cấp.
</Note>

## Mốc thời gian loại bỏ

| Khi nào                | Điều gì xảy ra                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Bây giờ**            | Các bề mặt đã ngừng khuyến nghị phát ra cảnh báo khi chạy               |
| **Bản phát hành chính tiếp theo** | Các bề mặt đã ngừng khuyến nghị sẽ bị xóa; plugin vẫn sử dụng chúng sẽ lỗi |

Tất cả plugin lõi đã được di chuyển. Plugin bên ngoài nên di chuyển
trước bản phát hành chính tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này trong khi bạn thực hiện di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu đầy đủ về import theo đường dẫn con
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng plugin nhà cung cấp
- [Nội bộ Plugin](/vi/plugins/architecture) - phân tích sâu về kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) - tham chiếu schema manifest
