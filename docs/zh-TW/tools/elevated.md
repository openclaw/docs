---
read_when:
    - 調整提升權限模式的預設值、允許清單或斜線命令行為
    - 瞭解沙箱化代理程式如何存取主機
summary: 提升權限執行模式：從沙箱化代理程式在沙箱外執行命令
title: 提升權限模式
x-i18n:
    generated_at: "2026-07-11T21:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

當代理程式在沙箱內執行時，其 `exec` 命令會受限於沙箱環境。**提升權限模式**可讓代理程式改為脫離沙箱，並在沙箱外執行命令，同時提供可設定的核准關卡。

<Info>
  提升權限模式只會在代理程式**處於沙箱中**時改變行為。對於未使用沙箱的代理程式，exec 已經是在主機上執行。
</Info>

## 指令

使用斜線命令控制每個工作階段的提升權限模式：

| 指令             | 功能                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/elevated on`   | 在所設定的主機路徑上於沙箱外執行，並保留核准程序                                                                  |
| `/elevated ask`  | 與 `on` 相同（別名）                                                                                               |
| `/elevated full` | 在所設定的主機路徑上於沙箱外執行；若模式／主機核准政策已允許所有操作，則略過核准程序                               |
| `/elevated off`  | 恢復為受沙箱限制的執行                                                                                             |

也可使用 `/elev on|off|ask|full`。

傳送不含引數的 `/elevated` 可查看目前層級。

## 運作方式

<Steps>
  <Step title="檢查可用性">
    必須在設定中啟用提升權限，而且傳送者必須位於允許清單中：

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
    傳送僅包含指令的訊息，以設定工作階段預設值：

    ```
    /elevated full
    ```

    或以內嵌方式使用（僅套用至該則訊息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙箱外執行">
    啟用提升權限後，`exec` 呼叫會離開沙箱。有效主機預設為
    `gateway`；若設定或工作階段的 exec 目標為 `node`，則為
    `node`。在 `full` 模式下，若解析後的 exec
    模式／主機核准政策已完全允許所有操作（security `full`、
    ask `off`），則會略過 exec 核准；否則仍會套用一般核准政策。在
    `on`／`ask` 模式下，所設定的核准規則一律適用。
  </Step>
</Steps>

## 解析順序

1. 訊息中的**內嵌指令**（僅套用至該則訊息）
2. **工作階段覆寫**（透過傳送僅包含指令的訊息設定）
3. **全域預設值**（設定中的 `agents.defaults.elevatedDefault`）

## 可用性與允許清單

- **全域關卡**：`tools.elevated.enabled`（必須為 `true`）
- **傳送者允許清單**：`tools.elevated.allowFrom`，包含各頻道的清單
- **每個代理程式的關卡**：`agents.list[].tools.elevated.enabled`（只能進一步限制；全域與每個代理程式的關卡都必須為 `true`）
- **每個代理程式的允許清單**：`agents.list[].tools.elevated.allowFrom`（傳送者必須同時符合全域與每個代理程式的允許清單）
- **頻道提供的後備允許清單**：頻道外掛可選擇透過 SDK 轉接器掛鉤提供後備允許清單，並在未設定 `tools.elevated.allowFrom.<provider>` 時使用。目前沒有任何內建頻道實作此掛鉤，因此實際上現今每個提供者都需要明確的 `tools.elevated.allowFrom.<provider>` 項目。
- **所有關卡都必須通過**；否則會將提升權限視為不可用

允許清單項目格式：

| 前綴                    | 比對項目                        |
| ----------------------- | ------------------------------- |
| （無）                  | 傳送者 ID、E.164 或 From 欄位   |
| `name:`                 | 傳送者顯示名稱                  |
| `username:`             | 傳送者使用者名稱                |
| `tag:`                  | 傳送者標籤                      |
| `id:`、`from:`、`e164:` | 明確指定身分                    |

## 提升權限不控制的項目

- **工具政策**：若工具政策拒絕 `exec`，提升權限無法覆寫該政策。
- **主機選擇政策**：提升權限不會將 `auto` 變成可任意跨主機覆寫。它會使用設定或工作階段的 exec 目標規則，且僅在目標已為 `node` 時選擇 `node`。
- **與 `/exec` 分離**：`/exec` 指令可供已授權的傳送者調整每個工作階段的 exec 預設值（主機、安全性、詢問、節點），且不需要提升權限模式。

<Note>
  bash 聊天命令（`!` 前綴；`/bash` 別名）使用獨立關卡，除了自身的 `tools.bash.enabled` 旗標外，還需要啟用 `tools.elevated`。停用提升權限也會一併封鎖 `!` shell 命令。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    由代理程式執行 shell 命令。
  </Card>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    `exec` 的核准與允許清單系統。
  </Card>
  <Card title="沙箱機制" href="/zh-TW/gateway/sandboxing" icon="box">
    閘道層級的沙箱設定。
  </Card>
  <Card title="沙箱、工具政策與提升權限的比較" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三個關卡在工具呼叫期間如何共同運作。
  </Card>
</CardGroup>
