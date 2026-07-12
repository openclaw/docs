---
permalink: /security/formal-verification/
read_when:
    - 审查正式安全模型的保证或限制
    - 复现或更新 TLA+/TLC 安全模型检查
summary: 针对 OpenClaw 最高风险路径的机器校验安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-07-11T20:56:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw 的形式化安全模型（目前使用 TLA+/TLC）在明确陈述的假设下，通过机器检查论证特定的最高风险路径——授权、会话隔离、工具门控和错误配置安全——能够执行其预期策略。

> 注意：一些较早的链接可能使用了项目之前的名称。

## 这是什么

一套可执行、由攻击者行为驱动的安全回归测试套件：

- 每项主张都有一个可在有限状态空间内运行的模型检查。
- 许多主张都配有一个负向模型，用于为现实中的一类缺陷生成反例轨迹。

这**并不**证明 OpenClaw 在所有方面都是安全的，也不验证完整的 TypeScript 实现。

## 模型存放位置

模型在单独的仓库中维护：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
该仓库目前无法访问（截至本文撰写时，GitHub 返回“Repository not found”）。如果你仍然无法访问，请先在 OpenClaw 维护者渠道中询问当前位置，不要直接认定这些模型已被移除。
</Note>

## 注意事项

- 这些是模型，而非完整的 TypeScript 实现——模型与代码之间可能存在偏差。
- 结果受 TLC 所探索状态空间的限制。检查通过并不意味着在建模假设和边界之外也能保证安全。
- 某些主张依赖明确的环境假设（例如正确部署以及提供正确的配置输入）。

## 复现结果

克隆模型仓库并运行 TLC：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 在 JVM 上运行）。
# 该仓库内置了固定版本的 tla2tools.jar，并提供 bin/tlc 和 Make 目标。

make <target>
```

目前尚未与本仓库的 CI 集成；后续迭代可以加入由 CI 运行的模型并提供公开产物（反例轨迹、运行日志），也可以为小型有界检查提供托管式“运行此模型”工作流。

## 主张和目标

### Gateway 网关暴露和开放式 Gateway 网关错误配置

**主张：**根据模型的假设，在没有身份验证的情况下绑定到 local loopback 之外的地址可能导致远程入侵，并扩大暴露范围；令牌或密码可以阻止未经身份验证的攻击者。

| 结果           | 目标                                                             |
| -------------- | ---------------------------------------------------------------- |
| 通过           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 未通过（预期） | `make gateway-exposure-v2-negative`                              |

另请参阅模型仓库中的 `docs/gateway-exposure-matrix.md`。

### 节点 Exec 流水线（最高风险能力）

**主张：**在模型中，`exec host=node` 要求：(a) 节点命令允许列表和已声明的命令；以及 (b) 配置后进行实时审批；审批使用令牌化机制来防止重放。

| 结果           | 目标                                                            |
| -------------- | --------------------------------------------------------------- |
| 通过           | `make nodes-pipeline`, `make approvals-token`                   |
| 未通过（预期） | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 配对存储（私信门控）

**主张：**配对请求遵循 TTL 和待处理请求数量上限。

| 结果           | 目标                                                 |
| -------------- | ---------------------------------------------------- |
| 通过           | `make pairing`, `make pairing-cap`                   |
| 未通过（预期） | `make pairing-negative`, `make pairing-cap-negative` |

### 入口门控（提及和控制命令绕过）

**主张：**在要求提及的群组上下文中，未经授权的控制命令无法绕过提及门控。

| 结果           | 目标                           |
| -------------- | ------------------------------ |
| 通过           | `make ingress-gating`          |
| 未通过（预期） | `make ingress-gating-negative` |

### 路由和会话键隔离

**主张：**除非明确链接或配置，否则来自不同对等方的私信不会合并到同一会话中。

| 结果           | 目标                              |
| -------------- | --------------------------------- |
| 通过           | `make routing-isolation`          |
| 未通过（预期） | `make routing-isolation-negative` |

## v1++ 模型：并发、重试和轨迹正确性

后续模型进一步提高了对现实故障模式的还原度，包括非原子更新、重试和消息扇出。

### 配对存储的并发性和幂等性

**主张：**即使在操作交错的情况下，配对存储也会执行 `MaxPending` 限制并保证幂等性——先检查后写入的操作必须是原子操作或受锁保护，并且刷新不得创建重复项。具体而言：并发请求不能超过某个渠道的 `MaxPending`，针对同一 `(channel, sender)` 的重复请求或刷新不会创建重复的有效待处理行。

| 结果           | 目标                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过           | `make pairing-race`（原子操作或受锁保护的上限检查）、`make pairing-idempotency`、`make pairing-refresh`、`make pairing-refresh-race`                                        |
| 未通过（预期） | `make pairing-race-negative`（非原子的开始/提交上限竞争）、`make pairing-idempotency-negative`、`make pairing-refresh-negative`、`make pairing-refresh-race-negative` |

### 入口轨迹关联和幂等性

**主张：**入口处理在扇出过程中保留轨迹关联，并在提供商重试时保持幂等。当一个外部事件变为多条内部消息时，每个部分都保留相同的轨迹/事件标识；重试不会导致重复处理；如果缺少提供商事件 ID，去重机制会回退到安全的键（例如轨迹 ID），以避免丢弃不同的事件。

| 结果           | 目标                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 未通过（预期） | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 路由 `dmScope` 优先级和 `identityLinks`

**主张：**路由默认保持私信会话相互隔离，仅在通过渠道优先级和身份链接进行明确配置时才合并会话。渠道专属的 `dmScope` 覆盖项优先于全局默认值；`identityLinks` 仅在明确链接的组内合并会话，不会跨不相关的对等方合并。

| 结果           | 目标                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| 通过           | `make routing-precedence`, `make routing-identitylinks`                   |
| 未通过（预期） | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 相关内容

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [为威胁模型做贡献](/zh-CN/security/CONTRIBUTING-THREAT-MODEL)
- [事件响应](/zh-CN/security/incident-response)
