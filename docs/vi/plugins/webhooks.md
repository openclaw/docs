---
read_when:
    - Bạn muốn kích hoạt hoặc điều khiển TaskFlow từ một hệ thống bên ngoài
    - Bạn đang cấu hình plugin webhooks đi kèm
summary: 'Plugin Webhooks: điểm tiếp nhận TaskFlow có xác thực dành cho hoạt động tự động hóa bên ngoài đáng tin cậy'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-19T05:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks bổ sung các tuyến HTTP đã xác thực để một hệ thống bên ngoài đáng tin cậy
(Zapier, n8n, một tác vụ CI, một dịch vụ nội bộ) có thể tạo và điều khiển
các TaskFlow OpenClaw được quản lý qua HTTP mà không cần viết plugin tùy chỉnh.

Plugin chạy bên trong tiến trình Gateway. Đối với Gateway từ xa, hãy cài đặt và
cấu hình plugin trên máy chủ đó, sau đó khởi động lại Gateway. Plugin không đi kèm
tuyến nào được cấu hình, vì vậy sẽ không thực hiện gì cho đến khi bạn thêm ít nhất một tuyến.

## Cấu hình các tuyến

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
              description: "Cầu nối TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Các trường của tuyến:

| Trường          | Bắt buộc | Mặc định                      | Ghi chú                                         |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | không       | `true`                        |                                               |
| `path`         | không       | `/plugins/webhooks/<routeId>` | Phải là duy nhất trên tất cả các tuyến.                 |
| `sessionKey`   | có      | -                             | Phiên sở hữu các TaskFlow được liên kết.        |
| `secret`       | có      | -                             | Chuỗi thuần túy hoặc SecretRef (bên dưới).          |
| `controllerId` | không       | `webhooks/<routeId>`          | Được dùng làm trình điều khiển `create_flow` mặc định. |
| `description`  | không       | -                             | Chỉ là ghi chú dành cho người vận hành.                           |

`secret` chấp nhận chuỗi thuần túy hoặc SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

SecretRef được phân giải vào ảnh chụp nhanh cấu hình khởi động của Gateway. Khi bí mật của một tuyến
không thể phân giải, Gateway vẫn tiếp tục chạy và chính tuyến đó vẫn
được đăng ký nhưng ở trạng thái lạnh: các yêu cầu nhận lỗi xác thực chung (`401`).
Các tuyến khác vẫn khả dụng. Hãy sửa nguồn SecretRef, sau đó tải lại hoặc khởi động lại
Gateway để kích hoạt ảnh chụp nhanh mới. Các giá trị SecretRef không bao giờ được phân giải
trên đường dẫn yêu cầu công khai.

## Mô hình bảo mật

Mỗi tuyến hoạt động với quyền hạn TaskFlow của `sessionKey` đã cấu hình: tuyến đó
có thể kiểm tra và sửa đổi mọi TaskFlow thuộc sở hữu của phiên đó. Quyền truy cập TaskFlow
luôn đi qua `api.runtime.tasks.managedFlows.bindSession(...)`, vì vậy
một tuyến không bao giờ có thể hoạt động bên ngoài phiên được liên kết. Để giới hạn phạm vi ảnh hưởng:

- Sử dụng một bí mật mạnh, duy nhất cho mỗi tuyến.
- Ưu tiên SecretRef thay vì bí mật văn bản thuần túy nội tuyến.
- Liên kết các tuyến với phiên có phạm vi hẹp nhất phù hợp với quy trình làm việc.
- Chỉ công khai đường dẫn webhook cụ thể mà bạn cần.

Thứ tự xử lý yêu cầu cho mỗi đường dẫn: kiểm tra phương thức HTTP (chỉ `POST`) và
`Content-Type: application/json`, sau đó giới hạn tốc độ theo cửa sổ cố định (120
yêu cầu trong mỗi cửa sổ 60 giây cho mỗi khóa đường-dẫn+IP-máy-khách, theo dõi tối đa
4,096 khóa), tiếp theo là giới hạn yêu cầu đang xử lý (8 yêu cầu đồng thời cho mỗi khóa, theo dõi tối đa
4,096 khóa), rồi xác thực bằng bí mật dùng chung, sau đó đọc nội dung JSON với giới hạn 256 KB /
15 giây. Các yêu cầu không vượt qua kiểm tra trước đó sẽ không bao giờ đến
các bước sau.

## Định dạng yêu cầu

Gửi yêu cầu `POST` với `Content-Type: application/json` và một trong hai
`Authorization: Bearer <secret>` hoặc `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Xem xét hàng đợi đến"}'
```

## Các hành động được hỗ trợ

| Hành động             | Mục đích                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Tạo một TaskFlow được quản lý cho phiên của tuyến.                 |
| `get_flow`         | Truy xuất một TaskFlow theo id.                                          |
| `list_flows`       | Liệt kê các TaskFlow cho phiên của tuyến.                            |
| `find_latest_flow` | Truy xuất TaskFlow được cập nhật gần đây nhất.                          |
| `resolve_flow`     | Phân giải một TaskFlow theo mã thông báo bất minh.                                |
| `get_task_summary` | Truy xuất bản tóm tắt tác vụ cho một TaskFlow.                             |
| `set_waiting`      | Đánh dấu TaskFlow là đang chờ, kèm dữ liệu trạng thái/chờ tùy chọn.            |
| `resume_flow`      | Tiếp tục một TaskFlow đang chờ/bị chặn.                                 |
| `finish_flow`      | Đánh dấu TaskFlow là đã hoàn tất.                                          |
| `fail_flow`        | Đánh dấu TaskFlow là thất bại.                                            |
| `request_cancel`   | Yêu cầu hủy theo cơ chế hợp tác.                                  |
| `cancel_flow`      | Hủy một TaskFlow (có thể trả về `202` nếu các tác vụ con vẫn đang hoạt động). |
| `run_task`         | Tạo một tác vụ con được quản lý bên trong TaskFlow hiện có.           |

Các hành động sửa đổi (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) yêu cầu `flowId` và `expectedRevision` để kiểm soát
đồng thời lạc quan; bản sửa đổi cũ trả về `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Xem xét hàng đợi đến",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Các giá trị `runtime` được phép: `subagent`, `acp`. `startedAt`, `lastEventAt` và
`progressSummary` chỉ hợp lệ khi `status` là `"running"`; gửi chúng
với bất kỳ trạng thái nào khác sẽ trả về `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Kiểm tra lô tin nhắn tiếp theo"
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
  "error": "Không tìm thấy TaskFlow.",
  "result": {}
}
```

Các chế độ xem luồng và tác vụ không bao giờ chứa siêu dữ liệu về chủ sở hữu/phiên, vì vậy phản hồi không thể
làm lộ `sessionKey` được liên kết với tuyến. Các giá trị `code` bao gồm `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` và
các mã dự phòng dành riêng cho hành động (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) khi một thao tác sửa đổi bị từ chối vì
lý do không thuộc các mã đã nêu ở trên.

## Liên quan

- [Hook](/vi/automation/hooks) - các hook nội bộ hướng sự kiện so với cầu nối TaskFlow dựa trên HTTP này
- [Webhook Gateway (cấu hình `hooks.*`)](/vi/automation/cron-jobs#webhooks) - tính năng điểm cuối HTTP Gateway chung riêng biệt; không giống các tuyến của plugin này
- [SDK thời gian chạy Plugin](/vi/plugins/sdk-runtime)
- [Webhook CLI](/vi/cli/webhooks)
