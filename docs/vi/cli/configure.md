---
read_when:
    - Bạn muốn điều chỉnh thông tin xác thực, thiết bị hoặc các giá trị mặc định của tác nhân theo cách tương tác
summary: Tài liệu tham khảo CLI cho `openclaw configure` (các lời nhắc cấu hình tương tác)
title: Cấu hình
x-i18n:
    generated_at: "2026-07-12T07:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Các lời nhắc tương tác để thực hiện những thay đổi có mục tiêu đối với một thiết lập hiện có: thông tin xác thực, thiết bị, giá trị mặc định của tác nhân, Gateway, kênh, plugin, Skills và kiểm tra tình trạng.

Dùng `openclaw onboard` hoặc `openclaw setup` cho toàn bộ quy trình chạy lần đầu có hướng dẫn, `openclaw setup --baseline` để chỉ thiết lập cấu hình/không gian làm việc cơ sở và `openclaw channels add` khi bạn chỉ cần thiết lập tài khoản kênh.

<Tip>
`openclaw config` không có lệnh con sẽ mở cùng trình hướng dẫn. Dùng `openclaw config get|set|unset` để chỉnh sửa không tương tác.
</Tip>

## Tùy chọn

`--section <section>`: bộ lọc mục có thể lặp lại. Các mục khả dụng:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Việc chọn `gateway`, `daemon` hoặc `health` (hoặc chạy toàn bộ trình hướng dẫn mà không có `--section`) sẽ hỏi Gateway chạy ở đâu và cập nhật `gateway.mode`. Các bộ lọc mục bỏ qua cả ba mục này sẽ chuyển thẳng đến phần thiết lập được yêu cầu mà không hỏi về chế độ Gateway. Việc chọn chế độ Gateway từ xa sẽ ghi cấu hình từ xa và thoát ngay lập tức; thao tác này không chạy các bước chỉ dành cho máy cục bộ như cài đặt plugin.

<Note>
`openclaw configure` yêu cầu một terminal tương tác (cả stdin và stdout đều phải là TTY). Nếu không có, lệnh sẽ in ra các lệnh không tương tác tương đương `openclaw config get|set|patch|validate` rồi thoát với lỗi thay vì chỉ chạy một phần.
</Note>

## Mục mô hình

<Note>
**Mô hình** bao gồm bộ chọn nhiều mục cho danh sách cho phép `agents.defaults.models` (những gì xuất hiện trong `/model` và bộ chọn mô hình). Các lựa chọn thiết lập theo từng nhà cung cấp sẽ hợp nhất những mô hình đã chọn vào danh sách cho phép hiện có thay vì thay thế các nhà cung cấp không liên quan đã có trong cấu hình.

Việc chạy lại quy trình xác thực nhà cung cấp từ configure sẽ giữ nguyên `agents.defaults.model.primary` hiện có, ngay cả khi bước xác thực của nhà cung cấp trả về một bản vá cấu hình có mô hình mặc định được đề xuất riêng. Việc thêm hoặc xác thực lại một nhà cung cấp sẽ làm cho các mô hình của nhà cung cấp đó khả dụng mà không thay thế mô hình chính hiện tại của bạn. Dùng `openclaw models auth login --provider <id> --set-default` hoặc `openclaw models set <model>` để chủ động thay đổi mô hình mặc định.
</Note>

Khi configure bắt đầu từ một lựa chọn xác thực nhà cung cấp, bộ chọn mô hình mặc định và danh sách cho phép sẽ tự động ưu tiên nhà cung cấp đó. Đối với các nhà cung cấp theo cặp như Volcengine và BytePlus, ưu tiên này cũng khớp với các biến thể gói lập trình của họ (`volcengine-plan/*`, `byteplus-plan/*`). Nếu bộ lọc nhà cung cấp ưu tiên tạo ra danh sách trống, configure sẽ quay lại danh mục chưa lọc thay vì hiển thị bộ chọn trống.

## Mục web

`openclaw configure --section web` chọn một nhà cung cấp tìm kiếm web và cấu hình thông tin xác thực của nhà cung cấp đó. Một số nhà cung cấp hiển thị các bước tiếp theo dành riêng cho nhà cung cấp:

- **Grok** có thể cung cấp phần thiết lập `x_search` tùy chọn bằng cùng hồ sơ OAuth xAI hoặc khóa API, đồng thời cho phép bạn chọn một mô hình `x_search`.
- **Kimi** có thể hỏi về khu vực API Moonshot (`api.moonshot.ai` hoặc `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

## Ghi chú khác

- Sau khi ghi cấu hình cục bộ, configure sẽ cài đặt các plugin có thể tải xuống đã chọn khi quy trình thiết lập được chọn yêu cầu. Cấu hình Gateway từ xa không cài đặt các gói plugin cục bộ.
- Các dịch vụ hướng đến kênh (Slack/Discord/Matrix/Microsoft Teams) sẽ hỏi về danh sách cho phép của kênh/phòng trong quá trình thiết lập. Bạn có thể nhập tên hoặc ID; trình hướng dẫn sẽ phân giải tên thành ID khi có thể.
- Nếu bạn chạy bước cài đặt daemon, xác thực bằng token yêu cầu một token. Nếu `gateway.auth.token` được SecretRef quản lý, configure sẽ xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường của dịch vụ giám sát; nếu không thể phân giải SecretRef, configure sẽ chặn việc cài đặt daemon và cung cấp hướng dẫn khắc phục có thể thực hiện được.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, configure sẽ chặn việc cài đặt daemon cho đến khi bạn đặt chế độ một cách rõ ràng.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
- CLI cấu hình: [Cấu hình](/vi/cli/config)
