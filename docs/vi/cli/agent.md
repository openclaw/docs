---
read_when:
    - Bạn muốn chạy một lượt tác nhân từ các tập lệnh (tùy chọn gửi phản hồi)
summary: Tham chiếu CLI cho `openclaw agent` (gửi một lượt agent qua Gateway)
title: Tác nhân
x-i18n:
    generated_at: "2026-06-27T17:16:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt tác tử qua Gateway (dùng `--local` để chạy nhúng).
Dùng `--agent <id>` để nhắm trực tiếp đến một tác tử đã cấu hình.

Truyền ít nhất một bộ chọn phiên:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Liên quan:

- Công cụ gửi tác tử: [Gửi tác tử](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung thông điệp
- `--message-file <path>`: đọc nội dung thông điệp từ một tệp UTF-8
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-key <key>`: khóa phiên tường minh dùng để định tuyến
- `--session-id <id>`: mã phiên tường minh
- `--agent <id>`: mã tác tử; ghi đè các ràng buộc định tuyến
- `--model <id>`: ghi đè mô hình cho lần chạy này (`provider/model` hoặc mã mô hình)
- `--thinking <level>`: mức suy nghĩ của tác tử (`off`, `minimal`, `low`, `medium`, `high`, cộng với các mức tùy chỉnh do nhà cung cấp hỗ trợ như `xhigh`, `adaptive`, hoặc `max`)
- `--verbose <on|off>`: lưu mức chi tiết cho phiên
- `--channel <channel>`: kênh gửi; bỏ qua để dùng kênh phiên chính
- `--reply-to <target>`: ghi đè đích gửi
- `--reply-channel <channel>`: ghi đè kênh gửi
- `--reply-account <id>`: ghi đè tài khoản gửi
- `--local`: chạy trực tiếp tác tử nhúng (sau khi tải trước sổ đăng ký Plugin)
- `--deliver`: gửi phản hồi trở lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời gian chờ của tác tử (mặc định 600 hoặc giá trị cấu hình)
- `--json`: xuất JSON

## Ví dụ

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Ghi chú

- Truyền đúng một trong hai tùy chọn `--message` hoặc `--message-file`. `--message-file` giữ nguyên nội dung tệp nhiều dòng sau khi loại bỏ BOM UTF-8 tùy chọn, và từ chối các tệp không phải UTF-8 hợp lệ.
- Chế độ Gateway quay về tác tử nhúng khi yêu cầu Gateway thất bại. Dùng `--local` để buộc thực thi nhúng ngay từ đầu.
- `--local` vẫn tải trước sổ đăng ký Plugin trước, nên các nhà cung cấp, công cụ và kênh do Plugin cung cấp vẫn khả dụng trong các lần chạy nhúng.
- `--local` và các lần chạy dự phòng nhúng được xem là các lần chạy một lượt. Các tài nguyên loopback MCP đi kèm và phiên Claude stdio ấm được mở cho tiến trình cục bộ đó sẽ được thu hồi sau phản hồi, để các lệnh gọi theo script không giữ các tiến trình con cục bộ còn sống.
- Các lần chạy dựa trên Gateway để lại tài nguyên loopback MCP do Gateway sở hữu dưới tiến trình Gateway đang chạy; các máy khách cũ hơn vẫn có thể gửi cờ dọn dẹp lịch sử, nhưng Gateway chấp nhận cờ đó như một thao tác tương thích không làm gì.
- `--channel`, `--reply-channel`, và `--reply-account` ảnh hưởng đến việc gửi phản hồi, không ảnh hưởng đến định tuyến phiên.
- `--session-key` chọn một khóa phiên tường minh. Các khóa có tiền tố tác tử phải dùng `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với mã tác tử của khóa khi cả hai đều được cung cấp. Các khóa trần không phải sentinel được đặt phạm vi theo `--agent` khi được cung cấp, hoặc theo tác tử mặc định đã cấu hình nếu không; ví dụ, `--agent ops --session-key incident-42` định tuyến đến `agent:ops:incident-42`. Các giá trị nguyên văn `global` và `unknown` chỉ giữ nguyên không đặt phạm vi khi không cung cấp `--agent`; trong trường hợp đó, dự phòng nhúng và quyền sở hữu kho lưu trữ dùng tác tử mặc định đã cấu hình.
- `--json` giữ stdout dành riêng cho phản hồi JSON. Chẩn đoán của Gateway, Plugin và dự phòng nhúng được định tuyến đến stderr để script có thể phân tích stdout trực tiếp.
- JSON dự phòng nhúng bao gồm `meta.transport: "embedded"` và `meta.fallbackFrom: "gateway"` để script có thể phân biệt các lần chạy dự phòng với các lần chạy Gateway.
- Nếu Gateway chấp nhận một lần chạy tác tử nhưng CLI hết thời gian chờ phản hồi cuối cùng, dự phòng nhúng dùng một mã phiên/lần chạy tường minh mới `gateway-fallback-*` và báo cáo `meta.fallbackReason: "gateway_timeout"` cùng các trường phiên dự phòng. Điều này tránh chạy đua với khóa bản ghi hội thoại do Gateway sở hữu hoặc âm thầm thay thế phiên hội thoại được định tuyến ban đầu.
- Với các lần chạy dựa trên Gateway, `SIGTERM` và `SIGINT` ngắt yêu cầu CLI đang chờ. Nếu Gateway đã chấp nhận lần chạy, CLI cũng gửi `chat.abort` cho mã lần chạy đã chấp nhận đó trước khi thoát. Các lần chạy `--local` cục bộ và các lần chạy dự phòng nhúng nhận cùng tín hiệu hủy, nhưng không gửi `chat.abort`. Nếu một `--run-id` trùng lặp đến Gateway trong khi lần chạy tác tử ban đầu vẫn đang hoạt động, phản hồi trùng lặp báo cáo `status: "in_flight"` và CLI không dùng JSON in chẩn đoán ra stderr thay vì phản hồi rỗng. Với các trình bao bọc cron/systemd bên ngoài, hãy giữ một chốt chặn buộc dừng bên ngoài như `timeout -k 60 600 openclaw agent ...` để trình giám sát vẫn có thể thu hồi tiến trình nếu quá trình tắt không thể xả hết.
- Khi lệnh này kích hoạt tái tạo `models.json`, thông tin xác thực nhà cung cấp do SecretRef quản lý được lưu dưới dạng dấu mốc không bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME`, hoặc `secretref-managed`), không phải bản rõ bí mật đã phân giải.
- Việc ghi dấu mốc lấy nguồn làm thẩm quyền: OpenClaw lưu các dấu mốc từ ảnh chụp cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật thời gian chạy đã phân giải.

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

`deliveryStatus.status` là một trong `sent`, `suppressed`, `partial_failed`, hoặc `failed`. `suppressed` nghĩa là việc gửi đã cố ý không được thực hiện, ví dụ một hook gửi thông điệp đã hủy nó hoặc không có kết quả hiển thị; đây vẫn là kết quả kết thúc không thử lại. `partial_failed` nghĩa là ít nhất một payload đã được gửi trước khi payload sau đó thất bại. `failed` nghĩa là không có lần gửi bền vững nào hoàn tất hoặc bước kiểm tra trước khi gửi thất bại.

Phản hồi CLI dựa trên Gateway cũng giữ nguyên hình dạng kết quả Gateway thô, trong đó cùng đối tượng có sẵn tại `result.deliveryStatus`.

Các trường phổ biến:

- `requested`: luôn là `true` khi đối tượng hiện diện.
- `attempted`: `true` sau khi đường dẫn gửi bền vững đã chạy; `false` cho các lỗi kiểm tra trước hoặc khi không có payload hiển thị.
- `succeeded`: `true`, `false`, hoặc `"partial"`; `"partial"` đi kèm với `status: "partial_failed"`.
- `reason`: lý do dạng snake-case chữ thường từ gửi bền vững hoặc xác thực kiểm tra trước. Các lý do đã biết bao gồm `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, và `no_delivery_target`; các lần gửi bền vững thất bại cũng có thể báo cáo giai đoạn thất bại. Xem các giá trị không xác định là mờ đục vì tập giá trị có thể mở rộng.
- `resultCount`: số lượng kết quả gửi kênh khi có sẵn.
- `sentBeforeError`: `true` khi một lỗi một phần đã gửi ít nhất một payload trước lỗi.
- `error`: boolean `true` cho các lần gửi thất bại hoặc thất bại một phần.
- `errorMessage`: chỉ được bao gồm khi thu được thông báo lỗi gửi bên dưới. Các lỗi kiểm tra trước mang `error` và `reason` nhưng không có `errorMessage`.
- `payloadOutcomes`: kết quả tùy chọn theo từng payload với `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, hoặc siêu dữ liệu hook khi có sẵn.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Thời gian chạy tác tử](/vi/concepts/agent)
