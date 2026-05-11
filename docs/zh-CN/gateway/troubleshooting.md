---
read_when:
    - 故障排除中心将你引导到这里，以便进行更深入的诊断
    - 你需要稳定的、基于症状的运行手册章节，并附上精确命令。
sidebarTitle: Troubleshooting
summary: 针对 Gateway 网关、渠道、自动化、节点和浏览器的深入故障排除运行手册
title: 故障排除
x-i18n:
    generated_at: "2026-05-11T20:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

此页面是深度运行手册。如果你想先使用快速排查流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先按此顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 未报告阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输状态，并在支持的地方显示探测/审计结果，例如 `works` 或 `audit ok`。

## 分裂安装和较新配置保护

当 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制文件旧于最后写入 `openclaw.json` 的版本时，使用此部分。

OpenClaw 会用 `meta.lastTouchedVersion` 标记配置写入。只读命令仍可检查由较新 OpenClaw 写入的配置，但进程和服务变更会拒绝从较旧的二进制文件继续。被阻止的操作包括 Gateway 网关服务启动、停止、重启、卸载、强制服务重新安装、服务模式 Gateway 网关启动，以及 `gateway --force` 端口清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修复 PATH">
    修复 `PATH`，让 `openclaw` 解析到较新的安装，然后重新运行该操作。
  </Step>
  <Step title="重新安装 Gateway 网关服务">
    从较新的安装重新安装目标 Gateway 网关服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除过时包装器">
    移除仍指向旧 `openclaw` 二进制文件的过时系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，为单个命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作时保持未设置。
</Warning>

## Skill 符号链接因路径逃逸被跳过

当日志包含以下内容时使用：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw 将每个 skill 根目录视为一个包含边界。位于
`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或
`~/.openclaw/skills` 下的符号链接，如果其真实目标解析到该根目录之外，
除非该目标被显式信任，否则会被跳过。

检查链接：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果目标是有意设置的，请同时配置直接 skill 根目录和允许的符号链接目标：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

然后启动新会话，或等待 skills 观察器刷新。如果正在运行的进程早于配置变更，
请重启 Gateway 网关。

不要使用 `~`、`/` 或整个同步项目文件夹这类宽泛目标。
将 `allowSymlinkTargets` 限定到包含受信任 `SKILL.md` 目录的真实 skill 根目录。

相关：

- [Skills 配置](/zh-CN/tools/skills-config#symlinked-sibling-repos)
- [配置示例](/zh-CN/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 长上下文需要额外用量

当日志/错误包含：`HTTP 429: rate_limit_error: Extra usage is required for long context requests` 时使用此部分。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找：

- 选中的 Anthropic Opus/Sonnet 模型带有 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文使用资格。
- 请求仅在需要 1M beta 路径的长会话/模型运行中失败。

修复选项：

<Steps>
  <Step title="禁用 context1m">
    为该模型禁用 `context1m`，以回退到普通上下文窗口。
  </Step>
  <Step title="使用符合条件的凭证">
    使用符合长上下文请求条件的 Anthropic 凭证，或切换到 Anthropic API key。
  </Step>
  <Step title="配置回退模型">
    配置回退模型，以便 Anthropic 长上下文请求被拒绝时运行仍可继续。
  </Step>
</Steps>

相关：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端可通过直接探测，但 agent 运行失败

在以下情况使用：

- `curl ... /v1/models` 可用
- 微型直接 `/v1/chat/completions` 调用可用
- OpenClaw 模型运行仅在正常 agent 轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查找：

- 直接微型调用成功，但 OpenClaw 运行仅在较大 prompt 上失败
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 可用，
  仍出现 `model_not_found` 或 404 错误
- 后端报错称 `messages[].content` 需要字符串
- 使用 OpenAI 兼容本地后端时，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 仅在较大 prompt-token 数量或完整 agent 运行时 prompt 下出现的后端崩溃

<AccordionGroup>
  <Accordion title="常见特征">
    - 本地 MLX/vLLM 风格服务器出现 `model_not_found` → 验证 `baseUrl` 包含 `/v1`，对于 `/v1/chat/completions` 后端，`api` 为 `"openai-completions"`，并且 `models.providers.<provider>.models[].id` 是裸的提供商本地 ID。选择时只加一次提供商前缀，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；保持目录条目为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容片段。修复：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或类似 `["role","content"]` 的允许消息键 → 后端拒绝 Chat Completions 消息上的 OpenAI 风格重放元数据。修复：设置 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 后端完成了 Chat Completions 请求，但该轮次没有返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常表示后端正在发出空/非文本内容，或抑制最终答案文本。
    - 直接微型请求成功，但 OpenClaw agent 运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）→ OpenClaw 传输很可能已经正确；失败的是后端无法处理更大的 agent 运行时 prompt 形态。
    - 禁用工具后故障减少但没有消失 → 工具 schema 是压力的一部分，但剩余问题仍然是上游模型/服务器容量或后端 bug。

  </Accordion>
  <Accordion title="修复选项">
    1. 对仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 对只接受每条消息上的 `role` 和 `content` 的严格 Chat Completions 后端设置 `compat.strictMessageKeys: true`。
    3. 对无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
    4. 尽可能降低 prompt 压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或使用具有更强长上下文支持的后端。
    5. 如果直接微型请求持续通过，而 OpenClaw agent 轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并在那里提交带有已接受 payload 形态的复现。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已启动但没有任何应答，请先检查路由和策略，再重新连接任何内容。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

查找：

- 私信发送者的配对处于待处理状态。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 频道/群组允许列表不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息在被提及前会被忽略。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## 仪表盘控制 UI 连接

当仪表盘/控制 UI 无法连接时，验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找：

- 正确的探测 URL 和仪表盘 URL。
- 客户端和 Gateway 网关之间的认证模式/token 不匹配。
- 在需要设备身份时使用 HTTP。

<AccordionGroup>
  <Accordion title="连接/认证特征">
    - `device identity required` → 非安全上下文或缺少设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你正在从非 loopback 浏览器源连接，且没有显式允许列表）。
    - `device nonce required` / `device nonce mismatch` → 客户端未完成基于挑战的设备认证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误 payload（或过期时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以用缓存的设备 token 执行一次受信任重试。
    - 该缓存 token 重试会复用与配对设备 token 一起存储的缓存 scope 集。显式 `deviceToken` / 显式 `scopes` 调用方会保留其请求的 scope 集。
    - `AUTH_SCOPE_MISMATCH` → 设备 token 已被识别，但其已批准 scope 不覆盖此次连接请求；重新配对或批准请求的 scope 契约，而不是轮换共享 Gateway 网关 token。
    - 在该重试路径之外，连接认证优先级是先显式共享 token/password，再显式 `deviceToken`，再已存储设备 token，最后 bootstrap token。
    - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在限流器记录失败之前被串行化。因此，同一客户端的两次错误并发重试可能会让第二次尝试显示 `retry later`，而不是两个普通不匹配。
    - 浏览器源 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 源会使用独立的桶。
    - 该重试后仍重复出现 `unauthorized` → 共享 token/设备 token 漂移；刷新 token 配置，并在需要时重新批准/轮换设备 token。
    - `gateway connect failed:` → 主机/端口/url 目标错误。

  </Accordion>
</AccordionGroup>

### 认证详情代码快速映射

使用失败 `connect` 响应中的 `error.details.code` 来选择下一步操作：

| 详细代码                     | 含义                                                                                                                                                                                      | 建议操作                                                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。                                                                                                                                                              | 在客户端中粘贴/设置令牌，然后重试。对于仪表盘路径：先运行 `openclaw config get gateway.auth.token`，再粘贴到控制 UI 设置中。                                                                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。                                                                                                                                                   | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。缓存令牌重试会复用已存储的已批准作用域；显式 `deviceToken` / `scopes` 调用方会保留请求的作用域。如果仍然失败，请运行 [令牌漂移恢复清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的按设备令牌已过期或已被撤销。                                                                                                                                                        | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备令牌，然后重新连接。                                                                                                                                                                                                                            |
| `AUTH_SCOPE_MISMATCH`        | 设备令牌有效，但其已批准的角色/作用域不覆盖此连接请求。                                                                                                                                   | 重新配对设备，或批准请求的作用域合约；不要将其视为共享令牌漂移。                                                                                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | 设备身份需要批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：先运行 `openclaw devices list`，再运行 `openclaw devices approve <requestId>`。作用域/角色升级会在你审核所请求的访问权限后使用同一流程。                                                                                                                                            |

<Note>
使用共享 Gateway 网关令牌/密码认证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备作用域基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请确认调用方正在使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，并且没有强制指定显式 `deviceIdentity` 或设备令牌。
</Note>

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，请更新连接客户端并验证它：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关发出的 `connect.challenge`。
  </Step>
  <Step title="签署载荷">
    客户端签署与质询绑定的载荷。
  </Step>
  <Step title="发送设备 nonce">
    客户端使用同一个质询 nonce 发送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 已配对设备令牌会话只能管理**自己的**设备，除非调用方同时拥有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已经持有的 operator 作用域

相关内容：

- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [控制 UI](/zh-CN/web/control-ui)
- [设备](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

在服务已安装但进程无法持续运行时使用此项。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

查找：

- 带退出提示的 `Runtime: stopped`。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时出现额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 网关模式未启用，或配置文件被覆盖并丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 来重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径（令牌/密码，或已配置的可信代理）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上只保留一个 Gateway 网关；如果确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
    - Doctor 输出 `System-level OpenClaw gateway service detected` → 存在 systemd 系统单元，而用户级服务缺失。在允许 Doctor 安装用户服务之前，移除或禁用重复项；如果该系统单元是预期的 supervisor，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的 supervisor 仍固定旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 网关服务。

  </Accordion>
</AccordionGroup>

相关内容：

- [后台 exec 和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关拒绝无效配置

当 Gateway 网关启动因 `Invalid config` 失败，或热重载日志表示已跳过无效编辑时，使用此项。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

查找：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 活动配置旁带时间戳的 `openclaw.json.rejected.*` 文件
- 如果 `doctor --fix` 修复了损坏的直接编辑，则会有带时间戳的 `openclaw.json.clobbered.*` 文件

<AccordionGroup>
  <Accordion title="发生了什么">
    - 配置在启动、热重载或 OpenClaw 拥有的写入期间未通过验证。
    - Gateway 网关启动以失败关闭方式终止，而不是重写 `openclaw.json`。
    - 热重载会跳过无效的外部编辑，并保持当前运行时配置处于活动状态。
    - OpenClaw 拥有的写入会在提交前拒绝无效/破坏性载荷，并保存 `.rejected.*`。
    - `openclaw doctor --fix` 负责修复。它可以移除非 JSON 前缀，或恢复最后已知良好的副本，同时将被拒绝的载荷保留为 `.clobbered.*`。

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
    - `.clobbered.*` 存在 → Doctor 在修复活动配置时保留了损坏的外部编辑。
    - `.rejected.*` 存在 → OpenClaw 拥有的配置写入在提交前未通过 schema 或覆盖检查。
    - `Config write rejected:` → 写入试图丢弃必需结构、大幅缩小文件，或持久化无效配置。
    - `config reload skipped (invalid config):` → 直接编辑未通过验证，并被正在运行的 Gateway 网关忽略。
    - `Invalid config at ...` → 启动在 Gateway 网关服务启动前失败。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 拥有的写入因相较最后已知良好备份丢失字段或大小而被拒绝。
    - `Config last-known-good promotion skipped` → 候选内容包含已脱敏的密钥占位符，例如 `***`。

  </Accordion>
  <Accordion title="修复选项">
    1. 运行 `openclaw doctor --fix`，让 Doctor 修复带前缀/被覆盖的配置，或恢复最后已知良好配置。
    2. 仅从 `.clobbered.*` 或 `.rejected.*` 复制预期键名，然后使用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 重启前运行 `openclaw config validate`。
    4. 如果手动编辑，请保留完整 JSON5 配置，而不是只保留你想更改的局部对象。
  </Accordion>
</AccordionGroup>

相关内容：

- [配置](/zh-CN/cli/config)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能够访问到某些目标，但仍打印警告块时，使用此项。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查找：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否关于 SSH 回退、多个 Gateway 网关、缺失作用域或未解析的认证引用。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接配置目标/loopback 目标。
- `multiple reachable gateways detected` → 多个目标给出了响应。通常这意味着有意的多 Gateway 网关设置，或存在过期/重复的监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受作用域限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整诊断 RPC 集合超时或失败。将其视为可访问但诊断能力降级的 Gateway 网关；对比 `--json` 输出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但此客户端在正常 operator 访问前仍需要配对/批准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 此命令路径无法为失败目标取得认证材料。

相关内容：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 频道已连接，但消息未流动

如果频道状态为已连接但消息流已停止，请重点检查策略、权限和频道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

检查：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组允许列表和提及要求。
- 缺少频道 API 权限/作用域。

常见特征：

- `mention required` → 消息被群组提及策略忽略。
- `pairing` / 待批准跟踪 → 发送者未获批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 频道认证/权限问题。

相关：

- [频道故障排除](/zh-CN/channels/troubleshooting)
- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)
- [WhatsApp](/zh-CN/channels/whatsapp)

## Cron 和 Heartbeat 投递

如果 cron 或 Heartbeat 未运行或未投递，请先验证调度器状态，然后验证投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查：

- Cron 已启用并且存在下一次唤醒。
- 任务运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器计时器 tick 失败；检查文件/日志/运行时错误。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 处于活跃时间窗口之外。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / markdown 标题，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但此 tick 没有到期任务。
    - `heartbeat: unknown accountId` → Heartbeat 投递目标的账号 ID 无效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → Heartbeat 目标解析为私信风格目标，而 `agents.defaults.heartbeat.directPolicy`（或每个智能体的覆盖配置）设置为 `block`。

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

检查：

- 节点在线并具备预期能力。
- 相机/麦克风/位置/屏幕的 OS 权限授予。
- Exec 批准和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须在前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

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

检查：

- `plugins.allow` 是否已设置并包含 `browser`。
- 有效的浏览器可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
    - 浏览器工具缺失 / 不可用且 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口错误或超出范围。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少核心浏览器运行时依赖；重新安装或更新 OpenClaw，然后重启 Gateway 网关。ARIA 快照和基本页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到所选浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准首次附加提示，然后重试。如果不需要已登录状态，优先使用托管的 `openclaw` 配置文件。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 网关主机访问。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或 HTTP 端点已响应但 CDP WebSocket 仍无法打开。

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照引用，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:type` 省略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:evaluate` 省略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要托管浏览器或原始 CDP 配置文件。
    - 附加-only 或远程 CDP 配置文件上的过期视口 / 深色模式 / 语言区域 / 离线覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 以关闭活动控制会话，并释放 Playwright/CDP 仿真状态，而无需重启整个 Gateway 网关。

  </Accordion>
</AccordionGroup>

相关：

- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)
- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)

## 如果你升级后某些内容突然损坏

大多数升级后的故障来自配置漂移，或现在被强制执行的更严格默认值。

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要检查的内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能会指向远程，而你的本地服务是正常的。
    - 显式 `--url` 调用不会回退到已存储的凭证。

    常见特征：

    - `gateway connect failed:` → URL 目标错误。
    - `unauthorized` → 端点可达但认证错误。

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要检查的内容：

    - 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享 token/密码认证，或正确配置的非 loopback `trusted-proxy` 部署。
    - `gateway.token` 等旧键不会替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径。
    - `Connectivity probe: failed` 且运行时正在运行 → Gateway 网关存活，但使用当前认证/url 无法访问。

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要检查的内容：

    - dashboard/nodes 的待处理设备批准。
    - 策略或身份变更后的待处理私信配对批准。

    常见特征：

    - `device identity required` → 设备认证未满足。
    - `pairing required` → 发送者/设备必须获批。

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
- [Gateway 网关拥有的配对](/zh-CN/gateway/pairing)

## 相关

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关运行手册](/zh-CN/gateway)
