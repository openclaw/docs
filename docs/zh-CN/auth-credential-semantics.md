---
read_when:
    - 处理认证配置文件解析或凭证路由
    - 调试模型身份验证失败或配置文件顺序
summary: 认证配置档案的规范凭证适用条件与解析语义
title: 认证凭证语义
x-i18n:
    generated_at: "2026-04-30T20:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文档定义以下各处使用的规范凭证可用性和解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是让选择阶段和运行时行为保持一致。

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

### 可用性规则

1. 当 `token` 和 `tokenRef` 都缺失时，令牌配置档案不可用。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该配置档案不可用，原因是 `invalid_expires`。
5. 如果 `expires` 是过去时间，该配置档案不可用，原因是 `expired`。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器对 `expires` 的语义与可用性语义一致。
2. 对于可用配置档案，令牌材料可以从内联值或 `tokenRef` 解析。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 智能体复制可移植性

智能体认证继承是透传读取的。当智能体没有本地配置档案时，它可以在运行时从默认/主智能体存储解析配置档案，而无需将密钥材料复制到自己的 `auth-profiles.json` 中。

显式复制流程（例如 `openclaw agents add`）使用以下可移植性策略：

- `api_key` 配置档案可移植，除非设置了 `copyToAgents: false`。
- `token` 配置档案可移植，除非设置了 `copyToAgents: false`。
- `oauth` 配置档案默认不可移植，因为刷新令牌可能是一次性的，或对轮换敏感。
- 提供商拥有的 OAuth 流只有在确认跨智能体复制刷新材料是安全的情况下，才可以通过 `copyToAgents: true` 选择加入。

不可移植的配置档案仍可通过透传读取继承使用，除非目标智能体单独登录并创建自己的本地配置档案。

## 显式认证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 只会探测该提供商已解析认证顺序中仍然存在的配置档案 ID。
- 该提供商存储的配置档案如果被显式顺序省略，不会在之后被静默尝试。探测输出会以 `reasonCode: excluded_by_auth_order` 报告它，并附带详情 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自认证配置档案、环境凭证或 `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，`models status --probe` 会报告 `status: no_model`，并带有 `reasonCode: no_model`。

## 外部 CLI 凭证发现

- 外部 CLI 拥有的仅运行时凭证，只会在该提供商、运行时或认证配置档案处于当前操作范围内时被发现，或者在该外部来源已有已存储的本地配置档案时被发现。
- Auth-store 调用方应选择显式的外部 CLI 发现模式：`none` 表示仅使用持久化/插件认证，`existing` 表示刷新已存储的外部 CLI 配置档案，或 `scoped` 表示使用具体的提供商/配置档案集合。
- 只读/Status 路径会传递 `allowKeychainPrompt: false`；它们只使用文件支持的外部 CLI 凭证，不会读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略防护

- SecretRef 输入仅用于静态凭证。
- 如果配置档案凭证是 `type: "oauth"`，该配置档案凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则会拒绝该配置档案中由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。
- 违规会在启动/重载认证解析路径中导致硬失败。

## 旧版兼容消息

为保持脚本兼容性，探测错误会保持第一行不变：

`Auth profile credentials are missing or expired.`

后续行可以添加便于人类理解的详情和稳定原因代码。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [认证存储](/zh-CN/concepts/oauth)
