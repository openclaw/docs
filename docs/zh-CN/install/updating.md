---
read_when:
    - 更新 OpenClaw
    - 更新后出现故障
summary: 安全更新 OpenClaw（全局安装或源码），以及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-07-06T10:50:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9b71b9d6897b37edd4fd6bdbe8a09e3c9855fd76495fc1d68c76bdc2b5026d
    source_path: install/updating.md
    workflow: 16
---

保持 OpenClaw 为最新版本。

## 推荐：`openclaw update`

检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

切换频道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` 没有 `--verbose` 标志（安装器有）。如需诊断，请使用
`--dry-run` 预览计划执行的操作，使用 `--json` 获取结构化结果，或使用
`openclaw update status --json` 检查频道和可用性状态。

`--channel beta` 优先使用 beta npm dist-tag，但当 beta 标签缺失，或其版本早于最新 stable
发布时，会回退到 stable/latest。若要执行一次性软件包更新并固定到原始 npm
beta dist-tag，请改用 `--tag beta`。

`--channel extended-stable` 仅适用于软件包安装，并且仅以前台方式运行。OpenClaw 会读取
公开 npm `extended-stable` 选择器，验证选中的精确软件包，并安装该精确版本。缺失或不一致的注册表数据会失败关闭；它永远不会回退到 `latest`。如果选中版本早于已安装版本，仍会应用正常的降级确认。
核心替换完成后，符合条件的官方 npm 插件若使用裸/default 或
`latest` 意图，会收敛到该精确核心版本。精确固定和显式的非
`latest` 标签、第三方插件，以及非 npm 来源会保持不变。
由当前 OpenClaw 版本创建的目录安装会保留该默认意图。只包含精确版本的旧记录会继续固定，因为
OpenClaw 无法安全地区分旧的自动固定和用户固定；在 extended-stable 频道上运行一次
`openclaw plugins update @openclaw/name`，即可让该插件重新加入精确核心跟踪。

`--channel dev` 会提供一个持久移动的 GitHub `main` checkout。对于一次性
软件包更新，`--tag main` 会映射到 `github:openclaw/openclaw#main` 软件包
规范，并通过目标软件包管理器（npm/pnpm/bun）直接安装。

对于托管插件，缺失 beta 发布是警告而不是失败：核心更新仍可成功，而插件会回退到其记录的
default/latest 发布。

请参阅 [发布频道](/zh-CN/install/development-channels) 了解频道语义。

## 在 npm 和 git 安装之间切换

使用频道更改安装类型。更新器会保留你的状态、配置、
凭证和 `~/.openclaw` 中的工作区；它只会更改 CLI 和 Gateway 网关使用的 OpenClaw
代码安装。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先预览安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 会确保存在 git checkout，构建它，并从该
checkout 安装全局 CLI。`stable`、`extended-stable` 和 `beta` 频道使用软件包
安装。Extended-stable 会在 git checkout 上被拒绝，且不会修改或
转换它。如果 Gateway 网关已安装，`openclaw update` 会刷新
服务元数据并重启它，除非你传入 `--no-restart`。

对于带有托管 Gateway 网关服务的软件包安装，`openclaw update` 会以该服务使用的
软件包根目录为目标。如果 shell 中的 `openclaw` 命令来自不同安装，更新器会打印两个根目录和托管
服务的 Node 路径，并在替换软件包前，检查该 Node 版本是否满足目标发布的
`engines.node` 要求。

## 替代方式：重新运行安装器

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。若要强制指定安装类型，请传入
`--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 软件包安装阶段之后失败，请改为重新运行
安装器。它不会调用更新器；它会直接运行全局软件包
安装，并可恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 将恢复固定到特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方式：手动 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

对于受监管的安装，优先使用 `openclaw update`：它可以协调软件包
替换与正在运行的 Gateway 网关服务。如果你在受监管安装上手动更新，请先停止托管的 Gateway 网关。软件包管理器会就地替换文件，否则正在运行的 Gateway 网关可能会在替换过程中尝试加载核心或插件文件。软件包管理器完成后重启 Gateway 网关，使其加载新的安装。

对于 root 拥有的 Linux 系统全局安装，如果 `openclaw update` 因
`EACCES` 失败，请在保持 Gateway 网关停止以便手动替换的情况下，使用系统 npm 恢复。使用你通常用于该 Gateway 网关的相同配置文件标志/环境。将 `/usr/bin/npm` 替换为主机上拥有
root 拥有的全局前缀的系统 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

然后验证：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

当 `openclaw update` 管理全局 npm 安装时，它会先将目标安装到临时 npm 前缀中，验证打包的 `dist` 清单，然后
将干净的软件包树替换到真实全局前缀中，从而避免 npm
把新软件包覆盖到旧软件包遗留文件之上。如果安装
命令失败，OpenClaw 会使用 `--omit=optional` 重试一次，这有助于处理原生可选依赖无法编译的主机。

OpenClaw 管理的 npm 更新和插件更新命令还会为子 npm 进程清除 npm 的
`min-release-age` 供应链隔离策略（或较旧的 `before` 配置键）。
该策略用于一般保护，但显式的 OpenClaw 更新表示“立即安装选中的发布”。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw 会在运行时将打包的全局安装视为只读，即使当前用户可写全局软件包目录。插件软件包安装位于用户配置目录下由 OpenClaw 拥有的 npm/git 根目录中，Gateway 网关启动不会修改 OpenClaw 软件包树。

    某些 Linux npm 设置会把全局软件包安装到 root 拥有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持这种布局，因为插件安装/更新命令会写入该全局软件包目录之外。

  </Accordion>
  <Accordion title="Hardened systemd units">
    授予 OpenClaw 对其配置/状态根目录的写入权限，以便显式插件安装、插件更新和 Doctor 清理能够持久保存更改：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    在软件包更新和显式插件安装之前，OpenClaw 会尽力检查目标卷的磁盘空间。空间不足会生成包含已检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷可能在检查后发生变化。实际的软件包管理器安装和安装后验证仍是权威依据。
  </Accordion>
</AccordionGroup>

## 自动更新器

默认关闭。在 `~/.openclaw/openclaw.json` 中启用：

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

| 频道              | 行为                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（默认：6），然后在 `stableJitterHours`（默认：12）范围内使用确定性抖动应用，以实现分散发布。 |
| `extended-stable` | 不执行启动检查或自动应用。请手动使用 `openclaw update` 或 `openclaw update status`。                                             |
| `beta`            | 每隔 `betaCheckIntervalHours`（默认：1）检查一次并立即应用。                                                                  |
| `dev`             | 不自动应用。请手动使用 `openclaw update`。                                                                                          |

Gateway 网关也会在启动时记录更新提示（可通过 `update.checkOnStart: false` 禁用）。
已存储的 extended-stable 选择会完全跳过启动和后台解析。
对于降级或事件恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，即使配置了 `update.auto.enabled` 也会阻止自动应用。除非同时禁用 `update.checkOnStart`，启动更新提示仍可运行。

通过实时 Gateway 网关控制平面
（`update.run`）请求的软件包管理器更新不会替换正在运行的 Gateway 网关
进程内的软件包树。在托管服务安装上，Gateway 网关会启动一个分离的交接流程，
退出，并让正常的 `openclaw update --yes --json` CLI 路径停止
服务、替换软件包、刷新服务元数据、重启、验证
Gateway 网关版本和可达性，并在可能时恢复已安装但未加载的 macOS
LaunchAgent。如果 Gateway 网关无法安全执行该交接，
`update.run` 会报告一个安全的 shell 命令，而不是在进程内运行软件包
管理器。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置，审计私信策略，并检查 Gateway 健康。详情：[Doctor](/zh-CN/gateway/doctor)

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

要回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor`，并仔细阅读输出。
- 对于源码 checkout 上的 `openclaw update --channel dev`，更新器会在需要时自动引导 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排查](/zh-CN/gateway/troubleshooting)
- 在 Discord 提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [安装概览](/zh-CN/install)：所有安装方法。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主版本迁移指南。
