---
read_when:
    - 配置用于提供商凭证和 `auth-profiles.json` 引用的 SecretRefs
    - 在生产环境中安全地重载、审计、配置和应用密钥
    - 了解启动时快速失败、非活跃表面过滤和最后已知良好行为
sidebarTitle: Secrets management
summary: 机密管理：SecretRef 契约、运行时快照行为和安全的单向清理
title: 机密信息管理
x-i18n:
    generated_at: "2026-04-28T11:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支持增量式 SecretRefs，因此受支持的凭证不需要以明文形式存储在配置中。

<Note>
明文仍然可用。SecretRefs 可按凭证选择启用。
</Note>

## 目标和运行时模型

密钥会被解析到内存中的运行时快照。

- 解析会在激活期间急切执行，而不是在请求路径上惰性执行。
- 当实际处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重新加载使用原子交换：要么完全成功，要么保留最后一个已知可用的快照。
- SecretRef 策略违规（例如 OAuth 模式的身份验证配置与 SecretRef 输入组合使用）会在运行时交换之前使激活失败。
- 运行时请求只从活动的内存快照读取。
- 第一次成功配置激活/加载后，运行时代码路径会持续读取该活动的内存快照，直到一次成功的重新加载将其交换。
- 出站投递路径也会从该活动快照读取（例如 Discord 回复/线程投递和 Telegram 操作发送）；它们不会在每次发送时重新解析 SecretRefs。

这会让密钥提供商故障远离热请求路径。

## 活动表面过滤

SecretRefs 只会在实际处于活动状态的表面上验证。

- 已启用的表面：未解析的引用会阻止启动/重新加载。
- 非活动表面：未解析的引用不会阻止启动/重新加载。
- 非活动引用会发出代码为 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 的非致命诊断。

<AccordionGroup>
  <Accordion title="非活动表面示例">
    - 已禁用的渠道/账户条目。
    - 没有任何已启用账户继承的顶层渠道凭证。
    - 已禁用的工具/功能表面。
    - 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用键。在 auto 模式（未设置提供商）下，会按优先级查询这些键，用于提供商自动检测，直到其中一个解析成功。选择完成后，未选中的提供商键会被视为非活动，直到被选中。
    - 沙箱 SSH 身份验证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及每个智能体的覆盖项）只有在默认智能体或已启用智能体的有效沙箱后端为 `ssh` 时才处于活动状态。
    - 如果以下任一条件为真，则 `gateway.remote.token` / `gateway.remote.password` SecretRefs 处于活动状态：
      - `gateway.mode=remote`
      - 已配置 `gateway.remote.url`
      - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
      - 在没有这些远程表面的本地模式下：
        - 当令牌身份验证可以获胜且未配置环境变量/身份验证令牌时，`gateway.remote.token` 处于活动状态。
        - 只有当密码身份验证可以获胜且未配置环境变量/身份验证密码时，`gateway.remote.password` 才处于活动状态。
    - 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动身份验证解析处于非活动状态，因为环境变量令牌输入会在该运行时获胜。

  </Accordion>
</AccordionGroup>

## Gateway 网关身份验证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上配置 SecretRef 时，Gateway 网关启动/重新加载会明确记录表面状态：

- `active`：SecretRef 是有效身份验证表面的一部分，必须成功解析。
- `inactive`：SecretRef 在此运行时会被忽略，因为另一个身份验证表面获胜，或因为远程身份验证已禁用/未激活。

这些条目会使用 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活动表面策略使用的原因，因此你可以看到某个凭证为何被视为活动或非活动。

## 新手引导引用预检

当新手引导以交互模式运行且你选择 SecretRef 存储时，OpenClaw 会在保存前运行预检验证：

- Env 引用：验证环境变量名称，并确认在设置期间可见的值非空。
- 提供商引用（`file` 或 `exec`）：验证提供商选择、解析 `id`，并检查解析后的值类型。
- Quickstart 复用路径：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会在探测/dashboard 引导前解析它（适用于 `env`、`file` 和 `exec` 引用），使用同一个快速失败门禁。

如果验证失败，新手引导会显示错误并让你重试。

## SecretRef 契约

在所有位置使用同一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须是绝对 JSON pointer（`/...`）
    - 分段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` 不得包含作为斜杠分隔路径片段的 `.` 或 `..`（例如 `a/../b` 会被拒绝）

  </Tab>
</Tabs>

## 提供商配置

在 `secrets.providers` 下定义提供商：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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

<AccordionGroup>
  <Accordion title="Env 提供商">
    - 可通过 `allowlist` 配置可选允许列表。
    - 缺失/空环境变量值会导致解析失败。

  </Accordion>
  <Accordion title="File 提供商">
    - 从 `path` 读取本地文件。
    - `mode: "json"` 需要 JSON 对象载荷，并将 `id` 作为 pointer 解析。
    - `mode: "singleValue"` 需要引用 id `"value"`，并返回文件内容。
    - 路径必须通过所有权/权限检查。
    - Windows fail-closed 注意事项：如果某个路径无法执行 ACL 验证，则解析失败。仅对可信路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

  </Accordion>
  <Accordion title="Exec 提供商">
    - 运行配置的绝对二进制路径，不使用 shell。
    - 默认情况下，`command` 必须指向常规文件（不是符号链接）。
    - 设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shims）。OpenClaw 会验证解析后的目标路径。
    - 将 `allowSymlinkCommand` 与 `trustedDirs` 搭配用于包管理器路径（例如 `["/opt/homebrew"]`）。
    - 支持超时、无输出超时、输出字节限制、环境变量允许列表和可信目录。
    - Windows fail-closed 注意事项：如果命令路径无法执行 ACL 验证，则解析失败。仅对可信路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

    请求载荷（stdin）：

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    响应载荷（stdout）：

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    可选的按 id 错误：

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exec 集成示例

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
</AccordionGroup>

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这会让 API 密钥和令牌不再出现在明文配置中：

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

明文字符串值仍然可用。类似 `${MCP_SERVER_API_KEY}` 的环境变量模板引用和 SecretRef 对象会在 Gateway 网关激活期间、MCP 服务器进程生成之前解析。与其他 SecretRef 表面一样，未解析的引用只有在 `acpx` 插件实际处于活动状态时才会阻止激活。

## 沙箱 SSH 身份验证材料

核心 `ssh` 沙箱后端也支持将 SecretRefs 用于 SSH 身份验证材料：

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

- OpenClaw 在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时惰性解析。
- 解析后的值会以严格权限写入临时文件，并用于生成的 SSH 配置。
- 如果有效的沙箱后端不是 `ssh`，这些引用会保持未激活状态，并且不会阻止启动。

## 支持的凭证范围

规范的受支持和不受支持凭证列在：

- [SecretRef 凭证范围](/zh-CN/reference/secretref-credential-surface)

<Note>
运行时铸造或轮换的凭证以及 OAuth 刷新材料会被有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 不带引用的字段：保持不变。
- 带引用的字段：在激活期间，对活跃范围是必需的。
- 如果明文和引用同时存在，在受支持的优先级路径上，引用优先。
- 脱敏哨兵值 `__OPENCLAW_REDACTED__` 保留用于内部配置脱敏/恢复，并会作为字面提交的配置数据被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭证优先于 `openclaw.json` 引用时的审计发现）

Google Chat 兼容性行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 设置同级引用时，明文值会被忽略。

## 激活触发器

Secret 激活会在以下情况下运行：

- 启动（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），用于在持久化编辑之前检查提交的配置载荷中活跃范围 SecretRef 的可解析性

激活契约：

- 成功会原子地交换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败会保留最后已知良好的快照。
- 写入 RPC 预检失败会拒绝提交的配置，并保持磁盘配置和活跃运行时快照都不变。
- 向出站辅助函数/工具调用提供显式的单次调用渠道令牌不会触发 SecretRef 激活；激活点仍然是启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当重载时激活在健康状态之后失败，OpenClaw 会进入 secrets 降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后已知良好的快照。
- 恢复：在下一次成功激活后发出一次。
- 在已降级状态下反复失败会记录警告，但不会重复刷屏事件。
- 启动快速失败不会发出降级事件，因为运行时从未变为活跃。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择启用受支持的 SecretRef 解析。

有两类广义行为：

<Tabs>
  <Tab title="严格命令路径">
    例如 `openclaw memory` 远程内存路径，以及需要远程共享密钥引用时的 `openclaw qr --remote`。它们从活跃快照读取，并在所需 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读 Doctor/配置修复流程。它们也优先使用活跃快照，但当目标 SecretRef 在该命令路径中不可用时会降级，而不是中止。

    只读行为：

    - 当 Gateway 网关正在运行时，这些命令会先从活跃快照读取。
    - 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会针对具体命令范围尝试有针对性的本地回退。
    - 如果目标 SecretRef 仍不可用，命令会继续输出降级的只读结果，并给出显式诊断，例如“已配置但在此命令路径中不可用”。
    - 这种降级行为仅限命令本地。它不会削弱运行时启动、重载或发送/认证路径。

  </Tab>
</Tabs>

其他说明：

- 后端 secret 轮换后的快照刷新由 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway 网关 RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

<Steps>
  <Step title="审计当前状态">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="配置 SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="重新审计">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    发现项包括：

    - 静态存储的明文值（`openclaw.json`、`auth-profiles.json`、`.env`，以及生成的 `agents/*/agent/models.json`）
    - 生成的 `models.json` 条目中残留的明文敏感提供商标头
    - 未解析的引用
    - 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 引用）
    - 旧版残留（`auth.json`、OAuth 提醒）

    Exec 说明：

    - 默认情况下，审计会跳过 exec SecretRef 可解析性检查，以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 exec 提供商。

    标头残留说明：

    - 敏感提供商标头检测基于名称启发式规则（常见认证/凭证标头名称和片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    交互式辅助工具会：

    - 先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/移除）
    - 让你为一个智能体范围选择 `openclaw.json` 加 `auth-profiles.json` 中受支持的带 secret 字段
    - 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射
    - 捕获 SecretRef 详细信息（`source`、`provider`、`id`）
    - 运行预检解析
    - 可以立即应用

    Exec 说明：

    - 除非设置 `--allow-exec`，否则预检会跳过 exec SecretRef 检查。
    - 如果你直接从 `configure --apply` 应用，并且计划包含 exec 引用/提供商，也要为应用步骤保留 `--allow-exec`。

    有用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 应用默认行为：

    - 从 `auth-profiles.json` 中清除目标提供商匹配的静态凭证
    - 从 `auth.json` 中清除旧版静态 `api_key` 条目
    - 从 `<config-dir>/.env` 中清除匹配的已知 secret 行

  </Accordion>
  <Accordion title="secrets apply">
    应用已保存的计划：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 说明：

    - dry-run 会跳过 exec 检查，除非设置了 `--allow-exec`。
    - 写入模式会拒绝包含 exec SecretRefs/提供商的计划，除非设置了 `--allow-exec`。

    有关严格目标/路径契约详情和精确拒绝规则，请参阅 [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 有意不会写入包含历史明文 secret 值的回滚备份。
</Warning>

安全模型：

- 写入模式之前预检必须成功
- 提交之前会验证运行时激活
- apply 使用原子文件替换更新文件，并在失败时尽力恢复

## 旧版认证兼容性说明

对于静态凭证，运行时不再依赖明文旧版认证存储。

- 运行时凭证来源是已解析的内存快照。
- 发现旧版静态 `api_key` 条目时会清除它们。
- OAuth 相关兼容性行为保持独立。

## Web UI 说明

有些 SecretInput 联合类型在原始编辑器模式中比表单模式更容易配置。

## 相关内容

- [认证](/zh-CN/gateway/authentication) — 认证设置
- [CLI：secrets](/zh-CN/cli/secrets) — CLI 命令
- [环境变量](/zh-CN/help/environment) — 环境优先级
- [SecretRef 凭证范围](/zh-CN/reference/secretref-credential-surface) — 凭证范围
- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract) — 计划契约详情
- [安全](/zh-CN/gateway/security) — 安全态势
