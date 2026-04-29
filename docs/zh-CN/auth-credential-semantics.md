---
read_when:
    - 处理身份验证配置文件解析或凭证路由
    - 调试模型身份验证失败或配置文件顺序
summary: 身份验证配置文件的规范凭证适用条件和解析语义
title: 认证凭证语义
x-i18n:
    generated_at: "2026-04-29T11:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文档定义了以下位置使用的规范凭证资格判定和解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是让选择时和运行时行为保持一致。

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

1. 当 `token` 和 `tokenRef` 均不存在时，令牌 profile 不具备资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该 profile 不具备资格，并返回 `invalid_expires`。
5. 如果 `expires` 是过去时间，该 profile 不具备资格，并返回 `expired`。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器语义与 `expires` 的资格语义一致。
2. 对于具备资格的 profile，可以从内联值或 `tokenRef` 解析令牌材料。
3. 无法解析的 ref 会在 `models status --probe` 输出中产生 `unresolved_ref`。

## Agent 复制可移植性

Agent 凭证继承是透传读取的。当某个 agent 没有本地 profile 时，它可以在运行时从默认/主 agent 存储解析 profile，而不必把密钥材料复制到自己的 `auth-profiles.json`。

显式复制流程（例如 `openclaw agents add`）使用此可移植性策略：

- `api_key` profile 默认可移植，除非设置了 `copyToAgents: false`。
- `token` profile 默认可移植，除非设置了 `copyToAgents: false`。
- `oauth` profile 默认不可移植，因为刷新令牌可能是一次性使用或对轮换敏感的。
- 提供商拥有的 OAuth 流程只有在已知跨 agent 复制刷新材料是安全的情况下，才可以通过 `copyToAgents: true` 选择加入。

不可移植的 profile 仍可通过透传读取继承使用，除非目标 agent 单独登录并创建自己的本地 profile。

## 显式凭证顺序过滤

- 当某个提供商设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 只会探测仍保留在该提供商已解析凭证顺序中的 profile ID。
- 对于该提供商中已存储但被显式顺序省略的 profile，不会在稍后被静默尝试。探测输出会报告 `reasonCode: excluded_by_auth_order`，并附带详情 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自凭证 profile、环境凭证或 `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析可探测的模型候选项，`models status --probe` 会报告 `status: no_model`，并附带 `reasonCode: no_model`。

## 外部 CLI 凭证发现

- 外部 CLI 拥有的仅运行时凭证，只有当提供商、运行时或凭证 profile 在当前操作范围内，或者该外部来源的已存储本地 profile 已存在时，才会被发现。
- 只读/Status 路径会传递 `allowKeychainPrompt: false`；它们只使用文件支持的外部 CLI 凭证，并且不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果 profile 凭证是 `type: "oauth"`，则该 profile 凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则该 profile 会拒绝由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 违规会在启动/重新加载的凭证解析路径中导致硬失败。

## 旧版兼容消息

为保证脚本兼容性，探测错误会保持第一行不变：

`Auth profile credentials are missing or expired.`

可以在后续行添加便于人类阅读的详情和稳定原因代码。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [凭证存储](/zh-CN/concepts/oauth)
