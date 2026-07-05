---
read_when:
    - 你想移除 Gateway 网关服务和/或本地状态
    - 你想先进行一次试运行
summary: '`openclaw uninstall` 的 CLI 参考（移除 Gateway 网关服务 + 本地数据）'
title: 卸载
x-i18n:
    generated_at: "2026-07-05T11:11:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

卸载 Gateway 网关服务和/或本地数据。CLI 本身不会被
移除；请通过 npm/pnpm 单独卸载。

## 选项

| 标志                | 默认值 | 描述                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `--service`         | `false` | 移除 Gateway 网关服务。                          |
| `--state`           | `false` | 移除状态和配置。                             |
| `--workspace`       | `false` | 移除工作区目录。                        |
| `--app`             | `false` | 移除 macOS 应用。                                |
| `--all`             | `false` | `--service --state --workspace --app` 的简写。 |
| `--yes`             | `false` | 跳过确认提示。                           |
| `--non-interactive` | `false` | 禁用提示；需要 `--yes`。                   |
| `--dry-run`         | `false` | 打印计划执行的操作，而不移除文件。        |

如果没有指定范围标志，会通过交互式多选提示选择要移除的组件
（默认预选服务、状态和工作区）。

## 示例

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 说明

- 在移除状态或工作区之前，先运行 `openclaw backup create` 创建可恢复的快照。
- `--state` 会保留已配置的工作区目录，除非同时选择了 `--workspace`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [卸载](/zh-CN/install/uninstall)
