---
read_when:
    - 处理身份验证配置文件解析或凭据路由
    - 调试模型身份验证失败或配置文件顺序
summary: 身份验证配置文件的规范凭据资格与解析语义
title: 身份验证凭据语义
x-i18n:
    generated_at: "2026-07-11T20:18:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

这些语义可确保选择时与运行时的身份验证行为保持一致。以下功能共享这些语义：

- `resolveAuthProfileOrder`（配置文件排序）
- `resolveApiKeyForProfile`（运行时凭据解析）
- `openclaw models status --probe`
- `openclaw doctor` 身份验证检查（`doctor-auth`）

## 稳定的探测原因代码

探测结果包含一个 `status` 分类（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`）；如果探测从未执行模型调用，还会包含稳定的 `reasonCode`：

| `reasonCode`             | 含义                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `excluded_by_auth_order` | 配置文件未包含在其提供商的显式身份验证顺序中。                      |
| `missing_credential`     | 未配置内联凭据或 SecretRef。                                        |
| `expired`                | 令牌的 `expires` 已过期。                                           |
| `invalid_expires`        | `expires` 不是有效的正数 Unix 毫秒时间戳。                          |
| `unresolved_ref`         | 无法解析已配置的 SecretRef。                                        |
| `ineligible_profile`     | 配置文件与提供商配置不兼容（包括格式错误的密钥输入）。              |
| `no_model`               | 凭据存在，但未解析出可供探测的候选模型。                            |

资格检查会将可用凭据的原因代码报告为 `ok`。

## 令牌凭据

令牌凭据（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 均不存在时，令牌配置文件不符合资格（`missing_credential`）。
2. `expires` 是可选的。提供时，它必须是一个有限的 Unix 纪元毫秒数，值大于 `0`，且不超过 JavaScript `Date` 时间戳的最大值（8640000000000000）。
3. 如果 `expires` 无效（类型错误、`NaN`、`0`、负数、非有限值或超过该最大值），配置文件将因 `invalid_expires` 而不符合资格。
4. 如果 `expires` 已过期，配置文件将因 `expired` 而不符合资格。
5. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器对 `expires` 的语义与资格检查语义一致。
2. 对于符合资格的配置文件，可以从内联值或 `tokenRef` 解析令牌材料。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 复制可移植性

Agent 身份验证继承采用透传读取方式。当某个 Agent 没有本地配置文件时，它会在运行时从默认/主 Agent 存储中解析配置文件，而不会将机密材料复制到自己的凭据存储（`agents/<agentId>/agent/openclaw-agent.sqlite`）中。

显式复制流程（例如 `openclaw agents add`）使用以下可移植性策略：

- 除非设置了 `copyToAgents: false`，否则 `api_key` 和 `token` 配置文件可移植。
- 默认情况下，`oauth` 配置文件不可移植，因为刷新令牌可能只能使用一次，或对轮换操作敏感。
- 仅当已知在 Agent 之间复制刷新材料是安全的情况下，提供商自有的 OAuth 流程才可通过 `copyToAgents: true` 选择启用；此选择启用仅在配置文件包含内联访问/刷新材料时适用。

不可移植的配置文件仍可通过透传读取继承使用，除非目标 Agent 单独登录并创建自己的本地配置文件。

## 仅配置的身份验证路由

具有 `mode: "aws-sdk"` 的 `auth.profiles` 条目是路由元数据，而非存储的凭据。当目标提供商使用 `models.providers.<id>.auth: "aws-sdk"` 时，这些条目有效；这是插件自有的 Amazon Bedrock 设置所写入的路由。即使凭据存储中没有匹配的条目，这些配置文件 ID 也可以出现在 `auth.order` 和会话覆盖中。

不要将 `type: "aws-sdk"` 写入凭据存储；存储的凭据只能是 `api_key`、`token` 或 `oauth`。如果旧版 `auth-profiles.json` 包含此类标记，`openclaw doctor --fix` 会将其移至 `auth.profiles`，并从存储中移除该标记。

## 显式身份验证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或身份验证存储顺序覆盖时，`models status --probe` 仅探测仍保留在该提供商最终身份验证顺序中的配置文件 ID。存储的覆盖优先于 `auth.order` 配置。
- 如果该提供商的某个已存储配置文件未包含在显式顺序中，系统不会在之后静默尝试它。探测输出会报告 `reasonCode: excluded_by_auth_order`，并附带详细信息 `Excluded by auth.order for this provider.`。

## 探测目标解析

- 探测目标可以来自身份验证配置文件、环境凭据或 `models.json`（结果的 `source` 为 `profile`、`env` 或 `models.json`）。
- 如果某个提供商拥有凭据，但 OpenClaw 无法为其解析出可供探测的候选模型，`models status --probe` 会报告 `status: no_model` 和 `reasonCode: no_model`。

## 外部 CLI 凭据发现

- 外部 CLI 自有的仅运行时凭据（`claude-cli` 的 Claude CLI、`openai` 的 Codex CLI、`minimax-portal` 的 MiniMax CLI）仅在提供商、运行时或身份验证配置文件处于当前操作范围内时发现，或者在已存在该外部来源的本地存储配置文件时发现。
- 身份验证存储调用方会选择显式的外部 CLI 发现模式：`none` 表示仅使用持久化/插件身份验证，`existing` 表示刷新已存储的外部 CLI 配置文件，`scoped` 表示使用具体的提供商/配置文件集合。
- 只读/状态路径会传入 `allowKeychainPrompt: false`；它们仅使用基于文件的外部 CLI 凭据，不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略防护

SecretRef 输入仅用于静态凭据。OAuth 凭据可在运行时变更（刷新流程会持久化轮换后的令牌），因此由 SecretRef 支持的 OAuth 材料会将可变状态分散到多个存储中。

- 如果配置文件凭据为 `type: "oauth"`，则该配置文件的任何凭据材料字段都不接受 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则不接受该配置文件由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 在启动/重新加载机密准备和配置文件解析路径中，违规情况属于硬失败（抛出错误）。

## 兼容旧版的消息文本

为保持脚本兼容性，探测错误会原样保留以下首行：

`Auth profile credentials are missing or expired.`

便于理解的详细信息和稳定原因代码会显示在后续行中，格式为 `↳ Auth reason [code]: ...`。

## 相关内容

- [机密管理](/zh-CN/gateway/secrets)
- [身份验证存储](/zh-CN/concepts/oauth)
