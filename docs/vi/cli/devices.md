---
read_when:
    - Bạn đang phê duyệt các yêu cầu ghép nối thiết bị
    - Bạn cần luân chuyển hoặc thu hồi token thiết bị
summary: Tài liệu tham khảo CLI cho `openclaw devices` (ghép nối thiết bị + xoay vòng/thu hồi token)
title: Thiết bị
x-i18n:
    generated_at: "2026-07-12T07:44:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Quản lý các yêu cầu ghép nối thiết bị và token theo phạm vi thiết bị.

## Tùy chọn thường dùng

- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` khi đã cấu hình)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (xác thực bằng mật khẩu)
- `--timeout <ms>`: Thời gian chờ RPC
- `--json`: Đầu ra JSON (khuyến nghị cho việc viết script)

<Warning>
Khi đặt `--url`, CLI không dự phòng sang thông tin xác thực trong cấu hình hoặc môi trường. Hãy truyền rõ `--token` hoặc `--password`, nếu không lệnh sẽ báo lỗi.
</Warning>

## Lệnh

### `openclaw devices list`

Liệt kê các yêu cầu ghép nối đang chờ và các thiết bị đã ghép nối.

```bash
openclaw devices list
openclaw devices list --json
```

Đối với yêu cầu đang chờ trên một thiết bị đã ghép nối, đầu ra hiển thị quyền truy cập được yêu cầu bên cạnh quyền truy cập hiện đã được phê duyệt của thiết bị, nhờ đó có thể thấy rõ việc nâng cấp phạm vi/vai trò thay vì trông như ghép nối bị mất.

Tên hiển thị của thiết bị đã ghép nối sử dụng thứ tự ưu tiên sau: nhãn của người vận hành (`operatorLabel` từ `devices rename`), sau đó là `displayName` của máy khách, rồi `clientId`, cuối cùng là `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Phê duyệt một yêu cầu ghép nối đang chờ bằng `requestId` chính xác. Nếu bỏ qua `requestId` hoặc truyền `--latest`, lệnh chỉ xem trước yêu cầu đang chờ mới nhất rồi thoát (mã 1); hãy chạy lại với ID yêu cầu chính xác để phê duyệt.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Nếu thiết bị thử ghép nối lại với thông tin xác thực đã thay đổi (vai trò, phạm vi hoặc khóa công khai), OpenClaw sẽ thay thế mục đang chờ trước đó bằng một `requestId` mới. Chạy `openclaw devices list` ngay trước khi phê duyệt để lấy ID hiện tại.
</Note>

Hành vi phê duyệt:

- Nếu thiết bị đã được ghép nối và yêu cầu phạm vi hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Hãy so sánh `Requested` với `Approved` trong `openclaw devices list`, hoặc xem trước bằng `--latest`, trước khi phê duyệt.
- Việc phê duyệt vai trò `node` hoặc vai trò không phải người vận hành khác yêu cầu `operator.admin`. `operator.pairing` là đủ để phê duyệt thiết bị của người vận hành, nhưng chỉ khi các phạm vi người vận hành được yêu cầu nằm trong phạm vi của chính bên gọi. Xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes).
- Nếu đã cấu hình `gateway.nodes.pairing.autoApproveCidrs`, các yêu cầu `role: node` lần đầu từ IP máy khách khớp có thể được tự động phê duyệt trước khi xuất hiện trong danh sách này. Tính năng này mặc định bị tắt; không bao giờ áp dụng cho máy khách người vận hành/trình duyệt hoặc yêu cầu nâng cấp.
- `gateway.nodes.pairing.sshVerify` (mặc định bật) tự động phê duyệt các yêu cầu `role: node` lần đầu khi Gateway xác minh khóa thiết bị qua SSH tới máy chủ Node. Vì vậy, yêu cầu có thể chuyển sang trạng thái đã phê duyệt ngay sau khi xuất hiện. Đặt `sshVerify: false` để tắt xác minh SSH; tùy chọn này độc lập với `autoApproveCidrs`, vì vậy hãy bỏ đặt tùy chọn đó nếu chỉ muốn ghép nối thủ công.

### `openclaw devices reject <requestId>`

Từ chối một yêu cầu ghép nối thiết bị đang chờ.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Xóa một mục thiết bị đã ghép nối.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Bên gọi được xác thực bằng token của thiết bị đã ghép nối chỉ có thể xóa mục thiết bị **của chính mình**. Việc xóa thiết bị khác yêu cầu `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Gán nhãn của người vận hành cho thiết bị đã ghép nối. Nhãn là trạng thái phía chủ sở hữu: chúng vẫn được giữ nguyên sau khi sửa chữa ghép nối và phê duyệt lại vai trò, đồng thời không thay đổi `deviceId` ổn định.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` là bắt buộc, được cắt khoảng trắng, không được để trống và giới hạn ở 64 ký tự.
- Các bề mặt hiển thị (danh sách CLI, danh mục Control UI) ưu tiên nhãn của người vận hành hơn tên hiển thị do máy khách báo cáo.
- Bên gọi bằng thiết bị đã ghép nối không có quyền quản trị chỉ có thể đổi tên thiết bị **của chính mình**. Việc đổi tên thiết bị khác yêu cầu `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt các thiết bị đã ghép nối. Yêu cầu `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` cũng từ chối tất cả yêu cầu ghép nối đang chờ.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Luân chuyển token thiết bị cho một vai trò, đồng thời có thể cập nhật phạm vi của token.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Vai trò đích phải tồn tại sẵn trong hợp đồng ghép nối đã được phê duyệt của thiết bị đó; việc luân chuyển không thể tạo một vai trò mới chưa được phê duyệt.
- Nếu bỏ qua `--scope`, các lần kết nối lại sau này sẽ sử dụng lại phạm vi đã phê duyệt được lưu trong bộ nhớ đệm của token. Việc truyền các giá trị `--scope` rõ ràng sẽ thay thế tập hợp phạm vi đã lưu cho các lần kết nối lại bằng token được lưu trong bộ nhớ đệm trong tương lai.
- Bên gọi bằng thiết bị đã ghép nối không có quyền quản trị chỉ có thể luân chuyển token thiết bị **của chính mình**, và tập hợp phạm vi đích phải nằm trong phạm vi người vận hành của chính bên gọi; việc luân chuyển không thể tạo hoặc duy trì token có quyền rộng hơn quyền mà bên gọi hiện có.

Trả về siêu dữ liệu luân chuyển dưới dạng JSON. Nếu bên gọi luân chuyển token của chính mình trong khi được xác thực bằng token thiết bị đó, phản hồi sẽ bao gồm token thay thế để máy khách có thể lưu token trước khi kết nối lại. Các lần luân chuyển dùng chung/do quản trị viên thực hiện không bao giờ trả lại token mang quyền truy cập.

### `openclaw devices revoke --device <id> --role <role>`

Thu hồi token thiết bị cho một vai trò.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Bên gọi bằng thiết bị đã ghép nối không có quyền quản trị chỉ có thể thu hồi token thiết bị **của chính mình**. Việc thu hồi token của thiết bị khác yêu cầu `operator.admin`. Tập hợp phạm vi đích cũng phải nằm trong phạm vi người vận hành của chính bên gọi; bên gọi chỉ có quyền ghép nối không thể thu hồi token người vận hành có quyền quản trị/ghi.

## Ghi chú

- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`). Các vai trò thiết bị không phải người vận hành luôn yêu cầu `operator.admin`; xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes).
- Việc luân chuyển và thu hồi token phải nằm trong tập hợp vai trò ghép nối và đường cơ sở phạm vi đã được phê duyệt của thiết bị. Một mục token rời rạc trong bộ nhớ đệm không cấp mục tiêu quản lý token.
- Đối với phiên token của thiết bị đã ghép nối, việc quản lý giữa các thiết bị (`remove`, `rename`, `rotate`, `revoke`) chỉ áp dụng cho chính thiết bị đó, trừ khi bên gọi có `operator.admin`.
- Việc luân chuyển token trả về một token mới (nhạy cảm) — hãy xử lý token đó như một bí mật.
- Nếu phạm vi ghép nối không khả dụng trên local loopback và không truyền rõ `--url`, `list`/`approve` có thể dự phòng sang trạng thái ghép nối cục bộ.

## Danh sách kiểm tra khôi phục sai lệch token

Sử dụng phần này khi Control UI hoặc các máy khách khác liên tục gặp lỗi `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` hoặc `AUTH_SCOPE_MISMATCH`.

1. Xác nhận nguồn token Gateway hiện tại:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Liệt kê các thiết bị đã ghép nối và xác định ID của thiết bị bị ảnh hưởng:

   ```bash
   openclaw devices list
   ```

3. Luân chuyển token người vận hành cho thiết bị bị ảnh hưởng:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Nếu luân chuyển vẫn chưa đủ, hãy xóa ghép nối cũ và phê duyệt lại:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Thử lại kết nối máy khách bằng token/mật khẩu dùng chung hiện tại.

Ghi chú:

- Thứ tự ưu tiên xác thực khi kết nối lại thông thường: token/mật khẩu dùng chung được chỉ định rõ trước tiên, sau đó là `deviceToken` được chỉ định rõ, tiếp theo là token thiết bị đã lưu, cuối cùng là token khởi tạo.
- Quá trình khôi phục `AUTH_TOKEN_MISMATCH` đáng tin cậy có thể tạm thời gửi cả token dùng chung và token thiết bị đã lưu cùng nhau trong một lần thử lại có giới hạn.
- `AUTH_SCOPE_MISMATCH` có nghĩa là token thiết bị đã được nhận diện nhưng không mang tập hợp phạm vi được yêu cầu; hãy sửa hợp đồng phê duyệt ghép nối/phạm vi trước khi thay đổi xác thực Gateway dùng chung.

Liên quan:

- [Khắc phục sự cố xác thực Dashboard](/vi/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Phê duyệt lần chạy đầu tiên của Paperclip / `openclaw_gateway`

Các tác nhân Paperclip kết nối qua bộ điều hợp `openclaw_gateway` trải qua quy trình phê duyệt ghép nối thiết bị trong lần chạy đầu tiên giống như mọi máy khách mới khác. Nếu Paperclip báo `openclaw_gateway_pairing_required`, hãy phê duyệt thiết bị đang chờ rồi thử lại.

```bash
openclaw devices approve --latest
```

Bản xem trước in ra lệnh `openclaw devices approve <requestId>` chính xác; hãy xác minh thông tin chi tiết, sau đó chạy lại lệnh đó với ID yêu cầu để phê duyệt. Đối với Gateway từ xa hoặc thông tin xác thực được chỉ định rõ, hãy truyền cùng các tùy chọn trong khi xem trước và phê duyệt:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Để tránh phải phê duyệt lại sau mỗi lần khởi động, hãy cấu hình `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để Paperclip tạo danh tính thiết bị tạm thời mới trong mỗi lần chạy:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Nếu việc phê duyệt liên tục thất bại, trước tiên hãy chạy `openclaw devices list` để xác nhận có yêu cầu đang chờ.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Node](/vi/nodes)
