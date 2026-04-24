---
read_when:
    - 你想在保留 CLI 已安装状态的同时清除本地状态
    - 你想先进行一次试运行，查看将会移除哪些内容
summary: '`openclaw reset` 的 CLI 参考（重置本地状态/配置）'
title: 重置
x-i18n:
    generated_at: "2026-04-24T04:01:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

重置本地配置/状态（保留 CLI 已安装）。

选项：

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要同时设置 `--scope` 和 `--yes`
- `--dry-run`：打印操作内容而不删除文件

示例：

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

说明：

- 如果你想在删除本地状态前保留一个可恢复的快照，请先运行 `openclaw backup create`。
- 如果你省略 `--scope`，`openclaw reset` 会使用交互式提示来选择要删除的内容。
- `--non-interactive` 仅在同时设置 `--scope` 和 `--yes` 时有效。

## 相关内容

- [CLI 参考](/zh-CN/cli)
