---
read_when:
    - 在运行时重新解析 SecretRef
    - 审计明文残留和未解析的引用
    - 配置 SecretRef 并应用单向清理变更
summary: '`openclaw secrets` 的 CLI 参考（重新加载、审计、配置、应用）'
title: secrets
x-i18n:
    generated_at: "2026-04-05T08:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

使用 `openclaw secrets` 管理 SecretRef，并保持当前活动运行时快照处于健康状态。

命令角色：

- `reload`：Gateway 网关 RPC（`secrets.reload`），重新解析引用，并且仅在完全成功时才切换运行时快照（不写入配置）。
- `audit`：对配置 / 认证 / 生成模型存储以及旧版残留进行只读扫描，检查明文、未解析的引用和优先级漂移（除非设置了 `--allow-exec`，否则会跳过 exec 引用）。
- `configure`：用于提供商设置、目标映射和预检的交互式规划器（需要 TTY）。
- `apply`：执行已保存的计划（`--dry-run` 仅用于验证；dry-run 默认跳过 exec 检查，而写入模式会拒绝包含 exec 的计划，除非设置了 `--allow-exec`），然后清理目标明文残留。

推荐的运维循环：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的计划包含 `exec` SecretRef / 提供商，请在 dry-run 和写入 apply 命令中都传入 `--allow-exec`。

CI / gate 的退出码说明：

- `audit --check` 在发现问题时返回 `1`。
- 未解析的引用返回 `2`。

相关内容：

- Secrets 指南：[Secrets Management](/gateway/secrets)
- 凭证表面：[SecretRef Credential Surface](/reference/secretref-credential-surface)
- 安全指南：[安全](/gateway/security)

## 重新加载运行时快照

重新解析 secret 引用，并原子性地切换运行时快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

说明：

- 使用 Gateway 网关 RPC 方法 `secrets.reload`。
- 如果解析失败，Gateway 网关会保留上一次已知正常的快照并返回错误（不会进行部分激活）。
- JSON 响应包含 `warningCount`。

选项：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 审计

扫描 OpenClaw 状态中的以下问题：

- 明文 secret 存储
- 未解析的引用
- 优先级漂移（`auth-profiles.json` 中的凭证遮蔽了 `openclaw.json` 中的引用）
- 生成的 `agents/*/agent/models.json` 残留（提供商 `apiKey` 值和敏感的提供商头部）
- 旧版残留（旧版认证存储条目、OAuth 提醒）

头部残留说明：

- 敏感提供商头部检测基于名称启发式规则（常见的认证 / 凭证头名称及片段，如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

退出行为：

- `--check` 在发现问题时以非零状态退出。
- 未解析的引用会以更高优先级的非零状态码退出。

报告结构重点：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- finding 代码：
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 配置（交互式辅助工具）

以交互方式构建提供商和 SecretRef 变更，运行预检，并可选择应用：

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

- 先进行提供商设置（对 `secrets.providers` 别名执行 `add/edit/remove`）。
- 然后进行凭证映射（选择字段并分配 `{source, provider, id}` 引用）。
- 最后进行预检和可选应用。

标志：

- `--providers-only`：仅配置 `secrets.providers`，跳过凭证映射。
- `--skip-provider-setup`：跳过提供商设置，并将凭证映射到现有提供商。
- `--agent <id>`：将 `auth-profiles.json` 目标发现和写入范围限定到单个智能体存储。
- `--allow-exec`：在预检 / 应用期间允许 exec SecretRef 检查（可能会执行提供商命令）。

说明：

- 需要交互式 TTY。
- 不能将 `--providers-only` 与 `--skip-provider-setup` 组合使用。
- `configure` 目标包括 `openclaw.json` 中携带 secret 的字段，以及所选智能体范围内的 `auth-profiles.json`。
- `configure` 支持在选择器流程中直接创建新的 `auth-profiles.json` 映射。
- 规范支持表面：[SecretRef Credential Surface](/reference/secretref-credential-surface)。
- 它会在应用前执行预检解析。
- 如果预检 / 应用包含 exec 引用，请在两个步骤中都保留 `--allow-exec`。
- 生成的计划默认启用清理选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 全部启用）。
- apply 路径对于已清理的明文值是单向的。
- 不带 `--apply` 时，CLI 在预检后仍会提示 `Apply this plan now?`。
- 使用 `--apply` 时（且未设置 `--yes`），CLI 会额外提示一次不可逆确认。
- `--json` 会打印计划和预检报告，但该命令仍然需要交互式 TTY。

Exec 提供商安全说明：

- Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。
- 仅在受信任的包管理器路径确有需要时，才设置 `allowSymlinkCommand: true`，并将其与 `trustedDirs` 配合使用（例如 `["/opt/homebrew"]`）。
- 在 Windows 上，如果某个提供商路径无法进行 ACL 验证，OpenClaw 会默认拒绝。仅针对受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用已保存的计划

应用或预检先前生成的计划：

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
- 写入模式会拒绝包含 exec SecretRef / 提供商的计划，除非设置了 `--allow-exec`。
- 在任一模式下，如需选择加入 exec 提供商检查 / 执行，请使用 `--allow-exec`。

计划契约细节（允许的目标路径、验证规则和失败语义）：

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

`apply` 可能更新的内容：

- `openclaw.json`（SecretRef 目标 + 提供商 upsert / delete）
- `auth-profiles.json`（提供商目标清理）
- 旧版 `auth.json` 残留
- `~/.openclaw/.env` 中已迁移值的已知 secret 键

## 为什么没有回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。

安全性来自严格的预检 + 近似原子性的 apply，以及在失败时尽力恢复内存中的状态。

## 示例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍然报告明文问题，请更新剩余被报告的目标路径，然后重新运行审计。
