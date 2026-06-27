---
read_when:
    - 处理身份验证配置文件解析或凭证路由
    - 调试模型凭证失败或配置档顺序
summary: 认证配置档案的规范凭证资格判定与解析语义
title: 凭证语义
x-i18n:
    generated_at: "2026-06-27T01:18:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文档定义了以下各处使用的规范凭证资格和解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是让选择时行为和运行时行为保持一致。

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

1. 当 `token` 和 `tokenRef` 都不存在时，令牌配置文件不符合资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该配置文件不符合资格，并返回 `invalid_expires`。
5. 如果 `expires` 在过去，该配置文件不符合资格，并返回 `expired`。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器语义与 `expires` 的资格语义一致。
2. 对于符合资格的配置文件，令牌材料可以从内联值或 `tokenRef` 解析。
3. 无法解析的 ref 会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 副本可移植性

Agent 凭证继承是透传读取的。当某个 Agent 没有本地配置文件时，它可以在运行时从默认/主 Agent 存储解析配置文件，而无需将秘密材料复制到自己的 `auth-profiles.json` 中。

显式复制流程（例如 `openclaw agents add`）使用此可移植性策略：

- `api_key` 配置文件默认可移植，除非 `copyToAgents: false`。
- `token` 配置文件默认可移植，除非 `copyToAgents: false`。
- `oauth` 配置文件默认不可移植，因为刷新令牌可能是一次性的，或对轮换敏感。
- 提供商拥有的 OAuth 流程只有在已知跨 Agent 复制刷新材料是安全的情况下，才可以通过 `copyToAgents: true` 选择加入。

不可移植的配置文件仍可通过透传读取继承使用，除非目标 Agent 单独登录并创建自己的本地配置文件。

## 仅配置的凭证路由

带有 `mode: "aws-sdk"` 的 `auth.profiles` 条目是路由元数据，而不是存储的凭证。当目标提供商使用 `models.providers.<id>.auth: "aws-sdk"` 或插件拥有的 Amazon Bedrock 设置 AWS SDK 路由时，它们是有效的。即使 `auth-profiles.json` 中不存在匹配条目，这些配置文件 ID 也可以出现在 `auth.order` 和会话覆盖中。

不要将 `type: "aws-sdk"` 写入 `auth-profiles.json`。如果旧安装中有这样的标记，`openclaw doctor --fix` 会将其移动到 `auth.profiles`，并从凭证存储中移除该标记。

## 显式凭证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或凭证存储顺序覆盖时，`models status --probe` 只探测该提供商解析后凭证顺序中仍然存在的配置文件 ID。
- 对于该提供商的存储配置文件，如果被显式顺序省略，之后不会被静默尝试。探测输出会用 `reasonCode: excluded_by_auth_order` 和详情 `Excluded by auth.order for this provider.` 报告它。

## 探测目标解析

- 探测目标可以来自凭证配置文件、环境凭证或 `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析可探测的模型候选项，`models status --probe` 会报告 `status: no_model` 和 `reasonCode: no_model`。

## 外部 CLI 凭证发现

- 外部 CLI 拥有的仅运行时凭证，只有在提供商、运行时或凭证配置文件位于当前操作范围内，或者该外部来源已有存储的本地配置文件时，才会被发现。
- 凭证存储调用方应选择显式的外部 CLI 发现模式：`none` 表示仅使用持久化/插件凭证，`existing` 表示刷新已存储的外部 CLI 配置文件，`scoped` 表示具体的提供商/配置文件集合。
- 只读/状态路径传入 `allowKeychainPrompt: false`；它们只使用文件支持的外部 CLI 凭证，不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果配置文件凭证是 `type: "oauth"`，则该配置文件凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则该配置文件会拒绝由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 在启动/重载凭证解析路径中，违规会导致硬失败。

## 兼容旧版的消息

为保持脚本兼容性，探测错误会保持第一行不变：

`Auth profile credentials are missing or expired.`

后续行可以添加对人友好的详情和稳定原因代码。

## 相关

- [密钥管理](/zh-CN/gateway/secrets)
- [凭证存储](/zh-CN/concepts/oauth)
