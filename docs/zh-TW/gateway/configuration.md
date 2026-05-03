---
read_when:
    - 首次設定 OpenClaw
    - 尋找常見的設定模式
    - 導覽至特定設定區段
summary: 設定概觀：常見工作、快速設定，以及完整參考文件的連結
title: 設定
x-i18n:
    generated_at: "2026-05-03T21:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw 會從 `~/.openclaw/openclaw.json` 讀取選用的 <Tooltip tip="JSON5 支援註解和尾端逗號">**JSON5**</Tooltip> 設定。
作用中的設定路徑必須是一般檔案。OpenClaw 擁有的寫入不支援符號連結的 `openclaw.json`
配置；原子寫入可能會取代該路徑，而不是保留符號連結。如果你將設定保存在
預設狀態目錄之外，請將 `OPENCLAW_CONFIG_PATH` 直接指向真正的檔案。

如果檔案不存在，OpenClaw 會使用安全的預設值。新增設定的常見原因：

- 連接頻道並控制誰可以傳訊息給 bot
- 設定模型、工具、沙盒化或自動化（cron、hook）
- 調整工作階段、媒體、網路或 UI

請參閱[完整參考](/zh-TW/gateway/configuration-reference)以了解每個可用欄位。

代理和自動化在編輯設定前，應使用 `config.schema.lookup` 取得精確的欄位層級
文件。請使用本頁取得工作導向的指引，並使用
[設定參考](/zh-TW/gateway/configuration-reference)取得更完整的
欄位對照與預設值。

<Tip>
**剛開始設定？** 請先使用 `openclaw onboard` 進行互動式設定，或查看 [設定範例](/zh-TW/gateway/configuration-examples)指南，取得可完整複製貼上的設定。
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
  <Tab title="CLI（單行命令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="控制 UI">
    開啟 [http://127.0.0.1:18789](http://127.0.0.1:18789)，並使用 **設定** 分頁。
    控制 UI 會從即時設定綱要呈現表單，包含欄位
    `title` / `description` 文件中繼資料，以及可用時的 Plugin 和頻道綱要，
    並提供 **原始 JSON** 編輯器作為備用出口。對於深入檢視
    UI 和其他工具，Gateway 也會公開 `config.schema.lookup`，用來
    擷取一個以路徑為範圍的綱要節點，以及直接子項摘要。
  </Tab>
  <Tab title="直接編輯">
    直接編輯 `~/.openclaw/openclaw.json`。Gateway 會監看檔案並自動套用變更（請參閱[熱重新載入](#config-hot-reload)）。
  </Tab>
</Tabs>

## 嚴格驗證

<Warning>
OpenClaw 只接受完全符合綱要的設定。未知鍵、格式錯誤的型別或無效值會導致 Gateway **拒絕啟動**。唯一的根層級例外是 `$schema`（字串），讓編輯器可以附加 JSON Schema 中繼資料。
</Warning>

`openclaw config schema` 會列印控制 UI 和驗證使用的標準 JSON Schema。
`config.schema.lookup` 會擷取單一以路徑為範圍的節點，以及
深入檢視工具所需的子項摘要。欄位 `title`/`description` 文件中繼資料
會沿著巢狀物件、萬用字元（`*`）、陣列項目（`[]`），以及 `anyOf`/
`oneOf`/`allOf` 分支傳遞。當資訊清單登錄載入後，執行階段 Plugin 和頻道綱要會合併進來。

驗證失敗時：

- Gateway 不會啟動
- 只有診斷命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 執行 `openclaw doctor` 以查看精確問題
- 執行 `openclaw doctor --fix`（或 `--yes`）以套用修復

Gateway 會在每次成功啟動後保留一份受信任的最後已知良好副本，
但啟動和熱重新載入不會自動還原它。如果 `openclaw.json`
驗證失敗（包含 Plugin 本機驗證），Gateway 啟動會失敗，或
重新載入會被略過，且目前執行階段會保留最後接受的設定。
執行 `openclaw doctor --fix`（或 `--yes`）以修復加上前綴/遭覆寫的設定，或
還原最後已知良好副本。當候選設定包含已遮蔽的祕密佔位符（例如 `***`）時，
會略過升級為最後已知良好副本。

## 常見工作

<AccordionGroup>
  <Accordion title="設定頻道（WhatsApp、Telegram、Discord 等）">
    每個頻道在 `channels.<provider>` 下都有自己的設定區段。請參閱專屬頻道頁面以取得設定步驟：

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

    所有頻道共用相同的 DM 原則模式：

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
    設定主要模型和選用的後援模型：

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
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增允許清單項目，而不移除現有模型。除非傳入 `--replace`，否則會移除項目的純替換會被拒絕。
    - 模型參照使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制逐字稿/工具圖片降尺度（預設 `1200`）；較低的值通常會降低大量使用螢幕截圖時的視覺 token 使用量。
    - 請參閱[模型 CLI](/zh-TW/concepts/models)以了解如何在聊天中切換模型，並參閱[模型容錯移轉](/zh-TW/concepts/model-failover)以了解驗證輪替和後援行為。
    - 對於自訂/自行代管的提供者，請參閱參考中的[自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制誰可以傳訊息給 bot">
    DM 存取權會透過 `dmPolicy` 依頻道控制：

    - `"pairing"`（預設）：未知寄件者會取得一次性配對碼以供核准
    - `"allowlist"`：只允許 `allowFrom` 中的寄件者（或已配對允許儲存區中的寄件者）
    - `"open"`：允許所有傳入 DM（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有 DM

    對於群組，請使用 `groupPolicy` + `groupAllowFrom` 或頻道專屬允許清單。

    請參閱[完整參考](/zh-TW/gateway/config-channels#dm-and-group-access)以了解各頻道詳細資訊。

  </Accordion>

  <Accordion title="設定群組聊天提及閘控">
    群組訊息預設為**需要提及**。依代理設定觸發模式，並讓可見的房間回覆保留在預設訊息工具路徑上，除非你有意使用舊版自動最終回覆：

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
    - **可見回覆**：`messages.visibleReplies` 可以在全域要求訊息工具傳送；`messages.groupChat.visibleReplies` 會針對群組/頻道覆寫該設定。
    - 請參閱[完整參考](/zh-TW/gateway/config-channels#group-chat-mention-gating)，以了解可見回覆模式、各頻道覆寫和自我聊天模式。

  </Accordion>

  <Accordion title="限制每個代理的 Skills">
    使用 `agents.defaults.skills` 作為共用基準，然後以
    `agents.list[].skills` 覆寫特定代理：

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

  <Accordion title="調整 Gateway 頻道健康監控">
    控制 Gateway 重新啟動看似停滯頻道的積極程度：

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

    - 將 `gateway.channelHealthCheckMinutes: 0` 設為全域停用健康監控重新啟動。
    - `channelStaleEventThresholdMinutes` 應大於或等於檢查間隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled`，可針對單一頻道或帳號停用自動重新啟動，而不停用全域監控。
    - 請參閱[健康檢查](/zh-TW/gateway/health)以了解作業偵錯，並參閱[完整參考](/zh-TW/gateway/configuration-reference#gateway)以了解所有欄位。

  </Accordion>

  <Accordion title="調整 Gateway WebSocket 握手逾時">
    讓本機用戶端在負載較高或低功耗主機上，有更多時間完成驗證前的 WebSocket 握手：

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 預設為 `15000` 毫秒。
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 對一次性服務或 shell 覆寫仍然具有優先權。
    - 優先修正啟動/事件迴圈停頓；這個旋鈕適用於健康但暖機期間較慢的主機。

  </Accordion>

  <Accordion title="設定工作階段和重設">
    工作階段控制對話連續性和隔離：

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

    - `dmScope`：`main`（共用）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：執行緒繫結工作階段路由的全域預設值（Discord 支援 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 請參閱[工作階段管理](/zh-TW/concepts/session)以了解範圍設定、身分連結和傳送原則。
    - 請參閱[完整參考](/zh-TW/gateway/config-agents#session)以了解所有欄位。

  </Accordion>

  <Accordion title="啟用沙箱化">
    在隔離的沙箱執行環境中執行代理工作階段：

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

    請先建置映像檔 — 若是從原始碼 checkout，請執行 `scripts/sandbox-setup.sh`；若是從 npm 安裝，請參閱 [Sandboxing § Images and setup](/zh-TW/gateway/sandboxing#images-and-setup) 中的行內 `docker build` 指令。

    如需完整指南，請參閱 [Sandboxing](/zh-TW/gateway/sandboxing)；如需所有選項，請參閱[完整參考](/zh-TW/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="為官方 iOS 組建啟用中繼支援的推播">
    中繼支援的推播是在 `openclaw.json` 中設定。

    在 gateway 設定中加入：

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

    對應的 CLI 指令：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    這會執行下列事項：

    - 讓 Gateway 透過外部中繼傳送 `push.test`、喚醒提示，以及重新連線喚醒。
    - 使用由已配對 iOS app 轉送、限定註冊範圍的傳送授權。Gateway 不需要部署範圍的中繼權杖。
    - 將每個中繼支援的註冊繫結到 iOS app 所配對的 Gateway 身分，因此其他 Gateway 無法重複使用已儲存的註冊。
    - 讓本機/手動 iOS 組建維持使用直接 APNs。中繼支援的傳送只適用於透過中繼註冊的官方發佈組建。
    - 必須符合內建於官方/TestFlight iOS 組建中的中繼基底 URL，讓註冊與傳送流量抵達相同的中繼部署。

    端對端流程：

    1. 安裝使用相同中繼基底 URL 編譯的官方/TestFlight iOS 組建。
    2. 在 Gateway 上設定 `gateway.push.apns.relay.baseUrl`。
    3. 將 iOS app 與 Gateway 配對，並讓節點和操作員工作階段都連線。
    4. iOS app 取得 Gateway 身分，使用 App Attest 加上 app 收據向中繼註冊，然後將中繼支援的 `push.apns.register` 承載發佈到已配對的 Gateway。
    5. Gateway 儲存中繼控制代碼與傳送授權，接著用於 `push.test`、喚醒提示，以及重新連線喚醒。

    營運注意事項：

    - 如果將 iOS app 切換到不同的 Gateway，請重新連線 app，讓它能發佈繫結到該 Gateway 的新中繼註冊。
    - 如果發佈的新 iOS 組建指向不同的中繼部署，app 會重新整理其快取的中繼註冊，而不是重複使用舊的中繼來源。

    相容性注意事項：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作為暫時的環境變數覆寫使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍是僅限 loopback 的開發逃生口；請勿在設定中持久保存 HTTP 中繼 URL。

    如需端對端流程，請參閱 [iOS App](/zh-TW/platforms/ios#relay-backed-push-for-official-builds)；如需中繼安全模型，請參閱[驗證與信任流程](/zh-TW/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="設定 Heartbeat（定期報到）">
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
    - `directPolicy`：DM 風格 Heartbeat 目標的 `allow`（預設）或 `block`
    - 如需完整指南，請參閱 [Heartbeat](/zh-TW/gateway/heartbeat)。

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

    - `sessionRetention`：從 `sessions.json` 修剪已完成的隔離執行工作階段（預設 `24h`；設為 `false` 可停用）。
    - `runLog`：依大小與保留行數修剪 `cron/runs/<jobId>.jsonl`。
    - 如需功能概覽與 CLI 範例，請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。

  </Accordion>

  <Accordion title="設定 Webhook（Hook）">
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

    安全注意事項：
    - 將所有 hook/webhook 承載內容視為不受信任的輸入。
    - 使用專用的 `hooks.token`；不要重複使用共用的 Gateway 權杖。
    - Hook 驗證僅限標頭（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查詢字串權杖會被拒絕。
    - `hooks.path` 不能是 `/`；請將 Webhook 入口維持在專用子路徑，例如 `/hooks`。
    - 除非進行嚴格限定範圍的偵錯，否則請停用不安全內容繞過旗標（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制呼叫端選擇的工作階段金鑰。
    - 對於由 hook 驅動的代理，建議使用強大的現代模型層級與嚴格工具政策（例如僅限訊息傳遞，並在可行情況下加上沙箱化）。

    如需所有對應選項與 Gmail 整合，請參閱[完整參考](/zh-TW/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="設定多代理路由">
    以獨立工作區與工作階段執行多個隔離代理：

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

    如需繫結規則與每個代理的存取設定檔，請參閱 [Multi-Agent](/zh-TW/concepts/multi-agent) 和[完整參考](/zh-TW/gateway/config-agents#multi-agent-routing)。

  </Accordion>

  <Accordion title="將設定分割為多個檔案（$include）">
    使用 `$include` 來組織大型設定：

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
    - **檔案陣列**：依序深度合併（後者優先）
    - **同層鍵**：在 include 之後合併（覆寫被 include 的值）
    - **巢狀 include**：支援最多 10 層深度
    - **相對路徑**：相對於執行 include 的檔案解析
    - **OpenClaw 擁有的寫入**：當寫入只變更一個由單一檔案 include 支援的頂層區段，例如 `plugins: { $include: "./plugins.json5" }`，OpenClaw 會更新該被 include 的檔案，並讓 `openclaw.json` 保持不變
    - **不支援的寫入穿透**：根 include、include 陣列，以及含有同層覆寫的 include，會對 OpenClaw 擁有的寫入封閉失敗，而不是攤平設定
    - **限制範圍**：`$include` 路徑必須解析到保存 `openclaw.json` 的目錄之下。若要跨機器或使用者共用樹狀目錄，請將 `OPENCLAW_INCLUDE_ROOTS` 設為額外目錄的路徑清單（POSIX 上使用 `:`，Windows 上使用 `;`），供 include 參照。符號連結會被解析並重新檢查，因此即使某個路徑在字面上位於設定目錄中，但其實際目標逃逸所有允許的根目錄，仍會遭到拒絕。
    - **錯誤處理**：針對缺少檔案、剖析錯誤和循環 include 提供清楚錯誤

  </Accordion>
</AccordionGroup>

## 設定熱重新載入

Gateway 會監看 `~/.openclaw/openclaw.json` 並自動套用變更 — 多數設定不需要手動重新啟動。

直接編輯檔案會先被視為不受信任，直到通過驗證。監看器會等待編輯器暫存寫入/重新命名抖動穩定下來，讀取最終檔案，並拒絕無效的外部編輯，而不會重寫 `openclaw.json`。OpenClaw 擁有的設定寫入在寫入前也使用相同的 schema 關卡；破壞性覆寫，例如刪除 `gateway.mode` 或將檔案縮小超過一半，會被拒絕並儲存為 `.rejected.*` 以供檢查。

如果看到 `config reload skipped (invalid config)` 或啟動時回報 `Invalid config`，請檢查設定、執行 `openclaw config validate`，然後執行 `openclaw doctor --fix` 修復。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config) 取得檢查清單。

### 重新載入模式

| 模式                   | 行為                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（預設） | 立即熱套用安全變更。對關鍵變更自動重新啟動。           |
| **`hot`**              | 僅熱套用安全變更。需要重新啟動時記錄警告 — 由你處理。 |
| **`restart`**          | 對任何設定變更重新啟動 Gateway，無論是否安全。                                 |
| **`off`**              | 停用檔案監看。變更會在下次手動重新啟動時生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可熱套用，哪些需要重新啟動

大多數欄位可在不中斷服務的情況下熱套用。在 `hybrid` 模式中，需要重新啟動的變更會自動處理。

| 類別            | 欄位                                                            | 需要重新啟動？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| 頻道            | `channels.*`、`web`（WhatsApp）— 所有內建與 Plugin 頻道 | 否              |
| 代理與模型      | `agent`、`agents`、`models`、`routing`                            | 否              |
| 自動化          | `hooks`、`cron`、`agent.heartbeat`                                | 否              |
| 工作階段與訊息 | `session`、`messages`                                             | 否              |
| 工具與媒體       | `tools`、`browser`、`skills`、`mcp`、`audio`、`talk`              | 否              |
| UI 與其他           | `ui`、`logging`、`identity`、`bindings`                           | 否              |
| Gateway 伺服器      | `gateway.*`（連接埠、繫結、驗證、tailscale、TLS、HTTP）              | **是**         |
| 基礎設施      | `discovery`、`canvasHost`、`plugins`                              | **是**         |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 — 變更它們**不會**觸發重新啟動。
</Note>

### 重新載入規劃

當你編輯透過 `$include` 參照的來源檔案時，OpenClaw 會從來源撰寫的版面配置規劃重新載入，而不是從扁平化的記憶體內視圖規劃。這讓熱重新載入決策（熱套用或重新啟動）保持可預測，即使單一頂層區段位於自己的包含檔案中，例如 `plugins: { $include: "./plugins.json5" }`。如果來源版面配置不明確，重新載入規劃會以關閉方式失敗。

## 設定 RPC（程式化更新）

對於透過 Gateway API 寫入設定的工具，建議使用此流程：

- `config.schema.lookup` 用來檢查一個子樹（淺層 schema 節點 + 子項摘要）
- `config.get` 用來擷取目前快照以及 `hash`
- `config.patch` 用於部分更新（JSON merge patch：物件合併、`null` 刪除、陣列取代）
- 只有在你打算取代整個設定時才使用 `config.apply`
- `update.run` 用於明確的自我更新加重新啟動；當重新啟動後的工作階段應執行一個後續回合時，請包含 `continuationMessage`
- `update.status` 用來檢查最新的更新重新啟動 sentinel，並在重新啟動後驗證執行中的版本

代理應將 `config.schema.lookup` 視為取得精確欄位層級文件與限制的第一站。當需要更廣泛的設定對照、預設值，或專屬子系統參考連結時，請使用[設定參考](/zh-TW/gateway/configuration-reference)。

<Note>
控制平面寫入（`config.apply`、`config.patch`、`update.run`）會依每個 `deviceId+clientIp` 限制為每 60 秒 3 個請求。重新啟動請求會合併，接著在重新啟動週期之間強制執行 30 秒冷卻時間。`update.status` 是唯讀的，但屬於管理員範圍，因為重新啟動 sentinel 可能包含更新步驟摘要與命令輸出尾端。
</Note>

部分 patch 範例：

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、`note` 和 `restartDelayMs`。當設定已存在時，兩種方法都需要 `baseHash`。

## 環境變數

OpenClaw 會從父程序以及以下來源讀取環境變數：

- 目前工作目錄中的 `.env`（若存在）
- `~/.openclaw/.env`（全域備援）

兩個檔案都不會覆寫現有環境變數。你也可以在設定中設定內嵌環境變數：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  如果已啟用且預期的 key 尚未設定，OpenClaw 會執行你的登入 shell，並只匯入缺少的 key：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

環境變數等效值：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  在任何設定字串值中使用 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

規則：

- 僅比對大寫名稱：`[A-Z_][A-Z0-9_]*`
- 缺少或空白變數會在載入時擲出錯誤
- 使用 `$${VAR}` 逸出以輸出字面值
- 可在 `$include` 檔案內運作
- 內嵌替換：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

SecretRef 詳細資訊（包含 `env`/`file`/`exec` 的 `secrets.providers`）位於[祕密管理](/zh-TW/gateway/secrets)。支援的憑證路徑列於 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Accordion>

完整優先順序與來源請參閱[環境](/zh-TW/help/environment)。

## 完整參考

如需完整逐欄位參考，請參閱**[設定參考](/zh-TW/gateway/configuration-reference)**。

---

_相關：[設定範例](/zh-TW/gateway/configuration-examples) · [設定參考](/zh-TW/gateway/configuration-reference) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [Gateway runbook](/zh-TW/gateway)
