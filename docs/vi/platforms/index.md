---
read_when:
    - Tìm thông tin về hệ điều hành được hỗ trợ hoặc các phương thức cài đặt
    - Quyết định nơi chạy Gateway
summary: Tổng quan về hỗ trợ nền tảng (Gateway + ứng dụng đồng hành)
title: Nền tảng
x-i18n:
    generated_at: "2026-07-12T08:04:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Phần lõi OpenClaw được viết bằng TypeScript. **Node là môi trường chạy được khuyến nghị**.
Bun không được khuyến nghị cho Gateway — do các sự cố đã biết với các kênh WhatsApp và
Telegram; xem [Bun (thử nghiệm)](/vi/install/bun) để biết chi tiết.

Các ứng dụng đồng hành hiện có cho Windows Hub, macOS (ứng dụng trên thanh menu) và các node di động
(iOS/Android). Các ứng dụng đồng hành cho Linux đang được lên kế hoạch, nhưng Gateway hiện
đã được hỗ trợ đầy đủ. Trên Windows, hãy chọn Windows Hub nếu cần ứng dụng máy tính, bản cài đặt
PowerShell gốc nếu ưu tiên sử dụng qua terminal, hoặc WSL2 để có môi trường chạy Gateway
tương thích với Linux nhất.

## Chọn hệ điều hành

- macOS: [macOS](/vi/platforms/macos)
- iOS: [iOS](/vi/platforms/ios)
- Android: [Android](/vi/platforms/android)
- Windows: [Windows](/vi/platforms/windows)
- Linux: [Linux](/vi/platforms/linux)

## VPS và dịch vụ lưu trữ

- Trung tâm VPS: [Dịch vụ lưu trữ VPS](/vi/vps)
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

Sử dụng một trong các cách sau (đều được hỗ trợ):

- Trình hướng dẫn (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Luồng cấu hình: `openclaw configure` → chọn **Dịch vụ Gateway**
- Sửa chữa/di chuyển: `openclaw doctor` (đề xuất cài đặt hoặc sửa dịch vụ)

Đích dịch vụ phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway`, hoặc `ai.openclaw.<profile>` đối với hồ sơ có tên)
- Linux/WSL2: dịch vụ người dùng systemd (`openclaw-gateway[-<profile>].service`)
- Windows gốc: Tác vụ theo lịch (`OpenClaw Gateway` hoặc `OpenClaw Gateway (<profile>)`), với phương án dự phòng là mục đăng nhập theo người dùng trong thư mục Startup nếu việc tạo tác vụ bị từ chối

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Windows Hub](/vi/platforms/windows)
- [Ứng dụng macOS](/vi/platforms/macos)
- [Ứng dụng iOS](/vi/platforms/ios)
