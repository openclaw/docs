---
read_when:
    - Bạn muốn vòng lặp phát triển cục bộ nhanh nhất (bun + watch)
    - Bạn gặp sự cố với script cài đặt/bản vá/vòng đời của Bun
summary: 'Quy trình làm việc với Bun (thử nghiệm): cài đặt và những điểm cần lưu ý so với pnpm'
title: Bun (thử nghiệm)
x-i18n:
    generated_at: "2026-04-29T22:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **không được khuyến nghị cho runtime Gateway** (các sự cố đã biết với WhatsApp và Telegram). Hãy dùng Node cho môi trường production.
</Warning>

Bun là một runtime cục bộ tùy chọn để chạy trực tiếp TypeScript (`bun run ...`, `bun --watch ...`). Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và được công cụ tài liệu sử dụng. Bun không thể dùng `pnpm-lock.yaml` và sẽ bỏ qua tệp này.

## Cài đặt

<Steps>
  <Step title="Cài đặt các phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` bị git bỏ qua, nên không gây thay đổi trong repo. Để bỏ qua hoàn toàn việc ghi lockfile:

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

Bun chặn các script vòng đời của phụ thuộc trừ khi chúng được tin cậy một cách rõ ràng. Với repo này, các script thường bị chặn không bắt buộc:

- `@whiskeysockets/baileys` `preinstall` -- kiểm tra phiên bản chính của Node >= 20 (OpenClaw mặc định dùng Node 24 và vẫn hỗ trợ Node 22 LTS, hiện là `22.14+`)
- `protobufjs` `postinstall` -- phát cảnh báo về các quy ước phiên bản không tương thích (không có artifact build)

Nếu gặp sự cố runtime yêu cầu các script này, hãy tin cậy chúng một cách rõ ràng:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Lưu ý

Một số script vẫn hardcode pnpm (ví dụ `docs:build`, `ui:*`, `protocol:check`). Hiện tại hãy chạy các script đó qua pnpm.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Node.js](/vi/install/node)
- [Cập nhật](/vi/install/updating)
