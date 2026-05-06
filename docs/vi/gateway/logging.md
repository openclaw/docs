---
read_when:
    - Thay đổi đầu ra hoặc định dạng ghi nhật ký
    - Gỡ lỗi đầu ra CLI hoặc Gateway
summary: Các bề mặt ghi nhật ký, nhật ký tệp, kiểu nhật ký WS và định dạng bảng điều khiển
title: Ghi nhật ký Gateway
x-i18n:
    generated_at: "2026-05-06T10:57:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Ghi nhật ký

Để xem tổng quan dành cho người dùng (CLI + Control UI + cấu hình), xem [/logging](/vi/logging).

OpenClaw có hai "bề mặt" nhật ký:

- **Đầu ra console** (những gì bạn thấy trong terminal / Debug UI).
- **Nhật ký tệp** (các dòng JSON) do trình ghi nhật ký Gateway ghi.

Khi khởi động, Gateway ghi nhật ký mô hình agent mặc định đã phân giải cùng với các giá trị mặc định của chế độ ảnh hưởng đến phiên mới, ví dụ:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` đến từ agent mặc định, tham số mô hình, hoặc mặc định agent toàn cục; khi chưa được đặt, tóm tắt khởi động hiển thị `medium`. `fast` đến từ agent mặc định hoặc tham số `fastMode` của mô hình.

## Trình ghi nhật ký dựa trên tệp

- Tệp nhật ký xoay vòng mặc định nằm trong `/tmp/openclaw/` (một tệp mỗi ngày): `openclaw-YYYY-MM-DD.log`
  - Ngày dùng múi giờ cục bộ của máy chủ Gateway.
- Các tệp nhật ký đang hoạt động xoay vòng tại `logging.maxFileBytes` (mặc định: 100 MB), giữ tối đa năm bản lưu trữ được đánh số và tiếp tục ghi vào một tệp đang hoạt động mới.
- Đường dẫn tệp nhật ký và cấp độ có thể được cấu hình qua `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Định dạng tệp là một đối tượng JSON trên mỗi dòng.

Các đường dẫn mã của trò chuyện, giọng nói thời gian thực và phòng được quản lý dùng trình ghi nhật ký tệp dùng chung cho các bản ghi vòng đời có giới hạn. Những bản ghi này dành cho gỡ lỗi vận hành và xuất nhật ký OTLP; văn bản bản ghi hội thoại, tải âm thanh, mã lượt, mã cuộc gọi và mã mục của nhà cung cấp không được sao chép vào bản ghi nhật ký.

Thẻ Logs trong Control UI tail tệp này qua Gateway (`logs.tail`).
CLI cũng có thể làm tương tự:

```bash
openclaw logs --follow
```

**Chi tiết so với cấp độ nhật ký**

- **Nhật ký tệp** chỉ được kiểm soát bởi `logging.level`.
- `--verbose` chỉ ảnh hưởng đến **độ chi tiết console** (và kiểu nhật ký WS); nó **không** nâng cấp độ nhật ký tệp.
- Để ghi lại các chi tiết chỉ xuất hiện ở chế độ chi tiết trong nhật ký tệp, đặt `logging.level` thành `debug` hoặc `trace`.
- Ghi nhật ký trace cũng bao gồm các tóm tắt thời gian chẩn đoán cho một số đường dẫn nóng được chọn, chẳng hạn như chuẩn bị factory công cụ Plugin. Xem [/tools/plugin#slow-plugin-tool-setup](/vi/tools/plugin#slow-plugin-tool-setup).

## Thu thập console

CLI thu thập `console.log/info/warn/error/debug/trace` và ghi chúng vào nhật ký tệp, trong khi vẫn in ra stdout/stderr.

Bạn có thể tinh chỉnh độ chi tiết console độc lập qua:

- `logging.consoleLevel` (mặc định `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Biên tập che giấu

OpenClaw có thể che các token nhạy cảm trước khi đầu ra nhật ký hoặc bản ghi hội thoại rời khỏi tiến trình. Chính sách biên tập che giấu nhật ký này được áp dụng ở các bồn nhận văn bản console, nhật ký tệp, bản ghi nhật ký OTLP và bản ghi hội thoại phiên, vì vậy các giá trị bí mật khớp mẫu sẽ được che trước khi các dòng JSONL hoặc thông điệp được ghi ra đĩa.

- `logging.redactSensitive`: `off` | `tools` (mặc định: `tools`)
- `logging.redactPatterns`: mảng các chuỗi regex (ghi đè mặc định)
  - Dùng chuỗi regex thô (tự động `gi`), hoặc `/pattern/flags` nếu bạn cần cờ tùy chỉnh.
  - Các khớp được che bằng cách giữ 6 ký tự đầu + 4 ký tự cuối (độ dài >= 18), nếu không thì `***`.
  - Mặc định bao phủ các phép gán khóa phổ biến, cờ CLI, trường JSON, header bearer, khối PEM, tiền tố token phổ biến và tên trường thông tin thanh toán như số thẻ, CVC/CVV, token thanh toán dùng chung và thông tin xác thực thanh toán.

Một số ranh giới an toàn luôn biên tập che giấu bất kể `logging.redactSensitive`.
Điều này bao gồm sự kiện gọi công cụ Control UI, đầu ra công cụ `sessions_history`, bản xuất hỗ trợ chẩn đoán, quan sát lỗi nhà cung cấp, hiển thị lệnh phê duyệt exec và nhật ký giao thức WebSocket của Gateway. Những bề mặt này vẫn có thể dùng `logging.redactPatterns` làm mẫu bổ sung, nhưng `redactSensitive: "off"` không khiến chúng phát ra bí mật thô.

## Nhật ký WebSocket của Gateway

Gateway in nhật ký giao thức WebSocket ở hai chế độ:

- **Chế độ bình thường (không có `--verbose`)**: chỉ in các kết quả RPC "đáng chú ý":
  - lỗi (`ok=false`)
  - lệnh gọi chậm (ngưỡng mặc định: `>= 50ms`)
  - lỗi phân tích cú pháp
- **Chế độ chi tiết (`--verbose`)**: in toàn bộ lưu lượng yêu cầu/phản hồi WS.

### Kiểu nhật ký WS

`openclaw gateway` hỗ trợ công tắc kiểu theo từng Gateway:

- `--ws-log auto` (mặc định): chế độ bình thường được tối ưu; chế độ chi tiết dùng đầu ra gọn
- `--ws-log compact`: đầu ra gọn (yêu cầu/phản hồi ghép cặp) khi chi tiết
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

Trình định dạng console **nhận biết TTY** và in các dòng nhất quán, có tiền tố.
Trình ghi nhật ký hệ con giữ đầu ra được nhóm và dễ quét.

Hành vi:

- **Tiền tố hệ con** trên mọi dòng (ví dụ `[gateway]`, `[canvas]`, `[tailscale]`)
- **Màu hệ con** (ổn định theo từng hệ con) cộng với tô màu cấp độ
- **Màu khi đầu ra là TTY hoặc môi trường trông giống terminal giàu tính năng** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tôn trọng `NO_COLOR`
- **Tiền tố hệ con rút gọn**: bỏ `gateway/` + `channels/` ở đầu, giữ 2 đoạn cuối (ví dụ `whatsapp/outbound`)
- **Trình ghi nhật ký con theo hệ con** (tự động thêm tiền tố + trường có cấu trúc `{ subsystem }`)
- **`logRaw()`** cho đầu ra QR/UX (không tiền tố, không định dạng)
- **Kiểu console** (ví dụ `pretty | compact | json`)
- **Cấp độ nhật ký console** tách biệt với cấp độ nhật ký tệp (tệp giữ đầy đủ chi tiết khi `logging.level` được đặt thành `debug`/`trace`)
- **Nội dung thông điệp WhatsApp** được ghi ở `debug` (dùng `--verbose` để xem)

Điều này giữ nhật ký tệp hiện có ổn định trong khi làm đầu ra tương tác dễ quét.

## Liên quan

- [Ghi nhật ký](/vi/logging)
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
