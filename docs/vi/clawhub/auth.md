---
read_when:
    - Đăng nhập vào ClawHub
    - Sử dụng CLI ClawHub
    - Gỡ lỗi 401
summary: Đăng nhập ClawHub, token API, đăng nhập CLI, lưu trữ và thu hồi token.
x-i18n:
    generated_at: "2026-07-19T05:44:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Xác thực

ClawHub sử dụng GitHub để đăng nhập trên web. CLI sử dụng các token API ClawHub được tạo
thông qua tài khoản đã đăng nhập đó.

## Đăng nhập trên web

Sử dụng GitHub để đăng nhập tại [clawhub.ai](https://clawhub.ai).

Các tài khoản đã bị xóa, cấm hoặc vô hiệu hóa không thể hoàn tất quy trình đăng nhập ClawHub thông thường.
Nếu sau khi đăng nhập bạn trở lại trạng thái chưa đăng nhập, tài khoản của bạn có thể không ở
trạng thái hợp lệ. Nếu tài khoản của bạn bị cấm hoặc vô hiệu hóa, hãy sử dụng
[biểu mẫu khiếu nại ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây là
nhầm lẫn.

## Đăng nhập CLI

Luồng đăng nhập CLI mặc định sẽ mở trình duyệt:

```bash
clawhub login
clawhub whoami
```

Quy trình diễn ra như sau:

1. CLI khởi động một máy chủ callback tạm thời tại `127.0.0.1`.
2. Trình duyệt của bạn mở trang đăng nhập ClawHub.
3. Sau khi đăng nhập bằng GitHub, ClawHub tạo một token API.
4. Trình duyệt chuyển hướng trở lại callback cục bộ.
5. CLI lưu token vào tệp cấu hình ClawHub của bạn.

Nếu trình duyệt không thể truy cập callback cục bộ do các quy tắc tường lửa, VPN hoặc
proxy, hãy sử dụng luồng token không giao diện.

## Đăng nhập không giao diện

Tạo một token trong giao diện web ClawHub, sau đó truyền token đó cho CLI:

```bash
clawhub login --token clh_...
```

Sử dụng luồng này cho máy chủ, tác vụ CI hoặc môi trường chỉ có terminal.

Đối với shell từ xa mà bạn có thể mở trình duyệt ở nơi khác, hãy chạy:

```bash
clawhub login --device
```

CLI in ra một mã dùng một lần và chờ trong khi bạn cấp quyền cho mã đó tại
`https://clawhub.ai/cli/device`.

## Lưu trữ token

Các đường dẫn cấu hình mặc định:

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

Bạn có thể thu hồi các token API trong giao diện web ClawHub.

Token đã bị thu hồi, không hợp lệ hoặc bị thiếu sẽ trả về `401 Unauthorized`. Hãy đăng nhập lại
bằng `clawhub login` hoặc cung cấp token mới bằng `clawhub login --token`.

Các tài khoản đã bị xóa, cấm hoặc vô hiệu hóa không thể tiếp tục sử dụng các token API hiện có.
Nếu tài khoản của bạn bị cấm hoặc vô hiệu hóa, hãy sử dụng
[biểu mẫu khiếu nại ClawHub](https://appeals.openclaw.ai/) nếu bạn cho rằng đây là
nhầm lẫn.
