---
read_when:
    - 故障排除中心引导你来这里进行更深入的诊断
    - 你需要包含精确命令、按症状分类且稳定的运行手册章节
sidebarTitle: Troubleshooting
summary: Gateway 网关、渠道、自动化、节点和浏览器深度故障排查运行手册
title: 故障排查
x-i18n:
    generated_at: "2026-07-12T14:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

这是深度排障手册。请先从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始，完成快速分诊流程。

## 命令执行顺序

按以下顺序运行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康状态信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 未报告会造成阻塞的配置或服务问题。
- `openclaw channels status --probe` 显示每个账户的实时传输状态，并在支持的情况下显示 `works` 或 `audit ok`。

## 更新后

更新完成但 Gateway 网关已停止、渠道为空或模型调用因 401 错误而失败时使用。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

检查以下内容：

- `openclaw status` / `openclaw status --all` 中的 `Update restart`。待处理或失败的交接会包含接下来要运行的命令。
- Channels 下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：渠道配置仍然存在，但插件注册在渠道加载前失败。
- 重新进行身份验证后的提供商 401 错误：`openclaw doctor --fix` 会检查是否存在过期的每 Agent OAuth 身份验证影子副本，并移除旧副本，以便所有智能体都解析到当前共享配置文件。

## 安装版本分裂和较新配置保护机制

当 Gateway 网关服务在更新后意外停止，或日志显示某个 `openclaw` 二进制文件的版本低于最后写入 `openclaw.json` 的版本时使用。

OpenClaw 使用 `meta.lastTouchedVersion` 标记配置写入版本。只读命令可以检查由较新版 OpenClaw 写入的配置，但较旧的二进制文件会拒绝执行进程和服务变更。被阻止的操作包括：启动、停止、重启或卸载 Gateway 网关服务，强制重新安装服务，以服务模式启动 Gateway 网关，以及通过 `gateway --force` 清理端口。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修复 PATH">
    修复 `PATH`，使 `openclaw` 解析到较新的安装版本，然后重新运行该操作。
  </Step>
  <Step title="重新安装 Gateway 网关服务">
    从较新的安装版本重新安装预期的 Gateway 网关服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除过期包装器">
    移除仍指向旧版 `openclaw` 二进制文件的过期系统软件包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅在有意降级或紧急恢复时，才为单条命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常运行时请勿设置。
</Warning>

## 回滚后的协议不匹配

降级或回滚后日志持续输出 `protocol mismatch` 时使用。此时较旧的 Gateway 网关正在运行，但较新的本地客户端进程仍在使用较旧 Gateway 网关无法处理的协议范围重新连接。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

检查以下内容：

- Gateway 网关日志中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:` 或 `openclaw doctor --deep` 中的 `Gateway clients`：已连接到 Gateway 网关端口的活动 TCP 客户端；在操作系统允许时，还会显示 PID 和命令行。
- 命令行指向回滚前较新版 OpenClaw 安装或包装器的客户端进程。

修复方法：

1. 停止或重启 `gateway status --deep` 显示的过期 OpenClaw 客户端进程。
2. 重启嵌入 OpenClaw 的应用或包装器：本地仪表盘、编辑器、应用服务器辅助程序或长期运行 `openclaw logs --follow` 的 shell。
3. 重新运行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，并确认过期客户端的 PID 已消失。

不要让较旧的 Gateway 网关接受较新且不兼容的协议。协议版本升级用于保护线协议契约；回滚恢复是进程和版本清理问题。

## 因路径逃逸而跳过 Skill 符号链接

日志包含以下内容时使用：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

每个 Skill 根目录都是一个包含边界。当 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符号链接，其真实目标解析到该根目录之外时，除非目标已被明确设为可信，否则会跳过该链接。

检查链接：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果该目标是有意设置的，请同时配置直接 Skill 根目录和允许的符号链接目标：

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

然后启动新会话，或等待 Skills 监视器刷新。如果运行中的进程早于此次配置变更，请重启 Gateway 网关。

不要使用 `~`、`/` 或整个已同步项目文件夹等宽泛目标。将 `allowSymlinkTargets` 的范围限制为包含可信 `SKILL.md` 目录的真实 Skill 根目录。

如果 Skill Workshop 的应用操作也应通过这些可信符号链接写入工作区 Skill 路径，请启用 `skills.workshop.allowSymlinkTargetWrites`。对于只读的共享 Skill 根目录，请保持禁用。

相关内容：

- [Skills 配置](/zh-CN/tools/skills-config#symlinked-skill-roots)
- [配置示例](/zh-CN/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 长上下文需要额外用量时出现 429

日志或错误中包含 `HTTP 429: rate_limit_error: Extra usage is required for long context requests` 时使用。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

检查以下内容：

- 所选 Anthropic 模型是支持 1M 上下文正式可用版的 Claude 4.x 模型（Opus 4.6/4.7/4.8、Sonnet 4.6），或模型配置仍包含旧版 `params.context1m: true`。
- 当前 Anthropic 凭据不具备使用长上下文的资格。
- 仅在需要使用 1M 上下文路径的长会话或模型运行中请求失败。

修复选项：

<Steps>
  <Step title="使用标准上下文窗口">
    切换到标准窗口模型，或从不支持 1M 上下文正式可用版的旧版
    模型配置中移除旧版 `context1m`。
  </Step>
  <Step title="使用符合条件的凭据">
    使用具备长上下文请求资格的 Anthropic 凭据，或切换到 Anthropic API key。
  </Step>
  <Step title="配置回退模型">
    配置回退模型，使 Anthropic 长上下文请求遭拒后运行仍可继续。
  </Step>
</Steps>

相关内容：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用量和费用](/zh-CN/reference/token-use)
- [为什么会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 拦截响应

上游 LLM 提供商返回 `Your request was blocked` 等通用 `403` 时使用。

不要假定这始终是 OpenClaw 配置问题。该响应可能来自上游安全层，例如位于 OpenAI 兼容端点前方的 CDN、WAF、机器人管理规则或反向代理。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

检查以下内容：

- 同一提供商下的多个模型以相同方式失败。
- 返回 HTML 或通用安全提示文本，而不是正常的提供商 API 错误。
- 提供商侧在同一请求时间发生的安全事件。
- 极简的直接 `curl` 探测成功，但正常的 SDK 形式请求失败。

当证据指向 WAF/CDN 拦截时，请先修复提供商侧的过滤。最好针对 OpenClaw 使用的 API 路径设置范围精确的允许或跳过规则，避免为整个站点禁用保护。

<Warning>
极简 `curl` 成功并不能保证真正的 SDK 风格请求能通过同一个上游安全层。
</Warning>

相关内容：

- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)
- [提供商配置](/zh-CN/providers)
- [日志](/zh-CN/logging)

## 本地 OpenAI 兼容后端通过直接探测，但智能体运行失败

适用于以下情况：

- `curl ... /v1/models` 正常工作。
- 极小的直接 `/v1/chat/completions` 调用正常工作。
- OpenClaw 模型运行仅在正常智能体轮次中失败。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

检查以下内容：

- 直接的极小调用成功，但 OpenClaw 运行仅在较大提示词下失败。
- 即使直接调用 `/v1/chat/completions` 时使用相同的裸模型 ID 可以正常工作，仍出现 `model_not_found` 或 404 错误。
- 后端错误提示 `messages[].content` 应为字符串。
- 使用 OpenAI 兼容的本地后端时，间歇性出现 `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 仅在提示词 Token 数量较多或使用完整 Agent Runtimes 提示词时出现后端崩溃。

<AccordionGroup>
  <Accordion title="常见特征">
    - 本地 MLX/vLLM 风格服务器出现 `model_not_found`：确认 `baseUrl` 包含 `/v1`，对于 `/v1/chat/completions` 后端，`api` 为 `"openai-completions"`，并且 `models.providers.<provider>.models[].id` 是提供商本地的裸 ID。选择时仅添加一次提供商前缀，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目录条目保持为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string`：后端拒绝结构化的 Chat Completions 内容部分。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或 `["role","content"]` 等允许的消息键：后端拒绝 Chat Completions 消息中的 OpenAI 风格重放元数据。修复方法：设置 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0`：后端完成了 Chat Completions 请求，但未为该轮次返回用户可见的助手文本。OpenClaw 会对可安全重放的空 OpenAI 兼容轮次重试一次；持续失败通常意味着后端正在输出空内容或非文本内容，或者抑制最终答案文本。
    - 直接的极小请求成功，但 OpenClaw 智能体运行因后端或模型崩溃而失败（例如某些 `inferrs` 构建中的 Gemma）：OpenClaw 传输很可能已经正确；后端在处理更大的 Agent Runtimes 提示词结构时失败。
    - 禁用工具后故障减少但未消失：工具架构是压力来源之一，但剩余问题仍是上游模型或服务器容量不足，或者后端缺陷。

  </Accordion>
  <Accordion title="修复选项">
    1. 对仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 对仅接受每条消息包含 `role` 和 `content` 的严格 Chat Completions 后端设置 `compat.strictMessageKeys: true`。
    3. 对无法可靠处理 OpenClaw 工具架构表面的模型或后端设置 `compat.supportsTools: false`。
    4. 尽可能降低提示词压力：缩小工作区引导内容、缩短会话历史记录、使用更轻量的本地模型，或使用长上下文支持更强的后端。
    5. 如果极小的直接请求持续成功，但 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器或模型限制，并使用已接受的载荷结构向上游提交复现报告。
  </Accordion>
</AccordionGroup>

相关内容：

- [配置](/zh-CN/gateway/configuration)
- [本地模型](/zh-CN/gateway/local-models)
- [OpenAI 兼容端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已启动但没有任何响应，请先检查路由和策略，再尝试重新连接。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

检查：

- 私信发送者的配对是否处于待处理状态。
- 群组提及限制（`requireMention`、`mentionPatterns`）。
- 渠道/群组允许列表不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息在提及前会被忽略。
- `pairing request` → 发送者需要获得批准。
- `blocked` / `allowlist` → 发送者/渠道已被策略过滤。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [群组](/zh-CN/channels/groups)
- [配对](/zh-CN/channels/pairing)

## Dashboard Control UI 连接问题

当 Dashboard/Control UI 无法连接时，请验证 URL、身份验证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

检查：

- 探测 URL 和 Dashboard URL 是否正确。
- 客户端与 Gateway 网关之间的身份验证模式/令牌是否不匹配。
- 在需要设备身份时是否使用了 HTTP。

如果更新后本地浏览器无法连接到 `127.0.0.1:18789`，请先恢复本地 Gateway 网关服务，并确认它正在提供 Dashboard：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 返回 OpenClaw HTML，则 Gateway 网关工作正常，剩余问题可能是浏览器缓存、旧的深层链接或过期的标签页状态。直接打开 `http://127.0.0.1:18789`，然后从 Dashboard 中导航。如果重启后服务仍未保持运行，请运行 `openclaw gateway start`，并重新检查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="连接/身份验证特征">
    - `device identity required` → 上下文不安全或缺少设备身份验证。
    - `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 浏览器来源连接，但未配置显式允许列表）。
    - `device nonce required` / `device nonce mismatch` → 客户端未完成基于质询的设备身份验证流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的载荷（或使用了过期的时间戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌进行一次可信重试。
    - 该缓存令牌重试会复用与已配对设备令牌一同存储的缓存权限范围集。显式指定 `deviceToken` / `scopes` 的调用方则保留其请求的权限范围集。
    - `AUTH_SCOPE_MISMATCH` → 设备令牌已被识别，但其已批准的权限范围不涵盖此连接请求；应重新配对或批准所请求的权限范围契约，而不是轮换共享 Gateway 网关令牌。
    - 在该重试路径之外，连接身份验证的优先顺序为：先使用显式共享令牌/密码，然后依次使用显式 `deviceToken`、已存储的设备令牌和引导令牌。
    - 在异步 Tailscale Serve Control UI 路径中，在限制器记录失败之前，会按相同的 `{scope, ip}` 串行处理失败尝试。因此，同一客户端的两次并发错误重试可能会让第二次尝试显示 `retry later`，而不是出现两次普通的不匹配。
    - 来自浏览器来源 loopback 客户端的 `too many failed authentication attempts (retry later)` → 同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源使用单独的桶。
    - 该重试后仍反复出现 `unauthorized` → 共享令牌/设备令牌发生漂移；请刷新令牌配置，并根据需要重新批准/轮换设备令牌。
    - `gateway connect failed:` → 主机、端口或 URL 目标错误。

  </Accordion>
</AccordionGroup>

### 身份验证详情代码速查表

使用失败的 `connect` 响应中的 `error.details.code` 选择下一步操作：

| 详情代码                     | 含义                                                                                                                                                                                         | 建议操作                                                                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送必需的共享令牌。                                                                                                                                                                 | 在客户端中粘贴/设置令牌，然后重试。对于 Dashboard 路径：运行 `openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。                                                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关身份验证令牌不匹配。                                                                                                                                                  | 如果 `canRetryWithDeviceToken=true`，允许进行一次可信重试。缓存令牌重试会复用已存储且获批的权限范围；显式指定 `deviceToken` / `scopes` 的调用方保留请求的权限范围。如果仍失败，请运行[令牌漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或被撤销。                                                                                                                                                             | 使用[设备 CLI](/zh-CN/cli/devices) 轮换/重新批准设备令牌，然后重新连接。                                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 设备令牌有效，但其已批准的角色/权限范围不涵盖此连接请求。                                                                                                                                    | 重新配对设备或批准所请求的权限范围契约；不要将其视为共享令牌漂移。                                                                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | 设备身份需要获得批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：运行 `openclaw devices list`，然后运行 `openclaw devices approve <requestId>`。审核所请求的访问权限后，权限范围/角色升级也使用相同流程。                                                                                                                                    |

<Note>
使用共享 Gateway 网关令牌/密码进行身份验证的直接 loopback 后端 RPC 不应依赖 CLI 的已配对设备权限范围基线。如果子智能体或其他内部调用仍因 `scope-upgrade` 失败，请验证调用方使用的是 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且未强制指定显式 `deviceIdentity` 或设备令牌。
</Note>

设备身份验证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，请更新连接客户端并进行验证：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 网关发出的 `connect.challenge`。
  </Step>
  <Step title="签署载荷">
    客户端签署与质询绑定的载荷。
  </Step>
  <Step title="发送设备 nonce">
    客户端使用相同的质询 nonce 发送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 除非调用方同时拥有 `operator.admin`，否则已配对设备令牌会话只能管理**自己的**设备。
- `openclaw devices rotate --scope ...` 只能请求调用方会话已拥有的操作员权限范围。

相关内容：

- [配置](/zh-CN/gateway/configuration)（Gateway 网关身份验证模式）
- [Control UI](/zh-CN/web/control-ui)
- [设备](/zh-CN/cli/devices)
- [远程访问](/zh-CN/gateway/remote)
- [可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)

## Gateway 网关服务未运行

适用于服务已安装但进程无法持续运行的情况。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 同时扫描系统级服务
```

检查：

- `Runtime: stopped` 及退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时发现额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 网关模式未启用，或配置文件被覆盖并丢失了 `gateway.mode`。修复方法：在配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup`，以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径为 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关身份验证路径的情况下绑定到非 loopback 地址（令牌/密码，或已配置的可信代理）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上仅保留一个 Gateway 网关；如果确实需要多个，请隔离端口以及配置/状态/工作区。请参阅 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
    - Doctor 显示 `System-level OpenClaw gateway service detected` → 存在 systemd 系统单元，但用户级服务缺失。在允许 Doctor 安装用户服务之前，请移除或禁用重复项；如果该系统单元是预期的监督程序，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的监督程序仍固定使用旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 网关服务。

  </Accordion>
</AccordionGroup>

相关内容：

- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## macOS Gateway 网关无提示地停止响应，操作 Dashboard 后又恢复

适用于 macOS 主机上的渠道（Telegram、WhatsApp 等）每次会沉寂数分钟到数小时，并且当你打开 Control UI、通过 SSH 登录或以其他方式与主机交互时，Gateway 网关似乎会立即恢复的情况。`openclaw status` 中通常没有明显症状，因为等你查看时，Gateway 网关已经再次恢复运行。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

检查：

- `~/.openclaw/logs/stability/` 中存在一个或多个 `*-uncaught_exception.json` 包，其中 `error.code` 被设为瞬时网络错误代码，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 中出现类似 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)` 的行，且与崩溃时间戳吻合。Power Nap / Maintenance Sleep 会短暂地将 Wi-Fi 驱动置于状态 0；任何恰好在此时间窗口内发起的出站 `connect()` 都可能因 `ENETDOWN` 而失败，即使主机在其他时间具有完整的网络连接。
- `launchctl print` 输出显示 `state = not running`，同时有多次近期 `runs` 和退出代码，尤其是崩溃与下次启动之间的间隔约为一小时而非几秒时。macOS launchd 会在短时间内连续崩溃后应用一个未公开的重生保护门控，这可能导致它停止遵循 `KeepAlive=true`，直到交互式登录、仪表板连接或 `launchctl kickstart` 等外部触发器将其重新启用。

常见特征：

- 稳定性包中的 `error.code` 为 `ENETDOWN` 或同类代码，调用堆栈指向 Node `net` 的 `lookupAndConnect` / `Socket.connect`。OpenClaw `2026.5.26` 及更高版本会将这些错误归类为无害的瞬时网络错误，因此它们不再传播到顶层未捕获异常处理程序；如果你使用的是更早版本，请先升级。
- 长时间静默，并在你连接到 Control UI 或通过 SSH 登录主机时立即结束：重新启用 launchd 重生门控的是用户可见的活动，而不是仪表板对 Gateway 网关执行了任何操作。
- `runs` 计数在一天中不断增加，但 `~/Library/Logs/openclaw/gateway.log` 中没有对应的 `received SIG*; shutting down` 行：正常关闭会记录信号；瞬时崩溃不会。

处理方法：

1. 如果你运行的是 `2026.5.26` 之前的版本，请**升级 Gateway 网关**。升级后，未来的 `ENETDOWN` 错误将作为警告记录，而不会终止进程。
2. 对于要用作全天候服务器的 Mac mini / 台式主机，**减少维护睡眠活动**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   这会显著减少底层驱动波动，但无法将其完全消除。无论这些标志如何设置，系统仍可能为了 TCP keepalive 和 mDNS 维护而执行某些维护睡眠。

3. **添加存活看门狗**，以便 launchd 在未来连续崩溃后停止重生进程时能够快速发现：

   ```bash
   # launchd 感知的存活检查示例，适用于每 5 分钟运行一次的 cron 或 LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重点是从外部重新启用重生门控；在 macOS 上连续崩溃后，仅使用 `KeepAlive=true` 并不足够。

相关内容：

- [macOS 平台说明](/zh-CN/platforms/macos)
- [日志](/zh-CN/logging)
- [Doctor](/zh-CN/gateway/doctor)

## 存在重复 Gateway 网关/节点 LaunchAgent 时的 macOS launchd 监管循环

当 macOS 安装每隔几秒不断重启、`openclaw`
健康检查在健康与不可用之间反复切换，并且渠道分发停滞，
即使服务看起来仍在运行，也请使用此方法。

这种情况曾出现在较早的安装中，其中 `ai.openclaw.gateway` 和
`ai.openclaw.node` LaunchAgent 同时处于活动状态，且两者都注入了
`OPENCLAW_LAUNCHD_LABEL`。在这种状态下，OpenClaw 可能会检测到 launchd
监管，尝试将重启交回 launchd，随后陷入快速
`EADDRINUSE`/重生循环，而不是维持单个稳定的 Gateway 网关进程。

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

检查以下情况：

- 在 30 秒采样期间出现多个 Gateway 网关 PID，而不是一个稳定的
  进程。
- `gateway.log` 中出现 `EADDRINUSE`、`another gateway instance is already listening`，或重复的
  重启/交接行。
- 在一台本应只运行一个托管 Gateway 网关服务的主机上，
  `~/Library/LaunchAgents/ai.openclaw.gateway.plist` 和
  `~/Library/LaunchAgents/ai.openclaw.node.plist` 同时加载。

处理方法：

1. 如果此主机应仅运行 Gateway 网关服务，请通过 OpenClaw 删除托管节点
   服务。如果你主动依赖节点服务来使用远程节点功能，请**跳过此步骤**；
   卸载该服务会停止此主机上的这些功能：

   ```bash
   openclaw node uninstall
   ```

2. 安装一个持久化 Gateway 网关包装器，在启动 OpenClaw 前清除继承的 launchd
   标记。请使用受支持的 `--wrapper` 选项；不要
   编辑 `~/.openclaw/service-env/` 下生成的文件，因为重新安装服务、
   更新和 Doctor 修复都会重新生成该文件：

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` 会在强制重新安装、更新和 Doctor 修复期间保留包装器路径。

3. 验证 Gateway 网关是否稳定且正在提供 RPC，而不仅仅是监听端口：

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID 样本应显示一个稳定的进程，而不是一组不断轮换的
   PID，并且入站渠道分发应恢复。

4. 升级到已修复底层双 LaunchAgent 循环的版本后，
   删除此变通方案并重新安装正常的托管服务：

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

相关内容：

- [macOS 平台说明](/zh-CN/platforms/mac/bundled-gateway)
- [Doctor](/zh-CN/gateway/doctor)
- [Gateway CLI](/zh-CN/cli/gateway)

## Gateway 网关在高内存使用期间退出

当 Gateway 网关在负载下消失、监管程序报告类似 OOM 的重启，或日志中提到 `critical memory pressure bundle written` 时使用。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

检查以下情况：

- 最新稳定性包中存在 `Reason: diagnostic.memory.pressure.critical`。
- `Memory pressure:` 中存在 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth`。
- `V8 heap:` 的值接近堆限制。
- `Largest session files:` 中存在类似 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl` 的条目。
- 当 Gateway 网关运行在容器或内存受限服务中时，检查 Linux cgroup 内存计数器。

常见特征：

- 重启前不久出现 `critical memory pressure bundle written` → OpenClaw 捕获了 OOM 前稳定性包。使用 `openclaw gateway stability --bundle latest` 检查该包。
- Gateway 网关日志中出现 `memory pressure: level=critical ... memoryPressureSnapshot=disabled` → OpenClaw 检测到严重内存压力，但 OOM 前稳定性快照已关闭。
- `Largest session files:` 指向一个非常大的已脱敏转录路径 → 减少保留的会话历史记录、检查会话增长情况，或在重启前将旧转录移出活动存储。
- `V8 heap:` 已用字节数接近堆限制 → 降低提示词/会话压力、减少并发工作，或仅在确认预期工作负载后提高 Node 堆限制。
- `Memory pressure: critical/rss_growth` → 内存在一个采样窗口内快速增长。检查最新日志中是否存在大型导入、失控的工具输出、重复重试或一批排队的智能体工作。
- 日志中出现严重内存压力但不存在稳定性包 → 这是默认行为。设置 `diagnostics.memoryPressureSnapshot: true`，以便在未来发生严重内存压力事件时捕获 OOM 前稳定性包。

稳定性包不含载荷。它包含运行内存证据和已脱敏的相对文件路径，不包含消息文本、webhook 正文、凭据、令牌、Cookie 或原始会话 ID。请将诊断导出附加到错误报告中，而不是复制原始日志。

相关内容：

- [Gateway 健康](/zh-CN/gateway/health)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [会话](/zh-CN/cli/sessions)

## Gateway 网关拒绝了无效配置

当 Gateway 网关启动因 `Invalid config` 失败，或热重载日志显示跳过了无效编辑时使用。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

检查以下情况：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 活动配置旁存在带时间戳的 `openclaw.json.rejected.*` 文件。
- 如果 `doctor --fix` 修复了损坏的直接编辑，则存在带时间戳的 `openclaw.json.clobbered.*` 文件。
- OpenClaw 会为每个配置路径保留最新的 32 个 `.clobbered.*` 文件，并轮换较旧的文件。

<AccordionGroup>
  <Accordion title="发生了什么">
    - 配置在启动、热重载或 OpenClaw 自有写入期间未能通过验证。
    - Gateway 网关启动采用失败时关闭策略，而不是重写 `openclaw.json`。
    - 热重载会跳过无效的外部编辑，并保持当前运行时配置处于活动状态。
    - OpenClaw 自有写入会在提交前拒绝无效/破坏性载荷，并保存 `.rejected.*`。
    - `openclaw doctor --fix` 负责修复。它可以删除非 JSON 前缀，或恢复最后已知良好的副本，同时将被拒绝的载荷保留为 `.clobbered.*`。
    - 当同一配置路径发生多次修复时，OpenClaw 会轮换较旧的 `.clobbered.*` 文件，以确保最新修复的载荷仍然可用。

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
    - 存在 `.clobbered.*` → Doctor 在修复活动配置时保留了损坏的外部编辑。
    - 存在 `.rejected.*` → OpenClaw 自有配置写入在提交前未通过架构或破坏检查。
    - `Config write rejected:` → 写入尝试丢弃必需结构、大幅缩小文件或持久化无效配置。
    - `config reload skipped (invalid config):` → 直接编辑未通过验证，并被正在运行的 Gateway 网关忽略。
    - `Invalid config at ...` → 启动在 Gateway 网关服务引导前失败。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 自有写入因相较于最后已知良好备份丢失字段或大小减少而被拒绝。
    - `Config last-known-good promotion skipped` → 候选项包含已脱敏的密钥占位符，例如 `***`。

  </Accordion>
  <Accordion title="修复选项">
    1. 运行 `openclaw doctor --fix`，让 Doctor 修复带前缀/被破坏的配置，或恢复最后已知良好版本。
    2. 仅从 `.clobbered.*` 或 `.rejected.*` 复制预期键，然后使用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 重启前运行 `openclaw config validate`。
    4. 如果手动编辑，请保留完整的 JSON5 配置，而不只是你想更改的部分对象。
  </Accordion>
</AccordionGroup>

相关内容：

- [配置](/zh-CN/cli/config)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能够连接到某个目标，但仍然输出警告块时使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

检查：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺少权限范围或无法解析的身份验证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍然尝试了直接探测已配置目标/local loopback 目标。
- `multiple reachable gateway identities detected` → 不同的 Gateway 网关作出了响应，或者 OpenClaw 无法证明可达目标属于同一个 Gateway 网关。即使传输端口不同，指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置的远程 URL 也会被视为具有多个传输方式的同一个 Gateway 网关。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受权限范围限制；请配对设备身份，或使用具有 `operator.read` 的凭据。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整的诊断 RPC 集超时或失败。应将其视为诊断功能降级但仍可达的 Gateway 网关；请比较 `--json` 输出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但此客户端仍需完成配对/审批，才能获得正常的操作员访问权限。
- 无法解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在此命令路径中，失败目标所需的身份验证材料不可用。

相关内容：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息未流转

如果渠道状态显示已连接，但消息流转停止，请重点检查策略、权限和渠道特有的投递规则。

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
- 缺少渠道 API 权限/权限范围。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待审批跟踪信息 → 发送者尚未获批。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道身份验证/权限问题。

相关内容：

- [渠道故障排查](/zh-CN/channels/troubleshooting)
- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)
- [WhatsApp](/zh-CN/channels/whatsapp)

## Cron 和 Heartbeat 投递

如果 cron 或 Heartbeat 未运行或未投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查：

- Cron 已启用且存在下次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `cron: timer tick failed` → 调度器时钟周期执行失败；请检查文件/日志/运行时错误。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 当前时间不在活跃时段窗口内。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但仅包含空白、注释、标题、代码围栏或空清单框架，因此 OpenClaw 会跳过模型调用。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次时钟周期没有任何到期任务。
    - `heartbeat: unknown accountId` → Heartbeat 投递目标的账户 ID 无效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → Heartbeat 目标解析为私信类目的地，而 `agents.defaults.heartbeat.directPolicy`（或按智能体覆盖项）设置为 `block`。

  </Accordion>
</AccordionGroup>

相关内容：

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [定时任务：故障排查](/zh-CN/automation/cron-jobs#troubleshooting)

## 节点已配对，但工具失败

如果节点已配对但工具失败，请分别排查前台状态、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查：

- 节点在线且具有预期能力。
- 摄像头/麦克风/位置/屏幕的操作系统权限授予情况。
- Exec 审批和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须处于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关内容：

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [节点故障排查](/zh-CN/nodes/troubleshooting)
- [节点](/zh-CN/nodes/index)

## 浏览器工具失败

当浏览器工具操作失败，但 Gateway 网关本身运行正常时使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

检查：

- 是否设置了 `plugins.allow`，且其中包含 `browser`。
- 浏览器可执行文件路径有效。
- CDP 配置文件可达。
- `existing-session` / `user` 配置文件所需的本地 Chrome 是否可用。

<AccordionGroup>
  <Accordion title="插件/可执行文件特征">
    - `unknown command "browser"` 或 `unknown command 'browser'` → `plugins.allow` 排除了内置浏览器插件。
    - 当 `browser.enabled=true` 时浏览器工具缺失/不可用 → `plugins.allow` 排除了 `browser`，因此插件从未加载。
    - `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 使用了错误或超出范围的端口。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少核心浏览器运行时依赖；请重新安装或更新 OpenClaw，然后重启 Gateway 网关。ARIA 快照和基本页面截图仍然可以使用，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到所选浏览器数据目录。请打开浏览器检查页面，启用远程调试，保持浏览器打开，批准首次附加提示，然后重试。如果不需要登录状态，建议使用托管的 `openclaw` 配置文件。
    - `No browser tabs found for profile="user"` → Chrome MCP 附加配置文件中没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 从 Gateway 网关主机无法访问配置的远程 CDP 端点。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或者 HTTP 端点已响应，但仍无法打开 CDP WebSocket。

  </Accordion>
  <Accordion title="元素/截图/上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，不能使用 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要使用快照引用，不能使用 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件中，每次调用只能上传一个文件。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件中的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 在 `profile="user"` / Chrome MCP existing-session 配置文件中使用 `act:type` 时，请省略 `timeoutMs`；如需自定义超时，请使用托管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍然需要托管浏览器或原始 CDP 配置文件。
    - 仅附加或远程 CDP 配置文件上残留的视口/深色模式/区域设置/离线覆盖项 → 运行 `openclaw browser stop --browser-profile <name>`，关闭活跃控制会话并释放 Playwright/CDP 模拟状态，而无需重启整个 Gateway 网关。

  </Accordion>
</AccordionGroup>

相关内容：

- [浏览器（由 OpenClaw 管理）](/zh-CN/tools/browser)
- [浏览器故障排查](/zh-CN/tools/browser-linux-troubleshooting)

## 如果升级后某些功能突然出现故障

大多数升级后故障由配置漂移或开始强制执行更严格的默认值所致。

<AccordionGroup>
  <Accordion title="1. 身份验证和 URL 覆盖行为发生变化">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    检查内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能以远程端点为目标，而本地服务本身运行正常。
    - 显式使用 `--url` 的调用不会回退到已存储的凭据。

    常见特征：

    - `gateway connect failed:` → URL 目标错误。
    - `unauthorized` → 端点可达，但身份验证错误。

  </Accordion>
  <Accordion title="2. 绑定和身份验证防护规则更加严格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    检查内容：

    - 非 local loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关身份验证路径：共享令牌/密码身份验证，或正确配置的非 local loopback `trusted-proxy` 部署。
    - `gateway.token` 等旧键不能替代 `gateway.auth.token`。

    常见特征：

    - `refusing to bind gateway ... without auth` → 非 local loopback 绑定缺少有效的 Gateway 网关身份验证路径。
    - 运行时正在运行，但出现 `Connectivity probe: failed` → Gateway 网关处于活动状态，但使用当前身份验证/URL 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态发生变化">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    检查内容：

    - 仪表板/节点是否存在待处理的设备审批。
    - 策略或身份变更后是否存在待处理的私信配对审批。

    常见特征：

    - `device identity required` → 设备身份验证要求未满足。
    - `pairing required` → 必须批准发送者/设备。

  </Accordion>
</AccordionGroup>

如果检查后服务配置和运行时仍不一致，请从同一配置文件/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [身份验证](/zh-CN/gateway/authentication)
- [后台 Exec 和进程工具](/zh-CN/gateway/background-process)
- [节点配对](/zh-CN/gateway/pairing)

## 相关内容

- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
- [Gateway 网关运行手册](/zh-CN/gateway)
