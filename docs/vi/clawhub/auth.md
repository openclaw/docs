---
read_when:
    - Đăng nhập vào ClawHub
    - Sử dụng CLI ClawHub
    - Gỡ lỗi lỗi 401
summary: Đăng nhập ClawHub, mã thông báo API, đăng nhập CLI, lưu trữ mã thông báo và thu hồi.
x-i18n:
    generated_at: "2026-07-05T07:02:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Xác thực

ClawHub sử dụng GitHub để đăng nhập web. CLI sử dụng token API ClawHub được tạo
thông qua tài khoản đã đăng nhập đó.

## Đăng nhập web

Sử dụng GitHub để đăng nhập tại [clawhub.ai](https://clawhub.ai).

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể hoàn tất đăng nhập ClawHub bình thường.
Nếu đăng nhập đưa bạn trở lại trạng thái đã đăng xuất, tài khoản của bạn có thể không ở trạng thái
tốt. Nếu tài khoản của bạn đã bị cấm hoặc bị vô hiệu hóa, hãy sử dụng
[biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây là
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
3. Sau khi đăng nhập GitHub, ClawHub tạo một token API.
4. Trình duyệt chuyển hướng trở lại callback cục bộ.
5. CLI lưu token trong tệp cấu hình ClawHub của bạn.

Nếu trình duyệt của bạn không thể truy cập callback cục bộ vì tường lửa, VPN hoặc
quy tắc proxy, hãy dùng luồng token headless.

## Đăng nhập headless

Tạo một token trong giao diện web ClawHub, rồi truyền token đó cho CLI:

```bash
clawhub login --token clh_...
```

Sử dụng luồng này cho máy chủ, tác vụ CI hoặc môi trường chỉ có terminal.

Đối với shell từ xa nơi bạn có thể mở trình duyệt ở nơi khác, hãy chạy:

```bash
clawhub login --device
```

CLI in một mã dùng một lần và chờ trong khi bạn ủy quyền mã đó tại
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

Token đã bị thu hồi, không hợp lệ hoặc bị thiếu sẽ trả về `401 Unauthorized`. Đăng nhập lại
bằng `clawhub login` hoặc cung cấp token mới bằng `clawhub login --token`.

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể tiếp tục sử dụng token API hiện có.
Nếu tài khoản của bạn đã bị cấm hoặc bị vô hiệu hóa, hãy sử dụng
[biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây là
một nhầm lẫn.
