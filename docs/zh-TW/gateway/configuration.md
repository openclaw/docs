---
read_when:
    - 首次設定 OpenClaw
    - 正在尋找常見的設定模式
    - 導覽至特定設定區段
summary: 設定概觀：常見任務、快速設定，以及完整參考文件連結
title: 設定
x-i18n:
    generated_at: "2026-05-02T02:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 設定。
作用中的設定路徑必須是一般檔案。符號連結的 `openclaw.json`
配置不支援 OpenClaw 擁有的寫入；原子寫入可能會取代
該路徑，而不是保留符號連結。如果你將設定放在
預設狀態目錄之外，請將 `OPENCLAW_CONFIG_PATH` 直接指向真正的檔案。

如果檔案不存在，OpenClaw 會使用安全的預設值。常見的新增設定原因：

- 連接頻道並控制誰可以傳訊息給機器人
- 設定模型、工具、沙箱或自動化（cron、hooks）
- 調整工作階段、媒體、網路或 UI

請參閱[完整參考](/zh-TW/gateway/configuration-reference)以了解每個可用欄位。

代理程式與自動化在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。此頁提供任務導向指引；更完整的
欄位地圖與預設值，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

<Tip>
**剛開始設定嗎？** 使用 `openclaw onboard` 進行互動式設定，或查看[設定範例](/zh-TW/gateway/configuration-examples)指南取得完整可複製貼上的設定。
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
  <Tab title="CLI（一行指令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="控制 UI">
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789)，並使用 **設定** 分頁。
    控制 UI 會從即時設定架構轉譯表單，包括欄位
    `title` / `description` 文件中繼資料，以及可用時的 plugin 與頻道架構，
    並提供 **原始 JSON** 編輯器作為逃生出口。對於下鑽式
    UI 與其他工具，Gateway 也公開 `config.schema.lookup`，用來
    擷取單一路徑範圍的架構節點及其直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。Gateway 會監看該檔案並自動套用變更（見[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 只接受完全符合架構的設定。未知鍵、格式錯誤的型別或無效值都會導致 Gateway **拒絕啟動**。唯一的根層級例外是 `$schema`（字串），因此編輯器可以附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會列印 Control UI
與驗證所使用的權威 JSON Schema。`config.schema.lookup` 會擷取單一路徑範圍節點及其
子項摘要，供下鑽工具使用。欄位 `title`/`description` 文件中繼資料
會傳遞到巢狀物件、萬用字元（`*`）、陣列項目（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。執行階段 plugin 與頻道架構會在
manifest registry 載入時合併進來。

驗證失敗時：

- Gateway 不會啟動
- 只有診斷指令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 查看精確問題
- 執行 `openclaw doctor --fix`（或 `--yes`）套用修復

Gateway 會在每次成功啟動後保留一份受信任的最後已知良好副本。
如果 `openclaw.json` 之後驗證失敗（或移除 `gateway.mode`、大幅縮小，
或前面被插入一行誤置的記錄），OpenClaw 會將損壞檔案保留為
`.clobbered.*`，還原最後已知良好副本，並記錄復原
原因。下一次代理程式回合也會收到系統事件警告，讓主要
代理程式不會盲目重寫已還原的設定。當候選檔案包含已遮蔽的秘密預留位置（例如 `***`）時，
會略過提升為最後已知良好。
當每個驗證問題的範圍都限於 `plugins.entries.<id>...` 時，OpenClaw
不會執行整檔復原。它會保持目前設定作用中，並
顯示 plugin 本地失敗，使 plugin 架構或主機版本不相容
無法回復不相關的使用者設定。

## 常見任務

<AccordionGroup>
  <Accordion title="設定頻道（WhatsApp、Telegram、Discord 等）">
    每個頻道都有自己的設定區段，位於 `channels.<provider>` 下。設定步驟請參閱專用頻道頁面：

    - [WhatsApp](/zh-TW/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/zh-TW/channels/telegram) — `channels.telegram`
    - [Discord](/zh-TW/channels/discord) — `channels.discord`
    - [Feishu](/zh-TW/channels/feishu) — `channels.feishu`
    - [Google Chat](/zh-TW/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/zh-TW/channels/msteams) — `channels.msteams`
    - [Slack](/zh-TW/channels/slack) — `channels.slack`
    - [Signal](/zh-TW/channels/signal) — `channels.signal`
    - [iMessage](/zh-TW/channels/imessage) — `channels.imessage`
    - [Mattermost](/zh-TW/channels/mattermost) — `channels.mattermost`

    所有頻道共用相同的私訊政策模式：

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
    設定主要模型與選用備援：

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

    - `agents.defaults.models` 定義模型目錄，並作為 `/model` 的允許清單。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增允許清單項目，而不移除現有模型。除非傳入 `--replace`，否則會移除項目的純取代會被拒絕。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制逐字稿/工具圖片縮小（預設 `1200`）；較低的值通常可降低大量截圖執行時的視覺 token 使用量。
    - 請參閱[模型 CLI](/zh-TW/concepts/models) 了解在聊天中切換模型，以及[模型容錯移轉](/zh-TW/concepts/model-failover) 了解驗證輪替與備援行為。
    - 自訂/自架提供者請參閱參考中的[自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰可以傳訊息給機器人">
    私訊存取權會依頻道透過 `dmPolicy` 控制：

    - `"pairing"`（預設）：未知傳送者會收到一次性配對碼以供核准
    - `"allowlist"`：只允許 `allowFrom`（或已配對允許儲存區）中的傳送者
    - `"open"`：允許所有傳入私訊（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私訊

    對於群組，請使用 `groupPolicy` + `groupAllowFrom` 或頻道專屬允許清單。

    各頻道詳細資料請參閱[完整參考](/zh-TW/gateway/config-channels#dm-and-group-access)。

  </Accordion>

  <Accordion title="設定群組聊天提及門檻">
    群組訊息預設為**需要提及**。請為每個代理程式設定觸發模式，並讓可見聊天室回覆維持在預設訊息工具路徑，除非你有意使用舊版自動最終回覆：

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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
    - **可見回覆**：`messages.visibleReplies` 可要求全域使用訊息工具傳送；`messages.groupChat.visibleReplies` 會為群組/頻道覆寫該設定。
    - 可見回覆模式、各頻道覆寫與自我聊天模式請參閱[完整參考](/zh-TW/gateway/config-channels#group-chat-mention-gating)。

  </Accordion>

  <Accordion title="限制每個代理程式的 Skills">
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
    - 省略 `agents.list[].skills` 時，會繼承預設值。
    - 設定 `agents.list[].skills: []` 表示沒有 Skills。
    - 請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)，以及
      [設定參考](/zh-TW/gateway/config-agents#agents-defaults-skills)。

  </Accordion>

  <Accordion title="調整 Gateway 頻道健康監控">
    控制 Gateway 對看似停滯的頻道重新啟動的積極程度：

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

    - 設定 `gateway.channelHealthCheckMinutes: 0` 可全域停用健康監控重新啟動。
    - `channelStaleEventThresholdMinutes` 應大於或等於檢查間隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可停用單一頻道或帳號的自動重新啟動，而不停用全域監控。
    - 營運除錯請參閱[健康檢查](/zh-TW/gateway/health)，所有欄位請參閱[完整參考](/zh-TW/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="調整 Gateway WebSocket 交握逾時">
    讓本機用戶端在高負載或低效能主機上有更多時間完成驗證前 WebSocket 交握：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 預設為 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 仍會優先用於一次性的服務或 shell 覆寫。
    - 優先修正啟動/事件迴圈停頓；此旋鈕適用於健康但在暖機期間較慢的主機。

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

    - `dmScope`: `main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：用於執行緒綁定工作階段路由的全域預設值（Discord 支援 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 請參閱[工作階段管理](/zh-TW/concepts/session)，了解範圍、身分連結與傳送政策。
    - 請參閱[完整參考](/zh-TW/gateway/config-agents#session)，了解所有欄位。

  </Accordion>

  <Accordion title="啟用沙箱">
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

    請先建置映像檔 — 如果是從原始碼 checkout 執行，請執行 `scripts/sandbox-setup.sh`；如果是從 npm 安裝，請參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的內嵌 `docker build` 命令。

    請參閱[沙箱](/zh-TW/gateway/sandboxing)取得完整指南，並參閱[完整參考](/zh-TW/gateway/config-agents#agentsdefaultssandbox)了解所有選項。

  </Accordion>

  <Accordion title="為官方 iOS 組建啟用 relay 後端推播">
    relay 後端推播在 `openclaw.json` 中設定。

    在 Gateway 設定中設定：

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

    對應的 CLI：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    這會做什麼：

    - 讓 Gateway 透過外部 relay 傳送 `push.test`、喚醒提示和重新連線喚醒。
    - 使用由配對的 iOS app 轉送、限定註冊範圍的傳送授權。Gateway 不需要整個部署共用的 relay token。
    - 將每個 relay 後端註冊綁定到 iOS app 配對的 Gateway 身分，因此另一個 Gateway 無法重複使用已儲存的註冊。
    - 讓本機/手動 iOS 組建繼續使用直接 APNs。relay 後端傳送只適用於透過 relay 註冊的官方發行組建。
    - 必須符合烘焙進官方/TestFlight iOS 組建的 relay 基礎 URL，讓註冊與傳送流量到達同一個 relay 部署。

    端對端流程：

    1. 安裝使用相同 relay 基礎 URL 編譯的官方/TestFlight iOS 組建。
    2. 在 Gateway 上設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS app 配對到 Gateway，並讓 node 與操作員工作階段都連線。
    4. iOS app 擷取 Gateway 身分，使用 App Attest 加上 app receipt 向 relay 註冊，然後將 relay 後端的 `push.apns.register` payload 發布到配對的 Gateway。
    5. Gateway 儲存 relay handle 與傳送授權，接著用它們處理 `push.test`、喚醒提示和重新連線喚醒。

    作業注意事項：

    - 如果你將 iOS app 切換到不同 Gateway，請重新連線 app，讓它可以發布綁定到該 Gateway 的新 relay 註冊。
    - 如果你出貨的新 iOS 組建指向不同的 relay 部署，app 會重新整理其快取的 relay 註冊，而不是重複使用舊的 relay 來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時的 env 覆寫使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限 loopback 的開發逃生口；不要在設定中持久保存 HTTP relay URL。

    請參閱 [iOS App](/zh-TW/platforms/ios#relay-backed-push-for-official-builds) 了解端對端流程，並參閱[驗證與信任流程](/zh-TW/platforms/ios#authentication-and-trust-flow)了解 relay 安全模型。

  </Accordion>

  <Accordion title="設定 Heartbeat（定期簽到）">
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

    - `every`：持續時間字串（`30m`、`2h`）。設為 `0m` 可停用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：DM 風格 Heartbeat 目標使用 `allow`（預設）或 `block`
    - 請參閱 [Heartbeat](/zh-TW/gateway/heartbeat) 取得完整指南。

  </Accordion>

  <Accordion title="設定 Cron 工作">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`：從 `sessions.json` 清理已完成的隔離執行工作階段（預設 `24h`；設為 `false` 可停用）。
    - `runLog`：依大小與保留行數清理 `cron/runs/<jobId>.jsonl`。
    - 請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)，了解功能概觀與 CLI 範例。

  </Accordion>

  <Accordion title="設定 Webhook（hook）">
    在 Gateway 上啟用 HTTP Webhook 端點：

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
    - 將所有 hook/Webhook payload 內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；不要重複使用共用 Gateway token。
    - hook 驗證僅限 header（`Authorization: Bearer ...` 或 `x-openclaw-token`）；query-string token 會被拒絕。
    - `hooks.path` 不能是 `/`；請將 Webhook 入口保留在專用子路徑，例如 `/hooks`。
    - 除非正在進行嚴格限定範圍的除錯，否則請保持不安全內容繞過旗標停用（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制呼叫者選擇的工作階段金鑰。
    - 對於 hook 驅動的代理，建議使用強大的現代模型層級與嚴格工具政策（例如僅限訊息傳送，並在可行時加上沙箱）。

    請參閱[完整參考](/zh-TW/gateway/configuration-reference#hooks)，了解所有對應選項與 Gmail 整合。

  </Accordion>

  <Accordion title="設定多代理路由">
    使用個別工作區與工作階段執行多個隔離代理：

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

    請參閱[多代理](/zh-TW/concepts/multi-agent)與[完整參考](/zh-TW/gateway/config-agents#multi-agent-routing)，了解綁定規則與每代理存取設定檔。

  </Accordion>

  <Accordion title="將設定拆分成多個檔案（$include）">
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
    - **檔案陣列**：依順序深度合併（後者勝出）
    - **同層鍵**：在 includes 之後合併（覆寫 included 值）
    - **巢狀 includes**：最多支援 10 層深度
    - **相對路徑**：相對於包含它的檔案解析
    - **OpenClaw 擁有的寫入**：當寫入只變更一個由單一檔案 include 支援的頂層區段，例如 `plugins: { $include: "./plugins.json5" }` 時，OpenClaw 會更新該 included 檔案，並保持 `openclaw.json` 不變
    - **不支援的穿透寫入**：對於 OpenClaw 擁有的寫入，根 includes、include 陣列，以及帶有同層覆寫的 includes 會封閉失敗，而不是攤平設定
    - **限制範圍**：`$include` 路徑必須解析到存放 `openclaw.json` 的目錄之下。若要跨機器或使用者共享樹狀目錄，請將 `OPENCLAW_INCLUDE_ROOTS` 設為額外目錄的路徑清單（POSIX 上使用 `:`，Windows 上使用 `;`），includes 可以參照這些目錄。符號連結會被解析並重新檢查，因此即使路徑在字面上位於設定目錄中，但其真實目標逃出所有允許的根目錄，仍會被拒絕。
    - **錯誤處理**：對遺失檔案、解析錯誤與循環 includes 提供清楚錯誤

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

Gateway 會監看 `~/.openclaw/openclaw.json` 並自動套用變更 — 大多數設定不需要手動重新啟動。

直接編輯檔案會被視為不受信任，直到驗證通過為止。監看器會等待編輯器暫存寫入/重新命名變動穩定下來，讀取最終檔案，並透過還原最後已知良好設定來拒絕無效的外部編輯。OpenClaw 擁有的設定寫入在寫入前會使用相同的 schema gate；破壞性覆寫，例如移除 `gateway.mode` 或將檔案縮小超過一半，會被拒絕並儲存為 `.rejected.*` 以供檢查。

Plugin 本機驗證失敗是例外：如果所有問題都在 `plugins.entries.<id>...` 之下，重新載入會保留目前設定並回報 Plugin 問題，而不是還原 `.last-good`。

如果你在日誌中看到 `Config auto-restored from last-known-good` 或 `config reload restored last-known-good config`，請檢查 `openclaw.json` 旁邊對應的 `.clobbered.*` 檔案，修正被拒絕的 payload，然後執行 `openclaw config validate`。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-restored-last-known-good-config)取得復原檢查清單。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設） | 立即熱套用安全變更。對關鍵變更自動重新啟動。           |
| **`hot`**              | 只熱套用安全變更。需要重新啟動時記錄警告 — 由你處理。 |
| **`restart`**          | 任何設定變更都重新啟動 Gateway，無論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下一次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些會熱套用，哪些需要重新啟動

大多數欄位都會在不停機的情況下熱套用。在 `hybrid` 模式中，需要重新啟動的變更會自動處理。

| 類別                | 欄位                                                              | 需要重新啟動？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 頻道                | `channels.*`, `web` (WhatsApp) — 所有內建與 Plugin 頻道           | 否              |
| 代理程式與模型      | `agent`, `agents`, `models`, `routing`                            | 否              |
| 自動化              | `hooks`, `cron`, `agent.heartbeat`                                | 否              |
| 工作階段與訊息      | `session`, `messages`                                             | 否              |
| 工具與媒體          | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | 否              |
| 介面與其他          | `ui`, `logging`, `identity`, `bindings`                           | 否              |
| Gateway 伺服器      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **是**          |
| 基礎架構            | `discovery`, `canvasHost`, `plugins`                              | **是**          |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 — 變更它們**不會**觸發重新啟動。
</Note>

### 重新載入規劃

當你編輯透過 `$include` 參照的來源檔案時，OpenClaw 會從來源撰寫的版面配置規劃重新載入，而不是從攤平後的記憶體內檢視規劃。
這讓熱重新載入決策（熱套用或重新啟動）即使在單一頂層區段位於自己的 included 檔案中時也能保持可預測，例如
`plugins: { $include: "./plugins.json5" }`。如果來源版面配置不明確，重新載入規劃會以失敗關閉方式處理。

## 設定 RPC（程式化更新）

對於透過 gateway API 寫入設定的工具，建議使用此流程：

- `config.schema.lookup` 用於檢查一個子樹（淺層 schema 節點 + 子項摘要）
- `config.get` 用於擷取目前快照與 `hash`
- `config.patch` 用於部分更新（JSON merge patch：物件合併、`null` 刪除、陣列取代）
- `config.apply` 僅在你打算取代整個設定時使用
- `update.run` 用於明確自我更新並重新啟動
- `update.status` 用於檢查最新的更新重新啟動 sentinel，並在重新啟動後驗證執行中的版本

代理程式應將 `config.schema.lookup` 視為精確欄位層級文件與限制的第一站。當需要更廣泛的設定對照、預設值或專用子系統參考連結時，請使用 [設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`、`config.patch`、`update.run`）會以每個 `deviceId+clientIp` 每 60 秒 3 個請求為上限進行速率限制。重新啟動請求會合併，然後在重新啟動週期之間強制執行 30 秒冷卻時間。
`update.status` 是唯讀的，但限定管理員範圍，因為重新啟動 sentinel 可能包含更新步驟摘要與命令輸出尾端。
</Note>

部分 patch 範例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、`note` 與 `restartDelayMs`。當設定已存在時，兩種方法都需要 `baseHash`。

## 環境變數

OpenClaw 會從父程序加上下列來源讀取環境變數：

- 目前工作目錄中的 `.env`（如果存在）
- `~/.openclaw/.env`（全域備援）

這兩個檔案都不會覆寫現有的環境變數。你也可以在設定中設定 inline 環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 環境匯入（選用）">
  如果啟用且預期的 key 尚未設定，OpenClaw 會執行你的登入 shell，並只匯入缺少的 key：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境變數等價形式：`OPENCLAW_LOAD_SHELL_ENV=1`
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

- 只比對大寫名稱：`[A-Z_][A-Z0-9_]*`
- 缺少或空白變數會在載入時擲出錯誤
- 使用 `$${VAR}` 逸出以輸出字面值
- 可在 `$include` 檔案內運作
- Inline 替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="密鑰參照（env、file、exec）">
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

SecretRef 詳細資料（包含 `env`/`file`/`exec` 的 `secrets.providers`）位於 [密鑰管理](/zh-TW/gateway/secrets)。
支援的認證路徑列在 [SecretRef 認證介面](/zh-TW/reference/secretref-credential-surface)。
</Accordion>

完整優先順序與來源請參閱 [環境](/zh-TW/help/environment)。

## 完整參考

如需完整的逐欄位參考，請參閱 **[設定參考](/zh-TW/gateway/configuration-reference)**。

---

_相關：[設定範例](/zh-TW/gateway/configuration-examples) · [設定參考](/zh-TW/gateway/configuration-reference) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [Gateway runbook](/zh-TW/gateway)
