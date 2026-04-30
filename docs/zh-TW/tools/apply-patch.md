---
read_when:
    - 你需要跨多個檔案進行結構化檔案編輯
    - 你想要記錄或偵錯以修補程式為基礎的編輯
summary: 使用 apply_patch 工具套用多檔案修補程式
title: apply_patch 工具
x-i18n:
    generated_at: "2026-04-30T03:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 16
---

使用結構化修補格式套用檔案變更。這很適合多檔案
或多區塊編輯，避免單一 `edit` 呼叫變得脆弱。

此工具接受單一 `input` 字串，其中包住一或多個檔案操作：

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

## 參數

- `input`（必填）：完整修補內容，包含 `*** Begin Patch` 和 `*** End Patch`。

## 注意事項

- 修補路徑支援相對路徑（相對於工作區目錄）和絕對路徑。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在工作區內）。只有在你刻意想讓 `apply_patch` 在工作區目錄外寫入/刪除時，才將它設為 `false`。
- 在 `*** Update File:` 區塊內使用 `*** Move to:` 來重新命名檔案。
- 需要時，`*** End of File` 會標記僅 EOF 的插入。
- 預設可用於 OpenAI 和 OpenAI Codex 模型。設定
  `tools.exec.applyPatch.enabled: false` 可將其停用。
- 也可以透過
  `tools.exec.applyPatch.allowModels` 依模型進行限制。
- 設定僅位於 `tools.exec` 底下。

## 範例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相關內容

- [差異](/zh-TW/tools/diffs)
- [Exec 工具](/zh-TW/tools/exec)
- [程式碼執行](/zh-TW/tools/code-execution)
