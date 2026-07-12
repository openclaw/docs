---
read_when:
    - 在运行时重新解析密钥引用
    - 审计明文残留和未解析的引用
    - 配置 SecretRefs 并应用单向清除更改
summary: '`openclaw secrets` 的 CLI 参考（重新加载、审计、配置、应用）'
title: 密钥
x-i18n:
    generated_at: "2026-07-12T14:23:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

管理 SecretRef，并保持活动运行时快照健康。

| 命令        | 作用                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway 网关 RPC（`secrets.reload`）：重新解析引用，并且仅在完全成功时替换运行时快照（不写入配置）                                                                                                       |
| `audit`     | 以只读方式扫描配置、身份验证和生成的模型存储以及旧版残留，检查明文、未解析的引用和优先级偏移（除非使用 `--allow-exec`，否则跳过 exec 引用）                                                               |
| `configure` | 用于提供商设置、目标映射和预检的交互式规划工具（需要 TTY）                                                                                                                                               |
| `apply`     | 执行保存的计划（`--dry-run` 仅验证，并默认跳过 exec 检查；除非使用 `--allow-exec`，否则写入模式拒绝包含 exec 的计划），然后清除目标明文残留                                                               |

建议的操作员流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的计划包含 `exec` SecretRef/提供商，请在试运行和写入的 `apply` 命令中都传入 `--allow-exec`。

用于 CI/门禁的退出代码：

- `audit --check` 发现问题时返回 `1`。
- 存在未解析的引用时返回 `2`（无论是否使用 `--check`）。

相关内容：[密钥管理](/zh-CN/gateway/secrets) · [SecretRef 凭据范围](/zh-CN/reference/secretref-credential-surface) · [安全性](/zh-CN/gateway/security)

## 重新加载运行时快照

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

使用 Gateway 网关 RPC 方法 `secrets.reload`。如果解析失败，Gateway 网关会保留最后一个已知正常的快照并返回错误（不会部分激活）。JSON 响应包含 `warningCount`。

选项：`--url <url>`、`--token <token>`、`--timeout <ms>`、`--json`。

## 审计

扫描 OpenClaw 状态以检查：

- 明文密钥存储
- 未解析的引用
- 优先级偏移（`auth-profiles.json` 凭据遮蔽 `openclaw.json` 引用）
- 生成的 `agents/*/agent/models.json` 残留（提供商 `apiKey` 值和敏感的提供商标头）
- 旧版残留（旧版身份验证存储条目、OAuth 提醒）

敏感提供商标头检测基于名称启发式规则：如果标头名称匹配常见的身份验证/凭据片段（`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential`），就会将其标记。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

报告结构：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 发现项代码：`PLAINTEXT_FOUND`、`REF_UNRESOLVED`、`REF_SHADOWED`、`LEGACY_RESIDUE`

## 配置（交互式辅助工具）

以交互方式构建提供商和 SecretRef 更改、运行预检，并可选择应用：

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

流程：先设置提供商（添加/编辑/移除 `secrets.providers` 别名），再映射凭据（选择字段并分配 `{source, provider, id}` 引用），然后进行预检并可选择应用。

标志：

- `--providers-only`：仅配置 `secrets.providers`，跳过凭据映射
- `--skip-provider-setup`：跳过提供商设置，将凭据映射到现有提供商
- `--agent <id>`：将 `auth-profiles.json` 的目标发现和写入范围限定为一个 Agent 存储
- `--allow-exec`：允许在预检/应用期间执行 exec SecretRef 检查（可能会执行提供商命令）

`--providers-only` 和 `--skip-provider-setup` 不能组合使用。

注意：

- 需要交互式 TTY。
- 目标包括 `openclaw.json` 中包含密钥的字段，以及所选 Agent 范围的 `auth-profiles.json`；规范支持范围：[SecretRef 凭据范围](/zh-CN/reference/secretref-credential-surface)。
- 支持直接在选择器流程中创建新的 `auth-profiles.json` 映射。
- 应用前会运行预检解析。
- 生成的计划默认启用清除选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson`）。应用后，已清除的明文值无法恢复。
- 不使用 `--apply` 时，CLI 在预检后仍会提示 `Apply this plan now?`。
- 使用 `--apply`（但不使用 `--yes`）时，CLI 会额外提示确认不可逆迁移。
- `--json` 会输出计划和预检报告，但仍需要交互式 TTY。

### Exec 提供商安全性

Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下提供符号链接形式的二进制文件。仅当受信任的软件包管理器路径需要时，才设置 `allowSymlinkCommand: true`，并配合使用 `trustedDirs`（例如 `["/opt/homebrew"]`）。在 Windows 上，如果无法验证提供商路径的 ACL，OpenClaw 会采用故障关闭策略；仅对于受信任的路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用保存的计划

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` 在不写入文件的情况下验证预检；试运行时默认跳过 exec SecretRef 检查。除非使用 `--allow-exec`，否则写入模式会拒绝包含 exec SecretRef/提供商的计划。在任一模式下，使用 `--allow-exec` 即表示选择启用 exec 提供商检查/执行。

`apply` 可能更新：

- `openclaw.json`（SecretRef 目标 + 提供商更新插入/删除）
- `auth-profiles.json`（清除提供商目标）
- 旧版 `auth.json` 残留
- `~/.openclaw/.env` 中值已迁移的已知密钥键

计划契约详情（允许的目标路径、验证规则、失败语义）：[密钥应用计划契约](/zh-CN/gateway/secrets-plan-contract)。

### 为何不创建回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。安全性来自严格的预检和近似原子的应用，并在失败时尽力从内存中恢复。

## 示例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍报告明文发现项，请更新其余报告的目标路径，然后重新运行审计。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [密钥管理](/zh-CN/gateway/secrets)
- [Vault SecretRef](/zh-CN/plugins/vault)
