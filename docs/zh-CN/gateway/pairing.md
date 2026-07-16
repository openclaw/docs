---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 扩展 Gateway 网关协议以支持节点管理
summary: 节点能力审批：节点在设备配对后如何获得命令访问权限
title: 节点配对
x-i18n:
    generated_at: "2026-07-16T11:33:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

节点配对分为两层，两者都存储在 Gateway 网关 SQLite 状态数据库的已配对设备记录中：

- **设备配对**（角色 `node`）控制 `connect` 握手。请参阅下方的
  [受信任 CIDR 设备自动批准](#trusted-cidr-device-auto-approval)
  和[渠道配对](/zh-CN/channels/pairing)。
- **节点能力批准**（`node.pair.*`）控制已连接节点可以公开哪些已声明的
  能力/命令。Gateway 网关是事实来源；UI（macOS 应用、Control UI）是用于批准或
  拒绝待处理请求的前端。

原先独立的节点配对存储（`nodes/paired.json`，包含每节点
令牌，已于 2026 年 1 月从连接路径中停用）现已移除：Gateway 网关会在启动时一次性将
所有剩余行合并到设备记录中，并使用 `.migrated` 后缀归档
旧文件。旧版 TCP 桥接支持已移除。

## 能力批准的工作方式

1. 节点连接到 Gateway 网关 WS（设备配对控制此步骤）。
2. Gateway 网关将已声明的能力/命令表面与
   已批准的表面进行比较；新的或扩大的表面会在设备记录中存储一个**待处理请求**，并
   发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 在批准之前，节点命令会保持过滤状态；批准后将公开已声明的
   表面，但仍受常规命令策略约束。

待处理请求会在**节点最后一次重试后 5 分钟**自动过期——持续重新连接的节点会保持其唯一的待处理请求有效，
而不会在每次尝试时生成新请求（和批准提示）。

## CLI 工作流（适用于无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 显示已配对/已连接的节点及其能力。

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` - 创建新的待处理请求时发出。
- `node.pair.resolved` - 请求获批准、被拒绝或
  过期时发出。

方法：

- `node.pair.list` - 列出待处理节点和已配对节点（`operator.pairing`）。
- `node.pair.approve` - 批准待处理请求。
- `node.pair.reject` - 拒绝待处理请求。
- `node.pair.remove` - 移除已配对节点。此操作会撤销该设备在已配对设备存储中的 `node`
  角色，同时移除已批准的节点表面，并
  使该设备的节点角色会话失效/断开连接。**混合角色**
  设备（例如还持有 `operator` 的设备）会保留其记录，仅
  失去 `node` 角色；仅有节点角色的设备记录则会被删除。授权：
  `operator.pairing` 可以移除非操作员节点记录；使用设备令牌的调用方
  若要撤销混合角色设备上其**自身的**节点角色，还需要
  `operator.admin`。
- `node.rename` - 重命名已配对节点面向操作员的显示名称。

已在 2026.7 中移除：`node.pair.request` 和 `node.pair.verify`。待处理
请求由 Gateway 网关本身在节点连接期间创建，而它们所服务的
独立每节点令牌已不复存在；节点身份验证使用
设备配对令牌。

注意：

- 表面未发生变化的重新连接会复用待处理请求；重复
  请求会刷新存储的节点元数据，以及供操作员查看的最新已列入允许列表的
  已声明命令快照。
- 操作员权限范围级别和批准时检查汇总于
  [操作员权限范围](/zh-CN/gateway/operator-scopes)。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行
  额外的批准权限范围：
  - 无命令请求：`operator.pairing`
  - 普通命令请求：`operator.pairing` + `operator.write`
  - 包含 `system.run`、`system.run.prepare`、
    `system.which`、`browser.proxy`、`fs.listDir` 或
    `system.execApprovals.get/set` 的管理员敏感请求：`operator.pairing` + `operator.admin`

<Warning>
节点配对批准会记录受信任的能力表面。它**不会**按节点固定实时节点命令表面。

- 实时节点命令来自节点连接时声明的内容，并由
  Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和
  `denyCommands`）过滤。
- 每节点 `system.run` 允许和询问策略位于
  `exec.approvals.node.*` 中的节点上，而不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：**从 `2026.3.31` 开始，在节点配对获批准之前，节点命令会被禁用。仅完成设备配对已不足以公开声明的节点命令。
</Warning>

节点首次连接时，会自动请求配对。
在该请求获批准之前，来自该节点的所有待处理节点命令都会被
过滤且不会执行。配对获批准后，节点声明的
命令将变为可用，但仍受常规命令策略约束。

这意味着：

- 此前仅依赖设备配对来公开命令的节点，
  现在还必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不会延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：**源自节点的运行现在会限制在缩减后的受信任表面上。
</Warning>

源自节点的摘要和相关会话事件仅限于
预期的受信任表面。此前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程
可能需要调整。
这种加固可防止节点事件升级为超出节点信任边界所允许范围的
主机级工具访问。

持久化节点在线状态更新遵循相同的身份边界：
仅接受来自已通过身份验证的节点设备会话的 `node.presence.alive` 事件，
并且仅当设备/节点身份已配对时才更新配对元数据。自行声明的 `client.id`
值不足以写入最后在线状态。

## SSH 验证的设备自动批准（默认）

当 Gateway 网关能够**通过 SSH 证明机器所有权**时，来自私有/CGNAT 地址的首次 `role: node`
设备配对会自动获批：它会
反向连接到配对主机（`BatchMode`、`StrictHostKeyChecking=yes`），
在该主机上运行 `openclaw node identity --json`，并且仅当远程
设备 ID 和公钥与待处理请求完全匹配时才批准。密钥匹配
保障了此机制的安全性：仅能连通绝不会触发批准，因此 NAT 共同租户、
共享主机上的其他用户和局域网欺骗都会转入常规
提示流程。

默认启用。触发要求：

- Gateway 网关进程用户（或 `sshVerify.user`）能够以非交互方式通过 SSH 连接节点主机
  （使用密钥/智能体；Tailscale SSH 也可），并且主机密钥
  已受信任。
- `openclaw` 可在远程 `PATH` 上解析，以用于非交互式 `sh -lc`。
- 连接 IP 是直接的（未经代理、非 local loopback）私有、ULA、
  链路本地或 CGNAT 地址，或者在设置 `sshVerify.cidrs` 后与之匹配。
- 适用条件下限与受信任 CIDR 批准相同：仅限全新且无权限范围的节点
  配对；升级、浏览器、Control UI 和 WebChat 始终需要提示。

探测运行期间，节点客户端会被告知继续重试
（`wait_then_retry`），而不是暂停等待手动批准；如果探测
失败，下一次尝试会回退到常规提示流程。失败的目标
会进入短暂冷却期（密钥不匹配后 5 分钟）。

获批准的设备会记录 `approvedVia: "ssh-verified"`，其首次声明的
能力表面也会在同一步骤中获批准——密钥匹配已经证明
节点在操作员拥有的机器上以其账户运行，这与手动能力批准所确认的
事实相同。后续表面升级仍会触发提示。

加固或禁用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // 完全禁用：
        sshVerify: false,
        // ...或限定/调整探测：
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以尝试**静默批准**节点能力请求：

- 请求被标记为 `silent`（当设备配对以非交互方式获批准时，Gateway 网关会将首个能力
  表面标记为静默），并且
- 应用可以使用同一
  用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，则会回退到常规 Approve/Reject 提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍需手动完成。对于 Gateway 网关已经信任网络路径的私有节点
网络，操作员可以通过显式 CIDR 或精确 IP 选择启用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

安全边界：

- 未设置 `gateway.nodes.pairing.autoApproveCidrs` 时禁用。
- 不存在涵盖整个局域网或私有网络的自动批准模式；上述经过 SSH 验证的
  自动批准要求加密设备密钥匹配，绝不会
  仅依据网络位置。
- 仅全新的、未请求任何权限范围的 `role: node` 设备配对请求
  符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端仍需手动批准。
- 角色、权限范围、元数据和公钥升级仍需手动批准。
- 同主机 local loopback 受信任代理标头路径不符合条件，因为该
  路径可能被本地调用方伪造。

## 静默配对取代清理

非交互式批准会在已配对设备记录中记载其来源：
同主机本地策略批准记为 `silent`，受信任 CIDR 节点批准记为
`trusted-cidr`，经过 SSH 验证的节点批准记为 `ssh-verified`。状态目录为临时性的客户端（临时主目录、
容器、每次运行单独的沙箱）会在每次运行时生成新的设备密钥对，并且每次
运行都会作为全新设备静默重新配对——如果不清理，已配对列表
每次运行都会增加一条过时记录。

当 Gateway 网关静默批准**本地**设备配对时，它会停用
属于同一客户端集群（`clientId`、`clientMode` 和显示名称均匹配）且当前
未连接的旧 `silent` 批准记录。本地客户端运行在 Gateway 网关主机本身，因此集群键
不可能与其他机器匹配。已停用记录的令牌会立即失效；
任何匹配的旧版节点配对条目都会被清除，并广播 `node.pair.resolved`
移除事件。

边界：

- 只有最新批准来自同一主机本地（`silent`）的记录才符合条件，
  既可作为触发记录，也可作为目标记录。受信任 CIDR 和经 SSH 验证的配对会跨越主机，
  此时显示元数据并不代表机器身份，因此绝不会被自动移除——对于这些记录，请使用
  Control UI 清理功能或 `openclaw nodes remove`。
- 经所有者批准以及通过二维码/设置代码（引导）完成的配对绝不会被自动移除。
  在来源信息功能引入之前批准的记录仍会受到保护，即使之后对同一设备 ID
  进行了静默重新批准也是如此。
- 当前已连接的设备会被跳过，因此使用不同状态目录的并发本地会话在存活期间
  会保留其令牌。最近一分钟内批准的记录也会被跳过，因此同时进行的配对握手
  不会在各自连接完成注册前相互淘汰。
- 受影响的客户端按设计均为本地客户端，因此会在下次连接时静默重新配对。

## 元数据升级自动批准

当已配对设备重新连接且仅有非敏感元数据发生变化时
（例如显示名称或客户端平台提示），OpenClaw 会将其视为 `metadata-upgrade`。
静默自动批准的适用范围很窄：它仅适用于受信任的非浏览器本地重新连接，
且这些连接已证明持有本地或共享凭据；其中包括操作系统版本元数据变更后，
同一主机上的原生应用重新连接。浏览器/Control UI 客户端和远程客户端
仍使用显式重新批准流程。权限范围升级（从读取升级为写入/管理员）和公钥变更
**不**符合元数据升级自动批准的条件；它们仍会作为显式重新批准请求处理。

## 二维码配对辅助功能

`/pair qr` 会将配对载荷渲染为结构化媒体，以便移动端和
浏览器客户端直接扫描。

删除设备时，还会清理该设备 ID 对应的所有过期待处理配对请求，
因此撤销后 `nodes pending` 不会显示孤立记录。

## 本地性与转发标头

仅当原始套接字和所有上游代理证据都一致时，Gateway 网关配对才会将连接视为
local loopback。如果请求通过 local loopback 到达，但携带了
`Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头证据，
则该转发标头证据会使 local loopback 本地性声明失效，配对路径将要求显式批准，
而不会静默地将请求视为同一主机连接。有关操作员身份验证的等效规则，请参阅
[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在共享 SQLite 状态数据库中的已配对设备记录内，
该数据库位于 Gateway 网关状态目录下（默认值为 `~/.openclaw`）：

- `~/.openclaw/state/openclaw.sqlite`（已配对设备及其设备身份验证信息、
  已批准的节点界面、待处理的界面请求、待处理的设备配对请求和引导令牌）

如果覆盖 `OPENCLAW_STATE_DIR`，数据库也会随之移动。从使用 JSON 存储的版本
升级而来的 Gateway 网关会在启动时导入这些数据，并留下
`devices/*.json.migrated` 和 `nodes/*.json.migrated` 归档。

安全说明：

- 设备令牌属于机密信息；请将状态数据库视为敏感数据。
- 轮换设备令牌使用 `openclaw devices rotate` /
  `device.token.rotate`。

## 传输行为

- 传输层是**无状态的**；它不存储成员关系。
- 如果 Gateway 网关离线或配对已禁用，节点将无法配对。
- 在远程模式下，配对针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [节点 CLI](/zh-CN/cli/nodes)
- [设备 CLI](/zh-CN/cli/devices)
