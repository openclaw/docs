---
read_when:
    - Bạn sử dụng plugin cuộc gọi thoại và muốn mọi điểm vào CLI
    - Bạn cần các bảng cờ và giá trị mặc định cho `setup`, `smoke`, `call`, `continue`, `speak`, `dtmf`, `end`, `status`, `tail`, `latency`, `expose` và `start`
summary: Tài liệu tham khảo CLI cho `openclaw voicecall` (bề mặt lệnh của Plugin gọi thoại)
title: Cuộc gọi thoại
x-i18n:
    generated_at: "2026-07-12T07:47:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` là lệnh do plugin cung cấp. Lệnh này chỉ xuất hiện khi plugin cuộc gọi thoại được cài đặt và bật.

Khi Gateway đang chạy, các lệnh vận hành (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) được định tuyến đến môi trường chạy cuộc gọi thoại của Gateway đó. Nếu không thể kết nối đến Gateway nào, chúng sẽ chuyển sang môi trường chạy CLI độc lập.

## Lệnh con

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Lệnh con   | Mô tả                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `setup`    | Hiển thị các bước kiểm tra mức độ sẵn sàng của nhà cung cấp và webhook.   |
| `smoke`    | Chạy các bước kiểm tra mức độ sẵn sàng; chỉ thực hiện cuộc gọi thử trực tiếp khi có `--yes`. |
| `call`     | Khởi tạo cuộc gọi thoại đi.                                               |
| `start`    | Bí danh của `call`, trong đó bắt buộc có `--to` và `--message` là tùy chọn. |
| `continue` | Phát một tin nhắn và chờ phản hồi tiếp theo.                              |
| `speak`    | Phát một tin nhắn mà không chờ phản hồi.                                  |
| `dtmf`     | Gửi các chữ số DTMF đến cuộc gọi đang hoạt động.                          |
| `end`      | Ngắt cuộc gọi đang hoạt động.                                             |
| `status`   | Kiểm tra các cuộc gọi đang hoạt động (hoặc một cuộc gọi theo `--call-id`). |
| `tail`     | Theo dõi phần cuối của `calls.jsonl` (hữu ích khi kiểm thử nhà cung cấp). |
| `latency`  | Tóm tắt các chỉ số độ trễ lượt từ `calls.jsonl`.                          |
| `expose`   | Bật/tắt Tailscale Serve/Funnel cho điểm cuối webhook.                     |

## Thiết lập và kiểm thử nhanh

### `setup`

Theo mặc định, in các bước kiểm tra mức độ sẵn sàng ở định dạng con người có thể đọc được. Truyền `--json` để dùng trong tập lệnh.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Chạy cùng các bước kiểm tra mức độ sẵn sàng. Chỉ thực hiện cuộc gọi điện thoại thực khi có cả `--to` và `--yes`.

| Cờ                 | Mặc định                          | Mô tả                                              |
| ------------------ | --------------------------------- | -------------------------------------------------- |
| `-t, --to <phone>` | (không có)                        | Số điện thoại cần gọi để kiểm thử nhanh trực tiếp. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Tin nhắn sẽ phát trong cuộc gọi kiểm thử nhanh.    |
| `--mode <mode>`    | `notify`                          | Chế độ gọi: `notify` hoặc `conversation`.          |
| `--yes`            | `false`                           | Thực sự thực hiện cuộc gọi đi trực tiếp.           |
| `--json`           | `false`                           | In JSON mà máy có thể đọc được.                    |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # chạy thử
openclaw voicecall smoke --to "+15555550123" --yes  # cuộc gọi thông báo trực tiếp
```

<Note>
Đối với các nhà cung cấp bên ngoài (`plivo`, `telnyx`, `twilio`), `setup` và `smoke` yêu cầu URL webhook công khai từ `publicUrl`, đường hầm hoặc khả năng truy cập qua Tailscale. Phương án dự phòng dùng local loopback hoặc dịch vụ riêng tư sẽ bị từ chối vì nhà mạng không thể truy cập.
</Note>

## Vòng đời cuộc gọi

### `call`

Khởi tạo cuộc gọi thoại đi.

| Cờ                     | Bắt buộc | Mặc định          | Mô tả                                                                                              |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `-m, --message <text>` | có       | (không có)        | Tin nhắn sẽ phát khi cuộc gọi kết nối.                                                             |
| `-t, --to <phone>`     | không    | cấu hình `toNumber` | Số điện thoại E.164 cần gọi.                                                                     |
| `--mode <mode>`        | không    | `conversation`    | Chế độ gọi: `notify` (ngắt máy sau tin nhắn) hoặc `conversation` (duy trì kết nối).                |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Bí danh của `call` với dạng cờ mặc định khác.

| Cờ                 | Bắt buộc | Mặc định       | Mô tả                                  |
| ------------------ | -------- | -------------- | -------------------------------------- |
| `--to <phone>`     | có       | (không có)     | Số điện thoại cần gọi.                 |
| `--message <text>` | không    | (không có)     | Tin nhắn sẽ phát khi cuộc gọi kết nối. |
| `--mode <mode>`    | không    | `conversation` | Chế độ gọi: `notify` hoặc `conversation`. |

### `continue`

Phát một tin nhắn và chờ phản hồi.

| Cờ                 | Bắt buộc | Mô tả             |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | có       | ID cuộc gọi.      |
| `--message <text>` | có       | Tin nhắn cần phát. |

### `speak`

Phát một tin nhắn mà không chờ phản hồi.

| Cờ                 | Bắt buộc | Mô tả             |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | có       | ID cuộc gọi.      |
| `--message <text>` | có       | Tin nhắn cần phát. |

### `dtmf`

Gửi các chữ số DTMF đến cuộc gọi đang hoạt động.

| Cờ                  | Bắt buộc | Mô tả                                                      |
| ------------------- | -------- | ---------------------------------------------------------- |
| `--call-id <id>`    | có       | ID cuộc gọi.                                               |
| `--digits <digits>` | có       | Các chữ số DTMF (ví dụ: `ww123456#` để chèn khoảng chờ).   |

### `end`

Ngắt cuộc gọi đang hoạt động.

| Cờ               | Bắt buộc | Mô tả        |
| ---------------- | -------- | ------------ |
| `--call-id <id>` | có       | ID cuộc gọi. |

### `status`

Kiểm tra các cuộc gọi đang hoạt động.

| Cờ               | Mặc định   | Mô tả                                      |
| ---------------- | ---------- | ------------------------------------------ |
| `--call-id <id>` | (không có) | Giới hạn đầu ra ở một cuộc gọi.            |
| `--json`         | `false`    | In JSON mà máy có thể đọc được.            |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Nhật ký và chỉ số

### `tail`

Theo dõi phần cuối của nhật ký JSONL cuộc gọi thoại. Khi bắt đầu, in `--since` dòng cuối cùng, sau đó truyền phát các dòng mới khi chúng được ghi.

| Cờ              | Mặc định                       | Mô tả                                      |
| --------------- | ------------------------------ | ------------------------------------------ |
| `--file <path>` | được phân giải từ kho plugin   | Đường dẫn đến `calls.jsonl`.               |
| `--since <n>`   | `25`                           | Số dòng cần in trước khi bắt đầu theo dõi. |
| `--poll <ms>`   | `250` (tối thiểu 50)           | Khoảng thời gian thăm dò tính bằng mili giây. |

### `latency`

Tóm tắt các chỉ số độ trễ lượt và thời gian chờ nghe từ `calls.jsonl`. Đầu ra là JSON với các bản tóm tắt `recordsScanned`, `turnLatency` và `listenWait`.

| Cờ              | Mặc định                     | Mô tả                                  |
| --------------- | ---------------------------- | -------------------------------------- |
| `--file <path>` | được phân giải từ kho plugin | Đường dẫn đến `calls.jsonl`.           |
| `--last <n>`    | `200` (tối thiểu 1)          | Số bản ghi gần đây cần phân tích.      |

## Công khai webhook

### `expose`

Bật, tắt hoặc thay đổi cấu hình Tailscale Serve/Funnel cho webhook thoại.

| Cờ                    | Mặc định                                      | Mô tả                                               |
| --------------------- | --------------------------------------------- | --------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                      | `off`, `serve` (tailnet) hoặc `funnel` (công khai). |
| `--path <path>`       | cấu hình `tailscale.path` hoặc `--serve-path` | Đường dẫn Tailscale cần công khai.                   |
| `--port <port>`       | cấu hình `serve.port` hoặc `3334`             | Cổng webhook cục bộ.                                |
| `--serve-path <path>` | cấu hình `serve.path` hoặc `/voice/webhook`   | Đường dẫn webhook cục bộ.                           |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Chỉ công khai điểm cuối webhook cho các mạng mà bạn tin cậy. Ưu tiên Tailscale Serve hơn Funnel khi có thể.
</Warning>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
