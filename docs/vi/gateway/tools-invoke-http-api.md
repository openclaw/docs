---
read_when:
    - Gọi công cụ mà không chạy toàn bộ một lượt tác tử
    - Xây dựng các quy trình tự động hóa cần thực thi chính sách công cụ
summary: Gọi trực tiếp một công cụ duy nhất qua điểm cuối HTTP của Gateway
title: Các công cụ gọi API
x-i18n:
    generated_at: "2026-07-12T07:58:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway của OpenClaw cung cấp một điểm cuối HTTP để gọi trực tiếp một công cụ duy nhất. Điểm cuối này luôn được bật và sử dụng cơ chế xác thực của Gateway cùng với chính sách công cụ. Tương tự bề mặt `/v1/*` tương thích với OpenAI, cơ chế xác thực bearer bằng bí mật dùng chung được xem là quyền truy cập đáng tin cậy của người vận hành đối với toàn bộ Gateway.

- `POST /tools/invoke`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`
- Kích thước nội dung yêu cầu tối đa mặc định: 2 MB

## Xác thực

Sử dụng cấu hình xác thực của Gateway.

Các phương thức xác thực HTTP phổ biến:

- xác thực bằng bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
- xác thực HTTP đáng tin cậy có danh tính (`gateway.auth.mode="trusted-proxy"`): định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy chèn các tiêu đề danh tính bắt buộc
- xác thực mở trên điểm tiếp nhận riêng tư (`gateway.auth.mode="none"`): không yêu cầu tiêu đề xác thực

Lưu ý:

- `mode="token"` sử dụng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` sử dụng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` yêu cầu yêu cầu HTTP đến từ một nguồn proxy đáng tin cậy đã cấu hình; proxy local loopback trên cùng máy chủ yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`.
- Các trình gọi nội bộ trên cùng máy chủ bỏ qua proxy có thể sử dụng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` làm phương án dự phòng trực tiếp cục bộ. Nếu có bất kỳ bằng chứng nào từ tiêu đề `Forwarded`, `X-Forwarded-*` hoặc `X-Real-IP`, yêu cầu vẫn đi theo đường dẫn proxy đáng tin cậy.
- Nếu `gateway.auth.rateLimit` được cấu hình và có quá nhiều lần xác thực thất bại, điểm cuối trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem điểm cuối này là một bề mặt có **toàn quyền truy cập của người vận hành** đối với phiên bản Gateway.

- Cơ chế xác thực bearer HTTP tại đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho điểm cuối này phải được xem như thông tin xác thực của chủ sở hữu/người vận hành.
- Đối với các chế độ xác thực bằng bí mật dùng chung (`token` và `password`), điểm cuối khôi phục các giá trị mặc định có toàn quyền thông thường của người vận hành ngay cả khi trình gọi gửi tiêu đề `x-openclaw-scopes` hẹp hơn.
- Xác thực bằng bí mật dùng chung cũng xem các lệnh gọi công cụ trực tiếp trên điểm cuối này là lượt tương tác từ người gửi là chủ sở hữu.
- Các chế độ HTTP đáng tin cậy có danh tính (xác thực bằng proxy đáng tin cậy hoặc `gateway.auth.mode="none"` trên điểm tiếp nhận riêng tư) tuân theo `x-openclaw-scopes` khi tiêu đề này có mặt; nếu không, chúng dùng tập phạm vi mặc định thông thường của người vận hành.
- Chỉ giữ điểm cuối này trên local loopback/tailnet/điểm tiếp nhận riêng tư; không cung cấp trực tiếp qua Internet công cộng.

Ma trận xác thực:

| Chế độ xác thực                                                                         | Hành vi                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` hoặc `password` + `Authorization: Bearer ...`                                   | Chứng minh quyền sở hữu bí mật dùng chung của người vận hành Gateway. Bỏ qua `x-openclaw-scopes` hẹp hơn. Khôi phục toàn bộ tập phạm vi mặc định của người vận hành: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Xem các lệnh gọi công cụ trực tiếp là lượt tương tác từ người gửi là chủ sở hữu. |
| HTTP đáng tin cậy có danh tính (xác thực bằng proxy đáng tin cậy hoặc `mode="none"` trên điểm tiếp nhận riêng tư) | Xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai. Tuân theo `x-openclaw-scopes` khi tiêu đề này có mặt. Dùng tập phạm vi mặc định thông thường của người vận hành khi không có tiêu đề. Chỉ mất ngữ nghĩa chủ sở hữu khi trình gọi chủ động thu hẹp phạm vi và bỏ qua `operator.admin`.                                                |

## Nội dung yêu cầu

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Các trường:

- `tool` / `name` (chuỗi, bắt buộc): tên công cụ cần gọi. `name` được ưu tiên nếu cả hai đều được gửi.
- `action` (chuỗi, không bắt buộc): được hợp nhất vào `args.action` nếu lược đồ công cụ hỗ trợ thuộc tính `action` và `args` chưa đặt thuộc tính này.
- `args` (đối tượng, không bắt buộc): các đối số dành riêng cho công cụ.
- `sessionKey` (chuỗi, không bắt buộc): khóa phiên đích. Nếu bị bỏ qua hoặc là `"main"`, Gateway sử dụng khóa phiên chính đã cấu hình (tuân theo `session.mainKey` và tác nhân mặc định, hoặc `global` trong phạm vi phiên toàn cục).
- `agentId` (chuỗi, không bắt buộc): phân giải khóa phiên cho tác nhân đó. Trả về lỗi `400` nếu xung đột với một `sessionKey` được chỉ định rõ và đã ánh xạ tới một tác nhân khác.
- `idempotencyKey` (chuỗi, không bắt buộc): dùng để tạo một mã định danh lệnh gọi công cụ ổn định cho lần gọi.
- `dryRun` (boolean, không bắt buộc): dành riêng cho việc sử dụng trong tương lai; hiện bị bỏ qua.

## Hành vi chính sách và định tuyến

Tính khả dụng của công cụ được lọc qua cùng chuỗi chính sách mà các tác nhân Gateway sử dụng:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- chính sách nhóm (nếu khóa phiên ánh xạ tới một nhóm hoặc kênh)
- chính sách tác nhân con (khi gọi bằng khóa phiên tác nhân con)

Nếu một công cụ không được chính sách cho phép, điểm cuối trả về **404**.

Lưu ý quan trọng về ranh giới:

- Phê duyệt thực thi là cơ chế bảo vệ dành cho người vận hành, không phải ranh giới ủy quyền riêng biệt cho điểm cuối HTTP này. Nếu có thể truy cập một công cụ tại đây thông qua xác thực Gateway + chính sách công cụ, `/tools/invoke` sẽ không thêm lời nhắc phê duyệt riêng cho từng lệnh gọi.
- Nếu có thể truy cập `exec` tại đây, hãy xem đây là một bề mặt shell có khả năng thay đổi dữ liệu. Việc từ chối `write`, `edit`, `apply_patch` hoặc các công cụ HTTP ghi hệ thống tệp không làm cho hoạt động thực thi shell trở thành chỉ đọc.
- Không chia sẻ thông tin xác thực bearer của Gateway với các trình gọi không đáng tin cậy. Nếu cần phân tách giữa các ranh giới tin cậy, hãy chạy các Gateway riêng biệt (lý tưởng nhất là bằng các người dùng hệ điều hành/máy chủ riêng biệt).

HTTP của Gateway cũng mặc định áp dụng một danh sách từ chối cứng (ngay cả khi chính sách phiên cho phép công cụ):

| Công cụ          | Lý do                                                        |
| ---------------- | ------------------------------------------------------------ |
| `exec`           | Thực thi lệnh trực tiếp (bề mặt RCE)                          |
| `spawn`          | Tạo tiến trình con tùy ý (bề mặt RCE)                         |
| `shell`          | Thực thi lệnh shell (bề mặt RCE)                              |
| `fs_write`       | Thay đổi tệp tùy ý trên máy chủ                               |
| `fs_delete`      | Xóa tệp tùy ý trên máy chủ                                    |
| `fs_move`        | Di chuyển/đổi tên tệp tùy ý trên máy chủ                      |
| `apply_patch`    | Áp dụng bản vá có thể ghi lại các tệp tùy ý                   |
| `sessions_spawn` | Điều phối phiên; tạo tác nhân từ xa là RCE                    |
| `sessions_send`  | Chèn thông điệp giữa các phiên                                |
| `cron`           | Mặt phẳng điều khiển tự động hóa liên tục                     |
| `gateway`        | Mặt phẳng điều khiển Gateway; ngăn cấu hình lại qua HTTP      |
| `nodes`          | Chuyển tiếp lệnh Node có thể truy cập `system.run` trên các máy chủ đã ghép nối |

`cron`, `gateway` và `nodes` cũng chỉ dành cho chủ sở hữu: ngay cả khi nằm ngoài danh sách từ chối mặc định này, các trình gọi không phải chủ sở hữu cũng không thể gọi chúng trên bề mặt này.

Tùy chỉnh danh sách từ chối chung qua `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` là cơ chế ghi đè quyền cung cấp, không phải nâng cấp phạm vi. Trong các chế độ HTTP có danh tính, `cron`, `gateway` và `nodes` vẫn không khả dụng đối với các trình gọi không có danh tính chủ sở hữu/quản trị viên (`operator.admin`), ngay cả khi được liệt kê trong `gateway.tools.allow`. Xác thực bearer bằng bí mật dùng chung vẫn tuân theo quy tắc người vận hành hoàn toàn đáng tin cậy ở trên.

Để giúp chính sách nhóm phân giải ngữ cảnh, bạn có thể tùy chọn đặt:

- `x-openclaw-message-channel: <channel>` (ví dụ: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (khi có nhiều tài khoản)
- `x-openclaw-message-to: <target>` (đích gửi cho chính sách công cụ nhắn tin)
- `x-openclaw-thread-id: <threadId>` (ngữ cảnh luồng cho chính sách công cụ nhắn tin)

## Phản hồi

| Trạng thái | Ý nghĩa                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `200`      | `{ ok: true, result }`                                                                         |
| `400`      | `{ ok: false, error: { type, message } }` (yêu cầu không hợp lệ hoặc lỗi đầu vào công cụ)      |
| `401`      | Chưa được ủy quyền                                                                             |
| `403`      | `{ ok: false, error: { type, message, requiresApproval? } }` (lệnh gọi công cụ bị chính sách chặn) |
| `404`      | Công cụ không khả dụng (không tìm thấy hoặc không nằm trong danh sách cho phép)                 |
| `405`      | Phương thức không được phép                                                                    |
| `408`      | Hết thời gian đọc nội dung yêu cầu                                                             |
| `413`      | Nội dung yêu cầu vượt quá kích thước tải trọng tối đa                                          |
| `429`      | Xác thực bị giới hạn tốc độ (`Retry-After` được đặt)                                            |
| `500`      | `{ ok: false, error: { type, message } }` (lỗi thực thi công cụ ngoài dự kiến; thông báo đã được làm sạch) |

## Ví dụ

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Công cụ và plugin](/vi/tools)
