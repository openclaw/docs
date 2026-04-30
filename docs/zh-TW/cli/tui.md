---
read_when:
    - 你想要 Gateway 的終端機使用者介面（適合遠端使用）
    - 您想要從指令碼傳遞 url/token/session
    - 您想在沒有 Gateway 的情況下，以本機嵌入模式執行 TUI
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: '`openclaw tui` 的 CLI 參考（以 Gateway 為後端或本機內嵌的終端機介面）'
title: TUI
x-i18n:
    generated_at: "2026-04-30T02:57:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟連線至 Gateway 的終端機 UI，或以本機嵌入模式執行。

相關：

- TUI 指南：[TUI](/zh-TW/web/tui)

注意事項：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的別名。
- `--local` 無法與 `--url`、`--token` 或 `--password` 合併使用。
- `tui` 會在可行時解析已設定的 Gateway 驗證 SecretRefs，以進行權杖/密碼驗證（`env`/`file`/`exec` 提供者）。
- 從已設定的代理工作區目錄內啟動時，TUI 會自動為工作階段金鑰預設值選取該代理（除非 `--session` 明確為 `agent:<id>:...`）。
- 本機模式會直接使用嵌入式代理執行階段。大多數本機工具都可運作，但 Gateway 專用功能無法使用。
- 本機模式會在 TUI 命令介面中加入 `/auth [provider]`。
- Plugin 核准閘門在本機模式中仍然適用。需要核准的工具會在終端機中提示你做出決定；不會因為未涉及 Gateway 就默默自動核准任何項目。

## 範例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## 設定修復迴圈

當目前設定已通過驗證，而你想要嵌入式代理檢查設定、對照文件，並從同一個終端機協助修復時，請使用本機模式：

如果 `openclaw config validate` 已經失敗，請先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不會繞過無效設定防護。

```bash
openclaw chat
```

接著在 TUI 內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 套用目標修復，然後重新執行 `openclaw config validate`。請參閱 [TUI](/zh-TW/web/tui) 和 [Config](/zh-TW/cli/config)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [TUI](/zh-TW/web/tui)
