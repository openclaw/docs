---
read_when:
    - 正在查找公开发布渠道定义
    - 正在查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-24T06:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的最新移动头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升为正式的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作人员可以明确指定目标为 `latest`，或者稍后再提升经过验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而 mac 应用的构建/签名/公证除非明确要求，否则保留给稳定版

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 验证通过后，才会跟进稳定版
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后需要修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布前检查

- 在发布前检查前运行 `pnpm check:test-types`，这样测试 TypeScript 仍会被覆盖，
  不会遗漏在更快的本地 `pnpm check` 检查之外
- 在发布前检查前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会保持绿色，
  不会遗漏在更快的本地检查之外
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样预期的
  `dist/*` 发布产物和 Control UI 打包结果会存在，供 pack
  验证步骤使用
- 每次带标签发布前都运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab 模拟一致性检查，以及实时的
  Matrix 和 Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  发起，它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、
  可预测，并且聚焦产物；同时把较慢的实时检查放在它们自己的通道中，
  这样它们就不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用或
  `release/YYYY.M.D` 工作流引用发起，这样工作流逻辑和密钥才能保持受控
- 该工作流接受已有的发布标签，或当前工作流分支完整的
  40 字符提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支的 HEAD；较旧的发布提交请使用
  发布标签
- `OpenClaw NPM Release` 的仅验证前检查也接受当前工作流分支完整的
  40 字符提交 SHA，而不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，该工作流只为包元数据检查合成
  `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都将真实发布和提升路径保留在 GitHub 托管的
  runner 上，而非变更型验证路径则可以使用更大的
  Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布前检查不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），在全新的临时前缀中验证已发布的注册表
  安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以验证已安装包的新手引导、Telegram 设置，以及针对已发布 npm 包的真实 Telegram 端到端流程，
  并使用共享租赁的 Telegram 凭证池。本地维护者的一次性检查可以省略 Convex 变量，
  直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中手动触发的
  `NPM Telegram Beta E2E` 工作流运行同样的发布后检查。它有意只支持手动触发，
  不会在每次合并时运行。
- 维护者发布自动化现在采用“先前检查后提升”：
  - 真正的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真正的 npm 发布必须从与成功前检查运行相同的 `main` 或
    `release/YYYY.M.D` 分支发起
  - 稳定版 npm 发布默认目标为 `beta`
  - 稳定版 npm 发布可以通过工作流输入明确指定目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库
    保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真正的发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器
  还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，
  这样发布修正就不会悄悄让旧的全局安装仍停留在基础稳定版载荷上
- npm 发布前检查会以默认拒绝方式失败，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，
  这样我们就不会再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布的注册表安装中，根级 `dist/*`
  布局下是否包含非空的内置插件运行时依赖。若某个发布带有缺失或为空的内置插件
  依赖载荷，则发布后验证器会失败，且该版本不能被提升
  到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，
  这样安装器端到端流程就能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展计时清单或
  扩展测试矩阵，请在审批前重新生成并审查由规划器负责的
  `.github/workflows/ci.yml` 中 `checks-node-extensions` 工作流矩阵输出，
  这样发布说明就不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，并且 `CFBundleVersion` 至少达到该发布版本对应的规范 Sparkle 构建下限

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  工作流分支完整的 40 字符提交 SHA，用于仅验证的前检查
- `preflight_only`：`true` 表示只做验证/构建/打包，`false` 表示走
  真实发布路径
- `preflight_run_id`：真实发布路径必填，这样工作流才能复用成功前检查运行中
  准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认是 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：已有发布标签，或从 `main` 发起时当前完整的 40 字符 `main` 提交
  SHA；若从发布分支发起，请使用已有发布标签或当前完整的 40 字符
  发布分支提交 SHA

规则：

- 稳定版和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 始终只用于验证，并且也接受
  当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式还要求必须是当前工作流分支的 HEAD
- 真正的发布路径必须使用与前检查相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

切稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的工作流分支提交
     SHA，对前检查工作流进行一次仅验证的演练
2. 正常的先 beta 后正式流程请选择 `npm_dist_tag=beta`，只有在你明确想直接发布稳定版时
   才选择 `latest`
3. 使用相同标签单独运行 `OpenClaw Release Checks`，或者在你希望获得实时 prompt cache、
   QA Lab 一致性、Matrix 和 Telegram 覆盖时，使用当前完整的工作流分支提交 SHA
   - 这一步故意单独分离，这样实时覆盖仍然可用，而不会把长时间运行或不稳定的检查
     重新耦合进发布工作流
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存下来的 `preflight_run_id`
6. 如果该发布先落在 `beta`，请使用私有工作流
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   将该稳定版从 `beta` 提升到 `latest`
7. 如果该发布有意直接发布到 `latest`，并且希望 `beta`
   立即跟随同一个稳定构建，请使用同一个私有工作流将两个 dist-tag
   都指向该稳定版本，或者让它的定时自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既保留了直接发布路径，也保留了先 beta 后提升路径，并且两者都已文档化、
对操作人员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际操作手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
