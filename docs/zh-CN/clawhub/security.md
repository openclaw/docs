---
read_when:
    - 了解 ClawHub 扫描和审核结果
    - 报告技能或包
    - 恢复被暂缓、隐藏或屏蔽的列表项
summary: ClawHub 的信任、扫描、举报和审核行为。
x-i18n:
    generated_at: "2026-05-12T08:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全 + 审核

ClawHub 对发布开放，但公开列表仍会经过信任、扫描、举报和审核控制。目标很务实：帮助用户检查他们安装的内容，为发布者提供误报恢复路径，并将滥用包排除在公开发现之外。

另请参阅[可接受使用](/zh-CN/clawhub/acceptable-usage)。

## 用户可以检查什么

安装 Skills 或插件之前，请检查其 ClawHub 列表中的：

- 所有者和来源归属
- 最新版本和变更日志
- 必需的环境变量或权限
- 插件兼容性元数据
- 扫描或审核状态
- 在显示的情况下，举报、评论、星标、下载量和安装信号

只安装你理解并信任的内容。

## 扫描状态

ClawHub 可能会在公开页面和所有者可见的诊断信息中显示扫描或审核结果。

常见结果包括：

- `clean`：未发现阻塞性问题。
- `suspicious`：该发布需要谨慎或复核。
- `malicious`：该发布被视为不安全。
- `pending`：检查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：该发布在公开安装界面上并非完全可用。

具体措辞可能因界面而异，但实际含义相同：如果某个发布被暂挂或阻止，用户不应安装它，直到所有者解决问题或审核恢复该发布。

## Skills

Skills 扫描会检查已发布的技能包、元数据、声明的要求以及可疑指令。

ClawHub 会特别关注 Skills 声明的内容与它看起来实际执行的操作之间的不匹配。例如，引用必需 API key 的 Skills 应该在 `SKILL.md` 中声明该要求，以便用户在安装前看到。

扫描发现基于构件。预期的提供商行为，例如声明的 API 凭据、localhost OAuth 回调、限定范围的卸载清理、Basic Auth 编码，或用户选择上传到所述提供商的文件，会区别于隐藏的凭据转发、广泛的私有文件访问、无关网络目标或隐蔽的浏览器滥用。

参见[技能格式](/zh-CN/clawhub/skill-format)。

## 插件

插件发布包含包元数据、来源归属、兼容性字段和构件完整性信息。

OpenClaw 会在安装 ClawHub 托管的插件前检查兼容性。包记录也可能公开摘要元数据，以便 OpenClaw 验证下载的构件。ClawScan 在审核插件发布时会包含声明的包 `openclaw.environment` 环境变量/配置元数据，以便将声明的运行时要求与观察到的行为进行比较。

## 举报

已登录用户可以举报 Skills、包和评论。

举报应当具体且可执行。滥用举报本身也可能导致账户处理。

举报示例：

- 误导性元数据
- 未声明的凭据或权限要求
- 可疑安装说明
- 诈骗评论或冒充
- 恶意注册或商标滥用
- 违反[可接受使用](/zh-CN/clawhub/acceptable-usage)的内容

## 发布者 ClawScan 备注

发布者可以在发布 Skills 或插件时提供可选的 ClawScan 备注。此备注为 ClawScan 提供行为上下文，这些行为否则可能看起来异常，例如网络访问、原生主机访问或提供商特定凭据。

## 审核暂挂

当静态扫描器将上传的 Skills 标记为恶意时，发布者会自动被置于审核暂挂状态（在用户上设置 `requiresModerationAt`）。这会隐藏该发布者的所有 Skills，使未来的发布从隐藏状态开始，并创建一条 `user.moderation.auto` 审计日志条目。

静态可疑发现会作为文件/行证据保留给审核员，但它们本身不会隐藏内容，也不会决定公开扫描结论。新上传内容会保持在审核/待处理状态，直到 LLM 审核完成。静态扫描只会因恶意签名立即阻止。VirusTotal 引擎命中仍会作为可见安全证据保留，但 VirusTotal Code Insight/Palm 结论属于建议性质，本身不会隐藏 Skills。ClawScan LLM 审核会保留与目的相符的备注作为指导。中等审核发现会在构件上保持可见，而可疑筛选器仅用于高影响 LLM 关注点、恶意发现或经佐证的 AV 引擎检测结果。

管理员可以解除误报暂挂：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

这会清除 `requiresModerationAt` 和 `requiresModerationReason`，恢复因用户级暂挂而隐藏的 Skills，并写入一条 `user.moderation.lift` 审计日志条目。因其他原因隐藏的 Skills，或其自身静态扫描仍为恶意的 Skills，会继续保持隐藏。

## 封禁和账户状态

违反 ClawHub 政策的账户可能会失去发布权限。严重滥用可能导致账户封禁、令牌撤销、隐藏内容或移除列表。

已删除、被封禁或被禁用的账户不能使用 ClawHub API 令牌。如果账户处理后 CLI 认证开始失败，请登录 Web UI 查看账户状态。如果登录或正常 CLI 访问被阻止，请联系 security@openclaw.ai 进行恢复审核。

## 发布者指南

为减少误报并提升用户信任：

- 保持名称、摘要、标签和变更日志准确
- 声明必需的环境变量和权限
- 当发布包含异常但有意的行为时，添加发布者 ClawScan 备注
- 避免混淆的安装命令
- 尽可能链接到来源
- 发布插件前使用 dry run
- 如果用户或审核员询问包行为，请清晰回应
