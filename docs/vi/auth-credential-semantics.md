---
read_when:
    - Đang xử lý phân giải hồ sơ xác thực hoặc định tuyến thông tin xác thực
    - Gỡ lỗi các lỗi xác thực mô hình hoặc thứ tự hồ sơ
summary: Ngữ nghĩa về tính đủ điều kiện và phân giải thông tin xác thực chuẩn tắc cho hồ sơ xác thực
title: Ngữ nghĩa của thông tin xác thực
x-i18n:
    generated_at: "2026-04-30T21:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Tài liệu này định nghĩa ngữ nghĩa chuẩn về tính đủ điều kiện và cách phân giải thông tin xác thực được dùng trên:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi tại thời điểm lựa chọn và thời gian chạy nhất quán.

## Mã lý do thăm dò ổn định

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Thông tin xác thực bằng token

Thông tin xác thực bằng token (`type: "token"`) hỗ trợ `token` nội tuyến và/hoặc `tokenRef`.

### Quy tắc đủ điều kiện

1. Hồ sơ token không đủ điều kiện khi cả `token` và `tokenRef` đều vắng mặt.
2. `expires` là tùy chọn.
3. Nếu có `expires`, giá trị đó phải là một số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, âm, không hữu hạn, hoặc sai kiểu), hồ sơ không đủ điều kiện với `invalid_expires`.
5. Nếu `expires` nằm trong quá khứ, hồ sơ không đủ điều kiện với `expired`.
6. `tokenRef` không bỏ qua việc xác thực `expires`.

### Quy tắc phân giải

1. Ngữ nghĩa của trình phân giải khớp với ngữ nghĩa đủ điều kiện đối với `expires`.
2. Với các hồ sơ đủ điều kiện, dữ liệu token có thể được phân giải từ giá trị nội tuyến hoặc `tokenRef`.
3. Các ref không thể phân giải tạo ra `unresolved_ref` trong đầu ra `models status --probe`.

## Tính di động khi sao chép tác nhân

Kế thừa xác thực của tác nhân là đọc xuyên qua. Khi một tác nhân không có hồ sơ cục bộ, nó có thể phân giải hồ sơ từ kho tác nhân mặc định/chính trong thời gian chạy mà không sao chép dữ liệu bí mật vào `auth-profiles.json` của chính nó.

Các luồng sao chép tường minh, chẳng hạn như `openclaw agents add`, dùng chính sách tính di động này:

- Hồ sơ `api_key` có thể di động trừ khi `copyToAgents: false`.
- Hồ sơ `token` có thể di động trừ khi `copyToAgents: false`.
- Hồ sơ `oauth` mặc định không thể di động vì refresh token có thể chỉ dùng một lần hoặc nhạy cảm với xoay vòng.
- Các luồng OAuth do nhà cung cấp sở hữu chỉ có thể chọn tham gia với `copyToAgents: true` khi đã biết việc sao chép dữ liệu refresh giữa các tác nhân là an toàn.

Các hồ sơ không thể di động vẫn có sẵn thông qua kế thừa đọc xuyên qua trừ khi tác nhân đích đăng nhập riêng và tạo hồ sơ cục bộ của chính nó.

## Lọc thứ tự xác thực tường minh

- Khi `auth.order.<provider>` hoặc ghi đè thứ tự kho xác thực được đặt cho một nhà cung cấp, `models status --probe` chỉ thăm dò các id hồ sơ còn lại trong thứ tự xác thực đã phân giải cho nhà cung cấp đó.
- Một hồ sơ đã lưu cho nhà cung cấp đó nhưng bị bỏ khỏi thứ tự tường minh sẽ không được âm thầm thử lại sau. Đầu ra thăm dò báo cáo hồ sơ đó với `reasonCode: excluded_by_auth_order` và chi tiết `Excluded by auth.order for this provider.`

## Phân giải mục tiêu thăm dò

- Mục tiêu thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực môi trường, hoặc `models.json`.
- Nếu một nhà cung cấp có thông tin xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể thăm dò cho nhà cung cấp đó, `models status --probe` báo cáo `status: no_model` với `reasonCode: no_model`.

## Phát hiện thông tin xác thực CLI bên ngoài

- Thông tin xác thực chỉ dùng trong thời gian chạy do các CLI bên ngoài sở hữu chỉ được phát hiện khi nhà cung cấp, thời gian chạy, hoặc hồ sơ xác thực nằm trong phạm vi của thao tác hiện tại, hoặc khi một hồ sơ cục bộ đã lưu cho nguồn bên ngoài đó đã tồn tại.
- Các trình gọi kho xác thực nên chọn chế độ phát hiện CLI bên ngoài tường minh: `none` cho xác thực chỉ được lưu bền/Plugin, `existing` để làm mới các hồ sơ CLI bên ngoài đã lưu, hoặc `scoped` cho một tập nhà cung cấp/hồ sơ cụ thể.
- Các đường dẫn chỉ đọc/trạng thái truyền `allowKeychainPrompt: false`; chúng chỉ dùng thông tin xác thực CLI bên ngoài được hỗ trợ bằng tệp và không đọc hoặc tái sử dụng kết quả macOS Keychain.

## Bảo vệ chính sách OAuth SecretRef

- Đầu vào SecretRef chỉ dành cho thông tin xác thực tĩnh.
- Nếu thông tin xác thực của hồ sơ là `type: "oauth"`, các đối tượng SecretRef không được hỗ trợ cho dữ liệu thông tin xác thực của hồ sơ đó.
- Nếu `auth.profiles.<id>.mode` là `"oauth"`, đầu vào `keyRef`/`tokenRef` được hỗ trợ bằng SecretRef cho hồ sơ đó bị từ chối.
- Các vi phạm là lỗi nghiêm trọng trong các đường dẫn phân giải xác thực khi khởi động/tải lại.

## Thông báo tương thích cũ

Để tương thích với script, lỗi thăm dò giữ nguyên dòng đầu tiên này:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm vào các dòng tiếp theo.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Lưu trữ xác thực](/vi/concepts/oauth)
