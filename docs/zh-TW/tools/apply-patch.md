---
read_when:
    - 你需要對多個檔案進行結構化檔案編輯
    - 你想要記錄或偵錯以修補為基礎的編輯
summary: 使用 apply_patch 工具套用多檔案修補程式
title: apply_patch 工具
x-i18n:
    generated_at: "2026-07-05T11:44:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

套用使用結構化修補格式的檔案變更。這很適合多檔案或多區塊編輯，避免單一 `edit` 呼叫變得脆弱。

此工具接受單一 `input` 字串，用來包裝一個或多個檔案操作：

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

## 參數

- `input`（必填）：完整修補內容，包含 `*** Begin Patch` 和 `*** End Patch`。

## 備註

- 修補路徑支援相對路徑（從工作區目錄起算）和絕對路徑。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在工作區內）。只有在你刻意想讓 `apply_patch` 寫入/刪除工作區目錄之外的內容時，才將它設為 `false`。
- 在 `*** Update File:` 區塊內使用 `*** Move to:` 來重新命名檔案。
- `*** End of File` 會在需要時標記僅 EOF 的插入。
- 預設對每個模型啟用。設定 `tools.exec.applyPatch.enabled: false`
  可停用它，或使用
  `tools.exec.applyPatch.allowModels` 將它限制為特定模型（接受像 `gpt-5.4` 這樣的原始 ID，或像
  `openai/gpt-5.4` 這樣的完整 ID）。
- 設定位於 `tools.exec.applyPatch.*` 底下。

## 範例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相關

<CardGroup cols={2}>
  <Card title="Diffs" href="/zh-TW/tools/diffs" icon="code-compare">
    用於呈現變更的唯讀差異檢視器。
  </Card>
  <Card title="Exec tool" href="/zh-TW/tools/exec" icon="terminal">
    由代理程式執行 shell 命令。
  </Card>
  <Card title="Code execution" href="/zh-TW/tools/code-execution" icon="square-code">
    使用 xAI 的沙盒遠端 Python 分析。
  </Card>
</CardGroup>
