---
read_when:
    - Bạn đang xây dựng một Plugin kênh nhắn tin mới
    - Bạn muốn kết nối OpenClaw với một nền tảng nhắn tin
    - Bạn cần hiểu bề mặt bộ điều hợp ChannelPlugin
sidebarTitle: Channel Plugins
summary: Hướng dẫn từng bước để xây dựng Plugin kênh nhắn tin cho OpenClaw
title: Xây dựng Plugin kênh
x-i18n:
    generated_at: "2026-06-27T17:57:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Hướng dẫn này trình bày cách xây dựng một Plugin kênh kết nối OpenClaw với một
nền tảng nhắn tin. Đến cuối hướng dẫn, bạn sẽ có một kênh hoạt động với bảo mật
DM, ghép đôi, phân luồng trả lời và gửi tin nhắn đi.

<Info>
  Nếu bạn chưa từng xây dựng Plugin OpenClaw nào trước đây, hãy đọc
  [Bắt đầu](/vi/plugins/building-plugins) trước để nắm cấu trúc gói cơ bản
  và cách thiết lập manifest.
</Info>

## Cách Plugin kênh hoạt động

Plugin kênh không cần có công cụ gửi/chỉnh sửa/phản ứng riêng. OpenClaw giữ một
công cụ `message` dùng chung trong core. Plugin của bạn sở hữu:

- **Cấu hình** - phân giải tài khoản và trình hướng dẫn thiết lập
- **Bảo mật** - chính sách DM và danh sách cho phép
- **Ghép đôi** - luồng phê duyệt DM
- **Ngữ pháp phiên** - cách các id cuộc trò chuyện riêng theo provider ánh xạ tới cuộc trò chuyện gốc, id luồng và các phương án dự phòng cha
- **Gửi đi** - gửi văn bản, phương tiện và cuộc thăm dò tới nền tảng
- **Phân luồng** - cách các phản hồi được phân luồng
- **Heartbeat typing** - tín hiệu đang nhập/bận tùy chọn cho các đích phân phối Heartbeat

Core sở hữu công cụ tin nhắn dùng chung, nối dây prompt, hình dạng khóa phiên
bên ngoài, ghi chép sổ sách `:thread:` chung và điều phối.

Các Plugin kênh mới cũng nên công khai một adapter `message` bằng
`defineChannelMessageAdapter` từ `openclaw/plugin-sdk/channel-outbound`. Adapter
khai báo các khả năng gửi cuối bền vững mà transport gốc thực sự hỗ trợ và trỏ
các lần gửi văn bản/phương tiện tới cùng các hàm transport như adapter
`outbound` cũ. Chỉ khai báo một khả năng khi test hợp đồng chứng minh được tác
dụng phụ phía gốc và biên nhận trả về.
Để xem hợp đồng API đầy đủ, ví dụ, ma trận khả năng, quy tắc biên nhận, hoàn tất
bản xem trước trực tiếp, chính sách ack nhận, test và bảng di trú, hãy xem
[API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).
Nếu adapter `outbound` hiện có đã có đúng các phương thức gửi và metadata khả
năng, hãy dùng `createChannelMessageAdapterFromOutbound(...)` để dẫn xuất
adapter `message` thay vì viết tay một cầu nối khác.
Các lần gửi của adapter nên trả về giá trị `MessageReceipt`. Khi mã tương thích
vẫn cần id cũ, hãy dẫn xuất chúng bằng `listMessageReceiptPlatformIds(...)`
hoặc `resolveMessageReceiptPrimaryId(...)` thay vì giữ các trường
`messageIds` song song trong mã vòng đời mới.
Các kênh hỗ trợ bản xem trước cũng nên khai báo `message.live.capabilities` với
vòng đời trực tiếp chính xác mà chúng sở hữu, chẳng hạn như `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` hoặc
`quietFinalization`. Các kênh hoàn tất bản xem trước nháp tại chỗ cũng nên khai
báo `message.live.finalizer.capabilities`, chẳng hạn như `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` và
`retainOnAmbiguousFailure`, đồng thời định tuyến logic runtime qua
`defineFinalizableLivePreviewAdapter(...)` cùng
`deliverWithFinalizableLivePreviewAdapter(...)`. Giữ các khả năng đó được chống
đỡ bằng các test `verifyChannelMessageLiveCapabilityAdapterProofs(...)` và
`verifyChannelMessageLiveFinalizerProofs(...)` để hành vi bản xem trước gốc,
tiến trình, chỉnh sửa, dự phòng/giữ lại, dọn dẹp và biên nhận không thể âm thầm
trôi lệch.
Các bộ nhận đầu vào trì hoãn xác nhận của nền tảng nên khai báo
`message.receive.defaultAckPolicy` và `supportedAckPolicies` thay vì che giấu
thời điểm ack trong trạng thái cục bộ của monitor. Bao phủ mọi chính sách đã
khai báo bằng `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Các helper trả lời cũ như `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` và `recordInboundSessionAndDispatchReply` vẫn
khả dụng cho các dispatcher tương thích. Không dùng những tên đó cho mã kênh
mới; Plugin mới nên bắt đầu với adapter `message`, biên nhận và các helper vòng
đời nhận/gửi trên `openclaw/plugin-sdk/channel-outbound`.

Các kênh đang di trú phân quyền đầu vào có thể dùng subpath thử nghiệm
`openclaw/plugin-sdk/channel-ingress-runtime` từ các đường dẫn nhận runtime.
Subpath này giữ việc tra cứu nền tảng và tác dụng phụ trong Plugin, đồng thời
chia sẻ phân giải trạng thái danh sách cho phép, quyết định route/người
gửi/lệnh/sự kiện/kích hoạt, chẩn đoán đã biên tập và ánh xạ chấp nhận lượt. Giữ
chuẩn hóa danh tính Plugin trong descriptor bạn truyền cho resolver; không
serialize các giá trị khớp thô từ trạng thái hoặc quyết định đã phân giải. Xem
[API đầu vào của kênh](/vi/plugins/sdk-channel-ingress) để biết thiết kế API,
ranh giới sở hữu và kỳ vọng test.

Nếu kênh của bạn hỗ trợ chỉ báo đang nhập ngoài các phản hồi đầu vào, hãy công
khai `heartbeat.sendTyping(...)` trên Plugin kênh. Core gọi nó với đích phân
phối Heartbeat đã phân giải trước khi lần chạy mô hình Heartbeat bắt đầu và sử
dụng vòng đời keepalive/dọn dẹp trạng thái đang nhập dùng chung. Thêm
`heartbeat.clearTyping(...)` khi nền tảng cần tín hiệu dừng rõ ràng.

Nếu kênh của bạn thêm tham số công cụ tin nhắn mang nguồn phương tiện, hãy công
khai các tên tham số đó qua `describeMessageTool(...).mediaSourceParams`. Core
dùng danh sách rõ ràng đó để chuẩn hóa đường dẫn sandbox và chính sách truy cập
phương tiện gửi đi, nên Plugin không cần các trường hợp đặc biệt trong
shared-core cho tham số avatar, tệp đính kèm hoặc ảnh bìa riêng theo provider.
Ưu tiên trả về một map theo khóa hành động như
`{ "set-profile": ["avatarUrl", "avatarPath"] }` để các hành động không liên
quan không kế thừa đối số phương tiện của hành động khác. Mảng phẳng vẫn hoạt
động cho các tham số được chủ ý chia sẻ trên mọi hành động đã công khai.
Các kênh phải công khai URL tạm thời để nền tảng phía ngoài tìm nạp phương tiện
có thể dùng `createHostedOutboundMediaStore(...)` từ
`openclaw/plugin-sdk/outbound-media` với kho trạng thái Plugin. Giữ việc phân
tích route nền tảng và thực thi token trong Plugin kênh; helper dùng chung chỉ
sở hữu việc tải phương tiện, metadata hết hạn, các hàng chunk và dọn dẹp.

Nếu kênh của bạn cần định hình riêng theo provider cho `message(action="send")`,
hãy ưu tiên `actions.prepareSendPayload(...)`. Đặt thẻ gốc, block, embed hoặc
dữ liệu bền vững khác dưới `payload.channelData.<channel>` và để core thực hiện
lần gửi thật qua adapter outbound/message. Chỉ dùng `actions.handleAction(...)`
cho gửi như một phương án dự phòng tương thích đối với payload không thể
serialize và thử lại.

Nếu nền tảng của bạn lưu phạm vi bổ sung bên trong id cuộc trò chuyện, hãy giữ
việc phân tích đó trong Plugin với `messaging.resolveSessionConversation(...)`.
Đó là hook chuẩn để ánh xạ `rawId` tới id cuộc trò chuyện gốc, id luồng tùy
chọn, `baseConversationId` rõ ràng và bất kỳ
`parentConversationCandidates` nào. Khi trả về `parentConversationCandidates`,
hãy giữ chúng được sắp xếp từ cha hẹp nhất tới cuộc trò chuyện rộng nhất/gốc.

Dùng `openclaw/plugin-sdk/channel-route` khi mã Plugin cần chuẩn hóa các trường
giống route, so sánh một luồng con với route cha của nó hoặc xây dựng khóa khử
trùng lặp ổn định từ `{ channel, to, accountId, threadId }`. Helper chuẩn hóa
id luồng dạng số giống như core, nên Plugin nên ưu tiên nó thay cho các phép so
sánh tùy biến `String(threadId)`.
Các Plugin có ngữ pháp đích riêng theo provider nên công khai
`messaging.resolveOutboundSessionRoute(...)` để core nhận được danh tính phiên
và luồng gốc của provider mà không dùng shim phân tích.

Các Plugin bundled cần cùng cách phân tích trước khi registry kênh khởi động
cũng có thể công khai một tệp cấp cao nhất `session-key-api.ts` với export
`resolveSessionConversation(...)` khớp. Core chỉ dùng bề mặt an toàn cho
bootstrap đó khi registry Plugin runtime chưa khả dụng.

`messaging.resolveParentConversationCandidates(...)` vẫn khả dụng như một
phương án dự phòng tương thích cũ khi Plugin chỉ cần các phương án dự phòng cha
trên id chung/thô. Nếu cả hai hook tồn tại, core dùng
`resolveSessionConversation(...).parentConversationCandidates` trước và chỉ dự
phòng sang `resolveParentConversationCandidates(...)` khi hook chuẩn bỏ qua
chúng.

## Phê duyệt và khả năng của kênh

Hầu hết Plugin kênh không cần mã riêng cho phê duyệt.

- Lõi sở hữu `/approve` trong cùng cuộc trò chuyện, payload nút phê duyệt dùng chung và cơ chế gửi dự phòng chung.

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, và
  `openclaw/plugin-sdk/account-helpers` cho cấu hình nhiều tài khoản và
  phương án dự phòng tài khoản mặc định
- `openclaw/plugin-sdk/inbound-envelope` và
  `openclaw/plugin-sdk/channel-inbound` cho tuyến/phong bì đầu vào và
  nối dây ghi-và-điều-phối
- `openclaw/plugin-sdk/channel-targets` cho các trình trợ giúp phân tích đích
- `openclaw/plugin-sdk/outbound-media` cho việc tải phương tiện và
  `openclaw/plugin-sdk/channel-outbound` cho danh tính đầu ra/các delegate gửi
  và lập kế hoạch payload
- `buildThreadAwareOutboundSessionRoute(...)` từ
  `openclaw/plugin-sdk/channel-core` khi một tuyến đầu ra cần giữ nguyên một
  `replyToId`/`threadId` tường minh hoặc khôi phục phiên `:thread:` hiện tại
  sau khi khóa phiên cơ sở vẫn khớp. Provider plugins có thể ghi đè
  độ ưu tiên, hành vi hậu tố và chuẩn hóa mã định danh luồng khi nền tảng của
  chúng có ngữ nghĩa gửi luồng gốc.
- `openclaw/plugin-sdk/thread-bindings-runtime` cho vòng đời liên kết luồng
  và đăng ký adapter
- `openclaw/plugin-sdk/agent-media-payload` chỉ khi vẫn cần bố cục trường payload
  tác tử/phương tiện legacy
- `openclaw/plugin-sdk/telegram-command-config` cho chuẩn hóa lệnh tùy chỉnh
  Telegram, xác thực trùng lặp/xung đột và hợp đồng cấu hình lệnh ổn định khi
  dự phòng

Các kênh chỉ-xác-thực thường có thể dừng ở đường dẫn mặc định: core xử lý phê duyệt và plugin chỉ cần phơi bày các khả năng đầu ra/xác thực. Các kênh phê duyệt gốc như Matrix, Slack, Telegram và các phương tiện chat tùy chỉnh nên dùng các trình trợ giúp gốc dùng chung thay vì tự triển khai vòng đời phê duyệt.

## Chính sách nhắc đến đầu vào

Giữ việc xử lý nhắc đến đầu vào tách thành hai lớp:

- thu thập bằng chứng do plugin sở hữu
- đánh giá chính sách dùng chung

Dùng `openclaw/plugin-sdk/channel-mention-gating` cho các quyết định chính sách nhắc đến.
Chỉ dùng `openclaw/plugin-sdk/channel-inbound` khi bạn cần barrel trình trợ giúp đầu vào
rộng hơn.

Phù hợp cho logic cục bộ của plugin:

- phát hiện trả lời bot
- phát hiện trích dẫn bot
- kiểm tra tham gia luồng
- loại trừ tin nhắn dịch vụ/hệ thống
- bộ nhớ đệm gốc của nền tảng cần thiết để chứng minh bot đã tham gia

Phù hợp cho trình trợ giúp dùng chung:

- `requireMention`
- kết quả nhắc đến tường minh
- danh sách cho phép nhắc đến ngầm định
- bỏ qua theo lệnh
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

`api.runtime.channel.mentions` phơi bày cùng các trình trợ giúp nhắc đến dùng chung cho
các channel plugins đi kèm vốn đã phụ thuộc vào tiêm runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Nếu bạn chỉ cần `implicitMentionKindWhen` và
`resolveInboundMentionDecision`, hãy nhập từ
`openclaw/plugin-sdk/channel-mention-gating` để tránh tải các trình trợ giúp runtime
đầu vào không liên quan.

Dùng `resolveInboundMentionDecision({ facts, policy })` cho cổng nhắc đến.

## Hướng dẫn từng bước

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Gói và manifest">
    Tạo các tệp plugin chuẩn. Trường `channel` trong `package.json` là thứ
    khiến đây trở thành một channel plugin. Để xem toàn bộ bề mặt siêu dữ liệu gói,
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
    các cài đặt do plugin sở hữu không phải là cấu hình tài khoản kênh. `channelConfigs`
    xác thực `channels.acme-chat` và là nguồn đường dẫn lạnh được dùng bởi schema
    cấu hình, thiết lập và các bề mặt UI trước khi runtime plugin tải.

  </Step>

  <Step title="Xây dựng đối tượng channel plugin">
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

    Với các kênh chấp nhận cả khóa DM cấp cao nhất chuẩn và khóa lồng nhau legacy, hãy dùng các trình trợ giúp từ `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, và `normalizeChannelDmPolicy` giữ các giá trị cục bộ theo tài khoản đứng trước các giá trị gốc được kế thừa. Ghép cùng trình phân giải đó với sửa chữa doctor thông qua `normalizeLegacyDmAliases` để runtime và migration đọc cùng một hợp đồng.

    <Accordion title="createChatChannelPlugin làm gì cho bạn">
      Thay vì tự triển khai các giao diện adapter cấp thấp, bạn truyền
      các tùy chọn khai báo và builder sẽ kết hợp chúng:

      | Tùy chọn | Nội dung được nối dây |
      | --- | --- |
      | `security.dm` | Trình phân giải bảo mật DM có phạm vi từ các trường cấu hình |
      | `pairing.text` | Luồng ghép đôi DM dựa trên văn bản với trao đổi mã |
      | `threading` | Trình phân giải chế độ trả lời (cố định, theo phạm vi tài khoản hoặc tùy chỉnh) |
      | `outbound.attachedResults` | Các hàm gửi trả về siêu dữ liệu kết quả (mã định danh tin nhắn) |

      Bạn cũng có thể truyền trực tiếp các đối tượng adapter thô thay cho các tùy chọn khai báo
      nếu cần toàn quyền kiểm soát.

      Adapter đầu ra thô có thể định nghĩa hàm `chunker(text, limit, ctx)`.
      `ctx.formatting` tùy chọn mang các quyết định định dạng tại thời điểm gửi
      như `maxLinesPerMessage`; áp dụng nó trước khi gửi để luồng trả lời
      và ranh giới phân đoạn được giải quyết một lần bởi cơ chế gửi đầu ra dùng chung.
      Ngữ cảnh gửi cũng bao gồm `replyToIdSource` (`implicit` hoặc `explicit`)
      khi đã phân giải được đích trả lời gốc, để các trình trợ giúp payload có thể giữ nguyên
      thẻ trả lời tường minh mà không tiêu thụ một ô trả lời ngầm định dùng một lần.
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

    Đặt các mô tả CLI do kênh sở hữu trong `registerCliMetadata(...)` để OpenClaw
    có thể hiển thị chúng trong trợ giúp gốc mà không kích hoạt toàn bộ runtime của kênh,
    trong khi các lần tải đầy đủ thông thường vẫn nhận cùng các mô tả đó để đăng ký lệnh
    thực tế. Giữ `registerFull(...)` cho công việc chỉ dành cho runtime.
    Nếu `registerFull(...)` đăng ký các phương thức RPC của Gateway, hãy dùng một
    tiền tố riêng cho Plugin. Các namespace quản trị lõi (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn
    phân giải thành `operator.admin`.
    `defineChannelPluginEntry` tự động xử lý phần tách chế độ đăng ký. Xem
    [Điểm vào](/vi/plugins/sdk-entrypoints#definechannelpluginentry) để biết tất cả
    tùy chọn.

  </Step>

  <Step title="Thêm một mục thiết lập">
    Tạo `setup-entry.ts` để tải nhẹ trong quá trình onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw tải mục này thay vì mục đầy đủ khi kênh bị tắt
    hoặc chưa được cấu hình. Nó tránh kéo mã runtime nặng vào trong các luồng thiết lập.
    Xem [Thiết lập và cấu hình](/vi/plugins/sdk-setup#setup-entry) để biết chi tiết.

    Các kênh workspace đóng gói tách export an toàn cho thiết lập vào các module
    phụ có thể dùng `defineBundledChannelSetupEntry(...)` từ
    `openclaw/plugin-sdk/channel-entry-contract` khi chúng cũng cần một
    setter runtime rõ ràng ở thời điểm thiết lập.

  </Step>

  <Step title="Xử lý tin nhắn đến">
    Plugin của bạn cần nhận tin nhắn từ nền tảng và chuyển tiếp chúng đến
    OpenClaw. Mẫu thường dùng là một Webhook xác minh yêu cầu và
    điều phối yêu cầu đó qua trình xử lý tin nhắn đến của kênh:

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
      Việc xử lý tin nhắn đến là riêng cho từng kênh. Mỗi Plugin kênh sở hữu
      pipeline tin nhắn đến của riêng nó. Hãy xem các Plugin kênh đóng gói
      (ví dụ gói Plugin Microsoft Teams hoặc Google Chat) để thấy các mẫu thực tế.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Kiểm thử">
Viết các kiểm thử colocated trong `src/channel.test.ts`:

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

    Để dùng các helper kiểm thử chung, xem [Kiểm thử](/vi/plugins/sdk-testing).

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
    Các chế độ trả lời cố định, theo phạm vi tài khoản hoặc tùy chỉnh
  </Card>
  <Card title="Tích hợp công cụ nhắn tin" icon="puzzle" href="/vi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool và khám phá hành động
  </Card>
  <Card title="Phân giải đích" icon="crosshair" href="/vi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, STT, media, subagent qua api.runtime
  </Card>
  <Card title="API tin nhắn đến của kênh" icon="bolt" href="/vi/plugins/sdk-channel-inbound">
    Vòng đời sự kiện tin nhắn đến dùng chung: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Một số seam helper đóng gói vẫn tồn tại để bảo trì và tương thích với Plugin đóng gói.
Chúng không phải là mẫu được khuyến nghị cho các Plugin kênh mới;
hãy ưu tiên các subpath channel/setup/reply/runtime chung từ bề mặt SDK
chung, trừ khi bạn đang trực tiếp bảo trì họ Plugin đóng gói đó.
</Note>

## Bước tiếp theo

- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - nếu Plugin của bạn cũng cung cấp model
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu import subpath đầy đủ
- [Kiểm thử SDK](/vi/plugins/sdk-testing) - tiện ích kiểm thử và kiểm thử hợp đồng
- [Manifest Plugin](/vi/plugins/manifest) - schema manifest đầy đủ

## Liên quan

- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin agent harness](/vi/plugins/sdk-agent-harness)
