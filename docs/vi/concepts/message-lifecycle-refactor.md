---
read_when:
    - Tái cấu trúc hành vi gửi hoặc nhận của kênh
    - Thay đổi lượt kênh, điều phối phản hồi, hàng đợi gửi đi, phát trực tuyến bản xem trước, hoặc API thông điệp SDK Plugin
    - Thiết kế một Plugin kênh mới cần tính năng gửi bền bỉ, biên nhận, bản xem trước, chỉnh sửa hoặc thử lại
summary: Kế hoạch thiết kế cho vòng đời nhận, gửi, xem trước, chỉnh sửa và truyền phát thông điệp bền vững hợp nhất
title: Tái cấu trúc vòng đời tin nhắn
x-i18n:
    generated_at: "2026-05-10T19:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Trang này là thiết kế mục tiêu để thay thế các helper rải rác về lượt kênh, điều phối phản hồi,
phát trực tuyến bản xem trước, và phân phối đi bằng một vòng đời thông điệp bền vững
duy nhất.

Phiên bản ngắn gọn:

- Các primitive cốt lõi nên là **nhận** và **gửi**, không phải **phản hồi**.
- Một phản hồi chỉ là một quan hệ trên một thông điệp đi.
- Một lượt là tiện ích xử lý đầu vào, không phải chủ sở hữu của việc phân phối.
- Việc gửi phải dựa trên ngữ cảnh: `begin`, render, xem trước hoặc phát trực tuyến, gửi cuối cùng,
  commit, fail.
- Việc nhận cũng phải dựa trên ngữ cảnh: chuẩn hóa, khử trùng lặp, định tuyến, ghi nhận,
  điều phối, ack nền tảng, fail.
- SDK Plugin công khai nên thu gọn thành một bề mặt thông điệp kênh nhỏ duy nhất.

## Vấn đề

Ngăn xếp kênh hiện tại phát triển từ nhiều nhu cầu cục bộ hợp lệ:

- Adapter đầu vào đơn giản dùng `runtime.channel.turn.run`.
- Adapter phong phú dùng `runtime.channel.turn.runPrepared`.
- Helper cũ dùng `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper payload phản hồi, chia đoạn phản hồi,
  tham chiếu phản hồi, và helper runtime đầu ra.
- Phát trực tuyến bản xem trước nằm trong các bộ điều phối riêng theo kênh.
- Độ bền của phân phối cuối cùng đang được bổ sung quanh các đường dẫn payload phản hồi hiện có.

Hình dạng đó sửa các lỗi cục bộ, nhưng nó khiến OpenClaw có quá nhiều
khái niệm công khai và quá nhiều nơi mà ngữ nghĩa phân phối có thể lệch nhau.

Vấn đề độ tin cậy làm lộ điều này là:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Bất biến mục tiêu rộng hơn Telegram: một khi core quyết định rằng một
thông điệp đi hiển thị nên tồn tại, ý định đó phải bền vững trước khi lệnh
gửi đến nền tảng được thử, và biên nhận nền tảng phải được commit sau khi thành công.
Điều đó mang lại cho OpenClaw khả năng khôi phục at-least-once. Hành vi exactly-once chỉ tồn tại
cho các adapter có thể chứng minh tính bất biến gốc hoặc đối chiếu một lần thử
không rõ kết quả sau khi gửi với trạng thái nền tảng trước khi phát lại.

Đó là trạng thái cuối của lần tái cấu trúc này, không phải mô tả của mọi đường dẫn hiện tại.
Trong quá trình di chuyển, các helper đầu ra hiện có vẫn có thể rơi về
gửi trực tiếp khi ghi hàng đợi theo best-effort thất bại. Việc tái cấu trúc chỉ hoàn tất
khi các lần gửi cuối bền vững fail closed hoặc chọn không tham gia một cách rõ ràng bằng một
chính sách không bền vững đã được tài liệu hóa.

## Mục tiêu

- Một vòng đời core duy nhất cho mọi đường dẫn nhận và gửi thông điệp kênh.
- Gửi cuối bền vững theo mặc định trong vòng đời thông điệp mới sau khi một adapter
  khai báo hành vi an toàn để phát lại.
- Ngữ nghĩa xem trước, chỉnh sửa, phát trực tuyến, hoàn tất, thử lại, khôi phục và biên nhận
  được chia sẻ.
- Một bề mặt SDK Plugin nhỏ mà Plugin bên thứ ba có thể học và duy trì.
- Tương thích cho các caller `channel.turn` hiện có trong quá trình di chuyển.
- Điểm mở rộng rõ ràng cho năng lực kênh mới.
- Không có nhánh riêng theo nền tảng trong core.
- Không có thông điệp kênh delta token. Phát trực tuyến kênh vẫn là xem trước thông điệp,
  chỉnh sửa, nối thêm, hoặc phân phối khối đã hoàn tất.
- Metadata có cấu trúc có nguồn gốc từ OpenClaw cho đầu ra vận hành/hệ thống để các lỗi
  Gateway hiển thị không nhập lại các phòng dùng bot chung như prompt mới.

## Không phải mục tiêu

- Không xóa `runtime.channel.turn.*` trong giai đoạn đầu.
- Không ép mọi kênh vào cùng một hành vi vận chuyển gốc.
- Không dạy core về chủ đề Telegram, luồng gốc Slack, redaction Matrix,
  thẻ Feishu, giọng nói QQ, hoặc hoạt động Teams.
- Không xuất bản mọi helper di chuyển nội bộ như API SDK ổn định.
- Không để retry phát lại các thao tác nền tảng không idempotent đã hoàn tất.

## Mô hình tham chiếu

Vercel Chat có một mô hình tinh thần công khai tốt:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- các phương thức adapter như `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, và truy xuất lịch sử
- một adapter trạng thái cho khử trùng lặp, khóa, hàng đợi và lưu bền vững

OpenClaw nên mượn từ vựng, không sao chép bề mặt.

Những gì OpenClaw cần ngoài mô hình đó:

- Ý định gửi đi bền vững trước các lệnh gọi vận chuyển trực tiếp.
- Ngữ cảnh gửi rõ ràng với begin, commit và fail.
- Ngữ cảnh nhận biết chính sách ack của nền tảng.
- Biên nhận tồn tại qua khởi động lại và có thể thúc đẩy chỉnh sửa, xóa, khôi phục và
  triệt tiêu trùng lặp.
- SDK công khai nhỏ hơn. Plugin được đóng gói có thể dùng helper runtime nội bộ, nhưng
  Plugin bên thứ ba nên thấy một API thông điệp nhất quán duy nhất.
- Hành vi riêng theo agent: phiên, bản ghi hội thoại, phát trực tuyến khối, tiến trình công cụ,
  phê duyệt, chỉ thị media, phản hồi im lặng và lịch sử nhắc đến nhóm.

Các promise kiểu `thread.post()` là chưa đủ cho OpenClaw. Chúng che giấu
ranh giới giao dịch quyết định một lần gửi có thể khôi phục hay không.

## Mô hình core

Miền mới nên nằm dưới một namespace core nội bộ như
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

`live` sở hữu trạng thái xem trước, chỉnh sửa, tiến trình và phát trực tuyến.

`state` sở hữu lưu trữ ý định bền vững, biên nhận, idempotency, khôi phục, khóa và
khử trùng lặp.

## Thuật ngữ thông điệp

### Thông điệp

Một thông điệp đã chuẩn hóa là trung lập với nền tảng:

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

Đích mô tả nơi thông điệp tồn tại:

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

Phản hồi là một quan hệ, không phải gốc API:

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

Điều này cho phép cùng một đường gửi xử lý phản hồi thông thường, thông báo Cron, prompt
phê duyệt, hoàn tất tác vụ, lần gửi bằng message-tool, lần gửi từ CLI hoặc Control UI, kết quả subagent,
và lần gửi tự động hóa.

### Nguồn gốc

Nguồn gốc mô tả ai đã tạo một thông điệp và OpenClaw nên xử lý echo của
thông điệp đó như thế nào. Nó tách biệt với quan hệ: một thông điệp có thể là phản hồi cho người dùng
và vẫn là đầu ra vận hành có nguồn gốc từ OpenClaw.

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

Core sở hữu ý nghĩa của đầu ra có nguồn gốc từ OpenClaw. Kênh sở hữu cách
nguồn gốc đó được mã hóa vào vận chuyển của chúng.

Trường hợp bắt buộc đầu tiên là đầu ra lỗi Gateway. Con người vẫn nên thấy
các thông điệp như "Agent failed before reply" hoặc "Missing API key", nhưng đầu ra vận hành
OpenClaw đã được gắn thẻ không được chấp nhận làm đầu vào do bot tạo trong các phòng dùng chung
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

Biên nhận là cầu nối từ ý định bền vững đến chỉnh sửa, xóa, hoàn tất bản xem trước,
triệt tiêu trùng lặp và khôi phục trong tương lai.

Một biên nhận có thể mô tả một thông điệp nền tảng hoặc một lần phân phối nhiều phần. Văn bản chia đoạn,
media cộng văn bản, giọng nói cộng văn bản và fallback thẻ phải bảo toàn mọi
id nền tảng trong khi vẫn phơi bày một id chính cho luồng và chỉnh sửa sau này.

## Ngữ cảnh nhận

Việc nhận không nên là một lời gọi helper trần. Core cần một ngữ cảnh biết
khử trùng lặp, định tuyến, ghi phiên và chính sách ack nền tảng.

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

Ack không phải một thứ duy nhất. Hợp đồng nhận phải giữ các tín hiệu này tách biệt:

- **Ack vận chuyển:** báo cho webhook hoặc socket nền tảng rằng OpenClaw đã chấp nhận
  envelope sự kiện. Một số nền tảng yêu cầu điều này trước khi điều phối.
- **Ack offset polling:** tiến con trỏ để cùng một sự kiện không được lấy lại.
  Việc này không được vượt qua công việc không thể khôi phục.
- **Ack bản ghi đầu vào:** xác nhận OpenClaw đã lưu bền vững đủ metadata đầu vào để
  khử trùng lặp và định tuyến một lần phân phối lại.
- **Biên nhận hiển thị cho người dùng:** hành vi đọc/trạng thái/đang nhập tùy chọn; không bao giờ là
  ranh giới độ bền.

`ReceiveAckPolicy` chỉ kiểm soát xác nhận vận chuyển hoặc polling. Nó không được
dùng lại cho biên nhận đã đọc hoặc phản ứng trạng thái.

Trước khi cấp quyền bot, nhận phải áp dụng chính sách echo OpenClaw dùng chung
khi kênh có thể giải mã metadata nguồn gốc thông điệp:

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

Việc loại bỏ này dựa trên thẻ, không dựa trên văn bản. Một thông điệp trong phòng do bot tạo với
cùng văn bản lỗi Gateway hiển thị nhưng không có metadata nguồn gốc OpenClaw vẫn
đi qua cấp quyền `allowBots` bình thường.

Chính sách ack là rõ ràng:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling hiện dùng chính sách ack của receive-context cho watermark khởi động lại
được lưu bền vững. Bộ theo dõi vẫn quan sát cập nhật grammY khi chúng đi vào
chuỗi middleware, nhưng OpenClaw chỉ lưu bền vững id cập nhật đã hoàn tất an toàn sau
khi điều phối thành công, để các cập nhật thất bại hoặc thấp hơn đang chờ có thể phát lại sau
khởi động lại. Offset lấy `getUpdates` upstream của Telegram vẫn do
thư viện polling kiểm soát, nên phần cắt sâu còn lại là một nguồn polling hoàn toàn bền vững
nếu chúng ta cần phân phối lại ở cấp nền tảng ngoài watermark khởi động lại của OpenClaw.
Các nền tảng Webhook có thể cần ack HTTP tức thì, nhưng chúng vẫn cần
khử trùng lặp đầu vào và ý định gửi đi bền vững vì webhook có thể phân phối lại.

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

Điều phối ưu tiên:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Helper mở rộng thành:

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

Intent phải tồn tại trước I/O transport. Một lần khởi động lại sau khi begin nhưng trước
commit có thể khôi phục được.

Ranh giới nguy hiểm là sau khi nền tảng báo thành công và trước khi commit receipt. Nếu một
process chết ở đó, OpenClaw không thể biết message trên nền tảng có tồn tại hay không
trừ khi adapter cung cấp idempotency gốc hoặc một đường dẫn đối soát receipt.
Các lần thử đó phải tiếp tục trong `unknown_after_send`, không được phát lại mù quáng. Các channel
không có đối soát chỉ có thể chọn phát lại at-least-once nếu duplicate visible
messages là một đánh đổi chấp nhận được và đã được ghi tài liệu cho channel và quan hệ đó.
Bridge đối soát SDK hiện tại yêu cầu adapter khai báo
`reconcileUnknownSend`, rồi yêu cầu `durableFinal.reconcileUnknownSend`
phân loại một mục không xác định là `sent`, `not_sent`, hoặc `unresolved`; chỉ `not_sent`
cho phép phát lại, và các mục unresolved vẫn ở trạng thái terminal hoặc chỉ thử lại
bước kiểm tra đối soát.

Chính sách độ bền phải tường minh:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` nghĩa là core phải fail closed khi không thể ghi durable intent.
`best_effort` có thể tiếp tục khi persistence không khả dụng. `disabled` giữ
hành vi gửi trực tiếp cũ. Trong quá trình migration, các wrapper legacy và helper
tương thích công khai mặc định là `disabled`; chúng không được suy ra `required` từ
việc một channel có generic outbound adapter.

Send context cũng sở hữu các hiệu ứng sau gửi cục bộ của channel. Một migration không an toàn
nếu durable delivery bỏ qua hành vi cục bộ trước đây được gắn vào
đường dẫn gửi trực tiếp của channel. Ví dụ gồm cache chặn self-echo,
marker tham gia thread, anchor edit gốc, render model-signature,
và guard chống duplicate đặc thù theo nền tảng. Các hiệu ứng đó phải chuyển vào
send adapter, render adapter, hoặc một send-context hook có tên trước khi
channel đó có thể bật durable generic final delivery.

Send helper phải trả receipt ngược về đến caller của chúng. Durable
wrapper không được nuốt message id hoặc thay kết quả delivery của channel bằng
`undefined`; buffered dispatcher dùng các id đó cho thread anchor, các edit sau này,
preview finalization, và duplicate suppression.

Fallback send hoạt động trên batch, không phải payload đơn. Silent-reply rewrite,
media fallback, card fallback, và chunk projection đều có thể tạo ra nhiều hơn
một deliverable message, vì vậy một send context phải delivery toàn bộ
batch đã project hoặc ghi tài liệu tường minh lý do chỉ một payload là hợp lệ.

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

Khi fallback như vậy là durable, toàn bộ batch đã project phải được biểu diễn bằng
một durable send intent hoặc một atomic batch plan khác. Ghi từng payload
một là chưa đủ: crash giữa các payload có thể để lại một fallback hiển thị một phần
mà không có durable record cho các payload còn lại. Recovery phải biết
những unit nào đã có receipt và hoặc chỉ phát lại các unit còn thiếu hoặc đánh dấu
batch là `unknown_after_send` cho đến khi adapter đối soát nó.

## Ngữ cảnh trực tiếp

Hành vi preview, edit, progress, và stream nên là một lifecycle opt-in duy nhất.

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

Live state đủ bền để khôi phục hoặc chặn duplicate:

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

- Telegram gửi kèm edit preview, với final mới sau khi preview quá tuổi stale.
- Discord gửi kèm edit preview, cancel khi có media/error/explicit reply.
- Slack native stream hoặc draft preview tùy theo hình dạng thread.
- Mattermost draft post finalization.
- Matrix draft event finalization hoặc redaction khi không khớp.
- Teams native progress stream.
- QQ Bot stream hoặc fallback tích lũy.

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

Send adapter:

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

Receive adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Trước preflight authorization, core phải chạy predicate echo dùng chung của OpenClaw
bất cứ khi nào `origin.decode` trả về metadata có nguồn gốc OpenClaw. Receive adapter
cung cấp các fact của nền tảng như tác giả bot và hình dạng room; core sở hữu quyết định
drop và thứ tự để channel không triển khai lại bộ lọc text.

Origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core đặt `MessageOrigin`. Channel chỉ dịch nó sang và từ metadata
transport gốc. Slack ánh xạ phần này sang `chat.postMessage({ metadata })` và
`message.metadata` inbound; Matrix có thể ánh xạ nó sang nội dung event bổ sung; các channel
không có metadata gốc có thể dùng receipt/outbound registry khi đó là
xấp xỉ tốt nhất hiện có.

Capabilities:

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

Bề mặt công khai mới nên hấp thụ hoặc deprecate các vùng khái niệm này:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- hầu hết các cách dùng công khai của `outbound-runtime`
- các helper lifecycle draft stream ad hoc

Các subpath tương thích có thể vẫn tồn tại dưới dạng wrapper, nhưng Plugin bên thứ ba mới
không nên cần đến chúng.

Bundled Plugin có thể giữ import helper nội bộ thông qua các reserved runtime
subpath trong khi migration. Tài liệu công khai nên hướng tác giả Plugin đến
`plugin-sdk/channel-message` sau khi nó tồn tại.

## Quan hệ với channel turn

`runtime.channel.turn.*` nên được giữ trong quá trình migration.

Nó nên trở thành một adapter tương thích:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` ban đầu cũng nên được giữ lại:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Sau khi tất cả bundled Plugin và các đường dẫn tương thích bên thứ ba đã biết được bridge,
`channel.turn` có thể bị deprecate. Không nên xóa nó cho đến khi có
đường dẫn migration SDK đã publish và contract test chứng minh Plugin cũ vẫn hoạt động
hoặc fail với lỗi phiên bản rõ ràng.

## Lan can tương thích

Trong quá trình migration, generic durable delivery là opt-in cho mọi channel có
delivery callback hiện tại có side effect ngoài "send this payload".

Các entry point legacy mặc định là non-durable:

- `channel.turn.run` và `dispatchAssembledChannelTurn` dùng
  delivery callback của channel trừ khi channel đó cung cấp tường minh một đối tượng
  durable policy/options đã audit.
- `channel.turn.runPrepared` vẫn do channel sở hữu cho đến khi prepared dispatcher
  gọi send context một cách tường minh.
- Các helper tương thích công khai như `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, và direct-DM helper không bao giờ chèn generic
  durable delivery trước callback `deliver` hoặc `reply` do caller cung cấp.

Đối với các loại migration bridge, `durable: undefined` nghĩa là "không durable". Đường dẫn
durable chỉ được bật bằng một giá trị policy/options tường minh. `durable:
false` có thể vẫn là cách viết tương thích, nhưng implementation không nên
yêu cầu mọi channel chưa migrate phải thêm nó.

Mã bridge hiện tại phải giữ quyết định durability tường minh:

- Việc phân phối kết quả cuối bền vững trả về một trạng thái phân biệt. `handled_visible` và
  `handled_no_send` là trạng thái kết thúc; `unsupported` và `not_applicable` có thể
  quay về cơ chế phân phối do kênh sở hữu; `failed` truyền tiếp lỗi gửi.
- Việc phân phối kết quả cuối bền vững dạng chung được kiểm soát bằng các năng lực adapter như
  phân phối im lặng, bảo toàn đích trả lời, bảo toàn trích dẫn gốc, và
  hook gửi tin nhắn. Khi thiếu tương đương hành vi, nên chọn phân phối do kênh sở hữu,
  không phải một lần gửi chung làm thay đổi hành vi người dùng nhìn thấy.
- Các lần gửi bền vững dựa trên hàng đợi để lộ một tham chiếu ý định phân phối. Các trường phiên
  `pendingFinalDelivery*` hiện có có thể mang id ý định trong
  giai đoạn chuyển đổi; trạng thái cuối là một kho `MessageSendIntent` thay vì
  văn bản trả lời bị đóng băng cộng với các trường ngữ cảnh tùy biến.

Không bật đường dẫn bền vững dạng chung cho một kênh cho đến khi tất cả điều sau
đều đúng:

- Adapter gửi dạng chung thực thi cùng hành vi kết xuất và vận chuyển như
  đường dẫn trực tiếp cũ.
- Các tác dụng phụ cục bộ sau khi gửi được bảo toàn thông qua ngữ cảnh gửi.
- Adapter trả về biên nhận hoặc kết quả phân phối với tất cả id tin nhắn của nền tảng.
- Các đường dẫn dispatcher đã chuẩn bị hoặc gọi ngữ cảnh gửi mới hoặc vẫn được ghi tài liệu
  là nằm ngoài bảo đảm bền vững.
- Phân phối dự phòng xử lý mọi payload đã chiếu, không chỉ payload đầu tiên.
- Phân phối dự phòng bền vững ghi lại toàn bộ mảng payload đã chiếu như một
  ý định có thể phát lại hoặc kế hoạch lô.

Các nguy cơ di trú cụ thể cần bảo toàn:

- Phân phối của bộ giám sát iMessage ghi lại tin nhắn đã gửi vào một bộ nhớ đệm echo sau một
  lần gửi thành công. Các lần gửi kết quả cuối bền vững vẫn phải điền bộ nhớ đệm đó, nếu không
  OpenClaw có thể nhập lại chính các trả lời cuối của nó như tin nhắn người dùng gửi vào.
- Tlon thêm chữ ký mô hình tùy chọn và ghi lại các luồng đã tham gia
  sau các trả lời nhóm. Phân phối bền vững dạng chung không được bỏ qua các hiệu ứng đó;
  hoặc chuyển chúng vào adapter kết xuất/gửi/hoàn tất của Tlon hoặc giữ Tlon trên
  đường dẫn do kênh sở hữu.
- Discord và các dispatcher đã chuẩn bị khác đã sở hữu hành vi phân phối trực tiếp và xem trước.
  Chúng không được bao phủ bởi bảo đảm bền vững của lượt đã lắp ráp cho đến khi
  các dispatcher đã chuẩn bị của chúng định tuyến rõ ràng kết quả cuối qua ngữ cảnh gửi.
- Phân phối dự phòng im lặng của Telegram phải phân phối toàn bộ mảng payload đã chiếu.
  Một lối tắt một payload có thể làm rơi các payload dự phòng bổ sung sau
  khi chiếu.
- LINE, Zalo, Nostr, và các đường dẫn đã lắp ráp/helper hiện có khác có thể
  có xử lý reply-token, proxy media, bộ nhớ đệm tin nhắn đã gửi, dọn dẹp loading/status,
  hoặc đích chỉ-callback. Chúng vẫn ở trên phân phối do kênh sở hữu cho đến khi
  các ngữ nghĩa đó được biểu diễn bởi adapter gửi và được kiểm chứng bằng kiểm thử.
- Các helper DM trực tiếp có thể có một callback trả lời là đích vận chuyển đúng duy nhất.
  Đầu ra dạng chung không được đoán từ `OriginatingTo` hoặc `To` rồi bỏ qua
  callback đó.
- Đầu ra lỗi của OpenClaw gateway phải vẫn hiển thị với con người, nhưng các echo trong phòng
  do bot tạo và đã gắn thẻ phải bị loại bỏ trước bước ủy quyền `allowBots`.
  Các kênh không được triển khai việc này bằng bộ lọc tiền tố văn bản hiển thị, ngoại trừ như một
  biện pháp chặn khẩn cấp ngắn hạn; hợp đồng bền vững là siêu dữ liệu nguồn gốc có cấu trúc.

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
luồng, đích, chính sách định dạng, và quy tắc media sau khi khởi động lại.

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
- Với `not_found`, cho phép hoàn tất trực tiếp quay về từ chỉnh sửa sang gửi mới khi
  kênh khai báo rằng việc đó an toàn.
- Với `conflict`, dùng quy tắc biên nhận/idempotency để quyết định liệu tin nhắn
  đã tồn tại hay chưa.
- Bất kỳ lỗi nào sau khi adapter có thể đã hoàn tất I/O nền tảng nhưng trước khi commit
  biên nhận đều trở thành `unknown_after_send` trừ khi adapter có thể chứng minh thao tác
  nền tảng đã không xảy ra.

## Ánh xạ kênh

| Kênh            | Di chuyển mục tiêu                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Nhận chính sách ack cộng với các lần gửi cuối bền vững. Bộ chuyển tiếp trực tiếp sở hữu việc gửi cộng với bản xem trước chỉnh sửa, gửi cuối bản xem trước cũ, chủ đề, bỏ qua bản xem trước trích dẫn-trả lời, phương án dự phòng cho phương tiện, và xử lý retry-after.                                                                                                  |
| Discord         | Bộ chuyển tiếp gửi bọc việc phân phối payload bền vững hiện có. Bộ chuyển tiếp trực tiếp sở hữu chỉnh sửa nháp, nháp tiến trình, hủy bản xem trước phương tiện/lỗi, bảo toàn mục tiêu trả lời, và biên nhận mã định danh tin nhắn. Kiểm tra các tiếng vọng lỗi Gateway do bot tạo trong phòng dùng chung; dùng registry gửi đi hoặc tương đương gốc khác nếu Discord không thể mang siêu dữ liệu nguồn trên tin nhắn thông thường. |
| Slack           | Bộ chuyển tiếp gửi xử lý các bài đăng chat thông thường. Bộ chuyển tiếp trực tiếp chọn luồng gốc khi hình dạng chuỗi hỗ trợ, nếu không thì dùng bản xem trước nháp. Biên nhận bảo toàn dấu thời gian chuỗi. Bộ chuyển tiếp nguồn ánh xạ lỗi Gateway của OpenClaw sang `chat.postMessage.metadata` của Slack và loại bỏ các tiếng vọng phòng bot đã gắn thẻ trước khi ủy quyền `allowBots`.                                  |
| WhatsApp        | Bộ chuyển tiếp gửi sở hữu gửi văn bản/phương tiện với các ý định gửi cuối bền vững. Bộ chuyển tiếp nhận xử lý nhắc đến nhóm và danh tính người gửi. Trực tiếp có thể tiếp tục vắng mặt cho đến khi WhatsApp có phương thức truyền tải có thể chỉnh sửa.                                                                                                                |
| Matrix          | Bộ chuyển tiếp trực tiếp sở hữu chỉnh sửa sự kiện nháp, hoàn tất, biên tập xóa, ràng buộc phương tiện được mã hóa, và phương án dự phòng khi mục tiêu trả lời không khớp. Bộ chuyển tiếp nhận sở hữu việc bổ sung dữ liệu sự kiện được mã hóa và khử trùng lặp. Bộ chuyển tiếp nguồn nên mã hóa nguồn lỗi Gateway của OpenClaw vào nội dung sự kiện Matrix và loại bỏ tiếng vọng phòng bot đã cấu hình trước khi xử lý `allowBots`. |
| Mattermost      | Bộ chuyển tiếp trực tiếp sở hữu một bài đăng nháp, gập tiến trình/công cụ, hoàn tất tại chỗ, và phương án dự phòng gửi mới.                                                                                                                                                                                                                                            |
| Microsoft Teams | Bộ chuyển tiếp trực tiếp sở hữu tiến trình gốc và hành vi luồng khối. Bộ chuyển tiếp gửi sở hữu hoạt động và biên nhận tệp đính kèm/thẻ.                                                                                                                                                                                                                               |
| Feishu          | Bộ chuyển tiếp hiển thị sở hữu hiển thị văn bản/thẻ/thô. Bộ chuyển tiếp trực tiếp sở hữu thẻ phát trực tuyến và chặn trùng lặp phần cuối. Bộ chuyển tiếp gửi sở hữu bình luận, phiên chủ đề, phương tiện, và chặn giọng nói.                                                                                                                                          |
| QQ Bot          | Bộ chuyển tiếp trực tiếp sở hữu phát trực tuyến C2C, thời gian chờ bộ tích lũy, và gửi cuối dự phòng. Bộ chuyển tiếp hiển thị sở hữu thẻ phương tiện và văn bản-dưới-dạng-giọng-nói.                                                                                                                                                                                  |
| Signal          | Bộ chuyển tiếp nhận cộng với gửi đơn giản. Không có bộ chuyển tiếp trực tiếp trừ khi signal-cli thêm hỗ trợ chỉnh sửa đáng tin cậy.                                                                                                                                                                                                                                     |
| iMessage        | Bộ chuyển tiếp nhận cộng với gửi đơn giản. Gửi iMessage phải bảo toàn việc điền echo-cache của trình giám sát trước khi các lần gửi cuối bền vững có thể bỏ qua phân phối qua trình giám sát.                                                                                                                                                                          |
| Google Chat     | Bộ chuyển tiếp nhận cộng với gửi đơn giản với quan hệ chuỗi được ánh xạ sang không gian và mã định danh chuỗi. Kiểm tra hành vi phòng `allowBots=true` đối với các tiếng vọng lỗi Gateway OpenClaw đã gắn thẻ.                                                                                                                                                         |
| LINE            | Bộ chuyển tiếp nhận cộng với gửi đơn giản với các ràng buộc reply-token được mô hình hóa như năng lực mục tiêu/quan hệ.                                                                                                                                                                                                                                                |
| Nextcloud Talk  | Cầu nối nhận SDK cộng với bộ chuyển tiếp gửi.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Bộ chuyển tiếp nhận cộng với gửi đơn giản, không có biên nhận chỉnh sửa bền vững.                                                                                                                                                                                                                                                                                       |
| Nostr           | Bộ chuyển tiếp nhận cộng với gửi cho DM được mã hóa; biên nhận là mã định danh sự kiện.                                                                                                                                                                                                                                                                                 |
| QA Channel      | Bộ chuyển tiếp kiểm thử hợp đồng cho hành vi nhận, gửi, trực tiếp, thử lại, và khôi phục.                                                                                                                                                                                                                                                                               |
| Synology Chat   | Bộ chuyển tiếp nhận cộng với gửi đơn giản.                                                                                                                                                                                                                                                                                                                             |
| Tlon            | Bộ chuyển tiếp gửi phải bảo toàn hiển thị chữ ký mô hình và theo dõi chuỗi đã tham gia trước khi phân phối cuối bền vững chung được bật.                                                                                                                                                                                                                                |
| Twitch          | Bộ chuyển tiếp nhận cộng với gửi đơn giản với phân loại giới hạn tốc độ.                                                                                                                                                                                                                                                                                                |
| Zalo            | Bộ chuyển tiếp nhận cộng với gửi đơn giản.                                                                                                                                                                                                                                                                                                                             |
| Zalo Personal   | Bộ chuyển tiếp nhận cộng với gửi đơn giản.                                                                                                                                                                                                                                                                                                                             |

## Kế hoạch di chuyển

### Giai đoạn 1: Miền tin nhắn nội bộ

- Thêm các kiểu `src/channels/message/*` cho tin nhắn, mục tiêu, quan hệ,
  nguồn, biên nhận, năng lực, ý định bền vững, ngữ cảnh nhận, ngữ cảnh gửi,
  ngữ cảnh trực tiếp, và lớp lỗi.
- Thêm `origin?: MessageOrigin` vào kiểu payload cầu nối di chuyển được dùng bởi
  phân phối trả lời hiện tại, rồi chuyển trường đó sang `ChannelMessage` và các
  kiểu tin nhắn đã hiển thị khi tái cấu trúc thay thế payload trả lời.
- Giữ phần này nội bộ cho đến khi các bộ chuyển tiếp và kiểm thử chứng minh được hình dạng.
- Thêm kiểm thử đơn vị thuần cho chuyển đổi trạng thái và tuần tự hóa.

### Giai đoạn 2: Lõi gửi bền vững

- Chuyển hàng đợi gửi đi hiện có từ độ bền payload trả lời sang các ý định
  gửi tin nhắn bền vững.
- Cho phép một ý định gửi bền vững mang mảng payload đã chiếu hoặc kế hoạch lô,
  không chỉ một payload trả lời.
- Bảo toàn hành vi khôi phục hàng đợi hiện tại thông qua chuyển đổi tương thích.
- Làm cho `deliverOutboundPayloads` gọi `messages.send`.
- Đặt độ bền gửi cuối làm mặc định và đóng khi thất bại nếu không thể ghi ý định bền vững
  trong vòng đời tin nhắn mới, sau khi bộ chuyển tiếp khai báo an toàn phát lại.
  Các đường dẫn tương thích channel-turn và SDK hiện có vẫn mặc định gửi trực tiếp trong giai đoạn này.
- Ghi biên nhận một cách nhất quán.
- Trả biên nhận và kết quả phân phối về bên gọi dispatcher ban đầu thay vì coi gửi bền vững
  là một tác dụng phụ cuối cùng.
- Duy trì nguồn tin nhắn qua các ý định gửi bền vững để khôi phục, phát lại, và
  gửi theo khối vẫn bảo toàn nguồn gốc vận hành OpenClaw.

### Giai đoạn 3: Cầu nối lượt kênh

- Triển khai lại `channel.turn.run` và `dispatchAssembledChannelTurn` trên nền
  `messages.receive` và `messages.send`.
- Giữ ổn định các kiểu fact hiện tại.
- Giữ hành vi cũ theo mặc định. Một kênh assembled-turn chỉ trở nên bền vững
  khi bộ chuyển tiếp của nó chọn tham gia rõ ràng với chính sách độ bền an toàn phát lại.
- Giữ `durable: false` làm lối thoát tương thích cho các đường dẫn hoàn tất
  chỉnh sửa gốc và chưa thể phát lại an toàn, nhưng không dựa vào các dấu `false`
  để bảo vệ các kênh chưa di chuyển.
- Chỉ mặc định độ bền assembled-turn trong vòng đời tin nhắn mới, sau khi
  ánh xạ kênh chứng minh đường dẫn gửi chung bảo toàn ngữ nghĩa phân phối kênh cũ.

### Giai đoạn 4: Cầu nối dispatcher đã chuẩn bị

- Thay `deliverDurableInboundReplyPayload` bằng một cầu nối ngữ cảnh gửi.
- Giữ helper cũ dưới dạng wrapper.
- Chuyển Telegram, WhatsApp, Slack, Signal, iMessage và Discord trước vì
  chúng đã có công việc final bền vững hoặc đường gửi đơn giản hơn.
- Xem mọi dispatcher đã chuẩn bị là chưa được bao phủ cho đến khi nó chọn tham
  gia rõ ràng vào ngữ cảnh gửi. Tài liệu và mục changelog phải nói "lượt kênh
  đã được lắp ráp" hoặc nêu tên các đường dẫn kênh đã di chuyển thay vì tuyên
  bố tất cả phản hồi cuối tự động.
- Giữ `recordInboundSessionAndDispatchReply`, các helper direct-DM và những
  helper tương thích công khai tương tự bảo toàn hành vi. Chúng có thể phơi bày
  một tùy chọn tham gia ngữ cảnh gửi rõ ràng sau này, nhưng không được tự động
  thử giao phát bền vững chung trước callback giao phát do caller sở hữu.

### Giai đoạn 5: Vòng đời live hợp nhất

- Xây dựng `messages.live` với hai adapter chứng minh:
  - Telegram cho gửi cộng chỉnh sửa cộng gửi final đã cũ.
  - Matrix cho hoàn tất bản nháp cộng fallback xóa.
- Sau đó di chuyển Discord, Slack, Mattermost, Teams, QQ Bot và Feishu.
- Chỉ xóa mã hoàn tất bản xem trước trùng lặp sau khi mỗi kênh có
  kiểm thử tương đương.

### Giai đoạn 6: SDK công khai

- Thêm `openclaw/plugin-sdk/channel-message`.
- Tài liệu hóa nó là API Plugin kênh được ưu tiên.
- Cập nhật package exports, inventory entrypoint, baseline API đã sinh và
  tài liệu SDK Plugin.
- Bao gồm `MessageOrigin`, các hook mã hóa/giải mã origin và predicate chung
  `shouldDropOpenClawEcho` trong bề mặt SDK channel-message.
- Giữ các wrapper tương thích cho subpath cũ.
- Đánh dấu các helper SDK có tên reply là đã ngừng khuyến nghị trong tài liệu
  sau khi các Plugin đi kèm được di chuyển.

### Giai đoạn 7: Tất cả bên gửi

Chuyển tất cả producer outbound không phải reply sang `messages.send`:

- thông báo cron và heartbeat
- hoàn tất tác vụ
- kết quả hook
- lời nhắc phê duyệt và kết quả phê duyệt
- gửi bằng công cụ tin nhắn
- thông báo hoàn tất subagent
- gửi rõ ràng từ CLI hoặc Control UI
- đường tự động hóa/phát rộng

Đây là nơi mô hình không còn là "agent replies" mà trở thành "OpenClaw gửi
tin nhắn".

### Giai đoạn 8: Ngừng khuyến nghị Turn

- Giữ `channel.turn` dưới dạng wrapper trong ít nhất một cửa sổ tương thích.
- Công bố ghi chú di chuyển.
- Chạy kiểm thử tương thích SDK Plugin với import cũ.
- Chỉ xóa hoặc ẩn các helper nội bộ cũ sau khi không Plugin đi kèm nào cần
  chúng và hợp đồng bên thứ ba đã có thay thế ổn định.

## Kế hoạch kiểm thử

Kiểm thử đơn vị:

- Tuần tự hóa và khôi phục ý định gửi bền vững.
- Tái sử dụng khóa idempotency và triệt tiêu bản trùng lặp.
- Commit receipt và bỏ qua replay.
- Khôi phục `unknown_after_send`, có đối soát trước replay khi adapter hỗ trợ
  đối soát.
- Chính sách phân loại lỗi.
- Trình tự chính sách ack khi nhận.
- Ánh xạ quan hệ cho gửi reply, followup, system và broadcast.
- Factory origin lỗi Gateway và predicate `shouldDropOpenClawEcho`.
- Bảo toàn origin qua chuẩn hóa payload, chia chunk, tuần tự hóa hàng đợi bền
  vững và khôi phục.

Kiểm thử tích hợp:

- Adapter đơn giản `channel.turn.run` vẫn ghi lại và gửi.
- Giao phát assembled-turn kế thừa không trở thành bền vững trừ khi kênh chọn
  tham gia rõ ràng.
- Cầu nối `channel.turn.runPrepared` vẫn ghi lại và hoàn tất.
- Các helper tương thích công khai mặc định gọi callback giao phát do caller sở
  hữu và không generic-send trước các callback đó.
- Giao phát fallback bền vững replay toàn bộ mảng payload đã chiếu sau khi
  khởi động lại và không thể để các payload sau đó chưa được ghi lại sau một
  crash sớm.
- Giao phát assembled-turn bền vững trả về id tin nhắn nền tảng cho dispatcher
  được đệm.
- Hook giao phát tùy chỉnh vẫn trả về id tin nhắn nền tảng khi giao phát bền
  vững bị tắt hoặc không khả dụng.
- Reply cuối sống sót qua khởi động lại giữa lúc assistant hoàn tất và lúc gửi
  lên nền tảng.
- Bản nháp xem trước hoàn tất tại chỗ khi được cho phép.
- Bản nháp xem trước bị hủy hoặc bị xóa khi media/lỗi/không khớp reply-target
  yêu cầu giao phát bình thường.
- Streaming block và streaming xem trước không cùng giao phát một văn bản.
- Media được stream sớm không bị lặp trong giao phát cuối.

Kiểm thử kênh:

- Reply topic Telegram với ack polling bị trì hoãn cho đến watermark completed
  an toàn của ngữ cảnh nhận.
- Khôi phục polling Telegram cho các update đã chấp nhận nhưng chưa giao phát
  được bao phủ bởi mô hình offset safe-completed đã lưu.
- Bản xem trước Telegram đã cũ gửi final mới và dọn dẹp bản xem trước.
- Fallback im lặng Telegram gửi mọi payload fallback đã chiếu.
- Độ bền fallback im lặng Telegram ghi lại toàn bộ mảng fallback đã chiếu một
  cách nguyên tử, không phải một ý định bền vững single-payload cho mỗi vòng
  lặp.
- Discord hủy bản xem trước khi có media/lỗi/reply rõ ràng.
- Final của dispatcher đã chuẩn bị trong Discord định tuyến qua ngữ cảnh gửi
  trước khi tài liệu hoặc changelog tuyên bố độ bền final-reply của Discord.
- Gửi final bền vững của iMessage điền cache echo sent-message của monitor.
- Các đường giao phát kế thừa LINE, Zalo và Nostr không bị bỏ qua bởi gửi bền
  vững chung cho đến khi tồn tại kiểm thử tương đương adapter của chúng.
- Giao phát callback Direct-DM/Nostr vẫn có thẩm quyền trừ khi được di chuyển
  rõ ràng sang một message target hoàn chỉnh và adapter gửi an toàn khi replay.
- Tin nhắn lỗi Gateway OpenClaw được gắn thẻ của Slack vẫn hiển thị outbound,
  echo phòng bot được gắn thẻ bị loại trước `allowBots`, và tin nhắn bot không
  gắn thẻ có cùng văn bản hiển thị vẫn đi theo ủy quyền bot bình thường.
- Fallback stream native Slack sang bản xem trước nháp trong DM cấp cao nhất.
- Hoàn tất bản xem trước Matrix và fallback xóa.
- Echo phòng gateway-failure OpenClaw được gắn thẻ của Matrix từ tài khoản bot
  đã cấu hình bị loại trước xử lý `allowBots`.
- Kiểm toán cascade gateway-failure trong phòng chung của Discord và Google
  Chat bao phủ các chế độ `allowBots` trước khi tuyên bố bảo vệ chung ở đó.
- Hoàn tất bản nháp Mattermost và fallback gửi mới.
- Hoàn tất tiến trình native Teams.
- Triệt tiêu final trùng lặp Feishu.
- Fallback timeout accumulator QQ Bot.
- Gửi final bền vững Tlon bảo toàn render model-signature và theo dõi thread đã
  tham gia.
- Gửi final bền vững đơn giản cho WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo và Zalo
  Personal.

Xác thực:

- Các file Vitest được nhắm mục tiêu trong quá trình phát triển.
- `pnpm check:changed` trong Testbox cho toàn bộ bề mặt đã thay đổi.
- `pnpm check` rộng hơn trong Testbox trước khi landing toàn bộ refactor hoặc
  sau các thay đổi SDK/export công khai.
- Smoke live hoặc qa-channel cho ít nhất một kênh có khả năng chỉnh sửa và một
  kênh chỉ gửi đơn giản trước khi xóa wrapper tương thích.

## Câu hỏi mở

- Liệu Telegram cuối cùng có nên thay runner source grammY bằng một nguồn
  polling hoàn toàn bền vững có thể kiểm soát giao phát lại ở cấp nền tảng,
  không chỉ watermark khởi động lại đã lưu của OpenClaw hay không.
- Liệu trạng thái live preview bền vững nên được lưu trong cùng bản ghi hàng
  đợi với ý định gửi cuối hay trong một kho live-state song song.
- Wrapper tương thích sẽ còn được tài liệu hóa bao lâu sau khi
  `plugin-sdk/channel-message` được phát hành.
- Liệu Plugin bên thứ ba nên triển khai receive adapter trực tiếp hay chỉ cung
  cấp hook normalize/send/live thông qua `defineChannelMessageAdapter`.
- Những trường receipt nào an toàn để phơi bày trong SDK công khai so với trạng
  thái runtime nội bộ.
- Liệu các hiệu ứng phụ như cache self-echo và marker participated-thread nên
  được mô hình hóa là hook send-context, bước finalize do adapter sở hữu, hay
  subscriber receipt.
- Kênh nào có metadata origin native, kênh nào cần registry outbound đã lưu, và
  kênh nào không thể cung cấp triệt tiêu echo cross-bot đáng tin cậy.

## Tiêu chí chấp nhận

- Mọi kênh tin nhắn đi kèm gửi đầu ra hiển thị cuối cùng qua `messages.send`.
- Mọi kênh tin nhắn inbound đi vào qua `messages.receive` hoặc wrapper tương
  thích được tài liệu hóa.
- Mọi kênh preview/edit/stream dùng `messages.live` cho trạng thái bản nháp và
  hoàn tất.
- `channel.turn` chỉ là wrapper.
- Các helper SDK có tên reply là export tương thích, không phải đường được
  khuyến nghị.
- Khôi phục bền vững có thể replay các lượt gửi final đang chờ sau khi khởi
  động lại mà không làm mất phản hồi cuối hoặc nhân đôi các lượt gửi đã commit;
  các lượt gửi có kết quả nền tảng không xác định được đối soát trước khi replay
  hoặc được tài liệu hóa là at-least-once cho adapter đó.
- Gửi final bền vững fail closed khi không thể ghi ý định bền vững, trừ khi
  caller đã chọn rõ ràng một chế độ không bền vững được tài liệu hóa.
- Các helper tương thích channel-turn và SDK kế thừa mặc định giao phát trực
  tiếp do kênh sở hữu; gửi bền vững chung chỉ là tùy chọn tham gia rõ ràng.
- Receipt bảo toàn tất cả id tin nhắn nền tảng cho giao phát nhiều phần và một
  id chính để tiện threading/edit.
- Wrapper bền vững bảo toàn các hiệu ứng phụ cục bộ của kênh trước khi thay thế
  callback giao phát trực tiếp.
- Dispatcher đã chuẩn bị không được tính là bền vững cho đến khi đường giao
  phát cuối của chúng sử dụng rõ ràng ngữ cảnh gửi.
- Giao phát fallback xử lý mọi payload đã chiếu.
- Giao phát fallback bền vững ghi lại mọi payload đã chiếu trong một ý định
  hoặc kế hoạch batch có thể replay.
- Đầu ra lỗi Gateway bắt nguồn từ OpenClaw hiển thị với con người nhưng echo
  phòng do bot viết được gắn thẻ bị loại trước ủy quyền bot trên các kênh tuyên
  bố hỗ trợ hợp đồng origin.
- Tài liệu giải thích gửi, nhận, live, trạng thái, receipt, quan hệ, chính sách
  lỗi, di chuyển và phạm vi kiểm thử.

## Liên quan

- [Tin nhắn](/vi/concepts/messages)
- [Streaming và chunking](/vi/concepts/streaming)
- [Bản nháp tiến trình](/vi/concepts/progress-drafts)
- [Chính sách retry](/vi/concepts/retry)
- [Kernel lượt kênh](/vi/plugins/sdk-channel-turn)
