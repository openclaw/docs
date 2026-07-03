---
read_when:
    - Đăng nhập vào ClawHub
    - Sử dụng CLI ClawHub
    - Gỡ lỗi 401s
summary: Đăng nhập ClawHub, token API, đăng nhập CLI, lưu trữ token và thu hồi.
x-i18n:
    generated_at: "2026-07-03T17:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Xác thực

ClawHub dùng GitHub để đăng nhập trên web. CLI dùng mã thông báo API ClawHub được tạo
thông qua tài khoản đã đăng nhập đó.

## Đăng nhập trên web

Dùng GitHub để đăng nhập tại [clawhub.ai](https://clawhub.ai).

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể hoàn tất đăng nhập ClawHub thông thường.
Nếu đăng nhập đưa bạn trở lại trạng thái đã đăng xuất, tài khoản của bạn có thể không ở trạng thái tốt.
Nếu tài khoản của bạn đã bị cấm hoặc bị vô hiệu hóa, hãy dùng
[biểu mẫu khiếu nại ClawHub](https://appeals.openclaw.ai/) nếu bạn tin rằng đây là
một nhầm lẫn.

## Đăng nhập CLI

Luồng đăng nhập CLI mặc định sẽ mở trình duyệt của bạn:

```bash
clawhub login
clawhub whoami
```

Điều xảy ra:

1. CLI khởi động một máy chủ callback tạm thời trên `127.0.0.1`.
2. Trình duyệt của bạn mở trang đăng nhập ClawHub.
3. Sau khi đăng nhập GitHub, ClawHub tạo một mã thông báo API.
4. Trình duyệt chuyển hướng trở lại callback cục bộ.
5. CLI lưu mã thông báo trong tệp cấu hình ClawHub của bạn.

Nếu trình duyệt của bạn không thể truy cập callback cục bộ do tường lửa, VPN hoặc
quy tắc proxy, hãy dùng luồng mã thông báo không giao diện.

## Đăng nhập không giao diện

Tạo mã thông báo trong giao diện web ClawHub, rồi truyền nó cho CLI:

```bash
clawhub login --token clh_...
```

Dùng luồng này cho máy chủ, tác vụ CI hoặc môi trường chỉ có terminal.

Đối với shell từ xa nơi bạn có thể mở trình duyệt ở nơi khác, hãy chạy:

```bash
clawhub login --device
```

CLI in một mã dùng một lần và chờ trong khi bạn ủy quyền cho mã đó tại
`https://clawhub.ai/cli/device`.

## Lưu trữ mã thông báo

Đường dẫn cấu hình mặc định:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Ghi đè đường dẫn bằng:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

In mã thông báo đã lưu để thiết lập CI bằng:

```bash
clawhub token
```

## Thu hồi

Bạn có thể thu hồi mã thông báo API trong giao diện web ClawHub.

Mã thông báo bị thu hồi, không hợp lệ hoặc bị thiếu sẽ trả về `401 Unauthorized`. Đăng nhập lại
bằng `clawhub login` hoặc cung cấp mã thông báo mới bằng `clawhub login --token`.

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể tiếp tục dùng mã thông báo API hiện có.
Nếu tài khoản của bạn đã bị cấm hoặc bị vô hiệu hóa, hãy dùng
[biểu mẫu khiếu nại ClawHub](https://appeals.openclaw.ai/) nếu bạn tin rằng đây là
một nhầm lẫn.
