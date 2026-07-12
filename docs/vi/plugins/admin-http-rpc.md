---
read_when:
    - Xây dựng công cụ phía máy chủ không thể sử dụng trình khách RPC WebSocket của Gateway
    - Cung cấp tính năng tự động hóa quản trị Gateway qua một điểm truy cập đầu vào riêng tư và đáng tin cậy
    - Kiểm tra mô hình bảo mật cho việc truy cập các phương thức Gateway qua HTTP
summary: Cung cấp các phương thức mặt phẳng điều khiển Gateway đã chọn thông qua Plugin admin-http-rpc đi kèm, có cơ chế tham gia tùy chọn
title: Plugin RPC HTTP quản trị
x-i18n:
    generated_at: "2026-07-12T08:08:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin `admin-http-rpc` đi kèm cung cấp qua HTTP một tập hợp các phương thức mặt phẳng điều khiển của Gateway được đưa vào danh sách cho phép, dành cho hoạt động tự động hóa đáng tin cậy trên máy chủ không thể duy trì kết nối WebSocket với Gateway.

Plugin này được phân phối cùng OpenClaw nhưng mặc định bị vô hiệu hóa; khi bị vô hiệu hóa, tuyến không được đăng ký. Khi được bật, plugin thêm `POST /api/v1/admin/rpc` trên cùng trình lắng nghe với Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Chỉ bật plugin này cho công cụ riêng tư trên máy chủ, hoạt động tự động hóa trong tailnet hoặc một điểm truy cập nội bộ đáng tin cậy. Tuyệt đối không để tuyến này truy cập trực tiếp từ Internet công cộng.

## Trước khi bật

HTTP RPC quản trị là một bề mặt mặt phẳng điều khiển đầy đủ dành cho người vận hành: bất kỳ bên gọi nào vượt qua xác thực HTTP của Gateway đều có thể gọi các phương thức trong danh sách cho phép bên dưới. Chỉ bật khi đáp ứng tất cả các điều kiện sau:

- Bên gọi được tin cậy để vận hành Gateway.
- Bên gọi không thể sử dụng máy khách RPC WebSocket.
- Tuyến chỉ có thể truy cập qua local loopback, tailnet hoặc một điểm truy cập riêng tư có xác thực.
- Bạn đã xem xét các phương thức được phép và chúng phù hợp với hoạt động tự động hóa dự định chạy.

Đối với các máy khách OpenClaw và công cụ tương tác có thể duy trì kết nối WebSocket với Gateway, hãy sử dụng RPC WebSocket.

## Bật

Bật Plugin đi kèm:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Cấu hình">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Tuyến được đăng ký khi Plugin khởi động, vì vậy hãy khởi động lại Gateway sau khi thay đổi cấu hình Plugin.

Vô hiệu hóa Plugin khi bạn không còn cần bề mặt HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Xác minh tuyến

Sử dụng `health` làm yêu cầu an toàn nhỏ nhất:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Phản hồi thành công có `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Khi Plugin bị vô hiệu hóa, tuyến trả về `404` vì chưa được đăng ký.

## Xác thực

Tuyến của Plugin sử dụng xác thực HTTP của Gateway.

Các phương thức xác thực phổ biến:

- xác thực bằng bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`): định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy chèn các tiêu đề danh tính bắt buộc
- xác thực mở qua điểm truy cập riêng tư (`gateway.auth.mode="none"`): không yêu cầu tiêu đề xác thực

## Mô hình bảo mật

Hãy xem Plugin này là một bề mặt vận hành Gateway đầy đủ.

- Việc bật Plugin sẽ chủ ý cung cấp quyền truy cập vào các phương thức RPC quản trị trong danh sách cho phép tại `/api/v1/admin/rpc`.
- Plugin khai báo hợp đồng manifest dành riêng `contracts.gatewayMethodDispatch: ["authenticated-request"]`, cho phép tuyến HTTP đã được Gateway xác thực của Plugin điều phối các phương thức mặt phẳng điều khiển trong cùng tiến trình. Đây không phải là hộp cát: hợp đồng này ngăn việc vô tình sử dụng các trình trợ giúp SDK dành riêng, nhưng các Plugin đáng tin cậy vẫn chạy trong tiến trình Gateway.
- Xác thực bearer bằng bí mật dùng chung (chế độ `token`/`password`) chứng minh việc sở hữu bí mật của người vận hành Gateway; các tiêu đề `x-openclaw-scopes` có phạm vi hẹp hơn bị bỏ qua trên đường dẫn đó và các mặc định đầy đủ thông thường dành cho người vận hành được khôi phục.
- Xác thực HTTP mang danh tính đáng tin cậy (chế độ `trusted-proxy`) tuân theo `x-openclaw-scopes` khi có.
- `gateway.auth.mode="none"` có nghĩa là tuyến này không được xác thực nếu Plugin được bật. Chỉ sử dụng chế độ này phía sau một điểm truy cập riêng tư mà bạn hoàn toàn tin cậy.
- Sau khi xác thực tuyến của Plugin thành công, các yêu cầu được điều phối qua cùng trình xử lý phương thức và kiểm tra phạm vi của Gateway như RPC WebSocket.
- Tuyến vẫn có thể truy cập trong thời gian thuê tạm dừng đã được chuẩn bị. Việc xác thực yêu cầu có giới hạn và phản hồi khám phá `commands.list` cục bộ vẫn khả dụng. Trong số các phương thức được điều phối vào Gateway, chỉ `gateway.suspend.prepare`, `gateway.suspend.status` và `gateway.suspend.resume` có thể chạy khi việc tiếp nhận bị đóng; các phương thức khác trong danh sách cho phép trả về phản hồi `UNAVAILABLE` có thể thử lại thông thường của Gateway.
- Giữ tuyến này trên local loopback, tailnet hoặc một điểm truy cập riêng tư đáng tin cậy. Không để tuyến truy cập trực tiếp từ Internet công cộng. Sử dụng các Gateway riêng biệt khi các bên gọi vượt qua ranh giới tin cậy.

## Yêu cầu

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Các trường:

- `id` (chuỗi, không bắt buộc): được sao chép vào phản hồi. Một UUID được tạo nếu bỏ qua.
- `method` (chuỗi, bắt buộc): tên phương thức Gateway được phép.
- `params` (bất kỳ, không bắt buộc): các tham số dành riêng cho phương thức.

Kích thước nội dung yêu cầu tối đa mặc định là 1 MB.

## Phản hồi

Phản hồi thành công sử dụng cấu trúc RPC của Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Lỗi phương thức Gateway sử dụng:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Trạng thái HTTP tương ứng với mã lỗi:

| Mã lỗi                     | Trạng thái HTTP |
| -------------------------- | --------------- |
| `INVALID_REQUEST`          | 400             |
| `APPROVAL_NOT_FOUND`       | 404             |
| `NOT_LINKED`, `NOT_PAIRED` | 409             |
| `UNAVAILABLE`              | 503             |
| `AGENT_TIMEOUT`            | 504             |
| bất kỳ mã nào khác         | 500             |

## Các phương thức được phép

- khám phá: `commands.list`
  Trả về tên các phương thức HTTP RPC được Plugin này cho phép.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- cấu hình: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kênh: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- mô hình: `models.list`, `models.authStatus`
- tác nhân: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- phê duyệt: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- thiết bị: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tác vụ: `tasks.list`, `tasks.get`, `tasks.cancel`
- chẩn đoán: `doctor.memory.status`, `update.status`

Các phương thức Gateway khác bị chặn cho đến khi được chủ ý thêm vào.

## So sánh với WebSocket

Đường dẫn RPC WebSocket thông thường của Gateway vẫn là API mặt phẳng điều khiển được ưu tiên cho các máy khách OpenClaw. Chỉ sử dụng HTTP RPC quản trị cho công cụ trên máy chủ cần bề mặt HTTP theo mô hình yêu cầu/phản hồi.

Các máy khách WebSocket dùng token chung nhưng không có danh tính thiết bị đáng tin cậy không thể tự khai báo phạm vi quản trị khi kết nối. HTTP RPC quản trị chủ ý tuân theo mô hình người vận hành HTTP đáng tin cậy hiện có: khi Plugin được bật, xác thực bearer bằng bí mật dùng chung được xem là quyền truy cập đầy đủ của người vận hành đối với bề mặt quản trị này.

## Khắc phục sự cố

`404 Not Found`

: Plugin bị vô hiệu hóa, Gateway chưa được khởi động lại kể từ khi bật Plugin hoặc yêu cầu đang được gửi đến một tiến trình Gateway khác.

`401 Unauthorized`

: Yêu cầu không đáp ứng xác thực HTTP của Gateway. Kiểm tra bearer token hoặc các tiêu đề danh tính của trusted proxy.

`405 Method Not Allowed`

: Yêu cầu sử dụng phương thức khác `POST`.

`413 Payload Too Large`

: Nội dung yêu cầu vượt quá giới hạn 1 MB.

`400 INVALID_REQUEST`

: Nội dung yêu cầu không phải JSON hợp lệ, thiếu trường `method`, phương thức không nằm trong danh sách cho phép của Plugin hoặc ID tiếp tục sau tạm dừng không khớp với thời gian thuê đang hoạt động.

`503 UNAVAILABLE`

: Phương thức Gateway đang khởi động, bị giới hạn tốc độ, bị tạm dừng hoặc đang chờ một thao tác tạm dừng/tiếp tục cạnh tranh. Kiểm tra `error.details` khi có và tuân theo `error.retryAfterMs` trước khi thử lại.

## Liên quan

- [Phạm vi của người vận hành](/vi/gateway/operator-scopes)
- [Bảo mật Gateway](/vi/gateway/security)
- [Truy cập từ xa](/vi/gateway/remote)
- [Manifest Plugin](/vi/plugins/manifest#contracts-reference)
- [Đường dẫn con SDK](/vi/plugins/sdk-subpaths)
