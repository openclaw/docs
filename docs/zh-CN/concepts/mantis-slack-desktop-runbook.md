---
read_when:
    - 从 GitHub 或本地运行 Mantis Slack 桌面 QA
    - 调试缓慢的 Mantis Slack 桌面运行
    - 选择源码、预水合或暖租约模式
    - 向 PR 发布截图和视频证据
summary: Mantis Slack 桌面 QA 的操作员运行手册：GitHub dispatch、本地 CLI、预热 VNC 租约、注入模式、时序解读、产物和故障处理。
title: Mantis Slack 桌面端运行手册
x-i18n:
    generated_at: "2026-07-05T11:13:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是用于 Slack 类 bug 的真实 UI 测试通道，这些 bug 需要
Linux 桌面、VNC 救援、Slack Web、真实的 OpenClaw Gateway 网关、截图、
视频和 PR 证据评论。当单元测试或无头 Slack live 测试通道无法证明该 bug 时使用它。

## 存储模型

Mantis 使用三层存储：

- **提供商镜像** - 由 Crabbox 拥有，存储在云提供商账户中。
  保存机器能力（Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生构建工具）和空缓存目录。
- **暖租约状态** - 由当前操作员会话拥有。可在租约存活期间保存
  已登录的浏览器配置文件、`/var/cache/crabbox/pnpm` 和已准备好的源代码
  检出。
- **Mantis 构件** - 由 OpenClaw 运行拥有。位于
  `.artifacts/qa-e2e/mantis/...`；GitHub Actions 会上传它们，Mantis
  GitHub App 会在 PR 上以内联方式评论证据。

绝不要把密钥、浏览器 cookie、Slack 登录状态、仓库检出、
`node_modules` 或 `dist/` 烘焙进提供商镜像。

## GitHub 派发

从 `main` 运行 workflow：

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

`candidate_ref` 受到限制，因为该 workflow 使用 live 凭证：它必须解析为当前
`main` 祖先、发布标签，或 `openclaw/openclaw` 中打开的 PR head。

该 workflow 会生成：

- 上传的构件 `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- 来自 Mantis GitHub App 的内联 PR 评论
- `slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`、`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`、`mantis-slack-desktop-smoke-report.md`
- 远程日志：`slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log`

PR 评论会通过隐藏的 `<!-- mantis-slack-desktop-smoke -->` 标记原地更新。

## 本地 CLI

冷源代码证明：

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

保留 VM 用于 VNC 救援：

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

复用暖租约：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

仅当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用
`--hydrate-mode prehydrated`；否则 Mantis 会保守失败。

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

`--approval-checkpoints` 与 `--gateway-setup` 互斥。除非你传入显式的
approval-checkpoint `--scenario`，否则它会运行选择启用的
`slack-approval-exec-native` 和 `slack-approval-plugin-native` 场景；其他
Slack 场景会在 VM 启动前被拒绝。Slack QA runner 会根据它观察到的真实
Slack API 消息写入每个 checkpoint JSON 文件，然后远程 watcher 会将该消息渲染为
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`。如果任何 checkpoint JSON、消息证据、ack JSON
或渲染截图缺失或为空，本次运行会失败。

冷 GitHub Actions 租约没有 Slack Web cookie，因此它们的浏览器捕获可能落在
Slack 登录屏幕上。对于 approval-checkpoint 证明，请信任渲染的 checkpoint
图片和 Slack QA 构件，而不是 `slack-desktop-smoke.png`。只有当浏览器截图本身必须显示
Slack Web 时，才使用保留的、带手动登录 Slack Web 配置文件的暖租约。

## 准备模式

| 模式          | 使用场景                                  | 远程行为                                                                       | 取舍                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 常规 PR 证明、冷机器、CI        | 在 VM 内运行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但源代码检出证明最强                 |
| `prehydrated` | 你有意准备了一个复用租约 | 要求已有 `node_modules` 和 `dist/`；跳过安装/构建                     | 快，但只适用于操作员控制的暖租约 |

GitHub Actions 总是在 VM 运行前准备候选检出。它的 pnpm store 会按操作系统、
Node 版本和 lockfile 缓存。VM 的 `source` 运行也会在存在时复用
`/var/cache/crabbox/pnpm`。

## 耗时解读

`mantis-slack-desktop-smoke-report.md` 包含阶段耗时：

- `crabbox.warmup` - 云提供商启动、桌面/浏览器就绪、SSH。
- `crabbox.inspect` - 租约元数据查找。
- `credentials.prepare` - Convex 凭证租约获取。
- `crabbox.remote_run` - 同步、浏览器启动、OpenClaw 安装/构建或
  准备验证、Gateway 网关启动、截图和视频捕获。
- `artifacts.copy` - 从 VM 通过 rsync 拷回。

当 Crabbox 返回非零远程状态，但 Mantis 已复制元数据证明 OpenClaw Gateway 网关
设置已完成或 Slack QA 命令本身已成功退出时，`crabbox.remote_run` 可能显示
`accepted`。将 `accepted` 视为带解释的通过，而不是失败场景。

如果运行缓慢：

- 预热占主导：预先烘焙或推广更好的 Crabbox 提供商镜像。
- `source` 中的 `remote_run` 占主导：使用暖租约、改进 pnpm store 复用，
  或把机器先决条件移入提供商镜像。
- `prehydrated` 中的 `remote_run` 占主导：远程工作区实际上尚未就绪，
  或 Gateway 网关/浏览器/Slack 设置很慢。
- 构件拷贝占主导：检查视频大小和构件目录内容。

## 证据清单

一条好的 PR 评论会显示：

- 场景 ID 和候选 SHA
- GitHub Actions 运行 URL 和构件 URL
- 内联 approval-checkpoint 截图，或来自已登录暖租约的 Slack Web 截图
- 可用时的内联动画预览
- 完整 MP4 和裁剪 MP4 链接
- 通过/失败状态和报告的耗时摘要

不要把截图或视频提交进仓库。将它们保留在 GitHub Actions 构件或 PR 评论中。

## 失败处理

如果 workflow 在 VM 运行前失败，请先检查 Actions job。
典型原因：不受信任的 `candidate_ref`、缺少环境密钥，或候选安装/构建失败。

如果 VM 运行失败但截图已拷回，请检查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果运行保留了租约，请使用报告中的 `crabbox vnc ...` 命令打开 VNC，
完成后停止租约：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登录已过期，请在保留租约的 VNC 中修复它，然后使用
`--lease-id` 重新运行。不要把该浏览器配置文件烘焙进提供商镜像。

## 相关

- [QA overview](/zh-CN/concepts/qa-e2e-automation)
- [Slack 渠道](/zh-CN/channels/slack)
- [测试](/zh-CN/help/testing)
