---
read_when:
    - 在執行階段重新解析密鑰參照
    - 稽核純文字殘留與未解析的參照
    - 設定 SecretRefs 並套用單向清除變更
summary: '`openclaw secrets` 的命令列介面參考（重新載入、稽核、設定、套用）'
title: 密鑰
x-i18n:
    generated_at: "2026-07-11T21:12:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

管理 SecretRef，並維持作用中執行階段快照的健全狀態。

| 命令        | 角色                                                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | 閘道 RPC（`secrets.reload`）：重新解析參照，且僅在完全成功時替換執行階段快照（不寫入設定）                                                                                                                |
| `audit`     | 唯讀掃描設定／驗證／產生的模型儲存區及舊版殘留，檢查明文、未解析參照與優先順序偏移（除非使用 `--allow-exec`，否則略過 exec 參照）                                                                         |
| `configure` | 用於提供者設定、目標對應與預檢的互動式規劃工具（需要 TTY）                                                                                                                                               |
| `apply`     | 執行已儲存的計畫（`--dry-run` 僅驗證，且預設略過 exec 檢查；除非使用 `--allow-exec`，否則寫入模式會拒絕含有 exec 的計畫），然後清除目標明文殘留 |

建議的操作人員流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果計畫包含 `exec` SecretRef／提供者，請在試執行與寫入的 `apply` 命令中都傳入 `--allow-exec`。

CI／閘門的結束代碼：

- `audit --check` 發現問題時傳回 `1`。
- 有未解析參照時傳回 `2`（無論是否使用 `--check`）。

相關內容：[密鑰管理](/zh-TW/gateway/secrets) · [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface) · [安全性](/zh-TW/gateway/security)

## 重新載入執行階段快照

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

使用閘道 RPC 方法 `secrets.reload`。如果解析失敗，閘道會保留其最後已知良好的快照並傳回錯誤（不會部分啟用）。JSON 回應包含 `warningCount`。

選項：`--url <url>`、`--token <token>`、`--timeout <ms>`、`--json`。

## 稽核

掃描 OpenClaw 狀態中的：

- 明文密鑰儲存
- 未解析參照
- 優先順序偏移（`auth-profiles.json` 憑證遮蔽 `openclaw.json` 參照）
- 產生的 `agents/*/agent/models.json` 殘留（提供者 `apiKey` 值及敏感的提供者標頭）
- 舊版殘留（舊版驗證儲存區項目、OAuth 提醒）

敏感提供者標頭偵測採用名稱啟發法：若標頭名稱符合常見的驗證／憑證片段（`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential`），便會將其標記。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

報告結構：

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

流程：先設定提供者（新增／編輯／移除 `secrets.providers` 別名），接著對應憑證（選取欄位，指派 `{source, provider, id}` 參照），然後進行預檢並可選擇套用。

旗標：

- `--providers-only`：僅設定 `secrets.providers`，略過憑證對應
- `--skip-provider-setup`：略過提供者設定，將憑證對應至現有提供者
- `--agent <id>`：將 `auth-profiles.json` 目標探索與寫入範圍限制為單一代理程式儲存區
- `--allow-exec`：允許在預檢／套用期間執行 exec SecretRef 檢查（可能會執行提供者命令）

`--providers-only` 與 `--skip-provider-setup` 不可合併使用。

注意事項：

- 需要互動式 TTY。
- 目標包括 `openclaw.json` 中含密鑰的欄位，以及所選代理程式範圍的 `auth-profiles.json`；正式支援的介面：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
- 支援直接在選取器流程中建立新的 `auth-profiles.json` 對應。
- 套用前會執行預檢解析。
- 產生的計畫預設會啟用清除選項（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson`）。套用後，已清除的明文值無法復原。
- 未使用 `--apply` 時，命令列介面仍會在預檢後提示 `Apply this plan now?`。
- 使用 `--apply`（且未使用 `--yes`）時，命令列介面會額外提示確認不可逆的移轉。
- `--json` 會輸出計畫與預檢報告，但仍需要互動式 TTY。

### Exec 提供者安全性

Homebrew 安裝通常會在 `/opt/homebrew/bin/*` 下公開符號連結二進位檔。僅在受信任的套件管理器路徑需要時，才將 `allowSymlinkCommand: true` 與 `trustedDirs`（例如 `["/opt/homebrew"]`）搭配設定。在 Windows 上，如果無法驗證提供者路徑的 ACL，OpenClaw 會採取封閉式失敗；僅對受信任的路徑，才可在該提供者上設定 `allowInsecurePath: true`，以略過路徑安全性檢查。

## 套用已儲存的計畫

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` 會驗證預檢而不寫入檔案；試執行時預設略過 exec SecretRef 檢查。除非使用 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRef／提供者的計畫。請使用 `--allow-exec`，選擇在任一模式下執行 exec 提供者檢查／執行。

`apply` 可能更新：

- `openclaw.json`（SecretRef 目標與提供者新增或更新／刪除）
- `auth-profiles.json`（提供者目標清除）
- 舊版 `auth.json` 殘留
- `~/.openclaw/.env` 中其值已移轉的已知密鑰鍵

計畫合約詳細資料（允許的目標路徑、驗證規則、失敗語意）：[密鑰套用計畫合約](/zh-TW/gateway/secrets-plan-contract)。

### 為何沒有復原備份

`secrets apply` 刻意不寫入含有舊明文值的復原備份。安全性來自嚴格的預檢與近似原子性的套用，並在失敗時盡力於記憶體內還原。

## 範例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍回報明文發現項目，請更新其餘回報的目標路徑，然後重新執行稽核。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [密鑰管理](/zh-TW/gateway/secrets)
- [Vault SecretRef](/plugins/vault)
