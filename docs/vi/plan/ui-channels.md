---
read_when:
    - Tái cấu trúc giao diện người dùng tin nhắn kênh, payload tương tác hoặc trình kết xuất kênh gốc
    - Thay đổi khả năng của công cụ nhắn tin, gợi ý gửi tin hoặc dấu hiệu liên ngữ cảnh
    - Gỡ lỗi việc phân tán nhập Discord Carbon hoặc cơ chế tải lười khi chạy Plugin kênh
summary: Tách biệt phần trình bày thông điệp theo ngữ nghĩa khỏi các trình kết xuất giao diện người dùng gốc của kênh.
title: Kế hoạch tái cấu trúc cách trình bày kênh
x-i18n:
    generated_at: "2026-07-12T08:03:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Trạng thái

Đã triển khai cho các bề mặt agent dùng chung, CLI, khả năng Plugin và gửi đi:

- `ReplyPayload.presentation` mang giao diện người dùng tin nhắn theo ngữ nghĩa.
- `ReplyPayload.delivery.pin` mang yêu cầu ghim tin nhắn đã gửi.
- Các hành động tin nhắn dùng chung cung cấp `presentation`, `delivery` và `pin` thay vì `components`, `blocks`, `buttons` hoặc `card` đặc thù của nhà cung cấp.
- Lõi kết xuất hoặc tự động hạ cấp phần trình bày thông qua các khả năng gửi đi do Plugin khai báo.
- Các bộ kết xuất Discord, Slack, Telegram, Mattermost, MS Teams và Feishu sử dụng hợp đồng chung.
- Mã mặt phẳng điều khiển kênh Discord không còn nhập các vùng chứa giao diện người dùng dựa trên Carbon.

Tài liệu chuẩn hiện nằm tại [Trình bày tin nhắn](/vi/plugins/message-presentation).
Giữ kế hoạch này làm bối cảnh triển khai lịch sử; hãy cập nhật hướng dẫn chuẩn
khi có thay đổi về hợp đồng, bộ kết xuất hoặc hành vi dự phòng.

## Vấn đề

Giao diện người dùng của kênh hiện được chia thành nhiều bề mặt không tương thích:

- Lõi sở hữu một móc bộ kết xuất xuyên ngữ cảnh theo hình dạng Discord thông qua `buildCrossContextComponents`.
- `channel.ts` của Discord có thể nhập giao diện người dùng Carbon nguyên bản thông qua `DiscordUiContainer`, kéo các phần phụ thuộc giao diện người dùng lúc chạy vào mặt phẳng điều khiển Plugin kênh.
- Agent và CLI cung cấp các lối thoát tải trọng nguyên bản như `components` của Discord, `blocks` của Slack, `buttons` của Telegram hoặc Mattermost và `card` của Teams hoặc Feishu.
- `ReplyPayload.channelData` mang cả gợi ý vận chuyển lẫn các vỏ bọc giao diện người dùng nguyên bản.
- Mô hình `interactive` tổng quát đã tồn tại, nhưng hẹp hơn các bố cục phong phú đang được Discord, Slack, Teams, Feishu, LINE, Telegram và Mattermost sử dụng.

Điều này khiến lõi phải biết các hình dạng giao diện người dùng nguyên bản, làm suy yếu cơ chế tải lười của thời gian chạy Plugin và cung cấp cho agent quá nhiều cách đặc thù theo nhà cung cấp để biểu đạt cùng một ý định tin nhắn.

## Mục tiêu

- Lõi quyết định cách trình bày theo ngữ nghĩa tốt nhất cho tin nhắn dựa trên các khả năng đã khai báo.
- Các phần mở rộng khai báo khả năng và kết xuất phần trình bày theo ngữ nghĩa thành tải trọng vận chuyển nguyên bản.
- Giao diện người dùng Điều khiển Web vẫn tách biệt với giao diện người dùng trò chuyện nguyên bản.
- Tải trọng kênh nguyên bản không được cung cấp qua bề mặt tin nhắn dùng chung của agent hoặc CLI.
- Các tính năng trình bày không được hỗ trợ sẽ tự động hạ cấp thành dạng văn bản tốt nhất.
- Hành vi gửi như ghim tin nhắn đã gửi là siêu dữ liệu gửi chung, không phải phần trình bày.

## Không phải mục tiêu

- Không có lớp tương thích ngược cho `buildCrossContextComponents`.
- Không có lối thoát nguyên bản công khai cho `components`, `blocks`, `buttons` hoặc `card`.
- Lõi không nhập thư viện giao diện người dùng nguyên bản của kênh.
- Không có bề mặt SDK đặc thù theo nhà cung cấp cho các kênh đi kèm.

## Mô hình đích

Thêm trường `presentation` do lõi sở hữu vào `ReplyPayload`.

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

Trong quá trình di chuyển, `interactive` trở thành một tập con của `presentation`:

- Khối văn bản `interactive` ánh xạ tới `presentation.blocks[].type = "text"`.
- Khối nút `interactive` ánh xạ tới `presentation.blocks[].type = "buttons"`.
- Khối chọn `interactive` ánh xạ tới `presentation.blocks[].type = "select"`.

Các lược đồ agent bên ngoài và CLI hiện sử dụng `presentation`; `interactive` vẫn là trình trợ giúp phân tích cú pháp/kết xuất nội bộ cũ dành cho các trình tạo phản hồi hiện có.
API công khai dành cho trình tạo coi `interactive` là không còn được khuyến nghị. Hỗ trợ
lúc chạy vẫn được duy trì để các trình trợ giúp phê duyệt hiện có và Plugin cũ tiếp tục
hoạt động, trong khi mã mới phát ra `presentation`.

## Siêu dữ liệu gửi

Thêm trường `delivery` do lõi sở hữu cho hành vi gửi không thuộc giao diện người dùng.

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

- `delivery.pin = true` có nghĩa là ghim tin nhắn đầu tiên được gửi thành công.
- `notify` mặc định là `false`.
- `required` mặc định là `false`; các kênh không được hỗ trợ hoặc việc ghim thất bại sẽ tự động hạ cấp bằng cách tiếp tục gửi.
- Các hành động tin nhắn `pin`, `unpin` và `list-pins` thủ công vẫn được giữ lại cho những tin nhắn hiện có.

Liên kết chủ đề ACP của Telegram hiện tại nên chuyển từ `channelData.telegram.pin = true` sang `delivery.pin = true`.

## Hợp đồng khả năng lúc chạy

Thêm các móc kết xuất phần trình bày và gửi vào bộ điều hợp gửi đi lúc chạy, không phải Plugin kênh mặt phẳng điều khiển.

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

Hành vi của lõi:

- Phân giải kênh đích và bộ điều hợp lúc chạy.
- Truy vấn các khả năng trình bày.
- Hạ cấp các khối không được hỗ trợ và áp dụng các giới hạn khả năng chung trước khi
  kết xuất.
- Gọi `renderPresentation`.
- Nếu không có bộ kết xuất, chuyển phần trình bày thành văn bản dự phòng.
- Sau khi gửi thành công, gọi `pinDeliveredMessage` khi `delivery.pin` được yêu cầu và được hỗ trợ.

## Ánh xạ kênh

Discord:

- Kết xuất `presentation` thành các thành phần v2 và vùng chứa Carbon trong các mô-đun chỉ dành cho lúc chạy.
- Giữ các trình trợ giúp màu nhấn trong các mô-đun nhẹ.
- Xóa các lệnh nhập `DiscordUiContainer` khỏi mã mặt phẳng điều khiển Plugin kênh.

Slack:

- Kết xuất `presentation` thành Block Kit.
- Xóa đầu vào `blocks` của agent và CLI.

Telegram:

- Kết xuất văn bản, ngữ cảnh và đường phân cách dưới dạng văn bản.
- Kết xuất hành động và lựa chọn thành bàn phím nội tuyến khi đã được cấu hình và cho phép trên bề mặt đích.
- Sử dụng văn bản dự phòng khi các nút nội tuyến bị tắt.
- Chuyển việc ghim chủ đề ACP sang `delivery.pin`.

Mattermost:

- Kết xuất hành động thành các nút tương tác khi đã được cấu hình.
- Kết xuất các khối khác thành văn bản dự phòng.

MS Teams:

- Kết xuất `presentation` thành Adaptive Cards.
- Giữ các hành động ghim/bỏ ghim/liệt kê ghim thủ công.
- Có thể triển khai `pinDeliveredMessage` nếu hỗ trợ Graph đáng tin cậy đối với cuộc hội thoại đích.

Feishu:

- Kết xuất `presentation` thành các thẻ tương tác.
- Giữ các hành động ghim/bỏ ghim/liệt kê ghim thủ công.
- Có thể triển khai `pinDeliveredMessage` để ghim tin nhắn đã gửi nếu hành vi API đáng tin cậy.

LINE:

- Kết xuất `presentation` thành tin nhắn Flex hoặc mẫu nếu có thể.
- Dùng văn bản dự phòng cho các khối không được hỗ trợ.
- Xóa tải trọng giao diện người dùng LINE khỏi `channelData`.

Các kênh thuần văn bản hoặc bị hạn chế:

- Chuyển phần trình bày thành văn bản với định dạng thận trọng.

## Các bước tái cấu trúc

1. Áp dụng lại bản sửa lỗi phát hành Discord để tách `ui-colors.ts` khỏi giao diện người dùng dựa trên Carbon và xóa `DiscordUiContainer` khỏi `extensions/discord/src/channel.ts`.
2. Thêm `presentation` và `delivery` vào `ReplyPayload`, quá trình chuẩn hóa tải trọng gửi đi, bản tóm tắt gửi và tải trọng móc.
3. Thêm lược đồ `MessagePresentation` và các trình trợ giúp phân tích cú pháp trong một đường dẫn con SDK/thời gian chạy hẹp.
4. Thay thế các khả năng tin nhắn `buttons`, `cards`, `components` và `blocks` bằng khả năng trình bày theo ngữ nghĩa.
5. Thêm các móc bộ điều hợp gửi đi lúc chạy để kết xuất phần trình bày và ghim khi gửi.
6. Thay thế việc xây dựng thành phần xuyên ngữ cảnh bằng `buildCrossContextPresentation`.
7. Xóa `src/infra/outbound/channel-adapters.ts` và loại bỏ `buildCrossContextComponents` khỏi các kiểu Plugin kênh.
8. Thay đổi `maybeApplyCrossContextMarker` để đính kèm `presentation` thay vì các tham số nguyên bản.
9. Cập nhật các đường dẫn gửi điều phối Plugin để chỉ sử dụng phần trình bày theo ngữ nghĩa và siêu dữ liệu gửi.
10. Xóa các tham số tải trọng nguyên bản của agent và CLI: `components`, `blocks`, `buttons` và `card`.
11. Xóa các trình trợ giúp SDK tạo lược đồ công cụ tin nhắn nguyên bản, thay thế bằng các trình trợ giúp lược đồ trình bày.
12. Xóa các vỏ bọc giao diện người dùng/nguyên bản khỏi `channelData`; chỉ giữ siêu dữ liệu vận chuyển cho đến khi từng trường còn lại được xem xét.
13. Di chuyển các bộ kết xuất Discord, Slack, Telegram, Mattermost, MS Teams, Feishu và LINE.
14. Cập nhật tài liệu cho CLI tin nhắn, các trang kênh, SDK Plugin và sách hướng dẫn khả năng.
15. Chạy lập hồ sơ phạm vi nhập cho Discord và các điểm vào kênh bị ảnh hưởng.

Các bước 1-11 và 13-14 đã được triển khai trong lần tái cấu trúc này cho các hợp đồng agent dùng chung, CLI, khả năng Plugin và bộ điều hợp gửi đi. Bước 12 vẫn là một lượt dọn dẹp nội bộ sâu hơn cho các vỏ bọc vận chuyển `channelData` riêng của nhà cung cấp. Bước 15 vẫn là phần xác thực tiếp theo nếu chúng ta muốn có số liệu định lượng về phạm vi nhập ngoài cổng kiểu/kiểm thử.

## Kiểm thử

Thêm hoặc cập nhật:

- Kiểm thử chuẩn hóa phần trình bày.
- Kiểm thử tự động hạ cấp phần trình bày cho các khối không được hỗ trợ.
- Kiểm thử dấu mốc xuyên ngữ cảnh cho hoạt động điều phối Plugin và các đường dẫn gửi của lõi.
- Kiểm thử ma trận kết xuất kênh cho Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE và văn bản dự phòng.
- Kiểm thử lược đồ công cụ tin nhắn để chứng minh các trường nguyên bản đã bị loại bỏ.
- Kiểm thử CLI để chứng minh các cờ nguyên bản đã bị loại bỏ.
- Kiểm thử hồi quy cơ chế tải lười khi nhập điểm vào Discord liên quan đến Carbon.
- Kiểm thử ghim khi gửi cho Telegram và cơ chế dự phòng chung.

## Câu hỏi mở

- Có nên triển khai `delivery.pin` cho Discord, Slack, MS Teams và Feishu trong lượt đầu tiên hay chỉ triển khai Telegram trước?
- Cuối cùng, `delivery` có nên tiếp nhận các trường hiện có như `replyToId`, `replyToCurrent`, `silent` và `audioAsVoice`, hay chỉ tập trung vào các hành vi sau khi gửi?
- Phần trình bày có nên hỗ trợ trực tiếp hình ảnh hoặc tham chiếu tệp, hay phương tiện nên tiếp tục tách biệt với bố cục giao diện người dùng ở thời điểm hiện tại?

## Liên quan

- [Tổng quan về kênh](/vi/channels)
- [Trình bày tin nhắn](/vi/plugins/message-presentation)
