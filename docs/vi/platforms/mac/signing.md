---
read_when:
    - Tạo hoặc ký các bản dựng gỡ lỗi cho Mac
summary: Các bước ký cho các bản dựng gỡ lỗi macOS do các tập lệnh đóng gói tạo ra
title: Ký macOS
x-i18n:
    generated_at: "2026-05-07T13:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# ký mac (bản dựng debug)

Ứng dụng này thường được dựng từ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), hiện sẽ:

- đặt một mã định danh gói debug ổn định: `ai.openclaw.mac.debug`
- ghi Info.plist với bundle id đó (ghi đè bằng `BUNDLE_ID=...`)
- gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký binary chính và gói ứng dụng, để macOS xem mỗi lần dựng lại là cùng một gói đã ký và giữ lại các quyền TCC (thông báo, trợ năng, ghi màn hình, mic, giọng nói). Để quyền ổn định, hãy dùng danh tính ký thật; ad-hoc cần bật rõ ràng và dễ hỏng (xem [quyền macOS](/vi/platforms/mac/permissions)).
- dùng `CODESIGN_TIMESTAMP=auto` theo mặc định; nó bật timestamp đáng tin cậy cho chữ ký Developer ID. Đặt `CODESIGN_TIMESTAMP=off` để bỏ qua timestamping (bản dựng debug ngoại tuyến).
- chèn siêu dữ liệu bản dựng vào Info.plist: `OpenClawBuildTimestamp` (UTC) và `OpenClawGitCommit` (hash ngắn) để ngăn Giới thiệu có thể hiển thị bản dựng, git và kênh debug/release.
- **Đóng gói mặc định dùng Node 24**: script chạy các bản dựng TS và bản dựng Control UI. Node 22 LTS, hiện là `22.16+`, vẫn được hỗ trợ để tương thích.
- đọc `SIGN_IDENTITY` từ môi trường. Thêm `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (hoặc chứng chỉ Developer ID Application của bạn) vào shell rc để luôn ký bằng chứng chỉ của bạn. Ký ad-hoc yêu cầu bật rõ ràng qua `ALLOW_ADHOC_SIGNING=1` hoặc `SIGN_IDENTITY="-"` (không khuyến nghị cho kiểm thử quyền).
- chạy kiểm tra Team ID sau khi ký và thất bại nếu bất kỳ Mach-O nào bên trong gói ứng dụng được ký bởi Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Cách sử dụng

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Lưu ý về ký ad-hoc

Khi ký bằng `SIGN_IDENTITY="-"` (ad-hoc), script tự động tắt **Hardened Runtime** (`--options runtime`). Điều này là cần thiết để ngăn lỗi crash khi ứng dụng cố tải các framework nhúng (như Sparkle) không dùng chung Team ID. Chữ ký ad-hoc cũng làm hỏng khả năng duy trì quyền TCC; xem [quyền macOS](/vi/platforms/mac/permissions) để biết các bước khôi phục.

## Siêu dữ liệu bản dựng cho Giới thiệu

`package-mac-app.sh` đóng dấu gói bằng:

- `OpenClawBuildTimestamp`: ISO8601 UTC tại thời điểm đóng gói
- `OpenClawGitCommit`: hash git ngắn (hoặc `unknown` nếu không có)

Tab Giới thiệu đọc các khóa này để hiển thị phiên bản, ngày dựng, commit git và đó có phải là bản dựng debug hay không (qua `#if DEBUG`). Chạy trình đóng gói để làm mới các giá trị này sau khi thay đổi mã.

## Lý do

Quyền TCC được gắn với mã định danh gói _và_ chữ ký mã. Các bản dựng debug chưa ký với UUID thay đổi đã khiến macOS quên các quyền đã cấp sau mỗi lần dựng lại. Việc ký các binary (ad-hoc theo mặc định) và giữ bundle id/đường dẫn cố định (`dist/OpenClaw.app`) bảo toàn các quyền giữa các bản dựng, khớp với cách tiếp cận của VibeTunnel.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [quyền macOS](/vi/platforms/mac/permissions)
