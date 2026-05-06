---
read_when:
    - Bạn đang xây dựng một Plugin kênh và muốn sử dụng vòng đời lượt đến dùng chung
    - Bạn đang chuyển một trình giám sát kênh ra khỏi lớp mã kết nối ghi/điều phối tự viết
    - Bạn cần hiểu các giai đoạn tiếp nhận, thu nạp, phân loại, kiểm tra sơ bộ, phân giải, ghi nhận, điều phối và hoàn tất
sidebarTitle: Channel turn
summary: runtime.channel.turn -- nhân lõi lượt đến dùng chung mà các Plugin kênh được đóng gói và bên thứ ba dùng để ghi lại, điều phối và hoàn tất các lượt của tác nhân
title: Nhân lượt kênh
x-i18n:
    generated_at: "2026-05-06T09:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Hạt nhân lượt kênh là máy trạng thái đến dùng chung, biến một sự kiện nền tảng đã chuẩn hóa thành một lượt tác tử. Các plugin kênh cung cấp dữ kiện nền tảng và callback gửi. Phần lõi sở hữu việc điều phối: tiếp nhận, phân loại, kiểm tra sơ bộ, phân giải, ủy quyền, lắp ráp, ghi lại, điều phối và hoàn tất.

Dùng phần này khi plugin của bạn nằm trên đường nóng của tin nhắn đến. Với các sự kiện không phải tin nhắn (lệnh gạch chéo, modal, tương tác nút, sự kiện vòng đời, reaction, trạng thái thoại), hãy giữ chúng cục bộ trong plugin. Hạt nhân chỉ sở hữu các sự kiện có thể trở thành một lượt văn bản của tác tử.

<Info>
  Hạt nhân được truy cập thông qua runtime plugin được chèn vào dưới dạng `runtime.channel.turn.*`. Kiểu runtime plugin được xuất từ `openclaw/plugin-sdk/core`, nên plugin gốc của bên thứ ba có thể dùng các điểm vào này giống như các plugin kênh được đóng gói sẵn.
</Info>

## Vì sao cần hạt nhân dùng chung

Các plugin kênh lặp lại cùng một luồng đến: chuẩn hóa, định tuyến, kiểm soát cổng, xây dựng ngữ cảnh, ghi siêu dữ liệu phiên, điều phối lượt tác tử, hoàn tất trạng thái gửi. Không có hạt nhân dùng chung, một thay đổi về kiểm soát nhắc tên, trả lời hiển thị chỉ dành cho công cụ, siêu dữ liệu phiên, lịch sử đang chờ, hoặc hoàn tất điều phối sẽ phải được áp dụng riêng cho từng kênh.

Hạt nhân chủ ý giữ bốn khái niệm tách biệt:

- `ConversationFacts`: tin nhắn đến từ đâu
- `RouteFacts`: tác tử và phiên nào nên xử lý nó
- `ReplyPlanFacts`: các trả lời hiển thị nên đi tới đâu
- `MessageFacts`: tác tử nên thấy nội dung và ngữ cảnh bổ sung nào

DM Slack, chủ đề Telegram, luồng Matrix, và phiên chủ đề Feishu đều phân biệt các phần này trong thực tế. Xem chúng như một định danh duy nhất sẽ gây lệch dần theo thời gian.

## Vòng đời giai đoạn

Hạt nhân chạy cùng một pipeline cố định bất kể kênh:

1. `ingest` -- bộ chuyển đổi biến một sự kiện nền tảng thô thành `NormalizedTurnInput`
2. `classify` -- bộ chuyển đổi khai báo sự kiện này có thể bắt đầu một lượt tác tử hay không
3. `preflight` -- bộ chuyển đổi xử lý chống trùng lặp, tiếng vọng tự thân, hydrate, debounce, giải mã, điền trước một phần dữ kiện
4. `resolve` -- bộ chuyển đổi trả về một lượt đã lắp ráp đầy đủ (định tuyến, kế hoạch trả lời, tin nhắn, gửi)
5. `authorize` -- chính sách DM, nhóm, nhắc tên và lệnh được áp dụng cho các dữ kiện đã lắp ráp
6. `assemble` -- `FinalizedMsgContext` được xây dựng từ các dữ kiện thông qua `buildContext`
7. `record` -- siêu dữ liệu phiên đến và tuyến cuối được lưu bền vững
8. `dispatch` -- lượt tác tử được thực thi thông qua bộ điều phối khối có bộ đệm
9. `finalize` -- `onFinalize` của bộ chuyển đổi chạy ngay cả khi điều phối lỗi

Mỗi giai đoạn phát một sự kiện nhật ký có cấu trúc khi callback `log` được cung cấp. Xem [Khả năng quan sát](#observability).

## Loại tiếp nhận

Hạt nhân không ném lỗi khi một lượt bị chặn. Nó trả về một `ChannelTurnAdmission`:

| Loại          | Khi nào                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Lượt được tiếp nhận. Lượt tác tử chạy và đường trả lời hiển thị được dùng.                                                                   |
| `observeOnly` | Lượt chạy từ đầu đến cuối nhưng bộ chuyển đổi gửi không gửi gì hiển thị. Dùng cho các tác tử quan sát phát sóng và các luồng đa tác tử thụ động khác. |
| `handled`     | Một sự kiện nền tảng đã được xử lý cục bộ (vòng đời, reaction, nút, modal). Hạt nhân bỏ qua điều phối.                                           |
| `drop`        | Đường bỏ qua. Tùy chọn `recordHistory: true` giữ tin nhắn trong lịch sử nhóm đang chờ để một nhắc tên trong tương lai có ngữ cảnh.                      |

Việc tiếp nhận có thể đến từ `classify` (lớp sự kiện nói rằng nó không thể bắt đầu một lượt), từ `preflight` (chống trùng lặp, tiếng vọng tự thân, thiếu nhắc tên với ghi lịch sử), hoặc từ chính `resolveTurn`.

## Điểm vào

Runtime phơi bày ba điểm vào ưu tiên để bộ chuyển đổi có thể tham gia ở mức phù hợp với kênh.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Hai helper runtime cũ hơn vẫn khả dụng để tương thích Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Dùng khi kênh của bạn có thể biểu diễn luồng đến của nó dưới dạng một `ChannelTurnAdapter<TRaw>`. Bộ chuyển đổi có callback cho `ingest`, `classify` tùy chọn, `preflight` tùy chọn, `resolveTurn` bắt buộc, và `onFinalize` tùy chọn.

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

`run` là hình dạng phù hợp khi kênh có logic bộ chuyển đổi nhỏ và hưởng lợi từ việc sở hữu vòng đời thông qua hook.

### runPrepared

Dùng khi kênh có bộ điều phối cục bộ phức tạp với bản xem trước, thử lại, chỉnh sửa, hoặc khởi tạo luồng phải tiếp tục do kênh sở hữu. Hạt nhân vẫn ghi phiên đến trước khi điều phối và bề mặt hóa một `DispatchedChannelTurnResult` thống nhất.

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

Các kênh giàu tính năng (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) dùng `runPrepared` vì bộ điều phối của chúng điều phối hành vi đặc thù nền tảng mà hạt nhân không được học biết.

### buildContext

Một hàm thuần ánh xạ các bó dữ kiện thành `FinalizedMsgContext`. Dùng nó khi kênh của bạn tự viết tay một phần pipeline nhưng muốn hình dạng ngữ cảnh nhất quán.

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
  Các helper SDK đã ngừng khuyến nghị như `dispatchInboundReplyWithBase` vẫn bắc cầu qua một helper lượt đã lắp ráp. Mã plugin mới nên dùng `run` hoặc `runPrepared`.
</Note>

## Kiểu dữ kiện

Các dữ kiện mà hạt nhân tiêu thụ từ bộ chuyển đổi của bạn là bất khả tri nền tảng. Dịch các đối tượng nền tảng thành những hình dạng này trước khi giao chúng cho hạt nhân.

### NormalizedTurnInput

| Trường             | Mục đích                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID tin nhắn ổn định dùng cho chống trùng lặp và nhật ký                                   |
| `timestamp`       | Epoch ms tùy chọn                                                            |
| `rawText`         | Nội dung như nhận được từ nền tảng                                           |
| `textForAgent`    | Nội dung đã làm sạch tùy chọn cho tác tử (bỏ nhắc tên, cắt phần đang gõ)             |
| `textForCommands` | Nội dung tùy chọn dùng để phân tích cú pháp `/command`                                    |
| `raw`             | Tham chiếu truyền xuyên tùy chọn cho các callback bộ chuyển đổi cần bản gốc |

### ChannelEventClass

| Trường                  | Mục đích                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Nếu false, hạt nhân trả về `{ kind: "handled" }`                       |
| `requiresImmediateAck` | Gợi ý cho bộ chuyển đổi cần ACK trước khi điều phối                      |

### SenderFacts

| Trường          | Mục đích                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | ID người gửi nền tảng ổn định                                      |
| `name`         | Tên hiển thị                                                   |
| `username`     | Handle nếu khác với `name`                                 |
| `tag`          | Bộ phân biệt kiểu Discord hoặc thẻ nền tảng                    |
| `roles`        | ID vai trò, dùng để khớp danh sách cho phép theo vai trò thành viên              |
| `isBot`        | Đúng khi người gửi là bot đã biết (hạt nhân dùng để loại bỏ) |
| `isSelf`       | Đúng khi người gửi là chính tác tử đã cấu hình            |
| `displayLabel` | Nhãn đã render sẵn cho văn bản phong bì                           |

### ConversationFacts

| Trường             | Mục đích                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, hoặc `channel`                                      |
| `id`              | ID cuộc hội thoại dùng để định tuyến                                     |
| `label`           | Nhãn con người cho phong bì                                         |
| `spaceId`         | Định danh không gian ngoài tùy chọn (không gian làm việc Slack, homeserver Matrix) |
| `parentId`        | ID cuộc hội thoại ngoài khi đây là một luồng                          |
| `threadId`        | ID luồng khi tin nhắn này nằm trong một luồng                       |
| `nativeChannelId` | ID kênh gốc nền tảng khi khác với ID định tuyến        |
| `routePeer`       | Peer dùng cho tra cứu `resolveAgentRoute`                             |

### RouteFacts

| Trường                   | Mục đích                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Tác tử nên xử lý lượt này                         |
| `accountId`             | Ghi đè tùy chọn (kênh nhiều tài khoản)                 |
| `routeSessionKey`       | Khóa phiên dùng để định tuyến                               |
| `dispatchSessionKey`    | Khóa phiên dùng khi điều phối nếu khác với khóa định tuyến |
| `persistedSessionKey`   | Khóa phiên được ghi vào siêu dữ liệu phiên lưu bền vững          |
| `parentSessionKey`      | Cha cho các phiên phân nhánh/theo luồng                      |
| `modelParentSessionKey` | Cha phía mô hình cho các phiên phân nhánh                    |
| `mainSessionKey`        | Ghim chủ sở hữu DM chính cho các cuộc hội thoại trực tiếp                 |
| `createIfMissing`       | Cho phép bước ghi tạo một hàng phiên bị thiếu          |

### ReplyPlanFacts

| Trường                    | Mục đích                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Mục tiêu phản hồi logic được ghi vào ngữ cảnh `To`      |
| `originatingTo`           | Mục tiêu ngữ cảnh khởi nguồn (`OriginatingTo`)          |
| `nativeChannelId`         | Id kênh gốc nền tảng để phân phối                       |
| `replyTarget`             | Đích phản hồi hiển thị cuối cùng nếu khác với `to`      |
| `deliveryTarget`          | Ghi đè phân phối cấp thấp hơn                           |
| `replyToId`               | Id thông điệp được trích dẫn/neo                        |
| `replyToIdFull`           | Id trích dẫn dạng đầy đủ khi nền tảng có cả hai         |
| `messageThreadId`         | Id luồng tại thời điểm phân phối                        |
| `threadParentId`          | Id thông điệp cha của luồng                             |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, hoặc `none`     |

### AccessFacts

`AccessFacts` mang các boolean mà giai đoạn cấp quyền cần. Việc khớp danh tính vẫn nằm trong kênh: kernel chỉ tiêu thụ kết quả.

| Trường     | Mục đích                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Quyết định cho phép/ghép nối/từ chối DM và danh sách `allowFrom`          |
| `group`    | Chính sách nhóm, cho phép tuyến, cho phép người gửi, allowlist, yêu cầu nhắc đến |
| `commands` | Cấp quyền lệnh trên các bộ cấp quyền đã cấu hình                          |
| `mentions` | Việc phát hiện nhắc đến có khả thi hay không và tác tử có được nhắc đến hay không |

### MessageFacts

| Trường           | Mục đích                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Nội dung envelope cuối cùng (đã định dạng)                     |
| `rawBody`        | Nội dung thô nhận vào                                          |
| `bodyForAgent`   | Nội dung tác tử nhìn thấy                                      |
| `commandBody`    | Nội dung dùng để phân tích lệnh                                |
| `envelopeFrom`   | Nhãn người gửi đã kết xuất sẵn cho envelope                    |
| `senderLabel`    | Ghi đè tùy chọn cho người gửi đã kết xuất                      |
| `preview`        | Bản xem trước ngắn đã biên tập cho nhật ký                     |
| `inboundHistory` | Các mục lịch sử nhận vào gần đây khi kênh giữ bộ đệm           |

### SupplementalContextFacts

Ngữ cảnh bổ sung bao gồm ngữ cảnh trích dẫn, chuyển tiếp và khởi tạo luồng. Kernel áp dụng chính sách `contextVisibility` đã cấu hình. Bộ chuyển đổi kênh chỉ cung cấp các fact và cờ `senderAllowed` để chính sách xuyên kênh luôn nhất quán.

### InboundMediaFacts

Media có dạng fact. Tải xuống trên nền tảng, xác thực, chính sách SSRF, quy tắc CDN và giải mã vẫn nằm cục bộ trong kênh. Kernel ánh xạ các fact vào `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` và `MediaTranscribedIndexes`.

## Hợp đồng bộ chuyển đổi

Với `run` đầy đủ, hình dạng bộ chuyển đổi là:

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

`resolveTurn` trả về một `ChannelTurnResolved`, tức là một `AssembledChannelTurn` có loại admission tùy chọn. Trả về `{ admission: { kind: "observeOnly" } }` chạy lượt mà không tạo đầu ra hiển thị. Bộ chuyển đổi vẫn sở hữu callback phân phối; nó chỉ trở thành thao tác không làm gì cho lượt đó.

`onFinalize` chạy trên mọi kết quả, bao gồm cả lỗi điều phối. Dùng nó để xóa lịch sử nhóm đang chờ, gỡ các phản ứng xác nhận, dừng chỉ báo trạng thái và flush trạng thái cục bộ.

## Bộ chuyển đổi phân phối

Kernel không gọi trực tiếp nền tảng. Kênh trao cho kernel một `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` được gọi một lần cho mỗi đoạn phản hồi được đệm. Trong quá trình di trú vòng đời thông điệp, phân phối lượt kênh đã lắp ráp mặc định do kênh sở hữu: trường `durable` bị bỏ qua nghĩa là kernel phải gọi trực tiếp `deliver` và không được định tuyến qua phân phối gửi ra chung. Chỉ đặt `durable` sau khi kênh đã được kiểm tra để chứng minh đường gửi chung giữ nguyên hành vi phân phối cũ, bao gồm mục tiêu phản hồi/luồng, xử lý media, bộ nhớ đệm thông điệp đã gửi/self-echo, dọn dẹp trạng thái và các id thông điệp được trả về. `durable: false` vẫn là cách viết tương thích cho "dùng callback do kênh sở hữu", nhưng các kênh chưa di trú không cần thêm nó. Trả về id thông điệp nền tảng khi kênh có chúng để bộ điều phối có thể giữ các neo luồng và chỉnh sửa các đoạn sau; các đường phân phối mới hơn cũng nên trả về `receipt` để khôi phục, hoàn tất bản xem trước và khử trùng lặp có thể chuyển khỏi `messageIds`. Với các lượt chỉ quan sát, trả về `{ visibleReplySent: false }` hoặc dùng `createNoopChannelTurnDeliveryAdapter()`.

Các kênh dùng `runPrepared` với một bộ điều phối hoàn toàn do kênh sở hữu không có `ChannelTurnDeliveryAdapter`. Các bộ điều phối đó mặc định không bền vững. Chúng nên giữ đường phân phối trực tiếp cho đến khi chủ động chọn dùng ngữ cảnh gửi mới với mục tiêu đầy đủ, bộ chuyển đổi an toàn khi phát lại, hợp đồng biên nhận và các hook hiệu ứng phụ phía kênh.

Các helper tương thích công khai như `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` và helper direct-DM phải giữ nguyên hành vi trong quá trình di trú. Chúng không được gọi phân phối bền vững chung trước các callback `deliver` hoặc `reply` do bên gọi sở hữu.

## Tùy chọn ghi

Giai đoạn ghi bọc `recordInboundSession`. Hầu hết kênh có thể dùng các mặc định. Ghi đè qua `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Bộ điều phối chờ giai đoạn ghi. Nếu ghi ném lỗi, kernel chạy `onPreDispatchFailure` (khi được cung cấp cho `runPrepared`) rồi ném lại.

## Khả năng quan sát

Mỗi giai đoạn phát ra một sự kiện có cấu trúc khi callback `log` được cung cấp:

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

Các giai đoạn được ghi nhật ký: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Tránh ghi nhật ký nội dung thô; dùng `MessageFacts.preview` cho bản xem trước ngắn đã biên tập.

## Những gì vẫn nằm cục bộ trong kênh

Kernel sở hữu việc điều phối. Kênh vẫn sở hữu:

- Truyền tải nền tảng (Gateway, REST, websocket, polling, Webhook)
- Phân giải danh tính và khớp tên hiển thị
- Lệnh gốc, lệnh slash, tự động hoàn thành, modal, nút, trạng thái giọng nói
- Kết xuất thẻ, modal và adaptive-card
- Xác thực media, quy tắc CDN, media mã hóa, phiên âm
- API chỉnh sửa, phản ứng, biên tập và hiện diện
- Backfill và lấy lịch sử phía nền tảng
- Luồng ghép nối cần xác minh đặc thù nền tảng

Nếu hai kênh bắt đầu cần cùng một helper cho một trong các việc này, hãy trích xuất helper SDK dùng chung thay vì đẩy nó vào kernel.

## Tính ổn định

`runtime.channel.turn.*` là một phần của bề mặt runtime Plugin công khai. Các loại fact (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) và hình dạng admission (`ChannelTurnAdmission`, `ChannelEventClass`) có thể được truy cập qua `PluginRuntime` từ `openclaw/plugin-sdk/core`.

Áp dụng các quy tắc tương thích ngược: trường fact mới mang tính bổ sung, loại admission không bị đổi tên, và tên điểm vào luôn ổn định. Nhu cầu kênh mới cần thay đổi không mang tính bổ sung phải đi qua quy trình di trú SDK Plugin.

## Liên quan

- [Tái cấu trúc vòng đời thông điệp](/vi/concepts/message-lifecycle-refactor) cho vòng đời gửi/nhận/live theo kế hoạch sẽ bọc kernel này
- [Xây dựng Plugin kênh](/vi/plugins/sdk-channel-plugins) cho hợp đồng Plugin kênh rộng hơn
- [Helper runtime Plugin](/vi/plugins/sdk-runtime) cho các bề mặt `runtime.*` khác
- [Nội bộ Plugin](/vi/plugins/architecture-internals) cho pipeline tải và cơ chế registry
