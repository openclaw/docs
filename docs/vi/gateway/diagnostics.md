---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi sự cố Gateway bị sập, khởi động lại, chịu áp lực bộ nhớ hoặc có tải dữ liệu quá lớn
    - Xem xét dữ liệu chẩn đoán nào được ghi lại hoặc che giấu
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất dữ liệu chẩn đoán
x-i18n:
    generated_at: "2026-07-20T04:41:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 97a805fed8d51de2e63e5c6a12ce03e91701d69654882cca7795c9f3553b1c55
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một `.zip` chẩn đoán cục bộ cho báo cáo lỗi: trạng thái, tình trạng hoạt động, nhật ký, cấu trúc cấu hình và các sự kiện ổn định gần đây không chứa payload đã được làm sạch của Gateway.

Hãy coi các gói chẩn đoán như thông tin bí mật cho đến khi được xem xét. Payload và thông tin xác thực
được che theo thiết kế, nhưng gói vẫn tóm tắt nhật ký Gateway cục bộ và
trạng thái runtime ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

In đường dẫn của tệp zip đã ghi. Chọn đường dẫn đầu ra:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Để tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh trò chuyện

Chủ sở hữu có thể chạy `/diagnostics [note]` trong bất kỳ cuộc trò chuyện nào để yêu cầu xuất
Gateway cục bộ thành một báo cáo hỗ trợ duy nhất có thể sao chép và dán:

1. Gửi `/diagnostics`, có thể kèm theo một ghi chú ngắn (`/diagnostics bad tool choice`).
2. OpenClaw gửi lời mở đầu và yêu cầu một lần phê duyệt thực thi rõ ràng để chạy
   `openclaw gateway diagnostics export --json`. Không phê duyệt chẩn đoán bằng
   quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw phản hồi bằng đường dẫn gói cục bộ, bản tóm tắt
   tệp kê khai, ghi chú về quyền riêng tư và các id phiên liên quan.

Trong cuộc trò chuyện nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw gửi riêng
kết quả xuất, lời nhắc phê duyệt và thông tin phân tích phiên/luồng Codex cho
chủ sở hữu. Nhóm chỉ thấy một thông báo ngắn rằng dữ liệu chẩn đoán đã được gửi
riêng. Nếu không có tuyến riêng tư đến chủ sở hữu, lệnh sẽ từ chối an toàn và yêu cầu
chủ sở hữu chạy lệnh từ tin nhắn trực tiếp.

Khi phiên đang hoạt động sử dụng bộ công cụ OpenAI Codex gốc, cùng một lần
phê duyệt thực thi cũng bao gồm việc tải phản hồi OpenAI lên cho các luồng Codex mà OpenClaw
biết. Việc tải lên này tách biệt với tệp zip Gateway cục bộ và chỉ
diễn ra đối với các phiên dùng bộ công cụ Codex. Lời nhắc phê duyệt nêu rõ rằng việc phê duyệt
cũng sẽ gửi phản hồi Codex mà không liệt kê id phiên hoặc luồng Codex. Sau khi
phê duyệt, phản hồi liệt kê các kênh, id phiên OpenClaw, id luồng Codex và
các lệnh tiếp tục cục bộ cho những luồng đã được gửi đến OpenAI. Từ chối hoặc
bỏ qua phê duyệt sẽ bỏ qua việc xuất, tải phản hồi Codex lên và
danh sách id Codex.

Điều này giúp vòng lặp gỡ lỗi Codex ngắn gọn: nhận thấy hành vi không đúng trong một kênh,
chạy `/diagnostics`, phê duyệt một lần, chia sẻ báo cáo, sau đó chạy cục bộ lệnh
`codex resume <thread-id>` đã in nếu bạn muốn tự kiểm tra
luồng. Xem [bộ công cụ Codex](/vi/plugins/codex-harness#inspect-codex-threads-locally).

## Nội dung của bản xuất

- `summary.md`: tổng quan dễ đọc cho bộ phận hỗ trợ.
- `diagnostics.json`: bản tóm tắt có thể đọc bằng máy về cấu hình, nhật ký, trạng thái, tình trạng hoạt động
  và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Cấu trúc cấu hình đã làm sạch và các chi tiết cấu hình không bí mật.
- Bản tóm tắt nhật ký đã làm sạch và các dòng nhật ký gần đây đã được che.
- Ảnh chụp trạng thái và tình trạng hoạt động Gateway theo khả năng tốt nhất.
- `stability/latest.json`: gói ổn định được lưu gần nhất, khi có.

Bản xuất vẫn hữu ích khi Gateway không hoạt động bình thường: nếu yêu cầu trạng thái/tình trạng hoạt động
thất bại, nhật ký cục bộ, cấu trúc cấu hình và gói ổn định mới nhất
vẫn được thu thập khi có.

## Mô hình quyền riêng tư

Được giữ lại: tên hệ thống con, id plugin, id nhà cung cấp, id kênh, các chế độ
đã cấu hình, mã trạng thái, khoảng thời gian, số byte, trạng thái hàng đợi, số liệu bộ nhớ,
siêu dữ liệu nhật ký đã làm sạch, thông báo vận hành đã che, cấu trúc cấu hình và
các thiết lập tính năng không bí mật.

Bị bỏ qua hoặc che: văn bản trò chuyện, prompt, hướng dẫn, nội dung Webhook, đầu ra
công cụ, thông tin xác thực, khóa API, token, cookie, giá trị bí mật, nội dung thô
của yêu cầu/phản hồi, id tài khoản, id tin nhắn, id phiên thô,
tên máy chủ và tên người dùng cục bộ.

Khi thông báo nhật ký có vẻ chứa văn bản payload của người dùng, cuộc trò chuyện, prompt hoặc công cụ,
bản xuất chỉ ghi nhận rằng một thông báo đã bị bỏ qua cùng với số byte của thông báo đó.

## Trình ghi độ ổn định

Theo mặc định, Gateway ghi lại một luồng ổn định có giới hạn, không chứa payload khi
chẩn đoán được bật. Luồng này ghi lại các dữ kiện vận hành, không phải nội dung.

Cùng một Heartbeat cũng lấy mẫu khả năng hoạt động khi vòng lặp sự kiện hoặc CPU có vẻ
bão hòa, phát ra các sự kiện `diagnostic.liveness.warning` với độ trễ vòng lặp sự kiện,
mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU, số phiên đang hoạt động/đang chờ/đang xếp hàng,
giai đoạn khởi động/runtime hiện tại (khi biết), các khoảng giai đoạn gần đây và
nhãn công việc có giới hạn. Các sự kiện này chỉ trở thành dòng nhật ký Gateway cấp
`warn` khi có công việc đang chờ hoặc xếp hàng, hoặc khi công việc đang hoạt động chồng lấn
với độ trễ vòng lặp sự kiện kéo dài; nếu không, chúng được ghi ở cấp `debug`. Các mẫu khả năng hoạt động khi rảnh vẫn được ghi lại
dưới dạng sự kiện chẩn đoán nhưng không bao giờ tự nâng cấp thành cảnh báo.

Các giai đoạn khởi động phát ra sự kiện `diagnostic.phase.completed` với thời gian theo đồng hồ thực và
thời gian CPU. Chẩn đoán lần chạy nhúng bị đình trệ đánh dấu `terminalProgressStale=true`
khi tiến trình cầu nối gần nhất có vẻ đã kết thúc (ví dụ: một mục phản hồi thô
hoặc sự kiện hoàn tất phản hồi) nhưng Gateway vẫn coi
lần chạy nhúng là đang hoạt động.

Kiểm tra trình ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói được lưu mới nhất sau khi thoát nghiêm trọng, hết thời gian chờ tắt hoặc
khởi động lại thất bại:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói được lưu mới nhất:

```bash
openclaw gateway stability --bundle latest --export
```

Các gói được lưu nằm trong `~/.openclaw/logs/stability/` khi có sự kiện.

## Các tùy chọn hữu ích

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Cờ                    | Mặc định                                                                       | Mô tả                                        |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Ghi vào một đường dẫn tệp zip (hoặc thư mục) cụ thể.       |
| `--log-lines <count>`   | `5000`                                                                        | Số dòng nhật ký đã làm sạch tối đa được đưa vào.            |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Số byte nhật ký tối đa cần kiểm tra.                      |
| `--url <url>`           | -                                                                             | URL WebSocket của Gateway cho ảnh chụp trạng thái/tình trạng hoạt động. |
| `--token <token>`       | -                                                                             | Token Gateway cho ảnh chụp trạng thái/tình trạng hoạt động.         |
| `--password <password>` | -                                                                             | Mật khẩu Gateway cho ảnh chụp trạng thái/tình trạng hoạt động.      |
| `--timeout <ms>`        | `3000`                                                                        | Thời gian chờ ảnh chụp trạng thái/tình trạng hoạt động.                    |
| `--no-stability-bundle` | tắt                                                                           | Bỏ qua việc tra cứu gói ổn định đã lưu.            |
| `--json`                | tắt                                                                           | In siêu dữ liệu xuất có thể đọc bằng máy.            |

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt trình ghi độ ổn định và
việc thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Việc tắt chẩn đoán làm giảm mức độ chi tiết của báo cáo lỗi; việc này không ảnh hưởng đến
hoạt động ghi nhật ký Gateway thông thường.

Các sự kiện áp lực bộ nhớ ghi lại RSS, heap, ngưỡng và dữ kiện tăng trưởng
(`rss_threshold`, `heap_threshold`, `rss_growth`) mà không thực hiện
quét hệ thống tệp hoặc ghi ảnh chụp trước OOM.

## Liên quan

- [Kiểm tra tình trạng hoạt động](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#rpc-method-families)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) - luồng riêng để truyền trực tuyến dữ liệu chẩn đoán đến một trình thu thập
