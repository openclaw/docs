---
read_when:
    - Bạn cần thực hiện các chỉnh sửa tệp có cấu trúc trên nhiều tệp
    - Bạn muốn lập tài liệu hoặc gỡ lỗi các chỉnh sửa dựa trên bản vá
summary: Áp dụng các bản vá nhiều tệp bằng công cụ apply_patch
title: công cụ apply_patch
x-i18n:
    generated_at: "2026-05-06T09:31:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Áp dụng thay đổi tệp bằng định dạng bản vá có cấu trúc. Cách này lý tưởng cho các chỉnh sửa nhiều tệp
hoặc nhiều hunk khi một lệnh gọi `edit` duy nhất sẽ dễ hỏng.

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

- `input` (bắt buộc): Nội dung bản vá đầy đủ bao gồm `*** Begin Patch` và `*** End Patch`.

## Ghi chú

- Đường dẫn bản vá hỗ trợ đường dẫn tương đối (từ thư mục workspace) và đường dẫn tuyệt đối.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (giới hạn trong workspace). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.
- Dùng `*** Move to:` trong một hunk `*** Update File:` để đổi tên tệp.
- `*** End of File` đánh dấu một thao tác chèn chỉ EOF khi cần.
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

<CardGroup cols={2}>
  <Card title="Diffs" href="/vi/tools/diffs" icon="code-compare">
    Trình xem diff chỉ đọc để trình bày thay đổi.
  </Card>
  <Card title="Exec tool" href="/vi/tools/exec" icon="terminal">
    Thực thi lệnh shell từ agent.
  </Card>
  <Card title="Code execution" href="/vi/tools/code-execution" icon="square-code">
    Phân tích Python từ xa trong sandbox với xAI.
  </Card>
</CardGroup>
