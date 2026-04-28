---
read_when:
    - 为提供商凭证和 `auth-profiles.json` 引用配置 SecretRef
    - 在生产环境中安全地执行密钥重载、审计、配置和应用
    - 理解启动时快速失败、非活动表面过滤以及最后已知良好行为
sidebarTitle: Secrets management
summary: 密钥管理：SecretRef 契约、运行时快照行为，以及安全的单向清除
title: 密钥管理
x-i18n:
    generated_at: "2026-04-26T07:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw 支持增量式 SecretRef，因此受支持的凭证无需以明文形式存储在配置中。

<Note>
明文仍然可用。SecretRef 对每个凭证都是可选启用的。
</Note>

## 目标和运行时模型

密钥会被解析到内存中的运行时快照里。

- 解析会在激活期间急切执行，而不是在请求路径上延迟执行。
- 当实际上处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重载使用原子交换：要么全部成功，要么保留最后已知良好的快照。
- SecretRef 策略违规（例如 OAuth 模式认证配置文件与 SecretRef 输入组合使用）会在运行时交换之前导致激活失败。
- 运行时请求仅从活动的内存快照中读取。
- 在第一次成功的配置激活/加载之后，运行时代码路径会持续读取该活动的内存快照，直到某次成功的重载完成交换。
- 出站投递路径也会从该活动快照中读取（例如 Discord 回复/线程投递和 Telegram 动作发送）；它们不会在每次发送时重新解析 SecretRef。

这样可以避免把密钥提供商故障带到高频请求路径上。

## 活动表面过滤

SecretRef 仅会在实际上处于活动状态的表面上进行验证。

- 已启用表面：未解析的引用会阻止启动/重载。
- 非活动表面：未解析的引用不会阻止启动/重载。
- 非活动引用会发出非致命诊断，代码为 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`。

<AccordionGroup>
  <Accordion title="非活动表面的示例">
    - 已禁用的渠道/账号条目。
    - 没有任何启用账号继承的顶层渠道凭证。
    - 已禁用的工具/功能表面。
    - 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用键。在自动模式下（未设置提供商），系统会按优先级查询这些键以进行提供商自动检测，直到某个键成功解析。选定后，未选中的提供商键会被视为非活动，直到被选中为止。
    - 沙箱 SSH 认证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及每个智能体的覆盖项）仅在默认智能体或某个已启用智能体的有效沙箱后端为 `ssh` 时处于活动状态。
    - `gateway.remote.token` / `gateway.remote.password` SecretRef 在以下任一条件满足时处于活动状态：
      - `gateway.mode=remote`
      - 已配置 `gateway.remote.url`
      - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
      - 在本地模式下且不存在这些远程表面时：
        - 当 token 认证可能获胜且未配置 env/auth token 时，`gateway.remote.token` 处于活动状态。
        - 仅当 password 认证可能获胜且未配置 env/auth password 时，`gateway.remote.password` 才处于活动状态。
    - 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动认证解析而言是非活动的，因为该运行时会优先使用 env token 输入。

  </Accordion>
</AccordionGroup>

## Gateway 网关认证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上配置 SecretRef 时，Gateway 网关启动/重载会显式记录表面状态：

- `active`：该 SecretRef 是有效认证表面的一部分，必须能够解析。
- `inactive`：该 SecretRef 在当前运行时会被忽略，因为有其他认证表面优先，或因为远程认证已禁用/未激活。

这些条目会以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活动表面策略使用的原因，因此你可以看到某个凭证为何被视为活动或非活动。

## 新手引导引用预检

当新手引导在交互模式下运行且你选择使用 SecretRef 存储时，OpenClaw 会在保存前执行预检验证：

- Env 引用：验证环境变量名称，并确认在设置期间可见非空值。
- 提供商引用（`file` 或 `exec`）：验证提供商选择，解析 `id`，并检查解析后的值类型。
- 快速开始复用路径：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会在探测/仪表板引导之前解析它（适用于 `env`、`file` 和 `exec` 引用），并使用相同的快速失败门控。

如果验证失败，新手引导会显示错误并允许你重试。

## SecretRef 契约

在所有地方都使用同一种对象结构：

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
    - `id` 不能包含以斜杠分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

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

<AccordionGroup>
  <Accordion title="Env 提供商">
    - 可通过 `allowlist` 设置可选允许列表。
    - 缺失/为空的 env 值会导致解析失败。

  </Accordion>
  <Accordion title="File 提供商">
    - 从 `path` 读取本地文件。
    - `mode: "json"` 期望 JSON 对象负载，并将 `id` 作为 pointer 解析。
    - `mode: "singleValue"` 期望引用 id 为 `"value"`，并返回文件内容。
    - 路径必须通过所有权/权限检查。
    - Windows 失败即关闭说明：如果某个路径无法进行 ACL 验证，则解析失败。仅对受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

  </Accordion>
  <Accordion title="Exec 提供商">
    - 运行已配置的绝对二进制路径，不经过 shell。
    - 默认情况下，`command` 必须指向常规文件（而非符号链接）。
    - 设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shim）。OpenClaw 会验证解析后的目标路径。
    - 将 `allowSymlinkCommand` 与 `trustedDirs` 搭配使用，以支持包管理器路径（例如 `["/opt/homebrew"]`）。
    - 支持超时、无输出超时、输出字节限制、环境变量允许列表和受信任目录。
    - Windows 失败即关闭说明：如果命令路径无法进行 ACL 验证，则解析失败。仅对受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

    请求负载（stdin）：

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    响应负载（stdout）：

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    可选的逐 id 错误：

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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
  </Accordion>
  <Accordion title="sops">
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
  </Accordion>
</AccordionGroup>

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这样可以让 API key 和 token 不出现在明文配置中：

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

明文字符串值仍然可用。诸如 `${MCP_SERVER_API_KEY}` 这样的 env 模板引用以及 SecretRef 对象，都会在生成 MCP 服务器进程之前于 Gateway 网关激活期间被解析。与其他 SecretRef 表面一样，只有当 `acpx` 插件实际上处于活动状态时，未解析的引用才会阻止激活。

## 沙箱 SSH 认证材料

核心 `ssh` 沙箱后端同样支持用于 SSH 认证材料的 SecretRef：

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

- OpenClaw 会在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时延迟解析。
- 解析后的值会以严格权限写入临时文件，并用于生成的 SSH 配置。
- 如果有效沙箱后端不是 `ssh`，这些引用会保持非活动状态，不会阻止启动。

## 支持的凭证表面

规范的受支持和不受支持凭证列表见：

- [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)

<Note>
运行时铸造或轮换的凭证，以及 OAuth 刷新材料，会被有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 不带引用的字段：保持不变。
- 带有引用的字段：在活动表面上激活时为必需。
- 如果明文和引用同时存在，在受支持的优先级路径上，引用优先。
- 脱敏哨兵值 `__OPENCLAW_REDACTED__` 保留用于内部配置脱敏/恢复，作为字面提交的配置数据时会被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 中的凭证优先于 `openclaw.json` 中的引用时的审计发现）

Google Chat 兼容行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 当设置了同级引用时，明文值会被忽略。

## 激活触发点

密钥激活会在以下情况下运行：

- 启动时（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），会在持久化编辑前，对所提交配置负载中活动表面的 SecretRef 可解析性进行检查

激活契约：

- 成功时会原子性交换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败时会保留最后已知良好的快照。
- 写入 RPC 预检失败会拒绝提交的配置，并保持磁盘配置和活动运行时快照均不变。
- 为出站辅助函数/工具调用提供显式的逐调用渠道 token，不会触发 SecretRef 激活；激活点仍然仅限于启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当健康状态下的重载时激活失败后，OpenClaw 会进入密钥降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后已知良好的快照。
- 恢复：在下一次成功激活后仅发出一次。
- 在已处于降级状态时重复失败会记录警告，但不会刷屏事件。
- 启动快速失败不会发出降级事件，因为运行时从未进入活动状态。

## 命令路径解析

命令路径可通过 Gateway 网关快照 RPC 选择启用受支持的 SecretRef 解析。

主要有两类行为：

<Tabs>
  <Tab title="严格命令路径">
    例如 `openclaw memory` 远程内存路径，以及在需要远程共享密钥引用时的 `openclaw qr --remote`。它们会从活动快照中读取，并在所需 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读的 Doctor/配置修复流程。它们同样优先使用活动快照，但当目标 SecretRef 在该命令路径中不可用时，会降级而不是中止。

    只读行为：

    - 当 Gateway 网关正在运行时，这些命令会优先从活动快照中读取。
    - 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会尝试针对该特定命令表面的本地回退。
    - 如果目标 SecretRef 仍然不可用，命令会继续输出降级的只读结果，并带有明确诊断，例如“已配置但在此命令路径中不可用”。
    - 这种降级行为仅限命令本地。它不会削弱运行时启动、重载或发送/认证路径。

  </Tab>
</Tabs>

其他说明：

- 后端密钥轮换后的快照刷新由 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway 网关 RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

<Steps>
  <Step title="审计当前状态">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="配置 SecretRef">
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
    审计发现包括：

    - 静态存储中的明文值（`openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `agents/*/agent/models.json`）
    - 生成的 `models.json` 条目中明文敏感提供商头残留
    - 未解析的引用
    - 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 引用）
    - 遗留残留（`auth.json`、OAuth 提醒）

    Exec 说明：

    - 默认情况下，审计会跳过 exec SecretRef 可解析性检查，以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 exec 提供商。

    头残留说明：

    - 敏感提供商头检测基于名称启发式规则（常见认证/凭证头名称及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    一个交互式辅助工具，用于：

    - 先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/删除）
    - 让你在 `openclaw.json` 中选择受支持的携带密钥字段，以及某个智能体范围内的 `auth-profiles.json`
    - 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射
    - 收集 SecretRef 详情（`source`、`provider`、`id`）
    - 执行预检解析
    - 可立即应用

    Exec 说明：

    - 除非设置了 `--allow-exec`，否则预检会跳过 exec SecretRef 检查。
    - 如果你直接通过 `configure --apply` 应用，并且计划中包含 exec 引用/提供商，则在应用步骤中也要保留 `--allow-exec`。

    实用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 应用默认行为：

    - 清除 `auth-profiles.json` 中目标提供商对应的匹配静态凭证
    - 清除 `auth.json` 中遗留的静态 `api_key` 条目
    - 清除 `<config-dir>/.env` 中匹配的已知密钥行

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

    - 除非设置了 `--allow-exec`，否则 dry-run 会跳过 exec 检查。
    - 写入模式会拒绝包含 exec SecretRef/提供商的计划，除非设置了 `--allow-exec`。

    有关严格目标/路径契约细节和精确拒绝规则，请参阅 [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 故意不会写入包含历史明文密钥值的回滚备份。
</Warning>

安全模型：

- 写入模式前必须先通过预检
- 提交前会验证运行时激活
- apply 会使用原子文件替换更新文件，并在失败时尽最大努力恢复

## 遗留认证兼容性说明

对于静态凭证，运行时不再依赖明文遗留认证存储。

- 运行时凭证来源是已解析的内存快照。
- 发现后会清除遗留静态 `api_key` 条目。
- 与 OAuth 相关的兼容行为仍然单独处理。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式下比表单模式更容易配置。

## 相关内容

- [Authentication](/zh-CN/gateway/authentication) — 认证设置
- [CLI: secrets](/zh-CN/cli/secrets) — CLI 命令
- [环境变量](/zh-CN/help/environment) — 环境变量优先级
- [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface) — 凭证表面
- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract) — 计划契约详情
- [安全](/zh-CN/gateway/security) — 安全态势
