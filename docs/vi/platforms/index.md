---
read_when:
    - Tìm thông tin về hỗ trợ hệ điều hành hoặc đường dẫn cài đặt
    - Quyết định nơi chạy Gateway
summary: Tổng quan về hỗ trợ nền tảng (Gateway + ứng dụng đồng hành)
title: Nền tảng
x-i18n:
    generated_at: "2026-07-16T14:38:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Phần lõi của OpenClaw được viết bằng TypeScript. **Node là runtime bắt buộc** vì
kho lưu trữ trạng thái chuẩn sử dụng `node:sqlite`. Bun vẫn có thể được dùng để
cài đặt phần phụ thuộc và chạy các script gói; xem [Bun](/vi/install/bun).

Các ứng dụng đồng hành hiện có cho Windows Hub, macOS (ứng dụng trên thanh menu) và các node di động
(iOS/Android). Các ứng dụng đồng hành cho Linux đang được lên kế hoạch, nhưng Gateway hiện đã
được hỗ trợ đầy đủ. Trên Windows, hãy chọn Windows Hub nếu cần ứng dụng máy tính, cài đặt bằng
PowerShell gốc nếu ưu tiên sử dụng terminal, hoặc WSL2 để có runtime Gateway
tương thích với Linux nhất.

## Chọn hệ điều hành

- macOS: [macOS](/vi/platforms/macos)
- iOS: [iOS](/vi/platforms/ios)
- Android: [Android](/vi/platforms/android)
- Windows: [Windows](/vi/platforms/windows)
- Linux: [Linux](/vi/platforms/linux)

## VPS và dịch vụ lưu trữ

- Hub VPS: [Dịch vụ lưu trữ VPS](/vi/vps)
- Fly.io: [Fly.io](/vi/install/fly)
- Hetzner (Docker): [Hetzner](/vi/install/hetzner)
- GCP (Compute Engine): [GCP](/vi/install/gcp)
- Azure (máy ảo Linux): [Azure](/vi/install/azure)
- exe.dev (máy ảo + proxy HTTPS): [exe.dev](/vi/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/vi/platforms/easyrunner)

## Liên kết thường dùng

- Hướng dẫn cài đặt: [Bắt đầu](/vi/start/getting-started)
- Windows Hub: [Windows](/vi/platforms/windows)
- Cẩm nang vận hành Gateway: [Gateway](/vi/gateway)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)
- Trạng thái dịch vụ: `openclaw gateway status`

## Cài đặt dịch vụ Gateway (CLI)

Sử dụng một trong các cách sau (tất cả đều được hỗ trợ):

- Trình hướng dẫn (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Luồng cấu hình: `openclaw configure` → chọn **Dịch vụ Gateway**
- Sửa chữa/di chuyển: `openclaw doctor` (đề xuất cài đặt hoặc sửa dịch vụ)

Đích dịch vụ phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway`, hoặc `ai.openclaw.<profile>` đối với hồ sơ có tên)
- Linux/WSL2: dịch vụ người dùng systemd (`openclaw-gateway[-<profile>].service`)
- Windows gốc: Scheduled Task (`OpenClaw Gateway` hoặc `OpenClaw Gateway (<profile>)`), với phương án dự phòng là một mục đăng nhập theo người dùng trong thư mục Startup nếu việc tạo tác vụ bị từ chối

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Windows Hub](/vi/platforms/windows)
- [Ứng dụng macOS](/vi/platforms/macos)
- [Ứng dụng iOS](/vi/platforms/ios)
