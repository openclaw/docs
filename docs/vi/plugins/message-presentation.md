---
read_when:
    - Thêm hoặc sửa đổi cách kết xuất thẻ tin nhắn, nút hoặc bộ chọn
    - Xây dựng một Plugin kênh hỗ trợ tin nhắn gửi đi phong phú
    - Thay đổi cách trình bày công cụ tin nhắn hoặc khả năng gửi
    - Gỡ lỗi các hồi quy kết xuất thẻ/khối/thành phần theo từng nhà cung cấp
summary: Thẻ tin nhắn ngữ nghĩa, nút, menu chọn, văn bản dự phòng và gợi ý gửi cho Plugin kênh
title: Cách trình bày tin nhắn
x-i18n:
    generated_at: "2026-04-29T23:01:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

Trình bày tin nhắn là hợp đồng dùng chung của OpenClaw cho giao diện trò chuyện gửi đi phong phú.
Nó cho phép agent, lệnh CLI, luồng phê duyệt và plugin mô tả ý định của tin nhắn
một lần, trong khi mỗi plugin kênh hiển thị dạng gốc tốt nhất có thể.

Dùng trình bày cho giao diện tin nhắn có tính di động:

- phần văn bản
- văn bản ngữ cảnh/chân trang nhỏ
- đường phân cách
- nút
- menu chọn
- tiêu đề thẻ và sắc thái

Không thêm các trường gốc của nhà cung cấp mới như Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, hoặc Feishu `card` vào công cụ
tin nhắn dùng chung. Những trường đó là đầu ra của trình kết xuất do plugin kênh sở hữu.

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

- `value` là giá trị hành động của ứng dụng được định tuyến trở lại qua đường dẫn
  tương tác hiện có của kênh khi kênh hỗ trợ điều khiển có thể nhấp.
- `url` là nút liên kết. Nó có thể tồn tại mà không có `value`.
- `label` là bắt buộc và cũng được dùng trong văn bản dự phòng.
- `style` mang tính gợi ý. Trình kết xuất nên ánh xạ các kiểu không được hỗ trợ sang mặc định
  an toàn, thay vì làm lỗi việc gửi.

Ngữ nghĩa của lựa chọn:

- `options[].value` là giá trị ứng dụng đã chọn.
- `placeholder` mang tính gợi ý và có thể bị bỏ qua bởi các kênh không có hỗ trợ
  lựa chọn gốc.
- Nếu một kênh không hỗ trợ lựa chọn, văn bản dự phòng sẽ liệt kê các nhãn.

## Ví dụ phía tạo

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

Gửi có ghim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Gửi có ghim với JSON tường minh:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Hợp đồng trình kết xuất

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

Các trường năng lực được cố ý giữ là boolean đơn giản. Chúng mô tả những gì
trình kết xuất có thể làm thành tương tác, không phải mọi giới hạn nền tảng gốc.
Trình kết xuất vẫn sở hữu các giới hạn riêng của nền tảng như số nút tối đa, số khối và
kích thước thẻ.

## Luồng kết xuất lõi

Khi một `ReplyPayload` hoặc hành động tin nhắn bao gồm `presentation`, lõi:

1. Chuẩn hóa payload trình bày.
2. Phân giải adapter gửi đi của kênh đích.
3. Đọc `presentationCapabilities`.
4. Gọi `renderPresentation` khi adapter có thể kết xuất payload.
5. Dự phòng về văn bản thận trọng khi adapter vắng mặt hoặc không thể kết xuất.
6. Gửi payload kết quả qua đường dẫn gửi thông thường của kênh.
7. Áp dụng siêu dữ liệu gửi như `delivery.pin` sau tin nhắn gửi thành công đầu tiên.

Lõi sở hữu hành vi dự phòng để phía tạo có thể giữ tính bất khả tri với kênh. Plugin
kênh sở hữu kết xuất gốc và xử lý tương tác.

## Quy tắc suy giảm

Trình bày phải an toàn để gửi trên các kênh hạn chế.

Văn bản dự phòng bao gồm:

- `title` làm dòng đầu tiên
- các khối `text` làm đoạn văn bình thường
- các khối `context` làm dòng ngữ cảnh gọn
- các khối `divider` làm dấu phân cách trực quan
- nhãn nút, bao gồm URL cho nút liên kết
- nhãn tùy chọn chọn

Điều khiển gốc không được hỗ trợ nên suy giảm thay vì làm lỗi toàn bộ việc gửi.
Ví dụ:

- Telegram với nút nội tuyến bị tắt sẽ gửi văn bản dự phòng.
- Một kênh không hỗ trợ lựa chọn sẽ liệt kê các tùy chọn chọn dưới dạng văn bản.
- Nút chỉ có URL trở thành nút liên kết gốc hoặc dòng URL dự phòng.
- Lỗi ghim tùy chọn không làm lỗi tin nhắn đã gửi.

Ngoại lệ chính là `delivery.pin.required: true`; nếu yêu cầu ghim là bắt buộc
và kênh không thể ghim tin nhắn đã gửi, việc gửi sẽ báo lỗi.

## Ánh xạ nhà cung cấp

Các trình kết xuất đi kèm hiện tại:

| Kênh            | Đích kết xuất gốc                         | Ghi chú                                                                                                                                                              |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Thành phần và vùng chứa thành phần        | Giữ `channelData.discord.components` cũ cho các phía tạo payload gốc của nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`.            |
| Slack           | Block Kit                                 | Giữ `channelData.slack.blocks` cũ cho các phía tạo payload gốc của nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên dùng `presentation`.                  |
| Telegram        | Văn bản cộng bàn phím nội tuyến           | Nút/lựa chọn yêu cầu năng lực nút nội tuyến cho bề mặt đích; nếu không, văn bản dự phòng sẽ được dùng.                                                               |
| Mattermost      | Văn bản cộng props tương tác              | Các khối khác suy giảm thành văn bản.                                                                                                                               |
| Microsoft Teams | Adaptive Cards                            | Văn bản `message` thuần được đưa vào cùng thẻ khi cả hai đều được cung cấp.                                                                                          |
| Feishu          | Thẻ tương tác                             | Tiêu đề thẻ có thể dùng `title`; phần thân tránh lặp lại tiêu đề đó.                                                                                                |
| Kênh thuần      | Văn bản dự phòng                          | Các kênh không có trình kết xuất vẫn nhận được đầu ra dễ đọc.                                                                                                       |

Tương thích payload gốc của nhà cung cấp là phương tiện chuyển tiếp cho các phía tạo
trả lời hiện có. Đây không phải là lý do để thêm các trường gốc dùng chung mới.

## Trình bày so với InteractiveReply

`InteractiveReply` là tập con nội bộ cũ hơn được dùng bởi các helper phê duyệt và tương tác.
Nó hỗ trợ:

- văn bản
- nút
- lựa chọn

`MessagePresentation` là hợp đồng gửi dùng chung chính tắc. Nó thêm:

- tiêu đề
- sắc thái
- ngữ cảnh
- đường phân cách
- nút chỉ có URL
- siêu dữ liệu gửi chung qua `ReplyPayload.delivery`

Dùng helper từ `openclaw/plugin-sdk/interactive-runtime` khi bắc cầu mã cũ hơn:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Mã mới nên chấp nhận hoặc tạo trực tiếp `MessagePresentation`.

## Ghim khi gửi

Ghim là hành vi gửi, không phải trình bày. Dùng `delivery.pin` thay cho
các trường gốc của nhà cung cấp như `channelData.telegram.pin`.

Ngữ nghĩa:

- `pin: true` ghim tin nhắn đầu tiên được gửi thành công.
- `pin.notify` mặc định là `false`.
- `pin.required` mặc định là `false`.
- Lỗi ghim tùy chọn sẽ suy giảm và giữ nguyên tin nhắn đã gửi.
- Lỗi ghim bắt buộc làm lỗi việc gửi.
- Tin nhắn chia khúc ghim khúc đầu tiên đã gửi, không phải khúc cuối.

Các hành động tin nhắn thủ công `pin`, `unpin`, và `pins` vẫn tồn tại cho những
tin nhắn hiện có khi nhà cung cấp hỗ trợ các thao tác đó.

## Danh sách kiểm tra cho tác giả Plugin

- Khai báo `presentation` từ `describeMessageTool(...)` khi kênh có thể
  kết xuất hoặc suy giảm an toàn trình bày ngữ nghĩa.
- Thêm `presentationCapabilities` vào adapter gửi đi thời gian chạy.
- Triển khai `renderPresentation` trong mã thời gian chạy, không phải mã
  thiết lập plugin mặt phẳng điều khiển.
- Giữ các thư viện giao diện gốc khỏi các đường dẫn thiết lập/danh mục nóng.
- Bảo toàn giới hạn nền tảng trong trình kết xuất và kiểm thử.
- Thêm kiểm thử dự phòng cho nút không được hỗ trợ, lựa chọn, nút URL, trùng lặp tiêu đề/văn bản
  và lượt gửi hỗn hợp `message` cộng `presentation`.
- Thêm hỗ trợ ghim khi gửi qua `deliveryCapabilities.pin` và
  `pinDeliveredMessage` chỉ khi nhà cung cấp có thể ghim id tin nhắn đã gửi.
- Không để lộ các trường thẻ/khối/thành phần/nút gốc của nhà cung cấp mới qua
  schema hành động tin nhắn dùng chung.

## Tài liệu liên quan

- [CLI tin nhắn](/vi/cli/message)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Kiến trúc Plugin](/vi/plugins/architecture-internals#message-tool-schemas)
- [Kế hoạch tái cấu trúc trình bày kênh](/vi/plan/ui-channels)
