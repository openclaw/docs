---
read_when:
    - Bạn muốn các bản cài đặt có thể tái lập và có thể khôi phục
    - Bạn đã sử dụng Nix/NixOS/Home Manager
    - Bạn muốn mọi thứ được cố định và quản lý theo cách khai báo
summary: Cài đặt OpenClaw theo cách khai báo với Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Cài đặt OpenClaw theo cách khai báo với **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - mô-đun Home Manager chính chủ, đầy đủ sẵn pin.

<Info>
Repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) là nguồn sự thật cho cài đặt Nix. Trang này là phần tổng quan nhanh.
</Info>

## Bạn nhận được gì

- Gateway + ứng dụng macOS + công cụ (whisper, spotify, cameras) -- tất cả đều được ghim phiên bản
- Dịch vụ launchd tồn tại qua các lần khởi động lại
- Hệ thống Plugin với cấu hình khai báo
- Hoàn tác tức thì: `home-manager switch --rollback`

## Bắt đầu nhanh

<Steps>
  <Step title="Install Determinate Nix">
    Nếu Nix chưa được cài đặt, hãy làm theo hướng dẫn của [trình cài đặt Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Create a local flake">
    Sử dụng mẫu ưu tiên tác nhân từ repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    Thiết lập token bot nhắn tin và khóa API của nhà cung cấp mô hình. Các tệp thuần tại `~/.secrets/` hoạt động tốt.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    Xác nhận dịch vụ launchd đang chạy và bot của bạn phản hồi tin nhắn.
  </Step>
</Steps>

Xem [README nix-openclaw](https://github.com/openclaw/nix-openclaw) để biết đầy đủ tùy chọn mô-đun và ví dụ.

## Hành vi runtime ở chế độ Nix

Khi `OPENCLAW_NIX_MODE=1` được đặt (tự động với nix-openclaw), OpenClaw chuyển sang chế độ xác định cho các bản cài đặt do Nix quản lý. Các gói Nix khác có thể đặt cùng chế độ; nix-openclaw là tham chiếu chính chủ.

Bạn cũng có thể đặt thủ công:

```bash
export OPENCLAW_NIX_MODE=1
```

Trên macOS, ứng dụng GUI không tự động kế thừa biến môi trường shell. Thay vào đó, bật chế độ Nix qua defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Điều gì thay đổi trong chế độ Nix

- Các luồng tự động cài đặt và tự thay đổi bị tắt
- `openclaw.json` được xem là bất biến. Các mặc định sinh ra lúc khởi động chỉ tồn tại trong runtime, và các trình ghi cấu hình như setup, onboarding, `openclaw update` có thay đổi, cài đặt/cập nhật/gỡ cài đặt/bật Plugin, `doctor --fix`, `doctor --generate-gateway-token`, và `openclaw config set` sẽ từ chối chỉnh sửa tệp.
- Các tác nhân nên chỉnh sửa nguồn Nix thay vào đó. Với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên tác nhân và đặt cấu hình dưới `programs.openclaw.config` hoặc `instances.<name>.config`.
- Các phụ thuộc bị thiếu hiển thị thông báo khắc phục dành riêng cho Nix
- UI hiển thị banner chế độ Nix chỉ đọc

### Đường dẫn cấu hình và trạng thái

OpenClaw đọc cấu hình JSON5 từ `OPENCLAW_CONFIG_PATH` và lưu dữ liệu có thể thay đổi trong `OPENCLAW_STATE_DIR`. Khi chạy dưới Nix, hãy đặt rõ các giá trị này tới vị trí do Nix quản lý để trạng thái runtime và cấu hình không nằm trong kho bất biến.

| Biến                   | Mặc định                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Phát hiện PATH của dịch vụ

Dịch vụ gateway launchd/systemd tự động phát hiện các tệp nhị phân trong Nix-profile để
các Plugin và công cụ gọi shell tới các tệp thực thi được cài bằng `nix` hoạt động mà không cần
thiết lập PATH thủ công:

- Khi `NIX_PROFILES` được đặt, mọi mục nhập được thêm vào PATH của dịch vụ theo
  thứ tự ưu tiên từ phải sang trái (khớp với mức ưu tiên shell Nix - mục ngoài cùng bên phải thắng).
- Khi `NIX_PROFILES` chưa được đặt, `~/.nix-profile/bin` được thêm làm dự phòng.

Điều này áp dụng cho cả môi trường dịch vụ launchd trên macOS và systemd trên Linux.

## Liên quan

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Mô-đun Home Manager nguồn sự thật và hướng dẫn thiết lập đầy đủ.
  </Card>
  <Card title="Setup wizard" href="/vi/start/wizard" icon="wand-magic-sparkles">
    Hướng dẫn từng bước thiết lập CLI không dùng Nix.
  </Card>
  <Card title="Docker" href="/vi/install/docker" icon="docker">
    Thiết lập dạng container như một lựa chọn thay thế không dùng Nix.
  </Card>
  <Card title="Updating" href="/vi/install/updating" icon="arrow-up-right-from-square">
    Cập nhật các bản cài đặt do Home Manager quản lý cùng với gói.
  </Card>
</CardGroup>
