---
read_when:
    - Đang xử lý việc phân giải hồ sơ xác thực hoặc định tuyến thông tin xác thực
    - Gỡ lỗi lỗi xác thực mô hình hoặc thứ tự hồ sơ
summary: Ngữ nghĩa chuẩn về tính đủ điều kiện và cách phân giải thông tin xác thực cho hồ sơ xác thực
title: Ngữ nghĩa thông tin xác thực
x-i18n:
    generated_at: "2026-05-07T13:13:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Tài liệu này định nghĩa ngữ nghĩa chuẩn về tính đủ điều kiện và phân giải thông tin xác thực được dùng trên:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Mục tiêu là giữ cho hành vi tại thời điểm chọn và khi chạy luôn nhất quán.

## Mã lý do thăm dò ổn định

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Thông tin xác thực token

Thông tin xác thực token (`type: "token"`) hỗ trợ `token` trực tiếp và/hoặc `tokenRef`.

### Quy tắc đủ điều kiện

1. Hồ sơ token không đủ điều kiện khi thiếu cả `token` và `tokenRef`.
2. `expires` là tùy chọn.
3. Nếu có `expires`, giá trị đó phải là một số hữu hạn lớn hơn `0`.
4. Nếu `expires` không hợp lệ (`NaN`, `0`, âm, không hữu hạn, hoặc sai kiểu), hồ sơ không đủ điều kiện với `invalid_expires`.
5. Nếu `expires` nằm trong quá khứ, hồ sơ không đủ điều kiện với `expired`.
6. `tokenRef` không bỏ qua bước xác thực `expires`.

### Quy tắc phân giải

1. Ngữ nghĩa của bộ phân giải khớp với ngữ nghĩa đủ điều kiện đối với `expires`.
2. Với các hồ sơ đủ điều kiện, dữ liệu token có thể được phân giải từ giá trị trực tiếp hoặc `tokenRef`.
3. Các tham chiếu không thể phân giải tạo ra `unresolved_ref` trong đầu ra `models status --probe`.

## Khả năng di chuyển bản sao tác tử

Kế thừa xác thực của tác tử là kiểu đọc xuyên qua. Khi tác tử không có hồ sơ cục bộ, tác tử đó có thể phân giải hồ sơ từ kho tác tử mặc định/chính khi chạy mà không sao chép dữ liệu bí mật vào `auth-profiles.json` riêng của nó.

Các luồng sao chép tường minh, chẳng hạn như `openclaw agents add`, dùng chính sách di chuyển này:

- Hồ sơ `api_key` có thể di chuyển trừ khi `copyToAgents: false`.
- Hồ sơ `token` có thể di chuyển trừ khi `copyToAgents: false`.
- Hồ sơ `oauth` mặc định không thể di chuyển vì refresh token có thể chỉ dùng một lần hoặc nhạy với việc xoay vòng.
- Các luồng OAuth do nhà cung cấp sở hữu chỉ có thể chọn tham gia bằng `copyToAgents: true` khi đã biết chắc việc sao chép dữ liệu refresh giữa các tác tử là an toàn.

Các hồ sơ không thể di chuyển vẫn khả dụng thông qua kế thừa đọc xuyên qua, trừ khi tác tử đích đăng nhập riêng và tạo hồ sơ cục bộ của chính nó.

## Tuyến xác thực chỉ có trong cấu hình

Các mục `auth.profiles` với `mode: "aws-sdk"` là siêu dữ liệu định tuyến, không phải thông tin xác thực được lưu trữ. Chúng hợp lệ khi nhà cung cấp đích dùng `models.providers.<id>.auth: "aws-sdk"` hoặc tuyến AWS SDK mặc định tích hợp sẵn của Amazon Bedrock. Các id hồ sơ này có thể xuất hiện trong `auth.order` và các ghi đè phiên ngay cả khi không có mục khớp nào trong `auth-profiles.json`.

Không ghi `type: "aws-sdk"` vào `auth-profiles.json`. Nếu một bản cài đặt cũ có dấu hiệu như vậy, `openclaw doctor --fix` sẽ chuyển nó sang `auth.profiles` và xóa dấu hiệu đó khỏi kho thông tin xác thực.

## Lọc thứ tự xác thực tường minh

- Khi `auth.order.<provider>` hoặc ghi đè thứ tự của kho xác thực được đặt cho một nhà cung cấp, `models status --probe` chỉ thăm dò các id hồ sơ còn nằm trong thứ tự xác thực đã phân giải cho nhà cung cấp đó.
- Một hồ sơ đã lưu cho nhà cung cấp đó nhưng bị bỏ khỏi thứ tự tường minh sẽ không được âm thầm thử lại sau. Đầu ra thăm dò báo cáo hồ sơ đó với `reasonCode: excluded_by_auth_order` và chi tiết `Excluded by auth.order for this provider.`

## Phân giải mục tiêu thăm dò

- Mục tiêu thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực môi trường, hoặc `models.json`.
- Nếu một nhà cung cấp có thông tin xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể thăm dò cho nhà cung cấp đó, `models status --probe` báo cáo `status: no_model` với `reasonCode: no_model`.

## Khám phá thông tin xác thực CLI bên ngoài

- Thông tin xác thực chỉ dùng khi chạy do các CLI bên ngoài sở hữu chỉ được khám phá khi nhà cung cấp, runtime, hoặc hồ sơ xác thực nằm trong phạm vi của thao tác hiện tại, hoặc khi đã tồn tại một hồ sơ cục bộ đã lưu cho nguồn bên ngoài đó.
- Bên gọi kho xác thực nên chọn một chế độ khám phá CLI bên ngoài tường minh: `none` cho xác thực được lưu cố định/Plugin, `existing` để làm mới các hồ sơ CLI bên ngoài đã lưu, hoặc `scoped` cho một tập nhà cung cấp/hồ sơ cụ thể.
- Các đường dẫn chỉ đọc/trạng thái truyền `allowKeychainPrompt: false`; chúng chỉ dùng thông tin xác thực CLI bên ngoài dựa trên tệp và không đọc hoặc tái sử dụng kết quả macOS Keychain.

## Cơ chế bảo vệ chính sách SecretRef OAuth

- Đầu vào SecretRef chỉ dành cho thông tin xác thực tĩnh.
- Nếu thông tin xác thực hồ sơ là `type: "oauth"`, các đối tượng SecretRef không được hỗ trợ cho dữ liệu thông tin xác thực của hồ sơ đó.
- Nếu `auth.profiles.<id>.mode` là `"oauth"`, đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.
- Vi phạm là lỗi nghiêm trọng trong các đường dẫn phân giải xác thực khi khởi động/tải lại.

## Thông báo tương thích với phiên bản cũ

Để tương thích với script, lỗi thăm dò giữ nguyên dòng đầu tiên này:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định có thể được thêm trên các dòng tiếp theo.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Lưu trữ xác thực](/vi/concepts/oauth)
