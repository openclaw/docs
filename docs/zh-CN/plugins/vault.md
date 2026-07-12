---
read_when:
    - 你希望 OpenClaw 从 HashiCorp Vault 读取 API 密钥
    - 你正在本地计算机或服务器上设置 SecretRefs
    - 你需要配置由 Vault 支持的模型提供商凭据
summary: 使用内置 Vault 插件从 HashiCorp Vault 解析 SecretRefs
title: 保管库 SecretRefs
x-i18n:
    generated_at: "2026-07-12T14:41:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Vault SecretRef

内置的 Vault 插件让 OpenClaw 能够在 Gateway 网关启动和重新加载时，从 HashiCorp Vault 解析 `exec` SecretRef。OpenClaw 在配置中存储 Vault 引用，将解析后的值保存在内存中的密钥快照里，并且不会将解析后的 API key 写回 `openclaw.json`。

如果你已经在运行 Vault，或者希望将模型提供商密钥存放在 OpenClaw 配置文件之外，请使用此功能。有关 SecretRef 运行时模型，请参阅[密钥管理](/zh-CN/gateway/secrets)。

## 开始之前

你需要：

- 提供内置 `vault` 插件的 OpenClaw
- 可访问的 Vault 服务器
- 能够生成客户端令牌的 Vault 身份验证，该令牌对 OpenClaw 应解析的密钥路径具有读取权限
- 启动 Gateway 网关的环境必须包含 `VAULT_ADDR`，以及以下方式之一：`VAULT_TOKEN`、配置了 `VAULT_TOKEN_FILE` 的 `OPENCLAW_VAULT_AUTH_METHOD=token_file`，或已配置的 JWT/Kubernetes 登录方式

解析器通过 Node 使用 HTTP 与 Vault 通信。Gateway 网关解析 SecretRef 时不需要 Vault CLI。

运行 `openclaw vault` 命令之前，请启用内置插件：

```bash
openclaw plugins enable vault
```

## 在 Vault 中存储提供商密钥

OpenClaw 默认使用挂载在 `secret` 的 KV v2，这与 Vault 开发服务器示例一致。对于生产环境中的 Vault，请在创建 SecretRef ID 之前，将 `OPENCLAW_VAULT_KV_MOUNT` 设置为实际的 KV 挂载路径。使用 OpenClaw 默认设置时，以下 SecretRef ID：

```text
providers/openrouter/apiKey
```

会读取此 Vault 字段：

```text
secret/data/providers/openrouter -> apiKey
```

使用 Vault CLI 创建它的一种方式是：

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

请为 OpenClaw 使用限定权限范围的客户端令牌，而不是根令牌。对于默认的 KV v2 布局，模型提供商密钥的最小策略如下：

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## 让 Gateway 网关能够访问 Vault

对于未容器化的本地 Gateway 网关，请在启动 OpenClaw 的同一 shell 中导出 Vault 设置。默认身份验证方法从 `VAULT_TOKEN` 读取 Vault 客户端令牌：

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

如果 Vault Agent 将令牌写入接收文件，请使用令牌文件身份验证：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

对于由私有 CA 签名的 Vault 服务器，可以将该 CA 安装到主机信任存储中，并启用 Node 系统信任：

```bash
export NODE_USE_SYSTEM_CA=1
```

或者直接提供 PEM 捆绑包：

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

OpenClaw 启动时必须存在这些变量。Vault 插件会将它们转发给其解析器进程。

对于非交互式 JWT 身份验证，请使用工作负载 JWT 文件和类型为 `jwt` 的 Vault 角色：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

JWT 文件应为投射的工作负载令牌，例如受 Vault 角色接受的受众限制的 Kubernetes 服务账号令牌。交互式 OIDC 浏览器登录适合人类用户，但 Gateway 网关运行时需要非交互式 JWT 登录或令牌文件。

对于 Vault 的 Kubernetes 身份验证方法，请使用 `kubernetes`。这适用于作为 Pod 运行的 Gateway 网关；默认挂载为 `kubernetes`，默认 JWT 文件是标准服务账号令牌路径：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

仅当 Vault 将 Kubernetes 身份验证挂载在 `auth/kubernetes` 以外的位置时，才设置 `OPENCLAW_VAULT_AUTH_MOUNT`。仅当服务账号令牌投射到自定义路径时，才设置 `OPENCLAW_VAULT_JWT_FILE`。

可选设置：

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

检查当前 shell 可以看到的内容：

```bash
openclaw vault status
```

配置了多个由 Vault 支持的密钥提供商时，请通过别名选择其中一个：

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` 绝不会打印 `VAULT_TOKEN`；它只报告令牌、令牌文件和 JWT 文件是否已设置。

<Warning>
如果 Gateway 网关作为服务、LaunchAgent、systemd 单元、定时任务或容器运行，该运行时环境必须接收相同的 Vault 变量。在交互式 shell 中设置变量只能证明该 shell 中的配置有效，不能证明已经在运行的 Gateway 网关中也有效。
</Warning>

## 生成并应用 SecretRef 计划

创建一个将 OpenRouter 的模型提供商 API key 映射到 Vault 的计划：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

应用并验证该计划：

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

请使用 `--allow-exec`，因为 Vault 插件通过由 OpenClaw 管理的 exec SecretRef 提供商进行解析。

如果 Gateway 网关尚未运行，请在应用计划后正常启动它，而不是运行 `openclaw secrets reload`。

## 配置更多提供商密钥

内置快捷方式：

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

在一个计划中配置多个提供商密钥：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

对于没有快捷方式的内置提供商，或已配置的 OpenAI 兼容提供商和自定义模型提供商，请使用 `--provider-key`：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

每个 `--provider-key <provider=id>` 都会向 `models.providers.<provider>.apiKey` 写入一个 SecretRef。对于自定义提供商，它不会创建该提供商的 `baseUrl`、`api` 或 `models` 设置；请先配置这些设置。

对任何已知的 SecretRef 目标路径使用 `--target <path=id>`：

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

不带前缀的目标路径应用于 `openclaw.json`。对于现有的 `auth-profiles.json` 目标，请使用 `auth-profiles:<agentId>:<path>`。目标路径必须是已注册的 OpenClaw SecretRef 目标。setup 命令不会在 OpenClaw 中创建任意命名的密钥；Vault 仍是密钥存储，而 OpenClaw 只在受支持的配置字段中存储 SecretRef。

## SecretRef ID 格式

Vault SecretRef ID 使用以下约定：

```text
<vault-secret-path>/<field>
```

示例：

| SecretRef ID                  | 默认 KV v2 Vault 读取路径           | 返回的字段 |
| ----------------------------- | ---------------------------------- | ---------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`   |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`   |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter` |

返回的 Vault 字段必须是字符串。

对于 KV v1，请设置：

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

此时，`providers/openrouter/apiKey` 会读取：

```text
secret/providers/openrouter -> apiKey
```

## OpenClaw 存储的内容

应用 Vault 设置计划会存储一个由插件管理的提供商：

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

凭据字段指向该提供商：

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

解析后的值仅存在于活动运行时密钥快照中。

## 容器和托管式部署

容器化的 Gateway 网关仍使用相同的插件和 SecretRef 配置。容器必须接收：

- `VAULT_ADDR`
- 一种身份验证来源：
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` 以及 `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` 以及 `OPENCLAW_VAULT_AUTH_MOUNT`、`OPENCLAW_VAULT_AUTH_ROLE` 和 `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` 以及 `OPENCLAW_VAULT_AUTH_ROLE`；可选择覆盖 `OPENCLAW_VAULT_AUTH_MOUNT` 或 `OPENCLAW_VAULT_JWT_FILE`
- 可选的 `VAULT_NAMESPACE`、`OPENCLAW_VAULT_KV_MOUNT` 和 `OPENCLAW_VAULT_KV_VERSION`

使用 Kubernetes 时，如果 Vault 已为该集群配置 Kubernetes 身份验证，请优先使用 `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`。仅当 Vault 配置为将该集群视为通用 JWT/OIDC 颁发者时，才使用 `OPENCLAW_VAULT_AUTH_METHOD=jwt`。这两种选项都优于在 Kubernetes Secret 中存储长期有效的 Vault 令牌。使用 Vault Agent sidecar 或注入器的部署可以改用 `token_file`。

对于多租户 Vault 设置，请将租户路由保留在 Vault 策略和部署配置中。OpenClaw 不要求使用固定挂载、角色或路径：每个 Gateway 网关环境都可以设置自己的 `OPENCLAW_VAULT_KV_MOUNT`、`OPENCLAW_VAULT_AUTH_ROLE` 和 SecretRef ID。如果一个共享 Gateway 网关必须同时为不同的 Vault 用户解析密钥，请使用手动配置的 exec 提供商封装不同的身份验证环境，或者将租户拆分到使用不同 Vault 环境变量的 Gateway 网关环境中。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [`openclaw secrets`](/zh-CN/cli/secrets)
- [插件清单](/zh-CN/plugins/plugin-inventory)
