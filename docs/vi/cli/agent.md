---
read_when:
    - Bạn muốn chạy một lượt agent từ các tập lệnh (có thể gửi phản hồi)
summary: Tài liệu tham khảo CLI cho `openclaw agent` (gửi một lượt của tác tử qua Gateway)
title: Tác tử
x-i18n:
    generated_at: "2026-07-21T13:29:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1a4c139a3b235d6a56ba63063737b80f93448c2dbb7a92c6d0756fb19a9f95e4
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Chạy một lượt agent thông qua Gateway. Cờ `--local` tường minh là đường dẫn thực thi nhúng duy nhất.

Truyền ít nhất một bộ chọn phiên: `--to`, `--session-key`, `--session-id` hoặc `--agent`.

Liên quan: [Công cụ gửi của agent](/vi/tools/agent-send)

## Tùy chọn

- `-m, --message <text>`: nội dung thông báo
- `--message-file <path>`: đọc nội dung thông báo từ tệp UTF-8
- `-t, --to <dest>`: người nhận dùng để suy ra khóa phiên
- `--session-key <key>`: khóa phiên tường minh dùng để định tuyến
- `--session-id <id>`: mã định danh phiên tường minh
- `--agent <id>`: mã định danh agent; ghi đè các liên kết định tuyến
- `--model <id>`: ghi đè mô hình cho lần chạy này (`provider/model` hoặc mã định danh mô hình)
- `--thinking <level>`: mức suy luận của agent (`off`, `minimal`, `low`, `medium`, `high`, cùng các mức tùy chỉnh được nhà cung cấp hỗ trợ như `xhigh`, `adaptive` hoặc `max`)
- `--verbose <on|off>`: lưu mức chi tiết cho phiên
- `--channel <channel>`: kênh phân phối; bỏ qua để dùng kênh phiên chính
- `--reply-to <target>`: ghi đè đích phân phối
- `--reply-channel <channel>`: ghi đè kênh phân phối
- `--reply-account <id>`: ghi đè tài khoản phân phối
- `--local`: chạy trực tiếp agent nhúng (sau khi tải trước sổ đăng ký Plugin)
- `--deliver`: gửi phản hồi trở lại kênh/đích đã chọn
- `--timeout <seconds>`: ghi đè thời hạn lượt agent của lệnh này (mặc định là 600 hoặc `agents.defaults.timeoutSeconds`); `0` vô hiệu hóa thời hạn tổng thể. Giá trị dự phòng 600 giây thuộc về lệnh CLI này, không phải các lượt Gateway thông thường có giá trị mặc định là 48 giờ.
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
openclaw agent --to +15555550123 --message "Theo dõi nhật ký" --verbose on --json
openclaw agent --agent ops --message "Tạo báo cáo" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Chạy cục bộ" --local
```

## Ghi chú

- Chỉ truyền đúng một trong `--message` hoặc `--message-file`. `--message-file` loại bỏ BOM UTF-8 ở đầu và giữ nguyên nội dung nhiều dòng; tùy chọn này từ chối các tệp không phải UTF-8 hợp lệ. Các tệp lớn hơn 4 MiB bị từ chối trước khi gửi đi.
- Không thể chạy các lệnh gạch chéo (ví dụ `/compact`) thông qua `--message`. CLI từ chối chúng và hướng bạn đến lệnh chuyên dụng tương ứng (`openclaw sessions compact <key>` cho Compaction).
- Các lần chạy `--local` chỉ thực hiện một lần: tài nguyên vòng lặp ngược MCP đi kèm và các phiên stdio Claude đã khởi động được mở cho lần chạy sẽ bị thu hồi sau phản hồi, để các lệnh gọi theo kịch bản không để lại tiến trình con cục bộ đang chạy. Thay vào đó, các lần chạy dựa trên Gateway giữ tài nguyên vòng lặp ngược MCP do Gateway sở hữu trong tiến trình Gateway đang chạy.
- Thực thi nhúng độc lập bằng `--local` từ chối sử dụng lại phiên chính hiện có khi đang chờ phục hồi sau khi khởi động lại. Hãy chạy lượt thông qua một Gateway khỏe mạnh hoặc đặt lại lượt tại đó bằng `/new` hoặc `/reset`; một tiến trình nhúng độc lập không thể phối hợp an toàn chủ thể sở hữu quá trình phục hồi đó với trình quét Gateway.
- Khi dùng đồng thời `--agent`, `--channel` và `--to`, việc định tuyến phiên tuân theo người nhận chuẩn của kênh và `session.dmScope`. Các kênh có danh tính người nhận ổn định chỉ dành cho gửi đi sẽ dùng một phiên do nhà cung cấp sở hữu, tách biệt với phiên chính của agent. `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc phân phối.
- `--session-key` chọn một khóa phiên tường minh. Các khóa có tiền tố agent phải dùng `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với mã định danh agent của khóa khi cả hai đều được cung cấp. Các khóa thuần không phải sentinel được giới hạn phạm vi trong `--agent` khi được cung cấp, hoặc trong agent mặc định đã cấu hình nếu không; ví dụ, `--agent ops --session-key incident-42` định tuyến đến `agent:ops:incident-42`. Các khóa nguyên văn `global` và `unknown` chỉ không bị giới hạn phạm vi khi không cung cấp `--agent`.
- `--json` dành riêng stdout cho phản hồi JSON; thông tin chẩn đoán của Gateway, Plugin và `--local` được gửi đến stderr để các tập lệnh có thể phân tích trực tiếp stdout.
- Sau khi dùng hết các lần thử lại bắt tay tạm thời, việc Gateway hết thời gian chờ hoặc đóng kết nối sẽ khiến lệnh thất bại; CLI không bao giờ âm thầm chạy lại lượt theo cách nhúng. Việc mất kết nối truyền tải không xác định rõ trạng thái — Gateway có thể đã chấp nhận và vẫn có thể hoàn tất lượt — vì vậy gợi ý trên stderr yêu cầu kiểm tra `openclaw gateway status` và bản ghi phiên trước khi thử lại hoặc chạy lại bằng `--local`, nhằm tránh thực thi lượt hai lần.
- `SIGTERM`/`SIGINT` ngắt một yêu cầu dựa trên Gateway đang chờ; nếu Gateway đã chấp nhận lần chạy, CLI cũng gửi `chat.abort` cho mã định danh lần chạy đó trước khi thoát. Các lần chạy `--local` nhận cùng tín hiệu nhưng không gửi `chat.abort`. Tiến trình con của trình khởi chạy bị kết thúc bởi `SIGINT` hoặc `SIGTERM` được chuyển tiếp lần đầu sẽ thoát với trạng thái tương ứng là 130 hoặc 143. Nếu khóa chống trùng lặp lần chạy nội bộ đã có một lần chạy đang hoạt động cho phiên này, phản hồi sẽ báo cáo `status: "in_flight"` và CLI không phải JSON sẽ in thông tin chẩn đoán ra stderr thay vì một phản hồi trống. Đối với các trình bao bọc cron/systemd bên ngoài, hãy duy trì một cơ chế dự phòng buộc dừng như `timeout -k 60 600 openclaw agent ...` để trình giám sát có thể thu hồi tiến trình nếu quá trình tắt không thể hoàn tất các tác vụ đang chờ.
- Khi lệnh này kích hoạt việc tạo lại `models.json`, thông tin xác thực nhà cung cấp do SecretRef quản lý được lưu dưới dạng các dấu hiệu không chứa bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME` hoặc `secretref-managed`), tuyệt đối không phải văn bản thuần của bí mật đã phân giải. Các thao tác ghi dấu hiệu đến từ ảnh chụp nhanh cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật thời gian chạy đã phân giải.

## Trạng thái phân phối JSON

Với `--json --deliver`, phản hồi JSON của CLI bao gồm `deliveryStatus` ở cấp cao nhất để các tập lệnh có thể phân biệt các lần gửi đã phân phối, bị chặn, thành công một phần và thất bại:

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
| `suppressed`     | Việc phân phối đã được chủ ý không gửi (ví dụ một hook gửi thông báo đã hủy thao tác hoặc không có kết quả hiển thị). Trạng thái cuối, không thử lại. |
| `partial_failed` | Ít nhất một payload đã được gửi trước khi một payload sau đó thất bại.                                                                                   |
| `failed`         | Không có lần gửi bền vững nào hoàn tất hoặc bước kiểm tra trước khi phân phối thất bại.                                                                                   |

Các trường phổ biến:

- `requested`: luôn là `true` khi đối tượng tồn tại.
- `attempted`: `true` sau khi đường dẫn gửi bền vững đã chạy; `false` đối với lỗi kiểm tra trước hoặc khi không có payload hiển thị.
- `succeeded`: `true`, `false` hoặc `"partial"`; `"partial"` đi cùng `status: "partial_failed"`.
- `reason`: lý do dạng chữ thường snake-case từ quá trình phân phối bền vững hoặc xác thực trước khi phân phối. Các giá trị đã biết gồm `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` và `no_delivery_target`; các lần gửi bền vững thất bại cũng có thể báo cáo giai đoạn thất bại. Hãy coi các giá trị không xác định là dữ liệu không trong suốt vì tập giá trị có thể mở rộng.
- `resultCount`: số lượng kết quả gửi qua kênh, nếu có.
- `sentBeforeError`: `true` khi lỗi một phần đã gửi ít nhất một payload trước khi xảy ra lỗi.
- `error`: `true` đối với các lần gửi thất bại hoặc thất bại một phần.
- `errorMessage`: chỉ xuất hiện khi đã thu thập được thông báo lỗi phân phối cơ sở. Các lỗi kiểm tra trước chứa `error`/`reason` nhưng không có `errorMessage`.
- `payloadOutcomes`: kết quả tùy chọn cho từng payload với `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` hoặc siêu dữ liệu hook khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Môi trường thời gian chạy của agent](/vi/concepts/agent)
