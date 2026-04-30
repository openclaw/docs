---
read_when:
    - Bạn đang xây dựng một Plugin kênh và muốn có vòng đời lượt đến dùng chung
    - Bạn đang chuyển trình giám sát kênh khỏi lớp mã kết nối ghi/điều phối tự viết thủ công
    - Bạn cần hiểu các giai đoạn tiếp nhận, nạp vào, phân loại, kiểm tra trước, phân giải, ghi nhận, điều phối và hoàn tất.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- nhân xử lý lượt đến dùng chung mà các Plugin kênh tích hợp sẵn và bên thứ ba sử dụng để ghi lại, điều phối và hoàn tất các lượt của tác tử
title: Nhân lượt kênh
x-i18n:
    generated_at: "2026-04-30T09:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Nhân lượt kênh là máy trạng thái đầu vào dùng chung, biến một sự kiện nền tảng đã chuẩn hóa thành một lượt tác tử. Các Plugin kênh cung cấp các dữ kiện nền tảng và callback phân phối. Core sở hữu phần điều phối: nạp vào, phân loại, kiểm tra sơ bộ, phân giải, cấp quyền, lắp ráp, ghi lại, điều phối và hoàn tất.

Dùng phần này khi Plugin của bạn nằm trên đường nóng của thông điệp đầu vào. Với các sự kiện không phải thông điệp (lệnh slash, modal, tương tác nút, sự kiện vòng đời, reaction, trạng thái thoại), hãy giữ chúng cục bộ trong Plugin. Nhân chỉ sở hữu các sự kiện có thể trở thành một lượt văn bản của tác tử.

<Info>
  Có thể truy cập nhân thông qua runtime Plugin được tiêm dưới dạng `runtime.channel.turn.*`. Kiểu runtime Plugin được xuất từ `openclaw/plugin-sdk/core`, nên các Plugin native của bên thứ ba có thể dùng những điểm vào này giống như các Plugin kênh đi kèm.
</Info>

## Vì sao cần nhân dùng chung

Các Plugin kênh lặp lại cùng một luồng đầu vào: chuẩn hóa, định tuyến, kiểm soát cổng, xây dựng ngữ cảnh, ghi siêu dữ liệu phiên, điều phối lượt tác tử, hoàn tất trạng thái phân phối. Nếu không có nhân dùng chung, một thay đổi đối với kiểm soát đề cập, phản hồi hiển thị chỉ dùng công cụ, siêu dữ liệu phiên, lịch sử đang chờ hoặc hoàn tất điều phối phải được áp dụng riêng cho từng kênh.

Nhân cố ý giữ bốn khái niệm tách biệt:

- `ConversationFacts`: thông điệp đến từ đâu
- `RouteFacts`: tác tử và phiên nào nên xử lý nó
- `ReplyPlanFacts`: phản hồi hiển thị nên được gửi tới đâu
- `MessageFacts`: nội dung và ngữ cảnh bổ sung nào tác tử nên thấy

DM Slack, chủ đề Telegram, luồng Matrix và phiên chủ đề Feishu đều phân biệt các khái niệm này trong thực tế. Xem chúng như một định danh duy nhất sẽ gây lệch dần theo thời gian.

## Vòng đời giai đoạn

Nhân chạy cùng một pipeline cố định bất kể kênh:

1. `ingest` -- adapter chuyển đổi sự kiện nền tảng thô thành `NormalizedTurnInput`
2. `classify` -- adapter khai báo liệu sự kiện này có thể bắt đầu một lượt tác tử hay không
3. `preflight` -- adapter thực hiện chống trùng lặp, tự vọng lại, hydrat hóa, debounce, giải mã, điền trước một phần dữ kiện
4. `resolve` -- adapter trả về một lượt đã lắp ráp đầy đủ (định tuyến, kế hoạch phản hồi, thông điệp, phân phối)
5. `authorize` -- chính sách DM, nhóm, đề cập và lệnh được áp dụng cho các dữ kiện đã lắp ráp
6. `assemble` -- `FinalizedMsgContext` được xây dựng từ các dữ kiện thông qua `buildContext`
7. `record` -- siêu dữ liệu phiên đầu vào và tuyến cuối cùng được lưu bền vững
8. `dispatch` -- lượt tác tử được thực thi thông qua bộ điều phối khối có đệm
9. `finalize` -- `onFinalize` của adapter chạy ngay cả khi điều phối gặp lỗi

Mỗi giai đoạn phát ra một sự kiện log có cấu trúc khi callback `log` được cung cấp. Xem [Khả năng quan sát](#observability).

## Loại tiếp nhận

Nhân không ném lỗi khi một lượt bị chặn. Nó trả về một `ChannelTurnAdmission`:

| Loại          | Khi nào                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Lượt được tiếp nhận. Lượt tác tử chạy và đường phản hồi hiển thị được thực thi.                                                                   |
| `observeOnly` | Lượt chạy từ đầu đến cuối nhưng adapter phân phối không gửi gì hiển thị. Dùng cho các tác tử quan sát broadcast và các luồng đa tác tử thụ động khác. |
| `handled`     | Một sự kiện nền tảng đã được xử lý cục bộ (vòng đời, reaction, nút, modal). Nhân bỏ qua điều phối.                                           |
| `drop`        | Đường bỏ qua. Tùy chọn `recordHistory: true` giữ thông điệp trong lịch sử nhóm đang chờ để một đề cập trong tương lai có ngữ cảnh.                      |

Việc tiếp nhận có thể đến từ `classify` (lớp sự kiện nói rằng nó không thể bắt đầu một lượt), từ `preflight` (chống trùng lặp, tự vọng lại, thiếu đề cập kèm ghi lịch sử), hoặc từ chính `resolveTurn`.

## Điểm vào

Runtime cung cấp ba điểm vào được ưu tiên để adapter có thể chọn tham gia ở mức phù hợp với kênh.

```typescript
runtime.channel.turn.run(...)             // pipeline đầy đủ do adapter điều khiển
runtime.channel.turn.runPrepared(...)     // kênh sở hữu điều phối; nhân chạy ghi lại + hoàn tất
runtime.channel.turn.buildContext(...)    // ánh xạ thuần dữ kiện sang FinalizedMsgContext
```

Hai helper runtime cũ hơn vẫn còn khả dụng để tương thích Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // bí danh tương thích đã lỗi thời; ưu tiên run
runtime.channel.turn.dispatchAssembled(...) // bí danh tương thích đã lỗi thời; ưu tiên run hoặc runPrepared
```

### run

Dùng khi kênh của bạn có thể biểu diễn luồng đầu vào dưới dạng `ChannelTurnAdapter<TRaw>`. Adapter có các callback cho `ingest`, `classify` tùy chọn, `preflight` tùy chọn, `resolveTurn` bắt buộc và `onFinalize` tùy chọn.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` là hình dạng phù hợp khi kênh có logic adapter nhỏ và hưởng lợi từ việc sở hữu vòng đời thông qua các hook.

### runPrepared

Dùng khi kênh có một bộ điều phối cục bộ phức tạp với bản xem trước, thử lại, chỉnh sửa hoặc khởi tạo luồng phải tiếp tục thuộc quyền sở hữu của kênh. Nhân vẫn ghi phiên đầu vào trước khi điều phối và hiển thị một `DispatchedChannelTurnResult` thống nhất.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Các kênh giàu chức năng (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) dùng `runPrepared` vì bộ điều phối của chúng điều phối hành vi đặc thù nền tảng mà nhân không được cần biết.

### buildContext

Một hàm thuần ánh xạ các gói dữ kiện thành `FinalizedMsgContext`. Dùng nó khi kênh của bạn tự viết một phần pipeline nhưng muốn hình dạng ngữ cảnh nhất quán.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` cũng hữu ích bên trong các callback `resolveTurn` khi lắp ráp một lượt cho `run`.

<Note>
  Các helper SDK đã lỗi thời như `dispatchInboundReplyWithBase` vẫn bắc cầu qua một helper lượt đã lắp ráp. Mã Plugin mới nên dùng `run` hoặc `runPrepared`.
</Note>

## Kiểu dữ kiện

Các dữ kiện mà nhân tiêu thụ từ adapter của bạn là bất khả tri nền tảng. Chuyển đổi các đối tượng nền tảng thành những hình dạng này trước khi giao chúng cho nhân.

### NormalizedTurnInput

| Trường             | Mục đích                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID thông điệp ổn định dùng cho chống trùng lặp và log                                   |
| `timestamp`       | Epoch ms tùy chọn                                                            |
| `rawText`         | Nội dung như nhận từ nền tảng                                           |
| `textForAgent`    | Nội dung đã làm sạch tùy chọn cho tác tử (loại đề cập, cắt ký tự nhập)             |
| `textForCommands` | Nội dung tùy chọn dùng cho phân tích cú pháp `/command`                                    |
| `raw`             | Tham chiếu chuyển tiếp tùy chọn cho các callback adapter cần bản gốc |

### ChannelEventClass

| Trường                  | Mục đích                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Nếu false, nhân trả về `{ kind: "handled" }`                       |
| `requiresImmediateAck` | Gợi ý cho adapter cần ACK trước khi điều phối                      |

### SenderFacts

| Trường          | Mục đích                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | ID người gửi ổn định của nền tảng                                      |
| `name`         | Tên hiển thị                                                   |
| `username`     | Handle nếu khác với `name`                                 |
| `tag`          | Bộ phân biệt kiểu Discord hoặc thẻ nền tảng                    |
| `roles`        | ID vai trò, dùng để khớp allowlist vai trò thành viên              |
| `isBot`        | True khi người gửi là bot đã biết (nhân dùng để loại bỏ) |
| `isSelf`       | True khi người gửi là chính tác tử đã cấu hình            |
| `displayLabel` | Nhãn đã render sẵn cho văn bản phong bì                           |

### ConversationFacts

| Trường             | Mục đích                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, hoặc `channel`                                      |
| `id`              | ID cuộc trò chuyện dùng cho định tuyến                                     |
| `label`           | Nhãn người đọc được cho phong bì                                         |
| `spaceId`         | Định danh không gian ngoài tùy chọn (workspace Slack, homeserver Matrix) |
| `parentId`        | ID cuộc trò chuyện ngoài khi đây là một luồng                          |
| `threadId`        | ID luồng khi thông điệp này nằm trong một luồng                       |
| `nativeChannelId` | ID kênh native của nền tảng khi khác với ID định tuyến        |
| `routePeer`       | Peer dùng cho tra cứu `resolveAgentRoute`                             |

### RouteFacts

| Trường                   | Mục đích                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Tác tử nên xử lý lượt này                         |
| `accountId`             | Ghi đè tùy chọn (kênh nhiều tài khoản)                 |
| `routeSessionKey`       | Khóa phiên dùng cho định tuyến                               |
| `dispatchSessionKey`    | Khóa phiên dùng khi điều phối nếu khác với khóa định tuyến |
| `persistedSessionKey`   | Khóa phiên được ghi vào siêu dữ liệu phiên lưu bền vững          |
| `parentSessionKey`      | Phiên cha cho các phiên phân nhánh/theo luồng                      |
| `modelParentSessionKey` | Phiên cha phía mô hình cho các phiên phân nhánh                    |
| `mainSessionKey`        | Ghim chủ sở hữu DM chính cho cuộc trò chuyện trực tiếp                 |
| `createIfMissing`       | Cho phép bước ghi tạo một hàng phiên bị thiếu          |

### ReplyPlanFacts

| Trường                    | Mục đích                                                     |
| ------------------------- | ------------------------------------------------------------ |
| `to`                      | Đích trả lời logic được ghi vào ngữ cảnh `To`                |
| `originatingTo`           | Đích ngữ cảnh gốc (`OriginatingTo`)                          |
| `nativeChannelId`         | Id kênh gốc của nền tảng để gửi                              |
| `replyTarget`             | Đích trả lời hiển thị cuối cùng nếu khác với `to`            |
| `deliveryTarget`          | Ghi đè gửi ở cấp thấp hơn                                    |
| `replyToId`               | Id tin nhắn được trích dẫn/neo                               |
| `replyToIdFull`           | Id trích dẫn dạng đầy đủ khi nền tảng có cả hai              |
| `messageThreadId`         | Id luồng tại thời điểm gửi                                   |
| `threadParentId`          | Id tin nhắn cha của luồng                                    |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, hoặc `none`          |

### AccessFacts

`AccessFacts` mang các giá trị boolean mà giai đoạn authorize cần. Việc khớp danh tính nằm trong kênh: kernel chỉ tiêu thụ kết quả.

| Trường     | Mục đích                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `dm`       | Quyết định cho phép/ghép nối/từ chối DM và danh sách `allowFrom`            |
| `group`    | Chính sách nhóm, cho phép định tuyến, cho phép người gửi, allowlist, yêu cầu nhắc đến |
| `commands` | Ủy quyền lệnh trên các trình ủy quyền đã cấu hình                           |
| `mentions` | Liệu có thể phát hiện nhắc đến hay không và liệu agent đã được nhắc đến hay chưa |

### MessageFacts

| Trường           | Mục đích                                                         |
| ---------------- | --------------------------------------------------------------- |
| `body`           | Nội dung envelope cuối cùng (đã định dạng)                      |
| `rawBody`        | Nội dung thô đi vào                                             |
| `bodyForAgent`   | Nội dung agent nhìn thấy                                        |
| `commandBody`    | Nội dung dùng để phân tích cú pháp lệnh                         |
| `envelopeFrom`   | Nhãn người gửi đã render sẵn cho envelope                       |
| `senderLabel`    | Ghi đè tùy chọn cho người gửi đã render                         |
| `preview`        | Bản xem trước ngắn đã biên tập cho log                          |
| `inboundHistory` | Các mục lịch sử đi vào gần đây khi kênh duy trì bộ đệm          |

### SupplementalContextFacts

Ngữ cảnh bổ sung bao gồm ngữ cảnh trích dẫn, chuyển tiếp và khởi tạo luồng. Kernel áp dụng chính sách `contextVisibility` đã cấu hình. Bộ chuyển đổi kênh chỉ cung cấp facts và cờ `senderAllowed` để chính sách liên kênh luôn nhất quán.

### InboundMediaFacts

Media có dạng fact. Việc tải xuống nền tảng, xác thực, chính sách SSRF, quy tắc CDN và giải mã vẫn nằm cục bộ trong kênh. Kernel ánh xạ facts vào `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` và `MediaTranscribedIndexes`.

## Hợp đồng bộ chuyển đổi

Đối với `run` đầy đủ, dạng của bộ chuyển đổi là:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` trả về một `ChannelTurnResolved`, tức là một `AssembledChannelTurn` với loại admission tùy chọn. Trả về `{ admission: { kind: "observeOnly" } }` sẽ chạy lượt mà không tạo đầu ra hiển thị. Bộ chuyển đổi vẫn sở hữu callback gửi; nó chỉ trở thành no-op cho lượt đó.

`onFinalize` chạy trên mọi kết quả, bao gồm cả lỗi dispatch. Dùng nó để xóa lịch sử nhóm đang chờ, gỡ phản ứng ack, dừng chỉ báo trạng thái và flush trạng thái cục bộ.

## Bộ chuyển đổi gửi

Kernel không gọi trực tiếp nền tảng. Kênh trao cho kernel một `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` được gọi một lần cho mỗi phần trả lời đã đệm. Trả về id tin nhắn của nền tảng khi kênh có chúng để dispatcher có thể giữ neo luồng và chỉnh sửa các phần sau. Đối với lượt chỉ quan sát, trả về `{ visibleReplySent: false }` hoặc dùng `createNoopChannelTurnDeliveryAdapter()`.

## Tùy chọn ghi

Giai đoạn ghi bọc `recordInboundSession`. Hầu hết các kênh có thể dùng mặc định. Ghi đè qua `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Dispatcher chờ giai đoạn ghi. Nếu ghi ném lỗi, kernel chạy `onPreDispatchFailure` (khi được cung cấp cho `runPrepared`) rồi ném lại.

## Khả năng quan sát

Mỗi giai đoạn phát một sự kiện có cấu trúc khi callback `log` được cung cấp:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Các giai đoạn được log: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Tránh log nội dung thô; dùng `MessageFacts.preview` cho các bản xem trước ngắn đã biên tập.

## Những gì vẫn nằm cục bộ trong kênh

Kernel sở hữu việc điều phối. Kênh vẫn sở hữu:

- Transport nền tảng (Gateway, REST, websocket, polling, webhooks)
- Phân giải danh tính và khớp tên hiển thị
- Lệnh gốc, lệnh slash, tự động hoàn thành, modal, nút, trạng thái thoại
- Render thẻ, modal và adaptive-card
- Xác thực media, quy tắc CDN, media mã hóa, phiên âm
- API chỉnh sửa, phản ứng, biên tập và hiện diện
- Backfill và lấy lịch sử phía nền tảng
- Luồng ghép nối yêu cầu xác minh riêng theo nền tảng

Nếu hai kênh bắt đầu cần cùng một helper cho một trong các việc này, hãy trích xuất helper SDK dùng chung thay vì đẩy nó vào kernel.

## Độ ổn định

`runtime.channel.turn.*` là một phần của bề mặt runtime Plugin công khai. Các kiểu fact (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) và các dạng admission (`ChannelTurnAdmission`, `ChannelEventClass`) có thể truy cập qua `PluginRuntime` từ `openclaw/plugin-sdk/core`.

Áp dụng các quy tắc tương thích ngược: trường fact mới là bổ sung, loại admission không được đổi tên, và tên entry point luôn ổn định. Nhu cầu kênh mới yêu cầu thay đổi không mang tính bổ sung phải đi qua quy trình di trú SDK Plugin.

## Liên quan

- [Xây dựng plugin kênh](/vi/plugins/sdk-channel-plugins) cho hợp đồng plugin kênh rộng hơn
- [Helper runtime Plugin](/vi/plugins/sdk-runtime) cho các bề mặt `runtime.*` khác
- [Nội bộ Plugin](/vi/plugins/architecture-internals) cho pipeline tải và cơ chế registry
