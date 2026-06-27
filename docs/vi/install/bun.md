---
read_when:
    - Bạn muốn vòng lặp phát triển cục bộ nhanh nhất (bun + watch)
    - Bạn gặp sự cố với script cài đặt/bản vá/vòng đời của Bun
summary: 'Quy trình làm việc với Bun (thử nghiệm): cài đặt và các lưu ý so với pnpm'
title: Bun (thử nghiệm)
x-i18n:
    generated_at: "2026-06-27T17:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **không được khuyến nghị cho runtime Gateway** (các vấn đề đã biết với WhatsApp và Telegram). Dùng Node cho môi trường production.
</Warning>

Bun là runtime cục bộ tùy chọn để chạy TypeScript trực tiếp (`bun run ...`, `bun --watch ...`). Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và được công cụ tài liệu sử dụng. Bun không thể dùng `pnpm-lock.yaml` và sẽ bỏ qua tệp này.

## Cài đặt

<Steps>
  <Step title="Cài đặt phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` đã được gitignore, nên sẽ không gây thay đổi trong repo. Để bỏ qua hoàn toàn việc ghi lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build và kiểm thử">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script vòng đời

Bun chặn các script vòng đời của phụ thuộc trừ khi được tin cậy rõ ràng. Với repo này, các script thường bị chặn không bắt buộc:

- `baileys` `preinstall` -- kiểm tra phiên bản chính của Node >= 20 (OpenClaw mặc định dùng Node 24 và vẫn hỗ trợ Node 22 LTS, hiện là `22.19+`)
- `protobufjs` `postinstall` -- phát cảnh báo về quy ước phiên bản không tương thích (không có artifact build)

Nếu bạn gặp vấn đề runtime yêu cầu các script này, hãy tin cậy chúng rõ ràng:

```sh
bun pm trust baileys protobufjs
```

## Lưu ý

Một số script vẫn hardcode pnpm (ví dụ `check:docs`, `ui:*`, `protocol:check`). Hiện tại hãy chạy các script đó qua pnpm.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Node.js](/vi/install/node)
- [Cập nhật](/vi/install/updating)
