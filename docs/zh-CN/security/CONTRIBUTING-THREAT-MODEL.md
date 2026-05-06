---
read_when:
    - 你想贡献安全发现或威胁场景
    - 审查或更新威胁模型
summary: 如何为 OpenClaw 威胁模型做贡献
title: 为威胁模型做贡献
x-i18n:
    generated_at: "2026-05-06T16:11:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

感谢你帮助提升 OpenClaw 的安全性。此威胁模型是一份持续更新的文档，我们欢迎任何人贡献 - 你不需要是安全专家。

## 贡献方式

### 添加威胁

发现了我们尚未覆盖的攻击向量或风险？请在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上提交 issue，并用你自己的话描述它。你不需要了解任何框架，也不需要填写每个字段 - 只要描述场景即可。

**建议包含（但不是必需）：**

- 攻击场景以及它可能如何被利用
- OpenClaw 的哪些部分受到影响（CLI、Gateway 网关、渠道、ClawHub、MCP 服务器等）
- 你认为它有多严重（低 / 中 / 高 / 严重）
- 与相关研究、CVE 或真实案例有关的任何链接

我们会在评审期间处理 ATLAS 映射、威胁 ID 和风险评估。如果你想包含这些详细信息，很好 - 但这不是必需的。

> **这用于添加到威胁模型，而不是报告实时漏洞。** 如果你发现了可利用漏洞，请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 了解负责任披露说明。

### 建议缓解措施

有解决现有威胁的想法？请提交引用该威胁的 issue 或 PR。有用的缓解措施应具体且可执行 - 例如，“在 Gateway 网关按发送者限制速率为 10 条消息/分钟”比“实现速率限制”更好。

### 提出攻击链

攻击链展示多个威胁如何组合成一个现实的攻击场景。如果你看到了危险的组合，请描述步骤以及攻击者如何将它们串联起来。对攻击在实践中如何展开的简短叙述，比正式模板更有价值。

### 修复或改进现有内容

错别字、澄清、过时信息、更好的示例 - 欢迎 PR，无需 issue。

## 我们使用的内容

### MITRE ATLAS 框架

此威胁模型基于 [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）构建，这是一个专为 AI/ML 威胁设计的框架，例如提示注入、工具误用和智能体利用。你不需要了解 ATLAS 也可以贡献 - 我们会在评审期间将提交映射到该框架。

### 威胁 ID

每个威胁都会获得类似 `T-EXEC-003` 的 ID。类别如下：

| 代码    | 类别                                   |
| ------- | ------------------------------------------ |
| RECON   | 侦察 - 信息收集     |
| ACCESS  | 初始访问 - 获取入口             |
| EXEC    | 执行 - 运行恶意操作      |
| PERSIST | 持久化 - 维持访问           |
| EVADE   | 防御规避 - 避免检测       |
| DISC    | 发现 - 了解环境 |
| EXFIL   | 外泄 - 窃取数据               |
| IMPACT  | 影响 - 破坏或干扰              |

ID 由维护者在评审期间分配。你不需要自己选择。

### 风险等级

| 等级        | 含义                                                           |
| ------------ | ----------------------------------------------------------------- |
| **严重** | 完整系统入侵，或高可能性 + 严重影响      |
| **高**     | 可能造成重大损害，或中等可能性 + 严重影响 |
| **中**   | 中等风险，或低可能性 + 高影响                    |
| **低**      | 不太可能发生且影响有限                                       |

如果你不确定风险等级，只需描述影响，我们会进行评估。

## 评审流程

1. **分流** - 我们会在 48 小时内评审新的提交
2. **评估** - 我们会验证可行性，分配 ATLAS 映射和威胁 ID，并验证风险等级
3. **文档化** - 我们会确保所有内容格式正确且完整
4. **合并** - 添加到威胁模型和可视化中

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 技术](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [OpenClaw 威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)

## 联系方式

- **安全漏洞：** 请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 了解报告说明
- **威胁模型问题：** 请在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上提交 issue
- **普通聊天：** Discord #security 渠道

## 认可

威胁模型贡献者会在威胁模型致谢、发布说明以及 OpenClaw 安全名人堂中获得认可，重大贡献尤其如此。

## 相关

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [形式化验证](/zh-CN/security/formal-verification)
