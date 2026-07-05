---
read_when:
    - 你需要跨多个文件进行结构化文件编辑
    - 你想记录或调试基于补丁的编辑
summary: 使用 apply_patch 工具应用多文件补丁
title: apply_patch 工具
x-i18n:
    generated_at: "2026-07-05T11:45:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

使用结构化补丁格式应用文件更改。这非常适合多文件或多处 hunk 编辑，因为单次 `edit` 调用可能比较脆弱。

该工具接受一个 `input` 字符串，其中包装一个或多个文件操作：

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

- `input`（必需）：完整补丁内容，包括 `*** Begin Patch` 和 `*** End Patch`。

## 说明

- 补丁路径支持相对路径（相对于工作空间目录）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（限制在工作空间内）。仅当你有意让 `apply_patch` 在工作空间目录之外写入或删除时，才将其设为 `false`。
- 在 `*** Update File:` hunk 中使用 `*** Move to:` 来重命名文件。
- `*** End of File` 在需要时标记仅 EOF 插入。
- 默认对每个模型启用。设置 `tools.exec.applyPatch.enabled: false`
  可禁用它，或使用 `tools.exec.applyPatch.allowModels` 将其限制为特定模型
  （接受像 `gpt-5.4` 这样的原始 ID，或像 `openai/gpt-5.4` 这样的完整
  ID）。
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
    用于呈现更改的只读 diff 查看器。
  </Card>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    从智能体执行 shell 命令。
  </Card>
  <Card title="Code execution" href="/zh-CN/tools/code-execution" icon="square-code">
    使用 xAI 进行沙箱隔离的远程 Python 分析。
  </Card>
</CardGroup>
