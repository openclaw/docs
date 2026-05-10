---
read_when:
    - Thêm hoặc sửa đổi cách kết xuất thẻ tin nhắn, nút hoặc thành phần chọn
    - Xây dựng một Plugin kênh hỗ trợ tin nhắn gửi đi phong phú
    - Thay đổi cách trình bày công cụ nhắn tin hoặc khả năng gửi tin
    - Gỡ lỗi các hồi quy kết xuất thẻ/khối/thành phần dành riêng cho nhà cung cấp
summary: Thẻ tin nhắn ngữ nghĩa, nút, menu chọn, văn bản dự phòng và gợi ý gửi cho Plugin kênh
title: Cách hiển thị tin nhắn
x-i18n:
    generated_at: "2026-05-10T19:43:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

Trình bày thông điệp là hợp đồng dùng chung của OpenClaw cho giao diện trò chuyện gửi đi giàu nội dung.
Nó cho phép agent, lệnh CLI, luồng phê duyệt và plugin mô tả ý định thông điệp
một lần, trong khi mỗi plugin kênh hiển thị theo dạng gốc tốt nhất có thể.

Dùng trình bày cho giao diện thông điệp có tính di động:

- phần văn bản
- văn bản ngữ cảnh/chân trang nhỏ
- đường phân cách
- nút
- menu chọn
- tiêu đề thẻ và sắc thái

Không thêm các trường gốc theo nhà cung cấp mới như Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, hoặc Feishu `card` vào công cụ
thông điệp dùng chung. Chúng là đầu ra của trình hiển thị do plugin kênh sở hữu.

## Hợp đồng

Tác giả plugin nhập hợp đồng công khai từ:

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

- `value` là giá trị hành động ứng dụng được định tuyến lại qua đường dẫn tương tác
  hiện có của kênh khi kênh hỗ trợ điều khiển có thể nhấp.
- `url` là nút liên kết. Nó có thể tồn tại mà không có `value`.
- `label` là bắt buộc và cũng được dùng trong phương án văn bản dự phòng.
- `style` mang tính gợi ý. Trình hiển thị nên ánh xạ các kiểu không được hỗ trợ
  sang mặc định an toàn, thay vì làm lỗi thao tác gửi.

Ngữ nghĩa của lựa chọn:

- `options[].value` là giá trị ứng dụng được chọn.
- `placeholder` mang tính gợi ý và có thể bị bỏ qua bởi các kênh không có hỗ trợ
  lựa chọn gốc.
- Nếu kênh không hỗ trợ lựa chọn, văn bản dự phòng sẽ liệt kê các nhãn.

## Ví dụ phía tạo nội dung

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

Gửi kèm ghim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Gửi kèm ghim với JSON tường minh:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Hợp đồng trình hiển thị

Plugin kênh khai báo hỗ trợ hiển thị trên adapter gửi đi của chúng:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Các trường khả năng được cố ý giữ là boolean đơn giản. Chúng mô tả những gì
trình hiển thị có thể làm thành tương tác, không phải mọi giới hạn của nền tảng gốc.
Trình hiển thị vẫn sở hữu các giới hạn theo nền tảng như số nút tối đa, số block,
và kích thước thẻ.

## Luồng hiển thị lõi

Khi `ReplyPayload` hoặc hành động thông điệp bao gồm `presentation`, lõi:

1. Chuẩn hóa payload trình bày.
2. Phân giải adapter gửi đi của kênh đích.
3. Đọc `presentationCapabilities`.
4. Gọi `renderPresentation` khi adapter có thể hiển thị payload.
5. Dự phòng sang văn bản thận trọng khi adapter vắng mặt hoặc không thể hiển thị.
6. Gửi payload kết quả qua đường dẫn phân phối kênh thông thường.
7. Áp dụng siêu dữ liệu phân phối như `delivery.pin` sau thông điệp đã gửi thành công
   đầu tiên.

Lõi sở hữu hành vi dự phòng để phía tạo nội dung có thể không phụ thuộc kênh. Plugin
kênh sở hữu hiển thị gốc và xử lý tương tác.

## Quy tắc suy giảm

Trình bày phải an toàn để gửi trên các kênh hạn chế.

Văn bản dự phòng bao gồm:

- `title` là dòng đầu tiên
- các block `text` là đoạn văn bình thường
- các block `context` là dòng ngữ cảnh gọn
- các block `divider` là dấu phân cách trực quan
- nhãn nút, bao gồm URL cho nút liên kết
- nhãn tùy chọn lựa chọn

Điều khiển gốc không được hỗ trợ nên suy giảm thay vì làm lỗi toàn bộ thao tác gửi.
Ví dụ:

- Telegram với nút inline bị tắt sẽ gửi văn bản dự phòng.
- Một kênh không hỗ trợ lựa chọn sẽ liệt kê tùy chọn lựa chọn dưới dạng văn bản.
- Nút chỉ có URL trở thành nút liên kết gốc hoặc dòng URL dự phòng.
- Lỗi ghim tùy chọn không làm lỗi thông điệp đã phân phối.

Ngoại lệ chính là `delivery.pin.required: true`; nếu yêu cầu ghim là bắt buộc và
kênh không thể ghim thông điệp đã gửi, phân phối sẽ báo lỗi.

## Ánh xạ nhà cung cấp

Trình hiển thị đi kèm hiện tại:

| Kênh            | Đích hiển thị gốc                   | Ghi chú                                                                                                                                           |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Thành phần và vùng chứa thành phần  | Giữ lại `channelData.discord.components` kế thừa cho các phía tạo payload gốc theo nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`. |
| Slack           | Block Kit                           | Giữ lại `channelData.slack.blocks` kế thừa cho các phía tạo payload gốc theo nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`. |
| Telegram        | Văn bản cộng bàn phím inline        | Nút/lựa chọn cần khả năng nút inline cho bề mặt đích; nếu không sẽ dùng văn bản dự phòng.                                                        |
| Mattermost      | Văn bản cộng props tương tác        | Các block khác suy giảm thành văn bản.                                                                                                           |
| Microsoft Teams | Adaptive Cards                      | Văn bản `message` thuần được đưa vào cùng thẻ khi cả hai đều được cung cấp.                                                                       |
| Feishu          | Thẻ tương tác                       | Tiêu đề thẻ có thể dùng `title`; phần thân tránh lặp lại tiêu đề đó.                                                                              |
| Kênh thuần      | Văn bản dự phòng                    | Các kênh không có trình hiển thị vẫn nhận được đầu ra đọc được.                                                                                  |

Khả năng tương thích payload gốc theo nhà cung cấp là hỗ trợ chuyển tiếp cho các
phía tạo phản hồi hiện có. Nó không phải lý do để thêm các trường gốc dùng chung mới.

## Trình bày so với InteractiveReply

`InteractiveReply` là tập con nội bộ cũ hơn được dùng bởi các trình trợ giúp phê duyệt
và tương tác. Nó hỗ trợ:

- văn bản
- nút
- lựa chọn

`MessagePresentation` là hợp đồng gửi dùng chung chuẩn tắc. Nó bổ sung:

- tiêu đề
- sắc thái
- ngữ cảnh
- đường phân cách
- nút chỉ có URL
- siêu dữ liệu phân phối chung qua `ReplyPayload.delivery`

Dùng các trình trợ giúp từ `openclaw/plugin-sdk/interactive-runtime` khi bắc cầu mã cũ:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Mã mới nên chấp nhận hoặc tạo trực tiếp `MessagePresentation`.

`presentationToInteractiveReply(...)` giữ lại văn bản trình bày nhìn thấy được bằng cách
ánh xạ tiêu đề, văn bản, ngữ cảnh, nút và lựa chọn vào hình dạng
`InteractiveReply` cũ hơn. Các trình hiển thị thành phần vốn đã vẽ tiêu đề, văn bản,
ngữ cảnh và block đường phân cách theo cách gốc nên dùng
`presentationToInteractiveControlsReply(...)` thay vào đó, rồi chỉ thêm các điều khiển
nút và lựa chọn.

`renderMessagePresentationFallbackText(...)` trả về chuỗi rỗng cho các block trình bày
không có văn bản dự phòng, chẳng hạn trình bày chỉ có đường phân cách.
Các phương thức truyền tải yêu cầu thân gửi không rỗng có thể truyền
`emptyFallback` để chọn dùng một thân tối thiểu mà không thay đổi hợp đồng dự phòng
mặc định.

## Ghim phân phối

Ghim là hành vi phân phối, không phải trình bày. Dùng `delivery.pin` thay cho
các trường gốc theo nhà cung cấp như `channelData.telegram.pin`.

Ngữ nghĩa:

- `pin: true` ghim thông điệp đầu tiên được phân phối thành công.
- `pin.notify` mặc định là `false`.
- `pin.required` mặc định là `false`.
- Lỗi ghim tùy chọn sẽ suy giảm và giữ nguyên thông điệp đã gửi.
- Lỗi ghim bắt buộc làm phân phối thất bại.
- Thông điệp được chia đoạn sẽ ghim đoạn đã phân phối đầu tiên, không phải đoạn cuối.

Các hành động thông điệp thủ công `pin`, `unpin`, và `pins` vẫn tồn tại cho các
thông điệp hiện có ở nơi nhà cung cấp hỗ trợ các thao tác đó.

## Danh sách kiểm tra cho tác giả plugin

- Khai báo `presentation` từ `describeMessageTool(...)` khi kênh có thể
  hiển thị hoặc suy giảm an toàn trình bày ngữ nghĩa.
- Thêm `presentationCapabilities` vào adapter gửi đi lúc chạy.
- Triển khai `renderPresentation` trong mã runtime, không phải mã thiết lập plugin
  control plane.
- Giữ thư viện giao diện gốc ra khỏi các đường dẫn thiết lập/catalog nóng.
- Bảo toàn giới hạn nền tảng trong trình hiển thị và kiểm thử.
- Thêm kiểm thử dự phòng cho nút không được hỗ trợ, lựa chọn, nút URL, trùng lặp tiêu đề/văn bản,
  và lượt gửi kết hợp `message` cộng `presentation`.
- Thêm hỗ trợ ghim phân phối qua `deliveryCapabilities.pin` và
  `pinDeliveredMessage` chỉ khi nhà cung cấp có thể ghim id thông điệp đã gửi.
- Không phơi bày các trường thẻ/block/thành phần/nút gốc theo nhà cung cấp mới qua
  schema hành động thông điệp dùng chung.

## Tài liệu liên quan

- [CLI thông điệp](/vi/cli/message)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Kiến trúc Plugin](/vi/plugins/architecture-internals#message-tool-schemas)
- [Kế hoạch tái cấu trúc trình bày kênh](/vi/plan/ui-channels)
