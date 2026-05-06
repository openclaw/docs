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
    generated_at: "2026-05-06T09:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang kiến trúc plugin hiện đại
với các import tập trung và có tài liệu. Nếu plugin của bạn được xây dựng trước
kiến trúc mới, hướng dẫn này giúp bạn di chuyển.

## Điều gì đang thay đổi

Hệ thống plugin cũ cung cấp hai bề mặt mở rộng, cho phép plugin import
mọi thứ chúng cần từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất re-export hàng chục
  helper. Nó được giới thiệu để giữ cho các plugin dựa trên hook cũ tiếp tục
  hoạt động trong khi kiến trúc plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel helper runtime rộng,
  trộn lẫn sự kiện hệ thống, trạng thái Heartbeat, hàng đợi phân phối, helper
  fetch/proxy, helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng,
  vẫn mang các helper tải/ghi trực tiếp đã bị phản đối trong cửa sổ di chuyển.
- **`openclaw/extension-api`** - một cầu nối cho plugin truy cập trực tiếp vào
  các helper phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook extension đóng gói
  chỉ dành cho Pi đã bị loại bỏ, có thể quan sát các sự kiện embedded-runner như
  `tool_result`.

Các bề mặt import rộng hiện đã **bị phản đối**. Chúng vẫn hoạt động lúc runtime,
nhưng plugin mới không được dùng chúng, và plugin hiện có nên di chuyển trước khi
bản phát hành lớn tiếp theo loại bỏ chúng. API đăng ký embedded extension factory
chỉ dành cho Pi đã bị loại bỏ; hãy dùng middleware kết quả công cụ thay thế.

OpenClaw không loại bỏ hoặc diễn giải lại hành vi plugin đã được tài liệu hóa
trong cùng thay đổi giới thiệu phần thay thế. Các thay đổi phá vỡ hợp đồng trước
tiên phải đi qua adapter tương thích, chẩn đoán, tài liệu và cửa sổ phản đối.
Điều đó áp dụng cho các import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong một bản phát hành lớn trong tương lai.
  Các plugin vẫn import từ những bề mặt này sẽ hỏng khi điều đó xảy ra.
  Các đăng ký embedded extension factory chỉ dành cho Pi hiện đã không còn được tải.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** - import một helper sẽ tải hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** - các re-export rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách nào biết export nào ổn định so với nội bộ

SDK plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`)
là một mô-đun nhỏ, tự chứa, có mục đích rõ ràng và hợp đồng được tài liệu hóa.

Các seam tiện ích provider kế thừa cho các kênh đóng gói cũng đã bị loại bỏ.
Các seam helper gắn thương hiệu kênh là lối tắt mono-repo riêng tư, không phải
hợp đồng plugin ổn định. Hãy dùng các subpath SDK chung, hẹp thay thế. Bên trong
không gian làm việc plugin đóng gói, hãy giữ các helper do provider sở hữu trong
`api.ts` hoặc `runtime-api.ts` của chính plugin đó.

Ví dụ provider đóng gói hiện tại:

- Anthropic giữ các helper stream dành riêng cho Claude trong seam `api.ts` /
  `contract-api.ts` của riêng nó
- OpenAI giữ các provider builder, helper mô hình mặc định và realtime provider
  builder trong `api.ts` của riêng nó
- OpenRouter giữ provider builder và helper onboarding/cấu hình trong `api.ts`
  của riêng nó

## Kế hoạch di chuyển Talk và giọng nói realtime

Mã Talk cho giọng nói realtime, điện thoại, cuộc họp và trình duyệt đang chuyển từ
ghi sổ lượt cục bộ theo bề mặt sang bộ điều khiển phiên Talk dùng chung, được export bởi
`openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu envelope sự kiện Talk
chung, trạng thái lượt hoạt động, trạng thái capture, trạng thái âm thanh đầu ra,
lịch sử sự kiện gần đây và loại bỏ lượt đã cũ. Plugin provider nên tiếp tục sở hữu
các phiên realtime dành riêng cho vendor; plugin bề mặt nên tiếp tục sở hữu capture,
phát lại, điện thoại và các khác biệt riêng của cuộc họp.

Quá trình di chuyển Talk này cố ý phá vỡ sạch:

1. Giữ các primitive controller/runtime dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt đóng gói sang bộ điều khiển dùng chung: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime và native push-to-talk.
3. Thay các họ RPC Talk cũ bằng API `talk.session.*` và
   `talk.client.*` cuối cùng.
4. Quảng bá một kênh sự kiện Talk trực tiếp trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP realtime cũ và mọi đường dẫn override chỉ dẫn tại thời điểm request.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi nó đang
triển khai adapter cấp thấp hoặc fixture kiểm thử. Ưu tiên bộ điều khiển dùng chung
để các sự kiện theo phạm vi lượt không thể được phát ra khi không có id lượt, các lời gọi
`turnEnd` / `turnCancel` đã cũ không thể xóa một lượt hoạt động mới hơn, và các sự kiện
vòng đời âm thanh đầu ra luôn nhất quán trên điện thoại, cuộc họp, browser relay,
managed-room handoff và client Talk native.

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
```

Các phiên WebRTC/provider-websocket do trình duyệt sở hữu dùng `talk.client.create`,
vì trình duyệt sở hữu quá trình đàm phán provider và transport media, trong khi
Gateway sở hữu thông tin xác thực, chỉ dẫn và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho các phiên realtime gateway-relay, transcription
gateway-relay và STT/TTS native managed-room.

Các cấu hình kế thừa đặt selector realtime bên cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime
không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider realtime.

Các tổ hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Transport       | Brain           | Chủ sở hữu         | Ghi chú                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh provider song công được bắc cầu qua Gateway; các lời gọi công cụ được định tuyến qua công cụ agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ streaming STT; bên gọi gửi âm thanh đầu vào và nhận sự kiện transcript.                                      |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie, nơi client sở hữu capture/phát lại và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt bên thứ nhất đáng tin cậy thực thi trực tiếp hành động công cụ Gateway. |

Bản đồ phương thức đã loại bỏ:

| Cũ                               | Mới                                                      |
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

Từ vựng điều khiển hợp nhất cũng được cố ý giữ hẹp:

| Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Thêm một đoạn âm thanh PCM base64 vào phiên provider thuộc sở hữu của cùng kết nối Gateway. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng managed-room.                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt hoạt động sau khi xác thực lượt đã cũ.                                         |
| `talk.session.cancelTurn`       | tất cả các phiên do Gateway sở hữu                      | Hủy công việc capture/provider/agent/TTS đang hoạt động cho một lượt.                        |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng âm thanh đầu ra của trợ lý mà không nhất thiết kết thúc lượt người dùng.                |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lời gọi công cụ provider do relay phát ra.                                      |
| `talk.session.close`            | tất cả các phiên hợp nhất                               | Dừng các phiên relay hoặc thu hồi trạng thái managed-room, rồi quên id phiên hợp nhất.       |

Không giới thiệu các trường hợp đặc biệt theo provider hoặc nền tảng trong core để
làm việc này hoạt động. Core sở hữu ngữ nghĩa phiên Talk. Plugin provider sở hữu
thiết lập phiên vendor. Voice-call và Google Meet sở hữu adapter điện thoại/cuộc họp.
Trình duyệt và ứng dụng native sở hữu UX capture/phát lại thiết bị.

## Chính sách tương thích

Đối với plugin bên ngoài, công việc tương thích theo thứ tự này:

1. thêm hợp đồng mới
2. giữ hành vi cũ được nối qua adapter tương thích
3. phát ra chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
4. bao phủ cả hai đường dẫn trong kiểm thử
5. tài liệu hóa việc phản đối và đường dẫn di chuyển
6. chỉ loại bỏ sau cửa sổ di chuyển đã công bố, thường trong một bản phát hành lớn

  Người bảo trì có thể kiểm tra hàng đợi di trú hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để xem
  số liệu thu gọn, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi cổng CI cần thất bại trên các bản ghi
  tương thích đã đến hạn, các import SDK dành riêng xuyên chủ sở hữu, hoặc các
  đường dẫn con SDK dành riêng không dùng đến. Báo cáo nhóm các bản ghi
  tương thích đã ngừng khuyến nghị theo ngày gỡ bỏ, đếm các tham chiếu mã/tài liệu
  cục bộ, hiển thị các import SDK dành riêng xuyên chủ sở hữu, và tóm tắt cầu nối
  SDK memory-host riêng tư để việc dọn dẹp tương thích luôn rõ ràng thay vì
  dựa vào các tìm kiếm tùy biến. Các đường dẫn con SDK dành riêng phải có mức sử dụng
  theo chủ sở hữu được theo dõi; các export helper dành riêng không dùng đến nên được
  gỡ khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng
  trường đó cho đến khi tài liệu và chẩn đoán nói khác. Mã mới nên ưu tiên phần
  thay thế đã được ghi tài liệu, nhưng các Plugin hiện có không nên bị hỏng trong
  các bản phát hành minor thông thường.

  ## Cách di trú

  <Steps>
  <Step title="Di trú helper tải/ghi cấu hình runtime">
    Các Plugin đi kèm nên ngừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được truyền
    vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần snapshot tiến trình
    hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ agent tồn tại
    lâu nên dùng `ctx.getRuntimeConfig()` của ngữ cảnh công cụ bên trong
    `execute` để một công cụ được tạo trước khi ghi cấu hình vẫn thấy cấu hình
    runtime đã được làm mới.

    Các thao tác ghi cấu hình phải đi qua các helper giao dịch và chọn một
    chính sách sau ghi:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi bên gọi biết
    thay đổi đó cần khởi động lại Gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi bên gọi sở hữu bước
    tiếp theo và chủ đích muốn chặn trình lập kế hoạch tải lại.
    Kết quả mutation bao gồm một bản tóm tắt `followUp` có kiểu cho kiểm thử và ghi log;
    Gateway vẫn chịu trách nhiệm áp dụng hoặc lên lịch khởi động lại.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng
    khuyến nghị cho Plugin bên ngoài trong thời gian di trú và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Các Plugin đi kèm và mã runtime
    trong repo được bảo vệ bằng các rào chắn scanner trong
    `pnpm check:deprecated-internal-config-api` và
    `pnpm check:no-runtime-action-load-config`: cách dùng Plugin production mới
    thất bại ngay, ghi cấu hình trực tiếp thất bại, các phương thức máy chủ Gateway phải dùng
    snapshot runtime của request, các helper gửi/hành động/client của kênh runtime
    phải nhận cấu hình từ ranh giới của chúng, và các module runtime tồn tại lâu có
    số lần gọi `loadConfig()` ambient được phép là bằng không.

    Mã Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng đường dẫn con SDK hẹp khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Khẳng định cấu hình đã tải và tra cứu cấu hình điểm vào Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải input bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè model/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Các Plugin đi kèm và kiểm thử của chúng được scanner bảo vệ khỏi barrel rộng
    để import và mock luôn cục bộ với hành vi chúng cần. Barrel rộng vẫn tồn tại
    để tương thích bên ngoài, nhưng mã mới không nên phụ thuộc vào nó.

  </Step>

  <Step title="Di trú phần mở rộng kết quả công cụ Pi sang middleware">
    Các Plugin đi kèm phải thay thế handler kết quả công cụ chỉ dành cho Pi
    `api.registerEmbeddedExtensionFactory(...)` bằng middleware trung lập runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Cập nhật manifest Plugin cùng lúc:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin bên ngoài không thể đăng ký middleware kết quả công cụ vì nó có thể
    ghi lại output công cụ có độ tin cậy cao trước khi model thấy output đó.

  </Step>

  <Step title="Di trú handler approval-native sang dữ kiện capability">
    Các Plugin kênh hỗ trợ phê duyệt giờ đây bộc lộ hành vi phê duyệt native qua
    `approvalCapability.nativeRuntime` cùng registry ngữ cảnh runtime dùng chung.

    Thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery dành riêng cho phê duyệt khỏi wiring kế thừa `plugin.auth` /
      `plugin.approvals` và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị gỡ khỏi hợp đồng channel-plugin công khai;
      chuyển các trường delivery/native/render sang `approvalCapability`
    - `plugin.auth` chỉ còn dùng cho luồng đăng nhập/đăng xuất kênh; các hook auth
      phê duyệt ở đó không còn được core đọc
    - Đăng ký các đối tượng runtime do kênh sở hữu như client, token, hoặc app Bolt
      qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo định tuyến lại do Plugin sở hữu từ các handler phê duyệt native;
      core giờ đây sở hữu thông báo routed-elsewhere từ kết quả gửi thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, cung cấp một
      bề mặt `createPluginRuntime().channel` thật. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục capability phê duyệt hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi fallback wrapper Windows">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` chưa phân giải giờ đây thất bại đóng trừ khi bạn truyền rõ ràng
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

    Nếu bên gọi của bạn không chủ đích phụ thuộc vào shell fallback, đừng đặt
    `allowShellFallback` và hãy xử lý lỗi được ném ra thay vào đó.

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

    Với helper phía host, dùng runtime Plugin được tiêm thay vì import trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Cùng mẫu này áp dụng cho các helper cầu nối kế thừa khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper kho phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay các import infra-runtime rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích bên ngoài,
    nhưng mã mới nên import bề mặt helper tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper sự kiện Heartbeat và khả năng hiển thị | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Rút cạn hàng đợi gửi đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetry hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache khử trùng lặp trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper đường dẫn tệp/media cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy và fetch có bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Kiểu request/phân giải phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload phản hồi phê duyệt và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời tác vụ async có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa async cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các Plugin đi kèm được scanner bảo vệ khỏi `infra-runtime`, nên mã repo
    không thể thoái lui về barrel rộng.

  </Step>

  <Step title="Di trú helper tuyến kênh">
    Mã tuyến kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ hơn vẫn là alias tương thích
    trong thời gian di trú, nhưng Plugin mới nên dùng tên tuyến mô tả trực tiếp hành vi:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các trình trợ giúp định tuyến hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    một cách nhất quán trên các phê duyệt gốc, chặn trả lời, loại trùng lặp đầu vào,
    phân phối Cron và định tuyến phiên. Nếu Plugin của bạn sở hữu ngữ pháp đích
    tùy chỉnh, hãy dùng `resolveChannelRouteTargetWithParser(...)` để điều chỉnh
    parser đó vào cùng hợp đồng đích định tuyến.

  </Step>

  <Step title="Xây dựng và kiểm thử">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Tham chiếu đường dẫn import

  <Accordion title="Bảng đường dẫn import phổ biến">
  | Đường dẫn import | Mục đích | Export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Trình trợ giúp điểm vào Plugin chính thức | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export gom nhóm cũ cho định nghĩa/trình dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export schema cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình trợ giúp điểm vào cho một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và trình dựng điểm vào kênh chuyên biệt | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung | Lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trình trợ giúp runtime trong lúc thiết lập | Bộ chuyển đổi bản vá thiết lập an toàn khi import, trình trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Trình trợ giúp bộ chuyển đổi thiết lập | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Trình trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trình trợ giúp đa tài khoản | Trình trợ giúp danh sách tài khoản/cấu hình/cổng hành động |
  | `plugin-sdk/account-id` | Trình trợ giúp account-id | `DEFAULT_ACCOUNT_ID`, chuẩn hóa account-id |
  | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trình trợ giúp tài khoản phạm vi hẹp | Trình trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ chuyển đổi trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Thành phần cơ bản ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Nối dây tiền tố trả lời, trạng thái đang nhập và phân phối theo nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory bộ chuyển đổi cấu hình và trình trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình dựng schema cấu hình | Chỉ gồm thành phần schema cấu hình kênh dùng chung và trình dựng tổng quát |
  | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình đi kèm | Chỉ dành cho plugin đi kèm do OpenClaw duy trì; plugin mới phải định nghĩa schema cục bộ trong plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schema cấu hình đi kèm đã ngừng khuyến nghị | Chỉ là alias tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho plugin đi kèm được duy trì |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Trình trợ giúp trạng thái tài khoản và vòng đời luồng bản nháp | `createAccountStatusSink`, trình trợ giúp hoàn tất bản xem trước bản nháp |
  | `plugin-sdk/inbound-envelope` | Trình trợ giúp phong bì đến | Trình trợ giúp route dùng chung + trình dựng phong bì |
  | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp trả lời đến | Trình trợ giúp ghi nhận và điều phối dùng chung |
  | `plugin-sdk/messaging-targets` | Phân tích đích nhắn tin | Trình trợ giúp phân tích/khớp đích |
  | `plugin-sdk/outbound-media` | Trình trợ giúp media đi | Tải media đi dùng chung |
  | `plugin-sdk/outbound-send-deps` | Trình trợ giúp phụ thuộc gửi đi | Tra cứu `resolveOutboundSendDep` nhẹ mà không import toàn bộ runtime gửi đi |
  | `plugin-sdk/outbound-runtime` | Trình trợ giúp runtime gửi đi | Trình trợ giúp phân phối đi, ủy quyền định danh/gửi, phiên, định dạng và lập kế hoạch payload |
  | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp liên kết luồng | Trình trợ giúp vòng đời liên kết luồng và bộ chuyển đổi |
  | `plugin-sdk/agent-media-payload` | Trình trợ giúp payload media cũ | Trình dựng payload media tác tử cho bố cục trường cũ |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng khuyến nghị | Chỉ gồm tiện ích runtime kênh cũ |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trình trợ giúp runtime rộng | Trình trợ giúp runtime/ghi log/sao lưu/cài đặt plugin |
  | `plugin-sdk/runtime-env` | Trình trợ giúp env runtime phạm vi hẹp | Logger/env runtime, timeout, retry và trình trợ giúp backoff |
  | `plugin-sdk/plugin-runtime` | Trình trợ giúp runtime Plugin dùng chung | Trình trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Trình trợ giúp pipeline hook | Trình trợ giúp pipeline Webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trình trợ giúp lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trình trợ giúp tiến trình | Trình trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trình trợ giúp runtime CLI | Định dạng lệnh, chờ, trình trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Trình trợ giúp Gateway | Máy khách Gateway, trình trợ giúp khởi động sẵn sàng vòng lặp sự kiện và trình trợ giúp vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng khuyến nghị | Ưu tiên `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp lệnh Telegram | Trình trợ giúp xác thực lệnh Telegram ổn định khi dự phòng nếu bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Trình trợ giúp lời nhắc phê duyệt | Payload phê duyệt exec/plugin, trình trợ giúp năng lực/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Trình trợ giúp máy khách phê duyệt | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
  | `plugin-sdk/approval-delivery-runtime` | Trình trợ giúp phân phối phê duyệt | Bộ chuyển đổi năng lực/phân phối phê duyệt gốc |
  | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp Gateway phê duyệt | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp bộ chuyển đổi phê duyệt | Trình trợ giúp nhẹ để tải bộ chuyển đổi phê duyệt gốc cho điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp handler phê duyệt | Trình trợ giúp runtime handler phê duyệt rộng hơn; ưu tiên các đường nối bộ chuyển đổi/Gateway hẹp hơn khi đủ dùng |
  | `plugin-sdk/approval-native-runtime` | Trình trợ giúp đích phê duyệt | Trình trợ giúp liên kết đích/tài khoản phê duyệt gốc |
  | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp trả lời phê duyệt | Trình trợ giúp payload trả lời phê duyệt exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Trình trợ giúp ngữ cảnh runtime kênh | Trình trợ giúp đăng ký/lấy/theo dõi ngữ cảnh runtime kênh tổng quát |
  | `plugin-sdk/security-runtime` | Trình trợ giúp bảo mật | Trình trợ giúp tin cậy, kiểm soát DM, tệp/đường dẫn giới hạn theo gốc, nội dung bên ngoài và thu thập bí mật dùng chung |
  | `plugin-sdk/ssrf-policy` | Trình trợ giúp chính sách SSRF | Trình trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trình trợ giúp runtime SSRF | Dispatcher cố định, fetch được bảo vệ, trình trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trình trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp Heartbeat | Trình trợ giúp sự kiện Heartbeat và khả năng hiển thị |
  | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trình trợ giúp khử trùng lặp | Bộ nhớ đệm khử trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Trình trợ giúp truy cập tệp | Trình trợ giúp đường dẫn tệp/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp mức sẵn sàng transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Trình trợ giúp cache có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp kiểm soát chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trình trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch/proxy được bọc | `resolveFetch`, trình trợ giúp proxy, trình trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trình trợ giúp retry | `RetryConfig`, `retryAsync`, trình chạy chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Ánh xạ đầu vào danh sách cho phép | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Trình trợ giúp kiểm soát lệnh và bề mặt lệnh | `resolveControlCommandGate`, trình trợ giúp ủy quyền người gửi, trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Trình render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Trình trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Trình trợ giúp guard thân Webhook | Trình trợ giúp đọc/giới hạn thân yêu cầu |
  | `plugin-sdk/reply-runtime` | Runtime trả lời dùng chung | Điều phối đến, Heartbeat, trình lập kế hoạch trả lời, chia đoạn |
  | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối nhà cung cấp và trình trợ giúp nhãn cuộc trò chuyện |
  | `plugin-sdk/reply-history` | Trình trợ giúp lịch sử trả lời | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trình trợ giúp chia đoạn trả lời | Trình trợ giúp chia đoạn văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên | Trình trợ giúp đường dẫn kho + thời điểm cập nhật |
  | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn trạng thái | Trình trợ giúp trạng thái và thư mục OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa session-key |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Trình dựng tóm tắt trạng thái kênh/tài khoản, mặc định trạng thái runtime, trình trợ giúp metadata sự cố |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp bộ phân giải đích | Trình trợ giúp bộ phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL dạng chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có thời hạn | Trình chạy lệnh có thời hạn với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Trình đọc tham số | Trình đọc tham số công cụ/CLI phổ biến |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất các payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất thao tác gửi của công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình hỗ trợ đường dẫn tạm thời | Trình hỗ trợ đường dẫn tải xuống tạm thời dùng chung |
  | `plugin-sdk/logging-core` | Trình hỗ trợ ghi log | Trình hỗ trợ logger hệ thống con và biên tập dữ liệu nhạy cảm |
  | `plugin-sdk/markdown-table-runtime` | Trình hỗ trợ bảng Markdown | Trình hỗ trợ chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình hỗ trợ thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình hỗ trợ khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình hỗ trợ thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có phạm vi tập trung | Cùng các trình hỗ trợ khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình hỗ trợ xác thực runtime của nhà cung cấp | Trình hỗ trợ phân giải khóa API runtime |
  | `plugin-sdk/provider-auth-api-key` | Trình hỗ trợ thiết lập khóa API của nhà cung cấp | Trình hỗ trợ onboarding/ghi hồ sơ khóa API |
  | `plugin-sdk/provider-auth-result` | Trình hỗ trợ kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth chuẩn |
  | `plugin-sdk/provider-auth-login` | Trình hỗ trợ đăng nhập tương tác của nhà cung cấp | Trình hỗ trợ đăng nhập tương tác dùng chung |
  | `plugin-sdk/provider-selection-runtime` | Trình hỗ trợ chọn nhà cung cấp | Lựa chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình hỗ trợ biến môi trường của nhà cung cấp | Trình hỗ trợ tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình hỗ trợ mô hình/phát lại dùng chung của nhà cung cấp | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình hỗ trợ endpoint nhà cung cấp, và trình hỗ trợ chuẩn hóa mã định danh mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình hỗ trợ catalog nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình hỗ trợ cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình hỗ trợ HTTP của nhà cung cấp | Trình hỗ trợ khả năng HTTP/endpoint chung của nhà cung cấp, bao gồm trình hỗ trợ biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình hỗ trợ web-fetch của nhà cung cấp | Trình hỗ trợ đăng ký/cache nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình hỗ trợ cấu hình web-search của nhà cung cấp | Trình hỗ trợ cấu hình/thông tin xác thực web-search phạm vi hẹp cho các nhà cung cấp không cần nối dây bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình hỗ trợ hợp đồng web-search của nhà cung cấp | Trình hỗ trợ hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, và setter/getter thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình hỗ trợ web-search của nhà cung cấp | Trình hỗ trợ đăng ký/cache/runtime nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình hỗ trợ tương thích công cụ/schema của nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dọn dẹp schema Gemini + chẩn đoán, và trình hỗ trợ tương thích xAI như `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Trình hỗ trợ mức sử dụng của nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, và các trình hỗ trợ mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình hỗ trợ wrapper luồng của nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng, và trình hỗ trợ wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
  | `plugin-sdk/provider-transport-runtime` | Trình hỗ trợ transport của nhà cung cấp | Trình hỗ trợ transport gốc của nhà cung cấp như guarded fetch, chuyển đổi tin nhắn transport, và luồng sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình hỗ trợ media dùng chung | Trình hỗ trợ tìm nạp/chuyển đổi/lưu media, thăm dò kích thước video dựa trên ffprobe, và bộ dựng payload media |
  | `plugin-sdk/media-generation-runtime` | Trình hỗ trợ tạo media dùng chung | Trình hỗ trợ chuyển đổi dự phòng dùng chung, chọn ứng viên, và thông báo thiếu mô hình cho tạo ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình hỗ trợ hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trình hỗ trợ ảnh/âm thanh hướng tới nhà cung cấp |
  | `plugin-sdk/text-runtime` | Trình hỗ trợ văn bản dùng chung | Loại bỏ văn bản hiển thị với trợ lý, trình hỗ trợ kết xuất/chia đoạn/bảng markdown, trình hỗ trợ biên tập dữ liệu nhạy cảm, trình hỗ trợ thẻ chỉ thị, tiện ích văn bản an toàn, và trình hỗ trợ văn bản/ghi log liên quan |
  | `plugin-sdk/text-chunking` | Trình hỗ trợ chia đoạn văn bản | Trình hỗ trợ chia đoạn văn bản gửi đi |
  | `plugin-sdk/speech` | Trình hỗ trợ giọng nói | Kiểu nhà cung cấp giọng nói cùng trình hỗ trợ chỉ thị, registry, xác thực hướng tới nhà cung cấp, và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình hỗ trợ phiên âm thời gian thực | Kiểu nhà cung cấp, trình hỗ trợ registry, và trình hỗ trợ phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình hỗ trợ giọng nói thời gian thực | Kiểu nhà cung cấp, trình hỗ trợ registry/phân giải, trình hỗ trợ phiên cầu nối, hàng đợi phản hồi bằng giọng nói của tác nhân dùng chung, sức khỏe transcript/sự kiện, triệt tiếng vọng, và trình hỗ trợ tham vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình hỗ trợ tạo ảnh | Kiểu nhà cung cấp tạo ảnh cùng trình hỗ trợ URL dữ liệu/tài sản ảnh và bộ dựng nhà cung cấp ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo ảnh dùng chung | Kiểu tạo ảnh, chuyển đổi dự phòng, xác thực, và trình hỗ trợ registry |
  | `plugin-sdk/music-generation` | Trình hỗ trợ tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình hỗ trợ chuyển đổi dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
  | `plugin-sdk/video-generation` | Trình hỗ trợ tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình hỗ trợ chuyển đổi dự phòng, tra cứu nhà cung cấp, và phân tích model-ref |
  | `plugin-sdk/interactive-runtime` | Trình hỗ trợ trả lời tương tác | Chuẩn hóa/rút gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Primitive cấu hình kênh | Primitive schema cấu hình kênh phạm vi hẹp |
  | `plugin-sdk/channel-config-writes` | Trình hỗ trợ ghi cấu hình kênh | Trình hỗ trợ ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Prelude kênh dùng chung | Export prelude Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình hỗ trợ trạng thái kênh | Trình hỗ trợ snapshot/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình hỗ trợ cấu hình allowlist | Trình hỗ trợ chỉnh sửa/đọc cấu hình allowlist |
  | `plugin-sdk/group-access` | Trình hỗ trợ truy cập nhóm | Trình hỗ trợ quyết định truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm` | Trình hỗ trợ DM trực tiếp | Trình hỗ trợ xác thực/bảo vệ DM trực tiếp dùng chung |
  | `plugin-sdk/extension-shared` | Trình hỗ trợ phần mở rộng dùng chung | Primitive trình hỗ trợ kênh thụ động/trạng thái và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình hỗ trợ đích Webhook | Registry đích Webhook và trình hỗ trợ cài đặt route |
  | `plugin-sdk/webhook-path` | Trình hỗ trợ đường dẫn Webhook | Trình hỗ trợ chuẩn hóa đường dẫn Webhook |
  | `plugin-sdk/web-media` | Trình hỗ trợ media web dùng chung | Trình hỗ trợ tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Tái export Zod | `zod` được tái export cho người dùng SDK Plugin |
  | `plugin-sdk/memory-core` | Trình hỗ trợ memory-core đi kèm | Bề mặt trình hỗ trợ trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime công cụ bộ nhớ | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Công cụ nền tảng host bộ nhớ | Export công cụ nền tảng host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Công cụ embedding host bộ nhớ | Hợp đồng embedding bộ nhớ, truy cập registry, nhà cung cấp cục bộ, và trình hỗ trợ batch/từ xa chung; nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu của chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Công cụ QMD host bộ nhớ | Export công cụ QMD host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Công cụ lưu trữ host bộ nhớ | Export công cụ lưu trữ host bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình hỗ trợ đa phương thức host bộ nhớ | Trình hỗ trợ đa phương thức host bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình hỗ trợ truy vấn host bộ nhớ | Trình hỗ trợ truy vấn host bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình hỗ trợ bí mật host bộ nhớ | Trình hỗ trợ bí mật host bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Trình hỗ trợ nhật ký sự kiện host bộ nhớ | Trình hỗ trợ nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-core-host-status` | Trình hỗ trợ trạng thái host bộ nhớ | Trình hỗ trợ trạng thái host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host bộ nhớ | Trình hỗ trợ runtime CLI host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime lõi host bộ nhớ | Trình hỗ trợ runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình hỗ trợ tệp/runtime host bộ nhớ | Trình hỗ trợ tệp/runtime host bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh runtime lõi host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình hỗ trợ runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình hỗ trợ nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/runtime host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình hỗ trợ tệp/runtime host bộ nhớ |
  | `plugin-sdk/memory-host-markdown` | Trình hỗ trợ markdown được quản lý | Trình hỗ trợ managed-markdown dùng chung cho các Plugin liền kề bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm active memory | Facade runtime trình quản lý tìm kiếm active-memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình hỗ trợ trạng thái host bộ nhớ |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích rộng kế thừa; ưu tiên các đường dẫn con kiểm thử tập trung như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý chỉ là tập con di trú chung, không phải toàn bộ bề mặt SDK. Danh sách đầy đủ hơn 200 entrypoint nằm trong `scripts/lib/plugin-sdk-entrypoints.json`.

Các seam trợ giúp dành riêng cho Plugin đi kèm đã được loại bỏ khỏi export map SDK công khai, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng như shim `plugin-sdk/discord` đã lỗi thời vẫn được giữ lại cho gói đã phát hành `@openclaw/discord@2026.3.13`. Helper theo từng chủ sở hữu nằm bên trong gói Plugin sở hữu nó; hành vi host dùng chung nên đi qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.

Dùng import hẹp nhất phù hợp với công việc. Nếu bạn không tìm thấy export, hãy kiểm tra nguồn tại `src/plugin-sdk/` hoặc hỏi maintainers hợp đồng chung nào nên sở hữu nó.

## Các mục ngừng dùng đang hoạt động

Các mục ngừng dùng hẹp hơn áp dụng trên toàn SDK Plugin, hợp đồng provider, bề mặt runtime, và manifest. Mỗi mục vẫn hoạt động hôm nay nhưng sẽ bị gỡ bỏ trong một bản phát hành major trong tương lai. Dòng bên dưới mỗi mục ánh xạ API cũ sang phần thay thế chính thức.

<AccordionGroup>
  <Accordion title="Trình dựng trợ giúp command-auth → command-status">
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

    Các Plugin kênh downstream (Slack, Discord, Matrix, MS Teams) đã chuyển đổi.

  </Accordion>

  <Accordion title="Shim runtime kênh và helper thao tác kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Đừng import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng dùng cùng với export kênh "actions" thô. Thay vào đó hãy phơi bày
    capability qua bề mặt `presentation` có ngữ nghĩa - Plugin kênh khai báo
    những gì chúng hiển thị (thẻ, nút, select) thay vì các tên action thô mà
    chúng chấp nhận.

  </Accordion>

  <Accordion title="Helper tool() của provider tìm kiếm web → createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper của công cụ.

  </Accordion>

  <Accordion title="Envelope kênh plaintext → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để dựng một envelope prompt
    plaintext phẳng từ tin nhắn kênh inbound.

    **Mới**: `BodyForAgent` cùng các khối ngữ cảnh người dùng có cấu trúc.
    Plugin kênh gắn metadata định tuyến (thread, topic, reply-to, reactions)
    dưới dạng trường có kiểu thay vì nối chúng vào một chuỗi prompt. Helper
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope hướng tới
    assistant được tổng hợp, nhưng envelope plaintext inbound đang trên đường
    bị loại bỏ.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và mọi Plugin
    kênh tùy chỉnh đã hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="Kiểu khám phá provider → kiểu catalog provider">
    Bốn alias kiểu khám phá giờ là wrapper mỏng trên các kiểu thời kỳ catalog:

    | Alias cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng với túi tĩnh `ProviderCapabilities` cũ - Plugin provider nên dùng các
    hook provider rõ ràng như `buildReplayPolicy`, `normalizeToolSchemas`, và
    `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách suy nghĩ → resolveThinkingProfile">
    **Cũ** (ba hook riêng trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về một
    `ProviderThinkingProfile` với `id` chính thức, `label` tùy chọn, và danh
    sách mức được xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu bị cũ
    theo thứ hạng profile.

    Triển khai một hook thay vì ba. Các hook cũ tiếp tục hoạt động trong khoảng
    thời gian ngừng dùng nhưng không được kết hợp với kết quả profile.

  </Accordion>

  <Accordion title="Fallback provider OAuth bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai `resolveExternalOAuthProfiles(...)` mà không khai báo
    provider trong manifest Plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest Plugin
    **và** triển khai `resolveExternalAuthProfiles(...)`. Đường dẫn "auth
    fallback" cũ phát ra cảnh báo ở runtime và sẽ bị gỡ bỏ.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Tra cứu env-var của provider → setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng tra cứu env-var vào `setup.providers[].envVars`
    trên manifest. Điều này hợp nhất metadata env cho thiết lập/trạng thái ở
    một nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu
    env-var.

    `providerAuthEnvVars` vẫn được hỗ trợ qua adapter tương thích cho đến khi
    khoảng thời gian ngừng dùng kết thúc.

  </Accordion>

  <Accordion title="Đăng ký Plugin bộ nhớ → registerMemoryCapability">
    **Cũ**: ba lệnh gọi riêng -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lệnh gọi trên API trạng thái bộ nhớ -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các slot, một lệnh gọi đăng ký duy nhất. Các helper bộ nhớ bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) không bị ảnh hưởng.

  </Accordion>

  <Accordion title="Kiểu tin nhắn phiên subagent đã được đổi tên">
    Hai alias kiểu cũ vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng dùng để thay bằng
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp sang
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime đột biến TaskFlow được
    quản lý cho các Plugin tạo, cập nhật, hủy, hoặc chạy tác vụ con từ một
    flow. Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension nhúng → middleware kết quả công cụ agent">
    Đã được trình bày trong phần "Cách di trú → Di trú extension kết quả công cụ
    Pi sang middleware" ở trên. Đưa vào đây để đầy đủ: đường dẫn chỉ dành cho Pi
    đã bị gỡ bỏ `api.registerEmbeddedExtensionFactory(...)` được thay bằng
    `api.registerAgentToolResultMiddleware(...)` với một danh sách runtime rõ
    ràng trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` giờ là alias
    một dòng cho `OpenClawConfig`. Hãy ưu tiên tên chính thức.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các mục ngừng dùng ở cấp extension (bên trong các Plugin kênh/provider đi kèm
dưới `extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin bên thứ ba và không
được liệt kê ở đây. Nếu bạn dùng trực tiếp barrel cục bộ của một Plugin đi kèm,
hãy đọc các chú thích ngừng dùng trong barrel đó trước khi nâng cấp.
</Note>

## Lộ trình gỡ bỏ

| Khi nào                | Điều xảy ra                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Hiện tại**           | Các bề mặt đã ngừng dùng phát ra cảnh báo runtime                       |
| **Bản phát hành major tiếp theo** | Các bề mặt đã ngừng dùng sẽ bị gỡ bỏ; Plugin vẫn dùng chúng sẽ lỗi |

Tất cả Plugin lõi đã được di trú. Plugin bên ngoài nên di trú trước bản phát
hành major tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này trong khi bạn di trú:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng Plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tài liệu tham khảo import subpath đầy đủ
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng Plugin kênh
- [Plugin provider](/vi/plugins/sdk-provider-plugins) - xây dựng Plugin provider
- [Nội bộ Plugin](/vi/plugins/architecture) - phân tích sâu kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) - tài liệu tham khảo schema manifest
