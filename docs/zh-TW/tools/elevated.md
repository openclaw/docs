---
read_when:
    - 調整提升權限模式的預設值、允許清單或斜線命令行為
    - 了解沙箱化代理程式如何存取主機
summary: 提升權限執行模式：從沙箱化代理程式在沙箱外執行命令
title: 提升權限模式
x-i18n:
    generated_at: "2026-07-22T10:48:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40627217acf56122acfc48b689be1b9e2c61d889fe698e9c3c8fd91270d4a6cf
    source_path: tools/elevated.md
    workflow: 16
---

當代理程式在沙箱內執行時，其 `exec` 命令會受限於沙箱環境。**提升模式**可讓代理程式突破此限制，改為在沙箱外執行命令，並可設定核准關卡。

<Info>
  提升模式只有在代理程式處於**沙箱環境**時才會改變行為。對於未使用沙箱的代理程式，exec 已經在主機上執行。
</Info>

## 指令

使用斜線命令控制每個工作階段的提升模式：

| 指令        | 功能                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | 在已設定的主機路徑上於沙箱外執行，保留核准流程                                                             |
| `/elevated ask`  | 與 `on` 相同（別名）                                                                                                            |
| `/elevated full` | 在已設定的主機路徑上於沙箱外執行，且當模式／主機核准原則已允許時略過核准流程 |
| `/elevated off`  | 恢復僅限沙箱內執行                                                                                            |

亦可使用 `/elev on|off|ask|full`。

傳送不含引數的 `/elevated`，即可查看目前層級。

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
    傳送只包含指令的訊息，以設定工作階段預設值：

    ```
    /elevated full
    ```

    或在訊息中內嵌使用（僅套用至該則訊息）：

    ```
    /elevated on 執行部署指令碼
    ```

  </Step>

  <Step title="命令在沙箱外執行">
    啟用提升模式後，`exec` 呼叫會離開沙箱。有效主機預設為
    `gateway`；當設定或工作階段的 exec 目標為
    `node` 時，則為 `node`。在 `full` 模式下，若解析後的 exec
    模式／主機核准原則已完全允許（security `full`、
    ask `off`），便會略過 exec 核准；否則仍會套用一般核准原則。在
    `on`/`ask` 模式下，一律套用已設定的核准規則。
  </Step>
</Steps>

## 解析順序

1. 訊息中的**內嵌指令**（僅套用至該則訊息）
2. **工作階段覆寫**（透過傳送只包含指令的訊息設定）
3. **全域預設值**（設定中的 `agents.defaults.elevatedDefault`）

## 可用性與允許清單

- **全域關卡**：`tools.elevated.enabled`（必須為 `true`）
- **傳送者允許清單**：`tools.elevated.allowFrom`，包含各頻道的清單
- **個別代理程式關卡**：`agents.entries.*.tools.elevated.enabled`（只能進一步限制；全域與個別代理程式關卡都必須為 `true`）
- **個別代理程式允許清單**：`agents.entries.*.tools.elevated.allowFrom`（傳送者必須同時符合全域與個別代理程式允許清單）
- **頻道提供的備援允許清單**：頻道外掛可選擇透過 SDK 轉接器掛鉤提供備援允許清單，並在未設定 `tools.elevated.allowFrom.<provider>` 時使用。目前沒有任何隨附頻道實作此掛鉤，因此實務上現今每個供應商都需要明確的 `tools.elevated.allowFrom.<provider>` 項目。
- **所有關卡都必須通過**；否則提升模式會被視為不可用

允許清單項目格式：

| 前綴                  | 比對項目                         |
| ----------------------- | ------------------------------- |
| （無）                  | 傳送者 ID、E.164 或 From 欄位 |
| `name:`                 | 傳送者顯示名稱             |
| `username:`             | 傳送者使用者名稱                 |
| `tag:`                  | 傳送者標籤                      |
| `id:`、`from:`、`e164:` | 明確指定身分     |

## 提升模式不控制的項目

- **工具原則**：若工具原則拒絕 `exec`，提升模式無法覆寫。
- **主機選擇原則**：提升模式不會將 `auto` 變成可任意跨主機覆寫的功能。它會使用設定或工作階段的 exec 目標規則，只有在目標已是 `node` 時才會選擇 `node`。
- **與 `/exec` 分開**：`/exec` 指令會調整已授權傳送者的每個工作階段 exec 預設值（host、security、ask、node），且不需要提升模式。

<Note>
  Bash 聊天命令（`!` 前綴；`/bash` 別名）是獨立關卡，除了自身的 `tools.bash.enabled` 旗標之外，也必須啟用 `tools.elevated`。停用提升模式也會禁止 `!` shell 命令。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    從代理程式執行 shell 命令。
  </Card>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    `exec` 的核准與允許清單系統。
  </Card>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing" icon="box">
    閘道層級的沙箱設定。
  </Card>
  <Card title="沙箱、工具原則與提升模式的比較" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三個關卡在工具呼叫期間的組合方式。
  </Card>
</CardGroup>
