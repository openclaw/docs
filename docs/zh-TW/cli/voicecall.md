---
read_when:
    - 您使用 voice-call Plugin，並需要 CLI 進入點
    - 你想要 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速範例
summary: '`openclaw voicecall` 的 CLI 參考（語音通話 Plugin 命令介面）'
title: 語音通話
x-i18n:
    generated_at: "2026-05-02T02:47:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由 Plugin 提供的指令。只有在已安裝並啟用語音通話 Plugin 時才會出現。

當 Gateway 正在執行時，操作指令（`call`、`start`、
`continue`、`speak`、`dtmf`、`end` 和 `status`）會傳送到該 Gateway 的
語音通話執行階段。如果無法連線到 Gateway，它們會退回到獨立的
CLI 執行階段。

主要文件：

- 語音通話 Plugin：[語音通話](/zh-TW/plugins/voice-call)

## 常用指令

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` 預設會列印人類可讀的就緒檢查。腳本請使用 `--json`：

```bash
openclaw voicecall setup --json
```

`status` 預設會以 JSON 列印作用中的通話。傳入 `--call-id <id>` 可檢查
單一通話。

對於外部提供者（`twilio`、`telnyx`、`plivo`），設定必須從 `publicUrl`、通道或 Tailscale 曝露解析出公開
Webhook URL。由於電信業者無法連線到回送/私人
服務備援，因此會被拒絕。

`smoke` 會執行相同的就緒檢查。除非同時提供 `--to` 和 `--yes`，
否則不會撥打真正的電話：

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## 曝露 Webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全注意事項：只將 Webhook 端點曝露給你信任的網路。可行時，優先使用 Tailscale Serve，而非 Funnel。

## 相關

- [CLI 參考](/zh-TW/cli)
- [語音通話 Plugin](/zh-TW/plugins/voice-call)
