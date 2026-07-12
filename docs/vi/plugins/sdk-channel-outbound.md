---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc luồng gửi của Plugin kênh nhắn tin
    - Bạn cần cơ chế gửi phản hồi cuối bền vững, biên nhận, hoàn tất bản xem trước trực tiếp hoặc chính sách xác nhận đã nhận
    - Bạn đang di chuyển khỏi channel-message, channel-message-runtime hoặc các hàm trợ giúp điều phối phản hồi cũ.
summary: 'API vòng đời tin nhắn gửi đi dành cho các plugin kênh: bộ điều hợp, biên nhận, gửi bền vững, xem trước trực tiếp và các trình trợ giúp quy trình phản hồi'
title: API gửi đi của kênh
x-i18n:
    generated_at: "2026-07-12T08:13:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Các Plugin kênh cung cấp hành vi gửi tin nhắn đi từ
`openclaw/plugin-sdk/channel-outbound`. Sử dụng
`openclaw/plugin-sdk/channel-inbound` để điều phối việc nhận/ngữ cảnh/điều phối
xử lý.

Lõi chịu trách nhiệm về xếp hàng đợi, tính bền vững, chính sách thử lại chung, hook, biên nhận và
công cụ `message` dùng chung. Plugin chịu trách nhiệm về các lệnh gọi gửi/sửa/xóa gốc,
chuẩn hóa đích, luồng hội thoại của nền tảng, trích dẫn được chọn, cờ thông báo,
trạng thái tài khoản và các tác dụng phụ dành riêng cho nền tảng.

## Bộ điều hợp

Hầu hết Plugin định nghĩa một bộ điều hợp `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

Chỉ khai báo những khả năng mà cơ chế truyền tải gốc thực sự bảo toàn. Kiểm thử
từng khả năng gửi, biên nhận, xem trước trực tiếp và xác nhận nhận đã khai báo bằng
các trình trợ giúp hợp đồng được xuất từ đường dẫn con này.

## Làm sạch văn bản thuần

Sử dụng `sanitizeForPlainText(...)` khi bộ điều hợp gửi đi cần chuyển đổi
các thẻ định dạng HTML được hỗ trợ thành ký hiệu đánh dấu văn bản nhẹ. Mặc định giữ nguyên
các dấu đánh dấu in đậm và gạch ngang theo kiểu trò chuyện hiện có. Chỉ truyền
`{ style: "markdown" }` khi kênh phân tích lại kết quả dưới dạng Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Kiểu Markdown sử dụng `**bold**` và `~~strikethrough~~`; chữ nghiêng và mã nội tuyến
giữ các dấu `_italic_` và dấu nháy ngược trong cả hai kiểu. Chọn kiểu tại
ranh giới kênh thay vì viết lại văn bản đánh dấu sau khi làm sạch.

## Bằng chứng phân phối

Một `MessageReceipt` ghi lại kết quả do bộ điều hợp kênh trả về. Các
mã định danh tin nhắn cụ thể của nền tảng cho thấy đường dẫn gửi của nền tảng đã chấp nhận
tin nhắn; chúng không chứng minh rằng thiết bị của người nhận đã hiển thị hoặc đọc tin nhắn đó.
Các biên nhận không có mã định danh tin nhắn của nền tảng chỉ là siêu dữ liệu biên nhận cục bộ.
Các kênh có biên nhận đã đọc hoặc trạng thái phân phối đến thiết bị nên theo dõi những thông tin đó
thông qua một đường dẫn riêng dành riêng cho kênh.

Nếu bộ điều hợp kênh có thể chứng minh rằng việc thử lại một lỗi không thể tạo bản sao của
lần gửi hiển thị cho người nhận và chưa có lệnh gọi nào có khả năng hoàn tất bắt đầu, hãy ném
`new PlatformMessageNotDispatchedError("...", { cause: error })` từ
`openclaw/plugin-sdk/error-runtime`. Khi đó, lõi có thể xóa bằng chứng cũ về lần thử gửi
và thử lại ý định đã xếp hàng một cách an toàn. Chỉ bộ điều hợp sở hữu
ranh giới điều phối cuối cùng mới được đưa ra khẳng định này. Tuyệt đối không sử dụng dấu hiệu này sau khi
một lệnh gọi hoàn tất/gửi bắt đầu hoặc trả về kết quả không rõ ràng; đánh dấu sai có thể
gửi trùng tin nhắn.

## Các bộ điều hợp gửi đi hiện có

Nếu kênh đã có bộ điều hợp `outbound` tương thích, hãy dẫn xuất
bộ điều hợp tin nhắn thay vì sao chép mã gửi:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Gửi bền vững

Các trình trợ giúp gửi lúc chạy cũng nằm trong `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- các trình trợ giúp truyền trực tuyến bản nháp/tiến trình như `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` trả về một kết quả rõ ràng:

| Kết quả          | Ý nghĩa                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | ít nhất một tin nhắn hiển thị trên nền tảng đã được đường dẫn gửi của nền tảng chấp nhận |
| `suppressed`     | không tin nhắn nền tảng nào nên bị coi là thiếu                                          |
| `partial_failed` | ít nhất một tin nhắn nền tảng đã được chấp nhận trước khi một tải trọng hoặc tác dụng phụ sau đó thất bại |
| `failed`         | không có biên nhận nền tảng nào được tạo                                                 |

Sử dụng `payloadOutcomes` khi một lô kết hợp các tải trọng đã gửi, bị chặn và thất bại.
Không suy ra việc hook hủy từ một kết quả phân phối trực tiếp cũ trống.

## Chấp nhận phân phối trì hoãn

Sử dụng `message.durableFinal.admitDeferredDelivery(...)` khi một tài khoản đã phân giải
không thể chấp nhận an toàn việc gửi đi hoặc phân phối trì hoãn do lõi quản lý. Lõi gọi
hook này một cách đồng bộ trước công việc gửi đi trực tiếp, bao gồm cả các đường dẫn bỏ qua
việc lưu bền hàng đợi, và gọi lại trước khi phát lại một ý định đã khôi phục. Ngữ cảnh
bao gồm `cfg`, `channel`, `to`, `accountId` và `phase` là `live` hoặc
`recovery`.

Trả về `{ status: "allowed" }` để tiếp tục. Trả về
`{ status: "permanent_rejection", reason }` khi lượt phân phối không được phép
lưu bền, gửi trực tiếp hoặc phát lại. Một lần từ chối trực tiếp sẽ thất bại trước khi tạo
hàng đợi, chạy hook tin nhắn hoặc thực hiện công việc trên nền tảng. Một lần từ chối khi khôi phục đánh dấu
bản ghi trong hàng đợi là thất bại và bỏ qua việc đối soát cũng như phát lại. Không cung cấp hook
đồng nghĩa với được phép.

Hook là một quyết định chấp nhận đồng bộ, không phải đường dẫn gửi. Chỉ đọc
cấu hình hoặc trạng thái lúc chạy đã được tải; không thực hiện I/O mạng, hệ thống tệp hay
I/O bất đồng bộ khác. Các kiểm thử hợp đồng nên kiểm tra cả hai giai đoạn và cả hai
biến thể kết quả thông qua `ChannelMessageDurableFinalAdapter` từ
`openclaw/plugin-sdk/channel-outbound`.

## Điều phối tương thích

Xây dựng việc điều phối phản hồi đầu vào thông qua `dispatchChannelInboundReply(...)`
từ `channel-inbound`. Giữ việc phân phối qua nền tảng trong bộ điều hợp phân phối; sử dụng
`channel-outbound` cho các bộ điều hợp tin nhắn, gửi bền vững, biên nhận, xem trước trực tiếp
và các tùy chọn quy trình phản hồi.
