---
read_when:
    - 你想清除本地状态，同时保留已安装的 CLI
    - 你想预演将会移除哪些内容
summary: '`openclaw reset` 的 CLI 参考（重置本地状态/配置）'
title: 重置
x-i18n:
    generated_at: "2026-07-11T20:27:25Z"
    model: gpt-5.6
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
- `--non-interactive`：禁用提示；需要同时指定 `--scope` 和 `--yes`
- `--dry-run`：输出将执行的操作，但不删除文件

## 范围

| 范围                    | 删除内容                                                                                      | 是否先停止 Gateway 网关 |
| ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| `config`                | 仅配置文件                                                                                    | 否                      |
| `config+creds+sessions` | 配置文件、OAuth/凭据目录、各智能体的会话目录                                                   | 是                      |
| `full`                  | 状态目录（包括嵌套其中的配置/凭据）、工作区目录和工作区认证记录                                | 是                      |

`config+creds+sessions` 和 `full` 会先停止正在运行的托管 Gateway 网关服务，再删除状态。

## 注意事项

- 删除本地状态前，请先运行 `openclaw backup create` 创建可恢复的快照。
- 未指定 `--scope` 时，`openclaw reset` 会以交互方式提示选择要删除的范围。
- 只有同时设置 `--scope` 和 `--yes` 时，`--non-interactive` 才有效。
- `config+creds+sessions` 和 `full` 完成后会输出 `Next: openclaw onboard --install-daemon`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
