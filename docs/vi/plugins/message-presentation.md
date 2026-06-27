---
read_when:
    - Thêm hoặc sửa đổi cách hiển thị thẻ tin nhắn, nút hoặc lựa chọn
    - Xây dựng Plugin kênh hỗ trợ tin nhắn gửi đi đa dạng
    - Thay đổi cách trình bày công cụ nhắn tin hoặc khả năng gửi
    - Gỡ lỗi các hồi quy kết xuất thẻ/khối/thành phần theo từng nhà cung cấp
summary: Thẻ thông điệp ngữ nghĩa, nút, ô chọn, văn bản dự phòng và gợi ý phân phối cho Plugin kênh
title: Trình bày tin nhắn
x-i18n:
    generated_at: "2026-06-27T17:48:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Trình bày tin nhắn là hợp đồng dùng chung của OpenClaw cho giao diện trò chuyện gửi đi giàu nội dung.
Nó cho phép tác nhân, lệnh CLI, luồng phê duyệt và Plugin mô tả ý định
tin nhắn một lần, trong khi mỗi Plugin kênh hiển thị hình dạng gốc tốt nhất có thể.

Dùng trình bày cho giao diện tin nhắn di động:

- phần văn bản
- văn bản ngữ cảnh/chân trang nhỏ
- đường phân cách
- nút
- menu chọn
- tiêu đề và sắc thái thẻ

Không thêm các trường gốc theo nhà cung cấp mới như Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, hoặc Feishu `card` vào công cụ
tin nhắn dùng chung. Đó là đầu ra kết xuất do Plugin kênh sở hữu.

## Hợp đồng

Tác giả Plugin nhập hợp đồng công khai từ:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Hình dạng:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

Ngữ nghĩa nút:

- `action.type: "command"` chạy một lệnh gạch chéo gốc thông qua đường dẫn lệnh
  của lõi. Dùng mục này cho các nút và menu lệnh tích hợp.
- `action.type: "callback"` mang dữ liệu Plugin mờ qua đường dẫn tương tác
  của kênh. Plugin kênh không được diễn giải lại dữ liệu callback thành lệnh
  gạch chéo.
- `value` là giá trị callback mờ kế thừa. Các điều khiển mới nên dùng `action`
  để Plugin kênh có thể ánh xạ lệnh và callback mà không phải đoán từ văn bản.
- `url` là nút liên kết. Nó có thể tồn tại mà không có `value`.
- `webApp` mô tả nút ứng dụng web gốc theo kênh. Telegram kết xuất mục này
  dưới dạng `web_app` và chỉ hỗ trợ trong cuộc trò chuyện riêng tư. `web_app` vẫn
  được chấp nhận trong payload JSON lỏng để tương thích, nhưng nhà sản xuất
  TypeScript nên dùng `webApp`.
- `label` là bắt buộc và cũng được dùng trong phương án dự phòng văn bản.
- `style` mang tính gợi ý. Bộ kết xuất nên ánh xạ kiểu không được hỗ trợ sang
  mặc định an toàn, không làm lỗi thao tác gửi.
- `priority` là tùy chọn. Khi một kênh khai báo giới hạn hành động và cần bỏ
  bớt điều khiển, lõi giữ các nút có độ ưu tiên cao hơn trước và giữ nguyên
  thứ tự ban đầu giữa các nút có cùng độ ưu tiên. Khi tất cả điều khiển đều vừa,
  thứ tự do tác giả đặt được giữ nguyên.
- `disabled` là tùy chọn. Kênh phải chọn tham gia bằng `supportsDisabled`; nếu không
  lõi hạ cấp điều khiển bị vô hiệu hóa thành văn bản dự phòng không tương tác.
- `reusable` là tùy chọn. Các kênh hỗ trợ callback gốc có thể tái sử dụng có thể
  giữ hành động khả dụng sau một tương tác thành công. Dùng cho các hành động
  lặp lại hoặc idempotent như làm mới, kiểm tra hoặc xem thêm chi tiết;
  để trống cho phê duyệt một lần thông thường và hành động phá hủy.

Ngữ nghĩa lựa chọn:

- `options[].action` có cùng ý nghĩa lệnh/callback như `action` của nút.
- `options[].value` là giá trị ứng dụng đã chọn kế thừa.
- `placeholder` mang tính gợi ý và có thể bị bỏ qua bởi các kênh không có hỗ trợ
  chọn gốc.
- Nếu một kênh không hỗ trợ lựa chọn, văn bản dự phòng sẽ liệt kê các nhãn.

## Ví dụ phía sản xuất

Thẻ đơn giản:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Nút liên kết chỉ có URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Nút Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Menu chọn:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Gửi bằng CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Giao hàng được ghim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Giao hàng được ghim với JSON tường minh:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Hợp đồng bộ kết xuất

Plugin kênh khai báo hỗ trợ kết xuất trên bộ chuyển đổi gửi đi của chúng:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Các boolean năng lực mô tả những gì bộ kết xuất có thể làm thành tương tác. `limits`
tùy chọn mô tả phong bì chung mà lõi có thể điều chỉnh trước khi gọi
bộ kết xuất:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

Lõi áp dụng các giới hạn chung cho điều khiển ngữ nghĩa trước khi kết xuất. Bộ kết xuất
vẫn sở hữu xác thực và cắt gọn đặc thù theo nhà cung cấp ở bước cuối cho số lượng khối gốc,
kích thước thẻ, giới hạn URL và các khác biệt của nhà cung cấp không thể biểu diễn trong
hợp đồng chung. Nếu giới hạn loại bỏ mọi điều khiển khỏi một khối, lõi giữ
các nhãn dưới dạng văn bản ngữ cảnh không tương tác để tin nhắn được giao vẫn có
phương án dự phòng hiển thị được.

## Luồng kết xuất lõi

Khi một `ReplyPayload` hoặc hành động tin nhắn bao gồm `presentation`, lõi:

1. Chuẩn hóa payload trình bày.
2. Phân giải bộ chuyển đổi gửi đi của kênh đích.
3. Đọc `presentationCapabilities`.
4. Áp dụng các giới hạn năng lực chung như số lượng hành động, độ dài nhãn và
   số lượng tùy chọn chọn khi bộ chuyển đổi khai báo chúng.
5. Gọi `renderPresentation` khi bộ chuyển đổi có thể kết xuất payload.
6. Dự phòng về văn bản thận trọng khi bộ chuyển đổi vắng mặt hoặc không thể kết xuất.
7. Gửi payload kết quả qua đường dẫn giao hàng kênh thông thường.
8. Áp dụng siêu dữ liệu giao hàng như `delivery.pin` sau tin nhắn được gửi
   thành công đầu tiên.

Lõi sở hữu hành vi dự phòng để nhà sản xuất có thể giữ tính độc lập với kênh. Plugin
kênh sở hữu kết xuất gốc và xử lý tương tác.

## Quy tắc hạ cấp

Trình bày phải an toàn để gửi trên các kênh hạn chế.

Văn bản dự phòng bao gồm:

- `title` làm dòng đầu tiên
- khối `text` làm đoạn văn thông thường
- khối `context` làm dòng ngữ cảnh gọn
- khối `divider` làm đường phân cách trực quan
- nhãn nút, bao gồm URL cho nút liên kết
- nhãn tùy chọn chọn

Điều khiển gốc không được hỗ trợ nên hạ cấp thay vì làm lỗi toàn bộ thao tác gửi.
Ví dụ:

- Telegram với nút nội tuyến bị tắt sẽ gửi văn bản dự phòng.
- Một kênh không hỗ trợ chọn sẽ liệt kê các tùy chọn chọn dưới dạng văn bản.
- Nút chỉ có URL trở thành nút liên kết gốc hoặc dòng URL dự phòng.
- Lỗi ghim tùy chọn không làm lỗi tin nhắn đã giao.

Ngoại lệ chính là `delivery.pin.required: true`; nếu yêu cầu ghim là
bắt buộc và kênh không thể ghim tin nhắn đã gửi, giao hàng sẽ báo lỗi.

## Ánh xạ nhà cung cấp

Bộ kết xuất đóng gói hiện tại:

| Kênh            | Mục tiêu kết xuất gốc                | Ghi chú                                                                                                                                                 |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Thành phần và vùng chứa thành phần   | Giữ `channelData.discord.components` kế thừa cho các nhà sản xuất payload gốc theo nhà cung cấp hiện có, nhưng lượt gửi dùng chung mới nên dùng `presentation`. |
| Slack           | Block Kit                            | Giữ `channelData.slack.blocks` kế thừa cho các nhà sản xuất payload gốc theo nhà cung cấp hiện có, nhưng lượt gửi dùng chung mới nên dùng `presentation`.       |
| Telegram        | Văn bản cộng bàn phím nội tuyến      | Nút/lựa chọn cần năng lực nút nội tuyến cho bề mặt đích; nếu không sẽ dùng văn bản dự phòng.                                                            |
| Mattermost      | Văn bản cộng thuộc tính tương tác    | Các khối khác hạ cấp thành văn bản.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                       | Văn bản `message` thuần được đưa vào cùng thẻ khi cả hai đều được cung cấp.                                                                             |
| Feishu          | Thẻ tương tác                        | Tiêu đề thẻ có thể dùng `title`; phần thân tránh lặp lại tiêu đề đó.                                                                                    |
| Kênh thuần      | Văn bản dự phòng                     | Các kênh không có bộ kết xuất vẫn nhận được đầu ra dễ đọc.                                                                                              |

Khả năng tương thích với payload gốc của nhà cung cấp là một hỗ trợ chuyển tiếp cho các
bộ tạo phản hồi hiện có. Đây không phải là lý do để thêm các trường gốc dùng chung mới.

## Trình bày so với InteractiveReply

`InteractiveReply` là tập con nội bộ cũ hơn được các helper phê duyệt và tương tác
sử dụng. Nó hỗ trợ:

- văn bản
- nút
- lựa chọn

`MessagePresentation` là hợp đồng gửi dùng chung chính thức. Nó bổ sung:

- tiêu đề
- sắc thái
- ngữ cảnh
- đường phân cách
- nút chỉ URL
- siêu dữ liệu phân phối chung thông qua `ReplyPayload.delivery`

Sử dụng các helper từ `openclaw/plugin-sdk/interactive-runtime` khi nối cầu mã cũ hơn:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Mã mới nên chấp nhận hoặc tạo trực tiếp `MessagePresentation`. Các payload
`interactive` hiện có là một tập con đã ngừng khuyến nghị của `presentation`; hỗ trợ
runtime vẫn được duy trì cho các bộ tạo cũ hơn.

Các kiểu `InteractiveReply*` kế thừa và helper chuyển đổi được đánh dấu
`@deprecated` trong SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, và
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` và
`presentationToInteractiveControlsReply(...)` vẫn có sẵn như các cầu nối renderer
cho các triển khai kênh kế thừa. Mã bộ tạo mới không nên gọi chúng; hãy gửi
`presentation` và để phần thích ứng core/kênh xử lý việc render.

Các helper phê duyệt cũng có các lựa chọn thay thế ưu tiên presentation:

- dùng `buildApprovalPresentationFromActionDescriptors(...)` thay cho
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- dùng `buildApprovalPresentation(...)` thay cho
  `buildApprovalInteractiveReply(...)`
- dùng `buildExecApprovalPresentation(...)` thay cho
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` trả về chuỗi rỗng cho các khối
presentation không có văn bản dự phòng, chẳng hạn như presentation chỉ có đường
phân cách. Các transport yêu cầu nội dung gửi không rỗng có thể truyền
`emptyFallback` để chọn dùng nội dung tối thiểu mà không thay đổi hợp đồng dự phòng
mặc định.

## Ghim khi phân phối

Ghim là hành vi phân phối, không phải presentation. Dùng `delivery.pin` thay cho
các trường gốc của nhà cung cấp như `channelData.telegram.pin`.

Ngữ nghĩa:

- `pin: true` ghim tin nhắn đầu tiên được phân phối thành công.
- `pin.notify` mặc định là `false`.
- `pin.required` mặc định là `false`.
- Lỗi ghim tùy chọn sẽ được giảm cấp và giữ nguyên tin nhắn đã gửi.
- Lỗi ghim bắt buộc làm phân phối thất bại.
- Tin nhắn được chia đoạn sẽ ghim đoạn đầu tiên đã phân phối, không phải đoạn cuối.

Các hành động tin nhắn thủ công `pin`, `unpin`, và `pins` vẫn tồn tại cho các
tin nhắn hiện có khi nhà cung cấp hỗ trợ những thao tác đó.

## Danh sách kiểm tra cho tác giả Plugin

- Khai báo `presentation` từ `describeMessageTool(...)` khi kênh có thể render
  hoặc giảm cấp presentation ngữ nghĩa một cách an toàn.
- Thêm `presentationCapabilities` vào adapter outbound của runtime.
- Triển khai `renderPresentation` trong mã runtime, không phải mã thiết lập Plugin
  ở control-plane.
- Giữ các thư viện UI gốc khỏi các đường dẫn thiết lập/catalog nóng.
- Khai báo các giới hạn khả năng chung trên `presentationCapabilities.limits` khi
  biết rõ chúng.
- Giữ nguyên các giới hạn nền tảng cuối cùng trong renderer và kiểm thử.
- Thêm kiểm thử dự phòng cho nút không được hỗ trợ, lựa chọn, nút URL, trùng lặp
  tiêu đề/văn bản, và các lượt gửi kết hợp `message` với `presentation`.
- Thêm hỗ trợ ghim khi phân phối thông qua `deliveryCapabilities.pin` và
  `pinDeliveredMessage` chỉ khi nhà cung cấp có thể ghim id tin nhắn đã gửi.
- Không để lộ các trường thẻ/khối/thành phần/nút gốc mới của nhà cung cấp thông qua
  schema hành động tin nhắn dùng chung.

## Tài liệu liên quan

- [CLI tin nhắn](/vi/cli/message)
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)
- [Kiến trúc Plugin](/vi/plugins/architecture-internals#message-tool-schemas)
- [Kế hoạch tái cấu trúc presentation của kênh](/vi/plan/ui-channels)
