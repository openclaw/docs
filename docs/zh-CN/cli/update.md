---
read_when:
    - 你想安全地更新源码检出副本
    - 你需要了解 `--update` 的简写行为
summary: CLI 参考：`openclaw update`（相对安全的源更新 + Gateway 网关自动重启）
title: 更新
x-i18n:
    generated_at: "2026-05-01T08:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfbbd6e3cd1a83e3700fa248a6ce2cb3adf1c94d0d5491895eea21bfec5d52b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的软件包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`: 成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的软件包管理器更新会在命令成功前，验证重启后的服务报告预期的已更新版本。
- `--channel <stable|beta|dev>`: 设置更新渠道（git + npm；持久化到配置中）。
- `--tag <dist-tag|version|spec>`: 仅为本次更新覆盖软件包目标。对于软件包安装，`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`: 预览计划的更新操作（渠道/tag/目标/重启流程），不写入配置、不安装、不同步插件，也不重启。
- `--json`: 打印机器可读的 `UpdateRunResult` JSON，包括在更新后插件同步期间检测到 npm 插件构件漂移时的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`: 每个步骤的超时时间（默认是 1800 秒）。
- `--yes`: 跳过确认提示（例如降级确认）。

<Warning>
降级需要确认，因为较旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前更新渠道 + git tag/branch/SHA（用于源码检出），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`: 打印机器可读的状态 JSON。
- `--timeout <seconds>`: 检查超时时间（默认是 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道，并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你选择 `dev` 但没有 git 检出，它会提示创建一个。

选项：

- `--timeout <seconds>`: 每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持
安装方式一致：

- `dev` → 确保存在 git 检出（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或早于当前稳定版本时，
  回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理程序之外启动 CLI 更新路径。控制平面的 `update.run` 软件包管理器更新会在软件包替换后强制执行非延迟、无冷却的更新重启，因为旧 Gateway 网关进程内存中可能仍有指向新软件包已删除文件的分块。

对于软件包管理器安装，`openclaw update` 会先解析目标软件包
版本，再调用软件包管理器。npm 全局安装使用分阶段
安装：OpenClaw 将新软件包安装到临时 npm 前缀中，在那里验证
打包的 `dist` 清单，然后把这棵干净的软件包树替换到
真实的全局前缀中。如果验证失败，更新后 Doctor、插件同步和
重启工作都不会从可疑的软件包树运行。即使已安装版本
已经匹配目标，命令也会刷新全局软件包安装，
然后运行插件同步、核心命令补全刷新和重启工作。这
会让打包的 sidecar 和渠道拥有的插件记录与已安装的
OpenClaw 构建保持一致，同时将完整的插件命令补全重建留给
显式的 `openclaw completion --write-state` 运行。

当已安装本地托管的 Gateway 网关服务且启用重启时，
软件包管理器更新会在替换软件包树前停止正在运行的服务，
然后从更新后的安装刷新服务元数据，重启
服务，并验证重启后的 Gateway 网关报告预期版本。使用
`--no-restart` 时，仍会执行软件包替换，但不会停止或重启
托管服务，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你
手动重启它。

## Git 检出流程

### 渠道选择

- `stable`: 检出最新的非 beta tag，然后构建并运行 Doctor。
- `beta`: 优先使用最新的 `-beta` tag，但当 beta 缺失或更旧时回退到最新稳定 tag。
- `dev`: 检出 `main`，然后 fetch 并 rebase。

### 更新步骤

<Steps>
  <Step title="Verify clean worktree">
    要求没有未提交的更改。
  </Step>
  <Step title="Switch channel">
    切换到所选渠道（tag 或 branch）。
  </Step>
  <Step title="Fetch upstream">
    仅 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在临时 worktree 中运行 lint 和 TypeScript 构建。如果 tip 失败，会最多向前回退 10 个 commit，以找到最新的干净构建。
  </Step>
  <Step title="Rebase">
    Rebase 到所选 commit（仅 dev）。
  </Step>
  <Step title="Install dependencies">
    使用仓库的软件包管理器。对于 pnpm 检出，更新器会按需引导 `pnpm`（先通过 `corepack`，然后回退到临时的 `npm install pnpm@10`），而不是在 pnpm workspace 内运行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    构建 gateway 和 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="Sync plugins">
    将插件同步到当前渠道。Dev 使用内置插件；stable 和 beta 使用 npm。更新通过 npm 安装的插件。
  </Step>
</Steps>

<Warning>
如果精确固定的 npm 插件更新解析到某个构件，而该构件的完整性与已存储的安装记录不同，`openclaw update` 会中止该插件构件更新，而不是安装它。只有在验证你信任新构件后，才显式重新安装或更新该插件。
</Warning>

<Note>
更新后插件同步失败会使更新结果失败，并停止后续重启工作。修复插件安装或更新错误，然后重新运行 `openclaw update`。

当更新后的 Gateway 网关启动时，已启用的内置插件运行时依赖会在插件激活前暂存。软件包管理器 `update.run` 重启会在软件包树替换后绕过常规空闲延迟和重启冷却，因此旧进程不能继续延迟加载已删除的分块。服务管理器重启仍会在关闭 Gateway 网关前耗尽运行时依赖暂存。

如果 pnpm 引导仍然失败，更新器会提前停止并报告软件包管理器专用错误，而不是尝试在检出中运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本很有用）。

## 相关

- `openclaw doctor`（在 git 检出上会提示先运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
