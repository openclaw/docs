---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu giao diện bộ điều hợp ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng một Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng các Plugin kênh
x-i18n:
    generated_at: "2026-05-06T09:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin kênh kết nối OpenClaw với một
nền tảng nhắn tin. Khi hoàn tất, bạn sẽ có một kênh hoạt động với bảo mật DM,
ghép nối, phân luồng trả lời và nhắn tin gửi đi.

<Info>
  Nếu trước đây bạn chưa từng xây dựng Plugin OpenClaw nào, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

## Cách Plugin kênh hoạt động

Các Plugin kênh không cần công cụ gửi/chỉnh sửa/phản ứng riêng. OpenClaw giữ một
công cụ `message` dùng chung trong lõi. Plugin của bạn sở hữu:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách DM và danh sách cho phép
- **Ghép nối** - luồng phê duyệt DM
- **Ngữ pháp phiên** - cách các id cuộc trò chuyện riêng của nhà cung cấp ánh xạ tới cuộc trò chuyện cơ sở, id luồng và các phương án dự phòng cha
- **Gửi đi** - gửi văn bản, phương tiện và cuộc thăm dò tới nền tảng
- **Phân luồng** - cách các câu trả lời được phân luồng
- **Trạng thái nhập Heartbeat** - tín hiệu đang nhập/bận tùy chọn cho các đích gửi Heartbeat

Lõi sở hữu công cụ tin nhắn dùng chung, nối dây prompt, hình dạng khóa phiên bên ngoài,
sổ sách `:thread:` chung và điều phối.

Các Plugin kênh mới cũng nên cung cấp một bộ chuyển đổi `message` bằng
`defineChannelMessageAdapter` từ `openclaw/plugin-sdk/channel-message`. Bộ
chuyển đổi khai báo những năng lực gửi cuối cùng bền vững mà transport gốc
thực sự hỗ trợ và trỏ các lượt gửi văn bản/phương tiện tới cùng các hàm transport như
bộ chuyển đổi `outbound` cũ. Chỉ khai báo một năng lực khi một kiểm thử hợp đồng
chứng minh tác dụng phụ gốc và biên nhận được trả về.
Để xem đầy đủ hợp đồng API, ví dụ, ma trận năng lực, quy tắc biên nhận, hoàn tất
bản xem trước trực tiếp, chính sách xác nhận nhận, kiểm thử và bảng di chuyển, hãy xem
[API tin nhắn kênh](/vi/plugins/sdk-channel-message).
Nếu bộ chuyển đổi `outbound` hiện có đã có đúng các phương thức gửi và
siêu dữ liệu năng lực, hãy dùng `createChannelMessageAdapterFromOutbound(...)` để
suy ra bộ chuyển đổi `message` thay vì tự viết một cầu nối khác.
Các lượt gửi của bộ chuyển đổi nên trả về giá trị `MessageReceipt`. Khi mã tương thích
vẫn cần các id cũ, hãy suy ra chúng bằng `listMessageReceiptPlatformIds(...)`
hoặc `resolveMessageReceiptPrimaryId(...)` thay vì giữ các trường
`messageIds` song song trong mã vòng đời mới.
Các kênh có khả năng xem trước cũng nên khai báo `message.live.capabilities` với
vòng đời trực tiếp chính xác mà chúng sở hữu, chẳng hạn như `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` hoặc
`quietFinalization`. Các kênh hoàn tất bản xem trước nháp tại chỗ cũng nên
khai báo `message.live.finalizer.capabilities`, chẳng hạn như `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` và
`retainOnAmbiguousFailure`, đồng thời định tuyến logic runtime qua
`defineFinalizableLivePreviewAdapter(...)` cùng
`deliverWithFinalizableLivePreviewAdapter(...)`. Giữ các năng lực đó được chống lưng
bằng các kiểm thử `verifyChannelMessageLiveCapabilityAdapterProofs(...)` và
`verifyChannelMessageLiveFinalizerProofs(...)` để hành vi xem trước gốc,
tiến trình, chỉnh sửa, dự phòng/giữ lại, dọn dẹp và biên nhận không thể âm thầm lệch đi.
Các bộ nhận đầu vào trì hoãn xác nhận của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì ẩn
thời điểm xác nhận trong trạng thái cục bộ của trình giám sát. Bao phủ mọi chính sách
đã khai báo bằng `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các helper trả lời/lượt cũ như `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` và `recordInboundSessionAndDispatchReply`
vẫn còn dùng được cho các bộ điều phối tương thích. Đừng dùng các tên đó cho mã
kênh mới; các Plugin mới nên bắt đầu với bộ chuyển đổi `message`, biên nhận và
các helper vòng đời nhận/gửi trên `openclaw/plugin-sdk/channel-message`.

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập bên ngoài các câu trả lời đầu vào, hãy cung cấp
`heartbeat.sendTyping(...)` trên Plugin kênh. Lõi gọi nó với
đích gửi Heartbeat đã phân giải trước khi lượt chạy mô hình Heartbeat bắt đầu và
dùng vòng đời duy trì/dọn dẹp trạng thái đang nhập dùng chung. Thêm `heartbeat.clearTyping(...)`
khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu kênh của bạn thêm tham số công cụ tin nhắn mang nguồn phương tiện, hãy cung cấp các
tên tham số đó qua `describeMessageTool(...).mediaSourceParams`. Lõi dùng
danh sách rõ ràng đó để chuẩn hóa đường dẫn sandbox và chính sách truy cập phương tiện gửi đi,
nên Plugin không cần các trường hợp đặc biệt trong lõi dùng chung cho tham số avatar,
tệp đính kèm hoặc ảnh bìa riêng của nhà cung cấp.
Ưu tiên trả về một ánh xạ theo khóa hành động như
`{ "set-profile": ["avatarUrl", "avatarPath"] }` để các hành động không liên quan
không thừa hưởng đối số phương tiện của hành động khác. Một mảng phẳng vẫn hoạt động cho
các tham số được chủ ý dùng chung trên mọi hành động được cung cấp.

Nếu kênh của bạn cần định hình riêng theo nhà cung cấp cho `message(action="send")`,
hãy ưu tiên `actions.prepareSendPayload(...)`. Đặt thẻ gốc, khối, embed hoặc
dữ liệu bền vững khác dưới `payload.channelData.<channel>` và để lõi thực hiện
lượt gửi thực tế qua bộ chuyển đổi outbound/message. Chỉ dùng
`actions.handleAction(...)` cho gửi như một phương án tương thích dự phòng đối với
payload không thể tuần tự hóa và thử lại.

Nếu nền tảng của bạn lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ phần phân tích cú pháp đó
trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đó là hook
chuẩn tắc để ánh xạ `rawId` tới id cuộc trò chuyện cơ sở, id luồng tùy chọn,
`baseConversationId` rõ ràng và mọi `parentConversationCandidates`.
Khi bạn trả về `parentConversationCandidates`, hãy giữ chúng được sắp xếp từ cha
hẹp nhất đến cuộc trò chuyện rộng nhất/cơ sở.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh một luồng con với tuyến cha của nó, hoặc xây dựng
khóa khử trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper
chuẩn hóa các id luồng dạng số giống như lõi, nên Plugin nên ưu tiên nó
thay vì các phép so sánh tùy biến `String(threadId)`.
Plugin có ngữ pháp đích riêng theo nhà cung cấp có thể chèn trình phân tích cú pháp của mình vào
`resolveChannelRouteTargetWithParser(...)` và vẫn nhận được cùng hình dạng đích tuyến
cùng ngữ nghĩa dự phòng luồng mà lõi dùng.

Các Plugin đi kèm cần cùng phần phân tích cú pháp trước khi registry kênh khởi động
cũng có thể cung cấp tệp cấp cao nhất `session-key-api.ts` với export
`resolveSessionConversation(...)` tương ứng. Lõi chỉ dùng bề mặt an toàn cho khởi động đó
khi registry Plugin runtime chưa sẵn sàng.

`messaging.resolveParentConversationCandidates(...)` vẫn có sẵn như một
phương án tương thích cũ khi Plugin chỉ cần các phương án dự phòng cha đặt trên
id chung/thô. Nếu cả hai hook đều tồn tại, lõi dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
rơi về `resolveParentConversationCandidates(...)` khi hook chuẩn tắc
bỏ qua chúng.

## Phê duyệt và năng lực kênh

Hầu hết các Plugin kênh không cần mã riêng cho phê duyệt.

- Lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung, và cơ chế phân phối dự phòng chung.
- Ưu tiên một đối tượng `approvalCapability` trên plugin kênh khi kênh cần hành vi riêng cho phê duyệt.
- `ChannelPlugin.approvals` đã bị loại bỏ. Đặt các thông tin về phân phối/native/render/auth phê duyệt trên `approvalCapability`.
- `plugin.auth` chỉ dành cho đăng nhập/đăng xuất; lõi không còn đọc các hook auth phê duyệt từ đối tượng đó.
- `approvalCapability.authorizeActorAction` và `approvalCapability.getActionAvailabilityState` là điểm nối auth phê duyệt chuẩn.
- Dùng `approvalCapability.getActionAvailabilityState` cho tính khả dụng auth phê duyệt trong cùng cuộc trò chuyện.
- Nếu kênh của bạn cung cấp phê duyệt exec native, hãy dùng `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái bề mặt khởi tạo/native-client khi trạng thái đó khác với auth phê duyệt trong cùng cuộc trò chuyện. Lõi dùng hook riêng cho exec đó để phân biệt `enabled` với `disabled`, quyết định kênh khởi tạo có hỗ trợ phê duyệt exec native hay không, và đưa kênh vào hướng dẫn dự phòng native-client. `createApproverRestrictedNativeApprovalCapability(...)` điền phần này cho trường hợp phổ biến.
- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng theo kênh, chẳng hạn như ẩn các lời nhắc phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo đang nhập trước khi phân phối.
- Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt native hoặc chặn dự phòng.
- Dùng `approvalCapability.nativeRuntime` cho các thông tin phê duyệt native do kênh sở hữu. Giữ nó lazy trên các entrypoint kênh nóng bằng `createLazyChannelApprovalNativeRuntimeAdapter(...)`, công cụ này có thể nhập module runtime của bạn theo nhu cầu trong khi vẫn cho phép lõi lắp ráp vòng đời phê duyệt.
- Chỉ dùng `approvalCapability.render` khi một kênh thực sự cần payload phê duyệt tùy chỉnh thay vì trình render dùng chung.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn phản hồi trên đường dẫn bị vô hiệu hóa giải thích chính xác các núm cấu hình cần thiết để bật phê duyệt exec native. Hook nhận `{ channel, channelLabel, accountId }`; các kênh có tài khoản được đặt tên nên render các đường dẫn theo phạm vi tài khoản như `channels.<channel>.accounts.<id>.execApprovals.*` thay vì các mặc định cấp cao nhất.
- Nếu một kênh có thể suy ra các danh tính DM giống chủ sở hữu ổn định từ cấu hình hiện có, hãy dùng `createResolvedApproverActionAuthAdapter` từ `openclaw/plugin-sdk/approval-runtime` để hạn chế `/approve` trong cùng cuộc trò chuyện mà không thêm logic lõi riêng cho phê duyệt.
- Nếu một kênh cần phân phối phê duyệt native, hãy giữ mã kênh tập trung vào chuẩn hóa đích cùng các thông tin về transport/presentation. Dùng `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, và `createApproverRestrictedNativeApprovalCapability` từ `openclaw/plugin-sdk/approval-runtime`. Đặt các thông tin riêng của kênh phía sau `approvalCapability.nativeRuntime`, lý tưởng là thông qua `createChannelApprovalNativeRuntimeAdapter(...)` hoặc `createLazyChannelApprovalNativeRuntimeAdapter(...)`, để lõi có thể lắp ráp handler và sở hữu lọc yêu cầu, định tuyến, chống trùng lặp, hết hạn, đăng ký Gateway, và thông báo đã định tuyến sang nơi khác. `nativeRuntime` được chia thành một vài điểm nối nhỏ hơn:
- `createChannelNativeOriginTargetResolver` mặc định dùng bộ so khớp route kênh dùng chung cho các đích `{ to, accountId, threadId }`. Chỉ truyền `targetsMatch` khi một kênh có các quy tắc tương đương riêng theo provider, chẳng hạn như so khớp tiền tố timestamp của Slack.
- Truyền `normalizeTargetForMatch` vào `createChannelNativeOriginTargetResolver` khi kênh cần chuẩn hóa id provider trước khi bộ so khớp route mặc định hoặc callback `targetsMatch` tùy chỉnh chạy, trong khi vẫn giữ nguyên đích gốc để phân phối. Chỉ dùng `normalizeTarget` khi chính đích phân phối đã phân giải cần được chuẩn hóa.
- `availability` - tài khoản đã được cấu hình hay chưa và một yêu cầu có nên được xử lý hay không
- `presentation` - ánh xạ view model phê duyệt dùng chung thành payload native đang chờ/đã giải quyết/đã hết hạn hoặc các hành động cuối
- `transport` - chuẩn bị đích cùng gửi/cập nhật/xóa tin nhắn phê duyệt native
- `interactions` - các hook bind/unbind/clear-action tùy chọn cho nút hoặc reaction native
- `observe` - các hook chẩn đoán phân phối tùy chọn
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, Bolt app, hoặc webhook receiver, hãy đăng ký chúng thông qua `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context chung cho phép lõi khởi động các handler dựa trên capability từ trạng thái khởi động kênh mà không cần thêm lớp keo wrapper riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc `createChannelNativeApprovalRuntime` cấp thấp hơn khi điểm nối dựa trên capability vẫn chưa đủ biểu đạt.
- Các kênh phê duyệt native phải định tuyến cả `accountId` và `approvalKind` qua các helper đó. `accountId` giữ chính sách phê duyệt đa tài khoản trong phạm vi đúng tài khoản bot, còn `approvalKind` giữ cho hành vi phê duyệt exec so với plugin khả dụng cho kênh mà không cần các nhánh hardcode trong lõi.
- Lõi giờ cũng sở hữu các thông báo định tuyến lại phê duyệt. Plugin kênh không nên gửi thông báo tiếp nối kiểu "phê duyệt đã chuyển tới DM / kênh khác" của riêng chúng từ `createChannelNativeApprovalRuntime`; thay vào đó, hãy phơi bày định tuyến origin + approver-DM chính xác qua các helper capability phê duyệt dùng chung và để lõi tổng hợp các lần phân phối thực tế trước khi đăng bất kỳ thông báo nào trở lại cuộc trò chuyện khởi tạo.
- Giữ nguyên loại id phê duyệt đã phân phối từ đầu đến cuối. Native client không nên
  đoán hoặc viết lại định tuyến phê duyệt exec so với plugin từ trạng thái cục bộ của kênh.
- Các loại phê duyệt khác nhau có thể cố ý phơi bày các bề mặt native khác nhau.
  Các ví dụ được đóng gói hiện tại:
  - Slack giữ định tuyến phê duyệt native khả dụng cho cả id exec và plugin.
  - Matrix giữ cùng định tuyến DM/kênh native và UX reaction cho phê duyệt exec
    và plugin, trong khi vẫn cho phép auth khác nhau theo loại phê duyệt.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại như một wrapper tương thích, nhưng mã mới nên ưu tiên capability builder và phơi bày `approvalCapability` trên plugin.

Đối với các entrypoint kênh nóng, hãy ưu tiên các đường dẫn con runtime hẹp hơn khi bạn chỉ
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

Tương tự, hãy ưu tiên `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, và
`openclaw/plugin-sdk/reply-chunking` khi bạn không cần bề mặt bao quát rộng hơn.

Riêng với thiết lập:

- `openclaw/plugin-sdk/setup-runtime` bao gồm các helper thiết lập an toàn cho runtime:
  adapter vá thiết lập an toàn khi import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries`, và các builder
  setup-proxy được ủy quyền
- `openclaw/plugin-sdk/setup-adapter-runtime` là điểm nối adapter hẹp có nhận biết env
  cho `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` bao gồm các builder thiết lập optional-install
  cùng một vài primitive an toàn cho thiết lập:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Nếu kênh của bạn hỗ trợ thiết lập hoặc auth dựa trên env và các luồng khởi động/cấu hình
chung cần biết các tên env đó trước khi runtime tải, hãy khai báo chúng trong
manifest plugin bằng `channelEnvVars`. Chỉ giữ `envVars` runtime kênh hoặc hằng số cục bộ
cho phần nội dung hướng tới operator.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc
quét SecretRef trước khi runtime plugin khởi động, hãy thêm `openclaw.setupEntry` trong
`package.json`. Entrypoint đó phải an toàn để import trong các đường dẫn lệnh chỉ đọc
và phải trả về metadata kênh, adapter cấu hình an toàn cho thiết lập, adapter trạng thái,
và metadata đích secret của kênh cần thiết cho các bản tóm tắt đó. Không
khởi động client, listener, hoặc runtime transport từ entry thiết lập.

Giữ cả đường dẫn import entry kênh chính ở phạm vi hẹp. Discovery có thể đánh giá
entry và module plugin kênh để đăng ký capability mà không kích hoạt
kênh. Các file như `channel-plugin-api.ts` nên xuất đối tượng plugin kênh
mà không import wizard thiết lập, client transport, listener socket,
subprocess launcher, hoặc module khởi động service. Đặt các phần runtime đó
trong các module được tải từ `registerFull(...)`, runtime setter, hoặc adapter
capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, và
`splitSetupEntries`

- chỉ dùng điểm nối `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần các
  helper thiết lập/cấu hình dùng chung nặng hơn như
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Nếu kênh của bạn chỉ muốn quảng bá "hãy cài plugin này trước" trong các bề mặt
thiết lập, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/wizard
được tạo sẽ đóng an toàn khi ghi cấu hình và hoàn tất, đồng thời tái sử dụng
cùng thông báo yêu cầu cài đặt trên bản sao validation, finalize, và docs-link.

Đối với các đường dẫn kênh nóng khác, hãy ưu tiên helper hẹp hơn thay vì các
bề mặt legacy rộng hơn:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình đa tài khoản và
  dự phòng tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/inbound-reply-dispatch` cho route/envelope inbound và
  nối dây ghi-nhận-và-dispatch
- `openclaw/plugin-sdk/messaging-targets` cho phân tích/so khớp đích
- `openclaw/plugin-sdk/outbound-media` và
  `openclaw/plugin-sdk/outbound-runtime` cho tải media cùng các delegate
  identity/send outbound và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một route outbound cần giữ nguyên
  `replyToId`/`threadId` tường minh hoặc khôi phục phiên `:thread:` hiện tại
  sau khi khóa phiên cơ sở vẫn khớp. Plugin provider có thể ghi đè
  thứ tự ưu tiên, hành vi hậu tố, và chuẩn hóa thread id khi nền tảng của chúng
  có ngữ nghĩa phân phối luồng native.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời thread-binding
  và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi vẫn cần bố cục trường
  payload agent/media legacy
- `openclaw/plugin-sdk/telegram-command-config` cho chuẩn hóa lệnh tùy chỉnh
  Telegram, validation trùng lặp/xung đột, và hợp đồng cấu hình lệnh ổn định
  khi dự phòng

Các kênh chỉ auth thường có thể dừng ở đường dẫn mặc định: lõi xử lý phê duyệt và plugin chỉ phơi bày capability outbound/auth. Các kênh phê duyệt native như Matrix, Slack, Telegram, và transport trò chuyện tùy chỉnh nên dùng các helper native dùng chung thay vì tự xây vòng đời phê duyệt.

## Chính sách nhắc đến inbound

Giữ xử lý nhắc đến inbound tách thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách nhắc đến.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel helper inbound
rộng hơn.

Phù hợp với logic cục bộ của plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra tham gia luồng
- loại trừ tin nhắn service/system
- các cache native theo nền tảng cần thiết để chứng minh bot tham gia

Phù hợp với helper dùng chung:

- `requireMention`
- kết quả đề cập tường minh
- danh sách cho phép đề cập ngầm định
- bỏ qua lệnh
- quyết định bỏ qua cuối cùng

Luồng ưu tiên:

1. Tính toán các dữ kiện đề cập cục bộ.
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

`api.runtime.channel.mentions` cung cấp cùng các helper đề cập dùng chung cho
các Plugin kênh được đóng gói vốn đã phụ thuộc vào cơ chế tiêm runtime:

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
    thứ biến đây thành một Plugin kênh. Để xem toàn bộ bề mặt siêu dữ liệu gói,
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
    các thiết lập thuộc sở hữu Plugin không phải là cấu hình tài khoản kênh. `channelConfigs`
    xác thực `channels.acme-chat` và là nguồn cold-path được lược đồ cấu hình,
    thiết lập và các bề mặt UI sử dụng trước khi runtime Plugin được tải.

  </Step>

  <Step title="Xây dựng đối tượng Plugin kênh">
    Interface `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Hãy bắt đầu với
    phần tối thiểu - `id` và `setup` - rồi thêm adapter khi bạn cần.

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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn hóa lẫn khóa lồng nhau cũ, hãy dùng các helper từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` và `normalizeChannelDmPolicy` giữ các giá trị cục bộ theo tài khoản đứng trước các giá trị gốc được kế thừa. Ghép cùng resolver đó với sửa chữa doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin làm gì cho bạn">
      Thay vì tự triển khai các interface adapter cấp thấp, bạn truyền vào
      các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Nó nối dây gì |
      | --- | --- |
      | `security.dm` | Resolver bảo mật DM theo phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép đôi DM dựa trên văn bản với trao đổi mã |
      | `threading` | Resolver chế độ trả lời tới (cố định, theo phạm vi tài khoản hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (ID tin nhắn) |

      Bạn cũng có thể truyền trực tiếp các đối tượng adapter thô thay cho các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Adapter outbound thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm gửi
      như `maxLinesPerMessage`; áp dụng nó trước khi gửi để liên kết chuỗi trả lời
      và ranh giới đoạn được outbound delivery dùng chung phân giải một lần.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi một mục tiêu trả lời gốc đã được phân giải, để các helper payload có thể giữ nguyên
      thẻ trả lời tường minh mà không tiêu thụ một slot trả lời ngầm định dùng một lần.
    </Accordion>

  </Step>

  <Step title="Nối dây điểm vào">
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

    Đặt các descriptor CLI thuộc sở hữu kênh trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong trợ giúp gốc mà không kích hoạt toàn bộ runtime kênh,
    trong khi các lần tải đầy đủ thông thường vẫn nhận cùng các descriptor đó để đăng ký lệnh
    thực sự. Giữ `registerFull(...)` cho công việc chỉ dành cho runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC Gateway, hãy dùng một
    tiền tố dành riêng cho Plugin. Các namespace quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải thành `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý việc tách chế độ đăng ký. Xem
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

    OpenClaw tải tệp này thay cho điểm vào đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Nó tránh kéo mã runtime nặng vào trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace được đóng gói tách các export an toàn cho thiết lập vào
    module sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    setter runtime tường minh tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn inbound">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng tới
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
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
      pipeline tin nhắn đến riêng của nó. Hãy xem các Plugin kênh được đóng gói kèm
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để biết các mẫu triển khai thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Kiểm thử">
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

    Để biết các helper kiểm thử dùng chung, xem [Kiểm thử](/vi/plugins/sdk-testing).

</Step>
</Steps>

## Cấu trúc tệp

```
<bundled-plugin-root>/acme-chat/
├── package.json              # siêu dữ liệu openclaw.channel
├── openclaw.plugin.json      # Manifest với schema cấu hình
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Các export công khai (tùy chọn)
├── runtime-api.ts            # Các export runtime nội bộ (tùy chọn)
└── src/
    ├── channel.ts            # ChannelPlugin qua createChatChannelPlugin
    ├── channel.test.ts       # Kiểm thử
    ├── client.ts             # Client API nền tảng
    └── runtime.ts            # Kho runtime (nếu cần)
```

## Chủ đề nâng cao

<CardGroup cols={2}>
  <Card title="Tùy chọn luồng" icon="git-branch" href="/vi/plugins/sdk-entrypoints#registration-mode">
    Chế độ trả lời cố định, theo phạm vi tài khoản, hoặc tùy chỉnh
  </Card>
  <Card title="Tích hợp công cụ nhắn tin" icon="puzzle" href="/vi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool và khám phá hành động
  </Card>
  <Card title="Phân giải đích" icon="crosshair" href="/vi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, phương tiện, subagent qua api.runtime
  </Card>
  <Card title="Kernel lượt kênh" icon="bolt" href="/vi/plugins/sdk-channel-turn">
    Vòng đời lượt đến dùng chung: nhập, phân giải, ghi lại, điều phối, hoàn tất
  </Card>
</CardGroup>

<Note>
Một số seam helper được đóng gói kèm vẫn tồn tại để bảo trì Plugin được đóng gói kèm và
tương thích. Chúng không phải là mẫu được khuyến nghị cho các Plugin kênh mới;
ưu tiên các subpath kênh/thiết lập/trả lời/runtime chung từ bề mặt SDK chung
trừ khi bạn đang trực tiếp bảo trì họ Plugin được đóng gói kèm đó.
</Note>

## Bước tiếp theo

- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - nếu Plugin của bạn cũng cung cấp mô hình
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu import subpath đầy đủ
- [Kiểm thử SDK](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) - schema manifest đầy đủ

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin bộ kiểm thử agent](/vi/plugins/sdk-agent-harness)
