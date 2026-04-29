---
read_when:
    - Thu thập nhật ký macOS hoặc điều tra việc ghi nhật ký dữ liệu riêng tư
    - Gỡ lỗi các sự cố vòng đời đánh thức bằng giọng nói/phiên
summary: 'Ghi nhật ký OpenClaw: nhật ký tệp chẩn đoán xoay vòng + cờ quyền riêng tư cho nhật ký hợp nhất'
title: Ghi nhật ký trên macOS
x-i18n:
    generated_at: "2026-04-29T22:57:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Ghi nhật ký (macOS)

## Tệp nhật ký chẩn đoán xoay vòng (ngăn Gỡ lỗi)

OpenClaw định tuyến nhật ký ứng dụng macOS qua swift-log (mặc định là ghi nhật ký hợp nhất) và có thể ghi một tệp nhật ký cục bộ, xoay vòng vào ổ đĩa khi bạn cần bản ghi bền vững.

- Mức độ chi tiết: **Ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → Mức độ chi tiết**
- Bật: **Ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → “Ghi nhật ký chẩn đoán xoay vòng (JSONL)”**
- Vị trí: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (tự động xoay vòng; các tệp cũ được thêm hậu tố `.1`, `.2`, …)
- Xóa: **Ngăn Gỡ lỗi → Nhật ký → Ghi nhật ký ứng dụng → “Xóa”**

Ghi chú:

- Tính năng này **tắt theo mặc định**. Chỉ bật khi đang chủ động gỡ lỗi.
- Xem tệp này là nhạy cảm; đừng chia sẻ nếu chưa xem xét.

## Dữ liệu riêng tư trong ghi nhật ký hợp nhất trên macOS

Ghi nhật ký hợp nhất sẽ che hầu hết payload trừ khi một subsystem chọn tham gia `privacy -off`. Theo bài viết của Peter về [các trò rắc rối về quyền riêng tư khi ghi nhật ký](https://steipete.me/posts/2025/logging-privacy-shenanigans) trên macOS (2025), điều này được kiểm soát bởi một plist trong `/Library/Preferences/Logging/Subsystems/` với khóa là tên subsystem. Chỉ các mục nhật ký mới nhận cờ này, vì vậy hãy bật nó trước khi tái hiện sự cố.

## Bật cho OpenClaw (`ai.openclaw`)

- Ghi plist vào tệp tạm trước, rồi cài đặt nguyên tử với quyền root:

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

- Không cần khởi động lại; logd sẽ nhận thấy tệp rất nhanh, nhưng chỉ các dòng nhật ký mới sẽ bao gồm payload riêng tư.
- Xem đầu ra phong phú hơn bằng helper hiện có, ví dụ `./scripts/clawlog.sh --category WebChat --last 5m`.

## Tắt sau khi gỡ lỗi

- Gỡ bỏ phần ghi đè: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Tùy chọn chạy `sudo log config --reload` để buộc logd bỏ phần ghi đè ngay lập tức.
- Hãy nhớ bề mặt này có thể bao gồm số điện thoại và nội dung tin nhắn; chỉ giữ plist tại chỗ khi bạn chủ động cần thêm chi tiết.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Ghi nhật ký Gateway](/vi/gateway/logging)
