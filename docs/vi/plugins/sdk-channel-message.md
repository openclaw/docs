---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc một Plugin kênh nhắn tin
    - Bạn cần cơ chế chuyển phát phản hồi cuối cùng bền vững, biên nhận, hoàn tất bản xem trước trực tiếp hoặc chính sách xác nhận đã nhận
    - Bạn đang di chuyển từ pipeline phản hồi cũ hoặc các helper điều phối phản hồi đầu vào
summary: API vòng đời tin nhắn cho Plugin kênh, bao gồm gửi bền vững, biên nhận, xem trước trực tiếp, chính sách xác nhận đã nhận và di chuyển kế thừa
title: API tin nhắn của kênh
x-i18n:
    generated_at: "2026-05-06T09:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin kênh nên cung cấp một adapter `message` từ
`openclaw/plugin-sdk/channel-message`. Adapter này mô tả vòng đời thông điệp gốc
mà nền tảng hỗ trợ:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core sở hữu việc xếp hàng, độ bền, chính sách thử lại chung, hook, biên nhận và
công cụ `message` dùng chung. Plugin sở hữu các lệnh gọi gửi/chỉnh sửa/xóa gốc,
chuẩn hóa đích, luồng hội thoại của nền tảng, trích dẫn được chọn, cờ thông báo,
trạng thái tài khoản và các side effect riêng theo nền tảng.

Dùng trang này cùng với [Xây dựng Plugin kênh](/vi/plugins/sdk-channel-plugins).

Subpath `channel-message` được thiết kế đủ nhẹ cho các tệp bootstrap Plugin nóng
như `channel.ts`: nó cung cấp các hợp đồng adapter, bằng chứng capability,
biên nhận và facade tương thích mà không tải outbound delivery. Các helper
runtime delivery có sẵn từ
`openclaw/plugin-sdk/channel-message-runtime` cho các code path monitor/send vốn
đã thực hiện message I/O bất đồng bộ.

## Adapter tối thiểu

Hầu hết Plugin kênh mới có thể bắt đầu với một adapter nhỏ:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Sau đó gắn nó vào Plugin kênh:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Chỉ khai báo các capability mà adapter thật sự giữ nguyên. Mỗi capability đã
khai báo nên có một kiểm thử hợp đồng.

## Cầu nối outbound

Nếu kênh đã có adapter `outbound` tương thích, hãy ưu tiên dẫn xuất adapter
message thay vì sao chép mã gửi:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Cầu nối chuyển đổi kết quả gửi outbound cũ thành các giá trị `MessageReceipt`.
Mã mới nên truyền biên nhận xuyên suốt và chỉ dẫn xuất id legacy ở các ranh giới
tương thích bằng `listMessageReceiptPlatformIds(...)` hoặc
`resolveMessageReceiptPrimaryId(...)`.
Nếu không cung cấp chính sách nhận, `createChannelMessageAdapterFromOutbound(...)`
sử dụng chính sách xác nhận nhận `manual`. Điều đó làm cho việc xác nhận nền tảng
do Plugin sở hữu trở nên rõ ràng mà không thay đổi các kênh xác nhận Webhook,
socket hoặc offset polling bên ngoài ngữ cảnh nhận chung.

## Gửi bằng công cụ message

Đường dẫn `message(action="send")` dùng chung nên sử dụng cùng vòng đời core
delivery như các phản hồi cuối cùng. Nếu một kênh cần định hình riêng theo nhà
cung cấp cho lần gửi bằng công cụ, hãy triển khai `actions.prepareSendPayload(...)`
thay vì gửi từ `actions.handleAction(...)`.

`prepareSendPayload(...)` nhận `ReplyPayload` core đã chuẩn hóa cùng toàn bộ ngữ
cảnh action. Trả về một payload có dữ liệu riêng theo kênh trong
`payload.channelData.<channel>` và để core gọi `sendMessage(...)`,
`deliverOutboundPayloads(...)`, hàng đợi write-ahead, message-sending hook,
thử lại, khôi phục và dọn dẹp ack.

Chỉ trả về `null` khi lần gửi không thể được biểu diễn dưới dạng payload bền,
ví dụ vì nó chứa một component factory không thể tuần tự hóa. Core sẽ giữ lại
fallback action Plugin legacy để tương thích, nhưng các tính năng gửi kênh mới
nên có thể biểu diễn dưới dạng dữ liệu payload bền.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Sau đó adapter outbound đọc `payload.channelData.demo` bên trong `sendPayload`.
Điều này giữ phần render riêng theo nền tảng trong Plugin trong khi core vẫn sở
hữu persist, thử lại, recover, hook và ack.

Các payload `message(action="send")` đã chuẩn bị và generic final-reply delivery
sử dụng core delivery với xếp hàng best-effort theo mặc định. Xếp hàng bền bắt
buộc chỉ hợp lệ sau khi core xác minh kênh có thể đối chiếu một lần gửi mà kết
quả của nó không xác định sau sự cố. Nếu adapter không thể triển khai
`reconcileUnknownSend`, hãy giữ đường dẫn gửi đã chuẩn bị ở best-effort; core vẫn
sẽ thử hàng đợi write-ahead, nhưng queue persistence hoặc khôi phục sự cố không
chắc chắn không thuộc hợp đồng delivery bắt buộc.

## Capability final bền

Durable final delivery là tùy chọn theo từng side effect. Core sẽ chỉ dùng
generic durable delivery khi adapter khai báo mọi capability mà payload và tùy
chọn delivery cần.

| Capability             | Khai báo khi                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter có thể gửi văn bản và trả về biên nhận.                                      |
| `media`                | Lần gửi media trả về biên nhận cho mọi thông điệp nền tảng hiển thị.                 |
| `payload`              | Adapter giữ nguyên ngữ nghĩa rich reply payload, không chỉ văn bản và một URL media. |
| `replyTo`              | Đích trả lời gốc đến được nền tảng.                                                   |
| `thread`               | Đích thread, topic hoặc channel thread gốc đến được nền tảng.                        |
| `silent`               | Việc tắt thông báo đến được nền tảng.                                                 |
| `nativeQuote`          | Metadata trích dẫn được chọn đến được nền tảng.                                       |
| `messageSendingHooks`  | Core message-sending hook có thể hủy hoặc viết lại nội dung trước platform I/O.      |
| `batch`                | Các batch render nhiều phần có thể phát lại như một kế hoạch bền duy nhất.           |
| `reconcileUnknownSend` | Adapter có thể giải quyết khôi phục `unknown_after_send` mà không phát lại mù quáng. |
| `afterSendSuccess`     | Side effect after-send cục bộ của kênh chạy một lần.                                 |
| `afterCommit`          | Side effect after-commit cục bộ của kênh chạy một lần.                               |

Best-effort final delivery không yêu cầu `reconcileUnknownSend`; nó dùng vòng
đời dùng chung khi adapter giữ nguyên ngữ nghĩa hiển thị của payload, và fallback
về platform I/O trực tiếp nếu queue persistence không khả dụng. Required durable
final delivery phải yêu cầu rõ ràng `reconcileUnknownSend`. Nếu adapter không thể
xác định liệu một lần gửi đã bắt đầu/không xác định có đến được nền tảng hay
không, đừng khai báo capability đó; core sẽ từ chối required durable delivery
trước khi xếp hàng.

Khi caller cần durable delivery, hãy dẫn xuất yêu cầu thay vì tự xây map:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` được yêu cầu theo mặc định. Chỉ đặt `messageSendingHooks: false`
cho một đường dẫn cố ý không thể chạy global message-sending hook.

## Hợp đồng gửi bền

Một lần gửi final bền có ngữ nghĩa nghiêm ngặt hơn delivery legacy do kênh sở
hữu:

- Tạo intent bền trước platform I/O.
- Nếu durable delivery trả về kết quả đã xử lý, không fallback về legacy send.
- Xem hook cancellation và no-send result là kết thúc.
- Xem `unsupported` là kết quả trước intent.
- Với required durability, thất bại trước platform I/O nếu hàng đợi không thể
  ghi nhận rằng platform send đã bắt đầu.
- Với required final delivery và required prepared message-tool send, preflight
  `reconcileUnknownSend`; recovery phải có thể ack một thông điệp đã gửi hoặc chỉ
  phát lại sau khi adapter chứng minh lần gửi ban đầu đã không xảy ra.
- Với `best_effort`, lỗi ghi hàng đợi có thể fallback về platform I/O trực tiếp.
- Chuyển tiếp tín hiệu hủy đến media loading và platform send.
- Chạy hook after-commit sau queue ack; direct best-effort fallback chạy chúng
  sau platform I/O thành công vì không có commit hàng đợi bền.
- Trả về biên nhận cho mọi id thông điệp nền tảng hiển thị.
- Dùng `reconcileUnknownSend` khi một nền tảng có thể kiểm tra liệu một lần gửi
  không chắc chắn đã đến người dùng hay chưa.

Hợp đồng này tránh gửi trùng sau sự cố và tránh bỏ qua các hook hủy
message-sending.

## Biên nhận

`MessageReceipt` là bản ghi nội bộ mới về những gì nền tảng đã chấp nhận:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Dùng `createMessageReceiptFromOutboundResults(...)` khi chuyển đổi một kết quả
gửi hiện có. Dùng `createPreviewMessageReceipt(...)` khi một thông điệp live
preview trở thành biên nhận cuối cùng. Tránh thêm các trường `messageIds` cục bộ
theo owner mới. Legacy `ChannelDeliveryResult.messageIds` vẫn được tạo ở các
ranh giới tương thích.

## Live preview

Các kênh stream bản nháp preview hoặc cập nhật tiến trình nên khai báo
capability live:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Dùng `defineFinalizableLivePreviewAdapter(...)` và
`deliverWithFinalizableLivePreviewAdapter(...)` cho finalization runtime.
Finalizer quyết định liệu phản hồi cuối cùng có chỉnh sửa preview tại chỗ, gửi
một fallback bình thường, loại bỏ trạng thái preview đang chờ, giữ một lần chỉnh
sửa thất bại mơ hồ mà không nhân đôi thông điệp, và trả về biên nhận cuối cùng.

## Chính sách receive ack

Các inbound receiver kiểm soát thời điểm xác nhận nền tảng nên khai báo chính
sách nhận:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapter không khai báo chính sách nhận sẽ mặc định thành:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Sử dụng mặc định khi nền tảng không có acknowledgement để trì hoãn, đã
acknowledge trước khi xử lý bất đồng bộ, hoặc cần ngữ nghĩa phản hồi riêng theo
protocol. Chỉ khai báo một trong các chính sách theo giai đoạn khi receiver thực sự
dùng receive context để chuyển acknowledgement của nền tảng sang muộn hơn.

Chính sách:

| Chính sách             | Dùng khi                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `after_receive_record` | Nền tảng có thể được acknowledgement sau khi event inbound được phân tích cú pháp và ghi lại. |
| `after_agent_dispatch` | Nền tảng nên đợi đến khi agent dispatch đã được chấp nhận.                                |
| `after_durable_send`   | Nền tảng nên đợi đến khi việc gửi cuối cùng có quyết định durable.                        |
| `manual`               | Plugin sở hữu acknowledgement vì ngữ nghĩa nền tảng không khớp với một giai đoạn chung.   |

Dùng `createMessageReceiveContext(...)` trong các receiver trì hoãn trạng thái ack, và
`shouldAckMessageAfterStage(...)` khi receiver cần kiểm tra liệu một giai đoạn
đã thỏa mãn chính sách đã cấu hình hay chưa.

## Kiểm thử contract

Khai báo capability là một phần của contract Plugin. Hãy hỗ trợ chúng bằng kiểm thử:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Thêm các bộ proof live và receive khi adapter khai báo các tính năng đó. Một
proof bị thiếu nên làm kiểm thử thất bại thay vì âm thầm mở rộng bề mặt durable.

## API tương thích không còn được khuyến nghị

Các API này vẫn có thể import để tương thích với bên thứ ba. Không dùng chúng cho
mã kênh mới.

| API không còn được khuyến nghị               | Thay thế                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` cho dispatcher tương thích, hoặc adapter `message` cho mã kênh mới        |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` từ `openclaw/plugin-sdk/channel-message-runtime`                  |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` chỉ dành cho dispatcher tương thích                                      |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` chỉ dành cho dispatcher tương thích                                        |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` cộng với `deliverWithFinalizableLivePreviewAdapter(...)`                 |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Các dispatcher tương thích vẫn có thể dùng `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)`, và `createTypingCallbacks(...)` thông qua
message facade. Mã lifecycle mới nên tránh subpath
`channel-reply-pipeline` cũ.

## Checklist di chuyển

1. Thêm `message: defineChannelMessageAdapter(...)` hoặc
   `message: createChannelMessageAdapterFromOutbound(...)` vào Plugin kênh.
2. Trả về `MessageReceipt` từ các lần gửi văn bản, media, và payload.
3. Chỉ khai báo các capability được hỗ trợ bởi hành vi native và kiểm thử.
4. Thay thế các durable requirement map viết tay bằng
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Chuyển việc hoàn tất preview qua các live preview helper khi kênh
   chỉnh sửa draft message tại chỗ.
6. Chỉ khai báo receive ack policy khi receiver thực sự có thể trì hoãn
   acknowledgement của nền tảng.
7. Chỉ giữ các legacy reply dispatch helper ở ranh giới tương thích.
