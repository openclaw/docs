---
read_when:
    - 从 GitHub 或本地运行 Mantis Slack 桌面端 QA
    - 调试缓慢的 Mantis Slack 桌面端运行任务
    - 选择源码、预水合或热租约模式
    - 将截图和视频证据发布到 PR 中
summary: Mantis Slack 桌面端 QA 操作员运行手册：GitHub 调度、本地 CLI、预热 VNC 租约、注入模式、耗时解读、产物和故障处理。
title: Mantis Slack 桌面端运行手册
x-i18n:
    generated_at: "2026-07-11T20:27:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是面向 Slack 类错误的真实 UI 测试通道，适用于需要 Linux 桌面、VNC 救援、Slack Web、真实 OpenClaw Gateway 网关、截图、视频以及 PR 证据评论的情况。当单元测试或无头 Slack 实时测试通道无法证明错误时，请使用它。

## 存储模型

Mantis 使用三层存储：

- **提供商镜像** - 由 Crabbox 所有，存储在云提供商账户中。包含计算机能力（Chrome/Chromium、ffmpeg、scrot、Node/corepack/pnpm、原生构建工具）和空的缓存目录。
- **预热租约状态** - 由当前操作员会话所有。租约存续期间，可包含已登录的浏览器配置文件、`/var/cache/crabbox/pnpm` 和准备好的源代码检出。
- **Mantis 制品** - 由 OpenClaw 运行所有。位于 `.artifacts/qa-e2e/mantis/...` 下；GitHub Actions 会上传这些制品，Mantis GitHub App 则会在 PR 上评论内嵌证据。

绝不要将密钥、浏览器 Cookie、Slack 登录状态、仓库检出、`node_modules` 或 `dist/` 烘焙进提供商镜像。

## GitHub 调度

从 `main` 运行工作流：

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

由于工作流使用实时凭据，`candidate_ref` 受到限制：它必须解析为当前 `main` 的祖先提交、发布标签，或 `openclaw/openclaw` 中开放 PR 的头部提交。

工作流会生成：

- 已上传的制品 `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- Mantis GitHub App 发布的内嵌 PR 评论
- `slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`、`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`、`mantis-slack-desktop-smoke-report.md`
- 远程日志：`slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log`

PR 评论通过隐藏标记 `<!-- mantis-slack-desktop-smoke -->` 原地更新。

## 本地 CLI

冷启动源代码证明：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

保留虚拟机以便进行 VNC 救援：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

打开 VNC：

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

复用预热租约：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

仅当复用的远程工作区已包含 `node_modules` 和构建完成的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；否则 Mantis 会采取失败关闭策略。

证明原生 Slack 审批 UI：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` 与 `--gateway-setup` 互斥。除非你通过 `--scenario` 显式指定审批检查点场景，否则它会运行选择启用的 `slack-approval-exec-native` 和 `slack-approval-plugin-native` 场景；其他 Slack 场景会在虚拟机启动前被拒绝。Slack QA 运行器会根据其观察到的真实 Slack API 消息写入每个检查点 JSON 文件，随后远程监视器将该消息渲染为 `approval-checkpoints/<scenario>-pending.png` 和 `approval-checkpoints/<scenario>-resolved.png`。如果任何检查点 JSON、消息证据、确认 JSON 或渲染后的截图缺失或为空，运行就会失败。

冷启动 GitHub Actions 租约没有 Slack Web Cookie，因此其浏览器捕获可能停留在 Slack 登录屏幕。对于审批检查点证明，应信任渲染后的检查点图像和 Slack QA 制品，而不是 `slack-desktop-smoke.png`。仅当浏览器截图本身必须显示 Slack Web 时，才使用保留的预热租约，并手动登录 Slack Web 配置文件。

## 准备模式

| 模式          | 适用情况                                  | 远程行为                                                                       | 权衡                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 常规 PR 证明、冷启动计算机、CI        | 在虚拟机内运行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但源代码检出证明最有力                 |
| `prehydrated` | 你有意准备了一个复用租约 | 要求已有 `node_modules` 和 `dist/`；跳过安装和构建                     | 速度快，但仅对操作员控制的预热租约有效 |

GitHub Actions 始终会在虚拟机运行前准备候选代码检出。其 pnpm 存储按操作系统、Node 版本和锁文件进行缓存。虚拟机的 `source` 运行也会在 `/var/cache/crabbox/pnpm` 存在时复用它。

## 时间解读

`mantis-slack-desktop-smoke-report.md` 包含各阶段耗时：

- `crabbox.warmup` - 云提供商启动、桌面/浏览器就绪、SSH。
- `crabbox.inspect` - 租约元数据查询。
- `credentials.prepare` - 获取 Convex 凭据租约。
- `crabbox.remote_run` - 同步、启动浏览器、安装/构建 OpenClaw 或验证准备状态、启动 Gateway 网关、截取屏幕截图和录制视频。
- `artifacts.copy` - 通过 rsync 从虚拟机复制回来。

当 Crabbox 返回非零远程状态，但 Mantis 已复制到元数据，证明 OpenClaw Gateway 网关设置已完成或 Slack QA 命令本身已成功退出时，`crabbox.remote_run` 可能显示 `accepted`。应将 `accepted` 视为附带说明的通过，而不是场景失败。

如果运行缓慢：

- 预热占用时间最多：预烘焙或提升更好的 Crabbox 提供商镜像。
- 在 `source` 模式下 `remote_run` 占用时间最多：使用预热租约、改进 pnpm 存储复用，或将计算机先决条件移入提供商镜像。
- 在 `prehydrated` 模式下 `remote_run` 占用时间最多：远程工作区实际上尚未就绪，或者 Gateway 网关/浏览器/Slack 设置缓慢。
- 制品复制占用时间最多：检查视频大小和制品目录内容。

## 证据检查清单

良好的 PR 评论应显示：

- 场景 ID 和候选 SHA
- GitHub Actions 运行 URL 和制品 URL
- 内嵌审批检查点截图，或来自已登录预热租约的 Slack Web 截图
- 可用时提供内嵌动画预览
- 完整 MP4 和裁剪后 MP4 的链接
- 通过/失败状态以及报告中的耗时摘要

不要将截图或视频提交到仓库。请将它们保存在 GitHub Actions 制品或 PR 评论中。

## 失败处理

如果工作流在虚拟机运行前失败，请先检查 Actions 作业。常见原因包括：不受信任的 `candidate_ref`、缺少环境密钥，或候选项安装/构建失败。

如果虚拟机运行失败，但截图已复制回来，请检查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果运行保留了租约，请使用报告中的 `crabbox vnc ...` 命令打开 VNC，完成后停止租约：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登录已过期，请在保留租约的 VNC 中修复，然后使用 `--lease-id` 重新运行。不要将该浏览器配置文件烘焙进提供商镜像。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation)
- [Slack 渠道](/zh-CN/channels/slack)
- [测试](/zh-CN/help/testing)
