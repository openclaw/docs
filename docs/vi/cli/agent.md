---
read_when:
    - Bạn muốn chạy một lượt tác tử từ các tập lệnh (có thể gửi phản hồi)
summary: Tài liệu tham khảo CLI cho `openclaw agent` (gửi một lượt của agent qua Gateway)
title: Tác nhân
x-i18n:
    generated_at: "2026-07-19T05:45:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c057e8e1209442007b99bc9e27019e2d9c1d08c55390f6b3c2223c7a7c13d7f5
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt agent thông qua Gateway. Chuyển sang agent nhúng nếu yêu cầu Gateway thất bại; truyền `--local` để buộc thực thi nhúng ngay từ đầu.

Truyền ít nhất một bộ chọn phiên: `--to`, `--session-key`, `--session-id` hoặc `--agent`.

Liên quan: [Công cụ gửi của agent](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung thông điệp
- `--message-file <path>`: đọc nội dung thông điệp từ tệp UTF-8
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-key <key>`: khóa phiên tường minh dùng để định tuyến
- `--session-id <id>`: mã định danh phiên tường minh
- `--agent <id>`: mã định danh agent; ghi đè các liên kết định tuyến
- `--model <id>`: ghi đè mô hình cho lượt chạy này (`provider/model` hoặc mã định danh mô hình)
- `--thinking <level>`: mức suy luận của agent (`off`, `minimal`, `low`, `medium`, `high`, cùng các mức tùy chỉnh được nhà cung cấp hỗ trợ như `xhigh`, `adaptive` hoặc `max`)
- `--verbose <on|off>`: duy trì mức chi tiết cho phiên
- `--channel <channel>`: kênh phân phối; bỏ qua để dùng kênh phiên chính
- `--reply-to <target>`: ghi đè đích phân phối
- `--reply-channel <channel>`: ghi đè kênh phân phối
- `--reply-account <id>`: ghi đè tài khoản phân phối
- `--local`: chạy trực tiếp agent nhúng (sau khi tải trước sổ đăng ký Plugin)
- `--deliver`: gửi phản hồi trở lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời hạn lượt agent của lệnh này (mặc định 600 hoặc `agents.defaults.timeoutSeconds`); `0` vô hiệu hóa thời hạn tổng thể. Giá trị dự phòng 600 giây thuộc về lệnh CLI này, không phải các lượt Gateway thông thường vốn có giá trị mặc định là 48 giờ.
- `--json`: xuất JSON

## Ví dụ

```bash
openclaw agent --to +15555550123 --message "cập nhật trạng thái" --deliver
openclaw agent --agent ops --message "Tóm tắt nhật ký"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Tóm tắt nhật ký"
openclaw agent --session-key agent:ops:incident-42 --message "Tóm tắt trạng thái"
openclaw agent --agent ops --session-key incident-42 --message "Tóm tắt trạng thái"
openclaw agent --session-id 1234 --message "Tóm tắt hộp thư đến" --thinking medium
openclaw agent --to +15555550123 --message "Truy vết nhật ký" --verbose on --json
openclaw agent --agent ops --message "Tạo báo cáo" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Chạy cục bộ" --local
```

## Ghi chú

- Chỉ truyền đúng một trong `--message` hoặc `--message-file`. `--message-file` loại bỏ BOM UTF-8 ở đầu và giữ nguyên nội dung nhiều dòng; tùy chọn này từ chối các tệp không phải UTF-8 hợp lệ. Các tệp lớn hơn 4 MiB bị từ chối trước khi gửi đi.
- Không thể chạy các lệnh gạch chéo (ví dụ `/compact`) thông qua `--message`. CLI từ chối chúng và hướng bạn đến lệnh chuyên dụng tương ứng (`openclaw sessions compact <key>` cho Compaction).
- `--local` và các lượt chạy dự phòng nhúng chỉ dùng một lần: các tài nguyên loopback MCP đi kèm và các phiên stdio Claude đã khởi động sẵn được mở cho lượt chạy sẽ bị kết thúc sau phản hồi, vì vậy các lần gọi bằng tập lệnh không để lại tiến trình con cục bộ đang chạy. Thay vào đó, các lượt chạy dựa trên Gateway giữ tài nguyên loopback MCP do Gateway sở hữu trong tiến trình Gateway đang chạy.
- Thực thi nhúng độc lập (`--local` và phương án dự phòng truyền tải) từ chối sử dụng lại phiên chính hiện có khi quá trình khôi phục sau khi khởi động lại đang chờ xử lý. Hãy chạy lượt này thông qua một Gateway hoạt động bình thường hoặc đặt lại tại đó bằng `/new` hoặc `/reset`; một tiến trình nhúng độc lập không thể phối hợp an toàn chủ thể sở hữu quá trình khôi phục đó với trình quét Gateway.
- Khi dùng đồng thời `--agent`, `--channel` và `--to`, việc định tuyến phiên tuân theo người nhận chuẩn của kênh và `session.dmScope`. Các kênh có danh tính người nhận ổn định chỉ dành cho chiều gửi đi sẽ sử dụng một phiên do nhà cung cấp sở hữu, tách biệt với phiên chính của agent. `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc phân phối.
- `--session-key` chọn một khóa phiên tường minh. Các khóa có tiền tố agent phải dùng `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với mã định danh agent trong khóa khi cả hai đều được cung cấp. Các khóa thuần không phải sentinel được giới hạn trong `--agent` khi được cung cấp, hoặc trong agent mặc định đã cấu hình nếu không; ví dụ, `--agent ops --session-key incident-42` định tuyến đến `agent:ops:incident-42`. Các khóa chữ `global` và `unknown` chỉ giữ nguyên trạng thái không giới hạn phạm vi khi không cung cấp `--agent`.
- `--json` dành riêng stdout cho phản hồi JSON; chẩn đoán từ Gateway, Plugin và phương án dự phòng nhúng được chuyển đến stderr để tập lệnh có thể phân tích trực tiếp stdout.
- JSON dự phòng nhúng bao gồm `meta.transport: "embedded"` và `meta.fallbackFrom: "gateway"` để tập lệnh có thể phát hiện một lượt chạy dự phòng.
- Nếu Gateway chấp nhận một lượt chạy nhưng CLI hết thời gian chờ phản hồi cuối cùng, phương án dự phòng nhúng sẽ dùng mã định danh phiên/lượt chạy `gateway-fallback-*` mới và báo cáo `meta.fallbackReason: "gateway_timeout"` cùng các trường phiên dự phòng, thay vì cạnh tranh với bản ghi hội thoại do Gateway sở hữu hoặc âm thầm thay thế phiên ban đầu.
- `SIGTERM`/`SIGINT` ngắt một yêu cầu dựa trên Gateway đang chờ; nếu Gateway đã chấp nhận lượt chạy, CLI cũng gửi `chat.abort` cho mã định danh lượt chạy đó trước khi thoát. `--local` và các lượt chạy dự phòng nhúng nhận cùng tín hiệu nhưng không gửi `chat.abort`. Nếu khóa khử trùng lặp lượt chạy nội bộ đã có một lượt chạy đang hoạt động cho phiên này, phản hồi sẽ báo cáo `status: "in_flight"` và CLI không dùng JSON sẽ in thông tin chẩn đoán ra stderr thay vì một phản hồi trống. Đối với các trình bao bọc cron/systemd bên ngoài, hãy duy trì một cơ chế dự phòng buộc kết thúc như `timeout -k 60 600 openclaw agent ...` để trình giám sát có thể thu hồi tiến trình nếu quá trình tắt không thể hoàn tất các tác vụ đang chờ.
- Khi lệnh này kích hoạt việc tạo lại `models.json`, thông tin xác thực của nhà cung cấp do SecretRef quản lý được lưu dưới dạng dấu hiệu không chứa bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME` hoặc `secretref-managed`), tuyệt đối không phải văn bản thuần của bí mật đã phân giải. Các giá trị dấu hiệu được ghi từ ảnh chụp nhanh cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật đã phân giải trong thời gian chạy.

## Trạng thái phân phối JSON

Với `--json --deliver`, phản hồi JSON của CLI bao gồm `deliveryStatus` ở cấp cao nhất để tập lệnh có thể phân biệt các lượt gửi đã phân phối, bị ngăn, thành công một phần và thất bại:

```json
{
  "payloads": [{ "text": "Báo cáo đã sẵn sàng", "mediaUrl": null }],
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

Các phản hồi CLI dựa trên Gateway cũng giữ nguyên hình dạng kết quả Gateway thô tại `result.deliveryStatus`.

`deliveryStatus.status` là một trong các giá trị sau:

| Trạng thái           | Ý nghĩa                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | Phân phối đã hoàn tất.                                                                                                                        |
| `suppressed`     | Việc phân phối đã được chủ ý không thực hiện (ví dụ hook gửi thông điệp đã hủy hoặc không có kết quả hiển thị). Đây là trạng thái cuối, không thử lại. |
| `partial_failed` | Ít nhất một tải trọng đã được gửi trước khi tải trọng sau đó thất bại.                                                                                   |
| `failed`         | Không có lượt gửi bền vững nào hoàn tất hoặc bước kiểm tra trước khi phân phối đã thất bại.                                                                                   |

Các trường phổ biến:

- `requested`: luôn là `true` khi đối tượng tồn tại.
- `attempted`: `true` sau khi đường dẫn gửi bền vững đã chạy; `false` đối với lỗi kiểm tra trước hoặc khi không có tải trọng hiển thị.
- `succeeded`: `true`, `false` hoặc `"partial"`; `"partial"` đi cùng `status: "partial_failed"`.
- `reason`: lý do viết thường theo kiểu snake-case từ quá trình phân phối bền vững hoặc xác thực trước khi phân phối. Các giá trị đã biết gồm `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` và `no_delivery_target`; các lượt gửi bền vững thất bại cũng có thể báo cáo giai đoạn đã thất bại. Hãy coi các giá trị không xác định là dữ liệu bất minh vì tập giá trị có thể mở rộng.
- `resultCount`: số lượng kết quả gửi qua kênh, khi có.
- `sentBeforeError`: `true` khi lỗi một phần đã gửi ít nhất một tải trọng trước khi gặp lỗi.
- `error`: `true` đối với các lượt gửi thất bại hoặc thất bại một phần.
- `errorMessage`: chỉ xuất hiện khi đã ghi nhận thông báo lỗi phân phối cơ sở. Các lỗi kiểm tra trước có `error`/`reason` nhưng không có `errorMessage`.
- `payloadOutcomes`: kết quả tùy chọn cho từng tải trọng với `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` hoặc siêu dữ liệu hook khi có.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Môi trường chạy agent](/vi/concepts/agent)
