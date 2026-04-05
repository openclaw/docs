---
read_when:
    - 你想清除本地状态，同时保留 CLI 已安装
    - 你想先进行一次 dry-run，查看将会移除哪些内容
summary: '`openclaw reset` 的 CLI 参考（重置本地状态/配置）'
title: reset
x-i18n:
    generated_at: "2026-04-05T08:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

重置本地配置/状态（保留 CLI 已安装）。

选项：

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；要求同时设置 `--scope` 和 `--yes`
- `--dry-run`：打印将执行的操作，但不删除文件

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

- 如果你希望在移除本地状态之前保留一个可恢复的快照，请先运行 `openclaw backup create`。
- 如果你省略 `--scope`，`openclaw reset` 会使用交互式提示来选择要移除的内容。
- 只有在同时设置 `--scope` 和 `--yes` 时，`--non-interactive` 才有效。
