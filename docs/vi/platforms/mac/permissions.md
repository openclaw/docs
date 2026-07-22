---
read_when:
    - Gỡ lỗi lời nhắc cấp quyền trên macOS bị thiếu hoặc bị treo
    - Quyết định có cấp quyền Trợ năng cho node hoặc môi trường chạy CLI hay không
    - Đóng gói hoặc ký ứng dụng macOS
    - Thay đổi ID gói hoặc đường dẫn cài đặt ứng dụng
summary: Khả năng duy trì quyền macOS (TCC) và các yêu cầu ký mã
title: Quyền trên macOS
x-i18n:
    generated_at: "2026-07-22T02:22:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e561aa641e44fc1e1b95a3db244f31124e4e51d13ae709bee188d86054301e34
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Quyền được cấp trên macOS rất dễ bị mất. TCC liên kết quyền được cấp với chữ ký mã, mã định danh gói và đường dẫn trên đĩa của ứng dụng. Nếu bất kỳ yếu tố nào trong số đó thay đổi, macOS sẽ coi ứng dụng là mới và có thể bỏ qua hoặc ẩn lời nhắc.

## Yêu cầu để duy trì quyền ổn định

- Cùng đường dẫn: chạy ứng dụng từ một vị trí cố định (đối với OpenClaw là `dist/OpenClaw.app`).
- Cùng mã định danh gói: ID gói của OpenClaw là `ai.openclaw.mac`; việc thay đổi ID này sẽ tạo ra một danh tính quyền mới.
- Ứng dụng đã ký: các bản dựng chưa ký hoặc ký ad-hoc không duy trì được quyền.
- Chữ ký nhất quán: sử dụng chứng chỉ Apple Development hoặc Developer ID thực để chữ ký duy trì ổn định giữa các lần dựng lại.

Chữ ký ad-hoc tạo ra một danh tính mới trong mỗi lần dựng. macOS quên các quyền đã cấp trước đó và lời nhắc có thể biến mất hoàn toàn cho đến khi các mục cũ được xóa.

## Quyền Trợ năng cho môi trường chạy Node và CLI

Nên cấp quyền Trợ năng cho OpenClaw.app, Peekaboo.app hoặc một trình trợ giúp đã ký khác có mã định danh gói riêng thay vì một tệp nhị phân `node` dùng chung.

TCC của macOS cấp quyền Trợ năng cho danh tính mã của tiến trình mà hệ thống nhận diện. Nếu quy trình làm việc Homebrew, nvm, pnpm hoặc npm khiến một tệp thực thi `node` dùng chung nhận được quyền Trợ năng, mọi gói JavaScript được khởi chạy thông qua cùng tệp thực thi đó đều có thể kế thừa đặc quyền tự động hóa GUI.

Hãy coi mục `node` trong System Settings là quyền rộng dành cho môi trường chạy Node đó, không phải quyền dành cho một gói npm. Tránh cấp quyền Trợ năng cho `node` trừ khi bạn tin cậy mọi tập lệnh và gói được khởi chạy thông qua chính xác bản cài đặt Node đó.

Việc phê duyệt quyền Trợ năng không bật tính năng chia sẻ hoạt động. **Settings -> Permissions -> Active computer detection** là một tùy chọn riêng biệt, mặc định tắt, dùng để chia sẻ khoảng thời gian không hoạt động có giới hạn với Gateway của bạn. Việc tắt tùy chọn này sẽ xóa dữ liệu hoạt động được lưu giữ mà không thu hồi quyền Trợ năng hoặc ngắt kết nối Node.

Nếu bạn vô tình cấp quyền Trợ năng cho `node`, hãy xóa mục đó khỏi System Settings -> Privacy & Security -> Accessibility. Sau đó, cấp quyền cho ứng dụng hoặc trình trợ giúp đã ký chịu trách nhiệm về tự động hóa giao diện người dùng.

## Danh sách kiểm tra khôi phục khi lời nhắc biến mất

1. Thoát ứng dụng.
2. Xóa mục ứng dụng trong System Settings -> Privacy & Security.
3. Khởi chạy lại ứng dụng từ cùng đường dẫn và cấp lại quyền.
4. Nếu lời nhắc vẫn không xuất hiện, hãy đặt lại các mục TCC bằng `tccutil` rồi thử lại.
5. Một số quyền chỉ xuất hiện lại sau khi khởi động lại hoàn toàn macOS.

Ví dụ về lệnh đặt lại (sử dụng ID gói của OpenClaw là `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Quyền đối với tệp và thư mục (Desktop/Documents/Downloads)

macOS cũng có thể hạn chế quyền truy cập Desktop, Documents và Downloads đối với các tiến trình đầu cuối/nền. Nếu thao tác đọc tệp hoặc liệt kê thư mục bị treo, hãy cấp quyền truy cập cho cùng ngữ cảnh tiến trình thực hiện các thao tác với tệp (ví dụ: Terminal/iTerm, ứng dụng do LaunchAgent khởi chạy hoặc tiến trình SSH).

Giải pháp thay thế: chuyển tệp vào không gian làm việc OpenClaw (`~/.openclaw/workspace`) nếu bạn muốn tránh phải cấp quyền cho từng thư mục.

Nếu đang kiểm thử quyền, hãy luôn ký bằng chứng chỉ thực. Các bản dựng ad-hoc chỉ chấp nhận được cho những lần chạy cục bộ nhanh khi quyền không quan trọng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Ký ứng dụng macOS](/vi/platforms/mac/signing)
