---
read_when:
    - 調整提高權限模式預設值、允許清單或斜線命令行為
    - 了解沙盒化代理如何存取主機
summary: 提升權限的 exec 模式：從沙盒化代理程式在沙盒外執行命令
title: 高權限模式
x-i18n:
    generated_at: "2026-07-05T11:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

當代理在沙盒內執行時，其 `exec` 命令會被限制在沙盒環境中。**提升模式**可讓代理改為跳出沙盒，並在沙盒外執行命令，同時具備可設定的核准閘門。

<Info>
  提升模式只會在代理受**沙盒限制**時改變行為。對於未受沙盒限制的代理，exec 已經在主機上執行。
</Info>

## 指令

使用斜線命令按工作階段控制提升模式：

| 指令             | 功能                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | 在已設定的主機路徑上於沙盒外執行，保留核准                                                                                     |
| `/elevated ask`  | 與 `on` 相同（別名）                                                                                                            |
| `/elevated full` | 在已設定的主機路徑上於沙盒外執行，且當模式/主機核准政策已允許時略過核准                                                        |
| `/elevated off`  | 返回受沙盒限制的執行                                                                                                            |

也可使用 `/elev on|off|ask|full`。

傳送不含引數的 `/elevated` 以查看目前層級。

## 運作方式

<Steps>
  <Step title="檢查可用性">
    必須在設定中啟用提升模式，且傳送者必須位於允許清單中：

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

  <Step title="設定層級">
    傳送僅包含指令的訊息來設定工作階段預設值：

    ```
    /elevated full
    ```

    或以行內方式使用（僅套用至該訊息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙盒外執行">
    啟用提升模式時，`exec` 呼叫會離開沙盒。有效主機預設為
    `gateway`，或在已設定/工作階段 exec 目標為
    `node` 時為 `node`。在 `full` 模式中，當解析後的 exec
    模式/主機核准政策已完全允許（安全性 `full`、
    ask `off`）時，會略過 exec 核准；否則仍套用一般核准政策。在
    `on`/`ask` 模式中，一律套用已設定的核准規則。
  </Step>
</Steps>

## 解析順序

1. 訊息上的**行內指令**（僅套用至該訊息）
2. **工作階段覆寫**（透過傳送僅包含指令的訊息設定）
3. **全域預設值**（設定中的 `agents.defaults.elevatedDefault`）

## 可用性與允許清單

- **全域閘門**：`tools.elevated.enabled`（必須為 `true`）
- **傳送者允許清單**：`tools.elevated.allowFrom`，包含各頻道清單
- **每代理閘門**：`agents.list[].tools.elevated.enabled`（只能進一步限制；全域與每代理閘門都必須為 `true`）
- **每代理允許清單**：`agents.list[].tools.elevated.allowFrom`（傳送者必須同時符合全域 + 每代理）
- **頻道提供的後援允許清單**：頻道外掛可選擇透過 SDK 配接器掛鉤提供後援允許清單，於未設定 `tools.elevated.allowFrom.<provider>` 時使用。目前沒有任何內建頻道實作此掛鉤，因此實務上每個提供者目前都需要明確的 `tools.elevated.allowFrom.<provider>` 項目。
- **所有閘門都必須通過**；否則提升模式會被視為不可用

允許清單項目格式：

| 前綴                    | 符合項目                    |
| ----------------------- | --------------------------- |
| （無）                  | 傳送者 ID、E.164 或 From 欄位 |
| `name:`                 | 傳送者顯示名稱              |
| `username:`             | 傳送者使用者名稱            |
| `tag:`                  | 傳送者標籤                  |
| `id:`, `from:`, `e164:` | 明確身分目標                |

## 提升模式不控制的事項

- **工具政策**：如果 `exec` 被工具政策拒絕，提升模式無法覆寫。
- **主機選擇政策**：提升模式不會將 `auto` 變成可自由跨主機覆寫的選項。它使用已設定/工作階段 exec 目標規則，只有在目標已經是 `node` 時才選擇 `node`。
- **與 `/exec` 分開**：`/exec` 指令會為授權傳送者調整每工作階段 exec 預設值（主機、安全性、ask、node），且不需要提升模式。

<Note>
  bash 聊天命令（`!` 前綴；`/bash` 別名）是一個獨立閘門，除了自身的 `tools.bash.enabled` 旗標外，還需要啟用 `tools.elevated`。停用提升模式也會將 `!` shell 命令鎖定在外。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    從代理執行 shell 命令。
  </Card>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    `exec` 的核准與允許清單系統。
  </Card>
  <Card title="沙盒" href="/zh-TW/gateway/sandboxing" icon="box">
    閘道層級的沙盒設定。
  </Card>
  <Card title="沙盒 vs 工具政策 vs 提升模式" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三個閘門在工具呼叫期間如何組合。
  </Card>
</CardGroup>
