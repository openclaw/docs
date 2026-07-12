---
read_when:
    - Gỡ lỗi lời nhắc cấp quyền trên macOS bị thiếu hoặc bị treo
    - Quyết định có cấp quyền Trợ năng cho Node hoặc môi trường thực thi CLI hay không
    - Đóng gói hoặc ký ứng dụng macOS
    - Thay đổi ID gói ứng dụng hoặc đường dẫn cài đặt ứng dụng
summary: Khả năng duy trì quyền trên macOS (TCC) và các yêu cầu ký mã
title: Quyền trên macOS
x-i18n:
    generated_at: "2026-07-12T08:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Các quyền được cấp trên macOS rất dễ mất ổn định. TCC liên kết quyền được cấp với chữ ký mã, mã định danh gói và đường dẫn trên ổ đĩa của ứng dụng. Nếu bất kỳ yếu tố nào trong số đó thay đổi, macOS sẽ coi ứng dụng là ứng dụng mới và có thể loại bỏ hoặc ẩn lời nhắc.

## Yêu cầu để duy trì quyền ổn định

- Cùng đường dẫn: chạy ứng dụng từ một vị trí cố định (đối với OpenClaw là `dist/OpenClaw.app`).
- Cùng mã định danh gói: ID gói của OpenClaw là `ai.openclaw.mac`; việc thay đổi ID này sẽ tạo ra một danh tính quyền mới.
- Ứng dụng đã ký: các bản dựng không được ký hoặc được ký tùy biến sẽ không duy trì quyền.
- Chữ ký nhất quán: sử dụng chứng chỉ Apple Development hoặc Developer ID thực để chữ ký giữ nguyên qua các lần dựng lại.

Chữ ký tùy biến tạo ra một danh tính mới sau mỗi lần dựng. macOS sẽ quên các quyền đã cấp trước đó và lời nhắc có thể biến mất hoàn toàn cho đến khi các mục cũ được xóa.

## Cấp quyền Trợ năng cho môi trường chạy Node và CLI

Ưu tiên cấp quyền Trợ năng cho OpenClaw.app, Peekaboo.app hoặc một trình trợ giúp đã ký khác có mã định danh gói riêng, thay vì cho tệp nhị phân `node` dùng chung.

TCC của macOS cấp quyền Trợ năng cho danh tính mã của tiến trình mà nó nhận diện. Nếu quy trình làm việc của Homebrew, nvm, pnpm hoặc npm khiến một tệp thực thi `node` dùng chung nhận được quyền Trợ năng, mọi gói JavaScript được khởi chạy qua chính tệp thực thi đó đều có thể thừa hưởng đặc quyền tự động hóa giao diện đồ họa.

Hãy coi một mục `node` trong System Settings là quyền rộng dành cho môi trường chạy Node đó, không phải quyền dành cho một gói npm cụ thể. Tránh cấp quyền Trợ năng cho `node` trừ khi bạn tin cậy mọi tập lệnh và gói được khởi chạy qua chính bản cài đặt Node đó.

Nếu vô tình cấp quyền Trợ năng cho `node`, hãy xóa mục đó khỏi System Settings -> Privacy & Security -> Accessibility. Sau đó, cấp quyền cho ứng dụng hoặc trình trợ giúp đã ký chịu trách nhiệm tự động hóa giao diện người dùng.

## Danh sách kiểm tra khôi phục khi lời nhắc biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong System Settings -> Privacy & Security.
3. Khởi chạy lại ứng dụng từ cùng đường dẫn và cấp lại quyền.
4. Nếu lời nhắc vẫn không xuất hiện, hãy đặt lại các mục TCC bằng `tccutil` rồi thử lại.
5. Một số lời nhắc cấp quyền chỉ xuất hiện lại sau khi khởi động lại hoàn toàn macOS.

Ví dụ về cách đặt lại (sử dụng ID gói của OpenClaw là `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền đối với tệp và thư mục (Desktop/Documents/Downloads)

macOS cũng có thể kiểm soát quyền truy cập Desktop, Documents và Downloads đối với các tiến trình chạy trong thiết bị đầu cuối hoặc chạy nền. Nếu việc đọc tệp hoặc liệt kê thư mục bị treo, hãy cấp quyền truy cập cho chính ngữ cảnh tiến trình thực hiện thao tác với tệp (ví dụ: Terminal/iTerm, ứng dụng được LaunchAgent khởi chạy hoặc tiến trình SSH).

Giải pháp thay thế: di chuyển tệp vào không gian làm việc của OpenClaw (`~/.openclaw/workspace`) nếu bạn muốn tránh phải cấp quyền riêng cho từng thư mục.

Nếu đang kiểm thử quyền, hãy luôn ký bằng chứng chỉ thực. Các bản dựng được ký tùy biến chỉ phù hợp cho những lần chạy nhanh cục bộ khi quyền không quan trọng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Ký ứng dụng macOS](/vi/platforms/mac/signing)
