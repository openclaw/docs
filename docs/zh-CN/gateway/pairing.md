---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 扩展 Gateway 网关协议以支持节点管理
summary: 节点能力审批：完成设备配对后，节点如何获得命令调用权限
title: 节点配对
x-i18n:
    generated_at: "2026-07-11T20:33:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

节点配对分为两层，二者都存储在 Gateway 网关 SQLite 状态数据库的已配对设备记录中：

- **设备配对**（角色 `node`）控制 `connect` 握手。请参阅下文的
  [受信任 CIDR 设备自动批准](#trusted-cidr-device-auto-approval)
  和[渠道配对](/zh-CN/channels/pairing)。
- **节点能力批准**（`node.pair.*`）控制已连接节点可以公开哪些声明的
  能力/命令。Gateway 网关是事实来源；UI（macOS 应用、Control UI）只是用于批准或
  拒绝待处理请求的前端。

以前独立的节点配对存储（`nodes/paired.json`，其中包含每个节点的
令牌，已于 2026 年 1 月从连接路径中停用）现已移除：Gateway 网关会在启动时一次性将
所有剩余记录合并到设备记录中，并使用 `.migrated` 后缀归档
旧文件。旧版 TCP 桥接支持也已移除。

## 能力批准的工作原理

1. 节点连接到 Gateway 网关 WS（设备配对控制此步骤）。
2. Gateway 网关将声明的能力/命令表面与已批准的表面进行比较；新增或扩大的表面会在
   设备记录中存储一个**待处理请求**，并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 在批准之前，节点命令会保持被过滤状态；批准后将公开声明的
   表面，但仍受常规命令策略约束。

待处理请求会在**节点上次重试后的 5 分钟**自动过期——持续主动重新连接的节点会使其唯一的待处理请求保持有效，
而不会在每次尝试时都生成新请求（以及批准提示）。

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
- `node.pair.remove` - 移除已配对节点。这会撤销已配对设备存储中该设备的 `node`
  角色，同时删除已批准的节点表面，并
  使该设备的节点角色会话失效/断开连接。**混合角色**
  设备（例如还拥有 `operator` 的设备）会保留其记录，只会
  失去 `node` 角色；仅限节点的设备记录则会被删除。授权：
  `operator.pairing` 可以移除非操作员节点记录；使用设备令牌的调用方若要在混合角色设备上撤销其**自身的**节点角色，
  还需要
  `operator.admin`。
- `node.rename` - 重命名已配对节点面向操作员显示的名称。

已于 2026.7 移除：`node.pair.request` 和 `node.pair.verify`。待处理
请求现在由 Gateway 网关在节点连接期间自行创建，而它们过去所服务的
独立单节点令牌已不存在；节点身份验证使用
设备配对令牌。

注意：

- 使用未变化表面进行重新连接时会复用待处理请求；重复
  请求会刷新已存储的节点元数据，以及最新的已列入允许列表的
  声明命令快照，供操作员查看。
- 操作员权限范围级别和批准时检查的摘要请参阅
  [操作员权限范围](/zh-CN/gateway/operator-scopes)。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行
  额外的批准权限范围：
  - 无命令请求：`operator.pairing`
  - 非 Exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对批准记录的是受信任的能力表面。它**不会**为每个节点固定实时节点命令表面。

- 实时节点命令来自节点连接时声明的内容，并由
  Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和
  `denyCommands`）进行过滤。
- 每个节点的 `system.run` 允许和询问策略位于节点上的
  `exec.approvals.node.*` 中，而不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：**从 `2026.3.31` 开始，在节点配对获批准前，节点命令处于禁用状态。仅完成设备配对已不足以公开声明的节点命令。
</Warning>

节点首次连接时，会自动请求配对。
在该请求获批准前，来自该节点的所有待处理节点命令都会被
过滤，且不会执行。配对获批准后，节点声明的
命令将变为可用，但仍受常规命令策略约束。

这意味着：

- 以前仅依靠设备配对来公开命令的节点，现在
  还必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不会延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：**源自节点的运行现在仅保留在缩减后的受信任表面内。
</Warning>

源自节点的摘要和相关会话事件仅限于
预期的受信任表面。以前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程
可能需要调整。
此项加固可防止节点事件突破节点信任边界所允许的范围，
升级为主机级工具访问权限。

持久化节点在线状态更新遵循相同的身份边界：
仅接受来自已通过身份验证的节点设备会话的 `node.presence.alive` 事件，
并且仅当设备/节点身份已配对时才更新配对元数据。仅凭自行声明的 `client.id` 值，
不足以写入最后在线状态。

## 通过 SSH 验证的设备自动批准（默认）

当来自私有/CGNAT 地址的 `role: node` 设备首次请求配对时，
如果 Gateway 网关能够**通过 SSH 证明机器所有权**，则会自动批准：它会
反向连接到配对主机（`BatchMode`、`StrictHostKeyChecking=yes`），
在该主机上运行 `openclaw node identity --json`，并且仅当远程
设备 ID 和公钥与待处理请求完全匹配时才批准。密钥匹配
使这一流程具备安全性：仅可访问绝不会触发批准，因此 NAT 共同租户、
共享主机上的其他用户以及局域网欺骗都会转入常规
提示流程。

默认启用。触发要求：

- Gateway 网关进程用户（或 `sshVerify.user`）能够以非交互方式通过 SSH 连接节点主机
  （使用密钥/智能体；Tailscale SSH 也可用），并且主机密钥
  已受信任。
- 在非交互式 `sh -lc` 中，远程 `PATH` 可以解析到 `openclaw`。
- 连接 IP 是直接连接（未经过代理、非环回）的私有、ULA、
  链路本地或 CGNAT 地址，或者在设置 `sshVerify.cidrs` 后与其匹配。
- 适用资格下限与受信任 CIDR 批准相同：仅限全新且未请求权限范围的节点
  配对；升级、浏览器、Control UI 和 WebChat 始终需要提示。

探测运行期间，节点客户端会被告知继续重试
（`wait_then_retry`），而不是暂停并等待手动批准；如果探测
失败，下一次尝试将回退到常规提示流程。失败目标
会进入短暂冷却期（密钥不匹配后 5 分钟）。

获批准的设备会记录 `approvedVia: "ssh-verified"`，并在同一步骤中批准其首次声明的
能力表面——密钥匹配已经证明
节点以操作员账户在其拥有的机器上运行，这与
手动能力批准所确认的主张相同。之后的表面升级仍需
提示。

加固或禁用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## 自动批准（macOS 应用）

在满足以下条件时，macOS 应用可以尝试**静默批准**节点能力请求：

- 请求被标记为 `silent`（当设备配对以非交互方式获批准时，Gateway 网关会将首次能力
  表面标记为静默），并且
- 应用可以使用同一
  用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，则回退到常规 Approve/Reject 提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍需手动完成。对于 Gateway 网关已信任网络路径的私有节点
网络，操作员可以通过显式 CIDR 或精确 IP
选择启用：

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
- 不存在覆盖整个局域网或私有网络的自动批准模式；上文的 SSH 验证
  自动批准要求设备密钥通过加密匹配，绝不会
  仅凭网络位置批准。
- 只有全新的 `role: node` 设备配对请求且未请求任何权限范围时
  才符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端仍需手动批准。
- 角色、权限范围、元数据和公钥升级仍需手动批准。
- 同主机环回受信任代理标头路径不符合条件，因为该
  路径可能被本地调用方伪造。

## 静默配对取代清理

非交互式批准会在已配对设备记录中记录其来源：
同主机本地策略批准记录为 `silent`，受信任 CIDR 节点批准记录为
`trusted-cidr`，SSH 验证节点批准记录为 `ssh-verified`。状态目录是临时性的客户端（临时主目录、
容器、每次运行独立的沙箱）会在每次运行时生成全新的设备密钥对，并且每次
运行都会作为全新设备静默重新配对——如果不清理，已配对列表
每次运行都会增加一条过时记录。

当 Gateway 网关静默批准一个**本地**设备配对时，它会停用
属于同一客户端集群（`clientId`、`clientMode` 和显示名称均匹配）且当前
未连接的旧 `silent` 批准记录。本地客户端运行在 Gateway 网关主机本身，
因此该集群键不可能与其他机器匹配。已停用记录的令牌会立即失效；
所有匹配的旧版节点配对条目都会被清除，并广播一个 `node.pair.resolved`
移除事件。

边界：

- 只有最近一次批准来自同主机本地（`silent`）的记录
  才能作为触发记录和目标记录。受信任 CIDR 和 SSH 验证配对
  跨越不同主机，而显示元数据并非机器身份，因此它们
  绝不会被自动移除——请使用 Control UI 清理功能或
  `openclaw nodes remove` 移除这些记录。
- 所有者批准以及二维码/设置代码（引导）配对绝不会被
  自动移除。在来源记录机制出现之前获批准的记录仍受保护，
  即使同一设备 ID 后来再次通过静默方式获批准也是如此。
- 当前已连接的设备会被跳过，因此使用不同状态目录的并发本地会话
  在存活期间会保留其令牌。最近一分钟内获批准的记录
  也会被跳过，以免同时进行的配对握手
  在连接注册前相互停用对方。
- 受影响的客户端按设计均为本地客户端，因此会在
  下次连接时静默重新配对。

## 元数据升级自动批准

当已配对设备重新连接且仅包含非敏感元数据
变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准的适用范围很窄：它仅适用于受信任的非浏览器本地重新连接，
且这些连接已证明持有本地或共享凭据，其中包括
操作系统版本元数据变化后同主机原生应用的重新连接。浏览器/Control UI 客户端和远程客户端
仍使用显式重新批准流程。权限范围升级（从读取升级为
写入/管理员）和公钥变更**不**符合
元数据升级自动批准条件；它们仍会生成显式重新批准请求。

## 二维码配对辅助工具

`/pair qr` 会将配对载荷呈现为结构化媒体，以便移动端和浏览器客户端直接扫描。

删除设备时，还会清除该设备 ID 对应的所有过期待处理配对请求，因此撤销设备后，`nodes pending` 不会显示孤立记录。

## 本地性与转发请求头

仅当原始套接字和所有上游代理证据均表明连接来自回环地址时，Gateway 网关配对才会将其视为回环连接。如果请求通过回环地址到达，但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 请求头证据，则这些转发请求头证据会使回环本地性声明失效，配对流程将要求明确批准，而不会静默地将该请求视为同一主机上的连接。有关操作员身份验证的等效规则，请参阅[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态保存在已配对设备记录中，这些记录位于 Gateway 网关状态目录（默认为 `~/.openclaw`）下的共享 SQLite 状态数据库中：

- `~/.openclaw/state/openclaw.sqlite`（包含设备身份验证信息的已配对设备、已批准的节点能力面、待处理的能力面请求、待处理的设备配对请求以及引导令牌）

如果覆盖 `OPENCLAW_STATE_DIR`，数据库也会随之迁移。从使用 JSON 存储的版本升级而来的 Gateway 网关会在启动时导入这些数据，并保留 `devices/*.json.migrated` 和 `nodes/*.json.migrated` 归档。

安全说明：

- 设备令牌属于机密信息；请将状态数据库视为敏感数据。
- 轮换设备令牌使用 `openclaw devices rotate` / `device.token.rotate`。

## 传输行为

- 传输层是**无状态的**；它不存储成员关系。
- 如果 Gateway 网关离线或已禁用配对，节点将无法配对。
- 在远程模式下，配对针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [节点 CLI](/zh-CN/cli/nodes)
- [设备 CLI](/zh-CN/cli/devices)
