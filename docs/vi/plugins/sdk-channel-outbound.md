---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc đường dẫn gửi của Plugin kênh nhắn tin
    - Bạn cần cơ chế gửi phản hồi cuối cùng bền vững, biên nhận, hoàn tất bản xem trước trực tiếp hoặc chính sách xác nhận đã nhận.
    - Bạn đang di chuyển khỏi các hàm hỗ trợ gửi phản hồi kiểu cũ hoặc gửi tin nhắn qua kênh
summary: 'API vòng đời tin nhắn gửi đi cho các plugin kênh: bộ điều hợp, biên nhận, gửi bền vững, xem trước trực tiếp và các hàm hỗ trợ pipeline trả lời'
title: API gửi đi của kênh
x-i18n:
    generated_at: "2026-07-20T04:29:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8edeca81d2e9261f33be1d538153caaea87caedb90dfccac33dd227c924501f1
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin kênh cung cấp hành vi gửi tin nhắn đi từ
`openclaw/plugin-sdk/channel-outbound`. Sử dụng
`openclaw/plugin-sdk/channel-inbound` để điều phối việc nhận/ngữ cảnh/điều phối
xử lý.

Lõi sở hữu việc xếp hàng, tính bền vững, **bộ giám sát và tiến trình rút cạn đầu vào bền vững**
(`createChannelIngressMonitor`, `createChannelIngressDrain` và
`openChannelIngressDrain`), chính sách thử lại chung, vòng đời tiếp nhận lượt
(`turnAdoptionLifecycle` / `bindIngressLifecycleToReplyOptions`), hook,
biên nhận và công cụ `message` dùng chung. Plugin sở hữu các lệnh gọi
gửi/chỉnh sửa/xóa gốc, chuẩn hóa đích, luồng hội thoại của nền tảng, trích dẫn
được chọn, cờ thông báo, trạng thái tài khoản, kiểm tra đầu vào và mã hóa
payload, khóa làn, vị từ không thể thử lại, quyền thay thế tùy chọn
và các hiệu ứng phụ dành riêng cho nền tảng.

## Bộ giám sát đầu vào bền vững

Sử dụng `createChannelIngressMonitor(...)` khi một kênh phải lưu bền vững các
sự kiện truyền tải đã chấp nhận trước khi điều phối xử lý. Thành phần này kết hợp hàng đợi đầu vào và tiến trình rút cạn
của kênh với vòng đời dùng chung cho việc tiếp nhận, thăm dò, lược bỏ, phân phối
và tắt. Chỉ sử dụng `createChannelIngressDrain(...)` cấp thấp hơn khi lớp truyền tải
sở hữu một hợp đồng tiếp nhận hoặc bơm khác biệt đáng kể.

Các tùy chọn bắt buộc là:

| Tùy chọn                           | Hợp đồng                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queue`                          | Một `ChannelIngressQueue`, hoặc factory lười mở hàng đợi theo phạm vi tài khoản.                                                                                                                                                                                                                                  |
| `inspect(raw, context)`          | Trả về `eventId` ổn định và `laneKey` đã tuần tự hóa, hoặc `null` cho một sự kiện bị bỏ qua. Các dữ kiện tại thời điểm nhận quyền xử lý phải khớp với id và làn đã lưu bền vững.                                                                                                                                                                    |
| `payload`                        | Cung cấp phiên bản payload cùng chức năng tuần tự hóa/giải tuần tự hóa phần thân. Sử dụng `storage: "raw-event"` cho phong bì chuỗi `{ version, rawEvent }` tiêu chuẩn, hoặc cung cấp callback mã hóa/giải mã tùy chỉnh cho một hình dạng hiện có dành riêng cho kênh. `createClaimError` phân loại phiên bản không hợp lệ hoặc danh tính đã thay đổi. |
| `deliver(raw, lifecycle, claim)` | Điều phối xử lý một sự kiện đã giải mã và nhận toàn bộ vòng đời tiếp nhận. Có thể trả về `completed`, `deferred`, `failed-retryable` hoặc không trả về gì.                                                                                                                                                                |
| `pollIntervalMs`                 | Lên lịch các lần thăm dò phục hồi/rút cạn trong khi bộ giám sát đang chạy.                                                                                                                                                                                                                                                     |
| `retention`                      | Cung cấp nhịp lược bỏ cùng TTL và giới hạn số mục đã hoàn tất/thất bại.                                                                                                                                                                                                                                              |

Bộ giám sát tuần tự hóa các lượt tiếp nhận để thời gian chờ tăng dần khi nối thêm không thể đảo thứ tự một làn. Các
khoảng trễ nối thêm có giới hạn mặc định là `0`, `100` và `300` ms; khi dùng hết
các lần thử, callback truyền tải bị từ chối thay vì điều phối xử lý một sự kiện chưa được
lưu bền vững. Tại thời điểm nhận quyền xử lý, bộ giám sát giải mã payload có phiên bản, chạy lại `inspect` và
từ chối id hoặc làn không khớp trước khi phân phối.

`deliver` nhận `onAdopted`, `onDeferred`, `onAdoptionFinalizing`,
`onAbandoned` và `abortSignal`. Trả về mà không bàn giao rõ ràng sẽ đánh dấu một
sự kiện kết thúc không điều phối xử lý là đã được tiếp nhận. `admission` luôn là `exclusive`. Một
lượt bàn giao trì hoãn giữ quyền xử lý, còn việc tắt hoặc hủy bỏ khiến công việc chưa được tiếp nhận
vẫn có thể thử lại. Bộ giám sát theo dõi việc phân phối độc lập với quá trình giải quyết quyền xử lý
vì việc tiếp nhận có thể tạo bia mộ cho một hàng trước khi promise phân phối của kênh
trả về.

Các cài đặt tùy chọn bao gồm khoảng trễ nối thêm tùy chỉnh, khối tùy chọn `drain` cho
chính sách thứ tự/đồng thời/thử lại nâng cao của tiến trình rút cạn, một `abortSignal` bên ngoài, một
đồng hồ, báo cáo lỗi bộ bơm, factory lỗi đã dừng và chính sách tiếp nhận.
Bộ giám sát được trả về cung cấp `admit`, `start`, `pause`, `stop`, `waitForIdle`,
`isRunning` và `isStopped`. `stop` trước tiên giải quyết các lượt tiếp nhận đã chấp nhận, sau đó
hủy bỏ và giải phóng tiến trình rút cạn, chờ bộ bơm và các lượt phân phối đang hoạt động, rồi
giải phóng lần nữa để khép lại tình huống tranh chấp khi khởi tạo lười.

Giữ việc biên tập ẩn dữ liệu dành riêng cho lớp truyền tải, xác thực phong bì thô, phân loại
không thể thử lại và hình dạng payload đã lưu bền vững trong plugin. Các lớp truyền tải Webhook
chỉ nên xác nhận sau khi `admit` được giải quyết; các lớp truyền tải không phát lại nên
báo lỗi khi dùng hết các lần nối thêm bền vững thay vì âm thầm điều phối xử lý.

## Bộ chuyển đổi

Hầu hết plugin định nghĩa một bộ chuyển đổi `message`:

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

Chỉ khai báo các khả năng mà lớp truyền tải gốc thực sự bảo toàn. Bao phủ
từng khả năng gửi, biên nhận, xem trước trực tiếp và xác nhận nhận đã khai báo bằng
các trình trợ giúp hợp đồng được xuất từ đường dẫn con này.

## Ngăn chặn tiếng vọng đầu ra

Khi một nền tảng có thể phân phối lại tin nhắn đầu ra của chính plugin dưới dạng đầu vào, hãy gọi `recordOutboundMessageIdentity(...)` với kênh, tài khoản, cuộc hội thoại và một danh tính tin nhắn hoặc nguồn ổn định của nền tảng. Đường dẫn lượt đầu vào dùng chung loại bỏ các danh tính khớp trong khoảng thời gian giới hạn 30 giây trước khi ghi phiên hoặc điều phối tác nhân; danh tính nguồn có thể được dành trước khi gửi hoặc làm mới khi một tuyến kênh bị xóa để khép lại các tình huống tranh chấp phân phối. `isRecentOutboundMessageIdentity(...)` cung cấp cùng truy vấn đó cho việc chẩn đoán và kiểm thử kênh. Không duy trì song song một bộ nhớ đệm TTL cục bộ của kênh cho cùng danh tính ổn định.

## Làm sạch văn bản thuần túy

Sử dụng `sanitizeForPlainText(...)` khi bộ chuyển đổi đầu ra cần chuyển đổi
các thẻ định dạng HTML được hỗ trợ thành cú pháp đánh dấu văn bản nhẹ. Mặc định giữ lại
các dấu in đậm và gạch ngang kiểu trò chuyện hiện có. Chỉ truyền
`{ style: "markdown" }` khi kênh phân tích lại kết quả dưới dạng Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Kiểu Markdown sử dụng `**bold**` và `~~strikethrough~~`; chữ nghiêng và mã nội tuyến
giữ các dấu `_italic_` và dấu backtick trong cả hai kiểu. Chọn kiểu tại
ranh giới kênh thay vì viết lại văn bản dấu sau khi làm sạch.

## Bằng chứng phân phối

Một `MessageReceipt` ghi lại kết quả do bộ chuyển đổi kênh trả về. Các
mã định danh tin nhắn cụ thể của nền tảng cho thấy đường dẫn gửi của nền tảng đã chấp nhận
tin nhắn; chúng không chứng minh rằng thiết bị của người nhận đã hiển thị hoặc đọc tin nhắn đó.
Các biên nhận không có mã định danh tin nhắn của nền tảng chỉ là siêu dữ liệu biên nhận cục bộ.
Các kênh có biên nhận đã đọc hoặc trạng thái phân phối đến thiết bị nên theo dõi các dữ kiện đó
qua một đường dẫn riêng dành cho kênh.

Nếu bộ chuyển đổi kênh có thể chứng minh rằng việc thử lại một lỗi không thể tạo bản sao của
lượt gửi hiển thị cho người nhận và chưa có lệnh gọi có khả năng hoàn tất nào bắt đầu, hãy ném
`new PlatformMessageNotDispatchedError("...", { cause: error })` từ
`openclaw/plugin-sdk/error-runtime`. Khi đó lõi có thể xóa bằng chứng cũ về lần thử gửi
và thử lại ý định đã xếp hàng một cách an toàn. Chỉ bộ chuyển đổi sở hữu
ranh giới điều phối cuối cùng mới có thể đưa ra khẳng định này. Không bao giờ sử dụng dấu hiệu này sau khi
một lệnh gọi hoàn tất/gửi bắt đầu hoặc trả về kết quả không rõ ràng; đánh dấu sai có thể
tạo tin nhắn trùng lặp.

## Các bộ chuyển đổi đầu ra hiện có

Nếu kênh đã có bộ chuyển đổi `outbound` tương thích, hãy suy dẫn
bộ chuyển đổi tin nhắn thay vì sao chép mã gửi:

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

## Lượt gửi bền vững

Các trình trợ giúp gửi khi chạy cũng nằm trên `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- các trình trợ giúp phát trực tuyến/tiến trình bản nháp như `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` trả về một kết quả rõ ràng:

| Kết quả          | Ý nghĩa                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | ít nhất một tin nhắn hiển thị của nền tảng đã được đường dẫn gửi của nền tảng chấp nhận            |
| `suppressed`     | không tin nhắn nền tảng nào nên được coi là bị thiếu                                        |
| `partial_failed` | ít nhất một tin nhắn nền tảng đã được chấp nhận trước khi một payload hoặc hiệu ứng phụ sau đó thất bại |
| `failed`         | không tạo ra biên nhận nền tảng nào                                                        |

Sử dụng `payloadOutcomes` khi một lô kết hợp các payload đã gửi, đã bỏ qua và
thất bại. Không suy luận việc hook hủy từ một kết quả phân phối trực tiếp cũ
trống.

## Tiếp nhận phân phối trì hoãn

Sử dụng `message.durableFinal.admitDeferredDelivery(...)` khi một tài khoản đã phân giải
không thể chấp nhận an toàn lượt gửi đi do lõi quản lý hoặc phân phối trì hoãn. Lõi gọi
hook này đồng bộ trước công việc đầu ra trực tiếp, bao gồm các đường dẫn bỏ qua
việc lưu bền vững vào hàng đợi, và gọi lại trước khi phát lại một ý định đã phục hồi. Ngữ cảnh
bao gồm `cfg`, `channel`, `to`, `accountId` và một `phase` thuộc `live` hoặc
`recovery`.

Trả về `{ status: "allowed" }` để tiếp tục. Trả về
`{ status: "permanent_rejection", reason }` khi lượt phân phối không được
lưu bền vững, gửi trực tiếp hoặc phát lại. Một lượt từ chối trực tiếp thất bại trước khi tạo hàng đợi,
chạy hook tin nhắn hoặc thực hiện công việc nền tảng. Một lượt từ chối phục hồi đánh dấu bản ghi
đã xếp hàng là thất bại và bỏ qua việc đối soát cũng như phát lại. Bỏ qua hook
có nghĩa là được phép.

Hook là một quyết định tiếp nhận đồng bộ, không phải đường dẫn gửi. Chỉ đọc
cấu hình hoặc trạng thái runtime đã được tải; không thực hiện I/O mạng, hệ thống tệp hoặc
I/O bất đồng bộ khác. Các kiểm thử hợp đồng phải kiểm tra cả hai giai đoạn và cả hai
biến thể kết quả thông qua `ChannelMessageDurableFinalAdapter` từ
`openclaw/plugin-sdk/channel-outbound`.

## Điều phối tương thích

Tập hợp quy trình điều phối phản hồi đến thông qua `dispatchChannelInboundReply(...)`
từ `channel-inbound`. Giữ việc phân phối nền tảng trong bộ điều hợp phân phối; sử dụng
`channel-outbound` cho các bộ điều hợp tin nhắn, lượt gửi bền vững, biên nhận, bản
xem trước trực tiếp và các tùy chọn pipeline phản hồi.
