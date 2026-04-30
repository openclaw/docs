---
read_when:
    - 更新 macOS Skills 設定使用者介面
    - 變更 Skills 閘控或安裝行為
summary: macOS Skills 設定使用者介面與以 Gateway 為後端的狀態
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-30T03:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 應用程式透過 Gateway 呈現 OpenClaw Skills；它不會在本機解析 Skills。

## 資料來源

- `skills.status`（Gateway）會回傳所有 Skills，以及資格與缺少的需求
  （包含內建 Skills 的允許清單封鎖）。
- 需求衍生自每個 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安裝動作

- `metadata.openclaw.install` 定義安裝選項（brew/node/go/uv）。
- 應用程式會呼叫 `skills.install`，在 Gateway 主機上執行安裝程式。
- 內建危險程式碼的 `critical` 發現項目預設會封鎖 `skills.install`；可疑發現項目仍然只會警告。危險覆寫存在於 Gateway 請求上，但預設應用程式流程會維持故障關閉。
- 如果每個安裝選項都是 `download`，Gateway 會呈現所有下載
  選擇。
- 否則，Gateway 會使用目前的
  安裝偏好設定與主機二進位檔，挑選一個偏好的安裝程式：當
  `skills.install.preferBrew` 已啟用且 `brew` 存在時，Homebrew 優先，接著是 `uv`，再來是
  `skills.install.nodeManager` 中設定的 Node 管理器，然後才是後續
  備援，例如 `go` 或 `download`。
- Node 安裝標籤會反映設定的 Node 管理器，包含 `yarn`。

## 環境/API 金鑰

- 應用程式會將金鑰儲存在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 會修補 `enabled`、`apiKey` 和 `env`。

## 遠端模式

- 安裝與設定更新會在 Gateway 主機上進行（而不是本機 Mac）。

## 相關

- [Skills](/zh-TW/tools/skills)
- [macOS 應用程式](/zh-TW/platforms/macos)
