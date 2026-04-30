---
read_when:
    - 你想要可重現、可回復的安裝
    - 您已經在使用 Nix/NixOS/Home Manager
    - 你想要鎖定所有項目，並以宣告式方式管理
summary: 使用 Nix 以宣告式方式安裝 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-04-30T03:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 16
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 宣告式安裝 OpenClaw — 這是一個功能完整的 Home Manager 模組。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 儲存庫是 Nix 安裝方式的真實來源。本頁是快速概覽。
</Info>

## 你會得到什麼

- Gateway + macOS app + 工具（whisper、spotify、攝影機）-- 全部固定版本
- 可在重新開機後持續存在的 launchd 服務
- 具備宣告式設定的 Plugin 系統
- 即時回復：`home-manager switch --rollback`

## 快速開始

<Steps>
  <Step title="安裝 Determinate Nix">
    如果尚未安裝 Nix，請依照 [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) 指示操作。
  </Step>
  <Step title="建立本機 flake">
    使用 nix-openclaw 儲存庫中的 agent-first 範本：
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="設定密鑰">
    設定你的訊息機器人權杖和模型提供者 API 金鑰。放在 `~/.secrets/` 的純文字檔案即可。
  </Step>
  <Step title="填入範本預留位置並切換">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="驗證">
    確認 launchd 服務正在執行，且你的機器人會回應訊息。
  </Step>
</Steps>

請參閱 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)，了解完整模組選項與範例。

## Nix 模式執行階段行為

設定 `OPENCLAW_NIX_MODE=1` 時（使用 nix-openclaw 會自動設定），OpenClaw 會進入確定性模式，並停用自動安裝流程。

你也可以手動設定：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI app 不會自動繼承 shell 環境變數。請改用 defaults 啟用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式會改變什麼

- 自動安裝與自我變更流程會停用
- 缺少依賴項時會顯示 Nix 專用的修復訊息
- UI 會顯示唯讀的 Nix 模式橫幅

### 設定與狀態路徑

OpenClaw 會從 `OPENCLAW_CONFIG_PATH` 讀取 JSON5 設定，並將可變資料儲存在 `OPENCLAW_STATE_DIR`。在 Nix 下執行時，請將這些值明確設定為由 Nix 管理的位置，讓執行階段狀態與設定保留在不可變 store 之外。

| 變數                   | 預設值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服務 PATH 探索

launchd/systemd Gateway 服務會自動探索 Nix-profile 二進位檔，因此
會 shell out 到 `nix` 安裝可執行檔的 Plugin 和工具無需
手動設定 PATH 也能運作：

- 當設定 `NIX_PROFILES` 時，每個項目都會依由右至左的優先順序加入服務 PATH
  （符合 Nix shell 優先順序 — 最右側優先）。
- 當未設定 `NIX_PROFILES` 時，會加入 `~/.nix-profile/bin` 作為備援。

這適用於 macOS launchd 與 Linux systemd 服務環境。

## 相關

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- 完整設定指南
- [精靈](/zh-TW/start/wizard) -- 非 Nix CLI 設定
- [Docker](/zh-TW/install/docker) -- 容器化設定
