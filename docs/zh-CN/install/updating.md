---
read_when:
    - 更新 OpenClaw
    - 更新后出现问题
summary: 安全更新 OpenClaw（全局安装或源码安装），以及回滚策略
title: 更新中
x-i18n:
    generated_at: "2026-04-27T14:31:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 15
---

让 OpenClaw 保持最新。

## 推荐：`openclaw update`

这是最快的更新方式。它会检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

如需切换通道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 仅预览，不实际应用
```

`--channel beta` 会优先选择 beta，但当 beta 标签缺失或版本比最新 stable 发布版更旧时，运行时会回退到 stable/latest。如果你想进行一次性的包更新并使用原始的 npm beta dist-tag，请使用 `--tag beta`。

通道语义请参阅 [Development channels](/zh-CN/install/development-channels)。

## 在 npm 安装和 git 安装之间切换

当你想更改安装类型时，请使用通道。更新器会保留你在 `~/.openclaw` 中的状态、配置、凭证和工作区；它只会更改 CLI 和 Gateway 网关所使用的 OpenClaw 代码安装方式。

```bash
# npm 包安装 -> 可编辑 git 检出
openclaw update --channel dev

# git 检出 -> npm 包安装
openclaw update --channel stable
```

先使用 `--dry-run` 预览确切的安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 通道会确保存在一个 git 检出，对其进行构建，并从该检出安装全局 CLI。`stable` 和 `beta` 通道使用包安装。如果 Gateway 网关已经安装，`openclaw update` 会刷新服务元数据并重启它，除非你传入 `--no-restart`。

## 另一种方式：重新运行安装脚本

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。如需通过安装器强制指定安装类型，传入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 包安装阶段之后失败，请重新运行安装器。安装器不会调用旧的更新器；它会直接运行全局包安装，因此可以恢复部分更新失败的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

如需将恢复固定到特定版本或 dist-tag，请添加 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 另一种方式：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

当 `openclaw update` 管理全局 npm 安装时，它会先将目标版本安装到一个临时 npm prefix 中，验证已打包的 `dist` 清单，然后再将干净的包树替换到真实的全局 prefix 中。这样可以避免 npm 把新包覆盖到旧包遗留文件之上。如果安装命令失败，OpenClaw 会使用 `--omit=optional` 重试一次。这个重试有助于处理那些无法编译原生可选依赖的主机，同时如果回退方案也失败，仍会保留原始失败信息。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读包树">
    OpenClaw 在运行时会将已打包的全局安装视为只读，即使当前用户对全局包目录有写权限也是如此。内置插件的运行时依赖会暂存到一个可写的运行时目录，而不是修改包树本身。这样可以避免在同一次安装期间，`openclaw update` 与正在修复插件依赖的运行中 Gateway 网关或本地智能体发生竞争。

    某些 Linux npm 配置会将全局包安装到 root 拥有的目录中，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 通过同样的外部暂存路径支持这种布局。

  </Accordion>
  <Accordion title="加固的 systemd 单元">
    设置一个包含在 `ReadWritePaths` 中的可写暂存目录：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` 也接受路径列表。OpenClaw 会按照从左到右的顺序在列出的根路径中解析内置插件运行时依赖，将较前面的根视为只读的预安装层，并且只在最后一个可写根中进行安装或修复：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    如果未设置 `OPENCLAW_PLUGIN_STAGE_DIR`，当 systemd 提供 `$STATE_DIRECTORY` 时，OpenClaw 会使用它；否则回退到 `~/.openclaw/plugin-runtime-deps`。修复步骤会将该暂存区视为一个由 OpenClaw 拥有的本地包根目录，并忽略用户的 npm prefix 和全局设置，因此全局安装的 npm 配置不会将内置插件依赖重定向到 `~/node_modules` 或全局包树中。

  </Accordion>
  <Accordion title="磁盘空间预检">
    在包更新和内置运行时依赖修复之前，OpenClaw 会尽力对目标卷执行磁盘空间检查。空间不足会生成一条警告，其中包含被检查的路径，但不会阻止更新，因为文件系统配额、快照和网络卷可能会在检查后发生变化。实际的 npm 安装、复制和安装后验证仍然是最终依据。
  </Accordion>
  <Accordion title="内置插件运行时依赖">
    已打包安装会将内置插件运行时依赖保留在只读包树之外。在启动时以及执行 `openclaw doctor --fix` 期间，OpenClaw 只会为以下内置插件修复运行时依赖：在配置中处于活跃状态、通过旧版渠道配置处于活跃状态，或由其内置清单默认启用的插件。仅有持久化的渠道认证状态，并不会触发 Gateway 网关启动时的运行时依赖修复。

    显式禁用具有最高优先级。被禁用的插件或渠道不会仅因为存在于包中就修复其运行时依赖。外部插件和自定义加载路径仍然使用 `openclaw plugins install` 或 `openclaw plugins update`。

  </Accordion>
</AccordionGroup>

## 自动更新器

自动更新器默认关闭。请在 `~/.openclaw/openclaw.json` 中启用：

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

| Channel  | 行为 |
| -------- | ---- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 范围内按确定性抖动应用（分散发布）。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 检查一次（默认：每小时），并立即应用。 |
| `dev`    | 不自动应用。请手动使用 `openclaw update`。 |

Gateway 网关也会在启动时记录更新提示（可使用 `update.checkOnStart: false` 禁用）。
如需降级或进行事故恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已配置 `update.auto.enabled`，也能阻止自动应用。除非同时禁用 `update.checkOnStart`，否则启动时的更新提示仍可能运行。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略并检查 Gateway 网关健康状态。详情请参阅：[Doctor](/zh-CN/gateway/doctor)

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
`npm view openclaw version` 会显示当前已发布的版本。
</Tip>

### 固定提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

如需回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor`，并仔细阅读输出内容。
- 对于源码检出的 `openclaw update --channel dev`，更新器会在需要时自动引导安装 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排除](/zh-CN/gateway/troubleshooting)
- 在 Discord 中提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [Install overview](/zh-CN/install)：所有安装方式。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主要版本迁移指南。
