---
read_when:
    - 你需要对多个文件进行结构化编辑
    - 你想要记录补丁式编辑的用法或调试此类编辑
summary: 使用 apply_patch 工具应用多文件补丁
title: apply_patch 工具
x-i18n:
    generated_at: "2026-07-11T20:57:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

使用结构化补丁格式应用文件更改。它非常适合多文件或多区块编辑，因为在这些场景中，单次 `edit` 调用容易出错。

该工具接受一个 `input` 字符串，其中封装一个或多个文件操作：

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

## 参数

- `input`（必需）：完整的补丁内容，包括 `*** Begin Patch` 和 `*** End Patch`。

## 注意事项

- 补丁路径支持相对路径（相对于工作区目录）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（仅限工作区内）。只有当你确实希望 `apply_patch` 在工作区目录之外写入或删除内容时，才将其设置为 `false`。
- 在 `*** Update File:` 区块中使用 `*** Move to:` 可重命名文件。
- 必要时，`*** End of File` 用于标记仅在文件末尾插入。
- 默认对每个模型启用。设置 `tools.exec.applyPatch.enabled: false` 可将其禁用，或者使用 `tools.exec.applyPatch.allowModels` 将其限制为特定模型（接受 `gpt-5.4` 等原始 ID 或 `openai/gpt-5.4` 等完整 ID）。
- 配置位于 `tools.exec.applyPatch.*` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相关内容

<CardGroup cols={2}>
  <Card title="Diffs" href="/zh-CN/tools/diffs" icon="code-compare">
    用于呈现更改的只读差异查看器。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    由智能体执行 shell 命令。
  </Card>
  <Card title="代码执行" href="/zh-CN/tools/code-execution" icon="square-code">
    使用 xAI 进行沙箱隔离的远程 Python 分析。
  </Card>
</CardGroup>
