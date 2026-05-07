---
read_when:
    - Bạn muốn vòng lặp phát triển cục bộ nhanh nhất (bun + watch)
    - Bạn gặp sự cố với các script cài đặt, vá hoặc vòng đời của Bun
summary: 'Quy trình làm việc với Bun (thử nghiệm): cài đặt và các điểm cần lưu ý so với pnpm'
title: Bun (thử nghiệm)
x-i18n:
    generated_at: "2026-05-07T13:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **không được khuyến nghị cho môi trường chạy Gateway** (các sự cố đã biết với WhatsApp và Telegram). Sử dụng Node cho môi trường sản xuất.
</Warning>

Bun là một môi trường chạy cục bộ tùy chọn để chạy TypeScript trực tiếp (`bun run ...`, `bun --watch ...`). Trình quản lý gói mặc định vẫn là `pnpm`, được hỗ trợ đầy đủ và được công cụ tài liệu sử dụng. Bun không thể sử dụng `pnpm-lock.yaml` và sẽ bỏ qua tệp này.

## Cài đặt

<Steps>
  <Step title="Cài đặt phụ thuộc">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` được gitignore, nên sẽ không gây thay đổi trong repo. Để bỏ qua hoàn toàn việc ghi lockfile:

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

## Tập lệnh vòng đời

Bun chặn các tập lệnh vòng đời của phụ thuộc trừ khi được tin cậy rõ ràng. Với repo này, các tập lệnh thường bị chặn là không bắt buộc:

- `@whiskeysockets/baileys` `preinstall` -- kiểm tra phiên bản chính của Node >= 20 (OpenClaw mặc định dùng Node 24 và vẫn hỗ trợ Node 22 LTS, hiện là `22.16+`)
- `protobufjs` `postinstall` -- phát ra cảnh báo về lược đồ phiên bản không tương thích (không có tạo tác build)

Nếu gặp sự cố thời gian chạy cần các tập lệnh này, hãy tin cậy chúng rõ ràng:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Lưu ý

Một số tập lệnh vẫn hardcode pnpm (ví dụ `docs:build`, `ui:*`, `protocol:check`). Hiện tại hãy chạy các tập lệnh đó qua pnpm.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Node.js](/vi/install/node)
- [Cập nhật](/vi/install/updating)
