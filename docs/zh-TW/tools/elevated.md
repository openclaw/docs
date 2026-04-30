---
read_when:
    - 調整提升模式預設值、允許清單或斜線命令行為
    - 了解受沙盒限制的代理如何存取主機
summary: 提權 exec 模式：從沙盒化代理在沙盒外執行命令
title: 提升權限模式
x-i18n:
    generated_at: "2026-04-30T03:44:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 16
---

當代理程式在沙盒內執行時，其 `exec` 命令會受限於沙盒環境。**提升權限模式**可讓代理程式改為跳出沙盒並在沙盒外執行命令，並搭配可設定的核准閘門。

<Info>
  提升權限模式只有在代理程式**受到沙盒限制**時才會改變行為。對於未沙盒化的代理程式，exec 已經會在主機上執行。
</Info>

## 指令

使用斜線命令控制每個工作階段的提升權限模式：

| 指令             | 功能                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | 在設定的主機路徑上於沙盒外執行，保留核准流程                         |
| `/elevated ask`  | 與 `on` 相同（別名）                                                   |
| `/elevated full` | 在設定的主機路徑上於沙盒外執行，並略過核准流程                       |
| `/elevated off`  | 回到受沙盒限制的執行                                                   |

也可使用 `/elev on|off|ask|full`。

傳送不帶引數的 `/elevated` 可查看目前層級。

## 運作方式

<Steps>
  <Step title="Check availability">
    必須在設定中啟用 Elevated，且傳送者必須在允許清單中：

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Set the level">
    傳送只包含指令的訊息來設定工作階段預設值：

    ```
    /elevated full
    ```

    或內嵌使用（僅套用於該訊息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    啟用提升權限後，`exec` 呼叫會離開沙盒。有效主機預設為 `gateway`，或在設定/工作階段 exec 目標為 `node` 時使用 `node`。在 `full` 模式中，會略過 exec 核准流程。在 `on`/`ask` 模式中，仍會套用設定的核准規則。
  </Step>
</Steps>

## 解析順序

1. 訊息上的**內嵌指令**（僅套用於該訊息）
2. **工作階段覆寫**（透過傳送只包含指令的訊息設定）
3. **全域預設值**（設定中的 `agents.defaults.elevatedDefault`）

## 可用性與允許清單

- **全域閘門**：`tools.elevated.enabled`（必須為 `true`）
- **傳送者允許清單**：`tools.elevated.allowFrom`，包含各通道清單
- **每個代理程式閘門**：`agents.list[].tools.elevated.enabled`（只能進一步限制）
- **每個代理程式允許清單**：`agents.list[].tools.elevated.allowFrom`（傳送者必須同時符合全域與每個代理程式設定）
- **Discord 備援**：如果省略 `tools.elevated.allowFrom.discord`，會使用 `channels.discord.allowFrom` 作為備援
- **所有閘門都必須通過**；否則提升權限會被視為不可用

允許清單項目格式：

| 前綴                    | 符合項目                        |
| ----------------------- | ------------------------------- |
| （無）                  | 傳送者 ID、E.164 或 From 欄位   |
| `name:`                 | 傳送者顯示名稱                  |
| `username:`             | 傳送者使用者名稱                |
| `tag:`                  | 傳送者標籤                      |
| `id:`, `from:`, `e164:` | 明確指定身分                    |

## 提升權限不控制的事項

- **工具政策**：如果 `exec` 被工具政策拒絕，提升權限無法覆寫它
- **主機選擇政策**：提升權限不會把 `auto` 變成可任意跨主機覆寫的選項。它會使用設定/工作階段的 exec 目標規則，只有當目標已經是 `node` 時才選擇 `node`。
- **與 `/exec` 分開**：`/exec` 指令會為已授權的傳送者調整每個工作階段的 exec 預設值，且不需要提升權限模式

## 相關

- [Exec 工具](/zh-TW/tools/exec) — shell 命令執行
- [Exec 核准](/zh-TW/tools/exec-approvals) — 核准與允許清單系統
- [沙盒化](/zh-TW/gateway/sandboxing) — 沙盒設定
- [沙盒 vs 工具政策 vs 提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
