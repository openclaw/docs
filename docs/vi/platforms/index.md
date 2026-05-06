---
read_when:
    - Tìm thông tin hỗ trợ hệ điều hành hoặc đường dẫn cài đặt
    - Quyết định nơi chạy Gateway
summary: Tổng quan hỗ trợ nền tảng (Gateway + ứng dụng đồng hành)
title: Nền tảng
x-i18n:
    generated_at: "2026-05-06T09:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core được viết bằng TypeScript. **Node là môi trường chạy được khuyến nghị**.
Bun không được khuyến nghị cho Gateway — có các sự cố đã biết với các kênh WhatsApp và
Telegram; xem [Bun (thử nghiệm)](/vi/install/bun) để biết chi tiết.

Có ứng dụng đồng hành cho macOS (ứng dụng thanh menu) và các nút di động (iOS/Android). Ứng dụng đồng hành cho Windows và
Linux đã được lên kế hoạch, nhưng Gateway hiện được hỗ trợ đầy đủ.
Ứng dụng đồng hành gốc cho Windows cũng đã được lên kế hoạch; Gateway được khuyến nghị thông qua WSL2.

## Chọn hệ điều hành của bạn

- macOS: [macOS](/vi/platforms/macos)
- iOS: [iOS](/vi/platforms/ios)
- Android: [Android](/vi/platforms/android)
- Windows: [Windows](/vi/platforms/windows)
- Linux: [Linux](/vi/platforms/linux)

## VPS và lưu trữ

- Trung tâm VPS: [Lưu trữ VPS](/vi/vps)
- Fly.io: [Fly.io](/vi/install/fly)
- Hetzner (Docker): [Hetzner](/vi/install/hetzner)
- GCP (Compute Engine): [GCP](/vi/install/gcp)
- Azure (Linux VM): [Azure](/vi/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/vi/install/exe-dev)

## Liên kết thường dùng

- Hướng dẫn cài đặt: [Bắt đầu](/vi/start/getting-started)
- Runbook Gateway: [Gateway](/vi/gateway)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)
- Trạng thái dịch vụ: `openclaw gateway status`

## Cài đặt dịch vụ Gateway (CLI)

Dùng một trong các cách sau (tất cả đều được hỗ trợ):

- Trình hướng dẫn (khuyến nghị): `openclaw onboard --install-daemon`
- Trực tiếp: `openclaw gateway install`
- Luồng cấu hình: `openclaw configure` → chọn **Dịch vụ Gateway**
- Sửa chữa/di chuyển: `openclaw doctor` (đề xuất cài đặt hoặc sửa dịch vụ)

Đích dịch vụ phụ thuộc vào hệ điều hành:

- macOS: LaunchAgent (`ai.openclaw.gateway` hoặc `ai.openclaw.<profile>`; cũ `com.openclaw.*`)
- Linux/WSL2: dịch vụ người dùng systemd (`openclaw-gateway[-<profile>].service`)
- Windows gốc: Scheduled Task (`OpenClaw Gateway` hoặc `OpenClaw Gateway (<profile>)`), với phương án dự phòng là mục đăng nhập trong thư mục Startup theo từng người dùng nếu việc tạo tác vụ bị từ chối

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Ứng dụng macOS](/vi/platforms/macos)
- [Ứng dụng iOS](/vi/platforms/ios)
