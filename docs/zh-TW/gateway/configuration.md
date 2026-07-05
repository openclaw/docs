---
read_when:
    - 第一次設定 OpenClaw
    - 尋找常見的設定模式
    - 瀏覽至特定設定區段
summary: 設定總覽：常見任務、快速設定，以及完整參考的連結
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:17:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eec71e09e4600c6d8016a376bdb190818dfffaaf7eebb9d181ef71b5e95eb2c8
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 支援註解與尾隨逗號">**JSON5**</Tooltip> 設定。如果檔案不存在，OpenClaw 會使用安全預設值。

作用中的設定路徑必須是一般檔案。OpenClaw 擁有的寫入會以原子方式取代它（重新命名到該路徑），因此符號連結的 `openclaw.json` 會讓其目標被取代，而不是透過連結寫入 - 請避免使用符號連結設定佈局。如果你把設定放在預設狀態目錄之外，請將 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。

新增設定的常見原因：

- 連接通道並控制誰可以傳訊息給機器人
- 設定模型、工具、沙盒或自動化（排程、鉤子）
- 調整工作階段、媒體、網路或 UI

請參閱[完整參考](/zh-TW/gateway/configuration-reference)以了解每個可用欄位。

代理程式與自動化在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。使用本頁取得以任務為導向的指南，並使用
[設定參考](/zh-TW/gateway/configuration-reference)取得更完整的
欄位地圖與預設值。

<Tip>
**第一次設定？** 從 `openclaw onboard` 開始進行互動式設定，或查看 [設定範例](/zh-TW/gateway/configuration-examples)指南以取得完整可複製貼上的設定。
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="命令列介面（一行指令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="控制 UI">
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789) 並使用 **設定** 分頁。
    控制 UI 會從即時設定結構描述算繪表單，包含欄位
    `title` / `description` 文件中繼資料，以及可用時的外掛與通道結構描述，
    並提供 **原始 JSON** 編輯器作為備用入口。對於鑽取式
    UI 與其他工具，閘道也會公開 `config.schema.lookup`，用來
    擷取單一路徑範圍的結構描述節點與直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。閘道會監看此檔案並自動套用變更（請參閱[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 只接受完全符合結構描述的設定。未知鍵、格式錯誤的型別或無效值會導致閘道**拒絕啟動**。唯一的根層級例外是 `$schema`（字串），讓編輯器可以附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會列印控制 UI
與驗證使用的標準 JSON Schema。`config.schema.lookup` 會擷取單一路徑範圍的節點與
子項摘要，供鑽取式工具使用。欄位 `title`/`description` 文件中繼資料
會延伸到巢狀物件、萬用字元（`*`）、陣列項目（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。載入資訊清單登錄檔時，執行階段外掛與通道結構描述會合併進來。

驗證失敗時：

- 閘道不會啟動
- 只有診斷指令可運作（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 以查看精確問題
- 執行 `openclaw doctor --fix`（`--repair` 是相同旗標；`--yes` 會略過提示）以套用修復

閘道會在每次成功啟動後保留一份受信任的最後已知可用副本，
但啟動與熱重新載入不會自動還原它 - 只有 `openclaw doctor --fix`
會這麼做。如果 `openclaw.json` 驗證失敗（包含外掛本機驗證），閘道
啟動會失敗，或重新載入會被略過，而目前執行階段會保留最後接受的
設定。遭拒絕的寫入也會另存為 `<path>.rejected.<timestamp>` 以供檢查。
閘道會封鎖看起來像意外覆蓋的寫入 - 例如刪除 `gateway.mode`、
遺失 `meta` 區塊，或讓檔案縮小超過一半 - 除非該寫入
明確允許破壞性變更。當候選內容包含已遮蔽的秘密預留位置，例如 `***` 或 `[redacted]` 時，
會略過提升為最後已知可用版本。

## 常見任務

<AccordionGroup>
  <Accordion title="設定通道（WhatsApp、Telegram、Discord 等）">
    每個通道在 `channels.<provider>` 下都有自己的設定區段。請參閱專屬通道頁面了解設定步驟：

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

    所有通道共用相同的私訊政策模式：

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
    設定主要模型與選用的後援模型：

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

    - `agents.defaults.models` 會定義模型目錄，並作為 `/model` 的允許清單；`provider/*` 項目會將 `/model`、`/models` 與模型選擇器篩選為選定的提供者，同時仍使用動態模型探索。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增允許清單項目，而不移除既有模型。除非你傳入 `--replace`，否則會移除項目的純取代會遭拒絕。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制逐字稿/工具圖片縮小尺寸（預設 `1200`）；較低值通常會降低大量截圖執行時的視覺權杖用量。
    - 請參閱[模型命令列介面](/zh-TW/concepts/models)以了解在聊天中切換模型，以及[模型容錯移轉](/zh-TW/concepts/model-failover)以了解驗證輪換與後援行為。
    - 對於自訂/自行託管提供者，請參閱參考中的[自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰可以傳訊息給機器人">
    私訊存取會透過每個通道的 `dmPolicy` 控制（預設 `"pairing"`）：

    - `"pairing"`：未知寄件者會收到一次性配對碼以供核准
    - `"allowlist"`：只允許 `allowFrom`（或已配對允許儲存區）中的寄件者
    - `"open"`：允許所有傳入私訊（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私訊

    對於群組，使用 `groupPolicy`（`"allowlist" | "open" | "disabled"`）加上 `groupAllowFrom` 或通道特定允許清單。

    請參閱[完整參考](/zh-TW/gateway/config-channels#dm-and-group-access)以了解每個通道的詳細資訊。

  </Accordion>

  <Accordion title="設定群組聊天提及閘控">
    群組訊息預設為**需要提及**。請為每個代理程式設定觸發模式。一般群組/通道回覆會自動發布；對於代理程式應自行決定何時發言的共用聊天室，請選用訊息工具路徑：

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

    - **中繼資料提及**：原生 @ 提及（WhatsApp 點按提及、Telegram @bot 等）
    - **文字模式**：`mentionPatterns` 中的安全 regex 模式
    - **可見回覆**：`messages.visibleReplies` 可要求全域使用訊息工具傳送；`messages.groupChat.visibleReplies` 會覆寫群組/通道的設定。
    - 請參閱[完整參考](/zh-TW/gateway/config-channels#group-chat-mention-gating)以了解可見回覆模式、每個通道的覆寫與自我聊天模式。

  </Accordion>

  <Accordion title="依代理程式限制 Skills">
    使用 `agents.defaults.skills` 作為共用基準，然後以 `agents.list[].skills` 覆寫特定
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
    - 請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config) 與
      [設定參考](/zh-TW/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="調整閘道通道健康狀態監控">
    控制閘道重新啟動看似停滯通道的積極程度：

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

    - 顯示的值是預設值。設定 `gateway.channelHealthCheckMinutes: 0` 可全域停用健康監控重新啟動。
    - `channelStaleEventThresholdMinutes` 應大於或等於檢查間隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可在不停用全域監控的情況下，停用單一通道或帳號的自動重新啟動。
    - 請參閱[健康檢查](/zh-TW/gateway/health)以進行營運除錯，並參閱[完整參考](/zh-TW/gateway/configuration-reference#gateway)以了解所有欄位。

  </Accordion>

  <Accordion title="調整閘道 WebSocket 交握逾時">
    讓本機用戶端在負載較高或低功耗主機上，有更多時間完成驗證前的 WebSocket 交握：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 預設為 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 仍會優先用於一次性的服務或 shell 覆寫。
    - 請優先修復啟動/事件迴圈停滯；這個旋鈕適用於健康但暖機期間較慢的主機。

  </Accordion>

  <Accordion title="設定工作階段與重設">
    工作階段會控制對話連續性與隔離：

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
    - `threadBindings`：以討論串繫結的工作階段路由全域預設值。`/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age` 會依每個工作階段進行繫結、解除繫結、列出與調整（Discord 繫結討論串，Telegram 繫結主題/對話）。
    - 請參閱[工作階段管理](/zh-TW/concepts/session)，了解範圍界定、身分連結與傳送政策。
    - 請參閱[完整參考](/zh-TW/gateway/config-agents#session)，了解所有欄位。

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

    請先建置映像檔 - 從原始碼 checkout 執行 `scripts/sandbox-setup.sh`，或從 npm 安裝時，參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的內嵌 `docker build` 命令。

    請參閱[沙箱](/zh-TW/gateway/sandboxing)取得完整指南，並參閱[完整參考](/zh-TW/gateway/config-agents#agentsdefaultssandbox)了解所有選項。

  </Accordion>

  <Accordion title="為官方 iOS 建置啟用中繼支援的推播">
    公開 App Store 建置的中繼支援推播會使用託管的 OpenClaw 中繼：`https://ios-push-relay.openclaw.ai`。

    自訂中繼部署需要刻意分離的 iOS 建置/部署路徑，其中特定中繼 URL 必須符合閘道中繼 URL。若你正在使用自訂中繼建置，請在閘道設定中設定此項：

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
    - 使用由已配對 iOS app 轉送、以註冊為範圍的傳送授權。閘道不需要整個部署範圍的中繼權杖。
    - 將每個中繼支援的註冊繫結到 iOS app 配對的閘道身分，因此另一個閘道無法重複使用已儲存的註冊。
    - 讓本機/手動 iOS 建置維持直接使用 APNs。中繼支援的傳送只套用於透過中繼註冊的官方發行建置。
    - 必須符合內嵌於 iOS 建置中的中繼基底 URL，讓註冊與傳送流量抵達同一個中繼部署。

    端對端流程：

    1. 安裝官方 iOS app。
    2. 選用：只有在使用刻意分離的自訂中繼建置時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS app 與閘道配對，並讓節點與操作者工作階段都連線。
    4. iOS app 會取得閘道身分，使用 App Attest 加上 app 收據向中繼註冊，然後將中繼支援的 `push.apns.register` 承載發布到已配對的閘道。
    5. 閘道儲存中繼 handle 和傳送授權，然後用於 `push.test`、喚醒提示和重新連線喚醒。

    操作注意事項：

    - 如果你將 iOS app 切換到不同閘道，請重新連線 app，讓它能發布繫結到該閘道的新中繼註冊。
    - 如果你發行指向不同中繼部署的新 iOS 建置，app 會重新整理其快取的中繼註冊，而不是重複使用舊的中繼來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時的環境覆寫。
    - 自訂閘道中繼 URL 必須符合內嵌於 iOS 建置中的中繼基底 URL；公開 App Store 發行通道會拒絕自訂 iOS 中繼 URL 覆寫。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限 loopback 的開發逃生口；不要在設定中持久保存 HTTP 中繼 URL。

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

    - `every`：持續時間字串（`30m`、`2h`）。設定 `0m` 可停用。預設值：`30m`。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：針對 DM 形式心跳偵測目標使用 `allow`（預設）或 `block`
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

    - `sessionRetention`：從 `sessions.json` 修剪已完成的隔離執行工作階段（預設 `24h`；設定 `false` 可停用）。
    - `runLog`：依每個作業修剪保留的排程執行歷史列。歷史記錄儲存在 SQLite；`maxBytes`（預設 `2_000_000`）會保留以相容較舊的檔案後端執行日誌，`keepLines` 預設為 `2000`。
    - 請參閱[排程作業](/zh-TW/automation/cron-jobs)了解功能概觀和命令列介面範例。

  </Accordion>

  <Accordion title="設定網路鉤子（hooks）">
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
    - 將所有 hook/網路鉤子承載內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；不要重複使用有效的閘道驗證密鑰（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。
    - Hook 驗證僅限標頭（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查詢字串權杖會被拒絕。
    - `hooks.path` 不能是 `/`；請將網路鉤子入口保留在專用子路徑，例如 `/hooks`。
    - 除非進行嚴格限定範圍的偵錯，否則請停用不安全內容略過旗標（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果你啟用 `hooks.allowRequestSessionKey`，也要設定 `hooks.allowedSessionKeyPrefixes` 以限制呼叫端選取的工作階段金鑰。
    - 對於 hook 驅動的代理程式，建議使用強大的現代模型層級和嚴格的工具政策（例如僅限訊息傳遞，並在可能時加上沙箱）。

    請參閱[完整參考](/zh-TW/gateway/configuration-reference#hooks)，了解所有對應選項和 Gmail 整合。

  </Accordion>

  <Accordion title="設定多代理程式路由">
    以獨立工作區和工作階段執行多個隔離代理程式：

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

    請參閱[多代理程式](/zh-TW/concepts/multi-agent)和[完整參考](/zh-TW/gateway/config-agents#multi-agent-routing)，了解繫結規則和每個代理程式的存取設定檔。

  </Accordion>

  <Accordion title="將設定拆分為多個檔案（$include）">
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

    - **單一檔案**：取代包含它的物件
    - **檔案陣列**：依序深度合併（後者優先），最多 10 層巢狀深度
    - **同層鍵**：在 include 之後合併（覆寫已 include 的值）
    - **相對路徑**：相對於進行 include 的檔案解析
    - **路徑格式**：include 路徑不得包含 null bytes，且在解析前後都必須嚴格短於 4096 個字元
    - **OpenClaw 擁有的寫入**：當寫入只變更由單一檔案 include 支援的一個頂層區段，例如 `plugins: { $include: "./plugins.json5" }`，OpenClaw 會更新該被 include 的檔案，並保持 `openclaw.json` 不變
    - **不支援的寫入透傳**：根 include、include 陣列，以及含有同層覆寫的 include，會對 OpenClaw 擁有的寫入採取失敗關閉，而不是將設定攤平
    - **限制範圍**：`$include` 路徑必須解析到保存 `openclaw.json` 的目錄底下。若要在多台機器或使用者之間共用目錄樹，請將 `OPENCLAW_INCLUDE_ROOTS` 設為路徑清單（POSIX 上為 `:`，Windows 上為 `;`），列出 include 可以參照的其他目錄。符號連結會被解析並重新檢查，因此即使某個路徑在字面上位於設定目錄中，但其真實目標逃出所有允許的根目錄，仍會被拒絕。
    - **錯誤處理**：針對遺失檔案、剖析錯誤、循環 include、無效路徑格式和過長長度提供清楚錯誤

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

閘道會監看 `~/.openclaw/openclaw.json` 並自動套用變更 - 大多數設定不需要手動重新啟動。

直接檔案編輯在通過驗證前會被視為不受信任。監看器會等待編輯器暫存寫入/重新命名的變動穩定下來、讀取最終檔案，並拒絕無效的外部編輯，而不重寫 `openclaw.json`。OpenClaw 擁有的設定寫入在寫入前會使用相同的結構描述閘門（請參閱[嚴格驗證](#strict-validation)，了解套用於每次寫入的覆寫/復原規則）。

如果你看到 `config reload skipped (invalid config)`，或啟動回報 `Invalid config`，請檢查設定、執行 `openclaw config validate`，然後執行 `openclaw doctor --fix` 進行修復。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)取得檢查清單。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設） | 立即熱套用安全變更。對關鍵變更自動重新啟動。           |
| **`hot`**              | 只熱套用安全變更。需要重新啟動時記錄警告 - 由你處理。 |
| **`restart`**          | 在任何設定變更時重新啟動閘道，不論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可熱套用，哪些需要重新啟動

大多數欄位都能無停機熱套用；部分熱套用區段只會重新啟動該
子系統（頻道、排程、心跳偵測、健康監控器），而不是整個閘道。在
`hybrid` 模式中，需要重新啟動閘道的變更會自動處理。

| 類別                | 欄位                                                                    | 需要重新啟動閘道嗎？         |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| 頻道                | `channels.*`, `web` (WhatsApp) - 所有內建和外掛頻道                    | 否（重新啟動該頻道）         |
| 代理與模型          | `agent`, `agents`, `models`, `routing`                                  | 否                           |
| 自動化              | `hooks`, `cron`, `agent.heartbeat`                                      | 否（重新啟動該子系統）       |
| 工作階段與訊息      | `session`, `messages`                                                   | 否                           |
| 工具與媒體          | `tools`, `skills`, `mcp`, `audio`, `talk`                               | 否                           |
| 外掛設定            | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | 否（重新載入外掛執行階段）   |
| UI 與其他           | `ui`, `logging`, `identity`, `bindings`                                 | 否                           |
| 閘道伺服器          | `gateway.*`（連接埠、繫結、驗證、tailscale、TLS、HTTP、推送）          | **是**                       |
| 基礎架構            | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **是**                       |

<Note>
`gateway.reload` 和 `gateway.remote` 是 `gateway.*` 底下的例外 - 變更它們**不會**觸發重新啟動。個別外掛也可以覆寫此表：已載入的外掛可以宣告自己的觸發重新啟動設定前綴（例如內建 Canvas 外掛會針對 `plugins.enabled`、`plugins.allow` 和 `plugins.deny` 重新啟動閘道，而不只是它自己的 `plugins.entries.canvas`），因此實際行為取決於哪些外掛處於啟用狀態。
</Note>

### 重新載入規劃

當你編輯透過 `$include` 參照的來源檔案時，OpenClaw 會從來源撰寫的版面配置來規劃
重新載入，而不是從展平後的記憶體內檢視規劃。
這可讓熱重新載入決策（熱套用或重新啟動）保持可預測，即使
單一頂層區段位於自己的 include 檔案中，例如
`plugins: { $include: "./plugins.json5" }`。如果
來源版面配置不明確，重新載入規劃會採取失敗關閉。

## 設定 RPC（程式化更新）

對於透過閘道 API 寫入設定的工具，建議使用此流程：

- `config.schema.lookup` 用於檢查一個子樹（淺層 schema 節點與子項
  摘要）
- `config.get` 用於擷取目前快照和 `hash`
- `config.patch` 用於部分更新（JSON merge patch：物件會合併，`null`
  會刪除，陣列會在可能移除項目時以 `replacePaths` 明確確認後取代）
- 只有當你打算取代整個設定時才使用 `config.apply`
- `update.run` 用於明確自我更新和重新啟動；當重新啟動後的工作階段應執行一輪後續回合時，請包含 `continuationMessage`
- `update.status` 用於檢查最新的更新重新啟動 sentinel，並在重新啟動後驗證執行中的版本

代理應將 `config.schema.lookup` 視為取得精確
欄位層級文件與限制的第一站。當需要更完整的設定對照、預設值或連結到專用
子系統參考資料時，請使用[設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`、`config.patch`、`update.run`）會以
每個 `deviceId+clientIp` 每 60 秒 3 個請求進行速率限制。重新啟動
請求會合併，然後在重新啟動週期之間強制 30 秒冷卻時間。
`update.status` 是唯讀的，但屬於管理員範圍，因為重新啟動 sentinel 可能
包含更新步驟摘要與命令輸出尾端。
</Note>

部分 patch 範例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、
`note` 和 `restartDelayMs`。一旦
設定檔已存在，兩個方法都需要 `baseHash`（沒有現有設定的首次寫入會略過檢查）。

`config.patch` 也接受 `replacePaths`，這是設定路徑陣列，表示其陣列
取代是刻意的。如果 patch 會以較少項目取代或刪除現有陣列，
除非該確切路徑出現在 `replacePaths` 中，否則閘道會拒絕寫入；
陣列項目下的巢狀陣列使用 `[]`，例如
`agents.list[].skills`。這可防止遭截斷的 `config.get` 快照
悄悄覆寫路由或允許清單陣列。當你
打算取代完整設定時，請使用 `config.apply`。

## 環境變數

OpenClaw 會從父程序讀取環境變數，外加：

- 目前工作目錄中的 `.env`（如果存在）
- `~/.openclaw/.env`（全域 fallback）

兩個檔案都不會覆寫現有環境變數。你也可以在設定中設定 inline 環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 環境匯入（選用）">
  如果已啟用且預期的 key 尚未設定，OpenClaw 會執行你的 login shell，並只匯入缺少的 key：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

等效環境變數：`OPENCLAW_LOAD_SHELL_ENV=1`。預設 `timeoutMs`：`15000`。
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

- 只會匹配大寫名稱：`[A-Z_][A-Z0-9_]*`
- 缺少或空白變數會在載入時擲出錯誤
- 使用 `$${VAR}` 逸出以輸出字面值
- 可在 `$include` 檔案內運作
- Inline 替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs（env、file、exec）">
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

SecretRef 詳細資訊（包含 `env`/`file`/`exec` 的 `secrets.providers`）位於[密鑰管理](/zh-TW/gateway/secrets)。
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
- [閘道 runbook](/zh-TW/gateway)
