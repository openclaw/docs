---
read_when:
    - Bạn đang tích hợp transport QA tổng hợp vào một lần chạy kiểm thử cục bộ hoặc CI
    - Bạn cần giao diện cấu hình qa-channel đi kèm
    - Bạn đang cải tiến quy trình tự động hóa QA đầu cuối
summary: Plugin kênh giả lập thuộc lớp Slack cho các kịch bản đảm bảo chất lượng OpenClaw có tính xác định
title: Kênh QA
x-i18n:
    generated_at: "2026-05-01T10:46:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` là một phương thức truyền thông điệp tổng hợp được tích hợp sẵn cho QA tự động của OpenClaw. Đây không phải là kênh sản xuất — nó tồn tại để kiểm thử cùng ranh giới Plugin kênh mà các phương thức truyền tải thực dùng, đồng thời giữ trạng thái có tính xác định và có thể kiểm tra đầy đủ.

## Chức năng

- Ngữ pháp đích kiểu Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Các cuộc trò chuyện `channel:` và `group:` dùng chung được hiển thị cho agent dưới dạng lượt phòng nhóm/kênh, vì vậy chúng kiểm thử cùng chính sách định tuyến phản hồi hiển thị và công cụ nhắn tin được Discord, Slack, Telegram và các phương thức truyền tải tương tự sử dụng.
- Bus tổng hợp dựa trên HTTP để tiêm thông điệp đầu vào, ghi lại bản ghi đầu ra, tạo luồng, phản ứng, chỉnh sửa, xóa và các hành động tìm kiếm/đọc.
- Trình chạy tự kiểm tra phía host ghi báo cáo Markdown vào `.artifacts/qa-e2e/`.

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

Khóa tài khoản:

- `enabled` — công tắc chính cho tài khoản này.
- `name` — nhãn hiển thị tùy chọn.
- `baseUrl` — URL bus tổng hợp.
- `botUserId` — id người dùng bot kiểu Matrix được dùng trong ngữ pháp đích.
- `botDisplayName` — tên hiển thị cho thông điệp đầu ra.
- `pollTimeoutMs` — khoảng thời gian chờ long-poll. Số nguyên từ 100 đến 30000.
- `allowFrom` — danh sách cho phép người gửi (id người dùng hoặc `"*"`).
- `defaultTo` — đích dự phòng khi không có đích nào được cung cấp.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kiểm soát công cụ theo từng hành động.

Khóa đa tài khoản ở cấp cao nhất:

- `accounts` — bản ghi các ghi đè theo tài khoản được đặt tên, khóa theo id tài khoản.
- `defaultAccount` — id tài khoản ưu tiên khi có nhiều tài khoản được cấu hình.

## Trình chạy

Tự kiểm tra phía host (ghi báo cáo Markdown dưới `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Lệnh này định tuyến qua `qa-lab`, khởi động bus QA trong repo, khởi động lát cắt runtime `qa-channel` được tích hợp sẵn và chạy một lần tự kiểm tra có tính xác định.

Bộ kịch bản đầy đủ dựa trên repo:

```bash
pnpm openclaw qa suite
```

Chạy các kịch bản song song trên lane Gateway QA. Xem [Tổng quan QA](/vi/concepts/qa-e2e-automation) để biết về kịch bản, hồ sơ và chế độ provider.

Trang QA dựa trên Docker (Gateway + giao diện trình gỡ lỗi QA Lab trong một stack):

```bash
pnpm qa:lab:up
```

Xây dựng trang QA, khởi động stack Gateway + QA Lab dựa trên Docker và in URL QA Lab. Từ đó, bạn có thể chọn kịch bản, chọn lane mô hình, khởi chạy từng lần chạy riêng lẻ và xem kết quả trực tiếp. Trình gỡ lỗi QA Lab tách biệt với gói Control UI được phát hành.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — stack tổng thể, adapter truyền tải, biên soạn kịch bản
- [Matrix QA](/vi/concepts/qa-matrix) — ví dụ trình chạy truyền tải trực tiếp điều khiển một kênh thật
- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Tổng quan kênh](/vi/channels)
