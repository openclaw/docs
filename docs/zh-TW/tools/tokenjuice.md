---
read_when:
    - 你想要在 OpenClaw 中取得更短的 `exec` 或 `bash` 工具結果
    - 你想要安裝或啟用 Tokenjuice 外掛
    - 你需要了解 tokenjuice 會變更哪些內容，以及哪些內容會保持原始狀態。
summary: 使用選用的 Tokenjuice 外掛壓縮雜訊多的 exec 和 bash 工具結果
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T20:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` 是選用的外部外掛，會在命令已經執行後，壓縮雜訊較多的 `exec` 和 `bash`
工具結果。

它會變更傳回的 `tool_result`，而不是命令本身。Tokenjuice 不會
重寫 shell 輸入、重新執行命令，或變更結束碼。

目前這適用於 Codex app-server 框架中的 OpenClaw 嵌入式執行和 OpenClaw 動態工具。Tokenjuice 會掛接 OpenClaw 的工具結果中介軟體，並在輸出回到作用中的框架工作階段之前
修剪輸出內容。

## 啟用外掛

安裝一次：

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

然後啟用它：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

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

- 在雜訊較多的 `exec` 和 `bash` 結果回饋到工作階段之前先進行壓縮。
- 保持原始命令執行不變。
- 保留精確的檔案內容讀取，以及其他 tokenjuice 應保持原始輸出的命令。
- 維持選擇性啟用：如果你希望所有地方都使用逐字輸出，請停用此外掛。

## 驗證它正在運作

1. 啟用外掛。
2. 啟動可呼叫 `exec` 的工作階段。
3. 執行雜訊較多的命令，例如 `git status`。
4. 檢查傳回的工具結果是否比原始 shell 輸出更短且更有結構。

## 停用外掛

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或：

```bash
openclaw plugins disable tokenjuice
```

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [思考層級](/zh-TW/tools/thinking)
- [上下文引擎](/zh-TW/concepts/context-engine)
