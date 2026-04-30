---
read_when:
    - 你使用 voice-call Plugin，並想要 CLI 進入點
    - 你想要 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速範例
summary: '`openclaw voicecall` 的 CLI 參考（語音通話 Plugin 指令介面）'
title: 語音通話
x-i18n:
    generated_at: "2026-04-30T02:57:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由 Plugin 提供的命令。只有在已安裝並啟用語音通話 Plugin 時才會出現。

主要文件：

- 語音通話 Plugin：[語音通話](/zh-TW/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` 預設會輸出供人閱讀的就緒狀態檢查。若要用於
指令碼，請使用 `--json`：

```bash
openclaw voicecall setup --json
```

對於外部提供者（`twilio`、`telnyx`、`plivo`），設定必須能從 `publicUrl`、通道或 Tailscale 暴露位置解析出公開
Webhook URL。系統會拒絕 loopback/私人
serve 後援，因為電信業者無法連線到它。

`smoke` 會執行相同的就緒狀態檢查。除非同時提供 `--to` 和 `--yes`，
否則不會撥打真實電話：

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## 暴露 Webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全性注意事項：只將 Webhook 端點暴露給你信任的網路。可行時，優先使用 Tailscale Serve，而不是 Funnel。

## 相關資訊

- [CLI 參考](/zh-TW/cli)
- [語音通話 Plugin](/zh-TW/plugins/voice-call)
