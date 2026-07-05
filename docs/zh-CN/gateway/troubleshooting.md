---
read_when:
    - 故障排除中心将你引导到这里，以进行更深入的诊断
    - 你需要包含精确命令、基于稳定症状的运行手册章节
sidebarTitle: Troubleshooting
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排查运行手册
title: 故障排查
x-i18n:
    generated_at: "2026-07-05T11:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1975522afa7eada6b79e7ea4b117e645b0273b506ecf2e071542d820555adff0
    source_path: gateway/troubleshooting.md
    workflow: 16
---

这是深度运行手册。先从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始，走快速分诊流程。

## 命令阶梯

按此顺序运行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 未报告阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输状态，并在支持时显示 `works` 或 `audit ok`。

## 更新后

用于更新完成但 Gateway 网关 宕机、渠道为空，或模型调用因 401 失败的情况。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

查找：

- `openclaw status` / `openclaw status --all` 中的 `Update restart`。待处理或失败的交接会包含下一条要运行的命令。
- Channels 下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：渠道配置仍然存在，但插件注册在渠道加载前失败。
- 重新认证后的提供商 401：`openclaw doctor --fix` 会检查过期的按智能体 OAuth 凭证影子，并移除旧副本，让所有智能体解析到当前共享配置文件。

## 分裂安装和新版配置防护

用于 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制文件比上次写入 `openclaw.json` 的版本更旧的情况。

OpenClaw 会用 `meta.lastTouchedVersion` 标记配置写入。只读命令可以检查由新版 OpenClaw 写入的配置，但进程和服务变更会拒绝从旧版二进制文件运行。被阻止的操作包括：Gateway 网关服务启动/停止/重启/卸载、强制重装服务、服务模式 Gateway 网关启动，以及 `gateway --force` 端口清理。

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
  <Step title="重装 Gateway 网关服务">
    从较新的安装重装目标 Gateway 网关服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除过期包装器">
    移除仍指向旧 `openclaw` 二进制文件的过期系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，为单条命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作时保持未设置。
</Warning>

## 回滚后的协议不匹配

用于降级或回滚后日志持续打印 `protocol mismatch` 的情况。较旧的 Gateway 网关正在运行，但较新的本地客户端进程仍在用旧 Gateway 网关无法支持的协议范围重新连接。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

查找：

- Gateway 网关日志中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:`，或 `openclaw doctor --deep` 中的 `Gateway clients`：连接到 Gateway 网关端口的活动 TCP 客户端；在操作系统允许时包含 PID 和命令行。
- 命令行指向你已回滚来源的较新 OpenClaw 安装或包装器的客户端进程。

修复：

1. 停止或重启 `gateway status --deep` 显示的过期 OpenClaw 客户端进程。
2. 重启嵌入 OpenClaw 的应用或包装器：本地仪表盘、编辑器、应用服务器辅助进程，或长期运行的 `openclaw logs --follow` shell。
3. 重新运行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，并确认过期客户端 PID 已消失。

不要让较旧的 Gateway 网关接受较新的不兼容协议。协议升级会保护线路契约；回滚恢复是进程/版本清理问题。

## Skill 符号链接因路径逃逸被跳过

用于日志包含以下内容的情况：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

每个 skill 根目录都是一个包含边界。`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符号链接，如果其真实目标解析到该根目录之外，就会被跳过，除非该目标被显式信任。

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

然后启动新会话，或等待 Skills 监视器刷新。如果运行中的进程早于配置变更，请重启 Gateway 网关。

不要使用 `~`、`/` 或整个同步项目文件夹这类宽泛目标。将 `allowSymlinkTargets` 限定到包含可信 `SKILL.md` 目录的真实 skill 根目录。

如果 Skill Workshop apply 也应通过这些受信任的符号链接工作区 skill 路径写入，请启用 `skills.workshop.allowSymlinkTargetWrites`。对于只读共享 skill 根目录，保持禁用。

相关：

- [Skills 配置](/zh-CN/tools/skills-config#symlinked-skill-roots)
- [配置示例](/zh-CN/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 长上下文需要额外用量资格

用于日志/错误包含以下内容的情况：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找：

- 所选 Anthropic 模型是支持 GA 的 1M Claude 4.x 模型（Opus 4.6/4.7/4.8、Sonnet 4.6），或模型配置仍携带旧版 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文用量资格。
- 请求只在需要 1M 上下文路径的长会话/模型运行中失败。

修复选项：

<Steps>
  <Step title="使用标准上下文窗口">
    切换到标准窗口模型，或从较旧模型配置中移除旧版
    `context1m`，前提是该配置不具备 1M 上下文 GA 能力。
  </Step>
  <Step title="使用符合资格的凭证">
    使用符合长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API key。
  </Step>
  <Step title="配置回退模型">
    配置回退模型，让 Anthropic 长上下文请求被拒绝时运行仍能继续。
  </Step>
</Steps>

相关：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 用量和成本](/zh-CN/reference/token-use)
- [为什么我看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 阻止响应

用于上游 LLM 提供商返回通用 `403`（例如 `Your request was blocked`）的情况。

不要假设这一定是 OpenClaw 配置问题。该响应可能来自上游安全层，例如 CDN、WAF、bot 管理规则，或位于 OpenAI 兼容端点前面的反向代理。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

查找：

- 同一提供商下多个模型以相同方式失败。
- 返回 HTML 或通用安全文本，而不是正常的提供商 API 错误。
- 提供商侧在同一请求时间出现安全事件。
- 一个极小的直接 `curl` 探测成功，但正常 SDK 形态的请求失败。

当证据指向 WAF/CDN 阻断时，先修复提供商侧过滤。优先为 OpenClaw 使用的 API 路径设置窄范围允许或跳过规则，避免为整个站点禁用防护。

<Warning>
最小 `curl` 成功并不保证真实 SDK 风格请求会通过同一个上游安全层。
</Warning>

相关：

- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)
- [提供商配置](/zh-CN/providers)
- [日志](/zh-CN/logging)

## 本地 OpenAI 兼容后端通过直接探测，但智能体运行失败

用于以下情况：

- `curl ... /v1/models` 可用。
- 极小的直接 `/v1/chat/completions` 调用可用。
- OpenClaw 模型运行只在正常智能体轮次中失败。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查找：

- 直接极小调用成功，但 OpenClaw 运行只在较大提示词上失败。
- `model_not_found` 或 404 错误，即使直接 `/v1/chat/completions` 使用相同裸模型 ID 可用。
- 后端报错称 `messages[].content` 期望字符串。
- 使用 OpenAI 兼容本地后端时，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 只在更大的提示词 token 数或完整智能体运行时提示词下出现的后端崩溃。

<AccordionGroup>
  <Accordion title="常见特征">
    - 本地 MLX/vLLM 风格服务器出现 `model_not_found`：确认 `baseUrl` 包含 `/v1`，`api` 对 `/v1/chat/completions` 后端为 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是提供商本地的裸 ID。选择时只加一次提供商前缀，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目录条目保持为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string`：后端拒绝结构化 Chat Completions 内容片段。修复：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允许的消息键如 `["role","content"]`：后端拒绝 Chat Completions 消息上的 OpenAI 风格重放元数据。修复：设置 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0`：后端完成了 Chat Completions 请求，但该轮没有返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常意味着后端正在输出空内容/非文本内容，或抑制最终答案文本。
    - 直接极小请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）：OpenClaw 传输很可能已经正确；失败的是更大的智能体运行时提示词形态下的后端。
    - 禁用工具后失败减少但没有消失：工具 schema 是压力的一部分，但剩余问题仍是上游模型/服务器容量或后端 bug。

  </Accordion>
  <Accordion title="修复选项">
    1. 为只接受字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 为只接受每条消息上 `role` 和 `content` 的严格 Chat Completions 后端设置 `compat.strictMessageKeys: true`。
    3. 为无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
    4. 在可行处降低提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或具备更强长上下文支持的后端。
    5. 如果极小直接请求持续通过，而 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并用被接受的 payload 形态向上游提交复现。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

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

- 私信发送者的配对待处理。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组允许列表不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息会被忽略，直到被提及。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## 仪表板 Control UI 连接

当仪表板/Control UI 无法连接时，验证 URL、认证模式和安全上下文假设。

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
- 在需要设备身份时使用了 HTTP。

如果更新后本地浏览器无法连接到 `127.0.0.1:18789`，先恢复本地 Gateway 网关服务，并确认它正在提供仪表板：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 返回 OpenClaw HTML，说明 Gateway 网关正在工作，剩余问题很可能是浏览器缓存、旧的深层链接或过期的标签页状态。直接打开 `http://127.0.0.1:18789`，并从仪表板导航。如果重启后服务没有保持运行，运行 `openclaw gateway start`，然后重新检查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="连接 / 认证特征">
    - `device identity required` → 非安全上下文或缺少设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正在从非 loopback 浏览器来源连接，且没有显式允许列表）。
    - `device nonce required` / `device nonce mismatch` → 客户端未完成基于质询的设备认证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误载荷（或过期时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌执行一次受信任重试。
    - 该缓存令牌重试会复用与已配对设备令牌一起存储的缓存权限范围集合。显式 `deviceToken` / 显式 `scopes` 调用方则保留其请求的权限范围集合。
    - `AUTH_SCOPE_MISMATCH` → 设备令牌已被识别，但其已批准权限范围不覆盖此连接请求；请重新配对或批准请求的权限范围契约，而不是轮换共享 Gateway 网关令牌。
    - 在该重试路径之外，连接认证优先级依次是显式共享令牌/密码、显式 `deviceToken`、已存储设备令牌，然后是引导令牌。
    - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在限流器记录失败前被串行化。因此，来自同一客户端的两个并发错误重试可能会在第二次尝试时显示 `retry later`，而不是两个普通不匹配。
    - 浏览器来源 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源会使用单独的桶。
    - 该重试后仍反复出现 `unauthorized` → 共享令牌/设备令牌漂移；刷新令牌配置，并在需要时重新批准/轮换设备令牌。
    - `gateway connect failed:` → 主机/端口/URL 目标错误。

  </Accordion>
</AccordionGroup>

### 认证详情代码速查表

使用失败 `connect` 响应中的 `error.details.code` 选择下一步操作：

| 详情代码                     | 含义                                                                                                                                                                                         | 建议操作                                                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送必需的共享令牌。                                                                                                                                                                 | 在客户端中粘贴/设置令牌并重试。对于仪表板路径：先运行 `openclaw config get gateway.auth.token`，然后粘贴到 Control UI 设置中。                                                                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。                                                                                                                                                       | 如果 `canRetryWithDeviceToken=true`，允许一次受信任重试。缓存令牌重试会复用已存储的批准权限范围；显式 `deviceToken` / `scopes` 调用方会保留请求的权限范围。如果仍然失败，运行[令牌漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或已被撤销。                                                                                                                                                           | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备令牌，然后重新连接。                                                                                                                                                                                                                   |
| `AUTH_SCOPE_MISMATCH`        | 设备令牌有效，但其已批准角色/权限范围不覆盖此连接请求。                                                                                                                                       | 重新配对设备或批准请求的权限范围契约；不要把它当作共享令牌漂移处理。                                                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 设备身份需要批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。                   | 批准待处理请求：先运行 `openclaw devices list`，再运行 `openclaw devices approve <requestId>`。权限范围/角色升级在你审查请求的访问权限后使用同一流程。                                                                                                                                    |

<Note>
使用共享 Gateway 网关令牌/密码认证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备权限范围基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请确认调用方正在使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且没有强制显式 `deviceIdentity` 或设备令牌。
</Note>

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新连接客户端并验证它：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关发出的 `connect.challenge`。
  </Step>
  <Step title="签署载荷">
    客户端签署绑定到质询的载荷。
  </Step>
  <Step title="发送设备 nonce">
    客户端使用同一个质询 nonce 发送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 已配对设备令牌会话只能管理**自己的**设备，除非调用方还拥有 `operator.admin`。
- `openclaw devices rotate --scope ...` 只能请求调用方会话已经持有的操作员权限范围。

相关：

- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [Control UI](/zh-CN/web/control-ui)
- [设备](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

在服务已安装但进程无法保持运行时使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

查找：

- 带有退出提示的 `Runtime: stopped`。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时发现额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 网关模式未启用，或者配置文件被覆盖并丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径（令牌/密码，或已配置的受信任代理）的情况下绑定非 loopback 地址。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上保留一个 Gateway 网关；如果确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
    - Doctor 输出 `System-level OpenClaw gateway service detected` → 存在 systemd 系统单元，而用户级服务缺失。在允许 Doctor 安装用户服务之前，移除或禁用该重复项；如果系统单元是预期的监督器，则设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的监督器仍固定旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 网关服务。

  </Accordion>
</AccordionGroup>

相关：

- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## macOS Gateway 网关静默停止响应，然后在你触碰仪表板时恢复

当 macOS 主机上的渠道（Telegram、WhatsApp 等）一次静默数分钟到数小时，而 Gateway 网关在你打开 Control UI、通过 SSH 登录或以其他方式与主机交互时似乎立即恢复时使用。`openclaw status` 中通常没有明显症状，因为等你查看时 Gateway 网关已经重新存活。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

查找：

- `~/.openclaw/logs/stability/` 中的一个或多个 `*-uncaught_exception.json` 包，其中 `error.code` 设置为瞬态网络代码，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 中类似 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)` 的行，并且时间与崩溃时间戳一致。Power Nap / Maintenance Sleep 会短暂地将 Wi-Fi 驱动置于状态 0；任何在该窗口内发生的出站 `connect()` 都可能以 `ENETDOWN` 失败，即使主机在其他情况下网络连接完全正常。
- `launchctl print` 输出显示 `state = not running`，并且最近有多次 `runs` 和一个退出代码，尤其是当崩溃与下一次启动之间的间隔接近一小时而不是几秒时。macOS launchd 会在一轮崩溃后应用一个未公开的重生保护门控，这可能导致它停止执行 `KeepAlive=true`，直到交互式登录、仪表盘连接或 `launchctl kickstart` 等外部触发器重新激活它。

常见特征：

- 稳定性包中的 `error.code` 为 `ENETDOWN` 或同类代码，并且调用栈指向 Node `net` 的 `lookupAndConnect` / `Socket.connect`。OpenClaw `2026.5.26` 及更新版本会将这些错误归类为良性的瞬态网络错误，因此它们不再传播到顶层未捕获处理程序；如果你使用的是旧版本，请先升级。
- 长时间安静期在你连接到 Control UI 或通过 SSH 进入主机的瞬间结束：重新激活 launchd 重生门控的是用户可见活动，而不是仪表盘对 Gateway 网关做了什么。
- `runs` 计数在一天内递增，但 `~/Library/Logs/openclaw/gateway.log` 中没有对应的 `received SIG*; shutting down` 行：干净关机会记录信号；瞬态崩溃不会。

处理方式：

1. 如果你运行的是 `2026.5.26` 之前的版本，请**升级 Gateway 网关**。升级后，未来的 `ENETDOWN` 错误会记录为警告，而不是终止进程。
2. 对用于始终在线服务器的 Mac mini / 桌面主机，**减少维护睡眠活动**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   这会显著减少但不能完全消除底层驱动抖动。无论这些标志如何设置，系统仍可能为了 TCP keepalive 和 mDNS 维护执行一些维护睡眠。

3. **添加一个存活性看门狗**，以便将来被 launchd 暂停的一轮崩溃能被快速发现：

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重点是从外部重新激活重生门控；在 macOS 上，一轮崩溃之后，仅靠 `KeepAlive=true` 并不足够。

相关：

- [macOS 平台说明](/zh-CN/platforms/macos)
- [日志](/zh-CN/logging)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关在高内存使用期间退出

当 Gateway 网关在负载下消失、监督程序报告 OOM 风格的重启，或日志提到 `critical memory pressure bundle written` 时使用。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

查找：

- 最新稳定性包中的 `Reason: diagnostic.memory.pressure.critical`。
- 带有 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth` 的 `Memory pressure:`。
- 接近堆限制的 `V8 heap:` 值。
- `Largest session files:` 条目，例如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 当 Gateway 网关在容器或内存受限服务中运行时的 Linux cgroup 内存计数器。

常见特征：

- `critical memory pressure bundle written` 在重启前不久出现 → OpenClaw 捕获了一个 OOM 前稳定性包。使用 `openclaw gateway stability --bundle latest` 检查它。
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` 出现在 Gateway 网关日志中 → OpenClaw 检测到临界内存压力，但 OOM 前稳定性快照已关闭。
- `Largest session files:` 指向一个非常大的已遮盖转录路径 → 减少保留的会话历史，检查会话增长，或在重启前将旧转录移出活跃存储。
- `V8 heap:` 已用字节接近堆限制 → 降低提示词/会话压力，减少并发工作，或仅在确认工作负载符合预期后提高 Node 堆限制。
- `Memory pressure: critical/rss_growth` → 内存在一个采样窗口内快速增长。检查最新日志中是否有大型导入、失控的工具输出、重复重试，或一批排队的智能体工作。
- 临界内存压力出现在日志中，但不存在包 → 这是默认行为。设置 `diagnostics.memoryPressureSnapshot: true`，以便在未来的临界内存压力事件中捕获 OOM 前稳定性包。

稳定性包不含载荷。它包含运行内存证据和已遮盖的相对文件路径，不包含消息文本、webhook 正文、凭证、令牌、cookie 或原始会话 ID。请将诊断导出附加到错误报告，而不是复制原始日志。

相关：

- [Gateway 健康](/zh-CN/gateway/health)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [会话](/zh-CN/cli/sessions)

## Gateway 网关拒绝了无效配置

当 Gateway 网关启动因 `Invalid config` 失败，或热重载日志显示它跳过了无效编辑时使用。

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
- 活跃配置旁边带时间戳的 `openclaw.json.rejected.*` 文件。
- 如果 `doctor --fix` 修复了损坏的直接编辑，则会有带时间戳的 `openclaw.json.clobbered.*` 文件。
- OpenClaw 会为每个配置路径保留最新的 32 个 `.clobbered.*` 文件，并轮换更旧的文件。

<AccordionGroup>
  <Accordion title="What happened">
    - 配置在启动、热重载或 OpenClaw 拥有的写入期间未通过验证。
    - Gateway 网关启动会失败关闭，而不是重写 `openclaw.json`。
    - 热重载会跳过无效的外部编辑，并保持当前运行时配置处于活跃状态。
    - OpenClaw 拥有的写入会在提交前拒绝无效/破坏性载荷，并保存 `.rejected.*`。
    - `openclaw doctor --fix` 负责修复。它可以移除非 JSON 前缀，或恢复最后已知良好的副本，同时将被拒绝的载荷保留为 `.clobbered.*`。
    - 当一个配置路径发生许多次修复时，OpenClaw 会轮换更旧的 `.clobbered.*` 文件，以便最新的已修复载荷仍然可用。

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` 存在 → Doctor 在修复活跃配置时保留了损坏的外部编辑。
    - `.rejected.*` 存在 → OpenClaw 拥有的配置写入在提交前未通过架构或覆盖检查。
    - `Config write rejected:` → 该写入尝试丢弃必需形状、让文件急剧变小，或持久化无效配置。
    - `config reload skipped (invalid config):` → 直接编辑未通过验证，并被正在运行的 Gateway 网关忽略。
    - `Invalid config at ...` → 启动在 Gateway 网关服务启动前失败。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 拥有的写入因相比最后已知良好的备份丢失字段或大小而被拒绝。
    - `Config last-known-good promotion skipped` → 候选内容包含已遮盖的密钥占位符，例如 `***`。

  </Accordion>
  <Accordion title="Fix options">
    1. 运行 `openclaw doctor --fix`，让 Doctor 修复带前缀/被覆盖的配置，或恢复最后已知良好版本。
    2. 只从 `.clobbered.*` 或 `.rejected.*` 复制目标键，然后用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 重启前运行 `openclaw config validate`。
    4. 如果你手动编辑，请保留完整的 JSON5 配置，而不仅仅是你想更改的部分对象。
  </Accordion>
</AccordionGroup>

相关：

- [配置](/zh-CN/cli/config)
- [Configuration: hot reload](/zh-CN/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能到达某个目标，但仍打印警告块时使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查找：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否涉及 SSH 回退、多个 Gateway 网关、缺少权限范围，或未解析的认证引用。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接配置/loopback 目标。
- `multiple reachable gateway identities detected` → 不同的 Gateway 网关作出了响应，或者 OpenClaw 无法证明可达目标是同一个 Gateway 网关。指向同一 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL 会被视为一个拥有多种传输方式的 Gateway 网关，即使传输端口不同也是如此。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详情 RPC 受权限范围限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整诊断 RPC 集超时或失败。将其视为一个可达但诊断降级的 Gateway 网关；比较 `--json` 输出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但该客户端在正常操作员访问前仍需要配对/审批。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在该命令路径中，失败目标的认证材料不可用。

相关：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息未流动

如果渠道状态为已连接但消息流已中断，请重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查找：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组允许列表和提及要求。
- 缺失的渠道 API 权限/权限范围。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待审批痕迹 → 发送者未获批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证/权限问题。

相关：

- [渠道故障排查](/zh-CN/channels/troubleshooting)
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

查找：

- cron 已启用，并且存在下一次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器 tick 失败；检查文件、日志或运行时错误。
    - `heartbeat skipped` 且带有 `reason=quiet-hours` → 处于活跃时间窗口之外。
    - `heartbeat skipped` 且带有 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白、注释、标题、围栏或空清单脚手架，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` 且带有 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何任务到期。
    - `heartbeat: unknown accountId` → Heartbeat 投递目标的账号 ID 无效。
    - `heartbeat skipped` 且带有 `reason=dm-blocked` → Heartbeat 目标解析为私信风格的目的地，同时 `agents.defaults.heartbeat.directPolicy`（或按 Agent 覆盖项）设置为 `block`。

  </Accordion>
</AccordionGroup>

相关：

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [定时任务：故障排查](/zh-CN/automation/cron-jobs#troubleshooting)

## 节点已配对，但工具失败

如果节点已配对但工具失败，请隔离前台、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查找：

- 节点在线且具备预期能力。
- 摄像头、麦克风、位置、屏幕的操作系统权限授权。
- Exec 审批和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关：

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [节点故障排查](/zh-CN/nodes/troubleshooting)
- [节点](/zh-CN/nodes/index)

## 浏览器工具失败

当浏览器工具操作失败但 Gateway 网关本身健康时使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查找：

- 是否设置了 `plugins.allow`，并且其中包含 `browser`。
- 有效的浏览器可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

<AccordionGroup>
  <Accordion title="插件 / 可执行文件特征">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
    - 浏览器工具缺失 / 不可用，同时 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不支持的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口错误或超出范围。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少核心浏览器运行时依赖；重新安装或更新 OpenClaw，然后重启 Gateway 网关。ARIA 快照和基本页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / 现有会话特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 现有会话尚无法附加到选中的浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准第一次附加提示，然后重试。如果不需要登录状态，优先使用托管的 `openclaw` 配置文件。
    - `No browser tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 网关主机访问。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或 HTTP 端点已响应，但 CDP WebSocket 仍无法打开。

  </Accordion>
  <Accordion title="元素 / 截图 / 上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照引用，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传文件。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP 现有会话配置文件上的 `act:type` 省略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对 `profile="user"` / Chrome MCP 现有会话配置文件上的 `act:evaluate` 省略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要托管浏览器或原始 CDP 配置文件。
    - 仅附加或远程 CDP 配置文件上的陈旧视口 / 深色模式 / 语言区域 / 离线覆盖 → 运行 `openclaw browser stop --browser-profile <name>`，关闭活动控制会话并释放 Playwright/CDP 模拟状态，而无需重启整个 Gateway 网关。

  </Accordion>
</AccordionGroup>

相关：

- [浏览器（OpenClaw 管理）](/zh-CN/tools/browser)
- [浏览器故障排查](/zh-CN/tools/browser-linux-troubleshooting)

## 如果你升级后某些内容突然损坏

大多数升级后的故障来自配置漂移，或现在开始强制执行更严格的默认值。

<AccordionGroup>
  <Accordion title="1. 凭证和 URL 覆盖行为已变化">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要检查的内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能会指向远程，而你的本地服务本身正常。
    - 显式 `--url` 调用不会回退到已存储凭证。

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

    要检查的内容：

    - 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关凭证路径：共享 token/password 凭证，或正确配置的非 loopback `trusted-proxy` 部署。
    - 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关凭证路径。
    - `Connectivity probe: failed` 且运行时正在运行 → Gateway 网关处于活动状态，但使用当前凭证/URL 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态已变化">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要检查的内容：

    - 仪表板/节点的待处理设备审批。
    - 策略或身份变更后的待处理私信配对审批。

    常见特征：

    - `device identity required` → 设备凭证未满足。
    - `pairing required` → 发送方/设备必须获得批准。

  </Accordion>
</AccordionGroup>

如果检查后服务配置和运行时仍不一致，请从同一个配置文件/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [认证](/zh-CN/gateway/authentication)
- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [Gateway 网关拥有的配对](/zh-CN/gateway/pairing)

## 相关

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关运行手册](/zh-CN/gateway)
