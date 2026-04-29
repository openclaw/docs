---
read_when:
    - Bạn cần thực hiện các chỉnh sửa tệp có cấu trúc trên nhiều tệp
    - Bạn muốn tài liệu hóa hoặc gỡ lỗi các chỉnh sửa dựa trên bản vá
summary: Áp dụng các bản vá đa tệp bằng công cụ apply_patch
title: công cụ apply_patch
x-i18n:
    generated_at: "2026-04-29T23:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 16
---

Áp dụng các thay đổi tệp bằng định dạng bản vá có cấu trúc. Cách này lý tưởng cho các chỉnh sửa nhiều tệp
hoặc nhiều hunk khi một lệnh gọi `edit` đơn lẻ sẽ dễ giòn.

Công cụ chấp nhận một chuỗi `input` duy nhất bao bọc một hoặc nhiều thao tác tệp:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Tham số

- `input` (bắt buộc): Toàn bộ nội dung bản vá bao gồm `*** Begin Patch` và `*** End Patch`.

## Ghi chú

- Đường dẫn bản vá hỗ trợ đường dẫn tương đối (từ thư mục workspace) và đường dẫn tuyệt đối.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (nằm trong workspace). Chỉ đặt thành `false` nếu bạn chủ ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.
- Dùng `*** Move to:` trong một hunk `*** Update File:` để đổi tên tệp.
- `*** End of File` đánh dấu một lần chèn chỉ ở EOF khi cần.
- Có sẵn theo mặc định cho các mô hình OpenAI và OpenAI Codex. Đặt
  `tools.exec.applyPatch.enabled: false` để tắt.
- Có thể tùy chọn giới hạn theo mô hình qua
  `tools.exec.applyPatch.allowModels`.
- Cấu hình chỉ nằm dưới `tools.exec`.

## Ví dụ

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Liên quan

- [Diffs](/vi/tools/diffs)
- [Công cụ Exec](/vi/tools/exec)
- [Thực thi mã](/vi/tools/code-execution)
