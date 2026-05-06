---
read_when:
    - Bạn đang tích hợp cơ chế truyền tải QA mô phỏng vào một lần chạy kiểm thử cục bộ hoặc CI
    - Bạn cần giao diện cấu hình qa-channel đi kèm
    - Bạn đang cải tiến lặp lại tự động hóa QA đầu-cuối
summary: Plugin kênh giả lập kiểu Slack cho các kịch bản QA OpenClaw có tính xác định
title: Kênh QA
x-i18n:
    generated_at: "2026-05-06T09:03:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` là một phương thức vận chuyển tin nhắn tổng hợp được đóng gói sẵn cho QA OpenClaw tự động. Đây không phải là kênh sản xuất - nó tồn tại để kiểm thử cùng ranh giới Plugin kênh mà các phương thức vận chuyển thật sử dụng, đồng thời giữ trạng thái có tính xác định và có thể kiểm tra đầy đủ.

## Chức năng

- Ngữ pháp đích kiểu Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Các cuộc trò chuyện dùng chung `channel:` và `group:` được hiển thị cho tác nhân dưới dạng lượt phòng nhóm/kênh, vì vậy chúng kiểm thử cùng chính sách định tuyến trả lời hiển thị và công cụ tin nhắn được Discord, Slack, Telegram và các phương thức vận chuyển tương tự sử dụng.
- Bus tổng hợp dựa trên HTTP để tiêm tin nhắn đến, ghi lại bản ghi tin nhắn đi, tạo luồng, phản ứng, chỉnh sửa, xóa và các hành động tìm kiếm/đọc.
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

Khóa tài khoản:

- `enabled` - công tắc chính cho tài khoản này.
- `name` - nhãn hiển thị tùy chọn.
- `baseUrl` - URL bus tổng hợp.
- `botUserId` - id người dùng bot kiểu Matrix được dùng trong ngữ pháp đích.
- `botDisplayName` - tên hiển thị cho tin nhắn gửi đi.
- `pollTimeoutMs` - cửa sổ chờ long-poll. Số nguyên từ 100 đến 30000.
- `allowFrom` - danh sách cho phép người gửi (id người dùng hoặc `"*"`).
- `defaultTo` - đích dự phòng khi không có đích nào được cung cấp.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - kiểm soát công cụ theo từng hành động.

Khóa đa tài khoản ở cấp cao nhất:

- `accounts` - bản ghi các ghi đè theo tài khoản được đặt tên, khóa theo id tài khoản.
- `defaultAccount` - id tài khoản ưu tiên khi cấu hình nhiều tài khoản.

## Trình chạy

Tự kiểm tra phía máy chủ (ghi báo cáo Markdown dưới `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Lệnh này định tuyến qua `qa-lab`, khởi động bus QA trong repo, khởi động lát cắt runtime `qa-channel` được đóng gói sẵn và chạy một bước tự kiểm tra có tính xác định.

Bộ kịch bản đầy đủ dựa trên repo:

```bash
pnpm openclaw qa suite
```

Chạy các kịch bản song song trên làn Gateway QA. Xem [Tổng quan QA](/vi/concepts/qa-e2e-automation) để biết kịch bản, hồ sơ và chế độ nhà cung cấp.

Trang QA dựa trên Docker (Gateway + giao diện gỡ lỗi QA Lab trong một stack):

```bash
pnpm qa:lab:up
```

Xây dựng trang QA, khởi động stack Gateway + QA Lab dựa trên Docker và in URL QA Lab. Từ đó bạn có thể chọn kịch bản, chọn làn mô hình, khởi chạy từng lần chạy riêng lẻ và xem kết quả trực tiếp. Trình gỡ lỗi QA Lab tách biệt với gói Control UI được phát hành.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - stack tổng thể, bộ chuyển đổi phương thức vận chuyển, biên soạn kịch bản
- [QA Matrix](/vi/concepts/qa-matrix) - ví dụ trình chạy phương thức vận chuyển trực tiếp điều khiển một kênh thật
- [Ghép đôi](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Tổng quan kênh](/vi/channels)
