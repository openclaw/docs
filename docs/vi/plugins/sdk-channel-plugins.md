---
read_when:
    - Bạn đang xây dựng một plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt bộ điều hợp `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước xây dựng Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-07-20T04:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này xây dựng một plugin kênh kết nối OpenClaw với một nền tảng
nhắn tin: bảo mật tin nhắn trực tiếp, ghép nối, phân luồng trả lời và nhắn tin đi.

<Info>
  Bạn mới làm quen với các plugin OpenClaw? Trước tiên, hãy đọc [Bắt đầu](/vi/plugins/building-plugins)
  để tìm hiểu cấu trúc gói và cách thiết lập manifest.
</Info>

## Những gì plugin của bạn phụ trách

Plugin kênh không triển khai các công cụ gửi/chỉnh sửa/phản ứng; phần lõi cung cấp một
công cụ `message` dùng chung. Plugin của bạn phụ trách:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách tin nhắn trực tiếp và danh sách cho phép
- **Ghép nối** - luồng phê duyệt tin nhắn trực tiếp
- **Ngữ pháp phiên** - cách mã định danh cuộc trò chuyện riêng của nhà cung cấp ánh xạ tới các cuộc
  trò chuyện cơ sở, mã định danh luồng và phương án dự phòng về luồng cha
- **Gửi đi** - gửi văn bản, phương tiện và cuộc thăm dò tới nền tảng
- **Phân luồng** - cách các câu trả lời được phân luồng
- **Trạng thái nhập cho Heartbeat** - tín hiệu đang nhập/đang bận tùy chọn cho các đích
  phân phối Heartbeat

Phần lõi phụ trách công cụ tin nhắn dùng chung, nối kết prompt, hình dạng bên ngoài của khóa phiên,
việc ghi nhận `:thread:` chung và điều phối.

## Bộ điều hợp tin nhắn

Cung cấp một bộ điều hợp `message` với `defineChannelMessageAdapter` từ
`openclaw/plugin-sdk/channel-outbound`. Chỉ khai báo các khả năng gửi cuối cùng bền vững
mà phương thức truyền tải gốc của bạn thực sự hỗ trợ, kèm theo một kiểm thử hợp đồng
chứng minh hiệu ứng phụ gốc và biên nhận được trả về. Hướng các thao tác gửi văn bản/phương tiện
tới cùng các hàm truyền tải mà bộ điều hợp `outbound` cũ sử dụng. Để biết
đầy đủ hợp đồng API, ma trận khả năng, quy tắc biên nhận, quá trình hoàn tất bản xem trước
trực tiếp, chính sách xác nhận khi nhận, kiểm thử và bảng di chuyển, hãy xem
[API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).

Nếu bộ điều hợp `outbound` hiện có của bạn đã có đúng các phương thức gửi và
siêu dữ liệu khả năng, hãy tạo bộ điều hợp `message` bằng
`createChannelMessageAdapterFromOutbound(...)` thay vì tự viết một
cầu nối khác. Các thao tác gửi của bộ điều hợp trả về các giá trị `MessageReceipt`. Đối với mã định danh cũ, hãy tạo
chúng bằng `listMessageReceiptPlatformIds(...)` hoặc
`resolveMessageReceiptPrimaryId(...)` thay vì duy trì song song các trường `messageIds`.

Khai báo chính xác các khả năng trực tiếp và hoàn tất - phần lõi dùng chúng để quyết định
một kênh có thể làm gì, và sự sai lệch giữa hành vi được khai báo với hành vi thực tế là một
lỗi kiểm thử hợp đồng:

| Bề mặt                               | Giá trị                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Các kênh hoàn tất bản xem trước nháp tại chỗ nên định tuyến logic thời gian chạy
qua `defineFinalizableLivePreviewAdapter(...)` cùng với
`deliverWithFinalizableLivePreviewAdapter(...)`, đồng thời duy trì các khả năng đã khai báo
bằng các kiểm thử `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
và `verifyChannelMessageLiveFinalizerProofs(...)` để hành vi xem trước gốc,
tiến trình, chỉnh sửa, dự phòng/lưu giữ, dọn dẹp và biên nhận không thể âm thầm
sai lệch.

Các bộ nhận đầu vào trì hoãn xác nhận của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì che giấu
thời điểm xác nhận trong trạng thái cục bộ của trình giám sát. Bao phủ mọi chính sách đã khai báo bằng
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các trình trợ giúp trả lời cũ như `dispatchInboundReplyWithBase` và
`recordInboundSessionAndDispatchReply` vẫn khả dụng cho các trình điều phối
tương thích. Không sử dụng chúng cho mã kênh mới; thay vào đó, hãy bắt đầu với bộ điều hợp `message`,
các biên nhận và trình trợ giúp vòng đời nhận/gửi trên
`openclaw/plugin-sdk/channel-outbound`.

### Tiếp nhận đầu vào (thử nghiệm)

Các kênh đang di chuyển cơ chế ủy quyền đầu vào có thể sử dụng đường dẫn con thử nghiệm
`openclaw/plugin-sdk/channel-ingress-runtime` từ các đường dẫn nhận khi chạy.
Nó chấp nhận dữ kiện nền tảng, danh sách cho phép thô, bộ mô tả định tuyến, dữ kiện lệnh
và cấu hình nhóm truy cập, sau đó trả về các phép chiếu người gửi/định tuyến/lệnh/kích hoạt
cùng đồ thị tiếp nhận có thứ tự, trong khi việc tra cứu nền tảng và các hiệu ứng phụ
vẫn nằm trong plugin. Hãy giữ việc chuẩn hóa danh tính plugin trong
bộ mô tả được truyền cho trình phân giải; không tuần tự hóa các giá trị khớp thô từ
trạng thái hoặc quyết định đã phân giải. Xem
[API tiếp nhận của kênh](/vi/plugins/sdk-channel-ingress) để biết thiết kế API,
ranh giới sở hữu và kỳ vọng kiểm thử.

### Tiếp nhận bền vững và chống trùng lặp khi phát lại

Các kênh áp dụng tiếp nhận bền vững nên sử dụng `createChannelIngressMonitor`
từ `openclaw/plugin-sdk/channel-outbound` trừ khi cần một hợp đồng
tiếp nhận hoặc bơm khác biệt đáng kể. Đưa phong bì truyền tải thô vào hàng đợi tại một
điểm nghẽn nhận duy nhất (không chuẩn hóa tại thời điểm nhận), chỉ xác nhận
truyền tải sau khi nối thêm bền vững đối với các phương thức truyền tải Webhook, tạo một
làn tuần tự hóa cho mỗi cuộc trò chuyện và đánh dấu sự kiện hoàn tất khi được
điều phối tiếp nhận. Khóa chính của hàng đợi là `(queue_name, event_id)` và việc hoàn tất
tạo dấu mộ cho hàng thay vì xóa nó, vì vậy việc nền tảng phân phối lại muộn
cùng `event_id` sẽ bị từ chối bền vững trong khoảng thời gian lưu giữ dấu mộ.
Xem [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound#durable-ingress-monitors)
để biết API trình giám sát và hợp đồng tắt.

Dấu mộ đó là quy tắc phân lớp cho các cơ chế bảo vệ chống phát lại
(`openclaw/plugin-sdk/persistent-dedupe`): một kênh đã xả chỉ duy trì một
cơ chế bảo vệ chống phát lại riêng khi danh tính hoặc thời gian lưu giữ của cơ chế đó vượt quá hàng đợi
— một khóa tin nhắn logic khác với mã định danh phân phối truyền tải (Telegram
loại bỏ trùng lặp `chat_id:message_id` vì việc gộp chống dội có thể làm một tin nhắn xuất hiện lại
dưới một `update_id` mới), hoặc một khoảng thời gian dài hơn thời gian lưu giữ dấu mộ
của kênh. Nếu khóa bảo vệ của bạn bằng `event_id` của quá trình xả, hãy xóa
cơ chế bảo vệ khi áp dụng quá trình xả và điều chỉnh `completedTtlMs`/`completedMaxEntries`
để thay thế việc bao phủ khoảng thời gian bảo vệ cũ. Các biện pháp bảo vệ không nhằm loại bỏ trùng lặp, chẳng hạn như
hàng rào tuổi, không liên quan đến quy tắc này. Mã định danh tin nhắn đi ổn định sử dụng
sổ đăng ký phản hồi gửi đi dùng chung từ `openclaw/plugin-sdk/channel-outbound` thay vì
bộ nhớ đệm TTL cục bộ của kênh.

#### Các lớp truyền tải và lưu giữ

Phân loại phương thức truyền tải theo mức bảo đảm phục hồi tại ranh giới nhận của nó:

- **Phân phối Webhook hoặc sự kiện có chặn xác nhận:** chỉ xác nhận hoặc trả về thành công
  sau khi nối thêm bền vững. Lỗi nối thêm phải khiến phân phối vẫn đủ điều kiện
  để thử lại hoặc làm ranh giới nhận thất bại. Lớp này bao gồm Slack, SMS, Zalo,
  Microsoft Teams, Google Chat, LINE và Synology Chat.
- **Phân phối thăm dò hoặc luồng có chờ:** chỉ tiến con trỏ từ xa hoặc gửi
  xác nhận truyền tải sau khi nối thêm. Khi không có con trỏ tường minh, hãy giữ
  callback nhận được tuần tự hóa và chờ hoàn tất để lỗi nối thêm không thể khiến
  vòng lặp nhận chạy vượt lên trước. Thăm dò Telegram, Signal và Tlon sử dụng lớp này;
  phân phối Webhook Telegram tuân theo quy tắc có chặn xác nhận ở trên.
- **Socket không thể phát lại:** IRC, Mattermost, Twitch và Zalo Personal không thể yêu cầu
  nền tảng phân phối lại một sự kiện đã được chấp nhận. Hàng đợi bền vững của chúng bảo vệ
  khoảng thời gian lỗi tiến trình và hỗ trợ phục hồi khi khởi động lại cục bộ; các dấu mộ
  hoàn tất gần như không có tác dụng chống lại việc phát lại từ nền tảng.

Sử dụng 30 ngày làm quy ước TTL dấu mộ cho toàn bộ hệ thống, không phải làm giá trị mặc định của SDK. Một
khoảng thời gian phân phối lại có lưu lượng lớn thường sử dụng giới hạn 20,000 mục đã hoàn tất;
các phương thức truyền tải có chờ và không thể phát lại với lưu lượng thấp hơn thường sử dụng 1,000-2,000.
Các ngoại lệ hiện tại bao gồm giới hạn 4,096 mục của LINE, TTL hoàn tất 24 giờ
của SMS và chế độ lưu giữ hoàn tất chỉ theo giới hạn của Tlon. Giới hạn hàng thất bại cũng có thể thấp hơn
giới hạn đã hoàn tất. Cả TTL và giới hạn đều cắt tỉa các hàng, vì vậy thời gian lưu giữ hiệu lực kết thúc
khi đạt giới hạn đầu tiên. Chỉ sai khác vì thời hạn thử lại của nền tảng đã được ghi lại,
khoảng thời gian bảo vệ chống phát lại đã phát hành cần được giữ nguyên, lưu lượng dự kiến hoặc ngân sách đĩa,
hay phương thức truyền tải không thể phát lại, và bao phủ hợp đồng lưu giữ bằng các kiểm thử.

#### Hiệu ứng phụ ít nhất một lần

Quá trình điều phối xả chạy các hiệu ứng phụ của lệnh trước khi hàng tiếp nhận đạt tới
dấu mộ hoàn tất. Tiến trình gặp sự cố giữa hai bước này sẽ phát lại hàng và
có thể thực thi hiệu ứng phụ lần nữa. Khoảng thời gian sự cố ít nhất một lần này là
hợp đồng mặc định. Đối với công việc không lũy đẳng như ghi cấu hình, xóa
bộ nhớ hoặc các xác nhận hiển thị bên ngoài làn trả lời, hãy sử dụng
`createIngressEffectOnce(...)` từ
`openclaw/plugin-sdk/ingress-effect-once`. Cung cấp cho mỗi lệnh gọi `eventId` tiếp nhận ổn định
cùng tên hiệu ứng. Tạo một trình trợ giúp cho mỗi hàng đợi/tài khoản tiếp nhận và
sử dụng một `namespacePrefix` ổn định, duy nhất cho phạm vi đó vì các mã định danh sự kiện truyền tải
có thể chỉ duy nhất trong phạm vi hàng đợi. Trình trợ giúp chỉ cam kết yêu cầu bền vững sau khi
hiệu ứng thành công; hiệu ứng ném lỗi sẽ giải phóng yêu cầu để lần thử lại xả
có thể thực thi lại, trong khi các bên gọi đồng thời chờ yêu cầu đang hoạt động. Các
lỗi trạng thái bền vững gọi `onDiskError` khi được cung cấp và từ chối thay vì
dự phòng về bộ nhớ tiến trình.

Đặt `ttlMs` của trình trợ giúp ít nhất bằng thời gian lưu giữ dấu mộ tiếp nhận của kênh
cộng với độ trễ tối đa giữa lúc cam kết hiệu ứng và lúc hoàn tất hàng, bao gồm
thời gian ngừng hoạt động có giới hạn và các lần thử lại xả. TTL của bản ghi hiệu ứng bắt đầu khi cam kết,
trong khi thời gian lưu giữ dấu mộ bắt đầu muộn hơn khi hoàn tất; nếu vòng đời hàng đang chờ
không bị giới hạn, không TTL hữu hạn nào có thể bao phủ thời gian ngừng hoạt động tùy ý. Sau khi dấu mộ không còn
có thể phát lại hàng, các bản ghi hiệu ứng cũ trở thành dữ liệu thừa. Điều chỉnh
`stateMaxEntries` cho mọi khóa sự kiện/hiệu ứng riêng biệt có thể tồn tại trong
khoảng thời gian lưu giữ đó, có tính đến giới hạn mục đã hoàn tất của hàng đợi và
số hiệu ứng tối đa trên mỗi sự kiện. Giới hạn thấp hơn sẽ loại bỏ bản ghi cũ nhất trước TTL
và cho phép hiệu ứng đó thực thi lại. Các khoảng thời gian ít nhất một lần còn lại vẫn tồn tại
nếu tiến trình dừng hoặc việc lưu trữ thất bại sau khi hiệu ứng thành công nhưng trước khi
yêu cầu được cam kết, hoặc nếu bản ghi hết hạn trong khi hàng tiếp nhận của nó vẫn
đang chờ.

#### Hợp đồng khởi động lại theo phạm vi tài khoản

Theo mặc định, thay đổi cấu hình kênh sẽ khởi động lại toàn bộ kênh. Một kênh nhiều tài khoản
chỉ có thể đặt `reload.accountScopedRestart: true` khi quá trình phân giải
cấu hình đọc các trường dùng chung toàn kênh cùng tài khoản đã chọn, tuyệt đối không đọc
tài khoản đồng cấp, và Gateway có thể dừng rồi khởi động một thời gian chạy `(channel, accountId)`
mà không thay thế các thời gian chạy đồng cấp.

Đường dẫn theo phạm vi chỉ áp dụng cho các thay đổi bên dưới
`channels.<channel>.accounts.<non-default-id>.*`. Các thay đổi đối với trường kênh
dùng chung, `accounts.default`, các tài khoản đã bị xóa hoặc không thể phân giải, và các thay đổi hỗn hợp
có thể ảnh hưởng đến kế thừa sẽ được nâng cấp thành khởi động lại toàn bộ kênh. Các plugin
không chọn tham gia luôn sử dụng đường dẫn toàn kênh.

Đối với các kênh sử dụng quá trình xả tiếp nhận bền vững, đường dẫn dừng của trình giám sát tài khoản
trước tiên phải hoàn tất tất cả lần tiếp nhận truyền tải đã chấp nhận, sau đó hủy và chờ
quá trình xả của nó. Việc khởi động tài khoản mở cùng hàng đợi theo khóa tài khoản, và lần xả
ban đầu sẽ phục hồi các hàng bền vững chưa được điều phối. Không thêm một lượt phát lại thứ hai
riêng cho việc tải lại; phục hồi hàng đợi là đường dẫn khởi động lại chuẩn tắc.

Hãy coi cờ này là một tuyên bố khả năng, không phải tùy chọn hiệu năng. Các kiểm thử hợp đồng
nên chứng minh rằng việc thêm và chỉnh sửa một tài khoản có tên không làm thay đổi cấu hình đã phân giải
của tài khoản đồng cấp, việc dừng một tài khoản chỉ hoàn tất trình giám sát và quá trình xả
của tài khoản đó, và một trình giám sát mới phục hồi các hàng của tài khoản đó chính xác
một lần. Nếu không thể chứng minh bất kỳ bảo đảm nào, hãy bỏ qua cờ này.

### Chỉ báo đang nhập

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập bên ngoài các câu trả lời đầu vào, hãy cung cấp
`heartbeat.sendTyping(...)` trên plugin kênh. Phần lõi gọi nó với
đích phân phối Heartbeat đã phân giải trước khi lượt chạy mô hình Heartbeat bắt đầu và
sử dụng vòng đời duy trì/dọn dẹp trạng thái đang nhập dùng chung. Thêm
`heartbeat.clearTyping(...)` khi nền tảng cần một tín hiệu dừng tường minh.

### Tham số nguồn phương tiện

Nếu kênh của bạn thêm các tham số công cụ tin nhắn mang nguồn phương tiện, hãy cung cấp
tên của các tham số đó thông qua `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Phần lõi sử dụng danh sách tường minh này cho việc chuẩn hóa đường dẫn sandbox và chính sách
truy cập phương tiện gửi đi, nhờ đó các plugin không cần trường hợp đặc biệt trong phần lõi dùng chung cho
các tham số ảnh đại diện, tệp đính kèm hoặc ảnh bìa riêng của nhà cung cấp.

Ưu tiên một ánh xạ theo khóa hành động như `{ "set-profile": ["avatarUrl", "avatarPath"] }`
để các hành động không liên quan không kế thừa các đối số phương tiện của hành động khác. Một mảng phẳng
vẫn dùng được cho các tham số được chủ ý chia sẻ giữa mọi hành động được công khai.

Các kênh phải công khai một URL công khai tạm thời để nền tảng tìm nạp phương tiện
có thể dùng `createHostedOutboundMediaStore(...)` từ
`openclaw/plugin-sdk/outbound-media` cùng với kho trạng thái Plugin. Giữ việc
phân tích tuyến của nền tảng và thực thi token trong Plugin kênh; trình trợ giúp dùng chung
chỉ sở hữu việc tải phương tiện, siêu dữ liệu hết hạn, các hàng phân đoạn và dọn dẹp.

### Định hình payload gốc

Nếu kênh cần định hình riêng theo nhà cung cấp cho `message(action="send")`,
hãy ưu tiên `actions.prepareSendPayload(...)`. Đặt các thẻ, khối, nội dung nhúng gốc hoặc
dữ liệu lâu bền khác dưới `payload.channelData.<channel>` và để lõi gửi
qua bộ điều hợp gửi đi/tin nhắn. Chỉ dùng `actions.handleAction(...)` để gửi
như một phương án dự phòng tương thích cho các payload không thể tuần tự hóa và
thử lại.

### Ngữ pháp hội thoại phiên

Nếu nền tảng lưu phạm vi bổ sung trong ID hội thoại, hãy giữ việc phân tích đó
trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đây là
hook chuẩn để ánh xạ `rawId` tới ID hội thoại cơ sở, ID
luồng tùy chọn, `baseConversationId` tường minh và mọi
`parentConversationCandidates`. Khi trả về `parentConversationCandidates`,
hãy sắp xếp chúng từ phần tử cha hẹp nhất đến hội thoại rộng nhất/cơ sở.

`messaging.resolveParentConversationCandidates(...)` là một
phương án dự phòng tương thích đã lỗi thời dành cho các Plugin chỉ cần các phương án dự phòng cha nằm trên
ID chung/thô. Nếu cả hai hook đều tồn tại, lõi dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
chuyển sang `resolveParentConversationCandidates(...)` khi hook chuẩn
bỏ qua chúng.

Các Plugin đi kèm cần cùng cách phân tích trước khi sổ đăng ký kênh khởi động
có thể công khai tệp `session-key-api.ts` cấp cao nhất với phần xuất
`resolveSessionConversation(...)` tương ứng (xem các Plugin Feishu và Telegram).
Lõi chỉ dùng bề mặt an toàn cho bootstrap đó khi sổ đăng ký Plugin thời gian chạy
chưa khả dụng.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh luồng con với tuyến cha của nó hoặc tạo
khóa chống trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Trình trợ giúp
chuẩn hóa ID luồng dạng số theo cùng cách với lõi, vì vậy hãy ưu tiên nó thay cho các phép
so sánh `String(threadId)` tùy tiện. Các Plugin có ngữ pháp đích riêng theo nhà cung cấp
nên công khai `messaging.resolveOutboundSessionRoute(...)` để lõi nhận được
danh tính phiên và luồng gốc của nhà cung cấp mà không cần shim trình phân tích.

### Hỗ trợ liên kết hội thoại theo phạm vi tài khoản

Đặt `conversationBindings.supportsCurrentConversationBinding` khi kênh
hỗ trợ các liên kết hội thoại hiện tại dùng chung. `createChatChannelPlugin(...)`
đặt khả năng tĩnh này thành `true` theo mặc định.

Nếu mức hỗ trợ khác nhau tùy theo tài khoản đã cấu hình, hãy triển khai thêm
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Lõi chỉ đánh giá hook đồng bộ này sau khi khả năng tĩnh
được bật. Việc trả về `false` khiến các thao tác dùng chung về khả năng,
liên kết, tra cứu, liệt kê, cập nhật thời điểm truy cập và hủy liên kết hội thoại hiện tại không khả dụng cho tài khoản đó.
Nếu bỏ qua hook, khả năng tĩnh sẽ áp dụng cho mọi tài khoản.

Hãy phân giải câu trả lời từ cấu hình tài khoản hoặc trạng thái thời gian chạy đã được tải. Hook này
chỉ kiểm soát các liên kết hội thoại hiện tại dùng chung; nó không thay thế
các quy tắc liên kết đã cấu hình hoặc định tuyến phiên do Plugin sở hữu. Các kiểm thử hợp đồng
nên bao phủ ít nhất một tài khoản được hỗ trợ và một tài khoản không được hỗ trợ thông qua
hợp đồng `ChannelPlugin["conversationBindings"]` được xuất bởi
`openclaw/plugin-sdk/channel-core`.

## Phê duyệt và khả năng của kênh

Hầu hết Plugin kênh không cần mã dành riêng cho phê duyệt. Lõi sở hữu
`/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và cơ chế gửi dự phòng dùng chung.
`ChannelPlugin.approvals` đã bị xóa; thay vào đó, hãy đặt các thông tin về gửi/phần gốc/kết xuất/xác thực
phê duyệt trên một đối tượng `approvalCapability`. `plugin.auth` chỉ dành cho
đăng nhập/đăng xuất - lõi không còn đọc các hook xác thực phê duyệt từ đối tượng đó.

Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt gốc hoặc ngăn
phương án dự phòng, và chỉ dùng `approvalCapability.render` khi kênh thực sự cần
payload phê duyệt tùy chỉnh thay vì trình kết xuất dùng chung.

### Xác thực phê duyệt

- `approvalCapability.authorizeActorAction` và
  `approvalCapability.getActionAvailabilityState` là điểm nối
  xác thực phê duyệt chuẩn.
- Dùng `getActionAvailabilityState` để xác định khả năng xác thực phê duyệt trong cùng cuộc trò chuyện.
  Giữ các bên phê duyệt đã cấu hình khả dụng cho `/approve` ngay cả khi việc gửi gốc
  bị tắt; thay vào đó, hãy dùng trạng thái bề mặt khởi tạo gốc để hướng dẫn gửi/thiết lập.
- Nếu kênh công khai phê duyệt thực thi gốc, hãy dùng
  `approvalCapability.getExecInitiatingSurfaceState` cho
  trạng thái bề mặt khởi tạo/ứng dụng khách gốc khi trạng thái này khác với xác thực phê duyệt
  trong cùng cuộc trò chuyện. Lõi dùng hook dành riêng cho thực thi đó để phân biệt `enabled` với
  `disabled`, quyết định liệu kênh khởi tạo có hỗ trợ phê duyệt thực thi gốc hay không
  và đưa kênh vào hướng dẫn dự phòng cho ứng dụng khách gốc.
  `createApproverRestrictedNativeApprovalCapability(...)` điền giá trị này cho
  trường hợp phổ biến.
- Nếu một kênh có thể suy ra các danh tính tin nhắn trực tiếp ổn định giống chủ sở hữu từ cấu hình hiện có,
  hãy dùng `createResolvedApproverActionAuthAdapter` từ
  `openclaw/plugin-sdk/approval-runtime` để giới hạn `/approve` trong cùng cuộc trò chuyện
  mà không thêm logic lõi dành riêng cho phê duyệt.
- Nếu xác thực phê duyệt tùy chỉnh chủ ý chỉ cho phép phương án dự phòng trong cùng cuộc trò chuyện, hãy trả về
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` từ
  `openclaw/plugin-sdk/approval-auth-runtime`; nếu không, lõi coi kết quả là
  quyền phê duyệt tường minh.
- Nếu callback gốc do kênh sở hữu trực tiếp phân giải phê duyệt, hãy dùng
  `isImplicitSameChatApprovalAuthorization(...)` trước khi phân giải để phương án
  dự phòng ngầm định vẫn đi qua cơ chế ủy quyền tác nhân thông thường của kênh.

### Vòng đời payload và hướng dẫn thiết lập

- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc
  `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng của kênh,
  chẳng hạn như ẩn các lời nhắc phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo đang nhập
  trước khi gửi.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn
  phản hồi trên đường dẫn bị tắt giải thích chính xác các tùy chọn cấu hình cần thiết để bật
  phê duyệt thực thi gốc. Hook nhận `{ channel, channelLabel, accountId }`;
  các kênh có tài khoản được đặt tên nên kết xuất các đường dẫn theo phạm vi tài khoản như
  `channels.<channel>.accounts.<id>.execApprovals.*` thay vì các giá trị
  mặc định cấp cao nhất.
- Dùng `approvalCapability.describePluginApprovalSetup` khi hướng dẫn về lỗi phê duyệt
  Plugin có thể được hiển thị an toàn cho các lỗi không có tuyến và hết thời gian chờ của phê duyệt Plugin.
  `createApproverRestrictedNativeApprovalCapability(...)` không
  suy ra điều này từ `describeExecApprovalSetup`; chỉ truyền cùng trình trợ giúp một cách tường minh
  khi phê duyệt Plugin và phê duyệt thực thi thực sự dùng cùng một thiết lập gốc.

### Gửi phê duyệt gốc

Nếu kênh cần gửi phê duyệt gốc, hãy giữ mã kênh tập trung vào
việc chuẩn hóa đích cùng các thông tin về truyền tải/trình bày. Dùng
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` và
`createApproverRestrictedNativeApprovalCapability` từ
`openclaw/plugin-sdk/approval-runtime`. Đặt các thông tin riêng của kênh phía sau
`approvalCapability.nativeRuntime`, lý tưởng nhất là thông qua
`createChannelApprovalNativeRuntimeAdapter(...)` hoặc
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, để lõi có thể lắp ráp
trình xử lý và sở hữu việc lọc yêu cầu, định tuyến, chống trùng lặp, hết hạn, đăng ký Gateway
và thông báo đã được định tuyến sang nơi khác.

`nativeRuntime` được chia thành một số điểm nối nhỏ hơn:

- `availability` - tài khoản có được cấu hình hay không và yêu cầu có
  nên được xử lý hay không
- `presentation` - ánh xạ mô hình khung nhìn phê duyệt dùng chung thành
  các payload gốc đang chờ/đã phân giải/đã hết hạn hoặc các hành động cuối cùng
- `transport` - chuẩn bị đích và gửi/cập nhật/xóa các tin nhắn phê duyệt
  gốc
- `interactions` - các hook liên kết/hủy liên kết/xóa hành động tùy chọn cho các nút
  hoặc phản ứng gốc, cùng một hook `cancelDelivered` tùy chọn. Triển khai
  `cancelDelivered` khi `deliverPending` đăng ký trạng thái trong tiến trình hoặc bền vững
  (chẳng hạn như kho đích phản ứng) để trạng thái đó có thể được giải phóng nếu việc
  dừng trình xử lý hủy quá trình gửi trước khi `bindPending` chạy, hoặc khi
  `bindPending` không trả về handle
- `observe` - các hook chẩn đoán gửi tùy chọn

Các trình trợ giúp phê duyệt khác:

- Dùng `createNativeApprovalChannelRouteGates` từ
  `openclaw/plugin-sdk/approval-native-runtime` khi một kênh hỗ trợ cả
  việc gửi gốc bắt nguồn từ phiên và các đích chuyển tiếp phê duyệt tường minh. Trình
  trợ giúp tập trung hóa việc chọn cấu hình phê duyệt, xử lý `mode`, bộ lọc
  tác nhân/phiên, liên kết tài khoản, khớp đích phiên và khớp danh sách đích,
  trong khi bên gọi vẫn sở hữu ID kênh, chế độ chuyển tiếp mặc định, việc tra cứu
  tài khoản, kiểm tra truyền tải đã bật, chuẩn hóa đích và phân giải đích từ
  nguồn lượt. Không dùng nó để tạo các giá trị mặc định về chính sách kênh do lõi sở hữu;
  hãy truyền tường minh chế độ mặc định được tài liệu của kênh quy định.
- `createChannelNativeOriginTargetResolver` mặc định dùng bộ so khớp tuyến kênh
  dùng chung cho các đích `{ to, accountId, threadId }`. Chỉ truyền
  `targetsMatch` khi kênh có các quy tắc tương đương riêng theo nhà cung cấp,
  chẳng hạn như khớp tiền tố dấu thời gian của Slack. Truyền `normalizeTargetForMatch` khi
  kênh cần chuẩn hóa ID nhà cung cấp trước khi bộ so khớp tuyến mặc định
  hoặc callback `targetsMatch` tùy chỉnh chạy, đồng thời vẫn giữ nguyên
  đích ban đầu để gửi. Chỉ dùng `normalizeTarget` khi chính đích gửi đã phân giải
  cần được chuẩn hóa.
- Nếu kênh cần các đối tượng do thời gian chạy sở hữu như ứng dụng khách, token, ứng dụng Bolt
  hoặc bộ nhận webhook, hãy đăng ký chúng thông qua
  `openclaw/plugin-sdk/channel-runtime-context`. Sổ đăng ký ngữ cảnh thời gian chạy
  dùng chung cho phép lõi bootstrap các trình xử lý dựa trên khả năng từ trạng thái
  khởi động kênh mà không thêm mã kết nối trình bao dành riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc
  `createChannelNativeApprovalRuntime` cấp thấp hơn khi điểm nối dựa trên khả năng
  chưa đủ khả năng biểu đạt.
- Các kênh phê duyệt gốc phải định tuyến cả `accountId` và `approvalKind`
  thông qua các trình trợ giúp đó. `accountId` giữ chính sách phê duyệt nhiều tài khoản
  trong phạm vi tài khoản bot phù hợp, còn `approvalKind` giữ hành vi phê duyệt thực thi so với Plugin
  khả dụng cho kênh mà không cần các nhánh được mã hóa cứng trong lõi.
- Lõi cũng sở hữu các thông báo định tuyến lại phê duyệt. Plugin kênh không nên gửi
  các tin nhắn tiếp theo riêng kiểu "phê duyệt đã được chuyển đến tin nhắn trực tiếp / kênh khác" từ
  `createChannelNativeApprovalRuntime`; thay vào đó, hãy công khai chính xác định tuyến nguồn +
  tin nhắn trực tiếp của bên phê duyệt thông qua các trình trợ giúp khả năng phê duyệt dùng chung và để
  lõi tổng hợp các lần gửi thực tế trước khi đăng bất kỳ thông báo nào trở lại
  cuộc trò chuyện khởi tạo.
- Giữ nguyên loại ID phê duyệt đã gửi xuyên suốt từ đầu đến cuối. Ứng dụng khách gốc không nên
  đoán hoặc viết lại định tuyến phê duyệt thực thi so với Plugin từ trạng thái cục bộ
  của kênh.
- Truyền `approvalKind` tường minh đó tới `resolveApprovalOverGateway`. Thao tác này dùng
  dịch vụ `approval.resolve` chuẩn và trả về bên thắng đã ghi nhận khi
  một bề mặt khác phản hồi trước. Đầu vào `resolveMethod` tường minh cũ hơn
  vẫn được giữ cho các điều khiển dựa trên lệnh; các hành động gốc mới không được dùng nó hoặc
  suy ra loại từ ID.
- Các loại phê duyệt khác nhau có thể chủ ý công khai các bề mặt gốc
  khác nhau. Các ví dụ đi kèm hiện tại: Matrix giữ nguyên định tuyến tin nhắn trực tiếp/kênh gốc
  và trải nghiệm phản ứng cho phê duyệt thực thi và Plugin, trong khi vẫn cho phép
  xác thực khác nhau theo loại phê duyệt; Slack duy trì định tuyến phê duyệt gốc khả dụng
  cho cả ID thực thi và Plugin.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại dưới dạng
  trình bao tương thích, nhưng mã mới nên ưu tiên trình dựng khả năng
  và công khai `approvalCapability` trên Plugin.

### Các đường dẫn con thời gian chạy phê duyệt hẹp hơn

Đối với các điểm vào kênh thường xuyên được gọi, hãy ưu tiên các đường dẫn con hẹp hơn này thay cho barrel
`approval-runtime` rộng hơn khi bạn chỉ cần một phần của nhóm đó:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Tương tự, hãy ưu tiên `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` và
`openclaw/plugin-sdk/reply-chunking` thay cho các bề mặt bao quát rộng hơn khi bạn
không cần tất cả chúng.

### Các đường dẫn con cho thiết lập

- `openclaw/plugin-sdk/setup-runtime` bao gồm các trình trợ giúp thiết lập an toàn cho runtime:
  `createSetupTranslator`, các adapter bản vá thiết lập an toàn khi nhập
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và các trình tạo
  proxy thiết lập được ủy quyền.
- `openclaw/plugin-sdk/channel-setup` bao gồm các trình tạo thiết lập
  cài đặt tùy chọn cùng một số thành phần nguyên thủy an toàn cho thiết lập: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, và `splitSetupEntries`.
- Chỉ sử dụng seam `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần
  các trình trợ giúp thiết lập/cấu hình dùng chung nặng hơn, chẳng hạn như
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Nếu kênh của bạn chỉ muốn hiển thị thông báo "hãy cài đặt plugin này trước" trên các
bề mặt thiết lập, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/trình hướng dẫn
được tạo sẽ từ chối an toàn khi ghi cấu hình và hoàn tất, đồng thời tái sử dụng
cùng một thông báo yêu cầu cài đặt trong quá trình xác thực, hoàn tất và sao chép
liên kết tài liệu.

Nếu kênh của bạn hỗ trợ thiết lập hoặc xác thực dựa trên biến môi trường, hãy cung cấp
chức năng đó thông qua lược đồ cấu hình kênh và các bộ mô tả thiết lập. Chỉ giữ `envVars` của
runtime kênh hoặc các hằng số cục bộ cho nội dung dành cho người vận hành.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc
các lượt quét SecretRef trước khi runtime plugin khởi động, hãy thêm `openclaw.setupEntry` trong
`package.json`. Điểm vào đó phải an toàn để nhập trong các đường dẫn lệnh
chỉ đọc và phải trả về siêu dữ liệu kênh, adapter cấu hình an toàn cho thiết lập,
adapter trạng thái và siêu dữ liệu đích bí mật của kênh cần thiết cho các
bản tóm tắt đó. Không khởi động máy khách, trình lắng nghe hoặc runtime truyền tải từ
điểm vào thiết lập.

Đồng thời giữ đường dẫn nhập của điểm vào kênh chính ở phạm vi hẹp. Quá trình khám phá có thể đánh giá
điểm vào và mô-đun plugin kênh để đăng ký các khả năng mà không
kích hoạt kênh. Các tệp như `channel-plugin-api.ts` nên xuất
đối tượng plugin kênh mà không nhập trình hướng dẫn thiết lập, máy khách
truyền tải, trình lắng nghe socket, trình khởi chạy tiến trình con hoặc các mô-đun khởi động dịch vụ.
Đặt các thành phần runtime đó trong các mô-đun được tải từ `registerFull(...)`, các trình
đặt runtime hoặc các adapter khả năng tải lười.

### Các đường dẫn con hẹp khác của kênh

Đối với các đường dẫn nóng khác của kênh, hãy ưu tiên các trình trợ giúp hẹp thay vì các bề mặt
cũ rộng hơn:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và
  cơ chế dự phòng về tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/channel-inbound` cho định tuyến/phong bì đầu vào và
  hệ thống dây ghi lại rồi điều phối
- `openclaw/plugin-sdk/channel-targets` cho các trình trợ giúp phân tích cú pháp đích
- `openclaw/plugin-sdk/channel-outbound` cho các delegate danh tính/gửi đầu ra
  và lập kế hoạch payload có kiểu
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một tuyến đầu ra cần giữ nguyên
  `replyToId`/`threadId` tường minh hoặc khôi phục phiên `:thread:`
  hiện tại sau khi khóa phiên cơ sở vẫn khớp. Các plugin nhà cung cấp có thể
  ghi đè mức độ ưu tiên, hành vi hậu tố và chuẩn hóa id luồng khi
  nền tảng của chúng có ngữ nghĩa phân phối luồng nguyên bản.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời liên kết luồng
  và đăng ký adapter

Các kênh chỉ xác thực thường có thể dừng ở đường dẫn mặc định: lõi xử lý
phê duyệt và plugin chỉ cung cấp các khả năng đầu ra/xác thực. Các kênh
phê duyệt nguyên bản như Matrix, Slack, Telegram và các phương thức truyền tải trò chuyện tùy chỉnh
nên sử dụng các trình trợ giúp nguyên bản dùng chung thay vì tự triển khai vòng đời
phê duyệt riêng.

## Chính sách đề cập đầu vào

Giữ việc xử lý đề cập đầu vào tách thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Sử dụng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định về chính sách đề cập.
Chỉ sử dụng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel
trình trợ giúp đầu vào rộng hơn.

Phù hợp cho logic cục bộ của plugin:

- phát hiện trả lời bot
- phát hiện bot được trích dẫn
- kiểm tra tham gia luồng
- loại trừ thông báo dịch vụ/hệ thống
- bộ nhớ đệm nguyên bản của nền tảng cần thiết để chứng minh bot tham gia

Phù hợp cho trình trợ giúp dùng chung:

- `requireMention`
- kết quả đề cập tường minh
- danh sách cho phép đề cập ngầm định
- bỏ qua cho lệnh
- quyết định bỏ qua cuối cùng

Luồng ưu tiên:

1. Tính toán các dữ kiện đề cập cục bộ.
2. Truyền các dữ kiện đó vào `resolveInboundMentionDecision({ facts, policy })`.
3. Sử dụng `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, và
   `decision.shouldSkip` trong cổng đầu vào của bạn.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";
import { resolveChannelImplicitMentions } from "openclaw/plugin-sdk/channel-ingress-runtime";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const implicitMentions = resolveChannelImplicitMentions({
  cfg,
  channel: channelId,
  accountId,
});

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    implicitMentions,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` trả về một giá trị boolean. `hasAnyMention`,
`isExplicitlyMentioned`, và `canResolveExplicit` đến từ siêu dữ liệu đề cập
nguyên bản của chính kênh (các thực thể thông báo, cờ trả lời bot và các dữ liệu tương tự);
cung cấp các giá trị `false`/`undefined` khi nền tảng của bạn không thể phát hiện chúng.

`api.runtime.channel.mentions` cung cấp cùng các trình trợ giúp đề cập dùng chung cho
các plugin kênh đi kèm vốn đã phụ thuộc vào việc tiêm runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Nếu bạn chỉ cần `implicitMentionKindWhen` và `resolveInboundMentionDecision`,
hãy nhập từ `openclaw/plugin-sdk/channel-mention-gating` để tránh tải
các trình trợ giúp runtime đầu vào không liên quan.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Gói và manifest">
    Tạo các tệp plugin tiêu chuẩn. Trường `channels` trong
    `openclaw.plugin.json` (không phải trường `kind`) là thành phần đánh dấu một manifest
    sở hữu một kênh. Để xem đầy đủ bề mặt siêu dữ liệu gói, hãy tham khảo
    [Thiết lập và cấu hình Plugin](/vi/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Kết nối OpenClaw với Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin kênh Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` xác thực `plugins.entries.acme-chat.config`. Sử dụng nó cho
    các cài đặt do plugin sở hữu nhưng không thuộc cấu hình tài khoản kênh.
    `channelConfigs.acme-chat.schema` xác thực `channels.acme-chat` và là
    nguồn đường dẫn lạnh được lược đồ cấu hình, thiết lập và các bề mặt UI sử dụng trước khi
    runtime plugin tải. Xem [Manifest plugin](/vi/plugins/manifest) để biết đầy đủ
    tài liệu tham khảo về các trường cấp cao nhất.

  </Step>

  <Step title="Xây dựng đối tượng plugin kênh">
    Giao diện `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Bắt đầu với
    mức tối thiểu - `id`, `config`, và `setup` - rồi thêm các adapter khi bạn
    cần.

    Tạo `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // máy khách API nền tảng của bạn

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: bắt buộc phải có token");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Việc phân giải/kiểm tra tài khoản thuộc về `config`, không phải `setup`.
        // `setup` bao gồm các thao tác ghi trong quá trình tiếp nhận (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Bảo mật DM: ai có thể nhắn tin cho bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Ghép đôi: luồng phê duyệt cho các liên hệ DM mới
      pairing: {
        text: {
          idLabel: "Tên người dùng Acme Chat",
          message: "Gửi mã này để xác minh danh tính của bạn:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Mã ghép đôi: ${code}`);
          },
        },
      },

      // Phân luồng: cách phân phối các câu trả lời
      threading: { topLevelReplyToMode: "reply" },

      // Đầu ra: gửi thông báo đến nền tảng
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Đối với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn tắc và khóa lồng nhau cũ, hãy sử dụng các trình trợ giúp từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` và `normalizeChannelDmPolicy` giữ các giá trị cục bộ của tài khoản đứng trước các giá trị gốc được kế thừa. Ghép cùng trình phân giải đó với chức năng sửa chữa của doctor thông qua `normalizeLegacyDmAliases` để runtime và quá trình di chuyển đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin làm gì cho bạn">
      Thay vì triển khai thủ công các giao diện adapter cấp thấp, bạn truyền vào
      các tùy chọn khai báo và trình dựng sẽ kết hợp chúng:

      | Tùy chọn | Thành phần được kết nối |
      | --- | --- |
      | `security.dm` | Trình phân giải bảo mật DM có phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép cặp DM dựa trên văn bản có trao đổi mã |
      | `threading` | Trình phân giải chế độ trả lời (cố định, theo phạm vi tài khoản hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (ID tin nhắn); yêu cầu ID `channel` cùng cấp để lõi có thể đóng dấu kết quả gửi trả về |

      Bạn cũng có thể truyền trực tiếp các đối tượng adapter thô thay cho các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Các adapter gửi đi thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm gửi
      như `maxLinesPerMessage`; hãy áp dụng nó trước khi gửi để luồng trả lời
      và ranh giới phân đoạn chỉ được phân giải một lần bởi cơ chế gửi đi dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi đã phân giải được đích trả lời gốc, để các trình trợ giúp payload có thể giữ nguyên
      thẻ trả lời tường minh mà không tiêu thụ vị trí trả lời ngầm định chỉ dùng một lần.
    </Accordion>

  </Step>

  <Step title="Kết nối điểm vào">
    Tạo `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin kênh Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Quản lý Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Quản lý Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Đặt các bộ mô tả CLI do kênh sở hữu trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong phần trợ giúp gốc mà không kích hoạt toàn bộ runtime của kênh,
    trong khi các lần tải đầy đủ thông thường vẫn nhận cùng các bộ mô tả để đăng ký lệnh
    thực tế. Dành `registerFull(...)` cho công việc chỉ dành cho runtime.
    `defineChannelPluginEntry` tự động xử lý việc phân tách chế độ đăng ký.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy sử dụng
    tiền tố dành riêng cho Plugin. Các không gian tên quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải thành `operator.admin`. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm điểm vào thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình làm quen ban đầu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải điểm vào này thay cho điểm vào đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Điều này tránh tải mã runtime nặng trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace được đóng gói tách những phần xuất an toàn cho thiết lập thành các mô-đun
    sidecar có thể sử dụng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    trình thiết lập runtime tường minh tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn đến">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
    điều phối yêu cầu đó qua trình xử lý đầu vào của kênh:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // xác thực do plugin quản lý (tự xác minh chữ ký)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Trình xử lý đầu vào của bạn điều phối tin nhắn đến OpenClaw.
          // Cách kết nối chính xác phụ thuộc vào SDK nền tảng của bạn -
          // xem ví dụ thực tế trong gói plugin Microsoft Teams hoặc Google Chat được đóng gói.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Việc xử lý tin nhắn đến tùy thuộc vào từng kênh. Mỗi Plugin kênh sở hữu
      pipeline đầu vào riêng. Hãy xem các Plugin kênh được đóng gói
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để tham khảo các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Kiểm thử">
Viết các kiểm thử cùng vị trí trong `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("phân giải tài khoản từ cấu hình", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("kiểm tra tài khoản mà không hiện thực hóa bí mật", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("báo cáo thiếu cấu hình", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Đối với các trình trợ giúp kiểm thử dùng chung, hãy xem [Kiểm thử](/vi/plugins/sdk-testing).

</Step>
</Steps>

## Cấu trúc tệp

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # siêu dữ liệu openclaw.channel
├── openclaw.plugin.json      # Manifest có lược đồ cấu hình
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Các phần xuất công khai (tùy chọn)
├── runtime-api.ts            # Các phần xuất runtime nội bộ (tùy chọn)
└── src/
    ├── channel.ts            # ChannelPlugin thông qua createChatChannelPlugin
    ├── channel.test.ts       # Kiểm thử
    ├── client.ts             # Máy khách API nền tảng
    └── runtime.ts            # Kho lưu trữ runtime (nếu cần)
```

## Chủ đề nâng cao

<CardGroup cols={2}>
  <Card title="Tùy chọn luồng hội thoại" icon="git-branch" href="/vi/plugins/sdk-entrypoints#registration-mode">
    Các chế độ trả lời cố định, theo phạm vi tài khoản hoặc tùy chỉnh
  </Card>
  <Card title="Tích hợp công cụ tin nhắn" icon="puzzle" href="/vi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool và khám phá hành động
  </Card>
  <Card title="Phân giải đích" icon="crosshair" href="/vi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Trình trợ giúp runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, phương tiện, tác tử con qua api.runtime
  </Card>
  <Card title="API đầu vào của kênh" icon="bolt" href="/vi/plugins/sdk-channel-inbound">
    Vòng đời sự kiện đầu vào dùng chung: tiếp nhận, phân giải, ghi lại, điều phối, hoàn tất
  </Card>
</CardGroup>

<Note>
Một số điểm nối trợ giúp được đóng gói vẫn tồn tại để bảo trì Plugin được đóng gói và
đảm bảo khả năng tương thích. Chúng không phải là mẫu được khuyến nghị cho các Plugin kênh mới;
hãy ưu tiên các đường dẫn con chung về kênh/thiết lập/trả lời/runtime từ bề mặt SDK
chung, trừ khi bạn đang trực tiếp bảo trì họ Plugin được đóng gói đó.
</Note>

## Các bước tiếp theo

- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - nếu Plugin của bạn cũng cung cấp mô hình
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tài liệu tham chiếu đầy đủ về nhập đường dẫn con
- [Kiểm thử SDK](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) - lược đồ manifest đầy đủ

## Liên quan

- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin bộ khung tác tử](/vi/plugins/sdk-agent-harness)
