---
read_when:
    - Biên dịch hoặc ký các bản dựng gỡ lỗi cho Mac
summary: Các bước ký cho bản dựng gỡ lỗi macOS được tạo bởi các tập lệnh đóng gói
title: Ký mã macOS
x-i18n:
    generated_at: "2026-06-27T17:42:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# ký mac (bản dựng gỡ lỗi)

Ứng dụng này thường được dựng từ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), hiện sẽ:

- đặt mã định danh gói gỡ lỗi ổn định: `ai.openclaw.mac.debug`
- ghi Info.plist với bundle id đó (ghi đè qua `BUNDLE_ID=...`)
- gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký binary chính và app bundle để macOS coi mỗi lần dựng lại là cùng một bundle đã ký và giữ quyền TCC (thông báo, trợ năng, ghi màn hình, mic, giọng nói). Để quyền ổn định, hãy dùng danh tính ký thật; ad-hoc là tùy chọn bật rõ ràng và dễ hỏng (xem [quyền macOS](/vi/platforms/mac/permissions)).
- dùng `CODESIGN_TIMESTAMP=auto` theo mặc định; tùy chọn này bật dấu thời gian tin cậy cho chữ ký Developer ID. Đặt `CODESIGN_TIMESTAMP=off` để bỏ qua việc đóng dấu thời gian (bản dựng gỡ lỗi ngoại tuyến).
- chèn siêu dữ liệu bản dựng vào Info.plist: `OpenClawBuildTimestamp` (UTC) và `OpenClawGitCommit` (hash ngắn) để khung About có thể hiển thị bản dựng, git và kênh debug/release.
- **Đóng gói mặc định dùng Node 24**: script chạy bản dựng TS và bản dựng Control UI. Node 22 LTS, hiện là `22.19+`, vẫn được hỗ trợ để tương thích.
- đọc `SIGN_IDENTITY` từ môi trường. Thêm `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (hoặc chứng chỉ Developer ID Application của bạn) vào shell rc để luôn ký bằng chứng chỉ của bạn. Ký ad-hoc yêu cầu bật rõ ràng qua `ALLOW_ADHOC_SIGNING=1` hoặc `SIGN_IDENTITY="-"` (không khuyến nghị để kiểm thử quyền).
- chạy kiểm tra Team ID sau khi ký và thất bại nếu bất kỳ Mach-O nào bên trong app bundle được ký bởi Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Cách sử dụng

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ghi chú về ký ad-hoc

Khi ký bằng `SIGN_IDENTITY="-"` (ad-hoc), script tự động tắt **Hardened Runtime** (`--options runtime`). Điều này cần thiết để ngăn sự cố crash khi ứng dụng cố tải các framework nhúng (như Sparkle) không dùng cùng Team ID. Chữ ký ad-hoc cũng làm hỏng khả năng duy trì quyền TCC; xem [quyền macOS](/vi/platforms/mac/permissions) để biết các bước khôi phục.

## Siêu dữ liệu bản dựng cho About

`package-mac-app.sh` đóng dấu bundle với:

- `OpenClawBuildTimestamp`: UTC ISO8601 tại thời điểm đóng gói
- `OpenClawGitCommit`: hash git ngắn (hoặc `unknown` nếu không có)

Tab About đọc các khóa này để hiển thị phiên bản, ngày dựng, git commit và liệu đây có phải bản dựng gỡ lỗi hay không (qua `#if DEBUG`). Chạy trình đóng gói để làm mới các giá trị này sau khi thay đổi mã.

## Lý do

Quyền TCC gắn với mã định danh bundle _và_ chữ ký mã. Các bản dựng gỡ lỗi chưa ký với UUID thay đổi đã khiến macOS quên các quyền đã cấp sau mỗi lần dựng lại. Ký các binary (ad-hoc theo mặc định) và giữ cố định bundle id/đường dẫn (`dist/OpenClaw.app`) sẽ giữ các quyền giữa các bản dựng, khớp với cách tiếp cận VibeTunnel.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [quyền macOS](/vi/platforms/mac/permissions)
