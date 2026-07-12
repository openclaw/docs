---
read_when:
    - Gỡ lỗi xác thực mô hình hoặc thời hạn OAuth
    - Tài liệu hóa việc xác thực hoặc lưu trữ thông tin xác thực
summary: 'Xác thực mô hình: OAuth, khóa API, tái sử dụng Claude CLI và mã thông báo thiết lập Anthropic'
title: Xác thực
x-i18n:
    generated_at: "2026-07-12T07:56:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Trang này trình bày cách xác thực **nhà cung cấp mô hình** (khóa API, OAuth, tái sử dụng Claude CLI, setup-token của Anthropic). Để biết cách xác thực **kết nối Gateway** (token, mật khẩu, proxy tin cậy), hãy xem [Cấu hình](/vi/gateway/configuration) và [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
</Note>

OpenClaw hỗ trợ OAuth và khóa API cho các nhà cung cấp mô hình. Đối với máy chủ Gateway hoạt động liên tục, khóa API là lựa chọn dễ dự đoán nhất; các luồng đăng ký/OAuth cũng hoạt động khi phù hợp với mô hình tài khoản nhà cung cấp của bạn.

- Luồng OAuth đầy đủ và bố cục lưu trữ: [/concepts/oauth](/vi/concepts/oauth)
- Xác thực dựa trên SecretRef (các nhà cung cấp `env`/`file`/`exec`): [Quản lý bí mật](/vi/gateway/secrets)
- Điều kiện hợp lệ/mã lý do của thông tin xác thực được `models status --probe` sử dụng: [Ngữ nghĩa thông tin xác thực](/vi/auth-credential-semantics)

## Thiết lập được khuyến nghị: khóa API (mọi nhà cung cấp)

1. Tạo khóa API trong bảng điều khiển của nhà cung cấp.
2. Đặt khóa đó trên **máy chủ Gateway** (máy chạy `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Nếu Gateway chạy dưới systemd/launchd, hãy đặt khóa vào `~/.openclaw/.env` để tiến trình nền có thể đọc:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Khởi động lại tiến trình Gateway (hoặc tiến trình nền), rồi kiểm tra lại:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` cũng có thể lưu khóa API để tiến trình nền sử dụng nếu bạn không muốn tự quản lý biến môi trường. Xem [Biến môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên khi nạp môi trường (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: tái sử dụng Claude CLI

Xác thực bằng setup-token của Anthropic vẫn là một phương thức được hỗ trợ. Việc tái sử dụng Claude CLI (cách dùng kiểu `claude -p`) cũng được chấp thuận cho tích hợp này; khi thông tin đăng nhập Claude CLI có sẵn trên máy chủ, đây là phương thức ưu tiên cho việc sử dụng cục bộ/trên máy tính cá nhân. Đối với máy chủ Gateway hoạt động dài hạn, khóa API Anthropic vẫn là lựa chọn dễ dự đoán nhất, với khả năng kiểm soát thanh toán rõ ràng ở phía máy chủ.

Thiết lập trên máy chủ để tái sử dụng Claude CLI:

```bash
# Chạy trên máy chủ Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Quy trình này gồm hai bước: đăng nhập Claude Code vào Anthropic trên máy chủ, sau đó yêu cầu OpenClaw định tuyến việc lựa chọn mô hình Anthropic qua phần phụ trợ `claude-cli` cục bộ và lưu hồ sơ xác thực OpenClaw tương ứng.

Nếu `claude` không nằm trong `PATH`, hãy cài đặt Claude Code hoặc đặt `agents.defaults.cliBackends.claude-cli.command` thành đường dẫn đến tệp nhị phân.

## Nhập token thủ công

Hoạt động với mọi nhà cung cấp; ghi vào kho xác thực SQLite theo từng tác nhân và cập nhật cấu hình:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw đọc hồ sơ xác thực từ `openclaw-agent.sqlite` của từng tác nhân. Chi tiết điểm cuối (`baseUrl`, `api`, mã định danh mô hình, tiêu đề, thời gian chờ) thuộc `models.providers.<id>` trong `openclaw.json` hoặc `models.json`, không thuộc hồ sơ xác thực.

Nếu bản cài đặt cũ vẫn còn `auth-profiles.json`, `auth-state.json` hoặc cấu trúc phẳng như `{ "openrouter": { "apiKey": "..." } }`, hãy chạy `openclaw doctor --fix` để nhập dữ liệu đó vào SQLite; doctor giữ các bản sao lưu có dấu thời gian bên cạnh các tệp JSON gốc.

Các tuyến xác thực bên ngoài như `auth: "aws-sdk"` của Bedrock không phải là thông tin xác thực. Đối với một tuyến Bedrock có tên, hãy đặt `auth.profiles.<id>.mode: "aws-sdk"` trong `openclaw.json` — không ghi `type: "aws-sdk"` vào kho hồ sơ xác thực. `openclaw doctor --fix` di chuyển các dấu hiệu AWS SDK cũ từ kho thông tin xác thực sang siêu dữ liệu cấu hình.

### Thông tin xác thực dựa trên SecretRef

- Thông tin xác thực `api_key` có thể sử dụng `keyRef: { source, provider, id }`
- Thông tin xác thực `token` có thể sử dụng `tokenRef: { source, provider, id }`
- Hồ sơ ở chế độ OAuth từ chối thông tin xác thực SecretRef: nếu `auth.profiles.<id>.mode` là `"oauth"`, `keyRef`/`tokenRef` dựa trên SecretRef của hồ sơ đó sẽ bị từ chối.

## Kiểm tra trạng thái xác thực mô hình

```bash
openclaw models status
openclaw doctor
```

Kiểm tra phù hợp cho tự động hóa, thoát với mã `1` khi đã hết hạn/bị thiếu, `2` khi sắp hết hạn:

```bash
openclaw models status --check
```

Thăm dò xác thực trực tiếp (thêm `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` hoặc `--probe-max-tokens` để thu hẹp phạm vi):

```bash
openclaw models status --probe
```

Lưu ý:

- Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực trong môi trường hoặc `models.json`.
- Nếu `auth.order.<provider>` bỏ qua một hồ sơ đã lưu, thăm dò sẽ báo cáo `excluded_by_auth_order` cho hồ sơ đó thay vì thử sử dụng.
- Nếu có thông tin xác thực nhưng OpenClaw không thể phân giải mô hình có thể thăm dò cho nhà cung cấp đó, thăm dò sẽ báo cáo `status: no_model`.
- Thời gian chờ sau khi bị giới hạn tốc độ có thể áp dụng theo từng mô hình: hồ sơ đang trong thời gian chờ đối với một mô hình vẫn có thể phục vụ một mô hình cùng nhóm trên cùng nhà cung cấp.

Các tập lệnh vận hành tùy chọn (systemd/Termux): [Tập lệnh giám sát xác thực](/vi/help/scripts#auth-monitoring-scripts).

## Luân phiên khóa API (Gateway)

Một số nhà cung cấp thử lại yêu cầu bằng khóa thay thế đã cấu hình khi lệnh gọi gặp giới hạn tốc độ của nhà cung cấp.

Thứ tự ưu tiên khóa theo từng nhà cung cấp:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè đơn, cố định một khóa)
2. `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy/khoảng trắng/dấu chấm phẩy)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (mọi biến môi trường có tiền tố này)

Các nhà cung cấp Google (`google`, `google-vertex`) còn dự phòng bằng `GOOGLE_API_KEY`. Danh sách kết hợp được loại bỏ mục trùng lặp trước khi sử dụng.

OpenClaw chỉ chuyển sang khóa tiếp theo khi thông báo lỗi khớp với: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` hoặc `too many requests`. Các lỗi khác không được thử lại bằng khóa thay thế. Nếu tất cả khóa đều thất bại, lỗi cuối cùng từ lần thử cuối sẽ được trả về.

<Note>
Các cụm từ riêng của nhà cung cấp như `ThrottlingException`, `concurrency limit reached` hoặc `workers_ai ... quota limit exceeded` chi phối **việc phân loại chuyển đổi dự phòng/thử lại** (chuyển mô hình hoặc nhà cung cấp khi lỗi lặp lại), đây là cơ chế tách biệt với việc luân phiên khóa API nêu trên.
</Note>

Việc xóa thông tin xác thực đã lưu không thu hồi khóa tại nhà cung cấp — hãy luân phiên hoặc thu hồi khóa trong bảng điều khiển của nhà cung cấp khi bạn cần vô hiệu hóa ở phía nhà cung cấp.

## Xóa thông tin xác thực của nhà cung cấp khi Gateway đang chạy

Khi bạn xóa thông tin xác thực của nhà cung cấp qua mặt phẳng điều khiển Gateway, OpenClaw sẽ xóa các hồ sơ xác thực đã lưu của nhà cung cấp đó và hủy các lượt chạy trò chuyện/tác nhân đang hoạt động có nhà cung cấp mô hình được chọn trùng với nhà cung cấp đã xóa. Các lượt chạy bị hủy sẽ phát ra các sự kiện hủy/vòng đời thông thường với `stopReason: "auth-revoked"`, để các máy khách được kết nối có thể hiển thị rằng lượt chạy đã dừng do thông tin xác thực bị xóa.

## Kiểm soát thông tin xác thực được sử dụng

### OpenAI và mã định danh `openai-codex` cũ

Cả hồ sơ khóa API OpenAI và hồ sơ OAuth ChatGPT/Codex đều sử dụng mã định danh nhà cung cấp chuẩn `openai`. Hãy sử dụng mã định danh hồ sơ `openai:*` và `auth.order.openai` cho cấu hình mới.

Nếu bạn thấy `openai-codex` trong cấu hình cũ, mã định danh hồ sơ xác thực hoặc `auth.order.openai-codex`, hãy coi đó là dữ liệu đầu vào cho quá trình di chuyển cũ — không tạo hồ sơ `openai-codex` mới. Chạy:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor ghi lại các mã định danh hồ sơ `openai-codex:*` cũ và các mục `auth.order.openai-codex` thành tuyến `openai` chuẩn. Để biết cách định tuyến mô hình/thời gian chạy riêng cho OpenAI, hãy xem [OpenAI](/vi/providers/openai).

### Trong khi đăng nhập (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` giữ nhiều thông tin đăng nhập OAuth cho cùng một nhà cung cấp tách biệt trong một tác nhân.

`--force` xóa các hồ sơ xác thực đã lưu của nhà cung cấp đó trong thư mục tác nhân được chọn, rồi chạy lại cùng một luồng xác thực. Hãy sử dụng tùy chọn này khi hồ sơ đã lưu bị kẹt, hết hạn hoặc gắn với sai tài khoản. Tùy chọn này không thu hồi thông tin xác thực tại nhà cung cấp.

```bash
openclaw models auth login --provider anthropic --force
```

### Theo từng phiên (lệnh trò chuyện)

- `/model <alias-or-id>@<profileId>` cố định một thông tin xác thực cụ thể của nhà cung cấp cho phiên hiện tại (ví dụ về mã định danh hồ sơ: `anthropic:default`, `anthropic:work`).
- `/model` (hoặc `/model list`) hiển thị bộ chọn thu gọn; `/model status` hiển thị chế độ xem đầy đủ (các ứng viên + hồ sơ xác thực tiếp theo, cùng chi tiết điểm cuối của nhà cung cấp khi đã cấu hình).

Nếu bạn thay đổi thứ tự xác thực hoặc việc cố định hồ sơ cho một cuộc trò chuyện đang chạy, hãy gửi `/new` hoặc `/reset` để bắt đầu phiên mới — các phiên hiện có giữ nguyên lựa chọn mô hình/hồ sơ hiện tại cho đến khi được đặt lại.

### Theo từng tác nhân (ghi đè bằng CLI)

Các ghi đè thứ tự xác thực được lưu trong trạng thái xác thực SQLite của tác nhân đó:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Sử dụng `--agent <id>` để nhắm đến một tác nhân cụ thể; bỏ qua tùy chọn này để sử dụng tác nhân mặc định đã cấu hình. `openclaw models status --probe` hiển thị các hồ sơ đã lưu nhưng bị bỏ qua dưới dạng `excluded_by_auth_order` thay vì âm thầm bỏ qua chúng.

## Khắc phục sự cố

### "Không tìm thấy thông tin xác thực"

Cấu hình khóa API Anthropic trên **máy chủ Gateway**, hoặc thiết lập phương thức setup-token của Anthropic, rồi kiểm tra lại:

```bash
openclaw models status
```

### Token sắp hết hạn/đã hết hạn

Chạy `openclaw models status` để xem hồ sơ nào sắp hết hạn. Nếu hồ sơ token Anthropic bị thiếu hoặc đã hết hạn, hãy làm mới hồ sơ đó qua setup-token hoặc chuyển sang khóa API Anthropic.

## Nội dung liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Truy cập từ xa](/vi/gateway/remote)
- [Lưu trữ thông tin xác thực](/vi/concepts/oauth)
