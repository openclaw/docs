---
read_when:
    - Chuẩn bị báo cáo lỗi hoặc yêu cầu hỗ trợ
    - Gỡ lỗi sự cố sập Gateway, khởi động lại, áp lực bộ nhớ hoặc tải dữ liệu quá lớn
    - Đánh giá dữ liệu chẩn đoán nào được ghi lại hoặc biên tập lại
summary: Tạo gói chẩn đoán Gateway có thể chia sẻ cho báo cáo lỗi
title: Xuất chẩn đoán
x-i18n:
    generated_at: "2026-06-27T17:28:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw có thể tạo một tệp zip chẩn đoán cục bộ cho báo cáo lỗi. Tệp này kết hợp
trạng thái Gateway đã được làm sạch, tình trạng, nhật ký, hình dạng cấu hình và các
sự kiện ổn định gần đây không chứa payload.

Hãy xử lý các gói chẩn đoán như bí mật cho đến khi bạn đã xem xét chúng. Chúng được
thiết kế để bỏ qua hoặc biên tập lại payload và thông tin xác thực, nhưng vẫn tóm tắt
nhật ký Gateway cục bộ và trạng thái runtime ở cấp máy chủ.

## Bắt đầu nhanh

```bash
openclaw gateway diagnostics export
```

Lệnh này in ra đường dẫn tệp zip đã ghi. Để chọn đường dẫn:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Dành cho tự động hóa:

```bash
openclaw gateway diagnostics export --json
```

## Lệnh chat

Chủ sở hữu có thể dùng `/diagnostics [note]` trong chat để yêu cầu xuất Gateway cục bộ.
Dùng lệnh này khi lỗi xảy ra trong một cuộc trò chuyện thực và bạn muốn có một báo cáo
có thể sao chép-dán cho bộ phận hỗ trợ:

1. Gửi `/diagnostics` trong cuộc trò chuyện nơi bạn phát hiện sự cố. Thêm một ghi chú
   ngắn nếu hữu ích, ví dụ `/diagnostics bad tool choice`.
2. OpenClaw gửi phần mở đầu chẩn đoán và yêu cầu một phê duyệt exec rõ ràng.
   Phê duyệt này chạy `openclaw gateway diagnostics export --json`.
   Không phê duyệt chẩn đoán thông qua một quy tắc cho phép tất cả.
3. Sau khi phê duyệt, OpenClaw trả lời bằng một báo cáo có thể dán, chứa đường dẫn
   gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư và các id phiên liên quan.

Trong chat nhóm, chủ sở hữu vẫn có thể chạy `/diagnostics`, nhưng OpenClaw không
đăng chi tiết chẩn đoán trở lại chat chung. Nó gửi phần mở đầu, lời nhắc phê duyệt,
kết quả xuất Gateway và phân tích phiên/luồng Codex cho chủ sở hữu thông qua tuyến
phê duyệt riêng tư. Nhóm chỉ nhận được một thông báo ngắn rằng luồng chẩn đoán đã
được gửi riêng tư. Nếu OpenClaw không tìm thấy tuyến riêng tư của chủ sở hữu, lệnh
sẽ thất bại theo hướng đóng an toàn và yêu cầu chủ sở hữu chạy lệnh từ DM.

Khi phiên OpenClaw đang hoạt động sử dụng native OpenAI Codex harness, cùng phê duyệt
exec đó cũng bao gồm một lần tải phản hồi OpenAI lên cho các luồng runtime Codex mà
OpenClaw biết. Lần tải lên đó tách biệt với tệp zip Gateway cục bộ và chỉ xuất hiện
cho các phiên Codex harness. Trước khi phê duyệt, lời nhắc giải thích rằng việc phê
duyệt chẩn đoán cũng sẽ gửi phản hồi Codex, nhưng không liệt kê id phiên hoặc luồng
Codex. Sau khi phê duyệt, phản hồi chat liệt kê các kênh, id phiên OpenClaw, id luồng
Codex và các lệnh tiếp tục cục bộ cho những luồng đã được gửi đến máy chủ OpenAI.
Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không chạy thao tác xuất, không gửi
phản hồi Codex và không in các id Codex.

Điều đó làm cho vòng lặp gỡ lỗi Codex phổ biến trở nên ngắn gọn: phát hiện hành vi
không đúng trong Telegram, Discord hoặc kênh khác, chạy `/diagnostics`, phê duyệt
một lần, chia sẻ báo cáo với bộ phận hỗ trợ, rồi chạy lệnh
`codex resume <thread-id>` đã in ở cục bộ nếu bạn muốn tự kiểm tra luồng Codex gốc.
Xem [Codex harness](/vi/plugins/codex-harness#inspect-codex-threads-locally) để biết
quy trình kiểm tra đó.

## Nội dung bản xuất

Tệp zip bao gồm:

- `summary.md`: tổng quan dễ đọc cho bộ phận hỗ trợ.
- `diagnostics.json`: tóm tắt máy đọc được về cấu hình, nhật ký, trạng thái, tình trạng
  và dữ liệu ổn định.
- `manifest.json`: siêu dữ liệu xuất và danh sách tệp.
- Hình dạng cấu hình đã được làm sạch và chi tiết cấu hình không bí mật.
- Tóm tắt nhật ký đã được làm sạch và các dòng nhật ký gần đây đã được biên tập lại.
- Ảnh chụp nhanh trạng thái và tình trạng Gateway theo nỗ lực tốt nhất.
- `stability/latest.json`: gói ổn định mới nhất đã được lưu giữ, khi có sẵn.

Bản xuất vẫn hữu ích ngay cả khi Gateway không khỏe mạnh. Nếu Gateway không thể
trả lời yêu cầu trạng thái hoặc tình trạng, nhật ký cục bộ, hình dạng cấu hình và
gói ổn định mới nhất vẫn được thu thập khi có sẵn.

## Mô hình quyền riêng tư

Chẩn đoán được thiết kế để có thể chia sẻ. Bản xuất giữ lại dữ liệu vận hành
hỗ trợ gỡ lỗi, chẳng hạn như:

- tên hệ thống con, id plugin, id nhà cung cấp, id kênh và các chế độ đã cấu hình
- mã trạng thái, thời lượng, số byte, trạng thái hàng đợi và số đọc bộ nhớ
- siêu dữ liệu nhật ký đã được làm sạch và thông báo vận hành đã được biên tập lại
- hình dạng cấu hình và thiết lập tính năng không bí mật

Bản xuất bỏ qua hoặc biên tập lại:

- văn bản chat, prompt, hướng dẫn, phần thân webhook và đầu ra công cụ
- thông tin xác thực, khóa API, token, cookie và giá trị bí mật
- phần thân yêu cầu hoặc phản hồi thô
- id tài khoản, id tin nhắn, id phiên thô, hostname và tên người dùng cục bộ

Khi một thông điệp nhật ký trông giống văn bản người dùng, chat, prompt hoặc payload
công cụ, bản xuất chỉ giữ lại thông tin rằng một thông điệp đã bị bỏ qua và số byte.

## Bộ ghi ổn định

Gateway mặc định ghi lại một luồng ổn định có giới hạn, không chứa payload khi
chẩn đoán được bật. Luồng này dành cho các dữ kiện vận hành, không phải nội dung.

Cùng diagnostic heartbeat đó ghi lại các mẫu liveness khi Gateway vẫn chạy nhưng
vòng lặp sự kiện Node.js hoặc CPU có vẻ bị bão hòa. Các sự kiện
`diagnostic.liveness.warning` này bao gồm độ trễ vòng lặp sự kiện, mức sử dụng vòng
lặp sự kiện, tỷ lệ lõi CPU, số lượng phiên đang hoạt động/đang chờ/đã xếp hàng, giai
đoạn khởi động/runtime hiện tại khi biết được, các khoảng giai đoạn gần đây và nhãn
công việc đang hoạt động/đã xếp hàng có giới hạn. Các mẫu nhàn rỗi vẫn ở telemetry
ở cấp `info`. Mẫu liveness chỉ trở thành cảnh báo Gateway khi có công việc đang chờ
hoặc đã xếp hàng, hoặc khi công việc đang hoạt động trùng với độ trễ vòng lặp sự kiện
kéo dài. Các đỉnh độ trễ tối đa thoáng qua trong lúc công việc nền vẫn khỏe mạnh sẽ
ở lại trong nhật ký debug. Chúng không tự khởi động lại Gateway.

Các giai đoạn khởi động cũng phát ra sự kiện `diagnostic.phase.completed` với thời
gian thực và thời gian CPU. Chẩn đoán embedded-run bị đình trệ đánh dấu
`terminalProgressStale=true` khi tiến trình bridge cuối cùng trông có vẻ đã kết thúc,
chẳng hạn như một mục phản hồi thô hoặc sự kiện hoàn tất phản hồi, nhưng Gateway vẫn
xem embedded run là đang hoạt động.

Kiểm tra bộ ghi trực tiếp:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Kiểm tra gói ổn định đã lưu giữ mới nhất sau khi thoát nghiêm trọng, hết thời gian
chờ tắt hoặc lỗi khởi động lại:

```bash
openclaw gateway stability --bundle latest
```

Tạo tệp zip chẩn đoán từ gói đã lưu giữ mới nhất:

```bash
openclaw gateway stability --bundle latest --export
```

Các gói đã lưu giữ nằm dưới `~/.openclaw/logs/stability/` khi có sự kiện.

## Tùy chọn hữu ích

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: ghi vào một đường dẫn zip cụ thể.
- `--log-lines <count>`: số dòng nhật ký đã làm sạch tối đa cần bao gồm.
- `--log-bytes <bytes>`: số byte nhật ký tối đa cần kiểm tra.
- `--url <url>`: URL WebSocket Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--token <token>`: token Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--password <password>`: mật khẩu Gateway cho ảnh chụp nhanh trạng thái và tình trạng.
- `--timeout <ms>`: thời gian chờ ảnh chụp nhanh trạng thái và tình trạng.
- `--no-stability-bundle`: bỏ qua tra cứu gói ổn định đã lưu giữ.
- `--json`: in siêu dữ liệu xuất máy đọc được.

## Tắt chẩn đoán

Chẩn đoán được bật theo mặc định. Để tắt bộ ghi ổn định và thu thập sự kiện chẩn đoán:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tắt chẩn đoán sẽ giảm chi tiết báo cáo lỗi. Điều này không ảnh hưởng đến ghi nhật ký
Gateway thông thường.

Ảnh chụp nhanh áp lực bộ nhớ nghiêm trọng mặc định bị tắt. Để giữ các sự kiện chẩn
đoán và cũng ghi lại ảnh chụp nhanh ổn định trước OOM:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Chỉ dùng tùy chọn này trên các máy chủ có thể chịu được lần quét hệ thống tệp và ghi
ảnh chụp nhanh bổ sung trong lúc áp lực bộ nhớ nghiêm trọng. Các sự kiện áp lực bộ
nhớ thông thường vẫn ghi lại RSS, heap, ngưỡng và dữ kiện tăng trưởng khi ảnh chụp
nhanh bị tắt.

## Liên quan

- [Kiểm tra tình trạng](/vi/gateway/health)
- [CLI Gateway](/vi/cli/gateway#gateway-diagnostics-export)
- [Giao thức Gateway](/vi/gateway/protocol#system-and-identity)
- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — luồng riêng để truyền chẩn đoán đến một collector
