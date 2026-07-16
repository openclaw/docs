---
read_when:
    - 首次設定 OpenClaw
    - 尋找常見的設定模式
    - 導覽至特定設定區段
summary: 設定概覽：常見工作、快速設定，以及完整參考文件的連結
title: 設定
x-i18n:
    generated_at: "2026-07-16T11:35:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 支援註解與尾隨逗號">**JSON5**</Tooltip> 設定。如果檔案不存在，OpenClaw 會使用安全的預設值。

作用中的設定路徑必須是一般檔案。OpenClaw 寫入其擁有的檔案時，會以不可分割的方式取代檔案（重新命名至該路徑），因此符號連結的 `openclaw.json` 會導致其目標被取代，而不是透過連結寫入——請避免使用符號連結的設定配置。如果將設定存放在預設狀態目錄之外，請讓 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。

新增設定的常見原因：

- 連接頻道並控制誰可以傳訊息給機器人
- 設定模型、工具、沙箱或自動化（排程、鉤子）
- 調整工作階段、媒體、網路或使用者介面

如需所有可用欄位，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference)。

代理程式和自動化功能在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。本頁提供以工作為導向的指引；如需更廣泛的
欄位對照與預設值，請參閱[設定參考資料](/zh-TW/gateway/configuration-reference)。

<Tip>
**第一次進行設定？** 請從 `openclaw onboard` 開始進行互動式設定，或查看[設定範例](/zh-TW/gateway/configuration-examples)指南，取得可完整複製貼上的設定。
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
    openclaw onboard       # 完整的初始設定流程
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
  <Tab title="控制介面">
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789)，然後使用 **Config** 分頁。
    控制介面會根據即時設定結構描述呈現表單，其中包括欄位
    `title` / `description` 文件中繼資料，以及可用時的外掛與頻道結構描述，
    並提供 **Raw JSON** 編輯器作為備用方案。針對逐層深入的
    使用者介面與其他工具，閘道也會公開 `config.schema.lookup`，以
    擷取單一路徑範圍的結構描述節點及其直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。閘道會監看檔案並自動套用變更（請參閱[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 僅接受完全符合結構描述的設定。未知的鍵、格式錯誤的型別或無效值，都會使閘道**拒絕啟動**。唯一的根層級例外是 `$schema`（字串），讓編輯器可以附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會輸出控制介面與驗證所使用的標準 JSON Schema。
`config.schema.lookup` 會擷取單一路徑範圍的節點及其子項摘要，
供逐層深入工具使用。欄位 `title`/`description` 文件中繼資料
會延續至巢狀物件、萬用字元（`*`）、陣列項目（`[]`），以及 `anyOf`/
`oneOf`/`allOf` 分支。載入資訊清單登錄時，也會合併執行階段的外掛與頻道結構描述。

驗證失敗時：

- 閘道不會啟動
- 只有診斷命令可運作（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 以查看確切問題
- 執行 `openclaw doctor --fix`（`--repair` 是相同的旗標；`--yes` 會略過提示）以套用修復

每次成功啟動後，閘道都會保留一份可信任的最後已知正常副本，
但啟動與熱重新載入不會自動還原該副本——只有 `openclaw doctor --fix`
會執行還原。如果 `openclaw.json` 驗證失敗（包括外掛內部驗證），閘道
將無法啟動，或略過重新載入，而目前執行階段會繼續使用最後接受的
設定。遭拒絕的寫入也會另存為 `<path>.rejected.<timestamp>`，以供檢查。
閘道會阻擋看似意外覆寫的寫入——例如移除 `gateway.mode`、
遺失 `meta` 區塊，或讓檔案縮小超過一半——除非該寫入
明確允許破壞性變更。如果候選設定包含經遮蔽的密鑰預留位置，例如 `***` 或 `[redacted]`，
則不會將其提升為最後已知正常副本。

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

    所有頻道都使用相同的私人訊息政策模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // 僅適用於 allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="選擇並設定模型">
    設定主要模型與選用的備援模型：

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

    - `agents.defaults.models` 定義模型目錄，並作為 `/model` 的允許清單；`provider/*` 項目會將 `/model`、`/models` 與模型選擇器篩選為指定的提供者，同時仍使用動態模型探索。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增允許清單項目，而不移除現有模型。除非傳入 `--replace`，否則會拒絕可能移除項目的一般取代操作。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制逐字稿／工具圖片的縮小比例（預設為 `1200`）；在大量使用螢幕截圖的執行中，較低的值通常可減少視覺權杖用量。
    - 如需在聊天中切換模型，請參閱[模型命令列介面](/zh-TW/concepts/models)；如需認證輪替與備援行為，請參閱[模型容錯移轉](/zh-TW/concepts/model-failover)。
    - 如需自訂／自行託管的提供者，請參閱參考資料中的[自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰可以傳訊息給機器人">
    私人訊息存取權是透過每個頻道的 `dmPolicy` 控制（預設為 `"pairing"`）：

    - `"pairing"`：未知傳送者會取得一次性的配對碼，以供核准
    - `"allowlist"`：僅限 `allowFrom` 中的傳送者（或已配對的允許儲存區）
    - `"open"`：允許所有傳入的私人訊息（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私人訊息

    對於群組，請使用 `groupPolicy`（`"allowlist" | "open" | "disabled"`）搭配 `groupAllowFrom` 或頻道專用的允許清單。

    如需各頻道的詳細資訊，請參閱[完整參考資料](/zh-TW/gateway/config-channels#dm-and-group-access)。

  </Accordion>

  <Accordion title="設定群組聊天提及閘控">
    群組訊息預設為**需要提及**。請為每個代理程式設定觸發模式。一般群組／頻道回覆會自動發布；對於應由代理程式決定何時發言的共用聊天室，請選擇使用訊息工具路徑：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // 設為 "message_tool" 以要求所有位置都透過訊息工具傳送
        groupChat: {
          visibleReplies: "message_tool", // 選用；可見輸出需要 message(action=send)
          unmentionedInbound: "room_event", // 未提及代理程式的常駐群組對話會作為靜默內容
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

    - **中繼資料提及**：原生 @ 提及（WhatsApp 點選提及、Telegram @bot 等）
    - **文字模式**：`mentionPatterns` 中的安全規則運算式模式
    - **可見回覆**：`messages.visibleReplies` 可要求全域使用訊息工具傳送；`messages.groupChat.visibleReplies` 會針對群組／頻道覆寫該設定。
    - 如需可見回覆模式、各頻道覆寫與自我聊天模式，請參閱[完整參考資料](/zh-TW/gateway/config-channels#group-chat-mention-gating)。

  </Accordion>

  <Accordion title="限制每個代理程式的 Skills">
    使用 `agents.defaults.skills` 設定共用基準，然後透過 `agents.list[].skills`
    覆寫特定代理程式：

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

    - 省略 `agents.defaults.skills` 時，預設不限制 Skills。
    - 省略 `agents.list[].skills` 以繼承預設值。
    - 設定 `agents.list[].skills: []` 代表沒有 Skills。
    - 請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)，以及
      [設定參考資料](/zh-TW/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="調整閘道頻道健康狀態監控">
    控制閘道重新啟動疑似停滯頻道的積極程度：

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
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

    - 顯示的值為預設值。將 `gateway.channelHealthCheckMinutes: 0` 設為停用全域健康狀態監控重新啟動。
    - `channelStaleEventThresholdMinutes` 應大於或等於檢查間隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可停用單一頻道或帳號的自動重新啟動，而不必停用全域監控。
    - 如需操作診斷，請參閱[健康狀態檢查](/zh-TW/gateway/health)；如需所有欄位，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="調整閘道 WebSocket 交握逾時">
    在負載較高或效能較低的主機上，給予本機用戶端更多時間完成驗證前的 WebSocket 交握：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 預設值為 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 對單次服務或 shell 覆寫仍具有優先權。
    - 請優先修正啟動／事件迴圈停滯問題；此調整項適用於運作正常但暖機速度較慢的主機。

  </Accordion>

  <Accordion title="設定工作階段與重設">
    工作階段控制對話的連續性與隔離：

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

    - `dmScope`：`main`（共用）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：執行緒繫結工作階段路由的全域預設值。`/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age` 可針對各工作階段進行繫結、解除繫結、列出及調整（Discord 繫結執行緒，Telegram 繫結主題／對話）。
    - 如需瞭解範圍、身分連結與傳送政策，請參閱[工作階段管理](/zh-TW/concepts/session)。
    - 如需所有欄位，請參閱[完整參考資料](/zh-TW/gateway/config-agents#session)。

  </Accordion>

  <Accordion title="啟用沙箱">
    在隔離的沙箱執行環境中執行代理程式工作階段：

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    請先建置映像檔：若使用原始碼簽出，請執行 `scripts/sandbox-setup.sh`；若透過 npm 安裝，請參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的行內 `docker build` 命令。

    如需完整指南，請參閱[沙箱](/zh-TW/gateway/sandboxing)；如需所有選項，請參閱[完整參考資料](/zh-TW/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="為官方 iOS 組建啟用中繼支援的推播">
    公開 App Store 組建的中繼支援推播會使用託管的 OpenClaw 中繼服務：`https://ios-push-relay.openclaw.ai`。

    自訂中繼部署需要刻意採用獨立的 iOS 組建／部署路徑，且其中繼 URL 必須與閘道中繼 URL 相符。如果使用自訂中繼組建，請在閘道設定中加入：

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

    對應的命令列介面命令：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    此設定的作用：

    - 讓閘道可透過外部中繼服務傳送 `push.test`、喚醒提示及重新連線喚醒。
    - 使用由已配對 iOS App 轉送、限定於該註冊的傳送授權。閘道不需要涵蓋整個部署的中繼權杖。
    - 將每個中繼支援的註冊繫結至 iOS App 所配對的閘道身分，因此其他閘道無法重複使用已儲存的註冊。
    - 讓本機／手動 iOS 組建繼續直接使用 APNs。中繼支援的傳送僅適用於透過中繼服務註冊的官方發行組建。
    - 此值必須與內嵌於 iOS 組建中的中繼基底 URL 相符，讓註冊與傳送流量抵達同一個中繼部署。

    端對端流程：

    1. 安裝官方 iOS App。
    2. 選用：只有在使用刻意獨立的自訂中繼組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS App 與閘道配對，並讓節點和操作員工作階段皆建立連線。
    4. iOS App 會取得閘道身分、使用 App Attest 與 App 收據向中繼服務註冊，然後將中繼支援的 `push.apns.register` 承載資料發布至已配對的閘道。
    5. 閘道會儲存中繼控制代碼與傳送授權，接著使用它們處理 `push.test`、喚醒提示及重新連線喚醒。

    操作注意事項：

    - 如果將 iOS App 切換至不同的閘道，請重新連線 App，使其能發布繫結至該閘道的新中繼註冊。
    - 如果發布指向不同中繼部署的新 iOS 組建，App 會重新整理其快取的中繼註冊，而不會重複使用舊的中繼來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 與 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時性的環境變數覆寫使用。
    - 自訂閘道中繼 URL 必須與內嵌於 iOS 組建中的中繼基底 URL 相符；公開 App Store 發行管道會拒絕自訂的 iOS 中繼 URL 覆寫。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限迴路位址的開發應急機制；請勿在設定中持久儲存 HTTP 中繼 URL。

    如需端對端流程，請參閱 [iOS App](/zh-TW/platforms/ios#relay-backed-push-for-official-builds)；如需中繼服務的安全模型，請參閱[驗證與信任流程](/zh-TW/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="設定心跳偵測（定期報到）">
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

    - `every`：持續時間字串（`30m`、`2h`）。設為 `0m` 可停用。預設值：`30m`。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：`allow`（預設）或 `block`，用於私訊形式的心跳偵測目標
    - 如需完整指南，請參閱[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="設定排程工作">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // 預設值；排程分派 + 隔離的排程代理程式輪次執行
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`：從 SQLite 工作階段資料列中清除已完成的隔離執行工作階段（預設為 `24h`；設為 `false` 可停用）。
    - 執行歷程會自動保留每項工作最新的 2000 筆終止資料列；遺失的資料列仍保有其 24 小時清理期限。
    - 如需功能概覽與命令列介面範例，請參閱[排程工作](/zh-TW/automation/cron-jobs)。

  </Accordion>

  <Accordion title="設定網路鉤子（鉤子）">
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
    - 將所有鉤子／網路鉤子承載資料內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；請勿重複使用有效的閘道驗證密鑰（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - 鉤子驗證僅能透過標頭（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查詢字串中的權杖會遭拒絕。
    - `hooks.path` 不得為 `/`；請將網路鉤子輸入保留在專用子路徑，例如 `/hooks`。
    - 除非進行範圍嚴格受限的偵錯，否則請保持停用不安全內容略過旗標（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制呼叫端選取的工作階段金鑰。
    - 對於由鉤子驅動的代理程式，建議使用功能強大的現代模型層級與嚴格的工具政策（例如僅限訊息功能，並在可行時搭配沙箱）。

    如需所有對應選項與 Gmail 整合，請參閱[完整參考資料](/zh-TW/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="設定多代理程式路由">
    執行多個具有獨立工作區與工作階段的隔離代理程式：

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

    如需繫結規則與各代理程式的存取設定檔，請參閱[多代理程式](/zh-TW/concepts/multi-agent)和[完整參考資料](/zh-TW/gateway/config-agents#multi-agent-routing)。

  </Accordion>

  <Accordion title="將設定拆分為多個檔案（$include）">
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

    - **單一檔案**：取代其所在物件
    - **檔案陣列**：依序深度合併（後者優先），最多可巢狀至 10 層
    - **同層金鑰**：在納入後合併（覆寫已納入的值）
    - **相對路徑**：相對於執行納入的檔案解析
    - **路徑格式**：納入路徑不得包含空位元組，且在解析前後都必須嚴格少於 4096 個字元
    - **OpenClaw 擁有的寫入**：當寫入僅變更由單一檔案納入項目（例如 `plugins: { $include: "./plugins.json5" }`）支援的一個頂層區段時，OpenClaw 會更新該納入檔案，並保持 `openclaw.json` 不變
    - **不支援的直寫**：對於根層納入、納入陣列，以及具有同層覆寫的納入項目，OpenClaw 擁有的寫入會採取失敗即關閉，而不會將設定扁平化
    - **限制範圍**：`$include` 路徑必須解析至包含 `openclaw.json` 的目錄之下。若要跨機器或使用者共用目錄樹，請將 `OPENCLAW_INCLUDE_ROOTS` 設為額外目錄的路徑清單（POSIX 上為 `:`，Windows 上為 `;`），納入項目可參照這些目錄。系統會解析符號連結並重新檢查，因此即使路徑在字面上位於設定目錄內，但其實際目標逸出所有允許的根目錄，仍會遭到拒絕。
    - **錯誤處理**：針對檔案遺失、剖析錯誤、循環納入、無效路徑格式及長度過長提供明確錯誤

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

閘道會監看 `~/.openclaw/openclaw.json` 並自動套用變更，大多數設定不需要手動重新啟動。

直接編輯的檔案在通過驗證之前會視為不受信任。監看程式會等待編輯器的暫存寫入／重新命名變動趨於穩定，讀取最終檔案，並拒絕無效的外部編輯，而不會重寫 `openclaw.json`。OpenClaw 擁有的設定寫入也會在寫入前使用相同的結構描述閘門（適用於每次寫入的覆寫／復原規則，請參閱[嚴格驗證](#strict-validation)）。

如果看到 `config reload skipped (invalid config)`，或啟動程序回報 `Invalid
config`，請檢查設定、執行 `openclaw config validate`，然後執行 `openclaw
doctor --fix` 進行修復。如需檢查清單，請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設） | 立即熱套用安全的變更。遇到關鍵變更時自動重新啟動。           |
| **`hot`**              | 僅熱套用安全的變更。需要重新啟動時記錄警告，由你自行處理。 |
| **`restart`**          | 任何設定變更都會重新啟動閘道，無論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些項目可熱套用，哪些需要重新啟動

大多數欄位都能在不中斷服務的情況下熱套用；某些熱套用區段只會重新啟動該
子系統（頻道、排程、心跳偵測、健康狀態監控），而非整個閘道。在
`hybrid` 模式下，需要重新啟動閘道的變更會自動處理。

| 類別            | 欄位                                                                  | 需要重新啟動閘道？      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| 頻道            | `channels.*`、`web`（WhatsApp）—所有內建及外掛頻道       | 否（重新啟動該頻道）   |
| 代理程式與模型      | `agent`、`agents`、`models`、`routing`                                  | 否                           |
| 自動化          | `hooks`、`cron`、`agent.heartbeat`                                      | 否（重新啟動該子系統） |
| 工作階段與訊息 | `session`、`messages`                                                   | 否                           |
| 工具與媒體       | `tools`、`skills`、`mcp`、`audio`、`talk`                               | 否                           |
| 外掛設定       | `plugins.entries.*`、`plugins.allow`、`plugins.deny`、`plugins.enabled` | 否（重新載入外掛執行階段）  |
| 使用者介面與其他項目           | `ui`、`logging`、`identity`、`bindings`                                 | 否                           |
| 閘道伺服器      | `gateway.*`（連接埠、繫結、驗證、Tailscale、TLS、HTTP、推送）              | **是**                      |
| 基礎架構      | `discovery`、`browser`、`plugins.load`、`plugins.installs`              | **是**                      |

<Note>
`gateway.reload` 和 `gateway.remote` 是 `gateway.*` 下的例外項目，變更它們**不會**觸發重新啟動。個別外掛也可覆寫此表：已載入的外掛可以宣告自身會觸發重新啟動的設定前置詞（例如，隨附的 Canvas 外掛會因 `plugins.enabled`、`plugins.allow` 和 `plugins.deny` 而重新啟動閘道，而不僅是其自身的 `plugins.entries.canvas`），因此實際行為取決於哪些外掛處於啟用狀態。
</Note>

### 重新載入規劃

編輯透過 `$include` 參照的來源檔案時，OpenClaw 會根據
來源撰寫時的配置規劃重新載入，而非攤平後的記憶體內檢視。
如此一來，即使單一頂層區段位於獨立的引入檔案中，例如
`plugins: { $include: "./plugins.json5" }`，熱重新載入決策（熱套用或重新啟動）仍可保持可預測。
如果來源配置不明確，重新載入規劃會採取失敗時關閉的方式。

## 設定 RPC（程式化更新）

對於透過閘道 API 寫入設定的工具，建議採用以下流程：

- `config.schema.lookup`：檢查單一子樹狀結構（淺層結構描述節點 + 子項
  摘要）
- `config.get`：擷取目前快照及 `hash`
- `config.patch`：用於部分更新（JSON 合併修補：物件合併、`null`
  刪除；若會移除項目，則必須使用 `replacePaths` 明確確認後
  才會取代陣列）
- `config.apply`：僅在你打算取代整份設定時使用
- `update.run`：用於明確的自我更新及重新啟動；若重新啟動後的工作階段應執行一次後續輪次，請加入 `continuationMessage`
- `update.status`：檢查最新的更新重新啟動哨兵，並在重新啟動後驗證執行中的版本

代理程式應將 `config.schema.lookup` 視為查閱確切
欄位層級文件與限制的第一站。需要更廣泛的設定對照、預設值或專用
子系統參考連結時，請使用[設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`、`config.patch`、`update.run`）
會按每個 `deviceId+clientIp` 限制為每 60 秒 3 個要求。重新啟動
要求會合併，之後在重新啟動週期之間強制執行 30 秒的冷卻時間。
`update.status` 為唯讀，但僅限管理員存取，因為重新啟動哨兵可能
包含更新步驟摘要及命令輸出的末尾內容。
</Note>

部分修補範例：

```bash
openclaw gateway call config.get --params '{}'  # 擷取 payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 均接受 `raw`、`baseHash`、`sessionKey`、
`note` 和 `restartDelayMs`。設定檔一旦存在，兩種方法都必須提供
`baseHash`（若尚無現有設定，第一次寫入會略過此檢查）。

`config.patch` 也接受 `replacePaths`，這是一組刻意要取代陣列的設定路徑。
如果修補會以較少的項目取代現有陣列，或刪除現有陣列，除非該確切路徑出現在
`replacePaths` 中，否則閘道會拒絕寫入；陣列項目下的巢狀陣列使用
`[]`，例如 `agents.list[].skills`。這可防止截斷的
`config.get` 快照無聲地覆寫路由或允許清單陣列。若你
打算取代完整設定，請使用 `config.apply`。

## 環境變數

OpenClaw 會讀取父程序中的環境變數，以及：

- `.env`：來自目前工作目錄（若存在）
- `~/.openclaw/.env`（全域備援）

這兩個檔案都不會覆寫現有的環境變數。你也可以在設定中設定行內環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 環境變數匯入（選用）">
  若已啟用且預期的鍵尚未設定，OpenClaw 會執行你的登入 Shell，並只匯入缺少的鍵：

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
  在任何設定字串值中使用 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

規則：

- 僅比對大寫名稱：`[A-Z_][A-Z0-9_]*`
- 變數缺少或為空時，會在載入時擲回錯誤
- 若要輸出字面值，請使用 `$${VAR}` 跳脫
- 可在 `$include` 檔案內使用
- 行內替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="機密參照（環境變數、檔案、執行）">
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

SecretRef 詳細資訊（包括 `env`/`file`/`exec` 的 `secrets.providers`）位於[機密管理](/zh-TW/gateway/secrets)。
支援的認證資訊路徑列於 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。
</Accordion>

如需完整的優先順序與來源，請參閱[環境](/zh-TW/help/environment)。

## 完整參考

如需逐欄位的完整參考，請參閱**[設定參考](/zh-TW/gateway/configuration-reference)**。

---

_相關：[設定範例](/zh-TW/gateway/configuration-examples) · [設定參考](/zh-TW/gateway/configuration-reference) · [Doctor](/zh-TW/gateway/doctor)_

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [閘道操作手冊](/zh-TW/gateway)
