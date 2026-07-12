---
read_when:
    - Điều tra sự cố trình nạp tsx/esbuild đề cập đến việc thiếu hàm trợ giúp __name
summary: Sự cố trước đây trên Node + tsx với lỗi "__name is not a function" và nguyên nhân của sự cố
title: Sự cố Node + tsx
x-i18n:
    generated_at: "2026-07-12T07:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Sự cố Node + tsx "\_\_name is not a function"

## Trạng thái

Đã khắc phục. Sự cố này không tái hiện với phiên bản `tsx` hiện tại được ghim trong
`package.json` (`4.22.3`) hoặc trên các bản phát hành Node hiện tại. Nội dung này được giữ lại phòng trường hợp
một bản nâng cấp `tsx`/esbuild trong tương lai gây ra lại sự cố.

## Triệu chứng ban đầu

Việc chạy các tập lệnh phát triển OpenClaw thông qua `tsx` không thể khởi động và báo lỗi:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Số dòng được lược bỏ; cả hai tệp đã thay đổi kể từ sự cố ban đầu
và các dòng cụ thể không còn khớp.

Sự cố này xuất hiện sau khi các tập lệnh phát triển chuyển từ Bun sang `tsx` (`2871657e`,
2026-01-06) để Bun trở thành tùy chọn. Luồng tương đương dựa trên Bun không gặp sự cố.
Ban đầu, sự cố được quan sát trên Node v25.3.0 ở macOS; các nền tảng khác chạy
Node 25 cũng được cho là có khả năng bị ảnh hưởng.

## Nguyên nhân

`tsx` chuyển đổi TS/ESM thông qua esbuild với `keepNames: true` được mã hóa cố định trong
các tùy chọn chuyển đổi. Thiết lập đó khiến esbuild bọc các khai báo hàm/lớp có tên
trong lời gọi đến trình trợ giúp `__name` để `fn.name` được giữ nguyên sau quá trình rút gọn
và đóng gói. Sự cố này cho thấy trình trợ giúp đã bị thiếu hoặc bị che khuất tại vị trí gọi
của mô-đun đó trong tổ hợp `tsx`/Node bị ảnh hưởng, vì vậy `__name(...)`
đã phát sinh lỗi thay vì trả về giá trị đã bọc.

## Kiểm tra tái hiện hiện tại

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Cách tái hiện tối thiểu, độc lập (chỉ tải mô-đun từ dấu vết ngăn xếp ban đầu):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Cả hai lệnh hiện đều thoát bình thường. Nếu một trong hai lại phát sinh lỗi `__name is not a
function`, hãy ghi lại chính xác phiên bản Node, phiên bản `tsx`
(`node_modules/tsx/package.json`) và toàn bộ dấu vết ngăn xếp trước khi báo cáo cho dự án thượng nguồn.

## Cách khắc phục tạm thời (nếu sự cố tái diễn)

- Chạy các tập lệnh phát triển bằng Bun thay vì `node --import tsx`.
- Chạy `pnpm tsgo` để kiểm tra kiểu, sau đó chạy đầu ra đã dựng thay vì chạy
  mã nguồn thông qua `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Thử một phiên bản `tsx` khác (`pnpm add -D tsx@<version>` là một thay đổi
  phụ thuộc và cần được phê duyệt theo chính sách kho mã) để khoanh vùng xem phiên bản esbuild
  được đóng gói kèm có gây ra lại lỗi hay không.
- Kiểm tra trên một phiên bản chính/phụ khác của Node để xác định lỗi có phụ thuộc
  vào phiên bản cụ thể hay không.

## Tài liệu tham khảo

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Liên quan

- [Cài đặt Node.js](/vi/install/node)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
