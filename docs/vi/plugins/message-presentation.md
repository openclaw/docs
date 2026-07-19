---
read_when:
    - Thêm hoặc sửa đổi cách hiển thị thẻ tin nhắn, biểu đồ, bảng, nút hoặc thành phần chọn
    - Xây dựng Plugin kênh hỗ trợ tin nhắn gửi đi đa dạng nội dung
    - Thay đổi cách trình bày hoặc khả năng phân phối của công cụ tin nhắn
    - Gỡ lỗi các lỗi hồi quy khi kết xuất thẻ/khối/thành phần dành riêng cho nhà cung cấp
summary: Thẻ tin nhắn ngữ nghĩa, biểu đồ, bảng, điều khiển, văn bản dự phòng và gợi ý gửi cho các plugin kênh
title: Trình bày tin nhắn
x-i18n:
    generated_at: "2026-07-19T05:54:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b56ed47ce837e865aa7ac218f02f4d5523b3b71ae22dd0074f2aab00aeecb7a
    source_path: plugins/message-presentation.md
    workflow: 16
---

Cách trình bày tin nhắn là hợp đồng dùng chung của OpenClaw dành cho giao diện trò chuyện gửi đi phong phú.
Nó cho phép tác nhân, lệnh CLI, luồng phê duyệt và plugin mô tả ý định
của tin nhắn một lần, trong khi mỗi plugin kênh hiển thị theo dạng gốc phù hợp nhất có thể.

Sử dụng cách trình bày cho giao diện tin nhắn có tính di động: các phần văn bản, văn bản
ngữ cảnh/chân trang ngắn, đường phân cách, biểu đồ, bảng, nút, menu chọn và tiêu đề/tông màu của thẻ.

Không thêm các trường mới dành riêng cho nhà cung cấp như Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` hoặc Feishu `card` vào công cụ
tin nhắn dùng chung. Đây là đầu ra của trình kết xuất do plugin kênh sở hữu.

## Hợp đồng

Tác giả plugin nhập hợp đồng công khai từ:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Cấu trúc:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  /** @deprecated Use an action with type "url". */
  url?: string;
  /** @deprecated Use an action with type "web-app". */
  webApp?: { url: string };
  /** @deprecated Use an action with type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
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

- `action.type: "command"` chạy một lệnh gạch chéo gốc thông qua đường dẫn lệnh
của lõi. Sử dụng mục này cho các nút và menu lệnh tích hợp sẵn.
- `action.type: "callback"` truyền dữ liệu plugin không trong suốt qua đường dẫn
tương tác của kênh. Plugin kênh không được diễn giải lại dữ liệu callback thành lệnh
gạch chéo.
- `action.type: "approval"` xác định một phê duyệt bền vững của người vận hành, loại
`exec` hoặc `plugin` rõ ràng của phê duyệt đó và quyết định được yêu cầu. Plugin kênh
mã hóa hành động đó thành callback riêng của phương thức truyền tải và phân giải nó thông qua
dịch vụ phê duyệt; chúng không được phân tích văn bản lệnh `/approve` hoặc suy ra
loại từ ID.
- `action.type: "question"` xác định một lựa chọn cho câu hỏi `ask_user` đang hoạt động
do môi trường chạy tạo. Tương tự `approval`, đây là hành động trong môi trường chạy OpenClaw;
tác nhân và plugin không được tự tạo ID câu hỏi. Telegram, Discord và
Slack ánh xạ hành động này thành callback gốc riêng của phương thức truyền tải và phân giải lựa chọn
thông qua Gateway. Khi câu hỏi được trả lời, hết hạn hoặc
bị hủy, các kênh đó chỉnh sửa tin nhắn đã gửi, loại bỏ các hành động
và thêm trạng thái kết thúc. WhatsApp, Signal và iMessage hiển thị tối đa
bốn lựa chọn đơn dưới dạng phản ứng `1️⃣` đến `4️⃣`. Các dạng câu hỏi
khác được hạ cấp thành văn bản nhãn và người dùng có thể trả lời bằng
văn bản thuần.
- `action.type: "url"` mở một liên kết thông thường.
- `action.type: "web-app"` khởi chạy ứng dụng web gốc của kênh. Đặt `url` cho
ứng dụng dựa trên URL hoặc `widgetId` cho tiện ích do OpenClaw lưu trữ mà cơ chế
khởi chạy thuộc quyền sở hữu của kênh; bắt buộc phải có ít nhất một trong hai. Khi có cả hai,
kênh có thể ưu tiên cơ chế khởi chạy tiện ích được lưu trữ gốc và sử dụng URL
ở nơi cơ chế đó không khả dụng.
- `value` là giá trị callback không trong suốt kế thừa. Các điều khiển mới nên sử dụng `action`
để plugin kênh có thể ánh xạ lệnh và callback mà không phải đoán từ văn bản.
- `url`, `webApp` và `web_app` vẫn được chấp nhận làm đầu vào biên đã lỗi thời.
Trình chuẩn hóa bảo toàn các trường này để trình kết xuất có thể phân biệt ngữ nghĩa kế thừa
đã phát hành với hành động có kiểu rõ ràng. Trình tạo mới nên sử dụng `action`.
- `label` là bắt buộc và cũng được dùng trong phương án dự phòng bằng văn bản.
- `style` mang tính tư vấn. Trình kết xuất nên ánh xạ các kiểu không được hỗ trợ sang
một giá trị mặc định an toàn thay vì làm thao tác gửi thất bại.
- `priority` là tùy chọn. Khi một kênh công bố giới hạn hành động và phải
loại bỏ các điều khiển, lõi giữ lại các nút có mức ưu tiên cao hơn trước và bảo toàn
thứ tự ban đầu giữa các nút có cùng mức ưu tiên. Khi tất cả điều khiển đều vừa,
thứ tự do tác giả xác định được bảo toàn.
- `disabled` là tùy chọn. Kênh phải chủ động hỗ trợ bằng `supportsDisabled`; nếu không,
lõi sẽ hạ cấp điều khiển bị vô hiệu hóa thành văn bản dự phòng không tương tác. Một
nút bị vô hiệu hóa luôn chỉ hiển thị nhãn trong văn bản dự phòng, ngay cả khi nó
mang hành động `command`.
- `reusable` là tùy chọn. Các kênh hỗ trợ callback gốc có thể tái sử dụng
có thể giữ hành động khả dụng sau một tương tác thành công. Sử dụng mục này cho
các hành động có thể lặp lại hoặc có tính lũy đẳng như làm mới, kiểm tra hoặc xem thêm chi tiết;
không đặt mục này cho các phê duyệt dùng một lần thông thường và hành động phá hủy.

Ngữ nghĩa của lựa chọn:

- `options[].action` chỉ chấp nhận `command` hoặc `callback`; hành động phê duyệt và liên kết chỉ dành cho nút.
- `options[].value` là giá trị ứng dụng được chọn kế thừa.
- `placeholder` mang tính tư vấn và có thể bị các kênh không hỗ trợ
lựa chọn gốc bỏ qua.
- Nếu một kênh không hỗ trợ lựa chọn, văn bản dự phòng sẽ liệt kê các nhãn.

Ngữ nghĩa của biểu đồ:

- `pie` yêu cầu các giá trị phân đoạn dương.
- `bar`, `area` và `line` sử dụng một mảng `categories` có thứ tự. Mỗi chuỗi
cung cấp chính xác một giá trị hữu hạn cho mỗi danh mục, theo cùng thứ tự.
- Nhãn danh mục và tên chuỗi phải là duy nhất. Các khối biểu đồ không hợp lệ hoặc
không đầy đủ bị loại bỏ trong quá trình chuẩn hóa thay vì âm thầm thay đổi dữ liệu.
- Việc kết xuất biểu đồ gốc phải được chủ động bật thông qua `presentationCapabilities.charts`.
Các kênh khác nhận tiêu đề biểu đồ, trục, danh mục, chuỗi và giá trị
dưới dạng văn bản tất định. Đây cũng là phương án dự phòng hỗ trợ khả năng tiếp cận.

Ngữ nghĩa của bảng:

- `caption` là một tiêu đề ngắn bắt buộc. `headers` phải chứa ít nhất một
nhãn cột duy nhất, không trống.
- `rows` phải chứa ít nhất một hàng. Mỗi hàng phải có chính xác một ô cho mỗi
tiêu đề và mỗi ô phải là một chuỗi không trống hoặc một số hữu hạn.
- `rowHeaderColumnIndex` là chỉ mục tùy chọn bắt đầu từ 0, xác định cột
có các ô cần được trình kết xuất gốc cung cấp dưới dạng tiêu đề hàng.
- Việc chuẩn hóa bảng có tính nguyên tử. Chú thích, tiêu đề, độ rộng hàng, ô
hoặc chỉ mục tiêu đề hàng không hợp lệ sẽ khiến khối bảng bị loại bỏ thay vì cắt bớt hoặc sửa chữa
dữ liệu của nó.
- Việc kết xuất bảng gốc phải được chủ động bật thông qua `presentationCapabilities.tables`.
Các kênh khác nhận chú thích và mọi hàng dưới dạng văn bản tuyến tính
tất định, với khoảng trắng nội bộ được thu gọn:

  ```text
  Pipeline đang mở (bảng)
  - Tài khoản: Acme; Giai đoạn: Đã thắng; ARR: 125000
  - Tài khoản: Globex; Giai đoạn: Đang xem xét; ARR: 82000
  ```

Không có bộ phân biệt `report` riêng. Tạo báo cáo từ `title`,
`tone`, `text`, `context`, `chart`, `table` và các khối hành động. Điều này giúp mỗi
khối có thể được kết xuất độc lập và cung cấp cho toàn bộ báo cáo cùng một
phương án dự phòng bằng văn bản tất định.

## Ví dụ về trình tạo

Thẻ đơn giản:

```json
{
  "title": "Phê duyệt triển khai",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary đã sẵn sàng để thăng cấp." },
    { "type": "context", "text": "Bản dựng 1234, môi trường staging đã vượt qua." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Phê duyệt",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Từ chối",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Nút liên kết chỉ có URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Ghi chú phát hành đã sẵn sàng." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Mở ghi chú",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "Khởi chạy",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Menu chọn:

```json
{
  "title": "Chọn môi trường",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Môi trường",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Sản xuất", "value": "env:prod" }
      ]
    }
  ]
}
```

Biểu đồ:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Doanh thu theo quý",
      "categories": ["Q1", "Q2", "Q3"],
      "series": [
        { "name": "Sản phẩm", "values": [120, 145, 138] },
        { "name": "Dịch vụ", "values": [80, 95, 104] }
      ],
      "xLabel": "Quý",
      "yLabel": "Doanh thu"
    }
  ]
}
```

Báo cáo dạng bảng:

```json
{
  "title": "Báo cáo pipeline",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Các cơ hội hiện tại theo giai đoạn." },
    {
      "type": "table",
      "caption": "Pipeline đang mở",
      "headers": ["Tài khoản", "Giai đoạn", "ARR"],
      "rows": [
        ["Acme", "Đã thắng", 125000],
        ["Globex", "Đang xem xét", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Đã cập nhật từ ảnh chụp nhanh CRM." }
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

Gửi được ghim:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Đã mở chủ đề" \
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

Các plugin kênh khai báo khả năng hỗ trợ kết xuất trên bộ điều hợp gửi đi:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
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

Các giá trị boolean về khả năng mô tả những gì trình kết xuất có thể làm cho tương tác. `limits` tùy chọn mô tả lớp bao chung mà lõi có thể điều chỉnh trước khi gọi
trình kết xuất:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Lõi áp dụng các giới hạn chung cho điều khiển ngữ nghĩa trước khi kết xuất. Trình kết xuất
vẫn chịu trách nhiệm xác thực và cắt bớt lần cuối theo từng nhà cung cấp đối với số lượng
khối gốc, kích thước thẻ, giới hạn URL và các đặc thù của nhà cung cấp không thể biểu đạt
trong hợp đồng chung. Nếu các giới hạn loại bỏ mọi điều khiển khỏi một khối, lõi giữ
các nhãn dưới dạng văn bản ngữ cảnh không tương tác để thông điệp được gửi vẫn có
phương án dự phòng hiển thị được.

## Luồng kết xuất lõi

Trên đường gửi đi chuẩn được CLI và các hành động thông điệp tiêu chuẩn sử dụng, lõi:

1. Chuẩn hóa tải trọng trình bày.
2. Phân giải bộ điều hợp gửi đi của kênh đích.
3. Đọc `presentationCapabilities`.
4. Áp dụng các giới hạn khả năng chung như số lượng hành động, độ dài nhãn và
   số lượng tùy chọn lựa chọn khi bộ điều hợp quảng bá chúng. Các khối biểu đồ và bảng
   trở thành văn bản xác định trừ khi bộ điều hợp quảng bá tường minh
   `charts: true` hoặc `tables: true` tương ứng.
5. Gọi `renderPresentation` khi bộ điều hợp có thể kết xuất tải trọng.
6. Chuyển sang văn bản dự phòng thận trọng khi không có bộ điều hợp hoặc bộ điều hợp không thể kết xuất.
7. Gửi tải trọng kết quả qua đường phân phối kênh thông thường.
8. Áp dụng siêu dữ liệu phân phối như `delivery.pin` sau thông điệp đầu tiên
   được gửi thành công.

Các luồng trả lời hoặc xem trước cục bộ của kênh sử dụng trực tiếp `ReplyPayload`
phải đi vào đường chuẩn đó hoặc hiện thực hóa cùng phương án trình bày dự phòng
trước khi chiếu tải trọng xuống văn bản thuần/phương tiện.

Lõi chịu trách nhiệm về hành vi dự phòng để bên tạo có thể độc lập với kênh. Các plugin
kênh chịu trách nhiệm kết xuất gốc và xử lý tương tác.

## Quy tắc suy giảm

Nội dung trình bày phải an toàn để gửi trên các kênh bị giới hạn.

Văn bản dự phòng bao gồm:

- `title` làm dòng đầu tiên
- Các khối `text` dưới dạng đoạn văn thông thường
- Các khối `context` dưới dạng dòng ngữ cảnh ngắn gọn
- Các khối `divider` dưới dạng dấu phân cách trực quan
- nhãn nút, bao gồm URL cho các nút liên kết
- nhãn tùy chọn lựa chọn
- tiêu đề, loại, trục, danh mục, chuỗi và giá trị của biểu đồ
- chú thích, tiêu đề cột và mọi giá trị hàng của bảng

### Khả năng hiển thị giá trị nút trong phương án dự phòng

Khi một kênh không thể kết xuất các điều khiển tương tác, giá trị nút và lựa chọn
chuyển thành văn bản thuần. Hành vi dự phòng duy trì khả năng sử dụng đồng thời
giữ dữ liệu gọi lại không rõ nghĩa ở chế độ riêng tư:

- **Các hành động có kiểu `command`** kết xuất thành `` label: `command` `` để người dùng có thể
  sao chép lệnh và chạy thủ công trong trường nhập của kênh.
- **Các hành động có kiểu `callback`** và các trường **`value`** cũ chỉ kết xuất
  nhãn. Giá trị gọi lại không rõ nghĩa không được hiển thị trong văn bản dự phòng.
- **Các hành động có kiểu `approval`** chỉ kết xuất nhãn. ID và quyết định phê duyệt là
  dữ liệu vận chuyển và không được hiển thị qua các trình trợ giúp vô hướng chung hoặc văn bản
  dự phòng.
- **Các hành động `url`**, **các hành động `web-app`** dựa trên URL và đầu vào **`url` /
  `webApp` / `web_app`** đã lỗi thời kết xuất văn bản URL cùng với nhãn nút,
  vì URL hiển thị cho người dùng. Các hành động chỉ dành cho tiện ích được lưu trữ chỉ kết xuất nhãn trên
  các kênh không có khả năng khởi chạy tiện ích gốc.
- **Các tùy chọn lựa chọn** chỉ kết xuất nhãn. Giá trị tùy chọn bên dưới không được
  hiển thị trong văn bản dự phòng.

Các bộ điều hợp kênh bổ sung hướng dẫn lệnh thủ công trong giao diện dự phòng của mình (ví dụ:
hướng dẫn bình luận tài liệu Feishu) phải suy ra kiểm tra sự hiện diện của lệnh
từ chính các khối trình bày mà trình kết xuất dự phòng sử dụng, để văn bản
hướng dẫn chỉ xuất hiện khi một lệnh thủ công thực sự được hiển thị.

Các điều khiển gốc không được hỗ trợ nên suy giảm thay vì làm toàn bộ lượt gửi thất bại.
Ví dụ:

- Telegram khi tắt nút nội tuyến sẽ gửi văn bản dự phòng.
- Một kênh không hỗ trợ lựa chọn sẽ liệt kê các tùy chọn lựa chọn dưới dạng văn bản.
- Một kênh không hỗ trợ biểu đồ gốc sẽ liệt kê dữ liệu biểu đồ dưới dạng văn bản.
- Một kênh không hỗ trợ bảng gốc sẽ liệt kê mọi hàng của bảng dưới dạng văn bản.
- Một nút chỉ có URL trở thành nút liên kết gốc hoặc dòng URL dự phòng.
- Lỗi ghim tùy chọn không làm thông điệp đã gửi thất bại.

Ngoại lệ chính là `delivery.pin.required: true`; nếu yêu cầu ghim là
bắt buộc và kênh không thể ghim thông điệp đã gửi, quá trình phân phối sẽ báo lỗi.

## Ánh xạ nhà cung cấp

Các trình kết xuất đi kèm hiện tại:

| Kênh            | Đích kết xuất gốc                          | Ghi chú                                                                                                                                                                                                           |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Thành phần và vùng chứa thành phần         | Giữ nguyên `channelData.discord.components` cũ cho các bên tạo tải trọng gốc theo nhà cung cấp hiện có, nhưng các lượt gửi dùng chung mới nên sử dụng `presentation`.                                                                 |
| Feishu          | Thẻ tương tác                              | Tiêu đề thẻ có thể sử dụng `title`; phần thân tránh lặp lại tiêu đề đó.                                                                                                                                                  |
| Matrix          | Văn bản dự phòng cùng trường sự kiện có cấu trúc | Nút/lựa chọn được quảng bá là được hỗ trợ, nhưng hiện tại mọi khối đều kết xuất thành đầu ra `renderMessagePresentationFallbackText` được mang trong trường sự kiện `com.openclaw.presentation`, không phải tiện ích tương tác gốc. |
| Mattermost      | Văn bản cùng thuộc tính tương tác          | Lựa chọn và dấu phân cách không được hỗ trợ; các khối đó suy giảm thành văn bản.                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                            | Văn bản thuần `message` được bao gồm cùng với thẻ khi cả hai được cung cấp. Lựa chọn, kiểu và trạng thái vô hiệu hóa không được hỗ trợ.                                                                                     |
| Slack           | Block Kit                                 | Kết xuất `chart` thành `data_visualization` gốc và `table` thành `data_table` gốc; giữ nguyên `channelData.slack.blocks` cũ, nhưng các lượt gửi dùng chung mới nên sử dụng `presentation`.                                   |
| Telegram        | Văn bản cùng bàn phím nội tuyến            | Nút/lựa chọn yêu cầu khả năng nút nội tuyến cho bề mặt đích; nếu không, văn bản dự phòng được sử dụng.                                                                                                         |
| Kênh thuần      | Văn bản dự phòng                           | Các kênh không có trình kết xuất vẫn nhận được đầu ra dễ đọc.                                                                                                                                                            |

Khả năng tương thích tải trọng gốc theo nhà cung cấp là một cơ chế hỗ trợ chuyển tiếp cho các
bên tạo phản hồi hiện có. Đây không phải là lý do để thêm các trường gốc dùng chung mới.

## Presentation so với InteractiveReply

`InteractiveReply` là tập con nội bộ cũ hơn được các trình trợ giúp phê duyệt và tương tác
sử dụng. Nó hỗ trợ:

- văn bản
- nút
- lựa chọn

`MessagePresentation` là hợp đồng gửi dùng chung chuẩn. Nó bổ sung:

- tiêu đề
- sắc thái
- ngữ cảnh
- dấu phân cách
- biểu đồ
- bảng
- nút chỉ có URL
- siêu dữ liệu phân phối chung thông qua `ReplyPayload.delivery`

Sử dụng các trình trợ giúp từ `openclaw/plugin-sdk/interactive-runtime` khi kết nối mã
cũ:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Mã mới nên trực tiếp chấp nhận hoặc tạo `MessagePresentation`. Các tải trọng
`interactive` hiện có là tập con đã lỗi thời của `presentation`; hỗ trợ khi chạy
vẫn được duy trì cho các bên tạo cũ.

Các trình trợ giúp chưa lỗi thời cần biết:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  xác thực và ép kiểu một payload không định kiểu (ví dụ: JSON từ cờ CLI
  `--presentation`) thành `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` thu hẹp một khối thành hợp
  `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` và
  `resolveMessagePresentationOptionAction(option)` trả về hành động có kiểu chuẩn tắc
  trong khi vẫn chấp nhận các trường biên đã lỗi thời. Một `action` tường minh
  luôn được ưu tiên.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` chỉ đọc các giá trị vô hướng của lệnh/lệnh gọi lại.
  Một hành động chuẩn tắc không vô hướng không bao giờ chuyển tiếp sang
  `value` bóng kế thừa, nhờ đó ID phê duyệt và đích liên kết vẫn giữ nguyên kiểu.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` kết xuất một khối dữ liệu có cấu trúc
  thành văn bản xác định cho các đường dẫn dự phòng dành riêng cho từng kênh.

Các kiểu `InteractiveReply*` kế thừa và trình trợ giúp chuyển đổi được đánh dấu
`@deprecated` trong SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` và
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` và
`presentationToInteractiveControlsReply(...)` vẫn khả dụng dưới dạng cầu nối trình kết xuất
cho các triển khai kênh kế thừa. Mã tạo mới không nên gọi
chúng; hãy gửi `presentation` và để cơ chế điều chỉnh của lõi/kênh xử lý việc kết xuất.

Các trình trợ giúp phê duyệt cũng có các phương án thay thế ưu tiên phần trình bày:

- sử dụng `buildApprovalPresentationFromActionDescriptors(...)` thay cho
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- sử dụng `buildApprovalPresentation(...)` thay cho
  `buildApprovalInteractiveReply(...)`
- sử dụng `buildExecApprovalPresentation(...)` thay cho
  `buildExecApprovalInteractiveReply(...)`

Các trình dựng đã phát hành đó vẫn dựa trên lệnh để bảo đảm khả năng tương thích với plugin. Gateway
và mã kênh tích hợp sở hữu một loại phê duyệt bền vững nên sử dụng
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` hoặc
`buildTypedPluginApprovalPendingReplyPayload(...)` để các lớp vận chuyển nhận được
một hành động `approval` tường minh thay vì suy luận ngữ nghĩa từ văn bản `/approve`.

`renderMessagePresentationFallbackText(...)` trả về chuỗi trống cho
các khối trình bày không có văn bản dự phòng, chẳng hạn như một phần trình bày
chỉ có đường phân cách. Các lớp vận chuyển yêu cầu nội dung gửi không trống có thể truyền
`emptyFallback` để chủ động dùng nội dung tối thiểu mà không thay đổi hợp đồng dự phòng
mặc định.

## Ghim khi gửi

Ghim là hành vi gửi, không phải phần trình bày. Sử dụng `delivery.pin` thay cho
các trường riêng của nhà cung cấp như `channelData.telegram.pin`.

Ngữ nghĩa:

- `pin: true` ghim tin nhắn đầu tiên được gửi thành công.
- `pin.notify` mặc định là `false`.
- `pin.required` mặc định là `false`.
- Lỗi ghim không bắt buộc sẽ được hạ cấp và giữ nguyên tin nhắn đã gửi.
- Lỗi ghim bắt buộc khiến quá trình gửi thất bại.
- Tin nhắn được chia thành nhiều phần sẽ ghim phần đầu tiên đã gửi, không phải phần cuối.

Các hành động tin nhắn `pin`, `unpin` và `pins` thủ công vẫn tồn tại cho
các tin nhắn hiện có khi nhà cung cấp hỗ trợ những thao tác đó.

## Danh sách kiểm tra dành cho tác giả plugin

- Khai báo `presentation` từ `describeMessageTool(...)` khi kênh có thể
  kết xuất hoặc hạ cấp phần trình bày ngữ nghĩa một cách an toàn.
- Thêm `presentationCapabilities` vào bộ điều hợp gửi đi của runtime.
- Triển khai `renderPresentation` trong mã runtime, không phải mã thiết lập plugin
  của mặt phẳng điều khiển.
- Không đưa các thư viện giao diện người dùng gốc vào các đường dẫn thiết lập/danh mục nóng.
- Khai báo các giới hạn khả năng chung trên `presentationCapabilities.limits` khi
  đã biết chúng.
- Giữ nguyên các giới hạn nền tảng cuối cùng trong trình kết xuất và kiểm thử.
- Thêm kiểm thử dự phòng cho biểu đồ, bảng, nút, trường chọn, nút URL
  không được hỗ trợ, nội dung tiêu đề/văn bản trùng lặp và các lượt gửi kết hợp `message` cùng `presentation`.
- Chỉ thêm hỗ trợ ghim khi gửi thông qua `deliveryCapabilities.pin` và
  `pinDeliveredMessage` khi nhà cung cấp có thể ghim ID của tin nhắn đã gửi.
- Không cung cấp các trường thẻ/khối/thành phần/nút mới riêng của nhà cung cấp thông qua
  lược đồ hành động tin nhắn dùng chung.

## Tài liệu liên quan

- [CLI tin nhắn](/vi/cli/message)
- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
- [Kiến trúc Plugin](/vi/plugins/architecture-internals#message-tool-schemas)
- [Kế hoạch tái cấu trúc phần trình bày kênh](/vi/plan/ui-channels)
