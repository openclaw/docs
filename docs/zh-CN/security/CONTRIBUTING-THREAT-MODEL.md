---
read_when:
    - 你想要贡献安全发现或威胁场景
    - 审查或更新威胁模型
summary: 如何为 OpenClaw 威胁模型做贡献
title: 为威胁模型做贡献
x-i18n:
    generated_at: "2026-04-27T07:13:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# 为 OpenClaw 威胁模型做贡献

感谢你帮助提升 OpenClaw 的安全性。这个威胁模型是一份持续演进的文档，我们欢迎任何人贡献内容——你不需要是安全专家。

## 贡献方式

### 添加威胁

发现了我们尚未覆盖的攻击向量或风险？请在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上创建 issue，并用你自己的话描述它。你不需要了解任何框架，也不需要填写每个字段——只需描述这个场景即可。

**建议包含的内容（但不是必需）：**

- 攻击场景以及它可能如何被利用
- OpenClaw 的哪些部分受到影响（CLI、Gateway 网关、渠道、ClawHub、MCP 服务器等）
- 你认为它有多严重（低 / 中 / 高 / 严重）
- 任何相关研究、CVE 或真实案例的链接

我们会在审查期间处理 ATLAS 映射、威胁 ID 和风险评估。如果你想包含这些细节，也很好——但并不要求。

> **这里用于向威胁模型补充内容，而不是报告正在发生的漏洞。** 如果你发现了一个可被利用的漏洞，请查看我们的 [Trust 页面](https://trust.openclaw.ai) 了解负责任披露说明。

### 建议缓解措施

如果你对如何应对现有威胁有想法，请创建引用该威胁的 issue 或 PR。有效的缓解措施应具体且可执行——例如，“在 Gateway 网关按发送者实施每分钟 10 条消息的速率限制” 比 “实现速率限制” 更好。

### 提出攻击链

攻击链展示了多个威胁如何组合成现实中的攻击场景。如果你发现某种危险组合，请描述各个步骤，以及攻击者会如何将它们串联起来。相比正式模板，一段简短的攻击实际展开过程叙述更有价值。

### 修复或改进现有内容

错字、澄清说明、过时信息、更好的示例——欢迎提交 PR，无需先开 issue。

## 我们使用什么

### MITRE ATLAS

这个威胁模型基于 [MITRE ATLAS](https://atlas.mitre.org/)（面向 AI 系统的对抗性威胁态势，Adversarial Threat Landscape for AI Systems）构建，这是一个专为 AI/ML 威胁设计的框架，例如提示注入、工具滥用和智能体利用。你不需要了解 ATLAS 才能贡献——我们会在审查时将提交内容映射到该框架。

### 威胁 ID

每个威胁都会获得一个类似 `T-EXEC-003` 的 ID。分类如下：

| 代码 | 类别 |
| ------- | ------------------------------------------ |
| RECON   | 侦察——信息收集 |
| ACCESS  | 初始访问——获得入口 |
| EXEC    | 执行——运行恶意操作 |
| PERSIST | 持久化——维持访问 |
| EVADE   | 防御规避——避免被检测 |
| DISC    | 发现——了解环境 |
| EXFIL   | 数据外传——窃取数据 |
| IMPACT  | 影响——破坏或中断 |

ID 由维护者在审查期间分配。你不需要自己挑选。

### 风险等级

| 等级 | 含义 |
| ------------ | ----------------------------------------------------------------- |
| **严重** | 完整系统失陷，或高概率 + 严重影响 |
| **高** | 很可能造成重大损害，或中等概率 + 严重影响 |
| **中** | 中等风险，或低概率 + 高影响 |
| **低** | 发生可能性低且影响有限 |

如果你不确定风险等级，只需描述影响，我们会进行评估。

## 审查流程

1. **分流**——我们会在 48 小时内审查新的提交
2. **评估**——我们验证其可行性，分配 ATLAS 映射和威胁 ID，并确认风险等级
3. **文档整理**——我们确保所有内容格式正确且信息完整
4. **合并**——添加到威胁模型和可视化中

## 资源

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw 威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)

## 联系方式

- **安全漏洞：** 请查看我们的 [Trust 页面](https://trust.openclaw.ai) 获取报告说明
- **威胁模型问题：** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上创建 issue
- **一般讨论：** Discord `#security` 渠道

## 致谢

对威胁模型作出贡献的人员，将在威胁模型致谢、发布说明以及 OpenClaw 安全名人堂中获得认可，尤其是作出重大贡献时。

## 相关内容

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [形式化验证](/zh-CN/security/formal-verification)
