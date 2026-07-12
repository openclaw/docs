---
read_when:
    - Bạn muốn chạy một lượt tác tử từ các tập lệnh (có thể gửi phản hồi)
summary: Tài liệu tham khảo CLI cho `openclaw agent` (gửi một lượt tác tử qua Gateway)
title: Tác nhân
x-i18n:
    generated_at: "2026-07-12T07:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt agent thông qua Gateway. Nếu yêu cầu Gateway thất bại, lệnh sẽ chuyển sang agent nhúng; truyền `--local` để buộc thực thi bằng agent nhúng ngay từ đầu.

Truyền ít nhất một bộ chọn phiên: `--to`, `--session-key`, `--session-id` hoặc `--agent`.

Liên quan: [Công cụ gửi của agent](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung tin nhắn
- `--message-file <path>`: đọc nội dung tin nhắn từ tệp UTF-8
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-key <key>`: khóa phiên tường minh dùng để định tuyến
- `--session-id <id>`: mã định danh phiên tường minh
- `--agent <id>`: mã định danh agent; ghi đè các liên kết định tuyến
- `--model <id>`: ghi đè mô hình cho lần chạy này (`provider/model` hoặc mã định danh mô hình)
- `--thinking <level>`: mức suy luận của agent (`off`, `minimal`, `low`, `medium`, `high`, cùng các mức tùy chỉnh được nhà cung cấp hỗ trợ như `xhigh`, `adaptive` hoặc `max`)
- `--verbose <on|off>`: lưu giữ mức chi tiết cho phiên
- `--channel <channel>`: kênh gửi; bỏ qua để dùng kênh của phiên chính
- `--reply-to <target>`: ghi đè đích gửi
- `--reply-channel <channel>`: ghi đè kênh gửi
- `--reply-account <id>`: ghi đè tài khoản gửi
- `--local`: chạy trực tiếp agent nhúng (sau khi tải trước sổ đăng ký plugin)
- `--deliver`: gửi phản hồi trở lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời gian chờ của agent (mặc định là 600 hoặc `agents.defaults.timeoutSeconds`); `0` vô hiệu hóa thời gian chờ
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

- Chỉ truyền một trong hai tùy chọn `--message` hoặc `--message-file`. `--message-file` loại bỏ BOM UTF-8 ở đầu và giữ nguyên nội dung nhiều dòng; tùy chọn này từ chối các tệp không phải UTF-8 hợp lệ.
- Các lệnh gạch chéo (ví dụ `/compact`) không thể chạy thông qua `--message`. CLI từ chối chúng và hướng bạn đến lệnh chuyên dụng tương ứng (`openclaw sessions compact <key>` để thực hiện Compaction).
- Các lần chạy bằng `--local` và phương án dự phòng nhúng chỉ thực thi một lần: tài nguyên local loopback MCP đi kèm và các phiên stdio Claude được khởi động sẵn cho lần chạy sẽ bị đóng sau phản hồi, nhờ đó các lệnh gọi bằng tập lệnh không để lại tiến trình con cục bộ đang chạy. Thay vào đó, các lần chạy thông qua Gateway giữ tài nguyên local loopback MCP do Gateway sở hữu trong tiến trình Gateway đang chạy.
- Khi dùng đồng thời `--agent`, `--channel` và `--to`, việc định tuyến phiên tuân theo người nhận chuẩn của kênh và `session.dmScope`. Các kênh có danh tính người nhận ổn định chỉ dành cho chiều gửi đi sẽ dùng một phiên do nhà cung cấp sở hữu, tách biệt với phiên chính của agent. `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc gửi.
- `--session-key` chọn một khóa phiên tường minh. Các khóa có tiền tố agent phải dùng định dạng `agent:<agent-id>:<session-key>`, và khi cả hai được cung cấp, `--agent` phải khớp với mã định danh agent trong khóa. Các khóa thuần không phải khóa sentinel sẽ thuộc phạm vi của `--agent` nếu được cung cấp, hoặc của agent mặc định đã cấu hình trong trường hợp ngược lại; ví dụ, `--agent ops --session-key incident-42` định tuyến đến `agent:ops:incident-42`. Các khóa nguyên văn `global` và `unknown` chỉ giữ nguyên không thuộc phạm vi khi không cung cấp `--agent`.
- `--json` dành riêng stdout cho phản hồi JSON; thông tin chẩn đoán của Gateway, plugin và phương án dự phòng nhúng được ghi vào stderr để tập lệnh có thể phân tích trực tiếp stdout.
- JSON của phương án dự phòng nhúng bao gồm `meta.transport: "embedded"` và `meta.fallbackFrom: "gateway"` để tập lệnh có thể phát hiện một lần chạy dự phòng.
- Nếu Gateway chấp nhận một lần chạy nhưng CLI hết thời gian chờ phản hồi cuối cùng, phương án dự phòng nhúng sẽ dùng mã định danh phiên/lần chạy mới có dạng `gateway-fallback-*` và báo cáo `meta.fallbackReason: "gateway_timeout"` cùng các trường phiên dự phòng, thay vì chạy tranh chấp với bản ghi hội thoại do Gateway sở hữu hoặc âm thầm thay thế phiên ban đầu.
- `SIGTERM`/`SIGINT` ngắt một yêu cầu thông qua Gateway đang chờ; nếu Gateway đã chấp nhận lần chạy, CLI cũng gửi `chat.abort` cho mã định danh lần chạy đó trước khi thoát. Các lần chạy bằng `--local` và phương án dự phòng nhúng nhận cùng tín hiệu nhưng không gửi `chat.abort`. Nếu khóa khử trùng lặp lần chạy nội bộ đã có một lần chạy đang hoạt động cho phiên này, phản hồi sẽ báo cáo `status: "in_flight"` và CLI không dùng JSON sẽ in thông tin chẩn đoán ra stderr thay vì phản hồi trống. Đối với các trình bao bọc cron/systemd bên ngoài, hãy giữ một cơ chế buộc dừng dự phòng như `timeout -k 60 600 openclaw agent ...` để trình giám sát có thể thu hồi tiến trình nếu quá trình tắt không thể hoàn tất.
- Khi lệnh này kích hoạt việc tạo lại `models.json`, thông tin xác thực của nhà cung cấp do SecretRef quản lý được lưu dưới dạng dấu hiệu không chứa bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME` hoặc `secretref-managed`), tuyệt đối không phải văn bản thuần của bí mật đã được phân giải. Các dấu hiệu được ghi từ ảnh chụp nhanh cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật thời gian chạy đã được phân giải.

## Trạng thái gửi JSON

Khi dùng `--json --deliver`, phản hồi JSON của CLI bao gồm `deliveryStatus` ở cấp cao nhất để tập lệnh có thể phân biệt các lượt gửi đã hoàn tất, bị chặn, thất bại một phần và thất bại:

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

Các phản hồi CLI thông qua Gateway cũng giữ nguyên cấu trúc kết quả thô của Gateway tại `result.deliveryStatus`.

`deliveryStatus.status` là một trong các giá trị sau:

| Trạng thái       | Ý nghĩa                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Việc gửi đã hoàn tất.                                                                                                                        |
| `suppressed`     | Việc gửi đã bị chủ ý bỏ qua (ví dụ một hook gửi tin nhắn đã hủy hoặc không có kết quả hiển thị). Đây là trạng thái cuối, không thử lại.       |
| `partial_failed` | Ít nhất một tải trọng đã được gửi trước khi một tải trọng sau đó thất bại.                                                                    |
| `failed`         | Không có lượt gửi bền vững nào hoàn tất hoặc bước kiểm tra trước khi gửi thất bại.                                                           |

Các trường thường gặp:

- `requested`: luôn là `true` khi đối tượng hiện diện.
- `attempted`: là `true` sau khi đường dẫn gửi bền vững đã chạy; là `false` khi bước kiểm tra trước thất bại hoặc không có tải trọng hiển thị.
- `succeeded`: `true`, `false` hoặc `"partial"`; `"partial"` đi cùng `status: "partial_failed"`.
- `reason`: lý do dạng chữ thường snake-case từ quá trình gửi bền vững hoặc xác thực trước khi gửi. Các giá trị đã biết bao gồm `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` và `no_delivery_target`; các lượt gửi bền vững thất bại cũng có thể báo cáo giai đoạn thất bại. Hãy coi các giá trị không xác định là dữ liệu mờ vì tập giá trị có thể mở rộng.
- `resultCount`: số lượng kết quả gửi qua kênh, khi có.
- `sentBeforeError`: là `true` khi lỗi một phần xảy ra sau khi đã gửi ít nhất một tải trọng.
- `error`: là `true` đối với các lượt gửi thất bại hoặc thất bại một phần.
- `errorMessage`: chỉ hiện diện khi đã ghi nhận được thông báo lỗi gửi cơ sở. Các lỗi kiểm tra trước khi gửi có `error`/`reason` nhưng không có `errorMessage`.
- `payloadOutcomes`: kết quả tùy chọn theo từng tải trọng, gồm `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` hoặc siêu dữ liệu hook khi có.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Môi trường chạy agent](/vi/concepts/agent)
