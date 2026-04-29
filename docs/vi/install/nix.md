---
read_when:
    - Bạn muốn các bản cài đặt có thể tái lập và có thể khôi phục
    - Bạn đã sử dụng Nix/NixOS/Home Manager rồi
    - Bạn muốn mọi thứ được cố định và quản lý theo cách khai báo
summary: Cài đặt OpenClaw theo cách khai báo bằng Nix
title: Nix
x-i18n:
    generated_at: "2026-04-29T22:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 16
---

Cài đặt OpenClaw theo cách khai báo với **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — một mô-đun Home Manager đầy đủ sẵn tính năng.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) là nguồn chuẩn cho việc cài đặt Nix. Trang này là phần tổng quan nhanh.
</Info>

## Bạn nhận được gì

- Gateway + ứng dụng macOS + công cụ (whisper, spotify, cameras) -- tất cả đều được ghim phiên bản
- Dịch vụ launchd vẫn tồn tại sau khi khởi động lại
- Hệ thống Plugin với cấu hình khai báo
- Khôi phục tức thì: `home-manager switch --rollback`

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Determinate Nix">
    Nếu Nix chưa được cài đặt, hãy làm theo hướng dẫn của [trình cài đặt Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Tạo flake cục bộ">
    Sử dụng mẫu ưu tiên agent từ repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Cấu hình bí mật">
    Thiết lập token bot nhắn tin và khóa API của nhà cung cấp mô hình. Các tệp thuần tại `~/.secrets/` hoạt động ổn.
  </Step>
  <Step title="Điền các placeholder trong mẫu và chuyển đổi">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Xác minh">
    Xác nhận dịch vụ launchd đang chạy và bot của bạn phản hồi tin nhắn.
  </Step>
</Steps>

Xem [README của nix-openclaw](https://github.com/openclaw/nix-openclaw) để biết đầy đủ tùy chọn mô-đun và ví dụ.

## Hành vi runtime ở chế độ Nix

Khi `OPENCLAW_NIX_MODE=1` được đặt (tự động với nix-openclaw), OpenClaw chuyển sang chế độ xác định, vô hiệu hóa các luồng tự động cài đặt.

Bạn cũng có thể đặt thủ công:

```bash
export OPENCLAW_NIX_MODE=1
```

Trên macOS, ứng dụng GUI không tự động kế thừa biến môi trường shell. Thay vào đó, hãy bật chế độ Nix qua defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Những gì thay đổi trong chế độ Nix

- Các luồng tự động cài đặt và tự biến đổi bị vô hiệu hóa
- Các phụ thuộc bị thiếu hiển thị thông báo khắc phục dành riêng cho Nix
- UI hiển thị banner chế độ Nix chỉ đọc

### Đường dẫn cấu hình và trạng thái

OpenClaw đọc cấu hình JSON5 từ `OPENCLAW_CONFIG_PATH` và lưu dữ liệu có thể thay đổi trong `OPENCLAW_STATE_DIR`. Khi chạy dưới Nix, hãy đặt các giá trị này rõ ràng tới các vị trí do Nix quản lý để trạng thái runtime và cấu hình không nằm trong store bất biến.

| Biến                   | Mặc định                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Khám phá PATH của dịch vụ

Dịch vụ gateway launchd/systemd tự động khám phá các binary trong Nix-profile để
các plugins và công cụ gọi shell tới các executable được cài bằng `nix` hoạt động mà không cần
thiết lập PATH thủ công:

- Khi `NIX_PROFILES` được đặt, mọi mục đều được thêm vào PATH của dịch vụ theo
  độ ưu tiên từ phải sang trái (khớp với độ ưu tiên của Nix shell — mục ngoài cùng bên phải thắng).
- Khi `NIX_PROFILES` không được đặt, `~/.nix-profile/bin` được thêm làm phương án dự phòng.

Điều này áp dụng cho cả môi trường dịch vụ launchd trên macOS và systemd trên Linux.

## Liên quan

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- hướng dẫn thiết lập đầy đủ
- [Wizard](/vi/start/wizard) -- thiết lập CLI không dùng Nix
- [Docker](/vi/install/docker) -- thiết lập dạng container
