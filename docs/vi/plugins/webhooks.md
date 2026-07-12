---
read_when:
    - Bạn muốn kích hoạt hoặc điều khiển TaskFlow từ một hệ thống bên ngoài
    - Bạn đang cấu hình Plugin webhook đi kèm
summary: 'Plugin Webhook: đầu vào TaskFlow được xác thực dành cho tác vụ tự động hóa bên ngoài đáng tin cậy'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-12T08:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks bổ sung các tuyến HTTP có xác thực để một hệ thống bên ngoài đáng tin cậy
(Zapier, n8n, tác vụ CI, dịch vụ nội bộ) có thể tạo và điều khiển các
TaskFlow được OpenClaw quản lý qua HTTP mà không cần viết plugin tùy chỉnh.

Plugin chạy bên trong tiến trình Gateway. Với Gateway từ xa, hãy cài đặt và
cấu hình plugin trên máy chủ đó, sau đó khởi động lại Gateway. Plugin không
đi kèm tuyến nào được cấu hình, nên sẽ không làm gì cho đến khi bạn thêm ít nhất một tuyến.

## Cấu hình tuyến

Đặt cấu hình trong `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Cầu nối TaskFlow của Zapier",
            },
          },
        },
      },
    },
  },
}
```

Các trường của tuyến:

| Trường         | Bắt buộc | Mặc định                      | Ghi chú                                                 |
| -------------- | -------- | ----------------------------- | ------------------------------------------------------- |
| `enabled`      | không    | `true`                        |                                                         |
| `path`         | không    | `/plugins/webhooks/<routeId>` | Phải là duy nhất giữa các tuyến.                        |
| `sessionKey`   | có       | -                             | Phiên sở hữu các TaskFlow được liên kết.                |
| `secret`       | có       | -                             | Chuỗi thuần túy hoặc SecretRef (bên dưới).              |
| `controllerId` | không    | `webhooks/<routeId>`          | Được dùng làm bộ điều khiển `create_flow` mặc định.     |
| `description`  | không    | -                             | Chỉ là ghi chú dành cho người vận hành.                 |

`secret` chấp nhận một chuỗi thuần túy hoặc SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Mọi tuyến đã cấu hình đều được đăng ký khi khởi động, bất kể bí mật của tuyến
hiện có phân giải được hay không. Bí mật không thể phân giải không vô hiệu hóa
hoặc bỏ qua tuyến — các yêu cầu đến tuyến đó sẽ không xác thực được (`401`) cho
đến khi bí mật có thể được phân giải. Các giá trị SecretRef được phân giải lại
trong mỗi yêu cầu, vì vậy việc luân chuyển bí mật cơ sở (biến môi trường, tệp
hoặc đầu ra lệnh thực thi) có hiệu lực mà không cần khởi động lại Gateway.

## Mô hình bảo mật

Mỗi tuyến hoạt động với quyền TaskFlow của `sessionKey` đã cấu hình: tuyến có
thể kiểm tra và thay đổi mọi TaskFlow thuộc sở hữu của phiên đó. Quyền truy cập
TaskFlow luôn đi qua `api.runtime.tasks.managedFlows.bindSession(...)`, vì vậy
tuyến không bao giờ có thể hoạt động bên ngoài phiên được liên kết. Để giới hạn
phạm vi ảnh hưởng:

- Sử dụng một bí mật mạnh và duy nhất cho mỗi tuyến.
- Ưu tiên SecretRef thay vì bí mật văn bản thuần túy nội tuyến.
- Liên kết tuyến với phiên có phạm vi hẹp nhất phù hợp với quy trình làm việc.
- Chỉ công khai đường dẫn Webhook cụ thể mà bạn cần.

Thứ tự xử lý yêu cầu cho mỗi đường dẫn: kiểm tra phương thức HTTP (chỉ `POST`)
và `Content-Type: application/json`, sau đó giới hạn tốc độ theo cửa sổ cố định
(120 yêu cầu trong mỗi cửa sổ 60 giây cho từng khóa đường-dẫn+IP-máy-khách, theo
dõi tối đa 4.096 khóa), tiếp theo là giới hạn yêu cầu đang xử lý (8 yêu cầu đồng
thời cho mỗi khóa, theo dõi tối đa 4.096 khóa), rồi xác thực bằng bí mật dùng
chung, cuối cùng là đọc phần thân JSON tối đa 256 KB trong 15 giây. Các yêu cầu
không vượt qua bước kiểm tra trước đó sẽ không bao giờ đến được các bước sau.

## Định dạng yêu cầu

Gửi yêu cầu `POST` với `Content-Type: application/json` và
`Authorization: Bearer <secret>` hoặc `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Các hành động được hỗ trợ

| Hành động          | Mục đích                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| `create_flow`      | Tạo một TaskFlow được quản lý cho phiên của tuyến.                               |
| `get_flow`         | Truy xuất một TaskFlow theo mã định danh.                                        |
| `list_flows`       | Liệt kê các TaskFlow cho phiên của tuyến.                                        |
| `find_latest_flow` | Truy xuất TaskFlow được cập nhật gần đây nhất.                                   |
| `resolve_flow`     | Phân giải một TaskFlow bằng mã thông báo bất khả tri.                            |
| `get_task_summary` | Truy xuất bản tóm tắt tác vụ của một TaskFlow.                                   |
| `set_waiting`      | Đánh dấu một TaskFlow là đang chờ, kèm dữ liệu trạng thái/chờ tùy chọn.           |
| `resume_flow`      | Tiếp tục một TaskFlow đang chờ/bị chặn.                                          |
| `finish_flow`      | Đánh dấu một TaskFlow là đã hoàn tất.                                            |
| `fail_flow`        | Đánh dấu một TaskFlow là thất bại.                                               |
| `request_cancel`   | Yêu cầu hủy theo cơ chế phối hợp.                                                 |
| `cancel_flow`      | Hủy một TaskFlow (có thể trả về `202` nếu các tác vụ con vẫn đang hoạt động).     |
| `run_task`         | Tạo một tác vụ con được quản lý bên trong một TaskFlow hiện có.                   |

Các hành động thay đổi (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) yêu cầu `flowId` và `expectedRevision` để kiểm soát đồng thời
lạc quan; bản sửa đổi cũ trả về `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Các giá trị `runtime` được phép: `subagent`, `acp`. `startedAt`, `lastEventAt`
và `progressSummary` chỉ hợp lệ khi `status` là `"running"`; gửi chúng với bất kỳ
trạng thái nào khác sẽ trả về `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Cấu trúc phản hồi

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Chế độ xem luồng và tác vụ không bao giờ chứa siêu dữ liệu về chủ sở hữu/phiên,
vì vậy phản hồi không thể làm lộ `sessionKey` được liên kết của tuyến. Các giá
trị `code` bao gồm `not_found`, `not_managed`, `revision_conflict`,
`persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`,
`invalid_request`, `request_rejected` và các mã dự phòng dành riêng cho từng
hành động (`mutation_rejected`, `create_rejected`, `task_not_created`,
`cancel_rejected`) khi một thao tác thay đổi bị từ chối vì lý do không thuộc
các mã đã nêu ở trên.

## Liên quan

- [Hooks](/vi/automation/hooks) - hook nội bộ được kích hoạt theo sự kiện so với cầu nối TaskFlow dựa trên HTTP này
- [Webhook của Gateway (cấu hình `hooks.*`)](/vi/automation/cron-jobs#webhooks) - tính năng điểm cuối HTTP chung riêng biệt của Gateway; không giống các tuyến của plugin này
- [SDK thời gian chạy của plugin](/vi/plugins/sdk-runtime)
- [Webhook CLI](/vi/cli/webhooks)
