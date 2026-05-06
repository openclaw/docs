---
read_when:
    - 你需要對多個檔案進行結構化編輯
    - 你想記錄或偵錯以修補檔為基礎的編輯
summary: 使用 apply_patch 工具套用多檔案修補程式
title: apply_patch 工具
x-i18n:
    generated_at: "2026-05-06T02:57:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

使用結構化修補格式套用檔案變更。這很適合多檔案
或多區塊編輯，因為單一 `edit` 呼叫會很脆弱。

此工具接受單一 `input` 字串，其中包裝一個或多個檔案操作：

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

- `input`（必填）：完整修補內容，包括 `*** Begin Patch` 和 `*** End Patch`。

## 注意事項

- 修補路徑支援相對路徑（從工作區目錄起算）與絕對路徑。
- `tools.exec.applyPatch.workspaceOnly` 預設為 `true`（限制在工作區內）。只有在你有意讓 `apply_patch` 寫入/刪除工作區目錄外的內容時，才將其設為 `false`。
- 在 `*** Update File:` 區塊中使用 `*** Move to:` 來重新命名檔案。
- `*** End of File` 會在需要時標記僅限 EOF 的插入。
- 預設可用於 OpenAI 和 OpenAI Codex 模型。設定
  `tools.exec.applyPatch.enabled: false` 可停用它。
- 可選擇透過模型使用
  `tools.exec.applyPatch.allowModels` 進行限制。
- 設定僅位於 `tools.exec` 下。

## 範例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相關

<CardGroup cols={2}>
  <Card title="差異" href="/zh-TW/tools/diffs" icon="code-compare">
    用於呈現變更的唯讀差異檢視器。
  </Card>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    由 agent 執行 Shell 指令。
  </Card>
  <Card title="程式碼執行" href="/zh-TW/tools/code-execution" icon="square-code">
    使用 xAI 進行沙盒化遠端 Python 分析。
  </Card>
</CardGroup>
