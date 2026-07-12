---
read_when:
    - Bạn cần chỉnh sửa tệp có cấu trúc trên nhiều tệp khác nhau
    - Bạn muốn lập tài liệu hoặc gỡ lỗi các chỉnh sửa dựa trên bản vá
summary: Áp dụng các bản vá cho nhiều tệp bằng công cụ apply_patch
title: công cụ apply_patch
x-i18n:
    generated_at: "2026-07-12T08:24:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Áp dụng các thay đổi tệp bằng định dạng bản vá có cấu trúc. Cách này lý tưởng cho các chỉnh sửa trên nhiều tệp
hoặc nhiều đoạn, khi một lệnh gọi `edit` duy nhất dễ bị lỗi.

Công cụ chấp nhận một chuỗi `input` duy nhất bao bọc một hoặc nhiều thao tác với tệp:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Tham số

- `input` (bắt buộc): Toàn bộ nội dung bản vá, bao gồm `*** Begin Patch` và `*** End Patch`.

## Lưu ý

- Đường dẫn trong bản vá hỗ trợ đường dẫn tương đối (tính từ thư mục không gian làm việc) và đường dẫn tuyệt đối.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (chỉ trong không gian làm việc). Chỉ đặt thành `false` nếu bạn chủ ý muốn `apply_patch` ghi/xóa bên ngoài thư mục không gian làm việc.
- Sử dụng `*** Move to:` trong một đoạn `*** Update File:` để đổi tên tệp.
- `*** End of File` đánh dấu thao tác chèn chỉ tại cuối tệp khi cần.
- Được bật mặc định cho mọi mô hình. Đặt `tools.exec.applyPatch.enabled: false`
  để tắt, hoặc giới hạn cho các mô hình cụ thể bằng
  `tools.exec.applyPatch.allowModels` (chấp nhận mã định danh thô như `gpt-5.4` hoặc mã định danh đầy đủ
  như `openai/gpt-5.4`).
- Cấu hình nằm trong `tools.exec.applyPatch.*`.

## Ví dụ

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Bản khác biệt" href="/vi/tools/diffs" icon="code-compare">
    Trình xem bản khác biệt chỉ đọc để trình bày các thay đổi.
  </Card>
  <Card title="Công cụ Exec" href="/vi/tools/exec" icon="terminal">
    Thực thi lệnh shell từ tác tử.
  </Card>
  <Card title="Thực thi mã" href="/vi/tools/code-execution" icon="square-code">
    Phân tích Python từ xa trong môi trường hộp cát bằng xAI.
  </Card>
</CardGroup>
