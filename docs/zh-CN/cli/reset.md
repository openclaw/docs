---
read_when:
    - 你想在保留 CLI 安装的同时清除本地状态
    - 你想要预演会被移除的内容
summary: '`openclaw reset` 的 CLI 参考（重置本地状态/配置）'
title: 重置
x-i18n:
    generated_at: "2026-07-05T11:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

重置本地配置/状态（保留已安装的 CLI）。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## 选项

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要 `--scope` 和 `--yes`
- `--dry-run`：打印操作，但不删除文件

## 范围

| 范围                    | 删除内容                                                                                              | 是否先停止 Gateway 网关 |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| `config`                | 仅配置文件                                                                                            | 否                      |
| `config+creds+sessions` | 配置文件、OAuth/凭据目录、每个智能体的会话目录                                                       | 是                      |
| `full`                  | 状态目录（如果配置/凭据嵌套在其中也一并包含）以及工作区目录和工作区证明                              | 是                      |

`config+creds+sessions` 和 `full` 会在删除状态前停止正在运行的托管 Gateway 网关服务。

## 说明

- 删除本地状态前，先运行 `openclaw backup create` 创建可恢复的快照。
- 如果没有 `--scope`，`openclaw reset` 会以交互方式提示选择要删除的范围。
- 只有同时设置 `--scope` 和 `--yes` 时，`--non-interactive` 才有效。
- `config+creds+sessions` 和 `full` 完成后会打印 `Next: openclaw onboard --install-daemon`。

## 相关

- [CLI 参考](/zh-CN/cli)
