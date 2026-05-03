---
read_when:
    - 你想安全地更新源代码检出副本
    - 你需要了解 `--update` 的简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源代码更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-05-03T16:59:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 767f3902877209f3945f50f7f8bd6ec7650a708685f1c4008d4191dc00eb1774
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的包管理器更新会先验证重启后的服务报告预期的已更新版本，然后命令才会成功。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划的更新操作（渠道/tag/目标/重启流程），不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括在更新后插件同步期间检测到 npm 插件产物漂移时的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1800s）。
- `--yes`：跳过确认提示（例如降级确认）。

<Warning>
降级需要确认，因为旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前更新渠道 + git tag/分支/SHA（用于源码检出），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3s）。

## `update wizard`

交互式流程，用于选择更新渠道，并确认更新后是否重启 Gateway 网关（默认重启）。如果你选择 `dev` 但没有 git 检出，它会提供创建一个检出的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 还会保持安装方式一致：

- `dev` → 确保存在 git 检出（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或比当前稳定版更旧时，回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理程序之外启动 CLI 更新路径。控制平面 `update.run` 包管理器更新会在包替换后强制执行非延迟、无冷却的更新重启，因为旧 Gateway 网关进程可能仍然在内存中保留指向新包已删除文件的 chunk。

对于包管理器安装，`openclaw update` 会在调用包管理器之前解析目标包版本。npm 全局安装使用暂存式安装：OpenClaw 将新包安装到临时 npm prefix，验证那里的打包 `dist` 清单，然后将该干净的包树替换到真正的全局 prefix 中。如果验证失败，更新后的 doctor、插件同步和重启工作不会从可疑树中运行。即使已安装版本已经匹配目标，命令也会刷新全局包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的 sidecar 和渠道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时将完整的插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

当安装了本地托管的 Gateway 网关服务并且启用了重启时，包管理器更新会在替换包树之前停止正在运行的服务，然后从更新后的安装刷新服务元数据，重启服务，并在报告成功之前验证重启后的 Gateway 网关报告预期版本。在 macOS 上，更新后检查还会验证 LaunchAgent 是否已为当前配置文件加载/运行，以及配置的 loopback 端口是否健康。如果 plist 已安装但 launchd 没有监管它，OpenClaw 会自动重新 bootstrap 并 kickstart LaunchAgent，然后重新运行健康/版本/渠道就绪检查。如果 Gateway 网关仍未变为健康状态，命令会以非零状态退出，并打印重启日志路径以及明确的重启、重新安装和包回滚说明。使用 `--no-restart` 时，包替换仍会运行，但托管服务不会停止或重启，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你手动重启它。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非 beta tag，然后构建并运行 doctor。
- `beta`：优先使用最新的 `-beta` tag，但当 beta 缺失或更旧时回退到最新稳定版 tag。
- `dev`：检出 `main`，然后 fetch 并 rebase。

### 更新步骤

<Steps>
  <Step title="验证干净的工作树">
    要求没有未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（tag 或分支）。
  </Step>
  <Step title="获取上游">
    仅限 dev。
  </Step>
  <Step title="预检构建（仅限 dev）">
    在临时工作树中运行 lint 和 TypeScript 构建。如果 tip 失败，会向前回退最多 10 个提交，以找到最新的干净构建。
  </Step>
  <Step title="Rebase">
    Rebase 到所选提交（仅限 dev）。
  </Step>
  <Step title="安装依赖">
    使用仓库包管理器。对于 pnpm 检出，更新器会按需 bootstrap `pnpm`（先通过 `corepack`，再回退到临时 `npm install pnpm@10`），而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="构建控制 UI">
    构建 Gateway 网关和控制 UI。
  </Step>
  <Step title="运行 doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到当前渠道。Dev 使用内置插件；stable 和 beta 使用 npm。更新被跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新渠道上，跟随默认/latest 线路的已跟踪 npm 和 ClawHub 插件安装会先尝试插件 `@beta` 发布。如果插件没有 beta 发布，OpenClaw 会回退到记录的默认/latest spec。精确版本和显式 tag 不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的产物完整性与存储的安装记录不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在验证你信任新产物之后，才应显式重新安装或更新该插件。
</Warning>

<Note>
更新后插件同步失败会使更新结果失败，并停止后续重启工作。修复插件安装或更新错误后，再重新运行 `openclaw update`。

当更新后的 Gateway 网关启动时，插件加载仅执行验证：启动不会运行包管理器，也不会改变依赖树。包管理器 `update.run` 重启会在包树被替换后绕过正常的空闲延迟和重启冷却，因此旧进程无法继续懒加载已删除的 chunk。

如果 pnpm bootstrap 仍然失败，更新器会提前停止并给出包管理器特定错误，而不是尝试在检出中运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出上会提供先运行更新的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
