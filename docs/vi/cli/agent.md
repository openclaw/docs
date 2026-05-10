---
read_when:
    - Bạn muốn chạy một lượt tác nhân từ các tập lệnh (tùy chọn gửi câu trả lời)
summary: Tài liệu tham khảo CLI cho `openclaw agent` (gửi một lượt tác tử qua Gateway)
title: Tác nhân
x-i18n:
    generated_at: "2026-05-10T19:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt agent thông qua Gateway (dùng `--local` cho chế độ nhúng).
Dùng `--agent <id>` để nhắm trực tiếp tới một agent đã cấu hình.

Truyền ít nhất một bộ chọn phiên:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Liên quan:

- Công cụ gửi của agent: [Gửi agent](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung thông điệp bắt buộc
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-id <id>`: id phiên tường minh
- `--agent <id>`: id agent; ghi đè các liên kết định tuyến
- `--model <id>`: ghi đè mô hình cho lần chạy này (`provider/model` hoặc id mô hình)
- `--thinking <level>`: mức suy nghĩ của agent (`off`, `minimal`, `low`, `medium`, `high`, cùng các mức tùy chỉnh được nhà cung cấp hỗ trợ như `xhigh`, `adaptive`, hoặc `max`)
- `--verbose <on|off>`: lưu mức chi tiết cho phiên
- `--channel <channel>`: kênh gửi; bỏ qua để dùng kênh phiên chính
- `--reply-to <target>`: ghi đè đích gửi
- `--reply-channel <channel>`: ghi đè kênh gửi
- `--reply-account <id>`: ghi đè tài khoản gửi
- `--local`: chạy trực tiếp agent nhúng (sau khi nạp trước sổ đăng ký Plugin)
- `--deliver`: gửi câu trả lời lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời gian chờ agent (mặc định 600 hoặc giá trị cấu hình)
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
- `--local` vẫn nạp trước sổ đăng ký Plugin, vì vậy các nhà cung cấp, công cụ và kênh do Plugin cung cấp vẫn khả dụng trong các lần chạy nhúng.
- `--local` và các lần chạy dự phòng nhúng được xem là các lần chạy một lần. Tài nguyên MCP local loopback được gói kèm và các phiên stdio Claude đã làm ấm được mở cho tiến trình cục bộ đó sẽ bị thu hồi sau câu trả lời, vì vậy các lệnh gọi theo script không giữ các tiến trình con cục bộ tiếp tục chạy.
- Các lần chạy dựa trên Gateway để tài nguyên MCP loopback thuộc Gateway dưới tiến trình Gateway đang chạy; các máy khách cũ hơn vẫn có thể gửi cờ dọn dẹp lịch sử, nhưng Gateway chấp nhận cờ đó như một thao tác không làm gì để tương thích.
- `--channel`, `--reply-channel`, và `--reply-account` ảnh hưởng đến việc gửi câu trả lời, không ảnh hưởng đến định tuyến phiên.
- `--json` giữ stdout riêng cho phản hồi JSON. Chẩn đoán từ Gateway, Plugin và dự phòng nhúng được định tuyến tới stderr để script có thể phân tích cú pháp stdout trực tiếp.
- JSON dự phòng nhúng bao gồm `meta.transport: "embedded"` và `meta.fallbackFrom: "gateway"` để script có thể phân biệt các lần chạy dự phòng với các lần chạy Gateway.
- Nếu Gateway chấp nhận một lần chạy agent nhưng CLI hết thời gian chờ câu trả lời cuối cùng, dự phòng nhúng dùng một id phiên/lần chạy `gateway-fallback-*` tường minh mới và báo cáo `meta.fallbackReason: "gateway_timeout"` cùng các trường phiên dự phòng. Điều này tránh tranh chấp khóa bản ghi hội thoại thuộc Gateway hoặc âm thầm thay thế phiên hội thoại đã định tuyến ban đầu.
- Khi lệnh này kích hoạt tái tạo `models.json`, thông tin xác thực nhà cung cấp do SecretRef quản lý được lưu dưới dạng các marker không phải bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME`, hoặc `secretref-managed`), không phải văn bản bí mật đã giải quyết.
- Ghi marker lấy nguồn làm thẩm quyền: OpenClaw lưu các marker từ ảnh chụp nhanh cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật runtime đã giải quyết.

## Trạng thái gửi JSON

Khi dùng `--json --deliver`, phản hồi JSON của CLI có thể bao gồm `deliveryStatus` cấp cao nhất để script có thể phân biệt các lần gửi đã gửi, bị chặn, một phần và thất bại:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` là một trong `sent`, `suppressed`, `partial_failed`, hoặc `failed`. `suppressed` nghĩa là việc gửi cố ý không được thực hiện, ví dụ một hook gửi thông điệp đã hủy nó hoặc không có kết quả hiển thị; đây vẫn là một kết quả kết thúc không thử lại. `partial_failed` nghĩa là ít nhất một payload đã được gửi trước khi một payload sau đó thất bại. `failed` nghĩa là không có lần gửi bền vững nào hoàn tất hoặc kiểm tra trước khi gửi thất bại.

Các phản hồi CLI dựa trên Gateway cũng giữ nguyên hình dạng kết quả Gateway thô, trong đó cùng đối tượng này có tại `result.deliveryStatus`.

Các trường thường gặp:

- `requested`: luôn là `true` khi đối tượng hiện diện.
- `attempted`: `true` sau khi đường dẫn gửi bền vững đã chạy; `false` với lỗi kiểm tra trước hoặc không có payload hiển thị.
- `succeeded`: `true`, `false`, hoặc `"partial"`; `"partial"` đi cùng `status: "partial_failed"`.
- `reason`: lý do chữ thường dạng snake-case từ gửi bền vững hoặc xác thực trước khi gửi. Các lý do đã biết gồm `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, và `no_delivery_target`; các lần gửi bền vững thất bại cũng có thể báo cáo giai đoạn thất bại. Xem các giá trị không xác định là mờ đục vì tập này có thể mở rộng.
- `resultCount`: số kết quả gửi kênh khi có.
- `sentBeforeError`: `true` khi một lỗi một phần đã gửi ít nhất một payload trước lỗi.
- `error`: boolean `true` cho các lần gửi thất bại hoặc thất bại một phần.
- `errorMessage`: chỉ được bao gồm khi một thông báo lỗi gửi nền tảng được ghi nhận. Lỗi kiểm tra trước mang `error` và `reason` nhưng không có `errorMessage`.
- `payloadOutcomes`: kết quả tùy chọn theo từng payload với `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, hoặc siêu dữ liệu hook khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runtime agent](/vi/concepts/agent)
