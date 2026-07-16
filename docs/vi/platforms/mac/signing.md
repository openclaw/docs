---
read_when:
    - Xây dựng hoặc ký các bản dựng gỡ lỗi cho macOS
summary: Các bước ký cho bản dựng gỡ lỗi macOS do các tập lệnh đóng gói tạo ra
title: Ký mã macOS
x-i18n:
    generated_at: "2026-07-16T14:39:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# ký ứng dụng mac (bản dựng gỡ lỗi)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) dựng và đóng gói ứng dụng vào một đường dẫn cố định (`dist/OpenClaw.app`), sau đó gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký ứng dụng. Các quyền TCC được liên kết với ID gói và chữ ký mã; việc giữ ổn định cả hai (và giữ ứng dụng tại một đường dẫn cố định) qua các lần dựng lại giúp macOS không quên các quyền TCC đã cấp (thông báo, trợ năng, ghi màn hình, micrô, giọng nói).

- Định danh gói gỡ lỗi mặc định là `ai.openclaw.mac.debug` (ghi đè bằng `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25`, hoặc `>=25.9.0` (`package.json` của kho mã `engines`). Trình đóng gói cũng dựng Giao diện điều khiển (`pnpm ui:build`).
- Theo mặc định, yêu cầu một danh tính ký thực; tập lệnh codesign sẽ thoát với lỗi nếu không tìm thấy danh tính nào và `ALLOW_ADHOC_SIGNING` chưa được đặt. Ký ad-hoc (`SIGN_IDENTITY="-"`) phải được chủ động bật và không duy trì các quyền TCC qua các lần dựng lại. Xem [quyền trên macOS](/vi/platforms/mac/permissions).
- Đọc `SIGN_IDENTITY` từ môi trường (ví dụ: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, hoặc chứng chỉ Developer ID Application). Nếu không có, `codesign-mac-app.sh` sẽ tự động chọn một danh tính theo thứ tự sau: Developer ID Application, Apple Distribution, Apple Development, rồi đến danh tính ký mã hợp lệ đầu tiên tìm thấy.
- `CODESIGN_TIMESTAMP=auto` (mặc định) chỉ bật dấu thời gian tin cậy cho chữ ký Developer ID Application. Đặt `on`/`off` để buộc bật hoặc tắt.
- Ghi vào Info.plist các giá trị `OpenClawBuildTimestamp` (ISO8601 UTC) và `OpenClawGitCommit` (hàm băm ngắn, `unknown` nếu không có) để thẻ Giới thiệu có thể hiển thị bản dựng, git và kênh gỡ lỗi/phát hành.
- Chạy kiểm tra Team ID sau khi ký và báo lỗi nếu bất kỳ tệp Mach-O nào bên trong gói có Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Cách sử dụng

```bash
# từ thư mục gốc của kho mã
scripts/package-mac-app.sh                                                      # tự động chọn danh tính; báo lỗi nếu không tìm thấy
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # chứng chỉ thực
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (các quyền sẽ không được duy trì)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad-hoc tường minh (có cùng hạn chế)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # giải pháp tạm thời chỉ dành cho phát triển khi Team ID của Sparkle không khớp
```

### Lưu ý về ký ad-hoc

`SIGN_IDENTITY="-"` vô hiệu hóa Hardened Runtime (`--options runtime`) để ngăn sự cố khi ứng dụng tải các framework nhúng (như Sparkle) không dùng chung Team ID. Chữ ký ad-hoc cũng làm mất khả năng duy trì quyền TCC; xem [quyền trên macOS](/vi/platforms/mac/permissions) để biết các bước khôi phục.

## Siêu dữ liệu bản dựng cho phần Giới thiệu

Thẻ Giới thiệu đọc `OpenClawBuildTimestamp` và `OpenClawGitCommit` từ Info.plist để hiển thị phiên bản, ngày dựng, commit git và liệu bản dựng có phải là DEBUG hay không (thông qua `#if DEBUG`). Chạy lại trình đóng gói sau khi thay đổi mã để làm mới các giá trị này.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [quyền trên macOS](/vi/platforms/mac/permissions)
