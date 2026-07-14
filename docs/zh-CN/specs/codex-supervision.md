---
read_when:
    - 设计 Codex 会话发现、续接或归档行为
    - 更改原生会话目录 UI 或 Gateway 网关 RPC
    - 跨配对节点扩展 Codex 监管
summary: 从 OpenClaw 监督原生 Codex 会话的架构和产品边界。
title: Codex 监管
x-i18n:
    generated_at: "2026-07-14T13:57:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c44133f34bfd442bd48ce9a459dfdf24ec70ddd510984c732931ec043b6b0664
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Codex 监督

## 目标

Codex 监督让 OpenClaw 操作员能够发现原生 Codex 会话，并在安全的情况下通过常规 OpenClaw Chat 界面创建本地分支。
Codex App Server 仍是线程和模型循环的所有者。OpenClaw 提供集群目录、经过身份验证的操作员 UI、会话绑定和渠道投递。

此功能属于官方 `codex` 插件。不存在单独的
Supervisor 插件或第二套 Codex 协议实现。

## 产品边界

只要 Codex 插件处于活动状态，目录就会注册，除非使用以下配置明确禁用原生会话发现：

```text
plugins.entries.codex.config.sessionCatalog.enabled = false
```

使用以下配置启用面向智能体的监督工具：

```text
plugins.entries.codex.config.supervision.enabled = true
```

当前初始产品的范围有意小于长期集群计划：

- 仅列出未归档的 Codex 线程。
- 按稳定的主机身份对本地行和已选择加入的配对节点行进行分组。
- 从已存储或空闲的 Gateway 网关本地线程创建常规的模型锁定 Chat 分支，在首次轮次启动其完整 Codex harness 线程，或打开为先前分支创建的 Chat。
- 仅在明确确认没有其他运行器后，归档已存储或空闲的 Gateway 网关本地线程。
- 显示活动的本地来源，不提供新建分支或归档控件，但仍允许打开现有的受监督 Chat。
- 在主侧边栏中显示每台主机的最新行，在会话页面保留完整目录，并为本地行和配对节点行提供有界的、基于游标分页的转录读取。
- 按主机隔离目录故障。

目录是未归档条目的集合。其中的行仍可具有空闲、活动、`notLoaded` 或错误轮次状态。

面向智能体的监督仍为选择加入。引导式新手引导会在检测到原生 Codex 安装成功且所选推理后端通过实时检查后，尝试安装并启用该功能，而不受用户选择的主要后端影响。仅当这个机会式插件设置成功时，监督才会激活。明确禁用的插件、策略阻止或
`supervision.enabled: false` 对监督工具仍具有最终决定权，但不会禁用操作员会话目录。`sessionCatalog.enabled: false`
会禁用操作员发现和配对节点目录命令；Codex 提供商和 harness 仍保持活动状态。

## 所有权

`codex` 插件拥有所有 Codex App Server 行为：

- 端点发现和连接生命周期
- 协议初始化和版本检查
- 线程列表、读取、恢复、归档和事件处理
- 审批和用户输入桥接
- 原生线程与 OpenClaw 会话的绑定
- 继续后执行仅限 Codex 的模型和 harness 约束

Control UI 和 Gateway 网关使用该插件拥有的服务。它们不会直接读取 Codex rollout 文件，也不会实现另一个 App Server 客户端。

默认本地拓扑如下：

```text
Codex Desktop -> 私有 stdio App Server -> 用户 Codex 主目录
                                             ^
OpenClaw Codex 插件 -> 监督 App Server 连接
  （默认为托管的用户主目录 stdio；明确的 appServer 设置会得到遵循）
  -> 被动来源目录和读取
  -> 快照固定 -> 规范的 appServer 来源分支
  -> 可见历史注入及此后每个受监督 Chat 轮次

普通 OpenClaw Codex 会话 -> 默认使用托管的智能体主目录 stdio
  -> 普通完整 harness 线程 -> OpenClaw Chat 和渠道投递
```

启用监督不会改变普通 Codex harness：默认情况下，它仍限定于智能体范围。独立的监督连接默认为托管的用户主目录 stdio，因此其目录和快照操作可以看到原生存储的线程。明确的 `appServer` 连接设置会得到遵循。当
`homeScope` 未设置时，监督连接会将其解析为 stdio 或 Unix 的 `"user"`，或 WebSocket 的 `"agent"`。仅当普通 harness 也应共享原生 Codex 主目录时，才明确设置 `appServer.homeScope: "user"`。
从 Codex 侧边栏组采用的 Chat 是例外：其私有监督绑定会让来源读取、规范分支创建和后续轮次继续使用监督连接。实时状态和所有权仍限定于进程本地；OpenClaw 监督进程未知的线程是 `notLoaded`，即使 Codex Desktop 正在主动运行该线程也是如此。

Codex 有一个实验性的规范本地守护进程，它具有独立的、由安装程序管理的引导契约。此功能不得隐式引导、声明或假定该守护进程。

## 目录流程

通用 Gateway 网关方法 `sessions.catalog.list` 会分派给 `codex`
目录提供商，该提供商始终请求 `archived: false` 以及交互式
`cli` 和 `vscode` 来源种类。它会合并：

1. 来自监督 App Server 的 Gateway 网关本地 `thread/list` 结果，该服务器默认使用托管的用户主目录 stdio。
2. 来自每个已连接且已选择加入的节点的 `codex.appServer.threads.list.v1` 结果。

转录选择在本地使用带有 `itemsView: "full"` 的 `thread/turns/list`，或在所选节点上使用带版本的 `codex.appServer.thread.turns.list.v1` 命令。每个响应最多包含 20 个持久化轮次，以及不透明的前向/后向游标。Control UI 按从新到旧的顺序请求页面，按时间顺序渲染每个页面，并将较旧页面前置。它绝不会回退到无界的 `thread/read`。OpenClaw 还会拒绝任何超过 20 MiB 的序列化条目页面，避免其跨越节点或 Gateway 网关传输。

原生 macOS 配对节点实现仅支持未设置/默认或明确的 `appServer.transport: "stdio"`，以及未设置/默认的监督范围或明确的 `appServer.homeScope: "user"`。它会将配置的 `command`、`args`
和规范化后的 `clearEnv` 传入子进程。使用 `"unix"`、`"websocket"`
或明确的 `homeScope: "agent"` 时，它既不公布目录能力，也不公布命令；直接调用同样会以关闭状态失败。对于限定于智能体范围的配置，它绝不能暴露用户 Codex 主目录，也不能用本地 stdio 替代明确指定的端点。

目录投影会规范化标识符、标题、cwd、状态、活动等待标志、时间戳、来源、模型提供商、Codex 版本和 Git 分支。它不会返回转录预览、轮次、rollout 路径、Codex 主目录路径、Git 远程仓库、提交 SHA、原始端点或原始 App Server 错误。转录响应仅包含明确请求的 App Server 条目页面及其不透明游标。

主机故障仅影响各自主机结果。离线节点或不可用的本地 App Server 不会从页面中清除健康主机。连接性是主机属性，而不是线程状态：失败的主机结果不包含新的会话行，也不会将 `offline` 投影到原生线程上。

目录发现是被动的。列出或读取元数据不得调用
`thread/resume`、让 OpenClaw 客户端订阅实时线程请求或回答审批。

搜索仅匹配标题且不区分大小写。对于返回的每个目录页面，Gateway 网关和配对的 Mac 会扫描数量有界的原生页面，而不会将查询传递给 App Server，因为原生搜索也可能匹配转录预览。返回的原生游标允许调用方继续扫描。

## 操作员 CLI 边界

插件注册三个由 Gateway 网关支持的 shell 命令：

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` 是 `--url <url>`、`--token <token>`、`--timeout <ms>`，以及继承的 `--expect-final` 开关。会话列出的默认超时时间为 75,000 ms；继续和归档的默认超时时间为 30,000 ms；
`--expect-final` 对这些一元 RPC 没有额外作用。会话搜索仅匹配标题且不区分大小写；每个响应会扫描有界的原生页面链，`--cursor` 用于继续获取更早的结果。每台主机的限制默认为 50，接受 1 到 100；游标要求使用一个稳定的 `--host` 目标。所有命令均不接受已归档/包括已归档选项。只有 `sessions` 可以指定配对主机；
`continue` 和 `archive` 始终发送 `hostId: "gateway:local"`，归档则要求使用明确的确认标志。

shell 命名空间并非 Chat 内的 `/codex` 运行时命名空间。具体而言，`/codex sessions --host <node>` 会列出一个节点上的 Codex CLI 会话文件，`/codex threads` 会列出当前对话连接的 App Server 线程，而 `/codex resume` 或 `/codex bind` 会修改该对话的绑定。这些命令不能取代 `sessions.catalog.continue`，并且不存在 `/codex continue` 或 `/codex archive` 运行时命令。

## 本地继续

对于已存储或空闲的 Gateway 网关本地行，UI 使用主机 ID 和线程 ID，以及 `catalogId: "codex"` 调用
`sessions.catalog.continue`。插件会：

1. 当来源已有受监督 Chat 时，复用现有 Chat。
2. 否则，将截至来源最后一个终态持久化轮次（已完成、已中断或失败）的有界用户和助手历史投影到新的 OpenClaw Chat 中，并记录待处理的 harness 分支。
3. 存储待处理的仅限 Codex 的模型锁定策略，而不是具体的模型或提供商选择，同时存储私有监督连接范围，并返回 OpenClaw `sessionKey`。

历史投影会选择可见用户和助手消息的最新尾部，硬性限制为 200 条消息、总计 512 KiB 的 UTF-8 文本，以及每条消息 64 KiB。它会将图像和本地图像输入替换为
`[Image attachment]`，绝不复制图像负载或路径，并省略推理、工具调用和工具结果。

UI 使用该会话键导航到普通 Chat。此时尚不存在规范的 harness 线程。在第一个普通 Chat 轮次中，harness 会安装真正的 Codex 审批、信息请求、事件和投递处理程序，然后：

1. 使用监督连接调用原生 `thread/fork`，且不覆盖模型或提供商，并固定持久化的来源快照。Codex 当前的 `ConfigManager` 状态会选择模型和提供商，分叉响应则报告实际的组合。如果模型与来源中最后记录的模型不同，Codex 会发出常规模型差异警告。
2. 在同一连接上，使用 `threadSource: "appServer"`、OpenClaw 的 cwd、策略、配置、环境、完整的 OpenClaw harness 工具界面，以及分叉为此次初始启动返回的确切模型和提供商，启动规范的完整 Codex harness 线程。
3. 通过该连接注入有界的可见用户和助手历史，在不丢弃监督范围的情况下提交规范绑定，运行该轮次，并归档临时分叉。

在首次轮次之前，该 Chat 是一个锁定的待处理分支，带有可见的历史记录镜像；此后，每个模型轮次都会通过监督连接上的规范 Codex harness 线程运行。该分支并非完整的原生 rollout 克隆：源推理、工具调用和工具结果会被有意省略。如果快照固定或规范线程创建失败，待处理分支仍可重试。如果发生绑定竞态、监督被禁用，或者监督连接不可用或不匹配，则会在轮次运行前以失败关闭，而不会回退到普通的 Agent 主目录 harness。

这保证使用 Codex 所选择的模型，而不是保留源的历史模型。分叉返回的模型与提供商组合用于启动规范线程，Codex 会持久化该线程的原生模型和提供商。后续恢复时会省略 OpenClaw 模型和提供商覆盖项，因此 Codex 会恢复持久化的组合。如果其他原生 Codex 控制项更改了规范线程，OpenClaw 会接受该原生持久化选择。外层 OpenClaw 模型和回退链绝不会替代它。

对于受监督且模型已锁定的 Chat，模型更改、会话删除以及会话重置/新建操作都会以失败关闭。修改 `/codex model <model>`、`/codex
bind`、`/codex resume`（包括节点 `--bind here`）以及 `/codex detach` 或
`/codex unbind` 也会以失败关闭，因为这些操作会替换或清除绑定。
`/codex model` 查询以及 `/codex fast`、`/codex permissions` 和 `/codex
threads` 仍然可用。`codex_threads` Agent 工具无法附加新的分叉，也无法归档已绑定的原生线程。列表和仅元数据读取仍然可用；记录文本字段需要 `supervision.allowRawTranscripts`，而重命名、取消归档、分离式分叉以及归档不相关线程需要 `supervision.allowWriteControls`。这两个选项都无法替换锁定的绑定。
删除或重置 OpenClaw 条目原本会丢弃原生绑定，并在看似 Codex 的会话背后创建或允许创建通用线程。因此，即使模型锁定条目超出通常的存续时间、数量或磁盘预算限制，保留维护也会保留这些条目。禁用或卸载所属插件时，也会保留锁定状态和插件所有权标记。在同一插件重新启用之前，该 Chat 始终不可用并以失败关闭；清理绝不会将其转换为普通模型会话。

此操作绝不会恢复或修改源。临时分叉固定的是快照，而不是持久的后续线程。在首次轮次中启动一个独立的规范 harness 线程，可以防止 OpenClaw 仅因进程本地状态未发现由 Desktop 发起的轮次，就成为与源竞争的写入方。可见历史记录镜像和固定快照可能会遗漏活动源中尚未完成的工作。原始 CLI 或 VS Code 源仍可同时出现在原生目录和 OpenClaw 目录中。规范分支仍是监督存储中的原生 Codex 线程，但原生客户端可能会过滤其 `appServer` 源类型，因此 Codex Desktop 中的可见性不属于契约。

## 归档行为

对于已存储或空闲的 Gateway 网关本地行，带有
`catalogId: "codex"` 的 `sessions.catalog.archive` 需要显式提供 `confirmNoOtherRunner: true`，重新读取当前进程本地状态，仅在状态为 `idle` 或 `notLoaded` 时继续，调用原生 `thread/archive`，并且仅在 Codex 接受操作后返回成功。随后，该行会从未归档目录中移除。

重新读取后若状态为活动或错误，则拒绝归档。源中正在初始化或待处理的受监督分支也会被拒绝：必须先通过首个 Chat 轮次具体化其规范分支，才能归档源。目标完全一致且存在已知活动 OpenClaw 绑定所有者，或存在任何未归档的派生后代时，也会拒绝归档。OpenClaw 会对 Codex 的实验性 `thread/list ancestorThreadId` 关系进行分页，并在请求或响应错误、游标或线程循环以及安全限制耗尽时以失败关闭。原生归档可能会关闭已加载的父级和后代工作，因此归档并非中断操作的快捷方式。读取、后代枚举和归档调用并非原子操作。即使某行在本地显示为空闲或 `notLoaded`，独立客户端仍可能已经拥有该行或在该行上启动工作。在 Codex 支持条件式归档或跨进程租约之前，“无其他运行方”确认涵盖未知客户端和该竞态。禁止归档已配对节点。

Codex 目录中没有归档视图。在另一个经所有者授权的 Codex 界面中通过 `thread/unarchive` 恢复的线程，会再次有资格进入未归档目录。

## 活动线程安全性

Codex 会在一个 App Server 的多个客户端之间串行处理同一线程的修改，但不会提供独占的跨进程运行方租约或审批所有者租约。独立的 stdio App Server 可以追加到同一个 rollout，而每个服务器只能看到自身的内存状态。审批请求也可以发送给同一服务器的每个订阅方，由第一个有效响应完成请求。

因此：

- 被动目录客户端不会订阅审批，也不会自动拒绝审批
- 当前报告为活动状态的行既不提供新分支，也不提供归档
- 未映射的源会变为可见历史记录分支，其规范 harness 线程绝不会恢复该源
- `notLoaded` 会显示为活动状态未知，并且只能在知情确认无其他运行方后归档
- 本地归档需要该确认，以及重新读取到 `idle` 或 `notLoaded`，同时承认读取与归档之间存在协议竞态

中断和多客户端移交是未来的产品决策。显示活动行并不意味着支持这些功能。

## 已配对节点边界

节点调用目前仅支持请求/响应。它可以安全地返回有界的目录元数据和记录文本轮次页面，但无法承载 Codex harness 运行所需的长连接事件流、审批请求、工具调用、取消操作和助手增量。

因此，节点契约支持列表和记录文本轮次页面。远程行仍然可读，但无论是否处于空闲状态，**继续**和**归档**都不可用。真正的远程继续操作需要节点侧运行方和流式桥接，并且必须维持与本地 harness 相同的审批和绑定不变量。

## 权限

每台计算机都需要在本地选择启用。启用 Gateway 网关并不授权其他节点读取其 Codex 元数据。节点能力必须通过常规配对和命令策略审批。

设备群列表和记录文本查看使用 `operator.write` Gateway 网关权限范围，因为它们会调用已配对节点。本地继续和归档是经过身份验证的操作员操作，仍受主机和状态检查约束。

自主智能体和独立 MCP 访问是另外的机制。已发布的 `codex_endpoint_probe`、`codex_sessions_list`、`codex_session_read`、
`codex_session_send` 和 `codex_session_interrupt` 工具契约仍归 `codex` 插件所有。启用监督后，原始 `codex_threads` 记录文本读取和从记录文本派生的列表字段也需要 `supervision.allowRawTranscripts`；每次 `codex_threads` 分叉、重命名、归档或取消归档都需要 `supervision.allowWriteControls`。这两项策略默认均为禁用。

## 兼容性

`openclaw doctor --fix` 会迁移已发布的 `plugins.entries.codex-supervisor` 配置，包括端点和记录文本/写入策略，以及插件允许/拒绝引用，并将其迁移到
`plugins.entries.codex.config.supervision`。发生冲突时，显式的规范目标值优先。迁移后，运行时代码仅使用规范的 `codex` 插件形态。

官方插件恰好保留五个 Supervisor 兼容工具：
`codex_endpoint_probe`、`codex_sessions_list`、`codex_session_read`、
`codex_session_send` 和 `codex_session_interrupt`。默认情况下，会话列表仅包含已加载会话；不存在 `loaded_only` 参数。`include_stored: true` 会添加状态数据库中未归档的行，每个端点受 `max_stored_sessions` 限制（默认值为 200，接受范围为 1 到 1,000）；已加载的行不受此设置限制。从记录文本派生的字段和读取仍受 `allowRawTranscripts` 控制；发送和中断仍受 `allowWriteControls` 控制。

兼容性发送绝不会启动或恢复空闲线程。`mode: "start"` 始终会被拒绝；`"auto"` 和 `"steer"` 仅能引导可读取的活动轮次。中断同样要求存在可读取的活动轮次。空闲继续操作会路由到原生 Codex 目录，使完整 harness 负责审批、工具和绑定。独立的旧版 MCP 适配器从官方插件解析这些相同工具，并且是唯一遵循所保留旧版策略环境变量的路径。

7 月的目录 UI、Gateway 网关方法、节点能力和 CLI 注册并未以旧插件 ID 发布。它们直接转归 `codex` 所有，不再增加第二个运行时 facade。

## 未来工作

- 用于远程继续操作的节点侧流式运行方和事件桥接
- 用于同时进行客户端移交的显式运行方和审批所有者租约
- 在具备运行方所有权租约或等效隔离机制后支持远程归档
- 中断和更丰富的活动会话观察
- Codex Desktop、CLI 和 OpenClaw 之间经过审计的移交

归档浏览不属于计划中的监督侧边栏。原生 Codex 界面仍是归档线程的恢复路径。

## 验收测试

- 启用监管后，会列出未归档的本地会话。
- 已归档的会话绝不会出现在目录响应或 UI 中。
- 当其他主机发生故障时，健康主机仍保持可见；不可用的主机
  不会虚构离线会话状态，而是不返回任何新行。
- 已存储或空闲的本地行会创建一个带有仅限 Codex
  模型/运行时锁定的 Chat 镜像；首轮会固定一个临时快照并启动
  规范的完整 harness 线程，之后再次选择 Continue 会打开现有 Chat。
- 首轮在快照分支上不指定模型/提供商覆盖，并将
  规范启动固定到 Codex 返回的精确组合，即使 Codex 发出警告，
  表示其当前模型与源最后记录的模型不同。
- 待处理和已提交的受监管绑定使用监管连接进行
  源访问、规范分支创建以及之后的每一轮；普通
  Codex 会话仍限定在智能体范围内。
- 之后的恢复不会指定 OpenClaw 模型/提供商覆盖，会保留 Codex
  规范的持久化选择，接受对该线程进行的独立原生更改，
  且绝不会替换为外层 OpenClaw 模型或回退链。
- 禁用监管或丢失绑定/连接生命周期时会以失败关闭，
  而不会将 Chat 移至普通智能体主目录 harness。
- 受监管且模型锁定的 Chat 在保护原生绑定期间无法删除。
- Chat 最多镜像 200 条用户和助手消息，总计 512 KiB，
  每条消息最多 64 KiB。图像会变成占位符；源推理、工具调用、
  工具结果、图像载荷和本地路径不会被克隆。
- 分支流程绝不会恢复源线程。
- 原始源仍可同时出现在两个目录中。规范的原生
  分支使用 `appServer` 源类型，且不保证会出现在
  Codex Desktop 中。
- 活跃的本地源无法创建分支或归档；现有的
  受监管 Chat 仍可打开。
- 活动状态未知的行无需确认即可创建分支；归档则需要
  明确确认没有其他运行程序。
- 具有正在初始化或待处理的受监管分支的源无法归档，
  直到 Chat 首轮将规范分支实体化。
- 精确目标或任何未归档派生后代存在已知的活跃绑定所有者时，
  会阻止归档；后代枚举失败时会以失败关闭，而显式确认仍需负责处理
  未知客户端以及从状态检查到归档之间的竞态。
- 经确认的已存储或空闲本地归档会在原生操作成功后移除该行。
- 已配对节点的行仍保持可见，但不提供 Continue 或 Archive。
- 被动列出绝不会订阅或响应线程审批。
- 旧版 Supervisor 配置会迁移到规范的 Codex 配置结构。
- 旧版列表默认仅加载，存储内容的枚举遵循其各端点上限，
  且兼容性发送绝不会启动或恢复空闲线程。
