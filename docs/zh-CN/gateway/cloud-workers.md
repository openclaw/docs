---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 将会话分派到一次性云端机器：资源预配、工作节点运行时、代理推理和流式返回结果
title: 云端工作节点
x-i18n:
    generated_at: "2026-07-16T11:32:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

云端工作节点允许会话在一次性云端机器上运行其智能体循环，同时会话的所有相关内容仍保留在原处：在侧边栏中可见、实时流式传输，并且对话记录由 Gateway 网关所有。Gateway 网关租用一台机器，在其上安装固定版本的 OpenClaw，将会话的工作区同步过去，然后把轮次循环交给受限的 `openclaw worker` 进程。模型调用通过 Gateway 网关代理返回，因此提供商凭证绝不会离开你的机器；由于提供商看到的是一个连续的数据流，提示词缓存也能继续工作。

工作完成后（或机器故障时），该机器会被丢弃。持久状态——对话记录、工作区提交、放置记录——保留在 Gateway 网关一侧。

<Note>
云端工作节点需要主动选择启用，并且在配置个人资料之前不可见。未配置的安装不会出现新的 RPC、配置或 UI。
</Note>

## 各部分在哪里运行

| 关注项                                                 | 位置                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 智能体循环 + 工具（`exec`、`read`、`write`、`edit`、…） | 云端工作节点机器                                                                 |
| 模型推理和提供商凭证                | Gateway 网关（通过 `{provider, model}` 引用进行代理）                               |
| 对话记录（持久，会话存储）                     | Gateway 网关                                                                          |
| 实时流式传输到侧边栏                         | Gateway 网关扇出，由工作节点的可重放事件流提供数据                      |
| 工作区 Git 历史                                   | 在机器上无凭证创建；Gateway 网关接纳提交并负责推送/PR |

除 `sshd` 外，该机器不需要任何入站端口：Gateway 网关通过固定的 SSH 主动连接，反向隧道将工作节点的 WebSocket 传回。内置的 Crabbox 提供商强制使用公共 SSH 路由，并禁用托管式 Tailscale 注册。出站互联网访问由提供商策略决定；除非限制其网络或安全组，否则默认 AWS 个人资料可以访问互联网。

## 要求

- 一个工作节点提供商插件。内置的 `crabbox` 插件驱动 [Crabbox](https://github.com/openclaw/crabbox) CLI，该 CLI 代理跨云后端（AWS、Hetzner 等）的租约。`crabbox` 二进制文件必须位于 `PATH` 中（或设置 `settings.binary`），并且已配置提供商凭证。AWS 准入要求 Crabbox 0.38.1 或更高版本。
- 对于 Crabbox AWS 工作节点，有效的 `aws.instanceProfile` 必须为空。提供商在分配前检查 `crabbox config show --json`，然后要求 `crabbox inspect --json` 报告来自 EC2 `DescribeInstances` 的 `providerMetadata.instanceProfileAttached: false`。具有实例角色或缺少权威元数据的租约会被停止并拒绝。
- 租用机器上的 Node.js。裸云镜像通常不包含它——请在个人资料的 `setup` 命令中安装。
- 具有会话所有的托管工作树的会话（使用 `worktree: true` 创建）。调度会移动该工作树的内容；普通目录则同步为清单镜像。

## 配置

在 `openclaw.json` 的 `cloudWorkers.profiles` 下添加个人资料：

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

个人资料字段：

| 键        | 含义                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | 由插件注册的工作节点提供商 ID（内置插件为 `crabbox`）。                                                                                                                                                                  |
| `install`  | `bundle`（默认）分发正在运行的 Gateway 网关构建；`npm` 使用固定的完整性值安装与 Gateway 网关完全相同的已发布版本。`npm` 要求 Gateway 网关从打包发布版本运行。                                                      |
| `settings` | 提供商所有的 JSON。对于 crabbox：`provider`（后端）、`class`（机器类别）、`ttl`、`idleTimeout`（Go 时长），以及可选的 `setup` 和绝对 `binary` 路径。OpenClaw 对这些租约强制使用公共 SSH，并禁用托管式 Tailscale。 |
| `lifetime` | 可选的已存储策略（`idleTimeoutMinutes`、`maxLifetimeMinutes`）。                                                                                                                                                                           |

### 设置命令

`settings.setup` 在租用机器的 SSH 准备就绪后、安装 OpenClaw 之前运行。它会在**每次**预配尝试时运行（包括调度中断后的重放），因此必须具备幂等性——请像示例一样，使用 `command -v`/`test -x` 检查来保护安装操作。如果设置失败，提供商会停止租约，调度也会以关闭方式失败；不会留下仍在运行的半配置机器。

### 安装渠道

- **`bundle`** 会打包正在运行的 Gateway 网关的 `dist`、经过精简的 `package.json`，以及构建引用的所有工作区软件包，并用内容哈希覆盖全部内容。机器根据该哈希验证原始软件包，然后安装生产环境 npm 依赖项（禁用脚本）。这是在工作节点上运行开发构建的方式。
- **`npm`** 会验证该发布版本存在于公共注册表中，固定其 SHA-512 完整性值，并安装与 Gateway 网关完全匹配的 `openclaw@<version>`。

## 调度会话

在 Control UI 中，打开 **New Session**，选择配置的运行时为 OpenClaw 的智能体，从 **Where** 菜单中选择已配置的 **Cloud · profile** 目标，然后启动任务。选择云端目标会自动启用所需的托管工作树；Gateway 网关创建会话、完成调度，然后才发送第一个轮次。会话侧边栏中的服务器徽章会显示持久放置状态。外部 CLI 会话目录不提供云端目标。

等效的 RPC 流程如下：

创建一个具有托管工作树的会话，然后调度它（RPC 要求 `operator.admin`，并且仅在已配置个人资料时存在）：

云端工作节点运行 OpenClaw 智能体运行时。选择 `openai/*` 或其他可解析到该运行时的模型；配置为外部 CLI 运行时（如 `claude-cli`）的会话无法调度。

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` 会关闭本地轮次准入、排空活动工作、预配租约、运行设置、引导 OpenClaw、同步工作区，并在放置达到 `active` 工作节点所有权后返回。第一次调度请预留几分钟；如果提供商支持，租约和安装会被缓存。之后，像往常一样与会话交互——轮次会自动路由到工作节点。

已完成的工作节点轮次会在释放轮次声明之前，将符合条件且大小受限的工作区文件协调回会话的托管工作树。终止工作节点事件在得到确认前会创建持久的待处理结果屏障，因此 Gateway 网关重启恢复会先拉回远程工作区，然后过期轮次清理才能销毁其所有者。协调过程会验证工作节点清单，并在本地出现分歧时停止，而不会覆盖任一侧。在更改文件之前，Gateway 网关会在其 SQLite 状态数据库中存储一个有界回滚日志；如果 Gateway 网关进程中断，重试会恢复该日志。工作区结果使用 Git 文件语义：保留常规文件、可执行位、符号链接、新增、修改和删除，而不保留空目录及其他目录模式。远程提交对象不会被保留；产生的文件更改会留在托管工作树中，以便进行常规审查和提交。

工作完成且没有轮次正在运行时，打开会话菜单并选择 **Stop cloud worker…**。Gateway 网关会在销毁环境前执行最后一次工作区协调。已处于 `draining` 或 `reconciling` 的放置正在完成拆除；请等待其徽章变为 `reclaimed` 后再删除会话。

对于故障或失控且仍处于附加状态的工作节点，操作员可将 `environments.destroy` 与 `{ "force": true }` 搭配调用，作为最后手段。强制拆除会持久地将放置标记为失败，并在销毁环境前放弃所有未协调的远程结果。

等效的管理 RPC 如下：

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

放置会经过持久状态机（`local → requested → provisioning → syncing → starting → active`）转换，因此 Gateway 网关在调度期间重启时会进行协调，而不是泄漏机器。失败的模型轮次会保留活动放置，以便重试。如果入站工作区协调失败，工作节点也会保持活动状态，以便操作员解决本地冲突并重试，而不会丢失远程结果；生命周期故障则会将放置转入错误或已回收状态，并保留其诊断尾部。

## 安全模型

- **封闭的工作节点入口。** 工作节点通过隧道套接字上的专用协议通信，该协议具有封闭的方法允许列表——工作节点无法调用操作员 RPC。
- **签发的凭证，以哈希形式静态存储。** 每次调度都会签发一个工作节点凭证；Gateway 网关仅存储其哈希。凭证轮换和所有者纪元隔离保证每个会话最多只有一个活动所有者——重新连接的过期工作节点会被隔离，绝不会合并。
- **主机密钥固定。** 提供商必须在预配时公开机器的 SSH 主机密钥；引导过程使用严格固定的密钥进行连接，缺少密钥时以关闭方式失败。
- **机器上不保留常驻的模型、代码托管平台或云凭证。** 模型身份验证保留在 Gateway 网关上（推理通过 `{provider, model}` 引用传输），工作区 Git 提交在没有代码托管平台凭证的情况下创建，并且在设置前会以权威方式检查 Crabbox AWS 租约元数据中是否存在实例角色。设置命令也必须不包含凭证。
- **提供商所有的出站访问。** 反向隧道消除了 OpenClaw 直接访问模型的任何需求，但 OpenClaw 不会重写提供商防火墙。当任务需要时，请在工作节点提供商中限制出站流量。
- **持久、恰好一次的对话记录。** 工作节点通过针对会话叶节点的比较并交换协议提交对话记录批次；过期的基准会使运行停止，而不是复制付费输出或为其变基。

## 故障排查

- **`sessions.dispatch` 是未知方法** — 未配置任何 `cloudWorkers.profiles`，或调用方缺少 `operator.admin`。
- **“云端工作节点轮次需要 OpenClaw 运行时”** — 请选择已配置使用 OpenClaw 运行时的模型。`claude-cli` 等外部 CLI 运行时不支持工作节点推理。
- **“工作节点引导需要租用主机上安装 Node.js”** — 在 `settings.setup` 中添加 Node 安装步骤（见上文）。
- **AWS 实例角色证明失败** — 清除 `aws.instanceProfile`（如果设置了 `CRABBOX_AWS_INSTANCE_PROFILE`，也需清除）。安装 Crabbox 0.38.1 或更高版本；旧版二进制文件不会公开 AWS 准入所需的权威 `providerMetadata.instanceProfileAttached` 契约。
- **分派因提供商错误而失败** — 放置记录和 `environments.list` 会保留最后一次错误，包括设置/引导过程的 stderr 尾部。Box 会在失败时销毁，因此该尾部信息是主要的取证依据。
- **分派时客户端超时** — `openclaw gateway call` 的默认超时时间为 10s；请为 `--timeout` 设置充足的值（无论如何，分派都会继续在服务器端运行；在预配期间重试会被拒绝并返回 `session cannot dispatch from placement provisioning`）。
- **租约维护** — `crabbox list --provider <backend>` 显示有效租约；`crabbox stop --provider <backend> --id <lease>` 可手动释放租约。空闲租约会按照配置文件的 `idleTimeout` 到期。

## 相关内容

- [沙箱隔离](/zh-CN/gateway/sandboxing) — 缩小本地工具执行的影响范围
- [会话 CLI](/zh-CN/cli/sessions) — 检查已存储的会话
- [配置参考](/zh-CN/gateway/configuration-reference)
