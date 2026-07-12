---
read_when:
    - ClawHub CLI 或 OpenClaw 注册表命令失败
    - 无法安装、发布或更新软件包
summary: ClawHub 登录、安装、发布、更新和 API 问题故障排查。
x-i18n:
    generated_at: "2026-07-12T14:21:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 故障排查

## `clawhub login` 打开浏览器但始终无法完成

在浏览器登录期间，CLI 会启动一个短期运行的本地回调服务器。

- 确保浏览器可以访问 `http://127.0.0.1:<port>/callback`。
- 如果始终未收到回调，请检查本地防火墙、VPN 和代理规则。
- 在无头环境中，在 ClawHub Web UI 中创建 API 令牌，然后运行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 返回 `Unauthorized` (401)

- 使用 `clawhub login` 重新登录。
- 如果使用自定义配置路径，请确认 `CLAWHUB_CONFIG_PATH` 指向
  包含当前令牌的文件。
- 如果使用 API 令牌，请确认该令牌未在 Web UI 中被撤销。

## 搜索或安装返回 `Rate limit exceeded` (429)

查看响应中的重试信息：

- `Retry-After`：重试前需要等待的秒数。
- `RateLimit-Limit`：应用于此请求的限额。
- `RateLimit-Remaining`：存在此响应头时，你的确切剩余额度。出现 `429` 时，该值为 `0`。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重置时间。

如果许多用户共享一个出口 IP，即使每个人只发送少量请求，也可能触发匿名 IP 限制。请尽可能登录，并在报告的延迟时间后重试。

## 通过代理时搜索或安装失败

CLI 遵循标准代理环境变量：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支持的名称包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和
`http_proxy`。

## 某个技能未出现在搜索结果中

- 如果知道确切的 slug 或所有者页面，请直接检查。
- 确认该版本已公开，且未因扫描或审核而被暂缓。
- 如果你拥有该技能，请登录并检查：

```bash
clawhub inspect @openclaw/demo
```

仅所有者可见的诊断信息可能会解释扫描、上传门禁或审核状态。

## 发布因缺少必需元数据而失败

对于技能，请检查 `SKILL.md` 的 frontmatter。应声明所需的环境变量和
工具，以便用户和扫描程序了解该软件包。

对于插件，请检查 `package.json` 中的兼容性元数据。发布代码插件时
需要 OpenClaw 兼容性字段，例如 `openclaw.compat.pluginApi` 和
`openclaw.build.openclawVersion`。

请先预览发布载荷：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 发布因 GitHub 所有者或来源错误而失败

ClawHub 使用 GitHub 身份和来源归属将软件包与其
发布者关联起来。

- 确保你已使用拥有该软件包或有权发布该软件包的 GitHub 账号
  登录。
- 检查源 URL 是否公开或 ClawHub 是否可访问。
- 对于 GitHub 来源，请使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## 发布因命名空间已被认领或保留而失败

如果发布失败是因为所有者名称、组织命名空间、软件包作用域、技能
slug 或软件包名称已被认领或保留，请先确认你使用的发布所有者与该命名空间匹配。对于插件软件包，
`@example-org/example-plugin` 等带作用域的名称必须以对应的
`example-org` 所有者身份发布。

如果你认为你的组织、项目或品牌是该命名空间的合法所有者，但
无法管理当前的 ClawHub 所有者，请提交
[组织/命名空间认领问题](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，
并提供公开且非敏感的证明。有关证据指南以及哪些内容
不应出现在公开问题中，请参阅[组织和命名空间认领](/clawhub/namespace-claims)。

## `sync` 提示未找到技能

`sync` 会查找包含 `SKILL.md` 或 `skill.md` 的文件夹。

将其指向要扫描的根目录：

```bash
clawhub sync --root /path/to/skills
```

如果不确定将发布哪些内容，请先预览：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因存在本地更改而拒绝执行

本地文件与 ClawHub 已知的任何版本均不匹配。请选择一种处理方式：

- 保留本地编辑并跳过更新。
- 使用已发布版本覆盖：

```bash
clawhub update @openclaw/demo --force
```

- 将编辑后的副本以新的 slug 或分支版本发布。

## 在 OpenClaw 中安装插件失败

- 使用明确的 ClawHub 来源：

```bash
openclaw plugins install clawhub:<package>
```

- 查看软件包详情页面中的扫描状态和兼容性元数据。
- 确认你的 OpenClaw 版本满足该软件包声明的
  兼容性范围。
- 如果软件包被隐藏、暂缓或阻止，则在
  所有者解决问题之前可能无法安装。

## 公共 API 请求失败

- 遵循 `429` 重试响应头，并缓存公共列表/搜索响应。
- 将用户链接回规范的 ClawHub 列表页面。
- 不要在公共 API 范围之外镜像隐藏、私有、暂缓或因审核而被阻止的
  内容。

有关端点详情，请参阅 [HTTP API](/clawhub/http-api)。
