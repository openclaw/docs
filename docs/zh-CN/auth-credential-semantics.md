---
read_when:
    - 处理 auth 配置文件解析或凭证路由时
    - 调试模型认证失败或配置文件顺序时
summary: auth 配置文件的规范凭证资格与解析语义
title: 凭证语义
x-i18n:
    generated_at: "2026-04-24T04:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

本文档定义了以下各处使用的规范凭证资格与解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是使选择时行为与运行时行为保持一致。

## 稳定的探测原因代码

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token 凭证

Token 凭证（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 均不存在时，Token 配置文件不符合资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是一个大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），该配置文件不符合资格，原因为 `invalid_expires`。
5. 如果 `expires` 已经过期，该配置文件不符合资格，原因为 `expired`。
6. `tokenRef` 不会绕过对 `expires` 的校验。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对于符合资格的配置文件，Token 材料可以从内联值或 `tokenRef` 解析得到。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 显式 Auth 顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 只会探测在该提供商已解析 auth 顺序中仍然保留的配置文件 id。
- 属于该提供商但在显式顺序中被省略的已存储配置文件，后续不会被静默尝试。探测输出会将其报告为 `reasonCode: excluded_by_auth_order`，并带有详细信息 `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自 auth 配置文件、环境变量凭证或 `models.json`。
- 如果某个提供商具备凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，则 `models status --probe` 会报告 `status: no_model` 和 `reasonCode: no_model`。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果某个配置文件凭证的 `type` 为 `oauth`，则该配置文件凭证材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则会拒绝该配置文件基于 SecretRef 的 `keyRef`/`tokenRef` 输入。
- 在启动/重载 auth 解析路径中，违反这些规则会导致硬失败。

## 兼容旧版的消息

为保持脚本兼容性，探测错误会保持以下首行不变：

`Auth profile credentials are missing or expired.`

后续行可以添加更易于理解的详细信息和稳定的原因代码。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [Auth 存储](/zh-CN/concepts/oauth)
