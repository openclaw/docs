---
read_when:
    - 处理认证配置文件解析或凭证路由时
    - 调试模型认证失败或配置文件顺序时
summary: 认证配置文件的规范凭证资格与解析语义
title: 凭证认证语义
x-i18n:
    generated_at: "2026-04-27T07:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1172a87053986567ac6051afe99946a9d36e1e838ce693cd56d56e71242d679
    source_path: auth-credential-semantics.md
    workflow: 15
---

本文档定义了以下各处使用的规范凭证资格与解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是保持选择时行为与运行时行为一致。

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

### 资格规则

1. 当 `token` 和 `tokenRef` 都不存在时，令牌配置文件不具备资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），则该配置文件不具备资格，原因为 `invalid_expires`。
5. 如果 `expires` 已过期，则该配置文件不具备资格，原因为 `expired`。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对于具备资格的配置文件，令牌内容可以从内联值或 `tokenRef` 解析得到。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 显式认证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或认证存储顺序覆盖时，`models status --probe` 只会探测该提供商已解析认证顺序中仍然保留的配置文件 id。
- 某个提供商的已存储配置文件如果被显式顺序省略，不会在之后被悄悄尝试。探测输出会将其报告为 `reasonCode: excluded_by_auth_order`，详情为 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自认证配置文件、环境变量凭证或 `models.json`。
- 如果某个提供商具有凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，则 `models status --probe` 会报告 `status: no_model` 和 `reasonCode: no_model`。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果某个配置文件凭证的 `type` 为 `oauth`，则该配置文件凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则会拒绝该配置文件的 `keyRef`/`tokenRef` SecretRef 支持输入。
- 违规会在启动/重载认证解析路径中导致硬失败。

## 兼容旧版的消息提示

为保持脚本兼容性，探测错误会保持以下首行不变：

`Auth profile credentials are missing or expired.`

可以在后续行中添加更适合人类阅读的详情和稳定原因代码。

## 相关内容

- [Secrets 管理](/zh-CN/gateway/secrets)
- [认证存储](/zh-CN/concepts/oauth)
