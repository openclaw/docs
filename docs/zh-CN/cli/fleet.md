---
read_when:
    - 你在一台机器上托管多个租户信任域
    - 你需要创建、检查、升级或移除机群单元
summary: 用于预配和管理隔离的每租户 OpenClaw 单元的 CLI 参考
title: 设备群组
x-i18n:
    generated_at: "2026-07-14T13:31:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` 管理称为 **cell** 的完整 OpenClaw 实例。每个 cell 都有自己的 Gateway 网关、状态、凭据、渠道账户、容器和仅限 local loopback 的主机端口。每个租户信任边界使用一个 cell；不要将一个共享 Gateway 网关用作不受信任的多租户边界。

Fleet 是**实验性**功能。命令名称、标志、输出格式和容器配置可能会在不同版本之间更改，且不提供弃用过渡期。

Fleet 支持 Docker 和 Podman。默认镜像为 `ghcr.io/openclaw/openclaw:latest`。

Fleet 已在 Linux 和 macOS 主机上进行测试。目前尚未在 Windows 主机上测试。

## 快速开始

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` 会将生成的 Gateway 网关令牌与 cell URL 一并输出一次。请立即保存该令牌，然后在每个租户自己的 cell 中配置该租户的渠道账户。

## 租户 ID

租户 ID 必须匹配：

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

允许使用 1 到 40 个小写字母、数字和内部连字符。ID 必须以字母或数字开头和结尾。大写字母、下划线、斜杠、点、空白字符以及 `../acme` 等路径遍历字符串都会被拒绝。

该 ID 将成为容器名称的一部分：`openclaw-cell-<tenant>`。

## `fleet create`

创建并启动 cell：

```bash
openclaw fleet create acme
```

在固定端口上创建 Podman cell，但不启动：

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

通过重复使用 `--env` 传递租户专属的环境变量：

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

环境变量键可使用字母、数字和下划线，且不能以数字开头。值必须为单行，因为 Fleet 会通过受保护的运行时环境文件传递这些值。Fleet 会拒绝覆盖[存储和容器布局](#storage-and-container-layout)中列出的托管容器路径变量和 Gateway 网关令牌变量。

### 创建选项

| 选项                    | 默认值                               | 说明                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | cell 的容器镜像。                                                                  |
| `--runtime <runtime>`     | `docker`                              | 容器 CLI：`docker` 或 `podman`。                                                           |
| `--port <number>`         | 从 `19100` 开始自动分配  | local loopback 主机端口。显式选择的端口不得属于另一个已注册的 cell。    |
| `--memory <value>`        | `2g`                                  | 使用 Docker/Podman 语法指定的容器内存限制。                                                |
| `--cpus <value>`          | `2`                                   | 容器 CPU 限制。                                                                           |
| `--disk <size>`           | 无                                  | 在存储后端支持配额时，限制容器可写层。                     |
| `--network <mode>`        | `bridge`                              | 出站网络模式：`bridge` 或 `internal`。                                                 |
| `--pids-limit <number>`   | `512`                                 | 容器中的最大进程数。                                                  |
| `--env <KEY=VALUE>`       | 无                                  | 向 cell 传递环境变量。可重复指定多个值。                          |
| `--gateway-token <value>` | 随机的 32 字符十六进制令牌 | 使用提供的 Gateway 网关令牌，而不是生成令牌。请参阅[令牌处理](#token-handling)。 |
| `--no-start`              | 启动 cell                           | 创建容器但不启动。                                                      |
| `--json`                  | 人类可读输出                 | 输出机器可读格式。                                                                 |

自动分配会选择不小于 `19100` 的第一个未使用注册表端口。Fleet 会拒绝重复的租户 ID，以及已分配给其他 cell 的显式端口。

镜像引用会作为单个容器运行时参数传递。空引用以及以 `-` 开头的值会被拒绝，以防镜像被解释为 Docker 或 Podman 选项。

选定的 Docker 或 Podman 端点必须位于本地。在预留端口或创建本地状态之前，Fleet 会拒绝远程 Docker context、`DOCKER_HOST` 端点和远程 Podman 服务。不支持远程 cell 主机。

当 Fleet 启动新的 cell 时，create 最多等待约一分钟，以便其 Gateway 网关响应 `/healthz`。如果 cell 未达到健康状态，Fleet 会保留其容器和注册表行，以供 `fleet status`、`fleet logs` 或显式删除操作使用。`--no-start` 会跳过此健康检查门禁。处于不健康状态的新 cell 所生成的 Gateway 网关令牌不会丢失——它仍保留在容器环境中（`docker|podman inspect`）；并且由于该 cell 尚未处理任何流量，因此执行 `fleet rm --force` 后再重新创建始终是安全的替代方案。

### 按摘要固定

create 和 upgrade 接受按摘要固定的镜像引用，例如 `--image ghcr.io/openclaw/openclaw@sha256:<digest>`。Fleet 会将镜像引用原样传递给 Docker 或 Podman，使操作员能够让 cell 固定使用不可变的镜像字节，而不是会变化的标签。

创建结果包含租户 ID、容器名称、主机端口、Gateway 网关令牌和本地 URL。即使使用 JSON 输出，也应将结果视为包含机密信息，因为其中含有令牌。

### 磁盘限制

`--disk` 仅限制容器可写层。通过绑定挂载的每租户状态目录和身份验证目录仍使用主机存储；如果这些目录也需要硬性限制，请使用主机文件系统项目配额。

| 运行时/存储后端 | `--disk` 支持情况                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| XFS 上的 Docker overlay2  | 需要 XFS 的 `pquota` 挂载选项。                                      |
| Docker btrfs 或 zfs     | 由存储驱动程序支持。                                             |
| Podman overlay          | 需要 XFS 后备存储。                                                |
| 其他后端          | 容器创建会失败，并显示守护进程错误和 Fleet 的后端指导信息。 |

### 出站策略

| 模式       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | 支持；默认不限制出站流量。                                                | 支持；默认不限制出站流量。                              |
| `internal` | 不支持，因为 Docker 在内部网络中无法保留已发布的 local loopback Gateway 网关端口。 | 支持；在阻止出站流量时，local loopback Gateway 网关仍保持发布状态。 |

对于 Docker，请保留 bridge 模式，并使用 `DOCKER-USER` 链等主机防火墙规则实施出站策略。

## `fleet list`

按租户 ID 顺序列出 cell：

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

表格包含：

| 列    | 含义                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | 租户 ID。                                                                                                                                                                                                                                                                            |
| `state`   | 通过 Docker 或 Podman 检查获取的实时容器状态。`unknown` 表示运行时不可用，或者存在一个名称与 cell 相同的容器，但其 Fleet 所有权标签与注册表记录不匹配（这是发生冲突或篡改的信号——执行操作前请手动检查）。 |
| `port`    | 映射到 cell Gateway 网关的 local loopback 主机端口。                                                                                                                                                                                                                                        |
| `image`   | 已记录的容器镜像。                                                                                                                                                                                                                                                             |
| `created` | cell 创建时间。                                                                                                                                                                                                                                                                   |

当 Docker 或 Podman 不可用时，注册表行仍然可见；只有实时状态会变为 `unknown`。

## `fleet status`

检查一个 cell：

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

状态信息结合了 Fleet 注册表行、实时容器检查以及对以下地址的简短尽力请求：

```text
http://127.0.0.1:<host-port>/healthz
```

健康检查结果为 `ok`、`failed` 或 `skipped`。`/healthz` 仅证明 Gateway 网关处于活动状态，并不表示每个已配置渠道或插件均已完全就绪。当没有可检查的可用本地端点时，会跳过探测。

## `fleet logs`

将 cell 的容器日志直接流式传输到终端：

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet 会在读取任何日志前验证已注册容器的所有权标签，因此会拒绝使用预期 cell 名称的外来容器。日志流会固定到检查到的容器 ID，因此并发替换无法将其重定向到更新的代次。按 Ctrl-C 可结束 `--follow`，且不会将操作员的停止视为命令失败。日志输出会经过脱敏过滤器，在任何内容到达终端之前，将 cell 当前的 Gateway 网关令牌替换为 `<redacted>`。

`fleet logs` 没有 `--json` 模式，因为容器日志是原始 stdout/stderr 流。对于脚本，请使用 `--tail` 限制输出量，并使用常规 shell 重定向或管道。

## `fleet start`、`fleet stop` 和 `fleet restart`

使用已记录的运行时控制现有单元：

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

这些命令对已注册的容器名称执行操作。如果租户未知，或已记录的运行时无法执行该操作，命令将失败。

## `fleet upgrade`

重新拉取已记录的镜像并替换单元容器：

```bash
openclaw fleet upgrade acme
```

将单元迁移到另一个镜像：

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

升级会拉取目标镜像，检查现有容器和每单元网络，停止并移除容器，然后重新创建并启动容器。替换后会保留相同的主机端口、数据目录、每单元桥接网络、运行时配置、资源限制、重启策略、Fleet 管理的环境，以及最初通过 `--env` 提供的值。已挂载的状态在容器替换后仍会保留；镜像默认环境可能随目标镜像而变化。

只有当替换容器的 Gateway 网关在单元的回环端口上响应 `/healthz` 后，替换才会提交，这与官方 compose 文件使用的健康检查契约一致。如果替换容器退出、反复崩溃重启，或未能在大约一分钟内变为健康状态，系统会将其移除并恢复先前的容器，因此损坏的镜像不会导致正常工作的单元停机。

Gateway 网关令牌有意不存储在 Fleet 注册表中。移除旧容器之前，Fleet 会读取其环境，并将 `OPENCLAW_GATEWAY_TOKEN` 传递到替换容器中。如果令牌未保存在你控制的其他任何位置，请勿在升级前手动移除旧容器。

## `fleet backup` 和 `fleet restore`

备份一个已停止的单元：

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

将该归档恢复到已注册的单元中：

```bash
openclaw fleet restore acme --from ./acme.tgz
```

这些是需要主机操作员权限的命令。归档包含租户状态和身份验证密钥，以 `0600` 模式创建，必须像凭据一样存储。备份会拒绝正在运行的单元，以确保一致地捕获 SQLite 状态。除非提供 `--force`，否则恢复会拒绝正在运行的单元；恢复仅替换该租户的状态、轮换 Gateway 网关令牌，并且只打印一次新令牌。Fleet 每次备份一个租户；备份所有租户是单独的操作员操作。

恢复需要一个现有且已停止的容器，因为通过检查该容器获得的运行时配置会提供替换容器的限制、用户映射、环境来源和镜像。如果已注册的容器被绕过 Fleet 移除，请先运行不带 `--purge-data` 的 `fleet rm <tenant> --force`，使用预期镜像和 `--no-start` 重新创建单元，然后重试恢复。首次移除会完整保留两个租户数据目录。

两个命令都接受 `--max-bytes <bytes>`，用于限制归档或提取的文件数据；两个命令还应用固定的一百万个归档路径段预算，使仅包含元数据的归档炸弹无法耗尽主机 inode，并确保每个被接受的备份都可恢复。备份接受 `--out <path>`，两个命令都支持 `--json`。

归档仅包含常规文件和目录。备份绝不会跟随或存储符号链接、硬链接、套接字或设备节点；结果中会报告跳过的数量。恢复会拒绝包含任何其他条目类型的归档。恢复后，必须在单元内重新安装可重新创建的符号链接树，例如工作区 `node_modules`。

## `fleet doctor`

审计所有单元或单个租户，而不更改运行时或文件系统状态：

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor 会检查运行时本地性、所有权标签、健康状态、安全强化、资源限制、回环端口绑定、令牌是否存在、网络所有权和出口模式，以及私有状态目录权限。警告会说明已停止的单元或所有权差异；任何失败的检查项都会将进程退出码设为非零值。

## `fleet rm`

从运行时和注册表中移除已停止的单元，同时保留租户数据：

```bash
openclaw fleet rm acme
```

正在运行的容器需要 `--force`：

```bash
openclaw fleet rm acme --force
```

同时永久移除单元数据：

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet 会先移除单元容器，再移除其专用桥接网络。`--purge-data` 需要 `--force`。在递归删除前，Fleet 会解析两个 Fleet 所有的根目录和两个每租户目录。每个目标都必须是完全符合预期的租户叶目录，严格位于其根目录内，并且不能是符号链接。这些包含关系检查可防止损坏的注册表路径或跨租户符号链接将删除操作重定向到其他位置。

如果完全符合预期的租户目录已经不存在，清除操作可以重试。这样，在文件系统发生部分故障后，后续调用可以完成清理，同时不会放宽对仍然存在的目录的路径检查。

## 存储和容器布局

单元状态和身份验证配置文件加密密钥使用独立的每租户主机路径，位于当前 OpenClaw 状态目录下：

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

第一个目录挂载在 `/home/node/.openclaw`。第二个目录挂载在 `/home/node/.config/openclaw`，与官方 Docker 设置中的加密密钥挂载一致。因此，加密密钥不会暴露在普通状态挂载目录下，并且仅备份或共享单元状态目录时不会包含该密钥。这两个目录在正常移除和升级后都会保留；`fleet rm --purge-data --force` 会在分别执行包含关系检查后删除两者。

首次启动前，Fleet 会使用 `gateway.mode=local`、令牌身份验证、LAN 容器绑定，以及为已分配主机端口配置的 Control UI 来源来初始化单元配置。令牌值不会写入该配置，而是保留在容器环境中。

Fleet 使用以下环境值固定官方镜像中的容器路径：

| 变量                     | 容器值                               |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | 生成或提供的单元令牌                 |

官方镜像默认使用 UID 1000 的非 root 用户 `node`。Fleet 会使私有 `0700` 绑定挂载保持可写，同时不会使其可被所有用户访问。Rootful Docker 使用调用方非 root 用户的 UID 和 GID 运行单元；rootless Docker 使用容器 UID 0，该 UID 在守护进程的用户命名空间内映射到调用方的非特权主机用户。Podman 使用 `keep-id` 以及调用方的 UID 和 GID。当 Fleet 本身以 root 身份连接 rootful 运行时时，它会保留镜像用户，并将初始挂载文件分配给 UID/GID 1000。

在 SELinux 主机上，Docker 和 Podman 挂载会获得私有 `:Z` 重新标记。如果恢复或迁移单元数据，请确保有效容器用户可以写入绑定挂载路径。此配置适合 rootless 环境，但主机上的 Docker 或 Podman 必须已配置为以 rootless 模式运行；Fleet 不会将 rootful 守护进程转换为 rootless 守护进程。

## 安全配置

Fleet 会将以下配置应用于每个单元：

| 控制项               | 应用的配置                                           | 原因                                                                                     |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Linux 权能           | `--cap-drop=ALL`                                     | Gateway 网关是 Node.js 进程，不需要额外的 Linux 权能。                                  |
| 权限提升             | `--security-opt no-new-privileges`                   | 防止进程通过 setuid 或 setgid 二进制文件获得权限。                                       |
| Init 进程            | `--init`                                             | 回收后代进程并转发容器生命周期信号。                                                     |
| 进程限制             | 默认为 `--pids-limit 512`                        | 限制 fork 和进程耗尽。                                                                   |
| 内存限制             | 默认为 `--memory 2g`                             | 限制单元内存使用量。                                                                     |
| CPU 限制             | 默认为 `--cpus 2`                                | 限制单元 CPU 使用量。                                                                    |
| 可写层磁盘           | 可选的 `--disk`                                    | 当运行时存储后端支持配额时，限制容器层。                                                 |
| 重启策略             | `--restart unless-stopped`                           | 重启发生故障的单元，同时不会覆盖有意执行的停止操作。                                     |
| 主机发布             | 仅 `127.0.0.1:<host-port>:18789`                   | 避免 Gateway 网关暴露在主机通配接口上。                                                  |
| 单元网络             | 每个单元使用一个桥接网络或 Podman 内部网络           | 隔离容器 IP 流量，并可选择阻止 Podman 出站流量。                                         |
| 容器身份             | 与主机匹配的用户映射                                 | 使私有绑定挂载保持可写，同时不授予所有用户访问权限。                                     |
| 持久状态             | 每单元挂载；无共享状态挂载                           | 将租户配置、凭据、会话和工作区保留在该租户的数据树中。                                   |
| 容器命令             | `node dist/index.js gateway --bind lan --port 18789` | 监听容器网络，使仅限回环地址的主机端口映射可以访问它。                                   |

Fleet 绝不会挂载 `/var/run/docker.sock`、使用 `--privileged` 或主机网络，也不会添加权能。每单元桥接网络是跨单元隔离边界，而不是出站防火墙：单元仍会保留提供商和渠道所需的网络出口。请在回环端口前配置符合你的部署要求的代理、SSH 隧道或 tailnet 配置。`http://127.0.0.1:<port>` 只能从 Fleet 主机直接访问。

此配置会隔离租户容器，但无法保护租户免受 Fleet 操作员、容器运行时管理员或已被入侵的主机影响。有关完整的信任模型和更强的隔离选项，请参阅[多租户托管](/zh-CN/gateway/multi-tenant-hosting)。

## 令牌处理

默认情况下，`fleet create` 会生成一个采用加密安全随机值的 32 字符十六进制 Gateway 网关令牌，并在创建结果中仅打印一次。请将其存储在获准使用的密钥管理器中，并避免在日志中捕获创建输出。

`--gateway-token` 会将自定义令牌放入本地进程参数中，该参数可能保留在 shell 历史记录中或显示在进程列表中。除非现有密钥管理工作流需要提供指定值，否则请优先使用生成的令牌。

令牌以及通过 `--env` 传递的每个值都存在于容器环境中。Fleet 会将它们写入一个短期存在、模式为 `0600` 的环境文件，仅将该文件的路径传递给 Docker 或 Podman，并在运行时命令结束后移除该文件。在 `openclaw fleet create --gateway-token ...` 或 `--env KEY=VALUE` 中显式输入的值仍可能显示在外层 `openclaw` 进程参数和 shell 历史记录中。

容器环境变量值不会对受信任的主机操作员隐藏：Docker 或 Podman 管理员可以通过检查容器来读取这些值。Fleet 的“仅显示一次”说明描述的是正常的 CLI 输出，并不表示能够防止主机管理员访问。

## 相关内容

- [多租户托管](/zh-CN/gateway/multi-tenant-hosting)
- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [Gateway 网关安全](/zh-CN/gateway/security)
