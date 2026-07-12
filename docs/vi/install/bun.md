---
read_when:
    - Bạn muốn vòng lặp phát triển cục bộ nhanh nhất (bun + watch)
    - Bạn gặp sự cố với các tập lệnh cài đặt/vá/vòng đời của Bun
summary: 'Quy trình làm việc với Bun (thử nghiệm): cài đặt và những điểm cần lưu ý so với pnpm'
title: Bun (thử nghiệm)
x-i18n:
    generated_at: "2026-07-12T08:02:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Không khuyến nghị dùng Bun cho môi trường chạy Gateway (do các vấn đề đã biết với WhatsApp và Telegram). Hãy dùng Node cho môi trường production.
</Warning>

Bun là môi trường chạy cục bộ tùy chọn để chạy trực tiếp TypeScript (`bun run ...`, `bun --watch ...`). Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và được bộ công cụ tài liệu sử dụng. Bun không thể sử dụng `pnpm-lock.yaml` và sẽ bỏ qua tệp này.

## Cài đặt

<Steps>
  <Step title="Cài đặt các phần phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` bị git bỏ qua, nên kho mã nguồn không phát sinh thay đổi. Để hoàn toàn không ghi tệp khóa:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Xây dựng và kiểm thử">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Các tập lệnh vòng đời

Bun chặn các tập lệnh vòng đời của phần phụ thuộc trừ khi chúng được tin cậy rõ ràng. Đối với kho mã nguồn này, các tập lệnh thường bị chặn sau đây không bắt buộc:

- `baileys` `preinstall`: kiểm tra phiên bản chính của Node >= 20 (OpenClaw yêu cầu Node 22.19+ hoặc 23.11+, khuyến nghị dùng Node 24)
- `protobufjs` `postinstall`: đưa ra cảnh báo về các quy ước phiên bản không tương thích (không có sản phẩm tạo tác của quá trình xây dựng)

Nếu gặp sự cố trong môi trường chạy cần các tập lệnh này, hãy tin cậy chúng một cách rõ ràng:

```sh
bun pm trust baileys protobufjs
```

## Lưu ý

Một số tập lệnh gói mã hóa cứng `pnpm` ở bên trong (ví dụ: `check:docs`, `ui:*`, `protocol:check`). Khi chạy chúng qua `bun run`, hệ thống vẫn gọi `pnpm` bằng shell, vì vậy hãy chạy trực tiếp các tập lệnh đó bằng `pnpm`.

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Node.js](/vi/install/node)
- [Cập nhật](/vi/install/updating)
