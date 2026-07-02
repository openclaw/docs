---
read_when:
    - Thêm hoặc sửa đổi cách hiển thị thẻ tin nhắn, nút hoặc lựa chọn
    - Xây dựng Plugin kênh hỗ trợ tin nhắn gửi đi đa dạng
    - Thay đổi cách trình bày công cụ nhắn tin hoặc các khả năng phân phối
    - Gỡ lỗi các hồi quy khi kết xuất thẻ/khối/thành phần dành riêng cho nhà cung cấp
summary: Thẻ thông điệp ngữ nghĩa, nút, trình chọn, văn bản dự phòng và gợi ý phân phối cho Plugin kênh
title: Trình bày tin nhắn
x-i18n:
    generated_at: "2026-07-02T22:37:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Trình bày thông điệp là hợp đồng dùng chung của OpenClaw cho giao diện trò chuyện gửi đi phong phú.
Nó cho phép agent, lệnh CLI, luồng phê duyệt và Plugin mô tả ý định thông điệp
một lần, trong khi mỗi Plugin kênh kết xuất hình thức gốc tốt nhất có thể.

Dùng trình bày cho giao diện thông điệp có tính di động:

- các phần văn bản
- văn bản ngữ cảnh/chân trang nhỏ
- đường phân cách
- nút
- menu chọn
- tiêu đề và sắc thái thẻ

Không thêm các trường gốc của nhà cung cấp mới như Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, hoặc Feishu `card` vào công cụ
thông điệp dùng chung. Đó là đầu ra của bộ kết xuất do Plugin kênh sở hữu.

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

Ngữ nghĩa của nút:

- `action.type: "command"` chạy một lệnh slash gốc thông qua đường dẫn lệnh
  của lõi. Dùng mục này cho các nút và menu lệnh tích hợp.
- `action.type: "callback"` mang dữ liệu Plugin mờ thông qua đường dẫn tương tác
  của kênh. Plugin kênh không được diễn giải lại dữ liệu callback thành lệnh
  slash.
- `value` là giá trị callback mờ cũ. Các điều khiển mới nên dùng `action`
  để Plugin kênh có thể ánh xạ lệnh và callback mà không phải đoán từ văn bản.
- `url` là nút liên kết. Nó có thể tồn tại mà không có `value`.
- `webApp` mô tả nút ứng dụng web gốc của kênh. Telegram kết xuất mục này
  dưới dạng `web_app` và chỉ hỗ trợ trong cuộc trò chuyện riêng tư. `web_app`
  vẫn được chấp nhận trong payload JSON lỏng để tương thích, nhưng producer
  TypeScript nên dùng `webApp`.
- `label` là bắt buộc và cũng được dùng trong dự phòng văn bản.
- `style` mang tính gợi ý. Bộ kết xuất nên ánh xạ các kiểu không được hỗ trợ
  sang mặc định an toàn, không làm gửi thất bại.
- `priority` là tùy chọn. Khi một kênh quảng bá giới hạn hành động và phải
  loại bỏ điều khiển, lõi giữ các nút có độ ưu tiên cao hơn trước và giữ
  nguyên thứ tự ban đầu giữa các nút có cùng độ ưu tiên. Khi tất cả điều khiển
  đều vừa, thứ tự do tác giả đặt được giữ nguyên.
- `disabled` là tùy chọn. Kênh phải chọn tham gia bằng `supportsDisabled`; nếu không
  lõi hạ cấp điều khiển bị vô hiệu hóa thành văn bản dự phòng không tương tác.
- `reusable` là tùy chọn. Các kênh hỗ trợ callback gốc có thể tái sử dụng có thể
  giữ hành động khả dụng sau một tương tác thành công. Dùng nó cho các hành động
  lặp lại hoặc bất biến như làm mới, kiểm tra, hoặc thêm chi tiết;
  để trống cho các phê duyệt dùng một lần thông thường và hành động phá hủy.

Ngữ nghĩa của menu chọn:

- `options[].action` có cùng ý nghĩa lệnh/callback như `action` của nút.
- `options[].value` là giá trị ứng dụng được chọn kiểu cũ.
- `placeholder` mang tính gợi ý và có thể bị các kênh không hỗ trợ chọn gốc
  bỏ qua.
- Nếu một kênh không hỗ trợ menu chọn, văn bản dự phòng sẽ liệt kê các nhãn.

## Ví dụ producer

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

Plugin kênh khai báo hỗ trợ kết xuất trên adapter gửi đi của chúng:

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

Các boolean năng lực mô tả những gì bộ kết xuất có thể biến thành tương tác. `limits`
tùy chọn mô tả lớp bao chung mà lõi có thể điều chỉnh trước khi gọi
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
vẫn sở hữu bước xác thực và cắt tỉa cuối cùng dành riêng cho nhà cung cấp đối với số lượng
khối gốc, kích thước thẻ, giới hạn URL và các điểm đặc thù của nhà cung cấp không thể
diễn đạt trong hợp đồng chung. Nếu giới hạn loại bỏ mọi điều khiển khỏi một khối, lõi giữ
các nhãn dưới dạng văn bản ngữ cảnh không tương tác để thông điệp được giao vẫn có một
dự phòng hiển thị.

## Luồng kết xuất lõi

Khi một `ReplyPayload` hoặc hành động thông điệp bao gồm `presentation`, lõi:

1. Chuẩn hóa payload trình bày.
2. Phân giải adapter gửi đi của kênh đích.
3. Đọc `presentationCapabilities`.
4. Áp dụng các giới hạn năng lực chung như số lượng hành động, độ dài nhãn và
   số lượng tùy chọn chọn khi adapter quảng bá chúng.
5. Gọi `renderPresentation` khi adapter có thể kết xuất payload.
6. Dự phòng về văn bản thận trọng khi adapter vắng mặt hoặc không thể kết xuất.
7. Gửi payload thu được qua đường dẫn giao hàng kênh bình thường.
8. Áp dụng siêu dữ liệu giao hàng như `delivery.pin` sau thông điệp gửi thành công
   đầu tiên.

Lõi sở hữu hành vi dự phòng để producer có thể không phụ thuộc kênh. Plugin kênh
sở hữu kết xuất gốc và xử lý tương tác.

## Quy tắc hạ cấp

Trình bày phải an toàn để gửi trên các kênh hạn chế.

Văn bản dự phòng bao gồm:

- `title` làm dòng đầu tiên
- các khối `text` như đoạn văn bình thường
- các khối `context` như dòng ngữ cảnh gọn
- các khối `divider` như dấu phân cách trực quan
- nhãn nút, bao gồm URL cho nút liên kết
- nhãn tùy chọn chọn

### Khả năng hiển thị dự phòng của giá trị nút

Khi một kênh không thể kết xuất điều khiển tương tác, giá trị của nút và menu chọn
dự phòng về văn bản thuần. Hành vi dự phòng giữ khả năng sử dụng trong khi
giữ dữ liệu callback mờ ở trạng thái riêng tư:

- Các hành động có kiểu **`command`** kết xuất thành `label: \`command\`` để người dùng có thể
  sao chép lệnh và chạy thủ công trong ô nhập của kênh.
- Các hành động có kiểu **`callback`** và trường **`value`** cũ kết xuất chỉ dưới dạng
  nhãn. Giá trị callback mờ không bị lộ trong văn bản dự phòng.
- Nút **`url` / `webApp`** kết xuất văn bản URL cùng với
  nhãn nút, vì URL hướng tới người dùng.
- **Tùy chọn chọn** kết xuất chỉ dưới dạng nhãn. Giá trị tùy chọn bên dưới không
  bị lộ trong văn bản dự phòng.

Các adapter kênh thêm hướng dẫn lệnh thủ công trong giao diện dự phòng của chúng (ví dụ:
hướng dẫn bình luận tài liệu Feishu) phải suy ra kiểm tra có lệnh
từ cùng các khối trình bày mà bộ kết xuất dự phòng dùng, để
văn bản hướng dẫn chỉ xuất hiện khi một lệnh thủ công thực sự được hiển thị.

Các điều khiển gốc không được hỗ trợ nên hạ cấp thay vì làm toàn bộ lần gửi thất bại.
Ví dụ:

- Telegram với nút inline bị vô hiệu hóa sẽ gửi văn bản dự phòng.
- Một kênh không hỗ trợ menu chọn sẽ liệt kê các tùy chọn chọn dưới dạng văn bản.
- Nút chỉ có URL trở thành nút liên kết gốc hoặc dòng URL dự phòng.
- Lỗi ghim tùy chọn không làm thông điệp đã giao thất bại.

Ngoại lệ chính là `delivery.pin.required: true`; nếu yêu cầu ghim là
bắt buộc và kênh không thể ghim thông điệp đã gửi, giao hàng sẽ báo lỗi.

## Ánh xạ nhà cung cấp

Các bộ kết xuất đóng gói hiện tại:

| Kênh            | Đích kết xuất gốc                   | Ghi chú                                                                                                                                                    |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Thành phần và vùng chứa thành phần  | Giữ lại `channelData.discord.components` cũ cho các bộ tạo tải trọng gốc theo nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`. |
| Slack           | Block Kit                           | Giữ lại `channelData.slack.blocks` cũ cho các bộ tạo tải trọng gốc theo nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`.     |
| Telegram        | Văn bản kèm bàn phím nội tuyến      | Nút/lựa chọn yêu cầu bề mặt đích có khả năng nút nội tuyến; nếu không, bản dự phòng văn bản sẽ được dùng.                                                   |
| Mattermost      | Văn bản kèm thuộc tính tương tác    | Các khối khác hạ cấp thành văn bản.                                                                                                                         |
| Microsoft Teams | Adaptive Cards                      | Văn bản `message` thuần được đưa vào cùng thẻ khi cả hai đều được cung cấp.                                                                                  |
| Feishu          | Thẻ tương tác                       | Tiêu đề thẻ có thể dùng `title`; phần thân tránh lặp lại tiêu đề đó.                                                                                        |
| Kênh thuần      | Bản dự phòng văn bản                | Các kênh không có bộ kết xuất vẫn nhận được đầu ra dễ đọc.                                                                                                  |

Khả năng tương thích tải trọng gốc theo nhà cung cấp là một hỗ trợ chuyển tiếp cho các bộ tạo phản hồi hiện có. Đây không phải là lý do để thêm các trường gốc dùng chung mới.

## Presentation so với InteractiveReply

`InteractiveReply` là tập con nội bộ cũ hơn được các trình trợ giúp phê duyệt và tương tác sử dụng. Nó hỗ trợ:

- văn bản
- nút
- lựa chọn

`MessagePresentation` là hợp đồng gửi dùng chung chính tắc. Nó bổ sung:

- tiêu đề
- sắc thái
- ngữ cảnh
- đường phân cách
- nút chỉ URL
- siêu dữ liệu phân phối chung thông qua `ReplyPayload.delivery`

Dùng các trình trợ giúp từ `openclaw/plugin-sdk/interactive-runtime` khi nối cầu mã cũ hơn:
__OC_I18N_900011__
Mã mới nên chấp nhận hoặc tạo trực tiếp `MessagePresentation`. Các tải trọng `interactive` hiện có là một tập con đã lỗi thời của `presentation`; hỗ trợ runtime vẫn được giữ cho các bộ tạo cũ hơn.

Các kiểu `InteractiveReply*` cũ và trình trợ giúp chuyển đổi được đánh dấu `@deprecated` trong SDK:

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
`presentationToInteractiveControlsReply(...)` vẫn khả dụng làm cầu nối bộ kết xuất cho các triển khai kênh cũ. Mã bộ tạo mới không nên gọi chúng; hãy gửi `presentation` và để lõi/bộ thích ứng kênh xử lý việc kết xuất.

Các trình trợ giúp phê duyệt cũng có các thay thế ưu tiên presentation:

- dùng `buildApprovalPresentationFromActionDescriptors(...)` thay cho
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- dùng `buildApprovalPresentation(...)` thay cho
  `buildApprovalInteractiveReply(...)`
- dùng `buildExecApprovalPresentation(...)` thay cho
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` trả về chuỗi rỗng cho các khối presentation không có bản dự phòng văn bản, chẳng hạn như presentation chỉ có đường phân cách. Các phương thức vận chuyển yêu cầu thân gửi không rỗng có thể truyền `emptyFallback` để chọn dùng thân tối thiểu mà không thay đổi hợp đồng dự phòng mặc định.

## Ghim khi phân phối

Ghim là hành vi phân phối, không phải presentation. Dùng `delivery.pin` thay vì các trường gốc theo nhà cung cấp như `channelData.telegram.pin`.

Ngữ nghĩa:

- `pin: true` ghim tin nhắn đầu tiên được phân phối thành công.
- `pin.notify` mặc định là `false`.
- `pin.required` mặc định là `false`.
- Lỗi ghim tùy chọn sẽ hạ cấp và giữ nguyên tin nhắn đã gửi.
- Lỗi ghim bắt buộc làm phân phối thất bại.
- Tin nhắn được chia khúc ghim khúc đầu tiên được phân phối, không phải khúc cuối.

Các hành động tin nhắn thủ công `pin`, `unpin`, và `pins` vẫn tồn tại cho các tin nhắn hiện có khi nhà cung cấp hỗ trợ những thao tác đó.

## Danh sách kiểm tra cho tác giả Plugin

- Khai báo `presentation` từ `describeMessageTool(...)` khi kênh có thể kết xuất hoặc hạ cấp presentation ngữ nghĩa một cách an toàn.
- Thêm `presentationCapabilities` vào bộ thích ứng đi ra của runtime.
- Triển khai `renderPresentation` trong mã runtime, không phải mã thiết lập Plugin trên mặt phẳng điều khiển.
- Không đưa thư viện UI gốc vào các đường dẫn thiết lập/danh mục nóng.
- Khai báo giới hạn khả năng chung trên `presentationCapabilities.limits` khi đã biết.
- Giữ nguyên các giới hạn nền tảng cuối cùng trong bộ kết xuất và kiểm thử.
- Thêm kiểm thử dự phòng cho nút không được hỗ trợ, lựa chọn, nút URL, lặp tiêu đề/văn bản, và các lượt gửi kết hợp `message` với `presentation`.
- Thêm hỗ trợ ghim khi phân phối thông qua `deliveryCapabilities.pin` và
  `pinDeliveredMessage` chỉ khi nhà cung cấp có thể ghim id tin nhắn đã gửi.
- Không để lộ các trường thẻ/khối/thành phần/nút gốc theo nhà cung cấp mới thông qua lược đồ hành động tin nhắn dùng chung.

## Tài liệu liên quan

- [CLI tin nhắn](/vi/cli/message)
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)
- [Kiến trúc Plugin](/vi/plugins/architecture-internals#message-tool-schemas)
- [Kế hoạch tái cấu trúc presentation cho kênh](/vi/plan/ui-channels)
