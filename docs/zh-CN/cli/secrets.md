---
read_when:
    - 在运行时重新解析密钥引用
    - 审计明文残留和未解析的引用
    - 配置 SecretRefs 并应用单向清除变更
summary: '`openclaw secrets` 的 CLI 参考（reload、audit、configure、apply）'
title: 密钥
x-i18n:
    generated_at: "2026-04-24T04:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

使用 `openclaw secrets` 管理 SecretRefs，并保持当前活动运行时快照处于健康状态。

命令角色：

- `reload`：Gateway 网关 RPC（`secrets.reload`），重新解析引用，并且仅在完全成功时才切换运行时快照（不会写入配置）。
- `audit`：对配置/auth/生成的 model 存储以及旧版残留进行只读扫描，查找明文、未解析的引用和优先级漂移（除非设置了 `--allow-exec`，否则会跳过 exec 引用）。
- `configure`：用于 provider 设置、目标映射和预检的交互式规划器（需要 TTY）。
- `apply`：执行已保存的计划（`--dry-run` 仅用于验证；dry-run 默认跳过 exec 检查，而写入模式会拒绝包含 exec 的计划，除非设置了 `--allow-exec`），然后清除目标明文残留。

推荐的操作循环：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的计划包含 `exec` SecretRefs/providers，请在 dry-run 和写入 apply 命令中都传入 `--allow-exec`。

适用于 CI/门控的退出码说明：

- `audit --check` 在发现问题时返回 `1`。
- 未解析的引用返回 `2`。

相关内容：

- 密钥指南：[Secrets Management](/zh-CN/gateway/secrets)
- 凭证表面：[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)
- 安全指南：[Security](/zh-CN/gateway/security)

## 重新加载运行时快照

重新解析密钥引用，并以原子方式切换运行时快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

说明：

- 使用 Gateway 网关 RPC 方法 `secrets.reload`。
- 如果解析失败，Gateway 网关会保留最后一个已知正常的快照并返回错误（不会部分启用）。
- JSON 响应包含 `warningCount`。

选项：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 审计

扫描 OpenClaw 状态中的以下内容：

- 明文密钥存储
- 未解析的引用
- 优先级漂移（`auth-profiles.json` 中的凭证遮蔽了 `openclaw.json` 中的引用）
- 生成的 `agents/*/agent/models.json` 残留（provider 的 `apiKey` 值和敏感 provider headers）
- 旧版残留（旧版 auth 存储条目、OAuth 提醒）

Header 残留说明：

- 敏感 provider header 检测基于名称启发式规则（常见的认证/凭证 header 名称及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

退出行为：

- `--check` 会在发现问题时以非零状态退出。
- 未解析的引用会以更高优先级的非零退出码退出。

报告结构要点：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 问题代码：
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 配置（交互式辅助工具）

以交互方式构建 provider 和 SecretRef 变更，运行预检，并可选择应用：

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

流程：

- 先进行 provider 设置（对 `secrets.providers` 别名执行 `add/edit/remove`）。
- 然后进行凭证映射（选择字段并分配 `{source, provider, id}` 引用）。
- 最后进行预检和可选 apply。

标志：

- `--providers-only`：仅配置 `secrets.providers`，跳过凭证映射。
- `--skip-provider-setup`：跳过 provider 设置，并将凭证映射到现有 provider。
- `--agent <id>`：将 `auth-profiles.json` 的目标发现和写入范围限定为单个 agent 存储。
- `--allow-exec`：在预检/apply 期间允许 exec SecretRef 检查（可能会执行 provider 命令）。

说明：

- 需要交互式 TTY。
- 不能将 `--providers-only` 与 `--skip-provider-setup` 组合使用。
- `configure` 以 `openclaw.json` 中承载密钥的字段以及所选 agent 范围内的 `auth-profiles.json` 为目标。
- `configure` 支持在选择器流程中直接创建新的 `auth-profiles.json` 映射。
- 规范支持范围：[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)。
- 它会在 apply 之前执行预检解析。
- 如果预检/apply 包含 exec 引用，请在这两个步骤中都保持设置 `--allow-exec`。
- 生成的计划默认启用清除选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 全部启用）。
- 对于已清除的明文值，apply 路径是单向的。
- 未使用 `--apply` 时，CLI 仍会在预检后提示 `Apply this plan now?`。
- 使用 `--apply` 时（且未使用 `--yes`），CLI 会额外提示一次不可逆确认。
- `--json` 会打印计划 + 预检报告，但该命令仍然需要交互式 TTY。

Exec provider 安全说明：

- Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。
- 仅在信任的软件包管理器路径确有需要时设置 `allowSymlinkCommand: true`，并与 `trustedDirs` 配合使用（例如 `["/opt/homebrew"]`）。
- 在 Windows 上，如果某个 provider 路径无法进行 ACL 验证，OpenClaw 会以默认拒绝的方式处理。仅对可信路径，可在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用已保存的计划

应用或预检之前生成的计划：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec 行为：

- `--dry-run` 会在不写入文件的情况下验证预检。
- dry-run 默认跳过 exec SecretRef 检查。
- 写入模式会拒绝包含 exec SecretRefs/providers 的计划，除非设置了 `--allow-exec`。
- 使用 `--allow-exec` 以在任一模式下选择启用 exec provider 检查/执行。

计划契约详情（允许的目标路径、验证规则和失败语义）：

- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)

`apply` 可能更新的内容：

- `openclaw.json`（SecretRef 目标 + provider upsert/delete）
- `auth-profiles.json`（provider-target 清除）
- 旧版 `auth.json` 残留
- `~/.openclaw/.env` 中值已迁移的已知密钥键

## 为什么没有回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。

安全性来自严格的预检，以及在失败时尽最大努力进行内存恢复的近原子 apply。

## 示例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍然报告明文问题，请更新其报告的剩余目标路径，然后重新运行审计。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Secrets management](/zh-CN/gateway/secrets)
