---
read_when:
    - ClawHub CLI 或 OpenClaw 注册表命令失败
    - 无法安装、发布或更新软件包
summary: ClawHub 登录、安装、发布、更新和 API 问题的故障排除。
x-i18n:
    generated_at: "2026-06-27T17:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 故障排除

## `clawhub login` 打开浏览器但始终无法完成

CLI 会在浏览器登录期间启动一个短生命周期的本地回调服务器。

- 确保你的浏览器可以访问 `http://127.0.0.1:<port>/callback`。
- 如果回调始终没有到达，请检查本地防火墙、VPN 和代理规则。
- 在无头环境中，在 ClawHub Web UI 中创建 API token，然后运行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 返回 `Unauthorized` (401)

- 使用 `clawhub login` 重新登录。
- 如果你使用自定义配置路径，请确认 `CLAWHUB_CONFIG_PATH` 指向包含当前 token 的文件。
- 如果你使用 API token，请确认它没有在 Web UI 中被撤销。

## 搜索或安装返回 `Rate limit exceeded` (429)

阅读响应中的重试信息：

- `Retry-After`：重试前需要等待的秒数。
- `RateLimit-Limit`：应用于此请求的限制。
- `RateLimit-Remaining`：存在该标头时你的确切剩余额度。在 `429` 时，它为 `0`。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重置时间。

如果许多用户共享同一个出口 IP，即使每个人只发送少量请求，也可能触发匿名 IP 限制。尽可能登录，并在报告的延迟后重试。

## 搜索或安装在代理后失败

CLI 遵循标准代理变量：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支持的名称包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和 `http_proxy`。

## 技能未出现在搜索中

- 如果你知道确切的 slug 或所有者页面，请检查它。
- 确认发布是公开的，并且没有被扫描或审核流程挂起。
- 如果你拥有该技能，请登录并检查它：

```bash
clawhub inspect @openclaw/demo
```

所有者可见的诊断信息可能会说明扫描、上传门禁或审核状态。

## 发布因缺少必需元数据而失败

对于技能，请检查 `SKILL.md` frontmatter。应声明必需的环境变量和工具，以便用户和扫描器理解该包。

对于插件，请检查 `package.json` 兼容性元数据。代码插件发布需要 OpenClaw 兼容性字段，例如 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

先预览发布负载：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 发布因 GitHub 所有者或来源错误而失败

ClawHub 使用 GitHub 身份和来源归因将包连接到其发布者。

- 确保你使用拥有该包或可以发布该包的 GitHub 账号登录。
- 检查来源 URL 是否公开或可供 ClawHub 访问。
- 对于 GitHub 来源，使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## 发布因命名空间已被认领或保留而失败

如果发布失败是因为所有者 handle、组织命名空间、包作用域、技能 slug 或包名已被认领或保留，请先确认你正在使用与该命名空间匹配的所有者发布。对于插件包，诸如 `@example-org/example-plugin` 的带作用域名称必须以匹配的 `example-org` 所有者发布。

如果你认为你的组织、项目或品牌是该命名空间的合法所有者，但你无法管理当前 ClawHub 所有者，请使用公开、非敏感的证明提交 [组织 / 命名空间认领 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)。有关证据指南以及哪些内容不应放入公开 issue，请参见[组织和命名空间认领](/zh-CN/clawhub/namespace-claims)。

## `sync` 表示未找到技能

`sync` 会查找包含 `SKILL.md` 或 `skill.md` 的文件夹。

将它指向你要扫描的根目录：

```bash
clawhub sync --root /path/to/skills
```

如果不确定会发布什么，请先预览：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本地更改而拒绝执行

本地文件与 ClawHub 已知的任何版本都不匹配。选择一种方式：

- 保留本地编辑并跳过更新。
- 用已发布版本覆盖：

```bash
clawhub update @openclaw/demo --force
```

- 将你编辑后的副本作为新的 slug 或 fork 发布。

## 插件安装在 OpenClaw 中失败

- 使用明确的 ClawHub 来源：

```bash
openclaw plugins install clawhub:<package>
```

- 检查包详情页中的扫描状态和兼容性元数据。
- 确认你的 OpenClaw 版本满足该包声明的兼容性范围。
- 如果该包被隐藏、挂起或阻止，则在所有者解决问题之前可能无法安装。

## 公共 API 请求失败

- 遵守 `429` 重试标头，并缓存公共列表/搜索响应。
- 将用户链接回规范的 ClawHub 列表页。
- 不要在公共 API 表面之外镜像隐藏、私有、挂起或被审核阻止的内容。

有关端点详情，请参见 [HTTP API](/zh-CN/clawhub/http-api)。
