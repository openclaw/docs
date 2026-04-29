---
read_when:
    - Tái cấu trúc giao diện người dùng của tin nhắn kênh, tải trọng tương tác hoặc trình kết xuất kênh gốc
    - Thay đổi khả năng của công cụ nhắn tin, gợi ý chuyển phát hoặc dấu đánh dấu xuyên ngữ cảnh
    - Gỡ lỗi fanout import Discord Carbon hoặc cơ chế tải lười runtime của plugin kênh
summary: Tách phần trình bày tin nhắn theo ngữ nghĩa khỏi các bộ kết xuất giao diện người dùng gốc của kênh.
title: Kế hoạch tái cấu trúc cách trình bày kênh
x-i18n:
    generated_at: "2026-04-29T22:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Trạng thái

Đã triển khai cho các bề mặt agent dùng chung, CLI, khả năng Plugin và phân phối đi:

- `ReplyPayload.presentation` mang UI thông điệp ngữ nghĩa.
- `ReplyPayload.delivery.pin` mang các yêu cầu ghim thông điệp đã gửi.
- Các hành động thông điệp dùng chung hiển thị `presentation`, `delivery` và `pin` thay vì `components`, `blocks`, `buttons` hoặc `card` gốc của nhà cung cấp.
- Core hiển thị hoặc tự động giảm cấp presentation thông qua các khả năng gửi đi do plugin khai báo.
- Các renderer của Discord, Slack, Telegram, Mattermost, MS Teams và Feishu sử dụng hợp đồng chung.
- Mã control-plane của kênh Discord không còn nhập các container UI dựa trên Carbon.

Tài liệu chuẩn hiện nằm tại [Trình bày thông điệp](/vi/plugins/message-presentation).
Giữ kế hoạch này làm ngữ cảnh triển khai lịch sử; cập nhật hướng dẫn chuẩn
khi có thay đổi về hợp đồng, renderer hoặc hành vi fallback.

## Vấn đề

UI kênh hiện đang bị chia tách trên nhiều bề mặt không tương thích:

- Core sở hữu một hook renderer liên ngữ cảnh theo hình dạng Discord thông qua `buildCrossContextComponents`.
- `channel.ts` của Discord có thể nhập UI Carbon gốc thông qua `DiscordUiContainer`, kéo các phụ thuộc UI runtime vào control plane của plugin kênh.
- Agent và CLI hiển thị các lối thoát payload gốc như `components` của Discord, `blocks` của Slack, `buttons` của Telegram hoặc Mattermost, và `card` của Teams hoặc Feishu.
- `ReplyPayload.channelData` mang cả gợi ý transport lẫn phong bì UI gốc.
- Mô hình `interactive` chung đã tồn tại, nhưng hẹp hơn các layout phong phú đang được Discord, Slack, Teams, Feishu, LINE, Telegram và Mattermost sử dụng.

Điều này khiến core biết về các hình dạng UI gốc, làm suy yếu tính lazy của runtime plugin, và tạo cho agent quá nhiều cách phụ thuộc nhà cung cấp để diễn đạt cùng một ý định thông điệp.

## Mục tiêu

- Core quyết định presentation ngữ nghĩa tốt nhất cho một thông điệp dựa trên các khả năng đã khai báo.
- Các plugin khai báo khả năng và render presentation ngữ nghĩa thành payload transport gốc.
- Web Control UI vẫn tách biệt với UI gốc của chat.
- Payload kênh gốc không được hiển thị qua bề mặt thông điệp agent hoặc CLI dùng chung.
- Các tính năng presentation không được hỗ trợ tự động giảm cấp về biểu diễn văn bản tốt nhất.
- Hành vi phân phối như ghim thông điệp đã gửi là metadata phân phối chung, không phải presentation.

## Không phải mục tiêu

- Không có shim tương thích ngược cho `buildCrossContextComponents`.
- Không có lối thoát gốc công khai cho `components`, `blocks`, `buttons` hoặc `card`.
- Không có import core của thư viện UI gốc theo kênh.
- Không có seam SDK phụ thuộc nhà cung cấp cho các kênh đi kèm.

## Mô hình đích

Thêm trường `presentation` do core sở hữu vào `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` trở thành một tập con của `presentation` trong quá trình migration:

- Khối văn bản `interactive` ánh xạ tới `presentation.blocks[].type = "text"`.
- Khối nút `interactive` ánh xạ tới `presentation.blocks[].type = "buttons"`.
- Khối select `interactive` ánh xạ tới `presentation.blocks[].type = "select"`.

Schema agent bên ngoài và CLI hiện dùng `presentation`; `interactive` vẫn là helper parser/rendering legacy nội bộ cho các producer reply hiện có.

## Metadata phân phối

Thêm trường `delivery` do core sở hữu cho hành vi gửi không thuộc UI.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Ngữ nghĩa:

- `delivery.pin = true` nghĩa là ghim thông điệp đầu tiên được phân phối thành công.
- `notify` mặc định là `false`.
- `required` mặc định là `false`; các kênh không hỗ trợ hoặc thao tác ghim thất bại sẽ tự động giảm cấp bằng cách tiếp tục phân phối.
- Các hành động thông điệp thủ công `pin`, `unpin` và `list-pins` vẫn được giữ cho các thông điệp hiện có.

Liên kết chủ đề ACP hiện tại của Telegram nên chuyển từ `channelData.telegram.pin = true` sang `delivery.pin = true`.

## Hợp đồng khả năng runtime

Thêm các hook render presentation và delivery vào adapter outbound runtime, không phải plugin kênh control-plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Hành vi core:

- Phân giải kênh đích và adapter runtime.
- Hỏi các khả năng presentation.
- Giảm cấp các khối không được hỗ trợ trước khi render.
- Gọi `renderPresentation`.
- Nếu không có renderer, chuyển presentation thành fallback văn bản.
- Sau khi gửi thành công, gọi `pinDeliveredMessage` khi `delivery.pin` được yêu cầu và được hỗ trợ.

## Ánh xạ kênh

Discord:

- Render `presentation` thành components v2 và container Carbon trong các module chỉ dành cho runtime.
- Giữ helper màu nhấn trong các module nhẹ.
- Xóa import `DiscordUiContainer` khỏi mã control-plane của plugin kênh.

Slack:

- Render `presentation` thành Block Kit.
- Xóa input `blocks` của agent và CLI.

Telegram:

- Render văn bản, context và divider dưới dạng văn bản.
- Render action và select dưới dạng inline keyboard khi được cấu hình và được phép cho bề mặt đích.
- Dùng fallback văn bản khi inline button bị tắt.
- Chuyển ghim chủ đề ACP sang `delivery.pin`.

Mattermost:

- Render action dưới dạng nút tương tác khi được cấu hình.
- Render các khối khác dưới dạng fallback văn bản.

MS Teams:

- Render `presentation` thành Adaptive Cards.
- Giữ các hành động thủ công pin/unpin/list-pins.
- Tùy chọn triển khai `pinDeliveredMessage` nếu hỗ trợ Graph đáng tin cậy cho cuộc trò chuyện đích.

Feishu:

- Render `presentation` thành interactive cards.
- Giữ các hành động thủ công pin/unpin/list-pins.
- Tùy chọn triển khai `pinDeliveredMessage` để ghim thông điệp đã gửi nếu hành vi API đáng tin cậy.

LINE:

- Render `presentation` thành thông điệp Flex hoặc template khi có thể.
- Fallback về văn bản cho các khối không được hỗ trợ.
- Xóa payload UI LINE khỏi `channelData`.

Kênh plain hoặc hạn chế:

- Chuyển presentation thành văn bản với định dạng thận trọng.

## Các bước refactor

1. Áp dụng lại bản sửa release Discord tách `ui-colors.ts` khỏi UI dựa trên Carbon và xóa `DiscordUiContainer` khỏi `extensions/discord/src/channel.ts`.
2. Thêm `presentation` và `delivery` vào `ReplyPayload`, chuẩn hóa payload outbound, tóm tắt phân phối và payload hook.
3. Thêm schema `MessagePresentation` và helper parser trong một subpath SDK/runtime hẹp.
4. Thay các khả năng thông điệp `buttons`, `cards`, `components` và `blocks` bằng các khả năng presentation ngữ nghĩa.
5. Thêm hook adapter outbound runtime để render presentation và ghim delivery.
6. Thay việc dựng component liên ngữ cảnh bằng `buildCrossContextPresentation`.
7. Xóa `src/infra/outbound/channel-adapters.ts` và xóa `buildCrossContextComponents` khỏi loại plugin kênh.
8. Đổi `maybeApplyCrossContextMarker` để đính kèm `presentation` thay vì params gốc.
9. Cập nhật các đường gửi plugin-dispatch để chỉ sử dụng presentation ngữ nghĩa và metadata delivery.
10. Xóa params payload gốc của agent và CLI: `components`, `blocks`, `buttons` và `card`.
11. Xóa các helper SDK tạo schema message-tool gốc, thay bằng helper schema presentation.
12. Xóa phong bì UI/gốc khỏi `channelData`; chỉ giữ metadata transport cho đến khi từng trường còn lại được rà soát.
13. Migration các renderer Discord, Slack, Telegram, Mattermost, MS Teams, Feishu và LINE.
14. Cập nhật tài liệu cho CLI thông điệp, trang kênh, plugin SDK và cookbook khả năng.
15. Chạy profiling fanout import cho Discord và các entrypoint kênh bị ảnh hưởng.

Các bước 1-11 và 13-14 đã được triển khai trong refactor này cho agent dùng chung, CLI, khả năng plugin và hợp đồng adapter outbound. Bước 12 vẫn là một lượt dọn dẹp nội bộ sâu hơn cho các phong bì transport `channelData` riêng của nhà cung cấp. Bước 15 vẫn là xác thực tiếp theo nếu muốn có số liệu import-fanout định lượng ngoài gate kiểu/test.

## Kiểm thử

Thêm hoặc cập nhật:

- Kiểm thử chuẩn hóa presentation.
- Kiểm thử tự động giảm cấp presentation cho các khối không được hỗ trợ.
- Kiểm thử marker liên ngữ cảnh cho plugin dispatch và các đường delivery core.
- Kiểm thử ma trận renderer kênh cho Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE và fallback văn bản.
- Kiểm thử schema công cụ thông điệp chứng minh các trường gốc đã biến mất.
- Kiểm thử CLI chứng minh các cờ gốc đã biến mất.
- Kiểm thử hồi quy import-laziness entrypoint Discord bao phủ Carbon.
- Kiểm thử ghim delivery bao phủ Telegram và fallback chung.

## Câu hỏi mở

- `delivery.pin` nên được triển khai cho Discord, Slack, MS Teams và Feishu trong lượt đầu, hay chỉ Telegram trước?
- `delivery` cuối cùng có nên hấp thụ các trường hiện có như `replyToId`, `replyToCurrent`, `silent` và `audioAsVoice`, hay vẫn tập trung vào các hành vi sau khi gửi?
- Presentation có nên hỗ trợ trực tiếp hình ảnh hoặc tham chiếu tệp, hay hiện tại media nên vẫn tách biệt khỏi layout UI?

## Liên quan

- [Tổng quan kênh](/vi/channels)
- [Trình bày thông điệp](/vi/plugins/message-presentation)
