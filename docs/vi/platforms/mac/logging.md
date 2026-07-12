---
read_when:
    - Thu thập nhật ký macOS hoặc điều tra việc ghi nhật ký dữ liệu riêng tư
    - Gỡ lỗi các sự cố về vòng đời kích hoạt bằng giọng nói/phiên làm việc
summary: 'Nhật ký OpenClaw: nhật ký tệp chẩn đoán luân phiên + các cờ quyền riêng tư thống nhất cho nhật ký'
title: Ghi nhật ký trên macOS
x-i18n:
    generated_at: "2026-07-12T08:05:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Ghi nhật ký (macOS)

## Nhật ký tệp chẩn đoán luân phiên (ngăn Gỡ lỗi)

Ứng dụng macOS ghi nhật ký thông qua swift-log (mặc định là hệ thống ghi nhật ký hợp nhất) và cũng có thể ghi vào một tệp nhật ký cục bộ luân phiên để lưu giữ lâu dài (`DiagnosticsFileLog`).

- Bật: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (mặc định tắt).
- Mức độ chi tiết: bộ chọn **Debug pane -> Logs -> App logging -> Verbosity**.
- Vị trí: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Luân phiên: luân phiên khi đạt 5 MB; tối đa 5 bản sao lưu có hậu tố `.1`...`.5` (bản cũ nhất bị xóa).
- Xóa: **Debug pane -> Logs -> App logging -> "Clear"** xóa tệp đang hoạt động và tất cả bản sao lưu.

Hãy coi tệp này là dữ liệu nhạy cảm; không chia sẻ khi chưa kiểm tra.

## Dữ liệu riêng tư trong hệ thống ghi nhật ký hợp nhất trên macOS

Hệ thống ghi nhật ký hợp nhất che giấu hầu hết nội dung dữ liệu trừ khi một hệ thống con bật `privacy -off`. Thiết lập này được kiểm soát bằng một tệp plist trong `/Library/Preferences/Logging/Subsystems/`, với khóa là tên hệ thống con. Chỉ các mục nhật ký mới áp dụng cờ này, vì vậy hãy bật nó trước khi tái hiện sự cố. Thông tin nền: [những rắc rối về quyền riêng tư khi ghi nhật ký trên macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Bật cho OpenClaw (`ai.openclaw`)

Trước tiên, ghi plist vào một tệp tạm, sau đó cài đặt nguyên tử với quyền root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Không cần khởi động lại; logd nhanh chóng nhận tệp, nhưng chỉ các dòng nhật ký mới chứa nội dung dữ liệu riêng tư. Xem đầu ra chi tiết hơn bằng `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` đặt khoảng thời gian, mặc định là `5m`; `--category`/`-c` lọc theo danh mục).

## Tắt sau khi gỡ lỗi

- Xóa thiết lập ghi đè: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Có thể chạy `sudo log config --reload` để buộc logd loại bỏ thiết lập ghi đè ngay lập tức.
- Bề mặt này có thể chứa số điện thoại và nội dung tin nhắn; chỉ giữ plist tại chỗ khi đang thực sự cần dùng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Ghi nhật ký Gateway](/vi/gateway/logging)
