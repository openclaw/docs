---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra CLI hoặc Gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-05-05T01:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi log

Để xem tổng quan hướng tới người dùng (CLI + Control UI + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai “bề mặt” ghi log:

- **Đầu ra console** (những gì bạn thấy trong terminal / Debug UI).
- **Nhật ký tệp** (các dòng JSON) do bộ ghi log Gateway ghi lại.

Khi khởi động, Gateway ghi log mô hình agent mặc định đã phân giải cùng với các
mặc định chế độ ảnh hưởng đến phiên mới, ví dụ:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` đến từ agent mặc định, tham số mô hình, hoặc mặc định agent toàn cục;
khi chưa được đặt, tóm tắt khởi động hiển thị `medium`. `fast` đến từ agent mặc
định hoặc tham số `fastMode` của mô hình.

## Bộ ghi log dựa trên tệp

- Tệp nhật ký xoay vòng mặc định nằm dưới `/tmp/openclaw/` (một tệp mỗi ngày): `openclaw-YYYY-MM-DD.log`
  - Ngày dùng múi giờ cục bộ của máy chủ Gateway.
- Các tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ
  tối đa năm bản lưu trữ được đánh số và tiếp tục ghi một tệp đang hoạt động mới.
- Đường dẫn và mức nhật ký của tệp có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là mỗi dòng một đối tượng JSON.

Thẻ Logs của Control UI tail tệp này qua Gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với mức nhật ký**

- **Nhật ký tệp** được kiểm soát riêng bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết console** (và kiểu log WS); nó **không**
  nâng mức nhật ký tệp.
- Để ghi lại các chi tiết chỉ có ở chế độ chi tiết trong nhật ký tệp, đặt `logging.level` thành `debug` hoặc
  `trace`.
- Ghi log trace cũng bao gồm các tóm tắt thời gian chẩn đoán cho một số đường dẫn nóng được chọn,
  chẳng hạn như chuẩn bị factory công cụ Plugin. Xem
  [/tools/plugin#slow-plugin-tool-setup](/vi/tools/plugin#slow-plugin-tool-setup).

## Thu thập console

CLI thu thập `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp,
đồng thời vẫn in ra stdout/stderr.

Bạn có thể điều chỉnh độ chi tiết console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập che giấu

OpenClaw có thể che các token nhạy cảm trước khi đầu ra log hoặc transcript rời khỏi
tiến trình. Chính sách biên tập che giấu khi ghi log này được áp dụng tại các đầu nhận văn bản
console, nhật ký tệp, bản ghi log OTLP và transcript phiên, vì vậy các giá trị bí mật khớp
sẽ được che trước khi các dòng JSONL hoặc thông điệp được ghi ra đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng các chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các kết quả khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, header bearer, khối PEM, tiền tố token phổ biến, và tên trường thông tin thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán.

Một số ranh giới an toàn luôn biên tập che giấu bất kể `logging.redactSensitive`.
Điều đó bao gồm sự kiện gọi công cụ của Control UI, đầu ra công cụ `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và log giao thức WebSocket của Gateway. Các bề mặt này vẫn có thể dùng
`logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"`
không khiến chúng phát ra bí mật thô.

## Log WebSocket của Gateway

Gateway in log giao thức WebSocket ở hai chế độ:

- **Chế độ bình thường (không có `--verbose`)**: chỉ các kết quả RPC “đáng chú ý” được in:
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu log WS

`openclaw gateway` hỗ trợ một công tắc kiểu cho từng Gateway:

- `--ws-log auto` (mặc định): chế độ bình thường được tối ưu; chế độ chi tiết dùng đầu ra compact
- `--ws-log compact`: đầu ra compact (yêu cầu/phản hồi theo cặp) khi chi tiết
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

## Định dạng console (ghi log hệ thống con)

Bộ định dạng console **nhận biết TTY** và in các dòng nhất quán, có tiền tố.
Bộ ghi log hệ thống con giữ đầu ra được nhóm và dễ quét.

Hành vi:

- **Tiền tố hệ thống con** trên mỗi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ thống con** (ổn định theo từng hệ thống con) cộng với tô màu theo mức
- **Màu khi đầu ra là TTY hoặc môi trường trông giống terminal giàu tính năng** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ thống con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 phân đoạn cuối (ví dụ `whatsapp/outbound`)
- **Bộ ghi log con theo hệ thống con** (tự động tiền tố + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ `pretty | compact | json`)
- **Mức nhật ký console** tách biệt với mức nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung thân thông điệp WhatsApp** được ghi log ở `debug` (dùng `--verbose` để xem)

Điều này giữ nhật ký tệp hiện có ổn định đồng thời làm cho đầu ra tương tác dễ quét.

## Liên quan

- [Ghi log](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
