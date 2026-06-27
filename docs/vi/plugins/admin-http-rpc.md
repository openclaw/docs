---
read_when:
    - Xây dựng công cụ phía máy chủ không thể sử dụng máy khách RPC WebSocket của Gateway
    - Cung cấp tự động hóa quản trị Gateway phía sau một ingress riêng tư đáng tin cậy
    - Kiểm tra mô hình bảo mật cho quyền truy cập HTTP vào các phương thức Gateway
summary: Cung cấp các phương thức mặt phẳng điều khiển Gateway đã chọn thông qua plugin admin-http-rpc đi kèm, chọn tham gia
title: Plugin RPC HTTP quản trị
x-i18n:
    generated_at: "2026-06-27T17:43:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin `admin-http-rpc` đi kèm cung cấp các phương thức mặt phẳng điều khiển Gateway được chọn qua HTTP cho tự động hóa máy chủ đáng tin cậy không thể dùng ứng dụng khách RPC WebSocket Gateway thông thường.

Plugin này được bao gồm trong OpenClaw, nhưng mặc định bị tắt. Khi bị tắt, tuyến không được đăng ký. Khi được bật, nó thêm:

- `POST /api/v1/admin/rpc`
- cùng listener với Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Chỉ bật nó cho công cụ máy chủ riêng tư, tự động hóa tailnet, hoặc một ingress nội bộ đáng tin cậy. Không để lộ trực tiếp tuyến này ra internet công cộng.

## Trước khi bạn bật nó

RPC HTTP quản trị là một bề mặt mặt phẳng điều khiển đầy đủ cho người vận hành. Bất kỳ caller nào vượt qua xác thực HTTP của Gateway đều có thể gọi các phương thức trong allowlist trên trang này.

Hãy dùng nó khi tất cả điều sau đều đúng:

- Caller được tin cậy để vận hành Gateway.
- Caller không thể dùng ứng dụng khách RPC WebSocket.
- Tuyến chỉ có thể truy cập trên loopback, tailnet, hoặc một ingress riêng tư đã xác thực.
- Bạn đã rà soát các phương thức được phép và chúng khớp với tự động hóa bạn định chạy.

Dùng đường dẫn RPC WebSocket cho các ứng dụng khách OpenClaw và công cụ tương tác có thể giữ kết nối WebSocket Gateway mở.

## Bật

Bật Plugin đi kèm:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

Tuyến được đăng ký trong lúc Plugin khởi động. Khởi động lại Gateway sau khi thay đổi cấu hình Plugin.

Tắt nó khi bạn không còn cần bề mặt HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Xác minh tuyến

Dùng `health` làm yêu cầu an toàn nhỏ nhất:

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

Khi Plugin bị tắt, tuyến trả về `404` vì nó không được đăng ký.

## Xác thực

Tuyến Plugin dùng xác thực HTTP của Gateway.

Các đường dẫn xác thực phổ biến:

- xác thực bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`): định tuyến qua proxy nhận biết danh tính đã cấu hình và để nó chèn các header danh tính bắt buộc
- xác thực mở qua ingress riêng tư (`gateway.auth.mode="none"`): không cần header xác thực

## Mô hình bảo mật

Hãy xem Plugin này như một bề mặt đầy đủ cho người vận hành Gateway.

- Bật Plugin là chủ ý cung cấp quyền truy cập vào các phương thức RPC quản trị trong allowlist tại `/api/v1/admin/rpc`.
- Plugin khai báo hợp đồng manifest dành riêng `contracts.gatewayMethodDispatch: ["authenticated-request"]` để tuyến HTTP đã xác thực bởi Gateway của nó có thể dispatch các phương thức mặt phẳng điều khiển trong tiến trình.
- Xác thực bearer bằng bí mật dùng chung chứng minh quyền sở hữu bí mật của người vận hành Gateway.
- Với xác thực `token` và `password`, các header `x-openclaw-scopes` hẹp hơn bị bỏ qua và các mặc định đầy đủ thông thường của người vận hành được khôi phục.
- Các chế độ HTTP mang danh tính đáng tin cậy tôn trọng `x-openclaw-scopes` khi có mặt.
- `gateway.auth.mode="none"` nghĩa là tuyến này không được xác thực nếu Plugin được bật. Chỉ dùng chế độ đó phía sau một ingress riêng tư mà bạn hoàn toàn tin cậy.
- Yêu cầu dispatch qua cùng các handler phương thức Gateway và kiểm tra phạm vi như RPC WebSocket sau khi xác thực tuyến Plugin vượt qua.
- Giữ tuyến này trên loopback, tailnet, hoặc một ingress riêng tư đáng tin cậy. Không để lộ trực tiếp nó ra internet công cộng.
- Hợp đồng manifest Plugin không phải là sandbox. Chúng ngăn việc vô tình dùng các helper SDK dành riêng; các Plugin đáng tin cậy vẫn chạy trong tiến trình Gateway.

Dùng các gateway riêng khi caller vượt qua ranh giới tin cậy.

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

- `id` (chuỗi, tùy chọn): được sao chép vào phản hồi. Một UUID được tạo khi bỏ qua.
- `method` (chuỗi, bắt buộc): tên phương thức Gateway được phép.
- `params` (bất kỳ, tùy chọn): tham số riêng cho phương thức.

Kích thước thân yêu cầu tối đa mặc định là 1 MB.

## Phản hồi

Phản hồi thành công dùng dạng RPC Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Lỗi phương thức Gateway dùng:

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

Trạng thái HTTP đi theo lỗi Gateway khi có thể. Ví dụ, `INVALID_REQUEST` trả về `400`, và `UNAVAILABLE` trả về `503`.

## Phương thức được phép

- khám phá: `commands.list`
  Trả về tên các phương thức RPC HTTP được Plugin này cho phép.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- cấu hình: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kênh: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- mô hình: `models.list`, `models.authStatus`
- tác nhân: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- phê duyệt: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- thiết bị: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nút: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tác vụ: `tasks.list`, `tasks.get`, `tasks.cancel`
- chẩn đoán: `doctor.memory.status`, `update.status`

Các phương thức Gateway khác bị chặn cho đến khi chúng được chủ ý thêm vào.

## So sánh WebSocket

Đường dẫn RPC WebSocket Gateway thông thường vẫn là API mặt phẳng điều khiển được ưu tiên cho các ứng dụng khách OpenClaw. Chỉ dùng RPC HTTP quản trị cho công cụ máy chủ cần bề mặt HTTP yêu cầu/phản hồi.

Ứng dụng khách WebSocket dùng token chung mà không có danh tính thiết bị đáng tin cậy không thể tự khai báo phạm vi quản trị trong lúc kết nối. RPC HTTP quản trị chủ ý đi theo mô hình người vận hành HTTP đáng tin cậy hiện có: khi Plugin được bật, xác thực bearer bằng bí mật dùng chung được xem là quyền truy cập đầy đủ của người vận hành cho bề mặt quản trị này.

## Khắc phục sự cố

`404 Not Found`

: Plugin bị tắt, Gateway chưa khởi động lại kể từ khi bật nó, hoặc yêu cầu đang đi tới một tiến trình Gateway khác.

`401 Unauthorized`

: Yêu cầu không đáp ứng xác thực HTTP của Gateway. Kiểm tra bearer token hoặc các header danh tính trusted-proxy.

`400 INVALID_REQUEST`

: Thân yêu cầu không phải JSON hợp lệ, thiếu trường `method`, hoặc phương thức không nằm trong allowlist của Plugin.

`503 UNAVAILABLE`

: Handler phương thức Gateway không khả dụng. Kiểm tra nhật ký Gateway và thử lại sau khi Gateway hoàn tất khởi động.

## Liên quan

- [Phạm vi người vận hành](/vi/gateway/operator-scopes)
- [Bảo mật Gateway](/vi/gateway/security)
- [Truy cập từ xa](/vi/gateway/remote)
- [Manifest Plugin](/vi/plugins/manifest#contracts)
- [Đường dẫn con SDK](/vi/plugins/sdk-subpaths)
