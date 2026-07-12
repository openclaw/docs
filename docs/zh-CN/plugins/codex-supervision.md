---
read_when:
    - 你希望 Codex Desktop 或 CLI 会话显示在 OpenClaw 中
    - 你需要从已存储或空闲的本地 Codex 会话创建分支，或将其归档
    - 你正在公开来自已配对节点的 Codex 会话和转录历史记录
sidebarTitle: Codex supervision
summary: 浏览 OpenClaw 节点中未归档的 Native Codex 会话和分页转录记录
title: 监督 Codex 会话
x-i18n:
    generated_at: "2026-07-12T14:37:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Codex 监管是官方 `codex` 插件的一项可选能力。它会在常规会话侧边栏和 Chat 窗格中，显示来自 Gateway 网关计算机以及已选择启用此功能的配对计算机上的未归档 Codex Desktop 和 CLI 源会话。

初始版本刻意将所有权范围保持在较小范围内：

- 已存储或空闲的本地会话可以根据其有限范围内持久化的用户和助手历史记录，创建一个模型锁定的 OpenClaw Chat。第一条消息会启动原生快照分支，然后使用 Codex App Server 为该分支选择的确切模型和提供商启动完整的 Codex harness 线程。后续轮次会恢复规范原生线程中持久化的模型与提供商组合，同时受监管绑定会阻止 OpenClaw 替换为其他运行时、模型或回退方案。单独的原生 Codex 控件仍可更改这一持久化组合。已创建的分支会打开其现有 Chat。
- 从另一个 Codex 进程发现的已存储会话，其实时活动状态未知。它可以创建分支；或者，只有在操作员确认没有其他 Codex 客户端正在使用它后，才能将其归档。
- 活动源会保持可见，但在当前轮次结束前无法创建分支或归档。如果它已有受监管的 Chat，**打开 Chat** 仍然可用。
- 配对节点上的会话会通过有界、基于游标分页的 App Server 读取公开其持久化转录记录。远程续接需要未来的流式节点桥接；远程归档还需要运行器所有权租约或等效的隔离机制。
- 不会列出已归档的会话。只有在操作员确认没有其他 Codex 客户端正在使用已存储或空闲的本地会话后，才能将其归档。

## 开始之前

- 在 Gateway 网关上安装官方 `@openclaw/codex` 插件。启用 Codex 功能时，OpenClaw macOS 应用可以安装该插件；CLI 安装可以运行 `openclaw plugins install @openclaw/codex`。
- 在你希望列出其会话的每台计算机上安装并登录 Codex Desktop 或 Codex CLI。
- 将远程计算机配对为 OpenClaw 节点。每台计算机都必须在本地选择启用此功能；仅在 Gateway 网关上启用监管并不会授权其他节点。
- 使用由所有者控制的 Gateway 网关。会话标题、工作目录和 Git 分支可能会泄露敏感的项目信息。

## 启用监管

引导式 `openclaw onboard` 和 macOS 首次运行设置会在检测到原生 Codex 安装并成功激活所选推理后端后，尝试安装并启用 Codex 监管。Codex 无需作为主要后端。此机会式插件激活成功后，监管功能即可使用。监管首次连接时会检查 App Server 的可用性。明确禁用 Codex 插件或策略阻止会阻止机会式激活，而已有的显式 `supervision.enabled: false` 会禁用面向智能体的监管工具；只要 Codex 插件处于活动状态，操作员目录便始终保持注册。现有安装可以手动启用相同能力：

在 `openclaw.json` 中启用 `codex` 插件及其监督功能：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

如果存在 `plugins.allow`，请将 `codex` 加入其中。更改插件激活状态后，重启 Gateway 网关。

如果没有显式的 `appServer` 连接设置，监督功能会通过一个单独的托管 stdio 监督连接，连接到原生用户 Codex 主目录。普通 Codex harness 默认仍按智能体划分作用域。这样既能让两个应用都看到原生会话，又不会让普通 OpenClaw 轮次共享原生 Codex 状态。如果 harness 也应共享该状态，请显式设置 `appServer.homeScope: "user"`。监督功能会遵循显式的 `appServer` 连接设置，而不会用其本地用户主目录默认值替换这些设置。

从 **Codex** 侧边栏分组接管的聊天并非普通的 harness 会话。其私有监督绑定会使用监督连接执行源代码读取、规范分支创建、历史记录注入以及之后的每个轮次。使用默认本地连接时，这会保留原生用户 Codex 主目录、身份验证和提供商配置，同时不更改其他会话的默认设置。

对于默认本地监督连接，存储与原生 Codex 客户端共享。OpenClaw 不会假定另一个客户端共享同一个实时 App Server 进程，并且原生状态的所有权仅限于进程本地。因此，当监督 App Server 将某个线程报告为 `notLoaded` 时，OpenClaw 会将其视为**已存储 / 活动状态未知**，而不是空闲。

请在需要显示其会话的每个无头节点主机上应用相同的选择启用设置。原生 OpenClaw macOS 应用在向已配对的 Gateway 网关通告其 Codex 目录时，会读取相同的本地设置。该已配对原生 Mac 目录仅支持默认设置，或显式设置 `appServer.transport: "stdio"`，并且 `appServer.homeScope: "user"` 未设置或已显式设置。该 stdio 进程会遵循 `command`、`args` 和 `clearEnv`。如果 Mac 配置选择 `"unix"`、`"websocket"` 或 `homeScope: "agent"`，应用将不会通告目录功能或命令，并且过期的直接调用会失败，而不会暴露用户 Codex 主目录或启动另一个本地 stdio App Server。

新通告的节点命令会更改该节点获准使用的命令范围。请从 Gateway 网关主机批准此更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

未归档的 Codex 会话也会显示在 Control UI 主侧边栏中，并按主机分组。选择一个会话即可读取其持久化的转录记录。查看器使用最新的 Codex `thread/turns/list` API，并设置 `itemsView: "full"`，每次请求最多加载 20 个轮次；**加载更早的转录条目**会沿用最新页面中不透明的 App Server 游标。已加载的页面按时间顺序呈现。查看器绝不会加载无界的 `thread/read` 历史记录。超过 20 MiB 传输安全上限的页面会以故障关闭方式失败，而不会冒险影响节点或 Gateway 网关连接。

在常规会话侧边栏中打开 **Codex** 组。其中列出了相同的会话，并按主机分组。**加载更多会话**会从每台存在更早记录的主机追加下一页，这些追加的记录会在侧边栏定期刷新后保留。由于原生搜索也可以匹配转录预览，因此每个返回的搜索页面只会扫描每台主机上数量有界的原生页面，而不会将查询发送到 App Server。

主机可用性与线程状态彼此独立。**离线**或**不可用**描述的是主机刷新状态；不可用的主机不会返回新的会话记录，也不会将线程的原生状态更改为 `offline`。会话记录使用 Codex 状态，例如 `idle`、`active`、`notLoaded` 或错误。某台主机发生故障不会隐藏健康主机返回的结果。

## 使用操作员 CLI

终端 CLI 提供相同的未归档目录，以及 Gateway 网关本地的分支和归档操作：

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

`openclaw codex sessions` 选项：

- `--search <text>` 对会话标题执行不区分大小写的搜索。
- `--host <id>` 将响应限制为一个稳定的目录主机，例如
  `gateway:local` 或 `node:<node-id>`。
- `--limit <count>` 设置每个主机返回 1 到 100 行；默认值为 50。
- `--cursor <cursor>` 继续获取某个主机的下一页，因此需要 `--host`。
- `--json` 输出结构化的 Gateway 网关响应。

这三个命令都从 Gateway 网关客户端继承 `--url`、`--token` 和 `--timeout <ms>`。
会话列表操作默认超时为 75,000 ms，以便冷启动的已配对节点目录能够完成；
继续和归档操作默认超时为 30,000 ms。它们还提供共享的 `--expect-final`
开关，但该开关不会改变这些一元监督 RPC。每个命令都需要 Gateway 网关的
`operator.write` 权限范围。每个子命令都提供标准的 `-h, --help` 输出。
没有 archived 或 include-archived 选项。`sessions` 可以列出已配对的主机，
但 `continue` 和 `archive` 始终以 `gateway:local` 为目标；已配对主机的行
仅可列出。归档操作始终需要 `--confirm-no-other-runner`。

这些 shell 命令不同于聊天内的 `/codex` 运行时命令。
`/codex threads [filter]` 会列出当前对话连接可用的 App Server 线程。`/codex sessions --host <node>` 会列出某个节点上可恢复的 Codex CLI 会话文件，而不是监管工作节点集群目录。`/codex
resume` 和 `/codex bind` 会附加当前对话，而不是创建安全的受监管分支；锁定模型的受监管 Chat 会拒绝这些绑定变更。不存在 `/codex continue` 或 `/codex archive` 运行时命令。

## 从本地会话创建分支

在 Gateway 网关计算机中存储的行或空闲行上选择 **Continue as branch**。
OpenClaw 会创建一个普通的 Chat 条目，镜像截至源最后一个已持久化终止轮次（已完成、已中断或
失败）的有界用户和助手历史记录，记录一个待处理的 harness 分支，然后打开 Chat。通用模型
选择器会被锁定，但此时尚未选择具体模型或提供商。源不会恢复，规范 harness 线程也尚未启动。
重复执行此操作会打开现有 Chat，而不是创建另一个分支。

镜像会保留同时符合以下三个限制的最新可见尾部：最多 200 条用户或助手消息、UTF-8 文本总计
512 KiB，以及每条消息 64 KiB。过大的消息会使用标记截断，达到上限时会省略较早的消息。图像
或本地图像输入会变成字面量 `[Image attachment]` 占位符；不会复制图像数据和本地路径。

发送第一条普通 Chat 消息以开始工作。Codex harness 会安装实际的审批、信息征询、事件和投递
处理程序。它会在监督连接上使用临时原生 fork 来固定源快照，而不提供模型或提供商覆盖。
Codex App Server 会从其当前原生配置中选择二者，并返回实际选择。在同一连接上，OpenClaw
会在其 cwd 和运行时策略下，使用返回的确切组合启动规范的 `appServer` 来源完整 harness
线程，注入有界可见历史记录，并归档临时 fork。规范线程拥有完整的 OpenClaw harness 工具
界面。这是可见历史记录分支，而不是完整原生 rollout 克隆：源推理、工具调用和工具结果均会
省略。此轮以及之后的每个轮次都会保留在受监督的 Codex 连接上，而不会转到其他 OpenClaw
模型运行时或普通的 agent-home harness。

返回的选择并不能证明源历史上使用的模型。如果当前原生配置与源最后一个轮次记录的模型不同，
Codex 会发出其常规模型差异警告。OpenClaw 使用返回的组合启动规范线程。Codex 会持久化该规范
线程的原生模型和提供商；由于 OpenClaw 省略模型和提供商覆盖，后续恢复时会保留它们。如果通过
单独的原生 Codex 控制更改了规范线程，OpenClaw 会接受 Codex 持久化的选择。OpenClaw 绝不会
改用其外层模型或回退链。

受监督且模型锁定的聊天无法被删除、切换模型、使用 `/new`
或 `/reset`、调用 Gateway 网关会话重置操作，也不能使用通用的
**分叉会话**操作。修改 `/codex model <model>`、`/codex
bind`、`/codex resume`（包括使用 `--bind here` 的节点会话），以及
`/codex detach` 或 `/codex unbind` 也会被拒绝，因为这些操作会替换
或清除锁定的原生绑定。仍可使用 `/codex model` 查询，以及 `/codex fast`、
`/codex permissions` 和 `/codex threads`。当你需要使用其他模型或新线程时，
请启动另一个普通会话。

请为此聊天保持启用监督。如果监督被禁用，或者其存储的连接绑定变得不可用
或不一致，该轮次将以关闭方式失败，而不会转移到普通的智能体主目录会话。

禁用或卸载 `codex` 插件不会解除该所有权，也不会使此聊天能够使用其他模型。
锁定的聊天会被保留，但不可用；重新安装或重新启用同一插件并重启 Gateway 网关
即可恢复。此处有意采用的失败关闭行为可防止保留期清理或临时插件中断在无提示的
情况下使原生绑定失去归属。

`codex_threads` 智能体工具遵循相同的边界。它无法附加其他分叉，也无法归档
此聊天绑定的原生线程。列表和仅元数据读取仍然可用。原始记录读取需要
`allowRawTranscripts`。当原始访问被禁用时，`codex_threads` 也会拒绝列表搜索，
因为原生搜索包含记录预览；Control UI 和操作员 CLI 仍提供受限的仅标题搜索。
重命名、取消归档、分离式分叉，以及归档不相关且无所有者的线程，都需要
`allowWriteControls`。这两个选项都无法绕过锁定的绑定。

OpenClaw 仅列出源线程或显示待处理聊天时，不会订阅或响应审批请求。在第一个轮次
中启动一个独立的规范化 harness 线程，可让另一个 Codex 进程继续拥有源线程，
而不会产生相互竞争的 rollout 写入者。

原始 CLI 或 VS Code 源仍对原生客户端和 OpenClaw 目录可见。规范分支存储为
原生 Codex 线程，但其源类型为 `appServer`；Codex Desktop 或其他原生客户端
可能会过滤该源类型，因此无法保证该分支会出现在每个原生历史记录视图中。

OpenClaw 的 App Server 报告为活动状态的行无法启动新分支。请等待当前轮次完成，
然后刷新目录。Codex App Server 会在单个进程内串行执行修改操作，但不会提供
跨进程的独占运行器租约或审批所有者租约。

对于**已存储 / 活动情况未知**的行，聊天镜像和首轮快照固定点会使用 Codex
截至最后一个已持久化终止轮次的状态。源线程不会被恢复、中断或归档。如果另一个
进程存在进行中的轮次，其最新的处理中工作可能不会出现在该分支中。

## 归档本地会话

在已存储或空闲的 Gateway 网关本地行上选择**归档**，然后确认没有其他 Codex
客户端或 OpenClaw 运行器正在使用该线程或其派生后代。OpenClaw 会重新读取
进程本地状态，仅在状态为 `idle` 或 `notLoaded` 时继续，调用原生 Codex
归档操作，并从未归档列表中移除该会话。原生 Codex 还会尝试归档该线程的
派生后代。

当重新读取报告会话处于活动或错误状态、会话属于已配对节点，或者新创建的
受监督聊天仍有一个源自该会话的待处理分支时，归档不可用。请先发送聊天的
第一条消息以实体化其规范分支，然后再归档源线程。如果 OpenClaw 知道某个
活动绑定拥有确切的目标线程或任何未归档的派生后代，归档也会被阻止。OpenClaw
会逐页执行实验性的 Codex 后代查询；响应无效、请求失败、游标或线程重复，
或者达到安全限制时，都会拒绝归档。

读取、后代枚举和归档请求并非一个条件式原子操作，因此在这些操作之间仍可能
启动一个轮次。App Server 状态也不会在独立进程之间共享。因此，对于未知客户端
和此竞态条件，确认步骤就是安全边界：请退出所有其他客户端，或通过其他方式
验证它们的状态，然后再确认。可使用 Codex Desktop、Codex CLI 或经所有者授权的
原生线程管理流程恢复已归档线程；取消归档后，该线程会重新出现。

```bash
codex unarchive <thread-id>
```

## 了解已配对节点的限制

已配对节点公开带版本的只读命令
`codex.appServer.threads.list.v1` 和
`codex.appServer.thread.turns.list.v1`。Gateway 网关接收规范化元数据和明确请求的
受限记录页面，而绝不会接收原始 App Server 端点。当前节点调用传输仅支持
请求/响应，因此无法承载 Codex harness 所需的长生命周期事件、审批和流式传输
生命周期。

因此，即使远程线程处于空闲状态，远程行仍然可见，但不会提供**继续**或
**归档**。在节点端流式运行器桥接可用于继续操作，并且归档具备安全的运行器
所有权边界之前，请在该计算机上使用 Codex。

## 元数据和权限

目录行可能包括：

- 线程和会话标识符
- 标题和工作目录
- 当前状态和活动等待标志
- 创建、更新和活动时间戳
- 来源、模型提供商、Codex CLI 版本和 Git 分支

目录投影不包括记录预览、轮次、rollout 路径、Codex 主目录路径、Git 远程仓库、
提交 SHA 和原始 App Server 错误。目录访问和 Control UI 记录读取需要
`operator.write` Gateway 网关权限范围，因为设备群聚合使用标准 `node.invoke`
路径，即使这两个节点命令都是只读的。

`supervision.allowRawTranscripts` 和 `supervision.allowWriteControls` 控制
自主智能体和独立 MCP 工具。两者默认均为 `false`。启用监督后，除非允许原始记录，
否则 `codex_threads` 会从列表和仅元数据读取结果中移除记录预览和轮次；
包含轮次的读取会以关闭方式失败。每次分叉、重命名、归档和取消归档都需要
写入控制权限。这些选项不会限制经过身份验证的 Control UI 记录查看，也不会
绕过绑定、主机、状态或确认检查。

### 兼容性工具

官方 `codex` 插件为现有智能体和独立 MCP 客户端保留了五个已发布的 Supervisor
工具名称：

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` 默认仅返回已加载项；不存在 `loaded_only` 参数。设置
`include_stored: true` 后，还会从 Codex 的状态数据库读取未归档的已存储行。
可选的 `max_stored_sessions` 上限默认为 200，每个端点可接受 1 至 1,000 行。
该上限不限制已加载行。如果没有原始记录权限，列表结果会省略从记录派生的名称、
预览和详细端点错误。
`codex_session_read` 需要 `allowRawTranscripts`；`include_turns: true`
还会要求 Codex 返回轮次。

`codex_session_send` 和 `codex_session_interrupt` 需要
`allowWriteControls`。发送操作接受 `mode: "auto" | "start" | "steer"`，但
`"start"` 始终会被拒绝，而 `"auto"` 和 `"steer"` 都只能引导一个可读取的活动轮次。
对于空闲线程，操作会被拒绝，并提示使用 **Codex 会话**；该功能会在继续操作前
安装完整 harness 所需的审批和工具处理程序。中断操作同样要求存在可读取的活动
轮次。这些工具不会恢复或启动空闲的源线程。

`openclaw doctor --fix` 会将已停用的 `codex-supervisor` 条目、其端点和权限字段，
以及插件允许/拒绝策略引用迁移到官方 `codex` 插件中，而不会覆盖明确的规范设置。
独立兼容性 MCP 适配器会继续从该插件加载相同的五个工具；旧版策略环境变量仅在
该受信任适配器内部生效。

有关每个监督配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference#supervision)。

## 故障排查

**未显示任何会话：**请验证是否已安装 `@openclaw/codex`，插件和
`supervision.enabled` 是否均为 true，当前插件允许列表是否允许 `codex`，
以及会话是否未被归档。更改激活状态后，请重启 Gateway 网关或节点。

**继续被禁用：**未映射的行可能处于活动状态、属于已配对节点、其主机离线，
或另一个操作正在等待处理。Gateway 网关本地的已存储行和空闲行提供
**作为分支继续**，而不是不安全地直接接管确切线程。已经拥有受监督聊天的行
会提供**打开聊天**。

**归档被禁用：**在确认没有其他运行器后，归档可用于已存储/活动情况未知和
空闲的 Gateway 网关本地行。活动、错误、离线、已配对节点、有待处理分支，
以及已知存在确切绑定所有者的行，其归档操作仍为只读。

**已归档会话消失：**这是预期行为。监督页面没有归档视图。运行
`codex unarchive <thread-id>` 或使用 Codex Desktop 可使其重新显示。

**旧的 `codex-supervisor` 配置仍然存在：**运行 `openclaw doctor --fix`。
Doctor 会将已停用的插件条目和相关插件策略引用迁移到
`plugins.entries.codex.config.supervision`，而不会覆盖明确的 Codex 设置。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Codex 监督架构](/specs/codex-supervision)
- [节点](/zh-CN/nodes)
- [Gateway 网关安全](/zh-CN/gateway/security)
