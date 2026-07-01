---
read_when:
    - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
    - Bạn đã dùng api.registerEmbeddedExtensionFactory trước OpenClaw 2026.4.25
    - Bạn đang cập nhật một Plugin lên kiến trúc Plugin hiện đại
    - Bạn duy trì một Plugin OpenClaw bên ngoài
sidebarTitle: Migrate to SDK
summary: Di chuyển từ lớp tương thích ngược kế thừa sang SDK plugin hiện đại
title: Di trú Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:14:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw đã chuyển từ một lớp tương thích ngược rộng sang kiến trúc Plugin hiện đại
với các import tập trung, có tài liệu. Nếu Plugin của bạn được xây dựng trước
kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Những gì đang thay đổi

Hệ thống Plugin cũ cung cấp hai bề mặt mở rộng cho phép Plugin import
mọi thứ cần thiết từ một điểm vào duy nhất:

- **`openclaw/plugin-sdk/compat`** - một import duy nhất re-export hàng chục
  helper. Nó được giới thiệu để giữ cho các Plugin dựa trên hook cũ tiếp tục hoạt động trong khi
  kiến trúc Plugin mới đang được xây dựng.
- **`openclaw/plugin-sdk/infra-runtime`** - một barrel helper runtime rộng
  trộn lẫn sự kiện hệ thống, trạng thái Heartbeat, hàng đợi phân phối, helper fetch/proxy,
  helper tệp, kiểu phê duyệt và các tiện ích không liên quan.
- **`openclaw/plugin-sdk/config-runtime`** - một barrel tương thích cấu hình rộng
  vẫn mang các helper tải/ghi trực tiếp đã lỗi thời trong giai đoạn di chuyển.
- **`openclaw/extension-api`** - một cầu nối cung cấp cho Plugin quyền truy cập trực tiếp vào
  các helper phía host như trình chạy agent nhúng.
- **`api.registerEmbeddedExtensionFactory(...)`** - một hook tiện ích mở rộng gói kèm chỉ dành cho embedded-runner đã bị gỡ bỏ,
  có thể quan sát các sự kiện embedded-runner như
  `tool_result`.

Các bề mặt import rộng hiện đã **bị ngừng khuyến nghị**. Chúng vẫn hoạt động ở runtime,
nhưng Plugin mới không được dùng chúng, và Plugin hiện có nên di chuyển trước khi
bản phát hành major tiếp theo gỡ bỏ chúng. API đăng ký extension factory chỉ dành cho embedded-runner
đã bị gỡ bỏ; hãy dùng middleware kết quả công cụ thay thế.

OpenClaw không gỡ bỏ hoặc diễn giải lại hành vi Plugin đã được tài liệu hóa trong cùng
thay đổi giới thiệu phương án thay thế. Các thay đổi phá vỡ hợp đồng trước tiên phải
đi qua adapter tương thích, chẩn đoán, tài liệu và một giai đoạn ngừng khuyến nghị.
Điều đó áp dụng cho import SDK, trường manifest, API thiết lập, hook và hành vi
đăng ký runtime.

<Warning>
  Lớp tương thích ngược sẽ bị gỡ bỏ trong một bản phát hành major trong tương lai.
  Các Plugin vẫn import từ những bề mặt này sẽ bị lỗi khi điều đó xảy ra.
  Các đăng ký embedded extension factory kiểu cũ hiện đã không còn được tải.
</Warning>

## Vì sao thay đổi này xảy ra

Cách tiếp cận cũ gây ra vấn đề:

- **Khởi động chậm** - import một helper sẽ tải hàng chục mô-đun không liên quan
- **Phụ thuộc vòng** - các re-export rộng khiến việc tạo vòng import trở nên dễ dàng
- **Bề mặt API không rõ ràng** - không có cách biết export nào ổn định và export nào là nội bộ

Plugin SDK hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`)
là một mô-đun nhỏ, độc lập, có mục đích rõ ràng và hợp đồng được tài liệu hóa.

Các điểm nối tiện ích provider cũ cho các kênh gói kèm cũng đã bị gỡ bỏ.
Các điểm nối helper mang thương hiệu kênh là lối tắt riêng của mono-repo, không phải
hợp đồng Plugin ổn định. Thay vào đó, hãy dùng các subpath SDK chung, hẹp. Bên trong workspace
Plugin gói kèm, giữ các helper do provider sở hữu trong `api.ts` hoặc
`runtime-api.ts` của chính Plugin đó.

Ví dụ provider gói kèm hiện tại:

- Anthropic giữ các helper stream dành riêng cho Claude trong điểm nối `api.ts` /
  `contract-api.ts` của riêng mình
- OpenAI giữ provider builder, helper mô hình mặc định và realtime provider
  builder trong `api.ts` của riêng mình
- OpenRouter giữ provider builder và helper onboarding/cấu hình trong
  `api.ts` của riêng mình

## Kế hoạch di chuyển Talk và thoại thời gian thực

Mã Talk cho thoại thời gian thực, điện thoại, cuộc họp và trình duyệt đang chuyển từ
ghi sổ lượt cục bộ theo bề mặt sang một bộ điều khiển phiên Talk dùng chung được export bởi
`openclaw/plugin-sdk/realtime-voice`. Bộ điều khiển mới sở hữu envelope sự kiện Talk
chung, trạng thái lượt đang hoạt động, trạng thái thu âm, trạng thái âm thanh đầu ra, lịch sử
sự kiện gần đây và loại bỏ lượt đã cũ. Plugin provider nên tiếp tục sở hữu
các phiên thời gian thực dành riêng cho vendor; Plugin bề mặt nên tiếp tục sở hữu các điểm đặc thù
về thu âm, phát lại, điện thoại và cuộc họp.

Đợt di chuyển Talk này cố ý phá vỡ sạch:

1. Giữ các primitive bộ điều khiển/runtime dùng chung trong
   `plugin-sdk/realtime-voice`.
2. Chuyển các bề mặt gói kèm sang bộ điều khiển dùng chung: relay trình duyệt,
   bàn giao phòng quản lý, thời gian thực cuộc gọi thoại, STT streaming cuộc gọi thoại, Google
   Meet thời gian thực và push-to-talk native.
3. Thay thế các họ RPC Talk cũ bằng API cuối cùng `talk.session.*` và
   `talk.client.*`.
4. Quảng bá một kênh sự kiện Talk trực tiếp trong Gateway
   `hello-ok.features.events`: `talk.event`.
5. Xóa endpoint HTTP thời gian thực cũ và mọi đường dẫn ghi đè chỉ thị tại thời điểm request.

Mã mới không nên gọi trực tiếp `createTalkEventSequencer(...)` trừ khi nó đang
triển khai adapter cấp thấp hoặc fixture kiểm thử. Hãy ưu tiên bộ điều khiển dùng chung
để các sự kiện theo phạm vi lượt không thể được phát ra nếu thiếu id lượt, các lệnh gọi `turnEnd` /
`turnCancel` đã cũ không thể xóa một lượt hoạt động mới hơn, và các sự kiện vòng đời
âm thanh đầu ra luôn nhất quán trên điện thoại, cuộc họp, relay trình duyệt, bàn giao
phòng quản lý và client Talk native.

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
vì trình duyệt sở hữu việc thương lượng provider và transport media trong khi
Gateway sở hữu thông tin xác thực, chỉ thị và chính sách công cụ. `talk.session.*` là
bề mặt chung do Gateway quản lý cho thời gian thực gateway-relay, phiên chép lời
gateway-relay và các phiên STT/TTS native trong phòng quản lý.

Các cấu hình cũ đặt bộ chọn thời gian thực cạnh `talk.provider` /
`talk.providers` nên được sửa bằng `openclaw doctor --fix`; Talk runtime
không diễn giải lại cấu hình provider speech/TTS thành cấu hình provider thời gian thực.

Các tổ hợp `talk.session.create` được hỗ trợ được cố ý giữ nhỏ:

| Chế độ          | Transport       | Brain           | Chủ sở hữu        | Ghi chú                                                                                                            |
| --------------- | --------------- | --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway           | Âm thanh provider full-duplex được nối qua Gateway; các lệnh gọi công cụ được định tuyến qua công cụ agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway           | Chỉ STT streaming; caller gửi âm thanh đầu vào và nhận sự kiện bản chép lời.                                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | Phòng native/client | Các phòng kiểu push-to-talk và walkie-talkie, trong đó client sở hữu thu/phát và Gateway sở hữu trạng thái lượt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Phòng native/client | Chế độ phòng chỉ dành cho admin cho các bề mặt first-party đáng tin cậy thực thi trực tiếp hành động công cụ Gateway. |

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

Từ vựng điều khiển thống nhất cũng được cố ý giữ hẹp:

  | Phương thức                     | Áp dụng cho                                             | Hợp đồng                                                                                                                                                                                     |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Nối một đoạn âm thanh PCM base64 vào phiên provider do cùng kết nối Gateway sở hữu.                                                                                                          |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Bắt đầu một lượt người dùng managed-room.                                                                                                                                                    |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Kết thúc lượt đang hoạt động sau khi xác thực lượt cũ.                                                                                                                                       |
  | `talk.session.cancelTurn`       | tất cả phiên do Gateway sở hữu                          | Hủy tác vụ capture/provider/agent/TTS đang hoạt động cho một lượt.                                                                                                                           |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Dừng đầu ra âm thanh của trợ lý mà không nhất thiết kết thúc lượt người dùng.                                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Hoàn tất một lệnh gọi công cụ provider do relay phát ra; truyền `options.willContinue` cho đầu ra tạm thời hoặc `options.suppressResponse` để đáp ứng lệnh gọi mà không có phản hồi trợ lý khác. |
  | `talk.session.steer`            | các phiên Talk có agent hỗ trợ                          | Gửi điều khiển bằng lời nói `status`, `steer`, `cancel`, hoặc `followup` tới lượt chạy nhúng đang hoạt động được phân giải từ phiên Talk.                                                    |
  | `talk.session.close`            | tất cả phiên hợp nhất                                   | Dừng các phiên relay hoặc thu hồi trạng thái managed-room, rồi quên id phiên hợp nhất.                                                                                                      |

  Không đưa các trường hợp đặc biệt theo provider hoặc nền tảng vào core để làm cho việc này hoạt động.
  Core sở hữu ngữ nghĩa phiên Talk. Plugin provider sở hữu thiết lập phiên của nhà cung cấp.
  Voice-call và Google Meet sở hữu các adapter điện thoại/cuộc họp. Trình duyệt và ứng dụng native
  sở hữu UX capture/phát lại thiết bị.

  ## Chính sách tương thích

  Đối với Plugin bên ngoài, công việc tương thích tuân theo thứ tự này:

  1. thêm hợp đồng mới
  2. giữ hành vi cũ được nối qua một adapter tương thích
  3. phát ra chẩn đoán hoặc cảnh báo nêu tên đường dẫn cũ và phần thay thế
  4. bao phủ cả hai đường dẫn trong kiểm thử
  5. ghi tài liệu về việc ngừng hỗ trợ và đường dẫn di trú
  6. chỉ gỡ bỏ sau khung thời gian di trú đã công bố, thường là trong một bản phát hành lớn

  Maintainer có thể kiểm tra hàng đợi di trú hiện tại bằng
  `pnpm plugins:boundary-report`. Dùng `pnpm plugins:boundary-report:summary` để có
  số đếm gọn, `--owner <id>` cho một Plugin hoặc chủ sở hữu tương thích, và
  `pnpm plugins:boundary-report:ci` khi một cổng CI nên thất bại trên các bản ghi
  tương thích đã đến hạn, import SDK dành riêng xuyên chủ sở hữu, hoặc các subpath SDK
  dành riêng không dùng đến. Báo cáo nhóm các bản ghi
  tương thích đã ngừng hỗ trợ theo ngày gỡ bỏ, đếm tham chiếu code/docs cục bộ,
  nêu bật import SDK dành riêng xuyên chủ sở hữu, và tóm tắt cầu nối SDK
  memory-host riêng tư để việc dọn dẹp tương thích luôn rõ ràng thay vì
  dựa vào các tìm kiếm tùy tiện. Subpath SDK dành riêng phải có mức sử dụng của chủ sở hữu được theo dõi;
  các export helper dành riêng không dùng đến nên được gỡ khỏi SDK công khai.

  Nếu một trường manifest vẫn được chấp nhận, tác giả Plugin có thể tiếp tục dùng nó cho đến khi
  tài liệu và chẩn đoán nói khác đi. Code mới nên ưu tiên phần thay thế đã được ghi tài liệu,
  nhưng các Plugin hiện có không nên bị hỏng trong các bản phát hành nhỏ thông thường.

  ## Cách di trú

  <Steps>
  <Step title="Di trú helper tải/ghi cấu hình runtime">
    Plugin bundled nên dừng gọi trực tiếp
    `api.runtime.config.loadConfig()` và
    `api.runtime.config.writeConfigFile(...)`. Ưu tiên cấu hình đã được
    truyền vào đường dẫn gọi đang hoạt động. Các handler sống lâu cần snapshot
    tiến trình hiện tại có thể dùng `api.runtime.config.current()`. Các công cụ
    agent sống lâu nên dùng `ctx.getRuntimeConfig()` của ngữ cảnh công cụ bên trong
    `execute` để một công cụ được tạo trước một lần ghi cấu hình vẫn thấy cấu hình
    runtime đã được làm mới.

    Các lần ghi cấu hình phải đi qua helper giao dịch và chọn một
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
    thay đổi yêu cầu khởi động lại Gateway sạch, và
    `afterWrite: { mode: "none", reason: "..." }` chỉ khi caller sở hữu phần
    theo sau và cố ý muốn chặn reload planner.
    Kết quả mutation bao gồm một bản tóm tắt `followUp` có kiểu cho kiểm thử và ghi log;
    Gateway vẫn chịu trách nhiệm áp dụng hoặc lên lịch khởi động lại.
    `loadConfig` và `writeConfigFile` vẫn là các helper tương thích đã ngừng hỗ trợ
    cho Plugin bên ngoài trong khung thời gian di trú và cảnh báo một lần với
    mã tương thích `runtime-config-load-write`. Plugin bundled và code runtime
    của repo được bảo vệ bằng hàng rào scanner trong
    `pnpm check:deprecated-api-usage` và
    `pnpm check:no-runtime-action-load-config`: mức sử dụng Plugin production mới
    sẽ thất bại ngay, ghi cấu hình trực tiếp thất bại, phương thức server Gateway phải dùng
    snapshot runtime của yêu cầu, helper gửi/hành động/client của channel runtime
    phải nhận cấu hình từ ranh giới của chúng, và các module runtime sống lâu
    không có lệnh gọi ambient `loadConfig()` nào được phép.

    Code Plugin mới cũng nên tránh import barrel tương thích rộng
    `openclaw/plugin-sdk/config-runtime`. Dùng subpath SDK hẹp
    khớp với công việc:

    | Nhu cầu | Import |
    | --- | --- |
    | Kiểu cấu hình như `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion cấu hình đã tải và tra cứu cấu hình plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Đọc snapshot runtime hiện tại | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Ghi cấu hình | `openclaw/plugin-sdk/config-mutation` |
    | Helper kho phiên | `openclaw/plugin-sdk/session-store-runtime` |
    | Cấu hình bảng Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime chính sách nhóm | `openclaw/plugin-sdk/runtime-group-policy` |
    | Phân giải đầu vào bí mật | `openclaw/plugin-sdk/secret-input-runtime` |
    | Ghi đè model/phiên | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundled và kiểm thử của chúng được scanner bảo vệ khỏi barrel rộng
    để import và mock vẫn cục bộ theo hành vi chúng cần. Barrel rộng
    vẫn tồn tại cho tương thích bên ngoài, nhưng code mới không nên
    phụ thuộc vào nó.

  </Step>

  <Step title="Di trú extension kết quả công cụ nhúng sang middleware">
    Plugin bundled phải thay thế các handler kết quả công cụ
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

    Plugin đã cài đặt cũng có thể đăng ký middleware kết quả công cụ khi chúng được
    bật rõ ràng và khai báo mọi runtime được nhắm tới trong
    `contracts.agentToolResultMiddleware`. Các đăng ký middleware đã cài đặt
    nhưng chưa khai báo sẽ bị từ chối.

  </Step>

  <Step title="Di trú handler approval-native sang fact năng lực">
    Các Plugin channel có khả năng approval giờ phơi bày hành vi approval native thông qua
    `approvalCapability.nativeRuntime` cộng với registry ngữ cảnh runtime dùng chung.

    Thay đổi chính:

    - Thay `approvalCapability.handler.loadRuntime(...)` bằng
      `approvalCapability.nativeRuntime`
    - Chuyển auth/delivery dành riêng cho approval khỏi wiring cũ `plugin.auth` /
      `plugin.approvals` và sang `approvalCapability`
    - `ChannelPlugin.approvals` đã bị gỡ khỏi hợp đồng channel-plugin công khai;
      chuyển các trường delivery/native/render sang `approvalCapability`
    - `plugin.auth` chỉ còn dành cho luồng đăng nhập/đăng xuất channel; các hook auth approval
      ở đó không còn được core đọc
    - Đăng ký các đối tượng runtime do channel sở hữu như client, token, hoặc ứng dụng Bolt
      qua `openclaw/plugin-sdk/channel-runtime-context`
    - Không gửi thông báo định tuyến lại do Plugin sở hữu từ handler approval native;
      core giờ sở hữu thông báo routed-elsewhere từ kết quả delivery thực tế
    - Khi truyền `channelRuntime` vào `createChannelManager(...)`, cung cấp một
      surface `createPluginRuntime().channel` thật. Stub một phần sẽ bị từ chối.

    Xem `/plugins/sdk-channel-plugins` để biết bố cục capability approval hiện tại.

  </Step>

  <Step title="Kiểm tra hành vi fallback wrapper Windows">
    Nếu Plugin của bạn dùng `openclaw/plugin-sdk/windows-spawn`, các wrapper Windows
    `.cmd`/`.bat` không phân giải được giờ fail closed trừ khi bạn truyền rõ ràng
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

    Nếu caller của bạn không cố ý phụ thuộc vào shell fallback, đừng đặt
    `allowShellFallback` và hãy xử lý lỗi được ném ra thay vào đó.

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

    Với các helper phía host, dùng runtime Plugin được inject thay vì import
    trực tiếp:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Cùng mẫu này áp dụng cho các trình trợ giúp cầu nối cũ khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | trình trợ giúp kho lưu trữ phiên | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Thay thế các import infra-runtime phạm vi rộng">
    `openclaw/plugin-sdk/infra-runtime` vẫn tồn tại để tương thích bên ngoài,
    nhưng mã mới nên import bề mặt trình trợ giúp tập trung mà nó thực sự cần:

    | Nhu cầu | Import |
    | --- | --- |
    | Trình trợ giúp hàng đợi sự kiện hệ thống | `openclaw/plugin-sdk/system-event-runtime` |
    | Trình trợ giúp đánh thức, sự kiện và khả năng hiển thị của Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Xả hàng đợi gửi đang chờ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Đo lường hoạt động kênh | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bộ đệm chống trùng lặp trong bộ nhớ | `openclaw/plugin-sdk/dedupe-runtime` |
    | Trình trợ giúp đường dẫn tệp/phương tiện cục bộ an toàn | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch nhận biết dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Trình trợ giúp proxy và fetch có bảo vệ | `openclaw/plugin-sdk/fetch-runtime` |
    | Kiểu chính sách dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Kiểu yêu cầu/giải quyết phê duyệt | `openclaw/plugin-sdk/approval-runtime` |
    | Trình trợ giúp payload phản hồi phê duyệt và lệnh | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Trình trợ giúp định dạng lỗi | `openclaw/plugin-sdk/error-runtime` |
    | Chờ trạng thái sẵn sàng của transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Trình trợ giúp token an toàn | `openclaw/plugin-sdk/secure-random-runtime` |
    | Đồng thời tác vụ bất đồng bộ có giới hạn | `openclaw/plugin-sdk/concurrency-runtime` |
    | Ép kiểu số | `openclaw/plugin-sdk/number-runtime` |
    | Khóa bất đồng bộ cục bộ theo tiến trình | `openclaw/plugin-sdk/async-lock-runtime` |
    | Khóa tệp | `openclaw/plugin-sdk/file-lock` |

    Các Plugin đóng gói kèm được trình quét bảo vệ khỏi `infra-runtime`, nên mã trong repo
    không thể thoái lui về barrel phạm vi rộng.

  </Step>

  <Step title="Di chuyển các trình trợ giúp route kênh">
    Mã route kênh mới nên dùng `openclaw/plugin-sdk/channel-route`.
    Các tên route-key và comparable-target cũ hơn vẫn được giữ làm alias tương thích
    trong cửa sổ di chuyển, nhưng Plugin mới nên dùng các tên route
    mô tả trực tiếp hành vi:

    | Trình trợ giúp cũ | Trình trợ giúp hiện đại |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Các trình trợ giúp route hiện đại chuẩn hóa `{ channel, to, accountId, threadId }`
    nhất quán trên phê duyệt native, chặn phản hồi, chống trùng lặp đầu vào,
    gửi cron và định tuyến phiên.

    Không thêm cách dùng mới của `ChannelMessagingAdapter.parseExplicitTarget` hoặc
    các trình trợ giúp loaded-route dựa trên parser (`parseExplicitTargetForLoadedChannel`
    hoặc `resolveRouteTargetForLoadedChannel`) hoặc
    `resolveChannelRouteTargetWithParser(...)` từ `plugin-sdk/channel-route`.
    Các hook đó đã bị loại bỏ dần và chỉ còn lại cho Plugin cũ hơn trong
    cửa sổ di chuyển. Plugin kênh mới nên dùng
    `messaging.targetResolver.resolveTarget(...)` để chuẩn hóa id đích
    và fallback khi không khớp thư mục, `messaging.inferTargetChatType(...)` khi lõi
    cần sớm biết loại peer, và `messaging.resolveOutboundSessionRoute(...)`
    cho phiên native của nhà cung cấp và danh tính luồng.

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
  | Đường dẫn nhập | Mục đích | Các export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Trình trợ giúp điểm vào Plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Tái export bao trùm kế thừa cho định nghĩa/bộ dựng điểm vào kênh | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export lược đồ cấu hình gốc | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Trình trợ giúp điểm vào một nhà cung cấp | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Định nghĩa và bộ dựng điểm vào kênh tập trung | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Trình trợ giúp trình hướng dẫn thiết lập dùng chung | Bộ dịch thiết lập, lời nhắc danh sách cho phép, bộ dựng trạng thái thiết lập |
  | `plugin-sdk/setup-runtime` | Trình trợ giúp runtime trong lúc thiết lập | `createSetupTranslator`, bộ điều hợp bản vá thiết lập an toàn khi nhập, trình trợ giúp ghi chú tra cứu, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy thiết lập được ủy quyền |
  | `plugin-sdk/setup-adapter-runtime` | Bí danh bộ điều hợp thiết lập không còn được khuyến nghị | Dùng `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Trình trợ giúp công cụ thiết lập | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Trình trợ giúp nhiều tài khoản | Trình trợ giúp danh sách/cấu hình/cổng hành động tài khoản |
  | `plugin-sdk/account-id` | Trình trợ giúp account-id | `DEFAULT_ACCOUNT_ID`, chuẩn hóa account-id |
  | `plugin-sdk/account-resolution` | Trình trợ giúp tra cứu tài khoản | Trình trợ giúp tra cứu tài khoản + dự phòng mặc định |
  | `plugin-sdk/account-helpers` | Trình trợ giúp tài khoản hẹp | Trình trợ giúp danh sách tài khoản/hành động tài khoản |
  | `plugin-sdk/channel-setup` | Bộ điều hợp trình hướng dẫn thiết lập | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, cùng với `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Nguyên hàm ghép cặp DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Dây nối tiền tố trả lời, nhập liệu và phân phối nguồn | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory bộ điều hợp cấu hình và trình trợ giúp truy cập DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Bộ dựng lược đồ cấu hình | Chỉ các nguyên hàm lược đồ cấu hình kênh dùng chung và bộ dựng tổng quát |
  | `plugin-sdk/bundled-channel-config-schema` | Lược đồ cấu hình đi kèm | Chỉ các Plugin đi kèm do OpenClaw duy trì; Plugin mới phải định nghĩa lược đồ cục bộ của Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Lược đồ cấu hình đi kèm không còn được khuyến nghị | Chỉ là bí danh tương thích; dùng `plugin-sdk/bundled-channel-config-schema` cho các Plugin đi kèm được duy trì |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp cấu hình lệnh Telegram | Chuẩn hóa tên lệnh, cắt gọn mô tả, xác thực trùng lặp/xung đột |
  | `plugin-sdk/channel-policy` | Phân giải chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facade tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Trình trợ giúp phong bì đầu vào | Trình trợ giúp tuyến dùng chung + bộ dựng phong bì |
  | `plugin-sdk/channel-inbound` | Trình trợ giúp nhận đầu vào | Dựng ngữ cảnh, định dạng, gốc, runner, gửi trả lời đã chuẩn bị và predicate điều phối |
  | `plugin-sdk/messaging-targets` | Đường dẫn nhập phân tích đích không còn được khuyến nghị | Dùng `plugin-sdk/channel-targets` cho trình trợ giúp phân tích đích tổng quát, `plugin-sdk/channel-route` cho so sánh tuyến, và `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do Plugin sở hữu cho phân giải đích theo nhà cung cấp |
  | `plugin-sdk/outbound-media` | Trình trợ giúp media đầu ra | Tải media đầu ra dùng chung |
  | `plugin-sdk/outbound-send-deps` | Facade tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Trình trợ giúp vòng đời tin nhắn đầu ra | Bộ điều hợp tin nhắn, biên nhận, trình trợ giúp gửi bền vững, trình trợ giúp xem trước trực tiếp/streaming, tùy chọn trả lời, trình trợ giúp vòng đời, danh tính đầu ra và lập kế hoạch payload |
  | `plugin-sdk/channel-streaming` | Facade tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facade tương thích không còn được khuyến nghị | Dùng `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Trình trợ giúp liên kết luồng | Trình trợ giúp vòng đời liên kết luồng và bộ điều hợp |
  | `plugin-sdk/agent-media-payload` | Trình trợ giúp payload media kế thừa | Bộ dựng payload media tác nhân cho bố cục trường kế thừa |
  | `plugin-sdk/channel-runtime` | Shim tương thích không còn được khuyến nghị | Chỉ tiện ích runtime kênh kế thừa |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ Plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Trình trợ giúp runtime rộng | Trình trợ giúp runtime/ghi log/sao lưu/cài đặt Plugin |
  | `plugin-sdk/runtime-env` | Trình trợ giúp môi trường runtime hẹp | Trình trợ giúp logger/môi trường runtime, timeout, retry và backoff |
  | `plugin-sdk/plugin-runtime` | Trình trợ giúp runtime Plugin dùng chung | Trình trợ giúp lệnh/hook/http/tương tác của Plugin |
  | `plugin-sdk/hook-runtime` | Trình trợ giúp pipeline hook | Trình trợ giúp pipeline hook Webhook/nội bộ dùng chung |
  | `plugin-sdk/lazy-runtime` | Trình trợ giúp runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Trình trợ giúp tiến trình | Trình trợ giúp exec dùng chung |
  | `plugin-sdk/cli-runtime` | Trình trợ giúp runtime CLI | Định dạng lệnh, chờ, trình trợ giúp phiên bản |
  | `plugin-sdk/gateway-runtime` | Trình trợ giúp Gateway | Client Gateway, trình trợ giúp khởi động sẵn sàng vòng lặp sự kiện và trình trợ giúp vá trạng thái kênh |
  | `plugin-sdk/config-runtime` | Shim tương thích cấu hình không còn được khuyến nghị | Nên dùng `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Trình trợ giúp lệnh Telegram | Trình trợ giúp xác thực lệnh Telegram ổn định với dự phòng khi bề mặt hợp đồng Telegram đi kèm không khả dụng |
  | `plugin-sdk/approval-runtime` | Trình trợ giúp lời nhắc phê duyệt | Payload phê duyệt exec/Plugin, trình trợ giúp năng lực/hồ sơ phê duyệt, trình trợ giúp định tuyến/runtime phê duyệt native và định dạng đường dẫn hiển thị phê duyệt có cấu trúc |
  | `plugin-sdk/approval-auth-runtime` | Trình trợ giúp xác thực phê duyệt | Phân giải người phê duyệt, xác thực hành động trong cùng cuộc trò chuyện |
  | `plugin-sdk/approval-client-runtime` | Trình trợ giúp client phê duyệt | Trình trợ giúp hồ sơ/bộ lọc phê duyệt exec native |
  | `plugin-sdk/approval-delivery-runtime` | Trình trợ giúp phân phối phê duyệt | Bộ điều hợp năng lực/phân phối phê duyệt native |
  | `plugin-sdk/approval-gateway-runtime` | Trình trợ giúp Gateway phê duyệt | Trình trợ giúp phân giải Gateway phê duyệt dùng chung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Trình trợ giúp bộ điều hợp phê duyệt | Trình trợ giúp tải bộ điều hợp phê duyệt native gọn nhẹ cho điểm vào kênh nóng |
  | `plugin-sdk/approval-handler-runtime` | Trình trợ giúp handler phê duyệt | Trình trợ giúp runtime handler phê duyệt rộng hơn; ưu tiên các điểm nối bộ điều hợp/Gateway hẹp hơn khi đủ dùng |
  | `plugin-sdk/approval-native-runtime` | Trình trợ giúp đích phê duyệt | Trình trợ giúp liên kết đích/tài khoản phê duyệt native |
  | `plugin-sdk/approval-reply-runtime` | Trình trợ giúp trả lời phê duyệt | Trình trợ giúp payload trả lời phê duyệt exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Trình trợ giúp ngữ cảnh runtime kênh | Trình trợ giúp đăng ký/lấy/theo dõi ngữ cảnh runtime kênh tổng quát |
  | `plugin-sdk/security-runtime` | Trình trợ giúp bảo mật | Trình trợ giúp độ tin cậy dùng chung, cổng DM, file/đường dẫn giới hạn theo gốc, nội dung bên ngoài và thu thập bí mật |
  | `plugin-sdk/ssrf-policy` | Trình trợ giúp chính sách SSRF | Trình trợ giúp danh sách cho phép host và chính sách mạng riêng |
  | `plugin-sdk/ssrf-runtime` | Trình trợ giúp runtime SSRF | Dispatcher được ghim, fetch được bảo vệ, trình trợ giúp chính sách SSRF |
  | `plugin-sdk/system-event-runtime` | Trình trợ giúp sự kiện hệ thống | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Trình trợ giúp Heartbeat | Trình trợ giúp đánh thức, sự kiện và hiển thị Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Trình trợ giúp hàng đợi phân phối | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Trình trợ giúp hoạt động kênh | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Trình trợ giúp chống trùng lặp | Cache chống trùng lặp trong bộ nhớ |
  | `plugin-sdk/file-access-runtime` | Trình trợ giúp truy cập file | Trình trợ giúp đường dẫn file/media cục bộ an toàn |
  | `plugin-sdk/transport-ready-runtime` | Trình trợ giúp mức sẵn sàng vận chuyển | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Trình trợ giúp chính sách phê duyệt exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Trình trợ giúp cache có giới hạn | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Trình trợ giúp cổng chẩn đoán | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Trình trợ giúp định dạng lỗi | `formatUncaughtError`, `isApprovalNotFoundError`, trình trợ giúp đồ thị lỗi |
  | `plugin-sdk/fetch-runtime` | Trình trợ giúp fetch/proxy được bọc | `resolveFetch`, trình trợ giúp proxy, trình trợ giúp tùy chọn EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Trình trợ giúp chuẩn hóa host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Trình trợ giúp retry | `RetryConfig`, `retryAsync`, runner chính sách |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép và ánh xạ đầu vào | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Trình trợ giúp cổng lệnh và bề mặt lệnh | `resolveControlCommandGate`, trình trợ giúp ủy quyền người gửi, trình trợ giúp sổ đăng ký lệnh bao gồm định dạng menu đối số động |
  | `plugin-sdk/command-status` | Bộ render trạng thái/trợ giúp lệnh | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Trình trợ giúp đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Trình trợ giúp yêu cầu Webhook | Tiện ích đích Webhook |
  | `plugin-sdk/webhook-request-guards` | Trình trợ giúp guard thân Webhook | Trình trợ giúp đọc/giới hạn thân yêu cầu |
  | `plugin-sdk/reply-runtime` | Runtime trả lời dùng chung | Điều phối đầu vào, Heartbeat, bộ lập kế hoạch trả lời, chia đoạn |
  | `plugin-sdk/reply-dispatch-runtime` | Trình trợ giúp điều phối trả lời hẹp | Hoàn tất, điều phối nhà cung cấp và trình trợ giúp nhãn hội thoại |
  | `plugin-sdk/reply-history` | Trình trợ giúp lịch sử trả lời | `createChannelHistoryWindow`; export tương thích trình trợ giúp map không còn được khuyến nghị như `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` và `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Lập kế hoạch tham chiếu trả lời | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Trình trợ giúp đoạn trả lời | Trình trợ giúp chia đoạn văn bản/markdown |
  | `plugin-sdk/session-store-runtime` | Trình trợ giúp kho phiên | Trình trợ giúp đường dẫn kho + updated-at |
  | `plugin-sdk/state-paths` | Trình trợ giúp đường dẫn trạng thái | Trình trợ giúp thư mục trạng thái và OAuth |
  | `plugin-sdk/routing` | Trình trợ giúp định tuyến/khóa phiên | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, trình trợ giúp chuẩn hóa khóa phiên |
  | `plugin-sdk/status-helpers` | Trình trợ giúp trạng thái kênh | Bộ dựng tóm tắt trạng thái kênh/tài khoản, mặc định trạng thái runtime, trình trợ giúp siêu dữ liệu vấn đề |
  | `plugin-sdk/target-resolver-runtime` | Trình trợ giúp bộ phân giải đích | Trình trợ giúp bộ phân giải đích dùng chung |
  | `plugin-sdk/string-normalization-runtime` | Trình trợ giúp chuẩn hóa chuỗi | Trình trợ giúp chuẩn hóa slug/chuỗi |
  | `plugin-sdk/request-url` | Trình trợ giúp URL yêu cầu | Trích xuất URL chuỗi từ đầu vào dạng yêu cầu |
  | `plugin-sdk/run-command` | Trình trợ giúp lệnh có giới hạn thời gian | Bộ chạy lệnh có giới hạn thời gian với stdout/stderr đã chuẩn hóa |
  | `plugin-sdk/param-readers` | Bộ đọc tham số | Bộ đọc tham số công cụ/CLI phổ biến |
  | `plugin-sdk/tool-payload` | Trích xuất payload công cụ | Trích xuất payload đã chuẩn hóa từ đối tượng kết quả công cụ |
  | `plugin-sdk/tool-send` | Trích xuất gửi công cụ | Trích xuất các trường đích gửi chuẩn từ đối số công cụ |
  | `plugin-sdk/temp-path` | Trình trợ giúp đường dẫn tạm | Trình trợ giúp đường dẫn tải xuống tạm dùng chung |
  | `plugin-sdk/logging-core` | Trình trợ giúp ghi log | Trình ghi log hệ thống con và trình trợ giúp biên tập ẩn |
  | `plugin-sdk/markdown-table-runtime` | Trình trợ giúp bảng Markdown | Trình trợ giúp chế độ bảng Markdown |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-setup` | Trình trợ giúp thiết lập nhà cung cấp cục bộ/tự host được tuyển chọn | Trình trợ giúp khám phá/cấu hình nhà cung cấp tự host |
  | `plugin-sdk/self-hosted-provider-setup` | Trình trợ giúp thiết lập nhà cung cấp tự host tương thích OpenAI có trọng tâm | Cùng các trình trợ giúp khám phá/cấu hình nhà cung cấp tự host |
  | `plugin-sdk/provider-auth-runtime` | Trình trợ giúp xác thực runtime của nhà cung cấp | Trình trợ giúp phân giải khóa API runtime |
  | `plugin-sdk/provider-auth-api-key` | Trình trợ giúp thiết lập khóa API nhà cung cấp | Trình trợ giúp onboarding/ghi hồ sơ khóa API |
  | `plugin-sdk/provider-auth-result` | Trình trợ giúp kết quả xác thực nhà cung cấp | Bộ dựng kết quả xác thực OAuth chuẩn |
  | `plugin-sdk/provider-selection-runtime` | Trình trợ giúp chọn nhà cung cấp | Chọn nhà cung cấp đã cấu hình hoặc tự động và hợp nhất cấu hình nhà cung cấp thô |
  | `plugin-sdk/provider-env-vars` | Trình trợ giúp biến môi trường nhà cung cấp | Trình trợ giúp tra cứu biến môi trường xác thực nhà cung cấp |
  | `plugin-sdk/provider-model-shared` | Trình trợ giúp mô hình/phát lại nhà cung cấp dùng chung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, bộ dựng chính sách phát lại dùng chung, trình trợ giúp endpoint nhà cung cấp và trình trợ giúp chuẩn hóa id mô hình |
  | `plugin-sdk/provider-catalog-shared` | Trình trợ giúp danh mục nhà cung cấp dùng chung | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Trình trợ giúp cấu hình onboarding |
  | `plugin-sdk/provider-http` | Trình trợ giúp HTTP nhà cung cấp | Trình trợ giúp khả năng HTTP/endpoint nhà cung cấp chung, bao gồm trình trợ giúp biểu mẫu multipart cho phiên âm âm thanh |
  | `plugin-sdk/provider-web-fetch` | Trình trợ giúp web-fetch nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm nhà cung cấp web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Trình trợ giúp cấu hình tìm kiếm web của nhà cung cấp | Trình trợ giúp cấu hình/thông tin xác thực tìm kiếm web hẹp cho các nhà cung cấp không cần dây nối bật Plugin |
  | `plugin-sdk/provider-web-search-contract` | Trình trợ giúp hợp đồng tìm kiếm web của nhà cung cấp | Trình trợ giúp hợp đồng cấu hình/thông tin xác thực tìm kiếm web hẹp như `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` và bộ đặt/lấy thông tin xác thực theo phạm vi |
  | `plugin-sdk/provider-web-search` | Trình trợ giúp tìm kiếm web của nhà cung cấp | Trình trợ giúp đăng ký/bộ nhớ đệm/runtime nhà cung cấp tìm kiếm web |
  | `plugin-sdk/provider-tools` | Trình trợ giúp tương thích công cụ/schema nhà cung cấp | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` và dọn dẹp schema + chẩn đoán DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Trình trợ giúp mức sử dụng nhà cung cấp | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` và các trình trợ giúp mức sử dụng nhà cung cấp khác |
  | `plugin-sdk/provider-stream` | Trình trợ giúp wrapper luồng nhà cung cấp | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, kiểu wrapper luồng và trình trợ giúp wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot dùng chung |
  | `plugin-sdk/provider-transport-runtime` | Trình trợ giúp transport nhà cung cấp | Trình trợ giúp transport nhà cung cấp gốc như fetch có bảo vệ, trích xuất văn bản kết quả công cụ, biến đổi tin nhắn transport và luồng sự kiện transport có thể ghi |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi async có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Trình trợ giúp media dùng chung | Trình trợ giúp tìm nạp/biến đổi/lưu trữ media, dò kích thước video dựa trên ffprobe và bộ dựng payload media |
  | `plugin-sdk/media-generation-runtime` | Trình trợ giúp tạo media dùng chung | Trình trợ giúp chuyển đổi dự phòng dùng chung, chọn ứng viên và thông báo thiếu mô hình cho tạo hình ảnh/video/nhạc |
  | `plugin-sdk/media-understanding` | Trình trợ giúp hiểu media | Kiểu nhà cung cấp hiểu media cùng các export trình trợ giúp hình ảnh/âm thanh hướng tới nhà cung cấp |
  | `plugin-sdk/text-runtime` | Export tương thích văn bản rộng không dùng nữa | Dùng `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` và `logging-core` |
  | `plugin-sdk/text-chunking` | Trình trợ giúp chia đoạn văn bản | Trình trợ giúp chia đoạn văn bản đi |
  | `plugin-sdk/speech` | Trình trợ giúp giọng nói | Kiểu nhà cung cấp giọng nói cùng trình trợ giúp chỉ thị, registry, xác thực hướng tới nhà cung cấp và bộ dựng TTS tương thích OpenAI |
  | `plugin-sdk/speech-core` | Lõi giọng nói dùng chung | Kiểu nhà cung cấp giọng nói, registry, chỉ thị, chuẩn hóa |
  | `plugin-sdk/realtime-transcription` | Trình trợ giúp phiên âm thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry và trình trợ giúp phiên WebSocket dùng chung |
  | `plugin-sdk/realtime-voice` | Trình trợ giúp giọng nói thời gian thực | Kiểu nhà cung cấp, trình trợ giúp registry/phân giải, trình trợ giúp phiên cầu nối, hàng đợi phản hồi bằng giọng nói của tác tử dùng chung, điều khiển giọng nói lượt chạy đang hoạt động, sức khỏe bản ghi/sự kiện, triệt tiếng vọng, khớp câu hỏi tư vấn, điều phối tư vấn bắt buộc, theo dõi ngữ cảnh lượt, theo dõi hoạt động đầu ra và trình trợ giúp tư vấn ngữ cảnh nhanh |
  | `plugin-sdk/image-generation` | Trình trợ giúp tạo hình ảnh | Kiểu nhà cung cấp tạo hình ảnh cùng trình trợ giúp URL dữ liệu/tài nguyên hình ảnh và bộ dựng nhà cung cấp hình ảnh tương thích OpenAI |
  | `plugin-sdk/image-generation-core` | Lõi tạo hình ảnh dùng chung | Kiểu tạo hình ảnh, chuyển đổi dự phòng, xác thực và trình trợ giúp registry |
  | `plugin-sdk/music-generation` | Trình trợ giúp tạo nhạc | Kiểu nhà cung cấp/yêu cầu/kết quả tạo nhạc |
  | `plugin-sdk/music-generation-core` | Lõi tạo nhạc dùng chung | Kiểu tạo nhạc, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/video-generation` | Trình trợ giúp tạo video | Kiểu nhà cung cấp/yêu cầu/kết quả tạo video |
  | `plugin-sdk/video-generation-core` | Lõi tạo video dùng chung | Kiểu tạo video, trình trợ giúp chuyển đổi dự phòng, tra cứu nhà cung cấp và phân tích model-ref |
  | `plugin-sdk/interactive-runtime` | Trình trợ giúp trả lời tương tác | Chuẩn hóa/thu gọn payload trả lời tương tác |
  | `plugin-sdk/channel-config-primitives` | Primitive cấu hình kênh | Primitive schema cấu hình kênh hẹp |
  | `plugin-sdk/channel-config-writes` | Trình trợ giúp ghi cấu hình kênh | Trình trợ giúp cấp quyền ghi cấu hình kênh |
  | `plugin-sdk/channel-plugin-common` | Prelude kênh dùng chung | Export prelude Plugin kênh dùng chung |
  | `plugin-sdk/channel-status` | Trình trợ giúp trạng thái kênh | Trình trợ giúp ảnh chụp/tóm tắt trạng thái kênh dùng chung |
  | `plugin-sdk/allowlist-config-edit` | Trình trợ giúp cấu hình danh sách cho phép | Trình trợ giúp chỉnh sửa/đọc cấu hình danh sách cho phép |
  | `plugin-sdk/group-access` | Trình trợ giúp quyền truy cập nhóm | Trình trợ giúp quyết định quyền truy cập nhóm dùng chung |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade tương thích không dùng nữa | Dùng `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Trình trợ giúp bảo vệ DM trực tiếp | Trình trợ giúp chính sách bảo vệ hẹp trước mã hóa |
  | `plugin-sdk/extension-shared` | Trình trợ giúp phần mở rộng dùng chung | Primitive trình trợ giúp kênh thụ động/trạng thái và proxy môi trường |
  | `plugin-sdk/webhook-targets` | Trình trợ giúp đích Webhook | Registry đích Webhook và trình trợ giúp cài đặt tuyến |
  | `plugin-sdk/webhook-path` | Bí danh đường dẫn webhook không dùng nữa | Dùng `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Trình trợ giúp media web dùng chung | Trình trợ giúp tải media từ xa/cục bộ |
  | `plugin-sdk/zod` | Re-export tương thích Zod không dùng nữa | Import `zod` từ `zod` trực tiếp |
  | `plugin-sdk/memory-core` | Trình trợ giúp memory-core được đóng gói | Bề mặt trình trợ giúp trình quản lý/cấu hình/tệp/CLI bộ nhớ |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime engine bộ nhớ | Facade runtime lập chỉ mục/tìm kiếm bộ nhớ |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding bộ nhớ | Trình trợ giúp registry nhà cung cấp embedding bộ nhớ nhẹ |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine nền tảng host bộ nhớ | Export engine nền tảng host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host bộ nhớ | Hợp đồng embedding bộ nhớ, quyền truy cập registry, nhà cung cấp cục bộ và trình trợ giúp batch/từ xa chung; nhà cung cấp từ xa cụ thể nằm trong Plugin sở hữu chúng |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host bộ nhớ | Export engine QMD host bộ nhớ |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine lưu trữ host bộ nhớ | Export engine lưu trữ host bộ nhớ |
  | `plugin-sdk/memory-core-host-multimodal` | Trình trợ giúp đa phương thức host bộ nhớ | Trình trợ giúp đa phương thức host bộ nhớ |
  | `plugin-sdk/memory-core-host-query` | Trình trợ giúp truy vấn host bộ nhớ | Trình trợ giúp truy vấn host bộ nhớ |
  | `plugin-sdk/memory-core-host-secret` | Trình trợ giúp bí mật host bộ nhớ | Trình trợ giúp bí mật host bộ nhớ |
  | `plugin-sdk/memory-core-host-events` | Bí danh sự kiện bộ nhớ không dùng nữa | Dùng `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Trình trợ giúp trạng thái host bộ nhớ | Trình trợ giúp trạng thái host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host bộ nhớ | Trình trợ giúp runtime CLI host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime lõi host bộ nhớ | Trình trợ giúp runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-core-host-runtime-files` | Trình trợ giúp tệp/runtime host bộ nhớ | Trình trợ giúp tệp/runtime host bộ nhớ |
  | `plugin-sdk/memory-host-core` | Bí danh runtime lõi host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp runtime lõi host bộ nhớ |
  | `plugin-sdk/memory-host-events` | Bí danh nhật ký sự kiện host bộ nhớ | Bí danh trung lập nhà cung cấp cho trình trợ giúp nhật ký sự kiện host bộ nhớ |
  | `plugin-sdk/memory-host-files` | Bí danh tệp/runtime bộ nhớ không dùng nữa | Dùng `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Trình trợ giúp markdown được quản lý | Trình trợ giúp markdown được quản lý dùng chung cho các Plugin liền kề bộ nhớ |
  | `plugin-sdk/memory-host-search` | Facade tìm kiếm Active Memory | Facade runtime search-manager Active Memory tải lười |
  | `plugin-sdk/memory-host-status` | Bí danh trạng thái host bộ nhớ không dùng nữa | Dùng `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Tiện ích kiểm thử | Barrel tương thích không dùng nữa cục bộ trong repo; dùng các đường dẫn con kiểm thử cục bộ trong repo có trọng tâm như `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` và `plugin-sdk/test-fixtures` |
</Accordion>

Bảng này cố ý là tập con di chuyển chung, không phải toàn bộ bề mặt SDK. Bản kiểm kê entrypoint của trình biên dịch nằm trong `scripts/lib/plugin-sdk-entrypoints.json`; package exports được tạo từ tập con công khai.

Các seam trợ giúp dành riêng cho bundled-plugin đã được loại bỏ khỏi export map SDK công khai, ngoại trừ các facade tương thích được ghi rõ trong tài liệu, chẳng hạn shim `plugin-sdk/discord` đã ngừng khuyến nghị nhưng vẫn được giữ cho package `@openclaw/discord@2026.3.13` đã phát hành. Các helper theo chủ sở hữu nằm bên trong package Plugin sở hữu chúng; hành vi host dùng chung nên đi qua các hợp đồng SDK chung như `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, và `plugin-sdk/plugin-config-runtime`.

Dùng import hẹp nhất khớp với công việc. Nếu bạn không tìm thấy export, hãy kiểm tra nguồn tại `src/plugin-sdk/` hoặc hỏi maintainer hợp đồng chung nào nên sở hữu nó.

## Các ngừng khuyến nghị đang hoạt động

Các ngừng khuyến nghị hẹp hơn áp dụng trên toàn bộ plugin SDK, hợp đồng provider, bề mặt runtime, và manifest. Mỗi mục vẫn hoạt động hôm nay nhưng sẽ bị gỡ bỏ trong một bản phát hành major trong tương lai. Dòng bên dưới mỗi mục ánh xạ API cũ sang thay thế chuẩn của nó.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
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

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Cũ**: `resolveInboundMentionRequirement({ facts, policy })` và
    `shouldDropInboundForMention(...)` từ
    `openclaw/plugin-sdk/channel-inbound` hoặc
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Mới**: `resolveInboundMentionDecision({ facts, policy })` - trả về một
    đối tượng quyết định duy nhất thay vì hai lời gọi tách rời.

    Các Plugin kênh hạ nguồn (Slack, Discord, Matrix, MS Teams) đã chuyển đổi.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` là shim tương thích cho các
    Plugin kênh cũ hơn. Đừng import nó từ mã mới; hãy dùng
    `openclaw/plugin-sdk/channel-runtime-context` để đăng ký các đối tượng
    runtime.

    Các helper `channelActions*` trong `openclaw/plugin-sdk/channel-actions` bị
    ngừng khuyến nghị cùng với export kênh "actions" thô. Thay vào đó hãy phơi bày capability
    thông qua bề mặt `presentation` có ngữ nghĩa - các Plugin kênh
    khai báo thứ chúng render (thẻ, nút, lựa chọn) thay vì tên action thô
    mà chúng chấp nhận.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Cũ**: factory `tool()` từ `openclaw/plugin-sdk/provider-web-search`.

    **Mới**: triển khai `createTool(...)` trực tiếp trên Plugin provider.
    OpenClaw không còn cần helper SDK để đăng ký wrapper tool.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Cũ**: `formatInboundEnvelope(...)` (và
    `ChannelMessageForAgent.channelEnvelope`) để tạo một envelope prompt văn bản thuần dạng phẳng
    từ các thông điệp kênh đi vào.

    **Mới**: `BodyForAgent` cộng với các khối user-context có cấu trúc. Các
    Plugin kênh đính kèm metadata định tuyến (thread, topic, reply-to, reactions) dưới dạng
    các trường có kiểu thay vì nối chúng vào chuỗi prompt. Helper
    `formatAgentEnvelope(...)` vẫn được hỗ trợ cho các envelope tổng hợp
    hướng tới assistant, nhưng envelope văn bản thuần đi vào đang dần bị loại bỏ.

    Khu vực bị ảnh hưởng: `inbound_claim`, `message_received`, và mọi
    Plugin kênh tùy chỉnh đã hậu xử lý văn bản `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Cũ**: `api.on("deactivate", handler)`.

    **Mới**: `api.on("gateway_stop", handler)`. Event và context là cùng
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

  <Accordion title="subagent_spawning hook → core thread binding">
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
    các bề mặt tương thích đã ngừng khuyến nghị trong khi các Plugin bên ngoài di chuyển.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Bốn alias kiểu discovery hiện là wrapper mỏng trên các kiểu
    thời catalog:

    | Alias cũ                  | Kiểu mới                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Cộng thêm túi tĩnh `ProviderCapabilities` legacy - các Plugin provider
    nên dùng các hook provider rõ ràng như `buildReplayPolicy`,
    `normalizeToolSchemas`, và `wrapStreamFn` thay vì một đối tượng tĩnh.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Cũ** (ba hook riêng trên `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, và
    `resolveDefaultThinkingLevel(ctx)`.

    **Mới**: một `resolveThinkingProfile(ctx)` duy nhất trả về
    `ProviderThinkingProfile` với `id` chuẩn, `label` tùy chọn, và
    danh sách level được xếp hạng. OpenClaw tự động hạ cấp các giá trị đã lưu cũ
    theo thứ hạng profile.

    Context bao gồm `provider`, `modelId`, `reasoning` đã hợp nhất tùy chọn,
    và các fact `compat` của model đã hợp nhất tùy chọn. Các Plugin provider có thể dùng những
    fact catalog đó để phơi bày một profile theo model chỉ khi hợp đồng request
    được cấu hình hỗ trợ nó.

    Triển khai một hook thay vì ba. Các hook legacy tiếp tục hoạt động trong
    cửa sổ ngừng khuyến nghị nhưng không được compose với kết quả profile.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Cũ**: triển khai các hook xác thực bên ngoài mà không khai báo provider
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

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    Trường manifest **cũ**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Mới**: phản chiếu cùng tra cứu env-var vào `setup.providers[].envVars`
    trên manifest. Việc này hợp nhất metadata env cho setup/status vào một
    nơi và tránh khởi động runtime Plugin chỉ để trả lời các tra cứu env-var.

    `providerAuthEnvVars` vẫn được hỗ trợ thông qua một adapter tương thích
    cho đến khi cửa sổ ngừng khuyến nghị đóng lại.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Cũ**: ba lời gọi riêng -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Mới**: một lời gọi trên API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Cùng các slot, một lời gọi đăng ký duy nhất. Các helper prompt và corpus dạng bổ sung
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) không
    bị ảnh hưởng.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Cũ**: `api.registerMemoryEmbeddingProvider(...)` cộng với
    `contracts.memoryEmbeddingProviders`.

    **Mới**: `api.registerEmbeddingProvider(...)` cộng với
    `contracts.embeddingProviders`.

    Hợp đồng provider embedding chung có thể dùng lại bên ngoài memory và là
    đường dẫn được hỗ trợ cho các provider mới. API đăng ký riêng cho memory
    vẫn được nối dây dưới dạng tương thích đã ngừng khuyến nghị trong khi các provider hiện có di chuyển.
    Báo cáo kiểm tra Plugin ghi nhận việc sử dụng không bundled là nợ tương thích.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Hai alias kiểu legacy vẫn được export từ `src/plugins/runtime/types.ts`:

    | Cũ                            | Mới                              |
    | ----------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Phương thức runtime `readSession` bị ngừng khuyến nghị để dùng
    `getSessionMessages`. Cùng chữ ký; phương thức cũ gọi xuyên sang
    phương thức mới.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Cũ**: `runtime.tasks.flow` (số ít) trả về accessor task-flow trực tiếp.

    **Mới**: `runtime.tasks.managedFlows` giữ runtime mutation TaskFlow được quản lý
    cho các Plugin tạo, cập nhật, hủy, hoặc chạy tác vụ con từ một
    flow. Dùng `runtime.tasks.flows` khi Plugin chỉ cần đọc dựa trên DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Đã được trình bày trong "Cách di chuyển → Di chuyển các extension tool-result nhúng sang
    middleware" ở trên. Đưa vào đây để đầy đủ: đường dẫn chỉ dành cho embedded-runner đã bị gỡ bỏ
    `api.registerEmbeddedExtensionFactory(...)` được thay thế bằng
    `api.registerAgentToolResultMiddleware(...)` với danh sách runtime rõ ràng
    trong `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` được re-export từ `openclaw/plugin-sdk` hiện là
    alias một dòng cho `OpenClawConfig`. Ưu tiên tên chuẩn.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Các ngừng khuyến nghị cấp extension (bên trong các Plugin kênh/provider bundled dưới
`extensions/`) được theo dõi trong các barrel `api.ts` và `runtime-api.ts`
riêng của chúng. Chúng không ảnh hưởng đến hợp đồng Plugin bên thứ ba và không được liệt kê
ở đây. Nếu bạn tiêu thụ trực tiếp barrel cục bộ của một Plugin bundled, hãy đọc
các comment ngừng khuyến nghị trong barrel đó trước khi nâng cấp.
</Note>

## Mốc thời gian gỡ bỏ

| Khi nào                | Điều gì xảy ra                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Bây giờ**            | Các bề mặt không còn được khuyến nghị phát ra cảnh báo khi chạy          |
| **Bản phát hành chính tiếp theo** | Các bề mặt không còn được khuyến nghị sẽ bị gỡ bỏ; Plugin vẫn dùng chúng sẽ lỗi |

Tất cả Plugin lõi đã được di chuyển. Plugin bên ngoài nên di chuyển
trước bản phát hành chính tiếp theo.

## Tạm thời ẩn cảnh báo

Đặt các biến môi trường này trong khi bạn di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là lối thoát tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Bắt đầu](/vi/plugins/building-plugins) - xây dựng Plugin đầu tiên của bạn
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu đầy đủ về import subpath
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng Plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng Plugin nhà cung cấp
- [Nội bộ Plugin](/vi/plugins/architecture) - tìm hiểu sâu về kiến trúc
- [Manifest của Plugin](/vi/plugins/manifest) - tham chiếu schema manifest
