---
read_when:
    - Bạn muốn chạy một lượt của tác nhân từ các tập lệnh (tùy chọn gửi phản hồi)
summary: Tài liệu tham chiếu CLI cho `openclaw agent` (gửi một lượt của tác nhân qua Gateway)
title: Tác nhân
x-i18n:
    generated_at: "2026-04-29T22:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt agent qua Gateway (dùng `--local` cho chế độ nhúng).
Dùng `--agent <id>` để nhắm trực tiếp đến một agent đã cấu hình.

Truyền ít nhất một bộ chọn phiên:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Liên quan:

- Công cụ gửi của agent: [Gửi agent](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung tin nhắn bắt buộc
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-id <id>`: id phiên rõ ràng
- `--agent <id>`: id agent; ghi đè các liên kết định tuyến
- `--model <id>`: ghi đè model cho lần chạy này (`provider/model` hoặc id model)
- `--thinking <level>`: mức suy nghĩ của agent (`off`, `minimal`, `low`, `medium`, `high`, cùng các mức tùy chỉnh được nhà cung cấp hỗ trợ như `xhigh`, `adaptive`, hoặc `max`)
- `--verbose <on|off>`: lưu mức chi tiết cho phiên
- `--channel <channel>`: kênh gửi; bỏ qua để dùng kênh phiên chính
- `--reply-to <target>`: ghi đè đích gửi
- `--reply-channel <channel>`: ghi đè kênh gửi
- `--reply-account <id>`: ghi đè tài khoản gửi
- `--local`: chạy trực tiếp agent nhúng (sau khi tải trước registry Plugin)
- `--deliver`: gửi phản hồi lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời gian chờ của agent (mặc định 600 hoặc giá trị cấu hình)
- `--json`: xuất JSON

## Ví dụ

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Ghi chú

- Chế độ Gateway quay về agent nhúng khi yêu cầu Gateway thất bại. Dùng `--local` để buộc thực thi nhúng ngay từ đầu.
- `--local` vẫn tải trước registry Plugin trước, nên các nhà cung cấp, công cụ và kênh do Plugin cung cấp vẫn khả dụng trong các lần chạy nhúng.
- `--local` và các lần chạy dự phòng nhúng được xử lý như các lần chạy một lần. Tài nguyên loopback MCP đóng gói và phiên Claude stdio ấm được mở cho quy trình cục bộ đó sẽ được thu hồi sau phản hồi, nên các lệnh gọi theo script không giữ các tiến trình con cục bộ tiếp tục chạy.
- Các lần chạy dựa trên Gateway để tài nguyên loopback MCP do Gateway sở hữu dưới tiến trình Gateway đang chạy; các client cũ hơn vẫn có thể gửi cờ dọn dẹp lịch sử, nhưng Gateway chấp nhận cờ đó như một thao tác không làm gì để tương thích.
- `--channel`, `--reply-channel`, và `--reply-account` ảnh hưởng đến việc gửi phản hồi, không ảnh hưởng đến định tuyến phiên.
- `--json` giữ stdout dành riêng cho phản hồi JSON. Chẩn đoán của Gateway, Plugin và dự phòng nhúng được định tuyến đến stderr để script có thể phân tích cú pháp stdout trực tiếp.
- JSON dự phòng nhúng bao gồm `meta.transport: "embedded"` và `meta.fallbackFrom: "gateway"` để script có thể phân biệt các lần chạy dự phòng với các lần chạy Gateway.
- Nếu Gateway chấp nhận một lần chạy agent nhưng CLI hết thời gian chờ phản hồi cuối cùng, dự phòng nhúng dùng một id phiên/lần chạy `gateway-fallback-*` rõ ràng mới và báo cáo `meta.fallbackReason: "gateway_timeout"` cùng các trường phiên dự phòng. Điều này tránh chạy đua với khóa transcript do Gateway sở hữu hoặc âm thầm thay thế phiên hội thoại được định tuyến ban đầu.
- Khi lệnh này kích hoạt việc tạo lại `models.json`, thông tin xác thực nhà cung cấp do SecretRef quản lý được lưu dưới dạng marker không phải bí mật (ví dụ tên biến env, `secretref-env:ENV_VAR_NAME`, hoặc `secretref-managed`), không phải bản rõ bí mật đã được phân giải.
- Ghi marker lấy nguồn làm thẩm quyền: OpenClaw lưu marker từ ảnh chụp cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật runtime đã được phân giải.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runtime agent](/vi/concepts/agent)
