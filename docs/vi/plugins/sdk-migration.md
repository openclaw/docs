---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã dùng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một plugin lên kiến trúc plugin hiện đại
    - Bạn bảo trì một plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Di chuyển Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:47:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang một kiến trúc Plugin hiện đại với các import có trọng tâm và được ghi tài liệu. Nếu Plugin của bạn được xây dựng trước kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Những gì đang thay đổi

Hệ thống Plugin cũ cung cấp hai bề mặt mở rộng, cho phép Plugin import bất cứ thứ gì chúng cần từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất re-export hàng chục
  helper. Nó được giới thiệu để giữ cho các Plugin dựa trên hook cũ tiếp tục hoạt động trong khi
  kiến trúc Plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel helper runtime rộng,
  trộn lẫn sự kiện hệ thống, trạng thái Heartbeat, hàng đợi phân phối, helper fetch/proxy,
  helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng
  vẫn mang các helper load/write trực tiếp đã bị ngừng khuyến nghị trong giai đoạn
  di chuyển.
- **`openclaw/extension-api`** - một cầu nối cho phép Plugin truy cập trực tiếp vào
  các helper phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook tiện ích mở rộng bundled chỉ dành cho embedded-runner đã bị loại bỏ,
  từng có thể quan sát các sự kiện embedded-runner như
  `tool_result`.

Các bề mặt import rộng hiện đã **bị ngừng khuyến nghị**. Chúng vẫn hoạt động ở runtime,
nhưng Plugin mới không được dùng chúng, và các Plugin hiện có nên di chuyển trước khi
bản phát hành major tiếp theo loại bỏ chúng. API đăng ký extension factory chỉ dành cho embedded-runner
đã bị loại bỏ; hãy dùng middleware kết quả công cụ thay thế.

OpenClaw không loại bỏ hoặc diễn giải lại hành vi Plugin đã được ghi tài liệu trong cùng
thay đổi giới thiệu phương án thay thế. Các thay đổi phá vỡ hợp đồng trước tiên phải đi
qua bộ chuyển đổi tương thích, chẩn đoán, tài liệu và giai đoạn ngừng khuyến nghị.
Điều đó áp dụng cho import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong một bản phát hành major trong tương lai.
  Các Plugin vẫn import từ những bề mặt này sẽ bị lỗi khi điều đó xảy ra.
  Các đăng ký legacy embedded extension factory hiện đã không còn được load.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** - import một helper đã load hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** - các re-export rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách nào biết export nào ổn định và export nào là nội bộ

SDK Plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`)
là một mô-đun nhỏ, tự chứa, có mục đích rõ ràng và hợp đồng được ghi tài liệu.

Các seam tiện ích provider legacy cho các kênh bundled cũng đã bị loại bỏ.
Các seam helper mang thương hiệu kênh là lối tắt riêng của mono-repo, không phải
hợp đồng Plugin ổn định. Hãy dùng các subpath SDK chung, hẹp thay thế. Bên trong workspace
Plugin bundled, giữ các helper do provider sở hữu trong `api.ts` hoặc
`runtime-api.ts` của chính Plugin đó.

Ví dụ provider bundled hiện tại:

- Anthropic giữ các helper stream dành riêng cho Claude trong seam `api.ts` /
  `contract-api.ts` của riêng nó
- OpenAI giữ provider builder, helper model mặc định và realtime provider
  builder trong `api.ts` của riêng nó
- OpenRouter giữ provider builder và helper onboarding/config trong
  `api.ts` của riêng nó

## Kế hoạch di chuyển Talk và giọng nói realtime

Mã Talk cho giọng nói realtime, điện thoại, cuộc họp và trình duyệt đang chuyển từ
ghi sổ lượt cục bộ theo bề mặt sang một bộ điều khiển phiên Talk dùng chung được export bởi
`openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu envelope sự kiện Talk
chung, trạng thái lượt đang hoạt động, trạng thái capture, trạng thái output-audio, lịch sử
sự kiện gần đây và từ chối lượt đã cũ. Plugin provider nên tiếp tục sở hữu
các phiên realtime đặc thù theo nhà cung cấp; Plugin bề mặt nên tiếp tục sở hữu capture,
playback, điện thoại và các khác biệt riêng của cuộc họp.

Đợt di chuyển Talk này cố ý là breaking-clean:

1. Giữ controller/runtime primitive dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt bundled sang controller dùng chung: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime và native push-to-talk.
3. Thay các họ RPC Talk cũ bằng API cuối cùng `talk.session.*` và
   `talk.client.*`.
4. Quảng bá một kênh sự kiện Talk live trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP realtime cũ và mọi đường dẫn ghi đè instruction theo thời điểm request.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi nó đang
triển khai một adapter cấp thấp hoặc fixture kiểm thử. Ưu tiên controller dùng chung
để sự kiện theo phạm vi lượt không thể được phát ra nếu thiếu turn id, các lệnh gọi `turnEnd` /
`turnCancel` đã cũ không thể xóa một lượt đang hoạt động mới hơn, và các sự kiện lifecycle
output-audio luôn nhất quán trên điện thoại, cuộc họp, browser relay, managed-room
handoff và client Talk native.

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

Các phiên WebRTC/provider-websocket do trình duyệt sở hữu dùng `talk.client.create`,
vì trình duyệt sở hữu thương lượng provider và transport media trong khi
Gateway sở hữu thông tin xác thực, instruction và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho gateway-relay realtime, gateway-relay
transcription và các phiên STT/TTS native managed-room.

Các cấu hình legacy đặt bộ chọn realtime cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime
không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider realtime.

Các tổ hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Transport       | Brain           | Chủ sở hữu         | Ghi chú                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh provider full-duplex được bắc cầu qua Gateway; lệnh gọi công cụ được định tuyến qua công cụ agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ streaming STT; caller gửi âm thanh đầu vào và nhận sự kiện bản ghi.                                            |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie nơi client sở hữu capture/playback và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt first-party đáng tin cậy thực thi trực tiếp hành động công cụ Gateway. |

Bảng phương thức đã bị loại bỏ:

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

  | Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                                                                                                                                      |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Thêm một đoạn âm thanh PCM base64 vào phiên nhà cung cấp do cùng kết nối Gateway sở hữu.                                                                                                                     |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng trong managed-room.                                                                                                                                                               |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực stale-turn.                                                                                                                                                     |
  | `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                          | Hủy công việc capture/provider/agent/TTS đang hoạt động cho một lượt.                                                                                                                                         |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của assistant mà không nhất thiết kết thúc lượt người dùng.                                                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lệnh gọi công cụ của nhà cung cấp do relay phát ra; truyền `options.willContinue` cho đầu ra tạm thời hoặc `options.suppressResponse` để đáp ứng lệnh gọi mà không có phản hồi assistant khác. |
  | `talk.session.steer`            | các phiên Talk được agent hỗ trợ                        | Gửi điều khiển bằng lời nói `status`, `steer`, `cancel`, hoặc `followup` đến lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                                                     |
  | `talk.session.close`            | tất cả phiên hợp nhất                                   | Dừng các phiên relay hoặc thu hồi trạng thái managed-room, rồi quên id phiên hợp nhất.                                                                                                                        |

  Không đưa các trường hợp đặc biệt theo nhà cung cấp hoặc nền tảng vào core để làm cho việc này hoạt động.
  Core sở hữu ngữ nghĩa phiên Talk. Plugin nhà cung cấp sở hữu thiết lập phiên của nhà cung cấp.
  Voice-call và Google Meet sở hữu các adapter điện thoại/họp. Trình duyệt và ứng dụng native
  sở hữu UX capture/playback của thiết bị.

  ## Chính sách tương thích

  Đối với Plugin bên ngoài, công việc tương thích tuân theo thứ tự này:

  1. thêm hợp đồng mới
  2. giữ hành vi cũ được nối qua một adapter tương thích
  3. phát ra chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
  4. bao phủ cả hai đường dẫn trong kiểm thử
  5. ghi tài liệu về việc ngừng hỗ trợ và đường dẫn di chuyển
  6. chỉ gỡ bỏ sau khoảng thời gian di chuyển đã công bố, thường trong một bản phát hành lớn

  Maintainer có thể kiểm tra hàng đợi di chuyển hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để có
  số lượng cô đọng, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi một cổng CI cần thất bại với các bản ghi
  tương thích đã đến hạn, import SDK dành riêng chéo chủ sở hữu, hoặc các subpath SDK
  dành riêng không dùng. Báo cáo nhóm các bản ghi
  tương thích đã ngừng hỗ trợ theo ngày gỡ bỏ, đếm các tham chiếu code/tài liệu cục bộ,
  nêu bật các import SDK dành riêng chéo chủ sở hữu, và tóm tắt cầu nối SDK
  memory-host riêng tư để việc dọn dẹp tương thích luôn rõ ràng thay vì
  dựa vào các tìm kiếm ad hoc. Các subpath SDK dành riêng phải có usage của chủ sở hữu được theo dõi;
  các helper export dành riêng không dùng nên được gỡ khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng nó cho đến khi
  tài liệu và chẩn đoán nói khác. Code mới nên ưu tiên phần thay thế đã ghi tài liệu,
  nhưng các Plugin hiện có không nên bị hỏng trong các bản phát hành minor thông thường.

  ## Cách di chuyển

  <Steps>
  <Step title="Di chuyển helper tải/ghi cấu hình runtime">
    Plugin được bundled nên dừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã
    được truyền vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần
    snapshot quy trình hiện tại có thể dùng `api.runtime.config.current()`. Các
    công cụ agent tồn tại lâu nên dùng `ctx.getRuntimeConfig()` của context công cụ bên trong
    `execute` để một công cụ được tạo trước khi ghi cấu hình vẫn thấy
    cấu hình runtime đã được làm mới.

    Việc ghi cấu hình phải đi qua các helper giao dịch và chọn một
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
    thay đổi yêu cầu restart gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi caller sở hữu phần
    tiếp theo và cố ý muốn chặn reload planner.
    Kết quả mutation bao gồm bản tóm tắt `followUp` có kiểu cho kiểm thử và logging;
    gateway vẫn chịu trách nhiệm áp dụng hoặc lên lịch restart.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng hỗ trợ
    cho Plugin bên ngoài trong khoảng thời gian di chuyển và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Plugin được bundled và code runtime
    trong repo được bảo vệ bằng guardrail scanner trong
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: usage Plugin production mới
    thất bại ngay, ghi cấu hình trực tiếp thất bại, các phương thức gateway server phải dùng
    snapshot runtime của request, các helper gửi/hành động/client của kênh runtime
    phải nhận cấu hình từ boundary của chúng, và các module runtime tồn tại lâu có
    không cuộc gọi ambient `loadConfig()` nào được phép.

    Code Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng subpath SDK hẹp
    khớp với công việc:

    | Nhu cầu | Đường dẫn import |
    | --- | --- |
    | Kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion cấu hình đã tải và tra cứu cấu hình plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải input bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè model/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin được bundled và kiểm thử của chúng được scanner bảo vệ khỏi barrel rộng
    để import và mock vẫn cục bộ theo hành vi chúng cần. Barrel rộng
    vẫn tồn tại để tương thích bên ngoài, nhưng code mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Di chuyển phần mở rộng kết quả công cụ nhúng sang middleware">
    Plugin được bundled phải thay thế các handler kết quả công cụ chỉ dành cho embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` bằng
    middleware trung lập với runtime.

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

    Plugin đã cài đặt cũng có thể đăng ký middleware kết quả công cụ khi chúng được
    bật rõ ràng và khai báo mọi runtime được nhắm tới trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài đặt nhưng không khai báo
    sẽ bị từ chối.

  </Step>

  <Step title="Di chuyển handler native phê duyệt sang capability facts">
    Plugin kênh có khả năng phê duyệt hiện bộc lộ hành vi phê duyệt native qua
    `approvalCapability.nativeRuntime` cộng với registry runtime-context dùng chung.

    Các thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery dành riêng cho phê duyệt khỏi wiring cũ `plugin.auth` /
      `plugin.approvals` và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị gỡ khỏi hợp đồng channel-plugin công khai;
      chuyển các trường delivery/native/render sang `approvalCapability`
    - `plugin.auth` chỉ còn dùng cho luồng đăng nhập/đăng xuất kênh; các hook auth
      phê duyệt ở đó không còn được core đọc
    - Đăng ký các đối tượng runtime do kênh sở hữu như client, token, hoặc ứng dụng Bolt
      thông qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo chuyển hướng lại do Plugin sở hữu từ handler phê duyệt native;
      core hiện sở hữu thông báo đã được định tuyến nơi khác từ kết quả delivery thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, cung cấp một
      surface `createPluginRuntime().channel` thực. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục capability phê duyệt hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi fallback của wrapper Windows">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` không phân giải được hiện sẽ fail closed trừ khi bạn truyền rõ ràng
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

    Nếu caller của bạn không cố ý dựa vào shell fallback, đừng đặt
    `allowShellFallback` và thay vào đó hãy xử lý lỗi được throw.

  </Step>

  <Step title="Tìm các import đã ngừng hỗ trợ">
    Tìm trong Plugin của bạn các import từ một trong các surface đã ngừng hỗ trợ:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Thay bằng import tập trung">
    Mỗi export từ surface cũ ánh xạ tới một đường dẫn import hiện đại cụ thể:

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

    Đối với helper phía host, hãy dùng runtime Plugin được inject thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Mẫu tương tự áp dụng cho các helper cầu nối cũ khác:

    | Lệnh import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper kho phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay thế các import infra-runtime rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích với bên
    ngoài, nhưng mã mới nên import bề mặt helper tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper đánh thức, sự kiện và khả năng hiển thị của Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi giao hàng đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Đo từ xa hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ nhớ đệm chống trùng lặp trong bộ nhớ và được hỗ trợ bởi lưu trữ bền vững | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper đường dẫn tệp/phương tiện cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy và fetch được bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Kiểu yêu cầu/phân giải phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload phản hồi phê duyệt và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Giới hạn đồng thời tác vụ bất đồng bộ | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các Plugin đi kèm được bộ quét bảo vệ khỏi `infra-runtime`, nên mã trong repo
    không thể hồi quy về barrel rộng.

  </Step>

  <Step title="Di chuyển các helper định tuyến kênh">
    Mã định tuyến kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ vẫn được giữ làm alias tương thích
    trong giai đoạn di chuyển, nhưng Plugin mới nên dùng các tên route mô tả
    trực tiếp hành vi:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các helper route hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    nhất quán trên phê duyệt gốc, chặn phản hồi, chống trùng lặp đầu vào,
    giao hàng cron và định tuyến phiên.

    Không thêm cách dùng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    các helper loaded-route được hỗ trợ bởi parser (`parseExplicitTargetForLoadedChannel`
    hoặc `resolveRouteTargetForLoadedChannel`) hoặc
    `resolveChannelRouteTargetWithParser(...)` từ `plugin-sdk/channel-route`.
    Các hook đó đã bị phản đối và chỉ còn giữ lại cho Plugin cũ trong giai đoạn
    di chuyển. Plugin kênh mới nên dùng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa id đích
    và fallback khi không tìm thấy thư mục, `messaging.inferTargetChatType(...)` khi core
    cần loại peer sớm, và `messaging.resolveOutboundSessionRoute(...)`
    cho phiên gốc của provider và danh tính luồng.

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
  | `plugin-sdk/plugin-entry` | Trình trợ giúp điểm vào Plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export ô bao kế thừa cho định nghĩa/trình dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export schema cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình trợ giúp điểm vào nhà cung cấp đơn | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và trình dựng điểm vào kênh tập trung | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung | Bộ dịch thiết lập, lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trình trợ giúp runtime trong lúc thiết lập | `createSetupTranslator`, bộ điều hợp bản vá thiết lập an toàn khi import, trình trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Bí danh bộ điều hợp thiết lập đã ngừng dùng | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Trình trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trình trợ giúp nhiều tài khoản | Trình trợ giúp danh sách tài khoản/cấu hình/cổng hành động |
  | `plugin-sdk/account-id` | Trình trợ giúp account-id | `DEFAULT_ACCOUNT_ID`, chuẩn hóa account-id |
  | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trình trợ giúp tài khoản phạm vi hẹp | Trình trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ điều hợp trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cộng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Nguyên hàm ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Nối dây tiền tố trả lời, typing và phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory bộ điều hợp cấu hình và trình trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình dựng schema cấu hình | Chỉ gồm nguyên hàm schema cấu hình kênh dùng chung và trình dựng tổng quát |
  | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình đóng gói | Chỉ dành cho Plugin đóng gói do OpenClaw duy trì; Plugin mới phải định nghĩa schema cục bộ trong Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schema cấu hình đóng gói đã ngừng dùng | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho Plugin đóng gói được duy trì |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Trình trợ giúp phong bì inbound | Trình trợ giúp route dùng chung + trình dựng phong bì |
  | `plugin-sdk/channel-inbound` | Trình trợ giúp nhận inbound | Dựng ngữ cảnh, định dạng, root, runner, điều phối trả lời đã chuẩn bị và predicate điều phối |
  | `plugin-sdk/messaging-targets` | Đường dẫn import phân tích cú pháp đích đã ngừng dùng | Dùng `plugin-sdk/channel-targets` cho trình trợ giúp phân tích cú pháp đích tổng quát, `plugin-sdk/channel-route` để so sánh route, và `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do Plugin sở hữu để phân giải đích theo nhà cung cấp |
  | `plugin-sdk/outbound-media` | Trình trợ giúp media outbound | Tải media outbound dùng chung |
  | `plugin-sdk/outbound-send-deps` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Trình trợ giúp vòng đời tin nhắn outbound | Bộ điều hợp tin nhắn, biên nhận, trình trợ giúp gửi bền vững, trình trợ giúp xem trước trực tiếp/streaming, tùy chọn trả lời, trình trợ giúp vòng đời, danh tính outbound và lập kế hoạch payload |
  | `plugin-sdk/channel-streaming` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp liên kết luồng | Vòng đời liên kết luồng và trình trợ giúp bộ điều hợp |
  | `plugin-sdk/agent-media-payload` | Trình trợ giúp payload media kế thừa | Trình dựng payload media của agent cho bố cục trường kế thừa |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng dùng | Chỉ gồm tiện ích runtime kênh kế thừa |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trình trợ giúp runtime phạm vi rộng | Trình trợ giúp runtime/ghi log/sao lưu/cài đặt Plugin |
  | `plugin-sdk/runtime-env` | Trình trợ giúp env runtime phạm vi hẹp | Env logger/runtime, timeout, retry và trình trợ giúp backoff |
  | `plugin-sdk/plugin-runtime` | Trình trợ giúp runtime Plugin dùng chung | Trình trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Trình trợ giúp pipeline hook | Trình trợ giúp pipeline webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trình trợ giúp runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trình trợ giúp tiến trình | Trình trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trình trợ giúp runtime CLI | Định dạng lệnh, chờ, trình trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Trình trợ giúp Gateway | Client Gateway, trình trợ giúp khởi động sẵn sàng vòng lặp sự kiện, phân giải host LAN được quảng bá và trình trợ giúp bản vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng dùng | Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp lệnh Telegram | Trình trợ giúp xác thực lệnh Telegram ổn định với dự phòng khi bề mặt hợp đồng Telegram đóng gói không khả dụng |
  | `plugin-sdk/approval-runtime` | Trình trợ giúp lời nhắc phê duyệt | Payload phê duyệt exec/Plugin, trình trợ giúp năng lực/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động cùng chat |
  | `plugin-sdk/approval-client-runtime` | Trình trợ giúp client phê duyệt | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
  | `plugin-sdk/approval-delivery-runtime` | Trình trợ giúp phân phối phê duyệt | Bộ điều hợp năng lực/phân phối phê duyệt gốc |
  | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp Gateway phê duyệt | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp bộ điều hợp phê duyệt | Trình trợ giúp tải bộ điều hợp phê duyệt gốc gọn nhẹ cho điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp handler phê duyệt | Trình trợ giúp runtime handler phê duyệt rộng hơn; ưu tiên các seam bộ điều hợp/Gateway hẹp hơn khi đã đủ |
  | `plugin-sdk/approval-native-runtime` | Trình trợ giúp đích phê duyệt | Trình trợ giúp liên kết đích/tài khoản phê duyệt gốc |
  | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp trả lời phê duyệt | Trình trợ giúp payload trả lời phê duyệt exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Trình trợ giúp ngữ cảnh runtime kênh | Trình trợ giúp đăng ký/lấy/theo dõi ngữ cảnh runtime kênh tổng quát |
  | `plugin-sdk/security-runtime` | Trình trợ giúp bảo mật | Trình trợ giúp tin cậy, cổng DM, file/đường dẫn giới hạn theo root, nội dung bên ngoài và thu thập bí mật dùng chung |
  | `plugin-sdk/ssrf-policy` | Trình trợ giúp chính sách SSRF | Trình trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trình trợ giúp runtime SSRF | Dispatcher được ghim, fetch có bảo vệ, trình trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trình trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp Heartbeat | Trình trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trình trợ giúp khử trùng lặp | Cache khử trùng lặp trong bộ nhớ và được hỗ trợ bằng lưu trữ bền vững |
  | `plugin-sdk/file-access-runtime` | Trình trợ giúp truy cập file | Trình trợ giúp đường dẫn file/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp mức sẵn sàng transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Trình trợ giúp chính sách phê duyệt exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Trình trợ giúp cache có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trình trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch/proxy được bọc | `resolveFetch`, trình trợ giúp proxy, trình trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trình trợ giúp retry | `RetryConfig`, `retryAsync`, runner chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép và ánh xạ đầu vào | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Trình trợ giúp cổng lệnh và bề mặt lệnh | `resolveControlCommandGate`, trình trợ giúp ủy quyền người gửi, trình trợ giúp registry lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Bộ render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích cú pháp đầu vào bí mật | Trình trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Trình trợ giúp bảo vệ body Webhook | Trình trợ giúp đọc/giới hạn body yêu cầu |
  | `plugin-sdk/reply-runtime` | Runtime trả lời dùng chung | Điều phối inbound, heartbeat, trình lập kế hoạch trả lời, chia chunk |
  | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối nhà cung cấp và trình trợ giúp nhãn hội thoại |
  | `plugin-sdk/reply-history` | Trình trợ giúp lịch sử trả lời | `createChannelHistoryWindow`; export tương thích trình trợ giúp map đã ngừng dùng như `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trình trợ giúp chunk trả lời | Trình trợ giúp chia chunk văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên | Trình trợ giúp đường dẫn kho + updated-at |
  | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn trạng thái | Trình trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, các trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Bộ dựng tóm tắt trạng thái kênh/tài khoản, mặc định trạng thái thời gian chạy, trình trợ giúp siêu dữ liệu vấn đề |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp bộ phân giải mục tiêu | Trình trợ giúp bộ phân giải mục tiêu dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL dạng chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có giới hạn thời gian | Bộ chạy lệnh có giới hạn thời gian với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Bộ đọc tham số | Bộ đọc tham số công cụ/CLI thông dụng |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất gửi công cụ | Trích xuất các trường mục tiêu gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi log | Trình ghi log hệ thống con và trình trợ giúp che dữ liệu |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI chuyên biệt | Cùng các trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực nhà cung cấp thời gian chạy | Trình trợ giúp phân giải API-key thời gian chạy |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập API-key nhà cung cấp | Trình trợ giúp onboarding/ghi hồ sơ API-key |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth tiêu chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa model-id |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp catalog nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình trợ giúp cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP nhà cung cấp | Trình trợ giúp năng lực HTTP/endpoint nhà cung cấp chung, bao gồm trình trợ giúp biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình web-search nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực web-search phạm vi hẹp cho các nhà cung cấp không cần dây nối bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng web-search nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search phạm vi hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và bộ đặt/lấy thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp web-search nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp wrapper luồng nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và trình trợ giúp wrapper dùng chung cho Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport nhà cung cấp | Trình trợ giúp transport nhà cung cấp gốc như fetch được bảo vệ, trích xuất văn bản kết quả công cụ, biến đổi tin nhắn transport và luồng sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp media dùng chung | Trình trợ giúp fetch/biến đổi/lưu trữ media, thăm dò kích thước video dựa trên ffprobe và bộ dựng payload media |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo media dùng chung | Trình trợ giúp failover dùng chung, chọn ứng viên và thông báo thiếu mô hình cho tạo ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trình trợ giúp ảnh/âm thanh hướng tới nhà cung cấp |
  | `plugin-sdk/text-runtime` | Export tương thích văn bản rộng đã lỗi thời | Dùng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản đầu ra |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng trình trợ giúp chỉ thị, registry, xác thực hướng tới nhà cung cấp và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải, trình trợ giúp phiên cầu nối, hàng đợi agent talk-back dùng chung, điều khiển giọng nói lượt chạy đang hoạt động, sức khỏe transcript/sự kiện, khử vọng, khớp câu hỏi tư vấn, điều phối tư vấn bắt buộc, theo dõi ngữ cảnh lượt, theo dõi hoạt động đầu ra và trình trợ giúp tư vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo ảnh | Kiểu nhà cung cấp tạo ảnh cùng trình trợ giúp URL dữ liệu/tài sản ảnh và bộ dựng nhà cung cấp ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo ảnh dùng chung | Kiểu tạo ảnh, failover, xác thực và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/thu gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Nguyên hàm cấu hình kênh | Nguyên hàm schema cấu hình kênh phạm vi hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Phần mở đầu kênh dùng chung | Export phần mở đầu Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình allowlist | Trình trợ giúp chỉnh sửa/đọc cấu hình allowlist |
  | `plugin-sdk/group-access` | Trình trợ giúp truy cập nhóm | Trình trợ giúp quyết định truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã lỗi thời | Dùng `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp bảo vệ DM trực tiếp | Trình trợ giúp chính sách bảo vệ trước mã hóa phạm vi hẹp |
  | `plugin-sdk/extension-shared` | Trình trợ giúp extension dùng chung | Nguyên hàm trình trợ giúp kênh thụ động/trạng thái và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp mục tiêu Webhook | Registry mục tiêu Webhook và trình trợ giúp cài đặt route |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn webhook đã lỗi thời | Dùng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp media web dùng chung | Trình trợ giúp tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Re-export tương thích Zod đã lỗi thời | Import `zod` từ `zod` trực tiếp |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core đi kèm | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy engine bộ nhớ | Facade thời gian chạy lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding bộ nhớ | Trình trợ giúp registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine nền tảng máy chủ bộ nhớ | Export engine nền tảng máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding máy chủ bộ nhớ | Hợp đồng embedding bộ nhớ, truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa chung; các nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD máy chủ bộ nhớ | Export engine QMD máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine lưu trữ máy chủ bộ nhớ | Export engine lưu trữ máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức máy chủ bộ nhớ | Trình trợ giúp đa phương thức máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn máy chủ bộ nhớ | Trình trợ giúp truy vấn máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật máy chủ bộ nhớ | Trình trợ giúp bí mật máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái máy chủ bộ nhớ | Trình trợ giúp trạng thái máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Thời gian chạy CLI máy chủ bộ nhớ | Trình trợ giúp thời gian chạy CLI máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Thời gian chạy lõi máy chủ bộ nhớ | Trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ | Trình trợ giúp tệp/thời gian chạy máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh thời gian chạy lõi máy chủ bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp thời gian chạy lõi máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện máy chủ bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện máy chủ bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/thời gian chạy bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý | Trình trợ giúp markdown được quản lý dùng chung cho các Plugin lân cận bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade thời gian chạy trình quản lý tìm kiếm active-memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái máy chủ bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích đã lỗi thời cục bộ trong repo; dùng các đường dẫn con kiểm thử cục bộ trong repo có trọng tâm như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý chỉ là tập con di trú chung, không phải toàn bộ bề mặt SDK. Danh mục entrypoint của trình biên dịch nằm trong `scripts/lib/plugin-sdk-entrypoints.json`; các export của gói được tạo từ tập con công khai.

Các seam trợ giúp dành riêng cho Plugin đóng gói kèm đã được loại khỏi export map SDK công khai, ngoại trừ các facade tương thích được ghi rõ trong tài liệu, chẳng hạn shim `plugin-sdk/discord` đã ngừng khuyến nghị nhưng vẫn giữ cho gói `@openclaw/discord@2026.3.13` đã phát hành. Các helper dành riêng cho owner nằm trong gói Plugin sở hữu chúng; hành vi host dùng chung nên đi qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.

Hãy dùng import hẹp nhất phù hợp với tác vụ. Nếu bạn không tìm thấy export, hãy kiểm tra nguồn tại `src/plugin-sdk/` hoặc hỏi maintainer hợp đồng chung nào nên sở hữu nó.

## Các mục ngừng hỗ trợ đang áp dụng

Các mục ngừng hỗ trợ hẹp hơn áp dụng trên SDK Plugin, hợp đồng provider, bề mặt runtime, và manifest. Mỗi mục vẫn hoạt động hôm nay nhưng sẽ bị loại bỏ trong một bản phát hành major trong tương lai. Dòng bên dưới mỗi mục ánh xạ API cũ sang phần thay thế chuẩn của nó.

<AccordionGroup>
  <Accordion title="Trình tạo trợ giúp command-auth → command-status">
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

    Các Plugin kênh downstream (Slack, Discord, Matrix, MS Teams) đã chuyển
    sang dùng cơ chế này.

  </Accordion>

  <Accordion title="Shim runtime kênh và helper hành động kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Đừng import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions`
    bị ngừng khuyến nghị cùng với các export kênh "actions" thô. Thay vào đó,
    hãy phơi bày capability qua bề mặt `presentation` có ngữ nghĩa - các
    Plugin kênh khai báo những gì chúng render (thẻ, nút, select) thay vì
    tên hành động thô nào chúng chấp nhận.

  </Accordion>

  <Accordion title="Helper tool() của provider tìm kiếm web → createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper công cụ.

  </Accordion>

  <Accordion title="Envelope kênh plaintext → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để xây dựng envelope prompt
    plaintext phẳng từ các tin nhắn kênh inbound.

    **Mới**: `BodyForAgent` cùng các khối ngữ cảnh người dùng có cấu trúc.
    Các Plugin kênh gắn metadata định tuyến (thread, chủ đề, reply-to, phản
    ứng) dưới dạng trường có kiểu thay vì nối chúng vào một chuỗi prompt.
    Helper `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope tổng
    hợp hướng tới assistant, nhưng envelope plaintext inbound đang được
    loại bỏ dần.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và mọi
    Plugin kênh tùy chỉnh đã hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
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

    `deactivate` vẫn được nối dây dưới dạng bí danh tương thích đã ngừng
    khuyến nghị cho đến sau 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → liên kết thread trong core">
    **Cũ**: `api.on("subagent_spawning", handler)` trả về
    `threadBindingReady` hoặc `deliveryOrigin`.

    **Mới**: để core chuẩn bị các binding subagent `thread: true` thông qua
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` chỉ còn là các bề
    mặt tương thích đã ngừng khuyến nghị trong khi các Plugin bên ngoài di trú.

  </Accordion>

  <Accordion title="Kiểu discovery của provider → kiểu catalog của provider">
    Bốn bí danh kiểu discovery hiện là wrapper mỏng trên các kiểu thời kỳ
    catalog:

    | Bí danh cũ                | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng thêm bag tĩnh `ProviderCapabilities` kế thừa - các Plugin provider
    nên dùng các hook provider rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas`, và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách Thinking → resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn, và danh sách
    cấp độ đã xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu cũ theo
    thứ hạng profile.

    Ngữ cảnh bao gồm `provider`, `modelId`, `reasoning` đã gộp tùy chọn, và
    các fact `compat` của model đã gộp tùy chọn. Các Plugin provider có thể
    dùng các fact catalog đó để chỉ phơi bày profile theo model khi hợp đồng
    request đã cấu hình hỗ trợ nó.

    Hãy triển khai một hook thay vì ba. Các hook kế thừa vẫn hoạt động trong
    cửa sổ ngừng hỗ trợ nhưng không được compose với kết quả profile.

  </Accordion>

  <Accordion title="Provider xác thực bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai hook xác thực bên ngoài mà không khai báo provider
    trong manifest của Plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest của
    Plugin **và** triển khai `resolveExternalAuthProfiles(...)`.

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
    trên manifest. Điều này hợp nhất metadata env của setup/status vào một
    nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu env-var.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua adapter tương thích cho
    đến khi cửa sổ ngừng hỗ trợ khép lại.

  </Accordion>

  <Accordion title="Đăng ký Plugin bộ nhớ → registerMemoryCapability">
    **Cũ**: ba lệnh gọi riêng biệt -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lệnh gọi trên API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các slot, một lệnh gọi đăng ký duy nhất. Các helper prompt và corpus
    dạng bổ sung (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    không bị ảnh hưởng.

  </Accordion>

  <Accordion title="API provider embedding bộ nhớ">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cộng với
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cộng với
    `contracts.embeddingProviders`.

    Hợp đồng provider embedding chung có thể tái sử dụng ngoài bộ nhớ và là
    đường dẫn được hỗ trợ cho provider mới. API đăng ký dành riêng cho bộ nhớ
    vẫn được nối dây dưới dạng tương thích đã ngừng khuyến nghị trong khi các
    provider hiện có di trú. Báo cáo kiểm tra Plugin ghi nhận việc sử dụng
    ngoài gói đóng kèm là nợ tương thích.

  </Accordion>

  <Accordion title="Kiểu tin nhắn session subagent được đổi tên">
    Hai bí danh kiểu kế thừa vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` đã ngừng khuyến nghị để thay bằng
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp sang
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về accessor task-flow trực tiếp.

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

  <Accordion title="Factory extension nhúng → middleware kết quả công cụ của agent">
    Đã được trình bày trong "Cách di trú → Di trú extension kết quả công cụ
    nhúng sang middleware" ở trên. Đưa vào đây cho đầy đủ: đường dẫn
    `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho embedded-runner
    đã bị loại bỏ được thay bằng `api.registerAgentToolResultMiddleware(...)`
    với danh sách runtime rõ ràng trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Bí danh OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` hiện là
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
Các mục ngừng hỗ trợ cấp extension (bên trong các Plugin kênh/provider đóng
gói kèm dưới `extensions/`) được theo dõi trong các barrel `api.ts` và
`runtime-api.ts` riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin
bên thứ ba và không được liệt kê ở đây. Nếu bạn tiêu thụ trực tiếp barrel cục
bộ của một Plugin đóng gói kèm, hãy đọc các chú thích ngừng hỗ trợ trong
barrel đó trước khi nâng cấp.
</Note>

## Lộ trình loại bỏ

| Khi nào                | Điều gì xảy ra                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Bây giờ**            | Các bề mặt đã ngừng hỗ trợ phát ra cảnh báo thời gian chạy              |
| **Bản phát hành chính tiếp theo** | Các bề mặt đã ngừng hỗ trợ sẽ bị gỡ bỏ; Plugin vẫn dùng chúng sẽ lỗi |

Tất cả Plugin lõi đã được di chuyển. Plugin bên ngoài nên di chuyển
trước bản phát hành chính tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này trong khi bạn thực hiện di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng Plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu đầy đủ về import đường dẫn con
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng Plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng Plugin nhà cung cấp
- [Nội bộ Plugin](/vi/plugins/architecture) - tìm hiểu sâu về kiến trúc
- [Tệp kê khai Plugin](/vi/plugins/manifest) - tham chiếu schema tệp kê khai
