---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi Gateway bị sập, khởi động lại, áp lực bộ nhớ hoặc payload quá lớn
    - Xem lại dữ liệu chẩn đoán nào được ghi lại hoặc được ẩn bớt
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất thông tin chẩn đoán
x-i18n:
    generated_at: "2026-05-05T01:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một tệp zip chẩn đoán cục bộ cho báo cáo lỗi. Tệp này kết hợp trạng thái Gateway đã được làm sạch, sức khỏe, nhật ký, hình dạng cấu hình và các sự kiện ổn định gần đây không chứa payload.

Hãy xử lý các gói chẩn đoán như bí mật cho đến khi bạn đã xem xét chúng. Chúng được thiết kế để bỏ qua hoặc biên tập payload và thông tin xác thực, nhưng vẫn tóm tắt nhật ký Gateway cục bộ và trạng thái runtime ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

Lệnh sẽ in đường dẫn tệp zip đã ghi. Để chọn đường dẫn:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Cho tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh chat

Chủ sở hữu có thể dùng `/diagnostics [note]` trong chat để yêu cầu xuất Gateway cục bộ. Dùng lệnh này khi lỗi xảy ra trong một cuộc trò chuyện thật và bạn muốn một báo cáo có thể sao chép-dán cho bộ phận hỗ trợ:

1. Gửi `/diagnostics` trong cuộc trò chuyện nơi bạn nhận thấy vấn đề. Thêm một ghi chú ngắn nếu hữu ích, ví dụ `/diagnostics bad tool choice`.
2. OpenClaw gửi phần mở đầu chẩn đoán và yêu cầu một phê duyệt exec rõ ràng. Phê duyệt này chạy `openclaw gateway diagnostics export --json`. Không phê duyệt chẩn đoán qua quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw trả lời bằng một báo cáo có thể dán, chứa đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư và các id phiên liên quan.

Trong chat nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw không đăng chi tiết chẩn đoán trở lại chat chung. Nó gửi phần mở đầu, lời nhắc phê duyệt, kết quả xuất Gateway và phân tích phiên/luồng Codex cho chủ sở hữu qua tuyến phê duyệt riêng tư. Nhóm chỉ nhận được một thông báo ngắn rằng luồng chẩn đoán đã được gửi riêng tư. Nếu OpenClaw không tìm thấy tuyến riêng tư tới chủ sở hữu, lệnh sẽ thất bại đóng và yêu cầu chủ sở hữu chạy lệnh từ DM.

Khi phiên OpenClaw đang hoạt động dùng harness OpenAI Codex gốc, cùng phê duyệt exec đó cũng bao gồm việc tải phản hồi OpenAI lên cho các luồng runtime Codex mà OpenClaw biết. Việc tải lên đó tách biệt với tệp zip Gateway cục bộ và chỉ xuất hiện cho các phiên harness Codex. Trước khi phê duyệt, lời nhắc giải thích rằng phê duyệt chẩn đoán cũng sẽ gửi phản hồi Codex, nhưng không liệt kê id phiên hoặc luồng Codex. Sau khi phê duyệt, phản hồi trong chat liệt kê các kênh, id phiên OpenClaw, id luồng Codex và các lệnh tiếp tục cục bộ cho những luồng đã được gửi tới máy chủ OpenAI. Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không chạy xuất, không gửi phản hồi Codex và không in các id Codex.

Điều đó làm cho vòng lặp gỡ lỗi Codex phổ biến trở nên ngắn gọn: nhận thấy hành vi sai trong Telegram, Discord hoặc kênh khác, chạy `/diagnostics`, phê duyệt một lần, chia sẻ báo cáo với bộ phận hỗ trợ, rồi chạy lệnh `codex resume <thread-id>` đã in ở cục bộ nếu bạn muốn tự kiểm tra luồng Codex gốc. Xem [harness Codex](/vi/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) để biết quy trình kiểm tra đó.

## Nội dung bản xuất chứa

Tệp zip bao gồm:

- `summary.md`: tổng quan dễ đọc cho con người dành cho bộ phận hỗ trợ.
- `diagnostics.json`: tóm tắt máy có thể đọc về cấu hình, nhật ký, trạng thái, sức khỏe và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Hình dạng cấu hình đã được làm sạch và chi tiết cấu hình không bí mật.
- Tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được biên tập.
- Ảnh chụp nhanh trạng thái và sức khỏe Gateway theo nỗ lực tốt nhất.
- `stability/latest.json`: gói ổn định mới nhất đã được lưu, khi có sẵn.

Bản xuất vẫn hữu ích ngay cả khi Gateway không khỏe. Nếu Gateway không thể trả lời các yêu cầu trạng thái hoặc sức khỏe, nhật ký cục bộ, hình dạng cấu hình và gói ổn định mới nhất vẫn được thu thập khi có sẵn.

## Mô hình quyền riêng tư

Chẩn đoán được thiết kế để có thể chia sẻ. Bản xuất giữ dữ liệu vận hành hỗ trợ gỡ lỗi, chẳng hạn như:

- tên hệ thống con, id plugin, id provider, id kênh và các chế độ đã cấu hình
- mã trạng thái, thời lượng, số byte, trạng thái hàng đợi và chỉ số bộ nhớ
- siêu dữ liệu nhật ký đã được làm sạch và thông báo vận hành đã được biên tập
- hình dạng cấu hình và thiết lập tính năng không bí mật

Bản xuất bỏ qua hoặc biên tập:

- văn bản chat, prompt, chỉ dẫn, thân Webhook và đầu ra công cụ
- thông tin xác thực, khóa API, token, cookie và giá trị bí mật
- thân yêu cầu hoặc phản hồi thô
- id tài khoản, id tin nhắn, id phiên thô, tên máy chủ và tên người dùng cục bộ

Khi một thông báo nhật ký trông giống văn bản người dùng, chat, prompt hoặc payload công cụ, bản xuất chỉ giữ lại rằng một thông báo đã bị bỏ qua và số byte.

## Bộ ghi ổn định

Gateway ghi một luồng ổn định có giới hạn, không chứa payload theo mặc định khi chẩn đoán được bật. Luồng này dành cho các sự kiện vận hành, không phải nội dung.

Cùng Heartbeat chẩn đoán đó ghi các mẫu liveness khi Gateway tiếp tục chạy nhưng vòng lặp sự kiện Node.js hoặc CPU có vẻ bão hòa. Các sự kiện `diagnostic.liveness.warning` này bao gồm độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU, số phiên đang hoạt động/đang chờ/đang xếp hàng, giai đoạn khởi động/runtime hiện tại khi biết, các khoảng giai đoạn gần đây và nhãn công việc đang hoạt động/đang xếp hàng có giới hạn. Các mẫu rảnh vẫn ở trong telemetry ở cấp `info`. Các mẫu liveness chỉ trở thành cảnh báo Gateway khi có công việc đang chờ hoặc đang xếp hàng, hoặc khi công việc đang hoạt động trùng với độ trễ vòng lặp sự kiện kéo dài. Các đột biến độ trễ tối đa thoáng qua trong lúc công việc nền vẫn khỏe mạnh sẽ ở trong nhật ký gỡ lỗi. Chúng không tự khởi động lại Gateway.

Các giai đoạn khởi động cũng phát sự kiện `diagnostic.phase.completed` với thời gian đồng hồ và thời gian CPU. Chẩn đoán embedded-run bị kẹt đánh dấu `terminalProgressStale=true` khi tiến trình bridge cuối cùng trông như đã kết thúc, chẳng hạn một mục phản hồi thô hoặc sự kiện hoàn tất phản hồi, nhưng Gateway vẫn xem lần chạy nhúng là đang hoạt động.

Kiểm tra bộ ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói ổn định mới nhất đã được lưu sau khi thoát nghiêm trọng, hết thời gian chờ tắt hoặc lỗi khởi động lại:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói mới nhất đã được lưu:

```bash
openclaw gateway stability --bundle latest --export
```

Các gói đã lưu nằm trong `~/.openclaw/logs/stability/` khi có sự kiện.

## Tùy chọn hữu ích

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: ghi vào một đường dẫn zip cụ thể.
- `--log-lines <count>`: số dòng nhật ký đã được làm sạch tối đa cần đưa vào.
- `--log-bytes <bytes>`: số byte nhật ký tối đa cần kiểm tra.
- `--url <url>`: URL WebSocket Gateway cho ảnh chụp nhanh trạng thái và sức khỏe.
- `--token <token>`: token Gateway cho ảnh chụp nhanh trạng thái và sức khỏe.
- `--password <password>`: mật khẩu Gateway cho ảnh chụp nhanh trạng thái và sức khỏe.
- `--timeout <ms>`: thời gian chờ ảnh chụp nhanh trạng thái và sức khỏe.
- `--no-stability-bundle`: bỏ qua tra cứu gói ổn định đã lưu.
- `--json`: in siêu dữ liệu xuất máy có thể đọc.

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt bộ ghi ổn định và thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tắt chẩn đoán làm giảm chi tiết báo cáo lỗi. Việc này không ảnh hưởng đến ghi nhật ký Gateway thông thường.

## Liên quan

- [Kiểm tra sức khỏe](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#system-and-identity)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — luồng riêng để truyền chẩn đoán tới collector
