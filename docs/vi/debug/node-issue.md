---
read_when:
    - Gỡ lỗi các script phát triển chỉ dành cho Node hoặc lỗi chế độ theo dõi
    - Điều tra sự cố sập trình nạp tsx/esbuild trong OpenClaw
summary: Ghi chú và cách khắc phục sự cố crash Node + tsx "__name is not a function"
title: Node + tsx bị sập
x-i18n:
    generated_at: "2026-05-06T17:54:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Sự cố sập Node + tsx "\_\_name is not a function"

## Tóm tắt

Chạy OpenClaw qua Node với `tsx` bị lỗi khi khởi động với:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Sự cố này bắt đầu sau khi chuyển các script phát triển từ Bun sang `tsx` (commit `2871657e`, 2026-01-06). Cùng đường dẫn runtime này từng hoạt động với Bun.

## Môi trường

- Node: v25.x (quan sát được trên v25.3.0)
- tsx: 4.21.0
- Hệ điều hành: macOS (khả năng cao cũng tái hiện được trên các nền tảng khác chạy Node 25)

## Tái hiện lỗi (chỉ dùng Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Tái hiện lỗi tối thiểu trong kho mã

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Kiểm tra phiên bản Node

- Node 25.3.0: lỗi
- Node 22.22.0 (Homebrew `node@22`): lỗi
- Node 24: chưa được cài đặt ở đây; cần xác minh

## Ghi chú / giả thuyết

- `tsx` dùng esbuild để biến đổi TS/ESM. `keepNames` của esbuild phát ra helper `__name` và bọc các định nghĩa hàm bằng `__name(...)`.
- Sự cố sập cho thấy `__name` tồn tại nhưng không phải là hàm tại runtime, ngụ ý rằng helper bị thiếu hoặc bị ghi đè cho module này trong đường dẫn loader của Node 25.
- Các vấn đề tương tự liên quan đến helper `__name` đã được báo cáo trong những trình tiêu thụ esbuild khác khi helper bị thiếu hoặc bị viết lại.

## Lịch sử hồi quy

- `2871657e` (2026-01-06): các script đã đổi từ Bun sang tsx để biến Bun thành tùy chọn.
- Trước đó (đường dẫn Bun), `openclaw status` và `gateway:watch` hoạt động.

## Cách khắc phục tạm thời

- Dùng Bun cho các script phát triển (hoàn nguyên tạm thời hiện tại).
- Dùng `tsgo` để kiểm tra kiểu của kho mã, rồi chạy đầu ra đã build:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Ghi chú lịch sử: `tsc` từng được dùng ở đây trong lúc gỡ lỗi vấn đề Node/tsx này, nhưng các lane kiểm tra kiểu của kho mã hiện dùng `tsgo`.
- Tắt keepNames của esbuild trong TS loader nếu có thể (ngăn chèn helper `__name`); tsx hiện chưa cung cấp tùy chọn này.
- Kiểm thử Node LTS (22/24) với `tsx` để xem vấn đề có đặc thù với Node 25 hay không.

## Tham khảo

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Các bước tiếp theo

- Tái hiện trên Node 22/24 để xác nhận hồi quy của Node 25.
- Kiểm thử `tsx` nightly hoặc ghim về phiên bản cũ hơn nếu có hồi quy đã biết.
- Nếu tái hiện trên Node LTS, gửi một tái hiện lỗi tối thiểu lên upstream kèm stack trace `__name`.

## Liên quan

- [Cài đặt Node.js](/vi/install/node)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
