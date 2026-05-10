---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã dùng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một Plugin lên kiến trúc Plugin hiện đại
    - Bạn bảo trì một Plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược cũ sang SDK Plugin hiện đại
title: Di chuyển Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang một kiến trúc Plugin
hiện đại với các import tập trung, có tài liệu rõ ràng. Nếu Plugin của bạn được xây dựng trước
kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Điều gì đang thay đổi

Hệ thống Plugin cũ cung cấp hai bề mặt mở rộng cho phép Plugin import
mọi thứ cần thiết từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất tái xuất hàng chục
  trình trợ giúp. Nó được giới thiệu để giữ cho các Plugin cũ dựa trên hook tiếp tục hoạt động trong khi
  kiến trúc Plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel trình trợ giúp runtime rộng
  trộn lẫn sự kiện hệ thống, trạng thái Heartbeat, hàng đợi phân phối, trình trợ giúp fetch/proxy,
  trình trợ giúp tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng
  vẫn mang các trình trợ giúp load/write trực tiếp đã bị loại bỏ trong giai đoạn
  di chuyển.
- **`openclaw/extension-api`** - một cầu nối cho phép Plugin truy cập trực tiếp vào
  các trình trợ giúp phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook extension đóng gói
  chỉ dành cho Pi đã bị gỡ bỏ, từng có thể quan sát các sự kiện embedded-runner như
  `tool_result`.

Các bề mặt import rộng hiện đã **bị loại bỏ**. Chúng vẫn hoạt động ở runtime,
nhưng Plugin mới không được dùng chúng, và các Plugin hiện có nên di chuyển trước khi
bản phát hành lớn tiếp theo gỡ bỏ chúng. API đăng ký embedded extension factory chỉ dành cho Pi
đã bị gỡ bỏ; hãy dùng middleware kết quả công cụ thay thế.

OpenClaw không gỡ bỏ hoặc diễn giải lại hành vi Plugin đã được tài liệu hóa trong cùng
thay đổi giới thiệu phần thay thế. Các thay đổi phá vỡ hợp đồng trước hết phải đi
qua adapter tương thích, chẩn đoán, tài liệu và giai đoạn loại bỏ.
Điều đó áp dụng cho import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị gỡ bỏ trong một bản phát hành lớn trong tương lai.
  Các Plugin vẫn import từ những bề mặt này sẽ bị hỏng khi điều đó xảy ra.
  Các đăng ký embedded extension factory chỉ dành cho Pi hiện đã không còn được load.
</Warning>

## Vì sao thay đổi này được thực hiện

Cách tiếp cận cũ gây ra các vấn đề:

- **Khởi động chậm** - import một trình trợ giúp đã load hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** - các tái xuất rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách nào biết export nào ổn định và export nào là nội bộ

SDK Plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`)
là một mô-đun nhỏ, tự chứa, có mục đích rõ ràng và hợp đồng được tài liệu hóa.

Các seam tiện ích provider cũ cho các kênh đóng gói sẵn cũng đã bị gỡ bỏ.
Các seam trình trợ giúp mang thương hiệu kênh là lối tắt riêng trong mono-repo, không phải
hợp đồng Plugin ổn định. Hãy dùng các subpath SDK chung hẹp thay thế. Bên trong workspace
Plugin đóng gói sẵn, giữ các trình trợ giúp do provider sở hữu trong `api.ts` hoặc
`runtime-api.ts` của chính Plugin đó.

Ví dụ provider đóng gói sẵn hiện tại:

- Anthropic giữ các trình trợ giúp stream dành riêng cho Claude trong seam `api.ts` /
  `contract-api.ts` của chính nó
- OpenAI giữ các provider builder, trình trợ giúp mô hình mặc định và realtime provider
  builder trong `api.ts` của chính nó
- OpenRouter giữ provider builder và trình trợ giúp onboarding/cấu hình trong chính
  `api.ts` của nó

## Kế hoạch di chuyển Talk và giọng nói realtime

Mã Talk cho giọng nói realtime, điện thoại, cuộc họp và trình duyệt đang chuyển từ
ghi sổ lượt cục bộ theo bề mặt sang bộ điều khiển phiên Talk dùng chung được export bởi
`openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu phong bì sự kiện Talk
chung, trạng thái lượt đang hoạt động, trạng thái capture, trạng thái âm thanh đầu ra, lịch sử
sự kiện gần đây và từ chối lượt cũ. Plugin provider nên tiếp tục sở hữu
phiên realtime đặc thù của vendor; Plugin bề mặt nên tiếp tục sở hữu capture,
phát lại, điện thoại và các đặc thù cuộc họp.

Đợt di chuyển Talk này có chủ ý làm sạch bằng thay đổi phá vỡ:

1. Giữ các primitive runtime/bộ điều khiển dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt đóng gói sẵn sang bộ điều khiển dùng chung: relay trình duyệt,
   handoff phòng được quản lý, realtime cuộc gọi thoại, STT streaming cuộc gọi thoại, Google
   Meet realtime và native push-to-talk.
3. Thay thế các họ RPC Talk cũ bằng API cuối cùng `talk.session.*` và
   `talk.client.*`.
4. Quảng bá một kênh sự kiện Talk trực tiếp trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP realtime cũ và mọi đường dẫn ghi đè hướng dẫn theo thời điểm yêu cầu.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi nó đang
triển khai adapter cấp thấp hoặc fixture kiểm thử. Ưu tiên bộ điều khiển dùng chung
để các sự kiện theo phạm vi lượt không thể được phát ra khi không có id lượt, các lệnh gọi
`turnEnd` / `turnCancel` cũ không thể xóa một lượt đang hoạt động mới hơn, và các sự kiện
vòng đời âm thanh đầu ra luôn nhất quán trên điện thoại, cuộc họp, relay trình duyệt, handoff
phòng được quản lý và client Talk native.

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
```

Các phiên WebRTC/provider-websocket do trình duyệt sở hữu dùng `talk.client.create`,
vì trình duyệt sở hữu việc thương lượng provider và truyền tải media trong khi
Gateway sở hữu thông tin xác thực, hướng dẫn và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho các phiên realtime gateway-relay, phiên
phiên âm gateway-relay và phiên STT/TTS native của phòng được quản lý.

Các cấu hình cũ đặt bộ chọn realtime cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime
không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider realtime.

Các tổ hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Truyền tải      | Brain           | Chủ sở hữu         | Ghi chú                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Âm thanh provider song công được nối qua Gateway; các lệnh gọi công cụ được định tuyến qua công cụ agent-consult.  |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Chỉ streaming STT; bên gọi gửi âm thanh đầu vào và nhận sự kiện bản ghi.                                           |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie nơi client sở hữu capture/phát lại và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt bên thứ nhất đáng tin cậy thực thi trực tiếp hành động công cụ Gateway. |

Bản đồ phương thức đã gỡ bỏ:

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

| Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Thêm một đoạn âm thanh PCM base64 vào phiên provider do cùng kết nối Gateway sở hữu.                                                                                                      |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng trong phòng được quản lý.                                                                                                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt cũ.                                                                                                                                    |
| `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                          | Hủy công việc capture/provider/agent/TTS đang hoạt động cho một lượt.                                                                                                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                             |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lệnh gọi công cụ provider do relay phát ra; truyền `options.willContinue` cho đầu ra tạm thời hoặc `options.suppressResponse` để đáp ứng lệnh gọi mà không có phản hồi trợ lý khác. |
| `talk.session.close`            | tất cả phiên hợp nhất                                   | Dừng phiên relay hoặc thu hồi trạng thái phòng được quản lý, sau đó quên id phiên hợp nhất.                                                                                              |

  Không đưa các trường hợp đặc biệt theo nhà cung cấp hoặc nền tảng vào core để làm việc này.
  Core sở hữu ngữ nghĩa phiên Talk. Các plugin nhà cung cấp sở hữu việc thiết lập phiên của vendor.
  Voice-call và Google Meet sở hữu các adapter điện thoại/cuộc họp. Trình duyệt và ứng dụng native
  sở hữu UX thu/phát thiết bị.

  ## Chính sách tương thích

  Đối với các plugin bên ngoài, công việc tương thích tuân theo thứ tự này:

  1. thêm contract mới
  2. giữ hành vi cũ được nối qua một adapter tương thích
  3. phát ra diagnostic hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
  4. bao phủ cả hai đường dẫn trong kiểm thử
  5. ghi tài liệu về việc ngừng hỗ trợ và đường dẫn di trú
  6. chỉ gỡ bỏ sau cửa sổ di trú đã công bố, thường trong một bản phát hành major

  Maintainer có thể kiểm tra hàng đợi di trú hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để có
  số đếm gọn, `--owner <id>` cho một plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi một cổng CI cần thất bại trên các bản ghi
  tương thích đã đến hạn, import SDK dự trữ xuyên chủ sở hữu, hoặc các subpath SDK
  dự trữ không dùng. Báo cáo nhóm các bản ghi
  tương thích đã ngừng hỗ trợ theo ngày gỡ bỏ, đếm tham chiếu mã/tài liệu cục bộ,
  hiển thị các import SDK dự trữ xuyên chủ sở hữu, và tóm tắt cầu nối SDK
  memory-host riêng tư để việc dọn dẹp tương thích luôn tường minh thay vì
  dựa vào các tìm kiếm ad hoc. Các subpath SDK dự trữ phải có mức sử dụng của chủ sở hữu được theo dõi;
  các export helper dự trữ không dùng nên được gỡ khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả plugin có thể tiếp tục dùng nó cho đến khi
  tài liệu và diagnostic nói khác. Mã mới nên ưu tiên phần thay thế đã được ghi tài liệu,
  nhưng các plugin hiện có không nên bị hỏng trong các bản phát hành minor thông thường.

  ## Cách di trú

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Các plugin bundled nên ngừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên config đã
    được truyền vào đường dẫn gọi đang hoạt động. Các handler tồn tại lâu cần
    snapshot tiến trình hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ
    agent tồn tại lâu nên dùng `ctx.getRuntimeConfig()` của tool context bên trong
    `execute` để một công cụ được tạo trước một lần ghi config vẫn thấy
    runtime config đã được làm mới.

    Việc ghi config phải đi qua các helper giao dịch và chọn một
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
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi caller sở hữu
    bước tiếp theo và cố ý muốn chặn reload planner.
    Kết quả mutation bao gồm một tóm tắt `followUp` có kiểu cho kiểm thử và logging;
    gateway vẫn chịu trách nhiệm áp dụng hoặc lên lịch restart.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng hỗ trợ
    cho plugin bên ngoài trong cửa sổ di trú và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Plugin bundled và mã runtime của repo
    được bảo vệ bằng các guardrail scanner trong
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: việc dùng plugin production mới
    thất bại ngay, ghi config trực tiếp thất bại, các phương thức gateway server phải dùng
    request runtime snapshot, các helper gửi/hành động/client của runtime channel
    phải nhận config từ boundary của chúng, và các module runtime tồn tại lâu có
    đúng không cuộc gọi `loadConfig()` ambient nào được phép.

    Mã plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng subpath SDK hẹp
    khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu config như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion config đã tải và tra cứu config plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi config | `openclaw/plugin-sdk/config-mutation` |
    | Helper session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Config bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải input secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundled và các kiểm thử của chúng được scanner bảo vệ khỏi barrel rộng
    để các import và mock ở cục bộ với hành vi chúng cần. Barrel rộng
    vẫn tồn tại để tương thích bên ngoài, nhưng mã mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Các plugin bundled phải thay thế handler tool-result
    `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho Pi bằng
    middleware trung lập với runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Cập nhật manifest plugin cùng lúc:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin bên ngoài không thể đăng ký tool-result middleware vì nó có thể
    viết lại output công cụ có độ tin cậy cao trước khi model thấy nó.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Các plugin channel có khả năng approval giờ đây phơi bày hành vi approval native thông qua
    `approvalCapability.nativeRuntime` cộng với registry runtime-context dùng chung.

    Thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery dành riêng cho approval khỏi wiring `plugin.auth` /
      `plugin.approvals` legacy và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị gỡ khỏi contract channel-plugin công khai;
      chuyển các trường delivery/native/render sang `approvalCapability`
    - `plugin.auth` chỉ còn cho luồng đăng nhập/đăng xuất channel; các hook auth approval
      ở đó không còn được core đọc
    - Đăng ký các đối tượng runtime do channel sở hữu như client, token, hoặc app Bolt
      thông qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo reroute do plugin sở hữu từ các handler approval native;
      core giờ sở hữu thông báo routed-elsewhere từ kết quả delivery thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, hãy cung cấp một
      surface `createPluginRuntime().channel` thật. Stub một phần bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết layout approval capability hiện tại.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Nếu plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` chưa phân giải giờ đây fail-closed trừ khi bạn truyền rõ
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
    `allowShellFallback` và thay vào đó xử lý lỗi được ném ra.

  </Step>

  <Step title="Find deprecated imports">
    Tìm trong plugin của bạn các import từ một trong hai surface đã ngừng hỗ trợ:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
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

    Đối với helper phía host, dùng plugin runtime được inject thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Mẫu tương tự áp dụng cho các helper bridge legacy khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích
    bên ngoài, nhưng mã mới nên import surface helper tập trung mà nó
    thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Helper hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper đánh thức Heartbeat, sự kiện, và khả năng hiển thị | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi delivery đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetry hoạt động channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper đường dẫn tệp/media cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy và fetch được bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Kiểu yêu cầu/phân giải approval | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload reply approval và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token an toàn | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời tác vụ async có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa async cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các plugin bundled được scanner bảo vệ khỏi `infra-runtime`, nên mã repo
    không thể thoái lui về barrel rộng.

  </Step>

  <Step title="Migrate channel route helpers">
    Mã route channel mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ hơn vẫn là alias tương thích
    trong cửa sổ di trú, nhưng plugin mới nên dùng các tên route
    mô tả trực tiếp hành vi:

    | Hàm trợ giúp cũ | Hàm trợ giúp hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các hàm trợ giúp định tuyến hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    nhất quán trên các phê duyệt gốc, chặn phản hồi, khử trùng lặp đầu vào,
    gửi Cron và định tuyến phiên. Nếu plugin của bạn sở hữu ngữ pháp đích tùy chỉnh,
    hãy dùng `resolveChannelRouteTargetWithParser(...)` để điều chỉnh parser đó
    vào cùng hợp đồng đích định tuyến.

  </Step>

  <Step title="Xây dựng và kiểm thử">
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
  | `plugin-sdk/plugin-entry` | Trình trợ giúp điểm vào Plugin chuẩn tắc | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export bao quát cũ cho các định nghĩa/trình dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export lược đồ cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình trợ giúp điểm vào một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Các định nghĩa và trình dựng điểm vào kênh chuyên biệt | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung | Lời nhắc danh sách cho phép, trình dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trình trợ giúp runtime trong lúc thiết lập | Bộ chuyển đổi bản vá thiết lập an toàn khi import, trình trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Bí danh bộ chuyển đổi thiết lập đã ngừng dùng | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Trình trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trình trợ giúp nhiều tài khoản | Trình trợ giúp danh sách tài khoản/cấu hình/cổng hành động |
  | `plugin-sdk/account-id` | Trình trợ giúp ID tài khoản | `DEFAULT_ACCOUNT_ID`, chuẩn hóa ID tài khoản |
  | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trình trợ giúp tài khoản phạm vi hẹp | Trình trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ chuyển đổi trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Thành phần cơ bản ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Tiền tố trả lời, trạng thái đang nhập và nối dây phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory bộ chuyển đổi cấu hình và trình trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Trình dựng lược đồ cấu hình | Chỉ các thành phần cơ bản của lược đồ cấu hình kênh dùng chung và trình dựng chung |
  | `plugin-sdk/bundled-channel-config-schema` | Lược đồ cấu hình đi kèm | Chỉ các Plugin đi kèm do OpenClaw duy trì; Plugin mới phải định nghĩa lược đồ cục bộ của Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Lược đồ cấu hình đi kèm đã ngừng dùng | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các Plugin đi kèm được duy trì |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Trình trợ giúp trạng thái tài khoản và vòng đời luồng bản nháp | `createAccountStatusSink`, trình trợ giúp hoàn tất xem trước bản nháp |
  | `plugin-sdk/inbound-envelope` | Trình trợ giúp phong bì đầu vào | Trình trợ giúp tuyến dùng chung + trình dựng phong bì |
  | `plugin-sdk/inbound-reply-dispatch` | Trình trợ giúp trả lời đầu vào | Trình trợ giúp ghi lại và điều phối dùng chung |
  | `plugin-sdk/messaging-targets` | Phân tích mục tiêu nhắn tin | Trình trợ giúp phân tích/khớp mục tiêu |
  | `plugin-sdk/outbound-media` | Trình trợ giúp media đầu ra | Tải media đầu ra dùng chung |
  | `plugin-sdk/outbound-send-deps` | Trình trợ giúp phụ thuộc gửi đầu ra | Tra cứu `resolveOutboundSendDep` gọn nhẹ mà không import toàn bộ runtime đầu ra |
  | `plugin-sdk/outbound-runtime` | Trình trợ giúp runtime đầu ra | Trình trợ giúp phân phối đầu ra, ủy quyền danh tính/gửi, phiên, định dạng và lập kế hoạch payload |
  | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp liên kết luồng | Vòng đời liên kết luồng và trình trợ giúp bộ chuyển đổi |
  | `plugin-sdk/agent-media-payload` | Trình trợ giúp payload media cũ | Trình dựng payload media tác tử cho bố cục trường cũ |
  | `plugin-sdk/channel-runtime` | Shim tương thích đã ngừng dùng | Chỉ tiện ích runtime kênh cũ |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trình trợ giúp runtime phạm vi rộng | Trình trợ giúp runtime/ghi log/sao lưu/cài đặt Plugin |
  | `plugin-sdk/runtime-env` | Trình trợ giúp môi trường runtime phạm vi hẹp | Trình trợ giúp logger/môi trường runtime, timeout, thử lại và backoff |
  | `plugin-sdk/plugin-runtime` | Trình trợ giúp runtime Plugin dùng chung | Trình trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Trình trợ giúp pipeline hook | Trình trợ giúp pipeline Webhook/hook nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trình trợ giúp runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trình trợ giúp tiến trình | Trình trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trình trợ giúp runtime CLI | Định dạng lệnh, chờ, trình trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Trình trợ giúp Gateway | Client Gateway, trình trợ giúp khởi động khi vòng lặp sự kiện sẵn sàng và trình trợ giúp vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình đã ngừng dùng | Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp lệnh Telegram | Trình trợ giúp xác thực lệnh Telegram ổn định khi dự phòng nếu bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Trình trợ giúp lời nhắc phê duyệt | Payload phê duyệt exec/Plugin, trình trợ giúp capability/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt gốc và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Trình trợ giúp client phê duyệt | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec gốc |
  | `plugin-sdk/approval-delivery-runtime` | Trình trợ giúp phân phối phê duyệt | Bộ chuyển đổi capability/phân phối phê duyệt gốc |
  | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp Gateway phê duyệt | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp bộ chuyển đổi phê duyệt | Trình trợ giúp tải bộ chuyển đổi phê duyệt gốc gọn nhẹ cho điểm vào kênh hot |
  | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp trình xử lý phê duyệt | Trình trợ giúp runtime trình xử lý phê duyệt rộng hơn; ưu tiên các seam bộ chuyển đổi/Gateway hẹp hơn khi đủ dùng |
  | `plugin-sdk/approval-native-runtime` | Trình trợ giúp mục tiêu phê duyệt | Trình trợ giúp liên kết mục tiêu/tài khoản phê duyệt gốc |
  | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp trả lời phê duyệt | Trình trợ giúp payload trả lời phê duyệt exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Trình trợ giúp ngữ cảnh runtime kênh | Trình trợ giúp đăng ký/lấy/theo dõi ngữ cảnh runtime kênh chung |
  | `plugin-sdk/security-runtime` | Trình trợ giúp bảo mật | Trình trợ giúp tin cậy, cổng DM, tệp/đường dẫn giới hạn theo gốc, nội dung bên ngoài và thu thập secret dùng chung |
  | `plugin-sdk/ssrf-policy` | Trình trợ giúp chính sách SSRF | Trình trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trình trợ giúp runtime SSRF | Dispatcher ghim cố định, fetch được bảo vệ, trình trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trình trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp Heartbeat | Trình trợ giúp đánh thức Heartbeat, sự kiện và khả năng hiển thị |
  | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trình trợ giúp khử trùng lặp | Cache khử trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Trình trợ giúp truy cập tệp | Trình trợ giúp đường dẫn tệp/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp mức sẵn sàng của transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Trình trợ giúp cache có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trình trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch/proxy được bọc | `resolveFetch`, trình trợ giúp proxy, trình trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trình trợ giúp thử lại | `RetryConfig`, `retryAsync`, trình chạy chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Ánh xạ đầu vào danh sách cho phép | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Trình trợ giúp cổng lệnh và bề mặt lệnh | `resolveControlCommandGate`, trình trợ giúp ủy quyền người gửi, trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Trình render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào secret | Trình trợ giúp đầu vào secret |
  | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu Webhook | Tiện ích mục tiêu Webhook |
  | `plugin-sdk/webhook-request-guards` | Trình trợ giúp bảo vệ nội dung Webhook | Trình trợ giúp đọc/giới hạn nội dung yêu cầu |
  | `plugin-sdk/reply-runtime` | Runtime trả lời dùng chung | Điều phối đầu vào, Heartbeat, bộ lập kế hoạch trả lời, chia đoạn |
  | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp điều phối trả lời phạm vi hẹp | Hoàn tất, điều phối nhà cung cấp và trình trợ giúp nhãn hội thoại |
  | `plugin-sdk/reply-history` | Trình trợ giúp lịch sử trả lời | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trình trợ giúp chia đoạn trả lời | Trình trợ giúp chia đoạn văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên | Đường dẫn kho + trình trợ giúp updated-at |
  | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn trạng thái | Trình trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Trình dựng tóm tắt trạng thái kênh/tài khoản, giá trị mặc định trạng thái runtime, trình trợ giúp siêu dữ liệu vấn đề |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp phân giải mục tiêu | Trình trợ giúp phân giải mục tiêu dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL chuỗi từ đầu vào giống yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có tính thời gian | Trình chạy lệnh có tính thời gian với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Bộ đọc tham số | Bộ đọc tham số công cụ/CLI thông dụng |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất các payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất gửi công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi log | Trình trợ giúp logger hệ con và biên tập che thông tin nhạy cảm |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự lưu trữ được tuyển chọn | Trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự lưu trữ tương thích OpenAI có trọng tâm | Cùng các trình trợ giúp khám phá/cấu hình nhà cung cấp tự lưu trữ |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực runtime của nhà cung cấp | Trình trợ giúp phân giải khóa API runtime |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập khóa API của nhà cung cấp | Trình trợ giúp onboarding/ghi hồ sơ khóa API |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, các bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa model-id |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp danh mục nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình trợ giúp cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP của nhà cung cấp | Trình trợ giúp năng lực HTTP/endpoint nhà cung cấp tổng quát, bao gồm trình trợ giúp biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình web-search của nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực web-search hẹp cho nhà cung cấp không cần đấu nối bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng web-search của nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực web-search hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và setter/getter thông tin xác thực có phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp web-search của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/runtime nhà cung cấp web-search |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema của nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema Gemini + chẩn đoán |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng của nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp bộ bọc stream của nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu bộ bọc stream và trình trợ giúp bộ bọc Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport của nhà cung cấp | Trình trợ giúp transport gốc của nhà cung cấp như fetch có bảo vệ, biến đổi tin nhắn transport và stream sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi bất đồng bộ có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp media dùng chung | Trình trợ giúp fetch/biến đổi/lưu trữ media, thăm dò kích thước video dựa trên ffprobe và bộ dựng payload media |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo media dùng chung | Trình trợ giúp failover dùng chung, chọn ứng viên và thông báo thiếu mô hình cho tạo hình ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trình trợ giúp hình ảnh/âm thanh hướng đến nhà cung cấp |
  | `plugin-sdk/text-runtime` | Export tương thích văn bản rộng đã lỗi thời | Dùng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản gửi đi |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng trình trợ giúp chỉ thị, registry, xác thực hướng đến nhà cung cấp và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải, trình trợ giúp phiên cầu nối, hàng đợi phản hồi giọng nói tác nhân dùng chung, sức khỏe bản chép lời/sự kiện, triệt vọng âm và trình trợ giúp tham vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo hình ảnh | Kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL tài sản/dữ liệu hình ảnh và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo hình ảnh dùng chung | Kiểu tạo hình ảnh, failover, xác thực và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp failover, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/thu gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Primitive cấu hình kênh | Primitive schema cấu hình kênh hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp ủy quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Phần mở đầu kênh dùng chung | Export phần mở đầu Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp ảnh chụp/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình allowlist | Trình trợ giúp sửa/đọc cấu hình allowlist |
  | `plugin-sdk/group-access` | Trình trợ giúp truy cập nhóm | Trình trợ giúp quyết định truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm` | Trình trợ giúp DM trực tiếp | Trình trợ giúp xác thực/bảo vệ DM trực tiếp dùng chung |
  | `plugin-sdk/extension-shared` | Trình trợ giúp extension dùng chung | Primitive trình trợ giúp trạng thái/kênh thụ động và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Registry đích Webhook và trình trợ giúp cài đặt route |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn webhook đã lỗi thời | Dùng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp media web dùng chung | Trình trợ giúp tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Re-export tương thích Zod đã lỗi thời | Import `zod` từ `zod` trực tiếp |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core đóng gói | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime engine bộ nhớ | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine nền tảng host bộ nhớ | Export engine nền tảng host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host bộ nhớ | Hợp đồng embedding bộ nhớ, truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa tổng quát; nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host bộ nhớ | Export engine QMD host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine lưu trữ host bộ nhớ | Export engine lưu trữ host bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức host bộ nhớ | Trình trợ giúp đa phương thức host bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn host bộ nhớ | Trình trợ giúp truy vấn host bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật host bộ nhớ | Trình trợ giúp bí mật host bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái host bộ nhớ | Trình trợ giúp trạng thái host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host bộ nhớ | Trình trợ giúp runtime CLI host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime lõi host bộ nhớ | Trình trợ giúp runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/runtime host bộ nhớ | Trình trợ giúp tệp/runtime host bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh runtime lõi host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện host bộ nhớ | Bí danh trung lập với nhà cung cấp cho trình trợ giúp nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/runtime bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý | Trình trợ giúp markdown được quản lý dùng chung cho các Plugin liền kề bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm active memory | Facade runtime trình quản lý tìm kiếm active-memory lazy |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái host bộ nhớ đã lỗi thời | Dùng `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích đã lỗi thời cục bộ trong repo; dùng các subpath kiểm thử cục bộ trong repo có trọng tâm như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý chỉ là tập con di chuyển chung, không phải toàn bộ bề mặt
SDK. Danh mục entrypoint của trình biên dịch nằm trong
`scripts/lib/plugin-sdk-entrypoints.json`; package exports được tạo từ
tập con công khai.

Các seam trợ giúp Plugin đi kèm đã dành riêng đã được loại khỏi export map
SDK công khai, ngoại trừ các facade tương thích được ghi tài liệu rõ ràng như
shim `plugin-sdk/discord` đã lỗi thời nhưng được giữ lại cho gói đã phát hành
`@openclaw/discord@2026.3.13`. Các helper dành riêng cho chủ sở hữu nằm bên trong
gói Plugin sở hữu chúng; hành vi host dùng chung nên đi qua các hợp đồng SDK
chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
và `plugin-sdk/plugin-config-runtime`.

Hãy dùng import hẹp nhất khớp với công việc. Nếu bạn không tìm thấy một export,
hãy kiểm tra mã nguồn tại `src/plugin-sdk/` hoặc hỏi maintainer hợp đồng chung
nào nên sở hữu nó.

## Các mục ngừng hỗ trợ đang hoạt động

Các mục ngừng hỗ trợ hẹp hơn áp dụng trên toàn bộ SDK Plugin, hợp đồng provider,
bề mặt runtime và manifest. Mỗi mục vẫn hoạt động hôm nay nhưng sẽ bị gỡ bỏ
trong một bản phát hành major trong tương lai. Dòng bên dưới mỗi mục ánh xạ API
cũ sang phần thay thế chuẩn của nó.

<AccordionGroup>
  <Accordion title="Trình dựng trợ giúp command-auth → command-status">
    **Cũ (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Mới (`openclaw/plugin-sdk/command-status`)**: cùng chữ ký, cùng
    exports - chỉ được import từ subpath hẹp hơn. `command-auth`
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
    `openclaw/plugin-sdk/channel-runtime` là một shim tương thích cho các
    Plugin kênh cũ hơn. Không import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng hỗ trợ cùng với các export kênh "actions" thô. Thay vào đó, hãy phơi bày
    capability thông qua bề mặt `presentation` có ngữ nghĩa - các Plugin kênh
    khai báo những gì chúng render (thẻ, nút, lựa chọn) thay vì tên hành động
    thô nào chúng chấp nhận.

  </Accordion>

  <Accordion title="Helper tool() của provider tìm kiếm web → createTool() trên Plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai trực tiếp `createTool(...)` trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper công cụ.

  </Accordion>

  <Accordion title="Envelope kênh dạng văn bản thuần → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để dựng envelope prompt văn bản
    thuần phẳng từ các thông điệp kênh inbound.

    **Mới**: `BodyForAgent` cộng với các khối ngữ cảnh người dùng có cấu trúc.
    Các Plugin kênh gắn metadata định tuyến (luồng, chủ đề, trả lời, phản ứng)
    dưới dạng các trường có kiểu thay vì nối chúng vào chuỗi prompt. Helper
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope được tổng hợp
    hướng tới assistant, nhưng các envelope inbound dạng văn bản thuần đang
    dần bị loại bỏ.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và mọi
    Plugin kênh tùy chỉnh từng hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="Kiểu khám phá provider → kiểu danh mục provider">
    Bốn alias kiểu khám phá hiện là các wrapper mỏng trên các kiểu
    thời kỳ danh mục:

    | Alias cũ                 | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng với túi tĩnh `ProviderCapabilities` kế thừa - các Plugin provider
    nên dùng các hook provider rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas`, và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Hook chính sách suy nghĩ → resolveThinkingProfile">
    **Cũ** (ba hook riêng biệt trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn, và
    danh sách mức được xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu
    lỗi thời theo thứ hạng profile.

    Triển khai một hook thay vì ba. Các hook kế thừa vẫn hoạt động trong
    khoảng thời gian ngừng hỗ trợ nhưng không được hợp thành với kết quả profile.

  </Accordion>

  <Accordion title="Fallback provider OAuth bên ngoài → contracts.externalAuthProviders">
    **Cũ**: triển khai `resolveExternalOAuthProfiles(...)` mà không
    khai báo provider trong manifest Plugin.

    **Mới**: khai báo `contracts.externalAuthProviders` trong manifest Plugin
    **và** triển khai `resolveExternalAuthProfiles(...)`. Đường dẫn "auth
    fallback" cũ phát cảnh báo khi runtime và sẽ bị gỡ bỏ.

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
    trên manifest. Điều này hợp nhất metadata env cho thiết lập/trạng thái
    vào một nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu
    env-var.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua adapter tương thích
    cho đến khi khoảng thời gian ngừng hỗ trợ kết thúc.

  </Accordion>

  <Accordion title="Đăng ký Plugin bộ nhớ → registerMemoryCapability">
    **Cũ**: ba lệnh gọi riêng biệt -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lệnh gọi trên API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng slot, một lệnh gọi đăng ký duy nhất. Các helper bộ nhớ bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) không bị ảnh hưởng.

  </Accordion>

  <Accordion title="Kiểu thông điệp phiên subagent được đổi tên">
    Hai alias kiểu kế thừa vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                           | Mới                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng hỗ trợ để thay bằng
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi chuyển tiếp đến
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về một accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime đột biến TaskFlow được quản lý
    cho các Plugin tạo, cập nhật, hủy, hoặc chạy tác vụ con từ một flow.
    Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory extension nhúng → middleware kết quả công cụ của agent">
    Được trình bày trong "Cách di chuyển → Di chuyển extension kết quả công cụ Pi sang
    middleware" ở trên. Đưa vào đây để đầy đủ: đường dẫn chỉ dành cho Pi đã bị gỡ bỏ
    `api.registerEmbeddedExtensionFactory(...)` được thay bằng
    `api.registerAgentToolResultMiddleware(...)` với danh sách runtime rõ ràng
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` hiện là một
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
Các mục ngừng hỗ trợ cấp extension (bên trong các Plugin kênh/provider đi kèm dưới
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin bên thứ ba và không
được liệt kê ở đây. Nếu bạn dùng trực tiếp barrel cục bộ của một Plugin đi kèm,
hãy đọc các bình luận ngừng hỗ trợ trong barrel đó trước khi nâng cấp.
</Note>

## Lịch trình gỡ bỏ

| Khi nào                 | Điều gì xảy ra                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Bây giờ**            | Các bề mặt bị ngừng hỗ trợ phát cảnh báo runtime                        |
| **Bản phát hành major tiếp theo** | Các bề mặt bị ngừng hỗ trợ sẽ bị gỡ bỏ; các Plugin vẫn dùng chúng sẽ thất bại |

Tất cả Plugin lõi đã được di chuyển. Plugin bên ngoài nên di chuyển
trước bản phát hành major tiếp theo.

## Tạm thời chặn các cảnh báo

Đặt các biến môi trường này trong khi bạn thực hiện di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng Plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu import subpath đầy đủ
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng Plugin kênh
- [Plugin provider](/vi/plugins/sdk-provider-plugins) - xây dựng Plugin provider
- [Nội bộ Plugin](/vi/plugins/architecture) - đào sâu kiến trúc
- [Manifest Plugin](/vi/plugins/manifest) - tham chiếu schema manifest
