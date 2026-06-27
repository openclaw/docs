---
read_when:
    - 你想要移除 Gateway 网关服务和/或本地状态
    - 你想先进行一次试运行
summary: '`openclaw uninstall` 的 CLI 参考（移除 Gateway 网关服务 + 本地数据）'
title: 卸载
x-i18n:
    generated_at: "2026-06-27T01:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

卸载 Gateway 网关服务和本地数据（CLI 保留）。

选项：

- `--service`：移除 Gateway 网关服务
- `--state`：移除状态和配置
- `--workspace`：移除工作区目录
- `--app`：移除 macOS 应用
- `--all`：移除服务、状态、工作区和应用
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要 `--yes`
- `--dry-run`：打印操作而不移除文件

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

- 如果你想在移除状态或工作区之前保留可恢复的快照，请先运行 `openclaw backup create`。
- `--state` 会保留已配置的工作区目录，除非同时选择了 `--workspace`。
- `--all` 是同时移除服务、状态、工作区和应用的简写。
- `--non-interactive` 需要 `--yes`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [卸载](/zh-CN/install/uninstall)
