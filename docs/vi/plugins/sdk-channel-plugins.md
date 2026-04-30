---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt bộ chuyển đổi ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-04-30T09:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin kênh kết nối OpenClaw với một
nền tảng nhắn tin. Khi hoàn tất, bạn sẽ có một kênh hoạt động với bảo mật DM,
ghép nối, luồng trả lời và nhắn tin gửi đi.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào trước đây, trước tiên hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

## Cách Plugin kênh hoạt động

Plugin kênh không cần công cụ gửi/chỉnh sửa/thả cảm xúc riêng. OpenClaw giữ một
công cụ `message` dùng chung trong lõi. Plugin của bạn sở hữu:

- **Cấu hình** — phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** — chính sách DM và danh sách cho phép
- **Ghép nối** — luồng phê duyệt DM
- **Ngữ pháp phiên** — cách id cuộc trò chuyện theo nhà cung cấp ánh xạ tới cuộc trò chuyện gốc, id luồng và phương án dự phòng cha
- **Gửi đi** — gửi văn bản, phương tiện và cuộc thăm dò tới nền tảng
- **Luồng hội thoại** — cách các câu trả lời được xếp vào luồng
- **Heartbeat typing** — tín hiệu đang nhập/bận tùy chọn cho mục tiêu gửi Heartbeat

Lõi sở hữu công cụ message dùng chung, nối dây prompt, hình dạng khóa phiên bên ngoài,
ghi sổ `:thread:` chung và điều phối.

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập ngoài các câu trả lời gửi đến, hãy expose
`heartbeat.sendTyping(...)` trên Plugin kênh. Lõi gọi hàm đó với
mục tiêu gửi Heartbeat đã phân giải trước khi lần chạy mô hình Heartbeat bắt đầu và
sử dụng vòng đời keepalive/dọn dẹp trạng thái đang nhập dùng chung. Thêm `heartbeat.clearTyping(...)`
khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu kênh của bạn thêm tham số message-tool mang nguồn phương tiện, hãy expose các
tên tham số đó qua `describeMessageTool(...).mediaSourceParams`. Lõi dùng
danh sách rõ ràng đó để chuẩn hóa đường dẫn sandbox và chính sách truy cập phương tiện gửi đi,
vì vậy Plugin không cần các trường hợp đặc biệt trong lõi dùng chung cho các tham số
avatar, tệp đính kèm hoặc ảnh bìa theo nhà cung cấp.
Nên trả về một bản đồ theo khóa hành động như
`{ "set-profile": ["avatarUrl", "avatarPath"] }` để các hành động không liên quan không
kế thừa đối số phương tiện của hành động khác. Một mảng phẳng vẫn hoạt động với các tham số
được chủ ý dùng chung trên mọi hành động được expose.

Nếu nền tảng của bạn lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ phần phân tích đó
trong Plugin bằng `messaging.resolveSessionConversation(...)`. Đó là hook
chuẩn để ánh xạ `rawId` tới id cuộc trò chuyện gốc, id luồng tùy chọn,
`baseConversationId` rõ ràng và mọi `parentConversationCandidates`.
Khi bạn trả về `parentConversationCandidates`, hãy giữ chúng theo thứ tự từ cha
hẹp nhất đến cuộc trò chuyện rộng nhất/gốc.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh luồng con với tuyến cha của nó hoặc xây dựng
khóa khử trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper
chuẩn hóa id luồng dạng số theo đúng cách lõi thực hiện, vì vậy Plugin nên ưu tiên
nó thay vì so sánh tùy tiện bằng `String(threadId)`.
Plugin có ngữ pháp mục tiêu theo nhà cung cấp có thể đưa parser của mình vào
`resolveChannelRouteTargetWithParser(...)` và vẫn nhận cùng hình dạng mục tiêu tuyến
cùng ngữ nghĩa dự phòng luồng mà lõi dùng.

Các Plugin được đóng gói cần cùng cách phân tích trước khi registry kênh khởi động
cũng có thể expose một tệp cấp cao nhất `session-key-api.ts` với export
`resolveSessionConversation(...)` tương ứng. Lõi chỉ dùng bề mặt an toàn cho bootstrap đó
khi registry Plugin runtime chưa sẵn sàng.

`messaging.resolveParentConversationCandidates(...)` vẫn khả dụng như một
phương án dự phòng tương thích cũ khi Plugin chỉ cần các phương án cha dự phòng trên
id chung/thô. Nếu cả hai hook cùng tồn tại, lõi dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
quay lại `resolveParentConversationCandidates(...)` khi hook chuẩn
bỏ qua chúng.

## Phê duyệt và khả năng của kênh

Hầu hết Plugin kênh không cần mã riêng cho phê duyệt.

- Lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và cơ chế gửi dự phòng chung.
- Ưu tiên một đối tượng `approvalCapability` trên Plugin kênh khi kênh cần hành vi riêng cho phê duyệt.
- `ChannelPlugin.approvals` đã bị xóa. Đặt các dữ kiện gửi/native/render/auth phê duyệt trên `approvalCapability`.
- `plugin.auth` chỉ dành cho đăng nhập/đăng xuất; lõi không còn đọc hook auth phê duyệt từ đối tượng đó.
- `approvalCapability.authorizeActorAction` và `approvalCapability.getActionAvailabilityState` là seam auth phê duyệt chuẩn.
- Dùng `approvalCapability.getActionAvailabilityState` cho khả năng auth phê duyệt trong cùng cuộc trò chuyện.
- Nếu kênh của bạn expose phê duyệt thực thi native, hãy dùng `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái bề mặt khởi tạo/native-client khi nó khác với auth phê duyệt trong cùng cuộc trò chuyện. Lõi dùng hook riêng cho thực thi đó để phân biệt `enabled` với `disabled`, quyết định kênh khởi tạo có hỗ trợ phê duyệt thực thi native hay không và đưa kênh vào hướng dẫn dự phòng native-client. `createApproverRestrictedNativeApprovalCapability(...)` điền phần này cho trường hợp phổ biến.
- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng theo kênh, chẳng hạn như ẩn prompt phê duyệt cục bộ bị trùng hoặc gửi chỉ báo đang nhập trước khi giao.
- Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt native hoặc chặn dự phòng.
- Dùng `approvalCapability.nativeRuntime` cho các dữ kiện phê duyệt native do kênh sở hữu. Giữ nó lazy trên các entrypoint kênh nóng bằng `createLazyChannelApprovalNativeRuntimeAdapter(...)`, có thể import module runtime của bạn theo yêu cầu trong khi vẫn cho phép lõi lắp ráp vòng đời phê duyệt.
- Chỉ dùng `approvalCapability.render` khi một kênh thật sự cần payload phê duyệt tùy chỉnh thay vì renderer dùng chung.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn câu trả lời ở đường dẫn bị tắt giải thích chính xác các núm cấu hình cần thiết để bật phê duyệt thực thi native. Hook nhận `{ channel, channelLabel, accountId }`; các kênh tài khoản được đặt tên nên render đường dẫn theo phạm vi tài khoản như `channels.<channel>.accounts.<id>.execApprovals.*` thay vì mặc định cấp cao nhất.
- Nếu một kênh có thể suy ra các định danh DM ổn định giống chủ sở hữu từ cấu hình hiện có, hãy dùng `createResolvedApproverActionAuthAdapter` từ `openclaw/plugin-sdk/approval-runtime` để giới hạn `/approve` trong cùng cuộc trò chuyện mà không thêm logic lõi riêng cho phê duyệt.
- Nếu một kênh cần gửi phê duyệt native, hãy giữ mã kênh tập trung vào chuẩn hóa mục tiêu cộng với các dữ kiện vận chuyển/trình bày. Dùng `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` và `createApproverRestrictedNativeApprovalCapability` từ `openclaw/plugin-sdk/approval-runtime`. Đặt các dữ kiện riêng của kênh phía sau `approvalCapability.nativeRuntime`, lý tưởng là qua `createChannelApprovalNativeRuntimeAdapter(...)` hoặc `createLazyChannelApprovalNativeRuntimeAdapter(...)`, để lõi có thể lắp ráp handler và sở hữu lọc yêu cầu, định tuyến, khử trùng lặp, hết hạn, đăng ký Gateway và thông báo đã được định tuyến nơi khác. `nativeRuntime` được tách thành vài seam nhỏ hơn:
- `createChannelNativeOriginTargetResolver` mặc định dùng matcher channel-route dùng chung cho mục tiêu `{ to, accountId, threadId }`. Chỉ truyền `targetsMatch` khi một kênh có quy tắc tương đương theo nhà cung cấp, chẳng hạn như khớp tiền tố timestamp của Slack.
- Truyền `normalizeTargetForMatch` vào `createChannelNativeOriginTargetResolver` khi kênh cần chuẩn hóa id nhà cung cấp trước khi matcher tuyến mặc định hoặc callback `targetsMatch` tùy chỉnh chạy, trong khi vẫn giữ mục tiêu gốc để giao. Chỉ dùng `normalizeTarget` khi chính mục tiêu giao đã phân giải cần được chuẩn hóa.
- `availability` — tài khoản đã được cấu hình hay chưa và yêu cầu có nên được xử lý hay không
- `presentation` — ánh xạ view model phê duyệt dùng chung thành payload native đang chờ/đã phân giải/đã hết hạn hoặc hành động cuối
- `transport` — chuẩn bị mục tiêu và gửi/cập nhật/xóa tin nhắn phê duyệt native
- `interactions` — hook bind/unbind/clear-action tùy chọn cho nút hoặc reaction native
- `observe` — hook chẩn đoán giao tùy chọn
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, ứng dụng Bolt hoặc bộ nhận webhook, hãy đăng ký chúng qua `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context chung cho phép lõi bootstrap các handler theo khả năng từ trạng thái khởi động kênh mà không thêm glue wrapper riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc `createChannelNativeApprovalRuntime` cấp thấp hơn khi seam theo khả năng chưa đủ biểu đạt.
- Kênh phê duyệt native phải định tuyến cả `accountId` và `approvalKind` qua các helper đó. `accountId` giữ chính sách phê duyệt đa tài khoản trong phạm vi đúng tài khoản bot, còn `approvalKind` giữ hành vi phê duyệt thực thi so với Plugin khả dụng cho kênh mà không cần nhánh hardcode trong lõi.
- Lõi hiện cũng sở hữu thông báo định tuyến lại phê duyệt. Plugin kênh không nên gửi tin nhắn theo sau kiểu "phê duyệt đã chuyển tới DM / kênh khác" riêng từ `createChannelNativeApprovalRuntime`; thay vào đó, expose định tuyến origin + approver-DM chính xác qua các helper khả năng phê duyệt dùng chung và để lõi tổng hợp các lần giao thực tế trước khi đăng bất kỳ thông báo nào trở lại cuộc trò chuyện khởi tạo.
- Giữ nguyên loại id phê duyệt đã giao từ đầu đến cuối. Native client không nên
  đoán hoặc viết lại định tuyến phê duyệt thực thi so với Plugin từ trạng thái cục bộ của kênh.
- Các loại phê duyệt khác nhau có thể chủ ý expose các bề mặt native khác nhau.
  Ví dụ được đóng gói hiện tại:
  - Slack giữ định tuyến phê duyệt native khả dụng cho cả id thực thi và Plugin.
  - Matrix giữ cùng định tuyến DM/kênh native và UX reaction cho phê duyệt thực thi
    và Plugin, trong khi vẫn cho phép auth khác nhau theo loại phê duyệt.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại như một wrapper tương thích, nhưng mã mới nên ưu tiên capability builder và expose `approvalCapability` trên Plugin.

Với các entrypoint kênh nóng, hãy ưu tiên các subpath runtime hẹp hơn khi bạn chỉ
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

Tương tự, hãy ưu tiên `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` và
`openclaw/plugin-sdk/reply-chunking` khi bạn không cần bề mặt umbrella
rộng hơn.

Riêng với thiết lập:

- `openclaw/plugin-sdk/setup-runtime` bao phủ các helper thiết lập an toàn cho runtime:
  adapter vá thiết lập an toàn khi import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries` và các builder
  setup-proxy được ủy quyền
- `openclaw/plugin-sdk/setup-adapter-runtime` là seam adapter hẹp có nhận biết env
  cho `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` bao phủ các builder thiết lập optional-install
  cộng với một vài primitive an toàn cho thiết lập:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Nếu kênh của bạn hỗ trợ thiết lập hoặc auth do env điều khiển và các luồng khởi động/cấu hình
chung nên biết các tên env đó trước khi runtime tải, hãy khai báo chúng trong
manifest Plugin bằng `channelEnvVars`. Chỉ giữ `envVars` runtime của kênh hoặc
hằng cục bộ cho phần lời dành cho người vận hành.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc các lượt quét SecretRef trước khi runtime Plugin khởi động, hãy thêm `openclaw.setupEntry` trong `package.json`. Entrypoint đó phải an toàn để import trong các đường dẫn lệnh chỉ đọc và phải trả về siêu dữ liệu kênh, adapter cấu hình an toàn cho thiết lập, adapter trạng thái, và siêu dữ liệu đích bí mật của kênh cần thiết cho các phần tóm tắt đó. Không khởi động client, listener, hoặc runtime truyền tải từ setup entry.

Giữ đường dẫn import của entry kênh chính cũng hẹp. Discovery có thể đánh giá entry và module Plugin kênh để đăng ký capability mà không kích hoạt kênh. Các tệp như `channel-plugin-api.ts` nên export đối tượng Plugin kênh mà không import trình hướng dẫn thiết lập, client truyền tải, listener socket, trình khởi chạy subprocess, hoặc module khởi động dịch vụ. Đặt các phần runtime đó trong những module được tải từ `registerFull(...)`, runtime setter, hoặc adapter capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, và
`splitSetupEntries`

- chỉ dùng seam `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần các helper thiết lập/cấu hình dùng chung nặng hơn như `moveSingleAccountChannelSectionToDefaultAccount(...)`

Nếu kênh của bạn chỉ muốn hiển thị "hãy cài Plugin này trước" trong các bề mặt thiết lập, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/trình hướng dẫn được tạo sẽ đóng an toàn khi ghi cấu hình và hoàn tất, đồng thời tái sử dụng cùng một thông báo yêu cầu cài đặt trong xác thực, hoàn tất, và nội dung liên kết tài liệu.

Đối với các đường dẫn kênh nóng khác, hãy ưu tiên các helper hẹp thay vì các bề mặt cũ rộng hơn:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và fallback tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/inbound-reply-dispatch` cho route/envelope inbound và wiring ghi rồi dispatch
- `openclaw/plugin-sdk/messaging-targets` cho phân tích/khớp đích
- `openclaw/plugin-sdk/outbound-media` và
  `openclaw/plugin-sdk/outbound-runtime` cho tải media cộng với delegate định danh/gửi outbound và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một route outbound cần giữ nguyên một `replyToId`/`threadId` rõ ràng hoặc khôi phục phiên `:thread:` hiện tại sau khi khóa phiên cơ sở vẫn khớp. Plugin provider có thể ghi đè thứ tự ưu tiên, hành vi hậu tố, và chuẩn hóa thread id khi nền tảng của chúng có ngữ nghĩa gửi thread gốc.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời thread-binding và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi vẫn cần bố cục trường payload agent/media cũ
- `openclaw/plugin-sdk/telegram-command-config` cho chuẩn hóa lệnh tùy chỉnh Telegram, xác thực trùng lặp/xung đột, và hợp đồng cấu hình lệnh ổn định khi fallback

Các kênh chỉ dùng auth thường có thể dừng ở đường dẫn mặc định: core xử lý phê duyệt và Plugin chỉ cần phơi bày capability outbound/auth. Các kênh phê duyệt native như Matrix, Slack, Telegram, và các truyền tải chat tùy chỉnh nên dùng các helper native dùng chung thay vì tự xây dựng vòng đời phê duyệt.

## Chính sách nhắc đến inbound

Giữ xử lý nhắc đến inbound tách thành hai lớp:

- thu thập bằng chứng do Plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách nhắc đến.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel helper inbound rộng hơn.

Phù hợp cho logic cục bộ của Plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra sự tham gia trong thread
- loại trừ thông báo dịch vụ/hệ thống
- cache native của nền tảng cần thiết để chứng minh bot đã tham gia

Phù hợp cho helper dùng chung:

- `requireMention`
- kết quả nhắc đến rõ ràng
- allowlist nhắc đến ngầm định
- bỏ qua theo lệnh
- quyết định bỏ qua cuối cùng

Luồng ưu tiên:

1. Tính các dữ kiện nhắc đến cục bộ.
2. Truyền các dữ kiện đó vào `resolveInboundMentionDecision({ facts, policy })`.
3. Dùng `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, và `decision.shouldSkip` trong cổng inbound của bạn.

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

`api.runtime.channel.mentions` phơi bày cùng các helper nhắc đến dùng chung cho các Plugin kênh đi kèm vốn đã phụ thuộc vào runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Nếu bạn chỉ cần `implicitMentionKindWhen` và
`resolveInboundMentionDecision`, hãy import từ
`openclaw/plugin-sdk/channel-mention-gating` để tránh tải các helper runtime inbound không liên quan.

Các helper `resolveMentionGating*` cũ hơn vẫn còn trên
`openclaw/plugin-sdk/channel-inbound` chỉ dưới dạng export tương thích. Code mới nên dùng `resolveInboundMentionDecision({ facts, policy })`.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Gói và manifest">
    Tạo các tệp Plugin tiêu chuẩn. Trường `channel` trong `package.json` là
    thứ biến đây thành một Plugin kênh. Để xem đầy đủ bề mặt siêu dữ liệu gói,
    hãy xem [Thiết lập và cấu hình Plugin](/vi/plugins/sdk-setup#openclaw-channel):

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
    các thiết lập do Plugin sở hữu nhưng không phải là cấu hình tài khoản kênh. `channelConfigs`
    xác thực `channels.acme-chat` và là nguồn cold-path được dùng bởi schema
    cấu hình, thiết lập, và các bề mặt UI trước khi runtime Plugin tải.

  </Step>

  <Step title="Xây dựng đối tượng Plugin kênh">
    Interface `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Hãy bắt đầu với
    phần tối thiểu — `id` và `setup` — rồi thêm adapter khi bạn cần.

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

    Đối với các kênh chấp nhận cả khóa DM cấp cao nhất dạng chuẩn và khóa lồng cũ, hãy dùng các helper từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, và `normalizeChannelDmPolicy` giữ các giá trị cục bộ của tài khoản đứng trước các giá trị root được kế thừa. Ghép cùng resolver với sửa chữa doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin làm gì cho bạn">
      Thay vì triển khai thủ công các interface adapter cấp thấp, bạn truyền
      các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Nội dung được wiring |
      | --- | --- |
      | `security.dm` | Resolver bảo mật DM có phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép cặp DM dựa trên văn bản với trao đổi mã |
      | `threading` | Resolver chế độ trả lời (cố định, theo phạm vi tài khoản, hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Hàm gửi trả về siêu dữ liệu kết quả (ID thông báo) |

      Bạn cũng có thể truyền trực tiếp các đối tượng adapter thô thay vì các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Bộ điều hợp gửi thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm gửi
      chẳng hạn như `maxLinesPerMessage`; hãy áp dụng nó trước khi gửi để luồng trả lời
      và ranh giới đoạn được xử lý một lần bởi cơ chế gửi đi dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi mục tiêu trả lời gốc đã được phân giải, để các helper payload có thể giữ nguyên
      thẻ trả lời rõ ràng mà không tiêu thụ một ô trả lời dùng một lần ngầm định.
    </Accordion>

  </Step>

  <Step title="Đấu nối điểm vào">
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
    có thể hiển thị chúng trong trợ giúp gốc mà không kích hoạt toàn bộ runtime của kênh,
    trong khi các lần tải đầy đủ thông thường vẫn lấy cùng các descriptor đó để đăng ký
    lệnh thực tế. Giữ `registerFull(...)` cho công việc chỉ dành cho runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC Gateway, hãy dùng một
    tiền tố dành riêng cho Plugin. Các namespace quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải thành `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý việc tách chế độ đăng ký. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm mục thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải mục này thay cho mục đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Việc này tránh kéo mã runtime nặng vào trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace đi kèm tách export an toàn cho thiết lập sang các module
    sidecar có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    setter runtime rõ ràng tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn đến">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
    điều phối nó qua handler đến của kênh của bạn:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      Xử lý tin nhắn đến phụ thuộc vào từng kênh. Mỗi Plugin kênh sở hữu
      pipeline đến riêng của mình. Hãy xem các Plugin kênh đi kèm
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để biết các mẫu thực tế.
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
  <Card title="Tùy chọn luồng" icon="git-branch" href="/vi/plugins/sdk-entrypoints#registration-mode">
    Chế độ trả lời cố định, theo phạm vi tài khoản, hoặc tùy chỉnh
  </Card>
  <Card title="Tích hợp công cụ tin nhắn" icon="puzzle" href="/vi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool và khám phá hành động
  </Card>
  <Card title="Phân giải mục tiêu" icon="crosshair" href="/vi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, media, subagent qua api.runtime
  </Card>
  <Card title="Kernel lượt kênh" icon="bolt" href="/vi/plugins/sdk-channel-turn">
    Vòng đời lượt đến dùng chung: nạp, phân giải, ghi lại, điều phối, hoàn tất
  </Card>
</CardGroup>

<Note>
Một số seam helper đi kèm vẫn tồn tại để bảo trì Plugin đi kèm và
tương thích. Chúng không phải mẫu được khuyến nghị cho các Plugin kênh mới;
hãy ưu tiên các subpath channel/setup/reply/runtime chung từ bề mặt SDK
phổ biến, trừ khi bạn đang trực tiếp bảo trì họ Plugin đi kèm đó.
</Note>

## Các bước tiếp theo

- [Provider Plugins](/vi/plugins/sdk-provider-plugins) — nếu Plugin của bạn cũng cung cấp model
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu import subpath đầy đủ
- [Kiểm thử SDK](/vi/plugins/sdk-testing) — tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest đầy đủ

## Liên quan

- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin agent harness](/vi/plugins/sdk-agent-harness)
