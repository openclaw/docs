---
read_when:
    - Gỡ lỗi xác thực mô hình hoặc việc OAuth hết hạn
    - Tài liệu hóa xác thực hoặc lưu trữ thông tin xác thực
summary: 'Xác thực mô hình: OAuth, khóa API, tái sử dụng Claude CLI và Anthropic setup-token'
title: Xác thực
x-i18n:
    generated_at: "2026-06-27T17:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Trang này là tài liệu tham khảo về xác thực **nhà cung cấp mô hình** (khóa API, OAuth, tái sử dụng Claude CLI và setup-token Anthropic). Đối với xác thực **kết nối gateway** (token, mật khẩu, trusted-proxy), xem [Cấu hình](/vi/gateway/configuration) và [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth).
</Note>

OpenClaw hỗ trợ OAuth và khóa API cho các nhà cung cấp mô hình. Đối với các máy chủ gateway luôn bật,
khóa API thường là lựa chọn dễ dự đoán nhất. Các luồng thuê bao/OAuth
cũng được hỗ trợ khi chúng khớp với mô hình tài khoản nhà cung cấp của bạn.

Xem [/concepts/oauth](/vi/concepts/oauth) để biết đầy đủ luồng OAuth và bố cục
lưu trữ.
Đối với xác thực dựa trên SecretRef (các nhà cung cấp `env`/`file`/`exec`), xem [Quản lý bí mật](/vi/gateway/secrets).
Đối với các quy tắc về điều kiện hợp lệ của thông tin xác thực/mã lý do được `models status --probe` sử dụng, xem
[Ngữ nghĩa thông tin xác thực xác thực](/vi/auth-credential-semantics).

## Thiết lập được khuyến nghị (khóa API, bất kỳ nhà cung cấp nào)

Nếu bạn đang chạy một gateway tồn tại lâu dài, hãy bắt đầu bằng khóa API cho nhà cung cấp
bạn chọn.
Riêng với Anthropic, xác thực bằng khóa API vẫn là thiết lập máy chủ dễ dự đoán nhất,
nhưng OpenClaw cũng hỗ trợ tái sử dụng phiên đăng nhập Claude CLI cục bộ.

1. Tạo khóa API trong bảng điều khiển nhà cung cấp của bạn.
2. Đặt khóa đó trên **máy chủ gateway** (máy đang chạy `openclaw gateway`).

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

Nếu bạn không muốn tự quản lý biến môi trường, quy trình onboarding có thể lưu
khóa API để daemon sử dụng: `openclaw onboard`.

Xem [Trợ giúp](/vi/help) để biết chi tiết về kế thừa môi trường (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI và tính tương thích của token

Xác thực setup-token của Anthropic vẫn có trong OpenClaw như một đường dẫn token
được hỗ trợ. Nhân viên Anthropic kể từ đó đã cho chúng tôi biết rằng việc sử dụng Claude CLI theo kiểu OpenClaw
lại được cho phép, nên OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là
được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. Khi
có thể tái sử dụng Claude CLI trên máy chủ, đó hiện là đường dẫn được ưu tiên.

Đối với các máy chủ gateway tồn tại lâu dài, khóa API Anthropic vẫn là thiết lập
dễ dự đoán nhất. Nếu bạn muốn tái sử dụng phiên đăng nhập Claude hiện có trên cùng máy chủ, hãy dùng
đường dẫn Anthropic Claude CLI trong onboarding/configure.

Thiết lập máy chủ được khuyến nghị để tái sử dụng Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Đây là thiết lập gồm hai bước:

1. Đăng nhập chính Claude Code vào Anthropic trên máy chủ gateway.
2. Cho OpenClaw biết để chuyển lựa chọn mô hình Anthropic sang backend `claude-cli`
   cục bộ và lưu hồ sơ xác thực OpenClaw tương ứng.

Nếu `claude` không có trong `PATH`, hãy cài Claude Code trước hoặc đặt
`agents.defaults.cliBackends.claude-cli.command` thành đường dẫn nhị phân thực.

Nhập token thủ công (bất kỳ nhà cung cấp nào; ghi kho xác thực SQLite theo tác nhân + cập nhật cấu hình):

```bash
openclaw models auth paste-token --provider openrouter
```

Kho hồ sơ xác thực chỉ giữ thông tin xác thực. Các tệp `auth-profiles.json` cũ đã dùng dạng chuẩn này:

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

OpenClaw hiện đọc hồ sơ xác thực từ `openclaw-agent.sqlite` của từng tác nhân. Nếu một bản cài đặt cũ vẫn còn `auth-profiles.json`, `auth-state.json`, hoặc tệp hồ sơ xác thực phẳng như `{ "openrouter": { "apiKey": "..." } }`, hãy chạy `openclaw doctor --fix` để nhập nó vào SQLite; doctor giữ các bản sao lưu có dấu thời gian cạnh các tệp JSON gốc. Các chi tiết endpoint như `baseUrl`, `api`, mã định danh mô hình, tiêu đề và timeout thuộc về `models.providers.<id>` trong `openclaw.json` hoặc `models.json`, không nằm trong hồ sơ xác thực.

Các tuyến xác thực bên ngoài như Bedrock `auth: "aws-sdk"` cũng không phải là thông tin xác thực. Nếu bạn muốn một tuyến Bedrock có tên, hãy đặt `auth.profiles.<id>.mode: "aws-sdk"` trong `openclaw.json`; đừng ghi `type: "aws-sdk"` vào kho hồ sơ xác thực. `openclaw doctor --fix` di chuyển các dấu hiệu AWS SDK cũ từ kho thông tin xác thực sang metadata cấu hình.

Tham chiếu hồ sơ xác thực cũng được hỗ trợ cho thông tin xác thực tĩnh:

- Thông tin xác thực `api_key` có thể dùng `keyRef: { source, provider, id }`
- Thông tin xác thực `token` có thể dùng `tokenRef: { source, provider, id }`
- Hồ sơ chế độ OAuth không hỗ trợ thông tin xác thực SecretRef; nếu `auth.profiles.<id>.mode` được đặt thành `"oauth"`, dữ liệu đầu vào `keyRef`/`tokenRef` dựa trên SecretRef cho hồ sơ đó sẽ bị từ chối.

Kiểm tra thân thiện với tự động hóa (thoát `1` khi hết hạn/thiếu, `2` khi sắp hết hạn):

```bash
openclaw models status --check
```

Thăm dò xác thực trực tiếp:

```bash
openclaw models status --probe
```

Ghi chú:

- Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực trong môi trường, hoặc `models.json`.
- Nếu `auth.order.<provider>` tường minh bỏ qua một hồ sơ đã lưu, thăm dò báo cáo
  `excluded_by_auth_order` cho hồ sơ đó thay vì thử nó.
- Nếu xác thực tồn tại nhưng OpenClaw không thể phân giải một ứng viên mô hình có thể thăm dò cho
  nhà cung cấp đó, thăm dò báo cáo `status: no_model`.
- Thời gian chờ do giới hạn tốc độ có thể theo phạm vi mô hình. Một hồ sơ đang chờ hạ nhiệt cho một
  mô hình vẫn có thể dùng được cho mô hình anh em trên cùng nhà cung cấp.

Các tập lệnh vận hành tùy chọn (systemd/Termux) được ghi tài liệu tại đây:
[Tập lệnh giám sát xác thực](/vi/help/scripts#auth-monitoring-scripts)

## Ghi chú về Anthropic

Backend `claude-cli` của Anthropic đã được hỗ trợ trở lại.

- Nhân viên Anthropic cho chúng tôi biết đường dẫn tích hợp OpenClaw này lại được cho phép.
- Do đó OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận
  cho các lần chạy dùng Anthropic làm backend, trừ khi Anthropic công bố chính sách mới.
- Khóa API Anthropic vẫn là lựa chọn dễ dự đoán nhất cho các máy chủ gateway
  tồn tại lâu dài và kiểm soát lập hóa đơn phía máy chủ một cách tường minh.

## Kiểm tra trạng thái xác thực mô hình

```bash
openclaw models status
openclaw doctor
```

## Hành vi xoay vòng khóa API (gateway)

Một số nhà cung cấp hỗ trợ thử lại yêu cầu bằng khóa thay thế khi một lệnh gọi API
gặp giới hạn tốc độ của nhà cung cấp.

- Thứ tự ưu tiên:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè đơn)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Các nhà cung cấp Google cũng bao gồm `GOOGLE_API_KEY` như một phương án dự phòng bổ sung.
- Cùng một danh sách khóa được khử trùng lặp trước khi sử dụng.
- OpenClaw chỉ thử lại với khóa tiếp theo đối với lỗi giới hạn tốc độ (ví dụ
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, hoặc
  `workers_ai ... quota limit exceeded`).
- Các lỗi không phải giới hạn tốc độ không được thử lại bằng khóa thay thế.
- Nếu tất cả khóa đều thất bại, lỗi cuối cùng từ lần thử cuối được trả về.

## Gỡ bỏ xác thực nhà cung cấp khi gateway đang chạy

Khi xác thực nhà cung cấp bị gỡ bỏ qua mặt phẳng điều khiển Gateway, OpenClaw xóa
các hồ sơ xác thực đã lưu cho nhà cung cấp đó và hủy các cuộc trò chuyện hoặc lần chạy tác nhân đang hoạt động
có nhà cung cấp mô hình đã chọn khớp với nhà cung cấp bị gỡ bỏ. Các lần chạy bị hủy phát ra
sự kiện hủy trò chuyện và vòng đời bình thường với
`stopReason: "auth-revoked"`, để các client đã kết nối có thể hiển thị rằng lần chạy đã
dừng vì thông tin xác thực đã bị gỡ bỏ.

Gỡ bỏ xác thực đã lưu không thu hồi khóa ở phía nhà cung cấp. Hãy xoay vòng hoặc thu hồi
khóa trong bảng điều khiển nhà cung cấp khi bạn cần vô hiệu hóa ở phía nhà cung cấp.

## Kiểm soát thông tin xác thực nào được sử dụng

### OpenAI và các mã định danh `openai-codex` cũ

Hồ sơ khóa API OpenAI và hồ sơ OAuth ChatGPT/Codex đều dùng mã định danh
nhà cung cấp chuẩn `openai`. Cấu hình mới nên dùng mã định danh hồ sơ `openai:*` và
`auth.order.openai`.

Nếu bạn thấy `openai-codex` trong cấu hình cũ, mã định danh hồ sơ xác thực, hoặc
`auth.order.openai-codex`, hãy xem nó là dữ liệu đầu vào di trú cũ. Đừng tạo hồ sơ
`openai-codex` mới. Chạy:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor ghi lại mã định danh hồ sơ `openai-codex:*` cũ và các mục
`auth.order.openai-codex` thành tuyến xác thực `openai` chuẩn. Đối với
định tuyến mô hình/runtime riêng cho OpenAI, xem [OpenAI](/vi/providers/openai).

### Trong khi đăng nhập (CLI)

Dùng `openclaw models auth login --provider <id> --profile-id <profileId>` cho
các nhà cung cấp hỗ trợ hồ sơ xác thực có tên trong khi đăng nhập.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Đây là cách dễ nhất để giữ nhiều phiên đăng nhập OAuth cho cùng một nhà cung cấp
tách biệt bên trong một tác nhân.

Dùng `--force` khi hồ sơ nhà cung cấp đã lưu bị kẹt, hết hạn, hoặc gắn với
sai tài khoản và lệnh đăng nhập thông thường cứ tái sử dụng nó. `--force` xóa
các hồ sơ xác thực đã lưu cho nhà cung cấp đó trong thư mục tác nhân đã chọn, rồi
chạy lại cùng luồng xác thực nhà cung cấp. Nó không thu hồi thông tin xác thực ở phía
nhà cung cấp; hãy xoay vòng hoặc thu hồi chúng trong bảng điều khiển nhà cung cấp khi bạn cần
vô hiệu hóa ở phía nhà cung cấp.

```bash
openclaw models auth login --provider anthropic --force
```

### Theo phiên (lệnh trò chuyện)

Dùng `/model <alias-or-id>@<profileId>` để ghim một thông tin xác thực nhà cung cấp cụ thể cho phiên hiện tại (ví dụ mã định danh hồ sơ: `anthropic:default`, `anthropic:work`).

Dùng `/model` (hoặc `/model list`) để có bộ chọn gọn; dùng `/model status` để xem đầy đủ (ứng viên + hồ sơ xác thực tiếp theo, cùng chi tiết endpoint nhà cung cấp khi được cấu hình).

### Theo tác nhân (ghi đè CLI)

Đặt ghi đè thứ tự hồ sơ xác thực tường minh cho một tác nhân (được lưu trong trạng thái xác thực SQLite của tác nhân đó):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Dùng `--agent <id>` để nhắm tới một tác nhân cụ thể; bỏ qua để dùng tác nhân mặc định đã cấu hình.
Khi bạn gỡ lỗi vấn đề về thứ tự, `openclaw models status --probe` hiển thị các hồ sơ đã lưu bị bỏ qua
dưới dạng `excluded_by_auth_order` thay vì âm thầm bỏ qua chúng.
Khi bạn gỡ lỗi vấn đề thời gian chờ do giới hạn tốc độ, hãy nhớ rằng thời gian chờ có thể gắn
với một mã định danh mô hình thay vì toàn bộ hồ sơ nhà cung cấp.

Nếu bạn thay đổi thứ tự xác thực hoặc ghim hồ sơ cho một cuộc trò chuyện đang chạy,
hãy gửi `/new` hoặc `/reset` trong cuộc trò chuyện đó để bắt đầu một phiên mới. Các phiên hiện có
có thể giữ lựa chọn mô hình/hồ sơ hiện tại cho đến khi đặt lại.

## Khắc phục sự cố

### "Không tìm thấy thông tin xác thực"

Nếu thiếu hồ sơ Anthropic, hãy cấu hình khóa API Anthropic trên
**máy chủ gateway** hoặc thiết lập đường dẫn setup-token Anthropic, rồi kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xác nhận hồ sơ nào đang sắp hết hạn. Nếu một
hồ sơ token Anthropic bị thiếu hoặc đã hết hạn, hãy làm mới thiết lập đó qua
setup-token hoặc di trú sang khóa API Anthropic.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Truy cập từ xa](/vi/gateway/remote)
- [Lưu trữ xác thực](/vi/concepts/oauth)
