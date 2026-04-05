---
permalink: /security/formal-verification/
read_when:
    - 审查形式化安全模型的保证或限制
    - 复现或更新 TLA+/TLC 安全模型检查
summary: 对 OpenClaw 最高风险路径进行机器校验的安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-04-05T10:09:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# 形式化验证（安全模型）

本页跟踪 OpenClaw 的**形式化安全模型**（当前为 TLA+/TLC；如有需要将增加更多）。

> 注意：一些较旧的链接可能仍引用之前的项目名称。

**目标（北极星）：** 在明确假设下，提供一个经过机器校验的论证，证明 OpenClaw 能够执行其预期的安全策略（授权、会话隔离、工具门控和错误配置安全）。

**这目前是什么：** 一套可执行、由攻击者驱动的**安全回归测试套件**：

- 每一项声明都有一个可运行的、针对有限状态空间的模型检查。
- 许多声明都配有一个对应的**负向模型**，可为现实中的某类 bug 生成反例轨迹。

**这目前不是什么：** 它还不是对“OpenClaw 在所有方面都是安全的”的证明，也不是对完整 TypeScript 实现正确性的证明。

## 模型存放位置

模型维护在一个单独的仓库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些是**模型**，不是完整的 TypeScript 实现。模型与代码之间可能发生漂移。
- 结果受 TLC 所探索状态空间的限制；“绿色”并不意味着超出建模假设和边界之外的安全性。
- 某些声明依赖于明确的环境假设（例如正确部署、正确的配置输入）。

## 复现结果

目前，要复现结果，需要在本地克隆模型仓库并运行 TLC（见下文）。未来版本可能会提供：

- 在 CI 中运行模型并公开产物（反例轨迹、运行日志）
- 一个托管的“小型有界检查运行此模型”工作流

快速开始：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 运行在 JVM 上）。
# 该仓库内置了固定版本的 `tla2tools.jar`（TLA+ 工具），并提供 `bin/tlc` 和 Make 目标。

make <target>
```

### Gateway 网关暴露与开放 Gateway 网关错误配置

**声明：** 在无认证的情况下绑定到 loopback 之外，可能使远程攻陷成为可能 / 增加暴露面；令牌/密码会阻止未经授权的攻击者（基于模型假设）。

- 绿色运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另见：模型仓库中的 `docs/gateway-exposure-matrix.md`。

### 节点 exec 流水线（最高风险能力）

**声明：** `exec host=node` 需要：(a) 节点命令 allowlist 加上已声明命令，以及 (b) 在已配置时进行实时审批；审批会被令牌化以防止重放（在模型中）。

- 绿色运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（私信门控）

**声明：** 配对请求会遵守 TTL 和待处理请求上限。

- 绿色运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入站门控（提及 + 控制命令绕过）

**声明：** 在需要提及的群组上下文中，未授权的“控制命令”不能绕过提及门控。

- 绿色：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/会话键隔离

**声明：** 来自不同对等方的私信不会折叠到同一个会话中，除非经过显式链接/配置。

- 绿色：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`

## v1++：其他有界模型（并发、重试、轨迹正确性）

这些是后续模型，用于在真实世界故障模式（非原子更新、重试和消息扇出）方面提高保真度。

### 配对存储并发 / 幂等性

**声明：** 即使在交错执行下，配对存储也应强制执行 `MaxPending` 和幂等性（即“先检查再写入”必须是原子的 / 已加锁；刷新不应创建重复项）。

其含义：

- 在并发请求下，某个渠道的 `MaxPending` 不能被超出。
- 对同一个 `(channel, sender)` 的重复请求/刷新不应创建重复的活动待处理行。

- 绿色运行：
  - `make pairing-race`（原子/加锁的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子的 begin/commit 上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入站轨迹关联 / 幂等性

**声明：** 摄取过程应在扇出过程中保留轨迹关联，并在提供商重试下保持幂等。

其含义：

- 当一个外部事件变成多个内部消息时，每一部分都保留相同的轨迹/事件身份。
- 重试不会导致重复处理。
- 如果缺少提供商事件 ID，去重会回退到一个安全键（例如轨迹 ID），以避免错误丢弃不同事件。

- 绿色：
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

**声明：** 路由默认必须保持私信会话隔离，并且只有在显式配置时才会折叠会话（渠道优先级 + identity links）。

其含义：

- 渠道专用的 dmScope 覆盖必须优先于全局默认值。
- identityLinks 应只在显式链接组内折叠，而不能跨不相关的对等方折叠。

- 绿色：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
