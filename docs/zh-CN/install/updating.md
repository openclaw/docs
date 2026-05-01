---
read_when:
    - 更新 OpenClaw
    - 更新后出现问题
summary: 安全更新 OpenClaw（全局安装或源码），以及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-05-01T08:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

让 OpenClaw 保持最新。

## 推荐：`openclaw update`

最快的更新方式。它会检测你的安装类型（npm 或 git）、获取最新版本、运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

要切换渠道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` 优先使用 beta，但当 beta 标签缺失或早于最新稳定版时，运行时会回退到 stable/latest。如果你想为一次性软件包更新使用原始的 npm beta dist-tag，请使用 `--tag beta`。

查看 [开发渠道](/zh-CN/install/development-channels) 了解渠道语义。

## 在 npm 和 git 安装之间切换

当你想更改安装类型时，请使用渠道。更新器会保留你在 `~/.openclaw` 中的状态、配置、凭证和工作区；它只会更改 CLI 和 Gateway 网关使用的 OpenClaw 代码安装。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先使用 `--dry-run` 运行，以预览准确的安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 渠道会确保存在一个 git 检出，构建它，并从该检出安装全局 CLI。`stable` 和 `beta` 渠道使用软件包安装。如果 Gateway 网关已经安装，`openclaw update` 会刷新服务元数据并重启它，除非你传入 `--no-restart`。

## 替代方案：重新运行安装器

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。要通过安装器强制指定安装类型，请传入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 软件包安装阶段后失败，请重新运行安装器。安装器不会调用旧版更新器；它会直接运行全局软件包安装，并且可以恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

要将恢复固定到特定版本或 dist-tag，请添加 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

当 `openclaw update` 管理全局 npm 安装时，它会先将目标安装到临时 npm 前缀中，验证打包的 `dist` 清单，然后把干净的软件包树切换到真实的全局前缀中。这样可以避免 npm 将新软件包覆盖到旧软件包的陈旧文件之上。如果安装命令失败，OpenClaw 会使用 `--omit=optional` 重试一次。该重试有助于原生可选依赖无法编译的主机，同时如果回退也失败，仍会显示原始失败。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读软件包树">
    OpenClaw 在运行时将打包的全局安装视为只读，即使当前用户可写入全局软件包目录也是如此。内置插件运行时依赖会被暂存到可写运行时目录，而不是修改软件包树。这样可以防止 `openclaw update` 与正在运行的 Gateway 网关或本地智能体在同一安装过程中修复插件依赖时发生竞争。

    某些 Linux npm 设置会把全局软件包安装在 root 拥有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 通过相同的外部暂存路径支持这种布局。

  </Accordion>
  <Accordion title="加固的 systemd 单元">
    设置一个包含在 `ReadWritePaths` 中的可写暂存目录：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` 也接受路径列表。OpenClaw 会从左到右在列出的根目录中解析内置插件运行时依赖，将较早的根目录视为只读预安装层，并且只安装或修复到最后一个可写根目录中：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    如果未设置 `OPENCLAW_PLUGIN_STAGE_DIR`，OpenClaw 会在 systemd 提供 `$STATE_DIRECTORY` 时使用它，然后回退到 `~/.openclaw/plugin-runtime-deps`。修复步骤会将该暂存位置视为 OpenClaw 拥有的本地软件包根目录，并忽略用户 npm 前缀和全局设置，因此全局安装的 npm 配置不会把内置插件依赖重定向到 `~/node_modules` 或全局软件包树中。

  </Accordion>
  <Accordion title="磁盘空间预检">
    在软件包更新和内置运行时依赖修复之前，OpenClaw 会尽力检查目标卷的磁盘空间。空间不足会产生一条带有已检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷可能会在检查后变化。实际的 npm 安装、复制和安装后验证仍是权威结果。
  </Accordion>
  <Accordion title="内置插件运行时依赖">
    打包安装会让内置插件运行时依赖保持在只读软件包树之外。在启动期间以及 `openclaw doctor --fix` 期间，OpenClaw 只会为配置中处于活动状态、通过旧版渠道配置处于活动状态，或由其内置清单默认启用的内置插件修复运行时依赖。仅持久化的渠道认证状态不会触发 Gateway 网关启动时的运行时依赖修复。

    显式禁用优先。被禁用的插件或渠道不会仅仅因为它存在于软件包中，就修复其运行时依赖。外部插件和自定义加载路径仍使用 `openclaw plugins install` 或 `openclaw plugins update`。

  </Accordion>
</AccordionGroup>

## 自动更新器

自动更新器默认关闭。请在 `~/.openclaw/openclaw.json` 中启用它：

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

| 渠道     | 行为                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 范围内使用确定性抖动应用（分散式发布）。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 检查一次（默认：每小时），并立即应用。                              |
| `dev`    | 不自动应用。请手动使用 `openclaw update`。                                                           |

Gateway 网关还会在启动时记录一条更新提示（可用 `update.checkOnStart: false` 禁用）。对于降级或事故恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，以阻止自动应用，即使已配置 `update.auto.enabled`。除非也禁用了 `update.checkOnStart`，否则启动更新提示仍可运行。

通过实时 Gateway 网关控制平面处理器请求的软件包管理器更新，会在软件包切换后强制执行一次不延迟、无冷却的更新重启。这样可以避免旧的内存中进程停留太久，从已经被替换的软件包树中延迟加载分块。对于受监督的安装，shell `openclaw update` 仍是首选路径，因为它可以在更新前后停止并重启服务。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略，并检查 Gateway 网关健康状态。详情：[Doctor](/zh-CN/gateway/doctor)

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

<Tip>
`npm view openclaw version` 会显示当前已发布版本。
</Tip>

### 固定提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

要返回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor`，并仔细阅读输出。
- 对源码检出上的 `openclaw update --channel dev`，更新器会在需要时自动引导 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排除](/zh-CN/gateway/troubleshooting)
- 在 Discord 中提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [安装概览](/zh-CN/install)：所有安装方法。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主要版本迁移指南。
