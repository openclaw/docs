---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi tình trạng Gateway bị sập, khởi động lại, áp lực bộ nhớ hoặc tải trọng quá lớn
    - Xem xét dữ liệu chẩn đoán nào được ghi lại hoặc được che giấu
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất dữ liệu chẩn đoán
x-i18n:
    generated_at: "2026-04-29T22:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một tệp zip chẩn đoán cục bộ cho báo cáo lỗi. Tệp này kết hợp
trạng thái Gateway đã được làm sạch, tình trạng, nhật ký, cấu trúc cấu hình và các sự kiện ổn định gần đây không chứa payload.

Hãy xử lý các gói chẩn đoán như bí mật cho đến khi bạn đã xem xét chúng. Chúng được
thiết kế để bỏ qua hoặc biên tập lại payload và thông tin xác thực, nhưng vẫn tóm tắt
nhật ký Gateway cục bộ và trạng thái runtime ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

Lệnh sẽ in ra đường dẫn tệp zip đã ghi. Để chọn đường dẫn:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Để tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh chat

Chủ sở hữu có thể dùng `/diagnostics [note]` trong chat để yêu cầu xuất Gateway cục bộ.
Dùng cách này khi lỗi xảy ra trong một cuộc trò chuyện thực tế và bạn muốn một
báo cáo có thể sao chép-dán cho bộ phận hỗ trợ:

1. Gửi `/diagnostics` trong cuộc trò chuyện nơi bạn nhận thấy vấn đề. Thêm một
   ghi chú ngắn nếu hữu ích, ví dụ `/diagnostics bad tool choice`.
2. OpenClaw gửi phần mở đầu chẩn đoán và yêu cầu một phê duyệt exec rõ ràng.
   Phê duyệt này chạy `openclaw gateway diagnostics export --json`.
   Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw trả lời bằng một báo cáo có thể dán, chứa đường dẫn
   gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư và các ID phiên liên quan.

Trong chat nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw không
đăng lại chi tiết chẩn đoán vào chat chung. Nó gửi phần mở đầu, lời nhắc phê duyệt,
kết quả xuất Gateway và phân tích phiên/luồng Codex cho chủ sở hữu qua tuyến phê duyệt riêng tư.
Nhóm chỉ nhận được một thông báo ngắn rằng luồng chẩn đoán đã được gửi riêng. Nếu OpenClaw không tìm thấy
tuyến riêng tư của chủ sở hữu, lệnh sẽ thất bại đóng và yêu cầu chủ sở hữu chạy lệnh từ DM.

Khi phiên OpenClaw đang hoạt động sử dụng native OpenAI Codex harness,
cùng phê duyệt exec đó cũng bao gồm một lượt tải phản hồi OpenAI lên cho các luồng runtime Codex
mà OpenClaw biết. Lượt tải lên đó tách biệt với tệp zip Gateway cục bộ và chỉ xuất hiện
cho các phiên Codex harness. Trước khi phê duyệt, lời nhắc giải thích rằng việc phê duyệt chẩn đoán
cũng sẽ gửi phản hồi Codex, nhưng không liệt kê ID phiên hoặc ID luồng Codex. Sau khi phê duyệt,
phản hồi chat liệt kê các kênh, ID phiên OpenClaw, ID luồng Codex và các lệnh tiếp tục cục bộ
cho những luồng đã được gửi đến máy chủ OpenAI. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không chạy lượt xuất, không gửi phản hồi Codex và không in các ID Codex.

Điều đó làm cho vòng lặp gỡ lỗi Codex phổ biến trở nên ngắn gọn: nhận thấy hành vi sai trong
Telegram, Discord hoặc kênh khác, chạy `/diagnostics`, phê duyệt một lần, chia sẻ
báo cáo với bộ phận hỗ trợ, rồi chạy lệnh `codex resume <thread-id>` được in ra
cục bộ nếu bạn muốn tự kiểm tra luồng Codex gốc. Xem
[Codex harness](/vi/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) để biết
quy trình kiểm tra đó.

## Nội dung của lượt xuất

Tệp zip bao gồm:

- `summary.md`: tổng quan dễ đọc cho bộ phận hỗ trợ.
- `diagnostics.json`: tóm tắt máy đọc được về cấu hình, nhật ký, trạng thái, tình trạng
  và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Cấu trúc cấu hình đã được làm sạch và chi tiết cấu hình không bí mật.
- Tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được biên tập lại.
- Ảnh chụp nhanh trạng thái và tình trạng Gateway theo nỗ lực tốt nhất.
- `stability/latest.json`: gói ổn định được lưu gần đây nhất, khi có.

Lượt xuất vẫn hữu ích ngay cả khi Gateway không khỏe. Nếu Gateway không thể
trả lời các yêu cầu trạng thái hoặc tình trạng, nhật ký cục bộ, cấu trúc cấu hình và
gói ổn định mới nhất vẫn được thu thập khi có.

## Mô hình quyền riêng tư

Chẩn đoán được thiết kế để có thể chia sẻ. Lượt xuất giữ lại dữ liệu vận hành
hữu ích cho việc gỡ lỗi, chẳng hạn như:

- tên hệ thống con, ID Plugin, ID nhà cung cấp, ID kênh và các chế độ đã cấu hình
- mã trạng thái, thời lượng, số byte, trạng thái hàng đợi và chỉ số bộ nhớ
- siêu dữ liệu nhật ký đã được làm sạch và thông điệp vận hành đã được biên tập lại
- cấu trúc cấu hình và cài đặt tính năng không bí mật

Lượt xuất bỏ qua hoặc biên tập lại:

- văn bản chat, prompt, chỉ dẫn, phần thân webhook và đầu ra công cụ
- thông tin xác thực, khóa API, token, cookie và giá trị bí mật
- phần thân yêu cầu hoặc phản hồi thô
- ID tài khoản, ID tin nhắn, ID phiên thô, tên máy chủ và tên người dùng cục bộ

Khi một thông điệp nhật ký trông giống văn bản người dùng, chat, prompt hoặc payload công cụ,
lượt xuất chỉ giữ lại thông tin rằng một thông điệp đã bị bỏ qua và số byte.

## Bộ ghi ổn định

Gateway ghi một luồng ổn định có giới hạn, không chứa payload theo mặc định khi
chẩn đoán được bật. Luồng này dành cho các dữ kiện vận hành, không phải nội dung.

Cùng Heartbeat chẩn đoán đó ghi lại các cảnh báo về khả năng hoạt động khi Gateway tiếp tục
chạy nhưng vòng lặp sự kiện Node.js hoặc CPU có vẻ bị bão hòa. Các sự kiện
`diagnostic.liveness.warning` này bao gồm độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện,
tỷ lệ lõi CPU và số phiên đang hoạt động/đang chờ/đang xếp hàng. Chúng không tự
khởi động lại Gateway.

Kiểm tra bộ ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói ổn định được lưu mới nhất sau một lần thoát nghiêm trọng, hết thời gian chờ tắt
hoặc lỗi khởi động lại:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói được lưu mới nhất:

```bash
openclaw gateway stability --bundle latest --export
```

Các gói được lưu nằm dưới `~/.openclaw/logs/stability/` khi có sự kiện.

## Tùy chọn hữu ích

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: ghi vào một đường dẫn tệp zip cụ thể.
- `--log-lines <count>`: số dòng nhật ký đã làm sạch tối đa cần bao gồm.
- `--log-bytes <bytes>`: số byte nhật ký tối đa cần kiểm tra.
- `--url <url>`: URL WebSocket Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--token <token>`: token Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--password <password>`: mật khẩu Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--timeout <ms>`: thời gian chờ ảnh chụp nhanh trạng thái và tình trạng.
- `--no-stability-bundle`: bỏ qua tra cứu gói ổn định đã lưu.
- `--json`: in siêu dữ liệu xuất máy đọc được.

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt bộ ghi ổn định và
thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tắt chẩn đoán làm giảm chi tiết báo cáo lỗi. Việc này không ảnh hưởng đến
ghi nhật ký Gateway thông thường.

## Liên quan

- [Kiểm tra tình trạng](/vi/gateway/health)
- [Gateway CLI](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#system-and-identity)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — luồng riêng để truyền chẩn đoán đến bộ thu
