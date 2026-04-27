---
read_when:
    - 你遇到了连接或身份验证问题，并且希望获得引导式修复方案
    - 你已完成更新，并且想进行一次安装完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-04-27T12:50:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68193d8ffa77f01be160e41046a3a4dd4d34df1b87fe40bd46f1b749fe397c4
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

- `--no-workspace-suggestions`：禁用工作区内存/搜索建议
- `--yes`：接受默认值而不提示
- `--repair`：不经提示应用推荐修复
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务以查找额外的 Gateway 网关安装

说明：

- 交互式提示（如钥匙串/OAuth 修复）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）将跳过提示。
- 性能：非交互式 `doctor` 运行会跳过预先加载插件，以保持无头健康检查的速度。交互式会话在某项检查需要插件参与时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键，同时列出每项删除内容。
- 状态完整性检查现在会检测会话目录中的孤立 transcript 文件，并可将其归档为 `.deleted.<timestamp>`，以安全回收空间。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中旧版 cron 任务结构，并可在调度器需要于运行时自动规范化之前就地重写它们。
- Doctor 会修复缺失的内置插件运行时依赖，而不会写入已打包的全局安装。对于 root 拥有的 npm 安装或加固的 systemd 单元，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设为可写目录，例如 `/var/lib/openclaw/plugin-runtime-deps`；它也可以是路径列表，例如 `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`，其中前面的根目录是只读查找层，最后一个根目录是修复目标。
- 当插件发现正常时，Doctor 会通过从 `plugins.allow`/`plugins.entries` 中移除缺失的插件 id，以及对应的悬空渠道配置、心跳目标和渠道模型覆盖项，来修复过时的插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效的 `config` 负载，来隔离无效插件配置。Gateway 网关启动时本就只会跳过该损坏插件，因此其他插件和渠道仍可继续运行。
- 当由其他监督器接管 Gateway 网关生命周期时，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务类修复，但会跳过服务安装/启动/重启/引导和旧版服务清理。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 等）自动迁移为 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异只是对象键顺序时，重复执行 `doctor --fix` 将不再报告/应用 Talk 规范化。
- Doctor 包含内存搜索就绪性检查，并且在缺少嵌入凭证时可建议运行 `openclaw configure --section model`。
- 如果已启用沙箱模式但 Docker 不可用，doctor 会报告高信号警告并提供修复方法（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在当前命令路径中不可用，doctor 会报告只读警告，并且不会写入明文后备凭证。
- 如果在修复路径中渠道 SecretRef 检查失败，doctor 会继续执行并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中存在可解析的 Telegram 令牌。如果令牌检查不可用，doctor 会报告警告，并在本次运行中跳过自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续出现“unauthorized”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
