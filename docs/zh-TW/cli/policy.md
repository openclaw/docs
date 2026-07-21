---
read_when:
    - 你想要依據編寫的 policy.jsonc 檢查 OpenClaw 設定
    - 你希望在 doctor lint 中顯示政策問題發現
    - 你需要政策證明雜湊值作為稽核證據
summary: '`openclaw policy` 一致性檢查的命令列介面參考資料'
title: 政策
x-i18n:
    generated_at: "2026-07-21T08:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abb9ad87dceaa2004817db6a8c270e66ce1c3848a1680d2119ad95faa5453cc0
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由隨附的 Policy 外掛提供。它是在現有 OpenClaw 設定之上的企業
合規層，而非第二套設定系統。你在 `policy.jsonc` 中編寫要求；OpenClaw 將作用中的
工作區作為證據觀察；Policy 透過 `doctor --lint` 回報偏離狀態。Policy
不會強制執行工具呼叫，也不會在請求時改寫執行階段行為，且不會證明各代理程式的認證資訊儲存區，例如 `auth-profiles.json`。

Policy 會檢查已設定的頻道、MCP 伺服器、模型供應商、網路 SSRF
防護態勢、進站／頻道存取、閘道暴露與節點命令態勢、
已編寫的訊息路由探測、
代理程式工作區存取、沙箱態勢、資料處理態勢、祕密
供應商／驗證設定檔態勢，以及受治理的工具中繼資料（`TOOLS.md`）。當
工作區需要持久且可檢查的聲明，例如「不得啟用 Telegram」或「受治理的工具必須
宣告風險與擁有者中繼資料」時，請使用它。如果你只需要本機行為，而不需要證明或偏離偵測，使用一般
設定即可。

## 快速開始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，此外掛仍會保持啟用，因此 doctor 可以
回報缺少的成品，而不是默默略過檢查。

請手動編寫 `policy.jsonc`；它不會從目前設定產生。每個
頂層區段都是規則命名空間：只有當其下存在具體規則時，檢查才會執行（不支援的區段或鍵會以
`policy/policy-jsonc-invalid` 失敗，而不會被默默忽略）。以下是涵蓋所有支援區段的最小
範例：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "此工作區未核准使用 Telegram。",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "routing": {
    "requireBindings": true,
    "requireConfiguredChannels": true,
    "probes": [
      {
        "id": "family-dm",
        "route": {
          "channel": "imessage",
          "peer": { "kind": "direct", "id": "+15555550123" },
        },
        "expect": {
          "agentId": "family",
          "matchedBy": ["binding.peer"],
        },
      },
    ],
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

以下是從下方規則表格不易看出的跨領域注意事項：

- 在拒絕非迴路介面繫結時省略 `gateway.bind`，表示你接受
  執行階段預設值；若要嚴格合規，請設定 `gateway.bind: "loopback"`。
- 若要設定唯讀代理程式，請在適用的預設值／代理程式上，將沙箱 `mode` 設為 `all` 或 `non-main`，並將
  `workspaceAccess` 設為 `none` 或 `ro`。缺少沙箱模式或沙箱模式為
  `off`，都不符合唯讀政策。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、
  `apply_patch`。設定中的工具拒絕群組 `group:fs`（檔案變更）與
  `group:runtime`（殼層／程序）符合等同的態勢。
- 只有當存在 `execApprovals` 規則時，執行核准檢查才會讀取即時的
  `exec-approvals.json` 成品；缺少或無效的成品屬於
  無法觀察的證據，而非虛構的通過結果。
- 祕密與驗證設定檔證據只會記錄供應商／來源態勢和
  SecretRef 中繼資料，絕不記錄原始值。Policy 不會讀取或證明
  各代理程式的認證資訊儲存區，例如 `auth-profiles.json`。
- 資料處理證據僅代表設定層級的態勢（遮蔽模式、
  遙測擷取切換、工作階段維護模式、對話記錄索引
  設定）。它不會檢查日誌、遙測匯出資料、對話記錄或
  記憶檔案，而乾淨的結果也無法證明其中不存在個人資料或
  祕密。
- 路由探測會重複使用 OpenClaw 的執行階段繫結解析器。路由證據
  僅記錄探測 ID、解析出的代理程式、比對種類及已遮蔽的繫結
  中繼資料。它絕不記錄對等端、帳號、伺服器、團隊或角色識別碼。
  新增路由區段會刻意變更政策與證明
  雜湊；沒有路由的政策會維持其現有證據形態。

### Policy 規則參考

以下每項規則皆為選用；只有存在規則時，檢查才會執行。
觀察到的狀態是現有的 OpenClaw 設定或工作區中繼資料。

#### 範圍限定覆寫

當特定代理程式或頻道需要比頂層基準更嚴格的政策時，請使用 `scopes.<scopeName>`。
範圍名稱只是一個標籤；比對會使用範圍內的選取器。覆寫是累加的：全域規則仍會執行，
而範圍限定規則可以針對相同證據新增自己的問題。

| 選取器     | 支援的區段                                                             | 使用時機                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`、`agents.workspace`、`sandbox`、`dataHandling.memory`、`execApprovals` | 一或多個執行階段代理程式需要更嚴格的規則。   |
| `channelIds` | `ingress.channels`                                                             | 一或多個頻道需要更嚴格的進站規則。 |

如果 `agents.list[]` 中沒有 `agentIds` 項目，OpenClaw 會
依據該執行階段代理程式 ID 所繼承的全域／預設態勢評估
範圍限定規則，而不是略過它。

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

同一個代理程式可出現在多個範圍中，前提是每個範圍治理不同的
欄位，如上所示。針對同一代理程式重複的範圍限定欄位，必須同等或
更加嚴格；較寬鬆的重複宣告會遭拒絕（允許清單必須是
子集、拒絕清單必須是超集、必要的布林值則固定不變）。

容器態勢規則（`sandbox.containers.*`）只會針對
相符代理程式的沙箱後端能公開的證據進行檢查。如果後端無法
觀察你為其啟用的規則，Policy 會回報
`policy/sandbox-container-posture-unobservable`，而不會判定通過；請將容器規則的範圍
限定於使用能公開這些證據之後端的代理程式群組。

頂層 `ingress.session.requireDmScope` 維持全域性；`session.dmScope`
不是可歸因於頻道的證據，因此無法由 `channelIds` 限定範圍。

`policy.jsonc` 中的每個範圍都必須有效且可強制執行。

#### 頻道

| 政策欄位                         | 觀察到的狀態                          | 使用時機                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 供應商與啟用狀態 | 拒絕來自 `telegram` 等供應商的已設定頻道。 |
| `channels.denyRules[].reason`        | 問題訊息與修復提示的內容 | 說明拒絕該供應商的原因。                          |

#### MCP 伺服器

| 政策欄位        | 觀察到的狀態      | 使用時機                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 要求每個已設定的 MCP 伺服器都必須在允許清單中。 |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 拒絕特定的已設定 MCP 伺服器 ID。                   |

#### 模型供應商

| 政策欄位             | 觀察到的狀態                                   | 使用時機                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 與選取的模型參照 | 要求已設定的供應商與選取的模型參照使用核准的供應商。 |
| `models.providers.deny`  | `models.providers.*` ID 與選取的模型參照 | 依供應商 ID 拒絕已設定的供應商與選取的模型參照。               |

#### 網路

| 原則欄位                   | 觀察到的狀態                      | 使用時機                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有網路 SSRF 規避機制 | 設為 `false`，以要求停用私有網路存取。 |

#### 訊息路由

| 原則欄位                        | 觀察到的狀態                                      | 使用時機                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `routing.requireBindings`           | 頻道路由繫結，不含 ACP 繫結      | 要求至少有一個訊息路由繫結。                          |
| `routing.requireConfiguredChannels` | 繫結頻道 ID 與已設定的 `channels.*` ID | 偵測過時或拼寫錯誤的繫結頻道 ID。                        |
| `routing.probes[].route`            | 公開的 OpenClaw 路由解析器                  | 在不傳送訊息的情況下描述具代表性的傳入路由。     |
| `routing.probes[].expect.agentId`   | 已解析的代理程式 ID                                   | 要求路由連至已審查的代理程式。                         |
| `routing.probes[].expect.matchedBy` | 解析器比對種類                                 | 要求對等端、帳號、頻道或其他已審查繫結的明確程度。 |

探測 ID 必須唯一。路由支援 `channel`、選用的 `accountId`、
`peer`、`parentPeer`、`guildId`、`teamId` 與 `memberRoleIds`。對等端種類為
`direct`、`group` 與 `channel`。`matchedBy` 可包含一或多個執行階段
比對種類，包括 `binding.peer`、`binding.account`、`binding.channel`
或 `default`。

路由檢查僅為符合性檢查。它們不會變更啟動、
訊息傳遞、繫結優先順序或後援行為。發現項目需要
由操作者審查，因為自動變更繫結可能會重新導向
私人訊息。

#### 傳入與頻道存取

| 原則欄位                              | 觀察到的狀態                                                 | 使用時機                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求已審查的直接訊息隔離範圍。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 與舊版頻道直接訊息原則欄位      | 僅允許已審查的直接訊息頻道原則。               |
| `ingress.channels.denyOpenGroups`         | 頻道、帳號與群組傳入原則                     | 拒絕已設定頻道與帳號的開放群組傳入。      |
| `ingress.channels.requireMentionInGroups` | 頻道、帳號、群組、伺服器與巢狀提及閘門設定 | 當群組傳入為開放或受提及閘門控管時，要求使用提及閘門。 |

#### 閘道

| 原則欄位                            | 觀察到的狀態                                 | 使用時機                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 設為 `false`，以要求閘道繫結至迴路介面。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 閘道安全態勢         | 設為 `false`，以拒絕 Tailscale Funnel 暴露。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 設為 `true`，以拒絕停用閘道驗證。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 設為 `true`，以要求明確的驗證速率限制設定。                            |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全的驗證／裝置／來源切換選項 | 設為 `false`，以拒絕不安全的 Control UI 暴露切換選項。                         |
| `gateway.remote.allow`                  | 遠端閘道模式／設定                     | 設為 `false`，以拒絕遠端閘道模式。                                          |
| `gateway.http.denyEndpoints`            | 閘道 HTTP API 端點                     | 拒絕 `chatCompletions` 或 `responses` 等端點 ID。                          |
| `gateway.http.requireUrlAllowlists`     | 閘道 HTTP URL 擷取輸入                  | 設為 `true`，以要求 URL 擷取輸入使用 URL 允許清單。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求 OpenClaw 設定明確拒絕 `system.run` 等節點命令 ID。 |

`gateway.nodes.denyCommands` 是完全比對、區分大小寫的拒絕超集合規則。
當原則必須證明 OpenClaw 設定已明確拒絕具特殊權限的節點命令時，
請使用此規則。若部署有意允許具特殊權限的節點命令，
應在審查後更新 `policy.jsonc`，而非僅依賴
`gateway.nodes.allowCommands`。

#### 代理程式工作區

| 原則欄位                     | 觀察到的狀態                                                                        | 使用時機                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 與 `agents.list[].sandbox.workspaceAccess` | 僅允許 `none` 或 `ro` 等沙箱工作區存取值。                       |
| `agents.workspace.denyTools`     | 全域與各代理程式的工具拒絕設定                                                 | 要求拒絕異動工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。 |

#### 沙箱安全態勢

| 原則欄位                                          | 觀察到的狀態                                          | 使用時機                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 與各代理程式模式       | 僅允許 `all` 或 `non-main` 等已審查的沙箱模式。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 與各代理程式後端 | 僅允許 `docker` 等已審查的沙箱後端。         |
| `sandbox.containers.denyHostNetwork`                  | 容器式沙箱／瀏覽器網路模式           | 拒絕主機網路模式。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器式沙箱／瀏覽器網路模式           | 拒絕加入另一個容器的網路命名空間。              |
| `sandbox.containers.requireReadOnlyMounts`            | 容器式沙箱／瀏覽器掛載模式             | 要求掛載為唯讀。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器式沙箱／瀏覽器掛載目標          | 拒絕掛載容器執行階段通訊端。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全性設定檔安全態勢                      | 拒絕不受限制的容器安全性設定檔。                   |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱瀏覽器 CDP 來源範圍                        | 要求瀏覽器 CDP 暴露宣告來源範圍。        |

原則會將缺少的 `sandbox.mode` 視為其隱含預設值 `off`，因此
`sandbox.requireMode` 會將全新或尚未設定的沙箱回報為不在
`["all"]` 等允許清單內。

#### 資料處理

| 原則欄位                                        | 觀察到的狀態                                                                       | 使用時機                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 設為 `true`，以拒絕 `logging.redactSensitive: "off"`。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 設為 `true`，以拒絕遙測內容擷取。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 設為 `true`，以要求有效工作階段維護模式為 `enforce`。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 與 `agents.*.memorySearch.experimental.sessionMemory` | 設為 `true`，以拒絕將工作階段逐字稿編入記憶索引。       |

#### 密鑰

| 原則欄位                      | 觀察到的狀態                                           | 使用時機                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRef 與 `secrets.providers.*` 宣告 | 設為 `true`，以要求 SecretRef 指向已宣告的提供者。     |
| `secrets.denySources`             | 密鑰提供者來源與 SecretRef 來源            | 拒絕 `exec`、`file` 或其他已設定來源名稱等來源。 |
| `secrets.allowInsecureProviders`  | 不安全的密鑰提供者安全態勢旗標                   | 設為 `false`，以拒絕選擇不安全安全態勢的提供者。      |

#### Exec 核准

Exec 核准檢查會讀取執行階段 `exec-approvals.json` 成品：
預設為 `~/.openclaw/exec-approvals.json`，或在設定 `OPENCLAW_STATE_DIR` 時為
`$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*` 下的安全態勢規則
要求可讀取的成品證據；缺少或無效的成品會回報為
無法觀察的證據，而非盡力而為地判定通過。成品可讀取後，省略的
欄位會繼承執行階段預設值：缺少 `defaults.security` 時為 `full`，而
缺少代理程式安全性設定時，會繼承該預設值。證據包含 `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、選用的 `argPattern`、有效的
`autoAllowSkills` 安全態勢與項目來源，但絕不包含通訊端路徑／權杖、
`commandText`、`lastUsedCommand`、已解析路徑或時間戳記。

| 原則欄位                                | 觀察到的狀態                                                                         | 使用時機                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 使用中的執行階段 `exec-approvals.json` 路徑                                              | 設為 `true`，以要求核准成品必須存在且可解析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，預設為 `full`                                              | 僅允許已核准的預設核准安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，繼承預設值                                               | 僅允許已核准的各代理程式有效核准安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 與 `agents.*.autoAllowSkills`，繼承執行階段預設值 | 設為 `false`，以要求嚴格的手動允許清單，不隱含核准 Skill 命令列介面。 |
| `execApprovals.agents.allowlist.expected`   | 彙總 `agents.*.allowlist[]` 模式及選用的 argPattern 項目               | 要求核准允許清單符合已審查的模式集合。                      |

範例：要求核准成品、拒絕寬鬆的預設值，並且僅允許
所選代理程式使用經審查的 exec 核准安全配置。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // 安全模式："deny"、"allowlist" 或 "full"。
      // 此預設值僅允許鎖定的拒絕安全配置。
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // 所選代理程式可使用經審查的允許清單安全配置，但不可使用 "full"。
          "allowSecurity": ["allowlist"],
          // false 表示 Skill 命令列介面必須出現在經審查的允許清單中，而非
          // 由 autoAllowSkills 隱含核准。
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // 簡單項目：完全相符的已審查可執行檔模式，沒有 argPattern。
              "travel-hub",
              // 受限項目：模式加上經審查的引數正規表示式。
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### 驗證設定檔

| 原則欄位                    | 觀察到的狀態                               | 使用時機                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供者與模式中繼資料 | 要求設定驗證設定檔包含 `provider` 與 `mode` 等中繼資料鍵。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 僅允許支援的驗證設定檔模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具中繼資料

| 原則欄位            | 觀察到的狀態                   | 使用時機                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受控管的 `TOOLS.md` 宣告 | 要求受控管工具宣告 `risk`、`sensitivity` 或 `owner` 等中繼資料鍵。 |

#### 工具安全配置

| 原則欄位                    | 觀察到的狀態                                              | 使用時機                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 與 `agents.list[].tools.profile`           | 僅允許 `minimal`、`messaging` 或 `coding` 等工具設定檔 ID。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 與各代理程式的 `tools.fs` 覆寫 | 設為 `true`，以要求檔案系統工具維持僅限工作區的安全配置。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 與各代理程式的 exec 安全性           | 僅允許 `deny` 或 `allowlist` 等 exec 安全模式。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 與各代理程式的 exec 詢問模式                | 要求 `always` 等核准安全配置。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 與各代理程式的 exec 主機路由           | 僅允許 `sandbox` 等 exec 主機路由模式。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 與各代理程式的提升權限安全配置     | 設為 `false`，以要求提升權限工具模式維持停用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 與各代理程式的 `tools.alsoAllow`           | 要求完全符合 `alsoAllow` 項目，並回報遺漏或非預期的額外工具授權。                 |
| `tools.denyTools`               | `tools.deny` 與 `agents.list[].tools.deny`                 | 要求已設定的工具拒絕清單包含 `group:runtime` 與 `group:fs` 等工具 ID 或群組。 |

## 執行檢查

編寫期間執行僅限原則的檢查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 僅執行原則檢查集合，並輸出證據、發現事項
與證明雜湊。啟用原則外掛時，相同的發現事項也會出現在
`openclaw doctor --lint` 中。

將操作員原則檔案與編寫的基準進行比較：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 會以原則檔案語法檢查原則檔案語法；它
不會檢查執行階段狀態、證據、認證資訊或密鑰。它使用管理範圍覆疊的相同
規則中繼資料：允許清單必須維持相同或更窄、拒絕清單必須維持相同或更廣、必要布林值必須維持
其值、有序字串只能往已設定順序中更嚴格的一端移動，
而完全符合清單必須相符。基準可以是
組織編寫的原則；受檢查的原則可以加入更嚴格的值或
額外規則。當頂層受檢查規則具有相同或更嚴格的限制時，
可以滿足具有範圍的基準規則。檔案之間的範圍名稱不必相符；
比較是依選取器（`agentIds`/`channelIds`）與欄位為索引鍵。
對於路由探查，每個基準探查 ID 都必須保留相同的路由
與預期代理程式。受檢查的原則可以加入探查或縮小 `matchedBy`，但
移除探查、變更其路由或代理程式，或擴大其接受的比對
種類，都屬於較弱的原則。

無差異比較（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

無問題的 `policy check --json` 輸出包含操作員或
監督者可記錄的穩定雜湊：

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## 設定原則

原則設定位於 `plugins.entries.policy.config` 之下。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| 設定                   | 用途                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也啟用原則檢查。         |
| `workspaceRepairs`        | 允許 `doctor --fix` 編輯由原則管理的工作區設定。 |
| `expectedHash`            | 已核准原則成品的選用雜湊鎖定。            |
| `expectedAttestationHash` | 上次接受的無問題原則檢查之選用雜湊鎖定。    |
| `path`                    | 原則成品相對於工作區的位置。             |

將 `plugins.entries.policy.config.enabled` 設為 `false`，即可停用工作區的原則
檢查，同時保留已安裝的外掛。

## 接受原則狀態

JSON 輸出範例：

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` 識別編寫的規則成品。`evidence`
記錄檢查所使用的已觀察 OpenClaw 狀態，而
`workspace.hash` 識別該證據酬載。`findingsHash` 識別
確切的發現項目集合。`checkedAt` 記錄檢查執行的時間。
`attestationHash` 識別穩定宣告（政策雜湊、證據雜湊、
發現項目雜湊，以及乾淨／有變更狀態），並刻意排除 `checkedAt`，
因此相同的政策狀態一律會產生相同的證明雜湊。這四個值共同
構成一次政策檢查的稽核四元組。

如果閘道或監督程序使用政策來封鎖、核准執行階段動作或為其加註，
應記錄最近一次乾淨檢查的證明雜湊。
`checkedAt` 會保留在 JSON 輸出中供稽核記錄使用，但不屬於
穩定雜湊的一部分。

接受政策狀態的生命週期：

1. 編寫或審查 `policy.jsonc`。
2. 執行 `openclaw policy check --json`。
3. 若結果乾淨，將 `attestation.policy.hash` 記錄為 `expectedHash`。
4. 將 `attestation.attestationHash` 記錄為 `expectedAttestationHash`。
5. 在 CI 或發布閘門中重新執行 `openclaw doctor --lint`。

如果政策規則是有意變更，請根據一次乾淨檢查更新兩個已接受的雜湊。
如果只有工作區設定變更（政策維持不變），
通常只有 `expectedAttestationHash` 會變更。

啟用或升級 `agents.workspace` 規則會將 `agentWorkspace` 證據
加入工作區雜湊與證明雜湊；啟用後請審查新證據，
並重新整理已接受的證明雜湊。啟用或升級
工具安全態勢規則也會以相同方式加入 `toolPosture` 證據。

`openclaw policy watch` 會重新執行檢查，並在目前證據不再
符合 `expectedAttestationHash` 時回報：

```bash
openclaw policy watch --json
```

在需要單次漂移評估的 CI 或指令碼中使用 `--once`。若未使用
`--once`，預設每兩秒輪詢一次；使用 `--interval-ms` 可變更
間隔。

## 發現項目

| 檢查 ID                                                 | 發現                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 原則已啟用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 無法剖析原則，或原則包含格式錯誤的規則項目。                       |
| `policy/policy-hash-mismatch`                            | 原則與設定的 `expectedHash` 不符。                                  |
| `policy/attestation-hash-mismatch`                       | 目前的原則證據不再符合已接受的證明。               |
| `policy/policy-conformance-invalid`                      | 基準或受檢查的原則檔案包含無效的比較語法。                  |
| `policy/policy-conformance-missing`                      | 受檢查的原則檔案缺少基準原則檔案要求的規則。     |
| `policy/policy-conformance-weaker`                       | 受檢查的原則檔案包含比基準原則檔案更寬鬆的值。           |
| `policy/channels-denied-provider`                        | 已啟用的頻道符合頻道拒絕規則。                                   |
| `policy/mcp-denied-server`                               | 原則拒絕了已設定的 MCP 伺服器。                                      |
| `policy/mcp-unapproved-server`                           | 已設定的 MCP 伺服器不在允許清單內。                                 |
| `policy/models-denied-provider`                          | 已設定的模型提供者或模型參照使用遭拒絕的提供者。                  |
| `policy/models-unapproved-provider`                      | 已設定的模型提供者或模型參照不在允許清單內。                |
| `policy/network-private-access-enabled`                  | 原則拒絕私人網路 SSRF 逃生機制，但此機制仍處於啟用狀態。             |
| `policy/routing-bindings-required`                       | 原則要求頻道路由繫結，但尚未設定任何繫結。                  |
| `policy/routing-binding-channel-unconfigured`            | 路由繫結指定了 `channels.*` 中不存在的頻道。                         |
| `policy/routing-agent-mismatch`                          | 撰寫的路由解析至不同的代理程式。                                  |
| `policy/routing-match-kind-mismatch`                     | 撰寫的路由以非預期的繫結明確程度相符。                   |
| `policy/ingress-dm-policy-unapproved`                    | 頻道私訊原則不在原則允許清單內。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 與原則要求的私訊隔離範圍不符。          |
| `policy/ingress-open-groups-denied`                      | 原則拒絕開放群組輸入，但頻道群組原則為 `open`。          |
| `policy/ingress-group-mention-required`                  | 頻道或群組項目停用了提及閘門，但原則要求啟用。       |
| `policy/gateway-non-loopback-bind`                       | 原則拒絕非回送介面曝露，但閘道繫結態勢允許此曝露。         |
| `policy/gateway-auth-disabled`                           | 原則要求驗證，但閘道驗證已停用。                     |
| `policy/gateway-rate-limit-missing`                      | 原則要求明確設定閘道驗證速率限制態勢，但目前未明確設定。          |
| `policy/gateway-control-ui-insecure`                     | 閘道控制介面的不安全曝露切換選項已啟用。                         |
| `policy/gateway-tailscale-funnel`                        | 原則拒絕閘道 Tailscale Funnel 曝露，但此曝露仍處於啟用狀態。               |
| `policy/gateway-remote-enabled`                          | 原則拒絕閘道遠端模式，但此模式仍處於作用中。                              |
| `policy/gateway-http-endpoint-enabled`                   | 原則拒絕閘道 HTTP API 端點，但此端點仍處於啟用狀態。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | 閘道 HTTP URL 擷取輸入缺少必要的 URL 允許清單。                      |
| `policy/gateway-node-command-denied`                     | 原則拒絕的節點命令未遭 OpenClaw 設定拒絕。                 |
| `policy/agents-workspace-access-denied`                  | 代理程式沙箱模式或工作區存取不在原則允許清單內。           |
| `policy/agents-tool-not-denied`                          | 代理程式或預設設定未拒絕原則要求拒絕的工具。               |
| `policy/tools-profile-unapproved`                        | 已設定的全域或個別代理程式工具設定檔不在允許清單內。           |
| `policy/tools-fs-workspace-only-required`                | 檔案系統工具未設定為僅限工作區的路徑態勢。             |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在原則允許清單內。                               |
| `policy/tools-exec-ask-unapproved`                       | Exec 詢問模式不在原則允許清單內。                                    |
| `policy/tools-exec-host-unapproved`                      | Exec 主機路由不在原則允許清單內。                                |
| `policy/tools-elevated-enabled`                          | 原則拒絕提高權限的工具模式，但此模式仍處於啟用狀態。                              |
| `policy/tools-also-allow-missing`                        | 已設定的 `alsoAllow` 清單缺少原則要求的項目。             |
| `policy/tools-also-allow-unexpected`                     | 已設定的 `alsoAllow` 清單包含原則未預期的項目。           |
| `policy/tools-required-deny-missing`                     | 全域或個別代理程式工具拒絕清單未包含必要的遭拒工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在原則允許清單內。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙箱後端不在原則允許清單內。                                  |
| `policy/sandbox-container-posture-unobservable`          | 容器態勢規則已針對無法觀察該規則的後端啟用。         |
| `policy/sandbox-container-host-network-denied`           | 容器支援的沙箱或瀏覽器使用主機網路模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 容器支援的沙箱或瀏覽器加入另一個容器命名空間。          |
| `policy/sandbox-container-mount-mode-required`           | 容器支援的沙箱或瀏覽器掛載並非唯讀。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支援的沙箱或瀏覽器掛載曝露了容器執行階段通訊端。 |
| `policy/sandbox-container-unconfined-profile`            | 原則拒絕不受限制的容器沙箱設定檔，但此設定檔仍不受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 原則要求沙箱瀏覽器 CDP 來源範圍，但尚未設定。             |
| `policy/data-handling-redaction-disabled`                | 原則要求敏感記錄遮蔽，但此功能已停用。                  |
| `policy/data-handling-telemetry-content-capture`         | 原則拒絕遙測內容擷取，但此功能仍處於啟用狀態。                       |
| `policy/data-handling-session-retention-not-enforced`    | 原則要求執行工作階段保留維護，但目前未強制執行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 原則拒絕工作階段逐字記錄記憶索引，但此功能仍處於啟用狀態。              |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef 參照了未在 `secrets.providers` 下宣告的提供者。  |
| `policy/secrets-denied-provider-source`                  | 設定祕密提供者或 SecretRef 使用原則拒絕的來源。             |
| `policy/secrets-insecure-provider`                       | 原則拒絕不安全態勢，但祕密提供者選擇採用此態勢。               |
| `policy/auth-profile-invalid-metadata`                   | 設定驗證設定檔缺少有效的提供者或模式中繼資料。                 |
| `policy/auth-profile-unapproved-mode`                    | 設定驗證設定檔模式不在原則允許清單內。                       |
| `policy/exec-approvals-missing`                          | 原則要求 `exec-approvals.json`，但缺少該成品。               |
| `policy/exec-approvals-invalid`                          | 無法剖析已設定的 Exec 核准成品。                          |
| `policy/exec-approvals-default-security-unapproved`      | Exec 核准預設值使用不在原則允許清單內的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 個別代理程式的有效 Exec 核准安全模式不在允許清單內。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 原則拒絕自動允許 Skill 命令列介面，但 Exec 核准代理程式隱含地自動允許它們。   |
| `policy/exec-approvals-allowlist-missing`                | 核准允許清單缺少原則要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 核准允許清單包含原則未預期的模式。                |
| `policy/tools-missing-risk-level`                        | 受管控的工具宣告缺少風險中繼資料。                             |
| `policy/tools-unknown-risk-level`                        | 受管控的工具宣告使用未知的風險值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受管控的工具宣告缺少敏感度中繼資料。                      |
| `policy/tools-missing-owner`                             | 受管控的工具宣告缺少擁有者中繼資料。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受管控的工具宣告使用未知的敏感度值。                    |

一項發現可以同時包含 `target`（觀察到的不符合規範的工作區項目）
與 `requirement`（導致其成為發現的撰寫規則）。
目前兩者都是 `oc://` 位址字串，但欄位名稱描述的是原則角色，
而非位址格式。

發現範例：

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "頻道 'telegram' 使用遭拒絕的提供者 'telegram'。",
  "source": "policy",
  "path": "openclaw 設定",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "此工作區未核准 Telegram。"
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md 工具 'deploy' 沒有明確的風險分類。",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP 伺服器 'remote' 不在原則允許清單內。",
  "source": "policy",
  "path": "openclaw 設定",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "模型參照 'anthropic/claude-sonnet-4.7' 使用未核准的提供者 'anthropic'。",
  "source": "policy",
  "path": "openclaw 設定",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "網路設定 'browser-private-network' 允許存取私人網路。",
  "source": "policy",
  "path": "openclaw 設定",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "閘道繫結設定 'gateway-bind' 允許非迴路介面曝露。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "閘道節點命令 'system.run' 已遭原則拒絕，但未遭 OpenClaw 設定拒絕。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "將 'system.run' 加入 gateway.nodes.denyCommands，或在審查後更新原則。"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "原則不允許 agents.defaults 沙箱 workspaceAccess 使用 'rw'。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修復

`doctor --lint` 和 `policy check` 為唯讀。

只有在明確啟用 `workspaceRepairs` 時，`doctor --fix` 才會編輯由原則管理的工作區設定；否則，檢查只會回報其原本會修復的內容，並維持設定不變。

在此版本中，修復功能可以停用遭 `channels.denyRules` 拒絕的頻道，並套用下列自動縮限修復。只有在原則檔案經過審查後，才能啟用 `workspaceRepairs`，因為有效的規則可能會變更工作區設定：

- 當全域原則禁止提升權限工具時，設定 `tools.elevated.enabled=false`
- 當原則要求拒絕特定工具時，將缺少的必要拒絕工具 ID 加入 `tools.deny` 或
  `agents.list[].tools.deny`
- 將不安全的 `gateway.controlUi.*` 切換設定設為 `false`
- 當原則拒絕遠端閘道模式時，設定 `gateway.mode=local`
- 當原則拒絕閘道 HTTP API 端點時，將回報的 `gateway.http.endpoints.*.enabled` 路徑設為 `false`
- 當原則拒絕開放群組輸入時，將回報的頻道輸入 `groupPolicy` 路徑設為 `allowlist`
- 當原則要求群組提及時，將回報的頻道輸入 `requireMention` 路徑設為 `true`
- 當原則要求遮蔽敏感記錄內容時，設定 `logging.redactSensitive=tools`
- 當原則拒絕擷取遙測內容時，設定 `diagnostics.otel.captureContent=false`；若為物件形式的遙測
  擷取設定，則設定 `diagnostics.otel.captureContent.enabled=false`

限定範圍的提升權限工具修復僅會偵測。當發現項目回報共用的記錄或遙測設定時，也會略過限定範圍的資料處理修復，因為變更共用設定會影響限定範圍原則目標以外的項目。

當發現項目回報繼承的根層級 `tools.deny` 時，會略過限定範圍的必要拒絕修復，因為將必要工具加入根設定會影響限定範圍原則目標以外的項目。代理程式本機的必要拒絕修復可以更新回報的 `agents.list[].tools.deny` 路徑。

當發現項目回報繼承的 `channels.defaults.*` 時，會略過限定範圍的頻道輸入修復，因為變更共用頻道預設值會影響限定範圍原則目標以外的項目。閘道 HTTP URL 擷取允許清單的發現項目仍須手動處理，因為自動修復無法選擇正確的端點 URL 允許清單值。

閘道繫結和節點命令的發現項目仍須經過審查。當
`policy/gateway-non-loopback-bind` 或 `policy/gateway-node-command-denied`
可對應至設定路徑時，`doctor --fix` 會將建議的
`gateway.bind` 或 `gateway.nodes.denyCommands` 變更回報為已略過的預覽
指引。它不會套用變更，而且在操作員審查並更新設定或原則之前，該發現項目不會計為已修復。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## 結束代碼

| 命令          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | 沒有達到門檻的發現項目。                          | 一或多個發現項目達到門檻。                             | 引數或執行階段失敗。 |
| `policy compare` | 原則檔案的嚴格程度至少與基準相同。 | 原則檔案無效、缺少，或比基準規則寬鬆。 | 引數或執行階段失敗。 |
| `policy watch`   | 沒有發現項目，且已接受的雜湊為最新。              | 存在發現項目，或已接受的證明已過期。                    | 引數或執行階段失敗。 |

## 相關內容

- [Doctor lint 模式](/zh-TW/cli/doctor#lint-mode)
- [路徑命令列介面](/zh-TW/cli/path)
