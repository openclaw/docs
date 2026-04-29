---
read_when:
    - Gỡ lỗi các lời nhắc cấp quyền macOS bị thiếu hoặc bị kẹt
    - Đóng gói hoặc ký ứng dụng macOS
    - Thay đổi ID gói hoặc đường dẫn cài đặt ứng dụng
summary: Duy trì quyền trên macOS (TCC) và yêu cầu ký
title: Quyền trên macOS
x-i18n:
    generated_at: "2026-04-29T22:57:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Cấp quyền trên macOS rất dễ hỏng. TCC liên kết một quyền đã cấp với
chữ ký mã, mã định danh bundle và đường dẫn trên đĩa của ứng dụng. Nếu bất kỳ phần nào trong đó thay đổi,
macOS sẽ xem ứng dụng là mới và có thể bỏ hoặc ẩn lời nhắc.

## Yêu cầu để quyền ổn định

- Cùng đường dẫn: chạy ứng dụng từ một vị trí cố định (với OpenClaw, `dist/OpenClaw.app`).
- Cùng mã định danh bundle: việc thay đổi bundle ID tạo ra một danh tính quyền mới.
- Ứng dụng đã ký: các bản dựng chưa ký hoặc được ký ad-hoc sẽ không lưu quyền bền vững.
- Chữ ký nhất quán: dùng chứng chỉ Apple Development hoặc Developer ID thật
  để chữ ký duy trì ổn định qua các lần dựng lại.

Chữ ký ad-hoc tạo ra một danh tính mới sau mỗi lần dựng. macOS sẽ quên các
quyền đã cấp trước đó, và lời nhắc có thể biến mất hoàn toàn cho đến khi các mục cũ được xóa.

## Danh sách kiểm tra khôi phục khi lời nhắc biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong Cài đặt Hệ thống -> Quyền riêng tư & Bảo mật.
3. Khởi chạy lại ứng dụng từ cùng đường dẫn và cấp lại quyền.
4. Nếu lời nhắc vẫn không xuất hiện, đặt lại các mục TCC bằng `tccutil` rồi thử lại.
5. Một số quyền chỉ xuất hiện lại sau khi khởi động lại macOS hoàn toàn.

Ví dụ đặt lại (thay bundle ID khi cần):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền với tệp và thư mục (Desktop/Documents/Downloads)

macOS cũng có thể kiểm soát Desktop, Documents và Downloads đối với các tiến trình terminal/nền. Nếu thao tác đọc tệp hoặc liệt kê thư mục bị treo, hãy cấp quyền truy cập cho đúng ngữ cảnh tiến trình thực hiện thao tác tệp (ví dụ Terminal/iTerm, ứng dụng do LaunchAgent khởi chạy, hoặc tiến trình SSH).

Cách khắc phục tạm thời: di chuyển tệp vào workspace của OpenClaw (`~/.openclaw/workspace`) nếu bạn muốn tránh phải cấp quyền theo từng thư mục.

Nếu bạn đang kiểm thử quyền, hãy luôn ký bằng chứng chỉ thật. Các bản dựng ad-hoc
chỉ phù hợp cho những lần chạy cục bộ nhanh khi quyền không quan trọng.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [ký macOS](/vi/platforms/mac/signing)
