---
read_when:
    - 你想移除 gateway 服务和/或本地状态
    - 你想先执行一次 dry-run
summary: '`openclaw uninstall` 的 CLI 参考（移除 gateway 服务 + 本地数据）'
title: uninstall
x-i18n:
    generated_at: "2026-04-05T08:20:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

卸载 gateway 服务 + 本地数据（CLI 会保留）。

选项：

- `--service`：移除 gateway 服务
- `--state`：移除状态和配置
- `--workspace`：移除工作区目录
- `--app`：移除 macOS 应用
- `--all`：移除服务、状态、工作区和应用
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；要求设置 `--yes`
- `--dry-run`：打印将执行的操作，但不删除文件

示例：

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

说明：

- 如果你希望在移除状态或工作区之前保留一个可恢复的快照，请先运行 `openclaw backup create`。
- `--all` 是同时移除服务、状态、工作区和应用的简写。
- `--non-interactive` 需要 `--yes`。
