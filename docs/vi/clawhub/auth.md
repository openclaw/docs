---
read_when:
    - Đăng nhập vào ClawHub
    - Sử dụng CLI ClawHub
    - Gỡ lỗi 401
summary: Đăng nhập ClawHub, token API, đăng nhập CLI, lưu trữ token và thu hồi token.
x-i18n:
    generated_at: "2026-07-12T07:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Xác thực

ClawHub sử dụng GitHub để đăng nhập trên web. CLI sử dụng các mã thông báo API ClawHub được tạo thông qua tài khoản đã đăng nhập đó.

## Đăng nhập trên web

Sử dụng GitHub để đăng nhập tại [clawhub.ai](https://clawhub.ai).

Các tài khoản đã bị xóa, cấm hoặc vô hiệu hóa không thể hoàn tất quy trình đăng nhập ClawHub thông thường. Nếu sau khi đăng nhập bạn lại trở về trạng thái đã đăng xuất, tài khoản của bạn có thể không ở trạng thái hợp lệ. Nếu tài khoản của bạn đã bị cấm hoặc vô hiệu hóa và bạn cho rằng đây là nhầm lẫn, hãy sử dụng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/).

## Đăng nhập bằng CLI

Quy trình đăng nhập CLI mặc định sẽ mở trình duyệt của bạn:

```bash
clawhub login
clawhub whoami
```

Quy trình diễn ra như sau:

1. CLI khởi động một máy chủ gọi lại tạm thời trên `127.0.0.1`.
2. Trình duyệt của bạn mở trang đăng nhập ClawHub.
3. Sau khi đăng nhập bằng GitHub, ClawHub tạo một mã thông báo API.
4. Trình duyệt chuyển hướng trở lại địa chỉ gọi lại cục bộ.
5. CLI lưu mã thông báo vào tệp cấu hình ClawHub của bạn.

Nếu trình duyệt không thể truy cập địa chỉ gọi lại cục bộ do các quy tắc của tường lửa, VPN hoặc proxy, hãy sử dụng quy trình mã thông báo không giao diện.

## Đăng nhập không giao diện

Tạo một mã thông báo trong giao diện web ClawHub, sau đó truyền mã đó cho CLI:

```bash
clawhub login --token clh_...
```

Sử dụng quy trình này cho máy chủ, tác vụ CI hoặc môi trường chỉ có thiết bị đầu cuối.

Đối với shell từ xa mà bạn có thể mở trình duyệt ở nơi khác, hãy chạy:

```bash
clawhub login --device
```

CLI in một mã dùng một lần và chờ trong khi bạn cấp quyền cho mã đó tại `https://clawhub.ai/cli/device`.

## Lưu trữ mã thông báo

Các đường dẫn cấu hình mặc định:

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

Mã thông báo đã bị thu hồi, không hợp lệ hoặc bị thiếu sẽ trả về `401 Unauthorized`. Hãy đăng nhập lại bằng `clawhub login` hoặc cung cấp mã thông báo mới bằng `clawhub login --token`.

Các tài khoản đã bị xóa, cấm hoặc vô hiệu hóa không thể tiếp tục sử dụng mã thông báo API hiện có. Nếu tài khoản của bạn đã bị cấm hoặc vô hiệu hóa và bạn cho rằng đây là nhầm lẫn, hãy sử dụng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/).
