---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi sự cố sập Gateway, khởi động lại, áp lực bộ nhớ hoặc tải dữ liệu quá lớn
    - Xem lại dữ liệu chẩn đoán nào được ghi lại hoặc được che đi
summary: Tạo các gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất dữ liệu chẩn đoán
x-i18n:
    generated_at: "2026-05-02T10:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một tệp zip chẩn đoán cục bộ cho báo cáo lỗi. Tệp này kết hợp
trạng thái Gateway đã được làm sạch, tình trạng hoạt động, nhật ký, hình dạng cấu hình và các sự kiện
ổn định gần đây không chứa payload.

Hãy xử lý các gói chẩn đoán như bí mật cho đến khi bạn đã xem xét chúng. Chúng được
thiết kế để bỏ qua hoặc biên tập payload và thông tin xác thực, nhưng vẫn tóm tắt
nhật ký Gateway cục bộ và trạng thái runtime ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

Lệnh này in ra đường dẫn zip đã được ghi. Để chọn đường dẫn:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Cho tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh chat

Chủ sở hữu có thể dùng `/diagnostics [note]` trong chat để yêu cầu xuất Gateway cục bộ.
Dùng lệnh này khi lỗi xảy ra trong một cuộc trò chuyện thực và bạn muốn có một
báo cáo có thể sao chép-dán cho bộ phận hỗ trợ:

1. Gửi `/diagnostics` trong cuộc trò chuyện nơi bạn phát hiện vấn đề. Thêm một
   ghi chú ngắn nếu hữu ích, ví dụ `/diagnostics bad tool choice`.
2. OpenClaw gửi phần mở đầu chẩn đoán và yêu cầu một phê duyệt exec rõ ràng.
   Phê duyệt này chạy `openclaw gateway diagnostics export --json`.
   Không phê duyệt chẩn đoán thông qua quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw trả lời bằng một báo cáo có thể dán, chứa đường dẫn
   gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư và các ID phiên liên quan.

Trong chat nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw không
đăng chi tiết chẩn đoán trở lại chat chung. Nó gửi phần mở đầu, lời nhắc phê duyệt,
kết quả xuất Gateway và phân tích phiên/luồng Codex cho chủ sở hữu thông qua
tuyến phê duyệt riêng tư. Nhóm chỉ nhận một thông báo ngắn rằng luồng chẩn đoán
đã được gửi riêng tư. Nếu OpenClaw không tìm thấy tuyến chủ sở hữu riêng tư,
lệnh sẽ thất bại theo hướng đóng và yêu cầu chủ sở hữu chạy lệnh từ DM.

Khi phiên OpenClaw đang hoạt động sử dụng bộ điều khiển OpenAI Codex gốc,
cùng phê duyệt exec đó cũng bao gồm việc tải phản hồi OpenAI lên cho các luồng
runtime Codex mà OpenClaw biết. Việc tải lên đó tách biệt với tệp zip Gateway
cục bộ và chỉ xuất hiện cho các phiên bộ điều khiển Codex. Trước khi phê duyệt,
lời nhắc giải thích rằng việc phê duyệt chẩn đoán cũng sẽ gửi phản hồi Codex, nhưng
không liệt kê ID phiên hoặc luồng Codex. Sau khi phê duyệt, câu trả lời trong chat
liệt kê các kênh, ID phiên OpenClaw, ID luồng Codex và các lệnh tiếp tục cục bộ
cho những luồng đã được gửi đến máy chủ OpenAI. Nếu bạn từ chối hoặc bỏ qua
phê duyệt, OpenClaw không chạy xuất dữ liệu, không gửi phản hồi Codex và
không in các ID Codex.

Điều đó làm cho vòng lặp gỡ lỗi Codex phổ biến trở nên ngắn gọn: nhận thấy hành vi lỗi trong
Telegram, Discord hoặc kênh khác, chạy `/diagnostics`, phê duyệt một lần, chia sẻ
báo cáo với bộ phận hỗ trợ, rồi chạy lệnh `codex resume <thread-id>` đã in
cục bộ nếu bạn muốn tự kiểm tra luồng Codex gốc. Xem
[Bộ điều khiển Codex](/vi/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) để biết
quy trình kiểm tra đó.

## Nội dung bản xuất

Tệp zip bao gồm:

- `summary.md`: tổng quan dễ đọc cho bộ phận hỗ trợ.
- `diagnostics.json`: tóm tắt dạng máy đọc được về cấu hình, nhật ký, trạng thái, tình trạng hoạt động
  và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Hình dạng cấu hình đã được làm sạch và chi tiết cấu hình không bí mật.
- Tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được biên tập.
- Ảnh chụp nhanh trạng thái và tình trạng hoạt động Gateway theo khả năng tốt nhất.
- `stability/latest.json`: gói ổn định đã lưu mới nhất, khi có sẵn.

Bản xuất vẫn hữu ích ngay cả khi Gateway không khỏe. Nếu Gateway không thể
trả lời yêu cầu trạng thái hoặc tình trạng hoạt động, nhật ký cục bộ, hình dạng cấu hình và
gói ổn định mới nhất vẫn được thu thập khi có sẵn.

## Mô hình quyền riêng tư

Chẩn đoán được thiết kế để có thể chia sẻ. Bản xuất giữ lại dữ liệu vận hành
hữu ích cho việc gỡ lỗi, chẳng hạn như:

- tên hệ thống con, ID Plugin, ID nhà cung cấp, ID kênh và các chế độ đã cấu hình
- mã trạng thái, thời lượng, số byte, trạng thái hàng đợi và số đo bộ nhớ
- siêu dữ liệu nhật ký đã được làm sạch và thông điệp vận hành đã được biên tập
- hình dạng cấu hình và thiết lập tính năng không bí mật

Bản xuất bỏ qua hoặc biên tập:

- văn bản chat, prompt, chỉ dẫn, phần thân Webhook và đầu ra công cụ
- thông tin xác thực, khóa API, token, cookie và giá trị bí mật
- phần thân yêu cầu hoặc phản hồi thô
- ID tài khoản, ID tin nhắn, ID phiên thô, tên máy chủ và tên người dùng cục bộ

Khi một thông điệp nhật ký trông giống văn bản người dùng, chat, prompt hoặc payload công cụ,
bản xuất chỉ giữ lại thông tin rằng một thông điệp đã bị bỏ qua và số byte.

## Trình ghi ổn định

Gateway ghi một luồng ổn định có giới hạn, không chứa payload theo mặc định khi
chẩn đoán được bật. Luồng này dành cho các sự kiện vận hành, không phải nội dung.

Cùng Heartbeat chẩn đoán đó ghi các mẫu liveness khi Gateway tiếp tục
chạy nhưng vòng lặp sự kiện Node.js hoặc CPU có vẻ bị bão hòa. Các sự kiện
`diagnostic.liveness.warning` này bao gồm độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện,
tỷ lệ lõi CPU và số lượng phiên đang hoạt động/đang chờ/đang xếp hàng. Các
mẫu nhàn rỗi vẫn ở mức `info` trong telemetry; chúng chỉ được ghi nhật ký dưới dạng cảnh báo
Gateway khi công việc chẩn đoán đang hoạt động, đang chờ hoặc đang xếp hàng. Chúng không
tự khởi động lại Gateway.

Kiểm tra trình ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói ổn định đã lưu mới nhất sau một lần thoát nghiêm trọng, hết thời gian
tắt máy hoặc lỗi khởi động lại:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói đã lưu mới nhất:

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
- `--log-lines <count>`: số dòng nhật ký đã được làm sạch tối đa để bao gồm.
- `--log-bytes <bytes>`: số byte nhật ký tối đa để kiểm tra.
- `--url <url>`: URL WebSocket Gateway cho ảnh chụp nhanh trạng thái và tình trạng hoạt động.
- `--token <token>`: token Gateway cho ảnh chụp nhanh trạng thái và tình trạng hoạt động.
- `--password <password>`: mật khẩu Gateway cho ảnh chụp nhanh trạng thái và tình trạng hoạt động.
- `--timeout <ms>`: thời gian chờ ảnh chụp nhanh trạng thái và tình trạng hoạt động.
- `--no-stability-bundle`: bỏ qua tra cứu gói ổn định đã lưu.
- `--json`: in siêu dữ liệu xuất dạng máy đọc được.

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt trình ghi ổn định và
thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Việc tắt chẩn đoán làm giảm mức chi tiết của báo cáo lỗi. Nó không ảnh hưởng đến
ghi nhật ký Gateway thông thường.

## Liên quan

- [Kiểm tra tình trạng hoạt động](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#system-and-identity)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — luồng riêng để truyền trực tuyến chẩn đoán đến bộ thu
