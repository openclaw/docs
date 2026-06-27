---
read_when:
    - Làm việc với việc phân giải hồ sơ xác thực hoặc định tuyến thông tin xác thực
    - Gỡ lỗi lỗi xác thực mô hình hoặc thứ tự hồ sơ
summary: Ngữ nghĩa chuẩn tắc về tính đủ điều kiện và cách phân giải thông tin xác thực cho hồ sơ xác thực
title: Ngữ nghĩa thông tin xác thực
x-i18n:
    generated_at: "2026-06-27T17:09:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Tài liệu này định nghĩa ngữ nghĩa chuẩn về điều kiện hợp lệ và phân giải thông tin xác thực được dùng trên:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi tại thời điểm chọn và khi chạy luôn nhất quán.

## Mã lý do probe ổn định

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Thông tin xác thực token

Thông tin xác thực token (`type: "token"`) hỗ trợ `token` nội tuyến và/hoặc `tokenRef`.

### Quy tắc hợp lệ

1. Hồ sơ token không hợp lệ khi thiếu cả `token` lẫn `tokenRef`.
2. `expires` là tùy chọn.
3. Nếu có `expires`, giá trị này phải là một số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, âm, không hữu hạn, hoặc sai kiểu), hồ sơ không hợp lệ với `invalid_expires`.
5. Nếu `expires` nằm trong quá khứ, hồ sơ không hợp lệ với `expired`.
6. `tokenRef` không bỏ qua bước xác thực `expires`.

### Quy tắc phân giải

1. Ngữ nghĩa của bộ phân giải khớp với ngữ nghĩa hợp lệ đối với `expires`.
2. Với các hồ sơ hợp lệ, dữ liệu token có thể được phân giải từ giá trị nội tuyến hoặc `tokenRef`.
3. Các ref không phân giải được tạo ra `unresolved_ref` trong đầu ra `models status --probe`.

## Khả năng di chuyển bản sao agent

Kế thừa xác thực của agent là đọc xuyên qua. Khi một agent không có hồ sơ cục bộ, nó có thể phân giải hồ sơ từ kho agent mặc định/chính khi chạy mà không sao chép dữ liệu bí mật vào `auth-profiles.json` của riêng nó.

Các luồng sao chép tường minh, như `openclaw agents add`, dùng chính sách khả năng di chuyển này:

- Hồ sơ `api_key` có thể di chuyển trừ khi `copyToAgents: false`.
- Hồ sơ `token` có thể di chuyển trừ khi `copyToAgents: false`.
- Hồ sơ `oauth` mặc định không thể di chuyển vì refresh token có thể dùng một lần hoặc nhạy cảm với việc xoay vòng.
- Các luồng OAuth do nhà cung cấp sở hữu chỉ có thể chọn tham gia bằng `copyToAgents: true` khi việc sao chép dữ liệu refresh giữa các agent được biết là an toàn.

Các hồ sơ không thể di chuyển vẫn khả dụng thông qua kế thừa đọc xuyên qua trừ khi agent đích đăng nhập riêng và tạo hồ sơ cục bộ của riêng nó.

## Tuyến xác thực chỉ từ cấu hình

Các mục `auth.profiles` có `mode: "aws-sdk"` là siêu dữ liệu định tuyến, không phải thông tin xác thực được lưu trữ. Chúng hợp lệ khi nhà cung cấp đích dùng `models.providers.<id>.auth: "aws-sdk"` hoặc tuyến AWS SDK cho thiết lập Amazon Bedrock do plugin sở hữu. Các id hồ sơ này có thể xuất hiện trong `auth.order` và ghi đè phiên ngay cả khi không có mục khớp trong `auth-profiles.json`.

Không ghi `type: "aws-sdk"` vào `auth-profiles.json`. Nếu một bản cài đặt cũ có dấu hiệu như vậy, `openclaw doctor --fix` sẽ chuyển nó sang `auth.profiles` và xóa dấu hiệu khỏi kho thông tin xác thực.

## Lọc thứ tự xác thực tường minh

- Khi `auth.order.<provider>` hoặc ghi đè thứ tự kho xác thực được đặt cho một nhà cung cấp, `models status --probe` chỉ probe các id hồ sơ còn lại trong thứ tự xác thực đã phân giải cho nhà cung cấp đó.
- Một hồ sơ đã lưu cho nhà cung cấp đó nhưng bị bỏ khỏi thứ tự tường minh sẽ không được âm thầm thử lại sau. Đầu ra probe báo cáo hồ sơ đó với `reasonCode: excluded_by_auth_order` và chi tiết `Excluded by auth.order for this provider.`

## Phân giải mục tiêu probe

- Mục tiêu probe có thể đến từ hồ sơ xác thực, thông tin xác thực môi trường, hoặc `models.json`.
- Nếu một nhà cung cấp có thông tin xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể probe cho nhà cung cấp đó, `models status --probe` báo cáo `status: no_model` với `reasonCode: no_model`.

## Khám phá thông tin xác thực CLI bên ngoài

- Thông tin xác thực chỉ dùng khi chạy do các CLI bên ngoài sở hữu chỉ được khám phá khi nhà cung cấp, runtime, hoặc hồ sơ xác thực nằm trong phạm vi của thao tác hiện tại, hoặc khi một hồ sơ cục bộ đã lưu cho nguồn bên ngoài đó đã tồn tại.
- Các caller kho xác thực nên chọn chế độ khám phá CLI bên ngoài tường minh: `none` cho xác thực đã lưu/plugin, `existing` để làm mới các hồ sơ CLI bên ngoài đã lưu, hoặc `scoped` cho một tập nhà cung cấp/hồ sơ cụ thể.
- Các đường dẫn chỉ đọc/trạng thái truyền `allowKeychainPrompt: false`; chúng chỉ dùng thông tin xác thực CLI bên ngoài dựa trên tệp và không đọc hoặc tái sử dụng kết quả macOS Keychain.

## Chốt chính sách OAuth SecretRef

- Đầu vào SecretRef chỉ dành cho thông tin xác thực tĩnh.
- Nếu thông tin xác thực của hồ sơ là `type: "oauth"`, các đối tượng SecretRef không được hỗ trợ cho dữ liệu thông tin xác thực của hồ sơ đó.
- Nếu `auth.profiles.<id>.mode` là `"oauth"`, đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.
- Vi phạm là lỗi cứng trong các đường dẫn phân giải xác thực khi khởi động/tải lại.

## Nhắn tin tương thích với legacy

Để tương thích với script, lỗi probe giữ nguyên dòng đầu tiên này:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm vào các dòng tiếp theo.

## Liên quan

- [Quản lý secrets](/vi/gateway/secrets)
- [Lưu trữ xác thực](/vi/concepts/oauth)
