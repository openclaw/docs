---
read_when:
    - Tái cấu trúc hành vi gửi hoặc nhận của kênh
    - Thay đổi kênh gửi đến, điều phối phản hồi, hàng đợi gửi đi, phát trực tuyến bản xem trước, hoặc API thông điệp của plugin SDK
    - Thiết kế một Plugin kênh mới cần gửi bền vững, biên nhận, bản xem trước, chỉnh sửa hoặc thử lại
summary: Kế hoạch thiết kế cho vòng đời hợp nhất, bền vững của việc nhận, gửi, xem trước, chỉnh sửa và truyền phát tin nhắn
title: Tái cấu trúc vòng đời thông điệp
x-i18n:
    generated_at: "2026-06-27T17:24:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Trang này là thiết kế mục tiêu để thay thế các helper rải rác cho inbound của kênh, dispatch phản hồi, phát trực tuyến preview và phân phối outbound bằng một vòng đời message bền vững duy nhất.

Phiên bản ngắn:

- Các primitive cốt lõi nên là **nhận** và **gửi**, không phải **trả lời**.
- Một phản hồi chỉ là một quan hệ trên một message outbound.
- Một turn là tiện ích xử lý inbound, không phải chủ sở hữu của việc phân phối.
- Việc gửi phải dựa trên ngữ cảnh: `begin`, render, preview hoặc stream, gửi cuối cùng, commit, fail.
- Việc nhận cũng phải dựa trên ngữ cảnh: normalize, dedupe, route, record, dispatch, platform ack, fail.
- SDK Plugin công khai nên thu gọn thành một bề mặt channel-outbound nhỏ.

## Vấn đề

Stack kênh hiện tại phát triển từ một số nhu cầu cục bộ hợp lệ:

- Các adapter inbound đơn giản dùng `runtime.channel.inbound.run`.
- Các adapter phong phú dùng `runtime.channel.inbound.runPreparedReply`.
- Các helper cũ dùng `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helper payload phản hồi, chia chunk phản hồi, tham chiếu phản hồi và helper runtime outbound.
- Phát trực tuyến preview nằm trong các dispatcher riêng theo kênh.
- Độ bền của phân phối cuối cùng đang được bổ sung quanh các đường dẫn payload phản hồi hiện có.

Hình dạng đó sửa được lỗi cục bộ, nhưng khiến OpenClaw có quá nhiều khái niệm công khai và quá nhiều nơi mà ngữ nghĩa phân phối có thể lệch nhau.

Vấn đề độ tin cậy làm lộ điều này là:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Invariant mục tiêu rộng hơn Telegram: một khi core quyết định rằng một message outbound hiển thị nên tồn tại, intent phải bền vững trước khi thử gửi qua nền tảng, và receipt của nền tảng phải được commit sau khi thành công. Điều đó cho OpenClaw khả năng khôi phục at-least-once. Hành vi exactly-once chỉ tồn tại với các adapter có thể chứng minh idempotency gốc hoặc đối chiếu một lần thử unknown-after-send với trạng thái nền tảng trước khi phát lại.

Đó là trạng thái cuối của refactor này, không phải mô tả của mọi đường dẫn hiện tại. Trong quá trình migration, các helper outbound hiện có vẫn có thể rơi về gửi trực tiếp khi ghi hàng đợi best-effort thất bại. Refactor chỉ hoàn tất khi các lần gửi cuối cùng bền vững fail closed hoặc opt out rõ ràng bằng một chính sách không bền vững được ghi tài liệu.

## Mục tiêu

- Một vòng đời core cho mọi đường dẫn nhận và gửi message của kênh.
- Gửi cuối cùng bền vững theo mặc định trong vòng đời message mới sau khi adapter khai báo hành vi an toàn để phát lại.
- Ngữ nghĩa preview, edit, stream, finalization, retry, recovery và receipt dùng chung.
- Một bề mặt SDK Plugin nhỏ mà Plugin bên thứ ba có thể học và duy trì.
- Tương thích cho các caller tương thích phản hồi inbound hiện có trong quá trình migration.
- Điểm mở rộng rõ ràng cho năng lực kênh mới.
- Không có nhánh riêng theo nền tảng trong core.
- Không có message kênh dạng token-delta. Streaming của kênh vẫn là preview message, edit, append hoặc phân phối block đã hoàn tất.
- Metadata có cấu trúc do OpenClaw khởi tạo cho output vận hành/hệ thống để các lỗi Gateway hiển thị không đi lại vào các phòng dùng bot chung như prompt mới.

## Không phải mục tiêu

- Không ép mọi kênh hiện có dùng phân phối message bền vững trong giai đoạn đầu.
- Không ép mọi kênh vào cùng một hành vi transport gốc.
- Không dạy core về chủ đề Telegram, stream gốc của Slack, redaction của Matrix, thẻ Feishu, giọng nói QQ hoặc activity của Teams.
- Không công bố tất cả helper migration nội bộ như API SDK ổn định.
- Không để retry phát lại các thao tác nền tảng không idempotent đã hoàn tất.

## Mô hình tham chiếu

Vercel Chat có một mô hình tư duy công khai tốt:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- các phương thức adapter như `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` và fetch lịch sử
- một state adapter cho dedupe, lock, hàng đợi và persistence

OpenClaw nên mượn từ vựng, không sao chép bề mặt.

Những gì OpenClaw cần ngoài mô hình đó:

- Intent gửi outbound bền vững trước các lệnh gọi transport trực tiếp.
- Ngữ cảnh gửi rõ ràng với begin, commit và fail.
- Ngữ cảnh nhận biết chính sách ack của nền tảng.
- Receipt sống sót qua restart và có thể dẫn dắt edit, delete, recovery và triệt tiêu trùng lặp.
- SDK công khai nhỏ hơn. Plugin đi kèm có thể dùng helper runtime nội bộ, nhưng Plugin bên thứ ba nên thấy một API message nhất quán.
- Hành vi riêng theo agent: session, transcript, block streaming, tiến độ tool, phê duyệt, chỉ thị media, phản hồi im lặng và lịch sử mention trong nhóm.

Các promise kiểu `thread.post()` là chưa đủ cho OpenClaw. Chúng che giấu ranh giới transaction quyết định liệu một lần gửi có thể khôi phục hay không.

## Mô hình core

Domain mới nên nằm dưới một namespace core nội bộ như `src/channels/message/*`.

Nó có bốn khái niệm:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` sở hữu vòng đời inbound.

`send` sở hữu vòng đời outbound.

`live` sở hữu preview, edit, tiến độ và trạng thái stream.

`state` sở hữu lưu trữ intent bền vững, receipt, idempotency, recovery, lock và dedupe.

## Thuật ngữ message

### Message

Một message đã normalize là trung lập với nền tảng:

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

### Target

Target mô tả nơi message tồn tại:

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

### Relation

Reply là một quan hệ, không phải gốc API:

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

Điều này cho phép cùng một đường dẫn gửi xử lý phản hồi thông thường, thông báo Cron, prompt phê duyệt, hoàn tất tác vụ, gửi qua message-tool, gửi từ CLI hoặc Control UI, kết quả subagent và gửi tự động hóa.

### Origin

Origin mô tả ai đã tạo ra message và OpenClaw nên xử lý echo của message đó như thế nào. Nó tách biệt với relation: một message có thể là phản hồi cho người dùng và vẫn là output vận hành do OpenClaw khởi tạo.

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

Core sở hữu ý nghĩa của output do OpenClaw khởi tạo. Kênh sở hữu cách origin đó được mã hóa vào transport của chúng.

Trường hợp sử dụng bắt buộc đầu tiên là output lỗi Gateway. Con người vẫn nên thấy các message như "Agent failed before reply" hoặc "Missing API key", nhưng output vận hành OpenClaw đã được gắn thẻ không được chấp nhận làm input do bot viết trong các phòng chung khi `allowBots` được bật.

### Receipt

Receipt là đối tượng hạng nhất:

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

Receipt là cầu nối từ intent bền vững đến edit, delete, finalization preview, triệt tiêu trùng lặp và recovery trong tương lai.

Một receipt có thể mô tả một message nền tảng hoặc một lần phân phối nhiều phần. Text được chia chunk, media kèm text, voice kèm text và fallback thẻ phải giữ lại tất cả id nền tảng trong khi vẫn phơi bày một id chính cho threading và các lần edit sau.

## Ngữ cảnh nhận

Việc nhận không nên là một lệnh gọi helper trần. Core cần một ngữ cảnh biết dedupe, routing, ghi session và chính sách ack của nền tảng.

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

Ack không phải một thứ duy nhất. Contract nhận phải giữ các tín hiệu này tách biệt:

- **Transport ack:** báo cho webhook hoặc socket của nền tảng rằng OpenClaw đã chấp nhận event envelope. Một số nền tảng yêu cầu điều này trước dispatch.
- **Polling offset ack:** đẩy cursor tiến lên để event đó không bị fetch lại. Việc này không được tiến qua phần việc không thể khôi phục.
- **Inbound record ack:** xác nhận OpenClaw đã lưu đủ metadata inbound để dedupe và route một lần redelivery.
- **User-visible receipt:** hành vi đọc/trạng thái/typing tùy chọn; không bao giờ là ranh giới độ bền.

`ReceiveAckPolicy` chỉ kiểm soát acknowledgement transport hoặc polling. Không được tái sử dụng nó cho read receipt hoặc status reaction.

Trước khi ủy quyền bot, receive phải áp dụng chính sách echo OpenClaw dùng chung khi kênh có thể decode metadata origin của message:

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

Việc drop này dựa trên thẻ, không dựa trên văn bản. Một message trong phòng do bot viết có cùng văn bản lỗi Gateway hiển thị nhưng không có metadata origin OpenClaw vẫn đi qua ủy quyền `allowBots` thông thường.

Chính sách ack là rõ ràng:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling hiện dùng chính sách ack của receive-context cho watermark restart đã lưu. Tracker vẫn quan sát các update grammY khi chúng đi vào chuỗi middleware, nhưng OpenClaw chỉ lưu id update đã hoàn tất an toàn sau khi dispatch thành công, để các update thất bại hoặc pending thấp hơn có thể phát lại sau restart. Offset fetch `getUpdates` upstream của Telegram vẫn do thư viện polling kiểm soát, nên phần cắt sâu còn lại là một nguồn polling hoàn toàn bền vững nếu chúng ta cần redelivery cấp nền tảng vượt ngoài watermark restart của OpenClaw. Các nền tảng webhook có thể cần HTTP ack tức thì, nhưng chúng vẫn cần dedupe inbound và intent gửi outbound bền vững vì webhook có thể redeliver.

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

Điều phối được ưu tiên:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Trình trợ giúp mở rộng thành:

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

Ý định phải tồn tại trước I/O truyền tải. Có thể khôi phục sau khi khởi động lại sau bước bắt đầu nhưng trước
bước commit.

Ranh giới nguy hiểm nằm sau khi nền tảng thành công và trước khi commit biên nhận. Nếu một
tiến trình chết ở đó, OpenClaw không thể biết thông điệp nền tảng có tồn tại hay không
trừ khi bộ điều hợp cung cấp tính lũy đẳng gốc hoặc một đường dẫn đối soát biên nhận.
Những lần thử đó phải tiếp tục trong `unknown_after_send`, không được phát lại một cách mù quáng. Các kênh
không có đối soát chỉ có thể chọn phát lại ít nhất một lần nếu thông điệp hiển thị bị trùng lặp
là một đánh đổi chấp nhận được và được ghi tài liệu cho kênh và quan hệ đó.
Cầu nối đối soát SDK hiện tại yêu cầu bộ điều hợp khai báo
`reconcileUnknownSend`, sau đó yêu cầu `durableFinal.reconcileUnknownSend`
phân loại một mục không xác định là `sent`, `not_sent`, hoặc `unresolved`; chỉ `not_sent`
cho phép phát lại, còn các mục chưa được giải quyết vẫn ở trạng thái kết thúc hoặc chỉ thử lại
kiểm tra đối soát.

Chính sách độ bền phải tường minh:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` nghĩa là lõi phải fail closed khi không thể ghi ý định bền vững.
`best_effort` có thể tiếp tục khi không có khả năng lưu bền vững. `disabled` giữ
hành vi gửi trực tiếp cũ. Trong quá trình di trú, các wrapper cũ và trình trợ giúp
tương thích công khai mặc định là `disabled`; chúng không được suy luận `required` từ
việc một kênh có bộ điều hợp gửi đi chung.

Ngữ cảnh gửi cũng sở hữu các hiệu ứng sau gửi cục bộ của kênh. Một quá trình di trú sẽ không an toàn
nếu phân phối bền vững bỏ qua hành vi cục bộ trước đây được gắn vào
đường dẫn gửi trực tiếp của kênh. Ví dụ gồm cache chặn tự echo,
dấu tham gia luồng, neo chỉnh sửa gốc, render chữ ký mô hình,
và bộ chống trùng lặp riêng theo nền tảng. Những hiệu ứng đó phải được chuyển vào
bộ điều hợp gửi, bộ điều hợp render, hoặc một hook ngữ cảnh gửi có tên trước khi
kênh đó có thể bật phân phối cuối chung bền vững.

Trình trợ giúp gửi phải trả về biên nhận xuyên suốt về caller của chúng. Các
wrapper bền vững không được nuốt id thông điệp hoặc thay kết quả phân phối của kênh bằng
`undefined`; các dispatcher có bộ đệm dùng những id đó cho neo luồng, các chỉnh sửa sau,
hoàn tất preview, và chặn trùng lặp.

Gửi fallback hoạt động trên batch, không phải payload đơn lẻ. Viết lại trả lời im lặng,
fallback media, fallback thẻ, và chiếu chunk đều có thể tạo ra nhiều hơn
một thông điệp có thể phân phối, nên ngữ cảnh gửi phải phân phối toàn bộ
batch đã chiếu hoặc ghi tài liệu tường minh vì sao chỉ một payload là hợp lệ.

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

Khi một fallback như vậy là bền vững, toàn bộ batch đã chiếu phải được biểu diễn bằng
một ý định gửi bền vững hoặc một kế hoạch batch nguyên tử khác. Ghi từng payload
một là chưa đủ: sự cố giữa các payload có thể để lại một fallback hiển thị một phần
mà không có bản ghi bền vững cho các payload còn lại. Quá trình khôi phục phải biết
những unit nào đã có biên nhận và chỉ phát lại các unit còn thiếu hoặc đánh dấu
batch là `unknown_after_send` cho đến khi bộ điều hợp đối soát nó.

## Ngữ cảnh trực tiếp

Hành vi preview, chỉnh sửa, tiến độ và stream nên là một vòng đời opt-in duy nhất.

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

Trạng thái trực tiếp đủ bền vững để khôi phục hoặc chặn trùng lặp:

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

- Telegram gửi cộng với preview chỉnh sửa, với bản cuối mới sau khi preview quá cũ.
- Discord gửi cộng với preview chỉnh sửa, hủy khi có media/lỗi/trả lời tường minh.
- Slack stream gốc hoặc preview nháp tùy theo hình dạng luồng.
- Hoàn tất bài đăng nháp Mattermost.
- Hoàn tất sự kiện nháp Matrix hoặc biên tập xóa khi không khớp.
- Stream tiến độ gốc của Teams.
- QQ Bot stream hoặc fallback tích lũy.

## Bề mặt bộ điều hợp

Đích SDK công khai nên là một subpath duy nhất:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Hình dạng đích:

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

Bộ điều hợp gửi:

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

Bộ điều hợp nhận:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Trước khi ủy quyền preflight, lõi phải chạy vị từ echo dùng chung của OpenClaw
bất cứ khi nào `origin.decode` trả về metadata nguồn gốc OpenClaw. Bộ điều hợp nhận
cung cấp các dữ kiện nền tảng như tác giả bot và hình dạng phòng; lõi sở hữu quyết định
loại bỏ và thứ tự để các kênh không triển khai lại bộ lọc văn bản.

Bộ điều hợp nguồn gốc:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Lõi đặt `MessageOrigin`. Các kênh chỉ dịch nó sang và từ metadata
truyền tải gốc. Slack ánh xạ điều này tới `chat.postMessage({ metadata })` và
`message.metadata` đầu vào; Matrix có thể ánh xạ nó tới nội dung sự kiện bổ sung; các kênh
không có metadata gốc có thể dùng registry biên nhận/gửi đi khi đó là
xấp xỉ tốt nhất hiện có.

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

Bề mặt công khai mới nên hấp thụ hoặc ngừng khuyến nghị các vùng khái niệm này:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- hầu hết các cách dùng công khai của `outbound-runtime`
- các trình trợ giúp vòng đời stream nháp ad hoc

Các subpath tương thích có thể vẫn tồn tại dưới dạng wrapper, nhưng Plugin bên thứ ba mới
không nên cần chúng.

Plugin đi kèm có thể giữ các import trình trợ giúp nội bộ thông qua các subpath runtime
dành riêng trong khi di trú. Tài liệu công khai nên hướng tác giả Plugin tới
`plugin-sdk/channel-outbound` khi nó tồn tại.

## Quan hệ với đầu vào kênh

`runtime.channel.inbound.*` là cầu nối runtime trong quá trình di trú.

Nó nên trở thành một bộ điều hợp tương thích:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` ban đầu cũng nên được giữ lại:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Bề mặt runtime `channel.turn` cũ đã bị gỡ bỏ. Caller runtime dùng
`channel.inbound.*`; tài liệu kênh và subpath SDK dùng danh từ inbound/message.

## Rào chắn tương thích

Trong quá trình di trú, phân phối bền vững chung là opt-in cho mọi kênh mà
callback phân phối hiện có có hiệu ứng phụ ngoài "gửi payload này".

Các điểm vào cũ mặc định là không bền vững:

- `channel.inbound.run` và `dispatchChannelInboundReply` dùng callback
  phân phối của kênh trừ khi kênh đó cung cấp tường minh một đối tượng
  chính sách/tùy chọn bền vững đã được kiểm tra.
- `channel.inbound.runPreparedReply` vẫn do kênh sở hữu cho đến khi dispatcher đã chuẩn bị
  gọi tường minh ngữ cảnh gửi.
- Các trình trợ giúp tương thích công khai như `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, và trình trợ giúp direct-DM không bao giờ chèn
  phân phối bền vững chung trước callback `deliver` hoặc `reply` do caller cung cấp.

Đối với các kiểu cầu nối di trú, `durable: undefined` nghĩa là "không bền vững". Đường dẫn
bền vững chỉ được bật bằng một giá trị chính sách/tùy chọn tường minh. `durable:
false` có thể vẫn là cách viết tương thích, nhưng phần triển khai không nên
yêu cầu mọi kênh chưa di trú phải thêm nó.

Mã cầu nối hiện tại phải giữ quyết định độ bền ở dạng tường minh:

- Phân phối cuối cùng bền vững trả về một trạng thái phân biệt. `handled_visible` và
  `handled_no_send` là trạng thái kết thúc; `unsupported` và `not_applicable` có thể quay
  về phân phối do kênh sở hữu; `failed` lan truyền lỗi gửi.
- Phân phối cuối cùng bền vững tổng quát được kiểm soát bởi các khả năng của adapter như
  phân phối im lặng, bảo toàn đích trả lời, bảo toàn trích dẫn gốc, và
  hook gửi tin nhắn. Khi thiếu tương đương, hãy chọn phân phối do kênh sở hữu,
  không phải một lệnh gửi tổng quát làm thay đổi hành vi hiển thị với người dùng.
- Các lệnh gửi bền vững dựa trên hàng đợi cung cấp một tham chiếu ý định phân phối. Các
  trường phiên `pendingFinalDelivery*` hiện có có thể mang id ý định trong quá trình
  chuyển tiếp; trạng thái cuối là một kho `MessageSendIntent` thay vì văn bản
  trả lời bị đóng băng cộng với các trường ngữ cảnh tùy tiện.

Không bật đường dẫn bền vững tổng quát cho một kênh cho đến khi tất cả điều sau
đều đúng:

- Adapter gửi tổng quát thực thi cùng hành vi kết xuất và truyền tải như
  đường dẫn trực tiếp cũ.
- Các hiệu ứng phụ cục bộ sau khi gửi được bảo toàn thông qua ngữ cảnh gửi.
- Adapter trả về biên nhận hoặc kết quả phân phối với tất cả id tin nhắn của nền tảng.
- Các đường dẫn dispatcher đã chuẩn bị hoặc gọi ngữ cảnh gửi mới, hoặc vẫn được ghi tài liệu
  là nằm ngoài bảo đảm bền vững.
- Phân phối dự phòng xử lý mọi payload đã chiếu, không chỉ payload đầu tiên.
- Phân phối dự phòng bền vững ghi lại toàn bộ mảng payload đã chiếu như một
  ý định có thể phát lại hoặc kế hoạch lô duy nhất.

Các rủi ro di trú cụ thể cần bảo toàn:

- Phân phối của trình giám sát iMessage ghi lại tin nhắn đã gửi trong bộ đệm echo sau một
  lần gửi thành công. Các lệnh gửi cuối cùng bền vững vẫn phải điền bộ đệm đó, nếu không
  OpenClaw có thể nạp lại các phản hồi cuối cùng của chính nó như tin nhắn người dùng gửi đến.
- Tlon thêm một chữ ký mô hình tùy chọn và ghi lại các luồng đã tham gia
  sau phản hồi nhóm. Phân phối bền vững tổng quát không được bỏ qua các hiệu ứng đó;
  hoặc chuyển chúng vào adapter kết xuất/gửi/hoàn tất của Tlon, hoặc giữ Tlon trên
  đường dẫn do kênh sở hữu.
- Discord và các dispatcher đã chuẩn bị khác đã sở hữu hành vi phân phối trực tiếp và
  xem trước. Chúng không được bao phủ bởi bảo đảm bền vững của lượt đã lắp ráp cho đến khi
  dispatcher đã chuẩn bị của chúng định tuyến rõ ràng các phản hồi cuối qua ngữ cảnh gửi.
- Phân phối dự phòng im lặng của Telegram phải phân phối toàn bộ mảng payload đã chiếu.
  Một lối tắt một payload có thể làm rơi các payload dự phòng bổ sung sau
  khi chiếu.
- LINE, Zalo, Nostr, và các đường dẫn đã lắp ráp/trợ giúp hiện có khác có thể
  có xử lý mã thông báo trả lời, proxy media, bộ đệm tin nhắn đã gửi, dọn dẹp tải/trạng thái,
  hoặc đích chỉ callback. Chúng vẫn ở phân phối do kênh sở hữu cho đến khi
  các ngữ nghĩa đó được biểu diễn bởi adapter gửi và được xác minh bằng kiểm thử.
- Các trình trợ giúp Direct-DM có thể có một callback trả lời là đích truyền tải
  đúng duy nhất. Đầu ra tổng quát không được đoán từ `OriginatingTo` hoặc `To` và bỏ qua
  callback đó.
- Đầu ra lỗi Gateway của OpenClaw phải vẫn hiển thị với con người, nhưng các echo phòng
  do bot tạo đã gắn thẻ phải bị loại bỏ trước khi ủy quyền `allowBots`.
  Kênh không được triển khai điều này bằng bộ lọc tiền tố văn bản hiển thị, ngoại trừ như một
  biện pháp chặn khẩn cấp ngắn hạn; hợp đồng bền vững là siêu dữ liệu nguồn gốc có cấu trúc.

## Lưu trữ nội bộ

Hàng đợi bền vững nên lưu ý định gửi tin nhắn, không phải payload trả lời.

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

Hàng đợi nên giữ đủ định danh để phát lại qua cùng tài khoản,
luồng, đích, chính sách định dạng, và quy tắc media sau khi khởi động lại.

## Lớp lỗi

Adapter kênh phân loại lỗi truyền tải vào các danh mục đóng:

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
- Với `not_found`, cho phép hoàn tất trực tiếp quay về từ chỉnh sửa sang gửi mới khi
  kênh tuyên bố điều đó là an toàn.
- Với `conflict`, dùng quy tắc biên nhận/idempotency để quyết định liệu tin nhắn
  đã tồn tại hay chưa.
- Bất kỳ lỗi nào sau khi adapter có thể đã hoàn tất I/O nền tảng nhưng trước khi commit
  biên nhận sẽ trở thành `unknown_after_send` trừ khi adapter có thể chứng minh thao tác
  nền tảng đã không xảy ra.

## Ánh xạ kênh

| Kênh            | Mục tiêu di chuyển                                                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Nhận chính sách xác nhận cùng với các lượt gửi cuối bền vững. Bộ điều hợp trực tiếp sở hữu việc gửi cùng với chỉnh sửa bản xem trước, gửi cuối cho bản xem trước cũ, chủ đề, bỏ qua bản xem trước trả lời trích dẫn, phương án dự phòng cho phương tiện, và xử lý retry-after.                                                                    |
| Discord         | Bộ điều hợp gửi bọc việc phân phối payload bền vững hiện có. Bộ điều hợp trực tiếp sở hữu chỉnh sửa bản nháp, bản nháp tiến trình, hủy bản xem trước phương tiện/lỗi, bảo toàn đích trả lời, và biên nhận id tin nhắn. Kiểm tra các echo lỗi gateway do bot tạo trong phòng dùng chung; dùng sổ đăng ký gửi ra hoặc tương đương native khác nếu Discord không thể mang siêu dữ liệu nguồn gốc trên tin nhắn thông thường. |
| Slack           | Bộ điều hợp gửi xử lý các bài đăng trò chuyện thông thường. Bộ điều hợp trực tiếp chọn luồng native khi hình dạng thread hỗ trợ, nếu không thì dùng bản xem trước nháp. Biên nhận bảo toàn dấu thời gian thread. Bộ điều hợp nguồn gốc ánh xạ lỗi gateway của OpenClaw sang Slack `chat.postMessage.metadata` và loại bỏ các echo phòng bot được gắn thẻ trước khi ủy quyền `allowBots`. |
| WhatsApp        | Bộ điều hợp gửi sở hữu việc gửi văn bản/phương tiện với các ý định cuối bền vững. Bộ điều hợp nhận xử lý nhắc đến nhóm và danh tính người gửi. Trực tiếp có thể tiếp tục vắng mặt cho đến khi WhatsApp có transport có thể chỉnh sửa.                                                                                                           |
| Matrix          | Bộ điều hợp trực tiếp sở hữu chỉnh sửa sự kiện nháp, hoàn tất, biên tập lại, ràng buộc phương tiện được mã hóa, và phương án dự phòng khi đích trả lời không khớp. Bộ điều hợp nhận sở hữu nạp sự kiện được mã hóa và khử trùng lặp. Bộ điều hợp nguồn gốc nên mã hóa nguồn gốc lỗi gateway của OpenClaw vào nội dung sự kiện Matrix và loại bỏ các echo phòng bot đã cấu hình trước khi xử lý `allowBots`. |
| Mattermost      | Bộ điều hợp trực tiếp sở hữu một bài đăng nháp, gộp tiến trình/công cụ, hoàn tất tại chỗ, và phương án dự phòng gửi mới.                                                                                                                                                                                                                           |
| Microsoft Teams | Bộ điều hợp trực tiếp sở hữu tiến trình native và hành vi luồng khối. Bộ điều hợp gửi sở hữu các hoạt động và biên nhận tệp đính kèm/thẻ.                                                                                                                                                                                                           |
| Feishu          | Bộ điều hợp kết xuất sở hữu kết xuất văn bản/thẻ/thô. Bộ điều hợp trực tiếp sở hữu thẻ phát trực tuyến và chặn bản cuối trùng lặp. Bộ điều hợp gửi sở hữu bình luận, phiên chủ đề, phương tiện, và chặn giọng nói.                                                                                                                                  |
| QQ Bot          | Bộ điều hợp trực tiếp sở hữu phát trực tuyến C2C, thời gian chờ của bộ tích lũy, và gửi cuối dự phòng. Bộ điều hợp kết xuất sở hữu thẻ phương tiện và văn bản-dưới-dạng-giọng-nói.                                                                                                                                                                  |
| Signal          | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi. Không có bộ điều hợp trực tiếp trừ khi signal-cli bổ sung hỗ trợ chỉnh sửa đáng tin cậy.                                                                                                                                                                                                         |
| iMessage        | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi. Việc gửi iMessage phải bảo toàn việc điền echo-cache của bộ giám sát trước khi các bản cuối bền vững có thể bỏ qua phân phối qua bộ giám sát.                                                                                                                                                  |
| Google Chat     | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, trong đó quan hệ thread được ánh xạ sang spaces và id thread. Kiểm tra hành vi phòng `allowBots=true` đối với các echo lỗi gateway OpenClaw được gắn thẻ.                                                                                                                                       |
| LINE            | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, trong đó các ràng buộc reply-token được mô hình hóa như năng lực đích/quan hệ.                                                                                                                                                                                                                  |
| Nextcloud Talk  | Cầu nhận SDK cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                             |
| IRC             | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi, không có biên nhận chỉnh sửa bền vững.                                                                                                                                                                                                                                                         |
| Nostr           | Bộ điều hợp nhận cùng với bộ điều hợp gửi cho DM được mã hóa; biên nhận là id sự kiện.                                                                                                                                                                                                                                                             |
| QA Channel      | Bộ điều hợp kiểm thử hợp đồng cho hành vi nhận, gửi, trực tiếp, thử lại, và khôi phục.                                                                                                                                                                                                                                                             |
| Synology Chat   | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                |
| Tlon            | Bộ điều hợp gửi phải bảo toàn kết xuất chữ ký mô hình và theo dõi thread đã tham gia trước khi bật phân phối cuối bền vững chung.                                                                                                                                                                                                                  |
| Twitch          | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi có phân loại giới hạn tốc độ.                                                                                                                                                                                                                                                                   |
| Zalo            | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                |
| Zalo Personal   | Bộ điều hợp nhận đơn giản cùng với bộ điều hợp gửi.                                                                                                                                                                                                                                                                                                |

## Kế hoạch di chuyển

### Giai đoạn 1: Miền tin nhắn nội bộ

- Thêm các kiểu `src/channels/message/*` cho tin nhắn, đích, quan hệ,
  nguồn gốc, biên nhận, năng lực, ý định bền vững, ngữ cảnh nhận, ngữ cảnh gửi,
  ngữ cảnh trực tiếp, và lớp lỗi.
- Thêm `origin?: MessageOrigin` vào kiểu payload cầu di chuyển được dùng bởi
  phân phối trả lời hiện tại, sau đó chuyển trường đó sang `ChannelMessage` và các
  kiểu tin nhắn đã kết xuất khi quá trình tái cấu trúc thay thế payload trả lời.
- Giữ phần này ở nội bộ cho đến khi các bộ điều hợp và kiểm thử chứng minh được hình dạng.
- Thêm kiểm thử đơn vị thuần cho chuyển đổi trạng thái và tuần tự hóa.

### Giai đoạn 2: Lõi gửi bền vững

- Chuyển hàng đợi gửi ra hiện có từ độ bền payload trả lời sang các ý định
  gửi tin nhắn bền vững.
- Cho phép một ý định gửi bền vững mang một mảng payload đã chiếu hoặc kế hoạch batch,
  không chỉ một payload trả lời.
- Bảo toàn hành vi khôi phục hàng đợi hiện tại thông qua chuyển đổi tương thích.
- Khiến `deliverOutboundPayloads` gọi `messages.send`.
- Đặt độ bền gửi cuối làm mặc định và đóng khi lỗi nếu không thể ghi ý định bền vững
  trong vòng đời tin nhắn mới, sau khi bộ điều hợp khai báo an toàn phát lại.
  Các đường dẫn runner gửi đến hiện có và tương thích SDK vẫn mặc định gửi trực tiếp
  trong giai đoạn này.
- Ghi biên nhận nhất quán.
- Trả biên nhận và kết quả phân phối cho caller dispatcher ban đầu thay vì coi
  gửi bền vững là tác dụng phụ kết thúc.
- Lưu nguồn gốc tin nhắn qua các ý định gửi bền vững để khôi phục, phát lại, và
  gửi theo khúc giữ được xuất xứ vận hành của OpenClaw.

### Giai đoạn 3: Cầu gửi đến của kênh

- Triển khai lại `channel.inbound.run` và `dispatchChannelInboundReply` trên nền
  `messages.receive` và `messages.send`.
- Giữ ổn định các kiểu fact hiện tại.
- Giữ hành vi legacy theo mặc định. Một kênh assembled-turn chỉ trở nên bền vững
  khi bộ điều hợp của nó chọn tham gia rõ ràng bằng chính sách độ bền an toàn phát lại.
- Giữ `durable: false` làm lối thoát tương thích cho các đường dẫn hoàn tất
  chỉnh sửa native và chưa thể phát lại an toàn, nhưng không dựa vào các dấu `false`
  để bảo vệ các kênh chưa di chuyển.
- Chỉ mặc định độ bền assembled-turn trong vòng đời tin nhắn mới, sau khi ánh xạ
  kênh chứng minh đường gửi chung bảo toàn ngữ nghĩa phân phối cũ của kênh.

### Giai đoạn 4: Cầu dispatcher đã chuẩn bị

- Thay `deliverDurableInboundReplyPayload` bằng cầu nối ngữ cảnh gửi.
- Giữ helper cũ dưới dạng wrapper.
- Chuyển Telegram, WhatsApp, Slack, Signal, iMessage và Discord trước vì
  chúng đã có công việc final bền vững hoặc đường gửi đơn giản hơn.
- Xem mọi dispatcher đã chuẩn bị là chưa được bao phủ cho đến khi nó chọn tham gia rõ ràng vào
  ngữ cảnh gửi. Tài liệu và mục changelog phải nói "các lượt kênh đã được lắp ráp"
  hoặc nêu tên các đường kênh đã di trú, thay vì tuyên bố tất cả
  phản hồi final tự động.
- Giữ `recordInboundSessionAndDispatchReply`, các helper DM trực tiếp và các
  helper tương thích công khai tương tự sao cho bảo toàn hành vi. Sau này chúng có thể
  phơi bày lựa chọn tham gia ngữ cảnh gửi rõ ràng, nhưng không được tự động thử
  phân phối bền vững chung trước callback phân phối do caller sở hữu.

### Giai đoạn 5: Vòng đời live hợp nhất

- Xây dựng `messages.live` với hai adapter chứng minh:
  - Telegram cho gửi cộng sửa cộng gửi final lỗi thời.
  - Matrix cho hoàn tất bản nháp final cộng fallback biên tập lại.
- Sau đó di trú Discord, Slack, Mattermost, Teams, QQ Bot và Feishu.
- Chỉ xóa mã hoàn tất preview bị trùng lặp sau khi mỗi kênh có
  kiểm thử tương đương.

### Giai đoạn 6: SDK công khai

- Thêm `openclaw/plugin-sdk/channel-outbound`.
- Ghi tài liệu nó là API Plugin kênh được ưu tiên.
- Cập nhật package exports, inventory entrypoint, baseline API được tạo và
  tài liệu SDK Plugin.
- Bao gồm `MessageOrigin`, các hook encode/decode nguồn gốc và predicate dùng chung
  `shouldDropOpenClawEcho` trong bề mặt SDK channel-outbound.
- Giữ wrapper tương thích cho các subpath cũ.
- Đánh dấu các helper SDK mang tên reply là đã lỗi thời trong tài liệu sau khi các Plugin
  đóng gói được di trú.

### Giai đoạn 7: Tất cả bộ gửi

Chuyển mọi producer outbound không phải reply sang `messages.send`:

- thông báo Cron và Heartbeat
- hoàn tất tác vụ
- kết quả hook
- lời nhắc phê duyệt và kết quả phê duyệt
- lượt gửi của công cụ tin nhắn
- thông báo hoàn tất subagent
- lượt gửi CLI hoặc Control UI rõ ràng
- đường tự động hóa/phát sóng

Đây là nơi mô hình ngừng là "phản hồi của agent" và trở thành "OpenClaw gửi
tin nhắn".

### Giai đoạn 8: Xóa tương thích mang tên turn

- Giữ các wrapper mang tên inbound/message làm cửa sổ tương thích.
- Xuất bản ghi chú di trú.
- Chạy kiểm thử tương thích SDK Plugin với các import cũ.
- Chỉ xóa hoặc ẩn helper nội bộ cũ sau khi không Plugin đóng gói nào còn cần chúng
  và hợp đồng bên thứ ba đã có phần thay thế ổn định.

## Kế hoạch kiểm thử

Kiểm thử đơn vị:

- Tuần tự hóa và khôi phục intent gửi bền vững.
- Tái sử dụng khóa idempotency và triệt tiêu trùng lặp.
- Commit receipt và bỏ qua phát lại.
- Khôi phục `unknown_after_send` có đối chiếu trước khi phát lại khi adapter
  hỗ trợ đối chiếu.
- Chính sách phân loại lỗi.
- Trình tự chính sách ack nhận.
- Ánh xạ quan hệ cho lượt gửi reply, followup, system và broadcast.
- Factory nguồn gốc lỗi Gateway và predicate `shouldDropOpenClawEcho`.
- Bảo toàn nguồn gốc qua chuẩn hóa payload, chia chunk, tuần tự hóa hàng đợi bền vững
  và khôi phục.

Kiểm thử tích hợp:

- Adapter đơn giản `channel.inbound.run` vẫn ghi lại và gửi.
- Phân phối sự kiện đã lắp ráp cũ không trở thành bền vững trừ khi kênh
  chọn tham gia rõ ràng.
- Cầu nối `channel.inbound.runPreparedReply` vẫn ghi lại và hoàn tất.
- Helper tương thích công khai mặc định gọi callback phân phối do caller sở hữu
  và không generic-send trước các callback đó.
- Phân phối fallback bền vững phát lại toàn bộ mảng payload đã chiếu sau khi
  khởi động lại và không thể để các payload sau chưa được ghi lại sau sự cố sớm.
- Phân phối sự kiện đã lắp ráp bền vững trả về id tin nhắn nền tảng cho dispatcher
  đã buffer.
- Hook phân phối tùy chỉnh vẫn trả về id tin nhắn nền tảng khi phân phối bền vững
  bị tắt hoặc không khả dụng.
- Reply final tồn tại qua lần khởi động lại giữa lúc assistant hoàn tất và gửi nền tảng.
- Bản nháp preview hoàn tất tại chỗ khi được phép.
- Bản nháp preview bị hủy hoặc biên tập lại khi media/lỗi/đích reply không khớp
  yêu cầu phân phối bình thường.
- Streaming khối và streaming preview không cùng phân phối một văn bản.
- Media được stream sớm không bị nhân đôi trong phân phối final.

Kiểm thử kênh:

- Reply chủ đề Telegram với ack polling bị trì hoãn đến watermark hoàn tất an toàn
  của ngữ cảnh nhận.
- Khôi phục polling Telegram cho cập nhật đã chấp nhận nhưng chưa phân phối, được bao phủ bởi
  mô hình offset hoàn tất an toàn đã lưu bền vững.
- Preview lỗi thời của Telegram gửi final mới và dọn dẹp preview.
- Fallback im lặng của Telegram gửi mọi payload fallback đã chiếu.
- Độ bền fallback im lặng của Telegram ghi lại toàn bộ mảng fallback đã chiếu
  một cách nguyên tử, không phải một intent bền vững đơn payload cho mỗi vòng lặp.
- Hủy preview Discord khi có media/lỗi/reply rõ ràng.
- Final của dispatcher đã chuẩn bị trong Discord đi qua ngữ cảnh gửi trước khi tài liệu
  hoặc changelog tuyên bố độ bền final-reply của Discord.
- Lượt gửi final bền vững iMessage điền cache echo tin nhắn đã gửi của monitor.
- Các đường phân phối cũ của LINE, Zalo và Nostr không bị bỏ qua bởi
  lượt gửi bền vững chung cho đến khi kiểm thử tương đương adapter của chúng tồn tại.
- Phân phối callback Direct-DM/Nostr vẫn là nguồn thẩm quyền trừ khi được di trú rõ ràng
  sang đích tin nhắn hoàn chỉnh và adapter gửi an toàn khi phát lại.
- Tin nhắn lỗi Gateway OpenClaw được gắn tag của Slack vẫn hiển thị outbound, echo phòng bot
  được gắn tag bị loại trước `allowBots`, và tin nhắn bot không gắn tag có cùng
  văn bản hiển thị vẫn theo ủy quyền bot bình thường.
- Fallback stream gốc của Slack sang preview bản nháp trong DM cấp cao nhất.
- Hoàn tất preview Matrix và fallback biên tập lại.
- Echo phòng lỗi Gateway OpenClaw được gắn tag của Matrix từ tài khoản bot đã cấu hình
  bị loại trước xử lý `allowBots`.
- Audit chuỗi lỗi Gateway trong phòng chung của Discord và Google Chat bao phủ
  các chế độ `allowBots` trước khi tuyên bố bảo vệ chung ở đó.
- Hoàn tất bản nháp Mattermost và fallback gửi mới.
- Hoàn tất tiến trình gốc Teams.
- Triệt tiêu final trùng lặp Feishu.
- Fallback timeout bộ tích lũy QQ Bot.
- Lượt gửi final bền vững Tlon bảo toàn render chữ ký mô hình và theo dõi thread
  đã tham gia.
- Lượt gửi final bền vững đơn giản của WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo và Zalo Personal.

Xác thực:

- Các tệp Vitest có mục tiêu trong quá trình phát triển.
- `pnpm check:changed` trong Testbox cho toàn bộ bề mặt đã thay đổi.
- `pnpm check` rộng hơn trong Testbox trước khi landing toàn bộ refactor hoặc sau
  thay đổi SDK/export công khai.
- Smoke live hoặc qa-channel cho ít nhất một kênh có khả năng sửa và một
  kênh chỉ gửi đơn giản trước khi xóa wrapper tương thích.

## Câu hỏi mở

- Liệu Telegram cuối cùng có nên thay nguồn runner grammY bằng một
  nguồn polling hoàn toàn bền vững có thể kiểm soát phân phối lại ở cấp nền tảng, không
  chỉ watermark khởi động lại đã lưu bền vững của OpenClaw.
- Liệu trạng thái preview live bền vững nên được lưu trong cùng bản ghi hàng đợi
  với intent gửi final hay trong một kho trạng thái live ngang hàng.
- Wrapper tương thích còn được ghi tài liệu trong bao lâu sau khi
  `plugin-sdk/channel-outbound` được phát hành.
- Liệu Plugin bên thứ ba nên triển khai adapter nhận trực tiếp hay chỉ
  cung cấp hook normalize/send/live thông qua `defineChannelMessageAdapter`.
- Trường receipt nào an toàn để phơi bày trong SDK công khai so với trạng thái runtime
  nội bộ.
- Liệu các side effect như cache self-echo và marker thread đã tham gia
  nên được mô hình hóa thành hook ngữ cảnh gửi, bước finalize do adapter sở hữu, hay
  subscriber receipt.
- Kênh nào có metadata nguồn gốc gốc, kênh nào cần registry outbound được lưu bền vững,
  và kênh nào không thể cung cấp triệt tiêu echo liên bot đáng tin cậy.

## Tiêu chí chấp nhận

- Mọi kênh tin nhắn đóng gói gửi đầu ra final hiển thị thông qua
  `messages.send`.
- Mọi kênh tin nhắn inbound đi vào thông qua `messages.receive` hoặc một
  wrapper tương thích đã ghi tài liệu.
- Mọi kênh preview/edit/stream dùng `messages.live` cho trạng thái bản nháp và
  hoàn tất.
- `channel.inbound` chỉ là một wrapper.
- Helper SDK mang tên reply là export tương thích, không phải đường được khuyến nghị.
- Khôi phục bền vững có thể phát lại lượt gửi final đang chờ sau khi khởi động lại mà không làm mất
  phản hồi final hoặc nhân đôi lượt gửi đã commit; lượt gửi có
  kết quả nền tảng không xác định được đối chiếu trước khi phát lại hoặc được ghi tài liệu là
  ít-nhất-một-lần cho adapter đó.
- Lượt gửi final bền vững fail closed khi intent bền vững không thể được ghi,
  trừ khi caller chọn rõ ràng một chế độ không bền vững đã ghi tài liệu.
- Helper tương thích SDK cũ mặc định dùng phân phối trực tiếp
  do kênh sở hữu; lượt gửi bền vững chung chỉ là lựa chọn tham gia rõ ràng.
- Receipt bảo toàn mọi id tin nhắn nền tảng cho phân phối nhiều phần và một
  id chính để tiện threading/edit.
- Wrapper bền vững bảo toàn side effect cục bộ của kênh trước khi thay thế callback
  phân phối trực tiếp.
- Dispatcher đã chuẩn bị không được tính là bền vững cho đến khi đường phân phối final
  của chúng dùng rõ ràng ngữ cảnh gửi.
- Phân phối fallback xử lý mọi payload đã chiếu.
- Phân phối fallback bền vững ghi lại mọi payload đã chiếu trong một intent
  hoặc kế hoạch batch có thể phát lại.
- Đầu ra lỗi Gateway có nguồn gốc từ OpenClaw hiển thị cho con người nhưng echo phòng
  do bot viết và được gắn tag bị loại trước ủy quyền bot trên các kênh
  khai báo hỗ trợ hợp đồng nguồn gốc.
- Tài liệu giải thích gửi, nhận, live, trạng thái, receipt, quan hệ, chính sách
  lỗi, di trú và phạm vi kiểm thử.

## Liên quan

- [Tin nhắn](/vi/concepts/messages)
- [Streaming và chia chunk](/vi/concepts/streaming)
- [Bản nháp tiến trình](/vi/concepts/progress-drafts)
- [Chính sách thử lại](/vi/concepts/retry)
- [API inbound của kênh](/vi/plugins/sdk-channel-inbound)
