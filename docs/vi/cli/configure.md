---
read_when:
    - Bạn muốn điều chỉnh thông tin xác thực, thiết bị hoặc mặc định của agent theo cách tương tác
summary: Tham chiếu CLI cho `openclaw configure` (lời nhắc cấu hình tương tác)
title: Cấu hình
x-i18n:
    generated_at: "2026-06-27T17:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Lời nhắc tương tác để thực hiện các thay đổi có mục tiêu cho một thiết lập hiện có: thông tin xác thực, thiết bị, mặc định của agent, gateway, kênh, plugin, skills và kiểm tra tình trạng.

Dùng `openclaw onboard` cho hành trình chạy lần đầu có hướng dẫn đầy đủ, `openclaw setup` chỉ cho cấu hình/không gian làm việc nền tảng, và `openclaw channels add` khi bạn chỉ cần thiết lập tài khoản kênh.

<Note>
Phần **Mô hình** bao gồm lựa chọn nhiều mục cho danh sách cho phép `agents.defaults.models` (những gì xuất hiện trong `/model` và bộ chọn mô hình). Các lựa chọn thiết lập theo phạm vi nhà cung cấp sẽ hợp nhất các mô hình đã chọn vào danh sách cho phép hiện có thay vì thay thế các nhà cung cấp không liên quan đã có trong cấu hình.

Chạy lại xác thực nhà cung cấp từ configure sẽ giữ nguyên `agents.defaults.model.primary` hiện có, ngay cả khi bước xác thực của nhà cung cấp trả về một bản vá cấu hình có mô hình mặc định được khuyến nghị riêng. Điều đó có nghĩa là việc thêm hoặc xác thực lại xAI, OpenRouter, hoặc nhà cung cấp khác sẽ làm cho mô hình mới khả dụng mà không chiếm quyền từ mô hình chính hiện tại của bạn. Dùng `openclaw models auth login --provider <id> --set-default` hoặc `openclaw models set <model>` khi bạn chủ ý muốn thay đổi mô hình mặc định.
</Note>

Khi configure bắt đầu từ một lựa chọn xác thực nhà cung cấp, các bộ chọn mô hình mặc định và danh sách cho phép sẽ tự động ưu tiên nhà cung cấp đó. Đối với các nhà cung cấp ghép cặp như Volcengine và BytePlus, cùng tùy chọn ưu tiên đó cũng khớp với các biến thể kế hoạch lập trình của họ (`volcengine-plan/*`, `byteplus-plan/*`). Nếu bộ lọc nhà cung cấp ưu tiên tạo ra danh sách rỗng, configure sẽ quay về danh mục chưa lọc thay vì hiển thị bộ chọn trống.

<Tip>
`openclaw config` không có lệnh con sẽ mở cùng trình hướng dẫn. Dùng `openclaw config get|set|unset` để chỉnh sửa không tương tác.
</Tip>

Đối với tìm kiếm web, `openclaw configure --section web` cho phép bạn chọn một nhà cung cấp
và cấu hình thông tin xác thực của nhà cung cấp đó. Một số nhà cung cấp cũng hiển thị các lời nhắc tiếp theo
riêng theo nhà cung cấp:

- **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng hồ sơ OAuth xAI
  hoặc khóa API và cho phép bạn chọn một mô hình `x_search`.
- **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với
  `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

Liên quan:

- Tham chiếu cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)
- CLI cấu hình: [Cấu hình](/vi/cli/config)

## Tùy chọn

- `--section <section>`: bộ lọc phần có thể lặp lại

Các phần khả dụng:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Ghi chú:

- Trình hướng dẫn đầy đủ và các phần liên quan đến gateway sẽ hỏi Gateway chạy ở đâu và cập nhật `gateway.mode`. Các bộ lọc phần không bao gồm `gateway`, `daemon`, hoặc `health` sẽ đi thẳng đến thiết lập được yêu cầu.
- Sau khi ghi cấu hình cục bộ, configure sẽ cài đặt các plugin có thể tải xuống đã chọn khi đường dẫn thiết lập được chọn yêu cầu chúng. Cấu hình gateway từ xa không cài đặt các gói plugin cục bộ.
- Các dịch vụ hướng kênh (Slack/Discord/Matrix/Microsoft Teams) nhắc nhập danh sách cho phép kênh/phòng trong quá trình thiết lập. Bạn có thể nhập tên hoặc ID; trình hướng dẫn sẽ phân giải tên thành ID khi có thể.
- Nếu bạn chạy bước cài đặt daemon, xác thực bằng token yêu cầu một token, và `gateway.auth.token` do SecretRef quản lý, configure sẽ xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
- Nếu xác thực bằng token yêu cầu một token và SecretRef token đã cấu hình chưa được phân giải, configure sẽ chặn cài đặt daemon với hướng dẫn khắc phục có thể thực hiện.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, configure sẽ chặn cài đặt daemon cho đến khi mode được đặt rõ ràng.

## Ví dụ

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
