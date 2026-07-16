---
read_when:
    - Bạn muốn cài đặt các phần phụ thuộc hoặc chạy các tập lệnh gói bằng Bun
    - Bạn gặp sự cố với tập lệnh cài đặt/bản vá/vòng đời của Bun
summary: Quy trình làm việc với Bun để cài đặt và chạy các tập lệnh gói; Node là bắt buộc khi chạy thực tế
title: Bun
x-i18n:
    generated_at: "2026-07-16T15:23:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun không thể chạy OpenClaw CLI hoặc Gateway vì không cung cấp API `node:sqlite` bắt buộc. Hãy cài đặt một phiên bản Node được hỗ trợ cho mọi lệnh thời gian chạy OpenClaw.
</Warning>

Bun vẫn có thể được dùng làm trình cài đặt phần phụ thuộc và trình chạy tập lệnh gói tùy chọn. Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và được công cụ tài liệu sử dụng. Bun không thể sử dụng `pnpm-lock.yaml` và sẽ bỏ qua tệp này.

## Cài đặt

<Steps>
  <Step title="Cài đặt các phần phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` được git bỏ qua, nên kho lưu trữ không phát sinh thay đổi. Để bỏ qua hoàn toàn việc ghi tệp khóa:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Xây dựng và kiểm thử">
    ```sh
    bun run build
    bun run vitest run
    ```

    Các lệnh khởi chạy chính OpenClaw vẫn phải chạy qua Node.

  </Step>
</Steps>

## Tập lệnh vòng đời

Bun chặn các tập lệnh vòng đời của phần phụ thuộc trừ khi chúng được tin cậy rõ ràng. Đối với kho lưu trữ này, các tập lệnh thường bị chặn sau đây không bắt buộc:

- `baileys` `preinstall`: kiểm tra phiên bản chính của Node >= 20 (OpenClaw yêu cầu Node 22.22.3+, 24.15+ hoặc 25.9+, khuyến nghị Node 24)
- `protobufjs` `postinstall`: đưa ra cảnh báo về các lược đồ phiên bản không tương thích (không có sản phẩm tạo tác xây dựng)

Nếu gặp sự cố thời gian chạy cần các tập lệnh này, hãy tin cậy chúng một cách rõ ràng:

```sh
bun pm trust baileys protobufjs
```

## Lưu ý

Một số tập lệnh gói mã hóa cứng `pnpm` ở bên trong (ví dụ: `check:docs`, `ui:*`, `protocol:check`). Việc chạy chúng qua `bun run` vẫn gọi shell để chạy `pnpm`, vì vậy chỉ cần chạy trực tiếp các tập lệnh đó qua `pnpm`.

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Node.js](/vi/install/node)
- [Cập nhật](/vi/install/updating)
