---
read_when:
    - Bạn muốn điều chỉnh thông tin xác thực, thiết bị hoặc thiết lập mặc định của tác nhân theo cách tương tác
summary: Tham chiếu CLI cho `openclaw configure` (lời nhắc cấu hình tương tác)
title: Cấu hình
x-i18n:
    generated_at: "2026-05-02T10:35:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Lời nhắc tương tác để thiết lập thông tin xác thực, thiết bị và mặc định của agent.

<Note>
Phần **Model** bao gồm lựa chọn nhiều mục cho danh sách cho phép `agents.defaults.models` (những gì hiển thị trong `/model` và bộ chọn model). Các lựa chọn thiết lập theo phạm vi nhà cung cấp sẽ hợp nhất các model đã chọn vào danh sách cho phép hiện có, thay vì thay thế các nhà cung cấp không liên quan đã có trong cấu hình.

Chạy lại xác thực nhà cung cấp từ configure sẽ giữ nguyên `agents.defaults.model.primary` hiện có, ngay cả khi bước xác thực của nhà cung cấp trả về một bản vá cấu hình có model mặc định được khuyến nghị riêng. Điều đó có nghĩa là việc thêm hoặc xác thực lại xAI, OpenRouter hoặc nhà cung cấp khác sẽ làm cho model mới có sẵn mà không chiếm quyền từ model chính hiện tại của bạn. Dùng `openclaw models auth login --provider <id> --set-default` hoặc `openclaw models set <model>` khi bạn chủ ý muốn thay đổi model mặc định.
</Note>

Khi configure bắt đầu từ một lựa chọn xác thực nhà cung cấp, các bộ chọn model mặc định và danh sách cho phép sẽ tự động ưu tiên nhà cung cấp đó. Với các nhà cung cấp theo cặp như Volcengine và BytePlus, cùng ưu tiên đó cũng khớp với các biến thể gói lập trình của họ (`volcengine-plan/*`, `byteplus-plan/*`). Nếu bộ lọc nhà cung cấp ưu tiên tạo ra danh sách rỗng, configure sẽ quay về catalog chưa lọc thay vì hiển thị một bộ chọn trống.

<Tip>
`openclaw config` không có lệnh con sẽ mở cùng trình hướng dẫn. Dùng `openclaw config get|set|unset` để chỉnh sửa không tương tác.
</Tip>

Đối với tìm kiếm web, `openclaw configure --section web` cho phép bạn chọn một nhà cung cấp
và cấu hình thông tin xác thực của họ. Một số nhà cung cấp cũng hiển thị các lời nhắc tiếp theo
riêng cho nhà cung cấp:

- **Grok** có thể đề xuất thiết lập `x_search` tùy chọn với cùng `XAI_API_KEY` và
  cho phép bạn chọn một model `x_search`.
- **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với
  `api.moonshot.cn`) và model tìm kiếm web Kimi mặc định.

Liên quan:

- Tham chiếu cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)
- CLI cấu hình: [Cấu hình](/vi/cli/config)

## Tùy chọn

- `--section <section>`: bộ lọc phần có thể lặp lại

Các phần có sẵn:

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

- Việc chọn nơi Gateway chạy luôn cập nhật `gateway.mode`. Bạn có thể chọn "Tiếp tục" mà không cần các phần khác nếu đó là tất cả những gì bạn cần.
- Sau khi ghi cấu hình cục bộ, configure sẽ cài đặt các Plugin có thể tải xuống đã chọn khi đường dẫn thiết lập đã chọn yêu cầu chúng. Cấu hình gateway từ xa không cài đặt các gói Plugin cục bộ.
- Các dịch vụ hướng kênh (Slack/Discord/Matrix/Microsoft Teams) nhắc nhập danh sách cho phép kênh/phòng trong quá trình thiết lập. Bạn có thể nhập tên hoặc ID; trình hướng dẫn sẽ phân giải tên thành ID khi có thể.
- Nếu bạn chạy bước cài đặt daemon, xác thực token yêu cầu một token, và `gateway.auth.token` do SecretRef quản lý, configure sẽ xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
- Nếu xác thực token yêu cầu một token và SecretRef token đã cấu hình chưa được phân giải, configure sẽ chặn cài đặt daemon kèm hướng dẫn khắc phục có thể thực hiện.
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
