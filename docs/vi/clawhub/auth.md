---
read_when:
    - Đăng nhập vào ClawHub
    - Sử dụng ClawHub CLI
    - Gỡ lỗi lỗi 401
summary: Đăng nhập ClawHub, token API, đăng nhập CLI, lưu trữ token và thu hồi.
x-i18n:
    generated_at: "2026-07-03T09:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Xác thực

ClawHub dùng GitHub để đăng nhập web. CLI dùng token API ClawHub được tạo
thông qua tài khoản đã đăng nhập đó.

## Đăng nhập web

Dùng GitHub để đăng nhập tại [clawhub.ai](https://clawhub.ai).

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể hoàn tất đăng nhập
ClawHub thông thường. Nếu quá trình đăng nhập đưa bạn trở lại trạng thái chưa
đăng nhập, tài khoản của bạn có thể không còn ở trạng thái tốt. Nếu tài khoản
của bạn bị cấm hoặc bị vô hiệu hóa, hãy dùng
[biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây
là nhầm lẫn.

## Đăng nhập CLI

Luồng đăng nhập CLI mặc định sẽ mở trình duyệt của bạn:

```bash
clawhub login
clawhub whoami
```

Điều xảy ra:

1. CLI khởi động một máy chủ callback tạm thời trên `127.0.0.1`.
2. Trình duyệt của bạn mở trang đăng nhập ClawHub.
3. Sau khi đăng nhập GitHub, ClawHub tạo một token API.
4. Trình duyệt chuyển hướng trở lại callback cục bộ.
5. CLI lưu token vào tệp cấu hình ClawHub của bạn.

Nếu trình duyệt của bạn không thể truy cập callback cục bộ do quy tắc tường lửa,
VPN hoặc proxy, hãy dùng luồng token không giao diện.

## Đăng nhập không giao diện

Tạo một token trong giao diện web ClawHub, rồi truyền nó cho CLI:

```bash
clawhub login --token clh_...
```

Dùng luồng này cho máy chủ, tác vụ CI hoặc môi trường chỉ có terminal.

Với shell từ xa nơi bạn có thể mở trình duyệt ở nơi khác, hãy chạy:

```bash
clawhub login --device
```

CLI in ra một mã dùng một lần và chờ trong khi bạn cấp quyền tại
`https://clawhub.ai/cli/device`.

## Lưu trữ token

Đường dẫn cấu hình mặc định:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Ghi đè đường dẫn bằng:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

In token đã lưu để thiết lập CI bằng:

```bash
clawhub token
```

## Thu hồi

Bạn có thể thu hồi token API trong giao diện web ClawHub.

Token đã bị thu hồi, không hợp lệ hoặc bị thiếu sẽ trả về `401 Unauthorized`.
Đăng nhập lại bằng `clawhub login` hoặc cung cấp token mới bằng
`clawhub login --token`.

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể tiếp tục sử dụng
token API hiện có. Nếu tài khoản của bạn bị cấm hoặc bị vô hiệu hóa, hãy dùng
[biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây
là nhầm lẫn.
