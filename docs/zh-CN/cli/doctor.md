---
read_when:
    - 你遇到了连接/身份验证问题，并想要引导式修复
    - 你已更新，并想做一次完整性检查
summary: CLI 参考：`openclaw doctor`（健康检查 + 引导式修复）
title: Doctor
x-i18n:
    generated_at: "2026-04-28T22:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 网关和渠道的健康检查 + 快速修复。

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
- `--repair`：不提示，应用推荐的修复
- `--fix`：`--repair` 的别名
- `--force`：应用强力修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务中的额外 Gateway 网关安装

注意事项：

- 交互式提示（如钥匙串/OAuth 修复）只会在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无界面运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，因此无界面健康检查会保持快速。交互式会话仍会在检查需要插件提供信息时完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键名，同时列出每项删除。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无界面运行会保留它们。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务结构，并可在调度器必须在运行时自动规范化它们之前就地重写。
- Doctor 会修复缺失的内置插件运行时依赖，而不会写入打包的全局安装。对于 root 拥有的 npm 安装或加固的 systemd 单元，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写目录，例如 `/var/lib/openclaw/plugin-runtime-deps`；它也可以是路径列表，例如 `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`，其中较早的根目录是只读查找层，最后一个根目录是修复目标。
- 当插件发现健康时，Doctor 会通过从 `plugins.allow`/`plugins.entries` 中移除缺失的插件 ID，以及匹配的悬空渠道配置、心跳目标和渠道模型覆盖，来修复过期插件配置。
- Doctor 会隔离无效插件配置：禁用受影响的 `plugins.entries.<id>` 条目，并移除其无效的 `config` 载荷。Gateway 网关启动时已经只会跳过该异常插件，因此其他插件和渠道可以继续运行。
- 当另一个监督程序拥有 Gateway 网关生命周期时，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务修复，但会跳过服务安装/启动/重启/引导和旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外类 Gateway 网关 systemd 单元，并且不会在修复期间重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。如果你确实想替换活动启动器，请先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）迁移到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪性检查，并可在缺少嵌入凭证时推荐运行 `openclaw configure --section model`。
- 当未配置命令所有者时，Doctor 会发出警告。命令所有者是允许运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与机器人对话；如果你在首个所有者引导机制存在之前批准过发送者，请显式设置 `commands.ownerAllowFrom`。
- 如果启用了沙箱模式但 Docker 不可用，Doctor 会报告高信号警告并给出补救措施（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文后备凭证。
- 如果渠道 SecretRef 检查在修复路径中失败，Doctor 会继续执行并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中有可解析的 Telegram 令牌。如果令牌检查不可用，Doctor 会报告警告，并跳过该轮自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的“未授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
