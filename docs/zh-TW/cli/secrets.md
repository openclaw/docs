---
read_when:
    - 執行階段重新解析祕密參照
    - 稽核純文字殘留與未解析參照
    - 設定 SecretRefs 並套用單向清理變更
summary: '`openclaw secrets` 的命令列介面參考（重新載入、稽核、設定、套用）'
title: 機密
x-i18n:
    generated_at: "2026-07-05T11:13:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba89e153f8875017860cdf0d9af5cbfba0d1632968f5c408196b2403f20d719c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

管理 SecretRefs，並維持作用中執行階段快照的健康狀態。

| 命令        | 角色                                                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | 閘道 RPC (`secrets.reload`)：重新解析 refs，且只有在完全成功時才替換執行階段快照（不寫入設定）                                                                                                                   |
| `audit`     | 對 config/auth/generated-model 儲存區與舊版殘留進行唯讀掃描，檢查明文、未解析 refs 與優先順序漂移（除非使用 `--allow-exec`，否則會略過 exec refs）                                                               |
| `configure` | 用於提供者設定、目標對應與預檢的互動式規劃工具（需要 TTY）                                                                                                                                                       |
| `apply`     | 執行已儲存的計畫（`--dry-run` 僅驗證，且預設略過 exec 檢查；寫入模式會拒絕包含 exec 的計畫，除非使用 `--allow-exec`），接著清除目標明文殘留                                                                       |

建議的操作者流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的計畫包含 `exec` SecretRefs/提供者，請在 dry-run 與寫入 `apply` 命令兩者都傳入 `--allow-exec`。

CI/閘門的結束代碼：

- `audit --check` 在有發現項目時回傳 `1`。
- 未解析的 refs 會回傳 `2`（無論是否使用 `--check`）。

相關：[密鑰管理](/zh-TW/gateway/secrets) · [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface) · [安全性](/zh-TW/gateway/security)

## 重新載入執行階段快照

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

使用閘道 RPC 方法 `secrets.reload`。如果解析失敗，閘道會保留最後已知良好的快照並回傳錯誤（不會部分啟用）。JSON 回應包含 `warningCount`。

選項：`--url <url>`、`--token <token>`、`--timeout <ms>`、`--json`。

## 稽核

掃描 OpenClaw 狀態中的：

- 明文密鑰儲存
- 未解析 refs
- 優先順序漂移（`auth-profiles.json` 憑證遮蔽 `openclaw.json` refs）
- 產生的 `agents/*/agent/models.json` 殘留（提供者 `apiKey` 值與敏感的提供者標頭）
- 舊版殘留（舊版 auth 儲存區項目、OAuth 提醒）

敏感提供者標頭偵測是以名稱啟發式規則為基礎：它會標記名稱符合常見 auth/credential 片段的標頭（`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

報告形狀：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 發現項目代碼：`PLAINTEXT_FOUND`、`REF_UNRESOLVED`、`REF_SHADOWED`、`LEGACY_RESIDUE`

## 設定（互動式輔助工具）

以互動方式建立提供者與 SecretRef 變更、執行預檢，並可選擇套用：

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

流程：先進行提供者設定（新增/編輯/移除 `secrets.providers` aliases），接著進行憑證對應（選取欄位，指派 `{source, provider, id}` refs），然後預檢並可選擇套用。

旗標：

- `--providers-only`：只設定 `secrets.providers`，略過憑證對應
- `--skip-provider-setup`：略過提供者設定，將憑證對應到現有提供者
- `--agent <id>`：將 `auth-profiles.json` 目標探索與寫入限定到單一 agent 儲存區
- `--allow-exec`：允許在預檢/套用期間進行 exec SecretRef 檢查（可能會執行提供者命令）

`--providers-only` 與 `--skip-provider-setup` 不能合併使用。

注意事項：

- 需要互動式 TTY。
- 目標是 `openclaw.json` 中含有密鑰的欄位，加上所選 agent 範圍的 `auth-profiles.json`；標準支援介面：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
- 支援在挑選流程中直接建立新的 `auth-profiles.json` 對應。
- 套用前會執行預檢解析。
- 產生的計畫預設啟用清除選項（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson`）。對已清除的明文值而言，套用是單向操作。
- 若未使用 `--apply`，命令列介面在預檢後仍會提示 `Apply this plan now?`。
- 使用 `--apply`（且未使用 `--yes`）時，命令列介面會額外提示不可逆遷移確認。
- `--json` 會列印計畫與預檢報告，但仍需要互動式 TTY。

### Exec 提供者安全性

Homebrew 安裝通常會在 `/opt/homebrew/bin/*` 下暴露符號連結的二進位檔。只有在受信任套件管理器路徑需要時，才設定 `allowSymlinkCommand: true`，並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`）。在 Windows 上，如果提供者路徑無法使用 ACL 驗證，OpenClaw 會預設失敗關閉；僅針對受信任路徑，在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全性檢查。

## 套用已儲存的計畫

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` 會在不寫入檔案的情況下驗證預檢；dry-run 中預設會略過 exec SecretRef 檢查。寫入模式會拒絕包含 exec SecretRefs/提供者的計畫，除非使用 `--allow-exec`。使用 `--allow-exec` 可在任一模式中選擇加入 exec 提供者檢查/執行。

`apply` 可能更新的內容：

- `openclaw.json`（SecretRef 目標 + 提供者 upserts/deletes）
- `auth-profiles.json`（提供者目標清除）
- 舊版 `auth.json` 殘留
- `~/.openclaw/.env` 中已遷移其值的已知密鑰鍵

計畫合約詳細資訊（允許的目標路徑、驗證規則、失敗語意）：[Secrets Apply Plan Contract](/zh-TW/gateway/secrets-plan-contract)。

### 為什麼沒有復原備份

`secrets apply` 有意不寫入包含舊明文值的復原備份。安全性來自嚴格預檢加上近似原子的套用，並在失敗時盡力進行記憶體內還原。

## 範例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍回報明文發現項目，請更新剩餘回報的目標路徑，並重新執行 audit。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [密鑰管理](/zh-TW/gateway/secrets)
