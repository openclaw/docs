---
read_when:
    - Bạn đang tích hợp phương thức truyền tải QA mô phỏng vào một lượt chạy kiểm thử cục bộ hoặc trên CI
    - Bạn cần bề mặt cấu hình qa-channel đi kèm
    - Bạn đang cải tiến quy trình tự động hóa QA đầu cuối.
summary: Plugin kênh mô phỏng tương đương Slack dành cho các kịch bản QA OpenClaw có tính xác định
title: Kênh QA
x-i18n:
    generated_at: "2026-07-12T07:40:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` là một phương thức truyền tải tin nhắn tổng hợp nội bộ trong kho mã dành cho hoạt động QA tự động của OpenClaw (`extensions/qa-channel`, gói riêng tư, không được đưa vào các bản cài đặt đóng gói). Đây không phải là một kênh dùng trong môi trường sản xuất — nó tồn tại để kiểm thử cùng ranh giới Plugin kênh mà các phương thức truyền tải thực sử dụng, đồng thời giữ trạng thái có tính xác định và có thể kiểm tra đầy đủ.

## Chức năng

- Ngữ pháp đích tương đương Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Các cuộc trò chuyện dùng chung `channel:` và `group:` được hiển thị cho tác nhân dưới dạng lượt tương tác trong phòng nhóm/kênh, nhờ đó chúng kiểm thử cùng chính sách định tuyến phản hồi hiển thị và công cụ tin nhắn được Discord, Slack, Telegram cùng các phương thức truyền tải tương tự sử dụng.
- Bus tổng hợp dựa trên HTTP để chèn tin nhắn đến, ghi lại bản chép nội dung gửi đi, tạo luồng, bày tỏ cảm xúc, chỉnh sửa, xóa và thực hiện các thao tác tìm kiếm/đọc.
- Trình chạy tự kiểm tra phía máy chủ ghi báo cáo Markdown vào `.artifacts/qa-e2e/`.

## Cấu hình

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Các khóa tài khoản:

- `enabled` — công tắc chính cho tài khoản này.
- `name` — nhãn hiển thị tùy chọn.
- `baseUrl` — URL của bus tổng hợp. Tài khoản được xem là đã cấu hình sau khi khóa này được đặt.
- `botUserId` — mã định danh người dùng của bot tổng hợp được dùng trong ngữ pháp đích (mặc định: `openclaw`).
- `botDisplayName` — tên hiển thị cho tin nhắn gửi đi (mặc định: `OpenClaw QA`).
- `pollTimeoutMs` — khoảng thời gian chờ thăm dò dài. Số nguyên từ 100 đến 30000 (mặc định: 1000).
- `allowFrom` — danh sách cho phép người gửi (mã định danh người dùng hoặc `"*"`; mặc định: `["*"]`). Tin nhắn trực tiếp
  luôn dùng chính sách `open`; chính sách nhóm theo danh sách cho phép cũng sử dụng các mã định danh
  người gửi tổng hợp này.
- `groupPolicy` — chính sách phòng dùng chung: `"open"` (mặc định), `"allowlist"` hoặc
  `"disabled"`.
- `groupAllowFrom` — danh sách cho phép người gửi trong phòng dùng chung, không bắt buộc. Khi bị lược bỏ với
  `"allowlist"`, QA Channel sẽ dùng `allowFrom` làm phương án dự phòng.
- `groups.<room>.requireMention` — yêu cầu đề cập đến bot trước khi phản hồi trong một
  phòng nhóm/kênh cụ thể (mặc định: false). `groups."*"` đặt giá trị mặc định;
  `tools` / `toolsBySender` theo từng phòng đặt các giá trị ghi đè cho chính sách công cụ.
- `defaultTo` — đích dự phòng khi không có đích nào được cung cấp.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kiểm soát quyền sử dụng công cụ theo từng thao tác.

Các khóa đa tài khoản ở cấp cao nhất:

- `accounts` — bản ghi các giá trị ghi đè theo từng tài khoản có tên, được lập khóa bằng mã định danh tài khoản.
- `defaultAccount` — mã định danh tài khoản ưu tiên khi có nhiều tài khoản được cấu hình.

## Trình chạy

Tự kiểm tra phía máy chủ (ghi báo cáo Markdown trong `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Lệnh này định tuyến qua `qa-lab`, khởi động bus QA trong kho mã, khởi chạy phần runtime `qa-channel` và thực hiện một lượt tự kiểm tra có tính xác định.

Bộ kịch bản đầy đủ dựa trên kho mã:

```bash
pnpm openclaw qa suite
```

Chạy song song các kịch bản trên làn Gateway QA. Xem [Tổng quan về QA](/vi/concepts/qa-e2e-automation) để biết các kịch bản, hồ sơ và chế độ nhà cung cấp.

Trang QA dựa trên Docker (Gateway + giao diện trình gỡ lỗi QA Lab trong cùng một ngăn xếp):

```bash
pnpm qa:lab:up
```

Xây dựng trang QA, khởi động ngăn xếp Gateway + QA Lab dựa trên Docker và in URL của QA Lab. Từ đó, bạn có thể chọn kịch bản, chọn làn mô hình, khởi chạy từng lượt chạy riêng lẻ và theo dõi kết quả trực tiếp. Trình gỡ lỗi QA Lab tách biệt với gói Control UI được phát hành.

## Liên quan

- [Tổng quan về QA](/vi/concepts/qa-e2e-automation) — toàn bộ ngăn xếp, bộ điều hợp phương thức truyền tải, cách biên soạn kịch bản
- [QA ma trận](/vi/concepts/qa-matrix) — ví dụ về trình chạy phương thức truyền tải trực tiếp điều khiển một kênh thực
- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Tổng quan về các kênh](/vi/channels)
