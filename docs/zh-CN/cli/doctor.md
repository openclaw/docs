---
read_when:
    - 你遇到了连接或认证问题，并希望获得引导式修复。
    - 你刚完成更新，想做一次安装完整性检查。
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-04-23T06:17:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad44619b427b938b2f6d4f904fcdc2d9862ff33c569008590f25e17d12e03530
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

用于 Gateway 网关和渠道的健康检查 + 快速修复。

相关内容：

- 故障排除：[故障排除](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 示例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 选项

- `--no-workspace-suggestions`：禁用工作区记忆/搜索建议
- `--yes`：不提示，直接接受默认值
- `--repair`：不提示，直接应用推荐修复
- `--fix`：`--repair` 的别名
- `--force`：应用更激进的修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：以非交互方式运行；仅执行安全迁移
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务以查找额外的 Gateway 网关安装

说明：

- 交互式提示（如钥匙串 / OAuth 修复）仅在 stdin 为 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键，同时列出每一项被删除的内容。
- 状态完整性检查现在会检测会话目录中的孤立转录文件，并可将其归档为 `.deleted.<timestamp>`，以安全回收空间。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务结构，并可在调度器需要在运行时自动规范化之前，直接原地重写它们。
- Doctor 会修复缺失的内置插件运行时依赖，而不要求对已安装的 OpenClaw 软件包具有写权限。对于 root 拥有的 npm 安装或加固的 systemd 单元，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写目录，例如 `/var/lib/openclaw/plugin-runtime-deps`。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 等）迁移为 `talk.provider` + `talk.providers.<provider>`。
- 重复运行 `doctor --fix` 时，如果唯一差异只是对象键顺序，将不再报告或应用 Talk 规范化。
- Doctor 包含记忆搜索就绪性检查，并可在缺少嵌入凭证时建议运行 `openclaw configure --section model`。
- 如果启用了沙箱模式但 Docker 不可用，doctor 会报告高信号警告，并提供修复方法（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token` / `gateway.auth.password` 由 SecretRef 管理，且在当前命令路径中不可用，doctor 会报告只读警告，并且不会写入明文回退凭证。
- 如果渠道 SecretRef 检查在修复路径中失败，doctor 会继续执行并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求在当前命令路径中有可解析的 Telegram 令牌。如果令牌检查不可用，doctor 会报告警告，并在该次运行中跳过自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续出现“未授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
