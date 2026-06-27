---
read_when:
    - Tìm hỗ trợ hệ điều hành hoặc đường dẫn cài đặt
    - Quyết định nơi chạy Gateway
summary: Tổng quan hỗ trợ nền tảng (Gateway + ứng dụng đồng hành)
title: Nền tảng
x-i18n:
    generated_at: "2026-06-27T17:41:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

Phần lõi OpenClaw được viết bằng TypeScript. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway — có các sự cố đã biết với các kênh WhatsApp và
Telegram; xem [Bun (thử nghiệm)](/vi/install/bun) để biết chi tiết.

Có các ứng dụng đồng hành cho Windows Hub, macOS (ứng dụng trên thanh menu), và các nút di động
(iOS/Android). Ứng dụng đồng hành cho Linux đã được lên kế hoạch, nhưng Gateway hiện được hỗ trợ đầy đủ. Trên Windows, hãy chọn Windows Hub cho ứng dụng desktop, cài đặt PowerShell gốc nếu ưu tiên dùng terminal, hoặc WSL2 để có runtime Gateway tương thích với Linux nhất.

## Chọn hệ điều hành của bạn

- macOS: [macOS](/vi/platforms/macos)
- iOS: [iOS](/vi/platforms/ios)
- Android: [Android](/vi/platforms/android)
- Windows: [Windows](/vi/platforms/windows)
- Linux: [Linux](/vi/platforms/linux)

## VPS và hosting

- Hub VPS: [VPS hosting](/vi/vps)
- Fly.io: [Fly.io](/vi/install/fly)
- Hetzner (Docker): [Hetzner](/vi/install/hetzner)
- GCP (Compute Engine): [GCP](/vi/install/gcp)
- Azure (Linux VM): [Azure](/vi/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/vi/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/vi/platforms/easyrunner)

## Liên kết thường dùng

- Hướng dẫn cài đặt: [Bắt đầu](/vi/start/getting-started)
- Windows Hub: [Windows](/vi/platforms/windows)
- Runbook Gateway: [Gateway](/vi/gateway)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)
- Trạng thái dịch vụ: `openclaw gateway status`

## Cài đặt dịch vụ Gateway (CLI)

Dùng một trong các cách sau (đều được hỗ trợ):

- Trình hướng dẫn (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Luồng cấu hình: `openclaw configure` → chọn **Dịch vụ Gateway**
- Sửa chữa/di chuyển: `openclaw doctor` (đề nghị cài đặt hoặc sửa dịch vụ)

Mục tiêu dịch vụ phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway` hoặc `ai.openclaw.<profile>`; cũ `com.openclaw.*`)
- Linux/WSL2: dịch vụ người dùng systemd (`openclaw-gateway[-<profile>].service`)
- Windows gốc: Scheduled Task (`OpenClaw Gateway` hoặc `OpenClaw Gateway (<profile>)`), với phương án dự phòng là mục đăng nhập trong thư mục Startup theo từng người dùng nếu bị từ chối tạo tác vụ

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Windows Hub](/vi/platforms/windows)
- [Ứng dụng macOS](/vi/platforms/macos)
- [Ứng dụng iOS](/vi/platforms/ios)
