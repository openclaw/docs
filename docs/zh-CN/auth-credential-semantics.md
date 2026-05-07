---
read_when:
    - 处理认证配置文件解析或凭证路由
    - 排查模型凭证失败或配置档案顺序问题
summary: 认证配置文件的规范凭证资格和解析语义
title: 认证凭证语义
x-i18n:
    generated_at: "2026-05-07T13:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文档定义了以下各处使用的规范凭证资格与解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是保持选择时行为与运行时行为一致。

## 稳定探测原因代码

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## 令牌凭证

令牌凭证（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 都不存在时，令牌配置档案不符合条件。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该配置档案不符合条件，并带有 `invalid_expires`。
5. 如果 `expires` 已过去，该配置档案不符合条件，并带有 `expired`。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对于符合条件的配置档案，可以从内联值或 `tokenRef` 解析令牌材料。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 副本可移植性

智能体认证继承是读取穿透式的。当智能体没有本地配置档案时，它可以在运行时从默认/主智能体存储解析配置档案，而无需将密钥材料复制到自己的 `auth-profiles.json` 中。

显式复制流程（例如 `openclaw agents add`）使用以下可移植性策略：

- `api_key` 配置档案默认可移植，除非设置了 `copyToAgents: false`。
- `token` 配置档案默认可移植，除非设置了 `copyToAgents: false`。
- `oauth` 配置档案默认不可移植，因为刷新令牌可能是一次性的，或对轮换敏感。
- 提供商拥有的 OAuth 流程只有在已知跨智能体复制刷新材料是安全的情况下，才可以通过 `copyToAgents: true` 选择加入。

不可移植的配置档案仍可通过读取穿透式继承使用，除非目标智能体单独登录并创建自己的本地配置档案。

## 仅配置认证路由

带有 `mode: "aws-sdk"` 的 `auth.profiles` 条目是路由元数据，而不是存储的凭证。当目标提供商使用 `models.providers.<id>.auth: "aws-sdk"` 或内置 Amazon Bedrock 默认 AWS SDK 路由时，这些条目有效。即使 `auth-profiles.json` 中不存在匹配条目，这些配置档案 ID 也可以出现在 `auth.order` 和会话覆盖中。

不要将 `type: "aws-sdk"` 写入 `auth-profiles.json`。如果旧版安装中有此类标记，`openclaw doctor --fix` 会将其移动到 `auth.profiles`，并从凭证存储中移除该标记。

## 显式认证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或认证存储顺序覆盖时，`models status --probe` 只探测仍保留在该提供商已解析认证顺序中的配置档案 ID。
- 对于该提供商存储的配置档案，如果被显式顺序省略，之后不会被静默尝试。探测输出会用 `reasonCode: excluded_by_auth_order` 报告它，并附带详情 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自认证配置档案、环境凭证或 `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，`models status --probe` 会报告 `status: no_model`，并带有 `reasonCode: no_model`。

## 外部 CLI 凭证发现

- 外部 CLI 拥有的仅运行时凭证，只有在该提供商、运行时或认证配置档案处于当前操作范围内，或该外部来源已有存储的本地配置档案时，才会被发现。
- 认证存储调用方应选择显式外部 CLI 发现模式：`none` 用于仅持久化/插件认证，`existing` 用于刷新已存储的外部 CLI 配置档案，或 `scoped` 用于具体的提供商/配置档案集合。
- 只读/Status 路径会传递 `allowKeychainPrompt: false`；它们只使用文件支持的外部 CLI 凭证，不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略防护

- SecretRef 输入仅用于静态凭证。
- 如果配置档案凭证为 `type: "oauth"`，则该配置档案凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则会拒绝该配置档案使用 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 违规会在启动/重载认证解析路径中导致硬失败。

## 兼容旧版的消息

为保持脚本兼容性，探测错误会保持以下第一行不变：

`Auth profile credentials are missing or expired.`

可在后续行中添加面向用户的详情和稳定原因代码。

## 相关

- [密钥管理](/zh-CN/gateway/secrets)
- [认证存储](/zh-CN/concepts/oauth)
