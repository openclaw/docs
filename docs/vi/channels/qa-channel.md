---
read_when:
    - Bạn đang kết nối phương thức truyền tải QA tổng hợp vào một lượt chạy kiểm thử cục bộ hoặc CI
    - Bạn cần bề mặt cấu hình qa-channel đi kèm
    - Bạn đang lặp lại quy trình tự động hóa QA đầu cuối.
summary: Plugin kênh mô phỏng tương tự Slack dành cho các kịch bản QA OpenClaw có tính xác định
title: Kênh QA
x-i18n:
    generated_at: "2026-07-16T14:52:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` là một phương thức truyền tải tin nhắn tổng hợp cục bộ trong repo dành cho QA OpenClaw tự động (`extensions/qa-channel`, gói riêng tư, bị loại khỏi các bản cài đặt đóng gói). Đây không phải là một kênh dùng trong môi trường production — nó tồn tại để kiểm thử cùng ranh giới Plugin kênh mà các phương thức truyền tải thực sử dụng, đồng thời giữ trạng thái có tính xác định và hoàn toàn có thể kiểm tra.

## Chức năng

- Ngữ pháp đích kiểu Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Các cuộc trò chuyện `channel:` và `group:` dùng chung được hiển thị cho tác tử dưới dạng lượt trao đổi trong phòng nhóm/kênh, nhờ đó chúng kiểm thử cùng chính sách định tuyến phản hồi hiển thị và công cụ nhắn tin được Discord, Slack, Telegram cùng các phương thức truyền tải tương tự sử dụng.
- Bus tổng hợp dựa trên HTTP để chèn tin nhắn đến, ghi lại bản chép lời gửi đi, tạo luồng, bày tỏ cảm xúc, chỉnh sửa, xóa và thực hiện các thao tác tìm kiếm/đọc.
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
- `baseUrl` — URL bus tổng hợp. Tài khoản được xem là đã cấu hình sau khi giá trị này được đặt.
- `botUserId` — ID người dùng bot tổng hợp được dùng trong ngữ pháp đích (mặc định: `openclaw`).
- `botDisplayName` — tên hiển thị cho tin nhắn gửi đi (mặc định: `OpenClaw QA`).
- `pollTimeoutMs` — khoảng thời gian chờ thăm dò dài. Số nguyên từ 100 đến 30000 (mặc định: 1000).
- `allowFrom` — danh sách người gửi được phép (ID người dùng hoặc `"*"`; mặc định: `["*"]`). Tin nhắn trực tiếp luôn áp dụng chính sách `open`; chính sách nhóm sử dụng danh sách cho phép cũng dùng các ID người gửi tổng hợp này.
- `groupPolicy` — chính sách phòng dùng chung: `"open"` (mặc định), `"allowlist"` hoặc `"disabled"`.
- `groupAllowFrom` — danh sách người gửi được phép tùy chọn cho phòng dùng chung. Khi bị lược bỏ trong `"allowlist"`, Kênh QA sẽ dùng `allowFrom` làm phương án dự phòng.
- `groups.<room>.requireMention` — yêu cầu đề cập đến bot trước khi phản hồi trong một phòng nhóm/kênh cụ thể (mặc định: false). `groups."*"` đặt giá trị mặc định; `tools` / `toolsBySender` theo từng phòng đặt các giá trị ghi đè chính sách công cụ.
- `defaultTo` — đích dự phòng khi không có đích nào được cung cấp.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kiểm soát quyền sử dụng công cụ theo từng thao tác.

Các khóa đa tài khoản ở cấp cao nhất:

- `accounts` — bản ghi các giá trị ghi đè theo từng tài khoản được đặt tên, với khóa là ID tài khoản.
- `defaultAccount` — ID tài khoản ưu tiên khi có nhiều tài khoản được cấu hình.

## Trình chạy

Tự kiểm tra phía máy chủ (ghi báo cáo Markdown trong `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Lệnh này định tuyến qua `qa-lab`, khởi động bus QA trong repo, khởi động phần runtime `qa-channel` và chạy quy trình tự kiểm tra có tính xác định.

Bộ kịch bản đầy đủ dựa trên repo:

```bash
pnpm openclaw qa suite
```

Chạy song song các kịch bản trên lane Gateway QA. Xem [tổng quan về QA](/vi/concepts/qa-e2e-automation) để biết các kịch bản, hồ sơ và chế độ nhà cung cấp.

Trang QA dựa trên Docker (Gateway + giao diện người dùng trình gỡ lỗi QA Lab trong cùng một stack):

```bash
pnpm qa:lab:up
```

Xây dựng trang QA, khởi động stack Gateway + QA Lab dựa trên Docker và in URL QA Lab. Từ đó, bạn có thể chọn kịch bản, chọn lane mô hình, khởi chạy từng lượt chạy và theo dõi trực tiếp kết quả. Trình gỡ lỗi QA Lab tách biệt với gói giao diện người dùng Control UI được phát hành.

## Liên quan

- [Tổng quan về QA](/vi/concepts/qa-e2e-automation) — stack tổng thể, bộ điều hợp truyền tải, hồ sơ Matrix và cách biên soạn kịch bản
- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Tổng quan về các kênh](/vi/channels)
