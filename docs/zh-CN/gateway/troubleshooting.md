---
read_when:
    - 故障排除中心将你引导到这里，以进行更深入的诊断
    - 你需要包含确切命令、基于稳定症状的运行手册章节
sidebarTitle: Troubleshooting
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除运行手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-30T21:18:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

此页面是深入运行手册。如果你想先走快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

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

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账户的实时传输状态，并在支持的地方显示探测/审计结果，例如 `works` 或 `audit ok`。

## 安装版本脑裂与新版配置保护

当 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制文件比最后写入 `openclaw.json` 的版本更旧时，使用此流程。

OpenClaw 会用 `meta.lastTouchedVersion` 标记配置写入。只读命令仍可检查由较新 OpenClaw 写入的配置，但进程和服务变更会拒绝从较旧的二进制文件继续执行。被阻止的操作包括 Gateway 网关服务启动、停止、重启、卸载、强制服务重装、服务模式 Gateway 网关启动，以及 `gateway --force` 端口清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    修复 `PATH`，让 `openclaw` 解析到较新的安装版本，然后重新运行该操作。
  </Step>
  <Step title="Reinstall the gateway service">
    从较新的安装版本重新安装目标 Gateway 网关服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    移除仍指向旧 `openclaw` 二进制文件的过期系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，为单个命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常运行时保持未设置。
</Warning>

## Anthropic 429 长上下文需要额外用量

当日志/错误包含：`HTTP 429: rate_limit_error: Extra usage is required for long context requests` 时，使用此流程。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找：

- 选中的 Anthropic Opus/Sonnet 模型启用了 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文使用资格。
- 请求只在需要 1M beta 路径的长会话/模型运行中失败。

修复选项：

<Steps>
  <Step title="Disable context1m">
    为该模型禁用 `context1m`，以回退到普通上下文窗口。
  </Step>
  <Step title="Use an eligible credential">
    使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API key。
  </Step>
  <Step title="Configure fallback models">
    配置备用模型，使 Anthropic 长上下文请求被拒绝时运行仍可继续。
  </Step>
</Steps>

相关：

- [Anthropic](/zh-CN/providers/anthropic)
- [令牌使用和成本](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端通过直接探测，但智能体运行失败

在以下情况使用此流程：

- `curl ... /v1/models` 正常
- 很小的直接 `/v1/chat/completions` 调用正常
- OpenClaw 模型运行只在普通智能体轮次失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查找：

- 直接的小型调用成功，但 OpenClaw 运行只在较大提示词上失败
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 正常，也出现 `model_not_found` 或 404 错误
- 后端错误指出 `messages[].content` 需要字符串
- 使用 OpenAI 兼容本地后端时，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 仅在较大的提示词令牌数或完整智能体运行时提示词下出现的后端崩溃

<AccordionGroup>
  <Accordion title="Common signatures">
    - 本地 MLX/vLLM 风格服务器出现 `model_not_found` → 确认 `baseUrl` 包含 `/v1`，对于 `/v1/chat/completions` 后端，`api` 是 `"openai-completions"`，并且 `models.providers.<provider>.models[].id` 是提供商本地的裸 ID。选择时只加一次提供商前缀，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目录条目保持为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容片段。修复：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 后端完成了 Chat Completions 请求，但没有为该轮次返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常意味着后端正在输出空内容/非文本内容，或抑制最终答案文本。
    - 直接的小型请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）→ OpenClaw 传输层很可能已经正确；后端在较大的智能体运行时提示词形态上失败。
    - 禁用工具后故障减少但并未消失 → 工具 schema 是压力的一部分，但剩余问题仍然是上游模型/服务器容量或后端 bug。

  </Accordion>
  <Accordion title="Fix options">
    1. 为仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 对无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
    3. 尽可能降低提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或具备更强长上下文支持的后端。
    4. 如果很小的直接请求持续通过，而 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并用被接受的载荷形态在那里提交复现。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道在线但没有任何响应，请先检查路由和策略，再重新连接任何内容。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

查找：

- 私信发送者的配对待处理。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组 allowlist 不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息在被提及前会被忽略。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## 仪表板控制 UI 连接

当仪表板/控制 UI 无法连接时，验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找：

- 正确的探测 URL 和仪表板 URL。
- 客户端与 Gateway 网关之间的认证模式/令牌不匹配。
- 在需要设备身份的地方使用 HTTP。

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → 非安全上下文或缺少设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 浏览器来源连接，却没有显式 allowlist）。
    - `device nonce required` / `device nonce mismatch` → 客户端没有完成基于质询的设备认证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误载荷（或过期时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可使用缓存设备令牌进行一次可信重试。
    - 该缓存令牌重试会复用与已配对设备令牌一起存储的缓存作用域集。显式 `deviceToken` / 显式 `scopes` 调用方则保留其请求的作用域集。
    - 在该重试路径之外，连接认证优先级依次为显式共享令牌/密码、显式 `deviceToken`、已存储设备令牌、引导令牌。
    - 在异步 Tailscale Serve Control UI 路径上，针对相同 `{scope, ip}` 的失败尝试会在限流器记录失败之前被串行化。因此，来自同一客户端的两个并发错误重试可能会让第二次尝试显示 `retry later`，而不是两个普通的不匹配。
    - 来自浏览器来源 loopback 客户端的 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源使用单独的桶。
    - 该重试后仍重复 `unauthorized` → 共享令牌/设备令牌漂移；刷新令牌配置，并在需要时重新批准/轮换设备令牌。
    - `gateway connect failed:` → 主机/端口/url 目标错误。

  </Accordion>
</AccordionGroup>

### 认证详细代码快速映射

使用失败 `connect` 响应中的 `error.details.code` 来选择下一步操作：

| 详细代码                     | 含义                                                                                                                                                                                      | 建议操作                                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。                                                                                                                                                            | 在客户端粘贴/设置令牌后重试。对于仪表盘路径：运行 `openclaw config get gateway.auth.token`，然后粘贴到控制 UI 设置中。                                                                                                                                                         |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。                                                                                                                                                 | 如果 `canRetryWithDeviceToken=true`，允许一次受信任的重试。缓存令牌重试会复用已存储的已批准作用域；显式使用 `deviceToken` / `scopes` 的调用方会保留请求的作用域。如果仍然失败，请运行[token 漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或被撤销。                                                                                                                                                       | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备令牌，然后重新连接。                                                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | 设备身份需要批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：先运行 `openclaw devices list`，然后运行 `openclaw devices approve <requestId>`。作用域/角色升级在你审核请求的访问权限后使用相同流程。                                                                                                                       |

<Note>
使用共享 Gateway 网关令牌/密码进行认证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备作用域基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请确认调用方使用的是 `client.id: "gateway-client"` 和 `client.mode: "backend"`，并且没有强制指定显式的 `deviceIdentity` 或设备令牌。
</Note>

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新正在连接的客户端并验证它：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关签发的 `connect.challenge`。
  </Step>
  <Step title="签署 payload">
    客户端签署绑定到 challenge 的 payload。
  </Step>
  <Step title="发送设备 nonce">
    客户端发送带有相同 challenge nonce 的 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 已配对设备令牌会话只能管理**自己的**设备，除非调用方同时拥有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已持有的 operator 作用域

相关：

- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [控制 UI](/zh-CN/web/control-ui)
- [设备](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时使用此项。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

查看：

- `Runtime: stopped` 以及退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时存在额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 网关模式未启用，或配置文件被覆盖并丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 来重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径（令牌/密码，或已配置的受信任代理）的情况下绑定到非 loopback 地址。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在陈旧或并行的 launchd/systemd/schtasks 单元。大多数设置应每台机器只保留一个 Gateway 网关；如果确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
    - Doctor 显示 `System-level OpenClaw gateway service detected` → 存在 systemd 系统单元，而用户级服务缺失。请先移除或禁用重复项，再允许 Doctor 安装用户服务；如果系统单元是预期的监督器，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的监督器仍固定使用旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 网关服务。

  </Accordion>
</AccordionGroup>

相关：

- [后台 exec 和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关恢复了最后已知良好配置

当 Gateway 网关启动但日志显示它恢复了 `openclaw.json` 时使用此项。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

查看：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 活动配置旁边带时间戳的 `openclaw.json.clobbered.*` 文件
- 以 `Config recovery warning` 开头的主智能体系统事件

<AccordionGroup>
  <Accordion title="发生了什么">
    - 被拒绝的配置在启动或热重载期间未通过验证。
    - OpenClaw 将被拒绝的 payload 保留为 `.clobbered.*`。
    - 活动配置已从最后一次验证通过的最后已知良好副本恢复。
    - 下一次主智能体轮次会收到警告，不要盲目重写被拒绝的配置。
    - 如果所有验证问题都位于 `plugins.entries.<id>...` 下，OpenClaw 不会恢复整个文件。插件本地失败会保持显眼提示，同时不相关的用户设置仍保留在活动配置中。

  </Accordion>
  <Accordion title="检查和修复">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="常见特征">
    - `.clobbered.*` 存在 → 外部直接编辑或启动读取被恢复。
    - `.rejected.*` 存在 → OpenClaw 所属的配置写入在提交前未通过 schema 或覆盖检查。
    - `Config write rejected:` → 该写入试图丢弃必需结构、显著缩小文件，或持久化无效配置。
    - `Rejected validation details:` → 恢复日志或主智能体通知包含导致恢复的 schema 路径，例如 `agents.defaults.execution` 或 `gateway.auth.password.source`。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 启动时将当前文件视为被覆盖，因为与最后已知良好备份相比，它丢失了字段或大小变小。
    - `Config last-known-good promotion skipped` → 候选配置包含经过遮蔽的密钥占位符，例如 `***`。

  </Accordion>
  <Accordion title="修复选项">
    1. 如果恢复后的活动配置正确，请保留它。
    2. 只从 `.clobbered.*` 或 `.rejected.*` 复制预期键名，然后使用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 在重启前运行 `openclaw config validate`。
    4. 如果手动编辑，请保留完整的 JSON5 配置，而不是只保留你想更改的局部对象。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/cli/config)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能连接到某个目标，但仍打印警告块时使用此项。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查看：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺失作用域或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接配置/loopback 目标。
- `multiple reachable gateways detected` → 有多个目标响应。通常这意味着有意配置了多 Gateway 网关，或存在陈旧/重复监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受作用域限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整诊断 RPC 集超时或失败。将其视为可达但诊断降级的 Gateway 网关；比较 `--json` 输出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但此客户端仍需要配对/批准后才能获得正常 operator 访问。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 此命令路径中无法为失败目标获取认证材料。

相关：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息未流动

如果渠道状态为已连接但消息流已中断，请重点关注策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查看：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 缺少渠道 API 权限/作用域。

常见特征：

- `mention required` → 消息被群组提及策略忽略。
- `pairing` / 待批准痕迹 → 发送者未获批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证/权限问题。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)
- [WhatsApp](/zh-CN/channels/whatsapp)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 未运行或未投递，请先验证调度器状态，再验证投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

查看：

- Cron 已启用，并且存在下一次唤醒。
- 任务运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器 tick 失败；检查文件/日志/运行时错误。
    - `heartbeat skipped` with `reason=quiet-hours` → 不在活跃时段窗口内。
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / Markdown 标题，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何到期任务。
    - `heartbeat: unknown accountId` → heartbeat 投递目标的账户 ID 无效。
    - `heartbeat skipped` with `reason=dm-blocked` → heartbeat 目标解析为私信式目的地，但 `agents.defaults.heartbeat.directPolicy`（或按智能体覆盖项）设置为 `block`。

  </Accordion>
</AccordionGroup>

相关：

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [定时任务：故障排除](/zh-CN/automation/cron-jobs#troubleshooting)

## 节点已配对，但工具失败

如果节点已配对但工具失败，请隔离前台、权限和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查看：

- 节点在线，并具备预期能力。
- 摄像头/麦克风/位置/屏幕的 OS 权限授权。
- Exec 批准和 allowlist 状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须处于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 阻止。

相关：

- [Exec 批准](/zh-CN/tools/exec-approvals)
- [节点故障排除](/zh-CN/nodes/troubleshooting)
- [节点](/zh-CN/nodes/index)

## 浏览器工具失败

当浏览器工具操作失败但 Gateway 网关本身健康时使用此项。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查看：

- `plugins.allow` 是否已设置并包含 `browser`。
- 有效的浏览器可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

<AccordionGroup>
  <Accordion title="插件 / 可执行文件特征">
    - `unknown command "browser"` or `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
    - browser tool missing / unavailable while `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不支持的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口错误或超出范围。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少内置浏览器插件的 `playwright-core` 运行时依赖；运行 `openclaw doctor --fix`，然后重启 Gateway 网关。ARIA 快照和基础页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到所选浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准首次附加提示，然后重试。如果不需要已登录状态，优先使用托管的 `openclaw` 配置文件。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 网关主机访问。
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或 HTTP 端点已响应但 CDP WebSocket 仍无法打开。

  </Accordion>
  <Accordion title="元素 / 截图 / 上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照 ref，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传文件。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持 timeout 覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:type` 省略 `timeoutMs`，或在需要自定义 timeout 时使用托管/CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:evaluate` 省略 `timeoutMs`，或在需要自定义 timeout 时使用托管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要托管浏览器或原始 CDP 配置文件。
    - attach-only 或远程 CDP 配置文件上的过期视口 / 深色模式 / locale / offline 覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 关闭活动控制会话并释放 Playwright/CDP 模拟状态，无需重启整个 Gateway 网关。

  </Accordion>
</AccordionGroup>

相关：

- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)
- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)

## 如果你升级后某些东西突然坏了

大多数升级后故障都是配置漂移，或现在开始强制执行更严格的默认值。

<AccordionGroup>
  <Accordion title="1. 认证和 URL 覆盖行为已更改">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要检查的内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能正在指向远程，而你的本地服务正常。
    - 显式 `--url` 调用不会回退到已存储的凭证。

    常见特征：

    - `gateway connect failed:` → URL 目标错误。
    - `unauthorized` → 端点可达，但认证错误。

  </Accordion>
  <Accordion title="2. 绑定和认证防护更严格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要检查的内容：

    - 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享令牌/密码认证，或正确配置的非 loopback `trusted-proxy` 部署。
    - `gateway.token` 等旧键不会替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径。
    - `Connectivity probe: failed` while runtime is running → Gateway 网关存活，但使用当前认证/url 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态已更改">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要检查的内容：

    - 仪表盘/节点的待处理设备批准。
    - 策略或身份更改后的待处理私信配对批准。

    常见特征：

    - `device identity required` → 设备认证未满足。
    - `pairing required` → 发送者/设备必须获批准。

  </Accordion>
</AccordionGroup>

如果检查后服务配置和运行时仍不一致，请从同一配置文件/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [认证](/zh-CN/gateway/authentication)
- [后台 exec 和进程工具](/zh-CN/gateway/background-process)
- [Gateway 网关负责的配对](/zh-CN/gateway/pairing)

## 相关

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关运行手册](/zh-CN/gateway)
