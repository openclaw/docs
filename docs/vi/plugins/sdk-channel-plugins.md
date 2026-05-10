---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng một Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-05-10T19:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin kênh kết nối OpenClaw với một
nền tảng nhắn tin. Sau khi hoàn tất, bạn sẽ có một kênh hoạt động với bảo mật DM,
ghép nối, phân luồng trả lời và nhắn tin gửi đi.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào, trước tiên hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

## Cách Plugin kênh hoạt động

Plugin kênh không cần công cụ gửi/chỉnh sửa/phản ứng riêng. OpenClaw giữ một
công cụ `message` dùng chung trong phần lõi. Plugin của bạn sở hữu:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách DM và danh sách cho phép
- **Ghép nối** - luồng phê duyệt DM
- **Ngữ pháp phiên** - cách id cuộc trò chuyện riêng theo nhà cung cấp ánh xạ tới cuộc trò chuyện gốc, id luồng và phương án dự phòng cha
- **Gửi đi** - gửi văn bản, phương tiện và bình chọn tới nền tảng
- **Phân luồng** - cách các trả lời được phân luồng
- **Gõ Heartbeat** - tín hiệu đang gõ/bận tùy chọn cho các đích gửi Heartbeat

Phần lõi sở hữu công cụ tin nhắn dùng chung, nối dây prompt, hình dạng khóa phiên bên ngoài,
ghi sổ `:thread:` chung và điều phối.

Plugin kênh mới cũng nên cung cấp một adapter `message` bằng
`defineChannelMessageAdapter` từ `openclaw/plugin-sdk/channel-message`. Adapter
khai báo những khả năng gửi cuối bền vững nào mà cơ chế truyền tải gốc
thực sự hỗ trợ và trỏ các lần gửi văn bản/phương tiện tới cùng các hàm truyền tải như
adapter `outbound` cũ. Chỉ khai báo một khả năng khi kiểm thử hợp đồng
chứng minh tác dụng phụ gốc và biên nhận được trả về.
Để xem đầy đủ hợp đồng API, ví dụ, ma trận khả năng, quy tắc biên nhận, hoàn tất
bản xem trước trực tiếp, chính sách ack nhận, kiểm thử và bảng di chuyển, hãy xem
[API tin nhắn kênh](/vi/plugins/sdk-channel-message).
Nếu adapter `outbound` hiện có đã có đúng các phương thức gửi và
siêu dữ liệu khả năng, hãy dùng `createChannelMessageAdapterFromOutbound(...)` để
dẫn xuất adapter `message` thay vì viết thủ công một cầu nối khác.
Các lần gửi của adapter nên trả về giá trị `MessageReceipt`. Khi mã tương thích
vẫn cần id cũ, hãy dẫn xuất chúng bằng `listMessageReceiptPlatformIds(...)`
hoặc `resolveMessageReceiptPrimaryId(...)` thay vì giữ các trường
`messageIds` song song trong mã vòng đời mới.
Các kênh hỗ trợ xem trước cũng nên khai báo `message.live.capabilities` với
vòng đời trực tiếp chính xác mà chúng sở hữu, chẳng hạn như `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` hoặc
`quietFinalization`. Các kênh hoàn tất bản xem trước nháp tại chỗ cũng nên
khai báo `message.live.finalizer.capabilities`, chẳng hạn như `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` và
`retainOnAmbiguousFailure`, đồng thời định tuyến logic runtime qua
`defineFinalizableLivePreviewAdapter(...)` cộng với
`deliverWithFinalizableLivePreviewAdapter(...)`. Giữ các khả năng đó được
chống lưng bằng kiểm thử `verifyChannelMessageLiveCapabilityAdapterProofs(...)` và
`verifyChannelMessageLiveFinalizerProofs(...)` để hành vi xem trước gốc,
tiến trình, chỉnh sửa, dự phòng/lưu giữ, dọn dẹp và biên nhận không thể âm thầm sai lệch.
Các bộ nhận đầu vào trì hoãn acknowledgement của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì giấu
thời điểm ack trong trạng thái cục bộ của trình giám sát. Bao phủ mọi chính sách đã khai báo bằng
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các helper trả lời/lượt cũ như `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` và `recordInboundSessionAndDispatchReply`
vẫn có sẵn cho các dispatcher tương thích. Không dùng các tên đó cho mã
kênh mới; Plugin mới nên bắt đầu với adapter `message`, biên nhận và
các helper vòng đời nhận/gửi trên `openclaw/plugin-sdk/channel-message`.

Các kênh đang di chuyển ủy quyền đầu vào có thể dùng subpath thử nghiệm
`openclaw/plugin-sdk/channel-ingress-runtime` từ các đường dẫn nhận runtime.
Subpath này giữ việc tra cứu nền tảng và tác dụng phụ trong Plugin, đồng thời
chia sẻ phân giải trạng thái danh sách cho phép, quyết định tuyến/người gửi/lệnh/sự kiện/kích hoạt,
chẩn đoán đã biên tập và ánh xạ tiếp nhận lượt. Giữ chuẩn hóa định danh
Plugin trong descriptor bạn truyền cho resolver; không tuần tự hóa các giá trị khớp thô
từ trạng thái hoặc quyết định đã phân giải. Xem
[API đầu vào kênh](/vi/plugins/sdk-channel-ingress) để biết thiết kế API,
ranh giới sở hữu và kỳ vọng kiểm thử.

Nếu kênh của bạn hỗ trợ chỉ báo đang gõ ngoài các trả lời đầu vào, hãy cung cấp
`heartbeat.sendTyping(...)` trên Plugin kênh. Phần lõi gọi nó với
đích gửi Heartbeat đã phân giải trước khi lần chạy mô hình Heartbeat bắt đầu và
dùng vòng đời keepalive/dọn dẹp đang gõ dùng chung. Thêm `heartbeat.clearTyping(...)`
khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu kênh của bạn thêm tham số công cụ tin nhắn mang nguồn phương tiện, hãy cung cấp các
tên tham số đó qua `describeMessageTool(...).mediaSourceParams`. Phần lõi dùng
danh sách tường minh đó để chuẩn hóa đường dẫn sandbox và áp dụng chính sách truy cập
phương tiện gửi đi, vì vậy Plugin không cần các trường hợp đặc biệt trong phần lõi dùng chung cho
tham số avatar, tệp đính kèm hoặc ảnh bìa riêng theo nhà cung cấp.
Nên trả về một map theo khóa hành động, chẳng hạn như
`{ "set-profile": ["avatarUrl", "avatarPath"] }` để các hành động không liên quan không
kế thừa đối số phương tiện của hành động khác. Mảng phẳng vẫn hoạt động cho các tham số
được chủ ý chia sẻ trên mọi hành động được cung cấp.

Nếu kênh của bạn cần tạo hình riêng theo nhà cung cấp cho `message(action="send")`,
nên dùng `actions.prepareSendPayload(...)`. Đặt thẻ gốc, khối, nhúng hoặc
dữ liệu bền vững khác dưới `payload.channelData.<channel>` và để phần lõi thực hiện
lần gửi thực tế qua adapter outbound/message. Chỉ dùng
`actions.handleAction(...)` cho gửi như một phương án dự phòng tương thích cho
payload không thể được tuần tự hóa và thử lại.

Nếu nền tảng của bạn lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ phần phân tích cú pháp đó
trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đó là hook
chuẩn để ánh xạ `rawId` sang id cuộc trò chuyện gốc, id luồng tùy chọn,
`baseConversationId` tường minh và mọi `parentConversationCandidates`.
Khi bạn trả về `parentConversationCandidates`, hãy giữ chúng theo thứ tự từ
cha hẹp nhất đến cuộc trò chuyện rộng nhất/gốc.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh một luồng con với tuyến cha của nó hoặc xây dựng
khóa chống trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper này
chuẩn hóa id luồng dạng số giống như phần lõi, vì vậy Plugin nên ưu tiên
nó thay cho các phép so sánh tùy biến `String(threadId)`.
Plugin có ngữ pháp đích riêng theo nhà cung cấp có thể tiêm parser của mình vào
`resolveChannelRouteTargetWithParser(...)` mà vẫn nhận được cùng hình dạng đích tuyến
và ngữ nghĩa dự phòng luồng mà phần lõi dùng.

Các Plugin đi kèm cần cùng cách phân tích cú pháp trước khi registry kênh khởi động
cũng có thể cung cấp tệp `session-key-api.ts` cấp cao nhất với export
`resolveSessionConversation(...)` tương ứng. Phần lõi chỉ dùng bề mặt an toàn cho bootstrap đó
khi registry Plugin runtime chưa khả dụng.

`messaging.resolveParentConversationCandidates(...)` vẫn có sẵn như một
phương án dự phòng tương thích cũ khi Plugin chỉ cần các phương án dự phòng cha trên
id chung/thô. Nếu cả hai hook tồn tại, phần lõi dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
quay lại `resolveParentConversationCandidates(...)` khi hook chuẩn
bỏ qua chúng.

## Phê duyệt và khả năng của kênh

Hầu hết Plugin kênh không cần mã riêng cho phê duyệt.

- Phần lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và cơ chế gửi dự phòng chung.
- Ưu tiên một đối tượng `approvalCapability` trên plugin kênh khi kênh cần hành vi riêng cho phê duyệt.
- `ChannelPlugin.approvals` đã bị xóa. Đặt các dữ kiện gửi/native/render/auth của phê duyệt trên `approvalCapability`.
- `plugin.auth` chỉ dành cho đăng nhập/đăng xuất; phần lõi không còn đọc các hook auth phê duyệt từ đối tượng đó.
- `approvalCapability.authorizeActorAction` và `approvalCapability.getActionAvailabilityState` là seam auth phê duyệt chuẩn.
- Dùng `approvalCapability.getActionAvailabilityState` cho khả năng sẵn có của auth phê duyệt trong cùng cuộc trò chuyện.
- Nếu kênh của bạn phơi bày các phê duyệt exec native, dùng `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái bề mặt khởi tạo/native-client khi nó khác với auth phê duyệt trong cùng cuộc trò chuyện. Phần lõi dùng hook riêng cho exec đó để phân biệt `enabled` với `disabled`, quyết định liệu kênh khởi tạo có hỗ trợ phê duyệt exec native hay không, và đưa kênh vào hướng dẫn dự phòng native-client. `createApproverRestrictedNativeApprovalCapability(...)` điền phần này cho trường hợp phổ biến.
- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng theo kênh, chẳng hạn như ẩn các lời nhắc phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo đang nhập trước khi gửi.
- Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt native hoặc chặn dự phòng.
- Dùng `approvalCapability.nativeRuntime` cho các dữ kiện phê duyệt native do kênh sở hữu. Giữ nó lazy trên các entrypoint kênh nóng bằng `createLazyChannelApprovalNativeRuntimeAdapter(...)`, có thể import module runtime của bạn theo nhu cầu trong khi vẫn cho phép phần lõi lắp ráp vòng đời phê duyệt.
- Chỉ dùng `approvalCapability.render` khi kênh thật sự cần payload phê duyệt tùy chỉnh thay vì renderer dùng chung.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn phản hồi ở nhánh disabled giải thích chính xác các núm cấu hình cần thiết để bật phê duyệt exec native. Hook nhận `{ channel, channelLabel, accountId }`; các kênh theo tài khoản được đặt tên nên render các đường dẫn theo phạm vi tài khoản như `channels.<channel>.accounts.<id>.execApprovals.*` thay vì các mặc định cấp cao nhất.
- Nếu một kênh có thể suy luận các danh tính DM ổn định giống chủ sở hữu từ cấu hình hiện có, dùng `createResolvedApproverActionAuthAdapter` từ `openclaw/plugin-sdk/approval-runtime` để giới hạn `/approve` trong cùng cuộc trò chuyện mà không thêm logic phần lõi riêng cho phê duyệt.
- Nếu một kênh cần gửi phê duyệt native, hãy giữ mã kênh tập trung vào chuẩn hóa đích cộng với các dữ kiện transport/presentation. Dùng `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, và `createApproverRestrictedNativeApprovalCapability` từ `openclaw/plugin-sdk/approval-runtime`. Đặt các dữ kiện riêng của kênh phía sau `approvalCapability.nativeRuntime`, tốt nhất thông qua `createChannelApprovalNativeRuntimeAdapter(...)` hoặc `createLazyChannelApprovalNativeRuntimeAdapter(...)`, để phần lõi có thể lắp ráp handler và sở hữu việc lọc yêu cầu, định tuyến, khử trùng lặp, hết hạn, đăng ký Gateway và thông báo đã định tuyến nơi khác. `nativeRuntime` được tách thành vài seam nhỏ hơn:
- `createChannelNativeOriginTargetResolver` dùng trình khớp tuyến kênh dùng chung theo mặc định cho các đích `{ to, accountId, threadId }`. Chỉ truyền `targetsMatch` khi một kênh có quy tắc tương đương riêng theo provider, chẳng hạn như khớp tiền tố timestamp của Slack.
- Truyền `normalizeTargetForMatch` cho `createChannelNativeOriginTargetResolver` khi kênh cần chuẩn hóa id provider trước khi trình khớp tuyến mặc định hoặc callback `targetsMatch` tùy chỉnh chạy, trong khi vẫn giữ nguyên đích gốc để gửi. Chỉ dùng `normalizeTarget` khi chính đích gửi đã được phân giải cần được chuẩn hóa.
- `availability` - liệu tài khoản đã được cấu hình hay chưa và liệu một yêu cầu có nên được xử lý hay không
- `presentation` - ánh xạ view model phê duyệt dùng chung thành payload native đang chờ/đã giải quyết/hết hạn hoặc hành động cuối cùng
- `transport` - chuẩn bị đích cộng với gửi/cập nhật/xóa thông báo phê duyệt native
- `interactions` - các hook bind/unbind/clear-action tùy chọn cho nút hoặc phản ứng native
- `observe` - các hook chẩn đoán gửi tùy chọn
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, ứng dụng Bolt hoặc webhook receiver, đăng ký chúng thông qua `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context chung cho phép phần lõi bootstrap các handler điều khiển bằng capability từ trạng thái khởi động kênh mà không thêm lớp keo wrapper riêng cho phê duyệt.
- Chỉ dùng các API cấp thấp hơn `createChannelApprovalHandler` hoặc `createChannelNativeApprovalRuntime` khi seam điều khiển bằng capability chưa đủ biểu đạt.
- Các kênh phê duyệt native phải định tuyến cả `accountId` và `approvalKind` qua các helper đó. `accountId` giữ chính sách phê duyệt đa tài khoản trong đúng phạm vi tài khoản bot, và `approvalKind` giữ hành vi phê duyệt exec so với plugin sẵn có cho kênh mà không có nhánh hardcode trong phần lõi.
- Phần lõi hiện cũng sở hữu các thông báo định tuyến lại phê duyệt. Plugin kênh không nên gửi thông báo theo sau riêng kiểu "phê duyệt đã đến DM / kênh khác" từ `createChannelNativeApprovalRuntime`; thay vào đó, hãy phơi bày định tuyến origin + approver-DM chính xác thông qua các helper capability phê duyệt dùng chung và để phần lõi tổng hợp các lần gửi thực tế trước khi đăng bất kỳ thông báo nào trở lại cuộc trò chuyện khởi tạo.
- Bảo toàn loại id phê duyệt đã gửi xuyên suốt từ đầu đến cuối. Native client không nên
  đoán hoặc ghi lại định tuyến phê duyệt exec so với plugin từ trạng thái cục bộ của kênh.
- Các loại phê duyệt khác nhau có thể cố ý phơi bày các bề mặt native khác nhau.
  Các ví dụ tích hợp hiện tại:
  - Slack giữ định tuyến phê duyệt native khả dụng cho cả id exec và plugin.
  - Matrix giữ cùng định tuyến DM/kênh native và UX phản ứng cho các phê duyệt exec
    và plugin, trong khi vẫn cho phép auth khác nhau theo loại phê duyệt.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại như một wrapper tương thích, nhưng mã mới nên ưu tiên builder capability và phơi bày `approvalCapability` trên plugin.

Đối với các entrypoint kênh nóng, hãy ưu tiên các đường dẫn con runtime hẹp hơn khi bạn chỉ
cần một phần của họ đó:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Tương tự, ưu tiên `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, và
`openclaw/plugin-sdk/reply-chunking` khi bạn không cần bề mặt umbrella rộng hơn.

Riêng với setup:

- `openclaw/plugin-sdk/setup-runtime` bao phủ các helper setup an toàn cho runtime:
  adapter patch setup an toàn khi import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và các builder
  setup-proxy được ủy quyền
- `openclaw/plugin-sdk/setup-runtime` bao gồm seam adapter nhận biết env cho
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` bao phủ các builder setup cài đặt tùy chọn
  cộng với một vài primitive an toàn cho setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Nếu kênh của bạn hỗ trợ setup hoặc auth điều khiển bằng env và các luồng khởi động/cấu hình
chung cần biết các tên env đó trước khi runtime tải, hãy khai báo chúng trong
manifest plugin bằng `channelEnvVars`. Chỉ giữ `envVars` runtime kênh hoặc hằng số cục bộ
cho phần nội dung hướng tới operator.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc
các lần quét SecretRef trước khi runtime plugin khởi động, hãy thêm `openclaw.setupEntry` trong
`package.json`. Entrypoint đó phải an toàn để import trong các đường dẫn lệnh chỉ đọc
và phải trả về metadata kênh, adapter cấu hình an toàn cho setup, adapter trạng thái,
và metadata đích bí mật kênh cần thiết cho các tóm tắt đó. Không
khởi động client, listener hoặc runtime transport từ entry setup.

Giữ đường dẫn import entry chính của kênh cũng hẹp. Discovery có thể đánh giá
entry và module plugin kênh để đăng ký capability mà không kích hoạt
kênh. Các tệp như `channel-plugin-api.ts` nên export đối tượng plugin kênh
mà không import wizard setup, client transport, listener socket,
trình khởi chạy subprocess hoặc module khởi động dịch vụ. Đặt các phần runtime đó
trong các module được tải từ `registerFull(...)`, setter runtime hoặc adapter
capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, và
`splitSetupEntries`

- chỉ dùng seam rộng hơn `openclaw/plugin-sdk/setup` khi bạn cũng cần các
  helper setup/config dùng chung nặng hơn như
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Nếu kênh của bạn chỉ muốn quảng bá "cài đặt plugin này trước" trong các bề mặt
setup, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/wizard được tạo
fail closed khi ghi cấu hình và finalize, đồng thời tái sử dụng
cùng thông báo yêu cầu cài đặt trên validation, finalize và nội dung liên kết docs.

Đối với các đường dẫn kênh nóng khác, hãy ưu tiên các helper hẹp thay vì các
bề mặt legacy rộng hơn:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình đa tài khoản và
  dự phòng tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/inbound-reply-dispatch` cho route/envelope inbound và
  wiring ghi-nhận-và-dispatch
- `openclaw/plugin-sdk/messaging-targets` cho phân tích/khớp đích
- `openclaw/plugin-sdk/outbound-media` và
  `openclaw/plugin-sdk/outbound-runtime` cho tải media cộng với các delegate
  danh tính/gửi outbound và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một tuyến outbound nên giữ nguyên
  `replyToId`/`threadId` rõ ràng hoặc khôi phục session `:thread:` hiện tại
  sau khi khóa session cơ sở vẫn khớp. Các plugin provider có thể ghi đè
  độ ưu tiên, hành vi hậu tố và chuẩn hóa id thread khi nền tảng của chúng
  có ngữ nghĩa gửi thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời thread-binding
  và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi layout trường payload
  agent/media legacy vẫn còn bắt buộc
- `openclaw/plugin-sdk/telegram-command-config` cho chuẩn hóa lệnh tùy chỉnh
  Telegram, validation trùng lặp/xung đột và hợp đồng cấu hình lệnh
  ổn định khi dự phòng

Các kênh chỉ auth thường có thể dừng ở đường dẫn mặc định: phần lõi xử lý phê duyệt và plugin chỉ phơi bày capability outbound/auth. Các kênh phê duyệt native như Matrix, Slack, Telegram và transport chat tùy chỉnh nên dùng các helper native dùng chung thay vì tự xây dựng vòng đời phê duyệt.

## Chính sách đề cập inbound

Giữ việc xử lý đề cập inbound tách thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách đề cập.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel helper inbound
rộng hơn.

Phù hợp với logic cục bộ của plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra sự tham gia trong thread
- loại trừ tin nhắn dịch vụ/hệ thống
- cache native của nền tảng cần thiết để chứng minh bot đã tham gia

Phù hợp với helper dùng chung:

- `requireMention`
- kết quả nhắc đến tường minh
- danh sách cho phép nhắc đến ngầm định
- bỏ qua bằng lệnh
- quyết định bỏ qua cuối cùng

Luồng ưu tiên:

1. Tính các dữ kiện nhắc đến cục bộ.
2. Truyền các dữ kiện đó vào `resolveInboundMentionDecision({ facts, policy })`.
3. Dùng `decision.effectiveWasMentioned`, `decision.shouldBypassMention` và `decision.shouldSkip` trong cổng inbound của bạn.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` cung cấp cùng các helper nhắc đến dùng chung cho
các Plugin kênh được đóng gói vốn đã phụ thuộc vào runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Nếu bạn chỉ cần `implicitMentionKindWhen` và
`resolveInboundMentionDecision`, hãy import từ
`openclaw/plugin-sdk/channel-mention-gating` để tránh tải các helper runtime
inbound không liên quan.

Các helper `resolveMentionGating*` cũ hơn vẫn còn trên
`openclaw/plugin-sdk/channel-inbound` chỉ dưới dạng export tương thích. Mã mới
nên dùng `resolveInboundMentionDecision({ facts, policy })`.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Gói và manifest">
    Tạo các tệp Plugin tiêu chuẩn. Trường `channel` trong `package.json` là
    phần biến đây thành một Plugin kênh. Để xem toàn bộ bề mặt metadata của gói,
    xem [Thiết lập và cấu hình Plugin](/vi/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` xác thực `plugins.entries.acme-chat.config`. Dùng trường này cho
    các thiết lập do Plugin sở hữu không phải là cấu hình tài khoản kênh. `channelConfigs`
    xác thực `channels.acme-chat` và là nguồn cold-path được schema cấu hình,
    thiết lập và các bề mặt UI sử dụng trước khi runtime của Plugin được tải.

  </Step>

  <Step title="Xây dựng đối tượng Plugin kênh">
    Giao diện `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Bắt đầu với
    mức tối thiểu - `id` và `setup` - rồi thêm adapter khi bạn cần.

    Tạo `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn tắc và khóa lồng cũ, hãy dùng các helper từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` và `normalizeChannelDmPolicy` giữ các giá trị cục bộ theo tài khoản đứng trước các giá trị root được kế thừa. Ghép cùng resolver đó với quá trình sửa chữa của doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin làm gì cho bạn">
      Thay vì tự triển khai các giao diện adapter cấp thấp, bạn truyền vào
      các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Phần được nối dây |
      | --- | --- |
      | `security.dm` | Resolver bảo mật DM có phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép đôi DM dựa trên văn bản với trao đổi mã |
      | `threading` | Resolver chế độ reply-to (cố định, theo phạm vi tài khoản, hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về metadata kết quả (ID tin nhắn) |

      Bạn cũng có thể truyền các đối tượng adapter thô thay cho các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Adapter outbound thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm phân phối
      chẳng hạn như `maxLinesPerMessage`; áp dụng nó trước khi gửi để reply threading
      và ranh giới chunk được phân giải một lần bởi phần phân phối outbound dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi một mục tiêu trả lời gốc đã được phân giải, để các helper payload có thể giữ lại
      thẻ trả lời tường minh mà không tiêu thụ một slot trả lời ngầm định dùng một lần.
    </Accordion>

  </Step>

  <Step title="Nối điểm vào">
    Tạo `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Đặt các descriptor CLI do kênh sở hữu trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong trợ giúp root mà không kích hoạt toàn bộ runtime kênh,
    trong khi các lần tải đầy đủ thông thường vẫn nhận cùng các descriptor đó để đăng ký lệnh thật.
    Giữ `registerFull(...)` cho công việc chỉ dành cho runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy dùng
    tiền tố riêng cho Plugin. Các namespace quản trị core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được giữ riêng và luôn
    phân giải về `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý phần tách chế độ đăng ký. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm điểm vào thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải điểm này thay cho điểm vào đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Nó tránh kéo mã runtime nặng vào trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace được đóng gói tách export an toàn cho thiết lập vào các module sidecar
    có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    setter runtime rõ ràng tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn inbound">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu điển hình là một Webhook xác thực yêu cầu và
    điều phối nó qua handler inbound của kênh bạn:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
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
      pipeline tin nhắn đến riêng của nó. Hãy xem các Plugin kênh được đóng gói sẵn
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để thấy các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Viết các kiểm thử đặt cùng vị trí trong `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Với các helper kiểm thử dùng chung, xem [Testing](/vi/plugins/sdk-testing).

</Step>
</Steps>

## Cấu trúc tệp

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Chủ đề nâng cao

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/vi/plugins/sdk-entrypoints#registration-mode">
    Các chế độ trả lời cố định, theo phạm vi tài khoản hoặc tùy chỉnh
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/vi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool và khám phá hành động
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/vi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, phương tiện, subagent qua api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/vi/plugins/sdk-channel-turn">
    Vòng đời lượt đến dùng chung: tiếp nhận, phân giải, ghi lại, điều phối, hoàn tất
  </Card>
</CardGroup>

<Note>
Một số seam helper được đóng gói sẵn vẫn tồn tại để bảo trì Plugin được đóng gói sẵn và
đảm bảo tương thích. Chúng không phải mẫu được khuyến nghị cho các Plugin kênh mới;
hãy ưu tiên các subpath channel/setup/reply/runtime chung từ bề mặt SDK dùng chung,
trừ khi bạn đang trực tiếp bảo trì họ Plugin được đóng gói sẵn đó.
</Note>

## Bước tiếp theo

- [Provider Plugins](/vi/plugins/sdk-provider-plugins) - nếu Plugin của bạn cũng cung cấp mô hình
- [SDK Overview](/vi/plugins/sdk-overview) - tham chiếu import subpath đầy đủ
- [SDK Testing](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Plugin Manifest](/vi/plugins/manifest) - schema manifest đầy đủ

## Liên quan

- [Plugin SDK setup](/vi/plugins/sdk-setup)
- [Building plugins](/vi/plugins/building-plugins)
- [Agent harness plugins](/vi/plugins/sdk-agent-harness)
