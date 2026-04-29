---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra CLI hoặc Gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-04-29T22:43:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + Giao diện điều khiển + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai “bề mặt” nhật ký:

- **Đầu ra console** (những gì bạn thấy trong terminal / Giao diện gỡ lỗi).
- **Nhật ký tệp** (các dòng JSON) do bộ ghi nhật ký Gateway ghi.

## Bộ ghi nhật ký dựa trên tệp

- Tệp nhật ký xoay vòng mặc định nằm trong `/tmp/openclaw/` (mỗi ngày một tệp): `openclaw-YYYY-MM-DD.log`
  - Ngày sử dụng múi giờ cục bộ của máy chủ Gateway.
- Các tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ
  tối đa năm bản lưu trữ được đánh số và tiếp tục ghi vào một tệp hoạt động mới.
- Đường dẫn và mức của tệp nhật ký có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là mỗi dòng một đối tượng JSON.

Thẻ Nhật ký của Giao diện điều khiển theo dõi tệp này qua Gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với mức nhật ký**

- **Nhật ký tệp** được kiểm soát riêng bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết của console** (và kiểu nhật ký WS); nó **không**
  nâng mức nhật ký tệp.
- Để ghi lại các chi tiết chỉ có ở chế độ chi tiết trong nhật ký tệp, hãy đặt `logging.level` thành `debug` hoặc
  `trace`.

## Ghi lại console

CLI ghi lại `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp,
trong khi vẫn in ra stdout/stderr.

Bạn có thể tinh chỉnh độ chi tiết của console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập che giấu

OpenClaw có thể che các token nhạy cảm trước khi đầu ra nhật ký hoặc bản ghi phiên rời khỏi
tiến trình. Chính sách biên tập che giấu nhật ký này được áp dụng tại các đích nhận văn bản console, nhật ký tệp, bản ghi nhật ký OTLP
và bản ghi phiên, vì vậy các giá trị bí mật khớp mẫu sẽ được
che trước khi các dòng JSONL hoặc thông điệp được ghi ra đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các kết quả khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, tiêu đề bearer, khối PEM và các tiền tố token thông dụng.

Một số ranh giới an toàn luôn biên tập che giấu bất kể `logging.redactSensitive`.
Bao gồm các sự kiện gọi công cụ của Giao diện điều khiển, đầu ra công cụ `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec,
và nhật ký giao thức WebSocket của Gateway. Các bề mặt này vẫn có thể dùng
`logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"`
không khiến chúng phát ra bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ thường (không có `--verbose`)**: chỉ các kết quả RPC “đáng chú ý” được in:
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ công tắc kiểu theo từng Gateway:

- `--ws-log auto` (mặc định): chế độ thường được tối ưu hóa; chế độ chi tiết dùng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (ghép cặp yêu cầu/phản hồi) khi chi tiết
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

Bộ định dạng console **nhận biết TTY** và in các dòng nhất quán, có tiền tố.
Bộ ghi nhật ký hệ con giữ đầu ra được nhóm lại và dễ quét.

Hành vi:

- **Tiền tố hệ con** trên mọi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ con** (ổn định theo từng hệ con) cộng với màu theo mức
- **Có màu khi đầu ra là TTY hoặc môi trường trông giống terminal giàu tính năng** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 phân đoạn cuối (ví dụ `whatsapp/outbound`)
- **Bộ ghi nhật ký con theo hệ con** (tự động thêm tiền tố + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ `pretty | compact | json`)
- **Mức nhật ký console** tách biệt với mức nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung tin nhắn WhatsApp** được ghi ở mức `debug` (dùng `--verbose` để xem)

Điều này giữ cho nhật ký tệp hiện có ổn định trong khi làm cho đầu ra tương tác dễ quét.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
