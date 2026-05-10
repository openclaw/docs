---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc một Plugin kênh nhắn tin
    - Bạn cần cơ chế gửi phản hồi cuối cùng bền vững, biên nhận, hoàn tất bản xem trước trực tiếp, hoặc chính sách xác nhận đã nhận
    - Bạn đang di chuyển từ quy trình trả lời cũ hoặc các trình trợ giúp điều phối trả lời đến
summary: API vòng đời tin nhắn cho các Plugin kênh, bao gồm gửi bền vững, biên nhận, xem trước trực tiếp, chính sách xác nhận đã nhận và di trú từ hệ thống cũ
title: API tin nhắn kênh
x-i18n:
    generated_at: "2026-05-10T19:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Các Plugin kênh nên cung cấp một bộ chuyển đổi `message` từ
`openclaw/plugin-sdk/channel-message`. Bộ chuyển đổi mô tả vòng đời tin nhắn gốc
mà nền tảng hỗ trợ:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Phần lõi sở hữu việc xếp hàng, độ bền, chính sách thử lại chung, hook, biên nhận và
công cụ `message` dùng chung. Plugin sở hữu các lệnh gọi gửi/chỉnh sửa/xóa gốc, chuẩn hóa đích,
luồng thảo luận của nền tảng, trích dẫn đã chọn, cờ thông báo, trạng thái tài khoản
và các hiệu ứng phụ dành riêng cho nền tảng.

Dùng trang này cùng với [Xây dựng Plugin kênh](/vi/plugins/sdk-channel-plugins).

Đường dẫn con `channel-message` được thiết kế đủ nhẹ cho các tệp khởi động nóng của Plugin
như `channel.ts`: nó cung cấp các hợp đồng bộ chuyển đổi, bằng chứng năng lực,
biên nhận và facade tương thích mà không tải cơ chế phân phối đi.
Các helper phân phối thời gian chạy có sẵn từ
`openclaw/plugin-sdk/channel-message-runtime` cho các đường dẫn mã monitor/send
vốn đã thực hiện I/O tin nhắn bất đồng bộ.

Mã gửi mới của kênh và Plugin nên dùng các helper vòng đời tin nhắn từ
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext`, hoặc `deliverInboundReplyWithMessageSendContext`.
Helper cũ
`deliverOutboundPayloads(...)` trong `openclaw/plugin-sdk/outbound-runtime`
là nền tương thích/thời gian chạy đã lỗi thời cho phần nội bộ outbound, khôi phục
và các bộ chuyển đổi cũ. Không dùng nó cho đường dẫn gửi mới của kênh hoặc Plugin.

`sendDurableMessageBatch(...)` trả về một kết quả vòng đời tường minh:

- `sent` - ít nhất một tin nhắn nền tảng hiển thị đã được phân phối.
- `suppressed` - không nên coi là thiếu tin nhắn nền tảng nào. Các lý do ổn định
  gồm `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity`, và lý do cũ `no_visible_result`.
- `partial_failed` - ít nhất một tin nhắn nền tảng đã được phân phối trước khi một
  payload hoặc hiệu ứng phụ sau đó thất bại. Kết quả bao gồm tiền tố biên nhận đã phân phối
  cùng với lỗi.
- `failed` - không tạo ra biên nhận nền tảng nào.

Dùng `payloadOutcomes` khi một lô trộn các payload đã gửi, bị chặn và thất bại.
Không suy luận việc hook hủy bằng cách kiểm tra mảng phân phối trực tiếp cũ
có rỗng hay không.

Các bộ điều phối tương thích vẫn cần bộ điều phối trả lời đệm nên
xây dựng tùy chọn tiền tố trả lời bằng `createChannelMessageReplyPipeline(...)` từ
`openclaw/plugin-sdk/channel-message`, rồi gọi
`channel.turn.runPrepared(...)` của runtime. Việc này giữ ghi phiên và thứ tự điều phối
trên vòng đời lượt dùng chung mà không thêm một wrapper lượt công khai khác.

## Bộ chuyển đổi tối thiểu

Hầu hết Plugin kênh mới có thể bắt đầu bằng một bộ chuyển đổi nhỏ:

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

Chỉ khai báo các năng lực mà bộ chuyển đổi thực sự bảo toàn. Mỗi năng lực đã khai báo
nên có một kiểm thử hợp đồng.

## Cầu nối outbound

Nếu kênh đã có một bộ chuyển đổi `outbound` tương thích, hãy ưu tiên suy ra
bộ chuyển đổi tin nhắn thay vì nhân đôi mã gửi:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Cầu nối chuyển đổi kết quả gửi outbound cũ thành các giá trị `MessageReceipt`. Mã mới
nên truyền biên nhận xuyên suốt và chỉ suy ra id cũ tại các ranh giới tương thích
bằng `listMessageReceiptPlatformIds(...)` hoặc
`resolveMessageReceiptPrimaryId(...)`.
Nếu không cung cấp chính sách nhận, `createChannelMessageAdapterFromOutbound(...)`
dùng chính sách xác nhận nhận `manual`. Điều đó làm cho xác nhận nền tảng do Plugin sở hữu
trở nên tường minh mà không thay đổi các kênh xác nhận Webhook,
socket hoặc offset polling bên ngoài ngữ cảnh nhận chung.

## Gửi bằng công cụ tin nhắn

Đường dẫn `message(action="send")` dùng chung nên dùng cùng vòng đời phân phối lõi
như các trả lời cuối cùng. Nếu một kênh cần định dạng theo nhà cung cấp cho lần gửi bằng công cụ,
hãy triển khai `actions.prepareSendPayload(...)` thay vì gửi từ
`actions.handleAction(...)`.

`prepareSendPayload(...)` nhận `ReplyPayload` lõi đã chuẩn hóa cùng với
toàn bộ ngữ cảnh hành động. Trả về một payload có dữ liệu dành riêng cho kênh trong
`payload.channelData.<channel>` và để phần lõi gọi `sendMessage(...)`,
runtime vòng đời tin nhắn, hàng đợi ghi trước, hook gửi tin nhắn,
thử lại, khôi phục và dọn dẹp ack. Runtime vòng đời có thể gọi
`deliverOutboundPayloads(...)` nội bộ như nền tương thích, nhưng Plugin kênh
không nên gọi trực tiếp nó cho hành vi gửi mới.

Chỉ trả về `null` khi lần gửi không thể được biểu diễn thành payload bền vững, ví dụ
vì nó chứa một component factory không thể tuần tự hóa. Phần lõi sẽ giữ
fallback hành động Plugin cũ để tương thích, nhưng các tính năng gửi mới của kênh
nên biểu diễn được dưới dạng dữ liệu payload bền vững.

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

Sau đó bộ chuyển đổi outbound đọc `payload.channelData.demo` bên trong `sendPayload`.
Điều này giữ phần kết xuất dành riêng cho nền tảng trong Plugin trong khi phần lõi vẫn sở hữu
lưu bền vững, thử lại, khôi phục, hook và ack.

Các payload `message(action="send")` đã chuẩn bị và phân phối trả lời cuối cùng chung dùng
phân phối lõi với xếp hàng nỗ lực tối đa theo mặc định. Xếp hàng bền vững bắt buộc
chỉ hợp lệ sau khi phần lõi xác minh kênh có thể đối chiếu một lần gửi có kết quả
không xác định sau sự cố. Nếu bộ chuyển đổi không thể triển khai `reconcileUnknownSend`,
hãy giữ đường dẫn gửi đã chuẩn bị ở mức nỗ lực tối đa; phần lõi vẫn sẽ thử hàng đợi ghi trước,
nhưng tính bền vững của hàng đợi hoặc khôi phục sau sự cố không chắc chắn không thuộc
hợp đồng phân phối bắt buộc.

## Năng lực gửi cuối bền vững

Phân phối cuối bền vững là tùy chọn theo từng hiệu ứng phụ. Phần lõi sẽ chỉ dùng
phân phối bền vững chung khi bộ chuyển đổi khai báo mọi năng lực cần thiết bởi
payload và tùy chọn phân phối.

| Năng lực               | Khai báo khi                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Bộ chuyển đổi có thể gửi văn bản và trả về biên nhận.                                |
| `media`                | Lần gửi media trả về biên nhận cho mọi tin nhắn nền tảng hiển thị.                   |
| `payload`              | Bộ chuyển đổi bảo toàn ngữ nghĩa payload trả lời phong phú, không chỉ văn bản và một URL media. |
| `replyTo`              | Đích trả lời gốc tới được nền tảng.                                                  |
| `thread`               | Đích luồng, chủ đề hoặc luồng kênh gốc tới được nền tảng.                            |
| `silent`               | Việc tắt thông báo tới được nền tảng.                                                |
| `nativeQuote`          | Metadata trích dẫn đã chọn tới được nền tảng.                                        |
| `messageSendingHooks`  | Hook gửi tin nhắn của phần lõi có thể hủy hoặc viết lại nội dung trước I/O nền tảng. |
| `batch`                | Các lô đã kết xuất gồm nhiều phần có thể được phát lại như một kế hoạch bền vững.    |
| `reconcileUnknownSend` | Bộ chuyển đổi có thể xử lý khôi phục `unknown_after_send` mà không phát lại mù.      |
| `afterSendSuccess`     | Hiệu ứng phụ sau khi gửi cục bộ theo kênh chạy một lần.                              |
| `afterCommit`          | Hiệu ứng phụ sau khi commit cục bộ theo kênh chạy một lần.                           |

Phân phối cuối nỗ lực tối đa không yêu cầu `reconcileUnknownSend`; nó dùng
vòng đời dùng chung khi bộ chuyển đổi bảo toàn ngữ nghĩa hiển thị của payload, và
fallback sang I/O nền tảng trực tiếp nếu tính bền vững của hàng đợi không sẵn có. Phân phối cuối
bền vững bắt buộc phải yêu cầu tường minh `reconcileUnknownSend`. Nếu
bộ chuyển đổi không thể xác định liệu một lần gửi đã bắt đầu/không xác định có tới nền tảng hay không,
đừng khai báo năng lực đó; phần lõi sẽ từ chối phân phối bền vững bắt buộc
trước khi xếp hàng.

Khi một caller cần phân phối bền vững, hãy suy ra yêu cầu thay vì tự xây dựng
map thủ công:

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

`messageSendingHooks` được yêu cầu theo mặc định. Đặt `messageSendingHooks: false`
chỉ cho một đường dẫn cố ý không thể chạy các hook gửi tin nhắn toàn cục.

## Hợp đồng gửi bền vững

Một lần gửi cuối bền vững có ngữ nghĩa nghiêm ngặt hơn phân phối cũ do kênh sở hữu:

- Tạo ý định bền vững trước I/O nền tảng.
- Nếu phân phối bền vững trả về một kết quả đã xử lý, không fallback sang gửi cũ.
- Coi việc hook hủy và kết quả không gửi là kết thúc.
- Coi `unsupported` là kết quả trước ý định duy nhất.
- Với độ bền bắt buộc, thất bại trước I/O nền tảng nếu hàng đợi không thể ghi nhận
  rằng lần gửi nền tảng đã bắt đầu.
- Với phân phối cuối bắt buộc và các lần gửi công cụ tin nhắn đã chuẩn bị bắt buộc,
  preflight `reconcileUnknownSend`; quá trình khôi phục phải có khả năng ack một
  tin nhắn đã gửi hoặc chỉ phát lại sau khi bộ chuyển đổi chứng minh lần gửi ban đầu
  đã không xảy ra.
- Với `best_effort`, lỗi ghi hàng đợi có thể fallback sang I/O nền tảng trực tiếp.
- Chuyển tiếp tín hiệu hủy tới việc tải media và các lần gửi nền tảng.
- Chạy hook sau commit sau ack hàng đợi; fallback trực tiếp nỗ lực tối đa chạy chúng
  sau I/O nền tảng thành công vì không có commit hàng đợi bền vững.
- Trả về biên nhận cho mọi id tin nhắn nền tảng hiển thị.
- Dùng `reconcileUnknownSend` khi một nền tảng có thể kiểm tra liệu một lần gửi không chắc chắn
  đã tới người dùng hay chưa.

Hợp đồng này tránh gửi trùng lặp sau sự cố và tránh bỏ qua
các hook hủy gửi tin nhắn.

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

Dùng `createMessageReceiptFromOutboundResults(...)` khi điều chỉnh một kết quả
gửi hiện có. Dùng `createPreviewMessageReceipt(...)` khi một thông báo xem trước
trực tiếp trở thành biên nhận cuối cùng. Tránh thêm các trường `messageIds` mới
cục bộ theo chủ sở hữu. `ChannelDeliveryResult.messageIds` cũ vẫn được tạo tại
các rìa tương thích.

## Xem trước trực tiếp

Các kênh truyền phát bản xem trước nháp hoặc cập nhật tiến độ nên khai báo các
khả năng trực tiếp:

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
`deliverWithFinalizableLivePreviewAdapter(...)` để hoàn tất trong thời gian chạy.
Bộ hoàn tất quyết định liệu phản hồi cuối cùng có chỉnh sửa bản xem trước tại
chỗ, gửi phương án dự phòng bình thường, loại bỏ trạng thái xem trước đang chờ,
giữ một lần chỉnh sửa thất bại mơ hồ mà không nhân đôi thông báo, và trả về biên
nhận cuối cùng hay không.

## Chính sách ack nhận

Các bộ nhận đầu vào kiểm soát thời điểm xác nhận của nền tảng nên khai báo chính
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

Các adapter không khai báo chính sách nhận sẽ mặc định là:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Dùng mặc định khi nền tảng không có xác nhận cần trì hoãn, đã xác nhận trước khi
xử lý bất đồng bộ, hoặc cần ngữ nghĩa phản hồi dành riêng cho giao thức. Chỉ khai
báo một trong các chính sách theo giai đoạn khi bộ nhận thực sự dùng ngữ cảnh
nhận để dời xác nhận của nền tảng về sau.

Chính sách:

| Chính sách             | Dùng khi                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `after_receive_record` | Nền tảng có thể được xác nhận sau khi sự kiện đầu vào được phân tích cú pháp và ghi lại.  |
| `after_agent_dispatch` | Nền tảng nên chờ cho đến khi việc dispatch agent đã được chấp nhận.                       |
| `after_durable_send`   | Nền tảng nên chờ cho đến khi lần gửi cuối cùng có quyết định bền vững.                    |
| `manual`               | Plugin sở hữu việc xác nhận vì ngữ nghĩa nền tảng không khớp với một giai đoạn chung.     |

Dùng `createMessageReceiveContext(...)` trong các bộ nhận trì hoãn trạng thái
ack, và `shouldAckMessageAfterStage(...)` khi bộ nhận cần kiểm tra liệu một giai
đoạn đã thỏa mãn chính sách đã cấu hình hay chưa.

## Kiểm thử hợp đồng

Các khai báo khả năng là một phần của hợp đồng Plugin. Hãy bảo chứng chúng bằng
kiểm thử:

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

Thêm bộ kiểm thử bằng chứng trực tiếp và nhận khi adapter khai báo các tính năng
đó. Thiếu bằng chứng nên làm kiểm thử thất bại thay vì âm thầm mở rộng bề mặt
bền vững.

## API tương thích không còn khuyến nghị

Các API này vẫn có thể được import để tương thích với bên thứ ba. Không dùng
chúng cho mã kênh mới.

| API không còn khuyến nghị                    | Thay thế                                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                        |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` cho dispatcher tương thích, hoặc adapter `message` cho mã kênh mới                 |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` cộng với `channel.turn.runPrepared(...)`, hoặc adapter `message` cho mã kênh mới    |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` cộng với `channel.turn.runPrepared(...)`, hoặc adapter `message` cho mã kênh mới    |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` cộng với `channel.turn.runPrepared(...)`, hoặc adapter `message` cho mã kênh mới    |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` hoặc `deliverInboundReplyWithMessageSendContext(...)` từ `channel-message-runtime`            |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` từ `openclaw/plugin-sdk/channel-message-runtime`                            |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` cộng với `channel.turn.runPrepared(...)`, hoặc adapter `message` cho mã kênh mới    |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` cộng với `channel.turn.runPrepared(...)`, hoặc adapter `message` cho mã kênh mới    |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                          |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` cộng với `deliverWithFinalizableLivePreviewAdapter(...)`                          |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                  |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                                 |

Các dispatcher tương thích vẫn có thể dùng `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)`, và `createTypingCallbacks(...)` thông qua facade
thông báo. Mã vòng đời mới nên tránh subpath `channel-reply-pipeline` cũ.

## Danh sách kiểm tra di trú

1. Thêm `message: defineChannelMessageAdapter(...)` hoặc
   `message: createChannelMessageAdapterFromOutbound(...)` vào Plugin kênh.
2. Trả về `MessageReceipt` từ các lần gửi văn bản, phương tiện và payload.
3. Chỉ khai báo những khả năng được hành vi gốc và kiểm thử bảo chứng.
4. Thay thế các bản đồ yêu cầu bền vững viết tay bằng
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Chuyển việc hoàn tất bản xem trước qua các helper xem trước trực tiếp khi kênh
   chỉnh sửa thông báo nháp tại chỗ.
6. Chỉ khai báo chính sách ack nhận khi bộ nhận thực sự có thể trì hoãn xác nhận
   của nền tảng.
7. Chỉ giữ các helper dispatch phản hồi cũ tại các rìa tương thích.
