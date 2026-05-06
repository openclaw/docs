---
read_when:
    - 調整提升權限模式的預設值、允許清單或斜線命令行為
    - 了解沙盒化代理如何存取主機
summary: 提升權限的 exec 模式：從沙盒化代理程式在沙盒外執行命令
title: 提高權限模式
x-i18n:
    generated_at: "2026-05-06T02:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

當代理在沙盒內執行時，它的 `exec` 命令會被限制在沙盒環境中。**Elevated 模式**讓代理改為跳出沙盒，並在沙盒外執行命令，同時可設定核准閘門。

<Info>
  Elevated 模式只會在代理被**沙盒化**時改變行為。對於未沙盒化的代理，exec 已經在主機上執行。
</Info>

## 指令

使用斜線命令依工作階段控制 elevated 模式：

| 指令             | 作用                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `/elevated on`   | 在設定的主機路徑上於沙盒外執行，保留核准流程                       |
| `/elevated ask`  | 與 `on` 相同（別名）                                                 |
| `/elevated full` | 在設定的主機路徑上於沙盒外執行，並略過核准流程                     |
| `/elevated off`  | 回到受沙盒限制的執行方式                                             |

也可使用 `/elev on|off|ask|full`。

不帶引數傳送 `/elevated` 可查看目前層級。

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
    傳送只有指令的訊息來設定工作階段預設值：

    ```
    /elevated full
    ```

    或以內嵌方式使用（只套用到該訊息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    啟用 elevated 後，`exec` 呼叫會離開沙盒。有效主機預設為 `gateway`，或在設定/工作階段 exec 目標為 `node` 時使用 `node`。在 `full` 模式中，會略過 exec 核准流程。在 `on`/`ask` 模式中，仍會套用設定的核准規則。
  </Step>
</Steps>

## 解析順序

1. 訊息上的**內嵌指令**（只套用到該訊息）
2. **工作階段覆寫**（透過傳送只有指令的訊息設定）
3. **全域預設值**（設定中的 `agents.defaults.elevatedDefault`）

## 可用性與允許清單

- **全域閘門**：`tools.elevated.enabled`（必須為 `true`）
- **傳送者允許清單**：`tools.elevated.allowFrom` 搭配各通道清單
- **各代理閘門**：`agents.list[].tools.elevated.enabled`（只能進一步限制）
- **各代理允許清單**：`agents.list[].tools.elevated.allowFrom`（傳送者必須同時符合全域與各代理條件）
- **Discord 後援**：如果省略 `tools.elevated.allowFrom.discord`，會使用 `channels.discord.allowFrom` 作為後援
- **所有閘門都必須通過**；否則 elevated 會被視為不可用

允許清單項目格式：

| 前綴                    | 符合項目                         |
| ----------------------- | -------------------------------- |
| （無）                  | 傳送者 ID、E.164 或 From 欄位    |
| `name:`                 | 傳送者顯示名稱                   |
| `username:`             | 傳送者使用者名稱                 |
| `tag:`                  | 傳送者標籤                       |
| `id:`, `from:`, `e164:` | 明確指定身分                     |

## elevated 不控制的項目

- **工具政策**：如果 `exec` 被工具政策拒絕，elevated 無法覆寫。
- **主機選擇政策**：elevated 不會將 `auto` 變成可任意跨主機覆寫的模式。它會使用設定/工作階段 exec 目標規則，只有在目標已經是 `node` 時才選擇 `node`。
- **與 `/exec` 分開**：`/exec` 指令會為已授權的傳送者調整各工作階段的 exec 預設值，且不需要 elevated 模式。

<Note>
  bash 聊天命令（`!` 前綴；`/bash` 別名）是獨立閘門，除了它自己的 `tools.bash.enabled` 旗標外，還需要啟用 `tools.elevated`。停用 elevated 也會封鎖 `!` shell 命令。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-TW/tools/exec" icon="terminal">
    從代理執行 shell 命令。
  </Card>
  <Card title="Exec approvals" href="/zh-TW/tools/exec-approvals" icon="shield">
    `exec` 的核准與允許清單系統。
  </Card>
  <Card title="Sandboxing" href="/zh-TW/gateway/sandboxing" icon="box">
    Gateway 層級的沙盒設定。
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三個閘門在工具呼叫期間如何組合。
  </Card>
</CardGroup>
