---
read_when:
    - 为提供商凭证和 `auth-profiles.json` 引用配置 SecretRef
    - 在生产环境中安全地执行密钥重载、审计、配置和应用
    - 理解启动快速失败、非活动表面过滤和最后已知良好行为
summary: 密钥管理：SecretRef 契约、运行时快照行为，以及安全的单向清理
title: 密钥管理
x-i18n:
    generated_at: "2026-04-05T08:25:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# 密钥管理

OpenClaw 支持增量式 SecretRef，因此受支持的凭证无需以明文形式存储在配置中。

明文方式仍然可用。SecretRef 按凭证选择性启用。

## 目标和运行时模型

密钥会被解析到内存中的运行时快照里。

- 解析在激活期间预先进行，而不是在请求路径上惰性进行。
- 当一个实际处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重载使用原子替换：要么完全成功，要么保留最后已知良好的快照。
- SecretRef 策略违规（例如 OAuth 模式 auth profile 与 SecretRef 输入组合使用）会在运行时快照切换前导致激活失败。
- 运行时请求只从活动的内存快照中读取。
- 首次成功完成配置激活/加载后，运行时代码路径会持续读取该活动的内存快照，直到成功重载并替换它。
- 出站投递路径也从该活动快照读取（例如 Discord 回复/线程投递和 Telegram 动作发送）；它们不会在每次发送时重新解析 SecretRef。

这样可以让密钥提供商故障不落到高频请求路径上。

## 活动表面过滤

SecretRef 仅在实际处于活动状态的表面上进行校验。

- 已启用表面：未解析的引用会阻止启动/重载。
- 非活动表面：未解析的引用不会阻止启动/重载。
- 非活动引用会发出非致命诊断，代码为 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`。

非活动表面的示例：

- 已禁用的渠道/账户条目。
- 任何已启用账户都不会继承的顶层渠道凭证。
- 已禁用的工具/功能表面。
- 未被 `tools.web.search.provider` 选中的 web 搜索提供商专用密钥。
  在自动模式下（未设置 provider），系统会按优先级依次检查这些密钥以自动检测提供商，直到某一个成功解析。
  一旦选定后，未被选中的提供商密钥在被选中之前都会被视为非活动。
- 沙箱 SSH 鉴权材料（`agents.defaults.sandbox.ssh.identityData`、
  `certificateData`、`knownHostsData`，以及按智能体的覆盖项）仅在
  默认智能体或某个已启用智能体的有效沙箱后端为 `ssh` 时才处于活动状态。
- `gateway.remote.token` / `gateway.remote.password` SecretRef 在以下任一条件为真时处于活动状态：
  - `gateway.mode=remote`
  - 已配置 `gateway.remote.url`
  - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
  - 在本地模式且不存在上述远程表面的情况下：
    - 当 token 鉴权可能胜出，且未配置 env/auth token 时，`gateway.remote.token` 处于活动状态。
    - 仅当 password 鉴权可能胜出，且未配置 env/auth password 时，`gateway.remote.password` 才处于活动状态。
- 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动鉴权解析来说是非活动的，因为该运行时会优先使用 env token 输入。

## Gateway 网关鉴权表面诊断

当 `gateway.auth.token`、`gateway.auth.password`、
`gateway.remote.token` 或 `gateway.remote.password` 上配置了 SecretRef 时，Gateway 网关启动/重载会明确记录
该表面状态：

- `active`：该 SecretRef 属于有效鉴权表面的一部分，必须能够解析。
- `inactive`：由于其他鉴权表面优先，或
  因为远程鉴权被禁用/未激活，该 SecretRef 在当前运行时被忽略。

这些条目会以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含
活动表面策略使用的原因，以便你看到某个凭证为什么被视为活动或非活动。

## 新手引导引用预检

当新手引导以交互模式运行并且你选择 SecretRef 存储时，OpenClaw 会在保存前运行预检校验：

- Env 引用：校验环境变量名，并确认设置期间可见的值非空。
- Provider 引用（`file` 或 `exec`）：校验 provider 选择、解析 `id`，并检查解析值类型。
- 快速开始复用路径：当 `gateway.auth.token` 已经是一个 SecretRef 时，新手引导会在探测/dashboard bootstrap 之前解析它（适用于 `env`、`file` 和 `exec` 引用），并使用相同的快速失败门控。

如果校验失败，新手引导会显示错误并允许你重试。

## SecretRef 契约

在所有地方都使用同一种对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

校验：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

校验：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须是绝对 JSON pointer（`/...`）
- 分段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

校验：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` 不能包含作为斜杠分隔路径段的 `.` 或 `..`（例如 `a/../b` 会被拒绝）

## Provider 配置

在 `secrets.providers` 下定义 provider：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 或 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- 可通过 `allowlist` 配置可选 allowlist。
- 缺失/空的环境变量值会导致解析失败。

### File provider

- 从 `path` 读取本地文件。
- `mode: "json"` 期望 JSON 对象负载，并将 `id` 解析为 pointer。
- `mode: "singleValue"` 期望引用 id 为 `"value"`，并返回文件内容。
- 路径必须通过所有权/权限检查。
- Windows 快速失败说明：如果某个路径无法进行 ACL 校验，解析会失败。仅对可信路径，可在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

### Exec provider

- 运行已配置的绝对二进制路径，不通过 shell。
- 默认情况下，`command` 必须指向常规文件（不能是符号链接）。
- 设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shim）。OpenClaw 会校验解析后的目标路径。
- 建议将 `allowSymlinkCommand` 与 `trustedDirs` 一起用于包管理器路径（例如 `["/opt/homebrew"]`）。
- 支持 timeout、无输出 timeout、输出字节限制、环境变量 allowlist 和可信目录。
- Windows 快速失败说明：如果命令路径无法进行 ACL 校验，解析会失败。仅对可信路径，可在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

请求负载（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

响应负载（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

可选的按 id 返回错误：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec 集成示例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这样可避免将 API 密钥和 token 以明文写入配置：

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

明文字符串值仍然可用。类似 `${MCP_SERVER_API_KEY}` 的 env-template 引用以及 SecretRef 对象都会在 Gateway 网关激活期间、MCP 服务器进程启动之前完成解析。与其他 SecretRef 表面一样，只有在 `acpx` 插件实际上处于活动状态时，未解析引用才会阻止激活。

## 沙箱 SSH 鉴权材料

核心 `ssh` 沙箱后端也支持将 SecretRef 用于 SSH 鉴权材料：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

运行时行为：

- OpenClaw 会在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时惰性解析。
- 解析得到的值会被写入权限受限的临时文件，并用于生成的 SSH 配置。
- 如果有效沙箱后端不是 `ssh`，这些引用会保持非活动状态，不会阻止启动。

## 支持的凭证表面

规范的受支持和不受支持凭证列表见：

- [SecretRef 凭证表面](/reference/secretref-credential-surface)

运行时铸造或会轮换的凭证，以及 OAuth 刷新材料，均有意排除在只读 SecretRef 解析之外。

## 必需行为和优先级

- 字段没有 ref：行为不变。
- 字段有 ref：在活动表面上激活期间为必需项。
- 如果明文和 ref 同时存在，则在受支持的优先级路径上，ref 优先。
- 脱敏哨兵 `__OPENCLAW_REDACTED__` 保留用于内部配置脱敏/恢复，不接受作为字面提交的配置数据。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 中的凭证优先于 `openclaw.json` 中的引用时的审计发现）

Google Chat 兼容行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 当设置了同级 ref 时，明文值会被忽略。

## 激活触发器

密钥激活会在以下场景运行：

- 启动时（预检 + 最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），用于在持久化编辑前检查已提交配置负载中活动表面 SecretRef 的可解析性

激活契约：

- 成功时会原子替换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败会保留最后已知良好的快照。
- 写入 RPC 预检失败会拒绝已提交配置，并保持磁盘配置和活动运行时快照都不变。
- 为某次出站辅助函数/工具调用显式提供按调用级别的渠道 token，不会触发 SecretRef 激活；激活点仍然只有启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当健康状态之后的重载时激活失败时，OpenClaw 会进入密钥降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后已知良好的快照。
- 恢复：在下一次成功激活后只发出一次。
- 如果已经处于降级状态时再次失败，只会记录警告，不会刷屏式地产生事件。
- 启动快速失败不会发出降级事件，因为运行时从未真正进入活动状态。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择启用受支持的 SecretRef 解析。

大体有两种行为：

- 严格命令路径（例如 `openclaw memory` 远程记忆路径，以及 `openclaw qr --remote` 在需要远程共享密钥引用时）会从活动快照中读取，并在必需 SecretRef 不可用时快速失败。
- 只读命令路径（例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读的 doctor/config 修复流程）也会优先使用活动快照，但当目标 SecretRef 在该命令路径中不可用时会降级，而不是中止。

只读行为：

- 当 Gateway 网关正在运行时，这些命令会首先从活动快照读取。
- 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会针对具体命令表面尝试有针对性的本地回退。
- 如果目标 SecretRef 仍然不可用，命令会继续输出降级的只读结果，并给出明确诊断，例如“configured but unavailable in this command path”。
- 这种降级行为仅限命令本地。它不会削弱运行时启动、重载或发送/鉴权路径。

其他说明：

- 在后端密钥轮换后的快照刷新通过 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway 网关 RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

发现项包括：

- 静态存储的明文值（`openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `agents/*/agent/models.json`）
- 生成的 `models.json` 条目中明文敏感 provider header 残留
- 未解析的引用
- 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 中的引用）
- 旧版残留（`auth.json`、OAuth 提醒项）

Exec 说明：

- 默认情况下，审计会跳过 exec SecretRef 可解析性检查，以避免命令副作用。
- 使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 exec provider。

Header 残留说明：

- 敏感 provider header 检测基于名称启发式规则（常见鉴权/凭证 header 名称及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

### `secrets configure`

交互式辅助工具，功能包括：

- 先配置 `secrets.providers`（`env`/`file`/`exec`，支持添加/编辑/删除）
- 让你在 `openclaw.json` 以及单个智能体范围内的 `auth-profiles.json` 中选择受支持的带密钥字段
- 可以在目标选择器中直接创建新的 `auth-profiles.json` 映射
- 收集 SecretRef 详情（`source`、`provider`、`id`）
- 运行预检解析
- 可立即应用

Exec 说明：

- 预检会跳过 exec SecretRef 检查，除非设置了 `--allow-exec`。
- 如果你直接通过 `configure --apply` 应用，并且计划中包含 exec 引用/provider，则在 apply 步骤中也要保持设置 `--allow-exec`。

实用模式：

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` 的 apply 默认行为：

- 清理 `auth-profiles.json` 中目标 provider 对应的静态凭证
- 清理 `auth.json` 中旧版静态 `api_key` 条目
- 清理 `<config-dir>/.env` 中匹配的已知密钥行

### `secrets apply`

应用已保存的计划：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec 说明：

- dry-run 会跳过 exec 检查，除非设置了 `--allow-exec`。
- 写入模式会拒绝包含 exec SecretRef/provider 的计划，除非设置了 `--allow-exec`。

有关严格的目标/路径契约详情和精确拒绝规则，请参见：

- [密钥应用计划契约](/gateway/secrets-plan-contract)

## 单向安全策略

OpenClaw 有意不写入包含历史明文密钥值的回滚备份。

安全模型：

- 写入模式前，预检必须成功
- 提交前会验证运行时激活
- apply 使用原子文件替换更新文件，并在失败时尽力恢复

## 旧版鉴权兼容性说明

对于静态凭证，运行时不再依赖明文旧版鉴权存储。

- 运行时凭证来源是解析后的内存快照。
- 一旦发现旧版静态 `api_key` 条目，就会被清理。
- 与 OAuth 相关的兼容行为仍单独处理。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式下比在表单模式下更容易配置。

## 相关文档

- CLI 命令：[secrets](/cli/secrets)
- 计划契约详情：[密钥应用计划契约](/gateway/secrets-plan-contract)
- 凭证表面：[SecretRef 凭证表面](/reference/secretref-credential-surface)
- 鉴权设置：[鉴权](/gateway/authentication)
- 安全态势：[安全](/gateway/security)
- 环境变量优先级：[环境变量](/help/environment)
