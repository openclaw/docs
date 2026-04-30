---
read_when:
    - 您想在 stable/beta/dev 之間切換
    - 你想固定特定版本、標籤或 SHA
    - 你正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: 穩定版、beta 與開發通道：語意、切換、固定與標記
title: 發布通道
x-i18n:
    generated_at: "2026-04-30T03:13:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# 開發頻道

OpenClaw 提供三個更新頻道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **beta**：當其為目前版本時，npm dist-tag 為 `beta`；如果 beta 缺少或早於
  最新 stable 發行版，更新流程會退回使用 `latest`。
- **dev**：`main` 的移動中最新提交（git）。npm dist-tag：`dev`（發布時）。
  `main` 分支用於實驗與積極開發。它可能包含
  未完成的功能或破壞性變更。請勿將它用於生產 Gateway。

我們通常會先將 stable 建置發布到 **beta**，在該處測試後，再執行
明確的提升步驟，將已驗證的建置移至 `latest`，且不
變更版本號。維護者也可以在需要時直接將 stable 發行版發布到
`latest`。dist-tags 是 npm 安裝的真實來源。

## 切換頻道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將你的選擇保存在設定（`update.channel`）中，並對齊
安裝方式：

- **`stable`**（套件安裝）：透過 npm dist-tag `latest` 更新。
- **`beta`**（套件安裝）：優先使用 npm dist-tag `beta`，但當 `beta` 缺少或早於目前 stable 標籤時，會退回使用
  `latest`。
- **`stable`**（git 安裝）：簽出最新的 stable git 標籤。
- **`beta`**（git 安裝）：優先使用最新的 beta git 標籤，但當 beta 缺少或較舊時，會退回使用
  最新的 stable git 標籤。
- **`dev`**：確保有 git checkout（預設 `~/openclaw`，可用
  `OPENCLAW_GIT_DIR` 覆寫）、切換到 `main`、在上游上 rebase、建置，並從該 checkout
  安裝全域 CLI。

<Tip>
如果你想同時使用 stable 和 dev，請保留兩份 clone，並將你的 gateway 指向 stable 那份。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可針對單次更新指定特定 dist-tag、版本或套件規格，
且**不會**變更你保存的頻道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

注意事項：

- `--tag` **僅適用於套件（npm）安裝**。Git 安裝會忽略它。
- 標籤不會被保存。下一次 `openclaw update` 會照常使用你設定的
  頻道。
- 降級保護：如果目標版本早於你目前的版本，
  OpenClaw 會提示確認（可用 `--yes` 略過）。
- `--channel beta` 與 `--tag beta` 不同：頻道流程可在 beta 缺少或較舊時退回到
  stable/latest，而 `--tag beta` 會在該次執行中指定原始的
  `beta` dist-tag。

## Dry run

預覽 `openclaw update` 會做什麼，而不進行任何變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run 會顯示有效頻道、目標版本、計畫動作，以及
是否需要降級確認。

## Plugin 和頻道

當你使用 `openclaw update` 切換頻道時，OpenClaw 也會同步 Plugin
來源：

- `dev` 優先使用 git checkout 中隨附的 plugins。
- `stable` 和 `beta` 會還原 npm 安裝的 Plugin 套件。
- npm 安裝的 plugins 會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的頻道、安裝類型（git 或套件）、目前版本，以及
來源（設定、git 標籤、git 分支或預設）。

## 標籤最佳實務

- 為你希望 git checkout 落在的發行版加上標籤（stable 使用 `vYYYY.M.D`，
  beta 使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也會被辨識以維持相容性，但建議使用 `-beta.N`。
- 舊版 `vYYYY.M.D-<patch>` 標籤仍會被辨識為 stable（非 beta）。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tags 仍是 npm 安裝的真實來源：
  - `latest` -> stable
  - `beta` -> candidate build 或 beta-first stable build
  - `dev` -> main snapshot（選用）

## macOS app 可用性

Beta 和 dev 建置可能**不**包含 macOS app 發行版。這是可以接受的：

- git 標籤和 npm dist-tag 仍可發布。
- 在 release notes 或 changelog 中註明「此 beta 沒有 macOS build」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)
