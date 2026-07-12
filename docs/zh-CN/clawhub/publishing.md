---
read_when:
    - 发布技能或插件
    - 调试所有者或包作用域错误
    - 添加发布 UI、CLI 或后端行为
summary: ClawHub 如何处理技能、插件、所有者、作用域、发布版本和审核的发布流程。
x-i18n:
    generated_at: "2026-07-11T20:22:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 发布

发布操作会将 Skills 文件夹或插件包发送到 ClawHub，并归入你选择的所有者名下。ClawHub 会检查你的令牌是否有权代表该所有者发布，验证元数据、名称、版本、文件和源信息，然后存储该版本并启动自动安全检查。

如果验证失败，则不会发布任何内容。新版本也可能不会出现在常规安装和下载界面中，直至审核完成。

## Skills

最简单的发布方式是使用 CLI。登录后，发布本地 Skills 文件夹：

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

发布到组织所有者名下时，请使用 `--owner <handle>`。省略此参数则以已通过身份验证的用户身份发布。发布时会跳过未更改的内容。新 Skills 的初始版本为 `1.0.0`，后续更改会自动发布下一个补丁版本。仅在需要明确指定版本时传入 `--version`。

对于目录仓库，请使用 ClawHub 的可复用
[`skill-publish.yml` 工作流](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)。
它会对 `root`（默认为 `skills`）下的每个直接 Skills 文件夹调用 `skill publish`，也可以仅处理通过 `skill_path` 提供的文件夹。

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

使用 `dry_run: true` 可预览新增和已更改的 Skills，而不实际发布。

## 插件

插件使用 npm 风格的软件包名称。带作用域的软件包名称会在名称的第一部分包含所有者：

```text
@owner/package-name
```

作用域必须与所选发布所有者匹配。如果你的软件包名为 `@openclaw/dronzer`，则只能以 `@openclaw` 身份发布。如果以 `@vintageayu` 身份发布，请将软件包重命名为 `@vintageayu/dronzer`。

这可防止软件包冒用发布者无权控制的组织命名空间。

如果你是某个组织、品牌、软件包作用域、所有者账号或命名空间的合法所有者，而它已在 ClawHub 上被占用或保留，请创建一个 [组织/命名空间申领问题](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，并提供公开且不含敏感信息的证明。有关应包含哪些内容以及哪些内容不应发布到公开问题中，请参阅[组织和命名空间申领](/clawhub/namespace-claims)。

### 发布插件之前

- 选择与软件包作用域匹配的所有者。
- 包含 `openclaw.plugin.json`。代码插件还需要包含 `package.json`，并提供 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
- 如需显示自定义插件卡片图标，请在 `openclaw.plugin.json` 中添加 `icon`，其值可以是任意 HTTPS 图片 URL。
- 包含源代码仓库和确切的提交元数据，或者在由 GitHub 支持的检出目录中使用 CLI，以便自动检测这些信息。
- 发布前运行 `clawhub package validate <source>`。有关软件包、清单、SDK 导入或制品问题，请参阅[插件验证修复](/clawhub/plugin-validation-fixes)。
- 创建版本前运行 `clawhub package publish <source> --dry-run`。
- 新版本在自动安全检查和验证完成之前，预计不会出现在公开安装界面中。

### 软件包的可信发布

软件包可信发布需要分两步设置：

1. 首先通过常规手动方式或使用令牌身份验证的 `clawhub package publish` 发布一次软件包。这会创建软件包记录，并确定哪些软件包管理员可以更改其可信发布者配置。
2. 软件包管理员设置 GitHub Actions 可信发布者配置：

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

设置配置后，未来受支持的 GitHub Actions 发布可以使用 OIDC/可信发布，无需在仓库中存储长期有效的 ClawHub 令牌。所配置的仓库和工作流文件名必须与 GitHub Actions OIDC 声明匹配。如果还传入 `--environment <name>`，GitHub Actions 环境声明必须与该名称完全匹配。

设置可信发布者配置时，ClawHub 会验证所配置的 GitHub 仓库。公开仓库可以通过公开的 GitHub 元数据进行验证。对于私有仓库，ClawHub 必须拥有该仓库的 GitHub 访问权限，例如通过未来安装的 ClawHub GitHub App 或其他已授权的 GitHub 集成来获得权限。

当前的可复用软件包发布工作流支持在 `id-token: write` 可用时，对通过 `workflow_dispatch` 触发的发布进行无密钥可信发布。通过推送标签触发的实际发布仍需要 `clawhub_token`，因此对于标签版本、首次发布、不可信软件包或紧急发布，请确保 `CLAWHUB_TOKEN` 可用。

使用以下命令查看或删除配置：

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

删除可信发布者配置是回滚方式。在软件包管理员重新设置配置之前，它会禁止后续生成可信发布令牌。

## 常见问题

### 软件包作用域必须与所选所有者匹配

如果软件包作用域与所选所有者不匹配，ClawHub 会拒绝发布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

要解决此问题，可以选择软件包作用域指定的所有者，也可以重命名软件包，使作用域与你有权代表其发布的所有者匹配。

如果软件包名称已使用正确的作用域，但软件包归错误的发布者所有，请转移所有权：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

仅当你对当前所有者和目标发布者都拥有管理员访问权限时，才可转移软件包或 Skills。转移软件包并不会让你获得向无权管理的作用域发布的权限。

如果你无权访问当前所有者，但认为你的组织、项目或品牌是该命名空间的合法所有者，请创建一个[组织/命名空间申领问题](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，提供公开且不含敏感信息的证明，供工作人员审核。提交前请参阅[组织和命名空间申领](/clawhub/namespace-claims)。

这可以保护组织命名空间。名为 `@openclaw/dronzer` 的软件包会占用 `@openclaw` 命名空间，因此只有拥有 `@openclaw` 所有者访问权限的发布者才能发布它。
