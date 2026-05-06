---
read_when:
    - Tái cấu trúc hành vi gửi hoặc nhận của kênh
    - Thay đổi lượt kênh, điều phối phản hồi, hàng đợi gửi đi, truyền phát bản xem trước hoặc API thông điệp SDK Plugin
    - Thiết kế một plugin kênh mới cần khả năng gửi bền vững, biên nhận, bản xem trước, chỉnh sửa hoặc thử lại
summary: Kế hoạch thiết kế cho vòng đời thống nhất và bền vững của việc nhận, gửi, xem trước, chỉnh sửa và truyền trực tuyến tin nhắn
title: Tái cấu trúc vòng đời thông điệp
x-i18n:
    generated_at: "2026-05-06T09:08:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Trang này là thiết kế mục tiêu để thay thế các helper rải rác về lượt kênh, điều phối trả lời,
truyền phát xem trước và gửi ra ngoài bằng một vòng đời
tin nhắn bền vững duy nhất.

Phiên bản ngắn gọn:

- Các nguyên thủy lõi nên là **nhận** và **gửi**, không phải **trả lời**.
- Một trả lời chỉ là một quan hệ trên tin nhắn gửi ra ngoài.
- Một lượt là tiện ích xử lý đầu vào, không phải chủ thể sở hữu việc gửi.
- Việc gửi phải dựa trên ngữ cảnh: `begin`, kết xuất, xem trước hoặc truyền phát, gửi cuối cùng,
  ghi nhận, thất bại.
- Việc nhận cũng phải dựa trên ngữ cảnh: chuẩn hóa, khử trùng lặp, định tuyến, ghi lại,
  điều phối, xác nhận nền tảng, thất bại.
- SDK Plugin công khai nên thu gọn thành một bề mặt tin nhắn kênh nhỏ.

## Vấn đề

Ngăn xếp kênh hiện tại phát triển từ nhiều nhu cầu cục bộ hợp lệ:

- Các adapter đầu vào đơn giản dùng `runtime.channel.turn.run`.
- Các adapter phong phú dùng `runtime.channel.turn.runPrepared`.
- Các helper cũ dùng `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper payload trả lời, chia khúc trả lời,
  tham chiếu trả lời và helper runtime đầu ra.
- Truyền phát xem trước nằm trong các dispatcher riêng theo kênh.
- Độ bền của gửi cuối cùng đang được bổ sung quanh các đường dẫn payload trả lời hiện có.

Hình dạng đó sửa được các lỗi cục bộ, nhưng khiến OpenClaw có quá nhiều
khái niệm công khai và quá nhiều nơi mà ngữ nghĩa gửi có thể lệch nhau.

Vấn đề độ tin cậy làm lộ ra điều này là:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Bất biến mục tiêu rộng hơn Telegram: một khi lõi quyết định rằng một
tin nhắn gửi ra ngoài có thể nhìn thấy phải tồn tại, ý định đó phải bền vững trước khi thử
gửi qua nền tảng, và biên nhận nền tảng phải được ghi nhận sau khi thành công.
Điều đó cho OpenClaw khả năng khôi phục ít nhất một lần. Hành vi đúng một lần chỉ tồn tại
cho các adapter có thể chứng minh tính bất biến theo id gốc hoặc đối soát một
lần thử không rõ sau khi gửi với trạng thái nền tảng trước khi phát lại.

Đó là trạng thái kết thúc của lần tái cấu trúc này, không phải mô tả của mọi
đường dẫn hiện tại. Trong quá trình di trú, các helper đầu ra hiện có vẫn có thể rơi về
gửi trực tiếp khi ghi hàng đợi theo nỗ lực tốt nhất thất bại. Lần tái cấu trúc chỉ hoàn tất
khi các lần gửi cuối cùng bền vững đóng khi thất bại hoặc chọn không tham gia rõ ràng bằng một
chính sách không bền vững được ghi lại.

## Mục tiêu

- Một vòng đời lõi cho tất cả đường dẫn nhận và gửi tin nhắn kênh.
- Gửi cuối cùng bền vững theo mặc định trong vòng đời tin nhắn mới sau khi adapter
  khai báo hành vi an toàn khi phát lại.
- Ngữ nghĩa dùng chung cho xem trước, chỉnh sửa, truyền phát, hoàn tất, thử lại, khôi phục và biên nhận.
- Một bề mặt SDK Plugin nhỏ mà Plugin bên thứ ba có thể học và bảo trì.
- Tương thích cho các bên gọi `channel.turn` hiện có trong quá trình di trú.
- Điểm mở rộng rõ ràng cho năng lực kênh mới.
- Không có nhánh riêng theo nền tảng trong lõi.
- Không có tin nhắn kênh delta token. Truyền phát kênh vẫn là xem trước tin nhắn,
  chỉnh sửa, nối thêm hoặc gửi khối đã hoàn tất.
- Metadata có cấu trúc do OpenClaw khởi tạo cho đầu ra vận hành/hệ thống để các
  lỗi Gateway hiển thị không vào lại các phòng dùng bot chung dưới dạng prompt mới.

## Không phải mục tiêu

- Không xóa `runtime.channel.turn.*` trong giai đoạn đầu.
- Không ép mọi kênh vào cùng một hành vi transport gốc.
- Không dạy lõi về chủ đề Telegram, stream gốc của Slack, biên tập xóa Matrix,
  thẻ Feishu, giọng nói QQ hoặc hoạt động Teams.
- Không xuất bản tất cả helper di trú nội bộ dưới dạng API SDK ổn định.
- Không để việc thử lại phát lại các thao tác nền tảng không bất biến đã hoàn tất.

## Mô hình tham chiếu

Vercel Chat có một mô hình tư duy công khai tốt:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- các phương thức adapter như `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` và lấy lịch sử
- một adapter trạng thái cho khử trùng lặp, khóa, hàng đợi và lưu bền vững

OpenClaw nên mượn vốn từ vựng, không sao chép bề mặt.

Những gì OpenClaw cần ngoài mô hình đó:

- Ý định gửi đầu ra bền vững trước các lệnh gọi transport trực tiếp.
- Ngữ cảnh gửi tường minh với begin, commit và fail.
- Ngữ cảnh nhận biết chính sách xác nhận nền tảng.
- Biên nhận sống sót qua khởi động lại và có thể dẫn dắt chỉnh sửa, xóa, khôi phục và
  chặn trùng lặp.
- Một SDK công khai nhỏ hơn. Các Plugin đi kèm có thể dùng helper runtime nội bộ, nhưng
  Plugin bên thứ ba nên thấy một API tin nhắn mạch lạc duy nhất.
- Hành vi theo agent: phiên, bản ghi hội thoại, truyền phát khối, tiến độ công cụ,
  phê duyệt, chỉ thị media, trả lời im lặng và lịch sử nhắc đến trong nhóm.

Các promise kiểu `thread.post()` là chưa đủ cho OpenClaw. Chúng che giấu
ranh giới giao dịch quyết định liệu một lần gửi có thể khôi phục được hay không.

## Mô hình lõi

Miền mới nên nằm dưới một namespace lõi nội bộ như
`src/channels/message/*`.

Nó có bốn khái niệm:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` sở hữu vòng đời đầu vào.

`send` sở hữu vòng đời đầu ra.

`live` sở hữu trạng thái xem trước, chỉnh sửa, tiến độ và truyền phát.

`state` sở hữu lưu trữ ý định bền vững, biên nhận, tính bất biến theo id, khôi phục, khóa và
khử trùng lặp.

## Thuật ngữ về tin nhắn

### Tin nhắn

Một tin nhắn đã chuẩn hóa là trung lập với nền tảng:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Đích

Đích mô tả nơi tin nhắn tồn tại:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Quan hệ

Trả lời là một quan hệ, không phải một gốc API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Điều này cho phép cùng một đường dẫn gửi xử lý trả lời thông thường, thông báo Cron, prompt
phê duyệt, hoàn tất tác vụ, gửi bằng message-tool, gửi từ CLI hoặc Control UI, kết quả subagent
và gửi tự động hóa.

### Nguồn gốc

Nguồn gốc mô tả ai đã tạo ra một tin nhắn và OpenClaw nên xử lý các tiếng vọng của
tin nhắn đó như thế nào. Nó tách biệt với quan hệ: một tin nhắn có thể là trả lời cho người dùng
và vẫn là đầu ra vận hành do OpenClaw khởi tạo.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

Lõi sở hữu ý nghĩa của đầu ra do OpenClaw khởi tạo. Kênh sở hữu cách
nguồn gốc đó được mã hóa vào transport của chúng.

Cách dùng bắt buộc đầu tiên là đầu ra lỗi Gateway. Con người vẫn nên thấy
các tin nhắn như "Agent failed before reply" hoặc "Missing API key", nhưng đầu ra
vận hành OpenClaw được gắn thẻ không được chấp nhận như đầu vào do bot viết trong các phòng chung
khi `allowBots` được bật.

### Biên nhận

Biên nhận là thực thể hạng nhất:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Biên nhận là cầu nối từ ý định bền vững đến chỉnh sửa tương lai, xóa, hoàn tất xem trước,
chặn trùng lặp và khôi phục.

Một biên nhận có thể mô tả một tin nhắn nền tảng hoặc một lần gửi nhiều phần. Văn bản chia khúc,
media kèm văn bản, giọng nói kèm văn bản và fallback thẻ phải giữ tất cả
id nền tảng trong khi vẫn phơi bày một id chính cho phân luồng và chỉnh sửa sau này.

## Ngữ cảnh nhận

Việc nhận không nên là một lời gọi helper trần. Lõi cần một ngữ cảnh biết
khử trùng lặp, định tuyến, ghi phiên và chính sách xác nhận nền tảng.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Luồng nhận:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Xác nhận không phải chỉ có một loại. Hợp đồng nhận phải giữ các tín hiệu này tách biệt:

- **Xác nhận transport:** cho webhook hoặc socket của nền tảng biết rằng OpenClaw đã chấp nhận
  phong bì sự kiện. Một số nền tảng yêu cầu điều này trước khi điều phối.
- **Xác nhận offset polling:** tiến một con trỏ để cùng sự kiện không bị lấy lại.
  Điều này không được tiến qua công việc không thể khôi phục.
- **Xác nhận bản ghi đầu vào:** xác nhận OpenClaw đã lưu bền vững đủ metadata đầu vào để
  khử trùng lặp và định tuyến một lần gửi lại.
- **Biên nhận người dùng nhìn thấy:** hành vi đọc/trạng thái/đang nhập tùy chọn; không bao giờ là
  ranh giới độ bền.

`ReceiveAckPolicy` chỉ kiểm soát xác nhận transport hoặc polling. Nó không được
dùng lại cho biên nhận đã đọc hoặc phản ứng trạng thái.

Trước khi ủy quyền bot, phần nhận phải áp dụng chính sách tiếng vọng OpenClaw dùng chung
khi kênh có thể giải mã metadata nguồn gốc tin nhắn:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Việc loại bỏ này dựa trên thẻ, không dựa trên văn bản. Một tin nhắn phòng do bot viết có
cùng văn bản lỗi Gateway hiển thị nhưng không có metadata nguồn gốc OpenClaw vẫn
đi qua ủy quyền `allowBots` bình thường.

Chính sách xác nhận là tường minh:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling hiện dùng chính sách xác nhận ngữ cảnh nhận cho watermark khởi động lại
đã lưu bền vững. Tracker vẫn quan sát các cập nhật grammY khi chúng đi vào chuỗi
middleware, nhưng OpenClaw chỉ lưu bền vững id cập nhật đã hoàn tất an toàn sau
khi điều phối thành công, để các cập nhật thất bại hoặc thấp hơn đang chờ vẫn có thể phát lại sau
một lần khởi động lại. Offset lấy `getUpdates` upstream của Telegram vẫn do
thư viện polling kiểm soát, nên phần cần can thiệp sâu còn lại là một nguồn polling hoàn toàn bền vững
nếu chúng ta cần nền tảng gửi lại ở cấp nền tảng ngoài watermark khởi động lại của OpenClaw.
Các nền tảng webhook có thể cần xác nhận HTTP ngay lập tức, nhưng chúng vẫn cần
khử trùng lặp đầu vào và ý định gửi đầu ra bền vững vì webhook có thể gửi lại.

## Ngữ cảnh gửi

Việc gửi cũng dựa trên ngữ cảnh:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Cách điều phối ưu tiên:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Helper này mở rộng thành:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

Intent phải tồn tại trước I/O vận chuyển. Một lần khởi động lại sau khi bắt đầu nhưng trước khi commit có thể khôi phục được.

Ranh giới nguy hiểm là sau khi nền tảng báo thành công và trước khi commit biên nhận. Nếu một tiến trình chết ở đó, OpenClaw không thể biết thông điệp trên nền tảng có tồn tại hay không, trừ khi adapter cung cấp tính lũy đẳng gốc hoặc một đường đối soát biên nhận. Những lần thử đó phải tiếp tục trong `unknown_after_send`, không được phát lại mù quáng. Các kênh không có đối soát chỉ có thể chọn phát lại ít nhất một lần nếu thông điệp trùng lặp hiển thị là một đánh đổi chấp nhận được và đã được ghi tài liệu cho kênh cũng như quan hệ đó. Cầu nối đối soát SDK hiện tại yêu cầu adapter khai báo `reconcileUnknownSend`, rồi yêu cầu `durableFinal.reconcileUnknownSend` phân loại một mục chưa biết thành `sent`, `not_sent`, hoặc `unresolved`; chỉ `not_sent` cho phép phát lại, còn các mục chưa giải quyết vẫn ở trạng thái kết thúc hoặc chỉ thử lại kiểm tra đối soát.

Chính sách độ bền phải rõ ràng:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` nghĩa là core phải đóng lỗi khi không thể ghi durable intent. `best_effort` có thể tiếp tục khi cơ chế lưu bền không khả dụng. `disabled` giữ hành vi gửi trực tiếp cũ. Trong quá trình di chuyển, các wrapper kế thừa và helper tương thích công khai mặc định là `disabled`; chúng không được suy ra `required` từ việc một kênh có adapter gửi đi chung.

Ngữ cảnh gửi cũng sở hữu các hiệu ứng sau gửi cục bộ của kênh. Một lần di chuyển sẽ không an toàn nếu phân phối bền bỏ qua hành vi cục bộ trước đây được gắn vào đường gửi trực tiếp của kênh. Ví dụ gồm bộ nhớ đệm chặn tự phản hồi, dấu mốc tham gia luồng, neo chỉnh sửa gốc, kết xuất chữ ký mô hình, và các cơ chế chống trùng lặp riêng của nền tảng. Những hiệu ứng đó phải được chuyển vào adapter gửi, adapter kết xuất, hoặc một hook ngữ cảnh gửi có tên trước khi kênh đó có thể bật phân phối cuối chung dạng bền.

Các helper gửi phải trả biên nhận xuyên suốt về lại caller của chúng. Wrapper bền không được nuốt id thông điệp hoặc thay kết quả phân phối của kênh bằng `undefined`; các dispatcher có bộ đệm dùng những id đó cho neo luồng, các lần chỉnh sửa sau, hoàn tất bản xem trước, và chặn trùng lặp.

Gửi dự phòng hoạt động trên các batch, không phải payload đơn lẻ. Viết lại trả lời im lặng, dự phòng media, dự phòng thẻ, và chiếu đoạn đều có thể tạo ra nhiều hơn một thông điệp có thể phân phối, vì vậy ngữ cảnh gửi phải hoặc phân phối toàn bộ batch đã chiếu hoặc ghi tài liệu rõ ràng vì sao chỉ một payload là hợp lệ.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Khi một dự phòng như vậy là bền, toàn bộ batch đã chiếu phải được biểu diễn bằng một durable send intent hoặc một kế hoạch batch nguyên tử khác. Ghi từng payload một là chưa đủ: một sự cố giữa các payload có thể để lại một dự phòng hiển thị một phần mà không có bản ghi bền cho các payload còn lại. Quá trình khôi phục phải biết đơn vị nào đã có biên nhận và hoặc chỉ phát lại các đơn vị còn thiếu, hoặc đánh dấu batch là `unknown_after_send` cho đến khi adapter đối soát nó.

## Ngữ cảnh trực tiếp

Hành vi xem trước, chỉnh sửa, tiến trình, và stream nên là một vòng đời chọn tham gia duy nhất.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Trạng thái trực tiếp đủ bền để khôi phục hoặc chặn trùng lặp:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Điều này nên bao phủ hành vi hiện tại:

- Telegram gửi kèm bản xem trước chỉnh sửa, với bản cuối mới sau khi bản xem trước quá cũ.
- Discord gửi kèm bản xem trước chỉnh sửa, hủy khi có media/lỗi/trả lời rõ ràng.
- Slack dùng stream gốc hoặc bản xem trước nháp tùy theo hình dạng luồng.
- Hoàn tất bài đăng nháp Mattermost.
- Hoàn tất sự kiện nháp Matrix hoặc biên tập xóa khi không khớp.
- Stream tiến trình gốc của Teams.
- Stream QQ Bot hoặc dự phòng tích lũy.

## Bề mặt adapter

Mục tiêu SDK công khai nên là một subpath:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Hình dạng mục tiêu:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adapter gửi:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adapter nhận:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Trước khi cấp quyền preflight, core phải chạy predicate echo dùng chung của OpenClaw mỗi khi `origin.decode` trả về metadata nguồn gốc OpenClaw. Adapter nhận cung cấp các dữ kiện nền tảng như tác giả bot và hình dạng phòng; core sở hữu quyết định loại bỏ và thứ tự để các kênh không phải tự triển khai lại bộ lọc văn bản.

Adapter nguồn gốc:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core đặt `MessageOrigin`. Các kênh chỉ dịch nó sang và từ metadata vận chuyển gốc. Slack ánh xạ điều này sang `chat.postMessage({ metadata })` và `message.metadata` đầu vào; Matrix có thể ánh xạ nó sang nội dung sự kiện bổ sung; các kênh không có metadata gốc có thể dùng registry biên nhận/gửi đi khi đó là xấp xỉ tốt nhất có sẵn.

Khả năng:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Thu gọn SDK công khai

Bề mặt công khai mới nên hấp thụ hoặc loại bỏ dần các vùng khái niệm này:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- hầu hết cách dùng công khai của `outbound-runtime`
- các helper vòng đời stream nháp rời rạc

Các subpath tương thích có thể vẫn tồn tại dưới dạng wrapper, nhưng Plugin bên thứ ba mới không nên cần chúng.

Các Plugin đi kèm có thể giữ import helper nội bộ thông qua các subpath runtime dành riêng trong khi di chuyển. Tài liệu công khai nên hướng tác giả Plugin tới `plugin-sdk/channel-message` sau khi nó tồn tại.

## Quan hệ với lượt kênh

`runtime.channel.turn.*` nên được giữ trong quá trình di chuyển.

Nó nên trở thành một adapter tương thích:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

Ban đầu `channel.turn.runPrepared` cũng nên được giữ lại:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Sau khi tất cả Plugin đi kèm và các đường tương thích bên thứ ba đã biết được bắc cầu, `channel.turn` có thể bị loại bỏ dần. Không nên xóa nó cho đến khi có một đường di chuyển SDK đã phát hành và các kiểm thử hợp đồng chứng minh Plugin cũ vẫn hoạt động hoặc thất bại với lỗi phiên bản rõ ràng.

## Rào chắn tương thích

Trong quá trình di chuyển, phân phối bền chung là tùy chọn bật cho bất kỳ kênh nào có callback phân phối hiện tại có hiệu ứng phụ ngoài "gửi payload này".

Các điểm vào kế thừa mặc định là không bền:

- `channel.turn.run` và `dispatchAssembledChannelTurn` dùng callback phân phối của kênh trừ khi kênh đó cung cấp rõ ràng một đối tượng chính sách/tùy chọn bền đã được kiểm tra.
- `channel.turn.runPrepared` vẫn thuộc sở hữu của kênh cho đến khi dispatcher đã chuẩn bị gọi rõ ràng ngữ cảnh gửi.
- Các helper tương thích công khai như `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, và helper direct-DM không bao giờ chèn phân phối bền chung trước callback `deliver` hoặc `reply` do caller cung cấp.

Đối với các kiểu cầu nối di chuyển, `durable: undefined` nghĩa là "không bền". Đường bền chỉ được bật bằng một giá trị chính sách/tùy chọn rõ ràng. `durable: false` có thể vẫn tồn tại như một cách viết tương thích, nhưng phần triển khai không nên yêu cầu mọi kênh chưa di chuyển phải thêm nó.

Mã cầu nối hiện tại phải giữ quyết định độ bền rõ ràng:

- Hoạt động phân phối cuối cùng bền vững trả về trạng thái phân biệt. `handled_visible` và
  `handled_no_send` là trạng thái kết thúc; `unsupported` và `not_applicable` có thể dự phòng
  về cơ chế phân phối do kênh sở hữu; `failed` truyền tiếp lỗi gửi.
- Hoạt động phân phối cuối cùng bền vững chung được kiểm soát bởi các năng lực của adapter như
  phân phối im lặng, giữ nguyên đích trả lời, giữ nguyên trích dẫn gốc và
  hook gửi tin nhắn. Nếu thiếu tính tương đương, hãy chọn phân phối do kênh sở hữu,
  không chọn một lượt gửi chung làm thay đổi hành vi người dùng nhìn thấy.
- Các lượt gửi bền vững dựa trên hàng đợi hiển thị tham chiếu ý định phân phối. Các trường phiên
  `pendingFinalDelivery*` hiện có có thể mang id ý định trong giai đoạn
  chuyển đổi; trạng thái cuối là một kho `MessageSendIntent` thay vì văn bản
  trả lời bị đóng băng cộng với các trường ngữ cảnh tùy biến.

Không bật đường dẫn bền vững chung cho một kênh cho đến khi tất cả các điều này
đúng:

- Adapter gửi chung thực thi cùng hành vi kết xuất và vận chuyển như
  đường dẫn trực tiếp cũ.
- Các hiệu ứng phụ cục bộ sau khi gửi được giữ nguyên thông qua ngữ cảnh gửi.
- Adapter trả về biên nhận hoặc kết quả phân phối với tất cả id tin nhắn
  của nền tảng.
- Các đường dẫn dispatcher đã chuẩn bị hoặc gọi ngữ cảnh gửi mới, hoặc vẫn được ghi tài liệu
  là nằm ngoài bảo đảm bền vững.
- Phân phối dự phòng xử lý mọi payload đã chiếu, không chỉ payload đầu tiên.
- Phân phối dự phòng bền vững ghi lại toàn bộ mảng payload đã chiếu như một
  ý định có thể phát lại hoặc kế hoạch theo lô.

Các rủi ro di chuyển cụ thể cần giữ nguyên:

- Cơ chế phân phối trình giám sát iMessage ghi lại các tin nhắn đã gửi trong bộ nhớ đệm echo sau một
  lượt gửi thành công. Các lượt gửi cuối cùng bền vững vẫn phải điền bộ nhớ đệm đó, nếu không
  OpenClaw có thể nhập lại các trả lời cuối cùng của chính nó dưới dạng tin nhắn người dùng gửi vào.
- Tlon thêm chữ ký mô hình tùy chọn và ghi lại các luồng đã tham gia
  sau các trả lời nhóm. Phân phối bền vững chung không được bỏ qua các hiệu ứng đó;
  hãy chuyển chúng vào adapter kết xuất/gửi/hoàn tất của Tlon hoặc giữ Tlon trên
  đường dẫn do kênh sở hữu.
- Discord và các dispatcher đã chuẩn bị khác đã sở hữu hành vi phân phối trực tiếp và xem trước.
  Chúng chưa được bao phủ bởi bảo đảm bền vững cho lượt đã lắp ráp cho đến khi
  dispatcher đã chuẩn bị của chúng định tuyến rõ ràng các kết quả cuối qua ngữ cảnh gửi.
- Phân phối dự phòng im lặng của Telegram phải phân phối toàn bộ mảng payload đã chiếu.
  Lối tắt một payload có thể làm rơi các payload dự phòng bổ sung sau
  khi chiếu.
- LINE, BlueBubbles, Zalo, Nostr và các đường dẫn lắp ráp/hỗ trợ hiện có khác có thể
  có xử lý token trả lời, proxy media, bộ nhớ đệm tin nhắn đã gửi, dọn dẹp tải/trạng thái
  hoặc các đích chỉ callback. Chúng vẫn ở cơ chế phân phối do kênh sở hữu cho đến khi
  các ngữ nghĩa đó được biểu diễn bởi adapter gửi và được xác minh bằng kiểm thử.
- Các helper Direct-DM có thể có một callback trả lời là đích vận chuyển đúng duy nhất.
  Cơ chế gửi ra chung không được đoán từ `OriginatingTo` hoặc `To` và bỏ qua
  callback đó.
- Đầu ra lỗi của OpenClaw gateway phải vẫn hiển thị với con người, nhưng các echo trong phòng
  do bot tạo và đã gắn thẻ phải bị loại bỏ trước bước ủy quyền `allowBots`.
  Các kênh không được triển khai việc này bằng bộ lọc tiền tố văn bản hiển thị trừ khi là
  biện pháp dừng khẩn cấp ngắn hạn; hợp đồng bền vững là siêu dữ liệu nguồn có cấu trúc.

## Lưu trữ nội bộ

Hàng đợi bền vững nên lưu các ý định gửi tin nhắn, không phải payload trả lời.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Vòng lặp khôi phục:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

Hàng đợi nên giữ đủ danh tính để phát lại qua cùng tài khoản,
luồng, đích, chính sách định dạng và quy tắc media sau khi khởi động lại.

## Lớp lỗi

Adapter kênh phân loại lỗi vận chuyển thành các danh mục đóng:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Chính sách lõi:

- Thử lại `transient` và `rate_limit`.
- Không thử lại `invalid_payload` trừ khi có dự phòng kết xuất.
- Không thử lại `auth` hoặc `permission` cho đến khi cấu hình thay đổi.
- Với `not_found`, cho phép hoàn tất trực tiếp dự phòng từ chỉnh sửa sang gửi mới khi
  kênh tuyên bố việc đó là an toàn.
- Với `conflict`, dùng quy tắc biên nhận/idempotency để quyết định tin nhắn
  đã tồn tại hay chưa.
- Bất kỳ lỗi nào sau khi adapter có thể đã hoàn tất I/O nền tảng nhưng trước khi commit
  biên nhận đều trở thành `unknown_after_send` trừ khi adapter có thể chứng minh thao tác
  nền tảng đã không xảy ra.

## Ánh xạ kênh

| Kênh                     | Mục tiêu di chuyển                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Nhận chính sách ack cùng với các lần gửi cuối bền vững. Bộ điều hợp trực tiếp sở hữu việc gửi cùng với chỉnh sửa bản xem trước, gửi cuối bản xem trước cũ, chủ đề, bỏ qua bản xem trước trả lời trích dẫn, phương án dự phòng cho phương tiện và xử lý retry-after.                                                                                              |
| Discord                  | Bộ điều hợp gửi bao bọc cơ chế phân phối tải dữ liệu bền vững hiện có. Bộ điều hợp trực tiếp sở hữu chỉnh sửa bản nháp, bản nháp tiến độ, hủy bản xem trước phương tiện/lỗi, bảo toàn mục tiêu trả lời và biên nhận id tin nhắn. Kiểm tra các phản hồi lặp lại lỗi Gateway do bot tạo trong phòng dùng chung; dùng sổ đăng ký gửi đi hoặc phương án gốc tương đương khác nếu Discord không thể mang siêu dữ liệu nguồn gốc trên tin nhắn thông thường. |
| Slack                    | Bộ điều hợp gửi xử lý các bài đăng trò chuyện thông thường. Bộ điều hợp trực tiếp chọn luồng gốc khi dạng luồng hội thoại hỗ trợ, nếu không thì dùng bản xem trước nháp. Biên nhận bảo toàn dấu thời gian luồng hội thoại. Bộ điều hợp nguồn gốc ánh xạ lỗi Gateway của OpenClaw sang Slack `chat.postMessage.metadata` và loại bỏ các phản hồi lặp lại trong phòng bot đã được gắn thẻ trước khi ủy quyền `allowBots`. |
| WhatsApp                 | Bộ điều hợp gửi sở hữu việc gửi văn bản/phương tiện với các ý định cuối bền vững. Bộ điều hợp nhận xử lý lượt nhắc trong nhóm và danh tính người gửi. Trực tiếp có thể tiếp tục vắng mặt cho đến khi WhatsApp có phương tiện truyền tải có thể chỉnh sửa.                                                                                                          |
| Matrix                   | Bộ điều hợp trực tiếp sở hữu chỉnh sửa sự kiện nháp, hoàn tất, biên tập xóa, ràng buộc phương tiện được mã hóa và phương án dự phòng khi mục tiêu trả lời không khớp. Bộ điều hợp nhận sở hữu việc nạp sự kiện được mã hóa và khử trùng lặp. Bộ điều hợp nguồn gốc nên mã hóa nguồn gốc lỗi Gateway của OpenClaw vào nội dung sự kiện Matrix và loại bỏ các phản hồi lặp lại trong phòng bot đã cấu hình trước khi xử lý `allowBots`. |
| Mattermost               | Bộ điều hợp trực tiếp sở hữu một bài đăng nháp, gấp gọn tiến độ/công cụ, hoàn tất tại chỗ và phương án dự phòng gửi mới.                                                                                                                                                                                                                                       |
| Microsoft Teams          | Bộ điều hợp trực tiếp sở hữu tiến độ gốc và hành vi luồng khối. Bộ điều hợp gửi sở hữu hoạt động và biên nhận tệp đính kèm/thẻ.                                                                                                                                                                                                                                |
| Feishu                   | Bộ điều hợp kết xuất sở hữu kết xuất văn bản/thẻ/thô. Bộ điều hợp trực tiếp sở hữu thẻ phát trực tuyến và chặn bản cuối trùng lặp. Bộ điều hợp gửi sở hữu bình luận, phiên chủ đề, phương tiện và chặn giọng nói.                                                                                                                                                 |
| QQ Bot                   | Bộ điều hợp trực tiếp sở hữu phát trực tuyến C2C, thời gian chờ bộ tích lũy và gửi cuối dự phòng. Bộ điều hợp kết xuất sở hữu thẻ phương tiện và văn bản-dưới-dạng-giọng-nói.                                                                                                                                                                                   |
| Signal                   | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi. Không có bộ điều hợp trực tiếp trừ khi signal-cli bổ sung hỗ trợ chỉnh sửa đáng tin cậy.                                                                                                                                                                                                                   |
| iMessage and BlueBubbles | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi. Việc gửi iMessage phải bảo toàn việc điền echo-cache của trình giám sát trước khi các bản cuối bền vững có thể bỏ qua phân phối qua trình giám sát. Nhập trạng thái gõ, phản ứng và tệp đính kèm riêng của BlueBubbles vẫn là năng lực của bộ điều hợp.                                                     |
| Google Chat              | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, trong đó quan hệ luồng hội thoại được ánh xạ sang spaces và thread ids. Kiểm tra hành vi phòng `allowBots=true` đối với các phản hồi lặp lại lỗi Gateway của OpenClaw đã gắn thẻ.                                                                                                                            |
| LINE                     | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, với ràng buộc reply-token được mô hình hóa thành năng lực mục tiêu/quan hệ.                                                                                                                                                                                                                                 |
| Nextcloud Talk           | Cầu nối nhận SDK cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                                     |
| IRC                      | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, không có biên nhận chỉnh sửa bền vững.                                                                                                                                                                                                                                                                      |
| Nostr                    | Bộ điều hợp nhận cùng với bộ điều hợp gửi cho DM được mã hóa; biên nhận là event ids.                                                                                                                                                                                                                                                                           |
| QA Channel               | Bộ điều hợp kiểm thử hợp đồng cho hành vi nhận, gửi, trực tiếp, thử lại và khôi phục.                                                                                                                                                                                                                                                                           |
| Synology Chat            | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                            |
| Tlon                     | Bộ điều hợp gửi phải bảo toàn kết xuất chữ ký mô hình và theo dõi luồng hội thoại đã tham gia trước khi bật phân phối cuối bền vững chung.                                                                                                                                                                                                                      |
| Twitch                   | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, có phân loại giới hạn tốc độ.                                                                                                                                                                                                                                                                               |
| Zalo                     | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                            |
| Zalo Personal            | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                            |

## Kế hoạch di chuyển

### Giai đoạn 1: Miền tin nhắn nội bộ

- Thêm các kiểu `src/channels/message/*` cho tin nhắn, mục tiêu, quan hệ,
  nguồn gốc, biên nhận, năng lực, ý định bền vững, ngữ cảnh nhận, ngữ cảnh gửi,
  ngữ cảnh trực tiếp và lớp lỗi.
- Thêm `origin?: MessageOrigin` vào kiểu tải dữ liệu cầu nối di chuyển dùng cho
  phân phối trả lời hiện tại, rồi chuyển trường đó sang `ChannelMessage` và các
  kiểu tin nhắn đã kết xuất khi quá trình tái cấu trúc thay thế tải dữ liệu trả lời.
- Giữ phần này nội bộ cho đến khi bộ điều hợp và kiểm thử chứng minh được hình dạng.
- Thêm kiểm thử đơn vị thuần cho chuyển đổi trạng thái và tuần tự hóa.

### Giai đoạn 2: Lõi gửi bền vững

- Chuyển hàng đợi gửi đi hiện có từ độ bền tải dữ liệu trả lời sang các ý định
  gửi tin nhắn bền vững.
- Cho phép một ý định gửi bền vững mang một mảng tải dữ liệu đã chiếu hoặc kế hoạch
  lô, không chỉ một tải dữ liệu trả lời.
- Bảo toàn hành vi khôi phục hàng đợi hiện tại thông qua chuyển đổi tương thích.
- Cho `deliverOutboundPayloads` gọi `messages.send`.
- Đặt độ bền gửi cuối làm mặc định và đóng khi lỗi nếu ý định bền vững không thể
  được ghi trong vòng đời tin nhắn mới, sau khi bộ điều hợp khai báo an toàn phát lại.
  Các đường dẫn tương thích channel-turn và SDK hiện có vẫn mặc định gửi trực tiếp trong giai đoạn này.
- Ghi biên nhận nhất quán.
- Trả biên nhận và kết quả phân phối về cho bên gọi bộ điều phối ban đầu thay vì
  xem gửi bền vững là một hiệu ứng phụ kết thúc.
- Duy trì nguồn gốc tin nhắn qua các ý định gửi bền vững để khôi phục, phát lại và
  gửi theo đoạn vẫn bảo toàn provenance vận hành của OpenClaw.

### Giai đoạn 3: Cầu nối lượt kênh

- Triển khai lại `channel.turn.run` và `dispatchAssembledChannelTurn` trên nền
  `messages.receive` và `messages.send`.
- Giữ ổn định các kiểu fact hiện tại.
- Giữ hành vi cũ theo mặc định. Một kênh assembled-turn chỉ trở nên bền vững khi
  bộ điều hợp của nó chọn tham gia rõ ràng với chính sách độ bền an toàn phát lại.
- Giữ `durable: false` làm cửa thoát tương thích cho các đường dẫn hoàn tất chỉnh
  sửa gốc và chưa thể phát lại an toàn, nhưng không dựa vào các dấu `false` để
  bảo vệ các kênh chưa được di chuyển.
- Chỉ mặc định hóa độ bền assembled-turn trong vòng đời tin nhắn mới, sau khi ánh
  xạ kênh chứng minh đường dẫn gửi chung bảo toàn ngữ nghĩa phân phối kênh cũ.

### Giai đoạn 4: Cầu nối bộ điều phối đã chuẩn bị

- Thay `deliverDurableInboundReplyPayload` bằng cầu nối ngữ cảnh gửi.
- Giữ helper cũ dưới dạng wrapper.
- Chuyển Telegram, WhatsApp, Slack, Signal, iMessage và Discord trước vì
  chúng đã có công việc final bền vững hoặc đường dẫn gửi đơn giản hơn.
- Xem mọi dispatcher đã chuẩn bị là chưa được bao phủ cho đến khi nó chọn rõ
  dùng ngữ cảnh gửi. Tài liệu và mục changelog phải nói "lượt kênh đã lắp ráp"
  hoặc nêu tên các đường dẫn kênh đã di trú thay vì tuyên bố tất cả phản hồi
  final tự động.
- Giữ nguyên hành vi bảo toàn tương thích công khai của `recordInboundSessionAndDispatchReply`, các helper direct-DM và các helper tương tự.
  Chúng có thể cung cấp cơ chế chọn tham gia ngữ cảnh gửi rõ ràng sau này, nhưng không được tự động thử phân phối bền vững generic
  trước callback phân phối do caller sở hữu.

### Giai đoạn 5: Vòng đời Live hợp nhất

- Xây dựng `messages.live` với hai bộ điều hợp chứng minh:
  - Telegram cho gửi cộng chỉnh sửa cộng gửi final mới khi bị stale.
  - Matrix cho hoàn tất draft cộng fallback redaction.
- Sau đó di trú Discord, Slack, Mattermost, Teams, QQ Bot và Feishu.
- Chỉ xóa mã hoàn tất preview trùng lặp sau khi mỗi kênh có
  kiểm thử ngang bằng.

### Giai đoạn 6: SDK công khai

- Thêm `openclaw/plugin-sdk/channel-message`.
- Ghi tài liệu rằng đây là API Plugin kênh được ưu tiên.
- Cập nhật package exports, inventory entrypoint, baseline API sinh ra và
  tài liệu SDK Plugin.
- Bao gồm `MessageOrigin`, các hook encode/decode origin và predicate dùng chung
  `shouldDropOpenClawEcho` trong bề mặt SDK channel-message.
- Giữ các wrapper tương thích cho subpath cũ.
- Đánh dấu các helper SDK mang tên reply là đã ngừng khuyến nghị trong tài liệu sau khi các Plugin
  đi kèm được di trú.

### Giai đoạn 7: Tất cả sender

Chuyển mọi producer outbound không phải reply sang `messages.send`:

- thông báo cron và heartbeat
- hoàn tất tác vụ
- kết quả hook
- prompt phê duyệt và kết quả phê duyệt
- gửi từ message tool
- thông báo hoàn tất subagent
- gửi rõ ràng từ CLI hoặc Control UI
- đường dẫn tự động hóa/broadcast

Đây là nơi mô hình không còn là "agent replies" mà trở thành "OpenClaw gửi
tin nhắn".

### Giai đoạn 8: Ngừng khuyến nghị Turn

- Giữ `channel.turn` dưới dạng wrapper trong ít nhất một cửa sổ tương thích.
- Xuất bản ghi chú di trú.
- Chạy kiểm thử tương thích SDK Plugin với các import cũ.
- Chỉ xóa hoặc ẩn helper nội bộ cũ sau khi không còn Plugin đi kèm nào cần chúng
  và các hợp đồng bên thứ ba đã có thay thế ổn định.

## Kế hoạch kiểm thử

Kiểm thử đơn vị:

- Tuần tự hóa và khôi phục intent gửi bền vững.
- Tái sử dụng khóa idempotency và chặn trùng lặp.
- Commit receipt và bỏ qua replay.
- Khôi phục `unknown_after_send` có đối soát trước khi replay khi bộ điều hợp
  hỗ trợ đối soát.
- Chính sách phân loại lỗi.
- Trình tự chính sách ack khi nhận.
- Ánh xạ quan hệ cho các lượt gửi reply, followup, system và broadcast.
- Factory origin cho lỗi Gateway và predicate `shouldDropOpenClawEcho`.
- Bảo toàn origin qua chuẩn hóa payload, chunking, tuần tự hóa hàng đợi bền vững
  và khôi phục.

Kiểm thử tích hợp:

- Bộ điều hợp đơn giản `channel.turn.run` vẫn ghi nhận và gửi.
- Phân phối assembled-turn cũ không trở thành bền vững trừ khi kênh
  chọn tham gia rõ ràng.
- Cầu nối `channel.turn.runPrepared` vẫn ghi nhận và hoàn tất.
- Helper tương thích công khai mặc định gọi callback phân phối do caller sở hữu
  và không generic-send trước các callback đó.
- Phân phối fallback bền vững replay toàn bộ mảng payload đã chiếu sau
  khi khởi động lại và không thể để các payload sau đó chưa được ghi nhận sau một crash sớm.
- Phân phối assembled-turn bền vững trả về id tin nhắn nền tảng cho dispatcher
  đã buffer.
- Hook phân phối tùy chỉnh vẫn trả về id tin nhắn nền tảng khi phân phối bền vững
  bị tắt hoặc không khả dụng.
- Reply final sống sót qua khởi động lại giữa lúc assistant hoàn tất và gửi lên nền tảng.
- Draft preview hoàn tất tại chỗ khi được phép.
- Draft preview bị hủy hoặc redacted khi media/lỗi/không khớp mục tiêu reply
  yêu cầu phân phối bình thường.
- Block streaming và preview streaming không cùng phân phối cùng một văn bản.
- Media được stream sớm không bị nhân đôi trong phân phối final.

Kiểm thử kênh:

- Reply topic Telegram với polling ack bị trì hoãn cho đến watermark completed an toàn
  của ngữ cảnh nhận.
- Khôi phục polling Telegram cho các update đã chấp nhận nhưng chưa phân phối được bao phủ bởi
  mô hình offset safe-completed đã lưu.
- Preview stale của Telegram gửi final mới và dọn preview.
- Fallback silent của Telegram gửi mọi payload fallback đã chiếu.
- Độ bền fallback silent của Telegram ghi nhận toàn bộ mảng fallback đã chiếu
  một cách nguyên tử, không phải một intent bền vững một payload cho mỗi vòng lặp.
- Discord hủy preview khi có media/lỗi/reply rõ ràng.
- Final của dispatcher đã chuẩn bị trong Discord đi qua ngữ cảnh gửi trước khi tài liệu
  hoặc changelog tuyên bố độ bền final-reply của Discord.
- Gửi final bền vững của iMessage điền cache echo tin nhắn đã gửi của monitor.
- Đường dẫn phân phối cũ của LINE, BlueBubbles, Zalo và Nostr không bị bỏ qua bởi
  gửi bền vững generic cho đến khi có kiểm thử ngang bằng cho bộ điều hợp của chúng.
- Phân phối callback Direct-DM/Nostr vẫn có thẩm quyền trừ khi được di trú rõ ràng
  sang mục tiêu tin nhắn hoàn chỉnh và bộ điều hợp gửi an toàn khi replay.
- Tin nhắn lỗi Gateway OpenClaw được gắn thẻ của Slack vẫn hiển thị outbound, echo bot-room
  được gắn thẻ bị loại trước `allowBots`, và tin nhắn bot không gắn thẻ có
  cùng văn bản hiển thị vẫn đi theo ủy quyền bot bình thường.
- Fallback stream native của Slack sang draft preview trong DM cấp cao nhất.
- Hoàn tất preview và fallback redaction của Matrix.
- Echo phòng lỗi Gateway OpenClaw được gắn thẻ trong Matrix từ tài khoản bot
  đã cấu hình bị loại trước khi xử lý `allowBots`.
- Audit cascade lỗi Gateway trong phòng dùng chung của Discord và Google Chat bao phủ
  các chế độ `allowBots` trước khi tuyên bố có bảo vệ generic ở đó.
- Hoàn tất draft và fallback gửi mới của Mattermost.
- Hoàn tất tiến trình native của Teams.
- Chặn final trùng lặp của Feishu.
- Fallback timeout accumulator của QQ Bot.
- Gửi final bền vững của Tlon bảo toàn rendering model-signature và theo dõi thread
  đã tham gia.
- Gửi final bền vững đơn giản của WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo và Zalo Personal.

Xác thực:

- Các file Vitest mục tiêu trong quá trình phát triển.
- `pnpm check:changed` trong Testbox cho toàn bộ bề mặt đã thay đổi.
- `pnpm check` rộng hơn trong Testbox trước khi land toàn bộ refactor hoặc sau
  thay đổi SDK/export công khai.
- Smoke live hoặc qa-channel cho ít nhất một kênh có khả năng chỉnh sửa và một
  kênh chỉ gửi đơn giản trước khi xóa wrapper tương thích.

## Câu hỏi mở

- Liệu Telegram cuối cùng có nên thay nguồn runner grammY bằng một
  nguồn polling hoàn toàn bền vững có thể kiểm soát việc phân phối lại ở cấp nền tảng,
  không chỉ watermark khởi động lại đã lưu của OpenClaw.
- Liệu trạng thái live preview bền vững nên được lưu trong cùng bản ghi hàng đợi
  với intent gửi final hay trong kho live-state sibling.
- Wrapper tương thích nên tiếp tục được ghi tài liệu bao lâu sau khi
  `plugin-sdk/channel-message` được phát hành.
- Liệu Plugin bên thứ ba nên triển khai trực tiếp bộ điều hợp nhận hay chỉ
  cung cấp các hook normalize/send/live thông qua `defineChannelMessageAdapter`.
- Trường receipt nào an toàn để đưa ra SDK công khai so với trạng thái runtime
  nội bộ.
- Liệu side effect như cache self-echo và marker thread đã tham gia
  nên được mô hình hóa thành hook ngữ cảnh gửi, bước finalize do bộ điều hợp sở hữu hay
  subscriber receipt.
- Kênh nào có metadata origin native, kênh nào cần registry outbound đã lưu,
  và kênh nào không thể cung cấp cơ chế chặn echo liên bot đáng tin cậy.

## Tiêu chí chấp nhận

- Mọi kênh tin nhắn đi kèm gửi output hiển thị final qua
  `messages.send`.
- Mọi kênh tin nhắn inbound đi vào qua `messages.receive` hoặc một
  wrapper tương thích được ghi tài liệu.
- Mọi kênh preview/edit/stream dùng `messages.live` cho trạng thái draft và
  hoàn tất.
- `channel.turn` chỉ là wrapper.
- Helper SDK mang tên reply là export tương thích, không phải đường dẫn được khuyến nghị.
- Khôi phục bền vững có thể replay các lượt gửi final đang chờ sau khi khởi động lại mà không làm mất
  phản hồi final hoặc nhân đôi các lượt gửi đã commit; các lượt gửi có
  kết quả nền tảng không xác định được đối soát trước khi replay hoặc được ghi tài liệu là
  at-least-once cho bộ điều hợp đó.
- Gửi final bền vững fail closed khi intent bền vững không thể được ghi,
  trừ khi caller chọn rõ ràng một chế độ không bền vững đã ghi tài liệu.
- Helper tương thích channel-turn và SDK cũ mặc định dùng phân phối trực tiếp
  do kênh sở hữu; gửi bền vững generic chỉ là opt-in rõ ràng.
- Receipt bảo toàn tất cả id tin nhắn nền tảng cho phân phối nhiều phần và một
  id chính để tiện threading/edit.
- Wrapper bền vững bảo toàn side effect cục bộ của kênh trước khi thay thế callback
  phân phối trực tiếp.
- Dispatcher đã chuẩn bị không được tính là bền vững cho đến khi đường dẫn phân phối final
  của chúng dùng rõ ràng ngữ cảnh gửi.
- Phân phối fallback xử lý mọi payload đã chiếu.
- Phân phối fallback bền vững ghi nhận mọi payload đã chiếu trong một intent
  hoặc batch plan có thể replay.
- Output lỗi Gateway có nguồn gốc từ OpenClaw hiển thị với con người nhưng echo phòng do bot tạo
  được gắn thẻ bị loại trước ủy quyền bot trên các kênh tuyên bố hỗ trợ hợp đồng origin.
- Tài liệu giải thích send, receive, live, state, receipts, relations, chính sách lỗi,
  di trú và phạm vi kiểm thử.

## Liên quan

- [Tin nhắn](/vi/concepts/messages)
- [Streaming và chunking](/vi/concepts/streaming)
- [Draft tiến trình](/vi/concepts/progress-drafts)
- [Chính sách retry](/vi/concepts/retry)
- [Kernel lượt kênh](/vi/plugins/sdk-channel-turn)
