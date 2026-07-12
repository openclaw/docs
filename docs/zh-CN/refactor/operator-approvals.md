---
read_when:
    - 更改 Exec 或插件审批的生命周期、存储、协议或授权机制
    - 向渠道添加审批链接或原生审批控件
    - 将子会话审批投射到父会话或编排器视图中
summary: 面向 Control UI、原生应用、渠道和父会话的持久化、可深度链接审批设计
title: 多界面操作员审批
x-i18n:
    generated_at: "2026-07-12T14:44:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# 多界面操作员审批

此设计跟踪 [#103505](https://github.com/openclaw/openclaw/issues/103505)。它将进程本地的审批权威替换为一个由 Gateway 网关所有、以 SQLite 为后端的生命周期。每个由 Gateway 网关所有的 Exec 或插件/工具审批都获得一个稳定 ID、一个经过身份验证的 Control UI 路由、原子的先响应者胜出解析机制，以及仅面向操作员的投影，并将其投影到来源会话及祖先会话流。

内联操作与深层链接并存。不提供审批模式开关。

## 目标

- 为 Exec 和插件/工具门控提供一个持久的审批对象。
- 提供稳定的 `${controlUiBasePath}/approve/{approvalId}` 路由。
- 支持从任何已授权的 Control UI、原生应用或渠道界面进行解析。
- 在并发界面间实现原子的先响应者胜出行为。
- 相同的重试具有幂等性；后续冲突响应无法覆盖胜出结果。
- 超时、格式错误的可信裁决、路由缺失、取消和重启均以失败关闭方式处理。
- 请求事件和终态事件会到达来源会话及所有相关的父级/编排器所有者。
- 渠道接收类型化的审批和导航操作；传输层回调数据仍由渠道私有。
- 现有 Exec/插件 Gateway 网关方法保持兼容，同时其实现统一到同一服务。

## 非目标

- 在 Gateway 网关重启后持久化或恢复被阻塞的工具执行本身。
- 将审批 ID 或 URL 用作持有者凭证。
- 将审批提示附加到模型可见的记录中，或唤醒父智能体。
- 将审批策略、产品命令或审核者授权移入渠道插件。
- 为每个渠道、设备或祖先克隆审批状态。
- 重新设计 Exec 允许列表、插件策略组合或 `allow-always` 持久化，除非为了消除终态结果的歧义而必须这样做。
- 在首个增量中使不带 Gateway 网关的嵌入式 TUI 可被远程访问。它仍仅限本地使用，并且在没有审核者时必须以失败关闭方式处理。

## 推出前基线和证据图

下表记录 #103505 创建时的实现状态。下方的推出章节跟踪在该基线之上构建的持久注册表、类型化操作、深层链接页面和原生客户端增量。

| 界面              | 基线入口点和所有者                                                                                                                                              | 基线行为和缺口                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 智能体 Exec       | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | 两阶段 `exec.approval.*` 注册可防止提前发生 `/approve` 竞争，但超时仍可能通过 `askFallback` 转变为允许。                                                                                      |
| 插件工具门控      | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | 请求 `plugin.approval.*`；`timeoutBehavior: "allow"` 可能批准已超时的门控。嵌入模式在 `src/infra/embedded-plugin-approval-broker.ts` 中具有独立的进程本地权威。                                |
| 插件节点门控      | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | 直接通过插件管理器创建和广播，重复了服务器方法生命周期的一部分。                                                                                                                            |
| Gateway 网关权威  | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | 独立的 Exec 和插件管理器使用进程本地映射。终态条目保留 15 秒。先响应者胜出仅在单个进程内成立。                                                                                               |
| Gateway 网关协议  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec 仅提供只返回待处理项的 `get`；插件不提供 `get`；不存在用于深层链接的、与类型无关的终态查找。                                                                                            |
| 交付              | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | 支持来源路由、审批者私信、待处理项重放、原生处理程序和进程内终态清理。单独的后续工作会添加持久终态协调。                                                                                      |
| 可移植操作        | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | 审批按钮是包含 `/approve ...` 的命令操作；URL 和 Web App 目标是无类型的按钮字段。                                                                                                            |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | 渲染器在生成私有回调数据前解析命令文本，以识别审批语义。                                                                                                                                    |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | 审批 UI 是全局模态框。`ui/src/app-route-paths.ts` 和 `ui/src/app-routes.ts` 使用精确路由，并将未知路径重写到聊天页面。                                                                        |
| 会话所有权        | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | 控制器、请求者、显式父级和旧版派生所有权均已存在，但审批事件不会投影到这些会话流。                                                                                                            |
| 共享状态          | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | 现有即时事务和 Kysely 条件更新支持在 `state/openclaw.sqlite` 中执行持久的比较并设置操作。                                                                                                    |

具有代表性的当前测试包括 `src/gateway/exec-approval-manager.test.ts`、`src/gateway/server-methods/approval-shared.test.ts`、`src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`、`extensions/telegram/src/approval-handler.runtime.test.ts` 和 `ui/src/e2e/approval-flow.e2e.test.ts`。

插件 SDK 仍是唯一的渠道/插件边界。审批运行时和呈现方式的更改必须通过现有的 `src/plugin-sdk/approval-*.ts` 和 `src/plugin-sdk/interactive-runtime.ts` 子路径导出；插件生产代码不得导入 Gateway 网关内部模块。

## 既有方案

Omnigent 提供了有用的用户体验和失败语义：

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) 暂停 ASK，应用按策略设置的超时，并且仅将完全匹配的接受结果视为批准。
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) 包含服务器端原生 harness 门控，以及祖先请求/解析投影。
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) 提供独立的移动端审批页面。

不要不加判断地照搬其存储声明。当前活跃的待处理状态位于 [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) 的进程本地存储中，而未使用的待处理表已由 [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) 删除。OpenClaw 有意更进一步：SQLite 是权威来源，每次终态转换都是数据库比较并设置操作。

## 架构和所有权

Gateway 网关拥有生命周期：

1. 智能体、插件钩子或节点策略提供特定类型的请求和进程本地执行绑定。
2. Gateway 网关验证请求并构建经过净化的审核者投影。
3. 审批服务计算来源/所有者受众，插入规范记录，然后注册进程内等待器。
4. 持久插入完成后，Gateway 网关发布现有审批事件、会话投影、渠道通知和原生推送。
5. 每个界面都通过同一服务进行解析。
6. 服务提交一次终态转换，唤醒运行时等待器，并发布终态投影。
7. 事件交付失败绝不会回滚已提交的决定；客户端通过 `approval.get` 或列表重放恢复。

所有权边界：

- `src/gateway/`：审批服务、授权、RPC 适配器、URL 构造、等待器生命周期和事件发布。
- `src/state/`：共享架构和生成的 Kysely 类型。
- `src/infra/`：经过净化的审批视图模型和可移植呈现构造。
- `src/agents/`：请求、等待并应用返回的裁决；不负责持久化。
- `src/channels/` 和 `extensions/*`：渲染类型化操作、授权渠道用户、编码私有回调，以及更新已交付的控件。
- `src/plugin-sdk/`：仅包含公共审批和呈现契约。
- `ui/`：独立页面以及现有的队列/模态框客户端。

进程内等待器是一种通知机制，而非权威来源。注册过程会在发布请求前同步插入记录并安装等待器，因此解析者无法在这两个步骤之间插入执行。之后的每个解析者都会先通过 SQLite 提交，再结束该等待器。

## 持久记录

向共享状态数据库添加一个 `operator_approvals` 表。

| 列                                               | 用途                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | 全局唯一的规范 ID。保留现有的 exec ID 和 `plugin:` ID 以实现协议兼容，但绝不能根据前缀推断种类。                                                  |
| `resolution_ref`                                   | 唯一的完整 SHA-256 base64url 定位符，供无法携带规范 ID 的传输回调使用。它不是授权信息，也不是公共 URL ID。                                        |
| `kind`                                             | 封闭的 `exec \| plugin` 判别字段。                                                                                                                |
| `status`                                           | 封闭的 `pending \| allowed \| denied \| expired \| cancelled` 状态。                                                                              |
| `presentation_json`                                | 经过验证并带有种类标签的审核者投影视图。原始运行时请求、命令绑定和回调载荷仍仅存在于进程本地。                                                    |
| `source_agent_id`, `source_session_key`            | 来源身份和会话投影锚点。会话键是持久的；轮换的会话 UUID 不是。                                                                                    |
| `audience_session_keys_json`                       | 由有界广度优先所有权遍历生成的有序、去重 JSON 数组。请求事件和终态事件使用同一快照。                                                              |
| `requested_by_device_id`, `requested_by_client_id` | 持久的请求者/审计元数据。连接 ID 保留在内存中，不是跨界面的主体。                                                                                  |
| `reviewer_device_ids_json`                         | 可选的、明确指定的审核者设备，仅由可信审批运行时提供。                                                                                            |
| `runtime_epoch`                                    | 拥有已暂停执行的进程纪元；用于在重启后取消孤立记录。                                                                                              |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | 权威时间信息。                                                                                                                                    |
| `decision`                                         | 存在明确用户决定时记录该决定。                                                                                                                    |
| `terminal_reason`                                  | 封闭的原因，例如 `user`、`timeout`、`malformed-verdict`、`no-route`、`run-aborted` 或 `gateway-restart`。                                          |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | 在服务端保留的胜出结果和审计身份。审核者投影省略原始解决者标识符。                                                                                |
| `consumed_at_ms`, `consumed_by`                    | `allow-once` 的独立重放防护；消费操作不得擦除已记录的决定。                                                                                       |

必需索引：

- 唯一 `(resolution_ref)`；插入时还要拒绝跨列的 `approval_id`/`resolution_ref` 歧义
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- 用于保留期清理的 `(resolved_at_ms)`

受众数组规模较小且有界。按会话筛选的重放首先通过 Kysely 选择可见的待处理记录，然后在应用程序代码中解码并筛选有界受众数组；它不使用字符串匹配或原始 SQL JSON 查询。

终态记录保留 30 天，与 `src/audit/audit-event-store.ts` 中的元数据审计保留期保持一致。清理是固定的维护策略，不是新的配置界面。数据库是私有的本地控制平面状态，但审核者 API 绝不能公开完整的已存储请求或运行时绑定。

## 状态机与比较并设置

仅允许以下转换：

- `pending -> allowed`：明确的 `allow-once` 或 `allow-always`。
- `pending -> denied`：明确拒绝、可信的格式错误终态裁定或不存在投递路由。
- `pending -> expired`：达到权威截止时间。
- `pending -> cancelled`：运行中止、优雅关停或重启后的孤立状态恢复。

所有非允许终态的实际裁定均为拒绝。

解决操作使用一个即时 SQLite 事务，以及等效于以下语句的 Kysely 条件更新：

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

如果更新未影响任何记录，则在同一事务中读取该记录：

- 不存在或未获授权：返回未找到；不要泄露其是否存在。
- 仍处于待处理状态但已达到截止时间：通过比较并设置将其改为 `expired`，然后返回该终态记录。
- 与已记录的决定相同：返回幂等成功结果以及已记录的胜出者。
- 决定不同：统一 API 返回 `applied: false` 以及已记录的胜出者；旧版适配器在其已发布契约要求时保留 `APPROVAL_ALREADY_RESOLVED`。
- 任何终态：绝不修改。

`now == expires_at_ms` 表示已过期。Gateway 网关时间为权威时间。

`allow-once` 执行对 `consumed_at_ms IS NULL` 使用第二次 CAS，并绑定到现有的精确命令/系统运行上下文。审批记录在消费后仍作为审计记录保留。

无法进行身份验证或无法识别审批的格式错误 HTTP/RPC 输入会被拒绝且不执行修改，并且永远不能批准。可信 harness/waiter 针对已知审批发送的格式错误终态裁定会将其转换为 `denied`。

## Gateway 网关 API

添加与种类无关的审核者方法：

| 方法                                      | 契约                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | 返回可见的待处理投影或保留的终态投影。                                                                                                                                                                                |
| `approval.resolve { id, kind, decision }` | 接受规范 ID 或固定大小的传输引用，然后执行授权、种类和允许决定验证、截止时间协调以及终态 CAS。响应始终携带规范 ID。                                                                                                    |

CAS 成功后，立即返回已提交的投影。旧版事件、渠道转发器和推送终态处理器都是尽力而为的后续操作；缓慢或失败的界面不得延迟或回滚胜出的响应。

特定种类的请求验证仍保留在 `exec.approval.request` 和 `plugin.approval.request` 中。现有的 `exec.approval.get/list/waitDecision/resolve` 和 `plugin.approval.list/waitDecision/resolve` 将成为规范服务的协议边界适配器，因为它们是已发布的 Gateway 网关 API。内部调用方在同一次变更中迁移到该服务。

审核者投影是带标签的联合类型：

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

稳定路径通过派生获得，而不是持久化。`approval.get` 返回 `urlPath`；已知获批公共源的界面也可以接收绝对 `url`。审核者快照省略来源和受众会话键。Gateway 网关在服务端保留这些路由键，供独立的 `session.approval` 投影使用。

## 事件和可移植操作

PR 1 保留已发布的事件名称、载荷和现有的记录级接收方筛选器：

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

这些旧版事件可能包含完整的运行时请求，因此不得将它们扇出到每个具有审批权限范围的客户端。PR 5 通过经过清理的生命周期投影添加带标签的生命周期字段（`status`、`sourceSessionKey`、`urlPath`、终态元数据和呈现层级的 `kind`），而不是扩大旧版事件的投递范围。

添加一个具有审批权限范围的 `session.approval` 投影事件。使用持久化受众键发布一次规范事件；精确会话订阅者会针对每个匹配键接收同一事件：

- `sessionKey`：接收该投影的流。
- `sourceSessionKey`：触发审批关卡的子会话/来源。
- `phase`：`pending \| terminal`，根据审批状态进行判别。
- 一个安全的 `OperatorApproval` 投影。

客户端通过 `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` 选择加入。成功响应会添加一个 `approvalReplay`，其中最多包含该精确流键当前的 1,000 个待处理审批，并且订阅客户端还必须具有记录级审核授权。`truncated: false` 表示经过筛选的重放具有权威性，重新连接的客户端将用它替换本地待处理集合；`truncated: true` 是过载信号，客户端必须保留未见到的本地条目，直到规范查询或后续生命周期事件将其确定下来。在返回新快照之前，如果重放期间发现了后续的持久超时，则仅向已订阅且具有记录级授权的受众发送终态墓碑。`operator.admin` 可以直接选择加入；权限更窄的客户端必须同时具有已配对的设备身份和 `operator.approvals`。仅订阅会话永远不会授予审批可见性。

在 `src/gateway/server-broadcast.ts` 中的 `operator.approvals` 下注册该事件。该投影仅用于观察：它绝不会追加转录记录、发出 `sessions.changed` 或唤醒智能体。

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

当获批的绝对 Control UI 源可用时，核心会构建类型化决定操作和单独的审核链接。渠道将审批操作编码为自身的回调格式，并将解决请求发送到规范服务。如果精确的规范 ID 能够容纳在回调中，则使用该 ID；否则使用记录中唯一的完整摘要 `resolution_ref`。该引用只是紧凑的查询键：常规 Gateway 网关身份验证、记录授权、明确种类、允许决定验证、截止时间协调和首次回答 CAS 仍然适用。渠道不得截断 ID、解析哈希前缀、解析 `/approve` 文本，也不得根据 ID 前缀推断种类。

将 `button.url`、`button.webApp` 和由命令支持的审批控件保留为已弃用的插件 SDK 兼容输入。在 SDK 边界对其进行规范化；在同一个 PR 中迁移所有内置内部调用方。`/approve {id} {decision}` 仍作为文本回退以及 CLI/聊天命令，而不是按钮的语义契约。

## Control UI

路由为 `${basePath}/approve/{approvalId}`。ID 是唯一的路径参数；来源会话身份来自记录。

由于当前路由器使用精确静态路由，并会将未知路径重写到 Chat，因此应在正常路由规范化之前，在 `ui/src/app/bootstrap.ts` 中检测此深层链接。复用正常的 Gateway 网关/身份验证设置，但在侧边栏外壳和全局模态框之外渲染独立的审批页面。

该文档归提供其 URL 的 Gateway 网关所有。其初始连接会忽略完整应用中持久化的远程 Gateway 网关选择，且不会更改或复制该选择的设置；只有身份验证保持在提供服务的 Gateway 网关的会话范围内。受信任的原生身份验证或另行确认的 `gatewayUrl` 覆盖可将其重新定向。核心会在插件 HTTP 路由和静态扩展名检测之前保留单段 `/approve` 命名空间，包括以 `.json` 或 `.js` 结尾的 ID；当 Control UI 服务被禁用时，保留路由会以 `404` 进行故障关闭。将该页面保留在 Control UI 主捆绑包中，以免延迟加载区块失败，导致安全决策被困在加载指示器上。

页面状态：

- 加载中
- 需要身份验证
- 待处理
- 正在处理
- 已在此处批准或拒绝
- 已在其他位置处理
- 已过期
- 已取消
- 禁止访问/未找到
- 连接错误，可重试

该页面调用 Gateway 网关 RPC，而不是第二个未经身份验证的 REST API。浏览器刷新时会重新读取持久状态。它绝不会将 Gateway 网关凭据放入 URL、查询参数或片段中。

## 授权和隐私

URL 是定位器，而非授权凭据。处理请求需要：

1. 已通过身份验证的 Gateway 网关连接；
2. `operator.approvals` 或 `operator.admin`；
3. 记录级审核者授权。

记录级规则：

- `operator.admin` 可以审核。
- 如果存在 `reviewer_device_ids`，则以其为准。只有列出的已配对
  `operator.approvals` 设备可以审核；请求设备没有隐式
  访问权限，除非它也在列表中。
- 如果没有明确的审核者列表，则发起请求的已配对
  `operator.approvals` 设备可以审核自己的记录。
- 真正的旧版记录如果没有请求者或审核者绑定，则保留广泛的
  已配对设备可见性，以免升级导致已经待处理的工作无法继续。
- 无设备的内部运行时可以通过受限范围的
  审批运行时连接处理记录，但不能读取记录。该权限仅来自
  经服务器身份验证的运行时令牌；公共 `approval.resolve` 字段无法
  授予该权限。
- 对于旧版适配器，实时请求者连接的所有权仍然有效；绝不会
  根据匹配的客户端名称推断所有权。
- 受众成员身份仅改变呈现方式，绝不会扩大授权范围。

`approval.get` 仅公开经过净化的审核者投影，并省略内部来源/受众路由键。PR 5 的 `session.approval` 事件会携带其唯一的目标 `sessionKey`，以及在 Gateway 网关于服务器端应用持久化的受众快照之后生成的 `sourceSessionKey`。现有的 exec/插件事件会保留其历史负载和受限接收者，直至使用方完成迁移。可执行请求、命令绑定和续接状态仅保留在进程本地的等待器中。持久化行包含安全的呈现内容以及生命周期、路由和审计元数据；它绝不会存储原始环境变量值、凭据、身份验证标头或渠道回调数据。

## 受众投影

在插入前仅计算一次受众，并持久化有序快照。所有权是图结构，并不总是单一的父级链：一个子项可能同时拥有当前控制者和原始请求者，而这些所有者可能通向不同的根节点。

使用确定性的广度优先遍历：

1. 使用源会话键初始化队列。
2. 对于每个出队的键，读取最新的子智能体注册表行，并按固定顺序将两条不同的所有权边入队：先是 `controllerSessionKey`，然后是 `requesterSessionKey`。
3. 存在可用的注册表行时，不要再沿用在 Steering 后可能已过时的会话条目继承关系。否则，将唯一的当前回退边 `parentSessionKey ?? spawnedBy` 入队。
4. 入队时执行规范化和去重，使首次发现的最短路径胜出。
5. 达到 64 个唯一键时停止；此受众规模上限也同时限制遍历深度。

注册表来源为 `src/agents/subagent-registry-read.ts`；所有权字段定义于 `src/agents/subagent-registry.types.ts`。会话回退字段定义于 `src/config/sessions/types.ts`。

即使审批待处理期间焦点或控制者所有权发生变化，请求投影和终态投影也使用同一个持久化受众。这可确保收到请求投影的每个受众会话流都能执行终态清理。解决操作始终以源审批 ID 为目标；受众会话绝不会收到克隆的审批状态。转发的渠道消息清理仍由下文单独的交付定位器后续工作处理。

不要仅因审批而写入转录消息、注入系统提示词、启动所有者轮次或发出 `sessions.changed`。

## 已交付表面的收敛

原生审批处理程序已经将其已交付消息条目保留足够长的时间，以便替换或停用有效控件。通用转发的审批消息目前会丢弃 `MessageReceipt`，因此在另一个表面上作出决定后，其旧控件可能仍显示为待处理状态。后续将通过共享状态数据库中的 `operator_approval_deliveries` 子表弥补这一缺口。

每一行存储审批 ID、唯一交付 ID、渠道/账户/精确路由、经过 JSON 验证且大小受限的渠道私有消息定位器、交付时间戳和终结状态。它绝不存储回调数据、决策令牌或原始审批请求。渠道负责定位器编码和消息变更；核心负责规范状态、目标选择、重试策略和回退终结文本。

投递注册与终态解析安全地并发执行：

1. 待处理的发送返回回执后，在同一事务中插入投递定位信息并读取父级审批状态。
2. 如果父级已经处于终态，则安排立即终态化，而不是让延迟投递继续处于待处理状态。
3. 每次提交的终态转换都会单独调度所有尚未最终处理的投递行；可丢弃的广播并非触发条件。
4. 渠道终态处理器会报告 `replaced`、`retired` 或 `unsupported`。已替换会抑制重复的终态消息；已停用会发送现有的终态跟进消息；不支持或失败时则回退，且不会回滚审批 CAS。
5. 启动时会重试仍有未完成投递的终态审批，使清理能够抵御 Gateway 网关重启。

此传输生命周期是一个可选的投递适配器钩子，而非渲染器或面向模型的消息操作。QQ C2C/群组消息目前没有编辑、删除或清除键盘的 API；该适配器仍不受支持，并且在传输协议获得变更 API 之前，只能在后续点击后显示规范事实。

## 重启、超时和路由语义

SQLite 持久化并不意味着执行可以恢复。命令/工具绑定仍保留在内存中，因为它们可能包含安全敏感的运行时事实，并不构成可恢复的作业契约。

Gateway 网关启动时：

- 生成新的运行时纪元；
- 以原子方式将旧纪元中处于待处理状态的行转换为 `cancelled`，原因为 `gateway-restart`；
- 保留这些行，使其 URL 能够说明发生了什么；
- 绝不针对缺失的运行时绑定执行后续批准。

计时器只是唤醒优化手段。截止时间的权威数据存储在 `expires_at_ms` 中；读取、等待和解决操作都会执行过期状态协调。

最终严格行为：

- 超时 -> `expired`，拒绝；
- 无路由 -> `denied`，拒绝；
- 运行中止 -> `cancelled`，拒绝；
- 格式错误的可信裁决 -> `denied`，拒绝；
- 只有明确允许的许可决定 -> `allowed`。

当前已发布的 Exec 行为仍与此契约冲突：

- `src/agents/bash-tools.exec-host-shared.ts` 可能应用 `askFallback`。
- `docs/tools/exec-approvals.md` 和 `docs/cli/approvals.md` 记录了该接口。

插件批准现在会在超时和裁决格式错误时以失败关闭；旧版
`timeoutBehavior` 字段仍会被接受，但会被忽略。Exec 严格语义的
后续工作必须同时更新代码、类型、文档、测试和变更日志，并接受
明确的所有者/安全审查。在迁移期间，`askFallback` 可以继续描述
进入关卡前的策略选择，但不得将已创建的待处理记录超时转变为批准。

## 兼容性计划

- 以增量方式扩展 Gateway 网关协议；不提升协议版本。
- 在外部边界保留现有的 Exec/插件方法和事件。
- 保留现有 ID，包括 `plugin:` 前缀，但不再将前缀用作类型信息。
- 保留 `/approve` 文本命令行为。
- 保留旧版按钮 URL/Web App 字段和命令操作，作为插件 SDK 的兼容性输入；新的核心输出采用类型化形式。
- 在同一项类型化操作变更中迁移所有内置渠道和内部调用方。
- 为新的 URL/页面以及后续的超时行为变更添加变更日志条目。
- 不添加引导模式设置。

## 推出计划

### PR 1：持久化生命周期

- 本设计说明。
- 共享 SQLite 架构、Kysely 生成、存储以及 30 天清理。
- Gateway 网关批准服务、运行时等待器桥接和重启孤立项处理。
- 统一的 `approval.get/resolve`。
- Exec/插件方法适配器。
- 首个回答胜出、幂等性、过期、授权和消费测试。
- 暂不更改 UI 或渠道行为。

### PR 2：类型化操作和渠道回调

- 类型化批准、URL 和 Web App 操作。
- 核心呈现构建器和插件 SDK 导出。
- 采用显式所有者种类的传输层私有回调编码。
- 针对超出传输限制的规范 ID，提供持久化的固定长度回调引用。
- 将内置渠道从命令文本和批准 ID 推断迁移出去。
- 被点击界面以规范的首个回答作为真实状态，并尽力更新仍处于活动状态的原生界面终止状态；持久化渠道消息终止化仍属于后续工作。
- SDK 和内置渠道测试。

### PR 3：Control UI 深层链接

- 独立的身份验证批准页面，以及感知基础路径的启动路由。
- 绑定提供服务的 Gateway 网关，而不更改操作员已保存的远程选择。
- 核心拥有的批准 HTTP 命名空间，包括类似资源的 ID。
- 由 Gateway 网关生成的 URL 载荷，并轮询待处理状态，直至生命周期事件发布。
- 移动端宽度、重新连接、竞争回答、重新加载和挂载路径证明。

### PR 4：原生客户端

- iOS 和 Android 审核界面使用感知种类的 `approval.get/resolve`；watchOS 通过已配对的 iPhone 中继对审核者安全的提示和决定。
- Watch 提供其紧凑中继契约支持的 Exec 决定：允许一次和拒绝。
- 以规范的首个回答终止真实状态取代本地尝试决定状态。
- 解决确认丢失或存在歧义时冻结控件，直到规范状态回读完成。
- 先前已发布的 Gateway 网关 v4 实例通过范围狭窄的旧版方法回退保留 Exec 审核；要保留跨界面终止状态，则需要使用统一方法。
- 审核者警告和所有者上下文在 iPhone、Watch 和 Android 上始终可见。
- 原生单元测试、构建和平台证明。

### PR 5：祖先生命周期传播

- 根据 PR 1 中持久化的受众快照，投递 `session.approval` 待处理/终止状态。
- 精确会话订阅、重新连接重放和终止墓碑，且不修改记录或唤醒智能体。
- 生命周期回调在持久化插入/CAS 后运行，且绝不成为批准权威来源。
- 嵌套子智能体和重新连接证明。

### PR 6：失败关闭行为

- 将 `node-invoke-plugin-policy.ts` 和嵌入式插件代理迁移，消除重复权威来源。
- 严格的超时、格式错误、无路由、绑定和仅允许一次消费语义。
- 弃用已发布的宽松超时设置，并在询问进入待处理状态后不再遵循这些设置。
- 多界面竞争和故障注入证明。

### 后续工作：持久化远程消息清理

- 持久化转发投递定位符，并在重启后将每条已投递的渠道消息置为终态。
- 将此传输生命周期与规范审批权限及类型化呈现操作分离。

## 测试

需要重点覆盖：

- 重新打开 SQLite 后仍保留待处理和终态投影。
- 两个并发解析器恰好产生一个 CAS 胜者。
- 相同决策的重试以幂等方式成功；冲突重试返回已记录的胜者。
- 在截止时间或之后进行解析无法批准。
- `allow-once` 恰好只能使用一次，且不会清除终态审计状态。
- 启动时取消更早的运行时纪元。
- 未授权的查找和解析不会泄露记录是否存在。
- 显式审核者允许列表和通用已配对 `operator.approvals` 行为。
- Exec 和插件旧版方法共享同一存储。
- Gateway 网关 request/list/get/resolve 架构和增量事件负载。
- 类型化操作规范化、回退渲染、SDK 导出和内置渠道开关。
- Telegram 回调编码包含传输层私有数据，且不进行命令字符串推断。
- 直接子级、分支控制器/请求者所有者、嵌套所有者、重新分配、会话字段回退、循环以及受众规模上限。
- 请求时与终态的受众数组完全相同。
- 所有者投影不会导致转录内容变更或唤醒智能体。
- Control UI 路由可在 `/` 和已配置的基础路径下工作；刷新后显示待处理或终态的真实状态。
- Control UI 和 Telegram 同时作答时只产生一个胜者，败者显示“已在其他位置解决”。
- 原生审批标识符和 Gateway 网关所有者标识符在路由和协调过程中完整保留 UTF-8 字节。
- 原生 RPC 系列协商为每条已准入的 Gateway 网关路由固定一个规范或旧版系列，并且使用后绝不静默降级。
- 原生解析确认丢失时冻结操作，直至完成规范回读；回读失败时不得伪造胜者，也不得确认 Watch 刷新。
- 仅当请求对应完全匹配的已配对 Gateway 网关所有者，且规范 iPhone 回读已完成时，才接受 Watch 快照请求关联。
- 通过 Testbox/Crabbox 进行用户路径验证，包括移动端宽度的审批页面、Telegram 操作清理，以及一次横跨 Android、iPhone 和 Watch 的待处理/解析/迟到败者往返流程。

## 可观测性

发出结构化且不含内容的状态转换日志，其中包含审批 ID、类型、源会话键、状态、原因和延迟。绝不记录预览或原始绑定。

跟踪：

- 按类型统计的请求数；
- 按类型/状态/原因统计的终态数；
- 待处理数量指标；
- 从请求到终态的延迟；
- 解析竞争结果：胜者、幂等重试、冲突、已过期；
- 投递路由数和无路由拒绝数；
- 启动时孤立项取消数；
- 受众规模。

即使后续事件投递失败，已提交的状态转换仍视为成功。生命周期订阅者通过 PR 5 重放和规范查找进行恢复。持久化渠道消息终态化仍作为上述独立的后续工作。

## 待定决策

1. **可从外部访问的 Control UI 来源。** 每个快照都携带稳定的相对 `urlPath`。仅当 Gateway 网关暴露成功后，才可以从缓存的 Tailscale Serve/Funnel 位置公布绝对 URL；`allowedOrigins`、请求 Host 标头、`gateway.remote.url` 以及仅用于显示的 loopback/LAN 候选项都不是规范来源。Telegram 可以使用其已通过身份验证的 Mini App 包装器，在引导启动期间保留审批路径。在另行评审并明确公共 URL 契约之前，任意反向代理仍只能使用相对路径。绝不能让渠道猜测来源。
2. **Exec 严格超时兼容性切换。** 插件审批超时现在采用故障关闭策略，且 `timeoutBehavior` 已弃用。剩余已发布的 `askFallback` 契约在待处理询问超时后停止授权执行之前，需要经过明确的所有者/安全评审，并制定变更日志、文档以及迁移/弃用决策。
3. **无 Gateway 网关的嵌入模式。** 建议：最初仅限本地使用，然后在存在 Gateway 网关时使其成为规范服务的客户端。不要公布任何服务器都无法解析的深层链接。
