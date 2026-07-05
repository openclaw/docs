---
read_when:
    - 你想在 stable/extended-stable/beta/dev 之間切換
    - 您想要釘選特定版本、標籤或 SHA
    - 你正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: stable、extended-stable、beta 和 dev 通道：語意、切換、釘選與標記
title: 發布通道
x-i18n:
    generated_at: "2026-07-05T11:29:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51ae160723558722c5a39d25d63b844f761b8f1127957bafe833d047e173e8b6
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **extended-stable**：npm dist-tag `extended-stable`。全新、落後主線的
  受支援月份套件通道。本版僅支援套件，且僅支援前景執行。
- **beta**：npm dist-tag `beta`。當 `beta` 缺少或比目前 stable 發行版更舊時，
  會退回到 `latest`。
- **dev**：`main`（git）的移動最新提交。發布時為 npm dist-tag `dev`。`main`
  用於實驗和活躍開發；它可能包含未完成的功能或破壞性變更。請勿將它用於生產閘道。

Stable 組建通常會先發布到 **beta**，在那裡通過驗證後，再不升版號地
提升到 **latest**。維護者也可以直接發布到 `latest`。dist-tags 是 npm 安裝的事實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將選擇持久化到設定中的 `update.channel`，並驅動兩種
安裝路徑：

| 通道              | npm/套件安裝                                                                                                                                                                          | git 安裝                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                     | 最新 stable git 標籤（排除 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`，以及其他具名預發行尾碼） |
| `extended-stable` | 解析公開 npm `extended-stable` 選擇器、驗證精確選定的套件，並安裝該精確版本。會失敗關閉，不會退回到 `latest`、`beta` 或 `dev`。 | 不支援：OpenClaw 會讓 checkout 保持不變，並要求你使用套件安裝                                                                     |
| `beta`            | dist-tag `beta`；當 `beta` 缺少或更舊時，退回到 `latest`                                                                                                                              | 最新 beta git 標籤；當 beta 缺少或更舊時，退回到最新 stable git 標籤                                                                       |
| `dev`             | dist-tag `dev`（少見；多數 dev 使用者會執行 git 安裝）                                                                                                                               | 擷取、將 checkout rebase 到上游 `main` 分支、建置，並重新安裝全域命令列介面                                                                 |

對於 `dev` git 安裝，預設 checkout 是 `~/openclaw`（或在設定
`OPENCLAW_HOME` 時為 `$OPENCLAW_HOME/openclaw`）；可用 `OPENCLAW_GIT_DIR` 覆寫。

<Tip>
若要並行保留 stable 和 dev，請使用兩個獨立的 checkout，並讓每個閘道指向自己的 checkout。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可在**不**變更持久化通道的情況下，針對單次更新指定特定 dist-tag、版本或套件規格：

```bash
# 安裝特定版本
openclaw update --tag 2026.4.1-beta.1

# 從 beta dist-tag 安裝（一次性，不會持久化）
openclaw update --tag beta

# 切換到移動中的 GitHub main checkout（持久化）
openclaw update --channel dev

# 安裝特定 npm 套件規格
openclaw update --tag openclaw@2026.4.1-beta.1

# 從 GitHub main 安裝一次，但不持久化通道
openclaw update --tag main
```

注意：

- `--tag` 僅適用於**套件（npm）安裝**；git 安裝會忽略它。
- 標籤不會持久化；下一次 `openclaw update` 會使用已設定的通道。
- `--tag main` 會在該次執行中對應到 npm 相容規格 `github:openclaw/openclaw#main`。
  若要持久化安裝移動中的 `main`，請使用
  `openclaw update --channel dev`（套件安裝會切換為 git checkout），
  或使用安裝程式的 git 方法重新安裝：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm 安裝路徑會直接拒絕 GitHub/git 來源目標，並改為指向 git 方法。
- 降級保護：如果目標版本比目前版本更舊，OpenClaw 會提示確認（可用 `--yes` 跳過）。
- Extended-stable 一律使用其已驗證的精確套件目標。它不是
  `--tag extended-stable` 的一次性別名，且 `--tag` 不能與有效的 extended-stable 通道合併使用。
- `--channel beta` 與 `--tag beta` 不同：通道流程可在 beta 缺少或更舊時退回到
  stable/latest，而 `--tag beta` 一律只針對該次執行的原始 `beta` dist-tag。

## 試執行

預覽 `openclaw update` 會做什麼，而不進行變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會回報有效通道、目標版本、規劃動作，
以及是否需要降級確認。

## 外掛與通道

使用 `openclaw update` 切換通道也會同步外掛來源：

- `dev` 會將已有 bundled 對應項的已安裝外掛切換回其 bundled（git checkout）來源。
- `stable` 和 `beta` 會還原 npm 安裝或 ClawHub 安裝的外掛套件。
- `extended-stable` 目前會在核心套件成功後，使用既有的 stable/latest 外掛線。
  官方外掛 `@extended-stable` 選擇器尚未查詢。
- npm 安裝的外掛會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的通道（以及決定它的來源：設定、git 標籤、
git 分支、已安裝版本或預設值）、安裝種類（git 或套件）、
目前版本，以及更新可用性。

## 標籤最佳實務

- 為你希望 git checkout 落到的發行版加上標籤：stable 使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`。具名預發行尾碼例如
  `-alpha.N`、`-rc.N` 和 `-next.N` 不是 stable 或 beta 目標。
- 舊式數字 stable 標籤，例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`，
  仍會為了相容性被辨識為 stable git 標籤。
- `vYYYY.M.PATCH.beta.N`（以點分隔）也會為了相容性被辨識；
  建議使用 `-beta.N`。
- 保持標籤不可變：切勿移動或重用標籤。
- npm dist-tags 仍是 npm 安裝的事實來源：
  - `latest` -> stable
  - `extended-stable` -> 落後主線的受支援月份套件發行版
  - `beta` -> 候選組建或 beta-first stable 組建
  - `dev` -> main 快照（選用）

## macOS app 可用性

Beta 和 dev 組建可能**不會**包含 macOS app 發行版。這是可以的：

- git 標籤和 npm dist-tag 仍可各自發布。
- 在發行說明或 changelog 中註明「此 beta 沒有 macOS 組建」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)
