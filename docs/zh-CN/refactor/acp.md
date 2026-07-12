---
read_when:
    - 重构 ACP 会话生命周期或 ACPX 进程清理
    - 调试 ACPX 孤儿进程、PID 重用或多 Gateway 网关清理安全性
    - 更改已生成的 ACP 或子智能体会话的 `sessions_list` 可见性
    - 为后台任务、ACP 会话或进程租约设计所有权元数据
sidebarTitle: ACP lifecycle refactor
summary: 明确 ACP 会话和 ACPX 进程所有权的迁移计划
title: ACP 生命周期重构
x-i18n:
    generated_at: "2026-07-11T20:55:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

ACP 生命周期目前可以正常工作，但其中太多内容是在事后推断的。
进程清理通过 PID、命令字符串、包装器路径和实时进程表来重建所有权。会话可见性通过会话键字符串以及辅助的 `sessions.list({ spawnedBy })` 查询来重建所有权。
这使得针对性修复成为可能，但也很容易遗漏边界情况：
PID 重用、带引号的命令、适配器的孙进程、多 Gateway 网关状态根目录、
`cancel` 与 `close`，以及 `tree` 与 `all` 可见性，都成了需要分别重新推导同一套所有权规则的地方。

本次重构将所有权提升为一等概念。目标不是新增 ACP 产品表面，
而是为现有 ACP 和 ACPX 行为提供更安全的内部契约。

## 目标

- 除非当前实时证据与 OpenClaw 所有的租约匹配，否则清理绝不向进程发送信号。
- `cancel`、`close` 和启动时回收具有不同的生命周期意图。
- `sessions_list`、`sessions_history`、`sessions_send` 和状态检查使用相同的请求方所有会话模型。
- 多 Gateway 网关安装不能回收彼此的 ACPX 包装器。
- 迁移期间，旧 ACPX 会话记录继续有效。
- 运行时仍归插件所有；核心无需了解 ACPX 软件包细节。

## 非目标

- 替换 ACPX 或更改公开的 `/acp` 命令表面。
- 将特定供应商的 ACP 适配器行为移入核心。
- 要求用户在升级前手动清理状态。
- 让 `cancel` 关闭可复用的 ACP 会话。

## 目标模型

### Gateway 网关实例标识

每个 Gateway 网关进程都应具有稳定的运行时实例 ID：

```ts
type GatewayInstanceId = string;
```

它可以在 Gateway 网关启动时生成，并在该安装的生命周期内持久化到状态中。
它不是安全密钥，而是用于区分所有权的标识符，以避免将一个 Gateway 网关的 ACP 进程与另一个 Gateway 网关的进程混淆。

### ACP 会话所有权

每个生成的 ACP 会话都应具有规范化的所有权元数据：

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway 网关应在已知这些字段的会话行中返回它们。
可见性过滤应是对行元数据的纯检查：

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

这会从可见性检查中移除隐藏的辅助 `sessions.list({ spawnedBy })` 调用。
生成的跨智能体 ACP 子会话归请求方所有，是因为该行明确如此标示，而不是因为第二次查询碰巧找到了它。

### ACPX 进程租约

每次生成包装器启动时，都应创建一条租约记录：

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

包装器进程应通过其环境变量接收租约 ID 和 Gateway 网关实例 ID：

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

在平台允许时，验证应优先使用不会因命令引号而混淆的实时进程元数据：

- 根 PID 仍然存在
- 实时包装器路径位于 `wrapperRoot` 下
- 如果进程组可用，则与租约匹配
- 如果环境变量可读，则其中包含预期的租约 ID
- 命令哈希或可执行文件路径与租约匹配

如果无法验证实时进程，清理将以拒绝执行的方式安全失败。

## 生命周期控制器

引入一个负责进程租约和清理策略的 ACPX 生命周期控制器：

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` 仅请求取消当前轮次。它不得回收可复用的包装器或适配器进程。

`closeSession` 可以执行回收，但必须先加载会话记录、加载租约，并验证实时进程树仍归该租约所有。

`reapStartupOrphans` 从状态中的开放租约开始。它可以使用进程表查找后代进程，但不应先扫描任意看似 ACP 的命令，再认定它们可能归我们所有。

## 包装器契约

生成的包装器应保持精简。它们应：

- 在支持的平台上，在进程组中启动适配器
- 将常规终止信号转发给进程组
- 检测父进程死亡
- 父进程死亡时发送 SIGTERM，然后让包装器保持存活，直到执行 SIGKILL 回退
- 在可用时，将根 PID 和进程组 ID 报告给生命周期控制器

包装器不应决定会话策略。它们只对自身适配器进程组执行本地进程树清理。

## 会话可见性契约

可见性应使用规范化的行所有权：

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

规则：

- `self`：仅请求方会话。
- `tree`：请求方会话，以及归请求方所有或由请求方生成的行。
- `all`：所有同智能体行、a2a 允许的跨智能体行，以及归请求方所有的已生成跨智能体行，即使常规 a2a 已禁用。
- `agent`：仅限同一智能体，除非显式所有者关系表明该行归请求方所有。

这使 `tree` 和 `all` 具有单调性：`all` 不得隐藏 `tree` 会显示的自有子会话。

## 迁移计划

### 阶段 1：添加标识和租约

- 向 Gateway 网关状态添加 `gatewayInstanceId`。
- 在 ACPX 状态目录下添加 ACPX 租约存储。
- 在生成包装器进程前写入租约。
- 在新的 ACPX 会话记录中存储 `leaseId`。
- 为旧记录保留现有 PID 和命令字段。

### 阶段 2：租约优先清理

- 更改关闭清理逻辑，优先加载 `leaseId`。
- 发送信号前，根据租约验证实时进程所有权。
- 仅对旧记录保留当前的根 PID 和包装器根目录回退。
- 完成经过验证的清理后，将租约标记为 `closed`。
- 清理前进程已消失时，将租约标记为 `lost`。

### 阶段 3：租约优先的启动时回收

- 启动时回收扫描开放租约。
- 对每个租约验证根进程并收集后代进程。
- 按子进程优先的顺序回收已验证的进程树。
- 使用有界保留期清除旧的 `closed` 和 `lost` 租约。
- 仅将命令标记扫描保留为临时的旧版回退，并尽可能使用包装器根目录和 Gateway 网关实例进行约束。

### 阶段 4：会话所有权行

- 向 Gateway 网关会话行添加所有权元数据。
- 让 ACPX、子智能体、后台任务和会话存储写入方填充 `ownerSessionKey` 或 `spawnedBy`。
- 将会话可见性检查改为使用行元数据。
- 移除可见性检查期间的辅助 `sessions.list({ spawnedBy })` 查询。

### 阶段 5：移除旧版启发式逻辑

经过一个发布周期后：

- 停止依赖存储的根命令字符串来清理非旧版 ACPX
- 移除启动时的命令标记扫描
- 移除可见性回退列表查询
- 对缺失或无法验证的租约保留防御性的安全拒绝行为

## 测试

添加两套表驱动测试。

进程生命周期模拟器：

- PID 被无关进程重用
- PID 被另一个 Gateway 网关包装器根进程重用
- 存储的包装器命令经过 shell 引号处理，但实时 `ps` 命令未经过处理
- 适配器子进程退出，但孙进程仍留在进程组中
- 父进程死亡后的 SIGTERM 回退最终执行 SIGKILL
- 进程列表不可用
- 进程缺失的过期租约
- 包含包装器、适配器子进程和孙进程的启动孤儿进程

会话可见性矩阵：

- `self`、`tree`、`agent`、`all`
- a2a 启用和禁用
- 同智能体行
- 跨智能体行
- 归请求方所有的已生成跨智能体 ACP 行
- 沙箱隔离的请求方被限制为 `tree`
- 列表、历史记录、发送和状态操作

重要的不变量：只要配置的可见性包含请求方会话树，归请求方所有的已生成子会话就可见，并且 `all` 的能力不得弱于 `tree`。

## 兼容性说明

旧会话记录可能没有 `leaseId`。它们应使用旧版的安全拒绝清理路径：

- 要求实时根进程存在
- 预期使用生成的包装器时，要求包装器根目录所有权匹配
- 对非包装器根进程，要求命令一致
- 绝不只根据过期的已存储 PID 元数据发送信号

如果无法验证旧记录，则保持不动。启动时租约清理和下一个发布周期最终应淘汰该回退路径。

## 成功标准

- 关闭旧的或过期的 ACPX 会话时，不能终止另一个 Gateway 网关的进程。
- 父进程死亡后，不会留下顽固运行的适配器孙进程。
- `cancel` 中止当前活动轮次，但不关闭可复用会话。
- `sessions_list` 可以在 `tree` 和 `all` 下显示归请求方所有的跨智能体 ACP 子会话。
- 启动时清理由租约驱动，而不是依赖宽泛的命令字符串扫描。
- 针对进程和可见性矩阵的专项测试覆盖此前需要逐一审查修复的每个边界情况。
