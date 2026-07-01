---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã dùng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một plugin lên kiến trúc plugin hiện đại
    - Bạn duy trì một Plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK plugin hiện đại
title: Di trú Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:07:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang kiến trúc plugin hiện đại với các import tập trung, được ghi tài liệu. Nếu plugin của bạn được xây dựng trước kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Điều gì đang thay đổi

Hệ thống plugin cũ cung cấp hai bề mặt mở rộng cho phép plugin import mọi thứ chúng cần từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất re-export hàng chục helper. Nó được giới thiệu để giữ cho các plugin dựa trên hook cũ tiếp tục hoạt động trong khi kiến trúc plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel helper runtime rộng, trộn lẫn sự kiện hệ thống, trạng thái Heartbeat, hàng đợi phân phối, helper fetch/proxy, helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng, vẫn mang các helper tải/ghi trực tiếp đã lỗi thời trong giai đoạn di chuyển.
- **`openclaw/extension-api`** - một cầu nối cho phép plugin truy cập trực tiếp các helper phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook extension đi kèm chỉ dành cho embedded-runner đã bị xóa, từng có thể quan sát các sự kiện embedded-runner như `tool_result`.

Các bề mặt import rộng hiện đã **bị loại bỏ dần**. Chúng vẫn hoạt động ở runtime, nhưng plugin mới không được dùng chúng, và các plugin hiện có nên di chuyển trước khi bản phát hành major tiếp theo xóa chúng. API đăng ký extension factory chỉ dành cho embedded-runner đã bị xóa; hãy dùng middleware kết quả công cụ thay thế.

OpenClaw không xóa hoặc diễn giải lại hành vi plugin đã được ghi tài liệu trong cùng thay đổi giới thiệu phần thay thế. Các thay đổi phá vỡ hợp đồng trước tiên phải đi qua adapter tương thích, chẩn đoán, tài liệu và một giai đoạn loại bỏ dần. Điều đó áp dụng cho SDK imports, trường manifest, API thiết lập, hook và hành vi đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị xóa trong một bản phát hành major trong tương lai.
  Plugin vẫn import từ các bề mặt này sẽ bị hỏng khi điều đó xảy ra.
  Các đăng ký embedded extension factory cũ hiện đã không còn tải nữa.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** - import một helper sẽ tải hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** - re-export rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách biết export nào ổn định và export nào là nội bộ

SDK plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`) là một mô-đun nhỏ, độc lập, có mục đích rõ ràng và hợp đồng được ghi tài liệu.

Các điểm nối tiện lợi provider cũ cho kênh đi kèm cũng đã biến mất. Các điểm nối helper mang thương hiệu kênh là shortcut riêng của mono-repo, không phải hợp đồng plugin ổn định. Thay vào đó, hãy dùng các subpath SDK chung, hẹp. Bên trong workspace plugin đi kèm, hãy giữ các helper do provider sở hữu trong `api.ts` hoặc `runtime-api.ts` của chính plugin đó.

Ví dụ provider đi kèm hiện tại:

- Anthropic giữ helper stream dành riêng cho Claude trong điểm nối `api.ts` / `contract-api.ts` của riêng mình
- OpenAI giữ provider builder, helper model mặc định và realtime provider builder trong `api.ts` của riêng mình
- OpenRouter giữ provider builder và helper onboarding/cấu hình trong `api.ts` của riêng mình

## Kế hoạch di chuyển Talk và giọng nói thời gian thực

Mã Talk cho giọng nói thời gian thực, điện thoại, cuộc họp và trình duyệt đang chuyển từ việc ghi sổ lượt cục bộ theo bề mặt sang bộ điều khiển phiên Talk dùng chung được export bởi `openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu envelope sự kiện Talk chung, trạng thái lượt đang hoạt động, trạng thái capture, trạng thái âm thanh đầu ra, lịch sử sự kiện gần đây và việc từ chối lượt cũ. Plugin provider nên tiếp tục sở hữu các phiên realtime đặc thù theo nhà cung cấp; plugin bề mặt nên tiếp tục sở hữu các đặc thù capture, playback, điện thoại và cuộc họp.

Việc di chuyển Talk này cố ý là phá vỡ gọn gàng:

1. Giữ các primitive controller/runtime dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt đi kèm sang bộ điều khiển dùng chung: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime và native push-to-talk.
3. Thay thế các họ RPC Talk cũ bằng API cuối cùng `talk.session.*` và
   `talk.client.*`.
4. Quảng bá một kênh sự kiện Talk trực tiếp trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP realtime cũ và mọi đường dẫn ghi đè instruction tại thời điểm request.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi đang triển khai adapter cấp thấp hoặc fixture kiểm thử. Ưu tiên bộ điều khiển dùng chung để sự kiện theo phạm vi lượt không thể được phát ra nếu thiếu turn id, các lệnh gọi `turnEnd` / `turnCancel` cũ không thể xóa lượt đang hoạt động mới hơn, và sự kiện vòng đời âm thanh đầu ra luôn nhất quán trên điện thoại, cuộc họp, browser relay, managed-room handoff và client Talk native.

Dạng API công khai mục tiêu là:

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

Các phiên WebRTC/provider-websocket do trình duyệt sở hữu dùng `talk.client.create`, vì trình duyệt sở hữu việc đàm phán provider và truyền tải media, còn Gateway sở hữu thông tin xác thực, instruction và chính sách công cụ. `talk.session.*` là bề mặt chung do Gateway quản lý cho gateway-relay realtime, gateway-relay transcription và các phiên STT/TTS native managed-room.

Các cấu hình cũ đặt selector realtime cạnh `talk.provider` / `talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider realtime.

Các tổ hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Truyền tải      | Brain           | Chủ sở hữu         | Ghi chú                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh provider song công toàn phần được bắc cầu qua Gateway; lệnh gọi công cụ được định tuyến qua công cụ agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ streaming STT; caller gửi âm thanh đầu vào và nhận sự kiện transcript.                                         |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie, nơi client sở hữu capture/playback còn Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt first-party đáng tin cậy thực thi trực tiếp hành động công cụ Gateway. |

Bản đồ phương thức đã xóa:

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

  | Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                                                                                                               |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Thêm một đoạn âm thanh PCM base64 vào phiên của nhà cung cấp do cùng kết nối Gateway sở hữu.                                                                                           |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu lượt người dùng trong phòng được quản lý.                                                                                                                                       |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt đã cũ.                                                                                                                              |
  | `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                          | Hủy công việc thu nhận/nhà cung cấp/agent/TTS đang hoạt động cho một lượt.                                                                                                             |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                          |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất lệnh gọi công cụ của nhà cung cấp do relay phát ra; truyền `options.willContinue` cho đầu ra tạm thời hoặc `options.suppressResponse` để đáp ứng lệnh gọi mà không có phản hồi trợ lý khác. |
  | `talk.session.steer`            | các phiên Talk được agent hỗ trợ                        | Gửi điều khiển `status`, `steer`, `cancel`, hoặc `followup` dạng lời nói đến lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                              |
  | `talk.session.close`            | tất cả phiên hợp nhất                                   | Dừng các phiên relay hoặc thu hồi trạng thái phòng được quản lý, rồi quên id phiên hợp nhất.                                                                                           |

  Không đưa các trường hợp đặc biệt theo nhà cung cấp hoặc nền tảng vào lõi để làm việc này.
  Lõi sở hữu ngữ nghĩa phiên Talk. Plugin nhà cung cấp sở hữu thiết lập phiên của nhà cung cấp.
  Cuộc gọi thoại và Google Meet sở hữu các bộ điều hợp điện thoại/cuộc họp. Trình duyệt và ứng dụng
  gốc sở hữu UX thu nhận/phát lại thiết bị.

  ## Chính sách tương thích

  Với Plugin bên ngoài, công việc tương thích tuân theo thứ tự này:

  1. thêm hợp đồng mới
  2. giữ hành vi cũ được nối qua một bộ điều hợp tương thích
  3. phát ra chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
  4. bao phủ cả hai đường dẫn trong kiểm thử
  5. ghi tài liệu về việc ngừng dùng và đường dẫn di chuyển
  6. chỉ xóa sau khung thời gian di chuyển đã thông báo, thường là trong một bản phát hành lớn

  Người bảo trì có thể kiểm tra hàng đợi di chuyển hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để có
  số đếm gọn, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi một cổng CI cần thất bại trên các bản ghi
  tương thích đến hạn, các import SDK dành riêng xuyên chủ sở hữu, hoặc các đường
  dẫn con SDK dành riêng không dùng đến. Báo cáo nhóm các bản ghi tương thích đã
  ngừng dùng theo ngày xóa, đếm các tham chiếu mã/tài liệu cục bộ, nêu bật các
  import SDK dành riêng xuyên chủ sở hữu, và tóm tắt cầu nối SDK memory-host riêng
  để việc dọn dẹp tương thích luôn rõ ràng thay vì dựa vào các tìm kiếm tùy tiện.
  Các đường dẫn con SDK dành riêng phải có mức sử dụng của chủ sở hữu được theo dõi;
  các export helper dành riêng không dùng đến nên được xóa khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng
  trường đó cho đến khi tài liệu và chẩn đoán nói khác. Mã mới nên ưu tiên phần
  thay thế đã được ghi tài liệu, nhưng các Plugin hiện có không nên bị hỏng trong
  các bản phát hành nhỏ thông thường.

  ## Cách di chuyển

  <Steps>
  <Step title="Di chuyển các helper tải/ghi cấu hình runtime">
    Plugin được đóng gói nên ngừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được truyền
    vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần snapshot tiến
    trình hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ agent
    tồn tại lâu nên dùng `ctx.getRuntimeConfig()` của ngữ cảnh công cụ bên trong
    `execute` để một công cụ được tạo trước khi ghi cấu hình vẫn thấy cấu hình
    runtime đã làm mới.

    Việc ghi cấu hình phải đi qua các helper giao dịch và chọn một chính sách
    sau khi ghi:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Dùng `afterWrite: { mode: "restart", reason: "..." }` khi bên gọi biết thay
    đổi cần khởi động lại gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi bên gọi sở hữu bước
    theo dõi và cố ý muốn chặn trình lập kế hoạch tải lại. Kết quả mutation bao
    gồm một tóm tắt `followUp` có kiểu cho kiểm thử và ghi log; gateway vẫn chịu
    trách nhiệm áp dụng hoặc lên lịch khởi động lại.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng dùng
    cho Plugin bên ngoài trong khung thời gian di chuyển và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Plugin được đóng gói và mã runtime
    của repo được bảo vệ bằng các rào chắn scanner trong
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: việc dùng Plugin production mới
    thất bại ngay, ghi cấu hình trực tiếp thất bại, các phương thức máy chủ gateway
    phải dùng snapshot runtime của yêu cầu, các helper gửi/hành động/client của
    kênh runtime phải nhận cấu hình từ ranh giới của chúng, và các mô-đun runtime
    tồn tại lâu không được phép có lệnh gọi `loadConfig()` ambient nào.

    Mã Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng đường dẫn con SDK hẹp khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion cấu hình đã tải và tra cứu cấu hình điểm vào Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải đầu vào bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè mô hình/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin được đóng gói và kiểm thử của chúng được scanner bảo vệ khỏi barrel
    rộng để import và mock luôn cục bộ theo hành vi chúng cần. Barrel rộng vẫn tồn
    tại để tương thích bên ngoài, nhưng mã mới không nên phụ thuộc vào nó.

  </Step>

  <Step title="Di chuyển phần mở rộng kết quả công cụ nhúng sang middleware">
    Plugin được đóng gói phải thay các handler kết quả công cụ
    `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho embedded-runner bằng
    middleware trung lập với runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Cập nhật manifest Plugin cùng lúc:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin đã cài đặt cũng có thể đăng ký middleware kết quả công cụ khi chúng
    được bật rõ ràng và khai báo mọi runtime được nhắm đến trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài đặt nhưng
    không khai báo sẽ bị từ chối.

  </Step>

  <Step title="Di chuyển handler gốc phê duyệt sang capability facts">
    Plugin kênh có khả năng phê duyệt hiện phơi bày hành vi phê duyệt gốc thông qua
    `approvalCapability.nativeRuntime` cộng với registry ngữ cảnh runtime dùng chung.

    Thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/phân phối riêng cho phê duyệt khỏi dây nối `plugin.auth` /
      `plugin.approvals` cũ và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị xóa khỏi hợp đồng Plugin kênh công khai;
      chuyển các trường phân phối/gốc/render sang `approvalCapability`
    - `plugin.auth` chỉ còn dành cho luồng đăng nhập/đăng xuất kênh; các hook auth
      phê duyệt ở đó không còn được lõi đọc
    - Đăng ký các đối tượng runtime do kênh sở hữu như client, token, hoặc ứng dụng
      Bolt thông qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo định tuyến lại do Plugin sở hữu từ handler phê duyệt gốc;
      lõi hiện sở hữu thông báo đã được định tuyến nơi khác từ kết quả phân phối thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, cung cấp một
      bề mặt `createPluginRuntime().channel` thật. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục capability phê duyệt hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi fallback wrapper Windows">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper
    `.cmd`/`.bat` Windows không phân giải được hiện sẽ thất bại đóng trừ khi bạn
    truyền rõ ràng `allowShellFallback: true`.

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

    Nếu bên gọi của bạn không cố ý dựa vào shell fallback, đừng đặt
    `allowShellFallback` và hãy xử lý lỗi được ném ra thay vào đó.

  </Step>

  <Step title="Tìm các import đã ngừng dùng">
    Tìm trong Plugin của bạn các import từ một trong hai bề mặt đã ngừng dùng:

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

    Với các helper phía host, hãy dùng runtime Plugin được tiêm thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Cùng một mẫu này áp dụng cho các helper cầu nối cũ khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | các helper kho lưu trữ phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích bên ngoài,
    nhưng mã mới nên import bề mặt helper tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Các helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Các helper đánh thức, sự kiện và khả năng hiển thị Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi phân phối đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Đo từ xa hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ nhớ đệm chống trùng lặp trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Các helper đường dẫn tệp cục bộ/phương tiện an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch có nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Các helper proxy và fetch có bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Các kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Các kiểu yêu cầu/giải quyết phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Payload trả lời phê duyệt và các helper lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Các helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Các helper token bảo mật | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời tác vụ bất đồng bộ có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ trong tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các plugin được đóng gói được scanner bảo vệ khỏi `infra-runtime`, nên mã
    trong repo không thể hồi quy về barrel rộng này.

  </Step>

  <Step title="Migrate channel route helpers">
    Mã route kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ vẫn được giữ làm bí danh tương
    thích trong giai đoạn di chuyển, nhưng plugin mới nên dùng các tên route
    mô tả trực tiếp hành vi:

    | Helper cũ | Helper hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các helper route hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    nhất quán trên phê duyệt native, chặn trả lời, chống trùng lặp đầu vào,
    phân phối cron và định tuyến phiên.

    Không thêm cách dùng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    các helper loaded-route dựa trên parser (`parseExplicitTargetForLoadedChannel`
    hoặc `resolveRouteTargetForLoadedChannel`) hoặc
    `resolveChannelRouteTargetWithParser(...)` từ `plugin-sdk/channel-route`.
    Các hook này đã bị loại bỏ dần và chỉ còn tồn tại cho plugin cũ trong giai
    đoạn di chuyển. Plugin kênh mới nên dùng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa id đích
    và fallback khi thiếu thư mục, `messaging.inferTargetChatType(...)` khi core
    cần loại peer sớm, và `messaging.resolveOutboundSessionRoute(...)`
    cho phiên native của provider và danh tính thread.

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
  | `plugin-sdk/plugin-entry` | Trợ giúp entry Plugin chính tắc | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export bao trùm cũ cho định nghĩa/builder entry kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export schema cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trợ giúp entry một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và builder entry kênh tập trung | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trợ giúp trình hướng dẫn thiết lập dùng chung | Bộ dịch thiết lập, prompt danh sách cho phép, builder trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trợ giúp thời gian chạy lúc thiết lập | `createSetupTranslator`, adapter bản vá thiết lập an toàn khi import, trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Alias adapter thiết lập đã ngừng khuyến nghị | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trợ giúp đa tài khoản | Trợ giúp danh sách tài khoản/cấu hình/cổng hành động |
  | `plugin-sdk/account-id` | Trợ giúp mã định danh tài khoản | `DEFAULT_ACCOUNT_ID`, chuẩn hóa mã định danh tài khoản |
  | `plugin-sdk/account-resolution` | Trợ giúp tra cứu tài khoản | Trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trợ giúp tài khoản phạm vi hẹp | Trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Adapter trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Nối dây tiền tố trả lời, trạng thái đang nhập và phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter cấu hình và trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder schema cấu hình | Chỉ các primitive schema cấu hình kênh dùng chung và builder generic |
  | `plugin-sdk/bundled-channel-config-schema` | Schema cấu hình được đóng gói kèm | Chỉ các Plugin đóng gói kèm do OpenClaw bảo trì; Plugin mới phải định nghĩa schema cục bộ của Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schema cấu hình đóng gói kèm đã ngừng khuyến nghị | Chỉ là alias tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các Plugin đóng gói kèm được bảo trì |
  | `plugin-sdk/telegram-command-config` | Trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facade tương thích đã ngừng khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Trợ giúp phong bì đầu vào | Trợ giúp route dùng chung + builder phong bì |
  | `plugin-sdk/channel-inbound` | Trợ giúp nhận đầu vào | Xây dựng ngữ cảnh, định dạng, root, runner, điều phối trả lời đã chuẩn bị và predicate điều phối |
  | `plugin-sdk/messaging-targets` | Đường dẫn import phân tích target đã ngừng khuyến nghị | Dùng `plugin-sdk/channel-targets` cho trợ giúp phân tích target generic, `plugin-sdk/channel-route` cho so sánh route, và `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do Plugin sở hữu cho phân giải target theo nhà cung cấp |
  | `plugin-sdk/outbound-media` | Trợ giúp media đầu ra | Tải media đầu ra dùng chung |
  | `plugin-sdk/outbound-send-deps` | Facade tương thích đã ngừng khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Trợ giúp vòng đời tin nhắn đầu ra | Adapter tin nhắn, biên nhận, trợ giúp gửi bền vững, trợ giúp xem trước trực tiếp/streaming, tùy chọn trả lời, trợ giúp vòng đời, danh tính đầu ra và lập kế hoạch payload |
  | `plugin-sdk/channel-streaming` | Facade tương thích đã ngừng khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facade tương thích đã ngừng khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Trợ giúp liên kết luồng | Vòng đời liên kết luồng và trợ giúp adapter |
  | `plugin-sdk/agent-media-payload` | Trợ giúp payload media cũ | Builder payload media của agent cho bố cục trường cũ |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng khuyến nghị | Chỉ tiện ích thời gian chạy kênh cũ |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trợ giúp thời gian chạy phạm vi rộng | Trợ giúp thời gian chạy/ghi log/sao lưu/cài đặt Plugin |
  | `plugin-sdk/runtime-env` | Trợ giúp env thời gian chạy phạm vi hẹp | Logger/env thời gian chạy, timeout, retry và backoff |
  | `plugin-sdk/plugin-runtime` | Trợ giúp thời gian chạy Plugin dùng chung | Trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Trợ giúp pipeline hook | Trợ giúp pipeline Webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trợ giúp thời gian chạy lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trợ giúp tiến trình | Trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trợ giúp thời gian chạy CLI | Định dạng lệnh, chờ, trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Trợ giúp Gateway | Máy khách Gateway, trợ giúp khởi động sẵn sàng vòng lặp sự kiện, phân giải host LAN được quảng bá và trợ giúp bản vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng khuyến nghị | Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trợ giúp lệnh Telegram | Trợ giúp xác thực lệnh Telegram ổn định theo dự phòng khi bề mặt hợp đồng Telegram đóng gói kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Trợ giúp prompt phê duyệt | Payload phê duyệt exec/Plugin, trợ giúp capability/profile phê duyệt, trợ giúp định tuyến/thời gian chạy phê duyệt native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trợ giúp auth phê duyệt | Phân giải người phê duyệt, auth hành động cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Trợ giúp máy khách phê duyệt | Trợ giúp profile/filter phê duyệt exec native |
  | `plugin-sdk/approval-delivery-runtime` | Trợ giúp phân phối phê duyệt | Adapter capability/phân phối phê duyệt native |
  | `plugin-sdk/approval-gateway-runtime` | Trợ giúp Gateway phê duyệt | Trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trợ giúp adapter phê duyệt | Trợ giúp tải adapter phê duyệt native nhẹ cho entrypoint kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Trợ giúp handler phê duyệt | Trợ giúp thời gian chạy handler phê duyệt rộng hơn; ưu tiên các seam adapter/Gateway hẹp hơn khi chúng đủ dùng |
  | `plugin-sdk/approval-native-runtime` | Trợ giúp target phê duyệt | Trợ giúp liên kết target/tài khoản phê duyệt native |
  | `plugin-sdk/approval-reply-runtime` | Trợ giúp trả lời phê duyệt | Trợ giúp payload trả lời phê duyệt exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Trợ giúp ngữ cảnh thời gian chạy kênh | Trợ giúp đăng ký/lấy/theo dõi ngữ cảnh thời gian chạy kênh generic |
  | `plugin-sdk/security-runtime` | Trợ giúp bảo mật | Trợ giúp dùng chung về tin cậy, cổng DM, file/đường dẫn giới hạn trong root, nội dung bên ngoài và thu thập bí mật |
  | `plugin-sdk/ssrf-policy` | Trợ giúp chính sách SSRF | Trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trợ giúp thời gian chạy SSRF | Dispatcher ghim cố định, fetch có bảo vệ, trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trợ giúp Heartbeat | Trợ giúp đánh thức, sự kiện và khả năng hiển thị Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trợ giúp chống trùng lặp | Cache chống trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Trợ giúp truy cập file | Trợ giúp đường dẫn file/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trợ giúp trạng thái sẵn sàng của transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Trợ giúp chính sách phê duyệt exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Trợ giúp cache có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trợ giúp cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trợ giúp fetch/proxy được bọc | `resolveFetch`, trợ giúp proxy, trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trợ giúp retry | `RetryConfig`, `retryAsync`, runner chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép và ánh xạ đầu vào | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Cổng lệnh và trợ giúp bề mặt lệnh | `resolveControlCommandGate`, trợ giúp ủy quyền người gửi, trợ giúp registry lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Bộ render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Trợ giúp yêu cầu Webhook | Tiện ích target Webhook |
  | `plugin-sdk/webhook-request-guards` | Trợ giúp guard thân Webhook | Trợ giúp đọc/giới hạn thân yêu cầu |
  | `plugin-sdk/reply-runtime` | Thời gian chạy trả lời dùng chung | Điều phối đầu vào, Heartbeat, planner trả lời, chia khúc |
  | `plugin-sdk/reply-dispatch-runtime` | Trợ giúp điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối nhà cung cấp và trợ giúp nhãn cuộc hội thoại |
  | `plugin-sdk/reply-history` | Trợ giúp lịch sử trả lời | `createChannelHistoryWindow`; export tương thích map-helper đã ngừng khuyến nghị như `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trợ giúp chia khúc trả lời | Trợ giúp chia khúc text/markdown |
  | `plugin-sdk/session-store-runtime` | Trợ giúp kho phiên | Trợ giúp đường dẫn kho + thời điểm cập nhật |
  | `plugin-sdk/state-paths` | Trợ giúp đường dẫn trạng thái | Trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Bộ tạo tóm tắt trạng thái kênh/tài khoản, giá trị mặc định trạng thái thời gian chạy, trình trợ giúp siêu dữ liệu sự cố |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp bộ phân giải đích | Trình trợ giúp bộ phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL dạng chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có giới hạn thời gian | Bộ chạy lệnh có giới hạn thời gian với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Bộ đọc tham số | Bộ đọc tham số công cụ/CLI dùng chung |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất thao tác gửi của công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi log | Trình ghi log hệ con và trình trợ giúp biên tập dữ liệu nhạy cảm |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu phản hồi tin nhắn | Kiểu payload phản hồi |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình trợ giúp phát hiện/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI tập trung | Cùng trình trợ giúp phát hiện/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực thời gian chạy nhà cung cấp | Trình trợ giúp phân giải khóa API thời gian chạy |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập khóa API nhà cung cấp | Trình trợ giúp hướng dẫn nhập môn/ghi hồ sơ khóa API |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ tạo kết quả xác thực OAuth tiêu chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ tạo chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp, và trình trợ giúp chuẩn hóa mã định danh mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp danh mục nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá hướng dẫn nhập môn nhà cung cấp | Trình trợ giúp cấu hình hướng dẫn nhập môn |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP nhà cung cấp | Trình trợ giúp năng lực HTTP/endpoint nhà cung cấp chung, bao gồm trình trợ giúp biểu mẫu multipart phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình web-search nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực web-search hẹp cho nhà cung cấp không cần nối dây bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng web-search nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, và bộ đặt/lấy thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp web-search nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/thời gian chạy nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, và dọn dẹp schema DeepSeek/Gemini/OpenAI + chẩn đoán |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp bộ bao luồng nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu bộ bao luồng, và trình trợ giúp bộ bao Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport nhà cung cấp | Trình trợ giúp transport nhà cung cấp gốc như fetch có bảo vệ, trích xuất văn bản kết quả công cụ, biến đổi tin nhắn transport, và luồng sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp media dùng chung | Trình trợ giúp fetch/biến đổi/lưu trữ media, dò kích thước video dựa trên ffprobe, và bộ tạo payload media |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo media dùng chung | Trình trợ giúp chuyển dự phòng dùng chung, chọn ứng viên, và thông báo thiếu mô hình cho tạo ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trình trợ giúp ảnh/âm thanh hướng tới nhà cung cấp |
  | `plugin-sdk/text-runtime` | Export tương thích văn bản rộng đã ngừng dùng | Dùng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản gửi đi |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng chỉ thị, registry, trình trợ giúp xác thực hướng tới nhà cung cấp, và bộ tạo TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry, và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải, trình trợ giúp phiên cầu nối, hàng đợi phản hồi bằng giọng nói của agent dùng chung, điều khiển giọng nói lượt chạy đang hoạt động, sức khỏe bản ghi/sự kiện, khử vọng, khớp câu hỏi tham vấn, điều phối tham vấn bắt buộc, theo dõi ngữ cảnh lượt, theo dõi hoạt động đầu ra, và trình trợ giúp tham vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo ảnh | Kiểu nhà cung cấp tạo ảnh cùng trình trợ giúp asset ảnh/URL dữ liệu và bộ tạo nhà cung cấp ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo ảnh dùng chung | Kiểu tạo ảnh, chuyển dự phòng, xác thực, và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp chuyển dự phòng, tra cứu nhà cung cấp, và phân tích cú pháp tham chiếu mô hình |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp phản hồi tương tác | Chuẩn hóa/thu gọn payload phản hồi tương tác |
  | `plugin-sdk/channel-config-primitives` | Primitive cấu hình kênh | Primitive schema cấu hình kênh hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Phần mở đầu kênh dùng chung | Export phần mở đầu Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp snapshot/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình allowlist | Trình trợ giúp sửa/đọc cấu hình allowlist |
  | `plugin-sdk/group-access` | Trình trợ giúp truy cập nhóm | Trình trợ giúp quyết định truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích đã ngừng dùng | Dùng `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp bảo vệ Direct-DM | Trình trợ giúp chính sách bảo vệ hẹp trước mã hóa |
  | `plugin-sdk/extension-shared` | Trình trợ giúp extension dùng chung | Primitive trợ giúp kênh thụ động/trạng thái và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Registry đích Webhook và trình trợ giúp cài đặt tuyến |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn Webhook đã ngừng dùng | Dùng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp web media dùng chung | Trình trợ giúp tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Re-export tương thích Zod đã ngừng dùng | Nhập `zod` từ `zod` trực tiếp |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core đóng gói | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade thời gian chạy công cụ bộ nhớ | Facade thời gian chạy lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding bộ nhớ | Trình trợ giúp registry nhà cung cấp embedding bộ nhớ gọn nhẹ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Công cụ nền tảng host bộ nhớ | Export công cụ nền tảng host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Công cụ embedding host bộ nhớ | Hợp đồng embedding bộ nhớ, truy cập registry, nhà cung cấp cục bộ, và trình trợ giúp batch/từ xa chung; nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Công cụ QMD host bộ nhớ | Export công cụ QMD host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Công cụ lưu trữ host bộ nhớ | Export công cụ lưu trữ host bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức host bộ nhớ | Trình trợ giúp đa phương thức host bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn host bộ nhớ | Trình trợ giúp truy vấn host bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật host bộ nhớ | Trình trợ giúp bí mật host bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ đã ngừng dùng | Dùng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái host bộ nhớ | Trình trợ giúp trạng thái host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Thời gian chạy CLI host bộ nhớ | Trình trợ giúp thời gian chạy CLI host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Thời gian chạy lõi host bộ nhớ | Trình trợ giúp thời gian chạy lõi host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/thời gian chạy host bộ nhớ | Trình trợ giúp tệp/thời gian chạy host bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh thời gian chạy lõi host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp thời gian chạy lõi host bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/thời gian chạy bộ nhớ đã ngừng dùng | Dùng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý | Trình trợ giúp markdown được quản lý dùng chung cho Plugin lân cận bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade thời gian chạy trình quản lý tìm kiếm Active Memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái host bộ nhớ đã ngừng dùng | Dùng `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích đã ngừng dùng cục bộ repo; dùng các đường dẫn con kiểm thử cục bộ repo tập trung như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý là tập hợp con di chuyển chung, không phải toàn bộ bề mặt
SDK. Danh mục entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; các package export được tạo từ
tập hợp con công khai.

Các seam trợ giúp dành riêng cho Plugin đóng gói đã được loại khỏi SDK công khai
export map, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng như shim
`plugin-sdk/discord` đã ngừng khuyến nghị nhưng được giữ lại cho package đã phát hành
`@openclaw/discord@2026.3.13`. Các helper riêng theo chủ sở hữu nằm bên trong
package Plugin sở hữu; hành vi host dùng chung nên đi qua các hợp đồng SDK chung
như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
và `plugin-sdk/plugin-config-runtime`.

Hãy dùng import hẹp nhất phù hợp với công việc. Nếu bạn không tìm thấy export,
hãy kiểm tra source tại `src/plugin-sdk/` hoặc hỏi maintainer xem hợp đồng chung nào
nên sở hữu nó.

## Các mục ngừng khuyến nghị đang hoạt động

Các mục ngừng khuyến nghị hẹp hơn áp dụng trên plugin SDK, hợp đồng provider,
bề mặt runtime và manifest. Mỗi mục vẫn hoạt động hôm nay nhưng sẽ bị loại bỏ
trong một bản phát hành major trong tương lai. Mục bên dưới từng phần ánh xạ API cũ
sang thay thế chuẩn của nó.

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

    Các Plugin kênh downstream (Slack, Discord, Matrix, MS Teams) đã
    chuyển đổi.

  </Accordion>

  <Accordion title="Shim runtime kênh và helper hành động kênh">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Đừng import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng khuyến nghị cùng với các export kênh "actions" thô. Hãy phơi bày
    capability thông qua bề mặt `presentation` có ngữ nghĩa thay vào đó - Plugin kênh
    khai báo những gì chúng render (thẻ, nút, select) thay vì những tên hành động thô
    mà chúng chấp nhận.

  </Accordion>

  <Accordion title="Helper tool() của provider tìm kiếm web → createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper công cụ.

  </Accordion>

  <Accordion title="Envelope kênh plaintext → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để dựng envelope prompt plaintext phẳng
    từ các tin nhắn kênh inbound.

    **Mới**: `BodyForAgent` cộng với các khối ngữ cảnh người dùng có cấu trúc. Plugin
    kênh đính kèm metadata định tuyến (thread, topic, reply-to, reactions) dưới dạng
    trường có kiểu thay vì nối chúng vào một chuỗi prompt. Helper
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope hướng tới assistant
    được tổng hợp, nhưng envelope inbound plaintext đang dần bị loại bỏ.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và mọi
    Plugin kênh tùy chỉnh đã hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Cũ**: `api.on("deactivate", handler)`.

    **Mới**: `api.on("gateway_stop", handler)`. Sự kiện và ngữ cảnh là cùng
    hợp đồng dọn dẹp khi tắt; chỉ tên hook thay đổi.

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

    `deactivate` vẫn được nối dây như một alias tương thích đã ngừng khuyến nghị cho đến sau
    2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → ràng buộc thread trong core">
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` chỉ còn là
    các bề mặt tương thích đã ngừng khuyến nghị trong khi Plugin bên ngoài di chuyển.

  </Accordion>

  <Accordion title="Kiểu discovery của provider → kiểu catalog provider">
    Bốn alias kiểu discovery hiện là wrapper mỏng trên các kiểu
    thời catalog:

    | Alias cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng với túi tĩnh `ProviderCapabilities` cũ - Plugin provider
    nên dùng các hook provider rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas`, và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách thinking → resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn, và
    danh sách cấp độ được xếp hạng. OpenClaw tự động hạ cấp các giá trị lưu trữ cũ
    theo thứ hạng profile.

    Ngữ cảnh bao gồm `provider`, `modelId`, `reasoning` đã hợp nhất tùy chọn,
    và các dữ kiện `compat` của model đã hợp nhất tùy chọn. Plugin provider có thể dùng
    các dữ kiện catalog đó để phơi bày profile riêng theo model chỉ khi hợp đồng
    request đã cấu hình hỗ trợ nó.

    Triển khai một hook thay vì ba. Các hook cũ vẫn hoạt động trong
    cửa sổ ngừng khuyến nghị nhưng không được hợp thành với kết quả profile.

  </Accordion>

  <Accordion title="Provider xác thực bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai hook xác thực bên ngoài mà không khai báo provider
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

  <Accordion title="Tra cứu env-var của provider → setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng tra cứu env-var vào `setup.providers[].envVars`
    trên manifest. Điều này hợp nhất metadata env của setup/status vào một
    nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu env-var.

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

    Cùng các slot, một lệnh gọi đăng ký duy nhất. Các helper prompt và corpus dạng bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) không
    bị ảnh hưởng.

  </Accordion>

  <Accordion title="API provider embedding bộ nhớ">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cộng với
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cộng với
    `contracts.embeddingProviders`.

    Hợp đồng provider embedding chung có thể tái sử dụng ngoài bộ nhớ và là
    đường dẫn được hỗ trợ cho provider mới. API đăng ký riêng cho bộ nhớ
    vẫn được nối dây như tương thích đã ngừng khuyến nghị trong khi provider hiện có di chuyển.
    Báo cáo kiểm tra Plugin ghi nhận việc sử dụng không đóng gói là nợ tương thích.

  </Accordion>

  <Accordion title="Đổi tên kiểu tin nhắn session subagent">
    Hai alias kiểu cũ vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng khuyến nghị, thay bằng
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp sang
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime đột biến TaskFlow được quản lý
    cho các Plugin tạo, cập nhật, hủy, hoặc chạy task con từ một
    flow. Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension nhúng → middleware kết quả công cụ của agent">
    Được trình bày trong "Cách di chuyển → Di chuyển extension kết quả công cụ nhúng sang
    middleware" ở trên. Được đưa vào đây cho đầy đủ: đường dẫn chỉ dành cho embedded-runner đã bị loại bỏ
    `api.registerEmbeddedExtensionFactory(...)` được thay bằng
    `api.registerAgentToolResultMiddleware(...)` với một danh sách runtime rõ ràng
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
Các mục ngừng khuyến nghị ở cấp extension (bên trong Plugin kênh/provider đóng gói dưới
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin bên thứ ba và không được liệt kê
ở đây. Nếu bạn dùng trực tiếp barrel cục bộ của một Plugin đóng gói, hãy đọc
các chú thích ngừng khuyến nghị trong barrel đó trước khi nâng cấp.
</Note>

## Dòng thời gian loại bỏ

| Khi                    | Điều gì xảy ra                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Bây giờ**            | Các bề mặt đã ngừng khuyến nghị phát cảnh báo lúc chạy                  |
| **Bản phát hành chính tiếp theo** | Các bề mặt đã ngừng khuyến nghị sẽ bị gỡ bỏ; các plugin vẫn dùng chúng sẽ lỗi |

Tất cả Plugin lõi đã được di chuyển. Các Plugin bên ngoài nên di chuyển
trước bản phát hành chính tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này trong khi bạn thực hiện việc di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu nhập subpath đầy đủ
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng plugin nhà cung cấp
- [Nội bộ Plugin](/vi/plugins/architecture) - phân tích sâu về kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) - tham chiếu schema manifest
