---
permalink: /security/formal-verification/
read_when:
    - 审查形式化安全模型的保证范围或限制
    - 复现或更新 TLA+/TLC 安全模型检查
summary: OpenClaw 最高风险路径的机器校验安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-04-24T04:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

本页跟踪 OpenClaw 的**形式化安全模型**（当前为 TLA+/TLC；如有需要将扩展更多）。

> 注意：一些较旧的链接可能仍使用之前的项目名称。

**目标（长期方向）：** 在明确假设前提下，提供一个经过机器校验的论证，证明 OpenClaw 按预期执行其安全策略（授权、会话隔离、工具门控以及配置错误安全性）。

**它当前是什么：** 一个可执行、攻击者驱动的**安全回归测试套件**：

- 每一项声明都有一个可运行的模型检查，对有限状态空间进行验证。
- 许多声明还配有对应的**负模型**，可为现实中的某类 bug 生成反例轨迹。

**它目前还不是什么：** 不是对“OpenClaw 在所有方面都安全”的证明，也不是对完整 TypeScript 实现正确性的证明。

## 模型存放位置

模型维护在单独的仓库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些是**模型**，不是完整的 TypeScript 实现。模型与代码之间可能存在漂移。
- 结果受限于 TLC 探索到的状态空间；“绿色通过”并不意味着在建模假设和边界之外也同样安全。
- 某些声明依赖明确的环境假设（例如，部署正确、配置输入正确）。

## 复现结果

当前，复现结果的方式是：在本地克隆模型仓库并运行 TLC（见下文）。未来的迭代可能会提供：

- 由 CI 运行的模型及公开产物（反例轨迹、运行日志）
- 面向小规模有界检查的托管式“运行此模型”工作流

快速开始：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 运行在 JVM 上）。
# 该仓库内置了固定版本的 `tla2tools.jar`（TLA+ 工具），并提供 `bin/tlc` 和 Make 目标。

make <target>
```

### Gateway 网关暴露面与开放 gateway 配置错误

**声明：** 在没有认证的情况下绑定到 loopback 之外，可能导致远程入侵成为可能 / 增加暴露面；token/password 可阻止未经认证的攻击者（基于模型假设）。

- 绿色通过运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另见：模型仓库中的 `docs/gateway-exposure-matrix.md`。

### 节点 exec 管道（最高风险能力）

**声明：** `exec host=node` 需要同时满足：(a) 节点命令 allowlist 加已声明命令，以及 (b) 在有配置时需要实时审批；审批在模型中采用 token 化以防止重放。

- 绿色通过运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（私信门控）

**声明：** 配对请求遵守 TTL 和待处理请求数量上限。

- 绿色通过运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入口门控（提及 + 控制命令绕过）

**声明：** 在要求提及的群组上下文中，未经授权的“控制命令”无法绕过提及门控。

- 绿色通过：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/会话键隔离

**声明：** 来自不同对端的私信不会合并到同一个会话中，除非经过显式关联/配置。

- 绿色通过：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`

## v1++：附加的有界模型（并发、重试、轨迹正确性）

这些是后续模型，用于在真实世界故障模式（非原子更新、重试和消息扇出）周围提升保真度。

### 配对存储并发性 / 幂等性

**声明：** 即使在交错执行下，配对存储也应强制执行 `MaxPending` 和幂等性（也就是说，“检查后写入”必须是原子操作 / 加锁；刷新不应创建重复项）。

其含义：

- 在并发请求下，某个渠道的待处理项不能超过 `MaxPending`。
- 对相同 `(channel, sender)` 的重复请求/刷新，不应创建重复的活动待处理记录。

- 绿色通过运行：
  - `make pairing-race`（原子/加锁的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子的 begin/commit 上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入口轨迹关联 / 幂等性

**声明：** 摄取流程应在扇出过程中保留轨迹关联，并在 provider 重试下保持幂等。

其含义：

- 当一个外部事件变成多个内部消息时，每个部分都保留相同的 trace/event 标识。
- 重试不会导致重复处理。
- 如果 provider 事件 ID 缺失，去重会回退到安全键（例如 trace ID），以避免错误丢弃不同事件。

- 绿色通过：
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 红色（预期）：
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 路由 dmScope 优先级 + identityLinks

**声明：** 路由必须默认保持私信会话隔离，并且仅在显式配置时才合并会话（渠道优先级 + 身份链接）。

其含义：

- 渠道级 dmScope 覆盖必须优先于全局默认值。
- identityLinks 应只在显式链接组内部触发合并，而不能跨不相关对端合并。

- 绿色通过：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 相关内容

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [参与威胁模型贡献](/zh-CN/security/CONTRIBUTING-THREAT-MODEL)
