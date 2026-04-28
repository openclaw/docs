---
read_when:
    - 你遇到连接/身份验证问题，并希望获得引导式修复
    - 你已更新并想做一次基本检查
summary: 用于 `openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）
title: Doctor
x-i18n:
    generated_at: "2026-04-28T11:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00110787b9320f84aa3b57ea8b85120d412a97779fbf1e3d8f11f78c87d37676
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
- `--repair`：不提示，应用建议的修复
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括必要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务，查找额外的 Gateway 网关安装

注意：

- 交互式提示（如钥匙串/OAuth 修复）只会在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，因此无头健康检查保持快速。交互式会话仍会在检查需要插件贡献时完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键，同时列出每一项删除。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将它们保留在原处。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`），查找旧版 cron 任务形态，并可在调度器运行时必须自动规范化它们之前就地重写。
- Doctor 会修复缺失的内置插件运行时依赖，而不会写入打包的全局安装。对于 root 拥有的 npm 安装或加固的 systemd 单元，将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写目录，例如 `/var/lib/openclaw/plugin-runtime-deps`；它也可以是路径列表，例如 `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`，其中较早的根目录是只读查找层，最后一个根目录是修复目标。
- 当插件发现健康时，Doctor 会通过从 `plugins.allow`/`plugins.entries` 中移除缺失的插件 ID，以及匹配的悬空渠道配置、心跳目标和渠道模型覆盖，修复过期的插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效的 `config` 载荷，隔离无效插件配置。Gateway 网关启动时已经只会跳过该坏插件，因此其他插件和渠道可以继续运行。
- 当另一个 supervisor 拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务修复，但会跳过服务安装/启动/重启/bootstrap 和旧版服务清理。
- 在 Linux 上，doctor 会忽略处于非活动状态的额外 Gateway 网关样式 systemd 单元，并且不会在修复期间重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。当你有意替换活动启动器时，请先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关配置）自动迁移到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪性检查，并可在缺少嵌入凭证时推荐 `openclaw configure --section model`。
- 如果启用了沙箱模式但 Docker 不可用，doctor 会报告一条高信号警告，并提供补救措施（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，doctor 会报告只读警告，并且不会写入明文后备凭证。
- 如果在修复路径中渠道 SecretRef 检查失败，doctor 会继续执行并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中有一个可解析的 Telegram 令牌。如果令牌检查不可用，doctor 会报告警告，并跳过该次自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持久的“未授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 doctor](/zh-CN/gateway/doctor)
