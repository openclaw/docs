---
read_when:
    - 你想要可重現、可復原的安裝
    - 你已經在使用 Nix/NixOS/Home Manager
    - 你想要所有內容都固定版本，並以宣告式方式管理
summary: 使用 Nix 以宣告式方式安裝 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-05-06T02:51:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 以宣告式方式安裝 OpenClaw - 這是一個開箱即用的 Home Manager 模組。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) repo 是 Nix 安裝的真實來源。此頁是快速概覽。
</Info>

## 你會得到什麼

- Gateway + macOS app + 工具（whisper、spotify、cameras）-- 全部固定版本
- 可在重新開機後持續運作的 launchd 服務
- 具備宣告式設定的 Plugin 系統
- 即時回復：`home-manager switch --rollback`

## 快速開始

<Steps>
  <Step title="安裝 Determinate Nix">
    如果尚未安裝 Nix，請依照 [Determinate Nix 安裝程式](https://github.com/DeterminateSystems/nix-installer) 的指示操作。
  </Step>
  <Step title="建立本機 flake">
    使用 nix-openclaw repo 中以代理程式優先的範本：
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="設定機密">
    設定你的訊息 bot token 和模型供應商 API 金鑰。放在 `~/.secrets/` 的純文字檔案即可。
  </Step>
  <Step title="填入範本預留位置並切換">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="驗證">
    確認 launchd 服務正在執行，且你的 bot 會回應訊息。
  </Step>
</Steps>

請參閱 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)，了解完整的模組選項與範例。

## Nix 模式執行階段行為

設定 `OPENCLAW_NIX_MODE=1` 時（使用 nix-openclaw 會自動設定），OpenClaw 會進入決定性模式，停用自動安裝流程。

你也可以手動設定：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI app 不會自動繼承 shell 環境變數。請改用 defaults 啟用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式中的變更

- 停用自動安裝與自我變更流程
- 缺少相依項目時會顯示 Nix 專用的修復訊息
- UI 顯示唯讀的 Nix 模式橫幅

### 設定與狀態路徑

OpenClaw 會從 `OPENCLAW_CONFIG_PATH` 讀取 JSON5 設定，並將可變資料儲存在 `OPENCLAW_STATE_DIR`。在 Nix 下執行時，請將這些值明確設為由 Nix 管理的位置，讓執行階段狀態和設定不會進入不可變儲存區。

| 變數                   | 預設值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服務 PATH 探索

launchd/systemd Gateway 服務會自動探索 Nix profile 二進位檔，因此
會 shell out 到 `nix` 安裝可執行檔的 plugins 和工具無需
手動設定 PATH 即可運作：

- 設定 `NIX_PROFILES` 時，每個項目都會以由右至左的優先順序加入服務 PATH
  （符合 Nix shell 優先順序 - 最右側優先）。
- 未設定 `NIX_PROFILES` 時，會加入 `~/.nix-profile/bin` 作為備援。

這同時適用於 macOS launchd 與 Linux systemd 服務環境。

## 相關

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    真實來源 Home Manager 模組與完整設定指南。
  </Card>
  <Card title="設定精靈" href="/zh-TW/start/wizard" icon="wand-magic-sparkles">
    非 Nix CLI 設定逐步說明。
  </Card>
  <Card title="Docker" href="/zh-TW/install/docker" icon="docker">
    作為非 Nix 替代方案的容器化設定。
  </Card>
  <Card title="更新" href="/zh-TW/install/updating" icon="arrow-up-right-from-square">
    更新由 Home Manager 管理的安裝以及套件。
  </Card>
</CardGroup>
