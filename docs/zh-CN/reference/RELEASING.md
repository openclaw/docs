---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏的说明
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T03:28:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b6e0306f07ceec860ad2cce6bd6bb6a6d52fc8a87e9fa7acd3f48b963fb2bcb
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的正式发布，默认发布到 npm `beta`，或在明确指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以显式将目标设为 `latest`，或者稍后再提升一个经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时发布 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，mac 应用的构建 / 签名 / 公证则保留给稳定版，除非明确要求

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 通过验证后，才会跟进稳定版
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布，但之后需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布前预检

- 在发布前预检前运行 `pnpm check:test-types`，这样测试 TypeScript 也能在更快的本地 `pnpm check` 检查之外得到覆盖
- 在发布前预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查也能在更快的本地检查之外保持通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的预期 `dist/*` 发布产物和 Control UI bundle 都已生成
- 当你需要通过一个入口点运行完整的发布验证套件时，在发布审批前运行手动的 `Full Release Validation` 工作流。它接受分支、标签或完整提交 SHA，会分发手动 `CI`，并分发 `OpenClaw Release Checks` 来执行安装冒烟测试、Docker 发布路径套件、live / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。只有在包已经发布且还需要运行发布后的 Telegram E2E 时，才提供 `npm_telegram_package_spec`。
  示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续推进的同时，为某个包候选版本获得旁路验证时，运行手动的 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或某个精确发布版本使用 `source=npm`；使用 `source=ref` 来打包受信任的分支 / 标签 / SHA；对带必填 SHA-256 的 HTTPS tarball 使用 `source=url`；或者对由其他 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可以按需运行已发布 npm 的 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  常见 profile：
  - `smoke`：安装 / channel / 智能体、Gateway 网关网络和配置重载通道
  - `package`：package / update / plugin 通道，不包含 OpenWebUI
  - `product`：package profile 加上 MCP 渠道、cron / subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确的 `docker_lanes` 选择，用于定向重跑
- 当你只需要对发布候选版本进行完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动触发的 CI 会绕过 changed 范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP / HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容 / 标识符脱敏，无需 Opik、Langfuse 或其他外部收集器。
- 在每次打标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 一致性检查，以及 live Matrix 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  分发，它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实的 npm 发布路径保持简短、确定且以产物为中心，同时把较慢的 live 检查放在独立通道中，这样它们就不会拖慢或阻塞发布
- 带有密钥的发布检查应通过 `Full Release Validation` 分发，或从 `main` / release 工作流 ref 分发，以便工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从 OpenClaw 分支或发布标签到达即可
- `OpenClaw NPM Release` 的仅验证预检也接受当前工作流分支提交的完整 40 字符 SHA，而不要求已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都将真实发布和提升路径保留在 GitHub 托管 runner 上，而不改变状态的验证路径则可以使用更大的 Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta / 修正版版本）以在全新临时前缀中验证已发布的 registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E，使用共享租用的 Telegram 凭证池。本地维护者的一次性操作可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中手动的 `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。它有意设计为仅手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用“先预检再提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认目标为 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式将目标设为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以确保安全，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，以避免发布修正静默地让旧的全局安装仍停留在基础稳定版负载上
- npm 发布预检采用默认失败关闭策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的 registry 安装是否在根 `dist/*` 布局下包含非空的内置插件运行时依赖。若某次发布带有缺失或空的内置插件依赖负载，则发布后验证器会失败，并且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 可以在发布路径之前捕获意外的打包膨胀
- 如果发布工作触及了 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查 `.github/workflows/ci.yml` 中由规划器负责的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述了过时的 CI 布局
- 稳定版 macOS 发布就绪性还包括更新器相关界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build floor 的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前工作流分支提交的完整 40 字符 SHA，用于仅验证预检
- `preflight_only`：`true` 表示仅验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径必填，这样工作流可以复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。带密钥的检查要求解析后的提交必须可从 OpenClaw 分支或发布标签到达。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许使用完整提交 SHA 作为输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## 稳定版 npm 发布顺序

当切一个稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚未存在之前，你可以使用当前工作流分支提交的完整 SHA，对预检工作流进行一次仅验证的演练
2. 常规的 beta 优先流程选择 `npm_dist_tag=beta`，只有在你有意直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，同时使用相同的 `tag`、相同的 `npm_dist_tag` 以及已保存的 `preflight_run_id`
7. 如果该发布落在 `beta`，使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果该发布是有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个稳定构建，则使用同一个私有工作流让两个 dist-tag 都指向该稳定版本，或者让其计划任务的自我修复同步稍后再移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既记录了直接发布路径，也记录了 beta 优先提升路径，并且两者对操作人员都是可见的。

如果维护者必须回退到本地 npm 身份验证，只能在专用 tmux 会话内运行任何 1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其限制在 tmux 内可以让提示、告警和 OTP 处理保持可观察，并防止主机重复弹出告警。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际操作手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
