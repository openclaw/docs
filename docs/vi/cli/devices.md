---
read_when:
    - Bạn đang phê duyệt các yêu cầu ghép nối thiết bị
    - Bạn cần xoay vòng hoặc thu hồi mã thông báo thiết bị
summary: Tham chiếu CLI cho `openclaw devices` (ghép nối thiết bị + xoay vòng/thu hồi mã thông báo)
title: Thiết bị
x-i18n:
    generated_at: "2026-05-11T20:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Quản lý các yêu cầu ghép đôi thiết bị và token theo phạm vi thiết bị.

## Lệnh

### `openclaw devices list`

Liệt kê các yêu cầu ghép đôi đang chờ xử lý và các thiết bị đã ghép đôi.

```
openclaw devices list
openclaw devices list --json
```

Đầu ra của yêu cầu đang chờ xử lý hiển thị quyền truy cập được yêu cầu bên cạnh quyền truy cập hiện đã được phê duyệt của thiết bị khi thiết bị đã được ghép đôi. Điều này làm rõ việc nâng cấp phạm vi/vai trò thay vì trông như thể việc ghép đôi đã bị mất.

### `openclaw devices remove <deviceId>`

Xóa một mục thiết bị đã ghép đôi.

Khi bạn xác thực bằng token thiết bị đã ghép đôi, bên gọi không phải admin chỉ có thể xóa mục thiết bị **của chính họ**. Xóa thiết bị khác yêu cầu `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt các thiết bị đã ghép đôi.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Phê duyệt một yêu cầu ghép đôi thiết bị đang chờ xử lý bằng `requestId` chính xác. Nếu bỏ qua `requestId` hoặc truyền `--latest`, OpenClaw chỉ in yêu cầu đang chờ xử lý đã chọn rồi thoát; hãy chạy lại phê duyệt với ID yêu cầu chính xác sau khi xác minh chi tiết.

<Note>
Nếu một thiết bị thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò, phạm vi hoặc khóa công khai), OpenClaw sẽ thay thế mục đang chờ xử lý trước đó và cấp một `requestId` mới. Chạy `openclaw devices list` ngay trước khi phê duyệt để dùng ID hiện tại.
</Note>

Nếu thiết bị đã được ghép đôi và yêu cầu phạm vi rộng hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ xử lý. Xem lại các cột `Requested` và `Approved` trong `openclaw devices list` hoặc dùng `openclaw devices approve --latest` để xem trước chính xác nâng cấp trước khi phê duyệt.

Nếu Gateway được cấu hình rõ ràng với `gateway.nodes.pairing.autoApproveCidrs`, các yêu cầu `role: node` lần đầu từ IP máy khách khớp có thể được phê duyệt trước khi chúng xuất hiện trong danh sách này. Chính sách đó bị tắt theo mặc định và không bao giờ áp dụng cho máy khách operator/trình duyệt hoặc yêu cầu nâng cấp.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Từ chối một yêu cầu ghép đôi thiết bị đang chờ xử lý.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Xoay vòng token thiết bị cho một vai trò cụ thể (tùy chọn cập nhật phạm vi).
Vai trò đích phải đã tồn tại trong hợp đồng ghép đôi đã được phê duyệt của thiết bị đó; xoay vòng không thể tạo một vai trò mới chưa được phê duyệt.
Nếu bạn bỏ qua `--scope`, các lần kết nối lại sau bằng token đã xoay vòng được lưu trữ sẽ dùng lại các phạm vi đã được phê duyệt trong bộ nhớ đệm của token đó. Nếu bạn truyền các giá trị `--scope` rõ ràng, các giá trị đó trở thành tập phạm vi được lưu trữ cho các lần kết nối lại bằng token trong bộ nhớ đệm trong tương lai.
Bên gọi bằng thiết bị đã ghép đôi không phải admin chỉ có thể xoay vòng token thiết bị **của chính họ**.
Tập phạm vi token đích phải nằm trong các phạm vi operator của chính phiên gọi; xoay vòng không thể tạo hoặc giữ lại một token operator rộng hơn token mà bên gọi đã có.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Trả về siêu dữ liệu xoay vòng dưới dạng JSON. Nếu bên gọi đang xoay vòng token của chính mình trong khi xác thực bằng token thiết bị đó, phản hồi cũng bao gồm token thay thế để máy khách có thể lưu nó trước khi kết nối lại. Các lần xoay vòng dùng chung/admin không trả lại bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Thu hồi token thiết bị cho một vai trò cụ thể.

Bên gọi bằng thiết bị đã ghép đôi không phải admin chỉ có thể thu hồi token thiết bị **của chính họ**.
Thu hồi token của thiết bị khác yêu cầu `operator.admin`.
Tập phạm vi token đích cũng phải nằm trong các phạm vi operator của chính phiên gọi; bên gọi chỉ có quyền ghép đôi không thể thu hồi token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Trả về kết quả thu hồi dưới dạng JSON.

## Tùy chọn phổ biến

- `--url <url>`: URL WebSocket Gateway (mặc định là `gateway.remote.url` khi được cấu hình).
- `--token <token>`: Token Gateway (nếu bắt buộc).
- `--password <password>`: Mật khẩu Gateway (xác thực bằng mật khẩu).
- `--timeout <ms>`: Thời gian chờ RPC.
- `--json`: Đầu ra JSON (khuyến nghị cho script).

<Warning>
Khi bạn đặt `--url`, CLI không dùng lại thông tin xác thực từ cấu hình hoặc môi trường. Truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Warning>

## Ghi chú

- Xoay vòng token trả về một token mới (nhạy cảm). Hãy xử lý nó như một bí mật.
- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`). Một số phê duyệt cũng yêu cầu bên gọi nắm giữ các phạm vi operator mà thiết bị đích sẽ tạo hoặc kế thừa; xem [Phạm vi operator](/vi/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` là một chính sách Gateway chọn tham gia chỉ dành cho việc ghép đôi thiết bị node mới; nó không thay đổi thẩm quyền phê duyệt của CLI.
- Xoay vòng và thu hồi token luôn nằm trong tập vai trò ghép đôi đã được phê duyệt và đường cơ sở phạm vi đã được phê duyệt cho thiết bị đó. Một mục token trong bộ nhớ đệm ngoài ý muốn không cấp mục tiêu quản lý token.
- Đối với các phiên token thiết bị đã ghép đôi, quản lý khác thiết bị chỉ dành cho admin: `remove`, `rotate` và `revoke` chỉ áp dụng cho chính thiết bị đó trừ khi bên gọi có `operator.admin`.
- Việc thay đổi token cũng bị giới hạn theo phạm vi của bên gọi: một phiên chỉ có quyền ghép đôi không thể xoay vòng hoặc thu hồi token hiện mang `operator.admin` hoặc `operator.write`.
- `devices clear` được cố ý chặn bởi `--yes`.
- Nếu phạm vi ghép đôi không khả dụng trên local loopback (và không truyền `--url` rõ ràng), list/approve có thể dùng phương án dự phòng ghép đôi cục bộ.
- `devices approve` yêu cầu ID yêu cầu rõ ràng trước khi tạo token; bỏ qua `requestId` hoặc truyền `--latest` chỉ xem trước yêu cầu đang chờ xử lý mới nhất.

## Danh sách kiểm tra khôi phục sai lệch token

Dùng mục này khi Control UI hoặc các máy khách khác liên tục thất bại với `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` hoặc `AUTH_SCOPE_MISMATCH`.

1. Xác nhận nguồn token gateway hiện tại:

```bash
openclaw config get gateway.auth.token
```

2. Liệt kê các thiết bị đã ghép đôi và xác định id thiết bị bị ảnh hưởng:

```bash
openclaw devices list
```

3. Xoay vòng token operator cho thiết bị bị ảnh hưởng:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Nếu xoay vòng chưa đủ, xóa ghép đôi cũ và phê duyệt lại:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Thử lại kết nối máy khách bằng token/mật khẩu dùng chung hiện tại.

Ghi chú:

- Thứ tự ưu tiên xác thực khi kết nối lại bình thường là token/mật khẩu dùng chung rõ ràng trước, sau đó là `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
- Khôi phục `AUTH_TOKEN_MISMATCH` đáng tin cậy có thể tạm thời gửi cả token dùng chung và token thiết bị đã lưu cùng nhau cho một lần thử lại có giới hạn.
- `AUTH_SCOPE_MISMATCH` nghĩa là token thiết bị đã được nhận diện nhưng không mang tập phạm vi được yêu cầu; hãy sửa hợp đồng phê duyệt ghép đôi/phạm vi trước khi thay đổi xác thực gateway dùng chung.

Liên quan:

- [Khắc phục sự cố xác thực dashboard](/vi/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Nodes](/vi/nodes)
