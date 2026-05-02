---
read_when:
    - 你遇到连接或凭证问题，并想获得引导式修复
    - 你已更新并想做一次基本检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-05-02T18:56:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 网关和渠道的健康检查 + 快速修复。

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
- `--repair`：不提示，应用建议的非服务修复；Gateway 网关服务安装和重写仍需要交互式确认或显式 Gateway 网关命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务，查找额外的 Gateway 网关安装

注意事项：

- 交互式提示（如 keychain/OAuth 修复）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，让无头健康检查保持快速。交互式会话在检查需要插件贡献时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并丢弃未知配置键，列出每一项移除。
- `doctor --fix --non-interactive` 会报告缺失或过期的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。对于缺失的服务，运行 `openclaw gateway install`；当你明确想替换启动器时，运行 `openclaw gateway install --force`。
- 状态完整性检查现在会检测会话目录中的孤立 transcript 文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会让它们保留在原处。
- Doctor 也会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以查找旧版 cron job 结构，并可在调度器必须在运行时自动规范化它们之前就地重写。
- 在 Linux 上，当用户的 crontab 仍运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会发出警告；该脚本不再维护，并且当 cron 缺少 systemd user-bus 环境时，可能会记录虚假的 WhatsApp Gateway 网关故障。
- Doctor 会清理旧版 OpenClaw 创建的旧版插件依赖暂存状态。当 registry 能解析缺失的已配置可下载插件时，它也会修复它们，并且 2026.5.2 的 Doctor 检查会在将配置标记为该版本已触碰之前，自动安装旧配置已经使用的可下载插件。
- 当插件发现正常时，Doctor 会通过从 `plugins.allow`/`plugins.entries` 移除缺失的插件 id，以及匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖，来修复过期插件配置。
- Doctor 会隔离无效插件配置，方法是禁用受影响的 `plugins.entries.<id>` 条目，并移除其无效的 `config` payload。Gateway 网关启动本来就只会跳过这个异常插件，因此其他插件和渠道可以继续运行。
- 当另一个 supervisor 拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状况并应用非服务修复，但会跳过服务安装/启动/重启/bootstrap 和旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外 Gateway 网关类似 systemd unit，并且在修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。当你明确想替换活动启动器时，先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）自动迁移到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪检查，并且在缺少 embedding 凭证时可建议运行 `openclaw configure --section model`。
- 当未配置命令所有者时，Doctor 会发出警告。命令所有者是允许运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与 bot 对话；如果你在首个所有者 bootstrap 存在之前批准过某个发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式智能体，且操作员的 Codex home 中存在个人 Codex CLI 资产时，Doctor 会发出警告。本地 Codex app-server 启动使用按智能体隔离的 home，因此请使用 `openclaw migrate codex --dry-run` 清点应有意提升的资产。
- 当默认智能体允许的 Skills 因缺少 bins、环境变量、配置或 OS 要求而在当前运行时环境中不可用时，Doctor 会发出警告。`doctor --fix` 可以通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用 Skills；当你想保持该 skill 启用时，请改为安装/配置缺失要求。
- 如果启用了沙箱模式但 Docker 不可用，Doctor 会报告高信号警告并附带修复方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文 fallback 凭证。
- 如果渠道 SecretRef 检查在修复路径中失败，Doctor 会继续并报告警告，而不是提前退出。
- 状态目录迁移后，当已启用的默认 Telegram 或 Discord 账号依赖环境 fallback，且 Doctor 进程无法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 时，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中存在可解析的 Telegram token。如果 token 检查不可用，Doctor 会报告警告，并跳过该次自动解析。

## macOS：`launchctl` 环境覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的 “unauthorized” 错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
