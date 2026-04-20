---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-20T14:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281b3fd1764c60cb35a25a12c338595020d7c04bcb662e96c4131193a0607537
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升为正式的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定 `latest`，或在稍后将经过验证的 beta 构建提升过去
- 每个 OpenClaw 发布都会同时交付 npm 包和 macOS 应用

## 发布节奏

- 发布采用 beta 优先流程
- 只有在最新 beta 完成验证后，才会跟进 stable
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布前检查

- 在发布前检查前运行 `pnpm check:test-types`，以便在更快的本地 `pnpm check` 门禁之外，仍然覆盖测试 TypeScript
- 在发布前检查前运行 `pnpm check:architecture`，以便在更快的本地门禁之外，确保更广泛的导入环和架构边界检查通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以便打包校验步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 每次带标签发布前都要运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- 跨操作系统的安装与升级运行时验证由私有调用方工作流分发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实的 npm 发布路径保持简短、可预测且聚焦产物，而较慢的在线检查则留在各自的通道中，避免拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用发起，这样工作流逻辑和密钥才能保持规范一致
- 该工作流接受已有的发布标签，或当前完整的 40 字符 `main` 提交 SHA
- 在提交 SHA 模式下，它只接受当前 `origin/main` 的 HEAD；对于较旧的发布提交，请使用发布标签
- `OpenClaw NPM Release` 的仅验证预检查也接受当前完整的 40 字符 `main` 提交 SHA，而不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，该工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管的 runner 上，而不产生变更的验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检查不再等待独立的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本），以在全新的临时前缀中验证已发布注册表安装路径
- 维护者发布自动化现在采用“先预检查，再提升”的流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，以确保发布修正不会悄悄让旧的全局安装仍停留在基础 stable 载荷上
- npm 发布预检查采用失败即关闭策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，以避免再次发布一个空的浏览器仪表板
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 会在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器拥有的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符 `main` 提交 SHA，用于仅验证的预检查
- `preflight_only`：`true` 表示仅执行验证 / 构建 / 打包，`false` 表示
  真实发布路径
- `preflight_run_id`：在真实发布路径中为必填，这样工作流会复用成功预检查运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的现有发布标签，或当前完整的 40 字符 `main` 提交
  SHA

规则：

- stable 和修正标签可以发布到 `beta` 或 `latest`
- beta 预发布标签只能发布到 `beta`
- 只有在 `preflight_only=true` 时才允许使用完整提交 SHA 输入
- 发布检查的提交 SHA 模式还要求当前 `origin/main` HEAD
- 真实发布路径必须使用与预检查期间相同的 `npm_dist_tag`；工作流会在发布继续前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的 `main` 提交 SHA，对预检查工作流执行仅验证的演练
2. 对于正常的 beta 优先流程，选择 `npm_dist_tag=beta`；只有在你明确希望直接发布 stable 时，才选择 `latest`
3. 使用相同的标签单独运行 `OpenClaw Release Checks`，或者在你希望获得在线 prompt cache 覆盖时使用当前完整的 `main` 提交 SHA
   - 这样刻意保持独立，是为了让在线覆盖持续可用，而不必把长时间运行或不稳定的检查重新耦合回发布工作流
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
6. 如果该发布落在 `beta`，使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且希望 `beta` 立即跟随同一个 stable 构建，使用同一个私有工作流将两个 dist-tag 都指向该 stable 版本，或者让其计划任务自愈同步稍后再移动 `beta`

dist-tag 变更之所以位于私有仓库，是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既记录了直接发布路径，也记录了 beta 优先的提升路径，并且两者对操作人员都可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际操作手册。
