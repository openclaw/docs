---
read_when:
    - Đang xử lý việc phân giải hồ sơ xác thực hoặc định tuyến thông tin xác thực
    - Gỡ lỗi sự cố xác thực mô hình hoặc thứ tự hồ sơ
summary: Ngữ nghĩa chuẩn về điều kiện hợp lệ và phân giải thông tin xác thực cho hồ sơ xác thực
title: Ngữ nghĩa thông tin xác thực
x-i18n:
    generated_at: "2026-04-29T22:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Tài liệu này định nghĩa ngữ nghĩa chuẩn về tính đủ điều kiện và cách phân giải thông tin xác thực được dùng trên:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi tại thời điểm lựa chọn và thời gian chạy luôn nhất quán.

## Mã lý do thăm dò ổn định

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Thông tin xác thực token

Thông tin xác thực token (`type: "token"`) hỗ trợ `token` nội tuyến và/hoặc `tokenRef`.

### Quy tắc đủ điều kiện

1. Một hồ sơ token không đủ điều kiện khi cả `token` và `tokenRef` đều không có.
2. `expires` là tùy chọn.
3. Nếu có `expires`, nó phải là một số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, số âm, không hữu hạn, hoặc sai kiểu), hồ sơ không đủ điều kiện với `invalid_expires`.
5. Nếu `expires` nằm trong quá khứ, hồ sơ không đủ điều kiện với `expired`.
6. `tokenRef` không bỏ qua bước xác thực `expires`.

### Quy tắc phân giải

1. Ngữ nghĩa của trình phân giải khớp với ngữ nghĩa đủ điều kiện cho `expires`.
2. Đối với các hồ sơ đủ điều kiện, vật liệu token có thể được phân giải từ giá trị nội tuyến hoặc `tokenRef`.
3. Các tham chiếu không thể phân giải tạo ra `unresolved_ref` trong đầu ra `models status --probe`.

## Tính di động của bản sao tác nhân

Kế thừa xác thực của tác nhân là đọc xuyên suốt. Khi một tác nhân không có hồ sơ cục bộ, nó có thể phân giải hồ sơ từ kho tác nhân mặc định/chính trong thời gian chạy mà không sao chép vật liệu bí mật vào `auth-profiles.json` của chính nó.

Các luồng sao chép rõ ràng, chẳng hạn như `openclaw agents add`, sử dụng chính sách tính di động này:

- Hồ sơ `api_key` có thể di động trừ khi `copyToAgents: false`.
- Hồ sơ `token` có thể di động trừ khi `copyToAgents: false`.
- Hồ sơ `oauth` mặc định không thể di động vì refresh token có thể dùng một lần hoặc nhạy cảm với xoay vòng.
- Các luồng OAuth do nhà cung cấp sở hữu chỉ có thể chọn tham gia bằng `copyToAgents: true` khi đã biết chắc việc sao chép vật liệu refresh giữa các tác nhân là an toàn.

Các hồ sơ không thể di động vẫn có sẵn thông qua kế thừa đọc xuyên suốt trừ khi tác nhân đích đăng nhập riêng và tạo hồ sơ cục bộ của chính nó.

## Lọc thứ tự xác thực rõ ràng

- Khi `auth.order.<provider>` hoặc ghi đè thứ tự kho xác thực được đặt cho một nhà cung cấp, `models status --probe` chỉ thăm dò các id hồ sơ vẫn còn trong thứ tự xác thực đã phân giải cho nhà cung cấp đó.
- Một hồ sơ đã lưu cho nhà cung cấp đó nhưng bị bỏ khỏi thứ tự rõ ràng sẽ không được âm thầm thử lại sau đó. Đầu ra thăm dò báo cáo hồ sơ đó với `reasonCode: excluded_by_auth_order` và chi tiết `Excluded by auth.order for this provider.`

## Phân giải mục tiêu thăm dò

- Mục tiêu thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực môi trường, hoặc `models.json`.
- Nếu một nhà cung cấp có thông tin xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể thăm dò cho nhà cung cấp đó, `models status --probe` báo cáo `status: no_model` với `reasonCode: no_model`.

## Khám phá thông tin xác thực CLI bên ngoài

- Thông tin xác thực chỉ dùng trong thời gian chạy do các CLI bên ngoài sở hữu chỉ được khám phá khi nhà cung cấp, runtime, hoặc hồ sơ xác thực nằm trong phạm vi của thao tác hiện tại, hoặc khi hồ sơ cục bộ đã lưu cho nguồn bên ngoài đó đã tồn tại.
- Các đường dẫn chỉ đọc/trạng thái truyền `allowKeychainPrompt: false`; chúng chỉ dùng thông tin xác thực CLI bên ngoài dựa trên tệp và không đọc hoặc tái sử dụng kết quả macOS Keychain.

## Bộ gác chính sách SecretRef OAuth

- Đầu vào SecretRef chỉ dành cho thông tin xác thực tĩnh.
- Nếu thông tin xác thực của hồ sơ là `type: "oauth"`, các đối tượng SecretRef không được hỗ trợ cho vật liệu thông tin xác thực của hồ sơ đó.
- Nếu `auth.profiles.<id>.mode` là `"oauth"`, đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.
- Vi phạm là lỗi nghiêm trọng trong các đường dẫn phân giải xác thực khi khởi động/tải lại.

## Nhắn tin tương thích cũ

Để tương thích với script, lỗi thăm dò giữ nguyên dòng đầu tiên này:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm vào các dòng tiếp theo.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Lưu trữ xác thực](/vi/concepts/oauth)
