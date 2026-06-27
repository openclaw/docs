---
read_when:
    - 更新 OpenClaw
    - 更新后出现问题
summary: 安全更新 OpenClaw（全局安装或源码安装），以及回滚策略
title: 更新中
x-i18n:
    generated_at: "2026-06-27T02:20:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

让 OpenClaw 保持最新。

## 推荐：`openclaw update`

最快的更新方式。它会检测你的安装类型（npm 或 git）、获取最新版本、运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

要切换频道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` 不接受 `--verbose`。如需更新诊断，请使用
`--dry-run` 预览计划执行的操作，使用 `--json` 获取结构化结果，或使用
`openclaw update status --json` 检查频道和可用性状态。安装器有自己的
`--verbose` 标志，但该标志不是 `openclaw update` 的一部分。

`--channel beta` 会优先使用 beta，但当 beta 标签缺失或早于最新稳定版时，
运行时会回退到 stable/latest。如果你想为一次性包更新使用原始 npm beta dist-tag，
请使用 `--tag beta`。

使用 `--channel dev` 可获得持久跟随 GitHub `main` 的检出。对于包更新，
`--tag main` 会在单次运行中映射到 `github:openclaw/openclaw#main`，并且
GitHub/git 源规格会在暂存的 npm 安装前打包进临时 tarball。

对于托管插件，beta 频道回退只是一个警告：核心更新仍可成功，而插件会使用其记录的默认/最新版本，因为没有可用的插件 beta。

请参阅 [开发频道](/zh-CN/install/development-channels) 了解频道语义。

## 在 npm 和 git 安装之间切换

当你想更改安装类型时，请使用频道。更新器会保留你的状态、配置、凭证和 `~/.openclaw` 中的工作区；它只会更改 CLI 和 Gateway 网关使用的 OpenClaw 代码安装。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先使用 `--dry-run` 运行，预览确切的安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 频道会确保使用 git 检出、构建它，并从该检出安装全局 CLI。
`stable` 和 `beta` 频道使用包安装。如果 Gateway 网关已经安装，
`openclaw update` 会刷新服务元数据并重启它，除非你传入 `--no-restart`。

对于带有托管 Gateway 网关服务的包安装，`openclaw update` 会以该服务使用的包根目录为目标。如果 shell 中的 `openclaw` 命令来自不同安装，更新器会打印两个根目录以及托管服务的 Node 路径。包更新会使用拥有服务根目录的包管理器，并在替换包之前检查托管服务的 Node 是否满足目标版本的引擎要求。

## 替代方案：重新运行安装器

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。要通过安装器强制指定安装类型，请传入
`--install-method git --no-onboard` 或
`--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 包安装阶段后失败，请重新运行安装器。安装器不会调用旧更新器；它会直接运行全局包安装，并可恢复部分更新的 npm 安装。

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

对于受监督的安装，优先使用 `openclaw update`，因为它可以协调包替换和正在运行的 Gateway 网关服务。如果你在受监督的安装上手动更新，请在包管理器启动前停止托管的 Gateway 网关。包管理器会就地替换文件，否则正在运行的 Gateway 网关可能会在包树临时处于半替换状态时尝试加载核心或插件文件。包管理器完成后重启 Gateway 网关，以便服务使用新的安装。

对于 root 拥有的 Linux 系统全局安装，如果 `openclaw update` 因 `EACCES` 失败，而你使用系统 npm 恢复，请在手动替换包期间保持 Gateway 网关停止。使用你通常为该 Gateway 网关使用的相同 `openclaw` profile 标志或环境。将 `/usr/bin/npm` 替换为你主机上拥有 root 拥有的全局前缀的系统 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

然后验证服务：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

当 `openclaw update` 管理全局 npm 安装时，它会先将目标安装到临时 npm 前缀中，验证打包的 `dist` 清单，然后将干净的包树替换到真实的全局前缀中。这避免了 npm 将新包覆盖到旧包遗留文件上。如果安装命令失败，OpenClaw 会使用 `--omit=optional` 重试一次。该重试有助于原生可选依赖无法编译的主机，同时如果回退也失败，仍会显示原始失败。

OpenClaw 管理的 npm 更新和插件更新命令还会为子 npm 进程清除 npm
`min-release-age` 隔离。npm 可能会将该策略报告为派生的 `before` 截止时间；两者都对通用供应链隔离策略有用，但显式的 OpenClaw 更新意味着“立即安装选定的 OpenClaw 版本”。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读包树">
    OpenClaw 在运行时将打包的全局安装视为只读，即使当前用户可以写入全局包目录。插件包安装位于用户配置目录下由 OpenClaw 拥有的 npm/git 根目录中，Gateway 网关启动不会修改 OpenClaw 包树。

    某些 Linux npm 设置会将全局包安装到 root 拥有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持这种布局，因为插件安装/更新命令会写入该全局包目录之外的位置。

  </Accordion>
  <Accordion title="加固的 systemd 单元">
    授予 OpenClaw 对其配置/状态根目录的写入权限，以便显式插件安装、插件更新和 Doctor 清理能够持久化其更改：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁盘空间预检">
    在包更新和显式插件安装之前，OpenClaw 会尽力对目标卷进行磁盘空间检查。空间不足会产生包含已检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷可能在检查后发生变化。实际的包管理器安装和安装后验证仍是权威依据。
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

| 频道 | 行为 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 范围内以确定性抖动应用（分散发布）。 |
| `beta` | 每 `betaCheckIntervalHours` 检查一次（默认：每小时），并立即应用。 |
| `dev` | 不会自动应用。请手动使用 `openclaw update`。 |

Gateway 网关还会在启动时记录更新提示（可通过 `update.checkOnStart: false` 禁用）。
对于降级或事件恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，以便即使配置了 `update.auto.enabled` 也阻止自动应用。启动更新提示仍可运行，除非同时禁用 `update.checkOnStart`。

通过实时 Gateway 网关控制平面处理器请求的包管理器更新，不会在正在运行的 Gateway 网关进程内替换包树。在托管服务安装中，Gateway 网关会启动一个分离的交接流程、退出，并让正常的 `openclaw update --yes --json` CLI 路径停止服务、替换包、刷新服务元数据、重启、验证 Gateway 网关版本和可达性，并在可能时恢复已安装但未加载的 macOS LaunchAgent。如果 Gateway 网关无法安全完成该交接，`update.run` 会报告一个安全的 shell 命令，而不是在进程内运行包管理器。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略，并检查 Gateway 健康。详情：[Doctor](/zh-CN/gateway/doctor)

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
- 对于源码检出中的 `openclaw update --channel dev`，更新器会在需要时自动引导 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 检查：[故障排除](/zh-CN/gateway/troubleshooting)
- 在 Discord 中询问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关

- [安装概览](/zh-CN/install)：所有安装方法。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主版本迁移指南。
