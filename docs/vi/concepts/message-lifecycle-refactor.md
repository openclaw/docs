---
read_when:
    - Tái cấu trúc hành vi gửi hoặc nhận của kênh
    - Thay đổi luồng tin nhắn đến của kênh, cơ chế điều phối phản hồi, hàng đợi gửi đi, luồng xem trước hoặc các API tin nhắn của SDK Plugin
    - Thiết kế Plugin kênh mới cần gửi bền vững, biên nhận, bản xem trước, chỉnh sửa hoặc thử lại
summary: 'Trạng thái của vòng đời nhận/gửi tin nhắn bền vững: những gì đã được phát hành, những gì đã thay đổi so với thiết kế ban đầu và những gì vẫn còn bỏ ngỏ'
title: Tái cấu trúc vòng đời tin nhắn
x-i18n:
    generated_at: "2026-07-12T07:54:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Trang này ban đầu là một đề xuất thiết kế hướng tới tương lai. Phần cốt lõi của
thiết kế đó sau này đã được phát hành trong `src/channels/message/*` và các đường dẫn con công khai
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Đối với API
hiện tại, hãy sử dụng [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound) và
[API nhận vào của kênh](/vi/plugins/sdk-channel-inbound). Trang này theo dõi những gì
đã được phát hành, những điểm triển khai khác với bản phác thảo ban đầu và những vấn đề
vẫn còn bỏ ngỏ.
</Note>

## Tại sao việc tái cấu trúc này diễn ra

Ngăn xếp kênh phát triển từ một số bản sửa lỗi cục bộ: các trình trợ giúp nhận vào riêng biệt cho từng
mức độ trưởng thành (`runtime.channel.inbound.run` cho các bộ điều hợp đơn giản,
`runtime.channel.inbound.runPreparedReply` cho các bộ điều hợp phong phú), các trình trợ giúp điều phối phản hồi
cũ (`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
luồng xem trước dành riêng cho từng kênh và độ bền của lần phân phối cuối cùng được gắn thêm vào
các đường dẫn tải trọng phản hồi hiện có. Cấu trúc đó tạo ra quá nhiều khái niệm công khai và
quá nhiều nơi mà ngữ nghĩa phân phối có thể sai lệch.

Khoảng trống về độ tin cậy đã buộc phải thiết kế lại:

```text
Bản cập nhật thăm dò Telegram đã được xác nhận
  -> văn bản cuối cùng của trợ lý đã tồn tại
  -> tiến trình khởi động lại trước khi sendMessage thành công
  -> phản hồi cuối cùng bị mất
```

Bất biến mục tiêu: sau khi lõi quyết định rằng một tin nhắn gửi đi hiển thị được phải tồn tại,
ý định gửi phải được lưu bền vững trước khi thử gọi nền tảng, và biên nhận
của nền tảng phải được ghi nhận sau khi thành công. Điều đó mặc định cung cấp khả năng khôi phục
ít nhất một lần. Hành vi chính xác một lần chỉ tồn tại khi bộ điều hợp chứng minh được
tính lũy đẳng gốc hoặc đối soát một lần thử không rõ trạng thái sau khi gửi với
trạng thái nền tảng trước khi phát lại.

## Những gì đã được phát hành

Miền nội bộ nằm trong `src/channels/message/*`:

| Tệp                         | Chịu trách nhiệm                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | Các hợp đồng kiểu cho bộ điều hợp, ngữ cảnh gửi, biên nhận và ý định bền vững                                              |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — ngữ cảnh gửi bền vững                                        |
| `receive.ts`                | `createMessageReceiveContext` — máy trạng thái chính sách xác nhận nhận vào                                                |
| `live.ts`                   | Trạng thái xem trước trực tiếp và logic hoàn tất tại chỗ hoặc chuyển sang phương án dự phòng                               |
| `state.ts`                  | `classifyDurableSendRecoveryState` — phân loại khôi phục sau khi bị gián đoạn                                               |
| `receipt.ts`                | Chuẩn hóa kết quả gửi của nền tảng thành `MessageReceipt`                                                                  |
| `capabilities.ts`           | Suy ra các khả năng bắt buộc cho lần gửi cuối bền vững từ một tải trọng                                                    |
| `contracts.ts`              | Xác minh bằng chứng hợp đồng cho các khả năng mà bộ điều hợp khai báo                                                       |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                              |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — bọc các hàm cũ `sendText`/`sendMedia`/`sendPayload`/`sendPoll`                  |
| `ingress-queue.ts`          | `createChannelIngressQueue` — hàng đợi sự kiện nhận vào bền vững                                                           |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — nhật ký chấp nhận/đang chờ/hoàn tất/giải phóng để chống trùng lặp dữ liệu nhận vào   |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` và các trình bao có tên cũ                                                                   |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, các trình trợ giúp tiền tố phản hồi và lệnh gọi lại trạng thái đang nhập                     |

Bề mặt công khai: `openclaw/plugin-sdk/channel-outbound` (các trình trợ giúp gửi/biên nhận/bền vững/trực tiếp/đường ống phản hồi)
và `openclaw/plugin-sdk/channel-inbound` (ngữ cảnh nhận vào, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Hãy xem các trang đó để biết ví dụ về bộ điều hợp, tên kiểu hiện tại
và ghi chú di chuyển — đó là nguồn thông tin chính xác cho cấu trúc API,
không phải các bản phác thảo bên dưới.

### Ngữ cảnh gửi

`withDurableMessageSendContext` cung cấp cho mã kênh các bước `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` và `fail` xung quanh một tin nhắn
gửi đi. `sendDurableMessageBatch` là trình bao cho trường hợp phổ biến: kết xuất, gửi,
sau đó ghi nhận khi `sent`/`suppressed` hoặc đánh dấu thất bại khi có lỗi.

`sendDurableMessageBatch` trả về một kết quả phân biệt:

| Trạng thái       | Ý nghĩa                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `sent`           | Ít nhất một tin nhắn hiển thị được trên nền tảng đã được phân phối                        |
| `suppressed`     | Không có tin nhắn nền tảng nào nên được coi là bị thiếu (bị hook hủy, chạy thử, v.v.)     |
| `partial_failed` | Ít nhất một tin nhắn đã được phân phối trước khi tải trọng hoặc hiệu ứng phụ sau đó thất bại |
| `failed`         | Không tạo ra biên nhận nào từ nền tảng                                                    |

Độ bền là một trong `required`, `best_effort` hoặc `disabled`
(`MessageDurabilityPolicy` trong `src/channels/message/types.ts`). `required`
dừng an toàn khi không thể ghi ý định bền vững; `best_effort` chuyển sang
gửi trực tiếp khi không thể lưu bền vững; `disabled` giữ nguyên
hành vi gửi trực tiếp trước khi tái cấu trúc. Các trình trợ giúp tương thích cũ mặc định là
`disabled` và không suy ra `required` chỉ vì một kênh có bộ điều hợp
gửi đi chung.

Ranh giới vẫn nguy hiểm: sau khi lệnh gọi nền tảng thành công và trước khi
biên nhận được ghi nhận. Nếu tiến trình dừng tại đó, lõi không thể biết liệu
tin nhắn nền tảng có tồn tại hay không, trừ khi bộ điều hợp khai báo `reconcileUnknownSend`.
Hook đó phân loại một lần gửi bị gián đoạn thành `sent`, `not_sent` hoặc
`unresolved`; chỉ `not_sent` cho phép phát lại. Các kênh không có khả năng đối soát
sẽ chuyển về trạng thái `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) và chỉ có thể chọn phát lại
ít nhất một lần nếu việc xuất hiện các tin nhắn hiển thị trùng lặp là một
sự đánh đổi có thể chấp nhận và đã được ghi lại cho kênh đó.

### Ngữ cảnh nhận

`createMessageReceiveContext` theo dõi trạng thái xác nhận/từ chối xác nhận cho từng sự kiện nhận vào bằng
`ack()` có tính lũy đẳng và `nack(error)` tường minh. Chính sách xác nhận
(`ChannelMessageReceiveAckPolicy`) là một trong:

| Chính sách             | Xác nhận khi                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `after_receive_record` | Lõi đã lưu đủ siêu dữ liệu nhận vào để chống trùng lặp/định tuyến một lần phân phối lại                          |
| `after_agent_dispatch` | Lượt chạy của tác nhân đã được điều phối                                                                         |
| `after_durable_send`   | Lần gửi đi bền vững cho lượt này đã được ghi nhận                                                                |
| `manual`               | Bên gọi kiểm soát rõ ràng thời điểm xác nhận (mặc định cho các bộ điều hợp không khai báo chính sách)            |

Cơ chế thăm dò Telegram sử dụng tính năng này để lưu một mốc cập nhật đã hoàn tất an toàn
(`safeCompletedUpdateId` trong `extensions/telegram/src/bot-update-tracker.ts`):
grammY vẫn quan sát mọi bản cập nhật khi chúng đi vào chuỗi phần mềm trung gian, nhưng
OpenClaw chỉ đẩy mốc khởi động lại đã lưu vượt qua các bản cập nhật
đã hoàn tất điều phối, vì vậy các bản cập nhật thất bại hoặc vẫn đang chờ sẽ được phát lại sau khi khởi động lại.
Độ lệch `getUpdates` thượng nguồn của Telegram vẫn do grammY quản lý; một
nguồn thăm dò hoàn toàn bền vững có khả năng kiểm soát việc phân phối lại ở cấp nền tảng vượt ngoài
mốc này vẫn chưa được xây dựng (xem Các câu hỏi còn bỏ ngỏ).

### Xem trước trực tiếp

`src/channels/message/live.ts` mô hình hóa việc xem trước/chỉnh sửa/hoàn tất thành một vòng đời:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` và
`deliverFinalizableLivePreviewAdapter` (tạo một bản chỉnh sửa cuối cùng từ bản nháp, áp dụng
bản chỉnh sửa đó và chuyển sang gửi bình thường khi không thể chỉnh sửa hoặc chỉnh sửa thất bại).
`LiveMessageState.phase` là `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` kiểm soát việc một bản xem trước có thể trở thành tin nhắn
cuối cùng thông qua chỉnh sửa thay vì gửi mới hay không.

### Biên nhận bền vững

`MessageReceipt` (`src/channels/message/types.ts`) chuẩn hóa một hoặc nhiều
mã định danh tin nhắn nền tảng từ một lần gửi logic thành `platformMessageIds` cùng với
`parts` cho từng phần (loại, chỉ mục, mã định danh luồng, mã định danh tin nhắn được phản hồi). Một mã định danh chính được giữ lại
để tạo luồng và chỉnh sửa sau này. Đây là yếu tố giúp các lần phân phối nhiều phần (văn bản
kèm phương tiện, văn bản được chia đoạn, phương án dự phòng cho thẻ) có thể phát lại và chống trùng lặp sau
khi khởi động lại.

### Thu gọn SDK công khai

Quá trình tái cấu trúc đã hợp nhất hoặc ngừng khuyến nghị: các trình trợ giúp `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, `reply-payload` từng được công khai dưới dạng
API, `inbound-reply-dispatch`, `channel-reply-pipeline` và phần lớn cách sử dụng công khai
của `outbound-runtime`. `src/plugin-sdk/channel-message.ts` hiện là một
barrel tái xuất `@deprecated` trỏ đến `channel-outbound` /
`channel-inbound`; các bí danh thời gian chạy `channel.turn` đã bị loại bỏ và trang tài liệu
`/plugins/sdk-channel-turn` cũ chuyển hướng đến
[API nhận vào của kênh](/vi/plugins/sdk-channel-inbound). Mã Plugin mới nên
nhắm trực tiếp đến `channel-outbound` và `channel-inbound`.

## Những điểm triển khai khác với thiết kế ban đầu

Bản phác thảo thiết kế bên dưới chưa bao giờ được phát hành đúng nguyên văn như mô tả. Nội dung này được lưu lại để
đảm bảo tính chính xác lịch sử; không xem các tên kiểu này là API hiện tại.

- **Không có `MessageOrigin` / `shouldDropOpenClawEcho`.** Kế hoạch ban đầu yêu cầu
  một thẻ nguồn gốc `source: "openclaw"` trên các tin nhắn lỗi Gateway cùng với một
  vị từ dùng chung để loại bỏ các tiếng vọng do bot tạo và đã được gắn thẻ trong các phòng dùng chung
  trước bước ủy quyền `allowBots`. Kiểu và vị từ đó không tồn tại trong
  cơ sở mã. Bản thân `allowBots` là một khóa cấu hình thực sự cho từng kênh (Slack,
  Discord, Google Chat và các kênh khác), nhưng cơ chế gắn thẻ nguồn gốc nhằm
  bảo vệ nó chưa bao giờ được xây dựng. Việc chặn tiếng vọng lỗi Gateway trong
  các phòng bật bot vẫn là một khoảng trống chưa được giải quyết, không phải một bảo đảm đã được phát hành.
- **Không có không gian tên thống nhất `core.messages.receive/send/live/state`.** Các
  hàm đã phát hành nằm trực tiếp trong `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) thay vì
  nằm sau một facade `core.messages.*`.
- **Không có kiểu tin nhắn chuẩn hóa chung `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Lõi vẫn truyền các tải trọng phản hồi cụ thể
  (`ReplyPayload`) và ngữ cảnh dành riêng cho từng kênh qua các bộ điều hợp gửi
  thay vì một cấu trúc tin nhắn trung lập với nền tảng có quan hệ `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Tên chính sách xác nhận khác với bản phác thảo.** Đã phát hành:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Bản phác thảo ban đầu sử dụng `immediate | after-record | after-durable-send |
manual` với trường lý do hết thời gian chờ Webhook; cấu trúc đó chưa được xây dựng.
- **Các khóa khả năng `DurableFinalDeliveryRequirementMap` đã thay thế đối tượng
  `MessageCapabilities` trong bản phác thảo.** Các khả năng là những cờ boolean phẳng (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) được xác minh thông qua `verifyDurableFinalCapabilityProofs` thay vì
  cấu trúc lồng nhau theo kiểu `text.chunking` / `attachments.voice`.

## Các rủi ro di chuyển cụ thể (vẫn còn liên quan)

Các tác dụng phụ dành riêng cho từng kênh này đã tồn tại từ trước đợt tái cấu trúc và phải tiếp tục
hoạt động thông qua các đường gửi mới. Chúng không phải là giả định: mỗi tác dụng phụ
đều đang được triển khai và giữ vai trò thiết yếu hiện nay.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): trình giám sát ghi lại các tin nhắn đã gửi vào bộ nhớ đệm
  tiếng vọng sau khi gửi thành công. Các lần gửi cuối cùng bền vững vẫn phải điền dữ liệu vào
  bộ nhớ đệm đó, nếu không OpenClaw có thể nạp lại chính các phản hồi của mình dưới dạng tin nhắn đến từ người dùng.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): nối thêm chữ ký mô hình không bắt buộc
  và ghi lại các luồng đã tham gia sau khi phản hồi trong nhóm. Việc gửi bền vững
  không được bỏ qua các tác dụng này.
- **Discord và các bộ điều phối đã chuẩn bị khác** đã tự quản lý việc gửi trực tiếp và
  hành vi xem trước. Một kênh chưa bền vững từ đầu đến cuối cho đến khi bộ điều phối
  đã chuẩn bị của kênh đó định tuyến rõ ràng các kết quả cuối cùng qua ngữ cảnh gửi; không được giả định
  rằng chỉ riêng bộ điều hợp chung đã bao phủ đầy đủ.
- **Việc gửi dự phòng im lặng của Telegram** phải gửi toàn bộ mảng tải trọng đã chiếu,
  không chỉ tải trọng đầu tiên, sau khi chia đoạn/chiếu dự phòng.
- **LINE, Zalo, Nostr** và các đường dẫn trợ giúp tương tự có thể xử lý mã thông báo phản hồi,
  proxy phương tiện, bộ nhớ đệm tin nhắn đã gửi hoặc các đích chỉ dành cho lệnh gọi lại.
  Chúng tiếp tục sử dụng cơ chế gửi do kênh sở hữu cho đến khi các ngữ nghĩa đó được biểu diễn bởi
  bộ điều hợp gửi và được kiểm thử bao phủ.
- **Các hàm trợ giúp tin nhắn trực tiếp** có thể có một lệnh gọi lại phản hồi là đích truyền tải
  chính xác duy nhất. Cơ chế gửi đi chung không được suy đoán đích từ các trường nền tảng
  thô rồi bỏ qua lệnh gọi lại đó.

## Phân loại lỗi

Các bộ điều hợp phân loại lỗi truyền tải thành các danh mục đóng kiểu
`DeliveryFailureKind` (tạm thời, giới hạn tốc độ, xác thực, quyền, không tìm thấy, tải trọng
không hợp lệ, xung đột, đã hủy, không xác định). Chính sách cốt lõi:

- Thử lại các lỗi tạm thời và lỗi giới hạn tốc độ.
- Không thử lại lỗi tải trọng không hợp lệ trừ khi có phương án kết xuất dự phòng.
- Không thử lại lỗi xác thực hoặc quyền cho đến khi cấu hình thay đổi.
- Khi không tìm thấy, cho phép quá trình hoàn tất trực tiếp chuyển từ chỉnh sửa sang gửi mới khi
  kênh tuyên bố việc đó là an toàn.
- Khi có xung đột, sử dụng trạng thái biên nhận/tính lũy đẳng để xác định xem tin nhắn
  đã tồn tại hay chưa.
- Mọi lỗi xảy ra sau khi lệnh gọi nền tảng có thể đã thành công nhưng trước khi
  biên nhận được ghi nhận đều trở thành `unknown_after_send`, trừ khi bộ điều hợp chứng minh rằng thao tác
  trên nền tảng đã không xảy ra.

## Các câu hỏi còn bỏ ngỏ

- Liệu cuối cùng Telegram có nên thay thế trình chạy thăm dò grammY (`1.43.0`)
  bằng một nguồn thăm dò hoàn toàn bền vững, kiểm soát việc gửi lại ở cấp nền tảng,
  thay vì chỉ điểm mốc khởi động lại được lưu bền vững của OpenClaw
  (`safeCompletedUpdateId`).
- Liệu trạng thái xem trước trực tiếp nên nằm trong cùng bản ghi với ý định gửi cuối cùng
  hay trong một kho lưu trữ trạng thái trực tiếp song song.
- Liệu việc ngăn tiếng vọng khi Gateway gặp lỗi trong các phòng dùng chung có bật bot
  cần cơ chế gắn thẻ nguồn gốc đã được lên kế hoạch ban đầu, một hợp đồng đơn giản hơn
  theo từng kênh, hay nằm ngoài phạm vi.
- Những kênh nào hỗ trợ nguồn gốc/siêu dữ liệu gốc để ngăn tiếng vọng giữa các bot,
  và những kênh nào cần sổ đăng ký gửi đi được lưu bền vững.

## Liên quan

- [Tin nhắn](/vi/concepts/messages)
- [Truyền phát và chia đoạn](/vi/concepts/streaming)
- [Bản nháp tiến trình](/vi/concepts/progress-drafts)
- [Chính sách thử lại](/vi/concepts/retry)
- [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound)
- [API nhận vào của kênh](/vi/plugins/sdk-channel-inbound)
