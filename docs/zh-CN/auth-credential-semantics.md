---
read_when:
    - 处理凭证配置文件解析或凭证路由
    - 调试模型凭证失败或配置档顺序
summary: 认证配置文件的规范凭证资格与解析语义
title: 凭证语义
x-i18n:
    generated_at: "2026-07-05T11:00:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

这些语义让选择时和运行时的鉴权行为保持一致。它们由以下部分共享：

- `resolveAuthProfileOrder`（配置档排序）
- `resolveApiKeyForProfile`（运行时凭证解析）
- `openclaw models status --probe`
- `openclaw doctor` 鉴权检查（`doctor-auth`）

## 稳定的探测原因代码

探测结果会携带一个 `status` 分组（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`），并且在探测从未到达模型调用时携带稳定的 `reasonCode`：

| `reasonCode`             | 含义                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `excluded_by_auth_order` | 配置档已从其提供商的显式鉴权顺序中省略。               |
| `missing_credential`     | 未配置内联凭证或 SecretRef。                             |
| `expired`                | 令牌 `expires` 已经过期。                                              |
| `invalid_expires`        | `expires` 不是有效的正 Unix 毫秒时间戳。                         |
| `unresolved_ref`         | 无法解析已配置的 SecretRef。                                  |
| `ineligible_profile`     | 配置档与提供商配置不兼容（包括格式错误的密钥输入）。 |
| `no_model`               | 凭证存在，但未解析出可探测的模型候选项。                 |

资格检查会为可用凭证报告 `ok` 作为原因代码。

## 令牌凭证

令牌凭证（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 都不存在时，令牌配置档不符合资格（`missing_credential`）。
2. `expires` 是可选的。存在时，它必须是一个有限数字，表示大于 `0` 且不大于最大 JavaScript `Date` 时间戳（8640000000000000）的 Unix epoch 毫秒数。
3. 如果 `expires` 无效（类型错误、`NaN`、`0`、负数、非有限数，或超过该最大值），配置档不符合资格，并标记为 `invalid_expires`。
4. 如果 `expires` 在过去，配置档不符合资格，并标记为 `expired`。
5. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对于符合资格的配置档，令牌材料可以从内联值或 `tokenRef` 解析。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 副本可移植性

Agent 鉴权继承是透传读取的。当 Agent 没有本地配置档时，它会在运行时从默认/主 Agent 存储解析配置档，而不会把密钥材料复制到自己的凭证存储（`agents/<agentId>/agent/openclaw-agent.sqlite`）中。

显式复制流程，例如 `openclaw agents add`，使用此可移植性策略：

- `api_key` 和 `token` 配置档默认可移植，除非 `copyToAgents: false`。
- `oauth` 配置档默认不可移植，因为刷新令牌可能是一次性使用或对轮换敏感。
- 仅当已知跨 Agent 复制刷新材料是安全的，提供商拥有的 OAuth 流程才可以通过 `copyToAgents: true` 选择加入；该选择加入仅在配置档携带内联访问/刷新材料时适用。

不可移植的配置档仍可通过透传读取继承使用，除非目标 Agent 单独登录并创建自己的本地配置档。

## 仅配置的鉴权路由

带有 `mode: "aws-sdk"` 的 `auth.profiles` 条目是路由元数据，而不是存储的凭证。当目标提供商使用 `models.providers.<id>.auth: "aws-sdk"` 时，它们有效，这是插件拥有的 Amazon Bedrock 设置写入的路由。即使凭证存储中不存在匹配条目，这些配置档 ID 也可以出现在 `auth.order` 和会话覆盖中。

不要把 `type: "aws-sdk"` 写入凭证存储；存储的凭证只能是 `api_key`、`token` 或 `oauth`。如果旧版 `auth-profiles.json` 有这样的标记，`openclaw doctor --fix` 会将它移动到 `auth.profiles`，并从存储中移除该标记。

## 显式鉴权顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或鉴权存储顺序覆盖时，`models status --probe` 只会探测仍保留在该提供商已解析鉴权顺序中的配置档 ID。存储的覆盖优先于 `auth.order` 配置。
- 对于该提供商，如果某个已存储配置档被显式顺序省略，之后不会静默尝试它。探测输出会以 `reasonCode: excluded_by_auth_order` 报告它，并给出详细信息 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自鉴权配置档、环境凭证或 `models.json`（结果 `source`：`profile`、`env`、`models.json`）。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，`models status --probe` 会报告 `status: no_model`，并带有 `reasonCode: no_model`。

## 外部 CLI 凭证发现

- 由外部 CLI 拥有的仅运行时凭证（`claude-cli` 的 Claude CLI、`openai` 的 Codex CLI、`minimax-portal` 的 MiniMax CLI）只会在提供商、运行时或鉴权配置档处于当前操作范围内时被发现，或者在该外部来源的已存储本地配置档已经存在时被发现。
- 鉴权存储调用方会选择一种显式的外部 CLI 发现模式：`none` 表示仅使用持久化/插件鉴权，`existing` 表示刷新已存储的外部 CLI 配置档，`scoped` 表示针对具体提供商/配置档集合。
- 只读/状态路径会传递 `allowKeychainPrompt: false`；它们只使用基于文件的外部 CLI 凭证，不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略保护

SecretRef 输入仅用于静态凭证。OAuth 凭证在运行时可变（刷新流程会持久化轮换后的令牌），因此由 SecretRef 支持的 OAuth 材料会把可变状态拆分到多个存储中。

- 如果配置档凭证是 `type: "oauth"`，则该配置档上的任何凭证材料字段都会拒绝 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则会拒绝该配置档使用由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 违规会在启动/重载密钥准备和配置档解析路径中导致硬失败（抛出错误）。

## 旧版兼容消息

为了脚本兼容性，探测错误会保持第一行不变：

`Auth profile credentials are missing or expired.`

便于人类阅读的详情和稳定原因代码会在后续行中以 `↳ Auth reason [code]: ...` 的形式给出。

## 相关

- [密钥管理](/zh-CN/gateway/secrets)
- [鉴权存储](/zh-CN/concepts/oauth)
