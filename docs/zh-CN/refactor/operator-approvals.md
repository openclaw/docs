---
read_when:
    - 更改 Exec 或插件的审批生命周期、存储、协议或授权
    - 向渠道添加审批链接或原生审批控件
    - 将子会话审批呈现在父会话或编排器视图中
summary: 面向 Control UI、原生应用、渠道和父会话的持久化、可深度链接审批设计
title: 多界面操作员审批
x-i18n:
    generated_at: "2026-07-16T11:56:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# 多界面操作员审批

此设计跟踪 [#103505](https://github.com/openclaw/openclaw/issues/103505)。它以一个由 Gateway 网关所有、基于 SQLite 的生命周期取代进程本地审批权威。每个由 Gateway 网关所有的 Exec 或插件/工具审批都会获得一个稳定 ID、一个经过身份验证的 Control UI 路由、原子化的先响应者胜出解析，以及仅供操作员查看的投影，并将其投影到来源会话和祖先会话流。

内联操作与深层链接并存。不存在审批模式切换开关。

## 目标

- 为 Exec 和插件/工具关卡提供一个持久化审批对象。
- 稳定的 `${controlUiBasePath}/approve/{approvalId}` 路由。
- 可从任何获得授权的 Control UI、原生应用或渠道界面进行解析。
- 在并发界面之间实现原子化的先响应者胜出行为。
- 相同的重试具有幂等性；冲突的迟到响应无法覆盖胜出结果。
- 超时、格式错误的可信裁决、缺失路由、取消和重启均以失败关闭方式处理。
- 请求事件和终态事件会到达来源会话以及所有相关的父级/编排器所有者。
- 渠道接收类型化的审批和导航操作；传输回调数据仍为渠道私有。
- 现有 Exec/插件 Gateway 网关方法保持兼容，同时其实现收敛到一个服务。

## 非目标

- 在 Gateway 网关重启后持久化或恢复被阻塞的工具执行本身。
- 将审批 ID 或 URL 用作不记名凭证。
- 将审批提示附加到模型可见的对话记录，或唤醒父智能体。
- 将审批策略、产品命令或审阅者授权移入渠道插件。
- 按渠道、设备或祖先复制审批状态。
- 重新设计 Exec 允许列表、插件策略组合或 `allow-always` 持久化，除非这是消除终态结果歧义所必需的。
- 在第一个增量中让无 Gateway 网关的嵌入式 TUI 可被远程访问。它仍仅限本地使用，并且在不存在审阅者时必须以失败关闭方式处理。

## 推出前基线和证据图

此表记录 #103505 创建时的实现状态。下方推出章节跟踪在该基线之上构建的持久化注册表、类型化操作、深层链接页面和原生客户端增量。

| 界面              | 基线入口点和所有者                                                                                                                                                | 基线行为和缺口                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent Exec        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | 两阶段 `exec.approval.*` 注册可防止早期 `/approve` 竞态，但超时仍可能通过 `askFallback` 变为允许。                                                        |
| 插件工具关卡      | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | 请求 `plugin.approval.*`；`timeoutBehavior: "allow"` 可以批准已超时的关卡。嵌入式模式在 `src/infra/embedded-plugin-approval-broker.ts` 中具有独立的进程本地权威。 |
| 插件节点关卡      | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | 直接通过插件管理器创建并广播，重复了服务器方法生命周期的一部分。                                                                                                                             |
| Gateway 网关权威  | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | 独立的 Exec 和插件管理器使用进程本地映射。终态条目保留 15 秒。先响应者胜出仅在单个进程内成立。                                                                                               |
| Gateway 网关协议  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec 只有仅含待处理项的 `get`；插件没有 `get`；不存在供深层链接使用的、不区分类型的终态查询。                                                                                   |
| 交付              | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | 支持来源路由、审批者私信、待处理项重放、原生处理程序和进程内终态清理。单独的后续工作会添加持久化终态协调。                                                                                   |
| 可移植操作        | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | 审批按钮是包含 `/approve ...` 的命令操作；URL 和 Web App 目标是无类型的按钮字段。                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | 渲染器先解析命令文本以识别审批语义，然后再生成私有回调数据。                                                                                                                                |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | 审批 UI 是全局模态框。`ui/src/app-route-paths.ts` 和 `ui/src/app-routes.ts` 使用精确路由，并将未知路径重写到 Chat。                                                    |
| 会话所有权        | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | 已有控制器、请求者、显式父级和旧版派生所有权，但审批事件不会投影到这些会话流。                                                                                                               |
| 共享状态          | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | 现有立即事务和 Kysely 条件更新支持在 `state/openclaw.sqlite` 中进行持久化比较并设置。                                                                   |

具有代表性的当前测试包括 `src/gateway/exec-approval-manager.test.ts`、`src/gateway/server-methods/approval-shared.test.ts`、`src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`、`extensions/telegram/src/approval-handler.runtime.test.ts` 和 `ui/src/e2e/approval-flow.e2e.test.ts`。

插件 SDK 仍是唯一的渠道/插件边界。审批运行时和呈现变更必须通过现有的 `src/plugin-sdk/approval-*.ts` 和 `src/plugin-sdk/interactive-runtime.ts` 子路径导出；插件生产代码不得导入 Gateway 网关内部实现。

## 先例

Omnigent 提供了有用的 UX 和失败语义：

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) 暂停 ASK，应用按策略设置的超时，并且仅将完全匹配的接受结果视为批准。
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) 包含服务器端原生 harness 关卡以及祖先请求/解析投影。
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) 提供独立的移动端审批页面。

不要不加辨别地照搬其存储声明。当前活跃的待处理状态在 [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) 中是进程本地状态，而未使用的待处理表由 [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) 删除。OpenClaw 刻意更进一步：SQLite 是权威来源，每次终态转换都是一次数据库比较并设置操作。

## 架构和所有权

Gateway 网关拥有该生命周期：

1. 智能体、插件钩子或节点策略提供特定类型的请求和进程本地执行绑定。
2. Gateway 网关对其进行验证，并构建经过净化的审阅者投影。
3. 审批服务计算来源/所有者受众，插入规范行，然后注册进程内等待器。
4. 完成持久化插入后，Gateway 网关发布现有审批事件、会话投影、渠道通知和原生推送。
5. 每个界面都通过同一服务进行解析。
6. 该服务提交一次终态转换，唤醒运行时等待器，并发布终态投影。
7. 事件交付失败绝不会回滚已提交的决定；客户端通过 `approval.get` 或列表重放进行恢复。

所有权边界：

- `src/gateway/`：审批服务、授权、RPC 适配器、URL 构造、等待器生命周期和事件发布。
- `src/state/`：共享架构和生成的 Kysely 类型。
- `src/infra/`：经过净化的审批视图模型和可移植呈现构造。
- `src/agents/`：请求、等待并应用返回的裁决；不负责持久化。
- `src/channels/` 和 `extensions/*`：渲染类型化操作、授权渠道用户、编码私有回调并更新已交付的控件。
- `src/plugin-sdk/`：仅包含公开的审批和呈现契约。
- `ui/`：独立页面以及现有队列/模态框客户端。

进程内等待器是一种通知机制，而非权威来源。注册过程会同步插入该行并安装等待器，然后才发布请求，因此解析器无法在这些步骤之间交错执行。此后的每个解析器都会先通过 SQLite 提交，再结束该等待器。

## 持久化记录

向共享状态数据库添加一个 `operator_approvals` 表。

| 列                                                 | 用途                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | 全局唯一的规范 ID。为保持协议兼容性，请保留现有的 exec ID 和 `plugin:` ID，但绝不能根据前缀推断类型。                                      |
| `resolution_ref`                                   | 唯一的完整 SHA-256 base64url 定位符，供无法携带规范 ID 的传输回调使用。它不是授权凭据，也不是公开 URL ID。                                     |
| `kind`                                             | 封闭的 `exec \| plugin` 判别字段。                                                                                                           |
| `status`                                           | 封闭的 `pending \| allowed \| denied \| expired \| cancelled` 状态。                                                                                                               |
| `presentation_json`                                | 经过验证且带类型标签的审核者投影。原始运行时请求、命令绑定和回调载荷仍仅保留在进程内。                                                        |
| `source_agent_id`, `source_session_key`            | 来源身份和会话投影锚点。会话键是持久的；轮换的会话 UUID 不是。                                                                                 |
| `audience_session_keys_json`                       | 由有界广度优先所有权遍历生成的有序去重 JSON 数组。请求事件和终止事件使用同一快照。                                                            |
| `requested_by_device_id`, `requested_by_client_id` | 持久的请求者/审计元数据。连接 ID 保留在内存中，不是跨界面的主体身份。                                                                          |
| `reviewer_device_ids_json`                         | 可选的明确目标审核者设备，仅由可信的审批运行时提供。                                                                                           |
| `runtime_epoch`                                    | 拥有已暂停执行的进程纪元；用于在重启后取消孤立记录。                                                                                           |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | 权威时间信息。                                                                                                                                |
| `decision`                                         | 存在明确用户决定时记录该决定。                                                                                                                |
| `terminal_reason`                                  | 封闭原因，例如 `user`、`timeout`、`malformed-verdict`、`no-route`、`run-aborted` 或 `gateway-restart`。       |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | 服务端保留的胜出决定及审计身份。审核者投影省略原始解析者标识符。                                                                               |
| `consumed_at_ms`, `consumed_by`                    | `allow-once` 的独立重放防护；消费操作不得清除已记录的决定。                                                                              |

必需索引：

| 索引                                       | 用途                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | 插入期间拒绝跨列的 `approval_id`/`resolution_ref` 歧义。             |
| `(status, expires_at_ms)`                  | 查找待处理审批并协调权威截止时间。                                          |
| `(source_session_key, created_at_ms DESC)` | 重放一个来源会话的近期审批。                                                |
| `(resolved_at_ms)`                         | 根据固定保留策略清理已保留的终止审批。                                      |

受众数组规模较小且有明确上限。按会话筛选的重放首先通过 Kysely 选择可见的待处理记录，然后在应用程序代码中解码并筛选有界受众数组；它不使用字符串匹配或原始 SQL JSON 查询。

终止记录保留 30 天，与 `src/audit/audit-event-store.ts` 中的元数据审计保留期一致。清理属于固定维护策略，不是新的配置界面。数据库是私有的本地控制平面状态，但审核者 API 绝不能公开完整的已存储请求或运行时绑定。

## 状态机和比较并设置

仅允许以下转换：

- `pending -> allowed`：明确的 `allow-once` 或 `allow-always`。
- `pending -> denied`：明确拒绝、可信的格式错误终止裁决，或没有投递路由。
- `pending -> expired`：到达权威截止时间。
- `pending -> cancelled`：运行中止、优雅关闭或重启后的孤立恢复。

所有不允许的终止状态，其实际裁决均为拒绝。

解析过程使用一个立即执行的 SQLite 事务，以及等效于以下语句的 Kysely 条件更新：

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

如果更新未影响任何记录，则同一事务读取该记录：

- 缺失或未授权：返回未找到；不得透露其是否存在。
- 仍处于待处理状态但已到达截止时间：通过比较并设置将其改为 `expired`，然后返回该终止记录。
- 与已记录的决定相同：返回幂等成功及已记录的胜出决定。
- 决定不同：统一 API 返回包含已记录胜出决定的 `applied: false`；旧版适配器在其已发布契约要求时保留 `APPROVAL_ALREADY_RESOLVED`。
- 任何终止状态：绝不修改。

`now == expires_at_ms` 已过期。Gateway 网关时间为权威时间。

`allow-once` 执行对 `consumed_at_ms IS NULL` 使用第二次 CAS，并绑定到现有的精确命令/系统运行上下文。审批记录在消费后仍作为审计记录保留。

无法进行身份验证或无法标识审批的格式错误 HTTP/RPC 输入会被拒绝且不发生修改，并且绝不可能批准。对于已知审批，如果从可信 harness/waiter 收到格式错误的终止裁决，则转换为 `denied`。

## Gateway 网关 API

添加与类型无关的审核者方法：

| 方法                                      | 契约                                                                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | 返回可见的待处理投影或已保留的终止投影。                                                                                                                                                                            |
| `approval.resolve { id, kind, decision }` | 接受规范 ID 或固定大小的传输引用，然后执行授权、类型及允许决定的验证、截止时间协调和终止 CAS。响应始终携带规范 ID。                                                                                                |

CAS 成功后，立即返回已提交的投影。旧版事件、渠道转发器和推送终止器均为尽力而为的后续操作；缓慢或失败的界面不得延迟或回滚胜出的响应。

特定类型的请求验证仍位于 `exec.approval.request` 和 `plugin.approval.request` 中。现有的 `exec.approval.get/list/waitDecision/resolve` 和 `plugin.approval.list/waitDecision/resolve` 将成为规范服务的协议边界适配器，因为它们属于已发布的 Gateway 网关 API。内部调用方在同一变更中迁移到该服务。

审核者投影是一个带标签的联合类型：

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* 安全的 exec 预览 */ }
    | { kind: "plugin"; title: string; description: string /* 安全的插件预览 */ };
  // 通用生命周期字段
};
```

稳定路径通过派生获得，而非持久化存储。`approval.get` 返回 `urlPath`；知道已批准公开来源的界面也可以接收绝对 `url`。审核者快照省略来源和受众会话键。Gateway 网关在服务端保留这些路由键，用于单独的 `session.approval` 投影。

## 事件和可移植操作

PR 1 保留已发布的事件名称、载荷和现有的记录级接收者筛选器：

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

这些旧版事件可能包含完整的运行时请求，因此不得将其扇出到每个审批范围内的客户端。PR 5 通过经过净化的生命周期投影添加带标签的生命周期字段（`status`、`sourceSessionKey`、`urlPath`、终止元数据和呈现级 `kind`），而不是扩大旧版事件的投递范围。

添加审批范围内的 `session.approval` 投影事件。使用持久化的受众键发布一次规范事件；精确会话订阅者会针对每个匹配键接收同一事件：

- `sessionKey`：接收投影的流。
- `sourceSessionKey`：触发审批关卡的子级/来源。
- `phase`：`pending \| terminal`，根据审批状态进行判别。
- 一个安全的 `OperatorApproval` 投影。

客户端通过 `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` 选择启用。成功响应会添加一个 `approvalReplay`，其中包含该精确流键当前最多 1,000 个待处理审批，且订阅客户端还必须在记录级获得审核授权。`truncated: false` 使筛选后的重放成为权威数据，重新连接的客户端使用它替换本地待处理集合；`truncated: true` 是过载信号，客户端必须保留尚未看到的本地条目，直至规范查找或后续生命周期事件将其确定。在重放期间发现的后续持久超时，会在返回新快照前，仅向已订阅且在记录级获得授权的受众发出终止墓碑。`operator.admin` 可以直接选择启用；权限范围更窄的客户端必须同时具有已配对的设备身份和 `operator.approvals`。仅订阅会话绝不会授予审批可见性。

在 `src/gateway/server-broadcast.ts` 中将该事件注册到 `operator.approvals` 下。该投影仅用于观察：它绝不追加转录记录、发出 `sessions.changed` 或唤醒智能体。

扩展 `src/interactive/payload.ts` 中的 `MessagePresentationAction`：

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core 构建类型化决策操作，并在存在获批准的绝对 Control UI 来源时提供单独的审查链接。渠道将审批操作编码为自身的回调格式，并将解决结果发送到规范服务。当规范 ID 长度允许时，回调使用完全一致的规范 ID；否则使用该行唯一的完整摘要 `resolution_ref`。该引用只是一个紧凑的查找键：常规 Gateway 网关身份验证、记录授权、显式类型、允许决策验证、截止时间协调以及首次回答 CAS 仍然适用。渠道不得截断 ID、解析哈希前缀、解析 `/approve` 文本，也不得根据 ID 前缀推断类型。

将 `button.url`、`button.webApp` 和命令支持的审批控件保留为已弃用的插件 SDK 兼容输入。在 SDK 边界对其进行规范化；在同一个 PR 中迁移所有内置内部调用方。`/approve {id} {decision}` 仍作为文本回退和 CLI/聊天命令，而不是按钮的语义契约。

## Control UI

路由为 `${basePath}/approve/{approvalId}`。ID 是唯一的路径参数；源会话身份来自记录。

由于当前路由器具有精确的静态路由，并会将未知路径重写到聊天页面，因此应在常规路由规范化之前，于 `ui/src/app/bootstrap.ts` 中检测此深层链接。复用常规 Gateway 网关/身份验证设置，但在侧边栏外壳和全局模态框之外渲染独立的审批页面。

该文档归提供其 URL 的 Gateway 网关所有。其初始连接会忽略完整应用中持久化的远程 Gateway 网关选择，但不会更改或复制该选择的设置；只有身份验证保持在提供服务的 Gateway 网关会话范围内。受信任的原生身份验证或单独确认的 `gatewayUrl` 覆盖可将其重新定向。核心会在插件 HTTP 路由和静态扩展检测之前保留单段 `/approve` 命名空间，包括以 `.json` 或 `.js` 结尾的 ID；禁用 Control UI 服务时，保留路由会以 `404` 方式失败关闭。将该页面保留在主 Control UI 包中，避免延迟加载分块失败后，安全决策一直停留在加载指示器上。

页面状态：

- 加载中
- 需要身份验证
- 待处理
- 正在解决
- 已在此处批准或拒绝
- 已在其他位置解决
- 已过期
- 已取消
- 禁止访问/未找到
- 连接错误，可重试

该页面调用 Gateway 网关 RPC，而不是第二个未经身份验证的 REST API。浏览器刷新会重新读取持久状态。它绝不会将 Gateway 网关凭据放入 URL、查询参数或片段中。

## 授权和隐私

URL 是定位器，而不是授权依据。解决操作要求：

1. 已通过身份验证的 Gateway 网关连接；
2. `operator.approvals` 或 `operator.admin`；
3. 记录级审查者授权。

记录级规则：

- `operator.admin` 可以审查。
- 存在 `reviewer_device_ids` 时，以其为准。只有列出的已配对
  `operator.approvals` 设备才能审查；除非请求设备也在列表中，否则它没有隐式
  访问权限。
- 没有显式审查者列表时，发起请求的已配对
  `operator.approvals` 设备可以审查自己的记录。
- 确实不含请求者或审查者绑定的旧版记录保留广泛的
  已配对设备可见性，以免升级导致已处于待处理状态的工作无法继续。
- 无设备的内部运行时可以通过限定范围的
  审批运行时连接执行解决操作，但不能读取。该权限仅来自
  经服务器身份验证的运行时令牌；公共 `approval.resolve` 字段无法
  创建该权限。
- 实时请求者连接所有权对旧版适配器仍然有效；绝不会
  根据匹配的客户端名称推断该所有权。
- 受众成员身份只影响呈现，绝不会扩大授权范围。

`approval.get` 仅公开经过清理的审查者投影，并省略内部源/受众路由键。在 Gateway 网关于服务器端应用持久化的受众快照后，PR 5 的 `session.approval` 事件会携带其唯一目标 `sessionKey` 以及 `sourceSessionKey`。现有 Exec/插件事件继续保留其历史负载和受限接收方，直至使用方完成迁移。可执行请求、命令绑定和继续执行逻辑仅保留在进程本地等待器中。持久行包含安全呈现内容以及生命周期、路由和审计元数据；绝不存储原始环境值、凭据、身份验证标头或渠道回调数据。

## 受众投影

在插入前计算一次受众，并持久化有序快照。所有权是一张图，并不总是单一父级链：一个子项可能同时具有当前控制者和原始请求者，而这些所有者可能通向不同的根节点。

使用确定性的广度优先遍历：

1. 使用源会话键初始化队列。
2. 对于每个出队键，读取最新的子智能体注册表行，并按固定顺序将两个不同的所有权边入队：先 `controllerSessionKey`，再 `requesterSessionKey`。
3. 存在可用的注册表行时，不要同时沿可能在引导后过时的会话条目谱系继续遍历。否则，将唯一的当前回退边 `parentSessionKey ?? spawnedBy` 入队。
4. 入队时进行规范化和去重，使最先发现的最短路径胜出。
5. 达到 64 个唯一键时停止；此受众大小上限也会限制遍历深度。

注册表源为 `src/agents/subagent-registry-read.ts`；所有权字段定义于 `src/agents/subagent-registry.types.ts`。会话回退字段定义于 `src/config/sessions/types.ts`。

即使审批待处理期间焦点/控制者所有权发生变化，请求投影和终态投影也使用同一个持久化受众。这可保证收到请求投影的每个受众会话流都能得到终态清理。解决操作始终以源审批 ID 为目标；受众会话绝不会接收克隆的审批状态。转发渠道消息的清理仍由下文单独的交付定位器后续工作处理。

不要仅因审批而写入对话记录消息、注入系统提示、启动所有者轮次或发出 `sessions.changed`。

## 已交付界面的一致性

原生审批处理程序已经将其已交付消息条目保留足够长的时间，以便替换或停用活动控件。通用转发审批消息目前会丢弃 `MessageReceipt`，因此在其他界面上作出决策后，其旧控件可能仍显示为待处理。单独的后续工作会通过共享状态数据库中的 `operator_approval_deliveries` 子表弥补此缺口。

每行存储审批 ID、唯一交付 ID、渠道/账户/精确路由、经过 JSON 验证且大小受限的渠道私有消息定位器、交付时间戳和终态化状态。它绝不存储回调数据、决策令牌或原始审批请求。渠道负责定位器编码和消息变更；核心负责规范状态、目标选择、重试策略和回退终态文本。

交付注册和终态解决可安全处理竞态：

1. 待处理消息发送并返回回执后，在一个事务中插入交付定位器并读取父审批状态。
2. 如果父项已处于终态，则安排立即终态化，而不是让延迟到达的交付保持待处理。
3. 每次提交终态转换时，单独安排所有尚未完成的交付行；可丢弃广播不是触发条件。
4. 渠道终态处理器报告 `replaced`、`retired` 或 `unsupported`。已替换状态会抑制重复的终态消息；已停用状态会发送现有的终态后续消息；不支持或失败时执行回退，但不回滚审批 CAS。
5. 启动时重试具有未完成交付的终态审批，使清理能够承受 Gateway 网关重启。

此传输生命周期是可选的交付适配器钩子，而不是渲染器或面向模型的消息操作。QQ 单聊/群聊消息目前没有编辑、删除或清除键盘的 API；该适配器仍不受支持，在传输协议获得变更 API 之前，只能在用户稍后点击后显示规范事实。

## 重启、超时和路由语义

SQLite 持久化并不意味着恢复执行。命令/工具绑定仍保留在内存中，因为它们可能包含安全敏感的运行时事实，并且不属于可恢复的任务契约。

Gateway 网关启动时：

- 生成新的运行时纪元；
- 以原子方式将旧纪元中的待处理行转换为 `cancelled`，原因为 `gateway-restart`；
- 保留这些行，使其 URL 能解释发生的情况；
- 绝不针对缺失的运行时绑定执行之后到达的审批。

计时器只是唤醒优化。截止时间权威值存储在 `expires_at_ms` 中；读取、等待和解决操作都会执行过期协调。

最终严格行为：

- 超时 -> `expired`，拒绝；
- 无路由 -> `denied`，拒绝；
- 运行中止 -> `cancelled`，拒绝；
- 格式错误的受信任裁决 -> `denied`，拒绝；
- 只有明确允许且属于许可范围的决策 -> `allowed`。

当前已发布的 Exec 行为仍与此契约冲突：

- `src/agents/bash-tools.exec-host-shared.ts` 可能应用 `askFallback`。
- `docs/tools/exec-approvals.md` 和 `docs/cli/approvals.md` 记录了该界面。

插件审批现在会在超时和裁决格式错误时失败关闭；旧版
`timeoutBehavior` 字段仍会被接受，但会被忽略。Exec 严格语义
后续工作必须同时更新代码、类型、文档、测试和变更日志，并经过
明确的所有者/安全审查。迁移期间，`askFallback` 可以继续描述
门控前的策略选择，但不得将已创建的待处理记录在超时后转为批准。

## 兼容性计划

- 采用增量式 Gateway 网关协议；不提升协议版本。
- 在外部边界保留现有 Exec/插件方法和事件。
- 保留现有 ID，包括 `plugin:` 前缀，但停止将前缀用作类型信息。
- 保留 `/approve` 文本命令行为。
- 将旧版按钮 URL/Web App 字段和命令操作保留为插件 SDK 兼容输入；新的核心输出为类型化输出。
- 在同一个类型化操作变更中迁移所有内置渠道和内部调用方。
- 为新的 URL/页面以及之后的超时行为变更添加变更日志条目。
- 不要添加启发模式设置。

## 推出计划

### PR 1：持久生命周期

- 本文设计说明。
- 共享 SQLite 架构、Kysely 生成、存储以及 30 天清理。
- Gateway 网关审批服务、运行时等待器桥接和重启孤立项处理。
- 统一的 `approval.get/resolve`。
- Exec/插件方法适配器。
- 首次回答胜出、幂等性、过期、授权和消费测试。
- 暂不更改 UI 或渠道行为。

### PR 2：类型化操作和渠道回调

- 类型化的审批、URL 和 Web App 操作。
- 核心呈现构建器和插件 SDK 导出。
- 使用显式所有者类型的传输层私有回调编码。
- 为超出传输限制的规范 ID 提供持久化定长回调引用。
- 内置渠道不再使用命令文本和审批 ID 推断的迁移。
- 以点击界面上的规范首次答复为准，并尽力更新处于活动状态的原生界面终态；持久化渠道消息终态化仍作为后续工作。
- SDK 和内置渠道测试。

### PR 3：Control UI 深层链接

- 独立的已认证审批页面和可感知基础路径的启动路由。
- 绑定到提供服务的 Gateway 网关，且不修改操作员保存的远程选择。
- 由核心拥有的审批 HTTP 命名空间，包括类似资源的 ID。
- 由 Gateway 网关生成的 URL 载荷，以及在生命周期事件发布前对待处理状态的轮询。
- 移动端宽度、重新连接、竞争答复、重新加载和挂载路径验证。

### PR 4：原生客户端

- iOS 和 Android 审核界面使用可感知类型的 `approval.get/resolve`；watchOS 通过已配对的 iPhone 中继对审核者安全的提示和决定。
- Watch 提供其紧凑中继契约所支持的 Exec 决定：允许一次和拒绝。
- 以规范首次答复的终态事实取代本地的尝试决定状态。
- 解析确认丢失或含义不明确时，冻结控件直至读回规范状态。
- 先前已发布的 Gateway 网关 v4 实例通过范围有限的旧版方法回退继续支持 Exec 审核；要保留跨界面终态，需要使用统一方法。
- 审核者警告和所有者上下文在 iPhone、Watch 和 Android 上始终可见。
- 原生单元测试、构建和平台验证。

### PR 5：祖先生命周期传播

- 根据 PR 1 中持久化的受众快照投递 `session.approval` 的待处理/终态。
- 精确会话订阅、重连重放和终态墓碑，不修改记录文本，也不唤醒智能体。
- 生命周期回调在持久化插入/CAS 后运行，绝不成为审批权威来源。
- 嵌套子智能体和重连验证。

### PR 6：故障时关闭行为

- 迁移 `node-invoke-plugin-policy.ts` 和嵌入式插件代理，使其不再具有重复的权威来源。
- 严格的超时、格式错误、无路由、绑定和允许一次消费语义。
- 弃用已发布的宽松超时设置，在询问进入待处理状态后不再遵循这些设置。
- 多界面竞争和故障注入验证。

### 后续工作：持久化远程消息清理

- 持久化转发投递定位信息，并在重启后将每条已投递的渠道消息设为终态。
- 让此传输生命周期与规范审批权威及类型化呈现操作相互独立。

## 测试

必需的重点覆盖：

- 重新打开 SQLite 后仍保留待处理和终态投影。
- 两个并发解析器恰好产生一个 CAS 胜者。
- 相同决定的重试以幂等方式成功；冲突的重试返回已记录的胜者。
- 在截止时间或之后进行解析时无法批准。
- `allow-once` 只能消费一次，且不会清除终态审计状态。
- 启动时取消较旧运行时纪元中的请求。
- 未授权的查找和解析不会泄露记录是否存在。
- 显式审核者允许列表和常规已配对 `operator.approvals` 行为。
- Exec 和插件旧版方法共用同一存储。
- Gateway 网关的请求/列表/获取/解析模式和增量事件载荷。
- 类型化操作规范化、回退渲染、SDK 导出和内置渠道切换。
- Telegram 回调编码包含传输层私有数据，且不推断命令字符串。
- 直接子级、分支控制器/请求者所有者、嵌套所有者、重新分配、会话字段回退、循环和受众大小上限。
- 请求和终态的受众数组完全相同。
- 所有者投影不会修改记录文本或唤醒智能体。
- Control UI 路由可在 `/` 和配置的基础路径下工作；刷新后显示待处理或终态事实。
- Control UI 和 Telegram 同时答复时显示一个胜者，并在失败方显示“已在其他位置解析”。
- 原生审批标识符和 Gateway 网关所有者标识符在路由和协调过程中精确保留 UTF-8 字节。
- 原生 RPC 系列协商为每条已接纳的 Gateway 网关路由固定一个规范或旧版系列，使用后绝不静默降级。
- 原生解析确认丢失时冻结操作，直至读回规范状态；读回失败时不得虚构胜者，也不得确认 Watch 刷新。
- 仅当 Watch 快照请求关联到完全一致的已配对 Gateway 网关所有者，并且 iPhone 已完成规范读回时，才接受该请求。
- 通过 Testbox/Crabbox 进行用户路径验证，包括移动端宽度的审批页面、Telegram 操作清理，以及横跨 Android、iPhone 和 Watch 的一轮待处理/解析/迟到失败方往返流程。

## 可观测性

输出结构化且不含内容的状态转换日志，其中包含审批 ID、类型、源会话键、状态、原因和延迟。绝不记录预览或原始绑定。

跟踪：

- 按类型统计的请求数；
- 按类型/状态/原因统计的终态数；
- 待处理量表；
- 从请求到终态的延迟；
- 解析竞争结果：胜者、幂等重试、冲突、已过期；
- 投递路由数量和无路由拒绝；
- 启动时取消的孤立请求；
- 受众大小。

即使后续事件投递失败，已提交的状态转换也视为成功。生命周期订阅者通过 PR 5 的重放和规范查找进行恢复。持久化渠道消息终态化仍是上文所述的独立后续工作。

## 待决事项

1. **可从外部访问的 Control UI 来源。**每个快照都携带稳定的相对路径 `urlPath`。仅当 Gateway 网关成功暴露后，才能使用缓存的 Tailscale Serve/Funnel 位置公布绝对 URL；`allowedOrigins`、请求 Host 标头、`gateway.remote.url` 以及仅用于显示的 local loopback/LAN 候选项均不是规范来源。Telegram 可以使用其已认证的 Mini App 包装器，在引导启动过程中保留审批路径。在另行评审的显式公共 URL 契约建立之前，任意反向代理仍只能使用相对路径。绝不能让渠道猜测来源。
2. **Exec 严格超时兼容性切换。**插件审批超时现在采用故障时关闭策略，且 `timeoutBehavior` 已弃用。剩余的已发布 `askFallback` 契约需要经过明确的所有者/安全评审，并提供更新日志、文档以及迁移/弃用决定，之后才能停止授权在待处理询问超时后执行。
3. **无 Gateway 网关的嵌入式模式。**建议：最初仅限本地使用；存在 Gateway 网关时，再使其成为规范服务的客户端。不要公布没有服务器能够解析的深层链接。
