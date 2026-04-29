---
read_when:
    - Gỡ lỗi xác thực mô hình hoặc OAuth hết hạn
    - Ghi tài liệu về xác thực hoặc lưu trữ thông tin xác thực
summary: 'Xác thực mô hình: OAuth, khóa API, tái sử dụng Claude CLI và setup-token của Anthropic'
title: Xác thực
x-i18n:
    generated_at: "2026-04-29T22:41:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Trang này là tài liệu tham chiếu xác thực **nhà cung cấp mô hình** (khóa API, OAuth, tái sử dụng Claude CLI và Anthropic setup-token). Với xác thực **kết nối gateway** (token, password, trusted-proxy), xem [Cấu hình](/vi/gateway/configuration) và [Xác thực Proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).
</Note>

OpenClaw hỗ trợ OAuth và khóa API cho các nhà cung cấp mô hình. Với các máy chủ Gateway
chạy thường trực, khóa API thường là lựa chọn dễ dự đoán nhất. Các luồng subscription/OAuth
cũng được hỗ trợ khi chúng phù hợp với mô hình tài khoản nhà cung cấp của bạn.

Xem [/concepts/oauth](/vi/concepts/oauth) để biết đầy đủ luồng OAuth và bố cục
lưu trữ.
Với xác thực dựa trên SecretRef (các nhà cung cấp `env`/`file`/`exec`), xem [Quản lý bí mật](/vi/gateway/secrets).
Với các quy tắc đủ điều kiện thông tin xác thực/mã lý do được `models status --probe` dùng, xem
[Ngữ nghĩa thông tin xác thực Auth](/vi/auth-credential-semantics).

## Thiết lập được khuyến nghị (khóa API, mọi nhà cung cấp)

Nếu bạn đang chạy một Gateway tồn tại lâu dài, hãy bắt đầu với khóa API cho
nhà cung cấp bạn chọn.
Riêng với Anthropic, xác thực bằng khóa API vẫn là thiết lập máy chủ dễ dự đoán
nhất, nhưng OpenClaw cũng hỗ trợ tái sử dụng đăng nhập Claude CLI cục bộ.

1. Tạo khóa API trong bảng điều khiển nhà cung cấp của bạn.
2. Đặt khóa đó trên **máy chủ Gateway** (máy đang chạy `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Nếu Gateway chạy dưới systemd/launchd, nên đặt khóa trong
   `~/.openclaw/.env` để daemon có thể đọc:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Sau đó khởi động lại daemon (hoặc khởi động lại tiến trình Gateway của bạn) và kiểm tra lại:

```bash
openclaw models status
openclaw doctor
```

Nếu bạn không muốn tự quản lý biến môi trường, quá trình onboarding có thể lưu
khóa API để daemon sử dụng: `openclaw onboard`.

Xem [Trợ giúp](/vi/help) để biết chi tiết về kế thừa môi trường (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI và khả năng tương thích token

Xác thực Anthropic setup-token vẫn có trong OpenClaw dưới dạng một đường dẫn token
được hỗ trợ. Nhân viên Anthropic kể từ đó đã cho chúng tôi biết rằng cách sử dụng Claude CLI kiểu OpenClaw
được cho phép trở lại, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là
được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. Khi
có thể tái sử dụng Claude CLI trên máy chủ, đó hiện là đường dẫn được ưu tiên.

Với các máy chủ Gateway tồn tại lâu dài, khóa API Anthropic vẫn là thiết lập
dễ dự đoán nhất. Nếu bạn muốn tái sử dụng đăng nhập Claude hiện có trên cùng máy chủ, hãy dùng
đường dẫn Anthropic Claude CLI trong onboarding/configure.

Thiết lập máy chủ được khuyến nghị để tái sử dụng Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Đây là thiết lập hai bước:

1. Đăng nhập chính Claude Code vào Anthropic trên máy chủ Gateway.
2. Báo OpenClaw chuyển lựa chọn mô hình Anthropic sang backend `claude-cli`
   cục bộ và lưu hồ sơ xác thực OpenClaw tương ứng.

Nếu `claude` không có trong `PATH`, hãy cài Claude Code trước hoặc đặt
`agents.defaults.cliBackends.claude-cli.command` thành đường dẫn binary thực tế.

Nhập token thủ công (mọi nhà cung cấp; ghi `auth-profiles.json` + cập nhật cấu hình):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` chỉ lưu thông tin xác thực. Cấu trúc chuẩn là:

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

OpenClaw mong đợi cấu trúc chuẩn `version` + `profiles` khi chạy. Nếu một bản cài đặt cũ vẫn có tệp phẳng như `{ "openrouter": { "apiKey": "..." } }`, hãy chạy `openclaw doctor --fix` để viết lại thành hồ sơ khóa API `openrouter:default`; doctor giữ một bản sao `.legacy-flat.*.bak` bên cạnh bản gốc. Các chi tiết endpoint như `baseUrl`, `api`, id mô hình, header và timeout thuộc về `models.providers.<id>` trong `openclaw.json` hoặc `models.json`, không phải trong `auth-profiles.json`.

Refs hồ sơ xác thực cũng được hỗ trợ cho thông tin xác thực tĩnh:

- Thông tin xác thực `api_key` có thể dùng `keyRef: { source, provider, id }`
- Thông tin xác thực `token` có thể dùng `tokenRef: { source, provider, id }`
- Hồ sơ chế độ OAuth không hỗ trợ thông tin xác thực SecretRef; nếu `auth.profiles.<id>.mode` được đặt thành `"oauth"`, đầu vào `keyRef`/`tokenRef` được SecretRef hỗ trợ cho hồ sơ đó sẽ bị từ chối.

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
- Nếu `auth.order.<provider>` rõ ràng bỏ qua một hồ sơ đã lưu, thăm dò báo cáo
  `excluded_by_auth_order` cho hồ sơ đó thay vì thử dùng nó.
- Nếu có xác thực nhưng OpenClaw không thể phân giải ứng viên mô hình có thể thăm dò cho
  nhà cung cấp đó, thăm dò báo cáo `status: no_model`.
- Thời gian chờ do giới hạn tốc độ có thể theo phạm vi mô hình. Một hồ sơ đang chờ cho một
  mô hình vẫn có thể dùng được cho mô hình cùng nhóm trên cùng nhà cung cấp.

Các script vận hành tùy chọn (systemd/Termux) được ghi lại tại đây:
[Script giám sát xác thực](/vi/help/scripts#auth-monitoring-scripts)

## Ghi chú về Anthropic

Backend Anthropic `claude-cli` được hỗ trợ trở lại.

- Nhân viên Anthropic đã cho chúng tôi biết đường dẫn tích hợp OpenClaw này được cho phép trở lại.
- Do đó OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận
  cho các lần chạy dựa trên Anthropic trừ khi Anthropic công bố chính sách mới.
- Khóa API Anthropic vẫn là lựa chọn dễ dự đoán nhất cho các máy chủ Gateway
  tồn tại lâu dài và kiểm soát thanh toán phía máy chủ rõ ràng.

## Kiểm tra trạng thái xác thực mô hình

```bash
openclaw models status
openclaw doctor
```

## Hành vi xoay vòng khóa API (gateway)

Một số nhà cung cấp hỗ trợ thử lại một yêu cầu bằng các khóa thay thế khi một lệnh gọi API
gặp giới hạn tốc độ của nhà cung cấp.

- Thứ tự ưu tiên:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè đơn)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Các nhà cung cấp Google cũng bao gồm `GOOGLE_API_KEY` làm phương án dự phòng bổ sung.
- Cùng một danh sách khóa sẽ được loại trùng trước khi dùng.
- OpenClaw chỉ thử lại với khóa tiếp theo đối với lỗi giới hạn tốc độ (ví dụ
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, hoặc
  `workers_ai ... quota limit exceeded`).
- Các lỗi không phải giới hạn tốc độ sẽ không được thử lại bằng khóa thay thế.
- Nếu tất cả khóa đều thất bại, lỗi cuối cùng từ lần thử cuối sẽ được trả về.

## Kiểm soát thông tin xác thực được sử dụng

### Theo phiên (lệnh chat)

Dùng `/model <alias-or-id>@<profileId>` để ghim một thông tin xác thực nhà cung cấp cụ thể cho phiên hiện tại (ví dụ id hồ sơ: `anthropic:default`, `anthropic:work`).

Dùng `/model` (hoặc `/model list`) cho bộ chọn gọn; dùng `/model status` để xem đầy đủ (ứng viên + hồ sơ xác thực tiếp theo, cùng chi tiết endpoint nhà cung cấp khi đã cấu hình).

### Theo agent (ghi đè CLI)

Đặt ghi đè thứ tự hồ sơ xác thực rõ ràng cho một agent (được lưu trong `auth-state.json` của agent đó):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Dùng `--agent <id>` để nhắm tới một agent cụ thể; bỏ qua để dùng agent mặc định đã cấu hình.
Khi bạn gỡ lỗi vấn đề về thứ tự, `openclaw models status --probe` hiển thị các hồ sơ
đã lưu bị bỏ qua là `excluded_by_auth_order` thay vì lặng lẽ bỏ qua chúng.
Khi bạn gỡ lỗi vấn đề thời gian chờ, hãy nhớ rằng thời gian chờ do giới hạn tốc độ có thể gắn
với một id mô hình thay vì toàn bộ hồ sơ nhà cung cấp.

## Khắc phục sự cố

### "Không tìm thấy thông tin xác thực"

Nếu hồ sơ Anthropic bị thiếu, hãy cấu hình khóa API Anthropic trên
**máy chủ Gateway** hoặc thiết lập đường dẫn Anthropic setup-token, rồi kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xác nhận hồ sơ nào sắp hết hạn. Nếu một
hồ sơ token Anthropic bị thiếu hoặc đã hết hạn, hãy làm mới thiết lập đó qua
setup-token hoặc chuyển sang khóa API Anthropic.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Truy cập từ xa](/vi/gateway/remote)
- [Lưu trữ xác thực](/vi/concepts/oauth)
