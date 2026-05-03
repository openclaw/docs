---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi sự cố Gateway bị sập, khởi động lại, áp lực bộ nhớ hoặc tải dữ liệu quá lớn
    - Xem xét dữ liệu chẩn đoán nào được ghi lại hoặc được che giấu
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất thông tin chẩn đoán
x-i18n:
    generated_at: "2026-05-03T21:31:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một tệp zip chẩn đoán cục bộ cho báo cáo lỗi. Tệp này kết hợp trạng thái Gateway đã được làm sạch, tình trạng, nhật ký, hình dạng cấu hình và các sự kiện ổn định gần đây không chứa payload.

Hãy xử lý các gói chẩn đoán như bí mật cho đến khi bạn đã xem xét chúng. Chúng được thiết kế để bỏ qua hoặc biên tập payload và thông tin xác thực, nhưng vẫn tóm tắt nhật ký Gateway cục bộ và trạng thái runtime cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

Lệnh này in ra đường dẫn zip đã ghi. Để chọn một đường dẫn:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Cho tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh chat

Chủ sở hữu có thể dùng `/diagnostics [note]` trong chat để yêu cầu xuất Gateway cục bộ.
Dùng lệnh này khi lỗi xảy ra trong một cuộc trò chuyện thật và bạn muốn có một báo cáo có thể sao chép-dán cho bộ phận hỗ trợ:

1. Gửi `/diagnostics` trong cuộc trò chuyện nơi bạn nhận thấy vấn đề. Thêm một ghi chú ngắn nếu hữu ích, ví dụ `/diagnostics bad tool choice`.
2. OpenClaw gửi phần mở đầu chẩn đoán và yêu cầu một phê duyệt exec rõ ràng. Phê duyệt này chạy `openclaw gateway diagnostics export --json`.
   Không phê duyệt chẩn đoán thông qua quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw trả lời bằng một báo cáo có thể dán, chứa đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư và các ID phiên liên quan.

Trong chat nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw không đăng chi tiết chẩn đoán trở lại chat chung. Nó gửi phần mở đầu, lời nhắc phê duyệt, kết quả xuất Gateway và phân tích phiên/luồng Codex cho chủ sở hữu thông qua tuyến phê duyệt riêng tư. Nhóm chỉ nhận được một thông báo ngắn rằng quy trình chẩn đoán đã được gửi riêng. Nếu OpenClaw không tìm thấy tuyến riêng tư đến chủ sở hữu, lệnh sẽ đóng an toàn và yêu cầu chủ sở hữu chạy lệnh từ DM.

Khi phiên OpenClaw đang hoạt động sử dụng harness OpenAI Codex gốc, cùng phê duyệt exec đó cũng bao gồm một lượt tải phản hồi OpenAI lên cho các luồng runtime Codex mà OpenClaw biết. Lượt tải lên đó tách biệt với tệp zip Gateway cục bộ và chỉ xuất hiện cho các phiên harness Codex. Trước khi phê duyệt, lời nhắc giải thích rằng việc phê duyệt chẩn đoán cũng sẽ gửi phản hồi Codex, nhưng không liệt kê ID phiên hoặc luồng Codex. Sau khi phê duyệt, phản hồi chat liệt kê các kênh, ID phiên OpenClaw, ID luồng Codex và lệnh resume cục bộ cho các luồng đã được gửi đến máy chủ OpenAI. Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không chạy xuất, không gửi phản hồi Codex và không in các ID Codex.

Điều đó làm cho vòng lặp gỡ lỗi Codex phổ biến trở nên ngắn gọn: nhận thấy hành vi sai trong Telegram, Discord hoặc một kênh khác, chạy `/diagnostics`, phê duyệt một lần, chia sẻ báo cáo với bộ phận hỗ trợ, rồi chạy lệnh `codex resume <thread-id>` đã in ở cục bộ nếu bạn muốn tự kiểm tra luồng Codex gốc. Xem [harness Codex](/vi/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) để biết quy trình kiểm tra đó.

## Nội dung bản xuất

Tệp zip bao gồm:

- `summary.md`: tổng quan dễ đọc cho bộ phận hỗ trợ.
- `diagnostics.json`: tóm tắt đọc được bằng máy về cấu hình, nhật ký, trạng thái, tình trạng và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Hình dạng cấu hình đã được làm sạch và chi tiết cấu hình không bí mật.
- Tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được biên tập.
- Ảnh chụp nhanh trạng thái và tình trạng Gateway theo nỗ lực tốt nhất.
- `stability/latest.json`: gói ổn định mới nhất đã được lưu, khi có.

Bản xuất vẫn hữu ích ngay cả khi Gateway không khỏe. Nếu Gateway không thể trả lời yêu cầu trạng thái hoặc tình trạng, nhật ký cục bộ, hình dạng cấu hình và gói ổn định mới nhất vẫn được thu thập khi có.

## Mô hình quyền riêng tư

Chẩn đoán được thiết kế để có thể chia sẻ. Bản xuất giữ lại dữ liệu vận hành giúp gỡ lỗi, chẳng hạn như:

- tên phân hệ, ID Plugin, ID nhà cung cấp, ID kênh và các chế độ đã cấu hình
- mã trạng thái, thời lượng, số byte, trạng thái hàng đợi và chỉ số bộ nhớ
- siêu dữ liệu nhật ký đã được làm sạch và thông điệp vận hành đã được biên tập
- hình dạng cấu hình và thiết lập tính năng không bí mật

Bản xuất bỏ qua hoặc biên tập:

- văn bản chat, prompt, chỉ dẫn, phần thân Webhook và đầu ra công cụ
- thông tin xác thực, khóa API, token, cookie và giá trị bí mật
- phần thân yêu cầu hoặc phản hồi thô
- ID tài khoản, ID tin nhắn, ID phiên thô, tên máy chủ và tên người dùng cục bộ

Khi một thông điệp nhật ký trông giống văn bản payload của người dùng, chat, prompt hoặc công cụ, bản xuất chỉ giữ lại thông tin rằng một thông điệp đã bị bỏ qua và số byte.

## Bộ ghi ổn định

Gateway mặc định ghi lại một luồng ổn định có giới hạn, không chứa payload khi chẩn đoán được bật. Luồng này dành cho các sự kiện vận hành, không dành cho nội dung.

Cùng Heartbeat chẩn đoán đó ghi lại mẫu liveness khi Gateway vẫn tiếp tục chạy nhưng vòng lặp sự kiện Node.js hoặc CPU có vẻ bị bão hòa. Các sự kiện `diagnostic.liveness.warning` này bao gồm độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU và số lượng phiên đang hoạt động/đang chờ/đã xếp hàng. Các mẫu nhàn rỗi ở lại trong telemetry ở mức `info`. Mẫu liveness chỉ trở thành cảnh báo Gateway khi có công việc đang chờ hoặc đã xếp hàng, hoặc khi công việc đang hoạt động trùng với độ trễ vòng lặp sự kiện kéo dài. Các đột biến độ trễ tối đa thoáng qua trong lúc công việc nền vẫn khỏe mạnh sẽ ở lại trong nhật ký debug. Chúng không tự khởi động lại Gateway.

Kiểm tra bộ ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói ổn định mới nhất đã được lưu sau một lần thoát nghiêm trọng, timeout khi tắt hoặc lỗi khởi động sau restart:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói đã lưu mới nhất:

```bash
openclaw gateway stability --bundle latest --export
```

Các gói đã lưu nằm dưới `~/.openclaw/logs/stability/` khi có sự kiện.

## Tùy chọn hữu ích

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: ghi vào một đường dẫn zip cụ thể.
- `--log-lines <count>`: số dòng nhật ký đã làm sạch tối đa cần đưa vào.
- `--log-bytes <bytes>`: số byte nhật ký tối đa cần kiểm tra.
- `--url <url>`: URL WebSocket Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--token <token>`: token Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--password <password>`: mật khẩu Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--timeout <ms>`: timeout ảnh chụp nhanh trạng thái và tình trạng.
- `--no-stability-bundle`: bỏ qua tra cứu gói ổn định đã lưu.
- `--json`: in siêu dữ liệu xuất đọc được bằng máy.

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

- [Kiểm tra tình trạng](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#system-and-identity)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — quy trình riêng để truyền trực tuyến chẩn đoán đến một bộ thu
