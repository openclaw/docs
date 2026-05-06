---
read_when:
    - Gỡ lỗi xác thực mô hình hoặc OAuth hết hạn
    - Tài liệu hóa việc xác thực hoặc lưu trữ thông tin xác thực
summary: 'Xác thực mô hình: OAuth, khóa API, tái sử dụng Claude CLI và Anthropic setup-token'
title: Xác thực
x-i18n:
    generated_at: "2026-05-06T09:11:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Trang này là tài liệu tham chiếu xác thực **nhà cung cấp mô hình** (khóa API, OAuth, tái sử dụng Claude CLI và setup-token của Anthropic). Để xác thực **kết nối Gateway** (token, mật khẩu, trusted-proxy), xem [Cấu hình](/vi/gateway/configuration) và [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
</Note>

OpenClaw hỗ trợ OAuth và khóa API cho các nhà cung cấp mô hình. Đối với các
máy chủ Gateway luôn bật, khóa API thường là lựa chọn dễ dự đoán nhất. Các luồng
thuê bao/OAuth cũng được hỗ trợ khi phù hợp với mô hình tài khoản của nhà cung cấp.

Xem [/concepts/oauth](/vi/concepts/oauth) để biết đầy đủ luồng OAuth và bố cục
lưu trữ.
Đối với xác thực dựa trên SecretRef (các nhà cung cấp `env`/`file`/`exec`), xem [Quản lý bí mật](/vi/gateway/secrets).
Đối với các quy tắc đủ điều kiện thông tin xác thực/mã lý do được `models status --probe` dùng, xem
[Ngữ nghĩa thông tin xác thực](/vi/auth-credential-semantics).

## Thiết lập được khuyến nghị (khóa API, bất kỳ nhà cung cấp nào)

Nếu bạn đang chạy một Gateway tồn tại lâu dài, hãy bắt đầu bằng khóa API cho nhà
cung cấp bạn chọn.
Riêng với Anthropic, xác thực bằng khóa API vẫn là thiết lập máy chủ dễ dự đoán
nhất, nhưng OpenClaw cũng hỗ trợ tái sử dụng đăng nhập Claude CLI cục bộ.

1. Tạo khóa API trong bảng điều khiển của nhà cung cấp.
2. Đặt khóa đó trên **máy chủ Gateway** (máy đang chạy `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Nếu Gateway chạy dưới systemd/launchd, nên đặt khóa trong
   `~/.openclaw/.env` để tiến trình nền có thể đọc:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Sau đó khởi động lại tiến trình nền (hoặc khởi động lại tiến trình Gateway của bạn) và kiểm tra lại:

```bash
openclaw models status
openclaw doctor
```

Nếu bạn không muốn tự quản lý biến môi trường, quá trình onboarding có thể lưu
khóa API để tiến trình nền sử dụng: `openclaw onboard`.

Xem [Trợ giúp](/vi/help) để biết chi tiết về kế thừa môi trường (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI và khả năng tương thích token

Xác thực setup-token của Anthropic vẫn có trong OpenClaw dưới dạng một đường dẫn
token được hỗ trợ. Nhân viên Anthropic sau đó đã cho chúng tôi biết rằng cách dùng
Claude CLI kiểu OpenClaw lại được cho phép, vì vậy OpenClaw xem việc tái sử dụng
Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới. Khi có thể tái sử dụng Claude CLI trên máy chủ, đó hiện là
đường dẫn được ưu tiên.

Đối với các máy chủ Gateway tồn tại lâu dài, khóa API Anthropic vẫn là thiết lập
dễ dự đoán nhất. Nếu bạn muốn tái sử dụng một đăng nhập Claude hiện có trên cùng
máy chủ, hãy dùng đường dẫn Anthropic Claude CLI trong onboarding/configure.

Thiết lập máy chủ được khuyến nghị để tái sử dụng Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Đây là thiết lập hai bước:

1. Đăng nhập chính Claude Code vào Anthropic trên máy chủ Gateway.
2. Cho OpenClaw biết để chuyển lựa chọn mô hình Anthropic sang backend `claude-cli`
   cục bộ và lưu hồ sơ xác thực OpenClaw tương ứng.

Nếu `claude` không có trên `PATH`, hãy cài Claude Code trước hoặc đặt
`agents.defaults.cliBackends.claude-cli.command` thành đường dẫn nhị phân thực.

Nhập token thủ công (bất kỳ nhà cung cấp nào; ghi `auth-profiles.json` + cập nhật cấu hình):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` chỉ lưu thông tin xác thực. Hình dạng chuẩn là:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw yêu cầu hình dạng chuẩn `version` + `profiles` khi chạy. Nếu một bản cài đặt cũ hơn vẫn có tệp phẳng như `{ "openrouter": { "apiKey": "..." } }`, hãy chạy `openclaw doctor --fix` để viết lại thành hồ sơ khóa API `openrouter:default`; doctor giữ một bản sao `.legacy-flat.*.bak` bên cạnh bản gốc. Các chi tiết endpoint như `baseUrl`, `api`, id mô hình, header và timeout thuộc về `models.providers.<id>` trong `openclaw.json` hoặc `models.json`, không nằm trong `auth-profiles.json`.

Tham chiếu hồ sơ xác thực cũng được hỗ trợ cho thông tin xác thực tĩnh:

- Thông tin xác thực `api_key` có thể dùng `keyRef: { source, provider, id }`
- Thông tin xác thực `token` có thể dùng `tokenRef: { source, provider, id }`
- Hồ sơ chế độ OAuth không hỗ trợ thông tin xác thực SecretRef; nếu `auth.profiles.<id>.mode` được đặt thành `"oauth"`, đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.

Kiểm tra thân thiện với tự động hóa (thoát `1` khi hết hạn/thiếu, `2` khi sắp hết hạn):

```bash
openclaw models status --check
```

Thăm dò xác thực trực tiếp:

```bash
openclaw models status --probe
```

Ghi chú:

- Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực môi trường hoặc `models.json`.
- Nếu `auth.order.<provider>` tường minh bỏ qua một hồ sơ đã lưu, thăm dò báo cáo
  `excluded_by_auth_order` cho hồ sơ đó thay vì thử dùng nó.
- Nếu có xác thực nhưng OpenClaw không thể phân giải một ứng viên mô hình có thể
  thăm dò cho nhà cung cấp đó, thăm dò báo cáo `status: no_model`.
- Thời gian tạm ngừng do giới hạn tần suất có thể được phạm vi theo mô hình. Một hồ sơ
  đang tạm ngừng cho một mô hình vẫn có thể dùng được cho một mô hình cùng họ trên cùng nhà cung cấp.

Các script vận hành tùy chọn (systemd/Termux) được ghi lại tại đây:
[Script giám sát xác thực](/vi/help/scripts#auth-monitoring-scripts)

## Ghi chú về Anthropic

Backend `claude-cli` của Anthropic lại được hỗ trợ.

- Nhân viên Anthropic đã cho chúng tôi biết đường dẫn tích hợp OpenClaw này lại được cho phép.
- Vì vậy OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận
  cho các lần chạy dựa trên Anthropic, trừ khi Anthropic công bố chính sách mới.
- Khóa API Anthropic vẫn là lựa chọn dễ dự đoán nhất cho các máy chủ Gateway
  tồn tại lâu dài và kiểm soát thanh toán phía máy chủ tường minh.

## Kiểm tra trạng thái xác thực mô hình

```bash
openclaw models status
openclaw doctor
```

## Hành vi xoay vòng khóa API (Gateway)

Một số nhà cung cấp hỗ trợ thử lại yêu cầu bằng khóa thay thế khi một lệnh gọi API
gặp giới hạn tần suất của nhà cung cấp.

- Thứ tự ưu tiên:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè đơn)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Các nhà cung cấp Google cũng bao gồm `GOOGLE_API_KEY` làm dự phòng bổ sung.
- Cùng một danh sách khóa được loại trùng trước khi dùng.
- OpenClaw chỉ thử lại bằng khóa tiếp theo đối với lỗi giới hạn tần suất (ví dụ
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, hoặc
  `workers_ai ... quota limit exceeded`).
- Lỗi không phải giới hạn tần suất sẽ không được thử lại bằng khóa thay thế.
- Nếu tất cả khóa đều thất bại, lỗi cuối cùng từ lần thử cuối sẽ được trả về.

## Kiểm soát thông tin xác thực được dùng

### Theo phiên (lệnh chat)

Dùng `/model <alias-or-id>@<profileId>` để ghim một thông tin xác thực nhà cung cấp cụ thể cho phiên hiện tại (ví dụ id hồ sơ: `anthropic:default`, `anthropic:work`).

Dùng `/model` (hoặc `/model list`) cho bộ chọn gọn; dùng `/model status` cho chế độ xem đầy đủ (ứng viên + hồ sơ xác thực tiếp theo, cộng với chi tiết endpoint nhà cung cấp khi được cấu hình).

### Theo agent (ghi đè CLI)

Đặt ghi đè thứ tự hồ sơ xác thực tường minh cho một agent (được lưu trong `auth-state.json` của agent đó):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Dùng `--agent <id>` để nhắm tới một agent cụ thể; bỏ qua để dùng agent mặc định đã cấu hình.
Khi bạn gỡ lỗi các vấn đề về thứ tự, `openclaw models status --probe` hiển thị các
hồ sơ đã lưu bị bỏ qua là `excluded_by_auth_order` thay vì âm thầm bỏ qua chúng.
Khi bạn gỡ lỗi các vấn đề tạm ngừng, hãy nhớ rằng thời gian tạm ngừng do giới hạn tần suất có thể gắn với
một id mô hình thay vì toàn bộ hồ sơ nhà cung cấp.

## Khắc phục sự cố

### "No credentials found"

Nếu thiếu hồ sơ Anthropic, hãy cấu hình khóa API Anthropic trên
**máy chủ Gateway** hoặc thiết lập đường dẫn setup-token của Anthropic, rồi kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xác nhận hồ sơ nào đang sắp hết hạn. Nếu một
hồ sơ token Anthropic bị thiếu hoặc đã hết hạn, hãy làm mới thiết lập đó qua
setup-token hoặc chuyển sang khóa API Anthropic.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Truy cập từ xa](/vi/gateway/remote)
- [Lưu trữ xác thực](/vi/concepts/oauth)
