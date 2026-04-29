---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu giao diện bộ điều hợp ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng một Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-04-29T23:01:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03384057a4316b87c6088d3859d16ed4546c803f7c64639cd12be293f4841258
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin kênh kết nối OpenClaw với một
nền tảng nhắn tin. Đến cuối hướng dẫn, bạn sẽ có một kênh hoạt động với bảo mật DM,
ghép đôi, phân luồng trả lời và nhắn tin gửi đi.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

## Cách Plugin kênh hoạt động

Plugin kênh không cần các công cụ gửi/chỉnh sửa/phản ứng riêng. OpenClaw giữ một
công cụ `message` dùng chung trong lõi. Plugin của bạn sở hữu:

- **Cấu hình** — phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** — chính sách DM và danh sách cho phép
- **Ghép đôi** — luồng phê duyệt DM
- **Ngữ pháp phiên** — cách các id cuộc trò chuyện riêng của nhà cung cấp ánh xạ tới cuộc trò chuyện cơ sở, id luồng và các phương án cha dự phòng
- **Gửi đi** — gửi văn bản, phương tiện và bình chọn tới nền tảng
- **Phân luồng** — cách các trả lời được phân luồng
- **Heartbeat đang nhập** — tín hiệu đang nhập/bận tùy chọn cho các đích phân phối Heartbeat

Lõi sở hữu công cụ tin nhắn dùng chung, nối dây prompt, dạng khóa phiên bên ngoài,
ghi sổ `:thread:` chung và điều phối.

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập ngoài các trả lời đến, hãy cung cấp
`heartbeat.sendTyping(...)` trên Plugin kênh. Lõi gọi hàm này với
đích phân phối Heartbeat đã được phân giải trước khi lượt chạy mô hình Heartbeat bắt đầu và
dùng vòng đời giữ sống/dọn dẹp đang nhập dùng chung. Thêm `heartbeat.clearTyping(...)`
khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu kênh của bạn thêm tham số công cụ tin nhắn mang nguồn phương tiện, hãy cung cấp các
tên tham số đó qua `describeMessageTool(...).mediaSourceParams`. Lõi dùng
danh sách rõ ràng đó để chuẩn hóa đường dẫn sandbox và chính sách truy cập phương tiện gửi đi,
nên Plugin không cần các trường hợp đặc biệt trong lõi dùng chung cho tham số
ảnh đại diện, tệp đính kèm hoặc ảnh bìa riêng của nhà cung cấp.
Nên trả về một map theo khóa hành động, chẳng hạn
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, để các hành động không liên quan không
kế thừa đối số phương tiện của hành động khác. Một mảng phẳng vẫn hoạt động cho các tham số
được chủ đích dùng chung trên mọi hành động được cung cấp.

Nếu nền tảng của bạn lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ phần phân tích đó
trong Plugin với `messaging.resolveSessionConversation(...)`. Đây là hook
chuẩn để ánh xạ `rawId` tới id cuộc trò chuyện cơ sở, id luồng tùy chọn,
`baseConversationId` rõ ràng và mọi `parentConversationCandidates`.
Khi bạn trả về `parentConversationCandidates`, hãy giữ chúng được sắp xếp từ cha
hẹp nhất tới cuộc trò chuyện rộng nhất/cơ sở.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa
các trường giống tuyến, so sánh luồng con với tuyến cha của nó, hoặc xây dựng
khóa chống trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper
chuẩn hóa id luồng dạng số giống như lõi, nên Plugin nên ưu tiên
nó thay vì so sánh tùy biến kiểu `String(threadId)`.
Plugin có ngữ pháp đích riêng của nhà cung cấp có thể đưa parser của mình vào
`resolveChannelRouteTargetWithParser(...)` mà vẫn nhận được cùng dạng đích tuyến
và ngữ nghĩa dự phòng luồng mà lõi dùng.

Các Plugin đi kèm cần cùng phần phân tích trước khi registry kênh khởi động
cũng có thể cung cấp tệp `session-key-api.ts` cấp cao nhất với export
`resolveSessionConversation(...)` tương ứng. Lõi chỉ dùng bề mặt an toàn cho bootstrap này
khi registry Plugin runtime chưa khả dụng.

`messaging.resolveParentConversationCandidates(...)` vẫn khả dụng như một
phương án tương thích cũ khi Plugin chỉ cần phương án cha dự phòng dựa trên
id chung/thô. Nếu cả hai hook tồn tại, lõi dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ
quay về `resolveParentConversationCandidates(...)` khi hook chuẩn
không cung cấp chúng.

## Phê duyệt và năng lực kênh

Hầu hết Plugin kênh không cần mã riêng cho phê duyệt.

- Lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và phân phối dự phòng chung.
- Ưu tiên một đối tượng `approvalCapability` trên Plugin kênh khi kênh cần hành vi riêng cho phê duyệt.
- `ChannelPlugin.approvals` đã bị loại bỏ. Đặt các thông tin phân phối/native/render/auth phê duyệt trên `approvalCapability`.
- `plugin.auth` chỉ dành cho đăng nhập/đăng xuất; lõi không còn đọc hook auth phê duyệt từ đối tượng đó.
- `approvalCapability.authorizeActorAction` và `approvalCapability.getActionAvailabilityState` là seam auth phê duyệt chuẩn.
- Dùng `approvalCapability.getActionAvailabilityState` cho khả năng auth phê duyệt trong cùng cuộc trò chuyện.
- Nếu kênh của bạn cung cấp phê duyệt exec native, dùng `approvalCapability.getExecInitiatingSurfaceState` cho trạng thái bề mặt khởi tạo/client native khi nó khác với auth phê duyệt trong cùng cuộc trò chuyện. Lõi dùng hook riêng cho exec đó để phân biệt `enabled` với `disabled`, quyết định kênh khởi tạo có hỗ trợ phê duyệt exec native hay không, và đưa kênh vào hướng dẫn dự phòng client native. `createApproverRestrictedNativeApprovalCapability(...)` điền phần này cho trường hợp phổ biến.
- Dùng `outbound.shouldSuppressLocalPayloadPrompt` hoặc `outbound.beforeDeliverPayload` cho hành vi vòng đời payload riêng theo kênh, chẳng hạn ẩn prompt phê duyệt cục bộ trùng lặp hoặc gửi chỉ báo đang nhập trước khi phân phối.
- Chỉ dùng `approvalCapability.delivery` cho định tuyến phê duyệt native hoặc chặn dự phòng.
- Dùng `approvalCapability.nativeRuntime` cho các thông tin phê duyệt native do kênh sở hữu. Giữ nó lazy trên các điểm vào kênh nóng bằng `createLazyChannelApprovalNativeRuntimeAdapter(...)`, có thể import module runtime của bạn khi cần trong khi vẫn cho phép lõi lắp ráp vòng đời phê duyệt.
- Chỉ dùng `approvalCapability.render` khi kênh thật sự cần payload phê duyệt tùy chỉnh thay vì renderer dùng chung.
- Dùng `approvalCapability.describeExecApprovalSetup` khi kênh muốn trả lời ở nhánh disabled giải thích chính xác các núm cấu hình cần thiết để bật phê duyệt exec native. Hook nhận `{ channel, channelLabel, accountId }`; các kênh có tài khoản được đặt tên nên render các đường dẫn theo phạm vi tài khoản như `channels.<channel>.accounts.<id>.execApprovals.*` thay vì mặc định cấp cao nhất.
- Nếu kênh có thể suy ra các danh tính DM giống chủ sở hữu ổn định từ cấu hình hiện có, dùng `createResolvedApproverActionAuthAdapter` từ `openclaw/plugin-sdk/approval-runtime` để giới hạn `/approve` trong cùng cuộc trò chuyện mà không thêm logic lõi riêng cho phê duyệt.
- Nếu kênh cần phân phối phê duyệt native, hãy giữ mã kênh tập trung vào chuẩn hóa đích cộng với thông tin transport/presentation. Dùng `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` và `createApproverRestrictedNativeApprovalCapability` từ `openclaw/plugin-sdk/approval-runtime`. Đặt các thông tin riêng của kênh phía sau `approvalCapability.nativeRuntime`, lý tưởng là qua `createChannelApprovalNativeRuntimeAdapter(...)` hoặc `createLazyChannelApprovalNativeRuntimeAdapter(...)`, để lõi có thể lắp ráp handler và sở hữu lọc yêu cầu, định tuyến, chống trùng lặp, hết hạn, đăng ký Gateway và thông báo đã định tuyến nơi khác. `nativeRuntime` được chia thành một vài seam nhỏ hơn:
- `createChannelNativeOriginTargetResolver` mặc định dùng bộ so khớp channel-route dùng chung cho các đích `{ to, accountId, threadId }`. Chỉ truyền `targetsMatch` khi kênh có quy tắc tương đương riêng của nhà cung cấp, chẳng hạn so khớp tiền tố timestamp của Slack.
- Truyền `normalizeTargetForMatch` vào `createChannelNativeOriginTargetResolver` khi kênh cần chuẩn hóa id nhà cung cấp trước khi bộ so khớp tuyến mặc định hoặc callback `targetsMatch` tùy chỉnh chạy, trong khi vẫn giữ đích gốc để phân phối. Chỉ dùng `normalizeTarget` khi chính đích phân phối đã phân giải cần được chuẩn hóa.
- `availability` — tài khoản đã được cấu hình hay chưa và yêu cầu có nên được xử lý hay không
- `presentation` — ánh xạ view model phê duyệt dùng chung thành payload native đang chờ/đã phân giải/đã hết hạn hoặc hành động cuối
- `transport` — chuẩn bị đích cùng với gửi/cập nhật/xóa tin nhắn phê duyệt native
- `interactions` — các hook bind/unbind/clear-action tùy chọn cho nút hoặc phản ứng native
- `observe` — các hook chẩn đoán phân phối tùy chọn
- Nếu kênh cần các đối tượng do runtime sở hữu như client, token, ứng dụng Bolt hoặc webhook receiver, hãy đăng ký chúng qua `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context chung cho phép lõi bootstrap các handler dựa trên capability từ trạng thái khởi động kênh mà không cần thêm lớp keo wrapper riêng cho phê duyệt.
- Chỉ dùng `createChannelApprovalHandler` hoặc `createChannelNativeApprovalRuntime` cấp thấp hơn khi seam dựa trên capability chưa đủ biểu đạt.
- Các kênh phê duyệt native phải định tuyến cả `accountId` và `approvalKind` qua các helper đó. `accountId` giữ chính sách phê duyệt đa tài khoản được giới hạn vào đúng tài khoản bot, còn `approvalKind` giữ cho hành vi phê duyệt exec so với Plugin khả dụng với kênh mà không cần nhánh hardcode trong lõi.
- Lõi hiện cũng sở hữu thông báo định tuyến lại phê duyệt. Plugin kênh không nên gửi tin nhắn tiếp nối riêng kiểu "phê duyệt đã chuyển tới DM / kênh khác" từ `createChannelNativeApprovalRuntime`; thay vào đó, cung cấp định tuyến origin + DM người phê duyệt chính xác qua các helper capability phê duyệt dùng chung và để lõi tổng hợp các lần phân phối thực tế trước khi đăng bất kỳ thông báo nào trở lại cuộc trò chuyện khởi tạo.
- Giữ nguyên loại id phê duyệt đã phân phối từ đầu đến cuối. Client native không nên
  đoán hoặc viết lại định tuyến phê duyệt exec so với Plugin từ trạng thái cục bộ của kênh.
- Các loại phê duyệt khác nhau có thể chủ đích cung cấp các bề mặt native khác nhau.
  Các ví dụ đi kèm hiện tại:
  - Slack giữ định tuyến phê duyệt native khả dụng cho cả id exec và Plugin.
  - Matrix giữ cùng định tuyến DM/kênh native và UX phản ứng cho phê duyệt exec
    và Plugin, đồng thời vẫn cho phép auth khác nhau theo loại phê duyệt.
- `createApproverRestrictedNativeApprovalAdapter` vẫn tồn tại như một wrapper tương thích, nhưng mã mới nên ưu tiên builder capability và cung cấp `approvalCapability` trên Plugin.

Đối với các điểm vào kênh nóng, hãy ưu tiên các subpath runtime hẹp hơn khi bạn chỉ
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` và
`openclaw/plugin-sdk/reply-chunking` khi bạn không cần bề mặt ô lớn hơn.

Riêng với thiết lập:

- `openclaw/plugin-sdk/setup-runtime` bao phủ các helper thiết lập an toàn cho runtime:
  adapter vá thiết lập an toàn khi import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), đầu ra ghi chú tra cứu,
  `promptResolvedAllowFrom`, `splitSetupEntries` và các builder
  setup-proxy được ủy quyền
- `openclaw/plugin-sdk/setup-adapter-runtime` là seam adapter hẹp có nhận biết env
  cho `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` bao phủ các builder thiết lập
  cài đặt tùy chọn cùng một vài primitive an toàn cho thiết lập:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Nếu kênh của bạn hỗ trợ thiết lập hoặc auth dựa trên env và các luồng
khởi động/cấu hình chung nên biết các tên env đó trước khi runtime tải, hãy khai báo chúng trong
manifest Plugin với `channelEnvVars`. Giữ `envVars` runtime của kênh hoặc các
hằng cục bộ chỉ cho phần nội dung hướng tới người vận hành.

Nếu kênh của bạn có thể xuất hiện trong `status`, `channels list`, `channels status`, hoặc các lần quét SecretRef trước khi runtime của plugin khởi động, hãy thêm `openclaw.setupEntry` trong `package.json`. Entry point đó phải an toàn để import trong các đường dẫn lệnh chỉ đọc và phải trả về siêu dữ liệu kênh, adapter cấu hình an toàn cho thiết lập, adapter trạng thái và siêu dữ liệu mục tiêu bí mật của kênh cần thiết cho các bản tóm tắt đó. Không khởi động client, listener hoặc runtime truyền tải từ setup entry.

Giữ đường dẫn import của entry kênh chính cũng hẹp. Discovery có thể đánh giá entry và module plugin kênh để đăng ký capability mà không kích hoạt kênh. Các tệp như `channel-plugin-api.ts` nên export đối tượng plugin kênh mà không import wizard thiết lập, client truyền tải, socket listener, trình khởi chạy subprocess hoặc module khởi động dịch vụ. Đặt các phần runtime đó trong các module được tải từ `registerFull(...)`, runtime setter hoặc adapter capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, và
`splitSetupEntries`

- chỉ dùng seam `openclaw/plugin-sdk/setup` rộng hơn khi bạn cũng cần các helper thiết lập/cấu hình dùng chung nặng hơn như `moveSingleAccountChannelSectionToDefaultAccount(...)`

Nếu kênh của bạn chỉ muốn hiển thị "cài đặt plugin này trước" trong các bề mặt thiết lập, hãy ưu tiên `createOptionalChannelSetupSurface(...)`. Adapter/wizard được tạo sẽ fail closed khi ghi cấu hình và finalize, đồng thời dùng lại cùng một thông báo yêu cầu cài đặt trên validation, finalize và nội dung liên kết tài liệu.

Với các đường dẫn kênh nóng khác, hãy ưu tiên các helper hẹp thay vì các bề mặt legacy rộng hơn:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và fallback tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/inbound-reply-dispatch` cho route/envelope inbound và wiring ghi rồi dispatch
- `openclaw/plugin-sdk/messaging-targets` cho phân tích/matching mục tiêu
- `openclaw/plugin-sdk/outbound-media` và
  `openclaw/plugin-sdk/outbound-runtime` cho tải media cùng các delegate danh tính/gửi outbound và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một route outbound cần giữ nguyên `replyToId`/`threadId` rõ ràng hoặc khôi phục session `:thread:` hiện tại sau khi khóa session cơ sở vẫn khớp. Provider plugin có thể ghi đè độ ưu tiên, hành vi hậu tố và chuẩn hóa thread id khi nền tảng của chúng có ngữ nghĩa phân phối thread gốc.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời thread-binding và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi vẫn cần layout trường payload agent/media legacy
- `openclaw/plugin-sdk/telegram-command-config` cho việc chuẩn hóa lệnh tùy chỉnh Telegram, validation trùng lặp/xung đột và contract cấu hình lệnh ổn định khi fallback

Các kênh chỉ dùng auth thường có thể dừng ở đường dẫn mặc định: core xử lý phê duyệt và plugin chỉ expose capability outbound/auth. Các kênh phê duyệt native như Matrix, Slack, Telegram và các transport chat tùy chỉnh nên dùng helper native dùng chung thay vì tự triển khai vòng đời phê duyệt.

## Chính sách mention inbound

Giữ việc xử lý mention inbound tách thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách mention.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel helper inbound rộng hơn.

Phù hợp với logic cục bộ của plugin:

- phát hiện reply-to-bot
- phát hiện quoted-bot
- kiểm tra thread-participation
- loại trừ service/system-message
- cache native của nền tảng cần thiết để chứng minh bot participation

Phù hợp với helper dùng chung:

- `requireMention`
- kết quả mention rõ ràng
- allowlist mention ngầm định
- command bypass
- quyết định skip cuối cùng

Luồng được khuyến nghị:

1. Tính toán các fact mention cục bộ.
2. Truyền các fact đó vào `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` expose cùng các helper mention dùng chung cho các plugin kênh bundled đã phụ thuộc vào runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Nếu bạn chỉ cần `implicitMentionKindWhen` và `resolveInboundMentionDecision`, hãy import từ `openclaw/plugin-sdk/channel-mention-gating` để tránh tải các helper runtime inbound không liên quan.

Các helper `resolveMentionGating*` cũ hơn vẫn nằm trên `openclaw/plugin-sdk/channel-inbound` chỉ dưới dạng export tương thích. Code mới nên dùng `resolveInboundMentionDecision({ facts, policy })`.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Tạo các tệp plugin chuẩn. Trường `channel` trong `package.json` là thứ khiến đây trở thành plugin kênh. Để xem toàn bộ bề mặt siêu dữ liệu package, hãy xem [Thiết lập và cấu hình Plugin](/vi/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` validate `plugins.entries.acme-chat.config`. Dùng nó cho các thiết lập do plugin sở hữu mà không phải cấu hình tài khoản kênh. `channelConfigs` validate `channels.acme-chat` và là nguồn cold-path được schema cấu hình, thiết lập và các bề mặt UI dùng trước khi runtime plugin tải.

  </Step>

  <Step title="Build the channel plugin object">
    Interface `ChannelPlugin` có nhiều bề mặt adapter tùy chọn. Bắt đầu với mức tối thiểu — `id` và `setup` — rồi thêm adapter khi bạn cần.

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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất canonical và khóa lồng legacy, hãy dùng các helper từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` và `normalizeChannelDmPolicy` giữ các giá trị cục bộ theo tài khoản đi trước các giá trị root kế thừa. Ghép cùng resolver đó với sửa chữa doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một contract.

    <Accordion title="What createChatChannelPlugin does for you">
      Thay vì triển khai thủ công các interface adapter cấp thấp, bạn truyền các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Nó nối gì |
      | --- | --- |
      | `security.dm` | Resolver bảo mật DM có phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép đôi DM dựa trên văn bản với trao đổi mã |
      | `threading` | Resolver chế độ reply-to (cố định, theo phạm vi tài khoản hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (ID tin nhắn) |

      Bạn cũng có thể truyền trực tiếp các đối tượng adapter thô thay vì các tùy chọn khai báo nếu cần toàn quyền kiểm soát.

      Bộ điều hợp gửi đi thô có thể định nghĩa một hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm phân phối
      như `maxLinesPerMessage`; áp dụng nó trước khi gửi để luồng trả lời
      và ranh giới phân đoạn được xử lý một lần bởi cơ chế phân phối gửi đi dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi một mục tiêu trả lời gốc đã được xử lý, để các trình trợ giúp payload có thể giữ nguyên
      thẻ trả lời tường minh mà không tiêu thụ một ô trả lời dùng một lần ngầm định.
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

    Đặt các bộ mô tả CLI do kênh sở hữu trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong trợ giúp gốc mà không kích hoạt toàn bộ runtime của kênh,
    trong khi các lần tải đầy đủ thông thường vẫn lấy cùng các bộ mô tả đó để đăng ký lệnh thực sự.
    Giữ `registerFull(...)` cho công việc chỉ thuộc runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy dùng một
    tiền tố dành riêng cho Plugin. Các không gian tên quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải tới `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý việc tách chế độ đăng ký. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm một mục thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình hướng dẫn thiết lập:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải mục này thay cho mục đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Điều này tránh kéo mã runtime nặng vào trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace được đóng gói tách các export an toàn cho thiết lập vào các mô-đun phụ
    có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    trình đặt runtime tường minh tại thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn đến">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng tới
    OpenClaw. Mẫu điển hình là một Webhook xác minh yêu cầu và
    điều phối yêu cầu đó qua trình xử lý tin nhắn đến của kênh:

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
      Việc xử lý tin nhắn đến phụ thuộc vào từng kênh. Mỗi Plugin kênh sở hữu
      pipeline tin nhắn đến riêng của nó. Hãy xem các Plugin kênh được đóng gói
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để thấy các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Kiểm thử">
Viết các bài kiểm thử đặt cùng chỗ trong `src/channel.test.ts`:

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

    Để biết các trình trợ giúp kiểm thử dùng chung, xem [Kiểm thử](/vi/plugins/sdk-testing).

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
  <Card title="Trình trợ giúp runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, phương tiện, tác tử phụ qua api.runtime
  </Card>
</CardGroup>

<Note>
Một số ranh giới trợ giúp được đóng gói vẫn tồn tại để bảo trì Plugin được đóng gói và
khả năng tương thích. Chúng không phải là mẫu được khuyến nghị cho Plugin kênh mới;
hãy ưu tiên các đường dẫn con kênh/thiết lập/trả lời/runtime chung từ bề mặt SDK
chung, trừ khi bạn đang trực tiếp bảo trì họ Plugin được đóng gói đó.
</Note>

## Bước tiếp theo

- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) — nếu Plugin của bạn cũng cung cấp mô hình
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu import đường dẫn con đầy đủ
- [Kiểm thử SDK](/vi/plugins/sdk-testing) — tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest đầy đủ

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
