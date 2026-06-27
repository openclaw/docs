---
read_when:
    - 发布技能或插件
    - 调试所有者或包作用域错误
    - 添加发布 UI、CLI 或后端行为
summary: ClawHub 发布在技能、插件、所有者、作用域、版本发布和审核方面的工作方式。
x-i18n:
    generated_at: "2026-06-27T01:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 发布

发布会把 Skills 文件夹或插件包发送到你选择的所有者名下的 ClawHub。ClawHub 会检查你的令牌是否可以代表该所有者发布，验证元数据、名称、版本、文件和来源信息，然后存储该版本并启动自动化安全检查。

如果验证失败，则不会发布任何内容。新版本也可能在审核完成前不会出现在常规安装和下载界面中。

## Skills

最简单的发布路径是 CLI。登录后，发布本地 Skills 文件夹：

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

发布到组织所有者时使用 `--owner <handle>`。省略它则以已认证用户身份发布。发布会跳过未更改的内容。新的 Skills 从 `1.0.0` 开始，后续更改会自动发布下一个补丁版本。仅在需要显式版本时传入 `--version`。

对于目录仓库，请使用 ClawHub 的可复用 [`skill-publish.yml` workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)。它会对 `root` 下的每个直接 Skills 文件夹（默认：`skills`）调用 `skill publish`，或仅对 `skill_path` 提供的文件夹调用。

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

使用 `dry_run: true` 预览新增和已更改的 Skills，而不执行发布。

## 插件

插件使用 npm 风格的包名。带作用域的包名会在名称的第一部分包含所有者：

```text
@owner/package-name
```

作用域必须匹配所选的发布所有者。如果你的包名为 `@openclaw/dronzer`，它只能作为 `@openclaw` 发布。如果你以 `@vintageayu` 发布，请将包重命名为 `@vintageayu/dronzer`。

这可以防止包声明发布者无法控制的组织命名空间。

如果你是某个已在 ClawHub 上被声明或保留的组织、品牌、包作用域、所有者 handle 或命名空间的合法所有者，请打开一个 [组织 / 命名空间声明议题](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，并提供公开、非敏感的证明。请参阅[组织和命名空间声明](/zh-CN/clawhub/namespace-claims)，了解应包含哪些内容以及哪些内容不应放入公开议题。

### 发布插件前

- 选择与包作用域匹配的所有者。
- 包含 `openclaw.plugin.json`。代码插件还需要包含带有 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion` 的 `package.json`。
- 若要显示自定义插件卡片图标，请在 `openclaw.plugin.json` 中添加 `icon`，值为任意 HTTPS 图片 URL。
- 包含源代码仓库和精确提交元数据，或在 GitHub 支持的 checkout 中使用 CLI，以便它可以检测这些信息。
- 发布前运行 `clawhub package validate <source>`。对于包、清单、SDK 导入或构件相关发现，请参阅[插件验证修复](/zh-CN/clawhub/plugin-validation-fixes)。
- 创建发布前运行 `clawhub package publish <source> --dry-run`。
- 预期新版本在自动化安全检查和验证完成前不会出现在公开安装界面中。

### 包的受信任发布

包的受信任发布需要两步设置：

1. 先通过常规手动或令牌认证的 `clawhub package publish` 发布一次包。这会创建包记录，并确定可以更改其受信任发布者配置的包管理员。
2. 包管理员设置 GitHub Actions 受信任发布者配置：

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

配置完成后，未来受支持的 GitHub Actions 发布可以使用 OIDC / 受信任发布，而无需在仓库中存储长期有效的 ClawHub 令牌。配置的仓库和 workflow 文件名必须匹配 GitHub Actions OIDC 声明。如果你还传入 `--environment <name>`，GitHub Actions environment 声明也必须与该名称完全匹配。

设置受信任发布者配置时，ClawHub 会验证配置的 GitHub 仓库。公开仓库可以通过公开 GitHub 元数据验证。私有仓库要求 ClawHub 对该仓库拥有 GitHub 访问权限，例如通过未来的 ClawHub GitHub App 安装或其他已授权的 GitHub 集成。

当前可复用的包发布 workflow 支持在 `id-token: write` 可用时，为 `workflow_dispatch` 发布使用无密钥受信任发布。标签推送的真实发布仍然需要 `clawhub_token`，因此请为标签发布、首次发布、未受信任的包或紧急发布保留 `CLAWHUB_TOKEN`。

使用以下命令查看或删除配置：

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

删除受信任发布者配置是回滚路径。它会禁用未来的受信任发布令牌签发，直到包管理员再次设置配置。

## 常见问题

### 包作用域必须匹配所选所有者

如果包作用域与所选所有者不匹配，ClawHub 会拒绝发布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

要修复它，请选择由包作用域命名的所有者，或重命名包，使作用域匹配你可作为其发布的所有者。

如果包名已经具有正确的作用域，但包归错误的发布者所有，请改为转移所有权：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有当你同时拥有当前所有者和目标发布者的管理员访问权限时，才使用包或 Skills 转移。包转移不会允许你发布到你无法管理的作用域中。

如果你无权访问当前所有者，但认为你的组织、项目或品牌是该命名空间的合法所有者，请打开一个[组织 / 命名空间声明议题](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，并提供公开、非敏感的证明以供工作人员审核。提交前请参阅[组织和命名空间声明](/zh-CN/clawhub/namespace-claims)。

这会保护组织命名空间。名为 `@openclaw/dronzer` 的包声明了 `@openclaw` 命名空间，因此只有有权访问 `@openclaw` 所有者的发布者才能发布它。
