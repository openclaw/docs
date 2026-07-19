---
read_when:
    - Bạn muốn điều chỉnh thông tin xác thực, thiết bị hoặc giá trị mặc định của agent theo cách tương tác
summary: Tài liệu tham khảo CLI cho `openclaw configure` (các lời nhắc cấu hình tương tác)
title: Cấu hình
x-i18n:
    generated_at: "2026-07-19T05:41:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5980d06e75a5df9e5269d0ef78431f730d6f5fd050dca74784ef3426fb0433d8
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Các lời nhắc tương tác để thực hiện thay đổi có mục tiêu đối với một thiết lập hiện có: thông tin xác thực, thiết bị, giá trị mặc định của agent, Gateway, kênh, plugin, Skills và kiểm tra tình trạng.

Sử dụng `openclaw onboard` hoặc `openclaw setup` cho toàn bộ quy trình hướng dẫn trong lần chạy đầu tiên, `openclaw setup --baseline` nếu chỉ cần cấu hình/không gian làm việc cơ sở và `openclaw channels add` nếu chỉ cần thiết lập tài khoản kênh.

<Tip>
`openclaw config` khi không có lệnh con sẽ mở cùng một trình hướng dẫn. Sử dụng `openclaw config get|set|unset` để chỉnh sửa không tương tác.
</Tip>

## Tùy chọn

`--section <section>`: bộ lọc phần có thể lặp lại. Các phần có sẵn:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Việc chọn `gateway`, `daemon` hoặc `health` (hoặc chạy toàn bộ trình hướng dẫn mà không có `--section`) sẽ hỏi vị trí chạy Gateway và cập nhật `gateway.mode`. Các bộ lọc phần bỏ qua cả ba sẽ chuyển thẳng đến thiết lập được yêu cầu mà không hỏi chế độ Gateway. Việc chọn chế độ Gateway từ xa sẽ ghi cấu hình từ xa và thoát ngay lập tức; chế độ này không chạy các bước chỉ dành cho cục bộ như cài đặt plugin.

<Note>
`openclaw configure` yêu cầu một terminal tương tác (cả stdin và stdout đều phải là TTY). Nếu không có, lệnh sẽ in các lệnh `openclaw config get|set|patch|validate` không tương tác tương đương và thoát với lỗi thay vì chỉ chạy một phần.
</Note>

## Phần mô hình

<Note>
**Mô hình** bao gồm lựa chọn nhiều mục cho danh sách `agents.defaults.modelPolicy.allow` rõ ràng (nội dung xuất hiện trong `/model` và bộ chọn mô hình). Các lựa chọn thiết lập theo phạm vi nhà cung cấp sẽ hợp nhất những mô hình đã chọn vào danh sách hiện có thay vì thay thế các nhà cung cấp không liên quan đã có trong cấu hình. Bí danh và tham số theo từng mô hình vẫn nằm trong `agents.defaults.models`; bản thân các mục đó không hạn chế việc ghi đè mô hình.

Việc chạy lại xác thực nhà cung cấp từ configure sẽ giữ nguyên `agents.defaults.model.primary` hiện có, ngay cả khi bước xác thực của nhà cung cấp trả về một bản vá cấu hình có mô hình mặc định được đề xuất riêng. Việc thêm hoặc xác thực lại một nhà cung cấp giúp các mô hình của nhà cung cấp đó khả dụng mà không thay thế mô hình chính hiện tại. Sử dụng `openclaw models auth login --provider <id> --set-default` hoặc `openclaw models set <model>` để chủ động thay đổi mô hình mặc định.
</Note>

Khi configure bắt đầu từ một lựa chọn xác thực nhà cung cấp, các bộ chọn mô hình mặc định và chính sách mô hình sẽ tự động ưu tiên nhà cung cấp đó. Với các nhà cung cấp theo cặp như Volcengine và BytePlus, tùy chọn ưu tiên này cũng khớp với các biến thể gói lập trình của họ (`volcengine-plan/*`, `byteplus-plan/*`). Nếu bộ lọc nhà cung cấp ưu tiên tạo ra danh sách trống, configure sẽ quay về danh mục chưa lọc thay vì hiển thị một bộ chọn trống.

## Phần web

`openclaw configure --section web` chọn một nhà cung cấp tìm kiếm web và cấu hình thông tin xác thực của nhà cung cấp đó. Một số nhà cung cấp hiển thị các bước tiếp theo dành riêng cho nhà cung cấp:

- **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng hồ sơ OAuth xAI hoặc khóa API, đồng thời cho phép chọn một mô hình `x_search`.
- **Kimi** có thể yêu cầu chọn khu vực API Moonshot (`api.moonshot.ai` hoặc `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

## Ghi chú khác

- Sau khi ghi cấu hình cục bộ, configure sẽ cài đặt các plugin có thể tải xuống đã chọn khi lộ trình thiết lập được chọn yêu cầu. Cấu hình Gateway từ xa không cài đặt các gói plugin cục bộ.
- Các dịch vụ hướng đến kênh (Slack/Discord/Matrix/Microsoft Teams) sẽ yêu cầu danh sách cho phép của kênh/phòng trong quá trình thiết lập. Có thể nhập tên hoặc ID; trình hướng dẫn sẽ phân giải tên thành ID khi có thể.
- Nếu chạy bước cài đặt daemon, xác thực bằng token yêu cầu phải có token. Nếu `gateway.auth.token` được SecretRef quản lý, configure sẽ xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ của trình giám sát; nếu SecretRef chưa được phân giải, configure sẽ chặn quá trình cài đặt daemon và cung cấp hướng dẫn khắc phục có thể thực hiện.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, configure sẽ chặn quá trình cài đặt daemon cho đến khi chế độ được đặt rõ ràng.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
- CLI cấu hình: [Cấu hình](/vi/cli/config)
