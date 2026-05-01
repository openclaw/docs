---
read_when:
    - Thay đổi đầu ra hoặc định dạng nhật ký
    - Gỡ lỗi đầu ra CLI hoặc Gateway
summary: Các giao diện ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-05-01T10:48:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + Giao diện điều khiển + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai “bề mặt” nhật ký:

- **Đầu ra console** (những gì bạn thấy trong terminal / Giao diện gỡ lỗi).
- **Nhật ký tệp** (các dòng JSON) do trình ghi nhật ký của Gateway ghi.

## Trình ghi nhật ký dựa trên tệp

- Tệp nhật ký cuộn mặc định nằm trong `/tmp/openclaw/` (mỗi ngày một tệp): `openclaw-YYYY-MM-DD.log`
  - Ngày sử dụng múi giờ cục bộ của máy chủ Gateway.
- Các tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ
  tối đa năm bản lưu trữ được đánh số và tiếp tục ghi vào một tệp hoạt động mới.
- Đường dẫn và cấp độ của tệp nhật ký có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là mỗi dòng một đối tượng JSON.

Thẻ Nhật ký của Giao diện điều khiển theo dõi tệp này qua Gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với cấp độ nhật ký**

- **Nhật ký tệp** được kiểm soát riêng bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **mức độ chi tiết của console** (và kiểu nhật ký WS); nó **không**
  nâng cấp độ nhật ký tệp.
- Để ghi lại các chi tiết chỉ xuất hiện ở chế độ chi tiết trong nhật ký tệp, đặt `logging.level` thành `debug` hoặc
  `trace`.

## Thu thập console

CLI thu thập `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp,
trong khi vẫn in ra stdout/stderr.

Bạn có thể tinh chỉnh mức độ chi tiết của console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập che giấu

OpenClaw có thể che các token nhạy cảm trước khi đầu ra nhật ký hoặc bản ghi phiên rời khỏi
tiến trình. Chính sách biên tập che giấu nhật ký này được áp dụng tại các đích nhận văn bản console, nhật ký tệp, bản ghi nhật ký OTLP,
và bản ghi phiên, vì vậy các giá trị bí mật khớp sẽ được
che trước khi các dòng JSONL hoặc thông điệp được ghi ra đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng các chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các kết quả khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, tiêu đề bearer, khối PEM, tiền tố token phổ biến, và tên trường thông tin thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung, và thông tin xác thực thanh toán.

Một số ranh giới an toàn luôn biên tập che giấu bất kể `logging.redactSensitive`.
Điều đó bao gồm các sự kiện gọi công cụ của Giao diện điều khiển, đầu ra công cụ `sessions_history`,
xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket của Gateway. Các bề mặt này vẫn có thể dùng
`logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"`
không làm chúng phát ra bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ bình thường (không có `--verbose`)**: chỉ in các kết quả RPC “đáng chú ý”:
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ một công tắc kiểu theo từng Gateway:

- `--ws-log auto` (mặc định): chế độ bình thường được tối ưu hóa; chế độ chi tiết dùng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (yêu cầu/phản hồi ghép cặp) khi chi tiết
- `--ws-log full`: đầu ra đầy đủ theo từng khung khi chi tiết
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

## Định dạng console (ghi nhật ký hệ con)

Trình định dạng console **nhận biết TTY** và in các dòng nhất quán, có tiền tố.
Các trình ghi nhật ký hệ con giữ đầu ra được nhóm lại và dễ quét.

Hành vi:

- **Tiền tố hệ con** trên mọi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ con** (ổn định theo từng hệ con) cộng với màu cấp độ
- **Có màu khi đầu ra là TTY hoặc môi trường trông giống terminal phong phú** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 đoạn cuối (ví dụ `whatsapp/outbound`)
- **Trình ghi nhật ký phụ theo hệ con** (tiền tố tự động + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ `pretty | compact | json`)
- **Cấp độ nhật ký console** tách biệt với cấp độ nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung tin nhắn WhatsApp** được ghi ở `debug` (dùng `--verbose` để xem)

Điều này giữ cho nhật ký tệp hiện có ổn định trong khi làm đầu ra tương tác dễ quét.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
