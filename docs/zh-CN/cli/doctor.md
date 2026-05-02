---
read_when:
    - 你遇到连接/身份验证问题，并想要引导式修复
    - 你已更新并想做一次基本检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-05-02T15:57:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90da8ffd705cd517fb90367164cc6af3e551befcec15c91746aa1e1e39454f09
    source_path: cli/doctor.md
    workflow: 16
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
- `--yes`：不提示，接受默认值
- `--repair`：不提示，应用推荐的非服务修复；Gateway 网关服务安装和重写仍需要交互式确认或显式 Gateway 网关命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务中额外安装的 Gateway 网关

注意事项：

- 交互式提示（例如 keychain/OAuth 修复）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，因此无头健康检查能保持快速。交互式会话在检查需要插件参与时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键名，同时列出每项删除。
- `doctor --fix --non-interactive` 会报告缺失或过期的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。对于缺失的服务，运行 `openclaw gateway install`；如果你明确想替换启动器，运行 `openclaw gateway install --force`。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将它们保留在原处。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务形态，并可在调度器必须在运行时自动规范化它们之前就地重写它们。
- 在 Linux 上，当用户的 crontab 仍运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会发出警告；该脚本已不再维护，并且当 cron 缺少 systemd 用户总线环境时，可能记录虚假的 WhatsApp Gateway 网关中断。
- Doctor 会清理由旧版 OpenClaw 创建的旧版插件依赖暂存状态。当注册表可以解析缺失的已配置可下载插件时，它也会修复这些插件；2026.5.2 的 Doctor 执行还会在将配置标记为该版本已触碰之前，自动安装旧配置已在使用的可下载插件。
- Doctor 通过从 `plugins.allow`/`plugins.entries` 中删除缺失的插件 ID 来修复过期插件配置，并在插件发现健康时同时删除匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖。
- Doctor 通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效的 `config` 载荷来隔离无效插件配置。Gateway 网关启动时本来就只会跳过该坏插件，因此其他插件和渠道可以继续运行。
- 当另一个监督进程拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务修复，但会跳过服务安装/启动/重启/bootstrap 以及旧版服务清理。
- 在 Linux 上，Doctor 会忽略处于非活动状态的额外 Gateway 网关式 systemd 单元，并且在修复期间不会为正在运行的 systemd Gateway 网关服务重写命令/入口点元数据。如果你明确想替换活动启动器，请先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关配置）自动迁移到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪检查，并可在缺少嵌入凭证时推荐 `openclaw configure --section model`。
- 当未配置命令所有者时，Doctor 会发出警告。命令所有者是被允许运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与 bot 对话；如果你在首个所有者 bootstrap 存在之前批准过发送者，请显式设置 `commands.ownerAllowFrom`。
- 当已配置 Codex 模式智能体且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，Doctor 会发出警告。本地 Codex app-server 启动会使用隔离的按智能体划分的主目录，因此请使用 `openclaw migrate codex --dry-run` 盘点应有意提升的资产。
- 如果启用了沙箱模式但 Docker 不可用，Doctor 会报告一个高信号警告并附带补救方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭证。
- 如果在修复路径中检查渠道 SecretRef 失败，Doctor 会继续执行并报告警告，而不是提前退出。
- 状态目录迁移后，当已启用的默认 Telegram 或 Discord 账号依赖环境回退，而 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 对 Doctor 进程不可用时，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中有可解析的 Telegram 令牌。如果令牌检查不可用，Doctor 会报告警告并跳过该轮自动解析。

## macOS：`launchctl` 环境覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的“unauthorized”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
