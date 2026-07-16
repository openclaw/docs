---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt bộ điều hợp `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước xây dựng Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-07-16T14:50:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này xây dựng một Plugin kênh kết nối OpenClaw với một nền tảng
nhắn tin: bảo mật tin nhắn trực tiếp, ghép nối, phân luồng trả lời và gửi tin nhắn đi.

<Info>
  Bạn mới làm quen với các Plugin OpenClaw? Trước tiên, hãy đọc [Bắt đầu](/vi/plugins/building-plugins)
  để tìm hiểu cấu trúc gói và cách thiết lập manifest.
</Info>

## Những gì Plugin của bạn sở hữu

Các Plugin kênh không triển khai công cụ gửi/chỉnh sửa/phản ứng; phần lõi cung cấp một
công cụ `message` dùng chung. Plugin của bạn sở hữu:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách tin nhắn trực tiếp và danh sách cho phép
- **Ghép nối** - quy trình phê duyệt tin nhắn trực tiếp
- **Ngữ pháp phiên** - cách ánh xạ mã định danh cuộc trò chuyện dành riêng cho nhà cung cấp tới
  cuộc trò chuyện cơ sở, mã định danh luồng và phương án dự phòng về phần tử cha
- **Gửi đi** - gửi văn bản, nội dung đa phương tiện và cuộc thăm dò tới nền tảng
- **Phân luồng** - cách các câu trả lời được phân luồng
- **Chỉ báo nhập Heartbeat** - tín hiệu đang nhập/đang bận tùy chọn cho các đích
  phân phối Heartbeat

Phần lõi sở hữu công cụ nhắn tin dùng chung, kết nối prompt, hình dạng bên ngoài của khóa phiên,
việc theo dõi `:thread:` dùng chung và điều phối.

## Bộ điều hợp tin nhắn

Cung cấp một bộ điều hợp `message` với `defineChannelMessageAdapter` từ
`openclaw/plugin-sdk/channel-outbound`. Chỉ khai báo các khả năng gửi cuối cùng bền vững
mà phương thức vận chuyển gốc của bạn thực sự hỗ trợ, kèm theo một kiểm thử hợp đồng
chứng minh hiệu ứng phụ phía gốc và biên nhận được trả về. Trỏ thao tác gửi văn bản/nội dung đa phương tiện
tới cùng các hàm vận chuyển mà bộ điều hợp `outbound` cũ sử dụng. Để biết
đầy đủ hợp đồng API, ma trận khả năng, quy tắc biên nhận, hoàn tất bản xem trước
trực tiếp, chính sách xác nhận nhận, kiểm thử và bảng di chuyển, hãy xem
[API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).

Nếu bộ điều hợp `outbound` hiện có của bạn đã có đúng các phương thức gửi và
siêu dữ liệu khả năng, hãy dẫn xuất bộ điều hợp `message` bằng
`createChannelMessageAdapterFromOutbound(...)` thay vì tự viết thêm một
cầu nối khác. Các thao tác gửi của bộ điều hợp trả về giá trị `MessageReceipt`. Với các mã định danh cũ, hãy dẫn xuất
chúng bằng `listMessageReceiptPlatformIds(...)` hoặc
`resolveMessageReceiptPrimaryId(...)` thay vì duy trì các trường `messageIds`
song song.

Hãy khai báo chính xác các khả năng trực tiếp và khả năng hoàn tất - phần lõi sử dụng chúng để quyết định
một kênh có thể làm gì, và sự sai lệch giữa hành vi được khai báo và hành vi thực tế là một
lỗi kiểm thử hợp đồng:

| Bề mặt                               | Giá trị                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Các kênh hoàn tất bản xem trước nháp tại chỗ nên định tuyến logic thời gian chạy
qua `defineFinalizableLivePreviewAdapter(...)` cùng với
`deliverWithFinalizableLivePreviewAdapter(...)`, đồng thời duy trì các khả năng
đã khai báo bằng kiểm thử `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
và `verifyChannelMessageLiveFinalizerProofs(...)` để hành vi xem trước gốc,
tiến trình, chỉnh sửa, dự phòng/giữ lại, dọn dẹp và biên nhận không thể âm thầm
sai lệch.

Các bộ tiếp nhận đầu vào trì hoãn xác nhận của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì che giấu
thời điểm xác nhận trong trạng thái cục bộ của trình giám sát. Bao quát mọi chính sách đã khai báo bằng
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các trình trợ giúp trả lời cũ như `dispatchInboundReplyWithBase` và
`recordInboundSessionAndDispatchReply` vẫn khả dụng cho các bộ điều phối
tương thích. Không sử dụng chúng cho mã kênh mới; thay vào đó, hãy bắt đầu với bộ điều hợp `message`,
biên nhận và các trình trợ giúp vòng đời nhận/gửi trên
`openclaw/plugin-sdk/channel-outbound`.

### Tiếp nhận đầu vào (thử nghiệm)

Các kênh đang di chuyển cơ chế ủy quyền đầu vào có thể sử dụng đường dẫn con
`openclaw/plugin-sdk/channel-ingress-runtime` thử nghiệm từ các đường dẫn nhận
thời gian chạy. Đường dẫn này nhận các dữ kiện nền tảng, danh sách cho phép thô, bộ mô tả tuyến, dữ kiện
lệnh và cấu hình nhóm truy cập, sau đó trả về các phép chiếu người gửi/tuyến/lệnh/kích hoạt
cùng đồ thị tiếp nhận có thứ tự, trong khi việc tra cứu nền tảng và các hiệu ứng phụ
vẫn nằm trong Plugin. Hãy giữ việc chuẩn hóa danh tính Plugin trong
bộ mô tả mà bạn truyền cho trình phân giải; không tuần tự hóa các giá trị đối sánh thô từ
trạng thái hoặc quyết định đã phân giải. Xem
[API tiếp nhận của kênh](/vi/plugins/sdk-channel-ingress) để biết thiết kế API,
ranh giới sở hữu và các kỳ vọng kiểm thử.

### Chỉ báo đang nhập

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập bên ngoài các câu trả lời đầu vào, hãy cung cấp
`heartbeat.sendTyping(...)` trên Plugin kênh. Phần lõi gọi nó với
đích phân phối Heartbeat đã phân giải trước khi lượt chạy mô hình Heartbeat bắt đầu và
sử dụng vòng đời duy trì/dọn dẹp chỉ báo đang nhập dùng chung. Thêm
`heartbeat.clearTyping(...)` khi nền tảng cần một tín hiệu dừng rõ ràng.

### Tham số nguồn nội dung đa phương tiện

Nếu kênh của bạn thêm các tham số công cụ nhắn tin mang nguồn nội dung đa phương tiện, hãy cung cấp
tên các tham số đó thông qua `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Phần lõi sử dụng danh sách rõ ràng này để chuẩn hóa đường dẫn hộp cát và áp dụng
chính sách truy cập nội dung đa phương tiện gửi đi, nhờ đó các Plugin không cần các trường hợp đặc biệt trong phần lõi dùng chung cho
tham số ảnh đại diện, tệp đính kèm hoặc ảnh bìa dành riêng cho nhà cung cấp.

Ưu tiên một ánh xạ theo khóa hành động như `{ "set-profile": ["avatarUrl", "avatarPath"] }`
để các hành động không liên quan không kế thừa đối số nội dung đa phương tiện của hành động khác. Mảng phẳng
vẫn hoạt động đối với các tham số được chủ ý dùng chung cho mọi hành động được cung cấp.

Các kênh phải cung cấp URL công khai tạm thời để nền tảng tìm nạp nội dung đa phương tiện
có thể sử dụng `createHostedOutboundMediaStore(...)` từ
`openclaw/plugin-sdk/outbound-media` cùng với kho trạng thái Plugin. Giữ việc phân tích cú pháp
tuyến của nền tảng và thực thi token trong Plugin kênh; trình trợ giúp dùng chung
chỉ quản lý việc tải nội dung đa phương tiện, siêu dữ liệu hết hạn, các hàng phân đoạn và dọn dẹp.

### Định hình payload gốc

Nếu kênh cần định hình theo nhà cung cấp cho `message(action="send")`,
hãy ưu tiên `actions.prepareSendPayload(...)`. Đặt thẻ, khối, nội dung nhúng gốc hoặc
dữ liệu lâu bền khác dưới `payload.channelData.<channel>` và để phần lõi gửi
qua bộ điều hợp gửi đi/tin nhắn. Chỉ sử dụng `actions.handleAction(...)` để gửi
như một phương án tương thích dự phòng cho các payload không thể tuần tự hóa và
thử lại.

### Ngữ pháp cuộc trò chuyện của phiên

Nếu nền tảng lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ việc phân tích cú pháp đó
trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đây là hook
chuẩn để ánh xạ `rawId` tới id cuộc trò chuyện cơ sở, id
luồng tùy chọn, `baseConversationId` tường minh và mọi
`parentConversationCandidates`. Khi trả về `parentConversationCandidates`,
hãy sắp xếp chúng từ phần tử cha có phạm vi hẹp nhất đến cuộc trò chuyện rộng nhất/cơ sở.

`messaging.resolveParentConversationCandidates(...)` là phương án tương thích dự phòng
đã lỗi thời dành cho các Plugin chỉ cần phần tử cha dự phòng bổ sung cho
id chung/thô. Nếu cả hai hook đều tồn tại, phần lõi sử dụng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
chuyển sang `resolveParentConversationCandidates(...)` khi hook
chuẩn bỏ qua chúng.

Các Plugin đi kèm cần cùng cách phân tích cú pháp trước khi sổ đăng ký kênh khởi động
có thể cung cấp tệp `session-key-api.ts` cấp cao nhất với phần xuất
`resolveSessionConversation(...)` tương ứng (xem các Plugin Feishu và Telegram).
Phần lõi chỉ sử dụng bề mặt an toàn khi khởi động đó khi sổ đăng ký Plugin
thời gian chạy chưa khả dụng.

Sử dụng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh luồng con với tuyến cha hoặc tạo
khóa loại bỏ trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Trình trợ giúp
chuẩn hóa id luồng dạng số giống như phần lõi, vì vậy hãy ưu tiên nó thay cho
các phép so sánh `String(threadId)` tùy biến. Các Plugin có ngữ pháp đích
riêng của nhà cung cấp nên cung cấp `messaging.resolveOutboundSessionRoute(...)` để phần lõi nhận được
danh tính phiên và luồng theo định dạng gốc của nhà cung cấp mà không cần shim phân tích cú pháp.

### Hỗ trợ liên kết cuộc trò chuyện theo tài khoản

Đặt `conversationBindings.supportsCurrentConversationBinding` khi kênh
hỗ trợ các liên kết chung cho cuộc trò chuyện hiện tại. `createChatChannelPlugin(...)`
đặt khả năng tĩnh này thành `true` theo mặc định.

Nếu mức hỗ trợ khác nhau theo tài khoản đã cấu hình, hãy triển khai thêm
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Phần lõi chỉ đánh giá hook đồng bộ này sau khi khả năng tĩnh
được bật. Việc trả về `false` khiến các thao tác khả năng,
liên kết, tra cứu, liệt kê, cập nhật thời điểm và hủy liên kết chung cho cuộc trò chuyện hiện tại
không khả dụng đối với tài khoản đó.
Việc bỏ qua hook sẽ áp dụng khả năng tĩnh cho mọi tài khoản.

Hãy phân giải câu trả lời từ cấu hình tài khoản hoặc trạng thái thời gian chạy đã được tải. Hook này
chỉ kiểm soát các liên kết chung cho cuộc trò chuyện hiện tại; nó không thay thế
các quy tắc liên kết đã cấu hình hoặc việc định tuyến phiên do Plugin sở hữu. Các kiểm thử hợp đồng
nên bao quát ít nhất một tài khoản được hỗ trợ và một tài khoản không được hỗ trợ thông qua
hợp đồng `ChannelPlugin["conversationBindings"]` được xuất bởi
`openclaw/plugin-sdk/channel-core`.

## Phê duyệt và khả năng của kênh

Hầu hết các Plugin kênh không cần mã dành riêng cho phê duyệt. Phần lõi quản lý
`/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và cơ chế gửi dự phòng chung.
`ChannelPlugin.approvals` đã bị loại bỏ; thay vào đó, hãy đặt các thông tin về
gửi/phương thức gốc/kết xuất/xác thực phê duyệt trên một đối tượng `approvalCapability`.
`plugin.auth` chỉ dành cho đăng nhập/đăng xuất - phần lõi không còn đọc các hook xác thực
phê duyệt từ đối tượng đó.

Chỉ sử dụng `approvalCapability.delivery` cho việc định tuyến phê duyệt gốc hoặc
ngăn chặn dự phòng, và chỉ sử dụng `approvalCapability.render` khi một kênh thực sự cần
payload phê duyệt tùy chỉnh thay vì trình kết xuất dùng chung.

### Xác thực phê duyệt

- `approvalCapability.authorizeActorAction` và
  `approvalCapability.getActionAvailabilityState` là điểm nối chuẩn
  cho xác thực phê duyệt.
- Sử dụng `getActionAvailabilityState` để xác định khả năng xác thực phê duyệt trong cùng cuộc trò chuyện.
  Duy trì khả năng sử dụng những người phê duyệt đã cấu hình cho `/approve` ngay cả khi việc gửi gốc
  bị tắt; thay vào đó, hãy sử dụng trạng thái bề mặt khởi tạo gốc để hướng dẫn
  gửi/thiết lập.
- Nếu kênh cung cấp phê duyệt thực thi gốc, hãy sử dụng
  `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái
  bề mặt khởi tạo/máy khách gốc khi trạng thái đó khác với xác thực phê duyệt
  trong cùng cuộc trò chuyện. Phần lõi sử dụng hook dành riêng cho thực thi đó để phân biệt `enabled` với
  `disabled`, xác định liệu kênh khởi tạo có hỗ trợ phê duyệt thực thi gốc
  hay không và đưa kênh vào hướng dẫn dự phòng cho máy khách gốc.
  `createApproverRestrictedNativeApprovalCapability(...)` điền thông tin này cho
  trường hợp phổ biến.
- Nếu một kênh có thể suy ra các danh tính DM ổn định giống chủ sở hữu từ cấu hình hiện có,
  hãy sử dụng `createResolvedApproverActionAuthAdapter` từ
  `openclaw/plugin-sdk/approval-runtime` để giới hạn `/approve` trong cùng cuộc trò chuyện
  mà không thêm logic dành riêng cho phê duyệt vào phần lõi.
- Nếu xác thực phê duyệt tùy chỉnh chủ ý chỉ cho phép dự phòng trong cùng cuộc trò chuyện, hãy trả về
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` từ
  `openclaw/plugin-sdk/approval-auth-runtime`; nếu không, phần lõi sẽ coi
  kết quả là sự ủy quyền tường minh cho người phê duyệt.
- Nếu callback gốc do kênh sở hữu trực tiếp phân giải các phê duyệt, hãy sử dụng
  `isImplicitSameChatApprovalAuthorization(...)` trước khi phân giải để cơ chế
  dự phòng ngầm vẫn đi qua quy trình ủy quyền tác nhân thông thường của kênh.

### Vòng đời payload và hướng dẫn thiết lập

- Sử dụng `outbound.shouldSuppressLocalPayloadPrompt` hoặc
  `outbound.beforeDeliverPayload` cho hành vi vòng đời payload
  riêng của kênh, chẳng hạn như ẩn lời nhắc phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo
  đang nhập trước khi gửi.
- Sử dụng `approvalCapability.describeExecApprovalSetup` khi kênh muốn
  phản hồi cho đường dẫn bị vô hiệu hóa giải thích chính xác các núm cấu hình cần thiết để bật
  phê duyệt thực thi gốc. Hook nhận `{ channel, channelLabel, accountId }`;
  các kênh có tài khoản được đặt tên nên kết xuất các đường dẫn theo phạm vi tài khoản như
  `channels.<channel>.accounts.<id>.execApprovals.*` thay vì các giá trị mặc định
  cấp cao nhất.
- Sử dụng `approvalCapability.describePluginApprovalSetup` khi hướng dẫn
  về lỗi phê duyệt của Plugin có thể được hiển thị an toàn cho các lỗi không có tuyến và hết thời gian chờ
  của phê duyệt Plugin. `createApproverRestrictedNativeApprovalCapability(...)` không
  suy ra điều này từ `describeExecApprovalSetup`; chỉ truyền cùng trình trợ giúp một cách tường minh
  khi phê duyệt Plugin và phê duyệt thực thi thực sự sử dụng cùng một thiết lập gốc.

### Gửi phê duyệt gốc

Nếu một kênh cần gửi phê duyệt gốc, hãy giữ mã kênh tập trung vào
việc chuẩn hóa đích cùng các thông tin về truyền tải/trình bày. Sử dụng
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` và
`createApproverRestrictedNativeApprovalCapability` từ
`openclaw/plugin-sdk/approval-runtime`. Đặt các thông tin riêng của kênh phía sau
`approvalCapability.nativeRuntime`, lý tưởng nhất thông qua
`createChannelApprovalNativeRuntimeAdapter(...)` hoặc
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, để phần lõi có thể lắp ráp
trình xử lý và quản lý việc lọc yêu cầu, định tuyến, loại bỏ trùng lặp, hết hạn, đăng ký
Gateway và thông báo đã được định tuyến sang nơi khác.

`nativeRuntime` được chia thành một số điểm nối nhỏ hơn:

- `availability` - tài khoản đã được cấu hình hay chưa và một yêu cầu có
  nên được xử lý hay không
- `presentation` - ánh xạ mô hình khung nhìn phê duyệt dùng chung thành
  các payload gốc đang chờ/đã giải quyết/đã hết hạn hoặc các hành động cuối cùng
- `transport` - chuẩn bị các đích cùng với việc gửi/cập nhật/xóa các thông báo
  phê duyệt gốc
- `interactions` - các hook liên kết/hủy liên kết/xóa hành động tùy chọn cho các nút
  hoặc phản ứng gốc, cùng với một hook `cancelDelivered` tùy chọn. Triển khai
  `cancelDelivered` khi `deliverPending` đăng ký trạng thái trong tiến trình
  hoặc trạng thái bền vững (chẳng hạn như kho đích phản ứng) để trạng thái đó có thể được giải phóng nếu
  việc dừng trình xử lý hủy quá trình phân phối trước khi `bindPending` chạy, hoặc khi
  `bindPending` không trả về handle
- `observe` - các hook chẩn đoán phân phối tùy chọn

Các trình trợ giúp phê duyệt khác:

- Sử dụng `createNativeApprovalChannelRouteGates` từ
  `openclaw/plugin-sdk/approval-native-runtime` khi một kênh hỗ trợ cả
  phân phối gốc từ nguồn phiên và các đích chuyển tiếp phê duyệt tường minh. Trình
  trợ giúp tập trung hóa việc lựa chọn cấu hình phê duyệt, xử lý `mode`, bộ lọc
  tác nhân/phiên, liên kết tài khoản, đối sánh đích phiên và đối sánh danh sách đích,
  trong khi bên gọi vẫn sở hữu id kênh, chế độ chuyển tiếp mặc định, thao tác tra cứu
  tài khoản, kiểm tra transport đã bật, chuẩn hóa đích và phân giải đích
  từ nguồn lượt. Không sử dụng trình này để tạo các giá trị mặc định cho chính sách kênh
  do lõi sở hữu; hãy truyền tường minh chế độ mặc định được ghi trong tài liệu của kênh.
- `createChannelNativeOriginTargetResolver` mặc định sử dụng trình đối sánh tuyến kênh
  dùng chung cho các đích `{ to, accountId, threadId }`. Chỉ truyền
  `targetsMatch` khi một kênh có các quy tắc tương đương riêng theo nhà cung cấp,
  chẳng hạn như đối sánh tiền tố dấu thời gian của Slack. Truyền `normalizeTargetForMatch` khi
  kênh cần chuẩn hóa các id nhà cung cấp trước khi trình đối sánh tuyến mặc định
  hoặc callback `targetsMatch` tùy chỉnh chạy, đồng thời giữ nguyên đích
  ban đầu để phân phối. Chỉ sử dụng `normalizeTarget` khi chính đích phân phối
  đã phân giải cần được chuẩn hóa.
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, ứng dụng Bolt
  hoặc bộ nhận webhook, hãy đăng ký chúng thông qua
  `openclaw/plugin-sdk/channel-runtime-context`. Registry ngữ cảnh runtime
  tổng quát cho phép lõi khởi tạo các trình xử lý dựa trên khả năng từ trạng thái
  khởi động của kênh mà không cần thêm mã nối wrapper dành riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc
  `createChannelNativeApprovalRuntime` cấp thấp hơn khi đường nối dựa trên khả năng
  chưa đủ sức biểu đạt.
- Các kênh phê duyệt gốc phải định tuyến cả `accountId` và `approvalKind`
  thông qua các trình trợ giúp đó. `accountId` giữ chính sách phê duyệt nhiều tài khoản
  trong phạm vi đúng tài khoản bot, còn `approvalKind` duy trì hành vi phê duyệt
  exec so với plugin cho kênh mà không cần các nhánh được mã hóa cứng trong
  lõi.
- Lõi cũng sở hữu các thông báo đổi tuyến phê duyệt. Plugin kênh không nên gửi
  thông báo tiếp nối riêng kiểu "phê duyệt đã được gửi đến DM / kênh khác" từ
  `createChannelNativeApprovalRuntime`; thay vào đó, hãy cung cấp định tuyến chính xác từ nguồn +
  DM của người phê duyệt thông qua các trình trợ giúp khả năng phê duyệt dùng chung và để
  lõi tổng hợp các lượt phân phối thực tế trước khi đăng bất kỳ thông báo nào trở lại
  cuộc trò chuyện khởi tạo.
- Duy trì loại id phê duyệt đã phân phối xuyên suốt từ đầu đến cuối. Client gốc không nên
  phỏng đoán hoặc viết lại định tuyến phê duyệt exec so với plugin từ trạng thái
  cục bộ của kênh.
- Truyền `approvalKind` tường minh đó vào `resolveApprovalOverGateway`. Thao tác này sử dụng
  dịch vụ `approval.resolve` chuẩn tắc và trả về bên thắng đã ghi nhận khi
  một bề mặt khác trả lời trước. Đầu vào `resolveMethod` tường minh cũ hơn
  vẫn được giữ cho các điều khiển dựa trên lệnh; các hành động gốc mới không được sử dụng nó hoặc
  suy ra loại từ ID.
- Các loại phê duyệt khác nhau có thể chủ ý cung cấp các bề mặt gốc
  khác nhau. Các ví dụ đóng gói hiện tại: Matrix giữ nguyên định tuyến DM/kênh gốc
  và trải nghiệm phản ứng cho phê duyệt exec và plugin, đồng thời vẫn cho phép
  xác thực khác nhau theo loại phê duyệt; Slack duy trì định tuyến phê duyệt gốc
  cho cả id exec và plugin.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại dưới dạng
  wrapper tương thích, nhưng mã mới nên ưu tiên trình dựng khả năng
  và cung cấp `approvalCapability` trên plugin.

### Các đường dẫn con runtime phê duyệt hẹp hơn

Đối với các điểm vào kênh thường xuyên được gọi, hãy ưu tiên những đường dẫn con hẹp hơn này thay cho barrel
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

### Các đường dẫn con thiết lập

- `openclaw/plugin-sdk/setup-runtime` bao gồm các trình trợ giúp thiết lập an toàn cho runtime:
  `createSetupTranslator`, các adapter bản vá thiết lập an toàn khi import
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries` và các trình dựng
  proxy thiết lập được ủy quyền.
- `openclaw/plugin-sdk/channel-setup` bao gồm các trình dựng thiết lập
  cài đặt tùy chọn cùng một số nguyên hàm an toàn cho thiết lập: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` và `splitSetupEntries`.
- Chỉ sử dụng đường nối `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần
  các trình trợ giúp cấu hình/thiết lập dùng chung nặng hơn như
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Nếu kênh của bạn chỉ muốn hiển thị thông báo "trước tiên hãy cài đặt plugin này" trên các bề mặt
thiết lập, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/trình hướng dẫn
được tạo sẽ từ chối an toàn khi ghi cấu hình và hoàn tất, đồng thời tái sử dụng
cùng một thông báo yêu cầu cài đặt trong bước xác thực, hoàn tất và nội dung
liên kết tài liệu.

Nếu kênh của bạn hỗ trợ thiết lập hoặc xác thực dựa trên biến môi trường và các luồng
khởi động/cấu hình chung cần biết tên các biến môi trường đó trước khi runtime tải, hãy khai báo chúng trong
manifest plugin bằng `channelEnvVars`. Chỉ giữ `envVars` của runtime kênh hoặc các
hằng cục bộ cho nội dung dành cho người vận hành.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status` hoặc
các lần quét SecretRef trước khi runtime plugin khởi động, hãy thêm `openclaw.setupEntry` vào
`package.json`. Điểm vào đó phải an toàn để import trong các đường dẫn lệnh
chỉ đọc và phải trả về siêu dữ liệu kênh, adapter cấu hình an toàn cho thiết lập,
adapter trạng thái và siêu dữ liệu đích bí mật của kênh cần thiết cho các
bản tóm tắt đó. Không khởi động client, listener hoặc runtime transport từ
điểm vào thiết lập.

Cũng giữ đường dẫn import của điểm vào kênh chính ở phạm vi hẹp. Quá trình khám phá có thể đánh giá
điểm vào và mô-đun plugin kênh để đăng ký các khả năng mà không
kích hoạt kênh. Các tệp như `channel-plugin-api.ts` nên xuất
đối tượng plugin kênh mà không import trình hướng dẫn thiết lập, client
transport, socket listener, trình khởi chạy tiến trình con hoặc mô-đun khởi động dịch vụ.
Đặt các phần runtime đó trong các mô-đun được tải từ `registerFull(...)`, các setter
runtime hoặc adapter khả năng tải lười.

### Các đường dẫn con kênh hẹp khác

Đối với các đường dẫn kênh thường xuyên được gọi khác, hãy ưu tiên các trình trợ giúp hẹp thay cho các bề mặt cũ
rộng hơn:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và
  phương án dự phòng về tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/channel-inbound` cho việc nối tuyến/phong bì đầu vào và
  ghi nhận-rồi-điều phối
- `openclaw/plugin-sdk/channel-targets` cho các trình trợ giúp phân tích cú pháp đích
- `openclaw/plugin-sdk/outbound-media` để tải phương tiện và
  `openclaw/plugin-sdk/channel-outbound` cho các delegate danh tính/gửi đầu ra
  và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một tuyến đầu ra cần giữ nguyên
  `replyToId`/`threadId` tường minh hoặc khôi phục phiên `:thread:`
  hiện tại sau khi khóa phiên cơ sở vẫn khớp. Plugin nhà cung cấp có thể
  ghi đè mức độ ưu tiên, hành vi hậu tố và chuẩn hóa id luồng khi
  nền tảng của chúng có ngữ nghĩa phân phối luồng gốc.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời liên kết luồng
  và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi bố cục trường payload
  tác nhân/phương tiện cũ vẫn còn bắt buộc
- `openclaw/plugin-sdk/telegram-command-config` (đã ngừng khuyến nghị: không có plugin
  đóng gói nào sử dụng trong môi trường production) cho việc chuẩn hóa lệnh tùy chỉnh của Telegram,
  xác thực trùng lặp/xung đột và hợp đồng cấu hình lệnh ổn định khi dự phòng;
  với mã plugin mới, hãy ưu tiên xử lý cấu hình lệnh cục bộ trong plugin

Các kênh chỉ dành cho xác thực thường có thể dừng ở đường dẫn mặc định: lõi xử lý
phê duyệt và plugin chỉ cung cấp khả năng đầu ra/xác thực. Các kênh
phê duyệt gốc như Matrix, Slack, Telegram và transport trò chuyện tùy chỉnh
nên sử dụng các trình trợ giúp gốc dùng chung thay vì tự triển khai vòng đời
phê duyệt riêng.

## Chính sách đề cập đầu vào

Duy trì việc xử lý đề cập đầu vào thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Sử dụng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định về chính sách đề cập.
Chỉ sử dụng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel
trình trợ giúp đầu vào rộng hơn.

Phù hợp với logic cục bộ của plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra tham gia luồng
- loại trừ thông báo dịch vụ/hệ thống
- các bộ nhớ đệm gốc của nền tảng cần thiết để chứng minh bot tham gia

Phù hợp với trình trợ giúp dùng chung:

- `requireMention`
- kết quả đề cập tường minh
- danh sách cho phép đề cập ngầm định
- bỏ qua bằng lệnh
- quyết định bỏ qua cuối cùng

Luồng được ưu tiên:

1. Tính toán các dữ kiện đề cập cục bộ.
2. Truyền các dữ kiện đó vào `resolveInboundMentionDecision({ facts, policy })`.
3. Sử dụng `decision.effectiveWasMentioned`, `decision.shouldBypassMention` và
   `decision.shouldSkip` trong cổng đầu vào của bạn.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

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

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` trả về một giá trị boolean. `hasAnyMention`,
`isExplicitlyMentioned` và `canResolveExplicit` đến từ siêu dữ liệu đề cập gốc
của chính kênh (các thực thể thông báo, cờ trả lời bot và tương tự);
hãy cung cấp các giá trị `false`/`undefined` khi nền tảng của bạn không thể phát hiện chúng.

`api.runtime.channel.mentions` cung cấp cùng các trình trợ giúp đề cập dùng chung cho
các plugin kênh đóng gói vốn đã phụ thuộc vào việc tiêm runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Nếu bạn chỉ cần `implicitMentionKindWhen` và `resolveInboundMentionDecision`,
hãy import từ `openclaw/plugin-sdk/channel-mention-gating` để tránh tải
các trình trợ giúp runtime đầu vào không liên quan.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Gói và tệp kê khai">
    Tạo các tệp Plugin tiêu chuẩn. Trường `channels` trong
    `openclaw.plugin.json` (không phải trường `kind`) là dấu hiệu cho biết một tệp kê khai
    sở hữu một kênh. Để xem toàn bộ bề mặt siêu dữ liệu của gói, hãy xem
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

    `configSchema` xác thực `plugins.entries.acme-chat.config`. Hãy dùng nó cho
    các cài đặt do Plugin sở hữu nhưng không thuộc cấu hình tài khoản kênh.
    `channelConfigs.acme-chat.schema` xác thực `channels.acme-chat` và là
    nguồn đường dẫn ít dùng được cấu hình lược đồ, quy trình thiết lập và các bề mặt UI sử dụng trước khi
    runtime của Plugin tải. Xem [Tệp kê khai Plugin](/vi/plugins/manifest) để biết toàn bộ
    tài liệu tham khảo về các trường cấp cao nhất.

  </Step>

  <Step title="Xây dựng đối tượng Plugin kênh">
    Giao diện `ChannelPlugin` có nhiều bề mặt bộ điều hợp tùy chọn. Hãy bắt đầu với
    mức tối thiểu — `id`, `config` và `setup` — rồi thêm các bộ điều hợp khi cần.

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
      if (!token) throw new Error("acme-chat: token là bắt buộc");
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
        // `setup` xử lý các thao tác ghi khi làm quen (applyAccountConfig, validateInput).
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

      // Ghép đôi: luồng phê duyệt dành cho liên hệ DM mới
      pairing: {
        text: {
          idLabel: "Tên người dùng Acme Chat",
          message: "Gửi mã này để xác minh danh tính của bạn:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Mã ghép đôi: ${code}`);
          },
        },
      },

      // Luồng hội thoại: cách chuyển phát câu trả lời
      threading: { topLevelReplyToMode: "reply" },

      // Gửi đi: gửi tin nhắn đến nền tảng
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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn hóa và khóa lồng nhau cũ, hãy dùng các trình trợ giúp từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` và `normalizeChannelDmPolicy` giữ các giá trị cục bộ của tài khoản ở mức ưu tiên cao hơn các giá trị gốc được kế thừa. Ghép cùng trình phân giải đó với quy trình sửa chữa của doctor thông qua `normalizeLegacyDmAliases` để runtime và quá trình di chuyển đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin thực hiện những gì cho bạn">
      Thay vì triển khai thủ công các giao diện bộ điều hợp cấp thấp, bạn truyền vào
      các tùy chọn khai báo và trình dựng sẽ kết hợp chúng:

      | Tùy chọn | Thành phần được kết nối |
      | --- | --- |
      | `security.dm` | Trình phân giải bảo mật DM theo phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép đôi DM dựa trên văn bản có trao đổi mã |
      | `threading` | Trình phân giải chế độ trả lời (cố định, theo phạm vi tài khoản hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (ID tin nhắn); yêu cầu một id `channel` cùng cấp để lõi có thể đóng dấu kết quả chuyển phát được trả về |

      Bạn cũng có thể truyền trực tiếp các đối tượng bộ điều hợp thô thay cho các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Các bộ điều hợp gửi đi thô có thể định nghĩa một hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm chuyển phát,
      chẳng hạn như `maxLinesPerMessage`; hãy áp dụng nó trước khi gửi để luồng trả lời
      và ranh giới phân đoạn chỉ được quy định một lần bởi cơ chế chuyển phát gửi đi dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi đã phân giải một đích trả lời gốc, để các trình trợ giúp tải trọng có thể giữ nguyên
      các thẻ trả lời tường minh mà không sử dụng một vị trí trả lời ngầm chỉ dùng một lần.
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
    trong khi các lần tải đầy đủ thông thường vẫn lấy cùng các bộ mô tả đó để đăng ký lệnh
    thực tế. Chỉ dùng `registerFull(...)` cho công việc ở runtime.
    `defineChannelPluginEntry` tự động xử lý việc phân tách chế độ đăng ký.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy dùng một
    tiền tố riêng cho Plugin. Các không gian tên quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải thành `operator.admin`. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm điểm vào thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình làm quen:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải điểm vào này thay cho điểm vào đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Điều này tránh tải mã runtime nặng trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh không gian làm việc được đóng gói sẵn tách các nội dung xuất an toàn cho thiết lập thành các mô-đun
    phụ trợ có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    hàm thiết lập runtime tường minh tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn đến">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
    điều phối yêu cầu đó qua trình xử lý tin nhắn đến của kênh:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // xác thực do Plugin quản lý (tự xác minh chữ ký)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Trình xử lý tin nhắn đến của bạn điều phối tin nhắn đến OpenClaw.
          // Cách kết nối chính xác phụ thuộc vào SDK nền tảng của bạn -
          // xem ví dụ thực tế trong gói Plugin Microsoft Teams hoặc Google Chat được đóng gói sẵn.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Việc xử lý tin nhắn đến phụ thuộc vào từng kênh. Mỗi Plugin kênh sở hữu
      quy trình xử lý tin nhắn đến riêng. Hãy xem các Plugin kênh được đóng gói sẵn
      (ví dụ: gói Plugin Microsoft Teams hoặc Google Chat) để tham khảo các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Kiểm thử">
Viết các bài kiểm thử đặt cùng vị trí trong `src/channel.test.ts`:

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

      it("kiểm tra tài khoản mà không hiện thực hóa thông tin bí mật", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("báo cáo cấu hình bị thiếu", () => {
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
├── openclaw.plugin.json      # Tệp kê khai có lược đồ cấu hình
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Các nội dung xuất công khai (tùy chọn)
├── runtime-api.ts            # Các nội dung xuất runtime nội bộ (tùy chọn)
└── src/
    ├── channel.ts            # ChannelPlugin qua createChatChannelPlugin
    ├── channel.test.ts       # Các bài kiểm thử
    ├── client.ts             # Máy khách API nền tảng
    └── runtime.ts            # Kho lưu trữ runtime (nếu cần)
```

## Chủ đề nâng cao

<CardGroup cols={2}>
  <Card title="Tùy chọn luồng hội thoại" icon="git-branch" href="/vi/plugins/sdk-entrypoints#registration-mode">
    Chế độ trả lời cố định, theo phạm vi tài khoản hoặc tùy chỉnh
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
Một số điểm nối trợ giúp đi kèm vẫn tồn tại để bảo trì các plugin đi kèm và
đảm bảo tính tương thích. Đây không phải là mẫu được khuyến nghị cho các plugin kênh mới;
hãy ưu tiên các đường dẫn con chung cho kênh/thiết lập/trả lời/runtime từ bề mặt SDK
dùng chung, trừ khi bạn đang trực tiếp bảo trì họ plugin đi kèm đó.
</Note>

## Các bước tiếp theo

- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - nếu plugin của bạn cũng cung cấp các mô hình
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tài liệu tham khảo đầy đủ về nhập đường dẫn con
- [Kiểm thử SDK](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Tệp kê khai Plugin](/vi/plugins/manifest) - lược đồ tệp kê khai đầy đủ

## Liên quan

- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Plugin bộ khung tác tử](/vi/plugins/sdk-agent-harness)
