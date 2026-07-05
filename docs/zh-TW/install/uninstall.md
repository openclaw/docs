---
read_when:
    - 你想要從機器上移除 OpenClaw
    - 解除安裝後，閘道服務仍在執行
summary: 徹底解除安裝 OpenClaw（命令列介面、服務、狀態、工作區）
title: 解除安裝
x-i18n:
    generated_at: "2026-07-05T11:31:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

兩種路徑：

- 如果仍然安裝了 `openclaw`，請使用**簡易路徑**。
- 如果命令列介面已不存在但服務仍在執行，請使用**手動移除服務**。

## 簡易路徑（命令列介面仍已安裝）

建議：使用內建解除安裝程式：

```bash
openclaw uninstall
```

移除狀態時會保留已設定的工作區目錄，除非你也選取 `--workspace`。

預覽將移除的內容（安全）：

```bash
openclaw uninstall --dry-run --all
```

非互動式（自動化 / npx）。請謹慎使用，且只在確認範圍後使用：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

旗標：`--service`、`--state`、`--workspace`、`--app` 會選取個別範圍；`--all` 會選取全部四項。

手動步驟（相同結果）：

1. 停止閘道服務：

```bash
openclaw gateway stop
```

2. 解除安裝閘道服務（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3. 刪除狀態 + 設定：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你將 `OPENCLAW_CONFIG_PATH` 設為狀態目錄外的自訂位置，也請刪除該檔案。
如果你想保留狀態目錄內的工作區，例如 `~/.openclaw/workspace`，請在執行 `rm -rf` 前先將它移到其他位置，或選擇性刪除狀態內容。

4. 刪除你的工作區（可選，會移除代理程式檔案）：

```bash
rm -rf ~/.openclaw/workspace
```

5. 移除命令列介面安裝（選擇你使用的那一個）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. 如果你安裝了 macOS 應用程式：

```bash
rm -rf /Applications/OpenClaw.app
```

注意事項：

- 如果你使用了設定檔（`--profile` / `OPENCLAW_PROFILE`），請針對每個狀態目錄重複步驟 3（預設為 `~/.openclaw-<profile>`）。
- 在遠端模式中，狀態目錄位於**閘道主機**上，因此也請在該處執行步驟 1-4。

## 手動移除服務（未安裝命令列介面）

如果閘道服務持續執行但缺少 `openclaw`，請使用此方式。

### macOS（launchd）

預設標籤為 `ai.openclaw.gateway`（若有設定檔，則為 `ai.openclaw.<profile>`）：

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

如果你使用了設定檔，請將標籤和 plist 名稱替換為 `ai.openclaw.<profile>`。

### Linux（systemd 使用者單元）

預設單元名稱為 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）。從非常舊的安裝升級而來的機器上，可能仍存在重新命名前的 `clawdbot-gateway.service` 單元；`openclaw uninstall` / `openclaw gateway uninstall` 會自動偵測並移除它。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（排定的工作）

預設工作名稱為 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。
該工作會在你的狀態目錄下啟動無視窗的 `gateway.vbs` 指令碼，該指令碼接著
執行 `gateway.cmd`；請移除兩者。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

如果你使用了設定檔，請刪除相符的工作名稱，以及 `~\.openclaw-<profile>` 下的 `gateway.cmd` /
`gateway.vbs` 檔案。

## 一般安裝與原始碼 checkout 的差異

### 一般安裝（install.sh / npm / pnpm / bun）

如果你使用 `https://openclaw.ai/install.sh` 或 `install.ps1`，命令列介面是透過 `npm install -g openclaw@latest` 安裝的。
請使用 `npm rm -g openclaw` 移除它（如果你是用其他方式安裝，則使用 `pnpm remove -g` / `bun remove -g`）。

### 原始碼 checkout（git clone）

如果你從 repo checkout 執行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1. 在刪除 repo **之前**解除安裝閘道服務（使用上方簡易路徑或手動移除服務）。
2. 刪除 repo 目錄。
3. 如上所示移除狀態 + 工作區。

## 相關內容

- [安裝總覽](/zh-TW/install)
- [遷移指南](/zh-TW/install/migrating)
