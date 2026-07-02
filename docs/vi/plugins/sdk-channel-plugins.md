---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt bộ điều hợp ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-07-02T22:37:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một channel plugin kết nối OpenClaw với một
nền tảng nhắn tin. Đến cuối hướng dẫn, bạn sẽ có một channel hoạt động với bảo mật DM,
ghép cặp, phân luồng trả lời và nhắn tin đi.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc gói
  cơ bản và thiết lập manifest.
</Info>

## Cách channel plugin hoạt động

Channel plugin không cần công cụ gửi/chỉnh sửa/phản ứng riêng. OpenClaw giữ một
công cụ `message` dùng chung trong core. Plugin của bạn sở hữu:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách DM và danh sách cho phép
- **Ghép cặp** - luồng phê duyệt DM
- **Ngữ pháp phiên** - cách các id cuộc trò chuyện riêng theo provider ánh xạ tới chat cơ sở, id luồng và fallback cha
- **Gửi đi** - gửi văn bản, media và bình chọn tới nền tảng
- **Phân luồng** - cách các trả lời được phân luồng
- **Heartbeat typing** - tín hiệu đang nhập/bận tùy chọn cho các đích gửi Heartbeat

Core sở hữu công cụ message dùng chung, nối dây prompt, dạng khóa phiên bên ngoài,
sổ sách `:thread:` chung và dispatch.

Các channel plugin mới cũng nên phơi bày một adapter `message` bằng
`defineChannelMessageAdapter` từ `openclaw/plugin-sdk/channel-outbound`. Adapter
khai báo những năng lực gửi cuối bền vững mà native transport thực sự hỗ trợ
và trỏ các lần gửi văn bản/media tới cùng các hàm transport như adapter
`outbound` cũ. Chỉ khai báo một năng lực khi contract test chứng minh side effect
native và receipt được trả về.
Để xem đầy đủ hợp đồng API, ví dụ, ma trận năng lực, quy tắc receipt, hoàn tất
bản xem trước trực tiếp, chính sách receive ack, kiểm thử và bảng migration, xem
[API gửi đi của channel](/vi/plugins/sdk-channel-outbound).
Nếu adapter `outbound` hiện có đã có các phương thức gửi và metadata năng lực
phù hợp, hãy dùng `createChannelMessageAdapterFromOutbound(...)` để dẫn xuất
adapter `message` thay vì viết tay một bridge khác.
Các lần gửi của adapter nên trả về giá trị `MessageReceipt`. Khi mã tương thích
vẫn cần id cũ, hãy dẫn xuất chúng bằng `listMessageReceiptPlatformIds(...)`
hoặc `resolveMessageReceiptPrimaryId(...)` thay vì giữ các trường
`messageIds` song song trong mã vòng đời mới.
Các channel hỗ trợ xem trước cũng nên khai báo `message.live.capabilities` với
vòng đời trực tiếp chính xác mà chúng sở hữu, chẳng hạn như `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, hoặc
`quietFinalization`. Các channel hoàn tất bản xem trước nháp tại chỗ cũng nên
khai báo `message.live.finalizer.capabilities`, chẳng hạn như `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, và
`retainOnAmbiguousFailure`, đồng thời định tuyến logic runtime qua
`defineFinalizableLivePreviewAdapter(...)` cùng
`deliverWithFinalizableLivePreviewAdapter(...)`. Giữ các năng lực đó được bảo
chứng bằng kiểm thử `verifyChannelMessageLiveCapabilityAdapterProofs(...)` và
`verifyChannelMessageLiveFinalizerProofs(...)` để hành vi xem trước native,
tiến độ, chỉnh sửa, fallback/giữ lại, dọn dẹp và receipt không thể âm thầm lệch đi.
Các bộ nhận inbound trì hoãn acknowledgement của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì ẩn thời điểm
ack trong trạng thái cục bộ của monitor. Bao phủ mọi chính sách đã khai báo bằng
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các helper trả lời cũ như `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, và `recordInboundSessionAndDispatchReply`
vẫn có sẵn cho các dispatcher tương thích. Không dùng các tên đó cho mã channel
mới; Plugin mới nên bắt đầu với adapter `message`, receipt và các helper vòng đời
nhận/gửi trên `openclaw/plugin-sdk/channel-outbound`.

Các channel đang migration ủy quyền inbound có thể dùng subpath thử nghiệm
`openclaw/plugin-sdk/channel-ingress-runtime` từ các đường dẫn nhận runtime.
Subpath này giữ việc tra cứu nền tảng và side effect trong Plugin, đồng thời
chia sẻ phân giải trạng thái danh sách cho phép, quyết định route/sender/command/event/activation,
chẩn đoán đã biên tập và ánh xạ nhận lượt. Giữ việc chuẩn hóa danh tính Plugin
trong descriptor bạn truyền cho resolver; không serialize các giá trị khớp thô
từ trạng thái hoặc quyết định đã phân giải. Xem
[API ingress của channel](/vi/plugins/sdk-channel-ingress) để biết thiết kế API,
ranh giới sở hữu và kỳ vọng kiểm thử.

Nếu channel của bạn hỗ trợ chỉ báo đang nhập ngoài các trả lời inbound, hãy phơi bày
`heartbeat.sendTyping(...)` trên channel plugin. Core gọi nó với đích gửi Heartbeat
đã phân giải trước khi lần chạy mô hình Heartbeat bắt đầu và dùng vòng đời
keepalive/dọn dẹp typing dùng chung. Thêm `heartbeat.clearTyping(...)`
khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu channel của bạn thêm các tham số message-tool mang nguồn media, hãy phơi bày
tên các tham số đó qua `describeMessageTool(...).mediaSourceParams`. Core dùng
danh sách rõ ràng đó cho chuẩn hóa đường dẫn sandbox và chính sách truy cập media
gửi đi, nên Plugin không cần các trường hợp đặc biệt trong shared-core cho những
tham số avatar, tệp đính kèm hoặc ảnh bìa riêng theo provider.
Ưu tiên trả về một map theo khóa hành động như
`{ "set-profile": ["avatarUrl", "avatarPath"] }` để các hành động không liên quan
không kế thừa đối số media của hành động khác. Một mảng phẳng vẫn hoạt động với
các tham số được chủ ý chia sẻ trên mọi hành động được phơi bày.
Các channel phải phơi bày một URL công khai tạm thời để nền tảng fetch media
có thể dùng `createHostedOutboundMediaStore(...)` từ
`openclaw/plugin-sdk/outbound-media` với kho trạng thái Plugin. Giữ phân tích
route nền tảng và thực thi token trong channel plugin; helper dùng chung chỉ sở hữu
việc tải media, metadata hết hạn, các hàng chunk và dọn dẹp.

Nếu channel của bạn cần định dạng riêng theo provider cho `message(action="send")`,
hãy ưu tiên `actions.prepareSendPayload(...)`. Đặt native cards, blocks, embeds
hoặc dữ liệu bền vững khác dưới `payload.channelData.<channel>` và để core thực hiện
việc gửi thực tế qua adapter outbound/message. Chỉ dùng `actions.handleAction(...)`
cho gửi như một fallback tương thích đối với payload không thể serialize và thử lại.

Nếu nền tảng của bạn lưu scope bổ sung bên trong id cuộc trò chuyện, hãy giữ việc
phân tích đó trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đó là
hook canonical để ánh xạ `rawId` tới id cuộc trò chuyện cơ sở, id luồng tùy chọn,
`baseConversationId` rõ ràng và bất kỳ `parentConversationCandidates` nào.
Khi trả về `parentConversationCandidates`, hãy giữ chúng được sắp xếp từ cha
hẹp nhất tới cuộc trò chuyện rộng nhất/cơ sở.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa các trường
giống route, so sánh một luồng con với route cha của nó, hoặc xây dựng khóa khử
trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper chuẩn hóa
id luồng dạng số giống như core, nên Plugin nên ưu tiên dùng nó thay cho các phép
so sánh tùy tiện `String(threadId)`.
Các Plugin có ngữ pháp đích riêng theo provider nên phơi bày
`messaging.resolveOutboundSessionRoute(...)` để core nhận được danh tính phiên
và luồng native theo provider mà không dùng parser shim.

Các Plugin đi kèm cần cùng cách phân tích trước khi channel registry khởi động
cũng có thể phơi bày một tệp cấp cao nhất `session-key-api.ts` với export
`resolveSessionConversation(...)` tương ứng. Core chỉ dùng bề mặt an toàn cho
bootstrap đó khi runtime plugin registry chưa khả dụng.

`messaging.resolveParentConversationCandidates(...)` vẫn có sẵn như một fallback
tương thích cũ khi Plugin chỉ cần fallback cha bên trên id chung/thô. Nếu cả hai
hook đều tồn tại, core dùng `resolveSessionConversation(...).parentConversationCandidates`
trước và chỉ fallback sang `resolveParentConversationCandidates(...)` khi hook
canonical bỏ qua chúng.

## Phê duyệt và năng lực của channel

Hầu hết channel plugin không cần mã riêng cho phê duyệt.

- Lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và phân phối dự phòng chung.
- Ưu tiên một đối tượng `approvalCapability` trên Plugin kênh khi kênh cần hành vi riêng cho phê duyệt.
- `ChannelPlugin.approvals` đã bị loại bỏ. Đặt các dữ kiện phân phối/native/render/auth của phê duyệt trên `approvalCapability`.
- `plugin.auth` chỉ dành cho đăng nhập/đăng xuất; lõi không còn đọc các hook auth phê duyệt từ đối tượng đó.
- `approvalCapability.authorizeActorAction` và `approvalCapability.getActionAvailabilityState` là điểm nối auth phê duyệt chuẩn.
- Dùng `approvalCapability.getActionAvailabilityState` cho khả năng auth phê duyệt trong cùng cuộc trò chuyện. Giữ các approver đã cấu hình khả dụng cho `/approve` ngay cả khi phân phối native bị tắt; thay vào đó dùng trạng thái bề mặt khởi tạo native cho hướng dẫn phân phối/thiết lập.
- Nếu kênh của bạn cung cấp phê duyệt exec native, dùng `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái bề mặt khởi tạo/máy khách native khi trạng thái đó khác với auth phê duyệt trong cùng cuộc trò chuyện. Lõi dùng hook riêng cho exec đó để phân biệt `enabled` với `disabled`, quyết định kênh khởi tạo có hỗ trợ phê duyệt exec native hay không, và đưa kênh vào hướng dẫn dự phòng máy khách native. `createApproverRestrictedNativeApprovalCapability(...)` điền phần này cho trường hợp phổ biến.
- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng theo kênh, chẳng hạn ẩn lời nhắc phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo đang nhập trước khi phân phối.
- Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt native hoặc chặn dự phòng.
- Dùng `approvalCapability.nativeRuntime` cho các dữ kiện phê duyệt native do kênh sở hữu. Giữ nó lazy trên các điểm vào kênh nóng bằng `createLazyChannelApprovalNativeRuntimeAdapter(...)`, cho phép import mô-đun runtime của bạn theo nhu cầu trong khi vẫn để lõi lắp ráp vòng đời phê duyệt.
- Chỉ dùng `approvalCapability.render` khi một kênh thực sự cần payload phê duyệt tùy chỉnh thay vì renderer dùng chung.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn phản hồi ở đường dẫn bị tắt giải thích chính xác các núm cấu hình cần thiết để bật phê duyệt exec native. Hook nhận `{ channel, channelLabel, accountId }`; các kênh theo tài khoản được đặt tên nên render đường dẫn theo phạm vi tài khoản như `channels.<channel>.accounts.<id>.execApprovals.*` thay vì các mặc định cấp cao nhất.
- Dùng `approvalCapability.describePluginApprovalSetup` khi hướng dẫn lỗi phê duyệt Plugin an toàn để hiển thị cho các lỗi phê duyệt Plugin không có tuyến và hết thời gian chờ. `createApproverRestrictedNativeApprovalCapability(...)` không suy ra điều này từ `describeExecApprovalSetup`; chỉ truyền cùng helper một cách tường minh khi phê duyệt Plugin và exec thực sự dùng cùng thiết lập native.
- Nếu một kênh có thể suy ra danh tính DM ổn định giống chủ sở hữu từ cấu hình hiện có, dùng `createResolvedApproverActionAuthAdapter` từ `openclaw/plugin-sdk/approval-runtime` để hạn chế `/approve` trong cùng cuộc trò chuyện mà không thêm logic lõi riêng cho phê duyệt.
- Nếu auth phê duyệt tùy chỉnh cố ý chỉ cho phép dự phòng trong cùng cuộc trò chuyện, trả về `markImplicitSameChatApprovalAuthorization({ authorized: true })` từ `openclaw/plugin-sdk/approval-auth-runtime`; nếu không, lõi xem kết quả là ủy quyền approver tường minh.
- Nếu callback native do kênh sở hữu giải quyết phê duyệt trực tiếp, dùng `isImplicitSameChatApprovalAuthorization(...)` trước khi giải quyết để dự phòng ngầm định vẫn đi qua auth actor thông thường của kênh.
- Nếu một kênh cần phân phối phê duyệt native, giữ mã kênh tập trung vào chuẩn hóa đích cùng các dữ kiện transport/presentation. Dùng `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, và `createApproverRestrictedNativeApprovalCapability` từ `openclaw/plugin-sdk/approval-runtime`. Đặt các dữ kiện riêng theo kênh phía sau `approvalCapability.nativeRuntime`, lý tưởng là qua `createChannelApprovalNativeRuntimeAdapter(...)` hoặc `createLazyChannelApprovalNativeRuntimeAdapter(...)`, để lõi có thể lắp ráp handler và sở hữu việc lọc yêu cầu, định tuyến, khử trùng lặp, hết hạn, đăng ký Gateway, và thông báo đã định tuyến nơi khác. `nativeRuntime` được tách thành vài điểm nối nhỏ hơn:
- Dùng `createNativeApprovalChannelRouteGates` từ `openclaw/plugin-sdk/approval-native-runtime` khi một kênh hỗ trợ cả phân phối native từ nguồn phiên và các đích chuyển tiếp phê duyệt tường minh. Helper này tập trung hóa lựa chọn cấu hình phê duyệt, xử lý `mode`, bộ lọc agent/phiên, ràng buộc tài khoản, khớp đích phiên, và khớp danh sách đích, trong khi caller vẫn sở hữu id kênh, chế độ chuyển tiếp mặc định, tra cứu tài khoản, kiểm tra transport đã bật, chuẩn hóa đích, và giải quyết đích nguồn lượt. Không dùng nó để tạo mặc định chính sách kênh do lõi sở hữu; hãy truyền tường minh chế độ mặc định đã được tài liệu hóa của kênh.
- `createChannelNativeOriginTargetResolver` mặc định dùng trình khớp tuyến kênh dùng chung cho các đích `{ to, accountId, threadId }`. Chỉ truyền `targetsMatch` khi một kênh có quy tắc tương đương riêng theo provider, chẳng hạn khớp tiền tố timestamp của Slack.
- Truyền `normalizeTargetForMatch` vào `createChannelNativeOriginTargetResolver` khi kênh cần chuẩn hóa id provider trước khi trình khớp tuyến mặc định hoặc callback `targetsMatch` tùy chỉnh chạy, trong khi vẫn giữ đích gốc để phân phối. Chỉ dùng `normalizeTarget` khi chính đích phân phối đã giải quyết cần được chuẩn hóa.
- `availability` - tài khoản có được cấu hình hay không và một yêu cầu có nên được xử lý hay không
- `presentation` - ánh xạ view model phê duyệt dùng chung thành payload native đang chờ/đã giải quyết/đã hết hạn hoặc hành động cuối
- `transport` - chuẩn bị đích và gửi/cập nhật/xóa tin nhắn phê duyệt native
- `interactions` - các hook tùy chọn bind/unbind/clear-action cho nút hoặc reaction native, cộng với hook `cancelDelivered` tùy chọn. Triển khai `cancelDelivered` khi `deliverPending` đăng ký trạng thái trong tiến trình hoặc bền vững (chẳng hạn kho đích reaction) để trạng thái đó có thể được giải phóng nếu việc dừng handler hủy phân phối trước khi `bindPending` chạy hoặc khi `bindPending` không trả về handle
- `observe` - các hook chẩn đoán phân phối tùy chọn
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, ứng dụng Bolt, hoặc bộ nhận Webhook, đăng ký chúng qua `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context chung cho phép lõi bootstrap các handler dựa trên capability từ trạng thái khởi động kênh mà không thêm keo wrapper riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc `createChannelNativeApprovalRuntime` cấp thấp hơn khi điểm nối dựa trên capability chưa đủ biểu đạt.
- Các kênh phê duyệt native phải định tuyến cả `accountId` và `approvalKind` qua các helper đó. `accountId` giữ chính sách phê duyệt đa tài khoản trong phạm vi đúng tài khoản bot, và `approvalKind` giữ hành vi phê duyệt exec so với Plugin khả dụng cho kênh mà không cần các nhánh hardcoded trong lõi.
- Lõi hiện cũng sở hữu thông báo định tuyến lại phê duyệt. Plugin kênh không nên tự gửi tin nhắn theo sau kiểu "phê duyệt đã chuyển đến DM / kênh khác" từ `createChannelNativeApprovalRuntime`; thay vào đó, hãy phơi bày định tuyến nguồn + DM approver chính xác qua các helper capability phê duyệt dùng chung và để lõi tổng hợp các lần phân phối thực tế trước khi đăng bất kỳ thông báo nào trở lại cuộc trò chuyện khởi tạo.
- Giữ nguyên loại id phê duyệt đã phân phối từ đầu đến cuối. Máy khách native không nên
  đoán hoặc viết lại định tuyến phê duyệt exec so với Plugin từ trạng thái cục bộ của kênh.
- Các loại phê duyệt khác nhau có thể cố ý phơi bày các bề mặt native khác nhau.
  Các ví dụ bundled hiện tại:
  - Slack giữ định tuyến phê duyệt native khả dụng cho cả id exec và Plugin.
  - Matrix giữ cùng định tuyến DM/kênh native và UX reaction cho phê duyệt exec
    và Plugin, trong khi vẫn cho phép auth khác nhau theo loại phê duyệt.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại như một wrapper tương thích, nhưng mã mới nên ưu tiên builder capability và phơi bày `approvalCapability` trên Plugin.

Đối với các điểm vào kênh nóng, ưu tiên các đường dẫn con runtime hẹp hơn khi bạn chỉ
cần một phần của nhóm đó:

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
`openclaw/plugin-sdk/reply-chunking` khi bạn không cần bề mặt bao trùm rộng hơn.

Riêng cho thiết lập:

- `openclaw/plugin-sdk/setup-runtime` bao phủ các helper thiết lập an toàn cho runtime:
  `createSetupTranslator`, các adapter vá thiết lập an toàn khi import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và các builder
  setup-proxy được ủy quyền
- `openclaw/plugin-sdk/setup-runtime` bao gồm điểm nối adapter có nhận biết env cho
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` bao phủ các builder thiết lập cài đặt tùy chọn
  cùng vài primitive an toàn cho thiết lập:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Nếu kênh của bạn hỗ trợ thiết lập hoặc auth dựa trên env và các luồng khởi động/cấu hình
chung cần biết các tên env đó trước khi runtime tải, khai báo chúng trong
manifest Plugin với `channelEnvVars`. Chỉ giữ `envVars` runtime kênh hoặc
hằng cục bộ cho nội dung hướng đến operator.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc
quét SecretRef trước khi runtime Plugin khởi động, thêm `openclaw.setupEntry` trong
`package.json`. Điểm vào đó nên an toàn để import trong các đường dẫn lệnh
chỉ đọc và nên trả về metadata kênh, adapter cấu hình an toàn cho thiết lập, adapter trạng thái,
và metadata đích secret kênh cần thiết cho các bản tóm tắt đó. Không
khởi động client, listener, hoặc runtime transport từ setup entry.

Cũng giữ đường dẫn import điểm vào kênh chính thật hẹp. Discovery có thể đánh giá
entry và mô-đun Plugin kênh để đăng ký capability mà không kích hoạt
kênh. Các tệp như `channel-plugin-api.ts` nên export đối tượng Plugin kênh
mà không import wizard thiết lập, client transport, listener socket,
trình khởi chạy subprocess, hoặc mô-đun khởi động dịch vụ. Đặt các phần runtime
đó trong các mô-đun được tải từ `registerFull(...)`, setter runtime, hoặc adapter
capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, và
`splitSetupEntries`

- chỉ dùng điểm nối `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần các
  helper thiết lập/cấu hình dùng chung nặng hơn như
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Nếu kênh của bạn chỉ muốn quảng bá "cài Plugin này trước" trong các bề mặt
thiết lập, ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/wizard
được tạo sẽ fail closed khi ghi cấu hình và hoàn tất, đồng thời tái sử dụng
cùng thông báo yêu cầu cài đặt trên bản sao validation, finalize, và docs-link.

Đối với các đường dẫn kênh nóng khác, ưu tiên các helper hẹp thay vì các
bề mặt legacy rộng hơn:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và
  phương án dự phòng tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/channel-inbound` cho route/envelope đầu vào và
  nối dây ghi-nhận-và-phân-phát
- `openclaw/plugin-sdk/channel-targets` cho các helper phân tích cú pháp mục tiêu
- `openclaw/plugin-sdk/outbound-media` cho việc tải media và
  `openclaw/plugin-sdk/channel-outbound` cho các delegate định danh/gửi đầu ra
  và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một route đầu ra cần giữ nguyên một
  `replyToId`/`threadId` rõ ràng hoặc khôi phục phiên `:thread:` hiện tại
  sau khi khóa phiên cơ sở vẫn khớp. Plugin nhà cung cấp có thể ghi đè
  thứ tự ưu tiên, hành vi hậu tố và chuẩn hóa id luồng khi nền tảng của chúng
  có ngữ nghĩa gửi theo luồng gốc.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời thread-binding
  và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi bố cục trường payload
  tác tử/media cũ vẫn còn bắt buộc
- `openclaw/plugin-sdk/telegram-command-config` cho việc chuẩn hóa lệnh tùy chỉnh
  Telegram, xác thực trùng lặp/xung đột, và hợp đồng cấu hình lệnh ổn định khi dự phòng

Các kênh chỉ dùng xác thực thường có thể dừng ở đường dẫn mặc định: core xử lý phê duyệt và Plugin chỉ cần cung cấp các capability đầu ra/xác thực. Các kênh phê duyệt gốc như Matrix, Slack, Telegram và các transport chat tùy chỉnh nên dùng helper gốc dùng chung thay vì tự triển khai vòng đời phê duyệt.

## Chính sách nhắc đến đầu vào

Giữ việc xử lý nhắc đến đầu vào tách thành hai lớp:

- thu thập bằng chứng do Plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách nhắc đến.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel helper đầu vào
rộng hơn.

Phù hợp cho logic cục bộ của Plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra tham gia luồng
- loại trừ tin nhắn dịch vụ/hệ thống
- cache gốc của nền tảng cần thiết để chứng minh bot đã tham gia

Phù hợp cho helper dùng chung:

- `requireMention`
- kết quả nhắc đến rõ ràng
- danh sách cho phép nhắc đến ngầm định
- bỏ qua bằng lệnh
- quyết định bỏ qua cuối cùng

Luồng ưu tiên:

1. Tính các dữ kiện nhắc đến cục bộ.
2. Truyền các dữ kiện đó vào `resolveInboundMentionDecision({ facts, policy })`.
3. Dùng `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, và `decision.shouldSkip` trong cổng đầu vào của bạn.

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
Plugin kênh được đóng gói đã phụ thuộc vào runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Nếu bạn chỉ cần `implicitMentionKindWhen` và
`resolveInboundMentionDecision`, hãy import từ
`openclaw/plugin-sdk/channel-mention-gating` để tránh tải các helper runtime
đầu vào không liên quan.

Dùng `resolveInboundMentionDecision({ facts, policy })` cho cổng nhắc đến.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Tạo các tệp Plugin tiêu chuẩn. Trường `channel` trong `package.json` là
    thứ khiến đây trở thành Plugin kênh. Để xem toàn bộ bề mặt siêu dữ liệu gói,
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

    `configSchema` xác thực `plugins.entries.acme-chat.config`. Dùng nó cho
    các thiết lập do Plugin sở hữu không phải là cấu hình tài khoản kênh. `channelConfigs`
    xác thực `channels.acme-chat` và là nguồn đường dẫn lạnh được cấu hình
    schema, thiết lập và các bề mặt UI dùng trước khi runtime Plugin tải.

  </Step>

  <Step title="Build the channel plugin object">
    Interface `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Bắt đầu với
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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn và khóa lồng cũ, hãy dùng các helper từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, và `normalizeChannelDmPolicy` giữ các giá trị cục bộ của tài khoản đứng trước các giá trị root kế thừa. Ghép cùng resolver đó với sửa chữa doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một hợp đồng.

    <Accordion title="What createChatChannelPlugin does for you">
      Thay vì tự triển khai các interface adapter cấp thấp, bạn truyền
      các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Nó nối dây gì |
      | --- | --- |
      | `security.dm` | Resolver bảo mật DM theo phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép cặp DM dựa trên văn bản với trao đổi mã |
      | `threading` | Resolver chế độ trả lời đến (cố định, theo phạm vi tài khoản, hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (ID tin nhắn) |

      Bạn cũng có thể truyền các đối tượng adapter thô thay vì các tùy chọn
      khai báo nếu cần toàn quyền kiểm soát.

      Adapter đầu ra thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm gửi
      như `maxLinesPerMessage`; áp dụng nó trước khi gửi để threading trả lời
      và ranh giới chunk được phân giải một lần bởi cơ chế gửi đầu ra dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi một mục tiêu trả lời gốc đã được phân giải, để các helper payload có thể giữ nguyên
      thẻ trả lời rõ ràng mà không tiêu thụ một slot trả lời ngầm định dùng một lần.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    Đặt các bộ mô tả CLI do kênh sở hữu trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong trợ giúp gốc mà không kích hoạt toàn bộ runtime
    của kênh, trong khi các lần tải đầy đủ thông thường vẫn lấy cùng các bộ mô tả
    đó để đăng ký lệnh thực tế. Giữ `registerFull(...)` cho công việc chỉ dành cho runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy dùng tiền tố
    dành riêng cho Plugin. Các namespace quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được giữ riêng và luôn
    phân giải thành `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý việc tách chế độ đăng ký. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Add a setup entry">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải tệp này thay vì điểm vào đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Điều này tránh kéo vào mã runtime nặng trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace được đóng gói tách các export an toàn cho thiết lập vào các mô-đun
    sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    bộ đặt runtime rõ ràng tại thời điểm thiết lập.

  </Step>

  <Step title="Handle inbound messages">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
    điều phối nó qua trình xử lý inbound của kênh:

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
      Việc xử lý tin nhắn inbound là riêng theo từng kênh. Mỗi Plugin kênh sở hữu
      pipeline inbound của riêng mình. Hãy xem các Plugin kênh được đóng gói
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để thấy các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Viết các bài kiểm thử đặt cùng vị trí trong `src/channel.test.ts`:

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

    Để dùng các helper kiểm thử dùng chung, xem [Kiểm thử](/vi/plugins/sdk-testing).

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
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, media, subagent qua api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/vi/plugins/sdk-channel-inbound">
    Vòng đời sự kiện inbound dùng chung: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Một số seam helper được đóng gói vẫn tồn tại để bảo trì và tương thích
với bundled-plugin. Chúng không phải là mẫu được khuyến nghị cho các Plugin kênh mới;
hãy ưu tiên các subpath channel/setup/reply/runtime chung từ bề mặt SDK
phổ dụng, trừ khi bạn đang trực tiếp bảo trì họ Plugin được đóng gói đó.
</Note>

## Các bước tiếp theo

- [Provider Plugins](/vi/plugins/sdk-provider-plugins) - nếu Plugin của bạn cũng cung cấp mô hình
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu đầy đủ về import subpath
- [Kiểm thử SDK](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) - schema manifest đầy đủ

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin harness agent](/vi/plugins/sdk-agent-harness)
