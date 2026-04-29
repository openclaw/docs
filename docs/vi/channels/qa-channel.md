---
read_when:
    - Bạn đang tích hợp lớp truyền tải QA tổng hợp vào một lần chạy kiểm thử cục bộ hoặc trên CI
    - Bạn cần giao diện cấu hình qa-channel được tích hợp sẵn
    - Bạn đang lặp lại quá trình cải tiến tự động hóa QA đầu cuối
summary: Plugin kênh loại Slack mô phỏng cho các kịch bản QA OpenClaw có tính tất định
title: Kênh QA
x-i18n:
    generated_at: "2026-04-29T22:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` là một bộ truyền tải tin nhắn tổng hợp được đóng gói sẵn cho QA tự động của OpenClaw. Đây không phải là kênh sản xuất — nó tồn tại để kiểm thử cùng ranh giới Plugin kênh mà các bộ truyền tải thực sử dụng, đồng thời giữ trạng thái có tính xác định và có thể kiểm tra đầy đủ.

## Chức năng

- Ngữ pháp đích kiểu Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
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

- `enabled` — công tắc chính cho tài khoản này.
- `name` — nhãn hiển thị tùy chọn.
- `baseUrl` — URL bus tổng hợp.
- `botUserId` — id người dùng bot kiểu Matrix được dùng trong ngữ pháp đích.
- `botDisplayName` — tên hiển thị cho tin nhắn gửi đi.
- `pollTimeoutMs` — cửa sổ chờ long-poll. Số nguyên từ 100 đến 30000.
- `allowFrom` — danh sách cho phép người gửi (id người dùng hoặc `"*"`).
- `defaultTo` — đích dự phòng khi không có đích nào được cung cấp.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kiểm soát công cụ theo từng hành động.

Khóa đa tài khoản ở cấp cao nhất:

- `accounts` — bản ghi các ghi đè theo tài khoản được đặt tên, khóa theo id tài khoản.
- `defaultAccount` — id tài khoản ưu tiên khi cấu hình nhiều tài khoản.

## Trình chạy

Tự kiểm tra phía máy chủ (ghi báo cáo Markdown trong `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Lệnh này định tuyến qua `qa-lab`, khởi động bus QA trong repo, khởi động lát thời gian chạy `qa-channel` được đóng gói sẵn, rồi chạy một lần tự kiểm tra có tính xác định.

Bộ kịch bản đầy đủ dựa trên repo:

```bash
pnpm openclaw qa suite
```

Chạy các kịch bản song song trên làn Gateway QA. Xem [Tổng quan QA](/vi/concepts/qa-e2e-automation) để biết kịch bản, hồ sơ và chế độ nhà cung cấp.

Trang QA dựa trên Docker (Gateway + giao diện gỡ lỗi QA Lab trong một ngăn xếp):

```bash
pnpm qa:lab:up
```

Xây dựng trang QA, khởi động ngăn xếp Gateway + QA Lab dựa trên Docker và in URL QA Lab. Từ đó, bạn có thể chọn kịch bản, chọn làn mô hình, khởi chạy từng lượt chạy và xem kết quả trực tiếp. Trình gỡ lỗi QA Lab tách biệt với gói Control UI được phát hành.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — toàn bộ ngăn xếp, bộ điều hợp truyền tải, cách soạn kịch bản
- [Matrix QA](/vi/concepts/qa-matrix) — ví dụ về trình chạy truyền tải trực tiếp điều khiển một kênh thực
- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Tổng quan kênh](/vi/channels)
