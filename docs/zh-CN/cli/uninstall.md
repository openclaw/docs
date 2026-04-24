---
read_when:
    - 你想移除 Gateway 网关服务和/或本地状态
    - 你想先执行一次演练模式
summary: '`openclaw uninstall` 的 CLI 参考（移除 Gateway 网关服务和本地数据）'
title: 卸载
x-i18n:
    generated_at: "2026-04-24T04:01:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

卸载 Gateway 网关服务和本地数据（CLI 会保留）。

选项：

- `--service`：移除 Gateway 网关服务
- `--state`：移除状态和配置
- `--workspace`：移除工作区目录
- `--app`：移除 macOS 应用
- `--all`：移除服务、状态、工作区和应用
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要配合 `--yes`
- `--dry-run`：打印将执行的操作而不删除文件

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

- 如果你想在移除状态或工作区之前保留一个可恢复的快照，请先运行 `openclaw backup create`。
- `--all` 是同时移除服务、状态、工作区和应用的简写。
- `--non-interactive` 需要配合 `--yes`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [卸载](/zh-CN/install/uninstall)
