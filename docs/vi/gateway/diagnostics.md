---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi sự cố Gateway bị sập, khởi động lại, chịu áp lực bộ nhớ hoặc có tải trọng quá lớn
    - Xem lại dữ liệu chẩn đoán nào được ghi lại hoặc che giấu
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ để báo cáo lỗi
title: Xuất dữ liệu chẩn đoán
x-i18n:
    generated_at: "2026-07-12T07:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo tệp chẩn đoán `.zip` cục bộ cho báo cáo lỗi: trạng thái Gateway
đã được làm sạch, tình trạng hoạt động, nhật ký, cấu trúc cấu hình và các sự kiện ổn định
gần đây không chứa payload.

Hãy coi các gói chẩn đoán như thông tin bí mật cho đến khi được xem xét. Theo thiết kế,
payload và thông tin xác thực được che đi, nhưng gói này vẫn tóm tắt nhật ký Gateway cục bộ
và trạng thái thời gian chạy ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

In ra đường dẫn của tệp zip đã ghi. Chọn đường dẫn đầu ra:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Để tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh trò chuyện

Chủ sở hữu có thể chạy `/diagnostics [note]` trong bất kỳ cuộc trò chuyện nào để yêu cầu
Gateway xuất cục bộ một báo cáo hỗ trợ có thể sao chép và dán nguyên khối:

1. Gửi `/diagnostics`, tùy chọn kèm ghi chú ngắn (`/diagnostics lựa chọn công cụ không phù hợp`).
2. OpenClaw gửi lời mở đầu và yêu cầu một lần phê duyệt thực thi rõ ràng để chạy
   `openclaw gateway diagnostics export --json`. Không phê duyệt chẩn đoán bằng
   quy tắc cho phép tất cả.
3. Sau khi được phê duyệt, OpenClaw phản hồi bằng đường dẫn gói cục bộ, bản tóm tắt
   manifest, ghi chú về quyền riêng tư và các ID phiên liên quan.

Trong cuộc trò chuyện nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw gửi
riêng cho chủ sở hữu kết quả xuất, lời nhắc phê duyệt và thông tin phân tách phiên/luồng Codex.
Nhóm chỉ thấy một thông báo ngắn rằng dữ liệu chẩn đoán đã được gửi riêng. Nếu không có
tuyến riêng đến chủ sở hữu, lệnh sẽ từ chối an toàn và yêu cầu chủ sở hữu chạy lệnh từ tin nhắn trực tiếp.

Khi phiên đang hoạt động sử dụng bộ khung OpenAI Codex gốc, cùng một lần phê duyệt thực thi
cũng bao gồm việc tải phản hồi lên OpenAI cho các luồng Codex mà OpenClaw biết đến. Việc tải lên
này tách biệt với tệp zip Gateway cục bộ và chỉ diễn ra đối với các phiên dùng bộ khung Codex.
Lời nhắc phê duyệt nêu rõ rằng việc phê duyệt cũng gửi phản hồi Codex, nhưng không liệt kê
ID phiên hoặc ID luồng Codex. Sau khi phê duyệt, phản hồi liệt kê các kênh, ID phiên OpenClaw,
ID luồng Codex và các lệnh tiếp tục cục bộ cho những luồng đã được gửi đến OpenAI. Việc từ chối
hoặc bỏ qua phê duyệt sẽ bỏ qua thao tác xuất, tải phản hồi Codex lên và danh sách ID Codex.

Điều này giúp vòng lặp gỡ lỗi Codex ngắn gọn: nhận thấy hành vi không phù hợp trong một kênh,
chạy `/diagnostics`, phê duyệt một lần, chia sẻ báo cáo, sau đó chạy cục bộ lệnh
`codex resume <thread-id>` đã được in nếu bạn muốn tự kiểm tra luồng.
Xem [Bộ khung Codex](/vi/plugins/codex-harness#inspect-codex-threads-locally).

## Nội dung của bản xuất

- `summary.md`: tổng quan dễ đọc dành cho bộ phận hỗ trợ.
- `diagnostics.json`: bản tóm tắt có thể đọc bằng máy về cấu hình, nhật ký, trạng thái,
  tình trạng hoạt động và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Cấu trúc cấu hình đã được làm sạch và các chi tiết cấu hình không bí mật.
- Bản tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được che thông tin.
- Ảnh chụp nhanh trạng thái và tình trạng hoạt động của Gateway theo khả năng tốt nhất.
- `stability/latest.json`: gói ổn định được lưu mới nhất, khi có.

Bản xuất vẫn hữu ích khi Gateway không hoạt động bình thường: nếu yêu cầu trạng thái/tình trạng
hoạt động thất bại, nhật ký cục bộ, cấu trúc cấu hình và gói ổn định mới nhất vẫn được thu thập
khi có thể.

## Mô hình quyền riêng tư

Được giữ lại: tên hệ thống con, ID plugin, ID nhà cung cấp, ID kênh, các chế độ đã cấu hình,
mã trạng thái, khoảng thời gian, số byte, trạng thái hàng đợi, số liệu bộ nhớ, siêu dữ liệu
nhật ký đã được làm sạch, thông báo vận hành đã được che thông tin, cấu trúc cấu hình và
các thiết lập tính năng không bí mật.

Bị lược bỏ hoặc che thông tin: nội dung trò chuyện, lời nhắc, chỉ dẫn, phần thân webhook,
đầu ra công cụ, thông tin xác thực, khóa API, token, cookie, giá trị bí mật, phần thân
yêu cầu/phản hồi thô, ID tài khoản, ID tin nhắn, ID phiên thô, tên máy chủ và tên người dùng cục bộ.

Khi một thông báo nhật ký có vẻ chứa văn bản từ người dùng, cuộc trò chuyện, lời nhắc hoặc
payload của công cụ, bản xuất chỉ ghi nhận rằng thông báo đã bị lược bỏ cùng với số byte của nó.

## Bộ ghi ổn định

Theo mặc định, Gateway ghi lại một luồng ổn định có giới hạn và không chứa payload khi
chẩn đoán được bật. Luồng này ghi nhận các dữ kiện vận hành, không ghi nhận nội dung.

Cùng Heartbeat đó cũng lấy mẫu khả năng hoạt động khi vòng lặp sự kiện hoặc CPU có vẻ
bị bão hòa, phát ra các sự kiện `diagnostic.liveness.warning` kèm độ trễ vòng lặp sự kiện,
mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU, số phiên đang hoạt động/đang chờ/đã xếp hàng,
giai đoạn khởi động/thời gian chạy hiện tại (khi biết), các khoảng giai đoạn gần đây và
nhãn công việc có giới hạn. Những sự kiện này chỉ trở thành các dòng nhật ký Gateway
ở mức `warn` khi có công việc đang chờ hoặc đã xếp hàng, hoặc khi công việc đang hoạt động
trùng với độ trễ vòng lặp sự kiện kéo dài; nếu không, chúng được ghi ở mức `debug`.
Các mẫu khả năng hoạt động khi nhàn rỗi vẫn được ghi dưới dạng sự kiện chẩn đoán nhưng
không bao giờ tự nâng lên thành cảnh báo.

Các giai đoạn khởi động phát ra sự kiện `diagnostic.phase.completed` kèm thời gian thực tế
và thời gian CPU. Chẩn đoán lượt chạy nhúng bị đình trệ đánh dấu `terminalProgressStale=true`
khi tiến trình cầu nối gần nhất có vẻ đã kết thúc (ví dụ: một mục phản hồi thô hoặc sự kiện
hoàn tất phản hồi), nhưng Gateway vẫn coi lượt chạy nhúng là đang hoạt động.

Kiểm tra bộ ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói được lưu mới nhất sau khi thoát nghiêm trọng, hết thời gian chờ khi tắt hoặc
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

| Cờ                      | Mặc định                                                                      | Mô tả                                                        |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Ghi vào đường dẫn tệp zip (hoặc thư mục) cụ thể.              |
| `--log-lines <count>`   | `5000`                                                                        | Số dòng nhật ký đã được làm sạch tối đa được đưa vào.         |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Số byte nhật ký tối đa cần kiểm tra.                          |
| `--url <url>`           | -                                                                             | URL WebSocket của Gateway cho ảnh chụp trạng thái/tình trạng. |
| `--token <token>`       | -                                                                             | Token Gateway cho ảnh chụp trạng thái/tình trạng.             |
| `--password <password>` | -                                                                             | Mật khẩu Gateway cho ảnh chụp trạng thái/tình trạng.          |
| `--timeout <ms>`        | `3000`                                                                        | Thời gian chờ ảnh chụp trạng thái/tình trạng.                 |
| `--no-stability-bundle` | tắt                                                                           | Bỏ qua việc tìm kiếm gói ổn định đã được lưu.                 |
| `--json`                | tắt                                                                           | In siêu dữ liệu xuất có thể đọc bằng máy.                     |

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt bộ ghi ổn định và việc thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Việc tắt chẩn đoán làm giảm mức độ chi tiết của báo cáo lỗi; việc này không ảnh hưởng đến
hoạt động ghi nhật ký Gateway thông thường.

Theo mặc định, ảnh chụp nhanh khi áp lực bộ nhớ ở mức nghiêm trọng bị tắt. Để ghi lại
ảnh chụp nhanh ổn định trước OOM ngoài các sự kiện chẩn đoán thông thường:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Chỉ sử dụng tùy chọn này trên các máy chủ có thể chịu được việc quét hệ thống tệp bổ sung
và ghi ảnh chụp nhanh trong lúc áp lực bộ nhớ ở mức nghiêm trọng. Các sự kiện áp lực bộ nhớ
thông thường vẫn ghi lại RSS, heap, ngưỡng và dữ kiện tăng trưởng (`rss_threshold`,
`heap_threshold`, `rss_growth`) khi ảnh chụp nhanh bị tắt.

## Liên quan

- [Kiểm tra tình trạng hoạt động](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#rpc-method-families)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) - luồng riêng để truyền trực tuyến dữ liệu chẩn đoán đến bộ thu thập
