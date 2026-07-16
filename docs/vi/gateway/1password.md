---
read_when:
    - Bạn muốn đưa các khóa API ra khỏi openclaw.json và lưu trong 1Password
    - Bạn chạy Gateway ở chế độ không giao diện và cần xác thực bằng tài khoản dịch vụ cho op
    - Bạn muốn các agent đọc hoặc chèn thông tin bí mật bằng CLI `op`
summary: Phân giải các bí mật của Gateway bằng CLI 1Password và cho phép các tác tử sử dụng skill 1password đi kèm
title: 1Password
x-i18n:
    generated_at: "2026-07-16T14:23:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw kết hợp với **1Password** theo hai cách độc lập:

- **Bí mật cấu hình:** mọi trường [SecretRef](/vi/gateway/secrets) trong `openclaw.json` đều có thể được phân giải thông qua CLI `op` khi chạy, nhờ đó các khóa API không bao giờ nằm trong tệp cấu hình.
- **Quy trình làm việc của tác tử:** skill `1password` đi kèm hướng dẫn các tác tử đăng nhập và đọc hoặc chèn bí mật bằng `op` cho các tác vụ riêng của chúng.

## Yêu cầu

- [CLI 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) được cài đặt trên máy chủ Gateway (`brew install 1password-cli` trên macOS).
- Một chế độ xác thực cho `op`:
  - **Tài khoản dịch vụ** (khuyên dùng cho Gateway không có giao diện): xuất `OP_SERVICE_ACCOUNT_TOKEN` trong môi trường dịch vụ Gateway. Không cần ứng dụng máy tính, không cần đăng nhập tương tác.
  - **Tích hợp ứng dụng máy tính**: ứng dụng 1Password chạy trên cùng máy và đã bật tích hợp CLI. Những lệnh gọi đầu tiên có thể kích hoạt Touch ID hoặc xác thực hệ thống.
  - **Đăng nhập độc lập**: `op signin` nhắc đăng nhập theo từng phiên. Có thể dùng cho tác tử thông qua skill, nhưng không phù hợp để phân giải bí mật cấu hình trên Gateway không có giao diện.

## Phân giải bí mật cấu hình bằng op

Khai báo một trình cung cấp bí mật thực thi chạy `op read` với tham chiếu `op://vault/item/field`, sau đó trỏ mọi trường hỗ trợ SecretRef đến trình cung cấp đó:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được Homebrew cài đặt dưới dạng liên kết tượng trưng
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Cách các thành phần kết hợp với nhau:

- `command` phải là đường dẫn tuyệt đối; `trustedDirs` đánh dấu thư mục của đường dẫn đó là đáng tin cậy và cần `allowSymlinkCommand` vì Homebrew cài đặt `op` dưới dạng liên kết tượng trưng.
- `args` truyền nguyên văn tham chiếu `op://vault/item/field`. OpenClaw không tự phân tích lược đồ `op://`; tệp nhị phân `op` sẽ phân giải lược đồ đó.
- `passEnv` chuyển tiếp các biến được liệt kê từ môi trường Gateway. Tích hợp ứng dụng máy tính cần `HOME`; tài khoản dịch vụ cũng cần có `OP_SERVICE_ACCOUNT_TOKEN` trong môi trường dịch vụ Gateway (thêm biến này vào `passEnv`, hoặc chỉ đặt qua `env` nếu bạn chấp nhận việc mã thông báo có thể đọc được trong tệp cấu hình).
- Đối với đầu ra một giá trị, hãy giữ `id: "value"`. Với `jsonOnly: true` và tải trọng JSON, hãy truy cập các trường bằng mã định danh con trỏ JSON.
- Mỗi bí mật dùng một mục trình cung cấp giúp các tham chiếu dễ kiểm tra; đặt tên trình cung cấp theo thành phần sử dụng chúng (`onepassword_openai`, `onepassword_telegram`).

Xem [Bí mật Gateway](/vi/gateway/secrets) để biết thứ tự phân giải, cơ chế lưu bộ nhớ đệm và ngữ nghĩa lỗi; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết mọi trường chấp nhận SecretRef.

## Thiết lập tài khoản dịch vụ cho Gateway không có giao diện

1. Tạo tài khoản dịch vụ trong tài khoản 1Password của bạn và chỉ cấp cho tài khoản đó quyền đọc các mục trong kho mà Gateway cần.
2. Cung cấp `OP_SERVICE_ACCOUNT_TOKEN` cho dịch vụ Gateway (plist launchd, unit systemd hoặc biến môi trường của vùng chứa).
3. Thêm `"OP_SERVICE_ACCOUNT_TOKEN"` vào danh sách `passEnv` của trình cung cấp.
4. Xác minh từ môi trường máy chủ Gateway: `op whoami` phải in tài khoản dịch vụ mà không nhắc đăng nhập.

Việc đọc bằng tài khoản dịch vụ yêu cầu tên kho phải được chỉ định rõ ràng trong tham chiếu `op://`. Hãy giới hạn chặt chẽ phạm vi của tài khoản; đây là thông tin xác thực dạng bearer.

## Skill 1password dành cho tác tử

OpenClaw đi kèm một skill `1password` giúp tác tử trở thành người vận hành `op` thành thạo: skill này phát hiện chế độ xác thực khả dụng (tài khoản dịch vụ, tích hợp ứng dụng máy tính hoặc đăng nhập độc lập), xác minh quyền truy cập bằng `op whoami` trước khi đọc bất kỳ nội dung nào và ưu tiên `op run` / `op inject` thay vì ghi giá trị bí mật ra đĩa. Skill yêu cầu tệp nhị phân `op` và cung cấp tùy chọn cài đặt bằng Homebrew khi tệp này chưa có.

Tác tử sử dụng skill này cho quy trình làm việc riêng, chẳng hạn như đọc mã thông báo triển khai giữa tác vụ hoặc chèn biến môi trường vào một lệnh. Skill này độc lập với việc phân giải bí mật cấu hình; Gateway phân giải SecretRef mà không cần bất kỳ skill nào tham gia.

## Lưu ý bảo mật

- Các giá trị bí mật được phân giải qua trình cung cấp thực thi vẫn nằm trong bộ nhớ Gateway; ảnh chụp nhanh cấu hình và phản hồi `config.get` che các trường SecretRef.
- Không bao giờ đặt giá trị bí mật trong `openclaw.json`, nhật ký hoặc cuộc trò chuyện. Giữ tên mục trong cấu hình và giá trị trong 1Password.
- Dấu vết kiểm tra của 1Password hiển thị mọi lần đọc của tài khoản dịch vụ, giúp việc luân chuyển khóa và xem xét sự cố trở nên khả thi.

## Khắc phục sự cố

- `command not found` hoặc lỗi khởi tạo tiến trình: sử dụng đường dẫn tuyệt đối `op` và đưa thư mục của đường dẫn đó vào `trustedDirs`.
- `op` được phân giải nhưng thao tác đọc thất bại do lỗi liên kết tượng trưng: đặt `allowSymlinkCommand: true` cho các bản cài đặt Homebrew.
- `account is not signed in`: đối với tài khoản dịch vụ, hãy xác nhận `OP_SERVICE_ACCOUNT_TOKEN` đến được dịch vụ Gateway và có trong `passEnv`; đối với tích hợp ứng dụng máy tính, hãy xác nhận ứng dụng đang chạy và đã được mở khóa.
- Lần đọc đầu tiên chậm: tăng `timeoutMs` trên trình cung cấp; quá trình khởi động nguội của `op` có thể vượt quá thời gian chờ nghiêm ngặt trên các máy chủ đang bận.
