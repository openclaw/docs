---
read_when:
    - Gỡ lỗi các tập lệnh phát triển chỉ dành cho Node hoặc lỗi ở chế độ theo dõi
    - Điều tra sự cố sập trình nạp tsx/esbuild trong OpenClaw
summary: Ghi chú và cách khắc phục tạm thời cho lỗi sập Node + tsx "__name is not a function"
title: Node + tsx bị sập
x-i18n:
    generated_at: "2026-04-29T22:40:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 16
---

# Sự cố sập Node + tsx "\_\_name is not a function"

## Tóm tắt

Chạy OpenClaw qua Node với `tsx` bị lỗi khi khởi động với:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Sự cố này bắt đầu sau khi chuyển các script phát triển từ Bun sang `tsx` (commit `2871657e`, 2026-01-06). Cùng một đường dẫn runtime trước đó hoạt động với Bun.

## Môi trường

- Node: v25.x (quan sát trên v25.3.0)
- tsx: 4.21.0
- HĐH: macOS (khả năng cũng tái hiện trên các nền tảng khác chạy Node 25)

## Tái hiện (chỉ Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Tái hiện tối thiểu trong repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Kiểm tra phiên bản Node

- Node 25.3.0: lỗi
- Node 22.22.0 (Homebrew `node@22`): lỗi
- Node 24: chưa được cài ở đây; cần xác minh

## Ghi chú / giả thuyết

- `tsx` dùng esbuild để chuyển đổi TS/ESM. `keepNames` của esbuild sinh helper `__name` và bọc các định nghĩa hàm bằng `__name(...)`.
- Sự cố sập cho thấy `__name` tồn tại nhưng không phải là hàm ở runtime, ngụ ý rằng helper bị thiếu hoặc bị ghi đè cho mô-đun này trong đường dẫn loader của Node 25.
- Các vấn đề tương tự với helper `__name` đã được báo cáo trong những công cụ tiêu thụ esbuild khác khi helper bị thiếu hoặc bị viết lại.

## Lịch sử hồi quy

- `2871657e` (2026-01-06): các script đã đổi từ Bun sang tsx để biến Bun thành tùy chọn.
- Trước đó (đường dẫn Bun), `openclaw status` và `gateway:watch` hoạt động.

## Cách khắc phục tạm thời

- Dùng Bun cho các script phát triển (hoàn tác tạm thời hiện tại).
- Dùng `tsgo` để kiểm tra kiểu của repo, rồi chạy output đã build:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Ghi chú lịch sử: `tsc` đã được dùng ở đây trong lúc gỡ lỗi vấn đề Node/tsx này, nhưng các lane kiểm tra kiểu của repo hiện dùng `tsgo`.
- Tắt esbuild keepNames trong TS loader nếu có thể (ngăn việc chèn helper `__name`); tsx hiện chưa expose tùy chọn này.
- Kiểm thử Node LTS (22/24) với `tsx` để xem vấn đề có chỉ riêng Node 25 hay không.

## Tham khảo

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Bước tiếp theo

- Tái hiện trên Node 22/24 để xác nhận hồi quy Node 25.
- Kiểm thử `tsx` nightly hoặc pin về phiên bản cũ hơn nếu có hồi quy đã biết.
- Nếu tái hiện trên Node LTS, gửi một bản tái hiện tối thiểu lên upstream kèm stack trace `__name`.

## Liên quan

- [Cài đặt Node.js](/vi/install/node)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
