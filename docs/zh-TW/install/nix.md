---
read_when:
    - 你需要可重現、可回復的安裝
    - 你已經在使用 Nix/NixOS/Home Manager
    - 您想要一切都固定版本並以宣告式方式管理
summary: 使用 Nix 宣告式安裝 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-07-05T11:27:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 以聲明式方式安裝 OpenClaw，這是第一方、功能完整的 Home Manager 模組。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) repo 是 Nix 安裝的真實來源。本頁是快速概覽。
</Info>

## 你會取得的內容

- 閘道 + macOS app + 工具（whisper、spotify、cameras），全部固定版本
- 可在重新開機後繼續存活的 launchd 服務
- 具備聲明式設定的外掛系統
- 即時回復：`home-manager switch --rollback`

## 快速開始

<Steps>
  <Step title="安裝 Determinate Nix">
    如果尚未安裝 Nix，請依照 [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) 的指示操作。
  </Step>
  <Step title="建立本機 flake">
    使用 nix-openclaw repo 中以代理程式為優先的範本：
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

請參閱 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)，了解完整的模組選項與範例。

## Nix 模式執行階段行為

設定 `OPENCLAW_NIX_MODE=1` 後（使用 nix-openclaw 時會自動設定），OpenClaw 會進入適用於 Nix 管理安裝的確定性模式。其他 Nix 套件也可以設定相同模式；nix-openclaw 是第一方參考實作。

你也可以手動設定：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI app 不會繼承 shell 環境變數。請改用 `defaults` 啟用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式中的變更

- 自動安裝與自我變更流程會停用。
- `openclaw.json` 會被視為不可變。啟動時衍生的預設值只會保留在執行階段，而設定寫入器（setup、onboarding、會變更內容的 `openclaw update`、外掛 install/update/uninstall/enable、`doctor --fix`、`doctor --generate-gateway-token`、`openclaw config set`）會拒絕編輯該檔案。
- 請改為編輯 Nix 來源。若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定 config。
- 缺少相依項目時會顯示 Nix 專用的修復訊息。
- UI 會顯示唯讀的 Nix 模式橫幅。

### Config 與狀態路徑

OpenClaw 會從 `OPENCLAW_CONFIG_PATH` 讀取 JSON5 config，並將可變資料儲存在 `OPENCLAW_STATE_DIR`。在 Nix 下，請明確將這些設定為由 Nix 管理的位置，讓執行階段狀態與 config 保持在不可變 store 之外。

| 變數                   | 預設值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服務 PATH 探索

launchd/systemd 閘道服務會自動探索 Nix profile 二進位檔，因此會 shell out 到 `nix` 安裝可執行檔的外掛與工具，不需要手動設定 PATH 也能運作：

- 設定 `NIX_PROFILES` 時，每個項目都會加入服務 PATH，優先順序由右至左（符合 Nix shell 優先順序：最右側勝出）。
- 未設定 `NIX_PROFILES` 時，`~/.nix-profile/bin` 會作為備援加入。

這同時適用於 macOS launchd 與 Linux systemd 服務環境。

## 相關

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    真實來源 Home Manager 模組與完整設定指南。
  </Card>
  <Card title="設定精靈" href="/zh-TW/start/wizard" icon="wand-magic-sparkles">
    非 Nix 的命令列介面設定逐步解說。
  </Card>
  <Card title="Docker" href="/zh-TW/install/docker" icon="docker">
    作為非 Nix 替代方案的容器化設定。
  </Card>
  <Card title="更新" href="/zh-TW/install/updating" icon="arrow-up-right-from-square">
    與套件一併更新由 Home Manager 管理的安裝。
  </Card>
</CardGroup>
