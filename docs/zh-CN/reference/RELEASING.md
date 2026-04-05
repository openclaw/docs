---
read_when:
    - 查找公开发布通道定义
    - 查找版本命名和发布节奏
summary: 公开发布通道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-05T10:07:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三条公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在显式指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已晋升的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作员可以显式指定发布到 `latest`，或在之后将已验证的 beta 构建晋升
- 每个 OpenClaw 发布都会同时发布 npm 包和 macOS 应用

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 验证通过后，才会跟进 stable
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布前检查

- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，以便打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 在每次带标签发布前运行 `pnpm release:check`
- `main` 分支的 npm 发布前检查还会在打包 tarball 之前运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，
  并使用工作流密钥 `OPENAI_API_KEY` 和
  `ANTHROPIC_API_KEY`
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版版本），在一个全新的临时前缀中验证已发布注册表的安装路径
- 维护者发布自动化现在使用“先预检再晋升”流程：
  - 实际 npm 发布必须通过成功的 npm `preflight_run_id`
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可通过工作流输入显式指定目标为 `latest`
  - 稳定 npm 从 `beta` 晋升到 `latest` 仍然作为可信 `OpenClaw NPM Release` 工作流中的显式手动模式提供
  - 该晋升模式仍需要 `npm-release` 环境中有效的 `NPM_TOKEN`，因为 npm `dist-tag` 管理独立于可信发布
  - 公开的 `macOS Release` 仅用于验证
  - 实际的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 实际发布路径会晋升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，因此发布修正不能悄悄让旧的全局安装仍停留在基础稳定版负载上
- npm 发布前检查会以失败关闭，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，
  以避免再次发布一个空的浏览器仪表板
- 如果发布工作涉及 CI 规划、扩展时序清单或快速测试矩阵，请在审批前从 `.github/workflows/ci.yml`
  重新生成并审查由规划器负责的 `checks-fast-extensions`
  工作流矩阵输出，以免发布说明描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关接口：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`
- `preflight_only`：若仅执行验证/构建/打包则为 `true`，若执行实际发布路径则为 `false`
- `preflight_run_id`：在实际发布路径中为必填，这样工作流会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`
- `promote_beta_to_latest`：若为 `true`，则跳过发布，并将已发布的稳定版 `beta` 构建移动到 `latest`

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- beta 预发布标签只能发布到 `beta`
- 实际发布路径必须使用与预检时相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据
- 晋升模式必须使用稳定版或修正版标签、`preflight_only=false`、
  空的 `preflight_run_id`，以及 `npm_dist_tag=beta`
- 晋升模式还要求 `npm-release`
  环境中存在有效的 `NPM_TOKEN`，因为 `npm dist-tag add` 仍然需要常规 npm 认证

## 稳定版 npm 发布顺序

在发布稳定版 npm 时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
2. 在常规的先 beta 流程中选择 `npm_dist_tag=beta`，或者仅当你有意直接发布稳定版时才选择 `latest`
3. 保存成功的 `preflight_run_id`
4. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id`
5. 如果该发布已落到 `beta`，则在之后运行 `OpenClaw NPM Release`，
   使用相同的稳定版 `tag`、`promote_beta_to_latest=true`、`preflight_only=false`、
   空的 `preflight_run_id` 和 `npm_dist_tag=beta`，以便在你想把该已发布构建移动到 `latest` 时执行晋升

晋升模式仍然需要 `npm-release` 环境审批，以及该环境中有效的
`NPM_TOKEN`。

这样既保留了直接发布路径，也保留了先 beta 再晋升路径，并且二者都清晰记录、对操作员可见。

## 公开参考资料

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者在
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中使用私有发布文档作为实际操作手册。
