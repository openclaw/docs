---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-24T04:06:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6360bb22e5d945c3520cf0b7141f75a52fdac193debd47e402be50c31cddefe6
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布流程：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版默认发布到 npm `beta`；发布操作员可以显式指定为 `latest`，或之后再将经过验证的 beta 构建提升过去
- 每个 stable OpenClaw 发布都会同时发布 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，mac 应用的构建 / 签名 / 公证通常保留给 stable，除非另有明确要求

## 发布节奏

- 发布遵循 beta 优先
- 只有在最新 beta 验证完成后，stable 才会跟进
- 维护者通常会从当前 `main` 创建一个 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经被推送或发布，之后又需要修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，这样测试 TypeScript 也能在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，这样更广泛的导入环和架构边界检查也能在更快的本地门禁之外保持绿色
- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，这样 pack
  校验步骤所需的 `dist/*` 发布产物和控制 UI bundle 才会存在
- 每次带标签发布前都要运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock parity gate，以及实时
  Matrix 和 Telegram QA 流程。实时流程使用
  `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨 OS 的安装和升级运行时验证由私有调用方工作流派发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持短小、
  确定性且以产物为中心，而较慢的实时检查保持在它们自己的流程中，
  这样就不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用或
  `release/YYYY.M.D` 工作流引用派发，这样工作流逻辑和密钥才能保持受控
- 该工作流接受一个现有发布标签，或者当前工作流分支的完整
  40 字符 commit SHA
- 在 commit-SHA 模式下，它只接受当前工作流分支的 HEAD；对于较旧的发布 commit，请使用发布标签
- `OpenClaw NPM Release` 的仅校验预检也接受当前工作流分支的完整 40 字符 commit SHA，而不要求先推送标签
- 该 SHA 路径仅用于校验，不能被提升为真实发布
- 在 SHA 模式下，工作流只会为 package 元数据检查合成 `v<package.json version>`；真实发布仍然需要真实发布标签
- 两个工作流都会把真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更性的校验路径可以使用更大的
  Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检不再等待单独的发布检查流程
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta / 修正版版本）以在一个全新的临时前缀中验证已发布的注册表安装路径
- 维护者发布自动化现在使用“先预检、后提升”：
  - 真实 npm 发布必须基于一个成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支派发
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入显式指定为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以增强安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于校验
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后校验器
  还会检查同一个临时前缀中从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的路径，
  以防修正版发布悄悄让旧的全局安装仍停留在基础 stable 载荷上
- npm 发布预检会在 tarball 不包含 `dist/control-ui/index.html`
  和非空的 `dist/control-ui/assets/` 载荷时以关闭失败处理，
  以防我们再次发布空的浏览器仪表板
- 发布后校验还会检查已发布的注册表安装中，在根级 `dist/*`
  布局下是否包含非空的内置插件运行时依赖。若发布时缺失或为空的内置插件
  依赖载荷，发布后校验器将失败，并且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 可以在发布路径之前捕获意外的 pack 体积膨胀
- 如果发布工作涉及 CI 规划、extension 时序清单或
  extension 测试矩阵，请在审批前重新生成并审阅由规划器维护的
  `.github/workflows/ci.yml` 中 `checks-node-extensions` 工作流矩阵输出，
  这样发布说明就不会描述一个过时的 CI 布局
- Stable macOS 发布准备情况还包括更新器表面：
  - GitHub 发布最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  工作流分支的完整 40 字符 commit SHA，用于仅校验预检
- `preflight_only`：`true` 表示仅校验 / 构建 / 打包，`false` 表示
  真实发布路径
- `preflight_run_id`：在真实发布路径中必填，这样工作流会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：现有发布标签，或者在从 `main` 派发时用于校验的当前完整 40 字符 `main` commit
  SHA；如果从发布分支派发，则使用现有发布标签或当前完整 40 字符发布分支 commit
  SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许使用完整 commit SHA 输入
- `OpenClaw Release Checks` 始终仅用于校验，也接受当前工作流分支 commit SHA
- 发布检查的 commit-SHA 模式还要求当前工作流分支 HEAD
- 真实发布路径必须使用与预检时相同的 `npm_dist_tag`；
  工作流会在继续发布前校验该元数据

## Stable npm 发布顺序

在切一个 stable npm 发布时：

1. 先运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在前，你可以使用当前工作流分支的完整 commit
     SHA 对预检工作流进行一次仅校验的试运行
2. 按正常的 beta 优先流程选择 `npm_dist_tag=beta`，或仅当你明确想直接发布 stable 时才选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同的标签，或
   当前工作流分支的完整 SHA，以便获得实时 prompt cache、
   QA Lab parity、Matrix 和 Telegram 覆盖
   - 这是有意分开的，这样实时覆盖就能保持可用，而不会再次把长时间运行或不稳定的检查耦合回发布工作流
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag` 和保存下来的 `preflight_run_id`
6. 如果该发布先落在了 `beta`，使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且希望 `beta`
   立即跟随同一 stable 构建，则使用同一个私有工作流，让两个 dist-tag 都指向这个 stable 版本，或者让其定时自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta 优先提升路径都得到文档化，并且对操作员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。

## 相关内容

- [发布策略](/reference/release-policy)
- [发布渠道](/zh-CN/install/development-channels)
