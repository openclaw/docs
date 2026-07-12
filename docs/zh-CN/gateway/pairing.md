---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 节点能力审批：节点在设备配对后如何获得命令访问权限
title: 节点配对
x-i18n:
    generated_at: "2026-07-12T14:32:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

节点配对分为两层，两者都存储在 Gateway 网关的 SQLite 状态数据库中的已配对设备记录上：

- **设备配对**（角色 `node`）控制 `connect` 握手。请参阅下文的
  [受信任 CIDR 设备自动批准](#trusted-cidr-device-auto-approval)
  和[频道配对](/zh-CN/channels/pairing)。
- **节点能力批准**（`node.pair.*`）控制已连接节点可以公开哪些已声明的能力/命令。Gateway 网关是事实来源；UI（macOS 应用、Control UI）只是用于批准或拒绝待处理请求的前端。

此前独立的节点配对存储（`nodes/paired.json`，包含每节点令牌，已于 2026 年 1 月从连接路径中停用）现已移除：Gateway 网关会在启动时一次性将任何剩余行合并到设备记录中，并使用 `.migrated` 后缀归档旧文件。旧版 TCP 桥接支持已移除。

## 能力批准的工作原理

1. 节点连接到 Gateway 网关 WS（设备配对控制此步骤）。
2. Gateway 网关将声明的能力/命令范围与已批准范围进行比较；新增或扩大的范围会在设备记录上存储一个**待处理请求**，并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 在批准之前，节点命令会保持被过滤状态；批准后会公开声明的范围，但仍受常规命令策略约束。

待处理请求会在**节点最后一次重试后的 5 分钟**自动过期——持续主动重新连接的节点会使其唯一的待处理请求保持有效，而不会在每次尝试时生成新请求（以及批准提示）。

## CLI 工作流（适合无头环境）

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
- `node.pair.resolved` - 请求被批准、拒绝或过期时发出。

方法：

- `node.pair.list` - 列出待处理和已配对的节点（`operator.pairing`）。
- `node.pair.approve` - 批准待处理请求。
- `node.pair.reject` - 拒绝待处理请求。
- `node.pair.remove` - 移除已配对节点。这会撤销已配对设备存储中该设备的 `node` 角色，同时移除已批准的节点范围，并使该设备的节点角色会话失效/断开连接。**混合角色**设备（例如还持有 `operator` 的设备）会保留其记录，仅失去 `node` 角色；仅含节点角色的设备记录会被删除。授权：
  `operator.pairing` 可以移除非操作员节点记录；使用设备令牌的调用方若要撤销混合角色设备上其**自身的**节点角色，还需要
  `operator.admin`。
- `node.rename` - 重命名已配对节点面向操作员的显示名称。

已在 2026.7 中移除：`node.pair.request` 和 `node.pair.verify`。待处理请求现在由 Gateway 网关在节点连接期间自行创建，而它们此前所服务的独立每节点令牌已不复存在；节点身份验证使用设备配对令牌。

注意：

- 使用未更改范围重新连接时会复用待处理请求；重复请求会刷新存储的节点元数据和最新的允许列表声明命令快照，供操作员查看。
- 操作员权限范围级别和批准时检查汇总于
  [操作员权限范围](/zh-CN/gateway/operator-scopes)。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行额外的批准权限范围：
  - 无命令请求：`operator.pairing`
  - 非 Exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对批准会记录受信任的能力范围。它**不会**为每个节点固定实时节点命令范围。

- 实时节点命令来自节点连接时所声明的内容，并由 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和
  `denyCommands`）过滤。
- 每节点 `system.run` 的允许和询问策略位于节点上的
  `exec.approvals.node.*` 中，而不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：**从 `2026.3.31` 开始，在节点配对获批之前，节点命令将被禁用。仅完成设备配对已不足以公开声明的节点命令。
</Warning>

节点首次连接时，会自动请求配对。在该请求获批之前，来自该节点的所有待处理节点命令都会被过滤且不会执行。配对获批后，节点声明的命令将变为可用，但仍受常规命令策略约束。

这意味着：

- 此前仅依赖设备配对来公开命令的节点，现在还必须完成节点配对。
- 在配对获批之前排队的命令会被丢弃，而不会延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：**节点发起的运行现在仅限于缩减后的受信任范围。
</Warning>

节点发起的摘要及相关会话事件仅限于预期的受信任范围。此前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程可能需要调整。此项加固可防止节点事件升级为超出节点信任边界所允许范围的主机级工具访问。

持久节点在线状态更新遵循相同的身份边界：仅接受来自已通过身份验证的节点设备会话的
`node.presence.alive` 事件，并且仅当设备/节点身份已配对时才更新配对元数据。自行声明的 `client.id` 值不足以写入最后在线状态。

## 通过 SSH 验证的设备自动批准（默认）

当首次从私有地址/CGNAT 地址发起 `role: node` 设备配对时，如果 Gateway 网关能够**通过 SSH 证明机器所有权**，则会自动批准：它反向连接到发起配对的主机（`BatchMode`、`StrictHostKeyChecking=yes`），在该主机上运行 `openclaw node identity --json`，并且仅当远程设备 ID 和公钥与待处理请求完全匹配时才批准。密钥匹配是确保安全的关键：仅可达绝不会触发批准，因此 NAT 共同租户、共享主机上的其他用户以及局域网欺骗都会进入常规提示流程。

默认启用。触发要求：

- Gateway 网关进程用户（或 `sshVerify.user`）可以非交互方式通过 SSH 连接到节点主机（密钥/代理；Tailscale SSH 也可用），并且主机密钥已受信任。
- 在非交互式 `sh -lc` 中，远程 `PATH` 可以解析到 `openclaw`。
- 连接 IP 是直接的（非代理、非回环）私有地址、ULA、链路本地地址或 CGNAT 地址，或者在设置了 `sshVerify.cidrs` 时与其匹配。
- 与受信任 CIDR 批准采用相同的最低资格要求：仅限全新的无权限范围节点配对；升级、浏览器、Control UI 和 WebChat 始终显示提示。

探测运行期间，节点客户端会收到继续重试（`wait_then_retry`）的指示，而不是暂停等待手动批准；如果探测失败，下一次尝试会回退到常规提示流程。失败的目标会进入短暂冷却期（密钥不匹配后 5 分钟）。

获批设备会记录 `approvedVia: "ssh-verified"`，并在同一步骤中批准其首次声明的能力范围——密钥匹配已经证明节点在操作员所拥有的机器上，以操作员账户运行，这与手动能力批准所确认的事实相同。后续范围升级仍会显示提示。

加固或禁用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // 完全禁用：
        sshVerify: false,
        // ……或限定/调整探测：
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以尝试**静默批准**节点能力请求：

- 请求被标记为 `silent`（当设备配对通过非交互方式获批时，Gateway 网关会将首次能力范围标记为静默），并且
- 应用可以使用同一用户验证与 Gateway 网关主机的 SSH 连接。

如果静默批准失败，则会回退到常规 Approve/Reject 提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍需手动操作。对于 Gateway 网关已经信任网络路径的私有节点网络，操作员可以使用明确的 CIDR 或精确 IP 选择启用：

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
- 不存在覆盖整个局域网或私有网络的自动批准模式；上文的 SSH 验证自动批准要求加密设备密钥匹配，绝不会仅依据网络位置。
- 仅全新的、未请求任何权限范围的 `role: node` 设备配对请求符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端仍需手动操作。
- 角色、权限范围、元数据和公钥升级仍需手动操作。
- 同主机回环受信任代理标头路径不符合条件，因为本地调用方可以伪造该路径。

## 静默配对替代清理

非交互式批准会在已配对设备行上记录其来源：同主机本地策略批准记为 `silent`，受信任 CIDR 节点批准记为
`trusted-cidr`，SSH 验证节点批准记为 `ssh-verified`。状态目录为临时目录（临时主目录、容器、每次运行的沙箱）的客户端会在每次运行时生成新的设备密钥对，并且每次运行都会以全新设备的身份静默重新配对——如果不清理，已配对列表每次运行都会增加一条过期记录。

当 Gateway 网关静默批准**本地**设备配对时，它会停用属于同一客户端集群（`clientId`、`clientMode` 和显示名称匹配）且当前未连接的较早 `silent` 批准记录。本地客户端在 Gateway 网关主机自身上运行，因此该集群键不可能匹配其他机器。停用的记录会立即失去其令牌；任何匹配的旧版节点配对条目都会被清除，并广播一个表示移除的 `node.pair.resolved` 事件。

边界：

- 只有最近一次批准为同主机本地批准（`silent`）的记录才符合条件，无论作为触发记录还是目标记录。受信任 CIDR 和 SSH 验证配对跨越不同主机，而显示元数据不能作为机器身份，因此绝不会自动移除它们——请使用 Control UI 清理功能或
  `openclaw nodes remove`。
- 所有者批准和二维码/设置代码（引导）配对绝不会被自动移除。在来源记录功能出现之前批准的记录仍受保护，即使之后对同一设备 ID 进行了静默重新批准也是如此。
- 当前已连接的设备会被跳过，因此使用不同状态目录的并发本地会话在活动期间会保留其令牌。最近一分钟内批准的记录也会被跳过，因此同时进行的配对握手不会在连接注册之前相互停用。
- 受影响的客户端按设计均为本地客户端，因此会在下次连接时静默重新配对。

## 元数据升级自动批准

当已配对设备重新连接且仅包含非敏感元数据变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准的适用范围很窄：它仅适用于受信任的非浏览器本地重新连接，这些连接已证明持有本地或共享凭据，包括在操作系统版本元数据发生变化后，同主机原生应用的重新连接。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。权限范围升级（从读取升级到写入/管理员）和公钥变更**不**符合元数据升级自动批准条件；它们仍属于显式重新批准请求。

## 二维码配对辅助工具

`/pair qr` 会将配对载荷呈现为结构化媒体，以便移动客户端和浏览器客户端直接扫描。

删除设备时，也会一并清理该设备 ID 对应的所有过期待处理配对请求，因此撤销后，`nodes pending` 不会显示孤立的记录。

## 本地性与转发标头

仅当原始套接字和任何上游代理证据均一致表明连接来自回环地址时，Gateway 网关配对才会将其视为回环连接。如果请求通过回环地址到达，但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头证据，则该转发标头证据会使回环本地性声明失效，配对路径将要求显式批准，而不会静默地将请求视为同一主机上的连接。有关操作员身份验证的等效规则，请参阅[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在共享 SQLite 状态数据库的已配对设备记录中，该数据库位于 Gateway 网关状态目录下（默认为 `~/.openclaw`）：

- `~/.openclaw/state/openclaw.sqlite`（包含设备身份验证信息、已批准的节点能力范围、待处理的能力范围请求、待处理的设备配对请求和引导令牌的已配对设备）

如果覆盖 `OPENCLAW_STATE_DIR`，数据库也会随之移动。从使用 JSON 存储的版本升级而来的 Gateway 网关会在启动时导入这些数据，并保留 `devices/*.json.migrated` 和 `nodes/*.json.migrated` 归档。

安全注意事项：

- 设备令牌属于密钥；请将状态数据库视为敏感数据。
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
