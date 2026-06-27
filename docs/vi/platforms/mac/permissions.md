---
read_when:
    - Gỡ lỗi lời nhắc quyền macOS bị thiếu hoặc bị kẹt
    - Quyết định có cấp quyền Trợ năng cho node hoặc môi trường chạy CLI hay không
    - Đóng gói hoặc ký ứng dụng macOS
    - Thay đổi ID gói hoặc đường dẫn cài đặt ứng dụng
summary: Yêu cầu về tính duy trì quyền macOS (TCC) và ký mã
title: Quyền trên macOS
x-i18n:
    generated_at: "2026-06-27T17:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Các cấp quyền trên macOS rất dễ bị ảnh hưởng. TCC liên kết một cấp quyền với chữ ký mã, mã định danh gói và đường dẫn trên ổ đĩa của ứng dụng. Nếu bất kỳ yếu tố nào trong số đó thay đổi, macOS sẽ xem ứng dụng là mới và có thể bỏ hoặc ẩn các lời nhắc.

## Yêu cầu để quyền ổn định

- Cùng đường dẫn: chạy ứng dụng từ một vị trí cố định (với OpenClaw, `dist/OpenClaw.app`).
- Cùng mã định danh gói: thay đổi bundle ID sẽ tạo một danh tính quyền mới.
- Ứng dụng đã ký: các bản dựng chưa ký hoặc ký ad-hoc sẽ không duy trì quyền.
- Chữ ký nhất quán: dùng chứng chỉ Apple Development hoặc Developer ID thật
  để chữ ký giữ ổn định qua các lần dựng lại.

Chữ ký ad-hoc tạo một danh tính mới ở mỗi bản dựng. macOS sẽ quên các quyền đã cấp trước đó, và lời nhắc có thể biến mất hoàn toàn cho đến khi các mục cũ được xóa.

## Cấp quyền Trợ năng cho runtime Node và CLI

Nên cấp quyền Trợ năng cho OpenClaw.app, Peekaboo.app hoặc một helper đã ký khác có mã định danh gói riêng, thay vì một tệp nhị phân `node` chung.

macOS TCC cấp quyền Trợ năng cho danh tính mã của tiến trình mà nó thấy. Nếu một quy trình làm việc Homebrew, nvm, pnpm hoặc npm khiến một tệp thực thi `node` dùng chung nhận quyền Trợ năng, bất kỳ gói JavaScript nào được khởi chạy qua cùng tệp thực thi đó cũng có thể kế thừa đặc quyền tự động hóa GUI.

Hãy xem một mục `node` trong System Settings là quyền rộng cho runtime Node đó, không phải là quyền cho một gói npm duy nhất. Tránh cấp quyền Trợ năng cho `node` trừ khi bạn tin tưởng mọi script và gói được khởi chạy qua đúng bản cài Node đó.

Nếu bạn vô tình cấp quyền Trợ năng cho `node`, hãy xóa mục đó khỏi System Settings -> Privacy & Security -> Accessibility. Sau đó cấp quyền cho ứng dụng hoặc helper đã ký đáng lẽ phải sở hữu tự động hóa UI.

## Danh sách kiểm tra khôi phục khi lời nhắc biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong System Settings -> Privacy & Security.
3. Khởi chạy lại ứng dụng từ cùng đường dẫn và cấp lại quyền.
4. Nếu lời nhắc vẫn không xuất hiện, hãy đặt lại các mục TCC bằng `tccutil` rồi thử lại.
5. Một số quyền chỉ xuất hiện lại sau khi khởi động lại macOS hoàn toàn.

Ví dụ đặt lại (thay bundle ID nếu cần):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền đối với tệp và thư mục (Desktop/Documents/Downloads)

macOS cũng có thể kiểm soát Desktop, Documents và Downloads đối với các tiến trình terminal/nền. Nếu thao tác đọc tệp hoặc liệt kê thư mục bị treo, hãy cấp quyền truy cập cho cùng ngữ cảnh tiến trình thực hiện thao tác tệp (ví dụ Terminal/iTerm, ứng dụng được LaunchAgent khởi chạy hoặc tiến trình SSH).

Cách giải quyết: di chuyển tệp vào workspace của OpenClaw (`~/.openclaw/workspace`) nếu bạn muốn tránh cấp quyền theo từng thư mục.

Nếu bạn đang kiểm thử quyền, hãy luôn ký bằng chứng chỉ thật. Các bản dựng ad-hoc chỉ chấp nhận được cho những lần chạy cục bộ nhanh khi quyền không quan trọng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Ký macOS](/vi/platforms/mac/signing)
