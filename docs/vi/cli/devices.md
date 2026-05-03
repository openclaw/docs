---
read_when:
    - Bạn đang phê duyệt các yêu cầu ghép nối thiết bị
    - Bạn cần xoay vòng hoặc thu hồi mã thông báo thiết bị
summary: Tài liệu tham chiếu CLI cho `openclaw devices` (ghép nối thiết bị + xoay vòng/thu hồi token)
title: Thiết bị
x-i18n:
    generated_at: "2026-05-03T10:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Quản lý các yêu cầu ghép nối thiết bị và token có phạm vi theo thiết bị.

## Lệnh

### `openclaw devices list`

Liệt kê các yêu cầu ghép nối đang chờ xử lý và các thiết bị đã ghép nối.

```
openclaw devices list
openclaw devices list --json
```

Đầu ra của yêu cầu đang chờ hiển thị quyền truy cập được yêu cầu bên cạnh quyền truy cập hiện được phê duyệt của thiết bị khi thiết bị đã được ghép nối. Điều này làm cho việc nâng cấp phạm vi/vai trò trở nên rõ ràng thay vì trông như việc ghép nối đã bị mất.

### `openclaw devices remove <deviceId>`

Xóa một mục thiết bị đã ghép nối.

Khi bạn được xác thực bằng token thiết bị đã ghép nối, các bên gọi không phải quản trị viên chỉ có thể xóa mục thiết bị **của chính họ**. Xóa thiết bị khác yêu cầu `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Xóa hàng loạt thiết bị đã ghép nối.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Phê duyệt một yêu cầu ghép nối thiết bị đang chờ bằng `requestId` chính xác. Nếu bỏ qua `requestId` hoặc truyền `--latest`, OpenClaw chỉ in yêu cầu đang chờ đã chọn rồi thoát; hãy chạy lại phê duyệt với ID yêu cầu chính xác sau khi xác minh chi tiết.

<Note>
Nếu một thiết bị thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò, phạm vi hoặc khóa công khai), OpenClaw sẽ thay thế mục đang chờ trước đó và cấp một `requestId` mới. Chạy `openclaw devices list` ngay trước khi phê duyệt để dùng ID hiện tại.
</Note>

Nếu thiết bị đã được ghép nối và yêu cầu phạm vi rộng hơn hoặc vai trò rộng hơn, OpenClaw giữ nguyên phê duyệt hiện có và tạo một yêu cầu nâng cấp mới đang chờ. Xem lại các cột `Requested` so với `Approved` trong `openclaw devices list` hoặc dùng `openclaw devices approve --latest` để xem trước chính xác lần nâng cấp trước khi phê duyệt.

Nếu Gateway được cấu hình rõ ràng với `gateway.nodes.pairing.autoApproveCidrs`, các yêu cầu `role: node` lần đầu từ IP máy khách khớp có thể được phê duyệt trước khi chúng xuất hiện trong danh sách này. Chính sách đó bị tắt theo mặc định và không bao giờ áp dụng cho máy khách operator/trình duyệt hoặc yêu cầu nâng cấp.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Từ chối một yêu cầu ghép nối thiết bị đang chờ.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Xoay vòng token thiết bị cho một vai trò cụ thể (tùy chọn cập nhật phạm vi).
Vai trò đích phải đã tồn tại trong hợp đồng ghép nối đã được phê duyệt của thiết bị đó; việc xoay vòng không thể tạo một vai trò mới chưa được phê duyệt.
Nếu bạn bỏ qua `--scope`, các lần kết nối lại sau đó bằng token đã xoay vòng được lưu sẽ dùng lại các phạm vi đã phê duyệt được lưu trong bộ nhớ đệm của token đó. Nếu bạn truyền các giá trị `--scope` rõ ràng, các giá trị đó trở thành tập phạm vi được lưu cho các lần kết nối lại bằng token được lưu trong bộ nhớ đệm sau này.
Các bên gọi bằng thiết bị đã ghép nối không phải quản trị viên chỉ có thể xoay vòng token thiết bị **của chính họ**.
Tập phạm vi token đích phải nằm trong phạm vi operator của chính phiên bên gọi; việc xoay vòng không thể tạo hoặc giữ lại token operator rộng hơn những gì bên gọi đã có.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Trả về siêu dữ liệu xoay vòng dưới dạng JSON. Nếu bên gọi đang xoay vòng token của chính mình trong khi được xác thực bằng token thiết bị đó, phản hồi cũng bao gồm token thay thế để máy khách có thể lưu lại trước khi kết nối lại. Các lần xoay vòng dùng chung/quản trị không hiển thị lại bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Thu hồi token thiết bị cho một vai trò cụ thể.

Các bên gọi bằng thiết bị đã ghép nối không phải quản trị viên chỉ có thể thu hồi token thiết bị **của chính họ**.
Thu hồi token của thiết bị khác yêu cầu `operator.admin`.
Tập phạm vi token đích cũng phải nằm trong phạm vi operator của chính phiên bên gọi; các bên gọi chỉ có quyền ghép nối không thể thu hồi token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Trả về kết quả thu hồi dưới dạng JSON.

## Tùy chọn phổ biến

- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` khi được cấu hình).
- `--token <token>`: Token Gateway (nếu cần).
- `--password <password>`: Mật khẩu Gateway (xác thực bằng mật khẩu).
- `--timeout <ms>`: Thời gian chờ RPC.
- `--json`: Đầu ra JSON (khuyến nghị cho script).

<Warning>
Khi bạn đặt `--url`, CLI không quay về thông tin xác thực trong cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Warning>

## Ghi chú

- Xoay vòng token trả về token mới (nhạy cảm). Hãy xử lý nó như bí mật.
- Các lệnh này yêu cầu phạm vi `operator.pairing` (hoặc `operator.admin`). Một số phê duyệt cũng yêu cầu bên gọi nắm giữ các phạm vi operator mà thiết bị đích sẽ tạo hoặc kế thừa; xem [Phạm vi operator](/vi/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` là chính sách Gateway cần bật rõ ràng chỉ dành cho ghép nối thiết bị node mới; nó không thay đổi thẩm quyền phê duyệt của CLI.
- Xoay vòng và thu hồi token nằm trong tập vai trò ghép nối đã được phê duyệt và đường cơ sở phạm vi đã được phê duyệt cho thiết bị đó. Một mục token được lưu trong bộ nhớ đệm bị lạc không cấp mục tiêu quản lý token.
- Với các phiên token thiết bị đã ghép nối, quản lý xuyên thiết bị chỉ dành cho quản trị viên: `remove`, `rotate` và `revoke` chỉ áp dụng cho chính thiết bị đó trừ khi bên gọi có `operator.admin`.
- Việc thay đổi token cũng bị giới hạn theo phạm vi của bên gọi: một phiên chỉ có quyền ghép nối không thể xoay vòng hoặc thu hồi token hiện đang mang `operator.admin` hoặc `operator.write`.
- `devices clear` được cố ý chặn bằng `--yes`.
- Nếu phạm vi ghép nối không khả dụng trên local loopback (và không truyền `--url` rõ ràng), list/approve có thể dùng phương án dự phòng ghép nối cục bộ.
- `devices approve` yêu cầu ID yêu cầu rõ ràng trước khi tạo token; bỏ qua `requestId` hoặc truyền `--latest` chỉ xem trước yêu cầu đang chờ mới nhất.

## Danh sách kiểm tra khôi phục lệch token

Dùng phần này khi Control UI hoặc các máy khách khác liên tục lỗi với `AUTH_TOKEN_MISMATCH` hoặc `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Xác nhận nguồn token Gateway hiện tại:

```bash
openclaw config get gateway.auth.token
```

2. Liệt kê thiết bị đã ghép nối và xác định id thiết bị bị ảnh hưởng:

```bash
openclaw devices list
```

3. Xoay vòng token operator cho thiết bị bị ảnh hưởng:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Nếu xoay vòng là chưa đủ, hãy xóa ghép nối cũ và phê duyệt lại:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Thử lại kết nối máy khách bằng token/mật khẩu dùng chung hiện tại.

Ghi chú:

- Thứ tự ưu tiên xác thực kết nối lại bình thường là token/mật khẩu dùng chung rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị được lưu, rồi token bootstrap.
- Khôi phục `AUTH_TOKEN_MISMATCH` đáng tin cậy có thể tạm thời gửi cả token dùng chung và token thiết bị được lưu cùng nhau cho một lần thử lại có giới hạn.

Liên quan:

- [Khắc phục sự cố xác thực Dashboard](/vi/web/dashboard#if-you-see-unauthorized-1008)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
