---
read_when:
    - 了解 ClawHub 扫描和审核结果
    - 报告技能或包
    - 恢复被暂缓、隐藏或屏蔽的列表项
summary: ClawHub 的信任、扫描、举报和审核行为。
x-i18n:
    generated_at: "2026-05-13T04:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全 + 审核

ClawHub 对发布开放，但公开列表仍会经过信任、扫描、举报和审核控制。目标很务实：帮助用户检查他们安装的内容，为发布者提供误报恢复路径，并防止滥用软件包进入公开发现渠道。

另见 [可接受使用](/zh-CN/clawhub/acceptable-usage)。

## 用户可以检查什么

在安装技能或插件之前，请检查其 ClawHub 列表中的：

- 所有者和来源归属
- 最新版本和变更日志
- 所需环境变量或权限
- 插件的兼容性元数据
- 扫描或审核状态
- 在显示时提供的举报、评论、星标、下载和安装信号

只安装你理解并信任的内容。

## 扫描状态

ClawHub 可能会在公开页面和所有者可见的诊断中显示扫描或审核结果。

常见结果包括：

- `clean`：未发现阻塞性问题。
- `suspicious`：该发布需要谨慎处理或复审。
- `malicious`：该发布被视为不安全。
- `pending`：检查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：该发布无法在公开安装界面上完全可用。

具体措辞可能因界面而异，但实际含义相同：如果某个发布被保留或阻止，用户不应安装，直到所有者解决问题或审核恢复该发布。

## Skills

技能扫描会检查已发布的技能包、元数据、声明的要求以及可疑指令。

ClawHub 会特别关注技能声明的内容与其实际行为之间的不匹配。例如，如果某个技能引用必需的 API key，就应在 `SKILL.md` 中声明该要求，以便用户在安装前看到。

扫描发现基于工件。预期的提供商行为，例如声明的 API 凭据、localhost OAuth 回调、限定范围的卸载清理、Basic Auth 编码，或用户选择上传到指定提供商的文件，会与隐藏凭据转发、大范围私有文件访问、无关网络目标或隐蔽浏览器滥用区别处理。

参见 [技能格式](/zh-CN/clawhub/skill-format)。

## 插件

插件发布包括软件包元数据、来源归属、兼容性字段和工件完整性信息。

OpenClaw 会在安装 ClawHub 托管的插件之前检查兼容性。软件包记录也可能公开摘要元数据，以便 OpenClaw 验证下载的工件。ClawScan 在审查插件发布时会包含声明的软件包 `openclaw.environment` env/config 元数据，从而将声明的运行时要求与观察到的行为进行比较。

## 举报

已登录用户可以举报技能、软件包和评论。

举报应具体且可执行。滥用举报本身也可能导致账户处置。

举报示例：

- 误导性元数据
- 未声明的凭据或权限要求
- 可疑安装说明
- 诈骗评论或冒充
- 恶意注册或商标滥用
- 违反 [可接受使用](/zh-CN/clawhub/acceptable-usage) 的内容

## 发布者 ClawScan 说明

发布者可以在发布技能或插件时提供可选的 ClawScan 说明。该说明为 ClawScan 提供上下文，用于解释原本可能显得异常的行为，例如网络访问、本机主机访问或特定提供商凭据。

## 审核保留

当静态扫描器将上传的技能标记为恶意时，发布者会自动被置于审核保留状态（在用户上设置 `requiresModerationAt`）。这会隐藏该发布者的所有技能，使未来发布从隐藏状态开始，并创建一条 `user.moderation.auto` 审计日志条目。

静态可疑发现会作为文件/行证据保留给审核员，但它们本身不会隐藏内容，也不会单独决定公开扫描结论。新上传内容会保持在复审/pending 状态，直到 LLM 复审完成。静态扫描只会对恶意特征立即阻止。VirusTotal 引擎命中仍会作为可见的安全证据，但 VirusTotal Code Insight/Palm 结论属于建议性质，本身不会隐藏技能。ClawScan LLM 复审会保留与用途一致的说明作为指导。中等复审发现会继续在工件上可见，而可疑过滤器仅保留给高影响的 LLM 顾虑、恶意发现或有佐证的 AV 引擎检测。

管理员可以解除误报保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

这会清除 `requiresModerationAt` 和 `requiresModerationReason`，恢复因用户级保留而隐藏的技能，并写入一条 `user.moderation.lift` 审计日志条目。因其他原因隐藏的技能，或其自身静态扫描仍为恶意的技能，将保持隐藏。

## 封禁和账户状态

违反 ClawHub 政策的账户可能会失去发布权限。严重滥用可能导致账户封禁、令牌吊销、内容隐藏或列表移除。

已删除、被封禁或被禁用的账户无法使用 ClawHub API 令牌。如果 CLI 凭证在账户处置后开始失败，请登录 Web UI 查看账户状态。如果登录或正常 CLI 访问被阻止，请联系 security@openclaw.ai 进行恢复审核。

## 发布者指南

为减少误报并提升用户信任：

- 保持名称、摘要、标签和变更日志准确
- 声明所需环境变量和权限
- 当发布包含异常但有意的行为时，添加发布者 ClawScan 说明
- 避免混淆的安装命令
- 尽可能链接到来源
- 发布插件前使用 dry run
- 如果用户或审核员询问软件包行为，请清晰回应
