---
read_when:
    - ClawHub CLI 或 OpenClaw 注册表命令失败
    - 无法安装、发布或更新包
summary: ClawHub 登录、安装、发布、同步、更新和 API 问题的故障排除。
x-i18n:
    generated_at: "2026-05-12T12:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 故障排除

## `clawhub login` 打开浏览器但始终无法完成

CLI 会在浏览器登录期间启动一个短生命周期的本地回调服务器。

- 确保你的浏览器可以访问 `http://127.0.0.1:<port>/callback`。
- 如果回调始终未到达，请检查本地防火墙、VPN 和代理规则。
- 在无头环境中，在 ClawHub Web UI 中创建 API 令牌，然后运行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 返回 `Unauthorized` (401)

- 使用 `clawhub login` 重新登录。
- 如果你使用自定义配置路径，请确认 `CLAWHUB_CONFIG_PATH` 指向包含你当前令牌的
  文件。
- 如果你使用 API 令牌，请确认它未在 Web UI 中被撤销。

## 搜索或安装返回 `Rate limit exceeded` (429)

读取响应中的重试信息：

- `Retry-After`：重试前需要等待的秒数。
- `RateLimit-Remaining` 和 `RateLimit-Limit`：你的当前配额。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重置时间。

如果许多用户共享同一个出口 IP，即使每个人只发送少量请求，也可能触发匿名 IP 限制。尽可能登录，并在报告的延迟后重试。

## 搜索或安装在代理后失败

CLI 遵循标准代理变量：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支持的名称包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和
`http_proxy`。

## 技能未出现在搜索中

- 如果你知道确切的 slug 或所有者页面，请检查它们。
- 确认版本发布为公开，并且未被扫描或审核流程暂缓。
- 如果你拥有该技能，请登录并检查它：

```bash
clawhub inspect <skill-slug>
```

所有者可见的诊断信息可能会解释扫描、上传门禁或审核状态。

## 发布因缺少必需元数据而失败

对于技能，请检查 `SKILL.md` frontmatter。应声明必需的环境变量和
工具，以便用户和扫描器理解该包。

对于插件，请检查 `package.json` 兼容性元数据。代码插件发布需要
OpenClaw 兼容性字段，例如 `openclaw.compat.pluginApi` 和
`openclaw.build.openclawVersion`。

先预览发布载荷：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 发布因 GitHub 所有者或来源错误而失败

ClawHub 使用 GitHub 身份和来源归属，将包与其发布者关联起来。

- 确保你已使用拥有该包或可发布该包的 GitHub 账户登录。
- 检查来源 URL 是否公开，或 ClawHub 是否可以访问。
- 对于 GitHub 来源，请使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## `sync` 提示未找到技能

`sync` 会查找包含 `SKILL.md` 或 `skill.md` 的文件夹。

将其指向你要扫描的根目录：

```bash
clawhub sync --root /path/to/skills
```

如果你不确定将发布什么，请先预览：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本地更改而拒绝执行

本地文件与 ClawHub 已知的任何版本都不匹配。请选择一种方式：

- 保留本地编辑并跳过更新。
- 使用已发布版本覆盖：

```bash
clawhub update <slug> --force
```

- 将你编辑过的副本发布为新的 slug 或 fork。

## 插件在 OpenClaw 中安装失败

- 使用显式 ClawHub 来源：

```bash
openclaw plugins install clawhub:<package>
```

- 检查包详情页中的扫描状态和兼容性元数据。
- 确认你的 OpenClaw 版本满足该包声明的
  兼容性范围。
- 如果该包被隐藏、暂缓或阻止，则在所有者解决问题之前，它可能无法安装。

## 公共 API 请求失败

- 遵守 `429` 重试标头，并缓存公共列表/搜索响应。
- 将用户链接回规范的 ClawHub 列表。
- 不要在公共 API 表面之外镜像隐藏、私有、暂缓或被审核阻止的内容。

请参阅 [HTTP API](/zh-CN/clawhub/http-api) 了解端点详情。
