---
read_when:
    - 设计 Codex 集群监督
    - 构建用于读取、Steer 或创建 Codex 会话的 OpenClaw 工具
    - 为有人监督的 Codex 选择本地、Cloudflare 和 VPS 部署
summary: 由 OpenClaw 控制的 Codex app-server 会话的集群监督计划。
title: Claw 监督器
x-i18n:
    generated_at: "2026-06-27T03:21:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw 监督器

## 目标

Claw 监督器让一个始终在线的 OpenClaw 实例监控并驱动一组 Codex 会话，而不改变正常的 Codex 用户体验。用户可以通过 SSH 进入主机，启动 Codex，在 TUI 中工作，同时监督器仍可读取会话、Steer 它、中断它、生成相关会话并接受交接。Codex 会话也可以通过 MCP 回调 OpenClaw。

## 产品模型

Codex 仍是主要工作界面。OpenClaw 监督 Codex，而不是把 Codex 隐藏在不透明的 OpenClaw 子智能体中。

OpenClaw 插件命名为 `codex-supervisor`。`crabfleet` 仍是 CRAB 机器的部署
和主机群配置，而不是可复用的插件名称。

该模型有三种角色：

- 人工附加的 Codex：通过共享 app-server 启动的普通交互式 Codex TUI。
- 自主 Codex：由监督器生成的 Codex app-server 线程，人工之后可以附加到它。
- 监督器 Claw：一个始终在线的 OpenClaw 智能体，具备用于集群状态、转录读取、Steering queue、中断、生成和交接的工具。

OpenClaw 可以在内部使用其现有的子智能体机制，但外部契约是一个可附加的 Codex 会话，带有 Codex 线程 ID。

## 架构

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

每台支持 Codex 的主机运行：

- Codex app-server 守护进程。
- 一个始终用 `--remote` 启动交互式 Codex 的启动器。
- 一个向监督器注册 app-server 端点和活动线程的连接器。

监督器运行：

- 端点注册表。
- 会话注册表。
- Codex app-server JSON-RPC 客户端池。
- 用于 Codex 到 Claw 调用的 MCP 服务器。
- 用于 Claw 到 Codex 控制的 OpenClaw 工具。
- 用于自主操作、审批和循环预防的策略引擎。

## Codex App-Server 契约

使用 Codex app-server API 作为规范控制平面：

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

交互式 Codex 必须使用 `codex --remote <endpoint>` 启动，以便 TUI 和监督器连接到同一个 app-server。独立的 `codex exec` 目前不是实时共享会话；在 Codex 支持 `exec --remote` 之前，请使用 app-server API 进行自主工作。

## 会话注册表

监督器为每个观察到的 Codex 线程存储一条记录：

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

本地实现可以从 Codex 线程元数据派生大多数字段。集群部署应使用主机身份、用户附加状态、git 状态和 sidecar 健康状况来丰富记录。

## Codex 的 MCP 表面

每个受监督的 Codex 都获得一个名为 `openclaw-codex-supervisor` 的 MCP 服务器。

工具：

- `codex_sessions_list`：列出可见的 Codex 会话。
- `codex_session_read`：读取一个转录。
- `codex_session_send`：向空闲线程发送消息，或 Steer 活跃线程。
- `codex_session_interrupt`：中断活跃轮次。
- `codex_endpoint_probe`：验证端点连接性。
- `claw_report_progress`：向监督器发布当前任务状态。
- `claw_ask`：向监督器请求帮助或委派。
- `codex_spawn`：创建新的自主 Codex 会话。
- `codex_handoff`：请求人工或对等接管。

资源：

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw 控制表面

始终在线的 Claw 获得与内部工具相同的原语：

- 列出会话和端点
- 读取转录
- 发送/Steer 文本
- 中断活跃工作
- 生成新会话
- 汇总和分配会话
- 向筛选后的组广播指令
- 将会话标记为受阻、完成或放弃

工具行为：

- 如果目标线程空闲，`codex_session_send` 映射到 `turn/start`。
- 如果目标线程活跃且可见正在进行的轮次 ID，则映射到 `turn/steer`。
- 如果无法识别活跃轮次，该工具会失败关闭，而不是创建无关轮次。
- 暴露给 Codex 的 MCP 写入控制保持禁用，除非受信任的仅监督器策略启用它们。
- 原始转录读取保持禁用，除非受信任的仅监督器策略启用它们。
- 自主审批默认拒绝工具/文件审批，除非显式策略另有说明。

## 启动流程

交互式主机登录：

1. 用户通过 SSH 进入 CRAB 主机。
2. SSH 服务启动或验证 `codex app-server daemon start`。
3. 登录包装器启动 `codex --remote unix:// --cd <workspace>`。
4. 主机连接器注册端点和已加载线程。
5. 监督器发出高优先级集群事件：新的 Codex 会话、工作区、人工附加状态、当前任务预览。
6. 监督器 Claw 可以立即读取和 Steer。

自主生成：

1. 监督器选择主机和工作区。
2. 主机连接器打开或恢复 Codex app-server 线程。
3. 监督器用任务文本和 MCP 配置启动第一个轮次。
4. 会话注册表将其标记为自主且可附加。
5. 一旦 Codex 支持该确切 UX，人工之后可以用 `codex --remote <endpoint> resume <threadId>` 附加，或通过同一 app-server 上的当前恢复流程附加。

## 部署

首选控制平面：

- 主机连接器保持到监督器的出站 WebSocket 连接。
- 监督器状态存放在 OpenClaw Gateway 网关存储中。
- Codex app-server 保持在每台主机本地；永远不要把原始未认证的 app-server 暴露到公共互联网。

Cloudflare 可行性：

- 适合注册表、Durable Objects、WebSocket 扇入、轻量事件路由以及公共 MCP/Gateway 网关端点。
- 单靠它不足以直接控制私有主机，因为 Workers 无法拨号任意私有 Unix socket 或 local loopback app-server。
- 当每台主机连接器都通过出站 WebSocket 回连时，使用 Cloudflare。

VPS 回退：

- 当需要长生命周期进程控制、SSH 隧道、私有网络路由或本地文件系统访问时，使用 Hetzner 服务。
- 保持相同协议：主机连接器出站、监督器注册表集中、Codex app-server 本地。

## 安全

- 默认绑定是本地 Unix socket。
- 远程 app-server 使用令牌或签名 bearer 认证。
- 主机连接器用带范围的主机令牌向监督器认证。
- 监督器工具强制执行按会话策略：读取、Steer、中断、生成、审批。
- 跨智能体消息包含 `originSessionId`；自回显会被丢弃。
- 广播需要显式筛选器和有界目标数量。
- 转录读取在 OpenClaw 边界处脱敏密钥。
- 除非策略允许，源自监督器的轮次审批请求默认拒绝。

## 实施计划

阶段 1：本地监督器 MVP

- 为 stdio 代理和 WebSocket 端点添加 Codex app-server JSON-RPC 客户端。
- 添加监督器端点/会话注册表。
- 添加 MCP 工具：列出、读取、发送、中断、探测。
- 添加端点的本地环境配置。
- 添加假 app-server 测试和一次真实本地 app-server 冒烟测试。

阶段 2：OpenClaw 集成

- 在 `codex-supervisor` 插件中注册监督器工具。
- 将监督器 MCP 注入 Codex 线程配置。
- 将会话摘要添加到智能体上下文。
- 当新的 Codex 线程出现时添加事件通知。
- 为自主发送/中断/生成添加策略配置。

阶段 3：集群连接器

- 主机 sidecar 注册 app-server 端点、主机元数据、git/工作区元数据以及人工附加状态。
- 为 Cloudflare 或 VPS 控制平面添加出站 WebSocket 连接器。
- 添加重连、Heartbeat 和过期会话清理。
- 添加 CRAB SSH 启动器包装器。

阶段 4：自主运行

- 添加生成/恢复/接管流程。
- 添加广播和委派。
- 添加进度报告和任务状态摘要。
- 添加循环预防和速率限制。
- 添加仪表板视图。

阶段 5：多 Claw

- 按组分片会话。
- 为每个会话添加领导权/租约。
- 添加审计日志和重放。
- 添加 Claw 组之间的升级处理。

## 验收测试

- 人工通过共享 app-server 启动 Codex TUI。
- 监督器通过 `thread/loaded/list` 列出活动线程。
- 监督器通过 `thread/read` 读取转录。
- 监督器通过 `turn/start` 向空闲线程发送文本。
- 监督器通过 `turn/steer` Steer 活跃线程。
- 监督器中断通过 `turn/interrupt` 停止活跃轮次。
- Codex 调用监督器 MCP 并列出对等会话。
- 生成一个自主 Codex，之后由人工附加。
- 丢失的主机连接器将会话标记为过期，而不删除历史。

## 待解问题

- 针对未带 TUI 生成的 app-server 线程，Codex TUI 的确切附加 UX。
- Codex 是否应为无头实时共享运行添加 `exec --remote`。
- 持久状态所有者：OpenClaw Gateway 网关 DB、Cloudflare Durable Object 或 VPS 数据库。
- 源自监督器的轮次审批策略粒度。
- 应将多少转录摘要注入始终在线的 Claw 上下文，而不是作为工具/资源保留。
