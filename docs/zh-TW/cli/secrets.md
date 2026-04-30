---
read_when:
    - 在執行階段重新解析秘密參照
    - 稽核明文殘留與未解決的參照
    - 設定 SecretRefs 並套用單向清理變更
summary: '`openclaw secrets` 的 CLI 參考（reload、audit、configure、apply）'
title: 機密資訊
x-i18n:
    generated_at: "2026-04-30T02:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

使用 `openclaw secrets` 管理 SecretRef，並保持作用中的執行階段快照健康。

命令角色：

- `reload`：Gateway RPC（`secrets.reload`），會重新解析 ref，且僅在完全成功時替換執行階段快照（不寫入設定）。
- `audit`：唯讀掃描設定、驗證、產生的模型儲存區和舊版殘留，檢查明文、未解析的 ref，以及優先順序漂移（除非設定 `--allow-exec`，否則會略過 exec ref）。
- `configure`：用於提供者設定、目標對應和預檢的互動式規劃器（需要 TTY）。
- `apply`：執行已儲存的計畫（`--dry-run` 僅用於驗證；dry-run 預設會略過 exec 檢查，而寫入模式會拒絕包含 exec 的計畫，除非設定 `--allow-exec`），然後清除目標明文殘留。

建議的操作員循環：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的計畫包含 `exec` SecretRef/提供者，請在 dry-run 和寫入 apply 命令中都傳入 `--allow-exec`。

CI/閘門的結束代碼注意事項：

- `audit --check` 發現問題時會傳回 `1`。
- 未解析的 ref 會傳回 `2`。

相關：

- 秘密指南：[Secrets Management](/zh-TW/gateway/secrets)
- 憑證介面：[SecretRef Credential Surface](/zh-TW/reference/secretref-credential-surface)
- 安全性指南：[Security](/zh-TW/gateway/security)

## 重新載入執行階段快照

重新解析秘密 ref，並以原子方式替換執行階段快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

注意事項：

- 使用 Gateway RPC 方法 `secrets.reload`。
- 如果解析失敗，Gateway 會保留最後已知正常的快照並傳回錯誤（不會部分啟用）。
- JSON 回應包含 `warningCount`。

選項：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 稽核

掃描 OpenClaw 狀態以檢查：

- 明文秘密儲存
- 未解析的 ref
- 優先順序漂移（`auth-profiles.json` 憑證遮蔽 `openclaw.json` ref）
- 產生的 `agents/*/agent/models.json` 殘留（提供者 `apiKey` 值和敏感提供者標頭）
- 舊版殘留（舊版驗證儲存項目、OAuth 提醒）

標頭殘留注意事項：

- 敏感提供者標頭偵測是以名稱啟發式為基礎（常見驗證/憑證標頭名稱，以及像 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential` 這類片段）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

結束行為：

- `--check` 發現問題時會以非零代碼結束。
- 未解析的 ref 會以較高優先級的非零代碼結束。

報告形狀重點：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 發現代碼：
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 設定（互動式輔助工具）

以互動方式建置提供者和 SecretRef 變更、執行預檢，並可選擇套用：

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

- 先設定提供者（對 `secrets.providers` 別名進行 `add/edit/remove`）。
- 再對應憑證（選取欄位並指派 `{source, provider, id}` ref）。
- 最後執行預檢並可選擇套用。

旗標：

- `--providers-only`：只設定 `secrets.providers`，略過憑證對應。
- `--skip-provider-setup`：略過提供者設定，並將憑證對應到現有提供者。
- `--agent <id>`：將 `auth-profiles.json` 目標探索和寫入限定到一個代理程式儲存區。
- `--allow-exec`：允許在預檢/apply 期間執行 exec SecretRef 檢查（可能會執行提供者命令）。

注意事項：

- 需要互動式 TTY。
- 你不能將 `--providers-only` 與 `--skip-provider-setup` 組合使用。
- `configure` 會以 `openclaw.json` 中帶有秘密的欄位為目標，並包含所選代理程式範圍的 `auth-profiles.json`。
- `configure` 支援直接在選取器流程中建立新的 `auth-profiles.json` 對應。
- 標準支援介面：[SecretRef Credential Surface](/zh-TW/reference/secretref-credential-surface)。
- 它會在套用前執行預檢解析。
- 如果預檢/apply 包含 exec ref，請在兩個步驟都保持設定 `--allow-exec`。
- 產生的計畫預設啟用清除選項（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 全部啟用）。
- apply 路徑對已清除的明文值是單向的。
- 若未使用 `--apply`，CLI 仍會在預檢後提示 `Apply this plan now?`。
- 使用 `--apply`（且沒有 `--yes`）時，CLI 會提示額外的不可逆確認。
- `--json` 會列印計畫和預檢報告，但命令仍需要互動式 TTY。

exec 提供者安全性注意事項：

- Homebrew 安裝通常會在 `/opt/homebrew/bin/*` 下公開符號連結的二進位檔。
- 僅在受信任套件管理器路徑需要時，才設定 `allowSymlinkCommand: true`，並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`）。
- 在 Windows 上，如果無法對提供者路徑進行 ACL 驗證，OpenClaw 會採取失敗關閉。僅對受信任路徑，在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全性檢查。

## 套用已儲存的計畫

套用或預檢先前產生的計畫：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

exec 行為：

- `--dry-run` 會驗證預檢而不寫入檔案。
- dry-run 預設會略過 exec SecretRef 檢查。
- 寫入模式會拒絕包含 exec SecretRef/提供者的計畫，除非設定 `--allow-exec`。
- 使用 `--allow-exec` 在任一模式中選擇加入 exec 提供者檢查/執行。

計畫合約詳細資訊（允許的目標路徑、驗證規則和失敗語意）：

- [Secrets Apply Plan Contract](/zh-TW/gateway/secrets-plan-contract)

`apply` 可能更新的內容：

- `openclaw.json`（SecretRef 目標 + 提供者 upsert/delete）
- `auth-profiles.json`（提供者目標清除）
- 舊版 `auth.json` 殘留
- `~/.openclaw/.env` 中已遷移其值的已知秘密鍵

## 為什麼沒有復原備份

`secrets apply` 刻意不寫入包含舊明文值的復原備份。

安全性來自嚴格預檢，以及失敗時盡力進行記憶體內還原的近似原子套用。

## 範例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍回報明文發現項目，請更新剩餘回報的目標路徑並重新執行稽核。

## 相關

- [CLI reference](/zh-TW/cli)
- [Secrets management](/zh-TW/gateway/secrets)
