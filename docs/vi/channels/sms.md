---
read_when:
    - Bạn muốn kết nối OpenClaw với SMS thông qua Twilio
    - Bạn cần thiết lập Webhook SMS hoặc danh sách cho phép
summary: Thiết lập kênh SMS Twilio, kiểm soát truy cập và cấu hình webhook
title: SMS
x-i18n:
    generated_at: "2026-07-12T07:44:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw nhận và gửi SMS thông qua số điện thoại Twilio hoặc Messaging Service. Gateway đăng ký một tuyến Webhook đến (mặc định là `/webhooks/sms`), mặc định xác thực chữ ký yêu cầu của Twilio và gửi phản hồi trở lại thông qua Messages API của Twilio.

Trạng thái: Plugin chính thức, được cài đặt riêng. Chỉ hỗ trợ văn bản: không hỗ trợ MMS/phương tiện, chỉ hỗ trợ tin nhắn trực tiếp.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách tin nhắn trực tiếp mặc định cho SMS là ghép nối.
  </Card>
  <Card title="Bảo mật Gateway" icon="shield" href="/vi/gateway/security">
    Xem xét mức độ công khai của Webhook và các biện pháp kiểm soát quyền truy cập của người gửi.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và khắc phục trên nhiều kênh.
  </Card>
</CardGroup>

## Trước khi bắt đầu

Bạn cần:

- Cài đặt Plugin SMS chính thức bằng `openclaw plugins install @openclaw/sms`.
- Một tài khoản Twilio có số điện thoại hỗ trợ SMS hoặc một Twilio Messaging Service.
- Twilio Account SID và Auth Token.
- Một URL HTTPS công khai có thể truy cập Gateway OpenClaw của bạn.
- Lựa chọn chính sách người gửi: `pairing` (mặc định) cho mục đích sử dụng riêng tư, `allowlist` cho các số điện thoại được phê duyệt trước hoặc chỉ dùng `open` khi bạn chủ ý cung cấp quyền truy cập SMS công khai.

Một số Twilio có thể phục vụ cả SMS và [Cuộc gọi thoại](/vi/plugins/voice-call) nếu có cả hai khả năng. Webhook SMS và Webhook thoại được cấu hình riêng trong Twilio và sử dụng các đường dẫn Gateway riêng biệt; trang này chỉ đề cập đến Webhook SMS.

## Thiết lập nhanh

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Tạo hoặc chọn người gửi Twilio">
    Trong Twilio, mở **Phone Numbers > Manage > Active numbers** và chọn một số hỗ trợ SMS. Lưu lại:

    - Account SID, ví dụ `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Số điện thoại người gửi, ví dụ `+15551234567`

    Nếu bạn sử dụng Messaging Service thay cho một số người gửi cố định, hãy lưu Messaging Service SID, ví dụ `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Cấu hình kênh SMS">

Lưu nội dung này thành `sms.patch.json5` và thay đổi các phần giữ chỗ:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Áp dụng cấu hình:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Trỏ Twilio đến Webhook của Gateway">
    Trong phần cài đặt số điện thoại Twilio, mở **Messaging** và đặt **A message comes in** thành:

```text
https://gateway.example.com/webhooks/sms
```

    Sử dụng HTTP `POST`. Đường dẫn cục bộ mặc định là `/webhooks/sms`; thay đổi `channels.sms.webhookPath` nếu bạn cần một tuyến khác.

  </Step>

  <Step title="Công khai chính xác đường dẫn Webhook SMS">
    URL công khai của bạn phải định tuyến đường dẫn SMS đến tiến trình Gateway (cổng mặc định `18789`). Nếu bạn sử dụng Tailscale Funnel để kiểm thử cục bộ, hãy công khai `/webhooks/sms` một cách rõ ràng:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Cuộc gọi thoại và SMS sử dụng các đường dẫn Webhook riêng biệt. Nếu cùng một số Twilio xử lý cả hai, hãy duy trì cấu hình cho cả hai tuyến trong Twilio và trong đường hầm của bạn.

  </Step>

  <Step title="Khởi động Gateway và phê duyệt người gửi đầu tiên">

```bash
openclaw gateway
```

Gửi một tin nhắn văn bản đến số Twilio. Tin nhắn đầu tiên sẽ tạo một yêu cầu ghép nối. Phê duyệt yêu cầu đó:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>
</Steps>

## Ví dụ cấu hình

Tất cả khóa đều nằm dưới `channels.sms` (và theo từng tài khoản dưới `channels.sms.accounts.<id>`):

| Khóa                                    | Mặc định        | Mục đích                                                                  |
| --------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| `enabled`                               | `true`          | Bật hoặc tắt kênh/tài khoản.                                              |
| `accountSid`                            | —               | Twilio Account SID (`AC...`).                                             |
| `authToken`                             | —               | Twilio Auth Token; chuỗi văn bản thuần hoặc SecretRef.                    |
| `fromNumber`                            | —               | Số người gửi theo định dạng E.164.                                        |
| `messagingServiceSid`                   | —               | Messaging Service SID (`MG...`) được dùng khi không phân giải được `fromNumber`. |
| `defaultTo`                             | —               | Đích mặc định khi luồng gửi không chỉ định đích rõ ràng.                  |
| `webhookPath`                           | `/webhooks/sms` | Đường dẫn HTTP của Gateway cho các Webhook Twilio đến.                    |
| `publicWebhookUrl`                      | —               | URL công khai được cấu hình trong Twilio; bắt buộc để xác thực chữ ký.    |
| `dangerouslyDisableSignatureValidation` | `false`         | Bỏ qua kiểm tra `X-Twilio-Signature`; chỉ dùng để kiểm thử đường hầm cục bộ. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` hoặc `disabled`.                           |
| `allowFrom`                             | `[]`            | Các số người gửi được phép theo E.164 hoặc `"*"` với `dmPolicy: "open"`.  |
| `textChunkLimit`                        | `1500`          | Số ký tự tối đa trong mỗi phần SMS gửi đi.                                |
| `accounts`, `defaultAccount`            | —               | Ánh xạ nhiều tài khoản và mã định danh tài khoản mặc định.                |

### Tệp cấu hình

Sử dụng thiết lập bằng tệp cấu hình khi bạn muốn định nghĩa kênh đi cùng cấu hình Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Biến môi trường

Các biến môi trường chỉ áp dụng cho tài khoản mặc định; giá trị cấu hình được ưu tiên hơn giá trị biến môi trường.

| Biến                                            | Ánh xạ tới                                          |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (bí danh `TWILIO_SMS_FROM`) | `fromNumber`                                      |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (phân tách bằng dấu phẩy)               |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Sau đó bật kênh trong cấu hình:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Auth Token dạng SecretRef

`authToken` có thể là một SecretRef (`source: "env" | "file" | "exec"`). Sử dụng tùy chọn này khi Gateway cần phân giải Twilio Auth Token từ môi trường thực thi bí mật của OpenClaw thay vì lưu cấu hình dưới dạng văn bản thuần:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Biến môi trường hoặc nhà cung cấp bí mật được tham chiếu phải khả dụng đối với môi trường thực thi Gateway. Khởi động lại các tiến trình Gateway được quản lý sau khi thay đổi biến môi trường của máy chủ.

### Người gửi qua Messaging Service

Sử dụng `messagingServiceSid` thay cho `fromNumber` khi Twilio cần chọn người gửi thông qua Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Nếu cả `fromNumber` và `messagingServiceSid` đều tồn tại sau khi phân giải cấu hình và biến môi trường, `fromNumber` sẽ được sử dụng.

### Đích gửi đi mặc định

Đặt `defaultTo` khi quy trình tự động hóa hoặc phân phối do tác nhân khởi tạo cần có một đích mặc định nếu luồng gửi không chỉ định đích rõ ràng:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Kiểm soát quyền truy cập

`channels.sms.dmPolicy` kiểm soát quyền truy cập SMS trực tiếp:

- `pairing` (mặc định): người gửi không xác định nhận được mã ghép nối; phê duyệt bằng `openclaw pairing approve sms <CODE>`.
- `allowlist`: chỉ xử lý người gửi có trong `allowFrom`. `allowFrom` trống sẽ từ chối mọi người gửi (Gateway ghi cảnh báo khi khởi động).
- `open`: quy trình xác thực cấu hình yêu cầu `allowFrom` phải chứa `"*"`. Nếu không có ký tự đại diện, chỉ các số được liệt kê mới có thể trò chuyện.
- `disabled`: tất cả tin nhắn trực tiếp đến đều bị loại bỏ.

Các mục trong `allowFrom` phải là số điện thoại theo định dạng E.164, chẳng hạn `+15551234567`. Các tiền tố `sms:` và `twilio-sms:` được chấp nhận và chuẩn hóa. Đối với trợ lý riêng tư, nên dùng `dmPolicy: "allowlist"` với các số điện thoại được chỉ định rõ ràng:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Gửi SMS

Khi kênh SMS được chọn, đích có thể là số E.164 thuần hoặc có tiền tố `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Khi việc chọn kênh là ngầm định, tiền tố `twilio-sms:` sẽ chọn kênh này mà không chiếm dụng tiền tố dịch vụ `sms:`, vốn được iMessage sử dụng để chọn hình thức gửi SMS qua nhà mạng cho các đích riêng của nó:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI yêu cầu chỉ định rõ `--target`. `defaultTo` dành cho các đường dẫn phân phối tự động hóa và do tác nhân khởi tạo, nơi đích có thể được phân giải từ cấu hình kênh.

Phản hồi của tác nhân trong các cuộc hội thoại SMS đến sẽ tự động được gửi lại cho người gửi thông qua người gửi Twilio đã cấu hình.

Đầu ra SMS là văn bản thuần. OpenClaw loại bỏ Markdown, chuyển các khối mã có hàng rào thành văn bản phẳng, viết lại liên kết thành `nhãn (url)` và chia các phản hồi dài thành những phần tối đa `textChunkLimit` ký tự (mặc định là 1500) trước khi gửi chúng thông qua Twilio.

## Xác minh thiết lập

Sau khi Gateway khởi động:

1. Xác nhận nhật ký Gateway hiển thị tuyến Webhook SMS.
2. Chạy phép kiểm tra phía Twilio (kiểm tra URL/phương thức Webhook Twilio đã cấu hình và các lỗi nhận gần đây):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Gửi SMS từ điện thoại của bạn đến số Twilio.
4. Chạy `openclaw pairing list sms`.
5. Phê duyệt mã ghép nối bằng `openclaw pairing approve sms <CODE>`.
6. Gửi một SMS khác và xác nhận tác nhân phản hồi.

Để chỉ kiểm thử gửi đi, hãy dùng:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Kiểm thử đầu cuối từ iMessage/SMS trên macOS

Trên máy Mac có thể gửi SMS qua nhà mạng bằng Messages, bạn có thể dùng `imsg` để điều khiển phía gửi mà không cần thao tác trên điện thoại:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Tin nhắn đầu tiên sẽ tạo một yêu cầu ghép nối. Tin nhắn thứ hai sẽ nhận phản hồi của tác nhân thông qua Twilio.

## Bảo mật Webhook

Theo mặc định, OpenClaw xác thực `X-Twilio-Signature` bằng `publicWebhookUrl` và `authToken`. Hãy giữ phần điểm cuối của `publicWebhookUrl` khớp từng byte với URL được cấu hình trong Twilio, bao gồm lược đồ, máy chủ, đường dẫn và chuỗi truy vấn. OpenClaw loại trừ các phân đoạn [ghi đè kết nối](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) của Twilio (`#...`) khỏi quá trình tính chữ ký theo yêu cầu của Twilio.

Độc lập với việc xác thực chữ ký, tuyến Webhook cũng thực thi:

- Chỉ chấp nhận `POST`.
- Giới hạn 30 yêu cầu mỗi phút cho mỗi địa chỉ IP nguồn (vượt quá sẽ trả về HTTP 429).
- `AccountSid` trong tải trọng phải khớp với `accountSid` đã cấu hình (nếu không sẽ trả về HTTP 403).
- Các giá trị `MessageSid` được phát lại sẽ được loại bỏ trùng lặp trong 10 phút.
- Bộ nhớ đệm phát lại của mỗi tài khoản SMS lưu tối đa 10.000 SID tin nhắn còn hiệu lực. Khi tất cả vị trí đều còn hiệu lực, các Webhook mới cho tài khoản đó sẽ bị từ chối theo cơ chế đóng an toàn bằng HTTP 429 và tiêu đề `Retry-After` cho đến khi vị trí cũ nhất hết hạn.
- Nội dung yêu cầu lớn hơn 32 KB sẽ bị từ chối.

Theo mặc định, Twilio không thử lại HTTP 429 và cũng không ghi nhận hỗ trợ cho `Retry-After` trong tài liệu. Các ghi đè kết nối `#rp=4xx` và `#rp=all` cho phép thử lại lỗi 4xx, nhưng Twilio giới hạn toàn bộ giao dịch thử lại ở 15 giây, vì vậy quá trình thử lại vẫn có thể kết thúc trước khi một vị trí trong bộ nhớ đệm phát lại hết hạn. Hãy cấu hình URL dự phòng khi cần một trình xử lý khác tiếp nhận các lượt phân phối thất bại; coi phản hồi 429 là một lần từ chối theo cơ chế đóng an toàn, không phải cơ chế tạo áp lực ngược đáng tin cậy.

Chỉ để kiểm thử đường hầm cục bộ, bạn có thể đặt:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Không sử dụng chế độ tắt xác thực chữ ký trên Gateway công khai.

## Cấu hình nhiều tài khoản

Sử dụng `accounts` khi bạn vận hành nhiều số Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Mỗi tài khoản phải sử dụng một `webhookPath` riêng biệt; Gateway từ chối đăng ký tuyến Webhook có đường dẫn đã thuộc về tài khoản khác. Các giá trị dự phòng từ môi trường `TWILIO_*`/`SMS_*` chỉ áp dụng cho tài khoản mặc định; đặt `defaultAccount` để thay đổi tài khoản mặc định.

## Khắc phục sự cố

### Twilio trả về 403 hoặc OpenClaw từ chối Webhook

Kiểm tra để đảm bảo `publicWebhookUrl` khớp chính xác với URL được cấu hình trong Twilio, bao gồm lược đồ, máy chủ, đường dẫn và chuỗi truy vấn. Twilio ký chuỗi URL công khai, vì vậy việc proxy ghi lại URL và sử dụng tên máy chủ thay thế có thể làm hỏng quá trình xác thực chữ ký.

Phản hồi 403 kèm `Invalid account` có nghĩa là `AccountSid` trong tải trọng nhận vào không khớp với `accountSid` đã cấu hình; hãy kiểm tra để đảm bảo Webhook trỏ đến tài khoản sở hữu số điện thoại đó.

### Không xuất hiện yêu cầu ghép nối

Kiểm tra URL và phương thức Webhook **Messaging** của số Twilio. URL phải trỏ đến URL Webhook SMS và sử dụng `POST`. Đồng thời xác nhận rằng Gateway có thể được truy cập từ Internet công cộng hoặc thông qua đường hầm của bạn.

Nếu nhật ký tin nhắn Twilio hiển thị lỗi `11200`, Twilio đã chấp nhận SMS nhận vào nhưng không thể truy cập Webhook của bạn. Hãy kiểm tra:

- **Messaging > A message comes in** trong Twilio trỏ đến `publicWebhookUrl`.
- Phương thức là `POST`.
- Đường hầm hoặc proxy ngược công khai chính xác `webhookPath`; đối với Tailscale Funnel, hãy chạy `tailscale funnel status` và xác nhận `/webhooks/sms` được liệt kê.
- `publicWebhookUrl` sử dụng cùng lược đồ, máy chủ, đường dẫn và chuỗi truy vấn mà Twilio gửi để quá trình xác thực chữ ký có thể tái tạo URL đã ký.

`openclaw channels status --channel sms --probe` hiển thị cả các cài đặt Webhook Twilio không khớp lẫn các lỗi `11200` gần đây.

### Gửi đi thất bại

Xác nhận rằng `accountSid`, `authToken` và một trong hai giá trị `fromNumber` hoặc `messagingServiceSid` đã được phân giải. Nếu sử dụng tài khoản Twilio dùng thử, số điện thoại đích có thể cần được xác minh trong Twilio trước khi có thể gửi SMS đi.

### Tin nhắn đến nhưng tác nhân không trả lời

Kiểm tra `dmPolicy` và `allowFrom`. Với chính sách `pairing` mặc định, người gửi phải được phê duyệt trước khi các lượt tương tác thông thường với tác nhân được xử lý.
