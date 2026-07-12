---
read_when:
    - 你想要贡献安全发现或威胁场景
    - 审查或更新威胁模型
summary: 如何为 OpenClaw 威胁模型做出贡献
title: 为威胁模型做贡献
x-i18n:
    generated_at: "2026-07-11T20:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)是一份持续更新的文档。欢迎任何人贡献；你不需要具备安全或 MITRE ATLAS 方面的背景知识。

<Note>
本页用于向威胁模型添加内容，而不是报告实际存在的漏洞。如果你发现了可利用的漏洞，请改为遵循[信任页面](https://trust.openclaw.ai)上的负责任披露说明。
</Note>

## 贡献方式

**添加威胁。** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 中创建议题，用你自己的话描述攻击场景。以下信息会有帮助，但并非必需：

- 攻击场景及其可能被利用的方式。
- 受影响的组件（CLI、Gateway 网关、渠道、ClawHub、MCP 服务器等）。
- 你对严重程度的估计（低 / 中 / 高 / 严重）。
- 相关研究、CVE 或真实案例的链接。

维护者会在审查期间分配 ATLAS 映射、威胁 ID 和风险级别。

**建议缓解措施。** 创建引用该威胁的议题或 PR。建议应具体且可执行：“在 Gateway 网关处针对每个发送者实施每分钟 10 条消息的速率限制”比“实施速率限制”更有帮助。

**提出攻击链。** 攻击链展示多个威胁如何组合成现实场景。请描述具体步骤以及攻击者如何将它们串联起来；简短的叙述比正式模板更有效。

**修复或改进现有内容。** 错别字、澄清说明、过时信息和更好的示例：欢迎提交 PR，无需先创建议题。

## 框架参考

威胁会映射到 [MITRE ATLAS](https://atlas.mitre.org/)（AI 系统对抗性威胁图谱），这是一个面向提示词注入、工具滥用和智能体利用等 AI/ML 特定威胁的框架。贡献时不需要了解 ATLAS；维护者会在审查期间映射提交的内容。

**威胁 ID。** 每项威胁都会获得一个类似 `T-EXEC-003` 的 ID，由维护者在审查期间分配。

| 代码    | 类别                               |
| ------- | ---------------------------------- |
| RECON   | 侦察——收集信息                     |
| ACCESS  | 初始访问——获取入口                 |
| EXEC    | 执行——运行恶意操作                 |
| PERSIST | 持久化——维持访问权限               |
| EVADE   | 规避防御——避免被检测               |
| DISC    | 设备发现——了解环境                 |
| EXFIL   | 数据外泄——窃取数据                 |
| IMPACT  | 影响——造成破坏或中断               |

**风险级别。** 如果你不确定级别，只需描述影响；维护者会进行评估。

| 级别       | 含义                                             |
| ---------- | ------------------------------------------------ |
| **严重**   | 系统完全失陷，或发生可能性高且影响严重           |
| **高**     | 很可能造成重大损害，或发生可能性中等且影响严重   |
| **中**     | 风险中等，或发生可能性低但影响较大               |
| **低**     | 不太可能发生且影响有限                           |

## 审查流程

1. **分类处理**——新提交内容会在 48 小时内接受审查。
2. **评估**——维护者验证可行性、分配 ATLAS 映射和威胁 ID，并确认风险级别。
3. **文档整理**——检查格式和完整性。
4. **合并**——添加到威胁模型及其可视化中。

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 技术](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)

## 联系方式

- **安全漏洞：** 通过[信任页面](https://trust.openclaw.ai)查看报告说明，或发送邮件至 `security@openclaw.ai`。
- **威胁模型相关问题：** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 中创建议题。
- **一般交流：** Discord `#security` 渠道。

## 贡献认可

威胁模型的贡献者会列入威胁模型致谢和发布说明；做出重大贡献者还会列入 OpenClaw 安全名人堂。

## 相关内容

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [事件响应](/zh-CN/security/incident-response)
- [形式化验证](/zh-CN/security/formal-verification)
