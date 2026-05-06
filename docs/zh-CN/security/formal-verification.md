---
permalink: /security/formal-verification/
read_when:
    - 审查正式安全模型的保证或限制
    - 复现或更新 TLA+/TLC 安全模型检查
summary: 面向 OpenClaw 最高风险路径的机器校验安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-05-06T03:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

此页面跟踪 OpenClaw 的**形式化安全模型**（目前为 TLA+/TLC；后续按需增加）。

> 注意：一些较旧的链接可能会引用之前的项目名称。

**目标（核心目标）：**在明确假设下，提供一个经过机器检验的论证，证明 OpenClaw 会执行其
预期安全策略（授权、会话隔离、工具门控和
误配置安全性）。

**目前它是什么：**一个可执行、由攻击者驱动的**安全回归套件**：

- 每个声明都有一个可运行的模型检查，覆盖有限状态空间。
- 许多声明都有配对的**负向模型**，可为现实中的缺陷类别生成反例轨迹。

**它还不是：**证明“OpenClaw 在所有方面都是安全的”，或证明完整 TypeScript 实现是正确的。

## 模型的位置

模型维护在一个独立仓库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些是**模型**，不是完整的 TypeScript 实现。模型和代码之间可能存在偏移。
- 结果受 TLC 探索的状态空间约束；“绿色”并不意味着在建模的假设和边界之外也具有安全性。
- 一些声明依赖明确的环境假设（例如，正确的部署、正确的配置输入）。

## 复现结果

目前，结果通过在本地克隆模型仓库并运行 TLC 来复现（见下文）。未来迭代可以提供：

- 由 CI 运行的模型以及公开制品（反例轨迹、运行日志）
- 面向小型、有界检查的托管式“运行此模型”工作流

入门指南：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway 网关暴露和开放 Gateway 网关误配置

**声明：**在没有身份验证的情况下绑定到 loopback 之外，可能使远程攻陷成为可能 / 增加暴露面；token/password 会阻止未认证攻击者（基于模型假设）。

- 绿色运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另请参见：模型仓库中的 `docs/gateway-exposure-matrix.md`。

### Node exec 流水线（最高风险能力）

**声明：**`exec host=node` 需要 (a) 节点命令允许列表以及声明的命令，并且 (b) 在配置时需要实时批准；批准会被标记化以防止重放（在模型中）。

- 绿色运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（私信门控）

**声明：**配对请求遵守 TTL 和待处理请求上限。

- 绿色运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入站门控（提及 + 控制命令绕过）

**声明：**在需要提及的群组上下文中，未授权的“控制命令”不能绕过提及门控。

- 绿色：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/会话键隔离

**声明：**来自不同对等方的私信不会折叠到同一个会话中，除非已明确链接/配置。

- 绿色：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`

## v1++：额外的有界模型（并发、重试、轨迹正确性）

这些是后续模型，用于围绕真实世界故障模式（非原子更新、重试和消息扇出）收紧保真度。

### 配对存储并发 / 幂等性

**声明：**配对存储即使在交错执行下也应执行 `MaxPending` 和幂等性（即“先检查再写入”必须是原子的 / 加锁的；刷新不应创建重复项）。

含义：

- 在并发请求下，不能超过某个渠道的 `MaxPending`。
- 对同一 `(channel, sender)` 的重复请求/刷新不应创建重复的有效待处理行。

- 绿色运行：
  - `make pairing-race`（原子/加锁的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子 begin/commit 上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入站轨迹关联 / 幂等性

**声明：**摄取应在扇出过程中保留轨迹关联，并且在提供商重试时保持幂等。

含义：

- 当一个外部事件变成多条内部消息时，每个部分都保留相同的轨迹/事件身份。
- 重试不会导致重复处理。
- 如果缺少提供商事件 ID，去重会回退到安全键（例如 trace ID），以避免丢弃不同的事件。

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

**声明：**路由必须默认保持私信会话隔离，并且仅在明确配置时折叠会话（渠道优先级 + 身份链接）。

含义：

- 渠道特定的 dmScope 覆盖必须优先于全局默认值。
- identityLinks 只应在明确链接的组内折叠，而不能跨不相关的对等方折叠。

- 绿色：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 相关

- [威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)
- [为威胁模型做贡献](/zh-CN/security/CONTRIBUTING-THREAT-MODEL)
