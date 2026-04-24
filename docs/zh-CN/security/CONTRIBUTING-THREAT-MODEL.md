---
read_when:
    - 你想贡献安全发现或威胁场景
    - 审查或更新威胁模型时
summary: 如何为 OpenClaw 威胁模型做出贡献
title: 为威胁模型做贡献
x-i18n:
    generated_at: "2026-04-24T04:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# 为 OpenClaw 威胁模型做出贡献

感谢你帮助 OpenClaw 变得更安全。这个威胁模型是一份持续演进的文档，我们欢迎任何人参与贡献——你不需要是安全专家。

## 贡献方式

### 添加威胁

发现了我们尚未覆盖的攻击向量或风险？请在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上创建 issue，并用你自己的话描述它。你不需要了解任何框架，也不需要填写每个字段——只需描述该场景即可。

**建议包含（但不是必需）：**

- 攻击场景以及它可能如何被利用
- OpenClaw 的哪些部分受到影响（CLI、Gateway 网关、渠道、ClawHub、MCP 服务器等）
- 你认为它的严重程度（低 / 中 / 高 / 严重）
- 任何相关研究、CVE 或真实案例的链接

我们会在审查过程中处理 ATLAS 映射、威胁 ID 和风险评估。如果你想附带这些细节，当然很好——但不是预期要求。

> **这里用于向威胁模型添加内容，而不是报告正在发生的漏洞。** 如果你发现了可被利用的漏洞，请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 了解负责任披露说明。

### 提出缓解措施

对如何应对现有威胁有想法？请创建 issue 或 PR，并引用该威胁。有效的缓解措施应当具体且可执行——例如，“在 Gateway 网关按发送者进行每分钟 10 条消息的速率限制” 就比 “实现速率限制” 更好。

### 提出攻击链

攻击链展示了多个威胁如何组合成一个现实攻击场景。如果你发现了某种危险组合，请描述其步骤，以及攻击者将如何把它们串联起来。与正式模板相比，一段关于攻击在实践中如何展开的简短叙述更有价值。

### 修复或改进现有内容

错字、澄清、过时信息、更好的示例——欢迎提交 PR，无需先开 issue。

## 我们使用的内容

### MITRE ATLAS

该威胁模型基于 [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems），这是一个专为 AI/ML 威胁设计的框架，例如提示注入、工具滥用和智能体利用。你无需了解 ATLAS 也可以参与贡献——我们会在审查期间将提交内容映射到该框架。

### 威胁 ID

每个威胁都会获得一个类似 `T-EXEC-003` 的 ID。分类如下：

| Code | Category |
| ------- | ------------------------------------------ |
| RECON | 侦察——信息收集 |
| ACCESS | 初始访问——获取进入权限 |
| EXEC | 执行——运行恶意操作 |
| PERSIST | 持久化——维持访问权限 |
| EVADE | 防御规避——避免检测 |
| DISC | 发现——了解环境 |
| EXFIL | 数据外传——窃取数据 |
| IMPACT | 影响——造成损害或中断 |

ID 由维护者在审查期间分配。你无需自己选择。

### 风险等级

| Level | Meaning |
| ------------ | ----------------------------------------------------------------- |
| **严重** | 整个系统被完全攻破，或高可能性 + 严重影响 |
| **高** | 很可能造成重大损害，或中等可能性 + 严重影响 |
| **中** | 中等风险，或低可能性 + 高影响 |
| **低** | 可能性低且影响有限 |

如果你不确定风险等级，只需描述其影响，我们会进行评估。

## 审查流程

1. **分流** —— 我们会在 48 小时内审查新的提交
2. **评估** —— 我们验证可行性，分配 ATLAS 映射和威胁 ID，并验证风险等级
3. **文档化** —— 我们确保所有内容格式正确且完整
4. **合并** —— 添加到威胁模型和可视化中

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 技术](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [OpenClaw 威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)

## 联系方式

- **安全漏洞：** 请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 获取报告说明
- **威胁模型问题：** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上创建 issue
- **一般讨论：** Discord `#security` 频道

## 致谢

对威胁模型做出贡献的人员，将因重大贡献而在威胁模型致谢、发布说明和 OpenClaw 安全名人堂中获得认可。

## 相关内容

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [形式化验证](/zh-CN/security/formal-verification)
