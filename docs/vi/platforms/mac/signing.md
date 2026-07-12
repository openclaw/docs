---
read_when:
    - Xây dựng hoặc ký các bản dựng gỡ lỗi cho macOS
summary: Các bước ký cho bản dựng gỡ lỗi macOS do các tập lệnh đóng gói tạo ra
title: Ký mã macOS
x-i18n:
    generated_at: "2026-07-12T08:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Ký mã mac (bản dựng gỡ lỗi)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) dựng và đóng gói ứng dụng vào một đường dẫn cố định (`dist/OpenClaw.app`), sau đó gọi [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) để ký mã. Quyền TCC được liên kết với ID gói ứng dụng và chữ ký mã; việc giữ ổn định cả hai (cũng như giữ ứng dụng tại một đường dẫn cố định) qua các lần dựng lại giúp macOS không quên các quyền TCC đã cấp (thông báo, trợ năng, ghi màn hình, micrô, nhận dạng giọng nói).

- Mã định danh gói ứng dụng gỡ lỗi mặc định là `ai.openclaw.mac.debug` (ghi đè bằng `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` hoặc `>=23.11.0` (`engines` trong `package.json` của kho mã nguồn). Trình đóng gói cũng dựng giao diện điều khiển (`pnpm ui:build`).
- Theo mặc định, yêu cầu danh tính ký thực; tập lệnh ký mã sẽ thoát với lỗi nếu không tìm thấy danh tính nào và `ALLOW_ADHOC_SIGNING` chưa được đặt. Ký tùy biến (`SIGN_IDENTITY="-"`) yêu cầu chủ động bật và không duy trì quyền TCC qua các lần dựng lại. Xem [quyền trên macOS](/vi/platforms/mac/permissions).
- Đọc `SIGN_IDENTITY` từ môi trường (ví dụ: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` hoặc chứng chỉ Developer ID Application). Nếu không có biến này, `codesign-mac-app.sh` sẽ tự động chọn một danh tính theo thứ tự: Developer ID Application, Apple Distribution, Apple Development, rồi đến danh tính ký mã hợp lệ đầu tiên tìm thấy.
- `CODESIGN_TIMESTAMP=auto` (mặc định) chỉ bật dấu thời gian đáng tin cậy cho chữ ký Developer ID Application. Đặt thành `on`/`off` để buộc bật hoặc tắt.
- Ghi `OpenClawBuildTimestamp` (ISO8601 UTC) và `OpenClawGitCommit` (hàm băm rút gọn, `unknown` nếu không có) vào Info.plist để thẻ Giới thiệu có thể hiển thị bản dựng, git và kênh gỡ lỗi/phát hành.
- Chạy kiểm tra Team ID sau khi ký và báo lỗi nếu bất kỳ tệp Mach-O nào trong gói ứng dụng có Team ID khác. Đặt `SKIP_TEAM_ID_CHECK=1` để bỏ qua.

## Cách sử dụng

```bash
# từ thư mục gốc của kho mã nguồn
scripts/package-mac-app.sh                                                      # tự động chọn danh tính; báo lỗi nếu không tìm thấy
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # chứng chỉ thực
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # tùy biến (quyền sẽ không được duy trì)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # tùy biến tường minh (cùng hạn chế)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # giải pháp chỉ dành cho phát triển khi Team ID của Sparkle không khớp
```

### Lưu ý về ký tùy biến

`SIGN_IDENTITY="-"` vô hiệu hóa Hardened Runtime (`--options runtime`) để ngăn sự cố khi ứng dụng tải các framework nhúng (như Sparkle) không có cùng Team ID. Chữ ký tùy biến cũng khiến quyền TCC không được duy trì; xem [quyền trên macOS](/vi/platforms/mac/permissions) để biết các bước khôi phục.

## Siêu dữ liệu bản dựng cho phần Giới thiệu

Thẻ Giới thiệu đọc `OpenClawBuildTimestamp` và `OpenClawGitCommit` từ Info.plist để hiển thị phiên bản, ngày dựng, commit git và liệu đây có phải là bản dựng DEBUG hay không (thông qua `#if DEBUG`). Chạy lại trình đóng gói sau khi thay đổi mã để làm mới các giá trị này.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Quyền trên macOS](/vi/platforms/mac/permissions)
