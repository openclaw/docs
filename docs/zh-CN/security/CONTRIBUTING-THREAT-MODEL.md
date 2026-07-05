---
read_when:
    - 你想贡献安全发现或威胁场景
    - 审查或更新威胁模型
summary: 如何为 OpenClaw 威胁模型做贡献
title: 为威胁模型做贡献
x-i18n:
    generated_at: "2026-07-05T11:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)是一份持续更新的文档。欢迎任何人贡献；你不需要具备安全或 MITRE ATLAS 背景。

<Note>
这是用于向威胁模型添加内容，而不是报告实时漏洞。如果你发现了可利用的漏洞，请改为遵循 [Trust 页面](https://trust.openclaw.ai)上的负责任披露说明。
</Note>

## 贡献方式

**添加威胁。** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上开启一个 issue，用你自己的话描述攻击场景。以下信息有帮助，但不是必需：

- 攻击场景以及它可能如何被利用。
- 受影响的组件（CLI、Gateway 网关、渠道、ClawHub、MCP 服务器等）。
- 你对严重程度的估计（低 / 中 / 高 / 严重）。
- 相关研究、CVE 或真实案例的链接。

维护者会在审核期间分配 ATLAS 映射、威胁 ID 和风险级别。

**建议缓解措施。** 开启一个引用该威胁的 issue 或 PR。请具体且可执行：“在 Gateway 网关对每个发送者限制为 10 条消息/分钟”比“实现速率限制”更有用。

**提出攻击链。** 攻击链展示多个威胁如何组合成一个现实场景。描述步骤以及攻击者会如何将它们串联起来；简短叙述比正式模板更有效。

**修复或改进现有内容。** 拼写错误、澄清、过时信息、更好的示例：欢迎 PR，无需 issue。

## 框架参考

威胁会映射到 [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems），这是一个面向 AI/ML 特定威胁的框架，例如提示注入、工具滥用和智能体利用。你不需要了解 ATLAS 也可以贡献；维护者会在审核期间映射提交内容。

**威胁 ID。** 每个威胁都会获得类似 `T-EXEC-003` 的 ID，由维护者在审核期间分配。

| 代码    | 类别                                   |
| ------- | ------------------------------------------ |
| RECON   | 侦察 - 信息收集     |
| ACCESS  | 初始访问 - 获取入口             |
| EXEC    | 执行 - 运行恶意操作      |
| PERSIST | 持久化 - 维持访问           |
| EVADE   | 防御规避 - 避免检测       |
| DISC    | 发现 - 了解环境 |
| EXFIL   | 外泄 - 窃取数据               |
| IMPACT  | 影响 - 破坏或中断              |

**风险级别。** 如果你不确定级别，只需描述影响；维护者会进行评估。

| 级别        | 含义                                                           |
| ------------ | ----------------------------------------------------------------- |
| **严重** | 完全系统攻陷，或高可能性 + 严重影响      |
| **高**     | 可能造成重大损害，或中等可能性 + 严重影响 |
| **中**   | 中等风险，或低可能性 + 高影响                    |
| **低**      | 可能性低且影响有限                                       |

## 审核流程

1. **分诊** - 新提交会在 48 小时内审核。
2. **评估** - 维护者验证可行性，分配 ATLAS 映射和威胁 ID，并验证风险级别。
3. **文档** - 格式和完整性检查。
4. **合并** - 添加到威胁模型和可视化中。

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 技术](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)

## 联系

- **安全漏洞：** 查看 [Trust 页面](https://trust.openclaw.ai)获取报告说明，或发送邮件至 `security@openclaw.ai`。
- **威胁模型问题：** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上开启一个 issue。
- **常规聊天：** Discord `#security` 渠道。

## 认可

威胁模型的贡献者会在威胁模型致谢、发布说明以及 OpenClaw 安全名人堂中获得认可，重大贡献会特别列出。

## 相关

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [事件响应](/zh-CN/security/incident-response)
- [形式化验证](/zh-CN/security/formal-verification)
