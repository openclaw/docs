---
permalink: /security/formal-verification/
read_when:
    - 审查形式化安全模型保证或限制
    - 复现或更新 TLA+/TLC 安全模型检查
summary: OpenClaw 最高风险路径的机器校验安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-07-05T11:41:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw 的形式化安全模型（目前为 TLA+/TLC）提供了经机器检查的论证：在明确声明的假设下，特定的最高风险路径——授权、会话隔离、工具门控和错误配置安全——会执行其预期策略。

> 注意：一些旧链接可能会引用之前的项目名称。

## 这是什么

一个可执行的、由攻击者驱动的安全回归套件：

- 每个声明都有一个可在有限状态空间上运行的模型检查。
- 许多声明都有配套的负向模型，可为现实的错误类别生成反例轨迹。

这**不是**证明 OpenClaw 在所有方面都是安全的，也不会验证完整的 TypeScript 实现。

## 模型存放位置

模型维护在单独的仓库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
该仓库目前无法访问（截至撰写本文时，GitHub 返回 “Repository not found”）。如果你这里仍然无法访问，请先在 OpenClaw 维护者渠道询问当前位置，再假设模型已被移除。
</Note>

## 注意事项

- 这些是模型，不是完整的 TypeScript 实现——模型和代码之间可能发生漂移。
- 结果受 TLC 探索的状态空间限制。绿色并不意味着在建模假设和边界之外也具备安全性。
- 一些声明依赖明确的环境假设（例如正确部署和正确配置输入）。

## 复现结果

克隆模型仓库并运行 TLC：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

目前还没有 CI 集成回此仓库；未来的迭代可以添加由 CI 运行的模型，并提供公开产物（反例轨迹、运行日志），或为小型有界检查提供托管的 “运行此模型” 工作流。

## 声明和目标

### Gateway 网关暴露和开放 Gateway 网关错误配置

**声明：**在没有认证的情况下绑定到超出环回地址的范围，可能导致远程入侵并增加暴露面；根据模型假设，令牌/密码会阻止未认证攻击者。

| 结果         | 目标                                                             |
| -------------- | ---------------------------------------------------------------- |
| 绿色          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 红色（预期） | `make gateway-exposure-v2-negative`                              |

另请参阅模型仓库中的 `docs/gateway-exposure-matrix.md`。

### Node exec 管道（最高风险能力）

**声明：**在模型中，`exec host=node` 需要 (a) 节点命令允许列表加声明的命令，以及 (b) 在配置时进行实时审批；审批会被令牌化以防止重放。

| 结果         | 目标                                                            |
| -------------- | --------------------------------------------------------------- |
| 绿色          | `make nodes-pipeline`, `make approvals-token`                   |
| 红色（预期） | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 配对存储（私信门控）

**声明：**配对请求遵守 TTL 和待处理请求上限。

| 结果         | 目标                                                 |
| -------------- | ---------------------------------------------------- |
| 绿色          | `make pairing`, `make pairing-cap`                   |
| 红色（预期） | `make pairing-negative`, `make pairing-cap-negative` |

### 入口门控（提及和控制命令绕过）

**声明：**在需要提及的群组上下文中，未授权控制命令不能绕过提及门控。

| 结果         | 目标                           |
| -------------- | ------------------------------ |
| 绿色          | `make ingress-gating`          |
| 红色（预期） | `make ingress-gating-negative` |

### 路由和会话键隔离

**声明：**来自不同对等方的私信不会折叠到同一个会话中，除非显式链接或配置。

| 结果         | 目标                              |
| -------------- | --------------------------------- |
| 绿色          | `make routing-isolation`          |
| 红色（预期） | `make routing-isolation-negative` |

## v1++ 模型：并发、重试、轨迹正确性

后续模型围绕真实故障模式收紧保真度：非原子更新、重试和消息扇出。

### 配对存储并发和幂等性

**声明：**即使在交错执行下，配对存储也会执行 `MaxPending` 和幂等性——检查后写入必须是原子/加锁的，刷新不得创建重复项。具体而言：并发请求不能超过某个渠道的 `MaxPending`，并且同一 `(channel, sender)` 的重复请求/刷新不会创建重复的实时待处理行。

| 结果         | 目标                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 绿色          | `make pairing-race`（原子/加锁的上限检查），`make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                                |
| 红色（预期） | `make pairing-race-negative`（非原子的 begin/commit 上限竞争），`make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### 入口轨迹关联和幂等性

**声明：**摄取会在扇出过程中保留轨迹关联，并在提供商重试下保持幂等。当一个外部事件变成多条内部消息时，每个部分都会保留相同的轨迹/事件身份；重试不会重复处理；如果提供商事件 ID 缺失，去重会回退到安全键（例如轨迹 ID），以避免丢弃不同事件。

| 结果         | 目标                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 绿色          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 红色（预期） | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 路由 dmScope 优先级和 identityLinks

**声明：**路由默认保持私信会话隔离，并且只在通过渠道优先级和身份链接显式配置时才折叠会话。渠道特定的 `dmScope` 覆盖项优先于全局默认值；`identityLinks` 只会在显式链接组内折叠会话，不会跨无关对等方折叠。

| 结果         | 目标                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| 绿色          | `make routing-precedence`, `make routing-identitylinks`                   |
| 红色（预期） | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 相关

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [为威胁模型做贡献](/zh-CN/security/CONTRIBUTING-THREAT-MODEL)
- [事件响应](/zh-CN/security/incident-response)
