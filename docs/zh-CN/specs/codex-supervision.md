---
read_when:
    - 设计 Codex 会话发现、续接或归档行为
    - 更改原生会话目录 UI 或 Gateway 网关 RPC
    - 跨配对节点扩展 Codex 监管能力
summary: 从 OpenClaw 监督原生 Codex 会话的架构与产品边界。
title: Codex 监督
x-i18n:
    generated_at: "2026-07-12T14:45:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78528afd31c18fc84e0adb6479a688da7df6d0a5c04e539d253c84d3a17a5f53
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Codex 监督

## 目标

Codex 监督让 OpenClaw 操作员能够发现原生 Codex 会话，并在安全时通过常规 OpenClaw Chat 界面创建本地分支。Codex App Server 仍然是线程和模型循环的所有者。OpenClaw 提供集群目录、经过身份验证的操作员 UI、会话绑定和渠道投递。

此功能属于官方 `codex` 插件。不存在单独的 Supervisor 插件或第二套 Codex 协议实现。

## 产品边界

只要 Codex 插件处于活动状态，就会注册目录。使用以下配置启用面向智能体的监督工具：

```text
plugins.entries.codex.config.supervision.enabled = true
```

当前启用的初始产品范围有意小于长期集群计划：

- 仅列出未归档的 Codex 线程。
- 按稳定的主机身份对本地行和已选择加入的配对节点行进行分组。
- 从已存储或处于空闲状态的 Gateway 网关本地线程创建常规的模型锁定 Chat 分支，在首次轮次时启动其完整 Codex harness 线程，或者打开为先前分支创建的 Chat。
- 只有在明确确认没有其他运行程序后，才能归档已存储或处于空闲状态的 Gateway 网关本地线程。
- 显示活动的本地源，但不提供新建分支或归档控件，同时仍允许打开现有的受监督 Chat。
- 在主侧边栏中显示每台主机的最新行，在会话页面保留完整目录，并为本地行和配对节点行提供有界且基于游标分页的对话记录读取。
- 按主机隔离目录故障。

目录是未归档项的集合。其中的行仍可具有空闲、活动、`notLoaded` 或错误轮次状态。

面向智能体的监督仍需选择启用。在原生 Codex 安装检测成功且所选推理后端通过实时检查后，引导式新手引导会尝试安装并启用该功能，这与用户选择哪个主要后端无关。只有当这个机会式插件设置成功时，监督才会激活。显式禁用插件、策略阻止或 `supervision.enabled: false` 对监督工具仍具有最终决定权，但不会禁用操作员会话目录。

## 所有权

`codex` 插件拥有所有 Codex App Server 行为：

- 端点发现和连接生命周期
- 协议初始化和版本检查
- 线程列出、读取、恢复、归档和事件处理
- 审批和用户输入桥接
- 将原生线程绑定到 OpenClaw 会话
- 继续运行后强制执行仅限 Codex 的模型和 harness

Control UI 和 Gateway 网关使用该插件拥有的服务。它们不会直接读取 Codex rollout 文件，也不会实现另一个 App Server 客户端。

默认本地拓扑如下：

```text
Codex Desktop -> 私有 stdio App Server -> 用户 Codex 主目录
                                             ^
OpenClaw Codex 插件 -> 监督 App Server 连接
  （默认为托管的用户主目录 stdio；遵循显式 appServer 设置）
  -> 被动源目录和读取
  -> 快照固定 -> 规范的 appServer 源分支
  -> 可见历史记录注入以及后续每个受监督 Chat 轮次

常规 OpenClaw Codex 会话 -> 默认使用托管的智能体主目录 stdio
  -> 常规完整 harness 线程 -> OpenClaw Chat 和渠道投递
```

启用监督不会更改常规 Codex harness：默认情况下，它仍按智能体划分作用域。单独的监督连接默认为托管的用户主目录 stdio，因此其目录和快照操作可以看到原生已存储线程。遵循显式 `appServer` 连接设置。当 `homeScope` 未设置时，对于 stdio 或 Unix，监督连接会将其解析为 `"user"`；对于 WebSocket，则解析为 `"agent"`。仅当常规 harness 也应共享原生 Codex 主目录时，才显式设置 `appServer.homeScope: "user"`。从 Codex 侧边栏组中采用的 Chat 属于例外情况：其私有监督绑定会让源读取、规范分支创建和后续轮次继续使用监督连接。实时状态和所有权仍限定于进程本地；即使 Codex Desktop 正在主动运行某个线程，只要 OpenClaw 的监督进程不知道该线程，它就是 `notLoaded`。

Codex 有一个实验性的规范本地守护进程，具有独立的安装程序托管引导契约。此功能不得隐式引导、接管或假定该守护进程存在。

## 目录流程

通用 Gateway 网关方法 `sessions.catalog.list` 会分派给 `codex` 目录提供程序；后者始终请求 `archived: false` 以及交互式 `cli` 和 `vscode` 源类型。它会合并：

1. 监督 App Server 返回的 Gateway 网关本地 `thread/list` 结果；该 App Server 默认使用托管的用户主目录 stdio。
2. 每个已连接且已选择加入的节点返回的 `codex.appServer.threads.list.v1` 结果。

对话记录选择在本地使用带 `itemsView: "full"` 的 `thread/turns/list`，或在所选节点上使用带版本号的 `codex.appServer.thread.turns.list.v1` 命令。每个响应最多包含 20 个已持久化轮次，以及不透明的向前/向后游标。Control UI 按从新到旧的顺序请求页面，按时间顺序渲染每个页面，并将较旧页面添加到前面。它绝不会回退到无界的 `thread/read`。OpenClaw 还会拒绝任何超过 20 MiB 的序列化项目页面，防止其通过节点或 Gateway 网关传输。

原生 macOS 配对节点实现仅支持未设置/默认值或显式 `appServer.transport: "stdio"`，并且监督作用域未设置/使用默认值或显式设置为 `appServer.homeScope: "user"`。它会将已配置的 `command`、`args` 和规范化后的 `clearEnv` 传递给子进程。使用 `"unix"`、`"websocket"` 或显式 `homeScope: "agent"` 时，它既不通告目录能力，也不通告命令；直接调用同样会以关闭方式失败。对于按智能体划分作用域的配置，它绝不能暴露用户 Codex 主目录，也不能用本地 stdio 替代显式端点。

目录投影会规范化标识符、标题、cwd、状态、活动等待标志、时间戳、源、模型提供商、Codex 版本和 Git 分支。它不会返回对话记录预览、轮次、rollout 路径、Codex 主目录路径、Git 远程仓库、提交 SHA、原始端点或原始 App Server 错误。对话记录响应仅包含明确请求的 App Server 项目页面及其不透明游标。

主机故障仅影响各自主机的结果。节点离线或本地 App Server 不可用时，不会从页面中移除健康主机。连接状态是主机属性，而不是线程状态：失败的主机结果不包含新的会话行，也不会将 `offline` 投影到原生线程上。

目录发现是被动的。列出或读取元数据不得调用 `thread/resume`、让 OpenClaw 客户端订阅实时线程请求，也不得回应审批。

搜索仅针对标题且不区分大小写。对于返回的每个目录页面，Gateway 网关和配对的 Mac 会扫描数量有界的原生页面，而不会将查询传递给 App Server，因为原生搜索也可能匹配对话记录预览。返回的原生游标允许调用方继续扫描。

## 操作员 CLI 边界

该插件注册了三个由 Gateway 网关支持的 shell 命令：

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` 包括 `--url <url>`、`--token <token>`、`--timeout <ms>`，以及继承的 `--expect-final` 开关。会话列表操作的默认超时时间为 75,000 ms；continue 和 archive 的默认超时时间为 30,000 ms；对于这些一元 RPC，`--expect-final` 不会产生额外效果。会话搜索仅针对标题且不区分大小写；每个响应会扫描一条有界的原生页面链，`--cursor` 用于继续获取更早的结果。每台主机的默认限制为 50，接受 1 到 100，并且使用游标时必须指定一个稳定的 `--host` 目标。所有命令都不接受 archived/include-archived 选项。只有 `sessions` 可以指定配对主机；`continue` 和 `archive` 始终发送 `hostId: "gateway:local"`，而 archive 需要显式确认标志。

shell 命名空间不同于 Chat 内的 `/codex` 运行时命名空间。具体而言，`/codex sessions --host <node>` 会列出一个节点上的 Codex CLI 会话文件，`/codex threads` 会列出当前对话连接的 App Server 线程，而 `/codex resume` 或 `/codex bind` 会修改该对话的绑定。这些命令不能替代 `sessions.catalog.continue`，并且不存在 `/codex continue` 或 `/codex archive` 运行时命令。

## 本地继续运行

对于已存储或处于空闲状态的 Gateway 网关本地行，UI 会调用 `sessions.catalog.continue`，并传入 `catalogId: "codex"` 以及主机和线程 ID。插件会：

1. 当源已有受监督 Chat 时，复用现有 Chat。
2. 否则，将截至源最后一个已持久化终止轮次（已完成、已中断或失败）的有界用户和助手历史记录投影到新的 OpenClaw Chat 中，并记录一个待处理的 harness 分支。
3. 存储待处理的仅限 Codex 的模型锁定策略，而不是具体的模型或提供商选择，同时存储私有监督连接作用域，并返回 OpenClaw `sessionKey`。

历史记录投影会选择可见用户和助手消息的最新末尾部分，硬性限制为 200 条消息、UTF-8 文本总计 512 KiB，以及每条消息 64 KiB。它会将图像和本地图像输入替换为 `[Image attachment]`，绝不复制图像载荷或路径，并忽略推理、工具调用和工具结果。

UI 使用该会话密钥导航到常规 Chat。此时尚不存在规范的 harness 线程。在首次常规 Chat 轮次中，harness 会安装真实的 Codex 审批、信息请求、事件和投递处理程序，然后：

1. 使用监督连接调用原生 `thread/fork`，不覆盖模型或提供商，并固定已持久化的源快照。Codex 当前的 `ConfigManager` 状态会选择模型和提供商，fork 响应会报告实际组合。如果模型与源中最后记录的模型不同，Codex 会发出其常规模型差异警告。
2. 在同一连接上，使用 `threadSource: "appServer"`、OpenClaw 的 cwd、策略、配置、环境、完整的 OpenClaw harness 工具表面，以及该 fork 为此次初始启动返回的确切模型和提供商，启动规范的完整 Codex harness 线程。
3. 通过该连接注入有界的可见用户和助手历史记录，提交规范绑定且不丢弃其监督作用域，运行该轮次，并归档临时 fork。

首次轮次之前，Chat 是一个具有可见历史记录镜像的锁定待处理分支；之后，每个模型轮次都通过监督连接上的规范 Codex harness 线程运行。该分支不是完整的原生 rollout 克隆：源推理、工具调用和工具结果会被有意忽略。如果快照固定或规范线程创建失败，待处理分支仍可重试。如果发生绑定竞态、监督被禁用，或监督连接不可用或不匹配，则会在轮次运行前以关闭方式失败，而不是回退到常规的智能体主目录 harness。

这保证由 Codex 负责选择，而不是保留源的历史模型。fork 返回的组合用于启动规范线程，Codex 会持久化该线程的原生模型和提供商。后续恢复时会省略 OpenClaw 的模型和提供商覆盖，因此 Codex 会恢复已持久化的组合。如果单独的原生 Codex 控制更改了规范线程，OpenClaw 会接受该原生持久化选择。外层 OpenClaw 模型和回退链绝不会替代它。

对于受监督且锁定模型的聊天，模型更改、会话删除以及会话重置/新建操作均采用失败关闭策略。修改 `/codex model <model>`、`/codex
bind`、`/codex resume`（包括节点的 `--bind here`），以及 `/codex detach` 或
`/codex unbind` 也会失败关闭，因为这些操作会替换或清除绑定。`/codex model`
查询以及 `/codex fast`、`/codex permissions` 和 `/codex
threads` 仍然可用。`codex_threads` 智能体工具无法附加新分支，也无法归档已绑定的原生线程。列表和仅元数据读取仍然可用；脚本字段需要 `supervision.allowRawTranscripts`，而重命名、取消归档、创建分离分支以及归档不相关线程需要 `supervision.allowWriteControls`。这两个选项都无法替换锁定的绑定。否则，删除或重置 OpenClaw 条目会丢弃原生绑定，并在一个看似 Codex 的会话背后创建或允许通用线程。因此，即使锁定模型的条目超出常规的存留时间、数量或磁盘预算限制，保留维护也会保留这些条目。禁用或卸载所属插件也会保留锁定状态和插件所有权标记。聊天将保持不可用并采用失败关闭策略，直至重新启用同一插件；清理操作绝不会将其转换为普通模型会话。

此操作绝不会恢复或修改源线程。临时分支会固定一个快照；它不是持久的续接线程。在第一次轮次中启动一个独立的规范 harness 线程，可防止 OpenClaw 仅仅因为进程本地状态未能发现 Desktop 所属的轮次，就成为竞争性的源写入方。可见历史镜像和固定快照可能会遗漏活动源线程中尚未完成的工作。原始 CLI 或 VS Code 源线程仍可同时出现在原生目录和 OpenClaw 目录中。规范分支在监督存储中仍是原生 Codex 线程，但原生客户端可能会过滤其 `appServer` 源类型，因此 Codex Desktop 中的可见性并非契约。

## 归档行为

对于已存储或空闲的 Gateway 网关本地行，使用
`catalogId: "codex"` 调用 `sessions.catalog.archive` 时，需要显式设置
`confirmNoOtherRunner: true`，重新读取当前进程本地状态，仅在状态为 `idle` 或 `notLoaded` 时继续，调用原生 `thread/archive`，并且只有在 Codex 接受该操作后才返回成功。随后，该行会从未归档目录中移除。

重新读取后得到活动或错误状态时，归档会被拒绝。源线程中正在初始化或待处理的受监督分支也会导致拒绝：必须由第一个聊天轮次实体化其规范分支，之后才能归档源线程。若存在精确目标的已知活动 OpenClaw 绑定所有者，或任何未归档的派生后代，也会拒绝归档。OpenClaw 会对 Codex 的实验性 `thread/list ancestorThreadId` 关系进行分页，并在请求或响应出错、游标或线程出现循环，以及安全限制耗尽时采用失败关闭策略。原生归档可能会关闭已加载的父级及后代工作，因此归档不是中断操作的捷径。读取、后代枚举和归档调用并非原子操作。独立客户端仍可能拥有看似本地空闲或 `notLoaded` 的行，或在其上启动工作。在 Codex 提供条件式归档或跨进程租约之前，无其他运行方确认涵盖未知客户端及这一竞态条件。禁止对配对节点执行归档。

Codex 目录中没有已归档视图。在另一个所有者已授权的 Codex 界面中使用 `thread/unarchive` 恢复的线程，将再次有资格出现在未归档目录中。

## 活动线程安全

Codex 会在同一个 App Server 的客户端之间串行处理线程修改，但不会公开独占的跨进程运行方租约或审批所有者租约。独立的 stdio App Server 可以追加到同一 rollout，而每个服务器只能看到自身的内存状态。审批请求也可以发送给同一服务器的每个订阅者，并由第一个有效响应完成请求。

因此：

- 被动目录客户端不会订阅或自动拒绝审批
- 当前报告为活动状态的行既不提供新分支，也不提供归档功能
- 未映射的源线程会成为可见历史分支，其规范 harness 线程绝不会恢复源线程
- `notLoaded` 会显示为活动状态未知，并且只有在知情确认无其他运行方后才能归档
- 本地归档需要该确认以及重新读取到的 `idle` 或 `notLoaded` 状态，同时承认读取和归档之间存在协议竞态条件

中断和多客户端移交属于未来的产品决策。仅显示活动行并不意味着支持这些功能。

## 配对节点边界

节点调用目前仅支持请求/响应。它可以安全地返回有界的目录元数据和脚本轮次分页，但无法承载 Codex harness 运行所需的长生命周期事件流、审批请求、工具调用、取消操作和助手增量。

因此，节点契约支持列表和脚本轮次分页。远程行仍可读取，但无论是否处于空闲状态，**继续**和**归档**均不可用。真正的远程续接需要节点端运行方和流式桥接，并且必须保持与本地 harness 相同的审批和绑定不变量。

## 权限

每台计算机都需在本地选择启用。启用 Gateway 网关并不授权其他节点读取其 Codex 元数据。节点能力必须通过常规配对和命令策略审批。

工作节点列表和对话记录查看使用 `operator.write` Gateway 网关权限范围，因为它们会调用已配对节点。本地续接和归档属于经过身份验证的操作员操作，并且仍受主机和状态检查约束。

自主智能体和独立 MCP 访问是相互独立的。随附的 `codex_endpoint_probe`、`codex_sessions_list`、`codex_session_read`、`codex_session_send` 和 `codex_session_interrupt` 工具契约仍归 `codex` 插件所有。启用监管后，原始 `codex_threads` 对话记录读取和从对话记录派生的列表字段也需要 `supervision.allowRawTranscripts`；每次通过 `codex_threads` 执行分叉、重命名、归档或取消归档都需要 `supervision.allowWriteControls`。这两项策略默认均为禁用状态。

## 兼容性

`openclaw doctor --fix` 会迁移已发布的 `plugins.entries.codex-supervisor` 配置，包括端点和对话记录/写入策略，以及插件允许/拒绝引用，并将其迁移到 `plugins.entries.codex.config.supervision`。发生冲突时，以明确指定的规范目标值为准。迁移后，运行时代码仅使用规范的 `codex` 插件结构。

官方插件仅保留以下五个 Supervisor 兼容性工具：`codex_endpoint_probe`、`codex_sessions_list`、`codex_session_read`、`codex_session_send` 和 `codex_session_interrupt`。默认情况下，会话列表仅包含已加载会话；不存在 `loaded_only` 参数。`include_stored: true` 会添加状态数据库中未归档的行，每个端点的数量受 `max_stored_sessions` 限制（默认值为 200，接受范围为 1 至 1,000）；已加载的行不受此设置限制。从对话记录派生的字段和读取仍受 `allowRawTranscripts` 控制；发送和中断仍受 `allowWriteControls` 控制。

兼容性发送绝不会启动或恢复空闲线程。`mode: "start"` 始终会被拒绝；`"auto"` 和 `"steer"` 仅会引导可读取的活动轮次。中断同样要求存在可读取的活动轮次。空闲续接会路由到原生 Codex 目录，从而由完整的 Codex harness 负责审批、工具和绑定。独立的旧版 MCP 适配器从官方插件解析这些相同工具，并且是唯一遵循所保留旧版策略环境变量的路径。

7 月版目录 UI、Gateway 网关方法、节点能力和 CLI 注册尚未以旧插件 ID 发布。它们会直接归 `codex` 所有，而不会添加第二个运行时外观层。

## 后续工作

- 用于远程续接的节点端流式运行器和事件桥接
- 用于客户端同时交接的显式运行器和审批所有者租约
- 在存在运行器所有权租约或等效隔离机制后支持远程归档
- 中断和更丰富的活动会话观察
- Codex Desktop、CLI 和 OpenClaw 之间经过审计的交接

归档浏览不属于计划中的监管侧边栏。原生 Codex 界面仍是归档线程的恢复路径。

## 验收测试

- 启用监管后会列出未归档的本地会话。
- 已归档会话绝不会出现在目录响应或 UI 中。
- 当另一台主机发生故障时，健康主机仍保持可见；不可用的主机不会虚构离线会话状态，而是不返回任何新行。
- 已存储或空闲的本地行会创建一个仅锁定 Codex 模型/运行时的 Chat 镜像；首个轮次会固定一个临时快照并启动规范的完整 Codex harness 线程，重复执行 Continue 会打开现有 Chat。
- 首个轮次在快照分叉时省略模型/提供商覆盖，并将规范启动固定到 Codex 返回的精确模型与提供商组合，即使 Codex 警告其当前模型与来源最后记录的模型不同。
- 待处理和已提交的受监管绑定使用监管连接进行来源访问、创建规范分支以及执行之后的每个轮次；普通 Codex 会话仍限定在智能体范围内。
- 后续恢复会省略 OpenClaw 模型/提供商覆盖，保留 Codex 持久化的规范选择，接受该线程在原生界面中单独进行的更改，并且绝不会替换为外层 OpenClaw 模型或回退链。
- 禁用监管或丢失绑定/连接生命周期时会以关闭方式失败，而不会将 Chat 移至普通的智能体主目录 Codex harness。
- 受监管且已锁定模型的 Chat 在保护原生绑定期间无法删除。
- Chat 最多镜像 200 条用户和助手消息，总计 512 KiB，每条消息最多 64 KiB。图像会转换为占位符；来源推理、工具调用、工具结果、图像载荷和本地路径不会被克隆。
- 分支流程绝不会恢复来源线程。
- 原始来源仍可出现在两个目录中。规范原生分支使用 `appServer` 来源类型，并且不保证会出现在 Codex Desktop 中。
- 活动的本地来源无法创建分支或被归档；现有的受监管 Chat 仍可打开。
- 活动状态未知的行无需确认即可创建分支；归档则需要明确确认没有其他运行器。
- 具有正在初始化或待处理的受监管分支的来源无法归档，必须等到首个 Chat 轮次将规范分支实体化之后才可归档。
- 精确目标的已知活动绑定所有者或任何未归档的派生后代都会阻止归档；后代枚举失败时会以关闭方式失败，而明确确认仍需负责处理未知客户端以及状态检查与归档之间的竞态条件。
- 经确认的已存储或空闲本地归档会在原生归档成功后移除该行。
- 已配对节点的行仍保持可见，但不提供 Continue 或 Archive。
- 被动列表操作绝不会订阅或响应线程审批。
- 旧版 Supervisor 配置会迁移到规范的 Codex 配置结构。
- 旧版列表默认仅包含已加载会话，已存储枚举遵循其每端点上限，并且兼容性发送绝不会启动或恢复空闲线程。
