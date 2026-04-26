---
read_when:
    - 更新 OpenClaw
    - 更新后某些功能出现故障
summary: 安全更新 OpenClaw（全局安装或源码安装），以及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-04-26T08:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01910db43feded3d8fca4209f6725244f3ea4e448b361d9013a042eec577a3a5
    source_path: install/updating.md
    workflow: 15
---

让 OpenClaw 保持最新。

## 推荐：`openclaw update`

这是最快的更新方式。它会检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

要切换渠道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 仅预览，不实际应用
```

`--channel beta` 会优先选择 beta，但当 beta 标签不存在或比最新 stable 发布版本更旧时，运行时会回退到 stable/latest。若你想为一次性的软件包更新使用原始的 npm beta dist-tag，请使用 `--tag beta`。

关于渠道语义，请参阅 [Development channels](/zh-CN/install/development-channels)。

## 在 npm 和 git 安装之间切换

当你想更改安装类型时，请使用渠道。更新器会保留你在 `~/.openclaw` 中的状态、配置、凭证和工作区；它只会更改 CLI 和 Gateway 网关所使用的 OpenClaw 代码安装方式。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先使用 `--dry-run` 预览确切的安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 渠道会确保存在一个 git checkout，完成构建，并从该 checkout 安装全局 CLI。`stable` 和 `beta` 渠道使用软件包安装。如果 Gateway 网关已经安装，`openclaw update` 会刷新服务元数据并重启它，除非你传入 `--no-restart`。

## 另一种方式：重新运行安装脚本

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。若要通过安装脚本强制指定安装类型，请传入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

## 另一种方式：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 全局 npm 安装与运行时依赖

OpenClaw 会将打包后的全局安装在运行时视为只读，即使当前用户对全局软件包目录具有写权限也是如此。内置插件的运行时依赖会被暂存到一个可写的运行时目录中，而不是修改软件包树。这样可以避免 `openclaw update` 与正在运行的 Gateway 网关或本地智能体在同一次安装过程中修复插件依赖时发生竞争。

某些 Linux npm 配置会将全局软件包安装到由 root 拥有的目录中，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 通过相同的外部暂存路径支持这种布局。

对于强化配置的 systemd 单元，请设置一个包含在 `ReadWritePaths` 中的可写暂存目录：

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

如果未设置 `OPENCLAW_PLUGIN_STAGE_DIR`，OpenClaw 会在 systemd 提供 `$STATE_DIRECTORY` 时使用它，否则回退到 `~/.openclaw/plugin-runtime-deps`。修复步骤会将该暂存目录视为 OpenClaw 自有的本地软件包根目录，并忽略用户的 npm prefix/全局设置，因此全局安装的 npm 配置不会将内置插件依赖重定向到 `~/node_modules` 或全局软件包树中。

在进行软件包更新和内置运行时依赖修复之前，OpenClaw 会尽力对目标卷执行磁盘空间检查。空间不足时会输出警告并显示检查的路径，但不会阻止更新，因为文件系统配额、快照和网络卷可能会在检查后发生变化。实际的 npm 安装、复制和安装后验证仍然是最终依据。

### 内置插件运行时依赖

打包安装会将内置插件运行时依赖保留在只读软件包树之外。在启动时以及执行 `openclaw doctor --fix` 期间，OpenClaw 只会为以下内置插件修复运行时依赖：在配置中处于活动状态的插件、通过旧版渠道配置处于活动状态的插件，或由其内置清单默认启用的插件。仅持久化的渠道认证状态本身不会触发 Gateway 网关启动时的运行时依赖修复。

显式禁用具有最高优先级。已禁用的插件或渠道不会仅因为存在于软件包中就修复其运行时依赖。外部插件和自定义加载路径仍应使用 `openclaw plugins install` 或 `openclaw plugins update`。

## 自动更新器

自动更新器默认关闭。可在 `~/.openclaw/openclaw.json` 中启用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 渠道 | 行为 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 范围内通过确定性抖动应用更新（分散发布）。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 检查一次（默认：每小时），并立即应用。 |
| `dev`    | 不自动应用。请手动使用 `openclaw update`。 |

Gateway 网关还会在启动时记录一条更新提示（可使用 `update.checkOnStart: false` 禁用）。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略，并检查 Gateway 网关健康状态。详情： [Doctor](/zh-CN/gateway/doctor)

### 重启 Gateway 网关

```bash
openclaw gateway restart
```

### 验证

```bash
openclaw health
```

</Steps>

## 回滚

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

提示：`npm view openclaw version` 可显示当前已发布版本。

### 固定提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

要返回最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor`，并仔细阅读输出内容。
- 对于源码 checkout 上的 `openclaw update --channel dev`，更新器会在需要时自动引导安装 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排除](/zh-CN/gateway/troubleshooting)
- 在 Discord 提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [Install Overview](/zh-CN/install) — 所有安装方式
- [Doctor](/zh-CN/gateway/doctor) — 更新后的健康检查
- [Migrating](/zh-CN/install/migrating) — 主要版本迁移指南
