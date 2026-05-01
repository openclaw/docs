---
read_when:
    - 你遇到连接或身份验证问题，并想要引导式修复
    - 你已更新并想做一次完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-05-01T21:49:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b15e5e5d062ae3e6f236775567b098d57ea6518171c0d45c78cab5b985e215e
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

针对 Gateway 网关和渠道的健康检查 + 快速修复。

相关：

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
- `--yes`：不提示，接受默认值
- `--repair`：不提示，应用推荐的非服务修复；Gateway 网关服务安装和重写仍需要交互式确认或显式 Gateway 网关命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：不显示提示运行；仅执行安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务，查找额外的 Gateway 网关安装

说明：

- 交互式提示（如钥匙串/OAuth 修复）只会在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，因此无头健康检查保持快速。交互式会话在检查需要插件参与时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键名，同时列出每一项删除。
- `doctor --fix --non-interactive` 会报告缺失或过期的 Gateway 网关服务定义，但不会在更新修复模式之外安装或重写它们。服务缺失时运行 `openclaw gateway install`；如果你明确想替换启动器，则运行 `openclaw gateway install --force`。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将它们保留在原处。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务形态，并可在调度器必须在运行时自动规范化它们之前原地重写。
- 在 Linux 上，当用户的 crontab 仍运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会发出警告；该脚本已不再维护，并且当 cron 缺少 systemd 用户总线环境时，可能记录错误的 WhatsApp Gateway 网关宕机。
- Doctor 会清理旧版 OpenClaw 创建的旧版插件依赖暂存状态。当注册表能够解析已配置但缺失的可下载插件时，它也会修复这些插件。
- Doctor 会通过从 `plugins.allow`/`plugins.entries` 中移除缺失的插件 ID 来修复过期的插件配置，并在插件发现健康时一并移除匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效的 `config` 负载，来隔离无效插件配置。Gateway 网关启动时已经只会跳过该损坏插件，因此其他插件和渠道可以继续运行。
- 当另一个监督器负责 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务修复，但会跳过服务安装/启动/重启/引导以及旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外 Gateway 网关类 systemd 单元，并且在修复期间不会为正在运行的 systemd Gateway 网关服务重写命令/入口点元数据。如果你明确想替换活动启动器，请先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）自动迁移到 `talk.provider` + `talk.providers.<provider>`。
- 重复运行 `doctor --fix` 时，如果唯一差异是对象键顺序，将不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪检查，并可在缺少嵌入凭证时建议运行 `openclaw configure --section model`。
- 未配置命令所有者时，Doctor 会发出警告。命令所有者是获准运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与机器人对话；如果你在首次所有者引导存在之前批准过某个发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式智能体，且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，Doctor 会发出警告。本地 Codex 应用服务器启动使用隔离的逐智能体主目录，因此请使用 `openclaw migrate codex --dry-run` 清点应有意提升的资产。
- 如果沙箱模式已启用但 Docker 不可用，Doctor 会报告高信号警告及修复方法（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭证。
- 如果在修复路径中检查渠道 SecretRef 失败，Doctor 会继续并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中有可解析的 Telegram 令牌。如果令牌检查不可用，Doctor 会报告警告，并在该次运行中跳过自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的“unauthorized”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
