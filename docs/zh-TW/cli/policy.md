---
read_when:
    - 你想要依據自行編寫的 policy.jsonc 檢查 OpenClaw 設定
    - 你希望在 doctor lint 中顯示政策問題發現
    - 你需要政策證明雜湊值作為稽核證據
summary: '`openclaw policy` 一致性檢查的命令列介面參考資料'
title: 政策
x-i18n:
    generated_at: "2026-07-12T14:24:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由內建的 Policy 外掛提供。它是在現有 OpenClaw 設定之上的企業級合規層，而不是第二套設定系統。你在 `policy.jsonc` 中撰寫要求；OpenClaw 將使用中的工作區觀察為證據；Policy 透過 `doctor --lint` 回報偏離情況。Policy 不會在請求時強制管控工具呼叫或改寫執行階段行為，也不會證明各代理程式的認證資訊儲存區（例如 `auth-profiles.json`）符合要求。

Policy 會檢查已設定的頻道、MCP 伺服器、模型供應商、網路 SSRF 防護狀態、輸入／頻道存取、閘道暴露程度與節點命令防護狀態、代理程式工作區存取、沙箱防護狀態、資料處理防護狀態、祕密供應商／驗證設定檔防護狀態，以及受管控的工具中繼資料（`TOOLS.md`）。當工作區需要可持續且可檢查的聲明時使用它，例如「不得啟用 Telegram」或「受管控的工具必須宣告風險與擁有者中繼資料」。如果你只需要本機行為，不需要合規證明或偏離偵測，使用一般設定即可。

## 快速開始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，此外掛仍會保持啟用，因此 doctor 可以回報缺少該成品，而不是無聲略過檢查。

請手動撰寫 `policy.jsonc`；它不會根據目前設定產生。每個頂層區段都是一個規則命名空間：只有其中存在具體規則時，才會執行檢查（不支援的區段或鍵會以 `policy/policy-jsonc-invalid` 失敗，而不是被無聲忽略）。以下是涵蓋所有支援區段的最小範例：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "此工作區不允許使用 Telegram。",
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

以下是無法從下方規則表格直接看出的跨領域注意事項：

- 在拒絕非回送位址繫結時省略 `gateway.bind`，表示你接受執行階段預設值；若要嚴格符合要求，請設定 `gateway.bind: "loopback"`。
- 對於唯讀代理程式，請在適用的預設值／代理程式上將沙箱 `mode` 設為 `all` 或 `non-main`，並將 `workspaceAccess` 設為 `none` 或 `ro`。缺少沙箱模式或將其設為 `off`，都不符合唯讀政策。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、`apply_patch`。設定中的工具拒絕群組 `group:fs`（檔案修改）和 `group:runtime`（殼層／程序）可滿足等效的防護要求。
- 只有在存在 `execApprovals` 規則時，執行核准檢查才會讀取使用中的 `exec-approvals.json` 成品；缺少或無效的成品屬於無法觀察的證據，不會被視為虛構的通過結果。
- 祕密與驗證設定檔證據只會記錄供應商／來源防護狀態和 SecretRef 中繼資料，絕不記錄原始值。Policy 不會讀取或證明各代理程式的認證資訊儲存區（例如 `auth-profiles.json`）符合要求。
- 資料處理證據僅代表設定層級的防護狀態（遮蔽模式、遙測擷取切換、工作階段維護模式、逐字稿索引設定）。它不會檢查記錄、遙測匯出、逐字稿或記憶檔案；即使結果正常，也無法證明其中不存在個人資料或祕密。

### Policy 規則參考

以下每條規則皆為選用；只有規則存在時才會執行檢查。觀察到的狀態來自現有的 OpenClaw 設定或工作區中繼資料。

#### 限定範圍的覆寫

當特定代理程式或頻道需要比頂層基準更嚴格的政策時，請使用 `scopes.<scopeName>`。範圍名稱只是一個標籤；比對會使用範圍內的選擇器。覆寫是附加性的：全域規則仍會執行，而限定範圍的規則可針對相同證據新增自己的發現。

| 選擇器       | 支援的區段                                                                     | 使用時機                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`、`agents.workspace`、`sandbox`、`dataHandling.memory`、`execApprovals` | 一或多個執行階段代理程式需要更嚴格的規則。        |
| `channelIds` | `ingress.channels`                                                             | 一或多個頻道需要更嚴格的輸入規則。                |

如果某個 `agentIds` 項目不存在於 `agents.list[]` 中，OpenClaw 會針對該執行階段代理程式 ID 所繼承的全域／預設防護狀態評估限定範圍的規則，而不是略過它。

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

如上所示，只要每個範圍管控不同欄位，同一個代理程式就可以出現在多個範圍中。針對同一代理程式重複出現的限定範圍欄位，必須具有相同或更嚴格的限制；較寬鬆的重複聲明會遭到拒絕（允許清單必須是子集、拒絕清單必須是超集、必要布林值固定不變）。

容器防護規則（`sandbox.containers.*`）只會依據相符代理程式的沙箱後端可公開的證據進行檢查。如果某個後端無法觀察你為其啟用的規則，Policy 會回報 `policy/sandbox-container-posture-unobservable`，而不是判定為通過；請將容器規則限定至使用能公開這些證據之後端的代理程式群組。

頂層 `ingress.session.requireDmScope` 維持全域適用；`session.dmScope` 不是可歸屬於頻道的證據，因此無法透過 `channelIds` 限定範圍。

`policy.jsonc` 中存在的每個範圍都必須有效且可執行。

#### 頻道

| Policy 欄位                          | 觀察到的狀態                            | 使用時機                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 供應商與啟用狀態           | 拒絕來自 `telegram` 等供應商的已設定頻道。                   |
| `channels.denyRules[].reason`        | 發現訊息與修復提示的情境                | 說明拒絕該供應商的原因。                                     |

#### MCP 伺服器

| Policy 欄位         | 觀察到的狀態        | 使用時機                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID  | 要求每個已設定的 MCP 伺服器都必須位於允許清單中。          |
| `mcp.servers.deny`  | `mcp.servers.*` ID  | 拒絕特定的已設定 MCP 伺服器 ID。                           |

#### 模型供應商

| Policy 欄位              | 觀察到的狀態                                    | 使用時機                                                                          |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 與選取的模型參照         | 要求已設定的供應商和選取的模型參照使用已核准的供應商。                            |
| `models.providers.deny`  | `models.providers.*` ID 與選取的模型參照         | 依供應商 ID 拒絕已設定的供應商和選取的模型參照。                                 |

#### 網路

| Policy 欄位                    | 觀察到的狀態                      | 使用時機                                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有網路 SSRF 規避機制            | 設為 `false`，以要求私有網路存取維持停用。                         |

#### 輸入與頻道存取

| 原則欄位                                  | 觀察到的狀態                                                 | 使用時機                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求經審查的私訊隔離範圍。                                         |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和舊版頻道私訊原則欄位                   | 僅允許經審查的私訊頻道原則。                                       |
| `ingress.channels.denyOpenGroups`         | 頻道、帳號和群組輸入原則                                       | 拒絕已設定頻道和帳號的開放群組輸入。                               |
| `ingress.channels.requireMentionInGroups` | 頻道、帳號、群組、伺服器和巢狀提及閘門設定                     | 當群組輸入為開放或設有提及閘門時，要求使用提及閘門。               |

#### 閘道

| 原則欄位                                | 觀察到的狀態                                   | 使用時機                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 設為 `false`，以要求閘道繫結至迴路位址。                                             |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 閘道態勢                | 設為 `false`，以拒絕 Tailscale Funnel 暴露。                                         |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 設為 `true`，以拒絕停用閘道驗證。                                                    |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 設為 `true`，以要求明確的驗證速率限制設定。                                          |
| `gateway.controlUi.allowInsecure`       | 控制介面的不安全驗證／裝置／來源切換選項       | 設為 `false`，以拒絕不安全的控制介面暴露切換選項。                                   |
| `gateway.remote.allow`                  | 遠端閘道模式／設定                             | 設為 `false`，以拒絕遠端閘道模式。                                                   |
| `gateway.http.denyEndpoints`            | 閘道 HTTP API 端點                             | 拒絕 `chatCompletions` 或 `responses` 等端點 ID。                                    |
| `gateway.http.requireUrlAllowlists`     | 閘道 HTTP URL 擷取輸入                         | 設為 `true`，以要求 URL 擷取輸入使用 URL 允許清單。                                  |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 設定中拒絕 `system.run` 等確切的節點命令 ID。                        |

`gateway.nodes.denyCommands` 是區分大小寫且須精確比對的拒絕超集合規則。
當原則必須證明 OpenClaw 設定已明確拒絕特權節點命令時，請使用此規則。
若部署刻意允許某個特權節點命令，應在審查後更新 `policy.jsonc`，而非僅依賴
`gateway.nodes.allowCommands`。

#### 代理程式工作區

| 原則欄位                         | 觀察到的狀態                                                                        | 使用時機                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 僅允許 `none` 或 `ro` 等沙箱工作區存取值。                                               |
| `agents.workspace.denyTools`     | 全域和各代理程式的工具拒絕設定                                                       | 要求拒絕變更工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。                  |

#### 沙箱態勢

| 原則欄位                                              | 觀察到的狀態                                            | 使用時機                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和各代理程式模式         | 僅允許 `all` 或 `non-main` 等經審查的沙箱模式。                |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和各代理程式後端      | 僅允許 `docker` 等經審查的沙箱後端。                           |
| `sandbox.containers.denyHostNetwork`                  | 容器式沙箱／瀏覽器網路模式                              | 拒絕主機網路模式。                                             |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器式沙箱／瀏覽器網路模式                              | 拒絕加入另一個容器的網路命名空間。                             |
| `sandbox.containers.requireReadOnlyMounts`            | 容器式沙箱／瀏覽器掛載模式                              | 要求掛載為唯讀。                                               |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器式沙箱／瀏覽器掛載目標                              | 拒絕掛載容器執行階段通訊端。                                   |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全性設定檔態勢                                    | 拒絕不受限制的容器安全性設定檔。                               |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱瀏覽器 CDP 來源範圍                                 | 要求瀏覽器 CDP 暴露宣告來源範圍。                              |

原則將缺少的 `sandbox.mode` 視為其隱含預設值 `off`，因此
`sandbox.requireMode` 會將全新或未設定的沙箱回報為不在
`["all"]` 等允許清單內。

#### 資料處理

| 原則欄位                                            | 觀察到的狀態                                                                       | 使用時機                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 設為 `true`，以拒絕 `logging.redactSensitive: "off"`。                 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 設為 `true`，以拒絕遙測內容擷取。                                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 設為 `true`，以要求有效的工作階段維護模式為 `enforce`。                |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 設為 `true`，以拒絕將工作階段逐字稿索引至記憶體。                     |

#### 密鑰

| 原則欄位                          | 觀察到的狀態                                           | 使用時機                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRefs 和 `secrets.providers.*` 宣告           | 設為 `true`，以要求 SecretRefs 指向已宣告的提供者。                     |
| `secrets.denySources`             | 密鑰提供者來源和 SecretRef 來源                          | 拒絕 `exec`、`file` 或其他已設定來源名稱等來源。                         |
| `secrets.allowInsecureProviders`  | 不安全密鑰提供者態勢旗標                                 | 設為 `false`，以拒絕選擇採用不安全態勢的提供者。                        |

#### Exec 核准

Exec 核准檢查會讀取執行階段的 `exec-approvals.json` 成品：
預設為 `~/.openclaw/exec-approvals.json`，若已設定 `OPENCLAW_STATE_DIR`，
則為 `$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*` 下的態勢規則
要求有可讀取的成品證據；成品缺失或無效時，會回報為無法觀察的證據，
而非盡力而為地判定通過。成品可讀取後，省略的欄位會繼承執行階段預設值：
缺少 `defaults.security` 時為 `full`，缺少代理程式安全性設定時則繼承該預設值。
證據包含 `defaults`、`agents.*`、`agents.*.allowlist[].pattern`、選用的
`argPattern`、有效的 `autoAllowSkills` 態勢和項目來源，但絕不包含通訊端路徑／權杖、
`commandText`、`lastUsedCommand`、已解析路徑或時間戳記。

| 原則欄位                                    | 觀察到的狀態                                                                         | 使用時機                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 使用中的執行階段 `exec-approvals.json` 路徑                                           | 設為 `true`，以要求核准成品存在且可剖析。                                               |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，預設為 `full`                                                    | 僅允許已核准的預設核准安全模式。                                                        |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，繼承預設值                                                       | 僅允許已核准的各代理程式有效核准安全模式。                                              |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，繼承執行階段預設值          | 設為 `false`，以要求使用嚴格的手動允許清單，不隱含核准 Skills 命令列介面。              |
| `execApprovals.agents.allowlist.expected`   | 彙總的 `agents.*.allowlist[]` 模式和選用的 argPattern 項目                            | 要求核准允許清單符合經審查的模式集合。                                                  |

範例：要求核准成品、拒絕寬鬆的預設值，並僅允許所選代理程式使用
經審查的 Exec 核准態勢。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // 安全模式："deny"、"allowlist" 或 "full"。
      // 此預設值僅允許嚴格鎖定的拒絕姿態。
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // 選定的代理程式可使用經審查的允許清單姿態，但不可使用 "full"。
          "allowSecurity": ["allowlist"],
          // false 表示 Skills 命令列介面必須出現在經審查的允許清單中，而不是
          // 由 autoAllowSkills 隱含核准。
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // 簡單項目：完全符合經審查的可執行檔模式，不含 argPattern。
              "travel-hub",
              // 受限項目：模式加上經審查的引數規則運算式。
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

| 政策欄位                        | 觀察到的狀態                                 | 適用情境                                                                                       |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供者與模式中繼資料       | 要求設定中的驗證設定檔包含 `provider` 和 `mode` 等中繼資料鍵。                                 |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 僅允許支援的驗證設定檔模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。                     |

#### 工具中繼資料

| 政策欄位                | 觀察到的狀態                   | 適用情境                                                                                       |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 宣告         | 要求受治理的工具宣告 `risk`、`sensitivity` 或 `owner` 等中繼資料鍵。                           |

#### 工具姿態

| 政策欄位                        | 觀察到的狀態                                                | 適用情境                                                                                                   |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`            | 僅允許 `minimal`、`messaging` 或 `coding` 等工具設定檔 ID。                                                |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和每個代理程式的 `tools.fs` 覆寫   | 設為 `true`，要求檔案系統工具採用僅限工作區的姿態。                                                        |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和每個代理程式的執行安全性            | 僅允許 `deny` 或 `allowlist` 等執行安全模式。                                                              |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和每個代理程式的執行詢問模式               | 要求採用 `always` 等核准姿態。                                                                             |
| `tools.exec.allowHosts`         | `tools.exec.host` 和每個代理程式的執行主機路由              | 僅允許 `sandbox` 等執行主機路由模式。                                                                      |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和每個代理程式的提升權限姿態       | 設為 `false`，要求提升權限工具模式維持停用。                                                               |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和每個代理程式的 `tools.alsoAllow`        | 要求完全符合 `alsoAllow` 項目，並回報遺漏或非預期的額外工具授權。                                          |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                  | 要求已設定的工具拒絕清單包含 `group:runtime` 和 `group:fs` 等工具 ID 或群組。                              |

## 執行檢查

編寫期間執行僅限政策的檢查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 僅執行政策檢查集合，並輸出證據、發現項目與證明雜湊。
啟用 Policy 外掛時，相同的發現項目也會出現在
`openclaw doctor --lint` 中。

將操作人員的政策檔案與編寫的基準進行比較：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 會以政策檔案語法比對政策檔案語法；它不會
檢查執行階段狀態、證據、認證資訊或密鑰。它使用與範圍覆蓋層相同的
規則中繼資料：允許清單必須維持相等或更窄，
拒絕清單必須維持相等或更廣，必要布林值必須維持
其值，排序字串只能往已設定順序中更嚴格的一端
移動，而精確清單必須完全相符。基準可以是
組織編寫的政策；受檢查的政策可以新增更嚴格的值或
額外規則。當頂層受檢查規則具有同等或更嚴格的限制時，
可以滿足範圍基準規則。檔案之間的範圍名稱不需要相符；
比較是依選取器（`agentIds`/`channelIds`）和欄位建立索引。

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

無問題的 `policy check --json` 輸出包含操作人員或
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

## 設定政策

政策設定位於 `plugins.entries.policy.config`。

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

| 設定                      | 用途                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也啟用政策檢查。                     |
| `workspaceRepairs`        | 允許 `doctor --fix` 編輯由政策管理的工作區設定。                    |
| `expectedHash`            | 已核准政策成品的選用雜湊鎖定值。                                   |
| `expectedAttestationHash` | 上次接受且無問題的政策檢查之選用雜湊鎖定值。                       |
| `path`                    | 政策成品相對於工作區的位置。                                       |

將 `plugins.entries.policy.config.enabled` 設為 `false`，可在保留外掛安裝的
同時停用工作區的政策檢查。

## 接受政策狀態

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
記錄檢查使用的已觀察 OpenClaw 狀態，而
`workspace.hash` 識別該證據承載資料。`findingsHash` 識別
確切的發現項目集合。`checkedAt` 記錄檢查的執行時間。
`attestationHash` 識別穩定宣告（政策雜湊、證據雜湊、
發現項目雜湊以及無問題／有問題狀態），並刻意排除 `checkedAt`，
因此相同的政策狀態一律產生相同的證明雜湊。這四個值
共同構成一次政策檢查的稽核四元組。

如果閘道或監督者使用政策來封鎖、核准或註解
執行階段動作，應記錄上次無問題檢查的證明雜湊。
`checkedAt` 會保留在 JSON 輸出中供稽核日誌使用，但不屬於
穩定雜湊的一部分。

接受政策狀態的生命週期：

1. 編寫或審查 `policy.jsonc`。
2. 執行 `openclaw policy check --json`。
3. 若無問題，將 `attestation.policy.hash` 記錄為 `expectedHash`。
4. 將 `attestation.attestationHash` 記錄為 `expectedAttestationHash`。
5. 在 CI 或發布閘門中重新執行 `openclaw doctor --lint`。

如果政策規則是刻意變更，請從一次乾淨的檢查結果更新兩個已接受的雜湊值。如果只有工作區設定變更（政策維持不變），通常只有 `expectedAttestationHash` 會變更。

啟用或升級 `agents.workspace` 規則，會將 `agentWorkspace` 證據加入工作區雜湊與證明雜湊；啟用後，請檢閱新證據並重新整理已接受的證明雜湊。啟用或升級工具安全態勢規則，也會以相同方式加入 `toolPosture` 證據。

當目前證據不再符合 `expectedAttestationHash` 時，`openclaw policy watch` 會重新執行檢查並回報：

```bash
openclaw policy watch --json
```

在需要單次漂移評估的 CI 或指令碼中使用 `--once`。若未使用 `--once`，預設每兩秒輪詢一次；使用 `--interval-ms` 可變更間隔。

## 發現項目

| 檢查 ID                                                 | 發現項目                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 政策已啟用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 無法剖析政策，或其中包含格式錯誤的規則項目。                       |
| `policy/policy-hash-mismatch`                            | 政策與已設定的 `expectedHash` 不符。                                  |
| `policy/attestation-hash-mismatch`                       | 目前的政策證據不再符合已接受的證明。               |
| `policy/policy-conformance-invalid`                      | 基準政策檔案或受檢查的政策檔案含有無效的比較語法。                  |
| `policy/policy-conformance-missing`                      | 受檢查的政策檔案缺少基準政策檔案要求的規則。     |
| `policy/policy-conformance-weaker`                       | 受檢查的政策檔案含有比基準政策檔案更寬鬆的值。           |
| `policy/channels-denied-provider`                        | 已啟用的頻道符合頻道拒絕規則。                                   |
| `policy/mcp-denied-server`                               | 政策拒絕了已設定的 MCP 伺服器。                                      |
| `policy/mcp-unapproved-server`                           | 已設定的 MCP 伺服器不在允許清單中。                                 |
| `policy/models-denied-provider`                          | 已設定的模型供應商或模型參照使用了遭拒絕的供應商。                  |
| `policy/models-unapproved-provider`                      | 已設定的模型供應商或模型參照不在允許清單中。                |
| `policy/network-private-access-enabled`                  | 政策拒絕私人網路 SSRF 逃逸機制時，該機制卻已啟用。             |
| `policy/ingress-dm-policy-unapproved`                    | 頻道的私訊政策不在政策允許清單中。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 與政策要求的私訊隔離範圍不符。          |
| `policy/ingress-open-groups-denied`                      | 政策拒絕開放群組輸入時，頻道群組政策卻為 `open`。          |
| `policy/ingress-group-mention-required`                  | 政策要求提及閘門時，頻道或群組項目卻停用了它。       |
| `policy/gateway-non-loopback-bind`                       | 政策拒絕非迴路位址暴露時，閘道繫結安全態勢卻允許該暴露。         |
| `policy/gateway-auth-disabled`                           | 政策要求驗證時，閘道驗證卻已停用。                     |
| `policy/gateway-rate-limit-missing`                      | 政策要求明確設定時，閘道驗證速率限制的安全態勢卻未明確設定。          |
| `policy/gateway-control-ui-insecure`                     | 閘道控制 UI 的不安全暴露切換選項已啟用。                         |
| `policy/gateway-tailscale-funnel`                        | 政策拒絕時，閘道 Tailscale Funnel 暴露卻已啟用。               |
| `policy/gateway-remote-enabled`                          | 政策拒絕時，閘道遠端模式卻處於啟用狀態。                              |
| `policy/gateway-http-endpoint-enabled`                   | 政策拒絕閘道 HTTP API 端點時，該端點卻已啟用。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | 閘道 HTTP URL 擷取輸入缺少必要的 URL 允許清單。                      |
| `policy/gateway-node-command-denied`                     | OpenClaw 設定並未拒絕政策所拒絕的節點命令。                 |
| `policy/agents-workspace-access-denied`                  | 代理程式沙箱模式或工作區存取不在政策允許清單中。           |
| `policy/agents-tool-not-denied`                          | 代理程式或預設設定未拒絕政策要求拒絕的工具。               |
| `policy/tools-profile-unapproved`                        | 已設定的全域或個別代理程式工具設定檔不在允許清單中。           |
| `policy/tools-fs-workspace-only-required`                | 檔案系統工具未設定為僅限工作區路徑的安全態勢。             |
| `policy/tools-exec-security-unapproved`                  | 執行安全模式不在政策允許清單中。                               |
| `policy/tools-exec-ask-unapproved`                       | 執行詢問模式不在政策允許清單中。                                    |
| `policy/tools-exec-host-unapproved`                      | 執行主機路由不在政策允許清單中。                                |
| `policy/tools-elevated-enabled`                          | 政策拒絕時，提升權限的工具模式卻已啟用。                              |
| `policy/tools-also-allow-missing`                        | 已設定的 `alsoAllow` 清單缺少政策要求的項目。             |
| `policy/tools-also-allow-unexpected`                     | 已設定的 `alsoAllow` 清單包含政策未預期的項目。           |
| `policy/tools-required-deny-missing`                     | 全域或個別代理程式工具拒絕清單未包含必要的拒絕工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在政策允許清單中。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙箱後端不在政策允許清單中。                                  |
| `policy/sandbox-container-posture-unobservable`          | 為無法觀察容器安全態勢的後端啟用了相關規則。         |
| `policy/sandbox-container-host-network-denied`           | 以容器為後端的沙箱或瀏覽器使用主機網路模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 以容器為後端的沙箱或瀏覽器加入另一個容器的命名空間。          |
| `policy/sandbox-container-mount-mode-required`           | 以容器為後端的沙箱或瀏覽器掛載不是唯讀。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 以容器為後端的沙箱或瀏覽器掛載暴露了容器執行階段通訊端。 |
| `policy/sandbox-container-unconfined-profile`            | 政策拒絕時，容器沙箱設定檔卻未受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 政策要求沙箱瀏覽器 CDP 來源範圍時，卻未設定該範圍。             |
| `policy/data-handling-redaction-disabled`                | 政策要求敏感記錄遮蔽時，該功能卻已停用。                  |
| `policy/data-handling-telemetry-content-capture`         | 政策拒絕時，遙測內容擷取卻已啟用。                       |
| `policy/data-handling-session-retention-not-enforced`    | 政策要求工作階段保留維護時，卻未強制執行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 政策拒絕時，工作階段逐字稿記憶索引卻已啟用。              |
| `policy/secrets-unmanaged-provider`                      | 設定中的 SecretRef 參照了未在 `secrets.providers` 下宣告的供應商。  |
| `policy/secrets-denied-provider-source`                  | 設定中的秘密供應商或 SecretRef 使用了政策拒絕的來源。             |
| `policy/secrets-insecure-provider`                       | 政策拒絕時，秘密供應商卻選擇採用不安全的安全態勢。               |
| `policy/auth-profile-invalid-metadata`                   | 設定中的驗證設定檔缺少有效的供應商或模式中繼資料。                 |
| `policy/auth-profile-unapproved-mode`                    | 設定中的驗證設定檔模式不在政策允許清單中。                       |
| `policy/exec-approvals-missing`                          | 政策要求 `exec-approvals.json`，但缺少該成品。               |
| `policy/exec-approvals-invalid`                          | 無法剖析已設定的執行核准成品。                          |
| `policy/exec-approvals-default-security-unapproved`      | 執行核准預設值使用了政策允許清單以外的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 個別代理程式的實際執行核准安全模式不在允許清單中。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 政策拒絕時，執行核准代理程式卻隱含地自動允許 Skills 的命令列介面。   |
| `policy/exec-approvals-allowlist-missing`                | 核准允許清單缺少政策要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 核准允許清單包含政策未預期的模式。                |
| `policy/tools-missing-risk-level`                        | 受治理的工具宣告缺少風險中繼資料。                             |
| `policy/tools-unknown-risk-level`                        | 受治理的工具宣告使用了未知的風險值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具宣告缺少敏感度中繼資料。                      |
| `policy/tools-missing-owner`                             | 受治理的工具宣告缺少擁有者中繼資料。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具宣告使用了未知的敏感度值。                    |

發現項目可以同時包含 `target`（觀察到的不符合規範的工作區項目）與 `requirement`（造成此發現項目的已編寫規則）。目前兩者都是 `oc://` 位址字串，但欄位名稱描述的是政策角色，而非位址格式。

發現項目範例：

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "頻道 'telegram' 使用遭拒絕的供應商 'telegram'。",
  "source": "policy",
  "path": "openclaw config",
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
  "message": "MCP 伺服器 'remote' 不在政策允許清單中。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "模型參照 'anthropic/claude-sonnet-4.7' 使用未核准的供應商 'anthropic'。",
  "source": "policy",
  "path": "openclaw config",
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
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "閘道繫結設定 'gateway-bind' 允許非迴路位址暴露。",
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
  "message": "閘道節點命令 'system.run' 已被政策拒絕，但未被 OpenClaw 設定拒絕。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "將 'system.run' 新增至 gateway.nodes.denyCommands，或在審查後更新政策。"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "政策不允許 agents.defaults 沙箱 workspaceAccess 使用 'rw'。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修復

`doctor --lint` 和 `policy check` 都是唯讀的。

只有在明確啟用 `workspaceRepairs` 時，`doctor --fix` 才會編輯由政策管理的工作區設定；否則，檢查只會報告其預計修復的內容，並保持設定不變。

在此版本中，修復功能可停用遭 `channels.denyRules` 拒絕的頻道，並套用下列自動縮限修復。請僅在審查政策檔案後才啟用 `workspaceRepairs`，因為有效的規則可能會變更工作區設定：

- 當全域政策禁止提升權限的工具時，設定 `tools.elevated.enabled=false`
- 當政策要求拒絕這些工具時，將缺少且必須拒絕的工具 ID 新增至 `tools.deny` 或
  `agents.list[].tools.deny`
- 將不安全的 `gateway.controlUi.*` 開關設定為 `false`
- 當政策拒絕遠端閘道模式時，設定 `gateway.mode=local`
- 當政策拒絕閘道 HTTP API 端點時，將報告的
  `gateway.http.endpoints.*.enabled` 路徑設定為 `false`
- 當政策拒絕開放群組輸入時，將報告的頻道輸入 `groupPolicy` 路徑設定為
  `allowlist`
- 當政策要求群組提及時，將報告的頻道輸入 `requireMention` 路徑設定為
  `true`
- 當政策要求遮蔽記錄中的敏感資訊時，設定 `logging.redactSensitive=tools`
- 當政策拒絕擷取遙測內容時，設定 `diagnostics.otel.captureContent=false`；
  若遙測擷取設定採用物件形式，則設定
  `diagnostics.otel.captureContent.enabled=false`

限定範圍的提升權限工具修復僅供偵測。當發現項目報告的是共用記錄或遙測設定時，也會略過限定範圍的資料處理修復，因為變更共用設定會影響限定範圍政策目標以外的項目。

當發現項目報告繼承自根層級的 `tools.deny` 時，會略過限定範圍的必要拒絕修復，因為將必要工具新增至根層級設定會影響限定範圍政策目標以外的項目。代理程式本機的必要拒絕修復可以更新報告的 `agents.list[].tools.deny` 路徑。

當發現項目報告繼承自 `channels.defaults.*` 時，會略過限定範圍的頻道輸入修復，因為變更共用頻道預設值會影響限定範圍政策目標以外的項目。閘道 HTTP URL 擷取允許清單的發現項目仍須手動處理，因為自動修復無法選擇正確的端點 URL 允許清單值。

閘道繫結和節點命令的發現項目仍須經過審查。當
`policy/gateway-non-loopback-bind` 或 `policy/gateway-node-command-denied`
可對應至設定路徑時，`doctor --fix` 會將建議的 `gateway.bind` 或
`gateway.nodes.denyCommands` 變更報告為已略過的預覽指引。它不會套用變更，而且在操作人員審查並更新設定或政策之前，該發現項目不會計為已修復。

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

| 命令             | `0`                                                    | `1`                                                        | `2`                    |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| `policy check`   | 沒有達到門檻的發現項目。                               | 一或多個發現項目達到門檻。                                 | 引數或執行階段失敗。   |
| `policy compare` | 政策檔案至少與基準同樣嚴格。                           | 政策檔案無效、缺失，或比基準規則寬鬆。                     | 引數或執行階段失敗。   |
| `policy watch`   | 沒有發現項目，且已接受的雜湊為最新。                   | 存在發現項目，或已接受的證明已過期。                       | 引數或執行階段失敗。   |

## 相關內容

- [Doctor lint 模式](/zh-TW/cli/doctor#lint-mode)
- [路徑命令列介面](/zh-TW/cli/path)
