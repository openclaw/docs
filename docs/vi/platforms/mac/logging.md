---
read_when:
    - Ghi lại nhật ký macOS hoặc điều tra việc ghi nhật ký dữ liệu riêng tư
    - Gỡ lỗi các sự cố về vòng đời đánh thức bằng giọng nói/phiên thoại
summary: 'Ghi nhật ký OpenClaw: nhật ký tệp chẩn đoán xoay vòng + cờ quyền riêng tư của nhật ký hợp nhất'
title: Ghi nhật ký trên macOS
x-i18n:
    generated_at: "2026-05-06T09:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Ghi nhật ký (macOS)

## Nhật ký tệp chẩn đoán luân phiên (ngăn Gỡ lỗi)

OpenClaw định tuyến nhật ký ứng dụng macOS qua swift-log (mặc định là ghi nhật ký hợp nhất) và có thể ghi nhật ký tệp cục bộ, luân phiên vào ổ đĩa khi bạn cần một bản ghi bền vững.

- Mức độ chi tiết: **ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → Mức độ chi tiết**
- Bật: **ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → "Ghi nhật ký chẩn đoán luân phiên (JSONL)"**
- Vị trí: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (tự động luân phiên; các tệp cũ được thêm hậu tố `.1`, `.2`, …)
- Xóa: **ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → "Xóa"**

Ghi chú:

- Tính năng này **tắt theo mặc định**. Chỉ bật khi đang chủ động gỡ lỗi.
- Xem tệp này là nhạy cảm; đừng chia sẻ khi chưa xem xét.

## Dữ liệu riêng tư trong ghi nhật ký hợp nhất trên macOS

Ghi nhật ký hợp nhất sẽ biên tập lại hầu hết payload trừ khi một subsystem chọn tham gia `privacy -off`. Theo bài viết của Peter về [những rắc rối về quyền riêng tư khi ghi nhật ký](https://steipete.me/posts/2025/logging-privacy-shenanigans) trên macOS (2025), điều này được kiểm soát bởi một plist trong `/Library/Preferences/Logging/Subsystems/` được khóa theo tên subsystem. Chỉ các mục nhật ký mới nhận cờ này, vì vậy hãy bật trước khi tái hiện sự cố.

## Bật cho OpenClaw (`ai.openclaw`)

- Trước tiên ghi plist vào một tệp tạm, sau đó cài đặt nguyên tử dưới quyền root:

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

- Không cần khởi động lại; logd nhận thấy tệp nhanh chóng, nhưng chỉ các dòng nhật ký mới sẽ bao gồm payload riêng tư.
- Xem đầu ra chi tiết hơn bằng trình trợ giúp hiện có, ví dụ: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Tắt sau khi gỡ lỗi

- Gỡ bỏ override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Có thể chạy `sudo log config --reload` để buộc logd bỏ override ngay lập tức.
- Hãy nhớ rằng bề mặt này có thể bao gồm số điện thoại và nội dung tin nhắn; chỉ giữ plist tại chỗ trong khi bạn chủ động cần chi tiết bổ sung.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [ghi nhật ký Gateway](/vi/gateway/logging)
