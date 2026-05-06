---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra CLI hoặc Gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-05-06T09:13:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + UI điều khiển + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai "bề mặt" nhật ký:

- **Đầu ra console** (những gì bạn thấy trong terminal / UI gỡ lỗi).
- **Nhật ký tệp** (các dòng JSON) do trình ghi nhật ký của Gateway ghi.

Khi khởi động, Gateway ghi nhật ký mô hình agent mặc định đã phân giải cùng với các
mặc định chế độ ảnh hưởng đến phiên mới, ví dụ:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` đến từ agent mặc định, tham số mô hình hoặc mặc định agent toàn cục;
khi chưa đặt, tóm tắt khởi động hiển thị `medium`. `fast` đến từ agent mặc định
hoặc tham số `fastMode` của mô hình.

## Trình ghi nhật ký dựa trên tệp

- Tệp nhật ký xoay vòng mặc định nằm dưới `/tmp/openclaw/` (một tệp mỗi ngày): `openclaw-YYYY-MM-DD.log`
  - Ngày dùng múi giờ cục bộ của máy chủ Gateway.
- Tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ
  tối đa năm bản lưu trữ được đánh số và tiếp tục ghi vào một tệp đang hoạt động mới.
- Đường dẫn và mức nhật ký của tệp có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là một đối tượng JSON trên mỗi dòng.

Thẻ Nhật ký của UI điều khiển theo dõi tệp này qua Gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với mức nhật ký**

- **Nhật ký tệp** chỉ được kiểm soát bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết của console** (và kiểu nhật ký WS); nó **không**
  tăng mức nhật ký của tệp.
- Để ghi các chi tiết chỉ có khi bật chi tiết vào nhật ký tệp, đặt `logging.level` thành `debug` hoặc
  `trace`.
- Ghi nhật ký trace cũng bao gồm các tóm tắt thời gian chẩn đoán cho một số đường nóng,
  chẳng hạn như chuẩn bị factory công cụ Plugin. Xem
  [/tools/plugin#slow-plugin-tool-setup](/vi/tools/plugin#slow-plugin-tool-setup).

## Thu thập console

CLI thu thập `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp,
trong khi vẫn in ra stdout/stderr.

Bạn có thể điều chỉnh độ chi tiết của console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập thông tin nhạy cảm

OpenClaw có thể che các token nhạy cảm trước khi đầu ra nhật ký hoặc bản ghi phiên rời khỏi
tiến trình. Chính sách biên tập nhật ký này được áp dụng tại các đích console, nhật ký tệp, bản ghi nhật ký OTLP
và văn bản bản ghi phiên, vì vậy các giá trị bí mật khớp mẫu được che
trước khi các dòng JSONL hoặc tin nhắn được ghi vào đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các kết quả khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, header bearer, khối PEM, tiền tố token phổ biến và tên trường thông tin xác thực thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung và thông tin xác thực thanh toán.

Một số ranh giới an toàn luôn biên tập bất kể `logging.redactSensitive`.
Điều đó bao gồm sự kiện gọi công cụ của UI điều khiển, đầu ra công cụ `sessions_history`,
bản xuất hỗ trợ chẩn đoán, quan sát lỗi provider, hiển thị lệnh phê duyệt exec
và nhật ký giao thức WebSocket của Gateway. Các bề mặt này vẫn có thể dùng
`logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"`
không khiến chúng phát ra bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ bình thường (không có `--verbose`)**: chỉ in các kết quả RPC "đáng chú ý":
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ một công tắc kiểu theo từng Gateway:

- `--ws-log auto` (mặc định): chế độ bình thường được tối ưu hóa; chế độ chi tiết dùng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (cặp yêu cầu/phản hồi) khi chi tiết
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

## Định dạng console (ghi nhật ký hệ con)

Bộ định dạng console **nhận biết TTY** và in các dòng có tiền tố, nhất quán.
Các trình ghi nhật ký hệ con giữ đầu ra được nhóm lại và dễ quét.

Hành vi:

- **Tiền tố hệ con** trên mọi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ con** (ổn định theo từng hệ con) cộng với tô màu theo mức
- **Có màu khi đầu ra là TTY hoặc môi trường trông giống terminal giàu tính năng** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 đoạn cuối (ví dụ `whatsapp/outbound`)
- **Trình ghi nhật ký con theo hệ con** (tự động thêm tiền tố + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ `pretty | compact | json`)
- **Mức nhật ký console** tách biệt với mức nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung tin nhắn WhatsApp** được ghi ở mức `debug` (dùng `--verbose` để xem chúng)

Điều này giữ nhật ký tệp hiện có ổn định trong khi làm cho đầu ra tương tác dễ quét.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
