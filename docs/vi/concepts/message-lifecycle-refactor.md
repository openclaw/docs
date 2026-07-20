---
read_when:
    - Tái cấu trúc hành vi gửi hoặc nhận của kênh
    - Thay đổi API tin nhắn của plugin SDK về luồng tin đến của kênh, điều phối phản hồi, hàng đợi gửi đi hoặc truyền trực tuyến bản xem trước
    - Thiết kế Plugin kênh mới cần gửi bền vững, biên nhận, bản xem trước, chỉnh sửa hoặc thử lại
summary: 'Trạng thái vòng đời nhận/gửi tin nhắn bền vững: những gì đã được phát hành, những gì đã thay đổi so với thiết kế ban đầu và những gì vẫn còn bỏ ngỏ'
title: Tái cấu trúc vòng đời tin nhắn
x-i18n:
    generated_at: "2026-07-20T04:38:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d21eda70b8be0de78677f4ff6d7547317112731d9e86a5bef58eac0268899818
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Trang này ban đầu là một đề xuất thiết kế hướng tới tương lai. Phần cốt lõi của
thiết kế đó sau này đã được phát hành trong `src/channels/message/*` và các đường dẫn con công khai
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Đối với
API hiện tại, hãy sử dụng [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound) và
[API nhận vào của kênh](/vi/plugins/sdk-channel-inbound). Trang này theo dõi những gì
đã được phát hành, những điểm triển khai khác với bản phác thảo ban đầu và những gì
vẫn còn bỏ ngỏ.
</Note>

## Tại sao việc tái cấu trúc này diễn ra

Ngăn xếp kênh phát triển từ một số bản sửa lỗi cục bộ: các trình trợ giúp nhận vào riêng biệt cho từng
mức độ hoàn thiện (`runtime.channel.inbound.run` cho các bộ điều hợp đơn giản,
`runtime.channel.inbound.runPreparedReply` cho các bộ điều hợp phong phú), các trình trợ giúp điều phối phản hồi
cũ (`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
phát trực tuyến bản xem trước dành riêng cho từng kênh và độ bền của lần phân phối cuối cùng được bổ sung vào
các đường dẫn tải trọng phản hồi hiện có. Cấu trúc đó tạo ra quá nhiều khái niệm công khai và
quá nhiều nơi mà ngữ nghĩa phân phối có thể sai lệch.

Khoảng trống về độ tin cậy buộc phải thiết kế lại:

```text
Bản cập nhật thăm dò Telegram được xác nhận
  -> văn bản cuối cùng của trợ lý đã tồn tại
  -> tiến trình khởi động lại trước khi sendMessage thành công
  -> phản hồi cuối cùng bị mất
```

Bất biến mục tiêu: một khi lõi quyết định rằng một thông báo gửi đi hiển thị được phải tồn tại,
ý định gửi phải được lưu bền vững trước khi thử gọi nền tảng, và biên nhận
của nền tảng phải được ghi nhận sau khi thành công. Điều đó mặc định cung cấp khả năng khôi phục
ít nhất một lần. Hành vi chính xác một lần chỉ tồn tại khi bộ điều hợp chứng minh
tính lũy đẳng gốc hoặc đối soát một lần thử có trạng thái không xác định sau khi gửi với
trạng thái nền tảng trước khi phát lại.

## Những gì đã được phát hành

Miền nội bộ nằm trong `src/channels/message/*`:

| Tệp                         | Chịu trách nhiệm                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Các hợp đồng kiểu cho bộ điều hợp, ngữ cảnh gửi, biên nhận và ý định bền vững                                      |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — ngữ cảnh gửi bền vững                                |
| `receive.ts`                | `createMessageReceiveContext` — máy trạng thái chính sách xác nhận nhận vào                                         |
| `live.ts`                   | Trạng thái xem trước trực tiếp và logic hoàn tất tại chỗ hoặc dự phòng                                             |
| `state.ts`                  | `classifyDurableSendRecoveryState` — phân loại khôi phục sau khi gián đoạn                                         |
| `receipt.ts`                | Chuẩn hóa kết quả gửi của nền tảng thành `MessageReceipt`                                                          |
| `capabilities.ts`           | Suy ra các khả năng bắt buộc cho lần gửi cuối bền vững từ tải trọng                                                |
| `contracts.ts`              | Xác minh bằng chứng hợp đồng cho các khả năng được bộ điều hợp khai báo                                             |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — bao bọc các hàm cũ `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — hàng đợi sự kiện nhận vào bền vững                                                   |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — nhật ký chấp nhận/đang chờ/hoàn tất/giải phóng để loại bỏ trùng lặp nhận vào       |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` và các trình bao bọc mang tên cũ                                                   |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, các trình trợ giúp tiền tố phản hồi và hàm gọi lại trạng thái nhập               |

Bề mặt công khai: `openclaw/plugin-sdk/channel-outbound` (các trình trợ giúp gửi/biên nhận/bền vững/trực tiếp/pipeline phản hồi)
và `openclaw/plugin-sdk/channel-inbound` (ngữ cảnh nhận vào, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Xem các trang đó để biết ví dụ về bộ điều hợp, tên kiểu hiện tại
và ghi chú di chuyển — chúng là nguồn thông tin chuẩn xác cho cấu trúc API,
không phải các bản phác thảo bên dưới.

### Ngữ cảnh gửi

`withDurableMessageSendContext` cung cấp cho mã kênh các bước `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` và `fail` xoay quanh một thông báo
gửi đi. `sendDurableMessageBatch` là trình bao bọc cho trường hợp phổ biến: kết xuất, gửi,
sau đó ghi nhận khi `sent`/`suppressed` hoặc báo lỗi khi có lỗi.

`sendDurableMessageBatch` trả về một kết quả phân biệt:

| Trạng thái       | Ý nghĩa                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| `sent`           | Ít nhất một thông báo hiển thị được trên nền tảng đã được phân phối                |
| `suppressed`     | Không có thông báo nền tảng nào nên được coi là bị thiếu (bị hook hủy, chạy thử, v.v.) |
| `partial_failed` | Ít nhất một thông báo đã được phân phối trước khi tải trọng hoặc hiệu ứng phụ sau đó thất bại |
| `failed`         | Không tạo ra biên nhận nền tảng                                                   |

Độ bền là một trong `required`, `best_effort` hoặc `disabled`
(`MessageDurabilityPolicy` trong `src/channels/message/types.ts`). `required`
đóng an toàn khi không thể ghi ý định bền vững; `best_effort` chuyển tiếp
sang gửi trực tiếp khi không có khả năng lưu bền; `disabled` giữ nguyên
hành vi gửi trực tiếp trước khi tái cấu trúc. Các trình trợ giúp tương thích cũ mặc định dùng
`disabled` và không suy ra `required` chỉ vì một kênh có bộ điều hợp
gửi đi chung.

Ranh giới vẫn còn nguy hiểm: sau khi lệnh gọi nền tảng thành công và trước khi
biên nhận được ghi nhận. Nếu tiến trình dừng tại đó, lõi không thể biết liệu
thông báo nền tảng có tồn tại hay không, trừ khi bộ điều hợp khai báo `reconcileUnknownSend`.
Hook đó phân loại một lần gửi bị gián đoạn thành `sent`, `not_sent` hoặc
`unresolved`; chỉ `not_sent` cho phép phát lại. Các kênh không có khả năng đối soát
sẽ quay về trạng thái `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) và chỉ có thể chọn phát lại
ít nhất một lần nếu các thông báo hiển thị trùng lặp là một sự đánh đổi có thể chấp nhận
và đã được ghi lại cho kênh đó.

### Ngữ cảnh nhận

`createMessageReceiveContext` theo dõi trạng thái xác nhận/từ chối xác nhận cho mỗi sự kiện nhận vào với
`ack()` có tính lũy đẳng và `nack(error)` tường minh. Chính sách xác nhận
(`ChannelMessageReceiveAckPolicy`) là một trong:

| Chính sách             | Xác nhận khi                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | Lõi đã lưu bền đủ siêu dữ liệu nhận vào để loại bỏ trùng lặp/định tuyến một lần phân phối lại |
| `after_agent_dispatch` | Lượt chạy tác nhân đã được điều phối                                                           |
| `after_durable_send`   | Lần gửi đi bền vững cho lượt này đã được ghi nhận                                              |
| `manual`               | Bên gọi kiểm soát thời điểm xác nhận một cách tường minh (mặc định cho các bộ điều hợp không khai báo chính sách) |

Cơ chế thăm dò Telegram sử dụng điều này để lưu bền một mốc cập nhật đã hoàn tất an toàn
(`safeCompletedUpdateId` trong `extensions/telegram/src/bot-update-tracker.ts`):
grammY vẫn quan sát mọi bản cập nhật khi chúng đi vào chuỗi phần mềm trung gian, nhưng
OpenClaw chỉ đẩy mốc khởi động lại đã lưu qua các bản cập nhật
đã hoàn tất điều phối, nên các bản cập nhật thất bại hoặc vẫn đang chờ sẽ được phát lại sau khi khởi động lại.
Độ lệch `getUpdates` thượng nguồn của Telegram vẫn do grammY sở hữu; một nguồn thăm dò
hoàn toàn bền vững kiểm soát việc phân phối lại ở cấp nền tảng ngoài
mốc này vẫn chưa được xây dựng (xem Các câu hỏi mở).

### Bản xem trước trực tiếp

`src/channels/message/live.ts` mô hình hóa xem trước/chỉnh sửa/hoàn tất thành một vòng đời:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` và
`deliverFinalizableLivePreviewAdapter` (xây dựng một bản chỉnh sửa cuối cùng từ bản nháp, áp dụng
nó và quay về gửi bình thường khi không thể chỉnh sửa hoặc chỉnh sửa thất bại).
`LiveMessageState.phase` là `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` kiểm soát liệu bản xem trước có thể trở thành thông báo cuối cùng
thông qua chỉnh sửa thay vì gửi mới hay không.

### Biên nhận bền vững

`MessageReceipt` (`src/channels/message/types.ts`) chuẩn hóa một hoặc nhiều
id thông báo nền tảng từ một lần gửi logic thành `platformMessageIds` cộng với
`parts` cho từng phần (loại, chỉ mục, id luồng, id phản hồi). Một id chính được giữ lại
để tạo luồng và chỉnh sửa sau này. Đây là điều giúp các lần phân phối nhiều phần (văn bản
cộng với nội dung đa phương tiện, văn bản được chia đoạn, phương án dự phòng cho thẻ) có thể phát lại và loại bỏ trùng lặp sau
khi khởi động lại.

### Thu gọn SDK công khai

Quá trình tái cấu trúc đã hấp thụ hoặc ngừng dùng: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, các trình trợ giúp `reply-payload` được công khai dưới dạng
API, `inbound-reply-dispatch`, `channel-reply-pipeline` và hầu hết cách sử dụng công khai
của facade gửi đi cũ. `src/plugin-sdk/channel-message.ts` hiện là một
barrel tái xuất `@deprecated` trỏ đến `channel-outbound` /
`channel-inbound`; các bí danh thời gian chạy `channel.turn` đã bị xóa và trang tài liệu
`/plugins/sdk-channel-turn` cũ chuyển hướng đến
[API nhận vào của kênh](/vi/plugins/sdk-channel-inbound). Mã plugin mới nên
nhắm trực tiếp đến `channel-outbound` và `channel-inbound`.

## Những điểm triển khai khác với thiết kế ban đầu

Bản phác thảo thiết kế bên dưới chưa bao giờ được phát hành đúng theo mô tả. Hồ sơ được giữ lại để
đảm bảo tính chính xác lịch sử; không coi các tên kiểu này là API hiện tại.

- **Không có `MessageOrigin` / `shouldDropOpenClawEcho`.** Kế hoạch ban đầu yêu cầu
  một thẻ nguồn `source: "openclaw"` trên các thông báo lỗi Gateway cùng với một
  vị từ dùng chung loại bỏ các tiếng vọng do bot tạo có gắn thẻ trong các phòng dùng chung
  trước khi ủy quyền `allowBots`. Kiểu và vị từ đó không tồn tại trong
  cơ sở mã. Bản thân `allowBots` là một khóa cấu hình thực tế cho mỗi kênh (Slack,
  Discord, Google Chat và các kênh khác), nhưng cơ chế gắn thẻ nguồn vốn
  được dùng để bảo vệ nó chưa bao giờ được xây dựng. Việc ngăn tiếng vọng lỗi Gateway trong
  các phòng bật bot vẫn là một khoảng trống chưa giải quyết, không phải một bảo đảm đã được phát hành.
- **Không có không gian tên `core.messages.receive/send/live/state` thống nhất.** Các hàm
  đã phát hành nằm trực tiếp trong `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) thay vì
  nằm sau facade `core.messages.*`.
- **Không có kiểu thông báo chuẩn hóa chung `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Lõi vẫn truyền các tải trọng phản hồi cụ thể
  (`ReplyPayload`) và ngữ cảnh dành riêng cho từng kênh qua các bộ điều hợp gửi
  thay vì một cấu trúc thông báo trung lập với nền tảng có quan hệ `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Tên chính sách xác nhận khác với bản phác thảo.** Đã phát hành:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Bản phác thảo ban đầu sử dụng `immediate | after-record | after-durable-send |
manual` với trường lý do hết thời gian chờ webhook; cấu trúc đó chưa được xây dựng.
- **Các khóa khả năng `DurableFinalDeliveryRequirementMap` đã thay thế đối tượng
  `MessageCapabilities` trong bản phác thảo.** Các khả năng là các cờ boolean phẳng (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) được xác minh thông qua `verifyDurableFinalCapabilityProofs` thay
  vì một cấu trúc lồng nhau theo kiểu `text.chunking` / `attachments.voice`.

## Các rủi ro di chuyển cụ thể (vẫn còn liên quan)

Các hiệu ứng phụ dành riêng cho từng kênh này có trước quá trình tái cấu trúc và phải tiếp tục
hoạt động thông qua các đường dẫn gửi mới. Chúng không phải là giả định: từng hiệu ứng đều
được triển khai và đang giữ vai trò thiết yếu hiện nay.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): trình giám sát ghi các tin nhắn đã gửi vào bộ nhớ đệm
  phản hồi sau khi gửi thành công. Các lượt gửi cuối cùng bền vững vẫn phải điền
  vào bộ nhớ đệm đó, nếu không OpenClaw có thể tái nhập chính các phản hồi của mình
  dưới dạng tin nhắn người dùng gửi đến.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): thêm một chữ ký mô hình tùy chọn
  và ghi lại các luồng đã tham gia sau khi trả lời nhóm. Cơ chế phân phối
  bền vững không được bỏ qua các hiệu ứng đó.
- **Discord và các bộ điều phối đã chuẩn bị khác** đã tự quản lý việc phân phối trực tiếp và
  hành vi xem trước. Một kênh chưa bền vững từ đầu đến cuối cho đến khi bộ điều phối
  đã chuẩn bị của kênh đó định tuyến rõ ràng các kết quả cuối cùng qua ngữ cảnh gửi; không được giả định
  rằng chỉ riêng adapter chung đã bao phủ trường hợp này.
- **Cơ chế phân phối dự phòng im lặng của Telegram** phải phân phối toàn bộ mảng payload
  đã chiếu, không chỉ payload đầu tiên, sau khi chia đoạn/chiếu
  dự phòng.
- **LINE, Zalo, Nostr** và các đường dẫn trợ giúp tương tự có thể có cơ chế xử lý
  token trả lời, proxy phương tiện, bộ nhớ đệm tin nhắn đã gửi hoặc đích chỉ dành cho callback.
  Chúng vẫn sử dụng cơ chế phân phối do kênh quản lý cho đến khi các ngữ nghĩa đó được biểu diễn bởi
  adapter gửi và được kiểm thử bao phủ.
- **Các trình trợ giúp DM trực tiếp** có thể có callback trả lời là đích truyền tải
  chính xác duy nhất. Cơ chế gửi đi chung không được suy đoán đích từ các trường
  nền tảng thô rồi bỏ qua callback đó.

## Phân loại lỗi

Các adapter phân loại lỗi truyền tải thành các danh mục đóng kiểu `DeliveryFailureKind`
(tạm thời, giới hạn tốc độ, xác thực, quyền, không tìm thấy, payload không hợp lệ,
xung đột, đã hủy, không xác định). Chính sách lõi:

- Thử lại các lỗi tạm thời và lỗi giới hạn tốc độ.
- Không thử lại các lỗi payload không hợp lệ trừ khi có phương án dự phòng khi kết xuất.
- Không thử lại các lỗi xác thực hoặc quyền cho đến khi cấu hình thay đổi.
- Khi không tìm thấy, cho phép quá trình hoàn tất trực tiếp chuyển từ chỉnh sửa sang gửi mới khi
  kênh tuyên bố việc đó là an toàn.
- Khi xảy ra xung đột, sử dụng trạng thái biên nhận/tính lũy đẳng để xác định tin nhắn
  đã tồn tại hay chưa.
- Mọi lỗi xảy ra sau khi lệnh gọi nền tảng có thể đã thành công nhưng trước khi commit
  biên nhận sẽ trở thành `unknown_after_send`, trừ khi adapter chứng minh thao tác trên nền tảng
  đã không xảy ra.

## Câu hỏi còn bỏ ngỏ

- Liệu cuối cùng Telegram có nên thay thế trình chạy polling grammY (`1.43.0`)
  bằng một nguồn polling hoàn toàn bền vững, kiểm soát việc phân phối lại ở cấp nền tảng,
  thay vì chỉ watermark khởi động lại được duy trì của OpenClaw
  (`safeCompletedUpdateId`) hay không.
- Liệu trạng thái xem trước trực tiếp nên nằm trong cùng bản ghi với ý định gửi cuối cùng
  hay trong một kho trạng thái trực tiếp đồng cấp.
- Liệu việc ngăn phản hồi lặp lại khi Gateway gặp lỗi trong các phòng dùng chung có bật bot có cần
  cơ chế gắn thẻ nguồn gốc đã được lên kế hoạch ban đầu, một hợp đồng đơn giản hơn cho từng kênh,
  hay nằm ngoài phạm vi.
- Những kênh nào hỗ trợ nguồn gốc/siêu dữ liệu gốc để ngăn phản hồi lặp lại giữa các bot,
  so với những kênh cần một sổ đăng ký gửi đi được duy trì.

## Liên quan

- [Tin nhắn](/vi/concepts/messages)
- [Truyền trực tuyến và chia đoạn](/vi/concepts/streaming)
- [Bản nháp tiến trình](/vi/concepts/progress-drafts)
- [Chính sách thử lại](/vi/concepts/retry)
- [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound)
- [API nhận vào của kênh](/vi/plugins/sdk-channel-inbound)
