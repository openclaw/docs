---
read_when:
    - Bạn đang phê duyệt yêu cầu ghép đôi thiết bị
    - Bạn cần xoay vòng hoặc thu hồi token thiết bị
summary: Tham chiếu CLI cho `openclaw devices` (ghép nối thiết bị + luân phiên/thu hồi token)
title: Thiết bị
x-i18n:
    generated_at: "2026-06-27T17:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Quản lý yêu cầu ghép nối thiết bị và token theo phạm vi thiết bị.

## Lệnh

### `openclaw devices list`

Liệt kê các yêu cầu ghép nối đang chờ và các thiết bị đã ghép nối.

```
openclaw devices list
openclaw devices list --json
```

Đầu ra yêu cầu đang chờ hiển thị quyền truy cập được yêu cầu bên cạnh quyền truy cập hiện đã được phê duyệt của thiết bị khi thiết bị đã được ghép nối. Điều này làm rõ các nâng cấp phạm vi/vai trò thay vì trông như ghép nối đã bị mất.

### `openclaw devices remove <deviceId>`

Xóa một mục thiết bị đã ghép nối.

Khi bạn được xác thực bằng token thiết bị đã ghép nối, caller không phải quản trị viên chỉ có thể xóa mục thiết bị **của chính họ**. Xóa thiết bị khác yêu cầu `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt các thiết bị đã ghép nối.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Phê duyệt một yêu cầu ghép nối thiết bị đang chờ bằng `requestId` chính xác. Nếu bỏ qua `requestId` hoặc truyền `--latest`, OpenClaw chỉ in yêu cầu đang chờ đã chọn rồi thoát; hãy chạy lại phê duyệt với ID yêu cầu chính xác sau khi xác minh chi tiết.

<Note>
Nếu một thiết bị thử lại ghép nối với thông tin xác thực đã thay đổi (vai trò, phạm vi, hoặc khóa công khai), OpenClaw sẽ thay thế mục đang chờ trước đó và cấp một `requestId` mới. Chạy `openclaw devices list` ngay trước khi phê duyệt để dùng ID hiện tại.
</Note>

Nếu thiết bị đã được ghép nối và yêu cầu phạm vi rộng hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Xem lại các cột `Requested` so với `Approved` trong `openclaw devices list` hoặc dùng `openclaw devices approve --latest` để xem trước nâng cấp chính xác trước khi phê duyệt.

Nếu Gateway được cấu hình rõ ràng với `gateway.nodes.pairing.autoApproveCidrs`, các yêu cầu lần đầu có `role: node` từ IP máy khách khớp có thể được phê duyệt trước khi chúng xuất hiện trong danh sách này. Chính sách đó mặc định bị tắt và không bao giờ áp dụng cho máy khách operator/trình duyệt hoặc yêu cầu nâng cấp.

Phê duyệt node hoặc các vai trò thiết bị không phải operator khác yêu cầu `operator.admin`. `operator.pairing` chỉ đủ cho phê duyệt thiết bị operator khi các phạm vi operator được yêu cầu vẫn nằm trong phạm vi riêng của caller. Xem [Phạm vi operator](/vi/gateway/operator-scopes) để biết các kiểm tra tại thời điểm phê duyệt.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Phê duyệt lần chạy đầu của Paperclip / `openclaw_gateway`

Khi một agent Paperclip mới kết nối qua adapter `openclaw_gateway` lần đầu, Gateway có thể yêu cầu phê duyệt ghép nối thiết bị một lần trước khi các lần chạy có thể thành công. Nếu Paperclip báo `openclaw_gateway_pairing_required`, hãy phê duyệt thiết bị đang chờ rồi thử lại.

Với gateway cục bộ, xem trước yêu cầu đang chờ mới nhất:

```bash
openclaw devices approve --latest
```

Bản xem trước in ra lệnh `openclaw devices approve <requestId>` chính xác. Xác minh chi tiết yêu cầu, rồi chạy lại lệnh đó với ID yêu cầu để phê duyệt.

Với gateway từ xa hoặc thông tin xác thực rõ ràng, truyền cùng các tùy chọn khi xem trước và phê duyệt:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Để tránh phải phê duyệt lại sau khi khởi động lại, hãy giữ một khóa thiết bị bền vững trong cấu hình adapter Paperclip thay vì tạo một danh tính tạm thời mới cho mỗi lần chạy:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Nếu phê duyệt tiếp tục thất bại, trước tiên hãy chạy `openclaw devices list` để xác nhận có yêu cầu đang chờ.

### `openclaw devices reject <requestId>`

Từ chối một yêu cầu ghép nối thiết bị đang chờ.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Xoay vòng token thiết bị cho một vai trò cụ thể (tùy chọn cập nhật phạm vi).
Vai trò đích phải đã tồn tại trong hợp đồng ghép nối đã phê duyệt của thiết bị đó; xoay vòng không thể tạo một vai trò mới chưa được phê duyệt.
Nếu bạn bỏ qua `--scope`, các lần kết nối lại sau với token đã xoay vòng được lưu trữ sẽ tái sử dụng các phạm vi đã phê duyệt được lưu trong bộ nhớ đệm của token đó. Nếu bạn truyền các giá trị `--scope` rõ ràng, chúng sẽ trở thành bộ phạm vi được lưu trữ cho các lần kết nối lại bằng token lưu trong bộ nhớ đệm trong tương lai.
Caller thiết bị đã ghép nối không phải quản trị viên chỉ có thể xoay vòng token thiết bị **của chính họ**.
Bộ phạm vi token đích phải nằm trong các phạm vi operator riêng của phiên caller; xoay vòng không thể tạo hoặc giữ một token operator rộng hơn token mà caller đã có.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Trả về metadata xoay vòng dưới dạng JSON. Nếu caller đang xoay vòng token của chính mình trong khi được xác thực bằng token thiết bị đó, phản hồi cũng bao gồm token thay thế để máy khách có thể lưu bền vững trước khi kết nối lại. Các xoay vòng dùng chung/quản trị viên không echo bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Thu hồi token thiết bị cho một vai trò cụ thể.

Caller thiết bị đã ghép nối không phải quản trị viên chỉ có thể thu hồi token thiết bị **của chính họ**.
Thu hồi token của thiết bị khác yêu cầu `operator.admin`.
Bộ phạm vi token đích cũng phải nằm trong các phạm vi operator riêng của phiên caller; caller chỉ có quyền ghép nối không thể thu hồi token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Trả về kết quả thu hồi dưới dạng JSON.

## Tùy chọn chung

- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` khi được cấu hình).
- `--token <token>`: Token Gateway (nếu bắt buộc).
- `--password <password>`: Mật khẩu Gateway (xác thực bằng mật khẩu).
- `--timeout <ms>`: Thời gian chờ RPC.
- `--json`: Đầu ra JSON (khuyến nghị cho script).

<Warning>
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy truyền `--token` hoặc `--password` một cách rõ ràng. Thiếu thông tin xác thực rõ ràng là một lỗi.
</Warning>

## Ghi chú

- Xoay vòng token trả về một token mới (nhạy cảm). Hãy xử lý nó như một bí mật.
- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`). Một số phê duyệt cũng yêu cầu caller sở hữu các phạm vi operator mà thiết bị đích sẽ tạo hoặc kế thừa. Vai trò thiết bị không phải operator yêu cầu `operator.admin`; xem [Phạm vi operator](/vi/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` là một chính sách Gateway chọn tham gia chỉ dành cho ghép nối thiết bị node mới; nó không thay đổi quyền phê duyệt của CLI.
- Xoay vòng và thu hồi token vẫn nằm trong bộ vai trò ghép nối đã phê duyệt và đường cơ sở phạm vi đã phê duyệt cho thiết bị đó. Một mục token lưu trong bộ nhớ đệm đi lạc không cấp mục tiêu quản lý token.
- Với các phiên token thiết bị đã ghép nối, quản lý xuyên thiết bị chỉ dành cho quản trị viên: `remove`, `rotate`, và `revoke` chỉ áp dụng cho chính thiết bị đó trừ khi caller có `operator.admin`.
- Đột biến token cũng bị giới hạn theo phạm vi caller: một phiên chỉ có quyền ghép nối không thể xoay vòng hoặc thu hồi token hiện mang `operator.admin` hoặc `operator.write`.
- `devices clear` được cố ý chặn bằng `--yes`.
- Nếu phạm vi ghép nối không khả dụng trên local loopback (và không truyền `--url` rõ ràng), list/approve có thể dùng fallback ghép nối cục bộ.
- `devices approve` yêu cầu ID yêu cầu rõ ràng trước khi tạo token; bỏ qua `requestId` hoặc truyền `--latest` chỉ xem trước yêu cầu đang chờ mới nhất.

## Danh sách kiểm tra khôi phục lệch token

Dùng phần này khi Control UI hoặc các máy khách khác tiếp tục thất bại với `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH`, hoặc `AUTH_SCOPE_MISMATCH`.

1. Xác nhận nguồn token gateway hiện tại:

```bash
openclaw config get gateway.auth.token
```

2. Liệt kê các thiết bị đã ghép nối và xác định id thiết bị bị ảnh hưởng:

```bash
openclaw devices list
```

3. Xoay vòng token operator cho thiết bị bị ảnh hưởng:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Nếu xoay vòng chưa đủ, xóa ghép nối cũ và phê duyệt lại:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Thử lại kết nối máy khách bằng token/mật khẩu dùng chung hiện tại.

Ghi chú:

- Thứ tự ưu tiên xác thực kết nối lại thông thường là token/mật khẩu dùng chung rõ ràng trước, sau đó là `deviceToken` rõ ràng, sau đó là token thiết bị đã lưu, rồi đến token bootstrap.
- Khôi phục `AUTH_TOKEN_MISMATCH` đáng tin cậy có thể tạm thời gửi cả token dùng chung và token thiết bị đã lưu cùng nhau cho một lần thử lại có giới hạn.
- `AUTH_SCOPE_MISMATCH` nghĩa là token thiết bị đã được nhận diện nhưng không mang bộ phạm vi được yêu cầu; hãy sửa hợp đồng phê duyệt ghép nối/phạm vi trước khi thay đổi xác thực gateway dùng chung.

Liên quan:

- [Khắc phục sự cố xác thực Dashboard](/vi/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
