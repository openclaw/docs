---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra CLI hoặc gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-06-27T17:30:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + Control UI + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai "bề mặt" nhật ký:

- **Đầu ra bảng điều khiển** (những gì bạn thấy trong terminal / UI gỡ lỗi).
- **Nhật ký tệp** (các dòng JSON) do trình ghi nhật ký Gateway ghi.

Khi khởi động, Gateway ghi nhật ký mô hình tác tử mặc định đã được phân giải cùng với
các mặc định chế độ ảnh hưởng đến phiên mới, ví dụ:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` đến từ tác tử mặc định, tham số mô hình, hoặc mặc định tác tử toàn cục;
khi chưa được đặt, tóm tắt khởi động hiển thị `medium`. `fast` đến từ
tác tử mặc định hoặc tham số `fastMode` của mô hình.

## Trình ghi nhật ký dựa trên tệp

- Tệp nhật ký xoay vòng mặc định nằm dưới `/tmp/openclaw/` (mỗi ngày một tệp): `openclaw-YYYY-MM-DD.log`
  - Ngày dùng múi giờ cục bộ của máy chủ gateway.
- Các tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ
  tối đa năm bản lưu trữ được đánh số và tiếp tục ghi vào một tệp đang hoạt động mới.
- Đường dẫn và cấp độ tệp nhật ký có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là mỗi dòng một đối tượng JSON.

Các đường dẫn mã trò chuyện, thoại thời gian thực, và phòng được quản lý dùng trình ghi nhật ký tệp dùng chung cho
các bản ghi vòng đời có giới hạn. Những bản ghi này dành cho gỡ lỗi vận hành
và xuất nhật ký OTLP; văn bản bản ghi hội thoại, payload âm thanh, id lượt, id cuộc gọi, và
id mục của nhà cung cấp không được sao chép vào bản ghi nhật ký.

Tab Nhật ký của Control UI theo dõi tệp này qua gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với cấp độ nhật ký**

- **Nhật ký tệp** được kiểm soát hoàn toàn bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết bảng điều khiển** (và kiểu nhật ký WS); nó **không**
  tăng cấp độ nhật ký tệp.
- Để ghi các chi tiết chỉ có ở chế độ chi tiết vào nhật ký tệp, đặt `logging.level` thành `debug` hoặc
  `trace`.
- Ghi nhật ký trace cũng bao gồm các tóm tắt thời gian chẩn đoán cho những đường dẫn nóng được chọn,
  chẳng hạn như chuẩn bị factory công cụ Plugin. Xem
  [/tools/plugin#slow-plugin-tool-setup](/vi/tools/plugin#slow-plugin-tool-setup).

## Thu thập bảng điều khiển

CLI thu thập `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp,
đồng thời vẫn in ra stdout/stderr.

Bạn có thể tinh chỉnh độ chi tiết bảng điều khiển độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập dữ liệu nhạy cảm

OpenClaw có thể che các token nhạy cảm trước khi đầu ra nhật ký hoặc bản ghi hội thoại rời khỏi
tiến trình. Chính sách biên tập dữ liệu nhạy cảm trong nhật ký này được áp dụng tại các đích nhận văn bản bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP,
và bản ghi hội thoại phiên, vì vậy các giá trị bí mật khớp mẫu được
che trước khi các dòng JSONL hoặc thông điệp được ghi ra đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các kết quả khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, header bearer, khối PEM, tiền tố token phổ biến, và tên trường thông tin xác thực thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán.

Một số ranh giới an toàn luôn biên tập dữ liệu nhạy cảm bất kể `logging.redactSensitive`.
Điều này bao gồm sự kiện gọi công cụ của Control UI, đầu ra công cụ `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket của Gateway. Những bề mặt này vẫn có thể dùng
`logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"`
không khiến chúng phát ra bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ bình thường (không có `--verbose`)**: chỉ các kết quả RPC "đáng chú ý" được in:
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ công tắc kiểu theo từng gateway:

- `--ws-log auto` (mặc định): chế độ bình thường được tối ưu hóa; chế độ chi tiết dùng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (ghép cặp yêu cầu/phản hồi) khi chi tiết
- `--ws-log full`: đầu ra đầy đủ theo từng frame khi chi tiết
- `--compact`: bí danh cho `--ws-log compact`

Ví dụ:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Định dạng bảng điều khiển (ghi nhật ký hệ con)

Trình định dạng bảng điều khiển **nhận biết TTY** và in các dòng nhất quán, có tiền tố.
Các trình ghi nhật ký hệ con giữ đầu ra được nhóm lại và dễ quét.

Hành vi:

- **Tiền tố hệ con** trên mọi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ con** (ổn định theo từng hệ con) cùng với tô màu cấp độ
- **Có màu khi đầu ra là TTY hoặc môi trường trông giống terminal giàu tính năng** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 phân đoạn cuối (ví dụ `whatsapp/outbound`)
- **Trình ghi nhật ký con theo hệ con** (tự động thêm tiền tố + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu bảng điều khiển** (ví dụ `pretty | compact | json`)
- **Cấp độ nhật ký bảng điều khiển** tách biệt với cấp độ nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung thông điệp WhatsApp** được ghi nhật ký ở `debug` (dùng `--verbose` để xem)

Điều này giữ nhật ký tệp hiện có ổn định trong khi làm cho đầu ra tương tác dễ quét.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
