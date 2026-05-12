---
read_when:
    - 了解 ClawHub 扫描和审核结果
    - 报告技能或软件包
    - 恢复被暂缓、隐藏或屏蔽的上架条目
summary: ClawHub 的信任、扫描、举报和审核行为。
x-i18n:
    generated_at: "2026-05-12T23:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全 + 审核

ClawHub 对发布开放，但公开列表仍会经过信任、扫描、报告和审核控制。目标很务实：帮助用户检查他们安装的内容，为发布者提供误报恢复路径，并防止滥用软件包进入公开发现。

另请参阅[可接受使用](/zh-CN/clawhub/acceptable-usage)。

## 用户可以检查什么

安装 skill 或插件前，请检查其 ClawHub 列表中的：

- 所有者和来源归属
- 最新版本和变更日志
- 必需的环境变量或权限
- 插件的兼容性元数据
- 扫描或审核状态
- 显示的报告、评论、星标、下载量和安装信号

只安装你理解并信任的内容。

## 扫描状态

ClawHub 可能会在公开页面和所有者可见的诊断信息中显示扫描或审核结果。

常见结果包括：

- `clean`：未发现阻断性问题。
- `suspicious`：该发布需要谨慎处理或审查。
- `malicious`：该发布被视为不安全。
- `pending`：检查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：该发布在公开安装入口上并非完全可用。

不同界面的具体措辞可能有所不同，但实际含义相同：如果某个发布被暂挂或阻断，用户不应安装它，直到所有者解决问题或审核恢复该发布。

## Skills

Skill 扫描会检查已发布的 skill 包、元数据、声明的要求以及可疑指令。

ClawHub 特别关注 skill 声明的内容与其看起来实际执行的行为之间的不匹配。例如，引用必需 API 密钥的 skill 应在 `SKILL.md` 中声明该要求，以便用户在安装前看到。

扫描发现基于构件。预期的提供商行为，例如声明的 API 凭据、localhost OAuth 回调、有范围的卸载清理、Basic Auth 编码，或用户选择上传到指定提供商的文件，会与隐藏的凭据转发、广泛的私有文件访问、无关的网络目的地或隐蔽的浏览器滥用区别对待。

参阅 [Skill 格式](/zh-CN/clawhub/skill-format)。

## 插件

插件发布包含软件包元数据、来源归属、兼容性字段和构件完整性信息。

OpenClaw 会在安装 ClawHub 托管的插件前检查兼容性。软件包记录也可能公开摘要元数据，以便 OpenClaw 验证下载的构件。ClawScan 在审查插件发布时会包含声明的软件包 `openclaw.environment` 环境/配置元数据，以便将声明的运行时要求与观察到的行为进行比较。

## 报告

已登录用户可以报告 Skills、软件包和评论。

报告应具体且可操作。滥用报告功能本身也可能导致账户处理。

报告示例：

- 误导性元数据
- 未声明的凭据或权限要求
- 可疑的安装说明
- 诈骗评论或冒充
- 恶意注册或商标滥用
- 违反[可接受使用](/zh-CN/clawhub/acceptable-usage)的内容

## 发布者 ClawScan 说明

发布者可以在发布 skill 或插件时提供可选的 ClawScan 说明。此说明为 ClawScan 提供上下文，用于解释否则可能显得异常的行为，例如网络访问、原生主机访问或提供商特定凭据。

## 审核暂挂

当静态扫描器将上传的 skill 标记为恶意时，发布者会自动被置于审核暂挂状态（在用户上设置 `requiresModerationAt`）。这会隐藏该发布者的所有 Skills，使后续发布从隐藏状态开始，并创建一条 `user.moderation.auto` 审计日志条目。

静态可疑发现会作为文件/行证据保留给审核人员，但它们本身不会隐藏内容，也不会单独决定公开扫描判定。新上传内容会保持在审查/待处理状态，直到 LLM 审查完成。静态扫描只会针对恶意签名立即阻断。VirusTotal 引擎命中仍会作为可见的安全证据保留，但 VirusTotal Code Insight/Palm 判定仅作参考，不会单独隐藏 Skills。ClawScan LLM 审查会将与用途一致的说明保留为指导。中等审查发现会继续在构件上可见，而可疑过滤器仅保留给高影响的 LLM 关注点、恶意发现或得到 AV 引擎检测佐证的结果。

管理员可以解除误报暂挂：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

这会清除 `requiresModerationAt` 和 `requiresModerationReason`，恢复因用户级暂挂而隐藏的 Skills，并写入一条 `user.moderation.lift` 审计日志条目。因其他原因隐藏的 Skills，或其自身静态扫描仍为恶意的 Skills，会保持隐藏。

## 封禁和账户状态

违反 ClawHub 政策的账户可能会失去发布权限。严重滥用可能导致账户封禁、令牌吊销、内容隐藏或列表移除。

已删除、已封禁或已禁用的账户无法使用 ClawHub API 令牌。如果账户处理后 CLI 认证开始失败，请登录 Web UI 查看账户状态。如果登录或正常 CLI 访问被阻止，请联系 security@openclaw.ai 进行恢复审查。

## 发布者指南

为减少误报并提升用户信任：

- 保持名称、摘要、标签和变更日志准确
- 声明必需的环境变量和权限
- 当某个发布具有异常但有意的行为时，添加发布者 ClawScan 说明
- 避免混淆的安装命令
- 尽可能链接到源代码
- 发布插件前使用 dry run
- 如果用户或审核人员询问软件包行为，请清楚回应
