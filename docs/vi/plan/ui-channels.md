---
read_when:
    - Tái cấu trúc giao diện người dùng tin nhắn của kênh, dữ liệu tải tương tác hoặc trình kết xuất kênh gốc
    - Thay đổi khả năng của công cụ nhắn tin, gợi ý gửi, hoặc dấu đánh dấu giữa các ngữ cảnh
    - Gỡ lỗi fanout nhập Discord Carbon hoặc tính tải lười thời gian chạy của Plugin kênh
summary: Tách phần trình bày thông điệp ngữ nghĩa khỏi các bộ kết xuất giao diện người dùng gốc của kênh.
title: Kế hoạch tái cấu trúc phần trình bày kênh
x-i18n:
    generated_at: "2026-06-27T17:41:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Trạng thái

Đã triển khai cho các bề mặt agent dùng chung, CLI, năng lực Plugin và phân phối đi:

- `ReplyPayload.presentation` mang UI thông điệp theo ngữ nghĩa.
- `ReplyPayload.delivery.pin` mang yêu cầu ghim thông điệp đã gửi.
- Các hành động thông điệp dùng chung phơi bày `presentation`, `delivery` và `pin` thay vì `components`, `blocks`, `buttons` hoặc `card` gốc theo nhà cung cấp.
- Core kết xuất hoặc tự động hạ cấp presentation thông qua các năng lực gửi đi do Plugin khai báo.
- Các bộ kết xuất Discord, Slack, Telegram, Mattermost, MS Teams và Feishu sử dụng hợp đồng chung.
- Mã mặt phẳng điều khiển của kênh Discord không còn nhập các container UI dựa trên Carbon.

Tài liệu chuẩn hiện nằm ở [Trình bày thông điệp](/vi/plugins/message-presentation).
Giữ kế hoạch này làm ngữ cảnh triển khai lịch sử; cập nhật hướng dẫn chuẩn
khi hợp đồng, bộ kết xuất hoặc hành vi dự phòng thay đổi.

## Vấn đề

UI kênh hiện được chia giữa nhiều bề mặt không tương thích:

- Core sở hữu hook bộ kết xuất xuyên ngữ cảnh mang hình dạng Discord thông qua `buildCrossContextComponents`.
- `channel.ts` của Discord có thể nhập UI Carbon gốc thông qua `DiscordUiContainer`, kéo các phụ thuộc UI runtime vào mặt phẳng điều khiển của Plugin kênh.
- Agent và CLI phơi bày các lối thoát payload gốc như Discord `components`, Slack `blocks`, Telegram hoặc Mattermost `buttons`, và Teams hoặc Feishu `card`.
- `ReplyPayload.channelData` mang cả gợi ý truyền tải lẫn phong bì UI gốc.
- Mô hình `interactive` chung đã tồn tại, nhưng hẹp hơn các bố cục phong phú đang được Discord, Slack, Teams, Feishu, LINE, Telegram và Mattermost sử dụng.

Điều này khiến core biết về các hình dạng UI gốc, làm yếu tính lười tải runtime của Plugin và cho agent quá nhiều cách đặc thù theo nhà cung cấp để biểu đạt cùng một ý định thông điệp.

## Mục tiêu

- Core quyết định presentation theo ngữ nghĩa tốt nhất cho một thông điệp từ các năng lực đã khai báo.
- Phần mở rộng khai báo năng lực và kết xuất presentation theo ngữ nghĩa thành payload truyền tải gốc.
- Web Control UI vẫn tách biệt với UI gốc của chat.
- Payload kênh gốc không được phơi bày qua bề mặt thông điệp agent dùng chung hoặc CLI.
- Các tính năng presentation không được hỗ trợ tự động hạ cấp về biểu diễn văn bản tốt nhất.
- Hành vi phân phối như ghim một thông điệp đã gửi là siêu dữ liệu phân phối chung, không phải presentation.

## Không phải mục tiêu

- Không có shim tương thích ngược cho `buildCrossContextComponents`.
- Không có lối thoát gốc công khai cho `components`, `blocks`, `buttons` hoặc `card`.
- Không có import core từ các thư viện UI gốc của kênh.
- Không có seam SDK đặc thù theo nhà cung cấp cho các kênh đóng gói sẵn.

## Mô hình mục tiêu

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

`interactive` trở thành một tập con của `presentation` trong quá trình di chuyển:

- Khối văn bản `interactive` ánh xạ tới `presentation.blocks[].type = "text"`.
- Khối nút `interactive` ánh xạ tới `presentation.blocks[].type = "buttons"`.
- Khối chọn `interactive` ánh xạ tới `presentation.blocks[].type = "select"`.

Các schema agent bên ngoài và CLI hiện dùng `presentation`; `interactive` vẫn là helper phân tích/kết xuất legacy nội bộ cho các producer phản hồi hiện có.
API hướng tới producer công khai coi `interactive` là đã lỗi thời. Hỗ trợ runtime
vẫn còn để các helper phê duyệt hiện có và Plugin cũ tiếp tục hoạt động trong khi mã mới phát ra `presentation`.

## Siêu dữ liệu phân phối

Thêm trường `delivery` do core sở hữu cho hành vi gửi không phải UI.

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
- `required` mặc định là `false`; các kênh không được hỗ trợ hoặc việc ghim thất bại sẽ tự động hạ cấp bằng cách tiếp tục phân phối.
- Các hành động thông điệp `pin`, `unpin` và `list-pins` thủ công vẫn giữ cho các thông điệp hiện có.

Ràng buộc chủ đề Telegram ACP hiện tại nên chuyển từ `channelData.telegram.pin = true` sang `delivery.pin = true`.

## Hợp đồng năng lực runtime

Thêm hook kết xuất presentation và delivery vào bộ chuyển đổi gửi đi runtime, không phải Plugin kênh mặt phẳng điều khiển.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
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

- Phân giải kênh đích và bộ chuyển đổi runtime.
- Hỏi các năng lực presentation.
- Hạ cấp các khối không được hỗ trợ và áp dụng giới hạn năng lực chung trước khi
  kết xuất.
- Gọi `renderPresentation`.
- Nếu không có bộ kết xuất, chuyển presentation thành văn bản dự phòng.
- Sau khi gửi thành công, gọi `pinDeliveredMessage` khi `delivery.pin` được yêu cầu và được hỗ trợ.

## Ánh xạ kênh

Discord:

- Kết xuất `presentation` thành components v2 và container Carbon trong các mô-đun chỉ dành cho runtime.
- Giữ các helper màu nhấn trong mô-đun nhẹ.
- Xóa import `DiscordUiContainer` khỏi mã mặt phẳng điều khiển của Plugin kênh.

Slack:

- Kết xuất `presentation` thành Block Kit.
- Xóa đầu vào `blocks` của agent và CLI.

Telegram:

- Kết xuất văn bản, ngữ cảnh và đường phân cách thành văn bản.
- Kết xuất hành động và select thành bàn phím nội tuyến khi được cấu hình và được phép cho bề mặt đích.
- Dùng văn bản dự phòng khi nút nội tuyến bị tắt.
- Chuyển việc ghim chủ đề ACP sang `delivery.pin`.

Mattermost:

- Kết xuất hành động thành nút tương tác khi được cấu hình.
- Kết xuất các khối khác thành văn bản dự phòng.

MS Teams:

- Kết xuất `presentation` thành Adaptive Cards.
- Giữ các hành động thủ công pin/unpin/list-pins.
- Tùy chọn triển khai `pinDeliveredMessage` nếu hỗ trợ Graph đáng tin cậy cho cuộc trò chuyện đích.

Feishu:

- Kết xuất `presentation` thành thẻ tương tác.
- Giữ các hành động thủ công pin/unpin/list-pins.
- Tùy chọn triển khai `pinDeliveredMessage` để ghim thông điệp đã gửi nếu hành vi API đáng tin cậy.

LINE:

- Kết xuất `presentation` thành Flex hoặc thông điệp mẫu khi có thể.
- Dự phòng về văn bản cho các khối không được hỗ trợ.
- Xóa payload UI LINE khỏi `channelData`.

Kênh thuần văn bản hoặc bị giới hạn:

- Chuyển presentation thành văn bản với định dạng thận trọng.

## Các bước tái cấu trúc

1. Áp dụng lại bản sửa phát hành Discord tách `ui-colors.ts` khỏi UI dựa trên Carbon và xóa `DiscordUiContainer` khỏi `extensions/discord/src/channel.ts`.
2. Thêm `presentation` và `delivery` vào `ReplyPayload`, chuẩn hóa payload gửi đi, tóm tắt phân phối và payload hook.
3. Thêm schema `MessagePresentation` và helper phân tích trong một subpath SDK/runtime hẹp.
4. Thay thế các năng lực thông điệp `buttons`, `cards`, `components` và `blocks` bằng năng lực presentation theo ngữ nghĩa.
5. Thêm hook bộ chuyển đổi gửi đi runtime cho kết xuất presentation và ghim phân phối.
6. Thay thế việc xây dựng component xuyên ngữ cảnh bằng `buildCrossContextPresentation`.
7. Xóa `src/infra/outbound/channel-adapters.ts` và xóa `buildCrossContextComponents` khỏi kiểu Plugin kênh.
8. Đổi `maybeApplyCrossContextMarker` để đính kèm `presentation` thay vì tham số gốc.
9. Cập nhật đường gửi plugin-dispatch để chỉ sử dụng presentation theo ngữ nghĩa và siêu dữ liệu phân phối.
10. Xóa tham số payload gốc của agent và CLI: `components`, `blocks`, `buttons` và `card`.
11. Xóa các helper SDK tạo schema công cụ thông điệp gốc, thay bằng helper schema presentation.
12. Xóa phong bì UI/gốc khỏi `channelData`; chỉ giữ siêu dữ liệu truyền tải cho đến khi từng trường còn lại được xem xét.
13. Di chuyển các bộ kết xuất Discord, Slack, Telegram, Mattermost, MS Teams, Feishu và LINE.
14. Cập nhật tài liệu cho CLI thông điệp, trang kênh, Plugin SDK và cookbook năng lực.
15. Chạy lập hồ sơ fanout import cho Discord và các entrypoint kênh bị ảnh hưởng.

Các bước 1-11 và 13-14 đã được triển khai trong lần tái cấu trúc này cho các hợp đồng agent dùng chung, CLI, năng lực Plugin và bộ chuyển đổi gửi đi. Bước 12 vẫn là một lượt dọn dẹp nội bộ sâu hơn cho các phong bì truyền tải `channelData` riêng tư theo nhà cung cấp. Bước 15 vẫn là xác thực theo dõi nếu chúng ta muốn các số liệu fanout import định lượng ngoài cổng kiểu/kiểm thử.

## Kiểm thử

Thêm hoặc cập nhật:

- Kiểm thử chuẩn hóa presentation.
- Kiểm thử tự động hạ cấp presentation cho các khối không được hỗ trợ.
- Kiểm thử marker xuyên ngữ cảnh cho plugin dispatch và đường phân phối core.
- Kiểm thử ma trận kết xuất kênh cho Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE và văn bản dự phòng.
- Kiểm thử schema công cụ thông điệp chứng minh các trường gốc đã biến mất.
- Kiểm thử CLI chứng minh các cờ gốc đã biến mất.
- Hồi quy tính lười import entrypoint Discord bao phủ Carbon.
- Kiểm thử ghim phân phối bao phủ Telegram và dự phòng chung.

## Câu hỏi mở

- `delivery.pin` nên được triển khai cho Discord, Slack, MS Teams và Feishu trong lượt đầu, hay chỉ Telegram trước?
- `delivery` cuối cùng có nên hấp thụ các trường hiện có như `replyToId`, `replyToCurrent`, `silent` và `audioAsVoice`, hay vẫn tập trung vào hành vi sau khi gửi?
- Presentation có nên hỗ trợ trực tiếp hình ảnh hoặc tham chiếu tệp, hay media hiện vẫn nên tách biệt khỏi bố cục UI?

## Liên quan

- [Tổng quan kênh](/vi/channels)
- [Trình bày thông điệp](/vi/plugins/message-presentation)
