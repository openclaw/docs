---
read_when:
    - 你想在 stable/beta/dev 之間切換
    - 您想要固定特定版本、標籤或 SHA
    - 你正在標記或發布預發行版
sidebarTitle: Release Channels
summary: 穩定版、Beta 版與開發版通道：語意、切換、釘選與標記
title: 發布通道
x-i18n:
    generated_at: "2026-06-27T19:26:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供三個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **beta**：目前可用時為 npm dist-tag `beta`；如果 beta 缺少或早於
  最新穩定版，更新流程會退回到 `latest`。
- **dev**：`main`（git）的移動頂端。npm dist-tag：`dev`（發布時）。
  `main` 分支用於實驗與主動開發。它可能包含
  未完成的功能或破壞性變更。請勿將它用於生產環境閘道。

我們通常會先將穩定建置發布到 **beta**，在那裡測試，然後執行一個
明確的提升步驟，將已審核的建置移到 `latest`，且不
變更版本號。維護者也可以在需要時將穩定版
直接發布到 `latest`。Dist-tags 是 npm
安裝的真實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將你的選擇保存在設定（`update.channel`）中，並對齊
安裝方法：

- **`stable`**（套件安裝）：透過 npm dist-tag `latest` 更新。
- **`beta`**（套件安裝）：優先使用 npm dist-tag `beta`，但當
  `beta` 缺少或早於目前穩定標籤時，會退回到
  `latest`。
- **`stable`**（git 安裝）：簽出最新穩定 git 標籤，排除
  semver 預發行標籤，例如 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、
  `-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`，以及其他預發行
  後綴。
- **`beta`**（git 安裝）：優先使用最新 beta git 標籤，但當 beta 缺少或較舊時，會退回到
  最新穩定 git 標籤。
- **`dev`**：確保有 git checkout（預設 `~/openclaw`，或
  設定 `OPENCLAW_HOME` 時使用 `$OPENCLAW_HOME/openclaw`；可用
  `OPENCLAW_GIT_DIR` 覆寫），切換到 `main`，在上游上 rebase，建置，並
  從該 checkout 安裝全域命令列介面。

<Tip>
如果你想並行使用 stable 和 dev，請保留兩份 clone，並將你的閘道指向 stable 那份。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 針對單次更新指定特定 dist-tag、版本或套件規格，
**不會**變更你保存的通道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

注意：

- `--tag` 僅適用於**套件（npm）安裝**。git 安裝會忽略它。
- 標籤不會被保存。你下一次執行 `openclaw update` 時會照常使用你設定的
  通道。
- 對於套件安裝，OpenClaw 會在分階段 npm 安裝前，先將 GitHub/git 來源規格預先打包成
  暫存 tarball。當你想要將移動中的 `main`
  checkout 作為持久安裝時，請使用 `--channel dev` 或
  `--install-method git --version main`。
- 降級保護：如果目標版本早於你目前的版本，
  OpenClaw 會提示確認（可用 `--yes` 略過）。
- `--channel beta` 不同於 `--tag beta`：通道流程可在 beta 缺少或較舊時退回
  stable/latest，而 `--tag beta` 則針對該次執行使用原始
  `beta` dist-tag。

## 試執行

預覽 `openclaw update` 將執行的操作而不進行變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會顯示有效通道、目標版本、規劃動作，以及
是否需要降級確認。

## 外掛與通道

當你用 `openclaw update` 切換通道時，OpenClaw 也會同步外掛
來源：

- `dev` 優先使用 git checkout 中的內建外掛。
- `stable` 和 `beta` 會還原 npm 安裝的外掛套件。
- npm 安裝的外掛會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的通道、安裝種類（git 或套件）、目前版本，以及
來源（設定、git 標籤、git 分支或預設）。

## 標籤最佳實務

- 為你希望 git checkout 停留的版本加上標籤（穩定版使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`；具名 semver 預發行後綴，例如
  `-alpha.N`、`-rc.N` 和 `-next.N`，不是穩定目標）。
- 舊版數字穩定標籤，例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`，為了相容性仍會
  被識別為穩定 git 標籤。
- `vYYYY.M.PATCH.beta.N` 也會為了相容性被識別，但請優先使用 `-beta.N`。
- 保持標籤不可變：絕不要移動或重用標籤。
- npm dist-tags 仍是 npm 安裝的真實來源：
  - `latest` -> stable
  - `beta` -> 候選建置或 beta 優先穩定建置
  - `dev` -> main 快照（選用）

## macOS 應用程式可用性

Beta 和 dev 建置可能**不**包含 macOS 應用程式發布。這沒有問題：

- git 標籤和 npm dist-tag 仍可發布。
- 在發布說明或變更日誌中標明「此 beta 沒有 macOS 建置」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)
