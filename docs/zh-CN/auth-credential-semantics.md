---
read_when:
    - 处理认证配置文件解析或凭据路由
    - 调试模型凭证失败或配置文件顺序
summary: 认证配置文件的规范凭证适用性与解析语义
title: 身份验证凭据语义
x-i18n:
    generated_at: "2026-04-29T10:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f235d0c43a6cb38edf76762d530c2316ff62dfa16204875b80704b58324c176
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文档定义了在以下场景中使用的规范凭证资格判定和解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是保持选择时行为和运行时行为一致。

## 稳定的探测原因代码

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## 令牌凭证

令牌凭证（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格判定规则

1. 当 `token` 和 `tokenRef` 都不存在时，令牌配置文件不符合资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该配置文件不符合资格，原因是 `invalid_expires`。
5. 如果 `expires` 已过期，该配置文件不符合资格，原因是 `expired`。
6. `tokenRef` 不会绕过 `expires` 校验。

### 解析规则

1. 解析器语义与 `expires` 的资格判定语义一致。
2. 对于符合资格的配置文件，令牌材料可以从内联值或 `tokenRef` 解析。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 智能体复制可移植性

智能体凭证继承是透传读取的。当智能体没有本地配置文件时，它可以在运行时从默认/主智能体存储解析配置文件，而无需将秘密材料复制到自己的 `auth-profiles.json` 中。

显式复制流程（例如 `openclaw agents add`）使用此可移植性策略：

- `api_key` 配置文件默认可移植，除非 `copyToAgents: false`。
- `token` 配置文件默认可移植，除非 `copyToAgents: false`。
- `oauth` 配置文件默认不可移植，因为刷新令牌可能是一次性使用或对轮换敏感的。
- 提供商拥有的 OAuth 流程仅在已知跨智能体复制刷新材料安全时，才可以通过 `copyToAgents: true` 选择启用。

不可移植的配置文件仍可通过透传读取继承使用，除非目标智能体单独登录并创建自己的本地配置文件。

## 显式凭证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或认证存储顺序覆盖时，`models status --probe` 只会探测仍保留在该提供商已解析凭证顺序中的配置文件 ID。
- 该提供商的已存储配置文件如果被显式顺序省略，之后不会被静默尝试。探测输出会用 `reasonCode: excluded_by_auth_order` 报告它，并附带详情 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自凭证配置文件、环境凭证或 `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析可探测的模型候选项，`models status --probe` 会报告 `status: no_model`，并附带 `reasonCode: no_model`。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果配置文件凭证是 `type: "oauth"`，则该配置文件凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则会拒绝该配置文件使用由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 违规会导致启动/重载凭证解析路径中的硬失败。

## 旧版兼容消息

为保持脚本兼容性，探测错误会保持此首行不变：

`Auth profile credentials are missing or expired.`

后续行可能会添加更便于人类阅读的详情和稳定的原因代码。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [凭证存储](/zh-CN/concepts/oauth)
