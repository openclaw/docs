---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-14T21:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份和日期不要补零
- `latest` 表示当前已提升的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以显式指定为 `latest`，或在后续将经过验证的 beta 构建提升上去
- 每个 OpenClaw 发布都会同时交付 npm 包和 macOS 应用

## 发布节奏

- 发布采用 beta 优先的方式推进
- 只有在最新 beta 完成验证后，才会跟进 stable
- 详细的发布流程、审批、凭证和恢复说明仅供维护者查看

## 发布前检查

- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，以便为打包验证步骤生成预期的 `dist/*` 发布产物和 Control UI bundle
- 每次带标签发布前都要运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- 跨操作系统的安装与升级运行时验证由私有调用方工作流触发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、可预测且以产物为中心，而较慢的在线检查保留在独立通道中，这样它们不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用触发，以确保工作流逻辑和密钥保持规范一致
- 该工作流接受现有发布标签，或者当前完整的 40 字符 `main` 提交 SHA
- 在提交 SHA 模式下，它只接受当前 `origin/main` 的 HEAD；较旧的发布提交必须使用发布标签
- `OpenClaw NPM Release` 的仅验证预检查也接受当前完整的 40 字符 `main` 提交 SHA，而不要求已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都将真实发布与提升路径保留在 GitHub 托管 runner 上，而非变更性的验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检查不再等待独立的发布检查通道完成
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），以在全新的临时前缀目录中验证已发布注册表安装路径
- 维护者发布自动化现在采用“先预检查再提升”的方式：
  - 真实的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式指定为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保留仅使用 OIDC 的发布方式
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于 `YYYY.M.D-N` 这类稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀路径，以确保发布修正不会悄悄让较旧的全局安装继续停留在基础稳定版内容上
- npm 发布预检查默认采用失败即关闭的策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 内容，否则不会通过，这样可以避免再次发布一个空的浏览器仪表盘
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 可以在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器维护的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述的是过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符 `main` 提交 SHA，用于仅验证的预检查
- `preflight_only`：`true` 表示仅进行验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：在真实发布路径中必填，以便工作流复用成功预检查运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：用于验证的现有发布标签，或当前完整的 40 字符 `main` 提交
  SHA

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 仅当 `preflight_only=true` 时才允许使用完整提交 SHA 输入
- 发布检查的提交 SHA 模式还要求必须是当前 `origin/main` 的 HEAD
- 真实发布路径必须使用与预检查相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

在发布稳定版 npm 版本时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在之前，你可以使用当前完整的 `main` 提交 SHA 对预检查工作流进行一次仅验证的预演
2. 在正常的 beta 优先流程中选择 `npm_dist_tag=beta`，只有当你明确想直接发布稳定版时才使用 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同的标签，或者在你需要在线 prompt cache 覆盖验证时使用当前完整的 `main` 提交 SHA
   - 这样刻意分离，是为了让在线覆盖检查在可用的同时，不再把长时间运行或不稳定的检查重新耦合到发布工作流中
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的 `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
6. 如果该发布先落在 `beta`，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该稳定版从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且 `beta`
   也应立即跟进同一个稳定构建，则使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让其计划中的自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中以提升安全性，因为它仍然需要
`NPM_TOKEN`，而公开仓库保留仅使用 OIDC 的发布方式。

这样既记录了直接发布路径，也记录了 beta 优先的提升路径，并且两者对操作人员都清晰可见。

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
