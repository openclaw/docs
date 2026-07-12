---
read_when:
    - Bạn muốn các bản cài đặt có thể tái lập và hoàn tác
    - Bạn đang sử dụng Nix/NixOS/Home Manager rồi
    - Bạn muốn mọi thứ được cố định phiên bản và quản lý theo cách khai báo
summary: Cài đặt OpenClaw theo phương thức khai báo với Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T08:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Cài đặt OpenClaw theo phương thức khai báo bằng **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, mô-đun Home Manager chính chủ tích hợp sẵn mọi thành phần cần thiết.

<Info>
Kho mã nguồn [nix-openclaw](https://github.com/openclaw/nix-openclaw) là nguồn thông tin chính xác cho việc cài đặt Nix. Trang này cung cấp phần tổng quan nhanh.
</Info>

## Những gì bạn nhận được

- Gateway + ứng dụng macOS + công cụ (whisper, spotify, camera), tất cả đều được cố định phiên bản
- Dịch vụ launchd tiếp tục hoạt động sau khi khởi động lại
- Hệ thống Plugin với cấu hình khai báo
- Khôi phục tức thì: `home-manager switch --rollback`

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Determinate Nix">
    Nếu chưa cài đặt Nix, hãy làm theo hướng dẫn của [trình cài đặt Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Tạo flake cục bộ">
    Sử dụng mẫu ưu tiên agent từ kho mã nguồn nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Sao chép templates/agent-first/flake.nix từ kho mã nguồn nix-openclaw
    ```
  </Step>
  <Step title="Cấu hình thông tin bí mật">
    Thiết lập token bot nhắn tin và khóa API của nhà cung cấp mô hình. Các tệp văn bản thuần túy tại `~/.secrets/` có thể sử dụng tốt.
  </Step>
  <Step title="Điền các phần giữ chỗ trong mẫu và áp dụng">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Xác minh">
    Xác nhận dịch vụ launchd đang chạy và bot của bạn phản hồi tin nhắn.
  </Step>
</Steps>

Xem [README của nix-openclaw](https://github.com/openclaw/nix-openclaw) để biết đầy đủ các tùy chọn và ví dụ của mô-đun.

## Hành vi thời gian chạy ở chế độ Nix

Khi đặt `OPENCLAW_NIX_MODE=1` (tự động với nix-openclaw), OpenClaw chuyển sang chế độ xác định cho các bản cài đặt do Nix quản lý. Các gói Nix khác cũng có thể đặt cùng chế độ này; nix-openclaw là bản tham chiếu chính chủ.

Bạn cũng có thể đặt thủ công:

```bash
export OPENCLAW_NIX_MODE=1
```

Trên macOS, ứng dụng GUI không kế thừa các biến môi trường shell. Thay vào đó, hãy bật chế độ Nix qua `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Những thay đổi trong chế độ Nix

- Các luồng tự động cài đặt và tự sửa đổi bị vô hiệu hóa.
- `openclaw.json` được xem là bất biến. Các giá trị mặc định suy ra khi khởi động chỉ tồn tại trong thời gian chạy, còn các trình ghi cấu hình (thiết lập, quy trình làm quen ban đầu, lệnh `openclaw update` có sửa đổi, cài đặt/cập nhật/gỡ cài đặt/bật Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) từ chối chỉnh sửa tệp.
- Thay vào đó, hãy chỉnh sửa nguồn Nix. Với nix-openclaw, hãy sử dụng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent và đặt cấu hình trong `programs.openclaw.config` hoặc `instances.<name>.config`.
- Các phần phụ thuộc bị thiếu sẽ hiển thị thông báo khắc phục dành riêng cho Nix.
- Giao diện người dùng hiển thị biểu ngữ chế độ Nix chỉ đọc.

### Đường dẫn cấu hình và trạng thái

OpenClaw đọc cấu hình JSON5 từ `OPENCLAW_CONFIG_PATH` và lưu dữ liệu có thể thay đổi trong `OPENCLAW_STATE_DIR`. Khi dùng Nix, hãy đặt rõ ràng các biến này thành vị trí do Nix quản lý để trạng thái thời gian chạy và cấu hình nằm ngoài kho lưu trữ bất biến.

| Biến                     | Mặc định                                |
| ------------------------ | --------------------------------------- |
| `OPENCLAW_HOME`          | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`     | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH`   | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Khám phá PATH của dịch vụ

Dịch vụ Gateway launchd/systemd tự động khám phá các tệp thực thi trong hồ sơ Nix để Plugin và công cụ gọi các tệp thực thi được cài đặt bằng `nix` qua shell có thể hoạt động mà không cần thiết lập PATH thủ công:

- Khi `NIX_PROFILES` được đặt, mọi mục đều được thêm vào PATH của dịch vụ theo thứ tự ưu tiên từ phải sang trái (khớp với thứ tự ưu tiên của shell Nix: mục ngoài cùng bên phải được ưu tiên).
- Khi `NIX_PROFILES` không được đặt, `~/.nix-profile/bin` được thêm làm phương án dự phòng.

Điều này áp dụng cho cả môi trường dịch vụ launchd trên macOS và systemd trên Linux.

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Mô-đun Home Manager nguồn chính xác và hướng dẫn thiết lập đầy đủ.
  </Card>
  <Card title="Trình hướng dẫn thiết lập" href="/vi/start/wizard" icon="wand-magic-sparkles">
    Hướng dẫn từng bước thiết lập CLI không dùng Nix.
  </Card>
  <Card title="Docker" href="/vi/install/docker" icon="docker">
    Thiết lập bằng bộ chứa như một phương án thay thế không dùng Nix.
  </Card>
  <Card title="Cập nhật" href="/vi/install/updating" icon="arrow-up-right-from-square">
    Cập nhật các bản cài đặt do Home Manager quản lý cùng với gói.
  </Card>
</CardGroup>
