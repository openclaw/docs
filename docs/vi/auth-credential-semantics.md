---
read_when:
    - Xử lý việc phân giải hồ sơ xác thực hoặc định tuyến thông tin xác thực
    - Gỡ lỗi xác thực mô hình thất bại hoặc thứ tự hồ sơ
summary: Ngữ nghĩa chuẩn về tính đủ điều kiện và phân giải thông tin xác thực cho các hồ sơ xác thực
title: Ngữ nghĩa của thông tin xác thực xác thực danh tính
x-i18n:
    generated_at: "2026-07-12T07:41:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Các ngữ nghĩa này giúp hành vi xác thực tại thời điểm lựa chọn và khi chạy luôn nhất quán. Chúng được dùng chung bởi:

- `resolveAuthProfileOrder` (thứ tự hồ sơ)
- `resolveApiKeyForProfile` (phân giải thông tin xác thực khi chạy)
- `openclaw models status --probe`
- các bước kiểm tra xác thực của `openclaw doctor` (`doctor-auth`)

## Mã lý do thăm dò ổn định

Kết quả thăm dò mang một nhóm `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) cùng một `reasonCode` ổn định khi quá trình thăm dò chưa bao giờ thực hiện được lệnh gọi mô hình:

| `reasonCode`             | Ý nghĩa                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Hồ sơ bị loại khỏi thứ tự xác thực tường minh của nhà cung cấp tương ứng.                 |
| `missing_credential`     | Chưa cấu hình thông tin xác thực nội tuyến hoặc SecretRef.                                |
| `expired`                | Giá trị `expires` của token nằm trong quá khứ.                                            |
| `invalid_expires`        | `expires` không phải dấu thời gian Unix mili giây dương hợp lệ.                           |
| `unresolved_ref`         | Không thể phân giải SecretRef đã cấu hình.                                                |
| `ineligible_profile`     | Hồ sơ không tương thích với cấu hình nhà cung cấp (bao gồm đầu vào khóa sai định dạng).   |
| `no_model`               | Có thông tin xác thực nhưng không phân giải được mô hình ứng viên có thể thăm dò.          |

Các bước kiểm tra tính đủ điều kiện báo cáo `ok` làm mã lý do cho thông tin xác thực có thể sử dụng.

## Thông tin xác thực bằng token

Thông tin xác thực bằng token (`type: "token"`) hỗ trợ `token` nội tuyến và/hoặc `tokenRef`.

### Quy tắc về tính đủ điều kiện

1. Hồ sơ token không đủ điều kiện khi thiếu cả `token` lẫn `tokenRef` (`missing_credential`).
2. `expires` là tùy chọn. Khi có, giá trị này phải là số hữu hạn biểu thị mili giây kể từ Unix epoch, lớn hơn `0` và không vượt quá dấu thời gian `Date` tối đa của JavaScript (8640000000000000).
3. Nếu `expires` không hợp lệ (sai kiểu, `NaN`, `0`, số âm, không hữu hạn hoặc vượt quá giá trị tối đa đó), hồ sơ không đủ điều kiện với `invalid_expires`.
4. Nếu `expires` nằm trong quá khứ, hồ sơ không đủ điều kiện với `expired`.
5. `tokenRef` không bỏ qua bước xác thực `expires`.

### Quy tắc phân giải

1. Ngữ nghĩa của trình phân giải đối với `expires` khớp với ngữ nghĩa kiểm tra tính đủ điều kiện.
2. Với các hồ sơ đủ điều kiện, dữ liệu token có thể được phân giải từ giá trị nội tuyến hoặc `tokenRef`.
3. Các tham chiếu không thể phân giải tạo ra `unresolved_ref` trong đầu ra của `models status --probe`.

## Khả năng di chuyển khi sao chép tác tử

Việc kế thừa xác thực của tác tử sử dụng cơ chế đọc xuyên. Khi một tác tử không có hồ sơ cục bộ, trong thời gian chạy nó phân giải hồ sơ từ kho của tác tử mặc định/chính mà không sao chép dữ liệu bí mật vào kho thông tin xác thực riêng (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Các luồng sao chép tường minh, chẳng hạn như `openclaw agents add`, sử dụng chính sách di chuyển này:

- Các hồ sơ `api_key` và `token` có thể di chuyển, trừ khi đặt `copyToAgents: false`.
- Theo mặc định, hồ sơ `oauth` không thể di chuyển vì refresh token có thể chỉ dùng được một lần hoặc nhạy cảm với việc luân chuyển.
- Các luồng OAuth do nhà cung cấp sở hữu chỉ có thể chọn tham gia bằng `copyToAgents: true` khi đã biết việc sao chép dữ liệu làm mới giữa các tác tử là an toàn; lựa chọn tham gia này chỉ áp dụng khi hồ sơ chứa dữ liệu truy cập/làm mới nội tuyến.

Các hồ sơ không thể di chuyển vẫn khả dụng thông qua kế thừa đọc xuyên, trừ khi tác tử đích đăng nhập riêng và tạo hồ sơ cục bộ của chính nó.

## Các tuyến xác thực chỉ dùng cấu hình

Các mục `auth.profiles` có `mode: "aws-sdk"` là siêu dữ liệu định tuyến, không phải thông tin xác thực được lưu trữ. Chúng hợp lệ khi nhà cung cấp đích sử dụng `models.providers.<id>.auth: "aws-sdk"`, tức tuyến được quy trình thiết lập Amazon Bedrock do plugin sở hữu ghi vào. Các mã định danh hồ sơ này có thể xuất hiện trong `auth.order` và các giá trị ghi đè phiên ngay cả khi không có mục tương ứng trong kho thông tin xác thực.

Không ghi `type: "aws-sdk"` vào kho thông tin xác thực; thông tin xác thực được lưu trữ chỉ có thể là `api_key`, `token` hoặc `oauth`. Nếu một tệp `auth-profiles.json` cũ có dấu đánh dấu như vậy, `openclaw doctor --fix` sẽ chuyển nó sang `auth.profiles` và xóa dấu đánh dấu khỏi kho.

## Lọc theo thứ tự xác thực tường minh

- Khi `auth.order.<provider>` hoặc giá trị ghi đè thứ tự của kho xác thực được đặt cho một nhà cung cấp, `models status --probe` chỉ thăm dò các mã định danh hồ sơ còn lại trong thứ tự xác thực đã phân giải của nhà cung cấp đó. Giá trị ghi đè đã lưu được ưu tiên hơn cấu hình `auth.order`.
- Hồ sơ đã lưu của nhà cung cấp đó nhưng bị loại khỏi thứ tự tường minh sẽ không được âm thầm thử lại sau đó. Đầu ra thăm dò báo cáo hồ sơ này với `reasonCode: excluded_by_auth_order` và chi tiết `Excluded by auth.order for this provider.`

## Phân giải mục tiêu thăm dò

- Mục tiêu thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực trong môi trường hoặc `models.json` (`source` của kết quả: `profile`, `env`, `models.json`).
- Nếu một nhà cung cấp có thông tin xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể thăm dò, `models status --probe` báo cáo `status: no_model` với `reasonCode: no_model`.

## Phát hiện thông tin xác thực của CLI bên ngoài

- Thông tin xác thực chỉ dùng khi chạy do các CLI bên ngoài sở hữu (Claude CLI cho `claude-cli`, Codex CLI cho `openai`, MiniMax CLI cho `minimax-portal`) chỉ được phát hiện khi nhà cung cấp, môi trường chạy hoặc hồ sơ xác thực nằm trong phạm vi của thao tác hiện tại, hoặc khi đã tồn tại hồ sơ cục bộ được lưu trữ cho nguồn bên ngoài đó.
- Các bên gọi kho xác thực chọn một chế độ phát hiện CLI bên ngoài tường minh: `none` để chỉ dùng xác thực được lưu bền vững/xác thực của plugin, `existing` để làm mới các hồ sơ CLI bên ngoài đã lưu, hoặc `scoped` cho một tập hợp nhà cung cấp/hồ sơ cụ thể.
- Các đường dẫn chỉ đọc/trạng thái truyền `allowKeychainPrompt: false`; chúng chỉ sử dụng thông tin xác thực của CLI bên ngoài được lưu trong tệp và không đọc hoặc tái sử dụng kết quả từ macOS Keychain.

## Cơ chế bảo vệ chính sách SecretRef cho OAuth

Đầu vào SecretRef chỉ dành cho thông tin xác thực tĩnh. Thông tin xác thực OAuth có thể thay đổi khi chạy (các luồng làm mới lưu token đã luân chuyển), vì vậy dữ liệu OAuth dựa trên SecretRef sẽ chia trạng thái có thể thay đổi giữa nhiều kho.

- Nếu thông tin xác thực của hồ sơ có `type: "oauth"`, các đối tượng SecretRef sẽ bị từ chối trong mọi trường dữ liệu thông tin xác thực của hồ sơ đó.
- Nếu `auth.profiles.<id>.mode` là `"oauth"`, đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.
- Các vi phạm là lỗi nghiêm trọng (ném lỗi) trong quá trình chuẩn bị bí mật khi khởi động/tải lại và trong các đường dẫn phân giải hồ sơ.

## Thông báo tương thích với phiên bản cũ

Để bảo đảm khả năng tương thích với tập lệnh, lỗi thăm dò giữ nguyên dòng đầu tiên sau đây:

`Auth profile credentials are missing or expired.`

Chi tiết thân thiện với người dùng và mã lý do ổn định xuất hiện ở các dòng tiếp theo theo dạng `↳ Auth reason [code]: ...`.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Lưu trữ xác thực](/vi/concepts/oauth)
