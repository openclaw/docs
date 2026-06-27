---
read_when:
    - 更新 macOS Skills 設定介面
    - 變更 Skills 管制或安裝行為
summary: macOS Skills 設定介面與閘道支援的狀態
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T19:32:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 應用程式會透過閘道呈現 OpenClaw 技能；不會在本機解析技能。

## 資料來源

- `skills.status`（閘道）會傳回所有技能，以及資格狀態與缺少的需求
  （包括套裝技能的允許清單封鎖）。
- 需求衍生自每個 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安裝動作

- `metadata.openclaw.install` 會定義安裝選項（brew/node/go/uv）。
- 應用程式會呼叫 `skills.install`，在閘道主機上執行安裝程式。
- 操作者擁有的 `security.installPolicy` 可以在安裝程式中繼資料執行前，封鎖由閘道支援的技能
  安裝。安裝期間的內建危險程式碼封鎖不屬於技能安裝流程。
- 如果每個安裝選項都是 `download`，閘道會呈現所有下載
  選擇。
- 否則，閘道會使用目前的
  安裝偏好設定與主機二進位檔，挑選一個偏好的安裝程式：當
  `skills.install.preferBrew` 已啟用且 `brew` 存在時，優先使用 Homebrew，接著是 `uv`，再來是
  `skills.install.nodeManager` 中設定的節點管理器，然後才是後續
  備援選項，例如 `go` 或 `download`。
- 節點安裝標籤會反映已設定的節點管理器，包括 `yarn`。

## 環境/API 金鑰

- 應用程式會將金鑰儲存在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 底下。
- `skills.update` 會修補 `enabled`、`apiKey` 和 `env`。

## 遠端模式

- 安裝與設定更新會發生在閘道主機上（不是本機 Mac）。

## 相關

- [Skills](/zh-TW/tools/skills)
- [macOS 應用程式](/zh-TW/platforms/macos)
