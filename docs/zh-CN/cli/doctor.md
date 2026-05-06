---
read_when:
    - 你遇到连接或身份验证问题，并想要引导式修复
    - 你已完成更新，想做一次完整性检查
summary: CLI 参考：`openclaw doctor`（健康检查 + 引导式修复）
title: Doctor
x-i18n:
    generated_at: "2026-05-06T00:47:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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
- `--repair`：不提示并应用推荐的非服务修复；Gateway 网关服务安装和重写仍需要交互式确认或显式 Gateway 网关命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务以查找额外的 Gateway 网关安装，并报告最近的 Gateway 网关 supervisor 重启移交

备注：

- 交互式提示（如钥匙串/OAuth 修复）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，以便无头健康检查保持快速。交互式会话在检查需要插件贡献时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键名，列出每项移除。
- `doctor --fix --non-interactive` 会报告缺失或过期的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。服务缺失时运行 `openclaw gateway install`；如果你明确要替换启动器，则运行 `openclaw gateway install --force`。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会让它们保持原位。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务形状，并可在调度器必须在运行时自动规范化它们之前就地重写。
- 在 Linux 上，当用户的 crontab 仍运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会发出警告；该脚本已不再维护，并且当 cron 缺少 systemd 用户总线环境时可能记录误报的 WhatsApp Gateway 网关中断。
- 启用 WhatsApp 时，Doctor 会检查本地 `openclaw-tui` 客户端仍在运行的降级 Gateway 网关事件循环。`doctor --fix` 只会停止已验证的本地 TUI 客户端，避免 WhatsApp 回复排在过期 TUI 刷新循环之后。
- Doctor 会在主模型、回退、Heartbeat/子智能体/压缩覆盖、钩子、渠道模型覆盖以及过期会话路由固定项中，将旧版 `openai-codex/*` 模型引用重写为规范的 `openai/*` 引用。仅当 Codex 插件已安装、已启用、贡献了 `codex` harness 且有可用 OAuth 时，`--fix` 才会选择 `agentRuntime.id: "codex"`；否则会选择 `agentRuntime.id: "pi"`，使路由保持在默认 OpenClaw runner 上。
- Doctor 会清理由旧版 OpenClaw 创建的旧版插件依赖暂存状态。它还会修复配置引用的缺失可下载插件，例如 `plugins.entries`、已配置渠道、已配置提供商/搜索设置或已配置 Agent Runtimes。在包更新期间，Doctor 会跳过包管理器插件修复，直到包切换完成；如果已配置插件仍需要恢复，请随后重新运行 `openclaw doctor --fix`。如果下载失败，Doctor 会报告安装错误，并保留已配置插件条目以供下一次修复尝试。
- 当插件发现健康时，Doctor 会通过从 `plugins.allow`/`plugins.entries` 中移除缺失的插件 ID，以及匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖，来修复过期插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效 `config` 载荷，来隔离无效插件配置。Gateway 网关启动已只会跳过该损坏插件，因此其他插件和渠道可以继续运行。
- 当另一个 supervisor 拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状况并应用非服务修复，但会跳过服务安装/启动/重启/bootstrap 和旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外 Gateway 网关样式 systemd 单元，并且在修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。如果你明确要替换活动启动器，请先停止服务或使用 `openclaw gateway install --force`。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）自动迁移到 `talk.provider` + `talk.providers.<provider>`。
- 重复运行 `doctor --fix` 时，如果唯一差异是对象键顺序，将不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪性检查，并且可在缺少嵌入凭证时建议 `openclaw configure --section model`。
- 未配置命令所有者时，Doctor 会发出警告。命令所有者是允许运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与 bot 对话；如果你在首个所有者 bootstrap 存在之前批准过发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式智能体，并且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，Doctor 会发出警告。本地 Codex 应用服务器启动会使用隔离的每智能体主目录，因此请使用 `openclaw migrate codex --dry-run` 盘点应有意提升的资产。
- 当默认智能体允许的 Skills 因缺少 bin、环境变量、配置或 OS 要求而在当前运行时环境中不可用时，Doctor 会发出警告。`doctor --fix` 可以通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用 Skills；如果你想保持该 skill 活跃，请改为安装/配置缺失要求。
- 如果已启用沙箱模式但 Docker 不可用，Doctor 会报告带有修复建议的高信号警告（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在旧版沙箱 registry 文件（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），Doctor 会报告它们；`openclaw doctor --fix` 会将有效条目迁移到分片 registry 目录，并隔离无效旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭证。
- 如果渠道 SecretRef 检查在修复路径中失败，Doctor 会继续并报告警告，而不是提前退出。
- 状态目录迁移后，当启用的默认 Telegram 或 Discord 账号依赖环境变量回退，并且 Doctor 进程无法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 时，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中有可解析的 Telegram 令牌。如果令牌检查不可用，Doctor 会报告警告，并跳过该轮自动解析。

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
