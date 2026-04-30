---
read_when:
    - 你想要從一台機器移除 OpenClaw
    - Gateway 服務在解除安裝後仍在執行
summary: 完整解除安裝 OpenClaw（CLI、服務、狀態、工作區）
title: 解除安裝
x-i18n:
    generated_at: "2026-04-30T03:17:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 16
---

有兩種路徑：

- 如果 `openclaw` 仍已安裝，使用**簡易路徑**。
- 如果 CLI 已不存在但服務仍在執行，使用**手動移除服務**。

## 簡易路徑（CLI 仍已安裝）

建議：使用內建解除安裝程式：

```bash
openclaw uninstall
```

非互動式（自動化 / npx）：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手動步驟（結果相同）：

1. 停止 Gateway 服務：

```bash
openclaw gateway stop
```

2. 解除安裝 Gateway 服務（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3. 刪除狀態 + 設定：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你將 `OPENCLAW_CONFIG_PATH` 設為狀態目錄以外的自訂位置，也請刪除該檔案。

4. 刪除你的工作區（選用，會移除代理程式檔案）：

```bash
rm -rf ~/.openclaw/workspace
```

5. 移除 CLI 安裝（選擇你使用的那一種）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. 如果你安裝了 macOS app：

```bash
rm -rf /Applications/OpenClaw.app
```

注意：

- 如果你使用了設定檔（`--profile` / `OPENCLAW_PROFILE`），請針對每個狀態目錄重複步驟 3（預設為 `~/.openclaw-<profile>`）。
- 在遠端模式中，狀態目錄位於 **Gateway 主機**上，因此也請在該主機上執行步驟 1-4。

## 手動移除服務（未安裝 CLI）

如果 Gateway 服務持續執行但缺少 `openclaw`，請使用此方式。

### macOS（launchd）

預設標籤為 `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍存在）：

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

如果你使用了設定檔，請將標籤和 plist 名稱替換為 `ai.openclaw.<profile>`。如果存在任何舊版 `com.openclaw.*` plist，也請移除。

### Linux（systemd 使用者單元）

預設單元名稱為 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）：

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（Scheduled Task）

預設工作名稱為 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。
工作指令碼位於你的狀態目錄下。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

如果你使用了設定檔，請刪除對應的工作名稱和 `~\.openclaw-<profile>\gateway.cmd`。

## 一般安裝與原始碼 checkout

### 一般安裝（install.sh / npm / pnpm / bun）

如果你使用了 `https://openclaw.ai/install.sh` 或 `install.ps1`，CLI 是透過 `npm install -g openclaw@latest` 安裝的。
請使用 `npm rm -g openclaw` 移除它（或如果你是用該方式安裝，則使用 `pnpm remove -g` / `bun remove -g`）。

### 原始碼 checkout（git clone）

如果你從 repo checkout 執行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1. 在刪除 repo **之前**先解除安裝 Gateway 服務（使用上述簡易路徑或手動移除服務）。
2. 刪除 repo 目錄。
3. 如上所示移除狀態 + 工作區。

## 相關

- [安裝總覽](/zh-TW/install)
- [遷移指南](/zh-TW/install/migrating)
