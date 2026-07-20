---
read_when:
    - 首次設定 OpenClaw
    - 尋找常見的設定模式
    - 導覽至特定設定區段
summary: 設定概覽：常見工作、快速設定，以及完整參考文件的連結
title: 設定
x-i18n:
    generated_at: "2026-07-20T00:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d48a4ebb9a8ca212917ce4fe12a0670a44bf1030657bd1334343a91eef8ff742
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 支援註解與尾隨逗號">**JSON5**</Tooltip> 設定。若檔案不存在，OpenClaw 會使用安全的預設值。

使用中的設定路徑必須是一般檔案。OpenClaw 寫入時會以不可分割的方式取代檔案（重新命名至該路徑），因此使用符號連結的 `openclaw.json` 時，會取代其目標，而非透過連結寫入——請避免使用符號連結的設定配置。若將設定存放在預設狀態目錄之外，請讓 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。

新增設定的常見原因：

- 連接頻道並控制誰能傳訊息給機器人
- 設定模型、工具、沙箱或自動化（排程、鉤子）
- 調整工作階段、媒體、網路或 UI

如需瞭解所有可用欄位，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference)。

代理程式和自動化在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。請使用本頁取得以工作為導向的指引，並參閱
[設定參考資料](/zh-TW/gateway/configuration-reference)以瞭解更完整的
欄位對照與預設值。

<Tip>
**第一次進行設定嗎？** 請從 `openclaw onboard` 開始進行互動式設定，或參閱[設定範例](/zh-TW/gateway/configuration-examples)指南，取得可完整複製貼上的設定。
</Tip>

## 最小設定

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 編輯設定

<Tabs>
  <Tab title="互動式精靈">
    ```bash
    openclaw onboard       # 完整的新手引導流程
    openclaw configure     # 設定精靈
    ```
  </Tab>
  <Tab title="命令列介面（單行指令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="控制 UI">
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789)，並使用 **設定** 分頁。
    控制 UI 會根據即時設定結構描述呈現表單，包括欄位
    `title` / `description` 文件中繼資料，以及可用時的外掛和頻道結構描述，
    並提供 **原始 JSON** 編輯器作為替代方式。對於逐層深入的
    UI 和其他工具，閘道也會公開 `config.schema.lookup`，以
    擷取一個路徑範圍內的結構描述節點及其直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。閘道會監看檔案並自動套用變更（請參閱[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 僅接受完全符合結構描述的設定。未知的鍵、格式錯誤的型別或無效值會導致閘道**拒絕啟動**。唯一的根層級例外是 `$schema`（字串），讓編輯器能附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會輸出控制 UI
與驗證所使用的標準 JSON Schema。`config.schema.lookup` 會擷取單一路徑範圍內的節點及其
子項摘要，供逐層深入工具使用。欄位 `title`/`description` 文件中繼資料
會延續至巢狀物件、萬用字元（`*`）、陣列項目（`[]`），以及 `anyOf`/
`oneOf`/`allOf` 分支。載入資訊清單登錄時，執行階段的外掛與頻道結構描述會合併進來。

驗證失敗時：

- 閘道不會啟動
- 只有診斷指令可運作（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 以查看確切問題
- 執行 `openclaw doctor --fix`（`--repair` 是相同的旗標；`--yes` 會略過提示）以套用修復

每次成功啟動後，閘道都會保留一份受信任的最後已知良好副本，
但啟動與熱重新載入不會自動還原該副本——只有 `openclaw doctor --fix`
會執行還原。若 `openclaw.json` 驗證失敗（包括外掛本機驗證），閘道
將無法啟動，或略過重新載入，而目前的執行階段會繼續使用最後接受的
設定。遭拒絕的寫入內容也會另存為 `<path>.rejected.<timestamp>`，以供檢查。
閘道會封鎖看似意外覆寫的寫入——移除 `gateway.mode`、
遺失 `meta` 區塊，或使檔案縮小超過一半——除非該寫入
明確允許破壞性變更。若候選設定包含已遮蔽的機密預留位置，例如
`***` 或 `[redacted]`，則不會將其提升為最後已知良好設定。

## 常見工作

<AccordionGroup>
  <Accordion title="設定頻道（WhatsApp、Telegram、Discord 等）">
    每個頻道在 `channels.<provider>` 下都有自己的設定區段。設定步驟請參閱各頻道的專屬頁面：

    - [Discord](/zh-TW/channels/discord) - `channels.discord`
    - [Feishu](/zh-TW/channels/feishu) - `channels.feishu`
    - [Google Chat](/zh-TW/channels/googlechat) - `channels.googlechat`
    - [iMessage](/zh-TW/channels/imessage) - `channels.imessage`
    - [Mattermost](/zh-TW/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/zh-TW/channels/msteams) - `channels.msteams`
    - [Signal](/zh-TW/channels/signal) - `channels.signal`
    - [Slack](/zh-TW/channels/slack) - `channels.slack`
    - [Telegram](/zh-TW/channels/telegram) - `channels.telegram`
    - [WhatsApp](/zh-TW/channels/whatsapp) - `channels.whatsapp`

    所有頻道都採用相同的私訊政策模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // 配對 | 允許清單 | 開放 | 停用
          allowFrom: ["tg:123"], // 僅適用於允許清單/開放
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="選擇並設定模型">
    設定主要模型和選用的備援模型：

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` 會儲存別名與各模型設定；新增項目絕不會限制 `/model` 或 `--model` 覆寫。
    - `agents.defaults.modelPolicy.allow` 是覆寫與模型選擇器的明確允許清單。它接受完整參照與 `provider/*` 萬用字元；省略此項或使用 `[]` 即可允許任何模型。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制對話記錄/工具圖片的縮小處理（預設為 `1200`）；較低的值通常可減少大量使用螢幕截圖的執行所消耗的視覺權杖。
    - 如需在聊天中切換模型，請參閱[模型命令列介面](/zh-TW/concepts/models)；如需瞭解驗證輪替與備援行為，請參閱[模型容錯移轉](/zh-TW/concepts/model-failover)。
    - 如需自訂/自行託管的供應商，請參閱參考資料中的[自訂供應商](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰能傳訊息給機器人">
    私訊存取權是透過每個頻道的 `dmPolicy`（預設為 `"pairing"`）控制：

    - `"pairing"`：未知的傳送者會收到一次性配對碼以供核准
    - `"allowlist"`：僅限 `allowFrom`（或已配對的允許項目儲存區）中的傳送者
    - `"open"`：允許所有傳入私訊（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私訊

    對於群組，請使用 `groupPolicy`（`"allowlist" | "open" | "disabled"`）搭配 `groupAllowFrom` 或頻道專用的允許清單。

    如需各頻道的詳細資訊，請參閱[完整參考資料](/zh-TW/gateway/config-channels#dm-and-group-access)。

  </Accordion>

  <Accordion title="設定群組聊天提及閘控">
    群組訊息預設為**必須提及**。請為每個代理程式設定觸發模式。一般群組/頻道回覆會自動發佈；對於應由代理程式決定何時發言的共用聊天室，請選擇使用訊息工具路徑：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // 設為 "message_tool" 以要求所有位置皆透過訊息工具傳送
        groupChat: {
          visibleReplies: "message_tool", // 選用；可見輸出需要 message(action=send)
          unmentionedInbound: "room_event", // 未提及時，持續出現的群組對話只會作為靜默情境
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **中繼資料提及**：原生 @提及（WhatsApp 點按提及、Telegram @bot 等）
    - **文字模式**：`mentionPatterns` 中的安全規則運算式模式
    - **可見回覆**：`messages.visibleReplies` 可要求全域使用訊息工具傳送；`messages.groupChat.visibleReplies` 會針對群組/頻道覆寫該設定。
    - 如需瞭解可見回覆模式、各頻道覆寫與自我聊天模式，請參閱[完整參考資料](/zh-TW/gateway/config-channels#group-chat-mention-gating)。

  </Accordion>

  <Accordion title="限制各代理程式可用的 Skills">
    使用 `agents.defaults.skills` 作為共用基準，然後使用
    `agents.list[].skills` 覆寫特定代理程式：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // 繼承 github、weather
          { id: "docs", skills: ["docs-search"] }, // 取代預設值
          { id: "locked-down", skills: [] }, // 無 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills`，即可預設不限制 Skills。
    - 省略 `agents.list[].skills`，即可繼承預設值。
    - 設定 `agents.list[].skills: []`，即可停用所有 Skills。
    - 請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)和
      [設定參考資料](/zh-TW/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="設定各頻道的健康狀態監控">
    停用或啟用頻道或帳號的自動健康狀態重新啟動：

    ```json5
    {
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 控制單一頻道或帳號的自動重新啟動。
    - 如需操作除錯，請參閱[健康狀態檢查](/zh-TW/gateway/health)；如需所有欄位，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="設定工作階段與重設">
    工作階段控制對話的延續性與隔離：

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 建議用於多使用者環境
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main`（共用）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 執行緒繫結工作階段路由的全域預設值。`/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age` 可針對各工作階段進行繫結、解除繫結、列出及調整（Discord 繫結執行緒，Telegram 繫結主題／對話）。
    - 如需範圍、身分連結及傳送政策，請參閱[工作階段管理](/zh-TW/concepts/session)。
    - 如需所有欄位，請參閱[完整參考資料](/zh-TW/gateway/config-agents#session)。

  </Accordion>

  <Accordion title="啟用沙箱">
    在隔離的沙箱執行階段中執行代理程式工作階段：

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // 關閉 | 非主要 | 全部
            scope: "agent",    // 工作階段 | 代理程式 | 共用
          },
        },
      },
    }
    ```

    請先建置映像檔：若使用原始碼簽出版本，請執行 `scripts/sandbox-setup.sh`；若透過 npm 安裝，請參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的內嵌 `docker build` 命令。

    如需完整指南，請參閱[沙箱](/zh-TW/gateway/sandboxing)；如需所有選項，請參閱[完整參考資料](/zh-TW/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="為官方 iOS 組建啟用中繼支援的推播">
    公開 App Store 組建的中繼支援推播會使用託管的 OpenClaw 中繼服務：`https://ios-push-relay.openclaw.ai`。

    自訂中繼部署需要刻意採用獨立的 iOS 組建／部署路徑，且其中繼 URL 必須與閘道中繼 URL 相符。若你使用自訂中繼組建，請在閘道設定中指定：

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 選用。預設值：10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    等效的命令列介面命令：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    此設定的作用：

    - 讓閘道可透過外部中繼服務傳送 `push.test`、喚醒提示及重新連線喚醒。
    - 使用由已配對 iOS App 轉送、限定於該註冊的傳送授權。閘道不需要涵蓋整個部署的中繼權杖。
    - 將每個中繼支援的註冊繫結至 iOS App 所配對的閘道身分，因此其他閘道無法重複使用已儲存的註冊。
    - 讓本機／手動 iOS 組建繼續直接使用 APNs。中繼支援的傳送僅適用於透過中繼服務註冊的官方發佈組建。
    - 必須與內建於 iOS 組建的中繼基礎 URL 相符，確保註冊與傳送流量抵達相同的中繼部署。

    端對端流程：

    1. 安裝官方 iOS App。
    2. 選用：僅在使用刻意分離的自訂中繼組建時，才於閘道設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS App 與閘道配對，並讓節點與操作員工作階段都建立連線。
    4. iOS App 會擷取閘道身分，使用 App Attest 與 App 收據向中繼服務註冊，接著將中繼支援的 `push.apns.register` 承載資料發佈至已配對的閘道。
    5. 閘道會儲存中繼控制代碼與傳送授權，然後使用它們處理 `push.test`、喚醒提示及重新連線喚醒。

    操作注意事項：

    - 若將 iOS App 切換至其他閘道，請重新連線 App，使其能發佈繫結至該閘道的新中繼註冊。
    - 若發佈指向不同中繼部署的新 iOS 組建，App 會重新整理快取的中繼註冊，而非重複使用舊的中繼來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時的環境變數覆寫值。
    - 自訂閘道中繼 URL 必須與內建於 iOS 組建的中繼基礎 URL 相符；公開 App Store 發佈管道會拒絕自訂 iOS 中繼 URL 覆寫值。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限回送介面的開發緊急通道；請勿將 HTTP 中繼 URL 永久儲存於設定中。

    如需端對端流程，請參閱 [iOS App](/zh-TW/platforms/ios#relay-backed-push-for-official-builds)；如需中繼安全模型，請參閱[驗證與信任流程](/zh-TW/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="設定心跳偵測（定期簽到）">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: 時間長度字串（`30m`、`2h`）。設為 `0m` 即可停用。預設值：`30m`。
    - `target`: `last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`: `allow`（預設值），或針對私訊形式的心跳偵測目標使用 `block`
    - 如需完整指南，請參閱[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="設定排程工作">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: 從 SQLite 工作階段資料列中清除已完成的隔離執行工作階段（預設為 `24h`；設為 `false` 即可停用）。
    - 執行歷程會自動為每項工作保留最新的 2000 個終端資料列；遺失的資料列仍保有其 24 小時清理期限。
    - 如需功能概觀與命令列介面範例，請參閱[排程工作](/zh-TW/automation/cron-jobs)。

  </Accordion>

  <Accordion title="設定網路鉤子（掛鉤）">
    在閘道上啟用 HTTP 網路鉤子端點：

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    安全性注意事項：
    - 將所有掛鉤／網路鉤子承載資料內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；請勿重複使用有效的閘道驗證密鑰（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - 掛鉤驗證僅支援標頭（`Authorization: Bearer ...` 或 `x-openclaw-token`）；系統會拒絕查詢字串中的權杖。
    - `hooks.path` 不得為 `/`；請將網路鉤子輸入端點保留在專用子路徑，例如 `/hooks`。
    - 除非進行範圍嚴格限定的偵錯，否則請保持不安全內容略過旗標停用（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 若啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制呼叫端所選工作階段金鑰的範圍。
    - 對於掛鉤驅動的代理程式，建議使用強大的現代模型層級及嚴格的工具政策（例如僅允許訊息功能，並在可能的情況下搭配沙箱）。

    如需所有對應選項及 Gmail 整合資訊，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="設定多代理程式路由">
    使用個別工作區與工作階段執行多個隔離的代理程式：

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    如需繫結規則及各代理程式的存取設定檔，請參閱[多代理程式](/zh-TW/concepts/multi-agent)與[完整參考資料](/zh-TW/gateway/config-agents#multi-agent-routing)。

  </Accordion>

  <Accordion title="將設定拆分至多個檔案（$include）">
    使用 `$include` 整理大型設定：

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **單一檔案**：取代包含它的物件
    - **檔案陣列**：依序進行深層合併（後者優先），最多可巢狀包含 10 層
    - **同層金鑰**：在包含作業後合併（覆寫所包含的值）
    - **相對路徑**：以包含該路徑的檔案為基準解析
    - **路徑格式**：包含路徑不得含有 null 位元組，且解析前後都必須嚴格短於 4096 個字元
    - **OpenClaw 自有寫入**：當寫入僅變更一個由單一檔案包含（例如 `plugins: { $include: "./plugins.json5" }`）支援的頂層區段時，OpenClaw 會更新該包含檔案，並保持 `openclaw.json` 不變
    - **不支援的穿透寫入**：對於根層包含、包含陣列及帶有同層覆寫的包含，OpenClaw 自有寫入會採取封閉式失敗，而不會將設定扁平化
    - **限制範圍**：`$include` 路徑必須解析至存放 `openclaw.json` 的目錄之下。若要在不同機器或使用者間共用目錄樹，請將 `OPENCLAW_INCLUDE_ROOTS` 設為路徑清單（POSIX 使用 `:`，Windows 使用 `;`），指定包含檔案可參照的其他目錄。系統會解析並重新檢查符號連結，因此，即使路徑在字面上位於設定目錄中，只要其實際目標逸出所有允許的根目錄，仍會遭到拒絕。
    - **錯誤處理**：針對檔案遺失、剖析錯誤、循環包含、無效路徑格式及長度過長提供清楚的錯誤訊息

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

閘道會監看 `~/.openclaw/openclaw.json` 並自動套用變更——大多數設定都不需要手動重新啟動。

直接編輯的檔案在通過驗證前會視為不受信任。監看程式會等待編輯器的暫存寫入／重新命名變動穩定下來，讀取最終檔案，並拒絕無效的外部編輯，而不會重寫 `openclaw.json`。OpenClaw 自有的設定寫入也會在寫入前通過相同的結構描述閘門（適用於每次寫入的覆寫／復原規則，請參閱[嚴格驗證](#strict-validation)）。

若看到 `config reload skipped (invalid config)`，或啟動報告顯示 `Invalid
config`，請檢查設定、執行 `openclaw config validate`，然後執行 `openclaw
doctor --fix` 進行修復。檢查清單請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設值） | 立即熱套用安全變更。遇到關鍵變更時自動重新啟動。           |
| **`hot`**              | 僅熱套用安全變更。需要重新啟動時記錄警告，由你自行處理。 |
| **`restart`**          | 任何設定變更都會重新啟動閘道，無論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 可熱套用的項目與需要重新啟動的項目

大多數欄位都能熱套用而無須停機；部分熱套用的區段只會重新啟動相應的
子系統（頻道、排程、心跳偵測、健康監控），而非整個閘道。在
`hybrid` 模式下，需要重新啟動閘道的變更會自動處理。

| 類別                | 欄位                                                                    | 是否需要重新啟動閘道？       |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| 頻道                | `channels.*`、`web`（WhatsApp）— 所有內建與外掛頻道       | 否（重新啟動該頻道）         |
| 代理程式與模型      | `agent`、`agents`、`models`、`routing`                                  | 否                           |
| 自動化              | `hooks`、`cron`、`agent.heartbeat`                                      | 否（重新啟動該子系統）       |
| 工作階段與訊息      | `session`、`messages`                                                   | 否                           |
| 工具與媒體          | `tools`、`skills`、`mcp`、`audio`、`talk`                               | 否                           |
| 外掛設定            | `plugins.entries.*`、`plugins.allow`、`plugins.deny`、`plugins.enabled` | 否（重新載入外掛執行階段）   |
| 使用者介面與其他項目 | `ui`、`logging`、`identity`、`bindings`                                 | 否                           |
| 閘道伺服器          | `gateway.*`（連接埠、繫結、驗證、Tailscale、TLS、HTTP、推送）              | **是**                       |
| 基礎架構            | `discovery`、`browser`、`plugins.load`、`plugins.installs`              | **是**                       |

<Note>
`gateway.reload` 與 `gateway.remote` 是 `gateway.*` 下的例外——變更它們**不會**觸發重新啟動。個別外掛也可以覆寫此表：已載入的外掛可以宣告自己的重新啟動觸發設定前綴（例如，隨附的 Canvas 外掛會針對 `plugins.enabled`、`plugins.allow` 與 `plugins.deny` 重新啟動閘道，而不僅是針對其自身的 `plugins.entries.canvas`），因此實際行為取決於目前啟用的外掛。
</Note>

### 重新載入規劃

當你編輯透過 `$include` 參照的來源檔案時，OpenClaw 會依據
來源撰寫時的配置規劃重新載入，而不是使用扁平化的記憶體內檢視。
即使單一頂層區段位於其專屬的引入檔案中，例如
`plugins: { $include: "./plugins.json5" }`，這也能讓熱重新載入決策（熱套用或重新啟動）保持可預期。
如果來源配置有歧義，重新載入規劃會採取失敗關閉策略。

## 設定 RPC（程式化更新）

對於透過閘道 API 寫入設定的工具，建議採用以下流程：

- `config.schema.lookup`：檢查單一子樹（淺層結構描述節點與子項目
  摘要）
- `config.get`：擷取目前的快照與 `hash`
- `config.patch`：進行部分更新（JSON 合併修補：物件會合併、`null`
  會刪除；如果會移除項目，則只有透過 `replacePaths` 明確確認時
  才會取代陣列）
- 只有當你打算取代整份設定時，才使用 `config.apply`
- `update.run`：明確執行自我更新並重新啟動；若重新啟動後的工作階段應再執行一個後續回合，請包含 `continuationMessage`
- `update.status`：檢查最新的更新重新啟動哨兵，並在重新啟動後驗證執行中的版本

代理程式應將 `config.schema.lookup` 視為查閱確切
欄位層級文件與限制的第一站。需要更廣泛的設定對照表、預設值或專用
子系統參考文件的連結時，請使用[設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`、`config.patch`、`update.run`）
採用速率限制：每個方法、每個 `deviceId+clientIp`，每 60 秒最多 30 個要求；
請參閱[速率限制](/zh-TW/gateway/security/rate-limiting)。重新啟動要求會合併，之後在每個重新啟動週期之間強制執行 30 秒的冷卻時間。
`update.status` 為唯讀，但僅限管理員使用，因為重新啟動哨兵可能
包含更新步驟摘要與命令輸出的尾端內容。
</Note>

部分修補範例：

```bash
openclaw gateway call config.get --params '{}'  # 擷取 payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 與 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、
`note` 及 `restartDelayMs`。設定檔一旦已存在，兩種方法都需要
`baseHash`（如果尚無現有設定，首次寫入會略過此檢查）。

`config.patch` 也接受 `replacePaths`，這是一個設定路徑陣列，表示
其陣列取代是有意為之。如果修補會以較少的項目取代現有陣列或將其刪除，
除非該確切路徑出現在 `replacePaths` 中，否則閘道會拒絕寫入；
陣列項目下的巢狀陣列使用 `[]`，例如
`agents.list[].skills`。這可防止截斷的 `config.get` 快照
在未發出警告的情況下覆寫路由或允許清單陣列。當你
打算取代完整設定時，請使用 `config.apply`。

## 環境變數

OpenClaw 會讀取父程序中的環境變數，以及：

- 目前工作目錄中的 `.env`（若存在）
- `~/.openclaw/.env`（全域後備來源）

兩個檔案都不會覆寫現有的環境變數。你也可以在設定中設定內嵌環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 環境變數匯入（選用）">
  如果已啟用且預期的索引鍵尚未設定，OpenClaw 會執行你的登入 Shell，且只匯入缺少的索引鍵：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

對應的環境變數：`OPENCLAW_LOAD_SHELL_ENV=1`。預設 `timeoutMs`：`15000`。
</Accordion>

<Accordion title="設定值中的環境變數替換">
  在任何設定字串值中，使用 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

規則：

- 只比對大寫名稱：`[A-Z_][A-Z0-9_]*`
- 缺少或空白的變數會在載入時擲回錯誤
- 使用 `$${VAR}` 逸出以產生常值輸出
- 可在 `$include` 檔案內使用
- 內嵌替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="密鑰參照（環境變數、檔案、執行命令）">
  對於支援 SecretRef 物件的欄位，你可以使用：

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef 的詳細資訊（包括 `env`/`file`/`exec` 的 `secrets.providers`）位於[密鑰管理](/zh-TW/gateway/secrets)。
支援的認證資訊路徑列於 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。
</Accordion>

如需完整的優先順序與來源資訊，請參閱[環境](/zh-TW/help/environment)。

## 完整參考

如需逐欄位的完整參考資料，請參閱**[設定參考](/zh-TW/gateway/configuration-reference)**。

---

_相關：[設定範例](/zh-TW/gateway/configuration-examples) · [設定參考](/zh-TW/gateway/configuration-reference) · [Doctor](/zh-TW/gateway/doctor)_

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [閘道操作手冊](/zh-TW/gateway)
