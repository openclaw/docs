---
read_when:
    - Xây dựng hoặc ký các bản dựng gỡ lỗi cho mac
summary: Các bước ký cho các bản dựng gỡ lỗi macOS do tập lệnh đóng gói tạo ra
title: Ký mã macOS
x-i18n:
    generated_at: "2026-05-06T09:21:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# ký mac (bản dựng debug)

Ứng dụng này thường được dựng từ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), hiện script này:

- đặt mã định danh gói debug ổn định: `ai.openclaw.mac.debug`
- ghi Info.plist với bundle id đó (ghi đè qua `BUNDLE_ID=...`)
- gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký binary chính và app bundle, để macOS xem mỗi lần dựng lại là cùng một bundle đã ký và giữ các quyền TCC (thông báo, trợ năng, ghi màn hình, mic, giọng nói). Để quyền ổn định, hãy dùng một danh tính ký thật; ad-hoc là tùy chọn cần bật rõ ràng và dễ hỏng (xem [quyền macOS](/vi/platforms/mac/permissions)).
- dùng `CODESIGN_TIMESTAMP=auto` theo mặc định; tùy chọn này bật dấu thời gian tin cậy cho chữ ký Developer ID. Đặt `CODESIGN_TIMESTAMP=off` để bỏ qua đóng dấu thời gian (bản dựng debug ngoại tuyến).
- chèn siêu dữ liệu bản dựng vào Info.plist: `OpenClawBuildTimestamp` (UTC) và `OpenClawGitCommit` (hash ngắn) để ngăn Giới thiệu có thể hiển thị bản dựng, git, và kênh debug/release.
- **Đóng gói mặc định dùng Node 24**: script chạy các bản dựng TS và bản dựng Control UI. Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ để tương thích.
- đọc `SIGN_IDENTITY` từ môi trường. Thêm `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (hoặc chứng chỉ Developer ID Application của bạn) vào shell rc để luôn ký bằng chứng chỉ của bạn. Ký ad-hoc cần bật rõ ràng qua `ALLOW_ADHOC_SIGNING=1` hoặc `SIGN_IDENTITY="-"` (không khuyến nghị để kiểm thử quyền).
- chạy kiểm tra Team ID sau khi ký và thất bại nếu bất kỳ Mach-O nào bên trong app bundle được ký bởi Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Cách dùng

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ghi chú về ký ad-hoc

Khi ký với `SIGN_IDENTITY="-"` (ad-hoc), script tự động tắt **Hardened Runtime** (`--options runtime`). Điều này cần thiết để tránh sự cố khi ứng dụng cố tải các framework nhúng (như Sparkle) không chia sẻ cùng Team ID. Chữ ký ad-hoc cũng làm hỏng khả năng duy trì quyền TCC; xem [quyền macOS](/vi/platforms/mac/permissions) để biết các bước khôi phục.

## Siêu dữ liệu bản dựng cho Giới thiệu

`package-mac-app.sh` đóng dấu bundle với:

- `OpenClawBuildTimestamp`: ISO8601 UTC tại thời điểm đóng gói
- `OpenClawGitCommit`: hash git ngắn (hoặc `unknown` nếu không có)

Tab Giới thiệu đọc các khóa này để hiển thị phiên bản, ngày dựng, commit git, và liệu đây có phải bản dựng debug hay không (qua `#if DEBUG`). Chạy trình đóng gói để làm mới các giá trị này sau khi thay đổi mã.

## Lý do

Quyền TCC gắn với bundle identifier _và_ chữ ký mã. Các bản dựng debug chưa ký với UUID thay đổi đã khiến macOS quên các quyền đã cấp sau mỗi lần dựng lại. Việc ký các binary (mặc định ad-hoc) và giữ cố định bundle id/đường dẫn (`dist/OpenClaw.app`) sẽ duy trì các quyền giữa các bản dựng, khớp với cách tiếp cận của VibeTunnel.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [quyền macOS](/vi/platforms/mac/permissions)
