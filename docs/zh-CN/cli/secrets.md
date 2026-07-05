---
read_when:
    - 在运行时重新解析密钥引用
    - 审计明文残留和未解析的引用
    - 配置 SecretRefs 并应用单向清理更改
summary: '`openclaw secrets` 的 CLI 参考（reload、audit、configure、apply）'
title: 机密
x-i18n:
    generated_at: "2026-07-05T11:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba89e153f8875017860cdf0d9af5cbfba0d1632968f5c408196b2403f20d719c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

管理 SecretRef，并保持活动运行时快照健康。

| 命令        | 作用                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway 网关 RPC（`secrets.reload`）：重新解析引用，并且仅在完全成功时替换运行时快照（不写入配置）                                                                                                    |
| `audit`     | 对配置/凭证/生成模型存储和旧版残留执行只读扫描，查找明文、未解析引用和优先级漂移（除非使用 `--allow-exec`，否则跳过 exec 引用）                                                                      |
| `configure` | 用于提供商设置、目标映射和预检的交互式规划器（需要 TTY）                                                                                                                                             |
| `apply`     | 执行已保存的计划（`--dry-run` 仅验证，并默认跳过 exec 检查；写入模式会拒绝包含 exec 的计划，除非使用 `--allow-exec`），然后清理目标明文残留 |

推荐的操作员循环：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的计划包含 `exec` SecretRef/提供商，请在 dry-run 和写入 `apply` 命令中都传入 `--allow-exec`。

CI/门禁的退出码：

- `audit --check` 在发现问题时返回 `1`。
- 未解析引用返回 `2`（无论是否使用 `--check`）。

相关：[Secrets 管理](/zh-CN/gateway/secrets) · [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface) · [安全](/zh-CN/gateway/security)

## 重新加载运行时快照

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

使用 Gateway 网关 RPC 方法 `secrets.reload`。如果解析失败，Gateway 网关会保留其最后一次已知良好的快照并返回错误（不会部分激活）。JSON 响应包含 `warningCount`。

选项：`--url <url>`、`--token <token>`、`--timeout <ms>`、`--json`。

## 审计

扫描 OpenClaw 状态以查找：

- 明文密钥存储
- 未解析引用
- 优先级漂移（`auth-profiles.json` 凭据遮蔽 `openclaw.json` 引用）
- 生成的 `agents/*/agent/models.json` 残留（提供商 `apiKey` 值和敏感提供商标头）
- 旧版残留（旧版凭证存储条目、OAuth 提醒）

敏感提供商标头检测基于名称启发式规则：它会标记名称匹配常见凭证/认证片段的标头（`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

报告结构：

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 发现项代码：`PLAINTEXT_FOUND`、`REF_UNRESOLVED`、`REF_SHADOWED`、`LEGACY_RESIDUE`

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

流程：先进行提供商设置（添加/编辑/移除 `secrets.providers` 别名），再进行凭据映射（选择字段，分配 `{source, provider, id}` 引用），然后预检并可选应用。

标志：

- `--providers-only`：仅配置 `secrets.providers`，跳过凭据映射
- `--skip-provider-setup`：跳过提供商设置，将凭据映射到现有提供商
- `--agent <id>`：将 `auth-profiles.json` 目标发现和写入限定到一个智能体存储
- `--allow-exec`：允许在预检/应用期间执行 exec SecretRef 检查（可能执行提供商命令）

`--providers-only` 和 `--skip-provider-setup` 不能组合使用。

注意事项：

- 需要交互式 TTY。
- 目标为 `openclaw.json` 中包含密钥的字段，以及所选智能体范围的 `auth-profiles.json`；规范支持表面：[SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。
- 支持在选择器流程中直接创建新的 `auth-profiles.json` 映射。
- 在应用前运行预检解析。
- 生成的计划默认启用清理选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson`）。应用对已清理的明文值是单向操作。
- 如果不使用 `--apply`，CLI 在预检后仍会提示 `Apply this plan now?`。
- 使用 `--apply`（且不使用 `--yes`）时，CLI 会额外提示一次不可逆迁移确认。
- `--json` 会打印计划和预检报告，但仍需要交互式 TTY。

### Exec 提供商安全

Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。仅在受信任的包管理器路径确有需要时设置 `allowSymlinkCommand: true`，并与 `trustedDirs` 配套使用（例如 `["/opt/homebrew"]`）。在 Windows 上，如果无法对某个提供商路径进行 ACL 验证，OpenClaw 会默认失败关闭；仅对受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用已保存的计划

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` 会在不写入文件的情况下验证预检；dry-run 中默认跳过 exec SecretRef 检查。写入模式会拒绝包含 exec SecretRef/提供商的计划，除非使用 `--allow-exec`。在任一模式中，使用 `--allow-exec` 可选择启用 exec 提供商检查/执行。

`apply` 可能更新的内容：

- `openclaw.json`（SecretRef 目标 + 提供商插入或更新/删除）
- `auth-profiles.json`（提供商目标清理）
- 旧版 `auth.json` 残留
- `~/.openclaw/.env` 中值已迁移的已知密钥键

计划契约详情（允许的目标路径、验证规则、失败语义）：[Secrets Apply 计划契约](/zh-CN/gateway/secrets-plan-contract)。

### 为什么没有回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。安全性来自严格预检和近似原子化应用，并在失败时尽力进行内存内恢复。

## 示例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍然报告明文发现项，请更新剩余报告的目标路径并重新运行审计。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Secrets 管理](/zh-CN/gateway/secrets)
