---
read_when:
    - 故障排除中心将你引导到这里以进行更深入的诊断
    - 你需要按稳定症状划分、包含精确命令的操作手册章节
sidebarTitle: Troubleshooting
summary: 适用于 Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除操作手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-27T12:52:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ebc72b537f34dfb0dcc8b2e56014bc6a573f46835b65b9953e2edfe403bc5ca
    source_path: gateway/troubleshooting.md
    workflow: 15
---

本页是深度操作手册。如果你想先走快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先按以下顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输协议状态，并在支持的情况下显示探测/审计结果，例如 `works` 或 `audit ok`。

## 安装分裂与较新配置保护

当 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制版本早于最后写入 `openclaw.json` 的版本时，请使用本节。

OpenClaw 会使用 `meta.lastTouchedVersion` 标记配置写入。只读命令仍然可以检查由较新版本 OpenClaw 写入的配置，但进程和服务变更不会继续由较旧二进制执行。被阻止的操作包括 Gateway 网关服务启动、停止、重启、卸载、强制重新安装服务、服务模式下的 Gateway 网关启动，以及 `gateway --force` 端口清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修复 PATH">
    修复 `PATH`，使 `openclaw` 解析到较新的安装，然后重新运行该操作。
  </Step>
  <Step title="重新安装 Gateway 网关服务">
    从较新的安装重新安装目标 Gateway 网关服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除过期包装器">
    移除仍指向旧 `openclaw` 二进制的过期系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，为单次命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常运行时请保持未设置。
</Warning>

## Anthropic 429：长上下文需要额外使用额度

当日志/错误中包含以下内容时，请使用本节：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

重点检查：

- 所选 Anthropic Opus/Sonnet 模型设置了 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文使用资格。
- 请求仅在需要 1M beta 路径的长会话/模型运行中失败。

修复选项：

<Steps>
  <Step title="禁用 context1m">
    为该模型禁用 `context1m`，以回退到普通上下文窗口。
  </Step>
  <Step title="使用符合条件的凭证">
    使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API 密钥。
  </Step>
  <Step title="配置回退模型">
    配置回退模型，以便在 Anthropic 长上下文请求被拒绝时继续运行。
  </Step>
</Steps>

相关内容：

- [Anthropic](/zh-CN/providers/anthropic)
- [令牌使用与成本](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地兼容 OpenAI 的后端可通过直接探测，但智能体运行失败

当出现以下情况时，请使用本节：

- `curl ... /v1/models` 可用
- 很小的直接 `/v1/chat/completions` 调用可用
- OpenClaw 模型运行仅在正常智能体轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

重点检查：

- 直接的小请求成功，但 OpenClaw 运行仅在较大提示词下失败
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 可以工作，仍出现 `model_not_found` 或 404 错误
- 后端报错 `messages[].content` 应为字符串
- 在兼容 OpenAI 的本地后端上，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 后端崩溃仅在较大的提示词 token 数或完整智能体运行时提示词下出现

<AccordionGroup>
  <Accordion title="常见特征">
    - 本地 MLX/vLLM 风格服务器上的 `model_not_found` → 验证 `baseUrl` 包含 `/v1`，对于 `/v1/chat/completions` 后端，`api` 为 `"openai-completions"`，并且 `models.providers.<provider>.models[].id` 是提供商本地的裸 ID。使用带提供商前缀的形式选择它一次，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目录条目中仍保留为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容片段。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 后端完成了 Chat Completions 请求，但该轮没有返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常意味着后端正在发出空/非文本内容，或抑制了最终答案文本。
    - 直接的小请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建中的 Gemma）→ OpenClaw 传输协议很可能已经正确；是后端在更大的智能体运行时提示词形态下失败。
    - 禁用工具后失败减少但未消失 → 工具 schema 是压力来源之一，但剩余问题仍然是上游模型/服务器容量不足或后端 bug。
  </Accordion>
  <Accordion title="修复选项">
    1. 对仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 对无法可靠处理 OpenClaw 工具 schema Surface 的模型/后端设置 `compat.supportsTools: false`。
    3. 尽可能降低提示词压力：更小的工作区引导内容、更短的会话历史、更轻量的本地模型，或使用长上下文支持更强的后端。
    4. 如果直接的小请求始终成功，但 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并携带已接受的载荷形态到上游提交复现。
  </Accordion>
</AccordionGroup>

相关内容：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [兼容 OpenAI 的端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已启动但没有任何响应，在重新连接任何内容之前，先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

重点检查：

- 私信发送方仍在等待配对。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组允许列表不匹配。

常见特征：

- `drop guild message (mention required` → 群消息在被提及之前会被忽略。
- `pairing request` → 发送方需要批准。
- `blocked` / `allowlist` → 发送方/渠道被策略过滤。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## 仪表板 Control UI 连接问题

当仪表板/Control UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

重点检查：

- 正确的探测 URL 和仪表板 URL。
- 客户端与 Gateway 网关之间的认证模式/令牌不匹配。
- 在需要设备身份时却使用了 HTTP。

<AccordionGroup>
  <Accordion title="连接 / 认证特征">
    - `device identity required` → 非安全上下文，或缺少设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 浏览器来源连接，但未显式加入允许列表）。
    - `device nonce required` / `device nonce mismatch` → 客户端未完成基于质询的设备认证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签名了错误的载荷（或使用了过期时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可使用缓存的设备令牌执行一次可信重试。
    - 该缓存令牌重试会复用与已配对设备令牌一同存储的缓存范围集。显式 `deviceToken` / 显式 `scopes` 调用方则保持其请求的范围集不变。
    - 在该重试路径之外，连接认证优先级依次为：显式共享令牌/密码、显式 `deviceToken`、已存储设备令牌、bootstrap 令牌。
    - 在异步 Tailscale Serve Control UI 路径上，相同 `{scope, ip}` 的失败尝试会在限流器记录失败前被串行化。因此，同一客户端同时进行两次错误重试时，第二次尝试可能返回 `retry later`，而不是出现两次普通不匹配。
    - 来自浏览器来源 loopback 客户端的 `too many failed authentication attempts (retry later)` → 来自相同规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源会使用单独的桶。
    - 在该重试之后反复出现 `unauthorized` → 共享令牌/设备令牌已漂移；请刷新令牌配置，并在需要时重新批准/轮换设备令牌。
    - `gateway connect failed:` → 宿主机/端口/URL 目标错误。
  </Accordion>
</AccordionGroup>

### 认证详情代码速查表

使用失败 `connect` 响应中的 `error.details.code` 选择下一步操作：

| 详情代码 | 含义 | 建议操作 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | 客户端未发送必需的共享令牌。 | 在客户端中粘贴/设置令牌后重试。对于仪表板路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。 |
| `AUTH_TOKEN_MISMATCH` | 共享令牌与 Gateway 网关认证令牌不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。缓存令牌重试会复用已存储的已批准范围；显式 `deviceToken` / `scopes` 调用方则保持其请求的范围不变。如果仍然失败，请运行 [令牌漂移恢复清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或已撤销。 | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备令牌，然后重新连接。 |
| `PAIRING_REQUIRED` | 设备身份需要批准。请检查 `error.details.reason`，其值可能为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：`openclaw devices list`，然后 `openclaw devices approve <requestId>`。范围/角色升级在你审核所请求的访问权限后也使用相同流程。 |

<Note>
使用共享 Gateway 网关令牌/密码认证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备范围基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请验证调用方是否使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，并且没有强制显式 `deviceIdentity` 或设备令牌。
</Note>

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，请更新连接的客户端并验证：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关发出的 `connect.challenge`。
  </Step>
  <Step title="对载荷签名">
    客户端对绑定 challenge 的载荷进行签名。
  </Step>
  <Step title="发送设备 nonce">
    客户端发送 `connect.params.device.nonce`，并使用相同的 challenge nonce。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 已配对设备令牌会话只能管理**它们自己的**设备，除非调用方同时拥有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话当前已持有的运维人员范围

相关内容：

- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [Control UI](/zh-CN/web/control-ui)
- [Devices](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时，请使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也扫描系统级服务
```

重点检查：

- 带退出提示的 `Runtime: stopped`。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时发现的额外 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被破坏并丢失了 `gateway.mode`。修复方法：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径的情况下绑定到非 loopback 地址（令牌/密码，或在已配置时使用 trusted-proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数环境应保持每台机器一个 Gateway 网关；如果你确实需要多个，请隔离端口 + 配置/状态/工作区。请参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
  </Accordion>
</AccordionGroup>

相关内容：

- [后台执行与进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关恢复了最后已知良好配置

当 Gateway 网关能够启动，但日志显示它恢复了 `openclaw.json` 时，请使用本节。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

重点检查：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 活动配置旁边带时间戳的 `openclaw.json.clobbered.*` 文件
- 主智能体系统事件，且其开头为 `Config recovery warning`

<AccordionGroup>
  <Accordion title="发生了什么">
    - 被拒绝的配置在启动或热重载期间未通过验证。
    - OpenClaw 将被拒绝的载荷保留为 `.clobbered.*`。
    - 活动配置已从最后一次通过验证的最后已知良好副本恢复。
    - 下一次主智能体轮次会收到警告，不要盲目重写被拒绝的配置。
    - 如果所有验证问题都位于 `plugins.entries.<id>...` 下，OpenClaw 不会恢复整个文件。插件本地失败会保持显式报错，而无关的用户设置仍保留在活动配置中。
  </Accordion>
  <Accordion title="检查并修复">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="常见特征">
    - 存在 `.clobbered.*` → 外部直接编辑或启动读取已被恢复。
    - 存在 `.rejected.*` → OpenClaw 自有的配置写入在提交前未通过 schema 或覆盖检查。
    - `Config write rejected:` → 该写入尝试删除必需结构、大幅缩小文件，或持久化无效配置。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 启动时将当前文件视为已损坏，因为与最后已知良好备份相比，它丢失了字段或文件大小明显下降。
    - `Config last-known-good promotion skipped` → 候选配置包含了被脱敏的密钥占位符，例如 `***`。
  </Accordion>
  <Accordion title="修复选项">
    1. 如果恢复后的活动配置正确，就保留它。
    2. 只从 `.clobbered.*` 或 `.rejected.*` 中复制你想要的键，然后使用 `openclaw config set` 或 `config.patch` 应用。
    3. 重启前运行 `openclaw config validate`。
    4. 如果手动编辑，请保留完整的 JSON5 配置，而不是只保留你想修改的局部对象。
  </Accordion>
</AccordionGroup>

相关内容：

- [配置](/zh-CN/cli/config)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能探测到某些目标，但仍打印警告块时，请使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

重点检查：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺少范围或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接配置/loopback 目标。
- `multiple reachable gateways detected` → 有多个目标响应。通常这意味着有意的多 Gateway 网关部署，或存在过期/重复监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受范围限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关有响应，但此客户端仍需完成配对/批准后才能获得正常运维访问。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在此命令路径中，失败目标所需的认证材料不可用。

相关内容：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一宿主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息不流动

如果渠道状态显示已连接，但消息流完全中断，请重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

重点检查：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组允许列表与提及要求。
- 缺失的渠道 API 权限/范围。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准跟踪 → 发送方尚未获得批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证/权限问题。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)
- [WhatsApp](/zh-CN/channels/whatsapp)

## Cron 与 heartbeat 投递

如果 cron 或 heartbeat 未运行或未投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

重点检查：

- Cron 已启用，且存在下一次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器 tick 失败；请检查文件/日志/运行时错误。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 当前处于非活跃时段窗口之外。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / Markdown 标题，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何任务到期。
    - `heartbeat: unknown accountId` → heartbeat 投递目标的账号 ID 无效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → heartbeat 目标被解析为私信式目标，而 `agents.defaults.heartbeat.directPolicy`（或每个智能体的覆盖值）设置为 `block`。
  </Accordion>
</AccordionGroup>

相关内容：

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [定时任务：故障排除](/zh-CN/automation/cron-jobs#troubleshooting)

## 节点已配对，但工具失败

如果节点已配对，但工具失败，请分别检查前台状态、权限和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

重点检查：

- 节点在线，并具有预期能力。
- 摄像头/麦克风/位置/屏幕的 OS 权限授予情况。
- Exec 批准和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表拦截。

相关内容：

- [Exec 批准](/zh-CN/tools/exec-approvals)
- [节点故障排除](/zh-CN/nodes/troubleshooting)
- [Nodes](/zh-CN/nodes/index)

## 浏览器工具失败

当浏览器工具操作失败，但 Gateway 网关本身是健康的，请使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

重点检查：

- 是否设置了 `plugins.allow`，且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP 配置文件是否可达。
- 对于 `existing-session` / `user` 配置文件，本地 Chrome 是否可用。

<AccordionGroup>
  <Accordion title="插件 / 可执行文件特征">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
    - 在 `browser.enabled=true` 时浏览器工具缺失 / 不可用 → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不支持的协议，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少内置浏览器插件所需的 `playwright-core` 运行时依赖；请运行 `openclaw doctor --fix`，然后重启 Gateway 网关。ARIA 快照和基本页面截图仍可工作，但导航、AI 快照、基于 CSS 选择器的元素截图和 PDF 导出仍不可用。
  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 还无法附加到所选浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准第一次附加提示，然后重试。如果不需要登录态，优先使用受管的 `openclaw` 配置文件。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点从 Gateway 网关宿主机不可达。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或 HTTP 端点已响应，但 CDP WebSocket 仍无法打开。
  </Accordion>
  <Accordion title="元素 / 截图 / 上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，不能使用 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要使用快照引用，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用只能发送一个上传文件。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:type` 不要传 `timeoutMs`，或者在需要自定义超时时使用受管/CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:evaluate` 不要传 `timeoutMs`，或者在需要自定义超时时使用受管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍然需要受管浏览器或原始 CDP 配置文件。
    - attach-only 或远程 CDP 配置文件上的视口 / 深色模式 / 语言区域 / 离线覆盖值过期残留 → 运行 `openclaw browser stop --browser-profile <name>` 以关闭当前活动控制会话，并释放 Playwright/CDP 仿真状态，而无需重启整个 Gateway 网关。
  </Accordion>
</AccordionGroup>

相关内容：

- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)
- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)

## 如果你升级后突然出了问题

大多数升级后的故障都来自配置漂移，或者更严格的默认值现在开始生效。

<AccordionGroup>
  <Accordion title="1. 认证和 URL 覆盖行为已改变">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    检查内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能在访问远程端，而你的本地服务实际上是正常的。
    - 显式 `--url` 调用不会回退到已存储凭证。

    常见特征：

    - `gateway connect failed:` → URL 目标错误。
    - `unauthorized` → 端点可达，但认证错误。

  </Accordion>
  <Accordion title="2. 绑定和认证护栏更严格了">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    检查内容：

    - 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享令牌/密码认证，或正确配置的非 loopback `trusted-proxy` 部署。
    - 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径。
    - `Connectivity probe: failed` 且运行时正在运行 → Gateway 网关仍存活，但以当前认证/URL 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态已变化">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    检查内容：

    - 仪表板/节点的待批准设备。
    - 策略或身份变更后的待批准私信配对。

    常见特征：

    - `device identity required` → 设备认证未满足。
    - `pairing required` → 发送方/设备必须先获得批准。

  </Accordion>
</AccordionGroup>

如果经过检查后，服务配置与运行时仍然不一致，请从同一配置文件/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [认证](/zh-CN/gateway/authentication)
- [后台执行与进程工具](/zh-CN/gateway/background-process)
- [Gateway 网关托管配对](/zh-CN/gateway/pairing)

## 相关内容

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关操作手册](/zh-CN/gateway)
