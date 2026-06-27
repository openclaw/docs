---
read_when:
    - 生成或审查 `openclaw secrets apply` 计划
    - 调试 `Invalid plan target path` 错误
    - 理解目标类型和路径验证行为
summary: '`secrets apply` 计划的契约：目标验证、路径匹配和 `auth-profiles.json` 目标范围'
title: 密钥应用计划契约
x-i18n:
    generated_at: "2026-06-27T02:07:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

此页面定义了 `openclaw secrets apply` 强制执行的严格契约。

如果目标不符合这些规则，apply 会在更改配置之前失败。

## 计划文件形状

`openclaw secrets apply --from <plan.json>` 需要一个包含计划目标的 `targets` 数组：

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## 提供商更新插入和删除

计划还可以包含两个可选的顶层字段，用于在逐目标写入的同时更改
`secrets.providers` 映射：

- `providerUpserts` — 一个按提供商别名作为键的对象。每个值都是一个
  提供商定义（与 `openclaw.json` 中 `secrets.providers.<alias>` 下接受的形状相同，
  例如 `exec` 或 `file` 提供商）。
- `providerDeletes` — 要移除的提供商别名数组。

`providerUpserts` 会在 `targets` 之前运行，因此 `target.ref.provider` 可以
引用同一计划在 `providerUpserts` 中引入的提供商别名。否则，引用尚未在
`openclaw.json` 中配置的别名的计划会失败，并显示 `provider "<alias>" is not
configured`。

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

通过 `providerUpserts` 引入的 Exec 提供商仍受 [Exec 提供商同意行为](#exec-provider-consent-behavior)中的
exec 同意规则约束：包含 exec 提供商的计划在写入模式下需要 `--allow-exec`。

## 支持的目标范围

计划目标会在以下位置的受支持凭据路径中被接受：

- [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)

## 目标类型行为

通用规则：

- `target.type` 必须可识别，并且必须匹配规范化后的 `target.path` 形状。

为了兼容现有计划，仍接受兼容性别名：

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 路径验证规则

每个目标都会使用以下全部规则进行验证：

- `type` 必须是可识别的目标类型。
- `path` 必须是非空的点分隔路径。
- `pathSegments` 可以省略。如果提供，它必须规范化为与 `path` 完全相同的路径。
- 禁止的段会被拒绝：`__proto__`、`prototype`、`constructor`。
- 规范化路径必须匹配目标类型已注册的路径形状。
- 如果设置了 `providerId` 或 `accountId`，它必须匹配路径中编码的 ID。
- `auth-profiles.json` 目标需要 `agentId`。
- 创建新的 `auth-profiles.json` 映射时，请包含 `authProfileProvider`。

## 失败行为

如果目标验证失败，apply 会退出并显示类似这样的错误：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

无效计划不会提交任何写入。

## Exec 提供商同意行为

- 默认情况下，`--dry-run` 会跳过 exec SecretRef 检查。
- 包含 exec SecretRefs/提供商的计划在写入模式下会被拒绝，除非设置了 `--allow-exec`。
- 验证/应用包含 exec 的计划时，请在 dry-run 和写入命令中都传入 `--allow-exec`。

## 运行时和审计范围说明

- 仅引用的 `auth-profiles.json` 条目（`keyRef`/`tokenRef`）会包含在运行时解析和审计覆盖范围中。
- `secrets apply` 会写入受支持的 `openclaw.json` 目标、受支持的 `auth-profiles.json` 目标，以及可选的清理目标。

## 操作员检查

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

如果 apply 因无效目标路径消息失败，请使用 `openclaw secrets configure` 重新生成计划，或将目标路径修正为上面支持的形状。

## 相关文档

- [密钥管理](/zh-CN/gateway/secrets)
- [CLI `secrets`](/zh-CN/cli/secrets)
- [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)
- [配置参考](/zh-CN/gateway/configuration-reference)
