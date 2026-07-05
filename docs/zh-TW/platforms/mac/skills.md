---
read_when:
    - 更新 macOS Skills 設定 UI
    - 變更 Skills 閘門或安裝行為
summary: macOS Skills 設定使用者介面與閘道支援的狀態
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-05T11:27:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 應用程式透過閘道顯示 OpenClaw Skills；它不會在本機解析 Skills。

## 資料來源

- `skills.status`（閘道）會回傳所有 Skills，以及資格和缺少的需求，包括對內建 Skills 的允許清單封鎖。
- 需求來自每個 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安裝動作

- `metadata.openclaw.install` 會定義安裝選項（brew/node/go/uv/download）。
- 應用程式會呼叫 `skills.install`，在閘道主機上執行安裝程式。
- 操作者擁有的 `security.installPolicy`（`enabled`、`targets`、`exec`）可以在安裝程式中繼資料執行前，封鎖由閘道支援的 Skill 安裝。內建的危險程式碼掃描（用於外掛安裝）尚未接入 Skill 安裝流程。
- 如果每個安裝選項都是 `download`，閘道會顯示所有下載選擇。
- 否則，閘道會使用目前的安裝偏好設定（`skills.install.preferBrew`、`skills.install.nodeManager`）和主機二進位檔，挑選一個偏好的安裝程式：啟用 `preferBrew` 且存在 `brew` 時先使用 Homebrew，接著是 `uv`，再來是已設定的節點管理器，然後如果 Homebrew 可用則再次使用 Homebrew（即使沒有 `preferBrew`），再來是 `go`，最後是 `download`。
- 節點安裝標籤會反映已設定的節點管理器，包括 `yarn`。

## 環境/API 金鑰

- 應用程式會將金鑰儲存在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 底下。
- `skills.update` 會修補 `enabled`、`apiKey` 和 `env`。

## 遠端模式

- 安裝和設定更新會發生在閘道主機上，而不是本機 Mac。

## 相關

- [Skills](/zh-TW/tools/skills)
- [macOS 應用程式](/zh-TW/platforms/macos)
