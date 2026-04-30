---
read_when:
    - 你想讓 OpenClaw 中的 `exec` 或 `bash` 工具結果更短
    - 您想啟用內建的 tokenjuice Plugin
    - 你需要了解 tokenjuice 會變更哪些內容，以及哪些內容會保持原樣
summary: 以可選的內建 Plugin 精簡冗雜的 exec 和 bash 工具結果
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-30T03:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` 是選用的內建 Plugin，會在命令已經執行後，壓縮雜訊較多的 `exec` 與 `bash`
工具結果。

它變更的是回傳的 `tool_result`，不是命令本身。Tokenjuice 不會
重寫 shell 輸入、重新執行命令，或變更退出代碼。

目前這適用於 Codex app-server harness 中的 PI embedded runs 和 OpenClaw dynamic tools。Tokenjuice 會掛接 OpenClaw 的 tool-result middleware，並在輸出回到 active harness session 之前
修剪輸出。

## 啟用 Plugin

快速方式：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已經隨附此 Plugin。不需要另外執行 `plugins install`
或 `tokenjuice install openclaw` 步驟。

如果你偏好直接編輯設定：

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice 會變更什麼

- 在雜訊較多的 `exec` 與 `bash` 結果被送回 session 之前壓縮它們。
- 保持原始命令執行不變。
- 保留精確的檔案內容讀取，以及其他 tokenjuice 應保持原始輸出的命令。
- 維持選擇性啟用：如果你想在所有地方取得逐字輸出，請停用此 Plugin。

## 驗證它正在運作

1. 啟用 Plugin。
2. 啟動可以呼叫 `exec` 的 session。
3. 執行雜訊較多的命令，例如 `git status`。
4. 檢查回傳的工具結果是否比原始 shell 輸出更短且更有結構。

## 停用 Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或：

```bash
openclaw plugins disable tokenjuice
```

## 相關內容

- [Exec 工具](/zh-TW/tools/exec)
- [Thinking levels](/zh-TW/tools/thinking)
- [Context engine](/zh-TW/concepts/context-engine)
