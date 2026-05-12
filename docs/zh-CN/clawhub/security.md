---
read_when:
    - 了解 ClawHub 扫描和审核结果
    - 报告技能或包
    - 恢复被暂扣、隐藏或屏蔽的上架项
summary: ClawHub 的信任、扫描、举报和审核行为。
x-i18n:
    generated_at: "2026-05-12T00:57:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全 + 审核

ClawHub 对发布开放，但公开列表仍会经过信任、扫描、举报和审核控制。目标很务实：帮助用户检查他们安装的内容，为发布者提供误报恢复路径，并将滥用软件包排除在公开发现之外。

另请参阅[可接受使用](/zh-CN/clawhub/acceptable-usage)。

## 用户可以检查什么

在安装 skill 或插件之前，检查其 ClawHub 列表中的以下内容：

- 所有者和来源归属
- 最新版本和变更日志
- 必需的环境变量或权限
- 插件的兼容性元数据
- 扫描或审核状态
- 显示的举报、评论、星标、下载量和安装信号

只安装你理解并信任的内容。

## 扫描状态

ClawHub 可能会在公开页面和所有者可见的诊断信息中显示扫描或审核结果。

常见结果包括：

- `clean`：未发现阻塞性问题。
- `suspicious`：该发布需要谨慎处理或审核。
- `malicious`：该发布被认为不安全。
- `pending`：检查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：该发布尚未在公开安装界面上完全可用。

不同界面的确切措辞可能有所不同，但实际含义相同：如果某个发布被暂挂或阻止，用户不应安装，直到所有者解决问题或审核恢复该发布。

## Skills

Skill 扫描会检查已发布的 skill 包、元数据、声明的要求以及可疑指令。

ClawHub 会特别关注 skill 声明内容与其实际行为之间的不匹配。例如，引用必需 API 密钥的 skill 应在 `SKILL.md` 中声明该要求，以便用户在安装前看到。

扫描结果基于制品。预期的提供商行为，例如声明的 API 凭据、localhost OAuth 回调、限定范围的卸载清理、Basic Auth 编码，或用户选择上传到指定提供商的文件，会与隐藏的凭据转发、广泛的私有文件访问、无关的网络目标或隐蔽浏览器滥用区别对待。

参见 [Skill 格式](/zh-CN/clawhub/skill-format)。

## 插件

插件发布包括软件包元数据、来源归属、兼容性字段和制品完整性信息。

OpenClaw 会在安装 ClawHub 托管的插件之前检查兼容性。软件包记录也可能公开摘要元数据，以便 OpenClaw 验证下载的制品。ClawScan 在审核插件发布时会包含声明的软件包 `openclaw.environment` 环境/配置元数据，以便将声明的运行时要求与观察到的行为进行比较。

## 举报

已登录用户可以举报 skill、软件包和评论。

举报应具体且可操作。滥用举报本身也可能导致账号处置。

举报示例：

- 误导性元数据
- 未声明的凭据或权限要求
- 可疑的安装说明
- 诈骗评论或冒充行为
- 恶意注册或商标滥用
- 违反[可接受使用](/zh-CN/clawhub/acceptable-usage)的内容

## 发布者 ClawScan 说明

发布者可以在发布 skill 或插件时提供可选的 ClawScan 说明。此说明会为 ClawScan 提供上下文，用于解释可能看起来异常的行为，例如网络访问、本机宿主访问或提供商特定凭据。

## 审核暂挂

当静态扫描器将上传的 skill 标记为恶意时，发布者会自动被置于审核暂挂状态（在用户上设置 `requiresModerationAt`）。这会隐藏发布者的所有 skill，使未来发布从隐藏状态开始，并创建一条 `user.moderation.auto` 审计日志条目。

静态可疑结果会作为文件/行证据保留给审核员，但它们本身不会隐藏内容，也不会决定公开扫描结论。新上传内容会保持在审核/待处理状态，直到 LLM 审核完成。静态扫描只会对恶意签名立即阻止。VirusTotal 引擎命中仍会作为可见的安全证据保留，但 VirusTotal Code Insight/Palm 结论仅作为参考，不能单独隐藏 skill。ClawScan LLM 审核会保留与用途一致的说明作为指导。中等审核结果会继续在制品上可见，而可疑过滤器保留给高影响 LLM 关注点、恶意结果或得到 AV 引擎检测佐证的情况。

管理员可以解除误报暂挂：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

这会清除 `requiresModerationAt` 和 `requiresModerationReason`，恢复因用户级暂挂而隐藏的 skill，并写入一条 `user.moderation.lift` 审计日志条目。因其他原因隐藏的 skill，或其自身静态扫描仍为恶意的 skill，会保持隐藏。

## 封禁和账号状态

违反 ClawHub 政策的账号可能会失去发布访问权限。严重滥用可能导致账号封禁、令牌撤销、内容隐藏或列表移除。

已删除、被封禁或被禁用的账号无法使用 ClawHub API 令牌。如果账号处置后 CLI 身份验证开始失败，请登录 Web UI 查看账号状态。如果登录或正常 CLI 访问被阻止，请联系 security@openclaw.ai 进行恢复审核。

## 发布者指南

为减少误报并提高用户信任：

- 保持名称、摘要、标签和变更日志准确
- 声明必需的环境变量和权限
- 当发布具有异常但有意的行为时，添加发布者 ClawScan 说明
- 避免混淆的安装命令
- 尽可能链接到源代码
- 在发布插件前使用试运行
- 如果用户或审核员询问软件包行为，请清晰回应
