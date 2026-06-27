---
read_when:
    - 故障排除中心将你引导到这里，以便进行更深入的诊断
    - 你需要包含精确命令的稳定症状式运行手册章节
sidebarTitle: Troubleshooting
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除运行手册
title: 故障排除
x-i18n:
    generated_at: "2026-06-27T02:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

本页是深度运行手册。如果你想先使用快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

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
- `openclaw doctor` 未报告阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输状态，并在支持的位置显示探测/审计结果，例如 `works` 或 `audit ok`。

## 更新之后

当更新完成但 Gateway 网关停机、渠道为空，或模型调用开始因 401 失败时，使用本节。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

查看：

- `openclaw status` / `openclaw status --all` 中的 `Update restart`。待处理或失败的交接会包含下一条要运行的命令。
- Channels 下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。这表示渠道配置仍然存在，但插件注册在渠道加载前失败了。
- 重新认证后的提供商 401。`openclaw doctor --fix` 会检查过期的按 Agent 配置的 OAuth 凭证影子副本，并移除旧副本，让所有智能体都解析到当前共享配置文件。

## 分裂安装和较新配置保护

当 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制比最后写入 `openclaw.json` 的版本更旧时，使用本节。

OpenClaw 会用 `meta.lastTouchedVersion` 标记配置写入。只读命令仍然可以检查由较新 OpenClaw 写入的配置，但进程和服务变更会拒绝从较旧二进制继续执行。被阻止的操作包括 Gateway 网关服务启动、停止、重启、卸载、强制服务重装、服务模式 Gateway 网关启动，以及 `gateway --force` 端口清理。

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
  <Step title="移除过期包装器">
    移除仍指向旧 `openclaw` 二进制的过期系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，为单条命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作时保持未设置。
</Warning>

## 回滚后的协议不匹配

当你降级或回滚 OpenClaw 后，日志持续打印 `protocol mismatch` 时，使用本节。这表示较旧的 Gateway 网关正在运行，但较新的本地客户端进程仍试图用旧 Gateway 网关无法理解的协议范围重新连接。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

查看：

- Gateway 网关日志中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:`，或 `openclaw doctor --deep` 中的 `Gateway clients`。这会列出连接到 Gateway 网关端口的活动 TCP 客户端，包括在操作系统允许时显示 PID 和命令行。
- 命令行指向你回滚前那个较新 OpenClaw 安装或包装器的客户端进程。

修复：

1. 停止或重启 `gateway status --deep` 显示的过期 OpenClaw 客户端进程。
2. 重启嵌入 OpenClaw 的应用或包装器，例如本地仪表板、编辑器、应用服务器助手，或长时间运行的 `openclaw logs --follow` shell。
3. 重新运行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，确认过期客户端 PID 已消失。

不要让较旧的 Gateway 网关接受较新的不兼容协议。协议升级用于保护线路契约；回滚恢复是进程/版本清理问题。

## 因路径逃逸跳过 Skills 符号链接

当日志包含以下内容时，使用本节：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw 将每个 skill 根目录视为包含边界。当 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符号链接真实目标解析到该根目录之外时，除非该目标被显式信任，否则会被跳过。

检查该链接：

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

然后启动新会话，或等待 Skills 监视器刷新。如果运行中的进程早于配置变更，请重启 Gateway 网关。

不要使用 `~`、`/` 或整个同步项目文件夹这类宽泛目标。将 `allowSymlinkTargets` 限定到包含受信任 `SKILL.md` 目录的真实 skill 根目录。

如果 Skill Workshop apply 也应通过这些受信任的符号链接工作区 skill 路径写入，请启用 `skills.workshop.allowSymlinkTargetWrites`。对于只读共享 skill 根目录，请保持禁用。

相关：

- [Skills 配置](/zh-CN/tools/skills-config#symlinked-skill-roots)
- [配置示例](/zh-CN/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429：长上下文需要额外用量

当日志/错误包含：`HTTP 429: rate_limit_error: Extra usage is required for long context requests` 时，使用本节。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查看：

- 所选 Anthropic 模型是支持 GA 的 1M Claude 4.x 模型，或该模型具有旧版 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文用量资格。
- 请求只在需要 1M 上下文路径的长会话/模型运行中失败。

修复选项：

<Steps>
  <Step title="使用标准上下文窗口">
    切换到标准窗口模型，或从不具备 1M 上下文 GA 能力的旧模型配置中移除旧版 `context1m`。
  </Step>
  <Step title="使用具备资格的凭证">
    使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API key。
  </Step>
  <Step title="配置回退模型">
    配置回退模型，让运行在 Anthropic 长上下文请求被拒绝时仍能继续。
  </Step>
</Steps>

相关：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和费用](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 拦截响应

当上游 LLM 提供商返回泛化的 `403`，例如 `Your request was blocked` 时，使用本节。

不要假设这一定是 OpenClaw 配置问题。该响应可能来自上游安全层，例如 CDN、WAF、机器人管理规则，或 OpenAI 兼容端点前面的反向代理。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

查看：

- 同一提供商下多个模型以相同方式失败
- 返回 HTML 或泛化安全文本，而不是正常的提供商 API 错误
- 同一请求时间对应的提供商侧安全事件
- 微型直接 `curl` 探测成功，但正常 SDK 形态的请求失败

当证据指向 WAF/CDN 拦截时，先修复提供商侧过滤。优先为 OpenClaw 使用的 API 路径设置窄范围允许或跳过规则，并避免为整个站点禁用保护。

<Warning>
最小化 `curl` 成功并不保证真实 SDK 风格请求会通过同一个上游安全层。
</Warning>

相关：

- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)
- [提供商配置](/zh-CN/providers)
- [日志](/zh-CN/logging)

## 本地 OpenAI 兼容后端通过直接探测，但 Agent 运行失败

在以下情况使用本节：

- `curl ... /v1/models` 可用
- 微型直接 `/v1/chat/completions` 调用可用
- OpenClaw 模型运行只在正常 Agent 轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查看：

- 直接微型调用成功，但 OpenClaw 运行只在较大提示词上失败
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 id 可用，仍出现 `model_not_found` 或 404 错误
- 关于 `messages[].content` 需要字符串的后端错误
- 使用 OpenAI 兼容本地后端时，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 只在更大的提示词 token 数量或完整 Agent Runtimes 提示词中出现的后端崩溃

<AccordionGroup>
  <Accordion title="常见特征">
    - 本地 MLX/vLLM 风格服务器出现 `model_not_found` → 确认 `baseUrl` 包含 `/v1`，对于 `/v1/chat/completions` 后端，`api` 为 `"openai-completions"`，并且 `models.providers.<provider>.models[].id` 是提供商本地的裸 id。选择时加一次提供商前缀，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；保持目录条目为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容片段。修复：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允许的消息键如 `["role","content"]` → 后端拒绝 Chat Completions 消息上的 OpenAI 风格重放元数据。修复：设置 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 后端完成了 Chat Completions 请求，但没有为该轮返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常表示后端正在发出空内容/非文本内容，或抑制最终答案文本。
    - 直接微型请求成功，但 OpenClaw Agent 运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）→ OpenClaw 传输很可能已经正确；问题是后端在较大的 Agent Runtimes 提示词形态上失败。
    - 禁用工具后失败减少但未消失 → 工具 schema 是压力的一部分，但剩余问题仍然是上游模型/服务器容量或后端错误。

  </Accordion>
  <Accordion title="修复选项">
    1. 为仅接受字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 为严格的 Chat Completions 后端设置 `compat.strictMessageKeys: true`，这类后端在每条消息上只接受 `role` 和 `content`。
    3. 对无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
    4. 尽可能降低提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或使用具备更强长上下文支持的后端。
    5. 如果微型直接请求持续通过，而 OpenClaw Agent 轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并用已接受的 payload 形态在上游提交复现。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [OpenAI-compatible endpoints](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已启动但没有任何响应，请先检查路由和策略，再重新连接任何内容。

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
- 渠道/群组 allowlist 不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息会被忽略，直到被提及。
- `pairing request` → 发送者需要审批。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## Dashboard 控制 UI 连接性

当 dashboard/Control UI 无法连接时，验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找：

- 正确的探测 URL 和 dashboard URL。
- 客户端与 Gateway 网关之间的认证模式/token 不匹配。
- 在需要设备身份的地方使用了 HTTP。

如果更新后本地浏览器无法连接到 `127.0.0.1:18789`，请先
恢复本地 Gateway 网关服务，并确认它正在提供 dashboard：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 返回 OpenClaw HTML，则 Gateway 网关正在工作，剩余问题
可能是浏览器缓存、旧的深层链接或过期标签页状态。直接打开
`http://127.0.0.1:18789`，并从 dashboard 导航。如果重启后
服务没有保持运行，请运行 `openclaw gateway start`，然后重新检查
`openclaw gateway status`。

<AccordionGroup>
  <Accordion title="连接 / 认证特征">
    - `device identity required` → 非安全上下文或缺少设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 浏览器来源连接，且没有显式 allowlist）。
    - `device nonce required` / `device nonce mismatch` → 客户端未完成基于 challenge 的设备认证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的 payload（或使用了过期时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备 token 执行一次受信任重试。
    - 该缓存 token 重试会复用与已配对设备 token 一起存储的缓存 scope 集合。显式 `deviceToken` / 显式 `scopes` 调用方会保留其请求的 scope 集合。
    - `AUTH_SCOPE_MISMATCH` → 设备 token 已被识别，但其已批准的 scope 未覆盖此连接请求；请重新配对或批准请求的 scope contract，而不是轮换共享 gateway token。
    - 在该重试路径之外，连接认证优先级为：先显式共享 token/password，然后显式 `deviceToken`，再存储的设备 token，最后 bootstrap token。
    - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在 limiter 记录失败之前被串行化。因此，来自同一客户端的两次并发错误重试，第二次可能显示 `retry later`，而不是两个普通不匹配。
    - 浏览器来源 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源使用单独的桶。
    - 该重试后仍重复出现 `unauthorized` → 共享 token/设备 token 发生漂移；刷新 token 配置，并在需要时重新批准/轮换设备 token。
    - `gateway connect failed:` → host/port/url 目标错误。

  </Accordion>
</AccordionGroup>

### 认证详情代码快速映射

使用失败 `connect` 响应中的 `error.details.code` 选择下一步操作：

| 详情代码                  | 含义                                                                                                                                                                                      | 推荐操作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送必需的共享 token。                                                                                                                                                 | 在客户端中粘贴/设置 token 并重试。对于 dashboard 路径：先运行 `openclaw config get gateway.auth.token`，然后粘贴到 Control UI 设置中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共享 token 与 Gateway 网关认证 token 不匹配。                                                                                                                                               | 如果 `canRetryWithDeviceToken=true`，允许一次受信任重试。缓存 token 重试会复用已存储的已批准 scope；显式 `deviceToken` / `scopes` 调用方会保留请求的 scope。如果仍失败，请运行 [token 漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的按设备 token 已过期或被撤销。                                                                                                                                                 | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备 token，然后重新连接。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 设备 token 有效，但其已批准的角色/scope 未覆盖此连接请求。                                                                                                       | 重新配对设备，或批准请求的 scope contract；不要将此视为共享 token 漂移。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 设备身份需要审批。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：先运行 `openclaw devices list`，再运行 `openclaw devices approve <requestId>`。Scope/角色升级在你审核请求的访问权限后使用相同流程。                                                                                                               |

<Note>
使用共享 gateway token/password 认证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备 scope 基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请验证调用方使用的是 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且没有强制指定显式 `deviceIdentity` 或设备 token。
</Note>

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新正在连接的客户端并验证：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关发出的 `connect.challenge`。
  </Step>
  <Step title="签署 payload">
    客户端签署绑定 challenge 的 payload。
  </Step>
  <Step title="发送设备 nonce">
    客户端发送带有相同 challenge nonce 的 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 已配对设备 token 会话只能管理**自己的**设备，除非调用方还拥有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已经持有的 operator scope

相关：

- [配置](/zh-CN/gateway/configuration)（gateway 认证模式）
- [Control UI](/zh-CN/web/control-ui)
- [设备](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

当服务已安装但进程无法保持运行时使用此项。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 同时扫描系统级服务
```

查找：

- `Runtime: stopped` 及退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时出现额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 gateway 模式未启用，或配置文件被覆盖并丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 来重新标记预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径（token/password，或已配置的 trusted-proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上保留一个 Gateway 网关；如果确实需要多个，请隔离端口 + 配置/state/workspace。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
    - Doctor 报告 `System-level OpenClaw gateway service detected` → 存在 systemd 系统单元，而用户级服务缺失。在允许 Doctor 安装用户服务之前，移除或禁用重复项；如果系统单元是预期的 supervisor，则设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的 supervisor 仍固定旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 网关服务。

  </Accordion>
</AccordionGroup>

相关：

- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## macOS gateway 默默停止响应，然后在你触碰 dashboard 时恢复

当 macOS 主机上的渠道（Telegram、WhatsApp 等）一次安静数分钟到数小时，并且 Gateway 网关似乎在你打开 Control UI、通过 SSH 登录或以其他方式与主机交互时立刻恢复，请使用此项。`openclaw status` 中通常没有明显症状，因为等你查看时 Gateway 网关已经再次存活。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

查找：

- `~/.openclaw/logs/stability/` 中一个或多个 `*-uncaught_exception.json` bundle，其中 `error.code` 设置为瞬时网络代码，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 中类似 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)` 的行，并且与崩溃时间戳对齐。Power Nap / Maintenance Sleep 会短暂地把 Wi-Fi 驱动置为状态 0；任何落在这个窗口内的出站 `connect()` 都可能以 `ENETDOWN` 失败，即使主机在其他时候网络连接完全正常。
- `launchctl print` 输出显示 `state = not running`，并带有多个最近的 `runs` 和退出代码，尤其是崩溃到下一次启动之间的间隔接近一小时而不是几秒时。macOS launchd 在连续崩溃后会应用一个未公开文档的重生保护门槛，可能停止遵守 `KeepAlive=true`，直到交互式登录、仪表盘连接或 `launchctl kickstart` 等外部触发重新武装它。

常见特征：

- 稳定性 bundle 的 `error.code` 是 `ENETDOWN` 或同类代码，调用栈指向 Node `net` `lookupAndConnect` / `Socket.connect`。OpenClaw `2026.5.26` 及更新版本会将这些归类为良性的瞬时网络错误，因此它们不再传播到顶层未捕获处理器；如果你使用的是更旧版本，请先升级。
- 长时间静默期会在你连接到 Control UI 或通过 SSH 登录主机的瞬间结束：重新武装 launchd 重生门槛的是用户可见活动，而不是仪表盘对 Gateway 网关做了什么。
- `runs` 计数在一天中递增，但 `~/Library/Logs/openclaw/gateway.log` 中没有对应的 `received SIG*; shutting down` 行：干净关闭会记录信号；瞬时崩溃不会。

处理方式：

1. 如果你运行的是 `2026.5.26` 之前的版本，**升级 Gateway 网关**。升级后，未来的 `ENETDOWN` 错误会作为警告记录，而不是终止进程。
2. 在计划作为常开服务器运行的 Mac mini / 桌面主机上，**减少维护睡眠活动**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   这会显著减少但不能完全消除底层驱动抖动。无论这些标志如何设置，系统仍可能为了 TCP keepalive 和 mDNS 维护执行某些维护睡眠。

3. **添加存活 watchdog**，这样未来被 launchd 停住的连续崩溃可以被快速发现：

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重点是从外部重新武装重生门槛；在 macOS 上，连续崩溃后仅靠 `KeepAlive=true` 并不足够。

相关：

- [macOS 平台说明](/zh-CN/platforms/macos)
- [日志](/zh-CN/logging)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关在高内存使用期间退出

当 Gateway 网关在负载下消失、supervisor 报告类似 OOM 的重启，或日志提到 `critical memory pressure bundle written` 时使用本节。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

查找：

- 最新稳定性 bundle 中的 `Reason: diagnostic.memory.pressure.critical`。
- 带有 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth` 的 `Memory pressure:`。
- 接近堆限制的 `V8 heap:` 值。
- `Largest session files:` 条目，例如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 当 Gateway 网关运行在容器或受内存限制的服务中时，Linux cgroup 内存计数器。

常见特征：

- `critical memory pressure bundle written` 在重启前不久出现 → OpenClaw 捕获了一个 OOM 前稳定性 bundle。使用 `openclaw gateway stability --bundle latest` 检查它。
- Gateway 网关日志中出现 `memory pressure: level=critical ... memoryPressureSnapshot=disabled` → OpenClaw 检测到严重内存压力，但 OOM 前稳定性快照处于关闭状态。
- `Largest session files:` 指向一个非常大的已脱敏 transcript 路径 → 减少保留的会话历史，检查会话增长，或在重启前将旧 transcript 移出活动存储。
- `V8 heap:` 已用字节接近堆限制 → 降低 prompt/会话压力，减少并发工作，或仅在确认工作负载符合预期后提高 Node 堆限制。
- `Memory pressure: critical/rss_growth` → 内存在一个采样窗口内快速增长。检查最新日志中是否有大型导入、失控工具输出、重复重试，或一批排队的 agent 工作。
- 日志中出现严重内存压力但不存在 bundle → 这是默认行为。设置 `diagnostics.memoryPressureSnapshot: true`，以便在未来的严重内存压力事件中捕获 OOM 前稳定性 bundle。

稳定性 bundle 不包含 payload。它包含运维内存证据和已脱敏的相对文件路径，不包含消息文本、webhook body、凭证、token、cookie 或原始会话 id。向 bug 报告附加诊断导出，而不是复制原始日志。

相关：

- [Gateway 健康](/zh-CN/gateway/health)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [会话](/zh-CN/cli/sessions)

## Gateway 网关拒绝了无效配置

当 Gateway 网关启动因 `Invalid config` 失败，或热重载日志显示跳过了无效编辑时使用本节。

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
- 活动配置旁边带时间戳的 `openclaw.json.rejected.*` 文件
- 如果 `doctor --fix` 修复了损坏的直接编辑，则查找带时间戳的 `openclaw.json.clobbered.*` 文件
- OpenClaw 会为每个配置路径保留最新 32 个 `.clobbered.*` 文件，并轮转更旧的文件

<AccordionGroup>
  <Accordion title="发生了什么">
    - 配置在启动、热重载或 OpenClaw 所有的写入期间未通过验证。
    - Gateway 网关启动会失败关闭，而不是重写 `openclaw.json`。
    - 热重载会跳过无效的外部编辑，并保持当前运行时配置生效。
    - OpenClaw 所有的写入会在提交前拒绝无效/破坏性 payload，并保存 `.rejected.*`。
    - `openclaw doctor --fix` 负责修复。它可以移除非 JSON 前缀，或恢复最后已知良好的副本，同时将被拒绝的 payload 保留为 `.clobbered.*`。
    - 当同一配置路径发生多次修复时，OpenClaw 会轮转更旧的 `.clobbered.*` 文件，确保最新修复的 payload 仍然可用。

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
    - `.clobbered.*` 存在 → Doctor 在修复活动配置时保留了损坏的外部编辑。
    - `.rejected.*` 存在 → OpenClaw 所有的配置写入在提交前未通过 schema 或 clobber 检查。
    - `Config write rejected:` → 写入尝试丢弃必需形状、明显缩小文件，或持久化无效配置。
    - `config reload skipped (invalid config):` → 直接编辑未通过验证，并被正在运行的 Gateway 网关忽略。
    - `Invalid config at ...` → Gateway 网关服务启动前启动失败。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 所有的写入被拒绝，因为它相较于最后已知良好的备份丢失了字段或大小。
    - `Config last-known-good promotion skipped` → 候选内容包含已脱敏的 secret 占位符，例如 `***`。

  </Accordion>
  <Accordion title="修复选项">
    1. 运行 `openclaw doctor --fix`，让 Doctor 修复带前缀/clobbered 的配置，或恢复最后已知良好配置。
    2. 仅从 `.clobbered.*` 或 `.rejected.*` 复制你想要的键，然后用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 重启前运行 `openclaw config validate`。
    4. 如果你手动编辑，请保留完整 JSON5 配置，而不是只保留你想更改的部分对象。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/cli/config)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关 probe 警告

当 `openclaw gateway probe` 到达了某个目标，但仍打印警告块时使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查找：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否涉及 SSH fallback、多个 Gateway 网关、缺少 scope 或未解析的 auth ref。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接配置/loopback 目标。
- `multiple reachable gateway identities detected` → 不同 Gateway 网关做出了响应，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关。指向同一 Gateway 网关的 SSH tunnel、proxy URL 或已配置 remote URL 会被视为一个带有多个 transport 的 Gateway 网关，即使 transport 端口不同。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受 scope 限制；配对设备身份，或使用带有 `operator.read` 的凭证。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整诊断 RPC 集超时或失败。将其视为可达但诊断降级的 Gateway 网关；对比 `--json` 输出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关做出了响应，但此客户端在获得正常 operator 访问前仍需要配对/审批。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 对失败目标而言，此命令路径中无法获取 auth 材料。

相关：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息未流动

如果渠道状态为已连接但消息流已停止，请聚焦策略、权限和渠道特定投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查找：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 缺失的渠道 API 权限/scope。

常见特征：

- `mention required` → 消息被群组提及策略忽略。
- `pairing` / 待审批 trace → 发送者未被批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道 auth/权限问题。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)
- [WhatsApp](/zh-CN/channels/whatsapp)

## Cron 和 Heartbeat 投递

如果 cron 或 Heartbeat 未运行或未投递，请先验证 scheduler 状态，然后验证投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查：

- cron 已启用，并且存在下一次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器 tick 失败；检查文件、日志或运行时错误。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 不在活动时间窗口内。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白、注释、标题、围栏或空清单脚手架，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有到期任务。
    - `heartbeat: unknown accountId` → Heartbeat 投递目标的账号 ID 无效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → Heartbeat 目标解析为私信样式的目的地，而 `agents.defaults.heartbeat.directPolicy`（或按智能体覆盖项）设置为 `block`。

  </Accordion>
</AccordionGroup>

相关：

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [定时任务：故障排除](/zh-CN/automation/cron-jobs#troubleshooting)

## 节点已配对，但工具失败

如果节点已配对但工具失败，请隔离前台、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查：

- 节点在线，并具备预期能力。
- 摄像头、麦克风、位置、屏幕的操作系统权限授权。
- Exec 审批和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关：

- [Exec 审批](/zh-CN/tools/exec-approvals)
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
- 浏览器可执行文件路径是否有效。
- CDP 配置文件是否可达。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

<AccordionGroup>
  <Accordion title="插件 / 可执行文件特征">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
    - 浏览器工具缺失 / 不可用，但 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的方案，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 包含错误或超出范围的端口。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少核心浏览器运行时依赖；重新安装或更新 OpenClaw，然后重启 Gateway 网关。ARIA 快照和基础页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到所选浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准第一次附加提示，然后重试。如果不需要登录状态，优先使用托管的 `openclaw` 配置文件。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 网关主机访问。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或 HTTP 端点已响应但 CDP WebSocket 仍无法打开。

  </Accordion>
  <Accordion title="元素 / 截图 / 上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照引用，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:type` 省略 `timeoutMs`，或在需要自定义超时时使用托管 / CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:evaluate` 省略 `timeoutMs`，或在需要自定义超时时使用托管 / CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要托管浏览器或原始 CDP 配置文件。
    - 仅附加或远程 CDP 配置文件上的过期视口 / 深色模式 / 语言区域 / 离线覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 关闭活动控制会话，并释放 Playwright/CDP 模拟状态，而无需重启整个 Gateway 网关。

  </Accordion>
</AccordionGroup>

相关：

- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)
- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)

## 如果你升级后某些内容突然损坏

大多数升级后故障都是配置漂移，或更严格的默认值现在开始被执行。

<AccordionGroup>
  <Accordion title="1. 凭证和 URL 覆盖行为已更改">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    检查内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能正在指向远程，而你的本地服务是正常的。
    - 显式 `--url` 调用不会回退到已存储的凭据。

    常见特征：

    - `gateway connect failed:` → URL 目标错误。
    - `unauthorized` → 端点可达，但凭证错误。

  </Accordion>
  <Accordion title="2. 绑定和凭证护栏更严格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    检查内容：

    - 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关凭证路径：共享令牌 / 密码凭证，或正确配置的非 loopback `trusted-proxy` 部署。
    - `gateway.token` 等旧键不会替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关凭证路径。
    - `Connectivity probe: failed` 且运行时正在运行 → Gateway 网关存活，但使用当前凭证 / URL 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态已更改">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    检查内容：

    - 面板 / 节点的待处理设备审批。
    - 策略或身份变更后的待处理私信配对审批。

    常见特征：

    - `device identity required` → 设备凭证未满足。
    - `pairing required` → 发送者 / 设备必须获批。

  </Accordion>
</AccordionGroup>

如果检查后服务配置和运行时仍不一致，请从同一配置文件 / 状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [身份验证](/zh-CN/gateway/authentication)
- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [Gateway 网关拥有的配对](/zh-CN/gateway/pairing)

## 相关

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关运行手册](/zh-CN/gateway)
