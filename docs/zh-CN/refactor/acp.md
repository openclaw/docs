---
read_when:
    - ACP 会话生命周期重构或 ACPX 进程清理
    - 调试 ACPX 孤儿进程、PID 重用或多 Gateway 网关清理安全性
    - 更改派生的 ACP 或子智能体会话的 sessions_list 可见性
    - 为后台任务、ACP 会话或进程租约设计所有权元数据
sidebarTitle: ACP lifecycle refactor
summary: 使 ACP 会话和 ACPX 进程所有权显式化的迁移计划
title: ACP 生命周期重构
x-i18n:
    generated_at: "2026-05-07T13:23:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ACP 生命周期目前可以工作，但太多内容是在事后推断出来的。
进程清理会从 PID、命令字符串、包装器路径和实时进程表中重建所有权。
会话可见性会从会话键字符串以及次级 `sessions.list({ spawnedBy })` 查询中重建所有权。
这让窄范围修复成为可能，但也让边缘情况很容易遗漏：
PID 重用、带引号的命令、适配器孙进程、多 Gateway 网关状态根、
`cancel` 与 `close`，以及 `tree` 与 `all` 可见性，都会变成需要重新发现同一套所有权规则的不同位置。

这次重构让所有权成为一等概念。目标不是新的 ACP 产品表面；
而是为现有 ACP 和 ACPX 行为提供更安全的内部契约。

## 目标

- 除非当前实时证据匹配一个 OpenClaw 拥有的租约，否则清理绝不向进程发送信号。
- `cancel`、`close` 和启动时回收具有不同的生命周期意图。
- `sessions_list`、`sessions_history`、`sessions_send` 和 Status 检查使用相同的请求者拥有会话模型。
- 多 Gateway 网关安装不能回收彼此的 ACPX 包装器。
- 旧 ACPX 会话记录在迁移期间继续可用。
- 运行时仍归插件所有；核心不会了解 ACPX 包详情。

## 非目标

- 替换 ACPX 或更改公开的 `/acp` 命令表面。
- 将供应商特定的 ACP 适配器行为移入核心。
- 要求用户在升级前手动清理状态。
- 让 `cancel` 关闭可复用的 ACP 会话。

## 目标模型

### Gateway 网关实例身份

每个 Gateway 网关进程都应有一个稳定的运行时实例 ID：

```ts
type GatewayInstanceId = string;
```

它可以在 Gateway 网关启动时生成，并在该安装的生命周期内持久化到状态中。
它不是安全密钥；它是一个所有权判别器，用于避免将一个 Gateway 网关的 ACP 进程与另一个 Gateway 网关的进程混淆。

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

Gateway 网关应在已知这些字段的会话行上返回它们。
可见性过滤应是对行元数据的纯检查：

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

这会从可见性检查中移除隐藏的次级 `sessions.list({ spawnedBy })` 调用。
一个生成的跨智能体 ACP 子会话归请求者所有，是因为行本身这样说明，而不是因为第二个查询碰巧找到了它。

### ACPX 进程租约

每次生成的包装器启动都应创建一条租约记录：

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

包装器进程应在其环境中接收租约 ID 和 Gateway 网关实例 ID：

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

在平台允许时，验证应优先使用不会被命令引号混淆的实时进程元数据：

- 根 PID 仍然存在
- 实时包装器路径位于 `wrapperRoot` 下
- 可用时，进程组匹配租约
- 可读时，环境包含预期租约 ID
- 命令哈希或可执行文件路径匹配租约

如果无法验证实时进程，清理应失败并保持关闭。

## 生命周期控制器

引入一个拥有进程租约和清理策略的 ACPX 生命周期控制器：

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

`cancelTurn` 只请求轮次取消。它不能回收可复用的包装器或适配器进程。

`closeSession` 允许回收，但只能在加载会话记录、加载租约，并验证实时进程树仍属于该租约之后执行。

`reapStartupOrphans` 从状态中的开放租约开始。它可以使用进程表查找后代，但不应先扫描任意看起来像 ACP 的命令，然后再判断它们可能属于我们。

## 包装器契约

生成的包装器应保持小巧。它们应：

- 在受支持的位置以进程组启动适配器
- 将常规终止信号转发给进程组
- 检测父进程死亡
- 在父进程死亡时发送 SIGTERM，然后让包装器保持存活，直到 SIGKILL 后备逻辑运行
- 在可用时将根 PID 和进程组 ID 报告回生命周期控制器

包装器不应决定会话策略。它们只为自己的适配器组执行本地进程树清理。

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

- `self`：仅请求者会话。
- `tree`：请求者会话，以及由请求者拥有或从请求者生成的行。
- `all`：所有同智能体行、a2a 允许的跨智能体行，以及请求者拥有的已生成跨智能体行，即使通用 a2a 已禁用。
- `agent`：仅同一智能体，除非显式所有者关系表明该行属于请求者。

这使 `tree` 和 `all` 具备单调性：`all` 不能隐藏 `tree` 会显示的已拥有子会话。

## 迁移计划

### 阶段 1：添加身份和租约

- 向 Gateway 网关状态添加 `gatewayInstanceId`。
- 在 ACPX 状态目录下添加 ACPX 租约存储。
- 在生成包装器之前写入租约。
- 在新的 ACPX 会话记录上存储 `leaseId`。
- 为旧记录保留现有 PID 和命令字段。

### 阶段 2：租约优先清理

- 更改关闭清理，先加载 `leaseId`。
- 在发送信号前，根据租约验证实时进程所有权。
- 仅对旧版记录保留当前根 PID 和包装器根后备逻辑。
- 在已验证清理后将租约标记为 `closed`。
- 当进程在清理前已经消失时，将租约标记为 `lost`。

### 阶段 3：租约优先启动回收

- 启动回收扫描开放租约。
- 对每个租约，验证根进程并收集后代。
- 按子进程优先回收已验证的进程树。
- 使用有界保留窗口过期旧的 `closed` 和 `lost` 租约。
- 仅将命令标记扫描作为临时旧版后备逻辑保留，并在可能时通过包装器根和 Gateway 网关实例进行保护。

### 阶段 4：会话所有权行

- 向 Gateway 网关会话行添加所有权元数据。
- 教 ACPX、子智能体、后台任务和会话存储写入方填充 `ownerSessionKey` 或 `spawnedBy`。
- 将会话可见性检查转换为使用行元数据。
- 移除可见性期间的次级 `sessions.list({ spawnedBy })` 查询。

### 阶段 5：移除旧版启发式逻辑

在一个发布窗口之后：

- 停止依赖已存储的根命令字符串进行非旧版 ACPX 清理
- 移除命令标记启动扫描
- 移除可见性后备列表查询
- 对缺失或不可验证的租约保持防御性失败关闭行为

## 测试

添加两个表驱动套件。

进程生命周期模拟器：

- PID 被无关进程重用
- PID 被另一个 Gateway 网关的包装器根重用
- 已存储的包装器命令带有 shell 引号，但实时 `ps` 命令没有
- 适配器子进程退出，孙进程仍留在进程组中
- 父进程死亡 SIGTERM 后备逻辑到达 SIGKILL
- 进程列表不可用
- 缺少进程的陈旧租约
- 含包装器、适配器子进程和孙进程的启动孤儿

会话可见性矩阵：

- `self`、`tree`、`agent`、`all`
- a2a 启用和禁用
- 同智能体行
- 跨智能体行
- 请求者拥有的已生成跨智能体 ACP 行
- 沙箱隔离请求者被限制为 `tree`
- list、history、send 和 Status 操作

重要不变量：请求者拥有的已生成子会话在配置的可见性包含请求者会话树的任何位置都可见，并且 `all` 的能力不能弱于 `tree`。

## 兼容性说明

旧会话记录可能没有 `leaseId`。它们应使用旧版失败关闭清理路径：

- 要求存在实时根进程
- 在预期为生成的包装器时，要求包装器根所有权
- 对非包装器根要求命令一致
- 绝不只基于陈旧的已存储 PID 元数据发送信号

如果无法验证旧版记录，就让它保持原样。启动租约清理和下一个发布窗口最终应淘汰该后备逻辑。

## 成功标准

- 关闭旧的或陈旧的 ACPX 会话不会杀死另一个 Gateway 网关的进程。
- 父进程死亡不会留下难以清理的适配器孙进程继续运行。
- `cancel` 会中止活动轮次，而不关闭可复用会话。
- `sessions_list` 可以在 `tree` 和 `all` 下显示请求者拥有的跨智能体 ACP 子会话。
- 启动清理由租约驱动，而不是广泛的命令字符串扫描。
- 聚焦的进程和可见性矩阵测试覆盖此前需要一次性评审修复的每个边缘情况。
