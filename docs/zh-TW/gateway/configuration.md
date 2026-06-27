---
read_when:
    - 首次設定 OpenClaw
    - 尋找常見的設定模式
    - 瀏覽至特定設定區段
summary: 設定概覽：常見工作、快速設定，以及完整參考的連結
title: 設定
x-i18n:
    generated_at: "2026-06-27T19:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 支援註解與尾隨逗號">**JSON5**</Tooltip> 設定。
作用中的設定路徑必須是一般檔案。對於 OpenClaw 擁有的寫入，不支援以符號連結的 `openclaw.json`
配置；原子寫入可能會取代該路徑，而不是保留符號連結。如果你將設定保存在
預設狀態目錄之外，請將 `OPENCLAW_CONFIG_PATH` 直接指向真實檔案。

如果檔案不存在，OpenClaw 會使用安全預設值。常見新增設定的原因：

- 連接頻道並控制誰可以傳訊息給機器人
- 設定模型、工具、沙箱或自動化（排程、鉤子）
- 調整工作階段、媒體、網路或 UI

請參閱[完整參考](/zh-TW/gateway/configuration-reference)，了解每個可用欄位。

代理程式與自動化在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。請使用本頁取得以工作為導向的指引，並使用
[設定參考](/zh-TW/gateway/configuration-reference) 查看更廣泛的
欄位地圖與預設值。

<Tip>
**剛開始使用設定？** 請從 `openclaw onboard` 開始進行互動式設定，或查看[設定範例](/zh-TW/gateway/configuration-examples)指南，取得完整可複製貼上的設定。
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
    openclaw onboard       # 完整上線流程
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
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789) 並使用 **設定** 分頁。
    控制 UI 會從即時設定結構描述呈現表單，包含欄位
    `title` / `description` 文件中繼資料，以及可用時的外掛與頻道結構描述，
    並提供 **Raw JSON** 編輯器作為備用出口。對於深入檢視
    UI 和其他工具，閘道也會公開 `config.schema.lookup`，用來
    擷取一個依路徑限定的結構描述節點與其直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。閘道會監看該檔案並自動套用變更（請參閱[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 只接受完全符合結構描述的設定。未知鍵、格式錯誤的型別或無效值會導致閘道**拒絕啟動**。唯一的根層級例外是 `$schema`（字串），讓編輯器可以附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會列印控制 UI
與驗證使用的標準 JSON Schema。`config.schema.lookup` 會擷取單一依路徑限定的節點與
子項摘要，供深入檢視工具使用。欄位 `title`/`description` 文件中繼資料
會貫穿巢狀物件、萬用字元（`*`）、陣列項目（`[]`），以及 `anyOf`/
`oneOf`/`allOf` 分支。當資訊清單登錄載入時，執行階段外掛與頻道結構描述會合併進來。

驗證失敗時：

- 閘道不會開機
- 只有診斷命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 查看精確問題
- 執行 `openclaw doctor --fix`（或 `--yes`）套用修復

閘道會在每次成功啟動後保留受信任的最後已知良好副本，
但啟動與熱重新載入不會自動還原它。如果 `openclaw.json`
驗證失敗（包括外掛本機驗證），閘道啟動會失敗，或
重新載入會被略過，而目前執行階段會保留最後接受的設定。
執行 `openclaw doctor --fix`（或 `--yes`）修復帶前綴/遭覆寫的設定，或
還原最後已知良好副本。當候選設定包含已遮蔽的祕密佔位符，例如 `***` 時，
會略過提升為最後已知良好副本。

## 常見工作

<AccordionGroup>
  <Accordion title="設定頻道（WhatsApp、Telegram、Discord 等）">
    每個頻道在 `channels.<provider>` 下都有自己的設定區段。請參閱專屬頻道頁面了解設定步驟：

    - [WhatsApp](/zh-TW/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/zh-TW/channels/telegram) - `channels.telegram`
    - [Discord](/zh-TW/channels/discord) - `channels.discord`
    - [Feishu](/zh-TW/channels/feishu) - `channels.feishu`
    - [Google Chat](/zh-TW/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/zh-TW/channels/msteams) - `channels.msteams`
    - [Slack](/zh-TW/channels/slack) - `channels.slack`
    - [Signal](/zh-TW/channels/signal) - `channels.signal`
    - [iMessage](/zh-TW/channels/imessage) - `channels.imessage`
    - [Mattermost](/zh-TW/channels/mattermost) - `channels.mattermost`

    所有頻道都共用相同的私人訊息政策模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="選擇並設定模型">
    設定主要模型與選用的備援：

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

    - `agents.defaults.models` 定義模型目錄，並作為 `/model` 的允許清單；`provider/*` 項目會將 `/model`、`/models` 與模型選擇器篩選至選取的提供者，同時仍使用動態模型探索。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增允許清單項目，而不移除現有模型。除非傳入 `--replace`，否則會移除項目的純取代會被拒絕。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制逐字稿/工具影像縮小（預設 `1200`）；較低的值通常可減少螢幕截圖密集執行時的視覺權杖用量。
    - 請參閱[模型命令列介面](/zh-TW/concepts/models)了解在聊天中切換模型，並參閱[模型容錯移轉](/zh-TW/concepts/model-failover)了解驗證輪替與備援行為。
    - 對於自訂/自託管提供者，請參閱參考中的[自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰可以傳訊息給機器人">
    私人訊息存取會透過 `dmPolicy` 依頻道控制：

    - `"pairing"`（預設）：未知傳送者會取得一次性配對碼以供核准
    - `"allowlist"`：只允許 `allowFrom` 中的傳送者（或已配對允許儲存區中的傳送者）
    - `"open"`：允許所有傳入私人訊息（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私人訊息

    對於群組，請使用 `groupPolicy` + `groupAllowFrom` 或頻道特定允許清單。

    請參閱[完整參考](/zh-TW/gateway/config-channels#dm-and-group-access)，了解各頻道詳細資訊。

  </Accordion>

  <Accordion title="設定群組聊天提及閘控">
    群組訊息預設為**需要提及**。依代理程式設定觸發模式。一般群組/頻道回覆會自動發布；對於共享聊天室，如需讓代理程式決定何時發言，請選擇使用訊息工具路徑：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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
    - **文字模式**：`mentionPatterns` 中的安全 regex 模式
    - **可見回覆**：`messages.visibleReplies` 可以全域要求訊息工具傳送；`messages.groupChat.visibleReplies` 會對群組/頻道覆寫該設定。
    - 請參閱[完整參考](/zh-TW/gateway/config-channels#group-chat-mention-gating)，了解可見回覆模式、各頻道覆寫與自我聊天模式。

  </Accordion>

  <Accordion title="依代理程式限制 Skills">
    使用 `agents.defaults.skills` 作為共用基準，然後用 `agents.list[].skills` 覆寫特定
    代理程式：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 時，預設不限制 Skills。
    - 省略 `agents.list[].skills` 以繼承預設值。
    - 設定 `agents.list[].skills: []` 表示沒有 Skills。
    - 請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)，以及
      [設定參考](/zh-TW/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="調整閘道頻道健康狀態監控">
    控制閘道對看似停滯的頻道進行重新啟動的積極程度：

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

    - 設定 `gateway.channelHealthCheckMinutes: 0` 可全域停用健康狀態監控重新啟動。
    - `channelStaleEventThresholdMinutes` 應大於或等於檢查間隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，在不停用全域監控的情況下，停用單一頻道或帳戶的自動重新啟動。
    - 請參閱[健康檢查](/zh-TW/gateway/health)了解操作偵錯，並參閱[完整參考](/zh-TW/gateway/configuration-reference#gateway)了解所有欄位。

  </Accordion>

  <Accordion title="調整閘道 WebSocket 交握逾時">
    在負載較高或低功耗主機上，給本機用戶端更多時間完成預先驗證的 WebSocket 交握：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 預設為 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 仍會優先用於一次性的服務或 shell 覆寫。
    - 請優先修復啟動/事件迴圈停頓；這個旋鈕適用於健康但暖機期間較慢的主機。

  </Accordion>

  <Accordion title="設定工作階段與重設">
    工作階段控制對話連續性與隔離：

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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
    - `threadBindings`: 執行緒繫結工作階段路由的全域預設值（Discord 支援 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 請參閱[工作階段管理](/zh-TW/concepts/session)，了解範圍界定、身分連結和傳送政策。
    - 請參閱[完整參考](/zh-TW/gateway/config-agents#session)，了解所有欄位。

  </Accordion>

  <Accordion title="啟用沙箱化">
    在隔離的沙箱執行階段中執行代理工作階段：

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

    請先建置映像檔 - 若是從原始碼 checkout 執行，請執行 `scripts/sandbox-setup.sh`；若是從 npm 安裝，請參閱[沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的內嵌 `docker build` 命令。

    請參閱[沙箱化](/zh-TW/gateway/sandboxing)取得完整指南，並參閱[完整參考](/zh-TW/gateway/config-agents#agentsdefaultssandbox)了解所有選項。

  </Accordion>

  <Accordion title="為官方 iOS 建置啟用中繼支援的推播">
    公開 App Store/TestFlight 建置的中繼支援推播會使用託管的 OpenClaw 中繼：`https://ios-push-relay.openclaw.ai`。

    自訂中繼部署需要刻意分離的 iOS 建置/部署路徑，且其中繼 URL 必須符合閘道中繼 URL。如果你使用自訂中繼建置，請在閘道設定中設定：

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    等效的命令列介面：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    這會做什麼：

    - 讓閘道透過外部中繼傳送 `push.test`、喚醒提示和重新連線喚醒。
    - 使用由已配對 iOS App 轉送、以註冊為範圍的傳送授權。閘道不需要部署範圍的中繼權杖。
    - 將每個中繼支援的註冊繫結到 iOS App 配對的閘道身分，因此其他閘道無法重複使用已儲存的註冊。
    - 讓本機/手動 iOS 建置維持直接使用 APNs。中繼支援的傳送只適用於透過中繼註冊的官方發佈建置。
    - 必須符合烘焙進 iOS 建置中的中繼基底 URL，讓註冊和傳送流量抵達同一個中繼部署。

    端對端流程：

    1. 安裝官方/TestFlight iOS 建置。
    2. 選用：只有在使用刻意分離的自訂中繼建置時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS App 與閘道配對，並讓節點與操作員工作階段都連線。
    4. iOS App 擷取閘道身分，使用 App Attest 加上 App 收據向中繼註冊，然後將中繼支援的 `push.apns.register` 酬載發布到已配對的閘道。
    5. 閘道儲存中繼控制代碼和傳送授權，接著將它們用於 `push.test`、喚醒提示和重新連線喚醒。

    營運注意事項：

    - 如果你將 iOS App 切換到不同的閘道，請重新連線 App，讓它能發布繫結到該閘道的新中繼註冊。
    - 如果你發佈指向不同中繼部署的新 iOS 建置，App 會重新整理其快取的中繼註冊，而不是重複使用舊的中繼來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時的環境變數覆寫。
    - 自訂閘道中繼 URL 必須符合烘焙進 iOS 建置中的中繼基底 URL。公開 App Store 發行通道會拒絕自訂 iOS 中繼 URL 覆寫。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限 loopback 的開發逃生口；請勿在設定中持久化 HTTP 中繼 URL。

    請參閱 [iOS App](/zh-TW/platforms/ios#relay-backed-push-for-official-builds) 了解端對端流程，並參閱[驗證與信任流程](/zh-TW/platforms/ios#authentication-and-trust-flow)了解中繼安全模型。

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

    - `every`: 持續時間字串（`30m`、`2h`）。設定為 `0m` 可停用。
    - `target`: `last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`: 針對 DM 樣式心跳偵測目標的 `allow`（預設）或 `block`
    - 請參閱[心跳偵測](/zh-TW/gateway/heartbeat)取得完整指南。

  </Accordion>

  <Accordion title="設定排程作業">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 從 `sessions.json` 修剪已完成的隔離執行工作階段（預設 `24h`；設定 `false` 可停用）。
    - `runLog`: 依作業修剪保留的排程執行歷史記錄列。`maxBytes` 仍會為較舊的檔案支援執行記錄接受。
    - 請參閱[排程作業](/zh-TW/automation/cron-jobs)了解功能概觀和命令列介面範例。

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

    安全注意事項：
    - 將所有鉤子/網路鉤子酬載內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；請勿重複使用有效的閘道驗證密鑰（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - 鉤子驗證僅限標頭（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查詢字串權杖會被拒絕。
    - `hooks.path` 不能是 `/`；請將網路鉤子入口保留在專用子路徑，例如 `/hooks`。
    - 除非進行嚴格界定範圍的偵錯，否則請保持停用不安全內容略過旗標（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果你啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制呼叫端選擇的工作階段鍵。
    - 對於由鉤子驅動的代理，建議使用強大的現代模型層級與嚴格工具政策（例如僅限訊息傳送，並在可行時搭配沙箱化）。

    請參閱[完整參考](/zh-TW/gateway/configuration-reference#hooks)了解所有對應選項與 Gmail 整合。

  </Accordion>

  <Accordion title="設定多代理路由">
    使用獨立工作區與工作階段執行多個隔離代理：

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

    請參閱[多代理](/zh-TW/concepts/multi-agent)和[完整參考](/zh-TW/gateway/config-agents#multi-agent-routing)，了解繫結規則與每個代理的存取設定檔。

  </Accordion>

  <Accordion title="將設定拆分為多個檔案 ($include)">
    使用 `$include` 組織大型設定：

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

    - **單一檔案**：取代其所在的物件
    - **檔案陣列**：依序深度合併（後者優先）
    - **同層鍵**：在 include 之後合併（覆寫已 include 的值）
    - **巢狀 include**：支援最多 10 層深度
    - **相對路徑**：相對於執行 include 的檔案解析
    - **路徑格式**：include 路徑不得包含 null 位元組，且解析前後都必須嚴格短於 4096 個字元
    - **OpenClaw 擁有的寫入**：當寫入只變更一個頂層區段，且該區段
      由單一檔案 include 支援，例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 會更新該已 include 的檔案，並保持 `openclaw.json` 不變
    - **不支援的寫入穿透**：根 include、include 陣列，以及帶有同層覆寫的 include
      會對 OpenClaw 擁有的寫入以失敗關閉處理，而不是
      將設定扁平化
    - **限制範圍**：`$include` 路徑必須解析到存放
      `openclaw.json` 的目錄底下。若要跨機器或使用者共享樹狀結構，請將
      `OPENCLAW_INCLUDE_ROOTS` 設為路徑清單（POSIX 使用 `:`，Windows 使用 `;`），其中列出
      include 可參照的其他目錄。符號連結會被解析
      並重新檢查，因此即使某個路徑在字面上位於設定目錄內，但其
      真實目標逃出所有允許根目錄，仍會被拒絕。
    - **錯誤處理**：針對檔案遺失、解析錯誤、循環 include、無效路徑格式與長度過長提供清楚錯誤

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

閘道會監看 `~/.openclaw/openclaw.json` 並自動套用變更 - 大多數設定不需要手動重新啟動。

直接檔案編輯在通過驗證前會被視為不受信任。監看器會等待
編輯器暫存寫入/重新命名的變動穩定下來，讀取最終檔案，並拒絕
無效的外部編輯，而不會重寫 `openclaw.json`。OpenClaw 擁有的設定
寫入在寫入前也會使用相同的 schema 閘門；破壞性覆寫，例如
刪除 `gateway.mode` 或讓檔案縮小超過一半，會被拒絕並
儲存為 `.rejected.*` 以供檢查。

如果你看到 `config reload skipped (invalid config)`，或啟動時回報 `Invalid
config`，請檢查設定、執行 `openclaw config validate`，再執行 `openclaw
doctor --fix` 進行修復。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)
取得檢查清單。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設） | 立即熱套用安全變更。對關鍵變更自動重新啟動。           |
| **`hot`**              | 只熱套用安全變更。需要重新啟動時記錄警告 - 由你處理。 |
| **`restart`**          | 任何設定變更都會重新啟動閘道，不論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下一次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些會熱套用，哪些需要重新啟動

大多數欄位都會在不中斷服務的情況下熱套用。在 `hybrid` 模式中，需要重新啟動的變更會自動處理。

| 類別                | 欄位                                                              | 需要重新啟動？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 通道                | `channels.*`, `web` (WhatsApp) - 所有內建與外掛通道              | 否              |
| 代理程式與模型      | `agent`, `agents`, `models`, `routing`                            | 否              |
| 自動化              | `hooks`, `cron`, `agent.heartbeat`                                | 否              |
| 工作階段與訊息      | `session`, `messages`                                             | 否              |
| 工具與媒體          | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | 否              |
| UI 與其他           | `ui`, `logging`, `identity`, `bindings`                           | 否              |
| 閘道伺服器          | `gateway.*`（連接埠、綁定位址、驗證、tailscale、TLS、HTTP）      | **是**          |
| 基礎架構            | `discovery`, `plugins`                                            | **是**          |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 - 變更它們**不會**觸發重新啟動。
</Note>

### 重新載入規劃

當你編輯透過 `$include` 參照的來源檔案時，OpenClaw 會從來源作者撰寫的版面規劃重新載入，而不是從攤平後的記憶體內檢視規劃。
這讓熱重新載入決策（熱套用或重新啟動）保持可預測，即使單一最上層區段位於自己的引入檔案中，例如
`plugins: { $include: "./plugins.json5" }`。如果來源版面不明確，重新載入規劃會以封閉方式失敗。

## 設定 RPC（程式化更新）

對於透過閘道 API 寫入設定的工具，建議使用此流程：

- `config.schema.lookup` 用來檢查一個子樹（淺層結構描述節點 + 子項摘要）
- `config.get` 用來擷取目前快照加上 `hash`
- `config.patch` 用於部分更新（JSON 合併修補：物件會合併，`null` 會刪除，陣列在已使用 `replacePaths` 明確確認時替換，如果項目會被移除）
- `config.apply` 僅在你打算替換整個設定時使用
- `update.run` 用於明確自我更新加重新啟動；如果重新啟動後的工作階段應執行一個後續回合，請包含 `continuationMessage`
- `update.status` 用來檢查最新的更新重新啟動哨兵，並在重新啟動後驗證執行中的版本

代理程式應將 `config.schema.lookup` 視為取得精確欄位層級文件與限制的第一站。當它們需要更廣泛的設定映射、預設值，或連往專用子系統參考的連結時，請使用[設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`, `config.patch`, `update.run`）會以每個 `deviceId+clientIp` 每 60 秒 3 個請求進行速率限制。重新啟動請求會合併，然後在重新啟動週期之間強制執行 30 秒冷卻時間。
`update.status` 是唯讀的，但限管理員範圍，因為重新啟動哨兵可能包含更新步驟摘要與命令輸出尾端。
</Note>

部分修補範例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`, `baseHash`, `sessionKey`, `note`, 和 `restartDelayMs`。當設定已存在時，兩種方法都需要 `baseHash`。

`config.patch` 也接受 `replacePaths`，這是一組設定路徑陣列，表示其陣列替換是有意的。如果修補會以較少項目替換或刪除現有陣列，除非該確切路徑出現在 `replacePaths` 中，否則閘道會拒絕寫入；陣列項目下的巢狀陣列使用 `[]`，例如
`agents.list[].skills`。這可防止被截斷的 `config.get` 快照悄悄覆蓋路由或允許清單陣列。當你打算替換完整設定時，請使用 `config.apply`。

## 環境變數

OpenClaw 會從父處理程序加上以下來源讀取環境變數：

- 目前工作目錄中的 `.env`（如果存在）
- `~/.openclaw/.env`（全域備援）

這兩個檔案都不會覆寫既有環境變數。你也可以在設定中設定內嵌環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 環境變數匯入（選用）">
  如果啟用且預期的金鑰尚未設定，OpenClaw 會執行你的登入 shell，並只匯入缺少的金鑰：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

等效環境變數：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="設定值中的環境變數替換">
  使用 `${VAR_NAME}` 在任何設定字串值中參照環境變數：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

規則：

- 只匹配大寫名稱：`[A-Z_][A-Z0-9_]*`
- 缺少或空白的變數會在載入時擲出錯誤
- 使用 `$${VAR}` 跳脫以輸出字面值
- 可在 `$include` 檔案內運作
- 內嵌替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="祕密參照（環境變數、檔案、執行）">
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

SecretRef 詳細資訊（包含 `env`/`file`/`exec` 的 `secrets.providers`）位於[祕密管理](/zh-TW/gateway/secrets)。
支援的憑證路徑列於 [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)。
</Accordion>

完整優先順序與來源請參閱[環境](/zh-TW/help/environment)。

## 完整參考

如需完整的逐欄位參考，請參閱 **[設定參考](/zh-TW/gateway/configuration-reference)**。

---

_相關：[設定範例](/zh-TW/gateway/configuration-examples) · [設定參考](/zh-TW/gateway/configuration-reference) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [閘道操作手冊](/zh-TW/gateway)
